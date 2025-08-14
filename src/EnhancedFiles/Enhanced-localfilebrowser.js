// apps/localfilebrowser.js - Nebula Local Storage File Browser Application
// Enhanced file browser for managing both localStorage and real file system

class NebulaLocalFileBrowser {
    constructor() {
        this.currentPath = '/';
        this.mode = 'real'; // 'virtual' or 'real' - default to real file system
        this.virtualFileSystem = this.initializeVirtualFileSystem();
        this.windowId = null;
        this.realCurrentPath = null; // Track real file system path
        
        this.initializeRealFileSystem();
        this.createLocalFileBrowserWindow();
        this.loadDirectory(this.currentPath);
    }
    
    async initializeRealFileSystem() {
        // Initialize real file system access
        if (window.nebula && window.nebula.fs) {
            try {
                this.realCurrentPath = await window.nebula.fs.getHomeDir();
                if (this.mode === 'real') {
                    this.currentPath = this.realCurrentPath;
                }
            } catch (error) {
                console.warn('Real file system not available, falling back to virtual mode:', error);
                this.mode = 'virtual';
            }
        } else {
            console.warn('Nebula file system API not available, using virtual mode');
            this.mode = 'virtual';
        }
    }
    
    initializeVirtualFileSystem() {
        // Initialize virtual file system in localStorage if it doesn't exist
        const vfsKey = 'nebula_virtual_fs';
        let vfs = JSON.parse(localStorage.getItem(vfsKey) || '{}');
        
        // Create default structure if empty
        if (Object.keys(vfs).length === 0) {
            vfs = {
                '/': {
                    type: 'directory',
                    children: ['Documents', 'Downloads', 'Pictures', 'Settings'],
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/Documents': {
                    type: 'directory',
                    children: ['welcome.txt', 'notes.md'],
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/Documents/welcome.txt': {
                    type: 'file',
                    content: 'Welcome to Nebula Enhanced File Browser!\n\nThis browser can access both virtual files (localStorage) and real files on your system.\n\nUse the mode toggle to switch between virtual and real file systems.',
                    size: 200,
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/Documents/notes.md': {
                    type: 'file',
                    content: '# My Notes\n\n- This is a markdown file\n- You can edit this content\n- Changes are saved to localStorage\n- Switch to Real mode to access actual files',
                    size: 140,
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/Downloads': {
                    type: 'directory',
                    children: [],
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/Pictures': {
                    type: 'directory',
                    children: [],
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/Settings': {
                    type: 'directory',
                    children: ['config.json'],
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                },
                '/Settings/config.json': {
                    type: 'file',
                    content: '{\n  "theme": "nebula-slate",\n  "autoSave": true,\n  "showHiddenFiles": false,\n  "fileSystemMode": "virtual"\n}',
                    size: 95,
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                }
            };
            localStorage.setItem(vfsKey, JSON.stringify(vfs));
        }
        
        return vfs;
    }
    
    saveVirtualFileSystem() {
        localStorage.setItem('nebula_virtual_fs', JSON.stringify(this.virtualFileSystem));
    }
    
    createLocalFileBrowserWindow() {
        // Use WindowManager to create the window
        this.windowId = window.windowManager.createWindow({
            title: '💾 Enhanced File Browser',
            icon: '💾',
            width: 1000,
            height: 650,
            resizable: true,
            maximizable: true,
            minimizable: true
        });

        // Get the window content area
        const windowData = window.windowManager.windows.get(this.windowId);
        const contentArea = windowData.element.querySelector('.window-content');
        
        // Create the file browser content
        contentArea.innerHTML = `
            <div class="localfilebrowser-container">
                <div class="localfilebrowser-toolbar">
                    <div class="mode-toggle">
                        <button class="mode-btn ${this.mode === 'virtual' ? 'active' : ''}" id="virtual-mode-${this.windowId}" title="Virtual File System (localStorage)">
                            💾 Virtual
                        </button>
                        <button class="mode-btn ${this.mode === 'real' ? 'active' : ''}" id="real-mode-${this.windowId}" title="Real File System">
                            🗂️ Real
                        </button>
                    </div>
                    <div class="nav-controls">
                        <button class="nav-back" id="back-${this.windowId}" title="Back">←</button>
                        <button class="nav-forward" id="forward-${this.windowId}" title="Forward">→</button>
                        <button class="nav-up" id="up-${this.windowId}" title="Up">↑</button>
                        <div class="path-bar">
                            <input type="text" class="path-input" id="path-${this.windowId}" value="${this.currentPath}">
                        </div>
                        <button class="nav-refresh" id="refresh-${this.windowId}" title="Refresh">⟳</button>
                        <button class="new-folder-btn" id="newfolder-${this.windowId}" title="New Folder">📁+</button>
                        <button class="new-file-btn" id="newfile-${this.windowId}" title="New File">📄+</button>
                    </div>
                </div>
                <div class="localfilebrowser-content">
                    <div class="sidebar">
                        <div class="sidebar-section">
                            <h3>Quick Access</h3>
                            <div class="sidebar-item" data-path="/">
                                <span class="icon">🏠</span>
                                <span class="label">Home</span>
                            </div>
                            <div class="sidebar-item" data-path="/Documents">
                                <span class="icon">📄</span>
                                <span class="label">Documents</span>
                            </div>
                            <div class="sidebar-item" data-path="/Downloads">
                                <span class="icon">📥</span>
                                <span class="label">Downloads</span>
                            </div>
                            <div class="sidebar-item" data-path="/Pictures">
                                <span class="icon">🖼️</span>
                                <span class="label">Pictures</span>
                            </div>
                            <div class="sidebar-item" data-path="/Settings">
                                <span class="icon">⚙️</span>
                                <span class="label">Settings</span>
                            </div>
                        </div>
                        <div class="sidebar-section">
                            <h3>Storage Info</h3>
                            <div class="storage-info">
                                <div class="storage-item">
                                    <span class="label">Mode:</span>
                                    <span class="value" id="storage-mode-${this.windowId}">${this.mode}</span>
                                </div>
                                <div class="storage-item">
                                    <span class="label">Used:</span>
                                    <span class="value" id="storage-used-${this.windowId}">0 KB</span>
                                </div>
                                <div class="storage-item">
                                    <span class="label">Available:</span>
                                    <span class="value" id="storage-available-${this.windowId}">~5 MB</span>
                                </div>
                                <div class="storage-item">
                                    <span class="label">Files:</span>
                                    <span class="value" id="file-count-${this.windowId}">0</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="file-list-container">
                        <div class="file-list-header">
                            <div>Icon</div>
                            <div>Name</div>
                            <div>Type</div>
                            <div>Size</div>
                            <div>Modified</div>
                            <div>Actions</div>
                        </div>
                        <div class="file-list" id="file-list-${this.windowId}">
                            <div class="loading">Loading files...</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners();
        this.updateStorageInfo();
    }
    
    async loadDirectory(path) {
        const fileList = document.getElementById(`file-list-${this.windowId}`);
        fileList.innerHTML = '<div class="loading">Loading files...</div>';
        
        try {
            let items;
            if (this.mode === 'virtual') {
                items = this.getVirtualDirectoryContents(path);
            } else {
                items = await this.getRealDirectoryContents(path);
            }
            
            this.displayFiles(items);
            this.currentPath = path;
            document.getElementById(`path-${this.windowId}`).value = path;
            this.updateStorageInfo();
        } catch (error) {
            console.error('Error loading directory:', error);
            fileList.innerHTML = `<div class="error">Error loading directory: ${error.message}</div>`;
        }
    }
    
    getVirtualDirectoryContents(path) {
        const items = [];
        
        // Add parent directory if not at root
        if (path !== '/') {
            items.push({
                name: '..',
                type: 'parent',
                size: '',
                modified: new Date(),
                path: this.getParentPath(path)
            });
        }
        
        // Get current directory info
        const currentDir = this.virtualFileSystem[path];
        if (!currentDir || currentDir.type !== 'directory') {
            return items;
        }
        
        // Add children
        currentDir.children.forEach(childName => {
            const childPath = path === '/' ? `/${childName}` : `${path}/${childName}`;
            const childInfo = this.virtualFileSystem[childPath];
            
            if (childInfo) {
                items.push({
                    name: childName,
                    type: childInfo.type,
                    size: childInfo.type === 'file' ? this.formatFileSize(childInfo.size) : '',
                    modified: new Date(childInfo.modified),
                    path: childPath,
                    content: childInfo.content
                });
            }
        });
        
        return items;
    }

    async getRealDirectoryContents(path) {
        const items = [];
        
        // Check if we have file system access
        if (!window.nebula?.fs?.readDir) {
            throw new Error('Real file system access not available. Please run as Electron app.');
        }

        try {
            // Add parent directory if not at root
            if (path !== '/' && path !== '') {
                items.push({
                    name: '..',
                    type: 'parent',
                    size: '',
                    modified: new Date(),
                    path: this.getParentPath(path)
                });
            }

            // Read directory contents
            const files = await window.nebula.fs.readDir(path);
            
            for (const file of files) {
                try {
                    const filePath = path === '/' ? `/${file}` : `${path}/${file}`;
                    const stats = await window.nebula.fs.stat(filePath);
                    
                    items.push({
                        name: file,
                        type: stats.isDirectory() ? 'directory' : 'file',
                        size: stats.isFile() ? this.formatFileSize(stats.size) : '',
                        modified: new Date(stats.mtime),
                        path: filePath
                    });
                } catch (statError) {
                    console.warn(`Could not stat file ${file}:`, statError);
                    // Add file anyway with minimal info
                    items.push({
                        name: file,
                        type: 'file',
                        size: 'Unknown',
                        modified: new Date(),
                        path: path === '/' ? `/${file}` : `${path}/${file}`
                    });
                }
            }
        } catch (error) {
            console.error('Error reading real directory:', error);
            throw new Error(`Cannot access directory: ${error.message}`);
        }
        
        return items;
    }
    
    getDirectoryContents(path) {
        // Legacy method - redirect to appropriate method based on mode
        if (this.mode === 'virtual') {
            return this.getVirtualDirectoryContents(path);
        } else {
            // For synchronous calls, return empty and load async
            this.getRealDirectoryContents(path).then(items => {
                this.displayFiles(items);
            }).catch(error => {
                console.error('Error in async directory load:', error);
            });
            return [];
        }
    }
    
    displayFiles(items) {
        const fileList = document.getElementById(`files-${this.windowId}`);
        
        fileList.innerHTML = items.map(item => {
            const icon = this.getFileIcon(item);
            const sizeText = item.size || '';
            const timeText = item.modified.toLocaleDateString() + ' ' + item.modified.toLocaleTimeString();
            
            return `
                <div class="file-item ${item.type}" data-name="${item.name}" data-type="${item.type}" data-path="${item.path}">
                    <div class="file-icon">${icon}</div>
                    <div class="file-name">${item.name}</div>
                    <div class="file-type">${item.type}</div>
                    <div class="file-size">${sizeText}</div>
                    <div class="file-modified">${timeText}</div>
                    <div class="file-actions">
                        ${item.type !== 'parent' ? `
                            <button class="action-btn edit-btn" title="Edit" data-path="${item.path}">✏️</button>
                            <button class="action-btn delete-btn" title="Delete" data-path="${item.path}">🗑️</button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        // Setup file item handlers
        this.setupFileItemHandlers();
    }
    
    setupFileItemHandlers() {
        const fileList = document.getElementById(`files-${this.windowId}`);
        
        // Double-click to open
        fileList.querySelectorAll('.file-item').forEach(item => {
            item.addEventListener('dblclick', () => {
                this.openFile(item.dataset.path, item.dataset.type);
            });
        });
        
        // Action buttons
        fileList.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.editFile(btn.dataset.path);
            });
        });
        
        fileList.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteFile(btn.dataset.path);
            });
        });
    }
    
    openFile(path, type) {
        if (type === 'directory' || type === 'parent') {
            this.loadDirectory(path);
        } else if (type === 'file') {
            this.viewFile(path);
        }
    }
    
    async viewFile(path) {
        let content = '';
        let fileName = path.split('/').pop();
        
        try {
            if (this.mode === 'virtual') {
                const fileInfo = this.virtualFileSystem[path];
                if (!fileInfo) return;
                content = fileInfo.content;
            } else {
                // Read real file
                if (!window.nebula?.fs?.readFile) {
                    throw new Error('Real file system access not available');
                }
                content = await window.nebula.fs.readFile(path);
            }
        } catch (error) {
            content = `Error reading file: ${error.message}`;
        }
        
        // Create a simple file viewer modal
        const modal = document.createElement('div');
        modal.className = 'file-viewer-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>📄 ${fileName}</h3>
                    <button class="modal-close">×</button>
                </div>
                <div class="modal-body">
                    <textarea class="file-content" readonly>${content}</textarea>
                </div>
                <div class="modal-footer">
                    <button class="btn edit-file-btn">Edit</button>
                    <button class="btn close-modal-btn">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Setup modal handlers
        modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
        modal.querySelector('.close-modal-btn').addEventListener('click', () => modal.remove());
        modal.querySelector('.edit-file-btn').addEventListener('click', () => {
            modal.remove();
            this.editFile(path);
        });
        
        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }
    
    async editFile(path) {
        let content = '';
        let fileName = path.split('/').pop();
        
        try {
            if (this.mode === 'virtual') {
                const fileInfo = this.virtualFileSystem[path];
                if (!fileInfo) return;
                content = fileInfo.content;
            } else {
                // Read real file
                if (!window.nebula?.fs?.readFile) {
                    throw new Error('Real file system access not available');
                }
                content = await window.nebula.fs.readFile(path);
            }
        } catch (error) {
            content = `Error reading file: ${error.message}`;
        }
        
        // Create file editor modal
        const modal = document.createElement('div');
        modal.className = 'file-editor-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>✏️ Edit ${fileName}</h3>
                    <button class="modal-close">×</button>
                </div>
                <div class="modal-body">
                    <textarea class="file-content-editor" placeholder="File content...">${content}</textarea>
                </div>
                <div class="modal-footer">
                    <button class="btn save-file-btn">Save</button>
                    <button class="btn cancel-edit-btn">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const textarea = modal.querySelector('.file-content-editor');
        textarea.focus();
        
        // Setup modal handlers
        modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
        modal.querySelector('.cancel-edit-btn').addEventListener('click', () => modal.remove());
        modal.querySelector('.save-file-btn').addEventListener('click', async () => {
            await this.saveFile(path, textarea.value);
            modal.remove();
            this.loadDirectory(this.currentPath); // Refresh
        });
        
        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }
    
    async saveFile(path, content) {
        try {
            if (this.mode === 'virtual') {
                if (this.virtualFileSystem[path]) {
                    this.virtualFileSystem[path].content = content;
                    this.virtualFileSystem[path].size = content.length;
                    this.virtualFileSystem[path].modified = new Date().toISOString();
                    this.saveVirtualFileSystem();
                    this.updateStorageInfo();
                }
            } else {
                // Write to real file
                if (!window.nebula?.fs?.writeFile) {
                    throw new Error('Real file system write access not available');
                }
                await window.nebula.fs.writeFile(path, content);
                console.log(`File saved: ${path}`);
            }
        } catch (error) {
            alert(`Error saving file: ${error.message}`);
            console.error('Save error:', error);
        }
    }
    
    async deleteFile(path) {
        if (!confirm(`Are you sure you want to delete "${path.split('/').pop()}"?`)) {
            return;
        }
        
        try {
            if (this.mode === 'virtual') {
                const parentPath = this.getParentPath(path);
                const fileName = path.split('/').pop();
                
                // Remove from parent directory
                const parentDir = this.virtualFileSystem[parentPath];
                if (parentDir && parentDir.children) {
                    parentDir.children = parentDir.children.filter(child => child !== fileName);
                }
                
                // Remove the file/directory itself
                delete this.virtualFileSystem[path];
                
                // If it's a directory, remove all children recursively
                Object.keys(this.virtualFileSystem).forEach(key => {
                    if (key.startsWith(path + '/')) {
                        delete this.virtualFileSystem[key];
                    }
                });
                
                this.saveVirtualFileSystem();
            } else {
                // Delete real file/directory
                if (!window.nebula?.fs) {
                    throw new Error('Real file system access not available');
                }
                
                const stats = await window.nebula.fs.stat(path);
                if (stats.isDirectory()) {
                    await window.nebula.fs.rmdir(path);
                } else {
                    await window.nebula.fs.unlink(path);
                }
                console.log(`Deleted: ${path}`);
            }
            
            this.loadDirectory(this.currentPath);
            this.updateStorageInfo();
        } catch (error) {
            alert(`Error deleting file: ${error.message}`);
            console.error('Delete error:', error);
        }
    }
    
    async createNewFolder() {
        const folderName = prompt('Enter folder name:');
        if (!folderName) return;
        
        const newPath = this.currentPath === '/' ? `/${folderName}` : `${this.currentPath}/${folderName}`;
        
        try {
            if (this.mode === 'virtual') {
                // Check if already exists
                if (this.virtualFileSystem[newPath]) {
                    alert('A file or folder with this name already exists.');
                    return;
                }
                
                // Create folder
                this.virtualFileSystem[newPath] = {
                    type: 'directory',
                    children: [],
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                };
                
                // Add to parent directory
                const currentDir = this.virtualFileSystem[this.currentPath];
                if (currentDir && currentDir.children) {
                    currentDir.children.push(folderName);
                }
                
                this.saveVirtualFileSystem();
            } else {
                // Create real directory
                if (!window.nebula?.fs?.mkdir) {
                    throw new Error('Real file system access not available');
                }
                
                await window.nebula.fs.mkdir(newPath, { recursive: false });
                console.log(`Created directory: ${newPath}`);
            }
            
            this.loadDirectory(this.currentPath);
        } catch (error) {
            alert(`Error creating folder: ${error.message}`);
            console.error('Create folder error:', error);
        }
    }
    
    async createNewFile() {
        const fileName = prompt('Enter file name:');
        if (!fileName) return;
        
        const newPath = this.currentPath === '/' ? `/${fileName}` : `${this.currentPath}/${fileName}`;
        
        try {
            if (this.mode === 'virtual') {
                // Check if already exists
                if (this.virtualFileSystem[newPath]) {
                    alert('A file or folder with this name already exists.');
                    return;
                }
                
                // Create file
                this.virtualFileSystem[newPath] = {
                    type: 'file',
                    content: '',
                    size: 0,
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                };
                
                // Add to parent directory
                const currentDir = this.virtualFileSystem[this.currentPath];
                if (currentDir && currentDir.children) {
                    currentDir.children.push(fileName);
                }
                
                this.saveVirtualFileSystem();
            } else {
                // Create real file
                if (!window.nebula?.fs?.writeFile) {
                    throw new Error('Real file system access not available');
                }
                
                await window.nebula.fs.writeFile(newPath, '');
                console.log(`Created file: ${newPath}`);
            }
            
            this.loadDirectory(this.currentPath);
            
            // Open for editing
            setTimeout(() => this.editFile(newPath), 100);
        } catch (error) {
            alert(`Error creating file: ${error.message}`);
            console.error('Create file error:', error);
        }
    }
    
    getFileIcon(item) {
        if (item.type === 'directory') return '📁';
        if (item.type === 'parent') return '📁';
        
        const name = item.name.toLowerCase();
        if (name.endsWith('.txt')) return '📄';
        if (name.endsWith('.md')) return '📝';
        if (name.endsWith('.js')) return '📜';
        if (name.endsWith('.html')) return '🌐';
        if (name.endsWith('.css')) return '🎨';
        if (name.endsWith('.json')) return '⚙️';
        if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.gif')) return '🖼️';
        if (name.endsWith('.zip') || name.endsWith('.tar')) return '🗜️';
        return '📄';
    }
    
    getParentPath(path) {
        if (path === '/') return '/';
        const parts = path.split('/');
        parts.pop();
        return parts.join('/') || '/';
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
    
    updateStorageInfo() {
        const vfsData = localStorage.getItem('nebula_virtual_fs');
        const usedBytes = vfsData ? vfsData.length : 0;
        const usedFormatted = this.formatFileSize(usedBytes);
        
        const usedElement = document.getElementById(`storage-used-${this.windowId}`);
        if (usedElement) {
            usedElement.textContent = usedFormatted;
        }
    }
    
    setupEventListeners() {
        // Mode toggle buttons
        document.getElementById(`virtual-mode-${this.windowId}`).addEventListener('click', () => {
            this.switchMode('virtual');
        });
        
        document.getElementById(`real-mode-${this.windowId}`).addEventListener('click', () => {
            this.switchMode('real');
        });
        
        // Navigation buttons
        document.getElementById(`back-${this.windowId}`).addEventListener('click', () => {
            alert('Navigation history not implemented yet');
        });
        
        document.getElementById(`forward-${this.windowId}`).addEventListener('click', () => {
            alert('Navigation history not implemented yet');
        });
        
        document.getElementById(`up-${this.windowId}`).addEventListener('click', () => {
            if (this.currentPath !== '/') {
                const parentPath = this.getParentPath(this.currentPath);
                this.loadDirectory(parentPath);
            }
        });
        
        document.getElementById(`refresh-${this.windowId}`).addEventListener('click', () => {
            this.loadDirectory(this.currentPath);
        });
        
        document.getElementById(`newfolder-${this.windowId}`).addEventListener('click', () => {
            this.createNewFolder();
        });
        
        document.getElementById(`newfile-${this.windowId}`).addEventListener('click', () => {
            this.createNewFile();
        });
        
        // Path input
        const pathInput = document.getElementById(`path-${this.windowId}`);
        pathInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.loadDirectory(pathInput.value);
            }
        });
        
        // Sidebar navigation
        const windowData = window.windowManager.windows.get(this.windowId);
        const contentArea = windowData.element.querySelector('.window-content');
        
        contentArea.querySelectorAll('.sidebar-item').forEach(item => {
            item.addEventListener('click', () => {
                const path = item.dataset.path;
                this.loadDirectory(path);
            });
        });
    }
    
    async switchMode(newMode) {
        if (this.mode === newMode) return;
        
        this.mode = newMode;
        
        // Update UI
        document.getElementById(`virtual-mode-${this.windowId}`).classList.toggle('active', newMode === 'virtual');
        document.getElementById(`real-mode-${this.windowId}`).classList.toggle('active', newMode === 'real');
        document.getElementById(`storage-mode-${this.windowId}`).textContent = newMode;
        
        // Switch to appropriate starting path
        if (newMode === 'real') {
            if (window.nebula?.fs?.getHomeDir) {
                try {
                    this.realCurrentPath = await window.nebula.fs.getHomeDir();
                    this.currentPath = this.realCurrentPath;
                } catch (error) {
                    console.warn('Could not get home directory, staying in current path');
                }
            } else {
                alert('Real file system access not available. Please run as Electron app.');
                // Switch back to virtual mode
                this.mode = 'virtual';
                document.getElementById(`virtual-mode-${this.windowId}`).classList.add('active');
                document.getElementById(`real-mode-${this.windowId}`).classList.remove('active');
                document.getElementById(`storage-mode-${this.windowId}`).textContent = 'virtual';
                return;
            }
        } else {
            this.currentPath = '/';
        }
        
        // Reload directory with new mode
        await this.loadDirectory(this.currentPath);
    }
    
    setupWindowDragging(windowEl) {
        // WindowManager handles this automatically
    }
}

// Export for use in other files
window.NebulaLocalFileBrowser = NebulaLocalFileBrowser;

