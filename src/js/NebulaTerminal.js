// NebulaTerminal.js - Simple terminal with xterm.js
class NebulaTerminal {
    constructor() {
        this.windowId = null;
        this.terminal = null;
        this.currentPath = '/home/user';
        this.commandHistory = [];
        this.historyIndex = -1;
        this.currentInput = '';
        
        // Built-in commands
        this.commands = {
            help: () => this.showHelp(),
            clear: () => this.terminal.clear(),
            pwd: () => this.writeLine(this.currentPath),
            cd: (args) => this.changeDirectory(args[0] || '/home/user'),
            ls: (args) => this.listDirectory(args[0] || this.currentPath),
            cat: (args) => this.showFile(args[0]),
            echo: (args) => this.writeLine(args.join(' ')),
            date: () => this.writeLine(new Date().toString()),
            whoami: () => this.writeLine('nebula-user'),
            uname: () => this.writeLine('NebulaOS 1.0 (WebKit)'),
            js: (args) => this.executeJS(args.join(' ')),
            debug: (args) => this.debugCommand(args),
            exit: () => this.closeTerminal()
        };
        
        this.init();
    }
    
    async init() {
        if (!window.windowManager) {
            console.error('WindowManager not available');
            return;
        }
        
        // Create terminal window
        this.windowId = window.windowManager.createWindow({
            title: 'Nebula Terminal',
            width: 800,
            height: 500,
            hasTabBar: false,
            resizable: true
        });
        
        // Load terminal into window
        window.windowManager.loadApp(this.windowId, this);
        
        console.log(`Terminal initialized with window ${this.windowId}`);
    }
    
    /**
     * Called by WindowManager to render the terminal
     */
    render() {
        const container = document.createElement('div');
        container.className = 'terminal-container';
        container.style.cssText = `
            width: 100%;
            height: 100%;
            background: #1a1a1a;
            padding: 16px;
            overflow: hidden;
            font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', monospace;
        `;
        
        // Create terminal element
        const terminalElement = document.createElement('div');
        terminalElement.id = 'terminal';
        terminalElement.style.cssText = `
            width: 100%;
            height: 100%;
        `;
        
        container.appendChild(terminalElement);
        
        // Initialize xterm.js after DOM is ready
        setTimeout(() => this.initTerminal(terminalElement), 100);
        
        return container;
    }
    
    /**
     * Initialize xterm.js terminal
     */
    initTerminal(element) {
        if (!window.Terminal) {
            console.error('XTerm.js not loaded');
            return;
        }
        
        // Create terminal with Nebula theme
        this.terminal = new Terminal({
            theme: {
                background: '#1a1a1a',
                foreground: '#ffffff',
                cursor: '#667eea',
                selection: 'rgba(102, 126, 234, 0.3)',
                black: '#000000',
                red: '#ef4444',
                green: '#10b981',
                yellow: '#f59e0b',
                blue: '#3b82f6',
                magenta: '#8b5cf6',
                cyan: '#06b6d4',
                white: '#ffffff',
                brightBlack: '#4b5563',
                brightRed: '#f87171',
                brightGreen: '#34d399',
                brightYellow: '#fbbf24',
                brightBlue: '#60a5fa',
                brightMagenta: '#a78bfa',
                brightCyan: '#67e8f9',
                brightWhite: '#ffffff'
            },
            fontSize: 14,
            fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", monospace',
            cursorBlink: true,
            cursorStyle: 'block'
        });
        
        // Fit addon for resizing
        if (window.FitAddon) {
            this.fitAddon = new FitAddon.FitAddon();
            this.terminal.loadAddon(this.fitAddon);
        }
        
        // Open terminal
        this.terminal.open(element);
        
        // Fit to container
        if (this.fitAddon) {
            this.fitAddon.fit();
        }
        
        // Setup input handling
        this.terminal.onData(data => this.handleInput(data));
        
        // Welcome message
        this.writeLine('╭─────────────────────────────────────────╮');
        this.writeLine('│          Welcome to Nebula Terminal     │');
        this.writeLine('│                                         │');
        this.writeLine('│  Type "help" for available commands    │');
        this.writeLine('│  Type "js" to execute JavaScript       │');
        this.writeLine('│  Type "debug" for debug commands       │');
        this.writeLine('╰─────────────────────────────────────────╯');
        this.writeLine('');
        
        this.showPrompt();
    }
    
    /**
     * Handle terminal input
     */
    handleInput(data) {
        const code = data.charCodeAt(0);
        
        if (code === 13) { // Enter
            this.terminal.write('\r\n');
            this.executeCommand(this.currentInput.trim());
            this.commandHistory.push(this.currentInput);
            this.historyIndex = this.commandHistory.length;
            this.currentInput = '';
            this.showPrompt();
        } else if (code === 127) { // Backspace
            if (this.currentInput.length > 0) {
                this.currentInput = this.currentInput.slice(0, -1);
                this.terminal.write('\b \b');
            }
        } else if (code === 27) { // Escape sequences (arrow keys)
            // Handle arrow keys for command history
            return;
        } else if (code >= 32) { // Printable characters
            this.currentInput += data;
            this.terminal.write(data);
        }
    }
    
    /**
     * Execute a command
     */
    async executeCommand(input) {
        if (!input) return;
        
        const parts = input.split(' ');
        const command = parts[0];
        const args = parts.slice(1);
        
        if (this.commands[command]) {
            try {
                await this.commands[command](args);
            } catch (error) {
                this.writeLine(`Error: ${error.message}`);
            }
        } else {
            this.writeLine(`Command not found: ${command}`);
            this.writeLine('Type "help" for available commands');
        }
    }
    
    /**
     * Show command prompt
     */
    showPrompt() {
        const prompt = `\x1b[36mnebula-user\x1b[0m:\x1b[34m${this.currentPath}\x1b[0m$ `;
        this.terminal.write(prompt);
    }
    
    /**
     * Write a line to terminal
     */
    writeLine(text) {
        this.terminal.write(text + '\r\n');
    }
    
    /**
     * Show help
     */
    showHelp() {
        this.writeLine('Available commands:');
        this.writeLine('  help     - Show this help message');
        this.writeLine('  clear    - Clear the terminal');
        this.writeLine('  pwd      - Print working directory');
        this.writeLine('  cd       - Change directory (supports ~, .., and absolute paths)');
        this.writeLine('  ls       - List directory contents');
        this.writeLine('  cat      - Display file contents');
        this.writeLine('  echo     - Print text');
        this.writeLine('  date     - Show current date');
        this.writeLine('  whoami   - Show current user');
        this.writeLine('  uname    - Show system info');
        this.writeLine('  js       - Execute JavaScript code');
        this.writeLine('  debug    - Debug commands (help, vars, console)');
        this.writeLine('  exit     - Close terminal');
        this.writeLine('');
        this.writeLine('Examples:');
        this.writeLine('  cd ~           - Go to home directory');
        this.writeLine('  cd ~/Documents - Go to Documents folder');
        this.writeLine('  js 2 + 2       - Execute JavaScript');
    }
    
    /**
     * Change directory (now uses real home directory)
     */
    async changeDirectory(path) {
        if (!path || path === '~') {
            // Get real home directory from the system
            if (window.nebula?.fs?.getHomeDir) {
                try {
                    this.currentPath = await window.nebula.fs.getHomeDir();
                } catch (error) {
                    this.currentPath = '/home/user'; // fallback
                }
            } else {
                this.currentPath = '/home/user'; // fallback
            }
        } else if (path.startsWith('~/')) {
            // Expand ~ to real home directory
            if (window.nebula?.fs?.getHomeDir) {
                try {
                    const homeDir = await window.nebula.fs.getHomeDir();
                    this.currentPath = homeDir + path.substring(1); // Replace ~ with home
                } catch (error) {
                    this.currentPath = '/home/user' + path.substring(1);
                }
            } else {
                this.currentPath = '/home/user' + path.substring(1);
            }
        } else if (path.startsWith('/')) {
            this.currentPath = path;
        } else if (path === '..') {
            const parts = this.currentPath.split('/').filter(p => p);
            parts.pop();
            this.currentPath = '/' + parts.join('/');
            if (this.currentPath === '/') {
                // Go to real home directory instead of root
                if (window.nebula?.fs?.getHomeDir) {
                    try {
                        this.currentPath = await window.nebula.fs.getHomeDir();
                    } catch (error) {
                        this.currentPath = '/home/user';
                    }
                } else {
                    this.currentPath = '/home/user';
                }
            }
        } else {
            this.currentPath = this.currentPath.endsWith('/') ? 
                this.currentPath + path : this.currentPath + '/' + path;
        }
        
        // Update terminal working directory
        if (window.nebula?.terminal?.setCwd) {
            window.nebula.terminal.setCwd(this.currentPath);
        }
        
        // Show confirmation
        this.writeLine(`Changed directory to: ${this.currentPath}`);
    }
    
    /**
     * List directory (simulated)
     */
    async listDirectory(path) {
        // For now, show simulated directory contents
        const mockFiles = [
            'Documents/',
            'Desktop/',
            'Downloads/',
            'Pictures/',
            'Videos/',
            'nebula-app.js',
            'README.md',
            'package.json'
        ];
        
        this.writeLine(`Contents of ${path}:`);
        mockFiles.forEach(file => {
            const color = file.endsWith('/') ? '\x1b[34m' : '\x1b[0m'; // Blue for directories
            this.writeLine(`  ${color}${file}\x1b[0m`);
        });
    }
    
    /**
     * Show file contents (simulated)
     */
    showFile(filename) {
        if (!filename) {
            this.writeLine('Usage: cat <filename>');
            return;
        }
        
        // Mock file contents
        const mockFiles = {
            'README.md': '# Nebula Desktop\n\nA modern desktop environment built with Electron.',
            'package.json': '{\n  "name": "nebula-desktop",\n  "version": "1.0.0"\n}',
            'test.js': 'console.log("Hello from Nebula Terminal!");'
        };
        
        if (mockFiles[filename]) {
            this.writeLine(mockFiles[filename]);
        } else {
            this.writeLine(`File not found: ${filename}`);
        }
    }
    
    /**
     * Execute JavaScript code
     */
    executeJS(code) {
        if (!code) {
            this.writeLine('Usage: js <javascript-code>');
            this.writeLine('Example: js console.log("Hello World")');
            return;
        }
        
        try {
            // Capture console output
            const originalLog = console.log;
            let output = '';
            console.log = (...args) => {
                output += args.map(arg => 
                    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                ).join(' ') + '\n';
            };
            
            // Execute code
            const result = Function('"use strict"; return (' + code + ')')();
            
            // Restore console.log
            console.log = originalLog;
            
            // Show output
            if (output) {
                this.writeLine('Console output:');
                this.writeLine(output.trim());
            }
            
            if (result !== undefined) {
                this.writeLine('Result: ' + (typeof result === 'object' ? 
                    JSON.stringify(result, null, 2) : String(result)));
            }
            
        } catch (error) {
            this.writeLine(`JavaScript Error: ${error.message}`);
        }
    }
    
    /**
     * Debug commands
     */
    debugCommand(args) {
        const subCommand = args[0];
        
        switch (subCommand) {
            case 'help':
                this.writeLine('Debug commands:');
                this.writeLine('  debug help     - Show debug help');
                this.writeLine('  debug vars     - Show environment variables');
                this.writeLine('  debug console  - Test console output');
                this.writeLine('  debug window   - Show window info');
                break;
                
            case 'vars':
                if (window.nebula?.terminal?.getEnv) {
                    const env = window.nebula.terminal.getEnv();
                    Object.entries(env).forEach(([key, value]) => {
                        this.writeLine(`${key}=${value}`);
                    });
                }
                break;
                
            case 'console':
                this.writeLine('Testing console output...');
                console.log('This is a test log from terminal');
                console.warn('This is a test warning');
                console.error('This is a test error');
                break;
                
            case 'window':
                this.writeLine(`Window ID: ${this.windowId}`);
                this.writeLine(`Current Path: ${this.currentPath}`);
                this.writeLine(`Command History: ${this.commandHistory.length} commands`);
                break;
                
            default:
                this.writeLine('Usage: debug <command>');
                this.writeLine('Type "debug help" for available debug commands');
        }
    }
    
    /**
     * Close terminal
     */
    closeTerminal() {
        if (window.windowManager && this.windowId) {
            window.windowManager.closeWindow(this.windowId);
        }
    }
    
    /**
     * App interface methods
     */
    getTitle() {
        return 'Nebula Terminal';
    }
    
    getIcon() {
        return '💻';
    }
    
    cleanup() {
        if (this.terminal) {
            this.terminal.dispose();
        }
        console.log('Terminal cleaned up');
    }
}

// Make NebulaTerminal available globally
window.NebulaTerminal = NebulaTerminal;