// NebulaClock.js - Demo Clock Widget
class NebulaClock extends NebulaWidget {
    constructor(config = {}) {
        super(config);
        this.updateInterval = null;
        this.timeFormat = config.format || '24h'; // '12h' or '24h'
        this.showSeconds = config.showSeconds !== false; // Default true
        this.showDate = config.showDate !== false; // Default true
        this.showTitlebar = config.showTitlebar !== false; // Default true, but can be disabled
    }

    init() {
        console.log('🕐 Initializing NebulaClock widget');
        this.startUpdating();
    }

    render() {
        console.log('🕐 Rendering NebulaClock widget');
        
        // Create the main clock container
        const clockWidget = document.createElement('div');
        clockWidget.className = this.showTitlebar ? 'nebula-clock-widget' : 'nebula-clock-widget minimal';
        
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
            `;
        }

        // Add event listeners
        this.setupEventListeners(clockWidget);

        // Initial time update
        this.updateTime();
        
        console.log('🕐 Clock widget rendered successfully', {
            id: this.id,
            titlebar: this.showTitlebar,
            element: clockWidget,
            dimensions: `${clockWidget.offsetWidth}x${clockWidget.offsetHeight}`
        });

        return clockWidget;
    }

    setupEventListeners(element) {
        // Handle control buttons
        element.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            
            if (action === 'close') {
                this.handleClose();
            } else if (action === 'settings') {
                this.handleSettings();
            }
        });
        
        // Double-click for quick settings toggle
        element.addEventListener('dblclick', () => {
            this.handleSettings();
        });
    }

    startUpdating() {
        // Update immediately
        this.updateTime();
        
        // Update every second
        this.updateInterval = setInterval(() => {
            this.updateTime();
        }, 1000);
    }

    updateTime() {
        if (!this.element) return;

        const now = new Date();
        
        // Update time display
        const timeElement = this.element.querySelector(`#time-${this.id}`);
        if (timeElement) {
            timeElement.textContent = this.formatTime(now);
        }

        // Update date display if enabled
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
            hours = hours ? hours : 12; // 0 should be 12
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
        // Remove this widget instance
        if (window.widgetSystem) {
            window.widgetSystem.removeWidget(this.id);
        }
    }

    handleSettings() {
        // Simple settings toggle for demo - cycle through formats
        const formats = ['24h', '12h'];
        const currentIndex = formats.indexOf(this.timeFormat);
        const nextIndex = (currentIndex + 1) % formats.length;
        
        this.timeFormat = formats[nextIndex];
        this.updateTime();
        
        console.log(`🕐 Clock format changed to: ${this.timeFormat}`);
        
        // Show a brief notification
        const notification = document.createElement('div');
        notification.textContent = `Format: ${this.timeFormat === '24h' ? '24-hour' : '12-hour'}`;
        notification.style.cssText = `
            position: absolute;
            top: -30px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--nebula-primary, #667eea);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            pointer-events: none;
            z-index: 1000;
        `;
        
        this.element.style.position = 'relative';
        this.element.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 1500);
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
    overflow: hidden;
    transition: var(--nebula-transition, all 0.3s ease);
}

/* Minimal widget style - no titlebar */
.nebula-clock-widget.minimal {
    min-width: 150px;
    background: rgba(var(--nebula-surface-rgb, 255, 255, 255), 0.95);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(var(--nebula-border-rgb, 226, 232, 240), 0.6);
}

.nebula-clock-widget:hover {
    box-shadow: var(--nebula-shadow-lg, 0 8px 32px rgba(0, 0, 0, 0.15));
}

.nebula-clock-widget.dragging {
    transform: rotate(2deg);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
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
    cursor: move; /* Indicates draggable area */
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

/* Minimal clock display */
.clock-display.minimal {
    padding: 12px;
    cursor: move; /* Allow dragging from main area in minimal mode */
}

/* Minimal controls - hidden by default, show on hover */
.minimal-controls {
    position: absolute;
    top: 4px;
    right: 4px;
    display: none;
    gap: 2px;
}

.nebula-clock-widget.minimal:hover .minimal-controls {
    display: flex;
}

.minimal-control-btn {
    background: rgba(0, 0, 0, 0.1);
    border: none;
    color: var(--nebula-text-secondary, #64748b);
    width: 20px;
    height: 20px;
    border-radius: 3px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    transition: background-color 0.2s ease;
}

.minimal-control-btn:hover {
    background: rgba(0, 0, 0, 0.2);
    color: var(--nebula-text-primary, #1a202c);
}

.time-display {
    font-size: 24px;
    font-weight: 700;
    font-family: 'Courier New', monospace;
    color: var(--nebula-text-primary, #1a202c);
    margin-bottom: 4px;
    letter-spacing: 1px;
}

/* Smaller time display for minimal widgets */
.nebula-clock-widget.minimal .time-display {
    font-size: 20px;
    margin-bottom: 2px;
}

.date-display {
    font-size: 12px;
    color: var(--nebula-text-secondary, #64748b);
    font-weight: 500;
}

/* Smaller date display for minimal widgets */
.nebula-clock-widget.minimal .date-display {
    font-size: 10px;
}

/* Widget layer styles */
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

// Demo: Create a clock widget instance (commented out for now)
// if (window.widgetSystem) {
//     setTimeout(() => {
//         const clockId = window.widgetSystem.createWidget('clock', {
//             x: 50,
//             y: 50,
//             format: '12h'
//         });
//         console.log('🕐 Demo clock created:', clockId);
//     }, 1000);
// }