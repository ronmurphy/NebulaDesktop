// src/js/renderer.js - MERGED VERSION
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
        
        console.log('NebulaDesk ready!');
    }
    
    createTaskbar() {
        this.taskbar = document.createElement('div');
        this.taskbar.className = 'taskbar';
        this.taskbar.innerHTML = `
            <button class="start-button" id="startBtn">
                <span>⚡</span> Nebula
            </button>
            <div class="task-list" id="taskList"></div>
            <div class="system-tray">
                <span class="clock" id="clock"></span>
                <button class="power-btn" id="powerBtn">⏻</button>
            </div>
        `;
        document.body.appendChild(this.taskbar);
        
        // Start clock
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
    }
    
    createDesktop() {
        const desktop = document.createElement('div');
        desktop.className = 'desktop';
        desktop.id = 'desktop';
        document.body.appendChild(desktop);
    }
    
    createLauncher() {
        this.launcher = document.createElement('div');
        this.launcher.className = 'launcher hidden';
        this.launcher.innerHTML = `
            <div class="launcher-header">
                <input type="text" placeholder="Search apps..." class="search-box">
            </div>
            <div class="app-grid">
                ${this.getDefaultApps().map(app => `
                    <div class="app-icon" data-url="${app.url}">
                        <span class="icon">${app.icon}</span>
                        <span class="label">${app.name}</span>
                    </div>
                `).join('')}
            </div>
        `;
        document.body.appendChild(this.launcher);
    }
    
    getDefaultApps() {
        return [
            { name: 'Browser', icon: '🌐', url: 'browser://new' },
            { name: 'Gmail', icon: '📧', url: 'https://gmail.com' },
            { name: 'Docs', icon: '📄', url: 'https://docs.google.com' },
            { name: 'YouTube', icon: '📺', url: 'https://youtube.com' },
            { name: 'Files', icon: '📁', url: 'files://local' },
            { name: 'Settings', icon: '⚙️', url: 'settings://preferences' }
        ];
    }
    
    setupEventListeners() {
        // Start button
        document.getElementById('startBtn').addEventListener('click', () => {
            this.launcher.classList.toggle('hidden');
        });
        
        // Power button - FIXED!
        document.getElementById('powerBtn').addEventListener('click', () => {
            this.showPowerMenu();
        });
        
        // App icons
        document.querySelectorAll('.app-icon').forEach(icon => {
            icon.addEventListener('click', (e) => {
                const url = e.currentTarget.dataset.url;
                this.launchApp(url);
                this.launcher.classList.add('hidden');
            });
        });
        
        // Click outside launcher to close
        document.addEventListener('click', (e) => {
            if (!this.launcher.contains(e.target) && 
                !e.target.closest('#startBtn') && 
                !this.launcher.classList.contains('hidden')) {
                this.launcher.classList.add('hidden');
            }
        });
    }
    
    async launchApp(url) {
        if (url === 'browser://new') {
            // Use the enhanced browser with tabs
            new NebulaBrowser();
        } else if (url.startsWith('files://')) {
            this.openFileManager();
        } else if (url.startsWith('settings://')) {
            this.openSettings();
        } else {
            // Open URL in browser
            new NebulaBrowser(url);
        }
    }
    
    // RESTORED: Power Menu
    showPowerMenu() {
        // Remove any existing power menu
        const existing = document.querySelector('.power-menu');
        if (existing) existing.remove();
        
        const menu = document.createElement('div');
        menu.className = 'power-menu';
        menu.innerHTML = `
            <div class="power-menu-item" onclick="desktop.logout()">
                <span class="icon">🚪</span>
                <span>Logout</span>
            </div>
            <div class="power-menu-item" onclick="desktop.restart()">
                <span class="icon">🔄</span>
                <span>Restart</span>
            </div>
            <div class="power-menu-item" onclick="desktop.shutdown()">
                <span class="icon">⏻</span>
                <span>Shutdown</span>
            </div>
        `;
        
        // Position near power button
        const powerBtn = document.getElementById('powerBtn');
        const rect = powerBtn.getBoundingClientRect();
        menu.style.position = 'fixed';
        menu.style.bottom = '60px';
        menu.style.right = '10px';
        
        document.body.appendChild(menu);
        
        // Click outside to close
        setTimeout(() => {
            document.addEventListener('click', function closePowerMenu(e) {
                if (!menu.contains(e.target) && e.target.id !== 'powerBtn') {
                    menu.remove();
                    document.removeEventListener('click', closePowerMenu);
                }
            });
        }, 100);
    }
    
    logout() {
        if (confirm('Logout from NebulaDesk?')) {
            window.close();
        }
    }
    
    restart() {
        if (confirm('Restart NebulaDesk?')) {
            nebula.system.reboot();
        }
    }
    
    shutdown() {
        if (confirm('Shutdown the system?')) {
            nebula.system.shutdown();
        }
    }
    
    openFileManager() {
        // TODO: Implement file manager
        alert('File Manager coming soon!');
    }
    
    openSettings() {
        // TODO: Implement settings
        alert('Settings panel coming soon!');
    }
    
    updateClock() {
        const clock = document.getElementById('clock');
        const now = new Date();
        clock.textContent = now.toLocaleTimeString();
    }
    
    async loadConfiguration() {
        // Load user preferences
        // TODO: Implement config loading
    }
}

// MERGED: Browser with vertical tabs
class NebulaBrowser {
    constructor(initialUrl = 'https://google.com') {
        this.tabs = new Map();
        this.activeTab = null;
        this.windowId = `browser-${Date.now()}`;
        
        this.createBrowserWindow(initialUrl);
    }
    
    createBrowserWindow(url) {
        const windowEl = document.createElement('div');
        windowEl.className = 'browser-window app-window';
        windowEl.id = this.windowId;
        
        // Position in center
        const desktop = document.getElementById('desktop');
        const x = (desktop.offsetWidth - 1200) / 2;
        const y = (desktop.offsetHeight - 700) / 2;
        windowEl.style.left = x + 'px';
        windowEl.style.top = y + 'px';
        
        windowEl.innerHTML = `
            <div class="window-titlebar">
                <span class="window-title">Nebula Browser</span>
                <div class="window-controls">
                    <button class="minimize">_</button>
                    <button class="maximize">□</button>
                    <button class="close">✕</button>
                </div>
            </div>
            <div class="browser-container">
                <div class="browser-sidebar">
                    <div class="tab-list" id="tabs-${this.windowId}">
                        <!-- Tabs go here -->
                    </div>
                    <button class="new-tab-btn" title="New Tab">+</button>
                </div>
                <div class="browser-content">
                    <div class="browser-nav">
                        <button class="nav-back" id="back-${this.windowId}">←</button>
                        <button class="nav-forward" id="forward-${this.windowId}">→</button>
                        <button class="nav-refresh" id="refresh-${this.windowId}">⟳</button>
                        <input type="text" class="url-bar" id="url-${this.windowId}" value="${url}">
                        <button class="nav-go" id="go-${this.windowId}">Go</button>
                    </div>
                    <div class="webview-container" id="webviews-${this.windowId}">
                        <!-- Webviews go here -->
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('desktop').appendChild(windowEl);
        
        // Setup window controls
        this.setupWindowControls(windowEl);
        this.setupNavigation();
        this.setupWindowDragging(windowEl);
        
        // Create first tab
        this.createTab(url);
        
        // New tab button
        windowEl.querySelector('.new-tab-btn').addEventListener('click', () => {
            this.createTab('https://google.com');
        });
    }
    
    createTab(url) {
        const tabId = `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Create tab button with favicon
        const tabEl = document.createElement('div');
        tabEl.className = 'browser-tab';
        tabEl.id = tabId;
        tabEl.innerHTML = `
            <img class="tab-favicon" src="https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32" alt="">
            <span class="tab-tooltip">${new URL(url).hostname}</span>
        `;
        
        // Right-click to close
        tabEl.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (this.tabs.size > 1) {
                if (confirm('Close this tab?')) {
                    this.closeTab(tabId);
                }
            } else {
                alert('Cannot close the last tab');
            }
        });
        
        // Left-click to switch
        tabEl.addEventListener('click', () => {
            this.switchTab(tabId);
        });
        
        // Create webview
        const webview = document.createElement('webview');
        webview.src = url;
        webview.className = 'browser-webview';
        webview.id = `webview-${tabId}`;
        webview.setAttribute('allowpopups', 'true');
        webview.setAttribute('nodeintegration', 'false');
        
        // Update favicon when page loads
        webview.addEventListener('page-favicon-updated', (e) => {
            if (e.favicons && e.favicons.length > 0) {
                tabEl.querySelector('.tab-favicon').src = e.favicons[0];
            }
        });
        
        // Update URL bar when navigating
        webview.addEventListener('did-navigate', (e) => {
            if (this.activeTab === tabId) {
                document.getElementById(`url-${this.windowId}`).value = e.url;
            }
        });
        
        // Add to DOM
        document.getElementById(`tabs-${this.windowId}`).appendChild(tabEl);
        document.getElementById(`webviews-${this.windowId}`).appendChild(webview);
        
        this.tabs.set(tabId, { tabEl, webview, url });
        this.switchTab(tabId);
    }
    
    switchTab(tabId) {
        // Hide all webviews and deactivate all tabs
        this.tabs.forEach((tab, id) => {
            tab.webview.style.display = 'none';
            tab.tabEl.classList.remove('active');
        });
        
        // Show selected tab
        const tab = this.tabs.get(tabId);
        if (tab) {
            tab.webview.style.display = 'flex';
            tab.tabEl.classList.add('active');
            this.activeTab = tabId;
            
            // Update URL bar
            document.getElementById(`url-${this.windowId}`).value = tab.webview.src;
        }
    }
    
    closeTab(tabId) {
        const tab = this.tabs.get(tabId);
        if (tab) {
            tab.tabEl.remove();
            tab.webview.remove();
            this.tabs.delete(tabId);
            
            // Switch to another tab if this was active
            if (this.activeTab === tabId && this.tabs.size > 0) {
                const firstTab = this.tabs.keys().next().value;
                this.switchTab(firstTab);
            }
        }
    }
    
    setupNavigation() {
        // Back button
        document.getElementById(`back-${this.windowId}`).addEventListener('click', () => {
            const tab = this.tabs.get(this.activeTab);
            if (tab && tab.webview.canGoBack()) {
                tab.webview.goBack();
            }
        });
        
        // Forward button
        document.getElementById(`forward-${this.windowId}`).addEventListener('click', () => {
            const tab = this.tabs.get(this.activeTab);
            if (tab && tab.webview.canGoForward()) {
                tab.webview.goForward();
            }
        });
        
        // Refresh button
        document.getElementById(`refresh-${this.windowId}`).addEventListener('click', () => {
            const tab = this.tabs.get(this.activeTab);
            if (tab) {
                tab.webview.reload();
            }
        });
        
        // URL bar
        const urlBar = document.getElementById(`url-${this.windowId}`);
        const goBtn = document.getElementById(`go-${this.windowId}`);
        
        const navigate = () => {
            const tab = this.tabs.get(this.activeTab);
            if (tab) {
                let url = urlBar.value;
                if (!url.startsWith('http://') && !url.startsWith('https://')) {
                    url = 'https://' + url;
                }
                tab.webview.src = url;
            }
        };
        
        goBtn.addEventListener('click', navigate);
        urlBar.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                navigate();
            }
        });
    }
    
    setupWindowControls(windowEl) {
        // Your existing window control code
        windowEl.querySelector('.minimize').addEventListener('click', () => {
            windowEl.style.display = 'none';
        });
        
        windowEl.querySelector('.maximize').addEventListener('click', () => {
            windowEl.classList.toggle('maximized');
            if (windowEl.classList.contains('maximized')) {
                windowEl.style.width = '100%';
                windowEl.style.height = 'calc(100% - 48px)';
                windowEl.style.left = '0';
                windowEl.style.top = '0';
            } else {
                windowEl.style.width = '1200px';
                windowEl.style.height = '700px';
            }
        });
        
        windowEl.querySelector('.close').addEventListener('click', () => {
            windowEl.remove();
        });
    }
    
    setupWindowDragging(windowEl) {
        // Your existing dragging code
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

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.desktop = new NebulaDesktop();
});