// ImageViewer.js - Image viewer app for NebulaDesktop

class ImageViewer {
    constructor(filename, filepath) {
        this.filename = filename;
        this.filepath = filepath;
        this.windowId = null;
        this.currentZoom = 1;
        this.maxZoom = 5;
        this.minZoom = 0.1;
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.imageOffset = { x: 0, y: 0 };
        
        this.init();
    }
    
    async init() {
        if (!window.windowManager) {
            console.error('WindowManager not available');
            return;
        }
        
        // Create image viewer window
        this.windowId = window.windowManager.createWindow({
            title: `Image Viewer - ${this.filename}`,
            width: 800,
            height: 600,
            resizable: true,
            maximizable: true,
            minimizable: true
        });
        
        // Load image viewer into window
        window.windowManager.loadApp(this.windowId, this);
        
        console.log(`Image viewer initialized for: ${this.filename}`);
    }
    
    /**
     * Called by WindowManager to render the image viewer
     */
    render() {
        const container = document.createElement('div');
        container.className = 'image-viewer-container';
        container.style.cssText = `
            width: 100%;
            height: 100%;
            background: var(--nebula-surface, #2a2a2a);
            display: flex;
            flex-direction: column;
            overflow: hidden;
        `;
        
        // Create toolbar
        const toolbar = this.createToolbar();
        container.appendChild(toolbar);
        
        // Create image display area
        const imageArea = this.createImageArea();
        container.appendChild(imageArea);
        
        // Create status bar
        const statusBar = this.createStatusBar();
        container.appendChild(statusBar);
        
        // Load the image
        this.loadImage();
        
        return container;
    }
    
    /**
     * Create toolbar with zoom and navigation controls
     */
    createToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'image-viewer-toolbar';
        toolbar.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px;
            background: var(--nebula-primary, #667eea);
            color: white;
            border-bottom: 1px solid var(--nebula-border, #444);
            flex-shrink: 0;
        `;
        
        toolbar.innerHTML = `
            <button class="toolbar-btn" id="zoom-out" title="Zoom Out">
                <span class="material-symbols-outlined">zoom_out</span>
            </button>
            <span class="zoom-display" id="zoom-display">100%</span>
            <button class="toolbar-btn" id="zoom-in" title="Zoom In">
                <span class="material-symbols-outlined">zoom_in</span>
            </button>
            <button class="toolbar-btn" id="zoom-fit" title="Fit to Window">
                <span class="material-symbols-outlined">fit_screen</span>
            </button>
            <button class="toolbar-btn" id="zoom-actual" title="Actual Size">
                <span class="material-symbols-outlined">crop_free</span>
            </button>
            <div class="toolbar-separator"></div>
            <button class="toolbar-btn" id="rotate-left" title="Rotate Left">
                <span class="material-symbols-outlined">rotate_left</span>
            </button>
            <button class="toolbar-btn" id="rotate-right" title="Rotate Right">
                <span class="material-symbols-outlined">rotate_right</span>
            </button>
            <div class="toolbar-separator"></div>
            <span class="filename-display">${this.filename}</span>
        `;
        
        // Add toolbar styles
        const style = document.createElement('style');
        style.textContent = `
            .toolbar-btn {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: white;
                padding: 6px 8px;
                border-radius: 4px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background-color 0.2s;
            }
            
            .toolbar-btn:hover {
                background: rgba(255, 255, 255, 0.2);
            }
            
            .toolbar-btn:active {
                background: rgba(255, 255, 255, 0.3);
            }
            
            .toolbar-separator {
                width: 1px;
                height: 20px;
                background: rgba(255, 255, 255, 0.3);
                margin: 0 5px;
            }
            
            .zoom-display {
                min-width: 50px;
                text-align: center;
                font-weight: bold;
            }
            
            .filename-display {
                margin-left: auto;
                font-weight: bold;
                opacity: 0.9;
            }
        `;
        document.head.appendChild(style);
        
        // Add event listeners
        this.setupToolbarListeners(toolbar);
        
        return toolbar;
    }
    
    /**
     * Create image display area
     */
    createImageArea() {
        const imageArea = document.createElement('div');
        imageArea.className = 'image-display-area';
        imageArea.style.cssText = `
            flex: 1;
            overflow: hidden;
            position: relative;
            background: var(--nebula-background, #1a1a1a);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: grab;
        `;
        
        // Create image container
        const imageContainer = document.createElement('div');
        imageContainer.className = 'image-container';
        imageContainer.style.cssText = `
            position: relative;
            transform-origin: center center;
            transition: transform 0.2s ease;
        `;
        
        // Create image element
        const image = document.createElement('img');
        image.className = 'viewer-image';
        image.style.cssText = `
            max-width: none;
            max-height: none;
            display: block;
            user-select: none;
            pointer-events: none;
        `;
        
        imageContainer.appendChild(image);
        imageArea.appendChild(imageContainer);
        
        // Add drag functionality
        this.setupImageDragging(imageArea, imageContainer);
        
        return imageArea;
    }
    
    /**
     * Create status bar
     */
    createStatusBar() {
        const statusBar = document.createElement('div');
        statusBar.className = 'image-viewer-status';
        statusBar.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 5px 10px;
            background: var(--nebula-surface, #2a2a2a);
            border-top: 1px solid var(--nebula-border, #444);
            font-size: 12px;
            color: var(--nebula-text-secondary, #9ca3af);
            flex-shrink: 0;
        `;
        
        statusBar.innerHTML = `
            <span class="image-info" id="image-info">Loading...</span>
            <span class="image-path" id="image-path">${this.filepath}</span>
        `;
        
        return statusBar;
    }
    
    /**
     * Setup toolbar event listeners
     */
    setupToolbarListeners(toolbar) {
        toolbar.querySelector('#zoom-in').addEventListener('click', () => this.zoomIn());
        toolbar.querySelector('#zoom-out').addEventListener('click', () => this.zoomOut());
        toolbar.querySelector('#zoom-fit').addEventListener('click', () => this.fitToWindow());
        toolbar.querySelector('#zoom-actual').addEventListener('click', () => this.actualSize());
        toolbar.querySelector('#rotate-left').addEventListener('click', () => this.rotate(-90));
        toolbar.querySelector('#rotate-right').addEventListener('click', () => this.rotate(90));
    }
    
    /**
     * Setup image dragging functionality
     */
    setupImageDragging(imageArea, imageContainer) {
        let isDragging = false;
        let dragStart = { x: 0, y: 0 };
        let imageStart = { x: 0, y: 0 };
        
        imageArea.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left mouse button
                isDragging = true;
                dragStart = { x: e.clientX, y: e.clientY };
                imageStart = { ...this.imageOffset };
                imageArea.style.cursor = 'grabbing';
                e.preventDefault();
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const deltaX = e.clientX - dragStart.x;
                const deltaY = e.clientY - dragStart.y;
                
                this.imageOffset.x = imageStart.x + deltaX;
                this.imageOffset.y = imageStart.y + deltaY;
                
                this.updateImageTransform(imageContainer);
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                imageArea.style.cursor = 'grab';
            }
        });
        
        // Mouse wheel zoom
        imageArea.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            this.zoom(this.currentZoom + delta);
        });
    }
    
    /**
     * Load and display the image
     */
    async loadImage() {
        const image = document.querySelector('.viewer-image');
        const imageInfo = document.getElementById('image-info');
        
        try {
            // For now, we'll create a placeholder since we don't have real file system access
            // In a real implementation, this would load the actual file
            image.src = this.createPlaceholderImage();
            
            image.onload = () => {
                const width = image.naturalWidth;
                const height = image.naturalHeight;
                const size = this.formatFileSize(width * height * 4); // Approximate size
                
                imageInfo.textContent = `${width} × ${height} pixels • ${size}`;
                
                // Fit to window initially
                this.fitToWindow();
            };
            
            image.onerror = () => {
                imageInfo.textContent = 'Error loading image';
                image.alt = 'Failed to load image';
            };
            
        } catch (error) {
            console.error('Error loading image:', error);
            imageInfo.textContent = 'Error loading image';
        }
    }
    
    /**
     * Create a placeholder image (for demo purposes)
     */
    createPlaceholderImage() {
        // Create a canvas with a placeholder image
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        
        // Create gradient background
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Image Viewer', canvas.width / 2, canvas.height / 2 - 50);
        
        ctx.font = '24px Arial';
        ctx.fillText(this.filename, canvas.width / 2, canvas.height / 2 + 20);
        
        ctx.font = '16px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillText('Placeholder Image', canvas.width / 2, canvas.height / 2 + 60);
        
        return canvas.toDataURL();
    }
    
    /**
     * Zoom in
     */
    zoomIn() {
        this.zoom(this.currentZoom * 1.2);
    }
    
    /**
     * Zoom out
     */
    zoomOut() {
        this.zoom(this.currentZoom / 1.2);
    }
    
    /**
     * Set zoom level
     */
    zoom(level) {
        this.currentZoom = Math.max(this.minZoom, Math.min(this.maxZoom, level));
        this.updateZoomDisplay();
        
        const imageContainer = document.querySelector('.image-container');
        this.updateImageTransform(imageContainer);
    }
    
    /**
     * Fit image to window
     */
    fitToWindow() {
        const image = document.querySelector('.viewer-image');
        const imageArea = document.querySelector('.image-display-area');
        
        if (!image.naturalWidth || !image.naturalHeight) return;
        
        const containerWidth = imageArea.clientWidth;
        const containerHeight = imageArea.clientHeight;
        const imageWidth = image.naturalWidth;
        const imageHeight = image.naturalHeight;
        
        const scaleX = containerWidth / imageWidth;
        const scaleY = containerHeight / imageHeight;
        const scale = Math.min(scaleX, scaleY) * 0.9; // 90% to add some padding
        
        this.currentZoom = scale;
        this.imageOffset = { x: 0, y: 0 };
        
        this.updateZoomDisplay();
        const imageContainer = document.querySelector('.image-container');
        this.updateImageTransform(imageContainer);
    }
    
    /**
     * Show actual size (100%)
     */
    actualSize() {
        this.currentZoom = 1;
        this.imageOffset = { x: 0, y: 0 };
        
        this.updateZoomDisplay();
        const imageContainer = document.querySelector('.image-container');
        this.updateImageTransform(imageContainer);
    }
    
    /**
     * Rotate image
     */
    rotate(degrees) {
        // For simplicity, we'll just show a message
        // In a full implementation, this would rotate the image
        console.log(`Rotating image by ${degrees} degrees`);
        // Could implement actual rotation using CSS transforms
    }
    
    /**
     * Update image transform
     */
    updateImageTransform(imageContainer) {
        if (imageContainer) {
            imageContainer.style.transform = `translate(${this.imageOffset.x}px, ${this.imageOffset.y}px) scale(${this.currentZoom})`;
        }
    }
    
    /**
     * Update zoom display
     */
    updateZoomDisplay() {
        const zoomDisplay = document.getElementById('zoom-display');
        if (zoomDisplay) {
            zoomDisplay.textContent = `${Math.round(this.currentZoom * 100)}%`;
        }
    }
    
    /**
     * Format file size
     */
    formatFileSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    }
    
    /**
     * Get window title
     */
    getTitle() {
        return `Image Viewer - ${this.filename}`;
    }
    
    /**
     * Get window icon
     */
    getIcon() {
        return '🖼️';
    }
    
    /**
     * Cleanup when window is closed
     */
    cleanup() {
        console.log('Image viewer cleanup');
        // Clean up any resources, event listeners, etc.
    }
}

// Make ImageViewer available globally
window.ImageViewer = ImageViewer;

