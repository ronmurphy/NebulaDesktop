// Nebula Image Editor Pro - Complete Integration
// This is the final comprehensive image editor with all advanced features

// Core Manager Classes
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

// Advanced Drawing Tools
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

// Selection Tools
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

// Gradient Manager
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

// Tilt Processor
class TiltProcessor {
    constructor(options = {}) {
        this.options = {
            tiltInfluence: options.tiltInfluence || 0.5,
            tiltSmoothing: options.tiltSmoothing || 0.3,
            maxTiltAngle: options.maxTiltAngle || 60, // degrees
            ...options
        };

        this.tiltHistory = [];
    }

    processTilt(inputData) {
        const tilt = {
            x: this.smoothTilt(inputData.tiltX, 'x'),
            y: this.smoothTilt(inputData.tiltY, 'y'),
            angle: this.calculateTiltAngle(inputData.tiltX, inputData.tiltY),
            magnitude: this.calculateTiltMagnitude(inputData.tiltX, inputData.tiltY)
        };

        return tilt;
    }

    smoothTilt(tiltValue, axis) {
        if (!this.tiltHistory[axis]) {
            this.tiltHistory[axis] = [];
        }

        this.tiltHistory[axis].push(tiltValue);
        if (this.tiltHistory[axis].length > 3) {
            this.tiltHistory[axis].shift();
        }

        // Simple moving average
        return this.tiltHistory[axis].reduce((sum, val) => sum + val, 0) / this.tiltHistory[axis].length;
    }

    calculateTiltAngle(tiltX, tiltY) {
        // Calculate the angle of tilt in degrees
        return Math.atan2(tiltY, tiltX) * (180 / Math.PI);
    }

    calculateTiltMagnitude(tiltX, tiltY) {
        // Calculate the magnitude of tilt
        return Math.sqrt(tiltX * tiltX + tiltY * tiltY);
    }
}

// Stylus Tablet Manager
class StylusTabletManager {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.tabletInput = new TabletInputManager(eventManager);
        this.stabilizer = new AdvancedStabilizer();
        this.pressureProcessor = new PressureProcessor();
        this.tiltProcessor = new TiltProcessor();

        this.isEnabled = true;
        this.settings = {
            stabilizationLevel: 5,
            pressureSensitivity: 1.0,
            tiltSensitivity: 0.5,
            enablePrediction: true,
            enableVelocitySmoothing: true
        };
    }

    processInput(event) {
        if (!this.isEnabled) {
            return this.createBasicInputData(event);
        }

        // Extract raw input data
        const rawInput = this.tabletInput.processInputEvent(event);

        // Process pressure
        rawInput.pressure = this.pressureProcessor.processPressure(rawInput);

        // Process tilt
        rawInput.tilt = this.tiltProcessor.processTilt(rawInput);

        // Apply stabilization
        const stabilizedPoints = this.stabilizer.addPoint(rawInput);

        return stabilizedPoints.length > 0 ? stabilizedPoints[stabilizedPoints.length - 1] : rawInput;
    }

    createBasicInputData(event) {
        return {
            x: event.clientX || event.touches?.[0]?.clientX || 0,
            y: event.clientY || event.touches?.[0]?.clientY || 0,
            pressure: event.pressure || 0.5,
            tiltX: 0,
            tiltY: 0,
            rotation: 0,
            timestamp: Date.now()
        };
    }

    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };

        // Update stabilizer options
        this.stabilizer.setOptions({
            smoothingLevel: this.settings.stabilizationLevel,
            predictionStrength: this.settings.enablePrediction ? 0.3 : 0,
            velocitySmoothing: this.settings.enableVelocitySmoothing
        });

        // Update pressure processor
        this.pressureProcessor.options.pressureSmoothing = this.settings.pressureSensitivity;

        // Update tilt processor
        this.tiltProcessor.options.tiltInfluence = this.settings.tiltSensitivity;
    }

    calibrateTablet() {
        return this.tabletInput.startCalibration();
    }

    reset() {
        this.stabilizer.reset();
        this.pressureProcessor.pressureHistory = [];
        this.pressureProcessor.velocityHistory = [];
        this.tiltProcessor.tiltHistory = [];
    }

    enable() {
        this.isEnabled = true;
        this.eventManager.emit('stylusTabletEnabled');
    }

    disable() {
        this.isEnabled = false;
        this.reset();
        this.eventManager.emit('stylusTabletDisabled');
    }

    getStatus() {
        return {
            isEnabled: this.isEnabled,
            isTabletConnected: this.tabletInput.isTabletConnected,
            supportedEvents: Array.from(this.tabletInput.supportedEvents),
            settings: this.settings
        };
    }
}

// 3D Reference Modal
class ThreeJSReferenceModal {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.modal = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.loadedModel = null;
        this.lights = [];
        this.isVisible = false;

        // Scene settings
        this.sceneSettings = {
            backgroundColor: '#2a2a2a',
            ambientLightIntensity: 0.4,
            directionalLightIntensity: 0.8,
            enableShadows: true,
            enableGrid: true,
            gridSize: 10,
            cameraFov: 75,
            cameraNear: 0.1,
            cameraFar: 1000
        };

        // Model settings
        this.modelSettings = {
            scale: { x: 1, y: 1, z: 1 },
            rotation: { x: 0, y: 0, z: 0 },
            position: { x: 0, y: 0, z: 0 },
            wireframe: false,
            material: 'default'
        };

        this.loadThreeJS();
    }

    async loadThreeJS() {
        // Load Three.js from CDN
        if (typeof THREE === 'undefined') {
            await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js');
        }

        // Load additional Three.js modules
        await this.loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js');
        await this.loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js');
        await this.loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/OBJLoader.js');
        await this.loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/FBXLoader.js');

        console.log('Three.js loaded successfully');
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'threejs-reference-modal';
        this.modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 1000;
            display: none;
            backdrop-filter: blur(5px);
        `;

        this.modal.innerHTML = `
            <div class="modal-content" style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 90%;
                height: 90%;
                background: var(--nebula-surface);
                border-radius: 12px;
                display: flex;
                overflow: hidden;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            ">
                <div class="threejs-viewport" style="
                    flex: 1;
                    position: relative;
                    background: #2a2a2a;
                ">
                    <canvas id="threejs-canvas" style="
                        width: 100%;
                        height: 100%;
                        display: block;
                    "></canvas>

                    <div class="viewport-controls" style="
                        position: absolute;
                        top: 20px;
                        left: 20px;
                        display: flex;
                        gap: 10px;
                    ">
                        <button class="viewport-btn" id="reset-camera" title="Reset Camera">
                            <span class="material-symbols-outlined">3d_rotation</span>
                        </button>
                        <button class="viewport-btn" id="toggle-wireframe" title="Toggle Wireframe">
                            <span class="material-symbols-outlined">grid_on</span>
                        </button>
                        <button class="viewport-btn" id="toggle-grid" title="Toggle Grid">
                            <span class="material-symbols-outlined">grid_4x4</span>
                        </button>
                    </div>

                    <div class="capture-controls" style="
                        position: absolute;
                        bottom: 20px;
                        right: 20px;
                        display: flex;
                        gap: 10px;
                    ">
                        <button class="enhanced-btn primary" id="capture-render">
                            <span class="material-symbols-outlined">camera_alt</span>
                            Capture as Layer
                        </button>
                    </div>
                </div>

                <div class="control-panel" style="
                    width: 350px;
                    background: var(--nebula-background);
                    padding: 20px;
                    overflow-y: auto;
                    border-left: 1px solid var(--nebula-border);
                ">
                    <div class="panel-header" style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 20px;
                    ">
                        <h3 class="panel-title">3D Reference</h3>
                        <button class="close-btn" id="close-modal" style="
                            background: none;
                            border: none;
                            color: var(--nebula-text);
                            cursor: pointer;
                            font-size: 24px;
                        ">
                            <span class="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    <div class="model-loader">
                        <h4 class="section-title">Load Model</h4>
                        <div class="file-input-wrapper">
                            <input type="file" id="model-file-input" accept=".gltf,.glb,.obj,.fbx" style="display: none;">
                            <button class="enhanced-btn" id="load-model-btn">
                                <span class="material-symbols-outlined">upload</span>
                                Load 3D Model
                            </button>
                        </div>

                        <div class="preset-models">
                            <h5 class="subsection-title">Preset Models</h5>
                            <div class="preset-grid">
                                <button class="preset-model-btn" data-model="cube">Cube</button>
                                <button class="preset-model-btn" data-model="sphere">Sphere</button>
                                <button class="preset-model-btn" data-model="cylinder">Cylinder</button>
                                <button class="preset-model-btn" data-model="torus">Torus</button>
                                <button class="preset-model-btn" data-model="plane">Plane</button>
                                <button class="preset-model-btn" data-model="teapot">Teapot</button>
                            </div>
                        </div>
                    </div>

                    <div class="transform-controls">
                        <h4 class="section-title">Transform</h4>

                        <div class="transform-group">
                            <h5 class="subsection-title">Position</h5>
                            <div class="xyz-controls">
                                <div class="xyz-control">
                                    <label>X</label>
                                    <input type="range" id="pos-x" min="-10" max="10" step="0.1" value="0" class="enhanced-slider">
                                    <span id="pos-x-value">0</span>
                                </div>
                                <div class="xyz-control">
                                    <label>Y</label>
                                    <input type="range" id="pos-y" min="-10" max="10" step="0.1" value="0" class="enhanced-slider">
                                    <span id="pos-y-value">0</span>
                                </div>
                                <div class="xyz-control">
                                    <label>Z</label>
                                    <input type="range" id="pos-z" min="-10" max="10" step="0.1" value="0" class="enhanced-slider">
                                    <span id="pos-z-value">0</span>
                                </div>
                            </div>
                        </div>

                        <div class="transform-group">
                            <h5 class="subsection-title">Rotation</h5>
                            <div class="xyz-controls">
                                <div class="xyz-control">
                                    <label>X</label>
                                    <input type="range" id="rot-x" min="-180" max="180" step="1" value="0" class="enhanced-slider">
                                    <span id="rot-x-value">0°</span>
                                </div>
                                <div class="xyz-control">
                                    <label>Y</label>
                                    <input type="range" id="rot-y" min="-180" max="180" step="1" value="0" class="enhanced-slider">
                                    <span id="rot-y-value">0°</span>
                                </div>
                                <div class="xyz-control">
                                    <label>Z</label>
                                    <input type="range" id="rot-z" min="-180" max="180" step="1" value="0" class="enhanced-slider">
                                    <span id="rot-z-value">0°</span>
                                </div>
                            </div>
                        </div>

                        <div class="transform-group">
                            <h5 class="subsection-title">Scale</h5>
                            <div class="xyz-controls">
                                <div class="xyz-control">
                                    <label>X</label>
                                    <input type="range" id="scale-x" min="0.1" max="5" step="0.1" value="1" class="enhanced-slider">
                                    <span id="scale-x-value">1.0</span>
                                </div>
                                <div class="xyz-control">
                                    <label>Y</label>
                                    <input type="range" id="scale-y" min="0.1" max="5" step="0.1" value="1" class="enhanced-slider">
                                    <span id="scale-y-value">1.0</span>
                                </div>
                                <div class="xyz-control">
                                    <label>Z</label>
                                    <input type="range" id="scale-z" min="0.1" max="5" step="0.1" value="1" class="enhanced-slider">
                                    <span id="scale-z-value">1.0</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="lighting-controls">
                        <h4 class="section-title">Lighting</h4>

                        <div class="property-group">
                            <label class="property-label">Ambient Intensity</label>
                            <input type="range" id="ambient-intensity" min="0" max="2" step="0.1" value="0.4" class="enhanced-slider">
                            <span id="ambient-intensity-value">0.4</span>
                        </div>

                        <div class="property-group">
                            <label class="property-label">Directional Intensity</label>
                            <input type="range" id="directional-intensity" min="0" max="2" step="0.1" value="0.8" class="enhanced-slider">
                            <span id="directional-intensity-value">0.8</span>
                        </div>

                        <div class="property-group checkbox-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="enable-shadows" checked>
                                <span class="checkmark"></span>
                                Enable Shadows
                            </label>
                        </div>
                    </div>

                    <div class="material-controls">
                        <h4 class="section-title">Material</h4>

                        <div class="property-group">
                            <label class="property-label">Material Type</label>
                            <select id="material-type" class="enhanced-select">
                                <option value="lambert">Lambert</option>
                                <option value="phong">Phong</option>
                                <option value="standard">Standard</option>
                                <option value="basic">Basic</option>
                                <option value="wireframe">Wireframe</option>
                            </select>
                        </div>

                        <div class="property-group">
                            <label class="property-label">Color</label>
                            <input type="color" id="material-color" value="#ffffff" class="enhanced-color">
                        </div>

                        <div class="property-group checkbox-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="wireframe-mode">
                                <span class="checkmark"></span>
                                Wireframe Mode
                            </label>
                        </div>
                    </div>

                    <div class="scene-controls">
                        <h4 class="section-title">Scene</h4>

                        <div class="property-group">
                            <label class="property-label">Background Color</label>
                            <input type="color" id="background-color" value="#2a2a2a" class="enhanced-color">
                        </div>

                        <div class="property-group checkbox-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="enable-grid" checked>
                                <span class="checkmark"></span>
                                Show Grid
                            </label>
                        </div>

                        <div class="property-group">
                            <label class="property-label">Grid Size</label>
                            <input type="range" id="grid-size" min="5" max="50" step="5" value="10" class="enhanced-slider">
                            <span id="grid-size-value">10</span>
                        </div>

                        <div class="property-group checkbox-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="transparent-background">
                                <span class="checkmark"></span>
                                Transparent Background
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.modal);
        this.setupEventListeners();
        this.initializeThreeJS();

        return this.modal;
    }

    setupEventListeners() {
        // Close modal
        this.modal.querySelector('#close-modal')?.addEventListener('click', () => {
            this.hide();
        });

        // Click outside to close
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hide();
            }
        });

        // Model loading
        const loadModelBtn = this.modal.querySelector('#load-model-btn');
        const fileInput = this.modal.querySelector('#model-file-input');

        loadModelBtn?.addEventListener('click', () => {
            fileInput?.click();
        });

        fileInput?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.loadModelFile(file);
            }
        });

        // Preset models
        this.modal.querySelectorAll('.preset-model-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modelType = e.target.dataset.model;
                this.loadPresetModel(modelType);
            });
        });

        // Transform controls
        this.setupTransformControls();

        // Lighting controls
        this.setupLightingControls();

        // Material controls
        this.setupMaterialControls();

        // Viewport controls
        this.setupViewportControls();

        // Capture button
        this.modal.querySelector('#capture-render')?.addEventListener('click', () => {
            this.captureRender();
        });
    }

    setupTransformControls() {
        // Position controls
        ['x', 'y', 'z'].forEach(axis => {
            const slider = this.modal.querySelector(`#pos-${axis}`);
            const valueDisplay = this.modal.querySelector(`#pos-${axis}-value`);

            slider?.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                valueDisplay.textContent = value.toFixed(1);
                this.modelSettings.position[axis] = value;
                this.updateModelTransform();
            });
        });

        // Rotation controls
        ['x', 'y', 'z'].forEach(axis => {
            const slider = this.modal.querySelector(`#rot-${axis}`);
            const valueDisplay = this.modal.querySelector(`#rot-${axis}-value`);

            slider?.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                valueDisplay.textContent = value + '°';
                this.modelSettings.rotation[axis] = value * Math.PI / 180; // Convert to radians
                this.updateModelTransform();
            });
        });

        // Scale controls
        ['x', 'y', 'z'].forEach(axis => {
            const slider = this.modal.querySelector(`#scale-${axis}`);
            const valueDisplay = this.modal.querySelector(`#scale-${axis}-value`);

            slider?.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                valueDisplay.textContent = value.toFixed(1);
                this.modelSettings.scale[axis] = value;
                this.updateModelTransform();
            });
        });
    }

    setupLightingControls() {
        // Ambient intensity
        const ambientSlider = this.modal.querySelector('#ambient-intensity');
        const ambientValue = this.modal.querySelector('#ambient-intensity-value');

        ambientSlider?.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            ambientValue.textContent = value.toFixed(1);
            this.sceneSettings.ambientLightIntensity = value;
            this.updateLighting();
        });

        // Directional intensity
        const directionalSlider = this.modal.querySelector('#directional-intensity');
        const directionalValue = this.modal.querySelector('#directional-intensity-value');

        directionalSlider?.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            directionalValue.textContent = value.toFixed(1);
            this.sceneSettings.directionalLightIntensity = value;
            this.updateLighting();
        });

        // Shadows
        const shadowsCheckbox = this.modal.querySelector('#enable-shadows');
        shadowsCheckbox?.addEventListener('change', (e) => {
            this.sceneSettings.enableShadows = e.target.checked;
            this.updateLighting();
        });
    }

    setupMaterialControls() {
        // Material type
        const materialSelect = this.modal.querySelector('#material-type');
        materialSelect?.addEventListener('change', (e) => {
            this.modelSettings.material = e.target.value;
            this.updateMaterial();
        });

        // Material color
        const colorInput = this.modal.querySelector('#material-color');
        colorInput?.addEventListener('input', (e) => {
            this.modelSettings.materialColor = e.target.value;
            this.updateMaterial();
        });

        // Wireframe
        const wireframeCheckbox = this.modal.querySelector('#wireframe-mode');
        wireframeCheckbox?.addEventListener('change', (e) => {
            this.modelSettings.wireframe = e.target.checked;
            this.updateMaterial();
        });
    }

    setupViewportControls() {
        // Reset camera
        this.modal.querySelector('#reset-camera')?.addEventListener('click', () => {
            this.resetCamera();
        });

        // Toggle wireframe
        this.modal.querySelector('#toggle-wireframe')?.addEventListener('click', () => {
            const wireframeCheckbox = this.modal.querySelector('#wireframe-mode');
            if (wireframeCheckbox) {
                wireframeCheckbox.checked = !wireframeCheckbox.checked;
                wireframeCheckbox.dispatchEvent(new Event('change'));
            }
        });

        // Toggle grid
        this.modal.querySelector('#toggle-grid')?.addEventListener('click', () => {
            const gridCheckbox = this.modal.querySelector('#enable-grid');
            if (gridCheckbox) {
                gridCheckbox.checked = !gridCheckbox.checked;
                gridCheckbox.dispatchEvent(new Event('change'));
            }
        });
    }

    initializeThreeJS() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(this.sceneSettings.backgroundColor);

        // Create camera
        const canvas = this.modal.querySelector('#threejs-canvas');
        const aspect = canvas.clientWidth / canvas.clientHeight;
        this.camera = new THREE.PerspectiveCamera(
            this.sceneSettings.cameraFov,
            aspect,
            this.sceneSettings.cameraNear,
            this.sceneSettings.cameraFar
        );
        this.camera.position.set(5, 5, 5);

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            preserveDrawingBuffer: true,
            alpha: true
        });
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        this.renderer.setClearColor(this.sceneSettings.backgroundColor);
        this.renderer.shadowMap.enabled = this.sceneSettings.enableShadows;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Create controls
        if (THREE.OrbitControls) {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
        }

        // Setup lighting
        this.setupLighting();

        // Setup grid
        this.setupGrid();

        // Load default model
        this.loadPresetModel('cube');

        // Start render loop
        this.startRenderLoop();

        // Handle resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    setupLighting() {
        // Clear existing lights
        this.lights.forEach(light => this.scene.remove(light));
        this.lights = [];

        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, this.sceneSettings.ambientLightIntensity);
        this.scene.add(ambientLight);
        this.lights.push(ambientLight);

        // Directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, this.sceneSettings.directionalLightIntensity);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = this.sceneSettings.enableShadows;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
        this.lights.push(directionalLight);

        // Fill light
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-5, 5, -5);
        this.scene.add(fillLight);
        this.lights.push(fillLight);
    }

    setupGrid() {
        // Remove existing grid
        const existingGrid = this.scene.getObjectByName('grid');
        if (existingGrid) {
            this.scene.remove(existingGrid);
        }

        if (this.sceneSettings.enableGrid) {
            const grid = new THREE.GridHelper(this.sceneSettings.gridSize, this.sceneSettings.gridSize);
            grid.name = 'grid';
            this.scene.add(grid);
        }
    }

    loadPresetModel(type) {
        // Remove existing model
        if (this.loadedModel) {
            this.scene.remove(this.loadedModel);
        }

        let geometry;

        switch (type) {
            case 'cube':
                geometry = new THREE.BoxGeometry(2, 2, 2);
                break;
            case 'sphere':
                geometry = new THREE.SphereGeometry(1.5, 32, 32);
                break;
            case 'cylinder':
                geometry = new THREE.CylinderGeometry(1, 1, 2, 32);
                break;
            case 'torus':
                geometry = new THREE.TorusGeometry(1, 0.4, 16, 100);
                break;
            case 'plane':
                geometry = new THREE.PlaneGeometry(4, 4);
                break;
            case 'teapot':
                // Simple teapot-like shape using multiple geometries
                this.createTeapotModel();
                return;
            default:
                geometry = new THREE.BoxGeometry(2, 2, 2);
        }

        if (geometry) {
            const material = new THREE.MeshLambertMaterial({ color: 0xffffff });
            this.loadedModel = new THREE.Mesh(geometry, material);
            this.scene.add(this.loadedModel);

            this.fitCameraToModel();
        }
    }

    createTeapotModel() {
        // Create a simple teapot-like model using basic geometries
        const teapotGroup = new THREE.Group();

        // Body (spherical)
        const bodyGeometry = new THREE.SphereGeometry(1.2, 16, 12);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.scale.set(1, 0.8, 1);
        teapotGroup.add(body);

        // Lid (smaller sphere on top)
        const lidGeometry = new THREE.SphereGeometry(1.1, 16, 8);
        const lid = new THREE.Mesh(lidGeometry, lidMaterial);
        lid.position.set(0, 0.8, 0);
        lid.scale.set(1, 0.3, 1);
        teapotGroup.add(lid);

        // Spout (cylinder)
        const spoutGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 8);
        const spout = new THREE.Mesh(spoutGeometry, bodyMaterial);
        spout.position.set(1.2, 0, 0);
        spout.rotation.set(0, 0, Math.PI / 2);
        teapotGroup.add(spout);

        // Handle (torus)
        const handleGeometry = new THREE.TorusGeometry(0.3, 0.1, 8, 16);
        const handle = new THREE.Mesh(handleGeometry, bodyMaterial);
        handle.position.set(-1.2, 0, 0);
        handle.rotation.set(Math.PI / 2, 0, 0);
        teapotGroup.add(handle);

        this.loadedModel = teapotGroup;
        this.scene.add(this.loadedModel);
        this.fitCameraToModel();
    }

    async loadModelFile(file) {
        const extension = file.name.split('.').pop().toLowerCase();

        try {
            let loader;
            switch (extension) {
                case 'gltf':
                case 'glb':
                    if (THREE.GLTFLoader) {
                        loader = new THREE.GLTFLoader();
                        loader.load(URL.createObjectURL(file), (gltf) => {
                            this.processLoadedModel(gltf.scene);
                        });
                    }
                    break;
                case 'obj':
                    if (THREE.OBJLoader) {
                        loader = new THREE.OBJLoader();
                        loader.load(URL.createObjectURL(file), (obj) => {
                            this.processLoadedModel(obj);
                        });
                    }
                    break;
                case 'fbx':
                    if (THREE.FBXLoader) {
                        loader = new THREE.FBXLoader();
                        loader.load(URL.createObjectURL(file), (fbx) => {
                            this.processLoadedModel(fbx);
                        });
                    }
                    break;
                default:
                    alert('Unsupported file format');
            }
        } catch (error) {
            console.error('Error loading model:', error);
            alert('Error loading model file');
        }
    }

    processLoadedModel(model) {
        // Remove existing model
        if (this.loadedModel) {
            this.scene.remove(this.loadedModel);
        }

        // Process the loaded model
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        this.loadedModel = model;
        this.scene.add(model);
        this.fitCameraToModel();
    }

    fitCameraToModel() {
        if (!this.loadedModel) return;

        const box = new THREE.Box3().setFromObject(this.loadedModel);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const distance = maxDim * 2;

        this.camera.position.set(distance, distance, distance);
        this.camera.lookAt(center);

        if (this.controls) {
            this.controls.target.copy(center);
            this.controls.update();
        }
    }

    updateModelTransform() {
        if (!this.loadedModel) return;

        this.loadedModel.position.set(
            this.modelSettings.position.x,
            this.modelSettings.position.y,
            this.modelSettings.position.z
        );

        this.loadedModel.rotation.set(
            this.modelSettings.rotation.x,
            this.modelSettings.rotation.y,
            this.modelSettings.rotation.z
        );

        this.loadedModel.scale.set(
            this.modelSettings.scale.x,
            this.modelSettings.scale.y,
            this.modelSettings.scale.z
        );
    }

    updateLighting() {
        if (this.lights.length >= 2) {
            this.lights[0].intensity = this.sceneSettings.ambientLightIntensity; // Ambient
            this.lights[1].intensity = this.sceneSettings.directionalLightIntensity; // Directional
        }
    }

    updateBackground() {
        this.renderer.setClearColor(this.sceneSettings.backgroundColor);
    }

    updateMaterial() {
        if (!this.loadedModel) return;

        const color = this.modelSettings.materialColor || '#ffffff';
        let material;

        switch (this.modelSettings.material) {
            case 'basic':
                material = new THREE.MeshBasicMaterial({
                    color: color,
                    wireframe: this.modelSettings.wireframe
                });
                break;
            case 'lambert':
                material = new THREE.MeshLambertMaterial({
                    color: color,
                    wireframe: this.modelSettings.wireframe
                });
                break;
            case 'phong':
                material = new THREE.MeshPhongMaterial({
                    color: color,
                    wireframe: this.modelSettings.wireframe
                });
                break;
            case 'standard':
                material = new THREE.MeshStandardMaterial({
                    color: color,
                    wireframe: this.modelSettings.wireframe
                });
                break;
            case 'wireframe':
                material = new THREE.MeshBasicMaterial({
                    color: color,
                    wireframe: true
                });
                break;
            default:
                material = new THREE.MeshLambertMaterial({
                    color: color,
                    wireframe: this.modelSettings.wireframe
                });
        }

        this.loadedModel.traverse((child) => {
            if (child.isMesh) {
                child.material = material;
            }
        });
    }

    updateGrid() {
        this.setupGrid();
    }

    resetCamera() {
        this.camera.position.set(5, 5, 5);
        this.camera.lookAt(0, 0, 0);

        if (this.controls) {
            this.controls.target.set(0, 0, 0);
            this.controls.update();
        }
    }

    startRenderLoop() {
        const animate = () => {
            requestAnimationFrame(animate);

            if (this.controls) {
                this.controls.update();
            }

            if (this.renderer && this.scene && this.camera) {
                this.renderer.render(this.scene, this.camera);
            }
        };

        animate();
    }

    handleResize() {
        if (!this.modal || !this.camera || !this.renderer) return;

        const canvas = this.modal.querySelector('#threejs-canvas');
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        this.camera.aspect = rect.width / rect.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(rect.width, rect.height);
    }

    captureRender() {
        if (!this.scene || !this.camera) return;

        // Get canvas dimensions
        const canvas = this.modal.querySelector('#threejs-canvas');
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        // Create a separate renderer for high-quality capture
        const captureRenderer = new THREE.WebGLRenderer({
            antialias: true,
            preserveDrawingBuffer: true,
            alpha: this.modal.querySelector('#transparent-background')?.checked || false
        });
        captureRenderer.setSize(width * 2, height * 2); // Higher resolution
        captureRenderer.shadowMap.enabled = this.sceneSettings.enableShadows;

        // Copy scene settings
        captureRenderer.setClearColor(this.sceneSettings.backgroundColor);

        // Render the scene
        captureRenderer.render(this.scene, this.camera);

        // Get the image data
        const canvasElement = captureRenderer.domElement;
        const dataURL = canvasElement.toDataURL('image/png');

        // Clean up
        captureRenderer.dispose();

        // Create new layer with the captured image
        this.createLayerFromCapture(dataURL, width, height);

        // Hide modal
        this.hide();
    }

    createLayerFromCapture(dataURL, width, height) {
        const img = new Image();
        img.onload = () => {
            // Add new layer to the image editor
            if (this.eventManager) {
                this.eventManager.emit('3dReferenceLayerCreated', {
                    imageData: dataURL,
                    width: width,
                    height: height,
                    metadata: {
                        type: '3d_reference',
                        sceneSettings: { ...this.sceneSettings },
                        modelSettings: { ...this.modelSettings },
                        captureResolution: { width, height },
                        timestamp: Date.now()
                    }
                });
            }
        };
        img.src = dataURL;
    }

    show() {
        if (!this.modal) {
            this.createModal();
        }

        this.modal.style.display = 'block';
        this.isVisible = true;

        // Handle resize when modal becomes visible
        setTimeout(() => {
            this.handleResize();
        }, 100);

        this.eventManager.emit('3dReferenceModalOpened');
    }

    hide() {
        if (this.modal) {
            this.modal.style.display = 'none';
        }
        this.isVisible = false;
        this.eventManager.emit('3dReferenceModalClosed');
    }

    destroy() {
        if (this.renderer) {
            this.renderer.dispose();
        }

        if (this.modal && this.modal.parentNode) {
            this.modal.parentNode.removeChild(this.modal);
        }

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.loadedModel = null;
        this.lights = [];
    }
}

// 3D Reference Button
class ThreeJSReferenceButton {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.modal = new ThreeJSReferenceModal(eventManager);
    }

    createButton() {
        const button = document.createElement('button');
        button.className = 'enhanced-btn threejs-reference-btn';
        button.title = '3D Reference';
        button.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            margin: 5px;
        `;

        button.innerHTML = `
            <span class="material-symbols-outlined">view_in_ar</span>
            <span>3D Reference</span>
        `;

        button.addEventListener('click', () => {
            this.modal.show();
        });

        return button;
    }

    getModal() {
        return this.modal;
    }
}

// Nebula Image Editor Pro - Complete Integration
// This is the final comprehensive image editor with all advanced features

class NebulaImageEditorPro {
    constructor() {
        this.windowId = null;
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
        
        // Initialize synchronously for code-assistant compatibility
        this.initSync();
    }
    
    initSync() {
        if (!window.windowManager) {
            console.error('WindowManager not available');
            return;
        }
        
        this.windowId = window.windowManager.createWindow({
            title: this.title,
            width: 1200,
            height: 800,
            resizable: true,
            maximizable: true,
            minimizable: true
        });
        
        window.windowManager.loadApp(this.windowId, this);
        
        console.log('Nebula Image Editor Pro initialized with window', this.windowId);
        
        // Initialize editor after window is created
        this.initializeEditor();
    }
    
    render() {
        const container = document.createElement('div');
        container.className = 'nebula-image-editor-container';
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
        const contentArea = this.createContentArea();
        const statusBar = this.createStatusBar();
        
        // Assemble the UI
        container.appendChild(toolbar);
        container.appendChild(contentArea);
        container.appendChild(statusBar);
        
        // Set up event listeners after UI is created
        setTimeout(() => {
            this.afterRender();
        }, 0);
        
        return container;
    }
    
    initializeEditor() {
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
            // Create a new layer from the 3D reference capture
            const img = new Image();
            img.onload = () => {
                const layerName = `3D Reference ${Date.now()}`;
                const newLayer = this.layerManager.addLayer(layerName);

                // Draw the captured image to the layer, centered
                const layerCanvas = newLayer.canvas;
                const layerContext = newLayer.context;

                // Calculate position to center the image
                const centerX = (layerCanvas.width - data.width) / 2;
                const centerY = (layerCanvas.height - data.height) / 2;

                // Draw the image
                layerContext.drawImage(img, centerX, centerY, data.width, data.height);

                // Store metadata
                newLayer.metadata = data.metadata || {};
                newLayer.metadata.type = '3d_reference';

                this.updateLayersPanel();
                this.saveHistoryState('Added 3D reference layer');
            };
            img.src = data.imageData;
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
    
    createToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'nebula-image-editor-toolbar';
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
            <button class="toolbar-btn" id="new-btn" title="New Project (Ctrl+N)">
                <span class="material-symbols-outlined">add</span>
                New
            </button>
            <button class="toolbar-btn" id="open-btn" title="Open Project (Ctrl+O)">
                <span class="material-symbols-outlined">folder_open</span>
                Open
            </button>
            <button class="toolbar-btn" id="save-btn" title="Save Project (Ctrl+S)">
                <span class="material-symbols-outlined">save</span>
                Save
            </button>
            <div class="toolbar-separator"></div>
            <button class="toolbar-btn" id="undo-btn" title="Undo (Ctrl+Z)">
                <span class="material-symbols-outlined">undo</span>
                Undo
            </button>
            <button class="toolbar-btn" id="redo-btn" title="Redo (Ctrl+Y)">
                <span class="material-symbols-outlined">redo</span>
                Redo
            </button>
            <div class="toolbar-title" style="margin-left: auto; font-weight: 500; color: var(--nebula-text-primary);">
                Nebula Image Editor Pro
            </div>
        `;

        // Add toolbar styling
        this.addToolbarStyles();

        return toolbar;
    }

    createContentArea() {
        const contentArea = document.createElement('div');
        contentArea.className = 'nebula-image-editor-content';
        contentArea.style.cssText = `
            flex: 1;
            overflow: hidden;
            background: var(--nebula-bg-primary);
            display: flex;
            position: relative;
        `;

        // Main canvas area
        const canvasArea = document.createElement('div');
        canvasArea.className = 'canvas-area';
        canvasArea.style.cssText = `
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            position: relative;
            background: var(--nebula-bg-secondary);
        `;

        const canvasWrapper = document.createElement('div');
        canvasWrapper.id = 'canvas-wrapper';
        canvasWrapper.style.cssText = `
            position: relative;
            background: #ffffff;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            border-radius: 4px;
        `;

        const canvas = document.createElement('canvas');
        canvas.id = 'main-canvas';
        canvas.width = this.canvasWidth;
        canvas.height = this.canvasHeight;
        canvas.style.cssText = `
            display: block;
            cursor: crosshair;
        `;

        const selectionOverlay = document.createElement('div');
        selectionOverlay.id = 'selection-overlay';
        selectionOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            pointer-events: none;
        `;

        canvasWrapper.appendChild(canvas);
        canvasWrapper.appendChild(selectionOverlay);
        canvasArea.appendChild(canvasWrapper);
        contentArea.appendChild(canvasArea);

        // Right panel
        const rightPanel = document.createElement('div');
        rightPanel.className = 'right-panel';
        rightPanel.style.cssText = `
            width: 300px;
            background: var(--nebula-surface);
            border-left: 1px solid var(--nebula-border);
            overflow-y: auto;
            flex-shrink: 0;
            display: flex;
            flex-direction: column;
        `;

        const panelTabs = document.createElement('div');
        panelTabs.className = 'panel-tabs';
        panelTabs.style.cssText = `
            display: flex;
            border-bottom: 1px solid var(--nebula-border);
        `;

        panelTabs.innerHTML = `
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
        `;

        const panelContent = document.createElement('div');
        panelContent.className = 'panel-content';
        panelContent.id = 'right-panel-content';

        rightPanel.appendChild(panelTabs);
        rightPanel.appendChild(panelContent);
        contentArea.appendChild(rightPanel);

        return contentArea;
    }

    createStatusBar() {
        const statusBar = document.createElement('div');
        statusBar.className = 'nebula-image-editor-status';
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
            <span class="status-right" id="status-details">${this.canvasWidth} × ${this.canvasHeight} px | Zoom: ${Math.round(this.zoom * 100)}%</span>
        `;

        return statusBar;
    }

    addToolbarStyles() {
        if (document.querySelector('#nebula-image-editor-toolbar-styles')) return;

        const style = document.createElement('style');
        style.id = 'nebula-image-editor-toolbar-styles';
        style.textContent = `
            .nebula-image-editor-toolbar .toolbar-btn {
                padding: 6px 12px;
                border: 1px solid var(--nebula-border);
                background: var(--nebula-bg-secondary);
                color: var(--nebula-text-primary);
                border-radius: var(--nebula-radius-md);
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 4px;
                font-size: 12px;
                transition: var(--nebula-transition);
            }

            .nebula-image-editor-toolbar .toolbar-btn:hover {
                background: var(--nebula-surface-hover);
                border-color: var(--nebula-border-hover);
            }

            .nebula-image-editor-toolbar .toolbar-btn:active {
                background: var(--nebula-surface-active);
            }

            .nebula-image-editor-toolbar .toolbar-separator {
                width: 1px;
                height: 24px;
                background: var(--nebula-border);
                margin: 0 8px;
            }

            .nebula-image-editor-toolbar .material-symbols-outlined {
                font-size: 16px;
            }
        `;
        document.head.appendChild(style);
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
        const canvas = document.getElementById('main-canvas');
        if (!canvas) return;

        // Set up layer manager with the main canvas
        this.layerManager.setMainCanvas(canvas);

        // Set up selection overlay
        const selectionOverlay = document.getElementById('selection-overlay');
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
        document.getElementById('new-btn')?.addEventListener('click', () => this.newProject());
        document.getElementById('open-btn')?.addEventListener('click', () => this.openProject());
        document.getElementById('save-btn')?.addEventListener('click', () => this.saveProject());
        document.getElementById('undo-btn')?.addEventListener('click', () => this.undo());
        document.getElementById('redo-btn')?.addEventListener('click', () => this.redo());

        // Tool buttons
        document.querySelectorAll('[data-tool]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const toolName = e.currentTarget.dataset.tool;
                this.setActiveTool(toolName);
            });
        });

        // Zoom controls
        document.getElementById('zoom-out-btn')?.addEventListener('click', () => this.setZoom(this.zoom * 0.8));
        document.getElementById('zoom-in-btn')?.addEventListener('click', () => this.setZoom(this.zoom * 1.25));
        document.getElementById('fit-screen-btn')?.addEventListener('click', () => this.fitToScreen());

        // Panel tabs
        document.querySelectorAll('.panel-tab').forEach(tab => {
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
        const container = document.getElementById('threejs-reference-container');
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
        document.querySelectorAll('[data-tool]').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tool === toolName) {
                btn.classList.add('active');
            }
        });

        // Update cursor
        const canvas = document.getElementById('main-canvas');
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
        document.querySelectorAll('.left-panel .panel-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.panel === panelName) {
                tab.classList.add('active');
            }
        });

        // Update panel content
        const panelContent = document.getElementById('panel-content');
        if (panelContent && this.panels.has(panelName)) {
            panelContent.innerHTML = '';
            panelContent.appendChild(this.panels.get(panelName));
        }
    }

    setActiveRightPanel(panelName) {
        // Update tab states
        document.querySelectorAll('.right-panel .panel-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.panel === panelName) {
                tab.classList.add('active');
            }
        });

        // Update panel content
        const panelContent = document.getElementById('right-panel-content');
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
        const layersList = document.getElementById('layers-list');
        if (!layersList) return;
        
        layersList.innerHTML = '';
        
        // Render layers in reverse order (top to bottom)
        const layers = [...this.layerManager.layers].reverse();
        layers.forEach((layer, index) => {
            const layerElement = this.createLayerElement(layer, layers.length - 1 - index);
            layersList.appendChild(layerElement);
        });
        
        // Update layer count
        const layerCount = document.getElementById('layer-count');
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
        const historyList = document.getElementById('history-list');
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
        const memoryUsage = document.getElementById('memory-usage');
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
        const cursorPosition = document.getElementById('cursor-position');
        if (cursorPosition) {
            cursorPosition.textContent = `${Math.round(x)}, ${Math.round(y)}`;
        }
    }
    
    updateStatus(message) {
        const statusText = document.getElementById('status-text');
        if (statusText) {
            statusText.textContent = message;
        }
    }
    
    setZoom(newZoom) {
        this.zoom = Math.max(0.1, Math.min(5.0, newZoom));
        
        const canvasWrapper = document.getElementById('canvas-wrapper');
        if (canvasWrapper) {
            canvasWrapper.style.transform = `scale(${this.zoom}) translate(${this.panX}px, ${this.panY}px)`;
        }
        
        const zoomDisplay = document.getElementById('zoom-display');
        if (zoomDisplay) {
            zoomDisplay.textContent = Math.round(this.zoom * 100) + '%';
        }
    }
    
    fitToScreen() {
        const canvasArea = document.querySelector('.canvas-container');
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
        const brightnessSlider = document.getElementById('brightness-slider');
        const contrastSlider = document.getElementById('contrast-slider');
        
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

    /**
     * Required methods for WindowManager integration
     */
    getTitle() {
        return this.title;
    }

    getIcon() {
        return this.icon;
    }

    /**
     * Cleanup when app is closed
     */
    cleanup() {
        // Remove event listeners
        if (this.eventManager) {
            this.eventManager.removeAllListeners();
        }

        // Clear any timers or intervals
        // Clean up any resources

        console.log('Nebula Image Editor Pro cleanup completed');
    }
}

// Stylus Tablet Support
class TabletInputManager {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.isTabletConnected = false;
        this.supportedEvents = new Set();
        this.calibration = {
            pressureMin: 0,
            pressureMax: 1,
            tiltSensitivity: 1,
            rotationSensitivity: 1
        };

        this.detectTabletSupport();
        this.setupEventListeners();
    }

    detectTabletSupport() {
        // Check for pointer events support
        if (window.PointerEvent) {
            this.supportedEvents.add('pointer');
        }

        // Check for touch events
        if ('ontouchstart' in window) {
            this.supportedEvents.add('touch');
        }

        // Check for specific tablet APIs
        if (navigator.maxTouchPoints > 1) {
            this.isTabletConnected = true;
        }

        console.log('Tablet support detected:', {
            isTabletConnected: this.isTabletConnected,
            supportedEvents: Array.from(this.supportedEvents),
            maxTouchPoints: navigator.maxTouchPoints
        });
    }

    setupEventListeners() {
        // Listen for tablet connection/disconnection
        if ('onpointerover' in window) {
            document.addEventListener('pointerover', (e) => {
                if (e.pointerType === 'pen') {
                    this.isTabletConnected = true;
                    this.eventManager.emit('tabletConnected', { pointerType: e.pointerType });
                }
            });
        }
    }

    processInputEvent(event) {
        const inputData = {
            x: event.clientX || event.touches?.[0]?.clientX || 0,
            y: event.clientY || event.touches?.[0]?.clientY || 0,
            pressure: this.extractPressure(event),
            tiltX: this.extractTiltX(event),
            tiltY: this.extractTiltY(event),
            rotation: this.extractRotation(event),
            pointerType: event.pointerType || 'mouse',
            timestamp: Date.now(),
            originalEvent: event
        };

        // Apply calibration
        inputData.pressure = this.calibratePressure(inputData.pressure);
        inputData.tiltX = this.calibrateTilt(inputData.tiltX);
        inputData.tiltY = this.calibrateTilt(inputData.tiltY);

        return inputData;
    }

    extractPressure(event) {
        // Try different pressure sources
        if (event.pressure !== undefined) {
            return event.pressure;
        }

        if (event.force !== undefined) {
            return event.force;
        }

        if (event.touches && event.touches[0] && event.touches[0].force !== undefined) {
            return event.touches[0].force;
        }

        // Fallback to simulated pressure
        return 0.5;
    }

    extractTiltX(event) {
        return event.tiltX || 0;
    }

    extractTiltY(event) {
        return event.tiltY || 0;
    }

    extractRotation(event) {
        return event.twist || event.rotation || 0;
    }

    calibratePressure(pressure) {
        const { pressureMin, pressureMax } = this.calibration;
        const normalized = (pressure - pressureMin) / (pressureMax - pressureMin);
        return Math.max(0, Math.min(1, normalized));
    }

    calibrateTilt(tilt) {
        return tilt * this.calibration.tiltSensitivity;
    }

    startCalibration() {
        return new Promise((resolve) => {
            const calibrationData = {
                pressureValues: [],
                tiltValues: [],
                rotationValues: []
            };

            const calibrationHandler = (event) => {
                const inputData = this.processInputEvent(event);
                calibrationData.pressureValues.push(inputData.pressure);
                calibrationData.tiltValues.push(inputData.tiltX, inputData.tiltY);
                calibrationData.rotationValues.push(inputData.rotation);

                if (calibrationData.pressureValues.length >= 50) {
                    document.removeEventListener('pointermove', calibrationHandler);
                    this.applyCalibration(calibrationData);
                    resolve(this.calibration);
                }
            };

            document.addEventListener('pointermove', calibrationHandler);
        });
    }

    applyCalibration(data) {
        if (data.pressureValues.length > 0) {
            this.calibration.pressureMin = Math.min(...data.pressureValues);
            this.calibration.pressureMax = Math.max(...data.pressureValues);
        }

        this.eventManager.emit('calibrationComplete', this.calibration);
    }
}

class AdvancedStabilizer {
    constructor(options = {}) {
        this.options = {
            smoothingLevel: options.smoothingLevel || 5,
            predictionStrength: options.predictionStrength || 0.3,
            catchUpSpeed: options.catchUpSpeed || 0.1,
            maxLag: options.maxLag || 100, // milliseconds
            adaptiveSmoothing: options.adaptiveSmoothing || true,
            velocitySmoothing: options.velocitySmoothing || true,
            ...options
        };

        this.inputBuffer = [];
        this.outputBuffer = [];
        this.velocityBuffer = [];
        this.lastOutputTime = 0;
        this.isActive = false;
    }

    reset() {
        this.inputBuffer = [];
        this.outputBuffer = [];
        this.velocityBuffer = [];
        this.lastOutputTime = 0;
        this.isActive = false;
    }

    addPoint(point) {
        this.inputBuffer.push({
            ...point,
            timestamp: point.timestamp || Date.now()
        });

        // Limit buffer size
        if (this.inputBuffer.length > this.options.smoothingLevel * 2) {
            this.inputBuffer.shift();
        }

        this.isActive = true;
        return this.processBuffer();
    }

    processBuffer() {
        if (this.inputBuffer.length < 2) {
            return [];
        }

        const stabilizedPoints = [];
        const currentTime = Date.now();

        // Calculate adaptive smoothing based on velocity
        const smoothingLevel = this.options.adaptiveSmoothing ?
            this.calculateAdaptiveSmoothing() : this.options.smoothingLevel;

        // Process points with stabilization
        for (let i = 1; i < this.inputBuffer.length; i++) {
            const stabilizedPoint = this.stabilizePoint(i, smoothingLevel);

            // Apply prediction if enabled
            if (this.options.predictionStrength > 0) {
                this.applyPrediction(stabilizedPoint);
            }

            stabilizedPoints.push(stabilizedPoint);
        }

        // Update output buffer
        this.outputBuffer.push(...stabilizedPoints);
        if (this.outputBuffer.length > 50) {
            this.outputBuffer = this.outputBuffer.slice(-25);
        }

        this.lastOutputTime = currentTime;
        return stabilizedPoints;
    }

    stabilizePoint(index, smoothingLevel) {
        const currentPoint = this.inputBuffer[index];
        const windowStart = Math.max(0, index - smoothingLevel);
        const window = this.inputBuffer.slice(windowStart, index + 1);

        // Calculate weighted average
        let totalWeight = 0;
        let weightedX = 0;
        let weightedY = 0;
        let weightedPressure = 0;

        window.forEach((point, i) => {
            const age = window.length - 1 - i;
            const weight = Math.exp(-age * 0.3); // Exponential decay

            totalWeight += weight;
            weightedX += point.x * weight;
            weightedY += point.y * weight;
            weightedPressure += point.pressure * weight;
        });

        const stabilized = {
            x: weightedX / totalWeight,
            y: weightedY / totalWeight,
            pressure: weightedPressure / totalWeight,
            timestamp: currentPoint.timestamp,
            tiltX: currentPoint.tiltX,
            tiltY: currentPoint.tiltY,
            rotation: currentPoint.rotation
        };

        // Apply velocity smoothing
        if (this.options.velocitySmoothing) {
            this.applyVelocitySmoothing(stabilized);
        }

        return stabilized;
    }

    calculateAdaptiveSmoothing() {
        if (this.inputBuffer.length < 3) {
            return this.options.smoothingLevel;
        }

        // Calculate recent velocity
        const recent = this.inputBuffer.slice(-3);
        let totalVelocity = 0;

        for (let i = 1; i < recent.length; i++) {
            const dx = recent[i].x - recent[i-1].x;
            const dy = recent[i].y - recent[i-1].y;
            const dt = recent[i].timestamp - recent[i-1].timestamp;

            if (dt > 0) {
                const velocity = Math.sqrt(dx * dx + dy * dy) / dt;
                totalVelocity += velocity;
            }
        }

        const avgVelocity = totalVelocity / (recent.length - 1);

        // More smoothing for faster movements
        const velocityFactor = Math.min(2, avgVelocity * 0.1);
        return Math.round(this.options.smoothingLevel * (1 + velocityFactor));
    }

    applyVelocitySmoothing(point) {
        if (this.velocityBuffer.length === 0) {
            this.velocityBuffer.push({ x: 0, y: 0 });
            return;
        }

        const lastPoint = this.outputBuffer[this.outputBuffer.length - 1];
        if (!lastPoint) return;

        const velocity = {
            x: point.x - lastPoint.x,
            y: point.y - lastPoint.y
        };

        this.velocityBuffer.push(velocity);
        if (this.velocityBuffer.length > 5) {
            this.velocityBuffer.shift();
        }

        // Smooth velocity
        const smoothedVelocity = this.velocityBuffer.reduce((acc, vel) => ({
            x: acc.x + vel.x,
            y: acc.y + vel.y
        }), { x: 0, y: 0 });

        smoothedVelocity.x /= this.velocityBuffer.length;
        smoothedVelocity.y /= this.velocityBuffer.length;

        // Apply smoothed velocity
        point.x = lastPoint.x + smoothedVelocity.x;
        point.y = lastPoint.y + smoothedVelocity.y;
    }

    applyPrediction(point) {
        if (this.outputBuffer.length < 2) return;

        const recent = this.outputBuffer.slice(-2);
        const velocity = {
            x: recent[1].x - recent[0].x,
            y: recent[1].y - recent[0].y
        };

        const prediction = {
            x: point.x + velocity.x * this.options.predictionStrength,
            y: point.y + velocity.y * this.options.predictionStrength
        };

        // Blend prediction with actual point
        point.x = point.x * (1 - this.options.predictionStrength) + prediction.x * this.options.predictionStrength;
        point.y = point.y * (1 - this.options.predictionStrength) + prediction.y * this.options.predictionStrength;
    }

    flush() {
        // Return any remaining points for final processing
        const remaining = this.inputBuffer.slice(-2);
        this.reset();
        return remaining;
    }

    setOptions(newOptions) {
        this.options = { ...this.options, ...newOptions };
    }
}

class PressureProcessor {
    constructor(options = {}) {
        this.options = {
            pressureCurve: options.pressureCurve || 'linear', // linear, ease-in, ease-out, custom
            minPressure: options.minPressure || 0.1,
            maxPressure: options.maxPressure || 1.0,
            pressureSmoothing: options.pressureSmoothing || 0.3,
            velocityInfluence: options.velocityInfluence || 0.2,
            ...options
        };

        this.pressureHistory = [];
        this.velocityHistory = [];
    }

    processPressure(inputData) {
        let pressure = inputData.pressure;

        // Apply pressure curve
        pressure = this.applyCurve(pressure);

        // Apply smoothing
        pressure = this.smoothPressure(pressure);

        // Apply velocity influence
        if (this.options.velocityInfluence > 0) {
            pressure = this.applyVelocityInfluence(pressure, inputData);
        }

        // Clamp to range
        pressure = Math.max(this.options.minPressure, Math.min(this.options.maxPressure, pressure));

        return pressure;
    }

    applyCurve(pressure) {
        switch (this.options.pressureCurve) {
            case 'ease-in':
                return pressure * pressure;
            case 'ease-out':
                return 1 - Math.pow(1 - pressure, 2);
            case 'ease-in-out':
                return pressure < 0.5 ?
                    2 * pressure * pressure :
                    1 - Math.pow(-2 * pressure + 2, 2) / 2;
            case 'custom':
                return this.customPressureCurve(pressure);
            default:
                return pressure;
        }
    }

    customPressureCurve(pressure) {
        // S-curve for more natural pressure response
        return 1 / (1 + Math.exp(-6 * (pressure - 0.5)));
    }

    smoothPressure(pressure) {
        this.pressureHistory.push(pressure);
        if (this.pressureHistory.length > 5) {
            this.pressureHistory.shift();
        }

        if (this.pressureHistory.length === 1) {
            return pressure;
        }

        // Weighted average with more weight on recent values
        let totalWeight = 0;
        let weightedSum = 0;

        this.pressureHistory.forEach((p, i) => {
            const weight = Math.pow(2, i); // Exponential weighting
            totalWeight += weight;
            weightedSum += p * weight;
        });

        return weightedSum / totalWeight;
    }

    applyVelocityInfluence(pressure, inputData) {
        // Calculate velocity
        if (this.velocityHistory.length > 0) {
            const lastData = this.velocityHistory[this.velocityHistory.length - 1];
            const dx = inputData.x - lastData.x;
            const dy = inputData.y - lastData.y;
            const dt = inputData.timestamp - lastData.timestamp;

            if (dt > 0) {
                const velocity = Math.sqrt(dx * dx + dy * dy) / dt;
                const normalizedVelocity = Math.min(1, velocity * 0.01); // Normalize velocity

                // Reduce pressure for fast movements (simulates natural pen behavior)
                const velocityFactor = 1 - (normalizedVelocity * this.options.velocityInfluence);
                pressure *= velocityFactor;
            }
        }

        this.velocityHistory.push({
            x: inputData.x,
            y: inputData.y,
            timestamp: inputData.timestamp
        });

        if (this.velocityHistory.length > 3) {
            this.velocityHistory.shift();
        }

        return pressure;
    }

    /**
     * Required methods for WindowManager integration
     */
    getTitle() {
        return this.title;
    }

    getIcon() {
        return this.icon;
    }

    /**
     * Cleanup when app is closed
     */
    cleanup() {
        // Clean up event listeners
        if (this.eventManager) {
            this.eventManager.cleanup();
        }

        // Clean up managers
        if (this.layerManager) {
            // Any layer manager cleanup
        }

        if (this.toolManager) {
            // Any tool manager cleanup
        }

        if (this.selectionToolManager) {
            // Any selection tool manager cleanup
        }

        if (this.gradientManager) {
            // Any gradient manager cleanup
        }

        if (this.stylusTabletManager) {
            this.stylusTabletManager.disable();
        }

        if (this.threejsReference && this.threejsReference.getModal()) {
            this.threejsReference.getModal().destroy();
        }

        console.log('Nebula Image Editor Pro cleanup completed');
    }
}

// Export for use in NebulaDesktop
window.NebulaImageEditorPro = NebulaImageEditorPro;
// Register the app with WindowManager
new NebulaImageEditorPro();