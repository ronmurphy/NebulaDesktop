class NebulaSettings {
    constructor() {
        this.windowId = null;
        this.activeTab = 'appearance';
        this.currentTheme = localStorage.getItem('nebula-theme') || 'dark';
        this.customTheme = {
            name: 'Custom Theme',
            primary: '#667eea',
            secondary: '#764ba2',
            accent: '#f093fb',
            background: '#1a1a2e',
            surface: '#16213e',
            text: '#eee',
            border: '#0f3460'
        };
        this.wallpaperSettings = {
            type: 'gradient',
            gradient: {
                start: '#667eea',
                end: '#764ba2',
                direction: '135deg'
            },
            solid: '#1a1a2e',
            image: null,
            imageSource: null
        };
        this.effectSettings = {
            animationSpeed: 1.0,
            enableWindowAnimations: true,
            enableHoverEffects: true,
            enableTransitions: true,
            particleEffect: 'none',
            effectIntensity: 30,
            reducedMotion: false,
            hardwareAcceleration: true,
            highRefreshRate: false
        };
        this.particlesActive = false;
        this.startTime = Date.now();
        
        this.loadSettings();
        this.init();
    }

    /**
     * Initialize the settings app - create window and setup
     */
    async init() {
        if (!window.windowManager) {
            console.error('WindowManager not available');
            return;
        }
        
        // Create a window for the settings app
        this.windowId = window.windowManager.createWindow({
            title: 'Settings',
            width: 1000,
            height: 700,
            hasTabBar: false,
            resizable: true,
            maximizable: true,
            minimizable: true
        });
        
        // Load this settings app into the window
        window.windowManager.loadApp(this.windowId, this);
        
        // Set up drag and drop for theme files
        this.setupDragAndDrop();
        
        console.log(`Settings app initialized with window ${this.windowId}`);
    }

    setupDragAndDrop() {
        // Wait for window to be created
        setTimeout(() => {
            const windowElement = document.getElementById(this.windowId);
            if (windowElement) {
                this.addDragDropHandlers(windowElement);
            }
        }, 100);
    }

    addDragDropHandlers(element) {
        element.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Add visual feedback
            element.style.outline = '2px dashed var(--nebula-primary)';
            element.style.outlineOffset = '4px';
        });

        element.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Remove visual feedback
            element.style.outline = 'none';
        });

        element.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Remove visual feedback
            element.style.outline = 'none';
            
            const files = Array.from(e.dataTransfer.files);
            const themeFiles = files.filter(file => 
                file.name.endsWith('.nebulatheme') || 
                file.name.endsWith('.json')
            );

            if (themeFiles.length > 0) {
                // Import the first theme file found
                this.importTheme(themeFiles[0]);
                
                if (themeFiles.length > 1) {
                    this.showNotification(`📁 ${themeFiles.length} theme files found, importing the first one`);
                }
            } else if (files.length > 0) {
                this.showNotification('⚠️ Please drop .nebulatheme or .json files only', 'warning');
            }
        });
    }
    
    /**
     * Create the settings interface
     */
    render() {
        const container = document.createElement('div');
        container.style.cssText = `
            width: 100%;
            height: 100%;
            display: flex;
            background: var(--nebula-bg-primary);
            color: var(--nebula-text-primary);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            overflow: hidden;
        `;
        
        container.innerHTML = `
            <!-- Settings Navigation -->
            <div class="settings-sidebar" style="
                width: 280px;
                background: var(--nebula-surface);
                border-right: 1px solid var(--nebula-border);
                padding: 30px 0;
                overflow-y: auto;
            ">
                <div style="padding: 0 24px 24px 24px; border-bottom: 1px solid var(--nebula-border);">
                    <h1 style="color: var(--nebula-text-primary); margin: 0; font-size: 24px; font-weight: 700;">Settings</h1>
                    <p style="color: var(--nebula-text-secondary); margin: 8px 0 0 0; font-size: 14px;">Customize your NebulaDesktop experience</p>
                </div>
                
                <nav style="padding: 24px 0;">
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

    // ==================== APPEARANCE TAB ====================
    
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
                        border-radius: 12px;
                        padding: 20px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        text-align: center;
                    ">
                        <div style="width: 40px; height: 40px; background: linear-gradient(45deg, #667eea, #764ba2); border-radius: 8px; margin: 0 auto 12px auto;"></div>
                        <h4 style="color: #1a202c; margin: 0 0 4px 0; font-weight: 600;">Light</h4>
                        <p style="color: #4a5568; margin: 0; font-size: 12px;">Clean and bright</p>
                    </div>
                    
                    <div class="theme-card ${this.currentTheme === 'dark' ? 'selected' : ''}" data-theme="dark" style="
                        background: linear-gradient(135deg, #2d3748, #1a202c);
                        border: 2px solid ${this.currentTheme === 'dark' ? 'var(--nebula-primary)' : 'var(--nebula-border)'};
                        border-radius: 12px;
                        padding: 20px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        text-align: center;
                        color: white;
                    ">
                        <div style="width: 40px; height: 40px; background: linear-gradient(45deg, #667eea, #764ba2); border-radius: 8px; margin: 0 auto 12px auto;"></div>
                        <h4 style="color: #f7fafc; margin: 0 0 4px 0; font-weight: 600;">Dark</h4>
                        <p style="color: #cbd5e0; margin: 0; font-size: 12px;">Easy on the eyes</p>
                    </div>
                    
                    <div class="theme-card ${this.currentTheme === 'nebula' ? 'selected' : ''}" data-theme="nebula" style="
                        background: linear-gradient(135deg, #1a1a2e, #16213e);
                        border: 2px solid ${this.currentTheme === 'nebula' ? 'var(--nebula-primary)' : 'var(--nebula-border)'};
                        border-radius: 12px;
                        padding: 20px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        text-align: center;
                        color: white;
                    ">
                        <div style="width: 40px; height: 40px; background: linear-gradient(45deg, #667eea, #764ba2); border-radius: 8px; margin: 0 auto 12px auto;"></div>
                        <h4 style="color: #f7fafc; margin: 0 0 4px 0; font-weight: 600;">Nebula</h4>
                        <p style="color: #cbd5e0; margin: 0; font-size: 12px;">Space-inspired</p>
                    </div>
                </div>
            </div>

            <!-- Custom Theme -->
            <div class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Custom Theme</h3>
                <div class="color-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                    <div>
                        <label style="display: block; margin-bottom: 8px; color: var(--nebula-text-primary); font-weight: 500;">Primary Color</label>
                        <div style="display: flex; gap: 8px;">
                            <input type="color" id="primaryColor" value="${this.customTheme.primary}" style="width: 50px; height: 40px; border: none; border-radius: 6px; cursor: pointer;">
                            <input type="text" id="primaryColorText" value="${this.customTheme.primary}" style="flex: 1; height: 40px; border: 1px solid var(--nebula-border); border-radius: 6px; padding: 0 12px; background: var(--nebula-bg-secondary); color: var(--nebula-text-primary);">
                        </div>
                    </div>
                    
                    <div>
                        <label style="display: block; margin-bottom: 8px; color: var(--nebula-text-primary); font-weight: 500;">Background Color</label>
                        <div style="display: flex; gap: 8px;">
                            <input type="color" id="backgroundColor" value="${this.customTheme.background}" style="width: 50px; height: 40px; border: none; border-radius: 6px; cursor: pointer;">
                            <input type="text" id="backgroundColorText" value="${this.customTheme.background}" style="flex: 1; height: 40px; border: 1px solid var(--nebula-border); border-radius: 6px; padding: 0 12px; background: var(--nebula-bg-secondary); color: var(--nebula-text-primary);">
                        </div>
                    </div>
                    
                    <div>
                        <label style="display: block; margin-bottom: 8px; color: var(--nebula-text-primary); font-weight: 500;">Surface Color</label>
                        <div style="display: flex; gap: 8px;">
                            <input type="color" id="surfaceColor" value="${this.customTheme.surface}" style="width: 50px; height: 40px; border: none; border-radius: 6px; cursor: pointer;">
                            <input type="text" id="surfaceColorText" value="${this.customTheme.surface}" style="flex: 1; height: 40px; border: 1px solid var(--nebula-border); border-radius: 6px; padding: 0 12px; background: var(--nebula-bg-secondary); color: var(--nebula-text-primary);">
                        </div>
                    </div>
                    
                    <div>
                        <label style="display: block; margin-bottom: 8px; color: var(--nebula-text-primary); font-weight: 500;">Accent Color</label>
                        <div style="display: flex; gap: 8px;">
                            <input type="color" id="accentColor" value="${this.customTheme.accent}" style="width: 50px; height: 40px; border: none; border-radius: 6px; cursor: pointer;">
                            <input type="text" id="accentColorText" value="${this.customTheme.accent}" style="flex: 1; height: 40px; border: 1px solid var(--nebula-border); border-radius: 6px; padding: 0 12px; background: var(--nebula-bg-secondary); color: var(--nebula-text-primary);">
                        </div>
                    </div>
                </div>
                
                <div style="margin-top: 20px; display: flex; gap: 12px; flex-wrap: wrap;">
                    <button id="previewCustomTheme" style="background: var(--nebula-primary); color: white; border: none; padding: 12px 20px; border-radius: 8px; cursor: pointer; font-weight: 500;">Preview</button>
                    <button id="applyCustomTheme" style="background: var(--nebula-surface-hover); color: var(--nebula-text-primary); border: 1px solid var(--nebula-border); padding: 12px 20px; border-radius: 8px; cursor: pointer; font-weight: 500;">Apply</button>
                    <button id="resetTheme" style="background: transparent; color: var(--nebula-text-secondary); border: 1px solid var(--nebula-border); padding: 12px 20px; border-radius: 8px; cursor: pointer; font-weight: 500;">Reset</button>
                </div>
            </div>

            <!-- Theme Management -->
            <div class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: 12px; padding: 24px;">
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Theme Management</h3>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; color: var(--nebula-text-primary); font-weight: 500;">Theme Name</label>
                    <input type="text" id="themeNameInput" placeholder="My Custom Theme" value="${this.customTheme.name || 'Custom Theme'}" style="
                        width: 100%;
                        max-width: 300px;
                        height: 40px;
                        border: 1px solid var(--nebula-border);
                        border-radius: 6px;
                        padding: 0 12px;
                        background: var(--nebula-bg-secondary);
                        color: var(--nebula-text-primary);
                        font-size: 14px;
                    ">
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 16px;">
                    <button id="saveThemeToFile" style="
                        background: var(--nebula-primary);
                        color: white;
                        border: none;
                        padding: 12px 20px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 500;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                    ">
                        <span class="material-symbols-outlined" style="font-size: 16px;">save</span>
                        Save Theme
                    </button>
                    
                    <button id="loadThemeFromFile" style="
                        background: var(--nebula-surface-hover);
                        color: var(--nebula-text-primary);
                        border: 1px solid var(--nebula-border);
                        padding: 12px 20px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 500;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                    ">
                        <span class="material-symbols-outlined" style="font-size: 16px;">folder_open</span>
                        Load Theme
                    </button>
                    
                    <button id="exportTheme" style="
                        background: var(--nebula-surface-hover);
                        color: var(--nebula-text-primary);
                        border: 1px solid var(--nebula-border);
                        padding: 12px 20px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 500;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                    ">
                        <span class="material-symbols-outlined" style="font-size: 16px;">download</span>
                        Download
                    </button>
                    
                    <button id="importTheme" style="
                        background: var(--nebula-surface-hover);
                        color: var(--nebula-text-primary);
                        border: 1px solid var(--nebula-border);
                        padding: 12px 20px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 500;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                    ">
                        <span class="material-symbols-outlined" style="font-size: 16px;">upload</span>
                        Upload File
                    </button>
                </div>
                
                <input type="file" id="themeFileInput" accept=".json,.nebulatheme" style="display: none;">
                
                <div style="background: var(--nebula-bg-secondary); padding: 12px; border-radius: 6px; border: 1px solid var(--nebula-border);">
                    <div style="font-size: 12px; color: var(--nebula-text-secondary); line-height: 1.4;">
                        💾 <strong>Save Theme:</strong> Stores your theme in ~/.nebula/themes/<br>
                        📁 <strong>Load Theme:</strong> Browse and load saved themes<br>
                        💎 <strong>Download:</strong> Export as .nebulatheme file<br>
                        📤 <strong>Upload File:</strong> Import .nebulatheme from anywhere
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Set up listeners for the Appearance tab
     */
    setupAppearanceListeners(container) {
        // Theme card selection
        const themeCards = container.querySelectorAll('.theme-card');
        themeCards.forEach(card => {
            card.addEventListener('click', () => {
                const theme = card.dataset.theme;
                this.applyTheme(theme);
                this.updateThemeSelection(container, theme);
            });
        });
        
        // Color picker synchronization
        const colorPairs = [
            ['primaryColor', 'primaryColorText'],
            ['backgroundColor', 'backgroundColorText'],
            ['surfaceColor', 'surfaceColorText'],
            ['accentColor', 'accentColorText']
        ];
        
        colorPairs.forEach(([pickerId, textId]) => {
            const picker = container.querySelector(`#${pickerId}`);
            const text = container.querySelector(`#${textId}`);
            
            if (picker && text) {
                picker.addEventListener('input', () => {
                    text.value = picker.value;
                    this.updateCustomThemeColor(pickerId.replace('Color', ''), picker.value);
                });
                
                text.addEventListener('input', () => {
                    if (this.isValidColor(text.value)) {
                        picker.value = text.value;
                        this.updateCustomThemeColor(pickerId.replace('Color', ''), text.value);
                    }
                });
            }
        });
        
        // Theme management buttons
        const themeNameInput = container.querySelector('#themeNameInput');
        const saveThemeBtn = container.querySelector('#saveThemeToFile');
        const loadThemeBtn = container.querySelector('#loadThemeFromFile');
        const previewBtn = container.querySelector('#previewCustomTheme');
        const applyBtn = container.querySelector('#applyCustomTheme');
        const resetBtn = container.querySelector('#resetTheme');
        const exportBtn = container.querySelector('#exportTheme');
        const importBtn = container.querySelector('#importTheme');
        const fileInput = container.querySelector('#themeFileInput');
        
        // Update theme name when input changes
        themeNameInput?.addEventListener('input', () => {
            this.customTheme.name = themeNameInput.value || 'Custom Theme';
        });
        
        saveThemeBtn?.addEventListener('click', () => {
            this.customTheme.name = themeNameInput.value || 'Custom Theme';
            this.exportCurrentTheme();
        });
        loadThemeBtn?.addEventListener('click', () => this.browseThemeFiles());
        previewBtn?.addEventListener('click', () => this.previewCustomTheme());
        applyBtn?.addEventListener('click', () => this.applyCustomTheme());
        resetBtn?.addEventListener('click', () => this.resetToDefaultTheme());
        exportBtn?.addEventListener('click', () => {
            this.customTheme.name = themeNameInput.value || 'Custom Theme';
            const themeData = {
                name: this.customTheme.name,
                theme: this.currentTheme,
                customTheme: this.customTheme,
                wallpaperSettings: this.wallpaperSettings,
                effectSettings: this.effectSettings,
                exportDate: new Date().toISOString(),
                version: 'NebulaDesktop v4.0'
            };
            this.downloadThemeFile(themeData);
        });
        importBtn?.addEventListener('click', () => fileInput.click());
        fileInput?.addEventListener('change', (e) => this.importTheme(e.target.files[0]));
    }

    // ==================== WALLPAPER TAB ====================
    
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
                <div class="wallpaper-type-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px;">
                    <div class="wallpaper-type ${this.wallpaperSettings.type === 'gradient' ? 'selected' : ''}" data-type="gradient" style="
                        background: linear-gradient(135deg, ${this.wallpaperSettings.gradient.start}, ${this.wallpaperSettings.gradient.end});
                        border: 2px solid ${this.wallpaperSettings.type === 'gradient' ? 'var(--nebula-primary)' : 'var(--nebula-border)'};
                        border-radius: 8px;
                        height: 80px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        position: relative;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-weight: 500;
                        text-shadow: 0 1px 2px rgba(0,0,0,0.5);
                    ">Gradient</div>
                    
                    <div class="wallpaper-type ${this.wallpaperSettings.type === 'solid' ? 'selected' : ''}" data-type="solid" style="
                        background: ${this.wallpaperSettings.solid};
                        border: 2px solid ${this.wallpaperSettings.type === 'solid' ? 'var(--nebula-primary)' : 'var(--nebula-border)'};
                        border-radius: 8px;
                        height: 80px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: var(--nebula-text-primary);
                        font-weight: 500;
                    ">Solid Color</div>
                    
                    <div class="wallpaper-type ${this.wallpaperSettings.type === 'image' ? 'selected' : ''}" data-type="image" style="
                        background: var(--nebula-surface-hover);
                        border: 2px solid ${this.wallpaperSettings.type === 'image' ? 'var(--nebula-primary)' : 'var(--nebula-border)'};
                        border-radius: 8px;
                        height: 80px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        color: var(--nebula-text-primary);
                        font-weight: 500;
                        gap: 8px;
                    ">
                        <div style="font-size: 24px;">🖼️</div>
                        <div>Image</div>
                    </div>
                </div>
            </div>

            <!-- Gradient Settings -->
            <div id="gradientSettings" class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: 12px; padding: 24px; margin-bottom: 24px; display: ${this.wallpaperSettings.type === 'gradient' ? 'block' : 'none'};">
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Gradient Settings</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                    <div>
                        <label style="display: block; margin-bottom: 8px; color: var(--nebula-text-primary); font-weight: 500;">Start Color</label>
                        <div style="display: flex; gap: 8px;">
                            <input type="color" id="gradientStart" value="${this.wallpaperSettings.gradient.start}" style="width: 50px; height: 40px; border: none; border-radius: 6px; cursor: pointer;">
                            <input type="text" id="gradientStartText" value="${this.wallpaperSettings.gradient.start}" style="flex: 1; height: 40px; border: 1px solid var(--nebula-border); border-radius: 6px; padding: 0 12px; background: var(--nebula-bg-secondary); color: var(--nebula-text-primary);">
                        </div>
                    </div>
                    
                    <div>
                        <label style="display: block; margin-bottom: 8px; color: var(--nebula-text-primary); font-weight: 500;">End Color</label>
                        <div style="display: flex; gap: 8px;">
                            <input type="color" id="gradientEnd" value="${this.wallpaperSettings.gradient.end}" style="width: 50px; height: 40px; border: none; border-radius: 6px; cursor: pointer;">
                            <input type="text" id="gradientEndText" value="${this.wallpaperSettings.gradient.end}" style="flex: 1; height: 40px; border: 1px solid var(--nebula-border); border-radius: 6px; padding: 0 12px; background: var(--nebula-bg-secondary); color: var(--nebula-text-primary);">
                        </div>
                    </div>
                    
                    <div>
                        <label style="display: block; margin-bottom: 8px; color: var(--nebula-text-primary); font-weight: 500;">Direction</label>
                        <select id="gradientDirection" style="width: 100%; height: 40px; border: 1px solid var(--nebula-border); border-radius: 6px; padding: 0 12px; background: var(--nebula-bg-secondary); color: var(--nebula-text-primary);">
                            <option value="135deg" ${this.wallpaperSettings.gradient.direction === '135deg' ? 'selected' : ''}>Diagonal ↘</option>
                            <option value="90deg" ${this.wallpaperSettings.gradient.direction === '90deg' ? 'selected' : ''}>Vertical ↓</option>
                            <option value="45deg" ${this.wallpaperSettings.gradient.direction === '45deg' ? 'selected' : ''}>Diagonal ↗</option>
                            <option value="0deg" ${this.wallpaperSettings.gradient.direction === '0deg' ? 'selected' : ''}>Horizontal →</option>
                        </select>
                    </div>
                </div>
                
                <div style="margin-top: 16px;">
                    <div style="height: 60px; border-radius: 8px; background: linear-gradient(${this.wallpaperSettings.gradient.direction}, ${this.wallpaperSettings.gradient.start}, ${this.wallpaperSettings.gradient.end}); border: 1px solid var(--nebula-border);"></div>
                </div>
            </div>

            <!-- Solid Color Settings -->
            <div id="solidSettings" class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: 12px; padding: 24px; margin-bottom: 24px; display: ${this.wallpaperSettings.type === 'solid' ? 'block' : 'none'};">
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Solid Color</h3>
                <div style="display: flex; gap: 8px; max-width: 300px;">
                    <input type="color" id="solidColor" value="${this.wallpaperSettings.solid}" style="width: 50px; height: 40px; border: none; border-radius: 6px; cursor: pointer;">
                    <input type="text" id="solidColorText" value="${this.wallpaperSettings.solid}" style="flex: 1; height: 40px; border: 1px solid var(--nebula-border); border-radius: 6px; padding: 0 12px; background: var(--nebula-bg-secondary); color: var(--nebula-text-primary);">
                </div>
            </div>

            <!-- Image Settings -->
            <div id="imageSettings" class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: 12px; padding: 24px; margin-bottom: 24px; display: ${this.wallpaperSettings.type === 'image' ? 'block' : 'none'};">
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Background Image</h3>
                
                <!-- URL Input -->
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; color: var(--nebula-text-primary); font-weight: 500;">Image URL</label>
                    <div style="display: flex; gap: 8px;">
                        <input type="url" id="imageUrl" placeholder="https://example.com/image.jpg" style="
                            flex: 1;
                            height: 40px;
                            border: 1px solid var(--nebula-border);
                            border-radius: 6px;
                            padding: 0 12px;
                            background: var(--nebula-bg-secondary);
                            color: var(--nebula-text-primary);
                            font-size: 14px;
                        ">
                        <button id="loadUrlImage" style="
                            background: var(--nebula-primary);
                            color: white;
                            border: none;
                            padding: 0 20px;
                            border-radius: 6px;
                            cursor: pointer;
                            font-weight: 500;
                        ">Load</button>
                    </div>
                    <div style="margin-top: 6px; font-size: 12px; color: var(--nebula-text-secondary);">Enter a direct link to an image file</div>
                </div>
                
                <!-- File Upload -->
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; color: var(--nebula-text-primary); font-weight: 500;">Local File</label>
                    <div style="display: flex; gap: 12px;">
                        <button id="browseLocalImage" style="
                            background: var(--nebula-surface-hover);
                            color: var(--nebula-text-primary);
                            border: 1px solid var(--nebula-border);
                            padding: 12px 20px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-weight: 500;
                        ">
                            <span class="material-symbols-outlined" style="font-size: 16px; vertical-align: middle; margin-right: 6px;">folder_open</span>
                            Browse Local Files
                        </button>
                        
                        <button id="uploadWallpaper" style="
                            background: var(--nebula-primary);
                            color: white;
                            border: none;
                            padding: 12px 20px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-weight: 500;
                        ">
                            <span class="material-symbols-outlined" style="font-size: 16px; vertical-align: middle; margin-right: 6px;">upload</span>
                            Upload Image
                        </button>
                    </div>
                    <input type="file" id="wallpaperFileInput" accept="image/*" style="display: none;">
                </div>
                
                <!-- Current Image Preview -->
                <div id="imagePreview" style="display: ${this.wallpaperSettings.image ? 'block' : 'none'}; margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 8px; color: var(--nebula-text-primary); font-weight: 500;">Current Image</label>
                    <div style="position: relative; max-width: 300px;">
                        <img id="previewImg" src="${this.wallpaperSettings.image || ''}" style="
                            width: 100%;
                            height: 200px;
                            object-fit: cover;
                            border-radius: 8px;
                            border: 1px solid var(--nebula-border);
                        ">
                        <button id="removeCurrentImage" style="
                            position: absolute;
                            top: 8px;
                            right: 8px;
                            background: rgba(239, 68, 68, 0.9);
                            color: white;
                            border: none;
                            width: 24px;
                            height: 24px;
                            border-radius: 50%;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 12px;
                        ">×</button>
                    </div>
                    <div style="margin-top: 8px; font-size: 12px; color: var(--nebula-text-secondary);" id="imageSource">Source: ${this.wallpaperSettings.imageSource || 'Unknown'}</div>
                </div>
            </div>

            <!-- Apply Wallpaper -->
            <div class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: 12px; padding: 24px;">
                <div style="display: flex; gap: 12px; align-items: center;">
                    <button id="applyWallpaper" style="background: var(--nebula-primary); color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 500;">Apply Wallpaper</button>
                    <button id="previewWallpaper" style="background: var(--nebula-surface-hover); color: var(--nebula-text-primary); border: 1px solid var(--nebula-border); padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 500;">Preview</button>
                </div>
            </div>
        `;
    }
    
    /**
     * Set up listeners for the Wallpaper tab
     */
    setupWallpaperListeners(container) {
        // Wallpaper type selection
        const typeCards = container.querySelectorAll('.wallpaper-type');
        typeCards.forEach(card => {
            card.addEventListener('click', () => {
                const type = card.dataset.type;
                this.wallpaperSettings.type = type;
                this.updateWallpaperTypeSelection(container);
            });
        });
        
        // Gradient controls
        const gradientControls = [
            ['gradientStart', 'gradientStartText', 'start'],
            ['gradientEnd', 'gradientEndText', 'end']
        ];
        
        gradientControls.forEach(([pickerId, textId, property]) => {
            const picker = container.querySelector(`#${pickerId}`);
            const text = container.querySelector(`#${textId}`);
            
            if (picker && text) {
                picker.addEventListener('input', () => {
                    text.value = picker.value;
                    this.wallpaperSettings.gradient[property] = picker.value;
                    this.updateGradientPreview(container);
                });
                
                text.addEventListener('input', () => {
                    if (this.isValidColor(text.value)) {
                        picker.value = text.value;
                        this.wallpaperSettings.gradient[property] = text.value;
                        this.updateGradientPreview(container);
                    }
                });
            }
        });
        
        // Gradient direction
        const directionSelect = container.querySelector('#gradientDirection');
        directionSelect?.addEventListener('change', () => {
            this.wallpaperSettings.gradient.direction = directionSelect.value;
            this.updateGradientPreview(container);
        });
        
        // Solid color controls
        const solidPicker = container.querySelector('#solidColor');
        const solidText = container.querySelector('#solidColorText');
        
        if (solidPicker && solidText) {
            solidPicker.addEventListener('input', () => {
                solidText.value = solidPicker.value;
                this.wallpaperSettings.solid = solidPicker.value;
            });
            
            solidText.addEventListener('input', () => {
                if (this.isValidColor(solidText.value)) {
                    solidPicker.value = solidText.value;
                    this.wallpaperSettings.solid = solidText.value;
                }
            });
        }
        
        // Image upload and URL handling
        const uploadBtn = container.querySelector('#uploadWallpaper');
        const fileInput = container.querySelector('#wallpaperFileInput');
        const browseBtn = container.querySelector('#browseLocalImage');
        const urlInput = container.querySelector('#imageUrl');
        const loadUrlBtn = container.querySelector('#loadUrlImage');
        const removeBtn = container.querySelector('#removeCurrentImage');
        
        uploadBtn?.addEventListener('click', () => fileInput.click());
        fileInput?.addEventListener('change', (e) => this.handleImageUpload(e.target.files[0], container));
        browseBtn?.addEventListener('click', () => this.browseLocalImages(container));
        loadUrlBtn?.addEventListener('click', () => this.loadImageFromUrl(container));
        removeBtn?.addEventListener('click', () => this.removeCurrentImage(container));
        
        // URL input enter key
        urlInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.loadImageFromUrl(container);
            }
        });
        
        // Apply/Preview buttons
        const applyBtn = container.querySelector('#applyWallpaper');
        const previewBtn = container.querySelector('#previewWallpaper');
        
        applyBtn?.addEventListener('click', () => this.applyWallpaper());
        previewBtn?.addEventListener('click', () => this.previewWallpaper());
    }

    async browseLocalImages(container) {
        try {
            // Get user's home directory
            const homeDir = await window.nebula.fs.getHomeDir();
            const picturesDir = `${homeDir}/Pictures`;
            
            // Check if Pictures directory exists
            const picturesExists = await window.nebula.fs.exists(picturesDir);
            const startDir = picturesExists ? picturesDir : homeDir;
            
            // Create file browser modal
            const modal = this.createImageBrowserModal(startDir);
            document.body.appendChild(modal);
            
            // Load initial directory
            await this.loadImageDirectory(startDir, modal);
            
        } catch (error) {
            console.error('Error browsing local images:', error);
            this.showNotification('❌ Error accessing local files', 'error');
        }
    }

    createImageBrowserModal(currentDir) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0,0,0,0.7);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(5px);
        `;
        
        modal.innerHTML = `
            <div style="
                background: var(--nebula-surface);
                border: 1px solid var(--nebula-border);
                border-radius: 12px;
                width: 800px;
                height: 600px;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                box-shadow: 0 8px 32px rgba(0,0,0,0.4);
            ">
                <div style="
                    padding: 20px;
                    border-bottom: 1px solid var(--nebula-border);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                ">
                    <div>
                        <h3 style="color: var(--nebula-text-primary); margin: 0; font-size: 18px; font-weight: 600;">Browse Images</h3>
                        <div style="color: var(--nebula-text-secondary); font-size: 12px; margin-top: 4px;" id="currentPath">${currentDir}</div>
                    </div>
                    <button id="closeImageBrowser" style="
                        background: none;
                        border: none;
                        color: var(--nebula-text-secondary);
                        font-size: 24px;
                        cursor: pointer;
                        padding: 8px;
                        border-radius: 6px;
                    ">×</button>
                </div>
                
                <div style="
                    padding: 20px;
                    border-bottom: 1px solid var(--nebula-border);
                    display: flex;
                    gap: 12px;
                    align-items: center;
                ">
                    <button id="goUpDir" style="
                        background: var(--nebula-surface-hover);
                        border: 1px solid var(--nebula-border);
                        color: var(--nebula-text-primary);
                        padding: 8px 12px;
                        border-radius: 6px;
                        cursor: pointer;
                    ">↑ Up</button>
                    <button id="goHome" style="
                        background: var(--nebula-surface-hover);
                        border: 1px solid var(--nebula-border);
                        color: var(--nebula-text-primary);
                        padding: 8px 12px;
                        border-radius: 6px;
                        cursor: pointer;
                    ">🏠 Home</button>
                </div>
                
                <div id="imageFileList" style="
                    flex: 1;
                    padding: 20px;
                    overflow-y: auto;
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                    gap: 16px;
                    align-content: start;
                ">
                    <div style="text-align: center; color: var(--nebula-text-secondary); grid-column: 1 / -1;">Loading...</div>
                </div>
                
                <div style="
                    padding: 20px;
                    border-top: 1px solid var(--nebula-border);
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                ">
                    <button id="cancelImageBrowser" style="
                        background: var(--nebula-surface-hover);
                        border: 1px solid var(--nebula-border);
                        color: var(--nebula-text-primary);
                        padding: 12px 20px;
                        border-radius: 8px;
                        cursor: pointer;
                    ">Cancel</button>
                </div>
            </div>
        `;
        
        // Set up modal event listeners
        modal.querySelector('#closeImageBrowser').addEventListener('click', () => modal.remove());
        modal.querySelector('#cancelImageBrowser').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        
        modal.querySelector('#goUpDir').addEventListener('click', async () => {
            const currentPath = modal.querySelector('#currentPath').textContent;
            const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/')) || '/';
            await this.loadImageDirectory(parentPath, modal);
        });
        
        modal.querySelector('#goHome').addEventListener('click', async () => {
            const homeDir = await window.nebula.fs.getHomeDir();
            await this.loadImageDirectory(homeDir, modal);
        });
        
        return modal;
    }

    async loadImageDirectory(dirPath, modal) {
        const fileList = modal.querySelector('#imageFileList');
        const pathDisplay = modal.querySelector('#currentPath');
        
        fileList.innerHTML = '<div style="text-align: center; color: var(--nebula-text-secondary); grid-column: 1 / -1;">Loading...</div>';
        pathDisplay.textContent = dirPath;
        
        try {
            const files = await window.nebula.fs.readDir(dirPath);
            const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
            
            const items = [];
            
            // Add directories and image files
            for (const file of files) {
                const fullPath = `${dirPath}/${file}`;
                try {
                    const stats = await window.nebula.fs.stat(fullPath);
                    if (stats.isDirectory) {
                        items.push({ name: file, type: 'directory', path: fullPath });
                    } else if (imageExtensions.some(ext => file.toLowerCase().endsWith(ext))) {
                        items.push({ name: file, type: 'image', path: fullPath });
                    }
                } catch (error) {
                    // Skip files we can't stat
                }
            }
            
            this.displayImageFileList(items, fileList, modal, dirPath);
            
        } catch (error) {
            fileList.innerHTML = '<div style="text-align: center; color: var(--nebula-text-secondary); grid-column: 1 / -1;">Error loading directory</div>';
        }
    }

    displayImageFileList(items, container, modal, currentDir) {
        if (items.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: var(--nebula-text-secondary); grid-column: 1 / -1;">No images or folders found</div>';
            return;
        }
        
        container.innerHTML = items.map(item => {
            if (item.type === 'directory') {
                return `
                    <div class="image-file-item" data-path="${item.path}" data-type="${item.type}" style="
                        background: var(--nebula-bg-secondary);
                        border: 1px solid var(--nebula-border);
                        border-radius: 8px;
                        padding: 12px;
                        cursor: pointer;
                        text-align: center;
                        transition: all 0.2s ease;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 8px;
                    ">
                        <div style="font-size: 32px;">📁</div>
                        <div style="
                            color: var(--nebula-text-primary);
                            font-size: 12px;
                            word-break: break-word;
                            line-height: 1.2;
                        ">${item.name}</div>
                    </div>
                `;
            } else {
                // For images, create thumbnail
                return `
                    <div class="image-file-item" data-path="${item.path}" data-type="${item.type}" style="
                        background: var(--nebula-bg-secondary);
                        border: 1px solid var(--nebula-border);
                        border-radius: 8px;
                        padding: 8px;
                        cursor: pointer;
                        text-align: center;
                        transition: all 0.2s ease;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 8px;
                    ">
                        <div style="
                            width: 80px;
                            height: 80px;
                            background: var(--nebula-surface);
                            border-radius: 4px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            overflow: hidden;
                            border: 1px solid var(--nebula-border);
                        ">
                            <img src="file://${item.path}" style="
                                width: 100%;
                                height: 100%;
                                object-fit: cover;
                            " onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                            <div style="display: none; font-size: 24px; color: var(--nebula-text-secondary);">🖼️</div>
                        </div>
                        <div style="
                            color: var(--nebula-text-primary);
                            font-size: 11px;
                            word-break: break-word;
                            line-height: 1.2;
                            max-width: 100%;
                        ">${item.name}</div>
                    </div>
                `;
            }
        }).join('');
        
        // Add click handlers
        container.querySelectorAll('.image-file-item').forEach(item => {
            item.addEventListener('click', async () => {
                const path = item.dataset.path;
                const type = item.dataset.type;
                
                if (type === 'directory') {
                    await this.loadImageDirectory(path, modal);
                } else {
                    await this.selectLocalImage(path, modal);
                }
            });
            
            item.addEventListener('mouseenter', () => {
                item.style.background = 'var(--nebula-surface-hover)';
                item.style.transform = 'translateY(-2px)';
                item.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.background = 'var(--nebula-bg-secondary)';
                item.style.transform = 'translateY(0)';
                item.style.boxShadow = 'none';
            });
        });
    }

    async selectLocalImage(imagePath, modal) {
        try {
            // Convert local file to data URL for preview and storage
            const fileData = await window.nebula.fs.readFile(imagePath);
            
            // For now, we'll store the path and load it as needed
            // In a real implementation, you might want to copy the file to a wallpapers directory
            this.wallpaperSettings.image = `file://${imagePath}`;
            this.wallpaperSettings.imageSource = `Local: ${imagePath.split('/').pop()}`;
            
            modal.remove();
            
            // Update the preview in the settings
            this.updateImagePreview();
            this.showNotification('🖼️ Local image selected successfully!');
            
        } catch (error) {
            console.error('Error selecting local image:', error);
            this.showNotification('❌ Error loading selected image', 'error');
        }
    }

    async loadImageFromUrl(container) {
        const urlInput = container.querySelector('#imageUrl');
        const url = urlInput.value.trim();
        
        if (!url) {
            this.showNotification('⚠️ Please enter an image URL', 'warning');
            return;
        }
        
        if (!this.isValidImageUrl(url)) {
            this.showNotification('⚠️ Please enter a valid image URL', 'warning');
            return;
        }
        
        try {
            // Test if the image loads
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                this.wallpaperSettings.image = url;
                this.wallpaperSettings.imageSource = `URL: ${new URL(url).hostname}`;
                this.updateImagePreview(container);
                this.showNotification('🌐 Image loaded from URL successfully!');
                urlInput.value = '';
            };
            
            img.onerror = () => {
                this.showNotification('❌ Failed to load image from URL', 'error');
            };
            
            img.src = url;
            
        } catch (error) {
            console.error('Error loading image from URL:', error);
            this.showNotification('❌ Invalid URL or failed to load image', 'error');
        }
    }

    removeCurrentImage(container) {
        this.wallpaperSettings.image = null;
        this.wallpaperSettings.imageSource = null;
        this.updateImagePreview(container);
        this.showNotification('🗑️ Current image removed');
    }

    updateImagePreview(container) {
        // Find the container if not provided
        if (!container) {
            container = document.querySelector('.settings-content');
        }
        
        const preview = container?.querySelector('#imagePreview');
        const img = container?.querySelector('#previewImg');
        const source = container?.querySelector('#imageSource');
        
        if (preview && img) {
            if (this.wallpaperSettings.image) {
                preview.style.display = 'block';
                img.src = this.wallpaperSettings.image;
                if (source) {
                    source.textContent = `Source: ${this.wallpaperSettings.imageSource || 'Unknown'}`;
                }
            } else {
                preview.style.display = 'none';
            }
        }
    }

    isValidImageUrl(url) {
        try {
            const urlObj = new URL(url);
            const extension = urlObj.pathname.toLowerCase();
            const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
            return validExtensions.some(ext => extension.endsWith(ext)) || 
                   urlObj.search.includes('image') || 
                   urlObj.pathname.includes('image');
        } catch {
            return false;
        }
    }

    // ==================== WINDOWS TAB ====================
    
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

            <!-- Window Styling -->
            <div class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Window Styling</h3>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
                    <div>
                        <label style="display: block; margin-bottom: 8px; color: var(--nebula-text-primary); font-weight: 500;">Border Radius</label>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <input type="range" id="borderRadius" min="0" max="20" value="8" style="
                                flex: 1;
                                height: 6px;
                                background: var(--nebula-surface-hover);
                                outline: none;
                                border-radius: 3px;
                                cursor: pointer;
                            ">
                            <div style="min-width: 60px; text-align: center; color: var(--nebula-text-primary); font-family: monospace; background: var(--nebula-bg-secondary); padding: 4px 8px; border-radius: 4px; border: 1px solid var(--nebula-border);">
                                <span id="borderRadiusValue">8</span>px
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <label style="display: block; margin-bottom: 8px; color: var(--nebula-text-primary); font-weight: 500;">Shadow Intensity</label>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <input type="range" id="shadowIntensity" min="0" max="100" value="30" style="
                                flex: 1;
                                height: 6px;
                                background: var(--nebula-surface-hover);
                                outline: none;
                                border-radius: 3px;
                                cursor: pointer;
                            ">
                            <div style="min-width: 60px; text-align: center; color: var(--nebula-text-primary); font-family: monospace; background: var(--nebula-bg-secondary); padding: 4px 8px; border-radius: 4px; border: 1px solid var(--nebula-border);">
                                <span id="shadowIntensityValue">30</span>%
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Window Effects -->
            <div class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Visual Effects</h3>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px;">
                    <label style="display: flex; align-items: center; gap: 12px; color: var(--nebula-text-primary); cursor: pointer; padding: 12px; background: var(--nebula-bg-secondary); border-radius: 8px; border: 1px solid var(--nebula-border);">
                        <input type="checkbox" id="enableBlur" style="width: 18px; height: 18px;">
                        <div>
                            <div style="font-weight: 500;">Background Blur</div>
                            <div style="font-size: 12px; color: var(--nebula-text-secondary);">Blur content behind windows</div>
                        </div>
                    </label>
                    
                    <label style="display: flex; align-items: center; gap: 12px; color: var(--nebula-text-primary); cursor: pointer; padding: 12px; background: var(--nebula-bg-secondary); border-radius: 8px; border: 1px solid var(--nebula-border);">
                        <input type="checkbox" id="enableGlass" style="width: 18px; height: 18px;">
                        <div>
                            <div style="font-weight: 500;">Glass Effect</div>
                            <div style="font-size: 12px; color: var(--nebula-text-secondary);">Translucent window backgrounds</div>
                        </div>
                    </label>
                    
                    <label style="display: flex; align-items: center; gap: 12px; color: var(--nebula-text-primary); cursor: pointer; padding: 12px; background: var(--nebula-bg-secondary); border-radius: 8px; border: 1px solid var(--nebula-border);">
                        <input type="checkbox" id="enableShadows" checked style="width: 18px; height: 18px;">
                        <div>
                            <div style="font-weight: 500;">Drop Shadows</div>
                            <div style="font-size: 12px; color: var(--nebula-text-secondary);">Shadows around windows</div>
                        </div>
                    </label>
                    
                    <label style="display: flex; align-items: center; gap: 12px; color: var(--nebula-text-primary); cursor: pointer; padding: 12px; background: var(--nebula-bg-secondary); border-radius: 8px; border: 1px solid var(--nebula-border);">
                        <input type="checkbox" id="enableBorder" style="width: 18px; height: 18px;">
                        <div>
                            <div style="font-weight: 500;">Window Borders</div>
                            <div style="font-size: 12px; color: var(--nebula-text-secondary);">Visible borders around windows</div>
                        </div>
                    </label>
                </div>
            </div>

            <!-- Window Behavior -->
            <div class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Window Behavior</h3>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px;">
                    <label style="display: flex; align-items: center; gap: 12px; color: var(--nebula-text-primary); cursor: pointer; padding: 12px; background: var(--nebula-bg-secondary); border-radius: 8px; border: 1px solid var(--nebula-border);">
                        <input type="checkbox" id="enableSnapping" style="width: 18px; height: 18px;">
                        <div>
                            <div style="font-weight: 500;">Window Snapping</div>
                            <div style="font-size: 12px; color: var(--nebula-text-secondary);">Snap windows to screen edges</div>
                        </div>
                    </label>
                    
                    <label style="display: flex; align-items: center; gap: 12px; color: var(--nebula-text-primary); cursor: pointer; padding: 12px; background: var(--nebula-bg-secondary); border-radius: 8px; border: 1px solid var(--nebula-border);">
                        <input type="checkbox" id="enableMinimizeToTray" style="width: 18px; height: 18px;">
                        <div>
                            <div style="font-weight: 500;">Minimize to Tray</div>
                            <div style="font-size: 12px; color: var(--nebula-text-secondary);">Hide windows in system tray</div>
                        </div>
                    </label>
                    
                    <label style="display: flex; align-items: center; gap: 12px; color: var(--nebula-text-primary); cursor: pointer; padding: 12px; background: var(--nebula-bg-secondary); border-radius: 8px; border: 1px solid var(--nebula-border);">
                        <input type="checkbox" id="enableAlwaysOnTop" style="width: 18px; height: 18px;">
                        <div>
                            <div style="font-weight: 500;">Always on Top Option</div>
                            <div style="font-size: 12px; color: var(--nebula-text-secondary);">Right-click option for pinning</div>
                        </div>
                    </label>
                </div>
            </div>

            <!-- Preview and Apply -->
            <div class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: 12px; padding: 24px;">
                <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 16px;">
                    <button id="previewWindowStyle" style="background: var(--nebula-primary); color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 500;">Preview Style</button>
                    <button id="applyWindowSettings" style="background: var(--nebula-surface-hover); color: var(--nebula-text-primary); border: 1px solid var(--nebula-border); padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 500;">Apply Settings</button>
                </div>
                <span style="font-size: 12px; font-weight: normal; opacity: 0.7;">
                    Preview creates a test window to show changes
                </span>
            </div>
        `;
    }
    
    /**
     * Set up listeners for the Windows tab
     */
    setupWindowsListeners(container) {
        // Slider controls
        const sliders = [
            ['borderRadius', 'borderRadiusValue'],
            ['shadowIntensity', 'shadowIntensityValue']
        ];
        
        sliders.forEach(([sliderId, valueId]) => {
            const slider = container.querySelector(`#${sliderId}`);
            const valueDisplay = container.querySelector(`#${valueId}`);
            
            slider?.addEventListener('input', () => {
                valueDisplay.textContent = slider.value;
            });
        });
        
        // Preview and apply buttons
        const previewBtn = container.querySelector('#previewWindowStyle');
        const applyBtn = container.querySelector('#applyWindowSettings');
        
        previewBtn?.addEventListener('click', () => this.previewWindowStyle(container));
        applyBtn?.addEventListener('click', () => this.applyWindowSettings(container));
    }

    // ==================== EFFECTS TAB ====================
    
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
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Animation Settings</h3>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
                    <div>
                        <label style="display: block; margin-bottom: 8px; color: var(--nebula-text-primary); font-weight: 500;">Animation Speed</label>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <input type="range" id="animationSpeed" min="0.1" max="2" step="0.1" value="${this.effectSettings.animationSpeed}" style="
                                flex: 1;
                                height: 6px;
                                background: var(--nebula-surface-hover);
                                outline: none;
                                border-radius: 3px;
                                cursor: pointer;
                            ">
                            <div style="min-width: 60px; text-align: center; color: var(--nebula-text-primary); font-family: monospace; background: var(--nebula-bg-secondary); padding: 4px 8px; border-radius: 4px; border: 1px solid var(--nebula-border);">
                                <span id="animationSpeedValue">${this.effectSettings.animationSpeed.toFixed(1)}</span>x
                            </div>
                        </div>
                        <div style="margin-top: 8px; font-size: 12px; color: var(--nebula-text-secondary);">Controls speed of window animations</div>
                    </div>
                    
                    <div>
                        <label style="display: block; margin-bottom: 12px; color: var(--nebula-text-primary); font-weight: 500;">Enable Animations</label>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            <label style="display: flex; align-items: center; gap: 8px; color: var(--nebula-text-primary); cursor: pointer;">
                                <input type="checkbox" id="enableWindowAnimations" ${this.effectSettings.enableWindowAnimations ? 'checked' : ''} style="width: 16px; height: 16px;">
                                <span>Window open/close animations</span>
                            </label>
                            <label style="display: flex; align-items: center; gap: 8px; color: var(--nebula-text-primary); cursor: pointer;">
                                <input type="checkbox" id="enableHoverEffects" ${this.effectSettings.enableHoverEffects ? 'checked' : ''} style="width: 16px; height: 16px;">
                                <span>Button hover effects</span>
                            </label>
                            <label style="display: flex; align-items: center; gap: 8px; color: var(--nebula-text-primary); cursor: pointer;">
                                <input type="checkbox" id="enableTransitions" ${this.effectSettings.enableTransitions ? 'checked' : ''} style="width: 16px; height: 16px;">
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
                        <select id="particleEffect" value="${this.effectSettings.particleEffect}" style="
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
                            <input type="range" id="effectIntensity" min="10" max="100" value="${this.effectSettings.effectIntensity}" style="
                                flex: 1;
                                height: 6px;
                                background: var(--nebula-surface-hover);
                                outline: none;
                                border-radius: 3px;
                                cursor: pointer;
                            ">
                            <div style="min-width: 60px; text-align: center; color: var(--nebula-text-primary); font-family: monospace; background: var(--nebula-bg-secondary); padding: 4px 8px; border-radius: 4px; border: 1px solid var(--nebula-border);">
                                <span id="effectIntensityValue">${this.effectSettings.effectIntensity}</span>
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
                    ">${this.particlesActive ? 'Stop' : 'Start'} Preview</button>
                    
                    <button id="stopParticles" style="
                        background: var(--nebula-surface-hover);
                        color: var(--nebula-text-primary);
                        border: 1px solid var(--nebula-border);
                        padding: 12px 24px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 500;
                    ">Stop All Effects</button>
                </div>
            </div>

            <!-- Performance Settings -->
            <div class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Performance & Accessibility</h3>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px;">
                    <label style="display: flex; align-items: center; gap: 12px; color: var(--nebula-text-primary); cursor: pointer; padding: 12px; background: var(--nebula-bg-secondary); border-radius: 8px; border: 1px solid var(--nebula-border);">
                        <input type="checkbox" id="reducedMotion" ${this.effectSettings.reducedMotion ? 'checked' : ''} style="width: 18px; height: 18px;">
                        <div>
                            <div style="font-weight: 500;">Reduce Motion</div>
                            <div style="font-size: 12px; color: var(--nebula-text-secondary);">Minimize animations for accessibility</div>
                        </div>
                    </label>
                    
                    <label style="display: flex; align-items: center; gap: 12px; color: var(--nebula-text-primary); cursor: pointer; padding: 12px; background: var(--nebula-bg-secondary); border-radius: 8px; border: 1px solid var(--nebula-border);">
                        <input type="checkbox" id="hardwareAcceleration" ${this.effectSettings.hardwareAcceleration ? 'checked' : ''} style="width: 18px; height: 18px;">
                        <div>
                            <div style="font-weight: 500;">Hardware Acceleration</div>
                            <div style="font-size: 12px; color: var(--nebula-text-secondary);">Use GPU for better performance</div>
                        </div>
                    </label>
                    
                    <label style="display: flex; align-items: center; gap: 12px; color: var(--nebula-text-primary); cursor: pointer; padding: 12px; background: var(--nebula-bg-secondary); border-radius: 8px; border: 1px solid var(--nebula-border);">
                        <input type="checkbox" id="highRefreshRate" ${this.effectSettings.highRefreshRate ? 'checked' : ''} style="width: 18px; height: 18px;">
                        <div>
                            <div style="font-weight: 500;">High Refresh Rate</div>
                            <div style="font-size: 12px; color: var(--nebula-text-secondary);">Match monitor refresh rate</div>
                        </div>
                    </label>
                </div>
                
                <div style="margin-top: 16px; padding: 12px; background: var(--nebula-bg-secondary); border-radius: 6px; border: 1px solid var(--nebula-border);">
                    <div style="font-size: 12px; color: var(--nebula-text-secondary);">
                        ⚡ Performance tip: Disable effects on older hardware for better performance.<br>
                        🔋 Battery tip: Particle effects may impact battery life on laptops.
                    </div>
                </div>
            </div>

            <!-- Apply Effects -->
            <div class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: 12px; padding: 24px;">
                <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 16px;">
                    <button id="applyEffects" style="background: var(--nebula-primary); color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 500;">Apply Effects</button>
                    <button id="testAnimation" style="background: var(--nebula-surface-hover); color: var(--nebula-text-primary); border: 1px solid var(--nebula-border); padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 500;">Test Animation</button>
                    <button id="resetEffects" style="background: transparent; color: var(--nebula-text-secondary); border: 1px solid var(--nebula-border); padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 500;">Reset to Defaults</button>
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
            this.effectSettings.animationSpeed = speed;
        });
        
        // Effect intensity slider
        const intensitySlider = container.querySelector('#effectIntensity');
        const intensityValue = container.querySelector('#effectIntensityValue');
        
        intensitySlider?.addEventListener('input', () => {
            this.effectSettings.effectIntensity = parseInt(intensitySlider.value);
            intensityValue.textContent = intensitySlider.value;
        });
        
        // Particle effect dropdown
        const particleSelect = container.querySelector('#particleEffect');
        particleSelect?.addEventListener('change', () => {
            this.effectSettings.particleEffect = particleSelect.value;
        });
        
        // Animation checkboxes
        const animationCheckboxes = ['enableWindowAnimations', 'enableHoverEffects', 'enableTransitions'];
        animationCheckboxes.forEach(id => {
            const checkbox = container.querySelector(`#${id}`);
            checkbox?.addEventListener('change', () => {
                this.effectSettings[id] = checkbox.checked;
            });
        });
        
        // Performance checkboxes
        const performanceCheckboxes = ['reducedMotion', 'hardwareAcceleration', 'highRefreshRate'];
        performanceCheckboxes.forEach(id => {
            const checkbox = container.querySelector(`#${id}`);
            checkbox?.addEventListener('change', () => {
                this.effectSettings[id] = checkbox.checked;
            });
        });
        
        // Action buttons
        const toggleBtn = container.querySelector('#toggleParticles');
        const stopBtn = container.querySelector('#stopParticles');
        const applyBtn = container.querySelector('#applyEffects');
        const testBtn = container.querySelector('#testAnimation');
        const resetBtn = container.querySelector('#resetEffects');
        
        toggleBtn?.addEventListener('click', () => this.toggleParticleEffect(container));
        stopBtn?.addEventListener('click', () => this.stopParticleEffect());
        applyBtn?.addEventListener('click', () => this.applyEffects());
        testBtn?.addEventListener('click', () => this.testAnimation());
        resetBtn?.addEventListener('click', () => this.resetEffects(container));
    }

    // ==================== SYSTEM TAB ====================
    
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
                        <div style="color: var(--nebula-text-primary); font-weight: 600;">NebulaDesktop v4.0</div>
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

            <!-- Privacy & Security -->
            <div class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 16px 0; font-size: 18px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                    <span class="material-symbols-outlined" style="color: var(--nebula-primary); font-size: 20px;">security</span>
                    Privacy & Security
                </h3>
                
                <div style="margin-bottom: 24px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: var(--nebula-bg-secondary); border-radius: 8px; border: 1px solid var(--nebula-border);">
                        <div>
                            <div style="color: var(--nebula-text-primary); font-weight: 600; margin-bottom: 4px; display: flex; align-items: center; gap: 8px;">
                                <span class="material-symbols-outlined" style="font-size: 18px; color: var(--nebula-accent);">block</span>
                                Ad Blocker
                            </div>
                            <div style="color: var(--nebula-text-secondary); font-size: 14px;">Block ads, trackers, and malicious content across all web content</div>
                            <div style="color: var(--nebula-text-tertiary); font-size: 12px; margin-top: 4px;">
                                Status: <span id="adBlockerStatus">Loading...</span> | 
                                Rules: <span id="adBlockerRuleCount">Loading...</span> | 
                                Last Updated: <span id="adBlockerLastUpdate">Loading...</span>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div class="toggle-switch" style="position: relative; width: 50px; height: 24px;">
                                <input type="checkbox" id="adBlockerToggle" style="
                                    position: absolute;
                                    opacity: 0;
                                    width: 100%;
                                    height: 100%;
                                    cursor: pointer;
                                    z-index: 2;
                                ">
                                <div class="toggle-track" style="
                                    position: absolute;
                                    top: 0;
                                    left: 0;
                                    width: 100%;
                                    height: 100%;
                                    background: var(--nebula-border);
                                    border-radius: 12px;
                                    transition: all 0.2s ease;
                                "></div>
                                <div class="toggle-thumb" style="
                                    position: absolute;
                                    top: 2px;
                                    left: 2px;
                                    width: 20px;
                                    height: 20px;
                                    background: white;
                                    border-radius: 50%;
                                    transition: all 0.2s ease;
                                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                                "></div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="margin-top: 12px; display: flex; gap: 12px;">
                        <button id="refreshAdBlockLists" style="
                            background: var(--nebula-primary);
                            color: white;
                            border: none;
                            padding: 8px 16px;
                            border-radius: 6px;
                            cursor: pointer;
                            font-weight: 500;
                            font-size: 13px;
                            display: flex;
                            align-items: center;
                            gap: 6px;
                        ">
                            <span class="material-symbols-outlined" style="font-size: 16px;">refresh</span>
                            Update Filter Lists
                        </button>
                        
                        <div id="adBlockerUpdateStatus" style="
                            display: flex;
                            align-items: center;
                            color: var(--nebula-text-secondary);
                            font-size: 12px;
                            gap: 6px;
                        " hidden>
                            <span class="material-symbols-outlined" style="font-size: 14px;">downloading</span>
                            <span>Updating...</span>
                        </div>
                    </div>
                </div>

                <div style="color: var(--nebula-text-secondary); font-size: 13px; padding: 12px; background: var(--nebula-bg-tertiary); border-radius: 6px; border-left: 3px solid var(--nebula-accent);">
                    <strong>Enhanced Ad Blocking:</strong> Uses industry-standard filter lists (EasyList, EasyPrivacy, Peter Lowe's list) downloaded daily. Filter lists are cached locally for performance. The "Update Filter Lists" button manually refreshes the lists from their sources.
                </div>
            </div>

            <!-- Storage & Data Management -->
            <div class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Storage & Data</h3>
                
                <div style="margin-bottom: 20px;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                        <div style="background: var(--nebula-bg-secondary); padding: 16px; border-radius: 8px; border: 1px solid var(--nebula-border);">
                            <div style="color: var(--nebula-text-secondary); font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Used Storage</div>
                            <div style="color: var(--nebula-text-primary); font-weight: 600;" id="usedStorage">Loading...</div>
                        </div>
                        <div style="background: var(--nebula-bg-secondary); padding: 16px; border-radius: 8px; border: 1px solid var(--nebula-border);">
                            <div style="color: var(--nebula-text-secondary); font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Total Items</div>
                            <div style="color: var(--nebula-text-primary); font-weight: 600;" id="totalItems">Loading...</div>
                        </div>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 16px;">
                    <button id="clearAllDataBtn" style="
                        background: #dc2626;
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
                    
                    <button id="refreshStorageBtn" style="
                        background: var(--nebula-surface-hover);
                        color: var(--nebula-text-primary);
                        border: 1px solid var(--nebula-border);
                        padding: 12px 20px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 500;
                        transition: all 0.2s ease;
                    ">
                        <span class="material-symbols-outlined" style="font-size: 16px; vertical-align: middle; margin-right: 6px;">refresh</span>
                        Refresh
                    </button>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
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
                        <span style="color: var(--nebula-text-primary); font-weight: 500;">Switch Windows</span>
                        <kbd style="background: var(--nebula-surface-hover); padding: 4px 8px; border-radius: 4px; font-family: monospace; color: var(--nebula-text-primary); border: 1px solid var(--nebula-border);">Alt + Tab</kbd>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--nebula-bg-secondary); border-radius: 6px;">
                        <span style="color: var(--nebula-text-primary); font-weight: 500;">Open Terminal</span>
                        <kbd style="background: var(--nebula-surface-hover); padding: 4px 8px; border-radius: 4px; font-family: monospace; color: var(--nebula-text-primary); border: 1px solid var(--nebula-border);">Ctrl + Alt + T</kbd>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--nebula-bg-secondary); border-radius: 6px;">
                        <span style="color: var(--nebula-text-primary); font-weight: 500;">Toggle Fullscreen</span>
                        <kbd style="background: var(--nebula-surface-hover); padding: 4px 8px; border-radius: 4px; font-family: monospace; color: var(--nebula-text-primary); border: 1px solid var(--nebula-border);">F11</kbd>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--nebula-bg-secondary); border-radius: 6px;">
                        <span style="color: var(--nebula-text-primary); font-weight: 500;">Open Settings</span>
                        <kbd style="background: var(--nebula-surface-hover); padding: 4px 8px; border-radius: 4px; font-family: monospace; color: var(--nebula-text-primary); border: 1px solid var(--nebula-border);">Ctrl + ,</kbd>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--nebula-bg-secondary); border-radius: 6px;">
                        <span style="color: var(--nebula-text-primary); font-weight: 500;">Close Window</span>
                        <kbd style="background: var(--nebula-surface-hover); padding: 4px 8px; border-radius: 4px; font-family: monospace; color: var(--nebula-text-primary); border: 1px solid var(--nebula-border);">Ctrl + W</kbd>
                    </div>
                </div>
            </div>

            <!-- About & Updates -->
            <div class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: 12px; padding: 24px;">
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">About & Updates</h3>
                
                <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 16px;">
                    <button id="checkUpdatesBtn" style="
                        background: var(--nebula-primary);
                        color: white;
                        border: none;
                        padding: 12px 20px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 500;
                    ">Check for Updates</button>
                    
                    <button id="aboutBtn" style="
                        background: var(--nebula-surface-hover);
                        color: var(--nebula-text-primary);
                        border: 1px solid var(--nebula-border);
                        padding: 12px 20px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 500;
                    ">About NebulaDesktop</button>
                </div>
                
                <p style="color: var(--nebula-text-secondary); margin: 0; font-size: 14px;">
                    NebulaDesktop v4.0 - Advanced Desktop Environment<br>
                    Built with modern web technologies for maximum customization and performance.
                </p>
            </div>
        `;
    }
    
    /**
     * Set up listeners for the System tab
     */
    setupSystemListeners(container) {
        // System info refresh
        const refreshBtn = container.querySelector('#refreshSystemInfo');
        refreshBtn?.addEventListener('click', () => {
            this.updateSystemInfo(container);
        });

        // Ad blocker toggle
        const adBlockerToggle = container.querySelector('#adBlockerToggle');
        adBlockerToggle?.addEventListener('change', async (e) => {
            const enabled = e.target.checked;
            try {
                await window.nebula.adBlocker.toggle(enabled);
                this.updateAdBlockerStatus(container);
                
                // Visual feedback
                const track = container.querySelector('.toggle-track');
                const thumb = container.querySelector('.toggle-thumb');
                if (track && thumb) {
                    if (enabled) {
                        track.style.background = 'var(--nebula-accent)';
                        thumb.style.left = '28px';
                    } else {
                        track.style.background = 'var(--nebula-border)';
                        thumb.style.left = '2px';
                    }
                }
            } catch (error) {
                console.error('Failed to toggle ad blocker:', error);
                // Reset toggle on error
                e.target.checked = !enabled;
            }
        });

        // Ad blocker refresh button
        const refreshAdBlockBtn = container.querySelector('#refreshAdBlockLists');
        refreshAdBlockBtn?.addEventListener('click', async () => {
            const statusEl = container.querySelector('#adBlockerUpdateStatus');
            
            try {
                // Show loading state
                if (statusEl) {
                    statusEl.hidden = false;
                }
                refreshAdBlockBtn.disabled = true;
                refreshAdBlockBtn.style.opacity = '0.6';
                
                // Refresh the lists
                const result = await window.nebula.adBlocker.refreshLists();
                
                if (result.success) {
                    this.showNotification(`✅ Updated ${result.count} filter rules`);
                    this.updateAdBlockerStatus(container);
                    // Ensure our custom AI allowlist entries survive list refreshes
                    try {
                        if (window.nebula && window.nebula.terminal && window.nebula.terminal.exec) {
                            const checker = await window.nebula.terminal.exec('node', ['tools/check-adblock-allowlist.js']);
                            if (checker && checker.exitCode === 0) {
                                this.showNotification('✅ Adblock allowlist verified and restored');
                            } else {
                                const errMsg = (checker && (checker.stderr || checker.stdout)) || 'Unknown error';
                                this.showNotification(`⚠️ Allowlist checker failed: ${errMsg}`);
                                console.warn('Allowlist checker result:', checker);
                            }
                        } else {
                            console.warn('Terminal.exec not available; cannot run allowlist checker automatically.');
                        }
                    } catch (err) {
                        console.error('Error running allowlist checker:', err);
                        this.showNotification('⚠️ Failed to run allowlist checker after refresh');
                    }
                } else {
                    this.showNotification(`❌ Failed to update: ${result.error}`);
                }
            } catch (error) {
                console.error('Failed to refresh ad block lists:', error);
                this.showNotification('❌ Failed to update filter lists');
            } finally {
                // Hide loading state
                if (statusEl) {
                    statusEl.hidden = true;
                }
                refreshAdBlockBtn.disabled = false;
                refreshAdBlockBtn.style.opacity = '1';
            }
        });

        // Initialize ad blocker status
        this.updateAdBlockerStatus(container);

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

        // About & Updates
        const checkUpdatesBtn = container.querySelector('#checkUpdatesBtn');
        const aboutBtn = container.querySelector('#aboutBtn');

        checkUpdatesBtn?.addEventListener('click', () => this.checkForUpdates());
        aboutBtn?.addEventListener('click', () => this.showAbout());

        // Update system info initially
        this.updateSystemInfo(container);
        this.updateStorageInfo(container);
    }

    // ==================== IMPLEMENTATION METHODS ====================

    // Appearance methods
    updateThemeSelection(container, theme) {
        const cards = container.querySelectorAll('.theme-card');
        cards.forEach(card => {
            const isSelected = card.dataset.theme === theme;
            card.classList.toggle('selected', isSelected);
            card.style.borderColor = isSelected ? 'var(--nebula-primary)' : 'var(--nebula-border)';
        });
        this.currentTheme = theme;
    }

    updateCustomThemeColor(property, color) {
        this.customTheme[property] = color;
    }

    applyTheme(theme) {
        this.currentTheme = theme;
        localStorage.setItem('nebula-theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
        
        // Apply preset theme variables
        const root = document.documentElement;
        
        switch (theme) {
            case 'light':
                root.style.setProperty('--nebula-bg-primary', '#ffffff');
                root.style.setProperty('--nebula-bg-secondary', '#f8fafc');
                root.style.setProperty('--nebula-surface', '#ffffff');
                root.style.setProperty('--nebula-text-primary', '#1e293b');
                root.style.setProperty('--nebula-text-secondary', '#64748b');
                root.style.setProperty('--nebula-border', '#e2e8f0');
                break;
            case 'dark':
                root.style.setProperty('--nebula-bg-primary', '#0f172a');
                root.style.setProperty('--nebula-bg-secondary', '#1e293b');
                root.style.setProperty('--nebula-surface', '#334155');
                root.style.setProperty('--nebula-text-primary', '#f1f5f9');
                root.style.setProperty('--nebula-text-secondary', '#cbd5e0');
                root.style.setProperty('--nebula-border', '#475569');
                break;
            case 'nebula':
                root.style.setProperty('--nebula-bg-primary', '#1a1a2e');
                root.style.setProperty('--nebula-bg-secondary', '#16213e');
                root.style.setProperty('--nebula-surface', '#0f3460');
                root.style.setProperty('--nebula-text-primary', '#eee');
                root.style.setProperty('--nebula-text-secondary', '#a0a9c0');
                root.style.setProperty('--nebula-border', '#16213e');
                break;
        }
        
        console.log('Theme applied:', theme);
    }

    previewCustomTheme() {
        // Apply custom theme temporarily
        this.applyCustomThemeToDOM();
        console.log('Previewing custom theme:', this.customTheme);
        
        // Show preview notice
        const notice = document.createElement('div');
        notice.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--nebula-primary);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-weight: 500;
            animation: slideIn 0.3s ease-out;
        `;
        notice.textContent = '🎨 Theme Preview Active';
        document.body.appendChild(notice);
        
        setTimeout(() => notice.remove(), 3000);
    }

    applyCustomTheme() {
        this.applyCustomThemeToDOM();
        this.currentTheme = 'custom';
        localStorage.setItem('nebula-theme', 'custom');
        document.documentElement.setAttribute('data-theme', 'custom');
        this.saveSettings();
        console.log('Custom theme applied permanently:', this.customTheme);
    }

    applyCustomThemeToDOM() {
        const root = document.documentElement;
        
        // Apply custom CSS variables to the DOM
        root.style.setProperty('--nebula-primary', this.customTheme.primary);
        root.style.setProperty('--nebula-secondary', this.customTheme.secondary || this.customTheme.primary);
        root.style.setProperty('--nebula-accent', this.customTheme.accent);
        root.style.setProperty('--nebula-bg-primary', this.customTheme.background);
        root.style.setProperty('--nebula-bg-secondary', this.customTheme.surface);
        root.style.setProperty('--nebula-surface', this.customTheme.surface);
        root.style.setProperty('--nebula-text-primary', this.customTheme.text);
        root.style.setProperty('--nebula-text-secondary', this.customTheme.text + '99'); // Add opacity
        root.style.setProperty('--nebula-border', this.customTheme.border);
        root.style.setProperty('--nebula-surface-hover', this.customTheme.border);
        root.style.setProperty('--nebula-border-hover', this.customTheme.primary + '33'); // Add opacity
    }

    resetToDefaultTheme() {
        this.applyTheme('dark');
        console.log('Reset to default theme');
    }

    exportCurrentTheme() {
        const themeData = {
            name: this.customTheme.name || 'Custom Theme',
            theme: this.currentTheme,
            customTheme: this.customTheme,
            wallpaperSettings: this.wallpaperSettings,
            effectSettings: this.effectSettings,
            exportDate: new Date().toISOString(),
            version: 'NebulaDesktop v4.0'
        };
        
        // Try to save to file system first, fall back to download
        this.saveThemeToFileSystem(themeData);
    }

    async saveThemeToFileSystem(themeData) {
        try {
            // Create themes directory in user's home
            const homeDir = await window.nebula.fs.getHomeDir();
            const themesDir = `${homeDir}/.nebula/themes`;
            
            // Ensure themes directory exists
            try {
                await window.nebula.fs.mkdir(themesDir, { recursive: true });
            } catch (error) {
                // Directory might already exist, that's okay
            }
            
            // Generate filename
            const safeName = themeData.name.replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase();
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `${safeName}_${timestamp}.nebulatheme`;
            const filepath = `${themesDir}/${filename}`;
            
            // Save theme file
            await window.nebula.fs.writeFile(filepath, JSON.stringify(themeData, null, 2));
            
            this.showNotification(`💾 Theme saved to: ~/.nebula/themes/${filename}`);
            console.log('Theme saved to file system:', filepath);
            
        } catch (error) {
            console.error('Error saving theme to file system:', error);
            // Fallback to browser download
            this.downloadThemeFile(themeData);
        }
    }

    downloadThemeFile(themeData) {
        const blob = new Blob([JSON.stringify(themeData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${themeData.name.replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.nebulatheme`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('💾 Theme file downloaded to your Downloads folder');
    }

    importTheme(file) {
        if (!file) {
            this.browseThemeFiles();
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const themeData = JSON.parse(e.target.result);
                this.applyImportedTheme(themeData);
            } catch (error) {
                console.error('Failed to import theme:', error);
                this.showNotification('❌ Invalid theme file format', 'error');
            }
        };
        reader.readAsText(file);
    }

    async browseThemeFiles() {
        try {
            // Get themes directory
            const homeDir = await window.nebula.fs.getHomeDir();
            const themesDir = `${homeDir}/.nebula/themes`;
            
            // Check if themes directory exists
            const themesExists = await window.nebula.fs.exists(themesDir);
            if (!themesExists) {
                this.showNotification('📁 No themes directory found. Save a theme first to create it.', 'warning');
                return;
            }
            
            // Create theme browser modal
            const modal = this.createThemeBrowserModal(themesDir);
            document.body.appendChild(modal);
            
            // Load themes
            await this.loadThemeDirectory(themesDir, modal);
            
        } catch (error) {
            console.error('Error browsing themes:', error);
            this.showNotification('❌ Error accessing themes directory', 'error');
        }
    }

    createThemeBrowserModal(themesDir) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0,0,0,0.7);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(5px);
        `;
        
        modal.innerHTML = `
            <div style="
                background: var(--nebula-surface);
                border: 1px solid var(--nebula-border);
                border-radius: 12px;
                width: 700px;
                height: 500px;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                box-shadow: 0 8px 32px rgba(0,0,0,0.4);
            ">
                <div style="
                    padding: 20px;
                    border-bottom: 1px solid var(--nebula-border);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                ">
                    <div>
                        <h3 style="color: var(--nebula-text-primary); margin: 0; font-size: 18px; font-weight: 600;">Load Saved Theme</h3>
                        <div style="color: var(--nebula-text-secondary); font-size: 12px; margin-top: 4px;">~/.nebula/themes</div>
                    </div>
                    <button id="closeThemeBrowser" style="
                        background: none;
                        border: none;
                        color: var(--nebula-text-secondary);
                        font-size: 24px;
                        cursor: pointer;
                        padding: 8px;
                        border-radius: 6px;
                    ">×</button>
                </div>
                
                <div id="themeFileList" style="
                    flex: 1;
                    padding: 20px;
                    overflow-y: auto;
                ">
                    <div style="text-align: center; color: var(--nebula-text-secondary);">Loading themes...</div>
                </div>
                
                <div style="
                    padding: 20px;
                    border-top: 1px solid var(--nebula-border);
                    display: flex;
                    gap: 12px;
                    justify-content: space-between;
                ">
                    <button id="openThemesFolder" style="
                        background: var(--nebula-surface-hover);
                        border: 1px solid var(--nebula-border);
                        color: var(--nebula-text-primary);
                        padding: 12px 20px;
                        border-radius: 8px;
                        cursor: pointer;
                    ">📁 Open Themes Folder</button>
                    <button id="cancelThemeBrowser" style="
                        background: var(--nebula-surface-hover);
                        border: 1px solid var(--nebula-border);
                        color: var(--nebula-text-primary);
                        padding: 12px 20px;
                        border-radius: 8px;
                        cursor: pointer;
                    ">Cancel</button>
                </div>
            </div>
        `;
        
        // Set up event listeners
        modal.querySelector('#closeThemeBrowser').addEventListener('click', () => modal.remove());
        modal.querySelector('#cancelThemeBrowser').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        
        modal.querySelector('#openThemesFolder').addEventListener('click', () => {
            // This would open the themes folder in the file manager
            this.showNotification('💡 Tip: You can also drop .nebulatheme files directly into settings!');
        });
        
        return modal;
    }

    async loadThemeDirectory(themesDir, modal) {
        const fileList = modal.querySelector('#themeFileList');
        
        try {
            const files = await window.nebula.fs.readDir(themesDir);
            const themeFiles = files.filter(file => file.endsWith('.nebulatheme'));
            
            if (themeFiles.length === 0) {
                fileList.innerHTML = `
                    <div style="text-align: center; color: var(--nebula-text-secondary); padding: 40px;">
                        <div style="font-size: 48px; margin-bottom: 16px;">🎨</div>
                        <div style="font-size: 16px; margin-bottom: 8px;">No saved themes found</div>
                        <div style="font-size: 14px;">Export a theme first to see it here!</div>
                    </div>
                `;
                return;
            }
            
            // Load theme metadata and display
            const themeItems = [];
            for (const file of themeFiles) {
                try {
                    const filepath = `${themesDir}/${file}`;
                    const themeContent = await window.nebula.fs.readFile(filepath);
                    const themeData = JSON.parse(themeContent);
                    themeItems.push({ file, data: themeData, path: filepath });
                } catch (error) {
                    console.error(`Error loading theme ${file}:`, error);
                }
            }
            
            this.displayThemeList(themeItems, fileList, modal);
            
        } catch (error) {
            fileList.innerHTML = '<div style="text-align: center; color: var(--nebula-text-secondary);">Error loading themes directory</div>';
        }
    }

    displayThemeList(themes, container, modal) {
        container.innerHTML = themes.map(({ file, data, path }) => {
            const date = new Date(data.exportDate || 0).toLocaleDateString();
            const primaryColor = data.customTheme?.primary || '#667eea';
            
            return `
                <div class="theme-file-item" data-path="${path}" style="
                    background: var(--nebula-bg-secondary);
                    border: 1px solid var(--nebula-border);
                    border-radius: 8px;
                    padding: 16px;
                    margin-bottom: 12px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                ">
                    <div style="
                        width: 40px;
                        height: 40px;
                        background: linear-gradient(135deg, ${primaryColor}, ${data.customTheme?.secondary || primaryColor});
                        border-radius: 8px;
                        flex-shrink: 0;
                    "></div>
                    <div style="flex: 1;">
                        <div style="color: var(--nebula-text-primary); font-weight: 600; margin-bottom: 4px;">
                            ${data.name || file.replace('.nebulatheme', '')}
                        </div>
                        <div style="color: var(--nebula-text-secondary); font-size: 12px;">
                            Saved: ${date} • Version: ${data.version || 'Unknown'}
                        </div>
                    </div>
                    <button class="delete-theme-btn" data-path="${path}" style="
                        background: none;
                        border: none;
                        color: var(--nebula-text-secondary);
                        padding: 8px;
                        border-radius: 4px;
                        cursor: pointer;
                        opacity: 0.5;
                    " onclick="event.stopPropagation();">🗑️</button>
                </div>
            `;
        }).join('');
        
        // Add click handlers
        container.querySelectorAll('.theme-file-item').forEach(item => {
            item.addEventListener('click', async () => {
                const path = item.dataset.path;
                await this.loadThemeFromFile(path, modal);
            });
            
            item.addEventListener('mouseenter', () => {
                item.style.background = 'var(--nebula-surface-hover)';
                item.style.transform = 'translateY(-2px)';
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.background = 'var(--nebula-bg-secondary)';
                item.style.transform = 'translateY(0)';
            });
        });
        
        // Add delete handlers
        container.querySelectorAll('.delete-theme-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const path = btn.dataset.path;
                await this.deleteThemeFile(path, modal);
            });
            
            btn.addEventListener('mouseenter', () => {
                btn.style.opacity = '1';
                btn.style.color = '#ef4444';
            });
            
            btn.addEventListener('mouseleave', () => {
                btn.style.opacity = '0.5';
                btn.style.color = 'var(--nebula-text-secondary)';
            });
        });
    }

    async loadThemeFromFile(filepath, modal) {
        try {
            const themeContent = await window.nebula.fs.readFile(filepath);
            const themeData = JSON.parse(themeContent);
            
            modal.remove();
            this.applyImportedTheme(themeData);
            
        } catch (error) {
            console.error('Error loading theme file:', error);
            this.showNotification('❌ Error loading theme file', 'error');
        }
    }

    async deleteThemeFile(filepath, modal) {
        const confirmed = confirm('Delete this theme file? This action cannot be undone.');
        if (!confirmed) return;
        
        try {
            await window.nebula.fs.unlink(filepath);
            this.showNotification('🗑️ Theme file deleted');
            
            // Reload the theme list
            const homeDir = await window.nebula.fs.getHomeDir();
            const themesDir = `${homeDir}/.nebula/themes`;
            await this.loadThemeDirectory(themesDir, modal);
            
        } catch (error) {
            console.error('Error deleting theme file:', error);
            this.showNotification('❌ Error deleting theme file', 'error');
        }
    }

    applyImportedTheme(themeData) {
        if (themeData.version && themeData.version.includes('NebulaDesktop')) {
            // Import theme data
            if (themeData.customTheme) {
                this.customTheme = { ...this.customTheme, ...themeData.customTheme };
            }
            if (themeData.wallpaperSettings) {
                this.wallpaperSettings = { ...this.wallpaperSettings, ...themeData.wallpaperSettings };
            }
            if (themeData.effectSettings) {
                this.effectSettings = { ...this.effectSettings, ...themeData.effectSettings };
            }
            
            // Apply wallpaper first if included
            if (themeData.wallpaperSettings?.image) {
                const body = document.body;
                body.style.backgroundImage = `url(${themeData.wallpaperSettings.image})`;
                body.style.backgroundAttachment = 'fixed';
                body.style.backgroundSize = 'cover';
                body.style.backgroundRepeat = 'no-repeat';
                body.style.backgroundPosition = 'center center';
                console.log('Applied theme wallpaper:', themeData.wallpaperSettings.image);
            } else if (themeData.wallpaperSettings?.type === 'gradient') {
                const body = document.body;
                body.style.background = `linear-gradient(${themeData.wallpaperSettings.gradient.direction}, ${themeData.wallpaperSettings.gradient.start}, ${themeData.wallpaperSettings.gradient.end})`;
                body.style.backgroundAttachment = 'fixed';
            } else if (themeData.wallpaperSettings?.type === 'solid') {
                const body = document.body;
                body.style.background = themeData.wallpaperSettings.solid;
                body.style.backgroundAttachment = 'fixed';
            }
            
            // Apply the theme
            if (themeData.theme === 'custom') {
                this.applyCustomTheme();
            } else if (themeData.theme === 'wallpaper-meta') {
                this.applyWallpaperThemeToDOM(themeData.customTheme);
                this.currentTheme = 'wallpaper-meta';
                localStorage.setItem('nebula-theme', 'wallpaper-meta');
            } else {
                this.applyTheme(themeData.theme);
            }
            
            this.saveSettings();
            
            this.showNotification(`🎨 Theme "${themeData.name || 'Imported Theme'}" applied with wallpaper!`);
            console.log('Theme imported and applied with wallpaper:', themeData);
        } else {
            this.showNotification('❌ Invalid theme file format', 'error');
        }
    }

    // Wallpaper methods
    updateWallpaperTypeSelection(container) {
        const cards = container.querySelectorAll('.wallpaper-type');
        cards.forEach(card => {
            const isSelected = card.dataset.type === this.wallpaperSettings.type;
            card.classList.toggle('selected', isSelected);
            card.style.borderColor = isSelected ? 'var(--nebula-primary)' : 'var(--nebula-border)';
        });

        // Show/hide relevant settings
        container.querySelector('#gradientSettings').style.display = 
            this.wallpaperSettings.type === 'gradient' ? 'block' : 'none';
        container.querySelector('#solidSettings').style.display = 
            this.wallpaperSettings.type === 'solid' ? 'block' : 'none';
        container.querySelector('#imageSettings').style.display = 
            this.wallpaperSettings.type === 'image' ? 'block' : 'none';
    }

    updateGradientPreview(container) {
        const preview = container.querySelector('#gradientSettings .settings-section > div:last-child');
        if (preview) {
            preview.style.background = `linear-gradient(${this.wallpaperSettings.gradient.direction}, ${this.wallpaperSettings.gradient.start}, ${this.wallpaperSettings.gradient.end})`;
        }
    }

    handleImageUpload(file, container) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.wallpaperSettings.image = e.target.result;
            this.wallpaperSettings.imageSource = `Upload: ${file.name}`;
            this.updateImagePreview(container);
            this.showNotification('📤 Image uploaded successfully!');
        };
        reader.readAsDataURL(file);
    }

    applyWallpaper() {
        const body = document.body;
        
        switch (this.wallpaperSettings.type) {
            case 'gradient':
                body.style.background = `linear-gradient(${this.wallpaperSettings.gradient.direction}, ${this.wallpaperSettings.gradient.start}, ${this.wallpaperSettings.gradient.end})`;
                body.style.backgroundAttachment = 'fixed';
                body.style.backgroundSize = 'cover';
                body.style.backgroundRepeat = 'no-repeat';
                break;
                
            case 'solid':
                body.style.background = this.wallpaperSettings.solid;
                body.style.backgroundAttachment = 'fixed';
                body.style.backgroundImage = 'none';
                break;
                
            case 'image':
                if (this.wallpaperSettings.image) {
                    body.style.backgroundImage = `url(${this.wallpaperSettings.image})`;
                    body.style.backgroundAttachment = 'fixed';
                    body.style.backgroundSize = 'cover';
                    body.style.backgroundRepeat = 'no-repeat';
                    body.style.backgroundPosition = 'center center';
                    
                    // Extract colors from the wallpaper and offer theme generation
                    this.extractWallpaperColors(this.wallpaperSettings.image);
                }
                break;
        }
        
        this.saveSettings();
        console.log('Wallpaper applied:', this.wallpaperSettings);
        
        // Show success notification
        this.showNotification('🌄 Wallpaper applied successfully!');
    }

    /**
     * Extract dominant colors from wallpaper image
     */
    async extractWallpaperColors(imageUrl) {
        try {
            // Check if there's already a theme for this wallpaper
            const existingTheme = await this.findThemeForWallpaper(imageUrl);
            
            if (existingTheme) {
                this.showNotification('🎨 Found existing theme for this wallpaper!', 'info');
                
                // Apply the existing theme instead of generating
                setTimeout(() => {
                    this.applyExistingWallpaperTheme(existingTheme);
                }, 1000);
                return;
            }
            
            this.showNotification('🎨 Analyzing wallpaper colors...', 'info');
            
            const colors = await this.analyzeImageColors(imageUrl);
            
            if (colors && colors.length > 0) {
                // Show color extraction results with theme generation option
                setTimeout(() => {
                    this.showWallpaperThemeGenerator(colors, imageUrl);
                }, 1000);
            }
            
        } catch (error) {
            console.error('Error extracting wallpaper colors:', error);
            // Don't show error notification - this is optional functionality
        }
    }

    /**
     * Find existing theme for wallpaper
     */
    async findThemeForWallpaper(imageUrl) {
        try {
            const homeDir = await window.nebula.fs.getHomeDir();
            const themesDir = `${homeDir}/.nebula/themes`;
            
            const themesExists = await window.nebula.fs.exists(themesDir);
            if (!themesExists) return null;
            
            const files = await window.nebula.fs.readDir(themesDir);
            const themeFiles = files.filter(file => file.endsWith('.nebulatheme'));
            
            // Check each theme file for matching wallpaper
            for (const file of themeFiles) {
                try {
                    const filepath = `${themesDir}/${file}`;
                    const themeContent = await window.nebula.fs.readFile(filepath);
                    const themeData = JSON.parse(themeContent);
                    
                    // Check if wallpaper matches
                    if (themeData.wallpaperSettings?.image === imageUrl) {
                        return themeData;
                    }
                } catch (error) {
                    // Skip invalid theme files
                }
            }
            
            return null;
        } catch (error) {
            console.error('Error searching for wallpaper theme:', error);
            return null;
        }
    }

    /**
     * Apply existing wallpaper theme
     */
    applyExistingWallpaperTheme(themeData) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0,0,0,0.7);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(5px);
            animation: fadeIn 0.3s ease-out;
        `;
        
        modal.innerHTML = `
            <div style="
                background: var(--nebula-surface);
                border: 1px solid var(--nebula-border);
                border-radius: 12px;
                width: 500px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.4);
                animation: slideUp 0.3s ease-out;
            ">
                <div style="
                    padding: 24px;
                    border-bottom: 1px solid var(--nebula-border);
                    text-align: center;
                ">
                    <h2 style="color: var(--nebula-text-primary); margin: 0 0 8px 0; font-size: 24px; font-weight: 700;">
                        🎨 Theme Found!
                    </h2>
                    <p style="color: var(--nebula-text-secondary); margin: 0; font-size: 14px;">
                        This wallpaper already has a custom theme: <strong>"${themeData.name}"</strong>
                    </p>
                </div>
                
                <div style="padding: 24px;">
                    <div style="
                        background: var(--nebula-bg-secondary);
                        border: 1px solid var(--nebula-border);
                        border-radius: 8px;
                        padding: 16px;
                        margin-bottom: 20px;
                        display: flex;
                        align-items: center;
                        gap: 16px;
                    ">
                        <div style="
                            width: 40px;
                            height: 40px;
                            background: linear-gradient(135deg, ${themeData.customTheme?.primary || '#667eea'}, ${themeData.customTheme?.secondary || '#764ba2'});
                            border-radius: 8px;
                            flex-shrink: 0;
                        "></div>
                        <div style="flex: 1;">
                            <div style="color: var(--nebula-text-primary); font-weight: 600; margin-bottom: 4px;">
                                ${themeData.name}
                            </div>
                            <div style="color: var(--nebula-text-secondary); font-size: 12px;">
                                Created: ${new Date(themeData.exportDate).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div style="
                    padding: 20px 24px;
                    border-top: 1px solid var(--nebula-border);
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                ">
                    <button id="createNewTheme" style="
                        background: var(--nebula-surface-hover);
                        border: 1px solid var(--nebula-border);
                        color: var(--nebula-text-primary);
                        padding: 12px 20px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 500;
                    ">Create New Theme</button>
                    
                    <button id="applyExistingTheme" style="
                        background: var(--nebula-primary);
                        color: white;
                        border: none;
                        padding: 12px 20px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 500;
                    ">🎨 Apply Existing Theme</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event handlers
        modal.querySelector('#applyExistingTheme').addEventListener('click', () => {
            this.applyImportedTheme(themeData);
            modal.remove();
        });
        
        modal.querySelector('#createNewTheme').addEventListener('click', async () => {
            modal.remove();
            // Proceed with normal color extraction
            const colors = await this.analyzeImageColors(this.wallpaperSettings.image);
            if (colors && colors.length > 0) {
                this.showWallpaperThemeGenerator(colors, this.wallpaperSettings.image);
            }
        });
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    /**
     * Analyze image colors using Canvas API
     */
    async analyzeImageColors(imageUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                try {
                    // Create canvas to analyze the image
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Scale down image for faster processing
                    const maxSize = 200;
                    const scale = Math.min(maxSize / img.width, maxSize / img.height);
                    canvas.width = img.width * scale;
                    canvas.height = img.height * scale;
                    
                    // Draw scaled image
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    
                    // Get image data
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const pixels = imageData.data;
                    
                    // Extract colors
                    const colors = this.extractDominantColors(pixels, canvas.width, canvas.height);
                    
                    resolve(colors);
                } catch (error) {
                    reject(error);
                }
            };
            
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = imageUrl;
        });
    }

    /**
     * Extract dominant colors using color quantization
     */
    extractDominantColors(pixels, width, height) {
        const colorMap = new Map();
        const sampleRate = 4; // Sample every 4th pixel for performance
        
        // Collect color frequency data
        for (let i = 0; i < pixels.length; i += sampleRate * 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const a = pixels[i + 3];
            
            // Skip transparent pixels
            if (a < 128) continue;
            
            // Round colors to reduce noise
            const roundedR = Math.round(r / 16) * 16;
            const roundedG = Math.round(g / 16) * 16;
            const roundedB = Math.round(b / 16) * 16;
            
            const colorKey = `${roundedR},${roundedG},${roundedB}`;
            colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
        }
        
        // Sort colors by frequency and get top colors
        const sortedColors = Array.from(colorMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20) // Get top 20 most frequent colors
            .map(([color, count]) => {
                const [r, g, b] = color.split(',').map(Number);
                return {
                    r, g, b,
                    hex: this.rgbToHex(r, g, b),
                    count,
                    luminance: this.getLuminance(r, g, b)
                };
            });
        
        // Filter and categorize colors
        const palette = this.createColorPalette(sortedColors);
        
        console.log('Extracted color palette:', palette);
        return palette;
    }

    /**
     * Create a balanced color palette with foundation colors
     */
    createColorPalette(colors) {
        const palette = [];
        
        // Always include foundation colors first
        const foundationColors = [
            { 
                r: 255, g: 255, b: 255, 
                hex: '#ffffff', 
                luminance: 1.0, 
                role: 'foundation', 
                name: 'White',
                count: 0 
            },
            { 
                r: 128, g: 128, b: 128, 
                hex: '#808080', 
                luminance: 0.5, 
                role: 'foundation', 
                name: 'Medium Grey',
                count: 0 
            },
            { 
                r: 0, g: 0, b: 0, 
                hex: '#000000', 
                luminance: 0.0, 
                role: 'foundation', 
                name: 'Black',
                count: 0 
            }
        ];
        
        // Add foundation colors to palette
        palette.push(...foundationColors);
        
        // Find the most dominant color (likely background)
        const dominant = colors[0];
        if (dominant) {
            palette.push({
                ...dominant,
                role: 'dominant',
                name: 'Dominant Color'
            });
        }
        
        // Find a good accent color (high saturation, different hue)
        const accent = colors.find(color => 
            this.getColorDistance(color, dominant) > 100 &&
            this.getSaturation(color.r, color.g, color.b) > 0.3
        );
        if (accent) {
            palette.push({
                ...accent,
                role: 'accent',
                name: 'Accent Color'
            });
        }
        
        // Find light color (high luminance) - skip if too similar to white
        const light = colors.find(color => 
            color.luminance > 0.7 && 
            this.getColorDistance(color, foundationColors[0]) > 50
        );
        if (light) {
            palette.push({
                ...light,
                role: 'light',
                name: 'Light Color'
            });
        }
        
        // Find dark color (low luminance) - skip if too similar to black
        const dark = colors.find(color => 
            color.luminance < 0.3 && 
            this.getColorDistance(color, foundationColors[2]) > 50
        );
        if (dark) {
            palette.push({
                ...dark,
                role: 'dark',
                name: 'Dark Color'
            });
        }
        
        // Find medium contrast colors
        const mediumColors = colors.filter(color => 
            color.luminance >= 0.3 && color.luminance <= 0.7 &&
            !palette.some(p => this.getColorDistance(p, color) < 50)
        ).slice(0, 2);
        
        mediumColors.forEach((color, index) => {
            palette.push({
                ...color,
                role: 'medium',
                name: `Medium Color ${index + 1}`
            });
        });
        
        // If we need more colors, add from the extracted list
        const needed = 9 - palette.length; // Now targeting 9 total colors
        if (needed > 0) {
            const additional = colors.filter(color => 
                !palette.some(p => this.getColorDistance(p, color) < 30)
            ).slice(0, needed);
            
            additional.forEach((color, index) => {
                palette.push({
                    ...color,
                    role: 'additional',
                    name: `Color ${palette.length - 2}` // Adjust numbering since we have 3 foundation colors
                });
            });
        }
        
        return palette.slice(0, 9); // Return max 9 colors (3 foundation + 6 extracted)
    }

    /**
     * Color utility functions
     */
    rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = Math.round(x).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }

    getLuminance(r, g, b) {
        // Calculate relative luminance
        const [rs, gs, bs] = [r, g, b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }

    getSaturation(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        return max === 0 ? 0 : (max - min) / max;
    }

    getColorDistance(color1, color2) {
        const dr = color1.r - color2.r;
        const dg = color1.g - color2.g;
        const db = color1.b - color2.b;
        return Math.sqrt(dr * dr + dg * dg + db * db);
    }

    /**
     * Show wallpaper theme generator modal
     */
    showWallpaperThemeGenerator(colors, imageUrl) {
        // Create modal asking if user wants to generate theme
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0,0,0,0.7);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(5px);
            animation: fadeIn 0.3s ease-out;
        `;
        
        const wallpaperName = this.wallpaperSettings.imageSource ? 
            this.wallpaperSettings.imageSource.split(': ')[1] || 'Wallpaper' : 
            'Wallpaper';
        
        modal.innerHTML = `
            <div style="
                background: var(--nebula-surface);
                border: 1px solid var(--nebula-border);
                border-radius: 12px;
                width: 600px;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 8px 32px rgba(0,0,0,0.4);
                animation: slideUp 0.3s ease-out;
            ">
                <div style="
                    padding: 24px;
                    border-bottom: 1px solid var(--nebula-border);
                    text-align: center;
                ">
                    <h2 style="color: var(--nebula-text-primary); margin: 0 0 8px 0; font-size: 24px; font-weight: 700;">
                        🎨 Generate Theme from Wallpaper
                    </h2>
                    <p style="color: var(--nebula-text-secondary); margin: 0; font-size: 14px;">
                        I found ${colors.length} colors in your wallpaper. Create a custom theme?
                    </p>
                </div>
                
                <div style="padding: 24px;">
                    <div style="margin-bottom: 20px;">
                        <h3 style="color: var(--nebula-text-primary); margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">Extracted Colors:</h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap: 12px;">
                            ${colors.map(color => `
                                <div style="text-align: center;">
                                    <div style="
                                        width: 60px;
                                        height: 60px;
                                        background: ${color.hex};
                                        border-radius: 50%;
                                        margin: 0 auto 8px auto;
                                        border: 2px solid var(--nebula-border);
                                        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                                    "></div>
                                    <div style="color: var(--nebula-text-primary); font-size: 11px; font-weight: 500;">${color.name}</div>
                                    <div style="color: var(--nebula-text-secondary); font-size: 10px; font-family: monospace;">${color.hex}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; color: var(--nebula-text-primary); font-weight: 500;">Theme Name:</label>
                        <input type="text" id="wallpaperThemeName" value="${wallpaperName} Theme" style="
                            width: 100%;
                            height: 40px;
                            border: 1px solid var(--nebula-border);
                            border-radius: 6px;
                            padding: 0 12px;
                            background: var(--nebula-bg-secondary);
                            color: var(--nebula-text-primary);
                            font-size: 14px;
                        ">
                    </div>
                </div>
                
                <div style="
                    padding: 20px 24px;
                    border-top: 1px solid var(--nebula-border);
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                ">
                    <button id="cancelWallpaperTheme" style="
                        background: var(--nebula-surface-hover);
                        border: 1px solid var(--nebula-border);
                        color: var(--nebula-text-primary);
                        padding: 12px 20px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 500;
                    ">Cancel</button>
                    
                    <button id="generateWallpaperTheme" style="
                        background: var(--nebula-primary);
                        color: white;
                        border: none;
                        padding: 12px 20px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 500;
                    ">🎨 Create Theme</button>
                </div>
            </div>
        `;
        
        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideUp {
                from { transform: translateY(50px) scale(0.95); opacity: 0; }
                to { transform: translateY(0) scale(1); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(modal);
        
        // Set up event listeners
        modal.querySelector('#cancelWallpaperTheme').addEventListener('click', () => {
            modal.remove();
            style.remove();
        });
        
        modal.querySelector('#generateWallpaperTheme').addEventListener('click', () => {
            const themeName = modal.querySelector('#wallpaperThemeName').value || 'Wallpaper Theme';
            modal.remove();
            style.remove();
            
            // Proceed to color assignment interface
            this.showColorAssignmentInterface(colors, themeName, imageUrl);
        });
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                style.remove();
            }
        });
    }

    /**
     * Show color assignment interface
     */
    showColorAssignmentInterface(colors, themeName, imageUrl) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0,0,0,0.7);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(5px);
            animation: fadeIn 0.3s ease-out;
        `;
        
        // Initialize assignments with smart defaults
        this.colorAssignments = this.createSmartColorAssignments(colors);
        
        modal.innerHTML = `
            <div style="
                background: var(--nebula-surface);
                border: 1px solid var(--nebula-border);
                border-radius: 12px;
                width: 900px;
                max-width: 95vw;
                max-height: 85vh;
                overflow: hidden;
                box-shadow: 0 8px 32px rgba(0,0,0,0.4);
                animation: slideUp 0.3s ease-out;
                display: flex;
                flex-direction: column;
            ">
                <!-- Header -->
                <div style="
                    padding: 24px;
                    border-bottom: 1px solid var(--nebula-border);
                    text-align: center;
                ">
                    <h2 style="color: var(--nebula-text-primary); margin: 0 0 8px 0; font-size: 24px; font-weight: 700;">
                        🎨 Assign Colors to Theme Elements
                    </h2>
                    <p style="color: var(--nebula-text-secondary); margin: 0; font-size: 14px;">
                        Click colors to assign them to desktop elements
                    </p>
                </div>
                
                <!-- Main Content -->
                <div style="
                    flex: 1;
                    display: grid;
                    grid-template-columns: 1fr 1fr 300px;
                    overflow: hidden;
                ">
                    <!-- Color Palette -->
                    <div style="
                        padding: 24px;
                        border-right: 1px solid var(--nebula-border);
                        overflow-y: auto;
                    ">
                        <h3 style="color: var(--nebula-text-primary); margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">
                            Available Colors
                        </h3>
                        <div id="colorPalette" style="display: flex; flex-direction: column; gap: 12px;">
                            ${colors.map((color, index) => `
                                <div class="color-chip" data-color="${color.hex}" data-index="${index}" style="
                                    display: flex;
                                    align-items: center;
                                    gap: 12px;
                                    padding: 12px;
                                    background: var(--nebula-bg-secondary);
                                    border: 2px solid var(--nebula-border);
                                    border-radius: 8px;
                                    cursor: pointer;
                                    transition: all 0.2s ease;
                                ">
                                    <div style="
                                        width: 40px;
                                        height: 40px;
                                        background: ${color.hex};
                                        border-radius: 50%;
                                        border: 2px solid var(--nebula-border);
                                        flex-shrink: 0;
                                    "></div>
                                    <div style="flex: 1;">
                                        <div style="color: var(--nebula-text-primary); font-weight: 500; margin-bottom: 2px;">
                                            ${color.name}
                                        </div>
                                        <div style="color: var(--nebula-text-secondary); font-size: 12px; font-family: monospace;">
                                            ${color.hex}
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <!-- Assignment Targets -->
                    <div style="
                        padding: 24px;
                        border-right: 1px solid var(--nebula-border);
                        overflow-y: auto;
                    ">
                        <h3 style="color: var(--nebula-text-primary); margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">
                            Theme Elements
                        </h3>
                        <div id="assignmentTargets" style="display: flex; flex-direction: column; gap: 12px;">
                            ${this.renderAssignmentTargets()}
                        </div>
                    </div>
                    
                    <!-- Mini Preview Window -->
                    <div style="
                        padding: 24px;
                        background: var(--nebula-bg-secondary);
                        overflow-y: auto;
                    ">
                        <h3 style="color: var(--nebula-text-primary); margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">
                            Live Preview
                        </h3>
                        <div id="miniPreview" style="
                            background: var(--nebula-surface);
                            border: 1px solid var(--nebula-border);
                            border-radius: 12px;
                            overflow: hidden;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                        ">
                            <!-- Mock Window -->
                            <div id="previewTitlebar" style="
                                height: 40px;
                                background: linear-gradient(90deg, ${this.colorAssignments.titlebarStart}, ${this.colorAssignments.titlebarEnd});
                                display: flex;
                                align-items: center;
                                padding: 0 16px;
                                justify-content: space-between;
                            ">
                                <div style="color: ${this.colorAssignments.titlebarText}; font-weight: 600; font-size: 13px;">Preview Window</div>
                                <div style="display: flex; gap: 4px;">
                                    <div style="width: 12px; height: 12px; background: ${this.colorAssignments.titlebarText}; opacity: 0.6; border-radius: 50%;"></div>
                                    <div style="width: 12px; height: 12px; background: ${this.colorAssignments.titlebarText}; opacity: 0.6; border-radius: 50%;"></div>
                                    <div style="width: 12px; height: 12px; background: ${this.colorAssignments.titlebarText}; opacity: 0.6; border-radius: 50%;"></div>
                                </div>
                            </div>
                            <div style="
                                background: ${this.colorAssignments.surface};
                                padding: 16px;
                                color: ${this.colorAssignments.text};
                                min-height: 120px;
                            ">
                                <div style="margin-bottom: 12px;">
                                    <button style="
                                        background: ${this.colorAssignments.primary};
                                        color: white;
                                        border: none;
                                        padding: 8px 16px;
                                        border-radius: 6px;
                                        font-size: 12px;
                                        margin-right: 8px;
                                    ">Primary Button</button>
                                    <button style="
                                        background: ${this.colorAssignments.secondary};
                                        color: white;
                                        border: none;
                                        padding: 8px 16px;
                                        border-radius: 6px;
                                        font-size: 12px;
                                    ">Secondary</button>
                                </div>
                                <div style="
                                    background: ${this.colorAssignments.background};
                                    padding: 12px;
                                    border-radius: 6px;
                                    border: 1px solid ${this.colorAssignments.border};
                                    font-size: 12px;
                                ">
                                    Background with border
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Footer -->
                <div style="
                    padding: 20px 24px;
                    border-top: 1px solid var(--nebula-border);
                    display: flex;
                    gap: 12px;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <div style="display: flex; gap: 12px;">
                        <button id="previewWallpaperTheme" style="
                            background: var(--nebula-surface-hover);
                            border: 1px solid var(--nebula-border);
                            color: var(--nebula-text-primary);
                            padding: 12px 20px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-weight: 500;
                        ">👁️ Preview</button>
                        
                        <button id="resetAssignments" style="
                            background: var(--nebula-surface-hover);
                            border: 1px solid var(--nebula-border);
                            color: var(--nebula-text-primary);
                            padding: 12px 20px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-weight: 500;
                        ">🔄 Reset</button>
                    </div>
                    
                    <div style="display: flex; gap: 12px;">
                        <button id="cancelColorAssignment" style="
                            background: var(--nebula-surface-hover);
                            border: 1px solid var(--nebula-border);
                            color: var(--nebula-text-primary);
                            padding: 12px 20px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-weight: 500;
                        ">Cancel</button>
                        
                        <button id="saveWallpaperTheme" style="
                            background: var(--nebula-primary);
                            color: white;
                            border: none;
                            padding: 12px 20px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-weight: 500;
                        ">💾 Save & Apply Theme</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.setupColorAssignmentListeners(modal, colors, themeName);
    }

    /**
     * Create smart default color assignments
     */
    createSmartColorAssignments(colors) {
        const assignments = {};
        
        // Find colors by role for smart defaults
        const dominant = colors.find(c => c.role === 'dominant') || colors[0];
        const accent = colors.find(c => c.role === 'accent') || colors[1];
        const light = colors.find(c => c.role === 'light') || colors.find(c => c.luminance > 0.7) || colors[0];
        const dark = colors.find(c => c.role === 'dark') || colors.find(c => c.luminance < 0.3) || colors[colors.length - 1];
        
        // Smart assignments
        assignments.primary = accent?.hex || colors[1]?.hex || '#667eea';
        assignments.secondary = dominant?.hex || colors[0]?.hex || '#764ba2';
        assignments.background = dark?.hex || colors[colors.length - 1]?.hex || '#1a1a2e';
        assignments.surface = this.adjustBrightness(assignments.background, 1.2);
        assignments.text = light?.hex || '#eee';
        assignments.border = this.adjustBrightness(assignments.background, 1.5);
        
        // Titlebar gradient
        assignments.titlebarStart = accent?.hex || assignments.primary;
        assignments.titlebarEnd = dominant?.hex || assignments.secondary;
        assignments.titlebarText = light?.hex || assignments.text;
        
        return assignments;
    }

    /**
     * Render assignment target elements
     */
    renderAssignmentTargets() {
        const targets = [
            { key: 'primary', name: 'Primary Color', desc: 'Buttons, links, highlights' },
            { key: 'secondary', name: 'Secondary Color', desc: 'Secondary buttons, accents' },
            { key: 'background', name: 'Background', desc: 'Main desktop background' },
            { key: 'surface', name: 'Surface', desc: 'Window backgrounds, panels' },
            { key: 'text', name: 'Text Color', desc: 'Primary text color' },
            { key: 'border', name: 'Border Color', desc: 'Window borders, dividers' },
            { key: 'titlebarStart', name: 'Titlebar Start', desc: 'Left side of titlebar gradient' },
            { key: 'titlebarEnd', name: 'Titlebar End', desc: 'Right side of titlebar gradient' },
            { key: 'titlebarText', name: 'Titlebar Text', desc: 'Window title text color' }
        ];
        
        return targets.map(target => `
            <div class="assignment-target" data-target="${target.key}" style="
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px;
                background: var(--nebula-bg-secondary);
                border: 2px solid var(--nebula-border);
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
            ">
                <div class="target-color-preview" style="
                    width: 40px;
                    height: 40px;
                    background: ${this.colorAssignments[target.key]};
                    border-radius: 8px;
                    border: 2px solid var(--nebula-border);
                    flex-shrink: 0;
                "></div>
                <div style="flex: 1;">
                    <div style="color: var(--nebula-text-primary); font-weight: 500; margin-bottom: 2px;">
                        ${target.name}
                    </div>
                    <div style="color: var(--nebula-text-secondary); font-size: 12px;">
                        ${target.desc}
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Set up color assignment event listeners
     */
    setupColorAssignmentListeners(modal, colors, themeName) {
        let selectedColor = null;
        
        // Color chip selection
        const colorChips = modal.querySelectorAll('.color-chip');
        colorChips.forEach(chip => {
            chip.addEventListener('click', () => {
                // Clear previous selection
                colorChips.forEach(c => c.style.borderColor = 'var(--nebula-border)');
                
                // Select this color
                chip.style.borderColor = 'var(--nebula-primary)';
                chip.style.borderWidth = '3px';
                selectedColor = chip.dataset.color;
            });
        });
        
        // Assignment target clicks
        const targets = modal.querySelectorAll('.assignment-target');
        targets.forEach(target => {
            target.addEventListener('click', () => {
                if (selectedColor) {
                    const targetKey = target.dataset.target;
                    this.colorAssignments[targetKey] = selectedColor;
                    
                    // Update preview
                    const preview = target.querySelector('.target-color-preview');
                    preview.style.background = selectedColor;
                    
                    // Update mini preview window
                    this.updateMiniPreview(modal);
                    
                    // Clear selection
                    colorChips.forEach(c => {
                        c.style.borderColor = 'var(--nebula-border)';
                        c.style.borderWidth = '2px';
                    });
                    selectedColor = null;
                    
                    this.showNotification(`🎨 ${target.querySelector('div div').textContent} updated`, 'info');
                }
            });
            
            target.addEventListener('mouseenter', () => {
                if (selectedColor) {
                    target.style.borderColor = 'var(--nebula-primary)';
                }
            });
            
            target.addEventListener('mouseleave', () => {
                target.style.borderColor = 'var(--nebula-border)';
            });
        });
        
        // Button handlers
        modal.querySelector('#cancelColorAssignment').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelector('#resetAssignments').addEventListener('click', () => {
            this.colorAssignments = this.createSmartColorAssignments(colors);
            this.updateAssignmentPreviews(modal);
            this.updateMiniPreview(modal);
            this.showNotification('🔄 Assignments reset to smart defaults', 'info');
        });
        
        modal.querySelector('#previewWallpaperTheme').addEventListener('click', () => {
            this.previewWallpaperTheme();
        });
        
        modal.querySelector('#saveWallpaperTheme').addEventListener('click', () => {
            this.saveWallpaperTheme(themeName);
            modal.remove();
        });
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    /**
     * Update mini preview window
     */
    updateMiniPreview(modal) {
        const titlebar = modal.querySelector('#previewTitlebar');
        const surface = titlebar.nextElementSibling;
        
        // Update titlebar gradient
        titlebar.style.background = `linear-gradient(90deg, ${this.colorAssignments.titlebarStart}, ${this.colorAssignments.titlebarEnd})`;
        titlebar.style.color = this.colorAssignments.titlebarText;
        titlebar.querySelector('div').style.color = this.colorAssignments.titlebarText;
        
        // Update titlebar controls
        const controls = titlebar.querySelectorAll('div div');
        controls.forEach(control => {
            control.style.background = this.colorAssignments.titlebarText;
        });
        
        // Update surface
        surface.style.background = this.colorAssignments.surface;
        surface.style.color = this.colorAssignments.text;
        
        // Update buttons
        const buttons = surface.querySelectorAll('button');
        if (buttons[0]) buttons[0].style.background = this.colorAssignments.primary;
        if (buttons[1]) buttons[1].style.background = this.colorAssignments.secondary;
        
        // Update background area
        const bgArea = surface.querySelector('div');
        if (bgArea) {
            bgArea.style.background = this.colorAssignments.background;
            bgArea.style.borderColor = this.colorAssignments.border;
        }
    }

    /**
     * Update assignment previews
     */
    updateAssignmentPreviews(modal) {
        const targets = modal.querySelectorAll('.assignment-target');
        targets.forEach(target => {
            const targetKey = target.dataset.target;
            const preview = target.querySelector('.target-color-preview');
            preview.style.background = this.colorAssignments[targetKey];
        });
    }

    /**
     * Preview wallpaper theme
     */
    previewWallpaperTheme() {
        this.applyWallpaperThemeToDOM(this.colorAssignments);
        this.showNotification('👁️ Theme preview applied! Check your desktop', 'info');
    }

    /**
     * Save and apply wallpaper theme
     */
    saveWallpaperTheme(themeName) {
        // Create enhanced theme object
        const wallpaperTheme = {
            name: themeName,
            type: 'wallpaper-meta',
            primary: this.colorAssignments.primary,
            secondary: this.colorAssignments.secondary,
            accent: this.colorAssignments.primary,
            background: this.colorAssignments.background,
            surface: this.colorAssignments.surface,
            text: this.colorAssignments.text,
            border: this.colorAssignments.border,
            // New titlebar properties
            titlebarStart: this.colorAssignments.titlebarStart,
            titlebarEnd: this.colorAssignments.titlebarEnd,
            titlebarText: this.colorAssignments.titlebarText,
            // Metadata
            wallpaperSource: this.wallpaperSettings.imageSource,
            created: new Date().toISOString()
        };
        
        // Apply the theme
        this.customTheme = wallpaperTheme;
        this.applyWallpaperThemeToDOM(this.colorAssignments);
        this.currentTheme = 'wallpaper-meta';
        
        // Save to file system
        this.saveThemeToFileSystem({
            name: themeName,
            theme: 'wallpaper-meta',
            customTheme: wallpaperTheme,
            wallpaperSettings: this.wallpaperSettings,
            effectSettings: this.effectSettings,
            exportDate: new Date().toISOString(),
            version: 'NebulaDesktop v4.0'
        });
        
        this.saveSettings();
        this.showNotification(`🎨 "${themeName}" theme saved and applied!`);
    }

    /**
     * Apply wallpaper theme to DOM
     */
    applyWallpaperThemeToDOM(assignments) {
        const root = document.documentElement;
        
        // Apply standard theme colors
        root.style.setProperty('--nebula-primary', assignments.primary);
        root.style.setProperty('--nebula-secondary', assignments.secondary);
        root.style.setProperty('--nebula-bg-primary', assignments.background);
        root.style.setProperty('--nebula-bg-secondary', assignments.surface);
        root.style.setProperty('--nebula-surface', assignments.surface);
        root.style.setProperty('--nebula-text-primary', assignments.text);
        root.style.setProperty('--nebula-border', assignments.border);
        root.style.setProperty('--nebula-surface-hover', this.adjustBrightness(assignments.surface, 1.1));
        
        // Apply titlebar gradient to all windows
        this.applyTitlebarGradient(assignments.titlebarStart, assignments.titlebarEnd, assignments.titlebarText);
    }

    /**
     * Apply titlebar gradient to all windows (enhanced for WindowManager)
     */
    applyTitlebarGradient(startColor, endColor, textColor) {
        // Apply to existing windows
        const windows = document.querySelectorAll('.nebula-window');
        windows.forEach(window => {
            const titlebar = window.querySelector('.window-titlebar');
            if (titlebar) {
                titlebar.style.background = `linear-gradient(90deg, ${startColor}, ${endColor})`;
                titlebar.style.color = textColor;
                
                const title = titlebar.querySelector('.window-title');
                if (title) {
                    title.style.color = textColor;
                }
                
                // Update window controls
                const controls = titlebar.querySelectorAll('.window-btn');
                controls.forEach(btn => {
                    btn.style.color = textColor;
                });
            }
        });
        
        // Update WindowManager's default titlebar style for new windows
        if (window.windowManager) {
            window.windowManager.setDefaultTitlebarStyle({
                background: `linear-gradient(90deg, ${startColor}, ${endColor})`,
                color: textColor
            });
        }
        
        // Store in CSS variables for future windows
        const root = document.documentElement;
        root.style.setProperty('--nebula-titlebar-bg', `linear-gradient(90deg, ${startColor}, ${endColor})`);
        root.style.setProperty('--nebula-titlebar-text', textColor);
    }

    /**
     * Initialize auto-load saved theme on startup
     */
    static async autoLoadSavedTheme() {
        try {
            const savedTheme = localStorage.getItem('nebula-theme');
            const savedSettings = localStorage.getItem('nebula-advanced-settings');
            
            if (savedTheme && savedSettings) {
                const settings = JSON.parse(savedSettings);
                
                // Create temporary settings instance to apply theme
                const tempSettings = {
                    customTheme: settings.customTheme || {},
                    wallpaperSettings: settings.wallpaperSettings || {},
                    effectSettings: settings.effectSettings || {}
                };
                
                console.log('Auto-loading theme:', savedTheme, settings);
                
                // Apply wallpaper first if available
                if (settings.wallpaperSettings?.image) {
                    const body = document.body;
                    body.style.backgroundImage = `url(${settings.wallpaperSettings.image})`;
                    body.style.backgroundAttachment = 'fixed';
                    body.style.backgroundSize = 'cover';
                    body.style.backgroundRepeat = 'no-repeat';
                    body.style.backgroundPosition = 'center center';
                    console.log('Applied wallpaper:', settings.wallpaperSettings.image);
                } else if (settings.wallpaperSettings?.type === 'gradient') {
                    const body = document.body;
                    body.style.background = `linear-gradient(${settings.wallpaperSettings.gradient.direction}, ${settings.wallpaperSettings.gradient.start}, ${settings.wallpaperSettings.gradient.end})`;
                    body.style.backgroundAttachment = 'fixed';
                    console.log('Applied gradient wallpaper');
                } else if (settings.wallpaperSettings?.type === 'solid') {
                    const body = document.body;
                    body.style.background = settings.wallpaperSettings.solid;
                    body.style.backgroundAttachment = 'fixed';
                    console.log('Applied solid wallpaper');
                }
                
                // Apply theme based on type
                if (savedTheme === 'wallpaper-meta' && settings.customTheme?.titlebarStart) {
                    // Apply wallpaper meta theme
                    NebulaSettings.prototype.applyWallpaperThemeToDOM.call({ colorAssignments: settings.customTheme }, settings.customTheme);
                    console.log('Applied wallpaper-meta theme');
                } else if (savedTheme === 'custom' && settings.customTheme) {
                    // Apply custom theme
                    const root = document.documentElement;
                    root.style.setProperty('--nebula-primary', settings.customTheme.primary || '#667eea');
                    root.style.setProperty('--nebula-secondary', settings.customTheme.secondary || '#764ba2');
                    root.style.setProperty('--nebula-accent', settings.customTheme.accent || '#f093fb');
                    root.style.setProperty('--nebula-bg-primary', settings.customTheme.background || '#1a1a2e');
                    root.style.setProperty('--nebula-bg-secondary', settings.customTheme.surface || '#16213e');
                    root.style.setProperty('--nebula-surface', settings.customTheme.surface || '#16213e');
                    root.style.setProperty('--nebula-text-primary', settings.customTheme.text || '#eee');
                    root.style.setProperty('--nebula-text-secondary', settings.customTheme.text + '99' || '#eee99');
                    root.style.setProperty('--nebula-border', settings.customTheme.border || '#0f3460');
                    root.style.setProperty('--nebula-surface-hover', NebulaSettings.prototype.adjustBrightness(settings.customTheme.surface || '#16213e', 1.2));
                    console.log('Applied custom theme');
                } else {
                    // Apply standard theme
                    const root = document.documentElement;
                    document.documentElement.setAttribute('data-theme', savedTheme);
                    
                    switch (savedTheme) {
                        case 'light':
                            root.style.setProperty('--nebula-bg-primary', '#ffffff');
                            root.style.setProperty('--nebula-bg-secondary', '#f8fafc');
                            root.style.setProperty('--nebula-surface', '#ffffff');
                            root.style.setProperty('--nebula-text-primary', '#1e293b');
                            root.style.setProperty('--nebula-text-secondary', '#64748b');
                            root.style.setProperty('--nebula-border', '#e2e8f0');
                            break;
                        case 'dark':
                            root.style.setProperty('--nebula-bg-primary', '#0f172a');
                            root.style.setProperty('--nebula-bg-secondary', '#1e293b');
                            root.style.setProperty('--nebula-surface', '#334155');
                            root.style.setProperty('--nebula-text-primary', '#f1f5f9');
                            root.style.setProperty('--nebula-text-secondary', '#cbd5e0');
                            root.style.setProperty('--nebula-border', '#475569');
                            break;
                        case 'nebula':
                            root.style.setProperty('--nebula-bg-primary', '#1a1a2e');
                            root.style.setProperty('--nebula-bg-secondary', '#16213e');
                            root.style.setProperty('--nebula-surface', '#0f3460');
                            root.style.setProperty('--nebula-text-primary', '#eee');
                            root.style.setProperty('--nebula-text-secondary', '#a0a9c0');
                            root.style.setProperty('--nebula-border', '#16213e');
                            break;
                    }
                    console.log('Applied standard theme:', savedTheme);
                }
                
                console.log(`Auto-loaded theme: ${savedTheme}`);
            }
        } catch (error) {
            console.warn('Could not auto-load saved theme:', error);
        }
    }

    /**
     * Utility function to adjust color brightness
     */
    adjustBrightness(hex, factor) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        
        const newR = Math.min(255, Math.round(r * factor));
        const newG = Math.min(255, Math.round(g * factor));
        const newB = Math.min(255, Math.round(b * factor));
        
        return `#${[newR, newG, newB].map(x => x.toString(16).padStart(2, '0')).join('')}`;
    }

    previewWallpaper() {
        // Create preview overlay
        const preview = document.createElement('div');
        preview.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 9999;
            pointer-events: none;
            opacity: 0.7;
            transition: all 0.3s ease;
        `;
        
        switch (this.wallpaperSettings.type) {
            case 'gradient':
                preview.style.background = `linear-gradient(${this.wallpaperSettings.gradient.direction}, ${this.wallpaperSettings.gradient.start}, ${this.wallpaperSettings.gradient.end})`;
                break;
            case 'solid':
                preview.style.background = this.wallpaperSettings.solid;
                break;
            case 'image':
                if (this.wallpaperSettings.image) {
                    preview.style.backgroundImage = `url(${this.wallpaperSettings.image})`;
                    preview.style.backgroundSize = 'cover';
                    preview.style.backgroundPosition = 'center center';
                }
                break;
        }
        
        document.body.appendChild(preview);
        
        // Add preview notice
        const notice = document.createElement('div');
        notice.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-weight: 500;
        `;
        notice.textContent = '🌄 Wallpaper Preview - Click anywhere to close';
        document.body.appendChild(notice);
        
        // Remove preview on click
        const removePreview = () => {
            preview.remove();
            notice.remove();
            document.removeEventListener('click', removePreview);
        };
        
        setTimeout(() => {
            document.addEventListener('click', removePreview);
        }, 100);
        
        // Auto-remove after 5 seconds
        setTimeout(removePreview, 5000);
    }

    // Windows methods
    previewWindowStyle(container) {
        const borderRadius = container.querySelector('#borderRadius').value;
        const shadowIntensity = container.querySelector('#shadowIntensity').value;
        
        // Create preview window
        const preview = document.createElement('div');
        preview.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 300px;
            height: 200px;
            background: var(--nebula-surface);
            border-radius: ${borderRadius}px;
            box-shadow: 0 8px ${Math.round(shadowIntensity * 0.5)}px rgba(0,0,0,${shadowIntensity / 100});
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--nebula-text-primary);
            font-weight: 600;
            border: 1px solid var(--nebula-border);
            animation: scaleIn 0.3s ease-out;
        `;
        
        preview.innerHTML = `
            <div style="text-align: center;">
                <div style="margin-bottom: 8px;">🪟 Preview Window</div>
                <div style="font-size: 12px; opacity: 0.7;">Radius: ${borderRadius}px, Shadow: ${shadowIntensity}%</div>
            </div>
        `;
        
        document.body.appendChild(preview);
        
        // Remove after 3 seconds
        setTimeout(() => {
            preview.style.animation = 'scaleOut 0.3s ease-in forwards';
            setTimeout(() => preview.remove(), 300);
        }, 3000);
    }

    applyWindowSettings(container) {
        const settings = {
            borderRadius: container.querySelector('#borderRadius').value,
            shadowIntensity: container.querySelector('#shadowIntensity').value,
            enableBlur: container.querySelector('#enableBlur')?.checked || false,
            enableGlass: container.querySelector('#enableGlass')?.checked || false,
            enableShadows: container.querySelector('#enableShadows')?.checked || false,
            enableBorder: container.querySelector('#enableBorder')?.checked || false,
            enableSnapping: container.querySelector('#enableSnapping')?.checked || false,
            enableMinimizeToTray: container.querySelector('#enableMinimizeToTray')?.checked || false,
            enableAlwaysOnTop: container.querySelector('#enableAlwaysOnTop')?.checked || false
        };
        
        // Apply to CSS variables for future windows
        const root = document.documentElement;
        root.style.setProperty('--nebula-radius-lg', `${settings.borderRadius}px`);
        root.style.setProperty('--nebula-shadow-lg', `0 8px ${Math.round(settings.shadowIntensity * 0.5)}px rgba(0,0,0,${settings.shadowIntensity / 100})`);
        
        // Apply to existing windows
        this.updateExistingWindows(settings);
        
        this.saveSettings();
        console.log('Window settings applied:', settings);
        this.showNotification('🪟 Window settings applied to all windows!');
    }

    updateExistingWindows(settings) {
        const windows = document.querySelectorAll('.nebula-window');
        windows.forEach(window => {
            window.style.borderRadius = `${settings.borderRadius}px`;
            window.style.boxShadow = `0 8px ${Math.round(settings.shadowIntensity * 0.5)}px rgba(0,0,0,${settings.shadowIntensity / 100})`;
            
            if (settings.enableBlur) {
                window.style.backdropFilter = 'blur(10px)';
            } else {
                window.style.backdropFilter = 'none';
            }
            
            if (settings.enableGlass) {
                window.style.background = 'rgba(var(--nebula-surface-rgb), 0.9)';
            } else {
                window.style.background = 'var(--nebula-surface)';
            }
            
            if (!settings.enableShadows) {
                window.style.boxShadow = 'none';
            }
            
            if (settings.enableBorder) {
                window.style.border = '2px solid var(--nebula-border)';
            } else {
                window.style.border = '1px solid var(--nebula-border)';
            }
        });
    }

    // Effects methods
    toggleParticleEffect(container) {
        this.particlesActive = !this.particlesActive;
        const btn = container.querySelector('#toggleParticles');
        if (btn) {
            btn.textContent = this.particlesActive ? 'Stop Preview' : 'Start Preview';
        }
        
        if (this.particlesActive) {
            this.startParticleEffect();
        } else {
            this.stopParticleEffect();
        }
    }

    startParticleEffect() {
        this.stopParticleEffect(); // Clear any existing effects
        
        const type = this.effectSettings.particleEffect;
        const intensity = this.effectSettings.effectIntensity;
        
        if (type === 'none') return;
        
        // Create particle container BEHIND windows
        const container = document.createElement('div');
        container.id = 'particle-container';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: 0;
            overflow: hidden;
        `;
        
        // Insert before desktop content but after body background
        const desktop = document.getElementById('desktop');
        if (desktop) {
            desktop.parentNode.insertBefore(container, desktop);
        } else {
            document.body.appendChild(container);
        }
        
        // Generate particles based on type
        for (let i = 0; i < intensity; i++) {
            const particle = this.createParticle(type, i);
            container.appendChild(particle);
        }
        
        console.log(`Started ${type} particle effect with ${intensity} particles`);
        this.showNotification(`✨ ${type} particle effect started! (Behind windows)`);
    }

    createParticle(type, index) {
        const particle = document.createElement('div');
        const size = Math.random() * 4 + 2;
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;
        const duration = Math.random() * 10 + 5;
        
        let particleStyle = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            pointer-events: none;
            opacity: ${Math.random() * 0.8 + 0.2};
        `;
        
        switch (type) {
            case 'stars':
                particleStyle += `
                    background: white;
                    border-radius: 50%;
                    box-shadow: 0 0 ${size * 2}px rgba(255,255,255,0.5);
                `;
                particle.style.animation = `twinkle-${index} ${duration}s infinite ease-in-out`;
                
                // Add keyframes for this specific particle
                if (!document.getElementById(`twinkle-${index}`)) {
                    const style = document.createElement('style');
                    style.id = `twinkle-${index}`;
                    style.textContent = `
                        @keyframes twinkle-${index} {
                            0%, 100% { opacity: 0.2; transform: scale(1); }
                            50% { opacity: 1; transform: scale(1.2); }
                        }
                    `;
                    document.head.appendChild(style);
                }
                break;
                
            case 'dots':
                particleStyle += `
                    background: var(--nebula-primary);
                    border-radius: 50%;
                `;
                particle.style.animation = `float-${index} ${duration}s infinite ease-in-out`;
                
                if (!document.getElementById(`float-${index}`)) {
                    const style = document.createElement('style');
                    style.id = `float-${index}`;
                    style.textContent = `
                        @keyframes float-${index} {
                            0% { transform: translateY(0px) translateX(0px); }
                            33% { transform: translateY(-20px) translateX(10px); }
                            66% { transform: translateY(10px) translateX(-5px); }
                            100% { transform: translateY(0px) translateX(0px); }
                        }
                    `;
                    document.head.appendChild(style);
                }
                break;
                
            case 'bubbles':
                particleStyle += `
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 50%;
                `;
                particle.style.animation = `bubble-${index} ${duration}s infinite linear`;
                
                if (!document.getElementById(`bubble-${index}`)) {
                    const style = document.createElement('style');
                    style.id = `bubble-${index}`;
                    style.textContent = `
                        @keyframes bubble-${index} {
                            0% { transform: translateY(100vh) scale(0); opacity: 0; }
                            10% { opacity: 1; }
                            90% { opacity: 1; }
                            100% { transform: translateY(-100px) scale(1); opacity: 0; }
                        }
                    `;
                    document.head.appendChild(style);
                }
                break;
        }
        
        particle.style.cssText = particleStyle;
        return particle;
    }

    stopParticleEffect() {
        const container = document.getElementById('particle-container');
        if (container) {
            container.remove();
        }
        
        // Clean up particle animation styles
        const styles = document.querySelectorAll('style[id^="twinkle-"], style[id^="float-"], style[id^="bubble-"]');
        styles.forEach(style => style.remove());
        
        this.particlesActive = false;
        console.log('Stopped particle effects');
    }

    applyEffects() {
        // Apply animation speed
        const speed = 1 / this.effectSettings.animationSpeed;
        document.documentElement.style.setProperty('--nebula-transition-duration', `${speed}s`);
        document.documentElement.style.setProperty('--nebula-transition-fast', `${speed * 0.5}s`);
        
        // Apply reduced motion
        if (this.effectSettings.reducedMotion) {
            document.documentElement.style.setProperty('--nebula-transition-duration', '0s');
            document.documentElement.style.setProperty('--nebula-transition-fast', '0s');
            document.documentElement.style.setProperty('--nebula-transition', 'none');
        } else {
            document.documentElement.style.setProperty('--nebula-transition', `all ${speed}s cubic-bezier(0.4, 0, 0.2, 1)`);
        }
        
        // Apply hardware acceleration
        if (this.effectSettings.hardwareAcceleration) {
            document.documentElement.style.setProperty('--nebula-hardware-acceleration', 'translateZ(0)');
        } else {
            document.documentElement.style.setProperty('--nebula-hardware-acceleration', 'none');
        }
        
        // Update all existing windows with new animation settings
        const windows = document.querySelectorAll('.nebula-window');
        windows.forEach(window => {
            if (this.effectSettings.enableWindowAnimations) {
                window.style.transition = `all ${speed}s cubic-bezier(0.4, 0, 0.2, 1)`;
            } else {
                window.style.transition = 'none';
            }
        });
        
        // Update buttons and interactive elements
        const buttons = document.querySelectorAll('button, .nav-item, .theme-card, .wallpaper-type');
        buttons.forEach(button => {
            if (this.effectSettings.enableHoverEffects) {
                button.style.transition = `all ${speed * 0.5}s ease`;
            } else {
                button.style.transition = 'none';
            }
        });
        
        console.log('Effects applied:', this.effectSettings);
        this.saveSettings();
        this.showNotification('✨ Animation settings applied!');
    }

    testAnimation() {
        // Create a test animation element
        const testEl = document.createElement('div');
        testEl.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0);
            width: 200px;
            height: 100px;
            background: var(--nebula-primary);
            color: white;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            z-index: 10000;
        `;
        
        testEl.textContent = `🎬 Speed: ${this.effectSettings.animationSpeed.toFixed(1)}x`;
        
        // Add animation keyframes
        const animationDuration = 1 / this.effectSettings.animationSpeed;
        const style = document.createElement('style');
        style.textContent = `
            @keyframes testAnimation {
                0% { transform: translate(-50%, -50%) scale(0) rotate(-180deg); opacity: 0; }
                50% { transform: translate(-50%, -50%) scale(1.1) rotate(-90deg); opacity: 1; }
                100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 1; }
            }
            
            @keyframes testAnimationOut {
                0% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 1; }
                100% { transform: translate(-50%, -50%) scale(0) rotate(180deg); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        
        testEl.style.animation = `testAnimation ${animationDuration}s ease-out forwards`;
        document.body.appendChild(testEl);
        
        // Remove after showing
        setTimeout(() => {
            testEl.style.animation = `testAnimationOut ${animationDuration}s ease-in forwards`;
            setTimeout(() => {
                testEl.remove();
                style.remove();
            }, animationDuration * 1000);
        }, 2000);
    }

    resetEffects(container) {
        // Reset to defaults
        this.effectSettings = {
            animationSpeed: 1.0,
            enableWindowAnimations: true,
            enableHoverEffects: true,
            enableTransitions: true,
            particleEffect: 'none',
            effectIntensity: 30,
            reducedMotion: false,
            hardwareAcceleration: true,
            highRefreshRate: false
        };
        
        // Update UI
        container.querySelector('#animationSpeed').value = 1.0;
        container.querySelector('#animationSpeedValue').textContent = '1.0';
        container.querySelector('#effectIntensity').value = 30;
        container.querySelector('#effectIntensityValue').textContent = '30';
        container.querySelector('#particleEffect').value = 'none';
        
        const checkboxes = ['enableWindowAnimations', 'enableHoverEffects', 'enableTransitions', 'hardwareAcceleration'];
        checkboxes.forEach(id => {
            const checkbox = container.querySelector(`#${id}`);
            if (checkbox) checkbox.checked = true;
        });
        
        const uncheckedBoxes = ['reducedMotion', 'highRefreshRate'];
        uncheckedBoxes.forEach(id => {
            const checkbox = container.querySelector(`#${id}`);
            if (checkbox) checkbox.checked = false;
        });
        
        this.stopParticleEffect();
        this.applyEffects();
        console.log('Effects reset to defaults');
        this.showNotification('🔄 Effects reset to defaults');
    }

    // System methods
    updateSystemInfo(container) {
        // Platform info
        const platformEl = container.querySelector('#platformInfo');
        if (platformEl) {
            platformEl.textContent = navigator.platform || 'Web Platform';
        }
        
        // Running apps count
        const appsEl = container.querySelector('#runningAppsCount');
        if (appsEl) {
            const windows = document.querySelectorAll('.window');
            appsEl.textContent = `${windows.length} active`;
        }
        
        // Uptime
        const uptimeEl = container.querySelector('#uptimeDisplay');
        if (uptimeEl) {
            const uptime = Date.now() - this.startTime;
            const hours = Math.floor(uptime / (1000 * 60 * 60));
            const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
            uptimeEl.textContent = `${hours}h ${minutes}m`;
        }
        
        // Memory usage (simulated)
        const memoryEl = container.querySelector('#memoryUsage');
        if (memoryEl) {
            const used = Math.round(Math.random() * 2048 + 512);
            memoryEl.textContent = `${used}MB`;
        }
        
        // Update theme display
        const themeEl = container.querySelector('#currentThemeDisplay');
        if (themeEl) {
            themeEl.textContent = this.currentTheme;
        }
        
        console.log('System information updated');
    }

    async updateAdBlockerStatus(container) {
        try {
            const statusEl = container.querySelector('#adBlockerStatus');
            const ruleCountEl = container.querySelector('#adBlockerRuleCount');
            const lastUpdateEl = container.querySelector('#adBlockerLastUpdate');
            const toggle = container.querySelector('#adBlockerToggle');
            const track = container.querySelector('.toggle-track');
            const thumb = container.querySelector('.toggle-thumb');
            
            // Get current ad blocker status and stats
            const [isEnabled, stats] = await Promise.all([
                window.nebula.adBlocker.getStatus(),
                window.nebula.adBlocker.getStats()
            ]);
            
            // Update status text
            if (statusEl) {
                statusEl.textContent = isEnabled ? 'Enabled' : 'Disabled';
                statusEl.style.color = isEnabled ? 'var(--nebula-accent)' : 'var(--nebula-text-tertiary)';
            }
            
            // Update rule count
            if (ruleCountEl) {
                ruleCountEl.textContent = stats.filterCount ? `${stats.filterCount.toLocaleString()}` : 'Loading...';
            }
            
            // Update last update time
            if (lastUpdateEl) {
                if (stats.lastUpdate) {
                    const date = new Date(stats.lastUpdate);
                    const now = new Date();
                    const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
                    
                    if (diffHours < 1) {
                        lastUpdateEl.textContent = 'Just now';
                    } else if (diffHours < 24) {
                        lastUpdateEl.textContent = `${diffHours}h ago`;
                    } else {
                        lastUpdateEl.textContent = `${Math.floor(diffHours / 24)}d ago`;
                    }
                    
                    // Add indicator if outdated
                    if (stats.isOutdated) {
                        lastUpdateEl.textContent += ' (outdated)';
                        lastUpdateEl.style.color = '#dc2626';
                    } else {
                        lastUpdateEl.style.color = 'var(--nebula-text-tertiary)';
                    }
                } else {
                    lastUpdateEl.textContent = 'Never';
                    lastUpdateEl.style.color = '#dc2626';
                }
            }
            
            // Update toggle switch
            if (toggle) {
                toggle.checked = isEnabled;
            }
            
            // Update toggle visual state
            if (track && thumb) {
                if (isEnabled) {
                    track.style.background = 'var(--nebula-accent)';
                    thumb.style.left = '28px';
                } else {
                    track.style.background = 'var(--nebula-border)';
                    thumb.style.left = '2px';
                }
            }
            
        } catch (error) {
            console.error('Failed to get ad blocker status:', error);
            const statusEl = container.querySelector('#adBlockerStatus');
            if (statusEl) {
                statusEl.textContent = 'Error';
                statusEl.style.color = '#dc2626';
            }
        }
    }

    updateStorageInfo(container) {
        // Calculate localStorage usage
        let totalSize = 0;
        let itemCount = 0;
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('nebula-')) {
                const value = localStorage.getItem(key);
                totalSize += key.length + (value ? value.length : 0);
                itemCount++;
            }
        }
        
        const usedEl = container.querySelector('#usedStorage');
        const itemsEl = container.querySelector('#totalItems');
        
        if (usedEl) {
            const sizeKB = (totalSize / 1024).toFixed(2);
            usedEl.textContent = `${sizeKB} KB`;
        }
        
        if (itemsEl) {
            itemsEl.textContent = `${itemCount} items`;
        }
        
        console.log(`Storage: ${totalSize} bytes, ${itemCount} items`);
    }

    clearAllData(container) {
        const confirmed = confirm(`⚠️ Clear All Data?

This will permanently delete:
• All settings and preferences
• Custom themes and wallpapers
• User data and configurations

This action cannot be undone. Continue?`);
        
        if (confirmed) {
            // Clear all nebula-related localStorage
            const keys = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('nebula-')) {
                    keys.push(key);
                }
            }
            
            keys.forEach(key => localStorage.removeItem(key));
            
            // Reset to defaults
            this.currentTheme = 'dark';
            this.customTheme = {
                primary: '#667eea',
                secondary: '#764ba2',
                accent: '#f093fb',
                background: '#1a1a2e',
                surface: '#16213e',
                text: '#eee',
                border: '#0f3460'
            };
            this.wallpaperSettings = {
                type: 'gradient',
                gradient: {
                    start: '#667eea',
                    end: '#764ba2',
                    direction: '135deg'
                },
                solid: '#1a1a2e',
                image: null
            };
            
            this.updateStorageInfo(container);
            
            alert('✅ All data cleared successfully!\nSettings have been reset to defaults.');
            console.log('All user data cleared');
        }
    }

    exportAllSettings() {
        const allSettings = {
            version: 'NebulaDesktop v4.0',
            exportDate: new Date().toISOString(),
            theme: this.currentTheme,
            customTheme: this.customTheme,
            wallpaperSettings: this.wallpaperSettings,
            effectSettings: this.effectSettings,
            preferences: {}
        };
        
        // Collect all localStorage items
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('nebula-')) {
                try {
                    allSettings.preferences[key] = JSON.parse(localStorage.getItem(key));
                } catch (e) {
                    allSettings.preferences[key] = localStorage.getItem(key);
                }
            }
        }
        
        // Create download
        const blob = new Blob([JSON.stringify(allSettings, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nebula-settings-complete-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        console.log('Settings exported successfully');
    }

    importAllSettings(file, container) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const settings = JSON.parse(e.target.result);
                
                if (settings.version && settings.version.includes('NebulaDesktop')) {
                    // Import settings
                    if (settings.theme) this.currentTheme = settings.theme;
                    if (settings.customTheme) this.customTheme = settings.customTheme;
                    if (settings.wallpaperSettings) this.wallpaperSettings = settings.wallpaperSettings;
                    if (settings.effectSettings) this.effectSettings = settings.effectSettings;
                    
                    // Import preferences to localStorage
                    if (settings.preferences) {
                        Object.entries(settings.preferences).forEach(([key, value]) => {
                            localStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : value);
                        });
                    }
                    
                    this.saveSettings();
                    this.updateStorageInfo(container);
                    
                    alert(`✅ Settings imported successfully!
                    
Imported from: ${settings.exportDate ? new Date(settings.exportDate).toLocaleDateString() : 'Unknown date'}
Version: ${settings.version}

Please refresh the page to see all changes.`);
                    
                    console.log('Settings imported successfully:', settings);
                } else {
                    throw new Error('Invalid settings file format');
                }
            } catch (error) {
                alert('❌ Import failed!\n\nThe file appears to be corrupted or in an invalid format.');
                console.error('Import error:', error);
            }
        };
        reader.readAsText(file);
    }

    checkForUpdates() {
        // Simulate update check
        const updates = [
            'Performance improvements',
            'New particle effects',
            'Enhanced customization options',
            'Bug fixes and stability improvements'
        ];
        
        const hasUpdates = Math.random() > 0.7; // 30% chance of updates
        
        if (hasUpdates) {
            alert(`🔄 Update Available!

NebulaDesktop v4.1 is available with:
${updates.map(update => `• ${update}`).join('\n')}

Visit the official website to download the latest version.`);
        } else {
            alert(`✅ You're up to date!

NebulaDesktop v4.0
🕒 Last checked: ${new Date().toLocaleString()}

No updates available at this time.`);
        }
    }

    showAbout() {
        alert(`🌌 NebulaDesktop v4.0

Advanced Desktop Environment
Built with modern web technologies

Features:
• Fully customizable themes and wallpapers
• Advanced window management
• Particle effects and animations
• Comprehensive settings system
• Real-time terminal integration

Created with ❤️ for the modern desktop experience.

License: MIT
© 2024 NebulaDesktop Project`);
    }

    // ==================== UTILITY METHODS ====================

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        const bgColor = type === 'success' ? 'var(--nebula-primary)' : 
                        type === 'error' ? '#ef4444' : 
                        type === 'info' ? '#3b82f6' : '#f59e0b';
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${bgColor};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-weight: 500;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideInRight 0.3s ease-out;
            backdrop-filter: blur(10px);
        `;
        notification.textContent = message;
        
        // Add slide-in animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
            setTimeout(() => {
                notification.remove();
                style.remove();
            }, 300);
        }, 3000);
    }

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
                this.effectSettings = { ...this.effectSettings, ...settings.effectSettings };
            }
        } catch (error) {
            console.warn('Could not load advanced settings:', error);
        }
    }
    
    saveSettings() {
        try {
            const settings = {
                customTheme: this.customTheme,
                wallpaperSettings: this.wallpaperSettings,
                effectSettings: this.effectSettings
            };
            localStorage.setItem('nebula-advanced-settings', JSON.stringify(settings));
        } catch (error) {
            console.warn('Could not save advanced settings:', error);
        }
    }

    // ==================== APP INTERFACE METHODS ====================
    
    getTitle() {
        return 'Settings';
    }

    getIcon() {
        return '⚙️';
    }

    cleanup() {
        this.stopParticleEffect();
        console.log('Settings app cleaned up');
        
        // Clean up any global styles we added
        const settingsStyles = document.getElementById('settings-styles');
        if (settingsStyles) {
            settingsStyles.remove();
        }
    }
}

// Enhanced WindowManager integration
if (window.WindowManager) {
    // Add titlebar style methods to WindowManager prototype
    window.WindowManager.prototype.setDefaultTitlebarStyle = function(style) {
        this.defaultTitlebarStyle = style;
    };
    
    // Override the original createWindow to apply default titlebar styles
    const originalCreateWindow = window.WindowManager.prototype.createWindow;
    window.WindowManager.prototype.createWindow = function(options = {}) {
        const windowId = originalCreateWindow.call(this, options);
        
        // Apply default titlebar style if available
        if (this.defaultTitlebarStyle && windowId) {
            setTimeout(() => {
                const windowElement = document.getElementById(windowId);
                const titlebar = windowElement?.querySelector('.window-titlebar');
                if (titlebar) {
                    Object.assign(titlebar.style, this.defaultTitlebarStyle);
                    
                    // Update title and controls color
                    const title = titlebar.querySelector('.window-title');
                    const controls = titlebar.querySelectorAll('.window-btn');
                    
                    if (title && this.defaultTitlebarStyle.color) {
                        title.style.color = this.defaultTitlebarStyle.color;
                    }
                    
                    controls.forEach(btn => {
                        if (this.defaultTitlebarStyle.color) {
                            btn.style.color = this.defaultTitlebarStyle.color;
                        }
                    });
                }
            }, 50);
        }
        
        return windowId;
    };
}

// Add required CSS animations and fix color picker styling
const settingsCSS = document.createElement('style');
settingsCSS.textContent = `
    /* Ensure windows always appear above particle effects */
    .nebula-window {
        z-index: 100 !important;
        min-z-index: 100;
    }
    
    #desktop {
        z-index: 10;
    }
    
    #particle-container {
        z-index: 0 !important;
    }
    
    @keyframes scaleIn {
        from { transform: translate(-50%, -50%) scale(0); opacity: 0; }
        to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    }
    
    @keyframes scaleOut {
        from { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        to { transform: translate(-50%, -50%) scale(0); opacity: 0; }
    }
    
    .settings-section {
        transition: all 0.3s ease;
    }
    
    .settings-section:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    .theme-card, .wallpaper-type {
        transition: all 0.3s ease;
    }
    
    .theme-card:hover, .wallpaper-type:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    
    /* Fix color picker styling */
    input[type="color"] {
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        background: none;
        border: 2px solid var(--nebula-border);
        border-radius: 6px;
        cursor: pointer;
        width: 50px;
        height: 40px;
        padding: 0;
        overflow: hidden;
    }
    
    input[type="color"]::-webkit-color-swatch-wrapper {
        padding: 0;
        border: none;
        border-radius: 4px;
    }
    
    input[type="color"]::-webkit-color-swatch {
        border: none;
        border-radius: 4px;
    }
    
    input[type="color"]::-moz-color-swatch {
        border: none;
        border-radius: 4px;
    }
    
    input[type="color"]:hover {
        border-color: var(--nebula-primary);
        transform: scale(1.05);
    }
    
    input[type="color"]:focus {
        outline: none;
        border-color: var(--nebula-primary);
        box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
    }
    
    /* Range slider styling */
    input[type="range"] {
        -webkit-appearance: none;
        appearance: none;
        background: var(--nebula-surface-hover);
        height: 6px;
        border-radius: 3px;
        outline: none;
    }
    
    input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: var(--nebula-primary);
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        transition: all 0.2s ease;
    }
    
    input[type="range"]::-webkit-slider-thumb:hover {
        transform: scale(1.2);
        box-shadow: 0 4px 8px rgba(102, 126, 234, 0.4);
    }
    
    input[type="range"]::-moz-range-thumb {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: var(--nebula-primary);
        cursor: pointer;
        border: none;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        transition: all 0.2s ease;
    }
    
    input[type="range"]::-moz-range-thumb:hover {
        transform: scale(1.2);
        box-shadow: 0 4px 8px rgba(102, 126, 234, 0.4);
    }
    
    /* Checkbox styling */
    input[type="checkbox"] {
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        border: 2px solid var(--nebula-border);
        border-radius: 3px;
        background: var(--nebula-bg-secondary);
        cursor: pointer;
        position: relative;
        transition: all 0.2s ease;
    }
    
    input[type="checkbox"]:checked {
        background: var(--nebula-primary);
        border-color: var(--nebula-primary);
    }
    
    input[type="checkbox"]:checked::after {
        content: '✓';
        position: absolute;
        color: white;
        font-size: 12px;
        font-weight: bold;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
    }
    
    input[type="checkbox"]:hover {
        border-color: var(--nebula-primary);
        transform: scale(1.1);
    }
    
    /* Button hover effects */
    button {
        transition: all 0.2s ease;
    }
    
    button:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }
    
    button:active {
        transform: translateY(0);
    }
    
    /* Select styling */
    select {
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23666"><path d="M7 10l5 5 5-5H7z"/></svg>');
        background-repeat: no-repeat;
        background-position: right 8px center;
        background-size: 16px;
        padding-right: 32px;
    }
    
    /* Smooth transitions for all interactive elements */
    .nav-item, .theme-card, .wallpaper-type, .settings-section {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    /* Drag and drop styling */
    .drag-over {
        outline: 2px dashed var(--nebula-primary) !important;
        outline-offset: 4px !important;
        background: rgba(102, 126, 234, 0.05) !important;
    }
`;

if (!document.getElementById('settings-styles')) {
    settingsCSS.id = 'settings-styles';
    document.head.appendChild(settingsCSS);
}

// Auto-load theme on startup (call this from renderer.js)
if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('DOMContentLoaded', () => {
        // Small delay to ensure WindowManager is ready
        setTimeout(() => {
            NebulaSettings.autoLoadSavedTheme();
        }, 100);
    });
}

// Make NebulaSettings available globally
window.NebulaSettings = NebulaSettings;