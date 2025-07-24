# CoF (Certificate of Fulfillment) Field Detection Patterns

This document outlines the specific patterns and formats to look for when extracting data from Certificate of Fulfillment documents.

## Field Extraction Patterns

### 1. Remarks
**Patterns to look for:**
- "Contract Renewal"
- "One Time"
- "Expansion"
- "POC"
### - Any text containing "Certificate" + status words

### 2. POD (Region)
**Format:** `####`
**Examples:**
- NA
- EMEA
- APAC
- LATAM

### 3. Filename
**Patterns:**
- Usually ends with .pdf
- Common formats: Agreement_signed.pdf, Contract_executed.pdf, Master_Service_Agreement_2024.pdf,"SAMM TECNOLOGIA E TELECOMUNICAÇÕES S.A - Adendo Equip 03 (SAMM) assinatura.pdf"
- May contain underscores, hyphens, or spaces

### 4. SFDC Opportunity Link Z-
**Pattern:** URL containing "Z-" followed by numbers
**Examples:**
- ZDR-11385
- Z-118128
- https://salesforce.com/opportunity/Z-12345
- https://company.salesforce.com/Z-67890
- https://acmecorp.salesforce.com/lightning/r/Opportunity/Z-78901/view
- Any text containing "Created by DealHub [ZDR-" followed by numbers]" 

### 5. Company Name
**Indicators:**
- Any text containing "Full corporate name "
- Corporate suffixes: Corporation, Corp, Solutions, Enterprises, Labs, Inc, LLC, Ltd, Co
- Usually appears in headers or signature blocks
- Examples: "TechFlow Solutions Inc", "Acme Corporation", "Global Enterprises","Angola Cables, S.A","SAMM TECNOLOGIA E TELECOMUNICAÇÕES S.A",  "Harbor Solutions Ltd."

### 6. Opportunity Name
**Keywords to look for:**
- "Enterprise Deal"
- "Software License"
- "Partnership"
- "Collaboration"
- "Migration"
- "Funding Terms"
- Often includes time periods (Q1, Q2, 2024, etc.)
- May be labeled as "Subscription Period" 


### 7. Period
**Formats:11
- number: 12,24, 36
- May be labeled as "End User Details" 

### 8. Currency
**Formats:**
- Currency codes: USD, EUR, GBP, CAD, AUD
- Currency symbols: $, €, £, ¥
- Usually appears before monetary amounts

### 9. Floor Amount Match
**Characteristics:**
- Large monetary values (typically 6+ digits)
- Often preceded by currency symbol or code
- Examples: $850,000, 500000, €750,000, $125.00
- May include commas or periods as separators
- May appear as "Floor price
9000"
- May be labeled as "Floor price" 



### 10. ZCompute/ZStorage Discount Match
**Format:** Percentage values associated with service names
**Examples:**
- ZCompute Discount: 18%
- ZStorage Discount: 12%
- May appear as "ZCompute Discount Match: 15%"

### 11. zCompute
**Characteristics:**
- Numerical amounts related to compute services
- Examples: $320,000, 200000, €150,000
- May be labeled as "allocation", "amount", or "value"

### 12. POC (Point of Contact)
**Format:** Email addresses
**Pattern:** name@company.com
**Examples:**
- sarah.johnson@techflow.com
- john.doe@acme.com
- jane.smith@client.com

### 13. Comment
**Common phrases:**
- "All requirements met"
- "Completed on schedule"
- "Milestone achieved"
- "Phase [#] complete"
- "Successfully completed"
- "Requirements fulfilled"
- "This Order Form replaces the previous Order Form signed on 06/08/21"
- "Contrato de permuta totalizando R$ 621'000.00 a partir de Fevereiro de 2025 no ambiente administrado pela Audace. Caso haja consumo excedente será cobrado à parte conforme contrato de permuta datado de 04 de abril de 2025.  Exchange agreement totaling R$ 621'000.00 as of February 2025 in the environment managed by Audace. If there is excess consumption, it will be charged separately according to the exchange agreement dated April 4, 2025. "
- "OPaaS Same discount, Discount and billing structure to be the same as the last contract"

### 14. Signed Date Formatted
**Target format:** YYYY-MM-DD
**Source patterns:**
- DocuSign timestamps: 2024-06-15T14:23:45Z
- Date fields: June 15, 2024
- Short formats: 06/15/2024, 15/06/2024
- Always convert to YYYY-MM-DD format

### 15. Cloud Ind Confidence
**Common phrases:**
**Examples:**
- "On-Premises Only"
- "Zadara Hosted Cloud Only"
- May be labeled as "Zadara Services On"

## Document Structure Tips

CoF documents typically contain:
1. Header with certificate title
2. Document reference information
3. Salesforce opportunity details section
4. Financial terms section
5. Project details section
6. DocuSign completion section
7. Footer with completion confirmation

## Common Locations

- **Headers:** Company names, document titles
- **Reference sections:** POD numbers, filenames, SFDC links
- **Financial sections:** Currency, amounts, discounts
- **Contact sections:** Email addresses, POC information
- **Footer/Signature areas:** Dates, completion status