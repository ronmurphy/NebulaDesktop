// Enhanced NebulaWidget Base Class - Self-Managing Context Menus
// Add this to the beginning of your NebulaWidgetSystem.js file or create a separate file

// Enhanced Base Widget Class with Built-in Context Menu
// class NebulaWidget {
//     constructor(config = {}) {
//         this.id = config.id || this.generateId();
//         this.x = config.x || 100;
//         this.y = config.y || 100;
//         this.showTitlebar = config.showTitlebar !== false; // Default true
//         this.element = null;
//         this.contextMenu = null;
//         this.moveMode = false;
//         this.originalCursor = null;
//         this.mouseMoveHandler = null;
//         this.clickHandler = null;
//         this.moveOverlay = null;
//     }

//     generateId() {
//         return 'widget-' + Math.random().toString(36).substr(2, 9);
//     }

//     // Abstract methods that child widgets must implement
//     render() {
//         throw new Error('render() method must be implemented by child class');
//     }

//     getTitle() {
//         throw new Error('getTitle() method must be implemented by child class');
//     }

//     getIcon() {
//         throw new Error('getIcon() method must be implemented by child class');
//     }

//     cleanup() {
//         // Default cleanup - can be overridden
//         this.hideContextMenu();
//         this.stopMoveMode();
//     }

//     // Initialize the widget (called after render)
//     init() {
//         // Override in child classes if needed
//     }

//     // Setup right-click context menu
//     setupWidgetContextMenu() {
//         if (!this.element) return;

//         // Remove any existing listeners
//         this.element.removeEventListener('contextmenu', this.handleWidgetRightClick);
        
//         // Add right-click listener
//         this.element.addEventListener('contextmenu', (e) => this.handleWidgetRightClick(e));
        
//         // Close context menu when clicking elsewhere
//         document.addEventListener('click', (e) => {
//             if (this.contextMenu && !this.contextMenu.contains(e.target)) {
//                 this.hideContextMenu();
//             }
//         });
        
//         // Close on escape
//         document.addEventListener('keydown', (e) => {
//             if (e.key === 'Escape') {
//                 this.hideContextMenu();
//                 this.stopMoveMode();
//             }
//         });
//     }

//     handleWidgetRightClick = (e) => {
//         e.preventDefault();
//         e.stopPropagation();
        
//         console.log(`🖱️ Right-click on ${this.getTitle()} widget`);
//         this.showWidgetContextMenu(e.clientX, e.clientY);
//     }

//     showWidgetContextMenu(x, y) {
//         this.hideContextMenu();
        
//         this.contextMenu = document.createElement('div');
//         this.contextMenu.className = 'widget-context-menu';
//         this.contextMenu.style.cssText = `
//             position: fixed;
//             left: ${x}px;
//             top: ${y}px;
//             background: var(--nebula-surface, #ffffff);
//             border: 1px solid var(--nebula-border, #e2e8f0);
//             border-radius: var(--nebula-radius-md, 8px);
//             box-shadow: var(--nebula-shadow-lg, 0 8px 32px rgba(0, 0, 0, 0.15));
//             padding: 8px 0;
//             min-width: 200px;
//             z-index: 10000;
//             font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
//             font-size: 14px;
//             color: var(--nebula-text-primary, #1a202c);
//             backdrop-filter: blur(10px);
//             animation: contextMenuFadeIn 0.2s ease;
//         `;

//         // Build context menu
//         let menuHTML = `
//             <div class="context-menu-header">
//                 <span class="menu-icon">${this.getIcon()}</span>
//                 <span class="menu-title">${this.getTitle()}</span>
//             </div>
//             <div class="context-menu-separator"></div>
//         `;

//         // Mode toggle
//         const currentMode = this.showTitlebar ? 'Titlebar' : 'Minimal';
//         const switchMode = this.showTitlebar ? 'Minimal' : 'Titlebar';
        
//         menuHTML += `
//             <div class="context-menu-item" data-action="toggle-mode">
//                 <span class="menu-icon">${this.showTitlebar ? '◽' : '🪟'}</span>
//                 <span class="menu-text">Switch to ${switchMode} Mode</span>
//                 <span class="menu-status">(Currently: ${currentMode})</span>
//             </div>
//             <div class="context-menu-separator"></div>
//             <div class="context-menu-item" data-action="move-widget">
//                 <span class="menu-icon">🔄</span>
//                 <span class="menu-text">Move Widget</span>
//             </div>
//             <div class="context-menu-separator"></div>
//         `;

//         // Add widget-specific menu items
//         const customItems = this.getCustomContextMenuItems();
//         if (customItems && customItems.length > 0) {
//             customItems.forEach(item => {
//                 menuHTML += `
//                     <div class="context-menu-item" data-action="${item.action}">
//                         <span class="menu-icon">${item.icon}</span>
//                         <span class="menu-text">${item.text}</span>
//                     </div>
//                 `;
//             });
//             menuHTML += `<div class="context-menu-separator"></div>`;
//         }

//         // Remove widget
//         menuHTML += `
//             <div class="context-menu-item danger" data-action="remove-widget">
//                 <span class="menu-icon">🗑️</span>
//                 <span class="menu-text">Remove Widget</span>
//             </div>
//         `;

//         this.contextMenu.innerHTML = menuHTML;
//         this.setupContextMenuEvents();
//         this.positionContextMenu(x, y);
        
//         document.body.appendChild(this.contextMenu);
//     }

//     // Override this in child classes to add custom menu items
//     getCustomContextMenuItems() {
//         return [];
//     }

//     setupContextMenuEvents() {
//         this.contextMenu.addEventListener('click', (e) => {
//             const item = e.target.closest('.context-menu-item');
//             if (!item) return;
            
//             const action = item.dataset.action;
//             console.log(`📋 Widget context action: ${action}`);
            
//             this.handleContextMenuAction(action);
//             this.hideContextMenu();
//         });
//     }

//     handleContextMenuAction(action) {
//         switch (action) {
//             case 'toggle-mode':
//                 this.toggleMode();
//                 break;
//             case 'move-widget':
//                 this.startMoveMode();
//                 break;
//             case 'remove-widget':
//                 this.removeWidget();
//                 break;
//             default:
//                 // Handle custom actions in child classes
//                 this.handleCustomContextAction(action);
//         }
//     }

//     // Override this in child classes to handle custom actions
//     handleCustomContextAction(action) {
//         console.log(`Custom action not handled: ${action}`);
//     }

//     toggleMode() {
//         console.log(`🔄 Toggling mode for ${this.getTitle()} widget`);
        
//         // Store current position
//         const rect = this.element.getBoundingClientRect();
//         this.x = rect.left;
//         this.y = rect.top;
        
//         // Toggle the mode
//         this.showTitlebar = !this.showTitlebar;
        
//         // Re-render the widget
//         const newElement = this.render();
        
//         // Replace the old element
//         this.element.parentNode.replaceChild(newElement, this.element);
//         this.element = newElement;
        
//         // Restore position
//         this.element.style.left = this.x + 'px';
//         this.element.style.top = this.y + 'px';
        
//         // Re-setup event handlers
//         this.setupWidgetContextMenu();
//         this.setupEventListeners();
        
//         // Re-initialize if needed
//         this.init();
        
//         console.log(`✅ Mode toggled to: ${this.showTitlebar ? 'Titlebar' : 'Minimal'}`);
//     }

//     startMoveMode() {
//         if (this.moveMode) return;
        
//         console.log(`🔄 Starting move mode for ${this.getTitle()} widget`);
        
//         this.moveMode = true;
//         this.originalCursor = document.body.style.cursor;
        
//         // Visual feedback
//         document.body.style.cursor = 'move';
//         this.element.style.opacity = '0.8';
//         this.element.style.transform = 'scale(1.02)';
//         this.element.style.zIndex = '1999';
//         this.element.style.pointerEvents = 'none';
        
//         // Create move overlay
//         this.createMoveOverlay();
        
//         // Set up handlers
//         this.mouseMoveHandler = (e) => this.handleMoveMouseMove(e);
//         this.clickHandler = (e) => this.handleMoveClick(e);
        
//         document.addEventListener('mousemove', this.mouseMoveHandler);
//         document.addEventListener('click', this.clickHandler);
//     }

//     createMoveOverlay() {
//         this.moveOverlay = document.createElement('div');
//         this.moveOverlay.style.cssText = `
//             position: fixed;
//             top: 0;
//             left: 0;
//             width: 100vw;
//             height: 100vh;
//             background: rgba(102, 126, 234, 0.1);
//             z-index: 1998;
//             pointer-events: none;
//             backdrop-filter: blur(2px);
//         `;
        
//         const instructions = document.createElement('div');
//         instructions.style.cssText = `
//             position: absolute;
//             top: 20px;
//             left: 50%;
//             transform: translateX(-50%);
//             background: var(--nebula-surface, #ffffff);
//             border: 1px solid var(--nebula-border, #e2e8f0);
//             border-radius: var(--nebula-radius-md, 8px);
//             padding: 12px 20px;
//             font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
//             font-size: 14px;
//             color: var(--nebula-text-primary, #1a202c);
//             box-shadow: var(--nebula-shadow-lg, 0 8px 32px rgba(0, 0, 0, 0.15));
//             text-align: center;
//         `;
//         instructions.innerHTML = `
//             <div style="font-weight: 600; margin-bottom: 4px;">🔄 Moving ${this.getTitle()}</div>
//             <div style="font-size: 12px; color: var(--nebula-text-secondary, #64748b);">
//                 Click anywhere to place • Press Escape to cancel
//             </div>
//         `;
        
//         this.moveOverlay.appendChild(instructions);
//         document.body.appendChild(this.moveOverlay);
//     }

//     handleMoveMouseMove(e) {
//         if (!this.element) return;
        
//         const rect = this.element.getBoundingClientRect();
//         this.element.style.left = (e.clientX - rect.width / 2) + 'px';
//         this.element.style.top = (e.clientY - rect.height / 2) + 'px';
//     }

//     handleMoveClick(e) {
//         e.preventDefault();
//         e.stopPropagation();
        
//         const newX = e.clientX - this.element.offsetWidth / 2;
//         const newY = e.clientY - this.element.offsetHeight / 2;
        
//         // Update position
//         this.x = newX;
//         this.y = newY;
        
//         // Update in widget system if available
//         if (window.widgetSystem) {
//             const activeWidgets = window.widgetSystem.getActiveWidgets();
//             const widgetData = activeWidgets.find(w => w.id === this.id);
//             if (widgetData) {
//                 widgetData.x = newX;
//                 widgetData.y = newY;
//             }
//         }
        
//         console.log(`📍 ${this.getTitle()} moved to (${newX}, ${newY})`);
//         this.stopMoveMode();
//     }

//     stopMoveMode() {
//         if (!this.moveMode) return;
        
//         console.log(`🔄 Stopping move mode for ${this.getTitle()}`);
        
//         this.moveMode = false;
        
//         // Restore cursor and element
//         document.body.style.cursor = this.originalCursor || '';
//         this.element.style.opacity = '';
//         this.element.style.transform = '';
//         this.element.style.zIndex = '';
//         this.element.style.pointerEvents = '';
        
//         // Remove overlay
//         if (this.moveOverlay) {
//             this.moveOverlay.remove();
//             this.moveOverlay = null;
//         }
        
//         // Remove handlers
//         if (this.mouseMoveHandler) {
//             document.removeEventListener('mousemove', this.mouseMoveHandler);
//             this.mouseMoveHandler = null;
//         }
//         if (this.clickHandler) {
//             document.removeEventListener('click', this.clickHandler);
//             this.clickHandler = null;
//         }
//     }

//     removeWidget() {
//         const widgetName = this.getTitle();
        
//         if (confirm(`Remove ${widgetName} widget?`)) {
//             console.log(`🗑️ Removing ${widgetName} widget`);
            
//             // Clean up
//             this.cleanup();
            
//             // Remove from widget system
//             if (window.widgetSystem) {
//                 window.widgetSystem.removeWidget(this.id);
//             }
            
//             // Remove from DOM
//             if (this.element && this.element.parentNode) {
//                 this.element.parentNode.removeChild(this.element);
//             }
//         }
//     }

//     positionContextMenu(x, y) {
//         const rect = this.contextMenu.getBoundingClientRect();
//         const windowWidth = window.innerWidth;
//         const windowHeight = window.innerHeight;
        
//         if (x + rect.width > windowWidth) {
//             this.contextMenu.style.left = (windowWidth - rect.width - 10) + 'px';
//         }
        
//         if (y + rect.height > windowHeight) {
//             this.contextMenu.style.top = (windowHeight - rect.height - 10) + 'px';
//         }
//     }

//     hideContextMenu() {
//         if (this.contextMenu) {
//             this.contextMenu.remove();
//             this.contextMenu = null;
//         }
//     }

//     // Method that child classes should call in their setupEventListeners
//     setupEventListeners() {
//         // Override in child classes
//         // Make sure to call this.setupWidgetContextMenu() in child implementation
//     }
// }

// Enhanced Widget Context Menu Styles
const widgetContextMenuStyles = `
<style id="widget-context-menu-styles">
@keyframes contextMenuFadeIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
}

.widget-context-menu {
    user-select: none;
}

.context-menu-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: var(--nebula-surface-secondary, #f8fafc);
    border-bottom: 1px solid var(--nebula-border, #e2e8f0);
    margin: -8px 0 0 0;
    border-radius: var(--nebula-radius-md, 8px) var(--nebula-radius-md, 8px) 0 0;
}

.menu-title {
    font-weight: 600;
    color: var(--nebula-text-primary, #1a202c);
    font-size: 14px;
}

.context-menu-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    cursor: pointer;
    transition: background-color 0.2s ease;
    white-space: nowrap;
}

.context-menu-item:hover {
    background: var(--nebula-surface-hover, #f1f5f9);
}

.context-menu-item.danger:hover {
    background: var(--nebula-danger-hover, #fee2e2);
    color: var(--nebula-danger, #ef4444);
}

.context-menu-separator {
    height: 1px;
    background: var(--nebula-border, #e2e8f0);
    margin: 4px 0;
}

.menu-icon {
    font-size: 16px;
    width: 20px;
    text-align: center;
    flex-shrink: 0;
}

.menu-text {
    flex: 1;
    font-weight: 500;
    color: var(--nebula-text-primary, #1a202c);
    font-size: 14px;
}

.menu-status {
    font-size: 12px;
    color: var(--nebula-text-secondary, #64748b);
    font-weight: normal;
}

/* Dark theme support */
[data-theme="dark"] .widget-context-menu {
    background: var(--nebula-surface, #2d3748);
    border-color: var(--nebula-border, #4a5568);
    color: var(--nebula-text-primary, #e2e8f0);
}

[data-theme="dark"] .context-menu-header {
    background: var(--nebula-surface-secondary, #1e293b);
    border-color: var(--nebula-border, #4a5568);
}

[data-theme="dark"] .context-menu-item:hover {
    background: var(--nebula-surface-hover, #4a5568);
}

[data-theme="dark"] .context-menu-item.danger:hover {
    background: var(--nebula-danger-hover, #991b1b);
    color: var(--nebula-danger, #f87171);
}
</style>
`;

// Inject styles
if (!document.getElementById('widget-context-menu-styles')) {
    document.head.insertAdjacentHTML('beforeend', widgetContextMenuStyles);
}

console.log('✅ Enhanced NebulaWidget base class loaded with self-managing context menus!');



// NebulaWidgetSystem.js - Widget Registration and Integration System
class NebulaWidgetSystem {
    constructor() {
        this.registeredWidgets = new Map(); // widgetId -> widget class
        this.activeWidgets = new Map();     // instanceId -> widget instance
        this.widgetContainer = null;
        this.nextInstanceId = 1;
        
        this.init();
    }

    /**
     * Initialize the widget system
     */
    init() {
        console.log('🧩 Initializing NebulaWidgetSystem...');
        
        // Create widget container on desktop
        this.createWidgetContainer();
        
        // Register built-in widgets
        this.registerBuiltInWidgets();
        
        console.log('✅ NebulaWidgetSystem initialized');
    }

    /**
     * Create the main widget container
     */
    createWidgetContainer() {
        // Wait for desktop element to be available
        const desktop = document.getElementById('desktop');
        if (!desktop) {
            console.warn('⚠️ Desktop element not found, retrying widget container creation...');
            // Retry after a short delay
            setTimeout(() => {
                this.createWidgetContainer();
            }, 100);
            return;
        }

        // Create widget layer that sits above desktop but below windows
        this.widgetContainer = document.createElement('div');
        this.widgetContainer.id = 'nebula-widget-layer';
        this.widgetContainer.className = 'widget-layer';
        
        // Insert after desktop but before any windows
        desktop.appendChild(this.widgetContainer);
        
        // Apply basic styles - Updated z-index ranges
        Object.assign(this.widgetContainer.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            pointerEvents: 'none', // Allow clicks to pass through empty areas
            zIndex: '1500' // Widgets: 1000-1999, Windows: 2000-2999
        });
        
        console.log('✅ Widget container created successfully', {
            containerId: this.widgetContainer.id,
            parent: desktop.id,
            zIndex: this.widgetContainer.style.zIndex
        });
    }

    /**
     * Create the floating drag handle system
     */
    createFloatingDragHandle() {
        this.floatingHandle = document.createElement('div');
        this.floatingHandle.id = 'nebula-floating-widget-handle';
        this.floatingHandle.className = 'floating-widget-handle';
        
        // Match window manager titlebar styling
        this.floatingHandle.innerHTML = `
            <div class="floating-handle-content">
                <span class="handle-grip">⋮⋮</span>
                <span class="handle-title">Widget</span>
                <div class="handle-controls">
                    <button class="handle-btn" data-action="settings" title="Widget Settings">
                        <span class="material-symbols-outlined">settings</span>
                    </button>
                    <button class="handle-btn" data-action="close" title="Close Widget">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
            </div>
        `;

        // Style the floating handle to match window manager
        Object.assign(this.floatingHandle.style, {
            position: 'absolute',
            display: 'none',
            zIndex: '1700', // Above widgets but below windows
            minWidth: '200px',
            height: '32px',
            background: 'var(--nebula-primary, #667eea)',
            border: '1px solid var(--nebula-border, #e2e8f0)',
            borderRadius: 'var(--nebula-radius-md, 8px)',
            boxShadow: 'var(--nebula-shadow-md, 0 4px 16px rgba(0, 0, 0, 0.25))',
            cursor: 'move',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: '13px',
            color: 'white',
            userSelect: 'none',
            backdropFilter: 'blur(10px)',
            transition: 'opacity 0.2s ease, transform 0.2s ease'
        });

        // Add to document body (not widget container, so it can float above)
        document.body.appendChild(this.floatingHandle);

        // Setup handle event listeners
        this.setupFloatingHandleEvents();
        
        console.log('✅ Floating drag handle created', {
            handleId: this.floatingHandle.id,
            zIndex: this.floatingHandle.style.zIndex,
            attached: document.body.contains(this.floatingHandle)
        });
    }

    /**
     * Register a widget class
     * @param {string} widgetId - Unique identifier for the widget type
     * @param {Object} widgetInfo - Widget registration info
     */
    registerWidget(widgetId, widgetInfo) {
        if (this.registeredWidgets.has(widgetId)) {
            console.warn(`⚠️ Widget ${widgetId} already registered, overwriting...`);
        }

        // Validate widget info
        const requiredFields = ['name', 'widgetClass', 'category'];
        for (const field of requiredFields) {
            if (!widgetInfo[field]) {
                throw new Error(`Widget registration failed: missing ${field}`);
            }
        }

        // Store registration info
        this.registeredWidgets.set(widgetId, {
            id: widgetId,
            name: widgetInfo.name,
            description: widgetInfo.description || '',
            category: widgetInfo.category || 'general',
            icon: widgetInfo.icon || '🧩',
            widgetClass: widgetInfo.widgetClass,
            defaultConfig: widgetInfo.defaultConfig || {},
            author: widgetInfo.author || 'Unknown',
            version: widgetInfo.version || '1.0.0'
        });

        console.log(`✅ Registered widget: ${widgetId} (${widgetInfo.name})`);
    }

    /**
     * Create a new widget instance
     * @param {string} widgetId - Type of widget to create
     * @param {Object} config - Widget configuration
     * @returns {string} instanceId - Unique instance identifier
     */
    createWidget(widgetId, config = {}) {
        const widgetInfo = this.registeredWidgets.get(widgetId);
        if (!widgetInfo) {
            throw new Error(`Unknown widget type: ${widgetId}`);
        }

        const instanceId = `widget-${this.nextInstanceId++}`;
        
        // Merge default config with provided config
        const finalConfig = {
            ...widgetInfo.defaultConfig,
            ...config,
            id: instanceId,
            type: widgetId
        };

        try {
            // Create widget instance
            const widget = new widgetInfo.widgetClass(finalConfig);
            
            // Create widget wrapper
            const wrapper = this.createWidgetWrapper(instanceId, widget, finalConfig);
            
            // Store widget instance
            this.activeWidgets.set(instanceId, {
                instance: widget,
                wrapper: wrapper,
                config: finalConfig,
                widgetId: widgetId
            });

            // Add to container
            this.widgetContainer.appendChild(wrapper);

            console.log(`✅ Created widget instance: ${instanceId} (${widgetInfo.name})`);
            return instanceId;
            
        } catch (error) {
            console.error(`❌ Failed to create widget ${widgetId}:`, error);
            throw error;
        }
    }

    /**
     * Create a wrapper element for a widget
     */
    createWidgetWrapper(instanceId, widget, config) {
        const wrapper = document.createElement('div');
        wrapper.className = 'nebula-widget-wrapper';
        wrapper.id = instanceId;
        wrapper.dataset.widgetType = config.type;
        
        // Make wrapper interactive and ensure visibility
        wrapper.style.pointerEvents = 'auto';
        
        // Basic positioning with improved z-index
        Object.assign(wrapper.style, {
            position: 'absolute',
            left: (config.x || 100) + 'px',
            top: (config.y || 100) + 'px',
            zIndex: '1600', // Within widget range (1000-1999)
            display: 'block',
            visibility: 'visible'
        });

        console.log(`🎯 Widget wrapper positioned at: ${config.x || 100}, ${config.y || 100}`);

        // Add widget content
        if (widget.render) {
            const content = widget.render();
            wrapper.appendChild(content);
        }

        // Add simple drag functionality back
        this.makeWidgetDraggable(wrapper, instanceId);

        return wrapper;
    }

    /**
     * Make a widget draggable for repositioning (simplified version)
     */
    makeWidgetDraggable(wrapper, instanceId) {
        let isDragging = false;
        let startX, startY, startLeft, startTop;

        const startDrag = (e) => {
            // Allow dragging from widget header or with Ctrl+click
            if (!e.ctrlKey && !e.target.closest('.widget-header') && !e.target.closest('.clock-display')) {
                return;
            }

            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = parseInt(wrapper.style.left);
            startTop = parseInt(wrapper.style.top);

            wrapper.classList.add('widget-dragging');
            e.preventDefault();
        };

        const doDrag = (e) => {
            if (!isDragging) return;

            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            wrapper.style.left = (startLeft + deltaX) + 'px';
            wrapper.style.top = (startTop + deltaY) + 'px';

            e.preventDefault();
        };

        const stopDrag = () => {
            if (!isDragging) return;
            
            isDragging = false;
            wrapper.classList.remove('widget-dragging');

            // Save new position
            const widgetData = this.activeWidgets.get(instanceId);
            if (widgetData) {
                widgetData.config.x = parseInt(wrapper.style.left);
                widgetData.config.y = parseInt(wrapper.style.top);
            }
        };

        wrapper.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', doDrag);
        document.addEventListener('mouseup', stopDrag);
    }

    /**
     * Remove a widget instance
     * @param {string} instanceId - Widget instance to remove
     */
    removeWidget(instanceId) {
        const widgetData = this.activeWidgets.get(instanceId);
        if (!widgetData) {
            console.warn(`⚠️ Widget instance ${instanceId} not found`);
            return;
        }

        // Cleanup widget
        if (widgetData.instance.cleanup) {
            widgetData.instance.cleanup();
        }

        // Remove from DOM
        widgetData.wrapper.remove();

        // Remove from active widgets
        this.activeWidgets.delete(instanceId);

        console.log(`✅ Removed widget instance: ${instanceId}`);
    }

    /**
     * Get list of all registered widget types
     */
    getRegisteredWidgets() {
        return Array.from(this.registeredWidgets.values());
    }

    /**
     * Get list of all active widget instances
     */
    getActiveWidgets() {
        return Array.from(this.activeWidgets.values());
    }

    /**
     * Register built-in widgets
     */
    registerBuiltInWidgets() {
        // We'll add the clock widget registration here once we create it
        console.log('📦 Registering built-in widgets...');
        
        // Clock widget will be registered here after we create it
        // this.registerWidget('clock', {
        //     name: 'Digital Clock',
        //     description: 'Simple digital clock widget',
        //     category: 'system',
        //     icon: '🕐',
        //     widgetClass: NebulaClock,
        //     defaultConfig: { format: '24h' }
        // });
    }
}

// Base Widget Class - All widgets should extend this
// class NebulaWidget {
//     constructor(config = {}) {
//         this.id = config.id;
//         this.type = config.type;
//         this.config = config;
//         this.element = null;
        
//         this.init();
//     }

//     /**
//      * Initialize the widget - override in subclasses
//      */
//     init() {
//         // Override in subclasses
//     }

//     /**
//      * Render the widget content - MUST be implemented by subclasses
//      * @returns {HTMLElement} The widget's DOM element
//      */
//     render() {
//         throw new Error('render() method must be implemented by widget subclasses');
//     }

//     /**
//      * Update the widget - override as needed
//      */
//     update() {
//         // Override in subclasses for periodic updates
//     }

//     /**
//      * Cleanup when widget is removed - override as needed
//      */
//     cleanup() {
//         // Override in subclasses
//     }

//     /**
//      * Get widget title for display
//      */
//     getTitle() {
//         return this.config.name || 'Widget';
//     }

//     /**
//      * Get widget icon
//      */
//     getIcon() {
//         return this.config.icon || '🧩';
//     }
// }

class NebulaWidget {
    constructor(config = {}) {
        this.id = config.id || this.generateId();
        this.x = config.x || 100;
        this.y = config.y || 100;
        this.showTitlebar = config.showTitlebar !== false; // Default true
        this.element = null;
        this.contextMenu = null;
        this.moveMode = false;
        this.originalCursor = null;
        this.mouseMoveHandler = null;
        this.clickHandler = null;
        this.moveOverlay = null;
    }

    generateId() {
        return 'widget-' + Math.random().toString(36).substr(2, 9);
    }

    // Abstract methods that child widgets must implement
    render() {
        throw new Error('render() method must be implemented by child class');
    }

    getTitle() {
        throw new Error('getTitle() method must be implemented by child class');
    }

    getIcon() {
        throw new Error('getIcon() method must be implemented by child class');
    }

    cleanup() {
        // Default cleanup - can be overridden
        this.hideContextMenu();
        this.stopMoveMode();
    }

    // Initialize the widget (called after render)
    init() {
        // Override in child classes if needed
    }

    // Setup right-click context menu
    setupWidgetContextMenu() {
        if (!this.element) return;

        // Remove any existing listeners
        this.element.removeEventListener('contextmenu', this.handleWidgetRightClick);
        
        // Add right-click listener
        this.element.addEventListener('contextmenu', (e) => this.handleWidgetRightClick(e));
        
        // Close context menu when clicking elsewhere
        document.addEventListener('click', (e) => {
            if (this.contextMenu && !this.contextMenu.contains(e.target)) {
                this.hideContextMenu();
            }
        });
        
        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideContextMenu();
                this.stopMoveMode();
            }
        });
    }

    handleWidgetRightClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        console.log(`🖱️ Right-click on ${this.getTitle()} widget`);
        this.showWidgetContextMenu(e.clientX, e.clientY);
    }

    showWidgetContextMenu(x, y) {
        this.hideContextMenu();
        
        this.contextMenu = document.createElement('div');
        this.contextMenu.className = 'widget-context-menu';
        this.contextMenu.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            background: var(--nebula-surface, #ffffff);
            border: 1px solid var(--nebula-border, #e2e8f0);
            border-radius: var(--nebula-radius-md, 8px);
            box-shadow: var(--nebula-shadow-lg, 0 8px 32px rgba(0, 0, 0, 0.15));
            padding: 8px 0;
            min-width: 200px;
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            color: var(--nebula-text-primary, #1a202c);
            backdrop-filter: blur(10px);
            animation: contextMenuFadeIn 0.2s ease;
        `;

        // Build context menu
        let menuHTML = `
            <div class="context-menu-header">
                <span class="menu-icon">${this.getIcon()}</span>
                <span class="menu-title">${this.getTitle()}</span>
            </div>
            <div class="context-menu-separator"></div>
        `;

        // Mode toggle
        const currentMode = this.showTitlebar ? 'Titlebar' : 'Minimal';
        const switchMode = this.showTitlebar ? 'Minimal' : 'Titlebar';
        
        menuHTML += `
            <div class="context-menu-item" data-action="toggle-mode">
                <span class="menu-icon">${this.showTitlebar ? '◽' : '🪟'}</span>
                <span class="menu-text">Switch to ${switchMode} Mode</span>
                <span class="menu-status">(Currently: ${currentMode})</span>
            </div>
            <div class="context-menu-separator"></div>
            <div class="context-menu-item" data-action="move-widget">
                <span class="menu-icon">🔄</span>
                <span class="menu-text">Move Widget</span>
            </div>
            <div class="context-menu-separator"></div>
        `;

        // Add widget-specific menu items
        const customItems = this.getCustomContextMenuItems();
        if (customItems && customItems.length > 0) {
            customItems.forEach(item => {
                menuHTML += `
                    <div class="context-menu-item" data-action="${item.action}">
                        <span class="menu-icon">${item.icon}</span>
                        <span class="menu-text">${item.text}</span>
                    </div>
                `;
            });
            menuHTML += `<div class="context-menu-separator"></div>`;
        }

        // Remove widget
        menuHTML += `
            <div class="context-menu-item danger" data-action="remove-widget">
                <span class="menu-icon">🗑️</span>
                <span class="menu-text">Remove Widget</span>
            </div>
        `;

        this.contextMenu.innerHTML = menuHTML;
        this.setupContextMenuEvents();
        this.positionContextMenu(x, y);
        
        document.body.appendChild(this.contextMenu);
    }

    // Override this in child classes to add custom menu items
    getCustomContextMenuItems() {
        return [];
    }

    setupContextMenuEvents() {
        this.contextMenu.addEventListener('click', (e) => {
            const item = e.target.closest('.context-menu-item');
            if (!item) return;
            
            const action = item.dataset.action;
            console.log(`📋 Widget context action: ${action}`);
            
            this.handleContextMenuAction(action);
            this.hideContextMenu();
        });
    }

    handleContextMenuAction(action) {
        switch (action) {
            case 'toggle-mode':
                this.toggleMode();
                break;
            case 'move-widget':
                this.startMoveMode();
                break;
            case 'remove-widget':
                this.removeWidget();
                break;
            default:
                // Handle custom actions in child classes
                this.handleCustomContextAction(action);
        }
    }

    // Override this in child classes to handle custom actions
    handleCustomContextAction(action) {
        console.log(`Custom action not handled: ${action}`);
    }

    toggleMode() {
        console.log(`🔄 Toggling mode for ${this.getTitle()} widget`);
        
        // Store current position
        const rect = this.element.getBoundingClientRect();
        this.x = rect.left;
        this.y = rect.top;
        
        // Toggle the mode
        this.showTitlebar = !this.showTitlebar;
        
        // Re-render the widget
        const newElement = this.render();
        
        // Replace the old element
        this.element.parentNode.replaceChild(newElement, this.element);
        this.element = newElement;
        
        // Restore position
        this.element.style.left = this.x + 'px';
        this.element.style.top = this.y + 'px';
        
        // Re-setup event handlers
        this.setupWidgetContextMenu();
        this.setupEventListeners();
        
        // Re-initialize if needed
        this.init();
        
        console.log(`✅ Mode toggled to: ${this.showTitlebar ? 'Titlebar' : 'Minimal'}`);
    }

    startMoveMode() {
        if (this.moveMode) return;
        
        console.log(`🔄 Starting move mode for ${this.getTitle()} widget`);
        
        this.moveMode = true;
        this.originalCursor = document.body.style.cursor;
        
        // Visual feedback
        document.body.style.cursor = 'move';
        this.element.style.opacity = '0.8';
        this.element.style.transform = 'scale(1.02)';
        this.element.style.zIndex = '1999';
        this.element.style.pointerEvents = 'none';
        
        // Create move overlay
        this.createMoveOverlay();
        
        // Set up handlers
        this.mouseMoveHandler = (e) => this.handleMoveMouseMove(e);
        this.clickHandler = (e) => this.handleMoveClick(e);
        
        document.addEventListener('mousemove', this.mouseMoveHandler);
        document.addEventListener('click', this.clickHandler);
    }

    createMoveOverlay() {
        this.moveOverlay = document.createElement('div');
        this.moveOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(102, 126, 234, 0.1);
            z-index: 1998;
            pointer-events: none;
            backdrop-filter: blur(2px);
        `;
        
        const instructions = document.createElement('div');
        instructions.style.cssText = `
            position: absolute;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--nebula-surface, #ffffff);
            border: 1px solid var(--nebula-border, #e2e8f0);
            border-radius: var(--nebula-radius-md, 8px);
            padding: 12px 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            color: var(--nebula-text-primary, #1a202c);
            box-shadow: var(--nebula-shadow-lg, 0 8px 32px rgba(0, 0, 0, 0.15));
            text-align: center;
        `;
        instructions.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 4px;">🔄 Moving ${this.getTitle()}</div>
            <div style="font-size: 12px; color: var(--nebula-text-secondary, #64748b);">
                Click anywhere to place • Press Escape to cancel
            </div>
        `;
        
        this.moveOverlay.appendChild(instructions);
        document.body.appendChild(this.moveOverlay);
    }

    handleMoveMouseMove(e) {
        if (!this.element) return;
        
        const rect = this.element.getBoundingClientRect();
        this.element.style.left = (e.clientX - rect.width / 2) + 'px';
        this.element.style.top = (e.clientY - rect.height / 2) + 'px';
    }

    handleMoveClick(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const newX = e.clientX - this.element.offsetWidth / 2;
        const newY = e.clientY - this.element.offsetHeight / 2;
        
        // Update position
        this.x = newX;
        this.y = newY;
        
        // Update in widget system if available
        if (window.widgetSystem) {
            const activeWidgets = window.widgetSystem.getActiveWidgets();
            const widgetData = activeWidgets.find(w => w.id === this.id);
            if (widgetData) {
                widgetData.x = newX;
                widgetData.y = newY;
            }
        }
        
        console.log(`📍 ${this.getTitle()} moved to (${newX}, ${newY})`);
        this.stopMoveMode();
    }

    stopMoveMode() {
        if (!this.moveMode) return;
        
        console.log(`🔄 Stopping move mode for ${this.getTitle()}`);
        
        this.moveMode = false;
        
        // Restore cursor and element
        document.body.style.cursor = this.originalCursor || '';
        this.element.style.opacity = '';
        this.element.style.transform = '';
        this.element.style.zIndex = '';
        this.element.style.pointerEvents = '';
        
        // Remove overlay
        if (this.moveOverlay) {
            this.moveOverlay.remove();
            this.moveOverlay = null;
        }
        
        // Remove handlers
        if (this.mouseMoveHandler) {
            document.removeEventListener('mousemove', this.mouseMoveHandler);
            this.mouseMoveHandler = null;
        }
        if (this.clickHandler) {
            document.removeEventListener('click', this.clickHandler);
            this.clickHandler = null;
        }
    }

    removeWidget() {
        const widgetName = this.getTitle();
        
        if (confirm(`Remove ${widgetName} widget?`)) {
            console.log(`🗑️ Removing ${widgetName} widget`);
            
            // Clean up
            this.cleanup();
            
            // Remove from widget system
            if (window.widgetSystem) {
                window.widgetSystem.removeWidget(this.id);
            }
            
            // Remove from DOM
            if (this.element && this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
            }
        }
    }

    positionContextMenu(x, y) {
        const rect = this.contextMenu.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        if (x + rect.width > windowWidth) {
            this.contextMenu.style.left = (windowWidth - rect.width - 10) + 'px';
        }
        
        if (y + rect.height > windowHeight) {
            this.contextMenu.style.top = (windowHeight - rect.height - 10) + 'px';
        }
    }

    hideContextMenu() {
        if (this.contextMenu) {
            this.contextMenu.remove();
            this.contextMenu = null;
        }
    }

    // Method that child classes should call in their setupEventListeners
    setupEventListeners() {
        // Override in child classes
        // Make sure to call this.setupWidgetContextMenu() in child implementation
    }
}

// Integration with existing NebulaDesktop
if (window.NebulaDesktop) {
    // Add widget system to desktop initialization
    const originalInit = window.NebulaDesktop.prototype.init;
    window.NebulaDesktop.prototype.init = function() {
        // Call original init
        originalInit.call(this);
        
        // Initialize widget system
        this.widgetSystem = new NebulaWidgetSystem();
        window.widgetSystem = this.widgetSystem; // Make globally available
    };
}

// Make classes globally available
window.NebulaWidgetSystem = NebulaWidgetSystem;
window.NebulaWidget = NebulaWidget;

// Add CSS for floating handle system
const floatingHandleStyles = `
<style id="nebula-floating-handle-styles">
.floating-widget-handle {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    user-select: none;
    pointer-events: auto;
}

.floating-handle-content {
    height: 100%;
    display: flex;
    align-items: center;
    padding: 0 12px;
    gap: 8px;
}

.handle-grip {
    color: rgba(255, 255, 255, 0.8);
    font-size: 14px;
    letter-spacing: -2px;
    cursor: move;
}

.handle-title {
    flex: 1;
    font-size: 13px;
    font-weight: 600;
    color: white;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.handle-controls {
    display: flex;
    gap: 4px;
}

.handle-btn {
    background: rgba(255, 255, 255, 0.15);
    border: none;
    color: white;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s ease;
    font-size: 16px;
}

.handle-btn:hover {
    background: rgba(255, 255, 255, 0.25);
}

.handle-btn .material-symbols-outlined {
    font-size: 16px;
}

/* Widget dragging state */
.widget-dragging {
    opacity: 0.8;
    transform: scale(1.02);
    transition: none;
    z-index: 1650 !important;
}

/* Remove old drag styles since we're using floating handle */
.nebula-widget-wrapper.dragging {
    /* Remove old dragging styles */
}
</style>
`;

// Inject floating handle styles
if (!document.getElementById('nebula-floating-handle-styles')) {
    document.head.insertAdjacentHTML('beforeend', floatingHandleStyles);
}

// Auto-initialize if desktop is already running
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.widgetSystem && !window.NebulaDesktop) {
            // Standalone initialization
            window.widgetSystem = new NebulaWidgetSystem();
        }
    });
} else {
    if (!window.widgetSystem && !window.NebulaDesktop) {
        // Standalone initialization
        window.widgetSystem = new NebulaWidgetSystem();
    }
}