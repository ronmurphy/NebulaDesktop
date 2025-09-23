// Updated renderer.js - Desktop Environment with WindowManager integration
class NebulaDesktop {
    constructor() {
        this.taskbar = null;
        this.launcher = null;
        this.powerMenu = null;
        this.windowManager = null;
        this.assistant = null; // Add this line


        this.runningApps = new Map(); // appType -> count
        this.launchDebounce = new Map(); // appType -> timestamp (keep your existing debounce)

        this.init();
    }
    
async init() {
    console.log('Initializing NebulaDesk v3 with WindowManager...');
    
    // Track startup time for jfetch
    window.nebulaStartTime = Date.now();
    
    // Initialize the window manager first
    this.windowManager = new WindowManager();
    window.windowManager = this.windowManager; // Make it globally available
    
    // Initialize theme system (ONLY ONCE)
    if (window.NebulaThemeManager) {
        this.themeManager = new NebulaThemeManager();
        window.themeManager = this.themeManager;
        
        // Force icon conversion after everything loads
        setTimeout(() => {
            this.forceIconConversion();
        }, 1500);
    }

        // Create UI components
        this.createTaskbar();
        this.createDesktop();
        this.createLauncher();

        // Setup event listeners
        this.setupEventListeners();

        // Load user configuration
        await this.loadConfiguration();

        this.assistant = new NebulaAssistant();

        window.nebulaDesktop = this;

        console.log('NebulaDesk ready with WindowManager!');
    }

forceIconConversion() {
    console.log('🎨 Starting forced emoji to Material Icons conversion');
    
    // Convert all emoji icons to Material Icons
    const emojiToMaterial = {
        '🕐': 'schedule',
        '⚙️': 'settings', 
        '×': 'close',
        '🌐': 'language',
        '📁': 'folder',
        '💻': 'terminal',
        '🖥️': 'computer',
        '🧮': 'calculate'
    };
    
    let converted = 0;
    document.querySelectorAll('.widget-icon, .app-icon, .widget-control-btn').forEach(icon => {
        const emoji = icon.textContent.trim();
        if (emojiToMaterial[emoji]) {
            icon.innerHTML = emojiToMaterial[emoji];
            icon.style.fontFamily = 'Material Icons';
            icon.classList.add('material-icon', 'material-icon-primary');
            converted++;
        }
    });
    
    console.log(`🎨 Converted ${converted} emoji icons to Material Icons`);
}

    createTaskbar() {
        this.taskbar = document.createElement('div');
        this.taskbar.className = 'taskbar';
        this.taskbar.innerHTML = `
            <button class="start-button" id="startBtn">
                <span>⚡</span> Nebula
            </button>
            <div class="task-list" id="taskList">
                <!-- Window buttons will be added here -->
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
                id: 'qbterminal',
                name: 'QBasic Terminal',
                icon: '🖥️',
                description: 'QBasic compiler & runtime',
                keywords: ['qbasic', 'basic', 'programming', 'compiler', 'retro']
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
        });

        // capture hotkeys screencap
        document.addEventListener('keydown', (e) => {
    // 📸 Screenshot shortcut: Ctrl+PrintScreen (much safer!)
    if (e.ctrlKey && e.key === 'PrintScreen') {
        e.preventDefault();
        e.stopPropagation();
        
        // Call the enhanced screenshot function
        if (window.windowManager) {
            window.windowManager.captureDesktopScreenshot();
        }
        
        console.log('📸 Desktop screenshot triggered via Ctrl+PrintScreen');
        return;
    }
    
    // Alternative: Just PrintScreen alone (if Ctrl+PrintScreen conflicts too)
    if (e.key === 'PrintScreen' && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        e.stopPropagation();
        
        // Call the enhanced screenshot function
        if (window.windowManager) {
            window.windowManager.captureDesktopScreenshot();
        }
        
        console.log('📸 Desktop screenshot triggered via PrintScreen');
        return;
    }
    
    // Theme toggle shortcut: Ctrl+Shift+T (moved from Ctrl+Shift+C)
    if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        e.stopPropagation();
        
        // Call theme toggle if available
        if (window.themeManager && window.themeManager.toggleTheme) {
            window.themeManager.toggleTheme();
        }
        
        console.log('🎨 Theme toggle triggered via Ctrl+Shift+T');
        return;
    }
    
    // Debug: Show all active windows screenshots (Ctrl+Shift+D)
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        e.stopPropagation();
        
        if (window.windowManager) {
            window.windowManager.captureAllWindowScreenshots();
        }
        
        console.log('🐛 Debug screenshot capture triggered');
        return;
    }
    
    // 🆕 Alternative shortcuts if the above don't work:
    
    // F12 for screenshot (like some games use)
    if (e.key === 'F12' && e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();
        
        if (window.windowManager) {
            window.windowManager.captureDesktopScreenshot();
        }
        
        console.log('📸 Desktop screenshot triggered via Ctrl+F12');
        return;
    }
    
    // Ctrl+Alt+S (another safe option)
    if (e.ctrlKey && e.altKey && e.key === 's') {
        e.preventDefault();
        e.stopPropagation();
        
        if (window.windowManager) {
            window.windowManager.captureDesktopScreenshot();
        }
        
        console.log('📸 Desktop screenshot triggered via Ctrl+Alt+S');
        return;
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

    setupTaskbarIntegration() {
        const taskList = document.getElementById('taskList');

        // Create a task button for each window
        const updateTaskbar = () => {
            const windows = this.windowManager.getAllWindows();
            taskList.innerHTML = '';

            windows.forEach(windowData => {
                if (!windowData.isMinimized) return; // Only show minimized windows for now

                const taskButton = document.createElement('button');
                taskButton.className = 'task-button';
                taskButton.innerHTML = `
                    <span class="task-icon">${windowData.config.icon || '🪟'}</span>
                    <span class="task-title">${windowData.config.title}</span>
                `;

                taskButton.addEventListener('click', () => {
                    this.restoreWindow(windowData.id);
                });

                taskList.appendChild(taskButton);
            });
        };

        // Update taskbar when windows change (this is a simple implementation)
        // In a real app, you'd want proper event listening
        setInterval(updateTaskbar, 1000);
    }

    restoreWindow(windowId) {
        this.windowManager.restoreWindowById(windowId);
    }

    trackAppLaunched(appType) {
        const current = this.runningApps.get(appType) || 0;
        this.runningApps.set(appType, current + 1);
        console.log(`📊 Running apps: ${appType} = ${current + 1}`);
    }

    trackAppClosed(appType) {
        const current = this.runningApps.get(appType) || 0;
        if (current > 0) {
            this.runningApps.set(appType, current - 1);
            console.log(`📊 Running apps: ${appType} = ${current - 1}`);
        }
    }



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
                    if (window.NebulaBrowser) {
                        new NebulaBrowser();
                        this.trackAppLaunched('browser');
                    } else {
                        this.showError('Browser app not available. Make sure browser.js is loaded.');
                    }
                    break;

                case 'files':
                    if (window.NebulaFileManager) {
                        new NebulaFileManager();
                        this.trackAppLaunched('files');
                    } else {
                        this.showError('File Manager app not available. Make sure filemanager.js is loaded.');
                    }
                    break;

                case 'terminal':
                    if (window.NebulaTerminal) {
                        new NebulaTerminal();
                        this.trackAppLaunched('terminal');
                    } else {
                        this.showError('Terminal app not available. Make sure NebulaTerminal.js is loaded.');
                    }
                    break;

                case 'qbterminal':
                    if (window.NebulaQBasicTerminal) {
                        window.QBTERMINAL_AUTO_INIT = true;
                        new NebulaQBasicTerminal();
                        this.trackAppLaunched('qbterminal');
                        delete window.QBTERMINAL_AUTO_INIT;
                    } else {
                        this.showError('QBasic Terminal app not available. Make sure QBTerminal.js is loaded.');
                    }
                    break;

                case 'calculator':
                    this.launchCalculator();
                    this.trackAppLaunched('calculator');
                    break;

                case 'settings':
                    // ✅ UPDATED: Use the new NebulaSettings app
                    if (window.NebulaSettings) {
                        new NebulaSettings();
                        this.trackAppLaunched('settings');
                    } else {
                        this.showError('Settings app not available. Make sure NebulaSettings.js is loaded.');
                    }
                    break;

                default:
                    // For web apps, open in browser
                    if (appConfig.url) {
                        if (window.NebulaBrowser) {
                            new NebulaBrowser(appConfig.url);
                            this.trackAppLaunched('browser');
                        } else {
                            // Fallback: open in external browser
                            window.open(appConfig.url, '_blank');
                        }
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


    // ✅ ADD: Method to show running app status
    showAppManagerStatus() {
        console.log('=== Simple App Status ===');
        this.runningApps.forEach((count, appType) => {
            if (count > 0) {
                console.log(`- ${appType}: ${count} instances`);
            }
        });

        const totalRunning = Array.from(this.runningApps.values()).reduce((sum, count) => sum + count, 0);

        if (totalRunning === 0) {
            this.showError('No apps currently running');
        } else {
            this.showError(`Running: ${totalRunning} apps total`);
        }
    }


    launchTerminal() {
        // Use the new NebulaTerminal class
        if (window.NebulaTerminal) {
            new NebulaTerminal();
        } else {
            this.showError('Terminal app not available. Make sure NebulaTerminal.js is loaded.');
        }
    }

    launchCalculator() {
        // Simple calculator app
        const windowId = this.windowManager.createWindow({
            title: 'Calculator',
            width: 300,
            height: 400,
            hasTabBar: false,
            resizable: false
        });

        this.windowManager.loadApp(windowId, {
            render: () => {
                const container = document.createElement('div');
                container.style.cssText = `
                    width: 100%;
                    height: 100%;
                    background: var(--nebula-bg-primary);
                    padding: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                `;

                container.innerHTML = `
                    <div style="background: var(--nebula-surface); padding: 16px; border-radius: 8px; text-align: right; font-size: 24px; font-family: monospace;">0</div>
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; flex: 1;">
                        <button style="background: var(--nebula-surface-hover); border: none; border-radius: 8px; color: var(--nebula-text-primary); font-size: 18px; cursor: pointer;">C</button>
                        <button style="background: var(--nebula-surface-hover); border: none; border-radius: 8px; color: var(--nebula-text-primary); font-size: 18px; cursor: pointer;">±</button>
                        <button style="background: var(--nebula-surface-hover); border: none; border-radius: 8px; color: var(--nebula-text-primary); font-size: 18px; cursor: pointer;">%</button>
                        <button style="background: var(--nebula-primary); border: none; border-radius: 8px; color: white; font-size: 18px; cursor: pointer;">÷</button>
                        <button style="background: var(--nebula-surface); border: none; border-radius: 8px; color: var(--nebula-text-primary); font-size: 18px; cursor: pointer;">7</button>
                        <button style="background: var(--nebula-surface); border: none; border-radius: 8px; color: var(--nebula-text-primary); font-size: 18px; cursor: pointer;">8</button>
                        <button style="background: var(--nebula-surface); border: none; border-radius: 8px; color: var(--nebula-text-primary); font-size: 18px; cursor: pointer;">9</button>
                        <button style="background: var(--nebula-primary); border: none; border-radius: 8px; color: white; font-size: 18px; cursor: pointer;">×</button>
                        <button style="background: var(--nebula-surface); border: none; border-radius: 8px; color: var(--nebula-text-primary); font-size: 18px; cursor: pointer;">4</button>
                        <button style="background: var(--nebula-surface); border: none; border-radius: 8px; color: var(--nebula-text-primary); font-size: 18px; cursor: pointer;">5</button>
                        <button style="background: var(--nebula-surface); border: none; border-radius: 8px; color: var(--nebula-text-primary); font-size: 18px; cursor: pointer;">6</button>
                        <button style="background: var(--nebula-primary); border: none; border-radius: 8px; color: white; font-size: 18px; cursor: pointer;">−</button>
                        <button style="background: var(--nebula-surface); border: none; border-radius: 8px; color: var(--nebula-text-primary); font-size: 18px; cursor: pointer;">1</button>
                        <button style="background: var(--nebula-surface); border: none; border-radius: 8px; color: var(--nebula-text-primary); font-size: 18px; cursor: pointer;">2</button>
                        <button style="background: var(--nebula-surface); border: none; border-radius: 8px; color: var(--nebula-text-primary); font-size: 18px; cursor: pointer;">3</button>
                        <button style="background: var(--nebula-primary); border: none; border-radius: 8px; color: white; font-size: 18px; cursor: pointer;">+</button>
                        <button style="background: var(--nebula-surface); border: none; border-radius: 8px; color: var(--nebula-text-primary); font-size: 18px; cursor: pointer; grid-column: span 2;">0</button>
                        <button style="background: var(--nebula-surface); border: none; border-radius: 8px; color: var(--nebula-text-primary); font-size: 18px; cursor: pointer;">.</button>
                        <button style="background: var(--nebula-primary); border: none; border-radius: 8px; color: white; font-size: 18px; cursor: pointer;">=</button>
                    </div>
                `;

                // Add basic calculator functionality
                let display = container.querySelector('div');
                let currentValue = '0';
                let operator = null;
                let waitingForNewValue = false;

                container.addEventListener('click', (e) => {
                    if (e.target.tagName === 'BUTTON') {
                        const value = e.target.textContent;

                        if ('0123456789'.includes(value)) {
                            if (waitingForNewValue) {
                                currentValue = value;
                                waitingForNewValue = false;
                            } else {
                                currentValue = currentValue === '0' ? value : currentValue + value;
                            }
                            display.textContent = currentValue;
                        } else if (value === 'C') {
                            currentValue = '0';
                            operator = null;
                            waitingForNewValue = false;
                            display.textContent = currentValue;
                        }
                        // Add more calculator logic here...
                    }
                });

                return container;
            },
            getTitle: () => 'Calculator',
            getIcon: () => '🧮'
        });
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

    showPowerMenu() {
        this.closePowerMenu(); // Close any existing menu

        this.powerMenu = document.createElement('div');
        this.powerMenu.className = 'power-menu';
        this.powerMenu.innerHTML = `
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

    handlePowerAction(action) {
        switch (action) {
            case 'logout':
                if (confirm('Logout from NebulaDesk?')) {
                    if (window.nebula?.system) {
                        window.nebula.system.logout();
                    } else {
                        window.close();
                    }
                }
                break;
            case 'restart':
                if (confirm('Restart the system?')) {
                    if (window.nebula?.system) {
                        window.nebula.system.reboot();
                    } else {
                        this.showError('Restart not available in this mode');
                    }
                }
                break;
            case 'shutdown':
                if (confirm('Shutdown the system?')) {
                    if (window.nebula?.system) {
                        window.nebula.system.shutdown();
                    } else {
                        this.showError('Shutdown not available in this mode');
                    }
                }
                break;
        }
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

// Add CSS animations for notifications
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
    
    .task-button {
        background: var(--nebula-surface);
        border: 1px solid var(--nebula-border);
        color: var(--nebula-text-primary);
        padding: 8px 16px;
        border-radius: var(--nebula-radius-sm);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        transition: var(--nebula-transition-fast);
        margin-right: 8px;
    }
    
    .task-button:hover {
        background: var(--nebula-surface-hover);
    }
    
    .task-icon {
        font-size: 14px;
    }
    
    .task-title {
        max-width: 100px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
`;
document.head.appendChild(style);