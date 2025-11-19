const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs').promises;
const pty = require('node-pty');

class NebulaTerminalApp {
    constructor() {
        this.mainWindow = null;
        this.ptyProcesses = new Map(); // Map of ptyId -> ptyProcess
        this.nextPtyId = 1;
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
                preload: path.join(__dirname, 'preload.js'),
                webviewTag: true  // Enable webview for niw command
            }
        });

        this.mainWindow.loadFile('index.html');

        // Set custom menu
        this.createMenu();

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

    createMenu() {
        const template = [
            {
                label: 'File',
                submenu: [
                    {
                        label: 'New Tab',
                        accelerator: 'CmdOrCtrl+T',
                        click: () => {
                            this.mainWindow.webContents.send('menu:new-tab');
                        }
                    },
                    { type: 'separator' },
                    {
                        label: 'Layout',
                        submenu: [
                            {
                                label: 'Save Layout',
                                click: () => {
                                    this.mainWindow.webContents.send('menu:save-layout');
                                }
                            },
                            {
                                label: 'Load Layout',
                                click: () => {
                                    this.mainWindow.webContents.send('menu:load-layout');
                                }
                            },
                            { type: 'separator' },
                            {
                                label: 'Export Layout to JSON...',
                                click: () => {
                                    this.mainWindow.webContents.send('menu:export-layout');
                                }
                            },
                            {
                                label: 'Import Layout from JSON...',
                                click: () => {
                                    this.mainWindow.webContents.send('menu:import-layout');
                                }
                            }
                        ]
                    },
                    { type: 'separator' },
                    {
                        label: 'Quit',
                        accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Alt+F4',
                        click: () => {
                            app.quit();
                        }
                    }
                ]
            },
            {
                label: 'Edit',
                submenu: [
                    {
                        label: 'Copy',
                        accelerator: 'CmdOrCtrl+Shift+C',
                        click: () => {
                            this.mainWindow.webContents.send('menu:copy');
                        }
                    },
                    {
                        label: 'Paste',
                        accelerator: 'CmdOrCtrl+Shift+V',
                        click: () => {
                            this.mainWindow.webContents.send('menu:paste');
                        }
                    },
                    { type: 'separator' },
                    {
                        label: 'Find',
                        accelerator: 'CmdOrCtrl+Shift+F',
                        click: () => {
                            this.mainWindow.webContents.send('menu:find');
                        }
                    }
                ]
            },
            {
                label: 'View',
                submenu: [
                    {
                        label: 'Increase Font Size',
                        accelerator: 'CmdOrCtrl+Plus',
                        click: () => {
                            this.mainWindow.webContents.send('menu:font-increase');
                        }
                    },
                    {
                        label: 'Decrease Font Size',
                        accelerator: 'CmdOrCtrl+-',
                        click: () => {
                            this.mainWindow.webContents.send('menu:font-decrease');
                        }
                    },
                    {
                        label: 'Reset Font Size',
                        accelerator: 'CmdOrCtrl+0',
                        click: () => {
                            this.mainWindow.webContents.send('menu:font-reset');
                        }
                    },
                    { type: 'separator' },
                    {
                        label: 'Reload',
                        accelerator: 'CmdOrCtrl+R',
                        click: () => {
                            this.mainWindow.reload();
                        }
                    },
                    {
                        label: 'Toggle Developer Tools',
                        accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
                        click: () => {
                            this.mainWindow.webContents.toggleDevTools();
                        }
                    }
                ]
            },
            {
                label: 'Settings',
                submenu: [
                    {
                        label: 'Open Settings',
                        accelerator: 'CmdOrCtrl+,',
                        click: () => {
                            this.mainWindow.webContents.send('menu:open-settings');
                        }
                    },
                    {
                        label: 'Theme Switcher',
                        accelerator: 'CmdOrCtrl+T',
                        click: () => {
                            this.mainWindow.webContents.send('menu:theme-switcher');
                        }
                    }
                ]
            },
            {
                label: 'Help',
                submenu: [
                    {
                        label: 'About Nebula Terminal',
                        click: () => {
                            this.mainWindow.webContents.send('menu:about');
                        }
                    },
                    {
                        label: 'Documentation',
                        click: () => {
                            require('electron').shell.openExternal('https://github.com/ronmurphy/NebulaDesktop');
                        }
                    }
                ]
            }
        ];

        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
    }

    setupIPCHandlers() {
        // Create PTY process
        ipcMain.handle('terminal:create', (event, options = {}) => {
            const shell = process.env.SHELL || (process.platform === 'win32' ? 'powershell.exe' : 'bash');
            const cwd = options.cwd || process.env.HOME || os.homedir();
            const ptyId = this.nextPtyId++;

            // Create PTY process
            const ptyProcess = pty.spawn(shell, [], {
                name: 'xterm-256color',
                cols: options.cols || 80,
                rows: options.rows || 24,
                cwd: cwd,
                env: process.env
            });

            // Store PTY process
            this.ptyProcesses.set(ptyId, ptyProcess);

            console.log(`PTY ${ptyId} created:`, {
                pid: ptyProcess.pid,
                shell: shell,
                cwd: cwd
            });

            // Forward data from PTY to renderer with ptyId
            ptyProcess.onData((data) => {
                if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                    this.mainWindow.webContents.send('terminal:data', { ptyId, data });
                }
            });

            // Handle PTY exit
            ptyProcess.onExit(({ exitCode, signal }) => {
                console.log(`PTY ${ptyId} exited:`, { exitCode, signal });
                if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                    this.mainWindow.webContents.send('terminal:exit', { ptyId, exitCode, signal });
                }
                this.ptyProcesses.delete(ptyId);
            });

            return {
                id: ptyId,
                pid: ptyProcess.pid,
                cols: options.cols || 80,
                rows: options.rows || 24
            };
        });

        // Write data to specific PTY
        ipcMain.on('terminal:write', (event, { ptyId, data }) => {
            const ptyProcess = this.ptyProcesses.get(ptyId);
            if (ptyProcess) {
                ptyProcess.write(data);
            }
        });

        // Resize specific PTY
        ipcMain.on('terminal:resize', (event, { ptyId, cols, rows }) => {
            const ptyProcess = this.ptyProcesses.get(ptyId);
            if (ptyProcess) {
                try {
                    ptyProcess.resize(cols, rows);
                } catch (error) {
                    console.error(`Failed to resize PTY ${ptyId}:`, error);
                }
            }
        });

        // Kill specific PTY
        ipcMain.handle('terminal:kill', (event, ptyId) => {
            const ptyProcess = this.ptyProcesses.get(ptyId);
            if (ptyProcess) {
                try {
                    ptyProcess.kill();
                    this.ptyProcesses.delete(ptyId);
                    console.log(`PTY ${ptyId} killed`);
                    return { success: true };
                } catch (error) {
                    console.error(`Failed to kill PTY ${ptyId}:`, error);
                    return { success: false, error: error.message };
                }
            }
            return { success: false, error: 'PTY not found' };
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

        // File operations for inline utilities
        ipcMain.handle('file:read', async (event, filePath) => {
            try {
                const content = await fs.readFile(filePath, 'utf-8');
                return { success: true, content };
            } catch (error) {
                console.error('Failed to read file:', error);
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('file:save', async (event, { filePath, content }) => {
            try {
                await fs.writeFile(filePath, content, 'utf-8');
                return { success: true };
            } catch (error) {
                console.error('Failed to save file:', error);
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('file:select', async (event, extensions) => {
            try {
                const result = await dialog.showOpenDialog(this.mainWindow, {
                    properties: ['openFile'],
                    filters: extensions || [
                        { name: 'All Files', extensions: ['*'] }
                    ]
                });

                if (result.canceled || result.filePaths.length === 0) {
                    return { success: false, canceled: true };
                }

                return { success: true, filePath: result.filePaths[0] };
            } catch (error) {
                console.error('Failed to select file:', error);
                return { success: false, error: error.message };
            }
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
