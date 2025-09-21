// NebulaImageEditor - Full-featured image editor with Adobe-like layering system
// Based on NebulaApp Single Window Template

class NebulaImageEditor {
    constructor() {
        this.windowId = null;
        this.canvas = null;
        this.context = null;
        this.layerManager = null;
        this.toolManager = null;
        this.eventManager = null;
        this.currentDocument = null;
        this.activePanel = null;
        
        // Canvas dimensions
        this.canvasWidth = 800;
        this.canvasHeight = 600;
        
        // Zoom and pan
        this.zoom = 1.0;
        this.panX = 0;
        this.panY = 0;
        
        this.init();
    }
    
    async init() {
        if (!window.windowManager) {
            console.error('WindowManager not available');
            return;
        }
        
        this.windowId = window.windowManager.createWindow({
            title: 'OLLIE',
            width: 1200,
            height: 800,
            resizable: true,
            maximizable: true,
            minimizable: true
        });
        
        // Initialize core systems
        this.eventManager = new EventManager();
        this.layerManager = new LayerManager(this.eventManager);
        this.toolManager = new ToolManager(this.eventManager);
        
        // Load this app into the window
        window.windowManager.loadApp(this.windowId, this);
        
        console.log(`NebulaImageEditor initialized with window ${this.windowId}`);
    }
    
    render() {
        const container = document.createElement('div');
        container.className = 'image-editor-container';
        container.style.cssText = `
            width: 100%;
            height: 100%;
            background: var(--nebula-bg-primary);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            font-family: var(--nebula-font-family);
        `;
        
        // Create main sections
        const toolbar = this.createToolbar();
        const mainArea = this.createMainArea();
        const statusBar = this.createStatusBar();
        
        // Assemble the UI
        container.appendChild(toolbar);
        container.appendChild(mainArea);
        container.appendChild(statusBar);
        
        // Initialize after UI is created
        setTimeout(() => {
            this.setupEventListeners();
            this.initializeCanvas();
            this.createNewDocument();
        }, 0);
        
        return container;
    }
    
    createToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'image-editor-toolbar';
        toolbar.style.cssText = `
            height: 48px;
            background: var(--nebula-surface);
            border-bottom: 1px solid var(--nebula-border);
            display: flex;
            align-items: center;
            padding: 0 16px;
            gap: 8px;
            flex-shrink: 0;
        `;
        
        toolbar.innerHTML = `
            <button class="toolbar-btn" id="new-btn" title="New Document">
                <span class="material-symbols-outlined">add</span>
            </button>
            
            <button class="toolbar-btn" id="open-btn" title="Open Image">
                <span class="material-symbols-outlined">folder_open</span>
            </button>
            
            <button class="toolbar-btn" id="save-btn" title="Save">
                <span class="material-symbols-outlined">save</span>
            </button>
            
            <div class="toolbar-separator"></div>
            
            <button class="toolbar-btn" id="undo-btn" title="Undo">
                <span class="material-symbols-outlined">undo</span>
            </button>
            
            <button class="toolbar-btn" id="redo-btn" title="Redo">
                <span class="material-symbols-outlined">redo</span>
            </button>
            
            <div class="toolbar-separator"></div>
            
            <button class="toolbar-btn tool-btn" id="brush-tool" title="Brush Tool" data-tool="brush">
                <span class="material-symbols-outlined">brush</span>
            </button>
            
            <button class="toolbar-btn tool-btn" id="pencil-tool" title="Pencil Tool" data-tool="pencil">
                <span class="material-symbols-outlined">edit</span>
            </button>
            
            <button class="toolbar-btn tool-btn" id="eraser-tool" title="Eraser Tool" data-tool="eraser">
                <span class="material-symbols-outlined">cleaning_services</span>
            </button>
            
            <button class="toolbar-btn tool-btn" id="select-tool" title="Selection Tool" data-tool="select">
                <span class="material-symbols-outlined">crop_free</span>
            </button>
            
            <div class="toolbar-separator"></div>
            
            <div class="zoom-controls" style="display: flex; align-items: center; gap: 8px;">
                <button class="toolbar-btn" id="zoom-out-btn" title="Zoom Out">
                    <span class="material-symbols-outlined">zoom_out</span>
                </button>
                <span id="zoom-level" style="min-width: 60px; text-align: center; color: var(--nebula-text-primary);">100%</span>
                <button class="toolbar-btn" id="zoom-in-btn" title="Zoom In">
                    <span class="material-symbols-outlined">zoom_in</span>
                </button>
            </div>
            
            <div class="toolbar-title" style="margin-left: auto; font-weight: 500; color: var(--nebula-text-primary);">
                Online Layered Light & Image Editor
            </div>
        `;
        
        this.addToolbarStyles();
        return toolbar;
    }
    
    createMainArea() {
        const mainArea = document.createElement('div');
        mainArea.className = 'main-area';
        mainArea.style.cssText = `
            flex: 1;
            display: flex;
            overflow: hidden;
        `;
        
        // Left panel (tools and properties)
        const leftPanel = document.createElement('div');
        leftPanel.className = 'left-panel';
        leftPanel.style.cssText = `
            width: 250px;
            background: var(--nebula-surface);
            border-right: 1px solid var(--nebula-border);
            display: flex;
            flex-direction: column;
            flex-shrink: 0;
        `;
        
        // Canvas area
        const canvasArea = document.createElement('div');
        canvasArea.className = 'canvas-area';
        canvasArea.style.cssText = `
            flex: 1;
            background: #2a2a2a;
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        // Right panel (layers)
        const rightPanel = document.createElement('div');
        rightPanel.className = 'right-panel';
        rightPanel.style.cssText = `
            width: 300px;
            background: var(--nebula-surface);
            border-left: 1px solid var(--nebula-border);
            display: flex;
            flex-direction: column;
            flex-shrink: 0;
        `;
        
        // Create panels content
        leftPanel.appendChild(this.createToolsPanel());
        leftPanel.appendChild(this.createPropertiesPanel());
        canvasArea.appendChild(this.createCanvasContainer());
        rightPanel.appendChild(this.createLayersPanel());
        rightPanel.appendChild(this.createHistoryPanel());
        
        mainArea.appendChild(leftPanel);
        mainArea.appendChild(canvasArea);
        mainArea.appendChild(rightPanel);
        
        return mainArea;
    }
    
    createCanvasContainer() {
        const container = document.createElement('div');
        container.className = 'canvas-container';
        container.style.cssText = `
            position: relative;
            background: white;
            box-shadow: 0 0 20px rgba(0,0,0,0.3);
            border: 1px solid #ccc;
        `;
        
        // Main canvas
        const canvas = document.createElement('canvas');
        canvas.id = 'main-canvas';
        canvas.width = this.canvasWidth;
        canvas.height = this.canvasHeight;
        canvas.style.cssText = `
            display: block;
            cursor: crosshair;
        `;
        
        container.appendChild(canvas);
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
        
        return container;
    }
    
    createToolsPanel() {
        const panel = document.createElement('div');
        panel.className = 'tools-panel';
        panel.style.cssText = `
            flex: 1;
            padding: 16px;
            border-bottom: 1px solid var(--nebula-border);
        `;
        
        panel.innerHTML = `
            <h3 style="margin: 0 0 16px 0; color: var(--nebula-text-primary); font-size: 14px;">Tools</h3>
            <div class="tool-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
                <button class="tool-btn-large" data-tool="brush" title="Brush Tool">
                    <span class="material-symbols-outlined">brush</span>
                    <span>Brush</span>
                </button>
                <button class="tool-btn-large" data-tool="pencil" title="Pencil Tool">
                    <span class="material-symbols-outlined">edit</span>
                    <span>Pencil</span>
                </button>
                <button class="tool-btn-large" data-tool="eraser" title="Eraser Tool">
                    <span class="material-symbols-outlined">cleaning_services</span>
                    <span>Eraser</span>
                </button>
                <button class="tool-btn-large" data-tool="select" title="Selection Tool">
                    <span class="material-symbols-outlined">crop_free</span>
                    <span>Select</span>
                </button>
                <button class="tool-btn-large" data-tool="move" title="Move Tool">
                    <span class="material-symbols-outlined">open_with</span>
                    <span>Move</span>
                </button>
                <button class="tool-btn-large" data-tool="text" title="Text Tool">
                    <span class="material-symbols-outlined">text_fields</span>
                    <span>Text</span>
                </button>
            </div>
        `;
        
        return panel;
    }
    
    createPropertiesPanel() {
        const panel = document.createElement('div');
        panel.className = 'properties-panel';
        panel.style.cssText = `
            flex: 1;
            padding: 16px;
        `;
        
        panel.innerHTML = `
            <h3 style="margin: 0 0 16px 0; color: var(--nebula-text-primary); font-size: 14px;">Properties</h3>
            <div class="property-group">
                <label style="display: block; margin-bottom: 8px; color: var(--nebula-text-primary); font-size: 12px;">Brush Size</label>
                <input type="range" id="brush-size" min="1" max="100" value="10" style="width: 100%; margin-bottom: 16px;">
                <span id="brush-size-value" style="font-size: 12px; color: var(--nebula-text-secondary);">10px</span>
            </div>
            <div class="property-group">
                <label style="display: block; margin-bottom: 8px; color: var(--nebula-text-primary); font-size: 12px;">Opacity</label>
                <input type="range" id="brush-opacity" min="0" max="100" value="100" style="width: 100%; margin-bottom: 16px;">
                <span id="brush-opacity-value" style="font-size: 12px; color: var(--nebula-text-secondary);">100%</span>
            </div>
            <div class="property-group">
                <label style="display: block; margin-bottom: 8px; color: var(--nebula-text-primary); font-size: 12px;">Color</label>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <input type="color" id="brush-color" value="#000000" style="width: 40px; height: 40px; border: none; border-radius: 4px;">
                    <span id="brush-color-value" style="font-size: 12px; color: var(--nebula-text-secondary);">#000000</span>
                </div>
            </div>
        `;
        
        return panel;
    }
    
    createLayersPanel() {
        const panel = document.createElement('div');
        panel.className = 'layers-panel';
        panel.style.cssText = `
            flex: 1;
            padding: 16px;
            border-bottom: 1px solid var(--nebula-border);
        `;
        
        panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h3 style="margin: 0; color: var(--nebula-text-primary); font-size: 14px;">Layers</h3>
                <div style="display: flex; gap: 4px;">
                    <button class="small-btn" id="add-layer-btn" title="Add Layer">
                        <span class="material-symbols-outlined" style="font-size: 16px;">add</span>
                    </button>
                    <button class="small-btn" id="delete-layer-btn" title="Delete Layer">
                        <span class="material-symbols-outlined" style="font-size: 16px;">delete</span>
                    </button>
                </div>
            </div>
            <div id="layers-list" style="min-height: 200px; border: 1px solid var(--nebula-border); border-radius: 4px; background: var(--nebula-bg-primary);">
                <!-- Layers will be populated here -->
            </div>
        `;
        
        return panel;
    }
    
    createHistoryPanel() {
        const panel = document.createElement('div');
        panel.className = 'history-panel';
        panel.style.cssText = `
            flex: 1;
            padding: 16px;
        `;
        
        panel.innerHTML = `
            <h3 style="margin: 0 0 16px 0; color: var(--nebula-text-primary); font-size: 14px;">History</h3>
            <div id="history-list" style="min-height: 150px; border: 1px solid var(--nebula-border); border-radius: 4px; background: var(--nebula-bg-primary); padding: 8px;">
                <div class="history-item active" style="padding: 4px 8px; border-radius: 2px; background: var(--nebula-primary); color: white; font-size: 12px;">
                    New Document
                </div>
            </div>
        `;
        
        return panel;
    }
    
    createStatusBar() {
        const statusBar = document.createElement('div');
        statusBar.className = 'image-editor-status';
        statusBar.style.cssText = `
            height: 24px;
            background: var(--nebula-surface);
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
            <span class="status-left" id="status-info">Ready</span>
            <span class="status-right" id="status-details">800 x 600 px | RGB</span>
        `;
        
        return statusBar;
    }
    
    addToolbarStyles() {
        if (document.querySelector('#image-editor-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'image-editor-styles';
        style.textContent = `
            .image-editor-toolbar .toolbar-btn {
                width: 36px;
                height: 36px;
                border: 1px solid var(--nebula-border);
                background: var(--nebula-bg-secondary);
                color: var(--nebula-text-primary);
                border-radius: var(--nebula-radius-md);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: var(--nebula-transition);
            }
            
            .image-editor-toolbar .toolbar-btn:hover {
                background: var(--nebula-surface-hover);
                border-color: var(--nebula-border-hover);
            }
            
            .image-editor-toolbar .toolbar-btn:active,
            .image-editor-toolbar .toolbar-btn.active {
                background: var(--nebula-primary);
                color: white;
                border-color: var(--nebula-primary);
            }
            
            .image-editor-toolbar .toolbar-separator {
                width: 1px;
                height: 24px;
                background: var(--nebula-border);
                margin: 0 8px;
            }
            
            .tool-btn-large {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 12px 8px;
                border: 1px solid var(--nebula-border);
                background: var(--nebula-bg-secondary);
                color: var(--nebula-text-primary);
                border-radius: var(--nebula-radius-md);
                cursor: pointer;
                transition: var(--nebula-transition);
                gap: 4px;
                font-size: 11px;
            }
            
            .tool-btn-large:hover {
                background: var(--nebula-surface-hover);
                border-color: var(--nebula-border-hover);
            }
            
            .tool-btn-large.active {
                background: var(--nebula-primary);
                color: white;
                border-color: var(--nebula-primary);
            }
            
            .tool-btn-large .material-symbols-outlined {
                font-size: 20px;
            }
            
            .small-btn {
                width: 24px;
                height: 24px;
                border: 1px solid var(--nebula-border);
                background: var(--nebula-bg-secondary);
                color: var(--nebula-text-primary);
                border-radius: var(--nebula-radius-sm);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: var(--nebula-transition);
            }
            
            .small-btn:hover {
                background: var(--nebula-surface-hover);
                border-color: var(--nebula-border-hover);
            }
            
            .layer-item {
                display: flex;
                align-items: center;
                padding: 8px;
                border-bottom: 1px solid var(--nebula-border);
                cursor: pointer;
                transition: var(--nebula-transition);
            }
            
            .layer-item:hover {
                background: var(--nebula-surface-hover);
            }
            
            .layer-item.active {
                background: var(--nebula-primary);
                color: white;
            }
            
            .layer-thumbnail {
                width: 32px;
                height: 32px;
                border: 1px solid var(--nebula-border);
                border-radius: 2px;
                margin-right: 8px;
                background: white;
            }
            
            .layer-info {
                flex: 1;
            }
            
            .layer-name {
                font-size: 12px;
                font-weight: 500;
            }
            
            .layer-details {
                font-size: 10px;
                opacity: 0.7;
            }
        `;
        document.head.appendChild(style);
    }
    
    setupEventListeners() {
        // Tool selection
        document.querySelectorAll('.tool-btn, .tool-btn-large').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tool = e.currentTarget.dataset.tool;
                if (tool) {
                    this.selectTool(tool);
                }
            });
        });
        
        // File operations
        document.getElementById('new-btn')?.addEventListener('click', () => this.newDocument());
        document.getElementById('open-btn')?.addEventListener('click', () => this.openDocument());
        document.getElementById('save-btn')?.addEventListener('click', () => this.saveDocument());
        
        // Zoom controls
        document.getElementById('zoom-in-btn')?.addEventListener('click', () => this.zoomIn());
        document.getElementById('zoom-out-btn')?.addEventListener('click', () => this.zoomOut());
        
        // Layer operations
        document.getElementById('add-layer-btn')?.addEventListener('click', () => this.addLayer());
        document.getElementById('delete-layer-btn')?.addEventListener('click', () => this.deleteLayer());
        
        // Property controls
        const brushSize = document.getElementById('brush-size');
        const brushOpacity = document.getElementById('brush-opacity');
        const brushColor = document.getElementById('brush-color');
        
        if (brushSize) {
            brushSize.addEventListener('input', (e) => {
                document.getElementById('brush-size-value').textContent = e.target.value + 'px';
                this.toolManager.setProperty('size', parseInt(e.target.value));
            });
        }
        
        if (brushOpacity) {
            brushOpacity.addEventListener('input', (e) => {
                document.getElementById('brush-opacity-value').textContent = e.target.value + '%';
                this.toolManager.setProperty('opacity', parseInt(e.target.value) / 100);
            });
        }
        
        if (brushColor) {
            brushColor.addEventListener('input', (e) => {
                document.getElementById('brush-color-value').textContent = e.target.value;
                this.toolManager.setProperty('color', e.target.value);
            });
        }
        
        // Canvas events
        if (this.canvas) {
            this.canvas.addEventListener('mousedown', (e) => this.handleCanvasMouseDown(e));
            this.canvas.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));
            this.canvas.addEventListener('mouseup', (e) => this.handleCanvasMouseUp(e));
            this.canvas.addEventListener('wheel', (e) => this.handleCanvasWheel(e));
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            const windowElement = document.getElementById(this.windowId);
            if (!windowElement || !windowElement.contains(document.activeElement)) {
                return;
            }
            
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveDocument();
            } else if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                this.newDocument();
            } else if (e.ctrlKey && e.key === 'z') {
                e.preventDefault();
                this.undo();
            } else if (e.ctrlKey && e.key === 'y') {
                e.preventDefault();
                this.redo();
            }
        });
    }
    
    initializeCanvas() {
        if (!this.context) return;
        
        // Clear canvas with white background
        this.context.fillStyle = 'white';
        this.context.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // Initialize layer manager with canvas
        this.layerManager.setCanvas(this.canvas);
    }
    
    createNewDocument() {
        this.currentDocument = new Document(this.canvasWidth, this.canvasHeight);
        this.layerManager.setDocument(this.currentDocument);
        
        // Add initial layer
        const initialLayer = new Layer({ name: 'Background' });
        this.layerManager.addLayer(initialLayer);
        
        this.updateLayersPanel();
        this.updateStatus('New document created');
    }
    
    selectTool(toolName) {
        // Remove active class from all tool buttons
        document.querySelectorAll('.tool-btn, .tool-btn-large').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Add active class to selected tool
        document.querySelectorAll(`[data-tool="${toolName}"]`).forEach(btn => {
            btn.classList.add('active');
        });
        
        this.toolManager.setActiveTool(toolName);
        this.updateStatus(`${toolName.charAt(0).toUpperCase() + toolName.slice(1)} tool selected`);
    }
    
    addLayer() {
        if (!this.currentDocument) return;
        
        const newLayer = new Layer({ name: `Layer ${this.layerManager.layers.length + 1}` });
        this.layerManager.addLayer(newLayer);
        this.updateLayersPanel();
        this.updateStatus('Layer added');
    }
    
    deleteLayer() {
        if (!this.currentDocument || this.layerManager.layers.length <= 1) return;
        
        const activeLayer = this.layerManager.getActiveLayer();
        if (activeLayer) {
            this.layerManager.removeLayer(activeLayer.id);
            this.updateLayersPanel();
            this.updateStatus('Layer deleted');
        }
    }
    
    updateLayersPanel() {
        const layersList = document.getElementById('layers-list');
        if (!layersList || !this.layerManager) return;
        
        layersList.innerHTML = '';
        
        // Render layers in reverse order (top to bottom)
        const layers = [...this.layerManager.layers].reverse();
        layers.forEach(layer => {
            const layerItem = document.createElement('div');
            layerItem.className = 'layer-item';
            if (layer.id === this.layerManager.activeLayerId) {
                layerItem.classList.add('active');
            }
            
            layerItem.innerHTML = `
                <div class="layer-thumbnail"></div>
                <div class="layer-info">
                    <div class="layer-name">${layer.name}</div>
                    <div class="layer-details">Opacity: ${Math.round(layer.opacity * 100)}%</div>
                </div>
                <div class="layer-controls">
                    <span class="material-symbols-outlined" style="font-size: 16px; opacity: ${layer.visible ? 1 : 0.3};">
                        ${layer.visible ? 'visibility' : 'visibility_off'}
                    </span>
                </div>
            `;
            
            layerItem.addEventListener('click', () => {
                this.layerManager.setActiveLayer(layer.id);
                this.updateLayersPanel();
            });
            
            layersList.appendChild(layerItem);
        });
    }
    
    handleCanvasMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.toolManager.handleMouseDown({ x, y, event: e });
    }
    
    handleCanvasMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.toolManager.handleMouseMove({ x, y, event: e });
    }
    
    handleCanvasMouseUp(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.toolManager.handleMouseUp({ x, y, event: e });
    }
    
    handleCanvasWheel(e) {
        e.preventDefault();
        
        if (e.deltaY < 0) {
            this.zoomIn();
        } else {
            this.zoomOut();
        }
    }
    
    zoomIn() {
        this.zoom = Math.min(this.zoom * 1.2, 5.0);
        this.updateZoom();
    }
    
    zoomOut() {
        this.zoom = Math.max(this.zoom / 1.2, 0.1);
        this.updateZoom();
    }
    
    updateZoom() {
        const zoomLevel = document.getElementById('zoom-level');
        if (zoomLevel) {
            zoomLevel.textContent = Math.round(this.zoom * 100) + '%';
        }
        
        // Apply zoom to canvas container
        const container = document.querySelector('.canvas-container');
        if (container) {
            container.style.transform = `scale(${this.zoom})`;
        }
    }
    
    newDocument() {
        // TODO: Show new document dialog
        this.createNewDocument();
    }
    
    openDocument() {
        // TODO: Implement file opening
        this.updateStatus('Open document - not implemented yet');
    }
    
    saveDocument() {
        // TODO: Implement file saving
        this.updateStatus('Save document - not implemented yet');
    }
    
    undo() {
        // TODO: Implement undo
        this.updateStatus('Undo - not implemented yet');
    }
    
    redo() {
        // TODO: Implement redo
        this.updateStatus('Redo - not implemented yet');
    }
    
    updateStatus(message, details = null) {
        const statusInfo = document.getElementById('status-info');
        const statusDetails = document.getElementById('status-details');
        
        if (statusInfo) statusInfo.textContent = message;
        if (details && statusDetails) statusDetails.textContent = details;
    }
    
    getTitle() {
        return 'OLLIE';
    }
    
    getIcon() {
        return '🎨';
    }
    
    cleanup() {
        // Clean up event listeners and resources
        if (this.eventManager) {
            this.eventManager.cleanup();
        }
        console.log('NebulaImageEditor cleanup completed');
    }
}

// Core classes for the image editor

class EventManager {
    constructor() {
        this.listeners = new Map();
    }
    
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }
    
    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }
    
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Error in event callback:', error);
                }
            });
        }
    }
    
    cleanup() {
        this.listeners.clear();
    }
}

class Layer {
    constructor(options = {}) {
        this.id = this.generateId();
        this.name = options.name || `Layer ${this.id}`;
        this.type = options.type || 'raster';
        this.visible = options.visible !== false;
        this.opacity = options.opacity || 1.0;
        this.blendMode = options.blendMode || 'normal';
        this.locked = options.locked || false;
        
        // Create layer canvas
        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d');
        
        // Transform properties
        this.transform = {
            x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0
        };
        
        this.mask = null;
        this.effects = [];
    }
    
    generateId() {
        return 'layer_' + Math.random().toString(36).substr(2, 9);
    }
    
    setSize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
    }
    
    clear() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    getImageData() {
        return this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }
    
    putImageData(imageData, x = 0, y = 0) {
        this.context.putImageData(imageData, x, y);
    }
}

class LayerManager {
    constructor(eventManager) {
        this.layers = [];
        this.activeLayerId = null;
        this.selectedLayerIds = [];
        this.eventManager = eventManager;
        this.canvas = null;
        this.context = null;
        this.document = null;
    }
    
    setCanvas(canvas) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
    }
    
    setDocument(document) {
        this.document = document;
        this.layers = [];
        this.activeLayerId = null;
    }
    
    addLayer(layer, index = -1) {
        if (this.canvas) {
            layer.setSize(this.canvas.width, this.canvas.height);
        }
        
        if (index === -1) {
            this.layers.push(layer);
        } else {
            this.layers.splice(index, 0, layer);
        }
        
        if (!this.activeLayerId) {
            this.activeLayerId = layer.id;
        }
        
        this.eventManager?.emit('layer:added', { layer, index });
        this.render();
        return layer;
    }
    
    removeLayer(layerId) {
        const index = this.layers.findIndex(l => l.id === layerId);
        if (index === -1) return false;
        
        const layer = this.layers[index];
        this.layers.splice(index, 1);
        
        if (this.activeLayerId === layerId) {
            this.activeLayerId = this.layers.length > 0 ? this.layers[Math.max(0, index - 1)].id : null;
        }
        
        this.eventManager?.emit('layer:removed', { layer, index });
        this.render();
        return true;
    }
    
    moveLayer(layerId, newIndex) {
        const currentIndex = this.layers.findIndex(l => l.id === layerId);
        if (currentIndex === -1) return false;
        
        const layer = this.layers.splice(currentIndex, 1)[0];
        this.layers.splice(newIndex, 0, layer);
        
        this.eventManager?.emit('layer:moved', { layer, oldIndex: currentIndex, newIndex });
        this.render();
        return true;
    }
    
    setActiveLayer(layerId) {
        if (this.layers.find(l => l.id === layerId)) {
            this.activeLayerId = layerId;
            this.eventManager?.emit('layer:activated', { layerId });
        }
    }
    
    getActiveLayer() {
        return this.layers.find(l => l.id === this.activeLayerId);
    }
    
    getLayer(layerId) {
        return this.layers.find(l => l.id === layerId);
    }
    
    setLayerProperty(layerId, property, value) {
        const layer = this.getLayer(layerId);
        if (!layer) return false;
        
        layer[property] = value;
        this.eventManager?.emit('layer:changed', { layer, property, value });
        this.render();
        return true;
    }
    
    render() {
        if (!this.context) return;
        
        // Clear main canvas
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Fill with white background
        this.context.fillStyle = 'white';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render layers from bottom to top
        this.layers.forEach(layer => {
            if (!layer.visible) return;
            
            this.context.save();
            
            // Apply layer opacity
            this.context.globalAlpha = layer.opacity;
            
            // Apply blend mode (simplified)
            this.context.globalCompositeOperation = this.getCompositeOperation(layer.blendMode);
            
            // Apply transforms
            const t = layer.transform;
            this.context.translate(t.x, t.y);
            this.context.scale(t.scaleX, t.scaleY);
            this.context.rotate(t.rotation);
            
            // Draw layer canvas
            this.context.drawImage(layer.canvas, 0, 0);
            
            this.context.restore();
        });
    }
    
    getCompositeOperation(blendMode) {
        const blendModes = {
            'normal': 'source-over',
            'multiply': 'multiply',
            'screen': 'screen',
            'overlay': 'overlay',
            'darken': 'darken',
            'lighten': 'lighten',
            'color-dodge': 'color-dodge',
            'color-burn': 'color-burn',
            'hard-light': 'hard-light',
            'soft-light': 'soft-light',
            'difference': 'difference',
            'exclusion': 'exclusion'
        };
        
        return blendModes[blendMode] || 'source-over';
    }
}

class ToolManager {
    constructor(eventManager) {
        this.tools = new Map();
        this.activeTool = null;
        this.eventManager = eventManager;
        this.properties = {
            size: 10,
            opacity: 1.0,
            color: '#000000'
        };
        
        this.initializeTools();
    }
    
    initializeTools() {
        this.tools.set('brush', new BrushTool(this));
        this.tools.set('pencil', new PencilTool(this));
        this.tools.set('eraser', new EraserTool(this));
        this.tools.set('select', new SelectTool(this));
        this.tools.set('move', new MoveTool(this));
        this.tools.set('text', new TextTool(this));
    }
    
    setActiveTool(toolName) {
        if (this.activeTool) {
            this.activeTool.deactivate();
        }
        
        const tool = this.tools.get(toolName);
        if (tool) {
            this.activeTool = tool;
            tool.activate();
            this.eventManager?.emit('tool:activated', { tool: toolName });
        }
    }
    
    setProperty(property, value) {
        this.properties[property] = value;
        this.eventManager?.emit('tool:property-changed', { property, value });
    }
    
    getProperty(property) {
        return this.properties[property];
    }
    
    handleMouseDown(data) {
        if (this.activeTool) {
            this.activeTool.onMouseDown(data);
        }
    }
    
    handleMouseMove(data) {
        if (this.activeTool) {
            this.activeTool.onMouseMove(data);
        }
    }
    
    handleMouseUp(data) {
        if (this.activeTool) {
            this.activeTool.onMouseUp(data);
        }
    }
}

// Base tool class
class Tool {
    constructor(toolManager) {
        this.toolManager = toolManager;
        this.active = false;
        this.drawing = false;
    }
    
    activate() {
        this.active = true;
    }
    
    deactivate() {
        this.active = false;
        this.drawing = false;
    }
    
    onMouseDown(data) {
        this.drawing = true;
    }
    
    onMouseMove(data) {
        // Override in subclasses
    }
    
    onMouseUp(data) {
        this.drawing = false;
    }
    
    getActiveLayer() {
        return window.imageEditor?.layerManager?.getActiveLayer();
    }
}

// Brush tool implementation
class BrushTool extends Tool {
    constructor(toolManager) {
        super(toolManager);
        this.lastX = 0;
        this.lastY = 0;
    }
    
    onMouseDown(data) {
        super.onMouseDown(data);
        const layer = this.getActiveLayer();
        if (!layer) return;
        
        this.lastX = data.x;
        this.lastY = data.y;
        
        this.drawDot(layer.context, data.x, data.y);
        window.imageEditor?.layerManager?.render();
    }
    
    onMouseMove(data) {
        if (!this.drawing) return;
        
        const layer = this.getActiveLayer();
        if (!layer) return;
        
        this.drawLine(layer.context, this.lastX, this.lastY, data.x, data.y);
        
        this.lastX = data.x;
        this.lastY = data.y;
        
        window.imageEditor?.layerManager?.render();
    }
    
    drawDot(context, x, y) {
        const size = this.toolManager.getProperty('size');
        const color = this.toolManager.getProperty('color');
        const opacity = this.toolManager.getProperty('opacity');
        
        context.save();
        context.globalAlpha = opacity;
        context.fillStyle = color;
        context.beginPath();
        context.arc(x, y, size / 2, 0, Math.PI * 2);
        context.fill();
        context.restore();
    }
    
    drawLine(context, x1, y1, x2, y2) {
        const size = this.toolManager.getProperty('size');
        const color = this.toolManager.getProperty('color');
        const opacity = this.toolManager.getProperty('opacity');
        
        context.save();
        context.globalAlpha = opacity;
        context.strokeStyle = color;
        context.lineWidth = size;
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.beginPath();
        context.moveTo(x1, y1);
        context.lineTo(x2, y2);
        context.stroke();
        context.restore();
    }
}

// Pencil tool (similar to brush but with hard edges)
class PencilTool extends BrushTool {
    drawLine(context, x1, y1, x2, y2) {
        const size = this.toolManager.getProperty('size');
        const color = this.toolManager.getProperty('color');
        
        context.save();
        context.globalAlpha = 1.0; // Pencil is always opaque
        context.strokeStyle = color;
        context.lineWidth = size;
        context.lineCap = 'square';
        context.lineJoin = 'miter';
        context.beginPath();
        context.moveTo(x1, y1);
        context.lineTo(x2, y2);
        context.stroke();
        context.restore();
    }
}

// Eraser tool
class EraserTool extends BrushTool {
    drawLine(context, x1, y1, x2, y2) {
        const size = this.toolManager.getProperty('size');
        
        context.save();
        context.globalCompositeOperation = 'destination-out';
        context.lineWidth = size;
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.beginPath();
        context.moveTo(x1, y1);
        context.lineTo(x2, y2);
        context.stroke();
        context.restore();
    }
    
    drawDot(context, x, y) {
        const size = this.toolManager.getProperty('size');
        
        context.save();
        context.globalCompositeOperation = 'destination-out';
        context.beginPath();
        context.arc(x, y, size / 2, 0, Math.PI * 2);
        context.fill();
        context.restore();
    }
}

// Placeholder tools
class SelectTool extends Tool {
    onMouseDown(data) {
        super.onMouseDown(data);
        console.log('Selection tool - not implemented yet');
    }
}

class MoveTool extends Tool {
    onMouseDown(data) {
        super.onMouseDown(data);
        console.log('Move tool - not implemented yet');
    }
}

class TextTool extends Tool {
    onMouseDown(data) {
        super.onMouseDown(data);
        console.log('Text tool - not implemented yet');
    }
}

class Document {
    constructor(width, height, resolution = 72) {
        this.id = this.generateId();
        this.name = 'Untitled';
        this.width = width;
        this.height = height;
        this.resolution = resolution;
        this.colorMode = 'RGB';
        this.created = new Date();
        this.modified = new Date();
    }
    
    generateId() {
        return 'doc_' + Math.random().toString(36).substr(2, 9);
    }
}

// Export for use in NebulaDesktop
window.NebulaImageEditor = NebulaImageEditor;
window.imageEditor = null;

// Register the app with WindowManager
window.imageEditor = new NebulaImageEditor();

