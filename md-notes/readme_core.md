# NebulaDesktop Core Architecture

## Overview

NebulaDesktop is built on a solid Electron foundation with a sophisticated window management system, comprehensive theming, and modular architecture. This document covers the core components that form the foundation of the entire desktop environment.

## Core Components

### 1. Electron Main Process (`main.js`)

The main process handles system-level operations and provides secure IPC bridges to the renderer.

**Key Features:**
- **Window Management**: Creates and manages Electron windows
- **System Operations**: Shutdown, reboot, logout functionality
- **File System Bridge**: Secure file operations through IPC
- **Terminal Integration**: Command execution and shell operations
- **Native Dialogs**: File open/save dialogs

**IPC Handlers:**
```javascript
// System operations
system:shutdown, system:reboot, system:logout

// Window management  
window:create, window:close, window:minimize, window:maximize

// File system (secure bridge)
fs:readdir, fs:readfile, fs:writefile, fs:homedir, fs:stat, fs:exists, fs:mkdir, fs:rmdir, fs:unlink

// Terminal operations
terminal:exec - Execute shell commands safely

// Native dialogs
dialog:openFile, dialog:saveFile
```

**Development Mode:**
- Hot reload with `electron-reload`
- DevTools auto-open
- Windowed mode (not fullscreen/kiosk)

### 2. Security Bridge (`preload.js`)

Provides secure communication between main and renderer processes while maintaining security isolation.

**Exposed APIs:**
```javascript
window.nebula = {
    system: { platform, shutdown, reboot, logout },
    windows: { create, close, minimize, maximize, focus },
    fs: { readDir, readFile, writeFile, getHomeDir, stat, exists, mkdir, rmdir, unlink },
    browser: { createTab, navigate, back, forward, refresh },
    terminal: { exec, getCwd, setCwd, getSystemInfo, getEnv },
    dialog: { openFile, saveFile },
    code: { executeJS, validateJS },
    on: (channel, callback), // Event listeners
    removeListener: (channel, callback)
}
```

**Security Features:**
- Context isolation enabled
- Node integration disabled
- Whitelist-based IPC communication
- Input validation and sanitization

### 3. Window Manager (`WindowManager.js`)

The heart of NebulaDesktop's window system - manages all application windows with advanced features.

**Core Capabilities:**
- **Window Creation**: Flexible window creation with configuration
- **Window Lifecycle**: Complete lifecycle management
- **Drag & Drop**: Smooth window dragging with constraints
- **Resize Handling**: 8-point resize with proper constraints
- **Z-Index Management**: Automatic focus and stacking
- **Snap System**: Advanced window snapping to screen edges
- **App Integration**: Seamless app loading and management

**Window Configuration:**
```javascript
const config = {
    title: 'Window Title',
    width: 800, height: 600,
    x: 100, y: 100,
    resizable: true,
    maximizable: true,
    minimizable: true,
    hasTabBar: false, // For multi-tab apps like browser
    isTitlebarOnly: false, // Minimal titlebar mode
    app: null // Associated app instance
}
```

**App Integration Patterns:**
- **Single Window Apps**: File manager, settings, etc.
- **Multi-Tab Apps**: Browser with tab management
- **Titlebar-Only Mode**: Minimal widget-like windows

**Advanced Features:**
- **Snap Zones**: Edge snapping with visual feedback
- **Available Area**: Respects taskbars and pinned panels
- **Cascade Positioning**: Intelligent new window placement
- **Memory Management**: Proper cleanup and resource management

### 4. Desktop Environment (`renderer.js`)

The main desktop shell that orchestrates all components and provides the user interface.

**Core Responsibilities:**
- **Taskbar Management**: Dynamic taskbar with running apps
- **App Launcher**: Grid-based launcher with search and categories
- **Power Menu**: System power controls
- **Event Coordination**: Global keyboard shortcuts and events
- **Configuration**: User preference loading and saving

**Initialization Sequence:**
1. Initialize WindowManager
2. Setup theme system
3. Create UI components (taskbar, desktop, launcher)
4. Load user configuration
5. Initialize assistants and widgets
6. Setup global event listeners

**Key Components:**
```javascript
class NebulaDesktop {
    constructor() {
        this.taskbar = null;
        this.launcher = null;
        this.powerMenu = null;
        this.windowManager = null;
        this.assistant = null;
        this.themeManager = null;
    }
}
```

**App Launch System:**
- URL-based app launching (`browser://new`, `files://local`)
- Debounced launch prevention
- Running app tracking and management
- Integration with WindowManager for window creation

### 5. Theme System (`nebula-theme-manager.js`)

Comprehensive theming system supporting multiple UI paradigms and operating system themes.

**Theme Architecture:**
- **CSS Variables**: Consistent design tokens
- **Dynamic Theming**: Runtime theme switching
- **OS Theme Variants**: Windows, macOS, Ubuntu themes
- **Icon Integration**: Material Symbols with theme-aware colors

**Available Themes:**
- **Default Nebula**: Glassmorphism with blur effects
- **Windows 10**: Fluent Design inspiration
- **Windows 11**: Modern Windows aesthetic  
- **macOS**: Big Sur/Monterey style
- **Ubuntu**: GNOME-inspired design

**CSS Variable System:**
```css
:root {
    /* Core Colors */
    --nebula-primary: #667eea;
    --nebula-secondary: #764ba2;
    
    /* Surface Colors */
    --nebula-surface: #ffffff;
    --nebula-surface-secondary: #f8f9fa;
    --nebula-surface-hover: #f1f5f9;
    
    /* Text Colors */
    --nebula-text-primary: #1a202c;
    --nebula-text-secondary: #718096;
    
    /* Spacing & Layout */
    --nebula-radius: 8px;
    --nebula-radius-lg: 12px;
    --nebula-spacing: 16px;
}
```

**Theme Bridge System:**
- **nebula-theme-bridge.css**: Ensures all apps use theme variables
- **Automatic Conversion**: Legacy apps automatically themed
- **Dark Mode Support**: Complete dark theme variants

## File Structure

```
src/
├── main.js                 # Electron main process
├── preload.js             # Security bridge
├── index.html             # Main renderer entry
├── js/
│   ├── renderer.js        # Desktop environment
│   ├── WindowManager.js   # Window management
│   └── nebula-theme-manager.js # Theme system
└── css/
    ├── style.css          # Base layout
    ├── nebula-theme.css   # Core theme
    └── window-manager.css # Window styling
```

## Loading Order

Critical loading sequence for proper initialization:

```html
<!-- 1. Core Window System -->
<script src="js/WindowManager.js"></script>
<script src="js/nebula-theme-manager.js"></script>

<!-- 2. Widget System -->
<script src="js/NebulaWidgetSystem.js"></script>

<!-- 3. Applications -->
<script src="apps/browser.js"></script>
<script src="apps/filemanager.js"></script>
<!-- ... other apps ... -->

<!-- 4. Assistant Systems -->
<script src="js/code-assistant.js"></script>
<script src="js/assistant.js"></script>

<!-- 5. Desktop Environment (LAST) -->
<script src="js/renderer.js"></script>
```

## Development

### Building and Running

```bash
# Development with hot reload
npm run dev

# Production build
npm start

# Package for distribution
npm run build
```

### Key Architectural Principles

1. **Security First**: Proper context isolation and IPC validation
2. **Modular Design**: Each component is self-contained and reusable
3. **Theme Consistency**: All components use the same CSS variable system
4. **Performance**: Efficient window management and memory usage
5. **Extensibility**: Easy to add new apps, widgets, and themes

### Global Objects

After initialization, these objects are available globally:

```javascript
window.windowManager    // Window management
window.nebulaDesktop   // Main desktop instance
window.themeManager    // Theme system
window.widgetSystem    // Widget management (if loaded)
```

## Troubleshooting

### Common Issues

1. **Window Creation Fails**: Check WindowManager initialization order
2. **IPC Errors**: Verify preload.js is loaded correctly
3. **Theme Issues**: Ensure CSS variables are defined
4. **App Loading**: Check loading order in index.html

### Debug Tools

- **F12**: Open DevTools (Electron)
- **Ctrl+Shift+J**: Alternative DevTools shortcut
- **Console Logging**: Extensive logging throughout core components

## Next Steps

- See **README-APPS.md** for application development
- See **README-WIDGETS.md** for widget system
- See **README-ASSISTANTS.md** for AI integration
- See **README-DEVELOPERS.md** for contribution guidelines