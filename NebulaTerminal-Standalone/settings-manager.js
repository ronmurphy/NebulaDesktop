// Settings Manager - Centralized configuration system
// Manages all terminal settings with localStorage persistence

class SettingsManager {
    constructor() {
        this.settings = this.loadSettings();
        this.listeners = new Map();
        this.defaultSettings = this.getDefaultSettings();
    }

    getDefaultSettings() {
        return {
            // Appearance
            theme: 'nebula-green',
            fontSize: 14,
            fontFamily: 'FiraCode Nerd Font Mono, Fira Code, JetBrains Mono, Consolas, monospace',
            fontLigatures: true,
            cursorStyle: 'block', // block, underline, bar
            cursorBlink: true,

            // Background
            backgroundType: 'solid', // solid, image, video, gradient
            backgroundColor: '#1a1a1a',
            backgroundImage: '',
            backgroundVideo: '',
            backgroundGradient: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
            backgroundBlur: 0,
            backgroundOpacity: 1.0,

            // Transparency
            windowOpacity: 1.0,
            useAcrylic: false,
            acrylicBlur: 20,

            // Shell
            shell: '', // empty = auto-detect
            shellArgs: [],

            // Tabs
            showTabBar: true,
            tabPosition: 'top', // top, bottom, left, right
            enableSplitPanes: true,

            // File Navigation
            showQuickNav: true,
            showBreadcrumbs: true,
            fileIconsEnabled: true,

            // Behavior
            scrollback: 10000,
            bellStyle: 'sound', // none, sound, visual
            copyOnSelect: false,
            pasteOnRightClick: true,
            confirmBeforeClose: true,

            // Advanced
            enableCustomCommands: true,
            enableInlineRendering: true,
            enableWebGL: false,
            gpuAcceleration: true,

            // Prompt
            customPrompt: '',
            promptStyle: 'default', // default, minimal, starship, custom

            // Keybindings
            keybindings: {
                newTab: 'Ctrl+Shift+T',
                closeTab: 'Ctrl+Shift+W',
                nextTab: 'Ctrl+Tab',
                prevTab: 'Ctrl+Shift+Tab',
                splitHorizontal: 'Ctrl+Shift+H',
                splitVertical: 'Ctrl+Shift+V',
                settings: 'Ctrl+,',
                commandPalette: 'Ctrl+Shift+P'
            }
        };
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('nebula-terminal-settings');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Merge with defaults to handle new settings
                return { ...this.getDefaultSettings(), ...parsed };
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
        return this.getDefaultSettings();
    }

    saveSettings() {
        try {
            localStorage.setItem('nebula-terminal-settings', JSON.stringify(this.settings));
            return true;
        } catch (error) {
            console.error('Failed to save settings:', error);
            return false;
        }
    }

    get(key) {
        return this.settings[key];
    }

    set(key, value) {
        const oldValue = this.settings[key];
        this.settings[key] = value;
        this.saveSettings();
        this.notifyListeners(key, value, oldValue);
    }

    setMultiple(updates) {
        Object.entries(updates).forEach(([key, value]) => {
            this.settings[key] = value;
        });
        this.saveSettings();
        // Notify about all changes
        Object.entries(updates).forEach(([key, value]) => {
            this.notifyListeners(key, value, this.settings[key]);
        });
    }

    reset() {
        this.settings = this.getDefaultSettings();
        this.saveSettings();
        this.notifyListeners('*', this.settings, {});
    }

    resetKey(key) {
        const defaultValue = this.defaultSettings[key];
        this.set(key, defaultValue);
    }

    // Event system for settings changes
    on(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, []);
        }
        this.listeners.get(key).push(callback);
    }

    off(key, callback) {
        if (this.listeners.has(key)) {
            const callbacks = this.listeners.get(key);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    notifyListeners(key, newValue, oldValue) {
        // Notify specific key listeners
        if (this.listeners.has(key)) {
            this.listeners.get(key).forEach(callback => {
                callback(newValue, oldValue);
            });
        }
        // Notify wildcard listeners
        if (this.listeners.has('*')) {
            this.listeners.get('*').forEach(callback => {
                callback(key, newValue, oldValue);
            });
        }
    }

    // Export/Import
    export() {
        return JSON.stringify(this.settings, null, 2);
    }

    import(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            this.settings = { ...this.getDefaultSettings(), ...imported };
            this.saveSettings();
            this.notifyListeners('*', this.settings, {});
            return true;
        } catch (error) {
            console.error('Failed to import settings:', error);
            return false;
        }
    }
}

// Global settings instance
window.settingsManager = new SettingsManager();
