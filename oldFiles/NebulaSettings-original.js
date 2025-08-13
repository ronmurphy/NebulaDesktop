// NebulaSettings.js - Standalone Settings Application
class NebulaSettings {
    constructor() {
        this.windowId = null;
        this.currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        
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
            width: 700,
            height: 600,
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
            padding: 24px;
            overflow-y: auto;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        container.innerHTML = `
            <div class="settings-header" style="margin-bottom: 32px;">
                <h1 style="color: var(--nebula-text-primary); font-size: 28px; font-weight: 700; margin: 0; display: flex; align-items: center; gap: 12px;">
                    <span class="material-symbols-outlined" style="font-size: 32px; background: linear-gradient(135deg, var(--nebula-primary), var(--nebula-secondary)); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;">settings</span>
                    Settings
                </h1>
                <p style="color: var(--nebula-text-secondary); margin: 8px 0 0 44px; font-size: 16px;">Customize your Nebula Desktop experience</p>
            </div>

            <!-- Appearance Settings -->
            <div class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: 12px; padding: 24px; margin-bottom: 20px;">
                <h2 style="color: var(--nebula-text-primary); margin: 0 0 20px 0; font-size: 20px; font-weight: 600; display: flex; align-items: center; gap: 10px;">
                    <span class="material-symbols-outlined" style="color: var(--nebula-primary);">palette</span>
                    Appearance
                </h2>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 500; color: var(--nebula-text-primary);">Theme</label>
                    <p style="color: var(--nebula-text-secondary); font-size: 14px; margin-bottom: 12px;">Choose your preferred color scheme</p>
                    <div class="theme-options" style="display: flex; gap: 12px; flex-wrap: wrap;">
                        <button class="theme-btn" data-theme="light" style="
                            background: linear-gradient(135deg, #ffffff, #f8fafc);
                            border: 2px solid ${this.currentTheme === 'light' ? 'var(--nebula-primary)' : 'var(--nebula-border)'};
                            color: #1e293b;
                            padding: 12px 20px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-weight: 500;
                            transition: all 0.2s ease;
                            min-width: 100px;
                        ">☀️ Light</button>
                        
                        <button class="theme-btn" data-theme="dark" style="
                            background: linear-gradient(135deg, #0f172a, #1e293b);
                            border: 2px solid ${this.currentTheme === 'dark' ? 'var(--nebula-primary)' : '#334155'};
                            color: #f8fafc;
                            padding: 12px 20px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-weight: 500;
                            transition: all 0.2s ease;
                            min-width: 100px;
                        ">🌙 Dark</button>
                        
                        <button class="theme-btn" data-theme="nebula-slate" style="
                            background: linear-gradient(135deg, #475569, #64748b);
                            border: 2px solid ${this.currentTheme === 'nebula-slate' ? 'var(--nebula-primary)' : '#334155'};
                            color: #f8fafc;
                            padding: 12px 20px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-weight: 500;
                            transition: all 0.2s ease;
                            min-width: 100px;
                        ">✨ Nebula</button>
                    </div>
                </div>
            </div>

            <!-- System Information -->
            <div class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: 12px; padding: 24px; margin-bottom: 20px;">
                <h2 style="color: var(--nebula-text-primary); margin: 0 0 20px 0; font-size: 20px; font-weight: 600; display: flex; align-items: center; gap: 10px;">
                    <span class="material-symbols-outlined" style="color: var(--nebula-primary);">info</span>
                    System Information
                </h2>
                
                <div class="system-info" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
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
                </div>
            </div>

            <!-- Storage & Data -->
            <div class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: 12px; padding: 24px; margin-bottom: 20px;">
                <h2 style="color: var(--nebula-text-primary); margin: 0 0 20px 0; font-size: 20px; font-weight: 600; display: flex; align-items: center; gap: 10px;">
                    <span class="material-symbols-outlined" style="color: var(--nebula-primary);">storage</span>
                    Storage & Data
                </h2>
                
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
                </div>
                
                <div style="display: flex; gap: 12px; flex-wrap: wrap;">
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
                    
                    <button id="exportSettingsBtn" style="
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
                </div>
            </div>

            <!-- Keyboard Shortcuts -->
            <div class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: 12px; padding: 24px; margin-bottom: 20px;">
                <h2 style="color: var(--nebula-text-primary); margin: 0 0 20px 0; font-size: 20px; font-weight: 600; display: flex; align-items: center; gap: 10px;">
                    <span class="material-symbols-outlined" style="color: var(--nebula-primary);">keyboard</span>
                    Keyboard Shortcuts
                </h2>
                
                <div class="shortcuts-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 12px;">
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
                </div>
            </div>

            <!-- About Section -->
            <div class="settings-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: 12px; padding: 24px;">
                <h2 style="color: var(--nebula-text-primary); margin: 0 0 20px 0; font-size: 20px; font-weight: 600; display: flex; align-items: center; gap: 10px;">
                    <span class="material-symbols-outlined" style="color: var(--nebula-primary);">help</span>
                    About
                </h2>
                
                <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">✨</div>
                    <h3 style="color: var(--nebula-text-primary); margin: 0 0 8px 0; font-size: 24px; font-weight: 700;">NebulaDesktop</h3>
                    <p style="color: var(--nebula-text-secondary); margin: 0 0 16px 0; font-size: 16px;">A modern, web-based desktop environment</p>
                    <p style="color: var(--nebula-text-secondary); font-size: 14px; line-height: 1.5;">
                        Built with Electron, featuring a ChromeOS-inspired interface with<br>
                        integrated window management, AI assistant, and powerful terminal.
                    </p>
                </div>
            </div>
        `;

        this.setupEventListeners(container);
        this.updateSystemInfo(container);

        return container;
    }
    
    /**
     * Set up all event listeners for the settings interface
     */
    setupEventListeners(container) {
        // Theme buttons
        const themeButtons = container.querySelectorAll('.theme-btn');
        themeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const newTheme = button.dataset.theme;
                this.switchTheme(newTheme);
                this.updateThemeButtons(container, newTheme);
            });
        });

        // Clear all data button
        const clearDataBtn = container.querySelector('#clearAllDataBtn');
        clearDataBtn.addEventListener('click', () => {
            this.clearAllData(container);
        });

        // Export settings button
        const exportBtn = container.querySelector('#exportSettingsBtn');
        exportBtn.addEventListener('click', () => {
            this.exportSettings();
        });

        // Refresh storage button
        const refreshStorageBtn = container.querySelector('#refreshStorageBtn');
        refreshStorageBtn.addEventListener('click', () => {
            this.updateStorageInfo(container);
        });
    }

    /**
     * Switch to a different theme
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
     * Update theme button states
     */
    updateThemeButtons(container, activeTheme) {
        const themeButtons = container.querySelectorAll('.theme-btn');
        themeButtons.forEach(button => {
            const isActive = button.dataset.theme === activeTheme;
            button.style.borderColor = isActive ? 'var(--nebula-primary)' : (
                button.dataset.theme === 'light' ? 'var(--nebula-border)' : '#334155'
            );
        });
        
        // Update theme display
        const themeDisplay = container.querySelector('#currentThemeDisplay');
        if (themeDisplay) {
            themeDisplay.textContent = activeTheme;
        }
    }

    /**
     * Clear all application data
     */
    clearAllData(container) {
        const confirmed = confirm(`Clear all application data?

This will remove:
• Theme preferences
• Window positions
• Application settings
• Cache and temporary data

This action cannot be undone.`);

        if (confirmed) {
            try {
                // Get all localStorage keys
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && (key.startsWith('nebula-') || key.startsWith('app-'))) {
                        keysToRemove.push(key);
                    }
                }
                
                // Remove all app data
                keysToRemove.forEach(key => {
                    localStorage.removeItem(key);
                });
                
                // Show success message
                alert(`Successfully cleared ${keysToRemove.length} data entries!`);
                
                // Update UI
                this.updateStorageInfo(container);
                
                console.log(`Cleared ${keysToRemove.length} localStorage entries`);
                
            } catch (error) {
                alert(`Error clearing data: ${error.message}`);
                console.error('Error clearing data:', error);
            }
        }
    }

    /**
     * Export settings as JSON
     */
    exportSettings() {
        try {
            const settings = {
                theme: this.currentTheme,
                version: 'NebulaDesktop v3.0',
                exportDate: new Date().toISOString(),
                preferences: {}
            };
            
            // Collect all nebula settings
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('nebula-')) {
                    try {
                        settings.preferences[key] = JSON.parse(localStorage.getItem(key));
                    } catch (e) {
                        settings.preferences[key] = localStorage.getItem(key);
                    }
                }
            }
            
            // Create download
            const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `nebula-settings-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            console.log('Settings exported successfully');
            
        } catch (error) {
            alert(`Error exporting settings: ${error.message}`);
            console.error('Error exporting settings:', error);
        }
    }

    /**
     * Update system information display
     */
    updateSystemInfo(container) {
        // Update platform info
        const platformInfo = container.querySelector('#platformInfo');
        if (platformInfo) {
            const platform = navigator.platform || 'Unknown';
            const userAgent = navigator.userAgent || '';
            let platformDisplay = platform;
            
            if (userAgent.includes('Electron')) {
                platformDisplay += ' (Electron)';
            } else if (userAgent.includes('Chrome')) {
                platformDisplay += ' (Chrome)';
            }
            
            platformInfo.textContent = platformDisplay;
        }

        // Update running apps count
        this.updateRunningAppsCount(container);
        
        // Update storage info
        this.updateStorageInfo(container);
    }

    /**
     * Update running apps count
     */
    updateRunningAppsCount(container) {
        const runningAppsElement = container.querySelector('#runningAppsCount');
        if (runningAppsElement) {
            if (window.windowManager && window.windowManager.getAllWindows) {
                const windows = window.windowManager.getAllWindows();
                runningAppsElement.textContent = `${windows.length} windows`;
            } else {
                runningAppsElement.textContent = 'Unknown';
            }
        }
    }

    /**
     * Update storage usage information
     */
    updateStorageInfo(container) {
        const storageElement = container.querySelector('#storageUsage');
        if (storageElement) {
            try {
                let totalSize = 0;
                let nebulaEntries = 0;
                
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    const value = localStorage.getItem(key);
                    const size = key.length + (value ? value.length : 0);
                    totalSize += size;
                    
                    if (key && key.startsWith('nebula-')) {
                        nebulaEntries++;
                    }
                }
                
                const sizeKB = (totalSize / 1024).toFixed(1);
                storageElement.textContent = `${sizeKB} KB used (${nebulaEntries} Nebula entries)`;
                
            } catch (error) {
                storageElement.textContent = 'Unable to calculate';
                console.warn('Error calculating storage usage:', error);
            }
        }
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
}

// Make NebulaSettings available globally
window.NebulaSettings = NebulaSettings;