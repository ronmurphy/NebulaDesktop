// WindowManager.js - FIXED - No Double Window Creation
class WindowManager {
    constructor() {
        this.windows = new Map(); // windowId -> windowData
        this.activeWindow = null;
        this.nextId = 1;
        this.zIndexCounter = 100;

        // APP MANAGEMENT - FIXED
        this.appRegistry = new Map();      // appType -> config
        this.runningApps = new Map();      // appType -> windowIds[]
        this.singletonApps = new Set();    // Track singleton app types
        this.stateCleanupDone = false;     // Prevent duplicate cleanups
        
        this.availableArea = {
            x: 0,
            y: 0,
            width: window.innerWidth,
            height: window.innerHeight - 50
        };

        this.setupGlobalListeners();
        this.setupAppRegistry();

        // Listen for window resize to update available area
        window.addEventListener('resize', () => {
            this.updateAvailableArea(
                this.availableArea.x,
                window.innerWidth - this.availableArea.width - this.availableArea.x,
                this.availableArea.y,
                window.innerHeight - this.availableArea.height - this.availableArea.y
            );
        });
        
        console.log('WindowManager with integrated App Management initialized');
    }

    // ========== APP REGISTRY SETUP ==========
    
    setupAppRegistry() {
        // Register all available apps with their configs
        this.registerApp('browser', {
            class: 'NebulaBrowser',
            name: 'Browser',
            icon: '🌐',
            singleton: false,      // Can have multiple instances
            persistent: true,      // Save state across sessions
            autoRestore: false,    // Don't auto-restore browsers (prevents duplication)
            defaultConfig: {
                title: 'Nebula Browser',
                width: 1200,
                height: 700,
                hasTabBar: false,
                resizable: true
            }
        });
        
        this.registerApp('terminal', {
            class: 'NebulaTerminal',
            name: 'Terminal', 
            icon: '💻',
            singleton: false,      // Can have multiple terminals
            persistent: true,      // Remember working directory, command history
            autoRestore: true,     // Restore terminals on startup
            defaultConfig: {
                title: 'Nebula Terminal',
                width: 800,
                height: 500,
                hasTabBar: false,
                resizable: true
            }
        });
        
        this.registerApp('settings', {
            class: 'NebulaSettings',
            name: 'Settings',
            icon: '⚙️',
            singleton: true,       // Only one Settings window allowed
            persistent: true,
            autoRestore: false,
            defaultConfig: {
                title: 'Settings',
                width: 600,
                height: 400,
                hasTabBar: false,
                resizable: true
            }
        });
        
        // Calculator now properly registered instead of dummy in renderer
        this.registerApp('calculator', {
            class: 'NebulaCalculator',
            name: 'Calculator',
            icon: '🧮',
            singleton: true,       // Only one calculator needed
            persistent: false,     // Don't persist calculator state
            autoRestore: false,
            defaultConfig: {
                title: 'Calculator',
                width: 300,
                height: 400,
                hasTabBar: false,
                resizable: false
            }
        });
        
        console.log(`Registered ${this.appRegistry.size} app types`);
    }
    
    registerApp(type, config) {
        this.appRegistry.set(type, config);
        this.runningApps.set(type, []);
        
        if (config.singleton) {
            this.singletonApps.add(type);
        }
    }

    // ========== APP LAUNCHING ==========
    
    /**
     * Launch an app - main entry point from renderer.js
     */
    async launchApp(appType, options = {}) {
        const appConfig = this.appRegistry.get(appType);
        if (!appConfig) {
            console.error(`Unknown app type: ${appType}`);
            return null;
        }
        
        // Check if it's a singleton app and already running
        if (appConfig.singleton) {
            const existingWindows = this.runningApps.get(appType);
            if (existingWindows.length > 0) {
                // Focus existing window instead of creating new one
                const windowId = existingWindows[0];
                this.focusWindow(windowId);
                console.log(`Focused existing ${appType} window`);
                return windowId;
            }
        }
        
        // Only restore state if explicitly requested, not by default
        let restoredState = null;
        if (appConfig.persistent && options.restore === true) {
            restoredState = this.loadAppState(appType, options.instanceId);
            console.log(`Loading saved state for ${appType}:`, restoredState ? 'Found' : 'None');
        }
        
        // Merge options with restored state and defaults
        const finalConfig = {
            ...appConfig.defaultConfig,
            ...restoredState?.windowConfig,
            ...options,
            appType: appType,
            appConfig: appConfig
        };
        
        // FIXED: Create the window and app in one step to prevent duplication
        const windowId = this.createManagedAppWindow(finalConfig, restoredState);
        
        if (windowId) {
            // Track this app instance
            this.runningApps.get(appType).push(windowId);
            console.log(`✅ Launched ${appType} (window: ${windowId})`);
        }
        
        return windowId;
    }
    
    /**
     * FIXED: Create window and app without letting app create its own window
     */
    createManagedAppWindow(config, restoredState = null) {
        // Create the window first
        const windowId = this.createWindow(config);
        
        if (!windowId) {
            console.error('Failed to create window');
            return null;
        }
        
        // Store window data with app info
        const windowData = this.windows.get(windowId);
        if (windowData) {
            windowData.appType = config.appType;
            windowData.appConfig = config.appConfig;
            windowData.instanceId = `${config.appType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }
        
        // Handle special apps that don't have classes yet
        if (config.appType === 'calculator') {
            this.loadCalculatorApp(windowId);
        } else if (config.appType === 'settings') {
            this.loadSettingsApp(windowId);
        } else {
            // Load external app class but prevent it from creating its own window
            this.loadExternalApp(windowId, config, restoredState);
        }
        
        // Restore maximized state if needed
        if (restoredState?.windowConfig?.isMaximized) {
            setTimeout(() => {
                this.toggleMaximizeWindow(windowId);
            }, 100);
        }
        
        return windowId;
    }

    /**
     * FIXED: Load external app without letting it create its own window
     */
    loadExternalApp(windowId, config, restoredState) {
        const AppClass = window[config.appConfig.class];
        if (!AppClass) {
            console.error(`App class ${config.appConfig.class} not found`);
            this.closeWindow(windowId);
            return;
        }
        
        const windowData = this.windows.get(windowId);
        
        try {
            // FIXED: Create app instance and inject the windowId so it doesn't create its own
            const appConstructorArg = restoredState?.appState || config.initialUrl || null;
            
            // Create app instance but tell it to use our windowId
            const appInstance = new AppClass(appConstructorArg);
            
            // CRITICAL FIX: Override the app's windowId before it calls init()
            if (appInstance) {
                appInstance.windowId = windowId;
                appInstance.instanceId = windowData.instanceId;
                appInstance._managedByWindowManager = true; // Flag to prevent double window creation
                
                // Store app reference
                windowData.appInstance = appInstance;
                
                // Load the app content into our window
                this.loadApp(windowId, appInstance);
            }
            
        } catch (error) {
            console.error(`Failed to create ${config.appType} instance:`, error);
            this.closeWindow(windowId);
        }
    }

    // ========== BUILT-IN APPS ==========

    /**
     * Calculator app from renderer.js to WindowManager
     */
    loadCalculatorApp(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;

        this.loadApp(windowId, {
            render: () => {
                const container = document.createElement('div');
                container.style.cssText = `
                    width: 100%;
                    height: 100%;
                    background: var(--nebula-bg-primary);
                    padding: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                `;

                container.innerHTML = `
                    <div class="calc-display" style="background: var(--nebula-surface); padding: 16px; border-radius: 8px; text-align: right; font-size: 24px; font-family: monospace; border: 1px solid var(--nebula-border);">0</div>
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; flex: 1;">
                        <button class="calc-btn" data-action="clear" style="background: var(--nebula-surface-hover); border: 1px solid var(--nebula-border); border-radius: 8px; color: var(--nebula-text-primary); font-size: 18px; cursor: pointer;">C</button>
                        <button class="calc-btn" data-action="sign" style="background: var(--nebula-surface-hover); border: 1px solid var(--nebula-border); border-radius: 8px; color: var(--nebula-text-primary); font-size: 18px; cursor: pointer;">±</button>
                        <button class="calc-btn" data-action="percent" style="background: var(--nebula-surface-hover); border: 1px solid var(--nebula-border); border-radius: 8px; color: var(--nebula-text-primary); font-size: 18px; cursor: pointer;">%</button>
                        <button class="calc-btn" data-action="divide" style="background: var(--nebula-primary); border: none; border-radius: 8px; color: white; font-size: 18px; cursor: pointer;">÷</button>
                        <button class="calc-btn" data-value="7" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: 8px; color: var(--nebula-text-primary); font-size: 18px; cursor: pointer;">7</button>
                        <button class="calc-btn" data-value="8" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: 8px; color: var(--nebula-text-primary); font-size: 18px; cursor: pointer;">8</button>
                        <button class="calc-btn" data-value="9" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: 8px; color: var(--nebula-text-primary); font-size: 18px; cursor: pointer;">9</button>
                        <button class="calc-btn" data-action="multiply" style="background: var(--nebula-primary); border: none; border-radius: 8px; color: white; font-size: 18px; cursor: pointer;">×</button>
                        <button class="calc-btn" data-value="4" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: 8px; color: var(--nebula-text-primary); font-size: 18px; cursor: pointer;">4</button>
                        <button class="calc-btn" data-value="5" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: 8px; color: var(--nebula-text-primary); font-size: 18px; cursor: pointer;">5</button>
                        <button class="calc-btn" data-value="6" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: 8px; color: var(--nebula-text-primary); font-size: 18px; cursor: pointer;">6</button>
                        <button class="calc-btn" data-action="subtract" style="background: var(--nebula-primary); border: none; border-radius: 8px; color: white; font-size: 18px; cursor: pointer;">−</button>
                        <button class="calc-btn" data-value="1" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: 8px; color: var(--nebula-text-primary); font-size: 18px; cursor: pointer;">1</button>
                        <button class="calc-btn" data-value="2" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: 8px; color: var(--nebula-text-primary); font-size: 18px; cursor: pointer;">2</button>
                        <button class="calc-btn" data-value="3" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: 8px; color: var(--nebula-text-primary); font-size: 18px; cursor: pointer;">3</button>
                        <button class="calc-btn" data-action="add" style="background: var(--nebula-primary); border: none; border-radius: 8px; color: white; font-size: 18px; cursor: pointer;">+</button>
                        <button class="calc-btn" data-value="0" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: 8px; color: var(--nebula-text-primary); font-size: 18px; cursor: pointer; grid-column: span 2;">0</button>
                        <button class="calc-btn" data-value="." style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: 8px; color: var(--nebula-text-primary); font-size: 18px; cursor: pointer;">.</button>
                        <button class="calc-btn" data-action="equals" style="background: var(--nebula-primary); border: none; border-radius: 8px; color: white; font-size: 18px; cursor: pointer;">=</button>
                    </div>
                `;

                // Add calculator functionality
                let display = container.querySelector('.calc-display');
                let currentValue = '0';
                let previousValue = null;
                let operator = null;
                let waitingForNewValue = false;

                container.addEventListener('click', (e) => {
                    if (e.target.classList.contains('calc-btn')) {
                        const value = e.target.dataset.value;
                        const action = e.target.dataset.action;

                        if (value) {
                            // Number or decimal point
                            if (waitingForNewValue) {
                                currentValue = value;
                                waitingForNewValue = false;
                            } else {
                                currentValue = currentValue === '0' ? value : currentValue + value;
                            }
                            display.textContent = currentValue;
                        } else if (action) {
                            switch (action) {
                                case 'clear':
                                    currentValue = '0';
                                    previousValue = null;
                                    operator = null;
                                    waitingForNewValue = false;
                                    display.textContent = currentValue;
                                    break;
                                case 'equals':
                                    if (operator && previousValue !== null) {
                                        const result = this.calculateResult(previousValue, currentValue, operator);
                                        currentValue = result.toString();
                                        display.textContent = currentValue;
                                        previousValue = null;
                                        operator = null;
                                        waitingForNewValue = true;
                                    }
                                    break;
                                case 'add':
                                case 'subtract':
                                case 'multiply':
                                case 'divide':
                                    if (operator && previousValue !== null && !waitingForNewValue) {
                                        const result = this.calculateResult(previousValue, currentValue, operator);
                                        currentValue = result.toString();
                                        display.textContent = currentValue;
                                    }
                                    previousValue = parseFloat(currentValue);
                                    operator = action;
                                    waitingForNewValue = true;
                                    break;
                            }
                        }
                    }
                });

                return container;
            },
            getTitle: () => 'Calculator',
            getIcon: () => '🧮',
            calculateResult: (prev, curr, op) => {
                const a = parseFloat(prev);
                const b = parseFloat(curr);
                switch (op) {
                    case 'add': return a + b;
                    case 'subtract': return a - b;
                    case 'multiply': return a * b;
                    case 'divide': return b !== 0 ? a / b : 0;
                    default: return b;
                }
            }
        });
    }

    /**
     * Placeholder settings app
     */
    loadSettingsApp(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;

        this.loadApp(windowId, {
            render: () => {
                const container = document.createElement('div');
                container.style.cssText = `
                    width: 100%;
                    height: 100%;
                    background: var(--nebula-bg-primary);
                    padding: 24px;
                    overflow-y: auto;
                `;

                container.innerHTML = `
                    <h1 style="color: var(--nebula-text-primary); margin-bottom: 24px;">Settings</h1>
                    
                    <div style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: 8px; padding: 20px; margin-bottom: 16px;">
                        <h2 style="color: var(--nebula-text-primary); margin-bottom: 16px;">Theme</h2>
                        <button id="themeBtn" style="background: var(--nebula-primary); color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">Cycle Theme</button>
                    </div>
                    
                    <div style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: 8px; padding: 20px; margin-bottom: 16px;">
                        <h2 style="color: var(--nebula-text-primary); margin-bottom: 16px;">App Data</h2>
                        <button id="clearDataBtn" style="background: var(--nebula-danger); color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; margin-right: 10px;">Clear All App Data</button>
                        <button id="saveDataBtn" style="background: var(--nebula-success); color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">Save All States</button>
                        <p style="color: var(--nebula-text-secondary); font-size: 12px; margin-top: 8px;">Clear saved window positions, app states, and session data.</p>
                    </div>
                    
                    <div style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: 8px; padding: 20px;">
                        <h2 style="color: var(--nebula-text-primary); margin-bottom: 16px;">About</h2>
                        <p style="color: var(--nebula-text-secondary);">NebulaDesktop v3.0</p>
                        <p style="color: var(--nebula-text-secondary);">Integrated Window & App Management</p>
                    </div>
                `;

                // Add event listeners
                container.querySelector('#themeBtn').addEventListener('click', () => {
                    if (window.desktop && window.desktop.cycleTheme) {
                        window.desktop.cycleTheme();
                    }
                });

                container.querySelector('#clearDataBtn').addEventListener('click', () => {
                    if (confirm('Clear all saved app data? This will remove window positions, app states, and session data.')) {
                        this.clearAllAppData();
                        alert('All app data cleared successfully!');
                    }
                });

                container.querySelector('#saveDataBtn').addEventListener('click', () => {
                    const saved = this.saveAllStates();
                    alert(`Saved ${saved} app states successfully!`);
                });

                return container;
            },
            getTitle: () => 'Settings',
            getIcon: () => '⚙️'
        });
    }

    // ========== WINDOW LIFECYCLE OVERRIDES ==========
    
    /**
     * Enhanced window creation with app support
     */
    createWindow(options = {}) {
        const windowId = `window-${this.nextId++}`;

        // Default window options
        const config = {
            title: options.title || 'Nebula Window',
            width: options.width || 800,
            height: options.height || 600,
            x: options.x || this.calculateDefaultPosition().x,
            y: options.y || this.calculateDefaultPosition().y,
            resizable: options.resizable !== false,
            maximizable: options.maximizable !== false,
            minimizable: options.minimizable !== false,
            hasTabBar: options.hasTabBar || false,
            ...options
        };

        console.log(`Creating window: ${windowId}`);

        // Create window DOM structure
        const windowElement = this.createWindowElement(windowId, config);
        document.getElementById('desktop').appendChild(windowElement);

        // Store window data
        const windowData = {
            id: windowId,
            element: windowElement,
            config: config,
            isMaximized: false,
            isMinimized: false,
            savedPosition: null,
            savedSize: null,
            tabs: new Map(),
            activeTab: null,
            app: null,
            // APP DATA
            appType: null,
            appInstance: null,
            appConfig: null,
            instanceId: null,
            createdAt: Date.now()
        };

        this.windows.set(windowId, windowData);

        // Set up listeners and resize handles
        this.setupWindowListeners(windowElement, windowId);
        this.focusWindow(windowId);

        console.log(`Created window: ${windowId}`);
        return windowId;
    }
    
    /**
     * Enhanced window closing with app cleanup
     */
    closeWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;

        // APP CLEANUP
        if (windowData.appType && windowData.appConfig) {
            // Save state before cleanup if app supports persistence
            if (windowData.appConfig.persistent && windowData.appInstance) {
                this.saveAppState(windowData);
            }
            
            // Remove from running apps tracking
            const runningApps = this.runningApps.get(windowData.appType);
            const index = runningApps.indexOf(windowId);
            if (index !== -1) {
                runningApps.splice(index, 1);
            }
            
            console.log(`🧹 Cleaned up ${windowData.appType} app (${windowData.instanceId})`);
        }

        // Clean up all tabs
        if (windowData.config.hasTabBar) {
            windowData.tabs.forEach((_, tabId) => {
                this.closeTab(windowId, tabId);
            });
        }

        // Clean up main app
        if (windowData.app && windowData.app.cleanup) {
            windowData.app.cleanup();
        }
        
        // Clean up app instance
        if (windowData.appInstance && windowData.appInstance.cleanup) {
            windowData.appInstance.cleanup();
        }

        // Remove from DOM
        windowData.element.remove();

        // Remove from windows map
        this.windows.delete(windowId);

        // Update active window
        if (this.activeWindow === windowId) {
            this.activeWindow = null;
        }

        console.log(`Closed window: ${windowId}`);
    }

    // ========== STATE PERSISTENCE ==========
    
    /**
     * Save app state to localStorage
     */
    saveAppState(windowData) {
        try {
            const { appType, instanceId, appInstance, isMaximized } = windowData;
            
            if (!instanceId) {
                console.warn(`No instanceId for ${appType}, cannot save state`);
                return;
            }
            
            // Get window state
            const element = windowData.element;
            const windowState = {
                width: parseInt(element.style.width) || windowData.config.width,
                height: parseInt(element.style.height) || windowData.config.height,
                x: parseInt(element.style.left) || windowData.config.x,
                y: parseInt(element.style.top) || windowData.config.y,
                isMaximized: isMaximized
            };
            
            // Get app state if app supports it
            let appState = null;
            if (appInstance && typeof appInstance.getState === 'function') {
                appState = appInstance.getState();
            }
            
            const stateData = {
                appType,
                instanceId,
                windowConfig: windowState,
                appState: appState,
                savedAt: Date.now()
            };
            
            const key = `nebula-window-${appType}-${instanceId}`;
            localStorage.setItem(key, JSON.stringify(stateData));
            console.log(`💾 Saved state for ${appType} (${instanceId})`);
            
        } catch (error) {
            console.warn(`Failed to save app state: ${error.message}`);
        }
    }
    
    /**
     * Load app state from localStorage
     */
    loadAppState(appType, instanceId = null) {
        try {
            if (instanceId) {
                // Load specific instance state
                const key = `nebula-window-${appType}-${instanceId}`;
                const saved = localStorage.getItem(key);
                return saved ? JSON.parse(saved) : null;
            } else {
                // Load most recent state for this app type
                const states = this.getAllAppStates(appType);
                if (states.length > 0) {
                    states.sort((a, b) => b.savedAt - a.savedAt);
                    return states[0];
                }
            }
        } catch (error) {
            console.warn(`Failed to load app state: ${error.message}`);
        }
        return null;
    }
    
    /**
     * Get all saved states for an app type
     */
    getAllAppStates(appType) {
        const states = [];
        const prefix = `nebula-window-${appType}-`;
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(prefix)) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    states.push(data);
                } catch (error) {
                    console.warn(`Invalid state data in ${key}`);
                }
            }
        }
        
        return states;
    }

    // ========== SESSION MANAGEMENT ==========
    
    /**
     * Restore apps on desktop startup - FIXED to prevent duplication
     */
    async restoreSession() {
        console.log('🔄 Restoring previous session...');
        let restored = 0;
        
        // Only restore apps marked for autoRestore and limit quantity
        for (const [appType, config] of this.appRegistry) {
            if (config.autoRestore) {
                const states = this.getAllAppStates(appType);
                
                // Restore only the most recent state for each app type to prevent duplication
                if (states.length > 0) {
                    // Sort by most recent and take only the first one
                    states.sort((a, b) => b.savedAt - a.savedAt);
                    const mostRecent = states[0];
                    
                    try {
                        await this.launchApp(appType, {
                            instanceId: mostRecent.instanceId,
                            restore: true
                        });
                        restored++;
                        // Small delay between restorations
                        await new Promise(resolve => setTimeout(resolve, 200));
                    } catch (error) {
                        console.warn(`Failed to restore ${appType}: ${error.message}`);
                    }
                }
            }
        }
        
        if (restored > 0) {
            console.log(`✅ Restored ${restored} app instances`);
        } else {
            console.log('No apps to restore');
        }
    }
    
    /**
     * Save all currently running app states
     */
    saveAllStates() {
        let saved = 0;
        
        this.windows.forEach((windowData) => {
            if (windowData.appType && windowData.appConfig && windowData.appConfig.persistent) {
                this.saveAppState(windowData);
                saved++;
            }
        });
        
        console.log(`💾 Manually saved ${saved} app states`);
        return saved;
    }
    
    /**
     * Clear all app data - fixes duplication issues
     */
    clearAllAppData() {
        console.log('🧹 Clearing all app data...');
        const toRemove = [];
        
        // Find all nebula app state keys
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('nebula-window-') || key.startsWith('nebula-app-'))) {
                toRemove.push(key);
            }
        }
        
        // Remove all app data
        toRemove.forEach(key => {
            localStorage.removeItem(key);
        });
        
        console.log(`🧹 Cleared ${toRemove.length} saved app states`);
        return toRemove.length;
    }
    
    /**
     * Clean old app states
     */
    cleanupOldStates(maxAge = 7 * 24 * 60 * 60 * 1000) {
        if (this.stateCleanupDone) return; // Prevent multiple cleanups
        
        const cutoff = Date.now() - maxAge;
        const toRemove = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('nebula-window-')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (data.savedAt < cutoff) {
                        toRemove.push(key);
                    }
                } catch (error) {
                    toRemove.push(key);
                }
            }
        }
        
        toRemove.forEach(key => {
            localStorage.removeItem(key);
        });
        
        if (toRemove.length > 0) {
            console.log(`Cleaned up ${toRemove.length} old app states`);
        }
        
        this.stateCleanupDone = true;
    }

    // ========== APP MANAGEMENT UTILITIES ==========
    
    /**
     * Get all running apps (for taskbar, debugging)
     */
    getAllRunningApps() {
        const running = [];
        
        this.windows.forEach((windowData) => {
            if (windowData.appType) {
                running.push({
                    windowId: windowData.id,
                    appType: windowData.appType,
                    instanceId: windowData.instanceId,
                    title: windowData.appInstance?.getTitle?.() || windowData.config.title,
                    icon: windowData.appInstance?.getIcon?.() || windowData.appConfig?.icon || '🪟',
                    isMinimized: windowData.isMinimized,
                    createdAt: windowData.createdAt
                });
            }
        });
        
        return running;
    }
    
    /**
     * Get debug information
     */
    getDebugInfo() {
        const running = this.getAllRunningApps();
        const stateKeys = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('nebula-window-')) {
                stateKeys.push(key);
            }
        }
        
        return {
            totalWindows: this.windows.size,
            runningApps: running.length,
            registeredTypes: Array.from(this.appRegistry.keys()),
            savedStates: stateKeys.length,
            singletonApps: Array.from(this.singletonApps),
            running: running
        };
    }

    // ========== EXISTING WINDOW MANAGER METHODS (unchanged) ==========
    
    createWindowElement(windowId, config) {
        const window = document.createElement('div');
        window.className = 'nebula-window';
        window.id = windowId;
        window.style.cssText = `
            position: absolute;
            width: ${config.width}px;
            height: ${config.height}px;
            left: ${config.x}px;
            top: ${config.y}px;
            z-index: ${this.zIndexCounter++};
        `;

        window.innerHTML = `
            <div class="window-titlebar" data-window-id="${windowId}">
                <div class="window-title">${config.title}</div>
                <div class="window-controls">
                    ${config.minimizable ? `<button class="window-btn minimize" data-action="minimize" data-window-id="${windowId}" title="Minimize"><span class="material-symbols-outlined">minimize</span></button>` : ''}
                    ${config.maximizable ? `<button class="window-btn maximize" data-action="maximize" data-window-id="${windowId}" title="Maximize"><span class="material-symbols-outlined">crop_square</span></button>` : ''}
                    <button class="window-btn close" data-action="close" data-window-id="${windowId}" title="Close"><span class="material-symbols-outlined">close</span></button>
                </div>
            </div>
            
            ${config.hasTabBar ? `
                <div class="window-tabbar" data-window-id="${windowId}">
                    <div class="tab-list"></div>
                    <button class="new-tab-btn" data-window-id="${windowId}"><span class="material-symbols-outlined">add</span></button>
                </div>
            ` : ''}
            
            <div class="window-content" data-window-id="${windowId}">
                <!-- App content goes here -->
            </div>
        `;

        return window;
    }

    loadApp(windowId, app, tabId = null) {
        const windowData = this.windows.get(windowId);
        if (!windowData) {
            console.error(`Window ${windowId} not found`);
            return;
        }

        if (windowData.config.hasTabBar && tabId) {
            this.loadAppInTab(windowId, app, tabId);
        } else {
            this.loadAppInWindow(windowId, app);
        }
    }

    loadAppInWindow(windowId, app) {
        const windowData = this.windows.get(windowId);
        const contentArea = windowData.element.querySelector('.window-content');

        contentArea.innerHTML = '';

        if (app.render) {
            const appContent = app.render();
            contentArea.appendChild(appContent);
        }

        windowData.app = app;

        if (app.getTitle) {
            this.setWindowTitle(windowId, app.getTitle());
        }
    }

    calculateDefaultPosition() {
        const area = this.availableArea || { x: 0, y: 0 };
        const offset = (this.windows.size % 10) * 30;

        return {
            x: area.x + 100 + offset,
            y: area.y + 100 + offset
        };
    }

    focusWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData || windowData.isMinimized) return;

        if (this.activeWindow !== windowId) {
            windowData.element.style.zIndex = this.zIndexCounter++;
            this.activeWindow = windowId;

            requestAnimationFrame(() => {
                this.windows.forEach((data, id) => {
                    if (id !== windowId) {
                        data.element.classList.remove('focused');
                    }
                });
                windowData.element.classList.add('focused');
            });

            console.log(`Focused window: ${windowId}`);
        }
    }

    minimizeWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;

        windowData.element.classList.add('minimizing');

        const handleAnimationEnd = () => {
            windowData.element.classList.add('window-hidden');
            windowData.element.classList.remove('minimizing');
            windowData.isMinimized = true;
            windowData.element.removeEventListener('animationend', handleAnimationEnd);
        };

        windowData.element.addEventListener('animationend', handleAnimationEnd);

        setTimeout(() => {
            if (windowData.isMinimized) return;
            handleAnimationEnd();
        }, 350);

        console.log(`Minimized window: ${windowId}`);
    }

    restoreWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData || !windowData.isMinimized) return;

        windowData.element.classList.remove('window-hidden');
        windowData.element.classList.add('restoring');
        windowData.isMinimized = false;

        setTimeout(() => {
            windowData.element.classList.remove('restoring');
        }, 300);

        this.focusWindow(windowId);

        console.log(`Restored window: ${windowId}`);
    }

    toggleMaximizeWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;

        if (windowData.isMaximized) {
            if (windowData.savedPosition) {
                Object.assign(windowData.element.style, {
                    width: windowData.savedSize.width,
                    height: windowData.savedSize.height,
                    left: windowData.savedPosition.x,
                    top: windowData.savedPosition.y
                });
            }
            windowData.element.classList.remove('maximized');
            windowData.isMaximized = false;
        } else {
            const computedStyle = window.getComputedStyle(windowData.element);
            windowData.savedPosition = {
                x: windowData.element.style.left || computedStyle.left,
                y: windowData.element.style.top || computedStyle.top
            };
            windowData.savedSize = {
                width: windowData.element.style.width || computedStyle.width,
                height: windowData.element.style.height || computedStyle.height
            };

            const desktop = document.querySelector('.desktop');
            const isAssistantPinned = desktop && desktop.classList.contains('assistant-open') && desktop.classList.contains('pinned');

            let maxWidth = '100vw';
            let maxLeft = '0px';

            if (isAssistantPinned) {
                let assistantWidth = 420;

                if (desktop.classList.contains('full-view-25')) {
                    assistantWidth = Math.floor(window.innerWidth * 0.25);
                } else if (desktop.classList.contains('full-view-33')) {
                    assistantWidth = Math.floor(window.innerWidth * 0.333);
                } else if (desktop.classList.contains('full-view-50')) {
                    assistantWidth = Math.floor(window.innerWidth * 0.5);
                }

                const availableWidth = window.innerWidth - assistantWidth;
                maxWidth = availableWidth + 'px';
                maxLeft = '0px';
            }

            Object.assign(windowData.element.style, {
                width: maxWidth,
                height: 'calc(100vh - 50px)',
                left: maxLeft,
                top: '0px'
            });

            windowData.element.classList.add('maximized');
            windowData.isMaximized = true;
        }
    }

    setWindowTitle(windowId, title) {
        const windowData = this.windows.get(windowId);
        if (windowData) {
            windowData.element.querySelector('.window-title').textContent = title;
        }
    }

    setupGlobalListeners() {
        let focusTimeout = null;
        document.addEventListener('mousedown', (e) => {
            if (focusTimeout) {
                clearTimeout(focusTimeout);
            }

            focusTimeout = setTimeout(() => {
                const windowElement = e.target.closest('.nebula-window');
                if (windowElement) {
                    this.focusWindow(windowElement.id);
                }
            }, 0);
        }, { passive: true });

        document.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            const windowId = e.target.dataset.windowId;

            if (!action || !windowId) return;

            e.stopPropagation();

            switch (action) {
                case 'minimize':
                    this.minimizeWindow(windowId);
                    break;
                case 'maximize':
                    this.toggleMaximizeWindow(windowId);
                    break;
                case 'close':
                    this.closeWindow(windowId);
                    break;
            }
        });

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('material-symbols-outlined')) {
                const button = e.target.closest('.window-btn');
                if (button) {
                    button.click();
                }
            }
        });
    }

    setupWindowListeners(windowElement, windowId) {
        const titlebar = windowElement.querySelector('.window-titlebar');
        let isDragging = false;
        let startX, startY, initialX, initialY;
        let animationFrame = null;

        titlebar.addEventListener('mousedown', (e) => {
            if (e.target.closest('.window-controls')) return;

            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;

            const computedStyle = window.getComputedStyle(windowElement);
            initialX = parseInt(computedStyle.left) || 0;
            initialY = parseInt(computedStyle.top) || 0;

            windowElement.classList.add('dragging');
            titlebar.style.cursor = 'grabbing';

            this.focusWindow(windowId);

            document.addEventListener('mousemove', handleDrag, { passive: false });
            document.addEventListener('mouseup', stopDrag);

            e.preventDefault();
            e.stopPropagation();
        });

        const handleDrag = (e) => {
            if (!isDragging) return;

            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
            }

            animationFrame = requestAnimationFrame(() => {
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;

                const newX = initialX + deltaX;
                const newY = initialY + deltaY;

                const maxX = window.innerWidth - 100;
                const maxY = window.innerHeight - 100;
                const minX = -windowElement.offsetWidth + 100;
                const minY = 0;

                const constrainedX = Math.max(minX, Math.min(maxX, newX));
                const constrainedY = Math.max(minY, Math.min(maxY, newY));

                windowElement.style.left = constrainedX + 'px';
                windowElement.style.top = constrainedY + 'px';
            });

            e.preventDefault();
        };

        const stopDrag = (e) => {
            if (!isDragging) return;

            isDragging = false;

            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
                animationFrame = null;
            }

            windowElement.classList.remove('dragging');
            titlebar.style.cursor = '';

            document.removeEventListener('mousemove', handleDrag);
            document.removeEventListener('mouseup', stopDrag);

            e.preventDefault();
        };

        titlebar.addEventListener('dblclick', (e) => {
            if (e.target.closest('.window-controls')) return;
            this.toggleMaximizeWindow(windowId);
        });

        this.addResizeHandles(windowElement, windowId);
    }

    addResizeHandles(windowElement, windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData || !windowData.config.resizable) return;

        const handles = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];

        handles.forEach(direction => {
            const handle = document.createElement('div');
            handle.className = `resize-handle resize-${direction}`;
            handle.dataset.direction = direction;
            windowElement.appendChild(handle);

            this.setupResizeHandle(handle, windowElement, windowId, direction);
        });
    }

    setupResizeHandle(handle, windowElement, windowId, direction) {
        let isResizing = false;
        let startX, startY, startWidth, startHeight, startLeft, startTop;
        let animationFrame = null;

        handle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;

            const rect = windowElement.getBoundingClientRect();
            const computedStyle = window.getComputedStyle(windowElement);

            startWidth = rect.width;
            startHeight = rect.height;
            startLeft = parseInt(computedStyle.left) || 0;
            startTop = parseInt(computedStyle.top) || 0;

            windowElement.classList.add('resizing');
            document.addEventListener('mousemove', handleResize);
            document.addEventListener('mouseup', stopResize);

            e.preventDefault();
            e.stopPropagation();
        });

        const handleResize = (e) => {
            if (!isResizing) return;

            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
            }

            animationFrame = requestAnimationFrame(() => {
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;

                let newWidth = startWidth;
                let newHeight = startHeight;
                let newLeft = startLeft;
                let newTop = startTop;

                if (direction.includes('e')) {
                    newWidth = Math.max(300, startWidth + deltaX);
                }
                if (direction.includes('w')) {
                    newWidth = Math.max(300, startWidth - deltaX);
                    newLeft = startLeft + (startWidth - newWidth);
                }
                if (direction.includes('s')) {
                    newHeight = Math.max(200, startHeight + deltaY);
                }
                if (direction.includes('n')) {
                    newHeight = Math.max(200, startHeight - deltaY);
                    newTop = startTop + (startHeight - newHeight);
                }

                windowElement.style.width = newWidth + 'px';
                windowElement.style.height = newHeight + 'px';
                windowElement.style.left = newLeft + 'px';
                windowElement.style.top = newTop + 'px';
            });

            e.preventDefault();
        };

        const stopResize = () => {
            isResizing = false;

            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
                animationFrame = null;
            }

            windowElement.classList.remove('resizing');
            document.removeEventListener('mousemove', handleResize);
            document.removeEventListener('mouseup', stopResize);
        };
    }

    getAllWindows() {
        return Array.from(this.windows.values());
    }

    getActiveWindow() {
        return this.windows.get(this.activeWindow);
    }

    restoreWindowById(windowId) {
        this.restoreWindow(windowId);
    }

    updateAvailableArea(leftMargin = 0, rightMargin = 0, topMargin = 0, bottomMargin = 50) {
        this.availableArea = {
            x: leftMargin,
            y: topMargin,
            width: window.innerWidth - leftMargin - rightMargin,
            height: window.innerHeight - topMargin - bottomMargin
        };

        this.windows.forEach((windowData, windowId) => {
            if (windowData.isMaximized) {
                this.applyMaximizedSize(windowData);
            }
        });
    }

    applyMaximizedSize(windowData) {
        const area = this.availableArea || {
            x: 0, y: 0,
            width: window.innerWidth,
            height: window.innerHeight - 50
        };

        Object.assign(windowData.element.style, {
            width: area.width + 'px',
            height: area.height + 'px',
            left: area.x + 'px',
            top: area.y + 'px'
        });
    }
}

// Make WindowManager available globally
window.WindowManager = WindowManager;