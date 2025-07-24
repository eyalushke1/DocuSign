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
            drives.push({
              name: `${driveLetter}: Drive`,
              path: drivePath,
              type: 'drive',
              letter: driveLetter
            });
            console.log(`✅ Found accessible drive: ${drivePath}`);
          }
        } catch (error) {
          // Skip drives we can't access
        }
      }
    } else {
      // For Unix-like systems, add root and common mount points
      const commonPaths = ['/', '/home', '/Users'];
      for (const mountPath of commonPaths) {
        try {
          if (await fs.pathExists(mountPath)) {
            drives.push({
              name: mountPath === '/' ? 'Root' : path.basename(mountPath),
              path: mountPath,
              type: 'drive'
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
      
      // Then add common user directories
      try {
        const homeDir = os.homedir();
        console.log('🏠 Home directory:', homeDir);
        
        const userFolders = [
          { name: '📄 Documents', path: path.join(homeDir, 'Documents'), type: 'folder', icon: '📄' },
          { name: '🖥️ Desktop', path: path.join(homeDir, 'Desktop'), type: 'folder', icon: '🖥️' },
          { name: '⬇️ Downloads', path: path.join(homeDir, 'Downloads'), type: 'folder', icon: '⬇️' }
        ];
        
        for (const folder of userFolders) {
          try {
            if (await fs.pathExists(folder.path)) {
              console.log(`✅ Adding folder: ${folder.name} -> ${folder.path}`);
              folders.push(folder);
            } else {
              console.log(`❌ Folder does not exist: ${folder.path}`);
            }
          } catch (error) {
            console.log(`❌ Cannot access folder: ${folder.path} - ${error.message}`);
          }
        }
        
        // Add some common Windows directories if they exist
        if (process.platform === 'win32') {
          const commonPaths = [
            { name: '📁 Public Documents', path: 'C:\\Users\\Public\\Documents', type: 'folder', icon: '📁' }
          ];
          
          for (const folder of commonPaths) {
            try {
              if (await fs.pathExists(folder.path) && !folders.find(f => f.path === folder.path)) {
                console.log(`✅ Adding Windows folder: ${folder.name} -> ${folder.path}`);
                folders.push(folder);
              }
            } catch (error) {
              // Skip folders we can't access
            }
          }
        }
        
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

  async getLocalPDFs(folderPath, maxFiles = 500) {
    try {
      console.log(`📁 Starting full recursive scan for PDFs: ${folderPath}`);
      
      if (!await fs.pathExists(folderPath)) {
        throw new Error(`Folder not found: ${folderPath}`);
      }

      // Use the recursive scanner for full folder scanning
      const pdfFiles = await this.scanFolderRecursively(folderPath, 0, maxFiles);
      console.log(`📄 Total PDFs found: ${pdfFiles.length}`);

      const fileDetails = await Promise.all(
        pdfFiles.map(async (filePath) => {
          try {
            const stats = await fs.stat(filePath);
            return {
              name: path.basename(filePath),
              path: filePath,
              size: stats.size,
              modified: stats.mtime,
              type: 'local',
              relativePath: path.relative(folderPath, filePath)
            };
          } catch (error) {
            console.error(`Error getting stats for ${filePath}:`, error);
            return null;
          }
        })
      );

      const validFiles = fileDetails.filter(file => file !== null);
      console.log(`✅ Returning ${validFiles.length} valid PDF files`);
      return validFiles;
    } catch (error) {
      console.error('❌ Error reading local folder:', error);
      throw error;
    }
  }

  async scanFolderRecursively(folderPath, depth = 0, maxFiles = 500) {
    const files = [];
    const maxDepth = 10; // Allow deeper scanning for comprehensive search
    const skipDirs = ['node_modules', '.git', '.vscode', 'dist', 'build', '.next', '__pycache__', 
                     'temp', 'tmp', 'cache', 'logs', 'log', 'backup', 'backups', 'System Volume Information',
                     'Windows', 'Program Files', 'Program Files (x86)', '$Recycle.Bin', 'Recovery'];
    
    // Prevent infinite recursion
    if (depth > maxDepth) {
      console.log(`Skipping deep directory: ${folderPath} (depth: ${depth})`);
      return files;
    }
    
    try {
      const items = await fs.readdir(folderPath);
      console.log(`📂 Scanning folder: ${folderPath} (depth: ${depth}, ${items.length} items)`);
      
      // Process files first (PDFs in current directory)
      for (const item of items) {
        // Skip hidden files and system files
        if (item.startsWith('.') || item.startsWith('$')) {
          continue;
        }
        
        const itemPath = path.join(folderPath, item);
        
        try {
          const stats = await fs.stat(itemPath);
          
          if (stats.isFile() && path.extname(item).toLowerCase() === '.pdf') {
            files.push(itemPath);
            console.log(`📄 Found PDF (${files.length}/${maxFiles}): ${item}`);
            
            // Stop if we've reached the maximum number of files
            if (files.length >= maxFiles) {
              console.log(`📄 Reached maximum files limit (${maxFiles}), stopping scan`);
              return files;
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
          if (item.startsWith('.') || item.startsWith('$') || skipDirs.includes(item.toLowerCase())) {
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
      console.error(`Error scanning folder ${folderPath}:`, error.message);
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
