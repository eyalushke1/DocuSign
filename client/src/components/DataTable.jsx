import React, { useState, useMemo } from 'react';
import { Download, Search, Filter, Check, X, FileText } from 'lucide-react';

const DataTable = ({ data, fields, onExportCSV }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Filter and search data
  const filteredData = useMemo(() => {
    let filtered = data;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => 
        statusFilter === 'success' ? item.success : !item.success
      );
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item => {
        const searchLower = searchTerm.toLowerCase();
        
        // Search in filename
        if (item.fileName.toLowerCase().includes(searchLower)) return true;
        
        // Search in extracted data
        if (item.data) {
          return Object.values(item.data).some(value => 
            value && value.toString().toLowerCase().includes(searchLower)
          );
        }
        
        return false;
      });
    }

    return filtered;
  }, [data, searchTerm, statusFilter]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      let aValue, bValue;

      if (sortConfig.key === 'fileName') {
        aValue = a.fileName;
        bValue = b.fileName;
      } else if (sortConfig.key === 'status') {
        aValue = a.success;
        bValue = b.success;
      } else {
        aValue = a.data[sortConfig.key] || '';
        bValue = b.data[sortConfig.key] || '';
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const getStatusIcon = (success) => {
    return success ? (
      <Check className="h-4 w-4 text-green-600" />
    ) : (
      <X className="h-4 w-4 text-red-600" />
    );
  };

  const successCount = data.filter(item => item.success).length;
  const failureCount = data.length - successCount;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Files</p>
              <p className="text-2xl font-bold text-gray-900">{data.length}</p>
            </div>
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center space-x-2">
            <Check className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Successfully Processed</p>
              <p className="text-2xl font-bold text-green-600">{successCount}</p>
            </div>
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center space-x-2">
            <X className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-sm text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-red-600">{failureCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search files or data..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Files</option>
                <option value="success">Successfully Processed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          {/* Export Button */}
          <button
            onClick={onExportCSV}
            className="btn-primary flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Status</span>
                    <span>{getSortIcon('status')}</span>
                  </div>
                </th>
                
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('fileName')}
                >
                  <div className="flex items-center space-x-1">
                    <span>File Name</span>
                    <span>{getSortIcon('fileName')}</span>
                  </div>
                </th>

                {fields.map(field => (
                  <th 
                    key={field.name}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort(field.name)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{field.displayName}</span>
                      <span>{getSortIcon(field.name)}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedData.length > 0 ? (
                sortedData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(item.success)}
                        <span className={`text-sm font-medium ${
                          item.success ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {item.success ? 'Success' : 'Failed'}
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {item.fileName}
                      </div>
                      {item.error && (
                        <div className="text-xs text-red-500 mt-1">
                          Error: {item.error}
                        </div>
                      )}
                    </td>

                    {fields.map(field => (
                      <td key={field.name} className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {item.data[field.name] || 'N/A'}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={fields.length + 2} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">No data found</p>
                      <p className="text-sm">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results Summary */}
      {sortedData.length > 0 && (
        <div className="text-sm text-gray-600 text-center">
          Showing {sortedData.length} of {data.length} total results
        </div>
      )}
    </div>
  );
};

export default DataTable;