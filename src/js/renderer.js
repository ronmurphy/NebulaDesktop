// Merging WME1's window management with EWM2's cleaner architecture
class NebulaDesktop {
    constructor() {
        this.windows = new Map();
        this.activeWindow = null;
        this.taskbar = null;
        this.launcher = null;
        this.isDragging = false;

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
            { name: 'Browser', icon: '🌐', url: 'https://google.com' },
            { name: 'Gmail', icon: '📧', url: 'https://gmail.com' },
            { name: 'Docs', icon: '📄', url: 'https://docs.google.com' },
            { name: 'YouTube', icon: '📺', url: 'https://youtube.com' },
            { name: 'Files', icon: '📁', url: 'files://local' },
            { name: 'Settings', icon: '⚙️', url: 'settings://preferences' }
        ];
    }

    // Add to renderer.js in setupWindowDragging method
    setupWindowDragging(windowEl) {
        const titlebar = windowEl.querySelector('.window-titlebar');
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;

        titlebar.addEventListener('mousedown', (e) => {
            if (e.target.closest('.window-controls')) return;

            isDragging = true;
            initialX = e.clientX - windowEl.offsetLeft;
            initialY = e.clientY - windowEl.offsetTop;
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;

            windowEl.style.left = currentX + 'px';
            windowEl.style.top = currentY + 'px';
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
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

        // App icons
        document.querySelectorAll('.app-icon').forEach(icon => {
            icon.addEventListener('click', (e) => {
                const url = e.currentTarget.dataset.url;
                this.launchApp(url);
                this.launcher.classList.add('hidden');
            });
        });
    }

    async launchApp(url) {
        if (url.startsWith('files://')) {
            this.openFileManager();
        } else if (url.startsWith('settings://')) {
            this.openSettings();
        } else {
            this.createWebWindow(url);
        }
    }

    createWebWindow(url) {
        const windowId = `window-${Date.now()}`;
        const windowEl = document.createElement('div');
        windowEl.className = 'app-window';
        windowEl.id = windowId;
        windowEl.innerHTML = `
            <div class="window-titlebar">
                <span class="window-title">${new URL(url).hostname}</span>
                <div class="window-controls">
                    <button class="minimize">_</button>
                    <button class="maximize">□</button>
                    <button class="close">✕</button>
                </div>
            </div>
            <webview src="${url}" class="window-content"></webview>
        `;

        const desktop = document.getElementById('desktop');
        const x = (desktop.offsetWidth - 800) / 2;
        const y = (desktop.offsetHeight - 600) / 2;
        windowEl.style.left = x + 'px';
        windowEl.style.top = y + 'px';

        // Add to createWebWindow method
        // Make window controls work
        windowEl.querySelector('.minimize').addEventListener('click', () => {
            windowEl.style.display = 'none';
            // Add minimized indicator to taskbar
        });

        windowEl.querySelector('.maximize').addEventListener('click', () => {
            windowEl.classList.toggle('maximized');
            if (windowEl.classList.contains('maximized')) {
                windowEl.style.width = '100%';
                windowEl.style.height = 'calc(100% - 48px)';
                windowEl.style.left = '0';
                windowEl.style.top = '0';
            } else {
                windowEl.style.width = '800px';
                windowEl.style.height = '600px';
            }
        });

        windowEl.querySelector('.close').addEventListener('click', () => {
            windowEl.remove();
            this.removeFromTaskbar(windowId);
        });

        document.getElementById('desktop').appendChild(windowEl);
        this.setupWindowDragging(windowEl);
        this.addToTaskbar(windowId, new URL(url).hostname);
    }

    // Basic file manager
    openFileManager() {
        const windowEl = this.createWindow('Files', 'file-manager');
        // Add file listing functionality
    }

    showPowerMenu() {
        const menu = document.createElement('div');
        menu.className = 'power-menu';
        menu.innerHTML = `
        <button onclick="desktop.logout()">Logout</button>
        <button onclick="desktop.restart()">Restart</button>
        <button onclick="desktop.shutdown()">Shutdown</button>
    `;
        document.body.appendChild(menu);
    }

    addToTaskbar(windowId, title) {
        const taskItem = document.createElement('button');
        taskItem.className = 'task-item';
        taskItem.textContent = title;
        taskItem.onclick = () => this.focusWindow(windowId);
        document.getElementById('taskList').appendChild(taskItem);
    }

    updateClock() {
        const clock = document.getElementById('clock');
        const now = new Date();
        clock.textContent = now.toLocaleTimeString();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.desktop = new NebulaDesktop();
});