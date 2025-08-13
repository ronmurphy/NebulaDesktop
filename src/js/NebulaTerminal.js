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
    },

    extname: (path) => {
        const basename = path.split('/').pop();
        const lastDot = basename.lastIndexOf('.');
        return lastDot === -1 ? '' : basename.slice(lastDot);
    }
};

// Nerd Font icons for different file types (with Unicode fallbacks)
const nerdIcons = {
    // Folders
    folder: '📁', // fallback: 📁
    folderOpen: '📂', // fallback: 📂
    
    // Programming files
    '.js': '⚡', // fallback: ⚡
    '.ts': '🔷', // fallback: 🔷
    '.jsx': '⚛️', // fallback: ⚛️
    '.tsx': '⚛️', // fallback: ⚛️
    '.vue': '💚', // fallback: 💚
    '.py': '🐍', // fallback: 🐍
    '.java': '☕', // fallback: ☕
    '.cpp': '⚙️', // fallback: ⚙️
    '.c': '🔧', // fallback: 🔧
    '.h': '📄', // fallback: 📄
    '.cs': '🔷', // fallback: 🔷
    '.php': '🐘', // fallback: 🐘
    '.rb': '💎', // fallback: 💎
    '.go': '🐹', // fallback: 🐹
    '.rs': '🦀', // fallback: 🦀
    '.swift': '🐦', // fallback: 🐦
    '.kt': '🟣', // fallback: 🟣
    '.scala': '🔴', // fallback: 🔴
    '.sh': '🐚', // fallback: 🐚
    '.bash': '🐚', // fallback: 🐚
    '.zsh': '🐚', // fallback: 🐚
    '.fish': '🐠', // fallback: 🐠
    
    // Web files
    '.html': '🌐', // fallback: 🌐
    '.css': '🎨', // fallback: 🎨
    '.scss': '🎨', // fallback: 🎨
    '.sass': '🎨', // fallback: 🎨
    '.less': '🎨', // fallback: 🎨
    
    // Data files
    '.json': '📋', // fallback: 📋
    '.xml': '📄', // fallback: 📄
    '.yaml': '⚙️', // fallback: ⚙️
    '.yml': '⚙️', // fallback: ⚙️
    '.toml': '⚙️', // fallback: ⚙️
    '.csv': '📊', // fallback: 📊
    
    // Documentation
    '.md': '📝', // fallback: 📝
    '.txt': '📄', // fallback: 📄
    '.pdf': '📕', // fallback: 📕
    '.doc': '📘', // fallback: 📘
    '.docx': '📘', // fallback: 📘
    
    // Images
    '.png': '🖼️', // fallback: 🖼️
    '.jpg': '🖼️', // fallback: 🖼️
    '.jpeg': '🖼️', // fallback: 🖼️
    '.gif': '🎞️', // fallback: 🎞️
    '.svg': '🔶', // fallback: 🔶
    '.ico': '🖼️', // fallback: 🖼️
    '.bmp': '🖼️', // fallback: 🖼️
    
    // Audio/Video
    '.mp3': '🎵', // fallback: 🎵
    '.wav': '🎵', // fallback: 🎵
    '.mp4': '🎬', // fallback: 🎬
    '.avi': '🎬', // fallback: 🎬
    '.mov': '🎬', // fallback: 🎬
    '.mkv': '🎬', // fallback: 🎬
    
    // Archives
    '.zip': '📦', // fallback: 📦
    '.tar': '📦', // fallback: 📦
    '.gz': '📦', // fallback: 📦
    '.rar': '📦', // fallback: 📦
    '.7z': '📦', // fallback: 📦
    
    // Config files
    '.gitignore': '🙈', // fallback: 🙈
    '.env': '🔐', // fallback: 🔐
    '.config': '⚙️', // fallback: ⚙️
    '.conf': '⚙️', // fallback: ⚙️
    '.ini': '⚙️', // fallback: ⚙️
    
    // Executables
    '.exe': '⚙️', // fallback: ⚙️
    '.app': '📱', // fallback: 📱
    '.deb': '📦', // fallback: 📦
    '.rpm': '📦', // fallback: 📦
    
    // Default
    default: '📄' // fallback: 📄
};

// Get icon for file/folder
function getFileIcon(name, isDirectory) {
    if (isDirectory) {
        return nerdIcons.folder;
    }
    
    // Special files
    const lowerName = name.toLowerCase();
    if (lowerName === 'readme.md' || lowerName === 'readme.txt' || lowerName === 'readme') {
        return '📖'; // fallback: 📖
    }
    if (lowerName === 'package.json') {
        return '📦'; // fallback: 📦
    }
    if (lowerName === 'dockerfile') {
        return '🐳'; // fallback: 🐳
    }
    if (lowerName.startsWith('.git')) {
        return '🌿'; // fallback: 🌿
    }
    if (lowerName === 'makefile') {
        return '🔨'; // fallback: 🔨
    }
    
    // By extension
    const ext = pathUtils.extname(name).toLowerCase();
    return nerdIcons[ext] || nerdIcons.default;
}

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
            nfetch: () => this.showNFetch("random"),
            mdr: (args) => this.openMarkdownReader(args[0]),
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
            font-family: 'FiraCode Nerd Font Mono', 'Fira Code', 'JetBrains Mono', 'Cascadia Code', 'SF Mono', 'Monaco', monospace;
            font-feature-settings: "liga" 1, "calt" 1;
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
            fontFamily: '"FiraCode Nerd Font Mono", "Fira Code", "JetBrains Mono", "Cascadia Code", "SF Mono", "Monaco", monospace',
            cursorBlink: true,
            cursorStyle: 'block',
            fontWeight: 'normal',
            fontWeightBold: 'bold'
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
        this.writeLine('│  Type "nfetch" for system info          │');
        this.writeLine('│  Type "mdr" to read markdown files     │');
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
        this.writeLine('  nfetch    - Show system information (Nebula fetch)');
        this.writeLine('  mdr      - Open markdown file in reader (mdr ./README.md)');
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
        this.writeLine('  mdr README.md  - Open markdown in reader window');
        this.writeLine('  js 2 + 2       - Execute JavaScript');
        this.writeLine('  nfetch          - Show stylized system info');
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
     * List directory (real file system) - 4 column layout
     */
    async listDirectory(path) {
        try {
            const targetPath = path || this.currentPath;
            const files = await window.nebula.fs.readDir(targetPath);
            
            if (files.length === 0) {
                this.writeLine('');
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

            // Prepare items with icons and formatting
            const items = fileStats.map(({ name, stats }) => {
                const icon = getFileIcon(name, stats?.isDirectory);
                const displayName = stats?.isDirectory ? `${name}/` : name;
                const colorCode = stats?.isDirectory ? '\x1b[34m' : '';
                const resetCode = stats?.isDirectory ? '\x1b[0m' : '';
                
                return {
                    display: `${icon} ${displayName}`,
                    colored: `${colorCode}${icon} ${displayName}${resetCode}`,
                    length: displayName.length + 2 // icon + space + name
                };
            });

            // Calculate column width (find the longest item + some padding)
            const maxLength = Math.max(...items.map(item => item.length));
            const columnWidth = Math.min(maxLength + 2, 25); // Max width of 25 chars per column
            const columns = 4;

            // Add carriage return before first item (as requested)
            this.writeLine('');

            // Display items in 4-column layout
            for (let i = 0; i < items.length; i += columns) {
                let line = '';
                
                for (let j = 0; j < columns && (i + j) < items.length; j++) {
                    const item = items[i + j];
                    const padding = columnWidth - item.length;
                    const paddingSpaces = ' '.repeat(Math.max(0, padding));
                    
                    line += item.colored + paddingSpaces;
                }
                
                this.writeLine(line.trimEnd()); // Remove trailing spaces
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
                    const icon = getFileIcon(name, stats.isDirectory);
                    const type = stats.isDirectory ? 'd' : '-';
                    const size = stats.size.toString().padStart(8);
                    const date = new Date(stats.mtime).toISOString().split('T')[0];
                    const time = new Date(stats.mtime).toTimeString().split(' ')[0];
                    const displayName = stats.isDirectory ? `\x1b[34m${icon} ${name}/\x1b[0m` : `${icon} ${name}`;
                    
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
     * Show NFetch - stylized system information display (web-terminal optimized)
     */
    // async showNFetch() {
    //     try {
    //         // Get system info
    //         let systemInfo = {};
    //         if (window.nebula?.terminal?.getSystemInfo) {
    //             systemInfo = await window.nebula.terminal.getSystemInfo();
    //         }

    //         // Get current time and info
    //         const uptime = this.getUptime();
    //         const memoryInfo = this.getMemoryInfo();

    //         // Super simple layout - no fancy ASCII art, just clean info display
    //         this.writeLine('');
    //         this.writeLine('\x1b[35m╭─── NEBULA OS ───╮\x1b[0m');
    //         this.writeLine('\x1b[35m│\x1b[0m \x1b[36mOS:\x1b[0m NebulaOS v1.0     \x1b[35m│\x1b[0m');
    //         this.writeLine('\x1b[35m│\x1b[0m \x1b[36mHost:\x1b[0m nebula-desktop  \x1b[35m│\x1b[0m');
    //         this.writeLine('\x1b[35m│\x1b[0m \x1b[36mKernel:\x1b[0m NebulaKernel    \x1b[35m│\x1b[0m');
    //         this.writeLine('\x1b[35m│\x1b[0m \x1b[36mArch:\x1b[0m x64             \x1b[35m│\x1b[0m');
    //         this.writeLine('\x1b[35m│\x1b[0m \x1b[36mShell:\x1b[0m nebula-sh      \x1b[35m│\x1b[0m');
    //         this.writeLine('\x1b[35m│\x1b[0m \x1b[36mTerm:\x1b[0m NebulaTerminal  \x1b[35m│\x1b[0m');
    //         this.writeLine('\x1b[35m│\x1b[0m \x1b[36mUptime:\x1b[0m ' + uptime.padEnd(12) + ' \x1b[35m│\x1b[0m');
    //         this.writeLine('\x1b[35m│\x1b[0m \x1b[36mMemory:\x1b[0m ' + memoryInfo.padEnd(12) + ' \x1b[35m│\x1b[0m');
    //         this.writeLine('\x1b[35m╰─────────────────╯\x1b[0m');

    //         // Color palette display
    //         this.writeLine('');
    //         this.writeLine('\x1b[35mColors:\x1b[0m');
    //         this.writeLine('        \x1b[30m███\x1b[0m \x1b[31m███\x1b[0m \x1b[32m███\x1b[0m \x1b[33m███\x1b[0m \x1b[34m███\x1b[0m \x1b[35m███\x1b[0m \x1b[36m███\x1b[0m \x1b[37m███\x1b[0m');
    //         this.writeLine('        BLK RED GRN YLW BLU MAG CYN WHT');
    //         this.writeLine('');

    //     } catch (error) {
    //         this.writeError(`NFetch error: ${error.message}`);
    //     }
    // }

    async showNFetch(style = "classic") {
    try {
        // Gather system info
        let systemInfo = {};
        if (window.nebula?.terminal?.getSystemInfo) {
            systemInfo = await window.nebula.terminal.getSystemInfo();
        }

        const uptime = this.getUptime();
        const memoryInfo = this.getMemoryInfo();

        // ASCII art options
        const asciiStyles = {
            minimal: [
                "\x1b[35m╭─── NEBULA ───╮\x1b[0m",
                "\x1b[35m│\x1b[0m \x1b[36mOS:\x1b[0m Nebula v1.0     \x1b[35m│\x1b[0m",
                "\x1b[35m│\x1b[0m \x1b[36mHost:\x1b[0m nebula-desktop  \x1b[35m│\x1b[0m",
                "\x1b[35m│\x1b[0m \x1b[36mKernel:\x1b[0m NebulaKernel    \x1b[35m│\x1b[0m",
                "\x1b[35m│\x1b[0m \x1b[36mArch:\x1b[0m x64             \x1b[35m│\x1b[0m",
                "\x1b[35m│\x1b[0m \x1b[36mShell:\x1b[0m nebula-sh      \x1b[35m│\x1b[0m",
                "\x1b[35m│\x1b[0m \x1b[36mTerm:\x1b[0m NebulaTerminal  \x1b[35m│\x1b[0m",
                `\x1b[35m│\x1b[0m \x1b[36mUptime:\x1b[0m ${uptime.padEnd(12)} \x1b[35m│\x1b[0m`,
                `\x1b[35m│\x1b[0m \x1b[36mMemory:\x1b[0m ${memoryInfo.padEnd(12)} \x1b[35m│\x1b[0m`,
                "\x1b[35m╰─────────────────╯\x1b[0m"
            ],
            classic: [
                "\x1b[35m        _   _      _           \x1b[0m",
                "\x1b[35m  _ __ | \\ | | ___| |__   __ _ \x1b[0m",
                "\x1b[35m | '_ \\|  \\| |/ _ \\ '_ \\ / _` |\x1b[0m",
                "\x1b[35m | | | | |\\  |  __/ | | | (_| |\x1b[0m",
                "\x1b[35m |_| |_|_| \\_|\\___|_| |_|\\__,_|\x1b[0m"
            ],
            swirl: [
                "\x1b[35m           .        *        .    \x1b[0m",
                "\x1b[35m      *        .    .   *         \x1b[0m",
                "\x1b[35m    .     _   _      _       *    \x1b[0m",
                "\x1b[35m   *   | \\ | | ___ | |__   __ _   \x1b[0m",
                "\x1b[35m       |  \\| |/ _ \\| '_ \\ / _` |  \x1b[0m",
                "\x1b[35m   *   | |\\  |  __/| | | | (_| |  \x1b[0m",
                "\x1b[35m       |_| \\_|\\___||_| |_|\\__,_|  \x1b[0m",
                "\x1b[35m     .      *    .    *     .     \x1b[0m"
            ],
            gradient: [
                "\x1b[35m        _   _      _           \x1b[0m",
                "\x1b[35m  _ __ \x1b[95m| \\ | |\x1b[94m ___| |__   __ _ \x1b[0m",
                "\x1b[95m | '_ \\ \x1b[94m|  \\| |/ _ \\ '_ \\ / _` |\x1b[0m",
                "\x1b[94m | | | |\x1b[96m |\\  |  __/ | | | (_| |\x1b[0m",
                "\x1b[96m |_| |_|_| \\_|\\___|_| |_|\\__,_|\x1b[0m"
            ]
        };

        // Info lines for all styles except minimal
        const infoLines = [
            `\x1b[36mOS:\x1b[0m       Nebula v1.0`,
            `\x1b[36mHost:\x1b[0m     nebula-desktop`,
            `\x1b[36mKernel:\x1b[0m   NebulaKernel`,
            `\x1b[36mArch:\x1b[0m     x64`,
            `\x1b[36mShell:\x1b[0m    nebula-sh`,
            `\x1b[36mTerm:\x1b[0m     NebulaTerminal`,
            `\x1b[36mUptime:\x1b[0m   ${uptime}`,
            `\x1b[36mMemory:\x1b[0m   ${memoryInfo}`
        ];

        // Random mode handling
        if (style === "random") {
            const keys = Object.keys(asciiStyles);
            style = keys[Math.floor(Math.random() * keys.length)];
        }

        this.writeLine("");

        if (style === "minimal") {
            asciiStyles.minimal.forEach(line => this.writeLine(line));
        } else {
            const art = asciiStyles[style] || asciiStyles.classic;
            for (let i = 0; i < Math.max(art.length, infoLines.length); i++) {
                const a = art[i] || " ".repeat(32);
                const info = infoLines[i] || "";
                this.writeLine(a + "   " + info);
            }
        }

        // Colors row
        this.writeLine("");
        this.writeLine("\x1b[35mColors:\x1b[0m");
        this.writeLine("  \x1b[30m███\x1b[0m \x1b[31m███\x1b[0m \x1b[32m███\x1b[0m \x1b[33m███\x1b[0m \x1b[34m███\x1b[0m \x1b[35m███\x1b[0m \x1b[36m███\x1b[0m \x1b[37m███\x1b[0m");
        this.writeLine("  BLK RED GRN YLW BLU MAG CYN WHT");
        this.writeLine("");

    } catch (error) {
        this.writeError(`NFetch error: ${error.message}`);
    }
}


    /**
     * Get simulated uptime
     */
    getUptime() {
        const now = Date.now();
        const startTime = window.nebulaStartTime || now;
        const uptimeMs = now - startTime;
        
        const seconds = Math.floor(uptimeMs / 1000) % 60;
        const minutes = Math.floor(uptimeMs / (1000 * 60)) % 60;
        const hours = Math.floor(uptimeMs / (1000 * 60 * 60)) % 24;
        const days = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));
        
        if (days > 0) {
            return `${days}d ${hours}h ${minutes}m`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m ${seconds}s`;
        }
    }

    /**
     * Get simulated memory info
     */
    getMemoryInfo() {
        // Simulate memory usage
        const totalMB = 8192; // 8GB
        const usedMB = Math.floor(Math.random() * 4096) + 1024; // 1-5GB used
        const usedPercent = Math.floor((usedMB / totalMB) * 100);
        
        return `${usedMB}MB / ${totalMB}MB (${usedPercent}%)`;
    }

    /**
     * Open markdown file in reader window
     */
    async openMarkdownReader(filename) {
        if (!filename) {
            this.writeLine('Usage: mdr <filename.md>');
            this.writeLine('Example: mdr ./README.md');
            return;
        }

        try {
            // Resolve file path
            const filePath = pathUtils.isAbsolute(filename) ? 
                filename : pathUtils.join(this.currentPath, filename);
                
            // Check if file exists
            const exists = await window.nebula.fs.exists(filePath);
            if (!exists) {
                this.writeError(`File not found: ${filename}`);
                return;
            }

            // Check if it's a file (not directory)
            const stats = await window.nebula.fs.stat(filePath);
            if (stats.isDirectory) {
                this.writeError(`${filename} is a directory`);
                return;
            }

            // Read the markdown file
            const content = await window.nebula.fs.readFile(filePath);
            
            // Create markdown reader window
            const windowId = window.windowManager.createWindow({
                title: `Markdown Reader - ${filename}`,
                width: 900,
                height: 700,
                hasTabBar: false,
                resizable: true
            });

            // Create markdown reader app instance
            const markdownReader = new MarkdownReader(content, filename);
            window.windowManager.loadApp(windowId, markdownReader);
            
            this.writeLine(`Opened ${filename} in Markdown Reader`);

        } catch (error) {
            this.writeError(`Cannot open markdown file: ${error.message}`);
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

// MarkdownReader class for displaying markdown files
class MarkdownReader {
    constructor(content, filename) {
        this.content = content;
        this.filename = filename;
    }

    /**
     * Called by WindowManager to render the markdown reader
     */
    render() {
        const container = document.createElement('div');
        container.className = 'markdown-reader-container';
        container.style.cssText = `
            width: 100%;
            height: 100%;
            background: #1e1e1e;
            color: #ffffff;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        `;

        // Header
        const header = document.createElement('div');
        header.style.cssText = `
            background: #2d2d2d;
            padding: 12px 16px;
            border-bottom: 1px solid #404040;
            font-weight: 600;
            font-size: 14px;
            color: #ffffff;
            flex-shrink: 0;
        `;
        header.textContent = this.filename;
        container.appendChild(header);

        // Content area
        const contentArea = document.createElement('div');
        contentArea.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            line-height: 1.6;
        `;

        // Parse and render markdown
        const htmlContent = this.parseMarkdown(this.content);
        contentArea.innerHTML = htmlContent;

        container.appendChild(contentArea);
        return container;
    }

    /**
     * Simple markdown parser
     */
    parseMarkdown(markdown) {
        let html = markdown;

        // Headers
        html = html.replace(/^### (.*$)/gm, '<h3 style="color: #66d9ef; margin: 20px 0 10px 0; font-size: 18px;">$1</h3>');
        html = html.replace(/^## (.*$)/gm, '<h2 style="color: #a6e22e; margin: 25px 0 15px 0; font-size: 22px;">$1</h2>');
        html = html.replace(/^# (.*$)/gm, '<h1 style="color: #f92672; margin: 30px 0 20px 0; font-size: 28px;">$1</h1>');

        // Bold and italic
        html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em style="color: #fd971f;">$1</em></strong>');
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #f8f8f2; font-weight: 600;">$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em style="color: #fd971f;">$1</em>');

        // Code blocks
        html = html.replace(/```([\s\S]*?)```/g, '<pre style="background: #272822; border: 1px solid #404040; border-radius: 4px; padding: 15px; margin: 15px 0; overflow-x: auto; font-family: \'Fira Code\', monospace; color: #f8f8f2;"><code>$1</code></pre>');
        html = html.replace(/`([^`]+)`/g, '<code style="background: #49483e; color: #a6e22e; padding: 2px 4px; border-radius: 3px; font-family: \'Fira Code\', monospace; font-size: 90%;">$1</code>');

        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="#" style="color: #66d9ef; text-decoration: none;" onclick="alert(\'Link: $2\'); return false;">$1</a>');

        // Lists
        html = html.replace(/^\* (.*$)/gm, '<li style="margin: 5px 0; color: #f8f8f2;">$1</li>');
        html = html.replace(/^- (.*$)/gm, '<li style="margin: 5px 0; color: #f8f8f2;">$1</li>');
        
        // Wrap consecutive list items in ul
        html = html.replace(/(<li[^>]*>.*<\/li>\s*)+/g, '<ul style="margin: 10px 0; padding-left: 20px;">$&</ul>');

        // Line breaks
        html = html.replace(/\n\n/g, '<br><br>');
        html = html.replace(/\n/g, '<br>');

        // Blockquotes
        html = html.replace(/^> (.*$)/gm, '<blockquote style="border-left: 4px solid #66d9ef; margin: 15px 0; padding: 10px 15px; background: #2d2d2d; color: #f8f8f2; font-style: italic;">$1</blockquote>');

        return html;
    }

    /**
     * App interface methods
     */
    getTitle() {
        return `Markdown Reader - ${this.filename}`;
    }

    getIcon() {
        return '📝';
    }

    cleanup() {
        // Clean up any resources if needed
        console.log('Markdown reader cleaned up');
    }
}

// Make NebulaTerminal and MarkdownReader available globally
window.NebulaTerminal = NebulaTerminal;
window.MarkdownReader = MarkdownReader;