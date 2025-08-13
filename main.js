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

        ipcMain.handle('system:reboot', () => {
            const { exec } = require('child_process');
            exec('systemctl reboot');
        });

        ipcMain.handle('system:logout', () => {
            app.quit();
        });

        // Window management
        ipcMain.handle('window:create', (event, options) => {
            return this.createAppWindow(options);
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

        ipcMain.handle('fs:readfile', async (event, filePath) => {
            try {
                const fs = require('fs').promises;
                return await fs.readFile(filePath, 'utf8');
            } catch (error) {
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
                await fs.mkdir(dirPath, options);
                return true;
            } catch (error) {
                throw error;
            }
        });

        ipcMain.handle('fs:rmdir', async (event, dirPath) => {
            try {
                const fs = require('fs').promises;
                await fs.rmdir(dirPath, { recursive: true });
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
                const os = require('os');
                
                return new Promise((resolve, reject) => {
                    // Determine the shell and command
                    let shell, shellArgs;
                    
                    if (os.platform() === 'win32') {
                        shell = 'cmd.exe';
                        shellArgs = ['/c', command, ...args];
                    } else {
                        shell = '/bin/sh';
                        shellArgs = ['-c', `${command} ${args.join(' ')}`];
                    }

                    const proc = spawn(shell, shellArgs, {
                        cwd: options.cwd || os.homedir(),
                        env: { ...process.env, ...options.env },
                        stdio: ['pipe', 'pipe', 'pipe']
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
                            stdout: stdout,
                            stderr: stderr,
                            exitCode: code || 0
                        });
                    });

                    proc.on('error', (error) => {
                        reject(error);
                    });

                    // Set a timeout to prevent hanging
                    setTimeout(() => {
                        if (!proc.killed) {
                            proc.kill();
                            reject(new Error('Command timeout'));
                        }
                    }, 30000); // 30 second timeout
                });
            } catch (error) {
                throw error;
            }
        });

        // Get system information
        ipcMain.handle('system:info', () => {
            const os = require('os');
            return {
                platform: os.platform(),
                arch: os.arch(),
                release: os.release(),
                hostname: os.hostname(),
                username: os.userInfo().username,
                shell: process.env.SHELL || '/bin/sh',
                home: os.homedir(),
                tmpdir: os.tmpdir()
            };
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