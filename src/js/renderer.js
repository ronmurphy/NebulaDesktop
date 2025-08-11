// src/js/renderer.js - Clean Desktop Environment
class NebulaDesktop {
    constructor() {
        this.windows = new Map();
        this.activeWindow = null;
        this.taskbar = null;
        this.launcher = null;
        this.powerMenu = null;
        
        this.init();
    }
    
    async init() {
        console.log('Initializing NebulaDesk v3...');
        
        // Create UI components
        this.createTaskbar();
        this.createDesktop();
        this.createLauncher();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load user config
        await this.loadConfiguration();
        
        console.log('NebulaDesk ready!');
    }
    
    createTaskbar() {
        this.taskbar = document.createElement('div');
        this.taskbar.className = 'taskbar';
        this.taskbar.innerHTML = `
            <button class="start-button" id="startBtn">
                <span>⚡</span> Nebula
            </button>
            <div class="task-list" id="taskList"></div>
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
                <input type="text" placeholder="Search apps..." class="search-box">
            </div>
            <div class="app-grid">
                ${this.getDefaultApps().map(app => `
                    <div class="app-icon" data-url="${app.url}">
                        <span class="icon">${app.icon}</span>
                        <span class="label">${app.name}</span>
                    </div>
                `).join('')}
            </div>
        `;
        document.body.appendChild(this.launcher);
    }
    
    getDefaultApps() {
        return [
            { name: 'Browser', icon: '🌐', url: 'browser://new' },
            { name: 'Gmail', icon: '📧', url: 'https://gmail.com' },
            { name: 'Docs', icon: '📄', url: 'https://docs.google.com' },
            { name: 'YouTube', icon: '📺', url: 'https://youtube.com' },
            { name: 'Files', icon: '📁', url: 'files://local' },
            { name: 'Settings', icon: '⚙️', url: 'settings://preferences' }
        ];
    }
    
    setupEventListeners() {
        // Start button
        document.getElementById('startBtn').addEventListener('click', () => {
            this.launcher.classList.toggle('hidden');
        });
        
        // Power button
        document.getElementById('powerBtn').addEventListener('click', () => {
            this.showPowerMenu();
        });
        
        // Theme toggle button
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.cycleTheme();
        });
        
        // App icons - setup after launcher is created
        setTimeout(() => {
            document.querySelectorAll('.app-icon').forEach(icon => {
                icon.addEventListener('click', (e) => {
                    const url = e.currentTarget.dataset.url;
                    this.launchApp(url);
                    this.launcher.classList.add('hidden');
                });
            });
        }, 100);
        
        // Click outside launcher to close
        document.addEventListener('click', (e) => {
            if (this.launcher && !this.launcher.contains(e.target) && 
                !e.target.closest('#startBtn') && 
                !this.launcher.classList.contains('hidden')) {
                this.launcher.classList.add('hidden');
            }
            
            // Close power menu if clicking outside
            if (this.powerMenu && !this.powerMenu.contains(e.target) && 
                !e.target.closest('#powerBtn')) {
                this.powerMenu.remove();
                this.powerMenu = null;
            }
        });
    }
    
    async launchApp(url) {
        console.log('Launching app:', url);
        
        if (url === 'browser://new') {
            // Launch the separate browser app
            if (window.NebulaBrowser) {
                new NebulaBrowser();
            } else {
                console.error('NebulaBrowser class not found - make sure browser.js is loaded');
            }
        } else if (url === 'files://local') {
            // Launch the file manager
            if (window.NebulaFileManager) {
                new NebulaFileManager();
            } else {
                console.error('NebulaFileManager class not found - make sure filemanager.js is loaded');
            }
        } else if (url.startsWith('settings://')) {
            this.openSettings();
        } else {
            // Open URL in browser
            if (window.NebulaBrowser) {
                new NebulaBrowser(url);
            } else {
                console.error('NebulaBrowser class not found - make sure browser.js is loaded');
            }
        }
    }
    
    showPowerMenu() {
        // Remove any existing power menu
        if (this.powerMenu) {
            this.powerMenu.remove();
        }
        
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
        
        // Position the menu above the power button
        const powerBtn = document.getElementById('powerBtn');
        const rect = powerBtn.getBoundingClientRect();
        this.powerMenu.style.position = 'fixed';
        this.powerMenu.style.bottom = '60px';
        this.powerMenu.style.right = '16px';
        
        document.body.appendChild(this.powerMenu);
        
        // Add event listeners
        this.powerMenu.querySelectorAll('.power-menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                if (action === 'logout') this.logout();
                else if (action === 'restart') this.restart();
                else if (action === 'shutdown') this.shutdown();
                
                this.powerMenu.remove();
                this.powerMenu = null;
            });
        });
    }
    
    logout() {
        if (confirm('Logout from NebulaDesk?')) {
            if (window.nebula && window.nebula.system) {
                window.nebula.system.logout();
            } else {
                window.close();
            }
        }
    }
    
    restart() {
        if (confirm('Restart the system?')) {
            if (window.nebula && window.nebula.system) {
                window.nebula.system.reboot();
            } else {
                alert('Restart not available in this mode');
            }
        }
    }
    
    shutdown() {
        if (confirm('Shutdown the system?')) {
            if (window.nebula && window.nebula.system) {
                window.nebula.system.shutdown();
            } else {
                alert('Shutdown not available in this mode');
            }
        }
    }
    
    openSettings() {
        alert('Settings panel coming soon!');
    }
    
    updateClock() {
        const clock = document.getElementById('clock');
        if (clock) {
            const now = new Date();
            clock.textContent = now.toLocaleTimeString();
        }
    }
    
    cycleTheme() {
        const themes = ['light', 'dark', 'nebula-slate'];
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const currentIndex = themes.indexOf(currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        const nextTheme = themes[nextIndex];
        
        document.documentElement.setAttribute('data-theme', nextTheme);
        
        // Save theme preference to localStorage
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
                // Set default theme
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
