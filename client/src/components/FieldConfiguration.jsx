import React, { useState, useEffect } from 'react';
import { Plus, Minus, Settings, Play, FileText } from 'lucide-react';

const FieldConfiguration = ({ 
  fieldGroups, 
  selectedFieldGroup, 
  onFieldGroupChange, 
  fields, 
  onFieldsUpdate, 
  onExtract, 
  isLoading 
}) => {
  const [localFields, setLocalFields] = useState(fields);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Update local fields when field group changes
  useEffect(() => {
    setLocalFields(fields);
  }, [fields]);

  const addField = () => {
    const newField = {
      name: `field_${localFields.length + 1}`,
      displayName: `Field ${localFields.length + 1}`,
      description: 'Enter description for extraction'
    };
    const updatedFields = [...localFields, newField];
    setLocalFields(updatedFields);
    onFieldsUpdate(updatedFields);
  };

  const removeField = (index) => {
    const updatedFields = localFields.filter((_, i) => i !== index);
    setLocalFields(updatedFields);
    onFieldsUpdate(updatedFields);
  };

  const updateField = (index, property, value) => {
    const updatedFields = localFields.map((field, i) => 
      i === index ? { ...field, [property]: value } : field
    );
    setLocalFields(updatedFields);
    onFieldsUpdate(updatedFields);
  };

  const presetFields = {
    invoice: [
      { name: 'invoice_number', displayName: 'Invoice Number', description: 'Invoice or reference number' },
      { name: 'invoice_date', displayName: 'Invoice Date', description: 'Date of the invoice' },
      { name: 'due_date', displayName: 'Due Date', description: 'Payment due date' },
      { name: 'vendor_name', displayName: 'Vendor Name', description: 'Name of the vendor or supplier' },
      { name: 'total_amount', displayName: 'Total Amount', description: 'Total amount including tax' },
      { name: 'tax_amount', displayName: 'Tax Amount', description: 'Tax amount if specified' }
    ],
    contract: [
      { name: 'contract_date', displayName: 'Contract Date', description: 'Date when contract was signed' },
      { name: 'party_1', displayName: 'First Party', description: 'Name of the first contracting party' },
      { name: 'party_2', displayName: 'Second Party', description: 'Name of the second contracting party' },
      { name: 'contract_value', displayName: 'Contract Value', description: 'Total value of the contract' },
      { name: 'start_date', displayName: 'Start Date', description: 'Contract start date' },
      { name: 'end_date', displayName: 'End Date', description: 'Contract end date' }
    ],
    receipt: [
      { name: 'receipt_date', displayName: 'Receipt Date', description: 'Date of the receipt' },
      { name: 'merchant_name', displayName: 'Merchant Name', description: 'Name of the merchant or store' },
      { name: 'total_amount', displayName: 'Total Amount', description: 'Total amount paid' },
      { name: 'payment_method', displayName: 'Payment Method', description: 'Method of payment used' },
      { name: 'receipt_number', displayName: 'Receipt Number', description: 'Receipt reference number' }
    ],
    docusign: [
      { name: 'remarks', displayName: 'Remarks', description: 'Any remarks or notes in the document' },
      { name: 'pod', displayName: 'POD', description: 'Proof of Delivery or POD reference' },
      { name: 'filename', displayName: 'Filename', description: 'Original filename or document reference' },
      { name: 'sfdc_opportunity_link_z', displayName: 'SFDC Opportunity Link Z-', description: 'Salesforce opportunity link or reference ending with Z-' },
      { name: 'company_name', displayName: 'Company Name', description: 'Name of the company or organization' },
      { name: 'opportunity_name', displayName: 'Opportunity Name', description: 'Name or title of the opportunity' },
      { name: 'period', displayName: 'Period', description: 'Time period or duration mentioned in the document' },
      { name: 'currency', displayName: 'Currency', description: 'Currency type used in monetary amounts' },
      { name: 'floor_amount_match', displayName: 'Floor Amount Match', description: 'Floor amount matching value or percentage' },
      { name: 'zcompute_discount_match', displayName: 'ZCompute Discount % Match', description: 'ZCompute discount percentage matching value' },
      { name: 'zstorage_discount_match', displayName: 'ZStorage Discount % Match', description: 'ZStorage discount percentage matching value' },
      { name: 'zcompute', displayName: 'zCompute', description: 'ZCompute related value or amount' },
      { name: 'poc', displayName: 'POC', description: 'Point of Contact information' },
      { name: 'comment', displayName: 'Comment', description: 'Comments or additional notes' },
      { name: 'signed_date_formatted', displayName: 'Signed Date Formatted', description: 'Formatted signature date from the document' }
    ]
  };

  const applyPreset = (presetName) => {
    const preset = presetFields[presetName];
    setLocalFields(preset);
    onFieldsUpdate(preset);
  };

  return (
    <div className="space-y-6">
      {/* Field Group Selection */}
      <div className="card p-6">
        <div className="flex items-center space-x-2 mb-4">
          <FileText className="h-6 w-6 text-primary-600" />
          <h2 className="text-xl font-semibold">Select Document Type</h2>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          Choose the type of document you want to extract data from. Each type has predefined fields optimized for that document category.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(fieldGroups).map(([key, group]) => (
            <div
              key={key}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                selectedFieldGroup === key
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onFieldGroupChange(key)}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className={`font-medium ${
                  selectedFieldGroup === key ? 'text-primary-900' : 'text-gray-900'
                }`}>
                  {group.name}
                </h3>
                {selectedFieldGroup === key && (
                  <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                )}
              </div>
              <p className={`text-sm ${
                selectedFieldGroup === key ? 'text-primary-700' : 'text-gray-600'
              }`}>
                {group.description}
              </p>
              <div className="mt-2 text-xs text-gray-500">
                {group.fields.length} fields
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Configure Extraction Fields</h2>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
          >
            <Settings className="h-4 w-4" />
            <span>{showAdvanced ? 'Hide' : 'Show'} Advanced</span>
          </button>
        </div>

        {/* Preset Templates */}
        {showAdvanced && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Templates</h3>
            <div className="flex flex-wrap gap-2">
              {Object.keys(presetFields).map(presetName => (
                <button
                  key={presetName}
                  onClick={() => applyPreset(presetName)}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 capitalize"
                >
                  {presetName}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Field Configuration */}
        <div className="space-y-4">
          {localFields.map((field, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Field Name
                  </label>
                  <input
                    type="text"
                    value={field.name}
                    onChange={(e) => updateField(index, 'name', e.target.value)}
                    className="input-field w-full"
                    placeholder="field_name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={field.displayName}
                    onChange={(e) => updateField(index, 'displayName', e.target.value)}
                    className="input-field w-full"
                    placeholder="Human readable name"
                  />
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={() => removeField(index)}
                    className="btn-secondary flex items-center space-x-1"
                    disabled={localFields.length === 1}
                  >
                    <Minus className="h-4 w-4" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
              
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (for AI extraction)
                </label>
                <textarea
                  value={field.description}
                  onChange={(e) => updateField(index, 'description', e.target.value)}
                  className="input-field w-full"
                  rows="2"
                  placeholder="Describe what data to extract for this field..."
                />
              </div>
            </div>
          ))}
        </div>

        {/* Add Field Button */}
        <div className="mt-4">
          <button
            onClick={addField}
            className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
          >
            <Plus className="h-4 w-4" />
            <span>Add Field</span>
          </button>
        </div>
      </div>

      {/* Extraction Summary */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Extraction Summary</h3>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Document Type:</p>
              <p className="font-medium">{fieldGroups[selectedFieldGroup]?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Fields to extract:</p>
              <p className="font-medium">{localFields.length} fields</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">AI Model:</p>
              <p className="font-medium">Claude 3.5 Sonnet (Anthropic)</p>
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-6">
          <h4 className="text-sm font-medium text-gray-900">Fields to be extracted:</h4>
          <div className="flex flex-wrap gap-2">
            {localFields.map((field, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full"
              >
                {field.displayName}
              </span>
            ))}
          </div>
        </div>

        {/* Start Extraction Button */}
        <div className="flex justify-end">
          <button
            onClick={onExtract}
            disabled={isLoading || localFields.length === 0}
            className="btn-primary flex items-center space-x-2"
          >
            <Play className="h-4 w-4" />
            <span>{isLoading ? 'Processing...' : 'Start Extraction'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FieldConfiguration;