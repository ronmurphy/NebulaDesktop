// Settings Modal Controller - Handles UI interactions and settings persistence

class SettingsModal {
    constructor() {
        this.modal = null;
        this.currentTab = 'appearance';
        this.pendingSettings = {};
    }

    init() {
        // Setup immediately since HTML is already loaded when init() is called
        this.setupModal();
        this.setupTabs();
        this.setupThemeGrid();
        this.loadCurrentSettings();
        this.setupEventListeners();

        console.log('SettingsModal fully initialized');
    }

    setupModal() {
        this.modal = document.getElementById('settings-modal');
        console.log('Settings modal setup - found modal:', !!this.modal);
        if (!this.modal) {
            console.error('Settings modal element not found! Make sure settings-modal.html loaded correctly.');
        }
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

        // Background
        this.setInputValue('setting-background-type', settings.backgroundType);
        this.switchBackgroundType(settings.backgroundType); // Show correct options
        this.setInputValue('setting-background-color', settings.backgroundColor);
        this.setInputValue('setting-background-opacity', settings.backgroundOpacity * 100);
        this.updateRangeDisplay('bg-opacity-value', Math.round(settings.backgroundOpacity * 100));

        // Parse gradient if it exists
        if (settings.backgroundGradient) {
            const gradientMatch = settings.backgroundGradient.match(/linear-gradient\((\d+)deg, (#[a-fA-F0-9]{6}) 0%, (#[a-fA-F0-9]{6}) 100%\)/);
            if (gradientMatch) {
                this.setInputValue('setting-gradient-angle', gradientMatch[1]);
                this.updateRangeDisplay('gradient-angle-value', gradientMatch[1]);
                this.setInputValue('setting-gradient-start', gradientMatch[2]);
                this.setInputValue('setting-gradient-end', gradientMatch[3]);
            }
        }

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

        // Background type selector
        const bgTypeSelect = document.getElementById('setting-background-type');
        if (bgTypeSelect) {
            bgTypeSelect.addEventListener('change', (e) => {
                this.switchBackgroundType(e.target.value);
            });
        }

        // Background opacity slider
        const bgOpacitySlider = document.getElementById('setting-background-opacity');
        if (bgOpacitySlider) {
            bgOpacitySlider.addEventListener('input', (e) => {
                this.updateRangeDisplay('bg-opacity-value', e.target.value);
            });
        }

        // Gradient angle slider
        const gradientAngleSlider = document.getElementById('setting-gradient-angle');
        if (gradientAngleSlider) {
            gradientAngleSlider.addEventListener('input', (e) => {
                this.updateRangeDisplay('gradient-angle-value', e.target.value);
            });
        }

        // Background image browse button
        const browseImageBtn = document.getElementById('browse-background-image');
        if (browseImageBtn) {
            browseImageBtn.addEventListener('click', () => {
                this.browseBackgroundImage();
            });
        }

        // Background video browse button
        const browseVideoBtn = document.getElementById('browse-background-video');
        if (browseVideoBtn) {
            browseVideoBtn.addEventListener('click', () => {
                this.browseBackgroundVideo();
            });
        }

        // Wallpaper presets
        const presetItems = document.querySelectorAll('.preset-item');
        presetItems.forEach(item => {
            item.addEventListener('click', () => {
                this.applyWallpaperPreset(item.dataset.preset);
            });
        });

        // Close on overlay click
        const overlay = document.querySelector('.settings-overlay');
        if (overlay) {
            overlay.addEventListener('click', () => {
                this.close();
            });
        }
    }

    open() {
        // Re-find modal element in case it wasn't available during init
        if (!this.modal) {
            this.modal = document.getElementById('settings-modal');
            console.log('Re-finding modal on open:', !!this.modal);
        }

        if (this.modal) {
            this.modal.classList.remove('hidden');
            this.loadCurrentSettings();
            this.pendingSettings = {};
            console.log('Settings modal opened successfully');
        } else {
            console.error('Cannot open settings - modal element still not found!');
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

            // Background
            backgroundType: document.getElementById('setting-background-type').value,
            backgroundColor: document.getElementById('setting-background-color').value,
            backgroundImage: this.pendingSettings.backgroundImage || window.settingsManager.get('backgroundImage'),
            backgroundVideo: this.pendingSettings.backgroundVideo || window.settingsManager.get('backgroundVideo'),
            backgroundOpacity: parseInt(document.getElementById('setting-background-opacity')?.value || 100) / 100,
            backgroundGradient: this.pendingSettings.backgroundGradient || this.buildGradient(),

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

        // Apply background
        this.applyBackground(settings);
    }

    switchBackgroundType(type) {
        // Hide all background options
        document.querySelectorAll('.background-option').forEach(option => {
            option.style.display = 'none';
        });

        // Show selected background type option
        const selectedOption = document.querySelector(`.background-option[data-background-type="${type}"]`);
        if (selectedOption) {
            selectedOption.style.display = 'block';
        }
    }

    browseBackgroundImage() {
        if (window.fileAPI) {
            window.fileAPI.selectFile(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp']).then(filePath => {
                if (filePath) {
                    document.getElementById('background-image-name').textContent = filePath.split('/').pop();
                    this.pendingSettings.backgroundImage = filePath;
                    // Preview immediately
                    this.applyBackgroundImage(filePath);
                }
            });
        } else {
            alert('File selection not available. Please ensure the app is running in Electron.');
        }
    }

    browseBackgroundVideo() {
        if (window.fileAPI) {
            window.fileAPI.selectFile(['mp4', 'webm', 'ogg']).then(filePath => {
                if (filePath) {
                    document.getElementById('background-video-name').textContent = filePath.split('/').pop();
                    this.pendingSettings.backgroundVideo = filePath;
                    // Preview immediately
                    this.applyBackgroundVideo(filePath);
                }
            });
        } else {
            alert('File selection not available. Please ensure the app is running in Electron.');
        }
    }

    applyWallpaperPreset(presetName) {
        const presets = {
            space: 'linear-gradient(135deg, #0a0a2e 0%, #16213e 50%, #1a1a2e 100%)',
            matrix: 'linear-gradient(135deg, #001a00 0%, #003300 100%)',
            cyberpunk: 'linear-gradient(135deg, #ff00ff 0%, #00ffff 100%)',
            sunset: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)'
        };

        const bg = document.getElementById('terminal-background');
        if (bg && presets[presetName]) {
            bg.style.background = presets[presetName];
            bg.style.opacity = '0.3';
            bg.className = 'gradient';

            // Update UI
            document.querySelectorAll('.preset-item').forEach(item => {
                item.classList.toggle('active', item.dataset.preset === presetName);
            });

            // Store preset as gradient
            document.getElementById('setting-background-type').value = 'gradient';
            this.switchBackgroundType('gradient');
            this.pendingSettings.backgroundType = 'gradient';
            this.pendingSettings.backgroundGradient = presets[presetName];
        }
    }

    applyBackground(settings) {
        const bg = document.getElementById('terminal-background');
        if (!bg) return;

        // Clear previous background
        bg.innerHTML = '';
        bg.style.background = '';
        bg.className = '';

        switch (settings.backgroundType) {
            case 'solid':
                bg.style.backgroundColor = settings.backgroundColor;
                break;

            case 'image':
                if (settings.backgroundImage) {
                    this.applyBackgroundImage(settings.backgroundImage, settings.backgroundOpacity);
                }
                break;

            case 'gradient':
                bg.style.background = settings.backgroundGradient;
                bg.className = 'gradient';
                bg.style.opacity = '0.3';
                break;

            case 'video':
                if (settings.backgroundVideo) {
                    this.applyBackgroundVideo(settings.backgroundVideo);
                }
                break;
        }
    }

    applyBackgroundImage(imagePath, opacity = 1.0) {
        const bg = document.getElementById('terminal-background');
        if (!bg) return;

        bg.style.backgroundImage = `url("file://${imagePath}")`;
        bg.style.opacity = opacity;
        bg.className = '';
    }

    applyBackgroundVideo(videoPath) {
        const bg = document.getElementById('terminal-background');
        if (!bg) return;

        bg.innerHTML = `<video autoplay loop muted style="width: 100%; height: 100%; object-fit: cover;">
            <source src="file://${videoPath}" type="video/mp4">
        </video>`;
        bg.style.opacity = '0.3';
    }

    buildGradient() {
        const start = document.getElementById('setting-gradient-start')?.value || '#1a1a1a';
        const end = document.getElementById('setting-gradient-end')?.value || '#2d2d2d';
        const angle = document.getElementById('setting-gradient-angle')?.value || '135';
        return `linear-gradient(${angle}deg, ${start} 0%, ${end} 100%)`;
    }
}

// Global functions called from HTML
function openSettings() {
    console.log('openSettings() called');
    console.log('settingsModal exists:', !!window.settingsModal);
    console.log('modal element:', document.getElementById('settings-modal'));

    if (window.settingsModal) {
        window.settingsModal.open();
    } else {
        console.error('settingsModal not initialized!');
        // Try to initialize it
        if (window.SettingsModal) {
            window.settingsModal = new SettingsModal();
            window.settingsModal.init();
            setTimeout(() => window.settingsModal.open(), 500);
        }
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

// Export SettingsModal to window so it can be accessed globally
window.SettingsModal = SettingsModal;

// Note: SettingsModal will be initialized after settings-modal.html is loaded
// See initialization in index.html after fetch completes
