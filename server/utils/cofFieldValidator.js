/**
 * CoF Field Validation and Pattern Matching Utilities
 */

export class CoFFieldValidator {
  
  static patterns = {
    pod: /POD-\d{4}-\d{3}/g,
    sfdcLink: /https?:\/\/[^\/]*salesforce[^\/]*\/.*Z-\d+/gi,
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    currency: /\b(USD|EUR|GBP|CAD|AUD)\b|\$|€|£|¥/gi,
    percentage: /\d+(\.\d+)?%/g,
    amount: /[\$€£¥]?[\d,]+\.?\d*/g,
    date: /\d{4}-\d{2}-\d{2}/g,
    quarter: /Q[1-4]\s+\d{4}/gi,
    fiscalYear: /FY\d{4}/gi,
    year: /\b20\d{2}\b/g,
    certificate: /certificate|completion|fulfillment|delivery/gi,
    companyName: /(corporation|corp|solutions|enterprises|labs|inc|llc|ltd|co\.?)\b/gi
  };

  static certificateRemarks = [
    'DocuSign Certificate Complete',
    'Certificate of Fulfillment - Approved', 
    'Final Certificate - Requirements Met',
    'DocuSign Completion Certificate',
    'Certificate of Delivery'
  ];

  static statusComments = [
    'All requirements met',
    'Completed on schedule', 
    'Milestone achieved',
    'Phase complete',
    'Successfully completed',
    'Requirements fulfilled'
  ];

  /**
   * Validate and enhance extracted field values
   */
  static validateField(fieldName, value, originalText) {
    if (!value || value === 'N/A') {
      return this.extractFieldFromText(fieldName, originalText);
    }
    
    switch (fieldName) {
      case 'pod':
        return this.validatePOD(value, originalText);
      case 'sfdc_opportunity_link_z':
        return this.validateSFDCLink(value, originalText);
      case 'poc':
        return this.validateEmail(value, originalText);
      case 'currency':
        return this.validateCurrency(value, originalText);
      case 'signed_date_formatted':
        return this.validateDate(value, originalText);
      case 'zcompute_discount_match':
      case 'zstorage_discount_match':
        return this.validatePercentage(value, originalText);
      case 'floor_amount_match':
      case 'zcompute':
        return this.validateAmount(value, originalText);
      default:
        return value;
    }
  }

  static validatePOD(value, text) {
    const matches = text.match(this.patterns.pod);
    return matches ? matches[0] : value;
  }

  static validateSFDCLink(value, text) {
    const matches = text.match(this.patterns.sfdcLink);
    return matches ? matches[0] : value;
  }

  static validateEmail(value, text) {
    const matches = text.match(this.patterns.email);
    return matches ? matches[0] : value;
  }

  static validateCurrency(value, text) {
    const matches = text.match(this.patterns.currency);
    if (matches) {
      const currency = matches.find(m => /^[A-Z]{3}$/.test(m));
      return currency || 'USD';
    }
    return value;
  }

  static validateDate(value, text) {
    // First try to find YYYY-MM-DD format
    const isoMatches = text.match(this.patterns.date);
    if (isoMatches) return isoMatches[0];
    
    // Try to parse other date formats and convert
    const dateRegex = /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/g;
    const dateMatches = text.match(dateRegex);
    if (dateMatches) {
      try {
        const date = new Date(dateMatches[0]);
        return date.toISOString().split('T')[0];
      } catch (e) {
        return value;
      }
    }
    
    return value;
  }

  static validatePercentage(value, text) {
    const matches = text.match(this.patterns.percentage);
    return matches ? matches[0] : value;
  }

  static validateAmount(value, text) {
    const matches = text.match(this.patterns.amount);
    if (matches) {
      // Find the largest amount (likely the floor amount)
      const amounts = matches.map(m => {
        const num = parseFloat(m.replace(/[\$€£¥,]/g, ''));
        return { original: m, value: num };
      }).filter(a => !isNaN(a.value));
      
      if (amounts.length > 0) {
        const largest = amounts.reduce((max, curr) => 
          curr.value > max.value ? curr : max
        );
        return largest.value.toString();
      }
    }
    return value;
  }

  /**
   * Extract field value from text if not found by AI
   */
  static extractFieldFromText(fieldName, text) {
    switch (fieldName) {
      case 'remarks':
        return this.findCertificateRemarks(text);
      case 'pod':
        const podMatch = text.match(this.patterns.pod);
        return podMatch ? podMatch[0] : 'N/A';
      case 'sfdc_opportunity_link_z':
        const sfdcMatch = text.match(this.patterns.sfdcLink);
        return sfdcMatch ? sfdcMatch[0] : 'N/A';
      case 'poc':
        const emailMatch = text.match(this.patterns.email);
        return emailMatch ? emailMatch[0] : 'N/A';
      case 'comment':
        return this.findStatusComment(text);
      default:
        return 'N/A';
    }
  }

  static findCertificateRemarks(text) {
    for (const remark of this.certificateRemarks) {
      if (text.toLowerCase().includes(remark.toLowerCase())) {
        return remark;
      }
    }
    
    // Look for any text with "certificate"
    const certMatch = text.match(/[^.]*certificate[^.]*/gi);
    return certMatch ? certMatch[0].trim() : 'N/A';
  }

  static findStatusComment(text) {
    for (const comment of this.statusComments) {
      if (text.toLowerCase().includes(comment.toLowerCase())) {
        return comment;
      }
    }
    
    // Look for phrases ending with "completed", "met", "achieved"
    const statusMatch = text.match(/[^.]*(?:completed|met|achieved)[^.]*/gi);
    return statusMatch ? statusMatch[0].trim() : 'N/A';
  }
}

export default CoFFieldValidator;