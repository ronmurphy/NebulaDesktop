// preload.js - Enhanced with Widget Discovery System
const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('nebula', {
    // File system operations
    fs: {
        readFile: async (filePath, options = {}) => {
            try {
                if (options.encoding) {
                    return fs.readFileSync(filePath, options.encoding);
                }
                return fs.readFileSync(filePath);
            } catch (error) {
                throw new Error(`Failed to read file: ${error.message}`);
            }
        },

        writeFile: async (filePath, data, options = {}) => {
            try {
                return fs.writeFileSync(filePath, data, options);
            } catch (error) {
                throw new Error(`Failed to write file: ${error.message}`);
            }
        },

        exists: (filePath) => {
            try {
                return fs.existsSync(filePath);
            } catch (error) {
                return false;
            }
        },

        mkdir: (dirPath, options = {}) => {
            try {
                return fs.mkdirSync(dirPath, { recursive: true, ...options });
            } catch (error) {
                throw new Error(`Failed to create directory: ${error.message}`);
            }
        },

        readDir: (dirPath) => {
            try {
                return fs.readdirSync(dirPath);
            } catch (error) {
                throw new Error(`Failed to read directory: ${error.message}`);
            }
        },

        stat: (filePath) => {
            try {
                return fs.statSync(filePath);
            } catch (error) {
                throw new Error(`Failed to get file stats: ${error.message}`);
            }
        },

        copyFile: (src, dest) => {
            try {
                return fs.copyFileSync(src, dest);
            } catch (error) {
                throw new Error(`Failed to copy file: ${error.message}`);
            }
        },

        deleteFile: (filePath) => {
            try {
                return fs.unlinkSync(filePath);
            } catch (error) {
                throw new Error(`Failed to delete file: ${error.message}`);
            }
        },

        // Get app paths
        getAppPath: () => {
            return __dirname;
        },

        getUserDataPath: () => {
            return process.env.APPDATA || 
                   (process.platform === 'darwin' ? process.env.HOME + '/Library/Application Support' : 
                   process.env.HOME + '/.local/share');
        }
    },

    // System operations
    system: {
        platform: process.platform,
        arch: process.arch,
        
        exec: (command) => {
            return new Promise((resolve, reject) => {
                exec(command, (error, stdout, stderr) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve({ stdout, stderr });
                    }
                });
            });
        },

        getEnv: (key) => {
            return process.env[key];
        },

        openExternal: (url) => {
            return ipcRenderer.invoke('open-external', url);
        }
    },

    // Terminal operations
    terminal: {
        spawn: (command, args = [], options = {}) => {
            return ipcRenderer.invoke('spawn-process', command, args, options);
        },

        kill: (pid) => {
            return ipcRenderer.invoke('kill-process', pid);
        },

        resize: (pid, cols, rows) => {
            return ipcRenderer.invoke('resize-terminal', pid, cols, rows);
        },

        write: (pid, data) => {
            return ipcRenderer.invoke('write-terminal', pid, data);
        }
    },

    // NEW: Widget Discovery System
    widgets: {
        /**
         * Scan for widget files in built-in and user folders
         * @param {string|null} userWidgetPath - Optional user widget folder path
         * @returns {Array} Array of widget file objects
         */
        scanForWidgets: (userWidgetPath = null) => {
            console.log('🔍 Starting widget folder scan...');
            
            // Built-in widgets folder (always included)
            const builtInPath = path.join(__dirname, 'src', 'js', 'Widgets');
            const foldersToScan = [
                { path: builtInPath, type: 'built-in' }
            ];
            
            // Add user folder if provided and valid
            if (userWidgetPath) {
                const normalizedPath = path.resolve(userWidgetPath);
                if (fs.existsSync(normalizedPath)) {
                    foldersToScan.push({ path: normalizedPath, type: 'user' });
                    console.log(`✅ User widget folder found: ${normalizedPath}`);
                } else {
                    console.warn(`⚠️ User widget folder not found: ${normalizedPath}`);
                }
            }
            
            const widgetFiles = [];
            
            foldersToScan.forEach(folder => {
                try {
                    console.log(`📂 Scanning folder: ${folder.path} (${folder.type})`);
                    
                    if (!fs.existsSync(folder.path)) {
                        console.warn(`⚠️ Folder does not exist: ${folder.path}`);
                        return;
                    }
                    
                    const files = fs.readdirSync(folder.path)
                        .filter(file => file.endsWith('.js'))
                        .map(file => ({
                            filename: file,
                            fullPath: path.join(folder.path, file),
                            relativePath: folder.type === 'built-in' ? 
                                `js/Widgets/${file}` : 
                                path.join(folder.path, file),
                            source: folder.type,
                            folder: folder.path
                        }));
                    
                    console.log(`📄 Found ${files.length} JS files in ${folder.type} folder`);
                    widgetFiles.push(...files);
                    
                } catch (error) {
                    console.error(`❌ Error scanning folder ${folder.path}:`, error.message);
                }
            });
            
            console.log(`🎯 Total widget files discovered: ${widgetFiles.length}`);
            return widgetFiles;
        },

        /**
         * Check if a JS file contains widget class (extends NebulaWidget)
         * @param {string} filePath - Path to the JS file
         * @returns {Object} Analysis result with widget info
         */
        checkWidgetFile: (filePath) => {
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                
                // Check for widget class pattern
                const extendsNebulaWidget = content.includes('extends NebulaWidget');
                
                // Try to extract class name
                let className = null;
                const classMatch = content.match(/class\s+(\w+)\s+extends\s+NebulaWidget/);
                if (classMatch) {
                    className = classMatch[1];
                }
                
                // Try to extract widget registration info
                let registrationInfo = null;
                const registerMatch = content.match(/registerWidget\(\s*['"](.*?)['"],\s*{/);
                if (registerMatch) {
                    const widgetId = registerMatch[1];
                    
                    // Try to extract name
                    const nameMatch = content.match(/name:\s*['"](.*?)['"]/);
                    const descMatch = content.match(/description:\s*['"](.*?)['"]/);
                    
                    registrationInfo = {
                        id: widgetId,
                        name: nameMatch ? nameMatch[1] : 'Unknown Widget',
                        description: descMatch ? descMatch[1] : 'No description'
                    };
                }
                
                return {
                    isWidget: extendsNebulaWidget,
                    className: className,
                    registration: registrationInfo,
                    hasRegistration: !!registrationInfo,
                    fileSize: content.length
                };
                
            } catch (error) {
                console.error(`❌ Error reading widget file ${filePath}:`, error.message);
                return {
                    isWidget: false,
                    error: error.message
                };
            }
        },

        /**
         * Validate user widget folder path
         * @param {string} folderPath - Path to validate
         * @returns {Object} Validation result
         */
        validateWidgetFolder: (folderPath) => {
            try {
                const normalizedPath = path.resolve(folderPath);
                
                if (!fs.existsSync(normalizedPath)) {
                    return { valid: false, error: 'Folder does not exist' };
                }
                
                const stats = fs.statSync(normalizedPath);
                if (!stats.isDirectory()) {
                    return { valid: false, error: 'Path is not a directory' };
                }
                
                // Check if we can read the folder
                try {
                    fs.readdirSync(normalizedPath);
                } catch (readError) {
                    return { valid: false, error: 'Cannot read folder (permission denied)' };
                }
                
                return { 
                    valid: true, 
                    path: normalizedPath,
                    readable: true 
                };
                
            } catch (error) {
                return { valid: false, error: error.message };
            }
        },

        /**
         * Get detailed scan report for debugging
         * @param {string|null} userWidgetPath - Optional user widget folder
         * @returns {Object} Detailed scan report
         */
        getDetailedScanReport: (userWidgetPath = null) => {
            const files = window.nebula.widgets.scanForWidgets(userWidgetPath);
            const report = {
                totalFiles: files.length,
                builtInFiles: files.filter(f => f.source === 'built-in').length,
                userFiles: files.filter(f => f.source === 'user').length,
                validWidgets: 0,
                invalidFiles: 0,
                details: []
            };
            
            files.forEach(file => {
                const analysis = window.nebula.widgets.checkWidgetFile(file.fullPath);
                
                if (analysis.isWidget) {
                    report.validWidgets++;
                } else {
                    report.invalidFiles++;
                }
                
                report.details.push({
                    filename: file.filename,
                    source: file.source,
                    isWidget: analysis.isWidget,
                    className: analysis.className,
                    hasRegistration: analysis.hasRegistration,
                    registration: analysis.registration,
                    error: analysis.error
                });
            });
            
            return report;
        },

        /**
         * Read widget file content for dynamic loading
         * @param {string} filePath - Path to widget file
         * @returns {string} File content
         */
        readWidgetFile: (filePath) => {
            try {
                return fs.readFileSync(filePath, 'utf8');
            } catch (error) {
                throw new Error(`Failed to read widget file: ${error.message}`);
            }
        }
    },

    // Window management
    window: {
        minimize: () => ipcRenderer.invoke('window-minimize'),
        maximize: () => ipcRenderer.invoke('window-maximize'),
        close: () => ipcRenderer.invoke('window-close'),
        isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
        setTitle: (title) => ipcRenderer.invoke('window-set-title', title),
        
        // Window state events
        onMaximized: (callback) => ipcRenderer.on('window-maximized', callback),
        onUnmaximized: (callback) => ipcRenderer.on('window-unmaximized', callback),
        onMinimized: (callback) => ipcRenderer.on('window-minimized', callback),
        onRestored: (callback) => ipcRenderer.on('window-restored', callback)
    },

    // App management
    app: {
        getVersion: () => ipcRenderer.invoke('app-get-version'),
        getName: () => ipcRenderer.invoke('app-get-name'),
        getPath: (name) => ipcRenderer.invoke('app-get-path', name),
        quit: () => ipcRenderer.invoke('app-quit'),
        restart: () => ipcRenderer.invoke('app-restart'),
        
        // Development
        isDev: () => ipcRenderer.invoke('app-is-dev'),
        showDevTools: () => ipcRenderer.invoke('app-show-dev-tools'),
        
        // Theme and appearance
        setTheme: (theme) => ipcRenderer.invoke('app-set-theme', theme),
        getTheme: () => ipcRenderer.invoke('app-get-theme')
    },

    // Dialog operations
    dialog: {
        showOpenDialog: (options) => ipcRenderer.invoke('dialog-show-open', options),
        showSaveDialog: (options) => ipcRenderer.invoke('dialog-show-save', options),
        showMessageBox: (options) => ipcRenderer.invoke('dialog-show-message', options),
        showErrorBox: (title, content) => ipcRenderer.invoke('dialog-show-error', title, content)
    },

    // Utility functions
    utils: {
        openPath: (filePath) => ipcRenderer.invoke('utils-open-path', filePath),
        showItemInFolder: (filePath) => ipcRenderer.invoke('utils-show-item-in-folder', filePath),
        beep: () => ipcRenderer.invoke('utils-beep')
    }
});

console.log('🔌 Preload script loaded with widget discovery system');