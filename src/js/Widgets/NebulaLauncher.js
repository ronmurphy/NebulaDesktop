// NebulaLauncher.js - Launcher Widget
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
            } else if (action.startsWith('view-')) {
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
        // Reuse existing app data from renderer.js
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

        // Try to get apps from existing launcher if available
        if (window.nebulaDesktop && window.nebulaDesktop.getAvailableApps) {
            return window.nebulaDesktop.getAvailableApps();
        }

        return defaultApps;
    }

    showLauncher() {
        if (this.launcherVisible) return;

        console.log('🚀 Showing launcher overlay');
        this.launcherVisible = true;
        this.filteredApps = [...this.apps];
        this.searchQuery = '';

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

        document.body.appendChild(overlay);

        // Focus search input
        const searchInput = overlay.querySelector('.search-input');
        setTimeout(() => searchInput.focus(), 100);

        // Setup search functionality
        searchInput.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // Setup close button
        overlay.querySelector('[data-action="close-launcher"]').addEventListener('click', () => {
            this.hideLauncher();
        });

        // Setup app launches
        overlay.addEventListener('click', (e) => {
            const appItem = e.target.closest('.app-item');
            if (appItem) {
                const appId = appItem.dataset.appId;
                this.launchApp(appId);
            }
        });
    }

    hideLauncher() {
        const overlay = document.querySelector('.launcher-overlay');
        if (overlay) {
            overlay.remove();
        }
        this.launcherVisible = false;
        console.log('🚀 Launcher overlay hidden');
    }

    handleSearch(query) {
        this.searchQuery = query.toLowerCase();
        
        if (!query) {
            this.filteredApps = [...this.apps];
        } else {
            this.filteredApps = this.apps.filter(app => {
                return app.name.toLowerCase().includes(this.searchQuery) ||
                       app.category.toLowerCase().includes(this.searchQuery) ||
                       (app.tags && app.tags.some(tag => tag.toLowerCase().includes(this.searchQuery)));
            });
        }

        // Update app display
        const content = document.querySelector('.launcher-content');
        if (content) {
            content.innerHTML = this.renderApps();
        }
    }

    renderApps() {
        if (this.filteredApps.length === 0) {
            return '<div class="no-apps">No apps found</div>';
        }

        return this.filteredApps.map(app => `
            <div class="app-item ${this.viewMode}" data-app-id="${app.id}">
                <div class="app-icon">${app.icon}</div>
                <div class="app-name">${app.name}</div>
                ${this.viewMode === 'list' ? `<div class="app-category">${app.category}</div>` : ''}
            </div>
        `).join('');
    }

    launchApp(appId) {
        console.log(`🚀 Launching app: ${appId}`);
        
        // Use existing launcher logic from renderer.js
        if (window.nebulaDesktop && window.nebulaDesktop.launchApp) {
            window.nebulaDesktop.launchApp(appId);
        } else {
            // Fallback launch logic
            this.fallbackLaunchApp(appId);
        }

        this.hideLauncher();
    }

    fallbackLaunchApp(appId) {
        // Basic fallback for launching apps
        const appMap = {
            'browser': () => window.windowManager?.createWindow({ title: 'Browser', icon: '🌐' }),
            'filemanager': () => window.windowManager?.createWindow({ title: 'Files', icon: '📁' }),
            'terminal': () => window.windowManager?.createWindow({ title: 'Terminal', icon: '💻' }),
            'calculator': () => window.windowManager?.createWindow({ title: 'Calculator', icon: '🧮' }),
            'settings': () => window.windowManager?.createWindow({ title: 'Settings', icon: '⚙️' }),
            'code-assistant': () => window.windowManager?.createWindow({ title: 'Code Assistant', icon: '🛠️' }),
            'art-assistant': () => window.windowManager?.createWindow({ title: 'Art Assistant', icon: '🎨' }),
            'assistant': () => window.windowManager?.createWindow({ title: 'AI Assistant', icon: '🤖' })
        };

        if (appMap[appId]) {
            appMap[appId]();
        } else {
            console.warn(`No launcher for app: ${appId}`);
        }
    }

    setViewMode(mode) {
        if (mode === this.viewMode) return;
        
        this.viewMode = mode;
        this.updateSettingsMenu();
        
        // Update launcher if visible
        const content = document.querySelector('.launcher-content');
        if (content) {
            content.className = `launcher-content ${mode}`;
            content.innerHTML = this.renderApps();
        }
        
        console.log(`🚀 View mode changed to: ${mode}`);
    }

    handleClose() {
        if (window.widgetSystem) {
            window.widgetSystem.removeWidget(this.id);
        }
    }

    toggleSettingsMenu() {
        if (this.settingsMenuVisible) {
            this.hideSettingsMenu();
        } else {
            this.showSettingsMenu();
        }
    }

    showSettingsMenu() {
        const menu = this.element.querySelector(`#settings-menu-${this.id}`);
        if (!menu) return;

        menu.style.display = 'block';
        this.settingsMenuVisible = true;
        console.log('📋 Launcher settings menu opened');
    }

    hideSettingsMenu() {
        const menu = this.element.querySelector(`#settings-menu-${this.id}`);
        if (!menu) return;

        menu.style.display = 'none';
        this.settingsMenuVisible = false;
        console.log('📋 Launcher settings menu closed');
    }

    updateSettingsMenu() {
        // Update checkmarks for view mode
        const checks = this.element.querySelectorAll('.menu-check');
        checks.forEach(check => {
            const item = check.closest('[data-action]');
            if (item) {
                const action = item.dataset.action;
                const mode = action.replace('view-', '');
                check.textContent = this.viewMode === mode ? '✓' : '';
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
    box-shadow: var(--nebula-shadow-lg, 0 8px 32px rgba(0, 0, 0, 0.15));
}

.launcher-button:active {
    transform: translateY(0);
}

.launcher-icon {
    font-size: 16px;
}

.launcher-text {
    flex: 1;
}

/* Launcher Overlay */
.launcher-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    animation: overlayFadeIn 0.3s ease;
}

@keyframes overlayFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

.launcher-modal {
    background: var(--nebula-surface, #ffffff);
    border: 1px solid var(--nebula-border, #e2e8f0);
    border-radius: var(--nebula-radius-lg, 12px);
    box-shadow: var(--nebula-shadow-lg, 0 8px 32px rgba(0, 0, 0, 0.25));
    width: 90vw;
    max-width: 800px;
    max-height: 80vh;
    overflow: hidden;
    animation: modalSlideIn 0.3s ease;
}

@keyframes modalSlideIn {
    from { transform: translateY(-50px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}

.launcher-header {
    display: flex;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid var(--nebula-border, #e2e8f0);
    gap: 12px;
}

.launcher-search {
    flex: 1;
}

.search-input {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid var(--nebula-border, #e2e8f0);
    border-radius: var(--nebula-radius-md, 8px);
    background: var(--nebula-bg-secondary, #f8fafc);
    color: var(--nebula-text-primary, #1a202c);
    font-size: 16px;
    outline: none;
    transition: all 0.3s ease;
}

.search-input:focus {
    border-color: var(--nebula-primary, #667eea);
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.close-btn {
    background: var(--nebula-danger, #ef4444);
    border: none;
    color: white;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: bold;
    transition: all 0.3s ease;
}

.close-btn:hover {
    background: #dc2626;
    transform: scale(1.1);
}

.launcher-content {
    padding: 16px;
    max-height: 60vh;
    overflow-y: auto;
}

/* Grid View */
.launcher-content.grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 16px;
}

.app-item.grid {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 16px;
    border-radius: var(--nebula-radius-md, 8px);
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: center;
}

.app-item.grid:hover {
    background: var(--nebula-surface-hover, #f1f5f9);
    transform: translateY(-2px);
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

/* List View */
.launcher-content.list {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.app-item.list {
    display: grid;
    grid-template-columns: 40px 1fr auto;
    align-items: center;
    padding: 12px 16px;
    border-radius: var(--nebula-radius-md, 8px);
    cursor: pointer;
    transition: all 0.3s ease;
    gap: 12px;
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

.app-item.list .app-category {
    font-size: 12px;
    color: var(--nebula-text-secondary, #64748b);
    text-transform: capitalize;
}

/* Tile View */
.launcher-content.tile {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
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

/* Settings menu separator */
.settings-menu-separator {
    height: 1px;
    background: var(--nebula-border, #e2e8f0);
    margin: 4px 0;
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

// Inject styles
if (!document.getElementById('nebula-launcher-styles')) {
    document.head.insertAdjacentHTML('beforeend', launcherWidgetStyles);
}

// Register the launcher widget with the widget system
if (window.NebulaWidgetSystem && window.widgetSystem) {
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
}

// Make the class globally available
window.NebulaLauncher = NebulaLauncher;