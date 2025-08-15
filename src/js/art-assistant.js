// art-assistant.js - Standalone Art Assistant
class NebulaArtAssistant {
    constructor() {
        this.windowId = null;
        this.galleryImages = [];
    }
    
    /**
     * Launch the Art Assistant window
     */
    launch() {
        console.log('Launching Art Assistant...');
        
        if (!window.windowManager) {
            console.error('WindowManager not available');
            return null;
        }
        
        // Close existing window if open
        if (this.windowId) {
            window.windowManager.closeWindow(this.windowId);
            this.windowId = null;
        }
        
        this.windowId = window.windowManager.createWindow({
            title: '🎨 Art Assistant',
            width: 900,
            height: 700,
            x: 100,
            y: 100,
            resizable: true,
            maximizable: true,
            minimizable: true
        });
        
        const windowData = window.windowManager.getWindow(this.windowId);
        if (!windowData) {
            console.error('Failed to get window data');
            return null;
        }
        
        this.setupInterface(windowData.element);
        this.setupEventListeners();
        
        return this.windowId;
    }
    
    /**
     * Set up the art assistant interface
     */
    setupInterface(windowElement) {
        const contentArea = windowElement.querySelector('.window-content');
        contentArea.innerHTML = `
            <div class="art-assistant-container" style="
                height: 100%;
                display: flex;
                flex-direction: column;
                background: var(--nebula-bg-primary);
                font-family: var(--nebula-font-family);
            ">
                <!-- Art Generation Toolbar -->
                <div class="art-toolbar" style="
                    padding: 16px;
                    border-bottom: 1px solid var(--nebula-border);
                    background: var(--nebula-surface);
                ">
                    <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 12px;">
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
                    
                    <!-- Quick Access Buttons -->
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <button id="openDallE-${this.windowId}" style="
                            background: var(--nebula-info);
                            color: white;
                            border: none;
                            padding: 6px 12px;
                            border-radius: var(--nebula-radius-sm);
                            cursor: pointer;
                            font-size: 12px;
                        ">🤖 DALL-E</button>
                        <button id="openMidjourney-${this.windowId}" style="
                            background: var(--nebula-secondary);
                            color: white;
                            border: none;
                            padding: 6px 12px;
                            border-radius: var(--nebula-radius-sm);
                            cursor: pointer;
                            font-size: 12px;
                        ">🎭 Midjourney</button>
                        <button id="openStableDiffusion-${this.windowId}" style="
                            background: var(--nebula-success);
                            color: white;
                            border: none;
                            padding: 6px 12px;
                            border-radius: var(--nebula-radius-sm);
                            cursor: pointer;
                            font-size: 12px;
                        ">⚡ Stable Diffusion</button>
                        <button id="clearGallery-${this.windowId}" style="
                            background: var(--nebula-danger);
                            color: white;
                            border: none;
                            padding: 6px 12px;
                            border-radius: var(--nebula-radius-sm);
                            cursor: pointer;
                            font-size: 12px;
                        ">🗑️ Clear Gallery</button>
                    </div>
                </div>
                
                <!-- Art Content Area -->
                <div class="art-content" id="artContent-${this.windowId}" style="
                    flex: 1;
                    overflow: auto;
                    padding: 16px;
                ">
                    ${this.renderPlaceholder()}
                </div>
            </div>
        `;
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Generate button
        const generateBtn = document.getElementById(`generateArt-${this.windowId}`);
        const promptInput = document.getElementById(`artPrompt-${this.windowId}`);
        
        if (generateBtn && promptInput) {
            generateBtn.addEventListener('click', () => {
                const prompt = promptInput.value.trim();
                if (prompt) {
                    this.generateArtwork(prompt);
                }
            });
            
            promptInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const prompt = promptInput.value.trim();
                    if (prompt) {
                        this.generateArtwork(prompt);
                    }
                }
            });
        }
        
        // Service buttons
        document.getElementById(`openDallE-${this.windowId}`)?.addEventListener('click', () => {
            this.openArtService('https://openai.com/dall-e-2/', 'DALL-E');
        });
        
        document.getElementById(`openMidjourney-${this.windowId}`)?.addEventListener('click', () => {
            this.openArtService('https://www.midjourney.com/', 'Midjourney');
        });
        
        document.getElementById(`openStableDiffusion-${this.windowId}`)?.addEventListener('click', () => {
            this.openArtService('https://stability.ai/', 'Stable Diffusion');
        });
        
        document.getElementById(`clearGallery-${this.windowId}`)?.addEventListener('click', () => {
            this.clearGallery();
        });
    }
    
    /**
     * Render placeholder content
     */
    renderPlaceholder() {
        return `
            <div class="art-placeholder" style="
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: var(--nebula-text-secondary);
                text-align: center;
            ">
                <div>
                    <div style="font-size: 64px; margin-bottom: 16px;">🎨</div>
                    <h3 style="margin: 0 0 12px 0; color: var(--nebula-text-primary);">Art Assistant Ready</h3>
                    <p style="margin: 0 0 20px 0;">Enter a description above and click Generate, or use the quick access buttons</p>
                    
                    <div style="margin-top: 24px; padding: 16px; background: var(--nebula-surface); border-radius: var(--nebula-radius-lg); max-width: 400px; margin-left: auto; margin-right: auto;">
                        <h4 style="margin: 0 0 12px 0; color: var(--nebula-text-primary);">💡 Pro Tips:</h4>
                        <div style="font-size: 12px; color: var(--nebula-text-secondary); text-align: left;">
                            • Try: "A futuristic cityscape at sunset"<br>
                            • Style: "Abstract geometric patterns in blue and gold"<br>
                            • Mood: "Peaceful forest scene with magical lighting"<br>
                            • Character: "Cyberpunk warrior in neon armor"
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Generate artwork (placeholder for now)
     */
    generateArtwork(prompt) {
        console.log(`Generating artwork: "${prompt}"`);
        
        const artContent = document.getElementById(`artContent-${this.windowId}`);
        if (!artContent) return;
        
        // Show loading state
        artContent.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--nebula-text-secondary);">
                <div style="font-size: 48px; margin-bottom: 16px; animation: pulse 2s infinite;">🎨</div>
                <h3 style="color: var(--nebula-text-primary); margin-bottom: 12px;">Generating Art...</h3>
                <p><strong>Prompt:</strong> "${prompt}"</p>
                
                <div style="margin: 20px 0;">
                    <div style="width: 300px; height: 4px; background: var(--nebula-surface); border-radius: 2px; margin: 0 auto; overflow: hidden;">
                        <div style="width: 100%; height: 100%; background: var(--nebula-primary); animation: loading 2s infinite;"></div>
                    </div>
                </div>
                
                <div style="font-size: 12px; margin-top: 24px; padding: 16px; background: var(--nebula-surface); border-radius: var(--nebula-radius-md); max-width: 400px; margin-left: auto; margin-right: auto;">
                    <p><strong>🚀 Next Steps:</strong></p>
                    <p>This would connect to an AI art service like DALL-E or Midjourney.</p>
                    <p>For now, use the quick access buttons above to open art services directly!</p>
                </div>
            </div>
        `;
        
        // Simulate generation completion
        setTimeout(() => {
            this.addGeneratedImage(prompt);
        }, 3000);
    }
    
    /**
     * Add a "generated" image to the gallery
     */
    addGeneratedImage(prompt) {
        const imageData = {
            id: Date.now(),
            prompt: prompt,
            timestamp: new Date().toLocaleString(),
            placeholder: true
        };
        
        this.galleryImages.unshift(imageData);
        this.renderGallery();
    }
    
    /**
     * Render the image gallery
     */
    renderGallery() {
        const artContent = document.getElementById(`artContent-${this.windowId}`);
        if (!artContent) return;
        
        if (this.galleryImages.length === 0) {
            artContent.innerHTML = this.renderPlaceholder();
            return;
        }
        
        artContent.innerHTML = `
            <div class="art-gallery" style="
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                gap: 16px;
                padding: 16px;
            ">
                ${this.galleryImages.map(image => `
                    <div class="art-item" style="
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
                                ${image.timestamp}
                            </div>
                            <div style="font-size: 13px; color: var(--nebula-text-primary); line-height: 1.4;">
                                "${image.prompt}"
                            </div>
                            <div style="margin-top: 8px; display: flex; gap: 6px;">
                                <button onclick="navigator.clipboard.writeText('${image.prompt}')" style="
                                    flex: 1;
                                    background: var(--nebula-info);
                                    color: white;
                                    border: none;
                                    padding: 4px 8px;
                                    border-radius: var(--nebula-radius-sm);
                                    cursor: pointer;
                                    font-size: 11px;
                                ">📋 Copy Prompt</button>
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
    
    /**
     * Open an art service
     */
    openArtService(url, serviceName) {
        console.log(`Opening ${serviceName}...`);
        window.open(url, '_blank');
        
        // Show feedback
        const artContent = document.getElementById(`artContent-${this.windowId}`);
        if (artContent && this.galleryImages.length === 0) {
            artContent.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--nebula-text-secondary);">
                    <div style="font-size: 48px; margin-bottom: 16px;">🚀</div>
                    <h3 style="color: var(--nebula-text-primary);">Opening ${serviceName}...</h3>
                    <p>The service will open in a new browser tab.</p>
                    <div style="margin-top: 20px;">
                        <button onclick="window.nebulaArtAssistant.renderGallery()" style="
                            background: var(--nebula-primary);
                            color: white;
                            border: none;
                            padding: 8px 16px;
                            border-radius: var(--nebula-radius-md);
                            cursor: pointer;
                        ">← Back to Art Assistant</button>
                    </div>
                </div>
            `;
        }
    }
    
    /**
     * Clear the gallery
     */
    clearGallery() {
        if (this.galleryImages.length === 0) return;
        
        if (confirm(`Clear all ${this.galleryImages.length} generated images?`)) {
            this.galleryImages = [];
            this.renderGallery();
            console.log('Art gallery cleared');
        }
    }
    
    /**
     * Remove a specific image
     */
    removeImage(imageId) {
        this.galleryImages = this.galleryImages.filter(img => img.id != imageId);
        this.renderGallery();
        console.log(`Removed image: ${imageId}`);
    }
    
    /**
     * Clean up when window is closed
     */
    cleanup() {
        this.windowId = null;
        console.log('Art Assistant cleaned up');
    }
}

// CSS animations
const artAssistantStyles = `
    <style>
    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }
    
    @keyframes loading {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(200%); }
    }
    </style>
`;

// Add styles to document if not already added
if (!document.querySelector('#art-assistant-styles')) {
    const styleEl = document.createElement('div');
    styleEl.id = 'art-assistant-styles';
    styleEl.innerHTML = artAssistantStyles;
    document.head.appendChild(styleEl);
}

// Export for global use
window.NebulaArtAssistant = NebulaArtAssistant;
window.nebulaArtAssistant = new NebulaArtAssistant();