# Image Editor Architecture Design

## Core Architecture Overview

The image editor will be built as a single-window application using the NebulaApp template, featuring:

1. **Canvas System**: Multi-layered HTML5 canvas for rendering
2. **Layer Management**: Adobe-like layer system with blending modes
3. **Tool System**: Modular drawing and editing tools
4. **UI Framework**: Panel-based interface with dockable components
5. **State Management**: Centralized state with undo/redo support

## Layer System Design

### Layer Data Structure
```javascript
class Layer {
    constructor(options = {}) {
        this.id = generateUniqueId();
        this.name = options.name || `Layer ${this.id}`;
        this.type = options.type || 'raster'; // 'raster', 'vector', 'text', 'adjustment'
        this.visible = options.visible !== false;
        this.opacity = options.opacity || 1.0;
        this.blendMode = options.blendMode || 'normal';
        this.locked = options.locked || false;
        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d');
        this.transform = {
            x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0
        };
        this.mask = null; // Layer mask
        this.effects = []; // Layer effects/filters
    }
}
```

### Layer Manager
```javascript
class LayerManager {
    constructor() {
        this.layers = [];
        this.activeLayerId = null;
        this.selectedLayerIds = [];
    }
    
    addLayer(layer, index = -1) { /* ... */ }
    removeLayer(layerId) { /* ... */ }
    moveLayer(layerId, newIndex) { /* ... */ }
    duplicateLayer(layerId) { /* ... */ }
    mergeDown(layerId) { /* ... */ }
    setLayerProperty(layerId, property, value) { /* ... */ }
}
```

## Canvas Rendering System

### Multi-Canvas Architecture
- **Background Canvas**: Static background/checkerboard pattern
- **Layer Canvases**: Individual canvas for each layer
- **Composite Canvas**: Final rendered output
- **UI Canvas**: Tool overlays, selection handles, guides

### Rendering Pipeline
1. Clear composite canvas
2. Iterate through layers (bottom to top)
3. Apply layer transforms and effects
4. Composite using blend mode
5. Render UI overlays

## Tool System Architecture

### Base Tool Class
```javascript
class Tool {
    constructor(name, icon, cursor) {
        this.name = name;
        this.icon = icon;
        this.cursor = cursor;
        this.active = false;
        this.options = {};
    }
    
    onActivate() { /* Override */ }
    onDeactivate() { /* Override */ }
    onMouseDown(event) { /* Override */ }
    onMouseMove(event) { /* Override */ }
    onMouseUp(event) { /* Override */ }
    onKeyDown(event) { /* Override */ }
}
```

### Drawing Tools
- **Brush Tool**: Pressure-sensitive painting
- **Pencil Tool**: Hard-edge drawing
- **Eraser Tool**: Transparency painting
- **Clone Tool**: Sample and paint
- **Healing Tool**: Content-aware repair

### Selection Tools
- **Rectangle Select**: Rectangular selections
- **Ellipse Select**: Circular selections
- **Lasso Tool**: Freehand selections
- **Magic Wand**: Color-based selection

### Transform Tools
- **Move Tool**: Layer positioning
- **Scale Tool**: Resize layers
- **Rotate Tool**: Rotation handles
- **Free Transform**: Combined transforms

## UI Panel System

### Panel Architecture
```javascript
class Panel {
    constructor(id, title, position = 'right') {
        this.id = id;
        this.title = title;
        this.position = position;
        this.visible = true;
        this.docked = true;
        this.element = null;
    }
    
    render() { /* Override */ }
    update() { /* Override */ }
    show() { /* ... */ }
    hide() { /* ... */ }
}
```

### Core Panels
1. **Layers Panel**: Layer list with thumbnails, blend modes, opacity
2. **Tools Panel**: Tool selection and options
3. **Properties Panel**: Context-sensitive tool properties
4. **History Panel**: Undo/redo history
5. **Color Panel**: Color picker and swatches
6. **Brushes Panel**: Brush presets and settings

## State Management

### Application State
```javascript
class EditorState {
    constructor() {
        this.document = null; // Current document
        this.activeTool = null;
        this.selection = null;
        this.clipboard = null;
        this.history = new HistoryManager();
        this.preferences = new PreferencesManager();
    }
}
```

### Document Structure
```javascript
class Document {
    constructor(width, height, resolution = 72) {
        this.id = generateUniqueId();
        this.name = 'Untitled';
        this.width = width;
        this.height = height;
        this.resolution = resolution;
        this.colorMode = 'RGB';
        this.layerManager = new LayerManager();
        this.guides = [];
        this.grid = { visible: false, size: 10 };
    }
}
```

## Event System

### Event Manager
```javascript
class EventManager {
    constructor() {
        this.listeners = new Map();
    }
    
    on(event, callback) { /* ... */ }
    off(event, callback) { /* ... */ }
    emit(event, data) { /* ... */ }
}
```

### Core Events
- `layer:added`, `layer:removed`, `layer:changed`
- `tool:activated`, `tool:deactivated`
- `selection:changed`
- `document:created`, `document:saved`
- `history:changed`

## Performance Optimizations

### Canvas Optimization
- **Dirty Rectangle Tracking**: Only redraw changed areas
- **Layer Caching**: Cache layer renders when unchanged
- **Viewport Culling**: Skip rendering off-screen layers
- **WebGL Acceleration**: Use WebGL for filters and effects

### Memory Management
- **Canvas Pooling**: Reuse canvas elements
- **Image Data Compression**: Compress layer data
- **Lazy Loading**: Load layer data on demand
- **Garbage Collection**: Proper cleanup of resources

## File Format Support

### Import Formats
- PNG, JPEG, GIF, WebP (raster)
- SVG (vector)
- PSD (Photoshop - basic support)

### Export Formats
- PNG (with transparency)
- JPEG (quality settings)
- WebP (modern format)
- SVG (vector layers)
- Native format (JSON + binary data)

## Integration Points

### NebulaApp Integration
- Use existing window management
- Leverage Nebula theming system
- Integrate with file system APIs
- Support keyboard shortcuts

### Extension Points
- Plugin system for custom tools
- Filter/effect plugins
- Custom file format handlers
- Brush engine extensions

This architecture provides a solid foundation for building a professional-grade image editor with Adobe-like capabilities while maintaining good performance and extensibility.

