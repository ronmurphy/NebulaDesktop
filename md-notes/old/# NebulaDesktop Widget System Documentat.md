# NebulaDesktop Widget System Documentation

## Overview

The NebulaDesktop Widget System provides a framework for creating modular, draggable desktop widgets that integrate seamlessly with the existing window manager. Widgets are lightweight, self-contained components that can be positioned anywhere on the desktop.

## Architecture

### Core Components

#### 1. NebulaWidgetSystem
- **Location**: `js/NebulaWidgetSystem.js`
- **Purpose**: Main manager for widget registration, lifecycle, and positioning
- **Key Features**:
  - Widget type registration
  - Instance creation and management
  - Drag functionality integration
  - Z-index management (widgets: 1000-1999, windows: 2000+)

#### 2. NebulaWidget (Base Class)
- **Purpose**: Abstract base class that all widgets must extend
- **Required Methods**:
  - `render()` - Returns HTMLElement for widget content
  - `getTitle()` - Returns widget display name
  - `getIcon()` - Returns widget icon
  - `cleanup()` - Cleanup when widget is removed

#### 3. Widget Integration
- **Location**: `js/WidgetIntegration.js`
- **Purpose**: Development tools and testing utilities
- **Features**:
  - Dev control panel
  - Right-click context menu
  - Console helper functions

## Widget Development Guide

### Creating a New Widget

#### Step 1: Extend NebulaWidget
```javascript
class MyWidget extends NebulaWidget {
    constructor(config = {}) {
        super(config);
        // Initialize widget-specific properties
        this.myProperty = config.myProperty || 'default';
    }

    init() {
        // Optional: Initialize widget (called after construction)
    }

    render() {
        // REQUIRED: Return HTMLElement for widget content
        const element = document.createElement('div');
        element.className = 'my-widget';
        element.innerHTML = `
            <div class="widget-header">
                <span class="widget-title">My Widget</span>
                <div class="widget-controls">
                    <button data-action="settings">⚙️</button>
                    <button data-action="close">×</button>
                </div>
            </div>
            <div class="widget-content">
                <!-- Widget content here -->
            </div>
        `;
        
        this.setupEventListeners(element);
        return element;
    }

    setupEventListeners(element) {
        element.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action === 'close') {
                this.handleClose();
            } else if (action === 'settings') {
                this.handleSettings();
            }
        });
    }

    handleClose() {
        if (window.widgetSystem) {
            window.widgetSystem.removeWidget(this.id);
        }
    }

    getTitle() {
        return 'My Widget';
    }

    getIcon() {
        return '🔧';
    }

    cleanup() {
        // Clean up resources, event listeners, timers, etc.
    }
}
```

#### Step 2: Add CSS Styles
```javascript
const myWidgetStyles = `
<style id="my-widget-styles">
.my-widget {
    background: var(--nebula-surface, #ffffff);
    border: 1px solid var(--nebula-border, #e2e8f0);
    border-radius: var(--nebula-radius-lg, 12px);
    min-width: 200px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: var(--nebula-text-primary, #1a202c);
}

.widget-header {
    background: var(--nebula-primary, #667eea);
    color: white;
    padding: 8px 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: move;
}

.widget-content {
    padding: 16px;
}

/* Dark theme support */
[data-theme="dark"] .my-widget {
    background: var(--nebula-surface, #2d3748);
    border-color: var(--nebula-border, #4a5568);
    color: var(--nebula-text-primary, #e2e8f0);
}
</style>
`;

// Inject styles
if (!document.getElementById('my-widget-styles')) {
    document.head.insertAdjacentHTML('beforeend', myWidgetStyles);
}
```

#### Step 3: Register Widget
```javascript
// Register with widget system
if (window.NebulaWidgetSystem && window.widgetSystem) {
    window.widgetSystem.registerWidget('mywidget', {
        name: 'My Widget',
        description: 'Description of what this widget does',
        category: 'utility',
        icon: '🔧',
        widgetClass: MyWidget,
        defaultConfig: {
            myProperty: 'defaultValue',
            x: 100,
            y: 100
        },
        author: 'Your Name',
        version: '1.0.0'
    });
}

// Make globally available
window.MyWidget = MyWidget;
```

## Widget System API

### NebulaWidgetSystem Methods

#### `registerWidget(widgetId, widgetInfo)`
Register a new widget type.

**Parameters:**
- `widgetId` (string) - Unique identifier for widget type
- `widgetInfo` (object) - Widget registration information
  - `name` (string) - Display name
  - `description` (string) - Widget description
  - `category` (string) - Widget category
  - `icon` (string) - Widget icon (emoji/text)
  - `widgetClass` (class) - Widget class constructor
  - `defaultConfig` (object) - Default configuration
  - `author` (string) - Widget author
  - `version` (string) - Widget version

#### `createWidget(widgetId, config)`
Create a new widget instance.

**Parameters:**
- `widgetId` (string) - Type of widget to create
- `config` (object) - Widget configuration
  - `x` (number) - X position
  - `y` (number) - Y position
  - Additional widget-specific config

**Returns:** `instanceId` (string) - Unique instance identifier

#### `removeWidget(instanceId)`
Remove a widget instance.

#### `getRegisteredWidgets()`
Get array of all registered widget types.

#### `getActiveWidgets()`
Get array of all active widget instances.

## Widget Patterns

### Titlebar vs Minimal Widgets

#### Titlebar Widget
- Full header with title and controls
- Drag from titlebar area
- More traditional window-like appearance

#### Minimal Widget
- No titlebar, just content
- Hover controls (top-right corner)
- Drag from content area
- Clean, minimal appearance

### Settings Menu Pattern
```javascript
// In widget render()
<div class="settings-menu" id="settings-menu-${this.id}" style="display: none;">
    <div class="settings-menu-item" data-action="option1">
        <span class="menu-icon">🔧</span>
        <span class="menu-text">Option 1</span>
    </div>
    <div class="settings-menu-item" data-action="option2">
        <span class="menu-icon">⚙️</span>
        <span class="menu-text">Option 2</span>
    </div>
</div>

// In event handler
else if (action === 'settings') {
    this.toggleSettingsMenu();
}
```

### Configuration Management
```javascript
constructor(config = {}) {
    super(config);
    // Use config with fallbacks
    this.myOption = config.myOption || 'default';
    this.showSomething = config.showSomething !== false; // Default true
    this.someNumber = config.someNumber || 100;
}
```

## CSS Guidelines

### Theme Integration
Always use CSS custom properties for theming:
```css
.my-widget {
    background: var(--nebula-surface, #ffffff);
    color: var(--nebula-text-primary, #1a202c);
    border: 1px solid var(--nebula-border, #e2e8f0);
}

[data-theme="dark"] .my-widget {
    background: var(--nebula-surface, #2d3748);
    color: var(--nebula-text-primary, #e2e8f0);
    border-color: var(--nebula-border, #4a5568);
}
```

### Standard Classes
- `.widget-header` - Widget titlebar
- `.widget-controls` - Control buttons container
- `.widget-control-btn` - Individual control button
- `.minimal-controls` - Hover controls for minimal widgets
- `.settings-menu` - Dropdown settings menu
- `.settings-menu-item` - Individual menu item

## File Structure

```
src/js/
├── NebulaWidgetSystem.js      # Core widget system
├── WidgetIntegration.js       # Development tools
└── Widgets/
    ├── NebulaClock.js         # Example clock widget
    └── MyWidget.js            # Your custom widget
```

## Loading Order

In `index.html`:
```html
<!-- Core Systems -->
<script src="js/WindowManager.js"></script>

<!-- Widget System -->
<script src="js/NebulaWidgetSystem.js"></script>
<script src="js/Widgets/NebulaClock.js"></script>
<script src="js/Widgets/MyWidget.js"></script>

<!-- Other Apps -->
<script src="apps/browser.js"></script>
<!-- ... other apps ... -->

<!-- Integration -->
<script src="js/WidgetIntegration.js"></script>

<!-- Desktop Environment -->
<script src="js/renderer.js"></script>
```

## Development Tools

### Dev Control Panel
- Located in top-right corner when system loads
- Create test widgets
- List active widgets
- Clear all widgets
- Widget configuration placeholder

### Console Commands
- `createTestClock(x, y)` - Create clock at position
- `listWidgets()` - List all active widgets
- `clearAllWidgets()` - Remove all widgets

### Right-Click Context Menu
- Right-click desktop to create widgets
- Auto-positioning at click location

## Best Practices

### Performance
- Clean up resources in `cleanup()` method
- Use `requestAnimationFrame` for animations
- Debounce frequent updates
- Remove event listeners when widget is destroyed

### User Experience
- Provide clear visual feedback
- Use consistent icons and terminology
- Support both light and dark themes
- Make widgets easily draggable

### Code Quality
- Extend `NebulaWidget` base class
- Follow naming conventions
- Document complex functionality
- Handle edge cases gracefully

### Future Features
- Global widget configuration system
- Widget persistence/save layouts
- Custom CSS override system
- Widget templates in Code Assistant
- Magnetic strip positioning system

## Example: Clock Widget

See `js/Widgets/NebulaClock.js` for a complete, working example that demonstrates:
- Titlebar and minimal variants
- Settings menu with options
- Time formatting and updates
- Proper cleanup and resource management
- Theme integration
- Event handling patterns

This serves as the reference implementation for the widget system.