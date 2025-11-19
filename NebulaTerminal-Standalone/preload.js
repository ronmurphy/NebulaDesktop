const { contextBridge, ipcRenderer } = require('electron');

// Expose protected APIs to the renderer process
contextBridge.exposeInMainWorld('terminal', {
    // Create PTY terminal (returns { id, ... })
    create: (options) => ipcRenderer.invoke('terminal:create', options),

    // Write data to specific PTY
    write: (ptyId, data) => ipcRenderer.send('terminal:write', { ptyId, data }),

    // Resize specific PTY
    resize: (ptyId, cols, rows) => ipcRenderer.send('terminal:resize', { ptyId, cols, rows }),

    // Kill specific PTY
    kill: (ptyId) => ipcRenderer.invoke('terminal:kill', ptyId),

    // Get terminal info
    info: () => ipcRenderer.invoke('terminal:info'),

    // Listen for data from specific PTY
    onData: (ptyId, callback) => {
        const handler = (event, data) => {
            if (data.ptyId === ptyId) {
                callback(data.data);
            }
        };
        ipcRenderer.on('terminal:data', handler);
        return () => ipcRenderer.removeListener('terminal:data', handler);
    },

    // Listen for terminal exit
    onExit: (ptyId, callback) => {
        const handler = (event, data) => {
            if (data.ptyId === ptyId) {
                callback(data);
            }
        };
        ipcRenderer.on('terminal:exit', handler);
        return () => ipcRenderer.removeListener('terminal:exit', handler);
    },

    // Remove all listeners
    removeAllListeners: () => {
        ipcRenderer.removeAllListeners('terminal:data');
        ipcRenderer.removeAllListeners('terminal:exit');
    }
});

// Expose menu event listeners
contextBridge.exposeInMainWorld('menuEvents', {
    onOpenSettings: (callback) => {
        ipcRenderer.on('menu:open-settings', callback);
    },
    onThemeSwitcher: (callback) => {
        ipcRenderer.on('menu:theme-switcher', callback);
    },
    onCopy: (callback) => {
        ipcRenderer.on('menu:copy', callback);
    },
    onPaste: (callback) => {
        ipcRenderer.on('menu:paste', callback);
    },
    onFind: (callback) => {
        ipcRenderer.on('menu:find', callback);
    },
    onFontIncrease: (callback) => {
        ipcRenderer.on('menu:font-increase', callback);
    },
    onFontDecrease: (callback) => {
        ipcRenderer.on('menu:font-decrease', callback);
    },
    onFontReset: (callback) => {
        ipcRenderer.on('menu:font-reset', callback);
    },
    onAbout: (callback) => {
        ipcRenderer.on('menu:about', callback);
    }
});
