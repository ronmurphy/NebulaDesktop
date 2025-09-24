// NebulaQBasic Terminal - QBasic Compiler & Runtime
// Based on NebulaApp-Single.js template
// Integrates qbjc compiler with xterm.js terminal for authentic QBasic experience

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
        // Input state for interactive INPUT support
        this.inputBuffer = '';
        this.waitingForInput = false;
        this.inputResolver = null;
        // Store last transpiled JS for debug viewing
        this.lastTranspiledCode = null;
        // Monaco read-only editor instances for transpiled modal (if created)
        this.transpiledModalEditor = null;
        this.qbasicModalEditor = null;

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
        const mainArea = this.createMainArea();
        const statusBar = this.createStatusBar();

        // Assemble the UI
        container.appendChild(toolbar);
        container.appendChild(mainArea);
        container.appendChild(statusBar);

        // Initialize after UI is created
        setTimeout(() => {
            console.log('QBTerminal: Starting initialization...');
            this.setupEventListeners();
            this.initializeEditor();
            this.initializeTerminal();
            this.loadWelcomeMessage();
            // Add theme selector UI and start watching for Nebula theme changes
            this.addThemeSelector();
            this.watchNebulaThemeChanges();
            // Show a brief hint about variable suffixes for beginners
            setTimeout(() => this.showCenterHint('Tip: Use $ for strings and % for integers (e.g., name$ or count%)', 7000), 800);
            // Start rotating tips
            this.startRotatingTips();
        }, 500); // Increased delay to ensure DOM is ready

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

            <button class="toolbar-btn" id="copy-terminal-btn" title="Copy Terminal Output">
                <span class="material-symbols-outlined">content_copy</span>
            </button>

            <button class="toolbar-btn" id="view-transpiled-btn" title="View Transpiled JS">
                <span class="material-symbols-outlined">visibility</span>
            </button>


            <button class="toolbar-btn" id="help-btn" title="QBasic Help">
                <span class="material-symbols-outlined">help</span>
            </button>

            <div class="toolbar-title" style="margin-left: auto; font-weight: 500; color: var(--nebula-text-primary);">
                QBasic Terminal - Custom Transpiler
            </div>
        `;

        this.addToolbarStyles();
        return toolbar;
    }

    /**
     * Build a theme selector dropdown in the toolbar (called once during UI setup)
     */
    addThemeSelector() {
        const toolbar = document.querySelector('.qbterminal-toolbar');
        if (!toolbar) return;

        // Avoid adding twice
        if (document.getElementById('qb-theme-select')) return;

        const select = document.createElement('select');
        select.id = 'qb-theme-select';
        select.style.cssText = 'margin-left:8px; background: var(--nebula-bg-secondary); color: var(--nebula-text-primary); border:1px solid var(--nebula-border); padding:4px;';
        const options = [
            { v: 'qbasic-classic', t: 'Classic QB' },
            { v: 'qbasic-nebula', t: 'Nebula' },
            { v: 'qbasic-simple', t: 'Simple' },
            { v: 'vs-light', t: 'Light (Monaco)' }
        ];
        options.forEach(o => {
            const opt = document.createElement('option');
            opt.value = o.v;
            opt.textContent = o.t;
            select.appendChild(opt);
        });

        select.value = this.getSavedEditorTheme() || 'qbasic-classic';
        select.addEventListener('change', (e) => {
            const v = e.target.value;
            try {
                if (typeof monaco !== 'undefined' && monaco && monaco.editor) {
                    monaco.editor.setTheme(v);
                }
            } catch (err) { console.warn('Set theme failed', err); }
            this.saveEditorTheme(v);
        });

        // Insert before the toolbar title
        const title = toolbar.querySelector('.toolbar-title');
        if (title) toolbar.insertBefore(select, title);
    }

    /**
     * Create the main content area with editor and terminal side by side
     */
    createMainArea() {
        const mainArea = document.createElement('div');
        mainArea.className = 'qbterminal-main';
        mainArea.style.cssText = `
            flex: 1;
            display: flex;
            flex-direction: row;
            overflow: hidden;
            min-height: 0; /* Allow flex items to shrink below content size */
        `;

        const editorArea = this.createEditorArea();
        const terminalArea = this.createTerminalArea();

        mainArea.appendChild(editorArea);
        mainArea.appendChild(terminalArea);

        return mainArea;
    }

    /**
     * Create the Monaco editor area for QBasic
     */
    createEditorArea() {
        const editorArea = document.createElement('div');
        editorArea.className = 'qbterminal-editor';
        editorArea.id = 'qb-editor-container';
        editorArea.style.cssText = `
            width: 50%;
            height: 100%;
            background: var(--nebula-bg-primary);
            border-right: 1px solid var(--nebula-border);
            position: relative;
            overflow: hidden;
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
            height: 100%;
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
            <span class="status-center" id="status-center"></span>
            <span class="status-right" id="status-details">Custom Transpiler v1.0</span>
        `;

        return statusBar;
    }

    // Show a short, centered hint in the status bar
    showCenterHint(msg, timeoutMs = 5000) {
        const el = document.getElementById('status-center');
        if (!el) return;
        el.textContent = msg;
        el.style.opacity = '1';
        setTimeout(() => {
            el.style.opacity = '0.0';
            el.textContent = '';
        }, timeoutMs);
    }

    // Rotating tips in the center status area
    startRotatingTips(intervalMs = 8000) {
        if (this._tipsTimer) return;
        this._tips = [
            'Tip: Use $ for strings (name$), % for integers (count%)',
            'Tip: Use REM or an apostrophe (\') to add comments',
            'Tip: Use CLS to clear the screen at program start',
            'Tip: INPUT "Prompt", var$ to prompt the user'
        ];
        let idx = 0;
        this.showCenterHint(this._tips[idx], 4000);
        this._tipsTimer = setInterval(() => {
            idx = (idx + 1) % this._tips.length;
            this.showCenterHint(this._tips[idx], 4000);
        }, intervalMs);
    }

    stopRotatingTips() {
        if (this._tipsTimer) {
            clearInterval(this._tipsTimer);
            this._tipsTimer = null;
        }
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
     * Show a split-view modal with QBasic source on left, transpiled JS on right
     */
    showTranspiledJS() {
        const existing = document.getElementById('qb-transpiled-modal');
        if (existing) {
            existing.remove();
            return;
        }

        const modal = document.createElement('div');
        modal.id = 'qb-transpiled-modal';
        modal.style.cssText = `
            position: fixed;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 90%;
            height: 80%;
            background: var(--nebula-surface);
            color: var(--nebula-text-primary);
            border: 1px solid var(--nebula-border);
            border-radius: 8px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            box-shadow: 0 8px 24px rgba(0,0,0,0.4);
        `;

        const header = document.createElement('div');
        header.style.cssText = 'padding: 8px 12px; display:flex; align-items:center; gap:8px;';
        const title = document.createElement('div');
        title.textContent = 'QBasic ↔ JavaScript Transpiler';
        title.style.fontWeight = '600';
        header.appendChild(title);

        // Copy buttons for both panels
        const copyContainer = document.createElement('div');
        copyContainer.style.cssText = 'display:flex; gap:4px; margin-left:auto;';

        const btnCopyQBasic = document.createElement('button');
        btnCopyQBasic.textContent = 'Copy QBasic';
        btnCopyQBasic.title = 'Copy QBasic source code';
        btnCopyQBasic.addEventListener('click', () => {
            navigator.clipboard.writeText(this.currentCode || '').then(() => {
                this.updateStatus('QBasic source copied to clipboard');
            }).catch(() => this.updateStatus('Failed to copy QBasic source'));
        });
        copyContainer.appendChild(btnCopyQBasic);

        const btnCopyJS = document.createElement('button');
        btnCopyJS.textContent = 'Copy JS';
        btnCopyJS.title = 'Copy transpiled JavaScript';
        btnCopyJS.addEventListener('click', () => {
            const text = (this.transpiledModalEditor && typeof this.transpiledModalEditor.getValue === 'function') ? this.transpiledModalEditor.getValue() : (this.lastTranspiledCode || '');
            navigator.clipboard.writeText(text).then(() => {
                this.updateStatus('Transpiled JS copied to clipboard');
            }).catch(() => this.updateStatus('Failed to copy transpiled JS'));
        });
        copyContainer.appendChild(btnCopyJS);

        header.appendChild(copyContainer);

        const btnClose = document.createElement('button');
        btnClose.textContent = 'Close';
        btnClose.style.marginLeft = '8px';
        btnClose.addEventListener('click', () => {
            // Dispose Monaco editors if created
            try {
                if (this.qbasicModalEditor) {
                    this.qbasicModalEditor.dispose();
                    this.qbasicModalEditor = null;
                }
                if (this.transpiledModalEditor) {
                    this.transpiledModalEditor.dispose();
                    this.transpiledModalEditor = null;
                }
            } catch (e) {
                console.warn('Error disposing modal editors:', e);
            }
            modal.remove();
        });
        header.appendChild(btnClose);

        // Split container for QBasic and JS
        const splitContainer = document.createElement('div');
        splitContainer.style.cssText = 'flex:1; display:flex; overflow:hidden;';

        // Left panel - QBasic source
        const qbasicPanel = document.createElement('div');
        qbasicPanel.style.cssText = 'flex:1; display:flex; flex-direction:column; border-right:1px solid var(--nebula-border);';

        const qbasicHeader = document.createElement('div');
        qbasicHeader.style.cssText = 'padding:4px 8px; background:var(--nebula-bg-secondary); border-bottom:1px solid var(--nebula-border); font-size:12px; font-weight:500;';
        qbasicHeader.textContent = 'QBasic Source';
        qbasicPanel.appendChild(qbasicHeader);

        const qbasicContent = document.createElement('div');
        qbasicContent.style.cssText = 'flex:1; overflow:hidden;';
        qbasicPanel.appendChild(qbasicContent);

        // Right panel - Transpiled JS
        const jsPanel = document.createElement('div');
        jsPanel.style.cssText = 'flex:1; display:flex; flex-direction:column;';

        const jsHeader = document.createElement('div');
        jsHeader.style.cssText = 'padding:4px 8px; background:var(--nebula-bg-secondary); border-bottom:1px solid var(--nebula-border); font-size:12px; font-weight:500;';
        jsHeader.textContent = 'Transpiled JavaScript';
        jsPanel.appendChild(jsHeader);

        const jsContent = document.createElement('div');
        jsContent.style.cssText = 'flex:1; overflow:hidden;';
        jsPanel.appendChild(jsContent);

        splitContainer.appendChild(qbasicPanel);
        splitContainer.appendChild(jsPanel);

        modal.appendChild(header);
        modal.appendChild(splitContainer);
        document.body.appendChild(modal);

        // Create Monaco editors for both panels if available
        if (typeof monaco !== 'undefined' && monaco && monaco.editor) {
            try {
                // QBasic source editor (read-only)
                this.qbasicModalEditor = monaco.editor.create(qbasicContent, {
                    value: this.currentCode || '// No QBasic code available',
                    language: 'qbasic',
                    readOnly: true,
                    minimap: { enabled: false },
                    automaticLayout: true,
                    theme: this.getSavedEditorTheme() || 'qbasic-classic'
                });

                // Transpiled JS editor (read-only)
                this.transpiledModalEditor = monaco.editor.create(jsContent, {
                    value: this.lastTranspiledCode || '// No transpiled code available',
                    language: 'javascript',
                    readOnly: true,
                    minimap: { enabled: false },
                    automaticLayout: true,
                    theme: this.getSavedEditorTheme() || 'qbasic-classic'
                });
            } catch (e) {
                console.warn('Error creating Monaco editors:', e);
                // Fallback to plain text
                this.createFallbackEditors(qbasicContent, jsContent);
            }
        } else {
            this.createFallbackEditors(qbasicContent, jsContent);
        }
    }

    /**
     * Create fallback plain text editors when Monaco is not available
     */
    createFallbackEditors(qbasicContainer, jsContainer) {
        // QBasic fallback
        const qbasicPre = document.createElement('pre');
        qbasicPre.style.cssText = 'flex:1; overflow:auto; padding:12px; background: #0b0b0b; color: #74c0fc; margin:0; font-family:monospace;';
        qbasicPre.textContent = this.currentCode || '// No QBasic code available';
        qbasicContainer.appendChild(qbasicPre);

        // JS fallback
        const jsPre = document.createElement('pre');
        jsPre.style.cssText = 'flex:1; overflow:auto; padding:12px; background: #0b0b0b; color: #e6e6e6; margin:0; font-family:monospace;';
        jsPre.textContent = this.lastTranspiledCode || '// No transpiled code available';
        jsContainer.appendChild(jsPre);
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

        document.getElementById('copy-terminal-btn')?.addEventListener('click', () => {
            this.copyTerminalOutput();
        });

        document.getElementById('help-btn')?.addEventListener('click', () => {
            this.showHelp();
        });

        // View transpiled JS button
        document.getElementById('view-transpiled-btn')?.addEventListener('click', () => {
            this.showTranspiledJS();
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
        console.log('QBTerminal: initializeEditor called');
        try {
            // Load Monaco
            if (typeof monaco === 'undefined') {
                console.log('QBTerminal: Monaco not loaded, loading...');
                await this.loadMonaco();
            } else {
                console.log('QBTerminal: Monaco already available');
            }

            // Register QBasic language and themes if not already done
            try {
                if (monaco && !monaco.languages.getLanguages().some(l=>l.id==='qbasic')) {
                    monaco.languages.register({ id: 'qbasic' });
                    monaco.languages.setMonarchTokensProvider('qbasic', {
                        tokenizer: {
                            root: [
                                // Line numbers (e.g., 10 PRINT "HI")
                                [/^\s*\d+/, 'number'],
                                // Labels (e.g., foo:)
                                [/\b[A-Za-z_]\w*:\b/, 'label'],
                                // Keywords
                                [/\b(?:PRINT|INPUT|FOR|NEXT|IF|THEN|ELSE|END IF|END|DIM|LET|REM|CLS|GOTO|GOSUB|RETURN|DATA|READ|RESTORE|STEP|TO|STEP|STEP)\b/i, 'keyword'],
                                // Built-in functions
                                [/\b(?:RND|INT|ABS|SQR|SIN|COS|TAN|LOG|EXP|LEN|MID|LEFT|RIGHT|CHR$)\b/gi, 'keyword.operator'],
                                // Strings
                                [/"([^"\\]|\\.)*"/, 'string'],
                                // Comments starting with ' or REM
                                [/\'.*$/, 'comment'],
                                [/\bREM\b.*$/i, 'comment'],
                                // Numbers (integers and floats)
                                [/\b\d+(?:\.\d+)?\b/, 'number'],
                                // Variables with $ (strings) or % (integers)
                                [/\b[A-Za-z_]\w*\$\b/, 'variable.string'],
                                [/\b[A-Za-z_]\w*%\b/, 'variable.integer'],
                                // Identifiers
                                [/\b[A-Za-z_]\w*\b/, 'identifier'],
                                // Operators and punctuation
                                [/[+\-*/=<>\(\),;:.]/, 'delimiter']
                            ]
                        }
                    });

                    // Define three themes: classic qbasic, nebula-adaptive, simple
                    monaco.editor.defineTheme('qbasic-classic', {
                        base: 'vs-dark',
                        inherit: true,
                        rules: [
                            { token: 'keyword', foreground: 'FFFF00', fontStyle: 'bold' },
                            { token: 'string', foreground: '00FF00' },
                            { token: 'comment', foreground: '888888', fontStyle: 'italic' },
                            { token: 'number', foreground: 'FF9900' },
                            { token: 'identifier', foreground: 'FFFFFF' },
                            { token: 'variable.string', foreground: '66FFCC' },
                            { token: 'variable.integer', foreground: 'FF6666' }
                        ],
                        colors: { 'editor.background': '#000033' }
                    });

                    monaco.editor.defineTheme('qbasic-nebula', {
                        base: 'vs-dark',
                        inherit: true,
                        rules: [
                            { token: 'keyword', foreground: '9CDCFE' },
                            { token: 'string', foreground: 'CE9178' },
                            { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
                            { token: 'number', foreground: 'B5CEA8' },
                            { token: 'variable.string', foreground: '7EE787' },
                            { token: 'variable.integer', foreground: 'FF8A80' }
                        ],
                        colors: { 'editor.background': getComputedStyle(document.documentElement).getPropertyValue('--nebula-bg-primary') || '#1e1e1e' }
                    });

                    monaco.editor.defineTheme('qbasic-simple', {
                        base: 'vs-dark',
                        inherit: true,
                        rules: [
                            { token: 'keyword', foreground: 'C586C0' },
                            { token: 'string', foreground: 'CE9178' },
                            { token: 'comment', foreground: '6A9955' },
                            { token: 'number', foreground: 'B5CEA8' },
                            { token: 'variable.string', foreground: '9AD3A2' },
                            { token: 'variable.integer', foreground: 'FF9999' }
                        ],
                        colors: { 'editor.background': '#0f1720' }
                    });
                }
            } catch (e) {
                console.warn('Could not register QBasic language/themes:', e);
            }

            // Create editor
            const container = document.getElementById('qb-editor-container');
            console.log('QBTerminal: Editor container:', container);
            if (!container) {
                console.error('QBTerminal: Editor container not found!');
                return;
            }

            console.log('QBTerminal: Creating Monaco editor...');
            this.editor = monaco.editor.create(container, {
                value: this.getDefaultCode(),
                language: 'qbasic',
                theme: this.getSavedEditorTheme() || 'qbasic-classic',
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

            // Apply saved theme explicitly (monaco may need explicit set)
            try {
                const saved = this.getSavedEditorTheme();
                if (saved && typeof monaco !== 'undefined' && monaco && monaco.editor) monaco.editor.setTheme(saved);
            } catch (e) {
                // ignore
            }

            // Fit editor to container
            this.fitEditor();

            // Handle window resize
            window.addEventListener('resize', () => {
                this.fitEditor();
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
        console.log('QBTerminal: initializeTerminal called');
        try {
            // Load xterm.js if not already loaded
            if (typeof Terminal === 'undefined') {
                console.log('QBTerminal: Terminal not loaded, loading...');
                await this.loadXTerm();
            } else {
                console.log('QBTerminal: Terminal already available globally');
            }

            const container = document.getElementById('qb-terminal-container');
            console.log('QBTerminal: Terminal container:', container);
            if (!container) {
                console.error('QBTerminal: Terminal container not found!');
                return;
            }

            console.log('QBTerminal: Creating xterm.js terminal...');

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

            // Handle terminal input for INPUT statements
            this.terminal.onData((data) => {
                try {
                    if (!this.waitingForInput) {
                        // If not waiting for input, ignore but still allow copy/paste
                        return;
                    }

                    for (let ch of data) {
                        const code = ch.charCodeAt(0);
                        // Enter = CR(13) or LF(10)
                        if (code === 13 || code === 10) {
                            // Enter pressed - resolve input (trim whitespace)
                            const value = this.inputBuffer.trim();
                            // Move to new line in terminal for clarity
                            this.terminal.writeln('');
                            this.inputBuffer = '';
                            this.waitingForInput = false;
                            if (this.inputResolver) {
                                const r = this.inputResolver;
                                this.inputResolver = null;
                                r(value);
                            }
                            // If LF follows CR, we'll ignore it in subsequent iterations
                        } else if (code === 127 || code === 8) { // Backspace (DEL or BS)
                            if (this.inputBuffer.length > 0) {
                                this.inputBuffer = this.inputBuffer.slice(0, -1);
                                // Move cursor back, erase char, move back again
                                this.terminal.write('\b \b');
                            }
                        } else if (code >= 32 || code === 9) { // Printable or TAB
                            // Regular printable character or tab
                            this.inputBuffer += ch;
                            this.terminal.write(ch);
                        } else {
                            // Control characters: ignore
                        }
                    }
                } catch (e) {
                    console.error('Error handling terminal input:', e);
                }
            });

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

    // Theme persistence helpers
    getSavedEditorTheme() {
        try {
            return localStorage.getItem('nebula_qbasic_theme');
        } catch (e) {
            return null;
        }
    }

    saveEditorTheme(name) {
        try {
            localStorage.setItem('nebula_qbasic_theme', name);
        } catch (e) {
            // ignore
        }
    }

    // (cycleEditorTheme removed - use the theme dropdown selector instead)

    // Recompute theme colors from Nebula CSS variables and redefine Monaco themes
    redefineThemesFromCSS() {
        try {
            const root = getComputedStyle(document.documentElement);
            const bg = root.getPropertyValue('--nebula-bg-primary') || '#1e1e1e';
            const surface = root.getPropertyValue('--nebula-surface') || '#252526';
            const keyword = root.getPropertyValue('--nebula-accent') || '#9CDCFE';
            const string = root.getPropertyValue('--nebula-success') || '#CE9178';
            const comment = root.getPropertyValue('--nebula-muted') || '#6A9955';

            // Re-define the qbasic-nebula theme dynamically
            if (typeof monaco !== 'undefined' && monaco && monaco.editor) {
                monaco.editor.defineTheme('qbasic-nebula', {
                    base: 'vs-dark',
                    inherit: true,
                    rules: [
                        { token: 'keyword', foreground: keyword.replace('#','') },
                        { token: 'string', foreground: string.replace('#','') },
                        { token: 'comment', foreground: comment.replace('#',''), fontStyle: 'italic' },
                        { token: 'number', foreground: 'B5CEA8' },
                        { token: 'variable.string', foreground: (root.getPropertyValue('--nebula-success') || '#7EE787').replace('#','') },
                        { token: 'variable.integer', foreground: (root.getPropertyValue('--nebula-danger') || '#FF8A80').replace('#','') }
                    ],
                    colors: { 'editor.background': bg || '#1e1e1e', 'editor.foreground': root.getPropertyValue('--nebula-text-primary') || '#ffffff' }
                });

                // Update simple theme background to surface
                monaco.editor.defineTheme('qbasic-simple', {
                    base: 'vs-dark',
                    inherit: true,
                    rules: [
                        { token: 'keyword', foreground: 'C586C0' },
                        { token: 'string', foreground: string.replace('#','') },
                        { token: 'comment', foreground: comment.replace('#','') },
                        { token: 'number', foreground: 'B5CEA8' },
                        { token: 'variable.string', foreground: (root.getPropertyValue('--nebula-success') || '#9AD3A2').replace('#','') },
                        { token: 'variable.integer', foreground: (root.getPropertyValue('--nebula-danger') || '#FF9999').replace('#','') }
                    ],
                    colors: { 'editor.background': surface || '#0f1720' }
                });
            }
        } catch (e) {
            console.warn('Failed to redefine themes from CSS variables', e);
        }
    }

    // Observe changes to documentElement to re-define themes when Nebula variables change
    watchNebulaThemeChanges() {
        try {
            const observer = new MutationObserver((mutations) => {
                // Simple heuristic: any attribute change -> recompute themes
                this.redefineThemesFromCSS();
            });
            observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] });
            // Also call once to initialize
            this.redefineThemesFromCSS();
        } catch (e) {
            console.warn('Could not install Nebula theme observer', e);
        }
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
     * Fit Monaco editor to container
     */
    fitEditor() {
        if (!this.editor) return;

        const container = document.getElementById('qb-editor-container');
        if (!container) return;

        // Trigger Monaco layout update
        this.editor.layout();
    }

    /**
     * Get default QBasic code
     */
    getDefaultCode() {
        return `' Welcome to NebulaQBasic Terminal!
' This terminal transpiles QBasic to JavaScript instantly
' 
 ' Try this sample program:

CLS
PRINT "Hello from NebulaQBasic!"
PRINT "This runs with our custom transpiler"
PRINT

FOR i = 1 TO 5
    PRINT "Count: "; i
NEXT i

PRINT
PRINT "Features supported:"
PRINT "• PRINT statements"
PRINT "• FOR/NEXT loops"
PRINT "• Variable assignments"
PRINT "• IF/THEN/ELSE"
PRINT "• REM comments"
PRINT "• Arrays with DIM"
PRINT "• Math functions (INT, etc.)"
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

        this.terminal.writeln('\r\n\x1b[1;32mNebulaQBasic Terminal v1.0\x1b[0m');
        this.terminal.writeln('\x1b[1;36mMonaco Editor + xterm.js Terminal\x1b[0m');
        this.terminal.writeln('');
        this.terminal.writeln('Type QBasic code in the editor and press F5 to run.');
        this.terminal.writeln('Use Ctrl+O to open .BAS files, Ctrl+S to save.');
        this.terminal.writeln('');
        this.terminal.writeln('\x1b[1;33mReady for QBasic development!\x1b[0m');
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
        this.updateStatus('Transpiling and running...');

        try {
            // Clear terminal for output
            this.terminal.writeln('');
            this.terminal.writeln('\x1b[1;36m🔄 Transpiling QBasic code...\x1b[0m');

            // Use our custom transpiler
            const transpiledCode = this.transpileBasicToJavaScript(code);

            // Store last transpiled code for debug viewing
            this.lastTranspiledCode = transpiledCode;

            if (!transpiledCode || transpiledCode === '// No transpilable BASIC code found') {
                this.terminal.writeln('\x1b[1;33m⚠️ No transpilable code found\x1b[0m');
                this.terminal.writeln('Try adding some PRINT statements or FOR loops!');
                this.updateStatus('Ready');
                return;
            }

            this.terminal.writeln('\x1b[1;32m✅ Transpilation successful!\x1b[0m');
            this.terminal.writeln('');

            // Execute the transpiled JavaScript
            this.executeTranspiledBasic(transpiledCode);

        } catch (error) {
            console.error('QBasic transpilation error:', error);
            this.terminal.writeln('');
            this.terminal.writeln(`\x1b[1;31m❌ Transpilation Error: ${error.message}\x1b[0m`);
            this.updateStatus('Transpilation failed');
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
        this.terminal.writeln('\x1b[1;33mProgram execution stopped\x1b[0m');
    }

    /**
     * Open a .BAS file
     */
    async openFile() {
        try {
            // Prefer the new PickerApp API when available
            let result = null;
            if (window.PickerApp && typeof window.PickerApp.open === 'function') {
                result = await window.PickerApp.open({ startPath: await window.nebula.fs.getHomeDir(), pickType: 'open' });
            } else if (window.NebulaFilePicker) {
                const picker = new window.NebulaFilePicker();
                result = await picker.open({ startPath: await window.nebula.fs.getHomeDir(), pickType: 'open' });
            }

            if (!result) {
                // Fallback: use existing DOM picker
                const filePath = await this.showFilePicker('Open QBasic File', ['.bas', '.BAS']);
                if (!filePath) { this.updateStatus('Open cancelled'); return; }
                result = filePath;
            }

            const content = await window.nebula.fs.readFile(result);
            if (this.editor) this.editor.setValue(content);
            this.currentCode = content;
            this.updateStatus(`Opened: ${result.split('/').pop()}`);
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
            // Prefer PickerApp for save dialog
            let result = null;
            if (window.PickerApp && typeof window.PickerApp.open === 'function') {
                result = await window.PickerApp.open({ startPath: await window.nebula.fs.getHomeDir(), pickType: 'save' });
            } else if (window.NebulaFilePicker) {
                const picker = new window.NebulaFilePicker();
                result = await picker.open({ startPath: await window.nebula.fs.getHomeDir(), pickType: 'save' });
            }

            if (!result) {
                const filePath = await this.showSaveDialog('Save QBasic File', '.bas');
                if (!filePath) { this.updateStatus('Save cancelled'); return; }
                result = filePath;
            }

            await window.nebula.fs.writeFile(result, code);
            this.updateStatus('Saved: ' + (result.split('/').pop() || result));
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
     * Copy terminal output to clipboard
     */
    copyTerminalOutput() {
        if (!this.terminal) return;

        try {
            // Get all lines from the terminal buffer
            const buffer = this.terminal.buffer.active;
            let text = '';

            // Extract text from the buffer (last 1000 lines to avoid memory issues)
            const startLine = Math.max(0, buffer.length - 1000);
            for (let i = startLine; i < buffer.length; i++) {
                const line = buffer.getLine(i);
                if (line) {
                    text += line.translateToString() + '\n';
                }
            }

            // Copy to clipboard
            navigator.clipboard.writeText(text.trim()).then(() => {
                this.updateStatus('Terminal output copied to clipboard');
                // Show brief success message in terminal
                this.terminal.writeln('\x1b[1;32m✓ Terminal output copied to clipboard\x1b[0m');
            }).catch(err => {
                console.error('Failed to copy terminal output:', err);
                this.updateStatus('Failed to copy terminal output');
                this.terminal.writeln('\x1b[1;31m✗ Failed to copy terminal output\x1b[0m');
            });
        } catch (error) {
            console.error('Error copying terminal output:', error);
            this.updateStatus('Error copying terminal output');
            // Fallback to DOM-based extraction
            try {
                const terminalElement = document.querySelector('.xterm-screen');
                if (terminalElement) {
                    const text = terminalElement.textContent || terminalElement.innerText || '';
                    navigator.clipboard.writeText(text).then(() => {
                        this.updateStatus('Terminal output copied to clipboard (fallback)');
                        this.terminal.writeln('\x1b[1;32m✓ Terminal output copied to clipboard\x1b[0m');
                    });
                }
            } catch (fallbackError) {
                console.error('Fallback copy failed:', fallbackError);
                this.terminal.writeln('\x1b[1;31m✗ Failed to copy terminal output\x1b[0m');
            }
        }
    }

    /**
     * Show help
     */
    showHelp() {
        const helpText = `
QBasic Terminal Help
===================

This terminal runs QBasic programs using a custom JavaScript transpiler.

COMMANDS:
• F5 or Run button: Execute QBasic program
• Ctrl+O: Open .BAS file
• Ctrl+S: Save .BAS file
• Clear Terminal: Clear output
• View Transpiled JS: See generated JavaScript code

QBASIC FEATURES SUPPORTED:
• PRINT, INPUT, CLS statements
• FOR/NEXT, WHILE/WEND loops
• IF/THEN/ELSE conditionals
• Arrays (DIM)
• Variable assignments
• String functions: LEN(), MID$(), LEFT$(), RIGHT$(), CHR$(), ASC()
• Math functions: INT(), ABS(), SQR(), SIN(), COS(), TAN(), LOG(), EXP(), RND()
• Terminal control: LOCATE, COLOR
• REM comments

EXAMPLES:
PRINT "Hello, World!"
FOR i = 1 TO 10: PRINT i: NEXT i
WHILE x < 100: x = x + 1: WEND
LOCATE 5, 10: PRINT "Positioned text"
COLOR 2, 0: PRINT "Green text"
name$ = LEFT$("Hello", 3)

CREDITS:
• Custom JavaScript transpiler
        `;

        let jsCode = '';
        let indentLevel = 0;
        const indent = () => '    '.repeat(indentLevel);

        // Split into lines and process each
        const lines = basicCode.split('\n');

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            if (!line || line.startsWith("'")) continue; // Skip empty lines and comments

            const upperLine = line.toUpperCase();

            // Apply function replacements to all lines first
            line = line.replace(/\bRND\b/gi, 'Math.random()');
            line = line.replace(/\bINT\(/gi, 'Math.floor(');
            line = line.replace(/\bABS\(/gi, 'Math.abs(');
            line = line.replace(/\bSQR\(/gi, 'Math.sqrt(');
            line = line.replace(/\bSIN\(/gi, 'Math.sin(');
            line = line.replace(/\bCOS\(/gi, 'Math.cos(');
            line = line.replace(/\bTAN\(/gi, 'Math.tan(');
            line = line.replace(/\bLOG\(/gi, 'Math.log(');
            line = line.replace(/\bEXP\(/gi, 'Math.exp(');
            // String functions
            line = line.replace(/\bLEN\(/gi, '__qb_len(');
            line = line.replace(/\bMID\$\(/gi, '__qb_mid(');
            line = line.replace(/\bLEFT\$\(/gi, '__qb_left(');
            line = line.replace(/\bRIGHT\$\(/gi, '__qb_right(');
            line = line.replace(/\bCHR\$\(/gi, '__qb_chr(');
            line = line.replace(/\bASC\(/gi, '__qb_asc(');

            // WHILE loop
            if (upperLine.startsWith('WHILE ')) {
                const condition = line.substring(6).trim();
                jsCode += `${indent()}while (${condition}) {\n`;
                indentLevel++;
            }
            // WEND statement
            else if (upperLine === 'WEND') {
                indentLevel = Math.max(0, indentLevel - 1);
                jsCode += `${indent()}}\n`;
            }
            // FOR loop
            else if (upperLine.startsWith('FOR ')) {
                const forMatch = line.match(/FOR\s+(\w+)\s*=\s*(\d+)\s+TO\s+(\d+)/i);
                if (forMatch) {
                    const [_, varName, start, end] = forMatch;
                    jsCode += `${indent()}for (let ${varName} = ${start}; ${varName} <= ${end}; ${varName}++) {\n`;
                    indentLevel++;
                } else {
                    jsCode += `${indent()}// Invalid FOR statement: ${line}\n`;
                }
            }
            // NEXT statement
            else if (upperLine.startsWith('NEXT ')) {
                indentLevel = Math.max(0, indentLevel - 1);
                jsCode += `${indent()}}\n`;
            }
            // IF/THEN statement
            else if (upperLine.startsWith('IF ')) {
                const ifMatch = line.match(/IF\s+(.+?)\s+THEN\s*(.+)?/i);
                if (ifMatch) {
                    const [_, condition, thenPart] = ifMatch;
                    jsCode += `${indent()}if (${condition}) {\n`;
                    indentLevel++;
                    // Handle inline THEN statements
                    if (thenPart && thenPart.trim()) {
                        // For now, treat inline statements as comments since we don't parse complex statements
                        jsCode += `${indent()}// ${thenPart.trim()}\n`;
                        indentLevel--;
                        jsCode += `${indent()}}\n`;
                    }
                } else {
                    jsCode += `${indent()}// Invalid IF statement: ${line}\n`;
                }
            }
            // ELSE statement
            else if (upperLine.trim() === 'ELSE') {
                indentLevel = Math.max(0, indentLevel - 1);
                jsCode += `${indent()}} else {\n`;
                indentLevel++;
            }
            // END IF statement
            else if (upperLine === 'END IF') {
                indentLevel = Math.max(0, indentLevel - 1);
                jsCode += `${indent()}}\n`;
            }
            // Simple PRINT statement (supports multiple arguments separated by ';' or ',')
            else if (upperLine.startsWith('PRINT')) {
                // Support both `PRINT` and `PRINT <expr>`
                const content = line.length > 5 ? line.substring(5).trim() : '';
                if (!content) {
                    jsCode += `${indent()}__qb_writeln('');\n`;
                } else {
                    // Split on ; or , but ignore separators inside string literals and parentheses
                    const parts = [];
                    let cur = '';
                    let inQuote = false;
                    let parenDepth = 0;
                    for (let j = 0; j < content.length; j++) {
                        const ch = content[j];
                        if (ch === '"') {
                            inQuote = !inQuote;
                            cur += ch;
                        } else if (!inQuote) {
                            if (ch === '(') {
                                parenDepth++;
                                cur += ch;
                            } else if (ch === ')') {
                                parenDepth--;
                                cur += ch;
                            } else if (parenDepth === 0 && (ch === ';' || ch === ',')) {
                                parts.push(cur.trim());
                                cur = '';
                            } else {
                                cur += ch;
                            }
                        } else {
                            cur += ch;
                        }
                    }
                    if (cur.trim() !== '') parts.push(cur.trim());

                    const jsParts = parts.map(p => {
                        if (!p) return '""';
                        const trimmed = p.trim();
                        if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
                            return trimmed;
                        }
                        // Coerce non-string parts to String() to mimic PRINT concatenation
                        return `String(${trimmed})`;
                    });

                    jsCode += `${indent()}__qb_writeln(${jsParts.join(' + ')});\n`;
                }
            }
            // Simple variable assignment
            else if (line.includes('=')) {
                const parts = line.split('=');
                if (parts.length === 2) {
                    const varName = parts[0].trim();
                    const value = parts[1].trim();
                    // Skip if this looks like a FOR loop (already handled above)
                    if (!upperLine.startsWith('FOR ')) {
                        jsCode += `${indent()}var ${varName} = ${value};\n`;
                    }
                }
            }
            // REM comments
            else if (upperLine.startsWith('REM ')) {
                jsCode += `${indent()}// ${line.substring(4)}\n`;
            }
            // CLS (clear screen)
            else if (upperLine === 'CLS') {
                jsCode += `${indent()}__qb_clear();\n`;
            }
            // LOCATE statement (cursor positioning)
            else if (upperLine.startsWith('LOCATE ')) {
                const locateMatch = line.match(/LOCATE\s+(\d+)(?:\s*,\s*(\d+))?/i);
                if (locateMatch) {
                    const row = locateMatch[1];
                    const col = locateMatch[2] || '1';
                    jsCode += `${indent()}__qb_locate(${row}, ${col});\n`;
                } else {
                    jsCode += `${indent()}// Invalid LOCATE statement: ${line}\n`;
                }
            }
            // COLOR statement (text color)
            else if (upperLine.startsWith('COLOR ')) {
                const colorMatch = line.match(/COLOR\s+(\d+)(?:\s*,\s*(\d+))?/i);
                if (colorMatch) {
                    const fg = colorMatch[1];
                    const bg = colorMatch[2] || '0';
                    jsCode += `${indent()}__qb_color(${fg}, ${bg});\n`;
                } else {
                    jsCode += `${indent()}// Invalid COLOR statement: ${line}\n`;
                }
            }
            // END
            else if (upperLine === 'END') {
                jsCode += `${indent()}// END\n`;
            }
            // INPUT statement (improved)
            else if (upperLine.startsWith('INPUT ')) {
                // Grab the remainder after 'INPUT'
                const content = line.substring(5).trim();

                // Try to find a quoted prompt first
                let prompt = '';
                let varsPart = content;
                const quoteMatch = content.match(/"([^"]*)"/);
                if (quoteMatch) {
                    prompt = quoteMatch[1];
                    // remove the matched quoted prompt from varsPart
                    varsPart = (content.substring(0, quoteMatch.index) + content.substring(quoteMatch.index + quoteMatch[0].length)).trim();
                }

                // Normalize separators: semicolons -> commas; collapse multiple separators
                varsPart = varsPart.replace(/;/g, ',').replace(/\s*,\s*/g, ',').trim();
                // Remove leading/trailing commas
                varsPart = varsPart.replace(/^,+|,+$/g, '').trim();

                // Split variable names on commas; if none, split on whitespace
                let vars = [];
                if (varsPart.length > 0) {
                    if (varsPart.indexOf(',') >= 0) {
                        vars = varsPart.split(',').map(v => v.trim()).filter(Boolean);
                    } else {
                        vars = varsPart.split(/\s+/).map(v => v.trim()).filter(Boolean);
                    }
                }

                if (vars.length === 0) {
                    // Fallback: treat entire content as prompt if no vars found
                    prompt = prompt || content.replace(/^,\s*/, '').replace(/,$/, '').trim();
                    const varName = 'input';
                    jsCode += `${indent()}// INPUT mapped to __qb_input helper (fallback)\n`;
                    jsCode += `${indent()}let ${varName} = await __qb_input(${JSON.stringify(prompt)});\n`;
                } else if (vars.length === 1) {
                    const varName = vars[0];
                    jsCode += `${indent()}// INPUT single variable mapped to __qb_input\n`;
                    jsCode += `${indent()}let ${varName} = await __qb_input(${JSON.stringify(prompt)});\n`;
                    // Basic conversion: if variable name does not end with '$', try to convert to Number
                    if (!/\$$/.test(varName)) {
                        jsCode += `${indent()}if (${varName} !== null && ${varName} !== '' && !isNaN(Number(${varName}))) ${varName} = Number(${varName});\n`;
                    }
                } else {
                    // Multiple variables: prompt once, split on commas, assign in order
                    jsCode += `${indent()}// INPUT multiple variables: prompt once, split by comma\n`;
                    jsCode += `${indent()}const __qb_ans = await __qb_input(${JSON.stringify(prompt)});\n`;
                    jsCode += `${indent()}const __qb_parts = (__qb_ans || '').split(',').map(s => s.trim());\n`;
                    for (let vi = 0; vi < vars.length; vi++) {
                        const v = vars[vi];
                        if (/\$$/.test(v)) {
                            jsCode += `${indent()}let ${v} = __qb_parts[${vi}] || '';\n`;
                        } else {
                            // numeric - try convert, fallback to 0
                            jsCode += `${indent()}let ${v} = (__qb_parts[${vi}] !== undefined && __qb_parts[${vi}] !== '' && !isNaN(Number(__qb_parts[${vi}]))) ? Number(__qb_parts[${vi}]) : (__qb_parts[${vi}] || 0);\n`;
                        }
                    }
                }
            }
            // LET statement (optional in QBasic)
            else if (upperLine.startsWith('LET ')) {
                const letMatch = line.match(/LET\s+(.+?)=(.+)/i);
                if (letMatch) {
                    const varName = letMatch[1].trim();
                    const value = letMatch[2].trim();
                    jsCode += `${indent()}var ${varName} = ${value};\n`;
                }
            }
            // DIM statement (basic arrays)
            else if (upperLine.startsWith('DIM ')) {
                const dimMatch = line.match(/DIM\s+(\w+)\((.+?)\)/i);
                if (dimMatch) {
                    const varName = dimMatch[1];
                    const size = dimMatch[2];
                    jsCode += `${indent()}let ${varName} = new Array(${size}).fill(0);\n`;
                }
            }
            // Simple function calls like RND, INT, etc. (now handled above for all lines)
            // Unknown statements - pass through as comment for now
            else {
                jsCode += `${indent()}// Unknown BASIC statement: ${line}\n`;
            }
        }

        console.log('✅ Transpilation result:', jsCode.substring(0, 100) + (jsCode.length > 100 ? '...' : ''));
        return jsCode || '// No transpilable BASIC code found';
    }

    /**
     * Execute transpiled BASIC code and display output in terminal
     */
    async executeTranspiledBasic(jsCode) {
        try {
            console.log('🔄 Executing transpiled JavaScript...');

            // Capture console output and write incrementally to the terminal
            const originalLog = console.log;
            const originalError = console.error;
            const originalWarn = console.warn;

            const writeOutputLine = (line) => {
                // Split by newline and write each line
                const lines = String(line).split(/\r?\n/);
                for (const l of lines) {
                    this.terminal.writeln(l);
                }
            };

            const captureOutput = (...args) => {
                const text = args.map(arg => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg))).join(' ');
                writeOutputLine(text);
            };

            console.log = captureOutput;
            console.error = captureOutput;
            console.warn = captureOutput;

            // Provide __qb_input helper for async input via terminal
            const self = this;
            const __qb_input = (promptText) => {
                return new Promise((resolve) => {
                    // Show prompt
                    if (promptText) {
                        self.terminal.write(promptText + ' ');
                    }
                    self.waitingForInput = true;
                    self.inputBuffer = '';
                    self.inputResolver = (val) => {
                        resolve(val);
                    };
                });
            };

            // Provide write helpers for transpiled code
            const __qb_write = (text) => { try { self.terminal.write(String(text)); } catch (e) { /* ignore */ } };
            const __qb_writeln = (text) => { try { self.terminal.writeln(String(text)); } catch (e) { /* ignore */ } };
            const __qb_tab = (n) => { try { const spaces = ' '.repeat(Math.max(0, parseInt(n,10)||0)); self.terminal.write(spaces); } catch (e) { /* ignore */ } };
            const __qb_clear = () => { try { self.terminal.clear(); } catch (e) { /* ignore */ } };

            // String function helpers
            const __qb_len = (str) => String(str).length;
            const __qb_mid = (str, start, length) => {
                const s = String(str);
                const st = Math.max(0, parseInt(start, 10) - 1); // QBasic is 1-based
                return length !== undefined ? s.substr(st, parseInt(length, 10)) : s.substr(st);
            };
            const __qb_left = (str, length) => String(str).substr(0, parseInt(length, 10));
            const __qb_right = (str, length) => {
                const s = String(str);
                return s.substr(Math.max(0, s.length - parseInt(length, 10)));
            };
            const __qb_chr = (code) => String.fromCharCode(parseInt(code, 10));
            const __qb_asc = (str) => String(str).charCodeAt(0) || 0;

            // Terminal control helpers
            const __qb_locate = (row, col) => {
                // ANSI escape sequence for cursor positioning (1-based)
                try { self.terminal.write(`\x1b[${parseInt(row,10)};${parseInt(col,10)}H`); } catch (e) { /* ignore */ }
            };
            const __qb_color = (fg, bg) => {
                // ANSI color codes (simplified QBasic color mapping)
                const colors = [30, 34, 32, 36, 31, 35, 33, 37, 90, 94, 92, 96, 91, 95, 93, 97];
                const fgCode = colors[parseInt(fg, 10) % colors.length] || 37;
                const bgCode = (parseInt(bg, 10) > 0) ? (colors[parseInt(bg, 10) % colors.length] || 40) + 10 : 40;
                try { self.terminal.write(`\x1b[${fgCode};${bgCode}m`); } catch (e) { /* ignore */ }
            };

            // Wrap code in an async IIFE and inject helpers
            const wrapped = `(async function(__qb_input, __qb_write, __qb_writeln, __qb_tab, __qb_clear, __qb_len, __qb_mid, __qb_left, __qb_right, __qb_chr, __qb_asc, __qb_locate, __qb_color){\n${jsCode}\n}).call(this, __qb_input, __qb_write, __qb_writeln, __qb_tab, __qb_clear, __qb_len, __qb_mid, __qb_left, __qb_right, __qb_chr, __qb_asc, __qb_locate, __qb_color);`;

            // Evaluate in current context with helpers available
            const func = new Function('__qb_input', '__qb_write', '__qb_writeln', '__qb_tab', '__qb_clear', '__qb_len', '__qb_mid', '__qb_left', '__qb_right', '__qb_chr', '__qb_asc', '__qb_locate', '__qb_color', wrapped);
            await func(__qb_input, __qb_write, __qb_writeln, __qb_tab, __qb_clear, __qb_len, __qb_mid, __qb_left, __qb_right, __qb_chr, __qb_asc, __qb_locate, __qb_color);

            // Restore console
            console.log = originalLog;
            console.error = originalError;
            console.warn = originalWarn;

            this.terminal.writeln('');
            this.terminal.writeln('\x1b[1;32m✅ QBasic program completed successfully\x1b[0m');
            this.updateStatus('Ready');

        } catch (error) {
            this.terminal.writeln('');
            this.terminal.writeln(`\x1b[1;31m❌ Runtime Error: ${error.message}\x1b[0m`);
            this.terminal.writeln('\x1b[1;33m🔍 Debug Info:\x1b[0m');

            // Show the transpiled JavaScript for debugging
            this.terminal.writeln('\x1b[1;36mGenerated JavaScript:\x1b[0m');
            const lines = jsCode.split('\n');
            for (let i = 0; i < lines.length; i++) {
                this.terminal.writeln(`  ${i + 1}: ${lines[i]}`);
            }

            // Show full transpiled code in modal for detailed debugging
            this.terminal.writeln('\x1b[1;35m💡 Tip: Use "View Transpiled JS" button to see full generated code\x1b[0m');

            this.updateStatus('Error');
        }
    }

    /**
     * File system helpers (integrate with NebulaDesktop APIs)
     */
    async showFilePicker(title, extensions) {
        // TODO: Integrate with NebulaDesktop file picker
        // For now, return a mock path
        // If NebulaFilePicker is available, use it
        if (window.NebulaFilePicker) {
            const picker = new window.NebulaFilePicker();
            const res = await picker.open({ startPath: await window.nebula.fs.getHomeDir(), pickType: 'open' });
            return res;
        }

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
        // If NebulaFilePicker is available, use it for save
        if (window.NebulaFilePicker) {
            const picker = new window.NebulaFilePicker();
            const res = await picker.open({ startPath: await window.nebula.fs.getHomeDir(), pickType: 'save' });
            return res;
        }

        const filename = prompt(`${title}:`, `program${extension}`);
        return filename ? `/home/brad/Documents/NebulaDesktop/${filename}` : null;
    }

    async readFile(filePath) {
        // Prefer main process fs API via preload
        try {
            const data = await window.nebula.fs.readFile(filePath);
            return data;
        } catch (e) {
            // Fallback to DOM file read (rare)
            return new Promise((resolve, reject) => {
                const input = document.createElement('input');
                input.type = 'file';
                input.onchange = (ev) => {
                    const file = ev.target.files[0];
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
    }

    async writeFile(filePath, content) {
        // Use main process writeFile if available
        try {
            await window.nebula.fs.writeFile(filePath, content);
            return true;
        } catch (e) {
            // Fallback: trigger download
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filePath.split('/').pop();
            a.click();
            URL.revokeObjectURL(url);
            return true;
        }
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