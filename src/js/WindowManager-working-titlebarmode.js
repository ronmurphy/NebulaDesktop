// WindowManager.js - Enhanced with Icon Support, Window Snapping, and Titlebar-Only Mode - FIXED
class WindowManager {
    constructor() {
        this.windows = new Map(); // windowId -> windowData
        this.activeWindow = null;
        this.nextId = 1;
        this.zIndexCounter = 100;

        // Available desktop area (accounts for pinned panels, taskbars, etc.)
        this.availableArea = {
            x: 0,
            y: 0,
            width: window.innerWidth,
            height: window.innerHeight - 50 // Default: full screen minus taskbar
        };

        // Snap system configuration and state
        this.snapSystem = {
            isEnabled: true,
            previewElement: null,
            currentZone: null,
            hoverTimer: null,
            hoverDelay: 800, // ms to show preview
            snapThreshold: 50, // px from edge to trigger
            animationDuration: 300, // ms for snap animation
            previewOpacity: 0.3,
            cornerSize: 100,
            edgeSize: 50,
            isDragging: false,
            draggedWindow: null,
            dragOffset: { x: 0, y: 0 } // FIX: Initialize dragOffset
        };

        // Titlebar-only mode system
        this.titlebarOnlySystem = {
            isEnabled: true,
            windows: new Set(), // Set of windowIds in titlebar-only mode
            zIndexBase: 99999, // High z-index for titlebar-only windows
            animationDuration: 400, // ms for mode transitions
            minWidth: 120, // minimum titlebar width
            maxWidth: 300, // maximum titlebar width
            padding: 24, // internal padding
            autoPosition: true, // automatically position to avoid overlap
            glowEffect: true, // show topmost glow effect
            pillShape: true // use rounded pill appearance
        };

        this.initializeSnapSystem();
        this.setupGlobalListeners();

        

        // Listen for window resize to update available area
        window.addEventListener('resize', () => {
            this.updateAvailableArea(
                this.availableArea.x,
                window.innerWidth - this.availableArea.width - this.availableArea.x,
                this.availableArea.y,
                window.innerHeight - this.availableArea.height - this.availableArea.y
            );
            this.updateSnapZones();
        });
    }

    // ===== SNAP SYSTEM METHODS =====

    /**
     * Initialize the window snapping system
     */
    initializeSnapSystem() {
        this.updateSnapZones();
        this.createSnapPreviewElement();
    }

    /**
     * Update snap zone coordinates based on current screen size
     */
    updateSnapZones() {
        const area = this.availableArea;
        
        this.snapZones = {
            // Edge zones
            left: {
                x: area.x,
                y: area.y,
                width: this.snapSystem.edgeSize,
                height: area.height,
                type: 'edge',
                name: 'left'
            },
            right: {
                x: area.x + area.width - this.snapSystem.edgeSize,
                y: area.y,
                width: this.snapSystem.edgeSize,
                height: area.height,
                type: 'edge',
                name: 'right'
            },
            top: {
                x: area.x,
                y: area.y,
                width: area.width,
                height: this.snapSystem.edgeSize,
                type: 'edge',
                name: 'top'
            },
            bottom: {
                x: area.x,
                y: area.y + area.height - this.snapSystem.edgeSize,
                width: area.width,
                height: this.snapSystem.edgeSize,
                type: 'edge',
                name: 'bottom'
            },
            
            // Corner zones (override edges in corner areas)
            topLeft: {
                x: area.x,
                y: area.y,
                width: this.snapSystem.cornerSize,
                height: this.snapSystem.cornerSize,
                type: 'corner',
                name: 'topLeft'
            },
            topRight: {
                x: area.x + area.width - this.snapSystem.cornerSize,
                y: area.y,
                width: this.snapSystem.cornerSize,
                height: this.snapSystem.cornerSize,
                type: 'corner',
                name: 'topRight'
            },
            bottomLeft: {
                x: area.x,
                y: area.y + area.height - this.snapSystem.cornerSize,
                width: this.snapSystem.cornerSize,
                height: this.snapSystem.cornerSize,
                type: 'corner',
                name: 'bottomLeft'
            },
            bottomRight: {
                x: area.x + area.width - this.snapSystem.cornerSize,
                y: area.y + area.height - this.snapSystem.cornerSize,
                width: this.snapSystem.cornerSize,
                height: this.snapSystem.cornerSize,
                type: 'corner',
                name: 'bottomRight'
            }
        };
    }

    /**
     * Create the snap preview overlay element
     */
    createSnapPreviewElement() {
        if (this.snapSystem.previewElement) {
            this.snapSystem.previewElement.remove();
        }

        const preview = document.createElement('div');
        preview.className = 'snap-preview';
        preview.style.cssText = `
            position: fixed;
            background: rgba(0, 123, 255, ${this.snapSystem.previewOpacity});
            border: 2px solid rgba(0, 123, 255, 0.8);
            border-radius: 4px;
            pointer-events: none;
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.2s ease;
            box-shadow: 0 0 20px rgba(0, 123, 255, 0.4);
            display: none;
        `;

        document.body.appendChild(preview);
        this.snapSystem.previewElement = preview;
    }

    /**
     * Detect which snap zone the mouse is currently in
     */
    detectSnapZone(mouseX, mouseY) {
        // Skip snap detection if dragging a titlebar-only window
        if (this.snapSystem.draggedWindow && 
            this.windows.get(this.snapSystem.draggedWindow)?.isTitlebarOnly) {
            return null;
        }

        // Check corners first (they have priority over edges)
        const cornerZones = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'];
        for (const zoneName of cornerZones) {
            const zone = this.snapZones[zoneName];
            if (this.isPointInZone(mouseX, mouseY, zone)) {
                return { ...zone, name: zoneName };
            }
        }

        // Check edges
        const edgeZones = ['left', 'right', 'top', 'bottom'];
        for (const zoneName of edgeZones) {
            const zone = this.snapZones[zoneName];
            if (this.isPointInZone(mouseX, mouseY, zone)) {
                return { ...zone, name: zoneName };
            }
        }

        return null;
    }

    /**
     * Check if a point is within a snap zone
     */
    isPointInZone(x, y, zone) {
        return x >= zone.x && 
               x <= zone.x + zone.width && 
               y >= zone.y && 
               y <= zone.y + zone.height;
    }

    /**
     * Get the target dimensions for a snap zone
     */
    getSnapDimensions(zoneName) {
        const area = this.availableArea;
        const halfWidth = Math.floor(area.width / 2);
        const halfHeight = Math.floor(area.height / 2);

        switch (zoneName) {
            case 'left':
                return {
                    x: area.x,
                    y: area.y,
                    width: halfWidth,
                    height: area.height
                };
            case 'right':
                return {
                    x: area.x + halfWidth,
                    y: area.y,
                    width: halfWidth,
                    height: area.height
                };
            case 'top':
                return {
                    x: area.x,
                    y: area.y,
                    width: area.width,
                    height: area.height
                };
            case 'bottom':
                return {
                    x: area.x,
                    y: area.y + area.height - 100, // Dock to bottom with 100px height
                    width: area.width,
                    height: 100
                };
            case 'topLeft':
                return {
                    x: area.x,
                    y: area.y,
                    width: halfWidth,
                    height: halfHeight
                };
            case 'topRight':
                return {
                    x: area.x + halfWidth,
                    y: area.y,
                    width: halfWidth,
                    height: halfHeight
                };
            case 'bottomLeft':
                return {
                    x: area.x,
                    y: area.y + halfHeight,
                    width: halfWidth,
                    height: halfHeight
                };
            case 'bottomRight':
                return {
                    x: area.x + halfWidth,
                    y: area.y + halfHeight,
                    width: halfWidth,
                    height: halfHeight
                };
            default:
                return null;
        }
    }

    /**
     * Show snap preview for a specific zone
     */
    showSnapPreview(zoneName) {
        if (!this.snapSystem.previewElement) return;

        const dimensions = this.getSnapDimensions(zoneName);
        if (!dimensions) return;

        const preview = this.snapSystem.previewElement;
        preview.style.left = dimensions.x + 'px';
        preview.style.top = dimensions.y + 'px';
        preview.style.width = dimensions.width + 'px';
        preview.style.height = dimensions.height + 'px';
        preview.style.display = 'block';
        preview.style.opacity = '1';

        this.snapSystem.currentZone = zoneName;
    }

    /**
     * Hide snap preview
     */
    hideSnapPreview() {
        if (this.snapSystem.previewElement) {
            this.snapSystem.previewElement.style.opacity = '0';
            setTimeout(() => {
                if (this.snapSystem.previewElement) {
                    this.snapSystem.previewElement.style.display = 'none';
                }
            }, 200);
        }
        this.snapSystem.currentZone = null;
    }

    /**
     * Snap a window to a specific zone with animation
     */
    snapWindowToZone(windowId, zoneName) {
        const windowData = this.windows.get(windowId);
        if (!windowData || windowData.isTitlebarOnly) return;

        const dimensions = this.getSnapDimensions(zoneName);
        if (!dimensions) return;

        const windowElement = windowData.element;
        
        // Add snapping animation class
        windowElement.classList.add('window-snapping');

        // Apply new dimensions
        windowElement.style.left = dimensions.x + 'px';
        windowElement.style.top = dimensions.y + 'px';
        windowElement.style.width = dimensions.width + 'px';
        windowElement.style.height = dimensions.height + 'px';

        // Update window state
        if (zoneName === 'top') {
            windowData.isMaximized = true;
            windowElement.classList.add('maximized');
        } else {
            windowData.isMaximized = false;
            windowElement.classList.remove('maximized');
        }

        // Remove animation class after animation completes
        setTimeout(() => {
            windowElement.classList.remove('window-snapping');
        }, this.snapSystem.animationDuration);

        console.log(`Snapped window ${windowId} to ${zoneName}`);
    }

    /**
     * Clear the hover timer
     */
    clearHoverTimer() {
        if (this.snapSystem.hoverTimer) {
            clearTimeout(this.snapSystem.hoverTimer);
            this.snapSystem.hoverTimer = null;
        }
    }

    // ===== TITLEBAR-ONLY MODE FUNCTIONALITY =====

    /**
     * Toggle titlebar-only mode for a window
     */
    toggleTitlebarOnlyMode(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;

        if (windowData.isTitlebarOnly) {
            this.exitTitlebarOnlyMode(windowId);
        } else {
            this.enterTitlebarOnlyMode(windowId);
        }
    }

    /**
     * Enter titlebar-only mode
     */
    enterTitlebarOnlyMode(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData || windowData.isTitlebarOnly) return;

        const windowElement = windowData.element;

        // Save current state
        this.saveTitlebarOnlyState(windowId);

        // Calculate titlebar-only dimensions
        const titlebarWidth = this.calculateTitlebarOnlyWidth(windowElement);
        const titlebarHeight = this.getTitlebarHeight(windowElement);

        // Add titlebar-only class for styling
        windowElement.classList.add('titlebar-only', 'entering-titlebar-only');

        // Set titlebar-only dimensions and position
        windowElement.style.width = titlebarWidth + 'px';
        windowElement.style.height = titlebarHeight + 'px';

        // Set topmost z-index
        this.setTitlebarOnlyZIndex(windowId);

        // Update window state
        windowData.isTitlebarOnly = true;
        this.titlebarOnlySystem.windows.add(windowId);

        // Position optimally if auto-positioning is enabled
        if (this.titlebarOnlySystem.autoPosition) {
            this.positionTitlebarOptimally(windowId);
        }

        // Remove animation class after transition
        setTimeout(() => {
            windowElement.classList.remove('entering-titlebar-only');
        }, this.titlebarOnlySystem.animationDuration);

        console.log(`Entered titlebar-only mode: ${windowId}`);
    }

    /**
     * Exit titlebar-only mode
     */
    exitTitlebarOnlyMode(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData || !windowData.isTitlebarOnly) return;

        const windowElement = windowData.element;

        // Add exit animation class
        windowElement.classList.add('exiting-titlebar-only');

        // Restore previous state
        this.restoreTitlebarOnlyState(windowId);

        // Remove titlebar-only class
        windowElement.classList.remove('titlebar-only');

        // Update window state
        windowData.isTitlebarOnly = false;
        this.titlebarOnlySystem.windows.delete(windowId);

        // Remove animation class after transition
        setTimeout(() => {
            windowElement.classList.remove('exiting-titlebar-only');
        }, this.titlebarOnlySystem.animationDuration);

        console.log(`Exited titlebar-only mode: ${windowId}`);
    }

    /**
     * Calculate optimal width for titlebar-only mode
     */
    calculateTitlebarOnlyWidth(windowElement) {
        const icon = windowElement.querySelector('.window-icon');
        const title = windowElement.querySelector('.window-title');
        
        // Measure text width
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const computedStyle = window.getComputedStyle(title);
        context.font = `${computedStyle.fontSize} ${computedStyle.fontFamily}`;
        
        const iconWidth = icon ? icon.offsetWidth + 8 : 0; // 8px margin
        const titleWidth = context.measureText(title.textContent).width;
        const totalWidth = iconWidth + titleWidth + this.titlebarOnlySystem.padding;
        
        // Apply constraints
        return Math.max(
            this.titlebarOnlySystem.minWidth,
            Math.min(totalWidth, this.titlebarOnlySystem.maxWidth)
        );
    }

    /**
     * Get titlebar height
     */
    getTitlebarHeight(windowElement) {
        const titlebar = windowElement.querySelector('.window-titlebar');
        return titlebar.offsetHeight;
    }

    /**
     * Save window state before entering titlebar-only mode
     */
    saveTitlebarOnlyState(windowId) {
        const windowData = this.windows.get(windowId);
        const windowElement = windowData.element;
        
        windowData.titlebarOnlyState = {
            savedDimensions: {
                width: windowElement.style.width || windowElement.offsetWidth + 'px',
                height: windowElement.style.height || windowElement.offsetHeight + 'px'
            },
            savedPosition: {
                left: windowElement.style.left || windowElement.offsetLeft + 'px',
                top: windowElement.style.top || windowElement.offsetTop + 'px'
            },
            savedZIndex: windowElement.style.zIndex || this.zIndexCounter,
            isMaximized: windowData.isMaximized,
            isMinimized: windowData.isMinimized
        };
    }

    /**
     * Restore window state when exiting titlebar-only mode
     */
    restoreTitlebarOnlyState(windowId) {
        const windowData = this.windows.get(windowId);
        const windowElement = windowData.element;
        const state = windowData.titlebarOnlyState;
        
        if (!state) return;

        // Restore dimensions and position
        windowElement.style.width = state.savedDimensions.width;
        windowElement.style.height = state.savedDimensions.height;
        windowElement.style.left = state.savedPosition.left;
        windowElement.style.top = state.savedPosition.top;
        windowElement.style.zIndex = state.savedZIndex;

        // Restore window state flags
        windowData.isMaximized = state.isMaximized;
        windowData.isMinimized = state.isMinimized;

        if (state.isMaximized) {
            windowElement.classList.add('maximized');
        }
    }

    /**
     * Set high z-index for titlebar-only windows
     */
    setTitlebarOnlyZIndex(windowId) {
        const windowData = this.windows.get(windowId);
        const windowElement = windowData.element;
        
        windowElement.style.zIndex = this.titlebarOnlySystem.zIndexBase + this.titlebarOnlySystem.windows.size;
    }

    /**
     * Position titlebar optimally to avoid overlaps
     */
    positionTitlebarOptimally(windowId) {
        const windowData = this.windows.get(windowId);
        const windowElement = windowData.element;
        
        // Simple positioning strategy: stack along top edge
        const existingCount = this.titlebarOnlySystem.windows.size - 1; // Exclude current window
        const margin = 10;
        const stackOffset = 35; // Height of titlebar + margin
        
        const x = margin;
        const y = margin + (existingCount * stackOffset);
        
        windowElement.style.left = x + 'px';
        windowElement.style.top = y + 'px';
    }

    // ===== CORE WINDOW MANAGEMENT =====

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
            isTitlebarOnly: false, // New property for titlebar-only mode
            titlebarOnlyState: null, // Saved state for titlebar-only mode
            savedPosition: null,
            savedSize: null,
            tabs: new Map(), // For multi-tab support
            activeTab: null,
            app: null // Reference to the app instance
        };

        this.windows.set(windowId, windowData);

        // FIX: Use the correct method name that exists in original
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

        // If window is in titlebar-only mode, recalculate width
        if (windowData.isTitlebarOnly) {
            const newWidth = this.calculateTitlebarOnlyWidth(windowData.element);
            windowData.element.style.width = newWidth + 'px';
        }
    }

    /**
     * FIXED: Sets up window-specific event listeners - uses original method name but enhanced functionality
     */
    setupWindowListeners(windowElement, windowId) {
        const titlebar = windowElement.querySelector('.window-titlebar');
        let isDragging = false;
        let startX, startY, initialX, initialY;
        let animationFrame = null;

        // Enhanced window dragging with snap detection
        titlebar.addEventListener('mousedown', (e) => {
            // Don't drag if clicking on buttons or controls
            if (e.target.closest('.window-btn') || e.target.closest('.window-controls')) {
                return;
            }

            isDragging = true;
            this.snapSystem.isDragging = true;
            this.snapSystem.draggedWindow = windowId;
            
            startX = e.clientX;
            startY = e.clientY;

            // Get current position from computed style
            const computedStyle = window.getComputedStyle(windowElement);
            initialX = parseInt(computedStyle.left) || 0;
            initialY = parseInt(computedStyle.top) || 0;

            const rect = windowElement.getBoundingClientRect();
            this.snapSystem.dragOffset.x = e.clientX - rect.left;
            this.snapSystem.dragOffset.y = e.clientY - rect.top;

            // Add dragging class for visual feedback
            windowElement.classList.add('dragging');
            titlebar.style.cursor = 'grabbing';

            // Bring window to front when starting drag
            this.focusWindow(windowId);

            // Add global event listeners
            document.addEventListener('mousemove', handleDrag, { passive: false });
            document.addEventListener('mouseup', stopDrag);

            e.preventDefault();
            e.stopPropagation();
        });

        // Right-click on titlebar to toggle titlebar-only mode
        titlebar.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.toggleTitlebarOnlyMode(windowId);
        });

        // Double-click to maximize/restore (only for non-titlebar-only windows)
        titlebar.addEventListener('dblclick', (e) => {
            // Don't maximize if double-clicking on buttons
            if (e.target.closest('.window-btn') || e.target.closest('.window-controls')) {
                return;
            }
            
            const windowData = this.windows.get(windowId);
            if (!windowData.isTitlebarOnly) {
                this.toggleMaximizeWindow(windowId);
            }
        });

        const handleDrag = (e) => {
            if (!isDragging) return;

            // Cancel any pending animation frame
            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
            }

            // Use requestAnimationFrame for smooth movement
            animationFrame = requestAnimationFrame(() => {
                const windowData = this.windows.get(windowId);
                if (!windowData) return;

                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;

                const newX = initialX + deltaX;
                const newY = initialY + deltaY;

                // Update window position
                if (windowData.isTitlebarOnly) {
                    // Titlebar-only windows can be dragged anywhere without constraints
                    windowElement.style.left = newX + 'px';
                    windowElement.style.top = newY + 'px';
                } else {
                    // Regular windows are constrained to viewport bounds
                    const maxX = window.innerWidth - 100; // Keep at least 100px visible
                    const maxY = window.innerHeight - 100;
                    const minX = -windowElement.offsetWidth + 100; // Allow dragging mostly off-screen
                    const minY = 0; // Don't allow dragging above viewport

                    const constrainedX = Math.max(minX, Math.min(maxX, newX));
                    const constrainedY = Math.max(minY, Math.min(maxY, newY));

                    windowElement.style.left = constrainedX + 'px';
                    windowElement.style.top = constrainedY + 'px';

                    // Snap zone detection (only for regular windows)
                    if (this.snapSystem.isEnabled) {
                        const currentZone = this.detectSnapZone(e.clientX, e.clientY);
                        
                        if (currentZone && currentZone.name !== this.snapSystem.currentZone) {
                            // Entered new zone
                            this.clearHoverTimer();
                            this.hideSnapPreview();
                            
                            this.snapSystem.hoverTimer = setTimeout(() => {
                                if (this.snapSystem.isDragging) {
                                    this.showSnapPreview(currentZone.name);
                                }
                            }, this.snapSystem.hoverDelay);
                            
                        } else if (!currentZone && this.snapSystem.currentZone) {
                            // Left all zones
                            this.clearHoverTimer();
                            this.hideSnapPreview();
                        }
                    }
                }
            });

            // Prevent default to avoid any lag
            e.preventDefault();
        };

        const stopDrag = (e) => {
            if (!isDragging) return;

            isDragging = false;
            this.snapSystem.isDragging = false;
            this.snapSystem.draggedWindow = null;

            // Cancel any pending animation
            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
                animationFrame = null;
            }

            this.clearHoverTimer();

            const windowData = this.windows.get(windowId);
            if (!windowData || windowData.isTitlebarOnly) {
                // Titlebar-only windows don't snap
                this.hideSnapPreview();
            } else {
                // If preview is showing, snap to that zone
                if (this.snapSystem.currentZone) {
                    this.snapWindowToZone(windowId, this.snapSystem.currentZone);
                }
                this.hideSnapPreview();
            }

            // Remove visual feedback
            windowElement.classList.remove('dragging');
            titlebar.style.cursor = '';

            // Remove event listeners
            document.removeEventListener('mousemove', handleDrag);
            document.removeEventListener('mouseup', stopDrag);

            e.preventDefault();
        };

        // Add resize handles (disabled for titlebar-only windows)
        this.addResizeHandles(windowElement, windowId);
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

        // Update window icon if app provides one
        if (app.getIcon) {
            this.setWindowIcon(windowId, app.getIcon());
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
     * Brings a window to the front (respects titlebar-only mode)
     */
    focusWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData || windowData.isMinimized) return;

        // Only update z-index if this window isn't already active
        if (this.activeWindow !== windowId) {
            if (windowData.isTitlebarOnly) {
                // Titlebar-only windows maintain their high z-index
                this.setTitlebarOnlyZIndex(windowId);
            } else {
                // Regular windows use normal z-index
                windowData.element.style.zIndex = this.zIndexCounter++;
            }
            
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
     * Minimizes a window with animation (exits titlebar-only mode first if needed)
     */
    minimizeWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;

        // Exit titlebar-only mode if active
        if (windowData.isTitlebarOnly) {
            this.exitTitlebarOnlyMode(windowId);
        }

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
     * Maximizes or restores a window (exits titlebar-only mode first if needed)
     */
    toggleMaximizeWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;

        // Exit titlebar-only mode if active
        if (windowData.isTitlebarOnly) {
            this.exitTitlebarOnlyMode(windowId);
        }

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

            // Apply maximized size
            this.applyMaximizedSize(windowData);
            windowData.element.classList.add('maximized');
            windowData.isMaximized = true;

            console.log(`Maximized window ${windowId}`);
        }
    }

    /**
     * Closes a window and cleans up (exits titlebar-only mode first if needed)
     */
    closeWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;

        // Exit titlebar-only mode if active
        if (windowData.isTitlebarOnly) {
            this.titlebarOnlySystem.windows.delete(windowId);
        }

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
            
            // If window is in titlebar-only mode, recalculate width
            if (windowData.isTitlebarOnly) {
                const newWidth = this.calculateTitlebarOnlyWidth(windowData.element);
                windowData.element.style.width = newWidth + 'px';
            }
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

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Alt+Tab - Switch windows
            if (e.altKey && e.key === 'Tab') {
                e.preventDefault();
                this.switchToNextWindow();
            }

            // Ctrl+W - Close active window/tab
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
     * Updates the maximum available area for windows (affects maximize behavior)
     */
    updateAvailableArea(leftMargin = 0, rightMargin = 0, topMargin = 0, bottomMargin = 50) {
        this.availableArea = {
            x: leftMargin,
            y: topMargin,
            width: window.innerWidth - leftMargin - rightMargin,
            height: window.innerHeight - topMargin - bottomMargin
        };

        console.log('Updated available area:', this.availableArea);

        // Update any currently maximized windows to fit new area
        this.windows.forEach((windowData, windowId) => {
            if (windowData.isMaximized) {
                this.applyMaximizedSize(windowData);
                console.log(`Resized maximized window ${windowId} to new available area`);
            }
        });
    }

    /**
     * Applies maximized size based on current available area
     */
    applyMaximizedSize(windowData) {
        const area = this.availableArea || {
            x: 0, y: 0,
            width: window.innerWidth,
            height: window.innerHeight - 50
        };

        console.log(`Applying maximized size. Area:`, area);

        Object.assign(windowData.element.style, {
            width: area.width + 'px',
            height: area.height + 'px',
            left: area.x + 'px',
            top: area.y + 'px'
        });

        console.log(`Maximized window positioned at: left=${area.x}px, width=${area.width}px`);
    }

    /**
     * Adds resize handles to a window (disabled for titlebar-only windows) - FROM ORIGINAL
     */
    addResizeHandles(windowElement, windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) {
            console.error(`No windowData found for window ${windowId}`);
            return;
        }

        if (!windowData.config.resizable) {
            console.log(`Skipping resize handles for window ${windowId} - not resizable`);
            return;
        }

        console.log(`✅ Adding resize handles to window ${windowId} (resizable: ${windowData.config.resizable})`);

        // Create resize handles
        const handles = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];

        handles.forEach(direction => {
            const handle = document.createElement('div');
            handle.className = `resize-handle resize-${direction}`;
            handle.dataset.direction = direction;
            handle.title = `Resize ${direction.toUpperCase()}`; // Add tooltip for debugging
            windowElement.appendChild(handle);

            this.setupResizeHandle(handle, windowElement, windowId, direction);
            console.log(`  🔧 Created ${direction} resize handle`);
        });

        console.log(`✅ All resize handles added for window ${windowId}`);
    }

    /**
     * Sets up a single resize handle - FROM ORIGINAL
     */
    setupResizeHandle(handle, windowElement, windowId, direction) {
        let isResizing = false;
        let startX, startY, startWidth, startHeight, startLeft, startTop;
        let animationFrame = null;

        handle.addEventListener('mousedown', (e) => {
            // Don't allow resizing titlebar-only windows
            const windowData = this.windows.get(windowId);
            if (windowData && windowData.isTitlebarOnly) {
                return;
            }

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