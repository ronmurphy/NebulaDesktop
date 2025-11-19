// Nebula Terminal - Real PTY Terminal with xterm.js
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
        // Create xterm.js terminal instance
        this.term = new Terminal({
            cursorBlink: true,
            cursorStyle: 'block',
            fontFamily: 'FiraCode Nerd Font Mono, Fira Code, JetBrains Mono, Cascadia Code, SF Mono, Monaco, Consolas, monospace',
            fontSize: 14,
            lineHeight: 1.2,
            letterSpacing: 0,
            theme: {
                background: '#1a1a1a',
                foreground: '#00ff00',
                cursor: '#00ff00',
                cursorAccent: '#1a1a1a',
                selection: 'rgba(0, 255, 0, 0.3)',
                black: '#000000',
                red: '#ff6b6b',
                green: '#00ff00',
                yellow: '#ffeb3b',
                blue: '#66d9ef',
                magenta: '#f92672',
                cyan: '#a6e22e',
                white: '#f8f8f2',
                brightBlack: '#555555',
                brightRed: '#ff8787',
                brightGreen: '#5fff5f',
                brightYellow: '#ffff87',
                brightBlue: '#87d7ff',
                brightMagenta: '#ff87ff',
                brightCyan: '#87ffaf',
                brightWhite: '#ffffff'
            },
            scrollback: 10000,
            allowProposedApi: true
        });

        // Load addons
        this.fitAddon = new FitAddon.FitAddon();
        this.webLinksAddon = new WebLinksAddon.WebLinksAddon();
        this.searchAddon = new SearchAddon.SearchAddon();

        this.term.loadAddon(this.fitAddon);
        this.term.loadAddon(this.webLinksAddon);
        this.term.loadAddon(this.searchAddon);

        // Open terminal in DOM
        const container = document.getElementById('terminal-container');
        this.term.open(container);

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

            // Ctrl+Shift+Plus - Increase font size
            if (event.ctrlKey && event.shiftKey && event.key === '+') {
                const currentSize = this.term.options.fontSize;
                this.term.options.fontSize = currentSize + 1;
                this.fitAddon.fit();
                return false;
            }

            // Ctrl+Shift+Minus - Decrease font size
            if (event.ctrlKey && event.shiftKey && event.key === '_') {
                const currentSize = this.term.options.fontSize;
                if (currentSize > 8) {
                    this.term.options.fontSize = currentSize - 1;
                    this.fitAddon.fit();
                }
                return false;
            }

            // Ctrl+Shift+0 - Reset font size
            if (event.ctrlKey && event.shiftKey && event.key === ')') {
                this.term.options.fontSize = 14;
                this.fitAddon.fit();
                return false;
            }

            return true;
        });
    }

    async showWelcome() {
        const info = await window.terminal.info();

        // Show a minimal welcome that won't interfere with the shell
        this.term.write('\x1b[1;36m'); // Cyan bold
        this.term.write('Nebula Terminal v2.0');
        this.term.write('\x1b[0m'); // Reset
        this.term.write(' - Real PTY Terminal\r\n');
        this.term.write('\x1b[2m'); // Dim
        this.term.write(`${info.user}@${info.hostname} | ${info.shell}`);
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
