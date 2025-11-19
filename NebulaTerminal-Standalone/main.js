const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const os = require('os');
const pty = require('node-pty');

class NebulaTerminalApp {
    constructor() {
        this.mainWindow = null;
        this.ptyProcess = null;
    }

    createMainWindow() {
        this.mainWindow = new BrowserWindow({
            width: 1000,
            height: 700,
            minWidth: 600,
            minHeight: 400,
            title: 'Nebula Terminal',
            backgroundColor: '#1a1a1a',
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'preload.js')
            }
        });

        this.mainWindow.loadFile('index.html');

        // Open DevTools in development mode
        if (process.argv.includes('--dev')) {
            this.mainWindow.webContents.openDevTools();
        }

        this.mainWindow.on('closed', () => {
            // Kill PTY process when window closes
            if (this.ptyProcess) {
                this.ptyProcess.kill();
            }
            this.mainWindow = null;
        });
    }

    setupIPCHandlers() {
        // Create PTY process
        ipcMain.handle('terminal:create', (event, options = {}) => {
            const shell = process.env.SHELL || (process.platform === 'win32' ? 'powershell.exe' : 'bash');
            const cwd = options.cwd || process.env.HOME || os.homedir();

            // Create PTY process
            this.ptyProcess = pty.spawn(shell, [], {
                name: 'xterm-256color',
                cols: options.cols || 80,
                rows: options.rows || 24,
                cwd: cwd,
                env: process.env
            });

            console.log('PTY created:', {
                pid: this.ptyProcess.pid,
                shell: shell,
                cwd: cwd
            });

            // Forward data from PTY to renderer
            this.ptyProcess.onData((data) => {
                if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                    this.mainWindow.webContents.send('terminal:data', data);
                }
            });

            // Handle PTY exit
            this.ptyProcess.onExit(({ exitCode, signal }) => {
                console.log('PTY exited:', { exitCode, signal });
                if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                    this.mainWindow.webContents.send('terminal:exit', { exitCode, signal });
                }
            });

            return {
                pid: this.ptyProcess.pid,
                cols: options.cols || 80,
                rows: options.rows || 24
            };
        });

        // Write data to PTY
        ipcMain.on('terminal:write', (event, data) => {
            if (this.ptyProcess) {
                this.ptyProcess.write(data);
            }
        });

        // Resize PTY
        ipcMain.on('terminal:resize', (event, { cols, rows }) => {
            if (this.ptyProcess) {
                try {
                    this.ptyProcess.resize(cols, rows);
                } catch (error) {
                    console.error('Failed to resize PTY:', error);
                }
            }
        });

        // Get terminal info
        ipcMain.handle('terminal:info', () => {
            return {
                platform: process.platform,
                shell: process.env.SHELL || 'bash',
                home: process.env.HOME || os.homedir(),
                user: process.env.USER || os.userInfo().username,
                hostname: os.hostname()
            };
        });
    }

    init() {
        app.whenReady().then(() => {
            this.setupIPCHandlers();
            this.createMainWindow();

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

        // Clean up on quit
        app.on('before-quit', () => {
            if (this.ptyProcess) {
                this.ptyProcess.kill();
            }
        });
    }
}

// Start the application
const terminalApp = new NebulaTerminalApp();
terminalApp.init();
