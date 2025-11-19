const { contextBridge, ipcRenderer } = require('electron');

// Expose protected APIs to the renderer process
contextBridge.exposeInMainWorld('nebula', {
    // System information
    system: {
        platform: process.platform
    },

    // File System APIs
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

    // Terminal operations
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

        // Get environment info
        getEnv: () => {
            return {
                USER: process.env.USER || 'user',
                HOME: process.env.HOME || '/home/user',
                PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin',
                SHELL: process.env.SHELL || '/bin/bash',
                TERM: 'xterm-256color',
                PWD: localStorage.getItem('nebula-terminal-cwd') || process.env.HOME || '/home/user'
            };
        }
    }
});
