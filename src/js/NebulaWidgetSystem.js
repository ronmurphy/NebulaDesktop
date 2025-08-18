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

        // Add drag functionality for positioning
        this.makeWidgetDraggable(wrapper, instanceId);

        return wrapper;
    }

    /**
     * Make a widget draggable for repositioning
     */
    makeWidgetDraggable(wrapper, instanceId) {
        let isDragging = false;
        let startX, startY, startLeft, startTop;

        const startDrag = (e) => {
            // Only allow dragging from the widget header or if Ctrl is held
            if (!e.ctrlKey && !e.target.closest('.widget-header')) {
                return;
            }

            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = parseInt(wrapper.style.left);
            startTop = parseInt(wrapper.style.top);

            wrapper.classList.add('dragging');
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
            wrapper.classList.remove('dragging');

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
class NebulaWidget {
    constructor(config = {}) {
        this.id = config.id;
        this.type = config.type;
        this.config = config;
        this.element = null;
        
        this.init();
    }

    /**
     * Initialize the widget - override in subclasses
     */
    init() {
        // Override in subclasses
    }

    /**
     * Render the widget content - MUST be implemented by subclasses
     * @returns {HTMLElement} The widget's DOM element
     */
    render() {
        throw new Error('render() method must be implemented by widget subclasses');
    }

    /**
     * Update the widget - override as needed
     */
    update() {
        // Override in subclasses for periodic updates
    }

    /**
     * Cleanup when widget is removed - override as needed
     */
    cleanup() {
        // Override in subclasses
    }

    /**
     * Get widget title for display
     */
    getTitle() {
        return this.config.name || 'Widget';
    }

    /**
     * Get widget icon
     */
    getIcon() {
        return this.config.icon || '🧩';
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