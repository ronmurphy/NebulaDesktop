// WindowManagerCapsule.js - Enhanced with Capsule Preview System
// Clean version replacing titlebar-only mode with advanced capsule functionality
class WindowManager {
    constructor() {
        this.windows = new Map(); // windowId -> windowData
        this.activeWindow = null;
        this.nextId = 1;
        this.zIndexCounter = 100;

        // Available desktop area (accounts for pinned panels, taskbars, etc.)
        this.availableArea = {
            x: 0,
            y: 0,
            width: window.innerWidth,
            height: window.innerHeight - 50 // Default: full screen minus taskbar
        };

        // Snap system configuration and state
        this.snapSystem = {
            isEnabled: true,
            previewElement: null,
            currentZone: null,
            hoverTimer: null,
            hoverDelay: 800, // ms to show preview
            snapThreshold: 50, // px from edge to trigger
            animationDuration: 300, // ms for snap animation
            previewOpacity: 0.3,
            cornerSize: 100,
            edgeSize: 50,
            isDragging: false,
            draggedWindow: null,
            dragOffset: { x: 0, y: 0 }
        };

        // NEW: Capsule Preview System (replaces titlebar-only mode)
        this.capsuleSystem = {
            isEnabled: true,
            windows: new Set(), // Set of windowIds in capsule mode
            zIndexBase: 99999, // High z-index for capsule windows
            animationDuration: 400, // ms for mode transitions
            minWidth: 200, // minimum capsule width
            maxWidth: 400, // maximum capsule width
            titlebarHeight: 40, // standard titlebar height
            previewHeight: 80, // preview area height
            autoPosition: true, // automatically position to avoid overlap
            refreshInterval: null, // auto-refresh timer
            autoRefreshEnabled: false, // auto-refresh previews
            autoRefreshDelay: 30000 // 30 seconds
        };

        // NEW: Screenshot and preview management
        this.windowScreenshots = new Map(); // windowId -> screenshot data
        this.isCapturingScreenshots = false;
        this.screenshotQueue = [];

        this.initializeSnapSystem();
        this.setupGlobalListeners();
        this.setupCapsuleHotkeys(); // NEW: Capsule hotkeys

        // Listen for window resize to update available area
        window.addEventListener('resize', () => {
            this.updateAvailableArea(
                this.availableArea.x,
                window.innerWidth - this.availableArea.width - this.availableArea.x,
                this.availableArea.y,
                window.innerHeight - this.availableArea.height - this.availableArea.y
            );
            this.updateSnapZones();
        });
    }

    // ===== CORE WINDOW MANAGEMENT (Preserved from original) =====

    /**
     * Creates a new window that can host apps
     */
    createWindow(options = {}) {
        const windowId = `window-${this.nextId++}`;

        const config = {
            title: options.title || 'Nebula Window',
            width: options.width || 800,
            height: options.height || 600,
            x: options.x || this.calculateDefaultPosition().x,
            y: options.y || this.calculateDefaultPosition().y,
            resizable: options.resizable !== false,
            maximizable: options.maximizable !== false,
            minimizable: options.minimizable !== false,
            hasTabBar: options.hasTabBar || false,
            icon: options.icon || '🪟',
            ...options
        };

        const windowElement = this.createWindowElement(windowId, config);
        document.getElementById('desktop').appendChild(windowElement);

        const windowData = {
            id: windowId,
            element: windowElement,
            config: config,
            isMaximized: false,
            isMinimized: false,
            isCapsule: false, // NEW: Track capsule state
            savedPosition: null,
            savedSize: null,
            tabs: new Map(),
            activeTab: null,
            app: null,
            capsuleState: null // NEW: Store capsule state
        };

        this.windows.set(windowId, windowData);
        this.setupWindowEventListeners(windowId);
        this.focusWindow(windowId);

        console.log(`✅ Window created: ${windowId}`, config);
        return windowId;
    }

    /**
     * Create window DOM element
     */
    createWindowElement(windowId, config) {
        const windowElement = document.createElement('div');
        windowElement.className = 'nebula-window';
        windowElement.id = windowId;
        windowElement.style.cssText = `
            position: absolute;
            width: ${config.width}px;
            height: ${config.height}px;
            left: ${config.x}px;
            top: ${config.y}px;
            z-index: ${++this.zIndexCounter};
        `;

        const iconHtml = this.generateIconHtml(config.icon);
        
        windowElement.innerHTML = `
            <div class="window-titlebar" data-window-id="${windowId}">
                ${iconHtml}
                <div class="window-title">${config.title}</div>
                <div class="window-controls">
                    <button class="window-btn minimize" data-action="minimize" data-window-id="${windowId}" title="Minimize">
                        <span class="material-symbols-outlined">minimize</span>
                    </button>
                    <button class="window-btn capsule" data-action="capsule" data-window-id="${windowId}" title="Capsule Mode">
                        <span class="material-symbols-outlined">picture_in_picture_alt</span>
                    </button>
                    <button class="window-btn maximize" data-action="maximize" data-window-id="${windowId}" title="Maximize">
                        <span class="material-symbols-outlined">crop_square</span>
                    </button>
                    <button class="window-btn close" data-action="close" data-window-id="${windowId}" title="Close">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
            </div>
            ${config.hasTabBar ? '<div class="window-tabbar" data-window-id="' + windowId + '"></div>' : ''}
            <div class="window-content" data-window-id="${windowId}"></div>
        `;

        return windowElement;
    }

    // ===== SNAP SYSTEM (Preserved from original) =====

    initializeSnapSystem() {
        this.updateSnapZones();
        this.createSnapPreview();
    }

    updateSnapZones() {
        const { cornerSize, edgeSize } = this.snapSystem;
        const { width, height } = this.availableArea;

        this.snapSystem.zones = {
            'top': { x: 0, y: 0, width, height: height / 2 },
            'bottom': { x: 0, y: height / 2, width, height: height / 2 },
            'left': { x: 0, y: 0, width: width / 2, height },
            'right': { x: width / 2, y: 0, width: width / 2, height },
            'top-left': { x: 0, y: 0, width: width / 2, height: height / 2 },
            'top-right': { x: width / 2, y: 0, width: width / 2, height: height / 2 },
            'bottom-left': { x: 0, y: height / 2, width: width / 2, height: height / 2 },
            'bottom-right': { x: width / 2, y: height / 2, width: width / 2, height: height / 2 }
        };
    }

    createSnapPreview() {
        if (this.snapSystem.previewElement) return;

        this.snapSystem.previewElement = document.createElement('div');
        this.snapSystem.previewElement.className = 'snap-preview';
        document.body.appendChild(this.snapSystem.previewElement);
    }

    // ===== CAPSULE PREVIEW SYSTEM (NEW - Replaces titlebar-only mode) =====

    /**
     * Setup hotkeys for capsule and screenshot functionality
     */
    setupCapsuleHotkeys() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+S: Capture desktop screenshot
            if (e.ctrlKey && e.shiftKey && e.key === 'S') {
                e.preventDefault();
                this.captureDesktopScreenshot();
            }
            
            // Ctrl+Shift+C: Toggle capsule mode for active window
            if (e.ctrlKey && e.shiftKey && e.key === 'C') {
                e.preventDefault();
                if (this.activeWindow) {
                    this.toggleWindowCapsule(this.activeWindow);
                }
            }
            
            // F12: Capture all windows (for debugging)
            if (e.key === 'F12' && e.ctrlKey) {
                e.preventDefault();
                this.captureAllWindowScreenshots();
            }
        });
        
        console.log('🎯 Capsule hotkeys registered:');
        console.log('  Ctrl+Shift+S: Desktop screenshot');
        console.log('  Ctrl+Shift+C: Toggle capsule mode');
        console.log('  Ctrl+F12: Capture all windows');
    }

    /**
     * Toggle capsule mode for a window
     */
    async toggleWindowCapsule(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;

        if (windowData.isCapsule) {
            this.restoreWindowFromCapsule(windowId);
        } else {
            await this.createWindowCapsule(windowId);
        }
    }

    /**
     * Create window capsule with screenshot preview
     */
    async createWindowCapsule(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData || windowData.isCapsule) return;

        console.log(`📸 Creating capsule for window: ${windowId}`);

        // 1. Capture screenshot BEFORE switching to capsule mode
        await this.captureWindowScreenshot(windowId);

        // 2. Save current window state
        this.saveCapsuleState(windowId);

        // 3. Apply capsule mode
        windowData.element.classList.add('titlebar-only');
        windowData.isCapsule = true;
        this.capsuleSystem.windows.add(windowId);

        // 4. Create and inject preview area
        this.createCapsulePreview(windowId);

        // 5. Update window dimensions for capsule mode
        this.updateCapsuleDimensions(windowId);

        // 6. Set high z-index for capsules
        this.setCapsuleZIndex(windowId);

        // 7. Position optimally if auto-positioning is enabled
        if (this.capsuleSystem.autoPosition) {
            this.positionCapsuleOptimally(windowId);
        }

        console.log(`✅ Window ${windowId} converted to capsule with preview`);
    }

    /**
     * Capture screenshot of window content
     */
    // async captureWindowScreenshot(windowId) {
    //     const windowData = this.windows.get(windowId);
    //     if (!windowData) return null;

    //     try {
    //         const contentArea = windowData.element.querySelector('.window-content');
    //         if (!contentArea) return null;

    //         // Ensure content is visible for screenshot
    //         const wasHidden = contentArea.style.display === 'none';
    //         if (wasHidden) {
    //             contentArea.style.display = 'block';
    //             contentArea.style.opacity = '0';
    //             contentArea.style.position = 'absolute';
    //             contentArea.style.zIndex = '-9999';
    //         }

    //         // Use html2canvas for screenshot
    //         const screenshot = await this.captureElementWithFallback(contentArea);
            
    //         // Store screenshot
    //         this.windowScreenshots.set(windowId, {
    //             data: screenshot,
    //             timestamp: Date.now(),
    //             windowTitle: windowData.config.title
    //         });

    //         // Restore hidden state
    //         if (wasHidden) {
    //             contentArea.style.display = 'none';
    //             contentArea.style.opacity = '';
    //             contentArea.style.position = '';
    //             contentArea.style.zIndex = '';
    //         }

    //         console.log(`📸 Screenshot captured for ${windowId}`);
    //         return screenshot;

    //     } catch (error) {
    //         console.error(`❌ Screenshot capture failed for ${windowId}:`, error);
    //         return this.createFallbackPreview(windowId);
    //     }
    // }

    // Enhanced Screenshot System for WindowManager
// Multiple methods for better compatibility with webviews, PWAs, etc.

// Add these methods to your WindowManager class:

/**
 * Enhanced screenshot capture with multiple fallback methods
 */
async captureWindowScreenshot(windowId) {
    const windowData = this.windows.get(windowId);
    if (!windowData) return null;

    console.log(`📸 Capturing screenshot for ${windowId} (${windowData.config.title})`);

    try {
        const contentArea = windowData.element.querySelector('.window-content');
        if (!contentArea) return null;

        // Check if this is a webview-based app (PWA, browser, etc.)
        const webview = contentArea.querySelector('webview');
        const isWebviewApp = !!webview;

        let screenshot = null;

        if (isWebviewApp) {
            // Method 1: Try webview screenshot (Electron specific)
            screenshot = await this.captureWebviewScreenshot(webview, windowId);
        }

        if (!screenshot) {
            // Method 2: Try DOM-to-Canvas with enhanced settings
            screenshot = await this.captureDOMScreenshot(contentArea, windowId);
        }

        if (!screenshot) {
            // Method 3: Browser API screenshot (if available)
            screenshot = await this.captureBrowserAPIScreenshot(windowId);
        }

        if (!screenshot) {
            // Method 4: Create intelligent fallback based on app type
            screenshot = this.createIntelligentFallback(windowId);
        }

        // Store screenshot with metadata
        this.windowScreenshots.set(windowId, {
            data: screenshot,
            timestamp: Date.now(),
            windowTitle: windowData.config.title,
            method: this.lastUsedMethod || 'fallback',
            isWebview: isWebviewApp
        });

        console.log(`✅ Screenshot captured for ${windowId} using ${this.lastUsedMethod}`);
        return screenshot;

    } catch (error) {
        console.error(`❌ Screenshot capture failed for ${windowId}:`, error);
        return this.createIntelligentFallback(windowId);
    }
}

/**
 * Method 1: Capture webview screenshot using Electron's webview API
 */
async captureWebviewScreenshot(webview, windowId) {
    try {
        this.lastUsedMethod = 'webview-api';
        
        // Check if webview has screenshot capability
        if (!webview.capturePage) {
            console.log('Webview capturePage not available');
            return null;
        }

        // Capture the webview content
        const nativeImage = await webview.capturePage();
        const dataURL = nativeImage.toDataURL();
        
        console.log('✅ Webview screenshot captured');
        return dataURL;

    } catch (error) {
        console.log('Webview screenshot failed:', error.message);
        return null;
    }
}

/**
 * Method 2: Enhanced DOM screenshot with better webview handling
 */
async captureDOMScreenshot(contentArea, windowId) {
    try {
        this.lastUsedMethod = 'dom-enhanced';

        if (!window.html2canvas) {
            console.log('html2canvas not available');
            return null;
        }

        // Ensure content is visible for screenshot
        const wasHidden = contentArea.style.display === 'none';
        if (wasHidden) {
            contentArea.style.display = 'block';
            contentArea.style.opacity = '0';
            contentArea.style.position = 'absolute';
            contentArea.style.zIndex = '-9999';
        }

        // Enhanced html2canvas options for better compatibility
        const canvas = await window.html2canvas(contentArea, {
            width: contentArea.scrollWidth || 400,
            height: contentArea.scrollHeight || 300,
            scale: 0.4, // Lower scale for better performance
            useCORS: true,
            allowTaint: true, // Allow cross-origin images
            backgroundColor: '#ffffff',
            logging: false,
            imageTimeout: 5000,
            removeContainer: true,
            foreignObjectRendering: true, // Better for complex content
            ignoreElements: (element) => {
                // Skip problematic elements
                const tagName = element.tagName?.toLowerCase();
                const className = element.className?.toString() || '';
                
                return (
                    tagName === 'webview' ||
                    tagName === 'iframe' ||
                    tagName === 'video' ||
                    tagName === 'audio' ||
                    className.includes('resize-handle') ||
                    className.includes('window-controls') ||
                    element.style.position === 'fixed'
                );
            },
            onclone: (clonedDoc, element) => {
                // Enhance the cloned document for better rendering
                const webviews = clonedDoc.querySelectorAll('webview');
                webviews.forEach(wv => {
                    // Replace webview with placeholder
                    const placeholder = clonedDoc.createElement('div');
                    placeholder.style.cssText = `
                        width: 100%;
                        height: 100%;
                        background: linear-gradient(135deg, #667eea, #764ba2);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-size: 16px;
                        font-weight: bold;
                    `;
                    placeholder.textContent = 'Web Content';
                    wv.parentNode?.replaceChild(placeholder, wv);
                });
            }
        });

        // Restore hidden state
        if (wasHidden) {
            contentArea.style.display = 'none';
            contentArea.style.opacity = '';
            contentArea.style.position = '';
            contentArea.style.zIndex = '';
        }

        const dataURL = canvas.toDataURL('image/png', 0.8);
        console.log('✅ Enhanced DOM screenshot captured');
        return dataURL;

    } catch (error) {
        console.log('Enhanced DOM screenshot failed:', error.message);
        return null;
    }
}

/**
 * Method 3: Browser API screenshot (experimental)
 */
async captureBrowserAPIScreenshot(windowId) {
    try {
        this.lastUsedMethod = 'browser-api';

        // Check if browser supports getDisplayMedia
        if (!navigator.mediaDevices?.getDisplayMedia) {
            return null;
        }

        // This would require user permission - not ideal for automatic screenshots
        // Keeping for future implementation
        console.log('Browser API screenshot not implemented (requires user permission)');
        return null;

    } catch (error) {
        console.log('Browser API screenshot failed:', error.message);
        return null;
    }
}

/**
 * Method 4: Create intelligent fallback based on app type
 */
createIntelligentFallback(windowId) {
    const windowData = this.windows.get(windowId);
    if (!windowData) return this.createGenericFallback();

    this.lastUsedMethod = 'intelligent-fallback';

    const title = windowData.config.title || 'App';
    const icon = windowData.config.icon || '📱';
    
    // Detect app type for better fallbacks
    const appType = this.detectAppType(windowData);
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = 300;
    canvas.height = 200;
    
    // Create app-specific fallback designs
    switch (appType) {
        case 'browser':
        case 'pwa':
            this.createWebAppFallback(ctx, title, icon);
            break;
        case 'terminal':
            this.createTerminalFallback(ctx, title, icon);
            break;
        case 'editor':
            this.createEditorFallback(ctx, title, icon);
            break;
        default:
            this.createGenericAppFallback(ctx, title, icon);
    }
    
    return canvas.toDataURL('image/png');
}

/**
 * Detect app type based on window data
 */
detectAppType(windowData) {
    const title = windowData.config.title?.toLowerCase() || '';
    const contentArea = windowData.element.querySelector('.window-content');
    
    // Check for webviews (PWAs, browser apps)
    if (contentArea?.querySelector('webview')) {
        return 'pwa';
    }
    
    // Check for browser-specific elements
    if (contentArea?.querySelector('.browser-container, .tab-container')) {
        return 'browser';
    }
    
    // Check for terminal
    if (title.includes('terminal') || contentArea?.querySelector('.terminal-container, .xterm')) {
        return 'terminal';
    }
    
    // Check for code editor
    if (title.includes('code') || title.includes('editor') || contentArea?.querySelector('.monaco-editor')) {
        return 'editor';
    }
    
    return 'generic';
}

/**
 * Create web app/PWA fallback preview
 */
createWebAppFallback(ctx, title, icon) {
    // Create web browser-like interface
    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, '#f8fafc');
    gradient.addColorStop(1, '#e2e8f0');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 300, 200);
    
    // Browser chrome
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 300, 40);
    
    // Address bar
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(10, 10, 280, 20);
    ctx.strokeStyle = '#cbd5e1';
    ctx.strokeRect(10, 10, 280, 20);
    
    // URL text
    ctx.fillStyle = '#64748b';
    ctx.font = '10px sans-serif';
    ctx.fillText('🌐 Web Application', 15, 23);
    
    // Main content area
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(10, 50, 280, 140);
    
    // App icon and title
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#1e293b';
    ctx.fillText(icon, 150, 110);
    
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText(title, 150, 130);
    
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Live Web Content', 150, 150);
}

/**
 * Create terminal fallback preview
 */
createTerminalFallback(ctx, title, icon) {
    // Dark terminal background
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, 300, 200);
    
    // Terminal header
    ctx.fillStyle = '#2d2d2d';
    ctx.fillRect(0, 0, 300, 30);
    
    // Terminal controls
    const colors = ['#ff5f56', '#ffbd2e', '#27ca3f'];
    colors.forEach((color, i) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(15 + i * 20, 15, 6, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Terminal title
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px monospace';
    ctx.fillText(title, 80, 19);
    
    // Terminal content
    ctx.fillStyle = '#00ff00';
    ctx.font = '11px monospace';
    const lines = [
        '$ ' + title.toLowerCase(),
        'Last login: ' + new Date().toLocaleString(),
        'Welcome to ' + title,
        '$ █'
    ];
    
    lines.forEach((line, i) => {
        ctx.fillText(line, 10, 50 + i * 15);
    });
}

/**
 * Create code editor fallback preview
 */
createEditorFallback(ctx, title, icon) {
    // Editor background
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, 300, 200);
    
    // Editor sidebar
    ctx.fillStyle = '#252526';
    ctx.fillRect(0, 0, 50, 200);
    
    // Editor content area
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(50, 0, 250, 200);
    
    // Line numbers
    ctx.fillStyle = '#858585';
    ctx.font = '10px monospace';
    for (let i = 1; i <= 12; i++) {
        ctx.fillText(i.toString().padStart(2), 55, 15 + i * 12);
    }
    
    // Code content
    ctx.fillStyle = '#d4d4d4';
    ctx.font = '10px monospace';
    const codeLines = [
        'class ' + title.replace(/\s+/g, '') + ' {',
        '  constructor() {',
        '    this.init();',
        '  }',
        '',
        '  init() {',
        '    // Implementation',
        '  }',
        '}',
    ];
    
    codeLines.forEach((line, i) => {
        ctx.fillStyle = line.includes('class') ? '#4ec9b0' : 
                       line.includes('constructor') ? '#dcdcaa' : '#d4d4d4';
        ctx.fillText(line, 75, 27 + i * 12);
    });
}

/**
 * Create generic app fallback preview
 */
createGenericAppFallback(ctx, title, icon) {
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 300, 200);
    
    // App icon
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'white';
    ctx.fillText(icon, 150, 90);
    
    // App title
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = 'white';
    ctx.fillText(title, 150, 120);
    
    // Subtitle
    ctx.font = '12px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText('Live Preview', 150, 140);
    
    // Status indicator
    ctx.font = '10px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText(new Date().toLocaleTimeString(), 150, 160);
}

/**
 * Force refresh screenshot for capsule (call this when content changes)
 */
async forceRefreshCapsulePreview(windowId) {
    console.log(`🔄 Force refreshing preview for window: ${windowId}`);
    
    // Remove old screenshot
    this.windowScreenshots.delete(windowId);
    
    // Capture new screenshot
    await this.captureWindowScreenshot(windowId);
    
    // Update preview if capsule exists
    const windowData = this.windows.get(windowId);
    if (windowData?.isCapsule) {
        const previewImage = windowData.element.querySelector('.preview-image');
        const screenshotData = this.windowScreenshots.get(windowId);
        
        if (previewImage && screenshotData) {
            previewImage.src = screenshotData.data;
            
            // Update timestamp
            const timestampElement = windowData.element.querySelector('.preview-timestamp');
            if (timestampElement) {
                timestampElement.textContent = new Date(screenshotData.timestamp).toLocaleTimeString();
            }
            
            // Show fresh indicator
            const previewContainer = windowData.element.querySelector('.capsule-preview');
            if (previewContainer) {
                previewContainer.classList.add('fresh');
                setTimeout(() => previewContainer.classList.remove('fresh'), 2000);
            }
        }
    }
    
    console.log(`✅ Preview force-refreshed for window: ${windowId}`);
}

/**
 * Auto-refresh previews for active capsules
 */
startAutoRefreshPreviews() {
    if (this.capsuleSystem.refreshInterval) return;
    
    this.capsuleSystem.refreshInterval = setInterval(async () => {
        if (!this.capsuleSystem.autoRefreshEnabled) return;
        
        for (const windowId of this.capsuleSystem.windows) {
            try {
                await this.forceRefreshCapsulePreview(windowId);
            } catch (error) {
                console.error(`Auto-refresh failed for ${windowId}:`, error);
            }
        }
    }, this.capsuleSystem.autoRefreshDelay);
    
    console.log('🔄 Auto-refresh started for capsule previews');
}

/**
 * Stop auto-refresh
 */
stopAutoRefreshPreviews() {
    if (this.capsuleSystem.refreshInterval) {
        clearInterval(this.capsuleSystem.refreshInterval);
        this.capsuleSystem.refreshInterval = null;
        console.log('⏹️ Auto-refresh stopped');
    }
}

/** end brad code ^^^ */

    /**
     * Capture element with multiple fallback methods
     */
    async captureElementWithFallback(element) {
        // Method 1: Try html2canvas
        try {
            if (window.html2canvas) {
                const canvas = await window.html2canvas(element, {
                    width: element.scrollWidth,
                    height: element.scrollHeight,
                    scale: 0.3, // Smaller for performance
                    useCORS: true,
                    allowTaint: false,
                    backgroundColor: null,
                    ignoreElements: (el) => {
                        return el.classList.contains('resize-handle') || 
                               el.tagName === 'WEBVIEW';
                    }
                });
                return canvas.toDataURL('image/png', 0.8);
            }
        } catch (error) {
            console.warn('html2canvas failed, trying fallback:', error);
        }

        // Method 2: Fallback preview
        return this.createFallbackPreview();
    }

    /**
     * Create fallback preview for failed screenshots
     */
    createFallbackPreview(windowId) {
        const windowData = this.windows.get(windowId);
        const title = windowData?.config?.title || 'App';
        const icon = windowData?.config?.icon || '📱';
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = 200;
        canvas.height = 100;
        
        // Create gradient background
        const gradient = ctx.createLinearGradient(0, 0, 0, 100);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 200, 100);
        
        // Add text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(icon, 100, 40);
        ctx.font = '12px sans-serif';
        ctx.fillText(title, 100, 60);
        ctx.font = '10px sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillText('Live Preview', 100, 80);
        
        return canvas.toDataURL('image/png');
    }

    /**
     * Create the capsule preview area
     */
    createCapsulePreview(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;

        // Remove existing preview if it exists
        const existingPreview = windowData.element.querySelector('.capsule-preview');
        if (existingPreview) {
            existingPreview.remove();
        }

        // Create preview container
        const previewContainer = document.createElement('div');
        previewContainer.className = 'capsule-preview';
        
        // Get screenshot data
        const screenshotData = this.windowScreenshots.get(windowId);
        const screenshotSrc = screenshotData?.data || this.createFallbackPreview(windowId);
        
        previewContainer.innerHTML = `
            <div class="preview-image-container">
                <img src="${screenshotSrc}" class="preview-image" alt="Window preview" />
                <div class="preview-overlay">
                    <div class="preview-controls">
                        <button class="preview-btn restore-btn" data-action="restore-window" title="Restore Window">
                            <span class="material-symbols-outlined">open_in_full</span>
                        </button>
                    </div>
                </div>
            </div>
            <div class="preview-info">
                <span class="preview-timestamp">
                    ${screenshotData ? new Date(screenshotData.timestamp).toLocaleTimeString() : 'Live Preview'}
                </span>
            </div>
        `;

        // Insert after titlebar
        const titlebar = windowData.element.querySelector('.window-titlebar');
        titlebar.insertAdjacentElement('afterend', previewContainer);

        // Setup preview event listeners
        this.setupPreviewEventListeners(windowId, previewContainer);
    }

    /**
     * Setup event listeners for preview controls
     */
    setupPreviewEventListeners(windowId, previewContainer) {
        previewContainer.addEventListener('click', async (e) => {
            e.stopPropagation();
            
            const action = e.target.closest('[data-action]')?.dataset.action;
            
            switch (action) {
                case 'restore-window':
                    this.restoreWindowFromCapsule(windowId);
                    break;
                default:
                    // Click on preview image - restore window
                    if (e.target.classList.contains('preview-image')) {
                        this.restoreWindowFromCapsule(windowId);
                    }
                    break;
            }
        });

        // Hover effects
        previewContainer.addEventListener('mouseenter', () => {
            previewContainer.classList.add('preview-hover');
        });

        previewContainer.addEventListener('mouseleave', () => {
            previewContainer.classList.remove('preview-hover');
        });
    }

    /**
     * Refresh capsule preview
     */
    async refreshCapsulePreview(windowId) {
        console.log(`🔄 Refreshing preview for window: ${windowId}`);
        
        const windowData = this.windows.get(windowId);
        if (!windowData) return;

        // Temporarily show content for screenshot
        const contentArea = windowData.element.querySelector('.window-content');
        const originalDisplay = contentArea.style.display;
        contentArea.style.display = 'block';
        
        // Capture new screenshot
        await this.captureWindowScreenshot(windowId);
        
        // Restore capsule mode
        contentArea.style.display = originalDisplay;
        
        // Update preview image
        const screenshotData = this.windowScreenshots.get(windowId);
        const previewImage = windowData.element.querySelector('.preview-image');
        if (previewImage && screenshotData) {
            // Add refresh animation
            previewImage.parentElement.classList.add('refreshing');
            
            previewImage.src = screenshotData.data;
            
            // Update timestamp
            const timestampElement = windowData.element.querySelector('.preview-timestamp');
            if (timestampElement) {
                timestampElement.textContent = new Date(screenshotData.timestamp).toLocaleTimeString();
            }
            
            // Remove refresh animation
            setTimeout(() => {
                previewImage.parentElement.classList.remove('refreshing');
                previewImage.parentElement.classList.add('fresh');
                setTimeout(() => {
                    previewImage.parentElement.classList.remove('fresh');
                }, 2000);
            }, 600);
        }
        
        console.log(`✅ Preview refreshed for window: ${windowId}`);
    }

    /**
     * Save window state before entering capsule mode
     */
    saveCapsuleState(windowId) {
        const windowData = this.windows.get(windowId);
        const windowElement = windowData.element;
        
        windowData.capsuleState = {
            savedDimensions: {
                width: windowElement.style.width || windowElement.offsetWidth + 'px',
                height: windowElement.style.height || windowElement.offsetHeight + 'px'
            },
            savedPosition: {
                left: windowElement.style.left || windowElement.offsetLeft + 'px',
                top: windowElement.style.top || windowElement.offsetTop + 'px'
            },
            savedZIndex: windowElement.style.zIndex || this.zIndexCounter,
            isMaximized: windowData.isMaximized,
            isMinimized: windowData.isMinimized
        };
    }

    /**
     * Update capsule dimensions to accommodate preview
     */
    updateCapsuleDimensions(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;

        const element = windowData.element;
        const titlebarHeight = this.capsuleSystem.titlebarHeight;
        const previewHeight = this.capsuleSystem.previewHeight;
        const infoHeight = 20; // Preview info bar height
        const totalHeight = titlebarHeight + previewHeight + infoHeight;

        // Calculate optimal width based on title length
        const optimalWidth = this.calculateCapsuleWidth(windowData);

        // Update window dimensions
        element.style.height = `${totalHeight}px`;
        element.style.width = `${optimalWidth}px`;
        element.style.minHeight = `${totalHeight}px`;
    }

    /**
     * Calculate optimal width for capsule
     */
    calculateCapsuleWidth(windowData) {
        const title = windowData.config.title;
        const icon = windowData.element.querySelector('.window-icon');
        
        // Estimate text width
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        
        const iconWidth = icon ? 28 : 0; // Icon + margin
        const titleWidth = context.measureText(title).width;
        const controlsWidth = 120; // Approximate width of window controls
        const padding = 32; // Internal padding
        
        const calculatedWidth = iconWidth + titleWidth + controlsWidth + padding;
        
        return Math.max(
            this.capsuleSystem.minWidth,
            Math.min(calculatedWidth, this.capsuleSystem.maxWidth)
        );
    }

    /**
     * Set high z-index for capsule windows
     */
    setCapsuleZIndex(windowId) {
        const windowData = this.windows.get(windowId);
        const windowElement = windowData.element;
        
        windowElement.style.zIndex = this.capsuleSystem.zIndexBase + this.capsuleSystem.windows.size;
    }

    /**
     * Position capsule optimally to avoid overlaps
     */
    positionCapsuleOptimally(windowId) {
        const windowData = this.windows.get(windowId);
        const windowElement = windowData.element;
        
        // Simple positioning strategy: cascade along top edge
        const existingCount = this.capsuleSystem.windows.size - 1;
        const margin = 20;
        const cascadeOffset = 40; // Offset for each new capsule
        
        const x = margin + (existingCount * cascadeOffset);
        const y = margin + (existingCount * cascadeOffset);
        
        // Ensure it stays on screen
        const maxX = window.innerWidth - parseInt(windowElement.style.width) - margin;
        const maxY = window.innerHeight - parseInt(windowElement.style.height) - margin;
        
        windowElement.style.left = Math.min(x, maxX) + 'px';
        windowElement.style.top = Math.min(y, maxY) + 'px';
    }

    /**
     * Restore window from capsule mode
     */
    restoreWindowFromCapsule(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData || !windowData.isCapsule) return;

        console.log(`🔄 Restoring window from capsule: ${windowId}`);

        // Remove capsule mode
        windowData.element.classList.remove('titlebar-only');
        windowData.isCapsule = false;
        this.capsuleSystem.windows.delete(windowId);

        // Remove preview area
        const previewArea = windowData.element.querySelector('.capsule-preview');
        if (previewArea) {
            previewArea.remove();
        }

        // Restore original state
        this.restoreCapsuleState(windowId);

        // Show content
        const contentArea = windowData.element.querySelector('.window-content');
        if (contentArea) {
            contentArea.style.display = 'block';
        }

        // Focus the restored window
        this.focusWindow(windowId);

        console.log(`✅ Window restored from capsule: ${windowId}`);
    }

    /**
     * Restore window state when exiting capsule mode
     */
    restoreCapsuleState(windowId) {
        const windowData = this.windows.get(windowId);
        const windowElement = windowData.element;
        const state = windowData.capsuleState;
        
        if (!state) return;

        // Restore dimensions and position
        windowElement.style.width = state.savedDimensions.width;
        windowElement.style.height = state.savedDimensions.height;
        windowElement.style.left = state.savedPosition.left;
        windowElement.style.top = state.savedPosition.top;
        windowElement.style.zIndex = state.savedZIndex;
        windowElement.style.minHeight = 'auto';

        // Restore window state flags
        windowData.isMaximized = state.isMaximized;
        windowData.isMinimized = state.isMinimized;

        if (state.isMaximized) {
            windowElement.classList.add('maximized');
        }
    }

    /**
     * Capture desktop screenshot
     */
// Enhanced Desktop Screenshot System for NebulaDesktop
// Add these methods to your WindowManager class

/**
 * Enhanced desktop screenshot using multiple methods
 */
async captureDesktopScreenshot() {
    console.log('🔸 Capturing desktop screenshot...');
    
    try {
        let screenshot = null;
        
        // Method 1: Try Electron's native screenshot (best quality)
        screenshot = await this.captureElectronScreenshot();
        
        if (!screenshot) {
            // Method 2: Enhanced html2canvas with better settings
            screenshot = await this.captureEnhancedCanvasScreenshot();
        }
        
        if (!screenshot) {
            // Method 3: Browser screencapture API (requires permission)
            screenshot = await this.captureBrowserScreenshot();
        }
        
        if (screenshot) {
            this.handleDesktopScreenshot(screenshot);
        } else {
            this.showScreenshotError();
        }
        
    } catch (error) {
        console.error('Desktop screenshot failed:', error);
        this.showScreenshotError();
    }
}

/**
 * Method 1: Use Electron's native screenshot capability (BEST)
 */
async captureElectronScreenshot() {
    try {
        // Check if we're in Electron environment
        if (!window.nebula || !window.nebula.screenshot) {
            console.log('Electron screenshot API not available');
            return null;
        }
        
        console.log('📸 Using Electron native screenshot...');
        
        // Call the main process to capture screen
        const screenshot = await window.nebula.screenshot.captureScreen();
        
        console.log('✅ Electron screenshot captured successfully');
        return screenshot;
        
    } catch (error) {
        console.log('Electron screenshot failed:', error.message);
        return null;
    }
}

/**
 * Method 2: Enhanced html2canvas with better desktop capture settings
 */
async captureEnhancedCanvasScreenshot() {
    try {
        if (!window.html2canvas) {
            console.log('html2canvas not available');
            return null;
        }
        
        console.log('📸 Using enhanced html2canvas...');
        
        // Target the entire viewport, not just desktop element
        const targetElement = document.body;
        
        // Enhanced options for desktop capture
        const canvas = await window.html2canvas(targetElement, {
            width: window.innerWidth,
            height: window.innerHeight,
            scale: 0.8, // Higher quality than before
            useCORS: true,
            allowTaint: true, // Allow cross-origin content
            backgroundColor: null,
            logging: false,
            imageTimeout: 10000, // Longer timeout for complex content
            removeContainer: true,
            
            // Enhanced rendering options
            foreignObjectRendering: true,
            svgRendering: true,
            
            // Handle problematic elements
            ignoreElements: (element) => {
                // Skip elements that cause issues
                const tagName = element.tagName?.toLowerCase();
                const className = element.className?.toString() || '';
                
                return (
                    // Skip screenshot notifications and temporary elements
                    className.includes('screenshot-notification') ||
                    className.includes('tooltip') ||
                    className.includes('context-menu') ||
                    element.style.position === 'fixed' && element.style.zIndex > 9999
                );
            },
            
            // Pre-process the clone for better rendering
            onclone: (clonedDoc, element) => {
                // Fix background elements that might not render
                const body = clonedDoc.body;
                const desktop = clonedDoc.getElementById('desktop');
                
                if (desktop) {
                    // Ensure desktop background is visible
                    const computedStyle = window.getComputedStyle(document.getElementById('desktop'));
                    desktop.style.background = computedStyle.background;
                    desktop.style.backgroundImage = computedStyle.backgroundImage;
                    desktop.style.backgroundSize = computedStyle.backgroundSize;
                    desktop.style.backgroundPosition = computedStyle.backgroundPosition;
                    desktop.style.backgroundRepeat = computedStyle.backgroundRepeat;
                }
                
                // Fix taskbar styling
                const taskbar = clonedDoc.querySelector('.taskbar');
                if (taskbar) {
                    const originalTaskbar = document.querySelector('.taskbar');
                    if (originalTaskbar) {
                        const taskbarStyle = window.getComputedStyle(originalTaskbar);
                        taskbar.style.background = taskbarStyle.background;
                        taskbar.style.backdropFilter = 'none'; // Remove blur for screenshot
                    }
                }
                
                // Remove any transforms that might cause issues
                const allElements = clonedDoc.querySelectorAll('*');
                allElements.forEach(el => {
                    if (el.style.transform && el.style.transform.includes('translate')) {
                        el.style.transform = 'none';
                    }
                });
            }
        });
        
        const dataURL = canvas.toDataURL('image/png', 0.9);
        console.log('✅ Enhanced canvas screenshot captured');
        return dataURL;
        
    } catch (error) {
        console.log('Enhanced canvas screenshot failed:', error.message);
        return null;
    }
}

/**
 * Method 3: Browser screen capture API (requires user permission)
 */
async captureBrowserScreenshot() {
    try {
        if (!navigator.mediaDevices?.getDisplayMedia) {
            console.log('Browser screen capture not supported');
            return null;
        }
        
        console.log('📸 Requesting browser screen capture...');
        
        // Request screen capture
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: {
                mediaSource: 'screen',
                width: { ideal: window.screen.width },
                height: { ideal: window.screen.height }
            },
            audio: false
        });
        
        // Create video element to capture frame
        const video = document.createElement('video');
        video.srcObject = stream;
        video.style.position = 'absolute';
        video.style.top = '-9999px';
        document.body.appendChild(video);
        
        return new Promise((resolve) => {
            video.onloadedmetadata = () => {
                video.play();
                
                // Wait a moment for video to load, then capture
                setTimeout(() => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    
                    ctx.drawImage(video, 0, 0);
                    
                    // Clean up
                    stream.getTracks().forEach(track => track.stop());
                    document.body.removeChild(video);
                    
                    const dataURL = canvas.toDataURL('image/png', 0.9);
                    console.log('✅ Browser screen capture completed');
                    resolve(dataURL);
                }, 500);
            };
        });
        
    } catch (error) {
        console.log('Browser screen capture failed:', error.message);
        return null;
    }
}

/**
 * Show error notification when screenshot fails
 */
showScreenshotError() {
    const notification = document.createElement('div');
    notification.className = 'screenshot-notification error';
    notification.innerHTML = `
        <div class="notification-content">
            <span class="material-symbols-outlined">error</span>
            <span>Screenshot failed - trying alternative method...</span>
        </div>
    `;
    
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: 'var(--nebula-danger, #ef4444)',
        color: 'white',
        padding: '12px 20px',
        borderRadius: '8px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        zIndex: '10000',
        opacity: '0',
        transform: 'translateY(-20px)',
        transition: 'all 0.3s ease'
    });
    
    document.body.appendChild(notification);
    
    requestAnimationFrame(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    });
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

    /**
     * Handle desktop screenshot (save or display)
     */
    handleDesktopScreenshot(screenshotData) {
        // Create download link
        const link = document.createElement('a');
        link.download = `nebula-desktop-${Date.now()}.png`;
        link.href = screenshotData;
        
        // Show notification
        this.showScreenshotNotification();
        
        // Auto-download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('✅ Desktop screenshot saved');
    }

    /**
     * Show screenshot notification
     */
    showScreenshotNotification() {
        const notification = document.createElement('div');
        notification.className = 'screenshot-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <span class="material-symbols-outlined">photo_camera</span>
                <span>Desktop screenshot captured!</span>
            </div>
        `;
        
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: 'var(--nebula-primary)',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            zIndex: '10000',
            opacity: '0',
            transform: 'translateY(-20px)',
            transition: 'all 0.3s ease'
        });
        
        document.body.appendChild(notification);
        
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        });
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    /**
     * Capture all window screenshots (for debugging)
     */
    async captureAllWindowScreenshots() {
        console.log('📸 Capturing all window screenshots...');
        
        const activeWindows = Array.from(this.windows.keys());
        const results = [];
        
        for (const windowId of activeWindows) {
            try {
                await this.captureWindowScreenshot(windowId);
                results.push(windowId);
            } catch (error) {
                console.error(`Failed to capture ${windowId}:`, error);
            }
        }
        
        console.log(`✅ Captured ${results.length} window screenshots`);
    }

    /**
     * Clean up screenshots for closed windows
     */
    cleanupWindowScreenshot(windowId) {
        if (this.windowScreenshots.has(windowId)) {
            this.windowScreenshots.delete(windowId);
            console.log(`🗑️ Cleaned up screenshot for window: ${windowId}`);
        }
    }

    // ===== WINDOW EVENT HANDLING (Enhanced with capsule support) =====

    setupWindowEventListeners(windowId) {
        const windowData = this.windows.get(windowId);
        const windowElement = windowData.element;
        const titlebar = windowElement.querySelector('.window-titlebar');

        // Window control buttons
        windowElement.addEventListener('click', (e) => {
            const action = e.target.closest('[data-action]')?.dataset.action;
            const targetWindowId = e.target.closest('[data-window-id]')?.dataset.windowId;
            
            if (targetWindowId === windowId) {
                switch (action) {
                    case 'minimize':
                        this.minimizeWindow(windowId);
                        break;
                    case 'maximize':
                        this.maximizeWindow(windowId);
                        break;
                    case 'capsule': // NEW: Capsule mode button
                        this.toggleWindowCapsule(windowId);
                        break;
                    case 'close':
                        this.closeWindow(windowId);
                        break;
                }
            }
        });

        // Drag functionality
        this.setupWindowDrag(windowId);
        
        // Focus on click
        windowElement.addEventListener('mousedown', () => {
            this.focusWindow(windowId);
        });
    }

    /**
     * Setup window drag functionality
     */
    setupWindowDrag(windowId) {
        const windowData = this.windows.get(windowId);
        const windowElement = windowData.element;
        const titlebar = windowElement.querySelector('.window-titlebar');

        let isDragging = false;
        let startX, startY, startLeft, startTop;
        let animationFrame;

        const startDrag = (e) => {
            // Don't drag if clicking on window controls
            if (e.target.closest('.window-controls')) return;
            
            // For capsules, allow drag from anywhere on titlebar
            // For normal windows, only drag from titlebar
            if (!windowData.isCapsule && !e.target.closest('.window-titlebar')) return;

            isDragging = true;
            this.snapSystem.isDragging = true;
            this.snapSystem.draggedWindow = windowId;

            startX = e.clientX;
            startY = e.clientY;
            startLeft = parseInt(windowElement.style.left);
            startTop = parseInt(windowElement.style.top);

            windowElement.classList.add('dragging');
            titlebar.style.cursor = 'grabbing';

            // Add global event listeners for this drag session
            document.addEventListener('mousemove', doDrag);
            document.addEventListener('mouseup', stopDrag);

            e.preventDefault();
        };

        const doDrag = (e) => {
            if (!isDragging) return;

            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
            }

            animationFrame = requestAnimationFrame(() => {
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;

                windowElement.style.left = (startLeft + deltaX) + 'px';
                windowElement.style.top = (startTop + deltaY) + 'px';

                // Only check snapping for non-capsule windows
                if (!windowData.isCapsule && this.snapSystem.isEnabled) {
                    const snapZone = this.getSnapZone(e.clientX, e.clientY);
                    
                    if (snapZone !== this.snapSystem.currentZone) {
                        this.snapSystem.currentZone = snapZone;
                        
                        if (snapZone) {
                            this.showSnapPreview(snapZone);
                            this.clearHoverTimer();
                        } else {
                            this.clearHoverTimer();
                            this.hideSnapPreview();
                        }
                    }
                }
            });

            e.preventDefault();
        };

        const stopDrag = (e) => {
            if (!isDragging) return;

            isDragging = false;
            this.snapSystem.isDragging = false;
            this.snapSystem.draggedWindow = null;

            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
                animationFrame = null;
            }

            this.clearHoverTimer();

            // Only snap non-capsule windows
            if (!windowData.isCapsule) {
                if (this.snapSystem.currentZone) {
                    this.snapWindowToZone(windowId, this.snapSystem.currentZone);
                }
            }
            
            this.hideSnapPreview();

            windowElement.classList.remove('dragging');
            titlebar.style.cursor = '';

            // Remove global event listeners
            document.removeEventListener('mousemove', doDrag);
            document.removeEventListener('mouseup', stopDrag);

            e.preventDefault();
        };

        // Only attach mousedown to titlebar
        titlebar.addEventListener('mousedown', startDrag);

        // Add resize handles (disabled for capsule windows)
        this.addResizeHandles(windowElement, windowId);
    }

    /**
     * Add resize handles to window
     */
    addResizeHandles(windowElement, windowId) {
        const directions = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
        
        directions.forEach(direction => {
            const handle = document.createElement('div');
            handle.className = `resize-handle resize-${direction}`;
            handle.dataset.direction = direction;
            handle.title = `Resize ${direction.toUpperCase()}`;
            
            windowElement.appendChild(handle);
            
            // Setup resize functionality
            this.setupResizeHandle(handle, windowId, direction);
        });
    }

    /**
     * Setup resize handle functionality
     */
    setupResizeHandle(handle, windowId, direction) {
        const windowData = this.windows.get(windowId);
        
        handle.addEventListener('mousedown', (e) => {
            // Don't allow resizing capsule windows
            if (windowData.isCapsule) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            const startResize = this.createResizeHandler(windowId, direction);
            startResize(e);
        });
    }

    // ===== CORE WINDOW OPERATIONS & TASKBAR INTEGRATION =====

    /**
     * Gets all windows (required by taskbar in renderer.js)
     */
    getAllWindows() {
        return Array.from(this.windows.values());
    }

    /**
     * Gets active window
     */
    getActiveWindow() {
        return this.windows.get(this.activeWindow);
    }

    /**
     * Exposes restoreWindow method for external use (like taskbar)
     */
    restoreWindowById(windowId) {
        this.restoreWindow(windowId);
    }

    /**
     * Restore a minimized window
     */
    restoreWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;

        windowData.element.style.display = 'block';
        windowData.isMinimized = false;
        this.focusWindow(windowId);
        
        console.log(`Restored window: ${windowId}`);
    }

    /**
     * Focus a window
     */
    focusWindow(windowId) {
        // Remove focus from all windows
        this.windows.forEach((data, id) => {
            data.element.classList.remove('focused');
        });

        // Focus the target window
        const windowData = this.windows.get(windowId);
        if (windowData) {
            windowData.element.classList.add('focused');
            windowData.element.style.zIndex = ++this.zIndexCounter;
            this.activeWindow = windowId;
        }
    }

    /**
     * Minimize a window
     */
    minimizeWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;

        windowData.element.style.display = 'none';
        windowData.isMinimized = true;
        
        console.log(`Minimized window: ${windowId}`);
    }

    /**
     * Maximize a window
     */
    maximizeWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData || windowData.isCapsule) return; // Don't maximize capsules

        const windowElement = windowData.element;

        if (windowData.isMaximized) {
            // Restore
            if (windowData.savedPosition && windowData.savedSize) {
                windowElement.style.left = windowData.savedPosition.left;
                windowElement.style.top = windowData.savedPosition.top;
                windowElement.style.width = windowData.savedSize.width;
                windowElement.style.height = windowData.savedSize.height;
            }
            windowElement.classList.remove('maximized');
            windowData.isMaximized = false;
        } else {
            // Maximize
            windowData.savedPosition = {
                left: windowElement.style.left,
                top: windowElement.style.top
            };
            windowData.savedSize = {
                width: windowElement.style.width,
                height: windowElement.style.height
            };

            windowElement.style.left = this.availableArea.x + 'px';
            windowElement.style.top = this.availableArea.y + 'px';
            windowElement.style.width = this.availableArea.width + 'px';
            windowElement.style.height = this.availableArea.height + 'px';
            windowElement.classList.add('maximized');
            windowData.isMaximized = true;
        }
    }

    /**
     * Close a window
     */
    closeWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;

        // Clean up app if it has cleanup method
        if (windowData.app && typeof windowData.app.cleanup === 'function') {
            windowData.app.cleanup();
        }

        // Clean up capsule data
        if (windowData.isCapsule) {
            this.capsuleSystem.windows.delete(windowId);
            this.cleanupWindowScreenshot(windowId);
        }

        // Remove from DOM
        windowData.element.remove();

        // Remove from windows map
        this.windows.delete(windowId);

        // Update active window
        if (this.activeWindow === windowId) {
            this.activeWindow = null;
        }

        console.log(`Closed window: ${windowId}`);
    }

    // ===== SNAP SYSTEM METHODS (Preserved from original) =====

    getSnapZone(x, y) {
        const { snapThreshold, cornerSize, edgeSize } = this.snapSystem;
        const { width, height } = this.availableArea;

        // Corner zones (higher priority)
        if (x <= cornerSize && y <= cornerSize) return 'top-left';
        if (x >= width - cornerSize && y <= cornerSize) return 'top-right';
        if (x <= cornerSize && y >= height - cornerSize) return 'bottom-left';
        if (x >= width - cornerSize && y >= height - cornerSize) return 'bottom-right';

        // Edge zones
        if (y <= snapThreshold) return 'top';
        if (y >= height - snapThreshold) return 'bottom';
        if (x <= snapThreshold) return 'left';
        if (x >= width - snapThreshold) return 'right';

        return null;
    }

    showSnapPreview(zoneName) {
        const zone = this.snapSystem.zones[zoneName];
        if (!zone) return;

        const preview = this.snapSystem.previewElement;
        preview.style.display = 'block';
        preview.style.left = zone.x + 'px';
        preview.style.top = zone.y + 'px';
        preview.style.width = zone.width + 'px';
        preview.style.height = zone.height + 'px';
        preview.classList.add('fade-in');
        preview.classList.remove('fade-out');
    }

    hideSnapPreview() {
        const preview = this.snapSystem.previewElement;
        preview.classList.add('fade-out');
        preview.classList.remove('fade-in');
        
        setTimeout(() => {
            preview.style.display = 'none';
        }, 200);
    }

    snapWindowToZone(windowId, zoneName) {
        const windowData = this.windows.get(windowId);
        const windowElement = windowData.element;
        const zone = this.snapSystem.zones[zoneName];

        if (!zone) return;

        windowElement.classList.add('window-snapping');

        const dimensions = {
            left: zone.x,
            top: zone.y,
            width: zone.width,
            height: zone.height
        };

        windowElement.style.left = dimensions.left + 'px';
        windowElement.style.top = dimensions.top + 'px';
        windowElement.style.width = dimensions.width + 'px';
        windowElement.style.height = dimensions.height + 'px';

        if (zoneName === 'top') {
            windowData.isMaximized = true;
            windowElement.classList.add('maximized');
        } else {
            windowData.isMaximized = false;
            windowElement.classList.remove('maximized');
        }

        setTimeout(() => {
            windowElement.classList.remove('window-snapping');
        }, this.snapSystem.animationDuration);

        console.log(`Snapped window ${windowId} to ${zoneName}`);
    }

    clearHoverTimer() {
        if (this.snapSystem.hoverTimer) {
            clearTimeout(this.snapSystem.hoverTimer);
            this.snapSystem.hoverTimer = null;
        }
    }

    // ===== UTILITY METHODS =====

    /**
     * Generate icon HTML for window titlebar
     */
    generateIconHtml(icon) {
        if (!icon) return '';
        
        // Check if it's a material icon
        if (icon.includes('-') || icon.includes('_')) {
            return `<div class="window-icon material-icon">
                <span class="material-symbols-outlined">${icon}</span>
            </div>`;
        }
        
        // Treat as emoji
        return `<div class="window-icon emoji-icon">${icon}</div>`;
    }

    /**
     * Calculate default position for new windows
     */
    calculateDefaultPosition() {
        const offset = (this.nextId - 1) * 30;
        return {
            x: 100 + offset,
            y: 100 + offset
        };
    }

    /**
     * Update available desktop area
     */
    updateAvailableArea(left, right, top, bottom) {
        this.availableArea = {
            x: left,
            y: top,
            width: window.innerWidth - left - right,
            height: window.innerHeight - top - bottom
        };
        
        this.updateSnapZones();
    }

    /**
     * Setup global event listeners
     */
    setupGlobalListeners() {
        // Focus management
        document.addEventListener('mousedown', (e) => {
            // If clicking outside all windows, clear focus
            if (!e.target.closest('.nebula-window')) {
                this.windows.forEach((data) => {
                    data.element.classList.remove('focused');
                });
                this.activeWindow = null;
            }
        });
        
        // Prevent drag on window controls
        document.addEventListener('dragstart', (e) => {
            if (e.target.closest('.window-controls')) {
                e.preventDefault();
            }
        });
    }

    /**
     * Create resize handler for window
     */
    createResizeHandler(windowId, direction) {
        return (e) => {
            const windowData = this.windows.get(windowId);
            const windowElement = windowData.element;
            
            const startX = e.clientX;
            const startY = e.clientY;
            const startWidth = parseInt(windowElement.style.width);
            const startHeight = parseInt(windowElement.style.height);
            const startLeft = parseInt(windowElement.style.left);
            const startTop = parseInt(windowElement.style.top);
            
            const resize = (e) => {
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;
                
                let newWidth = startWidth;
                let newHeight = startHeight;
                let newLeft = startLeft;
                let newTop = startTop;
                
                // Calculate new dimensions based on direction
                if (direction.includes('e')) newWidth = startWidth + deltaX;
                if (direction.includes('w')) {
                    newWidth = startWidth - deltaX;
                    newLeft = startLeft + deltaX;
                }
                if (direction.includes('s')) newHeight = startHeight + deltaY;
                if (direction.includes('n')) {
                    newHeight = startHeight - deltaY;
                    newTop = startTop + deltaY;
                }
                
                // Apply minimum constraints
                const minWidth = 200;
                const minHeight = 150;
                
                if (newWidth >= minWidth) {
                    windowElement.style.width = newWidth + 'px';
                    if (direction.includes('w')) {
                        windowElement.style.left = newLeft + 'px';
                    }
                }
                
                if (newHeight >= minHeight) {
                    windowElement.style.height = newHeight + 'px';
                    if (direction.includes('n')) {
                        windowElement.style.top = newTop + 'px';
                    }
                }
            };
            
            const stopResize = () => {
                document.removeEventListener('mousemove', resize);
                document.removeEventListener('mouseup', stopResize);
                document.body.style.cursor = '';
            };
            
            document.addEventListener('mousemove', resize);
            document.addEventListener('mouseup', stopResize);
            document.body.style.cursor = `${direction}-resize`;
        };
    }

    // ===== APP INTEGRATION METHODS (Preserved) =====

    /**
     * Load an app into a window
     */
    loadApp(windowId, app, tabId = null) {
        const windowData = this.windows.get(windowId);
        if (!windowData) {
            console.error(`Window ${windowId} not found`);
            return;
        }

        windowData.app = app;

        if (windowData.config.hasTabBar && tabId) {
            this.loadAppInTab(windowId, app, tabId);
        } else {
            this.loadAppInWindow(windowId, app);
        }
    }

    /**
     * Load app content directly into window
     */
    loadAppInWindow(windowId, app) {
        const windowData = this.windows.get(windowId);
        const contentArea = windowData.element.querySelector('.window-content');

        contentArea.innerHTML = '';
        
        if (app.render && typeof app.render === 'function') {
            const appContent = app.render();
            if (appContent instanceof HTMLElement) {
                contentArea.appendChild(appContent);
            } else if (typeof appContent === 'string') {
                contentArea.innerHTML = appContent;
            }
        }

        // Update window title if app provides one
        if (app.getTitle && typeof app.getTitle === 'function') {
            this.setWindowTitle(windowId, app.getTitle());
        }

        // Update window icon if app provides one
        if (app.getIcon && typeof app.getIcon === 'function') {
            this.setWindowIcon(windowId, app.getIcon());
        }
    }

    /**
     * Set window title
     */
    setWindowTitle(windowId, title) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;

        const titleElement = windowData.element.querySelector('.window-title');
        if (titleElement) {
            titleElement.textContent = title;
        }
        
        windowData.config.title = title;
    }

    /**
     * Set window icon
     */
    setWindowIcon(windowId, icon) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;

        const iconElement = windowData.element.querySelector('.window-icon');
        if (iconElement) {
            iconElement.innerHTML = this.generateIconHtml(icon).replace('<div class="window-icon material-icon">', '').replace('<div class="window-icon emoji-icon">', '').replace('</div>', '');
        }
        
        windowData.config.icon = icon;
    }
}

// Auto-load html2canvas if not already available
if (typeof window !== 'undefined' && !window.html2canvas) {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    script.onload = () => {
        console.log('📸 html2canvas loaded for screenshot functionality');
    };
    document.head.appendChild(script);
}

// Make WindowManager globally available
if (typeof window !== 'undefined') {
    window.WindowManager = WindowManager;
}