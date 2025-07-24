import express from 'express';
import FolderReader from '../services/folderReader.js';
import fs from 'fs-extra';
import path from 'path';

const router = express.Router();
const folderReader = new FolderReader();

// Get available local folders
router.get('/available', async (req, res) => {
  try {
    console.log('🔧 [API Debug] Getting available local folders...');
    
    const localFolders = await folderReader.getLocalFolders();
    
    console.log('🔧 [API Debug] Local folders retrieved successfully:', {
      localCount: localFolders?.length || 0
    });
    
    res.json({
      success: true,
      folders: { local: localFolders }
    });
  } catch (error) {
    console.error('❌ [API Debug] Error getting local folders:', error);
    res.status(500).json({ 
      error: `Failed to get folders: ${error.message}`
    });
  }
});

// Get PDFs from local folder
router.post('/local/pdfs', async (req, res) => {
  try {
    const { folderPath } = req.body;
    
    if (!folderPath) {
      return res.status(400).json({ error: 'Folder path is required' });
    }

    console.log('🔧 [API Debug] Getting PDFs from folder:', folderPath);
    const pdfs = await folderReader.getLocalPDFs(folderPath);
    console.log('🔧 [API Debug] Found PDFs:', pdfs.length);
    
    res.json({
      success: true,
      count: pdfs.length,
      files: pdfs
    });
  } catch (error) {
    console.error('❌ [API Debug] Error getting local PDFs:', {
      message: error.message,
      stack: error.stack,
      folderPath: req.body.folderPath
    });
    res.status(500).json({ 
      error: error.message,
      success: false,
      details: `Failed to scan folder: ${req.body.folderPath}`
    });
  }
});

// Box.com functionality removed

// Browse local folders
router.post('/local/browse', async (req, res) => {
  try {
    const { folderPath } = req.body;
    
    if (!folderPath) {
      return res.status(400).json({ error: 'Folder path is required' });
    }

    // Using imported fs and path modules
    
    // Normalize the path for Windows
    const normalizedPath = path.resolve(folderPath);
    
    if (!await fs.pathExists(normalizedPath)) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    // Check if we have read permissions
    try {
      await fs.access(normalizedPath, fs.constants.R_OK);
    } catch (error) {
      return res.status(403).json({ error: 'Access denied to folder' });
    }

    const items = await fs.readdir(normalizedPath);
    const folders = [];
    
    for (const item of items) {
      try {
        const itemPath = path.join(normalizedPath, item);
        const stats = await fs.stat(itemPath);
        
        if (stats.isDirectory()) {
          // Skip hidden/system folders on Windows
          if (process.platform === 'win32' && item.startsWith('.')) {
            continue;
          }
          
          folders.push({
            name: item,
            path: itemPath,
            type: 'folder'
          });
        }
      } catch (error) {
        // Skip items we can't access rather than failing completely
        console.error(`Error checking item ${item}:`, error);
      }
    }

    res.json({
      success: true,
      currentPath: normalizedPath,
      folders: folders.sort((a, b) => a.name.localeCompare(b.name))
    });
  } catch (error) {
    console.error('Error browsing local folder:', error);
    res.status(500).json({ error: `Failed to browse folder: ${error.message}` });
  }
});

// All Box.com functionality removed

// Simple test endpoint
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API is working',
    timestamp: new Date().toISOString()
  });
});

// Test PDF scanning endpoint
router.get('/test-pdfs', async (req, res) => {
  try {
    const testPath = 'C:\\Users\\Eyal\\Documents\\GitHub\\DocuSign';
    console.log('🔧 [Test] Testing PDF scan in:', testPath);
    
    const pdfs = await folderReader.getLocalPDFs(testPath);
    console.log('🔧 [Test] Found PDFs:', pdfs);
    
    res.json({ 
      success: true, 
      testPath: testPath,
      pdfCount: pdfs.length,
      pdfs: pdfs
    });
  } catch (error) {
    console.error('❌ [Test] Error in test PDF scan:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

export default router;// trigger restart

