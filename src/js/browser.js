class NebulaBrowser {
    constructor() {
        this.tabs = [];
        this.activeTabId = null;
        this.tabCounter = 0;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.createNewTab('https://www.google.com');
    }
    
    setupEventListeners() {
        // Navigation controls
        document.getElementById('backBtn').addEventListener('click', () => this.goBack());
        document.getElementById('forwardBtn').addEventListener('click', () => this.goForward());
        document.getElementById('refreshBtn').addEventListener('click', () => this.refresh());
        document.getElementById('homeBtn').addEventListener('click', () => this.goHome());
        document.getElementById('newTabBtn').addEventListener('click', () => this.createNewTab());
        
        // URL input
        const urlInput = document.getElementById('urlInput');
        urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.navigateToUrl(urlInput.value);
            }
        });
        
        urlInput.addEventListener('focus', () => {
            urlInput.select();
        });
    }
    
    createNewTab(url = 'about:blank', title = 'New Tab') {
        const tabId = ++this.tabCounter;
        
        // Create tab object
        const tab = {
            id: tabId,
            url: url,
            title: title,
            favicon: null,
            webview: null
        };
        
        // Create webview
        const webview = document.createElement('webview');
        webview.id = `webview-${tabId}`;
        webview.src = url;
        webview.allowpopups = true;
        // Remove preload for now to avoid the error
        // webview.preload = './preload.js';
        webview.webpreferences = 'contextIsolation=yes,nodeIntegration=no,sandbox=yes';
        
        // Webview event listeners
        webview.addEventListener('dom-ready', () => {
            console.log('Webview ready:', tabId);
        });
        
        webview.addEventListener('did-start-loading', () => {
            this.updateTabTitle(tabId, 'Loading...');
        });
        
        webview.addEventListener('did-stop-loading', () => {
            try {
                const currentUrl = webview.getURL();
                if (currentUrl) {
                    tab.url = currentUrl;
                    this.updateUrlBar(currentUrl);
                }
            } catch (e) {
                console.log('Could not get URL:', e);
            }
        });
        
        webview.addEventListener('page-title-updated', (e) => {
            tab.title = e.title || 'Untitled';
            this.updateTabTitle(tabId, tab.title);
        });
        
        webview.addEventListener('page-favicon-updated', (e) => {
            if (e.favicons && e.favicons.length > 0) {
                tab.favicon = e.favicons[0];
                this.updateTabFavicon(tabId, tab.favicon);
            }
        });
        
        webview.addEventListener('new-window', (e) => {
            e.preventDefault();
            this.createNewTab(e.url);
        });
        
        webview.addEventListener('did-navigate', (e) => {
            tab.url = e.url;
            this.updateUrlBar(e.url);
        });
        
        webview.addEventListener('did-navigate-in-page', (e) => {
            tab.url = e.url;
            this.updateUrlBar(e.url);
        });
        
        // Add error handling
        webview.addEventListener('did-fail-load', (e) => {
            console.log('Failed to load:', e);
            this.updateTabTitle(tabId, 'Failed to load');
        });
        
        tab.webview = webview;
        this.tabs.push(tab);
        
        // Add webview to container
        document.getElementById('webviewContainer').appendChild(webview);
        
        // Create tab UI
        this.createTabUI(tab);
        
        // Switch to new tab
        this.switchToTab(tabId);
        
        return tab;
    }
    
    createTabUI(tab) {
        const tabItem = document.createElement('div');
        tabItem.className = 'tab-item';
        tabItem.id = `tab-${tab.id}`;
        tabItem.title = tab.title; // Show title on hover
        
        const favicon = document.createElement('div');
        favicon.className = 'tab-favicon';
        favicon.innerHTML = '🌐';
        
        tabItem.appendChild(favicon);
        
        // Left click to switch tabs
        tabItem.addEventListener('click', () => {
            this.switchToTab(tab.id);
        });
        
        // Right click to close tabs
        tabItem.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.closeTab(tab.id);
        });
        
        document.getElementById('tabList').appendChild(tabItem);
    }
    
    switchToTab(tabId) {
        // Hide all webviews
        const webviews = document.querySelectorAll('webview');
        webviews.forEach(wv => wv.classList.remove('active'));
        
        // Remove active class from all tabs
        const tabItems = document.querySelectorAll('.tab-item');
        tabItems.forEach(item => item.classList.remove('active'));
        
        // Show selected webview
        const webview = document.getElementById(`webview-${tabId}`);
        if (webview) {
            webview.classList.add('active');
            webview.style.display = 'block';
        }
        
        // Activate tab
        const tabItem = document.getElementById(`tab-${tabId}`);
        if (tabItem) {
            tabItem.classList.add('active');
        }
        
        this.activeTabId = tabId;
        
        // Update URL bar
        const tab = this.tabs.find(t => t.id === tabId);
        if (tab) {
            this.updateUrlBar(tab.url);
        }
    }
    
    closeTab(tabId) {
        const tabIndex = this.tabs.findIndex(t => t.id === tabId);
        if (tabIndex === -1) return;
        
        // Remove webview
        const webview = document.getElementById(`webview-${tabId}`);
        if (webview) {
            webview.remove();
        }
        
        // Remove tab UI
        const tabItem = document.getElementById(`tab-${tabId}`);
        if (tabItem) {
            tabItem.remove();
        }
        
        // Remove from tabs array
        this.tabs.splice(tabIndex, 1);
        
        // If this was the active tab, switch to another
        if (this.activeTabId === tabId) {
            if (this.tabs.length > 0) {
                const newActiveTab = this.tabs[Math.max(0, tabIndex - 1)];
                this.switchToTab(newActiveTab.id);
            } else {
                // No tabs left, create a new one
                this.createNewTab();
            }
        }
    }
    
    updateTabTitle(tabId, title) {
        const tabItem = document.getElementById(`tab-${tabId}`);
        if (tabItem) {
            // Update tooltip since we're only showing favicons
            tabItem.title = title;
            
            // Update tab object
            const tab = this.tabs.find(t => t.id === tabId);
            if (tab) {
                tab.title = title;
            }
        }
    }
    
    updateTabFavicon(tabId, faviconUrl) {
        const tabItem = document.getElementById(`tab-${tabId}`);
        if (tabItem) {
            const faviconElement = tabItem.querySelector('.tab-favicon');
            if (faviconElement && faviconUrl) {
                faviconElement.innerHTML = `<img src="${faviconUrl}" alt="favicon" onerror="this.parentNode.innerHTML='🌐'">`;
            }
        }
    }
    
    updateUrlBar(url) {
        const urlInput = document.getElementById('urlInput');
        if (urlInput) {
            urlInput.value = url;
        }
    }
    
    navigateToUrl(url) {
        if (!url) return;
        
        // Add protocol if missing
        if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('file://')) {
            if (url.includes('.') && !url.includes(' ')) {
                url = 'https://' + url;
            } else {
                url = 'https://www.google.com/search?q=' + encodeURIComponent(url);
            }
        }
        
        const activeTab = this.tabs.find(t => t.id === this.activeTabId);
        if (activeTab && activeTab.webview) {
            // Use the src property for webviews
            activeTab.webview.src = url;
            activeTab.url = url;
            this.updateUrlBar(url);
        }
    }
    
    goBack() {
        const activeTab = this.tabs.find(t => t.id === this.activeTabId);
        if (activeTab && activeTab.webview) {
            try {
                activeTab.webview.goBack();
            } catch (e) {
                console.log('Cannot go back:', e);
            }
        }
    }
    
    goForward() {
        const activeTab = this.tabs.find(t => t.id === this.activeTabId);
        if (activeTab && activeTab.webview) {
            try {
                activeTab.webview.goForward();
            } catch (e) {
                console.log('Cannot go forward:', e);
            }
        }
    }
    
    refresh() {
        const activeTab = this.tabs.find(t => t.id === this.activeTabId);
        if (activeTab && activeTab.webview) {
            try {
                activeTab.webview.reload();
            } catch (e) {
                console.log('Cannot reload:', e);
                // Fallback: just set src again
                activeTab.webview.src = activeTab.webview.src;
            }
        }
    }
    
    goHome() {
        this.navigateToUrl('https://www.google.com');
    }
}

// Initialize browser when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.browser = new NebulaBrowser();
});

// Listen for messages from parent window
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'navigate' && event.data.url) {
        if (window.browser) {
            window.browser.navigateToUrl(event.data.url);
        }
    }
});

// Handle window controls
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case 't':
                e.preventDefault();
                window.browser.createNewTab();
                break;
            case 'w':
                e.preventDefault();
                if (window.browser.tabs.length > 1) {
                    window.browser.closeTab(window.browser.activeTabId);
                }
                break;
            case 'r':
                e.preventDefault();
                window.browser.refresh();
                break;
            case 'l':
                e.preventDefault();
                document.getElementById('urlInput').focus();
                break;
        }
    }
});
