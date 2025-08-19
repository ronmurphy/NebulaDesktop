// Enhanced NebulaAssistant with AI Art Generation and Monaco Editor
class NebulaAssistant {
    constructor() {
        this.windowId = null;
        this.activeTab = 'chat';
        this.monacoEditor = null;
        this.currentAI = 'claude';
        this.generatedImages = [];
        this.codeProjects = [];
        
        // AI Services configuration
        this.aiServices = {
            claude: { name: 'Claude', url: 'https://claude.ai', icon: '🧠' },
            chatgpt: { name: 'ChatGPT', url: 'https://chat.openai.com', icon: '💬' },
            manus: { name: 'Manus', url: 'https://manus.im', icon: '🤖' },
            perplexity: { name: 'Perplexity', url: 'https://perplexity.ai', icon: '🔍' },
            copilot: { name: 'Copilot', url: 'https://copilot.microsoft.com', icon: '🚀' },
            gemini: { name: 'Gemini', url: 'https://gemini.google.com', icon: '💎' },
            bolt: { name: 'Bolt', url: 'https://bolt.new', icon: '⚡' }
        };
        
        // Art generation providers
        this.artProviders = {
            openai: { name: 'DALL-E 3', icon: '🎨', endpoint: '/api/openai/images' },
            stability: { name: 'Stable Diffusion', icon: '🖼️', endpoint: '/api/stability/images' },
            midjourney: { name: 'Midjourney', icon: '🌟', endpoint: '/api/midjourney/images' }
        };
        
        // Code AI providers
        this.codeProviders = {
            openai: { name: 'GPT-4', icon: '🤖', model: 'gpt-4' },
            anthropic: { name: 'Claude', icon: '🧠', model: 'claude-3-sonnet' },
            google: { name: 'Gemini Pro', icon: '💎', model: 'gemini-pro' },
            github: { name: 'GitHub Copilot', icon: '🐙', model: 'copilot' }
        };
        
        this.init();
    }

    async init() {
        if (!window.windowManager) {
            console.error('WindowManager not available');
            return;
        }
        
        // Create a window for the enhanced assistant
        this.windowId = window.windowManager.createWindow({
            title: '🤖 AI Assistant Pro',
            icon: '🤖',
            width: 1200,
            height: 800,
            resizable: true,
            maximizable: true,
            minimizable: true
        });
        
        // Load this assistant app into the window
        window.windowManager.loadApp(this.windowId, this);
        
        console.log(`Enhanced Assistant initialized with window ${this.windowId}`);
    }

    render() {
        const container = document.createElement('div');
        container.className = 'enhanced-assistant-container';
        container.style.cssText = `
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            background: var(--nebula-bg-primary);
            color: var(--nebula-text-primary);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            overflow: hidden;
        `;
        
        container.innerHTML = `
            <!-- Tab Navigation -->
            <div class="assistant-tabs" style="
                display: flex;
                background: var(--nebula-surface);
                border-bottom: 1px solid var(--nebula-border);
                padding: 0;
            ">
                <button class="tab-btn ${this.activeTab === 'chat' ? 'active' : ''}" data-tab="chat" style="
                    flex: 1;
                    padding: var(--nebula-space-md);
                    border: none;
                    background: ${this.activeTab === 'chat' ? 'var(--nebula-primary)' : 'transparent'};
                    color: ${this.activeTab === 'chat' ? 'white' : 'var(--nebula-text-primary)'};
                    cursor: pointer;
                    transition: var(--nebula-transition);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: var(--nebula-space-sm);
                ">
                    <span style="font-size: 18px;">💬</span>
                    <span>AI Chat</span>
                </button>
                <button class="tab-btn ${this.activeTab === 'art' ? 'active' : ''}" data-tab="art" style="
                    flex: 1;
                    padding: var(--nebula-space-md);
                    border: none;
                    background: ${this.activeTab === 'art' ? 'var(--nebula-primary)' : 'transparent'};
                    color: ${this.activeTab === 'art' ? 'white' : 'var(--nebula-text-primary)'};
                    cursor: pointer;
                    transition: var(--nebula-transition);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: var(--nebula-space-sm);
                ">
                    <span style="font-size: 18px;">🎨</span>
                    <span>AI Art</span>
                </button>
                <button class="tab-btn ${this.activeTab === 'code' ? 'active' : ''}" data-tab="code" style="
                    flex: 1;
                    padding: var(--nebula-space-md);
                    border: none;
                    background: ${this.activeTab === 'code' ? 'var(--nebula-primary)' : 'transparent'};
                    color: ${this.activeTab === 'code' ? 'white' : 'var(--nebula-text-primary)'};
                    cursor: pointer;
                    transition: var(--nebula-transition);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: var(--nebula-space-sm);
                ">
                    <span style="font-size: 18px;">👨‍💻</span>
                    <span>AI Code</span>
                </button>
            </div>

            <!-- Tab Content -->
            <div class="tab-content" style="flex: 1; overflow: hidden;">
                <div id="chatTab" class="tab-pane ${this.activeTab === 'chat' ? 'active' : ''}" style="
                    width: 100%;
                    height: 100%;
                    display: ${this.activeTab === 'chat' ? 'flex' : 'none'};
                    flex-direction: column;
                ">
                    ${this.renderChatTab()}
                </div>
                
                <div id="artTab" class="tab-pane ${this.activeTab === 'art' ? 'active' : ''}" style="
                    width: 100%;
                    height: 100%;
                    display: ${this.activeTab === 'art' ? 'flex' : 'none'};
                    flex-direction: column;
                ">
                    ${this.renderArtTab()}
                </div>
                
                <div id="codeTab" class="tab-pane ${this.activeTab === 'code' ? 'active' : ''}" style="
                    width: 100%;
                    height: 100%;
                    display: ${this.activeTab === 'code' ? 'flex' : 'none'};
                    flex-direction: column;
                ">
                    ${this.renderCodeTab()}
                </div>
            </div>
        `;

        this.setupEventListeners(container);
        
        // Initialize Monaco Editor if code tab is active
        if (this.activeTab === 'code') {
            setTimeout(() => this.initializeMonacoEditor(), 100);
        }

        return container;
    }

    renderChatTab() {
        return `
            <div class="chat-header" style="
                padding: var(--nebula-space-md);
                background: var(--nebula-surface);
                border-bottom: 1px solid var(--nebula-border);
                display: flex;
                align-items: center;
                gap: var(--nebula-space-md);
            ">
                <label style="color: var(--nebula-text-primary); font-weight: 500;">AI Provider:</label>
                <select id="aiProviderSelect" style="
                    padding: var(--nebula-space-sm) var(--nebula-space-md);
                    border: 1px solid var(--nebula-border);
                    border-radius: var(--nebula-radius-md);
                    background: var(--nebula-surface);
                    color: var(--nebula-text-primary);
                    min-width: 150px;
                ">
                    ${Object.entries(this.aiServices).map(([key, service]) => `
                        <option value="${key}" ${key === this.currentAI ? 'selected' : ''}>
                            ${service.icon} ${service.name}
                        </option>
                    `).join('')}
                </select>
                <button id="newChatBtn" style="
                    background: var(--nebula-primary);
                    color: white;
                    border: none;
                    padding: var(--nebula-space-sm) var(--nebula-space-md);
                    border-radius: var(--nebula-radius-md);
                    cursor: pointer;
                    font-weight: 500;
                ">New Chat</button>
            </div>
            
            <div class="chat-content" style="
                flex: 1;
                background: var(--nebula-bg-primary);
                position: relative;
                overflow: hidden;
            ">
                <div id="chatLoading" style="
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    text-align: center;
                    color: var(--nebula-text-secondary);
                ">
                    <div style="font-size: 24px; margin-bottom: var(--nebula-space-sm);">🤖</div>
                    <div>Loading AI service...</div>
                </div>
                <!-- Webview will be inserted here -->
            </div>
        `;
    }

    renderArtTab() {
        return `
            <div class="art-header" style="
                padding: var(--nebula-space-md);
                background: var(--nebula-surface);
                border-bottom: 1px solid var(--nebula-border);
            ">
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 var(--nebula-space-md) 0; font-size: 18px; font-weight: 600;">AI Art Generation</h3>
                <div style="display: flex; gap: var(--nebula-space-md); align-items: end;">
                    <div style="flex: 1;">
                        <label style="color: var(--nebula-text-primary); font-weight: 500; margin-bottom: var(--nebula-space-sm); display: block;">Art Provider:</label>
                        <select id="artProviderSelect" style="
                            width: 100%;
                            padding: var(--nebula-space-sm) var(--nebula-space-md);
                            border: 1px solid var(--nebula-border);
                            border-radius: var(--nebula-radius-md);
                            background: var(--nebula-surface);
                            color: var(--nebula-text-primary);
                        ">
                            ${Object.entries(this.artProviders).map(([key, provider]) => `
                                <option value="${key}">${provider.icon} ${provider.name}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div style="flex: 2;">
                        <label style="color: var(--nebula-text-primary); font-weight: 500; margin-bottom: var(--nebula-space-sm); display: block;">Prompt:</label>
                        <input type="text" id="artPromptInput" placeholder="Describe the image you want to generate..." style="
                            width: 100%;
                            padding: var(--nebula-space-sm) var(--nebula-space-md);
                            border: 1px solid var(--nebula-border);
                            border-radius: var(--nebula-radius-md);
                            background: var(--nebula-surface);
                            color: var(--nebula-text-primary);
                        ">
                    </div>
                    <button id="generateArtBtn" style="
                        background: var(--nebula-primary);
                        color: white;
                        border: none;
                        padding: var(--nebula-space-sm) var(--nebula-space-lg);
                        border-radius: var(--nebula-radius-md);
                        cursor: pointer;
                        font-weight: 500;
                        white-space: nowrap;
                    ">Generate</button>
                </div>
            </div>
            
            <div class="art-content" style="
                flex: 1;
                padding: var(--nebula-space-md);
                overflow-y: auto;
                background: var(--nebula-bg-primary);
            ">
                <div id="artGallery" style="
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                    gap: var(--nebula-space-md);
                ">
                    ${this.renderArtGallery()}
                </div>
                
                <div id="artGenerating" style="
                    display: none;
                    text-align: center;
                    padding: var(--nebula-space-xl);
                    color: var(--nebula-text-secondary);
                ">
                    <div style="font-size: 48px; margin-bottom: var(--nebula-space-md); animation: pulse 2s infinite;">🎨</div>
                    <div style="font-size: 18px; font-weight: 500;">Generating your artwork...</div>
                    <div style="font-size: 14px; margin-top: var(--nebula-space-sm);">This may take a few moments</div>
                </div>
            </div>
        `;
    }

    renderCodeTab() {
        return `
            <div class="code-header" style="
                padding: var(--nebula-space-md);
                background: var(--nebula-surface);
                border-bottom: 1px solid var(--nebula-border);
                display: flex;
                gap: var(--nebula-space-md);
                align-items: end;
            ">
                <div style="flex: 1;">
                    <label style="color: var(--nebula-text-primary); font-weight: 500; margin-bottom: var(--nebula-space-sm); display: block;">AI Provider:</label>
                    <select id="codeProviderSelect" style="
                        width: 100%;
                        padding: var(--nebula-space-sm) var(--nebula-space-md);
                        border: 1px solid var(--nebula-border);
                        border-radius: var(--nebula-radius-md);
                        background: var(--nebula-surface);
                        color: var(--nebula-text-primary);
                    ">
                        ${Object.entries(this.codeProviders).map(([key, provider]) => `
                            <option value="${key}">${provider.icon} ${provider.name}</option>
                        `).join('')}
                    </select>
                </div>
                <div style="flex: 1;">
                    <label style="color: var(--nebula-text-primary); font-weight: 500; margin-bottom: var(--nebula-space-sm); display: block;">Language:</label>
                    <select id="languageSelect" style="
                        width: 100%;
                        padding: var(--nebula-space-sm) var(--nebula-space-md);
                        border: 1px solid var(--nebula-border);
                        border-radius: var(--nebula-radius-md);
                        background: var(--nebula-surface);
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
                </div>
                <button id="newProjectBtn" style="
                    background: var(--nebula-primary);
                    color: white;
                    border: none;
                    padding: var(--nebula-space-sm) var(--nebula-space-md);
                    border-radius: var(--nebula-radius-md);
                    cursor: pointer;
                    font-weight: 500;
                ">New Project</button>
                <button id="saveProjectBtn" style="
                    background: var(--nebula-success);
                    color: white;
                    border: none;
                    padding: var(--nebula-space-sm) var(--nebula-space-md);
                    border-radius: var(--nebula-radius-md);
                    cursor: pointer;
                    font-weight: 500;
                ">Save</button>
            </div>
            
            <div class="code-content" style="
                flex: 1;
                display: flex;
                background: var(--nebula-bg-primary);
            ">
                <div class="code-editor-container" style="
                    flex: 2;
                    border-right: 1px solid var(--nebula-border);
                    position: relative;
                ">
                    <div id="monacoEditor" style="width: 100%; height: 100%;"></div>
                </div>
                
                <div class="code-assistant" style="
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    background: var(--nebula-surface);
                ">
                    <div style="
                        padding: var(--nebula-space-md);
                        border-bottom: 1px solid var(--nebula-border);
                    ">
                        <h4 style="color: var(--nebula-text-primary); margin: 0 0 var(--nebula-space-sm) 0; font-size: 16px; font-weight: 600;">AI Assistant</h4>
                        <div style="display: flex; gap: var(--nebula-space-sm);">
                            <input type="text" id="codePromptInput" placeholder="Ask AI to help with your code..." style="
                                flex: 1;
                                padding: var(--nebula-space-sm);
                                border: 1px solid var(--nebula-border);
                                border-radius: var(--nebula-radius-md);
                                background: var(--nebula-bg-primary);
                                color: var(--nebula-text-primary);
                                font-size: 12px;
                            ">
                            <button id="askAIBtn" style="
                                background: var(--nebula-primary);
                                color: white;
                                border: none;
                                padding: var(--nebula-space-sm);
                                border-radius: var(--nebula-radius-md);
                                cursor: pointer;
                                font-size: 12px;
                            ">Ask</button>
                        </div>
                    </div>
                    
                    <div id="aiSuggestions" style="
                        flex: 1;
                        padding: var(--nebula-space-md);
                        overflow-y: auto;
                        font-size: 12px;
                        line-height: 1.4;
                    ">
                        <div style="color: var(--nebula-text-secondary); text-align: center; padding: var(--nebula-space-xl);">
                            <div style="font-size: 24px; margin-bottom: var(--nebula-space-sm);">🤖</div>
                            <div>Ask AI for coding help, suggestions, or explanations</div>
                        </div>
                    </div>
                    
                    <div style="
                        padding: var(--nebula-space-md);
                        border-top: 1px solid var(--nebula-border);
                        display: flex;
                        gap: var(--nebula-space-sm);
                    ">
                        <button id="explainCodeBtn" style="
                            flex: 1;
                            background: var(--nebula-secondary);
                            color: white;
                            border: none;
                            padding: var(--nebula-space-xs);
                            border-radius: var(--nebula-radius-sm);
                            cursor: pointer;
                            font-size: 11px;
                        ">Explain</button>
                        <button id="optimizeCodeBtn" style="
                            flex: 1;
                            background: var(--nebula-warning);
                            color: white;
                            border: none;
                            padding: var(--nebula-space-xs);
                            border-radius: var(--nebula-radius-sm);
                            cursor: pointer;
                            font-size: 11px;
                        ">Optimize</button>
                        <button id="debugCodeBtn" style="
                            flex: 1;
                            background: var(--nebula-danger);
                            color: white;
                            border: none;
                            padding: var(--nebula-space-xs);
                            border-radius: var(--nebula-radius-sm);
                            cursor: pointer;
                            font-size: 11px;
                        ">Debug</button>
                    </div>
                </div>
            </div>
        `;
    }

    renderArtGallery() {
        if (this.generatedImages.length === 0) {
            return `
                <div style="
                    grid-column: 1 / -1;
                    text-align: center;
                    padding: var(--nebula-space-xl);
                    color: var(--nebula-text-secondary);
                ">
                    <div style="font-size: 48px; margin-bottom: var(--nebula-space-md);">🎨</div>
                    <div style="font-size: 18px; font-weight: 500; margin-bottom: var(--nebula-space-sm);">No artwork generated yet</div>
                    <div style="font-size: 14px;">Enter a prompt above and click Generate to create AI art</div>
                </div>
            `;
        }

        return this.generatedImages.map((image, index) => `
            <div class="art-item" style="
                background: var(--nebula-surface);
                border: 1px solid var(--nebula-border);
                border-radius: var(--nebula-radius-lg);
                overflow: hidden;
                transition: var(--nebula-transition);
            ">
                <div style="aspect-ratio: 1; background: var(--nebula-surface-elevated); position: relative;">
                    <img src="${image.url}" alt="${image.prompt}" style="
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                    ">
                    <div style="
                        position: absolute;
                        top: var(--nebula-space-sm);
                        right: var(--nebula-space-sm);
                        background: rgba(0,0,0,0.7);
                        color: white;
                        padding: var(--nebula-space-xs) var(--nebula-space-sm);
                        border-radius: var(--nebula-radius-sm);
                        font-size: 10px;
                    ">${image.provider}</div>
                </div>
                <div style="padding: var(--nebula-space-md);">
                    <div style="color: var(--nebula-text-primary); font-weight: 500; font-size: 12px; margin-bottom: var(--nebula-space-xs);">${image.prompt}</div>
                    <div style="color: var(--nebula-text-secondary); font-size: 10px; margin-bottom: var(--nebula-space-sm);">${new Date(image.timestamp).toLocaleString()}</div>
                    <div style="display: flex; gap: var(--nebula-space-xs);">
                        <button class="download-art" data-index="${index}" style="
                            flex: 1;
                            background: var(--nebula-primary);
                            color: white;
                            border: none;
                            padding: var(--nebula-space-xs);
                            border-radius: var(--nebula-radius-sm);
                            cursor: pointer;
                            font-size: 10px;
                        ">Download</button>
                        <button class="delete-art" data-index="${index}" style="
                            background: var(--nebula-danger);
                            color: white;
                            border: none;
                            padding: var(--nebula-space-xs) var(--nebula-space-sm);
                            border-radius: var(--nebula-radius-sm);
                            cursor: pointer;
                            font-size: 10px;
                        ">×</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    setupEventListeners(container) {
        // Tab switching
        container.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchTab(tab, container);
            });
        });

        // Chat tab listeners
        this.setupChatListeners(container);
        
        // Art tab listeners
        this.setupArtListeners(container);
        
        // Code tab listeners
        this.setupCodeListeners(container);
    }

    setupChatListeners(container) {
        const aiProviderSelect = container.querySelector('#aiProviderSelect');
        const newChatBtn = container.querySelector('#newChatBtn');

        if (aiProviderSelect) {
            aiProviderSelect.addEventListener('change', (e) => {
                this.currentAI = e.target.value;
                this.loadChatWebview(container);
            });
        }

        if (newChatBtn) {
            newChatBtn.addEventListener('click', () => {
                this.loadChatWebview(container);
            });
        }

        // Load initial webview
        if (this.activeTab === 'chat') {
            setTimeout(() => this.loadChatWebview(container), 100);
        }
    }

    setupArtListeners(container) {
        const generateBtn = container.querySelector('#generateArtBtn');
        const promptInput = container.querySelector('#artPromptInput');

        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                const prompt = promptInput?.value.trim();
                if (prompt) {
                    this.generateArt(prompt, container);
                }
            });
        }

        if (promptInput) {
            promptInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const prompt = promptInput.value.trim();
                    if (prompt) {
                        this.generateArt(prompt, container);
                    }
                }
            });
        }

        // Art gallery listeners
        this.setupArtGalleryListeners(container);
    }

    setupCodeListeners(container) {
        const newProjectBtn = container.querySelector('#newProjectBtn');
        const saveProjectBtn = container.querySelector('#saveProjectBtn');
        const askAIBtn = container.querySelector('#askAIBtn');
        const explainBtn = container.querySelector('#explainCodeBtn');
        const optimizeBtn = container.querySelector('#optimizeCodeBtn');
        const debugBtn = container.querySelector('#debugCodeBtn');
        const languageSelect = container.querySelector('#languageSelect');

        if (newProjectBtn) {
            newProjectBtn.addEventListener('click', () => {
                this.newCodeProject();
            });
        }

        if (saveProjectBtn) {
            saveProjectBtn.addEventListener('click', () => {
                this.saveCodeProject();
            });
        }

        if (askAIBtn) {
            askAIBtn.addEventListener('click', () => {
                const prompt = container.querySelector('#codePromptInput')?.value.trim();
                if (prompt) {
                    this.askCodeAI(prompt, container);
                }
            });
        }

        if (explainBtn) {
            explainBtn.addEventListener('click', () => {
                this.explainCode(container);
            });
        }

        if (optimizeBtn) {
            optimizeBtn.addEventListener('click', () => {
                this.optimizeCode(container);
            });
        }

        if (debugBtn) {
            debugBtn.addEventListener('click', () => {
                this.debugCode(container);
            });
        }

        if (languageSelect) {
            languageSelect.addEventListener('change', (e) => {
                this.changeEditorLanguage(e.target.value);
            });
        }
    }

    setupArtGalleryListeners(container) {
        container.querySelectorAll('.download-art').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                this.downloadArt(index);
            });
        });

        container.querySelectorAll('.delete-art').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                this.deleteArt(index, container);
            });
        });
    }

    switchTab(tab, container) {
        this.activeTab = tab;

        // Update tab buttons
        container.querySelectorAll('.tab-btn').forEach(btn => {
            const isActive = btn.dataset.tab === tab;
            btn.classList.toggle('active', isActive);
            btn.style.background = isActive ? 'var(--nebula-primary)' : 'transparent';
            btn.style.color = isActive ? 'white' : 'var(--nebula-text-primary)';
        });

        // Update tab panes
        container.querySelectorAll('.tab-pane').forEach(pane => {
            const isActive = pane.id === `${tab}Tab`;
            pane.style.display = isActive ? 'flex' : 'none';
        });

        // Initialize Monaco Editor if switching to code tab
        if (tab === 'code' && !this.monacoEditor) {
            setTimeout(() => this.initializeMonacoEditor(), 100);
        }

        // Load chat webview if switching to chat tab
        if (tab === 'chat') {
            setTimeout(() => this.loadChatWebview(container), 100);
        }
    }

    loadChatWebview(container) {
        const chatContent = container.querySelector('.chat-content');
        const loading = container.querySelector('#chatLoading');
        
        if (!chatContent) return;

        // Show loading
        loading.style.display = 'block';

        // Remove existing webview
        const existingWebview = chatContent.querySelector('webview');
        if (existingWebview) {
            existingWebview.remove();
        }

        // Create new webview
        const webview = document.createElement('webview');
        webview.style.cssText = `
            width: 100%;
            height: 100%;
            border: none;
        `;
        webview.src = this.aiServices[this.currentAI].url;

        webview.addEventListener('dom-ready', () => {
            loading.style.display = 'none';
        });

        chatContent.appendChild(webview);
    }

    async initializeMonacoEditor() {
        const editorContainer = document.getElementById('monacoEditor');
        if (!editorContainer || this.monacoEditor) return;

        try {
            // For demo purposes, we'll create a simple code editor
            // In a real implementation, you would load Monaco Editor from CDN
            editorContainer.innerHTML = `
                <textarea style="
                    width: 100%;
                    height: 100%;
                    border: none;
                    background: #1e1e1e;
                    color: #d4d4d4;
                    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
                    font-size: 14px;
                    padding: var(--nebula-space-md);
                    resize: none;
                    outline: none;
                " placeholder="// Start coding here...
// This is a simplified editor. In production, Monaco Editor would provide:
// - Syntax highlighting
// - IntelliSense
// - Error detection
// - Code formatting
// - And much more...

function helloWorld() {
    console.log('Hello from NebulaDesktop!');
}"></textarea>
            `;

            this.monacoEditor = editorContainer.querySelector('textarea');
            console.log('Monaco Editor initialized (simplified version)');
        } catch (error) {
            console.error('Failed to initialize Monaco Editor:', error);
        }
    }

    async generateArt(prompt, container) {
        const generateBtn = container.querySelector('#generateArtBtn');
        const generating = container.querySelector('#artGenerating');
        const gallery = container.querySelector('#artGallery');
        const provider = container.querySelector('#artProviderSelect')?.value || 'openai';

        // Show generating state
        generateBtn.disabled = true;
        generateBtn.textContent = 'Generating...';
        generating.style.display = 'block';

        try {
            // Simulate API call (in production, this would call actual AI art APIs)
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Create mock generated image
            const mockImage = {
                url: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="%23${Math.floor(Math.random()*16777215).toString(16)}"/><text x="200" y="200" text-anchor="middle" fill="white" font-size="16">Generated: ${prompt.substring(0, 20)}...</text></svg>`,
                prompt: prompt,
                provider: this.artProviders[provider].name,
                timestamp: Date.now()
            };

            this.generatedImages.unshift(mockImage);

            // Update gallery
            gallery.innerHTML = this.renderArtGallery();
            this.setupArtGalleryListeners(container);

            // Clear input
            const promptInput = container.querySelector('#artPromptInput');
            if (promptInput) promptInput.value = '';

        } catch (error) {
            console.error('Art generation failed:', error);
            alert('Failed to generate art. Please try again.');
        } finally {
            // Reset button state
            generateBtn.disabled = false;
            generateBtn.textContent = 'Generate';
            generating.style.display = 'none';
        }
    }

    downloadArt(index) {
        const image = this.generatedImages[index];
        if (!image) return;

        // Create download link
        const link = document.createElement('a');
        link.href = image.url;
        link.download = `ai-art-${Date.now()}.png`;
        link.click();
    }

    deleteArt(index, container) {
        if (confirm('Delete this artwork?')) {
            this.generatedImages.splice(index, 1);
            
            // Update gallery
            const gallery = container.querySelector('#artGallery');
            gallery.innerHTML = this.renderArtGallery();
            this.setupArtGalleryListeners(container);
        }
    }

    async askCodeAI(prompt, container) {
        const suggestions = container.querySelector('#aiSuggestions');
        const askBtn = container.querySelector('#askAIBtn');
        const promptInput = container.querySelector('#codePromptInput');

        askBtn.disabled = true;
        askBtn.textContent = '...';

        try {
            // Simulate AI response
            await new Promise(resolve => setTimeout(resolve, 2000));

            const response = `
                <div style="
                    background: var(--nebula-surface-elevated);
                    border: 1px solid var(--nebula-border);
                    border-radius: var(--nebula-radius-md);
                    padding: var(--nebula-space-md);
                    margin-bottom: var(--nebula-space-md);
                ">
                    <div style="color: var(--nebula-text-primary); font-weight: 500; margin-bottom: var(--nebula-space-sm);">AI Response:</div>
                    <div style="color: var(--nebula-text-secondary); line-height: 1.4;">
                        This is a simulated AI response to: "${prompt}"<br><br>
                        In a production environment, this would connect to actual AI APIs like:
                        <ul style="margin: var(--nebula-space-sm) 0; padding-left: var(--nebula-space-md);">
                            <li>OpenAI GPT-4 for code assistance</li>
                            <li>GitHub Copilot for code completion</li>
                            <li>Claude for code explanation</li>
                            <li>Gemini Pro for code optimization</li>
                        </ul>
                    </div>
                </div>
            `;

            suggestions.innerHTML = response + suggestions.innerHTML;
            promptInput.value = '';

        } catch (error) {
            console.error('AI request failed:', error);
        } finally {
            askBtn.disabled = false;
            askBtn.textContent = 'Ask';
        }
    }

    explainCode(container) {
        this.askCodeAI('Explain the current code', container);
    }

    optimizeCode(container) {
        this.askCodeAI('Optimize this code for better performance', container);
    }

    debugCode(container) {
        this.askCodeAI('Help me debug this code and find potential issues', container);
    }

    changeEditorLanguage(language) {
        // In production, this would change Monaco Editor language
        console.log(`Changed editor language to: ${language}`);
    }

    newCodeProject() {
        if (this.monacoEditor) {
            this.monacoEditor.value = '';
        }
    }

    saveCodeProject() {
        if (this.monacoEditor) {
            const code = this.monacoEditor.value;
            const project = {
                id: Date.now(),
                name: `Project ${this.codeProjects.length + 1}`,
                code: code,
                language: document.querySelector('#languageSelect')?.value || 'javascript',
                timestamp: Date.now()
            };
            
            this.codeProjects.push(project);
            console.log('Project saved:', project);
            alert('Project saved successfully!');
        }
    }

    getTitle() {
        return 'AI Assistant Pro';
    }

    getIcon() {
        return '🤖';
    }

    cleanup() {
        if (this.monacoEditor) {
            // Cleanup Monaco Editor
            this.monacoEditor = null;
        }
        console.log('Enhanced Assistant cleanup');
    }
}

// Export for use in other files
window.NebulaAssistant = NebulaAssistant;

