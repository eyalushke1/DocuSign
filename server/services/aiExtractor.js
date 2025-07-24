import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OCRService from './ocrService.js';
import dotenv from 'dotenv';
import CoFFieldValidator from '../utils/cofFieldValidator.js';

dotenv.config();

class AIExtractor {
  constructor() {
    // Check for valid API keys (not placeholders)
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    const googleKey = process.env.GOOGLE_GEMINI_API_KEY;
    
    const isValidAnthropicKey = anthropicKey && anthropicKey.startsWith('sk-ant-') && !anthropicKey.includes('placeholder');
    const isValidOpenaiKey = openaiKey && openaiKey.startsWith('sk-') && !openaiKey.includes('placeholder');
    const isValidGoogleKey = googleKey && googleKey.length > 10 && !googleKey.includes('placeholder');
    
    this.openai = isValidOpenaiKey ? new OpenAI({
      apiKey: openaiKey
    }) : null;
    
    this.anthropic = isValidAnthropicKey ? new Anthropic({
      apiKey: anthropicKey
    }) : null;

    this.google = isValidGoogleKey ? new GoogleGenerativeAI(googleKey) : null;
    
    // Initialize OCR service as fallback
    this.ocrService = new OCRService();

    this.isConfigured = !!(this.openai || this.anthropic || this.google);
    
    if (!this.isConfigured) {
      console.error('❌ ERROR: No valid AI API keys configured!');
      console.log('📋 To fix this:');
      console.log('1. Get an Anthropic API key from: https://console.anthropic.com/');
      console.log('2. Or get an OpenAI API key from: https://platform.openai.com/api-keys');
      console.log('3. Or get a Google Gemini API key from: https://makersuite.google.com/app/apikey');
      console.log('4. Add it to your .env file (remove any placeholder values)');
      console.log('5. Restart the server');
      console.log('📋 Note: OCR fallback is available even without API keys');
    } else {
      const activeServices = [];
      if (this.anthropic) activeServices.push('Anthropic Claude');
      if (this.openai) activeServices.push('OpenAI GPT-4');
      if (this.google) activeServices.push('Google Gemini');
      console.log(`✅ AI extraction ready with ${activeServices.join(', ')} + OCR fallback`);
    }
  }

  async extractDataFromText(text, fields, fileName, documentType = 'general', pdfPath = null) {
    console.log(`🤖 Starting AI extraction for ${fileName} (${documentType})`);
    
    // If no API keys are configured, try OCR directly
    if (!this.isConfigured && pdfPath) {
      console.log('🔍 No AI API keys configured, attempting OCR extraction...');
      return await this.extractWithOCR(pdfPath, fields, fileName, documentType);
    } else if (!this.isConfigured) {
      const errorMsg = 'AI extraction not available - no valid API keys configured and no PDF path for OCR.\n\n' +
        'To fix this:\n' +
        '1. Get an Anthropic API key from: https://console.anthropic.com/\n' +
        '2. Or get an OpenAI API key from: https://platform.openai.com/api-keys\n' +
        '3. Or get a Google Gemini API key from: https://makersuite.google.com/app/apikey\n' +
        '4. Add it to your .env file (replace any placeholder values)\n' +
        '5. Restart the server';
      throw new Error(errorMsg);
    }
    
    const fieldsString = fields.map(field => `- ${field.name}: ${field.description || 'Extract relevant value'}`).join('\n');
    
    // Enhanced prompts for specific document types
    const documentSpecificInstructions = {
      CoF: `
Additional CoF-specific extraction guidelines:
- REMARKS: Look for certificate status phrases like "DocuSign Certificate Complete", "Certificate of Fulfillment - Approved", "Final Certificate - Requirements Met", "DocuSign Completion Certificate", "Certificate of Delivery"
- POD: Extract Proof of Delivery numbers in format "POD-YYYY-###" (e.g., POD-2024-001, POD-2024-002)
- SFDC OPPORTUNITY LINK: Find Salesforce URLs containing "Z-" followed by numbers (e.g., https://salesforce.com/opportunity/Z-12345, https://company.salesforce.com/Z-67890)
- COMPANY NAME: Look for corporate names like "Corporation", "Solutions", "Enterprises", "Labs", "Inc", "LLC", "Ltd"
- OPPORTUNITY NAME: Extract deal titles containing keywords like "Enterprise Deal", "Software License", "Partnership", "Collaboration", "Funding Terms"
- PERIOD: Find time periods in formats like "Q1 2024", "2024", "2024-2026", "FY2024", quarterly or yearly references
- CURRENCY: Look for currency codes USD, EUR, GBP, or currency symbols $, €, £
- FLOOR AMOUNT MATCH: Extract large monetary values (typically 6+ digits) representing minimum thresholds
- ZCOMPUTE/ZSTORAGE DISCOUNT: Find percentage values (##%) associated with "ZCompute" or "ZStorage" services
- ZCOMPUTE: Extract numerical amounts related to ZCompute service allocations
- POC: Look for email addresses in format name@company.com or contact information
- COMMENT: Find project status phrases like "All requirements met", "Completed on schedule", "Milestone achieved", "Phase # complete"
- SIGNED DATE: Extract dates from DocuSign completion timestamps, signature dates, or document dates in YYYY-MM-DD format`,
      
      Invoice: `
Additional Invoice-specific extraction guidelines:
- Invoice numbers are typically at the top of the document
- Look for "Invoice Date", "Bill Date", or similar date references
- Total amounts are usually prominently displayed
- Tax amounts may be listed separately as VAT, GST, or Sales Tax
- Due dates often appear as "Due Date" or "Payment Due"`,
      
      Contract: `
Additional Contract-specific extraction guidelines:
- Contract numbers may be in headers or reference sections
- Effective dates are often mentioned as "Effective Date" or "Commencement Date"
- Parties are typically listed at the beginning of the contract
- Contract values may be mentioned as "Total Value" or "Contract Amount"
- Look for renewal clauses and governing law sections`
    };
    
    const prompt = `
You are an expert data extraction assistant specializing in ${documentType} documents. Extract specific information from the following PDF document text using advanced pattern recognition and contextual understanding.

Document name: ${fileName}
Document type: ${documentType}

Required fields to extract:
${fieldsString}

General Instructions:
1. Extract the exact values for each field from the document
2. If a field value is not found, return "N/A"
3. Return the data in valid JSON format only
4. Be precise and accurate
5. For dates, use YYYY-MM-DD format when possible
6. For monetary values, include currency if specified
7. Look for variations in field names and abbreviations
8. Consider context and document structure

${documentSpecificInstructions[documentType] || ''}

Document text:
${text}

Return only a JSON object with the field names as keys and extracted values as values.`;

    // Try each AI service in priority order: Claude -> OpenAI -> Google Gemini -> OCR
    const aiMethods = [
      { name: 'Claude (Anthropic)', service: 'anthropic' },
      { name: 'OpenAI GPT-4', service: 'openai' },
      { name: 'Google Gemini', service: 'google' }
    ];

    for (const method of aiMethods) {
      if (!this[method.service]) continue;
      
      try {
        console.log(`🤖 Attempting extraction with ${method.name}...`);
        let result = await this.callAIService(method.service, prompt);
        
        if (result) {
          return await this.processAIResult(result, fields, fileName, documentType, method.name);
        }
      } catch (error) {
        console.warn(`⚠️ ${method.name} failed: ${error.message}`);
        continue; // Try next AI service
      }
    }

    // If all AI services failed, try OCR as final fallback
    if (pdfPath) {
      console.log('🔍 All AI services failed, attempting OCR extraction as final fallback...');
      return await this.extractWithOCR(pdfPath, fields, fileName, documentType);
    }

    // If we get here, everything failed
    throw new Error('All AI extraction methods failed and no PDF path available for OCR fallback');
  }

  async callAIService(service, prompt) {
    try {
      let result;

      if (service === 'anthropic' && this.anthropic) {
        const response = await this.anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4000,
          temperature: 0.1,
          messages: [{
            role: 'user',
            content: prompt
          }]
        });
        result = response.content[0].text;
      } else if (service === 'openai' && this.openai) {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [{
            role: 'system',
            content: 'You are an expert data extraction assistant. Return only valid JSON.'
          }, {
            role: 'user',
            content: prompt
          }],
          temperature: 0.1,
          max_tokens: 4000
        });
        result = response.choices[0].message.content;
      } else if (service === 'google' && this.google) {
        const model = this.google.getGenerativeModel({ model: "gemini-1.5-pro" });
        const response = await model.generateContent(prompt);
        result = response.response.text();
      }

      return result;
    } catch (error) {
      console.error(`Error calling ${service}:`, error.message);
      throw error;
    }
  }

  async processAIResult(result, fields, fileName, documentType, aiServiceName) {
    try {

      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const extractedData = JSON.parse(jsonMatch[0]);
        
        // Ensure all required fields are present and validate CoF-specific fields
        const processedData = {};
        fields.forEach(field => {
          let value = extractedData[field.name] || 'N/A';
          
          // Apply CoF-specific validation if document type is CoF
          if (documentType === 'CoF') {
            value = CoFFieldValidator.validateField(field.name, value, result);
          }
          
          processedData[field.name] = value;
        });
        
        console.log(`✅ Successfully extracted data using ${aiServiceName}`);
        return {
          success: true,
          data: processedData,
          fileName: fileName,
          method: aiServiceName
        };
      } else {
        throw new Error(`No valid JSON found in ${aiServiceName} response`);
      }
      
    } catch (error) {
      console.error(`${aiServiceName} processing error:`, error);
      throw error;
    }
  }

  async extractWithOCR(pdfPath, fields, fileName, documentType) {
    try {
      console.log(`🔍 Starting OCR extraction for ${fileName}...`);
      
      const ocrResult = await this.ocrService.extractTextFromPDF(pdfPath);
      
      if (!ocrResult.success || !ocrResult.text) {
        throw new Error(ocrResult.error || 'OCR failed to extract text');
      }

      console.log(`✅ OCR extracted ${ocrResult.text.length} characters from ${ocrResult.pagesProcessed} pages`);

      // Use simple pattern matching for OCR results since we don't have AI
      const extractedData = {};
      fields.forEach(field => {
        extractedData[field.name] = this.extractFieldWithPatterns(field, ocrResult.text);
      });

      return {
        success: true,
        data: extractedData,
        fileName: fileName,
        method: 'OCR',
        pagesProcessed: ocrResult.pagesProcessed
      };

    } catch (error) {
      console.error('❌ OCR extraction failed:', error);
      
      // Return default structure with N/A values
      const defaultData = {};
      fields.forEach(field => {
        defaultData[field.name] = 'N/A';
      });
      
      return {
        success: false,
        error: `OCR extraction failed: ${error.message}`,
        data: defaultData,
        fileName: fileName,
        method: 'OCR'
      };
    }
  }

  extractFieldWithPatterns(field, text) {
    const fieldName = field.name.toLowerCase();
    const description = (field.description || '').toLowerCase();
    
    // Common patterns for different field types
    const patterns = {
      date: /(\d{4}[-\/]\d{1,2}[-\/]\d{1,2}|\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/g,
      amount: /[\$€£]?\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g,
      email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      phone: /(?:\+\d{1,3}\s?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
      invoice: /inv[oice]*\s*#?\s*(\w+)/gi,
      number: /\d+/g
    };

    // Try to match field-specific patterns
    if (fieldName.includes('date') || description.includes('date')) {
      const matches = text.match(patterns.date);
      return matches ? matches[0] : 'N/A';
    }
    
    if (fieldName.includes('amount') || fieldName.includes('total') || description.includes('amount') || description.includes('total')) {
      const matches = text.match(patterns.amount);
      return matches ? matches[0] : 'N/A';
    }
    
    if (fieldName.includes('email') || description.includes('email')) {
      const matches = text.match(patterns.email);
      return matches ? matches[0] : 'N/A';
    }
    
    if (fieldName.includes('phone') || description.includes('phone')) {
      const matches = text.match(patterns.phone);
      return matches ? matches[0] : 'N/A';
    }
    
    if (fieldName.includes('invoice') || description.includes('invoice')) {
      const matches = text.match(patterns.invoice);
      return matches ? matches[1] : 'N/A';
    }

    // For other fields, try to find text near the field name
    const fieldRegex = new RegExp(`${fieldName}[:\\s]*([^\\n\\r]{1,100})`, 'gi');
    const match = text.match(fieldRegex);
    if (match) {
      return match[0].replace(new RegExp(fieldName, 'gi'), '').replace(/[:]\s*/, '').trim();
    }

    return 'N/A';
  }

  // Handle errors and return default structure
  handleExtractionError(error, fields, fileName) {
    console.error('Extraction error:', error);
    
    // Provide specific error messages for common authentication issues
    let errorMessage = error.message;
    if (error.message.includes('authentication_error') || error.message.includes('invalid x-api-key')) {
      errorMessage = 'Invalid API key. Please check your API keys in the .env file.\n\n' +
        'To fix:\n' +
        '1. Visit https://console.anthropic.com/ or https://platform.openai.com/api-keys or https://makersuite.google.com/app/apikey\n' +
        '2. Generate a new API key\n' +
        '3. Update the appropriate API key in your .env file\n' +
        '4. Restart the server';
    } else if (error.message.includes('401')) {
      errorMessage = 'API authentication failed. Please verify your API keys in the .env file and restart the server.';
    }
    
    // Return default structure with N/A values
    const defaultData = {};
    fields.forEach(field => {
      defaultData[field.name] = 'N/A';
    });
    
    return {
      success: false,
      error: errorMessage,
      data: defaultData,
      fileName: fileName
    };
  }

  async batchExtract(documents, fields, documentType = 'general') {
    const results = [];
    
    for (const doc of documents) {
      try {
        const result = await this.extractDataFromText(
          doc.text, 
          fields, 
          doc.fileName, 
          documentType, 
          doc.pdfPath // Pass PDF path for OCR fallback
        );
        results.push(result);
        
        // Small delay to respect API rate limits
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Error processing ${doc.fileName}:`, error);
        results.push(this.handleExtractionError(error, fields, doc.fileName));
      }
    }
    
    return results;
  }

  getAvailableModels() {
    const models = [];
    
    if (this.anthropic) {
      models.push({
        provider: 'Anthropic',
        model: 'claude-3-5-sonnet-20241022',
        description: 'Best for document analysis and structured data extraction',
        priority: 1
      });
    }
    
    if (this.openai) {
      models.push({
        provider: 'OpenAI',
        model: 'gpt-4-turbo-preview',
        description: 'Versatile language model for data extraction',
        priority: 2
      });
    }
    
    if (this.google) {
      models.push({
        provider: 'Google',
        model: 'gemini-1.5-pro',
        description: 'Advanced multimodal AI for complex document understanding',
        priority: 3
      });
    }
    
    // OCR is always available as fallback
    models.push({
      provider: 'Tesseract OCR',
      model: 'tesseract.js',
      description: 'Optical Character Recognition fallback for image-based PDFs',
      priority: 4
    });
    
    return models;
  }
}

export default AIExtractor;