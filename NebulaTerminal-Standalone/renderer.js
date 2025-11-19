// Nebula Terminal - Real PTY Terminal with xterm.js + Settings Integration
// This provides a true terminal experience with support for interactive apps

class NebulaTerminalRenderer {
    constructor() {
        this.term = null;
        this.fitAddon = null;
        this.webLinksAddon = null;
        this.searchAddon = null;
        this.init();
    }

    async init() {
        // Load settings
        const settings = window.settingsManager.settings;

        // Create xterm.js terminal instance with settings
        this.term = new Terminal({
            cursorBlink: settings.cursorBlink,
            cursorStyle: settings.cursorStyle,
            fontFamily: settings.fontFamily,
            fontSize: settings.fontSize,
            lineHeight: 1.2,
            letterSpacing: 0,
            theme: {}, // Will be set by theme engine
            scrollback: settings.scrollback,
            allowProposedApi: true
        });

        // Expose terminal globally for settings modal
        window.terminalInstance = this.term;

        // Load addons
        this.fitAddon = new FitAddon.FitAddon();
        this.webLinksAddon = new WebLinksAddon.WebLinksAddon();
        this.searchAddon = new SearchAddon.SearchAddon();

        this.term.loadAddon(this.fitAddon);
        this.term.loadAddon(this.webLinksAddon);
        this.term.loadAddon(this.searchAddon);

        // Expose fitAddon globally
        window.fitAddon = this.fitAddon;

        // Apply theme from settings
        window.themeEngine.applyTheme(this.term, settings.theme);

        // Open terminal in DOM
        const container = document.getElementById('terminal-container');
        this.term.open(container);

        // Apply window opacity
        if (settings.windowOpacity < 1.0) {
            document.body.style.opacity = settings.windowOpacity;
        }

        // Apply background blur
        if (settings.backgroundBlur > 0) {
            container.style.backdropFilter = `blur(${settings.backgroundBlur}px)`;
        }

        // Apply background (if settingsModal exists)
        if (window.settingsModal && window.settingsModal.applyBackground) {
            window.settingsModal.applyBackground(settings);
        }

        // Fit terminal to window
        this.fitAddon.fit();

        // Setup resize handler
        window.addEventListener('resize', () => {
            this.fitAddon.fit();
            // Notify backend about size change
            window.terminal.resize(this.term.cols, this.term.rows);
        });

        // Create PTY with current terminal size
        const ptyInfo = await window.terminal.create({
            cols: this.term.cols,
            rows: this.term.rows
        });

        console.log('PTY created:', ptyInfo);

        // Connect terminal to PTY
        this.connectToPTY();

        // Setup menu event listeners
        this.setupMenuListeners();

        // Show welcome message
        this.showWelcome();
    }

    connectToPTY() {
        // Send input to PTY
        this.term.onData((data) => {
            window.terminal.write(data);
        });

        // Receive output from PTY
        window.terminal.onData((data) => {
            this.term.write(data);
        });

        // Handle terminal exit
        window.terminal.onExit(({ exitCode, signal }) => {
            console.log('Terminal exited:', { exitCode, signal });
            this.term.write('\r\n\r\n');
            this.term.write('\x1b[1;31m'); // Red bold
            this.term.write('Terminal session ended.');
            this.term.write('\x1b[0m'); // Reset
            this.term.write('\r\n');
            this.term.write('Press any key to close...');

            // Close window on next keypress
            const disposable = this.term.onKey(() => {
                disposable.dispose();
                window.close();
            });
        });

        // Handle Ctrl+Shift shortcuts
        this.term.attachCustomKeyEventHandler((event) => {
            // Ctrl+Shift+C - Copy
            if (event.ctrlKey && event.shiftKey && event.key === 'C') {
                const selection = this.term.getSelection();
                if (selection) {
                    navigator.clipboard.writeText(selection);
                    return false;
                }
            }

            // Ctrl+Shift+V - Paste
            if (event.ctrlKey && event.shiftKey && event.key === 'V') {
                navigator.clipboard.readText().then((text) => {
                    window.terminal.write(text);
                });
                return false;
            }

            // Ctrl+Shift+F - Search
            if (event.ctrlKey && event.shiftKey && event.key === 'F') {
                this.openSearch();
                return false;
            }

            // Ctrl+, - Open Settings
            if (event.ctrlKey && event.key === ',') {
                openSettings();
                return false;
            }

            // Ctrl+Shift+Plus - Increase font size
            if (event.ctrlKey && (event.key === '+' || event.key === '=')) {
                this.increaseFontSize();
                return false;
            }

            // Ctrl+Minus - Decrease font size
            if (event.ctrlKey && event.key === '-') {
                this.decreaseFontSize();
                return false;
            }

            // Ctrl+0 - Reset font size
            if (event.ctrlKey && event.key === '0') {
                this.resetFontSize();
                return false;
            }

            return true;
        });
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
                this.increaseFontSize();
            });

            window.menuEvents.onFontDecrease(() => {
                console.log('Menu event: Font Decrease');
                this.decreaseFontSize();
            });

            window.menuEvents.onFontReset(() => {
                console.log('Menu event: Font Reset');
                this.resetFontSize();
            });

            window.menuEvents.onAbout(() => {
                console.log('Menu event: About');
                openSettings();
                // Switch to about tab after modal loads
                setTimeout(() => {
                    const aboutTab = document.querySelector('[data-tab="about"]');
                    if (aboutTab) aboutTab.click();
                }, 200);
            });
        } else {
            console.warn('menuEvents API not available - menu shortcuts will not work');
        }
    }

    handleCopy() {
        const selection = this.term.getSelection();
        if (selection) {
            navigator.clipboard.writeText(selection);
        }
    }

    handlePaste() {
        navigator.clipboard.readText().then((text) => {
            window.terminal.write(text);
        });
    }

    increaseFontSize() {
        const currentSize = this.term.options.fontSize;
        this.term.options.fontSize = Math.min(currentSize + 1, 32);
        this.fitAddon.fit();
        // Update settings
        window.settingsManager.set('fontSize', this.term.options.fontSize);
    }

    decreaseFontSize() {
        const currentSize = this.term.options.fontSize;
        this.term.options.fontSize = Math.max(currentSize - 1, 8);
        this.fitAddon.fit();
        // Update settings
        window.settingsManager.set('fontSize', this.term.options.fontSize);
    }

    resetFontSize() {
        this.term.options.fontSize = 14;
        this.fitAddon.fit();
        // Update settings
        window.settingsManager.set('fontSize', 14);
    }

    async showWelcome() {
        const info = await window.terminal.info();

        // Show a minimal welcome that won't interfere with the shell
        this.term.write('\x1b[1;36m'); // Cyan bold
        this.term.write('Nebula Terminal v3.0');
        this.term.write('\x1b[0m'); // Reset
        this.term.write(' - Ultimate Edition\r\n');
        this.term.write('\x1b[2m'); // Dim
        this.term.write(`${info.user}@${info.hostname} | ${info.shell}`);
        this.term.write('\x1b[0m'); // Reset
        this.term.write('\r\n');
        this.term.write('\x1b[2m'); // Dim
        this.term.write('Press Ctrl+, for Settings');
        this.term.write('\x1b[0m'); // Reset
        this.term.write('\r\n\r\n');
    }

    openSearch() {
        // Simple search implementation
        const searchTerm = prompt('Search for:');
        if (searchTerm) {
            const found = this.searchAddon.findNext(searchTerm, {
                incremental: false,
                caseSensitive: false
            });
            if (!found) {
                alert('No matches found');
            }
        }
    }
}

// Initialize terminal when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    new NebulaTerminalRenderer();
});
