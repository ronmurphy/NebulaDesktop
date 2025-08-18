// NebulaClock.js - Clean Clock Widget (Complete Rewrite)
class NebulaClock extends NebulaWidget {
    constructor(config = {}) {
        super(config);
        this.updateInterval = null;
        this.timeFormat = config.format || '24h'; // '12h' or '24h'
        this.showSeconds = config.showSeconds !== false; // Default true
        this.showDate = config.showDate !== false; // Default true
        this.showTitlebar = config.showTitlebar !== false; // Default true
        this.settingsMenuVisible = false;
    }

    init() {
        console.log('🕐 Initializing NebulaClock widget');
        this.startUpdating();
    }

    render() {
        console.log('🕐 Rendering NebulaClock widget');
        
        // Create the main clock container
        const clockWidget = document.createElement('div');
        clockWidget.className = this.showTitlebar ? 
            'nebula-clock-widget' : 
            'nebula-clock-widget minimal';
        
        // Store reference for updates
        this.element = clockWidget;

        // Create clock structure - conditional titlebar
        if (this.showTitlebar) {
            clockWidget.innerHTML = `
                <div class="widget-header">
                    <span class="widget-icon">🕐</span>
                    <span class="widget-title">Clock</span>
                    <div class="widget-controls">
                        <button class="widget-control-btn" data-action="settings" title="Settings">⚙️</button>
                        <button class="widget-control-btn" data-action="close" title="Close">×</button>
                    </div>
                </div>
                <div class="clock-display">
                    <div class="time-display" id="time-${this.id}">--:--</div>
                    ${this.showDate ? `<div class="date-display" id="date-${this.id}">Loading...</div>` : ''}
                </div>
                <div class="settings-menu" id="settings-menu-${this.id}" style="display: none;">
                    <div class="settings-menu-item" data-action="toggle-format">
                        <span class="menu-icon">🕐</span>
                        <span class="menu-text">${this.timeFormat === '24h' ? 'Switch to 12h' : 'Switch to 24h'}</span>
                    </div>
                    <div class="settings-menu-item" data-action="widget-config">
                        <span class="menu-icon">🎨</span>
                        <span class="menu-text">Widget Appearance</span>
                        <span class="menu-arrow">→</span>
                    </div>
                </div>
            `;
        } else {
            // Minimal widget - clock display with hover controls
            clockWidget.innerHTML = `
                <div class="clock-display minimal">
                    <div class="minimal-controls">
                        <button class="minimal-control-btn" data-action="settings" title="Settings">⚙️</button>
                        <button class="minimal-control-btn" data-action="close" title="Close">×</button>
                    </div>
                    <div class="time-display" id="time-${this.id}">--:--</div>
                    ${this.showDate ? `<div class="date-display" id="date-${this.id}">Loading...</div>` : ''}
                </div>
                <div class="settings-menu minimal" id="settings-menu-${this.id}" style="display: none;">
                    <div class="settings-menu-item" data-action="toggle-format">
                        <span class="menu-icon">🕐</span>
                        <span class="menu-text">${this.timeFormat === '24h' ? 'Switch to 12h' : 'Switch to 24h'}</span>
                    </div>
                    <div class="settings-menu-item" data-action="widget-config">
                        <span class="menu-icon">🎨</span>
                        <span class="menu-text">Widget Appearance</span>
                        <span class="menu-arrow">→</span>
                    </div>
                </div>
            `;
        }

        // Add event listeners
        this.setupEventListeners(clockWidget);

        // Initial time update
        this.updateTime();
        
        console.log('🕐 Clock widget rendered successfully', {
            id: this.id,
            titlebar: this.showTitlebar,
            element: clockWidget
        });

        return clockWidget;
    }

    setupEventListeners(element) {
        // Handle control buttons and menu
        element.addEventListener('click', (e) => {
            const action = e.target.closest('[data-action]')?.dataset.action;
            
            if (action === 'close') {
                this.handleClose();
            } else if (action === 'settings') {
                this.toggleSettingsMenu();
            } else if (action === 'toggle-format') {
                this.toggleTimeFormat();
                this.updateSettingsMenu();
                this.hideSettingsMenu();
            } else if (action === 'widget-config') {
                this.openWidgetConfig();
                this.hideSettingsMenu();
            }
        });
        
        // Double-click for quick format toggle
        element.addEventListener('dblclick', (e) => {
            if (!e.target.closest('.widget-controls') && 
                !e.target.closest('.minimal-controls') && 
                !e.target.closest('.settings-menu')) {
                this.toggleTimeFormat();
            }
        });

        // Close settings menu when clicking outside
        document.addEventListener('click', (e) => {
            // Check if click is outside this widget element
            if (this.element && !this.element.contains(e.target) && this.settingsMenuVisible) {
                this.hideSettingsMenu();
            }
        });
    }

    startUpdating() {
        this.updateTime();
        this.updateInterval = setInterval(() => {
            this.updateTime();
        }, 1000);
    }

    updateTime() {
        if (!this.element) return;

        const now = new Date();
        
        const timeElement = this.element.querySelector(`#time-${this.id}`);
        if (timeElement) {
            timeElement.textContent = this.formatTime(now);
        }

        if (this.showDate) {
            const dateElement = this.element.querySelector(`#date-${this.id}`);
            if (dateElement) {
                dateElement.textContent = this.formatDate(now);
            }
        }
    }

    formatTime(date) {
        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');

        if (this.timeFormat === '12h') {
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12;
            const timeString = `${hours}:${minutes}`;
            return this.showSeconds ? `${timeString}:${seconds} ${ampm}` : `${timeString} ${ampm}`;
        } else {
            const timeString = `${hours.toString().padStart(2, '0')}:${minutes}`;
            return this.showSeconds ? `${timeString}:${seconds}` : timeString;
        }
    }

    formatDate(date) {
        const options = { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        };
        return date.toLocaleDateString('en-US', options);
    }

    handleClose() {
        if (window.widgetSystem) {
            window.widgetSystem.removeWidget(this.id);
        }
    }

    toggleSettingsMenu() {
        if (this.settingsMenuVisible) {
            this.hideSettingsMenu();
        } else {
            this.showSettingsMenu();
        }
    }

    showSettingsMenu() {
        const menu = this.element.querySelector(`#settings-menu-${this.id}`);
        if (!menu) return;

        menu.style.display = 'block';
        this.settingsMenuVisible = true;
        console.log('📋 Settings menu opened');
    }

    hideSettingsMenu() {
        const menu = this.element.querySelector(`#settings-menu-${this.id}`);
        if (!menu) return;

        menu.style.display = 'none';
        this.settingsMenuVisible = false;
        console.log('📋 Settings menu closed');
    }

    toggleTimeFormat() {
        this.timeFormat = this.timeFormat === '24h' ? '12h' : '24h';
        this.updateTime();
        console.log(`🕐 Clock format changed to: ${this.timeFormat}`);
    }

    openWidgetConfig() {
        console.log('🎨 Opening widget appearance config');
        alert('Widget Appearance Config\n\n' +
              '• Global widget styling\n' +
              '• Theme selection (Nebula/Glass/Custom)\n' +
              '• Color schemes\n' +
              '• Transparency settings\n\n' +
              '(This will be implemented in the global widget config panel)');
    }

    updateSettingsMenu() {
        const formatItem = this.element.querySelector('[data-action="toggle-format"] .menu-text');
        if (formatItem) {
            formatItem.textContent = this.timeFormat === '24h' ? 'Switch to 12h' : 'Switch to 24h';
        }
    }

    cleanup() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        console.log('🕐 NebulaClock cleaned up');
    }

    getTitle() {
        return 'Digital Clock';
    }

    getIcon() {
        return '🕐';
    }
}

// CSS Styles for the Clock Widget
const clockWidgetStyles = `
<style id="nebula-clock-styles">
.nebula-clock-widget {
    background: var(--nebula-surface, #ffffff);
    border: 1px solid var(--nebula-border, #e2e8f0);
    border-radius: var(--nebula-radius-lg, 12px);
    box-shadow: var(--nebula-shadow-md, 0 4px 16px rgba(0, 0, 0, 0.1));
    min-width: 200px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    overflow: visible;
    transition: var(--nebula-transition, all 0.3s ease);
    position: relative;
    color: var(--nebula-text-primary, #1a202c);
}

.nebula-clock-widget.minimal {
    min-width: 150px;
}

.nebula-clock-widget:hover {
    box-shadow: var(--nebula-shadow-lg, 0 8px 32px rgba(0, 0, 0, 0.15));
}

.widget-dragging {
    opacity: 0.8;
    transform: scale(1.02);
    transition: none;
    z-index: 1650 !important;
}

.widget-header {
    background: var(--nebula-primary, #667eea);
    color: white;
    padding: 8px 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: move;
    border-radius: var(--nebula-radius-lg, 12px) var(--nebula-radius-lg, 12px) 0 0;
}

.widget-icon {
    font-size: 16px;
}

.widget-title {
    flex: 1;
}

.widget-controls {
    display: flex;
    gap: 4px;
}

.widget-control-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    transition: background-color 0.2s ease;
}

.widget-control-btn:hover {
    background: rgba(255, 255, 255, 0.3);
}

.clock-display {
    padding: 16px;
    text-align: center;
    position: relative;
}

.clock-display.minimal {
    padding: 12px;
    cursor: move;
}

.minimal-controls {
    position: absolute;
    top: 4px;
    right: 4px;
    display: none;
    gap: 2px;
    z-index: 10;
}

.nebula-clock-widget.minimal:hover .minimal-controls {
    display: flex;
}

.minimal-control-btn {
    background: rgba(102, 126, 234, 0.1);
    border: none;
    color: var(--nebula-primary, #667eea);
    width: 20px;
    height: 20px;
    border-radius: 3px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    transition: all 0.2s ease;
    pointer-events: auto;
}

.minimal-control-btn:hover {
    background: rgba(102, 126, 234, 0.2);
    color: var(--nebula-primary, #667eea);
}

.time-display {
    font-size: 24px;
    font-weight: 700;
    font-family: 'Courier New', monospace;
    margin-bottom: 4px;
    letter-spacing: 1px;
}

.nebula-clock-widget.minimal .time-display {
    font-size: 20px;
    margin-bottom: 2px;
}

.date-display {
    font-size: 12px;
    font-weight: 500;
    opacity: 0.8;
    color: var(--nebula-text-secondary, #64748b);
}

.nebula-clock-widget.minimal .date-display {
    font-size: 10px;
}

.settings-menu {
    position: absolute;
    top: 100%;
    right: 0;
    background: var(--nebula-surface, #ffffff);
    border: 1px solid var(--nebula-border, #e2e8f0);
    border-radius: var(--nebula-radius-md, 8px);
    box-shadow: var(--nebula-shadow-lg, 0 8px 32px rgba(0, 0, 0, 0.15));
    min-width: 180px;
    z-index: 1000;
    overflow: hidden;
}

.settings-menu.minimal {
    top: auto;
    bottom: 100%;
    margin-bottom: 4px;
}

.settings-menu-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    cursor: pointer;
    transition: background-color 0.2s ease;
    font-size: 13px;
    color: var(--nebula-text-primary, #1a202c);
}

.settings-menu-item:hover {
    background: var(--nebula-surface-hover, #f1f5f9);
}

.menu-icon {
    font-size: 14px;
    width: 16px;
    text-align: center;
}

.menu-text {
    flex: 1;
}

.menu-arrow {
    font-size: 12px;
    color: var(--nebula-text-secondary, #64748b);
}

[data-theme="dark"] .nebula-clock-widget {
    background: var(--nebula-surface, #2d3748);
    border-color: var(--nebula-border, #4a5568);
    color: var(--nebula-text-primary, #e2e8f0);
}

[data-theme="dark"] .settings-menu {
    background: var(--nebula-surface, #2d3748);
    border-color: var(--nebula-border, #4a5568);
    color: var(--nebula-text-primary, #e2e8f0);
}

[data-theme="dark"] .settings-menu-item:hover {
    background: var(--nebula-surface-hover, #4a5568);
}

.widget-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 50;
}

.nebula-widget-wrapper {
    pointer-events: auto;
}
</style>
`;

// Inject styles
if (!document.getElementById('nebula-clock-styles')) {
    document.head.insertAdjacentHTML('beforeend', clockWidgetStyles);
}

// Register the clock widget with the widget system
if (window.NebulaWidgetSystem && window.widgetSystem) {
    window.widgetSystem.registerWidget('clock', {
        name: 'Digital Clock',
        description: 'A simple digital clock widget with date display',
        category: 'system',
        icon: '🕐',
        widgetClass: NebulaClock,
        defaultConfig: {
            format: '24h',
            showSeconds: true,
            showDate: true,
            x: 100,
            y: 100
        },
        author: 'NebulaDesktop',
        version: '1.0.0'
    });
    
    console.log('✅ Clock widget registered successfully');
}

// Make the class globally available
window.NebulaClock = NebulaClock;