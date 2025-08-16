// NebulaApp PWA Template
// Based on NebulaApp-Single.js - Modified for Progressive Web App hosting
// Perfect for hosting web applications and websites within Nebula Desktop
//
// TODO: Replace 'PWAHost' with your app name throughout this file
// TODO: Customize the functionality in the marked sections

class NebulaPWAHost {
    constructor(initialUrl = 'https://example.com') {
        // Initialize PWA hosting properties
        this.windowId = null;
        this.currentUrl = initialUrl;
        this.history = [initialUrl];
        this.historyIndex = 0;
        this.isLoading = false;
        this.canGoBack = false;
        this.canGoForward = false;
        
        // PWA-specific settings
        this.settings = {
            allowNavigation: true,
            showAddressBar: true,
            enableOffline: true,
            autoInstallPrompt: true,
            defaultHomePage: 'https://example.com'
        };

        this.init();
    }

    async init() {
        if (!window.windowManager) {
            console.error('WindowManager not available');
            return;
        }

        // Create window with PWA-optimized configuration
        this.windowId = window.windowManager.createWindow({
            title: 'PWA Host', // TODO: Change app title
            width: 1200,       // Wider for web content
            height: 800,       // Taller for web content
            resizable: true,
            maximizable: true,
            minimizable: true,
            icon: 'web' // Material icon for web apps
        });

        // Load this app into the window
        window.windowManager.loadApp(this.windowId, this);

        console.log(`PWAHost initialized with window ${this.windowId}`);
    }

    /**
     * Called by WindowManager to render the app's content
     * Creates a clean PWA hosting interface with just webview and context menu
     */
    render() {
        const container = document.createElement('div');
        container.className = 'pwa-host-container';
        container.style.cssText = `
            width: 100%;
            height: 100%;
            background: var(--nebula-bg-primary);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            font-family: var(--nebula-font-family);
        `;

        // Create main sections - just webview and status bar
        const webContent = this.createWebContent();
        const statusBar = this.createStatusBar();
        const contextMenu = this.createContextMenu();

        // Assemble the UI
        container.appendChild(webContent);
        container.appendChild(statusBar);
        container.appendChild(contextMenu);

        // Set up initialization after UI is created
        setTimeout(() => {
            this.setupEventListeners();
            this.loadInitialPage();
            this.setupContextMenu();
        }, 0);

        return container;
    }

    /**
     * Create the right-click context menu
     * Contains navigation controls in a popup menu
     */
    createContextMenu() {
        const contextMenu = document.createElement('div');
        contextMenu.id = 'context-menu';
        contextMenu.className = 'pwa-context-menu';
        contextMenu.style.cssText = `
            position: fixed;
            background: var(--nebula-surface);
            border: 1px solid var(--nebula-border);
            border-radius: 8px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
            padding: 8px 0;
            min-width: 180px;
            z-index: 1000;
            display: none;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
        `;

        contextMenu.innerHTML = `
            <div class="context-menu-item" id="ctx-back">
                <span class="material-symbols-outlined">arrow_back</span>
                <span>Go Back</span>
            </div>
            <div class="context-menu-item" id="ctx-forward">
                <span class="material-symbols-outlined">arrow_forward</span>
                <span>Go Forward</span>
            </div>
            <div class="context-menu-item" id="ctx-refresh">
                <span class="material-symbols-outlined">refresh</span>
                <span>Refresh</span>
            </div>
            <div class="context-menu-separator"></div>
            <div class="context-menu-item" id="ctx-home">
                <span class="material-symbols-outlined">home</span>
                <span>Go Home</span>
            </div>
            <div class="context-menu-item" id="ctx-url">
                <span class="material-symbols-outlined">link</span>
                <span>Change URL</span>
            </div>
            <div class="context-menu-separator"></div>
            <div class="context-menu-item" id="ctx-fullscreen">
                <span class="material-symbols-outlined">fullscreen</span>
                <span>Toggle Fullscreen</span>
            </div>
        `;

        return contextMenu;
    }

    /**
     * Create the web content area
     * Contains the webview for hosting web content
     */
    createWebContent() {
        const webContent = document.createElement('div');
        webContent.className = 'pwa-web-content';
        webContent.style.cssText = `
            flex: 1;
            position: relative;
            background: white;
            overflow: hidden;
        `;

        // Create webview for web content
        const webview = document.createElement('webview');
        webview.id = 'web-webview';
        webview.style.cssText = `
            width: 100%;
            height: 100%;
            border: none;
            background: white;
        `;
        
        // Set webview attributes for better compatibility and security
        webview.setAttribute('allowpopups', 'true');
        webview.setAttribute('websecurity', 'true');
        webview.setAttribute('nodeintegration', 'false');
        webview.setAttribute('contextIsolation', 'true');
        webview.setAttribute('enableremotemodule', 'false');
        webview.setAttribute('partition', 'persist:pwa-host');

        // Create loading overlay
        const loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'loading-overlay';
        loadingOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: var(--nebula-bg-primary);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            gap: 16px;
            z-index: 10;
        `;

        loadingOverlay.innerHTML = `
            <div class="loading-spinner" style="
                width: 32px;
                height: 32px;
                border: 3px solid var(--nebula-border);
                border-top: 3px solid var(--nebula-primary);
                border-radius: 50%;
                animation: spin 1s linear infinite;
            "></div>
            <span style="color: var(--nebula-text-secondary);">Loading...</span>
        `;

        webContent.appendChild(webview);
        webContent.appendChild(loadingOverlay);

        return webContent;
    }

    /**
     * Create the status bar
     * Shows loading status and page info
     */
    createStatusBar() {
        const statusBar = document.createElement('div');
        statusBar.className = 'pwa-statusbar';
        statusBar.style.cssText = `
            height: 24px;
            background: var(--nebula-surface);
            border-top: 1px solid var(--nebula-border);
            display: flex;
            align-items: center;
            padding: 0 16px;
            font-size: 12px;
            color: var(--nebula-text-secondary);
            flex-shrink: 0;
        `;

        statusBar.innerHTML = `
            <span id="status-text">Ready</span>
            <div style="flex: 1;"></div>
            <span id="page-info"></span>
        `;

        return statusBar;
    }

    /**
     * Set up event listeners for PWA functionality
     */
    setupEventListeners() {
        const container = document.querySelector(`[data-window-id="${this.windowId}"] .pwa-host-container`);
        if (!container) return;

        const webview = container.querySelector('#web-webview');

        // Webview events
        if (webview) {
            webview.addEventListener('dom-ready', () => this.onPageLoad());
            webview.addEventListener('did-fail-load', () => this.onPageError());
            webview.addEventListener('did-start-loading', () => this.onStartLoading());
            webview.addEventListener('did-stop-loading', () => this.onStopLoading());
            webview.addEventListener('page-title-updated', (e) => this.onTitleUpdate(e.title));
            webview.addEventListener('did-navigate', (e) => this.onNavigate(e.url));
            webview.addEventListener('did-navigate-in-page', (e) => this.onNavigateInPage(e.url));
            webview.addEventListener('new-window', (e) => this.onNewWindow(e.url));
        }

        // Context menu event listeners
        const contextMenu = container.querySelector('#context-menu');
        if (contextMenu) {
            contextMenu.querySelector('#ctx-back').addEventListener('click', () => {
                this.goBack();
                this.hideContextMenu();
            });
            
            contextMenu.querySelector('#ctx-forward').addEventListener('click', () => {
                this.goForward();
                this.hideContextMenu();
            });
            
            contextMenu.querySelector('#ctx-refresh').addEventListener('click', () => {
                this.refresh();
                this.hideContextMenu();
            });
            
            contextMenu.querySelector('#ctx-home').addEventListener('click', () => {
                this.goHome();
                this.hideContextMenu();
            });
            
            contextMenu.querySelector('#ctx-url').addEventListener('click', () => {
                this.showUrlDialog();
                this.hideContextMenu();
            });
            
            contextMenu.querySelector('#ctx-fullscreen').addEventListener('click', () => {
                this.toggleFullscreen();
                this.hideContextMenu();
            });
        }
    }

    /**
     * Load the initial page
     */
    loadInitialPage() {
        this.navigateToUrl(this.currentUrl);
    }

    /**
     * Set up context menu functionality
     */
    setupContextMenu() {
        const container = document.querySelector(`[data-window-id="${this.windowId}"] .pwa-host-container`);
        if (!container) return;

        const webview = container.querySelector('#web-webview');
        const contextMenu = container.querySelector('#context-menu');

        if (webview && contextMenu) {
            // Right-click on webview to show context menu
            webview.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.showContextMenu(e.clientX, e.clientY);
            });

            // Hide context menu when clicking elsewhere
            document.addEventListener('click', (e) => {
                if (!contextMenu.contains(e.target)) {
                    this.hideContextMenu();
                }
            });

            // Hide context menu on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.hideContextMenu();
                }
            });
        }

        // Add CSS styles for context menu
        this.addContextMenuStyles();
    }

    /**
     * Show context menu at specified position
     */
    showContextMenu(x, y) {
        const container = document.querySelector(`[data-window-id="${this.windowId}"] .pwa-host-container`);
        const contextMenu = container?.querySelector('#context-menu');
        const webview = container?.querySelector('#web-webview');
        
        if (!contextMenu || !webview) return;

        // Update menu item states
        const backItem = contextMenu.querySelector('#ctx-back');
        const forwardItem = contextMenu.querySelector('#ctx-forward');
        
        if (backItem) {
            backItem.classList.toggle('disabled', !webview.canGoBack());
        }
        if (forwardItem) {
            forwardItem.classList.toggle('disabled', !webview.canGoForward());
        }

        // Position and show menu
        contextMenu.style.left = `${x}px`;
        contextMenu.style.top = `${y}px`;
        contextMenu.style.display = 'block';

        // Adjust position if menu would go off screen
        const rect = contextMenu.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        if (rect.right > windowWidth) {
            contextMenu.style.left = `${windowWidth - rect.width - 10}px`;
        }
        if (rect.bottom > windowHeight) {
            contextMenu.style.top = `${windowHeight - rect.height - 10}px`;
        }
    }

    /**
     * Hide context menu
     */
    hideContextMenu() {
        const container = document.querySelector(`[data-window-id="${this.windowId}"] .pwa-host-container`);
        const contextMenu = container?.querySelector('#context-menu');
        if (contextMenu) {
            contextMenu.style.display = 'none';
        }
    }

    /**
     * Show URL input dialog
     */
    showUrlDialog() {
        const newUrl = prompt('Enter URL:', this.currentUrl);
        if (newUrl && newUrl.trim()) {
            this.navigateToUrl(newUrl.trim());
        }
    }

    /**
     * Add CSS styles for context menu
     */
    addContextMenuStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .context-menu-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 8px 16px;
                cursor: pointer;
                color: var(--nebula-text-primary);
                font-size: 14px;
                transition: background-color 0.2s;
            }
            
            .context-menu-item:hover:not(.disabled) {
                background: var(--nebula-hover);
            }
            
            .context-menu-item.disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .context-menu-item .material-symbols-outlined {
                font-size: 18px;
                color: var(--nebula-text-secondary);
            }
            
            .context-menu-separator {
                height: 1px;
                background: var(--nebula-border);
                margin: 4px 0;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Navigate to a specific URL
     */
    navigateToUrl(url = null) {
        const container = document.querySelector(`[data-window-id="${this.windowId}"] .pwa-host-container`);
        if (!container) return;

        const webview = container.querySelector('#web-webview');
        const loadingOverlay = container.querySelector('#loading-overlay');

        if (!url) {
            url = this.currentUrl;
        }

        if (!url) return;

        // Add protocol if missing
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        this.isLoading = true;
        this.currentUrl = url;
        
        // Show loading overlay
        if (loadingOverlay) loadingOverlay.style.display = 'flex';
        
        // Navigate webview
        if (webview) {
            webview.loadURL(url);
        }
        
        this.updateStatus('Loading...');
    }

    /**
     * Go back in history
     */
    goBack() {
        const container = document.querySelector(`[data-window-id="${this.windowId}"] .pwa-host-container`);
        const webview = container?.querySelector('#web-webview');
        if (webview && webview.canGoBack()) {
            webview.goBack();
        }
    }

    /**
     * Go forward in history
     */
    goForward() {
        const container = document.querySelector(`[data-window-id="${this.windowId}"] .pwa-host-container`);
        const webview = container?.querySelector('#web-webview');
        if (webview && webview.canGoForward()) {
            webview.goForward();
        }
    }

    /**
     * Refresh current page
     */
    refresh() {
        const container = document.querySelector(`[data-window-id="${this.windowId}"] .pwa-host-container`);
        const webview = container?.querySelector('#web-webview');
        if (webview) {
            webview.reload();
        }
    }

    /**
     * Go to home page
     */
    goHome() {
        this.navigateToUrl(this.settings.defaultHomePage);
    }

    /**
     * Update navigation button states
     */
    updateNavigationButtons() {
        const container = document.querySelector(`[data-window-id="${this.windowId}"] .pwa-host-container`);
        if (!container) return;

        const backBtn = container.querySelector('#back-btn');
        const forwardBtn = container.querySelector('#forward-btn');
        const webview = container.querySelector('#web-webview');

        if (webview && backBtn && forwardBtn) {
            backBtn.disabled = !webview.canGoBack();
            forwardBtn.disabled = !webview.canGoForward();
        }
    }

    /**
     * Handle webview start loading
     */
    onStartLoading() {
        this.isLoading = true;
        const container = document.querySelector(`[data-window-id="${this.windowId}"] .pwa-host-container`);
        const loadingOverlay = container?.querySelector('#loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
        this.updateStatus('Loading...');
    }

    /**
     * Handle webview stop loading
     */
    onStopLoading() {
        this.isLoading = false;
        const container = document.querySelector(`[data-window-id="${this.windowId}"] .pwa-host-container`);
        const loadingOverlay = container?.querySelector('#loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
        this.updateNavigationButtons();
    }

    /**
     * Handle page navigation
     */
    onNavigate(url) {
        this.currentUrl = url;
        this.updatePageInfo();
        this.updateNavigationButtons();
    }

    /**
     * Handle in-page navigation (like hash changes)
     */
    onNavigateInPage(url) {
        this.currentUrl = url;
        this.updatePageInfo();
    }

    /**
     * Handle page title updates
     */
    onTitleUpdate(title) {
        // Update window title if desired
        if (window.windowManager && this.windowId) {
            window.windowManager.setWindowTitle(this.windowId, `PWA Host - ${title}`);
        }
    }

    /**
     * Handle new window requests
     */
    onNewWindow(url) {
        // Handle popup windows - could open in new PWA host instance
        console.log('New window requested:', url);
        // TODO: Implement new window handling
    }

    /**
     * Handle page load completion
     */
    onPageLoad() {
        const container = document.querySelector(`[data-window-id="${this.windowId}"] .pwa-host-container`);
        if (!container) return;

        const loadingOverlay = container.querySelector('#loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }

        this.isLoading = false;
        this.updateStatus('Page loaded');
        this.updatePageInfo();
    }

    /**
     * Handle page load error
     */
    onPageError() {
        this.isLoading = false;
        this.updateStatus('Failed to load page');
    }

    /**
     * Update status bar text
     */
    updateStatus(message) {
        const container = document.querySelector(`[data-window-id="${this.windowId}"] .pwa-host-container`);
        if (!container) return;

        const statusText = container.querySelector('#status-text');
        if (statusText) {
            statusText.textContent = message;
        }
    }

    /**
     * Update page info in status bar
     */
    updatePageInfo() {
        const container = document.querySelector(`[data-window-id="${this.windowId}"] .pwa-host-container`);
        if (!container) return;

        const pageInfo = container.querySelector('#page-info');
        if (pageInfo) {
            try {
                const url = new URL(this.currentUrl);
                pageInfo.textContent = url.hostname;
            } catch (e) {
                pageInfo.textContent = '';
            }
        }
    }

    /**
     * Toggle fullscreen mode
     */
    toggleFullscreen() {
        if (window.windowManager && this.windowId) {
            // Use Nebula's window manager to toggle fullscreen
            window.windowManager.toggleFullscreen(this.windowId);
        }
        this.updateStatus('Toggled fullscreen');
    }

    /**
     * Called when the window is being closed
     */
    onDestroy() {
        console.log('PWAHost is being destroyed');
        // Clean up resources
    }

    /**
     * Called when the window is resized
     */
    onResize(width, height) {
        console.log(`PWAHost resized to ${width}x${height}`);
        // Handle responsive adjustments if needed
    }

    /**
     * Called when the window gains focus
     */
    onFocus() {
        console.log('PWAHost gained focus');
    }

    /**
     * Called when the window loses focus
     */
    onBlur() {
        console.log('PWAHost lost focus');
    }

    /**
     * Get window title
     */
    getTitle() {
        return 'PWA Host';
    }

    /**
     * Get window icon
     */
    getIcon() {
        return 'web';
    }
}

