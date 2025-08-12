// NebulaAssistant.js - AI Assistant Panel for Nebula Desktop
class NebulaAssistant {
    constructor() {
        this.panel = null;
        this.webview = null;
        this.isOpen = false;
        this.currentAI = 'claude'; // Default AI service
        this.isLoading = false;
        
        // AI Services configuration
        this.aiServices = {
            claude: {
                name: 'Claude',
                url: 'https://claude.ai',
                icon: '🧠'
            },
            chatgpt: {
                name: 'ChatGPT',
                url: 'https://chat.openai.com',
                icon: '💬'
            },
            manus: {
                name: 'Manus',
                url: 'https://manus.chat',
                icon: '🤖'
            },
            perplexity: {
                name: 'Perplexity',
                url: 'https://perplexity.ai',
                icon: '🔍'
            },
            copilot: {
                name: 'Copilot',
                url: 'https://copilot.microsoft.com',
                icon: '🚀'
            }
        };
        
        this.init();
    }
    
    /**
     * Initialize the assistant - create button and panel
     */
    init() {
        this.createAssistantButton();
        this.createAssistantPanel();
        this.setupEventListeners();
        this.loadSavedAI();
        
        console.log('NebulaAssistant initialized');
    }
    
    /**
     * Create the assistant button in the taskbar
     */
    createAssistantButton() {
        const taskbar = document.querySelector('.taskbar');
        const startButton = document.querySelector('.start-button');
        
        if (!taskbar || !startButton) {
            console.error('Could not find taskbar or start button');
            return;
        }
        
        const assistantButton = document.createElement('button');
        assistantButton.className = 'assistant-button';
        assistantButton.id = 'assistantBtn';
        assistantButton.innerHTML = `
            <span class="material-symbols-outlined icon">smart_toy</span>
            <span>AI</span>
        `;
        assistantButton.title = 'AI Assistant';
        
        // Insert after the start button
        startButton.insertAdjacentElement('afterend', assistantButton);
        
        console.log('Assistant button created');
    }
    
    /**
     * Create the assistant panel
     */
    createAssistantPanel() {
        this.panel = document.createElement('div');
        this.panel.className = 'assistant-panel hidden';
        this.panel.id = 'assistantPanel';
        
        this.panel.innerHTML = `
            <div class="assistant-header">
                <div class="assistant-title">
                    <span class="material-symbols-outlined icon">smart_toy</span>
                    AI Assistant
                </div>
                <select class="ai-selector" id="aiSelector">
                    ${Object.entries(this.aiServices).map(([key, service]) => `
                        <option value="${key}" ${key === this.currentAI ? 'selected' : ''}>
                            ${service.icon} ${service.name}
                        </option>
                    `).join('')}
                </select>
            </div>
            <div class="assistant-content" id="assistantContent">
                <div class="assistant-loading" id="assistantLoading">
                    <span class="material-symbols-outlined icon">autorenew</span>
                    Loading AI service...
                </div>
                <!-- Webview will be added here -->
            </div>
            <div class="assistant-footer">
                <div class="status" id="assistantStatus">Ready</div>
                <div class="controls">
                    <button id="refreshAI" title="Refresh">
                        <span class="material-symbols-outlined">refresh</span>
                    </button>
                    <button id="newChat" title="New Chat">
                        <span class="material-symbols-outlined">add</span>
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.panel);
        console.log('Assistant panel created');
    }
    
    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // Assistant button click
        const assistantBtn = document.getElementById('assistantBtn');
        assistantBtn?.addEventListener('click', () => {
            this.togglePanel();
        });
        
        // AI service selector
        const aiSelector = document.getElementById('aiSelector');
        aiSelector?.addEventListener('change', (e) => {
            this.switchAI(e.target.value);
        });
        
        // Footer controls
        const refreshBtn = document.getElementById('refreshAI');
        refreshBtn?.addEventListener('click', () => {
            this.refreshWebview();
        });
        
        const newChatBtn = document.getElementById('newChat');
        newChatBtn?.addEventListener('click', () => {
            this.startNewChat();
        });
        
        // Click outside to close panel
        document.addEventListener('click', (e) => {
            if (this.panel && !this.panel.contains(e.target) && 
                !e.target.closest('#assistantBtn') && 
                !this.panel.classList.contains('hidden')) {
                this.hidePanel();
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Alt + A - Toggle AI Assistant
            if (e.altKey && e.key === 'a') {
                e.preventDefault();
                this.togglePanel();
            }
            
            // Escape - Close panel
            if (e.key === 'Escape' && this.isOpen) {
                this.hidePanel();
            }
        });
        
        console.log('Assistant event listeners set up');
    }
    
    /**
     * Toggle the assistant panel visibility
     */
    togglePanel() {
        if (this.isOpen) {
            this.hidePanel();
        } else {
            this.showPanel();
        }
    }
    
    /**
     * Show the assistant panel
     */
    showPanel() {
        if (!this.panel) return;
        
        // Hide launcher if it's open
        const launcher = document.querySelector('.launcher');
        if (launcher && !launcher.classList.contains('hidden')) {
            launcher.classList.add('hidden');
        }
        
        this.panel.classList.remove('hidden');
        this.isOpen = true;
        
        // Load webview if not already loaded
        if (!this.webview) {
            this.createWebview();
        }
        
        // Update status
        this.updateStatus('Active');
        
        console.log('Assistant panel shown');
    }
    
    /**
     * Hide the assistant panel
     */
    hidePanel() {
        if (!this.panel) return;
        
        this.panel.classList.add('hidden');
        this.isOpen = false;
        
        // Update status
        this.updateStatus('Ready');
        
        console.log('Assistant panel hidden');
    }
    
    /**
     * Create the webview for the current AI service
     */
    createWebview() {
        const content = document.getElementById('assistantContent');
        const loading = document.getElementById('assistantLoading');
        
        if (!content) return;
        
        // Show loading
        if (loading) {
            loading.style.display = 'block';
        }
        this.isLoading = true;
        
        // Remove existing webview
        if (this.webview) {
            this.webview.remove();
            this.webview = null;
        }
        
        // Create new webview
        this.webview = document.createElement('webview');
        this.webview.className = 'assistant-webview';
        this.webview.id = 'assistantWebview';
        
        const currentService = this.aiServices[this.currentAI];
        this.webview.src = currentService.url;
        
        // Set up webview event listeners
        this.setupWebviewListeners();
        
        // Add to DOM
        content.appendChild(this.webview);
        
        console.log(`Created webview for ${currentService.name}`);
    }
    
    /**
     * Set up webview event listeners
     */
    setupWebviewListeners() {
        if (!this.webview) return;
        
        this.webview.addEventListener('dom-ready', () => {
            this.hideLoading();
            this.updateStatus(`Connected to ${this.aiServices[this.currentAI].name}`);
            console.log('Webview loaded');
        });
        
        this.webview.addEventListener('did-start-loading', () => {
            this.showLoading();
            this.updateStatus('Loading...');
        });
        
        this.webview.addEventListener('did-stop-loading', () => {
            this.hideLoading();
            this.updateStatus(`Connected to ${this.aiServices[this.currentAI].name}`);
        });
        
        this.webview.addEventListener('did-fail-load', (e) => {
            this.hideLoading();
            this.updateStatus('Failed to load');
            console.error('Webview failed to load:', e);
        });
        
        this.webview.addEventListener('page-title-updated', (e) => {
            console.log('Page title updated:', e.title);
        });
        
        // Handle new windows (open in external browser)
        this.webview.addEventListener('new-window', (e) => {
            e.preventDefault();
            // Could open in Nebula browser or external browser
            console.log('New window requested:', e.url);
        });
    }
    
    /**
     * Switch to a different AI service
     */
    switchAI(aiKey) {
        if (!this.aiServices[aiKey]) {
            console.error('Unknown AI service:', aiKey);
            return;
        }
        
        this.currentAI = aiKey;
        this.saveAIPreference();
        
        // Recreate webview with new service
        if (this.isOpen) {
            this.createWebview();
        }
        
        console.log(`Switched to ${this.aiServices[aiKey].name}`);
    }
    
    /**
     * Refresh the current webview
     */
    refreshWebview() {
        if (this.webview && this.webview.reload) {
            this.webview.reload();
            this.updateStatus('Refreshing...');
        } else if (this.webview) {
            // Fallback: recreate webview
            this.createWebview();
        }
    }
    
    /**
     * Start a new chat (refresh the page)
     */
    startNewChat() {
        this.refreshWebview();
    }
    
    /**
     * Show loading state
     */
    showLoading() {
        const loading = document.getElementById('assistantLoading');
        if (loading) {
            loading.style.display = 'block';
        }
        this.isLoading = true;
    }
    
    /**
     * Hide loading state
     */
    hideLoading() {
        const loading = document.getElementById('assistantLoading');
        if (loading) {
            loading.style.display = 'none';
        }
        this.isLoading = false;
    }
    
    /**
     * Update status text
     */
    updateStatus(status) {
        const statusElement = document.getElementById('assistantStatus');
        if (statusElement) {
            statusElement.textContent = status;
        }
    }
    
    /**
     * Save AI preference to localStorage
     */
    saveAIPreference() {
        try {
            localStorage.setItem('nebula-ai-service', this.currentAI);
        } catch (error) {
            console.warn('Could not save AI preference:', error);
        }
    }
    
    /**
     * Load saved AI preference
     */
    loadSavedAI() {
        try {
            const saved = localStorage.getItem('nebula-ai-service');
            if (saved && this.aiServices[saved]) {
                this.currentAI = saved;
                
                // Update selector
                const selector = document.getElementById('aiSelector');
                if (selector) {
                    selector.value = saved;
                }
            }
        } catch (error) {
            console.warn('Could not load AI preference:', error);
        }
    }
    
    /**
     * Clean up resources
     */
    destroy() {
        if (this.webview) {
            this.webview.remove();
            this.webview = null;
        }
        
        if (this.panel) {
            this.panel.remove();
            this.panel = null;
        }
        
        console.log('NebulaAssistant destroyed');
    }
}

// Make NebulaAssistant available globally
window.NebulaAssistant = NebulaAssistant;