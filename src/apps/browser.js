// VerticalBrowser.js - Browser with vertical tabs using WindowManager
class NebulaBrowser {
    constructor(initialUrl = null) {
        this.windowId = null;
        this.tabs = new Map(); // tabId -> tabData
        this.activeTabId = null;
        this.nextTabId = 1;
        
        this.init(initialUrl);
    }
    
    /**
     * Initialize the browser - create window and setup
     */
    async init(initialUrl) {
        if (!window.windowManager) {
            console.error('WindowManager not available');
            return;
        }
        
        // Create a window without the WindowManager's tab bar (we'll make our own)
        this.windowId = window.windowManager.createWindow({
            title: 'Nebula Browser',
            width: 1200,
            height: 700,
            hasTabBar: false, // We'll create our own vertical tab system
            resizable: true, // Explicitly enable resizing
            maximizable: true,
            minimizable: true
        });
        
        // Load this browser app into the window
        window.windowManager.loadApp(this.windowId, this);
        
        // Create the first tab
        this.createTab(initialUrl || 'about:blank');
        
        console.log(`Browser initialized with window ${this.windowId}`);
    }
    
    /**
     * Called by WindowManager to render the browser's content
     */
    render() {
        const container = document.createElement('div');
        container.className = 'vertical-browser-container';
        container.innerHTML = `
            <div class="browser-sidebar" id="browserSidebar">
                <div class="tab-grid" id="verticalTabGrid">
                    <!-- Vertical tab squares will be added here -->
                </div>
                <div class="sidebar-controls">
                    <button class="new-tab-btn" id="newVerticalTabBtn" title="New Tab">
                        <span class="material-symbols-outlined">add</span>
                    </button>
                </div>
            </div>
            <div class="browser-main">
                <div class="browser-toolbar">
                    <button class="nav-btn toggle-tabs-btn" id="toggleTabsBtn" title="Toggle Tabs Sidebar">
                        <span class="material-symbols-outlined">left_panel_close</span>
                    </button>
                    <button class="nav-btn" id="backBtn" title="Back" disabled>
                        <span class="material-symbols-outlined">arrow_back</span>
                    </button>
                    <button class="nav-btn" id="forwardBtn" title="Forward" disabled>
                        <span class="material-symbols-outlined">arrow_forward</span>
                    </button>
                    <button class="nav-btn" id="refreshBtn" title="Refresh">
                        <span class="material-symbols-outlined">refresh</span>
                    </button>
                    <input type="text" class="url-bar" id="urlBar" placeholder="Enter URL or search...">
                    <button class="nav-btn go-btn" id="goBtn">
                        <span class="material-symbols-outlined">search</span>
                    </button>
                    <button class="nav-btn" id="homeBtn" title="Home">
                        <span class="material-symbols-outlined">home</span>
                    </button>
                </div>
                <div class="webview-container" id="webviewContainer">
                    <!-- Webviews will be added here -->
                </div>
            </div>
        `;
        
        // Set up event listeners
        this.setupEventListeners(container);
        
        return container;
    }
    
    /**
     * Set up all event listeners for the browser
     */
    setupEventListeners(container) {
        // Navigation buttons
        const toggleTabsBtn = container.querySelector('#toggleTabsBtn');
        const backBtn = container.querySelector('#backBtn');
        const forwardBtn = container.querySelector('#forwardBtn');
        const refreshBtn = container.querySelector('#refreshBtn');
        const urlBar = container.querySelector('#urlBar');
        const goBtn = container.querySelector('#goBtn');
        const homeBtn = container.querySelector('#homeBtn');
        const newTabBtn = container.querySelector('#newVerticalTabBtn');
        
        toggleTabsBtn.addEventListener('click', () => this.toggleSidebar());
        backBtn.addEventListener('click', () => this.goBack());
        forwardBtn.addEventListener('click', () => this.goForward());
        refreshBtn.addEventListener('click', () => this.refresh());
        goBtn.addEventListener('click', () => this.navigate(urlBar.value));
        homeBtn.addEventListener('click', () => this.navigate('about:blank'));
        newTabBtn.addEventListener('click', () => this.createTab());
        
        // URL bar events
        urlBar.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.navigate(urlBar.value);
            }
        });
        
        urlBar.addEventListener('focus', () => {
            const activeTab = this.tabs.get(this.activeTabId);
            if (activeTab) {
                urlBar.value = activeTab.url;
                urlBar.select();
            }
        });
        
        // Tab grid click handling
        const tabGrid = container.querySelector('#verticalTabGrid');
        tabGrid.addEventListener('click', (e) => {
            const tabElement = e.target.closest('.tab-square');
            if (tabElement) {
                const tabId = tabElement.dataset.tabId;
                
                // Check if close button was clicked
                if (e.target.closest('.tab-close-btn')) {
                    this.closeTab(tabId);
                } else {
                    this.switchToTab(tabId);
                }
            }
        });
        
        // Update navigation buttons when tabs change
        this.updateNavigationButtons = () => {
            const activeTab = this.tabs.get(this.activeTabId);
            if (activeTab && activeTab.webview && activeTab.webview.tagName === 'WEBVIEW') {
                // Only real webviews have these methods
                backBtn.disabled = !activeTab.webview.canGoBack();
                forwardBtn.disabled = !activeTab.webview.canGoForward();
            } else {
                // Start pages or invalid webviews
                backBtn.disabled = true;
                forwardBtn.disabled = true;
            }
        };
    }
    
    /**
     * Toggle sidebar visibility
     */
    toggleSidebar() {
        const sidebar = document.querySelector('#browserSidebar');
        const toggleBtn = document.querySelector('#toggleTabsBtn');
        const icon = toggleBtn.querySelector('.material-symbols-outlined');
        
        if (sidebar.classList.contains('collapsed')) {
            sidebar.classList.remove('collapsed');
            icon.textContent = 'left_panel_close';
            toggleBtn.title = 'Hide Tabs Sidebar';
        } else {
            sidebar.classList.add('collapsed');
            icon.textContent = 'left_panel_open';
            toggleBtn.title = 'Show Tabs Sidebar';
        }
    }
    
    /**
     * Create a new tab
     */
    createTab(url = 'about:blank') {
        const tabId = `tab-${this.nextTabId++}`;
        
        const tabData = {
            id: tabId,
            url: url,
            title: 'New Tab',
            favicon: '🌐',
            webview: null,
            isLoading: false
        };
        
        this.tabs.set(tabId, tabData);
        
        // Create the tab UI
        this.createTabElement(tabData);
        
        // Create the webview
        this.createWebview(tabData);
        
        // Switch to this tab (this will handle visibility properly)
        this.switchToTab(tabId);
        
        // Navigate to URL if provided
        if (url && url !== 'about:blank') {
            this.navigateTab(tabId, url);
        }
        
        return tabId;
    }
    
    /**
     * Create the visual tab element (64x64px square)
     */
    createTabElement(tabData) {
        const tabGrid = document.querySelector('#verticalTabGrid');
        if (!tabGrid) return;
        
        const tabElement = document.createElement('div');
        tabElement.className = 'tab-square';
        tabElement.dataset.tabId = tabData.id;
        tabElement.title = tabData.title; // Tooltip
        tabElement.innerHTML = `
            <div class="tab-favicon-large">${tabData.favicon}</div>
            <button class="tab-close-btn" title="Close tab">
                <span class="material-symbols-outlined">close</span>
            </button>
            <div class="tab-loading-indicator"></div>
        `;
        
        tabGrid.appendChild(tabElement);
        
        // Store reference
        tabData.element = tabElement;
        
        // Update tooltip when title changes
        this.updateTabTooltip(tabData.id, tabData.title);
    }
    
    /**
     * Create webview for a tab
     */
    createWebview(tabData) {
        const container = document.querySelector('#webviewContainer');
        if (!container) return;
        
        if (tabData.url === 'about:blank') {
            // Create start page
            const startPage = document.createElement('div');
            startPage.className = 'start-page';
            startPage.dataset.tabId = tabData.id;
            startPage.style.display = 'none';
            startPage.innerHTML = `
                <div class="start-page-content">
                    <div class="start-page-header">
                        <h1><span class="material-symbols-outlined">rocket_launch</span> Nebula Browser</h1>
                        <p>Your gateway to the web</p>
                    </div>
                    <div class="quick-links">
                        <a href="#" data-url="https://google.com" class="quick-link">
                            <span class="material-symbols-outlined">search</span>
                            <span>Google</span>
                        </a>
                        <a href="#" data-url="https://github.com" class="quick-link">
                            <span class="material-symbols-outlined">code</span>
                            <span>GitHub</span>
                        </a>
                        <a href="#" data-url="https://youtube.com" class="quick-link">
                            <span class="material-symbols-outlined">play_circle</span>
                            <span>YouTube</span>
                        </a>
                        <a href="#" data-url="https://docs.google.com" class="quick-link">
                            <span class="material-symbols-outlined">description</span>
                            <span>Google Docs</span>
                        </a>
                        <a href="#" data-url="https://drive.google.com" class="quick-link">
                            <span class="material-symbols-outlined">cloud</span>
                            <span>Google Drive</span>
                        </a>
                        <a href="#" data-url="https://gmail.com" class="quick-link">
                            <span class="material-symbols-outlined">mail</span>
                            <span>Gmail</span>
                        </a>
                    </div>
                </div>
            `;
            
            // Handle quick link clicks
            startPage.addEventListener('click', (e) => {
                const link = e.target.closest('[data-url]');
                if (link) {
                    e.preventDefault();
                    this.navigateTab(tabData.id, link.dataset.url);
                }
            });
            
            container.appendChild(startPage);
            tabData.webview = startPage;
        } else {
            // Create actual webview
            const webview = document.createElement('webview');
            webview.className = 'browser-webview';
            webview.dataset.tabId = tabData.id;
            webview.style.display = 'none';
            webview.src = tabData.url;
            
            this.setupWebviewListeners(webview, tabData);
            
            container.appendChild(webview);
            tabData.webview = webview;
        }
    }
    
    /**
     * Set up webview event listeners
     */
    setupWebviewListeners(webview, tabData) {
        webview.addEventListener('dom-ready', () => {
            tabData.isLoading = false;
            this.updateTabLoadingState(tabData.id);
            this.updateNavigationButtons();
        });
        
        webview.addEventListener('did-start-loading', () => {
            tabData.isLoading = true;
            this.updateTabLoadingState(tabData.id);
        });
        
        webview.addEventListener('did-stop-loading', () => {
            tabData.isLoading = false;
            this.updateTabLoadingState(tabData.id);
            this.updateNavigationButtons();
        });
        
        webview.addEventListener('page-title-updated', (e) => {
            tabData.title = e.title || 'Untitled';
            this.updateTabTitle(tabData.id, tabData.title);
            
            // Update window title if this is the active tab
            if (tabData.id === this.activeTabId) {
                window.windowManager.setWindowTitle(this.windowId, `${tabData.title} - Nebula Browser`);
            }
        });
        
        webview.addEventListener('page-favicon-updated', (e) => {
            if (e.favicons && e.favicons.length > 0) {
                const favicon = document.createElement('img');
                favicon.src = e.favicons[0];
                favicon.style.width = '16px';
                favicon.style.height = '16px';
                favicon.style.borderRadius = '2px';
                tabData.favicon = favicon.outerHTML;
            } else {
                tabData.favicon = '🌐';
            }
            this.updateTabFavicon(tabData.id, tabData.favicon);
        });
        
        webview.addEventListener('did-navigate', (e) => {
            tabData.url = e.url;
            this.updateTabUrl(tabData.id, e.url);
            this.updateUrlBar(e.url);
            this.updateNavigationButtons();
        });
        
        webview.addEventListener('new-window', (e) => {
            // Open new windows in new tabs
            this.createTab(e.url);
        });
    }
    
    /**
     * Switch to a specific tab
     */
    switchToTab(tabId) {
        const tabData = this.tabs.get(tabId);
        if (!tabData) return;
        
        // Hide all webviews using CSS classes instead of inline styles
        this.tabs.forEach((tab) => {
            if (tab.webview) {
                tab.webview.classList.add('webview-hidden');
                tab.webview.classList.remove('webview-visible');
            }
            if (tab.element) {
                tab.element.classList.remove('active');
            }
        });
        
        // Show active webview using CSS classes
        if (tabData.webview) {
            tabData.webview.classList.remove('webview-hidden');
            tabData.webview.classList.add('webview-visible');
        }
        
        // Update active tab
        if (tabData.element) {
            tabData.element.classList.add('active');
        }
        
        this.activeTabId = tabId;
        
        // Update URL bar and navigation
        this.updateUrlBar(tabData.url);
        this.updateNavigationButtons();
        
        // Update window title
        window.windowManager.setWindowTitle(this.windowId, `${tabData.title} - Nebula Browser`);
    }
    
    /**
     * Navigate a specific tab to a URL
     */
    navigateTab(tabId, url) {
        const tabData = this.tabs.get(tabId);
        if (!tabData) return;
        
        // Normalize URL
        if (!url.startsWith('http://') && !url.startsWith('https://') && url !== 'about:blank') {
            if (url.includes('.') && !url.includes(' ')) {
                url = 'https://' + url;
            } else {
                url = 'https://www.google.com/search?q=' + encodeURIComponent(url);
            }
        }
        
        tabData.url = url;
        
        // If this is a start page, replace it with a webview
        if (tabData.webview && tabData.webview.classList.contains('start-page')) {
            const container = document.querySelector('#webviewContainer');
            tabData.webview.remove();
            
            const webview = document.createElement('webview');
            webview.className = 'browser-webview';
            webview.dataset.tabId = tabData.id;
            // Use CSS classes instead of inline styles
            if (tabData.id === this.activeTabId) {
                webview.classList.add('webview-visible');
            } else {
                webview.classList.add('webview-hidden');
            }
            webview.src = url;
            
            this.setupWebviewListeners(webview, tabData);
            container.appendChild(webview);
            tabData.webview = webview;
        } else if (tabData.webview && tabData.webview.tagName === 'WEBVIEW') {
            tabData.webview.src = url;
        }
        
        this.updateTabUrl(tabId, url);
        this.updateUrlBar(url);
    }
    
    /**
     * Navigate the active tab
     */
    navigate(url) {
        if (this.activeTabId) {
            this.navigateTab(this.activeTabId, url);
        }
    }
    
    /**
     * Close a tab
     */
    closeTab(tabId) {
        const tabData = this.tabs.get(tabId);
        if (!tabData) return;
        
        // Don't close the last tab
        if (this.tabs.size === 1) {
            this.navigateTab(tabId, 'about:blank');
            return;
        }
        
        // Remove webview
        if (tabData.webview) {
            tabData.webview.remove();
        }
        
        // Remove tab element
        if (tabData.element) {
            tabData.element.remove();
        }
        
        // Remove from tabs map
        this.tabs.delete(tabId);
        
        // If this was the active tab, switch to another
        if (this.activeTabId === tabId) {
            const remainingTabs = Array.from(this.tabs.keys());
            if (remainingTabs.length > 0) {
                this.switchToTab(remainingTabs[0]);
            }
        }
    }
    
    /**
     * Navigation methods
     */
    goBack() {
        const tabData = this.tabs.get(this.activeTabId);
        if (tabData && tabData.webview && tabData.webview.tagName === 'WEBVIEW' && tabData.webview.canGoBack) {
            tabData.webview.goBack();
        }
    }
    
    goForward() {
        const tabData = this.tabs.get(this.activeTabId);
        if (tabData && tabData.webview && tabData.webview.tagName === 'WEBVIEW' && tabData.webview.canGoForward) {
            tabData.webview.goForward();
        }
    }
    
    refresh() {
        const tabData = this.tabs.get(this.activeTabId);
        if (tabData && tabData.webview) {
            if (tabData.webview.tagName === 'WEBVIEW' && tabData.webview.reload) {
                tabData.webview.reload();
            } else {
                // For start page, just refresh the content
                this.navigateTab(this.activeTabId, tabData.url);
            }
        }
    }
    
    /**
     * Update UI elements
     */
    updateTabTitle(tabId, title) {
        const tabData = this.tabs.get(tabId);
        if (tabData && tabData.element) {
            // Update tooltip for square tabs
            this.updateTabTooltip(tabId, title);
        }
    }
    
    updateTabTooltip(tabId, title) {
        const tabData = this.tabs.get(tabId);
        if (tabData && tabData.element) {
            const url = this.formatUrl(tabData.url);
            const tooltip = title + (url !== 'New Tab' ? `\n${url}` : '');
            tabData.element.title = tooltip;
        }
    }
    
    updateTabUrl(tabId, url) {
        const tabData = this.tabs.get(tabId);
        if (tabData && tabData.element) {
            // Update tooltip with new URL
            this.updateTabTooltip(tabId, tabData.title);
        }
    }
    
    updateTabFavicon(tabId, favicon) {
        const tabData = this.tabs.get(tabId);
        if (tabData && tabData.element) {
            const faviconElement = tabData.element.querySelector('.tab-favicon-large');
            if (faviconElement) {
                faviconElement.innerHTML = favicon;
            }
        }
    }
    
    updateTabLoadingState(tabId) {
        const tabData = this.tabs.get(tabId);
        if (tabData && tabData.element) {
            const indicator = tabData.element.querySelector('.tab-loading-indicator');
            if (indicator) {
                indicator.classList.toggle('loading', tabData.isLoading);
            }
        }
    }
    
    updateUrlBar(url) {
        const urlBar = document.querySelector('#urlBar');
        if (urlBar && document.activeElement !== urlBar) {
            urlBar.value = url === 'about:blank' ? '' : url;
        }
    }
    
    /**
     * Utility methods
     */
    formatUrl(url) {
        if (url === 'about:blank') return 'New Tab';
        try {
            const urlObj = new URL(url);
            return urlObj.hostname;
        } catch {
            return url.length > 30 ? url.substring(0, 30) + '...' : url;
        }
    }
    
    /**
     * App interface methods
     */
    getTitle() {
        const activeTab = this.tabs.get(this.activeTabId);
        return activeTab ? `${activeTab.title} - Nebula Browser` : 'Nebula Browser';
    }
    
    getIcon() {
        return '🌐';
    }
    
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