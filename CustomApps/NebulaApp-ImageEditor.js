// NebulaApp Single Window Template - Image Editor Version
// This file contains the full-featured image editor, adapted to the NebulaApp-Single.js format.

class NebulaApp {
    constructor() {
        this.windowId = null;
        this.title = 'Nebula Image Editor Pro';
        this.icon = 'brush';

        // Core managers
        this.eventManager = null;
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

        this.init();
    }

    async init() {
        if (!window.windowManager) {
            console.error('WindowManager not available');
            // Fallback for standalone testing if windowManager is not present
            document.addEventListener('DOMContentLoaded', () => {
                this.render();
                this.initializeEditor();
            });
            return;
        }

        this.windowId = window.windowManager.createWindow({
            title: this.title,
            width: this.canvasWidth + 600, // Adjust width for panels
            height: this.canvasHeight + 90, // Adjust height for toolbar and status bar
            resizable: true,
            maximizable: true,
            minimizable: true
        });

        window.windowManager.loadApp(this.windowId, this);
        console.log(`Nebula Image Editor Pro initialized with window ${this.windowId}`);
        this.initializeEditor();
    }

    async initializeEditor() {
        // Initialize core systems
        // Note: EventManager, LayerManager, etc. classes would need to be defined elsewhere or in this file
        // For this example, I'm assuming they are available or will be defined.
        this.eventManager = new EventManager();
        this.layerManager = new LayerManager(this.eventManager);
        this.toolManager = new AdvancedToolManager(this.eventManager);
        this.selectionToolManager = new SelectionToolManager(this.eventManager);
        this.gradientManager = new GradientManager(this.eventManager);
        this.stylusTabletManager = new StylusTabletManager(this.eventManager);
        this.threejsReference = new ThreeJSReferenceButton(this.eventManager);

        // Setup canvas
        this.setupCanvas();

        // Initialize with default layer
        this.layerManager.addLayer('Background');

        // Save initial state
        this.saveHistoryState('Initial state');

        console.log('Nebula Image Editor Pro core systems initialized successfully');
    }

    setupCanvas() {
        this.layerManager.setCanvasSize(this.canvasWidth, this.canvasHeight);

        // Setup selection canvas
        if (this.selectionToolManager) {
            this.selectionToolManager.getSelectionManager().setCanvasSize(this.canvasWidth, this.canvasHeight);
        }
    }

    render() {
        const container = document.createElement('div');
        container.className = 'image-editor-container';
        container.style.cssText = `
            width: 100%;
            height: 100%;
            background: var(--nebula-background);
            color: var(--nebula-text);
            font-family: var(--nebula-font);
            display: flex;
            flex-direction: column;
            overflow: hidden;
        `;

        // Create main sections
        const toolbar = this.createToolbar();
        const contentArea = this.createContentArea();
        const statusBar = this.createStatusBar();

        // Assemble the UI
        container.appendChild(toolbar);
        container.appendChild(contentArea);
        container.appendChild(statusBar);

        // Set up any additional initialization after UI is created
        setTimeout(() => {
            this.setupEventListeners();
            this.loadInitialData(); // Placeholder for actual data loading
            this.setupMainCanvas();
            this.initializePanels();
            this.add3DReferenceButton();
            this.updateAllPanels();
        }, 0);

        return container; // Return the container for WindowManager
    }

    createToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'main-toolbar';
        toolbar.style.cssText = `
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
        `;

        toolbar.innerHTML = `
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
        `;
        this.addToolbarStyles(); // Add styling for toolbar buttons
        return toolbar;
    }

    createContentArea() {
        const contentArea = document.createElement('div');
        contentArea.className = 'app-content-area'; // Custom class for image editor content
        contentArea.style.cssText = `
            flex: 1;
            display: flex;
            margin-top: 60px; /* Offset for toolbar */
            overflow: hidden;
        `;

        contentArea.innerHTML = `
            <!-- Left Panel -->
            <div class="left-panel" style="
                width: 300px;
                background: var(--nebula-surface);
                border-right: 1px solid var(--nebula-border);
                overflow-y: auto;
                flex-shrink: 0;
                padding: 20px;
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
                        <canvas id="main-canvas" width="${this.canvasWidth}" height="${this.canvasHeight}" style="
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
            </div>

            <!-- Right Panel -->
            <div class="right-panel" style="
                width: 300px;
                background: var(--nebula-surface);
                border-left: 1px solid var(--nebula-border);
                overflow-y: auto;
                flex-shrink: 0;
                padding: 20px;
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
        `;
        return contentArea;
    }

    createStatusBar() {
        const statusBar = document.createElement('div');
        statusBar.className = 'myapp-status'; // Using original class name
        statusBar.style.cssText = `
            height: 30px;
            background: var(--nebula-surface);
            border-top: 1px solid var(--nebula-border);
            display: flex;
            align-items: center;
            padding: 0 20px;
            font-size: 12px;
            color: var(--nebula-text-secondary);
            flex-shrink: 0;
        `;

        statusBar.innerHTML = `
            <span id="status-text">Ready - Use B for Brush, E for Eraser, M for Select</span>
            <span id="canvas-size">${this.canvasWidth} × ${this.canvasHeight} px</span>
            <span id="cursor-position">0, 0</span>
        `;
        return statusBar;
    }

    addToolbarStyles() {
        // This method is from the original template, adapted for the image editor's styles
        if (document.querySelector('#myapp-toolbar-styles')) return;

        const style = document.createElement('style');
        style.id = 'myapp-toolbar-styles';
        style.textContent = `
            .material-symbols-outlined {
                font-variation-settings:
                'FILL' 0,
                'wght' 400,
                'GRAD' 0,
                'opsz' 24
            }
            :root {
                --nebula-background: #1a1a1a;
                --nebula-surface: #2d2d2d;
                --nebula-border: #404040;
                --nebula-text: #ffffff;
                --nebula-text-secondary: #b0b0b0;
                --nebula-accent: #4a9eff;
                --nebula-accent-hover: #3d8ce6;
                --nebula-font: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }

            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                font-family: var(--nebula-font);
                background: var(--nebula-background);
                color: var(--nebula-text);
                overflow: hidden;
            }

            .image-editor-container {
                display: flex;
                height: 100vh;
                background: var(--nebula-background);
                color: var(--nebula-text);
                font-family: var(--nebula-font);
            }

            .main-toolbar {
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
            }

            .toolbar-group {
                display: flex;
                gap: 8px;
                align-items: center;
            }

            .toolbar-btn {
                background: var(--nebula-surface);
                border: 1px solid var(--nebula-border);
                color: var(--nebula-text);
                padding: 8px 12px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 13px;
                font-family: inherit;
                transition: all 0.2s ease;
                display: inline-flex;
                align-items: center;
                gap: 6px;
                min-width: 44px;
                justify-content: center;
            }

            .toolbar-btn:hover {
                background: var(--nebula-border);
                border-color: var(--nebula-accent);
            }

            .toolbar-btn.active {
                background: var(--nebula-accent);
                border-color: var(--nebula-accent);
                color: white;
            }

            .toolbar-separator {
                width: 1px;
                height: 30px;
                background: var(--nebula-border);
                margin: 0 10px;
            }

            .left-panel {
                width: 300px;
                background: var(--nebula-surface);
                border-right: 1px solid var(--nebula-border);
                margin-top: 60px;
                overflow-y: auto;
                flex-shrink: 0;
                padding: 20px;
            }

            .canvas-area {
                flex: 1;
                display: flex;
                flex-direction: column;
                margin-top: 60px;
                background: var(--nebula-background);
                position: relative;
            }

            .canvas-container {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
                position: relative;
            }

            .canvas-wrapper {
                position: relative;
                background: #ffffff;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                border-radius: 4px;
            }

            #main-canvas {
                display: block;
                cursor: crosshair;
            }

            .right-panel {
                width: 300px;
                background: var(--nebula-surface);
                border-left: 1px solid var(--nebula-border);
                margin-top: 60px;
                overflow-y: auto;
                flex-shrink: 0;
                padding: 20px;
            }

            .status-bar {
                height: 30px;
                background: var(--nebula-surface);
                border-top: 1px solid var(--nebula-border);
                display: flex;
                align-items: center;
                padding: 0 20px;
                font-size: 12px;
                gap: 20px;
            }

            .enhanced-btn {
                background: var(--nebula-surface);
                border: 1px solid var(--nebula-border);
                color: var(--nebula-text);
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 13px;
                font-family: inherit;
                transition: all 0.2s ease;
                display: inline-flex;
                align-items: center;
                gap: 6px;
            }

            .enhanced-btn:hover {
                background: var(--nebula-border);
                border-color: var(--nebula-accent);
            }

            .enhanced-btn.primary {
                background: var(--nebula-accent);
                border-color: var(--nebula-accent);
                color: white;
            }

            .enhanced-slider {
                width: 100%;
                height: 4px;
                border-radius: 2px;
                background: var(--nebula-border);
                outline: none;
                -webkit-appearance: none;
            }

            .enhanced-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: var(--nebula-accent);
                cursor: pointer;
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }

            .property-group {
                margin-bottom: 16px;
            }

            .property-label {
                display: block;
                font-size: 12px;
                font-weight: 500;
                margin-bottom: 6px;
                color: var(--nebula-text-secondary);
            }

            .property-control {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .property-value {
                font-size: 11px;
                color: var(--nebula-text-secondary);
                min-width: 40px;
                text-align: right;
            }

            .layer-item {
                padding: 10px;
                border: 1px solid var(--nebula-border);
                margin-bottom: 5px;
                border-radius: 4px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 10px;
                transition: all 0.2s ease;
            }

            .layer-item:hover {
                background: var(--nebula-border);
            }

            .layer-item.active {
                background: var(--nebula-accent);
                color: white;
            }

            .layer-thumbnail {
                width: 40px;
                height: 40px;
                background: #fff;
                border: 1px solid var(--nebula-border);
                border-radius: 2px;
                background-size: cover;
                background-position: center;
            }

            .layer-info {
                flex: 1;
            }

            .layer-name {
                font-weight: 500;
            }

            .layer-details {
                font-size: 11px;
                opacity: 0.7;
            }

            .layer-controls {
                display: flex;
                gap: 4px;
            }

            .layer-visibility-btn,
            .layer-lock-btn {
                background: none;
                border: none;
                color: inherit;
                cursor: pointer;
                padding: 4px;
                border-radius: 2px;
                transition: all 0.2s ease;
            }

            .layer-visibility-btn:hover,
            .layer-lock-btn:hover {
                background: rgba(255, 255, 255, 0.1);
            }

            .panel-title {
                font-size: 16px;
                font-weight: 600;
                margin-bottom: 16px;
                color: var(--nebula-text);
            }

            .section-title {
                font-size: 14px;
                font-weight: 600;
                margin: 20px 0 12px 0;
                color: var(--nebula-text);
            }

            .enhanced-select {
                background: var(--nebula-surface);
                border: 1px solid var(--nebula-border);
                color: var(--nebula-text);
                padding: 6px 12px;
                border-radius: 4px;
                font-family: inherit;
                font-size: 13px;
                width: 100%;
            }

            .enhanced-color-picker {
                width: 40px;
                height: 30px;
                border: 1px solid var(--nebula-border);
                border-radius: 4px;
                background: none;
                cursor: pointer;
            }

            .zoom-display {
                font-size: 12px;
                color: var(--nebula-text-secondary);
                min-width: 50px;
                text-align: center;
            }
        `;
        document.head.appendChild(style);
    }

    setupMainCanvas() {
        const mainCanvas = document.getElementById('main-canvas');
        if (mainCanvas && this.layerManager) {
            this.layerManager.setMainCanvas(mainCanvas);
        }
    }

    setupEventListeners() {
        // Toolbar buttons
        document.getElementById('new-btn')?.addEventListener('click', () => this.newProject());
        document.getElementById('open-btn')?.addEventListener('click', () => this.openProject());
        document.getElementById('save-btn')?.addEventListener('click', () => this.saveProject());
        document.getElementById('undo-btn')?.addEventListener('click', () => this.undo());
        document.getElementById('redo-btn')?.addEventListener('click', () => this.redo());

        // Tool buttons
        document.querySelectorAll('#main-tools .toolbar-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.toolManager.setActiveTool(e.currentTarget.dataset.tool);
                document.querySelectorAll('#main-tools .toolbar-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });

        // Zoom controls
        document.getElementById('zoom-in-btn')?.addEventListener('click', () => this.zoomIn());
        document.getElementById('zoom-out-btn')?.addEventListener('click', () => this.zoomOut());
        document.getElementById('fit-screen-btn')?.addEventListener('click', () => this.fitToScreen());

        // Panel tabs
        document.querySelectorAll('.left-panel .panel-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.setActivePanel('left', e.currentTarget.dataset.panel);
            });
        });
        document.querySelectorAll('.right-panel .panel-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.setActivePanel('right', e.currentTarget.dataset.panel);
            });
        });

        // Brush controls (from advanced-drawing-tools.js)
        const brushSizeInput = document.getElementById('brush-size');
        const brushOpacityInput = document.getElementById('brush-opacity');
        const brushColorInput = document.getElementById('brush-color');

        if (brushSizeInput) brushSizeInput.addEventListener('input', (e) => {
            this.toolManager.setBrushSize(parseInt(e.target.value));
            document.getElementById('brush-size-value').textContent = e.target.value + 'px';
        });
        if (brushOpacityInput) brushOpacityInput.addEventListener('input', (e) => {
            this.toolManager.setBrushOpacity(parseInt(e.target.value) / 100);
            document.getElementById('brush-opacity-value').textContent = e.target.value + '%';
        });
        if (brushColorInput) brushColorInput.addEventListener('input', (e) => {
            this.toolManager.setBrushColor(e.target.value);
        });

        // Layer controls
        document.getElementById('add-layer-btn')?.addEventListener('click', () => {
            const layerName = `Layer ${this.layerManager.layers.length + 1}`;
            this.layerManager.addLayer(layerName);
            this.updateLayersPanel();
            this.saveHistoryState(`Added layer: ${layerName}`);
        });
        document.getElementById('delete-layer-btn')?.addEventListener('click', () => {
            this.layerManager.deleteActiveLayer();
            this.updateLayersPanel();
            this.saveHistoryState('Deleted layer');
        });
        document.getElementById('layer-opacity')?.addEventListener('input', (e) => {
            const opacity = parseInt(e.target.value) / 100;
            this.layerManager.setActiveLayerOpacity(opacity);
            document.getElementById('layer-opacity-value').textContent = e.target.value + '%';
            this.layerManager.render();
        });
        document.getElementById('layer-blend-mode')?.addEventListener('change', (e) => {
            this.layerManager.setActiveLayerBlendMode(e.target.value);
            this.layerManager.render();
        });

        // Image adjustment buttons
        document.getElementById('grayscale-btn')?.addEventListener('click', () => this.applyFilter('grayscale'));
        document.getElementById('invert-btn')?.addEventListener('click', () => this.applyFilter('invert'));

        // Canvas events
        const mainCanvas = document.getElementById('main-canvas');
        if (mainCanvas) {
            mainCanvas.addEventListener('mousedown', this.startDrawing.bind(this));
            mainCanvas.addEventListener('mousemove', this.draw.bind(this));
            mainCanvas.addEventListener('mouseup', this.stopDrawing.bind(this));
            mainCanvas.addEventListener('mouseleave', this.stopDrawing.bind(this));
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Only handle if this window is focused (simplified for standalone)
            // const windowElement = document.getElementById(this.windowId);
            // if (!windowElement || !windowElement.contains(document.activeElement)) {
            //     return;
            // }

            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 's': e.preventDefault(); this.saveProject(); break;
                    case 'z': e.preventDefault(); if (e.shiftKey) { this.redo(); } else { this.undo(); } break;
                    case 'y': e.preventDefault(); this.redo(); break;
                    case 'n': e.preventDefault(); this.newProject(); break;
                    case 'o': e.preventDefault(); this.openProject(); break;
                }
            }

            if (!e.ctrlKey && !e.metaKey && !e.altKey) {
                switch (e.key.toLowerCase()) {
                    case 'b': this.toolManager.setActiveTool('advanced_brush'); break;
                    case 'p': this.toolManager.setActiveTool('pencil'); break;
                    case 'e': this.toolManager.setActiveTool('eraser'); break;
                    case 'm': this.selectionToolManager.setActiveTool('rectangle_select'); break;
                    case 'v': this.toolManager.setActiveTool('move'); break;
                    case 't': this.toolManager.setActiveTool('text'); break;
                    case 'g': this.toolManager.setActiveTool('gradient_fill'); break;
                    case 'escape': this.selectionToolManager.getSelectionManager().clearSelection(); break;
                }
            }
        });
    }

    loadInitialData() {
        // Placeholder for loading initial data
        this.updateStatus('Ready');
        console.log('Image editor initial data loaded');
    }

    // --- Image Editor Specific Methods ---

    newProject() {
        console.log('New project created');
        // Implement new project logic
    }

    openProject() {
        console.log('Open project');
        // Implement open project logic
    }

    saveProject() {
        console.log('Save project');
        // Implement save project logic
    }

    undo() {
        console.log('Undo action');
        // Implement undo logic
    }

    redo() {
        console.log('Redo action');
        // Implement redo logic
    }

    zoomIn() {
        this.zoom *= 1.1;
        this.updateZoomDisplay();
        this.layerManager.render();
    }

    zoomOut() {
        this.zoom /= 1.1;
        this.updateZoomDisplay();
        this.layerManager.render();
    }

    fitToScreen() {
        console.log('Fit to screen');
        // Implement fit to screen logic
    }

    updateZoomDisplay() {
        const zoomDisplay = document.getElementById('zoom-display');
        if (zoomDisplay) {
            zoomDisplay.textContent = `${Math.round(this.zoom * 100)}%`;
        }
    }

    setActivePanel(side, panelName) {
        // Logic to switch active panels
        console.log(`Setting ${side} panel to: ${panelName}`);
        // This would involve updating the innerHTML of #panel-content or #right-panel-content
        // with the appropriate UI for tools, adjustments, layers, history, info.
        // For brevity, actual panel content rendering is omitted here.
        if (side === 'left') {
            document.querySelectorAll('.left-panel .panel-tab').forEach(tab => {
                if (tab.dataset.panel === panelName) tab.classList.add('active');
                else tab.classList.remove('active');
            });
            this.renderLeftPanelContent(panelName);
        } else if (side === 'right') {
            document.querySelectorAll('.right-panel .panel-tab').forEach(tab => {
                if (tab.dataset.panel === panelName) tab.classList.add('active');
                else tab.classList.remove('active');
            });
            this.renderRightPanelContent(panelName);
        }
    }

    renderLeftPanelContent(panelName) {
        const panelContentDiv = document.getElementById('panel-content');
        if (!panelContentDiv) return;

        let content = '';
        if (panelName === 'tools') {
            content = `
                <h3 class="panel-title">Tools</h3>

                <div class="property-group">
                    <label class="property-label">Size</label>
                    <div class="property-control">
                        <input type="range" id="brush-size" min="1" max="100" value="10" class="enhanced-slider">
                        <span id="brush-size-value" class="property-value">10px</span>
                    </div>
                </div>

                <div class="property-group">
                    <label class="property-label">Opacity</label>
                    <div class="property-control">
                        <input type="range" id="brush-opacity" min="0" max="100" value="100" class="enhanced-slider">
                        <span id="brush-opacity-value" class="property-value">100%</span>
                    </div>
                </div>

                <div class="property-group">
                    <label class="property-label">Color</label>
                    <input type="color" id="brush-color" value="#000000" class="enhanced-color-picker">
                </div>
            `;
        } else if (panelName === 'adjust') {
            content = `
                <h3 class="panel-title">Adjustments</h3>

                <div class="property-group">
                    <label class="property-label">Brightness</label>
                    <div class="property-control">
                        <input type="range" id="brightness" min="-100" max="100" value="0" class="enhanced-slider">
                        <span id="brightness-value" class="property-value">0</span>
                    </div>
                </div>

                <div class="property-group">
                    <label class="property-label">Contrast</label>
                    <div class="property-control">
                        <input type="range" id="contrast" min="-100" max="100" value="0" class="enhanced-slider">
                        <span id="contrast-value" class="property-value">0</span>
                    </div>
                </div>

                <div style="display: flex; gap: 8px; margin-top: 12px;">
                    <button class="enhanced-btn" id="grayscale-btn">Grayscale</button>
                    <button class="enhanced-btn" id="invert-btn">Invert</button>
                </div>
            `;
        }
        panelContentDiv.innerHTML = content;
        // Re-attach event listeners for newly rendered content
        this.setupEventListeners();
    }

    renderRightPanelContent(panelName) {
        const panelContentDiv = document.getElementById('right-panel-content');
        if (!panelContentDiv) return;

        let content = '';
        if (panelName === 'layers') {
            content = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h3 class="panel-title">Layers</h3>
                    <div style="display: flex; gap: 8px;">
                        <button class="enhanced-btn" id="add-layer-btn" title="Add Layer">
                            <span class="material-symbols-outlined">add</span>
                        </button>
                        <button class="enhanced-btn" id="delete-layer-btn" title="Delete Layer">
                            <span class="material-symbols-outlined">delete</span>
                        </button>
                    </div>
                </div>

                <div class="property-group">
                    <label class="property-label">Blend Mode</label>
                    <select id="layer-blend-mode" class="enhanced-select">
                        <option value="normal">Normal</option>
                        <option value="multiply">Multiply</option>
                        <option value="screen">Screen</option>
                        <option value="overlay">Overlay</option>
                    </select>
                </div>

                <div class="property-group">
                    <label class="property-label">Layer Opacity</label>
                    <div class="property-control">
                        <input type="range" id="layer-opacity" min="0" max="100" value="100" class="enhanced-slider">
                        <span id="layer-opacity-value" class="property-value">100%</span>
                    </div>
                </div>

                <div id="layers-list">
                    <!-- Layers will be populated here -->
                </div>
            `;
        } else if (panelName === 'history') {
            content = `<h3 class="panel-title">History</h3><div id="history-list">No history yet.</div>`;
        } else if (panelName === 'info') {
            content = `<h3 class="panel-title">Info</h3><div>Canvas: ${this.canvasWidth}x${this.canvasHeight}</div>`;
        }
        panelContentDiv.innerHTML = content;
        this.updateLayersPanel(); // Ensure layers are populated if layers panel is active
        // Re-attach event listeners for newly rendered content
        this.setupEventListeners();
    }

    initializePanels() {
        this.setActivePanel('left', 'tools');
        this.setActivePanel('right', 'layers');
    }

    add3DReferenceButton() {
        const threejsContainer = document.getElementById('threejs-reference-container');
        if (threejsContainer) {
            const button = document.createElement('button');
            button.className = 'toolbar-btn';
            button.id = 'threejs-ref-btn';
            button.title = '3D Reference';
            button.innerHTML = '<span class="material-symbols-outlined">view_in_ar</span>';
            button.addEventListener('click', () => {
                // Placeholder for opening 3D modal
                alert('Opening 3D Reference Modal (Three.js integration)');
            });
            threejsContainer.appendChild(button);
        }
    }

    updateAllPanels() {
        this.updateLayersPanel();
        this.updateZoomDisplay();
        // Other panel updates
    }

    startDrawing(e) {
        this.toolManager.onMouseDown(e, this.layerManager.getActiveLayer().ctx, this.zoom);
    }

    draw(e) {
        this.toolManager.onMouseMove(e, this.layerManager.getActiveLayer().ctx, this.zoom);
        this.layerManager.render();
    }

    stopDrawing(e) {
        this.toolManager.onMouseUp(e);
        this.saveHistoryState('Drawing');
    }

    updateLayersPanel() {
        const layersList = document.getElementById('layers-list');
        if (!layersList) return; // Ensure layersList exists before trying to update

        layersList.innerHTML = '';
        this.layerManager.layers.forEach((layer, index) => {
            const layerElement = document.createElement('div');
            layerElement.className = `layer-item ${index === this.layerManager.activeLayerIndex ? 'active' : ''}`;
            layerElement.innerHTML = `
                <div class="layer-thumbnail" style="background-image: url(${layer.canvas.toDataURL()});"></div>
                <div class="layer-info">
                    <div class="layer-name">${layer.name}</div>
                    <div class="layer-details">${layer.blendMode} • ${Math.round(layer.opacity * 100)}%</div>
                </div>
                <div class="layer-controls">
                    <button class="layer-visibility-btn" title="Toggle Visibility">
                        <span class="material-symbols-outlined">${layer.visible ? 'visibility' : 'visibility_off'}</span>
                    </button>
                </div>
            `;
            layerElement.addEventListener('click', () => {
                this.layerManager.setActiveLayer(index);
                this.updateLayersPanel();
                // Update layer opacity and blend mode controls in UI
                const layerOpacityInput = document.getElementById('layer-opacity');
                const layerBlendModeSelect = document.getElementById('layer-blend-mode');
                if (layerOpacityInput) layerOpacityInput.value = Math.round(layer.opacity * 100);
                if (layerBlendModeSelect) layerBlendModeSelect.value = layer.blendMode;
                document.getElementById('layer-opacity-value').textContent = `${Math.round(layer.opacity * 100)}%`;
            });
            layerElement.querySelector('.layer-visibility-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.layerManager.toggleLayerVisibility(index);
                this.updateLayersPanel();
            });
            layersList.appendChild(layerElement);
        });
    }

    saveHistoryState(description) {
        // Simplified history for this example
        const currentState = this.layerManager.getCanvasState(); // Method to get current state of all layers
        this.history = this.history.slice(0, this.historyIndex + 1);
        this.history.push({ state: currentState, description: description });
        if (this.history.length > this.maxHistoryStates) {
            this.history.shift();
        }
        this.historyIndex = this.history.length - 1;
        // Update history panel if active
    }

    applyFilter(filterType) {
        console.log(`Applying filter: ${filterType}`);
        // This would apply the filter to the active layer
        const activeLayer = this.layerManager.getActiveLayer();
        if (activeLayer) {
            const imageData = activeLayer.ctx.getImageData(0, 0, activeLayer.canvas.width, activeLayer.canvas.height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                if (filterType === 'grayscale') {
                    const avg = (r + g + b) / 3;
                    data[i] = avg;
                    data[i + 1] = avg;
                    data[i + 2] = avg;
                } else if (filterType === 'invert') {
                    data[i] = 255 - r;
                    data[i + 1] = 255 - g;
                    data[i + 2] = 255 - b;
                }
            }
            activeLayer.ctx.putImageData(imageData, 0, 0);
            this.layerManager.render();
            this.saveHistoryState(`Applied ${filterType} filter`);
        }
    }

    updateStatus(message, details = null) {
        const statusInfo = document.getElementById('status-text');
        const statusDetails = document.getElementById('status-details'); // Assuming statusDetails exists in status bar

        if (statusInfo) statusInfo.textContent = message;
        if (details && statusDetails) statusDetails.textContent = details;
    }

    getTitle() {
        return this.title;
    }

    getIcon() {
        return this.icon;
    }

    cleanup() {
        console.log('Nebula Image Editor Pro cleanup completed');
        // Remove event listeners, clear resources
    }
}

// --- Supporting Classes (EventManager, LayerManager, AdvancedToolManager, etc.) ---
// These classes would typically be in separate files, but are included here for single-file compliance.

class EventManager {
    constructor() {
        this.events = {};
    }

    on(eventName, callback) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(callback);
    }

    emit(eventName, data) {
        if (this.events[eventName]) {
            this.events[eventName].forEach(callback => callback(data));
        }
    }
}

class LayerManager {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.layers = [];
        this.activeLayerIndex = -1;
        this.mainCanvas = null;
        this.mainCtx = null;
    }

    setMainCanvas(canvas) {
        this.mainCanvas = canvas;
        this.mainCtx = canvas.getContext('2d');
    }

    setCanvasSize(width, height) {
        if (this.mainCanvas) {
            this.mainCanvas.width = width;
            this.mainCanvas.height = height;
        }
        this.layers.forEach(layer => {
            layer.canvas.width = width;
            layer.canvas.height = height;
        });
        this.render();
    }

    addLayer(name) {
        const canvas = document.createElement('canvas');
        canvas.width = this.mainCanvas ? this.mainCanvas.width : 800;
        canvas.height = this.mainCanvas ? this.mainCanvas.height : 600;
        const ctx = canvas.getContext('2d');

        if (this.layers.length === 0) {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        const layer = {
            id: `layer-${Date.now()}`,
            name,
            canvas,
            ctx,
            visible: true,
            opacity: 1,
            blendMode: 'normal'
        };
        this.layers.push(layer);
        this.activeLayerIndex = this.layers.length - 1;
        this.render();
        this.eventManager.emit('layerAdded', layer);
    }

    deleteActiveLayer() {
        if (this.activeLayerIndex !== -1 && this.layers.length > 1) { // Don't delete the last layer
            const deletedLayerName = this.layers[this.activeLayerIndex].name;
            this.layers.splice(this.activeLayerIndex, 1);
            this.activeLayerIndex = Math.max(0, this.activeLayerIndex - 1);
            this.render();
            this.eventManager.emit('layerDeleted', deletedLayerName);
        }
    }

    setActiveLayer(index) {
        if (index >= 0 && index < this.layers.length) {
            this.activeLayerIndex = index;
            this.eventManager.emit('activeLayerChanged', this.layers[index]);
        }
    }

    getActiveLayer() {
        return this.layers[this.activeLayerIndex];
    }

    toggleLayerVisibility(index) {
        if (index >= 0 && index < this.layers.length) {
            this.layers[index].visible = !this.layers[index].visible;
            this.render();
            this.eventManager.emit('layerVisibilityChanged', this.layers[index]);
        }
    }

    setActiveLayerOpacity(opacity) {
        const activeLayer = this.getActiveLayer();
        if (activeLayer) {
            activeLayer.opacity = opacity;
            this.render();
            this.eventManager.emit('layerPropertiesChanged', activeLayer);
        }
    }

    setActiveLayerBlendMode(blendMode) {
        const activeLayer = this.getActiveLayer();
        if (activeLayer) {
            activeLayer.blendMode = blendMode;
            this.render();
            this.eventManager.emit('layerPropertiesChanged', activeLayer);
        }
    }

    render() {
        if (!this.mainCtx) return;
        this.mainCtx.clearRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);
        this.layers.forEach(layer => {
            if (layer.visible) {
                this.mainCtx.globalAlpha = layer.opacity;
                this.mainCtx.globalCompositeOperation = layer.blendMode;
                this.mainCtx.drawImage(layer.canvas, 0, 0);
            }
        });
        this.mainCtx.globalAlpha = 1;
        this.mainCtx.globalCompositeOperation = 'source-over';
    }

    getCanvasState() {
        // Returns a serializable state of all layers
        return this.layers.map(layer => ({
            id: layer.id,
            name: layer.name,
            visible: layer.visible,
            opacity: layer.opacity,
            blendMode: layer.blendMode,
            imageData: layer.canvas.toDataURL() // Store image data as base64
        }));
    }

    loadCanvasState(state) {
        this.layers = [];
        state.forEach(layerState => {
            const canvas = document.createElement('canvas');
            canvas.width = this.mainCanvas.width;
            canvas.height = this.mainCanvas.height;
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0);
                this.render();
            };
            img.src = layerState.imageData;

            this.layers.push({
                id: layerState.id,
                name: layerState.name,
                canvas,
                ctx,
                visible: layerState.visible,
                opacity: layerState.opacity,
                blendMode: layerState.blendMode
            });
        });
        this.activeLayerIndex = this.layers.length > 0 ? this.layers.length - 1 : -1;
        this.render();
        this.eventManager.emit('layersLoaded');
    }
}

class AdvancedToolManager {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.currentTool = 'advanced_brush';
        this.brushSize = 10;
        this.brushOpacity = 1;
        this.brushColor = '#000000';
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;
        // Add more brush properties here (e.g., hardness, flow, stabilization)
    }

    setActiveTool(tool) {
        this.currentTool = tool;
        this.eventManager.emit('toolChanged', tool);
    }

    setBrushSize(size) {
        this.brushSize = size;
    }

    setBrushOpacity(opacity) {
        this.brushOpacity = opacity;
    }

    setBrushColor(color) {
        this.brushColor = color;
    }

    onMouseDown(e, ctx, zoom) {
        this.isDrawing = true;
        const rect = ctx.canvas.getBoundingClientRect();
        this.lastX = (e.clientX - rect.left) / zoom;
        this.lastY = (e.clientY - rect.top) / zoom;
        ctx.beginPath();
        ctx.moveTo(this.lastX, this.lastY);
        this.setupBrush(ctx);
    }

    onMouseMove(e, ctx, zoom) {
        if (!this.isDrawing) return;
        const rect = ctx.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / zoom;
        const y = (e.clientY - rect.top) / zoom;

        // Basic drawing for now, advanced tools would have more logic
        ctx.lineTo(x, y);
        ctx.stroke();
        this.lastX = x;
        this.lastY = y;
    }

    onMouseUp(e) {
        this.isDrawing = false;
    }

    setupBrush(ctx) {
        ctx.lineWidth = this.brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = this.brushOpacity;
        if (this.currentTool === 'advanced_brush' || this.currentTool === 'pencil') {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = this.brushColor;
        } else if (this.currentTool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.strokeStyle = 'rgba(0,0,0,1)'; // Eraser effectively draws transparent
        }
        // Add logic for other tools like airbrush, calligraphy, etc.
    }
}

class SelectionToolManager {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.selectionManager = new SelectionManager(eventManager);
        this.activeTool = 'none';
    }

    setActiveTool(tool) {
        this.activeTool = tool;
        this.eventManager.emit('selectionToolChanged', tool);
    }

    getSelectionManager() {
        return this.selectionManager;
    }
    // Methods for handling different selection tools (rectangle, lasso, magic wand)
}

class SelectionManager {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.selection = null; // {x, y, width, height} for rectangle, or path for lasso
        this.canvas = null;
        this.ctx = null;
    }

    setCanvasSize(width, height) {
        // This would be for an overlay canvas for selections
    }

    clearSelection() {
        this.selection = null;
        this.eventManager.emit('selectionChanged', null);
        // Redraw selection overlay
    }
    // Methods for creating and manipulating selections
}

class GradientManager {
    constructor(eventManager) {
        this.eventManager = eventManager;
        // Methods for creating and applying gradients
    }
}

class StylusTabletManager {
    constructor(eventManager) {
        this.eventManager = eventManager;
        // Methods for handling stylus input and stabilization
    }
}

class ThreeJSReferenceButton {
    constructor(eventManager) {
        this.eventManager = eventManager;
        // Methods for managing the 3D reference modal
    }
}

// Export for use in NebulaDesktop
window.NebulaApp = NebulaApp;
// Register the app with WindowManager
new NebulaApp();


