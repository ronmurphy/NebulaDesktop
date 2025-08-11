class BrowserWindow {
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
        
        // Load saved state or use defaults
        const savedState = this.loadWindowState();
        const desktop = document.getElementById('desktop');
        
        // Set dimensions and position
        windowEl.style.width = savedState.width + 'px';
        windowEl.style.height = savedState.height + 'px';
        windowEl.style.left = savedState.x + 'px';
        windowEl.style.top = savedState.y + 'px';
        
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
                        <md-icon-button id="back-${this.windowId}" class="nav-btn" onclick="window.browserWindow.goBack()">
                            <span class="material-symbols-outlined">arrow_back_ios</span>
                        </md-icon-button>
                        <md-icon-button id="forward-${this.windowId}" class="nav-btn" onclick="window.browserWindow.goForward()">
                            <span class="material-symbols-outlined">arrow_forward_ios</span>
                        </md-icon-button>
                        <md-icon-button id="refresh-${this.windowId}" class="nav-btn" onclick="window.browserWindow.reload()">
                            <span class="material-symbols-outlined">refresh</span>
                        </md-icon-button>
                        <md-outlined-text-field 
                            class="url-bar" 
                            id="url-${this.windowId}" 
                            value="${url}"
                            label="Enter URL..."
                            onkeypress="if(event.key==='Enter') this.closest('.browser-window').browserWindow.navigate(this.value)">
                            <span slot="leading-icon" class="material-symbols-outlined">public</span>
                        </md-outlined-text-field>
                        <!-- Fallback URL bar if Material Web fails -->
                        <input 
                            type="text"
                            class="url-bar-fallback" 
                            id="url-fallback-${this.windowId}" 
                            value="${url}"
                            placeholder="Enter URL..."
                            style="display: none; flex: 1; height: 36px; background: rgba(255,255,255,0.1); border: 1px solid #666; border-radius: 8px; color: white; padding: 0 12px;"
                            onkeypress="if(event.key==='Enter') this.closest('.browser-window').browserWindow.navigate(this.value)">
                        <md-filled-button id="go-${this.windowId}" class="nav-go" onclick="this.closest('.browser-window').browserWindow.navigate(document.getElementById('url-${this.windowId}').value || document.getElementById('url-fallback-${this.windowId}').value)">
                            Go
                        </md-filled-button>
                    </div>
                    <div class="webview-container" id="webviews-${this.windowId}">
                        <!-- Webviews go here -->
                    </div>
                </div>
            </div>
            <!-- Resize handles -->
            <div class="resize-handle resize-n"></div>
            <div class="resize-handle resize-s"></div>
            <div class="resize-handle resize-e"></div>
            <div class="resize-handle resize-w"></div>
            <div class="resize-handle resize-ne"></div>
            <div class="resize-handle resize-nw"></div>
            <div class="resize-handle resize-se"></div>
            <div class="resize-handle resize-sw"></div>
        `;
        
        document.getElementById('desktop').appendChild(windowEl);
        
        // Setup window controls
        this.setupWindowControls(windowEl);
        this.setupNavigation();
        this.setupWindowDragging(windowEl);
        this.setupWindowResizing(windowEl);
        
        // Create first tab
        this.createTab(url);
        
        // Check if Material Web URL bar is visible, if not show fallback
        setTimeout(() => {
            const materialUrlBar = windowEl.querySelector(`#url-${this.windowId}`);
            const fallbackUrlBar = windowEl.querySelector(`#url-fallback-${this.windowId}`);
            
            // Check if material web component is properly rendered
            const materialBarRect = materialUrlBar ? materialUrlBar.getBoundingClientRect() : null;
            if (!materialBarRect || (materialBarRect.width === 0 && materialBarRect.height === 0)) {
                // Material Web text field is not visible, show fallback
                if (materialUrlBar) materialUrlBar.style.display = 'none';
                if (fallbackUrlBar) fallbackUrlBar.style.display = 'flex';
                console.log('Using fallback URL bar for browser window');
            } else {
                console.log('Material Web URL bar is working correctly');
            }
        }, 1000);
        
        // New tab button
        windowEl.querySelector('.new-tab-btn').addEventListener('click', () => {
            this.createTab('https://google.com');
        });

        // Save state when window is moved or resized
        this.setupStateSaving(windowEl);
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
            tab.webview.style.display = '';  // Remove inline display style to use CSS
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
        // Minimize
        windowEl.querySelector('.minimize').addEventListener('click', () => {
            windowEl.style.display = 'none';
        });
        
        // Maximize/Restore
        windowEl.querySelector('.maximize').addEventListener('click', () => {
            if (windowEl.classList.contains('maximized')) {
                // Restore to previous size and position
                const savedState = this.loadWindowState();
                windowEl.style.width = savedState.width + 'px';
                windowEl.style.height = savedState.height + 'px';
                windowEl.style.left = savedState.x + 'px';
                windowEl.style.top = savedState.y + 'px';
                windowEl.classList.remove('maximized');
                windowEl.querySelector('.maximize').textContent = '□';
            } else {
                // Save current state before maximizing
                this.saveWindowState();
                
                // Maximize
                windowEl.style.width = '100%';
                windowEl.style.height = 'calc(100% - 48px)';
                windowEl.style.left = '0';
                windowEl.style.top = '0';
                windowEl.classList.add('maximized');
                windowEl.querySelector('.maximize').textContent = '🗗';
            }
        });
        
        // Close
        windowEl.querySelector('.close').addEventListener('click', () => {
            this.saveWindowState();
            
            // Clean up localStorage entry when window is closed
            localStorage.removeItem(`nebula-window-${this.windowId.replace('browser-', '')}`);
            
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
            if (windowEl.classList.contains('maximized')) return; // Don't drag when maximized
            
            isDragging = true;
            initialX = e.clientX - windowEl.offsetLeft;
            initialY = e.clientY - windowEl.offsetTop;
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
        
        const onMouseMove = (e) => {
            if (!isDragging) return;
            
            windowEl.style.left = (e.clientX - initialX) + 'px';
            windowEl.style.top = (e.clientY - initialY) + 'px';
        };
        
        const onMouseUp = () => {
            isDragging = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            
            // Save position
            this.saveWindowState();
        };
    }

    setupWindowResizing(windowEl) {
        const resizeHandles = windowEl.querySelectorAll('.resize-handle');
        let isResizing = false;
        let currentHandle = null;
        let startX, startY, startWidth, startHeight, startLeft, startTop;
        
        resizeHandles.forEach(handle => {
            handle.addEventListener('mousedown', (e) => {
                if (windowEl.classList.contains('maximized')) return; // Don't resize when maximized
                
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
            
            // Determine resize direction based on handle class
            if (currentHandle.classList.contains('resize-e') || currentHandle.classList.contains('resize-ne') || currentHandle.classList.contains('resize-se')) {
                newWidth = Math.max(300, startWidth + dx); // Min width 300px
            }
            if (currentHandle.classList.contains('resize-w') || currentHandle.classList.contains('resize-nw') || currentHandle.classList.contains('resize-sw')) {
                newWidth = Math.max(300, startWidth - dx);
                newLeft = startLeft + (startWidth - newWidth);
            }
            if (currentHandle.classList.contains('resize-s') || currentHandle.classList.contains('resize-se') || currentHandle.classList.contains('resize-sw')) {
                newHeight = Math.max(200, startHeight + dy); // Min height 200px
            }
            if (currentHandle.classList.contains('resize-n') || currentHandle.classList.contains('resize-ne') || currentHandle.classList.contains('resize-nw')) {
                newHeight = Math.max(200, startHeight - dy);
                newTop = startTop + (startHeight - newHeight);
            }
            
            // Apply new dimensions and position
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
            
            // Save new size
            this.saveWindowState();
        };
    }

    loadWindowState() {
        const saved = localStorage.getItem(`nebula-window-${this.windowId.replace('browser-', '')}`);
        const desktop = document.getElementById('desktop');
        
        if (saved) {
            const state = JSON.parse(saved);
            // Ensure the window fits within current screen bounds
            return {
                width: Math.min(state.width, desktop.offsetWidth - 50),
                height: Math.min(state.height, desktop.offsetHeight - 100),
                x: Math.max(0, Math.min(state.x, desktop.offsetWidth - state.width)),
                y: Math.max(0, Math.min(state.y, desktop.offsetHeight - state.height))
            };
        }
        
        // Default centered position
        return {
            width: 1200,
            height: 700,
            x: (desktop.offsetWidth - 1200) / 2,
            y: (desktop.offsetHeight - 700) / 2
        };
    }

    saveWindowState() {
        const windowEl = document.getElementById(this.windowId);
        if (!windowEl || windowEl.classList.contains('maximized')) return;
        
        const state = {
            width: parseInt(windowEl.style.width, 10),
            height: parseInt(windowEl.style.height, 10),
            x: windowEl.offsetLeft,
            y: windowEl.offsetTop
        };
        
        localStorage.setItem(`nebula-window-${this.windowId.replace('browser-', '')}`, JSON.stringify(state));
    }

    setupStateSaving(windowEl) {
        // Save state when window is closed
        windowEl.querySelector('.close').addEventListener('click', () => {
            this.saveWindowState();
        });
        
        // Save state periodically (every 5 seconds if window has been moved/resized)
        let hasChanged = false;
        const originalLeft = windowEl.offsetLeft;
        const originalTop = windowEl.offsetTop;
        const originalWidth = parseInt(windowEl.style.width, 10);
        const originalHeight = parseInt(windowEl.style.height, 10);
        
        setInterval(() => {
            if (windowEl.offsetLeft !== originalLeft || 
                windowEl.offsetTop !== originalTop ||
                parseInt(windowEl.style.width, 10) !== originalWidth ||
                parseInt(windowEl.style.height, 10) !== originalHeight) {
                hasChanged = true;
            }
            
            if (hasChanged) {
                this.saveWindowState();
                hasChanged = false;
            }
        }, 5000);
    }
}
