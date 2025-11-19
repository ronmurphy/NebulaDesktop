# Nebula Terminal v2.0 - Real PTY Terminal Emulator

A beautiful, feature-rich **real terminal emulator** built with Electron, node-pty, and xterm.js. This is a true terminal that can run interactive applications like vim, htop, ssh, and more - extracted from the NebulaDesktop environment.

## 🚀 What Makes This a "Real" Terminal?

Unlike basic command executors, Nebula Terminal provides:

- ✅ **Real PTY (Pseudo-Terminal)** - Linux recognizes this as an actual terminal
- ✅ **Interactive Applications** - Run vim, nano, htop, ssh, tmux, top, etc.
- ✅ **ANSI Escape Sequences** - Full color and formatting support
- ✅ **ncurses Support** - Terminal UI apps work perfectly
- ✅ **Job Control** - Background/foreground processes, Ctrl+Z, fg, bg
- ✅ **Proper Signal Handling** - Ctrl+C, Ctrl+D, Ctrl+Z work correctly
- ✅ **Terminal Resizing** - Apps respond to window size changes
- ✅ **xterm-256color** - Full 256-color support

## 🎯 Features

### Core Terminal Features
- **Real PTY implementation** using node-pty
- **Full xterm.js emulation** with addon support
- **Interactive program support** - vim, emacs, nano, htop, ssh, etc.
- **Command history** with arrow key navigation
- **Terminal resizing** that propagates to running programs
- **Clickable links** - URLs are automatically detected and clickable
- **Text search** - Find text in terminal output (Ctrl+Shift+F)
- **Copy/Paste** - Ctrl+Shift+C / Ctrl+Shift+V
- **Font size control** - Ctrl+Shift+Plus/Minus/0

### Linux Integration
- **Desktop file** for application menu integration
- **Set as default terminal** for your desktop environment
- **Terminal handler** registration for terminal:// URLs
- **Keyboard shortcut** support (e.g., Ctrl+Alt+T)
- **File manager integration** - "Open Terminal Here" support

### Visual Features
- Classic green-on-black terminal aesthetic
- 256-color support
- Ligature support with FiraCode font
- Smooth cursor blinking
- Custom scrollbar styling
- High contrast mode support

## 📦 Installation

### Quick Start

1. **Install dependencies:**
   ```bash
   cd NebulaTerminal-Standalone
   npm install
   ```

2. **Rebuild native modules:**
   ```bash
   npm rebuild node-pty
   ```

3. **Run the terminal:**
   ```bash
   npm start
   ```

### Linux System Installation

See [INSTALL-LINUX.md](INSTALL-LINUX.md) for detailed instructions on:
- Installing as default terminal
- Setting keyboard shortcuts
- File manager integration
- Desktop environment configuration

### Building Distributables

```bash
# Build for your current platform
npm run build

# Build specific platforms
npm run dist:linux    # AppImage and .deb for Linux
npm run dist:win      # NSIS installer for Windows
npm run dist:mac      # DMG for macOS
```

## 🎮 Usage

### Running Interactive Applications

```bash
# Text editors
vim myfile.txt
nano config.ini
emacs document.org

# System monitoring
htop
top
iotop

# Network tools
ssh user@server
ping google.com
curl https://api.example.com

# Terminal multiplexers
tmux
screen

# Programming tools
python
node
irb
```

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+C` | Copy selected text |
| `Ctrl+Shift+V` | Paste from clipboard |
| `Ctrl+Shift+F` | Search terminal output |
| `Ctrl+Shift+Plus` | Increase font size |
| `Ctrl+Shift+Minus` | Decrease font size |
| `Ctrl+Shift+0` | Reset font size to default |
| `Ctrl+C` | Send SIGINT to process |
| `Ctrl+D` | Send EOF / logout |
| `Ctrl+Z` | Suspend process (SIGTSTP) |

### Shell Features

All standard shell features work:
- Job control (`&`, `fg`, `bg`, `jobs`)
- Pipes and redirection (`|`, `>`, `>>`, `<`)
- Command substitution (`$(command)`, `` `command` ``)
- Environment variables
- Shell scripts
- Tab completion (depends on your shell)

## 🔧 Technical Details

### Architecture

```
┌─────────────────────────────────────┐
│         Electron Window             │
│  ┌───────────────────────────────┐  │
│  │      xterm.js Renderer        │  │
│  │  (terminal display & input)   │  │
│  └───────────┬───────────────────┘  │
│              │ IPC                   │
│  ┌───────────▼───────────────────┐  │
│  │      Main Process             │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │     node-pty            │  │  │
│  │  │  (real PTY process)     │  │  │
│  │  └──────────┬──────────────┘  │  │
│  └─────────────┼─────────────────┘  │
└────────────────┼─────────────────────┘
                 │
                 ▼
         ┌──────────────┐
         │  Your Shell  │
         │ (bash/zsh)   │
         └──────────────┘
```

### Components

- **main.js** - Electron main process, creates PTY using node-pty
- **preload.js** - Secure IPC bridge between renderer and main
- **renderer.js** - xterm.js initialization and PTY connection
- **terminal.css** - Nebula-themed styling
- **index.html** - Application entry point

### Dependencies

- **electron** - Desktop application framework
- **node-pty** - Native PTY bindings for pseudo-terminal
- **xterm** - Terminal emulator for the web
- **xterm-addon-fit** - Auto-fit terminal to window
- **xterm-addon-web-links** - Clickable URL detection
- **xterm-addon-search** - Terminal text search

## 📖 Examples

### SSH into Server
```bash
ssh user@example.com
# Full interactive SSH session with colors, vim, etc.
```

### Edit Code with Vim
```bash
vim myproject/main.js
# Full vim functionality with syntax highlighting
```

### Monitor System with htop
```bash
htop
# Real-time system monitoring with full UI
```

### Run Python REPL
```bash
python3
>>> print("Hello from real terminal!")
Hello from real terminal!
```

### Use tmux
```bash
tmux
# Full tmux support with panes, windows, status bar
```

## 🎨 Customization

### Change Color Scheme

Edit `renderer.js` to customize the theme:

```javascript
theme: {
    background: '#1a1a1a',    // Background color
    foreground: '#00ff00',    // Text color
    cursor: '#00ff00',        // Cursor color
    // ... more colors
}
```

### Change Font

Edit `renderer.js` to change the font:

```javascript
fontFamily: 'Your Preferred Font, monospace',
fontSize: 14,
```

### Change Shell

The terminal uses your system's default shell (`$SHELL`). To override:

Edit `main.js`:
```javascript
const shell = '/usr/bin/zsh'; // or '/bin/bash', '/bin/fish', etc.
```

## 🐛 Troubleshooting

### node-pty fails to compile

```bash
# Install build tools (Ubuntu/Debian)
sudo apt install build-essential python3

# Rebuild node-pty
npm rebuild node-pty

# Or rebuild all native modules
npm run postinstall
```

### Terminal doesn't display colors

Make sure your shell is configured for color:
```bash
# Check TERM variable
echo $TERM  # Should be xterm-256color

# Test colors
curl -s https://gist.githubusercontent.com/HaleTom/89ffe32783f89f403bba96bd7bcd1263/raw/ | bash
```

### Fonts look wrong

Install FiraCode Nerd Font:
```bash
# Ubuntu/Debian
sudo apt install fonts-firacode

# Or download from https://www.nerdfonts.com/
```

### Permission denied errors

Some operations require proper permissions:
```bash
# Give executable permission
chmod +x /usr/local/bin/nebula-terminal

# Check file ownership
ls -l /usr/local/bin/nebula-terminal
```

## 🆚 Comparison with Other Terminals

| Feature | Nebula Terminal | GNOME Terminal | Konsole | xterm |
|---------|-----------------|----------------|---------|-------|
| Real PTY | ✅ | ✅ | ✅ | ✅ |
| 256 Colors | ✅ | ✅ | ✅ | ✅ |
| Tabs | ❌ | ✅ | ✅ | ❌ |
| Electron-based | ✅ | ❌ | ❌ | ❌ |
| Cross-platform | ✅ | ❌ | ❌ | ✅ |
| Web Technologies | ✅ | ❌ | ❌ | ❌ |
| Clickable Links | ✅ | ✅ | ✅ | ❌ |

## 📚 File Structure

```
NebulaTerminal-Standalone/
├── main.js                    # Electron main process (PTY creation)
├── preload.js                 # IPC bridge (security)
├── renderer.js                # xterm.js renderer (terminal UI)
├── terminal.css               # Styling
├── index.html                 # HTML entry point
├── package.json               # Dependencies and scripts
├── nebula-terminal.desktop    # Linux desktop integration
├── INSTALL-LINUX.md          # Linux installation guide
├── README.md                  # This file
└── .gitignore                # Git ignore patterns
```

## 🔒 Security

- **Context Isolation** - Renderer process is isolated
- **No Node Integration** - Renderer can't access Node.js directly
- **IPC Only** - All communication through secure IPC
- **No Remote Content** - All code is local

## 🎯 Use Cases

Perfect for:
- Development environments
- System administration
- SSH sessions
- Server management
- Learning Linux/Unix
- Programming tutorials
- Terminal-based workflows

## 🚧 Known Limitations

- Single window only (no tabs yet)
- No split panes (use tmux/screen instead)
- No built-in file manager integration
- Theme customization requires code changes

## 🔮 Future Enhancements

Potential features for future versions:
- [ ] Multiple tabs
- [ ] Split panes
- [ ] Theme picker UI
- [ ] Settings panel
- [ ] Profile management
- [ ] Saved sessions
- [ ] SSH connection manager

## 📄 License

MIT License - Same as NebulaDesktop parent project

## 👨‍💻 Credits

**Extracted from NebulaDesktop** - A ChromeOS-like Electron desktop environment
Created by **Ron Murphy**

Built with:
- [Electron](https://www.electronjs.org/) - Cross-platform desktop apps
- [node-pty](https://github.com/microsoft/node-pty) - PTY bindings
- [xterm.js](https://xtermjs.org/) - Terminal emulator for the web

## 🤝 Contributing

This is an extraction from the NebulaDesktop project.

## 📞 Support

For issues and feature requests, check the main NebulaDesktop repository.

---

**Nebula Terminal v2.0** - A real terminal emulator that respects Linux! 💻✨
