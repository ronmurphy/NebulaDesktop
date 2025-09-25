// NebulaApp Image Editor - Fixed Version with Working Core Features and Integrated 3D System
// This version ensures layer visibility, file opening, and integrated Three.js 3D modal work correctly

class NebulaApp {
    constructor() {
        this.windowId = null;
        this.eventManager = new EventManager();
        this.layerManager = null;
        this.toolManager = null;
        this.selectionManager = null;
        this.gradientManager = null;
        this.stylusManager = null;
        this.threejsModal = null;
        this.currentTool = 'brush';
        this.isDrawing = false;
        this.lastPoint = null;
        this.currentPath = [];
        this.undoStack = [];
        this.redoStack = [];
        this.maxUndoSteps = 50;
        
        // Store reference for debugging
        window.nebulaAppInstance = this;
        
        // Initialize the app
        this.init();
    }
    
    init() {
        // Create window through WindowManager
        if (window.windowManager) {
            this.windowId = window.windowManager.createWindow({
                title: this.getTitle(),
                icon: this.getIcon(),
                width: 1200,
                height: 800,
                resizable: true,
                maximizable: true
            });
            
            window.windowManager.loadApp(this.windowId, this);
        }
    }
    
    getTitle() {
        return 'Image Editor Pro';
    }
    
    getIcon() {
        return 'palette';
    }
    
    render() {
        const container = document.createElement('div');
        container.className = 'image-editor-container';
        container.style.cssText = `
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            background: var(--nebula-background, #1a1a1a);
            color: var(--nebula-text, #ffffff);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            overflow: hidden;
        `;
        
        // Create main components
        const toolbar = this.createToolbar();
        const contentArea = this.createContentArea();
        const statusBar = this.createStatusBar();
        
        container.appendChild(toolbar);
        container.appendChild(contentArea);
        container.appendChild(statusBar);
        
        // Set up initialization after UI is created
        setTimeout(() => {
            this.setupEventListeners();
            this.initializePanels();
            this.setupMainCanvas();
            this.loadInitialData();
            this.initialize3DSystem();
            this.updateAllPanels();
        }, 100);

        return container;
    }
    
    initialize3DSystem() {
        try {
            // Initialize the integrated 3D reference system
            this.threejsModal = new IntegratedThreeJSModal(this.eventManager, this.layerManager);
            
            // Set up event listeners for 3D system
            this.eventManager.on('3dReferenceLayerCreated', (data) => {
                console.log('3D Reference layer created:', data);
                this.updateAllPanels();
                this.showNotification('3D reference captured as new layer!', 'success');
            });
            
            console.log('Integrated 3D System initialized successfully');
        } catch (error) {
            console.warn('3D System initialization failed:', error);
            // Continue without 3D features but show user-friendly message
            this.showNotification('3D system loading... Some features may be limited initially.', 'info');
        }
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
        document.getElementById('brush-btn')?.addEventListener('click', () => this.setTool('brush'));
        document.getElementById('pencil-btn')?.addEventListener('click', () => this.setTool('pencil'));
        document.getElementById('eraser-btn')?.addEventListener('click', () => this.setTool('eraser'));
        document.getElementById('select-btn')?.addEventListener('click', () => this.setTool('select'));
        document.getElementById('move-btn')?.addEventListener('click', () => this.setTool('move'));
        document.getElementById('text-btn')?.addEventListener('click', () => this.setTool('text'));
        document.getElementById('gradient-btn')?.addEventListener('click', () => this.setTool('gradient'));
        document.getElementById('3d-reference-btn')?.addEventListener('click', () => this.open3DReference());
        
        // Zoom controls
        document.getElementById('zoom-out-btn')?.addEventListener('click', () => this.zoomOut());
        document.getElementById('zoom-in-btn')?.addEventListener('click', () => this.zoomIn());
        document.getElementById('zoom-fit-btn')?.addEventListener('click', () => this.zoomToFit());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Canvas events
        const mainCanvas = document.getElementById('main-canvas');
        if (mainCanvas) {
            mainCanvas.addEventListener('mousedown', (e) => this.handleCanvasMouseDown(e));
            mainCanvas.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));
            mainCanvas.addEventListener('mouseup', (e) => this.handleCanvasMouseUp(e));
            mainCanvas.addEventListener('wheel', (e) => this.handleCanvasWheel(e));
            
            // Touch events for mobile/tablet support
            mainCanvas.addEventListener('touchstart', (e) => this.handleCanvasTouchStart(e));
            mainCanvas.addEventListener('touchmove', (e) => this.handleCanvasTouchMove(e));
            mainCanvas.addEventListener('touchend', (e) => this.handleCanvasTouchEnd(e));
        }
    }
    
    open3DReference() {
        if (this.threejsModal) {
            this.threejsModal.show();
        } else {
            this.showNotification('3D Reference system is initializing. Please wait a moment...', 'info');
            // Try to initialize again
            setTimeout(() => {
                this.initialize3DSystem();
                if (this.threejsModal) {
                    this.threejsModal.show();
                } else {
                    this.showNotification('3D Reference system unavailable. Please check console for errors.', 'error');
                }
            }, 1000);
        }
    }

    createToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'image-editor-toolbar';
        toolbar.style.cssText = `
            height: 50px;
            background: var(--nebula-surface, #2a2a2a);
            border-bottom: 1px solid var(--nebula-border, #404040);
            display: flex;
            align-items: center;
            padding: 0 10px;
            gap: 5px;
            flex-shrink: 0;
        `;
        
        const toolbarButtons = [
            { id: 'new-btn', icon: '➕', text: 'New', shortcut: 'Ctrl+N' },
            { id: 'open-btn', icon: '📁', text: 'Open', shortcut: 'Ctrl+O' },
            { id: 'save-btn', icon: '💾', text: 'Save', shortcut: 'Ctrl+S' },
            { type: 'separator' },
            { id: 'undo-btn', icon: '↶', shortcut: 'Ctrl+Z' },
            { id: 'redo-btn', icon: '↷', shortcut: 'Ctrl+Y' },
            { type: 'separator' },
            { id: 'brush-btn', icon: '🖌️', shortcut: 'B' },
            { id: 'pencil-btn', icon: '✏️', shortcut: 'P' },
            { id: 'eraser-btn', icon: '🧽', shortcut: 'E' },
            { id: 'select-btn', icon: '⬚', shortcut: 'M' },
            { id: 'move-btn', icon: '✋', shortcut: 'V' },
            { id: 'text-btn', icon: 'T', shortcut: 'T' },
            { id: 'gradient-btn', icon: '🌈', shortcut: 'G' },
            { id: '3d-reference-btn', icon: '🎭', text: '3D Ref', shortcut: 'R' },
            { type: 'separator' },
            { id: 'zoom-out-btn', icon: '🔍-', text: 'Zoom Out' },
            { id: 'zoom-in-btn', icon: '🔍+', text: 'Zoom In' },
            { id: 'zoom-fit-btn', icon: '⬜', text: 'Fit Screen' }
        ];
        
        toolbarButtons.forEach(button => {
            if (button.type === 'separator') {
                const separator = document.createElement('div');
                separator.style.cssText = `
                    width: 1px;
                    height: 30px;
                    background: var(--nebula-border, #404040);
                    margin: 0 5px;
                `;
                toolbar.appendChild(separator);
            } else {
                const btn = document.createElement('button');
                btn.id = button.id;
                btn.className = 'toolbar-btn';
                btn.title = button.shortcut ? `${button.text || ''} (${button.shortcut})` : (button.text || '');
                btn.style.cssText = `
                    background: none;
                    border: none;
                    color: var(--nebula-text, #ffffff);
                    padding: 8px;
                    border-radius: 4px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 12px;
                    transition: background-color 0.2s;
                `;
                
                btn.innerHTML = `
                    <span style="font-size: 16px;">${button.icon}</span>
                    ${button.text ? `<span>${button.text}</span>` : ''}
                `;
                
                btn.addEventListener('mouseenter', () => {
                    btn.style.background = 'var(--nebula-hover, #404040)';
                });
                
                btn.addEventListener('mouseleave', () => {
                    btn.style.background = 'none';
                });
                
                toolbar.appendChild(btn);
            }
        });
        
        return toolbar;
    }

    createContentArea() {
        const contentArea = document.createElement('div');
        contentArea.className = 'image-editor-content';
        contentArea.style.cssText = `
            flex: 1;
            display: flex;
            overflow: hidden;
        `;
        
        // Left panel
        const leftPanel = document.createElement('div');
        leftPanel.className = 'left-panel';
        leftPanel.style.cssText = `
            width: 250px;
            background: var(--nebula-surface, #2a2a2a);
            border-right: 1px solid var(--nebula-border, #404040);
            display: flex;
            flex-direction: column;
            flex-shrink: 0;
        `;
        
        // Panel tabs
        const panelTabs = document.createElement('div');
        panelTabs.className = 'panel-tabs';
        panelTabs.style.cssText = `
            display: flex;
            border-bottom: 1px solid var(--nebula-border, #404040);
            background: var(--nebula-background, #1a1a1a);
        `;
        
        const tabs = [
            { id: 'tools-tab', icon: '🔧', text: 'Tools', active: true },
            { id: 'adjust-tab', icon: '⚙️', text: 'Adjust' }
        ];
        
        tabs.forEach(tab => {
            const tabBtn = document.createElement('button');
            tabBtn.id = tab.id;
            tabBtn.className = `panel-tab ${tab.active ? 'active' : ''}`;
            tabBtn.style.cssText = `
                flex: 1;
                background: ${tab.active ? 'var(--nebula-surface, #2a2a2a)' : 'none'};
                border: none;
                color: var(--nebula-text, #ffffff);
                padding: 10px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 5px;
                font-size: 11px;
                border-bottom: ${tab.active ? '2px solid var(--nebula-accent, #007acc)' : '2px solid transparent'};
            `;
            
            tabBtn.innerHTML = `
                <span style="font-size: 14px;">${tab.icon}</span>
                <span>${tab.text}</span>
            `;
            
            tabBtn.addEventListener('click', () => this.switchPanelTab(tab.id));
            panelTabs.appendChild(tabBtn);
        });
        
        leftPanel.appendChild(panelTabs);
        
        // Panel content
        const panelContent = document.createElement('div');
        panelContent.className = 'panel-content';
        panelContent.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: 15px;
        `;
        
        // Tools panel
        const toolsPanel = document.createElement('div');
        toolsPanel.id = 'tools-panel';
        toolsPanel.className = 'panel active';
        toolsPanel.innerHTML = `
            <div class="tool-section">
                <h3 style="color: var(--nebula-text, #ffffff); margin: 0 0 10px 0; font-size: 13px;">Brush Settings</h3>
                <div class="tool-property">
                    <label style="color: var(--nebula-text, #ffffff); font-size: 11px;">Size</label>
                    <input type="range" id="brush-size" min="1" max="100" value="10" style="width: 100%;">
                    <span id="brush-size-value" style="color: var(--nebula-text-secondary, #cccccc); font-size: 10px;">10px</span>
                </div>
                <div class="tool-property">
                    <label style="color: var(--nebula-text, #ffffff); font-size: 11px;">Opacity</label>
                    <input type="range" id="brush-opacity" min="0" max="100" value="100" style="width: 100%;">
                    <span id="brush-opacity-value" style="color: var(--nebula-text-secondary, #cccccc); font-size: 10px;">100%</span>
                </div>
                <div class="tool-property">
                    <label style="color: var(--nebula-text, #ffffff); font-size: 11px;">Color</label>
                    <input type="color" id="brush-color" value="#ffffff" style="width: 100%; height: 30px; border: none; border-radius: 4px;">
                </div>
                
                <div class="tool-section" style="margin-top: 25px; border-top: 1px solid var(--nebula-border, #404040); padding-top: 20px;">
                    <h3 style="color: var(--nebula-text, #ffffff); margin: 0 0 15px 0; font-size: 13px;">🎭 Integrated 3D Reference</h3>
                    <button id="open-3d-modal-btn" style="
                        background: var(--nebula-accent, #007acc);
                        color: white;
                        border: none;
                        padding: 12px 16px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                        width: 100%;
                        margin-bottom: 10px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                        font-weight: 500;
                    ">
                        <span style="font-size: 16px;">🎭</span>
                        Open 3D Mannequin Studio
                    </button>
                    
                    <div style="
                        margin-top: 15px;
                        padding: 12px;
                        background: var(--nebula-background, #1a1a1a);
                        border-radius: 4px;
                        border: 1px solid var(--nebula-border, #404040);
                    ">
                        <div style="color: var(--nebula-text, #ffffff); font-size: 11px; line-height: 1.4; margin-bottom: 8px;">
                            <strong>✨ Features:</strong>
                        </div>
                        <div style="color: var(--nebula-text-secondary, #cccccc); font-size: 10px; line-height: 1.3;">
                            • Load & pose 3D mannequins<br>
                            • Preset poses & manual controls<br>
                            • Capture scenes as layers<br>
                            • Perfect for figure drawing
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Adjust panel
        const adjustPanel = document.createElement('div');
        adjustPanel.id = 'adjust-panel';
        adjustPanel.className = 'panel';
        adjustPanel.style.display = 'none';
        adjustPanel.innerHTML = `
            <div class="adjust-section">
                <h3 style="color: var(--nebula-text, #ffffff); margin: 0 0 10px 0; font-size: 13px;">Image Adjustments</h3>
                <div class="adjust-property">
                    <label style="color: var(--nebula-text, #ffffff); font-size: 11px;">Brightness</label>
                    <input type="range" id="brightness" min="-100" max="100" value="0" style="width: 100%;">
                    <span id="brightness-value" style="color: var(--nebula-text-secondary, #cccccc); font-size: 10px;">0</span>
                </div>
                <div class="adjust-property">
                    <label style="color: var(--nebula-text, #ffffff); font-size: 11px;">Contrast</label>
                    <input type="range" id="contrast" min="-100" max="100" value="0" style="width: 100%;">
                    <span id="contrast-value" style="color: var(--nebula-text-secondary, #cccccc); font-size: 10px;">0</span>
                </div>
                <div class="filter-buttons" style="margin-top: 15px;">
                    <button id="grayscale-btn" style="width: 100%; margin-bottom: 5px; padding: 8px; background: var(--nebula-accent, #007acc); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">Grayscale</button>
                    <button id="sepia-btn" style="width: 100%; margin-bottom: 5px; padding: 8px; background: var(--nebula-accent, #007acc); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">Sepia</button>
                    <button id="invert-btn" style="width: 100%; margin-bottom: 5px; padding: 8px; background: var(--nebula-accent, #007acc); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">Invert</button>
                </div>
            </div>
        `;
        
        panelContent.appendChild(toolsPanel);
        panelContent.appendChild(adjustPanel);
        leftPanel.appendChild(panelContent);
        
        // Main canvas area
        const canvasArea = document.createElement('div');
        canvasArea.className = 'canvas-area';
        canvasArea.style.cssText = `
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: center;
            background: var(--nebula-background, #1a1a1a);
            position: relative;
            overflow: hidden;
        `;
        
        const canvas = document.createElement('canvas');
        canvas.id = 'main-canvas';
        canvas.width = 800;
        canvas.height = 600;
        canvas.style.cssText = `
            background: white;
            border: 1px solid var(--nebula-border, #404040);
            cursor: crosshair;
        `;
        
        canvasArea.appendChild(canvas);
        
        // Right panel
        const rightPanel = document.createElement('div');
        rightPanel.className = 'right-panel';
        rightPanel.style.cssText = `
            width: 250px;
            background: var(--nebula-surface, #2a2a2a);
            border-left: 1px solid var(--nebula-border, #404040);
            display: flex;
            flex-direction: column;
            flex-shrink: 0;
        `;
        
        // Right panel tabs
        const rightPanelTabs = document.createElement('div');
        rightPanelTabs.className = 'panel-tabs';
        rightPanelTabs.style.cssText = `
            display: flex;
            border-bottom: 1px solid var(--nebula-border, #404040);
            background: var(--nebula-background, #1a1a1a);
        `;
        
        const rightTabs = [
            { id: 'layers-tab', icon: '📚', text: 'Layers', active: true },
            { id: 'history-tab', icon: '📜', text: 'History' },
            { id: 'info-tab', icon: 'ℹ️', text: 'Info' }
        ];
        
        rightTabs.forEach(tab => {
            const tabBtn = document.createElement('button');
            tabBtn.id = tab.id;
            tabBtn.className = `panel-tab ${tab.active ? 'active' : ''}`;
            tabBtn.style.cssText = `
                flex: 1;
                background: ${tab.active ? 'var(--nebula-surface, #2a2a2a)' : 'none'};
                border: none;
                color: var(--nebula-text, #ffffff);
                padding: 8px 4px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 3px;
                font-size: 10px;
                border-bottom: ${tab.active ? '2px solid var(--nebula-accent, #007acc)' : '2px solid transparent'};
            `;
            
            tabBtn.innerHTML = `
                <span style="font-size: 12px;">${tab.icon}</span>
                <span>${tab.text}</span>
            `;
            
            tabBtn.addEventListener('click', () => this.switchRightPanelTab(tab.id));
            rightPanelTabs.appendChild(tabBtn);
        });
        
        rightPanel.appendChild(rightPanelTabs);
        
        // Right panel content
        const rightPanelContent = document.createElement('div');
        rightPanelContent.className = 'right-panel-content';
        rightPanelContent.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: 15px;
        `;
        
        // Layers panel
        const layersPanel = document.createElement('div');
        layersPanel.id = 'layers-panel';
        layersPanel.className = 'panel active';
        layersPanel.innerHTML = `
            <div class="layers-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="color: var(--nebula-text, #ffffff); margin: 0; font-size: 13px;">Layers</h3>
                <button id="add-layer-btn" style="background: var(--nebula-accent, #007acc); color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">
                    <span style="font-size: 14px;">➕</span>
                </button>
            </div>
            <div class="layer-controls" style="margin-bottom: 15px;">
                <div style="margin-bottom: 8px;">
                    <label style="color: var(--nebula-text, #ffffff); font-size: 11px;">Blend Mode</label>
                    <select id="blend-mode" style="width: 100%; padding: 4px; background: var(--nebula-background, #1a1a1a); color: var(--nebula-text, #ffffff); border: 1px solid var(--nebula-border, #404040); border-radius: 4px;">
                        <option value="normal">Normal</option>
                        <option value="multiply">Multiply</option>
                        <option value="screen">Screen</option>
                        <option value="overlay">Overlay</option>
                    </select>
                </div>
                <div>
                    <label style="color: var(--nebula-text, #ffffff); font-size: 11px;">Layer Opacity</label>
                    <input type="range" id="layer-opacity" min="0" max="100" value="100" style="width: 100%;">
                    <span id="layer-opacity-value" style="color: var(--nebula-text-secondary, #cccccc); font-size: 10px;">100%</span>
                </div>
            </div>
            <div id="layers-list" style="border: 1px solid var(--nebula-border, #404040); border-radius: 4px; background: var(--nebula-background, #1a1a1a);">
                <!-- Layers will be populated here -->
            </div>
        `;
        
        // History panel
        const historyPanel = document.createElement('div');
        historyPanel.id = 'history-panel';
        historyPanel.className = 'panel';
        historyPanel.style.display = 'none';
        historyPanel.innerHTML = `
            <h3 style="color: var(--nebula-text, #ffffff); margin: 0 0 15px 0; font-size: 13px;">History</h3>
            <div id="history-list" style="font-size: 11px; color: var(--nebula-text-secondary, #cccccc);">
                <div class="history-item active" style="padding: 6px; background: var(--nebula-accent, #007acc); color: white; border-radius: 4px; margin-bottom: 2px;">New Document</div>
            </div>
        `;
        
        // Info panel
        const infoPanel = document.createElement('div');
        infoPanel.id = 'info-panel';
        infoPanel.className = 'panel';
        infoPanel.style.display = 'none';
        infoPanel.innerHTML = `
            <h3 style="color: var(--nebula-text, #ffffff); margin: 0 0 15px 0; font-size: 13px;">Document Info</h3>
            <div style="font-size: 11px; color: var(--nebula-text-secondary, #cccccc); line-height: 1.4;">
                <div><strong>Size:</strong> 800 × 600 px</div>
                <div><strong>Resolution:</strong> 72 DPI</div>
                <div><strong>Color Mode:</strong> RGB</div>
                <div><strong>Layers:</strong> <span id="layer-count">1</span></div>
                <div style="margin-top: 15px; padding: 10px; background: var(--nebula-background, #1a1a1a); border-radius: 4px;">
                    <div><strong>🎭 3D Reference:</strong> <span id="3d-status">Loading...</span></div>
                    <div><strong>🎨 Tools:</strong> Active</div>
                    <div><strong>📚 Layers:</strong> Working</div>
                </div>
            </div>
        `;
        
        rightPanelContent.appendChild(layersPanel);
        rightPanelContent.appendChild(historyPanel);
        rightPanelContent.appendChild(infoPanel);
        rightPanel.appendChild(rightPanelContent);
        
        contentArea.appendChild(leftPanel);
        contentArea.appendChild(canvasArea);
        contentArea.appendChild(rightPanel);
        
        return contentArea;
    }

    createStatusBar() {
        const statusBar = document.createElement('div');
        statusBar.className = 'image-editor-status';
        statusBar.style.cssText = `
            height: 24px;
            background: var(--nebula-surface, #2a2a2a);
            border-top: 1px solid var(--nebula-border, #404040);
            display: flex;
            align-items: center;
            padding: 0 10px;
            font-size: 11px;
            color: var(--nebula-text-secondary, #cccccc);
            flex-shrink: 0;
        `;
        
        statusBar.innerHTML = `
            <span id="status-text">Ready - Image Editor with Integrated 3D Reference System</span>
            <div style="flex: 1;"></div>
            <span id="canvas-info">800 × 600 px</span>
        `;
        
        return statusBar;
    }

    initializePanels() {
        // Initialize layer manager
        this.layerManager = new LayerManager();
        
        // Initialize tool manager
        this.toolManager = new ToolManager();
        
        // Initialize selection manager
        this.selectionManager = new SelectionManager();
        
        // Initialize gradient manager
        this.gradientManager = new GradientManager();
        
        // Initialize stylus manager
        this.stylusManager = new StylusManager();
        
        // Set up tool property listeners
        this.setupToolPropertyListeners();
        
        // Set up layer controls
        this.setupLayerControls();
        
        // Set up adjustment controls
        this.setupAdjustmentControls();
        
        // Set up 3D reference controls
        this.setup3DReferenceControls();
    }

    setup3DReferenceControls() {
        // Open 3D modal button
        document.getElementById('open-3d-modal-btn')?.addEventListener('click', () => {
            this.open3DReference();
        });
    }

    setupToolPropertyListeners() {
        // Brush size
        const brushSize = document.getElementById('brush-size');
        const brushSizeValue = document.getElementById('brush-size-value');
        if (brushSize && brushSizeValue) {
            brushSize.addEventListener('input', (e) => {
                brushSizeValue.textContent = e.target.value + 'px';
                this.toolManager.setBrushSize(parseInt(e.target.value));
            });
        }
        
        // Brush opacity
        const brushOpacity = document.getElementById('brush-opacity');
        const brushOpacityValue = document.getElementById('brush-opacity-value');
        if (brushOpacity && brushOpacityValue) {
            brushOpacity.addEventListener('input', (e) => {
                brushOpacityValue.textContent = e.target.value + '%';
                this.toolManager.setBrushOpacity(parseInt(e.target.value) / 100);
            });
        }
        
        // Brush color
        const brushColor = document.getElementById('brush-color');
        if (brushColor) {
            brushColor.addEventListener('change', (e) => {
                this.toolManager.setBrushColor(e.target.value);
            });
        }
    }

    setupLayerControls() {
        // Add layer button
        const addLayerBtn = document.getElementById('add-layer-btn');
        if (addLayerBtn) {
            addLayerBtn.addEventListener('click', () => {
                this.layerManager.addLayer(`Layer ${this.layerManager.layers.length + 1}`);
                this.updateLayersList();
                this.updateLayerCount();
            });
        }
        
        // Layer opacity
        const layerOpacity = document.getElementById('layer-opacity');
        const layerOpacityValue = document.getElementById('layer-opacity-value');
        if (layerOpacity && layerOpacityValue) {
            layerOpacity.addEventListener('input', (e) => {
                layerOpacityValue.textContent = e.target.value + '%';
                this.layerManager.setLayerOpacity(this.layerManager.activeLayerId, parseInt(e.target.value) / 100);
                this.updateLayersList();
            });
        }
        
        // Blend mode
        const blendMode = document.getElementById('blend-mode');
        if (blendMode) {
            blendMode.addEventListener('change', (e) => {
                this.layerManager.setLayerBlendMode(this.layerManager.activeLayerId, e.target.value);
                this.updateLayersList();
            });
        }
    }

    setupAdjustmentControls() {
        // Brightness
        const brightness = document.getElementById('brightness');
        const brightnessValue = document.getElementById('brightness-value');
        if (brightness && brightnessValue) {
            brightness.addEventListener('input', (e) => {
                brightnessValue.textContent = e.target.value;
                this.applyImageAdjustment('brightness', parseInt(e.target.value));
            });
        }
        
        // Contrast
        const contrast = document.getElementById('contrast');
        const contrastValue = document.getElementById('contrast-value');
        if (contrast && contrastValue) {
            contrast.addEventListener('input', (e) => {
                contrastValue.textContent = e.target.value;
                this.applyImageAdjustment('contrast', parseInt(e.target.value));
            });
        }
        
        // Filter buttons
        document.getElementById('grayscale-btn')?.addEventListener('click', () => this.applyFilter('grayscale'));
        document.getElementById('sepia-btn')?.addEventListener('click', () => this.applyFilter('sepia'));
        document.getElementById('invert-btn')?.addEventListener('click', () => this.applyFilter('invert'));
    }

    switchPanelTab(tabId) {
        // Update tab buttons
        document.querySelectorAll('.panel-tab').forEach(tab => {
            tab.classList.remove('active');
            tab.style.background = 'none';
            tab.style.borderBottom = '2px solid transparent';
        });
        
        const activeTab = document.getElementById(tabId);
        if (activeTab) {
            activeTab.classList.add('active');
            activeTab.style.background = 'var(--nebula-surface, #2a2a2a)';
            activeTab.style.borderBottom = '2px solid var(--nebula-accent, #007acc)';
        }
        
        // Update panel content
        document.querySelectorAll('#tools-panel, #adjust-panel').forEach(panel => {
            panel.style.display = 'none';
        });
        
        const targetPanel = tabId.replace('-tab', '-panel');
        const panel = document.getElementById(targetPanel);
        if (panel) {
            panel.style.display = 'block';
        }
    }

    switchRightPanelTab(tabId) {
        // Update tab buttons
        document.querySelectorAll('#layers-tab, #history-tab, #info-tab').forEach(tab => {
            tab.classList.remove('active');
            tab.style.background = 'none';
            tab.style.borderBottom = '2px solid transparent';
        });
        
        const activeTab = document.getElementById(tabId);
        if (activeTab) {
            activeTab.classList.add('active');
            activeTab.style.background = 'var(--nebula-surface, #2a2a2a)';
            activeTab.style.borderBottom = '2px solid var(--nebula-accent, #007acc)';
        }
        
        // Update panel content
        document.querySelectorAll('#layers-panel, #history-panel, #info-panel').forEach(panel => {
            panel.style.display = 'none';
        });
        
        const targetPanel = tabId.replace('-tab', '-panel');
        const panel = document.getElementById(targetPanel);
        if (panel) {
            panel.style.display = 'block';
        }
    }

    updateLayersList() {
        const layersList = document.getElementById('layers-list');
        if (!layersList || !this.layerManager) return;
        
        layersList.innerHTML = '';
        
        // Reverse order to show top layers first
        const layers = [...this.layerManager.layers].reverse();
        
        layers.forEach(layer => {
            const layerItem = document.createElement('div');
            layerItem.className = `layer-item ${layer.id === this.layerManager.activeLayerId ? 'active' : ''}`;
            layerItem.dataset.layerId = layer.id;
            layerItem.style.cssText = `
                display: flex;
                align-items: center;
                padding: 8px;
                border-bottom: 1px solid var(--nebula-border, #404040);
                background: ${layer.id === this.layerManager.activeLayerId ? 'var(--nebula-accent, #007acc)' : 'transparent'};
                cursor: pointer;
            `;
            
            // Special styling for 3D reference layers
            const is3DLayer = layer.metadata && layer.metadata.type === '3d_reference';
            const layerIcon = is3DLayer ? '🎭' : '📄';
            const layerBadge = is3DLayer ? '<span style="background: #28a745; color: white; padding: 1px 4px; border-radius: 2px; font-size: 8px; margin-left: 4px;">3D</span>' : '';
            
            layerItem.innerHTML = `
                <div class="layer-drag-handle" style="width: 16px; color: var(--nebula-text-secondary, #666); cursor: grab; margin-right: 4px; font-size: 12px;">⋮⋮</div>
                <div class="layer-thumbnail" style="width: 24px; height: 24px; background: white; border: 1px solid var(--nebula-border, #404040); margin-right: 8px; border-radius: 2px; display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 12px;">${layerIcon}</span>
                </div>
                <div class="layer-info" style="flex: 1;">
                    <div class="layer-name" style="color: ${layer.id === this.layerManager.activeLayerId ? 'white' : 'var(--nebula-text, #ffffff)'}; font-size: 11px; font-weight: 500;">
                        ${layer.name}${layerBadge}
                    </div>
                    <div class="layer-details" style="color: ${layer.id === this.layerManager.activeLayerId ? 'rgba(255,255,255,0.7)' : 'var(--nebula-text-secondary, #cccccc)'}; font-size: 9px;">${layer.blendMode} • ${Math.round(layer.opacity * 100)}%</div>
                </div>
                <select class="blend-mode" data-layer-id="${layer.id}" style="background: var(--nebula-surface, #2a2a2a); color: var(--nebula-text, #fff); border: 1px solid var(--nebula-border, #404040); border-radius: 2px; font-size: 9px; margin-right: 4px;">
                    <option value="normal" ${layer.blendMode === 'normal' ? 'selected' : ''}>Normal</option>
                    <option value="multiply" ${layer.blendMode === 'multiply' ? 'selected' : ''}>Multiply</option>
                    <option value="overlay" ${layer.blendMode === 'overlay' ? 'selected' : ''}>Overlay</option>
                    <option value="screen" ${layer.blendMode === 'screen' ? 'selected' : ''}>Screen</option>
                    <option value="soft-light" ${layer.blendMode === 'soft-light' ? 'selected' : ''}>Soft Light</option>
                </select>
                <button class="layer-visibility" data-layer-id="${layer.id}" style="background: none; border: none; color: ${layer.id === this.layerManager.activeLayerId ? 'white' : 'var(--nebula-text, #ffffff)'}; cursor: pointer;">
                    <span style="font-size: 14px;">${layer.visible ? '👁️' : '🙈'}</span>
                </button>
            `;
            
            // Make layer draggable
            layerItem.draggable = true;
            layerItem.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', layer.id);
                layerItem.style.opacity = '0.5';
            });
            
            layerItem.addEventListener('dragend', () => {
                layerItem.style.opacity = '1';
            });
            
            layerItem.addEventListener('dragover', (e) => {
                e.preventDefault();
                layerItem.style.borderTop = '2px solid var(--nebula-accent, #007acc)';
            });
            
            layerItem.addEventListener('dragleave', () => {
                layerItem.style.borderTop = 'none';
            });
            
            layerItem.addEventListener('drop', (e) => {
                e.preventDefault();
                layerItem.style.borderTop = 'none';
                const draggedId = e.dataTransfer.getData('text/plain');
                const targetId = layer.id;
                
                if (draggedId !== targetId && this.layerManager) {
                    this.layerManager.reorderLayer(draggedId, targetId);
                    this.updateLayersList();
                }
            });
            
            // Layer click to select
            layerItem.addEventListener('click', (e) => {
                if (!e.target.closest('.layer-visibility')) {
                    this.layerManager.selectLayer(layer.id);
                    this.updateLayersList();
                }
            });
            
            // Visibility toggle - FIXED VERSION
            const visibilityBtn = layerItem.querySelector('.layer-visibility');
            visibilityBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const layerId = e.currentTarget.dataset.layerId;
                this.layerManager.toggleLayerVisibility(layerId);
                this.updateLayersList();
                console.log(`Toggled visibility for layer ${layerId}`);
            });
            
            layersList.appendChild(layerItem);
        });
    }

    updateLayerCount() {
        const layerCount = document.getElementById('layer-count');
        if (layerCount && this.layerManager) {
            layerCount.textContent = this.layerManager.layers.length;
        }
    }

    updateAllPanels() {
        this.updateLayersList();
        this.updateLayerCount();
        
        // Update 3D status
        const status3D = document.getElementById('3d-status');
        if (status3D) {
            status3D.textContent = this.threejsModal ? 'Ready' : 'Loading...';
        }
    }

    // Tool methods
    setTool(tool) {
        this.currentTool = tool;
        
        // Update tool button states
        document.querySelectorAll('#brush-btn, #pencil-btn, #eraser-btn, #select-btn, #move-btn, #text-btn, #gradient-btn').forEach(btn => {
            btn.style.background = 'none';
        });
        
        const activeBtn = document.getElementById(`${tool}-btn`);
        if (activeBtn) {
            activeBtn.style.background = 'var(--nebula-accent, #007acc)';
        }
        
        // Update cursor
        const canvas = document.getElementById('main-canvas');
        if (canvas) {
            switch (tool) {
                case 'brush':
                case 'pencil':
                    canvas.style.cursor = 'crosshair';
                    break;
                case 'eraser':
                    canvas.style.cursor = 'grab';
                    break;
                case 'select':
                    canvas.style.cursor = 'crosshair';
                    break;
                case 'move':
                    canvas.style.cursor = 'move';
                    break;
                case 'text':
                    canvas.style.cursor = 'text';
                    break;
                case 'gradient':
                    canvas.style.cursor = 'crosshair';
                    break;
                default:
                    canvas.style.cursor = 'default';
            }
        }
        
        // Update status bar
        const statusText = document.getElementById('status-text');
        if (statusText) {
            statusText.textContent = `${tool.charAt(0).toUpperCase() + tool.slice(1)} tool selected - 3D Reference Available`;
        }
    }

    // Canvas event handlers
    handleCanvasMouseDown(e) {
        if (!this.layerManager) return;
        
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.isDrawing = true;
        this.lastPoint = { x, y };
        this.currentPath = [{ x, y }];
        
        // Save state for undo
        this.saveState();
        
        switch (this.currentTool) {
            case 'brush':
            case 'pencil':
                this.startDrawing(x, y);
                break;
            case 'eraser':
                this.startErasing(x, y);
                break;
            case 'select':
                this.selectionManager?.startSelection(x, y);
                break;
            case 'gradient':
                this.gradientManager?.startGradient(x, y);
                break;
        }
    }

    handleCanvasMouseMove(e) {
        if (!this.isDrawing || !this.layerManager) return;
        
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.currentPath.push({ x, y });
        
        switch (this.currentTool) {
            case 'brush':
            case 'pencil':
                this.continuDrawing(x, y);
                break;
            case 'eraser':
                this.continueErasing(x, y);
                break;
            case 'select':
                this.selectionManager?.updateSelection(x, y);
                break;
            case 'gradient':
                this.gradientManager?.updateGradient(x, y);
                break;
        }
        
        this.lastPoint = { x, y };
    }

    handleCanvasMouseUp(e) {
        if (!this.isDrawing) return;
        
        this.isDrawing = false;
        
        switch (this.currentTool) {
            case 'brush':
            case 'pencil':
                this.finishDrawing();
                break;
            case 'eraser':
                this.finishErasing();
                break;
            case 'select':
                this.selectionManager?.finishSelection();
                break;
            case 'gradient':
                this.gradientManager?.finishGradient();
                break;
        }
        
        this.currentPath = [];
        this.lastPoint = null;
    }

    // Drawing methods
    startDrawing(x, y) {
        const activeLayer = this.layerManager.getActiveLayer();
        if (!activeLayer) return;
        
        const ctx = activeLayer.canvas.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(x, y);
        
        // Apply tool settings
        ctx.strokeStyle = this.toolManager.brushColor;
        ctx.lineWidth = this.toolManager.brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = this.toolManager.brushOpacity;
        
        if (this.currentTool === 'pencil') {
            ctx.lineCap = 'square';
            ctx.lineJoin = 'miter';
        }
    }

    continuDrawing(x, y) {
        const activeLayer = this.layerManager.getActiveLayer();
        if (!activeLayer || !this.lastPoint) return;
        
        const ctx = activeLayer.canvas.getContext('2d');
        
        // Use stylus stabilization if available
        const stabilizedPoint = this.stylusManager?.stabilizePoint({ x, y }, this.currentPath) || { x, y };
        
        ctx.lineTo(stabilizedPoint.x, stabilizedPoint.y);
        ctx.stroke();
        
        // Update main canvas
        this.layerManager.updateMainCanvas();
    }

    finishDrawing() {
        const activeLayer = this.layerManager.getActiveLayer();
        if (!activeLayer) return;
        
        const ctx = activeLayer.canvas.getContext('2d');
        ctx.closePath();
        
        // Update main canvas
        this.layerManager.updateMainCanvas();
        
        // Add to history
        this.addToHistory(`${this.currentTool} stroke`);
    }

    startErasing(x, y) {
        const activeLayer = this.layerManager.getActiveLayer();
        if (!activeLayer) return;
        
        const ctx = activeLayer.canvas.getContext('2d');
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineWidth = this.toolManager.brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }

    continueErasing(x, y) {
        const activeLayer = this.layerManager.getActiveLayer();
        if (!activeLayer) return;
        
        const ctx = activeLayer.canvas.getContext('2d');
        ctx.lineTo(x, y);
        ctx.stroke();
        
        // Update main canvas
        this.layerManager.updateMainCanvas();
    }

    finishErasing() {
        const activeLayer = this.layerManager.getActiveLayer();
        if (!activeLayer) return;
        
        const ctx = activeLayer.canvas.getContext('2d');
        ctx.globalCompositeOperation = 'source-over';
        ctx.closePath();
        
        // Update main canvas
        this.layerManager.updateMainCanvas();
        
        // Add to history
        this.addToHistory('Erase');
    }

    // Touch event handlers for mobile/tablet support
    handleCanvasTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.handleCanvasMouseDown(mouseEvent);
    }

    handleCanvasTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.handleCanvasMouseMove(mouseEvent);
    }

    handleCanvasTouchEnd(e) {
        e.preventDefault();
        const mouseEvent = new MouseEvent('mouseup', {});
        this.handleCanvasMouseUp(mouseEvent);
    }

    handleCanvasWheel(e) {
        e.preventDefault();
        
        if (e.ctrlKey) {
            // Zoom
            if (e.deltaY < 0) {
                this.zoomIn();
            } else {
                this.zoomOut();
            }
        }
    }

    // Keyboard shortcuts
    handleKeyboard(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 'n':
                    e.preventDefault();
                    this.newProject();
                    break;
                case 'o':
                    e.preventDefault();
                    this.openProject();
                    break;
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
            }
        } else {
            switch (e.key.toLowerCase()) {
                case 'b':
                    this.setTool('brush');
                    break;
                case 'p':
                    this.setTool('pencil');
                    break;
                case 'e':
                    this.setTool('eraser');
                    break;
                case 'm':
                    this.setTool('select');
                    break;
                case 'v':
                    this.setTool('move');
                    break;
                case 't':
                    this.setTool('text');
                    break;
                case 'g':
                    this.setTool('gradient');
                    break;
                case 'r':
                    this.open3DReference();
                    break;
            }
        }
    }

    // Project methods
    newProject() {
        if (confirm('Create a new project? Unsaved changes will be lost.')) {
            this.layerManager?.clear();
            this.clearUndoHistory();
            this.loadInitialData();
            this.updateAllPanels();
            this.addToHistory('New Document');
            this.showNotification('New project created', 'success');
        }
    }

    openProject() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,.psd,.xcf';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.loadImageFile(file);
            }
        };
        input.click();
    }

    saveProject() {
        if (!this.layerManager) return;
        
        const canvas = this.layerManager.mainCanvas;
        if (!canvas) {
            this.showNotification('No canvas to save', 'error');
            return;
        }
        
        const link = document.createElement('a');
        link.download = 'image-editor-project.png';
        link.href = canvas.toDataURL();
        link.click();
        
        this.addToHistory('Save Project');
        this.showNotification('Project saved successfully!', 'success');
    }

    loadImageFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Create new layer with the image
                const layer = this.layerManager.addLayer(file.name);
                const ctx = layer.canvas.getContext('2d');
                
                // Resize canvas to fit image
                layer.canvas.width = img.width;
                layer.canvas.height = img.height;
                
                // Also resize main canvas
                if (this.layerManager.mainCanvas) {
                    this.layerManager.mainCanvas.width = img.width;
                    this.layerManager.mainCanvas.height = img.height;
                }
                
                // Draw image
                ctx.drawImage(img, 0, 0);
                
                // Update main canvas
                this.layerManager.updateMainCanvas();
                this.updateAllPanels();
                this.addToHistory(`Open ${file.name}`);
                this.showNotification(`Loaded ${file.name}`, 'success');
            };
            img.onerror = () => {
                this.showNotification('Failed to load image file', 'error');
            };
            img.src = e.target.result;
        };
        reader.onerror = () => {
            this.showNotification('Failed to read file', 'error');
        };
        reader.readAsDataURL(file);
    }

    // Zoom methods
    zoomIn() {
        console.log('Zoom in');
        this.showNotification('Zoom In', 'info');
    }

    zoomOut() {
        console.log('Zoom out');
        this.showNotification('Zoom Out', 'info');
    }

    zoomToFit() {
        console.log('Zoom to fit');
        this.showNotification('Zoom to Fit', 'info');
    }

    // Filter and adjustment methods
    applyImageAdjustment(type, value) {
        const activeLayer = this.layerManager?.getActiveLayer();
        if (!activeLayer) return;
        
        // Apply adjustment to active layer
        const canvas = activeLayer.canvas;
        const ctx = canvas.getContext('2d');
        
        switch (type) {
            case 'brightness':
                ctx.filter = `brightness(${100 + value}%)`;
                break;
            case 'contrast':
                ctx.filter = `contrast(${100 + value}%)`;
                break;
        }
        
        this.layerManager.updateMainCanvas();
    }

    applyFilter(filterType) {
        const activeLayer = this.layerManager?.getActiveLayer();
        if (!activeLayer) return;
        
        const canvas = activeLayer.canvas;
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        switch (filterType) {
            case 'grayscale':
                for (let i = 0; i < data.length; i += 4) {
                    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
                    data[i] = gray;
                    data[i + 1] = gray;
                    data[i + 2] = gray;
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
                    data[i] = 255 - data[i];
                    data[i + 1] = 255 - data[i + 1];
                    data[i + 2] = 255 - data[i + 2];
                }
                break;
        }
        
        ctx.putImageData(imageData, 0, 0);
        this.layerManager.updateMainCanvas();
        this.addToHistory(`Apply ${filterType}`);
        this.showNotification(`Applied ${filterType} filter`, 'success');
    }

    // Undo/Redo system
    saveState() {
        if (!this.layerManager) return;
        
        const state = this.layerManager.getState();
        this.undoStack.push(state);
        
        if (this.undoStack.length > this.maxUndoSteps) {
            this.undoStack.shift();
        }
        
        this.redoStack = [];
    }

    undo() {
        if (this.undoStack.length === 0) {
            this.showNotification('Nothing to undo', 'info');
            return;
        }
        
        const currentState = this.layerManager.getState();
        this.redoStack.push(currentState);
        
        const previousState = this.undoStack.pop();
        this.layerManager.setState(previousState);
        
        this.updateAllPanels();
        this.addToHistory('Undo');
    }

    redo() {
        if (this.redoStack.length === 0) {
            this.showNotification('Nothing to redo', 'info');
            return;
        }
        
        const currentState = this.layerManager.getState();
        this.undoStack.push(currentState);
        
        const nextState = this.redoStack.pop();
        this.layerManager.setState(nextState);
        
        this.updateAllPanels();
        this.addToHistory('Redo');
    }

    clearUndoHistory() {
        this.undoStack = [];
        this.redoStack = [];
    }

    addToHistory(action) {
        const historyList = document.getElementById('history-list');
        if (!historyList) return;
        
        // Remove active class from all items
        historyList.querySelectorAll('.history-item').forEach(item => {
            item.classList.remove('active');
            item.style.background = 'transparent';
            item.style.color = 'var(--nebula-text-secondary, #cccccc)';
        });
        
        // Add new history item
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item active';
        historyItem.style.cssText = `
            padding: 6px;
            background: var(--nebula-accent, #007acc);
            color: white;
            border-radius: 4px;
            margin-bottom: 2px;
        `;
        historyItem.textContent = action;
        
        historyList.appendChild(historyItem);
        
        // Scroll to bottom
        historyList.scrollTop = historyList.scrollHeight;
    }

    loadInitialData() {
        // Initialize with a default layer
        if (this.layerManager) {
            this.layerManager.addLayer('Background');
            this.updateAllPanels();
        }
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'app-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : 'var(--nebula-accent, #007acc)'};
            color: white;
            padding: 12px 16px;
            border-radius: 4px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 10003;
            font-size: 13px;
            max-width: 300px;
            word-wrap: break-word;
            animation: slideInRight 0.3s ease-out;
        `;
        
        notification.textContent = message;
        
        // Add animation keyframes if not already added
        if (!document.querySelector('#app-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'app-notification-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    cleanup() {
        // Clean up resources when the app is closed
        if (this.threejsModal) {
            this.threejsModal.hide();
        }
        
        // Remove event listeners
        document.removeEventListener('keydown', this.handleKeyboard);
        
        // Clean up other resources
        this.eventManager?.removeAllListeners();
    }
}

// Supporting classes

class EventManager {
    constructor() {
        this.listeners = {};
    }
    
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }
    
    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }
    
    removeAllListeners() {
        this.listeners = {};
    }
}

class LayerManager {
    constructor() {
        this.layers = [];
        this.activeLayerId = null;
        this.mainCanvas = null;
        this.nextId = 1;
    }
    
    setMainCanvas(canvas) {
        this.mainCanvas = canvas;
    }
    
    addLayer(name) {
        const layer = {
            id: `layer_${this.nextId++}`,
            name: name,
            canvas: document.createElement('canvas'),
            visible: true,
            opacity: 1,
            blendMode: 'normal',
            metadata: null
        };
        
        // Set canvas size to match main canvas
        if (this.mainCanvas) {
            layer.canvas.width = this.mainCanvas.width;
            layer.canvas.height = this.mainCanvas.height;
        } else {
            layer.canvas.width = 800;
            layer.canvas.height = 600;
        }
        
        this.layers.push(layer);
        this.activeLayerId = layer.id;
        
        return layer;
    }
    
    getActiveLayer() {
        return this.layers.find(layer => layer.id === this.activeLayerId);
    }
    
    selectLayer(layerId) {
        this.activeLayerId = layerId;
    }
    
    toggleLayerVisibility(layerId) {
        const layer = this.layers.find(l => l.id === layerId);
        if (layer) {
            layer.visible = !layer.visible;
            this.updateMainCanvas();
            console.log(`Toggled visibility for layer ${layerId}`);
        }
    }
    
    setLayerOpacity(layerId, opacity) {
        const layer = this.layers.find(l => l.id === layerId);
        if (layer) {
            layer.opacity = opacity;
            this.updateMainCanvas();
        }
    }
    
    setLayerBlendMode(layerId, blendMode) {
        const layer = this.layers.find(l => l.id === layerId);
        if (layer) {
            layer.blendMode = blendMode;
            this.updateMainCanvas();
        }
    }
    
    updateMainCanvas() {
        if (!this.mainCanvas) return;
        
        const ctx = this.mainCanvas.getContext('2d');
        ctx.clearRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);
        
        // Composite all visible layers
        this.layers.forEach(layer => {
            if (layer.visible) {
                ctx.globalAlpha = layer.opacity;
                ctx.globalCompositeOperation = layer.blendMode;
                ctx.drawImage(layer.canvas, 0, 0);
            }
        });
        
        // Reset composite operation
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
    }
    
    clear() {
        this.layers = [];
        this.activeLayerId = null;
        this.nextId = 1;
        
        if (this.mainCanvas) {
            const ctx = this.mainCanvas.getContext('2d');
            ctx.clearRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);
        }
    }
    
    getState() {
        // Return serializable state for undo/redo
        return {
            layers: this.layers.map(layer => ({
                ...layer,
                imageData: layer.canvas.toDataURL()
            })),
            activeLayerId: this.activeLayerId
        };
    }
    
    setState(state) {
        // Restore state from undo/redo
        this.layers = [];
        this.activeLayerId = state.activeLayerId;
        
        let loadedCount = 0;
        const totalLayers = state.layers.length;
        
        state.layers.forEach(layerData => {
            const layer = {
                id: layerData.id,
                name: layerData.name,
                canvas: document.createElement('canvas'),
                visible: layerData.visible,
                opacity: layerData.opacity,
                blendMode: layerData.blendMode,
                metadata: layerData.metadata
            };
            
            // Restore canvas content
            const img = new Image();
            img.onload = () => {
                layer.canvas.width = img.width;
                layer.canvas.height = img.height;
                const ctx = layer.canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                
                loadedCount++;
                if (loadedCount === totalLayers) {
                    this.updateMainCanvas();
                }
            };
            img.src = layerData.imageData;
            
            this.layers.push(layer);
        });
    }
}

class ToolManager {
    constructor() {
        this.brushSize = 10;
        this.brushOpacity = 1;
        this.brushColor = '#ffffff';
        this.brushHardness = 1;
        this.brushSpacing = 1;
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
}

class SelectionManager {
    constructor() {
        this.selection = null;
        this.isSelecting = false;
    }
    
    startSelection(x, y) {
        this.isSelecting = true;
        this.selection = { startX: x, startY: y, endX: x, endY: y };
    }
    
    updateSelection(x, y) {
        if (this.selection) {
            this.selection.endX = x;
            this.selection.endY = y;
        }
    }
    
    finishSelection() {
        this.isSelecting = false;
    }
}

class GradientManager {
    constructor() {
        this.gradient = null;
        this.isCreating = false;
    }
    
    startGradient(x, y) {
        this.isCreating = true;
        this.gradient = { startX: x, startY: y, endX: x, endY: y };
    }
    
    updateGradient(x, y) {
        if (this.gradient) {
            this.gradient.endX = x;
            this.gradient.endY = y;
        }
    }
    
    finishGradient() {
        this.isCreating = false;
    }
}

class StylusManager {
    constructor() {
        this.stabilizationLevel = 5;
        this.pressureSensitivity = true;
    }
    
    stabilizePoint(point, path) {
        if (path.length < this.stabilizationLevel) {
            return point;
        }
        
        // Simple stabilization algorithm
        const recentPoints = path.slice(-this.stabilizationLevel);
        const avgX = recentPoints.reduce((sum, p) => sum + p.x, 0) / recentPoints.length;
        const avgY = recentPoints.reduce((sum, p) => sum + p.y, 0) / recentPoints.length;
        
        return {
            x: (point.x + avgX) / 2,
            y: (point.y + avgY) / 2
        };
    }
}

// Integrated Three.js 3D Modal System
class IntegratedThreeJSModal {
    constructor(eventManager, layerManager) {
        this.eventManager = eventManager;
        this.layerManager = layerManager;
        this.modal = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.mannequin = null;
        this.isVisible = false;
        this.poseLibrary = {};
        
        this.createModal();
        this.loadThreeJS();
    }
    
    loadThreeJS() {
        // Load Three.js and mannequin.js if not already loaded
        if (!window.THREE) {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
            script.onload = () => {
                this.loadOrbitControls();
            };
            document.head.appendChild(script);
        } else {
            this.loadOrbitControls();
        }
    }
    
    loadOrbitControls() {
        if (!window.THREE.OrbitControls) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js';
            script.onload = () => {
                this.loadGLTFLoader();
            };
            document.head.appendChild(script);
        } else {
            this.loadGLTFLoader();
        }
    }
    
    loadGLTFLoader() {
        if (!window.THREE.GLTFLoader) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js';
            script.onload = () => {
                this.loadMannequinJS();
            };
            document.head.appendChild(script);
        } else {
            this.loadMannequinJS();
        }
    }
    
    loadMannequinJS() {
        if (!window.Mannequin) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/mannequin-js@5.2.3/src/mannequin.min.js';
            script.onload = () => {
                this.initializeThreeJS();
            };
            document.head.appendChild(script);
        } else {
            this.initializeThreeJS();
        }
    }
    
    createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'threejs-modal';
        this.modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10000;
            display: none;
            justify-content: center;
            align-items: center;
            padding: 20px;
            box-sizing: border-box;
        `;
        
        const modalContent = document.createElement('div');
        modalContent.className = 'threejs-modal-content';
        modalContent.style.cssText = `
            background: var(--nebula-surface, #2a2a2a);
            border-radius: 8px;
            width: 90%;
            max-width: 1400px; /* Increased width for more controls */
            height: 85%;
            display: flex;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        `;
        
        // Left panel for controls
        const leftPanel = document.createElement('div');
        leftPanel.className = 'threejs-left-panel';
        leftPanel.style.cssText = `
            width: 320px;
            background: var(--nebula-background, #1a1a1a);
            padding: 20px;
            overflow-y: auto;
            border-right: 1px solid var(--nebula-border, #404040);
        `;
        
        leftPanel.innerHTML = `
            <div class="modal-header" style="margin-bottom: 20px;">
                <h2 style="color: var(--nebula-text, #ffffff); margin: 0 0 10px 0; font-size: 18px;">🎭 3D Mannequin Studio</h2>
                <p style="color: var(--nebula-text-secondary, #cccccc); font-size: 12px; margin: 0; line-height: 1.4;">
                    Pose 3D mannequins and capture them as reference layers for your artwork.
                </p>
            </div>
            
            <div class="control-section" style="margin-bottom: 25px;">
                <h3 style="color: var(--nebula-text, #ffffff); margin: 0 0 15px 0; font-size: 14px;">Mannequin Type</h3>
                <div class="mannequin-buttons" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px;">
                    <button id="load-male-btn" style="
                        background: var(--nebula-accent, #007acc);
                        color: white;
                        border: none;
                        padding: 10px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 11px;
                    ">👨 Male</button>
                    <button id="load-female-btn" style="
                        background: var(--nebula-accent, #007acc);
                        color: white;
                        border: none;
                        padding: 10px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 11px;
                    ">👩 Female</button>
                </div>
                <div class="anime-mannequin-buttons" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    <button id="load-anime-male-btn" style="
                        background: #FF6B35;
                        color: white;
                        border: none;
                        padding: 10px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 11px;
                    ">🧑‍🎨 Anime Male</button>
                    <button id="load-anime-female-btn" style="
                        background: #FF6B35;
                        color: white;
                        border: none;
                        padding: 10px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 11px;
                    ">👩‍🎨 Anime Female</button>
                </div>
            </div>
            
            <div class="control-section" style="margin-bottom: 25px;">
                <h3 style="color: var(--nebula-text, #ffffff); margin: 0 0 15px 0; font-size: 14px;">Pose Library</h3>
                <div class="pose-library-controls" style="display: flex; gap: 8px; margin-bottom: 10px;">
                    <select id="pose-library-select" style="flex: 1; padding: 8px; background: var(--nebula-surface, #2a2a2a); color: var(--nebula-text, #ffffff); border: 1px solid var(--nebula-border, #404040); border-radius: 4px;"></select>
                    <button id="load-pose-btn" style="background: var(--nebula-accent, #007acc); color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer;">Load</button>
                </div>
                <div class="pose-library-actions" style="display: flex; gap: 8px;">
                    <input type="text" id="save-pose-name" placeholder="Pose Name" style="flex: 1; padding: 8px; background: var(--nebula-surface, #2a2a2a); color: var(--nebula-text, #ffffff); border: 1px solid var(--nebula-border, #404040); border-radius: 4px;">
                    <button id="save-pose-btn" style="background: #28a745; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer;">Save</button>
                </div>
            </div>
            
            <div class="control-section" style="margin-bottom: 25px;">
                <h3 style="color: var(--nebula-text, #ffffff); margin: 0 0 15px 0; font-size: 14px;">Manual Posing</h3>
                <div id="manual-posing-controls" style="max-height: 200px; overflow-y: auto; padding-right: 10px;">
                    <!-- Manual posing controls will be populated here -->
                </div>
            </div>
            
            <div class="control-section" style="margin-bottom: 25px;">
                <h3 style="color: var(--nebula-text, #ffffff); margin: 0 0 15px 0; font-size: 14px;">Animation Controls</h3>
                <div class="animation-controls" style="margin-bottom: 15px;">
                    <label style="display: flex; align-items: center; color: var(--nebula-text, #ffffff); font-size: 11px; margin-bottom: 8px;">
                        <input type="checkbox" id="animation-toggle" checked style="margin-right: 8px;">
                        Enable Animation
                    </label>
                    <div id="animation-list" style="display: flex; flex-wrap: wrap; gap: 4px;">
                        <!-- Animation buttons will be populated here -->
                    </div>
                </div>
            </div>
            
            <div class="control-section" style="margin-bottom: 25px;">
                <h3 style="color: var(--nebula-text, #ffffff); margin: 0 0 15px 0; font-size: 14px;">Scene Controls</h3>
                <div class="scene-buttons" style="display: flex; flex-direction: column; gap: 8px;">
                    <button id="reset-camera-btn" style="
                        background: var(--nebula-surface, #2a2a2a);
                        color: var(--nebula-text, #ffffff);
                        border: 1px solid var(--nebula-border, #404040);
                        padding: 10px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 11px;
                    ">📷 Reset Camera</button>
                    <button id="capture-scene-btn" style="
                        background: #28a745;
                        color: white;
                        border: none;
                        padding: 12px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                        font-weight: 500;
                    ">📸 Capture as Layer</button>
                </div>
            </div>
            
            <div class="control-section" style="margin-top: 25px; border-top: 1px solid var(--nebula-border, #404040); padding-top: 20px;">
                <h3 style="color: var(--nebula-text, #ffffff); margin: 0 0 15px 0; font-size: 14px;">External References</h3>
                <button id="open-posemyart-btn" style="
                    background: #FF6B35;
                    color: white;
                    border: none;
                    padding: 10px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 11px;
                    width: 100%;
                    margin-bottom: 8px;
                ">🎭 Open PoseMy.Art Studio</button>
                <button id="open-mannequin-discovery-btn" style="
                    background: var(--nebula-accent, #007acc);
                    color: white;
                    border: none;
                    padding: 10px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 11px;
                    width: 100%;
                    margin-bottom: 8px;
                ">🌐 Discover More Mannequins</button>
            </div>
        `;
        
        // Right panel for 3D viewport
        const rightPanel = document.createElement('div');
        rightPanel.className = 'threejs-right-panel';
        rightPanel.style.cssText = `
            flex: 1;
            position: relative;
            background: #333;
        `;
        
        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-modal-btn';
        closeBtn.style.cssText = `
            position: absolute;
            top: 15px;
            right: 15px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            border: none;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 18px;
            z-index: 1;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        closeBtn.innerHTML = '×';
        closeBtn.addEventListener('click', () => this.hide());
        
        // 3D Canvas container
        const canvasContainer = document.createElement('div');
        canvasContainer.id = 'threejs-canvas-container';
        canvasContainer.style.cssText = `
            width: 100%;
            height: 100%;
            position: relative;
        `;
        
        rightPanel.appendChild(closeBtn);
        rightPanel.appendChild(canvasContainer);
        
        modalContent.appendChild(leftPanel);
        modalContent.appendChild(rightPanel);
        this.modal.appendChild(modalContent);
        document.body.appendChild(this.modal);
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Close modal when clicking outside
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hide();
            }
        });
        
        // Mannequin type buttons
        document.getElementById('load-male-btn')?.addEventListener('click', () => {
            this.loadMannequin('male');
        });
        
        document.getElementById('load-female-btn')?.addEventListener('click', () => {
            this.loadMannequin('female');
        });
        
        // Anime mannequin buttons
        document.getElementById('load-anime-male-btn')?.addEventListener('click', () => {
            this.loadMannequin('anime-male');
        });
        
        document.getElementById('load-anime-female-btn')?.addEventListener('click', () => {
            this.loadMannequin('anime-female');
        });
        
        // Pose library controls
        document.getElementById('load-pose-btn')?.addEventListener('click', () => {
            const select = document.getElementById('pose-library-select');
            if (select.value) {
                this.applyPose(select.value);
            }
        });
        
        document.getElementById('save-pose-btn')?.addEventListener('click', () => {
            const nameInput = document.getElementById('save-pose-name');
            if (nameInput.value) {
                this.savePose(nameInput.value);
                nameInput.value = '';
            }
        });
        
        // Scene control buttons
        document.getElementById('reset-camera-btn')?.addEventListener('click', () => {
            this.resetCamera();
        });
        
        document.getElementById('capture-scene-btn')?.addEventListener('click', () => {
            this.captureScene();
        });
        
        // Animation control
        document.getElementById('animation-toggle')?.addEventListener('change', (e) => {
            this.toggleAnimation(e.target.checked);
        });
        
        // External reference buttons
        document.getElementById('open-posemyart-btn')?.addEventListener('click', () => {
            this.openPoseMyArt();
        });
        
        document.getElementById('open-mannequin-discovery-btn')?.addEventListener('click', () => {
            this.openMannequinDiscovery();
        });
    }
    
    initializeThreeJS() {
        if (!window.THREE) {
            console.error('Three.js not loaded');
            return;
        }
        
        const container = document.getElementById('threejs-canvas-container');
        if (!container) return;
        
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x333333);
        
        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            75,
            container.clientWidth / container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 1, 3);
        
        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(this.renderer.domElement);
        
        // Controls setup
        if (window.THREE.OrbitControls) {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
        }
        
        // Lighting setup
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
        
        // Ground plane
        const groundGeometry = new THREE.PlaneGeometry(10, 10);
        const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Start render loop
        this.animate();
        
        console.log('Three.js 3D system initialized successfully');
    }
    
    loadMannequin(type) {
        // Remove existing mannequin
        if (this.mannequin) {
            this.scene.remove(this.mannequin);
            this.mannequin = null;
            this.mixer = null;
        }
        
        // Load real GLTF models
        this.loadGLTFMannequin(type);
    }
    
    loadGLTFMannequin(type) {
        if (!window.THREE || !window.THREE.GLTFLoader) {
            console.error('GLTFLoader not available, falling back to basic models');
            this.createEnhancedMannequin(type);
            return;
        }
        
        const loader = new THREE.GLTFLoader();
        
        // Model URLs - try CDN first, then local fallback
        const modelUrls = {
            'male': [
                'https://threejs.org/examples/models/gltf/Soldier.glb',
                './models/Soldier.glb'
            ],
            'female': [
                'https://threejs.org/examples/models/gltf/Xbot.glb', // Clean humanoid model
                './models/Xbot.glb'
            ],
            'anime-male': [
                'https://threejs.org/examples/models/gltf/Xbot.glb', // Clean model for anime styling
                './models/Xbot.glb'
            ],
            'anime-female': [
                'https://threejs.org/examples/models/gltf/Xbot.glb', // Clean model for anime styling
                './models/Xbot.glb'
            ]
        };
        
        const urls = modelUrls[type] || modelUrls['male'];
        
        // Try loading with fallback
        this.loadModelWithFallback(loader, urls, 0, type);
    }
    
    loadModelWithFallback(loader, urls, index, type) {
        if (index >= urls.length) {
            console.warn('All model URLs failed, using enhanced geometric fallback');
            this.createEnhancedMannequin(type);
            return;
        }
        
        const url = urls[index];
        console.log(`Attempting to load model from: ${url}`);
        
        loader.load(
            url,
            (gltf) => {
                console.log(`Successfully loaded model from: ${url}`);
                this.setupGLTFModel(gltf, type);
            },
            (progress) => {
                console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
            },
            (error) => {
                console.warn(`Failed to load from ${url}:`, error);
                // Try next URL
                this.loadModelWithFallback(loader, urls, index + 1, type);
            }
        );
    }
    
    setupGLTFModel(gltf, type) {
        const model = gltf.scene;
        
        // Scale and position the model
        model.scale.setScalar(1);
        model.position.set(0, 0, 0);
        
        // Enable shadows
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                
                // Apply type-specific materials
                this.applyModelStyling(child, type);
            }
        });
        
        // Set up animation mixer if animations exist
        if (gltf.animations && gltf.animations.length > 0) {
            this.mixer = new THREE.AnimationMixer(model);
            this.animations = gltf.animations;
            this.animationEnabled = true;
            
            // Store animation actions
            this.animationActions = {};
            gltf.animations.forEach((clip) => {
                const action = this.mixer.clipAction(clip);
                this.animationActions[clip.name] = action;
            });
            
            // Start with idle animation if available
            const idleAction = this.animationActions['idle'] || this.animationActions['Idle'] || Object.values(this.animationActions)[0];
            if (idleAction) {
                idleAction.play();
                this.currentAction = idleAction;
            }
            
            this.populateAnimationList();
            console.log('Available animations:', Object.keys(this.animationActions));
        }
        
        // Store references
        this.mannequin = model;
        this.scene.add(model);
        
        // Update UI
        this.populateManualPosingControls();
        this.loadPoseLibrary();
        
        console.log(`Successfully loaded ${type} GLTF mannequin with realistic anatomy`);
    }
    
    applyModelStyling(mesh, type) {
        // Create materials based on type
        const materials = {
            'male': {
                skin: new THREE.MeshLambertMaterial({ color: 0xFFDBB5 }),
                clothes: new THREE.MeshLambertMaterial({ color: 0x4169E1 })
            },
            'female': {
                skin: new THREE.MeshLambertMaterial({ color: 0xFFE4C4 }),
                clothes: new THREE.MeshLambertMaterial({ color: 0xFF69B4 })
            },
            'anime-male': {
                skin: new THREE.MeshLambertMaterial({ color: 0xFFE4E1 }),
                clothes: new THREE.MeshLambertMaterial({ color: 0x32CD32 })
            },
            'anime-female': {
                skin: new THREE.MeshLambertMaterial({ color: 0xFFF0F5 }),
                clothes: new THREE.MeshLambertMaterial({ color: 0x9370DB })
            }
        };
        
        const typeColors = materials[type] || materials['male'];
        
        // Apply styling based on mesh name or material
        if (mesh.material) {
            const materialName = mesh.material.name ? mesh.material.name.toLowerCase() : '';
            
            if (materialName.includes('skin') || materialName.includes('body') || materialName.includes('head')) {
                mesh.material = typeColors.skin.clone();
            } else if (materialName.includes('cloth') || materialName.includes('uniform')) {
                mesh.material = typeColors.clothes.clone();
            } else {
                // Default to a neutral color for unknown materials
                mesh.material = new THREE.MeshLambertMaterial({ color: 0x888888 });
            }
        }
    }
    
    createEnhancedMannequin(type) {
        // Create realistic human proportions instead of stick figures
        const group = new THREE.Group();
        
        // Color schemes for different types
        const colors = {
            'male': { skin: 0xFFDBB5, hair: 0x8B4513, clothes: 0x4169E1 },
            'female': { skin: 0xFFE4C4, hair: 0xDEB887, clothes: 0xFF69B4 },
            'anime-male': { skin: 0xFFE4E1, hair: 0x000080, clothes: 0x32CD32 },
            'anime-female': { skin: 0xFFF0F5, hair: 0xFF1493, clothes: 0x9370DB }
        };
        
        const colorScheme = colors[type] || colors['male'];
        
        // Head (more realistic proportions)
        const headGeometry = new THREE.SphereGeometry(0.12, 16, 16);
        const headMaterial = new THREE.MeshLambertMaterial({ color: colorScheme.skin });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(0, 1.7, 0);
        head.castShadow = true;
        group.add(head);
        
        // Hair (anime styles for anime types)
        if (type.includes('anime')) {
            const hairGeometry = new THREE.SphereGeometry(0.14, 16, 16);
            const hairMaterial = new THREE.MeshLambertMaterial({ color: colorScheme.hair });
            const hair = new THREE.Mesh(hairGeometry, hairMaterial);
            hair.position.set(0, 1.72, 0);
            hair.castShadow = true;
            group.add(hair);
            
            // Anime-style hair spikes
            if (type === 'anime-male') {
                for (let i = 0; i < 3; i++) {
                    const spikeGeometry = new THREE.ConeGeometry(0.02, 0.1, 8);
                    const spike = new THREE.Mesh(spikeGeometry, hairMaterial);
                    spike.position.set((i - 1) * 0.08, 1.85, 0.05);
                    spike.rotation.x = -0.3;
                    group.add(spike);
                }
            }
        } else {
            // Realistic hair
            const hairGeometry = new THREE.SphereGeometry(0.13, 16, 16);
            const hairMaterial = new THREE.MeshLambertMaterial({ color: colorScheme.hair });
            const hair = new THREE.Mesh(hairGeometry, hairMaterial);
            hair.position.set(0, 1.72, 0);
            hair.scale.y = 0.8;
            hair.castShadow = true;
            group.add(hair);
        }
        
        // Torso (better proportions)
        const torsoGeometry = new THREE.CylinderGeometry(0.15, 0.18, 0.6, 12);
        const torsoMaterial = new THREE.MeshLambertMaterial({ color: colorScheme.clothes });
        const torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
        torso.position.set(0, 1.2, 0);
        torso.castShadow = true;
        group.add(torso);
        
        // Arms (more realistic)
        const armGeometry = new THREE.CylinderGeometry(0.04, 0.05, 0.5, 8);
        const armMaterial = new THREE.MeshLambertMaterial({ color: colorScheme.skin });
        
        // Left arm
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.22, 1.3, 0);
        leftArm.rotation.z = 0.3;
        leftArm.castShadow = true;
        group.add(leftArm);
        
        // Right arm
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.22, 1.3, 0);
        rightArm.rotation.z = -0.3;
        rightArm.castShadow = true;
        group.add(rightArm);
        
        // Hands
        const handGeometry = new THREE.SphereGeometry(0.04, 8, 8);
        const leftHand = new THREE.Mesh(handGeometry, armMaterial);
        leftHand.position.set(-0.35, 1.05, 0);
        leftHand.castShadow = true;
        group.add(leftHand);
        
        const rightHand = new THREE.Mesh(handGeometry, armMaterial);
        rightHand.position.set(0.35, 1.05, 0);
        rightHand.castShadow = true;
        group.add(rightHand);
        
        // Legs (better proportions)
        const legGeometry = new THREE.CylinderGeometry(0.06, 0.07, 0.7, 8);
        const legMaterial = new THREE.MeshLambertMaterial({ 
            color: type.includes('female') ? colorScheme.skin : 0x000080 // pants for male, skin for female
        });
        
        // Left leg
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.1, 0.55, 0);
        leftLeg.castShadow = true;
        group.add(leftLeg);
        
        // Right leg
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.1, 0.55, 0);
        rightLeg.castShadow = true;
        group.add(rightLeg);
        
        // Feet
        const footGeometry = new THREE.BoxGeometry(0.08, 0.04, 0.15);
        const footMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        
        const leftFoot = new THREE.Mesh(footGeometry, footMaterial);
        leftFoot.position.set(-0.1, 0.15, 0.05);
        leftFoot.castShadow = true;
        group.add(leftFoot);
        
        const rightFoot = new THREE.Mesh(footGeometry, footMaterial);
        rightFoot.position.set(0.1, 0.15, 0.05);
        rightFoot.castShadow = true;
        group.add(rightFoot);
        
        // Add anime-specific features
        if (type.includes('anime')) {
            // Large anime eyes
            const eyeGeometry = new THREE.SphereGeometry(0.02, 8, 8);
            const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
            
            const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            leftEye.position.set(-0.04, 1.72, 0.11);
            group.add(leftEye);
            
            const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            rightEye.position.set(0.04, 1.72, 0.11);
            group.add(rightEye);
            
            // Anime-style accessories
            if (type === 'anime-female') {
                // Hair ribbons
                const ribbonGeometry = new THREE.BoxGeometry(0.03, 0.03, 0.01);
                const ribbonMaterial = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
                const ribbon = new THREE.Mesh(ribbonGeometry, ribbonMaterial);
                ribbon.position.set(0.08, 1.78, 0);
                group.add(ribbon);
            }
        }
        
        // Store references for posing (simplified system)
        this.mannequin = group;
        this.mannequin.head = head;
        this.mannequin.torso = torso;
        this.mannequin.leftArm = leftArm;
        this.mannequin.rightArm = rightArm;
        this.mannequin.leftLeg = leftLeg;
        this.mannequin.rightLeg = rightLeg;
        
        // Add posing properties for compatibility
        this.mannequin.body = {
            bend: 0,
            turn: 0,
            tilt: 0
        };
        
        // Add the mannequin to the scene
        this.scene.add(this.mannequin);
        
        // Update UI
        this.populateManualPosingControls();
        this.loadPoseLibrary();
        
        console.log(`Loaded enhanced ${type} mannequin with realistic proportions`);
    }
    
    populateManualPosingControls() {
        const container = document.getElementById('manual-posing-controls');
        if (!container || !this.mannequin) return;
        
        container.innerHTML = '';
        
        const parts = ['body', 'head', 'l_arm', 'r_arm', 'l_leg', 'r_leg'];
        
        parts.forEach(partName => {
            const part = this.mannequin[partName];
            if (part) {
                const partContainer = document.createElement('div');
                partContainer.style.marginBottom = '10px';
                
                const title = document.createElement('h4');
                title.textContent = partName.replace('_', ' ').toUpperCase();
                title.style.cssText = 'margin: 0 0 5px 0; font-size: 12px; color: var(--nebula-text, #ffffff);';
                partContainer.appendChild(title);
                
                for (const prop in part) {
                    if (typeof part[prop] === 'number') {
                        const controlContainer = document.createElement('div');
                        controlContainer.style.marginBottom = '5px';
                        
                        const label = document.createElement('label');
                        label.textContent = prop;
                        label.style.cssText = 'font-size: 10px; color: var(--nebula-text-secondary, #cccccc); margin-right: 5px;';
                        
                        const slider = document.createElement('input');
                        slider.type = 'range';
                        slider.min = -180;
                        slider.max = 180;
                        slider.value = part[prop];
                        slider.style.width = '60%';
                        
                        slider.addEventListener('input', (e) => {
                            part[prop] = parseInt(e.target.value);
                        });
                        
                        controlContainer.appendChild(label);
                        controlContainer.appendChild(slider);
                        partContainer.appendChild(controlContainer);
                    }
                }
                
                container.appendChild(partContainer);
            }
        });
    }
    
    applyPose(poseName) {
        if (!this.mannequin || !this.mannequin.body) {
            console.log('No mannequin loaded or mannequin has no body');
            return;
        }
        
        const poseData = this.poseLibrary[poseName];
        if (poseData) {
            for (const partName in poseData) {
                const part = this.mannequin[partName];
                if (part) {
                    for (const prop in poseData[partName]) {
                        part[prop] = poseData[partName][prop];
                    }
                }
            }
            this.populateManualPosingControls();
            console.log(`Applied pose: ${poseName}`);
        }
    }
    
    savePose(poseName) {
        if (!this.mannequin || !this.mannequin.body) {
            console.log('No mannequin loaded to save pose');
            return;
        }
        
        const poseData = {};
        const parts = ['body', 'head', 'l_arm', 'r_arm', 'l_leg', 'r_leg'];
        
        parts.forEach(partName => {
            const part = this.mannequin[partName];
            if (part) {
                poseData[partName] = {};
                for (const prop in part) {
                    if (typeof part[prop] === 'number') {
                        poseData[partName][prop] = part[prop];
                    }
                }
            }
        });
        
        this.poseLibrary[poseName] = poseData;
        localStorage.setItem('nebulaPoseLibrary', JSON.stringify(this.poseLibrary));
        this.updatePoseLibraryUI();
        console.log(`Saved pose: ${poseName}`);
    }
    
    loadPoseLibrary() {
        const savedPoses = localStorage.getItem('nebulaPoseLibrary');
        if (savedPoses) {
            this.poseLibrary = JSON.parse(savedPoses);
        }
        this.updatePoseLibraryUI();
    }
    
    updatePoseLibraryUI() {
        const select = document.getElementById('pose-library-select');
        if (!select) return;
        
        select.innerHTML = '';
        
        // Add default poses
        const defaultPoses = ['Neutral', 'T-Pose', 'Action', 'Sitting'];
        defaultPoses.forEach(poseName => {
            const option = document.createElement('option');
            option.value = poseName.toLowerCase().replace('-','');
            option.textContent = poseName;
            select.appendChild(option);
        });
        
        // Add saved poses
        for (const poseName in this.poseLibrary) {
            if (!defaultPoses.includes(poseName)) {
                const option = document.createElement('option');
                option.value = poseName;
                option.textContent = poseName;
                select.appendChild(option);
            }
        }
    }
    
    resetCamera() {
        if (this.camera && this.controls) {
            this.camera.position.set(0, 1, 3);
            this.controls.reset();
        }
    }
    
    captureScene() {
        if (!this.renderer) {
            console.error('Renderer not available');
            return;
        }
        
        try {
            // Render the scene
            this.renderer.render(this.scene, this.camera);
            
            // Get the canvas data
            const canvas = this.renderer.domElement;
            const dataURL = canvas.toDataURL('image/png');
            
            // Create new layer in the image editor
            if (this.layerManager) {
                const layer = this.layerManager.addLayer('3D Reference');
                layer.metadata = {
                    type: '3d_reference',
                    timestamp: Date.now()
                };
                
                // Load the captured image into the layer
                const img = new Image();
                img.onload = () => {
                    const ctx = layer.canvas.getContext('2d');
                    
                    // Resize layer canvas to match the captured image
                    layer.canvas.width = img.width;
                    layer.canvas.height = img.height;
                    
                    // Draw the captured image
                    ctx.drawImage(img, 0, 0);
                    
                    // Update the main canvas
                    this.layerManager.updateMainCanvas();
                    
                    // Emit event
                    this.eventManager.emit('3dReferenceLayerCreated', {
                        layerId: layer.id,
                        layerName: layer.name
                    });
                    
                    console.log('3D scene captured as layer');
                };
                img.src = dataURL;
            }
            
            // Hide the modal after capture
            this.hide();
            
        } catch (error) {
            console.error('Failed to capture scene:', error);
        }
    }
    
    animate() {
        if (!this.renderer || !this.scene || !this.camera) return;
        
        requestAnimationFrame(() => this.animate());
        
        // Update animation mixer
        if (this.mixer && this.animationEnabled) {
            this.mixer.update(0.016); // ~60fps
        }
        
        // Update controls
        if (this.controls) {
            this.controls.update();
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    resizeRenderer(width, height) {
        if (!this.renderer || !this.camera) return;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
    
    show() {
        this.modal.style.display = 'flex';
        this.isVisible = true;
        
        // Initialize Three.js if not already done
        if (!this.scene) {
            setTimeout(() => {
                this.initializeThreeJS();
            }, 100);
        }
        
        // Start animation loop
        this.animate();
        
        // Handle window resize
        this.handleResize();
        window.addEventListener('resize', this.handleResize.bind(this));
    }
    
    hide() {
        this.modal.style.display = 'none';
        this.isVisible = false;
        window.removeEventListener('resize', this.handleResize.bind(this));
    }
    
    handleResize() {
        const container = document.getElementById('threejs-canvas-container');
        if (!container || !this.renderer || !this.camera) return;
        
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
    
    toggleAnimation(enabled) {
        this.animationEnabled = enabled;
        
        if (!enabled && this.currentAction) {
            this.currentAction.stop();
        } else if (enabled && this.currentAction) {
            this.currentAction.play();
        }
        
        console.log(`Animation ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    populateAnimationList() {
        const animationList = document.getElementById('animation-list');
        if (!animationList || !this.animationActions) return;
        
        animationList.innerHTML = '';
        
        Object.keys(this.animationActions).forEach(animName => {
            const btn = document.createElement('button');
            btn.textContent = animName;
            btn.style.cssText = `
                background: var(--nebula-surface, #2a2a2a);
                color: var(--nebula-text, #ffffff);
                border: 1px solid var(--nebula-border, #404040);
                padding: 4px 8px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 9px;
            `;
            
            btn.addEventListener('click', () => {
                this.playAnimation(animName);
            });
            
            animationList.appendChild(btn);
        });
    }
    
    playAnimation(animationName) {
        if (!this.animationActions || !this.animationEnabled) return;
        
        const action = this.animationActions[animationName];
        if (!action) return;
        
        // Stop current animation
        if (this.currentAction && this.currentAction !== action) {
            this.currentAction.fadeOut(0.2);
        }
        
        // Play new animation
        action.reset().fadeIn(0.2).play();
        this.currentAction = action;
        
        console.log(`Playing animation: ${animationName}`);
    }
    
    openPoseMyArt() {
        // Open PoseMy.Art in a new window for professional reference
        const poseMyArtWindow = window.open('https://posemy.art/app/', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
        
        if (poseMyArtWindow) {
            poseMyArtWindow.focus();
            console.log('Opened PoseMy.Art studio for professional reference');
            
            // Show instructions to user
            if (this.eventManager) {
                this.eventManager.showNotification('PoseMy.Art opened! Use it to create poses, then screenshot and import as reference layers.', 'info');
            }
        } else {
            console.warn('Failed to open PoseMy.Art - popup blocked?');
            if (this.eventManager) {
                this.eventManager.showNotification('Please allow popups to open PoseMy.Art studio', 'warning');
            }
        }
    }
    
    openMannequinDiscovery() {
        // This will open a new modal or panel within the 3D studio for discovery
        // For now, we'll open a new browser tab to a curated list of resources.
        // In a more integrated system, this would be an internal UI.
        const discoveryWindow = window.open('', '_blank');
        discoveryWindow.document.write(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Mannequin Discovery</title>
                <style>
                    body { font-family: sans-serif; background: #1a1a1a; color: #ffffff; padding: 20px; }
                    h1 { color: #007acc; }
                    a { color: #007acc; text-decoration: none; }
                    a:hover { text-decoration: underline; }
                    .resource-list { list-style: none; padding: 0; }
                    .resource-list li { margin-bottom: 10px; background: #2a2a2a; padding: 10px; border-radius: 5px; border: 1px solid #404040; }
                    .resource-list li strong { color: #ffffff; }
                    .resource-list li span { color: #cccccc; font-size: 0.9em; }
                </style>
            </head>
            <body>
                <h1>Mannequin Discovery Resources</h1>
                <p>Here are some resources where you can find more 3D mannequin models and posing tools:</p>
                <ul class="resource-list">
                    <li>
                        <strong>PoseMy.Art (Online Posing Tool)</strong><br>
                        <span>An excellent free online tool for posing 3D models directly in your browser.</span><br>
                        <a href="https://posemy.art/" target="_blank">Visit PoseMy.Art</a>
                    </li>
                    <li>
                        <strong>Free3D (Downloadable Models)</strong><br>
                        <span>Browse a wide variety of free 3D mannequin models for download.</span><br>
                        <a href="https://free3d.com/3d-models/mannequin" target="_blank">Browse Free3D Mannequins</a>
                    </li>
                    <li>
                        <strong>Sketchfab (Community Models)</strong><br>
                        <span>Explore community-created 3D models, including many mannequins.</span><br>
                        <a href="https://sketchfab.com/search?q=mannequin&type=models" target="_blank">Search Sketchfab</a>
                    </li>
                    <li>
                        <strong>RenderPeople (High-Quality Scans)</strong><br>
                        <span>Offers some free high-quality 3D scanned people models.</span><br>
                        <a href="https://renderpeople.com/free-3d-models/" target="_blank">RenderPeople Free Models</a>
                    </li>
                    <li>
                        <strong>CGTrader (Marketplace)</strong><br>
                        <span>A large marketplace for 3D models, including many professional mannequins.</span><br>
                        <a href="https://www.cgtrader.com/3d-models/character/man/mannequin" target="_blank">Browse CGTrader Mannequins</a>
                    </li>
                </ul>
                <p>You can download models from these sites and potentially load them into the 3D studio (advanced feature) or use them as external reference.</p>
            </body>
            </html>
        `);
        discoveryWindow.document.close();
    }
}

// CSS Variables for theming
const style = document.createElement('style');
style.textContent = `
    :root {
        --nebula-background: #1a1a1a;
        --nebula-surface: #2a2a2a;
        --nebula-border: #404040;
        --nebula-text: #ffffff;
        --nebula-text-secondary: #cccccc;
        --nebula-accent: #007acc;
        --nebula-hover: #404040;
    }
    
    .image-editor-container * {
        box-sizing: border-box;
    }
    
    .panel {
        display: none;
    }
    
    .panel.active {
        display: block;
    }
    
    .tool-property,
    .adjust-property {
        margin-bottom: 15px;
    }
    
    .tool-property label,
    .adjust-property label {
        display: block;
        margin-bottom: 5px;
    }
    
    .tool-property input[type="range"],
    .adjust-property input[type="range"] {
        width: 100%;
        margin-bottom: 3px;
    }
    
    .layer-item:hover {
        background: var(--nebula-hover) !important;
    }
    
    .history-item {
        cursor: pointer;
    }
    
    .history-item:hover {
        background: var(--nebula-hover) !important;
    }
    
    /* Scrollbar styling */
    ::-webkit-scrollbar {
        width: 8px;
    }
    
    ::-webkit-scrollbar-track {
        background: var(--nebula-background);
    }
    
    ::-webkit-scrollbar-thumb {
        background: var(--nebula-border);
        border-radius: 4px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
        background: var(--nebula-hover);
    }
`;
document.head.appendChild(style);

// Export for use in NebulaDesktop
window.NebulaApp = NebulaApp;

// Register the app with WindowManager
new NebulaApp();

