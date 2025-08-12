// WindowManager.js - Centralized window management system
class WindowManager {
    constructor() {
        this.windows = new Map(); // windowId -> windowData
        this.activeWindow = null;
        this.nextId = 1;
        this.zIndexCounter = 100;

        this.setupGlobalListeners();
    }

    /**
     * Creates a new window that can host apps
     * @param {Object} options - Window configuration
     * @returns {string} windowId - Unique identifier for the window
     */
    createWindow(options = {}) {
        const windowId = `window-${this.nextId++}`;

        // Default window options
        const config = {
            title: options.title || 'Nebula Window',
            width: options.width || 800,
            height: options.height || 600,
            x: options.x || this.calculateDefaultPosition().x,
            y: options.y || this.calculateDefaultPosition().y,
            resizable: options.resizable !== false, // Default to true
            maximizable: options.maximizable !== false,
            minimizable: options.minimizable !== false,
            hasTabBar: options.hasTabBar || false, // For multi-tab apps like browser
            ...options
        };

        console.log(`Creating window with config:`, config);

        // Create window DOM structure
        const windowElement = this.createWindowElement(windowId, config);
        document.getElementById('desktop').appendChild(windowElement);

        // Store window data
        const windowData = {
            id: windowId,
            element: windowElement,
            config: config,
            isMaximized: false,
            isMinimized: false,
            savedPosition: null,
            savedSize: null,
            tabs: new Map(), // For multi-tab support
            activeTab: null,
            app: null // Reference to the app instance
        };

        this.windows.set(windowId, windowData);
        this.focusWindow(windowId);

        console.log(`Created window: ${windowId}`);
        return windowId;
    }

    /**
     * Creates the DOM structure for a window
     */
    createWindowElement(windowId, config) {
        const window = document.createElement('div');
        window.className = 'nebula-window';
        window.id = windowId;
        window.style.cssText = `
            position: absolute;
            width: ${config.width}px;
            height: ${config.height}px;
            left: ${config.x}px;
            top: ${config.y}px;
            z-index: ${this.zIndexCounter++};
        `;

        window.innerHTML = `
            <div class="window-titlebar" data-window-id="${windowId}">
                <div class="window-title">${config.title}</div>
                <div class="window-controls">
                    ${config.minimizable ? `<button class="window-btn minimize" data-action="minimize" data-window-id="${windowId}" title="Minimize"><span class="material-symbols-outlined">minimize</span></button>` : ''}
                    ${config.maximizable ? `<button class="window-btn maximize" data-action="maximize" data-window-id="${windowId}" title="Maximize"><span class="material-symbols-outlined">crop_square</span></button>` : ''}
                    <button class="window-btn close" data-action="close" data-window-id="${windowId}" title="Close"><span class="material-symbols-outlined">close</span></button>
                </div>
            </div>
            
            ${config.hasTabBar ? `
                <div class="window-tabbar" data-window-id="${windowId}">
                    <div class="tab-list"></div>
                    <button class="new-tab-btn" data-window-id="${windowId}"><span class="material-symbols-outlined">add</span></button>
                </div>
            ` : ''}
            
            <div class="window-content" data-window-id="${windowId}">
                <!-- App content goes here -->
            </div>
        `;

        this.setupWindowListeners(window, windowId);
        return window;
    }

    /**
     * Loads an app into a window
     * @param {string} windowId - Target window
     * @param {Object} app - App instance
     * @param {string} tabId - Optional tab ID for multi-tab apps
     */
    loadApp(windowId, app, tabId = null) {
        const windowData = this.windows.get(windowId);
        if (!windowData) {
            console.error(`Window ${windowId} not found`);
            return;
        }

        if (windowData.config.hasTabBar && tabId) {
            // Multi-tab app (like browser)
            this.loadAppInTab(windowId, app, tabId);
        } else {
            // Single-window app (like file manager)
            this.loadAppInWindow(windowId, app);
        }
    }

    /**
     * Loads app content directly into window (single-app windows)
     */
    loadAppInWindow(windowId, app) {
        const windowData = this.windows.get(windowId);
        const contentArea = windowData.element.querySelector('.window-content');

        // Clear existing content
        contentArea.innerHTML = '';

        // Let the app render its content
        if (app.render) {
            const appContent = app.render();
            contentArea.appendChild(appContent);
        }

        // Store app reference
        windowData.app = app;

        // Update window title if app provides one
        if (app.getTitle) {
            this.setWindowTitle(windowId, app.getTitle());
        }
    }

    /**
     * Creates a new tab and loads app content (multi-tab apps)
     */
    createTab(windowId, options = {}) {
        const windowData = this.windows.get(windowId);
        if (!windowData || !windowData.config.hasTabBar) {
            console.error(`Window ${windowId} doesn't support tabs`);
            return null;
        }

        const tabId = `tab-${Date.now()}`;
        const tabData = {
            id: tabId,
            title: options.title || 'New Tab',
            icon: options.icon || '🌐',
            content: null,
            app: null
        };

        // Create tab button
        const tabButton = document.createElement('div');
        tabButton.className = 'window-tab';
        tabButton.dataset.tabId = tabId;
        tabButton.dataset.windowId = windowId;
        tabButton.innerHTML = `
            <div class="tab-icon">${tabData.icon}</div>
            <div class="tab-title">${tabData.title}</div>
            <button class="tab-close" data-action="close-tab" data-tab-id="${tabId}">×</button>
        `;

        // Create tab content container
        const tabContent = document.createElement('div');
        tabContent.className = 'tab-content';
        tabContent.dataset.tabId = tabId;
        tabContent.style.display = 'none';

        // Add to DOM
        const tabList = windowData.element.querySelector('.tab-list');
        const contentArea = windowData.element.querySelector('.window-content');

        tabList.appendChild(tabButton);
        contentArea.appendChild(tabContent);

        // Store tab data
        tabData.element = tabButton;
        tabData.content = tabContent;
        windowData.tabs.set(tabId, tabData);

        // Activate this tab
        this.activateTab(windowId, tabId);

        return tabId;
    }

    /**
     * Loads an app into a specific tab
     */
    loadAppInTab(windowId, app, tabId) {
        const windowData = this.windows.get(windowId);
        const tabData = windowData.tabs.get(tabId);

        if (!tabData) {
            console.error(`Tab ${tabId} not found in window ${windowId}`);
            return;
        }

        // Let the app render its content
        if (app.render) {
            const appContent = app.render();
            tabData.content.innerHTML = '';
            tabData.content.appendChild(appContent);
        }

        // Store app reference
        tabData.app = app;

        // Update tab title if app provides one
        if (app.getTitle) {
            this.setTabTitle(windowId, tabId, app.getTitle());
        }

        // Update tab icon if app provides one
        if (app.getIcon) {
            this.setTabIcon(windowId, tabId, app.getIcon());
        }
    }

    /**
     * Activates a specific tab
     */
    activateTab(windowId, tabId) {
        const windowData = this.windows.get(windowId);

        // Deactivate all tabs
        windowData.tabs.forEach((tab, id) => {
            tab.element.classList.remove('active');
            tab.content.style.display = 'none';
        });

        // Activate selected tab
        const activeTab = windowData.tabs.get(tabId);
        if (activeTab) {
            activeTab.element.classList.add('active');
            activeTab.content.style.display = 'block';
            windowData.activeTab = tabId;
        }
    }

    /**
     * Closes a specific tab
     */
    closeTab(windowId, tabId) {
        const windowData = this.windows.get(windowId);
        const tabData = windowData.tabs.get(tabId);

        if (!tabData) return;

        // Clean up app if it has cleanup method
        if (tabData.app && tabData.app.cleanup) {
            tabData.app.cleanup();
        }

        // Remove from DOM
        tabData.element.remove();
        tabData.content.remove();

        // Remove from tabs map
        windowData.tabs.delete(tabId);

        // If this was the active tab, activate another one
        if (windowData.activeTab === tabId) {
            const remainingTabs = Array.from(windowData.tabs.keys());
            if (remainingTabs.length > 0) {
                this.activateTab(windowId, remainingTabs[0]);
            } else {
                windowData.activeTab = null;
            }
        }

        // If no tabs left, close the window
        if (windowData.tabs.size === 0 && windowData.config.hasTabBar) {
            this.closeWindow(windowId);
        }
    }

    /**
     * Brings a window to the front
     */
    focusWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData || windowData.isMinimized) return;

        // Only update z-index if this window isn't already active
        if (this.activeWindow !== windowId) {
            // Update z-index to bring to front
            windowData.element.style.zIndex = this.zIndexCounter++;
            this.activeWindow = windowId;

            // Update visual state efficiently
            requestAnimationFrame(() => {
                this.windows.forEach((data, id) => {
                    if (id !== windowId) {
                        data.element.classList.remove('focused');
                    }
                });
                windowData.element.classList.add('focused');
            });

            console.log(`Focused window: ${windowId}`);
        }
    }

    /**
     * Minimizes a window with animation
     */
    minimizeWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;

        windowData.element.classList.add('minimizing');

        // Use animation event instead of timeout for better performance
        const handleAnimationEnd = () => {
            // Use CSS class instead of inline style to avoid display conflicts
            windowData.element.classList.add('window-hidden');
            windowData.element.classList.remove('minimizing');
            windowData.isMinimized = true;
            windowData.element.removeEventListener('animationend', handleAnimationEnd);
        };

        windowData.element.addEventListener('animationend', handleAnimationEnd);

        // Fallback timeout in case animation doesn't fire
        setTimeout(() => {
            if (windowData.isMinimized) return;
            handleAnimationEnd();
        }, 350);

        console.log(`Minimized window: ${windowId}`);
    }

    /**
     * Restores a minimized window
     */
    restoreWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData || !windowData.isMinimized) return;

        // Use CSS class instead of inline style to avoid display conflicts
        windowData.element.classList.remove('window-hidden');
        windowData.element.classList.add('restoring');
        windowData.isMinimized = false;

        // Remove animation class after animation completes
        setTimeout(() => {
            windowData.element.classList.remove('restoring');
        }, 300);

        this.focusWindow(windowId);

        console.log(`Restored window: ${windowId}`);
    }

    /**
     * Maximizes or restores a window
     */
    toggleMaximizeWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;

        if (windowData.isMaximized) {
            // Restore to previous size/position
            if (windowData.savedPosition) {
                Object.assign(windowData.element.style, {
                    width: windowData.savedSize.width,
                    height: windowData.savedSize.height,
                    left: windowData.savedPosition.x,
                    top: windowData.savedPosition.y
                });
            }
            windowData.element.classList.remove('maximized');
            windowData.isMaximized = false;
        } else {
            // Save current position/size
            const rect = windowData.element.getBoundingClientRect();
            windowData.savedPosition = { x: rect.left + 'px', y: rect.top + 'px' };
            windowData.savedSize = { width: rect.width + 'px', height: rect.height + 'px' };

            // Maximize
            Object.assign(windowData.element.style, {
                width: '100vw',
                height: 'calc(100vh - 50px)', // Account for taskbar
                left: '0px',
                top: '0px'
            });
            windowData.element.classList.add('maximized');
            windowData.isMaximized = true;
        }
    }

    /**
     * Closes a window and cleans up
     */
    closeWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;

        // Clean up all tabs
        if (windowData.config.hasTabBar) {
            windowData.tabs.forEach((_, tabId) => {
                this.closeTab(windowId, tabId);
            });
        }

        // Clean up main app
        if (windowData.app && windowData.app.cleanup) {
            windowData.app.cleanup();
        }

        // Remove from DOM
        windowData.element.remove();

        // Remove from windows map
        this.windows.delete(windowId);

        // Update active window
        if (this.activeWindow === windowId) {
            this.activeWindow = null;
        }

        console.log(`Closed window: ${windowId}`);
    }

    /**
     * Helper methods for updating window/tab properties
     */
    setWindowTitle(windowId, title) {
        const windowData = this.windows.get(windowId);
        if (windowData) {
            windowData.element.querySelector('.window-title').textContent = title;
        }
    }

    setTabTitle(windowId, tabId, title) {
        const windowData = this.windows.get(windowId);
        const tabData = windowData?.tabs.get(tabId);
        if (tabData) {
            tabData.element.querySelector('.tab-title').textContent = title;
        }
    }

    setTabIcon(windowId, tabId, icon) {
        const windowData = this.windows.get(windowId);
        const tabData = windowData?.tabs.get(tabId);
        if (tabData) {
            tabData.element.querySelector('.tab-icon').textContent = icon;
        }
    }

    /**
     * Calculates default position for new windows (cascade effect)
     */
    calculateDefaultPosition() {
        const offset = (this.windows.size % 10) * 30; // Cascade windows
        return {
            x: 100 + offset,
            y: 100 + offset
        };
    }

    /**
     * Sets up global event listeners for window management
     */
    setupGlobalListeners() {
        // Throttled focus handler for better performance
        let focusTimeout = null;
        document.addEventListener('mousedown', (e) => {
            // Clear any pending focus update
            if (focusTimeout) {
                clearTimeout(focusTimeout);
            }

            // Use a small delay to batch focus updates
            focusTimeout = setTimeout(() => {
                const windowElement = e.target.closest('.nebula-window');
                if (windowElement) {
                    this.focusWindow(windowElement.id);
                }
            }, 0);
        }, { passive: true });

        // Efficient event delegation for window controls
        document.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            const windowId = e.target.dataset.windowId;
            const tabId = e.target.dataset.tabId;

            if (!action || !windowId) return;

            // Prevent event bubbling for control actions
            e.stopPropagation();

            switch (action) {
                case 'minimize':
                    this.minimizeWindow(windowId);
                    break;
                case 'maximize':
                    this.toggleMaximizeWindow(windowId);
                    break;
                case 'close':
                    this.closeWindow(windowId);
                    break;
                case 'close-tab':
                    if (tabId) this.closeTab(windowId, tabId);
                    break;
            }
        });

        // Emergency fix - add direct span click handling
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('material-symbols-outlined')) {
                const button = e.target.closest('.window-btn');
                if (button) {
                    button.click(); // Trigger button click
                    console.log('Span click redirected to button');
                }
            }
        });

        // Handle tab switching with delegation
        document.addEventListener('click', (e) => {
            const tabElement = e.target.closest('.window-tab');
            if (tabElement && !e.target.classList.contains('tab-close')) {
                const windowId = tabElement.dataset.windowId;
                const tabId = tabElement.dataset.tabId;
                if (windowId && tabId) {
                    this.activateTab(windowId, tabId);
                }
            }
        });

        // Handle new tab button efficiently
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('new-tab-btn')) {
                const windowId = e.target.dataset.windowId;
                const tabId = this.createTab(windowId);

                // Notify the app about new tab creation
                const windowData = this.windows.get(windowId);
                if (windowData.app && windowData.app.onNewTab) {
                    windowData.app.onNewTab(tabId);
                }

                e.stopPropagation();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Alt+Tab window switching
            if (e.altKey && e.key === 'Tab') {
                e.preventDefault();
                this.switchToNextWindow();
            }

            // Ctrl+W close tab/window
            if (e.ctrlKey && e.key === 'w') {
                e.preventDefault();
                if (this.activeWindow) {
                    const windowData = this.windows.get(this.activeWindow);
                    if (windowData && windowData.config.hasTabBar && windowData.activeTab) {
                        this.closeTab(this.activeWindow, windowData.activeTab);
                    } else {
                        this.closeWindow(this.activeWindow);
                    }
                }
            }

            // Ctrl+T new tab
            if (e.ctrlKey && e.key === 't') {
                e.preventDefault();
                if (this.activeWindow) {
                    const windowData = this.windows.get(this.activeWindow);
                    if (windowData && windowData.config.hasTabBar) {
                        const tabId = this.createTab(this.activeWindow);
                        if (windowData.app && windowData.app.onNewTab) {
                            windowData.app.onNewTab(tabId);
                        }
                    }
                }
            }
        });
    }

    /**
     * Switches to the next window (Alt+Tab functionality)
     */
    switchToNextWindow() {
        const visibleWindows = Array.from(this.windows.entries())
            .filter(([id, data]) => !data.isMinimized)
            .map(([id]) => id);

        if (visibleWindows.length <= 1) return;

        const currentIndex = visibleWindows.indexOf(this.activeWindow);
        const nextIndex = (currentIndex + 1) % visibleWindows.length;
        const nextWindowId = visibleWindows[nextIndex];

        this.focusWindow(nextWindowId);
    }

    /**
     * Sets up drag functionality for a specific window
     */
    setupWindowListeners(windowElement, windowId) {
        const titlebar = windowElement.querySelector('.window-titlebar');
        let isDragging = false;
        let startX, startY, initialX, initialY;
        let animationFrame = null;

        titlebar.addEventListener('mousedown', (e) => {
            // Don't start drag if clicking on window controls
            if (e.target.closest('.window-controls')) return;

            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;

            // Get current position from computed style
            const computedStyle = window.getComputedStyle(windowElement);
            initialX = parseInt(computedStyle.left) || 0;
            initialY = parseInt(computedStyle.top) || 0;

            // Add dragging class for visual feedback
            windowElement.classList.add('dragging');
            titlebar.style.cursor = 'grabbing';

            // Bring window to front immediately
            this.focusWindow(windowId);

            // Add global event listeners
            document.addEventListener('mousemove', handleDrag, { passive: false });
            document.addEventListener('mouseup', stopDrag);

            // Prevent text selection and default behaviors
            e.preventDefault();
            e.stopPropagation();
        });

        const handleDrag = (e) => {
            if (!isDragging) return;

            // Cancel any pending animation frame
            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
            }

            // Use requestAnimationFrame for smooth movement
            animationFrame = requestAnimationFrame(() => {
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;

                const newX = initialX + deltaX;
                const newY = initialY + deltaY;

                // Constrain to viewport bounds
                const maxX = window.innerWidth - 100; // Keep at least 100px visible
                const maxY = window.innerHeight - 100;
                const minX = -windowElement.offsetWidth + 100; // Allow dragging mostly off-screen
                const minY = 0; // Don't allow dragging above viewport

                const constrainedX = Math.max(minX, Math.min(maxX, newX));
                const constrainedY = Math.max(minY, Math.min(maxY, newY));

                // Apply position immediately for smooth movement
                windowElement.style.left = constrainedX + 'px';
                windowElement.style.top = constrainedY + 'px';
            });

            // Prevent default to avoid any lag
            e.preventDefault();
        };

        const stopDrag = (e) => {
            if (!isDragging) return;

            isDragging = false;

            // Cancel any pending animation
            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
                animationFrame = null;
            }

            // Remove visual feedback
            windowElement.classList.remove('dragging');
            titlebar.style.cursor = '';

            // Remove event listeners
            document.removeEventListener('mousemove', handleDrag);
            document.removeEventListener('mouseup', stopDrag);

            e.preventDefault();
        };

        // Handle double-click on titlebar to maximize/restore
        titlebar.addEventListener('dblclick', (e) => {
            if (e.target.closest('.window-controls')) return;
            this.toggleMaximizeWindow(windowId);
        });

        // Add resize handles
        this.addResizeHandles(windowElement, windowId);
    }

    /**
     * Adds resize handles to a window
     */
    addResizeHandles(windowElement, windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData || !windowData.config.resizable) {
            console.log(`Skipping resize handles for window ${windowId} - not resizable`);
            return;
        }

        console.log(`Adding resize handles to window ${windowId}`);

        // Create resize handles
        const handles = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];

        handles.forEach(direction => {
            const handle = document.createElement('div');
            handle.className = `resize-handle resize-${direction}`;
            handle.dataset.direction = direction;
            handle.title = `Resize ${direction.toUpperCase()}`; // Add tooltip for debugging
            windowElement.appendChild(handle);

            this.setupResizeHandle(handle, windowElement, windowId, direction);
            console.log(`Created ${direction} resize handle`);
        });
    }

    /**
     * Sets up a single resize handle
     */
    setupResizeHandle(handle, windowElement, windowId, direction) {
        let isResizing = false;
        let startX, startY, startWidth, startHeight, startLeft, startTop;
        let animationFrame = null;

        handle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;

            const rect = windowElement.getBoundingClientRect();
            const computedStyle = window.getComputedStyle(windowElement);

            startWidth = rect.width;
            startHeight = rect.height;
            startLeft = parseInt(computedStyle.left) || 0;
            startTop = parseInt(computedStyle.top) || 0;

            windowElement.classList.add('resizing');
            document.addEventListener('mousemove', handleResize);
            document.addEventListener('mouseup', stopResize);

            e.preventDefault();
            e.stopPropagation();
        });

        const handleResize = (e) => {
            if (!isResizing) return;

            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
            }

            animationFrame = requestAnimationFrame(() => {
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;

                let newWidth = startWidth;
                let newHeight = startHeight;
                let newLeft = startLeft;
                let newTop = startTop;

                // Apply resize based on direction
                if (direction.includes('e')) {
                    newWidth = Math.max(300, startWidth + deltaX);
                }
                if (direction.includes('w')) {
                    newWidth = Math.max(300, startWidth - deltaX);
                    newLeft = startLeft + (startWidth - newWidth);
                }
                if (direction.includes('s')) {
                    newHeight = Math.max(200, startHeight + deltaY);
                }
                if (direction.includes('n')) {
                    newHeight = Math.max(200, startHeight - deltaY);
                    newTop = startTop + (startHeight - newHeight);
                }

                // Apply the new dimensions
                windowElement.style.width = newWidth + 'px';
                windowElement.style.height = newHeight + 'px';
                windowElement.style.left = newLeft + 'px';
                windowElement.style.top = newTop + 'px';
            });

            e.preventDefault();
        };

        const stopResize = () => {
            isResizing = false;

            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
                animationFrame = null;
            }

            windowElement.classList.remove('resizing');
            document.removeEventListener('mousemove', handleResize);
            document.removeEventListener('mouseup', stopResize);
        };
    }

    /**
     * Gets all windows (useful for taskbar integration)
     */
    getAllWindows() {
        return Array.from(this.windows.values());
    }

    /**
     * Gets active window
     */
    getActiveWindow() {
        return this.windows.get(this.activeWindow);
    }

    /**
     * Exposes restoreWindow method for external use (like taskbar)
     */
    restoreWindowById(windowId) {
        this.restoreWindow(windowId);
    }
}

// Make WindowManager available globally
window.WindowManager = WindowManager;