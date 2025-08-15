// Complete Enhanced NebulaCodeAssistant v2 - All Features Integrated
// Copy and paste this entire file to replace your existing code-assistant.js

class NebulaCodeAssistant {
    constructor() {
        this.windowId = null;
        this.monacoEditor = null;
        this.webview = null;
        this.currentLanguage = 'javascript';
        this.clickExtractMode = false;
        this.savedProjects = [];
        
        // Load preferred AI or default to Claude
        this.currentAIService = this.getPreferredAI();
        
        // AI Services with Claude as first option
        this.aiServices = {
            claude: {
                name: 'Claude (Preferred)',
                url: 'https://claude.ai/',
                icon: '🧠'
            },
            chatgpt: {
                name: 'ChatGPT',
                url: 'https://chat.openai.com/',
                icon: '🤖'
            },
            copilot: {
                name: 'GitHub Copilot',
                url: 'https://github.com/features/copilot',
                icon: '🐙'
            },
            gemini: {
                name: 'Gemini',
                url: 'https://gemini.google.com/',
                icon: '💎'
            },
            perplexity: {
                name: 'Perplexity',
                url: 'https://perplexity.ai/',
                icon: '🔍'
            }
        };
        
        this.init();
    }
    
    /**
     * Get preferred AI from localStorage
     */
    getPreferredAI() {
        try {
            return localStorage.getItem('nebula-preferred-ai') || 'claude';
        } catch (e) {
            return 'claude';
        }
    }
    
    /**
     * Set preferred AI
     */
    setPreferredAI(aiKey) {
        try {
            localStorage.setItem('nebula-preferred-ai', aiKey);
            // Update the service name to show it's preferred
            Object.keys(this.aiServices).forEach(key => {
                this.aiServices[key].name = this.aiServices[key].name.replace(' (Preferred)', '');
            });
            this.aiServices[aiKey].name += ' (Preferred)';
        } catch (e) {
            console.warn('Could not save preferred AI');
        }
    }
    
    async init() {
        if (!window.windowManager) {
            console.error('WindowManager not available');
            return;
        }
        
        this.windowId = window.windowManager.createWindow({
            title: '💻 Code Assistant',
            width: 1400,
            height: 800,
            resizable: true,
            maximizable: true,
            minimizable: true,
            hasTabBar: false
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
            flex-direction: column;
            background: var(--nebula-bg-primary);
            font-family: var(--nebula-font-family);
        `;
        
        container.innerHTML = `
            <!-- Enhanced Header with preferred AI and click extract -->
            <div class="code-header" style="
                background: var(--nebula-surface);
                border-bottom: 1px solid var(--nebula-border);
                padding: 12px 16px;
                display: flex;
                align-items: center;
                gap: 12px;
                flex-wrap: wrap;
            ">
                <!-- File Operations -->
                <div class="file-controls" style="display: flex; gap: 8px; align-items: center;">
                    <button id="newFile-${this.windowId}" style="
                        background: var(--nebula-primary);
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: var(--nebula-radius-sm);
                        cursor: pointer;
                        font-size: 12px;
                    ">New</button>
                    
                    <button id="saveProject-${this.windowId}" style="
                        background: var(--nebula-success);
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: var(--nebula-radius-sm);
                        cursor: pointer;
                        font-size: 12px;
                    ">Save</button>
                    
                    <button id="loadProject-${this.windowId}" style="
                        background: var(--nebula-secondary);
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: var(--nebula-radius-sm);
                        cursor: pointer;
                        font-size: 12px;
                    ">Load</button>
                </div>
                
                <!-- Language Selection -->
                <div class="language-controls" style="display: flex; gap: 8px; align-items: center;">
                    <label style="color: var(--nebula-text-secondary); font-size: 12px;">Language:</label>
                    <select id="languageSelect-${this.windowId}" style="
                        padding: 4px 8px;
                        border-radius: var(--nebula-radius-sm);
                        border: 1px solid var(--nebula-border);
                        background: var(--nebula-bg-primary);
                        color: var(--nebula-text-primary);
                        font-size: 12px;
                    ">
                        <option value="javascript">JavaScript</option>
                        <option value="typescript">TypeScript</option>
                        <option value="python">Python</option>
                        <option value="html">HTML</option>
                        <option value="css">CSS</option>
                        <option value="json">JSON</option>
                        <option value="markdown">Markdown</option>
                        <option value="java">Java</option>
                        <option value="cpp">C++</option>
                        <option value="csharp">C#</option>
                    </select>
                </div>
                
                <!-- Enhanced Import Controls -->
                <div class="ai-controls" style="display: flex; gap: 8px; align-items: center; margin-left: auto;">
                    <button id="smartImport-${this.windowId}" style="
                        background: var(--nebula-primary);
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: var(--nebula-radius-sm);
                        cursor: pointer;
                        font-size: 12px;
                        font-weight: 500;
                    " title="Smart import from clipboard (Ctrl+Shift+I)">📥 Smart Import</button>
                    
                    <button id="clickExtract-${this.windowId}" style="
                        background: var(--nebula-info);
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: var(--nebula-radius-sm);
                        cursor: pointer;
                        font-size: 12px;
                        font-weight: 500;
                    " title="Click to extract code from AI chat">🎯 Click Extract</button>
                    
                    <button id="debugTerminal-${this.windowId}" style="
                        background: var(--nebula-warning);
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: var(--nebula-radius-sm);
                        cursor: pointer;
                        font-size: 12px;
                        font-weight: 500;
                    " title="Debug in Terminal (Ctrl+Shift+D)">🐛 Debug</button>
                    
                    <button id="formatCode-${this.windowId}" style="
                        background: var(--nebula-info);
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: var(--nebula-radius-sm);
                        cursor: pointer;
                        font-size: 12px;
                    ">Format</button>
                </div>
            </div>
            
            <!-- Resizable Main Content Area -->
            <div class="code-content" style="
                flex: 1;
                display: flex;
                background: var(--nebula-bg-primary);
                position: relative;
            ">
                <!-- Code Editor Panel -->
                <div id="editorPanel-${this.windowId}" class="editor-panel" style="
                    width: 60%;
                    border-right: 1px solid var(--nebula-border);
                    display: flex;
                    flex-direction: column;
                    min-width: 300px;
                ">
                    <!-- Editor Toolbar -->
                    <div class="editor-toolbar" style="
                        background: var(--nebula-surface);
                        border-bottom: 1px solid var(--nebula-border);
                        padding: 8px 12px;
                        display: flex;
                        gap: 8px;
                        align-items: center;
                        font-size: 12px;
                    ">
                        <span style="color: var(--nebula-text-secondary);">Editor:</span>
                        <span id="editorStatus-${this.windowId}" style="color: var(--nebula-text-primary);">Ready</span>
                        <span style="margin-left: auto; color: var(--nebula-text-secondary);" id="lineCount-${this.windowId}">0 lines</span>
                    </div>
                    
                    <!-- Monaco Editor Container -->
                    <div id="monacoEditor-${this.windowId}" style="
                        flex: 1;
                        position: relative;
                        background: #1e1e1e;
                    "></div>
                    
                    <!-- Quick Actions Bar -->
                    <div class="quick-actions" style="
                        background: var(--nebula-surface);
                        border-top: 1px solid var(--nebula-border);
                        padding: 8px 12px;
                        display: flex;
                        gap: 8px;
                        align-items: center;
                    ">
                        <button id="copyAllCode-${this.windowId}" style="
                            background: transparent;
                            border: 1px solid var(--nebula-border);
                            color: var(--nebula-text-primary);
                            padding: 4px 8px;
                            border-radius: var(--nebula-radius-sm);
                            cursor: pointer;
                            font-size: 11px;
                        ">Copy All</button>
                        
                        <button id="insertToFile-${this.windowId}" style="
                            background: transparent;
                            border: 1px solid var(--nebula-border);
                            color: var(--nebula-text-primary);
                            padding: 4px 8px;
                            border-radius: var(--nebula-radius-sm);
                            cursor: pointer;
                            font-size: 11px;
                        ">Save to File</button>
                        
                        <span style="margin-left: auto; color: var(--nebula-text-secondary); font-size: 11px;" id="charCount-${this.windowId}">0 characters</span>
                    </div>
                </div>
                
                <!-- Resizable Splitter -->
                <div id="splitter-${this.windowId}" class="splitter" style="
                    width: 4px;
                    background: var(--nebula-border);
                    cursor: col-resize;
                    position: relative;
                    z-index: 10;
                    transition: background-color 0.2s ease;
                "></div>
                
                <!-- AI Assistant Panel -->
                <div id="aiPanel-${this.windowId}" class="ai-panel" style="
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    background: var(--nebula-surface);
                    min-width: 300px;
                ">
                    <!-- Enhanced AI Service Selector -->
                    <div class="ai-header" style="
                        padding: 12px;
                        border-bottom: 1px solid var(--nebula-border);
                        background: var(--nebula-bg-secondary);
                    ">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                            <label style="color: var(--nebula-text-secondary); font-size: 12px; font-weight: 500;">AI Service:</label>
                            <select id="aiServiceSelector-${this.windowId}" style="
                                flex: 1;
                                padding: 4px 8px;
                                border-radius: var(--nebula-radius-sm);
                                border: 1px solid var(--nebula-border);
                                background: var(--nebula-bg-primary);
                                color: var(--nebula-text-primary);
                                font-size: 12px;
                            ">
                                ${Object.entries(this.aiServices).map(([key, service]) => `
                                    <option value="${key}" ${key === this.currentAIService ? 'selected' : ''}>
                                        ${service.icon} ${service.name}
                                    </option>
                                `).join('')}
                            </select>
                            <button id="setPreferred-${this.windowId}" style="
                                background: var(--nebula-success);
                                color: white;
                                border: none;
                                padding: 4px 8px;
                                border-radius: var(--nebula-radius-sm);
                                cursor: pointer;
                                font-size: 10px;
                            " title="Set as preferred AI">⭐</button>
                        </div>
                        
                        <!-- Quick AI Actions -->
                        <div class="ai-quick-actions" style="display: flex; gap: 6px; flex-wrap: wrap;">
                            <button id="explainCode-${this.windowId}" style="
                                background: var(--nebula-info);
                                color: white;
                                border: none;
                                padding: 4px 8px;
                                border-radius: var(--nebula-radius-sm);
                                cursor: pointer;
                                font-size: 10px;
                            ">Explain</button>
                            
                            <button id="optimizeCode-${this.windowId}" style="
                                background: var(--nebula-success);
                                color: white;
                                border: none;
                                padding: 4px 8px;
                                border-radius: var(--nebula-radius-sm);
                                cursor: pointer;
                                font-size: 10px;
                            ">Optimize</button>
                            
                            <button id="addComments-${this.windowId}" style="
                                background: var(--nebula-secondary);
                                color: white;
                                border: none;
                                padding: 4px 8px;
                                border-radius: var(--nebula-radius-sm);
                                cursor: pointer;
                                font-size: 10px;
                            ">Add Comments</button>
                            
                            <button id="generateTests-${this.windowId}" style="
                                background: var(--nebula-warning);
                                color: white;
                                border: none;
                                padding: 4px 8px;
                                border-radius: var(--nebula-radius-sm);
                                cursor: pointer;
                                font-size: 10px;
                            ">Generate Tests</button>
                        </div>
                        
                        <!-- Click Extract Status -->
                        <div id="extractStatus-${this.windowId}" style="
                            margin-top: 8px;
                            padding: 4px 8px;
                            background: var(--nebula-warning);
                            color: white;
                            border-radius: var(--nebula-radius-sm);
                            font-size: 11px;
                            text-align: center;
                            display: none;
                        ">🎯 Click Extract Mode Active - Click any code in the AI chat</div>
                    </div>
                    
                    <!-- AI Chat Content -->
                    <div class="ai-content" style="flex: 1; position: relative;">
                        <!-- Loading Indicator -->
                        <div id="chatLoading-${this.windowId}" class="ai-loading" style="
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            color: var(--nebula-text-secondary);
                            font-size: 14px;
                            text-align: center;
                            z-index: 10;
                            display: none;
                        ">
                            <span class="material-symbols-outlined" style="
                                font-size: 32px;
                                margin-bottom: 8px;
                                display: block;
                                animation: spin 2s linear infinite;
                            ">autorenew</span>
                            Loading AI service...
                        </div>
                        
                        <!-- Webview will be inserted here -->
                    </div>
                    
                    <!-- AI Footer Controls -->
                    <div class="ai-footer" style="
                        padding: 8px 12px;
                        border-top: 1px solid var(--nebula-border);
                        background: var(--nebula-bg-secondary);
                        display: flex;
                        gap: 8px;
                        align-items: center;
                    ">
                        <button id="refreshAI-${this.windowId}" style="
                            background: transparent;
                            border: 1px solid var(--nebula-border);
                            color: var(--nebula-text-primary);
                            padding: 4px 8px;
                            border-radius: var(--nebula-radius-sm);
                            cursor: pointer;
                            font-size: 11px;
                        ">🔄 Refresh</button>
                        
                        <button id="newChat-${this.windowId}" style="
                            background: transparent;
                            border: 1px solid var(--nebula-border);
                            color: var(--nebula-text-primary);
                            padding: 4px 8px;
                            border-radius: var(--nebula-radius-sm);
                            cursor: pointer;
                            font-size: 11px;
                        ">➕ New Chat</button>
                        
                        <span style="margin-left: auto; color: var(--nebula-text-secondary); font-size: 10px;">
                            Preferred: ${this.aiServices[this.getPreferredAI()].name.replace(' (Preferred)', '')}
                        </span>
                    </div>
                </div>
            </div>
            
            <!-- Status Bar -->
            <div class="status-bar" style="
                background: var(--nebula-surface);
                border-top: 1px solid var(--nebula-border);
                padding: 4px 12px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 11px;
                color: var(--nebula-text-secondary);
            ">
                <div class="status-left">
                    <span id="integrationStatus-${this.windowId}">🔗 Integration Ready</span>
                </div>
                <div class="status-right">
                    <span>Shortcuts: Ctrl+Shift+I (Import) | Ctrl+Shift+D (Debug) | 🎯 Click Extract | Drag to resize</span>
                </div>
            </div>
        `;
        
        // Initialize everything
        setTimeout(() => {
            this.initializeMonaco();
            this.setupEventListeners();
            this.setupResizablePanels();
            this.createWebview();
            this.updateEditorStats();
            this.setupKeyboardShortcuts();
        }, 100);
        
        return container;
    }
    
    /**
     * Setup resizable panels
     */
    setupResizablePanels() {
        const splitter = document.getElementById(`splitter-${this.windowId}`);
        const editorPanel = document.getElementById(`editorPanel-${this.windowId}`);
        const aiPanel = document.getElementById(`aiPanel-${this.windowId}`);
        const container = splitter.parentElement;
        
        let isResizing = false;
        
        splitter.addEventListener('mousedown', (e) => {
            isResizing = true;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            
            // Highlight splitter
            splitter.style.background = 'var(--nebula-primary)';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            
            const containerRect = container.getBoundingClientRect();
            const mouseX = e.clientX - containerRect.left;
            const containerWidth = containerRect.width;
            
            // Calculate new widths (with minimum constraints)
            const minWidth = 300;
            const maxEditorWidth = containerWidth - minWidth - 4; // 4px for splitter
            const newEditorWidth = Math.max(minWidth, Math.min(maxEditorWidth, mouseX));
            
            // Apply new widths
            const editorPercent = (newEditorWidth / containerWidth) * 100;
            const aiPercent = 100 - editorPercent;
            
            editorPanel.style.width = `${editorPercent}%`;
            aiPanel.style.width = `${aiPercent}%`;
            aiPanel.style.flex = 'none';
            
            // Trigger Monaco resize if available
            if (this.monacoEditor && this.monacoEditor.layout) {
                setTimeout(() => this.monacoEditor.layout(), 0);
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                splitter.style.background = 'var(--nebula-border)';
            }
        });
        
        // Hover effect
        splitter.addEventListener('mouseenter', () => {
            if (!isResizing) {
                splitter.style.background = 'var(--nebula-primary)';
            }
        });
        
        splitter.addEventListener('mouseleave', () => {
            if (!isResizing) {
                splitter.style.background = 'var(--nebula-border)';
            }
        });
    }
    
    /**
     * Initialize Monaco Editor
     */
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
            
            // Update status
            const statusEl = document.getElementById(`editorStatus-${this.windowId}`);
            if (statusEl) statusEl.textContent = 'Monaco Editor Loaded';
            
            console.log('Monaco Editor initialized');
        } catch (error) {
            console.error('Failed to initialize Monaco Editor:', error);
            // Fallback to textarea if Monaco fails
            this.createFallbackEditor();
        }
    }
    
    /**
     * Load Monaco Editor from CDN
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
     * Create fallback textarea editor if Monaco fails
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
            getModel: () => ({ getLanguageId: () => this.currentLanguage }),
            onDidChangeModelContent: (callback) => {
                const editor = document.getElementById(`fallbackEditor-${this.windowId}`);
                if (editor) {
                    editor.addEventListener('input', callback);
                }
            }
        };
        
        // Update status
        const statusEl = document.getElementById(`editorStatus-${this.windowId}`);
        if (statusEl) statusEl.textContent = 'Fallback Editor Loaded';
    }
    
    /**
     * Get welcome code example
     */
    getWelcomeCode() {
        const examples = {
            javascript: `// Welcome to Nebula Code Assistant! 🚀
// This Monaco editor supports full IntelliSense and syntax highlighting

function greetUser(name = "Developer") {
    const message = \`Hello, \${name}! Ready to code?\`;
    console.log(message);
    return message;
}

// Try the new AI features on the right →
// • Click "🎯 Click Extract" then click code in AI chat to extract it
// • Click "Smart Import" to import code from clipboard
// • Click "Debug" to test your JavaScript in the terminal
// • Use "Explain", "Optimize" etc. for AI assistance
// • Drag the splitter to resize panels
// • Keyboard shortcuts: Ctrl+Shift+I (Import), Ctrl+Shift+D (Debug)

greetUser("Nebula User");

// TODO: Start coding your amazing project here!`,
            
            python: `# Welcome to Nebula Code Assistant! 🚀
# This Monaco editor supports full Python syntax highlighting

def greet_user(name="Developer"):
    message = f"Hello, {name}! Ready to code?"
    print(message)
    return message

# Try the new AI features on the right →
# • Click "🎯 Click Extract" then click code in AI chat to extract it
# • Click "Smart Import" to import code from clipboard
# • Use "Explain", "Optimize" etc. for AI assistance
# • Switch languages easily with the dropdown above

greet_user("Nebula User")

# TODO: Start coding your amazing Python project here!`,

            html: `<!-- Welcome to Nebula Code Assistant! 🚀 -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Nebula Project</title>
</head>
<body>
    <h1>Hello from Nebula Desktop! 🌌</h1>
    <p>This HTML editor supports full syntax highlighting.</p>
    
    <!-- Try the new AI features on the right →
         • Click "🎯 Click Extract" then click code in AI chat to extract it
         • Click "Smart Import" to import code from clipboard
         • Use "Explain", "Optimize" etc. for AI assistance -->
    
    <script>
        console.log("Ready to build amazing web projects!");
    </script>
</body>
</html>`
        };
        
        return examples[this.currentLanguage] || examples.javascript;
    }
    
    /**
     * Enhanced event listeners setup
     */
    setupEventListeners() {
        // File operations
        document.getElementById(`newFile-${this.windowId}`)?.addEventListener('click', () => {
            this.newFile();
        });
        
        document.getElementById(`saveProject-${this.windowId}`)?.addEventListener('click', () => {
            this.saveProject();
        });
        
        document.getElementById(`loadProject-${this.windowId}`)?.addEventListener('click', () => {
            this.showProjectsList();
        });
        
        // Language switching
        document.getElementById(`languageSelect-${this.windowId}`)?.addEventListener('change', (e) => {
            this.switchLanguage(e.target.value);
        });
        
        // Enhanced AI import and debug
        document.getElementById(`smartImport-${this.windowId}`)?.addEventListener('click', () => {
            this.enhancedSmartImport();
        });
        
        document.getElementById(`clickExtract-${this.windowId}`)?.addEventListener('click', () => {
            this.toggleClickExtractMode();
        });
        
        document.getElementById(`debugTerminal-${this.windowId}`)?.addEventListener('click', () => {
            this.debugWithTerminal();
        });
        
        document.getElementById(`formatCode-${this.windowId}`)?.addEventListener('click', () => {
            this.formatCode();
        });
        
        // AI service switching
        document.getElementById(`aiServiceSelector-${this.windowId}`)?.addEventListener('change', (e) => {
            this.switchAIService(e.target.value);
        });
        
        // Set preferred AI
        document.getElementById(`setPreferred-${this.windowId}`)?.addEventListener('click', () => {
            this.setPreferredAI(this.currentAIService);
            alert(`${this.aiServices[this.currentAIService].name} set as preferred AI!`);
            
            // Update footer display
            const footerSpan = document.querySelector(`#${this.windowId} .ai-footer span:last-child`);
            if (footerSpan) {
                footerSpan.textContent = `Preferred: ${this.aiServices[this.currentAIService].name.replace(' (Preferred)', '')}`;
            }
        });
        
        // Quick AI actions
        document.getElementById(`explainCode-${this.windowId}`)?.addEventListener('click', () => {
            this.explainCode();
        });
        
        document.getElementById(`optimizeCode-${this.windowId}`)?.addEventListener('click', () => {
            this.optimizeCode();
        });
        
        document.getElementById(`addComments-${this.windowId}`)?.addEventListener('click', () => {
            this.addComments();
        });
        
        document.getElementById(`generateTests-${this.windowId}`)?.addEventListener('click', () => {
            this.generateTests();
        });
        
        // Editor actions
        document.getElementById(`copyAllCode-${this.windowId}`)?.addEventListener('click', () => {
            this.copyAllCode();
        });
        
        document.getElementById(`insertToFile-${this.windowId}`)?.addEventListener('click', () => {
            this.insertCodeToFile();
        });
        
        // AI controls
        document.getElementById(`refreshAI-${this.windowId}`)?.addEventListener('click', () => {
            this.refreshWebview();
        });
        
        document.getElementById(`newChat-${this.windowId}`)?.addEventListener('click', () => {
            this.startNewChat();
        });
    }
    
    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only handle if this window is focused
            const windowElement = document.getElementById(this.windowId);
            if (!windowElement || !windowElement.contains(document.activeElement)) {
                return;
            }
            
            // Ctrl+Shift+I - Smart Import
            if (e.ctrlKey && e.shiftKey && e.key === 'I') {
                e.preventDefault();
                this.enhancedSmartImport();
            }
            
            // Ctrl+Shift+D - Debug in Terminal
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                this.debugWithTerminal();
            }
            
            // Ctrl+S - Save
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveProject();
            }
            
            // F5 - Refresh AI
            if (e.key === 'F5') {
                e.preventDefault();
                this.refreshWebview();
            }
        });
    }
    
    /**
     * Update editor statistics
     */
    updateEditorStats() {
        if (!this.monacoEditor) return;
        
        const updateStats = () => {
            const code = this.monacoEditor.getValue();
            const lines = code.split('\n').length;
            const chars = code.length;
            
            const lineCountEl = document.getElementById(`lineCount-${this.windowId}`);
            const charCountEl = document.getElementById(`charCount-${this.windowId}`);
            
            if (lineCountEl) lineCountEl.textContent = `${lines} lines`;
            if (charCountEl) charCountEl.textContent = `${chars} characters`;
        };
        
        // Update on content change
        if (this.monacoEditor.onDidChangeModelContent) {
            this.monacoEditor.onDidChangeModelContent(updateStats);
        }
        
        // Initial update
        updateStats();
    }
    
    /**
     * Create webview for AI service
     */
    createWebview() {
        const content = document.querySelector(`#${this.windowId} .ai-content`);
        if (!content) return;
        
        this.showLoading();
        
        // Remove existing webview
        if (this.webview) {
            this.webview.remove();
            this.webview = null;
        }
        
        // Create new webview
        this.webview = document.createElement('webview');
        this.webview.className = 'code-ai-webview';
        this.webview.style.cssText = `
            width: 100%;
            height: 100%;
            border: none;
            background: var(--nebula-bg-primary);
        `;
        
        const currentService = this.aiServices[this.currentAIService];
        this.webview.src = currentService.url;
        
        this.setupWebviewListeners();
        content.appendChild(this.webview);
        
        console.log(`Created code AI webview for ${currentService.name}`);
    }
    
    /**
     * Set up webview event listeners
     */
    setupWebviewListeners() {
        if (!this.webview) return;
        
        this.webview.addEventListener('dom-ready', () => {
            this.hideLoading();
            console.log('Code AI webview loaded');
            
            // If click extract mode is active, inject the extractor
            if (this.clickExtractMode) {
                this.injectClickExtractor();
            }
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
     * Show/hide loading indicator
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
     * Switch programming language
     */
    switchLanguage(language) {
        this.currentLanguage = language;
        
        if (this.monacoEditor && window.monaco) {
            monaco.editor.setModelLanguage(this.monacoEditor.getModel(), language);
        }
        
        // Update welcome code if editor is empty
        const currentCode = this.monacoEditor.getValue();
        if (!currentCode.trim() || currentCode.includes('Welcome to Nebula Code Assistant')) {
            this.monacoEditor.setValue(this.getWelcomeCode());
        }
        
        console.log(`Switched to ${language}`);
    }
    
    /**
     * Switch AI service
     */
    switchAIService(serviceKey) {
        if (!this.aiServices[serviceKey]) {
            console.error('Unknown AI service:', serviceKey);
            return;
        }
        
        this.currentAIService = serviceKey;
        
        // Update window title
        if (window.windowManager) {
            window.windowManager.setWindowTitle(this.windowId, `💻 Code Assistant - ${this.aiServices[serviceKey].name}`);
        }
        
        this.createWebview();
        
        console.log(`Switched to ${this.aiServices[serviceKey].name}`);
    }
    
    /**
     * Enhanced smart import that handles both formatted and raw code
     */
    async enhancedSmartImport() {
        try {
            const clipboardText = await navigator.clipboard.readText();
            
            // First try the original method for formatted code blocks
            let codeBlocks = this.extractCodeFromText(clipboardText);
            
            // If no formatted blocks found, try to detect raw code
            if (codeBlocks.length === 0) {
                const rawCode = this.detectRawCode(clipboardText);
                if (rawCode) {
                    codeBlocks = [rawCode];
                }
            }
            
            if (codeBlocks.length === 0) {
                alert('No code found in clipboard.\n\nTip: Copy code with ```blocks``` or use Click Extract mode for AI chat.');
                return;
            }
            
            if (codeBlocks.length === 1) {
                this.importCodeBlock(codeBlocks[0]);
            } else {
                this.showCodeBlockSelector(codeBlocks);
            }
            
            // Update status
            const statusEl = document.getElementById(`integrationStatus-${this.windowId}`);
            if (statusEl) statusEl.textContent = '✅ Code imported successfully';
            
        } catch (error) {
            console.error('Enhanced smart import failed:', error);
            alert('Failed to read clipboard. Try Click Extract mode instead.');
        }
    }
    
    /**
     * Detect raw code in clipboard text
     */
    detectRawCode(text) {
        const trimmedText = text.trim();
        
        // Skip if it's too short or too long
        if (trimmedText.length < 5 || trimmedText.length > 5000) {
            return null;
        }
        
        // JavaScript detection patterns
        const jsPatterns = [
            /^(function|const|let|var|class|if|for|while|switch)\s/,
            /console\.(log|error|warn)/,
            /alert\s*\(/,
            /document\./,
            /window\./,
            /=>\s*{/,
            /\.then\s*\(/
        ];
        
        // Python detection patterns
        const pythonPatterns = [
            /^(def|class|if|for|while|import|from)\s/,
            /print\s*\(/,
            /:\s*$/m,
            /__name__/
        ];
        
        // HTML detection patterns
        const htmlPatterns = [
            /^<(!DOCTYPE|html|head|body|div|span|p|h[1-6])/i,
            /<\/\w+>/
        ];
        
        // CSS detection patterns
        const cssPatterns = [
            /^[.#]?\w+\s*{/m,
            /:\s*[^;]+;/,
            /@media/,
            /background|color|font|margin|padding/
        ];
        
        // Determine language
        let language = 'text';
        if (jsPatterns.some(pattern => pattern.test(trimmedText))) {
            language = 'javascript';
        } else if (pythonPatterns.some(pattern => pattern.test(trimmedText))) {
            language = 'python';
        } else if (htmlPatterns.some(pattern => pattern.test(trimmedText))) {
            language = 'html';
        } else if (cssPatterns.some(pattern => pattern.test(trimmedText))) {
            language = 'css';
        }
        
        // Only return if we detected a programming language
        if (language !== 'text') {
            return {
                language: language,
                code: trimmedText,
                fullMatch: trimmedText
            };
        }
        
        return null;
    }
    
    /**
     * Toggle click extract mode
     */
    toggleClickExtractMode() {
        this.clickExtractMode = !this.clickExtractMode;
        
        const button = document.getElementById(`clickExtract-${this.windowId}`);
        const status = document.getElementById(`extractStatus-${this.windowId}`);
        
        if (this.clickExtractMode) {
            button.style.background = 'var(--nebula-success)';
            button.textContent = '🎯 Extract Active';
            status.style.display = 'block';
            
            // Inject click detection into webview
            this.injectClickExtractor();
            
            alert('Click Extract Mode Activated!\n\nNow click on any code block in the AI chat to extract it.');
        } else {
            button.style.background = 'var(--nebula-info)';
            button.textContent = '🎯 Click Extract';
            status.style.display = 'none';
            
            // Remove click detection
            this.removeClickExtractor();
        }
    }
    
    /**
     * Inject click extractor into webview
     */
    injectClickExtractor() {
        if (!this.webview) return;
        
        const extractorScript = `
            (function() {
                // Remove any existing extractors
                const existingStyle = document.getElementById('nebula-extractor-style');
                if (existingStyle) existingStyle.remove();
                
                // Add styles for highlighting
                const style = document.createElement('style');
                style.id = 'nebula-extractor-style';
                style.textContent = \`
                    .nebula-extractable {
                        outline: 2px dashed #4CAF50 !important;
                        cursor: pointer !important;
                        position: relative !important;
                    }
                    .nebula-extractable:hover {
                        background-color: rgba(76, 175, 80, 0.1) !important;
                    }
                    .nebula-extractable:before {
                        content: "📥 Click to extract";
                        position: absolute;
                        top: -25px;
                        left: 0;
                        background: #4CAF50;
                        color: white;
                        padding: 2px 6px;
                        font-size: 10px;
                        border-radius: 3px;
                        z-index: 10000;
                        pointer-events: none;
                    }
                \`;
                document.head.appendChild(style);
                
                // Find potential code elements
                const codeSelectors = [
                    'code', 'pre', '.highlight', '.code-block', 
                    '[class*="code"]', '[class*="highlight"]',
                    'div[data-message-author-role] div:has(code)',
                    '.markdown-content code', '.markdown-content pre'
                ];
                
                window.nebulaExtractHandler = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const code = this.textContent.trim();
                    
                    // Send extracted code back to main app
                    try {
                        window.parent.postMessage({
                            type: 'nebulaExtract',
                            code: code,
                            element: this.tagName.toLowerCase()
                        }, '*');
                    } catch (err) {
                        console.log('PostMessage failed, trying alternative method');
                        // Alternative: add to global variable
                        window.nebulaExtractedCode = {
                            code: code,
                            element: this.tagName.toLowerCase(),
                            timestamp: Date.now()
                        };
                    }
                    
                    // Visual feedback
                    this.style.background = '#4CAF50';
                    this.style.color = 'white';
                    setTimeout(() => {
                        this.style.background = '';
                        this.style.color = '';
                    }, 500);
                };
                
                codeSelectors.forEach(selector => {
                    try {
                        const elements = document.querySelectorAll(selector);
                        elements.forEach(el => {
                            // Skip if already processed or too small
                            if (el.classList.contains('nebula-extractable') || el.textContent.trim().length < 3) {
                                return;
                            }
                            
                            el.classList.add('nebula-extractable');
                            el.addEventListener('click', window.nebulaExtractHandler);
                        });
                    } catch (e) {
                        console.log('Selector failed:', selector, e);
                    }
                });
                
                // Listen for dynamic content changes
                const observer = new MutationObserver(function(mutations) {
                    mutations.forEach(function(mutation) {
                        if (mutation.addedNodes.length > 0) {
                            setTimeout(() => {
                                codeSelectors.forEach(selector => {
                                    try {
                                        const newElements = document.querySelectorAll(selector + ':not(.nebula-extractable)');
                                        newElements.forEach(el => {
                                            if (el.textContent.trim().length >= 3) {
                                                el.classList.add('nebula-extractable');
                                                el.addEventListener('click', window.nebulaExtractHandler);
                                            }
                                        });
                                    } catch (e) {
                                        console.log('Dynamic selector failed:', selector, e);
                                    }
                                });
                            }, 500);
                        }
                    });
                });
                
                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });
                
                console.log('Nebula Click Extractor activated');
            })();
        `;
        
        // Execute the script in the webview
        try {
            this.webview.executeJavaScript(extractorScript);
            
            // Listen for extraction events via postMessage
            window.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'nebulaExtract') {
                    this.handleExtractedCode(event.data);
                }
            });
            
            // Also check for global variable as fallback
            this.checkForExtractedCode();
            
        } catch (error) {
            console.error('Failed to inject click extractor:', error);
            alert('Failed to activate Click Extract mode. The AI website may not allow script injection.');
        }
    }
    
    /**
     * Check for extracted code via global variable (fallback method)
     */
    checkForExtractedCode() {
        if (!this.clickExtractMode) return;
        
        try {
            this.webview.executeJavaScript('window.nebulaExtractedCode')
                .then(result => {
                    if (result && result.timestamp) {
                        // Check if this is new data
                        if (!this.lastExtractTimestamp || result.timestamp > this.lastExtractTimestamp) {
                            this.lastExtractTimestamp = result.timestamp;
                            this.handleExtractedCode(result);
                            
                            // Clear the global variable
                            this.webview.executeJavaScript('window.nebulaExtractedCode = null');
                        }
                    }
                })
                .catch(err => {
                    // Silent fail - normal for webview security
                });
        } catch (error) {
            // Silent fail
        }
        
        // Continue checking if extract mode is still active
        if (this.clickExtractMode) {
            setTimeout(() => this.checkForExtractedCode(), 1000);
        }
    }
    
    /**
     * Remove click extractor from webview
     */
    removeClickExtractor() {
        if (!this.webview) return;
        
        const removalScript = `
            (function() {
                // Remove styles
                const style = document.getElementById('nebula-extractor-style');
                if (style) style.remove();
                
                // Remove classes and event listeners
                const extractables = document.querySelectorAll('.nebula-extractable');
                extractables.forEach(el => {
                    el.classList.remove('nebula-extractable');
                    if (window.nebulaExtractHandler) {
                        el.removeEventListener('click', window.nebulaExtractHandler);
                    }
                });
                
                // Clean up global handler
                window.nebulaExtractHandler = null;
                window.nebulaExtractedCode = null;
                
                console.log('Nebula Click Extractor deactivated');
            })();
        `;
        
        try {
            this.webview.executeJavaScript(removalScript);
        } catch (error) {
            console.error('Failed to remove click extractor:', error);
        }
    }
    
    /**
     * Handle extracted code from click
     */
    handleExtractedCode(data) {
        const code = data.code;
        const element = data.element;
        
        // Try to detect language
        const detectedCode = this.detectRawCode(code) || {
            language: element === 'pre' ? 'text' : this.currentLanguage,
            code: code,
            fullMatch: code
        };
        
        // Import the extracted code
        this.importCodeBlock(detectedCode);
        
        // Turn off extract mode
        this.toggleClickExtractMode();
        
        // Show success message
        alert(`✅ Code extracted successfully!\n\nExtracted ${code.length} characters from ${element} element.`);
    }
    
    /**
     * Extract code blocks from AI response text
     */
    extractCodeFromText(text) {
        const codeBlocks = [];
        
        // Extract code blocks marked with ```
        const codeBlockRegex = /```(\w+)?\s*\n([\s\S]*?)\n```/g;
        let match;
        
        while ((match = codeBlockRegex.exec(text)) !== null) {
            codeBlocks.push({
                language: match[1] || 'text',
                code: match[2].trim(),
                fullMatch: match[0]
            });
        }
        
        // Extract inline code with `backticks` (only longer snippets)
        const inlineCodeRegex = /`([^`\n]{15,})`/g;
        while ((match = inlineCodeRegex.exec(text)) !== null) {
            codeBlocks.push({
                language: 'inline',
                code: match[1].trim(),
                fullMatch: match[0]
            });
        }
        
        return codeBlocks;
    }
    
    /**
     * Show code block selection dialog
     */
    showCodeBlockSelector(codeBlocks) {
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--nebula-surface);
            border: 1px solid var(--nebula-border);
            border-radius: var(--nebula-radius-lg);
            padding: 24px;
            max-width: 700px;
            max-height: 80vh;
            overflow-y: auto;
            z-index: 1000;
            box-shadow: var(--nebula-shadow-lg);
            font-family: var(--nebula-font-family);
        `;
        
        dialog.innerHTML = `
            <h3 style="margin: 0 0 16px 0; color: var(--nebula-text-primary);">📥 Select Code to Import</h3>
            <p style="margin: 0 0 16px 0; color: var(--nebula-text-secondary); font-size: 14px;">
                Found ${codeBlocks.length} code block(s) in the AI response. Choose which one to import:
            </p>
            
            <div class="code-blocks-list">
                ${codeBlocks.map((block, index) => `
                    <div class="code-block-item" style="
                        margin-bottom: 16px;
                        border: 1px solid var(--nebula-border);
                        border-radius: var(--nebula-radius-md);
                        overflow: hidden;
                        background: var(--nebula-bg-primary);
                    ">
                        <div style="
                            background: var(--nebula-bg-secondary);
                            padding: 8px 12px;
                            border-bottom: 1px solid var(--nebula-border);
                            font-size: 12px;
                            color: var(--nebula-text-secondary);
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                        ">
                            <span>
                                <strong>${block.language}</strong> 
                                (${block.code.split('\n').length} lines, ${block.code.length} chars)
                            </span>
                            <button class="import-btn" data-index="${index}" style="
                                background: var(--nebula-primary);
                                color: white;
                                border: none;
                                padding: 4px 12px;
                                border-radius: var(--nebula-radius-sm);
                                cursor: pointer;
                                font-size: 11px;
                                font-weight: 500;
                            ">Import This</button>
                        </div>
                        <pre style="
                            margin: 0;
                            padding: 12px;
                            background: var(--nebula-bg-primary);
                            color: var(--nebula-text-primary);
                            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
                            font-size: 12px;
                            max-height: 200px;
                            overflow-y: auto;
                            white-space: pre-wrap;
                            line-height: 1.4;
                        ">${this.escapeHtml(block.code)}</pre>
                    </div>
                `).join('')}
            </div>
            
            <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 20px;
                padding-top: 16px;
                border-top: 1px solid var(--nebula-border);
            ">
                <div style="color: var(--nebula-text-secondary); font-size: 12px;">
                    💡 Tip: Use different import modes to control how code is added
                </div>
                <div style="display: flex; gap: 8px;">
                    <button id="cancelImport" style="
                        background: var(--nebula-surface);
                        border: 1px solid var(--nebula-border);
                        color: var(--nebula-text-primary);
                        padding: 8px 16px;
                        border-radius: var(--nebula-radius-md);
                        cursor: pointer;
                        font-size: 13px;
                    ">Cancel</button>
                    <button id="importAll" style="
                        background: var(--nebula-success);
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: var(--nebula-radius-md);
                        cursor: pointer;
                        font-size: 13px;
                        font-weight: 500;
                    ">Import All</button>
                </div>
            </div>
        `;
        
        // Add backdrop
        const backdrop = document.createElement('div');
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 999;
            backdrop-filter: blur(2px);
        `;
        
        document.body.appendChild(backdrop);
        document.body.appendChild(dialog);
        
        // Event listeners
        dialog.querySelectorAll('.import-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                this.importCodeBlock(codeBlocks[index]);
                this.closeDialog(dialog, backdrop);
            });
        });
        
        dialog.querySelector('#cancelImport').addEventListener('click', () => {
            this.closeDialog(dialog, backdrop);
        });
        
        dialog.querySelector('#importAll').addEventListener('click', () => {
            const combinedCode = codeBlocks.map((block, i) => 
                `// Code Block ${i + 1} (${block.language})\n${block.code}`
            ).join('\n\n');
            this.appendToEditor('\n\n' + combinedCode);
            this.closeDialog(dialog, backdrop);
            alert(`Imported all ${codeBlocks.length} code blocks!`);
        });
        
        backdrop.addEventListener('click', () => {
            this.closeDialog(dialog, backdrop);
        });
    }
    
    /**
     * Import a specific code block with different modes
     */
    importCodeBlock(codeBlock) {
        if (!this.monacoEditor) {
            alert('Monaco Editor not available!');
            return;
        }
        
        const modes = [
            { id: 'replace', name: 'Replace all content', icon: '🔄' },
            { id: 'append', name: 'Append to end', icon: '➕' },
            { id: 'cursor', name: 'Insert at cursor', icon: '📍' },
            { id: 'diff', name: 'Show diff preview', icon: '🔍' }
        ];
        
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--nebula-surface);
            border: 1px solid var(--nebula-border);
            border-radius: var(--nebula-radius-lg);
            padding: 20px;
            z-index: 1001;
            box-shadow: var(--nebula-shadow-lg);
            min-width: 400px;
        `;
        
        dialog.innerHTML = `
            <h3 style="margin: 0 0 16px 0; color: var(--nebula-text-primary);">📥 Import Mode</h3>
            <p style="margin: 0 0 16px 0; color: var(--nebula-text-secondary); font-size: 14px;">
                How would you like to import this ${codeBlock.language} code?
            </p>
            
            <div class="import-modes" style="margin-bottom: 20px;">
                ${modes.map(mode => `
                    <button class="mode-btn" data-mode="${mode.id}" style="
                        display: block;
                        width: 100%;
                        padding: 12px;
                        margin-bottom: 8px;
                        border: 1px solid var(--nebula-border);
                        border-radius: var(--nebula-radius-md);
                        background: var(--nebula-bg-primary);
                        color: var(--nebula-text-primary);
                        cursor: pointer;
                        text-align: left;
                        transition: all 0.2s ease;
                    ">
                        <span style="font-size: 16px; margin-right: 8px;">${mode.icon}</span>
                        <strong>${mode.name}</strong>
                    </button>
                `).join('')}
            </div>
            
            <div style="text-align: right;">
                <button id="cancelModeSelection" style="
                    background: var(--nebula-surface);
                    border: 1px solid var(--nebula-border);
                    color: var(--nebula-text-primary);
                    padding: 8px 16px;
                    border-radius: var(--nebula-radius-md);
                    cursor: pointer;
                ">Cancel</button>
            </div>
        `;
        
        // Add backdrop
        const backdrop = document.createElement('div');
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.3);
            z-index: 1000;
        `;
        
        document.body.appendChild(backdrop);
        document.body.appendChild(dialog);
        
        // Mode selection handlers
        dialog.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                btn.style.background = 'var(--nebula-primary)';
                btn.style.color = 'white';
            });
            
            btn.addEventListener('mouseleave', () => {
                btn.style.background = 'var(--nebula-bg-primary)';
                btn.style.color = 'var(--nebula-text-primary)';
            });
            
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                this.executeImportMode(mode, codeBlock);
                this.closeDialog(dialog, backdrop);
            });
        });
        
        dialog.querySelector('#cancelModeSelection').addEventListener('click', () => {
            this.closeDialog(dialog, backdrop);
        });
        
        backdrop.addEventListener('click', () => {
            this.closeDialog(dialog, backdrop);
        });
    }
    
    /**
     * Execute the selected import mode
     */
    executeImportMode(mode, codeBlock) {
        switch (mode) {
            case 'replace':
                this.monacoEditor.setValue(codeBlock.code);
                break;
            case 'append':
                this.appendToEditor('\n\n' + codeBlock.code);
                break;
            case 'cursor':
                this.insertAtCursor(codeBlock.code);
                break;
            case 'diff':
                this.showDiffPreview(codeBlock.code);
                return; // Don't update language for diff preview
        }
        
        // Update language if it matches and is not inline
        if (codeBlock.language && codeBlock.language !== 'inline' && codeBlock.language !== 'text') {
            this.switchLanguage(codeBlock.language);
            const languageSelect = document.getElementById(`languageSelect-${this.windowId}`);
            if (languageSelect) languageSelect.value = codeBlock.language;
        }
        
        alert(`✅ Code imported successfully!\n${codeBlock.code.split('\n').length} lines added using ${mode} mode.`);
    }
    
    /**
     * Debug with terminal integration
     */
    async debugWithTerminal() {
        if (!this.monacoEditor) {
            alert('No code editor available.');
            return;
        }
        
        const code = this.monacoEditor.getValue();
        if (!code.trim()) {
            alert('No code to debug. Write some code first.');
            return;
        }
        
        // Check if it's JavaScript
        if (this.currentLanguage !== 'javascript') {
            const convert = confirm(`Current language is ${this.currentLanguage}.\nDebug as JavaScript?`);
            if (!convert) return;
        }
        
        try {
            // Format code for terminal
            const terminalCode = this.formatCodeForTerminal(code);
            const command = `js ${terminalCode}`;
            
            // Copy to clipboard as fallback
            await navigator.clipboard.writeText(command);
            
            // Try to execute in terminal if available
            if (window.NebulaTerminal) {
                // Open new terminal or use existing
                const terminal = new NebulaTerminal();
                alert('Terminal opened! The debug command is in your clipboard.\nPaste it in the terminal to execute.');
            } else {
                alert('Debug command copied to clipboard!\nOpen terminal and paste to execute:\n\n' + command);
            }
            
            // Update status
            const statusEl = document.getElementById(`integrationStatus-${this.windowId}`);
            if (statusEl) statusEl.textContent = '🐛 Ready to debug in terminal';
            
        } catch (error) {
            console.error('Debug failed:', error);
            alert('Failed to prepare debug command.');
        }
    }
    
    /**
     * Format code for terminal execution
     */
    formatCodeForTerminal(code) {
        // For JavaScript, create a compact single-line version
        if (this.currentLanguage === 'javascript') {
            return code
                .split('\n')
                .map(line => line.trim())
                .filter(line => line && !line.startsWith('//') && !line.startsWith('/*'))
                .join('; ')
                .replace(/;\s*;/g, ';')
                .replace(/;$/, ''); // Remove trailing semicolon
        }
        
        // For other languages, just return as-is (user will need to handle appropriately)
        return code;
    }
    
    /**
     * Helper methods for editor manipulation
     */
    appendToEditor(text) {
        if (!this.monacoEditor) return;
        const currentValue = this.monacoEditor.getValue();
        this.monacoEditor.setValue(currentValue + text);
    }
    
    insertAtCursor(text) {
        if (!this.monacoEditor) return;
        
        if (this.monacoEditor.getSelection) {
            const selection = this.monacoEditor.getSelection();
            const id = { major: 1, minor: 1 };
            const op = { identifier: id, range: selection, text: text, forceMoveMarkers: true };
            this.monacoEditor.executeEdits('insert-code', [op]);
        } else {
            // Fallback for simple editor
            this.appendToEditor('\n' + text);
        }
    }
    
    showDiffPreview(newCode) {
        const currentCode = this.monacoEditor.getValue();
        
        // Create a simple diff dialog
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--nebula-surface);
            border: 1px solid var(--nebula-border);
            border-radius: var(--nebula-radius-lg);
            padding: 20px;
            max-width: 80vw;
            max-height: 80vh;
            z-index: 1001;
            box-shadow: var(--nebula-shadow-lg);
            overflow-y: auto;
        `;
        
        dialog.innerHTML = `
            <h3 style="margin: 0 0 16px 0; color: var(--nebula-text-primary);">🔍 Diff Preview</h3>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                <div>
                    <h4 style="margin: 0 0 8px 0; color: var(--nebula-text-secondary);">Current Code:</h4>
                    <pre style="
                        background: var(--nebula-bg-primary);
                        border: 1px solid var(--nebula-border);
                        border-radius: var(--nebula-radius-md);
                        padding: 12px;
                        max-height: 300px;
                        overflow-y: auto;
                        font-family: 'Consolas', monospace;
                        font-size: 12px;
                        line-height: 1.4;
                        color: var(--nebula-text-primary);
                    ">${this.escapeHtml(currentCode)}</pre>
                </div>
                
                <div>
                    <h4 style="margin: 0 0 8px 0; color: var(--nebula-text-secondary);">New Code:</h4>
                    <pre style="
                        background: var(--nebula-bg-primary);
                        border: 1px solid var(--nebula-border);
                        border-radius: var(--nebula-radius-md);
                        padding: 12px;
                        max-height: 300px;
                        overflow-y: auto;
                        font-family: 'Consolas', monospace;
                        font-size: 12px;
                        line-height: 1.4;
                        color: var(--nebula-text-primary);
                    ">${this.escapeHtml(newCode)}</pre>
                </div>
            </div>
            
            <div style="text-align: right;">
                <button id="rejectDiff" style="
                    background: var(--nebula-danger);
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: var(--nebula-radius-md);
                    cursor: pointer;
                    margin-right: 8px;
                ">❌ Keep Current</button>
                <button id="acceptDiff" style="
                    background: var(--nebula-success);
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: var(--nebula-radius-md);
                    cursor: pointer;
                ">✅ Apply New Code</button>
            </div>
        `;
        
        // Add backdrop
        const backdrop = document.createElement('div');
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1000;
        `;
        
        document.body.appendChild(backdrop);
        document.body.appendChild(dialog);
        
        // Event handlers
        dialog.querySelector('#acceptDiff').addEventListener('click', () => {
            this.monacoEditor.setValue(newCode);
            this.closeDialog(dialog, backdrop);
            alert('✅ New code applied successfully!');
        });
        
        dialog.querySelector('#rejectDiff').addEventListener('click', () => {
            this.closeDialog(dialog, backdrop);
            alert('❌ Changes discarded - keeping current code.');
        });
        
        backdrop.addEventListener('click', () => {
            this.closeDialog(dialog, backdrop);
        });
    }
    
    /**
     * Utility methods
     */
    closeDialog(dialog, backdrop) {
        if (dialog && dialog.parentNode) {
            document.body.removeChild(dialog);
        }
        if (backdrop && backdrop.parentNode) {
            document.body.removeChild(backdrop);
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Enhanced AI prompt generators
     */
    explainCode() {
        if (!this.monacoEditor) return;
        
        const code = this.monacoEditor.getValue();
        if (!code.trim()) {
            alert('Please enter some code first!');
            return;
        }
        
        const prompt = `Please explain this ${this.currentLanguage} code in detail:\n\n\`\`\`${this.currentLanguage}\n${code}\n\`\`\`\n\nPlease explain:\n1. What this code does\n2. How it works\n3. Any potential improvements\n4. Best practices used or missing`;
        
        navigator.clipboard.writeText(prompt);
        alert('📋 Code explanation prompt copied to clipboard!\nPaste it into the AI chat on the right.');
    }
    
    optimizeCode() {
        if (!this.monacoEditor) return;
        
        const code = this.monacoEditor.getValue();
        if (!code.trim()) {
            alert('Please enter some code first!');
            return;
        }
        
        const prompt = `Please optimize this ${this.currentLanguage} code for better performance, readability, and best practices:\n\n\`\`\`${this.currentLanguage}\n${code}\n\`\`\`\n\nPlease provide:\n1. Optimized version with improvements\n2. Explanation of changes made\n3. Performance benefits\n4. Any additional recommendations`;
        
        navigator.clipboard.writeText(prompt);
        alert('📋 Code optimization prompt copied to clipboard!\nPaste it into the AI chat on the right.');
    }
    
    addComments() {
        if (!this.monacoEditor) return;
        
        const code = this.monacoEditor.getValue();
        if (!code.trim()) {
            alert('Please enter some code first!');
            return;
        }
        
        const prompt = `Please add comprehensive comments to this ${this.currentLanguage} code:\n\n\`\`\`${this.currentLanguage}\n${code}\n\`\`\`\n\nPlease add:\n1. Function/method documentation\n2. Inline comments for complex logic\n3. Variable explanations where needed\n4. Overall code structure comments`;
        
        navigator.clipboard.writeText(prompt);
        alert('📋 Add comments prompt copied to clipboard!\nPaste it into the AI chat on the right.');
    }
    
    generateTests() {
        if (!this.monacoEditor) return;
        
        const code = this.monacoEditor.getValue();
        if (!code.trim()) {
            alert('Please enter some code first!');
            return;
        }
        
        const prompt = `Please generate comprehensive unit tests for this ${this.currentLanguage} code:\n\n\`\`\`${this.currentLanguage}\n${code}\n\`\`\`\n\nPlease create:\n1. Test cases for normal operation\n2. Edge case tests\n3. Error handling tests\n4. Performance tests if applicable\n5. Use appropriate testing framework for ${this.currentLanguage}`;
        
        navigator.clipboard.writeText(prompt);
        alert('📋 Generate tests prompt copied to clipboard!\nPaste it into the AI chat on the right.');
    }
    
    /**
     * File operations
     */
    newFile() {
        if (this.monacoEditor) {
            const currentCode = this.monacoEditor.getValue();
            if (currentCode.trim() && !confirm('Create new file? Current code will be lost.')) {
                return;
            }
            this.monacoEditor.setValue(this.getWelcomeCode());
        }
        console.log('New file created');
    }
    
    saveProject() {
        if (!this.monacoEditor) return;
        
        const code = this.monacoEditor.getValue();
        if (!code.trim()) {
            alert('No code to save!');
            return;
        }
        
        const projectName = prompt('Enter project name:', `${this.currentLanguage}-project-${Date.now()}`);
        if (!projectName) return;
        
        const project = {
            id: Date.now(),
            name: projectName,
            language: this.currentLanguage,
            code: code,
            timestamp: new Date().toLocaleString(),
            lines: code.split('\n').length,
            characters: code.length
        };
        
        this.savedProjects.unshift(project);
        
        try {
            localStorage.setItem('nebula-code-projects', JSON.stringify(this.savedProjects));
            alert(`Project "${projectName}" saved successfully!`);
        } catch (e) {
            console.warn('Could not save to localStorage:', e);
            alert('Failed to save project');
        }
    }
    
    showProjectsList() {
        try {
            const saved = localStorage.getItem('nebula-code-projects');
            if (saved) {
                this.savedProjects = JSON.parse(saved);
            }
        } catch (e) {
            console.warn('Could not load from localStorage:', e);
        }
        
        if (this.savedProjects.length === 0) {
            alert('No saved projects found.');
            return;
        }
        
        const projectsList = this.savedProjects.map((project, index) => 
            `${index + 1}. ${project.name} (${project.language}) - ${project.timestamp}`
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
     * Additional methods
     */
    formatCode() {
        if (this.monacoEditor && window.monaco) {
            this.monacoEditor.getAction('editor.action.formatDocument').run();
            console.log('Code formatted');
        } else {
            alert('Code formatting requires Monaco Editor to be loaded.');
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
            alert('No code to save!');
            return;
        }
        
        // Create a downloadable file
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nebula-code-${Date.now()}.${this.getFileExtension()}`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    getFileExtension() {
        const extensions = {
            javascript: 'js',
            typescript: 'ts',
            python: 'py',
            html: 'html',
            css: 'css',
            json: 'json',
            markdown: 'md',
            java: 'java',
            cpp: 'cpp',
            csharp: 'cs'
        };
        return extensions[this.currentLanguage] || 'txt';
    }
    
    refreshWebview() {
        if (this.webview) {
            this.showLoading();
            this.webview.reload();
        }
    }
    
    startNewChat() {
        if (this.webview) {
            // Navigate to new chat or refresh
            const currentService = this.aiServices[this.currentAIService];
            this.webview.src = currentService.url;
        }
    }
    
    getTitle() {
        return 'Code Assistant';
    }
    
    getIcon() {
        return '💻';
    }
    
    cleanup() {
        this.clickExtractMode = false;
        if (this.monacoEditor) {
            this.monacoEditor.dispose();
            this.monacoEditor = null;
        }
        if (this.webview) {
            this.webview.remove();
            this.webview = null;
        }
        console.log('Code Assistant cleanup completed');
    }
}

// Export for use in other files
window.NebulaCodeAssistant = NebulaCodeAssistant;