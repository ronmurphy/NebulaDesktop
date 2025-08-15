// Enhanced Code Assistant with JS Execution + Template Loading
class NebulaCodeAssistant {
    constructor() {
        this.windowId = null;
        this.monacoEditor = null;
        this.currentLanguage = 'javascript';
        this.currentAIService = 'claude';
        this.webview = null;
        this.savedProjects = [];
        this.outputVisible = false;
        
        // Available templates for loading
        this.templates = {
            'single-app': {
                name: 'Single Window App',
                description: 'Simple focused application template',
                path: 'src/Templates/NebulaApp-Single.js'
            },
            'tabbed-app': {
                name: 'Tabbed Window App', 
                description: 'Multi-tab application template',
                path: 'src/Templates/NebulaApp-Tabbed.js'
            }
        };
        
        // AI Services
        this.aiServices = {
            claude: { name: 'Claude', url: 'https://claude.ai', icon: '🧠' },
            chatgpt: { name: 'ChatGPT', url: 'https://chat.openai.com', icon: '💬' },
            manus: { name: 'Manus', url: 'https://manus.im', icon: '🤖' },
            perplexity: { name: 'Perplexity', url: 'https://perplexity.ai', icon: '🔍' },
            copilot: { name: 'Copilot', url: 'https://copilot.microsoft.com', icon: '🚀' },
            gemini: { name: 'Gemini', url: 'https://gemini.google.com', icon: '💎' }
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
        
        // Enhanced Toolbar with Templates + Run Controls
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
            <!-- Language & Template Section -->
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
            
            <!-- File Operations -->
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
            
            <!-- Code Operations -->
            <button id="formatBtn-${this.windowId}" class="toolbar-btn" title="Format Code">
                <span class="material-symbols-outlined">code</span>
            </button>
            
            <button id="copyAllBtn-${this.windowId}" class="toolbar-btn" title="Copy All Code">
                <span class="material-symbols-outlined">content_copy</span>
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
        
        // Monaco Editor
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
        
        // AI Service Selector
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
            
            <!-- Quick AI Actions -->
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
        
        // Webview Container
        const webviewContainer = document.createElement('div');
        webviewContainer.id = `webviewContainer-${this.windowId}`;
        webviewContainer.style.cssText = `
            flex: 1;
            position: relative;
            background: var(--nebula-bg-primary);
        `;
        
        // Loading indicator
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
        // Template selector
        document.getElementById(`templateSelect-${this.windowId}`)?.addEventListener('change', (e) => {
            if (e.target.value) {
                this.loadTemplate(e.target.value);
                e.target.value = ''; // Reset selector
            }
        });
        
        // Language selector
        document.getElementById(`languageSelect-${this.windowId}`)?.addEventListener('change', (e) => {
            this.switchLanguage(e.target.value);
        });
        
        // AI Service selector
        document.getElementById(`aiServiceSelect-${this.windowId}`)?.addEventListener('change', (e) => {
            this.switchAIService(e.target.value);
        });
        
        // File operations
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
        
        // Code operations
        document.getElementById(`formatBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.formatCode();
        });
        
        document.getElementById(`copyAllBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.copyAllCode();
        });
        
        // AI Actions
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
        
        // Keyboard shortcuts
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
            
            // In a real implementation, this would fetch from the file system
            // For now, we'll simulate with example content
            let templateContent = '';
            
            if (templateKey === 'single-app') {
                templateContent = this.getSingleAppTemplate();
            } else if (templateKey === 'tabbed-app') {
                templateContent = this.getTabbedAppTemplate();
            }
            
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
        }
    }
    
    getSingleAppTemplate() {
        return `// NebulaApp Single Window Template
// TODO: Replace 'MyApp' with your app name throughout this file

class NebulaMyApp {
    constructor() {
        this.windowId = null;
        // TODO: Initialize your app's data properties
        
        this.init();
    }
    
    async init() {
        if (!window.windowManager) {
            console.error('WindowManager not available');
            return;
        }
        
        // TODO: Customize window configuration
        this.windowId = window.windowManager.createWindow({
            title: 'My App', // TODO: Change app title
            width: 800,      // TODO: Adjust default width
            height: 600,     // TODO: Adjust default height
            resizable: true,
            maximizable: true,
            minimizable: true
        });
        
        // Load this app into the window
        window.windowManager.loadApp(this.windowId, this);
        
        console.log(\`MyApp initialized with window \${this.windowId}\`);
    }
    
    render() {
        const container = document.createElement('div');
        container.className = 'myapp-container';
        container.style.cssText = \`
            width: 100%;
            height: 100%;
            background: var(--nebula-bg-primary);
            display: flex;
            flex-direction: column;
            overflow: hidden;
        \`;
        
        // TODO: Build your app's UI here
        container.innerHTML = \`
            <div class="myapp-toolbar">
                <h2>My Awesome App</h2>
                <button id="demoBtn">Demo Action</button>
            </div>
            <div class="myapp-content">
                <p>Replace this with your app content!</p>
            </div>
            <div class="myapp-status">
                <span>Ready</span>
            </div>
        \`;
        
        // TODO: Add your event listeners
        setTimeout(() => {
            document.getElementById('demoBtn')?.addEventListener('click', () => {
                alert('Hello from your new NebulaApp!');
            });
        }, 0);
        
        return container;
    }
    
    // Required methods for WindowManager integration
    getTitle() {
        return 'My App';
    }
    
    getIcon() {
        return '🚀';
    }
    
    cleanup() {
        console.log('MyApp cleanup completed');
    }
}

// Export for use in NebulaDesktop
window.NebulaMyApp = NebulaMyApp;

// Auto-launch for testing (remove in production)
// new NebulaMyApp();`;
    }
    
    getTabbedAppTemplate() {
        return `// NebulaApp Tabbed Window Template
// TODO: Replace 'MyTabbedApp' with your app name throughout this file

class NebulaMyTabbedApp {
    constructor() {
        this.windowId = null;
        this.tabs = new Map(); // tabId -> tabData
        this.activeTabId = null;
        this.nextTabId = 1;
        
        this.init();
    }
    
    async init() {
        if (!window.windowManager) {
            console.error('WindowManager not available');
            return;
        }
        
        this.windowId = window.windowManager.createWindow({
            title: 'My Tabbed App', // TODO: Change app title
            width: 1200,           // TODO: Adjust width for sidebar + content
            height: 700,           // TODO: Adjust height
            hasTabBar: false,      // We'll create our own vertical tab system
            resizable: true,
            maximizable: true,
            minimizable: true
        });
        
        window.windowManager.loadApp(this.windowId, this);
        this.createTab('Welcome'); // TODO: Customize initial tab
        
        console.log(\`MyTabbedApp initialized with window \${this.windowId}\`);
    }
    
    render() {
        const container = document.createElement('div');
        container.className = 'mytabbedapp-container';
        container.style.cssText = \`
            width: 100%;
            height: 100%;
            display: flex;
            background: var(--nebula-bg-primary);
        \`;
        
        // TODO: Build your tabbed interface here
        container.innerHTML = \`
            <div class="app-sidebar">
                <div class="tab-grid" id="tabGrid-\${this.windowId}">
                    <!-- Vertical tab squares will be added here -->
                </div>
                <div class="sidebar-controls">
                    <button id="newTabBtn-\${this.windowId}">+ New Tab</button>
                </div>
            </div>
            <div class="app-main">
                <div class="app-toolbar">
                    <h2 id="tabTitle-\${this.windowId}">My Tabbed App</h2>
                </div>
                <div class="tab-content-area" id="tabContentArea-\${this.windowId}">
                    <!-- Active tab content will be shown here -->
                </div>
            </div>
        \`;
        
        setTimeout(() => {
            this.setupEventListeners();
        }, 0);
        
        return container;
    }
    
    createTab(title) {
        const tabId = \`tab-\${this.nextTabId++}\`;
        const tabData = {
            id: tabId,
            title: title,
            isModified: false
        };
        
        this.tabs.set(tabId, tabData);
        this.createTabElement(tabData);
        this.createTabContent(tabData);
        this.switchToTab(tabId);
        
        console.log(\`Created tab: \${title}\`);
    }
    
    createTabElement(tabData) {
        // TODO: Implement your tab creation logic
        console.log('Creating tab element for:', tabData.title);
    }
    
    createTabContent(tabData) {
        // TODO: Implement your tab content creation
        console.log('Creating tab content for:', tabData.title);
    }
    
    switchToTab(tabId) {
        // TODO: Implement tab switching logic
        this.activeTabId = tabId;
        console.log('Switched to tab:', tabId);
    }
    
    setupEventListeners() {
        // TODO: Add your event listeners
        document.getElementById(\`newTabBtn-\${this.windowId}\`)?.addEventListener('click', () => {
            this.createTab(\`Tab \${this.nextTabId}\`);
        });
    }
    
    getTitle() {
        return 'My Tabbed App';
    }
    
    getIcon() {
        return '📑';
    }
    
    cleanup() {
        console.log('MyTabbedApp cleanup completed');
    }
}

// Export for use in NebulaDesktop
window.NebulaMyTabbedApp = NebulaMyTabbedApp;

// Auto-launch for testing (remove in production)
// new NebulaMyTabbedApp();`;
    }
    
    // Continue with existing methods...
    async initializeMonaco() {
        try {
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
            this.createFallbackEditor();
        }
    }
    
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
    
    getWelcomeCode() {
        return `// 🚀 Welcome to Enhanced Code Assistant!
// Now with JS execution + template loading

// Try these features:
// 1. 📋 Load templates from the dropdown above
// 2. ▶️ Click "Run" or press F5 to execute JavaScript
// 3. 🤖 Use AI buttons to get code help
// 4. 💾 Save your projects for later

// Example: Run this code with the Run button!
function greetUser(name = "Developer") {
    const message = \`Hello, \${name}! 🎉\`;
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
greetUser("Nebula Coder");`;
    }
    
    // Existing methods for webview, AI actions, etc...
    createWebview() {
        const container = document.getElementById(`webviewContainer-${this.windowId}`);
        if (!container) return;
        
        this.showLoading();
        
        if (this.webview) {
            this.webview.remove();
            this.webview = null;
        }
        
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
        
        console.log(`Created webview for ${currentService.name}`);
    }
    
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
    }
    
    showLoading() {
        const loading = document.getElementById(`chatLoading-${this.windowId}`);
        if (loading) loading.style.display = 'block';
    }
    
    hideLoading() {
        const loading = document.getElementById(`chatLoading-${this.windowId}`);
        if (loading) loading.style.display = 'none';
    }
    
    switchLanguage(language) {
        this.currentLanguage = language;
        
        if (this.monacoEditor && monaco) {
            monaco.editor.setModelLanguage(this.monacoEditor.getModel(), language);
        }
        
        console.log(`Switched to ${language}`);
    }
    
    switchAIService(serviceKey) {
        if (!this.aiServices[serviceKey]) {
            console.error('Unknown AI service:', serviceKey);
            return;
        }
        
        this.currentAIService = serviceKey;
        this.createWebview();
        
        console.log(`Switched to ${this.aiServices[serviceKey].name}`);
    }
    
    // File operations
    newFile() {
        if (this.monacoEditor) {
            const currentCode = this.monacoEditor.getValue();
            if (currentCode.trim() && !confirm('Create new file? Current code will be lost.')) {
                return;
            }
            this.monacoEditor.setValue('');
        }
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
            `${index + 1}. ${project.name} (${project.language})`
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
        
        const languageSelect = document.getElementById(`languageSelect-${this.windowId}`);
        if (languageSelect) languageSelect.value = project.language;
        
        console.log(`Loaded project: ${project.name}`);
    }
    
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
    
    // AI-powered code actions
    explainCode() {
        if (!this.monacoEditor) return;
        
        const code = this.monacoEditor.getValue();
        if (!code.trim()) {
            alert('Please enter some code first!');
            return;
        }
        
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
    
    async pasteFromAI() {
        if (!this.monacoEditor) return;
        
        try {
            const clipboardText = await navigator.clipboard.readText();
            
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
    
    // Required methods for WindowManager integration
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

// Export for use in NebulaDesktop
window.NebulaCodeAssistant = NebulaCodeAssistant;