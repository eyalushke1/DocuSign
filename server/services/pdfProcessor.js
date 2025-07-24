import pdfParse from 'pdf-parse';
import fs from 'fs-extra';
import path from 'path';

class PDFProcessor {
  constructor() {
    this.supportedFormats = ['.pdf'];
  }

  async processPDF(filePath) {
    try {
      if (!await fs.pathExists(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const fileName = path.basename(filePath);
      const fileExtension = path.extname(filePath).toLowerCase();

      if (!this.supportedFormats.includes(fileExtension)) {
        throw new Error(`Unsupported file format: ${fileExtension}`);
      }

      const dataBuffer = await fs.readFile(filePath);
      const pdfData = await pdfParse(dataBuffer);

      return {
        fileName: fileName,
        filePath: filePath,
        text: this.cleanText(pdfData.text),
        pages: pdfData.numpages,
        metadata: pdfData.metadata || {},
        success: true
      };

    } catch (error) {
      console.error(`Error processing PDF ${filePath}:`, error);
      return {
        fileName: path.basename(filePath),
        filePath: filePath,
        text: '',
        pages: 0,
        metadata: {},
        success: false,
        error: error.message
      };
    }
  }

  async processPDFBuffer(buffer, fileName) {
    try {
      const pdfData = await pdfParse(buffer);

      return {
        fileName: fileName,
        text: this.cleanText(pdfData.text),
        pages: pdfData.numpages,
        metadata: pdfData.metadata || {},
        success: true
      };

    } catch (error) {
      console.error(`Error processing PDF buffer for ${fileName}:`, error);
      return {
        fileName: fileName,
        text: '',
        pages: 0,
        metadata: {},
        success: false,
        error: error.message
      };
    }
  }

  async batchProcessPDFs(filePaths) {
    const results = [];
    
    for (const filePath of filePaths) {
      const result = await this.processPDF(filePath);
      results.push(result);
    }

    return results;
  }

  cleanText(text) {
    if (!text) return '';
    
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n\s*\n/g, '\n\n')
      .replace(/\s+/g, ' ')
      .trim();
  }

  validatePDF(filePath) {
    const extension = path.extname(filePath).toLowerCase();
    return this.supportedFormats.includes(extension);
  }

  async getPDFInfo(filePath) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const pdfData = await pdfParse(dataBuffer, { max: 1 }); // Only parse first page for info
      
      return {
        fileName: path.basename(filePath),
        fileSize: (await fs.stat(filePath)).size,
        pages: pdfData.numpages,
        metadata: pdfData.metadata || {},
        isValid: true
      };
    } catch (error) {
      return {
        fileName: path.basename(filePath),
        fileSize: 0,
        pages: 0,
        metadata: {},
        isValid: false,
        error: error.message
      };
    }
  }
}

export default PDFProcessor;