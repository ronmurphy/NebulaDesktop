const { contextBridge, ipcRenderer } = require('electron');

// Expose protected APIs to the renderer process
contextBridge.exposeInMainWorld('terminal', {
    // Create PTY terminal
    create: (options) => ipcRenderer.invoke('terminal:create', options),

    // Write data to PTY
    write: (data) => ipcRenderer.send('terminal:write', data),

    // Resize PTY
    resize: (cols, rows) => ipcRenderer.send('terminal:resize', { cols, rows }),

    // Get terminal info
    info: () => ipcRenderer.invoke('terminal:info'),

    // Listen for data from PTY
    onData: (callback) => {
        ipcRenderer.on('terminal:data', (event, data) => callback(data));
    },

    // Listen for terminal exit
    onExit: (callback) => {
        ipcRenderer.on('terminal:exit', (event, data) => callback(data));
    },

    // Remove listeners
    removeDataListener: () => {
        ipcRenderer.removeAllListeners('terminal:data');
    },

    removeExitListener: () => {
        ipcRenderer.removeAllListeners('terminal:exit');
    }
});
