// NebulaTerminal.js - Real terminal with file system access

// Path utilities (since we can't use Node's path in renderer)
const pathUtils = {
    join: (...parts) => {
        const normalized = parts.join('/').replace(/\/+/g, '/');
        return normalized === '/' ? '/' : normalized.replace(/\/$/, '');
    },
    
    dirname: (path) => {
        const parts = path.split('/').filter(p => p);
        parts.pop();
        return parts.length === 0 ? '/' : '/' + parts.join('/');
    },
    
    isAbsolute: (path) => {
        return path.startsWith('/');
    }
};

class NebulaTerminal {
    constructor() {
        this.windowId = null;
        this.terminal = null;
        this.currentPath = null; // Will be set to actual home directory
        this.commandHistory = [];
        this.historyIndex = -1;
        this.currentInput = '';
        
        // Built-in commands that we handle internally
        this.builtinCommands = {
            help: () => this.showHelp(),
            clear: () => this.terminal.clear(),
            pwd: () => this.writeLine(this.currentPath),
            cd: (args) => this.changeDirectory(args[0] || '~'),
            ls: (args) => this.listDirectory(args[0] || this.currentPath),
            ll: (args) => this.listDirectoryLong(args[0] || this.currentPath),
            cat: (args) => this.showFile(args[0]),
            echo: (args) => this.writeLine(args.join(' ')),
            mkdir: (args) => this.makeDirectory(args[0]),
            rmdir: (args) => this.removeDirectory(args[0]),
            rm: (args) => this.removeFile(args[0]),
            touch: (args) => this.touchFile(args[0]),
            date: () => this.writeLine(new Date().toString()),
            whoami: () => this.showWhoAmI(),
            uname: () => this.showSystemInfo(),
            js: (args) => this.executeJS(args.join(' ')),
            debug: (args) => this.debugCommand(args),
            exit: () => this.closeTerminal(),
            history: () => this.showHistory()
        };
        
        this.init();
    }
    
    async init() {
        if (!window.windowManager) {
            console.error('WindowManager not available');
            return;
        }

        // Get real home directory
        try {
            if (window.nebula?.fs?.getHomeDir) {
                this.currentPath = await window.nebula.fs.getHomeDir();
            } else {
                this.currentPath = '/home/user';
            }
        } catch (error) {
            console.error('Failed to get home directory:', error);
            this.currentPath = '/home/user';
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
        
        console.log(`Terminal initialized with window ${this.windowId}, cwd: ${this.currentPath}`);
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
        
        const parts = this.parseCommand(input);
        const command = parts.command;
        const args = parts.args;
        
        // Check if it's a built-in command
        if (this.builtinCommands[command]) {
            try {
                await this.builtinCommands[command](args);
            } catch (error) {
                this.writeLine(`Error: ${error.message}`);
            }
        } else {
            // Execute as system command
            await this.executeSystemCommand(command, args);
        }
    }

    /**
     * Parse command line input
     */
    parseCommand(input) {
        // Simple command parsing (could be enhanced for pipes, quotes, etc.)
        const parts = input.trim().split(/\s+/);
        return {
            command: parts[0] || '',
            args: parts.slice(1)
        };
    }

    /**
     * Execute system command
     */
    async executeSystemCommand(command, args) {
        if (!window.nebula?.terminal?.exec) {
            this.writeLine(`Command not found: ${command}`);
            this.writeLine('System command execution not available');
            return;
        }

        try {
            this.writeLine(`Executing: ${command} ${args.join(' ')}`);
            
            const result = await window.nebula.terminal.exec(command, args, {
                cwd: this.currentPath,
                env: await this.getEnvironment()
            });

            if (result.stdout) {
                this.writeLine(result.stdout.trim());
            }
            if (result.stderr) {
                this.writeError(result.stderr.trim());
            }
            if (result.exitCode !== 0) {
                this.writeLine(`Command exited with code: ${result.exitCode}`);
            }
        } catch (error) {
            this.writeError(`Error executing command: ${error.message}`);
        }
    }

    /**
     * Get environment variables
     */
    async getEnvironment() {
        const env = window.nebula?.terminal?.getEnv() || {};
        env.PWD = this.currentPath;
        return env;
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
     * Write error message to terminal
     */
    writeError(text) {
        this.terminal.write('\x1b[31m' + text + '\x1b[0m\r\n');
    }
    
    /**
     * Show help
     */
    showHelp() {
        this.writeLine('Built-in commands:');
        this.writeLine('  help     - Show this help message');
        this.writeLine('  clear    - Clear the terminal');
        this.writeLine('  pwd      - Print working directory');
        this.writeLine('  cd       - Change directory (supports ~, .., and absolute paths)');
        this.writeLine('  ls       - List directory contents');
        this.writeLine('  ll       - List directory contents (detailed)');
        this.writeLine('  cat      - Display file contents');
        this.writeLine('  mkdir    - Create directory');
        this.writeLine('  rmdir    - Remove directory');
        this.writeLine('  rm       - Remove file');
        this.writeLine('  touch    - Create empty file');
        this.writeLine('  echo     - Print text');
        this.writeLine('  date     - Show current date');
        this.writeLine('  whoami   - Show current user');
        this.writeLine('  uname    - Show system info');
        this.writeLine('  history  - Show command history');
        this.writeLine('  js       - Execute JavaScript code');
        this.writeLine('  debug    - Debug commands');
        this.writeLine('  exit     - Close terminal');
        this.writeLine('');
        this.writeLine('System commands:');
        this.writeLine('  Any other command will be executed as a system command');
        this.writeLine('  Examples: grep, find, ps, top, git, npm, python, etc.');
        this.writeLine('');
        this.writeLine('Examples:');
        this.writeLine('  cd ~/Documents - Go to Documents folder');
        this.writeLine('  ls -la         - List files with details');
        this.writeLine('  cat file.txt   - Show file contents');
        this.writeLine('  js 2 + 2       - Execute JavaScript');
        this.writeLine('  git status     - Check git repository status');
    }
    
    /**
     * Change directory (with real file system)
     */
    async changeDirectory(path) {
        if (!path || path === '~') {
            // Go to home directory
            try {
                this.currentPath = await window.nebula.fs.getHomeDir();
            } catch (error) {
                this.writeError(`Failed to get home directory: ${error.message}`);
                return;
            }
        } else if (path.startsWith('~/')) {
            // Expand ~ to home directory
            try {
                const homeDir = await window.nebula.fs.getHomeDir();
                this.currentPath = pathUtils.join(homeDir, path.substring(2));
            } catch (error) {
                this.writeError(`Failed to expand path: ${error.message}`);
                return;
            }
        } else if (path.startsWith('/')) {
            // Absolute path
            this.currentPath = path;
        } else if (path === '..') {
            // Go up one directory
            this.currentPath = pathUtils.dirname(this.currentPath);
        } else {
            // Relative path
            this.currentPath = pathUtils.join(this.currentPath, path);
        }
        
        // Verify the directory exists
        try {
            const exists = await window.nebula.fs.exists(this.currentPath);
            if (!exists) {
                this.writeError(`Directory does not exist: ${this.currentPath}`);
                // Revert to previous directory
                return;
            }

            const stats = await window.nebula.fs.stat(this.currentPath);
            if (!stats.isDirectory) {
                this.writeError(`Not a directory: ${this.currentPath}`);
                return;
            }

            // Update terminal working directory
            if (window.nebula?.terminal?.setCwd) {
                window.nebula.terminal.setCwd(this.currentPath);
            }
            
        } catch (error) {
            this.writeError(`Cannot access directory: ${error.message}`);
        }
    }
    
    /**
     * List directory (real file system)
     */
    async listDirectory(path) {
        try {
            const targetPath = path || this.currentPath;
            const files = await window.nebula.fs.readDir(targetPath);
            
            if (files.length === 0) {
                this.writeLine('Directory is empty');
                return;
            }

            // Get file stats for each file
            const fileStats = await Promise.all(
                files.map(async (file) => {
                    try {
                        const filePath = pathUtils.join(targetPath, file);
                        const stats = await window.nebula.fs.stat(filePath);
                        return { name: file, stats };
                    } catch (error) {
                        return { name: file, stats: null };
                    }
                })
            );

            // Sort directories first, then files
            fileStats.sort((a, b) => {
                if (a.stats?.isDirectory && !b.stats?.isDirectory) return -1;
                if (!a.stats?.isDirectory && b.stats?.isDirectory) return 1;
                return a.name.localeCompare(b.name);
            });

            // Display files
            for (const { name, stats } of fileStats) {
                if (stats?.isDirectory) {
                    this.writeLine(`\x1b[34m${name}/\x1b[0m`);
                } else {
                    this.writeLine(`${name}`);
                }
            }
        } catch (error) {
            this.writeError(`Cannot list directory: ${error.message}`);
        }
    }

    /**
     * List directory with detailed info
     */
    async listDirectoryLong(path) {
        try {
            const targetPath = path || this.currentPath;
            const files = await window.nebula.fs.readDir(targetPath);
            
            if (files.length === 0) {
                this.writeLine('Directory is empty');
                return;
            }

            // Get file stats for each file
            const fileStats = await Promise.all(
                files.map(async (file) => {
                    try {
                        const filePath = pathUtils.join(targetPath, file);
                        const stats = await window.nebula.fs.stat(filePath);
                        return { name: file, stats };
                    } catch (error) {
                        return { name: file, stats: null };
                    }
                })
            );

            // Sort directories first, then files
            fileStats.sort((a, b) => {
                if (a.stats?.isDirectory && !b.stats?.isDirectory) return -1;
                if (!a.stats?.isDirectory && b.stats?.isDirectory) return 1;
                return a.name.localeCompare(b.name);
            });

            // Display files with details
            for (const { name, stats } of fileStats) {
                if (stats) {
                    const type = stats.isDirectory ? 'd' : '-';
                    const size = stats.size.toString().padStart(8);
                    const date = new Date(stats.mtime).toISOString().split('T')[0];
                    const time = new Date(stats.mtime).toTimeString().split(' ')[0];
                    const displayName = stats.isDirectory ? `\x1b[34m${name}/\x1b[0m` : name;
                    
                    this.writeLine(`${type}rwxr-xr-x ${size} ${date} ${time} ${displayName}`);
                } else {
                    this.writeLine(`?????????? -------- ---- ---- ${name}`);
                }
            }
        } catch (error) {
            this.writeError(`Cannot list directory: ${error.message}`);
        }
    }
    
    /**
     * Show file contents (real file system)
     */
    async showFile(filename) {
        if (!filename) {
            this.writeLine('Usage: cat <filename>');
            return;
        }
        
        try {
            const filePath = pathUtils.isAbsolute(filename) ? 
                filename : pathUtils.join(this.currentPath, filename);
                
            const exists = await window.nebula.fs.exists(filePath);
            if (!exists) {
                this.writeError(`File not found: ${filename}`);
                return;
            }

            const stats = await window.nebula.fs.stat(filePath);
            if (stats.isDirectory) {
                this.writeError(`${filename} is a directory`);
                return;
            }

            const content = await window.nebula.fs.readFile(filePath);
            this.writeLine(content);
        } catch (error) {
            this.writeError(`Cannot read file: ${error.message}`);
        }
    }

    /**
     * Create directory
     */
    async makeDirectory(dirname) {
        if (!dirname) {
            this.writeLine('Usage: mkdir <directory>');
            return;
        }

        try {
            const dirPath = pathUtils.isAbsolute(dirname) ? 
                dirname : pathUtils.join(this.currentPath, dirname);
                
            await window.nebula.fs.mkdir(dirPath, { recursive: true });
            this.writeLine(`Directory created: ${dirname}`);
        } catch (error) {
            this.writeError(`Cannot create directory: ${error.message}`);
        }
    }

    /**
     * Remove directory
     */
    async removeDirectory(dirname) {
        if (!dirname) {
            this.writeLine('Usage: rmdir <directory>');
            return;
        }

        try {
            const dirPath = pathUtils.isAbsolute(dirname) ? 
                dirname : pathUtils.join(this.currentPath, dirname);
                
            await window.nebula.fs.rmdir(dirPath);
            this.writeLine(`Directory removed: ${dirname}`);
        } catch (error) {
            this.writeError(`Cannot remove directory: ${error.message}`);
        }
    }

    /**
     * Remove file
     */
    async removeFile(filename) {
        if (!filename) {
            this.writeLine('Usage: rm <filename>');
            return;
        }

        try {
            const filePath = pathUtils.isAbsolute(filename) ? 
                filename : pathUtils.join(this.currentPath, filename);
                
            await window.nebula.fs.unlink(filePath);
            this.writeLine(`File removed: ${filename}`);
        } catch (error) {
            this.writeError(`Cannot remove file: ${error.message}`);
        }
    }

    /**
     * Create empty file
     */
    async touchFile(filename) {
        if (!filename) {
            this.writeLine('Usage: touch <filename>');
            return;
        }

        try {
            const filePath = pathUtils.isAbsolute(filename) ? 
                filename : pathUtils.join(this.currentPath, filename);
                
            await window.nebula.fs.writeFile(filePath, '');
            this.writeLine(`File created: ${filename}`);
        } catch (error) {
            this.writeError(`Cannot create file: ${error.message}`);
        }
    }

    /**
     * Show current user info
     */
    async showWhoAmI() {
        try {
            if (window.nebula?.terminal?.getSystemInfo) {
                const info = await window.nebula.terminal.getSystemInfo();
                this.writeLine(info.username || 'nebula-user');
            } else {
                this.writeLine('nebula-user');
            }
        } catch (error) {
            this.writeLine('nebula-user');
        }
    }

    /**
     * Show system information
     */
    async showSystemInfo() {
        try {
            if (window.nebula?.terminal?.getSystemInfo) {
                const info = await window.nebula.terminal.getSystemInfo();
                this.writeLine(`${info.platform} ${info.hostname} ${info.release} ${info.arch}`);
            } else {
                this.writeLine('NebulaOS 1.0 (WebKit)');
            }
        } catch (error) {
            this.writeLine('NebulaOS 1.0 (WebKit)');
        }
    }

    /**
     * Show command history
     */
    showHistory() {
        this.commandHistory.forEach((cmd, index) => {
            this.writeLine(`${(index + 1).toString().padStart(4)}: ${cmd}`);
        });
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
    async debugCommand(args) {
        const subCommand = args[0];
        
        switch (subCommand) {
            case 'help':
                this.writeLine('Debug commands:');
                this.writeLine('  debug help     - Show debug help');
                this.writeLine('  debug vars     - Show environment variables');
                this.writeLine('  debug console  - Test console output');
                this.writeLine('  debug window   - Show window info');
                this.writeLine('  debug system   - Show system info');
                this.writeLine('  debug fs       - Test file system access');
                break;
                
            case 'vars':
                try {
                    const env = await this.getEnvironment();
                    Object.entries(env).forEach(([key, value]) => {
                        this.writeLine(`${key}=${value}`);
                    });
                } catch (error) {
                    this.writeError(`Failed to get environment: ${error.message}`);
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

            case 'system':
                try {
                    if (window.nebula?.terminal?.getSystemInfo) {
                        const info = await window.nebula.terminal.getSystemInfo();
                        Object.entries(info).forEach(([key, value]) => {
                            this.writeLine(`${key}: ${value}`);
                        });
                    } else {
                        this.writeLine('System info not available');
                    }
                } catch (error) {
                    this.writeError(`Failed to get system info: ${error.message}`);
                }
                break;

            case 'fs':
                this.writeLine('Testing file system access...');
                try {
                    const home = await window.nebula.fs.getHomeDir();
                    this.writeLine(`Home directory: ${home}`);
                    
                    const exists = await window.nebula.fs.exists(this.currentPath);
                    this.writeLine(`Current path exists: ${exists}`);
                    
                    if (exists) {
                        const files = await window.nebula.fs.readDir(this.currentPath);
                        this.writeLine(`Files in current directory: ${files.length}`);
                    }
                } catch (error) {
                    this.writeError(`File system test failed: ${error.message}`);
                }
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