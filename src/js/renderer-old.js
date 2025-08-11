// Simple NebulaDesk - Back to Basics
class NebulaDesktop {
    constructor() {
        this.windows = [];
        this.windowCounter = 0;
        this.init();
    }

    init() {
        console.log('Initializing NebulaDesk (Simple Version)...');
        this.createTaskbar();
        this.createDesktop();
        console.log('NebulaDesk ready!');
    }

    createTaskbar() {
        const taskbar = document.createElement('div');
        taskbar.className = 'taskbar';
        taskbar.innerHTML = `
            <button class="start-button" onclick="desktop.toggleLauncher()">
                Start
            </button>
            <div class="task-list" id="taskList"></div>
            <div class="system-tray">
                <div class="clock" id="clock">${new Date().toLocaleTimeString()}</div>
            </div>
        `;
        document.body.appendChild(taskbar);

        // Update clock
        setInterval(() => {
            const clock = document.getElementById('clock');
            clock.textContent = new Date().toLocaleTimeString();
        }, 1000);
    }

    createDesktop() {
        const desktop = document.createElement('div');
        desktop.className = 'desktop';
        desktop.id = 'desktop';
        document.body.appendChild(desktop);
        
        this.createLauncher();
    }

    createLauncher() {
        const launcher = document.createElement('div');
        launcher.className = 'launcher';
        launcher.id = 'launcher';
        launcher.style.display = 'none';
        
        launcher.innerHTML = `
            <h2>Applications</h2>
            <div class="app-grid">
                <div class="app-item" onclick="desktop.openBrowser()">
                    <div class="app-icon">🌐</div>
                    <div class="app-name">Browser</div>
                </div>
                <div class="app-item" onclick="desktop.openApp('https://gmail.com')">
                    <div class="app-icon">📧</div>
                    <div class="app-name">Gmail</div>
                </div>
                <div class="app-item" onclick="desktop.openApp('https://youtube.com')">
                    <div class="app-icon">📺</div>
                    <div class="app-name">YouTube</div>
                </div>
                <div class="app-item" onclick="desktop.openApp('https://github.com')">
                    <div class="app-icon">💻</div>
                    <div class="app-name">GitHub</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(launcher);
        this.launcher = launcher;
    }

    toggleLauncher() {
        if (this.launcher.style.display === 'none') {
            this.launcher.style.display = 'block';
        } else {
            this.launcher.style.display = 'none';
        }
    }

    openBrowser() {
        this.createBrowserWindow();
        this.toggleLauncher();
    }

    openApp(url) {
        this.createBrowserWindow(url);
        this.toggleLauncher();
    }

    createBrowserWindow(url = 'https://www.google.com') {
        const windowId = 'window-' + (++this.windowCounter);
        
        const windowEl = document.createElement('div');
        windowEl.className = 'browser-window';
        windowEl.id = windowId;
        
        windowEl.innerHTML = `
            <div class="window-titlebar">
                <span class="window-title">Nebula Browser</span>
                <div class="window-controls">
                    <button class="window-button" onclick="desktop.minimizeWindow('${windowId}')">_</button>
                    <button class="window-button" onclick="desktop.maximizeWindow('${windowId}')">□</button>
                    <button class="window-button close" onclick="desktop.closeWindow('${windowId}')">×</button>
                </div>
            </div>
            <div class="browser-toolbar">
                <button class="nav-button" onclick="desktop.goBack('${windowId}')">←</button>
                <button class="nav-button" onclick="desktop.goForward('${windowId}')">→</button>
                <button class="nav-button" onclick="desktop.refresh('${windowId}')">↻</button>
                <input type="text" class="url-bar" value="${url}" 
                       onkeypress="if(event.key==='Enter') desktop.navigate('${windowId}', this.value)">
                <button class="nav-button" onclick="desktop.goHome('${windowId}')">🏠</button>
            </div>
            <div class="browser-content">
                <webview id="webview-${windowId}" src="${url}" style="width: 100%; height: 100%;"></webview>
            </div>
        `;
        
        // Position window
        windowEl.style.left = (100 + this.windowCounter * 50) + 'px';
        windowEl.style.top = (50 + this.windowCounter * 30) + 'px';
        
        document.getElementById('desktop').appendChild(windowEl);
        
        // Make window draggable
        this.makeDraggable(windowEl);
        
        this.windows.push(windowId);
    }

    makeDraggable(windowEl) {
        const titlebar = windowEl.querySelector('.window-titlebar');
        let isDragging = false;
        let dragOffsetX = 0;
        let dragOffsetY = 0;

        titlebar.addEventListener('mousedown', (e) => {
            isDragging = true;
            dragOffsetX = e.clientX - windowEl.offsetLeft;
            dragOffsetY = e.clientY - windowEl.offsetTop;
            windowEl.style.zIndex = 1000 + this.windows.length;
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                windowEl.style.left = (e.clientX - dragOffsetX) + 'px';
                windowEl.style.top = (e.clientY - dragOffsetY) + 'px';
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }

    // Window controls
    closeWindow(windowId) {
        const windowEl = document.getElementById(windowId);
        windowEl.remove();
        this.windows = this.windows.filter(id => id !== windowId);
    }

    minimizeWindow(windowId) {
        const windowEl = document.getElementById(windowId);
        windowEl.style.display = 'none';
    }

    maximizeWindow(windowId) {
        const windowEl = document.getElementById(windowId);
        const desktop = document.getElementById('desktop');
        
        if (windowEl.classList.contains('maximized')) {
            windowEl.classList.remove('maximized');
            windowEl.style.width = '800px';
            windowEl.style.height = '600px';
        } else {
            windowEl.classList.add('maximized');
            windowEl.style.width = '100%';
            windowEl.style.height = 'calc(100% - 50px)';
            windowEl.style.left = '0px';
            windowEl.style.top = '0px';
        }
    }

    // Browser navigation
    navigate(windowId, url) {
        const webview = document.getElementById('webview-' + windowId);
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        webview.src = url;
    }

    goBack(windowId) {
        const webview = document.getElementById('webview-' + windowId);
        webview.goBack();
    }

    goForward(windowId) {
        const webview = document.getElementById('webview-' + windowId);
        webview.goForward();
    }

    refresh(windowId) {
        const webview = document.getElementById('webview-' + windowId);
        webview.reload();
    }

    goHome(windowId) {
        this.navigate(windowId, 'https://www.google.com');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.desktop = new NebulaDesktop();
});

// Icon utility with fallbacks
class NebulaIcons {
    static create(iconName, fallbackEmoji = '?') {
        const iconElement = document.createElement('span');
        iconElement.className = 'material-symbols-outlined nebula-icon';
        iconElement.textContent = iconName;
        iconElement.setAttribute('data-fallback', fallbackEmoji);
        
        // Check if icon loaded properly
        setTimeout(() => {
            const computedStyle = window.getComputedStyle(iconElement);
            if (computedStyle.fontFamily.includes('Material Symbols')) {
                // Icon loaded successfully
                iconElement.classList.add('icon-loaded');
            } else {
                // Fallback to emoji
                iconElement.textContent = fallbackEmoji;
                iconElement.className = 'nebula-icon-fallback';
            }
        }, 100);
        
        return iconElement;
    }
    
    static getIconHtml(iconName, fallbackEmoji = '?') {
        return `<span class="material-symbols-outlined nebula-icon" data-fallback="${fallbackEmoji}">${iconName}</span>`;
    }
}

// Merging WME1's window management with EWM2's cleaner architecture
class NebulaDesktop {
    constructor() {
        this.windows = new Map();
        this.activeWindow = null;
        this.taskbar = null;
        this.launcher = null;
        this.isDragging = false;

        this.init();
    }

    async init() {
        console.log('Initializing NebulaDesk v3...');

        // Create UI components
        this.createTaskbar();
        this.createDesktop();
        this.createLauncher();

        // Setup event listeners
        this.setupEventListeners();

        // Load user config
        await this.loadConfiguration();
        
        // Initialize icon system
        this.initializeIcons();
        
        // Add Fluent-style effects
        this.initializeFluentEffects();

        console.log('NebulaDesk ready!');
    }

    createTaskbar() {
        this.taskbar = document.createElement('div');
        this.taskbar.className = 'taskbar nebula-glass';
        this.taskbar.innerHTML = `
            <md-filled-button class="start-button nebula-fluent-hover" onclick="desktop.toggleLauncher()">
                <span class="material-symbols-outlined" slot="icon">widgets</span>
                NebulaOS
            </md-filled-button>
            <div class="task-list"></div>
            <div class="system-tray">
                <span class="clock">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                <md-icon-button id="powerBtn" class="power-btn" onclick="desktop.showPowerMenu()">
                    <span class="material-symbols-outlined">power_settings_new</span>
                </md-icon-button>
            </div>
        `;
        document.body.appendChild(this.taskbar);
        
        // Update clock every minute
        setInterval(() => {
            const clock = this.taskbar.querySelector('.clock');
            if (clock) {
                clock.textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            }
        }, 60000);
    }

    createDesktop() {
        const desktop = document.createElement('div');
        desktop.className = 'desktop';
        desktop.id = 'desktop';
        document.body.appendChild(desktop);
    }

    createLauncher() {
        this.launcher = document.createElement('div');
        this.launcher.className = 'launcher nebula-glass nebula-slide-up';
        this.launcher.style.display = 'none';
        
        this.launcher.innerHTML = `
            <div class="launcher-header">
                <h2>Nebula</h2>
            </div>
            <md-outlined-text-field class="search-box" 
                                   label="Search apps and web..." 
                                   oninput="desktop.filterApps(this.value)">
                <span slot="leading-icon" class="material-symbols-outlined">search</span>
            </md-outlined-text-field>
            <div class="launcher-content">
                <div class="app-tiles">
                    ${this.generateAppTiles()}
                </div>
                <div class="recent-section">
                    <h3>Recent</h3>
                    <div class="recent-apps">
                        ${this.generateRecentApps()}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.launcher);
    }

    toggleLauncher() {
        if (this.launcher.style.display === 'none') {
            this.launcher.style.display = 'block';
            this.launcher.classList.add('nebula-fade-in');
        } else {
            this.launcher.style.display = 'none';
            this.launcher.classList.remove('nebula-fade-in');
        }
    }

    generateAppTiles() {
        const apps = this.getDefaultApps();
        return apps.map(app => `
            <div class="app-tile ${app.size || 'medium'}" data-url="${app.url}">
                <div class="tile-content">
                    <span class="tile-icon">${app.icon}</span>
                    <span class="tile-label">${app.name}</span>
                </div>
            </div>
        `).join('');
    }

    generateRecentApps() {
        // For now, show a subset of apps as "recent"
        const recentApps = [
            { name: 'Browser', icon: '🌐', url: 'https://google.com' },
            { name: 'Gmail', icon: '📧', url: 'https://gmail.com' },
            { name: 'YouTube', icon: '📺', url: 'https://youtube.com' }
        ];
        
        return recentApps.map(app => `
            <div class="recent-app" data-url="${app.url}">
                <span class="recent-icon">${app.icon}</span>
                <span class="recent-name">${app.name}</span>
            </div>
        `).join('');
    }

    getDefaultApps() {
        return [
            { name: 'Browser', icon: '🌐', url: 'https://google.com', size: 'large' },
            { name: 'Gmail', icon: '📧', url: 'https://gmail.com', size: 'medium' },
            { name: 'Docs', icon: '📄', url: 'https://docs.google.com', size: 'medium' },
            { name: 'YouTube', icon: '📺', url: 'https://youtube.com', size: 'wide' },
            { name: 'Files', icon: '📁', url: 'files://local', size: 'medium' },
            { name: 'Settings', icon: '⚙️', url: 'settings://preferences', size: 'medium' },
            { name: 'Maps', icon: '🗺️', url: 'https://maps.google.com', size: 'medium' },
            { name: 'Drive', icon: '💾', url: 'https://drive.google.com', size: 'medium' }
        ];
    }

    // Add to renderer.js in setupWindowDragging method
    setupWindowDragging(windowEl) {
        const titlebar = windowEl.querySelector('.window-titlebar');
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;

        titlebar.addEventListener('mousedown', (e) => {
            if (e.target.closest('.window-controls')) return;

            isDragging = true;
            initialX = e.clientX - windowEl.offsetLeft;
            initialY = e.clientY - windowEl.offsetTop;
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;

            windowEl.style.left = currentX + 'px';
            windowEl.style.top = currentY + 'px';
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }

    setupEventListeners() {
        // App tiles - use event delegation
        this.launcher.addEventListener('click', (e) => {
            const appTile = e.target.closest('.app-tile');
            const recentApp = e.target.closest('.recent-app');
            
            if (appTile) {
                const url = appTile.dataset.url;
                this.launchApp(url);
                this.toggleLauncher();
            } else if (recentApp) {
                const url = recentApp.dataset.url;
                this.launchApp(url);
                this.toggleLauncher();
            }
        });

        // Search functionality
        const searchBox = this.launcher.querySelector('md-outlined-text-field');
        searchBox?.addEventListener('input', (e) => {
            this.filterApps(e.target.value);
        });

        // Click outside to close launcher
        document.addEventListener('click', (e) => {
            if (!this.launcher.contains(e.target) && 
                !e.target.closest('.start-button') && 
                this.launcher.style.display !== 'none') {
                this.toggleLauncher();
            }
        });
    }

    async launchApp(url) {
        console.log('launchApp called with URL:', url);
        if (url.startsWith('files://')) {
            this.openFileManager();
        } else if (url.startsWith('settings://')) {
            this.openSettings();
        } else {
            this.createWebWindow(url);
        }
    }

    createWebWindow(url) {
        console.log('createWebWindow called with URL:', url);
        // Open the new Nebula Browser
        this.openNebulaBrowser(url);
    }

    // Basic file manager
    openFileManager() {
        const windowEl = this.createWindow('Files', 'file-manager');
        // Add file listing functionality
    }

    // Open Nebula Browser
    openNebulaBrowser(initialUrl = 'https://www.google.com') {
        console.log('Opening Nebula Browser with URL:', initialUrl);
        const windowEl = this.createWindow('Nebula Browser', 'nebula-browser', 1000, 700);
        console.log('Created window element:', windowEl);
        
        // Create iframe to load the browser
        const iframe = document.createElement('iframe');
        iframe.src = './browser.html';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        
        // Add iframe to window content
        const content = windowEl.querySelector('.window-content');
        content.innerHTML = '';
        content.appendChild(iframe);
        console.log('Added iframe to window content');
        
        // When iframe loads, navigate to initial URL
        iframe.addEventListener('load', () => {
            console.log('Browser iframe loaded');
            try {
                if (initialUrl !== 'https://www.google.com') {
                    iframe.contentWindow.postMessage({
                        type: 'navigate',
                        url: initialUrl
                    }, '*');
                }
            } catch (e) {
                console.log('Could not communicate with browser iframe:', e);
            }
        });
    }

    createWindow(title, windowId, width = 800, height = 600) {
        const windowEl = document.createElement('div');
        windowEl.className = 'app-window';
        windowEl.id = windowId;
        
        // Load saved state or use defaults
        const savedState = WindowStorage.load(windowId, { width, height, x: 100, y: 100 });
        
        // Set dimensions and position
        windowEl.style.width = savedState.width + 'px';
        windowEl.style.height = savedState.height + 'px';
        windowEl.style.left = savedState.x + 'px';
        windowEl.style.top = savedState.y + 'px';
        windowEl.style.position = 'absolute';
        windowEl.style.zIndex = '1000';
        
        windowEl.innerHTML = `
            <div class="window-titlebar">
                <span class="window-title">${title}</span>
                <div class="window-controls">
                    <button class="minimize">_</button>
                    <button class="maximize">□</button>
                    <button class="close">✕</button>
                </div>
            </div>
            <div class="window-content">
                <!-- Content will be added here -->
            </div>
        `;
        
        // Add to desktop
        const desktop = document.getElementById('desktop');
        desktop.appendChild(windowEl);
        
        // Setup window controls
        this.setupWindowControls(windowEl, windowId);
        
        // Add resize handles
        this.addResizeHandles(windowEl, windowId);
        
        return windowEl;
    }

    setupWindowControls(windowEl, windowId) {
        // Make window draggable
        this.setupWindowDragging(windowEl);
        
        // Close button
        windowEl.querySelector('.close').addEventListener('click', () => {
            // Save state before closing
            const state = {
                width: parseInt(windowEl.style.width, 10),
                height: parseInt(windowEl.style.height, 10),
                x: windowEl.offsetLeft,
                y: windowEl.offsetTop
            };
            WindowStorage.save(windowId, state);
            windowEl.remove();
        });
        
        // Minimize button
        windowEl.querySelector('.minimize').addEventListener('click', () => {
            windowEl.style.display = 'none';
        });
        
        // Maximize button
        windowEl.querySelector('.maximize').addEventListener('click', () => {
            if (windowEl.classList.contains('maximized')) {
                // Restore
                windowEl.classList.remove('maximized');
                const saved = WindowStorage.load(windowId);
                windowEl.style.width = saved.width + 'px';
                windowEl.style.height = saved.height + 'px';
                windowEl.style.left = saved.x + 'px';
                windowEl.style.top = saved.y + 'px';
                windowEl.querySelector('.maximize').textContent = '□';
            } else {
                // Maximize
                const desktop = document.getElementById('desktop');
                windowEl.style.width = '100%';
                windowEl.style.height = 'calc(100% - 60px)';
                windowEl.style.left = '0';
                windowEl.style.top = '0';
                windowEl.classList.add('maximized');
                windowEl.querySelector('.maximize').textContent = '🗗';
            }
        });
    }

    showPowerMenu() {
        // Create a power menu with fallback to basic HTML if Shoelace fails
        const menu = document.createElement('div');
        menu.className = 'power-menu nebula-glass nebula-slide-up';
        
        // Try Shoelace first, fallback to basic HTML
        const useBasicHTML = !customElements.get('sl-menu');
        
        if (useBasicHTML) {
            menu.innerHTML = `
                <button class="power-menu-item" onclick="desktop.logout()">
                    <span class="material-symbols-outlined">logout</span>
                    Logout
                </button>
                <button class="power-menu-item" onclick="desktop.restart()">
                    <span class="material-symbols-outlined">restart_alt</span>
                    Restart
                </button>
                <button class="power-menu-item" onclick="desktop.shutdown()">
                    <span class="material-symbols-outlined">power_settings_new</span>
                    Shutdown
                </button>
            `;
        } else {
            menu.innerHTML = `
                <sl-menu>
                    <sl-menu-item onclick="desktop.logout()">
                        <span slot="prefix" class="material-symbols-outlined">logout</span>
                        Logout
                    </sl-menu-item>
                    <sl-menu-item onclick="desktop.restart()">
                        <span slot="prefix" class="material-symbols-outlined">restart_alt</span>
                        Restart
                    </sl-menu-item>
                    <sl-menu-item onclick="desktop.shutdown()">
                        <span slot="prefix" class="material-symbols-outlined">power_settings_new</span>
                        Shutdown
                    </sl-menu-item>
                </sl-menu>
            `;
        }
        
        // Position near power button
        const powerBtn = document.getElementById('powerBtn');
        const rect = powerBtn.getBoundingClientRect();
        menu.style.position = 'fixed';
        menu.style.right = '10px';
        menu.style.bottom = '60px';
        menu.style.zIndex = '10000';
        
        document.body.appendChild(menu);
        
        // Remove on click outside
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!menu.contains(e.target) && e.target !== powerBtn) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 100);
    }

    filterApps(searchTerm) {
        const appTiles = this.launcher.querySelectorAll('.app-tile, .recent-app');
        const term = searchTerm.toLowerCase();
        
        appTiles.forEach(tile => {
            const tileName = tile.querySelector('.tile-label, .recent-name').textContent.toLowerCase();
            if (tileName.includes(term)) {
                tile.style.display = 'flex';
                tile.classList.add('nebula-fade-in');
            } else {
                tile.style.display = 'none';
            }
        });
    }

    addToTaskbar(windowId, title) {
        const taskItem = document.createElement('button');
        taskItem.className = 'task-item';
        taskItem.textContent = title;
        taskItem.onclick = () => this.focusWindow(windowId);
        document.getElementById('taskList').appendChild(taskItem);
    }

    updateClock() {
        const clock = document.getElementById('clock');
        const now = new Date();
        clock.textContent = now.toLocaleTimeString();
    }

    async loadConfiguration() {
        // Load any saved desktop configuration
        // This can be expanded to include desktop background, theme, etc.
    }

    initializeIcons() {
        // Check if Material Symbols font loaded, provide fallbacks
        const iconElements = document.querySelectorAll('.material-symbols-outlined');
        
        setTimeout(() => {
            iconElements.forEach(icon => {
                const computedStyle = window.getComputedStyle(icon);
                if (!computedStyle.fontFamily.includes('Material Symbols')) {
                    // Provide emoji fallbacks
                    const iconName = icon.textContent.trim();
                    const fallback = this.getIconFallback(iconName);
                    if (fallback) {
                        icon.textContent = fallback;
                        icon.className = 'nebula-icon-fallback';
                    }
                }
            });
        }, 1000);
    }

    getIconFallback(iconName) {
        const fallbacks = {
            'bolt': '⚡',
            'power_settings_new': '⏻',
            'search': '🔍',
            'arrow_back': '←',
            'arrow_forward': '→',
            'refresh': '⟳',
            'public': '🌐',
            'logout': '🚪',
            'restart_alt': '🔄',
            'home': '🏠',
            'settings': '⚙️',
            'folder': '📁',
            'email': '📧',
            'play_arrow': '▶️',
            'close': '✕',
            'minimize': '−',
            'maximize': '□'
        };
        return fallbacks[iconName] || '?';
    }

    initializeFluentEffects() {
        // Add reveal effect to interactive elements
        document.addEventListener('mousemove', (e) => {
            const revealElements = document.querySelectorAll('.nebula-reveal:hover');
            revealElements.forEach(element => {
                const rect = element.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                element.style.setProperty('--x', x + '%');
                element.style.setProperty('--y', y + '%');
            });
        });

        // Add fluent hover effects to app icons
        const appIcons = document.querySelectorAll('.app-icon');
        appIcons.forEach(icon => {
            icon.classList.add('nebula-reveal', 'nebula-fluent-hover');
        });
    }

    // Generic window management for any window type
    addResizeHandles(windowEl, windowId) {
        // Add resize handles to any window element
        const handles = `
            <div class="resize-handle resize-n"></div>
            <div class="resize-handle resize-s"></div>
            <div class="resize-handle resize-e"></div>
            <div class="resize-handle resize-w"></div>
            <div class="resize-handle resize-ne"></div>
            <div class="resize-handle resize-nw"></div>
            <div class="resize-handle resize-se"></div>
            <div class="resize-handle resize-sw"></div>
        `;
        windowEl.insertAdjacentHTML('beforeend', handles);
        
        this.setupResizing(windowEl, windowId);
    }

    setupResizing(windowEl, windowId) {
        const resizeHandles = windowEl.querySelectorAll('.resize-handle');
        let isResizing = false;
        let currentHandle = null;
        let startX, startY, startWidth, startHeight, startLeft, startTop;
        
        resizeHandles.forEach(handle => {
            handle.addEventListener('mousedown', (e) => {
                if (windowEl.classList.contains('maximized')) return;
                
                e.preventDefault();
                isResizing = true;
                currentHandle = handle;
                
                startX = e.clientX;
                startY = e.clientY;
                startWidth = parseInt(window.getComputedStyle(windowEl).width, 10);
                startHeight = parseInt(window.getComputedStyle(windowEl).height, 10);
                startLeft = windowEl.offsetLeft;
                startTop = windowEl.offsetTop;
                
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
        });
        
        const onMouseMove = (e) => {
            if (!isResizing) return;
            
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            let newWidth = startWidth;
            let newHeight = startHeight;
            let newLeft = startLeft;
            let newTop = startTop;
            
            if (currentHandle.classList.contains('resize-e') || currentHandle.classList.contains('resize-ne') || currentHandle.classList.contains('resize-se')) {
                newWidth = Math.max(300, startWidth + dx);
            }
            if (currentHandle.classList.contains('resize-w') || currentHandle.classList.contains('resize-nw') || currentHandle.classList.contains('resize-sw')) {
                newWidth = Math.max(300, startWidth - dx);
                newLeft = startLeft + (startWidth - newWidth);
            }
            if (currentHandle.classList.contains('resize-s') || currentHandle.classList.contains('resize-se') || currentHandle.classList.contains('resize-sw')) {
                newHeight = Math.max(200, startHeight + dy);
            }
            if (currentHandle.classList.contains('resize-n') || currentHandle.classList.contains('resize-ne') || currentHandle.classList.contains('resize-nw')) {
                newHeight = Math.max(200, startHeight - dy);
                newTop = startTop + (startHeight - newHeight);
            }
            
            windowEl.style.width = newWidth + 'px';
            windowEl.style.height = newHeight + 'px';
            windowEl.style.left = newLeft + 'px';
            windowEl.style.top = newTop + 'px';
        };
        
        const onMouseUp = () => {
            isResizing = false;
            currentHandle = null;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            
            // Save window state
            const state = {
                width: parseInt(windowEl.style.width, 10),
                height: parseInt(windowEl.style.height, 10),
                x: windowEl.offsetLeft,
                y: windowEl.offsetTop
            };
            WindowStorage.save(windowId, state);
        };
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.desktop = new NebulaDesktop();
});