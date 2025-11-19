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

        // Initialize layout manager
        this.layoutManager = new LayoutManager(this.tabManager);
        window.layoutManager = this.layoutManager;

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

            window.menuEvents.onNewTab(() => {
                console.log('Menu event: New Tab');
                this.tabManager.createTab();
            });

            window.menuEvents.onSaveLayout(() => {
                console.log('Menu event: Save Layout');
                this.handleSaveLayout();
            });

            window.menuEvents.onLoadLayout(() => {
                console.log('Menu event: Load Layout');
                this.handleLoadLayout();
            });

            window.menuEvents.onExportLayout(() => {
                console.log('Menu event: Export Layout');
                this.handleExportLayout();
            });

            window.menuEvents.onImportLayout(() => {
                console.log('Menu event: Import Layout');
                this.handleImportLayout();
            });
        }
    }

    handleCopy() {
        const activeTab = this.tabManager.getActiveTab();
        if (activeTab && activeTab.paneManager) {
            const activePane = activeTab.paneManager.getActivePane();
            if (activePane && activePane.term) {
                const selection = activePane.term.getSelection();
                if (selection) {
                    navigator.clipboard.writeText(selection);
                    console.log('Copied to clipboard:', selection.substring(0, 50));
                }
            }
        }
    }

    handlePaste() {
        const activeTab = this.tabManager.getActiveTab();
        if (activeTab && activeTab.paneManager) {
            const activePane = activeTab.paneManager.getActivePane();
            if (activePane && activePane.ptyId) {
                navigator.clipboard.readText().then((text) => {
                    window.terminal.write(activePane.ptyId, text);
                    console.log('Pasted from clipboard');
                });
            }
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
        alert(`Nebula Terminal v3.0 - Ultimate Developer Terminal

From rice terminal to THE ULTIMATE DEV TERMINAL!

Features:
✨ 12 Professional Themes
🎨 Custom Backgrounds & Transparency
📑 Multiple Tabs with Drag-and-Drop
⚡ Real PTY Support
🔤 Multiple Font Options
💎 Glassmorphism Effects
🪟 Split Panes with Draggable Dividers
🎨 Moveable Panes (Click-based)
🌐 Inline Utilities (Image, Editor, Monaco, Web Browser!)
💾 Layout Save/Load (Shareable JSON!)

Nebula Commands:
• nip <file> [--split] - Image viewer
• nie <file> [--split] - Text editor
• nid <file> [--split] - Monaco code editor
• niw <url> [--split] - Full web browser!

Built with love using Electron & xterm.js`);
    }

    handleSaveLayout() {
        const result = this.layoutManager.saveLayout();
        alert(result.message);
    }

    async handleLoadLayout() {
        const result = await this.layoutManager.loadLayout();
        alert(result.message);
    }

    async handleExportLayout() {
        const result = await this.layoutManager.exportLayout();
        alert(result.message);
    }

    async handleImportLayout() {
        const result = await this.layoutManager.importLayout();
        alert(result.message);
    }
}

// Initialize when DOM is ready
const renderer = new NebulaTerminalRenderer();
