// NebulaQBasic Terminal - QBasic Compiler & Runtime
// Based on NebulaApp-Single.js template
// Integrates qbjc compiler with xterm.js terminal for authentic QBasic experience

class NebulaQBasicTerminal {
    constructor() {
        this.windowId = null;
        this.terminal = null;
        this.editor = null;
        this.currentCode = '';
        this.isRunning = false;

        // Only auto-init if explicitly requested (not on script load)
        if (window.QBTERMINAL_AUTO_INIT) {
            this.init();
        }
    }

    async init() {
        // Wait for WindowManager to be available
        if (!window.windowManager) {
            console.log('QBTerminal: Waiting for WindowManager...');
            await this.waitForWindowManager();
        }

        // Create window with proper dimensions for terminal
        this.windowId = window.windowManager.createWindow({
            title: 'QBasic Terminal',
            width: 1000,
            height: 700,
            resizable: true,
            maximizable: true,
            minimizable: true
        });

        // Load this app into the window
        window.windowManager.loadApp(this.windowId, this);

        console.log(`QBasic Terminal initialized with window ${this.windowId}`);
    }

    async waitForWindowManager() {
        return new Promise((resolve) => {
            const checkWM = () => {
                if (window.windowManager) {
                    resolve();
                } else {
                    setTimeout(checkWM, 100);
                }
            };
            checkWM();
        });
    }

    /**
     * Render the QBasic Terminal UI
     */
    render() {
        const container = document.createElement('div');
        container.className = 'qbterminal-container';
        container.style.cssText = `
            width: 100%;
            height: 100%;
            background: var(--nebula-bg-primary);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            font-family: var(--nebula-font-family);
        `;

        // Create main sections
        const toolbar = this.createToolbar();
        const editorArea = this.createEditorArea();
        const terminalArea = this.createTerminalArea();
        const statusBar = this.createStatusBar();

        // Assemble the UI
        container.appendChild(toolbar);
        container.appendChild(editorArea);
        container.appendChild(terminalArea);
        container.appendChild(statusBar);

        // Initialize after UI is created
        setTimeout(() => {
            this.setupEventListeners();
            this.initializeEditor();
            this.initializeTerminal();
            this.loadWelcomeMessage();
        }, 0);

        return container;
    }

    /**
     * Create the toolbar with QBasic controls
     */
    createToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'qbterminal-toolbar';
        toolbar.style.cssText = `
            height: 48px;
            background: var(--nebula-surface);
            border-bottom: 1px solid var(--nebula-border);
            display: flex;
            align-items: center;
            padding: 0 16px;
            gap: 8px;
            flex-shrink: 0;
        `;

        toolbar.innerHTML = `
            <button class="toolbar-btn" id="run-btn" title="Run QBasic Program (F5)">
                <span class="material-symbols-outlined">play_arrow</span>
            </button>

            <button class="toolbar-btn" id="stop-btn" title="Stop Execution">
                <span class="material-symbols-outlined">stop</span>
            </button>

            <div class="toolbar-separator"></div>

            <button class="toolbar-btn" id="open-btn" title="Open .BAS File">
                <span class="material-symbols-outlined">folder_open</span>
            </button>

            <button class="toolbar-btn" id="save-btn" title="Save .BAS File">
                <span class="material-symbols-outlined">save</span>
            </button>

            <div class="toolbar-separator"></div>

            <button class="toolbar-btn" id="clear-terminal-btn" title="Clear Terminal">
                <span class="material-symbols-outlined">clear_all</span>
            </button>

            <button class="toolbar-btn" id="help-btn" title="QBasic Help">
                <span class="material-symbols-outlined">help</span>
            </button>

            <div class="toolbar-title" style="margin-left: auto; font-weight: 500; color: var(--nebula-text-primary);">
                QBasic Terminal - Powered by qbjc
            </div>
        `;

        this.addToolbarStyles();
        return toolbar;
    }

    /**
     * Create the Monaco editor area for QBasic code
     */
    createEditorArea() {
        const editorArea = document.createElement('div');
        editorArea.className = 'qbterminal-editor';
        editorArea.id = 'qb-editor-container';
        editorArea.style.cssText = `
            height: 40%;
            background: var(--nebula-bg-primary);
            border-bottom: 1px solid var(--nebula-border);
            position: relative;
        `;

        return editorArea;
    }

    /**
     * Create the xterm.js terminal area
     */
    createTerminalArea() {
        const terminalArea = document.createElement('div');
        terminalArea.className = 'qbterminal-terminal';
        terminalArea.id = 'qb-terminal-container';
        terminalArea.style.cssText = `
            flex: 1;
            background: #000;
            position: relative;
            overflow: hidden;
        `;

        return terminalArea;
    }

    /**
     * Create the status bar
     */
    createStatusBar() {
        const statusBar = document.createElement('div');
        statusBar.className = 'qbterminal-status';
        statusBar.style.cssText = `
            height: 24px;
            background: var(--nebula-surface);
            border-top: 1px solid var(--nebula-border);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 16px;
            font-size: 12px;
            color: var(--nebula-text-secondary);
            flex-shrink: 0;
        `;

        statusBar.innerHTML = `
            <span class="status-left" id="status-info">Ready - Type QBasic code above and press F5 to run</span>
            <span class="status-right" id="status-details">qbjc v0.1.2</span>
        `;

        return statusBar;
    }

    /**
     * Add CSS styles for toolbar buttons
     */
    addToolbarStyles() {
        if (document.querySelector('#qbterminal-toolbar-styles')) return;

        const style = document.createElement('style');
        style.id = 'qbterminal-toolbar-styles';
        style.textContent = `
            .qbterminal-toolbar .toolbar-btn {
                width: 36px;
                height: 36px;
                border: 1px solid var(--nebula-border);
                background: var(--nebula-bg-secondary);
                color: var(--nebula-text-primary);
                border-radius: var(--nebula-radius-md);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: var(--nebula-transition);
            }

            .qbterminal-toolbar .toolbar-btn:hover {
                background: var(--nebula-surface-hover);
                border-color: var(--nebula-border-hover);
            }

            .qbterminal-toolbar .toolbar-btn:active {
                background: var(--nebula-surface-active);
            }

            .qbterminal-toolbar .toolbar-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .qbterminal-toolbar .toolbar-separator {
                width: 1px;
                height: 24px;
                background: var(--nebula-border);
                margin: 0 8px;
            }

            .qbterminal-toolbar .material-symbols-outlined {
                font-size: 18px;
            }

            /* Terminal styling */
            .xterm-viewport {
                background: #000 !important;
            }

            .xterm-screen {
                background: #000 !important;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Toolbar buttons
        document.getElementById('run-btn')?.addEventListener('click', () => {
            this.runProgram();
        });

        document.getElementById('stop-btn')?.addEventListener('click', () => {
            this.stopProgram();
        });

        document.getElementById('open-btn')?.addEventListener('click', () => {
            this.openFile();
        });

        document.getElementById('save-btn')?.addEventListener('click', () => {
            this.saveFile();
        });

        document.getElementById('clear-terminal-btn')?.addEventListener('click', () => {
            this.clearTerminal();
        });

        document.getElementById('help-btn')?.addEventListener('click', () => {
            this.showHelp();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            const windowElement = document.getElementById(this.windowId);
            if (!windowElement || !windowElement.contains(document.activeElement)) {
                return;
            }

            if (e.key === 'F5' && !e.ctrlKey) {
                e.preventDefault();
                this.runProgram();
            }

            if (e.ctrlKey && e.key === 'o') {
                e.preventDefault();
                this.openFile();
            }

            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveFile();
            }
        });
    }

    /**
     * Initialize Monaco editor for QBasic
     */
    async initializeEditor() {
        try {
            // Load Monaco
            if (typeof monaco === 'undefined') {
                await this.loadMonaco();
            }

            // Create editor
            const container = document.getElementById('qb-editor-container');
            if (!container) return;

            this.editor = monaco.editor.create(container, {
                value: this.getDefaultCode(),
                language: 'plaintext', // We'll enhance this with QBasic syntax later
                theme: 'vs-dark',
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                wordWrap: 'on'
            });

            // Set up change listener
            this.editor.onDidChangeModelContent(() => {
                this.currentCode = this.editor.getValue();
            });

            console.log('Monaco editor initialized for QBasic');

        } catch (error) {
            console.error('Failed to initialize Monaco editor:', error);
            this.updateStatus('Error: Could not initialize editor');
        }
    }

    /**
     * Initialize xterm.js terminal
     */
    async initializeTerminal() {
        try {
            // Load xterm.js if not already loaded
            if (typeof Terminal === 'undefined') {
                await this.loadXTerm();
            }

            const container = document.getElementById('qb-terminal-container');
            if (!container) return;

            // Create terminal
            this.terminal = new Terminal({
                cols: 80,
                rows: 24,
                fontSize: 14,
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                theme: {
                    background: '#000000',
                    foreground: '#ffffff',
                    cursor: '#ffffff'
                },
                cursorBlink: true,
                allowTransparency: false
            });

            // Open terminal in container
            this.terminal.open(container);

            // Fit terminal to container
            this.fitTerminal();

            // Handle window resize
            window.addEventListener('resize', () => {
                this.fitTerminal();
            });

            console.log('xterm.js terminal initialized');

        } catch (error) {
            console.error('Failed to initialize terminal:', error);
            this.updateStatus('Error: Could not initialize terminal');
        }
    }

    /**
     * Load Monaco editor
     */
    async loadMonaco() {
        return new Promise((resolve, reject) => {
            // Check if Monaco is already loaded globally
            if (window.monaco) {
                console.log('Monaco already loaded globally');
                resolve();
                return;
            }

            // Check if Monaco loader script is already loaded
            const existingLoader = document.querySelector('script[src*="monaco-editor"][src*="loader.min.js"]');
            if (existingLoader) {
                console.log('Monaco loader script already exists, waiting for it to load...');
                // Wait for the existing script to finish loading
                const checkMonaco = () => {
                    if (window.monaco) {
                        resolve();
                    } else {
                        setTimeout(checkMonaco, 100);
                    }
                };
                checkMonaco();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/loader.min.js';
            script.onload = () => {
                // Configure require to work with nodeIntegration
                require.config({
                    paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' },
                    // Disable Node.js file system access for CDN URLs
                    nodeRequire: false,
                    nodeMain: false
                });

                // Override the loader's file reading to use fetch for HTTP URLs
                const originalLoad = require.load;
                require.load = function(context, moduleName, url) {
                    if (url && url.startsWith('http')) {
                        // Use fetch for HTTP URLs instead of Node.js fs
                        return fetch(url)
                            .then(response => response.text())
                            .then(text => {
                                eval(text);
                                context.completeLoad(moduleName);
                            })
                            .catch(error => {
                                console.error('Failed to load Monaco module:', url, error);
                                context.onError(error);
                            });
                    } else {
                        // Use original loader for other URLs
                        return originalLoad.call(this, context, moduleName, url);
                    }
                };

                require(['vs/editor/editor.main'], () => {
                    resolve();
                });
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Load xterm.js
     */
    async loadXTerm() {
        return new Promise((resolve, reject) => {
            // Load xterm.js CSS
            const cssLink = document.createElement('link');
            cssLink.rel = 'stylesheet';
            cssLink.href = 'https://unpkg.com/xterm@5.3.0/css/xterm.css';
            document.head.appendChild(cssLink);

            // Load xterm.js
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/xterm@5.3.0/lib/xterm.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Fit terminal to container
     */
    fitTerminal() {
        if (!this.terminal) return;

        const container = document.getElementById('qb-terminal-container');
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const cols = Math.floor(rect.width / 9); // Approximate character width
        const rows = Math.floor(rect.height / 17); // Approximate line height

        this.terminal.resize(cols, rows);
    }

    /**
     * Get default QBasic code
     */
    getDefaultCode() {
        return `' Welcome to NebulaQBasic Terminal!
' This terminal runs real QBasic code using qbjc compiler
'
' Try this sample program:

CLS
PRINT "Hello from NebulaQBasic!"
PRINT "This is running on qbjc compiler"
PRINT

FOR i = 1 TO 5
    PRINT "Count: "; i
NEXT i

PRINT
PRINT "Press F5 to run this program!"
END
`;
    }

    /**
     * Load welcome message in terminal
     */
    loadWelcomeMessage() {
        if (!this.terminal) return;

        this.terminal.writeln('\\r\\n\\x1b[1;32mNebulaQBasic Terminal v1.0\\x1b[0m');
        this.terminal.writeln('\\x1b[1;36mPowered by qbjc compiler\\x1b[0m');
        this.terminal.writeln('');
        this.terminal.writeln('Type QBasic code in the editor above and press F5 to run.');
        this.terminal.writeln('Use Ctrl+O to open .BAS files, Ctrl+S to save.');
        this.terminal.writeln('');
        this.terminal.writeln('\\x1b[1;33mReady for QBasic programs!\\x1b[0m');
        this.terminal.writeln('');
    }

    /**
     * Run the QBasic program
     */
    async runProgram() {
        if (this.isRunning) {
            this.updateStatus('Program already running');
            return;
        }

        const code = this.editor ? this.editor.getValue() : this.currentCode;
        if (!code.trim()) {
            this.updateStatus('No code to run');
            return;
        }

        this.isRunning = true;
        this.updateStatus('Compiling and running...');

        try {
            // Use secure IPC API instead of direct require
            const compileResult = await window.nebula.qbjc.compile(code);

            if (!compileResult.success) {
                throw new Error(compileResult.error);
            }

            // Clear terminal and show compilation success
            this.terminal.writeln('');
            this.terminal.writeln('\\x1b[1;32mProgram compiled successfully!\\x1b[0m');
            this.terminal.writeln('');

            // Execute the compiled program using the secure API
            const executeResult = await window.nebula.qbjc.execute(compileResult.compiledJS);

            if (!executeResult.success) {
                throw new Error(executeResult.error);
            }

            this.updateStatus('Program completed successfully');

        } catch (error) {
            console.error('QBasic execution error:', error);
            this.terminal.writeln('');
            this.terminal.writeln(`\\x1b[1;31mError: ${error.message}\\x1b[0m`);
            this.updateStatus('Execution failed');
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Stop program execution
     */
    stopProgram() {
        if (!this.isRunning) return;

        this.isRunning = false;
        this.updateStatus('Program stopped');
        this.terminal.writeln('');
        this.terminal.writeln('\\x1b[1;33mProgram execution stopped\\x1b[0m');
    }

    /**
     * Open a .BAS file
     */
    async openFile() {
        try {
            // Use NebulaDesktop file picker
            const filePath = await this.showFilePicker('Open QBasic File', ['.bas', '.BAS']);

            if (filePath) {
                const content = await this.readFile(filePath);
                if (this.editor) {
                    this.editor.setValue(content);
                }
                this.currentCode = content;
                this.updateStatus(`Opened: ${filePath.split('/').pop()}`);
            }
        } catch (error) {
            console.error('Failed to open file:', error);
            this.updateStatus('Failed to open file');
        }
    }

    /**
     * Save current code to .BAS file
     */
    async saveFile() {
        try {
            const code = this.editor ? this.editor.getValue() : this.currentCode;

            // Use NebulaDesktop file save dialog
            const filePath = await this.showSaveDialog('Save QBasic File', '.bas');

            if (filePath) {
                await this.writeFile(filePath, code);
                this.updateStatus(`Saved: ${filePath.split('/').pop()}`);
            }
        } catch (error) {
            console.error('Failed to save file:', error);
            this.updateStatus('Failed to save file');
        }
    }

    /**
     * Clear terminal
     */
    clearTerminal() {
        if (this.terminal) {
            this.terminal.clear();
            this.loadWelcomeMessage();
        }
        this.updateStatus('Terminal cleared');
    }

    /**
     * Show help
     */
    showHelp() {
        const helpText = `
QBasic Terminal Help
===================

This terminal runs authentic QBasic programs using the qbjc compiler.

COMMANDS:
• F5 or Run button: Execute QBasic program
• Ctrl+O: Open .BAS file
• Ctrl+S: Save .BAS file
• Clear Terminal: Clear output

QBASIC FEATURES SUPPORTED:
• PRINT, INPUT, CLS statements
• FOR/NEXT loops
• IF/THEN/ELSE conditionals
• SUB/FUNCTION procedures
• Arrays (DIM)
• DATA/READ statements
• Most built-in functions

CREDITS:
• qbjc compiler: https://github.com/jichu4n/qbjc (Apache-2.0 License)
• xterm.js terminal: https://xtermjs.org/
• Monaco editor: https://microsoft.com/monaco

For more QBasic documentation, visit:
https://docs.microsoft.com/en-us/previous-versions/visualstudio/visual-basic-6/visual-basic-6-documentation
        `;

        // Show help in a modal dialog
        alert(helpText);
    }

    /**
     * File system helpers (integrate with NebulaDesktop APIs)
     */
    async showFilePicker(title, extensions) {
        // TODO: Integrate with NebulaDesktop file picker
        // For now, return a mock path
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = extensions.join(',');
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    resolve(file.path || file.name);
                } else {
                    resolve(null);
                }
            };
            input.click();
        });
    }

    async showSaveDialog(title, extension) {
        // TODO: Integrate with NebulaDesktop save dialog
        const filename = prompt(`${title}:`, `program${extension}`);
        return filename ? `/home/brad/Documents/NebulaDesktop/${filename}` : null;
    }

    async readFile(filePath) {
        // TODO: Integrate with NebulaDesktop file system
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsText(file);
                } else {
                    reject(new Error('No file selected'));
                }
            };
            input.click();
        });
    }

    async writeFile(filePath, content) {
        // TODO: Integrate with NebulaDesktop file system
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filePath.split('/').pop();
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Update status bar
     */
    updateStatus(message, details = null) {
        const statusInfo = document.getElementById('status-info');
        const statusDetails = document.getElementById('status-details');

        if (statusInfo) statusInfo.textContent = message;
        if (details && statusDetails) statusDetails.textContent = details;
    }

    /**
     * Required methods for WindowManager integration
     */
    getTitle() {
        return 'QBasic Terminal';
    }

    getIcon() {
        return '🖥️';
    }

    /**
     * Cleanup when app is closed
     */
    cleanup() {
        if (this.terminal) {
            this.terminal.dispose();
        }
        if (this.editor) {
            this.editor.dispose();
        }
        console.log('QBasic Terminal cleanup completed');
    }
}

// Export for use in NebulaDesktop
window.NebulaQBasicTerminal = NebulaQBasicTerminal;

// Auto-initialize when loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new NebulaQBasicTerminal());
} else {
    new NebulaQBasicTerminal();
}