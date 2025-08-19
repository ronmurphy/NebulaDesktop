# NebulaDesktop Application System

## Overview

NebulaDesktop features a sophisticated modular application system built on top of the WindowManager. Each application is a self-contained JavaScript class that integrates seamlessly with the desktop environment while maintaining its own functionality and state.

**Architecture Philosophy**: Apps are independent modules that leverage the shared WindowManager infrastructure for consistent UI behavior while implementing their own specialized functionality.

## Application Categories

### 🚀 Fully Functional Applications

#### 1. Vertical Tab Browser (`browser.js`)

The flagship application - a professional-grade browser with unique vertical tab layout optimized for desktop workflows.

**Key Features:**
- **Vertical Tab Sidebar**: Space-efficient tab management
- **Webview Integration**: Full Chrome rendering engine
- **Professional Navigation**: Address bar, back/forward, refresh
- **Favicon Display**: Visual tab identification
- **Tab Management**: Add, close, switch between unlimited tabs
- **URL Validation**: Smart URL handling and correction

**Architecture:**
```javascript
class NebulaBrowser {
    constructor(initialUrl = 'https://google.com') {
        this.windowId = null;
        this.tabs = new Map(); // tabId -> tabData
        this.activeTab = null;
        this.nextTabId = 1;
        this.init(initialUrl);
    }
}
```

**Tab Management System:**
```javascript
// Each tab maintains its own state
const tabData = {
    id: tabId,
    url: url,
    title: 'Loading...',
    favicon: null,
    webview: webviewElement,
    isLoading: false
};
```

**Multi-Tab Integration:**
- WindowManager creates a window with `hasTabBar: true`
- Browser manages tab creation and switching
- Each tab has its own webview for isolation
- Tab state persists across window operations

**Usage Patterns:**
```javascript
// Launch browser with specific URL
new NebulaBrowser('https://github.com');

// Launch browser (defaults to Google)
new NebulaBrowser();
```

#### 2. Advanced Terminal (`NebulaTerminal.js`)

A revolutionary hybrid terminal that combines traditional command-line functionality with modern file management features.

**Unique Features:**
- **Real Command Execution**: Actual shell command processing
- **Interactive File Navigation**: Clickable `ls` output
- **Visual File Identification**: Emoji icons for file types
- **Hybrid Interface**: Terminal + file manager functionality
- **Working Directory Tracking**: Persistent directory state
- **JavaScript Execution**: Built-in JS interpreter

**File Type Recognition:**
```
📁 Directories        🎵 Audio files (.mp3, .wav, .flac)
📄 Text files         🎬 Video files (.mp4, .avi, .mkv)
🖼️ Images             📦 Archives (.zip, .tar, .gz)
💻 Code files         ⚙️ Config files (.json, .yml, .ini)
📊 Data files         🔧 Executable files
```

**Interactive Features:**
- **Click to Navigate**: Click on folders in `ls` output to `cd` into them
- **Click to Open**: Click on files to display contents with `cat`
- **Visual Feedback**: Hover effects and clear file type identification
- **Context Awareness**: Smart handling of different file types

**Built-in Commands:**
```bash
# Navigation
pwd, cd, ls, ll

# File Operations  
cat, mkdir, rmdir, rm, touch

# System Info
date, whoami, uname, history

# Development
js <code>  # Execute JavaScript
debug <cmd>  # Debug commands

# Utility
help, clear, exit
```

**Real System Integration:**
```javascript
// Execute actual shell commands
const result = await window.nebula.terminal.exec('git', ['status'], {});
console.log(result.stdout);
```

**Why NebulaTerminal Replaces File Manager:**
- **Actually Functional**: Real file operations vs. mock data
- **More Powerful**: Terminal commands + visual interface
- **Better Integration**: Seamless with development workflow
- **Enhanced UX**: Click-to-navigate makes it user-friendly

#### 3. Code Assistant (`code-assistant.js`)

*See README-ASSISTANTS.md for comprehensive documentation*

Professional IDE with Monaco editor, AI integration, and template system for self-hosting development.

#### 4. AI Assistant (`assistant.js`)

*See README-ASSISTANTS.md for comprehensive documentation*

Left-sliding AI chat panel with multiple service integration.

#### 5. Image Viewer (`image-viewer.js`)

Functional image viewing application with basic image display capabilities.

**Features:**
- **Image Loading**: Display various image formats
- **Basic Controls**: Open, close, navigate
- **WindowManager Integration**: Standard window controls

**Status**: ✅ Functional for basic image viewing

### 🚧 Non-Functional Applications

#### File Manager (`filemanager.js`)

**Status**: ❌ **NOT FUNCTIONAL - DO NOT USE**

**Issues:**
- Uses mock data instead of real file operations
- Navigation doesn't actually work
- File operations are simulated only
- UI exists but has no real functionality

**Replacement**: Use **NebulaTerminal** instead, which provides:
- Real file operations
- Interactive navigation
- Better visual feedback
- Actual functionality

**For Developers**: This app serves as a UI template only. The interface design can be referenced, but all functionality needs to be reimplemented.

#### Media Player (`media-player.js`)

**Status**: ❌ **MOCKUP ONLY - NOT FUNCTIONAL**

**Current State:**
- UI mockup with media player appearance
- No actual audio/video playback capability
- Control buttons are non-functional
- Created as design prototype only

**Future Development:**
- Needs complete rewrite with actual media libraries
- HTML5 audio/video element integration required
- Playlist and library functionality to be implemented

### 🔧 Shell Applications

#### Art Assistant (`art-assistant.js`)

**Status**: 🏗️ **SHELL APPLICATION**

Basic framework exists for future creative AI tool development. See README-ASSISTANTS.md for details.

## Application Architecture Patterns

### 1. WindowManager Integration

All functional apps follow this integration pattern:

```javascript
class NebulaMyApp {
    constructor(config = {}) {
        this.windowId = null;
        this.config = config;
        this.init();
    }

    async init() {
        // Create window through WindowManager
        this.windowId = window.windowManager.createWindow({
            title: this.getTitle(),
            width: 800,
            height: 600,
            resizable: true,
            maximizable: true,
            minimizable: true,
            hasTabBar: false, // Set to true for multi-tab apps
            app: this // CRITICAL: Pass app instance
        });

        // Setup app content and functionality
        this.loadContent();
        this.setupEventListeners();
    }

    loadContent() {
        const windowData = window.windowManager.windows.get(this.windowId);
        const contentArea = windowData.element.querySelector('.window-content');
        
        contentArea.innerHTML = this.renderUI();
    }

    // Required methods for WindowManager integration
    getTitle() { return 'My Application'; }
    getIcon() { return '🚀'; }
    cleanup() {
        // Clean up resources, event listeners, etc.
    }
}

// Global export for launcher integration
window.NebulaMyApp = NebulaMyApp;
```

### 2. Single Window Apps

Most apps use the single window pattern:

**Examples**: NebulaTerminal, Image Viewer, Code Assistant

```javascript
// Simple window creation
this.windowId = window.windowManager.createWindow({
    title: 'My App',
    width: 600,
    height: 400,
    app: this
});
```

### 3. Multi-Tab Apps

Complex apps like Browser use the multi-tab pattern:

```javascript
// Multi-tab window creation
this.windowId = window.windowManager.createWindow({
    title: 'Browser',
    width: 1000,
    height: 700,
    hasTabBar: true, // Enables tab functionality
    app: this
});

// Tab management through WindowManager
this.createTab(url);
this.switchTab(tabId);
this.closeTab(tabId);
```

### 4. Content Loading Patterns

#### Direct HTML Content
```javascript
loadContent() {
    const contentArea = this.getContentArea();
    contentArea.innerHTML = `
        <div class="app-content">
            <!-- Your app UI here -->
        </div>
    `;
}
```

#### Dynamic Component Creation
```javascript
loadContent() {
    const contentArea = this.getContentArea();
    
    const toolbar = this.createToolbar();
    const mainArea = this.createMainArea();
    const statusBar = this.createStatusBar();
    
    contentArea.appendChild(toolbar);
    contentArea.appendChild(mainArea);
    contentArea.appendChild(statusBar);
}
```

## Launcher Integration

### App Registration

Apps are registered in the launcher system through `renderer.js`:

```javascript
this.apps = [
    { name: 'Browser', icon: '🌐', url: 'browser://new' },
    { name: 'Terminal', icon: '💻', url: 'terminal://new' },
    { name: 'Code Assistant', icon: '🛠️', url: 'code-assistant://new' },
    { name: 'Image Viewer', icon: '🖼️', url: 'image-viewer://new' },
    // Note: File Manager and Media Player not included (non-functional)
];
```

### Launch URL Handling

The `launchApp()` method handles URL-based app launching:

```javascript
launchApp(url) {
    switch(url) {
        case 'browser://new':
            new NebulaBrowser();
            break;
        case 'terminal://new':
            new NebulaTerminal();
            break;
        case 'code-assistant://new':
            new NebulaCodeAssistant();
            break;
        case 'image-viewer://new':
            new NebulaImageViewer();
            break;
        // Broken apps not included in switch
    }
}
```

## Development Guidelines

### Creating New Applications

#### Step 1: Application Class Structure
```javascript
class NebulaMy {
    constructor(config = {}) {
        this.windowId = null;
        this.config = config;
        
        // App-specific properties
        this.data = null;
        this.state = 'ready';
        
        this.init();
    }

    async init() {
        await this.setupWindow();
        await this.loadData();
        this.render();
        this.setupEventListeners();
    }

    async setupWindow() {
        this.windowId = window.windowManager.createWindow({
            title: this.getTitle(),
            width: 800,
            height: 600,
            app: this
        });
    }

    render() {
        const contentArea = this.getContentArea();
        contentArea.innerHTML = this.getTemplate();
    }

    getTemplate() {
        return `
            <div class="myapp-container">
                <div class="myapp-toolbar">
                    <!-- Toolbar content -->
                </div>
                <div class="myapp-content">
                    <!-- Main content -->
                </div>
                <div class="myapp-statusbar">
                    <!-- Status bar -->
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // App-specific event handling
    }

    // WindowManager required methods
    getTitle() { return 'My Application'; }
    getIcon() { return '⚡'; }
    cleanup() {
        // Cleanup resources
    }

    // Utility methods
    getContentArea() {
        const windowData = window.windowManager.windows.get(this.windowId);
        return windowData.element.querySelector('.window-content');
    }
}

window.NebulaMy = NebulaMy;
```

#### Step 2: CSS Styling

Create `src/css/myapp.css`:

```css
.myapp-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--nebula-surface);
    color: var(--nebula-text-primary);
}

.myapp-toolbar {
    height: 48px;
    background: var(--nebula-surface-secondary);
    border-bottom: 1px solid var(--nebula-border);
    display: flex;
    align-items: center;
    padding: 0 16px;
    gap: 8px;
}

.myapp-content {
    flex: 1;
    padding: 16px;
    overflow: auto;
}

.myapp-statusbar {
    height: 24px;
    background: var(--nebula-surface-secondary);
    border-top: 1px solid var(--nebula-border);
    display: flex;
    align-items: center;
    padding: 0 16px;
    font-size: 12px;
    color: var(--nebula-text-secondary);
}

/* Dark theme support */
[data-theme="dark"] .myapp-container {
    background: var(--nebula-surface);
    color: var(--nebula-text-primary);
}
```

#### Step 3: Integration

1. **Add to index.html**:
```html
<link rel="stylesheet" href="css/myapp.css">
<script src="apps/myapp.js"></script>
```

2. **Add to launcher** in `renderer.js`:
```javascript
{ name: 'My App', icon: '⚡', url: 'myapp://new' }
```

3. **Add launch handler**:
```javascript
case 'myapp://new':
    new NebulaMy();
    break;
```

### Best Practices

#### Performance
- **Lazy Loading**: Load content only when needed
- **Event Cleanup**: Remove listeners in `cleanup()` method
- **Memory Management**: Clear references and intervals
- **Efficient DOM**: Minimize DOM manipulation

#### User Experience
- **Loading States**: Show progress for slow operations
- **Error Handling**: Graceful error messages
- **Keyboard Shortcuts**: Support common shortcuts
- **Accessibility**: Proper ARIA labels and navigation

#### Code Quality
- **Consistent Naming**: Follow NebulaDesktop conventions
- **Error Boundaries**: Handle exceptions gracefully
- **Documentation**: Comment complex functionality
- **Testing**: Verify functionality before integration

## Application Templates

### Single Window Template (`Templates/NebulaApp-Single.js`)

Pre-built template for simple single-window applications:

```javascript
// Ready-to-use single window app template
class NebulaMyApp {
    // Complete implementation with toolbar, content, status bar
    // TODO comments for customization points
    // Example event handlers and common patterns
}
```

### Multi-Tab Template (`Templates/NebulaApp-Tabbed.js`)

Template for complex multi-tab applications like browsers:

```javascript
// Multi-tab application template
class NebulaMyTabbedApp {
    // Tab management system
    // Content switching logic
    // Tab creation and destruction
}
```

### PWA Template (`Templates/NebulaApp-PWA.js`)

Template for Progressive Web App hosting:

```javascript
// PWA hosting template
class NebulaPWAHost {
    // Webview integration
    // Navigation controls
    // App-like experience
}
```

## Debugging Applications

### Development Tools

```javascript
// App debugging in console
console.log('App state:', this);
console.log('Window data:', window.windowManager.windows.get(this.windowId));
console.log('Content area:', this.getContentArea());

// WindowManager debugging
console.log('All windows:', window.windowManager.windows);
console.log('Active window:', window.windowManager.activeWindow);
```

### Common Issues

1. **App Won't Launch**
   - Check class is exported to `window` object
   - Verify launcher URL handler exists
   - Check for JavaScript errors in console

2. **Window Creation Fails**
   - Ensure WindowManager is initialized
   - Check window configuration parameters
   - Verify `app: this` is passed to createWindow

3. **Content Not Loading**
   - Check `loadContent()` method implementation
   - Verify CSS file is included
   - Check for DOM query selector errors

4. **Event Handlers Not Working**
   - Ensure `setupEventListeners()` is called
   - Check event delegation for dynamic content
   - Verify element selectors are correct

### Testing Workflow

1. **Launch in Development Mode**: `npm run dev`
2. **Open DevTools**: F12 for debugging
3. **Test App Launch**: Use launcher or direct instantiation
4. **Check Console**: Look for errors or warnings
5. **Test Window Operations**: Drag, resize, minimize, maximize
6. **Test App Functionality**: Verify all features work
7. **Test Cleanup**: Close app and check for memory leaks

## File Structure

```
src/
├── apps/
│   ├── browser.js           # ✅ Functional - Vertical tab browser
│   ├── NebulaTerminal.js    # ✅ Functional - Advanced terminal
│   ├── image-viewer.js      # ✅ Functional - Basic image viewer
│   ├── filemanager.js       # ❌ NON-FUNCTIONAL - Use terminal instead
│   └── media-player.js      # ❌ MOCKUP ONLY - Not implemented
├── css/
│   ├── browser.css          # Browser styling
│   ├── vertical-browser.css # Vertical tab system
│   ├── filemanager.css      # File manager UI (reference only)
│   └── [app-name].css       # App-specific styles
└── Templates/
    ├── NebulaApp-Single.js   # Single window template
    ├── NebulaApp-Tabbed.js   # Multi-tab template
    └── NebulaApp-PWA.js      # PWA hosting template
```

## Future Development

### Planned Enhancements

**Browser Improvements:**
- Bookmark management system
- Browsing history
- Tab persistence across sessions
- Advanced webview controls

**Terminal Enhancements:**
- Terminal themes and customization
- Advanced command history
- Tab completion improvements
- Plugin system for custom commands

**New Applications:**
- **Functional File Manager**: Replace broken filemanager.js
- **Media Player**: Complete audio/video implementation
- **Settings v2**: Advanced system configuration
- **Text Editor**: Lightweight document editing
- **Calculator**: System calculator utility

### App Store Integration

Future vision includes a NebulaDesktop App Store:

- **Third-party Apps**: Community-developed applications
- **App Templates**: Downloadable starting points
- **Plugin System**: Extensible app functionality
- **Auto-updates**: Seamless app updating system

## Contributing

When developing applications for NebulaDesktop:

1. **Follow Patterns**: Use established architectural patterns
2. **Test Thoroughly**: Verify functionality across all window operations
3. **Document Well**: Include clear comments and documentation
4. **Use Templates**: Start with provided templates when possible
5. **Theme Integration**: Always use CSS variable system
6. **Error Handling**: Implement robust error handling
7. **Performance**: Optimize for smooth desktop experience

---

**Remember**: Use the functional NebulaTerminal instead of the broken File Manager, and remember that the Media Player is just a mockup. The Browser and Terminal are your powerhouse applications!