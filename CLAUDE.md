# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NebulaDesktop is a ChromeOS-like Electron desktop environment for Linux, built with vanilla JavaScript and CSS. It provides a modern glass design with translucent interface effects and modular applications.

## Development Commands

### Running the Application
- `npm start` - Start the application in production mode
- `npm run dev` - Start in development mode with hot reload (electron-reload)

### Building and Distribution
- `npm run build` - Build the application using electron-builder
- `npm run dist` - Build for Windows and Linux
- `npm run dist:linux` - Build Linux AppImage and deb packages
- `npm run dist:win` - Build Windows NSIS installer

### Testing
- `npm test` - Run the visual GUI tests (3 test scripts)
- `npm run check-allowlist` - Validate adblock allowlist configuration

## Architecture Overview

### Core System Components

**Desktop Environment (`src/js/renderer.js`)**
- Main desktop shell with taskbar and launcher integration
- Manages running applications and window lifecycle
- Integrates with WindowManager for window operations
- Handles theme management and user configuration persistence

**Window Management System (`src/js/WindowManager.js`)**
- Advanced window manager with snap functionality
- Capsule preview system for minimized windows
- Window positioning, resizing, and z-index management
- Available desktop area calculation (accounting for taskbars/panels)

**Theme System**
- `src/js/nebula-theme-manager.js` - Theme management with CSS variable support
- `src/css/nebula-theme.css` - Core Nebula design tokens and components
- `src/css/themes/` - Additional theme variations (macOS, Windows 10/11, Ubuntu)

### Modular Application Architecture

**Application Templates (`src/Templates/`)**
- `NebulaApp-Single.js` - Single-window application template
- `NebulaApp-Tabbed.js` - Multi-tab application template
- `NebulaApp-PWA.js` - Progressive web app wrapper template
- `NebulaApp-VisualGUI.js` - Visual interface builder template

**Built-in Applications (`src/apps/`)**
- `browser.js` - Vertical tab browser with webview integration
- `filemanager.js` - File system navigation interface
- `media-player.js` - Media playback application
- `NebulaTerminal.js` - Terminal emulator
- Various specialized apps (image viewer, code assistant, etc.)

### Key Integration Points

**Widget System (`src/js/NebulaWidgetSystem.js`)**
- Desktop widget framework
- Clock widget (`src/js/Widgets/NebulaClock.js`)
- Launcher widget (`src/js/Widgets/NebulaLauncher.js`)

**File Operations (`src/ui/nebula-filepicker.js`)**
- Native file system access through Electron IPC
- File picker integration for applications

**Settings Management (`src/js/NebulaSettings.js`)**
- User preference persistence via localStorage
- Theme and configuration management

## Development Patterns

### Adding New Applications
1. Create app class in `src/apps/yourapp.js` following existing patterns
2. Add corresponding CSS in `src/css/yourapp.css`
3. Include both files in `src/index.html`
4. Register in launcher via `renderer.js`

### Window Management Integration
- All applications should integrate with the global `windowManager` instance
- Use `windowManager.createWindow()` for new windows
- Window data structure includes app metadata, positioning, and state

### Theme Integration
- Use CSS custom properties defined in `nebula-theme.css`
- Follow the glassmorphism design language with consistent spacing
- Material Design icons via `nebula-material-icons.css`

### IPC Communication
- Electron preload script in `src/preload.js`
- File system operations and native integrations

## Testing and Quality Assurance

### Visual GUI Testing
The project includes specialized tests for visual components:
- `tools/test-visualgui-meta-roundtrip.js`
- `tools/test-visualgui-build-roundtrip.js`
- `tools/test-visualgui-generate-meta.js`

Run smoke tests via `tools/smoke-visualgui.html` for manual verification.

## Configuration Files

**Electron Builder (`package.json` build section)**
- AppImage and deb targets for Linux
- NSIS installer for Windows
- Build resources in `build/` directory

**Dependencies**
- Core: `electron`, `electron-builder`
- Utilities: `diff-match-patch`, `qbjc`
- Development: `electron-reload` for hot reload

## File Structure Notes

- `src/backups/` - Contains enhanced versions and backup files
- `src/diffs/` - Patch files for component updates
- `src/NebulaSrcGames/` - Game applications and entertainment modules
- `src/qbasic/` - QBasic integration components