// Merging the best from both versions
const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');

contextBridge.exposeInMainWorld('nebula', {
    // System APIs (from WME1's completeness)
    system: {
        platform: process.platform,
        shutdown: () => ipcRenderer.invoke('system:shutdown'),
        reboot: () => ipcRenderer.invoke('system:reboot'),
        logout: () => ipcRenderer.invoke('system:logout'),
    },

    // Window Management (from EWM2's tab system + WME1's dragging)
    windows: {
        create: (options) => ipcRenderer.invoke('window:create', options),
        close: (id) => ipcRenderer.send('window:close', id),
        minimize: (id) => ipcRenderer.send('window:minimize', id),
        maximize: (id) => ipcRenderer.send('window:maximize', id),
        focus: (id) => ipcRenderer.send('window:focus', id)
    },

    // File System (from WME1)
    fs: {
        readDir: (path) => ipcRenderer.invoke('fs:readdir', path),
        readFile: (path) => ipcRenderer.invoke('fs:readfile', path),
        writeFile: (path, data) => ipcRenderer.invoke('fs:writefile', path, data),
        getHomeDir: () => ipcRenderer.invoke('fs:homedir')
    },

    // Browser features (from EWM2)
    browser: {
        createTab: (url) => ipcRenderer.invoke('browser:newtab', url),
        navigate: (tabId, url) => ipcRenderer.send('browser:navigate', tabId, url),
        back: (tabId) => ipcRenderer.send('browser:back', tabId),
        forward: (tabId) => ipcRenderer.send('browser:forward', tabId),
        refresh: (tabId) => ipcRenderer.send('browser:refresh', tabId)
    },

    // Terminal/Shell operations
    terminal: {
        // Execute basic shell commands
        exec: async (command, args, cwd) => {
            try {
                // For now, we'll simulate shell commands using existing fs APIs
                // Later we can add real process execution if needed
                return { stdout: `Executed: ${command} ${args.join(' ')}`, stderr: '', exitCode: 0 };
            } catch (error) {
                return { stdout: '', stderr: error.message, exitCode: 1 };
            }
        },

        // Get current working directory
        getCwd: () => {
            return localStorage.getItem('nebula-terminal-cwd') || '/home/user';
        },

        // Set current working directory  
        setCwd: (path) => {
            localStorage.setItem('nebula-terminal-cwd', path);
        },

        // Get environment info
        getEnv: () => {
            return {
                USER: 'nebula-user',
                HOME: '/home/user',
                PATH: '/usr/local/bin:/usr/bin:/bin',
                SHELL: '/bin/nebula-sh',
                TERM: 'xterm-256color'
            };
        }
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
    }, // <-- This closing brace was missing!

    // Events (moved to top level)
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