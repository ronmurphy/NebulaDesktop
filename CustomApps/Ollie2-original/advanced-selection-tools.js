// Advanced Selection Tools
// This module implements professional selection tools for the image editor

class SelectionManager {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.activeSelection = null;
        this.selectionCanvas = null;
        this.selectionContext = null;
        this.marchingAnts = null;
        this.marchingAntsOffset = 0;
        this.setupSelectionCanvas();
    }
    
    setupSelectionCanvas() {
        this.selectionCanvas = document.createElement('canvas');
        this.selectionContext = this.selectionCanvas.getContext('2d');
        this.selectionCanvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            pointer-events: none;
            z-index: 10;
        `;
    }
    
    setCanvasSize(width, height) {
        this.selectionCanvas.width = width;
        this.selectionCanvas.height = height;
    }
    
    setSelection(selection) {
        this.activeSelection = selection;
        this.renderSelection();
        this.eventManager.emit('selectionChanged', selection);
    }
    
    clearSelection() {
        this.activeSelection = null;
        this.clearSelectionCanvas();
        this.stopMarchingAnts();
        this.eventManager.emit('selectionCleared');
    }
    
    hasSelection() {
        return this.activeSelection !== null;
    }
    
    getSelection() {
        return this.activeSelection;
    }
    
    renderSelection() {
        if (!this.activeSelection) {
            this.clearSelectionCanvas();
            return;
        }
        
        this.clearSelectionCanvas();
        this.drawMarchingAnts();
        this.startMarchingAnts();
    }
    
    clearSelectionCanvas() {
        this.selectionContext.clearRect(0, 0, this.selectionCanvas.width, this.selectionCanvas.height);
    }
    
    drawMarchingAnts() {
        if (!this.activeSelection) return;
        
        this.selectionContext.save();
        this.selectionContext.strokeStyle = '#000';
        this.selectionContext.lineWidth = 1;
        this.selectionContext.setLineDash([4, 4]);
        this.selectionContext.lineDashOffset = this.marchingAntsOffset;
        
        if (this.activeSelection.type === 'rectangle') {
            this.drawRectangleSelection();
        } else if (this.activeSelection.type === 'lasso') {
            this.drawLassoSelection();
        } else if (this.activeSelection.type === 'magic_wand') {
            this.drawMagicWandSelection();
        }
        
        this.selectionContext.restore();
        
        // Draw white dashed line on top
        this.selectionContext.save();
        this.selectionContext.strokeStyle = '#fff';
        this.selectionContext.lineWidth = 1;
        this.selectionContext.setLineDash([4, 4]);
        this.selectionContext.lineDashOffset = this.marchingAntsOffset + 4;
        
        if (this.activeSelection.type === 'rectangle') {
            this.drawRectangleSelection();
        } else if (this.activeSelection.type === 'lasso') {
            this.drawLassoSelection();
        } else if (this.activeSelection.type === 'magic_wand') {
            this.drawMagicWandSelection();
        }
        
        this.selectionContext.restore();
    }
    
    drawRectangleSelection() {
        const { x, y, width, height } = this.activeSelection;
        this.selectionContext.strokeRect(x, y, width, height);
    }
    
    drawLassoSelection() {
        const { points } = this.activeSelection;
        if (points.length < 2) return;
        
        this.selectionContext.beginPath();
        this.selectionContext.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            this.selectionContext.lineTo(points[i].x, points[i].y);
        }
        this.selectionContext.closePath();
        this.selectionContext.stroke();
    }
    
    drawMagicWandSelection() {
        const { regions } = this.activeSelection;
        regions.forEach(region => {
            this.selectionContext.beginPath();
            this.selectionContext.moveTo(region[0].x, region[0].y);
            for (let i = 1; i < region.length; i++) {
                this.selectionContext.lineTo(region[i].x, region[i].y);
            }
            this.selectionContext.closePath();
            this.selectionContext.stroke();
        });
    }
    
    startMarchingAnts() {
        this.stopMarchingAnts();
        this.marchingAnts = setInterval(() => {
            this.marchingAntsOffset = (this.marchingAntsOffset + 1) % 8;
            this.drawMarchingAnts();
        }, 100);
    }
    
    stopMarchingAnts() {
        if (this.marchingAnts) {
            clearInterval(this.marchingAnts);
            this.marchingAnts = null;
        }
    }
    
    isPointInSelection(x, y) {
        if (!this.activeSelection) return false;
        
        if (this.activeSelection.type === 'rectangle') {
            return this.isPointInRectangle(x, y);
        } else if (this.activeSelection.type === 'lasso') {
            return this.isPointInPolygon(x, y, this.activeSelection.points);
        } else if (this.activeSelection.type === 'magic_wand') {
            return this.isPointInMagicWandSelection(x, y);
        }
        
        return false;
    }
    
    isPointInRectangle(x, y) {
        const { x: sx, y: sy, width, height } = this.activeSelection;
        return x >= sx && x <= sx + width && y >= sy && y <= sy + height;
    }
    
    isPointInPolygon(x, y, points) {
        let inside = false;
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
            if (((points[i].y > y) !== (points[j].y > y)) &&
                (x < (points[j].x - points[i].x) * (y - points[i].y) / (points[j].y - points[i].y) + points[i].x)) {
                inside = !inside;
            }
        }
        return inside;
    }
    
    isPointInMagicWandSelection(x, y) {
        return this.activeSelection.regions.some(region => 
            this.isPointInPolygon(x, y, region)
        );
    }
}

class RectangleSelectionTool extends Tool {
    constructor(eventManager, selectionManager) {
        super('rectangle_select', eventManager);
        this.selectionManager = selectionManager;
        this.startPoint = null;
        this.currentSelection = null;
        this.properties = {
            feather: 0,
            antiAlias: true,
            mode: 'new' // new, add, subtract, intersect
        };
    }
    
    onMouseDown(data) {
        super.onMouseDown(data);
        this.startPoint = { x: data.x, y: data.y };
        this.currentSelection = {
            type: 'rectangle',
            x: data.x,
            y: data.y,
            width: 0,
            height: 0
        };
    }
    
    onMouseMove(data) {
        if (!this.isDrawing || !this.startPoint) return;
        
        const width = data.x - this.startPoint.x;
        const height = data.y - this.startPoint.y;
        
        this.currentSelection = {
            type: 'rectangle',
            x: Math.min(this.startPoint.x, data.x),
            y: Math.min(this.startPoint.y, data.y),
            width: Math.abs(width),
            height: Math.abs(height)
        };
        
        this.selectionManager.setSelection(this.currentSelection);
    }
    
    onMouseUp(data) {
        if (this.currentSelection && this.currentSelection.width > 1 && this.currentSelection.height > 1) {
            this.selectionManager.setSelection(this.currentSelection);
        } else {
            this.selectionManager.clearSelection();
        }
        
        super.onMouseUp(data);
        this.startPoint = null;
        this.currentSelection = null;
    }
}

class LassoSelectionTool extends Tool {
    constructor(eventManager, selectionManager) {
        super('lasso_select', eventManager);
        this.selectionManager = selectionManager;
        this.points = [];
        this.properties = {
            feather: 0,
            antiAlias: true,
            mode: 'new',
            smoothing: 0.5
        };
    }
    
    onMouseDown(data) {
        super.onMouseDown(data);
        this.points = [{ x: data.x, y: data.y }];
    }
    
    onMouseMove(data) {
        if (!this.isDrawing) return;
        
        // Add point with optional smoothing
        const lastPoint = this.points[this.points.length - 1];
        const distance = Math.sqrt(
            Math.pow(data.x - lastPoint.x, 2) + Math.pow(data.y - lastPoint.y, 2)
        );
        
        // Only add point if it's far enough from the last one
        if (distance > 2) {
            this.points.push({ x: data.x, y: data.y });
            
            // Apply smoothing if enabled
            if (this.properties.smoothing > 0 && this.points.length > 2) {
                this.smoothPoints();
            }
            
            const currentSelection = {
                type: 'lasso',
                points: [...this.points]
            };
            
            this.selectionManager.setSelection(currentSelection);
        }
    }
    
    onMouseUp(data) {
        if (this.points.length > 2) {
            // Close the lasso by connecting to the first point
            this.points.push({ ...this.points[0] });
            
            const finalSelection = {
                type: 'lasso',
                points: this.points
            };
            
            this.selectionManager.setSelection(finalSelection);
        } else {
            this.selectionManager.clearSelection();
        }
        
        super.onMouseUp(data);
        this.points = [];
    }
    
    smoothPoints() {
        if (this.points.length < 3) return;
        
        const smoothingFactor = this.properties.smoothing;
        const lastIndex = this.points.length - 1;
        const prevPoint = this.points[lastIndex - 2];
        const currPoint = this.points[lastIndex - 1];
        const nextPoint = this.points[lastIndex];
        
        // Apply smoothing to the current point
        this.points[lastIndex - 1] = {
            x: currPoint.x + (prevPoint.x + nextPoint.x - 2 * currPoint.x) * smoothingFactor * 0.1,
            y: currPoint.y + (prevPoint.y + nextPoint.y - 2 * currPoint.y) * smoothingFactor * 0.1
        };
    }
}

class MagicWandTool extends Tool {
    constructor(eventManager, selectionManager) {
        super('magic_wand', eventManager);
        this.selectionManager = selectionManager;
        this.properties = {
            tolerance: 32,
            contiguous: true,
            antiAlias: true,
            sampleAllLayers: false,
            mode: 'new'
        };
    }
    
    onMouseDown(data) {
        super.onMouseDown(data);
        this.performMagicWandSelection(data.x, data.y);
    }
    
    performMagicWandSelection(x, y) {
        const layer = window.fixedImageEditor?.layerManager?.getActiveLayer();
        if (!layer) return;
        
        const imageData = layer.context.getImageData(0, 0, layer.canvas.width, layer.canvas.height);
        const selectedPixels = this.floodFill(imageData, Math.floor(x), Math.floor(y));
        
        if (selectedPixels.length > 0) {
            const regions = this.pixelsToRegions(selectedPixels, imageData.width, imageData.height);
            const selection = {
                type: 'magic_wand',
                regions: regions,
                pixels: selectedPixels
            };
            
            this.selectionManager.setSelection(selection);
        } else {
            this.selectionManager.clearSelection();
        }
    }
    
    floodFill(imageData, startX, startY) {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        const tolerance = this.properties.tolerance;
        
        // Get the color at the starting point
        const startIndex = (startY * width + startX) * 4;
        const targetColor = {
            r: data[startIndex],
            g: data[startIndex + 1],
            b: data[startIndex + 2],
            a: data[startIndex + 3]
        };
        
        const visited = new Set();
        const selectedPixels = [];
        const stack = [{ x: startX, y: startY }];
        
        while (stack.length > 0) {
            const { x, y } = stack.pop();
            
            if (x < 0 || x >= width || y < 0 || y >= height) continue;
            
            const key = y * width + x;
            if (visited.has(key)) continue;
            
            const index = key * 4;
            const currentColor = {
                r: data[index],
                g: data[index + 1],
                b: data[index + 2],
                a: data[index + 3]
            };
            
            if (this.colorDistance(targetColor, currentColor) <= tolerance) {
                visited.add(key);
                selectedPixels.push({ x, y });
                
                if (this.properties.contiguous) {
                    // Add neighboring pixels to stack
                    stack.push({ x: x + 1, y });
                    stack.push({ x: x - 1, y });
                    stack.push({ x, y: y + 1 });
                    stack.push({ x, y: y - 1 });
                }
            }
        }
        
        // If not contiguous, select all similar pixels
        if (!this.properties.contiguous) {
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const index = (y * width + x) * 4;
                    const currentColor = {
                        r: data[index],
                        g: data[index + 1],
                        b: data[index + 2],
                        a: data[index + 3]
                    };
                    
                    if (this.colorDistance(targetColor, currentColor) <= tolerance) {
                        selectedPixels.push({ x, y });
                    }
                }
            }
        }
        
        return selectedPixels;
    }
    
    colorDistance(color1, color2) {
        const dr = color1.r - color2.r;
        const dg = color1.g - color2.g;
        const db = color1.b - color2.b;
        const da = color1.a - color2.a;
        
        return Math.sqrt(dr * dr + dg * dg + db * db + da * da);
    }
    
    pixelsToRegions(pixels, width, height) {
        // Convert selected pixels to boundary regions for display
        const regions = [];
        const pixelSet = new Set(pixels.map(p => `${p.x},${p.y}`));
        
        // Find boundary pixels
        const boundaryPixels = pixels.filter(pixel => {
            const { x, y } = pixel;
            return !pixelSet.has(`${x+1},${y}`) || 
                   !pixelSet.has(`${x-1},${y}`) || 
                   !pixelSet.has(`${x},${y+1}`) || 
                   !pixelSet.has(`${x},${y-1}`);
        });
        
        // Group boundary pixels into regions (simplified)
        if (boundaryPixels.length > 0) {
            regions.push(boundaryPixels);
        }
        
        return regions;
    }
}

class PolygonalLassoTool extends Tool {
    constructor(eventManager, selectionManager) {
        super('polygonal_lasso', eventManager);
        this.selectionManager = selectionManager;
        this.points = [];
        this.isActive = false;
        this.properties = {
            feather: 0,
            antiAlias: true,
            mode: 'new'
        };
    }
    
    onMouseDown(data) {
        if (!this.isActive) {
            // Start new polygonal selection
            this.isActive = true;
            this.points = [{ x: data.x, y: data.y }];
        } else {
            // Add point to existing selection
            this.points.push({ x: data.x, y: data.y });
        }
        
        this.updateSelection();
    }
    
    onMouseMove(data) {
        if (this.isActive && this.points.length > 0) {
            // Show preview line to current mouse position
            const previewPoints = [...this.points, { x: data.x, y: data.y }];
            const previewSelection = {
                type: 'lasso',
                points: previewPoints,
                preview: true
            };
            
            this.selectionManager.setSelection(previewSelection);
        }
    }
    
    onDoubleClick(data) {
        if (this.isActive && this.points.length > 2) {
            // Close the polygon
            this.points.push({ ...this.points[0] });
            
            const finalSelection = {
                type: 'lasso',
                points: this.points
            };
            
            this.selectionManager.setSelection(finalSelection);
            this.reset();
        }
    }
    
    updateSelection() {
        if (this.points.length > 1) {
            const currentSelection = {
                type: 'lasso',
                points: [...this.points],
                incomplete: true
            };
            
            this.selectionManager.setSelection(currentSelection);
        }
    }
    
    reset() {
        this.isActive = false;
        this.points = [];
    }
    
    cancel() {
        this.reset();
        this.selectionManager.clearSelection();
    }
}

class SelectionToolManager {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.selectionManager = new SelectionManager(eventManager);
        this.tools = new Map();
        this.activeTool = null;
        this.initializeTools();
    }
    
    initializeTools() {
        this.tools.set('rectangle_select', new RectangleSelectionTool(this.eventManager, this.selectionManager));
        this.tools.set('lasso_select', new LassoSelectionTool(this.eventManager, this.selectionManager));
        this.tools.set('magic_wand', new MagicWandTool(this.eventManager, this.selectionManager));
        this.tools.set('polygonal_lasso', new PolygonalLassoTool(this.eventManager, this.selectionManager));
    }
    
    setActiveTool(toolName) {
        if (this.tools.has(toolName)) {
            // Cancel any active polygonal lasso
            if (this.activeTool && this.activeTool.name === 'polygonal_lasso') {
                this.activeTool.cancel();
            }
            
            this.activeTool = this.tools.get(toolName);
            this.eventManager.emit('selectionToolChanged', toolName);
        }
    }
    
    getActiveTool() {
        return this.activeTool;
    }
    
    getSelectionManager() {
        return this.selectionManager;
    }
    
    setToolProperty(property, value) {
        if (this.activeTool) {
            this.activeTool.properties[property] = value;
        }
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
    
    handleDoubleClick(data) {
        if (this.activeTool && this.activeTool.onDoubleClick) {
            this.activeTool.onDoubleClick(data);
        }
    }
    
    handleKeyDown(event) {
        // Escape key cancels current selection
        if (event.key === 'Escape') {
            if (this.activeTool && this.activeTool.cancel) {
                this.activeTool.cancel();
            } else {
                this.selectionManager.clearSelection();
            }
        }
        
        // Enter key completes polygonal lasso
        if (event.key === 'Enter' && this.activeTool && this.activeTool.name === 'polygonal_lasso') {
            this.activeTool.onDoubleClick({ x: 0, y: 0 });
        }
    }
}

// Selection Tools Panel
class SelectionToolsPanel {
    constructor(selectionToolManager) {
        this.selectionToolManager = selectionToolManager;
    }
    
    createPanel() {
        const panel = document.createElement('div');
        panel.className = 'selection-tools-panel';
        panel.style.cssText = `
            padding: 20px;
            background: var(--nebula-surface);
            border-radius: 8px;
            margin-top: 20px;
        `;
        
        panel.innerHTML = `
            <div class="panel-header">
                <h3 class="panel-title">Selection Tools</h3>
                <button class="enhanced-btn" id="clear-selection">Clear</button>
            </div>
            
            <div class="selection-tool-grid">
                <button class="selection-tool-btn active" data-tool="rectangle_select" title="Rectangle Select">
                    <span class="material-symbols-outlined">crop_free</span>
                    <span>Rectangle</span>
                </button>
                <button class="selection-tool-btn" data-tool="lasso_select" title="Lasso Select">
                    <span class="material-symbols-outlined">gesture</span>
                    <span>Lasso</span>
                </button>
                <button class="selection-tool-btn" data-tool="polygonal_lasso" title="Polygonal Lasso">
                    <span class="material-symbols-outlined">polyline</span>
                    <span>Polygon</span>
                </button>
                <button class="selection-tool-btn" data-tool="magic_wand" title="Magic Wand">
                    <span class="material-symbols-outlined">auto_fix_high</span>
                    <span>Magic Wand</span>
                </button>
            </div>
            
            <div class="selection-properties">
                <div class="property-group">
                    <label class="property-label">Tolerance (Magic Wand)</label>
                    <div class="property-control">
                        <input type="range" id="magic-wand-tolerance" min="0" max="255" value="32" class="enhanced-slider">
                        <span id="magic-wand-tolerance-value" class="property-value">32</span>
                    </div>
                </div>
                
                <div class="property-group">
                    <label class="property-label">Feather</label>
                    <div class="property-control">
                        <input type="range" id="selection-feather" min="0" max="50" value="0" class="enhanced-slider">
                        <span id="selection-feather-value" class="property-value">0px</span>
                    </div>
                </div>
                
                <div class="property-group checkbox-group">
                    <label class="checkbox-label">
                        <input type="checkbox" id="contiguous-selection" checked>
                        <span class="checkmark"></span>
                        Contiguous (Magic Wand)
                    </label>
                </div>
                
                <div class="property-group checkbox-group">
                    <label class="checkbox-label">
                        <input type="checkbox" id="anti-alias-selection" checked>
                        <span class="checkmark"></span>
                        Anti-alias
                    </label>
                </div>
            </div>
            
            <div class="selection-actions">
                <h4 class="section-title">Selection Actions</h4>
                <div class="action-buttons">
                    <button class="enhanced-btn" id="invert-selection">Invert</button>
                    <button class="enhanced-btn" id="expand-selection">Expand</button>
                    <button class="enhanced-btn" id="contract-selection">Contract</button>
                    <button class="enhanced-btn" id="smooth-selection">Smooth</button>
                </div>
            </div>
        `;
        
        this.setupEventListeners(panel);
        return panel;
    }
    
    setupEventListeners(panel) {
        // Tool selection
        panel.querySelectorAll('.selection-tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                panel.querySelectorAll('.selection-tool-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                
                const tool = e.currentTarget.dataset.tool;
                this.selectionToolManager.setActiveTool(tool);
            });
        });
        
        // Clear selection
        panel.querySelector('#clear-selection')?.addEventListener('click', () => {
            this.selectionToolManager.getSelectionManager().clearSelection();
        });
        
        // Property controls
        const toleranceSlider = panel.querySelector('#magic-wand-tolerance');
        const toleranceValue = panel.querySelector('#magic-wand-tolerance-value');
        if (toleranceSlider && toleranceValue) {
            toleranceSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                toleranceValue.textContent = value;
                this.selectionToolManager.setToolProperty('tolerance', value);
            });
        }
        
        const featherSlider = panel.querySelector('#selection-feather');
        const featherValue = panel.querySelector('#selection-feather-value');
        if (featherSlider && featherValue) {
            featherSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                featherValue.textContent = value + 'px';
                this.selectionToolManager.setToolProperty('feather', value);
            });
        }
        
        // Checkboxes
        const contiguousCheckbox = panel.querySelector('#contiguous-selection');
        if (contiguousCheckbox) {
            contiguousCheckbox.addEventListener('change', (e) => {
                this.selectionToolManager.setToolProperty('contiguous', e.target.checked);
            });
        }
        
        const antiAliasCheckbox = panel.querySelector('#anti-alias-selection');
        if (antiAliasCheckbox) {
            antiAliasCheckbox.addEventListener('change', (e) => {
                this.selectionToolManager.setToolProperty('antiAlias', e.target.checked);
            });
        }
        
        // Action buttons
        panel.querySelector('#invert-selection')?.addEventListener('click', () => {
            this.invertSelection();
        });
        
        panel.querySelector('#expand-selection')?.addEventListener('click', () => {
            this.expandSelection();
        });
        
        panel.querySelector('#contract-selection')?.addEventListener('click', () => {
            this.contractSelection();
        });
        
        panel.querySelector('#smooth-selection')?.addEventListener('click', () => {
            this.smoothSelection();
        });
    }
    
    invertSelection() {
        // Implement selection inversion
        console.log('Invert selection - feature coming soon');
    }
    
    expandSelection() {
        // Implement selection expansion
        console.log('Expand selection - feature coming soon');
    }
    
    contractSelection() {
        // Implement selection contraction
        console.log('Contract selection - feature coming soon');
    }
    
    smoothSelection() {
        // Implement selection smoothing
        console.log('Smooth selection - feature coming soon');
    }
}

// Export classes
window.SelectionManager = SelectionManager;
window.SelectionToolManager = SelectionToolManager;
window.SelectionToolsPanel = SelectionToolsPanel;
window.RectangleSelectionTool = RectangleSelectionTool;
window.LassoSelectionTool = LassoSelectionTool;
window.MagicWandTool = MagicWandTool;
window.PolygonalLassoTool = PolygonalLassoTool;

