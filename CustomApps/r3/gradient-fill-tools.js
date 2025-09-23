// Gradient Fill Tools with Directional Control
// This module implements professional gradient fill tools for the image editor

class GradientManager {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.gradients = new Map();
        this.activeGradient = null;
        this.presets = this.createDefaultPresets();
    }
    
    createDefaultPresets() {
        return [
            {
                name: 'Black to White',
                type: 'linear',
                stops: [
                    { position: 0, color: '#000000', alpha: 1 },
                    { position: 1, color: '#ffffff', alpha: 1 }
                ]
            },
            {
                name: 'Rainbow',
                type: 'linear',
                stops: [
                    { position: 0, color: '#ff0000', alpha: 1 },
                    { position: 0.17, color: '#ff8800', alpha: 1 },
                    { position: 0.33, color: '#ffff00', alpha: 1 },
                    { position: 0.5, color: '#00ff00', alpha: 1 },
                    { position: 0.67, color: '#0088ff', alpha: 1 },
                    { position: 0.83, color: '#4400ff', alpha: 1 },
                    { position: 1, color: '#8800ff', alpha: 1 }
                ]
            },
            {
                name: 'Sunset',
                type: 'radial',
                stops: [
                    { position: 0, color: '#ffeb3b', alpha: 1 },
                    { position: 0.5, color: '#ff9800', alpha: 1 },
                    { position: 1, color: '#e91e63', alpha: 1 }
                ]
            },
            {
                name: 'Ocean',
                type: 'linear',
                stops: [
                    { position: 0, color: '#00bcd4', alpha: 1 },
                    { position: 0.5, color: '#2196f3', alpha: 1 },
                    { position: 1, color: '#3f51b5', alpha: 1 }
                ]
            },
            {
                name: 'Transparent Fade',
                type: 'linear',
                stops: [
                    { position: 0, color: '#000000', alpha: 1 },
                    { position: 1, color: '#000000', alpha: 0 }
                ]
            }
        ];
    }
    
    createGradient(definition) {
        const id = 'gradient_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        this.gradients.set(id, definition);
        return id;
    }
    
    getGradient(id) {
        return this.gradients.get(id);
    }
    
    setActiveGradient(definition) {
        this.activeGradient = definition;
        this.eventManager.emit('gradientChanged', definition);
    }
    
    getActiveGradient() {
        return this.activeGradient;
    }
    
    createCanvasGradient(context, definition, startPoint, endPoint) {
        let gradient;
        
        switch (definition.type) {
            case 'linear':
                gradient = context.createLinearGradient(
                    startPoint.x, startPoint.y,
                    endPoint.x, endPoint.y
                );
                break;
                
            case 'radial':
                const radius = Math.sqrt(
                    Math.pow(endPoint.x - startPoint.x, 2) + 
                    Math.pow(endPoint.y - startPoint.y, 2)
                );
                gradient = context.createRadialGradient(
                    startPoint.x, startPoint.y, 0,
                    startPoint.x, startPoint.y, radius
                );
                break;
                
            case 'conic':
                // Conic gradients need to be simulated for older browsers
                return this.createConicGradient(context, definition, startPoint, endPoint);
                
            default:
                gradient = context.createLinearGradient(
                    startPoint.x, startPoint.y,
                    endPoint.x, endPoint.y
                );
        }
        
        // Add color stops
        definition.stops.forEach(stop => {
            const color = this.colorWithAlpha(stop.color, stop.alpha);
            gradient.addColorStop(stop.position, color);
        });
        
        return gradient;
    }
    
    createConicGradient(context, definition, centerPoint, endPoint) {
        // Create a conic gradient using image data manipulation
        const canvas = document.createElement('canvas');
        const size = 512; // Resolution for the gradient
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        const imageData = ctx.createImageData(size, size);
        const data = imageData.data;
        
        const centerX = size / 2;
        const centerY = size / 2;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const dx = x - centerX;
                const dy = y - centerY;
                let angle = Math.atan2(dy, dx);
                
                // Normalize angle to 0-1
                angle = (angle + Math.PI) / (2 * Math.PI);
                
                const color = this.interpolateGradientColor(definition.stops, angle);
                const index = (y * size + x) * 4;
                
                data[index] = color.r;
                data[index + 1] = color.g;
                data[index + 2] = color.b;
                data[index + 3] = color.a * 255;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        return ctx.createPattern(canvas, 'no-repeat');
    }
    
    interpolateGradientColor(stops, position) {
        // Find the two stops that surround this position
        let beforeStop = stops[0];
        let afterStop = stops[stops.length - 1];
        
        for (let i = 0; i < stops.length - 1; i++) {
            if (position >= stops[i].position && position <= stops[i + 1].position) {
                beforeStop = stops[i];
                afterStop = stops[i + 1];
                break;
            }
        }
        
        // Calculate interpolation factor
        const range = afterStop.position - beforeStop.position;
        const factor = range === 0 ? 0 : (position - beforeStop.position) / range;
        
        // Parse colors
        const beforeColor = this.parseColor(beforeStop.color);
        const afterColor = this.parseColor(afterStop.color);
        
        // Interpolate
        return {
            r: Math.round(beforeColor.r + (afterColor.r - beforeColor.r) * factor),
            g: Math.round(beforeColor.g + (afterColor.g - beforeColor.g) * factor),
            b: Math.round(beforeColor.b + (afterColor.b - beforeColor.b) * factor),
            a: beforeStop.alpha + (afterStop.alpha - beforeStop.alpha) * factor
        };
    }
    
    parseColor(colorString) {
        // Simple hex color parser
        const hex = colorString.replace('#', '');
        return {
            r: parseInt(hex.substr(0, 2), 16),
            g: parseInt(hex.substr(2, 2), 16),
            b: parseInt(hex.substr(4, 2), 16)
        };
    }
    
    colorWithAlpha(color, alpha) {
        const parsed = this.parseColor(color);
        return `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${alpha})`;
    }
}

class GradientFillTool extends Tool {
    constructor(eventManager, gradientManager) {
        super('gradient_fill', eventManager);
        this.gradientManager = gradientManager;
        this.startPoint = null;
        this.endPoint = null;
        this.isDefiningGradient = false;
        this.previewCanvas = null;
        this.previewContext = null;
        
        this.properties = {
            blendMode: 'normal',
            opacity: 1.0,
            dither: false,
            reverse: false,
            transparency: false
        };
        
        this.setupPreviewCanvas();
    }
    
    setupPreviewCanvas() {
        this.previewCanvas = document.createElement('canvas');
        this.previewContext = this.previewCanvas.getContext('2d');
        this.previewCanvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            pointer-events: none;
            z-index: 5;
        `;
    }
    
    setCanvasSize(width, height) {
        this.previewCanvas.width = width;
        this.previewCanvas.height = height;
    }
    
    onMouseDown(data) {
        super.onMouseDown(data);
        this.startPoint = { x: data.x, y: data.y };
        this.endPoint = { x: data.x, y: data.y };
        this.isDefiningGradient = true;
        this.showPreview();
    }
    
    onMouseMove(data) {
        if (!this.isDefiningGradient) return;
        
        this.endPoint = { x: data.x, y: data.y };
        this.showPreview();
    }
    
    onMouseUp(data) {
        if (this.isDefiningGradient && this.startPoint && this.endPoint) {
            this.applyGradient();
        }
        
        this.clearPreview();
        this.isDefiningGradient = false;
        super.onMouseUp(data);
    }
    
    showPreview() {
        if (!this.startPoint || !this.endPoint) return;
        
        this.clearPreview();
        
        // Draw gradient direction line
        this.previewContext.save();
        this.previewContext.strokeStyle = '#ffffff';
        this.previewContext.lineWidth = 2;
        this.previewContext.setLineDash([5, 5]);
        
        this.previewContext.beginPath();
        this.previewContext.moveTo(this.startPoint.x, this.startPoint.y);
        this.previewContext.lineTo(this.endPoint.x, this.endPoint.y);
        this.previewContext.stroke();
        
        // Draw start and end points
        this.previewContext.fillStyle = '#ffffff';
        this.previewContext.strokeStyle = '#000000';
        this.previewContext.lineWidth = 1;
        this.previewContext.setLineDash([]);
        
        // Start point
        this.previewContext.beginPath();
        this.previewContext.arc(this.startPoint.x, this.startPoint.y, 4, 0, Math.PI * 2);
        this.previewContext.fill();
        this.previewContext.stroke();
        
        // End point
        this.previewContext.beginPath();
        this.previewContext.arc(this.endPoint.x, this.endPoint.y, 4, 0, Math.PI * 2);
        this.previewContext.fill();
        this.previewContext.stroke();
        
        this.previewContext.restore();
    }
    
    clearPreview() {
        this.previewContext.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
    }
    
    applyGradient() {
        const layer = window.fixedImageEditor?.layerManager?.getActiveLayer();
        if (!layer || layer.locked) return;
        
        const gradientDef = this.gradientManager.getActiveGradient();
        if (!gradientDef) return;
        
        const context = layer.context;
        context.save();
        
        // Apply blend mode and opacity
        context.globalCompositeOperation = this.getCompositeOperation(this.properties.blendMode);
        context.globalAlpha = this.properties.opacity;
        
        // Create and apply gradient
        let startPoint = this.startPoint;
        let endPoint = this.endPoint;
        
        if (this.properties.reverse) {
            [startPoint, endPoint] = [endPoint, startPoint];
        }
        
        const gradient = this.gradientManager.createCanvasGradient(
            context, gradientDef, startPoint, endPoint
        );
        
        // Check if we have an active selection
        const selectionManager = window.fixedImageEditor?.selectionToolManager?.getSelectionManager();
        if (selectionManager && selectionManager.hasSelection()) {
            this.applyGradientToSelection(context, gradient, selectionManager.getSelection());
        } else {
            this.applyGradientToLayer(context, gradient);
        }
        
        context.restore();
        window.fixedImageEditor.layerManager.render();
    }
    
    applyGradientToLayer(context, gradient) {
        context.fillStyle = gradient;
        context.fillRect(0, 0, context.canvas.width, context.canvas.height);
    }
    
    applyGradientToSelection(context, gradient, selection) {
        context.save();
        
        // Create clipping path from selection
        if (selection.type === 'rectangle') {
            context.rect(selection.x, selection.y, selection.width, selection.height);
        } else if (selection.type === 'lasso') {
            context.beginPath();
            context.moveTo(selection.points[0].x, selection.points[0].y);
            for (let i = 1; i < selection.points.length; i++) {
                context.lineTo(selection.points[i].x, selection.points[i].y);
            }
            context.closePath();
        }
        
        context.clip();
        context.fillStyle = gradient;
        context.fillRect(0, 0, context.canvas.width, context.canvas.height);
        
        context.restore();
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

class GradientEditor {
    constructor(gradientManager) {
        this.gradientManager = gradientManager;
        this.activeGradient = null;
        this.selectedStop = null;
        this.canvas = null;
        this.context = null;
        this.isDragging = false;
    }
    
    createEditor() {
        const editor = document.createElement('div');
        editor.className = 'gradient-editor';
        editor.style.cssText = `
            padding: 20px;
            background: var(--nebula-surface);
            border-radius: 8px;
            margin-top: 20px;
        `;
        
        editor.innerHTML = `
            <div class="panel-header">
                <h3 class="panel-title">Gradient Editor</h3>
                <div class="gradient-type-selector">
                    <button class="gradient-type-btn active" data-type="linear" title="Linear Gradient">
                        <span class="material-symbols-outlined">linear_scale</span>
                    </button>
                    <button class="gradient-type-btn" data-type="radial" title="Radial Gradient">
                        <span class="material-symbols-outlined">radio_button_unchecked</span>
                    </button>
                    <button class="gradient-type-btn" data-type="conic" title="Conic Gradient">
                        <span class="material-symbols-outlined">donut_large</span>
                    </button>
                </div>
            </div>
            
            <div class="gradient-preview">
                <canvas id="gradient-preview-canvas" width="280" height="40"></canvas>
                <div class="gradient-stops" id="gradient-stops">
                    <!-- Gradient stops will be added here -->
                </div>
            </div>
            
            <div class="gradient-presets">
                <h4 class="section-title">Presets</h4>
                <div class="preset-grid" id="preset-grid">
                    <!-- Presets will be populated here -->
                </div>
            </div>
            
            <div class="stop-editor" id="stop-editor" style="display: none;">
                <h4 class="section-title">Color Stop</h4>
                <div class="property-group">
                    <label class="property-label">Color</label>
                    <input type="color" id="stop-color" class="enhanced-color-picker">
                </div>
                <div class="property-group">
                    <label class="property-label">Position</label>
                    <div class="property-control">
                        <input type="range" id="stop-position" min="0" max="100" value="0" class="enhanced-slider">
                        <span id="stop-position-value" class="property-value">0%</span>
                    </div>
                </div>
                <div class="property-group">
                    <label class="property-label">Alpha</label>
                    <div class="property-control">
                        <input type="range" id="stop-alpha" min="0" max="100" value="100" class="enhanced-slider">
                        <span id="stop-alpha-value" class="property-value">100%</span>
                    </div>
                </div>
                <div class="stop-actions">
                    <button class="enhanced-btn" id="delete-stop">Delete Stop</button>
                </div>
            </div>
            
            <div class="gradient-actions">
                <button class="enhanced-btn" id="add-stop">Add Stop</button>
                <button class="enhanced-btn" id="reverse-gradient">Reverse</button>
                <button class="enhanced-btn primary" id="apply-gradient">Apply</button>
            </div>
        `;
        
        this.canvas = editor.querySelector('#gradient-preview-canvas');
        this.context = this.canvas.getContext('2d');
        
        this.setupEventListeners(editor);
        this.loadDefaultGradient();
        this.populatePresets(editor);
        
        return editor;
    }
    
    setupEventListeners(editor) {
        // Gradient type selection
        editor.querySelectorAll('.gradient-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                editor.querySelectorAll('.gradient-type-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                
                if (this.activeGradient) {
                    this.activeGradient.type = e.currentTarget.dataset.type;
                    this.updatePreview();
                }
            });
        });
        
        // Canvas click for adding stops
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const position = x / this.canvas.width;
            this.addColorStop(position);
        });
        
        // Stop editor controls
        const stopColor = editor.querySelector('#stop-color');
        const stopPosition = editor.querySelector('#stop-position');
        const stopAlpha = editor.querySelector('#stop-alpha');
        
        if (stopColor) {
            stopColor.addEventListener('input', (e) => {
                if (this.selectedStop !== null) {
                    this.activeGradient.stops[this.selectedStop].color = e.target.value;
                    this.updatePreview();
                }
            });
        }
        
        if (stopPosition) {
            stopPosition.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                editor.querySelector('#stop-position-value').textContent = value + '%';
                if (this.selectedStop !== null) {
                    this.activeGradient.stops[this.selectedStop].position = value / 100;
                    this.updatePreview();
                }
            });
        }
        
        if (stopAlpha) {
            stopAlpha.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                editor.querySelector('#stop-alpha-value').textContent = value + '%';
                if (this.selectedStop !== null) {
                    this.activeGradient.stops[this.selectedStop].alpha = value / 100;
                    this.updatePreview();
                }
            });
        }
        
        // Action buttons
        editor.querySelector('#add-stop')?.addEventListener('click', () => {
            this.addColorStop(0.5);
        });
        
        editor.querySelector('#delete-stop')?.addEventListener('click', () => {
            this.deleteSelectedStop();
        });
        
        editor.querySelector('#reverse-gradient')?.addEventListener('click', () => {
            this.reverseGradient();
        });
        
        editor.querySelector('#apply-gradient')?.addEventListener('click', () => {
            this.gradientManager.setActiveGradient(this.activeGradient);
        });
    }
    
    loadDefaultGradient() {
        this.activeGradient = {
            type: 'linear',
            stops: [
                { position: 0, color: '#000000', alpha: 1 },
                { position: 1, color: '#ffffff', alpha: 1 }
            ]
        };
        this.updatePreview();
    }
    
    populatePresets(editor) {
        const presetGrid = editor.querySelector('#preset-grid');
        if (!presetGrid) return;
        
        this.gradientManager.presets.forEach(preset => {
            const presetBtn = document.createElement('button');
            presetBtn.className = 'preset-btn';
            presetBtn.title = preset.name;
            presetBtn.style.cssText = `
                width: 60px;
                height: 30px;
                border: 1px solid var(--nebula-border);
                border-radius: 4px;
                cursor: pointer;
                margin: 2px;
            `;
            
            // Create mini gradient preview
            const canvas = document.createElement('canvas');
            canvas.width = 60;
            canvas.height = 30;
            const ctx = canvas.getContext('2d');
            
            const gradient = this.gradientManager.createCanvasGradient(
                ctx, preset, { x: 0, y: 15 }, { x: 60, y: 15 }
            );
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 60, 30);
            
            presetBtn.style.backgroundImage = `url(${canvas.toDataURL()})`;
            presetBtn.style.backgroundSize = 'cover';
            
            presetBtn.addEventListener('click', () => {
                this.loadPreset(preset);
            });
            
            presetGrid.appendChild(presetBtn);
        });
    }
    
    loadPreset(preset) {
        this.activeGradient = JSON.parse(JSON.stringify(preset)); // Deep copy
        this.updatePreview();
        this.selectedStop = null;
        this.hideStopEditor();
    }
    
    updatePreview() {
        if (!this.activeGradient) return;
        
        // Clear canvas
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Create gradient
        const gradient = this.gradientManager.createCanvasGradient(
            this.context, this.activeGradient,
            { x: 0, y: 20 }, { x: this.canvas.width, y: 20 }
        );
        
        // Fill canvas
        this.context.fillStyle = gradient;
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update stops display
        this.updateStopsDisplay();
    }
    
    updateStopsDisplay() {
        const stopsContainer = document.querySelector('#gradient-stops');
        if (!stopsContainer) return;
        
        stopsContainer.innerHTML = '';
        
        this.activeGradient.stops.forEach((stop, index) => {
            const stopElement = document.createElement('div');
            stopElement.className = 'gradient-stop';
            stopElement.style.cssText = `
                position: absolute;
                left: ${stop.position * 100}%;
                top: -5px;
                width: 10px;
                height: 10px;
                background: ${stop.color};
                border: 2px solid #fff;
                border-radius: 50%;
                cursor: pointer;
                transform: translateX(-50%);
                z-index: 10;
            `;
            
            stopElement.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectStop(index);
            });
            
            stopsContainer.appendChild(stopElement);
        });
    }
    
    selectStop(index) {
        this.selectedStop = index;
        const stop = this.activeGradient.stops[index];
        
        // Update stop editor
        const stopEditor = document.querySelector('#stop-editor');
        const stopColor = document.querySelector('#stop-color');
        const stopPosition = document.querySelector('#stop-position');
        const stopAlpha = document.querySelector('#stop-alpha');
        
        if (stopEditor) stopEditor.style.display = 'block';
        if (stopColor) stopColor.value = stop.color;
        if (stopPosition) {
            stopPosition.value = Math.round(stop.position * 100);
            document.querySelector('#stop-position-value').textContent = Math.round(stop.position * 100) + '%';
        }
        if (stopAlpha) {
            stopAlpha.value = Math.round(stop.alpha * 100);
            document.querySelector('#stop-alpha-value').textContent = Math.round(stop.alpha * 100) + '%';
        }
    }
    
    hideStopEditor() {
        const stopEditor = document.querySelector('#stop-editor');
        if (stopEditor) stopEditor.style.display = 'none';
    }
    
    addColorStop(position) {
        const color = this.interpolateColorAtPosition(position);
        const newStop = {
            position: Math.max(0, Math.min(1, position)),
            color: color,
            alpha: 1
        };
        
        // Insert stop in correct position
        let insertIndex = this.activeGradient.stops.length;
        for (let i = 0; i < this.activeGradient.stops.length; i++) {
            if (this.activeGradient.stops[i].position > position) {
                insertIndex = i;
                break;
            }
        }
        
        this.activeGradient.stops.splice(insertIndex, 0, newStop);
        this.updatePreview();
        this.selectStop(insertIndex);
    }
    
    interpolateColorAtPosition(position) {
        // Find surrounding stops and interpolate color
        const stops = this.activeGradient.stops;
        
        for (let i = 0; i < stops.length - 1; i++) {
            if (position >= stops[i].position && position <= stops[i + 1].position) {
                const factor = (position - stops[i].position) / (stops[i + 1].position - stops[i].position);
                return this.interpolateColors(stops[i].color, stops[i + 1].color, factor);
            }
        }
        
        return stops[0].color;
    }
    
    interpolateColors(color1, color2, factor) {
        const c1 = this.gradientManager.parseColor(color1);
        const c2 = this.gradientManager.parseColor(color2);
        
        const r = Math.round(c1.r + (c2.r - c1.r) * factor);
        const g = Math.round(c1.g + (c2.g - c1.g) * factor);
        const b = Math.round(c1.b + (c2.b - c1.b) * factor);
        
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    deleteSelectedStop() {
        if (this.selectedStop !== null && this.activeGradient.stops.length > 2) {
            this.activeGradient.stops.splice(this.selectedStop, 1);
            this.selectedStop = null;
            this.hideStopEditor();
            this.updatePreview();
        }
    }
    
    reverseGradient() {
        this.activeGradient.stops.forEach(stop => {
            stop.position = 1 - stop.position;
        });
        this.activeGradient.stops.reverse();
        this.updatePreview();
    }
}

// Gradient Fill Panel
class GradientFillPanel {
    constructor(gradientManager) {
        this.gradientManager = gradientManager;
        this.gradientEditor = new GradientEditor(gradientManager);
    }
    
    createPanel() {
        const panel = document.createElement('div');
        panel.className = 'gradient-fill-panel';
        panel.style.cssText = `
            padding: 20px;
            background: var(--nebula-surface);
            border-radius: 8px;
            margin-top: 20px;
        `;
        
        panel.innerHTML = `
            <div class="panel-header">
                <h3 class="panel-title">Gradient Fill</h3>
            </div>
            
            <div class="fill-properties">
                <div class="property-group">
                    <label class="property-label">Blend Mode</label>
                    <select id="gradient-blend-mode" class="enhanced-select">
                        <option value="normal">Normal</option>
                        <option value="multiply">Multiply</option>
                        <option value="screen">Screen</option>
                        <option value="overlay">Overlay</option>
                        <option value="darken">Darken</option>
                        <option value="lighten">Lighten</option>
                        <option value="color-dodge">Color Dodge</option>
                        <option value="color-burn">Color Burn</option>
                        <option value="hard-light">Hard Light</option>
                        <option value="soft-light">Soft Light</option>
                        <option value="difference">Difference</option>
                        <option value="exclusion">Exclusion</option>
                    </select>
                </div>
                
                <div class="property-group">
                    <label class="property-label">Opacity</label>
                    <div class="property-control">
                        <input type="range" id="gradient-opacity" min="0" max="100" value="100" class="enhanced-slider">
                        <span id="gradient-opacity-value" class="property-value">100%</span>
                    </div>
                </div>
                
                <div class="property-group checkbox-group">
                    <label class="checkbox-label">
                        <input type="checkbox" id="gradient-reverse">
                        <span class="checkmark"></span>
                        Reverse Direction
                    </label>
                </div>
                
                <div class="property-group checkbox-group">
                    <label class="checkbox-label">
                        <input type="checkbox" id="gradient-dither">
                        <span class="checkmark"></span>
                        Dither
                    </label>
                </div>
            </div>
        `;
        
        // Add gradient editor
        const editorElement = this.gradientEditor.createEditor();
        panel.appendChild(editorElement);
        
        this.setupEventListeners(panel);
        return panel;
    }
    
    setupEventListeners(panel) {
        // Blend mode
        const blendModeSelect = panel.querySelector('#gradient-blend-mode');
        if (blendModeSelect) {
            blendModeSelect.addEventListener('change', (e) => {
                // Update gradient fill tool properties
                if (window.fixedImageEditor?.toolManager?.activeTool?.name === 'gradient_fill') {
                    window.fixedImageEditor.toolManager.activeTool.properties.blendMode = e.target.value;
                }
            });
        }
        
        // Opacity
        const opacitySlider = panel.querySelector('#gradient-opacity');
        const opacityValue = panel.querySelector('#gradient-opacity-value');
        if (opacitySlider && opacityValue) {
            opacitySlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                opacityValue.textContent = value + '%';
                
                if (window.fixedImageEditor?.toolManager?.activeTool?.name === 'gradient_fill') {
                    window.fixedImageEditor.toolManager.activeTool.properties.opacity = value / 100;
                }
            });
        }
        
        // Reverse checkbox
        const reverseCheckbox = panel.querySelector('#gradient-reverse');
        if (reverseCheckbox) {
            reverseCheckbox.addEventListener('change', (e) => {
                if (window.fixedImageEditor?.toolManager?.activeTool?.name === 'gradient_fill') {
                    window.fixedImageEditor.toolManager.activeTool.properties.reverse = e.target.checked;
                }
            });
        }
        
        // Dither checkbox
        const ditherCheckbox = panel.querySelector('#gradient-dither');
        if (ditherCheckbox) {
            ditherCheckbox.addEventListener('change', (e) => {
                if (window.fixedImageEditor?.toolManager?.activeTool?.name === 'gradient_fill') {
                    window.fixedImageEditor.toolManager.activeTool.properties.dither = e.target.checked;
                }
            });
        }
    }
}

// Export classes
window.GradientManager = GradientManager;
window.GradientFillTool = GradientFillTool;
window.GradientEditor = GradientEditor;
window.GradientFillPanel = GradientFillPanel;

