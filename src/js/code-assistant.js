// Enhanced Code Assistant with JS Execution + Template Loading
// Preserves ALL original functionality + adds new features
class NebulaCodeAssistant {
    constructor() {
        this.windowId = null;
        this.monacoEditor = null;
        this.currentLanguage = 'javascript';
        this.currentAIService = 'lmstudio'; // Default to LM Studio
        this.webview = null;
        this.savedProjects = [];
        this.outputVisible = false; // NEW: for output panel
        this.currentFilePath = null; // NEW: track current open file
        this.hasUnsavedChanges = false; // NEW: track unsaved changes

        // LM Studio Configuration
        this.lmStudioConfig = {
            baseUrl: 'http://192.168.1.254:1234',
            model: 'local-model', // Will be detected automatically
            temperature: 0.7,
            maxTokens: 2048
        };

        // NEW: Multi-file tab system
        this.openFiles = new Map(); // fileId -> fileData
        this.activeFileId = null;
        this.nextFileId = 1;
        this.symbolUpdateTimeout = null; // For debounced symbol updates


        // NEW: Chat width management
        this.assistantVisible = true;
        // this.chatWidth = '400px'; // Default width
        this.chatWidthPercent = 33; // Default 33%

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
            },
            'PWA-app': {
                name: 'Progressive Web App',
                description: 'Progressive Web App template',
                path: '../src/Templates/NebulaApp-PWA.js'
            }
        };

        // AI Services (enhanced with LM Studio)
        this.aiServices = {
            lmstudio: { name: 'LM Studio (Local)', url: 'http://192.168.1.254:1234', icon: '🏠', type: 'api' },
            claude: { name: 'Claude', url: 'https://claude.ai', icon: '🧠', type: 'webview' },
            chatgpt: { name: 'ChatGPT', url: 'https://chat.openai.com', icon: '💬', type: 'webview' },
            manus: { name: 'Manus', url: 'https://manus.im', icon: '🤖', type: 'webview' },
            perplexity: { name: 'Perplexity', url: 'https://perplexity.ai', icon: '🔍', type: 'webview' },
            copilot: { name: 'Copilot', url: 'https://copilot.microsoft.com', icon: '🚀', type: 'webview' },
            gemini: { name: 'Gemini', url: 'https://gemini.google.com', icon: '💎', type: 'webview' },
            bolt: { name: 'Bolt', url: 'https://bolt.new', icon: '⚡', type: 'webview' }
        };

        // Load saved preferences
        this.loadLayoutPreferences();

        this.init();
    }

    // 2. ADD NEW METHOD - Load layout preferences
    loadLayoutPreferences() {
        try {
            const saved = localStorage.getItem('codeAssistant-layout');
            if (saved) {
                const prefs = JSON.parse(saved);
                this.assistantVisible = prefs.assistantVisible !== false;
                this.chatWidthPercent = prefs.chatWidthPercent || 33;
            }
        } catch (error) {
            console.log('Using default layout preferences');
        }
    }

    saveLayoutPreferences() {
        try {
            const prefs = {
                assistantVisible: this.assistantVisible,
                chatWidthPercent: this.chatWidthPercent
            };
            localStorage.setItem('codeAssistant-layout', JSON.stringify(prefs));
        } catch (error) {
            console.log('Could not save layout preferences');
        }
    }

    // FIX 1: Toggle Assistant - Replace your toggleAssistant() method with this:
    toggleAssistant() {
    this.assistantVisible = !this.assistantVisible;
    
    const container = document.querySelector(`[data-window-id="${this.windowId}"] .code-assistant-container`);
    const chatSide = container?.querySelector('.code-chat-side');
    const editorSide = container?.querySelector('.code-editor-side'); // ADD THIS
    const toggleBtn = document.getElementById(`toggleAssistantBtn-${this.windowId}`);
    const widthControls = document.getElementById(`chatWidthControls-${this.windowId}`);
    
    if (chatSide) {
        if (this.assistantVisible) {
            // SHOW: Restore display and width
            chatSide.style.display = 'flex';
            chatSide.style.width = `${this.chatWidthPercent}%`;
            
            // 🆕 ADD: Restore editor width
            if (editorSide) {
                editorSide.style.width = `${100 - this.chatWidthPercent}%`;
            }
        } else {
            // HIDE: Set display to none
            chatSide.style.display = 'none';
            
            // 🆕 ADD: Make editor full width
            if (editorSide) {
                editorSide.style.width = '100%';
            }
        }
    }

        if (toggleBtn) {
            if (this.assistantVisible) {
                toggleBtn.classList.add('active');
                toggleBtn.querySelector('span:last-child').textContent = 'Hide AI';
            } else {
                toggleBtn.classList.remove('active');
                toggleBtn.querySelector('span:last-child').textContent = 'Show AI';
            }
        }

        if (widthControls) {
            widthControls.style.display = this.assistantVisible ? 'flex' : 'none';
        }

        this.saveLayoutPreferences();
        setTimeout(() => this.handleWindowResize(), 100);
    }

    // FIX 2: Chat Width - Replace your setChatWidth() method with this:
    setChatWidth(percent) {
        this.chatWidthPercent = percent;

        const container = document.querySelector(`[data-window-id="${this.windowId}"] .code-assistant-container`);
        const chatSide = container?.querySelector('.code-chat-side');
        const editorSide = container?.querySelector('.code-editor-side');

        if (chatSide && editorSide) {
            // FIX: Set both sides explicitly to prevent expanding off-screen
            const chatWidth = `${percent}%`;
            const editorWidth = `${100 - percent}%`;

            chatSide.style.width = chatWidth;
            chatSide.style.flexShrink = '0';
            chatSide.style.flexGrow = '0';

            editorSide.style.width = editorWidth;
            editorSide.style.flexShrink = '0';
            editorSide.style.flexGrow = '0';

            // Force container to use explicit flex basis
            container.style.display = 'flex';
            container.style.flexDirection = 'row';
        }

        // Update button states
        document.querySelectorAll(`[id^="chatWidth"][id$="-${this.windowId}"]`).forEach(btn => {
            btn.classList.remove('active');
        });

        const activeBtn = document.getElementById(`chatWidth${percent}-${this.windowId}`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        this.saveLayoutPreferences();
        setTimeout(() => this.handleWindowResize(), 100);
    }

    handleWindowResize() {
        const webview = document.querySelector(`[data-window-id="${this.windowId}"]  .code-webview`);
        if (webview) {
            webview.style.width = '100%';
            webview.style.height = '100%';

            if (webview.getWebContentsId) {
                try {
                    webview.executeJavaScript('window.dispatchEvent(new Event("resize"))');
                } catch (error) {
                    // Ignore errors if webview not ready
                }
            }
        }

        if (this.monacoEditor) {
            setTimeout(() => {
                this.monacoEditor.layout();
            }, 100);
        }
    }

    applySavedLayout() {
        // Apply assistant visibility first
        const chatSide = document.querySelector(`[data-window-id="${this.windowId}"] .code-chat-side`);

        if (!this.assistantVisible && chatSide) {
            chatSide.style.display = 'none';
            const toggleBtn = document.getElementById(`toggleAssistantBtn-${this.windowId}`);
            if (toggleBtn) {
                toggleBtn.classList.remove('active');
                toggleBtn.querySelector('span:last-child').textContent = 'Show AI';
            }
            const widthControls = document.getElementById(`chatWidthControls-${this.windowId}`);
            if (widthControls) {
                widthControls.style.display = 'none';
            }
        } else {
            // Apply chat width for visible assistant
            this.setChatWidth(this.chatWidthPercent);
        }
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
        flex-direction: row;
        background: var(--nebula-bg-primary);
        font-family: var(--nebula-font-family);
        overflow: hidden;
        align-items: stretch;
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
            this.createNewTab(); // Initialize with first tab
            this.updateWindowTitle(); // Set initial window title and status
        }, 0);

        // Apply saved layout after creation
        setTimeout(() => {
            this.applySavedLayout();
        }, 200);

        return container;
    }



    createEditorSide() {
        const editorSide = document.createElement('div');
        editorSide.className = 'code-editor-side';
        editorSide.style.cssText = `
            width: 67%;
    flex-shrink: 0;
    flex-grow: 0;
        display: flex;
        flex-direction: column;
        border-right: 1px solid var(--nebula-border);
        min-width: 0;
        overflow: hidden;
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
                <option value="PWA-app">🌐 Progressive Web App</option>
            </select>
            
            <div class="toolbar-separator" style="width: 1px; height: 20px; background: var(--nebula-border); margin: 0 4px;"></div>
            
            <!-- File Operations - ENHANCED -->
            <button id="newFileBtn-${this.windowId}" class="code-toolbar-btn" title="New File (Ctrl+N)">
                <span class="material-symbols-outlined">note_add</span>
            </button>
            
<button id="openFileBtn-${this.windowId}" class="code-toolbar-btn" title="Open File (Ctrl+O)">
                <span class="material-symbols-outlined">folder_open</span>
            </button>
            
<button id="saveBtn-${this.windowId}" class="code-toolbar-btn" title="Save File (Ctrl+S)">
                <span class="material-symbols-outlined">save</span>
            </button>
            
            <button id="saveAsBtn-${this.windowId}" class="code-toolbar-btn title="Save As (Ctrl+Shift+S)">
                <span class="material-symbols-outlined">save_as</span>
            </button>
            
            <div class="toolbar-separator" style="width: 1px; height: 20px; background: var(--nebula-border); margin: 0 4px;"></div>
            
            <!-- NEW: Monaco Features -->
            <select id="symbolSelect-${this.windowId}" class="code-toolbar-btn title="Go to Symbol" style="
                padding: 6px 12px;
                border: 1px solid var(--nebula-border);
                border-radius: var(--nebula-radius-sm);
                background: var(--nebula-bg-primary);
                color: var(--nebula-text-primary);
                font-size: 13px;
                max-width: 200px;
            ">
                <option value="">📋 Go to Symbol...</option>
            </select>
            
            <div class="toolbar-separator" style="width: 1px; height: 20px; background: var(--nebula-border); margin: 0 4px;"></div>
            
            <!-- ⚡ NEW: JS Execution Controls -->
            <button id="runBtn-${this.windowId}" class="toolbar-btn run-btn" title="Run JavaScript (F5)" style="
    width: 36px;
    height: 36px;
    border: none;
    background: var(--nebula-surface-hover);
    color: var(--nebula-text-secondary);
    border-radius: var(--nebula-radius-sm);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: var(--nebula-transition-fast);
    font-size: 14px;
    gap: 4px;
    padding: 0 8px;
    min-width: 36px;
    width: auto;
    background: var(--nebula-success);
    color: white;
    font-weight: 600;
            ">
                <span class="material-symbols-outlined">play_arrow</span>
                <span>Run</span>
            </button>
            
            <button id="debugBtn-${this.windowId}" class="code-toolbar-btn title="Debug Mode">
                <span class="material-symbols-outlined">bug_report</span>
            </button>
            
            <button id="toggleOutputBtn-${this.windowId}" class="code-toolbar-btn title="Toggle Output Panel">
                <span class="material-symbols-outlined">terminal</span>
            </button>
            
            <div class="toolbar-separator" style="width: 1px; height: 20px; background: var(--nebula-border); margin: 0 4px;"></div>
            
            <!-- Code Operations (original) -->
            <button id="formatBtn-${this.windowId}" class="code-toolbar-btn title="Format Code">
                <span class="material-symbols-outlined">code</span>
            </button>
            
            <button id="copyAllBtn-${this.windowId}" class="code-toolbar-btn title="Copy All Code">
                <span class="material-symbols-outlined">content_copy</span>
            </button>
            
            <button id="insertToFileBtn-${this.windowId}" class="code-toolbar-btn title="Insert Code to File">
                <span class="material-symbols-outlined">insert_drive_file</span>
            </button>

                        <div class="toolbar-separator" style="width: 1px; height: 20px; background: var(--nebula-border); margin: 0 4px;"></div>
            
            <!-- 🆕 NEW: Assistant Layout Controls -->
<button id="toggleAssistantBtn-${this.windowId}" class="code-toolbar-btn code-assistant-toggle" title="Toggle AI Assistant">
    <span class="material-symbols-outlined">smart_toy</span>
    <span>${this.assistantVisible ? 'Hide' : 'Show'} AI</span>
</button>

<!-- Chat Width Controls -->
<div id="chatWidthControls-${this.windowId}" style="
    display: ${this.assistantVisible ? 'flex' : 'none'};
    gap: 4px;
    align-items: center;
">
    <span style="font-size: 12px; color: var(--nebula-text-secondary);">Chat:</span>
    <button id="chatWidth25-${this.windowId}" class="code-width-btn ${this.chatWidthPercent === 25 ? 'active' : ''}" title="25% Width">25%</button>
    <button id="chatWidth33-${this.windowId}" class="code-width-btn ${this.chatWidthPercent === 33 ? 'active' : ''}" title="33% Width">33%</button>
    <button id="chatWidth50-${this.windowId}" class="code-width-btn ${this.chatWidthPercent === 50 ? 'active' : ''}" title="50% Width">50%</button>
</div>
        `;

        // NEW: File Tab Bar
        const tabBar = document.createElement('div');
        tabBar.id = `fileTabBar-${this.windowId}`;
        tabBar.className = 'file-tab-bar';
        tabBar.style.cssText = `
            background: var(--nebula-surface-secondary);
            border-bottom: 1px solid var(--nebula-border);
            display: flex;
            align-items: center;
            min-height: 36px;
            overflow-x: auto;
            overflow-y: hidden;
            flex-shrink: 0;
        `;

        tabBar.innerHTML = `
            <div class="tab-list" id="tabList-${this.windowId}" style="
                display: flex;
                flex: 1;
                min-width: 0;
            "></div>
            <button id="newTabBtn-${this.windowId}" class="new-tab-btn" title="New Tab" style="
                background: none;
                border: none;
                color: var(--nebula-text-secondary);
                padding: 8px 12px;
                cursor: pointer;
                display: flex;
                align-items: center;
                border-left: 1px solid var(--nebula-border);
                flex-shrink: 0;
            ">
                <span class="material-symbols-outlined" style="font-size: 18px;">add</span>
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

        // NEW: Status bar for file info
        const statusBar = document.createElement('div');
        statusBar.className = 'code-status-bar';
        statusBar.style.cssText = `
            height: 24px;
            background: var(--nebula-surface-secondary);
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
            <span id="fileStatus-${this.windowId}">Ready</span>
            <span id="fileInfo-${this.windowId}">No file open</span>
        `;

        editorContainer.appendChild(statusBar);

        editorSide.appendChild(toolbar);
        editorSide.appendChild(tabBar); // NEW: Add tab bar
        editorSide.appendChild(editorContainer);

        return editorSide;
    }

    createChatSide() {
        const chatSide = document.createElement('div');
        chatSide.className = 'code-chat-side';
        chatSide.style.cssText = `
            width: 33%;
    flex-shrink: 0;
    flex-grow: 0;
        display: flex;
        flex-direction: column;
        background: var(--nebula-surface);
        flex-shrink: 0;
        flex-grow: 0;
        min-width: 250px;
        max-width: 60%;
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
        this.showTemplateCustomizationModal(e.target.value);
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

        // File operations - ENHANCED with real filesystem
        document.getElementById(`newFileBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.newFile();
        });

        document.getElementById(`openFileBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.openFile();
        });

        document.getElementById(`saveBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.saveFile();
        });

        document.getElementById(`saveAsBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.saveAsFile();
        });

        // NEW: Symbol navigation
        document.getElementById(`symbolSelect-${this.windowId}`)?.addEventListener('change', (e) => {
            if (e.target.value) {
                this.goToSymbol(e.target.value);
                e.target.value = ''; // Reset selector
            }
        });

        // NEW: Tab management
        document.getElementById(`newTabBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.createNewTab();
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

        // 🆕 NEW: Assistant toggle button
        document.getElementById(`toggleAssistantBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.toggleAssistant();
        });

        // 🆕 NEW: Chat width buttons
        document.getElementById(`chatWidth25-${this.windowId}`)?.addEventListener('click', () => {
            this.setChatWidth(25);
        });

        document.getElementById(`chatWidth33-${this.windowId}`)?.addEventListener('click', () => {
            this.setChatWidth(33);
        });

        document.getElementById(`chatWidth50-${this.windowId}`)?.addEventListener('click', () => {
            this.setChatWidth(50);
        });

        // 🆕 FIX: Window resize handler
        window.addEventListener('resize', () => {
            this.handleWindowResize();
        });


        document.addEventListener('keydown', (e) => {
            if (!this.isWindowActive()) return;

            // 🔥 FIX: Allow Electron dev tools shortcuts to pass through
            if (e.ctrlKey && e.shiftKey && e.key === 'I') {
                // Don't prevent default - let Electron handle Ctrl+Shift+I
                return;
            }

            if (e.key === 'F12') {
                // Don't prevent default - let Electron handle F12
                return;
            }

            // 🔥 FIX: Also allow Ctrl+Shift+J (Chrome dev tools alternative)
            if (e.ctrlKey && e.shiftKey && e.key === 'J') {
                return;
            }

            // File operations shortcuts
            if (e.ctrlKey && e.key === 's' && !e.shiftKey) {
                e.preventDefault();
                this.saveFile();
            }

            if (e.ctrlKey && e.shiftKey && e.key === 'S') {
                e.preventDefault();
                this.saveAsFile();
            }

            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                this.newFile();
            }

            if (e.ctrlKey && e.key === 'o') {
                e.preventDefault();
                this.openFile();
            }

            // F5 for running JavaScript (but not Ctrl+F5 for refresh)
            if (e.key === 'F5' && !e.ctrlKey) {
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

            // Execute code in safe context - handle both expressions and full scripts
            let result;
            try {
                // First try as a full script (for function definitions, multiple statements)
                result = Function('"use strict"; ' + code)();
            } catch (firstError) {
                try {
                    // If that fails, try as an expression (for simple returns)
                    result = Function('"use strict"; return (' + code + ')')();
                } catch (secondError) {
                    // If both fail, throw the original error
                    throw firstError;
                }
            }

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

    // ⚡ NEW: Multi-File Tab Management System

    createNewTab(filePath = null, content = null) {
        const fileId = `file-${this.nextFileId++}`;
        const fileName = filePath ? filePath.split('/').pop() : 'Untitled';
        const language = this.detectLanguageFromPath(filePath || fileName);

        const fileData = {
            id: fileId,
            path: filePath,
            name: fileName,
            content: content || this.getWelcomeCode(),
            language: language,
            hasUnsavedChanges: false,
            monacoModel: null
        };

        this.openFiles.set(fileId, fileData);
        this.createTabElement(fileData);
        this.switchToTab(fileId);

        console.log(`Created new tab: ${fileName}`);
        return fileId;
    }

    createTabElement(fileData) {
        const tabList = document.getElementById(`tabList-${this.windowId}`);
        if (!tabList) return;

        const fileIcon = this.getFileTypeIcon(fileData.name, fileData.language);
        const displayName = fileData.name.length > 20 ?
            fileData.name.substring(0, 17) + '...' : fileData.name;

        const tab = document.createElement('div');
        tab.className = 'file-tab';
        tab.dataset.fileId = fileData.id;
        tab.dataset.language = fileData.language; // NEW: For CSS styling
        tab.style.cssText = `
            display: flex;
            align-items: center;
            padding: 6px 12px;
            border-right: 1px solid var(--nebula-border);
            background: var(--nebula-surface);
            color: var(--nebula-text-primary);
            cursor: pointer;
            font-size: 13px;
            min-width: 0;
            flex-shrink: 0;
            transition: var(--nebula-transition-fast);
            gap: 6px;
            max-width: 200px;
        `;

        tab.innerHTML = `
            <span class="file-icon" style="font-size: 14px; flex-shrink: 0;">${fileIcon}</span>
            <span class="file-name" style="flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${displayName}</span>
            <span class="unsaved-indicator" style="
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: var(--nebula-warning);
                flex-shrink: 0;
                display: none;
            "></span>
            <button class="tab-close-btn" style="
                background: none;
                border: none;
                color: var(--nebula-text-secondary);
                padding: 2px;
                cursor: pointer;
                display: flex;
                align-items: center;
                border-radius: 2px;
                flex-shrink: 0;
            ">
                <span class="material-symbols-outlined" style="font-size: 14px;">close</span>
            </button>
        `;

        // Add event listeners
        tab.addEventListener('click', (e) => {
            if (e.target.closest('.tab-close-btn')) return;
            this.switchToTab(fileData.id);
        });

        tab.querySelector('.tab-close-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeTab(fileData.id);
        });

        // Add tooltip with full path
        if (fileData.path) {
            tab.title = fileData.path;
        }

        tabList.appendChild(tab);
        fileData.tabElement = tab;
    }

    switchToTab(fileId) {
        const fileData = this.openFiles.get(fileId);
        if (!fileData) return;

        // Update visual state of tabs
        document.querySelectorAll(`#tabList-${this.windowId} .file-tab`).forEach(tab => {
            tab.style.background = 'var(--nebula-surface)';
            tab.style.borderBottom = 'none';
        });

        if (fileData.tabElement) {
            fileData.tabElement.style.background = 'var(--nebula-bg-primary)';
            fileData.tabElement.style.borderBottom = '2px solid var(--nebula-primary)';
        }

        // Switch Monaco model
        if (this.monacoEditor && monaco) {
            if (!fileData.monacoModel) {
                fileData.monacoModel = monaco.editor.createModel(
                    fileData.content,
                    fileData.language
                );
            }
            this.monacoEditor.setModel(fileData.monacoModel);
        } else if (this.monacoEditor) {
            // Fallback editor
            this.monacoEditor.setValue(fileData.content);
        }

        // Update current file tracking
        this.activeFileId = fileId;
        this.currentFilePath = fileData.path;
        this.hasUnsavedChanges = fileData.hasUnsavedChanges;

        // Update language selector
        const languageSelect = document.getElementById(`languageSelect-${this.windowId}`);
        if (languageSelect) languageSelect.value = fileData.language;

        this.updateWindowTitle();
        console.log(`Switched to tab: ${fileData.name}`);
    }

    closeTab(fileId) {
        const fileData = this.openFiles.get(fileId);
        if (!fileData) return;

        // Check for unsaved changes
        if (fileData.hasUnsavedChanges) {
            if (!confirm(`"${fileData.name}" has unsaved changes. Close anyway?`)) {
                return;
            }
        }

        // Remove tab element
        if (fileData.tabElement) {
            fileData.tabElement.remove();
        }

        // Dispose Monaco model
        if (fileData.monacoModel) {
            fileData.monacoModel.dispose();
        }

        // Remove from open files
        this.openFiles.delete(fileId);

        // If this was the active tab, switch to another
        if (this.activeFileId === fileId) {
            const remainingFiles = Array.from(this.openFiles.keys());
            if (remainingFiles.length > 0) {
                this.switchToTab(remainingFiles[remainingFiles.length - 1]);
            } else {
                // No files left, create a new one
                this.createNewTab();
            }
        }

        console.log(`Closed tab: ${fileData.name}`);
    }

    detectLanguageFromPath(filePath) {
        if (!filePath) return 'javascript';

        const extension = filePath.split('.').pop().toLowerCase();
        const languageMap = {
            'js': 'javascript',
            'ts': 'typescript',
            'py': 'python',
            'html': 'html',
            'htm': 'html',
            'css': 'css',
            'json': 'json',
            'md': 'markdown',
            'txt': 'plaintext'
        };

        return languageMap[extension] || 'javascript';
    }

    getFileTypeIcon(fileName, language) {
        if (!fileName) return '📄';

        const extension = fileName.split('.').pop()?.toLowerCase();

        // Better web glyph icons for different file types
        const iconMap = {
            // JavaScript/TypeScript
            'js': '◉', // JavaScript - filled circle (yellow-ish when styled)
            'ts': '◈', // TypeScript - diamond
            'jsx': '⬟', // React JSX
            'tsx': '⬢', // React TSX

            // Web Technologies  
            'html': '⬢', // HTML - hexagon
            'htm': '⬢',
            'css': '◼', // CSS - filled square
            'scss': '◼',
            'sass': '◼',
            'less': '◼',

            // Python
            'py': '◉', // Python - filled circle 
            'pyc': '○', // Python compiled

            // Data/Config
            'json': '⧨', // JSON - data symbol
            'xml': '⧫', // XML - diamond
            'yml': '⚙', // YAML - gear
            'yaml': '⚙',
            'toml': '⚙',
            'ini': '⚙',
            'cfg': '⚙',
            'conf': '⚙',

            // Documentation
            'md': '◈', // Markdown - diamond outline
            'txt': '◇', // Text - empty diamond
            'rtf': '◇',
            'doc': '◇',
            'docx': '◇',

            // Images
            'png': '⬛', // Images - filled square
            'jpg': '⬛',
            'jpeg': '⬛',
            'gif': '⬛',
            'svg': '◆', // SVG - filled diamond
            'ico': '⬛',
            'webp': '⬛',

            // Archives
            'zip': '⬢', // Archives - hexagon
            'tar': '⬢',
            'gz': '⬢',
            'rar': '⬢',
            '7z': '⬢',

            // Executables
            'exe': '▲', // Executables - triangle
            'msi': '▲',
            'deb': '▲',
            'rpm': '▲',
            'app': '▲'
        };

        return iconMap[extension] || '◯'; // Default: empty circle
    }

    markTabAsModified(fileId, isModified) {
        const fileData = this.openFiles.get(fileId);
        if (!fileData) return;

        fileData.hasUnsavedChanges = isModified;

        if (fileData.tabElement) {
            const indicator = fileData.tabElement.querySelector('.unsaved-indicator');
            if (indicator) {
                indicator.style.display = isModified ? 'block' : 'none';
            }
        }

        // If this is the active tab, update window title
        if (fileId === this.activeFileId) {
            this.hasUnsavedChanges = isModified;
            this.updateWindowTitle();
        }
    }

    clearOutput() {
        const outputContent = document.getElementById(`outputContent-${this.windowId}`);
        if (outputContent) {
            outputContent.innerHTML = 'Output cleared... 🧹\n';
        }
    }

    // Update existing methods to work with tabs
    getCurrentFileData() {
        return this.openFiles.get(this.activeFileId);
    }

    // ⚡ NEW: Symbol Navigation (VS Code-like feature)
    updateSymbolDropdown() {
        const symbolSelect = document.getElementById(`symbolSelect-${this.windowId}`);
        if (!symbolSelect || !this.monacoEditor) return;

        const fileData = this.getCurrentFileData();
        if (!fileData) {
            symbolSelect.innerHTML = '<option value="">📋 Go to Symbol...</option>';
            return;
        }

        // Parse symbols based on language
        const symbols = this.parseSymbols(fileData.content, fileData.language);

        symbolSelect.innerHTML = '<option value="">📋 Go to Symbol...</option>' +
            symbols.map(symbol =>
                `<option value="${symbol.line}">${symbol.icon} ${symbol.name}</option>`
            ).join('');
    }

    parseSymbols(content, language) {
        const symbols = [];
        const lines = content.split('\n');

        if (language === 'javascript' || language === 'typescript') {
            lines.forEach((line, index) => {
                const trimmed = line.trim();

                // Classes
                if (trimmed.match(/^class\s+(\w+)/)) {
                    const match = trimmed.match(/^class\s+(\w+)/);
                    symbols.push({
                        name: match[1],
                        line: index + 1,
                        icon: '🏛️',
                        type: 'class'
                    });
                }

                // Functions (various patterns)
                const funcPatterns = [
                    /^function\s+(\w+)/,           // function name()
                    /^async function\s+(\w+)/,     // async function name()
                    /(\w+)\s*:\s*function/,        // name: function
                    /(\w+)\s*:\s*async function/,  // name: async function
                    /(\w+)\(.*\)\s*{/,             // name() {
                    /(\w+)\s*=\s*\(.*\)\s*=>/,     // name = () =>
                    /(\w+)\s*=\s*async\s*\(/,      // name = async (
                    /^\s*(\w+)\(.*\)\s*{/          // method() {
                ];

                funcPatterns.forEach(pattern => {
                    const match = trimmed.match(pattern);
                    if (match && !['if', 'for', 'while', 'switch', 'catch'].includes(match[1])) {
                        symbols.push({
                            name: match[1],
                            line: index + 1,
                            icon: '⚡',
                            type: 'function'
                        });
                    }
                });

                // Variables and constants
                if (trimmed.match(/^(const|let|var)\s+(\w+)/)) {
                    const match = trimmed.match(/^(const|let|var)\s+(\w+)/);
                    symbols.push({
                        name: match[2],
                        line: index + 1,
                        icon: '📦',
                        type: 'variable'
                    });
                }
            });
        } else if (language === 'python') {
            lines.forEach((line, index) => {
                const trimmed = line.trim();

                // Classes
                if (trimmed.match(/^class\s+(\w+)/)) {
                    const match = trimmed.match(/^class\s+(\w+)/);
                    symbols.push({
                        name: match[1],
                        line: index + 1,
                        icon: '🏛️',
                        type: 'class'
                    });
                }

                // Functions/methods
                if (trimmed.match(/^def\s+(\w+)/)) {
                    const match = trimmed.match(/^def\s+(\w+)/);
                    symbols.push({
                        name: match[1],
                        line: index + 1,
                        icon: '⚡',
                        type: 'function'
                    });
                }
            });
        } else if (language === 'html') {
            lines.forEach((line, index) => {
                const trimmed = line.trim();

                // HTML IDs and classes
                const idMatch = trimmed.match(/id=["']([^"']+)["']/);
                if (idMatch) {
                    symbols.push({
                        name: `#${idMatch[1]}`,
                        line: index + 1,
                        icon: '🎯',
                        type: 'id'
                    });
                }

                const classMatch = trimmed.match(/class=["']([^"']+)["']/);
                if (classMatch) {
                    symbols.push({
                        name: `.${classMatch[1].split(' ')[0]}`,
                        line: index + 1,
                        icon: '🎨',
                        type: 'class'
                    });
                }
            });
        }

        // Sort symbols by line number
        return symbols.sort((a, b) => a.line - b.line);
    }

    goToSymbol(lineNumber) {
        if (!this.monacoEditor || !monaco) return;

        const line = parseInt(lineNumber);
        this.monacoEditor.revealLineInCenter(line);
        this.monacoEditor.setPosition({ lineNumber: line, column: 1 });
        this.monacoEditor.focus();

        this.writeOutput(`Jumped to line ${line}`, 'info');
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

            // NEW: Track changes for unsaved indicator
            this.monacoEditor.onDidChangeModelContent(() => {
                if (this.activeFileId) {
                    this.markTabAsModified(this.activeFileId, true);

                    // Update content in file data
                    const fileData = this.getCurrentFileData();
                    if (fileData) {
                        fileData.content = this.monacoEditor.getValue();

                        // Update symbols when content changes (debounced)
                        clearTimeout(this.symbolUpdateTimeout);
                        this.symbolUpdateTimeout = setTimeout(() => {
                            this.updateSymbolDropdown();
                        }, 1000);
                    }
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
                if (editor) {
                    editor.value = value;
                    this.hasUnsavedChanges = false;
                    this.updateWindowTitle();
                }
            },
            getModel: () => ({ getLanguageId: () => this.currentLanguage }),
            onDidChangeModelContent: (callback) => {
                // Set up change tracking for fallback editor
                const editor = document.getElementById(`fallbackEditor-${this.windowId}`);
                if (editor) {
                    editor.addEventListener('input', callback);
                }
            }
        };

        // Set up change tracking for fallback editor
        this.monacoEditor.onDidChangeModelContent(() => {
            this.hasUnsavedChanges = true;
            this.updateWindowTitle();
        });
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
        // Check if current service is API-based (like LM Studio)
        if (this.isAPIService()) {
            this.createAPIInterface();
            return;
        }

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
     * Create API interface for LM Studio with Chat
     */
    createAPIInterface() {
        const container = document.getElementById(`webviewContainer-${this.windowId}`);
        if (!container) return;

        container.innerHTML = `
            <div style="
                height: 100%;
                display: flex;
                flex-direction: column;
                background: var(--nebula-bg-primary);
                font-family: var(--nebula-font-family);
                overflow: hidden;
            ">
                <!-- Header -->
                <div style="
                    padding: 16px;
                    border-bottom: 1px solid var(--nebula-border);
                    background: var(--nebula-surface);
                    text-align: center;
                    position: relative;
                    flex-shrink: 0;
                ">
                    <button id="lmConfigBtn-${this.windowId}" style="
                        position: absolute;
                        top: 12px;
                        right: 12px;
                        background: var(--nebula-surface-hover);
                        border: 1px solid var(--nebula-border);
                        color: var(--nebula-text-secondary);
                        padding: 6px;
                        border-radius: var(--nebula-radius-sm);
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        width: 32px;
                        height: 32px;
                    " title="LM Studio Settings">
                        ⚙️
                    </button>
                    <div style="font-size: 24px; margin-bottom: 8px;">🏠</div>
                    <div style="font-weight: 600; color: var(--nebula-text-primary);">LM Studio Local AI</div>
                    <div style="font-size: 12px; color: var(--nebula-text-secondary); margin-top: 4px;">
                        Status: <span id="lmStatus-${this.windowId}" style="color: #ef4444;">Checking connection...</span>
                    </div>
                </div>
                
                <!-- Chat Area -->
                <div id="chatArea-${this.windowId}" style="
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    min-height: 0;
                    height: 100%;
                ">
                    <!-- Messages Container -->
                    <div id="messagesContainer-${this.windowId}" style="
                        flex: 1;
                        overflow-y: auto;
                        overflow-x: hidden;
                        padding: 16px;
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                        min-height: 0;
                        scrollbar-width: thin;
                        scrollbar-color: var(--nebula-border) transparent;
                    ">
                        <!-- Welcome Message -->
                        <div style="
                            background: var(--nebula-surface);
                            border: 1px solid var(--nebula-border);
                            border-radius: var(--nebula-radius-md);
                            padding: 16px;
                            text-align: center;
                        ">
                            <div style="font-size: 32px; margin-bottom: 12px;">🤖</div>
                            <div style="font-weight: 600; color: var(--nebula-text-primary); margin-bottom: 8px;">Welcome to LM Studio Chat!</div>
                            <div style="color: var(--nebula-text-secondary); font-size: 14px;">
                                Ask me anything about coding, get help with your projects, or just chat!<br>
                                I can also help with the code in your editor using the action buttons above.
                            </div>
                        </div>
                    </div>
                    
                    <!-- Input Area -->
                    <div style="
                        border-top: 1px solid var(--nebula-border);
                        background: var(--nebula-surface);
                        padding: 16px;
                        flex-shrink: 0;
                    ">
                        <div style="display: flex; gap: 8px; align-items: flex-end;">
                            <textarea id="chatInput-${this.windowId}" 
                                placeholder="Type your message here... (Shift+Enter for new line, Enter to send)"
                                style="
                                    flex: 1;
                                    min-height: 40px;
                                    max-height: 120px;
                                    padding: 10px;
                                    border: 1px solid var(--nebula-border);
                                    border-radius: var(--nebula-radius-sm);
                                    background: var(--nebula-bg-primary);
                                    color: var(--nebula-text-primary);
                                    font-family: var(--nebula-font-family);
                                    font-size: 14px;
                                    resize: vertical;
                                    outline: none;
                                "
                            ></textarea>
                            <button id="sendBtn-${this.windowId}" style="
                                background: var(--nebula-primary);
                                border: 1px solid var(--nebula-primary);
                                color: white;
                                padding: 10px 16px;
                                border-radius: var(--nebula-radius-sm);
                                cursor: pointer;
                                font-weight: 600;
                                min-width: 70px;
                                height: 40px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                gap: 6px;
                            " disabled>
                                <span>Send</span>
                                <span style="font-size: 12px;">↵</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Setup event listeners
        this.setupChatEventListeners();
        
        // Fix chat container height
        this.fixChatContainerHeight();
        
        // Setup settings button
        document.getElementById(`lmConfigBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.showLMStudioConfig();
        });

        // Test LM Studio connection
        this.testLMStudioConnection();
        console.log('Created LM Studio API interface with chat');
    }

    /**
     * Fix chat container height to enable proper scrolling
     */
    fixChatContainerHeight() {
        const container = document.getElementById(`webviewContainer-${this.windowId}`);
        const chatArea = document.getElementById(`chatArea-${this.windowId}`);
        const messagesContainer = document.getElementById(`messagesContainer-${this.windowId}`);
        
        if (!container || !chatArea || !messagesContainer) return;
        
        // Force a specific height calculation
        setTimeout(() => {
            const containerHeight = container.offsetHeight;
            const headerHeight = 120; // Approximate header height
            const inputHeight = 100;  // Approximate input area height
            const availableHeight = containerHeight - headerHeight - inputHeight;
            
            messagesContainer.style.height = `${availableHeight}px`;
            messagesContainer.style.maxHeight = `${availableHeight}px`;
            
            console.log(`Set messages container height to ${availableHeight}px`);
        }, 100);
        
        // Add resize handler to recalculate on window resize
        window.addEventListener('resize', () => {
            setTimeout(() => this.fixChatContainerHeight(), 100);
        });
    }

    /**
     * Setup chat event listeners
     */
    setupChatEventListeners() {
        const chatInput = document.getElementById(`chatInput-${this.windowId}`);
        const sendBtn = document.getElementById(`sendBtn-${this.windowId}`);
        
        if (!chatInput || !sendBtn) return;

        // Enable/disable send button based on input
        chatInput.addEventListener('input', () => {
            const hasText = chatInput.value.trim().length > 0;
            sendBtn.disabled = !hasText;
            sendBtn.style.opacity = hasText ? '1' : '0.5';
        });

        // Handle Enter key (send) and Shift+Enter (new line)
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendChatMessage();
            }
        });

        // Send button click
        sendBtn.addEventListener('click', () => {
            this.sendChatMessage();
        });
    }

    /**
     * Send chat message to LM Studio
     */
    async sendChatMessage() {
        const chatInput = document.getElementById(`chatInput-${this.windowId}`);
        const sendBtn = document.getElementById(`sendBtn-${this.windowId}`);
        
        if (!chatInput || !sendBtn) return;
        
        const message = chatInput.value.trim();
        if (!message) return;

        // Clear input and disable send button
        chatInput.value = '';
        sendBtn.disabled = true;
        sendBtn.style.opacity = '0.5';
        
        // Re-focus the input for better UX
        chatInput.focus();

        // Add user message to chat
        this.addChatMessage(message, 'user');
        
        // Show typing indicator
        const typingId = this.addTypingIndicator();
        
        try {
            // Send to LM Studio
            const response = await fetch(`${this.lmStudioConfig.baseUrl}/v1/chat/completions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(30000),
                body: JSON.stringify({
                    model: this.lmStudioConfig.model,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a helpful AI assistant specializing in coding and development. Provide clear, concise, and helpful responses.'
                        },
                        { role: 'user', content: message }
                    ],
                    temperature: this.lmStudioConfig.temperature,
                    max_tokens: this.lmStudioConfig.maxTokens
                })
            });

            if (!response.ok) throw new Error(`API error: ${response.status}`);

            const result = await response.json();
            const aiResponse = result.choices[0]?.message?.content || 'No response received';
            
            // Remove typing indicator and add AI response
            this.removeTypingIndicator(typingId);
            this.addChatMessage(aiResponse, 'assistant');
            
        } catch (error) {
            console.error('❌ LM Studio chat error:', error);
            this.removeTypingIndicator(typingId);
            this.addChatMessage('❌ Sorry, I encountered an error. Please check your LM Studio connection.', 'error');
        }
    }

    /**
     * Add message to chat
     */
    addChatMessage(content, type = 'user') {
        const container = document.getElementById(`messagesContainer-${this.windowId}`);
        if (!container) return;

        const messageDiv = document.createElement('div');
        
        if (type === 'user') {
            messageDiv.style.cssText = `
                align-self: flex-end;
                max-width: 80%;
                background: var(--nebula-primary);
                color: white;
                padding: 12px 16px;
                border-radius: 18px 18px 4px 18px;
                font-size: 14px;
                line-height: 1.4;
                white-space: pre-wrap;
            `;
        } else if (type === 'assistant') {
            messageDiv.style.cssText = `
                align-self: flex-start;
                max-width: 80%;
                background: var(--nebula-surface);
                border: 1px solid var(--nebula-border);
                color: var(--nebula-text-primary);
                padding: 12px 16px;
                border-radius: 18px 18px 18px 4px;
                font-size: 14px;
                line-height: 1.4;
                white-space: pre-wrap;
            `;
        } else if (type === 'error') {
            messageDiv.style.cssText = `
                align-self: center;
                max-width: 80%;
                background: rgba(239, 68, 68, 0.1);
                border: 1px solid rgba(239, 68, 68, 0.3);
                color: #ef4444;
                padding: 12px 16px;
                border-radius: var(--nebula-radius-md);
                font-size: 14px;
                line-height: 1.4;
                text-align: center;
            `;
        }

        messageDiv.textContent = content;
        container.appendChild(messageDiv);
        
        // Smooth scroll to bottom
        setTimeout(() => {
            container.scrollTo({
                top: container.scrollHeight,
                behavior: 'smooth'
            });
        }, 10);
    }

    /**
     * Add typing indicator
     */
    addTypingIndicator() {
        const container = document.getElementById(`messagesContainer-${this.windowId}`);
        if (!container) return null;

        const typingDiv = document.createElement('div');
        const typingId = `typing-${Date.now()}`;
        typingDiv.id = typingId;
        
        typingDiv.style.cssText = `
            align-self: flex-start;
            background: var(--nebula-surface);
            border: 1px solid var(--nebula-border);
            color: var(--nebula-text-secondary);
            padding: 12px 16px;
            border-radius: 18px 18px 18px 4px;
            font-size: 14px;
            font-style: italic;
        `;
        
        typingDiv.innerHTML = `
            <span>🤖 AI is thinking</span>
            <span class="typing-dots">...</span>
        `;
        
        container.appendChild(typingDiv);
        
        // Smooth scroll to bottom
        setTimeout(() => {
            container.scrollTo({
                top: container.scrollHeight,
                behavior: 'smooth'
            });
        }, 10);
        
        return typingId;
    }

    /**
     * Remove typing indicator
     */
    removeTypingIndicator(typingId) {
        if (typingId) {
            const element = document.getElementById(typingId);
            if (element) element.remove();
        }
    }

    /**
     * Test connection to LM Studio
     */
    async testLMStudioConnection() {
        const statusElement = document.getElementById(`lmStatus-${this.windowId}`);
        if (!statusElement) return;

        try {
            const response = await fetch(`${this.lmStudioConfig.baseUrl}/v1/models`, {
                method: 'GET',
                signal: AbortSignal.timeout(3000) // 3 second timeout
            });

            if (response.ok) {
                statusElement.textContent = 'Connected ✅';
                statusElement.style.color = '#4ade80';
                console.log('✅ LM Studio connection successful');
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            statusElement.textContent = 'Disconnected ❌';
            statusElement.style.color = '#ef4444';
            console.log('❌ LM Studio connection failed:', error.message);
        }
    }

    /**
     * Show LM Studio configuration modal
     */
    showLMStudioConfig() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: var(--nebula-surface);
            border: 1px solid var(--nebula-border);
            border-radius: var(--nebula-radius-md);
            padding: 24px;
            min-width: 500px;
            max-width: 600px;
        `;

        dialog.innerHTML = `
            <h3 style="color: var(--nebula-text-primary); margin: 0 0 16px 0;">🏠 LM Studio Configuration</h3>
            
            <div style="margin-bottom: 16px;">
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--nebula-text-secondary); margin-bottom: 4px;">
                    API Base URL
                </label>
                <input type="text" id="lmBaseUrl" value="${this.lmStudioConfig.baseUrl}" style="
                    width: 100%;
                    padding: 8px 12px;
                    border: 1px solid var(--nebula-border);
                    border-radius: var(--nebula-radius-sm);
                    background: var(--nebula-bg-primary);
                    color: var(--nebula-text-primary);
                    font-size: 14px;
                    font-family: monospace;
                ">
                <div style="font-size: 11px; color: var(--nebula-text-secondary); margin-top: 4px;">
                    Example: http://192.168.1.100:1234 or http://localhost:1234
                </div>
            </div>

            <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px;">
                <button id="testConnectionBtn" style="
                    background: var(--nebula-secondary);
                    border: 1px solid var(--nebula-secondary);
                    color: white;
                    padding: 8px 16px;
                    border-radius: var(--nebula-radius-sm);
                    cursor: pointer;
                ">Test Connection</button>
                <button id="saveConfigBtn" style="
                    background: var(--nebula-primary);
                    border: 1px solid var(--nebula-primary);
                    color: white;
                    padding: 8px 16px;
                    border-radius: var(--nebula-radius-sm);
                    cursor: pointer;
                ">Save & Apply</button>
                <button id="cancelConfigBtn" style="
                    background: var(--nebula-surface-hover);
                    border: 1px solid var(--nebula-border);
                    color: var(--nebula-text-primary);
                    padding: 8px 16px;
                    border-radius: var(--nebula-radius-sm);
                    cursor: pointer;
                ">Cancel</button>
            </div>
        `;

        modal.appendChild(dialog);
        document.body.appendChild(modal);

        const cleanup = () => document.body.removeChild(modal);

        // Save button
        dialog.querySelector('#saveConfigBtn').addEventListener('click', () => {
            const baseUrl = dialog.querySelector('#lmBaseUrl').value.trim();
            if (baseUrl) {
                this.lmStudioConfig.baseUrl = baseUrl;
                localStorage.setItem('lmStudioConfig', JSON.stringify(this.lmStudioConfig));
                this.testLMStudioConnection();
                console.log('LM Studio config saved:', baseUrl);
            }
            cleanup();
        });

        // Test button
        dialog.querySelector('#testConnectionBtn').addEventListener('click', async () => {
            const baseUrl = dialog.querySelector('#lmBaseUrl').value.trim();
            const btn = dialog.querySelector('#testConnectionBtn');
            btn.textContent = 'Testing...';
            
            try {
                const response = await fetch(`${baseUrl}/v1/models`, { signal: AbortSignal.timeout(5000) });
                btn.textContent = response.ok ? 'Connected ✅' : 'Failed ❌';
                btn.style.background = response.ok ? '#4ade80' : '#ef4444';
            } catch (error) {
                btn.textContent = 'Failed ❌';
                btn.style.background = '#ef4444';
            }
            
            setTimeout(() => {
                btn.textContent = 'Test Connection';
                btn.style.background = '';
            }, 2000);
        });

        dialog.querySelector('#cancelConfigBtn').addEventListener('click', cleanup);
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
     * File operations - ENHANCED with real filesystem access
     */
    newFile() {
        if (this.hasUnsavedChanges && this.monacoEditor) {
            if (!confirm('Create new file? Unsaved changes will be lost.')) {
                return;
            }
        }

        if (this.monacoEditor) {
            this.monacoEditor.setValue(this.getWelcomeCode());
        }
        this.currentFilePath = null;
        this.hasUnsavedChanges = false;
        this.updateWindowTitle();
        this.clearOutput();
        this.writeOutput('New file created', 'info');
        console.log('New file created');
    }

    // NEW: Open file from filesystem using NATIVE dialog
    async openFile() {
        try {
            // Use native file dialog if available, fallback to custom dialog
            if (window.nebula?.dialog?.openFile) {
                const result = await window.nebula.dialog.openFile({
                    title: 'Open File',
                    defaultPath: await window.nebula.fs.getHomeDir()
                });

                if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
                    return;
                }

                const filePath = result.filePaths[0];
                await this.loadFileContent(filePath);
            } else {
                // Fallback to custom dialog
                const homeDir = await window.nebula.fs.getHomeDir();
                const filePath = await this.showInputDialog('Open File', 'Enter file path to open:', homeDir + '/');
                if (!filePath) return;

                await this.loadFileContent(filePath);
            }

        } catch (error) {
            this.writeOutput(`❌ Failed to open file: ${error.message}`, 'error');
            console.error('File open error:', error);
        }
    }

    // NEW: Load file content (extracted for reuse)
    async loadFileContent(filePath) {
        // Check if file exists
        const exists = await window.nebula.fs.exists(filePath);
        if (!exists) {
            alert('File not found: ' + filePath);
            return;
        }

        // Read file content
        this.writeOutput(`Opening file: ${filePath}...`, 'info');
        const content = await window.nebula.fs.readFile(filePath);

        if (this.monacoEditor) {
            this.monacoEditor.setValue(content);
            this.currentFilePath = filePath;
            this.hasUnsavedChanges = false;
            this.updateWindowTitle();

            // Auto-detect language from file extension
            const extension = filePath.split('.').pop().toLowerCase();
            const languageMap = {
                'js': 'javascript',
                'ts': 'typescript',
                'py': 'python',
                'html': 'html',
                'css': 'css',
                'json': 'json',
                'md': 'markdown'
            };

            if (languageMap[extension]) {
                this.switchLanguage(languageMap[extension]);
                const languageSelect = document.getElementById(`languageSelect-${this.windowId}`);
                if (languageSelect) languageSelect.value = languageMap[extension];
            }

            this.writeOutput(`✅ File opened successfully!`, 'success');
        }
    }

    // ENHANCED: Save using NATIVE dialog
    async saveFile(saveAs = false) {
        if (!this.monacoEditor) return;

        const code = this.monacoEditor.getValue();
        if (!code.trim()) {
            alert('No content to save!');
            return;
        }

        try {
            let filePath = this.currentFilePath;

            // If no current file or Save As requested, use native save dialog
            if (!filePath || saveAs) {
                if (window.nebula?.dialog?.saveFile) {
                    const result = await window.nebula.dialog.saveFile({
                        title: saveAs ? 'Save As' : 'Save File',
                        defaultPath: filePath || (await window.nebula.fs.getHomeDir()) + '/untitled.js'
                    });

                    if (result.canceled || !result.filePath) {
                        return;
                    }

                    filePath = result.filePath;
                } else {
                    // Fallback to custom dialog
                    const homeDir = await window.nebula.fs.getHomeDir();
                    const defaultPath = filePath || homeDir + '/untitled.js';
                    filePath = await this.showInputDialog('Save File', 'Save file as:', defaultPath);
                    if (!filePath) return;
                }
            }

            this.writeOutput(`Saving file: ${filePath}...`, 'info');

            // Write file to filesystem
            await window.nebula.fs.writeFile(filePath, code);

            this.currentFilePath = filePath;
            this.hasUnsavedChanges = false;
            this.updateWindowTitle();
            this.writeOutput(`✅ File saved successfully!`, 'success');

            console.log(`File saved: ${filePath}`);

        } catch (error) {
            this.writeOutput(`❌ Failed to save file: ${error.message}`, 'error');
            console.error('File save error:', error);
        }
    }

    // NEW: Custom input dialog (replaces prompt())
    showInputDialog(title, message, defaultValue = '') {
        return new Promise((resolve) => {
            // Create modal dialog
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            `;

            const dialog = document.createElement('div');
            dialog.style.cssText = `
                background: var(--nebula-surface);
                border: 1px solid var(--nebula-border);
                border-radius: var(--nebula-radius-md);
                padding: 24px;
                min-width: 400px;
                max-width: 600px;
            `;

            dialog.innerHTML = `
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 16px 0;">${title}</h3>
                <p style="color: var(--nebula-text-secondary); margin: 0 0 16px 0;">${message}</p>
                <input type="text" id="inputField" value="${defaultValue}" style="
                    width: 100%;
                    padding: 8px 12px;
                    border: 1px solid var(--nebula-border);
                    border-radius: var(--nebula-radius-sm);
                    background: var(--nebula-bg-primary);
                    color: var(--nebula-text-primary);
                    font-size: 14px;
                    margin-bottom: 16px;
                ">
                <div style="display: flex; gap: 12px; justify-content: flex-end;">
                    <button id="cancelBtn" style="
                        background: var(--nebula-surface-hover);
                        border: 1px solid var(--nebula-border);
                        color: var(--nebula-text-primary);
                        padding: 8px 16px;
                        border-radius: var(--nebula-radius-sm);
                        cursor: pointer;
                    ">Cancel</button>
                    <button id="okBtn" style="
                        background: var(--nebula-primary);
                        border: 1px solid var(--nebula-primary);
                        color: white;
                        padding: 8px 16px;
                        border-radius: var(--nebula-radius-sm);
                        cursor: pointer;
                    ">OK</button>
                </div>
            `;

            modal.appendChild(dialog);
            document.body.appendChild(modal);

            // Focus input and select text
            const input = dialog.querySelector('#inputField');
            input.focus();
            input.select();

            // Handle buttons
            const cleanup = (result) => {
                document.body.removeChild(modal);
                resolve(result);
            };

            dialog.querySelector('#okBtn').addEventListener('click', () => {
                cleanup(input.value.trim() || null);
            });

            dialog.querySelector('#cancelBtn').addEventListener('click', () => {
                cleanup(null);
            });

            // Handle Enter/Escape keys
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    cleanup(input.value.trim() || null);
                } else if (e.key === 'Escape') {
                    cleanup(null);
                }
            });
        });
    }

    // NEW: Save As functionality
    async saveAsFile() {
        await this.saveFile(true);
    }

    // NEW: File browser for opening files
    async browseAndOpenFile() {
        try {
            const homeDir = await window.nebula.fs.getHomeDir();

            // Simple file browser - list directory contents
            const files = await window.nebula.fs.readDir(homeDir);

            // Filter for code files
            const codeFiles = files.filter(file => {
                const extensions = ['.js', '.ts', '.py', '.html', '.css', '.json', '.md', '.txt'];
                return extensions.some(ext => file.toLowerCase().endsWith(ext));
            });

            if (codeFiles.length === 0) {
                alert('No code files found in home directory.');
                return;
            }

            // Show file selection dialog
            const selectedFile = await this.showFilePickerDialog('Select File to Open', codeFiles, homeDir);
            if (!selectedFile) return;

            // Read and open the selected file
            const content = await window.nebula.fs.readFile(selectedFile);

            if (this.monacoEditor) {
                this.monacoEditor.setValue(content);
                this.currentFilePath = selectedFile;
                this.hasUnsavedChanges = false;
                this.updateWindowTitle();
                this.writeOutput(`✅ File opened: ${selectedFile}`, 'success');
            }

        } catch (error) {
            this.writeOutput(`❌ Failed to browse files: ${error.message}`, 'error');
            console.error('File browse error:', error);
        }
    }

    // NEW: File picker dialog (replaces prompt() for file selection)
    showFilePickerDialog(title, files, basePath) {
        return new Promise((resolve) => {
            // Create modal dialog
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            `;

            const dialog = document.createElement('div');
            dialog.style.cssText = `
                background: var(--nebula-surface);
                border: 1px solid var(--nebula-border);
                border-radius: var(--nebula-radius-md);
                padding: 24px;
                min-width: 500px;
                max-width: 700px;
                max-height: 80vh;
                display: flex;
                flex-direction: column;
            `;

            const fileListHtml = files.map((file, index) => `
                <div class="file-option" data-file="${file}" style="
                    padding: 8px 12px;
                    border: 1px solid transparent;
                    border-radius: var(--nebula-radius-sm);
                    cursor: pointer;
                    color: var(--nebula-text-primary);
                    transition: var(--nebula-transition-fast);
                " onmouseover="this.style.background='var(--nebula-surface-hover)'" 
                   onmouseout="this.style.background='transparent'">
                    📄 ${file}
                </div>
            `).join('');

            dialog.innerHTML = `
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 16px 0;">${title}</h3>
                <div style="
                    flex: 1;
                    border: 1px solid var(--nebula-border);
                    border-radius: var(--nebula-radius-sm);
                    padding: 12px;
                    background: var(--nebula-bg-primary);
                    overflow-y: auto;
                    margin-bottom: 16px;
                    max-height: 300px;
                ">
                    ${fileListHtml}
                </div>
                <div style="display: flex; gap: 12px; justify-content: flex-end;">
                    <button id="cancelBtn" style="
                        background: var(--nebula-surface-hover);
                        border: 1px solid var(--nebula-border);
                        color: var(--nebula-text-primary);
                        padding: 8px 16px;
                        border-radius: var(--nebula-radius-sm);
                        cursor: pointer;
                    ">Cancel</button>
                </div>
            `;

            modal.appendChild(dialog);
            document.body.appendChild(modal);

            let selectedFile = null;

            // Handle file selection
            dialog.querySelectorAll('.file-option').forEach(option => {
                option.addEventListener('click', () => {
                    // Remove previous selection
                    dialog.querySelectorAll('.file-option').forEach(o => {
                        o.style.background = 'transparent';
                        o.style.borderColor = 'transparent';
                    });

                    // Highlight selected
                    option.style.background = 'var(--nebula-primary)';
                    option.style.borderColor = 'var(--nebula-primary)';
                    option.style.color = 'white';

                    selectedFile = basePath + '/' + option.dataset.file;
                });

                // Double click to open
                option.addEventListener('dblclick', () => {
                    selectedFile = basePath + '/' + option.dataset.file;
                    cleanup(selectedFile);
                });
            });

            // Handle buttons
            const cleanup = (result) => {
                document.body.removeChild(modal);
                resolve(result);
            };

            dialog.querySelector('#cancelBtn').addEventListener('click', () => {
                cleanup(null);
            });

            // Handle Escape key
            document.addEventListener('keydown', function escapeHandler(e) {
                if (e.key === 'Escape') {
                    document.removeEventListener('keydown', escapeHandler);
                    cleanup(null);
                }
            });
        });
    }

    // NEW: Update window title and status bar with current tab
    updateWindowTitle() {
        const fileData = this.getCurrentFileData();
        const fileName = fileData ? fileData.name : 'No files open';
        const modified = fileData && fileData.hasUnsavedChanges ? ' •' : '';

        // Update window title
        if (window.windowManager && this.windowId) {
            const title = `💻 Code Assistant Pro - ${fileName}${modified}`;
            window.windowManager.setWindowTitle(this.windowId, title);
        }

        // Update status bar
        const fileStatus = document.getElementById(`fileStatus-${this.windowId}`);
        const fileInfo = document.getElementById(`fileInfo-${this.windowId}`);

        if (fileStatus) {
            if (!fileData) {
                fileStatus.textContent = 'No files open';
            } else {
                fileStatus.textContent = fileData.hasUnsavedChanges ? 'Modified' : 'Saved';
            }
        }

        if (fileInfo) {
            if (fileData && fileData.path) {
                fileInfo.textContent = fileData.path;
            } else if (fileData) {
                fileInfo.textContent = fileData.name;
            } else {
                fileInfo.textContent = 'Open a file to get started';
            }
        }
    }

    // LEGACY: Keep old project system as backup
    saveProject() {
        // Use new file save instead
        this.saveFile();
    }

    showLoadProjectDialog() {
        // Use new file browser instead
        this.browseAndOpenFile();
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

    async optimizeCode() {
        if (!this.monacoEditor) return;

        const code = this.monacoEditor.getValue();
        if (!code.trim()) {
            alert('Please enter some code first!');
            return;
        }

        const prompt = `Please optimize this ${this.currentLanguage} code for better performance, readability, and best practices. Provide the complete improved code:\n\n\`\`\`${this.currentLanguage}\n${code}\n\`\`\``;

        // Check if we're using LM Studio API
        if (this.isAPIService() && this.currentAIService === 'lmstudio') {
            await this.sendToLMStudio(prompt, 'optimize');
        } else {
            // Fallback to clipboard for webview services
            navigator.clipboard.writeText(prompt);
            alert('🔧 Code optimization prompt copied to clipboard!\nPaste it into the AI chat on the right.');
        }
    }

    /**
     * Send request to LM Studio API
     */
    async sendToLMStudio(prompt, action = null) {
        try {
            console.log('🚀 Sending request to LM Studio...');
            
            const response = await fetch(`${this.lmStudioConfig.baseUrl}/v1/chat/completions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(30000),
                body: JSON.stringify({
                    model: this.lmStudioConfig.model,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a helpful coding assistant. When optimizing code, provide the complete improved code in a code block.'
                        },
                        { role: 'user', content: prompt }
                    ],
                    temperature: this.lmStudioConfig.temperature,
                    max_tokens: this.lmStudioConfig.maxTokens
                })
            });

            if (!response.ok) throw new Error(`API error: ${response.status}`);

            const result = await response.json();
            const aiResponse = result.choices[0]?.message?.content || 'No response received';
            
            console.log('✅ LM Studio response received');
            this.showAIResponse(aiResponse, action);
            
        } catch (error) {
            console.error('❌ LM Studio error:', error);
            navigator.clipboard.writeText(prompt);
            alert(`❌ LM Studio connection failed.\n\n📋 Prompt copied to clipboard as fallback.`);
        }
    }

    /**
     * Show AI response with apply options
     */
    showAIResponse(response, action) {
        const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)\n?```/g;
        const matches = [...response.matchAll(codeBlockRegex)];
        
        if (matches.length > 0) {
            const code = matches[0][2].trim();
            this.showApplyCodeDialog(code, action);
        } else {
            alert(`AI Response:\n\n${response}`);
        }
    }

    /**
     * Show dialog to apply AI-generated code
     */
    showApplyCodeDialog(code, action) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.8); display: flex; align-items: center;
            justify-content: center; z-index: 10000;
        `;

        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: var(--nebula-surface); border: 1px solid var(--nebula-border);
            border-radius: var(--nebula-radius-md); padding: 24px; min-width: 600px;
            max-width: 90vw; max-height: 80vh; display: flex; flex-direction: column;
        `;

        dialog.innerHTML = `
            <h3 style="color: var(--nebula-text-primary); margin: 0 0 16px 0;">🤖 Optimized Code</h3>
            <div style="
                border: 1px solid var(--nebula-border); border-radius: var(--nebula-radius-sm);
                background: #1e1e1e; color: #d4d4d4; font-family: 'Consolas', monospace;
                font-size: 13px; padding: 16px; overflow: auto; max-height: 400px;
                white-space: pre; margin-bottom: 16px;
            ">${code}</div>
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button id="replaceBtn" style="
                    background: var(--nebula-primary); border: 1px solid var(--nebula-primary);
                    color: white; padding: 8px 16px; border-radius: var(--nebula-radius-sm); cursor: pointer;
                ">Replace All</button>
                <button id="cancelBtn" style="
                    background: var(--nebula-surface-hover); border: 1px solid var(--nebula-border);
                    color: var(--nebula-text-primary); padding: 8px 16px; border-radius: var(--nebula-radius-sm); cursor: pointer;
                ">Cancel</button>
            </div>
        `;

        modal.appendChild(dialog);
        document.body.appendChild(modal);

        const cleanup = () => document.body.removeChild(modal);

        dialog.querySelector('#replaceBtn').addEventListener('click', () => {
            if (this.monacoEditor) {
                this.monacoEditor.setValue(code);
                this.hasUnsavedChanges = true;
                this.updateWindowTitle();
                console.log('✅ Code replaced with AI optimization');
            }
            cleanup();
        });

        dialog.querySelector('#cancelBtn').addEventListener('click', cleanup);
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
 * Show template customization modal
 */
showTemplateCustomizationModal(templateKey) {
    const template = this.templates[templateKey];
    if (!template) {
        alert('Template not found!');
        return;
    }

    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'template-modal-overlay';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
    `;

    // Create modal dialog
    const dialog = document.createElement('div');
    dialog.className = 'template-modal-dialog';
    dialog.style.cssText = `
        background: var(--nebula-surface);
        border: 1px solid var(--nebula-border);
        border-radius: var(--nebula-radius-lg);
        padding: 32px;
        min-width: 500px;
        max-width: 600px;
        box-shadow: var(--nebula-shadow-xl);
    `;

    // Get template-specific defaults
    const templateDefaults = this.getTemplateDefaults(templateKey);

    dialog.innerHTML = `
        <div class="modal-header" style="margin-bottom: 24px;">
            <h2 style="
                color: var(--nebula-text-primary);
                margin: 0 0 8px 0;
                font-size: 24px;
                font-weight: 700;
                display: flex;
                align-items: center;
                gap: 12px;
            ">
                <span style="font-size: 28px;">${templateDefaults.icon}</span>
                Create ${template.name}
            </h2>
            <p style="
                color: var(--nebula-text-secondary);
                margin: 0;
                font-size: 14px;
                line-height: 1.5;
            ">${template.description}</p>
        </div>

        <form class="template-form">
            <!-- App Name -->
            <div class="form-group" style="margin-bottom: 20px;">
                <label style="
                    display: block;
                    color: var(--nebula-text-primary);
                    font-weight: 600;
                    font-size: 13px;
                    margin-bottom: 6px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                ">App Name *</label>
                <input 
                    type="text" 
                    id="appName" 
                    value="${templateDefaults.appName}"
                    placeholder="My Awesome App"
                    style="
                        width: 100%;
                        padding: 12px 16px;
                        border: 1px solid var(--nebula-border);
                        border-radius: var(--nebula-radius-md);
                        background: var(--nebula-bg-primary);
                        color: var(--nebula-text-primary);
                        font-size: 14px;
                        transition: var(--nebula-transition-fast);
                    "
                >
                <small style="color: var(--nebula-text-secondary); font-size: 12px;">This will be the window title and app display name</small>
            </div>

            <!-- Developer Name -->
            <div class="form-group" style="margin-bottom: 20px;">
                <label style="
                    display: block;
                    color: var(--nebula-text-primary);
                    font-weight: 600;
                    font-size: 13px;
                    margin-bottom: 6px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                ">Developer</label>
                <input 
                    type="text" 
                    id="developerName" 
                    value="Nebula Developer"
                    placeholder="Your Name"
                    style="
                        width: 100%;
                        padding: 12px 16px;
                        border: 1px solid var(--nebula-border);
                        border-radius: var(--nebula-radius-md);
                        background: var(--nebula-bg-primary);
                        color: var(--nebula-text-primary);
                        font-size: 14px;
                        transition: var(--nebula-transition-fast);
                    "
                >
            </div>

            <!-- Class Name (auto-generated) -->
            <div class="form-group" style="margin-bottom: 20px;">
                <label style="
                    display: block;
                    color: var(--nebula-text-primary);
                    font-weight: 600;
                    font-size: 13px;
                    margin-bottom: 6px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                ">Class Name</label>
                <input 
                    type="text" 
                    id="className" 
                    value="${templateDefaults.className}"
                    style="
                        width: 100%;
                        padding: 12px 16px;
                        border: 1px solid var(--nebula-border);
                        border-radius: var(--nebula-radius-md);
                        background: var(--nebula-bg-secondary);
                        color: var(--nebula-text-secondary);
                        font-size: 14px;
                        font-family: 'Consolas', 'Monaco', monospace;
                    "
                    readonly
                >
                <small style="color: var(--nebula-text-secondary); font-size: 12px;">Auto-generated from app name (JavaScript class name)</small>
            </div>

            <!-- Icon Selector -->
            <div class="form-group" style="margin-bottom: 20px;">
                <label style="
                    display: block;
                    color: var(--nebula-text-primary);
                    font-weight: 600;
                    font-size: 13px;
                    margin-bottom: 6px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                ">Icon</label>
                <div style="display: flex; gap: 12px; align-items: center;">
                    <input 
                        type="text" 
                        id="appIcon" 
                        value="${templateDefaults.icon}"
                        maxlength="2"
                        style="
                            width: 60px;
                            padding: 12px;
                            border: 1px solid var(--nebula-border);
                            border-radius: var(--nebula-radius-md);
                            background: var(--nebula-bg-primary);
                            color: var(--nebula-text-primary);
                            font-size: 20px;
                            text-align: center;
                        "
                    >
                    <div class="icon-suggestions" style="display: flex; gap: 6px;">
                        ${this.getIconSuggestionsHTML(templateKey)}
                    </div>
                </div>
                <small style="color: var(--nebula-text-secondary); font-size: 12px;">Click suggestions or type your own emoji</small>
            </div>

            <!-- Template-specific fields -->
            ${this.getTemplateSpecificFieldsHTML(templateKey)}

            <!-- Description -->
            <div class="form-group" style="margin-bottom: 24px;">
                <label style="
                    display: block;
                    color: var(--nebula-text-primary);
                    font-weight: 600;
                    font-size: 13px;
                    margin-bottom: 6px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                ">Description</label>
                <textarea 
                    id="appDescription" 
                    placeholder="Brief description of your app..."
                    style="
                        width: 100%;
                        padding: 12px 16px;
                        border: 1px solid var(--nebula-border);
                        border-radius: var(--nebula-radius-md);
                        background: var(--nebula-bg-primary);
                        color: var(--nebula-text-primary);
                        font-size: 14px;
                        min-height: 80px;
                        resize: vertical;
                        font-family: inherit;
                    "
                >${templateDefaults.description || ''}</textarea>
            </div>
        </form>

        <!-- Modal Actions -->
        <div class="modal-actions" style="
            display: flex;
            gap: 12px;
            justify-content: flex-end;
            border-top: 1px solid var(--nebula-border);
            padding-top: 20px;
            margin-top: 24px;
        ">
            <button id="cancelBtn" style="
                background: var(--nebula-surface-hover);
                border: 1px solid var(--nebula-border);
                color: var(--nebula-text-primary);
                padding: 12px 24px;
                border-radius: var(--nebula-radius-md);
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: var(--nebula-transition-fast);
            ">Cancel</button>
            <button id="createBtn" style="
                background: var(--nebula-primary);
                border: 1px solid var(--nebula-primary);
                color: white;
                padding: 12px 24px;
                border-radius: var(--nebula-radius-md);
                cursor: pointer;
                font-size: 14px;
                font-weight: 600;
                transition: var(--nebula-transition-fast);
                display: flex;
                align-items: center;
                gap: 8px;
            ">
                <span class="material-symbols-outlined" style="font-size: 16px;">rocket_launch</span>
                Create App
            </button>
        </div>
    `;

    modal.appendChild(dialog);
    document.body.appendChild(modal);

    // Set up modal interactions
    this.setupModalEventListeners(modal, templateKey);

    // Focus the app name field
    const appNameInput = dialog.querySelector('#appName');
    if (appNameInput) {
        appNameInput.focus();
        appNameInput.select();
    }
}

/**
 * Get template-specific default values
 */
getTemplateDefaults(templateKey) {
    const defaults = {
        'single-app': {
            appName: 'My App',
            className: 'NebulaMyApp',
            icon: '🚀',
            description: 'A focused single-window application'
        },
        'tabbed-app': {
            appName: 'My Tabbed App',
            className: 'NebulaMyTabbedApp',
            icon: '📑',
            description: 'A multi-tab application for complex workflows'
        },
        'PWA-app': {
            appName: 'My Web App',
            className: 'NebulaMyWebApp',
            icon: '🌐',
            description: 'A Progressive Web App with clean interface'
        }
    };

    return defaults[templateKey] || defaults['single-app'];
}

/**
 * Get icon suggestions for template
 */
getIconSuggestionsHTML(templateKey) {
    const iconSets = {
        'single-app': ['🚀', '⭐', '💎', '🔧', '📱', '💻'],
        'tabbed-app': ['📑', '📊', '📋', '🗂️', '📚', '🎯'],
        'PWA-app': ['🌐', '📱', '🔗', '💻', '📺', '🎬', '🎵', '📧', '💬', '🛒']
    };

    const icons = iconSets[templateKey] || iconSets['single-app'];
    
    return icons.map(icon => 
        `<button type="button" class="icon-suggestion" data-icon="${icon}" style="
            background: var(--nebula-surface-hover);
            border: 1px solid var(--nebula-border);
            width: 36px;
            height: 36px;
            border-radius: var(--nebula-radius-sm);
            cursor: pointer;
            font-size: 16px;
            transition: var(--nebula-transition-fast);
            display: flex;
            align-items: center;
            justify-content: center;
        " title="Use ${icon}">${icon}</button>`
    ).join('');
}

/**
 * Get template-specific form fields
 */
getTemplateSpecificFieldsHTML(templateKey) {
    if (templateKey === 'PWA-app') {
        return `
            <!-- Initial URL for PWA -->
            <div class="form-group" style="margin-bottom: 20px;">
                <label style="
                    display: block;
                    color: var(--nebula-text-primary);
                    font-weight: 600;
                    font-size: 13px;
                    margin-bottom: 6px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                ">Website URL *</label>
                <input 
                    type="url" 
                    id="initialUrl" 
                    value="https://example.com"
                    placeholder="https://youtube.com"
                    style="
                        width: 100%;
                        padding: 12px 16px;
                        border: 1px solid var(--nebula-border);
                        border-radius: var(--nebula-radius-md);
                        background: var(--nebula-bg-primary);
                        color: var(--nebula-text-primary);
                        font-size: 14px;
                        font-family: 'Consolas', 'Monaco', monospace;
                    "
                >
                <small style="color: var(--nebula-text-secondary); font-size: 12px;">The website your PWA will display</small>
            </div>
        `;
    }
    
    return ''; // No extra fields for other templates
}

/**
 * Set up modal event listeners
 */
setupModalEventListeners(modal, templateKey) {
    const dialog = modal.querySelector('.template-modal-dialog');
    
    // Auto-update class name when app name changes
    const appNameInput = dialog.querySelector('#appName');
    const classNameInput = dialog.querySelector('#className');
    
    appNameInput?.addEventListener('input', (e) => {
        const appName = e.target.value.trim();
        const className = this.generateClassName(appName);
        if (classNameInput) {
            classNameInput.value = className;
        }
    });

    // Icon suggestion clicks
    dialog.querySelectorAll('.icon-suggestion').forEach(btn => {
        btn.addEventListener('click', () => {
            const icon = btn.dataset.icon;
            const iconInput = dialog.querySelector('#appIcon');
            if (iconInput) {
                iconInput.value = icon;
            }
            
            // Visual feedback
            dialog.querySelectorAll('.icon-suggestion').forEach(b => {
                b.style.background = 'var(--nebula-surface-hover)';
            });
            btn.style.background = 'var(--nebula-primary)';
        });
    });

    // Cancel button
    dialog.querySelector('#cancelBtn')?.addEventListener('click', () => {
        this.closeModal(modal);
    });

    // Create button
    dialog.querySelector('#createBtn')?.addEventListener('click', () => {
        this.createCustomTemplate(modal, templateKey);
    });

    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            this.closeModal(modal);
        }
    });

    // Close on escape key
    document.addEventListener('keydown', function escapeHandler(e) {
        if (e.key === 'Escape') {
            document.removeEventListener('keydown', escapeHandler);
            this.closeModal(modal);
        }
    }.bind(this));
}

/**
 * Generate valid JavaScript class name from app name
 */
generateClassName(appName) {
    if (!appName.trim()) return 'NebulaMyApp';
    
    // Remove special characters and spaces, capitalize words
    const cleanName = appName
        .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special chars
        .replace(/\s+/g, ' ') // Normalize spaces
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
    
    // Ensure it starts with a letter
    const className = cleanName.match(/^[a-zA-Z]/) ? cleanName : 'Nebula' + cleanName;
    
    return className || 'NebulaMyApp';
}

/**
 * Create customized template
 */
async createCustomTemplate(modal, templateKey) {
    const dialog = modal.querySelector('.template-modal-dialog');
    
    // Collect form data
    const formData = {
        appName: dialog.querySelector('#appName')?.value.trim() || 'My App',
        developerName: dialog.querySelector('#developerName')?.value.trim() || 'Nebula Developer',
        className: dialog.querySelector('#className')?.value.trim() || 'NebulaMyApp',
        appIcon: dialog.querySelector('#appIcon')?.value.trim() || '🚀',
        description: dialog.querySelector('#appDescription')?.value.trim() || '',
        initialUrl: dialog.querySelector('#initialUrl')?.value.trim() || null
    };

    // Validate required fields
    if (!formData.appName) {
        alert('App name is required!');
        return;
    }

    // Show loading state
    const createBtn = dialog.querySelector('#createBtn');
    const originalText = createBtn.innerHTML;
    createBtn.innerHTML = '<span class="material-symbols-outlined spinning">refresh</span> Creating...';
    createBtn.disabled = true;

    try {
        // Load and customize template
        const customizedCode = await this.loadAndCustomizeTemplate(templateKey, formData);
        
        if (customizedCode && this.monacoEditor) {
            // Check if current code should be replaced
            const currentCode = this.monacoEditor.getValue();
            if (currentCode.trim() && !confirm(`Create "${formData.appName}"?\n\nThis will replace current code.`)) {
                return;
            }

            // Set the customized code
            this.monacoEditor.setValue(customizedCode);
            
            // Update current file name if we have tabs
            if (this.activeFileId) {
                const fileData = this.getCurrentFileData();
                if (fileData) {
                    fileData.name = `${formData.appName}.js`;
                    fileData.hasUnsavedChanges = true;
                    if (fileData.tabElement) {
                        const fileName = fileData.tabElement.querySelector('.file-name');
                        if (fileName) fileName.textContent = fileData.name;
                    }
                }
            }

            this.writeOutput(`✅ "${formData.appName}" created successfully!`, 'success');
            this.writeOutput(`Developer: ${formData.developerName}`, 'info');
            if (formData.initialUrl) {
                this.writeOutput(`URL: ${formData.initialUrl}`, 'info');
            }

            // Close modal
            this.closeModal(modal);
        }

    } catch (error) {
        this.writeOutput(`❌ Failed to create template: ${error.message}`, 'error');
        console.error('Template creation error:', error);
    } finally {
        // Restore button
        createBtn.innerHTML = originalText;
        createBtn.disabled = false;
    }
}

/**
 * Load and customize template with user data
 */
async loadAndCustomizeTemplate(templateKey, formData) {
    const template = this.templates[templateKey];
    if (!template) throw new Error('Template not found');

    try {
        // Load template content
        const response = await fetch(template.path);
        if (!response.ok) {
            throw new Error(`Failed to fetch template: ${response.status}`);
        }

        let templateContent = await response.text();

        // Apply customizations based on template type
        templateContent = this.applyTemplateCustomizations(templateContent, templateKey, formData);

        return templateContent;

    } catch (error) {
        // Fallback to embedded template
        console.warn('Falling back to embedded template:', error);
        return this.createEmbeddedCustomTemplate(templateKey, formData);
    }
}

/**
 * Apply customizations to template content
 */
/**
 * Apply customizations to template content - FIXED VERSION
 */
applyTemplateCustomizations(templateContent, templateKey, formData) {
    // Common replacements for all templates
    let customized = templateContent
        // Replace class names
        .replace(/class\s+\w+/g, `class ${formData.className}`)
        // Replace window titles
        .replace(/title:\s*['"`][^'"`]*['"`]/g, `title: '${formData.appName}'`)
        // Replace getTitle() return values
        .replace(/getTitle\(\)\s*{\s*return\s*['"`][^'"`]*['"`]/g, `getTitle() {\n        return '${formData.appName}'`)
        // Replace getIcon() return values
        .replace(/getIcon\(\)\s*{\s*return\s*['"`][^'"`]*['"`]/g, `getIcon() {\n        return '${formData.appIcon}'`);

    // Template-specific customizations
    if (templateKey === 'PWA-app' && formData.initialUrl) {
        // Replace initial URL in PWA template
        customized = customized
            .replace(/initialUrl\s*=\s*['"`][^'"`]*['"`]/g, `initialUrl = '${formData.initialUrl}'`)
            .replace(/defaultHomePage:\s*['"`][^'"`]*['"`]/g, `defaultHomePage: '${formData.initialUrl}'`);
    }

    // FIX: Handle the ending registration block properly
    // Find the original class name from the template
    const originalClassMatch = templateContent.match(/class\s+(\w+)/);
    const originalClassName = originalClassMatch ? originalClassMatch[1] : 'NebulaPWAHost';
    
    // Replace the final registration block completely
    const properRegistration = `
// Register the app class globally  
window.${formData.className} = ${formData.className};

// Register with launcher if available
if (window.registerNebulaApp) {
    window.registerNebulaApp({
        id: '${formData.className.toLowerCase()}',
        name: '${formData.appName}',
        icon: '${formData.appIcon}',
        className: '${formData.className}',
        description: '${formData.description || ''}',
        category: 'user-generated'
    });
}

// Create initial instance
new ${formData.className}();`;

    // Replace everything from the first "window." assignment to the end
    customized = customized.replace(
        /\/\/\s*Register.*[\s\S]*$/,
        properRegistration
    );

    // Also handle case where there's no comment, just direct registration
    customized = customized.replace(
        /window\.\w+\s*=\s*\w+;[\s\S]*$/,
        properRegistration
    );

    // Add developer comment at the top
    const header = `// ${formData.appName}
// Created by: ${formData.developerName}
${formData.description ? `// Description: ${formData.description}\n` : ''}// Generated by Nebula Code Assistant
// Template: ${this.templates[templateKey].name}

`;

    return header + customized;
}

/**
 * Additional helper method to ensure proper class registration
 */
ensureProperClassRegistration(content, className) {
    // Make sure the final lines are correct
    const lines = content.split('\n');
    const lastNonEmptyLines = lines.filter(line => line.trim()).slice(-3);
    
    // Check if the last few lines contain proper registration
    const hasWindowAssignment = lastNonEmptyLines.some(line => 
        line.includes(`window.${className} = ${className}`)
    );
    const hasInstantiation = lastNonEmptyLines.some(line => 
        line.includes(`new ${className}()`)
    );
    
    if (!hasWindowAssignment || !hasInstantiation) {
        // Append correct registration
        const properEnding = `
// Register the app with WindowManager
window.${className} = ${className};
new ${className}();`;
        
        return content.replace(/\/\/.*Register.*[\s\S]*$/, properEnding);
    }
    
    return content;
}

/**
 * Create embedded custom template (fallback)
 */
createEmbeddedCustomTemplate(templateKey, formData) {
    if (templateKey === 'PWA-app') {
        return `// ${formData.appName}
// Created by: ${formData.developerName}
${formData.description ? `// Description: ${formData.description}\n` : ''}
class ${formData.className} {
    constructor() {
        this.windowId = null;
        this.initialUrl = '${formData.initialUrl || 'https://example.com'}';
        this.init();
    }
    
    async init() {
        if (!window.windowManager) return;
        
        this.windowId = window.windowManager.createWindow({
            title: '${formData.appName}',
            width: 1200,
            height: 800,
            resizable: true
        });
        
        window.windowManager.loadApp(this.windowId, this);
    }
    
    render() {
        // PWA implementation here
        const container = document.createElement('div');
        container.innerHTML = '<h1>${formData.appName}</h1>';
        return container;
    }
    
    getTitle() { return '${formData.appName}'; }
    getIcon() { return '${formData.appIcon}'; }
    cleanup() { console.log('${formData.appName} cleanup'); }
}

window.${formData.className} = ${formData.className};`;
    }

    // Similar for other templates...
    return `// ${formData.appName} - Generated Template`;
}

/**
 * Close modal
 */
closeModal(modal) {
    if (modal && modal.parentNode) {
        modal.parentNode.removeChild(modal);
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
            .code-toolbar-btn {
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
            
            .code-toolbar-btn:hover {
                background: var(--nebula-surface-active);
                border-color: var(--nebula-border-hover);
            }
            
            .code-toolbar-btn .material-symbols-outlined {
                font-size: 16px;
            }
            
            .run-btn:hover {
                background: var(--nebula-success-hover) !important;
            }
            
            .code-ai-action-btn {
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
            
            .code-ai-action-btn:hover {
                background: var(--nebula-surface-hover);
                border-color: var(--nebula-primary);
            }
            
            /* NEW: File Tab Styles */
            .file-tab-bar {
                scrollbar-width: thin;
                scrollbar-color: var(--nebula-surface-hover) transparent;
            }
            
            .file-tab-bar::-webkit-scrollbar {
                height: 6px;
            }
            
            .file-tab-bar::-webkit-scrollbar-track {
                background: transparent;
            }
            
            .file-tab-bar::-webkit-scrollbar-thumb {
                background: var(--nebula-surface-hover);
                border-radius: 3px;
            }
            
            .file-tab:hover {
                background: var(--nebula-surface-hover) !important;
            }
            
            .file-tab .tab-close-btn {
                opacity: 0;
                transition: opacity 0.2s ease;
            }
            
            .file-tab:hover .tab-close-btn {
                opacity: 1;
            }
            
            .file-tab .tab-close-btn:hover {
                background: var(--nebula-surface-active);
            }
            
            .new-tab-btn:hover {
                background: var(--nebula-surface-hover);
            }
            
            /* File Type Icon Colors */
            .file-tab .file-icon {
                font-weight: bold;
                font-size: 14px;
            }
            
            /* JavaScript - Yellow */
            .file-tab[data-language="javascript"] .file-icon {
                color: #f7df1e;
            }
            
            /* TypeScript - Blue */
            .file-tab[data-language="typescript"] .file-icon {
                color: #3178c6;
            }
            
            /* Python - Green/Blue */
            .file-tab[data-language="python"] .file-icon {
                color: #3776ab;
            }
            
            /* HTML - Orange */
            .file-tab[data-language="html"] .file-icon {
                color: #e34f26;
            }
            
            /* CSS - Blue */
            .file-tab[data-language="css"] .file-icon {
                color: #1572b6;
            }
            
            /* JSON - Green */
            .file-tab[data-language="json"] .file-icon {
                color: #00d084;
            }
            
            /* Markdown - Gray */
            .file-tab[data-language="markdown"] .file-icon {
                color: #666666;
            }
            
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }

                    .code-toolbar-btn {
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
        
        .code-toolbar-btn:hover {
            background: var(--nebula-surface-active);
            border-color: var(--nebula-border-hover);
        }
        
        .run-btn:hover {
            background: var(--nebula-success-hover) !important;
        }
        
        /* 🆕 NEW: Width button styles */
        .code-width-btn {
            background: var(--nebula-surface-hover);
            border: 1px solid var(--nebula-border);
            color: var(--nebula-text-secondary);
            padding: 4px 8px;
            border-radius: var(--nebula-radius-sm);
            cursor: pointer;
            font-size: 11px;
            transition: var(--nebula-transition-fast);
            min-width: 32px;
            text-align: center;
        }
        
        .code-width-btn:hover {
            background: var(--nebula-surface-active);
            color: var(--nebula-text-primary);
        }
        
        .code-width-btn.active {
            background: var(--nebula-primary);
            color: white;
            border-color: var(--nebula-primary);
        }

        /* Template Modal Styles */
.template-modal-overlay input:focus,
.template-modal-overlay textarea:focus {
    outline: none;
    border-color: var(--nebula-primary);
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.template-modal-overlay button:hover {
    transform: translateY(-1px);
    box-shadow: var(--nebula-shadow-md);
}

.template-modal-overlay .icon-suggestion:hover {
    background: var(--nebula-surface-active) !important;
    transform: translateY(-1px);
    box-shadow: var(--nebula-shadow-sm);
}

.spinning {
    animation: spin 1s linear infinite;
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

    // Helper function to check if current AI service uses API
    isAPIService() {
        return this.aiServices[this.currentAIService]?.type === 'api';
    }

    getTitle() {
        return 'Code Assistant Pro';
    }

    getIcon() {
        return '💻';
    }

    cleanup() {
        // Check for unsaved changes before closing
        if (this.hasUnsavedChanges) {
            if (confirm('You have unsaved changes. Close anyway?')) {
                // User confirmed, proceed with cleanup
            } else {
                // User cancelled, prevent close
                return false;
            }
        }

        if (this.monacoEditor) {
            this.monacoEditor.dispose();
            this.monacoEditor = null;
        }
        console.log('Code Assistant cleanup');
        return true;
    }
}

// Export for use in NebulaDesktop (original)
window.NebulaCodeAssistant = NebulaCodeAssistant;