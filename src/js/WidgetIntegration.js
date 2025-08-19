// Simplified WidgetIntegration.js - Desktop Right-Click Only (Widgets Self-Manage)
console.log('🚀 Starting Simplified Widget Integration...');

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
                version: '2.0.0'
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

// Simplified Widget Integration - Only Desktop Context Menu
class SimplifiedWidgetIntegration {
    constructor() {
        this.contextMenu = null;
        this.currentX = 0;
        this.currentY = 0;
        this.devPanel = null;
        
        this.init();
    }

    async init() {
        await waitForWidgetSystem();
        console.log('🧩 Simplified Widget Integration initializing...');
        
        this.setupDesktopRightClick();
        this.createDevPanel();
        this.setupConsoleCommands();
        
        console.log('✅ Simplified Widget System Integration complete!');
        console.log('📋 Widgets now self-manage with right-click context menus');
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

    handleDesktopRightClick = (e) => {
        // Only handle right-clicks on the desktop itself
        if (e.target.closest('.nebula-widget-wrapper') || 
            e.target.closest('.window') || 
            e.target.closest('.taskbar') ||
            e.target.closest('.launcher')) {
            return; // Let widgets handle their own context menus
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
        
        console.log('📋 Creating desktop context menu with', registeredWidgets.length, 'registered widgets');
        
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
            min-width: 280px;
            max-width: 350px;
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            color: var(--nebula-text-primary, #1a202c);
            backdrop-filter: blur(10px);
            animation: contextMenuFadeIn 0.2s ease;
        `;

        let menuHTML = '';
        
        // Header
        menuHTML += `
            <div class="context-menu-header">
                <span class="menu-icon">🧩</span>
                <span class="menu-title">Create Widgets</span>
            </div>
            <div class="context-menu-separator"></div>
        `;
        
        // Widgets section
        if (registeredWidgets.length > 0) {
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
                        <div class="context-menu-item widget-menu-item">
                            <div class="widget-info" data-action="create-widget" data-widget-id="${widget.id}">
                                <span class="menu-icon">${widget.icon}</span>
                                <div class="widget-details">
                                    <span class="menu-text">${widget.name}</span>
                                    <span class="menu-description">${widget.description}</span>
                                </div>
                            </div>
                            <div class="widget-mode-buttons">
                                <button class="mode-btn titlebar-btn" data-action="create-titlebar" data-widget-id="${widget.id}" title="Create with titlebar">
                                    🪟
                                </button>
                                <button class="mode-btn minimal-btn" data-action="create-minimal" data-widget-id="${widget.id}" title="Create minimal">
                                    ◽
                                </button>
                            </div>
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
            const target = e.target;
            const item = target.closest('.context-menu-item');
            if (!item) return;
            
            const action = target.dataset.action || item.dataset.action;
            const widgetId = target.dataset.widgetId || item.dataset.widgetId;
            
            console.log('📋 Desktop context menu action:', action, widgetId);
            
            this.handleContextMenuAction(action, widgetId);
            this.hideContextMenu();
        });
    }

    handleContextMenuAction(action, widgetId) {
        switch (action) {
            case 'create-widget':
                this.createWidgetAtPosition(widgetId, { showTitlebar: true });
                break;
            case 'create-titlebar':
                this.createWidgetAtPosition(widgetId, { showTitlebar: true });
                break;
            case 'create-minimal':
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
                console.log('Unknown desktop action:', action);
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
        
        alert(`Widget Debug:\n\nRegistered: ${registered.length}\nActive: ${active.length}\n\nWidgets self-manage with right-click!\nCheck console for details.`);
    }

    listActiveWidgets() {
        const activeWidgets = window.widgetSystem.getActiveWidgets();
        console.log('📋 Active widgets:', activeWidgets);
        
        if (activeWidgets.length === 0) {
            alert('No active widgets');
            return;
        }
        
        const list = activeWidgets.map(w => `• ${w.type} (ID: ${w.id}) at (${w.x}, ${w.y})`).join('\n');
        alert(`Active Widgets (${activeWidgets.length}):\n\n${list}\n\nTip: Right-click any widget to move/remove it!`);
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
            max-width: 320px;
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
                🧩 Self-Managing Widgets
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
                <strong>Self-Managing Widgets:</strong><br>
                • Right-click desktop: Create widgets<br>
                • Right-click widget: Move/remove/settings<br>
                • Widgets manage their own context menus!
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

        console.log('📋 Simplified console commands:');
        console.log('• createTestClock(x, y, minimal) - Create clock widget');
        console.log('• createTestLauncher(x, y, minimal) - Create launcher widget');
        console.log('• listWidgets() - List all widgets');
        console.log('• clearAllWidgets() - Remove all widgets');
        console.log('• debugWidgetSystem() - Debug widget system');
        console.log('• Right-click desktop: Create widgets');
        console.log('• Right-click widgets: Self-managed context menus!');
    }
}

// Simplified CSS styles for desktop context menu only
const simplifiedContextMenuStyles = `
<style id="simplified-widget-context-menu-styles">
@keyframes contextMenuFadeIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
}

.desktop-context-menu {
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
    cursor: pointer;
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

.widget-mode-buttons {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
}

.mode-btn {
    background: var(--nebula-primary, #667eea);
    color: white;
    border: none;
    padding: 6px 8px;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 32px;
    text-align: center;
}

.mode-btn:hover {
    transform: scale(1.05);
}

.titlebar-btn {
    background: var(--nebula-primary, #667eea);
}

.titlebar-btn:hover {
    background: var(--nebula-primary-hover, #5a67d8);
}

.minimal-btn {
    background: var(--nebula-secondary, #764ba2);
}

.minimal-btn:hover {
    background: var(--nebula-secondary-hover, #5a2d91);
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
[data-theme="dark"] .desktop-context-menu {
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

[data-theme="dark"] .submenu-category-header {
    background: var(--nebula-bg-secondary, #1e293b);
}

[data-theme="dark"] .mode-btn {
    background: var(--nebula-primary, #667eea);
}

[data-theme="dark"] .minimal-btn {
    background: var(--nebula-secondary, #764ba2);
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
    
    .mode-btn {
        padding: 4px 6px;
        font-size: 11px;
        min-width: 28px;
    }
}
</style>
`;

// Inject simplified styles
if (!document.getElementById('simplified-widget-context-menu-styles')) {
    document.head.insertAdjacentHTML('beforeend', simplifiedContextMenuStyles);
}

// Initialize the simplified widget integration
const simplifiedWidgetIntegration = new SimplifiedWidgetIntegration();

console.log('✅ Simplified Widget Integration loaded!');
console.log('🎯 Widgets now self-manage with right-click context menus');
console.log('📋 Desktop right-click creates widgets with mode buttons');