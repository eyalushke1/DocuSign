# Enhanced CoF (Certificate of Fulfillment) Detection

## Overview
The PDF data extraction system has been significantly enhanced for Certificate of Fulfillment documents based on analysis of typical CoF patterns and field structures.

## What Was Enhanced

### 1. Field Descriptions (Enhanced in `App.jsx`)
Each CoF field now has specific, example-driven descriptions:

- **Remarks**: Looks for certificate status phrases like "DocuSign Certificate Complete"
- **POD**: Expects format POD-YYYY-### (e.g., POD-2024-001)
- **SFDC Link**: Finds Salesforce URLs with "Z-" pattern
- **Company Name**: Recognizes corporate suffixes (Corp, Inc, Solutions, etc.)
- **Opportunity Name**: Identifies deal titles with business keywords
- **Period**: Handles various time formats (Q1 2024, FY2024, 2024-2026)
- **Currency**: Detects currency codes (USD, EUR, GBP) and symbols
- **Financial Fields**: Extracts monetary amounts and percentages
- **POC**: Validates email address formats
- **Comments**: Finds project status phrases
- **Signed Date**: Converts various date formats to YYYY-MM-DD

### 2. AI Prompt Enhancement (Enhanced in `aiExtractor.js`)
Added comprehensive CoF-specific extraction guidelines:

```javascript
- REMARKS: Look for certificate status phrases
- POD: Extract Proof of Delivery numbers in format "POD-YYYY-###"
- SFDC OPPORTUNITY LINK: Find Salesforce URLs containing "Z-" followed by numbers
- COMPANY NAME: Look for corporate names with business suffixes
- OPPORTUNITY NAME: Extract deal titles with business keywords
- PERIOD: Find time periods in various formats
- CURRENCY: Look for currency codes and symbols
- FLOOR AMOUNT MATCH: Extract large monetary values (6+ digits)
- ZCOMPUTE/ZSTORAGE DISCOUNT: Find percentage values with service names
- POC: Look for email addresses in standard format
- COMMENT: Find project status phrases
- SIGNED DATE: Extract and format dates consistently
```

### 3. Field Validation System (New `cofFieldValidator.js`)
Created a comprehensive validation system with:

- **Regex Patterns**: For POD numbers, SFDC links, emails, currencies, dates
- **Field Validation**: Ensures extracted values match expected patterns
- **Fallback Extraction**: Re-extracts missing fields using pattern matching
- **Format Standardization**: Converts dates, currencies, and amounts to standard formats

### 4. Integration Layer
The validator is integrated into the AI extraction process to:
- Validate AI-extracted values against known patterns
- Re-extract missing fields using regex patterns
- Standardize formats (especially dates and currencies)
- Provide fallback values when AI extraction fails

## Test Files Created

### 1. `CoF_example_patterns.csv`
Contains realistic examples of CoF data showing typical patterns for each field.

### 2. `sample_cof_document.txt`
A realistic CoF document structure for testing extraction accuracy.

### 3. `CoF_field_patterns.md`
Comprehensive documentation of all field patterns and extraction guidelines.

### 4. `test_cof_extraction.js`
Test script to verify extraction accuracy with sample documents.

## How to Use Enhanced CoF Detection

1. **Select CoF Document Type**: Choose "CoF (Certificate of Fulfillment)" in the field group selector
2. **Scan PDFs**: The system will now use enhanced prompts and validation
3. **Review Results**: Extracted data will be more accurate and consistently formatted
4. **Export Data**: CSV files will be named with CoF prefix and date

## Field Accuracy Improvements

- **POD Numbers**: Now correctly identifies POD-YYYY-### format
- **SFDC Links**: Finds Salesforce URLs with Z- pattern even in complex URLs
- **Dates**: Converts various date formats to consistent YYYY-MM-DD
- **Currencies**: Properly identifies and standardizes currency codes
- **Email Addresses**: Validates and extracts contact information
- **Percentages**: Accurately finds discount percentages for ZCompute/ZStorage
- **Monetary Amounts**: Extracts and validates large financial figures

## Testing Your CoF Documents

To test the enhanced detection:

1. Place your CoF PDFs in a folder
2. Select the folder using the enhanced folder scanner
3. Choose "CoF" as the document type
4. Review the extracted data for accuracy
5. The system will now better recognize CoF-specific patterns

## API Configuration Required

For AI extraction to work, ensure you have configured at least one API key in your `.env` file:
- `ANTHROPIC_API_KEY` (recommended for document analysis)
- `OPENAI_API_KEY` (fallback option)

The system will automatically use the available AI service to process your documents with the enhanced CoF-specific prompts and validation.