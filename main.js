// main.js - Fixed with proper fullscreen support
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');

class NebulaDesktop {
    constructor() {
        this.mainWindow = null;
        this.isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');
        
        // Initialize when app is ready
        app.whenReady().then(() => {
            this.createWindow();
        });

        // Quit when all windows are closed
        app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') {
                app.quit();
            }
        });

        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                this.createWindow();
            }
        });

        // Set up IPC handlers
        this.setupIpcHandlers();
    }

    createWindow() {
        // Create the browser window
        this.mainWindow = new BrowserWindow({
            width: 1200,
            height: 800,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: 'preload.js', // Fixed path resolution
                webSecurity: false,
                allowRunningInsecureContent: true
            },
            frame: false,
            titleBarStyle: 'hidden',
            show: false,
            // Add fullscreen support
            fullscreen: true,  // Start in fullscreen
            simpleFullscreen: false, // Use proper fullscreen on macOS
            kiosk: false  // Don't use kiosk mode, still allow dev tools
        });

        // Load the app
        this.mainWindow.loadFile('src/index.html');

        // Show when ready
        this.mainWindow.once('ready-to-show', () => {
            // Force fullscreen regardless of dev mode
            this.mainWindow.setFullScreen(true);
            this.mainWindow.show();
            
            // Only show dev tools in dev mode
            if (this.isDev) {
                this.mainWindow.webContents.openDevTools();
                console.log('🔧 Development mode: DevTools opened');
            }
            
            console.log('🚀 NebulaDesktop window ready - Fullscreen:', this.mainWindow.isFullScreen());
        });

        // Handle window closed
        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
        });

        // Handle fullscreen changes
        this.mainWindow.on('enter-full-screen', () => {
            console.log('📺 Entered fullscreen mode');
        });

        this.mainWindow.on('leave-full-screen', () => {
            console.log('📺 Left fullscreen mode');
            // Force back to fullscreen if needed
            setTimeout(() => {
                if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                    this.mainWindow.setFullScreen(true);
                }
            }, 100);
        });
    }

    setupIpcHandlers() {
        // Widget system support
        ipcMain.handle('widget-scan-directory', async (event, dirPath) => {
            const fs = require('fs');
            try {
                const normalizedPath = path.resolve(dirPath);
                
                if (!fs.existsSync(normalizedPath)) {
                    return { success: false, error: 'Directory does not exist' };
                }
                
                const files = fs.readdirSync(normalizedPath)
                    .filter(file => file.endsWith('.js'))
                    .map(file => ({
                        name: file,
                        path: path.join(normalizedPath, file),
                        relativePath: path.relative(__dirname, path.join(normalizedPath, file))
                    }));
                
                return { success: true, files };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        // Dialog support for folder browsing
        ipcMain.handle('dialog-show-open', async (event, options) => {
            if (!this.mainWindow) return { canceled: true };
            
            const result = await dialog.showOpenDialog(this.mainWindow, {
                properties: ['openDirectory'],
                ...options
            });
            
            return result;
        });

        // Add fullscreen toggle support
        ipcMain.handle('window-toggle-fullscreen', async () => {
            if (this.mainWindow) {
                const isFullScreen = this.mainWindow.isFullScreen();
                this.mainWindow.setFullScreen(!isFullScreen);
                return !isFullScreen;
            }
            return false;
        });

        // Add window state queries
        ipcMain.handle('window-is-fullscreen', async () => {
            return this.mainWindow ? this.mainWindow.isFullScreen() : false;
        });

        // Add dev mode check
        ipcMain.handle('app-is-dev', async () => {
            return this.isDev;
        });

        console.log('🔧 IPC handlers set up');
    }
}

// Create the application
new NebulaDesktop();

console.log('🚀 NebulaDesktop main process started');