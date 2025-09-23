// Nebula Image Editor Pro - Complete Integration
// This is the final comprehensive image editor with all advanced features

class NebulaImageEditorPro extends NebulaApp {
    constructor() {
        super();
        this.title = 'Nebula Image Editor Pro';
        this.icon = 'brush';
        
        // Core managers
        this.eventManager = new EventManager();
        this.layerManager = null;
        this.toolManager = null;
        this.selectionToolManager = null;
        this.gradientManager = null;
        this.stylusTabletManager = null;
        this.threejsReference = null;
        
        // UI components
        this.panels = new Map();
        this.activePanel = 'tools';
        
        // Canvas properties
        this.canvasWidth = 800;
        this.canvasHeight = 600;
        this.zoom = 1.0;
        this.panX = 0;
        this.panY = 0;
        
        // History system
        this.history = [];
        this.historyIndex = -1;
        this.maxHistoryStates = 50;
        
        this.initializeEditor();
    }
    
    async initializeEditor() {
        // Initialize core systems
        this.layerManager = new LayerManager(this.eventManager);
        this.toolManager = new AdvancedToolManager(this.eventManager);
        this.selectionToolManager = new SelectionToolManager(this.eventManager);
        this.gradientManager = new GradientManager(this.eventManager);
        this.stylusTabletManager = new StylusTabletManager(this.eventManager);
        this.threejsReference = new ThreeJSReferenceButton(this.eventManager);
        
        // Setup canvas
        this.setupCanvas();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize with default layer
        this.layerManager.addLayer('Background');
        
        // Save initial state
        this.saveHistoryState('Initial state');
        
        console.log('Nebula Image Editor Pro initialized successfully');
    }
    
    setupCanvas() {
        this.layerManager.setCanvasSize(this.canvasWidth, this.canvasHeight);
        
        // Setup selection canvas
        if (this.selectionToolManager) {
            this.selectionToolManager.getSelectionManager().setCanvasSize(this.canvasWidth, this.canvasHeight);
        }
    }
    
    setupEventListeners() {
        // Tool change events
        this.eventManager.on('toolChanged', (toolName) => {
            this.updateToolUI(toolName);
        });
        
        // Layer events
        this.eventManager.on('layerAdded', (layer) => {
            this.updateLayersPanel();
            this.saveHistoryState(`Added layer: ${layer.name}`);
        });
        
        this.eventManager.on('layerDeleted', (layerName) => {
            this.updateLayersPanel();
            this.saveHistoryState(`Deleted layer: ${layerName}`);
        });
        
        // Selection events
        this.eventManager.on('selectionChanged', (selection) => {
            this.updateSelectionUI(selection);
        });
        
        // 3D reference events
        this.eventManager.on('3dReferenceLayerCreated', (data) => {
            this.updateLayersPanel();
            this.saveHistoryState('Added 3D reference layer');
        });
        
        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Prevent default for our shortcuts
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 's':
                        e.preventDefault();
                        this.saveProject();
                        break;
                    case 'z':
                        e.preventDefault();
                        if (e.shiftKey) {
                            this.redo();
                        } else {
                            this.undo();
                        }
                        break;
                    case 'y':
                        e.preventDefault();
                        this.redo();
                        break;
                    case 'n':
                        e.preventDefault();
                        this.newProject();
                        break;
                    case 'o':
                        e.preventDefault();
                        this.openProject();
                        break;
                }
            }
            
            // Tool shortcuts
            if (!e.ctrlKey && !e.metaKey && !e.altKey) {
                switch (e.key.toLowerCase()) {
                    case 'b':
                        this.toolManager.setActiveTool('advanced_brush');
                        break;
                    case 'p':
                        this.toolManager.setActiveTool('pencil');
                        break;
                    case 'e':
                        this.toolManager.setActiveTool('eraser');
                        break;
                    case 'm':
                        this.selectionToolManager.setActiveTool('rectangle_select');
                        break;
                    case 'v':
                        this.toolManager.setActiveTool('move');
                        break;
                    case 't':
                        this.toolManager.setActiveTool('text');
                        break;
                    case 'g':
                        this.toolManager.setActiveTool('gradient_fill');
                        break;
                    case 'escape':
                        this.selectionToolManager.getSelectionManager().clearSelection();
                        break;
                }
            }
        });
    }
    
    createContent() {
        return `
            <div class="image-editor-container" style="
                display: flex;
                height: 100%;
                background: var(--nebula-background);
                color: var(--nebula-text);
                font-family: var(--nebula-font);
            ">
                <!-- Toolbar -->
                <div class="main-toolbar" style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 60px;
                    background: var(--nebula-surface);
                    border-bottom: 1px solid var(--nebula-border);
                    display: flex;
                    align-items: center;
                    padding: 0 20px;
                    gap: 10px;
                    z-index: 100;
                ">
                    <div class="toolbar-group">
                        <button class="toolbar-btn" id="new-btn" title="New (Ctrl+N)">
                            <span class="material-symbols-outlined">add</span>
                            New
                        </button>
                        <button class="toolbar-btn" id="open-btn" title="Open (Ctrl+O)">
                            <span class="material-symbols-outlined">folder_open</span>
                            Open
                        </button>
                        <button class="toolbar-btn" id="save-btn" title="Save (Ctrl+S)">
                            <span class="material-symbols-outlined">save</span>
                            Save
                        </button>
                    </div>
                    
                    <div class="toolbar-separator"></div>
                    
                    <div class="toolbar-group">
                        <button class="toolbar-btn" id="undo-btn" title="Undo (Ctrl+Z)">
                            <span class="material-symbols-outlined">undo</span>
                        </button>
                        <button class="toolbar-btn" id="redo-btn" title="Redo (Ctrl+Y)">
                            <span class="material-symbols-outlined">redo</span>
                        </button>
                    </div>
                    
                    <div class="toolbar-separator"></div>
                    
                    <div class="toolbar-group" id="main-tools">
                        <button class="toolbar-btn active" data-tool="advanced_brush" title="Brush (B)">
                            <span class="material-symbols-outlined">brush</span>
                        </button>
                        <button class="toolbar-btn" data-tool="pencil" title="Pencil (P)">
                            <span class="material-symbols-outlined">edit</span>
                        </button>
                        <button class="toolbar-btn" data-tool="eraser" title="Eraser (E)">
                            <span class="material-symbols-outlined">cleaning_services</span>
                        </button>
                        <button class="toolbar-btn" data-tool="rectangle_select" title="Select (M)">
                            <span class="material-symbols-outlined">crop_free</span>
                        </button>
                        <button class="toolbar-btn" data-tool="move" title="Move (V)">
                            <span class="material-symbols-outlined">open_with</span>
                        </button>
                        <button class="toolbar-btn" data-tool="text" title="Text (T)">
                            <span class="material-symbols-outlined">text_fields</span>
                        </button>
                        <button class="toolbar-btn" data-tool="gradient_fill" title="Gradient (G)">
                            <span class="material-symbols-outlined">gradient</span>
                        </button>
                    </div>
                    
                    <div class="toolbar-separator"></div>
                    
                    <div class="toolbar-group">
                        <div id="threejs-reference-container"></div>
                    </div>
                    
                    <div class="toolbar-separator"></div>
                    
                    <div class="toolbar-group">
                        <button class="toolbar-btn" id="zoom-out-btn" title="Zoom Out">
                            <span class="material-symbols-outlined">zoom_out</span>
                        </button>
                        <span class="zoom-display" id="zoom-display">100%</span>
                        <button class="toolbar-btn" id="zoom-in-btn" title="Zoom In">
                            <span class="material-symbols-outlined">zoom_in</span>
                        </button>
                        <button class="toolbar-btn" id="fit-screen-btn" title="Fit to Screen">
                            <span class="material-symbols-outlined">fit_screen</span>
                        </button>
                    </div>
                </div>
                
                <!-- Left Panel -->
                <div class="left-panel" style="
                    width: 300px;
                    background: var(--nebula-surface);
                    border-right: 1px solid var(--nebula-border);
                    margin-top: 60px;
                    overflow-y: auto;
                    flex-shrink: 0;
                ">
                    <div class="panel-tabs" style="
                        display: flex;
                        border-bottom: 1px solid var(--nebula-border);
                    ">
                        <button class="panel-tab active" data-panel="tools">
                            <span class="material-symbols-outlined">build</span>
                            Tools
                        </button>
                        <button class="panel-tab" data-panel="adjust">
                            <span class="material-symbols-outlined">tune</span>
                            Adjust
                        </button>
                    </div>
                    
                    <div class="panel-content" id="panel-content">
                        <!-- Panel content will be dynamically loaded here -->
                    </div>
                </div>
                
                <!-- Canvas Area -->
                <div class="canvas-area" style="
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    margin-top: 60px;
                    background: var(--nebula-background);
                    position: relative;
                ">
                    <div class="canvas-container" style="
                        flex: 1;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        overflow: hidden;
                        position: relative;
                    ">
                        <div class="canvas-wrapper" id="canvas-wrapper" style="
                            position: relative;
                            background: #ffffff;
                            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                            border-radius: 4px;
                        ">
                            <canvas id="main-canvas" width="800" height="600" style="
                                display: block;
                                cursor: crosshair;
                            "></canvas>
                            <div id="selection-overlay" style="
                                position: absolute;
                                top: 0;
                                left: 0;
                                pointer-events: none;
                            "></div>
                        </div>
                    </div>
                    
                    <div class="status-bar" style="
                        height: 30px;
                        background: var(--nebula-surface);
                        border-top: 1px solid var(--nebula-border);
                        display: flex;
                        align-items: center;
                        padding: 0 20px;
                        font-size: 12px;
                        gap: 20px;
                    ">
                        <span id="status-text">Ready</span>
                        <span id="canvas-size">${this.canvasWidth} × ${this.canvasHeight} px</span>
                        <span id="cursor-position">0, 0</span>
                    </div>
                </div>
                
                <!-- Right Panel -->
                <div class="right-panel" style="
                    width: 300px;
                    background: var(--nebula-surface);
                    border-left: 1px solid var(--nebula-border);
                    margin-top: 60px;
                    overflow-y: auto;
                    flex-shrink: 0;
                ">
                    <div class="panel-tabs" style="
                        display: flex;
                        border-bottom: 1px solid var(--nebula-border);
                    ">
                        <button class="panel-tab active" data-panel="layers">
                            <span class="material-symbols-outlined">layers</span>
                            Layers
                        </button>
                        <button class="panel-tab" data-panel="history">
                            <span class="material-symbols-outlined">history</span>
                            History
                        </button>
                        <button class="panel-tab" data-panel="info">
                            <span class="material-symbols-outlined">info</span>
                            Info
                        </button>
                    </div>
                    
                    <div class="panel-content" id="right-panel-content">
                        <!-- Panel content will be dynamically loaded here -->
                    </div>
                </div>
            </div>
        `;
    }
    
    afterRender() {
        super.afterRender();
        
        // Setup main canvas
        this.setupMainCanvas();
        
        // Setup UI event listeners
        this.setupUIEventListeners();
        
        // Initialize panels
        this.initializePanels();
        
        // Add 3D reference button
        this.add3DReferenceButton();
        
        // Update initial UI state
        this.updateAllPanels();
    }
    
    setupMainCanvas() {
        const canvas = this.element.querySelector('#main-canvas');
        if (!canvas) return;
        
        // Set up layer manager with the main canvas
        this.layerManager.setMainCanvas(canvas);
        
        // Set up selection overlay
        const selectionOverlay = this.element.querySelector('#selection-overlay');
        if (selectionOverlay && this.selectionToolManager) {
            const selectionCanvas = this.selectionToolManager.getSelectionManager().selectionCanvas;
            selectionOverlay.appendChild(selectionCanvas);
        }
        
        // Canvas event listeners
        this.setupCanvasEventListeners(canvas);
    }
    
    setupCanvasEventListeners(canvas) {
        let isDrawing = false;
        let lastPoint = null;
        
        // Mouse events
        canvas.addEventListener('mousedown', (e) => {
            isDrawing = true;
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) / this.zoom - this.panX;
            const y = (e.clientY - rect.top) / this.zoom - this.panY;
            
            lastPoint = { x, y };
            
            // Process with stylus/tablet manager
            const inputData = this.stylusTabletManager.processInput(e);
            inputData.x = x;
            inputData.y = y;
            
            // Handle tool input
            this.handleToolInput('mousedown', inputData);
            
            // Update cursor position
            this.updateCursorPosition(x, y);
        });
        
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) / this.zoom - this.panX;
            const y = (e.clientY - rect.top) / this.zoom - this.panY;
            
            // Update cursor position
            this.updateCursorPosition(x, y);
            
            if (isDrawing) {
                // Process with stylus/tablet manager
                const inputData = this.stylusTabletManager.processInput(e);
                inputData.x = x;
                inputData.y = y;
                
                // Handle tool input
                this.handleToolInput('mousemove', inputData);
                
                lastPoint = { x, y };
            }
        });
        
        canvas.addEventListener('mouseup', (e) => {
            if (isDrawing) {
                const rect = canvas.getBoundingClientRect();
                const x = (e.clientX - rect.left) / this.zoom - this.panX;
                const y = (e.clientY - rect.top) / this.zoom - this.panY;
                
                // Process with stylus/tablet manager
                const inputData = this.stylusTabletManager.processInput(e);
                inputData.x = x;
                inputData.y = y;
                
                // Handle tool input
                this.handleToolInput('mouseup', inputData);
                
                // Save history state for drawing operations
                if (this.isDrawingTool()) {
                    this.saveHistoryState('Drawing operation');
                }
            }
            
            isDrawing = false;
            lastPoint = null;
        });
        
        // Touch events for mobile/tablet support
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            canvas.dispatchEvent(mouseEvent);
        });
        
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            canvas.dispatchEvent(mouseEvent);
        });
        
        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const mouseEvent = new MouseEvent('mouseup', {});
            canvas.dispatchEvent(mouseEvent);
        });
        
        // Wheel event for zooming
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            this.setZoom(this.zoom * delta);
        });
    }
    
    handleToolInput(eventType, inputData) {
        // Handle selection tools
        if (this.selectionToolManager.getActiveTool()) {
            switch (eventType) {
                case 'mousedown':
                    this.selectionToolManager.handleMouseDown(inputData);
                    break;
                case 'mousemove':
                    this.selectionToolManager.handleMouseMove(inputData);
                    break;
                case 'mouseup':
                    this.selectionToolManager.handleMouseUp(inputData);
                    break;
            }
            return;
        }
        
        // Handle drawing tools
        const activeTool = this.toolManager.getActiveTool();
        if (activeTool) {
            switch (eventType) {
                case 'mousedown':
                    activeTool.onMouseDown(inputData);
                    break;
                case 'mousemove':
                    activeTool.onMouseMove(inputData);
                    break;
                case 'mouseup':
                    activeTool.onMouseUp(inputData);
                    break;
            }
        }
    }
    
    setupUIEventListeners() {
        // Toolbar buttons
        this.element.querySelector('#new-btn')?.addEventListener('click', () => this.newProject());
        this.element.querySelector('#open-btn')?.addEventListener('click', () => this.openProject());
        this.element.querySelector('#save-btn')?.addEventListener('click', () => this.saveProject());
        this.element.querySelector('#undo-btn')?.addEventListener('click', () => this.undo());
        this.element.querySelector('#redo-btn')?.addEventListener('click', () => this.redo());
        
        // Tool buttons
        this.element.querySelectorAll('[data-tool]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const toolName = e.currentTarget.dataset.tool;
                this.setActiveTool(toolName);
            });
        });
        
        // Zoom controls
        this.element.querySelector('#zoom-out-btn')?.addEventListener('click', () => this.setZoom(this.zoom * 0.8));
        this.element.querySelector('#zoom-in-btn')?.addEventListener('click', () => this.setZoom(this.zoom * 1.25));
        this.element.querySelector('#fit-screen-btn')?.addEventListener('click', () => this.fitToScreen());
        
        // Panel tabs
        this.element.querySelectorAll('.panel-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const panelName = e.currentTarget.dataset.panel;
                this.setActivePanel(panelName);
            });
        });
    }
    
    initializePanels() {
        // Create all panels
        this.panels.set('tools', this.createToolsPanel());
        this.panels.set('adjust', this.createAdjustPanel());
        this.panels.set('layers', this.createLayersPanel());
        this.panels.set('history', this.createHistoryPanel());
        this.panels.set('info', this.createInfoPanel());
        
        // Show initial panels
        this.setActivePanel('tools');
        this.setActiveRightPanel('layers');
    }
    
    createToolsPanel() {
        const panel = document.createElement('div');
        panel.className = 'tools-panel';
        
        // Add all tool panels
        const advancedBrushPanel = new AdvancedBrushPanel(this.toolManager);
        const selectionToolsPanel = new SelectionToolsPanel(this.selectionToolManager);
        const gradientFillPanel = new GradientFillPanel(this.gradientManager);
        const stylusTabletPanel = new StylusTabletPanel(this.stylusTabletManager);
        
        panel.appendChild(advancedBrushPanel.createPanel());
        panel.appendChild(selectionToolsPanel.createPanel());
        panel.appendChild(gradientFillPanel.createPanel());
        panel.appendChild(stylusTabletPanel.createPanel());
        
        return panel;
    }
    
    createAdjustPanel() {
        const panel = document.createElement('div');
        panel.className = 'adjust-panel';
        panel.innerHTML = `
            <div class="panel-section">
                <h3 class="panel-title">Image Adjustments</h3>
                <div class="property-group">
                    <label class="property-label">Brightness</label>
                    <div class="property-control">
                        <input type="range" id="brightness-slider" min="-100" max="100" value="0" class="enhanced-slider">
                        <span id="brightness-value" class="property-value">0</span>
                    </div>
                </div>
                <div class="property-group">
                    <label class="property-label">Contrast</label>
                    <div class="property-control">
                        <input type="range" id="contrast-slider" min="-100" max="100" value="0" class="enhanced-slider">
                        <span id="contrast-value" class="property-value">0</span>
                    </div>
                </div>
                <div class="filter-buttons">
                    <button class="enhanced-btn" id="grayscale-btn">Grayscale</button>
                    <button class="enhanced-btn" id="sepia-btn">Sepia</button>
                    <button class="enhanced-btn" id="invert-btn">Invert</button>
                </div>
            </div>
        `;
        
        // Setup adjustment event listeners
        this.setupAdjustmentListeners(panel);
        
        return panel;
    }
    
    createLayersPanel() {
        const panel = document.createElement('div');
        panel.className = 'layers-panel';
        panel.innerHTML = `
            <div class="panel-header">
                <h3 class="panel-title">Layers</h3>
                <div class="layer-controls">
                    <button class="enhanced-btn" id="add-layer-btn" title="Add Layer">
                        <span class="material-symbols-outlined">add</span>
                    </button>
                    <button class="enhanced-btn" id="duplicate-layer-btn" title="Duplicate Layer">
                        <span class="material-symbols-outlined">content_copy</span>
                    </button>
                    <button class="enhanced-btn" id="delete-layer-btn" title="Delete Layer">
                        <span class="material-symbols-outlined">delete</span>
                    </button>
                </div>
            </div>
            <div class="blend-mode-section">
                <label class="property-label">Blend Mode</label>
                <select id="layer-blend-mode" class="enhanced-select">
                    <option value="normal">Normal</option>
                    <option value="multiply">Multiply</option>
                    <option value="screen">Screen</option>
                    <option value="overlay">Overlay</option>
                    <option value="darken">Darken</option>
                    <option value="lighten">Lighten</option>
                </select>
            </div>
            <div class="layer-opacity-section">
                <label class="property-label">Layer Opacity</label>
                <div class="property-control">
                    <input type="range" id="layer-opacity-slider" min="0" max="100" value="100" class="enhanced-slider">
                    <span id="layer-opacity-value" class="property-value">100%</span>
                </div>
            </div>
            <div class="layers-list" id="layers-list">
                <!-- Layers will be populated here -->
            </div>
        `;
        
        // Setup layer event listeners
        this.setupLayerListeners(panel);
        
        return panel;
    }
    
    createHistoryPanel() {
        const panel = document.createElement('div');
        panel.className = 'history-panel';
        panel.innerHTML = `
            <div class="panel-header">
                <h3 class="panel-title">History</h3>
                <button class="enhanced-btn" id="clear-history-btn">Clear</button>
            </div>
            <div class="history-list" id="history-list">
                <!-- History items will be populated here -->
            </div>
        `;
        
        return panel;
    }
    
    createInfoPanel() {
        const panel = document.createElement('div');
        panel.className = 'info-panel';
        panel.innerHTML = `
            <div class="panel-header">
                <h3 class="panel-title">Document Info</h3>
            </div>
            <div class="info-content">
                <div class="info-item">
                    <span class="info-label">Size:</span>
                    <span class="info-value">${this.canvasWidth} × ${this.canvasHeight} px</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Color Mode:</span>
                    <span class="info-value">RGB</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Layers:</span>
                    <span class="info-value" id="layer-count">1</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Memory Usage:</span>
                    <span class="info-value" id="memory-usage">~2.3 MB</span>
                </div>
            </div>
        `;
        
        return panel;
    }
    
    add3DReferenceButton() {
        const container = this.element.querySelector('#threejs-reference-container');
        if (container && this.threejsReference) {
            const button = this.threejsReference.createButton();
            container.appendChild(button);
        }
    }
    
    setupAdjustmentListeners(panel) {
        // Brightness
        const brightnessSlider = panel.querySelector('#brightness-slider');
        const brightnessValue = panel.querySelector('#brightness-value');
        
        brightnessSlider?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            brightnessValue.textContent = value;
            this.applyBrightnessContrast();
        });
        
        // Contrast
        const contrastSlider = panel.querySelector('#contrast-slider');
        const contrastValue = panel.querySelector('#contrast-value');
        
        contrastSlider?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            contrastValue.textContent = value;
            this.applyBrightnessContrast();
        });
        
        // Filter buttons
        panel.querySelector('#grayscale-btn')?.addEventListener('click', () => this.applyFilter('grayscale'));
        panel.querySelector('#sepia-btn')?.addEventListener('click', () => this.applyFilter('sepia'));
        panel.querySelector('#invert-btn')?.addEventListener('click', () => this.applyFilter('invert'));
    }
    
    setupLayerListeners(panel) {
        // Layer controls
        panel.querySelector('#add-layer-btn')?.addEventListener('click', () => {
            const layerName = `Layer ${this.layerManager.layers.length + 1}`;
            this.layerManager.addLayer(layerName);
        });
        
        panel.querySelector('#duplicate-layer-btn')?.addEventListener('click', () => {
            this.layerManager.duplicateActiveLayer();
        });
        
        panel.querySelector('#delete-layer-btn')?.addEventListener('click', () => {
            if (this.layerManager.layers.length > 1) {
                this.layerManager.deleteActiveLayer();
            }
        });
        
        // Blend mode
        const blendModeSelect = panel.querySelector('#layer-blend-mode');
        blendModeSelect?.addEventListener('change', (e) => {
            const activeLayer = this.layerManager.getActiveLayer();
            if (activeLayer) {
                activeLayer.blendMode = e.target.value;
                this.layerManager.render();
            }
        });
        
        // Layer opacity
        const opacitySlider = panel.querySelector('#layer-opacity-slider');
        const opacityValue = panel.querySelector('#layer-opacity-value');
        
        opacitySlider?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            opacityValue.textContent = value + '%';
            
            const activeLayer = this.layerManager.getActiveLayer();
            if (activeLayer) {
                activeLayer.opacity = value / 100;
                this.layerManager.render();
            }
        });
    }
    
    setActiveTool(toolName) {
        // Clear selection tool if switching to drawing tool
        if (!toolName.includes('select')) {
            this.selectionToolManager.setActiveTool(null);
        }
        
        // Set appropriate tool manager
        if (toolName.includes('select') || toolName === 'magic_wand') {
            this.selectionToolManager.setActiveTool(toolName);
            this.toolManager.setActiveTool(null);
        } else {
            this.toolManager.setActiveTool(toolName);
            this.selectionToolManager.setActiveTool(null);
        }
        
        // Update UI
        this.updateToolUI(toolName);
    }
    
    updateToolUI(toolName) {
        // Update toolbar buttons
        this.element.querySelectorAll('[data-tool]').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tool === toolName) {
                btn.classList.add('active');
            }
        });
        
        // Update cursor
        const canvas = this.element.querySelector('#main-canvas');
        if (canvas) {
            canvas.style.cursor = this.getToolCursor(toolName);
        }
        
        // Update status
        this.updateStatus(`Tool: ${toolName}`);
    }
    
    getToolCursor(toolName) {
        const cursors = {
            'advanced_brush': 'crosshair',
            'pencil': 'crosshair',
            'eraser': 'crosshair',
            'rectangle_select': 'crosshair',
            'lasso_select': 'crosshair',
            'magic_wand': 'crosshair',
            'move': 'move',
            'text': 'text',
            'gradient_fill': 'crosshair'
        };
        return cursors[toolName] || 'default';
    }
    
    setActivePanel(panelName) {
        this.activePanel = panelName;
        
        // Update tab states
        this.element.querySelectorAll('.left-panel .panel-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.panel === panelName) {
                tab.classList.add('active');
            }
        });
        
        // Update panel content
        const panelContent = this.element.querySelector('#panel-content');
        if (panelContent && this.panels.has(panelName)) {
            panelContent.innerHTML = '';
            panelContent.appendChild(this.panels.get(panelName));
        }
    }
    
    setActiveRightPanel(panelName) {
        // Update tab states
        this.element.querySelectorAll('.right-panel .panel-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.panel === panelName) {
                tab.classList.add('active');
            }
        });
        
        // Update panel content
        const panelContent = this.element.querySelector('#right-panel-content');
        if (panelContent && this.panels.has(panelName)) {
            panelContent.innerHTML = '';
            panelContent.appendChild(this.panels.get(panelName));
        }
    }
    
    updateAllPanels() {
        this.updateLayersPanel();
        this.updateHistoryPanel();
        this.updateInfoPanel();
    }
    
    updateLayersPanel() {
        const layersList = this.element.querySelector('#layers-list');
        if (!layersList) return;
        
        layersList.innerHTML = '';
        
        // Render layers in reverse order (top to bottom)
        const layers = [...this.layerManager.layers].reverse();
        layers.forEach((layer, index) => {
            const layerElement = this.createLayerElement(layer, layers.length - 1 - index);
            layersList.appendChild(layerElement);
        });
        
        // Update layer count
        const layerCount = this.element.querySelector('#layer-count');
        if (layerCount) {
            layerCount.textContent = this.layerManager.layers.length;
        }
    }
    
    createLayerElement(layer, index) {
        const element = document.createElement('div');
        element.className = `layer-item ${layer === this.layerManager.getActiveLayer() ? 'active' : ''}`;
        element.style.cssText = `
            padding: 10px;
            border: 1px solid var(--nebula-border);
            margin-bottom: 5px;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 10px;
        `;
        
        element.innerHTML = `
            <div class="layer-thumbnail" style="
                width: 40px;
                height: 40px;
                background: #fff;
                border: 1px solid var(--nebula-border);
                border-radius: 2px;
                background-image: url(${layer.canvas.toDataURL()});
                background-size: cover;
                background-position: center;
            "></div>
            <div class="layer-info" style="flex: 1;">
                <div class="layer-name" style="font-weight: 500;">${layer.name}</div>
                <div class="layer-details" style="font-size: 11px; opacity: 0.7;">
                    ${layer.blendMode} • ${Math.round(layer.opacity * 100)}%
                </div>
            </div>
            <div class="layer-controls">
                <button class="layer-visibility-btn" data-layer-index="${index}" title="Toggle Visibility">
                    <span class="material-symbols-outlined">${layer.visible ? 'visibility' : 'visibility_off'}</span>
                </button>
                <button class="layer-lock-btn" data-layer-index="${index}" title="Toggle Lock">
                    <span class="material-symbols-outlined">${layer.locked ? 'lock' : 'lock_open'}</span>
                </button>
            </div>
        `;
        
        // Layer selection
        element.addEventListener('click', (e) => {
            if (!e.target.closest('.layer-controls')) {
                this.layerManager.setActiveLayer(index);
                this.updateLayersPanel();
            }
        });
        
        // Visibility toggle
        element.querySelector('.layer-visibility-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            layer.visible = !layer.visible;
            this.layerManager.render();
            this.updateLayersPanel();
        });
        
        // Lock toggle
        element.querySelector('.layer-lock-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            layer.locked = !layer.locked;
            this.updateLayersPanel();
        });
        
        return element;
    }
    
    updateHistoryPanel() {
        const historyList = this.element.querySelector('#history-list');
        if (!historyList) return;
        
        historyList.innerHTML = '';
        
        this.history.forEach((state, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = `history-item ${index === this.historyIndex ? 'active' : ''}`;
            historyItem.style.cssText = `
                padding: 8px 12px;
                border-radius: 4px;
                cursor: pointer;
                margin-bottom: 2px;
                font-size: 12px;
            `;
            
            if (index === this.historyIndex) {
                historyItem.style.background = 'var(--nebula-accent)';
                historyItem.style.color = 'white';
            }
            
            historyItem.textContent = state.description;
            
            historyItem.addEventListener('click', () => {
                this.restoreHistoryState(index);
            });
            
            historyList.appendChild(historyItem);
        });
    }
    
    updateInfoPanel() {
        const memoryUsage = this.element.querySelector('#memory-usage');
        if (memoryUsage) {
            const usage = this.calculateMemoryUsage();
            memoryUsage.textContent = `~${usage} MB`;
        }
    }
    
    calculateMemoryUsage() {
        const pixelCount = this.canvasWidth * this.canvasHeight;
        const layerCount = this.layerManager.layers.length;
        const bytesPerPixel = 4; // RGBA
        const totalBytes = pixelCount * layerCount * bytesPerPixel;
        return (totalBytes / (1024 * 1024)).toFixed(1);
    }
    
    updateCursorPosition(x, y) {
        const cursorPosition = this.element.querySelector('#cursor-position');
        if (cursorPosition) {
            cursorPosition.textContent = `${Math.round(x)}, ${Math.round(y)}`;
        }
    }
    
    updateStatus(message) {
        const statusText = this.element.querySelector('#status-text');
        if (statusText) {
            statusText.textContent = message;
        }
    }
    
    setZoom(newZoom) {
        this.zoom = Math.max(0.1, Math.min(5.0, newZoom));
        
        const canvasWrapper = this.element.querySelector('#canvas-wrapper');
        if (canvasWrapper) {
            canvasWrapper.style.transform = `scale(${this.zoom}) translate(${this.panX}px, ${this.panY}px)`;
        }
        
        const zoomDisplay = this.element.querySelector('#zoom-display');
        if (zoomDisplay) {
            zoomDisplay.textContent = Math.round(this.zoom * 100) + '%';
        }
    }
    
    fitToScreen() {
        const canvasArea = this.element.querySelector('.canvas-container');
        if (!canvasArea) return;
        
        const areaRect = canvasArea.getBoundingClientRect();
        const scaleX = (areaRect.width - 40) / this.canvasWidth;
        const scaleY = (areaRect.height - 40) / this.canvasHeight;
        const scale = Math.min(scaleX, scaleY);
        
        this.setZoom(scale);
        this.panX = 0;
        this.panY = 0;
    }
    
    isDrawingTool() {
        const activeTool = this.toolManager.getActiveTool();
        return activeTool && ['advanced_brush', 'pencil', 'eraser'].includes(activeTool.name);
    }
    
    saveHistoryState(description) {
        // Remove any states after current index
        this.history = this.history.slice(0, this.historyIndex + 1);
        
        // Add new state
        const state = {
            description,
            timestamp: Date.now(),
            layerData: this.layerManager.serialize()
        };
        
        this.history.push(state);
        this.historyIndex = this.history.length - 1;
        
        // Limit history size
        if (this.history.length > this.maxHistoryStates) {
            this.history.shift();
            this.historyIndex--;
        }
        
        this.updateHistoryPanel();
    }
    
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.restoreHistoryState(this.historyIndex);
        }
    }
    
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.restoreHistoryState(this.historyIndex);
        }
    }
    
    restoreHistoryState(index) {
        if (index >= 0 && index < this.history.length) {
            const state = this.history[index];
            this.layerManager.deserialize(state.layerData);
            this.historyIndex = index;
            this.updateAllPanels();
        }
    }
    
    newProject() {
        if (confirm('Create a new project? Unsaved changes will be lost.')) {
            this.layerManager.clear();
            this.layerManager.addLayer('Background');
            this.history = [];
            this.historyIndex = -1;
            this.saveHistoryState('New project');
            this.updateAllPanels();
        }
    }
    
    openProject() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.png,.jpg,.jpeg';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.loadProjectFile(file);
            }
        };
        
        input.click();
    }
    
    async loadProjectFile(file) {
        try {
            if (file.type === 'application/json') {
                // Load project file
                const text = await file.text();
                const projectData = JSON.parse(text);
                this.layerManager.deserialize(projectData.layers);
                this.updateAllPanels();
            } else {
                // Load image file
                const img = new Image();
                img.onload = () => {
                    this.newProject();
                    const layer = this.layerManager.getActiveLayer();
                    layer.context.drawImage(img, 0, 0, this.canvasWidth, this.canvasHeight);
                    this.layerManager.render();
                    this.saveHistoryState('Opened image');
                };
                img.src = URL.createObjectURL(file);
            }
        } catch (error) {
            alert('Error loading file: ' + error.message);
        }
    }
    
    saveProject() {
        const projectData = {
            version: '1.0',
            canvasWidth: this.canvasWidth,
            canvasHeight: this.canvasHeight,
            layers: this.layerManager.serialize(),
            timestamp: Date.now()
        };
        
        const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'nebula-project.json';
        a.click();
        
        URL.revokeObjectURL(url);
    }
    
    applyBrightnessContrast() {
        const brightnessSlider = this.element.querySelector('#brightness-slider');
        const contrastSlider = this.element.querySelector('#contrast-slider');
        
        if (!brightnessSlider || !contrastSlider) return;
        
        const brightness = parseInt(brightnessSlider.value);
        const contrast = parseInt(contrastSlider.value);
        
        const activeLayer = this.layerManager.getActiveLayer();
        if (!activeLayer) return;
        
        // Apply brightness and contrast filter
        const imageData = activeLayer.context.getImageData(0, 0, this.canvasWidth, this.canvasHeight);
        const data = imageData.data;
        
        const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
        
        for (let i = 0; i < data.length; i += 4) {
            // Apply brightness
            data[i] = Math.max(0, Math.min(255, data[i] + brightness));     // Red
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + brightness)); // Green
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + brightness)); // Blue
            
            // Apply contrast
            data[i] = Math.max(0, Math.min(255, contrastFactor * (data[i] - 128) + 128));
            data[i + 1] = Math.max(0, Math.min(255, contrastFactor * (data[i + 1] - 128) + 128));
            data[i + 2] = Math.max(0, Math.min(255, contrastFactor * (data[i + 2] - 128) + 128));
        }
        
        activeLayer.context.putImageData(imageData, 0, 0);
        this.layerManager.render();
        this.saveHistoryState('Brightness/Contrast adjustment');
    }
    
    applyFilter(filterType) {
        const activeLayer = this.layerManager.getActiveLayer();
        if (!activeLayer) return;
        
        const imageData = activeLayer.context.getImageData(0, 0, this.canvasWidth, this.canvasHeight);
        const data = imageData.data;
        
        switch (filterType) {
            case 'grayscale':
                for (let i = 0; i < data.length; i += 4) {
                    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
                    data[i] = gray;     // Red
                    data[i + 1] = gray; // Green
                    data[i + 2] = gray; // Blue
                }
                break;
                
            case 'sepia':
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    
                    data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
                    data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
                    data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
                }
                break;
                
            case 'invert':
                for (let i = 0; i < data.length; i += 4) {
                    data[i] = 255 - data[i];         // Red
                    data[i + 1] = 255 - data[i + 1]; // Green
                    data[i + 2] = 255 - data[i + 2]; // Blue
                }
                break;
        }
        
        activeLayer.context.putImageData(imageData, 0, 0);
        this.layerManager.render();
        this.saveHistoryState(`Applied ${filterType} filter`);
    }
}

// Make the editor available globally
window.NebulaImageEditorPro = NebulaImageEditorPro;
window.fixedImageEditor = null;

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (typeof NebulaApp !== 'undefined') {
        window.fixedImageEditor = new NebulaImageEditorPro();
        window.fixedImageEditor.render();
    }
});

