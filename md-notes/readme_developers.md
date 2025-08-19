# NebulaDesktop Developer Guide

## Project Overview

NebulaDesktop is a ChromeOS-inspired Linux desktop environment built with Electron. It features a sophisticated window management system, integrated AI assistants, modular applications, and a comprehensive widget system.

**Philosophy**: A self-hosting development environment where you can build NebulaDesktop using NebulaDesktop itself.

## Quick Start

### Prerequisites
- Node.js 16+ and npm
- Linux environment (primary target)
- Git for version control

### Installation
```bash
git clone https://github.com/yourusername/NebulaDesktop
cd NebulaDesktop
npm install
```

### Development
```bash
# Development mode with hot reload
npm run dev

# Production mode
npm start

# Build for distribution
npm run build
```

## Project Structure

```
NebulaDesktop/
├── main.js                    # Electron main process
├── package.json              # Dependencies and scripts
├── src/                      # Main source directory
│   ├── index.html            # Main renderer entry point
│   ├── preload.js           # Security bridge (IPC)
│   ├── apps/                # Modular applications
│   │   ├── browser.js       # Vertical tab browser
│   │   ├── filemanager.js   # File system navigator
│   │   ├── NebulaTerminal.js # Real terminal with file operations
│   │   ├── image-viewer.js  # Image viewing application
│   │   └── media-player.js  # Audio/video player
│   ├── js/                  # Core JavaScript modules
│   │   ├── renderer.js      # Desktop environment (taskbar, launcher)
│   │   ├── WindowManager.js # Window management system
│   │   ├── nebula-theme-manager.js # Theme system
│   │   ├── NebulaWidgetSystem.js   # Widget architecture
│   │   ├── code-assistant.js       # AI-powered IDE
│   │   ├── assistant.js            # General AI chat
│   │   ├── art-assistant.js        # Creative AI tools (shell)
│   │   └── NebulaSettings.js       # System settings
│   ├── css/                 # Stylesheets
│   │   ├── style.css        # Base layout and desktop
│   │   ├── nebula-theme.css # Core theme system
│   │   ├── window-manager.css      # Window styling
│   │   ├── nebula-theme-bridge.css # Theme integration
│   │   └── themes/          # OS-specific themes
│   │       ├── windows11-theme.css
│   │       ├── macos-theme.css
│   │       └── ubuntu-theme.css
│   ├── Templates/           # App development templates
│   │   ├── NebulaApp-Single.js     # Single window app
│   │   ├── NebulaApp-Tabbed.js     # Multi-tab app
│   │   └── NebulaApp-PWA.js        # Progressive web app
│   └── assets/              # Images, fonts, icons
├── CustomApps/              # User-created applications
├── assets/                  # Build assets
└── dist/                    # Built packages
```

## Architecture Overview

### Core Components (Load Order Critical)

```html
<!-- 1. CORE SYSTEMS (Load First) -->
<script src="js/WindowManager.js"></script>
<script src="js/nebula-theme-manager.js"></script>

<!-- 2. WIDGET SYSTEM (Before Apps) -->
<script src="js/NebulaWidgetSystem.js"></script>
<script src="js/Widgets/NebulaClock.js"></script>
<script src="js/Widgets/NebulaLauncher.js"></script>

<!-- 3. APPLICATIONS (Modular) -->
<script src="apps/browser.js"></script>
<script src="apps/filemanager.js"></script>
<script src="apps/NebulaTerminal.js"></script>
<script src="apps/image-viewer.js"></script>
<script src="apps/media-player.js"></script>

<!-- 4. AI ASSISTANTS -->
<script src="js/code-assistant.js"></script>
<script src="js/assistant.js"></script>
<script src="js/art-assistant.js"></script>

<!-- 5. DESKTOP ENVIRONMENT (Load Last) -->
<script src="js/renderer.js"></script>
```

**Critical**: This loading order ensures proper initialization and prevents dependency issues.

## Development Patterns

### 1. Application Development

All apps follow the WindowManager integration pattern:

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
            title: 'My App',
            width: 800,
            height: 600,
            app: this // Critical: Pass app instance
        });

        // Load app content
        this.loadContent();
        this.setupEventListeners();
    }

    loadContent() {
        const windowData = window.windowManager.windows.get(this.windowId);
        const contentArea = windowData.element.querySelector('.window-content');
        
        contentArea.innerHTML = `
            <!-- Your app UI here -->
        `;
    }

    // Required methods for WindowManager
    getTitle() { return 'My App'; }
    getIcon() { return '🚀'; }
    cleanup() { /* Clean up resources */ }
}

// Export globally
window.NebulaMyApp = NebulaMyApp;
```

### 2. Widget Development

Widgets extend the base NebulaWidget class:

```javascript
class MyWidget extends NebulaWidget {
    constructor(config = {}) {
        super(config);
        this.myProperty = config.myProperty || 'default';
    }

    render() {
        const element = document.createElement('div');
        element.className = 'my-widget';
        element.innerHTML = `
            <div class="widget-header">
                <span class="widget-title">My Widget</span>
                <div class="widget-controls">
                    <button data-action="close">×</button>
                </div>
            </div>
            <div class="widget-content">
                <!-- Widget content -->
            </div>
        `;
        return element;
    }

    getTitle() { return 'My Widget'; }
    getIcon() { return '🔧'; }
    cleanup() { /* Cleanup */ }
}

// Register with widget system
window.widgetSystem.registerWidget('mywidget', {
    name: 'My Widget',
    widgetClass: MyWidget,
    category: 'utility'
});
```

### 3. Theme Integration

All components must use the CSS variable system:

```css
.my-component {
    background: var(--nebula-surface, #ffffff);
    color: var(--nebula-text-primary, #1a202c);
    border: 1px solid var(--nebula-border, #e2e8f0);
    border-radius: var(--nebula-radius, 8px);
    padding: var(--nebula-spacing, 16px);
}

/* Dark theme support */
[data-theme="dark"] .my-component {
    background: var(--nebula-surface, #2d3748);
    color: var(--nebula-text-primary, #e2e8f0);
}
```

## Global Objects

After initialization, these objects are available:

```javascript
window.windowManager   // Window management system
window.nebulaDesktop  // Desktop environment instance
window.themeManager   // Theme system
window.widgetSystem   // Widget management (if enabled)
window.nebula         // IPC bridge (from preload.js)
```

## IPC Communication

Secure communication between main and renderer processes:

```javascript
// File operations
const content = await window.nebula.fs.readFile('/path/to/file');
await window.nebula.fs.writeFile('/path/to/file', content);
const files = await window.nebula.fs.readDir('/path/to/directory');

// System operations
await window.nebula.system.shutdown();
await window.nebula.system.reboot();

// Window operations
const windowId = await window.nebula.windows.create(options);
window.nebula.windows.close(windowId);

// Terminal operations
const result = await window.nebula.terminal.exec('ls', ['-la'], {});
```

## Self-Hosting Development Workflow

One of NebulaDesktop's unique features is the ability to develop itself:

1. **Open NebulaDesktop**
2. **Launch Code Assistant** (💻 from launcher)
3. **Navigate to source**: Load NebulaDesktop source files
4. **Use AI assistance**: Chat with Claude/ChatGPT for help
5. **Make changes**: Edit source code in Monaco editor
6. **Save changes**: Write back to source files
7. **Reload NebulaDesktop**: `Ctrl+R` or relaunch
8. **See changes**: Your modifications are live

This creates a recursive development environment where the tool builds itself.

## Adding New Applications

### Step 1: Create App File
Create `src/apps/myapp.js`:

```javascript
class NebulaMyApp {
    constructor() {
        this.windowId = null;
        this.init();
    }
    
    async init() {
        this.windowId = window.windowManager.createWindow({
            title: 'My App',
            width: 600,
            height: 400,
            app: this
        });
        
        this.loadContent();
    }
    
    loadContent() {
        // App implementation
    }
    
    getTitle() { return 'My App'; }
    getIcon() { return '🎯'; }
    cleanup() {}
}

window.NebulaMyApp = NebulaMyApp;
```

### Step 2: Add Styles
Create `src/css/myapp.css`:

```css
.myapp-container {
    background: var(--nebula-surface);
    color: var(--nebula-text-primary);
    height: 100%;
    padding: var(--nebula-spacing);
}
```

### Step 3: Include in HTML
Add to `src/index.html`:

```html
<link rel="stylesheet" href="css/myapp.css">
<script src="apps/myapp.js"></script>
```

### Step 4: Add to Launcher
Update `src/js/renderer.js`:

```javascript
this.apps = [
    // ... existing apps
    { name: 'My App', icon: '🎯', url: 'myapp://launch' }
];
```

### Step 5: Handle Launch
Add to `launchApp()` method:

```javascript
case 'myapp://launch':
    new NebulaMyApp();
    break;
```

## CSS Architecture

### Variable System
All colors, spacing, and design tokens use CSS variables:

```css
:root {
    /* Core colors */
    --nebula-primary: #667eea;
    --nebula-secondary: #764ba2;
    
    /* Surface colors */
    --nebula-surface: #ffffff;
    --nebula-surface-secondary: #f8f9fa;
    --nebula-surface-hover: #f1f5f9;
    --nebula-surface-active: #e2e8f0;
    
    /* Text colors */
    --nebula-text-primary: #1a202c;
    --nebula-text-secondary: #718096;
    --nebula-text-muted: #a0aec0;
    
    /* Spacing */
    --nebula-spacing: 16px;
    --nebula-spacing-sm: 8px;
    --nebula-spacing-lg: 24px;
    
    /* Radius */
    --nebula-radius: 8px;
    --nebula-radius-sm: 4px;
    --nebula-radius-lg: 12px;
}
```

### Component Structure
```css
.component-name {
    /* Use theme variables */
    background: var(--nebula-surface);
    color: var(--nebula-text-primary);
    
    /* Consistent spacing */
    padding: var(--nebula-spacing);
    margin: var(--nebula-spacing-sm);
    
    /* Consistent borders */
    border: 1px solid var(--nebula-border);
    border-radius: var(--nebula-radius);
}
```

## Debugging

### Development Tools
- **F12**: Open Electron DevTools
- **Ctrl+Shift+J**: Alternative DevTools shortcut
- **Ctrl+R**: Reload NebulaDesktop
- **npm run dev**: Hot reload during development

### Console Debugging
```javascript
// Window management debugging
console.log('Active windows:', window.windowManager.windows);
console.log('Window data:', window.windowManager.windows.get(windowId));

// Theme debugging
console.log('Current theme:', window.themeManager.currentTheme);
console.log('Available themes:', window.themeManager.availableThemes);

// Widget debugging
console.log('Active widgets:', window.widgetSystem.getActiveWidgets());
```

### Common Issues

1. **App Won't Load**: Check loading order in `index.html`
2. **Window Creation Fails**: Verify WindowManager is initialized
3. **Theme Issues**: Ensure CSS variables are defined
4. **IPC Errors**: Check preload.js is loading correctly
5. **File Operations Fail**: Verify file permissions and paths

### Troubleshooting Steps

1. **Check Console**: Look for JavaScript errors
2. **Verify Loading Order**: Ensure dependencies load first
3. **Test IPC**: Verify `window.nebula` is available
4. **Check File Paths**: Ensure all files exist and are referenced correctly
5. **Restart Clean**: Close NebulaDesktop completely and restart

## Performance Considerations

### Memory Management
- Always call `cleanup()` when closing apps
- Remove event listeners in cleanup methods
- Clear intervals and timeouts
- Dispose of Monaco editor instances

### Window Management
- Limit maximum number of open windows
- Use efficient DOM manipulation
- Minimize unnecessary re-renders
- Optimize CSS animations

### File Operations
- Use asynchronous file operations
- Implement proper error handling
- Cache frequently accessed files
- Validate file paths before operations

## Security

### IPC Security
- All IPC calls go through preload.js validation
- No direct Node.js access in renderer
- Context isolation enabled
- Input sanitization in main process

### Webview Security
- AI assistants use secure webview configuration
- No node integration in webviews
- Context isolation maintained
- Content security policies applied

## Testing

### Manual Testing
1. **App Launch**: Test all applications launch correctly
2. **Window Management**: Verify drag, resize, minimize, maximize
3. **Theme Switching**: Test all available themes
4. **File Operations**: Test file read/write/delete operations
5. **AI Integration**: Verify all AI services load correctly

### Development Testing
```bash
# Test in development mode
npm run dev

# Test production build
npm run build
npm start

# Test specific components
# (Use Code Assistant for live testing)
```

## Contributing

### Code Style
- Use consistent indentation (2 spaces)
- Follow existing naming conventions
- Add comments for complex logic
- Use meaningful variable names

### Commit Guidelines
```bash
git commit -m "feat: add new widget system"
git commit -m "fix: resolve window focus issue"
git commit -m "docs: update README with new features"
```

### Pull Request Process
1. Fork the repository
2. Create feature branch
3. Make changes following style guide
4. Test thoroughly in development mode
5. Update documentation if needed
6. Submit pull request with clear description

## Build and Distribution

### Development Build
```bash
npm run dev  # Hot reload enabled
```

### Production Build
```bash
npm run build     # Create distribution packages
npm run dist      # Build for all platforms
npm run dist:linux # Linux-specific build
```

### Package Structure
```
dist/
├── NebulaDesktop-linux-x64/    # Linux executable
├── NebulaDesktop.AppImage      # Portable Linux
└── NebulaDesktop.deb           # Debian package
```

## Future Development

### Planned Features
- Enhanced widget system with magnetic strips
- Advanced file manager with real operations
- Terminal improvements and customization
- Browser enhancements (bookmarks, history)
- Settings app expansion
- Voice assistant integration

### Extensibility
- Plugin system for third-party apps
- Theme marketplace
- Custom widget creation tools
- App store integration
- Cloud synchronization

## Resources

### Documentation
- **README-CORE.md**: Core architecture
- **README-APPS.md**: Application development
- **README-ASSISTANTS.md**: AI integration
- **README-WIDGETS.md**: Widget system

### External Dependencies
- **Electron**: Desktop app framework
- **Monaco Editor**: Code editing (Code Assistant)
- **XTerm.js**: Terminal emulation
- **Material Symbols**: Icon system

### Community
- GitHub Issues: Bug reports and feature requests
- Discussions: Development questions and ideas
- Wiki: Extended documentation and tutorials

---

**Remember**: NebulaDesktop is designed to be developed using NebulaDesktop itself. Use the Code Assistant, collaborate with AI, and enjoy the recursive development experience!