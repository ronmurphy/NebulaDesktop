# Linux Installation and Terminal Registration

## Installing as System Terminal

### Method 1: Install from AppImage (Recommended)

1. Build the AppImage:
   ```bash
   npm install
   npm run dist:linux
   ```

2. Make it executable and move to /usr/local/bin:
   ```bash
   chmod +x dist/NebulaTerminal-*.AppImage
   sudo mv dist/NebulaTerminal-*.AppImage /usr/local/bin/nebula-terminal
   ```

3. Install the desktop file:
   ```bash
   sudo cp nebula-terminal.desktop /usr/share/applications/
   sudo update-desktop-database
   ```

### Method 2: Install from .deb Package

1. Build the .deb package:
   ```bash
   npm install
   npm run dist:linux
   ```

2. Install with dpkg:
   ```bash
   sudo dpkg -i dist/nebula-terminal_*.deb
   ```

### Method 3: Run from Source

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a launcher script in /usr/local/bin:
   ```bash
   sudo tee /usr/local/bin/nebula-terminal <<'EOF'
   #!/bin/bash
   cd /path/to/NebulaTerminal-Standalone
   npm start
   EOF
   sudo chmod +x /usr/local/bin/nebula-terminal
   ```

3. Install desktop file:
   ```bash
   sudo cp nebula-terminal.desktop /usr/share/applications/
   sudo update-desktop-database
   ```

## Set as Default Terminal

### GNOME
```bash
# Set as default terminal
gsettings set org.gnome.desktop.default-applications.terminal exec 'nebula-terminal'
gsettings set org.gnome.desktop.default-applications.terminal exec-arg ''
```

### KDE Plasma
1. Open System Settings
2. Navigate to Applications → Default Applications
3. Select "Terminal Emulator"
4. Choose "Nebula Terminal" from the list

### XFCE
1. Open Settings Manager
2. Go to Preferred Applications
3. Select "Utilities" tab
4. Set "Nebula Terminal" as the default terminal emulator

### Manually (All Desktop Environments)
Edit `~/.config/mimeapps.list` and add:
```ini
[Default Applications]
x-scheme-handler/terminal=nebula-terminal.desktop
```

## Keyboard Shortcuts

Most desktop environments allow you to set a keyboard shortcut to launch your terminal:

### GNOME
```bash
# Set Ctrl+Alt+T to open Nebula Terminal
gsettings set org.gnome.settings-daemon.plugins.media-keys custom-keybindings "['/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom0/']"
gsettings set org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom0/ name 'Nebula Terminal'
gsettings set org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom0/ command 'nebula-terminal'
gsettings set org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom0/ binding '<Primary><Alt>t'
```

### KDE Plasma
1. System Settings → Shortcuts → Custom Shortcuts
2. Edit → New → Global Shortcut → Command/URL
3. Name: "Nebula Terminal"
4. Trigger: Set to Ctrl+Alt+T
5. Action: Command/URL = `nebula-terminal`

### XFCE
1. Settings → Keyboard → Application Shortcuts
2. Add new shortcut
3. Command: `nebula-terminal`
4. Shortcut: Ctrl+Alt+T

## Register as Terminal Handler

To make Nebula Terminal handle terminal:// URLs and terminal actions:

1. Create the terminal handler file:
   ```bash
   sudo tee /usr/share/applications/nebula-terminal-handler.desktop <<'EOF'
   [Desktop Entry]
   Type=Application
   Name=Nebula Terminal Handler
   Exec=nebula-terminal %u
   NoDisplay=true
   MimeType=x-scheme-handler/terminal;
   EOF
   ```

2. Update desktop database:
   ```bash
   sudo update-desktop-database
   ```

3. Set as default handler:
   ```bash
   xdg-mime default nebula-terminal-handler.desktop x-scheme-handler/terminal
   ```

## Verify Installation

Test that Nebula Terminal is properly registered:

```bash
# Test desktop file
desktop-file-validate /usr/share/applications/nebula-terminal.desktop

# Test launcher
which nebula-terminal

# Test opening
nebula-terminal

# Test terminal handler
xdg-open terminal://
```

## Uninstall

### AppImage Installation
```bash
sudo rm /usr/local/bin/nebula-terminal
sudo rm /usr/share/applications/nebula-terminal.desktop
sudo update-desktop-database
```

### .deb Package
```bash
sudo dpkg -r nebula-terminal
```

## Troubleshooting

### Terminal doesn't open
- Check if the executable is in PATH: `which nebula-terminal`
- Check permissions: `ls -l /usr/local/bin/nebula-terminal`
- Check desktop file: `desktop-file-validate /usr/share/applications/nebula-terminal.desktop`

### Not appearing in application menu
- Update desktop database: `sudo update-desktop-database`
- Check file location: `ls /usr/share/applications/ | grep nebula`

### Can't set as default
- Check desktop environment's default applications settings
- Verify MIME type associations: `xdg-mime query default x-scheme-handler/terminal`

### Terminal crashes on startup
- Run from command line to see errors: `nebula-terminal`
- Check if node-pty is properly compiled: `npm rebuild node-pty`
- Verify Electron version compatibility

## Advanced Configuration

### Custom Shell
Set your preferred shell in `~/.bashrc` or `~/.zshrc`, or modify the main.js to use a different shell by default.

### Font Configuration
The terminal uses FiraCode Nerd Font Mono if available. Install it for best results:
```bash
# Debian/Ubuntu
sudo apt install fonts-firacode

# Arch Linux
sudo pacman -S ttf-firacode-nerd
```

### Integration with File Manager
Configure your file manager to use Nebula Terminal:

**Nautilus (GNOME Files):**
```bash
gsettings set com.github.stunkymonkey.nautilus-open-any-terminal terminal nebula-terminal
```

**Thunar (XFCE):**
1. Edit → Configure custom actions
2. Create new action: "Open Terminal Here"
3. Command: `nebula-terminal %f`
