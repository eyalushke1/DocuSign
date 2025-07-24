import React, { useState, useEffect } from 'react';
import { Folder, HardDrive, ChevronRight, FileText, ArrowLeft, Home, Check, MousePointer, Search, RefreshCw } from 'lucide-react';
import { folderService } from '../services/api';
import { toast } from 'react-toastify';

const FolderSelector = ({ onFolderSelect }) => {
  const [currentFolders, setCurrentFolders] = useState([]);
  const [currentPath, setCurrentPath] = useState(null);
  const [navigationHistory, setNavigationHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolderInfo, setSelectedFolderInfo] = useState(null);
  const [scanningProgress, setScanningProgress] = useState(false);

  useEffect(() => {
    loadInitialFolders();
  }, []);

  const loadInitialFolders = async () => {
    try {
      const result = await folderService.getAvailableFolders();
      setCurrentFolders(result.folders.local || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading folders:', error);
      toast.error('Failed to load folders');
      setLoading(false);
    }
  };

  const navigateToFolder = async (folder) => {
    try {
      setLoading(true);
      const result = await folderService.browseLocalFolder(folder.path);
      
      // Add current location to history
      if (currentPath) {
        setNavigationHistory(prev => [...prev, {
          path: currentPath,
          folders: currentFolders
        }]);
      } else {
        // First navigation from root
        setNavigationHistory([{
          path: null,
          folders: currentFolders
        }]);
      }
      
      setCurrentPath(result.currentPath);
      setCurrentFolders(result.folders);
    } catch (error) {
      console.error('Error navigating to folder:', error);
      toast.error('Failed to navigate to folder');
    } finally {
      setLoading(false);
    }
  };

  const navigateBack = () => {
    if (navigationHistory.length === 0) return;
    
    const previous = navigationHistory[navigationHistory.length - 1];
    setNavigationHistory(prev => prev.slice(0, -1));
    setCurrentPath(previous.path);
    setCurrentFolders(previous.folders);
  };

  const navigateToRoot = () => {
    setCurrentPath(null);
    setNavigationHistory([]);
    loadInitialFolders();
  };

  const handleFolderSelect = async (folder) => {
    try {
      setScanningProgress(true);
      toast.info('Scanning folder for PDFs... This may take a few moments for large folders.');
      
      const pdfInfo = await folderService.getLocalPDFs(folder.path);
      
      setSelectedFolderInfo({
        ...folder,
        type: 'local',
        pdfCount: pdfInfo.count || 0,
        files: pdfInfo.files || []
      });
      
      if (pdfInfo.count > 0) {
        toast.success(`Found ${pdfInfo.count} PDF files in selected folder`);
      } else {
        toast.warning('No PDF files found in selected folder');
      }
    } catch (error) {
      console.error('Error getting folder info:', error);
      toast.error('Failed to scan folder for PDFs');
    } finally {
      setScanningProgress(false);
    }
  };

  const confirmSelection = () => {
    if (selectedFolderInfo) {
      onFolderSelect(selectedFolderInfo);
    }
  };

  const renderFolder = (folder) => {
    const isSelected = selectedFolderInfo && selectedFolderInfo.path === folder.path;
    const isDrive = folder.type === 'drive';
    const folderIcon = isDrive ? HardDrive : Folder;
    const iconColor = isDrive ? 'text-gray-600' : 'text-blue-600';

    return (
      <div key={folder.path} className="border-b border-gray-100 last:border-b-0">
        <div 
          className={`flex items-center space-x-3 p-4 transition-colors ${
            isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'
          }`}
        >
          {React.createElement(folderIcon, { className: `h-6 w-6 ${iconColor} flex-shrink-0` })}
          <div className="flex-grow min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">{folder.name}</div>
            <div className="text-xs text-gray-500 truncate">{folder.path}</div>
            {isDrive && (
              <div className="text-xs text-blue-600 font-medium mt-1">System Drive</div>
            )}
          </div>
          
          <div className="flex items-center space-x-3 flex-shrink-0">
            <button
              onClick={() => handleFolderSelect(folder)}
              disabled={scanningProgress}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200 shadow-sm ${
                scanningProgress 
                  ? 'bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed'
                  : isSelected 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-600 hover:text-white hover:border-blue-600 hover:shadow-md'
              }`}
              title={scanningProgress ? 'Scanning in progress...' : 'Select this folder for PDF processing'}
            >
              {scanningProgress ? (
                <><RefreshCw className="h-4 w-4 inline mr-2 animate-spin" />Scanning...</>
              ) : isSelected ? (
                <><Check className="h-4 w-4 inline mr-2" />Selected</>
              ) : (
                <><Search className="h-4 w-4 inline mr-2" />Scan for PDFs</>
              )}
            </button>
            
            <button
              onClick={() => navigateToFolder(folder)}
              disabled={scanningProgress}
              className={`p-2 rounded-lg border transition-all duration-200 shadow-sm ${
                scanningProgress 
                  ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                  : 'border-gray-300 hover:bg-gray-100 text-gray-600 hover:text-gray-800 hover:shadow-md'
              }`}
              title={scanningProgress ? 'Scanning in progress...' : 'Browse into this folder'}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <HardDrive className="h-6 w-6 text-gray-600" />
            <h2 className="text-xl font-semibold">
              {currentPath ? 'Browse Folders' : 'Select Drive or Folder'}
            </h2>
          </div>
          {currentPath && (
            <div className="flex items-center space-x-2">
              <button
                onClick={navigateBack}
                disabled={navigationHistory.length === 0}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Go back"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                onClick={navigateToRoot}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100"
                title="Go to root"
              >
                <Home className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          Choose a folder or drive containing PDF files you want to extract data from. Click <strong>"Scan for PDFs"</strong> to perform a full scan of the selected location, or click <strong>"→"</strong> to browse into subfolders.
        </p>
        
        {/* Current path display */}
        {currentPath && (
          <div className="mb-4 px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-600 truncate">
            <strong>Current Location:</strong> {currentPath}
          </div>
        )}
        
        <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
          {currentFolders.length > 0 ? (
            currentFolders.map(folder => renderFolder(folder))
          ) : (
            <div className="p-6 text-center">
              <Folder className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No folders found in this location</p>
            </div>
          )}
        </div>
      </div>

      {/* Selected Folder Information */}
      {selectedFolderInfo && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Selected Folder</h3>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-3">
              <HardDrive className="h-6 w-6 text-gray-600 flex-shrink-0 mt-1" />
              <div className="flex-grow">
                <h4 className="font-medium text-gray-900">{selectedFolderInfo.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{selectedFolderInfo.path}</p>
                <div className="flex items-center space-x-1 mt-2">
                  <FileText className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">
                    {selectedFolderInfo.pdfCount} PDF files found via full scan
                  </span>
                </div>
                {selectedFolderInfo.files && selectedFolderInfo.files.length > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    Found files in subfolders up to 10 levels deep
                  </div>
                )}
              </div>
            </div>
          </div>

          {selectedFolderInfo.pdfCount > 0 ? (
            <div className="flex justify-end">
              <button
                onClick={confirmSelection}
                className="btn-primary flex items-center space-x-2"
              >
                <Check className="h-4 w-4" />
                <span>Continue with this folder</span>
              </button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-yellow-600 font-medium">No PDF files found in this folder</p>
              <p className="text-sm text-gray-500 mt-1">Please select a different folder or browse into subfolders</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FolderSelector;