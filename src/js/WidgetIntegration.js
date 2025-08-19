// Enhanced WidgetIntegration.js - Desktop Right-Click Widget Menu
console.log('🚀 Starting Enhanced Widget System Integration...');

// Wait for widget system to be ready
function waitForWidgetSystem() {
    return new Promise((resolve) => {
        if (window.NebulaWidgetSystem && window.widgetSystem) {
            resolve();
        } else {
            setTimeout(() => waitForWidgetSystem().then(resolve), 100);
        }
    });
}

// Enhanced Widget Integration
class EnhancedWidgetIntegration {
    constructor() {
        this.contextMenu = null;
        this.currentX = 0;
        this.currentY = 0;
        this.devPanel = null;
        
        // Initialize when ready
        this.init();
    }

    async init() {
        await waitForWidgetSystem();
        console.log('🧩 Enhanced Widget Integration initializing...');
        
        this.setupDesktopRightClick();
        this.createDevPanel();
        this.setupConsoleCommands();
        
        console.log('✅ Enhanced Widget System Integration complete!');
    }

    setupDesktopRightClick() {
        console.log('🖱️ Setting up desktop right-click context menu...');
        
        // Find the desktop element
        const desktop = document.getElementById('desktop') || document.body;
        
        // Remove any existing listeners to prevent duplicates
        desktop.removeEventListener('contextmenu', this.handleDesktopRightClick);
        
        // Add right-click listener
        desktop.addEventListener('contextmenu', (e) => this.handleDesktopRightClick(e));
        
        // Close context menu when clicking elsewhere
        document.addEventListener('click', () => this.hideContextMenu());
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.hideContextMenu();
        });
    }

    handleDesktopRightClick = (e) => {
        // Only handle right-clicks on the desktop itself, not on widgets or windows
        if (e.target.closest('.nebula-widget-wrapper') || 
            e.target.closest('.window') || 
            e.target.closest('.taskbar') ||
            e.target.closest('.launcher')) {
            return; // Let other elements handle their own context menus
        }

        e.preventDefault();
        e.stopPropagation();
        
        this.currentX = e.clientX;
        this.currentY = e.clientY;
        
        console.log('🖱️ Desktop right-click at:', this.currentX, this.currentY);
        this.showContextMenu(e.clientX, e.clientY);
    }

    showContextMenu(x, y) {
        this.hideContextMenu(); // Close any existing menu
        
        const registeredWidgets = window.widgetSystem.getRegisteredWidgets();
        const activeWidgets = window.widgetSystem.getActiveWidgets();
        
        console.log('📋 Creating context menu with', registeredWidgets.length, 'registered widgets');
        
        this.contextMenu = document.createElement('div');
        this.contextMenu.className = 'desktop-context-menu';
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

        // Create menu items
        let menuHTML = '';
        
        // Widgets submenu
        if (registeredWidgets.length > 0) {
            menuHTML += `
                <div class="context-menu-item submenu-trigger" data-action="widgets">
                    <span class="menu-icon">🧩</span>
                    <span class="menu-text">Widgets</span>
                    <span class="menu-arrow">▶</span>
                </div>
            `;
        }
        
        // Separator
        menuHTML += `<div class="context-menu-separator"></div>`;
        
        // Widget management options
        if (activeWidgets.length > 0) {
            menuHTML += `
                <div class="context-menu-item" data-action="list-widgets">
                    <span class="menu-icon">📋</span>
                    <span class="menu-text">List Active Widgets (${activeWidgets.length})</span>
                </div>
                <div class="context-menu-item" data-action="clear-widgets">
                    <span class="menu-icon">🗑️</span>
                    <span class="menu-text">Remove All Widgets</span>
                </div>
                <div class="context-menu-separator"></div>
            `;
        }
        
        // Development options
        menuHTML += `
            <div class="context-menu-item" data-action="toggle-dev-panel">
                <span class="menu-icon">🔧</span>
                <span class="menu-text">Toggle Dev Panel</span>
            </div>
            <div class="context-menu-item" data-action="refresh-desktop">
                <span class="menu-icon">🔄</span>
                <span class="menu-text">Refresh Desktop</span>
            </div>
        `;

        this.contextMenu.innerHTML = menuHTML;
        
        // Create widgets submenu
        if (registeredWidgets.length > 0) {
            const submenu = this.createWidgetsSubmenu(registeredWidgets);
            this.contextMenu.appendChild(submenu);
        }
        
        // Add event listeners
        this.setupContextMenuEvents();
        
        // Position menu (ensure it stays on screen)
        this.positionContextMenu(x, y);
        
        document.body.appendChild(this.contextMenu);
        
        console.log('📋 Context menu created and positioned');
    }

    createWidgetsSubmenu(registeredWidgets) {
        const submenu = document.createElement('div');
        submenu.className = 'widgets-submenu';
        submenu.style.cssText = `
            position: absolute;
            left: 100%;
            top: 0;
            background: var(--nebula-surface, #ffffff);
            border: 1px solid var(--nebula-border, #e2e8f0);
            border-radius: var(--nebula-radius-md, 8px);
            box-shadow: var(--nebula-shadow-lg, 0 8px 32px rgba(0, 0, 0, 0.15));
            padding: 8px 0;
            min-width: 220px;
            display: none;
            z-index: 10001;
            backdrop-filter: blur(10px);
        `;

        // Sort widgets by category
        const categorizedWidgets = {};
        registeredWidgets.forEach(widget => {
            const category = widget.category || 'Other';
            if (!categorizedWidgets[category]) {
                categorizedWidgets[category] = [];
            }
            categorizedWidgets[category].push(widget);
        });

        let submenuHTML = '';
        
        // Add widgets by category
        Object.keys(categorizedWidgets).sort().forEach(category => {
            // Category header
            submenuHTML += `
                <div class="submenu-category-header">
                    <span class="category-text">${category}</span>
                </div>
            `;
            
            // Category widgets
            categorizedWidgets[category].forEach(widget => {
                submenuHTML += `
                    <div class="context-menu-item widget-item" data-action="create-widget" data-widget-id="${widget.id}">
                        <span class="menu-icon">${widget.icon}</span>
                        <span class="menu-text">${widget.name}</span>
                        <span class="menu-description">${widget.description}</span>
                    </div>
                `;
            });
            
            // Separator after category (except last)
            const categoryIndex = Object.keys(categorizedWidgets).indexOf(category);
            if (categoryIndex < Object.keys(categorizedWidgets).length - 1) {
                submenuHTML += `<div class="context-menu-separator"></div>`;
            }
        });

        submenu.innerHTML = submenuHTML;
        return submenu;
    }

    setupContextMenuEvents() {
        // Handle menu item clicks
        this.contextMenu.addEventListener('click', (e) => {
            const item = e.target.closest('.context-menu-item');
            if (!item) return;
            
            const action = item.dataset.action;
            const widgetId = item.dataset.widgetId;
            
            console.log('📋 Context menu action:', action, widgetId);
            
            this.handleContextMenuAction(action, widgetId);
            this.hideContextMenu();
        });

        // Handle submenu hover
        const submenuTrigger = this.contextMenu.querySelector('.submenu-trigger');
        const submenu = this.contextMenu.querySelector('.widgets-submenu');
        
        if (submenuTrigger && submenu) {
            submenuTrigger.addEventListener('mouseenter', () => {
                submenu.style.display = 'block';
                submenuTrigger.classList.add('active');
            });
            
            this.contextMenu.addEventListener('mouseleave', () => {
                submenu.style.display = 'none';
                submenuTrigger.classList.remove('active');
            });
            
            // Keep submenu open when hovering over it
            submenu.addEventListener('mouseenter', () => {
                submenu.style.display = 'block';
                submenuTrigger.classList.add('active');
            });
        }
    }

    handleContextMenuAction(action, widgetId) {
        switch (action) {
            case 'create-widget':
                this.createWidgetAtPosition(widgetId);
                break;
            case 'list-widgets':
                this.listActiveWidgets();
                break;
            case 'clear-widgets':
                this.clearAllWidgets();
                break;
            case 'toggle-dev-panel':
                this.toggleDevPanel();
                break;
            case 'refresh-desktop':
                location.reload();
                break;
            default:
                console.log('Unknown action:', action);
        }
    }

    createWidgetAtPosition(widgetId) {
        console.log('🧩 Creating widget:', widgetId, 'at position:', this.currentX, this.currentY);
        
        try {
            const instanceId = window.widgetSystem.createWidget(widgetId, {
                x: this.currentX - 50, // Offset so widget doesn't appear under cursor
                y: this.currentY - 25
            });
            
            console.log('✅ Widget created successfully:', instanceId);
        } catch (error) {
            console.error('❌ Failed to create widget:', error);
            alert(`Failed to create widget: ${error.message}`);
        }
    }

    listActiveWidgets() {
        const activeWidgets = window.widgetSystem.getActiveWidgets();
        console.log('📋 Active widgets:', activeWidgets);
        
        if (activeWidgets.length === 0) {
            alert('No active widgets');
            return;
        }
        
        const list = activeWidgets.map(w => `• ${w.type} (ID: ${w.id}) at (${w.x}, ${w.y})`).join('\n');
        alert(`Active Widgets (${activeWidgets.length}):\n\n${list}`);
    }

    clearAllWidgets() {
        const activeWidgets = window.widgetSystem.getActiveWidgets();
        
        if (activeWidgets.length === 0) {
            alert('No widgets to remove');
            return;
        }
        
        if (confirm(`Remove all ${activeWidgets.length} widgets?`)) {
            activeWidgets.forEach(widget => {
                window.widgetSystem.removeWidget(widget.id);
            });
            console.log('🗑️ All widgets removed');
        }
    }

    positionContextMenu(x, y) {
        const menu = this.contextMenu;
        const rect = menu.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // Adjust horizontal position
        if (x + rect.width > windowWidth) {
            menu.style.left = (windowWidth - rect.width - 10) + 'px';
        }
        
        // Adjust vertical position
        if (y + rect.height > windowHeight) {
            menu.style.top = (windowHeight - rect.height - 10) + 'px';
        }
    }

    hideContextMenu() {
        if (this.contextMenu) {
            this.contextMenu.remove();
            this.contextMenu = null;
        }
    }

    createDevPanel() {
        // Only create if it doesn't exist
        if (document.getElementById('widget-dev-panel')) {
            this.devPanel = document.getElementById('widget-dev-panel');
            return;
        }
        
        console.log('🔧 Creating widget dev panel...');
        
        this.devPanel = document.createElement('div');
        this.devPanel.id = 'widget-dev-panel';
        this.devPanel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: var(--nebula-surface, #ffffff);
            border: 1px solid var(--nebula-border, #e2e8f0);
            border-radius: var(--nebula-radius-md, 8px);
            padding: 12px;
            font-family: monospace;
            font-size: 12px;
            z-index: 9999;
            max-width: 250px;
            box-shadow: var(--nebula-shadow-md, 0 4px 16px rgba(0, 0, 0, 0.1));
            display: none;
        `;
        
        this.updateDevPanel();
        document.body.appendChild(this.devPanel);
    }

    updateDevPanel() {
        if (!this.devPanel) return;
        
        const registered = window.widgetSystem.getRegisteredWidgets();
        const active = window.widgetSystem.getActiveWidgets();
        
        this.devPanel.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 8px; color: var(--nebula-primary, #667eea);">
                🧩 Widget System
            </div>
            <div style="margin-bottom: 8px;">
                Registered: ${registered.length}<br>
                Active: ${active.length}
            </div>
            <div style="display: flex; flex-direction: column; gap: 4px;">
                ${registered.map(w => `
                    <button onclick="window.widgetSystem.createWidget('${w.id}', {x: 100, y: 100})" 
                            style="padding: 4px 8px; background: var(--nebula-primary, #667eea); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
                        ${w.icon} ${w.name}
                    </button>
                `).join('')}
            </div>
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--nebula-border, #e2e8f0); font-size: 10px; color: var(--nebula-text-secondary, #64748b);">
                Right-click desktop for context menu
            </div>
        `;
    }

    toggleDevPanel() {
        if (!this.devPanel) {
            this.createDevPanel();
        }
        
        const isVisible = this.devPanel.style.display !== 'none';
        this.devPanel.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            this.updateDevPanel();
        }
        
        console.log('🔧 Dev panel toggled:', !isVisible ? 'visible' : 'hidden');
    }

    setupConsoleCommands() {
        // Enhanced console commands
        window.createTestClock = (x = 100, y = 100) => {
            console.log('🕐 Creating test clock widget...');
            try {
                const instanceId = window.widgetSystem.createWidget('clock', { x, y });
                console.log('✅ Test clock created:', instanceId);
                return instanceId;
            } catch (error) {
                console.error('❌ Failed to create clock:', error);
            }
        };

        window.createTestLauncher = (x = 200, y = 200) => {
            console.log('🚀 Creating test launcher widget...');
            try {
                const instanceId = window.widgetSystem.createWidget('launcher', { x, y });
                console.log('✅ Test launcher created:', instanceId);
                return instanceId;
            } catch (error) {
                console.error('❌ Failed to create launcher:', error);
            }
        };

        window.listWidgets = () => {
            const registered = window.widgetSystem.getRegisteredWidgets();
            const active = window.widgetSystem.getActiveWidgets();
            console.log('📋 Registered widgets:', registered);
            console.log('📋 Active widgets:', active);
            return { registered, active };
        };

        window.clearAllWidgets = () => {
            const active = window.widgetSystem.getActiveWidgets();
            active.forEach(widget => window.widgetSystem.removeWidget(widget.id));
            console.log('🗑️ All widgets cleared');
        };

        window.toggleWidgetDevPanel = () => {
            this.toggleDevPanel();
        };

        console.log('📋 Enhanced console commands loaded:');
        console.log('• createTestClock(x, y) - Create clock widget');
        console.log('• createTestLauncher(x, y) - Create launcher widget');
        console.log('• listWidgets() - List all widgets');
        console.log('• clearAllWidgets() - Remove all widgets');
        console.log('• toggleWidgetDevPanel() - Toggle dev panel');
        console.log('• Right-click desktop for widget context menu');
    }
}

// Add CSS styles for context menu
const contextMenuStyles = `
<style id="widget-context-menu-styles">
@keyframes contextMenuFadeIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
}

.desktop-context-menu {
    user-select: none;
}

.context-menu-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 16px;
    cursor: pointer;
    transition: background-color 0.2s ease;
    white-space: nowrap;
}

.context-menu-item:hover {
    background: var(--nebula-surface-hover, #f1f5f9);
}

.context-menu-item.submenu-trigger.active {
    background: var(--nebula-surface-hover, #f1f5f9);
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
}

.menu-text {
    flex: 1;
    font-weight: 500;
}

.menu-arrow {
    font-size: 12px;
    color: var(--nebula-text-secondary, #64748b);
}

.submenu-category-header {
    padding: 8px 16px 4px 16px;
    font-size: 12px;
    font-weight: 600;
    color: var(--nebula-text-secondary, #64748b);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.widget-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    padding: 12px 16px;
}

.widget-item .menu-text {
    font-weight: 600;
    color: var(--nebula-text-primary, #1a202c);
}

.menu-description {
    font-size: 12px;
    color: var(--nebula-text-secondary, #64748b);
    line-height: 1.3;
}

/* Dark theme support */
[data-theme="dark"] .desktop-context-menu,
[data-theme="dark"] .widgets-submenu {
    background: var(--nebula-surface, #2d3748);
    border-color: var(--nebula-border, #4a5568);
    color: var(--nebula-text-primary, #e2e8f0);
}

[data-theme="dark"] .context-menu-item:hover,
[data-theme="dark"] .context-menu-item.submenu-trigger.active {
    background: var(--nebula-surface-hover, #4a5568);
}
</style>
`;

// Inject styles
if (!document.getElementById('widget-context-menu-styles')) {
    document.head.insertAdjacentHTML('beforeend', contextMenuStyles);
}

// Initialize the enhanced widget integration
const enhancedWidgetIntegration = new EnhancedWidgetIntegration();

console.log('✅ Enhanced Widget Integration loaded!');