// Enhanced Code Assistant with LM Studio Integration
// Adds direct API communication + file modification capabilities
class NebulaCodeAssistant {
    constructor() {
        this.windowId = null;
        this.monacoEditor = null;
        this.currentLanguage = 'javascript';
        this.currentAIService = 'lmstudio'; // Default to LM Studio
        this.webview = null;
        this.outputVisible = false;
        this.currentFilePath = null;
        this.hasUnsavedChanges = false;
        
        // LM Studio Configuration
        this.lmStudioConfig = {
            baseUrl: 'http://localhost:1234', // Default LM Studio server
            model: 'local-model', // Will be detected automatically
            temperature: 0.7,
            maxTokens: 2048,
            stream: true
        };
        
        // laptop LM Studio IP Address - ip route | grep default | grep -oE '[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}' | head -1
// 192.168.1.254

        // AI Services - Enhanced with LM Studio
        this.aiServices = {
            lmstudio: { 
                name: 'LM Studio (Local)', 
                url: 'http://localhost:1234', 
                icon: '🏠',
                type: 'api' // NEW: Distinguish API vs webview services
            },
            claude: { name: 'Claude', url: 'https://claude.ai', icon: '🧠', type: 'webview' },
            chatgpt: { name: 'ChatGPT', url: 'https://chat.openai.com', icon: '💬', type: 'webview' },
            manus: { name: 'Manus', url: 'https://manus.im', icon: '🤖', type: 'webview' },
            perplexity: { name: 'Perplexity', url: 'https://perplexity.ai', icon: '🔍', type: 'webview' },
            copilot: { name: 'Copilot', url: 'https://copilot.microsoft.com', icon: '🚀', type: 'webview' },
            gemini: { name: 'Gemini', url: 'https://gemini.google.com', icon: '💎', type: 'webview' },
            bolt: { name: 'Bolt', url: 'https://bolt.new', icon: '⚡', type: 'webview' }
        };
        
        // Available templates
        this.templates = {
            'single-app': {
                name: 'Single Window App',
                description: 'Simple focused application template',
                path: '../Templates/NebulaApp-Single.js'
            },
            'tabbed-app': {
                name: 'Tabbed Window App', 
                description: 'Multi-tab application template',
                path: '../Templates/NebulaApp-Tabbed.js'
            }
        };
        
        this.init();
    }
    
    async init() {
        if (!window.windowManager) {
            console.error('WindowManager not available');
            return;
        }
        
        this.windowId = window.windowManager.createWindow({
            title: '🏠 Code Assistant Pro - LM Studio',
            width: 1400,
            height: 900,
            resizable: true,
            maximizable: true,
            minimizable: true
        });
        
        window.windowManager.loadApp(this.windowId, this);
        
        // Initialize LM Studio connection
        await this.initializeLMStudio();
        
        console.log(`Code Assistant initialized with window ${this.windowId}`);
    }
    
    // NEW: Initialize LM Studio connection
    async initializeLMStudio() {
        try {
            // Test LM Studio connection
            const response = await fetch(`${this.lmStudioConfig.baseUrl}/v1/models`);
            if (response.ok) {
                const models = await response.json();
                if (models.data && models.data.length > 0) {
                    this.lmStudioConfig.model = models.data[0].id; // Use first available model
                    console.log('✅ LM Studio connected:', models.data[0].id);
                    this.updateLMStudioStatus('Connected', true);
                } else {
                    throw new Error('No models available');
                }
            } else {
                throw new Error(`Server responded with ${response.status}`);
            }
        } catch (error) {
            console.warn('⚠️ LM Studio not available:', error.message);
            this.updateLMStudioStatus('Disconnected', false);
        }
    }
    
    // NEW: Update LM Studio connection status in UI
    updateLMStudioStatus(status, connected) {
        const statusElement = document.getElementById(`lmStudioStatus-${this.windowId}`);
        if (statusElement) {
            statusElement.textContent = status;
            statusElement.style.color = connected ? '#4ade80' : '#ef4444';
        }
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
        
        // Left side - Monaco Editor + Controls (existing)
        const editorSide = this.createEditorSide();
        
        // Right side - ENHANCED AI Chat with LM Studio integration
        const chatSide = this.createEnhancedChatSide();
        
        container.appendChild(editorSide);
        container.appendChild(chatSide);
        
        // Setup after DOM is ready
        setTimeout(() => {
            this.setupEventListeners();
            this.initializeMonaco();
            this.createChatInterface(); // NEW: Dynamic chat interface
            this.updateWindowTitle();
        }, 0);
        
        return container;
    }
    
    // Keep existing createEditorSide method (unchanged)
    createEditorSide() {
        // ... (same as your existing implementation)
        // Copy the exact same method from your original code
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
            
            <button id="openFileBtn-${this.windowId}" class="toolbar-btn" title="Open File (Ctrl+O)">
                <span class="material-symbols-outlined">folder_open</span>
            </button>
            
            <button id="saveBtn-${this.windowId}" class="toolbar-btn" title="Save File (Ctrl+S)">
                <span class="material-symbols-outlined">save</span>
            </button>
            
            <div class="toolbar-separator" style="width: 1px; height: 20px; background: var(--nebula-border); margin: 0 4px;"></div>
            
            <!-- JS Execution Controls -->
            <button id="runBtn-${this.windowId}" class="toolbar-btn run-btn" title="Run JavaScript (F5)" style="
                background: var(--nebula-success);
                color: white;
                font-weight: 600;
            ">
                <span class="material-symbols-outlined">play_arrow</span>
                <span>Run</span>
            </button>
            
            <button id="toggleOutputBtn-${this.windowId}" class="toolbar-btn" title="Toggle Output Panel">
                <span class="material-symbols-outlined">terminal</span>
            </button>
        `;
        
        // Editor Container with Output Panel (same as existing)
        const editorContainer = document.createElement('div');
        editorContainer.style.cssText = `
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 0;
        `;
        
        const monacoContainer = document.createElement('div');
        monacoContainer.id = `monacoEditor-${this.windowId}`;
        monacoContainer.style.cssText = `
            flex: 1;
            min-height: 0;
        `;
        
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
        editorSide.appendChild(editorContainer);
        
        return editorSide;
    }
    
    // NEW: Enhanced chat side with LM Studio integration
    createEnhancedChatSide() {
        const chatSide = document.createElement('div');
        chatSide.className = 'code-chat-side';
        chatSide.style.cssText = `
            width: 400px;
            display: flex;
            flex-direction: column;
            background: var(--nebula-surface);
        `;
        
        // Enhanced AI Service Selector with LM Studio status
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
                
                <!-- NEW: LM Studio Status -->
                <div style="margin-top: 8px; font-size: 11px; display: flex; align-items: center; gap: 8px;">
                    <span style="color: var(--nebula-text-secondary);">LM Studio:</span>
                    <span id="lmStudioStatus-${this.windowId}" style="font-weight: 600;">Checking...</span>
                    <button id="reconnectLMBtn-${this.windowId}" style="
                        background: none;
                        border: 1px solid var(--nebula-border);
                        color: var(--nebula-text-secondary);
                        padding: 2px 6px;
                        border-radius: 3px;
                        font-size: 10px;
                        cursor: pointer;
                    ">Reconnect</button>
                </div>
            </div>
            
            <!-- Enhanced AI Actions with direct API support -->
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
                <button id="refactorBtn-${this.windowId}" class="ai-action-btn">
                    🔧 Refactor
                </button>
                <!-- NEW: File modification actions -->
                <button id="createFileBtn-${this.windowId}" class="ai-action-btn" style="background: var(--nebula-primary); color: white;">
                    📄 Create File
                </button>
                <button id="modifyFileBtn-${this.windowId}" class="ai-action-btn" style="background: var(--nebula-secondary); color: white;">
                    ✏️ Modify File
                </button>
            </div>
        `;
        
        // Chat Container - Dynamic based on service type
        const chatContainer = document.createElement('div');
        chatContainer.id = `chatContainer-${this.windowId}`;
        chatContainer.style.cssText = `
            flex: 1;
            position: relative;
            background: var(--nebula-bg-primary);
        `;
        
        chatSide.appendChild(chatHeader);
        chatSide.appendChild(chatContainer);
        
        return chatSide;
    }
    
    // NEW: Create dynamic chat interface based on service type
    createChatInterface() {
        const service = this.aiServices[this.currentAIService];
        const container = document.getElementById(`chatContainer-${this.windowId}`);
        if (!container) return;
        
        if (service.type === 'api') {
            this.createAPIChat(container);
        } else {
            this.createWebviewChat(container);
        }
    }
    
    // NEW: Create API-based chat (for LM Studio)
    createAPIChat(container) {
        container.innerHTML = `
            <!-- Chat Messages -->
            <div id="chatMessages-${this.windowId}" style="
                flex: 1;
                padding: 16px;
                overflow-y: auto;
                height: calc(100% - 120px);
                background: var(--nebula-bg-primary);
            ">
                <div class="welcome-message" style="
                    text-align: center;
                    color: var(--nebula-text-secondary);
                    padding: 20px;
                    border: 1px dashed var(--nebula-border);
                    border-radius: var(--nebula-radius-md);
                    background: var(--nebula-surface);
                    margin-bottom: 16px;
                ">
                    <div style="font-size: 24px; margin-bottom: 8px;">🏠</div>
                    <div style="font-weight: 600; margin-bottom: 4px;">LM Studio Connected</div>
                    <div style="font-size: 12px;">Use the AI buttons above or type a message below</div>
                </div>
            </div>
            
            <!-- Loading Indicator -->
            <div id="chatLoading-${this.windowId}" style="
                position: absolute;
                bottom: 80px;
                left: 16px;
                right: 16px;
                background: var(--nebula-surface);
                border: 1px solid var(--nebula-border);
                border-radius: var(--nebula-radius-sm);
                padding: 12px;
                display: none;
                align-items: center;
                gap: 8px;
                font-size: 13px;
                color: var(--nebula-text-secondary);
            ">
                <div class="spinner" style="
                    width: 12px;
                    height: 12px;
                    border: 2px solid var(--nebula-border);
                    border-top: 2px solid var(--nebula-primary);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                "></div>
                AI is thinking...
            </div>
            
            <!-- Chat Input -->
            <div style="
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                padding: 16px;
                background: var(--nebula-surface);
                border-top: 1px solid var(--nebula-border);
            ">
                <div style="display: flex; gap: 8px;">
                    <textarea id="chatInput-${this.windowId}" placeholder="Ask AI about your code..." style="
                        flex: 1;
                        min-height: 36px;
                        max-height: 100px;
                        padding: 8px 12px;
                        border: 1px solid var(--nebula-border);
                        border-radius: var(--nebula-radius-sm);
                        background: var(--nebula-bg-primary);
                        color: var(--nebula-text-primary);
                        font-size: 13px;
                        resize: none;
                        font-family: inherit;
                    "></textarea>
                    <button id="sendChatBtn-${this.windowId}" style="
                        background: var(--nebula-primary);
                        border: none;
                        color: white;
                        padding: 8px 16px;
                        border-radius: var(--nebula-radius-sm);
                        cursor: pointer;
                        font-weight: 600;
                        min-width: 60px;
                    ">
                        Send
                    </button>
                </div>
                <div style="font-size: 11px; color: var(--nebula-text-secondary); margin-top: 4px;">
                    Press Ctrl+Enter to send • Connected to local AI model
                </div>
            </div>
        `;
        
        this.setupChatListeners();
    }
    
    // NEW: Setup chat input listeners
    setupChatListeners() {
        const chatInput = document.getElementById(`chatInput-${this.windowId}`);
        const sendBtn = document.getElementById(`sendChatBtn-${this.windowId}`);
        
        if (chatInput && sendBtn) {
            // Send button click
            sendBtn.addEventListener('click', () => {
                this.sendChatMessage();
            });
            
            // Ctrl+Enter to send
            chatInput.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'Enter') {
                    e.preventDefault();
                    this.sendChatMessage();
                }
            });
            
            // Auto-resize textarea
            chatInput.addEventListener('input', () => {
                chatInput.style.height = 'auto';
                chatInput.style.height = Math.min(chatInput.scrollHeight, 100) + 'px';
            });
        }
    }
    
    // NEW: Send chat message to LM Studio
    async sendChatMessage() {
        const chatInput = document.getElementById(`chatInput-${this.windowId}`);
        const message = chatInput?.value.trim();
        
        if (!message) return;
        
        // Clear input
        chatInput.value = '';
        chatInput.style.height = 'auto';
        
        // Add user message to chat
        this.addChatMessage('user', message);
        
        // Get code context if available
        let codeContext = '';
        if (this.monacoEditor) {
            const code = this.monacoEditor.getValue();
            if (code.trim()) {
                codeContext = `\n\nCurrent ${this.currentLanguage} code:\n\`\`\`${this.currentLanguage}\n${code}\n\`\`\``;
            }
        }
        
        // Send to LM Studio
        await this.sendToLMStudio(message + codeContext);
    }
    
    // NEW: Send message to LM Studio API
    async sendToLMStudio(message, action = null) {
        try {
            this.showChatLoading();
            
            const response = await fetch(`${this.lmStudioConfig.baseUrl}/v1/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.lmStudioConfig.model,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a helpful coding assistant. Provide clear, practical advice about code. When suggesting code changes, format them clearly with code blocks.'
                        },
                        {
                            role: 'user',
                            content: message
                        }
                    ],
                    temperature: this.lmStudioConfig.temperature,
                    max_tokens: this.lmStudioConfig.maxTokens,
                    stream: false // Start with non-streaming for simplicity
                })
            });
            
            if (!response.ok) {
                throw new Error(`LM Studio API error: ${response.status}`);
            }
            
            const result = await response.json();
            const aiMessage = result.choices[0]?.message?.content || 'No response received';
            
            this.addChatMessage('assistant', aiMessage);
            
            // If this is a file modification action, offer to apply changes
            if (action && action.includes('modify')) {
                this.offerToApplyChanges(aiMessage);
            }
            
        } catch (error) {
            console.error('LM Studio error:', error);
            this.addChatMessage('error', `❌ Error: ${error.message}\n\nMake sure LM Studio is running on ${this.lmStudioConfig.baseUrl}`);
        } finally {
            this.hideChatLoading();
        }
    }
    
    // NEW: Add message to chat display
    addChatMessage(type, content) {
        const chatMessages = document.getElementById(`chatMessages-${this.windowId}`);
        if (!chatMessages) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message chat-${type}`;
        
        const colors = {
            user: '#667eea',
            assistant: '#4ade80',
            error: '#ef4444'
        };
        
        const icons = {
            user: '👤',
            assistant: '🤖',
            error: '❌'
        };
        
        messageDiv.style.cssText = `
            margin-bottom: 16px;
            padding: 12px;
            border-radius: var(--nebula-radius-sm);
            background: var(--nebula-surface);
            border-left: 4px solid ${colors[type] || '#6b7280'};
        `;
        
        messageDiv.innerHTML = `
            <div style="
                font-size: 11px;
                color: var(--nebula-text-secondary);
                margin-bottom: 6px;
                font-weight: 600;
            ">
                ${icons[type] || '💬'} ${type.toUpperCase()}
            </div>
            <div style="
                color: var(--nebula-text-primary);
                line-height: 1.4;
                white-space: pre-wrap;
                font-size: 13px;
            ">${content}</div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Auto-hide welcome message after first real message
        const welcomeMsg = chatMessages.querySelector('.welcome-message');
        if (welcomeMsg && (type === 'user' || type === 'assistant')) {
            welcomeMsg.style.display = 'none';
        }
    }
    
    // NEW: Show/hide chat loading
    showChatLoading() {
        const loading = document.getElementById(`chatLoading-${this.windowId}`);
        if (loading) loading.style.display = 'flex';
    }
    
    hideChatLoading() {
        const loading = document.getElementById(`chatLoading-${this.windowId}`);
        if (loading) loading.style.display = 'none';
    }
    
    // Create webview chat (fallback for other services)
    createWebviewChat(container) {
        container.innerHTML = `
            <div id="webviewContainer-${this.windowId}" style="
                height: 100%;
                position: relative;
            ">
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
            </div>
        `;
        
        this.createWebview();
    }
    
    // Enhanced setupEventListeners with new LM Studio features
    setupEventListeners() {
        // Existing listeners (keep all original functionality)
        document.getElementById(`languageSelect-${this.windowId}`)?.addEventListener('change', (e) => {
            this.switchLanguage(e.target.value);
        });
        
        // Enhanced AI Service selector
        document.getElementById(`aiServiceSelect-${this.windowId}`)?.addEventListener('change', (e) => {
            this.switchAIService(e.target.value);
        });
        
        // NEW: LM Studio reconnect button
        document.getElementById(`reconnectLMBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.initializeLMStudio();
        });
        
        // Template selector
        document.getElementById(`templateSelect-${this.windowId}`)?.addEventListener('change', (e) => {
            if (e.target.value) {
                this.loadTemplate(e.target.value);
                e.target.value = '';
            }
        });
        
        // File operations
        document.getElementById(`newFileBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.newFile();
        });
        
        document.getElementById(`openFileBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.openFile();
        });
        
        document.getElementById(`saveBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.saveFile();
        });
        
        // JS Execution
        document.getElementById(`runBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.runJavaScript();
        });
        
        document.getElementById(`toggleOutputBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.toggleOutputPanel();
        });
        
        document.getElementById(`clearOutputBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.clearOutput();
        });
        
        // ENHANCED AI Actions - Now use direct API calls for LM Studio
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
        
        document.getElementById(`refactorBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.refactorCode();
        });
        
        // NEW: File modification actions
        document.getElementById(`createFileBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.createFileWithAI();
        });
        
        document.getElementById(`modifyFileBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.modifyFileWithAI();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (!this.isWindowActive()) return;
            
            if (e.ctrlKey && e.key === 's' && !e.shiftKey) {
                e.preventDefault();
                this.saveFile();
            }
            
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                this.newFile();
            }
            
            if (e.ctrlKey && e.key === 'o') {
                e.preventDefault();
                this.openFile();
            }
            
            if (e.key === 'F5') {
                e.preventDefault();
                this.runJavaScript();
            }
        });
        
        this.addToolbarStyles();
    }
    
    // Enhanced AI Actions - Now support both API and webview modes
    async explainCode() {
        if (!this.monacoEditor) return;
        
        const code = this.monacoEditor.getValue();
        if (!code.trim()) {
            alert('Please enter some code first!');
            return;
        }
        
        const prompt = `Please explain this ${this.currentLanguage} code in detail. Break down what each part does and explain any important concepts:\n\n\`\`\`${this.currentLanguage}\n${code}\n\`\`\``;
        
        if (this.isAPIService()) {
            await this.sendToLMStudio(prompt);
        } else {
            this.copyToClipboardWithAlert(prompt, 'Code explanation prompt copied!');
        }
    }
    
    async optimizeCode() {
        if (!this.monacoEditor) return;
        
        const code = this.monacoEditor.getValue();
        if (!code.trim()) {
            alert('Please enter some code first!');
            return;
        }
        
        const prompt = `Please optimize this ${this.currentLanguage} code for better performance, readability, and best practices. Provide the improved version with explanations:\n\n\`\`\`${this.currentLanguage}\n${code}\n\`\`\``;
        
        if (this.isAPIService()) {
            await this.sendToLMStudio(prompt);
        } else {
            this.copyToClipboardWithAlert(prompt, 'Code optimization prompt copied!');
        }
    }
    
    async debugCode() {
        if (!this.monacoEditor) return;
        
        const code = this.monacoEditor.getValue();
        if (!code.trim()) {
            alert('Please enter some code first!');
            return;
        }
        
        const prompt = `Please help me debug this ${this.currentLanguage} code. Look for potential bugs, errors, or issues and suggest fixes:\n\n\`\`\`${this.currentLanguage}\n${code}\n\`\`\``;
        
        if (this.isAPIService()) {
            await this.sendToLMStudio(prompt);
        } else {
            this.copyToClipboardWithAlert(prompt, 'Debug prompt copied!');
        }
    }
    
    async addComments() {
        if (!this.monacoEditor) return;
        
        const code = this.monacoEditor.getValue();
        if (!code.trim()) {
            alert('Please enter some code first!');
            return;
        }
        
        const prompt = `Please add helpful comments to this ${this.currentLanguage} code. Explain what each section does:\n\n\`\`\`${this.currentLanguage}\n${code}\n\`\`\``;
        
        if (this.isAPIService()) {
            await this.sendToLMStudio(prompt);
        } else {
            this.copyToClipboardWithAlert(prompt, 'Add comments prompt copied!');
        }
    }
    
    async generateTests() {
        if (!this.monacoEditor) return;
        
        const code = this.monacoEditor.getValue();
        if (!code.trim()) {
            alert('Please enter some code first!');
            return;
        }
        
        const prompt = `Please generate comprehensive unit tests for this ${this.currentLanguage} code:\n\n\`\`\`${this.currentLanguage}\n${code}\n\`\`\``;
        
        if (this.isAPIService()) {
            await this.sendToLMStudio(prompt);
        } else {
            this.copyToClipboardWithAlert(prompt, 'Generate tests prompt copied!');
        }
    }
    
    // NEW: Refactor code action
    async refactorCode() {
        if (!this.monacoEditor) return;
        
        const code = this.monacoEditor.getValue();
        if (!code.trim()) {
            alert('Please enter some code first!');
            return;
        }
        
        const prompt = `Please refactor this ${this.currentLanguage} code to make it more maintainable, readable, and follow best practices:\n\n\`\`\`${this.currentLanguage}\n${code}\n\`\`\``;
        
        if (this.isAPIService()) {
            await this.sendToLMStudio(prompt);
        } else {
            this.copyToClipboardWithAlert(prompt, 'Refactor prompt copied!');
        }
    }
    
    // NEW: Create file with AI assistance
    async createFileWithAI() {
        const description = await this.showInputDialog(
            'Create File with AI', 
            'Describe what file you want to create:', 
            'Create a simple React component for...'
        );
        
        if (!description) return;
        
        const prompt = `Please create a ${this.currentLanguage} file based on this description: ${description}\n\nProvide complete, working code with proper structure and comments.`;
        
        if (this.isAPIService()) {
            await this.sendToLMStudio(prompt, 'create_file');
        } else {
            this.copyToClipboardWithAlert(prompt, 'Create file prompt copied!');
        }
    }
    
    // NEW: Modify file with AI assistance
    async modifyFileWithAI() {
        if (!this.monacoEditor) return;
        
        const code = this.monacoEditor.getValue();
        if (!code.trim()) {
            alert('Please open a file first!');
            return;
        }
        
        const modification = await this.showInputDialog(
            'Modify File with AI',
            'Describe what changes you want to make:',
            'Add error handling to all functions...'
        );
        
        if (!modification) return;
        
        const prompt = `Please modify this ${this.currentLanguage} code based on the following request: ${modification}\n\nCurrent code:\n\`\`\`${this.currentLanguage}\n${code}\n\`\`\`\n\nProvide the complete modified code.`;
        
        if (this.isAPIService()) {
            await this.sendToLMStudio(prompt, 'modify_file');
        } else {
            this.copyToClipboardWithAlert(prompt, 'Modify file prompt copied!');
        }
    }
    
    // NEW: Offer to apply AI-suggested changes
    offerToApplyChanges(aiResponse) {
        // Look for code blocks in the AI response
        const codeBlockRegex = /```[\w]*\n?([\s\S]*?)\n?```/g;
        const matches = [...aiResponse.matchAll(codeBlockRegex)];
        
        if (matches.length > 0) {
            const codeToApply = matches[0][1]; // Get first code block
            
            // Show confirmation dialog
            if (confirm('AI suggested code changes. Would you like to apply them to the editor?')) {
                if (this.monacoEditor) {
                    this.monacoEditor.setValue(codeToApply);
                    this.hasUnsavedChanges = true;
                    this.updateWindowTitle();
                    this.writeOutput('✅ AI changes applied to editor', 'success');
                }
            }
        }
    }
    
    // Helper methods
    isAPIService() {
        return this.aiServices[this.currentAIService]?.type === 'api';
    }
    
    copyToClipboardWithAlert(text, message) {
        navigator.clipboard.writeText(text).then(() => {
            alert(message + '\nPaste it into the AI chat on the right.');
        }).catch(() => {
            alert('Failed to copy to clipboard');
        });
    }
    
    // Enhanced switchAIService to handle different service types
    switchAIService(serviceKey) {
        if (!this.aiServices[serviceKey]) {
            console.error('Unknown AI service:', serviceKey);
            return;
        }
        
        this.currentAIService = serviceKey;
        this.createChatInterface(); // Recreate appropriate interface
        
        // Update window title
        const serviceName = this.aiServices[serviceKey].name;
        const baseTitle = '💻 Code Assistant Pro';
        const newTitle = serviceKey === 'lmstudio' ? `🏠 ${baseTitle} - Local AI` : `${baseTitle} - ${serviceName}`;
        
        if (window.windowManager && this.windowId) {
            window.windowManager.setWindowTitle(this.windowId, newTitle);
        }
        
        console.log(`Switched to ${serviceName}`);
    }
    
    // Keep all existing methods (Monaco setup, file operations, etc.)
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
            
            this.monacoEditor.onDidChangeModelContent(() => {
                this.hasUnsavedChanges = true;
                this.updateWindowTitle();
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
                if (editor) {
                    editor.value = value;
                    this.hasUnsavedChanges = false;
                    this.updateWindowTitle();
                }
            },
            getModel: () => ({ getLanguageId: () => this.currentLanguage }),
            onDidChangeModelContent: (callback) => {
                const editor = document.getElementById(`fallbackEditor-${this.windowId}`);
                if (editor) {
                    editor.addEventListener('input', callback);
                }
            }
        };
        
        this.monacoEditor.onDidChangeModelContent(() => {
            this.hasUnsavedChanges = true;
            this.updateWindowTitle();
        });
    }
    
    getWelcomeCode() {
        return `// 🏠 Enhanced Code Assistant with LM Studio!
// Now with direct AI integration + file modification

// NEW FEATURES:
// 🤖 Direct LM Studio API integration - no more copy/paste!
// 📝 AI can create and modify files directly
// 💬 Real-time chat with your local AI model
// 🔧 Intelligent code refactoring and suggestions

// Example: This code will run locally
function greetLocalAI(name = "Developer") {
    const message = \`Hello, \${name}! Your local AI is ready! 🚀\`;
    console.log(message);
    
    // Try the new AI features:
    // 1. Click any AI button above (Explain, Optimize, Debug, etc.)
    // 2. Use the chat input to ask questions
    // 3. Try "Create File" or "Modify File" for AI-assisted development
    
    return {
        greeting: message,
        features: [
            "Direct LM Studio integration",
            "Real-time AI chat", 
            "Automated file modifications",
            "Intelligent code suggestions"
        ],
        status: "Ready to code with AI! 🎉"
    };
}

// Run this code with F5 or the Run button
greetLocalAI("Nebula Developer");

// TODO: Start building with AI assistance!`;
    }
    
    // Keep all existing file operations and utility methods
    async newFile() {
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
    }
    
    async openFile() {
        try {
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
                const homeDir = await window.nebula.fs.getHomeDir();
                const filePath = await this.showInputDialog('Open File', 'Enter file path to open:', homeDir + '/');
                if (!filePath) return;
                
                await this.loadFileContent(filePath);
            }
            
        } catch (error) {
            this.writeOutput(\`❌ Failed to open file: \${error.message}\`, 'error');
            console.error('File open error:', error);
        }
    }
    
    async loadFileContent(filePath) {
        const exists = await window.nebula.fs.exists(filePath);
        if (!exists) {
            alert('File not found: ' + filePath);
            return;
        }
        
        this.writeOutput(\`Opening file: \${filePath}...\`, 'info');
        const content = await window.nebula.fs.readFile(filePath);
        
        if (this.monacoEditor) {
            this.monacoEditor.setValue(content);
            this.currentFilePath = filePath;
            this.hasUnsavedChanges = false;
            this.updateWindowTitle();
            
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
                const languageSelect = document.getElementById(\`languageSelect-\${this.windowId}\`);
                if (languageSelect) languageSelect.value = languageMap[extension];
            }
            
            this.writeOutput(\`✅ File opened successfully!\`, 'success');
        }
    }
    
    async saveFile(saveAs = false) {
        if (!this.monacoEditor) return;
        
        const code = this.monacoEditor.getValue();
        if (!code.trim()) {
            alert('No content to save!');
            return;
        }
        
        try {
            let filePath = this.currentFilePath;
            
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
                    const homeDir = await window.nebula.fs.getHomeDir();
                    const defaultPath = filePath || homeDir + '/untitled.js';
                    filePath = await this.showInputDialog('Save File', 'Save file as:', defaultPath);
                    if (!filePath) return;
                }
            }
            
            this.writeOutput(\`Saving file: \${filePath}...\`, 'info');
            await window.nebula.fs.writeFile(filePath, code);
            
            this.currentFilePath = filePath;
            this.hasUnsavedChanges = false;
            this.updateWindowTitle();
            this.writeOutput(\`✅ File saved successfully!\`, 'success');
            
        } catch (error) {
            this.writeOutput(\`❌ Failed to save file: \${error.message}\`, 'error');
            console.error('File save error:', error);
        }
    }
    
    // Keep all other existing methods (JS execution, templates, etc.)
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
        
        if (!this.outputVisible) {
            this.toggleOutputPanel();
        }
        
        this.executeJS(code);
    }
    
    executeJS(code) {
        this.writeOutput(\`> Running JavaScript...\n\`, 'info');
        
        try {
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
            
            let result;
            try {
                result = Function('"use strict"; ' + code)();
            } catch (firstError) {
                try {
                    result = Function('"use strict"; return (' + code + ')')();
                } catch (secondError) {
                    throw firstError;
                }
            }
            
            console.log = originalLog;
            console.error = originalError;
            console.warn = originalWarn;
            
            if (output) {
                this.writeOutput('Console Output:', 'success');
                this.writeOutput(output.trim(), 'output');
            }
            
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
            this.writeOutput(\`❌ JavaScript Error: \${error.message}\n\`, 'error');
        }
    }
    
    toggleOutputPanel() {
        const outputPanel = document.getElementById(\`outputPanel-\${this.windowId}\`);
        if (!outputPanel) return;
        
        this.outputVisible = !this.outputVisible;
        
        if (this.outputVisible) {
            outputPanel.style.height = '250px';
        } else {
            outputPanel.style.height = '0';
        }
        
        const toggleBtn = document.getElementById(\`toggleOutputBtn-\${this.windowId}\`);
        if (toggleBtn) {
            toggleBtn.style.background = this.outputVisible ? 'var(--nebula-primary)' : '';
            toggleBtn.style.color = this.outputVisible ? 'white' : '';
        }
    }
    
    writeOutput(text, type = 'output') {
        const outputContent = document.getElementById(\`outputContent-\${this.windowId}\`);
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
        const outputContent = document.getElementById(\`outputContent-\${this.windowId}\`);
        if (outputContent) {
            outputContent.innerHTML = 'Output cleared... 🧹\n';
        }
    }
    
    switchLanguage(language) {
        this.currentLanguage = language;
        
        if (this.monacoEditor && monaco) {
            monaco.editor.setModelLanguage(this.monacoEditor.getModel(), language);
        }
        
        console.log(\`Switched to \${language}\`);
    }
    
    // Keep webview creation for fallback services
    createWebview() {
        const container = document.getElementById(\`webviewContainer-\${this.windowId}\`);
        if (!container) return;
        
        this.showLoading();
        
        if (this.webview) {
            this.webview.remove();
            this.webview = null;
        }
        
        this.webview = document.createElement('webview');
        this.webview.className = 'code-webview';
        this.webview.style.cssText = \`
            width: 100%;
            height: 100%;
            border: none;
            background: var(--nebula-bg-primary);
        \`;
        
        const currentService = this.aiServices[this.currentAIService];
        this.webview.src = currentService.url;
        
        this.setupWebviewListeners();
        container.appendChild(this.webview);
    }
    
    setupWebviewListeners() {
        if (!this.webview) return;
        
        this.webview.addEventListener('dom-ready', () => {
            this.hideLoading();
        });
        
        this.webview.addEventListener('did-start-loading', () => {
            this.showLoading();
        });
        
        this.webview.addEventListener('did-stop-loading', () => {
            this.hideLoading();
        });
    }
    
    showLoading() {
        const loading = document.getElementById(\`chatLoading-\${this.windowId}\`);
        if (loading) loading.style.display = 'block';
    }
    
    hideLoading() {
        const loading = document.getElementById(\`chatLoading-\${this.windowId}\`);
        if (loading) loading.style.display = 'none';
    }
    
    // Input dialog helper
    showInputDialog(title, message, defaultValue = '') {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.style.cssText = \`
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
            \`;
            
            const dialog = document.createElement('div');
            dialog.style.cssText = \`
                background: var(--nebula-surface);
                border: 1px solid var(--nebula-border);
                border-radius: var(--nebula-radius-md);
                padding: 24px;
                min-width: 400px;
                max-width: 600px;
            \`;
            
            dialog.innerHTML = \`
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 16px 0;">\${title}</h3>
                <p style="color: var(--nebula-text-secondary); margin: 0 0 16px 0;">\${message}</p>
                <input type="text" id="inputField" value="\${defaultValue}" style="
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
            \`;
            
            modal.appendChild(dialog);
            document.body.appendChild(modal);
            
            const input = dialog.querySelector('#inputField');
            input.focus();
            input.select();
            
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
            
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    cleanup(input.value.trim() || null);
                } else if (e.key === 'Escape') {
                    cleanup(null);
                }
            });
        });
    }
    
    updateWindowTitle() {
        const fileName = this.currentFilePath ? 
            this.currentFilePath.split('/').pop() : 'Untitled';
        const modified = this.hasUnsavedChanges ? ' •' : '';
        
        if (window.windowManager && this.windowId) {
            const serviceName = this.aiServices[this.currentAIService].name;
            const title = `💻 Code Assistant Pro - ${fileName}${modified} (${serviceName})`;
            window.windowManager.setWindowTitle(this.windowId, title);
        }
        
        const fileStatus = document.getElementById(`fileStatus-${this.windowId}`);
        const fileInfo = document.getElementById(`fileInfo-${this.windowId}`);
        
        if (fileStatus) {
            fileStatus.textContent = this.hasUnsavedChanges ? 'Modified' : 'Saved';
        }
        
        if (fileInfo) {
            if (this.currentFilePath) {
                fileInfo.textContent = this.currentFilePath;
            } else {
                fileInfo.textContent = 'No file open';
            }
        }
    }
    
    // Template loading system
    async loadTemplate(templateKey) {
        const template = this.templates[templateKey];
        if (!template) {
            alert('Template not found!');
            return;
        }
        
        try {
            this.writeOutput(`Loading template: ${template.name}...`, 'info');
            
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
            this.loadEmbeddedTemplate(templateKey);
        }
    }
    
    loadEmbeddedTemplate(templateKey) {
        let templateContent = '';
        
        if (templateKey === 'single-app') {
            templateContent = `// NebulaApp Single Window Template
class NebulaMyApp {
    constructor() {
        this.windowId = null;
        this.init();
    }
    
    async init() {
        if (!window.windowManager) return;
        
        this.windowId = window.windowManager.createWindow({
            title: "My App",
            width: 800,
            height: 600,
            resizable: true
        });
        
        window.windowManager.loadApp(this.windowId, this);
    }
    
    render() {
        const container = document.createElement("div");
        container.innerHTML = "<h1>My App Content</h1>";
        return container;
    }
    
    getTitle() { return "My App"; }
    getIcon() { return "🚀"; }
    cleanup() { console.log("Cleanup"); }
}

window.NebulaMyApp = NebulaMyApp;`;
        } else if (templateKey === 'tabbed-app') {
            templateContent = `// NebulaApp Tabbed Window Template
class NebulaMyTabbedApp {
    constructor() {
        this.windowId = null;
        this.tabs = new Map();
        this.init();
    }
    
    async init() {
        if (!window.windowManager) return;
        
        this.windowId = window.windowManager.createWindow({
            title: "My Tabbed App",
            width: 1200,
            height: 700,
            hasTabBar: false,
            resizable: true
        });
        
        window.windowManager.loadApp(this.windowId, this);
    }
    
    render() {
        const container = document.createElement("div");
        container.innerHTML = "<h1>My Tabbed App</h1>";
        return container;
    }
    
    getTitle() { return "My Tabbed App"; }
    getIcon() { return "📑"; }
    cleanup() { console.log("Cleanup"); }
}

window.NebulaMyTabbedApp = NebulaMyTabbedApp;`;
        }
        
        if (this.monacoEditor && templateContent) {
            this.monacoEditor.setValue(templateContent);
            this.writeOutput('✅ Fallback template loaded!', 'success');
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
            
            .chat-message {
                font-family: inherit;
            }
            
            .chat-message pre {
                background: var(--nebula-bg-primary);
                border: 1px solid var(--nebula-border);
                border-radius: var(--nebula-radius-sm);
                padding: 12px;
                overflow-x: auto;
                margin: 8px 0;
            }
            
            .chat-message code {
                background: var(--nebula-bg-primary);
                border: 1px solid var(--nebula-border);
                border-radius: 3px;
                padding: 2px 6px;
                font-size: 12px;
            }
            
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            
            .spinner {
                animation: spin 1s linear infinite;
            }
        `;
        document.head.appendChild(style);
    }
    
    getTitle() {
        return 'Code Assistant Pro';
    }
    
    getIcon() {
        return '💻';
    }
    
    cleanup() {
        if (this.hasUnsavedChanges) {
            if (confirm('You have unsaved changes. Close anyway?')) {
                // User confirmed, proceed with cleanup
            } else {
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

// Export for use in NebulaDesktop
window.NebulaCodeAssistant = NebulaCodeAssistant;