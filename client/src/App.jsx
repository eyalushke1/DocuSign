import React, { useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Header from './components/Header';
import FolderSelector from './components/FolderSelector';
import FieldConfiguration from './components/FieldConfiguration';
import DataTable from './components/DataTable';
import LoadingSpinner from './components/LoadingSpinner';
import { extractionService } from './services/api';

function App() {
  const [selectedFolder, setSelectedFolder] = useState(null);
  
  // Define field groups
  const fieldGroups = {
    CoF: {
      name: 'CoF (Certificate of Fulfillment)',
      description: 'Fields for Certificate of Fulfillment documents',
      fields: [
        { name: 'remarks', displayName: 'Remarks', description: 'Certificate status remarks like "DocuSign Certificate Complete", "Certificate of Fulfillment - Approved", "Final Certificate - Requirements Met"' },
        { name: 'pod', displayName: 'POD', description: 'Region designation (NA, EMEA, APAC, LATAM) usually marked with an X' },
        { name: 'filename', displayName: 'Filename', description: 'Original PDF filename like Agreement_signed.pdf, Contract_executed.pdf' },
        { name: 'sfdc_opportunity_link_z', displayName: 'SFDC Opportunity Link Z-', description: 'Salesforce opportunity URL containing "Z-" followed by numbers (e.g., https://salesforce.com/opportunity/Z-12345)' },
        { name: 'company_name', displayName: 'Company Name', description: 'Client company name such as "Acme Corporation", "TechCorp Solutions", "Global Enterprises"' },
        { name: 'opportunity_name', displayName: 'Opportunity Name', description: 'Deal or opportunity title like "Q1 2024 Enterprise Deal", "Annual Software License", "Multi-year Partnership"' },
        { name: 'period', displayName: 'Period', description: 'Contract period in months (e.g., 12, 24, 36)' },
        { name: 'currency', displayName: 'Currency', description: 'Currency code (USD, EUR, GBP) for monetary amounts' },
        { name: 'floor_amount_match', displayName: 'Floor Amount Match', description: 'Minimum contract value threshold (e.g., 500000, 250000, 1000000)' },
        { name: 'zcompute_discount_match', displayName: 'ZCompute Discount % Match', description: 'ZCompute service discount percentage (e.g., 15%, 20%, 12%)' },
        { name: 'zstorage_discount_match', displayName: 'ZStorage Discount % Match', description: 'ZStorage service discount percentage (e.g., 10%, 15%, 8%)' },
        { name: 'zcompute', displayName: 'zCompute', description: 'ZCompute service amount or allocation (e.g., 200000, 150000, 400000)' },
        { name: 'poc', displayName: 'POC', description: 'Point of contact email address (e.g., john.doe@company.com, jane.smith@client.com)' },
        { name: 'comment', displayName: 'Comment', description: 'Project status comments like "All requirements met", "Completed on schedule", "Milestone achieved"' },
        { name: 'signed_date_formatted', displayName: 'Signed Date Formatted', description: 'Document signature date in YYYY-MM-DD format (e.g., 2024-01-15, 2024-02-20)' },
        { name: 'nir_approved_indication', displayName: 'Nir Approved Indication', description: 'Approval indicator for Nir process' }
      ]
    },
    Invoice: {
      name: 'Invoice',
      description: 'Fields for invoice documents',
      fields: [
        { name: 'invoice_number', displayName: 'Invoice Number', description: 'Invoice or bill number' },
        { name: 'company_name', displayName: 'Company Name', description: 'Name of the company or organization' },
        { name: 'invoice_date', displayName: 'Invoice Date', description: 'Date of the invoice' },
        { name: 'due_date', displayName: 'Due Date', description: 'Payment due date' },
        { name: 'total_amount', displayName: 'Total Amount', description: 'Total invoice amount' },
        { name: 'currency', displayName: 'Currency', description: 'Currency type used in monetary amounts' },
        { name: 'tax_amount', displayName: 'Tax Amount', description: 'Tax or VAT amount' },
        { name: 'payment_terms', displayName: 'Payment Terms', description: 'Payment terms and conditions' }
      ]
    },
    Contract: {
      name: 'Contract',
      description: 'Fields for contract documents',
      fields: [
        { name: 'contract_number', displayName: 'Contract Number', description: 'Contract or agreement number' },
        { name: 'parties', displayName: 'Parties', description: 'Contracting parties involved' },
        { name: 'effective_date', displayName: 'Effective Date', description: 'Contract effective date' },
        { name: 'expiration_date', displayName: 'Expiration Date', description: 'Contract expiration date' },
        { name: 'contract_value', displayName: 'Contract Value', description: 'Total contract value' },
        { name: 'renewal_terms', displayName: 'Renewal Terms', description: 'Contract renewal conditions' },
        { name: 'governing_law', displayName: 'Governing Law', description: 'Governing law jurisdiction' }
      ]
    }
  };
  
  const [selectedFieldGroup, setSelectedFieldGroup] = useState('CoF');
  const [fields, setFields] = useState(fieldGroups.CoF.fields);
  const [extractedData, setExtractedData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const handleFolderSelect = (folder) => {
    setSelectedFolder(folder);
    setCurrentStep(2);
  };

  const handleFieldGroupChange = (groupKey) => {
    setSelectedFieldGroup(groupKey);
    setFields(fieldGroups[groupKey].fields);
  };

  const handleFieldsUpdate = (newFields) => {
    setFields(newFields);
  };

  const handleExtraction = async () => {
    if (!selectedFolder || fields.length === 0) return;

    setIsLoading(true);
    try {
      const result = await extractionService.extractFromLocal(
        selectedFolder.path, 
        fields, 
        selectedFieldGroup
      );

      if (result.success) {
        setExtractedData(result.results);
        setCurrentStep(3);
      }
    } catch (error) {
      console.error('Extraction error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = async () => {
    if (extractedData.length === 0) return;

    try {
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `${selectedFieldGroup}_extraction_${timestamp}.csv`;
      await extractionService.exportToCSV(extractedData, fields, filename);
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const resetWorkflow = () => {
    setSelectedFolder(null);
    setExtractedData([]);
    setCurrentStep(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading && <LoadingSpinner />}
        
        <div className="space-y-8">
          {/* Progress Steps */}
          <div className="flex items-center justify-center space-x-8 mb-8">
            <div className={`flex items-center space-x-2 ${currentStep >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-300'}`}>
                1
              </div>
              <span className="font-medium">Select Folder</span>
            </div>
            
            <div className={`w-16 h-1 ${currentStep >= 2 ? 'bg-primary-600' : 'bg-gray-300'}`}></div>
            
            <div className={`flex items-center space-x-2 ${currentStep >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-300'}`}>
                2
              </div>
              <span className="font-medium">Configure Fields</span>
            </div>
            
            <div className={`w-16 h-1 ${currentStep >= 3 ? 'bg-primary-600' : 'bg-gray-300'}`}></div>
            
            <div className={`flex items-center space-x-2 ${currentStep >= 3 ? 'text-primary-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-primary-600 text-white' : 'bg-gray-300'}`}>
                3
              </div>
              <span className="font-medium">View Results</span>
            </div>
          </div>

          {/* Step 1: Folder Selection */}
          {currentStep === 1 && (
            <FolderSelector onFolderSelect={handleFolderSelect} />
          )}

          {/* Step 2: Field Configuration */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="card p-6">
                <h2 className="text-xl font-semibold mb-4">Selected Folder</h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium">{selectedFolder?.name}</p>
                  <p className="text-sm text-gray-600">{selectedFolder?.path}</p>
                  <p className="text-sm text-gray-500 mt-1">Local folder with {selectedFolder?.pdfCount} PDF files</p>
                </div>
                <button
                  onClick={resetWorkflow}
                  className="mt-4 btn-secondary"
                >
                  Change Folder
                </button>
              </div>
              
              <FieldConfiguration
                fieldGroups={fieldGroups}
                selectedFieldGroup={selectedFieldGroup}
                onFieldGroupChange={handleFieldGroupChange}
                fields={fields}
                onFieldsUpdate={handleFieldsUpdate}
                onExtract={handleExtraction}
                isLoading={isLoading}
              />
            </div>
          )}

          {/* Step 3: Results */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Extraction Results</h2>
                <div className="space-x-4">
                  <button
                    onClick={handleExportCSV}
                    className="btn-primary"
                    disabled={extractedData.length === 0}
                  >
                    Export CSV
                  </button>
                  <button
                    onClick={resetWorkflow}
                    className="btn-secondary"
                  >
                    Start Over
                  </button>
                </div>
              </div>
              
              <DataTable
                data={extractedData}
                fields={fields}
                fieldGroup={fieldGroups[selectedFieldGroup]}
                onExportCSV={handleExportCSV}
              />
            </div>
          )}
        </div>
      </main>

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}

export default App;