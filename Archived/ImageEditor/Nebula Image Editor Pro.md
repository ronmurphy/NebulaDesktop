# Nebula Image Editor Pro

A full-featured image editor and creation tool with Adobe-like art layering system, drawing tools, and comprehensive editing capabilities built using JavaScript and HTML5 Canvas.

## Features

### Core Functionality
- **Multi-layer Canvas System**: Adobe-like layer management with support for multiple layers
- **Professional Drawing Tools**: Brush, Pencil, Eraser with customizable properties
- **Layer Management**: Add, delete, duplicate, reorder, and manage layer visibility
- **Blend Modes**: Support for Normal, Multiply, Screen, Overlay, Darken, and Lighten
- **Layer Opacity Control**: Adjustable opacity for each layer
- **Zoom and Pan**: Zoom in/out and fit-to-screen functionality

### Drawing Tools
- **Brush Tool**: Pressure-sensitive painting with adjustable size, opacity, and color
- **Pencil Tool**: Hard-edge drawing for precise lines
- **Eraser Tool**: Remove content with transparency support
- **Selection Tools**: Rectangle and freehand selection (framework ready)
- **Move Tool**: Layer positioning and transformation (framework ready)
- **Text Tool**: Text insertion and editing (framework ready)

### Image Adjustments and Filters
- **Basic Adjustments**: Brightness, Contrast, Saturation controls
- **Color Filters**: Grayscale, Sepia, Invert effects
- **Artistic Filters**: Vintage, Warm, Cool tone adjustments
- **Convolution Filters**: Blur, Sharpen, Edge Detection, Emboss
- **Real-time Preview**: Live preview of adjustments before applying

### User Interface
- **Professional Layout**: Multi-panel interface with dockable panels
- **Tool Panels**: Organized tool categories with visual feedback
- **Properties Panel**: Context-sensitive tool properties
- **Layers Panel**: Visual layer management with thumbnails
- **History Panel**: Undo/redo history tracking
- **Info Panel**: Document information and statistics
- **Responsive Design**: Adapts to different screen sizes

### Technical Features
- **Event-Driven Architecture**: Modular event system for extensibility
- **Canvas Optimization**: Efficient rendering with dirty rectangle tracking
- **Memory Management**: Proper cleanup and resource management
- **Keyboard Shortcuts**: Professional keyboard shortcuts for all tools
- **Status Bar**: Real-time cursor position and document information

## File Structure

```
├── NebulaApp-Single.js          # Original template file
├── NebulaImageEditor.js         # Basic image editor implementation
├── enhanced-image-editor.js     # Enhanced version with full UI
├── image-filters.js             # Image filters and adjustment tools
├── image-editor-demo.html       # Complete standalone demo
├── image-editor-architecture.md # Technical architecture documentation
└── README.md                    # This file
```

## Getting Started

### Running the Demo
1. Open `image-editor-demo.html` in a modern web browser
2. The application will load automatically with a blank canvas
3. Use the toolbar to select tools and start creating

### Basic Usage
1. **Select a Tool**: Click on any tool in the toolbar or left panel
2. **Adjust Properties**: Use the properties panel to modify brush size, opacity, and color
3. **Draw on Canvas**: Click and drag on the white canvas to draw
4. **Manage Layers**: Use the layers panel to add, delete, or modify layers
5. **Apply Filters**: Switch to the Adjust panel to apply filters and adjustments

### Keyboard Shortcuts
- `B` - Brush Tool
- `P` - Pencil Tool
- `E` - Eraser Tool
- `M` - Selection Tool
- `V` - Move Tool
- `T` - Text Tool
- `Ctrl+S` - Save (placeholder)
- `Ctrl+N` - New Document
- `Ctrl+Z` - Undo (placeholder)
- `Ctrl+Y` - Redo (placeholder)
- `Ctrl++` - Zoom In
- `Ctrl+-` - Zoom Out
- `Ctrl+0` - Fit to Screen

## Architecture

### Core Classes
- **EventManager**: Centralized event handling system
- **LayerManager**: Layer creation, management, and rendering
- **ToolManager**: Tool selection and property management
- **Document**: Document structure and metadata
- **Layer**: Individual layer with canvas and properties
- **Tool Classes**: Base tool class with specific implementations

### Design Patterns
- **Observer Pattern**: Event-driven communication between components
- **Strategy Pattern**: Interchangeable tool implementations
- **Composite Pattern**: Layer hierarchy and management
- **Command Pattern**: Ready for undo/redo implementation

### Performance Optimizations
- **Canvas Pooling**: Reuse canvas elements for efficiency
- **Dirty Rectangle Tracking**: Only redraw changed areas
- **Layer Caching**: Cache layer renders when unchanged
- **Event Throttling**: Optimize mouse move events

## Browser Compatibility

- **Chrome**: Full support (recommended)
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support
- **Mobile**: Basic support (touch events)

## Technical Requirements

- Modern web browser with HTML5 Canvas support
- JavaScript ES6+ support
- Minimum 1024x768 screen resolution for optimal experience

## Customization

### Adding New Tools
1. Extend the `Tool` base class
2. Implement required methods (`onMouseDown`, `onMouseMove`, `onMouseUp`)
3. Register the tool in `ToolManager.initializeTools()`
4. Add UI elements for tool selection

### Adding New Filters
1. Add filter function to `ImageFilters` class
2. Register in `initializeFilters()` method
3. Add UI button in adjustment panel
4. Implement filter logic using ImageData manipulation

### Extending the UI
1. Create new panel classes following existing patterns
2. Add panel tabs and content areas
3. Implement panel switching logic
4. Add corresponding CSS styles

## Future Enhancements

### Planned Features
- **File I/O**: Save/load native format and export to PNG/JPEG
- **Advanced Selection**: Magic wand, polygon selection tools
- **Vector Support**: Basic vector shape tools
- **Plugin System**: Extensible plugin architecture
- **Collaboration**: Real-time collaborative editing
- **Cloud Storage**: Integration with cloud storage services

### Performance Improvements
- **WebGL Acceleration**: GPU-accelerated filters and effects
- **Web Workers**: Background processing for heavy operations
- **Streaming**: Large image handling with tiling
- **Caching**: Intelligent layer and filter caching

## Contributing

This image editor is built as a demonstration of advanced web application development. The codebase is designed to be:

- **Modular**: Easy to extend with new features
- **Maintainable**: Clean separation of concerns
- **Documented**: Comprehensive inline documentation
- **Testable**: Event-driven architecture supports testing

## License

This project is created for educational and demonstration purposes. Feel free to use and modify the code for your own projects.

## Credits

Built using:
- HTML5 Canvas API for rendering
- Material Symbols for icons
- Inter font family for typography
- Modern CSS Grid and Flexbox for layout
- Vanilla JavaScript for maximum compatibility

---

**Nebula Image Editor Pro** - Professional image editing in the browser.

