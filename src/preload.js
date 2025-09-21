// NebulaDesktop Preload Script - Enhanced with Screenshot Support
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('nebula', {
    // System APIs
    system: {
        platform: process.platform,
        shutdown: () => ipcRenderer.invoke('system:shutdown'),
        reboot: () => ipcRenderer.invoke('system:reboot'),
        logout: () => ipcRenderer.invoke('system:logout'),
    },

    // Window Management
    windows: {
        create: (options) => ipcRenderer.invoke('window:create', options),
        close: (id) => ipcRenderer.send('window:close', id),
        minimize: (id) => ipcRenderer.send('window:minimize', id),
        maximize: (id) => ipcRenderer.send('window:maximize', id),
        focus: (id) => ipcRenderer.send('window:focus', id)
    },

    // File System (enhanced for terminal)
    fs: {
        readDir: (path) => ipcRenderer.invoke('fs:readdir', path),
        readFile: (path) => ipcRenderer.invoke('fs:readfile', path),
        writeFile: (path, data) => ipcRenderer.invoke('fs:writefile', path, data),
        getHomeDir: () => ipcRenderer.invoke('fs:homedir'),
        stat: (path) => ipcRenderer.invoke('fs:stat', path),
        exists: (path) => ipcRenderer.invoke('fs:exists', path),
        mkdir: (path, options) => ipcRenderer.invoke('fs:mkdir', path, options),
        rmdir: (path) => ipcRenderer.invoke('fs:rmdir', path),
        unlink: (path) => ipcRenderer.invoke('fs:unlink', path)
    },

    // Browser features
    browser: {
        createTab: (url) => ipcRenderer.invoke('browser:newtab', url),
        navigate: (tabId, url) => ipcRenderer.send('browser:navigate', tabId, url),
        back: (tabId) => ipcRenderer.send('browser:back', tabId),
        forward: (tabId) => ipcRenderer.send('browser:forward', tabId),
        refresh: (tabId) => ipcRenderer.send('browser:refresh', tabId)
    },

    // Terminal/Shell operations (enhanced)
    terminal: {
        // Execute shell commands
        exec: async (command, args = [], options = {}) => {
            try {
                return await ipcRenderer.invoke('terminal:exec', command, args, options);
            } catch (error) {
                return { stdout: '', stderr: error.message, exitCode: 1 };
            }
        },

        // Get current working directory
        getCwd: () => {
            return localStorage.getItem('nebula-terminal-cwd') || process.env.HOME || '/home/user';
        },

        // Set current working directory  
        setCwd: (path) => {
            localStorage.setItem('nebula-terminal-cwd', path);
        },

        // Get system info
        getSystemInfo: () => ipcRenderer.invoke('system:info'),

        // Get environment info
        getEnv: () => {
            return {
                USER: process.env.USER || 'nebula-user',
                HOME: process.env.HOME || '/home/user',
                PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin',
                SHELL: process.env.SHELL || '/bin/sh',
                TERM: 'xterm-256color',
                PWD: localStorage.getItem('nebula-terminal-cwd') || process.env.HOME || '/home/user'
            };
        }
    },

    // Native file dialogs
    dialog: {
        openFile: (options) => ipcRenderer.invoke('dialog:openFile', options),
        saveFile: (options) => ipcRenderer.invoke('dialog:saveFile', options)
    },

    // Code execution (for future debugger integration)
    code: {
        // Execute JavaScript code safely
        executeJS: (code) => {
            try {
                // Create a safe execution context
                const result = Function('"use strict"; return (' + code + ')')();
                return { result: result, error: null };
            } catch (error) {
                return { result: null, error: error.message };
            }
        },

        // Validate code syntax
        validateJS: (code) => {
            try {
                Function(code);
                return { valid: true, error: null };
            } catch (error) {
                return { valid: false, error: error.message };
            }
        }
    },

    // Ad Blocker API
    adBlocker: {
        getStatus: () => ipcRenderer.invoke('adblocker:get-status'),
        toggle: (enabled) => ipcRenderer.invoke('adblocker:toggle', enabled),
        refreshLists: () => ipcRenderer.invoke('adblocker:refresh-lists'),
        getStats: () => ipcRenderer.invoke('adblocker:get-stats')
    },

    // 🔸 SCREENSHOT API - NEW!
    screenshot: {
        // Capture entire screen
        captureScreen: () => ipcRenderer.invoke('screenshot:capture-screen'),
        
        // Capture specific area
        captureArea: (bounds) => ipcRenderer.invoke('screenshot:capture-area', bounds),
        
        // Get screen information
        getScreenInfo: () => ipcRenderer.invoke('screenshot:get-screen-info'),
        
        // Save screenshot to file
        saveToFile: (dataURL, filename) => ipcRenderer.invoke('screenshot:save-to-file', dataURL, filename)
    },

    // Events
    on: (channel, callback) => {
        const validChannels = [
            'window-created',
            'window-closed',
            'file-changed',
            'app-installed'
        ];
        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, (event, ...args) => callback(...args));
        }
    },

    removeListener: (channel, callback) => {
        ipcRenderer.removeListener(channel, callback);
    }
});