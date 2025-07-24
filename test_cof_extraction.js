import AIExtractor from './server/services/aiExtractor.js';
import fs from 'fs';

// Test CoF extraction with sample document
async function testCoFExtraction() {
  const aiExtractor = new AIExtractor();
  
  // Read sample document
  const sampleText = fs.readFileSync('./test/data/sample_cof_document.txt', 'utf8');
  
  // CoF fields
  const cofFields = [
    { name: 'remarks', displayName: 'Remarks', description: 'Certificate status remarks like "DocuSign Certificate Complete", "Certificate of Fulfillment - Approved", "Final Certificate - Requirements Met"' },
    { name: 'pod', displayName: 'POD', description: 'Proof of Delivery reference number in format POD-YYYY-### (e.g., POD-2024-001)' },
    { name: 'filename', displayName: 'Filename', description: 'Original PDF filename like Agreement_signed.pdf, Contract_executed.pdf' },
    { name: 'sfdc_opportunity_link_z', displayName: 'SFDC Opportunity Link Z-', description: 'Salesforce opportunity URL containing "Z-" followed by numbers (e.g., https://salesforce.com/opportunity/Z-12345)' },
    { name: 'company_name', displayName: 'Company Name', description: 'Client company name such as "Acme Corporation", "TechCorp Solutions", "Global Enterprises"' },
    { name: 'opportunity_name', displayName: 'Opportunity Name', description: 'Deal or opportunity title like "Q1 2024 Enterprise Deal", "Annual Software License", "Multi-year Partnership"' },
    { name: 'period', displayName: 'Period', description: 'Contract period like "Q1 2024", "2024", "2024-2026", "FY2024"' },
    { name: 'currency', displayName: 'Currency', description: 'Currency code (USD, EUR, GBP) for monetary amounts' },
    { name: 'floor_amount_match', displayName: 'Floor Amount Match', description: 'Minimum contract value threshold (e.g., 500000, 250000, 1000000)' },
    { name: 'zcompute_discount_match', displayName: 'ZCompute Discount % Match', description: 'ZCompute service discount percentage (e.g., 15%, 20%, 12%)' },
    { name: 'zstorage_discount_match', displayName: 'ZStorage Discount % Match', description: 'ZStorage service discount percentage (e.g., 10%, 15%, 8%)' },
    { name: 'zcompute', displayName: 'zCompute', description: 'ZCompute service amount or allocation (e.g., 200000, 150000, 400000)' },
    { name: 'poc', displayName: 'POC', description: 'Point of contact email address (e.g., john.doe@company.com, jane.smith@client.com)' },
    { name: 'comment', displayName: 'Comment', description: 'Project status comments like "All requirements met", "Completed on schedule", "Milestone achieved"' },
    { name: 'signed_date_formatted', displayName: 'Signed Date Formatted', description: 'Document signature date in YYYY-MM-DD format (e.g., 2024-01-15, 2024-02-20)' }
  ];
  
  try {
    console.log('🧪 Testing CoF extraction...');
    console.log('📄 Sample document text:');
    console.log(sampleText.substring(0, 200) + '...');
    console.log('\n🔍 Extracting data...');
    
    const result = await aiExtractor.extractDataFromText(
      sampleText, 
      cofFields, 
      'sample_cof_document.txt', 
      'CoF'
    );
    
    console.log('\n✅ Extraction Result:');
    console.log('Success:', result.success);
    console.log('Data:');
    Object.entries(result.data).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    
  } catch (error) {
    console.error('❌ Extraction failed:', error.message);
  }
}

// Only run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testCoFExtraction();
}