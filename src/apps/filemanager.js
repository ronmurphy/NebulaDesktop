// apps/filemanager.js - Nebula File Manager Application
// Simple file manager for the Nebula Desktop Environment

class NebulaFileManager {
    constructor(initialPath = '~') {
        this.currentPath = initialPath;
        this.windowId = `filemanager-${Date.now()}`;
        this.files = [];
        
        this.createFileManagerWindow();
        this.loadDirectory(this.currentPath);
    }
    
    createFileManagerWindow() {
        const windowEl = document.createElement('div');
        windowEl.className = 'filemanager-window app-window';
        windowEl.id = this.windowId;
        
        // Position in center
        const desktop = document.getElementById('desktop');
        const x = (desktop.offsetWidth - 900) / 2;
        const y = (desktop.offsetHeight - 600) / 2;
        windowEl.style.left = x + 'px';
        windowEl.style.top = y + 'px';
        
        windowEl.innerHTML = `
            <div class="window-titlebar">
                <span class="window-title">File Manager</span>
                <div class="window-controls">
                    <button class="window-button minimize" title="Minimize"></button>
                    <button class="window-button maximize" title="Maximize"></button>
                    <button class="window-button close" title="Close"></button>
                </div>
            </div>
            <div class="filemanager-container">
                <div class="filemanager-toolbar">
                    <button class="nav-back" id="back-${this.windowId}">←</button>
                    <button class="nav-forward" id="forward-${this.windowId}">→</button>
                    <button class="nav-up" id="up-${this.windowId}">↑</button>
                    <div class="path-bar">
                        <input type="text" class="path-input" id="path-${this.windowId}" value="${this.currentPath}">
                    </div>
                    <button class="nav-refresh" id="refresh-${this.windowId}">⟳</button>
                </div>
                <div class="filemanager-content">
                    <div class="sidebar">
                        <div class="sidebar-section">
                            <h3>Quick Access</h3>
                            <div class="sidebar-item" data-path="~">
                                <span class="icon">🏠</span>
                                <span class="label">Home</span>
                            </div>
                            <div class="sidebar-item" data-path="~/Desktop">
                                <span class="icon">🖥️</span>
                                <span class="label">Desktop</span>
                            </div>
                            <div class="sidebar-item" data-path="~/Documents">
                                <span class="icon">📄</span>
                                <span class="label">Documents</span>
                            </div>
                            <div class="sidebar-item" data-path="~/Downloads">
                                <span class="icon">⬇️</span>
                                <span class="label">Downloads</span>
                            </div>
                        </div>
                    </div>
                    <div class="file-list-container">
                        <div class="file-list" id="files-${this.windowId}">
                            <div class="loading">Loading files...</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('desktop').appendChild(windowEl);
        
        // Setup window controls
        this.setupWindowControls(windowEl);
        this.setupNavigation();
        this.setupSidebar();
        this.setupWindowDragging(windowEl);
    }
    
    async loadDirectory(path) {
        const fileList = document.getElementById(`files-${this.windowId}`);
        fileList.innerHTML = '<div class="loading">Loading files...</div>';
        
        try {
            // Mock file system for now - in real implementation this would use IPC to main process
            const mockFiles = this.getMockFiles(path);
            this.displayFiles(mockFiles);
        } catch (error) {
            fileList.innerHTML = '<div class="error">Error loading directory</div>';
        }
    }
    
    getMockFiles(path) {
        // Mock file system - replace with real FS calls via IPC
        const mockData = {
            '~': [
                { name: 'Desktop', type: 'folder', size: '', modified: new Date() },
                { name: 'Documents', type: 'folder', size: '', modified: new Date() },
                { name: 'Downloads', type: 'folder', size: '', modified: new Date() },
                { name: 'Pictures', type: 'folder', size: '', modified: new Date() },
                { name: 'example.txt', type: 'file', size: '1.2 KB', modified: new Date() }
            ],
            '~/Documents': [
                { name: '..', type: 'parent', size: '', modified: new Date() },
                { name: 'NebulaDesktop', type: 'folder', size: '', modified: new Date() },
                { name: 'notes.txt', type: 'file', size: '856 B', modified: new Date() },
                { name: 'project.zip', type: 'file', size: '2.4 MB', modified: new Date() }
            ]
        };
        
        return mockData[path] || [
            { name: '..', type: 'parent', size: '', modified: new Date() },
            { name: 'Empty folder', type: 'folder', size: '', modified: new Date() }
        ];
    }
    
    displayFiles(files) {
        const fileList = document.getElementById(`files-${this.windowId}`);
        
        fileList.innerHTML = files.map(file => {
            const icon = this.getFileIcon(file);
            const sizeText = file.size || '';
            const timeText = file.modified.toLocaleDateString();
            
            return `
                <div class="file-item ${file.type}" data-name="${file.name}" data-type="${file.type}">
                    <div class="file-icon">${icon}</div>
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${sizeText}</div>
                    <div class="file-modified">${timeText}</div>
                </div>
            `;
        }).join('');
        
        // Setup file item handlers
        fileList.querySelectorAll('.file-item').forEach(item => {
            item.addEventListener('dblclick', () => {
                this.openFile(item.dataset.name, item.dataset.type);
            });
        });
    }
    
    getFileIcon(file) {
        if (file.type === 'folder') return '📁';
        if (file.type === 'parent') return '📁';
        if (file.name.endsWith('.txt')) return '📄';
        if (file.name.endsWith('.js')) return '📜';
        if (file.name.endsWith('.html')) return '🌐';
        if (file.name.endsWith('.css')) return '🎨';
        if (file.name.endsWith('.zip')) return '🗜️';
        if (file.name.endsWith('.png') || file.name.endsWith('.jpg')) return '🖼️';
        return '📄';
    }
    
    openFile(name, type) {
        if (type === 'folder') {
            this.navigateToFolder(name);
        } else if (type === 'parent') {
            this.navigateUp();
        } else {
            // Open file with appropriate app
            alert(`Opening file: ${name}\n(File opening not implemented yet)`);
        }
    }
    
    navigateToFolder(folderName) {
        if (folderName === '..') {
            this.navigateUp();
            return;
        }
        
        let newPath;
        if (this.currentPath === '~') {
            newPath = `~/${folderName}`;
        } else {
            newPath = `${this.currentPath}/${folderName}`;
        }
        
        this.currentPath = newPath;
        document.getElementById(`path-${this.windowId}`).value = newPath;
        this.loadDirectory(newPath);
    }
    
    navigateUp() {
        if (this.currentPath === '~') return;
        
        const parts = this.currentPath.split('/');
        parts.pop();
        this.currentPath = parts.join('/') || '~';
        document.getElementById(`path-${this.windowId}`).value = this.currentPath;
        this.loadDirectory(this.currentPath);
    }
    
    setupNavigation() {
        // Back button
        document.getElementById(`back-${this.windowId}`).addEventListener('click', () => {
            // TODO: Implement history
            alert('Back navigation not implemented yet');
        });
        
        // Forward button
        document.getElementById(`forward-${this.windowId}`).addEventListener('click', () => {
            // TODO: Implement history
            alert('Forward navigation not implemented yet');
        });
        
        // Up button
        document.getElementById(`up-${this.windowId}`).addEventListener('click', () => {
            this.navigateUp();
        });
        
        // Refresh button
        document.getElementById(`refresh-${this.windowId}`).addEventListener('click', () => {
            this.loadDirectory(this.currentPath);
        });
        
        // Path input
        const pathInput = document.getElementById(`path-${this.windowId}`);
        pathInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.currentPath = pathInput.value;
                this.loadDirectory(this.currentPath);
            }
        });
    }
    
    setupSidebar() {
        document.querySelectorAll(`#${this.windowId} .sidebar-item`).forEach(item => {
            item.addEventListener('click', () => {
                const path = item.dataset.path;
                this.currentPath = path;
                document.getElementById(`path-${this.windowId}`).value = path;
                this.loadDirectory(path);
            });
        });
    }
    
    setupWindowControls(windowEl) {
        windowEl.querySelector('.window-button.minimize').addEventListener('click', () => {
            windowEl.style.display = 'none';
        });
        
        windowEl.querySelector('.window-button.maximize').addEventListener('click', () => {
            windowEl.classList.toggle('maximized');
            if (windowEl.classList.contains('maximized')) {
                windowEl.style.width = '100%';
                windowEl.style.height = 'calc(100% - 48px)';
                windowEl.style.left = '0';
                windowEl.style.top = '0';
            } else {
                windowEl.style.width = '900px';
                windowEl.style.height = '600px';
                const desktop = document.getElementById('desktop');
                const x = (desktop.offsetWidth - 900) / 2;
                const y = (desktop.offsetHeight - 600) / 2;
                windowEl.style.left = x + 'px';
                windowEl.style.top = y + 'px';
            }
        });
        
        windowEl.querySelector('.window-button.close').addEventListener('click', () => {
            if (confirm('Close File Manager?')) {
                windowEl.remove();
            }
        });
    }
    
    setupWindowDragging(windowEl) {
        const titlebar = windowEl.querySelector('.window-titlebar');
        let isDragging = false;
        let initialX, initialY;
        
        titlebar.addEventListener('mousedown', (e) => {
            if (e.target.closest('.window-controls')) return;
            isDragging = true;
            initialX = e.clientX - windowEl.offsetLeft;
            initialY = e.clientY - windowEl.offsetTop;
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            windowEl.style.left = (e.clientX - initialX) + 'px';
            windowEl.style.top = (e.clientY - initialY) + 'px';
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }
}

// Export for use in other files
window.NebulaFileManager = NebulaFileManager;
