import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ message = 'Processing documents...' }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 text-primary-600 animate-spin" />
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900">Processing</h3>
            <p className="text-sm text-gray-600 mt-1">{message}</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-primary-600 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;