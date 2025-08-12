// RefactoredBrowser.js - Browser app using the new WindowManager
class NebulaBrowser {
    constructor(initialUrl = null) {
        this.windowId = null;
        this.tabs = new Map(); // tabId -> tabData
        this.activeTabId = null;
        
        this.init(initialUrl);
    }
    
    /**
     * Initialize the browser - create window and first tab
     */
    async init(initialUrl) {
        // Get the global window manager
        if (!window.windowManager) {
            console.error('WindowManager not available');
            return;
        }
        
        // Create a window with tab support
        this.windowId = window.windowManager.createWindow({
            title: 'Nebula Browser',
            width: 1200,
            height: 700,
            hasTabBar: true
        });
        
        // Load this browser app into the window
        window.windowManager.loadApp(this.windowId, this);
        
        // Create the first tab
        const firstTabId = window.windowManager.createTab(this.windowId, {
            title: 'New Tab',
            icon: '🌐'
        });
        
        // Initialize the first tab
        if (firstTabId) {
            this.initializeTab(firstTabId, initialUrl || 'about:blank');
        }
        
        console.log(`Browser initialized with window ${this.windowId}`);
    }
    
    /**
     * Called by WindowManager to render the browser's main content
     * This is for any UI that's shared across all tabs
     */
    render() {
        const container = document.createElement('div');
        container.className = 'browser-app-container';
        container.innerHTML = `
            <div class="browser-toolbar">
                <button class="nav-btn" id="backBtn" title="Back">←</button>
                <button class="nav-btn" id="forwardBtn" title="Forward">→</button>
                <button class="nav-btn" id="refreshBtn" title="Refresh">⟳</button>
                <input type="text" class="url-bar" id="urlBar" placeholder="Enter URL or search...">
                <button class="nav-btn go-btn" id="goBtn">Go</button>
            </div>
            <div class="tab-content-area">
                <!-- Tab content will be inserted here by WindowManager -->
            </div>
        `;
        
        // Set up toolbar event listeners
        this.setupToolbarListeners(container);
        
        return container;
    }
    
    /**
     * Set up event listeners for the browser toolbar
     */
    setupToolbarListeners(container) {
        const backBtn = container.querySelector('#backBtn');
        const forwardBtn = container.querySelector('#forwardBtn');
        const refreshBtn = container.querySelector('#refreshBtn');
        const urlBar = container.querySelector('#urlBar');
        const goBtn = container.querySelector('#goBtn');
        
        backBtn.addEventListener('click', () => this.goBack());
        forwardBtn.addEventListener('click', () => this.goForward());
        refreshBtn.addEventListener('click', () => this.refresh());
        goBtn.addEventListener('click', () => this.navigate(urlBar.value));
        
        urlBar.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.navigate(urlBar.value);
            }
        });
        
        // Update URL bar when tab changes
        urlBar.addEventListener('focus', () => {
            const activeTab = this.tabs.get(this.activeTabId);
            if (activeTab) {
                urlBar.value = activeTab.url;
                urlBar.select();
            }
        });
    }
    
    /**
     * Initialize a specific tab with content
     */
    initializeTab(tabId, url = 'about:blank') {
        const tabData = {
            id: tabId,
            url: url,
            title: 'Loading...',
            favicon: '🌐',
            history: [url],
            historyIndex: 0,
            webview: null
        };
        
        this.tabs.set(tabId, tabData);
        this.activeTabId = tabId;
        
        // Create the tab content
        const tabContent = this.createTabContent(tabData);
        
        // Load the tab content into the window manager
        window.windowManager.loadAppInTab(this.windowId, {
            render: () => tabContent,
            getTitle: () => tabData.title,
            getIcon: () => tabData.favicon
        }, tabId);
        
        // Navigate to the initial URL
        if (url && url !== 'about:blank') {
            this.navigateTab(tabId, url);
        }
    }
    
    /**
     * Create the content for a specific tab
     */
    createTabContent(tabData) {
        const container = document.createElement('div');
        container.className = 'browser-tab-content';
        
        if (tabData.url === 'about:blank') {
            // Show a start page for new tabs
            container.innerHTML = `
                <div class="start-page">
                    <div class="start-page-header">
                        <h1>🌌 Nebula Browser</h1>
                        <p>Start your web journey</p>
                    </div>
                    <div class="quick-links">
                        <a href="#" data-url="https://google.com">Google</a>
                        <a href="#" data-url="https://github.com">GitHub</a>
                        <a href="#" data-url="https://youtube.com">YouTube</a>
                        <a href="#" data-url="https://docs.google.com">Google Docs</a>
                    </div>
                </div>
            `;
            
            // Handle quick link clicks
            container.addEventListener('click', (e) => {
                if (e.target.hasAttribute('data-url')) {
                    e.preventDefault();
                    this.navigateTab(tabData.id, e.target.dataset.url);
                }
            });
        } else {
            // Create webview for actual web content
            const webview = document.createElement('webview');
            webview.className = 'browser-webview';
            webview.src = tabData.url;
            webview.style.width = '100%';
            webview.style.height = '100%';
            
            // Set up webview event listeners
            this.setupWebviewListeners(webview, tabData);
            
            container.appendChild(webview);
            tabData.webview = webview;
        }
        
        return container;
    }
    
    /**
     * Set up event listeners for a webview
     */
    setupWebviewListeners(webview, tabData) {
        webview.addEventListener('dom-ready', () => {
            console.log(`Tab ${tabData.id} loaded: ${webview.src}`);
        });
        
        webview.addEventListener('page-title-updated', (e) => {
            tabData.title = e.title || 'Untitled';
            window.windowManager.setTabTitle(this.windowId, tabData.id, tabData.title);
        });
        
        webview.addEventListener('page-favicon-updated', (e) => {
            if (e.favicons && e.favicons.length > 0) {
                // Create an image element to show the favicon
                const favicon = document.createElement('img');
                favicon.src = e.favicons[0];
                favicon.style.width = '16px';
                favicon.style.height = '16px';
                tabData.favicon = favicon.outerHTML;
            } else {
                tabData.favicon = '🌐';
            }
            window.windowManager.setTabIcon(this.windowId, tabData.id, tabData.favicon);
        });
        
        webview.addEventListener('new-window', (e) => {
            // Open new windows in new tabs
            this.createNewTab(e.url);
        });
        
        webview.addEventListener('did-navigate', (e) => {
            tabData.url = e.url;
            this.updateUrlBar(e.url);
            
            // Update history
            if (tabData.historyIndex < tabData.history.length - 1) {
                // Remove forward history if navigating to new page
                tabData.history = tabData.history.slice(0, tabData.historyIndex + 1);
            }
            tabData.history.push(e.url);
            tabData.historyIndex = tabData.history.length - 1;
        });
    }
    
    /**
     * Navigate the active tab to a URL
     */
    navigate(url) {
        if (!this.activeTabId) return;
        this.navigateTab(this.activeTabId, url);
    }
    
    /**
     * Navigate a specific tab to a URL
     */
    navigateTab(tabId, url) {
        const tabData = this.tabs.get(tabId);
        if (!tabData) return;
        
        // Normalize URL
        if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('file://')) {
            if (url.includes('.') && !url.includes(' ')) {
                url = 'https://' + url;
            } else {
                url = 'https://www.google.com/search?q=' + encodeURIComponent(url);
            }
        }
        
        tabData.url = url;
        
        if (tabData.webview) {
            tabData.webview.src = url;
        } else {
            // Recreate tab content with the new URL
            const newContent = this.createTabContent(tabData);
            // Update the tab content in the window manager
            const windowData = window.windowManager.windows.get(this.windowId);
            const tabContentElement = windowData.tabs.get(tabId).content;
            tabContentElement.innerHTML = '';
            tabContentElement.appendChild(newContent);
        }
        
        this.updateUrlBar(url);
    }
    
    /**
     * Go back in the active tab's history
     */
    goBack() {
        const tabData = this.tabs.get(this.activeTabId);
        if (!tabData || !tabData.webview) return;
        
        if (tabData.historyIndex > 0) {
            tabData.historyIndex--;
            const url = tabData.history[tabData.historyIndex];
            tabData.webview.src = url;
            this.updateUrlBar(url);
        }
    }
    
    /**
     * Go forward in the active tab's history
     */
    goForward() {
        const tabData = this.tabs.get(this.activeTabId);
        if (!tabData || !tabData.webview) return;
        
        if (tabData.historyIndex < tabData.history.length - 1) {
            tabData.historyIndex++;
            const url = tabData.history[tabData.historyIndex];
            tabData.webview.src = url;
            this.updateUrlBar(url);
        }
    }
    
    /**
     * Refresh the active tab
     */
    refresh() {
        const tabData = this.tabs.get(this.activeTabId);
        if (!tabData || !tabData.webview) return;
        
        tabData.webview.reload();
    }
    
    /**
     * Create a new tab
     */
    createNewTab(url = null) {
        const tabId = window.windowManager.createTab(this.windowId, {
            title: 'New Tab',
            icon: '🌐'
        });
        
        if (tabId) {
            this.initializeTab(tabId, url);
        }
        
        return tabId;
    }
    
    /**
     * Called by WindowManager when a new tab is created via the + button
     */
    onNewTab(tabId) {
        this.initializeTab(tabId);
    }
    
    /**
     * Update the URL bar with the current tab's URL
     */
    updateUrlBar(url) {
        const urlBar = document.querySelector('#urlBar');
        if (urlBar && document.activeElement !== urlBar) {
            urlBar.value = url;
        }
    }
    
    /**
     * Get the current title for the window
     */
    getTitle() {
        const activeTab = this.tabs.get(this.activeTabId);
        return activeTab ? `${activeTab.title} - Nebula Browser` : 'Nebula Browser';
    }
    
    /**
     * Get the current icon for the window
     */
    getIcon() {
        return '🌐';
    }
    
    /**
     * Clean up when the browser is closed
     */
    cleanup() {
        this.tabs.forEach((tabData) => {
            if (tabData.webview) {
                tabData.webview.remove();
            }
        });
        this.tabs.clear();
        console.log('Browser cleaned up');
    }
}

// Make NebulaBrowser available globally
window.NebulaBrowser = NebulaBrowser;