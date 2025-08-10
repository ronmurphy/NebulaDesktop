const { app, BrowserWindow, ipcMain, session, screen } = require('electron');
const path = require('path');

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
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'src', 'preload.js'),
                webviewTag: true  // Enable webview for web apps
            }
        });

        this.mainWindow.loadFile('src/index.html');
        
        if (process.argv.includes('--dev')) {
            this.mainWindow.webContents.openDevTools();
        }
    }

    setupIPC() {
        // System operations
        ipcMain.handle('system:shutdown', () => {
            const { exec } = require('child_process');
            exec('systemctl poweroff');
        });

        // Window management
        ipcMain.handle('window:create', (event, options) => {
            return this.createAppWindow(options);
        });

        // File system
        ipcMain.handle('fs:readdir', async (event, dirPath) => {
            const fs = require('fs').promises;
            return await fs.readdir(dirPath);
        });
    }

    createAppWindow(options) {
        const window = new BrowserWindow({
            width: options.width || 800,
            height: options.height || 600,
            webPreferences: {
                partition: options.profile ? `persist:${options.profile}` : undefined,
                webviewTag: true
            }
        });
        
        window.loadURL(options.url);
        const id = Date.now().toString();
        this.childWindows.set(id, window);
        return id;
    }
}

// App lifecycle
let desktop;

app.whenReady().then(() => {
    desktop = new NebulaDesktop();
    desktop.createMainWindow();
    desktop.setupIPC();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});