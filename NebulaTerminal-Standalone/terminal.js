// Standalone Nebula Terminal - Adapted from NebulaDesktop
// Real terminal with separate input/output areas

// Path utilities for client-side path handling
const pathUtils = {
    join: (...paths) => {
        const cleanPaths = paths.filter(p => p && p !== '');
        if (cleanPaths.length === 0) return '/';

        let result = cleanPaths.join('/');
        result = result.replace(/\/+/g, '/');

        if (result.length > 1 && result.endsWith('/')) {
            result = result.slice(0, -1);
        }

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

// File type icons (using emojis)
const nerdIcons = {
    folder: '📁',
    folderOpen: '📂',
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
    '.html': '🌐',
    '.css': '🎨',
    '.scss': '🎨',
    '.less': '🎨',
    '.vue': '💚',
    '.svelte': '🧡',
    '.json': '📋',
    '.xml': '📄',
    '.yaml': '📄',
    '.yml': '📄',
    '.toml': '📄',
    '.csv': '📊',
    '.sql': '🗃️',
    '.md': '📝',
    '.txt': '📄',
    '.pdf': '📕',
    '.doc': '📘',
    '.docx': '📘',
    '.xls': '📗',
    '.xlsx': '📗',
    '.ppt': '📙',
    '.pptx': '📙',
    '.png': '🖼️',
    '.jpg': '🖼️',
    '.jpeg': '🖼️',
    '.gif': '🎞️',
    '.svg': '🖼️',
    '.ico': '🖼️',
    '.bmp': '🖼️',
    '.webp': '🖼️',
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
    '.zip': '📦',
    '.tar': '📦',
    '.gz': '📦',
    '.rar': '📦',
    '.7z': '📦',
    '.gitignore': '🙈',
    '.env': '🔐',
    '.config': '⚙️',
    '.conf': '⚙️',
    '.ini': '⚙️',
    '.exe': '⚙️',
    '.app': '📱',
    '.deb': '📦',
    '.rpm': '📦',
    default: '📄'
};

// Get icon for file/folder - supports emoji, text, and none modes
function getFileIcon(name, isDirectory, iconMode = 'emoji') {
    if (iconMode === 'none') {
        return '';
    }

    if (iconMode === 'text') {
        if (isDirectory) return 'DIR';

        const ext = pathUtils.extname(name).toLowerCase();
        const textIcons = {
            '.js': 'JS', '.ts': 'TS', '.py': 'PY', '.java': 'JAVA',
            '.cpp': 'C++', '.c': 'C', '.php': 'PHP', '.rb': 'RB',
            '.go': 'GO', '.rs': 'RS', '.html': 'HTML', '.css': 'CSS',
            '.json': 'JSON', '.md': 'MD', '.txt': 'TXT',
            '.png': 'IMG', '.jpg': 'IMG', '.jpeg': 'IMG', '.gif': 'IMG',
            '.mp4': 'VID', '.avi': 'VID', '.mp3': 'AUD', '.wav': 'AUD',
            '.zip': 'ZIP', '.tar': 'TAR', '.pdf': 'PDF'
        };
        return textIcons[ext] || 'FILE';
    } else {
        if (isDirectory) return nerdIcons.folder;

        const lowerName = name.toLowerCase();
        if (lowerName === 'readme.md' || lowerName === 'readme.txt' || lowerName === 'readme') return '📖';
        if (lowerName === 'package.json') return '📦';
        if (lowerName === 'dockerfile') return '🐳';
        if (lowerName.startsWith('.git')) return '🌿';
        if (lowerName === 'makefile') return '🔨';

        const ext = pathUtils.extname(name).toLowerCase();
        return nerdIcons[ext] || nerdIcons.default;
    }
}

class NebulaTerminal {
    constructor(containerElement) {
        this.container = containerElement;
        this.outputArea = null;
        this.inputLine = null;
        this.inputField = null;
        this.currentPath = null;
        this.commandHistory = [];
        this.historyIndex = -1;
        this.iconStyle = localStorage.getItem('nebula-terminal-icons') || 'emoji';

        // Built-in commands
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
            useicons: (args) => this.setIconStyle(args[0]),
            debug: (args) => this.debugCommand(args),
            exit: () => window.close(),
            history: () => this.showHistory(),
            imginfo: (args) => this.showImageInfo(args[0])
        };

        this.init();
    }

    async init() {
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

        // Render terminal
        this.render();

        console.log(`Terminal initialized, cwd: ${this.currentPath}`);
    }

    render() {
        this.container.className = 'terminal-container';

        // Create output area (scrollable)
        this.outputArea = document.createElement('div');
        this.outputArea.className = 'terminal-output';

        // Create input line (fixed at bottom)
        this.inputLine = document.createElement('div');
        this.inputLine.className = 'terminal-input-line';

        // Create prompt text
        this.promptText = document.createElement('span');
        this.promptText.className = 'terminal-prompt';
        this.updatePrompt();

        // Create input field
        this.inputField = document.createElement('input');
        this.inputField.type = 'text';
        this.inputField.className = 'terminal-input';

        this.inputLine.appendChild(this.promptText);
        this.inputLine.appendChild(this.inputField);

        this.container.appendChild(this.outputArea);
        this.container.appendChild(this.inputLine);

        // Initialize terminal after DOM is ready
        setTimeout(() => {
            this.initTerminal();
        }, 100);
    }

    initTerminal() {
        this.writeLine('Nebula Terminal v2.0 - Standalone Edition');
        this.writeLine('Type "help" for available commands\n');

        this.inputField.focus();
        this.setupInputHandling();
    }

    updatePrompt() {
        if (this.promptText) {
            this.promptText.textContent = `nebula@desktop:${this.getShortPath()}$ `;
        }
    }

    getShortPath() {
        if (this.currentPath && this.currentPath.includes('/home/')) {
            const homeDir = this.currentPath.match(/^\/home\/[^\/]+/);
            if (homeDir && this.currentPath.startsWith(homeDir[0])) {
                return this.currentPath.replace(homeDir[0], '~');
            }
        }
        return this.currentPath || '~';
    }

    setupInputHandling() {
        this.inputField.addEventListener('keydown', (e) => {
            this.handleKeyPress(e);
        });

        this.outputArea.addEventListener('click', () => {
            this.inputField.focus();
        });

        // Right-click to auto-ls when input is empty
        this.outputArea.addEventListener('contextmenu', (e) => {
            const clickedItem = e.target.closest('.file-item, [data-name]');
            if (clickedItem) return;

            e.preventDefault();

            if (this.inputField.value.trim() === '') {
                this.writeLine(`${this.promptText.textContent}ls`);
                this.listDirectory(this.currentPath);
                this.updatePrompt();
                this.inputField.focus();
            }
        });

        this.inputField.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (this.inputField.value.trim() === '') {
                this.writeLine(`${this.promptText.textContent}ls`);
                this.listDirectory(this.currentPath);
                this.updatePrompt();
                this.inputField.focus();
            }
        });
    }

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
                break;

            case 'c':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.handleCtrlC();
                }
                break;
        }
    }

    handleCtrlC() {
        this.writeLine(`${this.promptText.textContent}${this.inputField.value}`);
        this.writeLine('^C');
        this.inputField.value = '';
        this.inputField.focus();
    }

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

    async executeCommand() {
        const command = this.inputField.value.trim();

        this.writeLine(`${this.promptText.textContent}${command}`);
        this.inputField.value = '';

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
            if (this.builtinCommands[cmd]) {
                await this.builtinCommands[cmd](args);
            } else {
                await this.executeSystemCommand(cmd, args);
            }
        } catch (error) {
            this.writeError(`Error executing command: ${error.message}`);
        }

        this.updatePrompt();
        this.inputField.focus();
    }

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

    writeLine(text) {
        this.outputArea.appendChild(document.createTextNode(text + '\n'));
        this.outputArea.scrollTop = this.outputArea.scrollHeight;
    }

    writeError(text) {
        const errorSpan = document.createElement('span');
        errorSpan.style.color = '#ff6b6b';
        errorSpan.textContent = text + '\n';
        this.outputArea.appendChild(errorSpan);
        this.outputArea.scrollTop = this.outputArea.scrollHeight;
    }

    clearTerminal() {
        this.outputArea.textContent = '';
    }

    showHelp() {
        const commands = [
            '📋 Nebula Terminal Commands:',
            '',
            '📁 File Operations:',
            '  ls [dir]     - List directory contents',
            '  ll [dir]     - List with details',
            '  cd <dir>     - Change directory',
            '  pwd          - Show current directory',
            '  cat <file>   - Show file contents',
            '  mkdir <dir>  - Create directory',
            '  rmdir <dir>  - Remove directory',
            '  rm <file>    - Remove file',
            '  touch <file> - Create empty file',
            '',
            '🖼️ Image Commands:',
            '  imginfo <file> - Show detailed image information',
            '',
            '⚙️ System Commands:',
            '  useicons <type> - Switch icon style (emoji/text/none)',
            '  clear        - Clear terminal',
            '  history      - Show command history',
            '  help         - Show this help',
            '  exit         - Close terminal',
            '',
            '💻 Advanced:',
            '  js <code>    - Execute JavaScript',
            '  debug <cmd>  - Debug commands',
            '  nfetch       - System information',
            '',
            '💡 Tips:',
            '  - Click on files in listings to view them',
            '  - Right-click on folders for quick cd+ls',
            '  - Right-click on empty space for quick ls',
            '  - Arrow keys navigate command history',
            '  - Any other command runs as a system command'
        ];

        commands.forEach(line => this.writeLine(line));
    }

    async showImageInfo(filename) {
        if (!filename) {
            this.writeLine('Usage: imginfo <filename>');
            return;
        }

        try {
            const filePath = pathUtils.isAbsolute(filename) ?
                filename : pathUtils.join(this.currentPath, filename);

            const exists = await window.nebula.fs.exists(filePath);
            if (!exists) {
                this.writeError(`Image not found: ${filename}`);
                return;
            }

            const stats = await window.nebula.fs.stat(filePath);
            const ext = pathUtils.extname(filename).toLowerCase();

            this.writeLine(`📷 Image Information: ${filename}`);
            this.writeLine('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            this.writeLine(`📂 Path: ${filePath}`);
            this.writeLine(`📏 File Size: ${this.formatFileSize(stats.size)}`);
            this.writeLine(`📅 Created: ${new Date(stats.birthtime).toLocaleString()}`);
            this.writeLine(`📝 Modified: ${new Date(stats.mtime).toLocaleString()}`);
            this.writeLine(`🎨 Format: ${ext.substring(1).toUpperCase()}`);
            this.writeLine('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        } catch (error) {
            this.writeError(`Cannot get image info: ${error.message}`);
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

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

            this.currentPath = targetPath;

        } catch (error) {
            this.writeError(`cd: ${path}: ${error.message}`);
        }
    }

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

                itemElement.addEventListener('mouseenter', () => {
                    if (isDirectory) {
                        itemElement.style.backgroundColor = 'rgba(102, 217, 239, 0.15)';
                        itemElement.style.borderColor = 'rgba(102, 217, 239, 0.3)';
                        itemElement.title = 'Left-click to enter, Right-click for quick cd+ls';
                    } else {
                        itemElement.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                        itemElement.title = 'Click to view file contents';
                    }
                });

                itemElement.addEventListener('mouseleave', () => {
                    itemElement.style.backgroundColor = 'transparent';
                    if (isDirectory) {
                        itemElement.style.borderColor = 'transparent';
                    }
                });

                itemElement.addEventListener('click', async () => {
                    await this.handleFileClick(item, itemPath, isDirectory);
                });

                if (isDirectory) {
                    itemElement.addEventListener('contextmenu', async (e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        this.writeLine(`${this.promptText.textContent}cd ${item} && ls`);
                        await this.changeDirectory(item);
                        this.updatePrompt();
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

    async handleFileClick(name, path, isDirectory) {
        if (isDirectory) {
            this.writeLine(`cd ${name}`);
            await this.changeDirectory(name);
            this.updatePrompt();
        } else {
            this.writeLine(`cat ${name}`);
            await this.showFile(name);
        }

        this.inputField.focus();
    }

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

    showWhoAmI() {
        const env = window.nebula?.terminal?.getEnv() || {};
        this.writeLine(env.USER || 'user');
    }

    showSystemInfo() {
        const platform = window.nebula?.system?.platform || 'unknown';
        const browser = this.getBrowserInfo();
        const screen = this.getScreenInfo();

        this.writeLine(`Nebula Terminal Standalone 1.0`);
        this.writeLine(`Platform: ${platform}`);
        this.writeLine(`Browser: ${browser}`);
        this.writeLine(`Screen: ${screen}`);
        this.writeLine(`Uptime: ${this.getUptime()}`);
    }

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
        }
        return 'Electron';
    }

    getScreenInfo() {
        const width = screen.width;
        const height = screen.height;
        const colorDepth = screen.colorDepth;
        return `${width}x${height} ${colorDepth}bit`;
    }

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

    executeJS(code) {
        if (!code) {
            this.writeLine('Usage: js <javascript-code>');
            this.writeLine('Example: js console.log("Hello World")');
            return;
        }

        try {
            const originalLog = console.log;
            let output = '';
            console.log = (...args) => {
                output += args.map(arg =>
                    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                ).join(' ') + '\n';
            };

            const result = Function('"use strict"; return (' + code + ')')();
            console.log = originalLog;

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

    showNFetch() {
        const lines = [
            '    _   _      _           _       ',
            '   | \\ | |    | |         | |      ',
            '   |  \\| | ___| |__  _   _| | __ _ ',
            '   | . ` |/ _ \\ \'_ \\| | | | |/ _` |',
            '   | |\\  |  __/ |_) | |_| | | (_| |',
            '   |_| \\_|\\___|_.__/ \\__,_|_|\\__,_|',
            '',
            `   OS: ${window.nebula?.system?.platform || 'unknown'}`,
            `   Browser: ${this.getBrowserInfo()}`,
            `   Screen: ${this.getScreenInfo()}`,
            `   Uptime: ${this.getUptime()}`,
            `   Terminal: Nebula Terminal Standalone v1.0`,
            ''
        ];

        lines.forEach(line => this.writeLine(line));
    }

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
                break;

            default:
                this.writeLine('Usage: debug <command>');
                this.writeLine('Use "debug help" for available commands');
        }
    }

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
}

// Initialize terminal when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    window.nebulaStartTime = Date.now();
    const container = document.getElementById('terminal-app');
    if (container) {
        new NebulaTerminal(container);
    }
});
