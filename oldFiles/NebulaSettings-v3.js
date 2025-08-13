// NebulaSettings.js - Advanced Settings with Theming, Wallpapers, Cursors, etc.
class NebulaSettings {
    constructor() {
        this.windowId = null;
        this.currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        this.activeTab = 'appearance';
        
        // Default custom theme values
        this.customTheme = {
            name: 'Custom Theme',
            colors: {
                primary: '#667eea',
                secondary: '#764ba2',
                accent: '#4f46e5',
                success: '#10b981',
                warning: '#f59e0b',
                danger: '#ef4444',
                bgPrimary: '#ffffff',
                bgSecondary: '#f8fafc',
                surface: '#ffffff',
                textPrimary: '#1e293b',
                textSecondary: '#64748b',
                border: '#e2e8f0'
            },
            window: {
                borderRadius: 12,
                shadowIntensity: 0.35,
                glassBlur: 10,
                titlebarHeight: 40,
                opacity: 1.0
            }
        };
        
        // Wallpaper settings
        this.wallpaperSettings = {
            type: 'gradient', // 'image', 'gradient', 'solid'
            imagePath: '',
            gradientStart: '#667eea',
            gradientEnd: '#764ba2',
            gradientDirection: '135deg',
            solidColor: '#667eea',
            fitMode: 'cover', // 'cover', 'contain', 'stretch', 'tile', 'center'
            slideshow: false,
            slideshowInterval: 300 // seconds
        };
        
        // Load saved settings
        this.loadSettings();
        
        this.init();
    }
    
    async init() {
        if (!window.windowManager) {
            console.error('WindowManager not available');
            return;
        }
        
        // Create settings window
        this.windowId = window.windowManager.createWindow({
            title: 'Settings',
            width: 900,
            height: 700,
            hasTabBar: false,
            resizable: true
        });
        
        // Load settings into window
        window.windowManager.loadApp(this.windowId, this);
        
        console.log(`Settings initialized with window ${this.windowId}`);
    }
    
    /**
     * Called by WindowManager to render the settings content
     */
    render() {
        const container = document.createElement('div');
        container.className = 'settings-container';
        container.style.cssText = `
            width: 100%;
            height: 100%;
            background: var(--nebula-bg-primary);
            display: flex;
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        container.innerHTML = `
            <!-- Settings Sidebar -->
            <div class="settings-sidebar" style="
                width: 250px;
                background: var(--nebula-surface);
                border-right: 1px solid var(--nebula-border);
                padding: 20px 0;
                overflow-y: auto;
                flex-shrink: 0;
            ">
                <div style="padding: 0 20px 20px 20px;">
                    <h1 style="color: var(--nebula-text-primary); font-size: 24px; font-weight: 700; margin: 0; display: flex; align-items: center; gap: 10px;">
                        <span class="material-symbols-outlined" style="font-size: 28px; background: linear-gradient(135deg, var(--nebula-primary), var(--nebula-secondary)); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;">settings</span>
                        Settings
                    </h1>
                </div>
                
                <nav class="settings-nav">
                    <div class="nav-item ${this.activeTab === 'appearance' ? 'active' : ''}" data-tab="appearance" style="
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        padding: 12px 20px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        color: var(--nebula-text-primary);
                        border-left: 3px solid ${this.activeTab === 'appearance' ? 'var(--nebula-primary)' : 'transparent'};
                        background: ${this.activeTab === 'appearance' ? 'var(--nebula-surface-hover)' : 'transparent'};
                    ">
                        <span class="material-symbols-outlined">palette</span>
                        <span>Appearance</span>
                    </div>
                    
                    <div class="nav-item ${this.activeTab === 'wallpaper' ? 'active' : ''}" data-tab="wallpaper" style="
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        padding: 12px 20px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        color: var(--nebula-text-primary);
                        border-left: 3px solid ${this.activeTab === 'wallpaper' ? 'var(--nebula-primary)' : 'transparent'};
                        background: ${this.activeTab === 'wallpaper' ? 'var(--nebula-surface-hover)' : 'transparent'};
                    ">
                        <span class="material-symbols-outlined">wallpaper</span>
                        <span>Wallpaper</span>
                    </div>
                    
                    <div class="nav-item ${this.activeTab === 'windows' ? 'active' : ''}" data-tab="windows" style="
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        padding: 12px 20px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        color: var(--nebula-text-primary);
                        border-left: 3px solid ${this.activeTab === 'windows' ? 'var(--nebula-primary)' : 'transparent'};
                        background: ${this.activeTab === 'windows' ? 'var(--nebula-surface-hover)' : 'transparent'};
                    ">
                        <span class="material-symbols-outlined">web_asset</span>
                        <span>Windows</span>
                    </div>
                    
                    <div class="nav-item ${this.activeTab === 'effects' ? 'active' : ''}" data-tab="effects" style="
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        padding: 12px 20px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        color: var(--nebula-text-primary);
                        border-left: 3px solid ${this.activeTab === 'effects' ? 'var(--nebula-primary)' : 'transparent'};
                        background: ${this.activeTab === 'effects' ? 'var(--nebula-surface-hover)' : 'transparent'};
                    ">
                        <span class="material-symbols-outlined">auto_fix_high</span>
                        <span>Effects</span>
                    </div>
                    
                    <div class="nav-item ${this.activeTab === 'system' ? 'active' : ''}" data-tab="system" style="
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        padding: 12px 20px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        color: var(--nebula-text-primary);
                        border-left: 3px solid ${this.activeTab === 'system' ? 'var(--nebula-primary)' : 'transparent'};
                        background: ${this.activeTab === 'system' ? 'var(--nebula-surface-hover)' : 'transparent'};
                    ">
                        <span class="material-symbols-outlined">settings_applications</span>
                        <span>System</span>
                    </div>
                </nav>
            </div>
            
            <!-- Settings Content -->
            <div class="settings-content" style="
                flex: 1;
                padding: 30px;
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
    
    /**
     * Set up all event listeners for the settings interface
     */
    setupEventListeners(container) {
        // Navigation tabs
        const navItems = container.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const tab = item.dataset.tab;
                this.showTab(tab, container);
            });
            
            // Hover effects
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
    
    /**
     * Show a specific settings tab
     */
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
            case 'windows':
                contentArea.innerHTML = this.renderWindowsTab();
                this.setupWindowsListeners(contentArea);
                break;
            case 'effects':
                contentArea.innerHTML = this.renderEffectsTab();
                this.setupEffectsListeners(contentArea);
                break;
            case 'system':
                contentArea.innerHTML = this.renderSystemTab();
                this.setupSystemListeners(contentArea);
                break;
        }
    }
    
    /**
     * Render the Appearance tab
     */
    renderAppearanceTab() {
        return `
            <div class="tab-header" style="margin-bottom: 30px;">
                <h2 style="color: var(--nebula-text-primary); margin: 0 0 8px 0; font-size: 28px; font-weight: 700; display: flex; align-items: center; gap: 12px;">
                    <span class="material-symbols-outlined" style="color: var(--nebula-primary); font-size: 32px;">palette</span>
                    Appearance
                </h2>
                <p style="color: var(--nebula-text-secondary); margin: 0; font-size: 16px;">Customize colors, themes, and visual style</p>
            </div>

            <!-- Preset Themes -->
            <div class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Preset Themes</h3>
                <div class="theme-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                    <div class="theme-card ${this.currentTheme === 'light' ? 'selected' : ''}" data-theme="light" style="
                        background: linear-gradient(135deg, #ffffff, #f8fafc);
                        border: 2px solid ${this.currentTheme === 'light' ? 'var(--nebula-primary)' : 'var(--nebula-border)'};
                        border-radius: 8px;
                        padding: 16px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        position: relative;
                        overflow: hidden;
                    ">
                        <div style="color: #1e293b; font-weight: 600; margin-bottom: 8px;">☀️ Light Theme</div>
                        <div style="color: #64748b; font-size: 12px;">Clean and bright interface</div>
                        <div style="position: absolute; top: 8px; right: 8px; font-size: 16px; opacity: ${this.currentTheme === 'light' ? '1' : '0'};">✓</div>
                    </div>
                    
                    <div class="theme-card ${this.currentTheme === 'dark' ? 'selected' : ''}" data-theme="dark" style="
                        background: linear-gradient(135deg, #0f172a, #1e293b);
                        border: 2px solid ${this.currentTheme === 'dark' ? 'var(--nebula-primary)' : '#334155'};
                        border-radius: 8px;
                        padding: 16px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        position: relative;
                        overflow: hidden;
                    ">
                        <div style="color: #f8fafc; font-weight: 600; margin-bottom: 8px;">🌙 Dark Theme</div>
                        <div style="color: #cbd5e1; font-size: 12px;">Easy on the eyes</div>
                        <div style="position: absolute; top: 8px; right: 8px; font-size: 16px; color: white; opacity: ${this.currentTheme === 'dark' ? '1' : '0'};">✓</div>
                    </div>
                    
                    <div class="theme-card ${this.currentTheme === 'nebula-slate' ? 'selected' : ''}" data-theme="nebula-slate" style="
                        background: linear-gradient(135deg, #475569, #64748b);
                        border: 2px solid ${this.currentTheme === 'nebula-slate' ? 'var(--nebula-primary)' : '#334155'};
                        border-radius: 8px;
                        padding: 16px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        position: relative;
                        overflow: hidden;
                    ">
                        <div style="color: #f8fafc; font-weight: 600; margin-bottom: 8px;">✨ Nebula Theme</div>
                        <div style="color: #e2e8f0; font-size: 12px;">Balanced and modern</div>
                        <div style="position: absolute; top: 8px; right: 8px; font-size: 16px; color: white; opacity: ${this.currentTheme === 'nebula-slate' ? '1' : '0'};">✓</div>
                    </div>
                </div>
            </div>

            <!-- Custom Colors -->
            <div class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Custom Colors</h3>
                <p style="color: var(--nebula-text-secondary); margin: 0 0 20px 0; font-size: 14px;">Create your own color scheme</p>
                
                <div class="color-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <label style="color: var(--nebula-text-primary); font-weight: 500; font-size: 14px;">Primary Color</label>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <input type="color" id="primaryColor" value="${this.customTheme.colors.primary}" style="
                                width: 50px;
                                height: 40px;
                                border: 1px solid var(--nebula-border);
                                border-radius: 6px;
                                cursor: pointer;
                                padding: 0;
                                background: none;
                            ">
                            <input type="text" id="primaryColorText" value="${this.customTheme.colors.primary}" style="
                                flex: 1;
                                height: 40px;
                                border: 1px solid var(--nebula-border);
                                border-radius: 6px;
                                padding: 0 12px;
                                background: var(--nebula-bg-secondary);
                                color: var(--nebula-text-primary);
                                font-family: monospace;
                                font-size: 13px;
                            ">
                        </div>
                    </div>
                    
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <label style="color: var(--nebula-text-primary); font-weight: 500; font-size: 14px;">Secondary Color</label>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <input type="color" id="secondaryColor" value="${this.customTheme.colors.secondary}" style="
                                width: 50px;
                                height: 40px;
                                border: 1px solid var(--nebula-border);
                                border-radius: 6px;
                                cursor: pointer;
                                padding: 0;
                                background: none;
                            ">
                            <input type="text" id="secondaryColorText" value="${this.customTheme.colors.secondary}" style="
                                flex: 1;
                                height: 40px;
                                border: 1px solid var(--nebula-border);
                                border-radius: 6px;
                                padding: 0 12px;
                                background: var(--nebula-bg-secondary);
                                color: var(--nebula-text-primary);
                                font-family: monospace;
                                font-size: 13px;
                            ">
                        </div>
                    </div>
                    
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <label style="color: var(--nebula-text-primary); font-weight: 500; font-size: 14px;">Background Color</label>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <input type="color" id="bgColor" value="${this.customTheme.colors.bgPrimary}" style="
                                width: 50px;
                                height: 40px;
                                border: 1px solid var(--nebula-border);
                                border-radius: 6px;
                                cursor: pointer;
                                padding: 0;
                                background: none;
                            ">
                            <input type="text" id="bgColorText" value="${this.customTheme.colors.bgPrimary}" style="
                                flex: 1;
                                height: 40px;
                                border: 1px solid var(--nebula-border);
                                border-radius: 6px;
                                padding: 0 12px;
                                background: var(--nebula-bg-secondary);
                                color: var(--nebula-text-primary);
                                font-family: monospace;
                                font-size: 13px;
                            ">
                        </div>
                    </div>
                    
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <label style="color: var(--nebula-text-primary); font-weight: 500; font-size: 14px;">Text Color</label>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <input type="color" id="textColor" value="${this.customTheme.colors.textPrimary}" style="
                                width: 50px;
                                height: 40px;
                                border: 1px solid var(--nebula-border);
                                border-radius: 6px;
                                cursor: pointer;
                                padding: 0;
                                background: none;
                            ">
                            <input type="text" id="textColorText" value="${this.customTheme.colors.textPrimary}" style="
                                flex: 1;
                                height: 40px;
                                border: 1px solid var(--nebula-border);
                                border-radius: 6px;
                                padding: 0 12px;
                                background: var(--nebula-bg-secondary);
                                color: var(--nebula-text-primary);
                                font-family: monospace;
                                font-size: 13px;
                            ">
                        </div>
                    </div>
                </div>
                
                <div style="margin-top: 20px; display: flex; gap: 12px;">
                    <button id="applyCustomTheme" style="
                        background: var(--nebula-primary);
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 500;
                        transition: all 0.2s ease;
                    ">Apply Custom Theme</button>
                    
                    <button id="resetColors" style="
                        background: var(--nebula-surface-hover);
                        color: var(--nebula-text-primary);
                        border: 1px solid var(--nebula-border);
                        padding: 12px 24px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 500;
                        transition: all 0.2s ease;
                    ">Reset to Defaults</button>
                </div>
            </div>

            <!-- Theme Management -->
            <div class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: 12px; padding: 24px;">
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Theme Management</h3>
                
                <div style="display: flex; gap: 12px; margin-bottom: 16px;">
                    <input type="text" id="themeNameInput" placeholder="My Custom Theme" style="
                        flex: 1;
                        height: 40px;
                        border: 1px solid var(--nebula-border);
                        border-radius: 6px;
                        padding: 0 12px;
                        background: var(--nebula-bg-secondary);
                        color: var(--nebula-text-primary);
                        font-size: 14px;
                    ">
                    <button id="saveTheme" style="
                        background: var(--nebula-success);
                        color: white;
                        border: none;
                        padding: 12px 20px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 500;
                    ">Save Theme</button>
                </div>
                
                <div style="display: flex; gap: 12px;">
                    <button id="exportTheme" style="
                        background: var(--nebula-primary);
                        color: white;
                        border: none;
                        padding: 12px 20px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 500;
                    ">Export Theme</button>
                    
                    <button id="importTheme" style="
                        background: var(--nebula-surface-hover);
                        color: var(--nebula-text-primary);
                        border: 1px solid var(--nebula-border);
                        padding: 12px 20px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 500;
                    ">Import Theme</button>
                    
                    <input type="file" id="themeFileInput" accept=".json" style="display: none;">
                </div>
            </div>
        `;
    }
    
    /**
     * Set up listeners for the Appearance tab
     */
    setupAppearanceListeners(container) {
        // Theme cards
        const themeCards = container.querySelectorAll('.theme-card');
        themeCards.forEach(card => {
            card.addEventListener('click', () => {
                const theme = card.dataset.theme;
                this.switchTheme(theme);
                this.updateThemeSelection(container, theme);
            });
        });
        
        // Color pickers and text inputs
        this.setupColorInputs(container);
        
        // Apply custom theme button
        const applyBtn = container.querySelector('#applyCustomTheme');
        applyBtn?.addEventListener('click', () => {
            this.applyCustomTheme();
        });
        
        // Reset colors button
        const resetBtn = container.querySelector('#resetColors');
        resetBtn?.addEventListener('click', () => {
            this.resetCustomColors(container);
        });
        
        // Theme management buttons
        const saveBtn = container.querySelector('#saveTheme');
        saveBtn?.addEventListener('click', () => {
            this.saveCustomTheme(container);
        });
        
        const exportBtn = container.querySelector('#exportTheme');
        exportBtn?.addEventListener('click', () => {
            this.exportTheme();
        });
        
        const importBtn = container.querySelector('#importTheme');
        const fileInput = container.querySelector('#themeFileInput');
        importBtn?.addEventListener('click', () => {
            fileInput.click();
        });
        
        fileInput?.addEventListener('change', (e) => {
            this.importTheme(e.target.files[0], container);
        });
    }
    
    /**
     * Set up color input synchronization
     */
    setupColorInputs(container) {
        const colorInputs = [
            { color: 'primaryColor', text: 'primaryColorText' },
            { color: 'secondaryColor', text: 'secondaryColorText' },
            { color: 'bgColor', text: 'bgColorText' },
            { color: 'textColor', text: 'textColorText' }
        ];
        
        colorInputs.forEach(({ color, text }) => {
            const colorInput = container.querySelector(`#${color}`);
            const textInput = container.querySelector(`#${text}`);
            
            if (colorInput && textInput) {
                colorInput.addEventListener('input', () => {
                    textInput.value = colorInput.value;
                    this.updateCustomThemeColor(color, colorInput.value);
                });
                
                textInput.addEventListener('input', () => {
                    if (this.isValidColor(textInput.value)) {
                        colorInput.value = textInput.value;
                        this.updateCustomThemeColor(color, textInput.value);
                    }
                });
            }
        });
    }
    
    /**
     * Apply the custom theme to the interface
     */
    applyCustomTheme() {
        const root = document.documentElement;
        
        // Apply custom CSS variables
        root.style.setProperty('--nebula-primary', this.customTheme.colors.primary);
        root.style.setProperty('--nebula-secondary', this.customTheme.colors.secondary);
        root.style.setProperty('--nebula-accent', this.customTheme.colors.accent);
        root.style.setProperty('--nebula-bg-primary', this.customTheme.colors.bgPrimary);
        root.style.setProperty('--nebula-bg-secondary', this.customTheme.colors.bgSecondary);
        root.style.setProperty('--nebula-surface', this.customTheme.colors.surface);
        root.style.setProperty('--nebula-text-primary', this.customTheme.colors.textPrimary);
        root.style.setProperty('--nebula-text-secondary', this.customTheme.colors.textSecondary);
        root.style.setProperty('--nebula-border', this.customTheme.colors.border);
        
        // Mark as custom theme
        root.setAttribute('data-theme', 'custom');
        this.currentTheme = 'custom';
        
        this.saveSettings();
        console.log('Custom theme applied');
    }
    
    /**
     * Update custom theme color value
     */
    updateCustomThemeColor(inputId, value) {
        switch (inputId) {
            case 'primaryColor':
                this.customTheme.colors.primary = value;
                break;
            case 'secondaryColor':
                this.customTheme.colors.secondary = value;
                break;
            case 'bgColor':
                this.customTheme.colors.bgPrimary = value;
                break;
            case 'textColor':
                this.customTheme.colors.textPrimary = value;
                break;
        }
    }
    
    /**
     * Reset custom colors to defaults
     */
    resetCustomColors(container) {
        this.customTheme.colors = {
            primary: '#667eea',
            secondary: '#764ba2',
            accent: '#4f46e5',
            success: '#10b981',
            warning: '#f59e0b',
            danger: '#ef4444',
            bgPrimary: '#ffffff',
            bgSecondary: '#f8fafc',
            surface: '#ffffff',
            textPrimary: '#1e293b',
            textSecondary: '#64748b',
            border: '#e2e8f0'
        };
        
        // Update inputs
        container.querySelector('#primaryColor').value = this.customTheme.colors.primary;
        container.querySelector('#primaryColorText').value = this.customTheme.colors.primary;
        container.querySelector('#secondaryColor').value = this.customTheme.colors.secondary;
        container.querySelector('#secondaryColorText').value = this.customTheme.colors.secondary;
        container.querySelector('#bgColor').value = this.customTheme.colors.bgPrimary;
        container.querySelector('#bgColorText').value = this.customTheme.colors.bgPrimary;
        container.querySelector('#textColor').value = this.customTheme.colors.textPrimary;
        container.querySelector('#textColorText').value = this.customTheme.colors.textPrimary;
    }
    
    /**
     * Switch to a different preset theme
     */
    switchTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;
        
        // Save theme preference
        try {
            localStorage.setItem('nebula-theme', theme);
            console.log(`Theme switched to: ${theme}`);
        } catch (error) {
            console.warn('Could not save theme preference:', error);
        }
    }
    
    /**
     * Update theme card selection
     */
    updateThemeSelection(container, activeTheme) {
        const themeCards = container.querySelectorAll('.theme-card');
        themeCards.forEach(card => {
            const isActive = card.dataset.theme === activeTheme;
            card.classList.toggle('selected', isActive);
            
            if (card.dataset.theme === 'light') {
                card.style.borderColor = isActive ? 'var(--nebula-primary)' : 'var(--nebula-border)';
            } else {
                card.style.borderColor = isActive ? 'var(--nebula-primary)' : '#334155';
            }
            
            const checkmark = card.querySelector('div:last-child');
            if (checkmark) {
                checkmark.style.opacity = isActive ? '1' : '0';
            }
        });
    }
    
    /**
     * Save custom theme with a name
     */
    saveCustomTheme(container) {
        const nameInput = container.querySelector('#themeNameInput');
        const themeName = nameInput.value.trim() || 'Custom Theme';
        
        const themeData = {
            name: themeName,
            colors: { ...this.customTheme.colors },
            window: { ...this.customTheme.window },
            createdAt: new Date().toISOString()
        };
        
        try {
            // Save to localStorage
            const savedThemes = JSON.parse(localStorage.getItem('nebula-custom-themes') || '[]');
            savedThemes.push(themeData);
            localStorage.setItem('nebula-custom-themes', JSON.stringify(savedThemes));
            
            alert(`Theme "${themeName}" saved successfully!`);
            nameInput.value = '';
            
        } catch (error) {
            alert(`Error saving theme: ${error.message}`);
        }
    }
    
    /**
     * Export current theme as JSON file
     */
    exportTheme() {
        const themeData = {
            name: this.customTheme.name,
            version: 'NebulaDesktop v3.0',
            colors: { ...this.customTheme.colors },
            window: { ...this.customTheme.window },
            wallpaper: { ...this.wallpaperSettings },
            exportDate: new Date().toISOString()
        };
        
        try {
            const blob = new Blob([JSON.stringify(themeData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${themeData.name.replace(/\s+/g, '-').toLowerCase()}-theme.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            console.log('Theme exported successfully');
            
        } catch (error) {
            alert(`Error exporting theme: ${error.message}`);
        }
    }
    
    /**
     * Import theme from JSON file
     */
    async importTheme(file, container) {
        if (!file) return;
        
        try {
            const text = await file.text();
            const themeData = JSON.parse(text);
            
            // Validate theme data structure
            if (!themeData.colors || !themeData.name) {
                throw new Error('Invalid theme file format');
            }
            
            // Apply imported theme
            this.customTheme.name = themeData.name;
            this.customTheme.colors = { ...this.customTheme.colors, ...themeData.colors };
            
            if (themeData.window) {
                this.customTheme.window = { ...this.customTheme.window, ...themeData.window };
            }
            
            if (themeData.wallpaper) {
                this.wallpaperSettings = { ...this.wallpaperSettings, ...themeData.wallpaper };
            }
            
            // Update UI
            this.updateColorInputsFromTheme(container);
            this.applyCustomTheme();
            
            alert(`Theme "${themeData.name}" imported successfully!`);
            
        } catch (error) {
            alert(`Error importing theme: ${error.message}`);
        }
    }
    
    /**
     * Update color inputs from current theme
     */
    /**
     * Render the Wallpaper tab
     */
    renderWallpaperTab() {
        return `
            <div class="tab-header" style="margin-bottom: 30px;">
                <h2 style="color: var(--nebula-text-primary); margin: 0 0 8px 0; font-size: 28px; font-weight: 700; display: flex; align-items: center; gap: 12px;">
                    <span class="material-symbols-outlined" style="color: var(--nebula-primary); font-size: 32px;">wallpaper</span>
                    Wallpaper
                </h2>
                <p style="color: var(--nebula-text-secondary); margin: 0; font-size: 16px;">Customize your desktop background</p>
            </div>

            <!-- Wallpaper Type Selection -->
            <div class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Background Type</h3>
                
                <div class="wallpaper-type-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 20px;">
                    <div class="wallpaper-type-card ${this.wallpaperSettings.type === 'gradient' ? 'selected' : ''}" data-type="gradient" style="
                        background: linear-gradient(135deg, #667eea, #764ba2);
                        border: 2px solid ${this.wallpaperSettings.type === 'gradient' ? 'var(--nebula-primary)' : 'var(--nebula-border)'};
                        border-radius: 8px;
                        padding: 16px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        text-align: center;
                        position: relative;
                        color: white;
                        font-weight: 600;
                    ">
                        Gradient
                        <div style="position: absolute; top: 8px; right: 8px; font-size: 16px; opacity: ${this.wallpaperSettings.type === 'gradient' ? '1' : '0'};">✓</div>
                    </div>
                    
                    <div class="wallpaper-type-card ${this.wallpaperSettings.type === 'solid' ? 'selected' : ''}" data-type="solid" style="
                        background: ${this.wallpaperSettings.solidColor};
                        border: 2px solid ${this.wallpaperSettings.type === 'solid' ? 'var(--nebula-primary)' : 'var(--nebula-border)'};
                        border-radius: 8px;
                        padding: 16px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        text-align: center;
                        position: relative;
                        color: white;
                        font-weight: 600;
                        text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
                    ">
                        Solid Color
                        <div style="position: absolute; top: 8px; right: 8px; font-size: 16px; opacity: ${this.wallpaperSettings.type === 'solid' ? '1' : '0'};">✓</div>
                    </div>
                    
                    <div class="wallpaper-type-card ${this.wallpaperSettings.type === 'image' ? 'selected' : ''}" data-type="image" style="
                        background: ${this.wallpaperSettings.imagePath ? `url(${this.wallpaperSettings.imagePath}) center/cover` : 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)'};
                        background-size: ${this.wallpaperSettings.imagePath ? 'cover' : '20px 20px'};
                        border: 2px solid ${this.wallpaperSettings.type === 'image' ? 'var(--nebula-primary)' : 'var(--nebula-border)'};
                        border-radius: 8px;
                        padding: 16px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        text-align: center;
                        position: relative;
                        color: ${this.wallpaperSettings.imagePath ? 'white' : 'var(--nebula-text-primary)'};
                        font-weight: 600;
                        text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
                    ">
                        Custom Image
                        <div style="position: absolute; top: 8px; right: 8px; font-size: 16px; opacity: ${this.wallpaperSettings.type === 'image' ? '1' : '0'};">✓</div>
                    </div>
                </div>
            </div>

            <!-- Gradient Settings -->
            <div id="gradientSettings" class="settings-section" style="
                background: var(--nebula-surface); 
                border: 1px solid var(--nebula-border); 
                border-radius: 12px; 
                padding: 24px; 
                margin-bottom: 24px;
                display: ${this.wallpaperSettings.type === 'gradient' ? 'block' : 'none'};
            ">
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Gradient Settings</h3>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px;">
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <label style="color: var(--nebula-text-primary); font-weight: 500; font-size: 14px;">Start Color</label>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <input type="color" id="gradientStart" value="${this.wallpaperSettings.gradientStart}" style="
                                width: 50px;
                                height: 40px;
                                border: 1px solid var(--nebula-border);
                                border-radius: 6px;
                                cursor: pointer;
                                padding: 0;
                                background: none;
                            ">
                            <input type="text" id="gradientStartText" value="${this.wallpaperSettings.gradientStart}" style="
                                flex: 1;
                                height: 40px;
                                border: 1px solid var(--nebula-border);
                                border-radius: 6px;
                                padding: 0 12px;
                                background: var(--nebula-bg-secondary);
                                color: var(--nebula-text-primary);
                                font-family: monospace;
                                font-size: 13px;
                            ">
                        </div>
                    </div>
                    
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <label style="color: var(--nebula-text-primary); font-weight: 500; font-size: 14px;">End Color</label>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <input type="color" id="gradientEnd" value="${this.wallpaperSettings.gradientEnd}" style="
                                width: 50px;
                                height: 40px;
                                border: 1px solid var(--nebula-border);
                                border-radius: 6px;
                                cursor: pointer;
                                padding: 0;
                                background: none;
                            ">
                            <input type="text" id="gradientEndText" value="${this.wallpaperSettings.gradientEnd}" style="
                                flex: 1;
                                height: 40px;
                                border: 1px solid var(--nebula-border);
                                border-radius: 6px;
                                padding: 0 12px;
                                background: var(--nebula-bg-secondary);
                                color: var(--nebula-text-primary);
                                font-family: monospace;
                                font-size: 13px;
                            ">
                        </div>
                    </div>
                    
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <label style="color: var(--nebula-text-primary); font-weight: 500; font-size: 14px;">Direction</label>
                        <select id="gradientDirection" style="
                            height: 40px;
                            border: 1px solid var(--nebula-border);
                            border-radius: 6px;
                            padding: 0 12px;
                            background: var(--nebula-bg-secondary);
                            color: var(--nebula-text-primary);
                            font-size: 14px;
                        ">
                            <option value="135deg" ${this.wallpaperSettings.gradientDirection === '135deg' ? 'selected' : ''}>Diagonal ↘</option>
                            <option value="90deg" ${this.wallpaperSettings.gradientDirection === '90deg' ? 'selected' : ''}>Vertical ↓</option>
                            <option value="0deg" ${this.wallpaperSettings.gradientDirection === '0deg' ? 'selected' : ''}>Horizontal →</option>
                            <option value="45deg" ${this.wallpaperSettings.gradientDirection === '45deg' ? 'selected' : ''}>Diagonal ↗</option>
                            <option value="180deg" ${this.wallpaperSettings.gradientDirection === '180deg' ? 'selected' : ''}>Horizontal ←</option>
                            <option value="270deg" ${this.wallpaperSettings.gradientDirection === '270deg' ? 'selected' : ''}>Vertical ↑</option>
                        </select>
                    </div>
                </div>
                
                <div style="height: 100px; border-radius: 8px; background: linear-gradient(${this.wallpaperSettings.gradientDirection}, ${this.wallpaperSettings.gradientStart}, ${this.wallpaperSettings.gradientEnd}); border: 1px solid var(--nebula-border); margin-bottom: 16px;" id="gradientPreview"></div>
                
                <button id="applyGradient" style="
                    background: var(--nebula-primary);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                ">Apply Gradient</button>
            </div>

            <!-- Solid Color Settings -->
            <div id="solidSettings" class="settings-section" style="
                background: var(--nebula-surface); 
                border: 1px solid var(--nebula-border); 
                border-radius: 12px; 
                padding: 24px; 
                margin-bottom: 24px;
                display: ${this.wallpaperSettings.type === 'solid' ? 'block' : 'none'};
            ">
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Solid Color Settings</h3>
                
                <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px;">
                    <input type="color" id="solidColor" value="${this.wallpaperSettings.solidColor}" style="
                        width: 100px;
                        height: 60px;
                        border: 1px solid var(--nebula-border);
                        border-radius: 8px;
                        cursor: pointer;
                        padding: 0;
                        background: none;
                    ">
                    <div style="flex: 1;">
                        <input type="text" id="solidColorText" value="${this.wallpaperSettings.solidColor}" style="
                            width: 100%;
                            height: 40px;
                            border: 1px solid var(--nebula-border);
                            border-radius: 6px;
                            padding: 0 12px;
                            background: var(--nebula-bg-secondary);
                            color: var(--nebula-text-primary);
                            font-family: monospace;
                            font-size: 14px;
                        ">
                    </div>
                </div>
                
                <button id="applySolid" style="
                    background: var(--nebula-primary);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                ">Apply Solid Color</button>
            </div>

            <!-- Image Settings -->
            <div id="imageSettings" class="settings-section" style="
                background: var(--nebula-surface); 
                border: 1px solid var(--nebula-border); 
                border-radius: 12px; 
                padding: 24px; 
                margin-bottom: 24px;
                display: ${this.wallpaperSettings.type === 'image' ? 'block' : 'none'};
            ">
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Image Settings</h3>
                
                <!-- File Upload -->
                <div style="border: 2px dashed var(--nebula-border); border-radius: 8px; padding: 30px; text-align: center; margin-bottom: 20px;" id="dropZone">
                    <div style="color: var(--nebula-text-secondary); margin-bottom: 16px;">
                        <span class="material-symbols-outlined" style="font-size: 48px; display: block; margin-bottom: 8px; opacity: 0.6;">upload</span>
                        Drag & drop an image here or click to browse
                    </div>
                    <button id="browseImage" style="
                        background: var(--nebula-primary);
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 500;
                    ">Browse Files</button>
                    <input type="file" id="imageInput" accept="image/*" style="display: none;">
                    <div style="margin-top: 8px; font-size: 12px; color: var(--nebula-text-secondary);">
                        Supports: JPG, PNG, GIF, WebP
                    </div>
                </div>
                
                <!-- Current Image Preview -->
                <div id="currentImagePreview" style="display: ${this.wallpaperSettings.imagePath ? 'block' : 'none'}; margin-bottom: 20px;">
                    <div style="height: 120px; border-radius: 8px; background: url(${this.wallpaperSettings.imagePath}) center/cover; border: 1px solid var(--nebula-border); position: relative;">
                        <div style="position: absolute; top: 8px; right: 8px;">
                            <button id="removeImage" style="
                                background: var(--nebula-danger);
                                color: white;
                                border: none;
                                width: 28px;
                                height: 28px;
                                border-radius: 50%;
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-size: 16px;
                            ">×</button>
                        </div>
                    </div>
                </div>
                
                <!-- Fit Mode -->
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; color: var(--nebula-text-primary); font-weight: 500;">Image Fit</label>
                    <select id="fitMode" style="
                        width: 100%;
                        height: 40px;
                        border: 1px solid var(--nebula-border);
                        border-radius: 6px;
                        padding: 0 12px;
                        background: var(--nebula-bg-secondary);
                        color: var(--nebula-text-primary);
                        font-size: 14px;
                    ">
                        <option value="cover" ${this.wallpaperSettings.fitMode === 'cover' ? 'selected' : ''}>Cover (Fill screen, crop if needed)</option>
                        <option value="contain" ${this.wallpaperSettings.fitMode === 'contain' ? 'selected' : ''}>Contain (Fit entire image)</option>
                        <option value="stretch" ${this.wallpaperSettings.fitMode === 'stretch' ? 'selected' : ''}>Stretch (May distort image)</option>
                        <option value="tile" ${this.wallpaperSettings.fitMode === 'tile' ? 'selected' : ''}>Tile (Repeat image)</option>
                        <option value="center" ${this.wallpaperSettings.fitMode === 'center' ? 'selected' : ''}>Center (Original size)</option>
                    </select>
                </div>
                
                <button id="applyImage" style="
                    background: var(--nebula-primary);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                ">Apply Image</button>
            </div>
        `;
    }
    
    /**
     * Set up listeners for the Wallpaper tab
     */
    setupWallpaperListeners(container) {
        // Wallpaper type selection
        const typeCards = container.querySelectorAll('.wallpaper-type-card');
        typeCards.forEach(card => {
            card.addEventListener('click', () => {
                const type = card.dataset.type;
                this.wallpaperSettings.type = type;
                this.updateWallpaperTypeSelection(container, type);
                this.showWallpaperSettings(container, type);
            });
        });
        
        // Gradient settings
        this.setupGradientListeners(container);
        
        // Solid color settings
        this.setupSolidColorListeners(container);
        
        // Image settings
        this.setupImageListeners(container);
    }
    
    /**
     * Set up gradient controls
     */
    setupGradientListeners(container) {
        // Color inputs
        const gradientInputs = [
            { color: 'gradientStart', text: 'gradientStartText', prop: 'gradientStart' },
            { color: 'gradientEnd', text: 'gradientEndText', prop: 'gradientEnd' }
        ];
        
        gradientInputs.forEach(({ color, text, prop }) => {
            const colorInput = container.querySelector(`#${color}`);
            const textInput = container.querySelector(`#${text}`);
            
            if (colorInput && textInput) {
                colorInput.addEventListener('input', () => {
                    textInput.value = colorInput.value;
                    this.wallpaperSettings[prop] = colorInput.value;
                    this.updateGradientPreview(container);
                });
                
                textInput.addEventListener('input', () => {
                    if (this.isValidColor(textInput.value)) {
                        colorInput.value = textInput.value;
                        this.wallpaperSettings[prop] = textInput.value;
                        this.updateGradientPreview(container);
                    }
                });
            }
        });
        
        // Direction dropdown
        const directionSelect = container.querySelector('#gradientDirection');
        directionSelect?.addEventListener('change', () => {
            this.wallpaperSettings.gradientDirection = directionSelect.value;
            this.updateGradientPreview(container);
        });
        
        // Apply button
        const applyBtn = container.querySelector('#applyGradient');
        applyBtn?.addEventListener('click', () => {
            this.applyWallpaper();
        });
    }
    
    /**
     * Set up solid color controls
     */
    setupSolidColorListeners(container) {
        const colorInput = container.querySelector('#solidColor');
        const textInput = container.querySelector('#solidColorText');
        
        if (colorInput && textInput) {
            colorInput.addEventListener('input', () => {
                textInput.value = colorInput.value;
                this.wallpaperSettings.solidColor = colorInput.value;
            });
            
            textInput.addEventListener('input', () => {
                if (this.isValidColor(textInput.value)) {
                    colorInput.value = textInput.value;
                    this.wallpaperSettings.solidColor = textInput.value;
                }
            });
        }
        
        // Apply button
        const applyBtn = container.querySelector('#applySolid');
        applyBtn?.addEventListener('click', () => {
            this.applyWallpaper();
        });
    }
    
    /**
     * Set up image upload controls
     */
    setupImageListeners(container) {
        const dropZone = container.querySelector('#dropZone');
        const browseBtn = container.querySelector('#browseImage');
        const fileInput = container.querySelector('#imageInput');
        const fitModeSelect = container.querySelector('#fitMode');
        const removeBtn = container.querySelector('#removeImage');
        const applyBtn = container.querySelector('#applyImage');
        
        // File input
        browseBtn?.addEventListener('click', () => fileInput.click());
        fileInput?.addEventListener('change', (e) => this.handleImageFile(e.target.files[0], container));
        
        // Drag and drop
        dropZone?.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = 'var(--nebula-primary)';
            dropZone.style.background = 'var(--nebula-surface-hover)';
        });
        
        dropZone?.addEventListener('dragleave', () => {
            dropZone.style.borderColor = 'var(--nebula-border)';
            dropZone.style.background = 'transparent';
        });
        
        dropZone?.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = 'var(--nebula-border)';
            dropZone.style.background = 'transparent';
            
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                this.handleImageFile(file, container);
            }
        });
        
        // Fit mode
        fitModeSelect?.addEventListener('change', () => {
            this.wallpaperSettings.fitMode = fitModeSelect.value;
        });
        
        // Remove image
        removeBtn?.addEventListener('click', () => {
            this.wallpaperSettings.imagePath = '';
            this.updateImagePreview(container);
        });
        
        // Apply image
        applyBtn?.addEventListener('click', () => {
            this.applyWallpaper();
        });
    }
    
    /**
     * Handle uploaded image file
     */
    async handleImageFile(file, container) {
        if (!file || !file.type.startsWith('image/')) {
            alert('Please select a valid image file');
            return;
        }
        
        try {
            // Convert to base64 for storage
            const reader = new FileReader();
            reader.onload = (e) => {
                this.wallpaperSettings.imagePath = e.target.result;
                this.updateImagePreview(container);
            };
            reader.readAsDataURL(file);
            
        } catch (error) {
            alert(`Error loading image: ${error.message}`);
        }
    }
    
    /**
     * Update various UI elements
     */
    updateWallpaperTypeSelection(container, activeType) {
        const typeCards = container.querySelectorAll('.wallpaper-type-card');
        typeCards.forEach(card => {
            const isActive = card.dataset.type === activeType;
            card.classList.toggle('selected', isActive);
            card.style.borderColor = isActive ? 'var(--nebula-primary)' : 'var(--nebula-border)';
            
            const checkmark = card.querySelector('div:last-child');
            if (checkmark) {
                checkmark.style.opacity = isActive ? '1' : '0';
            }
        });
    }
    
    showWallpaperSettings(container, type) {
        const gradientSettings = container.querySelector('#gradientSettings');
        const solidSettings = container.querySelector('#solidSettings');
        const imageSettings = container.querySelector('#imageSettings');
        
        gradientSettings.style.display = type === 'gradient' ? 'block' : 'none';
        solidSettings.style.display = type === 'solid' ? 'block' : 'none';
        imageSettings.style.display = type === 'image' ? 'block' : 'none';
    }
    
    updateGradientPreview(container) {
        const preview = container.querySelector('#gradientPreview');
        if (preview) {
            preview.style.background = `linear-gradient(${this.wallpaperSettings.gradientDirection}, ${this.wallpaperSettings.gradientStart}, ${this.wallpaperSettings.gradientEnd})`;
        }
    }
    
    updateImagePreview(container) {
        const preview = container.querySelector('#currentImagePreview');
        if (preview) {
            preview.style.display = this.wallpaperSettings.imagePath ? 'block' : 'none';
            if (this.wallpaperSettings.imagePath) {
                const previewImg = preview.querySelector('div');
                previewImg.style.backgroundImage = `url(${this.wallpaperSettings.imagePath})`;
            }
        }
    }
    
    /**
     * Apply the selected wallpaper to the desktop
     */
    applyWallpaper() {
        const body = document.body;
        
        switch (this.wallpaperSettings.type) {
            case 'gradient':
                body.style.background = `linear-gradient(${this.wallpaperSettings.gradientDirection}, ${this.wallpaperSettings.gradientStart}, ${this.wallpaperSettings.gradientEnd})`;
                body.style.backgroundAttachment = 'fixed';
                break;
                
            case 'solid':
                body.style.background = this.wallpaperSettings.solidColor;
                body.style.backgroundAttachment = 'fixed';
                break;
                
            case 'image':
                if (this.wallpaperSettings.imagePath) {
                    const backgroundSize = {
                        'cover': 'cover',
                        'contain': 'contain',
                        'stretch': '100% 100%',
                        'tile': 'auto',
                        'center': 'auto'
                    }[this.wallpaperSettings.fitMode] || 'cover';
                    
                    const backgroundRepeat = this.wallpaperSettings.fitMode === 'tile' ? 'repeat' : 'no-repeat';
                    const backgroundPosition = 'center';
                    
                    body.style.background = `url(${this.wallpaperSettings.imagePath}) ${backgroundPosition}/${backgroundSize} ${backgroundRepeat}`;
                    body.style.backgroundAttachment = 'fixed';
                }
                break;
        }
        
    /**
     * Render the Windows tab
     */
    renderWindowsTab() {
        return `
            <div class="tab-header" style="margin-bottom: 30px;">
                <h2 style="color: var(--nebula-text-primary); margin: 0 0 8px 0; font-size: 28px; font-weight: 700; display: flex; align-items: center; gap: 12px;">
                    <span class="material-symbols-outlined" style="color: var(--nebula-primary); font-size: 32px;">web_asset</span>
                    Windows
                </h2>
                <p style="color: var(--nebula-text-secondary); margin: 0; font-size: 16px;">Customize window appearance and behavior</p>
            </div>

            <!-- Window Shape & Borders -->
            <div class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Shape & Borders</h3>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
                    <div>
                        <label style="display: block; margin-bottom: 8px; color: var(--nebula-text-primary); font-weight: 500;">Border Radius</label>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <input type="range" id="borderRadius" min="0" max="24" value="${this.customTheme.window.borderRadius}" style="
                                flex: 1;
                                height: 6px;
                                background: var(--nebula-surface-hover);
                                outline: none;
                                border-radius: 3px;
                                cursor: pointer;
                            ">
                            <div style="min-width: 60px; text-align: center; color: var(--nebula-text-primary); font-family: monospace; background: var(--nebula-bg-secondary); padding: 4px 8px; border-radius: 4px; border: 1px solid var(--nebula-border);">
                                <span id="borderRadiusValue">${this.customTheme.window.borderRadius}</span>px
                            </div>
                        </div>
                        <div style="margin-top: 8px; font-size: 12px; color: var(--nebula-text-secondary);">Controls window corner roundness</div>
                    </div>
                    
                    <div>
                        <label style="display: block; margin-bottom: 8px; color: var(--nebula-text-primary); font-weight: 500;">Titlebar Height</label>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <input type="range" id="titlebarHeight" min="32" max="56" value="${this.customTheme.window.titlebarHeight}" style="
                                flex: 1;
                                height: 6px;
                                background: var(--nebula-surface-hover);
                                outline: none;
                                border-radius: 3px;
                                cursor: pointer;
                            ">
                            <div style="min-width: 60px; text-align: center; color: var(--nebula-text-primary); font-family: monospace; background: var(--nebula-bg-secondary); padding: 4px 8px; border-radius: 4px; border: 1px solid var(--nebula-border);">
                                <span id="titlebarHeightValue">${this.customTheme.window.titlebarHeight}</span>px
                            </div>
                        </div>
                        <div style="margin-top: 8px; font-size: 12px; color: var(--nebula-text-secondary);">Height of window title bar</div>
                    </div>
                </div>
            </div>

            <!-- Window Effects -->
            <div class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Visual Effects</h3>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
                    <div>
                        <label style="display: block; margin-bottom: 8px; color: var(--nebula-text-primary); font-weight: 500;">Shadow Intensity</label>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <input type="range" id="shadowIntensity" min="0" max="1" step="0.05" value="${this.customTheme.window.shadowIntensity}" style="
                                flex: 1;
                                height: 6px;
                                background: var(--nebula-surface-hover);
                                outline: none;
                                border-radius: 3px;
                                cursor: pointer;
                            ">
                            <div style="min-width: 60px; text-align: center; color: var(--nebula-text-primary); font-family: monospace; background: var(--nebula-bg-secondary); padding: 4px 8px; border-radius: 4px; border: 1px solid var(--nebula-border);">
                                <span id="shadowIntensityValue">${Math.round(this.customTheme.window.shadowIntensity * 100)}</span>%
                            </div>
                        </div>
                        <div style="margin-top: 8px; font-size: 12px; color: var(--nebula-text-secondary);">Strength of window drop shadows</div>
                    </div>
                    
                    <div>
                        <label style="display: block; margin-bottom: 8px; color: var(--nebula-text-primary); font-weight: 500;">Glass Blur Effect</label>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <input type="range" id="glassBlur" min="0" max="30" value="${this.customTheme.window.glassBlur}" style="
                                flex: 1;
                                height: 6px;
                                background: var(--nebula-surface-hover);
                                outline: none;
                                border-radius: 3px;
                                cursor: pointer;
                            ">
                            <div style="min-width: 60px; text-align: center; color: var(--nebula-text-primary); font-family: monospace; background: var(--nebula-bg-secondary); padding: 4px 8px; border-radius: 4px; border: 1px solid var(--nebula-border);">
                                <span id="glassBlurValue">${this.customTheme.window.glassBlur}</span>px
                            </div>
                        </div>
                        <div style="margin-top: 8px; font-size: 12px; color: var(--nebula-text-secondary);">Backdrop blur effect strength</div>
                    </div>
                    
                    <div>
                        <label style="display: block; margin-bottom: 8px; color: var(--nebula-text-primary); font-weight: 500;">Window Opacity</label>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <input type="range" id="windowOpacity" min="0.7" max="1" step="0.05" value="${this.customTheme.window.opacity}" style="
                                flex: 1;
                                height: 6px;
                                background: var(--nebula-surface-hover);
                                outline: none;
                                border-radius: 3px;
                                cursor: pointer;
                            ">
                            <div style="min-width: 60px; text-align: center; color: var(--nebula-text-primary); font-family: monospace; background: var(--nebula-bg-secondary); padding: 4px 8px; border-radius: 4px; border: 1px solid var(--nebula-border);">
                                <span id="windowOpacityValue">${Math.round(this.customTheme.window.opacity * 100)}</span>%
                            </div>
                        </div>
                        <div style="margin-top: 8px; font-size: 12px; color: var(--nebula-text-secondary);">Overall window transparency</div>
                    </div>
                </div>
            </div>

            <!-- Window Preview -->
            <div class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Live Preview</h3>
                
                <div style="position: relative; height: 200px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 8px; padding: 20px; display: flex; align-items: center; justify-content: center;">
                    <div class="window-preview" id="windowPreview" style="
                        width: 300px;
                        height: 150px;
                        background: var(--nebula-surface);
                        border: 1px solid var(--nebula-border);
                        border-radius: ${this.customTheme.window.borderRadius}px;
                        box-shadow: 0 8px 32px rgba(0, 0, 0, ${this.customTheme.window.shadowIntensity});
                        backdrop-filter: blur(${this.customTheme.window.glassBlur}px);
                        opacity: ${this.customTheme.window.opacity};
                        overflow: hidden;
                        display: flex;
                        flex-direction: column;
                        transition: all 0.3s ease;
                    ">
                        <div style="
                            height: ${this.customTheme.window.titlebarHeight}px;
                            background: var(--nebula-surface);
                            border-bottom: 1px solid var(--nebula-border);
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            padding: 0 12px;
                            font-size: 11px;
                            font-weight: 600;
                            color: var(--nebula-text-primary);
                        ">
                            <span>Sample Window</span>
                            <div style="display: flex; gap: 4px;">
                                <div style="width: 12px; height: 12px; background: #10b981; border-radius: 50%;"></div>
                                <div style="width: 12px; height: 12px; background: #f59e0b; border-radius: 50%;"></div>
                                <div style="width: 12px; height: 12px; background: #ef4444; border-radius: 50%;"></div>
                            </div>
                        </div>
                        <div style="
                            flex: 1;
                            background: var(--nebula-bg-primary);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            color: var(--nebula-text-secondary);
                            font-size: 12px;
                        ">
                            Window Content Area
                        </div>
                    </div>
                </div>
            </div>

            <!-- Control Buttons -->
            <div class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: 12px; padding: 24px;">
                <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                    <button id="applyWindowStyles" style="
                        background: var(--nebula-primary);
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 500;
                        transition: all 0.2s ease;
                    ">Apply Window Styles</button>
                    
                    <button id="resetWindowStyles" style="
                        background: var(--nebula-surface-hover);
                        color: var(--nebula-text-primary);
                        border: 1px solid var(--nebula-border);
                        padding: 12px 24px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 500;
                        transition: all 0.2s ease;
                    ">Reset to Defaults</button>
                    
                    <button id="previewAllWindows" style="
                        background: var(--nebula-secondary);
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 500;
                        transition: all 0.2s ease;
                    ">Preview on All Windows</button>
                </div>
            </div>
        `;
    }
    
    /**
     * Set up listeners for the Windows tab
     */
    setupWindowsListeners(container) {
        // Slider controls
        const sliders = [
            { id: 'borderRadius', prop: 'borderRadius', suffix: 'px' },
            { id: 'titlebarHeight', prop: 'titlebarHeight', suffix: 'px' },
            { id: 'shadowIntensity', prop: 'shadowIntensity', suffix: '%', isPercent: true },
            { id: 'glassBlur', prop: 'glassBlur', suffix: 'px' },
            { id: 'windowOpacity', prop: 'opacity', suffix: '%', isPercent: true }
        ];
        
        sliders.forEach(({ id, prop, suffix, isPercent }) => {
            const slider = container.querySelector(`#${id}`);
            const valueDisplay = container.querySelector(`#${id}Value`);
            
            if (slider && valueDisplay) {
                slider.addEventListener('input', () => {
                    const value = parseFloat(slider.value);
                    this.customTheme.window[prop] = value;
                    
                    if (isPercent) {
                        valueDisplay.textContent = Math.round(value * 100);
                    } else {
                        valueDisplay.textContent = value;
                    }
                    
                    this.updateWindowPreview(container);
                });
            }
        });
        
        // Control buttons
        const applyBtn = container.querySelector('#applyWindowStyles');
        const resetBtn = container.querySelector('#resetWindowStyles');
        const previewBtn = container.querySelector('#previewAllWindows');
        
        applyBtn?.addEventListener('click', () => {
            this.applyWindowStyles();
        });
        
        resetBtn?.addEventListener('click', () => {
            this.resetWindowStyles(container);
        });
        
        previewBtn?.addEventListener('click', () => {
            this.previewWindowStylesOnAll();
        });
    }
    
    /**
     * Update the window preview
     */
    updateWindowPreview(container) {
        const preview = container.querySelector('#windowPreview');
        if (preview) {
            const titlebar = preview.querySelector('div');
            
            preview.style.borderRadius = `${this.customTheme.window.borderRadius}px`;
            preview.style.boxShadow = `0 8px 32px rgba(0, 0, 0, ${this.customTheme.window.shadowIntensity})`;
            preview.style.backdropFilter = `blur(${this.customTheme.window.glassBlur}px)`;
            preview.style.opacity = this.customTheme.window.opacity;
            
            if (titlebar) {
                titlebar.style.height = `${this.customTheme.window.titlebarHeight}px`;
            }
        }
    }
    
    /**
     * Apply window styles to all windows
     */
    applyWindowStyles() {
        // Apply to CSS variables for future windows
        const root = document.documentElement;
        root.style.setProperty('--nebula-radius-lg', `${this.customTheme.window.borderRadius}px`);
        root.style.setProperty('--window-titlebar-height', `${this.customTheme.window.titlebarHeight}px`);
        root.style.setProperty('--nebula-shadow-lg', `0 8px 32px rgba(0, 0, 0, ${this.customTheme.window.shadowIntensity})`);
        root.style.setProperty('--nebula-blur', `${this.customTheme.window.glassBlur}px`);
        
        // Apply to existing windows
        this.updateExistingWindows();
        
        this.saveSettings();
        console.log('Window styles applied');
    }
    
    /**
     * Update all existing windows with new styles
     */
    updateExistingWindows() {
        const windows = document.querySelectorAll('.nebula-window');
        windows.forEach(window => {
            window.style.borderRadius = `${this.customTheme.window.borderRadius}px`;
            window.style.boxShadow = `0 8px 32px rgba(0, 0, 0, ${this.customTheme.window.shadowIntensity})`;
            window.style.backdropFilter = `blur(${this.customTheme.window.glassBlur}px)`;
            window.style.opacity = this.customTheme.window.opacity;
            
            const titlebar = window.querySelector('.window-titlebar');
            if (titlebar) {
                titlebar.style.height = `${this.customTheme.window.titlebarHeight}px`;
            }
        });
    }
    
    /**
     * Reset window styles to defaults
     */
    resetWindowStyles(container) {
        this.customTheme.window = {
            borderRadius: 12,
            shadowIntensity: 0.35,
            glassBlur: 10,
            titlebarHeight: 40,
            opacity: 1.0
        };
        
        // Update sliders
        const updates = [
            { id: 'borderRadius', value: 12 },
            { id: 'titlebarHeight', value: 40 },
            { id: 'shadowIntensity', value: 0.35 },
            { id: 'glassBlur', value: 10 },
            { id: 'windowOpacity', value: 1.0 }
        ];
        
        updates.forEach(({ id, value }) => {
            const slider = container.querySelector(`#${id}`);
            const valueDisplay = container.querySelector(`#${id}Value`);
            
            if (slider) slider.value = value;
            if (valueDisplay) {
                if (id === 'shadowIntensity' || id === 'windowOpacity') {
                    valueDisplay.textContent = Math.round(value * 100);
                } else {
                    valueDisplay.textContent = value;
                }
            }
        });
        
        this.updateWindowPreview(container);
    }
    
    /**
     * Preview styles on all windows temporarily
     */
    previewWindowStylesOnAll() {
        this.updateExistingWindows();
        
        // Show temporary message
        const preview = document.querySelector('#windowPreview');
        const originalContent = preview.innerHTML;
        
        preview.innerHTML = `
            <div style="
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100%;
                color: var(--nebula-primary);
                font-weight: 600;
                font-size: 14px;
                text-align: center;
            ">
                ✓ Preview Applied<br>
                <span style="font-size: 12px; font-weight: normal; opacity: 0.7;">
                    Click "Apply" to make permanent
                </span>
            </div>
        `;
        
    /**
     * Render the Effects tab
     */
    renderEffectsTab() {
        return `
            <div class="tab-header" style="margin-bottom: 30px;">
                <h2 style="color: var(--nebula-text-primary); margin: 0 0 8px 0; font-size: 28px; font-weight: 700; display: flex; align-items: center; gap: 12px;">
                    <span class="material-symbols-outlined" style="color: var(--nebula-primary); font-size: 32px;">auto_fix_high</span>
                    Effects
                </h2>
                <p style="color: var(--nebula-text-secondary); margin: 0; font-size: 16px;">Customize animations and visual effects</p>
            </div>

            <!-- Animation Settings -->
            <div class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Window Animations</h3>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
                    <div>
                        <label style="display: block; margin-bottom: 8px; color: var(--nebula-text-primary); font-weight: 500;">Animation Speed</label>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <input type="range" id="animationSpeed" min="0.1" max="2" step="0.1" value="1" style="
                                flex: 1;
                                height: 6px;
                                background: var(--nebula-surface-hover);
                                outline: none;
                                border-radius: 3px;
                                cursor: pointer;
                            ">
                            <div style="min-width: 60px; text-align: center; color: var(--nebula-text-primary); font-family: monospace; background: var(--nebula-bg-secondary); padding: 4px 8px; border-radius: 4px; border: 1px solid var(--nebula-border);">
                                <span id="animationSpeedValue">1.0</span>x
                            </div>
                        </div>
                        <div style="margin-top: 8px; font-size: 12px; color: var(--nebula-text-secondary);">Controls speed of window animations</div>
                    </div>
                    
                    <div>
                        <label style="display: block; margin-bottom: 12px; color: var(--nebula-text-primary); font-weight: 500;">Enable Animations</label>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            <label style="display: flex; align-items: center; gap: 8px; color: var(--nebula-text-primary); cursor: pointer;">
                                <input type="checkbox" id="enableWindowAnimations" checked style="width: 16px; height: 16px;">
                                <span>Window open/close animations</span>
                            </label>
                            <label style="display: flex; align-items: center; gap: 8px; color: var(--nebula-text-primary); cursor: pointer;">
                                <input type="checkbox" id="enableHoverEffects" checked style="width: 16px; height: 16px;">
                                <span>Button hover effects</span>
                            </label>
                            <label style="display: flex; align-items: center; gap: 8px; color: var(--nebula-text-primary); cursor: pointer;">
                                <input type="checkbox" id="enableTransitions" checked style="width: 16px; height: 16px;">
                                <span>Smooth transitions</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Desktop Effects -->
            <div class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Desktop Effects</h3>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
                    <div>
                        <label style="display: block; margin-bottom: 12px; color: var(--nebula-text-primary); font-weight: 500;">Particle Effects</label>
                        <select id="particleEffect" style="
                            width: 100%;
                            height: 40px;
                            border: 1px solid var(--nebula-border);
                            border-radius: 6px;
                            padding: 0 12px;
                            background: var(--nebula-bg-secondary);
                            color: var(--nebula-text-primary);
                            font-size: 14px;
                        ">
                            <option value="none">None</option>
                            <option value="stars">Floating Stars</option>
                            <option value="dots">Moving Dots</option>
                            <option value="bubbles">Bubbles</option>
                        </select>
                        <div style="margin-top: 8px; font-size: 12px; color: var(--nebula-text-secondary);">Background particle animations</div>
                    </div>
                    
                    <div>
                        <label style="display: block; margin-bottom: 8px; color: var(--nebula-text-primary); font-weight: 500;">Effect Intensity</label>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <input type="range" id="effectIntensity" min="10" max="100" value="30" style="
                                flex: 1;
                                height: 6px;
                                background: var(--nebula-surface-hover);
                                outline: none;
                                border-radius: 3px;
                                cursor: pointer;
                            ">
                            <div style="min-width: 60px; text-align: center; color: var(--nebula-text-primary); font-family: monospace; background: var(--nebula-bg-secondary); padding: 4px 8px; border-radius: 4px; border: 1px solid var(--nebula-border);">
                                <span id="effectIntensityValue">30</span>
                            </div>
                        </div>
                        <div style="margin-top: 8px; font-size: 12px; color: var(--nebula-text-secondary);">Number of particles to render</div>
                    </div>
                </div>
                
                <div style="margin-top: 16px;">
                    <button id="toggleParticles" style="
                        background: var(--nebula-primary);
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 500;
                        margin-right: 12px;
                    ">Apply Particle Effect</button>
                    
                    <button id="stopParticles" style="
                        background: var(--nebula-surface-hover);
                        color: var(--nebula-text-primary);
                        border: 1px solid var(--nebula-border);
                        padding: 12px 24px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 500;
                    ">Stop Effects</button>
                </div>
            </div>

            <!-- Performance -->
            <div class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: 12px; padding: 24px;">
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Performance</h3>
                
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <label style="display: flex; align-items: center; gap: 8px; color: var(--nebula-text-primary); cursor: pointer;">
                        <input type="checkbox" id="reducedMotion" style="width: 16px; height: 16px;">
                        <span>Reduce motion (accessibility)</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; color: var(--nebula-text-primary); cursor: pointer;">
                        <input type="checkbox" id="hardwareAcceleration" checked style="width: 16px; height: 16px;">
                        <span>Hardware acceleration</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; color: var(--nebula-text-primary); cursor: pointer;">
                        <input type="checkbox" id="highRefreshRate" style="width: 16px; height: 16px;">
                        <span>High refresh rate support</span>
                    </label>
                </div>
                
                <div style="margin-top: 16px; padding: 12px; background: var(--nebula-bg-secondary); border-radius: 6px; border: 1px solid var(--nebula-border);">
                    <div style="color: var(--nebula-text-secondary); font-size: 12px; font-weight: 500; margin-bottom: 4px;">Performance Tip</div>
                    <div style="color: var(--nebula-text-primary); font-size: 13px;">
                        Disable effects if experiencing slow performance. Particle effects may impact battery life on laptops.
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Set up listeners for the Effects tab
     */
    setupEffectsListeners(container) {
        // Animation speed slider
        const speedSlider = container.querySelector('#animationSpeed');
        const speedValue = container.querySelector('#animationSpeedValue');
        
        speedSlider?.addEventListener('input', () => {
            const speed = parseFloat(speedSlider.value);
            speedValue.textContent = speed.toFixed(1);
            this.updateAnimationSpeed(speed);
        });
        
        // Effect intensity slider
        const intensitySlider = container.querySelector('#effectIntensity');
        const intensityValue = container.querySelector('#effectIntensityValue');
        
        intensitySlider?.addEventListener('input', () => {
            intensityValue.textContent = intensitySlider.value;
        });
        
        // Animation checkboxes
        const animationCheckboxes = ['enableWindowAnimations', 'enableHoverEffects', 'enableTransitions'];
        animationCheckboxes.forEach(id => {
            const checkbox = container.querySelector(`#${id}`);
            checkbox?.addEventListener('change', () => {
                this.updateAnimationSettings();
            });
        });
        
        // Particle effect buttons
        const toggleBtn = container.querySelector('#toggleParticles');
        const stopBtn = container.querySelector('#stopParticles');
        
        toggleBtn?.addEventListener('click', () => {
            this.toggleParticleEffect(container);
        });
        
        stopBtn?.addEventListener('click', () => {
            this.stopParticleEffect();
        });
        
        // Performance checkboxes
        const performanceCheckboxes = ['reducedMotion', 'hardwareAcceleration', 'highRefreshRate'];
        performanceCheckboxes.forEach(id => {
            const checkbox = container.querySelector(`#${id}`);
            checkbox?.addEventListener('change', () => {
                this.updatePerformanceSettings();
            });
        });
    }
    
    /**
     * Render the System tab
     */
    renderSystemTab() {
        return `
            <div class="tab-header" style="margin-bottom: 30px;">
                <h2 style="color: var(--nebula-text-primary); margin: 0 0 8px 0; font-size: 28px; font-weight: 700; display: flex; align-items: center; gap: 12px;">
                    <span class="material-symbols-outlined" style="color: var(--nebula-primary); font-size: 32px;">settings_applications</span>
                    System
                </h2>
                <p style="color: var(--nebula-text-secondary); margin: 0; font-size: 16px;">System information and data management</p>
            </div>

            <!-- System Information -->
            <div class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">System Information</h3>
                
                <div class="system-info-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px;">
                    <div style="background: var(--nebula-bg-secondary); padding: 16px; border-radius: 8px; border: 1px solid var(--nebula-border);">
                        <div style="color: var(--nebula-text-secondary); font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Version</div>
                        <div style="color: var(--nebula-text-primary); font-weight: 600;">NebulaDesktop v3.0</div>
                    </div>
                    <div style="background: var(--nebula-bg-secondary); padding: 16px; border-radius: 8px; border: 1px solid var(--nebula-border);">
                        <div style="color: var(--nebula-text-secondary); font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Platform</div>
                        <div style="color: var(--nebula-text-primary); font-weight: 600;" id="platformInfo">Loading...</div>
                    </div>
                    <div style="background: var(--nebula-bg-secondary); padding: 16px; border-radius: 8px; border: 1px solid var(--nebula-border);">
                        <div style="color: var(--nebula-text-secondary); font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Theme</div>
                        <div style="color: var(--nebula-text-primary); font-weight: 600; text-transform: capitalize;" id="currentThemeDisplay">${this.currentTheme}</div>
                    </div>
                    <div style="background: var(--nebula-bg-secondary); padding: 16px; border-radius: 8px; border: 1px solid var(--nebula-border);">
                        <div style="color: var(--nebula-text-secondary); font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Running Apps</div>
                        <div style="color: var(--nebula-text-primary); font-weight: 600;" id="runningAppsCount">Loading...</div>
                    </div>
                    <div style="background: var(--nebula-bg-secondary); padding: 16px; border-radius: 8px; border: 1px solid var(--nebula-border);">
                        <div style="color: var(--nebula-text-secondary); font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Uptime</div>
                        <div style="color: var(--nebula-text-primary); font-weight: 600;" id="uptimeDisplay">Loading...</div>
                    </div>
                    <div style="background: var(--nebula-bg-secondary); padding: 16px; border-radius: 8px; border: 1px solid var(--nebula-border);">
                        <div style="color: var(--nebula-text-secondary); font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Memory Usage</div>
                        <div style="color: var(--nebula-text-primary); font-weight: 600;" id="memoryUsage">Loading...</div>
                    </div>
                </div>
                
                <button id="refreshSystemInfo" style="
                    background: var(--nebula-primary);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                    margin-top: 16px;
                ">Refresh Information</button>
            </div>

            <!-- Storage & Data Management -->
            <div class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Storage & Data</h3>
                
                <div style="margin-bottom: 20px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                        <div>
                            <div style="color: var(--nebula-text-primary); font-weight: 500; margin-bottom: 4px;">Local Storage Usage</div>
                            <div style="color: var(--nebula-text-secondary); font-size: 14px;" id="storageUsage">Calculating...</div>
                        </div>
                        <button id="refreshStorageBtn" style="
                            background: var(--nebula-surface-hover);
                            border: 1px solid var(--nebula-border);
                            color: var(--nebula-text-primary);
                            padding: 8px 16px;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 14px;
                            transition: all 0.2s ease;
                        ">
                            <span class="material-symbols-outlined" style="font-size: 16px; vertical-align: middle;">refresh</span>
                        </button>
                    </div>
                    
                    <div id="storageBreakdown" style="background: var(--nebula-bg-secondary); padding: 12px; border-radius: 6px; border: 1px solid var(--nebula-border); font-size: 12px; color: var(--nebula-text-secondary);">
                        Loading storage details...
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
                    <button id="clearAllDataBtn" style="
                        background: var(--nebula-danger);
                        color: white;
                        border: none;
                        padding: 12px 20px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 500;
                        transition: all 0.2s ease;
                    ">
                        <span class="material-symbols-outlined" style="font-size: 16px; vertical-align: middle; margin-right: 6px;">delete</span>
                        Clear All Data
                    </button>
                    
                    <button id="exportAllSettingsBtn" style="
                        background: var(--nebula-primary);
                        color: white;
                        border: none;
                        padding: 12px 20px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 500;
                        transition: all 0.2s ease;
                    ">
                        <span class="material-symbols-outlined" style="font-size: 16px; vertical-align: middle; margin-right: 6px;">download</span>
                        Export Settings
                    </button>
                    
                    <button id="importSettingsBtn" style="
                        background: var(--nebula-surface-hover);
                        color: var(--nebula-text-primary);
                        border: 1px solid var(--nebula-border);
                        padding: 12px 20px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 500;
                        transition: all 0.2s ease;
                    ">
                        <span class="material-symbols-outlined" style="font-size: 16px; vertical-align: middle; margin-right: 6px;">upload</span>
                        Import Settings
                    </button>
                </div>
                
                <input type="file" id="settingsFileInput" accept=".json" style="display: none;">
            </div>

            <!-- Keyboard Shortcuts -->
            <div class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Keyboard Shortcuts</h3>
                
                <div class="shortcuts-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--nebula-bg-secondary); border-radius: 6px;">
                        <span style="color: var(--nebula-text-primary); font-weight: 500;">Open Launcher</span>
                        <kbd style="background: var(--nebula-surface-hover); padding: 4px 8px; border-radius: 4px; font-family: monospace; color: var(--nebula-text-primary); border: 1px solid var(--nebula-border);">Alt + Space</kbd>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--nebula-bg-secondary); border-radius: 6px;">
                        <span style="color: var(--nebula-text-primary); font-weight: 500;">AI Assistant</span>
                        <kbd style="background: var(--nebula-surface-hover); padding: 4px 8px; border-radius: 4px; font-family: monospace; color: var(--nebula-text-primary); border: 1px solid var(--nebula-border);">Alt + A</kbd>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--nebula-bg-secondary); border-radius: 6px;">
                        <span style="color: var(--nebula-text-primary); font-weight: 500;">Close Window</span>
                        <kbd style="background: var(--nebula-surface-hover); padding: 4px 8px; border-radius: 4px; font-family: monospace; color: var(--nebula-text-primary); border: 1px solid var(--nebula-border);">Ctrl + W</kbd>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--nebula-bg-secondary); border-radius: 6px;">
                        <span style="color: var(--nebula-text-primary); font-weight: 500;">Switch Windows</span>
                        <kbd style="background: var(--nebula-surface-hover); padding: 4px 8px; border-radius: 4px; font-family: monospace; color: var(--nebula-text-primary); border: 1px solid var(--nebula-border);">Alt + Tab</kbd>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--nebula-bg-secondary); border-radius: 6px;">
                        <span style="color: var(--nebula-text-primary); font-weight: 500;">New Tab (Browser)</span>
                        <kbd style="background: var(--nebula-surface-hover); padding: 4px 8px; border-radius: 4px; font-family: monospace; color: var(--nebula-text-primary); border: 1px solid var(--nebula-border);">Ctrl + T</kbd>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--nebula-bg-secondary); border-radius: 6px;">
                        <span style="color: var(--nebula-text-primary); font-weight: 500;">Refresh Page</span>
                        <kbd style="background: var(--nebula-surface-hover); padding: 4px 8px; border-radius: 4px; font-family: monospace; color: var(--nebula-text-primary); border: 1px solid var(--nebula-border);">F5</kbd>
                    </div>
                </div>
            </div>

            <!-- About Section -->
            <div class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: 12px; padding: 24px;">
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">About NebulaDesktop</h3>
                
                <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">✨</div>
                    <h4 style="color: var(--nebula-text-primary); margin: 0 0 8px 0; font-size: 24px; font-weight: 700;">NebulaDesktop v3.0</h4>
                    <p style="color: var(--nebula-text-secondary); margin: 0 0 16px 0; font-size: 16px;">A modern, web-based desktop environment</p>
                    <div style="background: var(--nebula-bg-secondary); border-radius: 8px; padding: 16px; margin: 20px 0; text-align: left;">
                        <div style="color: var(--nebula-text-primary); font-weight: 600; margin-bottom: 8px;">Features:</div>
                        <ul style="color: var(--nebula-text-secondary); font-size: 14px; margin: 0; padding-left: 20px;">
                            <li>Integrated window management system</li>
                            <li>AI assistant with multiple services</li>
                            <li>Full-featured terminal emulator</li>
                            <li>Advanced theming and customization</li>
                            <li>Web-based browser with vertical tabs</li>
                            <li>ChromeOS-inspired user interface</li>
                        </ul>
                    </div>
                    <p style="color: var(--nebula-text-secondary); font-size: 14px; line-height: 1.5;">
                        Built with Electron, featuring modern web technologies<br>
                        and designed for productivity and customization.
                    </p>
                </div>
            </div>
        `;
    }
    
    /**
     * Set up listeners for the System tab
     */
    setupSystemListeners(container) {
        // Refresh system info button
        const refreshBtn = container.querySelector('#refreshSystemInfo');
        refreshBtn?.addEventListener('click', () => {
            this.updateSystemInfo(container);
        });

        // Storage management buttons
        const clearDataBtn = container.querySelector('#clearAllDataBtn');
        const exportBtn = container.querySelector('#exportAllSettingsBtn');
        const importBtn = container.querySelector('#importSettingsBtn');
        const fileInput = container.querySelector('#settingsFileInput');
        const refreshStorageBtn = container.querySelector('#refreshStorageBtn');

        clearDataBtn?.addEventListener('click', () => {
            this.clearAllData(container);
        });

        exportBtn?.addEventListener('click', () => {
            this.exportAllSettings();
        });

        importBtn?.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput?.addEventListener('change', (e) => {
            this.importAllSettings(e.target.files[0], container);
        });

        refreshStorageBtn?.addEventListener('click', () => {
            this.updateStorageInfo(container);
        });

        // Update system info initially
        this.updateSystemInfo(container);
    }
    
    /**
     * App interface methods
     */
    getTitle() {
        return 'Settings';
    }

    getIcon() {
        return '⚙️';
    }

    cleanup() {
        console.log('Settings cleaned up');
    }
    
    // Utility methods
    isValidColor(color) {
        return /^#[0-9A-F]{6}$/i.test(color);
    }
    
    loadSettings() {
        try {
            const saved = localStorage.getItem('nebula-advanced-settings');
            if (saved) {
                const settings = JSON.parse(saved);
                this.customTheme = { ...this.customTheme, ...settings.customTheme };
                this.wallpaperSettings = { ...this.wallpaperSettings, ...settings.wallpaperSettings };
            }
        } catch (error) {
            console.warn('Could not load advanced settings:', error);
        }
    }
    
    saveSettings() {
        try {
            const settings = {
                customTheme: this.customTheme,
                wallpaperSettings: this.wallpaperSettings
            };
            localStorage.setItem('nebula-advanced-settings', JSON.stringify(settings));
        } catch (error) {
            console.warn('Could not save advanced settings:', error);
        }
    }
}

// Make NebulaSettings available globally
window.NebulaSettings = NebulaSettings;