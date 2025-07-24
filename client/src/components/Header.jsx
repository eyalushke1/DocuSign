import React from 'react';
import { FileText, Brain } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-primary-600" />
              <Brain className="h-6 w-6 text-primary-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">PDF Data Extractor</h1>
              <p className="text-sm text-gray-600">AI-powered document processing</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">Local & Box.com</p>
              <p className="text-xs text-gray-500">PDF Processing</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;