const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const os = require('os');
const { spawn } = require('child_process');

class NebulaTerminalApp {
    constructor() {
        this.mainWindow = null;
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
            this.mainWindow = null;
        });
    }

    setupIPCHandlers() {
        // File System Handlers
        ipcMain.handle('fs:readdir', async (event, dirPath) => {
            try {
                return await fs.readdir(dirPath);
            } catch (error) {
                throw new Error(`Failed to read directory: ${error.message}`);
            }
        });

        ipcMain.handle('fs:readfile', async (event, filePath) => {
            try {
                return await fs.readFile(filePath, 'utf8');
            } catch (error) {
                throw new Error(`Failed to read file: ${error.message}`);
            }
        });

        ipcMain.handle('fs:writefile', async (event, filePath, data) => {
            try {
                await fs.writeFile(filePath, data, 'utf8');
                return { success: true };
            } catch (error) {
                throw new Error(`Failed to write file: ${error.message}`);
            }
        });

        ipcMain.handle('fs:homedir', async () => {
            return os.homedir();
        });

        ipcMain.handle('fs:stat', async (event, filePath) => {
            try {
                const stats = await fs.stat(filePath);
                return {
                    isDirectory: stats.isDirectory(),
                    isFile: stats.isFile(),
                    size: stats.size,
                    mtime: stats.mtime,
                    birthtime: stats.birthtime,
                    mode: stats.mode
                };
            } catch (error) {
                throw new Error(`Failed to stat file: ${error.message}`);
            }
        });

        ipcMain.handle('fs:exists', async (event, filePath) => {
            try {
                await fs.access(filePath);
                return true;
            } catch {
                return false;
            }
        });

        ipcMain.handle('fs:mkdir', async (event, dirPath, options) => {
            try {
                await fs.mkdir(dirPath, options);
                return { success: true };
            } catch (error) {
                throw new Error(`Failed to create directory: ${error.message}`);
            }
        });

        ipcMain.handle('fs:rmdir', async (event, dirPath) => {
            try {
                await fs.rmdir(dirPath);
                return { success: true };
            } catch (error) {
                throw new Error(`Failed to remove directory: ${error.message}`);
            }
        });

        ipcMain.handle('fs:unlink', async (event, filePath) => {
            try {
                await fs.unlink(filePath);
                return { success: true };
            } catch (error) {
                throw new Error(`Failed to remove file: ${error.message}`);
            }
        });

        // Terminal Execution Handler
        ipcMain.handle('terminal:exec', async (event, command, args = [], options = {}) => {
            return new Promise((resolve) => {
                const cwd = options.cwd || os.homedir();

                // Spawn the process
                const proc = spawn(command, args, {
                    cwd: cwd,
                    shell: true,
                    env: process.env
                });

                let stdout = '';
                let stderr = '';

                proc.stdout.on('data', (data) => {
                    stdout += data.toString();
                });

                proc.stderr.on('data', (data) => {
                    stderr += data.toString();
                });

                proc.on('error', (error) => {
                    resolve({
                        stdout: '',
                        stderr: error.message,
                        exitCode: 1
                    });
                });

                proc.on('close', (exitCode) => {
                    resolve({
                        stdout: stdout.trim(),
                        stderr: stderr.trim(),
                        exitCode: exitCode || 0
                    });
                });

                // Timeout after 30 seconds
                setTimeout(() => {
                    if (!proc.killed) {
                        proc.kill();
                        resolve({
                            stdout: stdout.trim(),
                            stderr: 'Command timed out after 30 seconds',
                            exitCode: 124
                        });
                    }
                }, 30000);
            });
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
    }
}

// Start the application
const terminalApp = new NebulaTerminalApp();
terminalApp.init();
