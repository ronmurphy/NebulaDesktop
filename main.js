const { app, BrowserWindow, ipcMain, session, screen, dialog, desktopCapturer, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs').promises;

// Enable hot reload in development
if (process.argv.includes('--dev')) {
    require('electron-reload')(__dirname, {
        electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
        hardResetMethod: 'exit'
    });
}

class NebulaDesktop {
    constructor() {
        this.mainWindow = null;
        this.childWindows = new Map();
        this.isFullscreen = !process.argv.includes('--dev');
        this.adBlockerEnabled = true; // Default to enabled
        this.adBlockFilters = new Set(); // Use Set for faster lookups
        this.filterListUrls = [
            'https://easylist.to/easylist/easylist.txt', // EasyList
            'https://easylist.to/easylist/easyprivacy.txt', // EasyPrivacy
            'https://pgl.yoyo.org/adservers/serverlist.php?hostformat=hosts&showintro=0&mimetype=plaintext' // Peter Lowe's Ad and tracking server list
        ];
        this.listsPath = path.join(__dirname, 'adblock-lists.json');
        this.lastUpdate = 0;
        this.updateInterval = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    }

    createMainWindow() {
        const { width, height } = screen.getPrimaryDisplay().workAreaSize;

        this.mainWindow = new BrowserWindow({
            width: this.isFullscreen ? width : 1400,
            height: this.isFullscreen ? height : 900,
            fullscreen: this.isFullscreen,
            frame: !this.isFullscreen,
            kiosk: this.isFullscreen && !process.argv.includes('--dev'),
            webPreferences: {
                nodeIntegration: false,  // Disable for security
                contextIsolation: true,  // Enable for security
                preload: path.join(__dirname, 'src', 'preload.js'),
                webviewTag: true  // Enable webview for web apps
            }
        });

        this.mainWindow.loadFile('src/index.html');

        if (process.argv.includes('--dev')) {
            this.mainWindow.webContents.openDevTools();
        }
    }

    async setupAdBlocker() {
        try {
            console.log('Setting up enhanced ad blocker...');
            
            // Load existing filter lists from storage
            await this.loadFilterLists();
            
            // Check if we need to update the lists
            const now = Date.now();
            if (now - this.lastUpdate > this.updateInterval || this.adBlockFilters.size === 0) {
                console.log('Filter lists are outdated or missing, downloading...');
                await this.downloadFilterLists();
            }
            
            // Set up web request blocking with the loaded filters
            session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
                if (!this.adBlockerEnabled) {
                    callback({ cancel: false });
                    return;
                }

                const url = details.url.toLowerCase();
                const shouldBlock = this.shouldBlockUrl(url);

                if (shouldBlock) {
                    console.log('Blocked ad/tracker:', details.url);
                    callback({ cancel: true });
                } else {
                    callback({ cancel: false });
                }
            });
            
            console.log(`Ad blocker initialized with ${this.adBlockFilters.size} filter rules`);
        } catch (error) {
            console.error('Failed to initialize ad blocker:', error);
            // Fallback to basic blocking
            this.setupBasicAdBlocker();
        }
    }

    async loadFilterLists() {
        try {
            const data = await fs.readFile(this.listsPath, 'utf8');
            const parsed = JSON.parse(data);
            this.adBlockFilters = new Set(parsed.filters || []);
            this.lastUpdate = parsed.lastUpdate || 0;
            console.log(`Loaded ${this.adBlockFilters.size} filter rules from storage`);
        } catch (error) {
            console.log('No existing filter lists found, will download fresh ones');
            this.adBlockFilters = new Set();
            this.lastUpdate = 0;
        }
    }

    async downloadFilterLists() {
        try {
            console.log('Downloading filter lists...');
            const allFilters = new Set();
            
            for (const url of this.filterListUrls) {
                try {
                    console.log(`Downloading from: ${url}`);
                    const response = await fetch(url);
                    const text = await response.text();
                    
                    // Parse the filter list
                    const filters = this.parseFilterList(text, url);
                    filters.forEach(filter => allFilters.add(filter));
                    
                    console.log(`Added ${filters.length} rules from ${url}`);
                } catch (error) {
                    console.error(`Failed to download from ${url}:`, error);
                }
            }
            
            // Add some basic fallback filters
            const basicFilters = [
                'doubleclick.net', 'googleadservices.com', 'googlesyndication.com',
                'amazon-adsystem.com', 'facebook.com/tr', 'google-analytics.com',
                'googletagmanager.com', 'hotjar.com', 'quantserve.com'
            ];
            basicFilters.forEach(filter => allFilters.add(filter));
            
            this.adBlockFilters = allFilters;
            this.lastUpdate = Date.now();
            
            // Save to storage
            await this.saveFilterLists();
            
            console.log(`Downloaded and saved ${this.adBlockFilters.size} total filter rules`);
        } catch (error) {
            console.error('Failed to download filter lists:', error);
            throw error;
        }
    }

    parseFilterList(text, sourceUrl) {
        const filters = [];
        const lines = text.split('\n');
        
        for (const line of lines) {
            const trimmed = line.trim();
            
            // Skip comments and empty lines
            if (!trimmed || trimmed.startsWith('!') || trimmed.startsWith('#') || trimmed.startsWith('[')) {
                continue;
            }
            
            // Handle different filter formats
            if (sourceUrl.includes('hosts')) {
                // Handle hosts file format (127.0.0.1 domain.com or 0.0.0.0 domain.com)
                const hostsMatch = trimmed.match(/^(?:127\.0\.0\.1|0\.0\.0\.0)\s+(.+)$/);
                if (hostsMatch && hostsMatch[1] && hostsMatch[1] !== 'localhost') {
                    filters.push(hostsMatch[1].toLowerCase());
                }
            } else {
                // Handle EasyList format
                if (trimmed.startsWith('||') && trimmed.includes('^')) {
                    // Extract domain from ||domain.com^ format
                    const domain = trimmed.slice(2, trimmed.indexOf('^'));
                    if (domain && !domain.includes('/') && !domain.includes('*')) {
                        filters.push(domain.toLowerCase());
                    }
                } else if (trimmed.includes('.') && !trimmed.includes('*') && !trimmed.includes('/')) {
                    // Simple domain filter
                    filters.push(trimmed.toLowerCase());
                }
            }
        }
        
        return filters;
    }

    async saveFilterLists() {
        try {
            const data = {
                filters: Array.from(this.adBlockFilters),
                lastUpdate: this.lastUpdate
            };
            await fs.writeFile(this.listsPath, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('Failed to save filter lists:', error);
        }
    }

    shouldBlockUrl(url) {
        // Always allow essential browser and development functionality
        const allowedPatterns = [
            'devtools://',
            'chrome-extension://',
            'moz-extension://',
            'webkit://',
            'chrome-devtools-frontend.appspot.com',
            'fonts.googleapis.com',
            'fonts.gstatic.com',
            'cdnjs.cloudflare.com',
            'jsdelivr.net',
            'unpkg.com',
            'localhost:',
            '127.0.0.1:',
            '192.168.',
            '10.0.0.',
            'file://'
        ];

        // First check if this URL should be allowed
        for (const pattern of allowedPatterns) {
            if (url.includes(pattern)) {
                return false;
            }
        }

        // Check against our filter list
        for (const filter of this.adBlockFilters) {
            if (url.includes(filter)) {
                return true;
            }
        }
        return false;
    }

    setupBasicAdBlocker() {
        // Fallback basic ad blocker
        const basicFilters = [
            'doubleclick.net', 'googleadservices.com', 'googlesyndication.com',
            'amazon-adsystem.com', 'facebook.com/tr', 'google-analytics.com',
            'googletagmanager.com', 'hotjar.com', 'quantserve.com'
        ];

        const allowedPatterns = [
            'devtools://', 'chrome-extension://', 'moz-extension://', 'webkit://',
            'chrome-devtools-frontend.appspot.com', 'fonts.googleapis.com',
            'fonts.gstatic.com', 'localhost:', '127.0.0.1:', 'file://'
        ];

        session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
            if (!this.adBlockerEnabled) {
                callback({ cancel: false });
                return;
            }

            const url = details.url.toLowerCase();
            
            // Check if this should be allowed
            const isAllowed = allowedPatterns.some(pattern => url.includes(pattern));
            if (isAllowed) {
                callback({ cancel: false });
                return;
            }
            
            const shouldBlock = basicFilters.some(filter => url.includes(filter));

            if (shouldBlock) {
                console.log('Blocked ad/tracker (basic):', details.url);
                callback({ cancel: true });
            } else {
                callback({ cancel: false });
            }
        });

        console.log('Basic ad blocker initialized as fallback');
    }

    toggleAdBlocker(enabled) {
        this.adBlockerEnabled = enabled;
        console.log(`Ad blocker ${enabled ? 'enabled' : 'disabled'}`);
    }

    async refreshFilterLists() {
        try {
            console.log('Manually refreshing filter lists...');
            await this.downloadFilterLists();
            return { success: true, count: this.adBlockFilters.size };
        } catch (error) {
            console.error('Failed to refresh filter lists:', error);
            return { success: false, error: error.message };
        }
    }

    setupIPC() {
        // System operations
        ipcMain.handle('system:shutdown', () => {
            const { exec } = require('child_process');
            exec('systemctl poweroff');
        });

        ipcMain.handle('system:reboot', () => {
            const { exec } = require('child_process');
            exec('systemctl reboot');
        });

        ipcMain.handle('system:logout', () => {
            app.quit();
        });

        // Ad blocker settings
        ipcMain.handle('adblocker:get-status', () => {
            return this.adBlockerEnabled;
        });

        ipcMain.handle('adblocker:toggle', (event, enabled) => {
            this.toggleAdBlocker(enabled);
            return this.adBlockerEnabled;
        });

        ipcMain.handle('adblocker:refresh-lists', async () => {
            return await this.refreshFilterLists();
        });

        ipcMain.handle('adblocker:get-stats', () => {
            return {
                filterCount: this.adBlockFilters.size,
                lastUpdate: this.lastUpdate,
                isOutdated: Date.now() - this.lastUpdate > this.updateInterval
            };
        });

        // Window management
        ipcMain.handle('window:create', (event, options) => {
            return this.createAppWindow(options);
        });

        // Proxy fetch for assistant (perform HTTP requests from main process)
        ipcMain.handle('assistant:proxy-fetch', async (event, req = {}) => {
            try {
                const url = req.url;
                const opts = req.options || {};
                // Use global fetch available in Electron/Node
                const response = await fetch(url, opts);
                const contentType = response.headers.get('content-type') || '';

                if (contentType.includes('application/json')) {
                    const json = await response.json();
                    return { ok: true, type: 'json', data: json, status: response.status };
                }

                if (contentType.startsWith('image/')) {
                    const buf = await response.arrayBuffer();
                    const b64 = Buffer.from(buf).toString('base64');
                    const dataURL = `data:${contentType};base64,${b64}`;
                    return { ok: true, type: 'dataURL', dataURL, contentType, status: response.status };
                }

                // For plain text or unknown, return as text
                const text = await response.text().catch(() => null);
                return { ok: true, type: 'text', data: text, contentType, status: response.status };
            } catch (err) {
                return { ok: false, error: err.message || String(err) };
            }
        });

        ipcMain.on('window:close', (event, id) => {
            const window = this.childWindows.get(id);
            if (window) {
                window.close();
                this.childWindows.delete(id);
            }
        });

        ipcMain.on('window:minimize', (event, id) => {
            const window = this.childWindows.get(id);
            if (window) {
                window.minimize();
            }
        });

        ipcMain.on('window:maximize', (event, id) => {
            const window = this.childWindows.get(id);
            if (window) {
                if (window.isMaximized()) {
                    window.restore();
                } else {
                    window.maximize();
                }
            }
        });

        // File system operations
        ipcMain.handle('fs:readdir', async (event, dirPath) => {
            try {
                const fs = require('fs').promises;
                return await fs.readdir(dirPath);
            } catch (error) {
                throw error;
            }
        });

        // FIXED: Smart file reading - binary for images, text for others
        ipcMain.handle('fs:readfile', async (event, filePath, encoding = null) => {
            try {
                const fs = require('fs').promises;

                // Detect if this is likely a binary file based on extension
                const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.webp', '.tiff', '.svg'];
                const videoExtensions = ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.ogv', '.m4v'];
                const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'];
                const binaryExtensions = [...imageExtensions, ...videoExtensions, ...audioExtensions, '.exe', '.bin', '.dll', '.so'];

                const ext = path.extname(filePath).toLowerCase();
                const isBinaryFile = binaryExtensions.includes(ext);

                if (encoding === null) {
                    // Auto-detect encoding based on file type
                    encoding = isBinaryFile ? null : 'utf8';
                }

                console.log(`Reading file: ${filePath}, binary: ${isBinaryFile}, encoding: ${encoding}`);

                const data = await fs.readFile(filePath, encoding);

                // For binary files, convert Buffer to Uint8Array for better browser compatibility
                if (isBinaryFile && Buffer.isBuffer(data)) {
                    return new Uint8Array(data);
                }

                return data;
            } catch (error) {
                console.error(`Error reading file ${filePath}:`, error);
                throw error;
            }
        });

        ipcMain.handle('fs:writefile', async (event, filePath, data) => {
            try {
                const fs = require('fs').promises;
                await fs.writeFile(filePath, data, 'utf8');
                return true;
            } catch (error) {
                throw error;
            }
        });

        ipcMain.handle('fs:homedir', () => {
            const os = require('os');
            return os.homedir();
        });

        // Enhanced file system operations for terminal
        ipcMain.handle('fs:stat', async (event, filePath) => {
            try {
                const fs = require('fs').promises;
                const stats = await fs.stat(filePath);
                return {
                    isDirectory: stats.isDirectory(),
                    isFile: stats.isFile(),
                    size: stats.size,
                    mtime: stats.mtime,
                    mode: stats.mode,
                    uid: stats.uid,
                    gid: stats.gid
                };
            } catch (error) {
                throw error;
            }
        });

        ipcMain.handle('fs:exists', async (event, filePath) => {
            try {
                const fs = require('fs').promises;
                await fs.access(filePath);
                return true;
            } catch (error) {
                return false;
            }
        });

        ipcMain.handle('fs:mkdir', async (event, dirPath, options = {}) => {
            try {
                const fs = require('fs').promises;
                await fs.mkdir(dirPath, { recursive: true, ...options });
                return true;
            } catch (error) {
                throw error;
            }
        });

        ipcMain.handle('fs:rmdir', async (event, dirPath) => {
            try {
                const fs = require('fs').promises;
                await fs.rmdir(dirPath);
                return true;
            } catch (error) {
                throw error;
            }
        });

        ipcMain.handle('fs:unlink', async (event, filePath) => {
            try {
                const fs = require('fs').promises;
                await fs.unlink(filePath);
                return true;
            } catch (error) {
                throw error;
            }
        });

        // Terminal operations
        ipcMain.handle('terminal:exec', async (event, command, args = [], options = {}) => {
            try {
                const { spawn } = require('child_process');

                return new Promise((resolve, reject) => {
                    const proc = spawn(command, args, {
                        cwd: options.cwd || process.cwd(),
                        env: { ...process.env, ...options.env },
                        shell: options.shell || false
                    });

                    let stdout = '';
                    let stderr = '';

                    proc.stdout.on('data', (data) => {
                        stdout += data.toString();
                    });

                    proc.stderr.on('data', (data) => {
                        stderr += data.toString();
                    });

                    proc.on('close', (code) => {
                        resolve({
                            stdout: stdout.trim(),
                            stderr: stderr.trim(),
                            exitCode: code
                        });
                    });

                    proc.on('error', (error) => {
                        reject(error);
                    });

                    // Handle timeout
                    setTimeout(() => {
                        if (!proc.killed) {
                            proc.kill();
                            reject(new Error('Command timed out'));
                        }
                    }, options.timeout || 30000);
                });
            } catch (error) {
                throw error;
            }
        });

        // System info
        ipcMain.handle('system:info', () => {
            const os = require('os');
            return {
                platform: os.platform(),
                arch: os.arch(),
                version: os.version(),
                release: os.release(),
                hostname: os.hostname(),
                uptime: os.uptime(),
                totalMemory: os.totalmem(),
                freeMemory: os.freemem(),
                cpuCount: os.cpus().length
            };
        });

        // Native file dialogs
        ipcMain.handle('dialog:openFile', async (event, options = {}) => {
            try {
                const result = await dialog.showOpenDialog(this.mainWindow, {
                    properties: ['openFile'],
                    filters: [
                        { name: 'Code Files', extensions: ['js', 'ts', 'py', 'html', 'css', 'json', 'md', 'txt'] },
                        { name: 'JavaScript', extensions: ['js'] },
                        { name: 'All Files', extensions: ['*'] }
                    ],
                    ...options
                });
                return result;
            } catch (error) {
                throw error;
            }
        });

        ipcMain.handle('dialog:saveFile', async (event, options = {}) => {
            try {
                const result = await dialog.showSaveDialog(this.mainWindow, {
                    filters: [
                        { name: 'Code Files', extensions: ['js', 'ts', 'py', 'html', 'css', 'json', 'md', 'txt'] },
                        { name: 'All Files', extensions: ['*'] }
                    ],
                    ...options
                });
                return result;
            } catch (error) {
                throw error;
            }
        });

        // 🔸 SCREENSHOT HANDLERS - NEW!
        this.setupScreenshotHandlers();

        // 🔸 QBASIC COMPILATION HANDLERS - DISABLED DUE TO ISSUES
        // this.setupQBJCHandlers();
    }

    // 🔸 QBJC Compilation functionality - NEW!
    setupQBJCHandlers() {
        try {
            // Try to load qbjc - it should be installed via npm
            const qbjc = require('qbjc');
            const { compile } = qbjc;
            const { BrowserExecutor } = require('qbjc/browser');

            console.log('✅ QBJC compiler loaded successfully');

            // Compile QBasic code to JavaScript
            ipcMain.handle('qbjc:compile', async (event, qbasicCode) => {
                try {
                    console.log('🔄 Compiling QBasic code...');
                    const compiledJS = compile(qbasicCode);
                    console.log('✅ QBasic compilation successful');
                    return { success: true, compiledJS };
                } catch (error) {
                    console.error('❌ QBasic compilation failed:', error);
                    return { success: false, error: error.message };
                }
            });

            // Execute compiled QBasic code
            ipcMain.handle('qbjc:execute', async (event, compiledJS) => {
                try {
                    console.log('🔄 Executing compiled QBasic code...');

                    // Create a browser executor instance
                    const executor = new BrowserExecutor();

                    // Execute the compiled code
                    const result = await executor.execute(compiledJS);

                    console.log('✅ QBasic execution completed');
                    return { success: true, result };
                } catch (error) {
                    console.error('❌ QBasic execution failed:', error);
                    return { success: false, error: error.message };
                }
            });

        } catch (error) {
            console.warn('⚠️ QBJC not available:', error.message);
            console.warn('QBasic compilation features will be disabled');

            // Provide fallback handlers that return errors
            ipcMain.handle('qbjc:compile', async () => {
                return { success: false, error: 'QBJC compiler not available. Please install with: npm install qbjc' };
            });

            ipcMain.handle('qbjc:execute', async () => {
                return { success: false, error: 'QBJC compiler not available. Please install with: npm install qbjc' };
            });
        }
    }

    // 🔸 Screenshot functionality - NEW!
    setupScreenshotHandlers() {
        
        // Method 1: Capture entire screen using desktopCapturer (BEST)
        ipcMain.handle('screenshot:capture-screen', async () => {
            try {
                console.log('📸 Capturing screen using Electron desktopCapturer...');
                
                // Get available sources (screens)
                const sources = await desktopCapturer.getSources({
                    types: ['screen'],
                    thumbnailSize: {
                        width: screen.getPrimaryDisplay().workAreaSize.width,
                        height: screen.getPrimaryDisplay().workAreaSize.height
                    }
                });
                
                if (sources.length === 0) {
                    throw new Error('No screen sources available');
                }
                
                // Get the primary screen (you could also let user choose)
                const primarySource = sources[0];
                
                // Convert to data URL
                const dataURL = primarySource.thumbnail.toDataURL();
                
                console.log('✅ Screen captured successfully via Electron');
                return dataURL;
                
            } catch (error) {
                console.error('Electron screen capture failed:', error);
                throw error;
            }
        });
        
        // Method 2: Capture specific window area
        ipcMain.handle('screenshot:capture-area', async (event, bounds) => {
            try {
                console.log('📸 Capturing screen area...', bounds);
                
                const sources = await desktopCapturer.getSources({
                    types: ['screen'],
                    thumbnailSize: {
                        width: bounds.width || 1920,
                        height: bounds.height || 1080
                    }
                });
                
                if (sources.length === 0) {
                    throw new Error('No screen sources available');
                }
                
                const source = sources[0];
                const image = source.thumbnail;
                
                // If specific bounds provided, crop the image
                if (bounds.x !== undefined && bounds.y !== undefined) {
                    const cropped = image.crop({
                        x: bounds.x,
                        y: bounds.y,
                        width: bounds.width,
                        height: bounds.height
                    });
                    return cropped.toDataURL();
                }
                
                return image.toDataURL();
                
            } catch (error) {
                console.error('Area capture failed:', error);
                throw error;
            }
        });
        
        // Method 3: Get screen info for better capture decisions
        ipcMain.handle('screenshot:get-screen-info', () => {
            try {
                const displays = screen.getAllDisplays();
                const primary = screen.getPrimaryDisplay();
                
                return {
                    displays: displays.map(display => ({
                        id: display.id,
                        bounds: display.bounds,
                        workArea: display.workArea,
                        scaleFactor: display.scaleFactor,
                        isPrimary: display.id === primary.id
                    })),
                    primary: {
                        id: primary.id,
                        bounds: primary.bounds,
                        workArea: primary.workArea,
                        scaleFactor: primary.scaleFactor
                    }
                };
            } catch (error) {
                console.error('Get screen info failed:', error);
                throw error;
            }
        });
        
        // Method 4: Save screenshot directly to file
        ipcMain.handle('screenshot:save-to-file', async (event, dataURL, filename) => {
            try {
                const fs = require('fs').promises;
                const os = require('os');
                
                // Remove data URL prefix
                const base64Data = dataURL.replace(/^data:image\/png;base64,/, '');
                
                // Create screenshots directory if it doesn't exist
                const screenshotsDir = path.join(os.homedir(), 'Pictures', 'NebulaDesktop-Screenshots');
                await fs.mkdir(screenshotsDir, { recursive: true });
                
                // Generate filename if not provided
                const finalFilename = filename || `nebula-desktop-${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
                const filePath = path.join(screenshotsDir, finalFilename);
                
                // Write file
                await fs.writeFile(filePath, base64Data, 'base64');
                
                console.log('✅ Screenshot saved to:', filePath);
                return filePath;
                
            } catch (error) {
                console.error('Save screenshot failed:', error);
                throw error;
            }
        });
    }

    createAppWindow(options) {
        const id = `app-${Date.now()}`;
        const childWindow = new BrowserWindow({
            width: options.width || 800,
            height: options.height || 600,
            parent: this.mainWindow,
            modal: false,
            webPreferences: {
                nodeIntegration: false,  // Disable for security
                contextIsolation: true,  // Enable for security
                preload: path.join(__dirname, 'src', 'preload.js')
            }
        });

        this.childWindows.set(id, childWindow);

        childWindow.on('closed', () => {
            this.childWindows.delete(id);
        });

        return id;
    }

    init() {
        app.whenReady().then(async () => {
            this.createMainWindow();
            this.setupIPC();
            await this.setupAdBlocker(); // Initialize ad blocker

            app.on('activate', () => {
                if (BrowserWindow.getAllWindows().length === 0) {
                    this.createMainWindow();
                }
            });
        });

        app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') {
                app.quit();
            }
        });
    }
}

// Create and initialize NebulaDesktop
const nebulaDesktop = new NebulaDesktop();
nebulaDesktop.init();