// Simple NebulaDesk - Back to Basics
class NebulaDesktop {
    constructor() {
        this.windows = [];
        this.windowCounter = 0;
        this.init();
    }

    init() {
        console.log('Initializing NebulaDesk (Simple Version)...');
        this.createTaskbar();
        this.createDesktop();
        console.log('NebulaDesk ready!');
    }

    createTaskbar() {
        const taskbar = document.createElement('div');
        taskbar.className = 'taskbar';
        taskbar.innerHTML = `
            <button class="start-button" onclick="desktop.toggleLauncher()">
                Nebula
            </button>
            <div class="task-list" id="taskList"></div>
            <div class="system-tray">
                <div class="clock" id="clock">${new Date().toLocaleTimeString()}</div>
            </div>
        `;
        document.body.appendChild(taskbar);

        // Update clock
        setInterval(() => {
            const clock = document.getElementById('clock');
            if (clock) {
                clock.textContent = new Date().toLocaleTimeString();
            }
        }, 1000);
    }

    createDesktop() {
        const desktop = document.createElement('div');
        desktop.className = 'desktop';
        desktop.id = 'desktop';
        document.body.appendChild(desktop);
        
        this.createLauncher();
    }

    createLauncher() {
        const launcher = document.createElement('div');
        launcher.className = 'launcher';
        launcher.id = 'launcher';
        launcher.style.display = 'none';
        
        launcher.innerHTML = `
            <h2>Applications</h2>
            <div class="app-grid">
                <div class="app-item" onclick="desktop.openBrowser()">
                    <div class="app-icon">🌐</div>
                    <div class="app-name">Browser</div>
                </div>
                <div class="app-item" onclick="desktop.openApp('https://gmail.com')">
                    <div class="app-icon">📧</div>
                    <div class="app-name">Gmail</div>
                </div>
                <div class="app-item" onclick="desktop.openApp('https://youtube.com')">
                    <div class="app-icon">📺</div>
                    <div class="app-name">YouTube</div>
                </div>
                <div class="app-item" onclick="desktop.openApp('https://github.com')">
                    <div class="app-icon">💻</div>
                    <div class="app-name">GitHub</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(launcher);
        this.launcher = launcher;
    }

    toggleLauncher() {
        if (this.launcher.style.display === 'none') {
            this.launcher.style.display = 'block';
        } else {
            this.launcher.style.display = 'none';
        }
    }

    openBrowser() {
        this.createBrowserWindow();
        this.toggleLauncher();
    }

    openApp(url) {
        this.createBrowserWindow(url);
        this.toggleLauncher();
    }

    createBrowserWindow(url = 'https://www.google.com') {
        const windowId = 'window-' + (++this.windowCounter);
        
        const windowEl = document.createElement('div');
        windowEl.className = 'browser-window';
        windowEl.id = windowId;
        
        windowEl.innerHTML = `
            <div class="window-titlebar">
                <span class="window-title">Nebula Browser</span>
                <div class="window-controls">
                    <button class="window-button" onclick="desktop.minimizeWindow('${windowId}')">_</button>
                    <button class="window-button" onclick="desktop.maximizeWindow('${windowId}')">□</button>
                    <button class="window-button close" onclick="desktop.closeWindow('${windowId}')">×</button>
                </div>
            </div>
            <div class="browser-toolbar">
                <button class="nav-button" onclick="desktop.goBack('${windowId}')">←</button>
                <button class="nav-button" onclick="desktop.goForward('${windowId}')">→</button>
                <button class="nav-button" onclick="desktop.refresh('${windowId}')">↻</button>
                <input type="text" class="url-bar" value="${url}" 
                       onkeypress="if(event.key==='Enter') desktop.navigate('${windowId}', this.value)">
                <button class="nav-button" onclick="desktop.goHome('${windowId}')">🏠</button>
            </div>
            <div class="browser-content">
                <webview id="webview-${windowId}" src="${url}" style="width: 100%; height: 100%;"></webview>
            </div>
        `;
        
        // Position window
        windowEl.style.left = (100 + this.windowCounter * 50) + 'px';
        windowEl.style.top = (50 + this.windowCounter * 30) + 'px';
        
        document.getElementById('desktop').appendChild(windowEl);
        
        // Make window draggable
        this.makeDraggable(windowEl);
        
        this.windows.push(windowId);
    }

    makeDraggable(windowEl) {
        const titlebar = windowEl.querySelector('.window-titlebar');
        let isDragging = false;
        let dragOffsetX = 0;
        let dragOffsetY = 0;

        titlebar.addEventListener('mousedown', (e) => {
            isDragging = true;
            dragOffsetX = e.clientX - windowEl.offsetLeft;
            dragOffsetY = e.clientY - windowEl.offsetTop;
            windowEl.style.zIndex = 1000 + this.windows.length;
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                windowEl.style.left = (e.clientX - dragOffsetX) + 'px';
                windowEl.style.top = (e.clientY - dragOffsetY) + 'px';
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }

    // Window controls
    closeWindow(windowId) {
        const windowEl = document.getElementById(windowId);
        windowEl.remove();
        this.windows = this.windows.filter(id => id !== windowId);
    }

    minimizeWindow(windowId) {
        const windowEl = document.getElementById(windowId);
        windowEl.style.display = 'none';
    }

    maximizeWindow(windowId) {
        const windowEl = document.getElementById(windowId);
        const desktop = document.getElementById('desktop');
        
        if (windowEl.classList.contains('maximized')) {
            windowEl.classList.remove('maximized');
            windowEl.style.width = '800px';
            windowEl.style.height = '600px';
        } else {
            windowEl.classList.add('maximized');
            windowEl.style.width = '100%';
            windowEl.style.height = 'calc(100% - 50px)';
            windowEl.style.left = '0px';
            windowEl.style.top = '0px';
        }
    }

    // Browser navigation
    navigate(windowId, url) {
        const webview = document.getElementById('webview-' + windowId);
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        webview.src = url;
    }

    goBack(windowId) {
        const webview = document.getElementById('webview-' + windowId);
        webview.goBack();
    }

    goForward(windowId) {
        const webview = document.getElementById('webview-' + windowId);
        webview.goForward();
    }

    refresh(windowId) {
        const webview = document.getElementById('webview-' + windowId);
        webview.reload();
    }

    goHome(windowId) {
        this.navigate(windowId, 'https://www.google.com');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.desktop = new NebulaDesktop();
});
