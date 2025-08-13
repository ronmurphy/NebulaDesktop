// renderer.js - FIXED - Updated for integrated WindowManager with App Management
class NebulaDesktop {
    constructor() {
        this.taskbar = null;
        this.launcher = null;
        this.powerMenu = null;
        this.windowManager = null;
        this.assistant = null;

        this.init();
    }
    
    async init() {
        console.log('Initializing NebulaDesk v3 with Integrated WindowManager...');

        // Track startup time for jfetch
        window.nebulaStartTime = Date.now();

        // Initialize the window manager with integrated app management
        this.windowManager = new WindowManager();
        window.windowManager = this.windowManager; // Make it globally available

        // Create UI components
        this.createTaskbar();
        this.createDesktop();
        this.createLauncher();

        // Setup event listeners
        this.setupEventListeners();

        // Load user configuration
        await this.loadConfiguration();

        this.assistant = new NebulaAssistant();

        // Restore previous session using integrated WindowManager
        await this.windowManager.restoreSession();
        
        // Cleanup old app states periodically (once per day)
        setInterval(() => {
            this.windowManager.cleanupOldStates();
        }, 24 * 60 * 60 * 1000);

        console.log('NebulaDesk ready with Integrated WindowManager!');
    }

    createTaskbar() {
        this.taskbar = document.createElement('div');
        this.taskbar.className = 'taskbar';
        this.taskbar.innerHTML = `
            <button class="start-button" id="startBtn">
                <span>⚡</span> Nebula
            </button>
            <div class="task-list" id="taskList">
                <!-- Running app buttons will be added here -->
            </div>
            <div class="system-tray">
                <button class="theme-toggle" id="themeToggle" title="Switch Theme">🎨</button>
                <span class="clock" id="clock"></span>
                <button class="power-btn" id="powerBtn">⏻</button>
            </div>
        `;
        document.body.appendChild(this.taskbar);

        // Start clock
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);

        // Listen for window events to update taskbar
        this.setupTaskbarIntegration();
    }

    createDesktop() {
        const desktop = document.createElement('div');
        desktop.className = 'desktop';
        desktop.id = 'desktop';
        document.body.appendChild(desktop);
    }

    createLauncher() {
        this.launcher = document.createElement('div');
        this.launcher.className = 'launcher hidden';
        this.launcher.innerHTML = `
            <div class="launcher-header">
                <input type="text" placeholder="Search apps..." class="search-box" id="searchBox">
            </div>
            <div class="app-grid">
                ${this.getDefaultApps().map(app => `
                    <div class="app-icon" data-app="${app.id}">
                        <span class="icon">${app.icon}</span>
                        <span class="label">${app.name}</span>
                    </div>
                `).join('')}
            </div>
        `;
        document.body.appendChild(this.launcher);

        // Setup search functionality
        this.setupLauncherSearch();
    }

    getDefaultApps() {
        return [
            {
                id: 'browser',
                name: 'Browser',
                icon: '🌐',
                description: 'Browse the web with tabs',
                keywords: ['web', 'internet', 'browse', 'url']
            },
            {
                id: 'gmail',
                name: 'Gmail',
                icon: '📧',
                url: 'https://gmail.com',
                description: 'Email service',
                keywords: ['email', 'mail', 'message']
            },
            {
                id: 'docs',
                name: 'Docs',
                icon: '📄',
                url: 'https://docs.google.com',
                description: 'Document editing',
                keywords: ['document', 'write', 'text', 'office']
            },
            {
                id: 'youtube',
                name: 'YouTube',
                icon: '📺',
                url: 'https://youtube.com',
                description: 'Video streaming',
                keywords: ['video', 'stream', 'watch', 'entertainment']
            },
            {
                id: 'files',
                name: 'Files',
                icon: '📁',
                description: 'File manager',
                keywords: ['file', 'folder', 'directory', 'explorer']
            },
            {
                id: 'settings',
                name: 'Settings',
                icon: '⚙️',
                description: 'System preferences',
                keywords: ['config', 'preferences', 'options', 'system']
            },
            {
                id: 'terminal',
                name: 'Terminal',
                icon: '💻',
                description: 'Command line interface',
                keywords: ['command', 'cli', 'shell', 'console']
            },
            {
                id: 'calculator',
                name: 'Calculator',
                icon: '🧮',
                description: 'Basic calculator',
                keywords: ['math', 'calculate', 'numbers']
            }
        ];
    }

    setupEventListeners() {
        // Start button
        document.getElementById('startBtn').addEventListener('click', () => {
            this.toggleLauncher();
        });

        // Power button
        document.getElementById('powerBtn').addEventListener('click', () => {
            this.showPowerMenu();
        });

        // Theme toggle button
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.cycleTheme();
        });

        // App icons
        this.launcher.addEventListener('click', (e) => {
            const appIcon = e.target.closest('.app-icon');
            if (appIcon) {
                const appId = appIcon.dataset.app;
                this.launchApp(appId);
                this.hideLauncher();
            }
        });

        // Click outside to close menus
        document.addEventListener('click', (e) => {
            // Close launcher
            if (this.launcher && !this.launcher.contains(e.target) &&
                !e.target.closest('#startBtn') &&
                !this.launcher.classList.contains('hidden')) {
                this.hideLauncher();
            }

            // Close power menu
            if (this.powerMenu && !this.powerMenu.contains(e.target) &&
                !e.target.closest('#powerBtn')) {
                this.closePowerMenu();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Alt + Space - Open launcher
            if (e.altKey && e.code === 'Space') {
                e.preventDefault();
                this.toggleLauncher();
            }

            // Escape - Close launcher
            if (e.key === 'Escape') {
                this.hideLauncher();
                this.closePowerMenu();
            }

            // Alt + Q - Show running apps
            if (e.altKey && e.key === 'q') {
                e.preventDefault();
                this.showAppManagerStatus();
            }
            
            // FIXED: Changed shortcut from Ctrl+Alt+R to Ctrl+Alt+E to avoid conflict with refresh
            // Ctrl + Alt + E - Restore session manually
            if (e.ctrlKey && e.altKey && e.key === 'e') {
                e.preventDefault();
                this.windowManager.restoreSession();
                this.showError('Session restoration requested');
            }

            // Ctrl + Alt + S - Save all app states
            if (e.ctrlKey && e.altKey && e.key === 's') {
                e.preventDefault();
                const saved = this.windowManager.saveAllStates();
                this.showError(`Saved ${saved} app states`);
            }

            // Ctrl + Alt + D - Debug info
            if (e.ctrlKey && e.altKey && e.key === 'd') {
                e.preventDefault();
                console.log('=== WindowManager Debug Info ===');
                console.log(this.windowManager.getDebugInfo());
            }

            // ADDED: Ctrl + Alt + C - Clear all app data (emergency)
            if (e.ctrlKey && e.altKey && e.key === 'c') {
                e.preventDefault();
                if (confirm('Clear all saved app data? This will remove all window positions and app states.')) {
                    const cleared = this.windowManager.clearAllAppData();
                    this.showError(`Cleared ${cleared} saved states`);
                }
            }
        });
    }

    setupLauncherSearch() {
        const searchBox = document.getElementById('searchBox');
        const appGrid = this.launcher.querySelector('.app-grid');
        const apps = this.getDefaultApps();

        searchBox.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();

            if (query === '') {
                // Show all apps
                this.renderAppGrid(apps);
            } else {
                // Filter apps
                const filteredApps = apps.filter(app =>
                    app.name.toLowerCase().includes(query) ||
                    app.description.toLowerCase().includes(query) ||
                    app.keywords.some(keyword => keyword.includes(query))
                );
                this.renderAppGrid(filteredApps);
            }
        });

        // Handle Enter key in search
        searchBox.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const firstApp = appGrid.querySelector('.app-icon');
                if (firstApp) {
                    this.launchApp(firstApp.dataset.app);
                    this.hideLauncher();
                }
            }
        });
    }

    renderAppGrid(apps) {
        const appGrid = this.launcher.querySelector('.app-grid');
        appGrid.innerHTML = apps.map(app => `
            <div class="app-icon" data-app="${app.id}">
                <span class="icon">${app.icon}</span>
                <span class="label">${app.name}</span>
            </div>
        `).join('');
    }

    // FIXED: Taskbar integration with horizontal layout
    setupTaskbarIntegration() {
        const taskList = document.getElementById('taskList');

        const updateTaskbar = () => {
            const runningApps = this.windowManager.getAllRunningApps();
            taskList.innerHTML = '';

            runningApps.forEach(appData => {
                // Show all running apps, highlight minimized ones
                const taskButton = document.createElement('button');
                taskButton.className = `task-button ${appData.isMinimized ? 'minimized' : ''}`;
                taskButton.innerHTML = `
                    <span class="task-icon">${appData.icon}</span>
                    <span class="task-title">${appData.title}</span>
                `;

                taskButton.addEventListener('click', () => {
                    if (appData.isMinimized) {
                        this.windowManager.restoreWindow(appData.windowId);
                    } else {
                        this.windowManager.focusWindow(appData.windowId);
                    }
                });

                taskList.appendChild(taskButton);
            });
        };

        // Update taskbar when apps change
        setInterval(updateTaskbar, 1000);
    }

    // SIMPLIFIED APP LAUNCHING - Uses integrated WindowManager
    async launchApp(appId) {
        console.log('Launching app:', appId);

        const apps = this.getDefaultApps();
        const appConfig = apps.find(app => app.id === appId);

        if (!appConfig) {
            console.error('App not found:', appId);
            return;
        }

        try {
            switch (appId) {
                case 'browser':
                    await this.windowManager.launchApp('browser');
                    break;

                case 'terminal':
                    await this.windowManager.launchApp('terminal');
                    break;

                case 'settings':
                    await this.windowManager.launchApp('settings');
                    break;

                case 'calculator':
                    // FIXED: Now uses WindowManager instead of local implementation
                    await this.windowManager.launchApp('calculator');
                    break;

                case 'files':
                    // Keep using direct instantiation until we rewrite file manager
                    if (window.NebulaFileManager) {
                        new NebulaFileManager();
                    } else {
                        this.showError('File Manager app not available. Make sure filemanager.js is loaded.');
                    }
                    break;

                default:
                    // For web apps, open in browser with URL
                    if (appConfig.url) {
                        await this.windowManager.launchApp('browser', { initialUrl: appConfig.url });
                    } else {
                        this.showError(`App "${appConfig.name}" is not yet implemented.`);
                    }
                    break;
            }
        } catch (error) {
            console.error('Error launching app:', error);
            this.showError(`Failed to launch ${appConfig.name}: ${error.message}`);
        }
    }

    // REMOVED: launchCalculator() method since it's now in WindowManager

    showAppManagerStatus() {
        const debugInfo = this.windowManager.getDebugInfo();
        
        console.log('=== WindowManager Status ===');
        console.log(`Total windows: ${debugInfo.totalWindows}`);
        console.log(`Running apps: ${debugInfo.runningApps}`);
        console.log(`Registered types: ${debugInfo.registeredTypes.join(', ')}`);
        console.log(`Saved states: ${debugInfo.savedStates}`);
        console.log(`Singleton apps: ${debugInfo.singletonApps.join(', ')}`);
        
        debugInfo.running.forEach(app => {
            console.log(`- ${app.appType} (${app.instanceId}): ${app.title}`);
        });
        
        // Show notification
        if (debugInfo.runningApps === 0) {
            this.showError('No apps currently running');
        } else {
            const message = `Running: ${debugInfo.running.map(app => app.appType).join(', ')} (${debugInfo.runningApps} total)`;
            this.showError(message); // Using showError for notification
        }
    }

    toggleLauncher() {
        this.launcher.classList.toggle('hidden');
        if (!this.launcher.classList.contains('hidden')) {
            // Focus search box when launcher opens
            setTimeout(() => {
                document.getElementById('searchBox').focus();
            }, 100);
        }
    }

    hideLauncher() {
        this.launcher.classList.add('hidden');
        // Clear search
        document.getElementById('searchBox').value = '';
        this.renderAppGrid(this.getDefaultApps());
    }

    // ENHANCED: Power menu with app data management
    showPowerMenu() {
        this.closePowerMenu(); // Close any existing menu

        this.powerMenu = document.createElement('div');
        this.powerMenu.className = 'power-menu';
        this.powerMenu.innerHTML = `
            <div class="power-menu-item" data-action="settings">
                <span class="icon">⚙️</span>
                <span>Settings</span>
            </div>
            <div class="power-menu-separator"></div>
            <div class="power-menu-item" data-action="save-states">
                <span class="icon">💾</span>
                <span>Save All States</span>
            </div>
            <div class="power-menu-item" data-action="clear-data">
                <span class="icon">🧹</span>
                <span>Clear App Data</span>
            </div>
            <div class="power-menu-separator"></div>
            <div class="power-menu-item" data-action="logout">
                <span class="icon">🚪</span>
                <span>Logout</span>
            </div>
            <div class="power-menu-item" data-action="restart">
                <span class="icon">🔄</span>
                <span>Restart</span>
            </div>
            <div class="power-menu-item" data-action="shutdown">
                <span class="icon">⏻</span>
                <span>Shutdown</span>
            </div>
        `;

        // Position the menu
        const powerBtn = document.getElementById('powerBtn');
        const rect = powerBtn.getBoundingClientRect();
        this.powerMenu.style.cssText = `
            position: fixed;
            bottom: 60px;
            right: 16px;
            z-index: 2000;
        `;

        document.body.appendChild(this.powerMenu);

        // Add event listeners
        this.powerMenu.addEventListener('click', (e) => {
            const menuItem = e.target.closest('.power-menu-item');
            if (menuItem) {
                const action = menuItem.dataset.action;
                this.handlePowerAction(action);
                this.closePowerMenu();
            }
        });
    }

    closePowerMenu() {
        if (this.powerMenu) {
            this.powerMenu.remove();
            this.powerMenu = null;
        }
    }

    // ENHANCED: Power actions with app data management
    handlePowerAction(action) {
        switch (action) {
            case 'settings':
                this.windowManager.launchApp('settings');
                break;

            case 'save-states':
                const saved = this.windowManager.saveAllStates();
                this.showError(`Saved ${saved} app states successfully!`);
                break;

            case 'clear-data':
                if (confirm('Clear all saved app data?\n\nThis will remove:\n• Window positions and sizes\n• App states and preferences\n• Session restore data\n\nThis action cannot be undone.')) {
                    const cleared = this.windowManager.clearAllAppData();
                    this.showError(`Cleared ${cleared} saved app states!`);
                }
                break;

            case 'logout':
                if (confirm('Logout from NebulaDesk?')) {
                    // Save all states before logout
                    this.windowManager.saveAllStates();
                    
                    if (window.nebula?.system) {
                        window.nebula.system.logout();
                    } else {
                        window.close();
                    }
                }
                break;
            case 'restart':
                if (confirm('Restart the system?')) {
                    // Save all states before restart
                    this.windowManager.saveAllStates();
                    
                    if (window.nebula?.system) {
                        window.nebula.system.reboot();
                    } else {
                        this.showError('Restart not available in this mode');
                    }
                }
                break;
            case 'shutdown':
                if (confirm('Shutdown the system?')) {
                    // Save all states before shutdown
                    this.windowManager.saveAllStates();
                    
                    if (window.nebula?.system) {
                        window.nebula.system.shutdown();
                    } else {
                        this.showError('Shutdown not available in this mode');
                    }
                }
                break;
        }
    }

    openSettings() {
        // Use the WindowManager to launch settings
        this.windowManager.launchApp('settings');
    }

    showError(message) {
        // Simple error notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--nebula-danger);
            color: white;
            padding: 16px 20px;
            border-radius: 8px;
            box-shadow: var(--nebula-shadow-lg);
            z-index: 3000;
            max-width: 300px;
            font-size: 14px;
            animation: slideIn 0.3s ease-out;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out forwards';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    updateClock() {
        const clock = document.getElementById('clock');
        if (clock) {
            const now = new Date();
            clock.textContent = now.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }

    cycleTheme() {
        const themes = ['light', 'dark', 'nebula-slate'];
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const currentIndex = themes.indexOf(currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        const nextTheme = themes[nextIndex];

        document.documentElement.setAttribute('data-theme', nextTheme);

        // Save theme preference
        try {
            localStorage.setItem('nebula-theme', nextTheme);
        } catch (error) {
            console.warn('Could not save theme preference:', error);
        }

        console.log(`Theme switched to: ${nextTheme}`);
    }

    async loadConfiguration() {
        // Load saved theme
        try {
            const savedTheme = localStorage.getItem('nebula-theme');
            if (savedTheme) {
                document.documentElement.setAttribute('data-theme', savedTheme);
            } else {
                document.documentElement.setAttribute('data-theme', 'light');
            }
        } catch (error) {
            console.warn('Could not load theme preference:', error);
            document.documentElement.setAttribute('data-theme', 'light');
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.desktop = new NebulaDesktop();
});

// FIXED: Updated CSS animations and taskbar layout
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    @keyframes blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0; }
    }
    
    /* FIXED: Horizontal taskbar layout */
    .task-list {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 8px;
        flex: 1;
        overflow-x: auto;
        padding: 0 8px;
    }
    
    .task-button {
        background: var(--nebula-surface);
        border: 1px solid var(--nebula-border);
        color: var(--nebula-text-primary);
        padding: 8px 16px;
        border-radius: var(--nebula-radius-sm);
        cursor: pointer;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        transition: var(--nebula-transition-fast);
        position: relative;
        white-space: nowrap;
        flex-shrink: 0;
        min-width: 120px;
        max-width: 200px;
    }
    
    .task-button:hover {
        background: var(--nebula-surface-hover);
        transform: translateY(-1px);
    }
    
    .task-button.minimized {
        background: var(--nebula-bg-secondary);
        border-style: dashed;
        opacity: 0.8;
    }
    
    .task-button.minimized::after {
        content: '';
        position: absolute;
        bottom: 2px;
        left: 50%;
        transform: translateX(-50%);
        width: 20px;
        height: 2px;
        background: var(--nebula-primary);
        border-radius: 1px;
    }
    
    .task-icon {
        font-size: 14px;
        flex-shrink: 0;
    }
    
    .task-title {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex: 1;
    }

    /* ENHANCED: Power menu with separators */
    .power-menu-separator {
        height: 1px;
        background: var(--nebula-border);
        margin: 4px 8px;
    }

    .power-menu-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        cursor: pointer;
        transition: var(--nebula-transition);
        color: var(--nebula-text-primary);
        border: none;
        background: transparent;
        width: 100%;
        text-align: left;
        font-size: 14px;
        min-width: 180px;
    }

    .power-menu-item:hover {
        background: var(--nebula-surface-hover);
    }

    .power-menu-item .icon {
        font-size: 16px;
        width: 16px;
        text-align: center;
    }

    /* Special styling for destructive actions */
    .power-menu-item[data-action="clear-data"]:hover {
        background: var(--nebula-danger);
        color: white;
    }

    .power-menu-item[data-action="logout"]:hover,
    .power-menu-item[data-action="restart"]:hover,
    .power-menu-item[data-action="shutdown"]:hover {
        background: var(--nebula-warning);
        color: white;
    }
`;
document.head.appendChild(style);