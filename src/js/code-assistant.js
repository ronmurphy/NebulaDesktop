// Enhanced Code Assistant with JS Execution + Template Loading
// Preserves ALL original functionality + adds new features
class NebulaCodeAssistant {
    constructor() {
        this.windowId = null;
        this.monacoEditor = null;
        this.currentLanguage = 'javascript';
        this.currentAIService = 'claude';
        this.webview = null;
        this.savedProjects = [];
        this.outputVisible = false; // NEW: for output panel
        
        // Available templates for loading - NEW FEATURE
        this.templates = {
            'single-app': {
                name: 'Single Window App',
                description: 'Simple focused application template',
                path: '../src/Templates/NebulaApp-Single.js'
            },
            'tabbed-app': {
                name: 'Tabbed Window App', 
                description: 'Multi-tab application template',
                path: '../src/Templates/NebulaApp-Tabbed.js'
            }
        };
        
        // AI Services (original)
        this.aiServices = {
            claude: { name: 'Claude', url: 'https://claude.ai', icon: '🧠' },
            chatgpt: { name: 'ChatGPT', url: 'https://chat.openai.com', icon: '💬' },
            manus: { name: 'Manus', url: 'https://manus.im', icon: '🤖' },
            perplexity: { name: 'Perplexity', url: 'https://perplexity.ai', icon: '🔍' },
            copilot: { name: 'Copilot', url: 'https://copilot.microsoft.com', icon: '🚀' },
            gemini: { name: 'Gemini', url: 'https://gemini.google.com', icon: '💎' },
            bolt: { name: 'Bolt', url: 'https://bolt.new', icon: '⚡' }
        };
        
        this.init();
    }
    
    async init() {
        if (!window.windowManager) {
            console.error('WindowManager not available');
            return;
        }
        
        this.windowId = window.windowManager.createWindow({
            title: '💻 Code Assistant Pro',
            width: 1400,
            height: 900,
            resizable: true,
            maximizable: true,
            minimizable: true
        });
        
        window.windowManager.loadApp(this.windowId, this);
        console.log(`Code Assistant initialized with window ${this.windowId}`);
    }
    
    render() {
        const container = document.createElement('div');
        container.className = 'code-assistant-container';
        container.style.cssText = `
            height: 100%;
            display: flex;
            background: var(--nebula-bg-primary);
            font-family: var(--nebula-font-family);
        `;
        
        // Left side - Monaco Editor + Controls
        const editorSide = this.createEditorSide();
        
        // Right side - AI Chat with Webview  
        const chatSide = this.createChatSide();
        
        container.appendChild(editorSide);
        container.appendChild(chatSide);
        
        // Setup after DOM is ready
        setTimeout(() => {
            this.setupEventListeners();
            this.initializeMonaco();
            this.createWebview();
        }, 0);
        
        return container;
    }
    
    createEditorSide() {
        const editorSide = document.createElement('div');
        editorSide.className = 'code-editor-side';
        editorSide.style.cssText = `
            flex: 1;
            display: flex;
            flex-direction: column;
            border-right: 1px solid var(--nebula-border);
        `;
        
        // ENHANCED Toolbar with Templates + Run Controls
        const toolbar = document.createElement('div');
        toolbar.className = 'code-toolbar';
        toolbar.style.cssText = `
            padding: 12px 16px;
            border-bottom: 1px solid var(--nebula-border);
            background: var(--nebula-surface);
            display: flex;
            gap: 12px;
            align-items: center;
            flex-wrap: wrap;
        `;
        
        toolbar.innerHTML = `
            <!-- Language & Template Section - ENHANCED -->
            <select id="languageSelect-${this.windowId}" style="
                padding: 6px 12px;
                border: 1px solid var(--nebula-border);
                border-radius: var(--nebula-radius-sm);
                background: var(--nebula-bg-primary);
                color: var(--nebula-text-primary);
            ">
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="json">JSON</option>
                <option value="markdown">Markdown</option>
            </select>
            
            <!-- NEW: Template Selector -->
            <select id="templateSelect-${this.windowId}" style="
                padding: 6px 12px;
                border: 1px solid var(--nebula-border);
                border-radius: var(--nebula-radius-sm);
                background: var(--nebula-bg-primary);
                color: var(--nebula-text-primary);
            ">
                <option value="">📋 Load Template...</option>
                <option value="single-app">🎯 Single Window App</option>
                <option value="tabbed-app">📑 Tabbed Window App</option>
            </select>
            
            <div class="toolbar-separator" style="width: 1px; height: 20px; background: var(--nebula-border); margin: 0 4px;"></div>
            
            <!-- File Operations (original) -->
            <button id="newFileBtn-${this.windowId}" class="toolbar-btn" title="New File (Ctrl+N)">
                <span class="material-symbols-outlined">note_add</span>
            </button>
            
            <button id="saveBtn-${this.windowId}" class="toolbar-btn" title="Save Project (Ctrl+S)">
                <span class="material-symbols-outlined">save</span>
            </button>
            
            <button id="loadBtn-${this.windowId}" class="toolbar-btn" title="Load Project">
                <span class="material-symbols-outlined">folder_open</span>
            </button>
            
            <div class="toolbar-separator" style="width: 1px; height: 20px; background: var(--nebula-border); margin: 0 4px;"></div>
            
            <!-- ⚡ NEW: JS Execution Controls -->
            <button id="runBtn-${this.windowId}" class="toolbar-btn run-btn" title="Run JavaScript (F5)" style="
                background: var(--nebula-success);
                color: white;
                font-weight: 600;
            ">
                <span class="material-symbols-outlined">play_arrow</span>
                <span>Run</span>
            </button>
            
            <button id="debugBtn-${this.windowId}" class="toolbar-btn" title="Debug Mode">
                <span class="material-symbols-outlined">bug_report</span>
            </button>
            
            <button id="toggleOutputBtn-${this.windowId}" class="toolbar-btn" title="Toggle Output Panel">
                <span class="material-symbols-outlined">terminal</span>
            </button>
            
            <div class="toolbar-separator" style="width: 1px; height: 20px; background: var(--nebula-border); margin: 0 4px;"></div>
            
            <!-- Code Operations (original) -->
            <button id="formatBtn-${this.windowId}" class="toolbar-btn" title="Format Code">
                <span class="material-symbols-outlined">code</span>
            </button>
            
            <button id="copyAllBtn-${this.windowId}" class="toolbar-btn" title="Copy All Code">
                <span class="material-symbols-outlined">content_copy</span>
            </button>
            
            <button id="insertToFileBtn-${this.windowId}" class="toolbar-btn" title="Insert Code to File">
                <span class="material-symbols-outlined">insert_drive_file</span>
            </button>
        `;
        
        // Editor Container with Output Panel
        const editorContainer = document.createElement('div');
        editorContainer.style.cssText = `
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 0;
        `;
        
        // Monaco Editor (original)
        const monacoContainer = document.createElement('div');
        monacoContainer.id = `monacoEditor-${this.windowId}`;
        monacoContainer.style.cssText = `
            flex: 1;
            min-height: 0;
        `;
        
        // ⚡ NEW: Output Panel (initially hidden)
        const outputPanel = document.createElement('div');
        outputPanel.id = `outputPanel-${this.windowId}`;
        outputPanel.className = 'output-panel';
        outputPanel.style.cssText = `
            height: 0;
            background: #1a1a1a;
            border-top: 1px solid var(--nebula-border);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            transition: height 0.3s ease;
        `;
        
        outputPanel.innerHTML = `
            <div style="
                padding: 8px 16px;
                background: var(--nebula-surface);
                border-bottom: 1px solid var(--nebula-border);
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 12px;
                font-weight: 600;
                color: var(--nebula-text-primary);
            ">
                <span>🖥️ JavaScript Output</span>
                <button id="clearOutputBtn-${this.windowId}" style="
                    background: none;
                    border: none;
                    color: var(--nebula-text-secondary);
                    cursor: pointer;
                    padding: 4px;
                ">
                    <span class="material-symbols-outlined" style="font-size: 16px;">clear</span>
                </button>
            </div>
            <div id="outputContent-${this.windowId}" style="
                flex: 1;
                padding: 16px;
                font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
                font-size: 13px;
                line-height: 1.4;
                color: #d4d4d4;
                overflow: auto;
                white-space: pre-wrap;
            ">Ready to run JavaScript code... 🚀</div>
        `;
        
        editorContainer.appendChild(monacoContainer);
        editorContainer.appendChild(outputPanel);
        
        editorSide.appendChild(toolbar);
        editorSide.appendChild(editorContainer);
        
        return editorSide;
    }
    
    createChatSide() {
        const chatSide = document.createElement('div');
        chatSide.className = 'code-chat-side';
        chatSide.style.cssText = `
            width: 400px;
            display: flex;
            flex-direction: column;
            background: var(--nebula-surface);
        `;
        
        // AI Service Selector (original + enhanced)
        const chatHeader = document.createElement('div');
        chatHeader.style.cssText = `
            padding: 12px 16px;
            border-bottom: 1px solid var(--nebula-border);
            background: var(--nebula-surface-elevated);
        `;
        
        chatHeader.innerHTML = `
            <div style="margin-bottom: 12px;">
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--nebula-text-secondary); margin-bottom: 4px;">AI ASSISTANT</label>
                <select id="aiServiceSelect-${this.windowId}" style="
                    width: 100%;
                    padding: 8px 12px;
                    border: 1px solid var(--nebula-border);
                    border-radius: var(--nebula-radius-sm);
                    background: var(--nebula-bg-primary);
                    color: var(--nebula-text-primary);
                ">
                    ${Object.entries(this.aiServices).map(([key, service]) => 
                        `<option value="${key}">${service.icon} ${service.name}</option>`
                    ).join('')}
                </select>
            </div>
            
            <!-- Quick AI Actions (original) -->
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <button id="explainCodeBtn-${this.windowId}" class="ai-action-btn">
                    📖 Explain
                </button>
                <button id="optimizeCodeBtn-${this.windowId}" class="ai-action-btn">
                    ⚡ Optimize
                </button>
                <button id="debugCodeBtn-${this.windowId}" class="ai-action-btn">
                    🐛 Debug
                </button>
                <button id="addCommentsBtn-${this.windowId}" class="ai-action-btn">
                    💬 Comment
                </button>
                <button id="generateTestsBtn-${this.windowId}" class="ai-action-btn">
                    🧪 Tests
                </button>
                <button id="pasteFromAIBtn-${this.windowId}" class="ai-action-btn">
                    📥 Paste AI
                </button>
            </div>
        `;
        
        // Webview Container (original)
        const webviewContainer = document.createElement('div');
        webviewContainer.id = `webviewContainer-${this.windowId}`;
        webviewContainer.style.cssText = `
            flex: 1;
            position: relative;
            background: var(--nebula-bg-primary);
        `;
        
        // Loading indicator (original)
        webviewContainer.innerHTML = `
            <div id="chatLoading-${this.windowId}" style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: var(--nebula-text-secondary);
                font-size: 14px;
                text-align: center;
                z-index: 10;
            ">
                <div style="font-size: 24px; margin-bottom: 8px; animation: spin 2s linear infinite;">⚙️</div>
                Loading AI Assistant...
            </div>
        `;
        
        chatSide.appendChild(chatHeader);
        chatSide.appendChild(webviewContainer);
        
        return chatSide;
    }
    
    setupEventListeners() {
        // NEW: Template selector
        document.getElementById(`templateSelect-${this.windowId}`)?.addEventListener('change', (e) => {
            if (e.target.value) {
                this.loadTemplate(e.target.value);
                e.target.value = ''; // Reset selector
            }
        });
        
        // Language selector (original)
        document.getElementById(`languageSelect-${this.windowId}`)?.addEventListener('change', (e) => {
            this.switchLanguage(e.target.value);
        });
        
        // AI Service selector (original)
        document.getElementById(`aiServiceSelect-${this.windowId}`)?.addEventListener('change', (e) => {
            this.switchAIService(e.target.value);
        });
        
        // File operations (original)
        document.getElementById(`newFileBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.newFile();
        });
        
        document.getElementById(`saveBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.saveProject();
        });
        
        document.getElementById(`loadBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.showLoadProjectDialog();
        });
        
        // ⚡ NEW: JS Execution Controls
        document.getElementById(`runBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.runJavaScript();
        });
        
        document.getElementById(`debugBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.debugCode();
        });
        
        document.getElementById(`toggleOutputBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.toggleOutputPanel();
        });
        
        document.getElementById(`clearOutputBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.clearOutput();
        });
        
        // Code operations (original)
        document.getElementById(`formatBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.formatCode();
        });
        
        document.getElementById(`copyAllBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.copyAllCode();
        });
        
        document.getElementById(`insertToFileBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.insertCodeToFile();
        });
        
        // AI Actions (original)
        document.getElementById(`explainCodeBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.explainCode();
        });
        
        document.getElementById(`optimizeCodeBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.optimizeCode();
        });
        
        document.getElementById(`debugCodeBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.debugCode();
        });
        
        document.getElementById(`addCommentsBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.addComments();
        });
        
        document.getElementById(`generateTestsBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.generateTests();
        });
        
        document.getElementById(`pasteFromAIBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.pasteFromAI();
        });
        
        // Keyboard shortcuts (original + enhanced)
        document.addEventListener('keydown', (e) => {
            if (!this.isWindowActive()) return;
            
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveProject();
            }
            
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                this.newFile();
            }
            
            // NEW: F5 for running JavaScript
            if (e.key === 'F5') {
                e.preventDefault();
                this.runJavaScript();
            }
        });
        
        // Add CSS for button styles
        this.addToolbarStyles();
    }
    
    // ⚡ NEW: JavaScript Execution (extracted from NebulaTerminal)
    runJavaScript() {
        if (!this.monacoEditor) {
            this.writeOutput('Error: Editor not initialized', 'error');
            return;
        }
        
        const code = this.monacoEditor.getValue();
        if (!code.trim()) {
            this.writeOutput('Error: No code to execute', 'error');
            return;
        }
        
        // Show output panel if hidden
        if (!this.outputVisible) {
            this.toggleOutputPanel();
        }
        
        this.executeJS(code);
    }
    
    executeJS(code) {
        this.writeOutput(`> Running JavaScript...\n`, 'info');
        
        try {
            // Capture console output (from Terminal's executeJS method)
            const originalLog = console.log;
            const originalError = console.error;
            const originalWarn = console.warn;
            let output = '';
            
            const captureOutput = (...args) => {
                output += args.map(arg => 
                    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                ).join(' ') + '\n';
            };
            
            console.log = captureOutput;
            console.error = captureOutput;
            console.warn = captureOutput;
            
            // Execute code in safe context
            const result = Function('"use strict"; return (' + code + ')')();
            
            // Restore console methods
            console.log = originalLog;
            console.error = originalError;
            console.warn = originalWarn;
            
            // Show captured output
            if (output) {
                this.writeOutput('Console Output:', 'success');
                this.writeOutput(output.trim(), 'output');
            }
            
            // Show result if not undefined
            if (result !== undefined) {
                this.writeOutput('\nResult:', 'success');
                this.writeOutput(
                    typeof result === 'object' ? 
                        JSON.stringify(result, null, 2) : String(result), 
                    'result'
                );
            }
            
            this.writeOutput('\n✅ Execution completed successfully\n', 'success');
            
        } catch (error) {
            this.writeOutput(`❌ JavaScript Error: ${error.message}\n`, 'error');
        }
    }
    
    // ⚡ NEW: Output Panel Management
    toggleOutputPanel() {
        const outputPanel = document.getElementById(`outputPanel-${this.windowId}`);
        if (!outputPanel) return;
        
        this.outputVisible = !this.outputVisible;
        
        if (this.outputVisible) {
            outputPanel.style.height = '250px';
        } else {
            outputPanel.style.height = '0';
        }
        
        // Update button appearance
        const toggleBtn = document.getElementById(`toggleOutputBtn-${this.windowId}`);
        if (toggleBtn) {
            toggleBtn.style.background = this.outputVisible ? 'var(--nebula-primary)' : '';
            toggleBtn.style.color = this.outputVisible ? 'white' : '';
        }
    }
    
    writeOutput(text, type = 'output') {
        const outputContent = document.getElementById(`outputContent-${this.windowId}`);
        if (!outputContent) return;
        
        const colors = {
            info: '#61dafb',
            success: '#4ade80', 
            error: '#ef4444',
            result: '#fbbf24',
            output: '#d4d4d4'
        };
        
        const span = document.createElement('span');
        span.style.color = colors[type] || colors.output;
        span.textContent = text + '\n';
        
        outputContent.appendChild(span);
        outputContent.scrollTop = outputContent.scrollHeight;
    }
    
    clearOutput() {
        const outputContent = document.getElementById(`outputContent-${this.windowId}`);
        if (outputContent) {
            outputContent.innerHTML = 'Output cleared... 🧹\n';
        }
    }
    
    // ⚡ NEW: Template Loading System
    async loadTemplate(templateKey) {
        const template = this.templates[templateKey];
        if (!template) {
            alert('Template not found!');
            return;
        }
        
        try {
            this.writeOutput(`Loading template: ${template.name}...`, 'info');
            
            // Fetch the actual template file from src/Templates/
            const response = await fetch(template.path);
            if (!response.ok) {
                throw new Error(`Failed to fetch template: ${response.status}`);
            }
            
            const templateContent = await response.text();
            
            if (this.monacoEditor) {
                const currentCode = this.monacoEditor.getValue();
                if (currentCode.trim() && !confirm(`Load template "${template.name}"?\n\nThis will replace current code.`)) {
                    return;
                }
                
                this.monacoEditor.setValue(templateContent);
                this.writeOutput(`✅ Template "${template.name}" loaded successfully!`, 'success');
            }
            
        } catch (error) {
            this.writeOutput(`❌ Failed to load template: ${error.message}`, 'error');
            console.error('Template loading error:', error);
            
            // Fallback to embedded templates if fetch fails
            this.writeOutput('Falling back to embedded template...', 'info');
            this.loadEmbeddedTemplate(templateKey);
        }
    }
    
    // Fallback method for embedded templates (simple versions)
    loadEmbeddedTemplate(templateKey) {
        let templateContent = '';
        
        if (templateKey === 'single-app') {
            templateContent = '// NebulaApp Single Window Template\n' +
                'class NebulaMyApp {\n' +
                '    constructor() {\n' +
                '        this.windowId = null;\n' +
                '        this.init();\n' +
                '    }\n' +
                '    \n' +
                '    async init() {\n' +
                '        if (!window.windowManager) return;\n' +
                '        \n' +
                '        this.windowId = window.windowManager.createWindow({\n' +
                '            title: "My App",\n' +
                '            width: 800,\n' +
                '            height: 600,\n' +
                '            resizable: true\n' +
                '        });\n' +
                '        \n' +
                '        window.windowManager.loadApp(this.windowId, this);\n' +
                '    }\n' +
                '    \n' +
                '    render() {\n' +
                '        const container = document.createElement("div");\n' +
                '        container.innerHTML = "<h1>My App Content</h1>";\n' +
                '        return container;\n' +
                '    }\n' +
                '    \n' +
                '    getTitle() { return "My App"; }\n' +
                '    getIcon() { return "🚀"; }\n' +
                '    cleanup() { console.log("Cleanup"); }\n' +
                '}\n' +
                '\n' +
                'window.NebulaMyApp = NebulaMyApp;';
        } else if (templateKey === 'tabbed-app') {
            templateContent = '// NebulaApp Tabbed Window Template\n' +
                'class NebulaMyTabbedApp {\n' +
                '    constructor() {\n' +
                '        this.windowId = null;\n' +
                '        this.tabs = new Map();\n' +
                '        this.init();\n' +
                '    }\n' +
                '    \n' +
                '    async init() {\n' +
                '        if (!window.windowManager) return;\n' +
                '        \n' +
                '        this.windowId = window.windowManager.createWindow({\n' +
                '            title: "My Tabbed App",\n' +
                '            width: 1200,\n' +
                '            height: 700,\n' +
                '            hasTabBar: false,\n' +
                '            resizable: true\n' +
                '        });\n' +
                '        \n' +
                '        window.windowManager.loadApp(this.windowId, this);\n' +
                '    }\n' +
                '    \n' +
                '    render() {\n' +
                '        const container = document.createElement("div");\n' +
                '        container.innerHTML = "<h1>My Tabbed App</h1>";\n' +
                '        return container;\n' +
                '    }\n' +
                '    \n' +
                '    getTitle() { return "My Tabbed App"; }\n' +
                '    getIcon() { return "📑"; }\n' +
                '    cleanup() { console.log("Cleanup"); }\n' +
                '}\n' +
                '\n' +
                'window.NebulaMyTabbedApp = NebulaMyTabbedApp;';
        }
        
        if (this.monacoEditor && templateContent) {
            this.monacoEditor.setValue(templateContent);
            this.writeOutput('✅ Fallback template loaded!', 'success');
        }
    }
    
    // Continue with existing methods...
    async initializeMonaco() {
        try {
            // Load Monaco Editor from CDN if not already loaded
            if (!window.monaco) {
                await this.loadMonaco();
            }
            
            const container = document.getElementById(`monacoEditor-${this.windowId}`);
            if (!container) return;
            
            this.monacoEditor = monaco.editor.create(container, {
                value: this.getWelcomeCode(),
                language: this.currentLanguage,
                theme: 'vs-dark',
                fontSize: 14,
                fontFamily: 'Consolas, Monaco, Courier New, monospace',
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                wordWrap: 'on',
                bracketPairColorization: { enabled: true },
                guides: {
                    bracketPairs: true,
                    indentation: true
                }
            });
            
            console.log('Monaco Editor initialized');
        } catch (error) {
            console.error('Failed to initialize Monaco Editor:', error);
            // Fallback to textarea if Monaco fails
            this.createFallbackEditor();
        }
    }
    
    /**
     * Load Monaco Editor from CDN (original)
     */
    loadMonaco() {
        return new Promise((resolve, reject) => {
            if (window.monaco) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/loader.min.js';
            script.onload = () => {
                require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' } });
                require(['vs/editor/editor.main'], () => {
                    resolve();
                });
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    /**
     * Create fallback textarea editor if Monaco fails (original)
     */
    createFallbackEditor() {
        const container = document.getElementById(`monacoEditor-${this.windowId}`);
        if (!container) return;
        
        container.innerHTML = `
            <textarea id="fallbackEditor-${this.windowId}" style="
                width: 100%;
                height: 100%;
                border: none;
                padding: 16px;
                font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
                font-size: 14px;
                background: #1e1e1e;
                color: #d4d4d4;
                resize: none;
                outline: none;
                line-height: 1.6;
                tab-size: 4;
            " placeholder="// Monaco Editor failed to load, using fallback editor">${this.getWelcomeCode()}</textarea>
        `;
        
        this.monacoEditor = {
            getValue: () => document.getElementById(`fallbackEditor-${this.windowId}`)?.value || '',
            setValue: (value) => {
                const editor = document.getElementById(`fallbackEditor-${this.windowId}`);
                if (editor) editor.value = value;
            },
            getModel: () => ({ getLanguageId: () => this.currentLanguage })
        };
    }
    
    /**
     * Get welcome code example (original + enhanced)
     */
    getWelcomeCode() {
        const examples = {
            javascript: `// 🚀 Welcome to Enhanced Code Assistant!
// Now with JS execution + template loading

// Try these features:
// 1. 📋 Load templates from the dropdown above
// 2. ▶️ Click "Run" or press F5 to execute JavaScript
// 3. 🤖 Use AI buttons to get code help
// 4. 💾 Save your projects for later

// Example: Run this code with the Run button!
function greetUser(name = "Developer") {
    const message = 'Hello, ' + name + '! 🎉';
    console.log(message);
    
    // This will appear in the output panel
    console.log("Current time:", new Date().toLocaleTimeString());
    
    return {
        greeting: message,
        timestamp: Date.now(),
        features: ["JS Execution", "Template Loading", "AI Integration"]
    };
}

// Call the function - result will show in output
greetUser("Nebula Coder");

// TODO: Start coding your amazing project here!`,
            
            python: `# Welcome to Nebula Code Assistant! 🚀
# This Monaco editor supports full Python syntax highlighting

def greet_user(name="Developer"):
    message = f"Hello, {name}! Ready to code?"
    print(message)
    return message

# Try the AI buttons on the right →
# • Select an AI service (ChatGPT, Claude, etc.)
# • Click "Explain Code" to understand this code
# • Click "Optimize" for performance tips
# • Use "Paste from AI" to insert generated code

greet_user("Nebula User")

# TODO: Start coding your amazing project here!`,
            
            html: `<!-- Welcome to Nebula Code Assistant! 🚀 -->
<!-- This Monaco editor supports full HTML syntax highlighting -->

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Amazing Project</title>
</head>
<body>
    <h1>Hello, Nebula User! 👋</h1>
    <p>Ready to code?</p>
    
    <!-- Try the AI buttons on the right → -->
    <!-- • Select an AI service (ChatGPT, Claude, etc.) -->
    <!-- • Click "Explain Code" to understand this structure -->
    <!-- • Use "Paste from AI" to insert generated code -->
    
    <!-- TODO: Start building your amazing website here! -->
</body>
</html>`,

            css: `/* Welcome to Nebula Code Assistant! 🚀 */
/* This Monaco editor supports full CSS syntax highlighting */

:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    --text-color: #333;
    --bg-color: #f8f9fa;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    color: var(--text-color);
    margin: 0;
    padding: 20px;
}

.container {
    max-width: 800px;
    margin: 0 auto;
    background: var(--bg-color);
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

/* Try the AI buttons on the right → */
/* • Click "Explain Code" to understand this CSS */
/* • Use "Optimize" for better performance tips */
/* • Use "Paste from AI" to insert generated styles */

/* TODO: Start styling your amazing project here! */`,

            typescript: `// Welcome to Nebula Code Assistant! 🚀
// This Monaco editor supports full TypeScript syntax highlighting

interface User {
    name: string;
    email: string;
    isActive: boolean;
}

class UserManager {
    private users: User[] = [];
    
    constructor() {
        console.log('UserManager initialized');
    }
    
    addUser(user: User): void {
        this.users.push(user);
        console.log('Added user: ' + user.name);
    }
    
    getActiveUsers(): User[] {
        return this.users.filter(user => user.isActive);
    }
}

// Try the AI buttons on the right →
// • Click "Explain Code" to understand TypeScript concepts
// • Use "Optimize" for better type safety tips
// • Use "Paste from AI" to insert generated code

const userManager = new UserManager();
userManager.addUser({
    name: "Nebula Developer",
    email: "dev@nebula.com",
    isActive: true
});

// TODO: Start coding your amazing TypeScript project here!`,

            json: `{
  "name": "my-nebula-project",
  "version": "1.0.0",
  "description": "An amazing project built with Nebula Code Assistant 🚀",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.0",
    "lodash": "^4.17.21"
  },
  "devDependencies": {
    "nodemon": "^2.0.20",
    "jest": "^29.0.0"
  },
  "keywords": [
    "nebula",
    "desktop",
    "electron",
    "javascript"
  ],
  "author": "Nebula Developer",
  "license": "MIT"
}`,

            markdown: `# Welcome to Nebula Code Assistant! 🚀

This Monaco editor supports full **Markdown** syntax highlighting with live preview capabilities.

## Features

- ✅ **Syntax Highlighting** - Beautiful code coloring
- ✅ **AI Integration** - Smart code assistance  
- ✅ **Template Loading** - Quick project starters
- ✅ **Live Execution** - Run JavaScript instantly
- ✅ **Multi-language Support** - JS, Python, HTML, CSS, and more

## Quick Start

1. 📋 Load a template from the dropdown above
2. ✏️ Edit the code in the Monaco editor
3. ▶️ Press **F5** or click **Run** to execute JavaScript
4. 🤖 Use AI buttons for code help and optimization

## Code Example

\`\`\`javascript
function createAmazingApp() {
    console.log('Building something awesome with Nebula! 🌟');
    return { success: true, message: 'Ready to code!' };
}
\`\`\`

## Try the AI Features →

- 📖 **Explain** - Understand code concepts
- ⚡ **Optimize** - Improve performance  
- 🐛 **Debug** - Find and fix issues
- 💬 **Comment** - Add helpful comments
- 🧪 **Tests** - Generate unit tests

---

**TODO:** Start building your amazing project here!`
        };
        
        return examples[this.currentLanguage] || examples.javascript;
    }
    
    /**
     * Create webview for AI service (original)
     */
    createWebview() {
        const container = document.getElementById(`webviewContainer-${this.windowId}`);
        if (!container) return;
        
        this.showLoading();
        
        // Remove existing webview
        if (this.webview) {
            this.webview.remove();
            this.webview = null;
        }
        
        // Create new webview
        this.webview = document.createElement('webview');
        this.webview.className = 'code-webview';
        this.webview.style.cssText = `
            width: 100%;
            height: 100%;
            border: none;
            background: var(--nebula-bg-primary);
        `;
        
        const currentService = this.aiServices[this.currentAIService];
        this.webview.src = currentService.url;
        
        this.setupWebviewListeners();
        container.appendChild(this.webview);
        
        console.log(`Created code webview for ${currentService.name}`);
    }
    
    /**
     * Set up webview event listeners (original)
     */
    setupWebviewListeners() {
        if (!this.webview) return;
        
        this.webview.addEventListener('dom-ready', () => {
            this.hideLoading();
            console.log('Code AI webview loaded');
        });
        
        this.webview.addEventListener('did-start-loading', () => {
            this.showLoading();
        });
        
        this.webview.addEventListener('did-stop-loading', () => {
            this.hideLoading();
        });
        
        this.webview.addEventListener('did-fail-load', (e) => {
            this.hideLoading();
            console.error('Code AI webview failed to load:', e);
        });
        
        this.webview.addEventListener('new-window', (e) => {
            e.preventDefault();
            console.log('New window requested:', e.url);
        });
    }
    
    /**
     * Switch programming language (original)
     */
    switchLanguage(language) {
        this.currentLanguage = language;
        
        if (this.monacoEditor && monaco) {
            monaco.editor.setModelLanguage(this.monacoEditor.getModel(), language);
        }
        
        console.log(`Switched to ${language}`);
    }
    
    /**
     * Switch AI service (original)
     */
    switchAIService(serviceKey) {
        if (!this.aiServices[serviceKey]) {
            console.error('Unknown AI service:', serviceKey);
            return;
        }
        
        this.currentAIService = serviceKey;
        this.createWebview();
        
        console.log(`Switched to ${this.aiServices[serviceKey].name}`);
    }
    
    /**
     * Show/hide loading indicator (original)
     */
    showLoading() {
        const loading = document.getElementById(`chatLoading-${this.windowId}`);
        if (loading) loading.style.display = 'block';
    }
    
    hideLoading() {
        const loading = document.getElementById(`chatLoading-${this.windowId}`);
        if (loading) loading.style.display = 'none';
    }
    
    /**
     * File operations (original)
     */
    newFile() {
        if (this.monacoEditor) {
            const currentCode = this.monacoEditor.getValue();
            if (currentCode.trim() && !confirm('Create new file? Current code will be lost.')) {
                return;
            }
            this.monacoEditor.setValue('');
        }
        // NEW: also clear output when creating new file
        this.clearOutput();
        console.log('New file created');
    }
    
    saveProject() {
        if (!this.monacoEditor) return;
        
        const code = this.monacoEditor.getValue();
        if (!code.trim()) {
            alert('No code to save!');
            return;
        }
        
        const projectName = prompt('Enter project name:') || `Project ${Date.now()}`;
        const project = {
            id: Date.now(),
            name: projectName,
            code: code,
            language: this.currentLanguage,
            timestamp: Date.now()
        };
        
        this.savedProjects.push(project);
        console.log('Project saved:', project);
        alert(`Project "${projectName}" saved successfully!`);
    }
    
    showLoadProjectDialog() {
        if (this.savedProjects.length === 0) {
            alert('No saved projects found!');
            return;
        }
        
        const projectsList = this.savedProjects.map((project, index) => 
            `${index + 1}. ${project.name} (${project.language}) - ${new Date(project.timestamp).toLocaleDateString()}`
        ).join('\n');
        
        const selection = prompt(`Select a project to load:\n\n${projectsList}\n\nEnter project number:`);
        const projectIndex = parseInt(selection) - 1;
        
        if (projectIndex >= 0 && projectIndex < this.savedProjects.length) {
            this.loadProject(projectIndex);
        }
    }
    
    loadProject(index) {
        const project = this.savedProjects[index];
        if (!project || !this.monacoEditor) return;
        
        this.monacoEditor.setValue(project.code);
        this.switchLanguage(project.language);
        
        // Update language selector
        const languageSelect = document.getElementById(`languageSelect-${this.windowId}`);
        if (languageSelect) languageSelect.value = project.language;
        
        console.log(`Loaded project: ${project.name}`);
    }
    
    /**
     * Code operations (original)
     */
    formatCode() {
        if (this.monacoEditor && monaco) {
            this.monacoEditor.getAction('editor.action.formatDocument').run();
            console.log('Code formatted');
        }
    }
    
    copyAllCode() {
        if (this.monacoEditor) {
            const code = this.monacoEditor.getValue();
            navigator.clipboard.writeText(code).then(() => {
                alert('Code copied to clipboard!');
            }).catch(() => {
                alert('Failed to copy code');
            });
        }
    }
    
    insertCodeToFile() {
        if (!this.monacoEditor) return;
        
        const code = this.monacoEditor.getValue();
        if (!code.trim()) {
            alert('No code to insert!');
            return;
        }
        
        // TODO: Implement actual file insertion using Electron APIs
        console.log('Would insert code to file:', { code, language: this.currentLanguage });
        alert(`Ready to insert ${this.currentLanguage} code to file!\n\nThis would open a file picker and insert the code.`);
    }
    
    /**
     * AI-powered code actions (original)
     */
    explainCode() {
        if (!this.monacoEditor) return;
        
        const code = this.monacoEditor.getValue();
        if (!code.trim()) {
            alert('Please enter some code first!');
            return;
        }
        
        // Copy code to clipboard for pasting into AI
        navigator.clipboard.writeText(`Please explain this ${this.currentLanguage} code:\n\n\`\`\`${this.currentLanguage}\n${code}\n\`\`\``);
        alert('Code explanation prompt copied to clipboard!\nPaste it into the AI chat on the right.');
    }
    
    optimizeCode() {
        if (!this.monacoEditor) return;
        
        const code = this.monacoEditor.getValue();
        if (!code.trim()) {
            alert('Please enter some code first!');
            return;
        }
        
        navigator.clipboard.writeText(`Please optimize this ${this.currentLanguage} code for better performance:\n\n\`\`\`${this.currentLanguage}\n${code}\n\`\`\``);
        alert('Code optimization prompt copied to clipboard!\nPaste it into the AI chat on the right.');
    }
    
    debugCode() {
        if (!this.monacoEditor) return;
        
        const code = this.monacoEditor.getValue();
        if (!code.trim()) {
            alert('Please enter some code first!');
            return;
        }
        
        navigator.clipboard.writeText(`Please help me debug this ${this.currentLanguage} code and find potential issues:\n\n\`\`\`${this.currentLanguage}\n${code}\n\`\`\``);
        alert('Debug prompt copied to clipboard!\nPaste it into the AI chat on the right.');
    }
    
    addComments() {
        if (!this.monacoEditor) return;
        
        const code = this.monacoEditor.getValue();
        if (!code.trim()) {
            alert('Please enter some code first!');
            return;
        }
        
        navigator.clipboard.writeText(`Please add helpful comments to this ${this.currentLanguage} code:\n\n\`\`\`${this.currentLanguage}\n${code}\n\`\`\``);
        alert('Add comments prompt copied to clipboard!\nPaste it into the AI chat on the right.');
    }
    
    generateTests() {
        if (!this.monacoEditor) return;
        
        const code = this.monacoEditor.getValue();
        if (!code.trim()) {
            alert('Please enter some code first!');
            return;
        }
        
        navigator.clipboard.writeText(`Please generate unit tests for this ${this.currentLanguage} code:\n\n\`\`\`${this.currentLanguage}\n${code}\n\`\`\``);
        alert('Generate tests prompt copied to clipboard!\nPaste it into the AI chat on the right.');
    }
    
    /**
     * Paste AI-generated code (original)
     */
    async pasteFromAI() {
        if (!this.monacoEditor) return;
        
        try {
            const clipboardText = await navigator.clipboard.readText();
            
            // Try to extract code from clipboard (look for code blocks)
            const codeBlockMatch = clipboardText.match(/```[\w]*\n?([\s\S]*?)\n?```/);
            const codeToInsert = codeBlockMatch ? codeBlockMatch[1] : clipboardText;
            
            if (codeToInsert.trim()) {
                this.monacoEditor.setValue(codeToInsert);
                alert('Code pasted from clipboard!');
            } else {
                alert('No code found in clipboard!');
            }
        } catch (error) {
            alert('Failed to read from clipboard. Please paste manually.');
        }
    }
    
    /**
     * Utility methods (original)
     */
    isWindowActive() {
        const windowElement = document.getElementById(this.windowId);
        return windowElement && windowElement.contains(document.activeElement);
    }
    
    addToolbarStyles() {
        if (document.querySelector('#code-assistant-toolbar-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'code-assistant-toolbar-styles';
        style.textContent = `
            .toolbar-btn {
                background: var(--nebula-surface-hover);
                border: 1px solid var(--nebula-border);
                color: var(--nebula-text-primary);
                padding: 8px 12px;
                border-radius: var(--nebula-radius-sm);
                cursor: pointer;
                font-size: 13px;
                transition: var(--nebula-transition-fast);
                display: flex;
                align-items: center;
                gap: 6px;
                font-weight: 500;
            }
            
            .toolbar-btn:hover {
                background: var(--nebula-surface-active);
                border-color: var(--nebula-border-hover);
            }
            
            .toolbar-btn .material-symbols-outlined {
                font-size: 16px;
            }
            
            .run-btn:hover {
                background: var(--nebula-success-hover) !important;
            }
            
            .ai-action-btn {
                background: var(--nebula-surface);
                border: 1px solid var(--nebula-border);
                color: var(--nebula-text-primary);
                padding: 6px 10px;
                border-radius: var(--nebula-radius-sm);
                cursor: pointer;
                font-size: 11px;
                transition: var(--nebula-transition-fast);
                white-space: nowrap;
            }
            
            .ai-action-btn:hover {
                background: var(--nebula-surface-hover);
                border-color: var(--nebula-primary);
            }
            
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * Required methods for WindowManager integration (original)
     */
    getTitle() {
        return 'Code Assistant Pro';
    }
    
    getIcon() {
        return '💻';
    }
    
    cleanup() {
        if (this.monacoEditor) {
            this.monacoEditor.dispose();
            this.monacoEditor = null;
        }
        console.log('Code Assistant cleanup');
    }
}

// Export for use in NebulaDesktop (original)
window.NebulaCodeAssistant = NebulaCodeAssistant;