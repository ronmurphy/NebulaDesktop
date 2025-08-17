// WindowManager.js - Centralized window management system with Icon Support
class WindowManager {
    constructor() {
        this.windows = new Map(); // windowId -> windowData
        this.activeWindow = null;
        this.nextId = 1;
        this.zIndexCounter = 100;

        // this.setupGlobalListeners();
        // Available desktop area (accounts for pinned panels, taskbars, etc.)
        this.availableArea = {
            x: 0,
            y: 0,
            width: window.innerWidth,
            height: window.innerHeight - 50 // Default: full screen minus taskbar
        };

        this.setupGlobalListeners();

        // Listen for window resize to update available area
        window.addEventListener('resize', () => {
            this.updateAvailableArea(
                this.availableArea.x,
                window.innerWidth - this.availableArea.width - this.availableArea.x,
                this.availableArea.y,
                window.innerHeight - this.availableArea.height - this.availableArea.y
            );
        });
    }

    /**
     * Creates a new window that can host apps
     * @param {Object} options - Window configuration
     * @param {string} options.icon - Icon for the window titlebar (emoji, web glyph, or Material Icon name)
     * @param {string} options.iconType - Type of icon: 'emoji', 'material', or 'glyph' (default: 'emoji')
     * @returns {string} windowId - Unique identifier for the window
     */
    createWindow(options = {}) {
        const windowId = `window-${this.nextId++}`;

        // Default window options
        const config = {
            title: options.title || 'Nebula Window',
            icon: options.icon || null, // Icon for titlebar
            iconType: options.iconType || 'emoji', // 'emoji', 'material', or 'glyph'
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

        console.log('Creating window with config:', config);

        // Create window DOM structure
        const windowElement = this.createWindowElement(windowId, config);
        document.getElementById('desktop').appendChild(windowElement);

        // Store window data FIRST
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

        // THEN set up listeners and resize handles (after windowData exists)
        this.setupWindowListeners(windowElement, windowId);
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

        // Generate icon HTML based on type
        const iconHtml = this.generateIconHtml(config.icon, config.iconType);

        window.innerHTML = `
            <div class="window-titlebar" data-window-id="${windowId}">
                ${iconHtml}
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

        // DON'T call setupWindowListeners here - do it after windowData is stored
        return window;
    }

    /**
     * Generates HTML for window titlebar icon based on type
     * @param {string} icon - The icon content (emoji, material icon name, or glyph)
     * @param {string} iconType - Type of icon: 'emoji', 'material', or 'glyph'
     * @returns {string} HTML string for the icon
     */
    generateIconHtml(icon, iconType) {
        if (!icon) {
            return ''; // No icon
        }

        switch (iconType) {
            case 'material':
                return `<div class="window-icon material-icon"><span class="material-symbols-outlined">${icon}</span></div>`;
            case 'glyph':
                return `<div class="window-icon glyph-icon">${icon}</div>`;
            case 'emoji':
            default:
                return `<div class="window-icon emoji-icon">${icon}</div>`;
        }
    }

    /**
     * Updates the icon of an existing window
     * @param {string} windowId - Target window ID
     * @param {string} icon - New icon content
     * @param {string} iconType - Type of icon: 'emoji', 'material', or 'glyph'
     */
    setWindowIcon(windowId, icon, iconType = 'emoji') {
        const windowData = this.windows.get(windowId);
        if (!windowData) {
            console.error(`Window ${windowId} not found`);
            return;
        }

        // Update config
        windowData.config.icon = icon;
        windowData.config.iconType = iconType;

        // Update DOM
        const titlebar = windowData.element.querySelector('.window-titlebar');
        const existingIcon = titlebar.querySelector('.window-icon');
        
        if (existingIcon) {
            existingIcon.remove();
        }

        if (icon) {
            const iconHtml = this.generateIconHtml(icon, iconType);
            const titleElement = titlebar.querySelector('.window-title');
            titleElement.insertAdjacentHTML('beforebegin', iconHtml);
        }
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
     * Maximizes or restores a window (checks for pinned assistant)
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

                console.log(`Restored window ${windowId} to saved position: ${windowData.savedPosition.x}, size: ${windowData.savedSize.width}`);
            }
            windowData.element.classList.remove('maximized');
            windowData.isMaximized = false;
        } else {
            // Save current CSS position/size (not screen position)
            const computedStyle = window.getComputedStyle(windowData.element);
            windowData.savedPosition = {
                x: windowData.element.style.left || computedStyle.left,
                y: windowData.element.style.top || computedStyle.top
            };
            windowData.savedSize = {
                width: windowData.element.style.width || computedStyle.width,
                height: windowData.element.style.height || computedStyle.height
            };

            // Check if assistant is pinned by looking at CSS classes
            const desktop = document.querySelector('.desktop');
            const isAssistantPinned = desktop && desktop.classList.contains('assistant-open') && desktop.classList.contains('pinned');

            let maxWidth = '100vw';
            let maxLeft = '0px';

            if (isAssistantPinned) {
                // Calculate assistant width based on CSS classes
                let assistantWidth = 420; // default width

                if (desktop.classList.contains('full-view-25')) {
                    assistantWidth = Math.floor(window.innerWidth * 0.25);
                } else if (desktop.classList.contains('full-view-33')) {
                    assistantWidth = Math.floor(window.innerWidth * 0.333);
                } else if (desktop.classList.contains('full-view-50')) {
                    assistantWidth = Math.floor(window.innerWidth * 0.5);
                }

                // Maximize to available space only
                const availableWidth = window.innerWidth - assistantWidth;
                maxWidth = availableWidth + 'px';
                maxLeft = '0px'; // CSS margin will push it to the right spot

                console.log(`Assistant pinned at ${assistantWidth}px, maximizing to ${availableWidth}px width`);
            }

            // Maximize with calculated dimensions
            Object.assign(windowData.element.style, {
                width: maxWidth,
                height: 'calc(100vh - 50px)', // Account for taskbar
                left: maxLeft,
                top: '0px'
            });

            windowData.element.classList.add('maximized');
            windowData.isMaximized = true;

            console.log(`Maximized window ${windowId} - Width: ${maxWidth}, Left: ${maxLeft}, Saved CSS position: ${windowData.savedPosition.x}`);
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
     * Calculate default position that respects available area
     */
    calculateDefaultPosition() {
        const area = this.availableArea || { x: 0, y: 0 };
        const offset = (this.windows.size % 10) * 30;

        return {
            x: area.x + 100 + offset,
            y: area.y + 100 + offset
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
                if (windowId) {
                    this.createTab(windowId);
                }
            }
        });
    }

    /**
     * Updates the available desktop area (called by desktop manager)
     */
    updateAvailableArea(x, y, width, height) {
        this.availableArea = { x, y, width, height };
        console.log('Updated available area:', this.availableArea);
    }

    /**
     * Sets up window-specific event listeners (drag, resize, etc.)
     */
    setupWindowListeners(windowElement, windowId) {
        const titlebar = windowElement.querySelector('.window-titlebar');
        let isDragging = false;
        let dragOffset = { x: 0, y: 0 };

        // Window dragging
        titlebar.addEventListener('mousedown', (e) => {
            // Don't drag if clicking on buttons or controls
            if (e.target.closest('.window-btn') || e.target.closest('.window-controls')) {
                return;
            }

            isDragging = true;
            const rect = windowElement.getBoundingClientRect();
            dragOffset.x = e.clientX - rect.left;
            dragOffset.y = e.clientY - rect.top;

            // Bring window to front when starting drag
            this.focusWindow(windowId);

            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;

            // Constrain to available area
            const constrainedX = Math.max(this.availableArea.x, 
                Math.min(newX, this.availableArea.x + this.availableArea.width - windowElement.offsetWidth));
            const constrainedY = Math.max(this.availableArea.y, 
                Math.min(newY, this.availableArea.y + this.availableArea.height - windowElement.offsetHeight));

            windowElement.style.left = constrainedX + 'px';
            windowElement.style.top = constrainedY + 'px';
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });

        // Double-click to maximize/restore
        titlebar.addEventListener('dblclick', (e) => {
            // Don't maximize if double-clicking on buttons
            if (e.target.closest('.window-btn') || e.target.closest('.window-controls')) {
                return;
            }
            this.toggleMaximizeWindow(windowId);
        });

        // Basic resize handles (simplified)
        this.addResizeHandles(windowElement, windowId);
    }

    /**
     * Adds resize handles to a window
     */
    addResizeHandles(windowElement, windowId) {
        const handles = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
        
        handles.forEach(direction => {
            const handle = document.createElement('div');
            handle.className = `resize-handle resize-${direction}`;
            windowElement.appendChild(handle);

            let isResizing = false;
            let startX, startY, startWidth, startHeight, startLeft, startTop;

            handle.addEventListener('mousedown', (e) => {
                isResizing = true;
                startX = e.clientX;
                startY = e.clientY;
                
                const rect = windowElement.getBoundingClientRect();
                startWidth = rect.width;
                startHeight = rect.height;
                startLeft = rect.left;
                startTop = rect.top;

                e.preventDefault();
                e.stopPropagation();
            });

            document.addEventListener('mousemove', (e) => {
                if (!isResizing) return;

                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;

                let newWidth = startWidth;
                let newHeight = startHeight;
                let newLeft = startLeft;
                let newTop = startTop;

                // Calculate new dimensions based on resize direction
                if (direction.includes('e')) newWidth = startWidth + deltaX;
                if (direction.includes('w')) {
                    newWidth = startWidth - deltaX;
                    newLeft = startLeft + deltaX;
                }
                if (direction.includes('s')) newHeight = startHeight + deltaY;
                if (direction.includes('n')) {
                    newHeight = startHeight - deltaY;
                    newTop = startTop + deltaY;
                }

                // Apply minimum size constraints
                newWidth = Math.max(200, newWidth);
                newHeight = Math.max(150, newHeight);

                // Update window size and position
                windowElement.style.width = newWidth + 'px';
                windowElement.style.height = newHeight + 'px';
                windowElement.style.left = newLeft + 'px';
                windowElement.style.top = newTop + 'px';
            });

            document.addEventListener('mouseup', () => {
                isResizing = false;
            });
        });
    }
}

