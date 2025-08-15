// art-assistant.js - With Webview Integration like main assistant
class NebulaArtAssistant {
    constructor() {
        this.windowId = null;
        this.webview = null;
        this.currentAIService = 'dalle';
        this.galleryImages = [];
        
        // AI Art Services - using webviews like main assistant
        this.aiServices = {
            dalle: {
                name: 'DALL-E',
                url: 'https://openai.com/dall-e-2/',
                icon: '🤖'
            },
            midjourney: {
                name: 'Midjourney',
                url: 'https://www.midjourney.com/',
                icon: '🎭'
            },
            stablediffusion: {
                name: 'Stable Diffusion',
                url: 'https://stability.ai/',
                icon: '⚡'
            },
            leonardo: {
                name: 'Leonardo AI',
                url: 'https://leonardo.ai/',
                icon: '🎨'
            },
            firefly: {
                name: 'Adobe Firefly',
                url: 'https://firefly.adobe.com/',
                icon: '🔥'
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
            title: '🎨 Art Assistant',
            width: 1000,
            height: 700,
            resizable: true,
            maximizable: true,
            minimizable: true,
            hasTabBar: false
        });
        
        window.windowManager.loadApp(this.windowId, this);
        console.log(`Art Assistant initialized with window ${this.windowId}`);
    }
    
    render() {
        const container = document.createElement('div');
        container.className = 'art-assistant-container';
        container.style.cssText = `
            height: 100%;
            display: flex;
            flex-direction: column;
            background: var(--nebula-bg-primary);
            font-family: var(--nebula-font-family);
        `;
        
        // Header with AI service selector and tools
        const header = document.createElement('div');
        header.className = 'art-header';
        header.style.cssText = `
            padding: 16px;
            border-bottom: 1px solid var(--nebula-border);
            background: var(--nebula-surface);
            flex-shrink: 0;
        `;
        
        header.innerHTML = `
            <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 12px;">
                <select id="aiServiceSelector-${this.windowId}" style="
                    padding: 6px 12px;
                    border: 1px solid var(--nebula-border);
                    border-radius: var(--nebula-radius-sm);
                    background: var(--nebula-bg-primary);
                    color: var(--nebula-text-primary);
                    min-width: 140px;
                ">
                    ${Object.entries(this.aiServices).map(([key, service]) => `
                        <option value="${key}" ${key === this.currentAIService ? 'selected' : ''}>
                            ${service.icon} ${service.name}
                        </option>
                    `).join('')}
                </select>
                
                <button id="refreshArt-${this.windowId}" style="
                    background: var(--nebula-info);
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    border-radius: var(--nebula-radius-sm);
                    cursor: pointer;
                    font-size: 12px;
                ">🔄 Refresh</button>
                
                <button id="newArtChat-${this.windowId}" style="
                    background: var(--nebula-success);
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    border-radius: var(--nebula-radius-sm);
                    cursor: pointer;
                    font-size: 12px;
                ">➕ New Chat</button>
                
                <button id="toggleGallery-${this.windowId}" style="
                    background: var(--nebula-secondary);
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    border-radius: var(--nebula-radius-sm);
                    cursor: pointer;
                    font-size: 12px;
                ">🖼️ Gallery</button>
            </div>
            
            <!-- Prompt Input -->
            <div style="display: flex; gap: 12px; align-items: center;">
                <input type="text" placeholder="Describe the art you want to create..." 
                       id="artPrompt-${this.windowId}" style="
                    flex: 1;
                    padding: 8px 12px;
                    border: 1px solid var(--nebula-border);
                    border-radius: var(--nebula-radius-md);
                    background: var(--nebula-bg-primary);
                    color: var(--nebula-text-primary);
                ">
                <button id="generateArt-${this.windowId}" style="
                    background: var(--nebula-primary);
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: var(--nebula-radius-md);
                    cursor: pointer;
                    font-weight: 500;
                ">🎨 Generate</button>
            </div>
        `;
        
        // Main content area - either webview or gallery
        const contentArea = document.createElement('div');
        contentArea.className = 'art-content';
        contentArea.id = `artContent-${this.windowId}`;
        contentArea.style.cssText = `
            flex: 1;
            position: relative;
            overflow: hidden;
            background: var(--nebula-bg-primary);
        `;
        
        // Loading indicator
        const loading = document.createElement('div');
        loading.id = `artLoading-${this.windowId}`;
        loading.className = 'art-loading';
        loading.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: var(--nebula-text-secondary);
            font-size: 14px;
            text-align: center;
            z-index: 10;
            display: none;
        `;
        loading.innerHTML = `
            <span class="material-symbols-outlined" style="font-size: 32px; margin-bottom: 8px; display: block; animation: spin 2s linear infinite;">autorenew</span>
            Loading AI art service...
        `;
        
        contentArea.appendChild(loading);
        
        container.appendChild(header);
        container.appendChild(contentArea);
        
        // Set up event listeners and create initial webview
        setTimeout(() => {
            this.setupEventListeners();
            this.createWebview();
        }, 0);
        
        return container;
    }
    
    setupEventListeners() {
        // AI service selector
        const aiSelector = document.getElementById(`aiServiceSelector-${this.windowId}`);
        aiSelector?.addEventListener('change', (e) => {
            this.switchAIService(e.target.value);
        });
        
        // Control buttons
        document.getElementById(`refreshArt-${this.windowId}`)?.addEventListener('click', () => {
            this.refreshWebview();
        });
        
        document.getElementById(`newArtChat-${this.windowId}`)?.addEventListener('click', () => {
            this.startNewChat();
        });
        
        document.getElementById(`toggleGallery-${this.windowId}`)?.addEventListener('click', () => {
            this.toggleGallery();
        });
        
        // Generate button and prompt
        const generateBtn = document.getElementById(`generateArt-${this.windowId}`);
        const promptInput = document.getElementById(`artPrompt-${this.windowId}`);
        
        generateBtn?.addEventListener('click', () => {
            const prompt = promptInput?.value.trim();
            if (prompt) {
                this.generateArt(prompt);
            }
        });
        
        promptInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const prompt = promptInput.value.trim();
                if (prompt) {
                    this.generateArt(prompt);
                }
            }
        });
    }
    
    /**
     * Create webview for AI service (like main assistant)
     */
    createWebview() {
        const content = document.getElementById(`artContent-${this.windowId}`);
        if (!content) return;
        
        this.showLoading();
        
        // Remove existing webview
        if (this.webview) {
            this.webview.remove();
            this.webview = null;
        }
        
        // Create new webview
        this.webview = document.createElement('webview');
        this.webview.className = 'art-webview';
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
        
        console.log(`Created art webview for ${currentService.name}`);
    }
    
    /**
     * Set up webview event listeners (copied from main assistant pattern)
     */
    setupWebviewListeners() {
        if (!this.webview) return;
        
        this.webview.addEventListener('dom-ready', () => {
            this.hideLoading();
            console.log('Art webview loaded');
        });
        
        this.webview.addEventListener('did-start-loading', () => {
            this.showLoading();
        });
        
        this.webview.addEventListener('did-stop-loading', () => {
            this.hideLoading();
        });
        
        this.webview.addEventListener('did-fail-load', (e) => {
            this.hideLoading();
            console.error('Art webview failed to load:', e);
        });
        
        this.webview.addEventListener('new-window', (e) => {
            e.preventDefault();
            console.log('New window requested:', e.url);
        });
    }
    
    /**
     * Switch AI service (like main assistant)
     */
    switchAIService(serviceKey) {
        if (!this.aiServices[serviceKey]) {
            console.error('Unknown AI service:', serviceKey);
            return;
        }
        
        this.currentAIService = serviceKey;
        
        // Update window title
        if (window.windowManager) {
            window.windowManager.setWindowTitle(this.windowId, `🎨 Art Assistant - ${this.aiServices[serviceKey].name}`);
        }
        
        // Recreate webview with new service
        this.createWebview();
        
        console.log(`Switched to ${this.aiServices[serviceKey].name}`);
    }
    
    /**
     * Refresh webview
     */
    refreshWebview() {
        if (this.webview) {
            this.showLoading();
            this.webview.reload();
        }
    }
    
    /**
     * Start new chat
     */
    startNewChat() {
        if (this.webview) {
            // Navigate to new chat or refresh
            const currentService = this.aiServices[this.currentAIService];
            this.webview.src = currentService.url;
        }
    }
    
    /**
     * Show/hide loading indicator
     */
    showLoading() {
        const loading = document.getElementById(`artLoading-${this.windowId}`);
        if (loading) loading.style.display = 'block';
    }
    
    hideLoading() {
        const loading = document.getElementById(`artLoading-${this.windowId}`);
        if (loading) loading.style.display = 'none';
    }
    
    /**
     * Generate art (adds to gallery)
     */
    generateArt(prompt) {
        console.log(`Generating art: "${prompt}"`);
        
        // Add to gallery
        const imageData = {
            id: Date.now(),
            prompt: prompt,
            timestamp: new Date().toLocaleString(),
            service: this.aiServices[this.currentAIService].name,
            placeholder: true
        };
        
        this.galleryImages.unshift(imageData);
        
        // Show notification (could enhance this)
        console.log(`Added "${prompt}" to gallery for ${imageData.service}`);
    }
    
    /**
     * Toggle between webview and gallery
     */
    toggleGallery() {
        const content = document.getElementById(`artContent-${this.windowId}`);
        if (!content) return;
        
        // Check if currently showing gallery
        const galleryView = content.querySelector('.art-gallery-view');
        
        if (galleryView) {
            // Switch back to webview
            this.createWebview();
        } else {
            // Show gallery
            this.showGallery();
        }
    }
    
    /**
     * Show gallery view
     */
    showGallery() {
        const content = document.getElementById(`artContent-${this.windowId}`);
        if (!content) return;
        
        // Remove webview
        if (this.webview) {
            this.webview.remove();
            this.webview = null;
        }
        
        // Create gallery view
        const galleryView = document.createElement('div');
        galleryView.className = 'art-gallery-view';
        galleryView.style.cssText = `
            width: 100%;
            height: 100%;
            overflow-y: auto;
            padding: 16px;
        `;
        
        if (this.galleryImages.length === 0) {
            galleryView.innerHTML = `
                <div style="
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--nebula-text-secondary);
                    text-align: center;
                ">
                    <div>
                        <div style="font-size: 64px; margin-bottom: 16px;">🎨</div>
                        <h3 style="margin: 0 0 12px 0; color: var(--nebula-text-primary);">No Art Generated Yet</h3>
                        <p style="margin: 0;">Use the prompt above to generate art and it will appear here!</p>
                    </div>
                </div>
            `;
        } else {
            galleryView.innerHTML = `
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 16px;">
                    ${this.galleryImages.map((image, index) => `
                        <div style="
                            background: var(--nebula-surface);
                            border: 1px solid var(--nebula-border);
                            border-radius: var(--nebula-radius-lg);
                            overflow: hidden;
                            transition: transform 0.2s ease;
                        " onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform='translateY(0)'">
                            <div style="
                                height: 200px;
                                background: linear-gradient(135deg, var(--nebula-primary), var(--nebula-secondary));
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                color: white;
                                font-size: 48px;
                            ">
                                🎨
                            </div>
                            <div style="padding: 12px;">
                                <div style="font-size: 12px; color: var(--nebula-text-secondary); margin-bottom: 6px;">
                                    ${image.timestamp} • ${image.service}
                                </div>
                                <div style="font-size: 13px; color: var(--nebula-text-primary); line-height: 1.4;">
                                    "${image.prompt}"
                                </div>
                                <div style="margin-top: 8px; display: flex; gap: 6px;">
                                    <button onclick="navigator.clipboard.writeText('${image.prompt.replace(/'/g, "\\'")}'); alert('Prompt copied!');" style="
                                        flex: 1;
                                        background: var(--nebula-info);
                                        color: white;
                                        border: none;
                                        padding: 4px 8px;
                                        border-radius: var(--nebula-radius-sm);
                                        cursor: pointer;
                                        font-size: 11px;
                                    ">📋 Copy</button>
                                    <button onclick="window.nebulaArtAssistant.removeImage('${image.id}')" style="
                                        background: var(--nebula-danger);
                                        color: white;
                                        border: none;
                                        padding: 4px 8px;
                                        border-radius: var(--nebula-radius-sm);
                                        cursor: pointer;
                                        font-size: 11px;
                                    ">🗑️</button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        content.appendChild(galleryView);
    }
    
    /**
     * Remove image from gallery
     */
    removeImage(imageId) {
        this.galleryImages = this.galleryImages.filter(img => img.id != imageId);
        
        // Refresh gallery if currently showing
        const galleryView = document.querySelector(`#artContent-${this.windowId} .art-gallery-view`);
        if (galleryView) {
            this.showGallery();
        }
        
        console.log(`Removed image: ${imageId}`);
    }
    
    /**
     * WindowManager interface methods
     */
    getTitle() {
        return '🎨 Art Assistant';
    }
    
    getIcon() {
        return '🎨';
    }
    
    cleanup() {
        if (this.webview) {
            this.webview.remove();
            this.webview = null;
        }
        this.windowId = null;
        console.log('Art Assistant cleaned up');
    }
}

// Add required CSS animations
if (!document.getElementById('art-assistant-styles')) {
    const styles = document.createElement('style');
    styles.id = 'art-assistant-styles';
    styles.textContent = `
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(styles);
}

// Export for global use
window.NebulaArtAssistant = NebulaArtAssistant;

// Global instance manager for gallery operations
window.nebulaArtAssistant = {
    removeImage(imageId) {
        // Find active instance and call method
        const instances = Array.from(document.querySelectorAll('.art-assistant-container'));
        instances.forEach(container => {
            const windowId = container.closest('.nebula-window')?.id;
            if (windowId && window.windowManager.windows.has(windowId)) {
                const windowData = window.windowManager.windows.get(windowId);
                if (windowData.app && windowData.app.removeImage) {
                    windowData.app.removeImage(imageId);
                }
            }
        });
    }
};