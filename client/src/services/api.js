import axios from 'axios';
import { toast } from 'react-toastify';

const API_BASE_URL = 'http://localhost:3001/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 minutes for long operations
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || 'An error occurred';
    toast.error(message);
    throw error;
  }
);

// Folder services
export const folderService = {
  async getAvailableFolders() {
    const response = await api.get('/folders/available');
    return response.data;
  },

  async getLocalPDFs(folderPath) {
    const response = await api.post('/folders/local/pdfs', { folderPath });
    return response.data;
  },

  async browseLocalFolder(folderPath) {
    const response = await api.post('/folders/local/browse', { folderPath });
    return response.data;
  }
};

// PDF processing services
export const pdfService = {
  async processPDF(file) {
    const formData = new FormData();
    formData.append('pdf', file);
    
    const response = await api.post('/pdf/process', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async processBatchPDFs(files) {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('pdfs', file);
    });
    
    const response = await api.post('/pdf/process-batch', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getPDFInfo(file) {
    const formData = new FormData();
    formData.append('pdf', file);
    
    const response = await api.post('/pdf/info', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async validatePDF(filePath) {
    const response = await api.post('/pdf/validate', { filePath });
    return response.data;
  }
};

// Data extraction services
export const extractionService = {
  async extractFromDocuments(documents, fields) {
    const response = await api.post('/extraction/extract', {
      documents,
      fields
    });
    return response.data;
  },

  async extractFromLocal(folderPath, fields, documentType = 'general') {
    toast.info(`Starting PDF extraction from local folder using ${documentType} document type...`);
    const response = await api.post('/extraction/extract-local', {
      folderPath,
      fields,
      documentType
    });
    
    if (response.data.success) {
      toast.success(`Successfully extracted data from ${response.data.extractedCount} files using ${documentType} extraction`);
    }
    
    return response.data;
  },

// Box.com extraction removed

  async exportToCSV(results, fields, filename = 'extracted_data.csv') {
    try {
      const response = await api.post('/extraction/export-csv', {
        results,
        fields,
        filename
      }, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('CSV file downloaded successfully');
    } catch (error) {
      console.error('CSV export error:', error);
      toast.error('Failed to export CSV file');
    }
  },

  async getAvailableModels() {
    const response = await api.get('/extraction/models');
    return response.data;
  },

  async testExtraction(text, fields) {
    const response = await api.post('/extraction/test', {
      text,
      fields
    });
    return response.data;
  }
};

// Health check
export const healthService = {
  async checkHealth() {
    const response = await api.get('/health');
    return response.data;
  }
};

export default api;