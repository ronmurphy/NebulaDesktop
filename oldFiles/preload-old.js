// Simple preload script
console.log('Preload script loaded successfully');
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