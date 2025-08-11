# NebulaDesktop

**A ChromeOS-like Electron desktop environment for Linux, perfect for web-focused computing.**

## Features

- 🌟 **Modern Glass Design** - Beautiful translucent interface with blur effects
- 🌐 **Vertical Tab Browser** - Advanced browser with sidebar tabs and webview support  
- 📁 **File Manager** - Basic file system navigation and management
- ⚡ **Fast & Lightweight** - Built with vanilla JavaScript and CSS
- 🎨 **Nebula Theme System** - Consistent design language across all apps
- 🔌 **Modular Apps** - Each application is a separate, self-contained module
- ⌨️ **Keyboard Shortcuts** - Quick access to common functions
- 🖱️ **Window Management** - Drag, resize, minimize, and maximize windows

## Quick Start

```bash
npm install
npm start
```

For development with hot reload:
```bash
npm run dev
```

## Architecture

### Core Components
- **Desktop Environment** (`src/js/renderer.js`) - Main desktop shell, taskbar, launcher
- **Window System** - Drag & drop window management with standard controls
- **Theme Engine** (`src/css/nebula-theme.css`) - CSS variables and design tokens
- **App Launcher** - Grid-based application launcher with search

### Modular Apps
- **Browser** (`src/apps/browser.js`) - Vertical tab browser with webview integration
- **File Manager** (`src/apps/filemanager.js`) - File system navigation interface
- **Settings** (Coming soon) - System configuration panel

### Styling
- **Nebula Design Language** - Glassmorphism with consistent spacing and colors
- **CSS Variables** - Theme customization through CSS custom properties
- **Responsive Design** - Adapts to different screen sizes
- **Material Symbols** - Google Material Design icons

## Development

### Project Structure
```
src/
├── apps/                 # Modular applications
│   ├── browser.js       # Browser application  
│   ├── filemanager.js   # File manager
│   └── README.md        # App development guide
├── css/                 # Stylesheets
│   ├── style.css       # Base layout styles
│   ├── nebula-theme.css # Theme and components
│   ├── browser.css     # Browser app styles
│   └── filemanager.css # File manager styles
└── js/
    ├── renderer.js     # Desktop environment
    └── preload.js     # Electron preload script
```

### Adding New Apps

1. Create your app class in `src/apps/yourapp.js`
2. Add corresponding CSS in `src/css/yourapp.css`  
3. Include both files in `src/index.html`
4. Add launcher entry in `renderer.js`

See `src/apps/README.md` for detailed app development guidelines.

## Configuration

The desktop environment saves user preferences to localStorage:

```javascript
{
  theme: 'default',
  wallpaper: 'gradient', 
  taskbarPosition: 'bottom'
}
```

## Browser Features

- **Vertical Tabs** - Space-efficient tab management in sidebar
- **Webview Integration** - Full web page rendering with Chrome engine
- **Navigation Controls** - Back, forward, refresh, and address bar
- **Favicon Display** - Visual tab identification
- **Multi-tab Support** - Unlimited tabs with right-click to close

## Keyboard Shortcuts

- `Alt + Space` - Open application launcher  
- `Alt + Tab` - Switch between open windows
- `Ctrl + Alt + T` - Open terminal (planned)
- `F11` - Toggle fullscreen

## System Integration

- **Power Management** - Shutdown, restart, logout functionality
- **File System** - Native file operations through Electron IPC
- **Process Management** - Background and foreground app handling
- **Session Management** - User state persistence

## Roadmap

- [ ] Terminal emulator app
- [ ] Settings & preferences app  
- [ ] App store/installer
- [ ] Virtual desktops/workspaces
- [ ] Notification system
- [ ] System tray applications
- [ ] Window snapping & tiling
- [ ] Wallpaper customization
- [ ] Audio/video controls

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes following the existing code style
4. Test your changes thoroughly  
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
