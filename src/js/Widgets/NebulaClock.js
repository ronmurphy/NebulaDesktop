// Enhanced NebulaClock.js - Self-Managing Widget with Context Menu
class NebulaClock extends NebulaWidget {
    constructor(config = {}) {
        super(config);
        this.updateInterval = null;
        this.timeFormat = config.format || '24h'; // '12h' or '24h'
        this.showSeconds = config.showSeconds !== false; // Default true
        this.showDate = config.showDate !== false; // Default true
        this.settingsMenuVisible = false;
    }

    init() {
        console.log('🕒 Initializing NebulaClock widget');
        this.startUpdating();
        this.setupWidgetContextMenu(); // Enable right-click context menu
    }

    render() {
        console.log('🕒 Rendering NebulaClock widget');
        
        const clockWidget = document.createElement('div');
        clockWidget.className = this.showTitlebar ? 
            'nebula-clock-widget' : 
            'nebula-clock-widget minimal';
        
        this.element = clockWidget;

        if (this.showTitlebar) {
            clockWidget.innerHTML = `
                <div class="widget-header">
                    <span class="widget-icon">🕒</span>
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
                        <span class="menu-icon">🕒</span>
                        <span class="menu-text">${this.timeFormat === '24h' ? 'Switch to 12h' : 'Switch to 24h'}</span>
                    </div>
                    <div class="settings-menu-item" data-action="toggle-seconds">
                        <span class="menu-icon">⏱️</span>
                        <span class="menu-text">${this.showSeconds ? 'Hide Seconds' : 'Show Seconds'}</span>
                    </div>
                    <div class="settings-menu-item" data-action="toggle-date">
                        <span class="menu-icon">📅</span>
                        <span class="menu-text">${this.showDate ? 'Hide Date' : 'Show Date'}</span>
                    </div>
                </div>
            `;
        } else {
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
                        <span class="menu-icon">🕒</span>
                        <span class="menu-text">${this.timeFormat === '24h' ? 'Switch to 12h' : 'Switch to 24h'}</span>
                    </div>
                    <div class="settings-menu-item" data-action="toggle-seconds">
                        <span class="menu-icon">⏱️</span>
                        <span class="menu-text">${this.showSeconds ? 'Hide Seconds' : 'Show Seconds'}</span>
                    </div>
                    <div class="settings-menu-item" data-action="toggle-date">
                        <span class="menu-icon">📅</span>
                        <span class="menu-text">${this.showDate ? 'Hide Date' : 'Show Date'}</span>
                    </div>
                </div>
            `;
        }

        this.setupEventListeners();
        this.updateTime();
        
        console.log('🕒 Clock widget rendered successfully', {
            id: this.id,
            titlebar: this.showTitlebar,
            element: clockWidget
        });

        return clockWidget;
    }

    setupEventListeners() {
        // Set up widget-specific event listeners
        this.element.addEventListener('click', (e) => {
            const action = e.target.closest('[data-action]')?.dataset.action;
            
            if (action === 'close') {
                this.removeWidget();
            } else if (action === 'settings') {
                this.toggleSettingsMenu();
            } else if (action === 'toggle-format') {
                this.toggleTimeFormat();
            } else if (action === 'toggle-seconds') {
                this.toggleSeconds();
            } else if (action === 'toggle-date') {
                this.toggleDate();
            }
        });

        // Close settings menu when clicking outside
        document.addEventListener('click', (e) => {
            if (this.element && !this.element.contains(e.target) && this.settingsMenuVisible) {
                this.hideSettingsMenu();
            }
        });

        // Set up right-click context menu
        this.setupWidgetContextMenu();
    }

    // Custom context menu items for clock widget
    getCustomContextMenuItems() {
        return [
            {
                action: 'settings',
                icon: '⚙️',
                text: 'Clock Settings'
            },
            {
                action: 'toggle-format-context',
                icon: '🕒',
                text: `Switch to ${this.timeFormat === '24h' ? '12h' : '24h'} Format`
            },
            {
                action: 'toggle-seconds-context',
                icon: '⏱️',
                text: `${this.showSeconds ? 'Hide' : 'Show'} Seconds`
            },
            {
                action: 'toggle-date-context',
                icon: '📅',
                text: `${this.showDate ? 'Hide' : 'Show'} Date`
            }
        ];
    }

    // Handle custom context menu actions
    handleCustomContextAction(action) {
        switch (action) {
            case 'settings':
                this.toggleSettingsMenu();
                break;
            case 'toggle-format-context':
                this.toggleTimeFormat();
                break;
            case 'toggle-seconds-context':
                this.toggleSeconds();
                break;
            case 'toggle-date-context':
                this.toggleDate();
                break;
            default:
                console.log(`Unknown clock action: ${action}`);
        }
    }

    startUpdating() {
        this.updateTime();
        this.updateInterval = setInterval(() => {
            this.updateTime();
        }, 1000);
    }

    updateTime() {
        const now = new Date();
        
        // Format time
        let timeString;
        if (this.timeFormat === '12h') {
            timeString = now.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                second: this.showSeconds ? '2-digit' : undefined,
                hour12: true
            });
        } else {
            timeString = now.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: this.showSeconds ? '2-digit' : undefined,
                hour12: false
            });
        }
        
        // Format date
        const dateString = now.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
        
        // Update display
        const timeElement = this.element?.querySelector(`#time-${this.id}`);
        const dateElement = this.element?.querySelector(`#date-${this.id}`);
        
        if (timeElement) {
            timeElement.textContent = timeString;
        }
        
        if (dateElement) {
            dateElement.textContent = dateString;
        }
    }

    toggleTimeFormat() {
        this.timeFormat = this.timeFormat === '24h' ? '12h' : '24h';
        this.updateTime();
        this.updateSettingsMenu();
        console.log(`🕒 Time format changed to: ${this.timeFormat}`);
    }

    toggleSeconds() {
        this.showSeconds = !this.showSeconds;
        this.updateTime();
        this.updateSettingsMenu();
        console.log(`🕒 Seconds display: ${this.showSeconds ? 'ON' : 'OFF'}`);
    }

    toggleDate() {
        this.showDate = !this.showDate;
        
        // Re-render to add/remove date display
        const rect = this.element.getBoundingClientRect();
        this.x = rect.left;
        this.y = rect.top;
        
        const newElement = this.render();
        this.element.parentNode.replaceChild(newElement, this.element);
        this.element = newElement;
        
        this.element.style.left = this.x + 'px';
        this.element.style.top = this.y + 'px';
        
        this.setupEventListeners();
        this.init();
        
        console.log(`🕒 Date display: ${this.showDate ? 'ON' : 'OFF'}`);
    }

    toggleSettingsMenu() {
        const menu = this.element.querySelector(`#settings-menu-${this.id}`);
        if (menu) {
            this.settingsMenuVisible = !this.settingsMenuVisible;
            menu.style.display = this.settingsMenuVisible ? 'block' : 'none';
        }
    }

    hideSettingsMenu() {
        const menu = this.element.querySelector(`#settings-menu-${this.id}`);
        if (menu) {
            menu.style.display = 'none';
            this.settingsMenuVisible = false;
        }
    }

    updateSettingsMenu() {
        // Update settings menu text to reflect current state
        const formatItem = this.element.querySelector('[data-action="toggle-format"] .menu-text');
        const secondsItem = this.element.querySelector('[data-action="toggle-seconds"] .menu-text');
        const dateItem = this.element.querySelector('[data-action="toggle-date"] .menu-text');
        
        if (formatItem) {
            formatItem.textContent = this.timeFormat === '24h' ? 'Switch to 12h' : 'Switch to 24h';
        }
        if (secondsItem) {
            secondsItem.textContent = this.showSeconds ? 'Hide Seconds' : 'Show Seconds';
        }
        if (dateItem) {
            dateItem.textContent = this.showDate ? 'Hide Date' : 'Show Date';
        }
    }

    cleanup() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        super.cleanup(); // Call parent cleanup
        console.log('🕒 NebulaClock cleaned up');
    }

    getTitle() {
        return 'Digital Clock';
    }

    getIcon() {
        return '🕒';
    }
}

// CSS Styles for the Enhanced Clock Widget
const enhancedClockWidgetStyles = `
<style id="enhanced-nebula-clock-styles">
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

/* Dark theme support */
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

// Inject enhanced styles
if (!document.getElementById('enhanced-nebula-clock-styles')) {
    document.head.insertAdjacentHTML('beforeend', enhancedClockWidgetStyles);
}

// Register the enhanced clock widget with the widget system
if (window.NebulaWidgetSystem && window.widgetSystem) {
    // Check if already registered and remove first
    const existing = window.widgetSystem.getRegisteredWidgets().find(w => w.id === 'clock');
    if (existing) {
        console.log('🔄 Updating existing clock widget registration');
    }
    
    window.widgetSystem.registerWidget('clock', {
        name: 'Digital Clock',
        description: 'A digital clock widget with date display and self-managing context menu',
        category: 'system',
        icon: '🕒',
        widgetClass: NebulaClock,
        defaultConfig: {
            format: '24h',
            showSeconds: true,
            showDate: true,
            showTitlebar: true,
            x: 100,
            y: 100
        },
        author: 'NebulaDesktop',
        version: '2.0.0'
    });
    
    console.log('✅ Enhanced Clock widget registered successfully');
} else {
    console.warn('⚠️ Widget system not available for clock registration');
}

// Make the enhanced class globally available
window.NebulaClock = NebulaClock;

console.log('✅ Enhanced NebulaClock loaded with self-managing context menu!');