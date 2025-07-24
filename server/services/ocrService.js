import Tesseract from 'tesseract.js';
import pdf2pic from 'pdf2pic';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class OCRService {
  constructor() {
    this.tempDir = path.join(__dirname, '../../temp');
    this.ensureTempDir();
  }

  async ensureTempDir() {
    try {
      await fs.ensureDir(this.tempDir);
    } catch (error) {
      console.error('Error creating temp directory:', error);
    }
  }

  async extractTextFromPDF(pdfPath, options = {}) {
    console.log(`🔍 Starting OCR extraction for: ${pdfPath}`);
    
    try {
      // Configure pdf2pic options
      const convert = pdf2pic.fromPath(pdfPath, {
        density: 300,           // Higher DPI for better OCR accuracy
        saveFilename: "page",
        savePath: this.tempDir,
        format: "png",
        width: 2000,           // Higher resolution
        height: 2000,
        quality: 85
      });

      let extractedText = '';
      let pageNumber = 1;
      const maxPages = options.maxPages || 10; // Limit pages for performance

      console.log(`📄 Converting PDF pages to images for OCR processing...`);

      while (pageNumber <= maxPages) {
        try {
          // Convert PDF page to image
          const result = await convert(pageNumber, { 
            responseType: "buffer" 
          });

          if (!result || !result.buffer) {
            console.log(`📄 Reached end of document at page ${pageNumber}`);
            break;
          }

          console.log(`🖼️ Processing page ${pageNumber} with OCR...`);

          // Perform OCR on the image
          const ocrResult = await Tesseract.recognize(result.buffer, 'eng', {
            logger: m => {
              if (m.status === 'recognizing text') {
                console.log(`OCR Progress page ${pageNumber}: ${Math.round(m.progress * 100)}%`);
              }
            },
            tessedit_pageseg_mode: Tesseract.PSM.AUTO,
            preserve_interword_spaces: '1',
          });

          const pageText = ocrResult.data.text.trim();
          if (pageText) {
            extractedText += `\n--- Page ${pageNumber} ---\n${pageText}\n`;
            console.log(`✅ Extracted ${pageText.length} characters from page ${pageNumber}`);
          } else {
            console.log(`⚠️ No text found on page ${pageNumber}`);
          }

          pageNumber++;
        } catch (pageError) {
          if (pageError.message.includes('Requested FirstPage is greater than the number of pages')) {
            console.log(`📄 Reached end of document at page ${pageNumber}`);
            break;
          } else {
            console.error(`Error processing page ${pageNumber}:`, pageError.message);
            pageNumber++;
            continue;
          }
        }
      }

      // Clean up temp files
      await this.cleanupTempFiles();

      if (extractedText.trim()) {
        console.log(`✅ OCR completed successfully. Total text length: ${extractedText.length} characters`);
        return {
          success: true,
          text: extractedText.trim(),
          method: 'OCR',
          pagesProcessed: pageNumber - 1
        };
      } else {
        return {
          success: false,
          text: '',
          method: 'OCR',
          error: 'No text could be extracted from the PDF using OCR'
        };
      }

    } catch (error) {
      console.error('❌ OCR extraction failed:', error);
      await this.cleanupTempFiles();
      
      return {
        success: false,
        text: '',
        method: 'OCR',
        error: `OCR failed: ${error.message}`
      };
    }
  }

  async cleanupTempFiles() {
    try {
      const files = await fs.readdir(this.tempDir);
      for (const file of files) {
        if (file.startsWith('page') && (file.endsWith('.png') || file.endsWith('.jpg'))) {
          await fs.remove(path.join(this.tempDir, file));
        }
      }
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
    }
  }

  async isAvailable() {
    try {
      // Test basic OCR functionality
      await Tesseract.recognize(Buffer.alloc(1), 'eng');
      return true;
    } catch (error) {
      console.warn('OCR service not available:', error.message);
      return false;
    }
  }
}

export default OCRService;