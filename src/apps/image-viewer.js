// ImageViewer.js - Fixed image viewer that loads real images from file system

class ImageViewer {
    constructor(filename, filepath) {
        this.filename = filename;
        this.filepath = filepath;
        this.windowId = null;
        this.currentZoom = 1;
        this.maxZoom = 10;
        this.minZoom = 0.1;
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.imageOffset = { x: 0, y: 0 };
        this.rotation = 0;
        
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
        
        console.log(`Image viewer initialized for: ${this.filename} at ${this.filepath}`);
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
            background: #1a1a1a;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
        
        // Load the actual image
        setTimeout(() => this.loadRealImage(), 100);
        
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
            padding: 10px 16px;
            background: #2d2d2d;
            color: white;
            border-bottom: 1px solid #404040;
            flex-shrink: 0;
            font-size: 14px;
        `;
        
        toolbar.innerHTML = `
            <button class="toolbar-btn" id="zoom-out" title="Zoom Out">🔍-</button>
            <span class="zoom-display" id="zoom-display">100%</span>
            <button class="toolbar-btn" id="zoom-in" title="Zoom In">🔍+</button>
            <button class="toolbar-btn" id="zoom-fit" title="Fit to Window">📐</button>
            <button class="toolbar-btn" id="zoom-actual" title="Actual Size">1:1</button>
            <div class="toolbar-separator"></div>
            <button class="toolbar-btn" id="rotate-left" title="Rotate Left">↶</button>
            <button class="toolbar-btn" id="rotate-right" title="Rotate Right">↷</button>
            <div class="toolbar-separator"></div>
            <span class="filename-display">${this.filename}</span>
        `;
        
        // Add toolbar styles
        const style = document.createElement('style');
        style.textContent = `
            .image-viewer-container .toolbar-btn {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: white;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                transition: background-color 0.2s;
            }
            
            .image-viewer-container .toolbar-btn:hover {
                background: rgba(255, 255, 255, 0.2);
            }
            
            .image-viewer-container .toolbar-btn:active {
                background: rgba(255, 255, 255, 0.3);
            }
            
            .image-viewer-container .toolbar-separator {
                width: 1px;
                height: 20px;
                background: rgba(255, 255, 255, 0.3);
                margin: 0 5px;
            }
            
            .image-viewer-container .zoom-display {
                min-width: 50px;
                text-align: center;
                font-weight: bold;
                color: #66d9ef;
            }
            
            .image-viewer-container .filename-display {
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
            background: #1a1a1a;
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
            transition: transform 0.3s ease;
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
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        `;
        
        imageContainer.appendChild(image);
        imageArea.appendChild(imageContainer);
        
        // Add drag functionality
        this.setupImageDragging(imageArea, imageContainer);
        
        // Add mouse wheel zoom
        this.setupMouseWheelZoom(imageArea);
        
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
            padding: 8px 16px;
            background: #2d2d2d;
            border-top: 1px solid #404040;
            font-size: 12px;
            color: #9ca3af;
            flex-shrink: 0;
        `;
        
        statusBar.innerHTML = `
            <span class="image-info" id="image-info">Loading image...</span>
            <span class="image-path" id="image-path">${this.filepath}</span>
        `;
        
        return statusBar;
    }
    
    /**
     * Load the actual image from file system
     */
    async loadRealImage() {
        const image = document.querySelector('.viewer-image');
        const imageInfo = document.getElementById('image-info');
        
        try {
            if (!window.nebula?.fs?.readFile) {
                throw new Error('File system API not available');
            }
            
            imageInfo.textContent = 'Loading image...';
            console.log(`Attempting to load image: ${this.filepath}`);
            
            // Try reading the file - the Enhanced preload might return different formats
            let imageData;
            try {
                // First try reading as binary (no encoding specified)
                imageData = await window.nebula.fs.readFile(this.filepath);
                console.log('File read successfully, data type:', typeof imageData, 'length:', imageData?.length);
            } catch (error) {
                console.error('Failed to read file:', error);
                throw new Error(`Cannot read file: ${error.message}`);
            }
            
            // Handle different data formats that might be returned
            let imageUrl;
            
            // Revoke any previously created object URL for this viewer
            try { if (this._currentImageUrl) { URL.revokeObjectURL(this._currentImageUrl); this._currentImageUrl = null; } } catch(e) {}

            if (imageData instanceof ArrayBuffer || imageData instanceof Uint8Array) {
                // Binary data - create blob directly
                console.log('Creating blob from binary data');
                const blob = new Blob([imageData]);
                imageUrl = URL.createObjectURL(blob);
                this._currentImageUrl = imageUrl;
            } else if (typeof imageData === 'string') {
                // Check if it's base64 encoded
                if (imageData.startsWith('data:image/')) {
                    // Already a data URL
                    console.log('Using data URL directly');
                    imageUrl = imageData;
                } else {
                    // Try to convert string to binary
                    console.log('Converting string to binary');
                    const bytes = new Uint8Array(imageData.length);
                    for (let i = 0; i < imageData.length; i++) {
                        bytes[i] = imageData.charCodeAt(i);
                    }
                    const blob = new Blob([bytes]);
                    imageUrl = URL.createObjectURL(blob);
                    this._currentImageUrl = imageUrl;
                }
            } else {
                throw new Error(`Unexpected data format: ${typeof imageData}`);
            }
            
            // Set up image load handlers
            image.onload = () => {
                const width = image.naturalWidth;
                const height = image.naturalHeight;
                const sizeText = imageData?.length ? this.formatFileSize(imageData.length) : 'Unknown size';
                
                imageInfo.textContent = `${width} × ${height} pixels • ${sizeText}`;
                
                // Fit to window initially
                setTimeout(() => this.fitToWindow(), 100);
                
                console.log(`Successfully loaded image: ${this.filename} (${width}x${height})`);

                // Revoke object URL now that the image has been loaded into the element
                try { if (this._currentImageUrl) { URL.revokeObjectURL(this._currentImageUrl); this._currentImageUrl = null; } } catch(e) { /* ignore */ }
            };
            
            image.onerror = (e) => {
                console.error('Image load error:', e);
                console.error('Failed image URL:', imageUrl);
                imageInfo.textContent = 'Error loading image';
                this.showErrorPlaceholder(image);

                // Revoke blob URL if load failed
                try { if (this._currentImageUrl) { URL.revokeObjectURL(this._currentImageUrl); this._currentImageUrl = null; } } catch(e) { /* ignore */ }
            };
            
            // Set the image source
            console.log('Setting image source:', imageUrl);
            image.src = imageUrl;
            
        } catch (error) {
            console.error('Error in loadRealImage:', error);
            imageInfo.textContent = `Error: ${error.message}`;
            this.showErrorPlaceholder(image);
        }
    }
    
    /**
     * Show error placeholder when image fails to load
     */
    showErrorPlaceholder(image) {
        // Create a canvas with error message
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 300;
        const ctx = canvas.getContext('2d');
        
        // Background
        ctx.fillStyle = '#2d2d2d';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Border
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
        
        // Error icon
        ctx.fillStyle = '#ff6b6b';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚠️', canvas.width / 2, canvas.height / 2 - 40);
        
        // Error text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px Arial';
        ctx.fillText('Failed to load image', canvas.width / 2, canvas.height / 2 + 10);
        
        ctx.font = '14px Arial';
        ctx.fillStyle = '#9ca3af';
        ctx.fillText(this.filename, canvas.width / 2, canvas.height / 2 + 35);
        
        image.src = canvas.toDataURL();
    }
    
    /**
     * Setup toolbar event listeners
     */
    setupToolbarListeners(toolbar) {
        toolbar.querySelector('#zoom-in').addEventListener('click', () => this.zoomIn());
        toolbar.querySelector('#zoom-out').addEventListener('click', () => this.zoomOut());
        toolbar.querySelector('#zoom-fit').addEventListener('click', () => this.fitToWindow());
        toolbar.querySelector('#zoom-actual').addEventListener('click', () => this.actualSize());
        toolbar.querySelector('#rotate-left').addEventListener('click', () => this.rotateLeft());
        toolbar.querySelector('#rotate-right').addEventListener('click', () => this.rotateRight());
    }
    
    /**
     * Setup image dragging
     */
    setupImageDragging(imageArea, imageContainer) {
        imageArea.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left mouse button
                this.isDragging = true;
                this.dragStart = { x: e.clientX - this.imageOffset.x, y: e.clientY - this.imageOffset.y };
                imageArea.style.cursor = 'grabbing';
                e.preventDefault();
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                this.imageOffset.x = e.clientX - this.dragStart.x;
                this.imageOffset.y = e.clientY - this.dragStart.y;
                this.updateImageTransform(imageContainer);
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                imageArea.style.cursor = 'grab';
            }
        });
    }
    
    /**
     * Setup mouse wheel zoom
     */
    setupMouseWheelZoom(imageArea) {
        imageArea.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            this.zoom(this.currentZoom + delta);
        });
    }
    
    /**
     * Update image transform (zoom, rotation, position)
     */
    updateImageTransform(imageContainer) {
        imageContainer.style.transform = `
            translate(${this.imageOffset.x}px, ${this.imageOffset.y}px) 
            scale(${this.currentZoom}) 
            rotate(${this.rotation}deg)
        `;
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
     * Zoom in
     */
    zoomIn() {
        this.zoom(this.currentZoom * 1.25);
    }
    
    /**
     * Zoom out
     */
    zoomOut() {
        this.zoom(this.currentZoom / 1.25);
    }
    
    /**
     * Set zoom level
     */
    zoom(level) {
        this.currentZoom = Math.max(this.minZoom, Math.min(this.maxZoom, level));
        this.updateZoomDisplay();
        
        const imageContainer = document.querySelector('.image-container');
        if (imageContainer) {
            this.updateImageTransform(imageContainer);
        }
    }
    
    /**
     * Fit image to window
     */
    fitToWindow() {
        const image = document.querySelector('.viewer-image');
        const imageArea = document.querySelector('.image-display-area');
        
        if (!image.naturalWidth || !image.naturalHeight) return;
        
        const containerWidth = imageArea.clientWidth - 40; // Padding
        const containerHeight = imageArea.clientHeight - 40;
        const imageWidth = image.naturalWidth;
        const imageHeight = image.naturalHeight;
        
        const scaleX = containerWidth / imageWidth;
        const scaleY = containerHeight / imageHeight;
        const scale = Math.min(scaleX, scaleY);
        
        this.currentZoom = scale;
        this.imageOffset = { x: 0, y: 0 };
        this.rotation = 0;
        
        this.updateZoomDisplay();
        const imageContainer = document.querySelector('.image-container');
        if (imageContainer) {
            this.updateImageTransform(imageContainer);
        }
    }
    
    /**
     * Show at actual size (100%)
     */
    actualSize() {
        this.currentZoom = 1;
        this.imageOffset = { x: 0, y: 0 };
        this.rotation = 0;
        
        this.updateZoomDisplay();
        const imageContainer = document.querySelector('.image-container');
        if (imageContainer) {
            this.updateImageTransform(imageContainer);
        }
    }
    
    /**
     * Rotate left
     */
    rotateLeft() {
        this.rotation -= 90;
        const imageContainer = document.querySelector('.image-container');
        if (imageContainer) {
            this.updateImageTransform(imageContainer);
        }
    }
    
    /**
     * Rotate right
     */
    rotateRight() {
        this.rotation += 90;
        const imageContainer = document.querySelector('.image-container');
        if (imageContainer) {
            this.updateImageTransform(imageContainer);
        }
    }
    
    /**
     * Format file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
    
    /**
     * Get app title
     */
    getTitle() {
        return `Image Viewer - ${this.filename}`;
    }
    
    /**
     * Get app icon
     */
    getIcon() {
        return '🖼️';
    }
    
    /**
     * Cleanup when viewer is closed
     */
    cleanup() {
        // Clean up any blob URLs to prevent memory leaks
        const image = document.querySelector('.viewer-image');
        if (image && image.src.startsWith('blob:')) {
            URL.revokeObjectURL(image.src);
        }
        console.log('Image viewer cleaned up');
    }
}

// Export for use
window.ImageViewer = ImageViewer;