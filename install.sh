#!/bin/bash

# NebulaDesktop Installation Script
# Installs NebulaDesktop as a selectable desktop session

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NEBULA_NAME="NebulaDesktop"
NEBULA_VERSION="1.0"
INSTALL_DIR="/opt/nebula"
BIN_DIR="/usr/local/bin"
WAYLAND_SESSION_DIR="/usr/share/wayland-sessions"
X11_SESSION_DIR="/usr/share/xsessions"

# Print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        return 0
    else
        return 1
    fi
}

# Check dependencies
check_dependencies() {
    print_status "Checking dependencies..."
    
    local missing_deps=()
    
    # Check for Node.js and npm
    if ! command -v node &> /dev/null; then
        missing_deps+=("nodejs")
    fi
    
    if ! command -v npm &> /dev/null; then
        missing_deps+=("npm")
    fi
    
    # Check for Electron (will be installed via npm if not present)
    if ! command -v electron &> /dev/null && ! npm list -g electron &> /dev/null; then
        print_warning "Electron not found globally, will be installed locally"
    fi
    
    # Check for Wayland compositor options
    local wayland_compositors=("cage" "weston" "labwc")
    local wayland_found=false
    
    for compositor in "${wayland_compositors[@]}"; do
        if command -v "$compositor" &> /dev/null; then
            print_success "Found Wayland compositor: $compositor"
            wayland_found=true
            break
        fi
    done
    
    if ! $wayland_found; then
        print_warning "No Wayland compositor found. Install one of: ${wayland_compositors[*]}"
        print_status "For Arch: sudo pacman -S cage"
        print_status "For Ubuntu/Debian: sudo apt install cage"
    fi
    
    # Check for X11 (basic check)
    if ! command -v startx &> /dev/null; then
        print_warning "startx not found - X11 session may not work"
    fi
    
    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        print_error "Missing required dependencies: ${missing_deps[*]}"
        print_status "Please install them and run this script again"
        exit 1
    fi
    
    print_success "Dependencies check passed"
}

# Detect current display server
detect_display_server() {
    if [[ -n $WAYLAND_DISPLAY ]]; then
        echo "wayland"
    elif [[ -n $DISPLAY ]]; then
        echo "x11"
    else
        echo "unknown"
    fi
}

# Create necessary directories
create_directories() {
    print_status "Creating directories..."
    
    if check_root; then
        mkdir -p "$INSTALL_DIR"
        mkdir -p "$WAYLAND_SESSION_DIR"
        mkdir -p "$X11_SESSION_DIR"
        print_success "System directories created"
    else
        print_error "Root privileges required to create system directories"
        exit 1
    fi
}

# Install NebulaDesktop files
install_files() {
    print_status "Installing NebulaDesktop files..."
    
    # Check if we're in the NebulaDesktop source directory
    if [[ ! -f "package.json" ]] || [[ ! -f "src/index.html" ]]; then
        print_error "Not in NebulaDesktop source directory!"
        print_status "Please run this script from the NebulaDesktop project root"
        exit 1
    fi
    
    # Copy source files to install directory
    print_status "Copying source files to $INSTALL_DIR..."
    cp -r . "$INSTALL_DIR/"
    
    # Install npm dependencies
    print_status "Installing npm dependencies..."
    cd "$INSTALL_DIR"
    npm install --production
    
    # Make sure electron is available
    if [[ ! -f "node_modules/.bin/electron" ]]; then
        print_status "Installing Electron..."
        npm install electron
    fi
    
    print_success "NebulaDesktop files installed"
}

# Create executable wrapper
create_executable() {
    print_status "Creating executable wrapper..."
    
    cat > "$BIN_DIR/nebula-desktop" << 'EOF'
#!/bin/bash

# NebulaDesktop executable wrapper
NEBULA_DIR="/opt/nebula"

# Change to NebulaDesktop directory
cd "$NEBULA_DIR"

# Set environment variables
export NEBULA_SESSION=true
export XDG_CURRENT_DESKTOP=Nebula

# Handle command line arguments
ARGS="$@"

# Add fullscreen if not specified
if [[ ! "$ARGS" =~ "--start-fullscreen" && ! "$ARGS" =~ "--fullscreen" ]]; then
    ARGS="$ARGS --start-fullscreen"
fi

# Start NebulaDesktop
exec npm start -- $ARGS
EOF
    
    chmod +x "$BIN_DIR/nebula-desktop"
    print_success "Executable wrapper created at $BIN_DIR/nebula-desktop"
}

# Install session files
install_sessions() {
    print_status "Installing desktop session files..."
    
    # Install Wayland session
    if [[ -f "nebula-wayland.desktop" ]]; then
        cp "nebula-wayland.desktop" "$WAYLAND_SESSION_DIR/nebula.desktop"
        print_success "Wayland session installed"
    else
        print_warning "nebula-wayland.desktop not found, creating default..."
        cat > "$WAYLAND_SESSION_DIR/nebula.desktop" << EOF
[Desktop Entry]
Name=NebulaDesktop
Comment=AI-Enhanced Desktop Environment
Exec=/usr/local/bin/nebula-session
Type=Application
DesktopNames=Nebula
EOF
    fi
    
    # Install X11 session
    if [[ -f "nebula-x.desktop" ]]; then
        cp "nebula-x.desktop" "$X11_SESSION_DIR/nebula.desktop"
        print_success "X11 session installed"
    else
        print_warning "nebula-x.desktop not found, creating default..."
        cat > "$X11_SESSION_DIR/nebula.desktop" << EOF
[Desktop Entry]
Name=NebulaDesktop
Comment=AI-Enhanced Desktop Environment
Exec=/usr/local/bin/nebula-session
Type=Application
DesktopNames=Nebula
EOF
    fi
}

# Install session launcher
install_session_launcher() {
    print_status "Installing session launcher..."
    
    if [[ -f "nebula-session" ]]; then
        cp "nebula-session" "$BIN_DIR/nebula-session"
    else
        print_warning "nebula-session not found, creating default..."
        cat > "$BIN_DIR/nebula-session" << 'EOF'
#!/bin/bash

# NebulaDesktop Session Launcher
# Detects available compositor and starts NebulaDesktop

# Set up environment
export NEBULA_SESSION=true
export XDG_CURRENT_DESKTOP=Nebula

# Function to start with Wayland
start_wayland() {
    if command -v cage &> /dev/null; then
        echo "Starting NebulaDesktop with Cage compositor..."
        exec cage /usr/local/bin/nebula-desktop
    elif command -v weston &> /dev/null; then
        echo "Starting NebulaDesktop with Weston compositor..."
        exec weston --fullscreen /usr/local/bin/nebula-desktop
    elif command -v labwc &> /dev/null; then
        echo "Starting NebulaDesktop with Labwc compositor..."
        exec labwc /usr/local/bin/nebula-desktop
    else
        echo "No Wayland compositor found, falling back to X11..."
        start_x11
    fi
}

# Function to start with X11
start_x11() {
    if command -v startx &> /dev/null; then
        echo "Starting NebulaDesktop with X11..."
        exec startx /usr/local/bin/nebula-desktop
    else
        echo "Error: No display server available!"
        exit 1
    fi
}

# Detect and start appropriate session
if [[ "$XDG_SESSION_TYPE" == "wayland" ]] || [[ -n "$WAYLAND_DISPLAY" ]]; then
    start_wayland
else
    start_x11
fi
EOF
    fi
    
    chmod +x "$BIN_DIR/nebula-session"
    print_success "Session launcher installed"
}

# Set proper permissions
set_permissions() {
    print_status "Setting permissions..."
    
    chown -R root:root "$INSTALL_DIR"
    chmod -R 755 "$INSTALL_DIR"
    
    chmod 755 "$BIN_DIR/nebula-desktop"
    chmod 755 "$BIN_DIR/nebula-session"
    
    chmod 644 "$WAYLAND_SESSION_DIR/nebula.desktop"
    chmod 644 "$X11_SESSION_DIR/nebula.desktop"
    
    print_success "Permissions set"
}

# Create uninstaller
create_uninstaller() {
    print_status "Creating uninstaller..."
    
    cat > "$BIN_DIR/nebula-uninstall" << EOF
#!/bin/bash

# NebulaDesktop Uninstaller

echo "Uninstalling NebulaDesktop..."

# Remove files
rm -rf "$INSTALL_DIR"
rm -f "$BIN_DIR/nebula-desktop"
rm -f "$BIN_DIR/nebula-session"
rm -f "$WAYLAND_SESSION_DIR/nebula.desktop"
rm -f "$X11_SESSION_DIR/nebula.desktop"
rm -f "$BIN_DIR/nebula-uninstall"

echo "NebulaDesktop uninstalled successfully"
echo "You may need to restart your display manager to remove it from the login screen"
EOF
    
    chmod +x "$BIN_DIR/nebula-uninstall"
    print_success "Uninstaller created at $BIN_DIR/nebula-uninstall"
}

# Show usage information
show_usage() {
    echo "NebulaDesktop Installer"
    echo ""
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  install     Install NebulaDesktop as desktop session"
    echo "  uninstall   Remove NebulaDesktop"
    echo "  status      Show installation status"
    echo "  test        Test NebulaDesktop without installing"
    echo "  help        Show this help message"
    echo ""
}

# Check installation status
check_status() {
    print_status "Checking NebulaDesktop installation status..."
    
    local installed=true
    
    # Check main installation
    if [[ ! -d "$INSTALL_DIR" ]]; then
        print_error "NebulaDesktop not installed in $INSTALL_DIR"
        installed=false
    fi
    
    # Check executables
    if [[ ! -f "$BIN_DIR/nebula-desktop" ]]; then
        print_error "nebula-desktop executable not found"
        installed=false
    fi
    
    if [[ ! -f "$BIN_DIR/nebula-session" ]]; then
        print_error "nebula-session launcher not found"
        installed=false
    fi
    
    # Check session files
    if [[ ! -f "$WAYLAND_SESSION_DIR/nebula.desktop" ]]; then
        print_warning "Wayland session file not found"
    fi
    
    if [[ ! -f "$X11_SESSION_DIR/nebula.desktop" ]]; then
        print_warning "X11 session file not found"
    fi
    
    if $installed; then
        print_success "NebulaDesktop is properly installed"
        print_status "Current display server: $(detect_display_server)"
        print_status "Installation directory: $INSTALL_DIR"
    else
        print_error "NebulaDesktop installation is incomplete or missing"
    fi
}

# Test NebulaDesktop
test_nebula() {
    print_status "Testing NebulaDesktop..."
    
    if [[ ! -f "package.json" ]]; then
        print_error "Not in NebulaDesktop source directory"
        exit 1
    fi
    
    print_status "Installing dependencies..."
    npm install
    
    print_status "Starting NebulaDesktop in test mode..."
    npm start
}

# Main installation function
install_nebula() {
    print_status "Installing NebulaDesktop as desktop session..."
    
    # Check if already installed
    if [[ -d "$INSTALL_DIR" ]]; then
        print_warning "NebulaDesktop already installed"
        read -p "Reinstall? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Installation cancelled"
            exit 0
        fi
    fi
    
    # Require root for system installation
    if ! check_root; then
        print_error "Root privileges required for installation"
        print_status "Please run: sudo $0 install"
        exit 1
    fi
    
    check_dependencies
    create_directories
    install_files
    create_executable
    install_sessions
    install_session_launcher
    set_permissions
    create_uninstaller
    
    print_success "NebulaDesktop installed successfully!"
    print_status ""
    print_status "Next steps:"
    print_status "1. Restart your display manager (or reboot)"
    print_status "2. Select 'NebulaDesktop' from your login screen"
    print_status "3. Enjoy your AI-enhanced desktop!"
    print_status ""
    print_status "To uninstall: sudo nebula-uninstall"
    print_status "To test first: $0 test"
}

# Uninstall function
uninstall_nebula() {
    if check_root && [[ -f "$BIN_DIR/nebula-uninstall" ]]; then
        exec "$BIN_DIR/nebula-uninstall"
    else
        print_error "NebulaDesktop not installed or no root privileges"
        exit 1
    fi
}

# Main script logic
case "${1:-install}" in
    install)
        install_nebula
        ;;
    uninstall)
        uninstall_nebula
        ;;
    status)
        check_status
        ;;
    test)
        test_nebula
        ;;
    help|--help|-h)
        show_usage
        ;;
    *)
        print_error "Unknown option: $1"
        show_usage
        exit 1
        ;;
esac