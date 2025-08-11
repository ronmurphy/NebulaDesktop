// apps/browser.js - Nebula Browser Application
// Separated browser functionality with vertical tabs

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
                    <button class="window-button minimize" title="Minimize"></button>
                    <button class="window-button maximize" title="Maximize"></button>
                    <button class="window-button close" title="Close"></button>
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
            <img class="tab-favicon" src="https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32" alt="" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22><path fill=%22%23666%22 d=%22M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z%22/></svg>'">
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
                // Update tab tooltip
                try {
                    tabEl.querySelector('.tab-tooltip').textContent = new URL(e.url).hostname;
                } catch (error) {
                    tabEl.querySelector('.tab-tooltip').textContent = e.url;
                }
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
            } else if (this.tabs.size === 0) {
                // Close browser window if no tabs left
                document.getElementById(this.windowId).remove();
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
        windowEl.querySelector('.window-button.minimize').addEventListener('click', () => {
            windowEl.style.display = 'none';
            // TODO: Add to taskbar
        });
        
        windowEl.querySelector('.window-button.maximize').addEventListener('click', () => {
            windowEl.classList.toggle('maximized');
            if (windowEl.classList.contains('maximized')) {
                windowEl.style.width = '100%';
                windowEl.style.height = 'calc(100% - 48px)';
                windowEl.style.left = '0';
                windowEl.style.top = '0';
            } else {
                windowEl.style.width = '1200px';
                windowEl.style.height = '700px';
                // Re-center
                const desktop = document.getElementById('desktop');
                const x = (desktop.offsetWidth - 1200) / 2;
                const y = (desktop.offsetHeight - 700) / 2;
                windowEl.style.left = x + 'px';
                windowEl.style.top = y + 'px';
            }
        });
        
        windowEl.querySelector('.window-button.close').addEventListener('click', () => {
            if (confirm('Close browser?')) {
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
            windowEl.style.cursor = 'grabbing';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            windowEl.style.left = (e.clientX - initialX) + 'px';
            windowEl.style.top = (e.clientY - initialY) + 'px';
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                windowEl.style.cursor = 'default';
            }
        });
    }
}

// Export for use in other files
window.NebulaBrowser = NebulaBrowser;
