// WidgetIntegration.js - Integration script for testing the widget system
class WidgetIntegration {
    constructor() {
        this.initialized = false;
        this.init();
    }

    async init() {
        console.log('🚀 Starting Widget System Integration...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        // Ensure widget system is available
        if (!window.NebulaWidgetSystem) {
            console.error('❌ NebulaWidgetSystem not found!');
            return;
        }

        if (!window.widgetSystem) {
            console.log('📦 Creating widget system instance...');
            window.widgetSystem = new NebulaWidgetSystem();
        }

        // Register our demo clock widget
        this.registerDemoWidgets();

        // Add development controls
        this.addDevelopmentControls();

        // Add right-click context menu for widget creation
        this.addContextMenu();

        this.initialized = true;
        console.log('✅ Widget System Integration complete!');
    }

    registerDemoWidgets() {
        // Make sure clock widget is registered
        if (window.NebulaClock && window.widgetSystem) {
            try {
                window.widgetSystem.registerWidget('clock', {
                    name: 'Digital Clock',
                    description: 'A simple digital clock widget with date display',
                    category: 'system',
                    icon: '🕐',
                    widgetClass: NebulaClock,
                    defaultConfig: {
                        format: '24h',
                        showSeconds: true,
                        showDate: true,
                        x: 100,
                        y: 100
                    },
                    author: 'NebulaDesktop',
                    version: '1.0.0'
                });
                console.log('✅ Clock widget registered');
            } catch (error) {
                console.warn('⚠️ Clock widget already registered:', error.message);
            }
        }
    }

    addDevelopmentControls() {
        // Create a simple control panel for testing
    const existing = document.getElementById('widget-dev-controls');
    if (existing) existing.remove();
    
    const controlPanel = document.createElement('div');
    controlPanel.id = 'widget-dev-controls';
    controlPanel.innerHTML = `
        <div class="dev-controls-header">
            <span>🧩 Widget Dev Controls</span>
            <button id="toggle-dev-controls">−</button>
        </div>
        <div class="dev-controls-content">
            ${this.generateWidgetButtons()}
            <button id="widget-config">Widget Config</button>
            <button id="list-widgets">List Active Widgets</button>
            <button id="clear-widgets">Clear All Widgets</button>
            <button id="test-positioning">Test Positioning</button>
        </div>
    `;

        // Style the control panel
        Object.assign(controlPanel.style, {
            position: 'fixed',
            top: '10px',
            right: '10px',
            backgroundColor: 'var(--nebula-surface, #ffffff)',
            border: '1px solid var(--nebula-border, #e2e8f0)',
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
            zIndex: '1000',
            minWidth: '200px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        });

        // Add control panel styles
        const controlStyles = `
            <style id="widget-dev-controls-styles">
            #widget-dev-controls {
                font-size: 14px;
            }
            
            .dev-controls-header {
                background: var(--nebula-primary, #667eea);
                color: white;
                padding: 8px 12px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-weight: 600;
                border-radius: 8px 8px 0 0;
            }
            
            .dev-controls-header button {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                font-size: 16px;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .dev-controls-content {
                padding: 12px;
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .dev-controls-content button {
                background: var(--nebula-bg-secondary, #f8fafc);
                border: 1px solid var(--nebula-border, #e2e8f0);
                padding: 8px 12px;
                border-radius: 6px;
                cursor: pointer;
                transition: background-color 0.2s ease;
                font-size: 13px;
            }
            
            .dev-controls-content button:hover {
                background: var(--nebula-surface-hover, #f1f5f9);
            }
            
            .dev-controls-hidden {
                display: none !important;
            }
            </style>
        `;

        if (!document.getElementById('widget-dev-controls-styles')) {
            document.head.insertAdjacentHTML('beforeend', controlStyles);
        }

        document.body.appendChild(controlPanel);

        // Add event listeners
        this.setupControlListeners();
    }

    generateWidgetButtons() {
    if (!window.widgetSystem) return '<button disabled>Widget System Loading...</button>';
    
    const widgets = window.widgetSystem.getRegisteredWidgets();
    return widgets.map(widget => 
        `<button id="create-${widget.id}" data-widget-type="${widget.id}">
            Create ${widget.name}
        </button>`
    ).join('');
}

    setupControlListeners() {
        // Toggle control panel
        document.getElementById('toggle-dev-controls')?.addEventListener('click', () => {
            const content = document.querySelector('.dev-controls-content');
            content.classList.toggle('dev-controls-hidden');
            const button = document.getElementById('toggle-dev-controls');
            button.textContent = content.classList.contains('dev-controls-hidden') ? '+' : '−';
        });

        // Create clock widget
        document.getElementById('create-clock')?.addEventListener('click', () => {
            this.createTestClock();
        });

        // Create minimal clock widget
        document.getElementById('create-minimal-clock')?.addEventListener('click', () => {
            this.createTestClock(true); // minimal = true
        });

        // Widget config placeholder
        document.getElementById('widget-config')?.addEventListener('click', () => {
            this.openWidgetConfig();
        });

        // List active widgets
        document.getElementById('list-widgets')?.addEventListener('click', () => {
            this.listActiveWidgets();
        });

        // Clear all widgets
        document.getElementById('clear-widgets')?.addEventListener('click', () => {
            this.clearAllWidgets();
        });

        // Test positioning
        document.getElementById('test-positioning')?.addEventListener('click', () => {
            this.testPositioning();
        });
    }

    createTestClock(minimal = false) {
        if (!window.widgetSystem) {
            alert('Widget system not available!');
            return;
        }

        try {
            // Create clock at random position
            const x = Math.random() * (window.innerWidth - 250);
            const y = Math.random() * (window.innerHeight - 150);
            
            console.log(`🕐 Creating ${minimal ? 'minimal' : 'titlebar'} clock at position: ${x}, ${y}`);
            
            const clockId = window.widgetSystem.createWidget('clock', {
                x: Math.floor(x),
                y: Math.floor(y),
                format: Math.random() > 0.5 ? '12h' : '24h',
                showTitlebar: !minimal
            });
            
            console.log('🕐 Created test clock:', clockId);
            
            // Verify the widget exists in DOM
            setTimeout(() => {
                const widgetElement = document.getElementById(clockId);
                const widgetContainer = document.getElementById('nebula-widget-layer');
                console.log('🔍 Widget verification:', {
                    clockId,
                    minimal,
                    elementExists: !!widgetElement,
                    containerExists: !!widgetContainer,
                    containerChildren: widgetContainer?.children.length || 0,
                    elementPosition: widgetElement ? {
                        left: widgetElement.style.left,
                        top: widgetElement.style.top,
                        zIndex: widgetElement.style.zIndex,
                        display: widgetElement.style.display
                    } : 'Not found'
                });
            }, 100);
            
            alert(`Created ${minimal ? 'minimal' : 'titlebar'} clock widget: ${clockId}`);
        } catch (error) {
            console.error('❌ Failed to create clock:', error);
            alert('Failed to create clock: ' + error.message);
        }
    }

    listActiveWidgets() {
        if (!window.widgetSystem) {
            alert('Widget system not available!');
            return;
        }

        const widgets = window.widgetSystem.getActiveWidgets();
        console.log('📋 Active widgets:', widgets);
        
        const widgetList = widgets.map(w => 
            `${w.config.id} (${w.widgetId}) at (${w.config.x}, ${w.config.y})`
        ).join('\n');
        
        alert(`Active Widgets (${widgets.length}):\n${widgetList || 'None'}`);
    }

    clearAllWidgets() {
        if (!window.widgetSystem) {
            alert('Widget system not available!');
            return;
        }

        const widgets = window.widgetSystem.getActiveWidgets();
        let cleared = 0;

        widgets.forEach(widgetData => {
            window.widgetSystem.removeWidget(widgetData.config.id);
            cleared++;
        });

        console.log(`🧹 Cleared ${cleared} widgets`);
        alert(`Cleared ${cleared} widgets`);
    }

    testPositioning() {
        if (!window.widgetSystem) {
            alert('Widget system not available!');
            return;
        }

        // Create a grid of clocks to test positioning
        const cols = 3;
        const rows = 2;
        const spacing = 250;
        const startX = 50;
        const startY = 80;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = startX + (col * spacing);
                const y = startY + (row * spacing);
                
                try {
                    window.widgetSystem.createWidget('clock', {
                        x: x,
                        y: y,
                        format: (row + col) % 2 === 0 ? '24h' : '12h',
                        showSeconds: col % 2 === 0
                    });
                } catch (error) {
                    console.error('Failed to create test clock:', error);
                }
            }
        }

        alert(`Created ${cols * rows} test clocks in a grid pattern`);
    }

    addContextMenu() {
        // Add right-click context menu for creating widgets
        document.addEventListener('contextmenu', (e) => {
            // Only show on desktop area (not on widgets or windows)
            if (e.target.closest('.nebula-widget-wrapper') || 
                e.target.closest('.nebula-window') ||
                e.target.closest('#widget-dev-controls')) {
                return;
            }

            e.preventDefault();
            this.showContextMenu(e.clientX, e.clientY);
        });

        // Hide context menu on click elsewhere
        document.addEventListener('click', () => {
            this.hideContextMenu();
        });
    }

    showContextMenu(x, y) {
        // Remove existing context menu
        this.hideContextMenu();

        const contextMenu = document.createElement('div');
        contextMenu.id = 'widget-context-menu';
        contextMenu.innerHTML = `
            <div class="context-menu-item" data-action="create-clock">
                🕐 Create Clock Widget
            </div>
            <div class="context-menu-item" data-action="create-minimal-clock">
                🕕 Create Minimal Clock
            </div>
            <div class="context-menu-separator"></div>
            <div class="context-menu-item" data-action="widget-settings">
                ⚙️ Widget Settings
            </div>
        `;

        // Position the context menu
        Object.assign(contextMenu.style, {
            position: 'fixed',
            left: x + 'px',
            top: y + 'px',
            backgroundColor: 'var(--nebula-surface, #ffffff)',
            border: '1px solid var(--nebula-border, #e2e8f0)',
            borderRadius: '6px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
            zIndex: '2000',
            minWidth: '180px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: '14px'
        });

        // Add context menu styles if not already added
        if (!document.getElementById('widget-context-menu-styles')) {
            const contextStyles = `
                <style id="widget-context-menu-styles">
                .context-menu-item {
                    padding: 8px 12px;
                    cursor: pointer;
                    transition: background-color 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .context-menu-item:hover {
                    background: var(--nebula-surface-hover, #f1f5f9);
                }
                
                .context-menu-item:first-child {
                    border-radius: 6px 6px 0 0;
                }
                
                .context-menu-item:last-child {
                    border-radius: 0 0 6px 6px;
                }
                
                .context-menu-separator {
                    height: 1px;
                    background: var(--nebula-border, #e2e8f0);
                    margin: 4px 0;
                }
                </style>
            `;
            document.head.insertAdjacentHTML('beforeend', contextStyles);
        }

        document.body.appendChild(contextMenu);

        // Add click handlers
        contextMenu.addEventListener('click', (e) => {
            const action = e.target.closest('.context-menu-item')?.dataset.action;
            
            if (action === 'create-clock') {
                // Calculate position relative to desktop
                const desktop = document.getElementById('desktop');
                const desktopRect = desktop ? desktop.getBoundingClientRect() : { left: 0, top: 0 };
                
                window.widgetSystem.createWidget('clock', {
                    x: x - desktopRect.left,
                    y: y - desktopRect.top,
                    showTitlebar: true
                });
            } else if (action === 'create-minimal-clock') {
                // Calculate position relative to desktop
                const desktop = document.getElementById('desktop');
                const desktopRect = desktop ? desktop.getBoundingClientRect() : { left: 0, top: 0 };
                
                window.widgetSystem.createWidget('clock', {
                    x: x - desktopRect.left,
                    y: y - desktopRect.top,
                    showTitlebar: false
                });
            } else if (action === 'widget-settings') {
                alert('Widget settings would open here');
            }
            
            this.hideContextMenu();
        });

        // Auto-hide after 5 seconds
        setTimeout(() => this.hideContextMenu(), 5000);
    }

    hideContextMenu() {
        const existingMenu = document.getElementById('widget-context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }
    }
}

// Global helper functions for console testing
window.createTestClock = function(x = 100, y = 100) {
    if (window.widgetSystem) {
        return window.widgetSystem.createWidget('clock', { x, y });
    } else {
        console.error('Widget system not available');
    }
};

window.listWidgets = function() {
    if (window.widgetSystem) {
        const widgets = window.widgetSystem.getActiveWidgets();
        console.table(widgets.map(w => ({
            id: w.config.id,
            type: w.widgetId,
            position: `(${w.config.x}, ${w.config.y})`
        })));
        return widgets;
    } else {
        console.error('Widget system not available');
    }
};

window.clearAllWidgets = function() {
    if (window.widgetSystem) {
        const widgets = window.widgetSystem.getActiveWidgets();
        widgets.forEach(w => window.widgetSystem.removeWidget(w.config.id));
        console.log(`Cleared ${widgets.length} widgets`);
    } else {
        console.error('Widget system not available');
    }
};

// Auto-initialize the integration
document.addEventListener('DOMContentLoaded', () => {
    window.widgetIntegration = new WidgetIntegration();
});

// Also initialize immediately if DOM is already loaded
if (document.readyState !== 'loading') {
    window.widgetIntegration = new WidgetIntegration();
}

console.log('📋 Widget Integration loaded. Available console commands:');
console.log('  • createTestClock(x, y) - Create a clock at position');
console.log('  • listWidgets() - List all active widgets');
console.log('  • clearAllWidgets() - Remove all widgets');
console.log('  • Right-click desktop to create widgets via context menu');