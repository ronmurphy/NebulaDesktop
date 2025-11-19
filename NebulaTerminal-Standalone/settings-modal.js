// Settings Modal Controller - Handles UI interactions and settings persistence

class SettingsModal {
    constructor() {
        this.modal = null;
        this.currentTab = 'appearance';
        this.pendingSettings = {};
    }

    init() {
        // Modal will be initialized when DOM is ready
        document.addEventListener('DOMContentLoaded', () => {
            this.setupModal();
            this.setupTabs();
            this.setupThemeGrid();
            this.loadCurrentSettings();
            this.setupEventListeners();
        });
    }

    setupModal() {
        this.modal = document.getElementById('settings-modal');
    }

    setupTabs() {
        const tabs = document.querySelectorAll('.settings-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchTab(tab.dataset.tab);
            });
        });
    }

    switchTab(tabName) {
        this.currentTab = tabName;

        // Update tab buttons
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update panels
        document.querySelectorAll('.settings-panel').forEach(panel => {
            panel.classList.toggle('active', panel.dataset.panel === tabName);
        });
    }

    setupThemeGrid() {
        const themeGrid = document.getElementById('theme-grid');
        if (!themeGrid) return;

        const themes = window.themeEngine.getAllThemes();
        const currentTheme = window.settingsManager.get('theme');

        themeGrid.innerHTML = '';

        themes.forEach(theme => {
            const card = document.createElement('div');
            card.className = `theme-card ${theme.id === currentTheme ? 'active' : ''}`;
            card.dataset.themeId = theme.id;

            const preview = document.createElement('div');
            preview.className = 'theme-preview';
            preview.style.background = theme.background;
            preview.style.color = theme.foreground;
            preview.innerHTML = `<span style="color: ${theme.green}">$</span> <span style="color: ${theme.blue}">ls</span> <span style="color: ${theme.cyan}">-la</span>`;

            const name = document.createElement('div');
            name.className = 'theme-name';
            name.textContent = theme.name;

            const author = document.createElement('div');
            author.className = 'theme-author';
            author.textContent = `by ${theme.author}`;

            card.appendChild(preview);
            card.appendChild(name);
            card.appendChild(author);

            card.addEventListener('click', () => {
                this.selectTheme(theme.id);
            });

            themeGrid.appendChild(card);
        });
    }

    selectTheme(themeId) {
        // Update UI
        document.querySelectorAll('.theme-card').forEach(card => {
            card.classList.toggle('active', card.dataset.themeId === themeId);
        });

        // Apply theme immediately for preview
        if (window.terminalInstance) {
            window.themeEngine.applyTheme(window.terminalInstance, themeId);
        }

        // Store in pending settings
        this.pendingSettings.theme = themeId;
    }

    loadCurrentSettings() {
        // Load all settings from settingsManager into UI
        const settings = window.settingsManager.settings;

        // Font
        this.setInputValue('setting-font-family', settings.fontFamily);
        this.setInputValue('setting-font-size', settings.fontSize);
        this.updateRangeDisplay('font-size-value', settings.fontSize);
        this.setInputValue('setting-font-ligatures', settings.fontLigatures);

        // Cursor
        this.setInputValue('setting-cursor-style', settings.cursorStyle);
        this.setInputValue('setting-cursor-blink', settings.cursorBlink);

        // Transparency
        this.setInputValue('setting-opacity', settings.windowOpacity * 100);
        this.updateRangeDisplay('opacity-value', Math.round(settings.windowOpacity * 100));
        this.setInputValue('setting-blur', settings.backgroundBlur);
        this.updateRangeDisplay('blur-value', settings.backgroundBlur);
        this.setInputValue('setting-acrylic', settings.useAcrylic);

        // Behavior
        this.setInputValue('setting-copy-on-select', settings.copyOnSelect);
        this.setInputValue('setting-paste-on-right-click', settings.pasteOnRightClick);
        this.setInputValue('setting-bell-style', settings.bellStyle);
        this.setInputValue('setting-scrollback', settings.scrollback);
        this.setInputValue('setting-confirm-close', settings.confirmBeforeClose);

        // Advanced
        this.setInputValue('setting-gpu-acceleration', settings.gpuAcceleration);
        this.setInputValue('setting-webgl', settings.enableWebGL);
        this.setInputValue('setting-custom-commands', settings.enableCustomCommands);
        this.setInputValue('setting-inline-rendering', settings.enableInlineRendering);
    }

    setInputValue(id, value) {
        const element = document.getElementById(id);
        if (!element) return;

        if (element.type === 'checkbox') {
            element.checked = value;
        } else if (element.type === 'range' || element.type === 'number') {
            element.value = value;
        } else {
            element.value = value;
        }
    }

    updateRangeDisplay(displayId, value) {
        const display = document.getElementById(displayId);
        if (display) {
            display.textContent = value;
        }
    }

    setupEventListeners() {
        // Font size slider
        const fontSizeSlider = document.getElementById('setting-font-size');
        if (fontSizeSlider) {
            fontSizeSlider.addEventListener('input', (e) => {
                this.updateRangeDisplay('font-size-value', e.target.value);
            });
        }

        // Opacity slider
        const opacitySlider = document.getElementById('setting-opacity');
        if (opacitySlider) {
            opacitySlider.addEventListener('input', (e) => {
                this.updateRangeDisplay('opacity-value', e.target.value);
            });
        }

        // Blur slider
        const blurSlider = document.getElementById('setting-blur');
        if (blurSlider) {
            blurSlider.addEventListener('input', (e) => {
                this.updateRangeDisplay('blur-value', e.target.value);
            });
        }

        // Close on overlay click
        const overlay = document.querySelector('.settings-overlay');
        if (overlay) {
            overlay.addEventListener('click', () => {
                this.close();
            });
        }
    }

    open() {
        if (this.modal) {
            this.modal.classList.remove('hidden');
            this.loadCurrentSettings();
            this.pendingSettings = {};
        }
    }

    close() {
        if (this.modal) {
            this.modal.classList.add('hidden');
            // Revert any unsaved changes
            if (Object.keys(this.pendingSettings).length > 0) {
                // Reload current theme if it was changed
                if (this.pendingSettings.theme) {
                    const currentTheme = window.settingsManager.get('theme');
                    if (window.terminalInstance) {
                        window.themeEngine.applyTheme(window.terminalInstance, currentTheme);
                    }
                }
            }
            this.pendingSettings = {};
        }
    }

    save() {
        // Collect all settings from UI
        const newSettings = {
            // Appearance
            theme: this.pendingSettings.theme || window.settingsManager.get('theme'),
            fontSize: parseInt(document.getElementById('setting-font-size').value),
            fontFamily: document.getElementById('setting-font-family').value,
            fontLigatures: document.getElementById('setting-font-ligatures').checked,
            cursorStyle: document.getElementById('setting-cursor-style').value,
            cursorBlink: document.getElementById('setting-cursor-blink').checked,

            // Transparency
            windowOpacity: parseInt(document.getElementById('setting-opacity').value) / 100,
            backgroundBlur: parseInt(document.getElementById('setting-blur').value),
            useAcrylic: document.getElementById('setting-acrylic').checked,

            // Behavior
            copyOnSelect: document.getElementById('setting-copy-on-select').checked,
            pasteOnRightClick: document.getElementById('setting-paste-on-right-click').checked,
            bellStyle: document.getElementById('setting-bell-style').value,
            scrollback: parseInt(document.getElementById('setting-scrollback').value),
            confirmBeforeClose: document.getElementById('setting-confirm-close').checked,

            // Advanced
            gpuAcceleration: document.getElementById('setting-gpu-acceleration').checked,
            enableWebGL: document.getElementById('setting-webgl').checked,
            enableCustomCommands: document.getElementById('setting-custom-commands').checked,
            enableInlineRendering: document.getElementById('setting-inline-rendering').checked
        };

        // Save to settingsManager
        window.settingsManager.setMultiple(newSettings);

        // Apply settings to terminal
        this.applySettings(newSettings);

        // Close modal
        this.close();
    }

    applySettings(settings) {
        if (!window.terminalInstance) return;

        const term = window.terminalInstance;

        // Apply theme
        window.themeEngine.applyTheme(term, settings.theme);

        // Apply font settings
        term.options.fontSize = settings.fontSize;
        term.options.fontFamily = settings.fontFamily;

        // Apply cursor settings
        term.options.cursorStyle = settings.cursorStyle;
        term.options.cursorBlink = settings.cursorBlink;

        // Apply scrollback
        term.options.scrollback = settings.scrollback;

        // Refresh terminal
        if (window.fitAddon) {
            window.fitAddon.fit();
        }

        // Apply window opacity
        document.body.style.opacity = settings.windowOpacity;

        // Apply blur effect
        if (settings.backgroundBlur > 0) {
            document.getElementById('terminal-container').style.backdropFilter = `blur(${settings.backgroundBlur}px)`;
        } else {
            document.getElementById('terminal-container').style.backdropFilter = 'none';
        }
    }
}

// Global functions called from HTML
function openSettings() {
    if (window.settingsModal) {
        window.settingsModal.open();
    }
}

function closeSettings() {
    if (window.settingsModal) {
        window.settingsModal.close();
    }
}

function saveSettings() {
    if (window.settingsModal) {
        window.settingsModal.save();
    }
}

function resetSettings() {
    if (confirm('Reset all settings to defaults? This cannot be undone.')) {
        window.settingsManager.reset();
        if (window.settingsModal) {
            window.settingsModal.loadCurrentSettings();
            window.settingsModal.setupThemeGrid();
        }
        if (window.terminalInstance) {
            const settings = window.settingsManager.settings;
            window.settingsModal.applySettings(settings);
        }
    }
}

function exportSettings() {
    const json = window.settingsManager.export();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nebula-terminal-settings.json';
    a.click();
    URL.revokeObjectURL(url);
}

function importSettings() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const success = window.settingsManager.import(event.target.result);
                if (success) {
                    alert('Settings imported successfully!');
                    if (window.settingsModal) {
                        window.settingsModal.loadCurrentSettings();
                        window.settingsModal.setupThemeGrid();
                    }
                } else {
                    alert('Failed to import settings. Invalid file format.');
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

function openExternal(url) {
    // This will be called from the about page
    console.log('Open external:', url);
}

// Initialize settings modal when loaded
window.settingsModal = new SettingsModal();
window.settingsModal.init();
