# Nebula Terminal - Standalone Edition

A beautiful, feature-rich terminal emulator built with Electron, extracted from the NebulaDesktop environment.

## Features

### File Navigation
- **Interactive file listing** with clickable files and directories
- **Smart icons** - Choose between emoji, text, or no icons
- **Quick navigation** - Right-click folders for instant `cd && ls`
- **File operations** - Create, delete, read files and directories

### Built-in Commands
- `ls` / `ll` - List directory contents (short/long format)
- `cd` - Change directory with path resolution
- `pwd` - Print working directory
- `cat` - Display file contents
- `mkdir` / `rmdir` - Create/remove directories
- `rm` / `touch` - Remove/create files
- `echo` - Print text
- `clear` - Clear terminal screen
- `history` - Show command history
- `nfetch` - Display system information
- `imginfo` - Show image file information
- `useicons` - Switch icon styles (emoji/text/none)
- `js` - Execute JavaScript code
- `debug` - Debug system/file APIs
- `help` - Show all commands
- `exit` - Close terminal

### System Integration
- **Real shell execution** - Run any system command (git, npm, python, etc.)
- **File system access** - Full read/write access to your files
- **Command history** - Navigate with arrow keys
- **Path resolution** - Smart handling of absolute and relative paths

### User Experience
- **Clean interface** - Classic terminal green-on-black aesthetic
- **Keyboard shortcuts** - Ctrl+C to cancel, arrow keys for history
- **Context menus** - Right-click for quick actions
- **Responsive design** - Resizable window with proper scrolling

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

### Setup

1. Navigate to the terminal directory:
   ```bash
   cd NebulaTerminal-Standalone
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

### Development Mode
Run with developer tools open:
```bash
npm run dev
```

### Production Mode
Run the app normally:
```bash
npm start
```

### Building Distributables

Build for your current platform:
```bash
npm run build
```

Build for specific platforms:
```bash
npm run dist:linux    # AppImage and .deb for Linux
npm run dist:win      # NSIS installer for Windows
npm run dist:mac      # DMG for macOS
```

Built applications will be in the `dist/` directory.

## Command Examples

```bash
# Navigate your file system
cd ~/Documents
ls
pwd

# File operations
mkdir my-project
cd my-project
touch README.md
echo "Hello World" > README.md
cat README.md

# System commands
git status
npm list
python --version

# Advanced features
useicons text        # Switch to text icons
js console.log("Hi") # Execute JavaScript
nfetch              # System info
history             # Show command history
```

## File Structure

```
NebulaTerminal-Standalone/
├── main.js          # Electron main process
├── preload.js       # Context bridge for security
├── terminal.js      # Terminal implementation
├── terminal.css     # Terminal styling
├── index.html       # Application HTML
├── package.json     # Dependencies and build config
└── README.md        # This file
```

## Customization

### Icon Styles
The terminal supports three icon modes:

1. **Emoji** (default) - Colorful emoji icons 🖼️ 🎵 📁
2. **Text** - Professional text badges (IMG, AUD, DIR)
3. **None** - Minimalist, no icons at all

Switch with: `useicons <emoji|text|none>`

### Color Scheme
Edit `terminal.css` to customize colors:
- Background: `#1a1a1a`
- Text: `#00ff00` (classic terminal green)
- Directories: `#66d9ef` (cyan blue)
- Errors: `#ff6b6b` (red)

## Technical Details

### Architecture
- **Main Process** (`main.js`) - Handles window creation and IPC
- **Preload Script** (`preload.js`) - Secure API bridge
- **Renderer** (`terminal.js`) - Terminal UI and logic

### Security
- Context isolation enabled
- Node integration disabled in renderer
- IPC communication for file system access
- Secure command execution with timeouts

### Dependencies
- **electron** - Cross-platform desktop framework
- **electron-builder** - Build and package applications

## Keyboard Shortcuts

- **Enter** - Execute command
- **Ctrl+C** - Cancel current input
- **Arrow Up/Down** - Navigate command history
- **Tab** - (Reserved for auto-completion)

## Tips

1. **Quick directory listing** - Right-click on empty space for instant `ls`
2. **Fast navigation** - Right-click folders to `cd` into them
3. **Combine commands** - Use shell operators like `&&`, `||`, `;`
4. **View images** - Click image files in `ls` output, then use `imginfo`

## Known Limitations

- System commands timeout after 30 seconds
- Binary files may not display correctly with `cat`
- Tab completion not yet implemented
- No split panes or multiple tabs (single window only)

## Development

### Adding New Commands
Edit the `builtinCommands` object in `terminal.js`:

```javascript
this.builtinCommands = {
    mycommand: (args) => this.myCustomFunction(args),
    // ... existing commands
};
```

### Modifying IPC Handlers
Add new IPC handlers in `main.js`:

```javascript
ipcMain.handle('my:handler', async (event, ...args) => {
    // Your code here
});
```

Expose in `preload.js`:

```javascript
contextBridge.exposeInMainWorld('nebula', {
    myAPI: {
        myMethod: (...args) => ipcRenderer.invoke('my:handler', ...args)
    }
});
```

## License

MIT License - Same as NebulaDesktop parent project

## Credits

Extracted from **NebulaDesktop** - A ChromeOS-like Electron desktop environment
Created by Ron Murphy

## Contributing

This is a standalone extraction from the NebulaDesktop project. For the main project:
- GitHub: [NebulaDesktop Repository]
- Issues: Report bugs or request features

---

**Nebula Terminal** - Bringing the terminal experience to Electron with style! 💻✨
