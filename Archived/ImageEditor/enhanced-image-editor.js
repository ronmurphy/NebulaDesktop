// Enhanced NebulaImageEditor with integrated UI panels and improved interface
// This version includes the adjustment panel and enhanced styling

class EnhancedNebulaImageEditor {
    constructor() {
        this.windowId = null;
        this.canvas = null;
        this.context = null;
        this.layerManager = null;
        this.toolManager = null;
        this.eventManager = null;
        this.adjustmentPanel = null;
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
            title: 'Nebula Image Editor Pro',
            width: 1400,
            height: 900,
            resizable: true,
            maximizable: true,
            minimizable: true
        });
        
        // Initialize core systems
        this.eventManager = new EventManager();
        this.layerManager = new LayerManager(this.eventManager);
        this.toolManager = new ToolManager(this.eventManager);
        this.adjustmentPanel = new AdjustmentPanel(this);
        
        // Load this app into the window
        window.windowManager.loadApp(this.windowId, this);
        
        console.log(`Enhanced NebulaImageEditor initialized with window ${this.windowId}`);
    }
    
    render() {
        const container = document.createElement('div');
        container.className = 'enhanced-image-editor-container';
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
        const toolbar = this.createEnhancedToolbar();
        const mainArea = this.createEnhancedMainArea();
        const statusBar = this.createEnhancedStatusBar();
        
        // Assemble the UI
        container.appendChild(toolbar);
        container.appendChild(mainArea);
        container.appendChild(statusBar);
        
        // Initialize after UI is created
        setTimeout(() => {
            this.setupEventListeners();
            this.initializeCanvas();
            this.createNewDocument();
            this.addEnhancedStyles();
        }, 0);
        
        return container;
    }
    
    createEnhancedToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'enhanced-toolbar';
        toolbar.style.cssText = `
            height: 56px;
            background: linear-gradient(135deg, var(--nebula-surface) 0%, var(--nebula-bg-secondary) 100%);
            border-bottom: 1px solid var(--nebula-border);
            display: flex;
            align-items: center;
            padding: 0 20px;
            gap: 12px;
            flex-shrink: 0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        `;
        
        toolbar.innerHTML = `
            <div class="toolbar-section">
                <button class="enhanced-btn primary" id="new-btn" title="New Document">
                    <span class="material-symbols-outlined">add</span>
                    <span>New</span>
                </button>
                
                <button class="enhanced-btn" id="open-btn" title="Open Image">
                    <span class="material-symbols-outlined">folder_open</span>
                    <span>Open</span>
                </button>
                
                <button class="enhanced-btn" id="save-btn" title="Save">
                    <span class="material-symbols-outlined">save</span>
                    <span>Save</span>
                </button>
            </div>
            
            <div class="toolbar-separator"></div>
            
            <div class="toolbar-section">
                <button class="enhanced-btn" id="undo-btn" title="Undo">
                    <span class="material-symbols-outlined">undo</span>
                </button>
                
                <button class="enhanced-btn" id="redo-btn" title="Redo">
                    <span class="material-symbols-outlined">redo</span>
                </button>
            </div>
            
            <div class="toolbar-separator"></div>
            
            <div class="toolbar-section tool-section">
                <button class="enhanced-tool-btn active" id="brush-tool" title="Brush Tool" data-tool="brush">
                    <span class="material-symbols-outlined">brush</span>
                </button>
                
                <button class="enhanced-tool-btn" id="pencil-tool" title="Pencil Tool" data-tool="pencil">
                    <span class="material-symbols-outlined">edit</span>
                </button>
                
                <button class="enhanced-tool-btn" id="eraser-tool" title="Eraser Tool" data-tool="eraser">
                    <span class="material-symbols-outlined">cleaning_services</span>
                </button>
                
                <button class="enhanced-tool-btn" id="select-tool" title="Selection Tool" data-tool="select">
                    <span class="material-symbols-outlined">crop_free</span>
                </button>
                
                <button class="enhanced-tool-btn" id="move-tool" title="Move Tool" data-tool="move">
                    <span class="material-symbols-outlined">open_with</span>
                </button>
                
                <button class="enhanced-tool-btn" id="text-tool" title="Text Tool" data-tool="text">
                    <span class="material-symbols-outlined">text_fields</span>
                </button>
            </div>
            
            <div class="toolbar-separator"></div>
            
            <div class="zoom-controls">
                <button class="enhanced-btn" id="zoom-out-btn" title="Zoom Out">
                    <span class="material-symbols-outlined">zoom_out</span>
                </button>
                <div class="zoom-display">
                    <span id="zoom-level">100%</span>
                </div>
                <button class="enhanced-btn" id="zoom-in-btn" title="Zoom In">
                    <span class="material-symbols-outlined">zoom_in</span>
                </button>
                <button class="enhanced-btn" id="fit-screen-btn" title="Fit to Screen">
                    <span class="material-symbols-outlined">fit_screen</span>
                </button>
            </div>
            
            <div class="toolbar-title">
                <span class="app-title">Nebula Image Editor Pro</span>
                <span class="document-name" id="document-name">Untitled</span>
            </div>
        `;
        
        return toolbar;
    }
    
    createEnhancedMainArea() {
        const mainArea = document.createElement('div');
        mainArea.className = 'enhanced-main-area';
        mainArea.style.cssText = `
            flex: 1;
            display: flex;
            overflow: hidden;
            background: var(--nebula-bg-primary);
        `;
        
        // Left panel with tabs
        const leftPanel = this.createLeftPanel();
        
        // Canvas area with enhanced styling
        const canvasArea = this.createEnhancedCanvasArea();
        
        // Right panel with tabs
        const rightPanel = this.createRightPanel();
        
        mainArea.appendChild(leftPanel);
        mainArea.appendChild(canvasArea);
        mainArea.appendChild(rightPanel);
        
        return mainArea;
    }
    
    createLeftPanel() {
        const leftPanel = document.createElement('div');
        leftPanel.className = 'enhanced-left-panel';
        leftPanel.style.cssText = `
            width: 280px;
            background: var(--nebula-surface);
            border-right: 1px solid var(--nebula-border);
            display: flex;
            flex-direction: column;
            flex-shrink: 0;
        `;
        
        // Panel tabs
        const tabs = document.createElement('div');
        tabs.className = 'panel-tabs';
        tabs.style.cssText = `
            display: flex;
            border-bottom: 1px solid var(--nebula-border);
            background: var(--nebula-bg-secondary);
        `;
        
        tabs.innerHTML = `
            <button class="panel-tab active" data-panel="tools">
                <span class="material-symbols-outlined">build</span>
                <span>Tools</span>
            </button>
            <button class="panel-tab" data-panel="adjustments">
                <span class="material-symbols-outlined">tune</span>
                <span>Adjust</span>
            </button>
        `;
        
        // Panel content
        const panelContent = document.createElement('div');
        panelContent.className = 'panel-content';
        panelContent.style.cssText = `
            flex: 1;
            overflow-y: auto;
        `;
        
        // Tools panel
        const toolsPanel = this.createEnhancedToolsPanel();
        toolsPanel.style.display = 'block';
        
        // Adjustments panel
        const adjustmentsPanel = this.adjustmentPanel.createPanel();
        adjustmentsPanel.style.display = 'none';
        adjustmentsPanel.setAttribute('data-panel-content', 'adjustments');
        
        panelContent.appendChild(toolsPanel);
        panelContent.appendChild(adjustmentsPanel);
        
        leftPanel.appendChild(tabs);
        leftPanel.appendChild(panelContent);
        
        // Setup tab switching
        tabs.querySelectorAll('.panel-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const panelName = e.currentTarget.dataset.panel;
                this.switchLeftPanel(panelName);
            });
        });
        
        return leftPanel;
    }
    
    createRightPanel() {
        const rightPanel = document.createElement('div');
        rightPanel.className = 'enhanced-right-panel';
        rightPanel.style.cssText = `
            width: 320px;
            background: var(--nebula-surface);
            border-left: 1px solid var(--nebula-border);
            display: flex;
            flex-direction: column;
            flex-shrink: 0;
        `;
        
        // Panel tabs
        const tabs = document.createElement('div');
        tabs.className = 'panel-tabs';
        tabs.style.cssText = `
            display: flex;
            border-bottom: 1px solid var(--nebula-border);
            background: var(--nebula-bg-secondary);
        `;
        
        tabs.innerHTML = `
            <button class="panel-tab active" data-panel="layers">
                <span class="material-symbols-outlined">layers</span>
                <span>Layers</span>
            </button>
            <button class="panel-tab" data-panel="history">
                <span class="material-symbols-outlined">history</span>
                <span>History</span>
            </button>
            <button class="panel-tab" data-panel="info">
                <span class="material-symbols-outlined">info</span>
                <span>Info</span>
            </button>
        `;
        
        // Panel content
        const panelContent = document.createElement('div');
        panelContent.className = 'panel-content';
        panelContent.style.cssText = `
            flex: 1;
            overflow-y: auto;
        `;
        
        // Create panels
        const layersPanel = this.createEnhancedLayersPanel();
        const historyPanel = this.createEnhancedHistoryPanel();
        const infoPanel = this.createInfoPanel();
        
        layersPanel.style.display = 'block';
        historyPanel.style.display = 'none';
        infoPanel.style.display = 'none';
        
        panelContent.appendChild(layersPanel);
        panelContent.appendChild(historyPanel);
        panelContent.appendChild(infoPanel);
        
        rightPanel.appendChild(tabs);
        rightPanel.appendChild(panelContent);
        
        // Setup tab switching
        tabs.querySelectorAll('.panel-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const panelName = e.currentTarget.dataset.panel;
                this.switchRightPanel(panelName);
            });
        });
        
        return rightPanel;
    }
    
    createEnhancedCanvasArea() {
        const canvasArea = document.createElement('div');
        canvasArea.className = 'enhanced-canvas-area';
        canvasArea.style.cssText = `
            flex: 1;
            background: linear-gradient(45deg, #2a2a2a 25%, transparent 25%), 
                        linear-gradient(-45deg, #2a2a2a 25%, transparent 25%), 
                        linear-gradient(45deg, transparent 75%, #2a2a2a 75%), 
                        linear-gradient(-45deg, transparent 75%, #2a2a2a 75%);
            background-size: 20px 20px;
            background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
            background-color: #1a1a1a;
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        // Canvas container with enhanced styling
        const container = document.createElement('div');
        container.className = 'enhanced-canvas-container';
        container.style.cssText = `
            position: relative;
            background: white;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1);
            border-radius: 8px;
            overflow: hidden;
            transition: transform 0.2s ease;
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
        canvasArea.appendChild(container);
        
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
        
        return canvasArea;
    }
    
    createEnhancedToolsPanel() {
        const panel = document.createElement('div');
        panel.className = 'enhanced-tools-panel';
        panel.setAttribute('data-panel-content', 'tools');
        panel.style.cssText = `
            padding: 20px;
        `;
        
        panel.innerHTML = `
            <div class="tool-category">
                <h3 class="category-title">Drawing Tools</h3>
                <div class="tool-grid">
                    <button class="enhanced-tool-card active" data-tool="brush" title="Brush Tool">
                        <span class="material-symbols-outlined">brush</span>
                        <span class="tool-name">Brush</span>
                        <span class="tool-shortcut">B</span>
                    </button>
                    <button class="enhanced-tool-card" data-tool="pencil" title="Pencil Tool">
                        <span class="material-symbols-outlined">edit</span>
                        <span class="tool-name">Pencil</span>
                        <span class="tool-shortcut">P</span>
                    </button>
                    <button class="enhanced-tool-card" data-tool="eraser" title="Eraser Tool">
                        <span class="material-symbols-outlined">cleaning_services</span>
                        <span class="tool-name">Eraser</span>
                        <span class="tool-shortcut">E</span>
                    </button>
                </div>
            </div>
            
            <div class="tool-category">
                <h3 class="category-title">Selection Tools</h3>
                <div class="tool-grid">
                    <button class="enhanced-tool-card" data-tool="select" title="Selection Tool">
                        <span class="material-symbols-outlined">crop_free</span>
                        <span class="tool-name">Select</span>
                        <span class="tool-shortcut">M</span>
                    </button>
                    <button class="enhanced-tool-card" data-tool="move" title="Move Tool">
                        <span class="material-symbols-outlined">open_with</span>
                        <span class="tool-name">Move</span>
                        <span class="tool-shortcut">V</span>
                    </button>
                </div>
            </div>
            
            <div class="tool-category">
                <h3 class="category-title">Text & Shapes</h3>
                <div class="tool-grid">
                    <button class="enhanced-tool-card" data-tool="text" title="Text Tool">
                        <span class="material-symbols-outlined">text_fields</span>
                        <span class="tool-name">Text</span>
                        <span class="tool-shortcut">T</span>
                    </button>
                </div>
            </div>
            
            <div class="tool-properties">
                <h3 class="category-title">Tool Properties</h3>
                
                <div class="property-group">
                    <label class="property-label">Size</label>
                    <div class="property-control">
                        <input type="range" id="enhanced-brush-size" min="1" max="100" value="10" class="enhanced-slider">
                        <span id="enhanced-brush-size-value" class="property-value">10px</span>
                    </div>
                </div>
                
                <div class="property-group">
                    <label class="property-label">Opacity</label>
                    <div class="property-control">
                        <input type="range" id="enhanced-brush-opacity" min="0" max="100" value="100" class="enhanced-slider">
                        <span id="enhanced-brush-opacity-value" class="property-value">100%</span>
                    </div>
                </div>
                
                <div class="property-group">
                    <label class="property-label">Color</label>
                    <div class="color-control">
                        <input type="color" id="enhanced-brush-color" value="#000000" class="enhanced-color-picker">
                        <div class="color-info">
                            <span id="enhanced-brush-color-value">#000000</span>
                            <div class="color-preview" style="background: #000000;"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        return panel;
    }
    
    createEnhancedLayersPanel() {
        const panel = document.createElement('div');
        panel.className = 'enhanced-layers-panel';
        panel.setAttribute('data-panel-content', 'layers');
        panel.style.cssText = `
            padding: 20px;
        `;
        
        panel.innerHTML = `
            <div class="panel-header">
                <h3 class="panel-title">Layers</h3>
                <div class="panel-actions">
                    <button class="enhanced-icon-btn" id="add-layer-btn" title="Add Layer">
                        <span class="material-symbols-outlined">add</span>
                    </button>
                    <button class="enhanced-icon-btn" id="duplicate-layer-btn" title="Duplicate Layer">
                        <span class="material-symbols-outlined">content_copy</span>
                    </button>
                    <button class="enhanced-icon-btn" id="delete-layer-btn" title="Delete Layer">
                        <span class="material-symbols-outlined">delete</span>
                    </button>
                </div>
            </div>
            
            <div class="blend-mode-control">
                <label class="property-label">Blend Mode</label>
                <select id="blend-mode-select" class="enhanced-select">
                    <option value="normal">Normal</option>
                    <option value="multiply">Multiply</option>
                    <option value="screen">Screen</option>
                    <option value="overlay">Overlay</option>
                    <option value="darken">Darken</option>
                    <option value="lighten">Lighten</option>
                </select>
            </div>
            
            <div class="layer-opacity-control">
                <label class="property-label">Opacity</label>
                <div class="property-control">
                    <input type="range" id="layer-opacity" min="0" max="100" value="100" class="enhanced-slider">
                    <span id="layer-opacity-value" class="property-value">100%</span>
                </div>
            </div>
            
            <div id="enhanced-layers-list" class="enhanced-layers-list">
                <!-- Layers will be populated here -->
            </div>
        `;
        
        return panel;
    }
    
    createEnhancedHistoryPanel() {
        const panel = document.createElement('div');
        panel.className = 'enhanced-history-panel';
        panel.setAttribute('data-panel-content', 'history');
        panel.style.cssText = `
            padding: 20px;
            display: none;
        `;
        
        panel.innerHTML = `
            <div class="panel-header">
                <h3 class="panel-title">History</h3>
                <button class="enhanced-icon-btn" id="clear-history-btn" title="Clear History">
                    <span class="material-symbols-outlined">clear_all</span>
                </button>
            </div>
            
            <div id="enhanced-history-list" class="enhanced-history-list">
                <div class="history-item active">
                    <span class="material-symbols-outlined">add</span>
                    <span class="history-text">New Document</span>
                    <span class="history-time">Now</span>
                </div>
            </div>
        `;
        
        return panel;
    }
    
    createInfoPanel() {
        const panel = document.createElement('div');
        panel.className = 'enhanced-info-panel';
        panel.setAttribute('data-panel-content', 'info');
        panel.style.cssText = `
            padding: 20px;
            display: none;
        `;
        
        panel.innerHTML = `
            <div class="panel-header">
                <h3 class="panel-title">Document Info</h3>
            </div>
            
            <div class="info-group">
                <div class="info-item">
                    <span class="info-label">Dimensions</span>
                    <span class="info-value" id="doc-dimensions">800 × 600 px</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Color Mode</span>
                    <span class="info-value">RGB</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Resolution</span>
                    <span class="info-value">72 DPI</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Layers</span>
                    <span class="info-value" id="layer-count">1</span>
                </div>
            </div>
            
            <div class="info-group">
                <div class="info-item">
                    <span class="info-label">File Size</span>
                    <span class="info-value">~1.4 MB</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Created</span>
                    <span class="info-value" id="doc-created">Just now</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Modified</span>
                    <span class="info-value" id="doc-modified">Just now</span>
                </div>
            </div>
        `;
        
        return panel;
    }
    
    createEnhancedStatusBar() {
        const statusBar = document.createElement('div');
        statusBar.className = 'enhanced-status-bar';
        statusBar.style.cssText = `
            height: 32px;
            background: var(--nebula-surface);
            border-top: 1px solid var(--nebula-border);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 20px;
            font-size: 12px;
            color: var(--nebula-text-secondary);
            flex-shrink: 0;
        `;
        
        statusBar.innerHTML = `
            <div class="status-left">
                <span id="enhanced-status-info">Ready</span>
                <span class="status-separator">•</span>
                <span id="tool-status">Brush Tool</span>
            </div>
            <div class="status-right">
                <span id="cursor-position">0, 0</span>
                <span class="status-separator">•</span>
                <span id="enhanced-status-details">800 × 600 px • RGB</span>
            </div>
        `;
        
        return statusBar;
    }
    
    addEnhancedStyles() {
        if (document.querySelector('#enhanced-image-editor-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'enhanced-image-editor-styles';
        style.textContent = `
            /* Enhanced Button Styles */
            .enhanced-btn {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 8px 12px;
                border: 1px solid var(--nebula-border);
                background: var(--nebula-bg-secondary);
                color: var(--nebula-text-primary);
                border-radius: 6px;
                cursor: pointer;
                font-size: 13px;
                font-weight: 500;
                transition: all 0.2s ease;
                white-space: nowrap;
            }
            
            .enhanced-btn:hover {
                background: var(--nebula-surface-hover);
                border-color: var(--nebula-border-hover);
                transform: translateY(-1px);
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            
            .enhanced-btn:active {
                transform: translateY(0);
                box-shadow: 0 1px 4px rgba(0,0,0,0.1);
            }
            
            .enhanced-btn.primary {
                background: var(--nebula-primary);
                color: white;
                border-color: var(--nebula-primary);
            }
            
            .enhanced-btn.primary:hover {
                background: var(--nebula-primary-hover, var(--nebula-primary));
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            }
            
            /* Enhanced Tool Buttons */
            .enhanced-tool-btn {
                width: 44px;
                height: 44px;
                border: 2px solid transparent;
                background: var(--nebula-bg-secondary);
                color: var(--nebula-text-primary);
                border-radius: 8px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                position: relative;
            }
            
            .enhanced-tool-btn:hover {
                background: var(--nebula-surface-hover);
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
            
            .enhanced-tool-btn.active {
                background: var(--nebula-primary);
                color: white;
                border-color: var(--nebula-primary);
                box-shadow: 0 0 0 2px rgba(var(--nebula-primary-rgb, 59, 130, 246), 0.3);
            }
            
            .enhanced-tool-btn .material-symbols-outlined {
                font-size: 20px;
            }
            
            /* Tool Cards */
            .enhanced-tool-card {
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 16px 12px;
                border: 2px solid var(--nebula-border);
                background: var(--nebula-bg-secondary);
                color: var(--nebula-text-primary);
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
                position: relative;
                gap: 6px;
            }
            
            .enhanced-tool-card:hover {
                background: var(--nebula-surface-hover);
                border-color: var(--nebula-border-hover);
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            
            .enhanced-tool-card.active {
                background: var(--nebula-primary);
                color: white;
                border-color: var(--nebula-primary);
                box-shadow: 0 0 0 2px rgba(var(--nebula-primary-rgb, 59, 130, 246), 0.3);
            }
            
            .enhanced-tool-card .material-symbols-outlined {
                font-size: 24px;
            }
            
            .tool-name {
                font-size: 11px;
                font-weight: 500;
            }
            
            .tool-shortcut {
                position: absolute;
                top: 4px;
                right: 4px;
                font-size: 9px;
                opacity: 0.6;
                background: rgba(0,0,0,0.2);
                padding: 2px 4px;
                border-radius: 2px;
            }
            
            /* Panel Styles */
            .panel-tabs {
                display: flex;
            }
            
            .panel-tab {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                padding: 12px 8px;
                border: none;
                background: var(--nebula-bg-secondary);
                color: var(--nebula-text-secondary);
                cursor: pointer;
                font-size: 12px;
                font-weight: 500;
                transition: all 0.2s ease;
                border-bottom: 2px solid transparent;
            }
            
            .panel-tab:hover {
                background: var(--nebula-surface-hover);
                color: var(--nebula-text-primary);
            }
            
            .panel-tab.active {
                background: var(--nebula-surface);
                color: var(--nebula-primary);
                border-bottom-color: var(--nebula-primary);
            }
            
            .panel-tab .material-symbols-outlined {
                font-size: 16px;
            }
            
            /* Tool Categories */
            .tool-category {
                margin-bottom: 24px;
            }
            
            .category-title {
                font-size: 12px;
                font-weight: 600;
                color: var(--nebula-text-primary);
                margin: 0 0 12px 0;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .tool-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 8px;
            }
            
            /* Property Controls */
            .tool-properties {
                margin-top: 24px;
                padding-top: 20px;
                border-top: 1px solid var(--nebula-border);
            }
            
            .property-group {
                margin-bottom: 16px;
            }
            
            .property-label {
                display: block;
                font-size: 11px;
                font-weight: 500;
                color: var(--nebula-text-primary);
                margin-bottom: 6px;
                text-transform: uppercase;
                letter-spacing: 0.3px;
            }
            
            .property-control {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .enhanced-slider {
                flex: 1;
                height: 4px;
                border-radius: 2px;
                background: var(--nebula-border);
                outline: none;
                -webkit-appearance: none;
            }
            
            .enhanced-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: var(--nebula-primary);
                cursor: pointer;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }
            
            .property-value {
                font-size: 11px;
                color: var(--nebula-text-secondary);
                min-width: 40px;
                text-align: right;
            }
            
            .color-control {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .enhanced-color-picker {
                width: 40px;
                height: 40px;
                border: 2px solid var(--nebula-border);
                border-radius: 6px;
                cursor: pointer;
                background: none;
            }
            
            .color-info {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            
            .color-preview {
                width: 20px;
                height: 20px;
                border: 1px solid var(--nebula-border);
                border-radius: 3px;
            }
            
            /* Enhanced Layers */
            .enhanced-layers-list {
                margin-top: 16px;
                border: 1px solid var(--nebula-border);
                border-radius: 6px;
                background: var(--nebula-bg-primary);
                max-height: 300px;
                overflow-y: auto;
            }
            
            .enhanced-layer-item {
                display: flex;
                align-items: center;
                padding: 12px;
                border-bottom: 1px solid var(--nebula-border);
                cursor: pointer;
                transition: all 0.2s ease;
                gap: 12px;
            }
            
            .enhanced-layer-item:last-child {
                border-bottom: none;
            }
            
            .enhanced-layer-item:hover {
                background: var(--nebula-surface-hover);
            }
            
            .enhanced-layer-item.active {
                background: var(--nebula-primary);
                color: white;
            }
            
            .layer-thumbnail {
                width: 40px;
                height: 40px;
                border: 1px solid var(--nebula-border);
                border-radius: 4px;
                background: white;
                flex-shrink: 0;
            }
            
            .layer-info {
                flex: 1;
                min-width: 0;
            }
            
            .layer-name {
                font-size: 13px;
                font-weight: 500;
                margin-bottom: 2px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .layer-details {
                font-size: 11px;
                opacity: 0.7;
            }
            
            .layer-controls {
                display: flex;
                gap: 4px;
                flex-shrink: 0;
            }
            
            .layer-control-btn {
                width: 24px;
                height: 24px;
                border: none;
                background: transparent;
                color: currentColor;
                cursor: pointer;
                border-radius: 3px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.2s ease;
            }
            
            .layer-control-btn:hover {
                background: rgba(255,255,255,0.1);
            }
            
            /* Enhanced Icon Buttons */
            .enhanced-icon-btn {
                width: 32px;
                height: 32px;
                border: 1px solid var(--nebula-border);
                background: var(--nebula-bg-secondary);
                color: var(--nebula-text-primary);
                border-radius: 4px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
            }
            
            .enhanced-icon-btn:hover {
                background: var(--nebula-surface-hover);
                border-color: var(--nebula-border-hover);
            }
            
            .enhanced-icon-btn .material-symbols-outlined {
                font-size: 16px;
            }
            
            /* Panel Headers */
            .panel-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 16px;
            }
            
            .panel-title {
                font-size: 14px;
                font-weight: 600;
                color: var(--nebula-text-primary);
                margin: 0;
            }
            
            .panel-actions {
                display: flex;
                gap: 4px;
            }
            
            /* Enhanced Select */
            .enhanced-select {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid var(--nebula-border);
                background: var(--nebula-bg-secondary);
                color: var(--nebula-text-primary);
                border-radius: 4px;
                font-size: 12px;
                cursor: pointer;
            }
            
            /* Toolbar Sections */
            .toolbar-section {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .toolbar-separator {
                width: 1px;
                height: 32px;
                background: var(--nebula-border);
                margin: 0 8px;
            }
            
            .zoom-controls {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .zoom-display {
                min-width: 60px;
                text-align: center;
                font-size: 12px;
                font-weight: 500;
                color: var(--nebula-text-primary);
            }
            
            .toolbar-title {
                margin-left: auto;
                display: flex;
                flex-direction: column;
                align-items: flex-end;
            }
            
            .app-title {
                font-size: 14px;
                font-weight: 600;
                color: var(--nebula-text-primary);
            }
            
            .document-name {
                font-size: 11px;
                color: var(--nebula-text-secondary);
            }
            
            /* Info Panel */
            .info-group {
                margin-bottom: 20px;
                padding: 12px;
                background: var(--nebula-bg-secondary);
                border-radius: 6px;
            }
            
            .info-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 6px 0;
                border-bottom: 1px solid var(--nebula-border);
            }
            
            .info-item:last-child {
                border-bottom: none;
            }
            
            .info-label {
                font-size: 11px;
                color: var(--nebula-text-secondary);
                font-weight: 500;
            }
            
            .info-value {
                font-size: 11px;
                color: var(--nebula-text-primary);
                font-weight: 500;
            }
            
            /* Status Bar */
            .status-separator {
                margin: 0 8px;
                opacity: 0.5;
            }
            
            /* History Panel */
            .enhanced-history-list {
                border: 1px solid var(--nebula-border);
                border-radius: 6px;
                background: var(--nebula-bg-primary);
                max-height: 300px;
                overflow-y: auto;
            }
            
            .history-item {
                display: flex;
                align-items: center;
                padding: 8px 12px;
                border-bottom: 1px solid var(--nebula-border);
                cursor: pointer;
                transition: background 0.2s ease;
                gap: 8px;
            }
            
            .history-item:last-child {
                border-bottom: none;
            }
            
            .history-item:hover {
                background: var(--nebula-surface-hover);
            }
            
            .history-item.active {
                background: var(--nebula-primary);
                color: white;
            }
            
            .history-text {
                flex: 1;
                font-size: 12px;
            }
            
            .history-time {
                font-size: 10px;
                opacity: 0.7;
            }
            
            /* Responsive adjustments */
            @media (max-width: 1200px) {
                .enhanced-left-panel,
                .enhanced-right-panel {
                    width: 250px;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    switchLeftPanel(panelName) {
        // Update tab states
        document.querySelectorAll('.enhanced-left-panel .panel-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.panel === panelName);
        });
        
        // Update panel visibility
        document.querySelectorAll('.enhanced-left-panel [data-panel-content]').forEach(panel => {
            panel.style.display = panel.dataset.panelContent === panelName ? 'block' : 'none';
        });
    }
    
    switchRightPanel(panelName) {
        // Update tab states
        document.querySelectorAll('.enhanced-right-panel .panel-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.panel === panelName);
        });
        
        // Update panel visibility
        document.querySelectorAll('.enhanced-right-panel [data-panel-content]').forEach(panel => {
            panel.style.display = panel.dataset.panelContent === panelName ? 'block' : 'none';
        });
    }
    
    setupEventListeners() {
        // Tool selection (both toolbar and panel)
        document.querySelectorAll('[data-tool]').forEach(btn => {
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
        document.getElementById('fit-screen-btn')?.addEventListener('click', () => this.fitToScreen());
        
        // Layer operations
        document.getElementById('add-layer-btn')?.addEventListener('click', () => this.addLayer());
        document.getElementById('duplicate-layer-btn')?.addEventListener('click', () => this.duplicateLayer());
        document.getElementById('delete-layer-btn')?.addEventListener('click', () => this.deleteLayer());
        
        // Enhanced property controls
        this.setupEnhancedPropertyControls();
        
        // Canvas events
        if (this.canvas) {
            this.canvas.addEventListener('mousedown', (e) => this.handleCanvasMouseDown(e));
            this.canvas.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));
            this.canvas.addEventListener('mouseup', (e) => this.handleCanvasMouseUp(e));
            this.canvas.addEventListener('wheel', (e) => this.handleCanvasWheel(e));
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }
    
    setupEnhancedPropertyControls() {
        // Enhanced brush size
        const brushSize = document.getElementById('enhanced-brush-size');
        const brushOpacity = document.getElementById('enhanced-brush-opacity');
        const brushColor = document.getElementById('enhanced-brush-color');
        
        if (brushSize) {
            brushSize.addEventListener('input', (e) => {
                document.getElementById('enhanced-brush-size-value').textContent = e.target.value + 'px';
                this.toolManager.setProperty('size', parseInt(e.target.value));
            });
        }
        
        if (brushOpacity) {
            brushOpacity.addEventListener('input', (e) => {
                document.getElementById('enhanced-brush-opacity-value').textContent = e.target.value + '%';
                this.toolManager.setProperty('opacity', parseInt(e.target.value) / 100);
            });
        }
        
        if (brushColor) {
            brushColor.addEventListener('input', (e) => {
                document.getElementById('enhanced-brush-color-value').textContent = e.target.value;
                document.querySelector('.color-preview').style.background = e.target.value;
                this.toolManager.setProperty('color', e.target.value);
            });
        }
        
        // Layer opacity
        const layerOpacity = document.getElementById('layer-opacity');
        if (layerOpacity) {
            layerOpacity.addEventListener('input', (e) => {
                document.getElementById('layer-opacity-value').textContent = e.target.value + '%';
                const activeLayer = this.layerManager.getActiveLayer();
                if (activeLayer) {
                    this.layerManager.setLayerProperty(activeLayer.id, 'opacity', parseInt(e.target.value) / 100);
                    this.updateLayersPanel();
                }
            });
        }
        
        // Blend mode
        const blendMode = document.getElementById('blend-mode-select');
        if (blendMode) {
            blendMode.addEventListener('change', (e) => {
                const activeLayer = this.layerManager.getActiveLayer();
                if (activeLayer) {
                    this.layerManager.setLayerProperty(activeLayer.id, 'blendMode', e.target.value);
                }
            });
        }
    }
    
    handleKeyDown(e) {
        const windowElement = document.getElementById(this.windowId);
        if (!windowElement || !windowElement.contains(document.activeElement)) {
            return;
        }
        
        // Tool shortcuts
        if (!e.ctrlKey && !e.altKey && !e.shiftKey) {
            switch (e.key.toLowerCase()) {
                case 'b': this.selectTool('brush'); e.preventDefault(); break;
                case 'p': this.selectTool('pencil'); e.preventDefault(); break;
                case 'e': this.selectTool('eraser'); e.preventDefault(); break;
                case 'm': this.selectTool('select'); e.preventDefault(); break;
                case 'v': this.selectTool('move'); e.preventDefault(); break;
                case 't': this.selectTool('text'); e.preventDefault(); break;
            }
        }
        
        // File shortcuts
        if (e.ctrlKey) {
            switch (e.key.toLowerCase()) {
                case 's': e.preventDefault(); this.saveDocument(); break;
                case 'n': e.preventDefault(); this.newDocument(); break;
                case 'o': e.preventDefault(); this.openDocument(); break;
                case 'z': e.preventDefault(); this.undo(); break;
                case 'y': e.preventDefault(); this.redo(); break;
            }
        }
        
        // Zoom shortcuts
        if (e.ctrlKey) {
            switch (e.key) {
                case '=':
                case '+': e.preventDefault(); this.zoomIn(); break;
                case '-': e.preventDefault(); this.zoomOut(); break;
                case '0': e.preventDefault(); this.fitToScreen(); break;
            }
        }
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
        this.selectTool('brush'); // Default to brush tool
    }
    
    selectTool(toolName) {
        // Remove active class from all tool buttons
        document.querySelectorAll('[data-tool]').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Add active class to selected tool
        document.querySelectorAll(`[data-tool="${toolName}"]`).forEach(btn => {
            btn.classList.add('active');
        });
        
        this.toolManager.setActiveTool(toolName);
        this.updateStatus(`${toolName.charAt(0).toUpperCase() + toolName.slice(1)} tool selected`);
        
        // Update tool status
        const toolStatus = document.getElementById('tool-status');
        if (toolStatus) {
            toolStatus.textContent = `${toolName.charAt(0).toUpperCase() + toolName.slice(1)} Tool`;
        }
    }
    
    addLayer() {
        if (!this.currentDocument) return;
        
        const newLayer = new Layer({ name: `Layer ${this.layerManager.layers.length + 1}` });
        this.layerManager.addLayer(newLayer);
        this.updateLayersPanel();
        this.updateStatus('Layer added');
    }
    
    duplicateLayer() {
        const activeLayer = this.layerManager.getActiveLayer();
        if (!activeLayer) return;
        
        const duplicatedLayer = new Layer({ 
            name: `${activeLayer.name} copy`,
            opacity: activeLayer.opacity,
            blendMode: activeLayer.blendMode
        });
        
        // Copy canvas content
        duplicatedLayer.setSize(activeLayer.canvas.width, activeLayer.canvas.height);
        duplicatedLayer.context.drawImage(activeLayer.canvas, 0, 0);
        
        this.layerManager.addLayer(duplicatedLayer);
        this.updateLayersPanel();
        this.updateStatus('Layer duplicated');
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
        const layersList = document.getElementById('enhanced-layers-list');
        if (!layersList || !this.layerManager) return;
        
        layersList.innerHTML = '';
        
        // Render layers in reverse order (top to bottom)
        const layers = [...this.layerManager.layers].reverse();
        layers.forEach(layer => {
            const layerItem = document.createElement('div');
            layerItem.className = 'enhanced-layer-item';
            if (layer.id === this.layerManager.activeLayerId) {
                layerItem.classList.add('active');
            }
            
            layerItem.innerHTML = `
                <div class="layer-thumbnail"></div>
                <div class="layer-info">
                    <div class="layer-name">${layer.name}</div>
                    <div class="layer-details">${layer.blendMode} • ${Math.round(layer.opacity * 100)}%</div>
                </div>
                <div class="layer-controls">
                    <button class="layer-control-btn" title="Toggle Visibility">
                        <span class="material-symbols-outlined" style="font-size: 16px;">
                            ${layer.visible ? 'visibility' : 'visibility_off'}
                        </span>
                    </button>
                    <button class="layer-control-btn" title="Lock Layer">
                        <span class="material-symbols-outlined" style="font-size: 16px;">
                            ${layer.locked ? 'lock' : 'lock_open'}
                        </span>
                    </button>
                </div>
            `;
            
            layerItem.addEventListener('click', (e) => {
                if (!e.target.closest('.layer-control-btn')) {
                    this.layerManager.setActiveLayer(layer.id);
                    this.updateLayersPanel();
                    this.updateLayerControls(layer);
                }
            });
            
            // Visibility toggle
            const visibilityBtn = layerItem.querySelector('.layer-control-btn');
            visibilityBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.layerManager.setLayerProperty(layer.id, 'visible', !layer.visible);
                this.updateLayersPanel();
            });
            
            layersList.appendChild(layerItem);
        });
        
        // Update layer count in info panel
        const layerCount = document.getElementById('layer-count');
        if (layerCount) {
            layerCount.textContent = this.layerManager.layers.length;
        }
    }
    
    updateLayerControls(layer) {
        // Update layer opacity slider
        const layerOpacity = document.getElementById('layer-opacity');
        const layerOpacityValue = document.getElementById('layer-opacity-value');
        if (layerOpacity && layerOpacityValue) {
            layerOpacity.value = Math.round(layer.opacity * 100);
            layerOpacityValue.textContent = Math.round(layer.opacity * 100) + '%';
        }
        
        // Update blend mode select
        const blendModeSelect = document.getElementById('blend-mode-select');
        if (blendModeSelect) {
            blendModeSelect.value = layer.blendMode;
        }
    }
    
    fitToScreen() {
        // Calculate zoom to fit canvas in viewport
        const canvasArea = document.querySelector('.enhanced-canvas-area');
        if (!canvasArea) return;
        
        const areaRect = canvasArea.getBoundingClientRect();
        const padding = 40; // Padding around canvas
        
        const scaleX = (areaRect.width - padding * 2) / this.canvasWidth;
        const scaleY = (areaRect.height - padding * 2) / this.canvasHeight;
        
        this.zoom = Math.min(scaleX, scaleY, 1.0); // Don't zoom in beyond 100%
        this.updateZoom();
    }
    
    handleCanvasMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.round((e.clientX - rect.left) / this.zoom);
        const y = Math.round((e.clientY - rect.top) / this.zoom);
        
        // Update cursor position in status bar
        const cursorPosition = document.getElementById('cursor-position');
        if (cursorPosition) {
            cursorPosition.textContent = `${x}, ${y}`;
        }
        
        this.toolManager.handleMouseMove({ x, y, event: e });
    }
    
    // Inherit other methods from the original implementation
    handleCanvasMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / this.zoom;
        const y = (e.clientY - rect.top) / this.zoom;
        
        this.toolManager.handleMouseDown({ x, y, event: e });
    }
    
    handleCanvasMouseUp(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / this.zoom;
        const y = (e.clientY - rect.top) / this.zoom;
        
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
        const container = document.querySelector('.enhanced-canvas-container');
        if (container) {
            container.style.transform = `scale(${this.zoom})`;
        }
    }
    
    newDocument() {
        this.createNewDocument();
    }
    
    openDocument() {
        this.updateStatus('Open document - feature coming soon');
    }
    
    saveDocument() {
        this.updateStatus('Save document - feature coming soon');
    }
    
    undo() {
        this.updateStatus('Undo - feature coming soon');
    }
    
    redo() {
        this.updateStatus('Redo - feature coming soon');
    }
    
    updateStatus(message, details = null) {
        const statusInfo = document.getElementById('enhanced-status-info');
        const statusDetails = document.getElementById('enhanced-status-details');
        
        if (statusInfo) statusInfo.textContent = message;
        if (details && statusDetails) statusDetails.textContent = details;
    }
    
    getTitle() {
        return 'Nebula Image Editor Pro';
    }
    
    getIcon() {
        return '🎨';
    }
    
    cleanup() {
        if (this.eventManager) {
            this.eventManager.cleanup();
        }
        console.log('Enhanced NebulaImageEditor cleanup completed');
    }
}

// Export for use in NebulaDesktop
window.EnhancedNebulaImageEditor = EnhancedNebulaImageEditor;
window.enhancedImageEditor = null;

// Register the enhanced app with WindowManager
window.enhancedImageEditor = new EnhancedNebulaImageEditor();

