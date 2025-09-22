// NebulaApp Single Window Template
// Based on the ImageViewer pattern - perfect for simple, focused applications
// 
// TODO: Replace 'MyApp' with your app name throughout this file
// TODO: Customize the functionality in the marked sections

class NebulaMyApp {
    constructor(/* TODO: Add your constructor parameters here */) {
        // TODO: Initialize your app's data properties
        this.windowId = null;
        // this.myData = null;
        // this.mySettings = {};
        
        this.init();
    }
    
    async init() {
        if (!window.windowManager) {
            console.error('WindowManager not available');
            return;
        }
        
        // TODO: Customize window configuration
        this.windowId = window.windowManager.createWindow({
            title: 'My App', // TODO: Change app title
            width: 800,      // TODO: Adjust default width
            height: 600,     // TODO: Adjust default height
            resizable: true,
            maximizable: true,
            minimizable: true
        });
        
        // Load this app into the window
        window.windowManager.loadApp(this.windowId, this);
        
        console.log(`MyApp initialized with window ${this.windowId}`);
    }
    
    /**
     * Called by WindowManager to render the app's content
     * TODO: This is where you build your app's UI
     */
    render() {
        const container = document.createElement('div');
        container.className = 'myapp-container';
        container.style.cssText = `
            width: 100%;
            height: 100%;
            background: var(--nebula-bg-primary);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            font-family: var(--nebula-font-family);
        `;
        
        // Create main sections
        const toolbar = this.createToolbar();
        const contentArea = this.createContentArea();
        const statusBar = this.createStatusBar();
        
        // Assemble the UI
        container.appendChild(toolbar);
        container.appendChild(contentArea);
        container.appendChild(statusBar);
        
        // TODO: Set up any additional initialization after UI is created
        setTimeout(() => {
            this.setupEventListeners();
            this.loadInitialData();
        }, 0);
        
        return container;
    }
    
    /**
     * Create the toolbar
     * TODO: Customize toolbar buttons and layout
     */
    createToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'myapp-toolbar';
        toolbar.style.cssText = `
            height: 48px;
            background: var(--nebula-surface);
            border-bottom: 1px solid var(--nebula-border);
            display: flex;
            align-items: center;
            padding: 0 16px;
            gap: 8px;
            flex-shrink: 0;
        `;
        
        // TODO: Add your toolbar buttons here
        toolbar.innerHTML = `
            <button class="toolbar-btn" id="action1-btn" title="Action 1">
                <span class="material-symbols-outlined">add</span>
            </button>
            
            <button class="toolbar-btn" id="action2-btn" title="Action 2">
                <span class="material-symbols-outlined">edit</span>
            </button>
            
            <div class="toolbar-separator"></div>
            
            <button class="toolbar-btn" id="settings-btn" title="Settings">
                <span class="material-symbols-outlined">settings</span>
            </button>
            
            <!-- TODO: Add more buttons as needed -->
            
            <div class="toolbar-title" style="margin-left: auto; font-weight: 500; color: var(--nebula-text-primary);">
                My App <!-- TODO: Update toolbar title -->
            </div>
        `;
        
        // Add toolbar styling
        this.addToolbarStyles();
        
        return toolbar;
    }
    
    /**
     * Create the main content area
     * TODO: This is your app's main working area - customize as needed
     */
    createContentArea() {
        const contentArea = document.createElement('div');
        contentArea.className = 'myapp-content';
        contentArea.style.cssText = `
            flex: 1;
            overflow: auto;
            background: var(--nebula-bg-primary);
            padding: 16px;
            position: relative;
        `;
        
        // TODO: Replace this with your actual content
        contentArea.innerHTML = `
            <div style="
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100%;
                flex-direction: column;
                gap: 16px;
                color: var(--nebula-text-secondary);
            ">
                <div style="font-size: 48px;">🚀</div>
                <h2 style="margin: 0; color: var(--nebula-text-primary);">Welcome to My App!</h2>
                <p style="margin: 0; text-align: center; max-width: 400px;">
                    TODO: Replace this placeholder content with your app's functionality.
                    This could be a canvas, form, list, editor, or any other UI elements.
                </p>
                <button id="demo-btn" style="
                    background: var(--nebula-primary);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: var(--nebula-radius-md);
                    cursor: pointer;
                    font-size: 14px;
                ">Demo Action</button>
            </div>
        `;
        
        return contentArea;
    }
    
    /**
     * Create the status bar
     * TODO: Customize status information
     */
    createStatusBar() {
        const statusBar = document.createElement('div');
        statusBar.className = 'myapp-status';
        statusBar.style.cssText = `
            height: 24px;
            background: var(--nebula-surface);
            border-top: 1px solid var(--nebula-border);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 16px;
            font-size: 12px;
            color: var(--nebula-text-secondary);
            flex-shrink: 0;
        `;
        
        // TODO: Update status information
        statusBar.innerHTML = `
            <span class="status-left" id="status-info">Ready</span>
            <span class="status-right" id="status-details">My App v1.0</span>
        `;
        
        return statusBar;
    }
    
    /**
     * Add CSS styles for toolbar buttons
     */
    addToolbarStyles() {
        if (document.querySelector('#myapp-toolbar-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'myapp-toolbar-styles';
        style.textContent = `
            .myapp-toolbar .toolbar-btn {
                width: 36px;
                height: 36px;
                border: 1px solid var(--nebula-border);
                background: var(--nebula-bg-secondary);
                color: var(--nebula-text-primary);
                border-radius: var(--nebula-radius-md);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: var(--nebula-transition);
            }
            
            .myapp-toolbar .toolbar-btn:hover {
                background: var(--nebula-surface-hover);
                border-color: var(--nebula-border-hover);
            }
            
            .myapp-toolbar .toolbar-btn:active {
                background: var(--nebula-surface-active);
            }
            
            .myapp-toolbar .toolbar-separator {
                width: 1px;
                height: 24px;
                background: var(--nebula-border);
                margin: 0 8px;
            }
            
            .myapp-toolbar .material-symbols-outlined {
                font-size: 18px;
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * Set up event listeners
     * TODO: Add your event handlers here
     */
    setupEventListeners() {
        // TODO: Add event listeners for your toolbar buttons
        document.getElementById('action1-btn')?.addEventListener('click', () => {
            this.handleAction1();
        });
        
        document.getElementById('action2-btn')?.addEventListener('click', () => {
            this.handleAction2();
        });
        
        document.getElementById('settings-btn')?.addEventListener('click', () => {
            this.showSettings();
        });
        
        // TODO: Example demo button
        document.getElementById('demo-btn')?.addEventListener('click', () => {
            this.handleDemo();
        });
        
        // TODO: Add keyboard shortcuts if needed
        document.addEventListener('keydown', (e) => {
            // Only handle if this window is focused
            const windowElement = document.getElementById(this.windowId);
            if (!windowElement || !windowElement.contains(document.activeElement)) {
                return;
            }
            
            // TODO: Add your keyboard shortcuts here
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.save();
            }
        });
    }
    
    /**
     * Load initial data when app starts
     * TODO: Load your app's initial data/state
     */
    async loadInitialData() {
        try {
            // TODO: Load data from file system, localStorage, or API
            this.updateStatus('Loading...');
            
            // Simulate loading
            await new Promise(resolve => setTimeout(resolve, 500));
            
            this.updateStatus('Ready');
            console.log('MyApp initial data loaded');
        } catch (error) {
            console.error('Failed to load initial data:', error);
            this.updateStatus('Error loading data');
        }
    }
    
    /**
     * TODO: Implement your app's main actions
     */
    handleAction1() {
        console.log('Action 1 clicked');
        this.updateStatus('Action 1 executed');
        // TODO: Implement your first action
    }
    
    handleAction2() {
        console.log('Action 2 clicked');
        this.updateStatus('Action 2 executed');
        // TODO: Implement your second action
    }
    
    showSettings() {
        console.log('Settings clicked');
        // TODO: Show settings dialog or panel
        alert('Settings dialog would open here');
    }
    
    handleDemo() {
        console.log('Demo action clicked');
        this.updateStatus('Demo action completed');
        // TODO: Replace with actual functionality
    }
    
    save() {
        console.log('Save action triggered');
        this.updateStatus('Saved');
        // TODO: Implement save functionality
    }
    
    /**
     * Update status bar information
     */
    updateStatus(message, details = null) {
        const statusInfo = document.getElementById('status-info');
        const statusDetails = document.getElementById('status-details');
        
        if (statusInfo) statusInfo.textContent = message;
        if (details && statusDetails) statusDetails.textContent = details;
    }
    
    /**
     * Required methods for WindowManager integration
     */
    getTitle() {
        return 'My App'; // TODO: Return dynamic title if needed
    }
    
    getIcon() {
        return '🚀'; // TODO: Change to your app's icon
    }
    
    /**
     * Cleanup when app is closed
     * TODO: Clean up any resources, event listeners, etc.
     */
    cleanup() {
        // TODO: Remove any global event listeners
        // TODO: Clean up any timers or intervals
        // TODO: Save any unsaved data
        
        console.log('MyApp cleanup completed');
    }
}

// Export for use in NebulaDesktop
// TODO: Change class name to match your app
window.NebulaMyApp = NebulaMyApp;
// Register the app with WindowManager
new NebulaMyApp
