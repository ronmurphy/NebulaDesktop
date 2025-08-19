// NebulaLauncher.js - Fixed Registration and Widget Creation
class NebulaLauncher extends NebulaWidget {
    constructor(config = {}) {
        super(config);
        this.showTitlebar = config.showTitlebar !== false;
        this.viewMode = config.viewMode || 'grid'; // 'grid', 'list', 'tile'
        this.launcherVisible = false;
        this.settingsMenuVisible = false;
        this.searchQuery = '';
        this.filteredApps = [];
        
        // Get apps from existing launcher data
        this.apps = this.getAvailableApps();
    }

    init() {
        console.log('🚀 Initializing NebulaLauncher widget');
    }

    render() {
        console.log('🚀 Rendering NebulaLauncher widget');
        
        const launcherWidget = document.createElement('div');
        launcherWidget.className = this.showTitlebar ? 
            'nebula-launcher-widget' : 
            'nebula-launcher-widget minimal';
        
        this.element = launcherWidget;

        if (this.showTitlebar) {
            launcherWidget.innerHTML = `
                <div class="widget-header">
                    <span class="widget-icon">🚀</span>
                    <span class="widget-title">Launcher</span>
                    <div class="widget-controls">
                        <button class="widget-control-btn" data-action="settings" title="Settings">⚙️</button>
                        <button class="widget-control-btn" data-action="close" title="Close">×</button>
                    </div>
                </div>
                <div class="launcher-display">
                    <button class="launcher-button" data-action="launch">
                        <span class="launcher-icon">🚀</span>
                        <span class="launcher-text">Apps</span>
                    </button>
                </div>
                <div class="settings-menu" id="settings-menu-${this.id}" style="display: none;">
                    <div class="settings-menu-item" data-action="view-grid">
                        <span class="menu-icon">⊞</span>
                        <span class="menu-text">Grid View</span>
                        <span class="menu-check">${this.viewMode === 'grid' ? '✓' : ''}</span>
                    </div>
                    <div class="settings-menu-item" data-action="view-list">
                        <span class="menu-icon">☰</span>
                        <span class="menu-text">List View</span>
                        <span class="menu-check">${this.viewMode === 'list' ? '✓' : ''}</span>
                    </div>
                    <div class="settings-menu-item" data-action="view-tile">
                        <span class="menu-icon">⊡</span>
                        <span class="menu-text">Tile View</span>
                        <span class="menu-check">${this.viewMode === 'tile' ? '✓' : ''}</span>
                    </div>
                    <div class="settings-menu-separator"></div>
                    <div class="settings-menu-item" data-action="widget-config">
                        <span class="menu-icon">🎨</span>
                        <span class="menu-text">Widget Properties</span>
                        <span class="menu-arrow">→</span>
                    </div>
                </div>
            `;
        } else {
            launcherWidget.innerHTML = `
                <div class="launcher-display minimal">
                    <div class="minimal-controls">
                        <button class="minimal-control-btn" data-action="settings" title="Settings">⚙️</button>
                        <button class="minimal-control-btn" data-action="close" title="Close">×</button>
                    </div>
                    <button class="launcher-button minimal" data-action="launch">
                        <span class="launcher-icon">🚀</span>
                        <span class="launcher-text">Apps</span>
                    </button>
                </div>
                <div class="settings-menu minimal" id="settings-menu-${this.id}" style="display: none;">
                    <div class="settings-menu-item" data-action="view-grid">
                        <span class="menu-icon">⊞</span>
                        <span class="menu-text">Grid View</span>
                        <span class="menu-check">${this.viewMode === 'grid' ? '✓' : ''}</span>
                    </div>
                    <div class="settings-menu-item" data-action="view-list">
                        <span class="menu-icon">☰</span>
                        <span class="menu-text">List View</span>
                        <span class="menu-check">${this.viewMode === 'list' ? '✓' : ''}</span>
                    </div>
                    <div class="settings-menu-item" data-action="view-tile">
                        <span class="menu-icon">⊡</span>
                        <span class="menu-text">Tile View</span>
                        <span class="menu-check">${this.viewMode === 'tile' ? '✓' : ''}</span>
                    </div>
                    <div class="settings-menu-separator"></div>
                    <div class="settings-menu-item" data-action="widget-config">
                        <span class="menu-icon">🎨</span>
                        <span class="menu-text">Widget Properties</span>
                        <span class="menu-arrow">→</span>
                    </div>
                </div>
            `;
        }

        this.setupEventListeners(launcherWidget);
        
        console.log('🚀 Launcher widget rendered successfully', {
            id: this.id,
            titlebar: this.showTitlebar,
            viewMode: this.viewMode,
            appsCount: this.apps.length
        });

        return launcherWidget;
    }

    setupEventListeners(element) {
        element.addEventListener('click', (e) => {
            const action = e.target.closest('[data-action]')?.dataset.action;
            
            if (action === 'close') {
                this.handleClose();
            } else if (action === 'settings') {
                this.toggleSettingsMenu();
            } else if (action === 'launch') {
                this.showLauncher();
            } else if (action && action.startsWith('view-')) {
                const newMode = action.replace('view-', '');
                this.setViewMode(newMode);
            } else if (action === 'widget-config') {
                this.openWidgetConfig();
                this.hideSettingsMenu();
            }
        });

        // Close settings menu when clicking outside
        document.addEventListener('click', (e) => {
            if (this.element && !this.element.contains(e.target) && this.settingsMenuVisible) {
                this.hideSettingsMenu();
            }
        });

        // Close launcher when clicking outside
        document.addEventListener('click', (e) => {
            if (this.launcherVisible && !e.target.closest('.launcher-overlay')) {
                this.hideLauncher();
            }
        });

        // Escape key to close launcher
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.launcherVisible) {
                this.hideLauncher();
            }
        });
    }

    getAvailableApps() {
        // Try to get apps from existing launcher or use defaults
        const defaultApps = [
            { id: 'browser', name: 'Browser', icon: '🌐', category: 'internet', tags: ['web', 'internet', 'browser'] },
            { id: 'filemanager', name: 'Files', icon: '📁', category: 'system', tags: ['files', 'folder', 'manager'] },
            { id: 'terminal', name: 'Terminal', icon: '💻', category: 'system', tags: ['terminal', 'console', 'shell'] },
            { id: 'calculator', name: 'Calculator', icon: '🧮', category: 'utility', tags: ['calc', 'math', 'calculator'] },
            { id: 'settings', name: 'Settings', icon: '⚙️', category: 'system', tags: ['settings', 'config', 'preferences'] },
            { id: 'code-assistant', name: 'Code Assistant', icon: '🛠️', category: 'development', tags: ['code', 'dev', 'programming'] },
            { id: 'art-assistant', name: 'Art Assistant', icon: '🎨', category: 'creativity', tags: ['art', 'design', 'creative'] },
            { id: 'assistant', name: 'AI Assistant', icon: '🤖', category: 'productivity', tags: ['ai', 'assistant', 'help'] }
        ];

        // Try to get from global apps if available
        if (window.nebulaApps && Array.isArray(window.nebulaApps)) {
            return window.nebulaApps;
        }

        return defaultApps;
    }

    showLauncher() {
        console.log('🚀 Showing launcher overlay');
        this.hideSettingsMenu();
        
        // Create launcher overlay
        const overlay = document.createElement('div');
        overlay.className = 'launcher-overlay';
        overlay.innerHTML = `
            <div class="launcher-modal">
                <div class="launcher-header">
                    <h2>Applications</h2>
                    <button class="close-launcher" data-action="close-launcher">×</button>
                </div>
                <div class="search-container">
                    <input type="text" class="search-input" placeholder="Search applications..." 
                           autocomplete="off" spellcheck="false">
                </div>
                <div class="launcher-content ${this.viewMode}" id="launcher-content-${this.id}">
                    ${this.renderApps()}
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        this.launcherVisible = true;

        // Focus search input
        const searchInput = overlay.querySelector('.search-input');
        searchInput.focus();

        // Set up search functionality
        searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.updateLauncherContent();
        });

        // Set up app launch handling
        overlay.addEventListener('click', (e) => {
            const appItem = e.target.closest('.app-item');
            if (appItem) {
                const appId = appItem.dataset.appId;
                this.launchApp(appId);
                this.hideLauncher();
            }
            
            if (e.target.closest('[data-action="close-launcher"]')) {
                this.hideLauncher();
            }
        });
    }

    hideLauncher() {
        const overlay = document.querySelector('.launcher-overlay');
        if (overlay) {
            overlay.remove();
        }
        this.launcherVisible = false;
    }

    renderApps() {
        const filteredApps = this.searchQuery 
            ? this.apps.filter(app => 
                app.name.toLowerCase().includes(this.searchQuery) ||
                app.tags?.some(tag => tag.includes(this.searchQuery))
              )
            : this.apps;

        if (filteredApps.length === 0) {
            return '<div class="no-apps">No applications found</div>';
        }

        return filteredApps.map(app => `
            <div class="app-item ${this.viewMode}" data-app-id="${app.id}">
                <div class="app-icon">${app.icon}</div>
                <div class="app-name">${app.name}</div>
            </div>
        `).join('');
    }

    updateLauncherContent() {
        const content = document.getElementById(`launcher-content-${this.id}`);
        if (content) {
            content.innerHTML = this.renderApps();
        }
    }

    launchApp(appId) {
        console.log('🚀 Launching app:', appId);
        
        // Try to launch via window manager
        if (window.windowManager && window.windowManager.openApp) {
            window.windowManager.openApp(appId);
        } else if (window.openApp) {
            window.openApp(appId);
        } else {
            console.warn('No app launcher function found for:', appId);
        }
    }

    toggleSettingsMenu() {
        const menu = this.element.querySelector(`#settings-menu-${this.id}`);
        if (menu) {
            this.settingsMenuVisible = !this.settingsMenuVisible;
            menu.style.display = this.settingsMenuVisible ? 'block' : 'none';
        }
    }

    hideSettingsMenu() {
        const menu = this.element.querySelector(`#settings-menu-${this.id}`);
        if (menu) {
            menu.style.display = 'none';
            this.settingsMenuVisible = false;
        }
    }

    setViewMode(mode) {
        this.viewMode = mode;
        this.hideSettingsMenu();
        
        // Update UI to reflect new mode
        const content = document.getElementById(`launcher-content-${this.id}`);
        if (content) {
            content.className = `launcher-content ${this.viewMode}`;
            this.updateLauncherContent();
        }

        // Update settings menu checks
        const menuItems = this.element.querySelectorAll('[data-action^="view-"]');
        menuItems.forEach(item => {
            const check = item.querySelector('.menu-check');
            if (check) {
                const actionMode = item.dataset.action.replace('view-', '');
                check.textContent = actionMode === this.viewMode ? '✓' : '';
            }
        });
    }

    openWidgetConfig() {
        console.log('🎨 Opening launcher widget config');
        alert('Launcher Widget Properties\n\n' +
              '• View Mode: ' + this.viewMode + '\n' +
              '• Position: Custom\n' +
              '• Search enabled: Yes\n' +
              '• Apps loaded: ' + this.apps.length + '\n\n' +
              '(Widget properties panel will be implemented soon)');
    }

    cleanup() {
        this.hideLauncher();
        console.log('🚀 NebulaLauncher cleaned up');
    }

    getTitle() {
        return 'App Launcher';
    }

    getIcon() {
        return '🚀';
    }
}

// CSS Styles for the Launcher Widget
const launcherWidgetStyles = `
<style id="nebula-launcher-styles">
.nebula-launcher-widget {
    background: var(--nebula-surface, #ffffff);
    border: 1px solid var(--nebula-border, #e2e8f0);
    border-radius: var(--nebula-radius-lg, 12px);
    box-shadow: var(--nebula-shadow-md, 0 4px 16px rgba(0, 0, 0, 0.1));
    min-width: 120px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    overflow: visible;
    transition: var(--nebula-transition, all 0.3s ease);
    position: relative;
    color: var(--nebula-text-primary, #1a202c);
}

.nebula-launcher-widget.minimal {
    min-width: 80px;
}

.launcher-display {
    padding: 12px;
    text-align: center;
}

.launcher-display.minimal {
    padding: 8px;
    position: relative;
}

.launcher-button {
    background: linear-gradient(135deg, var(--nebula-primary, #667eea), var(--nebula-secondary, #764ba2));
    border: none;
    color: white;
    padding: 12px 16px;
    border-radius: var(--nebula-radius-md, 8px);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.3s ease;
    min-height: 44px;
}

.launcher-button.minimal {
    padding: 8px 12px;
    font-size: 12px;
    min-height: 36px;
}

.launcher-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
}

.minimal-controls {
    position: absolute;
    top: 4px;
    right: 4px;
    display: none;
    gap: 2px;
    z-index: 10;
}

.nebula-launcher-widget.minimal:hover .minimal-controls {
    display: flex;
}

.minimal-control-btn {
    background: rgba(102, 126, 234, 0.1);
    border: none;
    color: var(--nebula-primary, #667eea);
    width: 20px;
    height: 20px;
    border-radius: 3px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    transition: all 0.2s ease;
}

.minimal-control-btn:hover {
    background: rgba(102, 126, 234, 0.2);
}

/* Launcher Overlay */
.launcher-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
}

.launcher-modal {
    background: var(--nebula-surface, #ffffff);
    border: 1px solid var(--nebula-border, #e2e8f0);
    border-radius: var(--nebula-radius-xl, 16px);
    box-shadow: 0 32px 64px rgba(0, 0, 0, 0.3);
    width: 80vw;
    max-width: 800px;
    max-height: 80vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.launcher-header {
    padding: 20px;
    border-bottom: 1px solid var(--nebula-border, #e2e8f0);
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.launcher-header h2 {
    margin: 0;
    font-size: 24px;
    font-weight: 700;
    color: var(--nebula-text-primary, #1a202c);
}

.close-launcher {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: var(--nebula-text-secondary, #64748b);
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s ease;
}

.close-launcher:hover {
    background: var(--nebula-surface-hover, #f1f5f9);
    color: var(--nebula-text-primary, #1a202c);
}

.search-container {
    padding: 20px;
    border-bottom: 1px solid var(--nebula-border, #e2e8f0);
}

.search-input {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid var(--nebula-border, #e2e8f0);
    border-radius: var(--nebula-radius-md, 8px);
    background: var(--nebula-bg-primary, #ffffff);
    color: var(--nebula-text-primary, #1a202c);
    font-size: 16px;
    outline: none;
    transition: all 0.2s ease;
}

.search-input:focus {
    border-color: var(--nebula-primary, #667eea);
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.launcher-content {
    padding: 20px;
    overflow-y: auto;
    flex: 1;
}

.launcher-content.grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 16px;
}

.launcher-content.list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.launcher-content.tile {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 12px;
}

.app-item {
    cursor: pointer;
    transition: all 0.3s ease;
    border-radius: var(--nebula-radius-md, 8px);
}

.app-item.grid {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 16px;
    text-align: center;
}

.app-item.grid:hover {
    background: var(--nebula-surface-hover, #f1f5f9);
    transform: translateY(-4px);
}

.app-item.grid .app-icon {
    font-size: 32px;
    margin-bottom: 8px;
}

.app-item.grid .app-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--nebula-text-primary, #1a202c);
}

.app-item.list {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    gap: 16px;
}

.app-item.list:hover {
    background: var(--nebula-surface-hover, #f1f5f9);
}

.app-item.list .app-icon {
    font-size: 24px;
}

.app-item.list .app-name {
    font-size: 16px;
    font-weight: 500;
    color: var(--nebula-text-primary, #1a202c);
}

.app-item.tile {
    display: flex;
    align-items: center;
    padding: 16px;
    border-radius: var(--nebula-radius-md, 8px);
    cursor: pointer;
    transition: all 0.3s ease;
    gap: 12px;
    border: 1px solid var(--nebula-border, #e2e8f0);
}

.app-item.tile:hover {
    background: var(--nebula-surface-hover, #f1f5f9);
    border-color: var(--nebula-primary, #667eea);
    transform: translateY(-1px);
}

.app-item.tile .app-icon {
    font-size: 28px;
}

.app-item.tile .app-name {
    font-size: 16px;
    font-weight: 500;
    color: var(--nebula-text-primary, #1a202c);
}

.no-apps {
    text-align: center;
    padding: 40px;
    color: var(--nebula-text-secondary, #64748b);
    font-size: 16px;
}

/* Settings menu styles */
.settings-menu {
    position: absolute;
    top: 100%;
    right: 0;
    background: var(--nebula-surface, #ffffff);
    border: 1px solid var(--nebula-border, #e2e8f0);
    border-radius: var(--nebula-radius-md, 8px);
    box-shadow: var(--nebula-shadow-lg, 0 8px 32px rgba(0, 0, 0, 0.15));
    min-width: 180px;
    z-index: 1000;
    overflow: hidden;
}

.settings-menu.minimal {
    top: auto;
    bottom: 100%;
    margin-bottom: 4px;
}

.settings-menu-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    cursor: pointer;
    transition: background-color 0.2s ease;
    font-size: 13px;
    color: var(--nebula-text-primary, #1a202c);
}

.settings-menu-item:hover {
    background: var(--nebula-surface-hover, #f1f5f9);
}

.menu-icon {
    font-size: 14px;
    width: 16px;
    text-align: center;
}

.menu-text {
    flex: 1;
}

.menu-check {
    font-size: 12px;
    color: var(--nebula-success, #10b981);
    font-weight: 600;
}

.menu-arrow {
    font-size: 12px;
    color: var(--nebula-text-secondary, #64748b);
}

.settings-menu-separator {
    height: 1px;
    background: var(--nebula-border, #e2e8f0);
    margin: 4px 0;
}

/* Widget header styles */
.widget-header {
    background: var(--nebula-primary, #667eea);
    color: white;
    padding: 8px 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: move;
    border-radius: var(--nebula-radius-lg, 12px) var(--nebula-radius-lg, 12px) 0 0;
}

.widget-icon {
    font-size: 16px;
}

.widget-title {
    flex: 1;
}

.widget-controls {
    display: flex;
    gap: 4px;
}

.widget-control-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    transition: background-color 0.2s ease;
}

.widget-control-btn:hover {
    background: rgba(255, 255, 255, 0.3);
}

/* Dark theme support */
[data-theme="dark"] .nebula-launcher-widget {
    background: var(--nebula-surface, #2d3748);
    border-color: var(--nebula-border, #4a5568);
    color: var(--nebula-text-primary, #e2e8f0);
}

[data-theme="dark"] .launcher-modal {
    background: var(--nebula-surface, #2d3748);
    border-color: var(--nebula-border, #4a5568);
}

[data-theme="dark"] .search-input {
    background: var(--nebula-bg-secondary, #1e293b);
    color: var(--nebula-text-primary, #e2e8f0);
    border-color: var(--nebula-border, #4a5568);
}

[data-theme="dark"] .settings-menu {
    background: var(--nebula-surface, #2d3748);
    border-color: var(--nebula-border, #4a5568);
    color: var(--nebula-text-primary, #e2e8f0);
}

[data-theme="dark"] .settings-menu-item:hover {
    background: var(--nebula-surface-hover, #4a5568);
}

/* Responsive design */
@media (max-width: 768px) {
    .launcher-modal {
        width: 95vw;
        max-height: 90vh;
    }
    
    .launcher-content.grid {
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: 12px;
    }
    
    .launcher-content.tile {
        grid-template-columns: 1fr;
    }
}
</style>
`;

// Inject styles only once
if (!document.getElementById('nebula-launcher-styles')) {
    document.head.insertAdjacentHTML('beforeend', launcherWidgetStyles);
}

// Make the class globally available
window.NebulaLauncher = NebulaLauncher;

// FIXED: Single, reliable registration function
function registerLauncherWidget() {
    // Check if already registered
    if (window.widgetSystem && window.widgetSystem.getRegisteredWidgets().find(w => w.id === 'launcher')) {
        console.log('🚀 Launcher widget already registered, skipping...');
        return true;
    }

    if (window.NebulaWidgetSystem && window.widgetSystem) {
        try {
            window.widgetSystem.registerWidget('launcher', {
                name: 'App Launcher',
                description: 'Centered app launcher with search and multiple view modes',
                category: 'system',
                icon: '🚀',
                widgetClass: NebulaLauncher,
                defaultConfig: {
                    viewMode: 'grid',
                    showTitlebar: true,
                    x: 50,
                    y: 50
                },
                author: 'NebulaDesktop',
                version: '1.0.0'
            });
            console.log('✅ Launcher widget registered successfully');
            return true;
        } catch (error) {
            console.warn('⚠️ Failed to register launcher widget:', error);
            return false;
        }
    }
    return false;
}

// Register immediately if possible, otherwise wait
if (!registerLauncherWidget()) {
    // Wait for DOM and try again
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', registerLauncherWidget);
    } else {
        // Try with a short delay
        setTimeout(registerLauncherWidget, 100);
    }
}

// Minimal fix for NebulaLauncher.js - Only fix the broken parts
// Add this at the end of your existing NebulaLauncher.js file to override the problematic methods

// Fix the setupEventListeners method
NebulaLauncher.prototype.setupEventListeners = function(element) {
    console.log('🚀 Setting up launcher event listeners');
    
    // Handle widget controls and launcher button
    element.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent event bubbling
        
        const action = e.target.closest('[data-action]')?.dataset.action;
        console.log('🚀 Launcher action clicked:', action);
        
        if (action === 'close') {
            this.handleClose();
        } else if (action === 'settings') {
            this.toggleSettingsMenu();
        } else if (action === 'launch') {
            console.log('🚀 Launch button clicked, showing launcher...');
            this.showLauncher();
        } else if (action && action.startsWith('view-')) {
            const newMode = action.replace('view-', '');
            this.setViewMode(newMode);
        } else if (action === 'widget-config') {
            this.openWidgetConfig();
            this.hideSettingsMenu();
        }
    });

    // Close settings menu when clicking outside (but not for launcher overlay)
    document.addEventListener('click', (e) => {
        if (this.element && !this.element.contains(e.target) && 
            this.settingsMenuVisible && !e.target.closest('.launcher-overlay')) {
            this.hideSettingsMenu();
        }
    });
};

// Fix the showLauncher method to match your existing structure
NebulaLauncher.prototype.showLauncher = function() {
    if (this.launcherVisible) {
        console.log('🚀 Launcher already visible, hiding first');
        this.hideLauncher();
        return;
    }

    console.log('🚀 Showing launcher overlay');
    this.launcherVisible = true;
    this.filteredApps = [...this.apps];
    this.searchQuery = '';

    // Remove any existing overlay first
    const existingOverlay = document.querySelector('.launcher-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    // Create the overlay with your existing structure
    const overlay = document.createElement('div');
    overlay.className = 'launcher-overlay';
    overlay.innerHTML = `
        <div class="launcher-modal">
            <div class="launcher-header">
                <div class="launcher-search">
                    <input type="text" 
                           class="search-input" 
                           placeholder="Type to search apps..."
                           id="launcher-search-${this.id}">
                </div>
                <div class="launcher-close">
                    <button class="close-btn" data-action="close-launcher">×</button>
                </div>
            </div>
            <div class="launcher-content ${this.viewMode}">
                ${this.renderApps()}
            </div>
        </div>
    `;

    // Add to document
    document.body.appendChild(overlay);
    console.log('🚀 Launcher overlay added to DOM');

    // Focus search input after a brief delay
    setTimeout(() => {
        const searchInput = overlay.querySelector('.search-input');
        if (searchInput) {
            searchInput.focus();
            console.log('🚀 Search input focused');
        }
    }, 100);

    // Setup search functionality
    const searchInput = overlay.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            console.log('🚀 Search input:', e.target.value);
            this.handleSearch(e.target.value);
        });
    }

    // Setup close button
    const closeBtn = overlay.querySelector('[data-action="close-launcher"]');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            console.log('🚀 Close button clicked');
            this.hideLauncher();
        });
    }

    // Setup app launches
    overlay.addEventListener('click', (e) => {
        const appItem = e.target.closest('.app-item');
        if (appItem) {
            const appId = appItem.dataset.appId;
            console.log('🚀 App item clicked:', appId);
            this.launchApp(appId);
        }
    });

    // Close on escape
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            console.log('🚀 Escape pressed, closing launcher');
            this.hideLauncher();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);

    // Close when clicking outside modal
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            console.log('🚀 Clicked outside modal, closing launcher');
            this.hideLauncher();
        }
    });
};

// Ensure hideLauncher works properly
NebulaLauncher.prototype.hideLauncher = function() {
    const overlay = document.querySelector('.launcher-overlay');
    if (overlay) {
        overlay.remove();
        console.log('🚀 Launcher overlay removed');
    }
    this.launcherVisible = false;
};

// Add some debugging to handleClose
NebulaLauncher.prototype.handleClose = function() {
    console.log('🚀 Launcher widget closing');
    this.hideLauncher(); // Close launcher if open
    if (window.widgetSystem) {
        window.widgetSystem.removeWidget(this.id);
    }
};

console.log('🔧 NebulaLauncher fixes applied!');