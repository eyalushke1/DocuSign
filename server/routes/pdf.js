import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import PDFProcessor from '../services/pdfProcessor.js';

const router = express.Router();
const pdfProcessor = new PDFProcessor();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_PATH || './uploads';
    await fs.ensureDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() === '.pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024 // 50MB default
  }
});

// Process single PDF file
router.post('/process', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const result = await pdfProcessor.processPDF(req.file.path);
    
    // Clean up uploaded file
    await fs.remove(req.file.path);

    res.json(result);
  } catch (error) {
    console.error('PDF processing error:', error);
    
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      try {
        await fs.remove(req.file.path);
      } catch (cleanupError) {
        console.error('File cleanup error:', cleanupError);
      }
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Process multiple PDF files
router.post('/process-batch', upload.array('pdfs', 50), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No PDF files uploaded' });
    }

    const filePaths = req.files.map(file => file.path);
    const results = await pdfProcessor.batchProcessPDFs(filePaths);
    
    // Clean up uploaded files
    await Promise.all(filePaths.map(filePath => fs.remove(filePath)));

    res.json({
      success: true,
      processedCount: results.length,
      results: results
    });
  } catch (error) {
    console.error('Batch PDF processing error:', error);
    
    // Clean up uploaded files on error
    if (req.files) {
      await Promise.all(
        req.files.map(file => 
          fs.remove(file.path).catch(err => 
            console.error('File cleanup error:', err)
          )
        )
      );
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Get PDF info without full processing
router.post('/info', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const info = await pdfProcessor.getPDFInfo(req.file.path);
    
    // Clean up uploaded file
    await fs.remove(req.file.path);

    res.json(info);
  } catch (error) {
    console.error('PDF info error:', error);
    
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      try {
        await fs.remove(req.file.path);
      } catch (cleanupError) {
        console.error('File cleanup error:', cleanupError);
      }
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Validate PDF file
router.post('/validate', (req, res) => {
  try {
    const { filePath } = req.body;
    
    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    const isValid = pdfProcessor.validatePDF(filePath);
    res.json({ isValid, filePath });
  } catch (error) {
    console.error('PDF validation error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;