# Hyprland Config Editor - TODO & Roadmap

## 🎯 Project Status: **Day 1-2 Foundation COMPLETE** ✅

### ✅ COMPLETED (Day 1-2)
- [x] **Basic Quickshell application** - Full QML app with working UI
- [x] **Config file detection** - Finds all end-4 dotfiles structure (12 files)
- [x] **Universal user detection** - Works for any username (brad, user, arch, ubuntu, etc.)
- [x] **Smart path resolution** - Auto-detects `~/.config/hypr` for any user
- [x] **Safety backup system** - BackupManager component ready for file operations
- [x] **Beautiful UI** - File list with green checkmarks, status display
- [x] **Portable run script** - `./run.sh` works on any system with Quickshell
- [x] **Mock file operations** - Safe development without breaking configs
- [x] **Cross-chat continuity** - TODO.md for maintaining project across sessions

### 🚧 IN PROGRESS (Day 2)
- [ ] **GitHub repository setup** - Initial commit and documentation
- [ ] **Project documentation** - README, installation instructions, screenshots

### 📋 NEXT PRIORITIES (Day 2-3)

**Day 2 Goals:**
- [ ] **Real file reading** - Replace mock file operations with actual config parsing
- [ ] **General.conf editor** - Gaps, borders, layout settings with sliders/inputs
- [ ] **Live config preview** - Show current values from actual files
- [ ] **Basic save functionality** - Write changes back to config files

**Day 3 Goals:**
- [ ] **Colors.conf editor** - Color picker system for Hyprland themes
- [ ] **Keybinds.conf editor** - Visual keybind editor with conflict detection
- [ ] **Config validation** - Ensure changes don't break Hyprland

**Day 4 Goals:**
- [ ] **Env.conf editor** - Environment variable management
- [ ] **Execs.conf editor** - Autostart application manager
- [ ] **Rules.conf editor** - Window rules configuration

**Day 5+ Goals:**
- [ ] **Advanced features** - Config templates, export/import, themes
- [ ] **Polish & UX** - Animations, better icons, help tooltips
- [ ] **Community features** - Config sharing, preset library

### 🛠️ TECHNICAL DEBT & IMPROVEMENTS
- [ ] **File I/O implementation** - Replace Process.create mocks with proper Qt file APIs
- [ ] **Error handling** - Graceful handling of missing/corrupted configs
- [ ] **Configuration backup** - Automatic git commits or timestamped backups
- [ ] **User path detection enhancement** - Read from temp file written by run.sh
- [ ] **Performance optimization** - Lazy loading for large config files
- [ ] **Accessibility** - Keyboard navigation, screen reader support

### 🧪 RESEARCH NEEDED
- [ ] **Quickshell file I/O APIs** - Find proper way to read/write files
- [ ] **Hyprland config validation** - Research hyprctl validation commands
- [ ] **Config syntax parsing** - Handle comments, includes, variable substitution
- [ ] **Hyprland IPC integration** - Live reload configs without restart

### 🐛 KNOWN ISSUES
- **Process.create API limitations** - Currently using mock file operations
- **Qt.labs.platform import** - Needed for some file operations, may need version specification
- **Quickshell argument passing** - `qs` doesn't pass arguments to QML cleanly (worked around)

### 🎨 UI/UX IMPROVEMENTS
- [ ] **Icons for config types** - Visual indicators for different config categories
- [ ] **Dark/light theme** - Match user's Hyprland theme
- [ ] **Responsive layout** - Handle different screen sizes
- [ ] **Progress indicators** - Show save/load progress
- [ ] **Undo/redo system** - Allow reverting changes
- [ ] **Search functionality** - Find specific settings quickly

### 🌍 DISTRIBUTION & PACKAGING
- [ ] **AUR package** - Package for Arch Linux users
- [ ] **Flatpak** - Universal Linux distribution
- [ ] **Installation documentation** - Step-by-step guides for different distros
- [ ] **Dependencies documentation** - List all required packages

### 📚 DOCUMENTATION NEEDED
- [ ] **Developer guide** - How to add new config editors
- [ ] **User manual** - How to use each editor
- [ ] **Configuration guide** - Explain Hyprland settings
- [ ] **Troubleshooting guide** - Common issues and solutions
- [ ] **Contributing guide** - How others can help

### 🚀 FUTURE VISION
- **Universal Hyprland GUI** - The go-to tool for Hyprland configuration
- **Plugin system** - Allow community-contributed editors
- **Config sharing platform** - Share configurations with community
- **Live preview** - See changes in real-time
- **Guided setup** - Wizard for new Hyprland users

---

## 📝 Development Notes

### Key Technical Decisions
- **Quickshell + QML** - Chosen for native Hyprland integration
- **End-4 dotfiles structure** - Target the most popular organization pattern
- **Mock-first development** - Safe development without breaking user configs
- **Smart user detection** - Test common usernames for universal compatibility

### Lessons Learned
- **Quickshell Process API limitations** - `Process.create` not available, use shell scripts
- **Qt argument passing complexity** - Temp files more reliable than command args
- **Component timing issues** - `detectConfigs()` called before `Component.onCompleted`
- **Import version requirements** - Some Qt.labs modules need specific versions

### Success Patterns
- **Modular architecture** - Separate detection, backup, and UI components
- **Progressive enhancement** - Start with mock, add real functionality gradually
- **Multiple fallbacks** - Always have working defaults
- **Clear debug output** - Essential for troubleshooting QML issues

---

*Last updated: Day 2 - Foundation Complete*
*Next update: After Day 2 goals completion*