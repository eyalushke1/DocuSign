import fs from 'fs-extra';
import path from 'path';
import os from 'os';

class FolderReader {
  constructor() {
    // Simplified constructor - only handles local folders
  }

  async getAvailableDrives() {
    const drives = [];
    
    if (process.platform === 'win32') {
      // Check for Windows drives A-Z
      for (let i = 65; i <= 90; i++) {
        const driveLetter = String.fromCharCode(i);
        const drivePath = `${driveLetter}:\\`;
        
        try {
          if (await fs.pathExists(drivePath)) {
            await fs.access(drivePath, fs.constants.R_OK);
            
            // Get drive type and free space info
            let driveType = 'Local Drive';
            try {
              const stats = await fs.stat(drivePath);
              // Try to determine if it's a removable drive or network drive
              if (driveLetter === 'C') driveType = 'System Drive (C:)';
              else if (['A', 'B'].includes(driveLetter)) driveType = 'Floppy Drive';
              else driveType = `Local Drive (${driveLetter}:)`;
            } catch (error) {
              // Use default type
            }
            
            drives.push({
              name: `${driveLetter}: Drive`,
              path: drivePath,
              type: 'drive',
              letter: driveLetter,
              driveType: driveType,
              icon: driveLetter === 'C' ? '🖥️' : '💾'
            });
            console.log(`✅ Found accessible drive: ${drivePath} (${driveType})`);
          }
        } catch (error) {
          // Skip drives we can't access
        }
      }
    } else {
      // For Unix-like systems, add root and common mount points
      const commonPaths = [
        { path: '/', name: 'Root System', icon: '🖥️' },
        { path: '/home', name: 'Home Directory', icon: '🏠' },
        { path: '/Users', name: 'Users Directory', icon: '👥' },
        { path: '/Volumes', name: 'Mounted Volumes', icon: '💾' }
      ];
      
      for (const mountInfo of commonPaths) {
        try {
          if (await fs.pathExists(mountInfo.path)) {
            drives.push({
              name: mountInfo.name,
              path: mountInfo.path,
              type: 'drive',
              icon: mountInfo.icon
            });
          }
        } catch (error) {
          // Skip paths we can't access
        }
      }
    }
    
    return drives;
  }

  async getLocalFolders() {
    try {
      console.log('📁 Getting local folders...');
      
      const folders = [];
      
      // First, add available drives
      const drives = await this.getAvailableDrives();
      folders.push(...drives);
      
      // Then add common user directories with comprehensive shortcuts
      try {
        const homeDir = os.homedir();
        console.log('🏠 Home directory:', homeDir);
        
        const userFolders = [
          { name: '🏠 Home Directory', path: homeDir, type: 'folder', icon: '🏠', priority: 1 },
          { name: '📄 Documents', path: path.join(homeDir, 'Documents'), type: 'folder', icon: '📄', priority: 2 },
          { name: '🖥️ Desktop', path: path.join(homeDir, 'Desktop'), type: 'folder', icon: '🖥️', priority: 3 },
          { name: '⬇️ Downloads', path: path.join(homeDir, 'Downloads'), type: 'folder', icon: '⬇️', priority: 4 },
          { name: '🖼️ Pictures', path: path.join(homeDir, 'Pictures'), type: 'folder', icon: '🖼️', priority: 5 },
          { name: '🎵 Music', path: path.join(homeDir, 'Music'), type: 'folder', icon: '🎵', priority: 6 },
          { name: '🎬 Videos', path: path.join(homeDir, 'Videos'), type: 'folder', icon: '🎬', priority: 7 }
        ];
        
        // Add Windows-specific shortcuts
        if (process.platform === 'win32') {
          userFolders.push(
            { name: '📁 OneDrive', path: path.join(homeDir, 'OneDrive'), type: 'folder', icon: '☁️', priority: 8 },
            { name: '📂 Public', path: 'C:\\Users\\Public', type: 'folder', icon: '👥', priority: 9 },
            { name: '⚙️ AppData', path: path.join(homeDir, 'AppData'), type: 'folder', icon: '⚙️', priority: 10 },
            { name: '📋 CoF Documents', path: 'C:\\Zadara\\Box\\COF', type: 'folder', icon: '📋', priority: 11 }
          );
        }
        
        // Add macOS-specific shortcuts
        if (process.platform === 'darwin') {
          userFolders.push(
            { name: '📱 Applications', path: '/Applications', type: 'folder', icon: '📱', priority: 8 },
            { name: '☁️ iCloud Drive', path: path.join(homeDir, 'Library/Mobile Documents/com~apple~CloudDocs'), type: 'folder', icon: '☁️', priority: 9 }
          );
        }
        
        for (const folder of userFolders) {
          try {
            if (await fs.pathExists(folder.path)) {
              // Check if we can read the folder
              await fs.access(folder.path, fs.constants.R_OK);
              console.log(`✅ Adding accessible folder: ${folder.name} -> ${folder.path}`);
              folders.push(folder);
            } else {
              console.log(`❌ Folder does not exist: ${folder.path}`);
            }
          } catch (error) {
            console.log(`❌ Cannot access folder: ${folder.path} - ${error.message}`);
          }
        }
        
        // Sort folders: drives first, then shortcuts by priority, then alphabetically
        folders.sort((a, b) => {
          // Drives first
          if (a.type === 'drive' && b.type !== 'drive') return -1;
          if (b.type === 'drive' && a.type !== 'drive') return 1;
          
          // If both are drives, sort by drive letter
          if (a.type === 'drive' && b.type === 'drive') {
            return (a.letter || a.name).localeCompare(b.letter || b.name);
          }
          
          // If both have priority, sort by priority
          if (a.priority && b.priority) {
            return a.priority - b.priority;
          }
          
          // If only one has priority, it goes first
          if (a.priority && !b.priority) return -1;
          if (b.priority && !a.priority) return 1;
          
          // Otherwise sort alphabetically
          return a.name.localeCompare(b.name);
        });
        
      } catch (error) {
        console.log('❌ Error accessing user directories:', error.message);
      }
      
      console.log(`📁 Successfully found ${folders.length} accessible folders and drives`);
      return folders;
    } catch (error) {
      console.error('❌ Error in getLocalFolders:', error);
      // Return basic fallback
      return [
        { name: '📄 Documents', path: path.join(os.homedir(), 'Documents'), type: 'folder' }
      ];
    }
  }

  async getAvailableFolders() {
    const localFolders = await this.getLocalFolders();
    return {
      local: localFolders
    };
  }

  async getLocalPDFs(folderPath, maxFiles = 1000) {
    try {
      console.log(`📁 Starting comprehensive recursive scan for PDFs: ${folderPath}`);
      
      if (!await fs.pathExists(folderPath)) {
        throw new Error(`Folder not found: ${folderPath}`);
      }

      // Check read permissions
      try {
        await fs.access(folderPath, fs.constants.R_OK);
      } catch (error) {
        throw new Error(`Access denied to folder: ${folderPath}`);
      }

      // Use the recursive scanner for full folder scanning
      const scanResult = await this.scanFolderRecursively(folderPath, 0, maxFiles);
      console.log(`📄 Total PDFs found: ${scanResult.length} in ${folderPath}`);

      // Get detailed file information with error handling
      const fileDetails = [];
      for (const filePath of scanResult) {
        try {
          const stats = await fs.stat(filePath);
          const fileDetail = {
            name: path.basename(filePath),
            path: filePath,
            size: stats.size,
            modified: stats.mtime,
            type: 'local',
            relativePath: path.relative(folderPath, filePath),
            folder: path.dirname(path.relative(folderPath, filePath)) || '.',
            sizeFormatted: this.formatFileSize(stats.size)
          };
          fileDetails.push(fileDetail);
        } catch (error) {
          console.error(`Error getting stats for ${filePath}:`, error.message);
        }
      }

      // Sort by folder, then by name
      fileDetails.sort((a, b) => {
        if (a.folder !== b.folder) {
          return a.folder.localeCompare(b.folder);
        }
        return a.name.localeCompare(b.name);
      });

      console.log(`✅ Returning ${fileDetails.length} valid PDF files from scan`);
      return fileDetails;
    } catch (error) {
      console.error('❌ Error reading local folder:', error);
      throw error;
    }
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  async scanFolderRecursively(folderPath, depth = 0, maxFiles = 1000) {
    const files = [];
    const maxDepth = 15; // Allow deeper scanning for comprehensive search
    const skipDirs = [
      // Development folders
      'node_modules', '.git', '.vscode', '.vs', 'dist', 'build', '.next', '__pycache__', 
      'target', 'bin', 'obj', '.gradle', '.idea',
      // System folders
      'temp', 'tmp', 'cache', 'logs', 'log', 'backup', 'backups', 
      'System Volume Information', 'Windows', '$Recycle.Bin', 'Recovery',
      // Program folders (but allow user to access if they really want)
      // 'Program Files', 'Program Files (x86)' - removed to allow access
    ];
    
    // Prevent infinite recursion
    if (depth > maxDepth) {
      console.log(`⚠️ Maximum depth reached: ${folderPath} (depth: ${depth})`);
      return files;
    }
    
    try {
      // Check folder accessibility
      try {
        await fs.access(folderPath, fs.constants.R_OK);
      } catch (accessError) {
        console.log(`⚠️ Access denied to folder: ${folderPath}`);
        return files;
      }

      const items = await fs.readdir(folderPath);
      if (depth <= 2) { // Only log for shallow depths to avoid spam
        console.log(`📂 Scanning: ${folderPath} (depth: ${depth}, ${items.length} items)`);
      }
      
      // Process files first (PDFs in current directory)
      for (const item of items) {
        // Skip hidden files, system files, and temp files
        if (item.startsWith('.') || item.startsWith('$') || item.startsWith('~')) {
          continue;
        }
        
        const itemPath = path.join(folderPath, item);
        
        try {
          const stats = await fs.stat(itemPath);
          
          if (stats.isFile()) {
            const ext = path.extname(item).toLowerCase();
            if (ext === '.pdf') {
              files.push(itemPath);
              if (files.length % 50 === 0 || files.length <= 10) {
                console.log(`📄 Found PDF #${files.length}: ${path.basename(item)} in ${path.basename(folderPath)}`);
              }
              
              // Stop if we've reached the maximum number of files
              if (files.length >= maxFiles) {
                console.log(`📄 Reached maximum files limit (${maxFiles}), stopping scan`);
                return files;
              }
            }
          }
        } catch (statError) {
          // Skip files we can't access
          continue;
        }
      }
      
      // Then process subdirectories if we haven't reached the file limit
      if (files.length < maxFiles && depth < maxDepth) {
        for (const item of items) {
          // Skip hidden, system, and known problematic directories
          if (item.startsWith('.') || item.startsWith('$') || 
              skipDirs.some(skip => item.toLowerCase().includes(skip.toLowerCase()))) {
            continue;
          }
          
          const itemPath = path.join(folderPath, item);
          
          try {
            const stats = await fs.stat(itemPath);
            
            if (stats.isDirectory()) {
              const subFiles = await this.scanFolderRecursively(itemPath, depth + 1, maxFiles - files.length);
              files.push(...subFiles);
              
              // Stop if we've found enough files
              if (files.length >= maxFiles) {
                console.log(`📄 Reached file limit (${files.length}), stopping scan`);
                break;
              }
            }
          } catch (statError) {
            // Skip directories we can't access
            continue;
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error scanning folder ${folderPath}: ${error.message}`);
    }
    
    return files;
  }

  async browseLocalFolder(folderPath) {
    try {
      const normalizedPath = path.resolve(folderPath);
      
      if (!await fs.pathExists(normalizedPath)) {
        throw new Error('Folder not found');
      }

      // Check if we have read permissions
      try {
        await fs.access(normalizedPath, fs.constants.R_OK);
      } catch (error) {
        throw new Error('Access denied to folder');
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

      return {
        success: true,
        currentPath: normalizedPath,
        folders: folders.sort((a, b) => a.name.localeCompare(b.name))
      };
    } catch (error) {
      console.error('Error browsing local folder:', error);
      throw new Error(`Failed to browse folder: ${error.message}`);
    }
  }
}

export default FolderReader;
