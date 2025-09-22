// OLLIE Tabbed App - based on NebulaApp-Tabbed template
// This file scaffolds a tabbed version of OLLIE where each tab can host an image document.

// Helper classes from OLLIE.js

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
        // Will be set per tab
        return null;
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
        // Render will be called by the tab
    }
    
    onMouseMove(data) {
        if (!this.drawing) return;
        
        const layer = this.getActiveLayer();
        if (!layer) return;
        
        this.drawLine(layer.context, this.lastX, this.lastY, data.x, data.y);
        
        this.lastX = data.x;
        this.lastY = data.y;
        
        // Render will be called by the tab
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

// Main tabbed OLLIE class

class OLLIETabbed {
    constructor() {
        this.windowId = null;
        this.tabs = new Map();
        this.activeTabId = null;
        this.nextTabId = 1;
        
        // Global tool manager
        this.toolManager = null;
        
        // Resize timeout for debouncing
        this.resizeTimeout = null;
        
        this.init();
    }

    async init() {
        if (!window.windowManager) {
            console.error('WindowManager not available');
            return;
        }

        this.windowId = window.windowManager.createWindow({
            title: 'OLLIE',
            width: 1500,
            height: 720,
            hasTabBar: false,
            resizable: true,
            maximizable: true,
            minimizable: true
        });

        // Initialize global tool manager
        this.toolManager = new ToolManager(null); // No global event manager for now
        
        window.windowManager.loadApp(this.windowId, this);

        // Create an initial blank document tab
        this.createTab('Untitled');
        console.log(`OLLIE Tabbed initialized with window ${this.windowId}`);
    }

    render() {
        const container = document.createElement('div');
        container.className = 'ollie-tabbed-container';
        container.style.cssText = `width:100%;height:100%;display:flex;background:var(--nebula-bg-primary);overflow:hidden;font-family:var(--nebula-font-family);`;

        container.innerHTML = `
            <div class="app-sidebar" id="appSidebar-${this.windowId}">
                <div class="tab-grid" id="tabGrid-${this.windowId}"></div>
                <div class="sidebar-controls">
                    <button class="new-tab-btn" id="newTabBtn-${this.windowId}" title="New Tab"><span class="material-symbols-outlined">add</span></button>
                </div>
            </div>
            <div class="app-main" id="appMain-${this.windowId}">
                <div class="app-toolbar" id="appToolbar-${this.windowId}">
                    <button class="nav-btn toggle-tabs-btn" id="toggleTabsBtn-${this.windowId}" title="Hide Tabs Sidebar"><span class="material-symbols-outlined">left_panel_close</span></button>
                    <div class="toolbar-separator"></div>
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
                    <button class="toolbar-btn" id="generate-btn" title="Generate Image with AI" style="margin-left:12px;">
                        <span class="material-symbols-outlined">auto_awesome</span>
                    </button>
                </div>
                <div class="tab-content-area" id="tabContentArea-${this.windowId}"></div>
                <div class="app-status-bar" id="statusBar-${this.windowId}"><span class="status-left" id="statusInfo-${this.windowId}">Ready</span><span class="status-right" id="statusDetails-${this.windowId}">0 tabs</span></div>
            </div>
        `;

        setTimeout(() => {
            this.addTabbedAppStyles();
            this.setupEventListeners();
            this.updateTabCount();
        }, 0);

        return container;
    }

    createTab(title = 'New Document', data = null) {
        const tabId = `tab-${this.nextTabId++}`;
        const tabData = { 
            id: tabId, 
            title, 
            icon: '🖼️', 
            data, 
            content: null, 
            element: null, 
            isModified: false,
            // Per-tab data
            canvas: null,
            context: null,
            layerManager: null,
            eventManager: new EventManager(),
            document: new Document(800, 600),
            zoom: 1.0,
            panX: 0,
            panY: 0
        };
        
        // Initialize per-tab managers
        tabData.layerManager = new LayerManager(tabData.eventManager);
        tabData.layerManager.setDocument(tabData.document);
        
        this.tabs.set(tabId, tabData);
        this.createTabElement(tabData);
        this.createTabContent(tabData);
        this.switchToTab(tabId);
        this.updateTabCount();
        return tabId;
    }

    createTabElement(tabData) {
        const tabGrid = document.getElementById(`tabGrid-${this.windowId}`);
        if (!tabGrid) return;
        const el = document.createElement('div');
        el.className = 'tab-square';
        el.dataset.tabId = tabData.id;
        el.title = tabData.title;
        el.innerHTML = `<div class="tab-icon-large">${tabData.icon}</div><button class="tab-close-btn" title="Close tab"><span class="material-symbols-outlined">close</span></button><div class="tab-modified-indicator" style="display:none"></div>`;
        tabGrid.appendChild(el);
        tabData.element = el;
        el.addEventListener('click', (e) => { if (!e.target.closest('.tab-close-btn')) this.switchToTab(tabData.id); });
        el.querySelector('.tab-close-btn').addEventListener('click', (e) => { e.stopPropagation(); this.closeTab(tabData.id); });
    }

    createTabContent(tabData) {
        const content = document.createElement('div');
        content.className = 'tab-content';
        content.dataset.tabId = tabData.id;
        content.style.cssText = 'width:100%;height:100%;padding:0;overflow:hidden;display:none;position:relative;';

        // Create main area like original OLLIE
        const mainArea = document.createElement('div');
        mainArea.className = 'main-area';
        mainArea.style.cssText = 'flex:1;display:flex;overflow:hidden;';

        // Left panel (tools and properties)
        const leftPanel = document.createElement('div');
        leftPanel.className = 'left-panel';
        leftPanel.style.cssText = 'width:250px;background:var(--nebula-surface);border-right:1px solid var(--nebula-border);display:flex;flex-direction:column;flex-shrink:0;';

        // Canvas area
        const canvasArea = document.createElement('div');
        canvasArea.className = 'canvas-area';
        canvasArea.style.cssText = 'flex:1;background:#2a2a2a;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;';

        // Right panel (layers)
        const rightPanel = document.createElement('div');
        rightPanel.className = 'right-panel';
        rightPanel.style.cssText = 'width:300px;background:var(--nebula-surface);border-left:1px solid var(--nebula-border);display:flex;flex-direction:column;flex-shrink:0;';

        // Create panels content
        leftPanel.appendChild(this.createToolsPanel(tabData));
        leftPanel.appendChild(this.createPropertiesPanel(tabData));
        canvasArea.appendChild(this.createCanvasContainer(tabData));
        rightPanel.appendChild(this.createLayersPanel(tabData));
        rightPanel.appendChild(this.createHistoryPanel(tabData));

        mainArea.appendChild(leftPanel);
        mainArea.appendChild(canvasArea);
        mainArea.appendChild(rightPanel);

        content.appendChild(mainArea);
        tabData.content = content;
        const area = document.getElementById(`tabContentArea-${this.windowId}`);
        if (area) area.appendChild(content);

        // Initialize canvas and layers
        this.initializeTabCanvas(tabData);
    }

    createCanvasContainer(tabData) {
        const container = document.createElement('div');
        container.className = 'canvas-container';
        container.style.cssText = 'position:relative;background:white;box-shadow:0 0 20px rgba(0,0,0,0.3);border:1px solid #ccc;';

        // Main canvas
        const canvas = document.createElement('canvas');
        canvas.id = `main-canvas-${tabData.id}`;
        canvas.width = tabData.document.width;
        canvas.height = tabData.document.height;
        canvas.style.cssText = 'display:block;cursor:crosshair;';

        container.appendChild(canvas);
        tabData.canvas = canvas;
        tabData.context = canvas.getContext('2d');

        // Set up layer manager
        tabData.layerManager.setCanvas(canvas);

        // Add event listeners for drawing
        canvas.addEventListener('mousedown', (e) => this.handleMouseDown(tabData, e));
        canvas.addEventListener('mousemove', (e) => this.handleMouseMove(tabData, e));
        canvas.addEventListener('mouseup', (e) => this.handleMouseUp(tabData, e));

        return container;
    }

    createToolsPanel(tabData) {
        const panel = document.createElement('div');
        panel.className = 'tools-panel';
        panel.style.cssText = 'flex:1;padding:16px;border-bottom:1px solid var(--nebula-border);';

        panel.innerHTML = `
            <h3 style="margin:0 0 16px 0;color:var(--nebula-text-primary);font-size:14px;">Tools</h3>
            <div class="tool-grid" style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;">
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

    createPropertiesPanel(tabData) {
        const panel = document.createElement('div');
        panel.className = 'properties-panel';
        panel.style.cssText = 'flex:1;padding:16px;';

        panel.innerHTML = `
            <h3 style="margin:0 0 16px 0;color:var(--nebula-text-primary);font-size:14px;">Properties</h3>
            <div style="display:flex;flex-direction:column;gap:12px;">
                <div>
                    <label style="display:block;margin-bottom:4px;color:var(--nebula-text-secondary);font-size:12px;">Size</label>
                    <input type="range" id="size-slider-${tabData.id}" min="1" max="100" value="10" style="width:100%;">
                    <span id="size-value-${tabData.id}" style="color:var(--nebula-text-primary);font-size:12px;">10</span>
                </div>
                <div>
                    <label style="display:block;margin-bottom:4px;color:var(--nebula-text-secondary);font-size:12px;">Opacity</label>
                    <input type="range" id="opacity-slider-${tabData.id}" min="0" max="1" step="0.01" value="1" style="width:100%;">
                    <span id="opacity-value-${tabData.id}" style="color:var(--nebula-text-primary);font-size:12px;">1.0</span>
                </div>
                <div>
                    <label style="display:block;margin-bottom:4px;color:var(--nebula-text-secondary);font-size:12px;">Color</label>
                    <input type="color" id="color-picker-${tabData.id}" value="#000000" style="width:100%;height:32px;border:1px solid var(--nebula-border);border-radius:var(--nebula-radius-sm);">
                </div>
            </div>
        `;

        // Set up property listeners
        setTimeout(() => {
            const sizeSlider = document.getElementById(`size-slider-${tabData.id}`);
            const sizeValue = document.getElementById(`size-value-${tabData.id}`);
            const opacitySlider = document.getElementById(`opacity-slider-${tabData.id}`);
            const opacityValue = document.getElementById(`opacity-value-${tabData.id}`);
            const colorPicker = document.getElementById(`color-picker-${tabData.id}`);

            sizeSlider?.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                sizeValue.textContent = value;
                this.toolManager.setProperty('size', value);
            });

            opacitySlider?.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                opacityValue.textContent = value.toFixed(2);
                this.toolManager.setProperty('opacity', value);
            });

            colorPicker?.addEventListener('input', (e) => {
                this.toolManager.setProperty('color', e.target.value);
            });
        }, 0);

        return panel;
    }

    createLayersPanel(tabData) {
        const panel = document.createElement('div');
        panel.className = 'layers-panel';
        panel.style.cssText = 'flex:1;padding:16px;border-bottom:1px solid var(--nebula-border);';

        panel.innerHTML = `
            <h3 style="margin:0 0 16px 0;color:var(--nebula-text-primary);font-size:14px;">Layers</h3>
            <div class="layers-list" id="layers-list-${tabData.id}" style="flex:1;overflow-y:auto;">
                <!-- Layers will be added here -->
            </div>
            <div style="display:flex;gap:4px;margin-top:8px;">
                <button class="layer-btn" id="add-layer-btn-${tabData.id}" title="Add Layer">
                    <span class="material-symbols-outlined">add</span>
                </button>
                <button class="layer-btn" id="delete-layer-btn-${tabData.id}" title="Delete Layer">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            </div>
        `;

        // Set up layer listeners
        setTimeout(() => {
            document.getElementById(`add-layer-btn-${tabData.id}`)?.addEventListener('click', () => {
                tabData.layerManager.addLayer(new Layer({ name: `Layer ${tabData.layerManager.layers.length + 1}` }));
                this.updateLayersList(tabData);
            });

            document.getElementById(`delete-layer-btn-${tabData.id}`)?.addEventListener('click', () => {
                const activeLayer = tabData.layerManager.getActiveLayer();
                if (activeLayer) {
                    tabData.layerManager.removeLayer(activeLayer.id);
                    this.updateLayersList(tabData);
                }
            });
        }, 0);

        return panel;
    }

    createHistoryPanel(tabData) {
        const panel = document.createElement('div');
        panel.className = 'history-panel';
        panel.style.cssText = 'flex:1;padding:16px;';

        panel.innerHTML = `
            <h3 style="margin:0 0 16px 0;color:var(--nebula-text-primary);font-size:14px;">History</h3>
            <div class="history-list" id="history-list-${tabData.id}" style="flex:1;overflow-y:auto;">
                <!-- History will be added here -->
            </div>
        `;

        return panel;
    }

    initializeTabCanvas(tabData) {
        // Create initial layer
        const initialLayer = new Layer({ name: 'Background' });
        tabData.layerManager.addLayer(initialLayer);
        this.updateLayersList(tabData);
    }

    updateLayersList(tabData) {
        const layersList = document.getElementById(`layers-list-${tabData.id}`);
        if (!layersList) return;

        layersList.innerHTML = '';

        // Add layers in reverse order (top to bottom)
        [...tabData.layerManager.layers].reverse().forEach(layer => {
            const layerItem = document.createElement('div');
            layerItem.className = `layer-item ${layer.id === tabData.layerManager.activeLayerId ? 'active' : ''}`;
            layerItem.dataset.layerId = layer.id;
            layerItem.style.cssText = `
                display:flex;align-items:center;padding:8px;border:1px solid var(--nebula-border);border-radius:var(--nebula-radius-sm);margin-bottom:4px;cursor:pointer;background:var(--nebula-bg-secondary);
            `;

            layerItem.innerHTML = `
                <div class="layer-thumb" style="width:32px;height:32px;background:white;border:1px solid #ccc;margin-right:8px;flex-shrink:0;"></div>
                <div class="layer-info" style="flex:1;">
                    <div class="layer-name" style="color:var(--nebula-text-primary);font-size:12px;">${layer.name}</div>
                    <div class="layer-opacity" style="color:var(--nebula-text-secondary);font-size:10px;">${Math.round(layer.opacity * 100)}%</div>
                </div>
                <button class="layer-visibility" style="background:none;border:none;color:${layer.visible ? 'var(--nebula-text-primary)' : 'var(--nebula-text-secondary)'};cursor:pointer;">
                    <span class="material-symbols-outlined">${layer.visible ? 'visibility' : 'visibility_off'}</span>
                </button>
            `;

            layerItem.addEventListener('click', () => {
                tabData.layerManager.setActiveLayer(layer.id);
                this.updateLayersList(tabData);
            });

            layerItem.querySelector('.layer-visibility').addEventListener('click', (e) => {
                e.stopPropagation();
                tabData.layerManager.setLayerProperty(layer.id, 'visible', !layer.visible);
                this.updateLayersList(tabData);
            });

            layersList.appendChild(layerItem);
        });
    }

    handleMouseDown(tabData, e) {
        const rect = tabData.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / tabData.zoom - tabData.panX;
        const y = (e.clientY - rect.top) / tabData.zoom - tabData.panY;

        // Set getActiveLayer for tools
        this.toolManager.tools.forEach(tool => {
            tool.getActiveLayer = () => tabData.layerManager.getActiveLayer();
        });

        this.toolManager.handleMouseDown({ x, y });
        tabData.layerManager.render();
    }

    handleMouseMove(tabData, e) {
        const rect = tabData.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / tabData.zoom - tabData.panX;
        const y = (e.clientY - rect.top) / tabData.zoom - tabData.panY;

        this.toolManager.handleMouseMove({ x, y });
        tabData.layerManager.render();
    }

    handleMouseUp(tabData, e) {
        this.toolManager.handleMouseUp({});
        tabData.layerManager.render();
    }

    switchToTab(tabId) {
        const tabData = this.tabs.get(tabId);
        if (!tabData) return;
        document.querySelectorAll(`#tabContentArea-${this.windowId} .tab-content`).forEach(c => c.style.display = 'none');
        document.querySelectorAll(`#tabGrid-${this.windowId} .tab-square`).forEach(t => t.classList.remove('active'));
        if (tabData.content) tabData.content.style.display = 'block';
        if (tabData.element) tabData.element.classList.add('active');
        this.activeTabId = tabId;
        const title = document.getElementById(`tabTitle-${this.windowId}`);
        if (title) title.textContent = tabData.title;
        if (window.windowManager) window.windowManager.setWindowTitle(this.windowId, `OLLIE - ${tabData.title}`);
        
        // Apply current window scaling to the newly active tab
        this.resize();
    }

    closeTab(tabId) {
        const tabData = this.tabs.get(tabId);
        if (!tabData) return;
        if (tabData.isModified) { if (!confirm(`"${tabData.title}" has unsaved changes. Close anyway?`)) return; }
        tabData.element?.remove(); tabData.content?.remove(); this.tabs.delete(tabId);
        if (this.activeTabId === tabId) {
            const remaining = Array.from(this.tabs.keys());
            if (remaining.length) this.switchToTab(remaining[0]); else this.createTab('Untitled');
        }
        this.updateTabCount();
    }

    markTabModified(tabId, isModified) {
        const tabData = this.tabs.get(tabId); if (!tabData) return; tabData.isModified = isModified;
        const ind = tabData.element?.querySelector('.tab-modified-indicator'); if (ind) ind.style.display = isModified ? 'block' : 'none';
        const title = document.getElementById(`tabTitle-${this.windowId}`); if (title && tabId === this.activeTabId) title.textContent = tabData.title + (isModified ? ' *' : '');
    }

    toggleSidebar() {
        const sidebar = document.getElementById(`appSidebar-${this.windowId}`);
        const toggleBtn = document.getElementById(`toggleTabsBtn-${this.windowId}`);
        const icon = toggleBtn?.querySelector('.material-symbols-outlined');
        if (sidebar && icon) {
            if (!sidebar.classList.contains('collapsed')) { sidebar.classList.add('collapsed'); icon.textContent = 'left_panel_open'; toggleBtn.title = 'Show Tabs Sidebar'; }
            else { sidebar.classList.remove('collapsed'); icon.textContent = 'left_panel_close'; toggleBtn.title = 'Hide Tabs Sidebar'; }
        }
    }

    updateTabCount() { const sd = document.getElementById(`statusDetails-${this.windowId}`); if (sd) sd.textContent = `${this.tabs.size} tab${this.tabs.size !== 1 ? 's' : ''}`; }

    updateStatus(msg) { const si = document.getElementById(`statusInfo-${this.windowId}`); if (si) si.textContent = msg; }

    setupEventListeners() {
        document.getElementById(`newTabBtn-${this.windowId}`)?.addEventListener('click', () => this.createTab(`Doc ${this.nextTabId}`));
        document.getElementById(`toggleTabsBtn-${this.windowId}`)?.addEventListener('click', () => this.toggleSidebar());
        
        // Toolbar buttons
        document.getElementById('new-btn')?.addEventListener('click', () => this.createTab('Untitled'));
        document.getElementById('open-btn')?.addEventListener('click', () => console.log('Open not implemented'));
        document.getElementById('save-btn')?.addEventListener('click', () => console.log('Save not implemented'));
        document.getElementById('undo-btn')?.addEventListener('click', () => console.log('Undo not implemented'));
        document.getElementById('redo-btn')?.addEventListener('click', () => console.log('Redo not implemented'));
        document.getElementById('zoom-out-btn')?.addEventListener('click', () => this.zoomOut());
        document.getElementById('zoom-in-btn')?.addEventListener('click', () => this.zoomIn());
        document.getElementById('generate-btn')?.addEventListener('click', () => console.log('Generate not implemented'));
        
        // Tool buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tool = btn.dataset.tool;
                this.toolManager.setActiveTool(tool);
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
        
        document.addEventListener('keydown', (e) => {
            const windowElement = document.getElementById(this.windowId);
            if (!windowElement || !windowElement.contains(document.activeElement)) return;
            if (e.ctrlKey && e.key === 't') { e.preventDefault(); this.createTab(`Doc ${this.nextTabId}`); }
            if (e.ctrlKey && e.key === 'w') { e.preventDefault(); if (this.activeTabId) this.closeTab(this.activeTabId); }
        });
        
        // Window resize listener
        window.addEventListener('resize', () => {
            // Debounce resize events
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.resize();
            }, 100);
        });
        
        // Initial resize call
        setTimeout(() => this.resize(), 100);
    }

    zoomIn() {
        const tabData = this.tabs.get(this.activeTabId);
        if (tabData) {
            tabData.zoom *= 1.2;
            this.updateZoomDisplay();
            this.resize(); // Reapply current window scaling with new zoom
        }
    }

    zoomOut() {
        const tabData = this.tabs.get(this.activeTabId);
        if (tabData) {
            tabData.zoom /= 1.2;
            this.updateZoomDisplay();
            this.resize(); // Reapply current window scaling with new zoom
        }
    }

    updateZoomDisplay() {
        const zoomLevel = document.getElementById('zoom-level');
        if (zoomLevel) {
            const tabData = this.tabs.get(this.activeTabId);
            zoomLevel.textContent = Math.round(tabData.zoom * 100) + '%';
        }
    }

    updateCanvasTransform(tabData, windowScale = 1) {
        const container = tabData.canvas.parentElement;
        if (container) {
            // Combine window scaling with tab zoom
            const totalScale = windowScale * tabData.zoom;
            container.style.transform = `scale(${totalScale}) translate(${tabData.panX}px, ${tabData.panY}px)`;
            container.style.transformOrigin = 'center';
            
            // Center the container
            container.style.position = 'absolute';
            container.style.left = '50%';
            container.style.top = '50%';
            container.style.transform += ' translate(-50%, -50%)';
        }
    }

    addTabbedAppStyles() {
        if (document.querySelector('#ollie-tabbed-styles')) return;
        const style = document.createElement('style'); style.id = 'ollie-tabbed-styles';
        style.textContent = `
            /* Tabbed layout styles */
            .app-sidebar { width:144px; background:var(--nebula-surface); border-right:1px solid var(--nebula-border); display:flex; flex-direction:column; flex-shrink:0; transition:var(--nebula-transition); }
            .app-sidebar.collapsed { width:0; border-right:none; overflow:hidden; }
            .tab-grid { flex:1; padding:8px; display:grid; grid-template-columns:repeat(2,64px); gap:8px; justify-content:center; align-content:start; overflow-y:auto; }
            .tab-square { width:64px; height:64px; background:var(--nebula-bg-secondary); border:1px solid var(--nebula-border); border-radius:var(--nebula-radius-md); cursor:pointer; transition:var(--nebula-transition); position:relative; display:flex; align-items:center; justify-content:center; user-select:none; }
            .tab-square:hover { background:var(--nebula-surface-hover); border-color:var(--nebula-border-hover); transform:scale(1.05); }
            .tab-square.active { background:var(--nebula-surface-elevated); border-color:var(--nebula-primary); box-shadow:0 0 0 2px rgba(102,126,234,0.3); }
            .tab-icon-large { font-size:24px; display:flex; align-items:center; justify-content:center; }
            .tab-close-btn { position:absolute; bottom:2px; right:2px; width:20px; height:20px; border:none; background:var(--nebula-danger); color:white; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; opacity:0; transition:var(--nebula-transition); z-index:20; }
            .tab-square:hover .tab-close-btn { opacity:1; }
            .tab-modified-indicator { position:absolute; top:2px; right:2px; width:8px; height:8px; background:var(--nebula-warning); border-radius:50%; }
            .sidebar-controls { padding:8px; display:flex; flex-direction:column; gap:8px; }
            .new-tab-btn { width:64px; height:32px; background:var(--nebula-surface-hover); border:1px dashed var(--nebula-border); color:var(--nebula-primary); border-radius:var(--nebula-radius-md); cursor:pointer; display:flex; align-items:center; justify-content:center; margin:0 auto; transition:var(--nebula-transition); }
            .new-tab-btn:hover { background:var(--nebula-surface-active); border-color:var(--nebula-primary); }
            .app-main { flex:1; display:flex; flex-direction:column; background:var(--nebula-bg-primary); }
            .app-toolbar { height:48px; background:var(--nebula-surface); border-bottom:1px solid var(--nebula-border); display:flex; align-items:center; padding:0 16px; gap:8px; flex-shrink:0; }
            .nav-btn { width:40px; height:36px; border:1px solid var(--nebula-border); background:var(--nebula-bg-secondary); color:var(--nebula-text-primary); border-radius:var(--nebula-radius-md); cursor:pointer; display:flex; align-items:center; justify-content:center; transition:var(--nebula-transition); }
            .nav-btn:hover { background:var(--nebula-surface-hover); border-color:var(--nebula-border-hover); }
            .toolbar-separator { width:1px; height:24px; background:var(--nebula-border); margin:0 8px; }
            .toolbar-btn { width:36px; height:36px; border:1px solid var(--nebula-border); background:var(--nebula-bg-secondary); color:var(--nebula-text-primary); border-radius:var(--nebula-radius-md); cursor:pointer; display:flex; align-items:center; justify-content:center; transition:var(--nebula-transition); }
            .toolbar-btn:hover { background:var(--nebula-surface-hover); border-color:var(--nebula-border-hover); }
            .toolbar-btn.active { background:var(--nebula-primary); color:white; }
            .tool-btn-large { display:flex; flex-direction:column; align-items:center; gap:4px; padding:8px; border:1px solid var(--nebula-border); background:var(--nebula-bg-secondary); color:var(--nebula-text-primary); border-radius:var(--nebula-radius-md); cursor:pointer; transition:var(--nebula-transition); font-size:12px; }
            .tool-btn-large:hover { background:var(--nebula-surface-hover); border-color:var(--nebula-border-hover); }
            .tool-btn-large.active { background:var(--nebula-primary); color:white; }
            .layer-btn { width:32px; height:32px; border:1px solid var(--nebula-border); background:var(--nebula-bg-secondary); color:var(--nebula-text-primary); border-radius:var(--nebula-radius-md); cursor:pointer; display:flex; align-items:center; justify-content:center; transition:var(--nebula-transition); }
            .layer-btn:hover { background:var(--nebula-surface-hover); border-color:var(--nebula-border-hover); }
            .layer-item.active { border-color:var(--nebula-primary); background:var(--nebula-surface-elevated); }
            .tab-content-area { flex:1; overflow:hidden; position:relative; }
            .app-status-bar { height:24px; background:var(--nebula-surface); border-top:1px solid var(--nebula-border); display:flex; align-items:center; justify-content:space-between; padding:0 16px; font-size:12px; color:var(--nebula-text-secondary); }
        `;
        document.head.appendChild(style);
    }

    getTitle() { const a = this.tabs.get(this.activeTabId); return a ? `OLLIE - ${a.title}` : 'OLLIE'; }
    getIcon() { return '🖼️'; }
    
    /**
     * Handle window resize - scale content proportionally
     */
    resize() {
        if (!this.windowId) return;
        
        const windowElement = document.getElementById(this.windowId);
        if (!windowElement) return;
        
        const rect = windowElement.getBoundingClientRect();
        const newWidth = rect.width;
        const newHeight = rect.height;
        
        // Calculate scale factors based on original design (1500x720)
        const originalWidth = 1500;
        const originalHeight = 720;
        const scaleX = newWidth / originalWidth;
        const scaleY = newHeight / originalHeight;
        const windowScale = Math.min(scaleX, scaleY); // Use the smaller scale to maintain aspect ratio
        
        // Apply scaling to all canvas containers
        this.tabs.forEach(tabData => {
            if (tabData.canvas) {
                this.updateCanvasTransform(tabData, windowScale);
            }
        });
        
        // Update zoom display if active tab exists
        if (this.activeTabId) {
            this.updateZoomDisplay();
        }
        
        console.log(`OLLIE Tabbed resized to ${newWidth}x${newHeight}, window scale: ${windowScale.toFixed(2)}`);
    }
    
    cleanup() { console.log('OLLIE Tabbed cleanup completed'); }
}

// Register globally
window.OLLIETabbed = OLLIETabbed;

// Register with launcher if available
if (window.registerNebulaApp) {
    window.registerNebulaApp({
        id: 'ollie-tabbed',
        name: 'OLLIE Tabbed',
        icon: '🖼️',
        className: 'OLLIETabbed',
        description: 'Tabbed image editor with multiple documents',
        category: 'graphics'
    });
}

// Instantiate the app
window.ollieTabbed = new OLLIETabbed();
