// Nebula Terminal - Real PTY Terminal with xterm.js + Tab Management + Settings Integration
// This provides a true terminal experience with multiple tabs and advanced customization

class NebulaTerminalRenderer {
    constructor() {
        this.tabManager = null;
        this.init();
    }

    async init() {
        // Load settings
        const settings = window.settingsManager.settings;

        // Apply window-level settings
        this.applyWindowSettings(settings);

        // Initialize tab manager
        this.tabManager = new TabManager();
        this.tabManager.init();

        // Expose globally
        window.tabManager = this.tabManager;

        // Setup menu event listeners
        this.setupMenuListeners();

        console.log('Nebula Terminal initialized with tab support');
    }

    applyWindowSettings(settings) {
        // Apply window opacity
        if (settings.windowOpacity < 1.0) {
            document.body.style.opacity = settings.windowOpacity;
        }

        // Apply background blur to tabs container
        const tabsContainer = document.getElementById('tabs-container');
        if (tabsContainer && settings.backgroundBlur > 0) {
            tabsContainer.style.backdropFilter = `blur(${settings.backgroundBlur}px)`;
        }

        // Apply background (if settingsModal exists)
        setTimeout(() => {
            if (window.settingsModal && window.settingsModal.applyBackground) {
                window.settingsModal.applyBackground(settings);
            }
        }, 100);
    }

    setupMenuListeners() {
        // Listen for menu events via the menuEvents API exposed by preload
        if (window.menuEvents) {
            window.menuEvents.onOpenSettings(() => {
                console.log('Menu event: Open Settings');
                openSettings();
            });

            window.menuEvents.onThemeSwitcher(() => {
                console.log('Menu event: Theme Switcher');
                openSettings();
            });

            window.menuEvents.onCopy(() => {
                console.log('Menu event: Copy');
                this.handleCopy();
            });

            window.menuEvents.onPaste(() => {
                console.log('Menu event: Paste');
                this.handlePaste();
            });

            window.menuEvents.onFind(() => {
                console.log('Menu event: Find');
                this.openSearch();
            });

            window.menuEvents.onFontIncrease(() => {
                console.log('Menu event: Font Increase');
                this.tabManager.increaseFontSize();
            });

            window.menuEvents.onFontDecrease(() => {
                console.log('Menu event: Font Decrease');
                this.tabManager.decreaseFontSize();
            });

            window.menuEvents.onFontReset(() => {
                console.log('Menu event: Font Reset');
                this.tabManager.resetFontSize();
            });

            window.menuEvents.onAbout(() => {
                console.log('Menu event: About');
                this.showAbout();
            });
        }
    }

    handleCopy() {
        const activeTab = this.tabManager.getActiveTab();
        if (activeTab) {
            const selection = activeTab.term.getSelection();
            if (selection) {
                navigator.clipboard.writeText(selection);
                console.log('Copied to clipboard');
            }
        }
    }

    handlePaste() {
        const activeTab = this.tabManager.getActiveTab();
        if (activeTab) {
            navigator.clipboard.readText().then((text) => {
                window.terminal.write(activeTab.ptyId, text);
            });
        }
    }

    openSearch() {
        const activeTab = this.tabManager.getActiveTab();
        if (activeTab && activeTab.searchAddon) {
            // TODO: Implement search UI
            console.log('Search feature - to be implemented');
        }
    }

    showAbout() {
        alert(`Nebula Terminal v3.0 - Ultimate Edition

The most customizable terminal for Linux ricers!

Features:
✨ 12 Professional Themes
🎨 Custom Backgrounds & Transparency
📑 Multiple Tabs with Drag-and-Drop
⚡ Real PTY Support
🔤 Multiple Font Options
💎 Glassmorphism Effects

Built with love using Electron & xterm.js`);
    }
}

// Initialize when DOM is ready
const renderer = new NebulaTerminalRenderer();
