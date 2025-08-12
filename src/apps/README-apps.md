# Nebula Desktop Apps

This directory contains the modular applications for the Nebula Desktop Environment.

## Architecture

Each app is a self-contained JavaScript class with its own CSS file. Apps are loaded before the desktop environment and can be launched through the launcher or programmatically.

## Available Apps

### Browser (`browser.js`)
- **Class**: `NebulaBrowser`
- **Features**: Vertical tab browser with webview support
- **Styles**: `css/browser.css`
- **Launch**: `new NebulaBrowser(url)` or `browser://new`

### File Manager (`filemanager.js`)  
- **Class**: `NebulaFileManager`
- **Features**: Basic file system navigation (mock data for now)
- **Styles**: `css/filemanager.css`  
- **Launch**: `new NebulaFileManager(path)` or `files://local`

## Creating New Apps

1. Create `apps/yourapp.js` with a class that:
   - Creates its own window DOM structure
   - Implements window controls (minimize, maximize, close)
   - Sets up drag functionality
   - Exports itself to `window.YourAppClass`

2. Create `css/yourapp.css` for styling using Nebula CSS variables

3. Add to `index.html`:
   ```html
   <link rel="stylesheet" href="css/yourapp.css">
   <script src="apps/yourapp.js"></script>
   ```

4. Update `renderer.js` launcher to include your app:
   ```javascript
   { name: 'Your App', icon: '🎯', url: 'yourapp://launch' }
   ```

5. Handle the launch URL in `renderer.js` `launchApp()` method

## App Guidelines

- Use Nebula CSS variables for theming
- Implement standard window controls
- Support drag & drop functionality  
- Handle window state (minimize/maximize)
- Export class to global `window` object
- Use consistent naming: `NebulaAppName`
