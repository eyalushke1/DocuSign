import express from 'express';
import AIExtractor from '../services/aiExtractor.js';
import PDFProcessor from '../services/pdfProcessor.js';
import FolderReader from '../services/folderReader.js';
import fs from 'fs-extra';
import createCsvWriter from 'csv-writer';
import path from 'path';

const router = express.Router();
const aiExtractor = new AIExtractor();
const pdfProcessor = new PDFProcessor();
const folderReader = new FolderReader();

// Extract data from uploaded PDFs
router.post('/extract', async (req, res) => {
  try {
    const { documents, fields } = req.body;
    
    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({ error: 'Documents array is required' });
    }
    
    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      return res.status(400).json({ error: 'Fields array is required' });
    }

    const results = await aiExtractor.batchExtract(documents, fields);
    
    res.json({
      success: true,
      extractedCount: results.length,
      results: results
    });
  } catch (error) {
    console.error('Data extraction error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Extract data from local folder
router.post('/extract-local', async (req, res) => {
  try {
    const { folderPath, fields, documentType = 'general' } = req.body;
    
    if (!folderPath) {
      return res.status(400).json({ error: 'Folder path is required' });
    }
    
    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      return res.status(400).json({ error: 'Fields array is required' });
    }

    console.log(`🔍 Starting extraction for document type: ${documentType}`);

    // Get PDF files from folder
    const pdfFiles = await folderReader.getLocalPDFs(folderPath);
    
    if (pdfFiles.length === 0) {
      return res.json({
        success: true,
        message: 'No PDF files found in the specified folder',
        extractedCount: 0,
        results: []
      });
    }

    console.log(`📄 Found ${pdfFiles.length} PDF files to process`);

    // Process PDFs
    const documents = [];
    for (const file of pdfFiles) {
      const processed = await pdfProcessor.processPDF(file.path);
      if (processed.success && processed.text) {
        documents.push({
          fileName: processed.fileName,
          text: processed.text,
          filePath: processed.filePath
        });
      }
    }

    console.log(`✅ Successfully processed ${documents.length} PDF files`);

    // Extract data using AI with document type
    const results = await aiExtractor.batchExtract(documents, fields, documentType);
    
    res.json({
      success: true,
      folderPath: folderPath,
      documentType: documentType,
      totalFiles: pdfFiles.length,
      processedFiles: documents.length,
      extractedCount: results.length,
      results: results
    });
  } catch (error) {
    console.error('Local folder extraction error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Box.com extraction functionality removed

// Export results to CSV
router.post('/export-csv', async (req, res) => {
  try {
    const { results, fields, filename = 'extracted_data.csv' } = req.body;
    
    if (!results || !Array.isArray(results) || results.length === 0) {
      return res.status(400).json({ error: 'Results array is required' });
    }
    
    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      return res.status(400).json({ error: 'Fields array is required' });
    }

    // Prepare CSV headers
    const headers = [
      { id: 'fileName', title: 'File Name' },
      { id: 'status', title: 'Status' },
      ...fields.map(field => ({
        id: field.name,
        title: field.displayName || field.name
      }))
    ];

    // Prepare CSV data
    const csvData = results.map(result => {
      const row = {
        fileName: result.fileName,
        status: result.success ? 'Success' : 'Failed'
      };
      
      // Add extracted data
      fields.forEach(field => {
        row[field.name] = result.data[field.name] || 'N/A';
      });
      
      return row;
    });

    // Create temporary CSV file
    const tempDir = './temp';
    await fs.ensureDir(tempDir);
    const csvFilePath = path.join(tempDir, filename);
    
    const csvWriter = createCsvWriter.createObjectCsvWriter({
      path: csvFilePath,
      header: headers
    });

    await csvWriter.writeRecords(csvData);

    // Send file as download
    res.download(csvFilePath, filename, async (err) => {
      if (err) {
        console.error('CSV download error:', err);
      }
      
      // Clean up temporary file
      try {
        await fs.remove(csvFilePath);
      } catch (cleanupError) {
        console.error('CSV cleanup error:', cleanupError);
      }
    });
  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get available AI models
router.get('/models', (req, res) => {
  try {
    const models = aiExtractor.getAvailableModels();
    res.json({
      success: true,
      models: models
    });
  } catch (error) {
    console.error('Error getting AI models:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test extraction with sample data
router.post('/test', async (req, res) => {
  try {
    const { text, fields } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required for testing' });
    }
    
    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      return res.status(400).json({ error: 'Fields array is required' });
    }

    const result = await aiExtractor.extractDataFromText(text, fields, 'test-document.pdf');
    
    res.json({
      success: true,
      result: result
    });
  } catch (error) {
    console.error('Test extraction error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;