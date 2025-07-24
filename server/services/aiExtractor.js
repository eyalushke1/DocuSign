import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import CoFFieldValidator from '../utils/cofFieldValidator.js';

dotenv.config();

class AIExtractor {
  constructor() {
    // Check for valid API keys (not placeholders)
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    
    const isValidAnthropicKey = anthropicKey && anthropicKey.startsWith('sk-ant-') && !anthropicKey.includes('placeholder');
    const isValidOpenaiKey = openaiKey && openaiKey.startsWith('sk-') && !openaiKey.includes('placeholder');
    
    this.openai = isValidOpenaiKey ? new OpenAI({
      apiKey: openaiKey
    }) : null;
    
    this.anthropic = isValidAnthropicKey ? new Anthropic({
      apiKey: anthropicKey
    }) : null;

    this.isConfigured = !!(this.openai || this.anthropic);
    
    if (!this.isConfigured) {
      console.error('❌ ERROR: No valid AI API keys configured!');
      console.log('📋 To fix this:');
      console.log('1. Get an Anthropic API key from: https://console.anthropic.com/');
      console.log('2. Or get an OpenAI API key from: https://platform.openai.com/api-keys');
      console.log('3. Add it to your .env file (remove any placeholder values)');
      console.log('4. Restart the server');
    } else {
      const activeService = this.anthropic ? 'Anthropic Claude' : 'OpenAI GPT-4';
      console.log(`✅ AI extraction ready with ${activeService}`);
    }
  }

  async extractDataFromText(text, fields, fileName, documentType = 'general') {
    if (!this.isConfigured) {
      const errorMsg = 'AI extraction not available - no valid API keys configured.\n\n' +
        'To fix this:\n' +
        '1. Get an Anthropic API key from: https://console.anthropic.com/\n' +
        '2. Or get an OpenAI API key from: https://platform.openai.com/api-keys\n' +
        '3. Add it to your .env file (replace any placeholder values)\n' +
        '4. Restart the server';
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

    try {
      let result;
      
      if (this.anthropic) {
        // Use Claude (Anthropic) - generally better for document analysis
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
      } else if (this.openai) {
        // Fallback to OpenAI GPT-4
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
      }

      // Parse JSON response
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const extractedData = JSON.parse(jsonMatch[0]);
        
        // Ensure all required fields are present and validate CoF-specific fields
        const processedData = {};
        fields.forEach(field => {
          let value = extractedData[field.name] || 'N/A';
          
          // Apply CoF-specific validation if document type is CoF
          if (documentType === 'CoF') {
            value = CoFFieldValidator.validateField(field.name, value, text);
          }
          
          processedData[field.name] = value;
        });
        
        return {
          success: true,
          data: processedData,
          fileName: fileName
        };
      } else {
        throw new Error('No valid JSON found in AI response');
      }
      
    } catch (error) {
      console.error('AI extraction error:', error);
      
      // Provide specific error messages for common authentication issues
      let errorMessage = error.message;
      if (error.message.includes('authentication_error') || error.message.includes('invalid x-api-key')) {
        errorMessage = 'Invalid API key. Please check your ANTHROPIC_API_KEY in the .env file.\n\n' +
          'To fix:\n' +
          '1. Visit https://console.anthropic.com/\n' +
          '2. Generate a new API key\n' +
          '3. Update ANTHROPIC_API_KEY in your .env file\n' +
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
  }

  async batchExtract(documents, fields, documentType = 'general') {
    const results = [];
    
    for (const doc of documents) {
      try {
        const result = await this.extractDataFromText(doc.text, fields, doc.fileName, documentType);
        results.push(result);
        
        // Small delay to respect API rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error processing ${doc.fileName}:`, error);
        
        const defaultData = {};
        fields.forEach(field => {
          defaultData[field.name] = 'N/A';
        });
        
        results.push({
          success: false,
          error: error.message,
          data: defaultData,
          fileName: doc.fileName
        });
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
        description: 'Best for document analysis and structured data extraction'
      });
    }
    
    if (this.openai) {
      models.push({
        provider: 'OpenAI',
        model: 'gpt-4-turbo-preview',
        description: 'Versatile language model for data extraction'
      });
    }
    
    return models;
  }
}

export default AIExtractor;