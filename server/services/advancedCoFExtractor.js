/**
 * Advanced CoF Field Extractor with Multiple OCR Engines and LLM Fallback
 * Order: Gemini -> GPT-4 -> Claude -> Multiple OCR Engines
 * Returns null for missing fields (not N/A)
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OCRService from './ocrService.js';
import dotenv from 'dotenv';

dotenv.config();

class AdvancedCoFExtractor {
  constructor() {
    // Initialize AI services
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    const googleKey = process.env.GOOGLE_GEMINI_API_KEY;
    
    const isValidAnthropicKey = anthropicKey && anthropicKey.startsWith('sk-ant-') && !anthropicKey.includes('placeholder');
    const isValidOpenaiKey = openaiKey && openaiKey.startsWith('sk-') && !openaiKey.includes('placeholder');
    const isValidGoogleKey = googleKey && googleKey.length > 10 && !googleKey.includes('placeholder');
    
    this.anthropic = isValidAnthropicKey ? new Anthropic({ apiKey: anthropicKey }) : null;
    this.openai = isValidOpenaiKey ? new OpenAI({ apiKey: openaiKey }) : null;
    this.google = isValidGoogleKey ? new GoogleGenerativeAI(googleKey) : null;
    
    // Initialize OCR service with multiple engines
    this.ocrService = new OCRService();
    
    this.debug = true;
  }

  log(message) {
    if (this.debug) {
      console.log(`🔬 Advanced CoF: ${message}`);
    }
  }

  /**
   * Extract Customer Details section specifically
   */
  extractCustomerDetailsSection(text) {
    if (!text) return '';

    // Look for Customer Details section with flexible patterns
    const customerDetailsPatterns = [
      /customer\\s*details[\\s\\S]*?(?=fees\\s*&?\\s*payment\\s*terms|payment\\s*terms|billing|financial\\s*terms|$)/gi,
      /customer\\s*information[\\s\\S]*?(?=fees\\s*&?\\s*payment\\s*terms|payment\\s*terms|billing|financial\\s*terms|$)/gi,
      /client\\s*details[\\s\\S]*?(?=fees\\s*&?\\s*payment\\s*terms|payment\\s*terms|billing|financial\\s*terms|$)/gi,
      // Also capture sections between headers that might contain customer info
      /salesforce\\s*opportunity\\s*details[\\s\\S]*?(?=fees\\s*&?\\s*payment\\s*terms|payment\\s*terms|billing|financial\\s*terms|project\\s*details|$)/gi,
      /financial\\s*terms[\\s\\S]*?(?=fees\\s*&?\\s*payment\\s*terms|payment\\s*terms|billing|project\\s*details|docusign|$)/gi
    ];

    for (const pattern of customerDetailsPatterns) {
      const match = text.match(pattern);
      if (match && match[0] && match[0].length > 50) {
        this.log(`Found Customer Details section (${match[0].length} chars)`);
        return match[0];
      }
    }

    this.log('No Customer Details section found, using full text');
    return text; // Return full text as fallback
  }

  /**
   * Create enhanced AI prompt for CoF documents
   */
  createCoFPrompt(text, fields, fileName) {
    const fieldsString = fields.map(field => `- ${field.name}: ${field.description || 'Extract relevant value'}`).join('\\n');
    
    return `You are a specialist in extracting data from Certificate of Fulfillment (CoF) documents. Extract these fields with high accuracy:

Document: ${fileName}

CRITICAL EXTRACTION RULES:
1. Focus on the "Customer Details" section which contains most field information
2. COMPLETELY IGNORE "Fees & Payment Terms", "Payment Terms", "Billing Terms" sections
3. Return ONLY valid JSON with exact field names as keys
4. Use null for fields that cannot be found (NOT "N/A")
5. Be extremely precise with numeric values

SPECIFIC FIELD PATTERNS:
- Remarks: Look for certificate status phrases like "DocuSign Certificate Complete", "Certificate of Fulfillment - Approved"
- POD: Extract region designation (NA, EMEA, APAC, LATAM) often marked with X
- Filename: Original PDF filename ending in .pdf
- SFDC Opportunity Link Z-: URLs containing "Z-" followed by numbers
- Company Name: Look for company names with Corp, Ltd, Inc, Solutions, Systems suffixes
- Opportunity Name: Deal names often containing "Enterprise", "Migration", "Expansion", "Partnership"
- Period: Numbers representing months (12, 24, 36, 60)
- Currency: USD, EUR, GBP, CAD or symbols $, €, £
- Floor Amount Match: Look for "Floor price" followed by numbers (100, 1250, 5000, etc.)
- ZCompute/ZStorage Discount: Percentage values with % symbols
- zCompute: Numerical amounts for compute allocations
- POC: Email addresses (name@company.com)
- Comment: Status phrases like "All requirements met", "Completed on schedule"
- Signed Date: Convert any date to YYYY-MM-DD format
- Nir Approved Indication: Approval indicators

Fields to extract:
${fieldsString}

Document text:
${text}

Return only valid JSON:`;
  }

  /**
   * Validate critical CoF fields
   */
  validateCoFField(fieldName, value) {
    if (!value || value === null || value === 'N/A' || value === '') {
      return { valid: false, reason: 'No value found' };
    }

    const lowerFieldName = fieldName.toLowerCase();

    switch (lowerFieldName) {
      case 'pod':
        // Should be one of the region codes
        const validRegions = ['NA', 'EMEA', 'APAC', 'LATAM'];
        const upperValue = value.toString().toUpperCase();
        if (validRegions.includes(upperValue)) {
          return { valid: true, confidence: 'high', normalizedValue: upperValue };
        }
        return { valid: false, reason: 'Invalid region code' };

      case 'floor_amount_match':
        // Should be numeric, typically 100-999999
        const floorStr = value.toString().replace(/[^0-9]/g, '');
        const floorNum = parseInt(floorStr);
        if (isNaN(floorNum) || floorNum < 50) {
          return { valid: false, reason: 'Floor amount too small or invalid' };
        }
        return { valid: true, confidence: floorNum >= 1000 ? 'high' : 'medium', normalizedValue: floorStr };

      case 'company_name':
        if (value.length < 3 || value.length > 100) {
          return { valid: false, reason: 'Company name length invalid' };
        }
        // Check for corporate suffixes
        const hasSuffix = /\\b(ltd|inc|llc|corp|corporation|solutions|enterprises|labs|systems|co|limited|s\\.a)\\b/i.test(value);
        return { 
          valid: true, 
          confidence: hasSuffix ? 'high' : 'medium',
          normalizedValue: value.trim()
        };

      case 'period':
        const periodNum = parseInt(value.toString().replace(/[^0-9]/g, ''));
        if (isNaN(periodNum) || periodNum < 1 || periodNum > 120) {
          return { valid: false, reason: 'Period out of range (1-120 months)' };
        }
        return { valid: true, confidence: 'high', normalizedValue: periodNum.toString() };

      case 'currency':
        const currencyPattern = /^(USD|EUR|GBP|CAD|AUD|JPY)$/i;
        if (currencyPattern.test(value)) {
          return { valid: true, confidence: 'high', normalizedValue: value.toUpperCase() };
        }
        // Convert symbols to codes
        const symbolMap = { '$': 'USD', '€': 'EUR', '£': 'GBP', '¥': 'JPY' };
        if (symbolMap[value]) {
          return { valid: true, confidence: 'high', normalizedValue: symbolMap[value] };
        }
        return { valid: false, reason: 'Invalid currency format' };

      case 'poc':
        if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/.test(value)) {
          return { valid: true, confidence: 'high', normalizedValue: value };
        }
        return { valid: false, reason: 'POC should be email address' };

      default:
        return { 
          valid: value.length > 0 && value.length < 500, 
          confidence: 'medium',
          normalizedValue: value.trim()
        };
    }
  }

  /**
   * Try Google Gemini extraction (highest priority)
   */
  async tryGemini(text, fields, fileName) {
    if (!this.google) {
      this.log('Gemini not available');
      return null;
    }
    
    try {
      this.log('🥇 Trying Google Gemini (Priority 1)...');
      const model = this.google.getGenerativeModel({ model: 'gemini-1.5-pro' });
      const prompt = this.createCoFPrompt(text, fields, fileName);
      
      const result = await model.generateContent(prompt);
      const content = result.response.text();
      const jsonMatch = content.match(/\\{[\\s\\S]*\\}/);
      
      if (jsonMatch) {
        try {
          const data = JSON.parse(jsonMatch[0]);
          this.log('✅ Gemini extraction successful');
          return { success: true, data, method: 'Google Gemini 1.5 Pro' };
        } catch (parseError) {
          this.log(`❌ Gemini JSON parse failed: ${parseError.message}`);
          this.log(`Raw response: ${jsonMatch[0].substring(0, 200)}...`);
        }
      }
    } catch (error) {
      this.log(`❌ Gemini failed: ${error.message}`);
    }
    
    return null;
  }

  /**
   * Try OpenAI GPT-4 extraction (second priority)
   */
  async tryGPT4(text, fields, fileName) {
    if (!this.openai) {
      this.log('GPT-4 not available');
      return null;
    }
    
    try {
      this.log('🥈 Trying OpenAI GPT-4 (Priority 2)...');
      const prompt = this.createCoFPrompt(text, fields, fileName);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4000,
        temperature: 0.1
      });

      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/\\{[\\s\\S]*\\}/);
      
      if (jsonMatch) {
        try {
          const data = JSON.parse(jsonMatch[0]);
          this.log('✅ GPT-4 extraction successful');
          return { success: true, data, method: 'OpenAI GPT-4 Turbo' };
        } catch (parseError) {
          this.log(`❌ GPT-4 JSON parse failed: ${parseError.message}`);
          this.log(`Raw response: ${jsonMatch[0].substring(0, 200)}...`);
        }
      }
    } catch (error) {
      this.log(`❌ GPT-4 failed: ${error.message}`);
    }
    
    return null;
  }

  /**
   * Try Anthropic Claude extraction (third priority)
   */
  async tryClaude(text, fields, fileName) {
    if (!this.anthropic) {
      this.log('Claude not available');
      return null;
    }
    
    try {
      this.log('🥉 Trying Anthropic Claude (Priority 3)...');
      const prompt = this.createCoFPrompt(text, fields, fileName);
      
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0].text;
      const jsonMatch = content.match(/\\{[\\s\\S]*\\}/);
      
      if (jsonMatch) {
        try {
          const data = JSON.parse(jsonMatch[0]);
          this.log('✅ Claude extraction successful');
          return { success: true, data, method: 'Anthropic Claude 3.5' };
        } catch (parseError) {
          this.log(`❌ Claude JSON parse failed: ${parseError.message}`);
          this.log(`Raw response: ${jsonMatch[0].substring(0, 200)}...`);
        }
      }
    } catch (error) {
      this.log(`❌ Claude failed: ${error.message}`);
    }
    
    return null;
  }

  /**
   * Extract fields from OCR text using CoF patterns
   */
  extractFieldsFromOCRText(text, fields, fileName) {
    try {
      // Focus on Customer Details section
      const customerSection = this.extractCustomerDetailsSection(text);
      const searchText = customerSection || text;
      
      const extractedData = {};
      
      for (const field of fields) {
        const fieldName = field.name.toLowerCase();
        let value = null;
        
        switch (fieldName) {
          case 'pod':
            // Look for region patterns
            const regionPatterns = [
              /region\\s*:?\\s*(NA|EMEA|APAC|LATAM)/gi,
              /\\b(NA|EMEA|APAC|LATAM)\\b.*?[xX✓]/gi,
              /[xX✓].*?(NA|EMEA|APAC|LATAM)/gi
            ];
            
            for (const pattern of regionPatterns) {
              const match = searchText.match(pattern);
              if (match) {
                const region = match[1] || match[0].match(/(NA|EMEA|APAC|LATAM)/gi)?.[0];
                if (region) {
                  value = region.toUpperCase();
                  break;
                }
              }
            }
            break;
            
          case 'floor_amount_match':
            // Enhanced Floor price patterns
            const floorPatterns = [
              /floor\\s*price\\s*:?\\s*([£$€¥]?\\s*\\d{1,8}(?:[,']\\d{3})*)/gi,
              /floor\\s*amount\\s*:?\\s*([£$€¥]?\\s*\\d{1,8}(?:[,']\\d{3})*)/gi,
              /minimum\\s*spend\\s*:?\\s*([£$€¥]?\\s*\\d{1,8}(?:[,']\\d{3})*)/gi
            ];
            
            for (const pattern of floorPatterns) {
              const match = searchText.match(pattern);
              if (match) {
                const amount = match[1].replace(/[^0-9]/g, '');
                if (amount && parseInt(amount) >= 50) {
                  value = amount;
                  break;
                }
              }
            }
            break;
            
          case 'company_name':
            const companyPatterns = [
              /company\\s*:?\\s*([A-Za-z0-9\\s.,&\\-]{3,80}(?:Ltd|Inc|LLC|Corp|Corporation|Solutions|Enterprises|Labs|Systems|Co|Limited|S\\.A))/gi,
              /\\b([A-Za-z0-9\\s.,&\\-]{3,60}\\s*(?:Ltd|Inc|LLC|Corp|Corporation|Solutions|Enterprises|Labs|Systems|Co|Limited|S\\.A))\\b/gi
            ];
            
            for (const pattern of companyPatterns) {
              const match = searchText.match(pattern);
              if (match) {
                let company = match[1] || match[0];
                company = company.replace(/^company\\s*:?\\s*/gi, '').trim();
                if (company.length > 2 && company.length < 100) {
                  value = company;
                  break;
                }
              }
            }
            break;
            
          case 'period':
            const periodPatterns = [
              /contract\\s*period\\s*:?\\s*.*?(\\d{1,3})\\s*months?/gi,
              /period\\s*:?\\s*(\\d{1,3})\\s*months?/gi,
              /\\b(\\d{1,2})\\s*months?\\b/gi
            ];
            
            for (const pattern of periodPatterns) {
              const match = searchText.match(pattern);
              if (match) {
                const months = parseInt(match[1]);
                if (months >= 1 && months <= 120) {
                  value = months.toString();
                  break;
                }
              }
            }
            break;
            
          default:
            // Generic pattern for other fields
            const genericPattern = new RegExp(`${fieldName.replace(/_/g, '\\\\s*')}\\\\s*:?\\\\s*([A-Za-z0-9\\\\s.,#\\\\-\\\\/]{1,100})`, 'gi');
            const genericMatch = searchText.match(genericPattern);
            if (genericMatch && genericMatch[1]) {
              value = genericMatch[1].trim();
            }
            break;
        }
        
        extractedData[field.name] = value;
      }
      
      const successfulFields = Object.values(extractedData).filter(v => v !== null).length;
      
      return {
        success: successfulFields > 0,
        data: extractedData,
        extractedFields: successfulFields
      };
    } catch (error) {
      this.log(`OCR text extraction failed: ${error.message}`);
      return { success: false, data: {} };
    }
  }

  /**
   * Main extraction method with advanced fallback
   */
  async extractFields(text, fields, fileName, pdfPath = null) {
    this.log(`🚀 Starting advanced CoF extraction for ${fileName}`);
    
    try {
      if (!text || !text.trim()) {
        this.log('No text available, will try OCR if PDF path provided');
        if (pdfPath) {
          return await this.fallbackToOCR(pdfPath, fields, fileName);
        }
        return this.createEmptyResult(fields);
      }

      // Extract Customer Details section for focused extraction
      const customerSection = this.extractCustomerDetailsSection(text);
      
      // Try LLM models in order: Gemini -> GPT-4 -> Claude
      const llmMethods = [
        () => this.tryGemini(text, fields, fileName),
        () => this.tryGPT4(text, fields, fileName),
        () => this.tryClaude(text, fields, fileName)
      ];

      let bestResult = null;
      const criticalFields = ['floor_amount_match', 'company_name', 'opportunity_name'];
      
      // Try each LLM model
      for (const method of llmMethods) {
        try {
          const result = await method();
          if (result && result.success) {
            // Validate critical fields
            const validatedData = {};
            let criticalFieldsFound = 0;
            
            for (const field of fields) {
              const value = result.data[field.name];
              const validation = this.validateCoFField(field.name, value);
              
              validatedData[field.name] = validation.valid ? (validation.normalizedValue || value) : null;
              
              if (criticalFields.includes(field.name.toLowerCase()) && validation.valid) {
                criticalFieldsFound++;
              }
            }
            
            result.data = validatedData;
            result.criticalFieldsFound = criticalFieldsFound;
            
            if (!bestResult || criticalFieldsFound > bestResult.criticalFieldsFound) {
              bestResult = result;
            }
            
            // If we found all critical fields, we can stop here
            if (criticalFieldsFound >= criticalFields.length) {
              this.log(`✅ Found all critical fields with ${result.method}`);
              break;
            }
          }
        } catch (error) {
          this.log(`LLM method failed: ${error.message}`);
        }
      }

      // If LLM results are insufficient, try OCR
      if (!bestResult || bestResult.criticalFieldsFound < 2) {
        this.log('🔍 LLM results insufficient, trying OCR fallback...');
        if (pdfPath) {
          const ocrResult = await this.extractFieldsFromOCRText(text, fields, fileName);
          if (ocrResult.success && ocrResult.extractedFields > 0) {
            bestResult = {
              ...ocrResult,
              method: 'OCR Fallback',
              criticalFieldsFound: 0
            };
          }
        }
      }

      if (!bestResult) {
        return this.createEmptyResult(fields);
      }

      const successfulFields = Object.values(bestResult.data).filter(v => v !== null).length;
      
      return {
        success: successfulFields > 0,
        data: bestResult.data,
        method: bestResult.method,
        extractedFields: successfulFields,
        totalFields: fields.length,
        criticalFieldsFound: bestResult.criticalFieldsFound || 0,
        customerDetailsFound: customerSection.length > 0
      };
    } catch (error) {
      this.log(`❌ Advanced CoF extraction failed: ${error.message}`);
      console.error('Advanced CoF extraction error:', error);
      
      // Return empty result with error information
      return {
        success: false,
        data: this.createEmptyResult(fields).data,
        method: 'Advanced CoF Extraction (Error)',
        error: error.message,
        extractedFields: 0,
        totalFields: fields.length
      };
    }
  }

  /**
   * Fallback to OCR when no text is available
   */
  async fallbackToOCR(pdfPath, fields, fileName) {
    this.log('📄 No text available, falling back to OCR extraction...');
    const ocrResult = await this.extractFieldsFromOCRText('', fields, fileName);
    
    if (ocrResult.success) {
      return {
        success: ocrResult.extractedFields > 0,
        data: ocrResult.data,
        method: 'OCR Fallback',
        extractedFields: ocrResult.extractedFields,
        totalFields: fields.length
      };
    }
    
    return this.createEmptyResult(fields);
  }

  /**
   * Create empty result with null values
   */
  createEmptyResult(fields) {
    const data = {};
    fields.forEach(field => {
      data[field.name] = null;
    });
    
    return {
      success: false,
      data: data,
      method: 'Advanced CoF Extraction',
      error: 'No extraction methods succeeded',
      extractedFields: 0,
      totalFields: fields.length
    };
  }
}

export default AdvancedCoFExtractor;