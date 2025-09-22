// Advanced Drawing Tools with Brush Settings and Stabilization
// This module extends the basic drawing tools with advanced features

class AdvancedBrushTool extends Tool {
    constructor(eventManager) {
        super('advanced_brush', eventManager);
        this.points = [];
        this.stabilizer = new BrushStabilizer();
        this.pressureSimulator = new PressureSimulator();
        
        // Advanced brush properties
        this.properties = {
            ...this.properties,
            hardness: 0.8,
            spacing: 0.1,
            scattering: 0,
            rotation: 0,
            flowRate: 1.0,
            smoothing: 0.5,
            pressureSensitivity: true,
            stabilization: true,
            stabilizationLevel: 5,
            brushShape: 'round', // round, square, custom
            texture: null,
            dualBrush: false,
            colorDynamics: false
        };
    }
    
    onMouseDown(data) {
        super.onMouseDown(data);
        this.points = [];
        this.stabilizer.reset();
        
        const pressure = this.pressureSimulator.getPressure(data.event);
        const point = { x: data.x, y: data.y, pressure, timestamp: Date.now() };
        
        if (this.properties.stabilization) {
            this.stabilizer.addPoint(point);
        } else {
            this.addPoint(point);
        }
    }
    
    onMouseMove(data) {
        if (!this.isDrawing) return;
        
        const pressure = this.pressureSimulator.getPressure(data.event);
        const point = { x: data.x, y: data.y, pressure, timestamp: Date.now() };
        
        if (this.properties.stabilization) {
            this.stabilizer.addPoint(point);
            const stabilizedPoints = this.stabilizer.getStabilizedPoints();
            stabilizedPoints.forEach(p => this.addPoint(p));
        } else {
            this.addPoint(point);
        }
    }
    
    onMouseUp(data) {
        if (this.isDrawing) {
            // Flush any remaining stabilized points
            if (this.properties.stabilization) {
                const finalPoints = this.stabilizer.flush();
                finalPoints.forEach(p => this.addPoint(p));
            }
        }
        super.onMouseUp(data);
    }
    
    addPoint(point) {
        this.points.push(point);
        
        if (this.points.length >= 2) {
            const layer = window.fixedImageEditor?.layerManager?.getActiveLayer();
            if (layer && !layer.locked) {
                this.drawStroke(layer.context, this.points[this.points.length - 2], point);
                window.fixedImageEditor.layerManager.render();
            }
        } else if (this.points.length === 1) {
            // Draw initial dot
            const layer = window.fixedImageEditor?.layerManager?.getActiveLayer();
            if (layer && !layer.locked) {
                this.drawDot(layer.context, point);
                window.fixedImageEditor.layerManager.render();
            }
        }
    }
    
    drawStroke(context, fromPoint, toPoint) {
        context.save();
        
        // Calculate dynamic properties based on pressure
        const avgPressure = (fromPoint.pressure + toPoint.pressure) / 2;
        const dynamicSize = this.properties.pressureSensitivity ? 
            this.properties.size * (0.3 + 0.7 * avgPressure) : this.properties.size;
        const dynamicOpacity = this.properties.opacity * this.properties.flowRate * avgPressure;
        
        // Set up brush properties
        context.globalAlpha = dynamicOpacity;
        context.strokeStyle = this.properties.color;
        context.lineWidth = dynamicSize;
        context.lineCap = 'round';
        context.lineJoin = 'round';
        
        // Apply hardness (simulate soft brush edges)
        if (this.properties.hardness < 1.0) {
            const gradient = context.createRadialGradient(0, 0, 0, 0, 0, dynamicSize / 2);
            const alpha = this.properties.hardness;
            gradient.addColorStop(0, this.properties.color);
            gradient.addColorStop(alpha, this.properties.color);
            gradient.addColorStop(1, this.properties.color + '00'); // Transparent
            context.strokeStyle = gradient;
        }
        
        // Draw the stroke
        context.beginPath();
        context.moveTo(fromPoint.x, fromPoint.y);
        context.lineTo(toPoint.x, toPoint.y);
        context.stroke();
        
        context.restore();
    }
    
    drawDot(context, point) {
        context.save();
        
        const dynamicSize = this.properties.pressureSensitivity ? 
            this.properties.size * (0.3 + 0.7 * point.pressure) : this.properties.size;
        const dynamicOpacity = this.properties.opacity * this.properties.flowRate * point.pressure;
        
        context.globalAlpha = dynamicOpacity;
        context.fillStyle = this.properties.color;
        
        if (this.properties.hardness < 1.0) {
            const gradient = context.createRadialGradient(
                point.x, point.y, 0,
                point.x, point.y, dynamicSize / 2
            );
            const alpha = this.properties.hardness;
            gradient.addColorStop(0, this.properties.color);
            gradient.addColorStop(alpha, this.properties.color);
            gradient.addColorStop(1, this.properties.color + '00');
            context.fillStyle = gradient;
        }
        
        context.beginPath();
        context.arc(point.x, point.y, dynamicSize / 2, 0, Math.PI * 2);
        context.fill();
        
        context.restore();
    }
}

class BrushStabilizer {
    constructor() {
        this.points = [];
        this.maxPoints = 10;
        this.smoothingFactor = 0.5;
    }
    
    reset() {
        this.points = [];
    }
    
    addPoint(point) {
        this.points.push(point);
        if (this.points.length > this.maxPoints) {
            this.points.shift();
        }
    }
    
    getStabilizedPoints() {
        if (this.points.length < 3) return [];
        
        const stabilized = [];
        const recent = this.points.slice(-3);
        
        // Apply smoothing using weighted average
        for (let i = 1; i < recent.length - 1; i++) {
            const prev = recent[i - 1];
            const curr = recent[i];
            const next = recent[i + 1];
            
            const smoothedX = prev.x * 0.25 + curr.x * 0.5 + next.x * 0.25;
            const smoothedY = prev.y * 0.25 + curr.y * 0.5 + next.y * 0.25;
            const smoothedPressure = prev.pressure * 0.25 + curr.pressure * 0.5 + next.pressure * 0.25;
            
            stabilized.push({
                x: smoothedX,
                y: smoothedY,
                pressure: smoothedPressure,
                timestamp: curr.timestamp
            });
        }
        
        return stabilized;
    }
    
    flush() {
        // Return any remaining points for final drawing
        return this.points.slice(-2);
    }
}

class PressureSimulator {
    constructor() {
        this.simulatedPressure = 1.0;
        this.velocityHistory = [];
    }
    
    getPressure(event) {
        // Check for actual pressure from stylus/tablet
        if (event.pressure !== undefined && event.pressure > 0) {
            return event.pressure;
        }
        
        // Simulate pressure based on mouse velocity for mouse users
        return this.simulatePressureFromVelocity(event);
    }
    
    simulatePressureFromVelocity(event) {
        const now = Date.now();
        const currentPos = { x: event.clientX, y: event.clientY, time: now };
        
        this.velocityHistory.push(currentPos);
        if (this.velocityHistory.length > 5) {
            this.velocityHistory.shift();
        }
        
        if (this.velocityHistory.length < 2) {
            return 1.0;
        }
        
        // Calculate velocity
        const recent = this.velocityHistory.slice(-2);
        const dx = recent[1].x - recent[0].x;
        const dy = recent[1].y - recent[0].y;
        const dt = recent[1].time - recent[0].time;
        
        if (dt === 0) return this.simulatedPressure;
        
        const velocity = Math.sqrt(dx * dx + dy * dy) / dt;
        
        // Convert velocity to pressure (slower = more pressure)
        const maxVelocity = 2.0; // pixels per millisecond
        const pressureFromVelocity = Math.max(0.1, 1.0 - Math.min(velocity / maxVelocity, 1.0));
        
        // Smooth the pressure change
        this.simulatedPressure = this.simulatedPressure * 0.7 + pressureFromVelocity * 0.3;
        
        return Math.max(0.1, Math.min(1.0, this.simulatedPressure));
    }
}

class TextureBrush extends AdvancedBrushTool {
    constructor(eventManager) {
        super(eventManager);
        this.name = 'texture_brush';
        this.textureCanvas = null;
        this.texturePattern = null;
    }
    
    setTexture(imageData) {
        this.textureCanvas = document.createElement('canvas');
        this.textureCanvas.width = imageData.width;
        this.textureCanvas.height = imageData.height;
        
        const ctx = this.textureCanvas.getContext('2d');
        ctx.putImageData(imageData, 0, 0);
        
        // Create pattern for brush texture
        this.texturePattern = ctx.createPattern(this.textureCanvas, 'repeat');
    }
    
    drawStroke(context, fromPoint, toPoint) {
        if (!this.texturePattern) {
            super.drawStroke(context, fromPoint, toPoint);
            return;
        }
        
        context.save();
        
        const avgPressure = (fromPoint.pressure + toPoint.pressure) / 2;
        const dynamicSize = this.properties.pressureSensitivity ? 
            this.properties.size * (0.3 + 0.7 * avgPressure) : this.properties.size;
        const dynamicOpacity = this.properties.opacity * this.properties.flowRate * avgPressure;
        
        context.globalAlpha = dynamicOpacity;
        context.strokeStyle = this.texturePattern;
        context.lineWidth = dynamicSize;
        context.lineCap = 'round';
        context.lineJoin = 'round';
        
        context.beginPath();
        context.moveTo(fromPoint.x, fromPoint.y);
        context.lineTo(toPoint.x, toPoint.y);
        context.stroke();
        
        context.restore();
    }
}

class CalligraphyBrush extends AdvancedBrushTool {
    constructor(eventManager) {
        super(eventManager);
        this.name = 'calligraphy_brush';
        this.properties.rotation = 45; // Default angle
        this.properties.aspectRatio = 0.3; // Width to height ratio
    }
    
    drawStroke(context, fromPoint, toPoint) {
        context.save();
        
        const avgPressure = (fromPoint.pressure + toPoint.pressure) / 2;
        const dynamicSize = this.properties.pressureSensitivity ? 
            this.properties.size * (0.3 + 0.7 * avgPressure) : this.properties.size;
        const dynamicOpacity = this.properties.opacity * this.properties.flowRate * avgPressure;
        
        // Calculate stroke direction for dynamic rotation
        const dx = toPoint.x - fromPoint.x;
        const dy = toPoint.y - fromPoint.y;
        const strokeAngle = Math.atan2(dy, dx);
        
        // Create calligraphy brush shape
        const brushWidth = dynamicSize;
        const brushHeight = dynamicSize * this.properties.aspectRatio;
        
        context.globalAlpha = dynamicOpacity;
        context.fillStyle = this.properties.color;
        
        // Draw calligraphic stroke as a series of rotated ellipses
        const steps = Math.max(1, Math.floor(Math.sqrt(dx * dx + dy * dy) / 2));
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = fromPoint.x + dx * t;
            const y = fromPoint.y + dy * t;
            
            context.save();
            context.translate(x, y);
            context.rotate(this.properties.rotation * Math.PI / 180);
            
            context.beginPath();
            context.ellipse(0, 0, brushWidth / 2, brushHeight / 2, 0, 0, Math.PI * 2);
            context.fill();
            
            context.restore();
        }
        
        context.restore();
    }
}

class AirbrushTool extends AdvancedBrushTool {
    constructor(eventManager) {
        super(eventManager);
        this.name = 'airbrush';
        this.sprayTimer = null;
        this.sprayInterval = 50; // milliseconds
    }
    
    onMouseDown(data) {
        super.onMouseDown(data);
        this.startSpraying(data);
    }
    
    onMouseMove(data) {
        super.onMouseMove(data);
        this.currentSprayPoint = data;
    }
    
    onMouseUp(data) {
        super.onMouseUp(data);
        this.stopSpraying();
    }
    
    startSpraying(data) {
        this.currentSprayPoint = data;
        this.sprayTimer = setInterval(() => {
            if (this.isDrawing && this.currentSprayPoint) {
                this.sprayPaint(this.currentSprayPoint);
            }
        }, this.sprayInterval);
    }
    
    stopSpraying() {
        if (this.sprayTimer) {
            clearInterval(this.sprayTimer);
            this.sprayTimer = null;
        }
    }
    
    sprayPaint(point) {
        const layer = window.fixedImageEditor?.layerManager?.getActiveLayer();
        if (!layer || layer.locked) return;
        
        const context = layer.context;
        context.save();
        
        const pressure = this.pressureSimulator.getPressure({ pressure: point.pressure });
        const dynamicSize = this.properties.pressureSensitivity ? 
            this.properties.size * (0.3 + 0.7 * pressure) : this.properties.size;
        const sprayRadius = dynamicSize / 2;
        const sprayDensity = Math.floor(sprayRadius * 2);
        
        context.globalAlpha = this.properties.opacity * 0.1; // Lower opacity for spray effect
        context.fillStyle = this.properties.color;
        
        // Create spray pattern
        for (let i = 0; i < sprayDensity; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * sprayRadius;
            const x = point.x + Math.cos(angle) * distance;
            const y = point.y + Math.sin(angle) * distance;
            
            context.beginPath();
            context.arc(x, y, 0.5, 0, Math.PI * 2);
            context.fill();
        }
        
        context.restore();
        window.fixedImageEditor.layerManager.render();
    }
}

class AdvancedToolManager extends ToolManager {
    constructor(eventManager) {
        super(eventManager);
        this.initializeAdvancedTools();
    }
    
    initializeAdvancedTools() {
        // Add advanced tools to existing tools
        this.tools.set('advanced_brush', new AdvancedBrushTool(this.eventManager));
        this.tools.set('texture_brush', new TextureBrush(this.eventManager));
        this.tools.set('calligraphy_brush', new CalligraphyBrush(this.eventManager));
        this.tools.set('airbrush', new AirbrushTool(this.eventManager));
    }
    
    setBrushProperty(property, value) {
        if (this.activeTool && this.activeTool instanceof AdvancedBrushTool) {
            this.activeTool.properties[property] = value;
            this.eventManager.emit('brushPropertyChanged', { property, value });
        }
    }
    
    getBrushProperty(property) {
        if (this.activeTool && this.activeTool instanceof AdvancedBrushTool) {
            return this.activeTool.properties[property];
        }
        return null;
    }
}

// Advanced Brush Settings Panel
class AdvancedBrushPanel {
    constructor(toolManager) {
        this.toolManager = toolManager;
    }
    
    createPanel() {
        const panel = document.createElement('div');
        panel.className = 'advanced-brush-panel';
        panel.style.cssText = `
            padding: 20px;
            background: var(--nebula-surface);
            border-radius: 8px;
            margin-top: 20px;
        `;
        
        panel.innerHTML = `
            <div class="panel-header">
                <h3 class="panel-title">Advanced Brush Settings</h3>
            </div>
            
            <div class="brush-type-selector">
                <label class="property-label">Brush Type</label>
                <div class="brush-type-grid">
                    <button class="brush-type-btn active" data-brush="advanced_brush" title="Advanced Brush">
                        <span class="material-symbols-outlined">brush</span>
                        <span>Advanced</span>
                    </button>
                    <button class="brush-type-btn" data-brush="texture_brush" title="Texture Brush">
                        <span class="material-symbols-outlined">texture</span>
                        <span>Texture</span>
                    </button>
                    <button class="brush-type-btn" data-brush="calligraphy_brush" title="Calligraphy">
                        <span class="material-symbols-outlined">edit</span>
                        <span>Calligraphy</span>
                    </button>
                    <button class="brush-type-btn" data-brush="airbrush" title="Airbrush">
                        <span class="material-symbols-outlined">air</span>
                        <span>Airbrush</span>
                    </button>
                </div>
            </div>
            
            <div class="advanced-properties">
                <div class="property-group">
                    <label class="property-label">Hardness</label>
                    <div class="property-control">
                        <input type="range" id="brush-hardness" min="0" max="100" value="80" class="enhanced-slider">
                        <span id="brush-hardness-value" class="property-value">80%</span>
                    </div>
                </div>
                
                <div class="property-group">
                    <label class="property-label">Flow Rate</label>
                    <div class="property-control">
                        <input type="range" id="brush-flow" min="0" max="100" value="100" class="enhanced-slider">
                        <span id="brush-flow-value" class="property-value">100%</span>
                    </div>
                </div>
                
                <div class="property-group">
                    <label class="property-label">Smoothing</label>
                    <div class="property-control">
                        <input type="range" id="brush-smoothing" min="0" max="100" value="50" class="enhanced-slider">
                        <span id="brush-smoothing-value" class="property-value">50%</span>
                    </div>
                </div>
                
                <div class="property-group">
                    <label class="property-label">Stabilization Level</label>
                    <div class="property-control">
                        <input type="range" id="brush-stabilization" min="0" max="20" value="5" class="enhanced-slider">
                        <span id="brush-stabilization-value" class="property-value">5</span>
                    </div>
                </div>
                
                <div class="property-group checkbox-group">
                    <label class="checkbox-label">
                        <input type="checkbox" id="pressure-sensitivity" checked>
                        <span class="checkmark"></span>
                        Pressure Sensitivity
                    </label>
                </div>
                
                <div class="property-group checkbox-group">
                    <label class="checkbox-label">
                        <input type="checkbox" id="brush-stabilization-enabled" checked>
                        <span class="checkmark"></span>
                        Brush Stabilization
                    </label>
                </div>
            </div>
            
            <div class="brush-dynamics">
                <h4 class="section-title">Brush Dynamics</h4>
                
                <div class="property-group">
                    <label class="property-label">Rotation</label>
                    <div class="property-control">
                        <input type="range" id="brush-rotation" min="0" max="360" value="0" class="enhanced-slider">
                        <span id="brush-rotation-value" class="property-value">0°</span>
                    </div>
                </div>
                
                <div class="property-group">
                    <label class="property-label">Scattering</label>
                    <div class="property-control">
                        <input type="range" id="brush-scattering" min="0" max="100" value="0" class="enhanced-slider">
                        <span id="brush-scattering-value" class="property-value">0%</span>
                    </div>
                </div>
                
                <div class="property-group">
                    <label class="property-label">Spacing</label>
                    <div class="property-control">
                        <input type="range" id="brush-spacing" min="1" max="100" value="10" class="enhanced-slider">
                        <span id="brush-spacing-value" class="property-value">10%</span>
                    </div>
                </div>
            </div>
        `;
        
        this.setupEventListeners(panel);
        return panel;
    }
    
    setupEventListeners(panel) {
        // Brush type selection
        panel.querySelectorAll('.brush-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                panel.querySelectorAll('.brush-type-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                
                const brushType = e.currentTarget.dataset.brush;
                this.toolManager.setActiveTool(brushType);
            });
        });
        
        // Property sliders
        const properties = [
            'hardness', 'flow', 'smoothing', 'stabilization', 
            'rotation', 'scattering', 'spacing'
        ];
        
        properties.forEach(prop => {
            const slider = panel.querySelector(`#brush-${prop}`);
            const valueDisplay = panel.querySelector(`#brush-${prop}-value`);
            
            if (slider && valueDisplay) {
                slider.addEventListener('input', (e) => {
                    const value = parseInt(e.target.value);
                    const unit = prop === 'rotation' ? '°' : '%';
                    valueDisplay.textContent = value + unit;
                    
                    // Convert percentage to decimal for some properties
                    const normalizedValue = ['hardness', 'flow', 'smoothing', 'scattering', 'spacing'].includes(prop) 
                        ? value / 100 : value;
                    
                    this.toolManager.setBrushProperty(prop, normalizedValue);
                });
            }
        });
        
        // Checkboxes
        const pressureSensitivity = panel.querySelector('#pressure-sensitivity');
        const stabilizationEnabled = panel.querySelector('#brush-stabilization-enabled');
        
        if (pressureSensitivity) {
            pressureSensitivity.addEventListener('change', (e) => {
                this.toolManager.setBrushProperty('pressureSensitivity', e.target.checked);
            });
        }
        
        if (stabilizationEnabled) {
            stabilizationEnabled.addEventListener('change', (e) => {
                this.toolManager.setBrushProperty('stabilization', e.target.checked);
            });
        }
    }
}

// Export classes for use
window.AdvancedBrushTool = AdvancedBrushTool;
window.AdvancedToolManager = AdvancedToolManager;
window.AdvancedBrushPanel = AdvancedBrushPanel;
window.BrushStabilizer = BrushStabilizer;
window.PressureSimulator = PressureSimulator;
window.TextureBrush = TextureBrush;
window.CalligraphyBrush = CalligraphyBrush;
window.AirbrushTool = AirbrushTool;

