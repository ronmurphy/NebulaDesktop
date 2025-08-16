# NebulaApp PWA Template - Simplified Version

A clean, minimal Progressive Web App hosting template for NebulaDesktop. This simplified version provides a full-screen web experience with navigation controls accessible via right-click context menu.

## Features

### 🌐 Clean Web Hosting
- **Full-Screen Webview**: Maximum screen real estate for web content
- **Right-Click Navigation**: Context menu with all navigation controls
- **No Visual Chrome**: Clean, app-like experience without browser UI
- **Webview Technology**: Full compatibility with any website (no iframe restrictions)

### 🎯 Minimal Interface
- **Content-First Design**: Web content takes up the entire window
- **Hidden Controls**: Navigation only appears when needed
- **Status Bar**: Minimal status information at the bottom
- **Context Menu**: Right-click for Back, Forward, Refresh, Home, URL change, and Fullscreen

### 🎨 Nebula Integration
- **Nebula Theme System**: Consistent with Nebula design language
- **Window Management**: Full integration with Nebula window system
- **Material Design Icons**: Uses Google Material Symbols in context menu
- **Dark/Light Theme**: Automatic theme adaptation for context menu

## Perfect For

### 🖥️ Web App Hosting
- **Dedicated Web Applications**: Host specific web apps without browser chrome
- **Kiosk Mode**: Full-screen web experiences
- **Dashboard Displays**: Clean presentation of web-based dashboards
- **PWA Hosting**: Perfect for Progressive Web Apps

### 🎯 Focused Workflows
- **Single-Purpose Apps**: When you want to focus on one web application
- **Distraction-Free Browsing**: No visible navigation to distract users
- **Embedded Web Services**: Integrate web services seamlessly into desktop workflow

## Installation

### 1. Copy Template Files
```bash
# Copy to your NebulaDesktop project
cp NebulaApp-PWA.js /path/to/NebulaDesktop/src/Templates/
cp NebulaApp-PWA.css /path/to/NebulaDesktop/src/css/
```

### 2. Include CSS in HTML
Add the CSS file to your `src/index.html`:
```html
<link rel="stylesheet" href="css/NebulaApp-PWA.css">
```

### 3. Include JavaScript
Add the JavaScript file to your `src/index.html`:
```html
<script src="Templates/NebulaApp-PWA.js"></script>
```

### 4. Add to App Launcher
In your `src/js/renderer.js`, add the PWA Host to your app launcher:
```javascript
{
    name: 'Web App Host',
    icon: 'web',
    class: 'NebulaPWAHost',
    description: 'Host web applications in full-screen'
}
```

## Usage

### Basic Usage
```javascript
// Create a PWA host for a specific web application
const webApp = new NebulaPWAHost('https://your-webapp.com');
```

### With Custom Settings
```javascript
// Create with custom home page
const webApp = new NebulaPWAHost('https://dashboard.example.com');
webApp.settings.defaultHomePage = 'https://dashboard.example.com';
```

## Right-Click Context Menu

The context menu provides all navigation controls:

### 📍 Navigation Controls
- **Go Back** - Navigate to previous page (disabled if no history)
- **Go Forward** - Navigate to next page (disabled if no forward history)  
- **Refresh** - Reload current page
- **Go Home** - Navigate to default home page
- **Change URL** - Prompt to enter new URL
- **Toggle Fullscreen** - Toggle window fullscreen mode

### 🎯 Usage
1. **Right-click** anywhere on the web content
2. **Select** desired action from context menu
3. **Menu auto-hides** after selection or when clicking elsewhere
4. **Escape key** also hides the menu

## Customization

### 1. Change Default URL
```javascript
// In constructor
constructor(initialUrl = 'https://your-default-site.com') {
    // ... existing code
}

// Or in settings
this.settings.defaultHomePage = 'https://your-site.com';
```

### 2. Customize Window Properties
```javascript
// In init() method
this.windowId = window.windowManager.createWindow({
    title: 'My Web App',        // Your app title
    width: 1400,                // Preferred width
    height: 900,                // Preferred height
    resizable: true,
    maximizable: true,
    minimizable: true,
    icon: 'your_icon'           // Material icon name
});
```

### 3. Modify Context Menu
```javascript
// In createContextMenu() method, modify the innerHTML:
contextMenu.innerHTML = `
    <!-- Keep existing items or add new ones -->
    <div class="context-menu-item" id="ctx-custom">
        <span class="material-symbols-outlined">your_icon</span>
        <span>Custom Action</span>
    </div>
`;
```

### 4. Add Custom Actions
```javascript
// In setupEventListeners() method
contextMenu.querySelector('#ctx-custom').addEventListener('click', () => {
    this.handleCustomAction();
    this.hideContextMenu();
});

// Add your custom method
handleCustomAction() {
    // Your custom functionality
    console.log('Custom action triggered');
}
```

## Styling

### Context Menu Theming
The context menu automatically follows Nebula's theme system:

```css
/* Customize context menu appearance */
.pwa-context-menu {
    /* Menu container styles */
    border-radius: 12px;  /* More rounded corners */
    min-width: 200px;     /* Wider menu */
}

.context-menu-item {
    /* Menu item styles */
    padding: 10px 18px;   /* More padding */
    font-size: 15px;      /* Larger text */
}
```

### Dark Theme Support
Automatic dark theme adaptation:
```css
@media (prefers-color-scheme: dark) {
    .pwa-host-container {
        --pwa-primary: #58a6ff;
        --pwa-surface: #21262d;
        /* ... other dark theme variables */
    }
}
```

## Security

### Webview Security Attributes
The template uses secure webview configuration:
```javascript
webview.setAttribute('allowpopups', 'true');
webview.setAttribute('websecurity', 'true');
webview.setAttribute('nodeintegration', 'false');
webview.setAttribute('contextIsolation', 'true');
webview.setAttribute('enableremotemodule', 'false');
webview.setAttribute('partition', 'persist:pwa-host');
```

### Session Isolation
Each PWA host instance uses isolated sessions:
- Separate cookies and storage
- Independent security contexts
- Process isolation for stability

## Troubleshooting

### Common Issues

1. **Context menu not appearing**
   - Ensure webview is loaded and ready
   - Check for JavaScript errors in console
   - Verify event listeners are properly attached

2. **Navigation not working**
   - Check webview canGoBack()/canGoForward() states
   - Verify webview methods are available
   - Test with different websites

3. **Styling issues**
   - Ensure CSS file is properly included
   - Check CSS variable definitions
   - Verify Nebula theme compatibility

4. **Website not loading**
   - Check network connectivity
   - Verify URL format (https:// prefix)
   - Test with known working websites

### Debug Mode
Enable debug logging:
```javascript
// Add to constructor
this.debug = true;

// Debug logging will show in console
if (this.debug) {
    console.log('PWA Debug:', message);
}
```

## Examples

### Web Application Host
```javascript
// Host a specific web application
const myApp = new NebulaPWAHost('https://app.example.com');
// Clean, full-screen experience for the web app
```

### Dashboard Display
```javascript
// Create a dashboard viewer
const dashboard = new NebulaPWAHost('https://dashboard.company.com');
// Perfect for monitoring dashboards
```

### Kiosk Mode
```javascript
// Create a kiosk-style browser
const kiosk = new NebulaPWAHost('https://public-info.com');
// Minimal interface for public displays
```

## Advantages Over Full Version

### ✅ Cleaner Interface
- **More Screen Space**: No toolbar or address bar taking up space
- **Less Distraction**: Focus entirely on web content
- **App-Like Feel**: Feels more like a native application

### ⚡ Simplified Interaction
- **Context-Driven**: Navigation only when needed
- **Familiar Pattern**: Right-click context menus are intuitive
- **Keyboard Friendly**: Escape key to hide menu

### 🎯 Better for Specific Use Cases
- **Single Web App**: Perfect when hosting one specific application
- **Kiosk Displays**: Ideal for public or dedicated displays
- **Embedded Services**: Better integration into desktop workflows

## Migration from Full Version

If upgrading from the full toolbar version:

1. **Replace JavaScript file** with simplified version
2. **Update CSS file** with simplified styles  
3. **Test context menu** functionality
4. **Update any custom toolbar code** to use context menu instead

## Contributing

1. Fork the NebulaDesktop repository
2. Create a feature branch for improvements
3. Test with various websites and use cases
4. Submit pull request with detailed description

## License

This template follows the same license as NebulaDesktop (MIT License).

## Support

For issues and questions:
1. Check the NebulaDesktop documentation
2. Review the main PWA template documentation
3. Open an issue on the NebulaDesktop GitHub repository

