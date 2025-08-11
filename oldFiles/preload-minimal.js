// Minimal preload script for Nebula Desktop with essential functions
const { contextBridge, ipcRenderer } = require('electron');

// Expose essential APIs for Nebula Desktop
contextBridge.exposeInMainWorld('nebula', {
    // System APIs - needed for power menu
    system: {
        platform: process.platform,
        version: '3.0.0',
        shutdown: () => ipcRenderer.invoke('system:shutdown'),
        reboot: () => ipcRenderer.invoke('system:reboot'),
        logout: () => ipcRenderer.invoke('system:logout')
    },
    
    // Window Management - needed for app windows
    windows: {
        create: (options) => ipcRenderer.invoke('window:create', options),
        close: (id) => ipcRenderer.send('window:close', id),
        minimize: (id) => ipcRenderer.send('window:minimize', id),
        maximize: (id) => ipcRenderer.send('window:maximize', id),
        focus: (id) => ipcRenderer.send('window:focus', id)
    },
    
    // File System - needed for file manager
    fs: {
        readDir: (path) => ipcRenderer.invoke('fs:readdir', path),
        readFile: (path) => ipcRenderer.invoke('fs:readfile', path),
        writeFile: (path, data) => ipcRenderer.invoke('fs:writefile', path, data),
        getHomeDir: () => ipcRenderer.invoke('fs:homedir')
    },
    
    // Browser features - for enhanced browser functionality  
    browser: {
        createTab: (url) => ipcRenderer.invoke('browser:newtab', url),
        navigate: (tabId, url) => ipcRenderer.send('browser:navigate', tabId, url),
        back: (tabId) => ipcRenderer.send('browser:back', tabId),
        forward: (tabId) => ipcRenderer.send('browser:forward', tabId),
        refresh: (tabId) => ipcRenderer.send('browser:refresh', tabId)
    },
    
    // Events - for app communication
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
    },
    
    // Test function to verify preload is working
    test: () => {
        return 'Preload script loaded successfully with all functions!';
    }
});

console.log('Nebula preload script loaded with full functionality');
