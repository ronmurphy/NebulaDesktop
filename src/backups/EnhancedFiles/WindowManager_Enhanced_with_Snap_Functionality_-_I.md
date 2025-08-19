# WindowManager Enhanced with Snap Functionality - Integration Guide

## Overview

The enhanced WindowManager now includes both **icon support** and **window snapping functionality**. This builds upon the previous icon enhancement and adds comprehensive snap-to-edge capabilities.

## New Features Added

### Window Snapping System
- **8 Snap Zones**: Left, Right, Top, Bottom edges + 4 corners
- **Visual Previews**: Semi-transparent blue overlays show snap target
- **Smart Detection**: 50px edge zones, 100px corner zones
- **Hover Delay**: 800ms before showing preview (prevents accidental triggers)
- **Smooth Animations**: 300ms transitions with easing

### Snap Behaviors
- **Left/Right Edges**: Window takes 50% of screen width
- **Top Edge**: Window maximizes to full screen
- **Bottom Edge**: Window docks to bottom (100px height)
- **Corners**: Window takes 25% of screen (quarter-screen)

## Integration Steps

### 1. Replace WindowManager Files
Replace your existing files with the enhanced versions:
- `WindowManager.js` → `WindowManager_Enhanced_Snap.js`
- Add `window-snap-styles.css` (includes both icon and snap styles)

### 2. Update HTML References
```html
<!-- Replace existing WindowManager script -->
<script src="WindowManager_Enhanced_Snap.js"></script>

<!-- Add enhanced styles -->
<link rel="stylesheet" href="window-snap-styles.css">

<!-- Keep Google Material Symbols if using Material Icons -->
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
```

### 3. Initialize Enhanced WindowManager
```javascript
// Same initialization as before - fully backward compatible
const windowManager = new WindowManager();

// All existing methods work unchanged
const windowId = windowManager.createWindow({
    title: 'My App',
    icon: '📁',
    iconType: 'emoji',
    width: 600,
    height: 400
});
```

## Configuration Options

### Snap System Settings
The snap system can be configured via the `snapSystem` property:

```javascript
// Access snap configuration
windowManager.snapSystem.isEnabled = true;        // Enable/disable snapping
windowManager.snapSystem.hoverDelay = 800;        // ms before showing preview
windowManager.snapSystem.snapThreshold = 50;      // px from edge to trigger
windowManager.snapSystem.animationDuration = 300; // ms for snap animation
windowManager.snapSystem.cornerSize = 100;        // px size of corner zones
windowManager.snapSystem.edgeSize = 50;           // px size of edge zones
```

### Available Area Configuration
```javascript
// Update available desktop area (accounts for taskbars, panels, etc.)
windowManager.updateAvailableArea(x, y, width, height);
```

## API Reference

### New Methods

#### Snap System Methods
```javascript
// Initialize snap system (called automatically)
windowManager.initializeSnapSystem()

// Update snap zones (called on window resize)
windowManager.updateSnapZones()

// Detect current snap zone
const zone = windowManager.detectSnapZone(mouseX, mouseY)

// Show/hide snap preview
windowManager.showSnapPreview(zoneName)
windowManager.hideSnapPreview()

// Snap window to specific zone
windowManager.snapWindowToZone(windowId, zoneName)

// Get dimensions for snap zone
const dimensions = windowManager.getSnapDimensions(zoneName)
```

#### Enhanced Drag Handling
```javascript
// Enhanced drag methods (used internally)
windowManager.handleDragMove(event, windowElement, windowId)
windowManager.handleDragEnd(event, windowElement, windowId)
windowManager.clearHoverTimer()
```

### Existing Methods (Unchanged)
All existing WindowManager methods continue to work:
- `createWindow(options)`
- `loadApp(windowId, app, tabId)`
- `focusWindow(windowId)`
- `minimizeWindow(windowId)`
- `toggleMaximizeWindow(windowId)`
- `closeWindow(windowId)`
- `setWindowIcon(windowId, icon, iconType)`
- `setWindowTitle(windowId, title)`

## Snap Zone Reference

### Zone Names and Behaviors
```javascript
const snapZones = {
    'left': 'Half screen left',
    'right': 'Half screen right', 
    'top': 'Maximize window',
    'bottom': 'Dock to bottom',
    'topLeft': 'Quarter screen top-left',
    'topRight': 'Quarter screen top-right',
    'bottomLeft': 'Quarter screen bottom-left',
    'bottomRight': 'Quarter screen bottom-right'
};
```

### Zone Coordinates
Snap zones are automatically calculated based on the available area:
- **Edge zones**: 50px strips along screen edges
- **Corner zones**: 100x100px squares in corners (override edges)
- **Detection priority**: Corners checked first, then edges

## CSS Customization

### Snap Preview Styling
```css
.snap-preview {
    background: rgba(0, 123, 255, 0.3);
    border: 2px solid rgba(0, 123, 255, 0.8);
    border-radius: 8px;
    box-shadow: 0 0 20px rgba(0, 123, 255, 0.4);
}
```

### Snap Animation Timing
```css
.window-snapping {
    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
```

### Zone Indicators (Debug Mode)
```css
.snap-zone-debug {
    border: 2px dashed rgba(255, 0, 0, 0.3);
    background: rgba(255, 0, 0, 0.1);
}
```

## User Experience Guidelines

### Snap Interaction Flow
1. **Start Drag**: User clicks and drags window titlebar
2. **Zone Detection**: System detects when mouse enters snap zones
3. **Hover Timer**: 800ms delay prevents accidental snapping
4. **Preview Display**: Blue overlay shows target snap area
5. **Snap Execution**: Release mouse to snap, or move away to cancel

### Visual Feedback
- **Preview Color**: Blue with transparency for clear visibility
- **Animation**: Smooth 300ms transitions with easing
- **Indicators**: Optional debug mode shows zone boundaries
- **Cursor**: Maintains drag cursor throughout interaction

## Performance Considerations

### Optimizations Included
- **Throttled Events**: Mouse move events are efficiently handled
- **Zone Caching**: Snap zone coordinates cached and updated only on resize
- **Animation Batching**: Uses CSS transitions for smooth performance
- **Memory Management**: Proper cleanup of timers and event listeners

### Best Practices
- **Minimal DOM Updates**: Snap preview element reused
- **Event Delegation**: Efficient global event handling
- **Debounced Resize**: Zone updates only when needed
- **CSS Hardware Acceleration**: Smooth animations via GPU

## Troubleshooting

### Common Issues

**Snap zones not working?**
- Check that `snapSystem.isEnabled` is true
- Verify available area is set correctly
- Ensure mouse events aren't blocked by other elements

**Preview not showing?**
- Confirm 800ms hover delay is being met
- Check CSS for `.snap-preview` element
- Verify zone detection with debug mode

**Animations choppy?**
- Reduce `animationDuration` for slower devices
- Check for CSS conflicts with transitions
- Ensure hardware acceleration is available

**Zones in wrong position?**
- Call `updateSnapZones()` after layout changes
- Verify `availableArea` coordinates are correct
- Check for CSS transforms affecting positioning

## Browser Compatibility

### Supported Features
- **Modern Browsers**: Chrome 60+, Firefox 55+, Safari 12+, Edge 79+
- **CSS Features**: Transforms, transitions, backdrop-filter
- **JavaScript**: ES6+ features, modern event handling
- **Performance**: RequestAnimationFrame, efficient DOM manipulation

### Fallbacks
- **Reduced Motion**: Respects `prefers-reduced-motion` setting
- **High Contrast**: Enhanced visibility in high contrast mode
- **Touch Devices**: Works with touch drag events
- **Older Browsers**: Graceful degradation of visual effects

## Future Enhancements

### Potential Additions
- **Custom Snap Layouts**: User-defined snap positions
- **Multi-Monitor Support**: Snap across multiple screens
- **Keyboard Shortcuts**: Snap via keyboard commands
- **Snap History**: Undo/redo snap operations
- **Magnetic Edges**: Windows attract to each other
- **Smart Layouts**: AI-suggested window arrangements

### Extension Points
- **Custom Zones**: Add new snap zone types
- **Animation Variants**: Different transition styles
- **Preview Themes**: Customizable preview appearance
- **Snap Callbacks**: Events for snap operations
- **Layout Persistence**: Save/restore snap layouts

## Testing Checklist

### Functional Tests
- [ ] All 8 snap zones trigger correctly
- [ ] Preview appears after 800ms hover
- [ ] Smooth animations on snap
- [ ] Window positioning accurate
- [ ] Icon support still works
- [ ] Existing features unchanged

### Edge Cases
- [ ] Rapid zone changes during drag
- [ ] Window size constraints respected
- [ ] Multiple windows don't interfere
- [ ] Resize handles work correctly
- [ ] Maximized windows handle snapping
- [ ] Minimized windows restore properly

### Performance Tests
- [ ] Smooth dragging with multiple windows
- [ ] No memory leaks during extended use
- [ ] Responsive on slower devices
- [ ] Efficient event handling
- [ ] CSS animations perform well

This enhanced WindowManager provides a complete desktop window management solution with both visual appeal (icons) and powerful functionality (snapping) while maintaining excellent performance and user experience.

