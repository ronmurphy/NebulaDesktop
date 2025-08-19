// Improved Widget Menu System - Inline Mode Buttons & Widget Move Mode
console.log('🚀 Starting Improved Widget Integration...');

// Force clock widget registration if missing
function ensureClockWidgetRegistered() {
    if (!window.NebulaClock) {
        console.warn('⚠️ NebulaClock class not found! Check if NebulaClock.js is loaded.');
        return false;
    }
    
    if (!window.widgetSystem) {
        console.warn('⚠️ Widget system not ready yet');
        return false;
    }
    
    const registered = window.widgetSystem.getRegisteredWidgets();
    const clockExists = registered.find(w => w.id === 'clock');
    
    if (!clockExists) {
        console.log('🔧 Clock widget not registered, registering now...');
        try {
            window.widgetSystem.registerWidget('clock', {
                name: 'Digital Clock',
                description: 'A digital clock widget with date display',
                category: 'system',
                icon: '🕒',
                widgetClass: window.NebulaClock,
                defaultConfig: {
                    format: '24h',
                    showSeconds: true,
                    showDate: true,
                    showTitlebar: true,
                    x: 100,
                    y: 100
                },
                author: 'NebulaDesktop',
                version: '1.0.0'
            });
            console.log('✅ Clock widget registered successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to register clock widget:', error);
            return false;
        }
    }
    
    console.log('✅ Clock widget already registered');
    return true;
}

// Wait for widget system to be ready
function waitForWidgetSystem() {
    return new Promise((resolve) => {
        if (window.NebulaWidgetSystem && window.widgetSystem) {
            setTimeout(() => {
                ensureClockWidgetRegistered();
                resolve();
            }, 100);
        } else {
            setTimeout(() => waitForWidgetSystem().then(resolve), 100);
        }
    });
}

// Widget Move Mode Manager
class WidgetMoveManager {
    constructor() {
        this.moveMode = false;
        this.movingWidget = null;
        this.originalCursor = null;
        this.mouseMoveHandler = null;
        this.clickHandler = null;
    }

    startMoveMode(widgetElement, widgetId) {
        if (this.moveMode) {
            this.stopMoveMode();
            return;
        }

        console.log('🔄 Starting move mode for widget:', widgetId);
        
        this.moveMode = true;
        this.movingWidget = { element: widgetElement, id: widgetId };
        this.originalCursor = document.body.style.cursor;
        
        // Change cursor and add visual feedback
        document.body.style.cursor = 'move';
        widgetElement.style.opacity = '0.8';
        widgetElement.style.transform = 'scale(1.02)';
        widgetElement.style.zIndex = '1999';
        
        // Add move overlay
        this.createMoveOverlay();
        
        // Set up mouse handlers
        this.mouseMoveHandler = (e) => this.handleMouseMove(e);
        this.clickHandler = (e) => this.handleClick(e);
        
        document.addEventListener('mousemove', this.mouseMoveHandler);
        document.addEventListener('click', this.clickHandler);
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.stopMoveMode();
        });
        
        // Prevent all clicks on the moving widget
        widgetElement.style.pointerEvents = 'none';
    }

    createMoveOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'widget-move-overlay';
        overlay.style.cssText = `
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
            <div style="font-weight: 600; margin-bottom: 4px;">🔄 Widget Move Mode</div>
            <div style="font-size: 12px; color: var(--nebula-text-secondary, #64748b);">
                Click anywhere to place widget • Press Escape to cancel
            </div>
        `;
        
        overlay.appendChild(instructions);
        document.body.appendChild(overlay);
    }

    handleMouseMove(e) {
        if (!this.movingWidget) return;
        
        const widget = this.movingWidget.element;
        const rect = widget.getBoundingClientRect();
        
        // Update widget position to follow mouse
        widget.style.left = (e.clientX - rect.width / 2) + 'px';
        widget.style.top = (e.clientY - rect.height / 2) + 'px';
    }

    handleClick(e) {
        if (!this.movingWidget) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const widget = this.movingWidget.element;
        const newX = e.clientX - widget.offsetWidth / 2;
        const newY = e.clientY - widget.offsetHeight / 2;
        
        // Update widget position in the system
        if (window.widgetSystem) {
            const activeWidgets = window.widgetSystem.getActiveWidgets();
            const widgetData = activeWidgets.find(w => w.id === this.movingWidget.id);
            if (widgetData) {
                widgetData.x = newX;
                widgetData.y = newY;
            }
        }
        
        console.log(`📍 Widget ${this.movingWidget.id} moved to (${newX}, ${newY})`);
        this.stopMoveMode();
    }

    stopMoveMode() {
        if (!this.moveMode) return;
        
        console.log('🔄 Stopping move mode');
        
        this.moveMode = false;
        
        // Restore cursor
        document.body.style.cursor = this.originalCursor || '';
        
        // Restore widget appearance
        if (this.movingWidget) {
            const widget = this.movingWidget.element;
            widget.style.opacity = '';
            widget.style.transform = '';
            widget.style.zIndex = '';
            widget.style.pointerEvents = '';
        }
        
        // Remove overlay
        const overlay = document.getElementById('widget-move-overlay');
        if (overlay) overlay.remove();
        
        // Remove event listeners
        if (this.mouseMoveHandler) {
            document.removeEventListener('mousemove', this.mouseMoveHandler);
            this.mouseMoveHandler = null;
        }
        if (this.clickHandler) {
            document.removeEventListener('click', this.clickHandler);
            this.clickHandler = null;
        }
        
        this.movingWidget = null;
    }
}

// Improved Widget Integration
class ImprovedWidgetIntegration {
    constructor() {
        this.contextMenu = null;
        this.currentX = 0;
        this.currentY = 0;
        this.devPanel = null;
        this.moveManager = new WidgetMoveManager();
        
        this.init();
    }

    async init() {
        await waitForWidgetSystem();
        console.log('🧩 Improved Widget Integration initializing...');
        
        this.setupDesktopRightClick();
        this.setupWidgetRightClick();
        this.createDevPanel();
        this.setupConsoleCommands();
        
        console.log('✅ Improved Widget System Integration complete!');
    }

    setupDesktopRightClick() {
        console.log('🖱️ Setting up desktop right-click context menu...');
        
        const desktop = document.getElementById('desktop') || document.body;
        desktop.removeEventListener('contextmenu', this.handleDesktopRightClick);
        desktop.addEventListener('contextmenu', (e) => this.handleDesktopRightClick(e));
        
        document.addEventListener('click', () => this.hideContextMenu());
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.hideContextMenu();
        });
    }

    setupWidgetRightClick() {
        // Set up right-click handlers for widgets (for move mode)
        document.addEventListener('contextmenu', (e) => {
            const widgetWrapper = e.target.closest('.nebula-widget-wrapper');
            if (widgetWrapper) {
                e.preventDefault();
                e.stopPropagation();
                this.showWidgetContextMenu(e, widgetWrapper);
            }
        });
    }

    showWidgetContextMenu(e, widgetWrapper) {
        const widgetId = widgetWrapper.dataset.widgetId || widgetWrapper.id;
        
        this.hideContextMenu();
        
        this.contextMenu = document.createElement('div');
        this.contextMenu.className = 'widget-context-menu';
        this.contextMenu.style.cssText = `
            position: fixed;
            left: ${e.clientX}px;
            top: ${e.clientY}px;
            background: var(--nebula-surface, #ffffff);
            border: 1px solid var(--nebula-border, #e2e8f0);
            border-radius: var(--nebula-radius-md, 8px);
            box-shadow: var(--nebula-shadow-lg, 0 8px 32px rgba(0, 0, 0, 0.15));
            padding: 8px 0;
            min-width: 180px;
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            color: var(--nebula-text-primary, #1a202c);
            backdrop-filter: blur(10px);
            animation: contextMenuFadeIn 0.2s ease;
        `;

        this.contextMenu.innerHTML = `
            <div class="context-menu-item" data-action="move-widget" data-widget-id="${widgetId}">
                <span class="menu-icon">🔄</span>
                <span class="menu-text">Move Widget</span>
            </div>
            <div class="context-menu-separator"></div>
            <div class="context-menu-item" data-action="remove-widget" data-widget-id="${widgetId}">
                <span class="menu-icon">🗑️</span>
                <span class="menu-text">Remove Widget</span>
            </div>
        `;

        this.contextMenu.addEventListener('click', (e) => {
            const item = e.target.closest('.context-menu-item');
            if (!item) return;
            
            const action = item.dataset.action;
            const targetWidgetId = item.dataset.widgetId;
            
            if (action === 'move-widget') {
                this.moveManager.startMoveMode(widgetWrapper, targetWidgetId);
            } else if (action === 'remove-widget') {
                if (confirm('Remove this widget?')) {
                    window.widgetSystem.removeWidget(targetWidgetId);
                }
            }
            
            this.hideContextMenu();
        });

        document.body.appendChild(this.contextMenu);
        this.positionContextMenu(e.clientX, e.clientY);
    }

    handleDesktopRightClick = (e) => {
        // Only handle right-clicks on the desktop itself
        if (e.target.closest('.nebula-widget-wrapper') || 
            e.target.closest('.window') || 
            e.target.closest('.taskbar') ||
            e.target.closest('.launcher')) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();
        
        this.currentX = e.clientX;
        this.currentY = e.clientY;
        
        console.log('🖱️ Desktop right-click at:', this.currentX, this.currentY);
        this.showDesktopContextMenu(e.clientX, e.clientY);
    }

    showDesktopContextMenu(x, y) {
        this.hideContextMenu();
        
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
            min-width: 250px;
            max-width: 350px;
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            color: var(--nebula-text-primary, #1a202c);
            backdrop-filter: blur(10px);
            animation: contextMenuFadeIn 0.2s ease;
        `;

        let menuHTML = '';
        
        // Widgets section
        if (registeredWidgets.length > 0) {
            menuHTML += `
                <div class="submenu-header">
                    <span class="submenu-title">🧩 Create Widgets</span>
                </div>
                <div class="context-menu-separator"></div>
            `;
            
            // Group widgets by category
            const categorizedWidgets = this.categorizeWidgets(registeredWidgets);
            
            Object.keys(categorizedWidgets).sort().forEach(category => {
                menuHTML += `
                    <div class="submenu-category-header">
                        <span class="category-text">${category}</span>
                    </div>
                `;
                
                categorizedWidgets[category].forEach(widget => {
                    menuHTML += `
                        <div class="context-menu-item widget-menu-item" data-action="create-widget" data-widget-id="${widget.id}">
                            <div class="widget-info">
                                <span class="menu-icon">${widget.icon}</span>
                                <div class="widget-details">
                                    <span class="menu-text">${widget.name}</span>
                                    <span class="menu-description">${widget.description}</span>
                                </div>
                            </div>
                            <button class="minimal-btn" data-action="create-widget-minimal" data-widget-id="${widget.id}" onclick="event.stopPropagation();">
                                minimal
                            </button>
                        </div>
                    `;
                });
                
                // Add separator after category (except last)
                const categoryIndex = Object.keys(categorizedWidgets).indexOf(category);
                if (categoryIndex < Object.keys(categorizedWidgets).length - 1) {
                    menuHTML += `<div class="context-menu-separator"></div>`;
                }
            });
        }
        
        menuHTML += `<div class="context-menu-separator"></div>`;
        
        // Widget management
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
            <div class="context-menu-item" data-action="debug-widgets">
                <span class="menu-icon">🔍</span>
                <span class="menu-text">Debug Widget System</span>
            </div>
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
        this.setupContextMenuEvents();
        this.positionContextMenu(x, y);
        
        document.body.appendChild(this.contextMenu);
    }

    categorizeWidgets(widgets) {
        const categorized = {};
        widgets.forEach(widget => {
            const category = widget.category || 'Other';
            if (!categorized[category]) {
                categorized[category] = [];
            }
            categorized[category].push(widget);
        });
        return categorized;
    }

    setupContextMenuEvents() {
        this.contextMenu.addEventListener('click', (e) => {
            const item = e.target.closest('.context-menu-item');
            if (!item) return;
            
            const action = item.dataset.action;
            const widgetId = item.dataset.widgetId;
            
            console.log('📋 Context menu action:', action, widgetId);
            
            // Handle minimal button clicks
            if (e.target.classList.contains('minimal-btn')) {
                this.createWidgetAtPosition(widgetId, { showTitlebar: false });
                this.hideContextMenu();
                return;
            }
            
            this.handleContextMenuAction(action, widgetId);
            this.hideContextMenu();
        });
    }

    handleContextMenuAction(action, widgetId) {
        switch (action) {
            case 'create-widget':
                this.createWidgetAtPosition(widgetId, { showTitlebar: true });
                break;
            case 'create-widget-minimal':
                this.createWidgetAtPosition(widgetId, { showTitlebar: false });
                break;
            case 'list-widgets':
                this.listActiveWidgets();
                break;
            case 'clear-widgets':
                this.clearAllWidgets();
                break;
            case 'debug-widgets':
                this.debugWidgetSystem();
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

    createWidgetAtPosition(widgetId, config = {}) {
        console.log('🧩 Creating widget:', widgetId, 'with config:', config);
        
        try {
            const instanceId = window.widgetSystem.createWidget(widgetId, {
                x: this.currentX - 50,
                y: this.currentY - 25,
                ...config
            });
            
            console.log('✅ Widget created successfully:', instanceId);
        } catch (error) {
            console.error('❌ Failed to create widget:', error);
            alert(`Failed to create widget: ${error.message}`);
        }
    }

    debugWidgetSystem() {
        console.log('🔍 Widget System Debug Report');
        console.log('=====================================');
        
        const registered = window.widgetSystem.getRegisteredWidgets();
        const active = window.widgetSystem.getActiveWidgets();
        
        console.log('Registered widgets:', registered.length);
        registered.forEach(w => console.log(`  - ${w.id}: ${w.name} (${w.category})`));
        
        console.log('Active widgets:', active.length);
        active.forEach(w => console.log(`  - ${w.id}: ${w.type} at (${w.x}, ${w.y})`));
        
        console.log('Widget classes available:');
        console.log(`  - NebulaClock: ${typeof window.NebulaClock}`);
        console.log(`  - NebulaLauncher: ${typeof window.NebulaLauncher}`);
        
        // Force re-registration if clock is missing
        ensureClockWidgetRegistered();
        
        alert(`Widget Debug:\n\nRegistered: ${registered.length}\nActive: ${active.length}\n\nCheck console for details.`);
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
        
        if (x + rect.width > windowWidth) {
            menu.style.left = (windowWidth - rect.width - 10) + 'px';
        }
        
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
        if (document.getElementById('widget-dev-panel')) {
            this.devPanel = document.getElementById('widget-dev-panel');
            return;
        }
        
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
            max-width: 300px;
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
            <div style="font-weight: bold; margin-bottom: 8px; color: var(--nebula-primary, #667eea); display: flex; align-items: center; gap: 8px;">
                🧩 Widget System Dev
                <button onclick="window.debugWidgetSystem()" style="padding: 2px 6px; font-size: 10px; background: var(--nebula-danger, #ef4444); color: white; border: none; border-radius: 3px; cursor: pointer;">
                    Debug
                </button>
            </div>
            <div style="margin-bottom: 8px; font-size: 11px;">
                Registered: ${registered.length} • Active: ${active.length}
            </div>
            <div style="display: flex; flex-direction: column; gap: 4px;">
                ${registered.map(w => `
                    <div style="display: flex; gap: 4px; align-items: center;">
                        <button onclick="window.widgetSystem.createWidget('${w.id}', {x: 100, y: 100, showTitlebar: true})" 
                                style="flex: 1; padding: 4px 8px; background: var(--nebula-primary, #667eea); color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 10px; text-align: left;">
                            ${w.icon} ${w.name}
                        </button>
                        <button onclick="window.widgetSystem.createWidget('${w.id}', {x: 200, y: 100, showTitlebar: false})" 
                                style="padding: 4px 6px; background: var(--nebula-secondary, #764ba2); color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 9px;" title="Minimal Mode">
                            min
                        </button>
                    </div>
                `).join('')}
            </div>
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--nebula-border, #e2e8f0); font-size: 9px; color: var(--nebula-text-secondary, #64748b); line-height: 1.3;">
                Right-click desktop: Create widgets<br>
                Right-click widget: Move/remove<br>
                Left btn: Titlebar • Right btn: Minimal
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
        window.createTestClock = (x = 100, y = 100, minimal = false) => {
            try {
                const instanceId = window.widgetSystem.createWidget('clock', { 
                    x, y, showTitlebar: !minimal 
                });
                console.log('✅ Test clock created:', instanceId);
                return instanceId;
            } catch (error) {
                console.error('❌ Failed to create clock:', error);
            }
        };

        window.createTestLauncher = (x = 200, y = 200, minimal = false) => {
            try {
                const instanceId = window.widgetSystem.createWidget('launcher', { 
                    x, y, showTitlebar: !minimal 
                });
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

        window.debugWidgetSystem = () => {
            this.debugWidgetSystem();
        };

        window.startWidgetMoveMode = (widgetId) => {
            const widgetWrapper = document.querySelector(`[data-widget-id="${widgetId}"]`);
            if (widgetWrapper) {
                this.moveManager.startMoveMode(widgetWrapper, widgetId);
            }
        };

        console.log('📋 Improved console commands:');
        console.log('• createTestClock(x, y, minimal) - Create clock widget');
        console.log('• createTestLauncher(x, y, minimal) - Create launcher widget');
        console.log('• listWidgets() - List all widgets');
        console.log('• clearAllWidgets() - Remove all widgets');
        console.log('• debugWidgetSystem() - Debug widget system');
        console.log('• startWidgetMoveMode(widgetId) - Start move mode for widget');
        console.log('• Right-click desktop: Create widgets with inline minimal buttons');
        console.log('• Right-click widget: Move/remove widget');
    }
}

// Enhanced CSS styles for improved system
const improvedContextMenuStyles = `
<style id="improved-widget-context-menu-styles">
@keyframes contextMenuFadeIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
}

.desktop-context-menu, .widget-context-menu {
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

.widget-menu-item {
    padding: 10px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}

.widget-info {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;
}

.widget-details {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    flex: 1;
}

.menu-text {
    font-weight: 500;
    color: var(--nebula-text-primary, #1a202c);
    font-size: 14px;
}

.menu-description {
    font-size: 12px;
    color: var(--nebula-text-secondary, #64748b);
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.minimal-btn {
    background: var(--nebula-secondary, #764ba2);
    color: white;
    border: none;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
    text-transform: lowercase;
}

.minimal-btn:hover {
    background: var(--nebula-secondary-hover, #5a2d91);
    transform: scale(1.05);
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

.submenu-header {
    padding: 8px 16px;
    background: var(--nebula-surface-secondary, #f8fafc);
    border-bottom: 1px solid var(--nebula-border, #e2e8f0);
    margin: -8px -0 8px 0;
    border-radius: var(--nebula-radius-md, 8px) var(--nebula-radius-md, 8px) 0 0;
}

.submenu-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--nebula-text-primary, #1a202c);
}

.submenu-category-header {
    padding: 6px 16px 4px 16px;
    font-size: 11px;
    font-weight: 600;
    color: var(--nebula-text-secondary, #64748b);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    background: var(--nebula-bg-secondary, #f8fafc);
}

/* Dark theme support */
[data-theme="dark"] .desktop-context-menu,
[data-theme="dark"] .widget-context-menu {
    background: var(--nebula-surface, #2d3748);
    border-color: var(--nebula-border, #4a5568);
    color: var(--nebula-text-primary, #e2e8f0);
}

[data-theme="dark"] .context-menu-item:hover {
    background: var(--nebula-surface-hover, #4a5568);
}

[data-theme="dark"] .submenu-header {
    background: var(--nebula-surface-secondary, #1e293b);
    border-color: var(--nebula-border, #4a5568);
}

[data-theme="dark"] .submenu-category-header {
    background: var(--nebula-bg-secondary, #1e293b);
}

[data-theme="dark"] .minimal-btn {
    background: var(--nebula-secondary, #764ba2);
}

[data-theme="dark"] .minimal-btn:hover {
    background: var(--nebula-secondary-hover, #5a2d91);
}

/* Move mode overlay styles */
#widget-move-overlay {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Responsive design */
@media (max-width: 768px) {
    .desktop-context-menu {
        min-width: 200px;
        max-width: 90vw;
    }
    
    .widget-menu-item {
        padding: 12px 16px;
    }
    
    .menu-description {
        display: none;
    }
}

/* Animation for move mode */
.widget-moving {
    transition: none !important;
    opacity: 0.8;
    transform: scale(1.02);
    z-index: 1999 !important;
}
</style>
`;

// Inject improved styles
if (!document.getElementById('improved-widget-context-menu-styles')) {
    document.head.insertAdjacentHTML('beforeend', improvedContextMenuStyles);
}

// Initialize the improved widget integration
const improvedWidgetIntegration = new ImprovedWidgetIntegration();

console.log('✅ Improved Widget Integration loaded!');