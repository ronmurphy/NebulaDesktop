// Enhanced NebulaSettings App with new customization options
class NebulaSettings {
    constructor() {
        this.windowId = null;
        this.activeTab = 'appearance';
        this.currentTheme = localStorage.getItem('nebula-theme') || 'nebula-slate';
        this.settings = this.loadSettings();
        this.init();
    }

    init() {
        if (!window.windowManager) {
            console.error('WindowManager not available');
            return;
        }
        
        // Create a window for the settings app
        this.windowId = window.windowManager.createWindow({
            title: '⚙️ Settings',
            icon: '⚙️',
            width: 1000,
            height: 700,
            resizable: true,
            maximizable: true,
            minimizable: true
        });
        
        // Load this settings app into the window
        window.windowManager.loadApp(this.windowId, this);
        
        console.log(`Settings app initialized with window ${this.windowId}`);
    }

    loadSettings() {
        const defaultSettings =         this.settings = {
            theme: 'nebula-slate',
            osTheme: 'nebula-slate',
            applyDesktopTheme: false,
            colorScheme: 'auto', // light, dark, auto
            accentColor: 'blue',
            wallpaper: {
                type: 'gradient',
                gradient: {
                    start: '#667eea',
                    end: '#764ba2',
                    direction: '135deg'
                },
                solid: '#1a1a2e',
                image: null
            },
            desktop: {
                showDesktopIcons: true,
                iconSize: 'medium',
                gridSnap: true,
                autoArrange: false,
                showClock: true,
                clockFormat: '24h'
            },
            windows: {
                animationSpeed: 'normal',
                enableAnimations: true,
                enableShadows: true,
                enableBlur: true,
                defaultPosition: 'center',
                enableSnapping: true
            },
            taskbar: {
                position: 'bottom',
                autoHide: false,
                showLabels: true,
                groupSimilar: true,
                showSystemTray: true
            },
            accessibility: {
                reducedMotion: false,
                highContrast: false,
                largeText: false,
                screenReader: false,
                keyboardNavigation: true
            },
            performance: {
                hardwareAcceleration: true,
                enableVSync: true,
                maxFPS: 60,
                enableGPUAcceleration: true,
                memoryOptimization: true
            },
            privacy: {
                saveHistory: true,
                enableAnalytics: false,
                shareUsageData: false,
                clearDataOnExit: false
            }
        };

        const saved = localStorage.getItem('nebula-settings');
        return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    }

    saveSettings() {
        localStorage.setItem('nebula-settings', JSON.stringify(this.settings));
        this.applySettings();
    }

    applySettings() {
        // Apply theme
        document.documentElement.setAttribute('data-theme', this.settings.theme);
        localStorage.setItem('nebula-theme', this.settings.theme);

        // Apply wallpaper
        this.applyWallpaper();

        // Apply desktop settings
        this.applyDesktopSettings();

        // Apply window settings
        this.applyWindowSettings();

        // Apply taskbar settings
        this.applyTaskbarSettings();

        // Apply accessibility settings
        this.applyAccessibilitySettings();

        // Apply performance settings
        this.applyPerformanceSettings();
    }

    applyWallpaper() {
        const desktop = document.getElementById('desktop');
        if (!desktop) return;

        switch (this.settings.wallpaper.type) {
            case 'gradient':
                const { start, end, direction } = this.settings.wallpaper.gradient;
                desktop.style.background = `linear-gradient(${direction}, ${start}, ${end})`;
                break;
            case 'solid':
                desktop.style.background = this.settings.wallpaper.solid;
                break;
            case 'image':
                if (this.settings.wallpaper.image) {
                    desktop.style.background = `url(${this.settings.wallpaper.image}) center/cover`;
                }
                break;
        }
    }

    applyDesktopSettings() {
        const desktop = document.getElementById('desktop');
        if (!desktop) return;

        // Apply desktop icon settings
        desktop.classList.toggle('large-icons', this.settings.desktop.iconSize === 'large');
        desktop.classList.toggle('small-icons', this.settings.desktop.iconSize === 'small');
        desktop.classList.toggle('grid-snap', this.settings.desktop.gridSnap);
    }

    applyWindowSettings() {
        const root = document.documentElement;
        
        // Animation speed
        const speeds = { slow: '0.5s', normal: '0.3s', fast: '0.15s' };
        root.style.setProperty('--nebula-transition', `all ${speeds[this.settings.windows.animationSpeed]} cubic-bezier(0.4, 0, 0.2, 1)`);
        
        // Enable/disable animations
        if (!this.settings.windows.enableAnimations) {
            root.style.setProperty('--nebula-transition', 'none');
        }
    }

    applyTaskbarSettings() {
        const taskbar = document.querySelector('.taskbar');
        if (!taskbar) return;

        // Taskbar position
        taskbar.classList.remove('top', 'bottom', 'left', 'right');
        taskbar.classList.add(this.settings.taskbar.position);

        // Auto-hide
        taskbar.classList.toggle('auto-hide', this.settings.taskbar.autoHide);
    }

    applyAccessibilitySettings() {
        const root = document.documentElement;
        
        // Reduced motion
        if (this.settings.accessibility.reducedMotion) {
            root.style.setProperty('--nebula-transition', 'none');
        }

        // High contrast
        root.classList.toggle('high-contrast', this.settings.accessibility.highContrast);

        // Large text
        root.classList.toggle('large-text', this.settings.accessibility.largeText);
    }

    applyPerformanceSettings() {
        const root = document.documentElement;
        
        // Hardware acceleration
        if (this.settings.performance.hardwareAcceleration) {
            root.style.setProperty('transform', 'translateZ(0)');
        }
    }

    render() {
        const container = document.createElement('div');
        container.className = 'settings-container';
        container.style.cssText = `
            width: 100%;
            height: 100%;
            display: flex;
            background: var(--nebula-bg-primary);
            color: var(--nebula-text-primary);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            overflow: hidden;
        `;
        
        container.innerHTML = `
            <div class="settings-sidebar" style="
                width: 280px;
                background: var(--nebula-surface);
                border-right: 1px solid var(--nebula-border);
                padding: var(--nebula-space-lg) 0;
                overflow-y: auto;
            ">
                <div style="padding: 0 var(--nebula-space-lg) var(--nebula-space-lg) var(--nebula-space-lg); border-bottom: 1px solid var(--nebula-border);">
                    <h1 style="color: var(--nebula-text-primary); margin: 0; font-size: 24px; font-weight: 700;">Settings</h1>
                    <p style="color: var(--nebula-text-secondary); margin: var(--nebula-space-sm) 0 0 0; font-size: 14px;">Customize your NebulaDesktop</p>
                </div>
                
                <nav style="padding: var(--nebula-space-lg) 0;">
                    ${this.renderNavigation()}
                </nav>
            </div>
            
            <div class="settings-content" style="
                flex: 1;
                padding: var(--nebula-space-xl);
                overflow-y: auto;
                background: var(--nebula-bg-primary);
            ">
                <div id="settingsTabContent">
                    <!-- Content will be dynamically loaded here -->
                </div>
            </div>
        `;

        this.setupEventListeners(container);
        this.showTab(this.activeTab, container);

        return container;
    }

    renderNavigation() {
        const tabs = [
            { id: 'appearance', icon: '🎨', label: 'Appearance' },
            { id: 'wallpaper', icon: '🖼️', label: 'Wallpaper' },
            { id: 'desktop', icon: '🖥️', label: 'Desktop' },
            { id: 'windows', icon: '🪟', label: 'Windows' },
            { id: 'taskbar', icon: '📊', label: 'Taskbar' },
            { id: 'accessibility', icon: '♿', label: 'Accessibility' },
            { id: 'performance', icon: '⚡', label: 'Performance' },
            { id: 'privacy', icon: '🔒', label: 'Privacy' }
        ];

        return tabs.map(tab => `
            <div class="nav-item ${this.activeTab === tab.id ? 'active' : ''}" data-tab="${tab.id}" style="
                display: flex;
                align-items: center;
                gap: var(--nebula-space-md);
                padding: var(--nebula-space-md) var(--nebula-space-lg);
                cursor: pointer;
                transition: var(--nebula-transition);
                color: var(--nebula-text-primary);
                border-left: 3px solid ${this.activeTab === tab.id ? 'var(--nebula-primary)' : 'transparent'};
                background: ${this.activeTab === tab.id ? 'var(--nebula-surface-hover)' : 'transparent'};
            ">
                <span style="font-size: 18px;">${tab.icon}</span>
                <span>${tab.label}</span>
            </div>
        `).join('');
    }

    setupEventListeners(container) {
        // Navigation tabs
        const navItems = container.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const tab = item.dataset.tab;
                this.showTab(tab, container);
            });
            
            item.addEventListener('mouseenter', () => {
                if (!item.classList.contains('active')) {
                    item.style.background = 'var(--nebula-surface-hover)';
                }
            });
            
            item.addEventListener('mouseleave', () => {
                if (!item.classList.contains('active')) {
                    item.style.background = 'transparent';
                }
            });
        });
    }

    showTab(tabName, container) {
        this.activeTab = tabName;
        
        // Update navigation
        const navItems = container.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            const isActive = item.dataset.tab === tabName;
            item.classList.toggle('active', isActive);
            item.style.borderLeftColor = isActive ? 'var(--nebula-primary)' : 'transparent';
            item.style.background = isActive ? 'var(--nebula-surface-hover)' : 'transparent';
        });
        
        // Load tab content
        const contentArea = container.querySelector('#settingsTabContent');
        switch (tabName) {
            case 'appearance':
                contentArea.innerHTML = this.renderAppearanceTab();
                this.setupAppearanceListeners(contentArea);
                break;
            case 'wallpaper':
                contentArea.innerHTML = this.renderWallpaperTab();
                this.setupWallpaperListeners(contentArea);
                break;
            case 'desktop':
                contentArea.innerHTML = this.renderDesktopTab();
                this.setupDesktopListeners(contentArea);
                break;
            case 'windows':
                contentArea.innerHTML = this.renderWindowsTab();
                this.setupWindowsListeners(contentArea);
                break;
            case 'taskbar':
                contentArea.innerHTML = this.renderTaskbarTab();
                this.setupTaskbarListeners(contentArea);
                break;
            case 'accessibility':
                contentArea.innerHTML = this.renderAccessibilityTab();
                this.setupAccessibilityListeners(contentArea);
                break;
            case 'performance':
                contentArea.innerHTML = this.renderPerformanceTab();
                this.setupPerformanceListeners(contentArea);
                break;
            case 'privacy':
                contentArea.innerHTML = this.renderPrivacyTab();
                this.setupPrivacyListeners(contentArea);
                break;
        }
    }

    renderAppearanceTab() {
        return `
            <div class="tab-header" style="margin-bottom: var(--nebula-space-xl);">
                <h2 style="color: var(--nebula-text-primary); margin: 0 0 var(--nebula-space-sm) 0; font-size: 28px; font-weight: 700; display: flex; align-items: center; gap: var(--nebula-space-md);">
                    <span style="font-size: 32px;">🎨</span>
                    Appearance
                </h2>
                <p style="color: var(--nebula-text-secondary); margin: 0; font-size: 16px;">Customize colors, themes, and visual style</p>
            </div>

            <div class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: var(--nebula-radius-lg); padding: var(--nebula-space-lg); margin-bottom: var(--nebula-space-lg);">
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 var(--nebula-space-md) 0; font-size: 18px; font-weight: 600;">Operating System Themes</h3>
                <p style="color: var(--nebula-text-secondary); margin: 0 0 var(--nebula-space-lg) 0; font-size: 14px;">Choose a theme that matches your preferred operating system style</p>
                <div class="os-theme-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: var(--nebula-space-md);">
                    ${this.renderOSThemeCard('nebula-slate', 'Nebula', 'Modern glassmorphism design', '🌌')}
                    ${this.renderOSThemeCard('macos', 'macOS', 'Clean Apple-inspired design', '🍎')}
                    ${this.renderOSThemeCard('windows10', 'Windows 10', 'Classic Windows styling', '🪟')}
                    ${this.renderOSThemeCard('windows11', 'Windows 11', 'Modern Windows with rounded corners', '💻')}
                    ${this.renderOSThemeCard('ubuntu', 'Ubuntu', 'Orange-accented Linux theme', '🐧')}
                </div>
                
                <div class="desktop-theme-options" style="margin-top: var(--nebula-space-lg); padding: var(--nebula-space-md); background: var(--nebula-bg-primary); border-radius: var(--nebula-radius-md); border: 1px solid var(--nebula-border);">
                    <label style="display: flex; align-items: center; gap: var(--nebula-space-sm); margin-bottom: var(--nebula-space-sm); cursor: pointer;">
                        <input type="checkbox" id="apply-desktop-theme" ${this.settings.applyDesktopTheme ? 'checked' : ''} style="margin: 0;">
                        <span style="color: var(--nebula-text-primary); font-weight: 500;">Apply theme to desktop UI</span>
                    </label>
                    <p style="font-size: 12px; color: var(--nebula-text-secondary); margin: 0; line-height: 1.4;">
                        When enabled, the selected OS theme will transform the entire desktop interface including the launcher, taskbar, windows, and other UI elements to match the chosen operating system style.
                    </p>
                </div>
            </div>

            <div class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: var(--nebula-radius-lg); padding: var(--nebula-space-lg); margin-bottom: var(--nebula-space-lg);">
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 var(--nebula-space-md) 0; font-size: 18px; font-weight: 600;">Custom Theme</h3>
                <p style="color: var(--nebula-text-secondary); margin: 0 0 var(--nebula-space-lg) 0; font-size: 14px;">Create your own custom color theme</p>
                <div class="color-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--nebula-space-md);">
                    <div>
                        <label style="display: block; margin-bottom: var(--nebula-space-sm); color: var(--nebula-text-primary); font-weight: 500;">Primary Color</label>
                        <div style="display: flex; gap: var(--nebula-space-sm);">
                            <input type="color" id="primaryColor" value="#667eea" style="width: 50px; height: 40px; border: none; border-radius: var(--nebula-radius-md); cursor: pointer;">
                            <input type="text" id="primaryColorText" value="#667eea" style="flex: 1; height: 40px; border: 1px solid var(--nebula-border); border-radius: var(--nebula-radius-md); padding: 0 var(--nebula-space-md); background: var(--nebula-bg-secondary); color: var(--nebula-text-primary);">
                        </div>
                    </div>
                    
                    <div>
                        <label style="display: block; margin-bottom: var(--nebula-space-sm); color: var(--nebula-text-primary); font-weight: 500;">Background Color</label>
                        <div style="display: flex; gap: var(--nebula-space-sm);">
                            <input type="color" id="backgroundColor" value="#1a1a2e" style="width: 50px; height: 40px; border: none; border-radius: var(--nebula-radius-md); cursor: pointer;">
                            <input type="text" id="backgroundColorText" value="#1a1a2e" style="flex: 1; height: 40px; border: 1px solid var(--nebula-border); border-radius: var(--nebula-radius-md); padding: 0 var(--nebula-space-md); background: var(--nebula-bg-secondary); color: var(--nebula-text-primary);">
                        </div>
                    </div>
                    
                    <div>
                        <label style="display: block; margin-bottom: var(--nebula-space-sm); color: var(--nebula-text-primary); font-weight: 500;">Surface Color</label>
                        <div style="display: flex; gap: var(--nebula-space-sm);">
                            <input type="color" id="surfaceColor" value="#16213e" style="width: 50px; height: 40px; border: none; border-radius: var(--nebula-radius-md); cursor: pointer;">
                            <input type="text" id="surfaceColorText" value="#16213e" style="flex: 1; height: 40px; border: 1px solid var(--nebula-border); border-radius: var(--nebula-radius-md); padding: 0 var(--nebula-space-md); background: var(--nebula-bg-secondary); color: var(--nebula-text-primary);">
                        </div>
                    </div>
                    
                    <div>
                        <label style="display: block; margin-bottom: var(--nebula-space-sm); color: var(--nebula-text-primary); font-weight: 500;">Accent Color</label>
                        <div style="display: flex; gap: var(--nebula-space-sm);">
                            <input type="color" id="accentColor" value="#f093fb" style="width: 50px; height: 40px; border: none; border-radius: var(--nebula-radius-md); cursor: pointer;">
                            <input type="text" id="accentColorText" value="#f093fb" style="flex: 1; height: 40px; border: 1px solid var(--nebula-border); border-radius: var(--nebula-radius-md); padding: 0 var(--nebula-space-md); background: var(--nebula-bg-secondary); color: var(--nebula-text-primary);">
                        </div>
                    </div>
                </div>
                
                <div style="margin-top: var(--nebula-space-lg); display: flex; gap: var(--nebula-space-md); flex-wrap: wrap;">
                    <button id="previewCustomTheme" style="background: var(--nebula-primary); color: white; border: none; padding: var(--nebula-space-md) var(--nebula-space-lg); border-radius: var(--nebula-radius-md); cursor: pointer; font-weight: 500;">Preview</button>
                    <button id="applyCustomTheme" style="background: var(--nebula-surface-hover); color: var(--nebula-text-primary); border: 1px solid var(--nebula-border); padding: var(--nebula-space-md) var(--nebula-space-lg); border-radius: var(--nebula-radius-md); cursor: pointer; font-weight: 500;">Apply</button>
                    <button id="resetTheme" style="background: transparent; color: var(--nebula-text-secondary); border: 1px solid var(--nebula-border); padding: var(--nebula-space-md) var(--nebula-space-lg); border-radius: var(--nebula-radius-md); cursor: pointer; font-weight: 500;">Reset</button>
                </div>
            </div>

            <div class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: var(--nebula-radius-lg); padding: var(--nebula-space-lg); margin-bottom: var(--nebula-space-lg);">
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 var(--nebula-space-md) 0; font-size: 18px; font-weight: 600;">Theme Management</h3>
                <div style="display: flex; gap: var(--nebula-space-md); flex-wrap: wrap;">
                    <button id="exportTheme" style="background: var(--nebula-primary); color: white; border: none; padding: var(--nebula-space-md) var(--nebula-space-lg); border-radius: var(--nebula-radius-md); cursor: pointer; font-weight: 500;">Export Theme</button>
                    <button id="importTheme" style="background: var(--nebula-surface-hover); color: var(--nebula-text-primary); border: 1px solid var(--nebula-border); padding: var(--nebula-space-md) var(--nebula-space-lg); border-radius: var(--nebula-radius-md); cursor: pointer; font-weight: 500;">Import Theme</button>
                    <input type="file" id="themeFileInput" accept=".json" style="display: none;">
                    <button id="generateFromWallpaper" style="background: var(--nebula-surface-hover); color: var(--nebula-text-primary); border: 1px solid var(--nebula-border); padding: var(--nebula-space-md) var(--nebula-space-lg); border-radius: var(--nebula-radius-md); cursor: pointer; font-weight: 500;">Generate from Wallpaper</button>
                </div>
            </div>

            <div class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: var(--nebula-radius-lg); padding: var(--nebula-space-lg);">
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 var(--nebula-space-md) 0; font-size: 18px; font-weight: 600;">Color Scheme</h3>
                <div class="color-scheme-options" style="display: flex; gap: var(--nebula-space-md); flex-wrap: wrap;">
                    <label class="radio-option" style="display: flex; align-items: center; gap: var(--nebula-space-sm); cursor: pointer; padding: var(--nebula-space-md); border: 1px solid var(--nebula-border); border-radius: var(--nebula-radius-md); flex: 1; min-width: 150px;">
                        <input type="radio" name="colorScheme" value="light" ${this.settings.colorScheme === 'light' ? 'checked' : ''} style="margin: 0;">
                        <span style="color: var(--nebula-text-primary);">☀️ Light Mode</span>
                    </label>
                    <label class="radio-option" style="display: flex; align-items: center; gap: var(--nebula-space-sm); cursor: pointer; padding: var(--nebula-space-md); border: 1px solid var(--nebula-border); border-radius: var(--nebula-radius-md); flex: 1; min-width: 150px;">
                        <input type="radio" name="colorScheme" value="dark" ${this.settings.colorScheme === 'dark' ? 'checked' : ''} style="margin: 0;">
                        <span style="color: var(--nebula-text-primary);">🌙 Dark Mode</span>
                    </label>
                    <label class="radio-option" style="display: flex; align-items: center; gap: var(--nebula-space-sm); cursor: pointer; padding: var(--nebula-space-md); border: 1px solid var(--nebula-border); border-radius: var(--nebula-radius-md); flex: 1; min-width: 150px;">
                        <input type="radio" name="colorScheme" value="auto" ${this.settings.colorScheme === 'auto' ? 'checked' : ''} style="margin: 0;">
                        <span style="color: var(--nebula-text-primary);">🔄 Auto (System)</span>
                    </label>
                </div>
            </div>

            <div class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: var(--nebula-radius-lg); padding: var(--nebula-space-lg); margin-bottom: var(--nebula-space-lg);">
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 var(--nebula-space-md) 0; font-size: 18px; font-weight: 600;">Theme Selection</h3>
                <div class="theme-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--nebula-space-md);">
                    ${this.renderThemeCard('light', 'Light', 'Clean and bright', '#ffffff', '#f8fafc')}
                    ${this.renderThemeCard('dark', 'Dark', 'Easy on the eyes', '#1e293b', '#0f172a')}
                    ${this.renderThemeCard('nebula-slate', 'Nebula Slate', 'Balanced and modern', '#475569', '#334155')}
                </div>
            </div>

            <div class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: var(--nebula-radius-lg); padding: var(--nebula-space-lg);">
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 var(--nebula-space-md) 0; font-size: 18px; font-weight: 600;">Color Customization</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: var(--nebula-space-md);">
                    <div class="color-picker-group">
                        <label style="color: var(--nebula-text-primary); font-weight: 500; margin-bottom: var(--nebula-space-sm); display: block;">Primary Color</label>
                        <input type="color" id="primaryColor" value="#667eea" style="width: 100%; height: 40px; border: 1px solid var(--nebula-border); border-radius: var(--nebula-radius-md); background: var(--nebula-surface);">
                    </div>
                    <div class="color-picker-group">
                        <label style="color: var(--nebula-text-primary); font-weight: 500; margin-bottom: var(--nebula-space-sm); display: block;">Secondary Color</label>
                        <input type="color" id="secondaryColor" value="#764ba2" style="width: 100%; height: 40px; border: 1px solid var(--nebula-border); border-radius: var(--nebula-radius-md); background: var(--nebula-surface);">
                    </div>
                    <div class="color-picker-group">
                        <label style="color: var(--nebula-text-primary); font-weight: 500; margin-bottom: var(--nebula-space-sm); display: block;">Accent Color</label>
                        <input type="color" id="accentColor" value="#4f46e5" style="width: 100%; height: 40px; border: 1px solid var(--nebula-border); border-radius: var(--nebula-radius-md); background: var(--nebula-surface);">
                    </div>
                </div>
            </div>
        `;
    }

    renderOSThemeCard(themeId, name, description, icon) {
        const isSelected = this.settings.osTheme === themeId;
        return `
            <div class="os-theme-card ${isSelected ? 'selected' : ''}" data-os-theme="${themeId}" style="
                border: 2px solid ${isSelected ? 'var(--nebula-primary)' : 'var(--nebula-border)'};
                border-radius: var(--nebula-radius-lg);
                padding: var(--nebula-space-md);
                cursor: pointer;
                transition: all 0.2s ease;
                background: ${isSelected ? 'var(--nebula-surface-hover)' : 'var(--nebula-surface)'};
                text-align: center;
            ">
                <div style="font-size: 32px; margin-bottom: var(--nebula-space-sm);">${icon}</div>
                <h4 style="color: var(--nebula-text-primary); margin: 0 0 var(--nebula-space-xs) 0; font-size: 16px; font-weight: 600;">${name}</h4>
                <p style="color: var(--nebula-text-secondary); margin: 0; font-size: 12px; line-height: 1.4;">${description}</p>
                ${isSelected ? '<div style="color: var(--nebula-primary); margin-top: var(--nebula-space-sm); font-size: 14px; font-weight: 600;">✓ Active</div>' : ''}
            </div>
        `;
    }

    renderThemeCard(themeId, name, description, color1, color2) {
        const isSelected = this.settings.theme === themeId;
        return `
            <div class="theme-card ${isSelected ? 'selected' : ''}" data-theme="${themeId}" style="
                background: linear-gradient(135deg, ${color1}, ${color2});
                border: 2px solid ${isSelected ? 'var(--nebula-primary)' : 'var(--nebula-border)'};
                border-radius: var(--nebula-radius-lg);
                padding: var(--nebula-space-lg);
                cursor: pointer;
                transition: var(--nebula-transition);
                text-align: center;
                position: relative;
            ">
                <div style="width: 40px; height: 40px; background: linear-gradient(45deg, #667eea, #764ba2); border-radius: var(--nebula-radius-md); margin: 0 auto var(--nebula-space-md) auto;"></div>
                <h4 style="color: ${themeId === 'light' ? '#1a202c' : '#f7fafc'}; margin: 0 0 var(--nebula-space-xs) 0; font-weight: 600;">${name}</h4>
                <p style="color: ${themeId === 'light' ? '#4a5568' : '#cbd5e0'}; margin: 0; font-size: 12px;">${description}</p>
                ${isSelected ? '<div style="position: absolute; top: 8px; right: 8px; color: var(--nebula-primary); font-size: 20px;">✓</div>' : ''}
            </div>
        `;
    }

    renderWallpaperTab() {
        return `
            <div class="tab-header" style="margin-bottom: var(--nebula-space-xl);">
                <h2 style="color: var(--nebula-text-primary); margin: 0 0 var(--nebula-space-sm) 0; font-size: 28px; font-weight: 700; display: flex; align-items: center; gap: var(--nebula-space-md);">
                    <span style="font-size: 32px;">🖼️</span>
                    Wallpaper
                </h2>
                <p style="color: var(--nebula-text-secondary); margin: 0; font-size: 16px;">Customize your desktop background</p>
            </div>

            <div class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: var(--nebula-radius-lg); padding: var(--nebula-space-lg);">
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 var(--nebula-space-md) 0; font-size: 18px; font-weight: 600;">Background Type</h3>
                <div class="wallpaper-options" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--nebula-space-md); margin-bottom: var(--nebula-space-lg);">
                    <div class="wallpaper-option ${this.settings.wallpaper.type === 'gradient' ? 'selected' : ''}" data-type="gradient" style="
                        background: linear-gradient(135deg, #667eea, #764ba2);
                        border: 2px solid ${this.settings.wallpaper.type === 'gradient' ? 'var(--nebula-primary)' : 'var(--nebula-border)'};
                        border-radius: var(--nebula-radius-lg);
                        padding: var(--nebula-space-lg);
                        cursor: pointer;
                        text-align: center;
                        color: white;
                    ">
                        <h4 style="margin: 0 0 var(--nebula-space-xs) 0;">Gradient</h4>
                        <p style="margin: 0; font-size: 12px; opacity: 0.8;">Smooth color transitions</p>
                    </div>
                    <div class="wallpaper-option ${this.settings.wallpaper.type === 'solid' ? 'selected' : ''}" data-type="solid" style="
                        background: ${this.settings.wallpaper.solid};
                        border: 2px solid ${this.settings.wallpaper.type === 'solid' ? 'var(--nebula-primary)' : 'var(--nebula-border)'};
                        border-radius: var(--nebula-radius-lg);
                        padding: var(--nebula-space-lg);
                        cursor: pointer;
                        text-align: center;
                        color: white;
                    ">
                        <h4 style="margin: 0 0 var(--nebula-space-xs) 0;">Solid Color</h4>
                        <p style="margin: 0; font-size: 12px; opacity: 0.8;">Single color background</p>
                    </div>
                    <div class="wallpaper-option ${this.settings.wallpaper.type === 'image' ? 'selected' : ''}" data-type="image" style="
                        background: var(--nebula-surface-elevated);
                        border: 2px solid ${this.settings.wallpaper.type === 'image' ? 'var(--nebula-primary)' : 'var(--nebula-border)'};
                        border-radius: var(--nebula-radius-lg);
                        padding: var(--nebula-space-lg);
                        cursor: pointer;
                        text-align: center;
                        color: var(--nebula-text-primary);
                    ">
                        <h4 style="margin: 0 0 var(--nebula-space-xs) 0;">Image</h4>
                        <p style="margin: 0; font-size: 12px; opacity: 0.8;">Custom image background</p>
                    </div>
                </div>

                <div id="wallpaperControls">
                    ${this.renderWallpaperControls()}
                </div>
            </div>
        `;
    }

    renderWallpaperControls() {
        switch (this.settings.wallpaper.type) {
            case 'gradient':
                return `
                    <div style="display: grid; grid-template-columns: 1fr 1fr auto; gap: var(--nebula-space-md); align-items: end;">
                        <div>
                            <label style="color: var(--nebula-text-primary); font-weight: 500; margin-bottom: var(--nebula-space-sm); display: block;">Start Color</label>
                            <input type="color" id="gradientStart" value="${this.settings.wallpaper.gradient.start}" style="width: 100%; height: 40px; border: 1px solid var(--nebula-border); border-radius: var(--nebula-radius-md);">
                        </div>
                        <div>
                            <label style="color: var(--nebula-text-primary); font-weight: 500; margin-bottom: var(--nebula-space-sm); display: block;">End Color</label>
                            <input type="color" id="gradientEnd" value="${this.settings.wallpaper.gradient.end}" style="width: 100%; height: 40px; border: 1px solid var(--nebula-border); border-radius: var(--nebula-radius-md);">
                        </div>
                        <div>
                            <label style="color: var(--nebula-text-primary); font-weight: 500; margin-bottom: var(--nebula-space-sm); display: block;">Direction</label>
                            <select id="gradientDirection" style="width: 100%; height: 40px; border: 1px solid var(--nebula-border); border-radius: var(--nebula-radius-md); background: var(--nebula-surface); color: var(--nebula-text-primary);">
                                <option value="135deg" ${this.settings.wallpaper.gradient.direction === '135deg' ? 'selected' : ''}>Diagonal ↘</option>
                                <option value="90deg" ${this.settings.wallpaper.gradient.direction === '90deg' ? 'selected' : ''}>Vertical ↓</option>
                                <option value="0deg" ${this.settings.wallpaper.gradient.direction === '0deg' ? 'selected' : ''}>Horizontal →</option>
                                <option value="45deg" ${this.settings.wallpaper.gradient.direction === '45deg' ? 'selected' : ''}>Diagonal ↗</option>
                            </select>
                        </div>
                    </div>
                `;
            case 'solid':
                return `
                    <div>
                        <label style="color: var(--nebula-text-primary); font-weight: 500; margin-bottom: var(--nebula-space-sm); display: block;">Background Color</label>
                        <input type="color" id="solidColor" value="${this.settings.wallpaper.solid}" style="width: 200px; height: 40px; border: 1px solid var(--nebula-border); border-radius: var(--nebula-radius-md);">
                    </div>
                `;
            case 'image':
                return `
                    <div>
                        <label style="color: var(--nebula-text-primary); font-weight: 500; margin-bottom: var(--nebula-space-sm); display: block;">Select Wallpaper Image</label>
                        <div style="display: flex; gap: var(--nebula-space-md); margin-bottom: var(--nebula-space-md);">
                            <input type="file" id="imageUpload" accept="image/*" style="flex: 1; padding: var(--nebula-space-sm); border: 1px solid var(--nebula-border); border-radius: var(--nebula-radius-md); background: var(--nebula-surface); color: var(--nebula-text-primary);">
                            <button id="browseSystemImages" style="background: var(--nebula-primary); color: white; border: none; padding: var(--nebula-space-sm) var(--nebula-space-md); border-radius: var(--nebula-radius-md); cursor: pointer; font-weight: 500; white-space: nowrap;">Browse System</button>
                        </div>
                        ${this.settings.wallpaper.image ? `<p style="color: var(--nebula-text-secondary); margin-bottom: var(--nebula-space-md); font-size: 12px;">Current: ${this.settings.wallpaper.image.substring(0, 50)}...</p>` : ''}
                        
                        <div id="imageBrowser" style="display: none; border: 1px solid var(--nebula-border); border-radius: var(--nebula-radius-md); padding: var(--nebula-space-md); background: var(--nebula-bg-secondary); max-height: 300px; overflow-y: auto;">
                            <div style="display: flex; justify-content: between; align-items: center; margin-bottom: var(--nebula-space-md);">
                                <h4 style="margin: 0; color: var(--nebula-text-primary);">System Images</h4>
                                <button id="closeBrowser" style="background: none; border: none; color: var(--nebula-text-secondary); cursor: pointer; font-size: 18px;">×</button>
                            </div>
                            <div id="imageGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: var(--nebula-space-sm);">
                                <!-- Images will be loaded here -->
                            </div>
                        </div>
                    </div>
                `;
            default:
                return '';
        }
    }

    renderDesktopTab() {
        return `
            <div class="tab-header" style="margin-bottom: var(--nebula-space-xl);">
                <h2 style="color: var(--nebula-text-primary); margin: 0 0 var(--nebula-space-sm) 0; font-size: 28px; font-weight: 700; display: flex; align-items: center; gap: var(--nebula-space-md);">
                    <span style="font-size: 32px;">🖥️</span>
                    Desktop
                </h2>
                <p style="color: var(--nebula-text-secondary); margin: 0; font-size: 16px;">Configure desktop behavior and appearance</p>
            </div>

            <div class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: var(--nebula-radius-lg); padding: var(--nebula-space-lg); margin-bottom: var(--nebula-space-lg);">
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 var(--nebula-space-md) 0; font-size: 18px; font-weight: 600;">Desktop Icons</h3>
                <div style="display: grid; gap: var(--nebula-space-md);">
                    ${this.renderToggle('showDesktopIcons', 'Show Desktop Icons', 'Display application shortcuts on the desktop')}
                    ${this.renderSelect('iconSize', 'Icon Size', [
                        { value: 'small', label: 'Small' },
                        { value: 'medium', label: 'Medium' },
                        { value: 'large', label: 'Large' }
                    ])}
                    ${this.renderToggle('gridSnap', 'Grid Snap', 'Snap icons to an invisible grid')}
                    ${this.renderToggle('autoArrange', 'Auto Arrange', 'Automatically arrange icons')}
                </div>
            </div>

            <div class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: var(--nebula-radius-lg); padding: var(--nebula-space-lg);">
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 var(--nebula-space-md) 0; font-size: 18px; font-weight: 600;">Clock & Time</h3>
                <div style="display: grid; gap: var(--nebula-space-md);">
                    ${this.renderToggle('showClock', 'Show Clock', 'Display clock in the taskbar')}
                    ${this.renderSelect('clockFormat', 'Clock Format', [
                        { value: '12h', label: '12 Hour (AM/PM)' },
                        { value: '24h', label: '24 Hour' }
                    ])}
                </div>
            </div>
        `;
    }

    renderWindowsTab() {
        return `
            <div class="tab-header" style="margin-bottom: var(--nebula-space-xl);">
                <h2 style="color: var(--nebula-text-primary); margin: 0 0 var(--nebula-space-sm) 0; font-size: 28px; font-weight: 700; display: flex; align-items: center; gap: var(--nebula-space-md);">
                    <span style="font-size: 32px;">🪟</span>
                    Windows
                </h2>
                <p style="color: var(--nebula-text-secondary); margin: 0; font-size: 16px;">Configure window behavior and animations</p>
            </div>

            <div class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: var(--nebula-radius-lg); padding: var(--nebula-space-lg); margin-bottom: var(--nebula-space-lg);">
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 var(--nebula-space-md) 0; font-size: 18px; font-weight: 600;">Animations</h3>
                <div style="display: grid; gap: var(--nebula-space-md);">
                    ${this.renderToggle('enableAnimations', 'Enable Animations', 'Animate window open/close and transitions')}
                    ${this.renderSelect('animationSpeed', 'Animation Speed', [
                        { value: 'slow', label: 'Slow' },
                        { value: 'normal', label: 'Normal' },
                        { value: 'fast', label: 'Fast' }
                    ])}
                </div>
            </div>

            <div class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: var(--nebula-radius-lg); padding: var(--nebula-space-lg); margin-bottom: var(--nebula-space-lg);">
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 var(--nebula-space-md) 0; font-size: 18px; font-weight: 600;">Visual Effects</h3>
                <div style="display: grid; gap: var(--nebula-space-md);">
                    ${this.renderToggle('enableShadows', 'Window Shadows', 'Add drop shadows to windows')}
                    ${this.renderToggle('enableBlur', 'Background Blur', 'Blur content behind transparent windows')}
                </div>
            </div>

            <div class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: var(--nebula-radius-lg); padding: var(--nebula-space-lg);">
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 var(--nebula-space-md) 0; font-size: 18px; font-weight: 600;">Window Management</h3>
                <div style="display: grid; gap: var(--nebula-space-md);">
                    ${this.renderSelect('defaultPosition', 'Default Position', [
                        { value: 'center', label: 'Center' },
                        { value: 'cascade', label: 'Cascade' },
                        { value: 'remember', label: 'Remember Last Position' }
                    ])}
                    ${this.renderToggle('enableSnapping', 'Window Snapping', 'Snap windows to screen edges')}
                </div>
            </div>
        `;
    }

    renderTaskbarTab() {
        return `
            <div class="tab-header" style="margin-bottom: var(--nebula-space-xl);">
                <h2 style="color: var(--nebula-text-primary); margin: 0 0 var(--nebula-space-sm) 0; font-size: 28px; font-weight: 700; display: flex; align-items: center; gap: var(--nebula-space-md);">
                    <span style="font-size: 32px;">📊</span>
                    Taskbar
                </h2>
                <p style="color: var(--nebula-text-secondary); margin: 0; font-size: 16px;">Customize taskbar appearance and behavior</p>
            </div>

            <div class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: var(--nebula-radius-lg); padding: var(--nebula-space-lg); margin-bottom: var(--nebula-space-lg);">
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 var(--nebula-space-md) 0; font-size: 18px; font-weight: 600;">Position & Behavior</h3>
                <div style="display: grid; gap: var(--nebula-space-md);">
                    ${this.renderSelect('position', 'Position', [
                        { value: 'top', label: 'Top' },
                        { value: 'bottom', label: 'Bottom' },
                        { value: 'left', label: 'Left' },
                        { value: 'right', label: 'Right' }
                    ])}
                    ${this.renderToggle('autoHide', 'Auto Hide', 'Automatically hide taskbar when not in use')}
                </div>
            </div>

            <div class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: var(--nebula-radius-lg); padding: var(--nebula-space-lg);">
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 var(--nebula-space-md) 0; font-size: 18px; font-weight: 600;">Display Options</h3>
                <div style="display: grid; gap: var(--nebula-space-md);">
                    ${this.renderToggle('showLabels', 'Show Labels', 'Display application names in taskbar')}
                    ${this.renderToggle('groupSimilar', 'Group Similar', 'Group similar applications together')}
                    ${this.renderToggle('showSystemTray', 'Show System Tray', 'Display system tray icons')}
                </div>
            </div>
        `;
    }

    renderAccessibilityTab() {
        return `
            <div class="tab-header" style="margin-bottom: var(--nebula-space-xl);">
                <h2 style="color: var(--nebula-text-primary); margin: 0 0 var(--nebula-space-sm) 0; font-size: 28px; font-weight: 700; display: flex; align-items: center; gap: var(--nebula-space-md);">
                    <span style="font-size: 32px;">♿</span>
                    Accessibility
                </h2>
                <p style="color: var(--nebula-text-secondary); margin: 0; font-size: 16px;">Make NebulaDesktop more accessible</p>
            </div>

            <div class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: var(--nebula-radius-lg); padding: var(--nebula-space-lg); margin-bottom: var(--nebula-space-lg);">
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 var(--nebula-space-md) 0; font-size: 18px; font-weight: 600;">Visual Accessibility</h3>
                <div style="display: grid; gap: var(--nebula-space-md);">
                    ${this.renderToggle('reducedMotion', 'Reduced Motion', 'Minimize animations and transitions')}
                    ${this.renderToggle('highContrast', 'High Contrast', 'Increase contrast for better visibility')}
                    ${this.renderToggle('largeText', 'Large Text', 'Increase text size throughout the interface')}
                </div>
            </div>

            <div class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: var(--nebula-radius-lg); padding: var(--nebula-space-lg);">
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 var(--nebula-space-md) 0; font-size: 18px; font-weight: 600;">Input & Navigation</h3>
                <div style="display: grid; gap: var(--nebula-space-md);">
                    ${this.renderToggle('keyboardNavigation', 'Keyboard Navigation', 'Enable full keyboard navigation')}
                    ${this.renderToggle('screenReader', 'Screen Reader Support', 'Optimize for screen readers')}
                </div>
            </div>
        `;
    }

    renderPerformanceTab() {
        return `
            <div class="tab-header" style="margin-bottom: var(--nebula-space-xl);">
                <h2 style="color: var(--nebula-text-primary); margin: 0 0 var(--nebula-space-sm) 0; font-size: 28px; font-weight: 700; display: flex; align-items: center; gap: var(--nebula-space-md);">
                    <span style="font-size: 32px;">⚡</span>
                    Performance
                </h2>
                <p style="color: var(--nebula-text-secondary); margin: 0; font-size: 16px;">Optimize system performance and resource usage</p>
            </div>

            <div class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: var(--nebula-radius-lg); padding: var(--nebula-space-lg); margin-bottom: var(--nebula-space-lg);">
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 var(--nebula-space-md) 0; font-size: 18px; font-weight: 600;">Graphics & Rendering</h3>
                <div style="display: grid; gap: var(--nebula-space-md);">
                    ${this.renderToggle('hardwareAcceleration', 'Hardware Acceleration', 'Use GPU for better performance')}
                    ${this.renderToggle('enableVSync', 'VSync', 'Synchronize with display refresh rate')}
                    ${this.renderToggle('enableGPUAcceleration', 'GPU Acceleration', 'Enable GPU-accelerated rendering')}
                </div>
            </div>

            <div class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: var(--nebula-radius-lg); padding: var(--nebula-space-lg); margin-bottom: var(--nebula-space-lg);">
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 var(--nebula-space-md) 0; font-size: 18px; font-weight: 600;">Frame Rate</h3>
                <div style="display: grid; gap: var(--nebula-space-md);">
                    ${this.renderSelect('maxFPS', 'Maximum FPS', [
                        { value: 30, label: '30 FPS (Power Saving)' },
                        { value: 60, label: '60 FPS (Balanced)' },
                        { value: 120, label: '120 FPS (High Performance)' },
                        { value: 144, label: '144 FPS (Gaming)' }
                    ])}
                </div>
            </div>

            <div class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: var(--nebula-radius-lg); padding: var(--nebula-space-lg);">
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 var(--nebula-space-md) 0; font-size: 18px; font-weight: 600;">Memory & Storage</h3>
                <div style="display: grid; gap: var(--nebula-space-md);">
                    ${this.renderToggle('memoryOptimization', 'Memory Optimization', 'Optimize memory usage for better performance')}
                </div>
            </div>
        `;
    }

    renderPrivacyTab() {
        return `
            <div class="tab-header" style="margin-bottom: var(--nebula-space-xl);">
                <h2 style="color: var(--nebula-text-primary); margin: 0 0 var(--nebula-space-sm) 0; font-size: 28px; font-weight: 700; display: flex; align-items: center; gap: var(--nebula-space-md);">
                    <span style="font-size: 32px;">🔒</span>
                    Privacy
                </h2>
                <p style="color: var(--nebula-text-secondary); margin: 0; font-size: 16px;">Control your privacy and data settings</p>
            </div>

            <div class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: var(--nebula-radius-lg); padding: var(--nebula-space-lg); margin-bottom: var(--nebula-space-lg);">
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 var(--nebula-space-md) 0; font-size: 18px; font-weight: 600;">Data Collection</h3>
                <div style="display: grid; gap: var(--nebula-space-md);">
                    ${this.renderToggle('saveHistory', 'Save History', 'Save application and browsing history')}
                    ${this.renderToggle('enableAnalytics', 'Analytics', 'Help improve NebulaDesktop by sharing usage data')}
                    ${this.renderToggle('shareUsageData', 'Usage Data', 'Share anonymous usage statistics')}
                </div>
            </div>

            <div class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: var(--nebula-radius-lg); padding: var(--nebula-space-lg);">
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 var(--nebula-space-md) 0; font-size: 18px; font-weight: 600;">Data Management</h3>
                <div style="display: grid; gap: var(--nebula-space-md);">
                    ${this.renderToggle('clearDataOnExit', 'Clear Data on Exit', 'Automatically clear temporary data when closing')}
                    <div style="padding: var(--nebula-space-md); border: 1px solid var(--nebula-border); border-radius: var(--nebula-radius-md);">
                        <button id="clearAllData" style="
                            background: var(--nebula-danger);
                            color: white;
                            border: none;
                            padding: var(--nebula-space-sm) var(--nebula-space-md);
                            border-radius: var(--nebula-radius-md);
                            cursor: pointer;
                            font-weight: 500;
                        ">Clear All Data</button>
                        <p style="color: var(--nebula-text-secondary); margin: var(--nebula-space-sm) 0 0 0; font-size: 12px;">This will remove all stored data including settings, history, and local files.</p>
                    </div>
                </div>
            </div>
        `;
    }

    renderToggle(settingKey, label, description) {
        const isChecked = this.getNestedSetting(settingKey);
        return `
            <div class="setting-item" style="display: flex; justify-content: space-between; align-items: center; padding: var(--nebula-space-md); border: 1px solid var(--nebula-border); border-radius: var(--nebula-radius-md);">
                <div>
                    <h4 style="color: var(--nebula-text-primary); margin: 0 0 var(--nebula-space-xs) 0; font-weight: 500;">${label}</h4>
                    <p style="color: var(--nebula-text-secondary); margin: 0; font-size: 12px;">${description}</p>
                </div>
                <label class="toggle-switch" style="position: relative; display: inline-block; width: 50px; height: 24px;">
                    <input type="checkbox" data-setting="${settingKey}" ${isChecked ? 'checked' : ''} style="opacity: 0; width: 0; height: 0;">
                    <span style="
                        position: absolute;
                        cursor: pointer;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: ${isChecked ? 'var(--nebula-primary)' : 'var(--nebula-border)'};
                        transition: var(--nebula-transition);
                        border-radius: 24px;
                    ">
                        <span style="
                            position: absolute;
                            content: '';
                            height: 18px;
                            width: 18px;
                            left: ${isChecked ? '29px' : '3px'};
                            bottom: 3px;
                            background: white;
                            transition: var(--nebula-transition);
                            border-radius: 50%;
                        "></span>
                    </span>
                </label>
            </div>
        `;
    }

    renderSelect(settingKey, label, options) {
        const currentValue = this.getNestedSetting(settingKey);
        return `
            <div class="setting-item" style="padding: var(--nebula-space-md); border: 1px solid var(--nebula-border); border-radius: var(--nebula-radius-md);">
                <label style="color: var(--nebula-text-primary); font-weight: 500; margin-bottom: var(--nebula-space-sm); display: block;">${label}</label>
                <select data-setting="${settingKey}" style="
                    width: 100%;
                    height: 40px;
                    border: 1px solid var(--nebula-border);
                    border-radius: var(--nebula-radius-md);
                    background: var(--nebula-surface);
                    color: var(--nebula-text-primary);
                    padding: 0 var(--nebula-space-md);
                ">
                    ${options.map(option => `
                        <option value="${option.value}" ${currentValue === option.value ? 'selected' : ''}>${option.label}</option>
                    `).join('')}
                </select>
            </div>
        `;
    }

    getNestedSetting(key) {
        const keys = key.split('.');
        let value = this.settings;
        for (const k of keys) {
            value = value[k];
            if (value === undefined) return false;
        }
        return value;
    }

    setNestedSetting(key, value) {
        const keys = key.split('.');
        let obj = this.settings;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!obj[keys[i]]) obj[keys[i]] = {};
            obj = obj[keys[i]];
        }
        obj[keys[keys.length - 1]] = value;
    }

    setupAppearanceListeners(container) {
        // OS Theme selection
        container.querySelectorAll('.os-theme-card').forEach(card => {
            card.addEventListener('click', () => {
                const osTheme = card.dataset.osTheme;
                this.settings.osTheme = osTheme;
                this.applyOSTheme(osTheme);
                this.saveSettings();
                this.showTab('appearance', container.closest('.settings-container'));
            });
        });

        // Desktop theme transformation checkbox
        const applyDesktopThemeCheckbox = container.querySelector('#apply-desktop-theme');
        if (applyDesktopThemeCheckbox) {
            applyDesktopThemeCheckbox.addEventListener('change', () => {
                this.settings.applyDesktopTheme = applyDesktopThemeCheckbox.checked;
                this.applyDesktopTheme(this.settings.osTheme, applyDesktopThemeCheckbox.checked);
                this.saveSettings();
            });
        }

        // Color scheme selection
        container.querySelectorAll('input[name="colorScheme"]').forEach(radio => {
            radio.addEventListener('change', () => {
                if (radio.checked) {
                    this.settings.colorScheme = radio.value;
                    this.applyColorScheme(radio.value);
                    this.saveSettings();
                }
            });
        });

        // Theme selection
        container.querySelectorAll('.theme-card').forEach(card => {
            card.addEventListener('click', () => {
                const theme = card.dataset.theme;
                this.settings.theme = theme;
                this.saveSettings();
                this.showTab('appearance', container.closest('.settings-container'));
            });
        });

        // Color pickers
        const colorInputs = ['primaryColor', 'secondaryColor', 'accentColor'];
        colorInputs.forEach(id => {
            const input = container.querySelector(`#${id}`);
            if (input) {
                input.addEventListener('change', () => {
                    // Apply custom colors
                    const root = document.documentElement;
                    root.style.setProperty(`--nebula-${id.replace('Color', '')}`, input.value);
                });
            }
        });

        // Custom theme color pickers
        const customColorPairs = [
            ['primaryColor', 'primaryColorText'],
            ['backgroundColor', 'backgroundColorText'],
            ['surfaceColor', 'surfaceColorText'],
            ['accentColor', 'accentColorText']
        ];
        
        customColorPairs.forEach(([pickerId, textId]) => {
            const picker = container.querySelector(`#${pickerId}`);
            const text = container.querySelector(`#${textId}`);
            
            if (picker && text) {
                picker.addEventListener('input', () => {
                    text.value = picker.value;
                });
                
                text.addEventListener('input', () => {
                    if (this.isValidColor(text.value)) {
                        picker.value = text.value;
                    }
                });
            }
        });

        // Custom theme buttons
        const previewBtn = container.querySelector('#previewCustomTheme');
        const applyBtn = container.querySelector('#applyCustomTheme');
        const resetBtn = container.querySelector('#resetTheme');
        const exportBtn = container.querySelector('#exportTheme');
        const importBtn = container.querySelector('#importTheme');
        const generateBtn = container.querySelector('#generateFromWallpaper');
        const fileInput = container.querySelector('#themeFileInput');
        
        previewBtn?.addEventListener('click', () => this.previewCustomTheme(container));
        applyBtn?.addEventListener('click', () => this.applyCustomTheme(container));
        resetBtn?.addEventListener('click', () => this.resetToDefaultTheme());
        exportBtn?.addEventListener('click', () => this.exportCurrentTheme());
        importBtn?.addEventListener('click', () => fileInput.click());
        generateBtn?.addEventListener('click', () => this.generateThemeFromWallpaper());
        fileInput?.addEventListener('change', (e) => this.importTheme(e.target.files[0]));
    }

    isValidColor(color) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
    }

    previewCustomTheme(container) {
        const colors = this.getCustomThemeColors(container);
        this.applyThemeColors(colors);
    }

    applyCustomTheme(container) {
        const colors = this.getCustomThemeColors(container);
        this.applyThemeColors(colors);
        this.saveCustomTheme(colors);
    }

    getCustomThemeColors(container) {
        return {
            primary: container.querySelector('#primaryColor').value,
            background: container.querySelector('#backgroundColor').value,
            surface: container.querySelector('#surfaceColor').value,
            accent: container.querySelector('#accentColor').value
        };
    }

    applyThemeColors(colors) {
        const root = document.documentElement;
        root.style.setProperty('--nebula-primary', colors.primary);
        root.style.setProperty('--nebula-bg-primary', colors.background);
        root.style.setProperty('--nebula-surface', colors.surface);
        root.style.setProperty('--nebula-accent', colors.accent);
    }

    saveCustomTheme(colors) {
        localStorage.setItem('nebula-custom-theme', JSON.stringify(colors));
    }

    resetToDefaultTheme() {
        localStorage.removeItem('nebula-custom-theme');
        location.reload(); // Simple reset by reloading
    }

    exportCurrentTheme() {
        const theme = {
            name: 'Custom Nebula Theme',
            colors: this.getCustomThemeColors(document),
            wallpaper: this.settings.wallpaper,
            timestamp: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(theme, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'nebula-theme.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    importTheme(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const theme = JSON.parse(e.target.result);
                if (theme.colors) {
                    this.applyThemeColors(theme.colors);
                    this.saveCustomTheme(theme.colors);
                }
                if (theme.wallpaper) {
                    this.settings.wallpaper = theme.wallpaper;
                    this.saveSettings();
                }
                alert('Theme imported successfully!');
            } catch (error) {
                alert('Error importing theme: Invalid file format');
            }
        };
        reader.readAsText(file);
    }

    generateThemeFromWallpaper() {
        // Simple color extraction from wallpaper (placeholder implementation)
        const colors = {
            primary: '#667eea',
            background: '#1a1a2e',
            surface: '#16213e',
            accent: '#f093fb'
        };
        this.applyThemeColors(colors);
        alert('Theme generated from wallpaper! (This is a placeholder implementation)');
    }

    setupWallpaperListeners(container) {
        // Wallpaper type selection
        container.querySelectorAll('.wallpaper-option').forEach(option => {
            option.addEventListener('click', () => {
                const type = option.dataset.type;
                this.settings.wallpaper.type = type;
                this.saveSettings();
                
                // Update controls
                const controlsContainer = container.querySelector('#wallpaperControls');
                controlsContainer.innerHTML = this.renderWallpaperControls();
                this.setupWallpaperControlListeners(container);
            });
        });

        this.setupWallpaperControlListeners(container);
    }

    setupWallpaperControlListeners(container) {
        // Gradient controls
        const gradientStart = container.querySelector('#gradientStart');
        const gradientEnd = container.querySelector('#gradientEnd');
        const gradientDirection = container.querySelector('#gradientDirection');
        
        if (gradientStart) {
            gradientStart.addEventListener('change', () => {
                this.settings.wallpaper.gradient.start = gradientStart.value;
                this.saveSettings();
                this.applyWallpaper();
            });
        }
        
        if (gradientEnd) {
            gradientEnd.addEventListener('change', () => {
                this.settings.wallpaper.gradient.end = gradientEnd.value;
                this.saveSettings();
                this.applyWallpaper();
            });
        }
        
        if (gradientDirection) {
            gradientDirection.addEventListener('change', () => {
                this.settings.wallpaper.gradient.direction = gradientDirection.value;
                this.saveSettings();
                this.applyWallpaper();
            });
        }

        // Solid color control
        const solidColor = container.querySelector('#solidColor');
        if (solidColor) {
            solidColor.addEventListener('change', () => {
                this.settings.wallpaper.solid = solidColor.value;
                this.saveSettings();
                this.applyWallpaper();
            });
        }

        // Image upload control
        const imageUpload = container.querySelector('#imageUpload');
        if (imageUpload) {
            imageUpload.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        this.settings.wallpaper.image = event.target.result;
                        this.saveSettings();
                        this.applyWallpaper();
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        // System image browser
        const browseBtn = container.querySelector('#browseSystemImages');
        const imageBrowser = container.querySelector('#imageBrowser');
        const closeBrowser = container.querySelector('#closeBrowser');
        
        if (browseBtn) {
            browseBtn.addEventListener('click', () => {
                imageBrowser.style.display = 'block';
                this.loadSystemImages(container);
            });
        }
        
        if (closeBrowser) {
            closeBrowser.addEventListener('click', () => {
                imageBrowser.style.display = 'none';
            });
        }
    }

    async loadSystemImages(container) {
        const imageGrid = container.querySelector('#imageGrid');
        imageGrid.innerHTML = '<p style="color: var(--nebula-text-secondary);">Loading system images...</p>';
        
        try {
            // Try to access real file system if available
            if (window.nebula?.fs?.getHomeDir) {
                const homeDir = await window.nebula.fs.getHomeDir();
                const picturesPath = `${homeDir}/Pictures`;
                
                try {
                    const files = await window.nebula.fs.readDir(picturesPath);
                    const imageFiles = files.filter(file => 
                        /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(file)
                    );
                    
                    if (imageFiles.length > 0) {
                        imageGrid.innerHTML = imageFiles.map(file => `
                            <div class="image-thumbnail" data-path="${picturesPath}/${file}" style="
                                border: 1px solid var(--nebula-border);
                                border-radius: var(--nebula-radius-sm);
                                padding: var(--nebula-space-sm);
                                cursor: pointer;
                                text-align: center;
                                background: var(--nebula-surface);
                                transition: var(--nebula-transition);
                            ">
                                <div style="font-size: 24px; margin-bottom: var(--nebula-space-xs);">🖼️</div>
                                <div style="font-size: 10px; color: var(--nebula-text-secondary); word-break: break-all;">${file}</div>
                            </div>
                        `).join('');
                        
                        // Add click handlers for image selection
                        imageGrid.querySelectorAll('.image-thumbnail').forEach(thumb => {
                            thumb.addEventListener('click', async () => {
                                const imagePath = thumb.dataset.path;
                                try {
                                    // For real files, we'd need to read and convert to data URL
                                    // For now, just store the path
                                    this.settings.wallpaper.image = imagePath;
                                    this.saveSettings();
                                    this.applyWallpaper();
                                    container.querySelector('#imageBrowser').style.display = 'none';
                                } catch (error) {
                                    alert('Error loading image: ' + error.message);
                                }
                            });
                            
                            thumb.addEventListener('mouseenter', () => {
                                thumb.style.background = 'var(--nebula-surface-hover)';
                            });
                            
                            thumb.addEventListener('mouseleave', () => {
                                thumb.style.background = 'var(--nebula-surface)';
                            });
                        });
                    } else {
                        imageGrid.innerHTML = '<p style="color: var(--nebula-text-secondary);">No images found in Pictures folder</p>';
                    }
                } catch (error) {
                    imageGrid.innerHTML = '<p style="color: var(--nebula-text-secondary);">Could not access Pictures folder</p>';
                }
            } else {
                imageGrid.innerHTML = '<p style="color: var(--nebula-text-secondary);">File system access not available. Please run as Electron app.</p>';
            }
        } catch (error) {
            imageGrid.innerHTML = '<p style="color: var(--nebula-text-secondary);">Error loading images: ' + error.message + '</p>';
        }
    }

    applyWallpaper() {
        const body = document.body;
        
        switch (this.settings.wallpaper.type) {
            case 'gradient':
                body.style.background = `linear-gradient(${this.settings.wallpaper.gradient.direction}, ${this.settings.wallpaper.gradient.start}, ${this.settings.wallpaper.gradient.end})`;
                break;
            case 'solid':
                body.style.background = this.settings.wallpaper.solid;
                break;
            case 'image':
                if (this.settings.wallpaper.image) {
                    body.style.background = `url(${this.settings.wallpaper.image}) center/cover no-repeat`;
                }
                break;
        }
    }

    applyOSTheme(osTheme) {
        const body = document.body;
        const html = document.documentElement;
        
        // Remove existing OS theme classes
        const osThemes = ['nebula-slate', 'macos', 'macos-dark', 'windows10', 'windows10-dark', 'windows11', 'windows11-dark', 'ubuntu', 'ubuntu-dark'];
        osThemes.forEach(theme => {
            body.classList.remove(`theme-${theme}`);
            html.removeAttribute('data-theme');
        });

        // Apply new OS theme
        let finalTheme = osTheme;
        
        // Handle dark mode variants based on color scheme
        if (this.settings.colorScheme === 'dark' && ['macos', 'windows10', 'windows11', 'ubuntu'].includes(osTheme)) {
            finalTheme = `${osTheme}-dark`;
        } else if (this.settings.colorScheme === 'auto') {
            // Check system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark && ['macos', 'windows10', 'windows11', 'ubuntu'].includes(osTheme)) {
                finalTheme = `${osTheme}-dark`;
            }
        }

        html.setAttribute('data-theme', finalTheme);
        body.classList.add(`theme-${finalTheme}`);
        
        // Apply desktop theme transformation if enabled
        if (this.settings.applyDesktopTheme) {
            this.applyDesktopTheme(osTheme, true);
        }
        
        console.log(`Applied OS theme: ${finalTheme}`);
    }

    applyDesktopTheme(osTheme, enabled) {
        const body = document.body;
        
        // Remove existing desktop theme classes
        const desktopThemes = ['desktop-theme-nebula', 'desktop-theme-macos', 'desktop-theme-windows10', 'desktop-theme-windows11', 'desktop-theme-ubuntu'];
        desktopThemes.forEach(theme => {
            body.classList.remove(theme);
        });
        
        if (enabled) {
            // Map OS themes to desktop theme classes
            const themeMap = {
                'nebula-slate': 'desktop-theme-nebula',
                'macos': 'desktop-theme-macos',
                'windows10': 'desktop-theme-windows10',
                'windows11': 'desktop-theme-windows11',
                'ubuntu': 'desktop-theme-ubuntu'
            };
            
            const desktopThemeClass = themeMap[osTheme] || 'desktop-theme-nebula';
            body.classList.add(desktopThemeClass);
            
            console.log(`Applied desktop theme: ${desktopThemeClass}`);
            
            // Show confirmation dialog for first-time users
            if (!localStorage.getItem('desktop-theme-shown')) {
                setTimeout(() => {
                    const message = `Desktop UI has been transformed to match the ${osTheme} theme!\n\nThis affects:\n• Launcher layout and styling\n• Taskbar position and appearance\n• Window controls and borders\n• Overall desktop behavior\n\nYou can disable this in Settings > Appearance > Apply theme to desktop UI`;
                    alert(message);
                    localStorage.setItem('desktop-theme-shown', 'true');
                }, 1000);
            }
        } else {
            // Reset to default Nebula desktop theme
            body.classList.add('desktop-theme-nebula');
            console.log('Reset to default Nebula desktop theme');
        }
    }

    applyColorScheme(colorScheme) {
        if (colorScheme === 'auto') {
            // Listen for system changes
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = () => this.applyOSTheme(this.settings.osTheme);
            mediaQuery.removeEventListener('change', handleChange);
            mediaQuery.addEventListener('change', handleChange);
        }
        
        // Reapply OS theme with new color scheme
        this.applyOSTheme(this.settings.osTheme);
    }

    setupWallpaperListeners(container) {
        // Wallpaper type selection
        container.querySelectorAll('.wallpaper-option').forEach(option => {
            option.addEventListener('click', () => {
                const type = option.dataset.type;
                this.settings.wallpaper.type = type;
                this.saveSettings();
                
                // Update controls
                const controlsArea = container.querySelector('#wallpaperControls');
                controlsArea.innerHTML = this.renderWallpaperControls();
                this.setupWallpaperControlListeners(container);
                
                // Update selection
                container.querySelectorAll('.wallpaper-option').forEach(opt => {
                    opt.style.borderColor = opt.dataset.type === type ? 'var(--nebula-primary)' : 'var(--nebula-border)';
                });
            });
        });

        this.setupWallpaperControlListeners(container);
    }

    setupWallpaperControlListeners(container) {
        // Gradient controls
        const gradientStart = container.querySelector('#gradientStart');
        const gradientEnd = container.querySelector('#gradientEnd');
        const gradientDirection = container.querySelector('#gradientDirection');

        if (gradientStart) {
            gradientStart.addEventListener('change', () => {
                this.settings.wallpaper.gradient.start = gradientStart.value;
                this.saveSettings();
            });
        }

        if (gradientEnd) {
            gradientEnd.addEventListener('change', () => {
                this.settings.wallpaper.gradient.end = gradientEnd.value;
                this.saveSettings();
            });
        }

        if (gradientDirection) {
            gradientDirection.addEventListener('change', () => {
                this.settings.wallpaper.gradient.direction = gradientDirection.value;
                this.saveSettings();
            });
        }

        // Solid color control
        const solidColor = container.querySelector('#solidColor');
        if (solidColor) {
            solidColor.addEventListener('change', () => {
                this.settings.wallpaper.solid = solidColor.value;
                this.saveSettings();
            });
        }

        // Image upload
        const imageUpload = container.querySelector('#imageUpload');
        if (imageUpload) {
            imageUpload.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        this.settings.wallpaper.image = e.target.result;
                        this.saveSettings();
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    }

    setupDesktopListeners(container) {
        this.setupGenericListeners(container, 'desktop');
    }

    setupWindowsListeners(container) {
        this.setupGenericListeners(container, 'windows');
    }

    setupTaskbarListeners(container) {
        this.setupGenericListeners(container, 'taskbar');
    }

    setupAccessibilityListeners(container) {
        this.setupGenericListeners(container, 'accessibility');
    }

    setupPerformanceListeners(container) {
        this.setupGenericListeners(container, 'performance');
    }

    setupPrivacyListeners(container) {
        this.setupGenericListeners(container, 'privacy');

        // Clear all data button
        const clearButton = container.querySelector('#clearAllData');
        if (clearButton) {
            clearButton.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
                    localStorage.clear();
                    location.reload();
                }
            });
        }
    }

    setupGenericListeners(container, category) {
        // Toggle switches
        container.querySelectorAll('input[type="checkbox"]').forEach(toggle => {
            toggle.addEventListener('change', () => {
                const setting = toggle.dataset.setting;
                const value = toggle.checked;
                
                if (setting.includes('.')) {
                    this.setNestedSetting(setting, value);
                } else {
                    this.settings[category][setting] = value;
                }
                
                this.saveSettings();
                
                // Update toggle appearance
                const slider = toggle.nextElementSibling;
                const knob = slider.querySelector('span');
                slider.style.background = value ? 'var(--nebula-primary)' : 'var(--nebula-border)';
                knob.style.left = value ? '29px' : '3px';
            });
        });

        // Select dropdowns
        container.querySelectorAll('select').forEach(select => {
            select.addEventListener('change', () => {
                const setting = select.dataset.setting;
                const value = select.value;
                
                if (setting.includes('.')) {
                    this.setNestedSetting(setting, value);
                } else {
                    this.settings[category][setting] = value;
                }
                
                this.saveSettings();
            });
        });
    }

    getTitle() {
        return 'Settings';
    }

    getIcon() {
        return '⚙️';
    }

    cleanup() {
        // Cleanup when window is closed
        console.log('Settings app cleanup');
    }
}

// Export for use in other files
window.NebulaSettings = NebulaSettings;

