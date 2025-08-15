// Enhanced NebulaTerminal.js - Real terminal with separate input/output areas
// ROLLED BACK to working version + careful useicons addition

// Path utilities for client-side path handling
const pathUtils = {
    join: (...paths) => {
        // Filter out empty paths and join
        const cleanPaths = paths.filter(p => p && p !== '');
        if (cleanPaths.length === 0) return '/';
        
        let result = cleanPaths.join('/');
        
        // Clean up multiple slashes
        result = result.replace(/\/+/g, '/');
        
        // Remove trailing slash unless it's root
        if (result.length > 1 && result.endsWith('/')) {
            result = result.slice(0, -1);
        }
        
        // Ensure we have at least root
        return result || '/';
    },
    
    resolve: (path) => {
        if (!path.startsWith('/')) {
            return pathUtils.join(window.nebulaTerminalCwd || '/home/user', path);
        }
        return path;
    },
    
    dirname: (path) => {
        const parts = path.split('/');
        return parts.slice(0, -1).join('/') || '/';
    },
    
    basename: (path) => {
        return path.split('/').pop() || '';
    },
    
    extname: (path) => {
        const name = pathUtils.basename(path);
        const lastDot = name.lastIndexOf('.');
        return lastDot > 0 ? name.slice(lastDot) : '';
    },
    
    isAbsolute: (path) => {
        return path.startsWith('/');
    },
    
    // Normalize path by resolving . and .. components
    normalize: (inputPath) => {
        const parts = inputPath.split('/').filter(part => part !== '' && part !== '.');
        const resolved = [];
        const isAbsolute = inputPath.startsWith('/');
        
        for (const part of parts) {
            if (part === '..') {
                if (resolved.length > 0 && resolved[resolved.length - 1] !== '..') {
                    resolved.pop();
                } else if (!isAbsolute) {
                    resolved.push('..');
                }
            } else {
                resolved.push(part);
            }
        }
        
        let result = resolved.join('/');
        if (isAbsolute) {
            result = '/' + result;
        }
        
        return result || (isAbsolute ? '/' : '.');
    }
};

// File type icons (using fallback emojis for compatibility)
const nerdIcons = {
    // Folders
    folder: '📁',
    folderOpen: '📂',
    
    // Programming languages
    '.js': '🟨',
    '.ts': '🔷',
    '.jsx': '⚛️',
    '.tsx': '⚛️',
    '.py': '🐍',
    '.java': '☕',
    '.cpp': '⚙️',
    '.c': '⚙️',
    '.cs': '🔷',
    '.php': '🐘',
    '.rb': '💎',
    '.go': '🐹',
    '.rs': '🦀',
    '.swift': '🦉',
    '.kt': '🟣',
    '.dart': '🎯',
    
    // Web files
    '.html': '🌐',
    '.css': '🎨',
    '.scss': '🎨',
    '.less': '🎨',
    '.vue': '💚',
    '.svelte': '🧡',
    
    // Data files
    '.json': '📋',
    '.xml': '📄',
    '.yaml': '📄',
    '.yml': '📄',
    '.toml': '📄',
    '.csv': '📊',
    '.sql': '🗃️',
    
    // Documents
    '.md': '📝',
    '.txt': '📄',
    '.pdf': '📕',
    '.doc': '📘',
    '.docx': '📘',
    '.xls': '📗',
    '.xlsx': '📗',
    '.ppt': '📙',
    '.pptx': '📙',
    
    // Images
    '.png': '🖼️',
    '.jpg': '🖼️',
    '.jpeg': '🖼️',
    '.gif': '🎞️',
    '.svg': '🖼️',
    '.ico': '🖼️',
    '.bmp': '🖼️',
    '.webp': '🖼️',
    
    // Audio/Video
    '.mp3': '🎵',
    '.wav': '🎵',
    '.ogg': '🎵',
    '.m4a': '🎵',
    '.aac': '🎵',
    '.flac': '🎵',
    '.mp4': '🎬',
    '.avi': '🎬',
    '.mov': '🎬',
    '.mkv': '🎬',
    '.webm': '🎬',
    '.ogv': '🎬',
    '.m4v': '🎬',
    
    // Archives
    '.zip': '📦',
    '.tar': '📦',
    '.gz': '📦',
    '.rar': '📦',
    '.7z': '📦',
    
    // Config files
    '.gitignore': '🙈',
    '.env': '🔐',
    '.config': '⚙️',
    '.conf': '⚙️',
    '.ini': '⚙️',
    
    // Executables
    '.exe': '⚙️',
    '.app': '📱',
    '.deb': '📦',
    '.rpm': '📦',
    
    // Default
    default: '📄'
};

// Get icon for file/folder - supports emoji, text, and none modes
function getFileIcon(name, isDirectory, iconMode = 'emoji') {
    if (iconMode === 'none') {
        return ''; // No icon at all - pure minimalism
    }
    
    if (iconMode === 'text') {
        // Text-based icons for professional look
        if (isDirectory) {
            return 'DIR';
        }
        
        // File extension based text icons
        const ext = pathUtils.extname(name).toLowerCase();
        const textIcons = {
            '.js': 'JS',
            '.ts': 'TS', 
            '.py': 'PY',
            '.java': 'JAVA',
            '.cpp': 'C++',
            '.c': 'C',
            '.php': 'PHP',
            '.rb': 'RB',
            '.go': 'GO',
            '.rs': 'RS',
            '.html': 'HTML',
            '.css': 'CSS',
            '.json': 'JSON',
            '.md': 'MD',
            '.txt': 'TXT',
            '.png': 'IMG',
            '.jpg': 'IMG',
            '.jpeg': 'IMG',
            '.gif': 'IMG',
            '.mp4': 'VID',
            '.avi': 'VID',
            '.mp3': 'AUD',
            '.wav': 'AUD',
            '.zip': 'ZIP',
            '.tar': 'TAR',
            '.pdf': 'PDF'
        };
        
        return textIcons[ext] || 'FILE';
    } else {
        // Original emoji icons
        if (isDirectory) {
            return nerdIcons.folder;
        }
        
        // Special files
        const lowerName = name.toLowerCase();
        if (lowerName === 'readme.md' || lowerName === 'readme.txt' || lowerName === 'readme') {
            return '📖';
        }
        if (lowerName === 'package.json') {
            return '📦';
        }
        if (lowerName === 'dockerfile') {
            return '🐳';
        }
        if (lowerName.startsWith('.git')) {
            return '🌿';
        }
        if (lowerName === 'makefile') {
            return '🔨';
        }
        
        // By extension
        const ext = pathUtils.extname(name).toLowerCase();
        return nerdIcons[ext] || nerdIcons.default;
    }
}

class NebulaTerminal {
    constructor() {
        this.windowId = null;
        this.outputArea = null;
        this.inputLine = null;
        this.inputField = null;
        this.currentPath = null;
        this.commandHistory = [];
        this.historyIndex = -1;
        this.iconStyle = localStorage.getItem('nebula-terminal-icons') || 'emoji'; // NEW: icon style setting
        
        // Built-in commands that we handle internally
        this.builtinCommands = {
            help: () => this.showHelp(),
            clear: () => this.clearTerminal(),
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
            nfetch: () => this.showNFetch(),
            mdr: (args) => this.openMarkdownReader(args[0]),
            useicons: (args) => this.setIconStyle(args[0]), // NEW: useicons command
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
            display: flex;
            flex-direction: column;
            font-family: 'FiraCode Nerd Font Mono', 'Fira Code', 'JetBrains Mono', 'Cascadia Code', 'SF Mono', 'Monaco', monospace;
            font-feature-settings: "liga" 1, "calt" 1;
        `;
        
        // Create output area (scrollable)
        this.outputArea = document.createElement('div');
        this.outputArea.className = 'terminal-output';
        this.outputArea.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            color: #00ff00;
            font-size: 14px;
            line-height: 1.4;
            white-space: pre-wrap;
            word-wrap: break-word;
        `;
        
        // Create input line (fixed at bottom)
        this.inputLine = document.createElement('div');
        this.inputLine.className = 'terminal-input-line';
        this.inputLine.style.cssText = `
            display: flex;
            align-items: center;
            padding: 8px 16px;
            background: #1a1a1a;
            border-top: 1px solid #333;
            color: #00ff00;
            font-size: 14px;
        `;
        
        // Create prompt text
        this.promptText = document.createElement('span');
        this.promptText.className = 'terminal-prompt';
        this.updatePrompt();
        
        // Create input field
        this.inputField = document.createElement('input');
        this.inputField.type = 'text';
        this.inputField.className = 'terminal-input';
        this.inputField.style.cssText = `
            flex: 1;
            background: transparent;
            border: none;
            outline: none;
            color: #00ff00;
            font-family: inherit;
            font-size: inherit;
            margin-left: 8px;
        `;
        
        this.inputLine.appendChild(this.promptText);
        this.inputLine.appendChild(this.inputField);
        
        container.appendChild(this.outputArea);
        container.appendChild(this.inputLine);
        
        // Initialize terminal after DOM is ready
        setTimeout(() => {
            this.initTerminal();
        }, 100);
        
        return container;
    }
    
    /**
     * Initialize terminal functionality
     */
    initTerminal() {
        this.writeLine('Nebula Terminal v2.0 - Enhanced Edition');
        this.writeLine('Type "help" for available commands\n');
        
        // Focus input field
        this.inputField.focus();
        
        // Setup input handling
        this.setupInputHandling();
    }
    
    /**
     * Update prompt text
     */
    updatePrompt() {
        if (this.promptText) {
            this.promptText.textContent = `nebula@desktop:${this.getShortPath()}$ `;
        }
    }
    
    /**
     * Get short path for prompt (replace home with ~)
     */
    getShortPath() {
        if (this.currentPath && this.currentPath.includes('/home/')) {
            const homeDir = this.currentPath.match(/^\/home\/[^\/]+/);
            if (homeDir && this.currentPath.startsWith(homeDir[0])) {
                return this.currentPath.replace(homeDir[0], '~');
            }
        }
        return this.currentPath || '~';
    }
    
    /**
     * Setup input event handling
     */
    setupInputHandling() {
        this.inputField.addEventListener('keydown', (e) => {
            this.handleKeyPress(e);
        });
        
        // Focus input when clicking anywhere in terminal
        this.outputArea.addEventListener('click', () => {
            this.inputField.focus();
        });
        
        // Right-click to auto-ls when input is empty (but not on specific items)
        this.outputArea.addEventListener('contextmenu', (e) => {
            // Check if the click was on a specific file/folder item
            const clickedItem = e.target.closest('.file-item, [data-name]');
            if (clickedItem) {
                // Let the specific item handler deal with it
                return;
            }
            
            e.preventDefault(); // Prevent default context menu
            
            // Only auto-ls if input field is empty
            if (this.inputField.value.trim() === '') {
                this.writeLine(`${this.promptText.textContent}ls`);
                this.listDirectory(this.currentPath);
                this.updatePrompt();
                this.inputField.focus();
            }
        });
        
        // Also handle right-click on input area
        this.inputField.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            
            // Only auto-ls if input field is empty
            if (this.inputField.value.trim() === '') {
                this.writeLine(`${this.promptText.textContent}ls`);
                this.listDirectory(this.currentPath);
                this.updatePrompt();
                this.inputField.focus();
            }
        });
    }
    
    /**
     * Handle keyboard input
     */
    handleKeyPress(e) {
        switch (e.key) {
            case 'Enter':
                e.preventDefault();
                this.executeCommand();
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                this.handleHistoryUp();
                break;
                
            case 'ArrowDown':
                e.preventDefault();
                this.handleHistoryDown();
                break;
                
            case 'Tab':
                e.preventDefault();
                // TODO: Implement tab completion
                break;
                
            case 'c':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.handleCtrlC();
                }
                break;
        }
    }
    
    /**
     * Handle Ctrl+C
     */
    handleCtrlC() {
        this.writeLine(`${this.promptText.textContent}${this.inputField.value}`);
        this.writeLine('^C');
        this.inputField.value = '';
        this.inputField.focus();
    }
    
    /**
     * Handle history navigation
     */
    handleHistoryUp() {
        if (this.commandHistory.length > 0) {
            if (this.historyIndex === -1) {
                this.historyIndex = this.commandHistory.length - 1;
            } else if (this.historyIndex > 0) {
                this.historyIndex--;
            }
            this.inputField.value = this.commandHistory[this.historyIndex];
        }
    }
    
    handleHistoryDown() {
        if (this.historyIndex >= 0) {
            if (this.historyIndex < this.commandHistory.length - 1) {
                this.historyIndex++;
                this.inputField.value = this.commandHistory[this.historyIndex];
            } else {
                this.historyIndex = -1;
                this.inputField.value = '';
            }
        }
    }
    
    /**
     * Execute the current command
     */
    async executeCommand() {
        const command = this.inputField.value.trim();
        
        // Echo the command
        this.writeLine(`${this.promptText.textContent}${command}`);
        
        // Clear input
        this.inputField.value = '';
        
        // Add to history if not empty and not duplicate
        if (command && command !== this.commandHistory[this.commandHistory.length - 1]) {
            this.commandHistory.push(command);
            if (this.commandHistory.length > 100) {
                this.commandHistory.shift();
            }
        }
        this.historyIndex = -1;
        
        if (!command) {
            this.inputField.focus();
            return;
        }
        
        const [cmd, ...args] = command.split(/\s+/);
        
        try {
            // Check if it's a built-in command
            if (this.builtinCommands[cmd]) {
                await this.builtinCommands[cmd](args);
            } else {
                // Execute as system command
                await this.executeSystemCommand(cmd, args);
            }
        } catch (error) {
            this.writeError(`Error executing command: ${error.message}`);
        }
        
        // Update prompt and focus input
        this.updatePrompt();
        this.inputField.focus();
    }
    
    /**
     * Execute system command via IPC
     */
    async executeSystemCommand(command, args) {
        if (!window.nebula?.terminal?.exec) {
            this.writeError('System command execution not available');
            return;
        }
        
        try {
            const result = await window.nebula.terminal.exec(command, args, {
                cwd: this.currentPath
            });
            
            if (result.stdout) {
                this.writeLine(result.stdout);
            }
            
            if (result.stderr) {
                this.writeError(result.stderr);
            }
            
            if (result.exitCode !== 0 && !result.stdout && !result.stderr) {
                this.writeError(`Command failed with exit code ${result.exitCode}`);
            }
            
        } catch (error) {
            this.writeError(`Failed to execute command: ${error.message}`);
        }
    }
    
    /**
     * Write line to terminal output
     */
    writeLine(text) {
        this.outputArea.appendChild(document.createTextNode(text + '\n'));
        this.outputArea.scrollTop = this.outputArea.scrollHeight;
    }
    
    /**
     * Write error message
     */
    writeError(text) {
        const errorSpan = document.createElement('span');
        errorSpan.style.color = '#ff6b6b';
        errorSpan.textContent = text + '\n';
        this.outputArea.appendChild(errorSpan);
        this.outputArea.scrollTop = this.outputArea.scrollHeight;
    }
    
    /**
     * Clear terminal output
     */
    clearTerminal() {
        this.outputArea.textContent = '';
    }
    
    /**
     * Show help
     */
    showHelp() {
        const helpText = `
Nebula Terminal v2.0 - Enhanced Edition
Built-in Commands:
  help       - Show this help message
  clear      - Clear the terminal screen
  pwd        - Print working directory
  cd <dir>   - Change directory
  ls [dir]   - List directory contents (clickable files!)
  ll [dir]   - List directory contents with details
  cat <file> - Display file contents
  mkdir <dir>- Create directory
  rmdir <dir>- Remove directory
  rm <file>  - Remove file
  touch <file>- Create empty file
  echo <text>- Print text
  date       - Show current date and time
  whoami     - Show current user
  uname      - Show system information
  js <code>  - Execute JavaScript code
  mdr <file> - Open markdown file in reader
  useicons <type> - Set icon style (emoji|text)
  debug <cmd>- Debug commands
  history    - Show command history
  exit       - Close terminal

System Commands:
  Any other command will be executed as a real system command.
  Examples: git status, npm list, python --version, etc.

File Navigation:
  • Click on files in 'ls' output to open them automatically!
  • Right-click on folders for instant cd+ls navigation!
  • Right-click on empty space for quick ls!
  • Images open in image viewer
  • Videos open in media player
  • Text files open in text editor

Customization:
  • useicons emoji - Use emoji file icons (🖼️, 🎵, 📁)
  • useicons text  - Use text file icons (IMG, AUD, JS)
        `;
        this.writeLine(helpText);
    }
    
    /**
     * Change directory with proper path resolution
     */
    async changeDirectory(path) {
        if (!path || path === '~') {
            try {
                this.currentPath = await window.nebula.fs.getHomeDir();
                return;
            } catch (error) {
                this.writeError('Failed to get home directory');
                return;
            }
        }
        
        let targetPath;
        if (pathUtils.isAbsolute(path)) {
            targetPath = pathUtils.normalize(path);
        } else {
            // Join current path with relative path, then normalize
            const joined = pathUtils.join(this.currentPath, path);
            targetPath = pathUtils.normalize(joined);
        }
        
        try {
            const exists = await window.nebula.fs.exists(targetPath);
            if (!exists) {
                this.writeError(`cd: ${path}: No such file or directory`);
                return;
            }
            
            const stats = await window.nebula.fs.stat(targetPath);
            if (!stats.isDirectory) {
                this.writeError(`cd: ${path}: Not a directory`);
                return;
            }
            
            // Update current path with the clean, resolved path
            this.currentPath = targetPath;
            
        } catch (error) {
            this.writeError(`cd: ${path}: ${error.message}`);
        }
    }
    
    /**
     * List directory contents
     */
    async listDirectory(path) {
        try {
            const targetPath = pathUtils.isAbsolute(path) ? path : pathUtils.join(this.currentPath, path);
            const exists = await window.nebula.fs.exists(targetPath);
            
            if (!exists) {
                this.writeError(`ls: ${path}: No such file or directory`);
                return;
            }
            
            const stats = await window.nebula.fs.stat(targetPath);
            if (!stats.isDirectory) {
                this.writeError(`ls: ${path}: Not a directory`);
                return;
            }
            
            const items = await window.nebula.fs.readDir(targetPath);
            
            if (items.length === 0) {
                this.writeLine('(empty directory)');
                return;
            }
            
            // Create clickable file listing
            const listContainer = document.createElement('div');
            listContainer.style.cssText = `
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 8px;
                margin: 8px 0;
            `;
            
            for (const item of items) {
                const itemPath = pathUtils.join(targetPath, item);
                let isDirectory = false;
                
                try {
                    const itemStats = await window.nebula.fs.stat(itemPath);
                    isDirectory = itemStats.isDirectory;
                } catch (error) {
                    // Assume it's a file if we can't stat it
                }
                
                const icon = getFileIcon(item, isDirectory, this.iconStyle);
                
                const itemElement = document.createElement('span');
                itemElement.className = `file-item ${isDirectory ? 'directory-item' : 'file-item'}`;
                itemElement.style.cssText = `
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 4px 8px;
                    cursor: pointer;
                    border-radius: 4px;
                    color: ${isDirectory ? '#66d9ef' : '#f8f8f2'};
                    transition: background-color 0.2s;
                    ${isDirectory ? 'border: 1px solid transparent;' : ''}
                `;
                
                itemElement.innerHTML = `${icon} ${item}`;
                
                // Add hover effects with different styles for folders
                itemElement.addEventListener('mouseenter', () => {
                    if (isDirectory) {
                        itemElement.style.backgroundColor = 'rgba(102, 217, 239, 0.15)';
                        itemElement.style.borderColor = 'rgba(102, 217, 239, 0.3)';
                        itemElement.title = 'Left-click to enter, Right-click for quick cd+ls';
                    } else {
                        itemElement.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                        itemElement.title = 'Click to open';
                    }
                });
                
                itemElement.addEventListener('mouseleave', () => {
                    itemElement.style.backgroundColor = 'transparent';
                    if (isDirectory) {
                        itemElement.style.borderColor = 'transparent';
                    }
                });
                
                // Add click handler for file/directory navigation
                itemElement.addEventListener('click', async () => {
                    await this.handleFileClick(item, itemPath, isDirectory);
                });
                
                // Add right-click handler for folders (instant cd + ls)
                if (isDirectory) {
                    itemElement.addEventListener('contextmenu', async (e) => {
                        e.preventDefault();
                        e.stopPropagation(); // Prevent the general right-click handler
                        
                        // Show command with clean path
                        this.writeLine(`${this.promptText.textContent}cd ${item} && ls`);
                        
                        // Perform the navigation
                        await this.changeDirectory(item);
                        
                        // Update prompt to show new clean path
                        this.updatePrompt();
                        
                        // List contents of new directory
                        await this.listDirectory(this.currentPath);
                        
                        this.inputField.focus();
                    });
                }
                
                listContainer.appendChild(itemElement);
            }
            
            this.outputArea.appendChild(listContainer);
            this.outputArea.scrollTop = this.outputArea.scrollHeight;
            
        } catch (error) {
            this.writeError(`ls: ${error.message}`);
        }
    }
    
    /**
     * Handle clicking on files/directories in ls output
     */
    async handleFileClick(name, path, isDirectory) {
        if (isDirectory) {
            // Navigate to directory
            this.writeLine(`cd ${name}`);
            await this.changeDirectory(name);
            this.updatePrompt();
        } else {
            // Open file based on type
            this.writeLine(`Opening: ${name}`);
            await this.openFile(name, path);
        }
        
        // Always refocus input after click
        this.inputField.focus();
    }
    
    /**
     * Open file in appropriate viewer
     */
    async openFile(name, path) {
        const ext = pathUtils.extname(name).toLowerCase();
        
        // Image files
        if (['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg', '.ico', '.webp'].includes(ext)) {
            this.openImageViewer(name, path);
        }
        // Audio files
        else if (['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'].includes(ext)) {
            this.openMediaPlayer(name, path, 'audio');
        }
        // Video files
        else if (['.mp4', '.avi', '.mov', '.mkv', '.webm', '.ogv', '.m4v'].includes(ext)) {
            this.openMediaPlayer(name, path, 'video');
        }
        // Text files
        else if (['.txt', '.md', '.json', '.js', '.css', '.html', '.xml', '.yaml', '.yml', '.log'].includes(ext)) {
            this.openTextViewer(name, path);
        }
        // Default: try to show as text
        else {
            this.writeLine(`Attempting to open ${name} as text file...`);
            this.openTextViewer(name, path);
        }
    }
    
    /**
     * Open image viewer
     */
    openImageViewer(name, path) {
        this.writeLine(`Opening image viewer for: ${name}`);
        try {
            if (window.ImageViewer) {
                new window.ImageViewer(name, path);
            } else {
                this.writeLine('Error: Image viewer not available');
            }
        } catch (error) {
            console.error('Error opening image viewer:', error);
            this.writeLine('Error: Image viewer not available');
        }
    }
    
    /**
     * Open media player
     */
    openMediaPlayer(name, path, type) {
        this.writeLine(`Opening ${type} player for: ${name}`);
        try {
            if (window.MediaPlayer) {
                new window.MediaPlayer(name, path, type);
            } else {
                this.writeLine('Error: Media player not available');
            }
        } catch (error) {
            console.error('Error opening media player:', error);
            this.writeLine('Error: Media player not available');
        }
    }
    
    /**
     * Open text viewer
     */
    async openTextViewer(name, path) {
        try {
            const content = await window.nebula.fs.readFile(path);
            this.writeLine(`Content of ${name}:`);
            this.writeLine('---');
            this.writeLine(content);
            this.writeLine('---');
        } catch (error) {
            this.writeError(`Cannot read file: ${error.message}`);
        }
    }
    
    /**
     * NEW: Set icon style (emoji, text, or none)
     */
    setIconStyle(style) {
        if (!style) {
            this.writeLine('Usage: useicons <emoji|text|none>');
            this.writeLine(`Current setting: ${this.iconStyle}`);
            this.writeLine('  emoji - Use emoji icons (default) 🖼️ 🎵 📁');
            this.writeLine('  text  - Use text-based icons IMG AUD DIR');
            this.writeLine('  none  - No icons, just filenames (minimalist)');
            return;
        }
        
        const normalizedStyle = style.toLowerCase();
        if (normalizedStyle === 'emoji' || normalizedStyle === 'text' || normalizedStyle === 'none') {
            this.iconStyle = normalizedStyle;
            localStorage.setItem('nebula-terminal-icons', normalizedStyle);
            this.writeLine(`Icon style set to: ${normalizedStyle}`);
            this.writeLine('Use "ls" to see the new style in action!');
        } else {
            this.writeError('Invalid icon style. Use "emoji", "text", or "none"');
        }
    }
    
    /**
     * List directory with detailed info
     */
    async listDirectoryLong(path) {
        try {
            const targetPath = pathUtils.isAbsolute(path) ? path : pathUtils.join(this.currentPath, path);
            const exists = await window.nebula.fs.exists(targetPath);
            
            if (!exists) {
                this.writeError(`ll: ${path}: No such file or directory`);
                return;
            }
            
            const items = await window.nebula.fs.readDir(targetPath);
            
            if (items.length === 0) {
                this.writeLine('(empty directory)');
                return;
            }
            
            this.writeLine('Type Size     Modified             Name');
            this.writeLine('---- -------- -------------------- ----');
            
            for (const item of items) {
                const itemPath = pathUtils.join(targetPath, item);
                
                try {
                    const stats = await window.nebula.fs.stat(itemPath);
                    const type = stats.isDirectory ? 'DIR ' : 'FILE';
                    const size = stats.isDirectory ? '     ---' : String(stats.size).padStart(8);
                    const modified = new Date(stats.mtime).toLocaleString();
                    const icon = getFileIcon(item, stats.isDirectory, this.iconStyle);
                    
                    this.writeLine(`${type} ${size} ${modified} ${icon} ${item}`);
                } catch (error) {
                    this.writeLine(`ERR      ??? ??? ${item} (cannot stat)`);
                }
            }
            
        } catch (error) {
            this.writeError(`ll: ${error.message}`);
        }
    }
    
    /**
     * Show file contents
     */
    async showFile(filename) {
        if (!filename) {
            this.writeError('cat: missing filename');
            return;
        }
        
        try {
            const filePath = pathUtils.isAbsolute(filename) ? 
                filename : pathUtils.join(this.currentPath, filename);
            
            const exists = await window.nebula.fs.exists(filePath);
            if (!exists) {
                this.writeError(`cat: ${filename}: No such file or directory`);
                return;
            }
            
            const stats = await window.nebula.fs.stat(filePath);
            if (stats.isDirectory) {
                this.writeError(`cat: ${filename}: Is a directory`);
                return;
            }
            
            const content = await window.nebula.fs.readFile(filePath);
            this.writeLine(content);
            
        } catch (error) {
            this.writeError(`cat: ${error.message}`);
        }
    }
    
    /**
     * Create directory
     */
    async makeDirectory(dirname) {
        if (!dirname) {
            this.writeError('mkdir: missing directory name');
            return;
        }
        
        try {
            const dirPath = pathUtils.isAbsolute(dirname) ? 
                dirname : pathUtils.join(this.currentPath, dirname);
            
            await window.nebula.fs.mkdir(dirPath, { recursive: true });
            this.writeLine(`Created directory: ${dirname}`);
            
        } catch (error) {
            this.writeError(`mkdir: ${error.message}`);
        }
    }
    
    /**
     * Remove directory
     */
    async removeDirectory(dirname) {
        if (!dirname) {
            this.writeError('rmdir: missing directory name');
            return;
        }
        
        try {
            const dirPath = pathUtils.isAbsolute(dirname) ? 
                dirname : pathUtils.join(this.currentPath, dirname);
            
            await window.nebula.fs.rmdir(dirPath);
            this.writeLine(`Removed directory: ${dirname}`);
            
        } catch (error) {
            this.writeError(`rmdir: ${error.message}`);
        }
    }
    
    /**
     * Remove file
     */
    async removeFile(filename) {
        if (!filename) {
            this.writeError('rm: missing filename');
            return;
        }
        
        try {
            const filePath = pathUtils.isAbsolute(filename) ? 
                filename : pathUtils.join(this.currentPath, filename);
            
            await window.nebula.fs.unlink(filePath);
            this.writeLine(`Removed file: ${filename}`);
            
        } catch (error) {
            this.writeError(`rm: ${error.message}`);
        }
    }
    
    /**
     * Create empty file
     */
    async touchFile(filename) {
        if (!filename) {
            this.writeError('touch: missing filename');
            return;
        }
        
        try {
            const filePath = pathUtils.isAbsolute(filename) ? 
                filename : pathUtils.join(this.currentPath, filename);
            
            await window.nebula.fs.writeFile(filePath, '');
            this.writeLine(`Created file: ${filename}`);
            
        } catch (error) {
            this.writeError(`touch: ${error.message}`);
        }
    }
    
    /**
     * Show current user
     */
    showWhoAmI() {
        const env = window.nebula?.terminal?.getEnv() || {};
        this.writeLine(env.USER || 'nebula-user');
    }
    
    /**
     * Show system info
     */
    showSystemInfo() {
        const platform = window.nebula?.system?.platform || 'unknown';
        const browser = this.getBrowserInfo();
        const screen = this.getScreenInfo();
        
        this.writeLine(`NebulaDesktop 2.0`);
        this.writeLine(`Platform: ${platform}`);
        this.writeLine(`Browser: ${browser}`);
        this.writeLine(`Screen: ${screen}`);
        this.writeLine(`Uptime: ${this.getUptime()}`);
        this.writeLine(`Memory: ${this.getMemoryInfo()}`);
    }
    
    /**
     * Get browser information
     */
    getBrowserInfo() {
        const ua = navigator.userAgent;
        if (ua.includes('Chrome')) {
            const match = ua.match(/Chrome\/(\d+)/);
            return match ? `Chrome ${match[1]}` : 'Chrome';
        } else if (ua.includes('Firefox')) {
            const match = ua.match(/Firefox\/(\d+)/);
            return match ? `Firefox ${match[1]}` : 'Firefox';
        } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
            const match = ua.match(/Version\/(\d+)/);
            return match ? `Safari ${match[1]}` : 'Safari';
        } else if (ua.includes('Edg')) {
            const match = ua.match(/Edg\/(\d+)/);
            return match ? `Edge ${match[1]}` : 'Edge';
        }
        return 'Unknown Browser';
    }
    
    /**
     * Get screen information
     */
    getScreenInfo() {
        const width = screen.width;
        const height = screen.height;
        const colorDepth = screen.colorDepth;
        return `${width}x${height} ${colorDepth}bit`;
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
            this.writeError(`JS Error: ${error.message}`);
        }
    }
    
    /**
     * Show system fetch info (neofetch style)
     */
    showNFetch() {
        const lines = [
            '    _   _      _           _       ',
            '   | \\ | |    | |         | |      ',
            '   |  \\| | ___| |__  _   _| | __ _ ',
            '   | . ` |/ _ \\ \'_ \\| | | | |/ _` |',
            '   | |\\  |  __/ |_) | |_| | | (_| |',
            '   |_| \\_|\\___|_.__/ \\__,_|_|\\__,_|',
            '',
            `   OS: NebulaDesktop ${window.nebula?.system?.platform || 'unknown'}`,
            `   Browser: ${this.getBrowserInfo()}`,
            `   Screen: ${this.getScreenInfo()}`,
            `   Uptime: ${this.getUptime()}`,
            `   Memory: ${this.getMemoryInfo()}`,
            `   Terminal: Enhanced Nebula Terminal v2.0`,
            ''
        ];
        
        lines.forEach(line => this.writeLine(line));
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
            if (window.windowManager && window.MarkdownReader) {
                const windowId = window.windowManager.createWindow({
                    title: `Markdown Reader - ${filename}`,
                    width: 900,
                    height: 700,
                    hasTabBar: false,
                    resizable: true
                });

                // Create markdown reader app instance
                const markdownReader = new window.MarkdownReader(content, filename);
                window.windowManager.loadApp(windowId, markdownReader);
                
                this.writeLine(`Opened ${filename} in Markdown Reader`);
            } else {
                // Fallback: show content in terminal
                this.writeLine(`Content of ${filename}:`);
                this.writeLine('---');
                this.writeLine(content);
                this.writeLine('---');
            }

        } catch (error) {
            this.writeError(`Cannot open markdown file: ${error.message}`);
        }
    }
    
    /**
     * Debug command
     */
    debugCommand(args) {
        const cmd = args[0];
        
        switch (cmd) {
            case 'help':
                this.writeLine('Debug commands:');
                this.writeLine('  debug vars  - Show environment variables');
                this.writeLine('  debug fs    - Show file system API status');
                this.writeLine('  debug sys   - Show system API status');
                break;
                
            case 'vars':
                const env = window.nebula?.terminal?.getEnv() || {};
                this.writeLine('Environment variables:');
                Object.entries(env).forEach(([key, value]) => {
                    this.writeLine(`  ${key}=${value}`);
                });
                break;
                
            case 'fs':
                this.writeLine('File System API Status:');
                this.writeLine(`  Available: ${window.nebula?.fs ? 'Yes' : 'No'}`);
                if (window.nebula?.fs) {
                    this.writeLine(`  Current Path: ${this.currentPath}`);
                    this.writeLine(`  Methods: ${Object.keys(window.nebula.fs).join(', ')}`);
                }
                break;
                
            case 'sys':
                this.writeLine('System API Status:');
                this.writeLine(`  Available: ${window.nebula?.system ? 'Yes' : 'No'}`);
                this.writeLine(`  Terminal API: ${window.nebula?.terminal ? 'Yes' : 'No'}`);
                this.writeLine(`  Window Manager: ${window.windowManager ? 'Yes' : 'No'}`);
                break;
                
            default:
                this.writeLine('Usage: debug <command>');
                this.writeLine('Use "debug help" for available commands');
        }
    }
    
    /**
     * Show command history
     */
    showHistory() {
        if (this.commandHistory.length === 0) {
            this.writeLine('No command history');
            return;
        }
        
        this.writeLine('Command History:');
        this.commandHistory.forEach((cmd, index) => {
            this.writeLine(`${index + 1}: ${cmd}`);
        });
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
     * Get app title
     */
    getTitle() {
        return 'Nebula Terminal';
    }
    
    /**
     * Get app icon
     */
    getIcon() {
        return '💻';
    }
    
    /**
     * Cleanup when terminal is closed
     */
    cleanup() {
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
        return '📖';
    }

    cleanup() {
        console.log('Markdown reader cleaned up');
    }
}

// Make classes available globally
window.NebulaTerminal = NebulaTerminal;
window.MarkdownReader = MarkdownReader;