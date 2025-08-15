// NebulaApp Tabbed Window Template
// Based on the Browser pattern - perfect for multi-document or multi-view applications
// Features the unique vertical tab system with 64x64px icon squares
//
// TODO: Replace 'MyTabbedApp' with your app name throughout this file
// TODO: Customize the tab content and functionality in the marked sections

class NebulaMyTabbedApp {
    constructor(/* TODO: Add your constructor parameters here */) {
        // TODO: Initialize your app's data properties
        this.windowId = null;
        this.tabs = new Map(); // tabId -> tabData
        this.activeTabId = null;
        this.nextTabId = 1;
        // this.appData = {};
        
        this.init();
    }
    
    async init() {
        if (!window.windowManager) {
            console.error('WindowManager not available');
            return;
        }
        
        // Create a window without WindowManager's tab bar (we'll make our own vertical tabs)
        this.windowId = window.windowManager.createWindow({
            title: 'My Tabbed App', // TODO: Change app title
            width: 1200,           // TODO: Adjust width for sidebar + content
            height: 700,           // TODO: Adjust height
            hasTabBar: false,      // We'll create our own vertical tab system
            resizable: true,
            maximizable: true,
            minimizable: true
        });
        
        // Load this app into the window
        window.windowManager.loadApp(this.windowId, this);
        
        // Create the first tab
        this.createTab('Welcome'); // TODO: Customize initial tab
        
        console.log(`MyTabbedApp initialized with window ${this.windowId}`);
    }
    
    /**
     * Called by WindowManager to render the app's content
     */
    render() {
        const container = document.createElement('div');
        container.className = 'mytabbedapp-container';
        container.style.cssText = `
            width: 100%;
            height: 100%;
            display: flex;
            background: var(--nebula-bg-primary);
            overflow: hidden;
            font-family: var(--nebula-font-family);
        `;
        
        container.innerHTML = `
            <!-- Vertical Tab Sidebar -->
            <div class="app-sidebar" id="appSidebar-${this.windowId}">
                <!-- Tab Grid - 2 columns of 64x64px squares (like browser) -->
                <div class="tab-grid" id="tabGrid-${this.windowId}">
                    <!-- Tab squares will be added here -->
                </div>
                
                <!-- Sidebar Controls -->
                <div class="sidebar-controls">
                    <button class="new-tab-btn" id="newTabBtn-${this.windowId}" title="New Tab">
                        <span class="material-symbols-outlined">add</span>
                    </button>
                    <!-- TODO: Add more control buttons if needed -->
                </div>
            </div>
            
            <!-- Main Content Area -->
            <div class="app-main" id="appMain-${this.windowId}">
                <!-- Toolbar -->
                <div class="app-toolbar" id="appToolbar-${this.windowId}">
                    <button class="nav-btn toggle-tabs-btn" id="toggleTabsBtn-${this.windowId}" title="Toggle Tabs Sidebar">
                        <span class="material-symbols-outlined">left_panel_close</span>
                    </button>
                    
                    <!-- TODO: Add your toolbar buttons here -->
                    <button class="nav-btn" id="actionBtn1-${this.windowId}" title="Action 1">
                        <span class="material-symbols-outlined">edit</span>
                    </button>
                    
                    <button class="nav-btn" id="actionBtn2-${this.windowId}" title="Action 2">
                        <span class="material-symbols-outlined">save</span>
                    </button>
                    
                    <div class="toolbar-separator"></div>
                    
                    <button class="nav-btn" id="settingsBtn-${this.windowId}" title="Settings">
                        <span class="material-symbols-outlined">settings</span>
                    </button>
                    
                    <!-- Tab Title Display -->
                    <div class="tab-title-display" id="tabTitle-${this.windowId}" style="
                        margin-left: auto;
                        font-weight: 500;
                        color: var(--nebula-text-primary);
                        padding: 0 16px;
                    ">Welcome</div>
                </div>
                
                <!-- Tab Content Area -->
                <div class="tab-content-area" id="tabContentArea-${this.windowId}">
                    <!-- Active tab content will be shown here -->
                </div>
                
                <!-- Status Bar -->
                <div class="app-status-bar" id="statusBar-${this.windowId}">
                    <span class="status-left" id="statusInfo-${this.windowId}">Ready</span>
                    <span class="status-right" id="statusDetails-${this.windowId}">0 tabs</span>
                </div>
            </div>
        `;
        
        // Add styles and set up functionality
        setTimeout(() => {
            this.addTabbedAppStyles();
            this.setupEventListeners();
            this.updateTabCount();
        }, 0);
        
        return container;
    }
    
    /**
     * Create a new tab
     * TODO: Customize tab creation for your app's needs
     */
    createTab(title = 'New Tab', data = null) {
        const tabId = `tab-${this.nextTabId++}`;
        
        // TODO: Customize tab data structure
        const tabData = {
            id: tabId,
            title: title,
            icon: '📄', // TODO: Use appropriate icon for your content type
            data: data,
            content: null,
            isModified: false,
            // TODO: Add any other properties your tabs need
        };
        
        this.tabs.set(tabId, tabData);
        
        // Create the visual tab element (64x64px square)
        this.createTabElement(tabData);
        
        // Create the tab content
        this.createTabContent(tabData);
        
        // Switch to this tab
        this.switchToTab(tabId);
        
        this.updateTabCount();
        return tabId;
    }
    
    /**
     * Create the visual tab element (64x64px square like browser tabs)
     */
    createTabElement(tabData) {
        const tabGrid = document.getElementById(`tabGrid-${this.windowId}`);
        if (!tabGrid) return;
        
        const tabElement = document.createElement('div');
        tabElement.className = 'tab-square';
        tabElement.dataset.tabId = tabData.id;
        tabElement.title = tabData.title; // Tooltip
        
        // TODO: Customize tab appearance based on your content type
        tabElement.innerHTML = `
            <div class="tab-icon-large">${tabData.icon}</div>
            <button class="tab-close-btn" title="Close tab">
                <span class="material-symbols-outlined">close</span>
            </button>
            <div class="tab-modified-indicator" style="display: none;"></div>
        `;
        
        tabGrid.appendChild(tabElement);
        
        // Store reference
        tabData.element = tabElement;
        
        // Add click handlers
        tabElement.addEventListener('click', (e) => {
            if (!e.target.closest('.tab-close-btn')) {
                this.switchToTab(tabData.id);
            }
        });
        
        tabElement.querySelector('.tab-close-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeTab(tabData.id);
        });
    }
    
    /**
     * Create content for a tab
     * TODO: This is where you create the actual content for each tab
     */
    createTabContent(tabData) {
        const contentContainer = document.createElement('div');
        contentContainer.className = 'tab-content';
        contentContainer.dataset.tabId = tabData.id;
        contentContainer.style.cssText = `
            width: 100%;
            height: 100%;
            padding: 16px;
            overflow: auto;
            display: none; /* Hidden by default, shown when active */
        `;
        
        // TODO: Replace this with your actual tab content
        contentContainer.innerHTML = `
            <div style="
                max-width: 800px;
                margin: 0 auto;
            ">
                <h2 style="color: var(--nebula-text-primary); margin-top: 0;">
                    ${tabData.title}
                </h2>
                
                <div style="
                    background: var(--nebula-surface);
                    border: 1px solid var(--nebula-border);
                    border-radius: var(--nebula-radius-md);
                    padding: 24px;
                    margin: 16px 0;
                ">
                    <p style="color: var(--nebula-text-secondary); margin: 0 0 16px 0;">
                        TODO: Replace this with your actual tab content. This could be:
                    </p>
                    <ul style="color: var(--nebula-text-secondary); margin: 0; padding-left: 20px;">
                        <li>A text editor or code editor</li>
                        <li>An image or document viewer</li>
                        <li>A form or data entry interface</li>
                        <li>A chat or messaging interface</li>
                        <li>Any other content specific to your app</li>
                    </ul>
                </div>
                
                <!-- TODO: Add your actual content elements here -->
                <div style="
                    background: var(--nebula-bg-secondary);
                    border-radius: var(--nebula-radius-md);
                    padding: 16px;
                    margin: 16px 0;
                ">
                    <h4 style="color: var(--nebula-text-primary); margin: 0 0 12px 0;">Sample Content Area</h4>
                    <textarea id="content-${tabData.id}" style="
                        width: 100%;
                        height: 200px;
                        background: var(--nebula-bg-primary);
                        border: 1px solid var(--nebula-border);
                        border-radius: var(--nebula-radius-sm);
                        padding: 12px;
                        color: var(--nebula-text-primary);
                        font-family: monospace;
                        resize: vertical;
                    " placeholder="Enter content for ${tabData.title}..."></textarea>
                </div>
                
                <div style="display: flex; gap: 8px; margin-top: 16px;">
                    <button class="action-btn" data-action="save" data-tab="${tabData.id}" style="
                        background: var(--nebula-primary);
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: var(--nebula-radius-md);
                        cursor: pointer;
                    ">Save</button>
                    
                    <button class="action-btn" data-action="export" data-tab="${tabData.id}" style="
                        background: var(--nebula-success);
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: var(--nebula-radius-md);
                        cursor: pointer;
                    ">Export</button>
                    
                    <!-- TODO: Add more action buttons as needed -->
                </div>
            </div>
        `;
        
        // Store content reference
        tabData.content = contentContainer;
        
        // Add to content area
        const contentArea = document.getElementById(`tabContentArea-${this.windowId}`);
        if (contentArea) {
            contentArea.appendChild(contentContainer);
        }
        
        // Set up content-specific event listeners
        this.setupTabContentListeners(tabData);
    }
    
    /**
     * Set up event listeners for tab content
     * TODO: Add handlers for your tab's interactive elements
     */
    setupTabContentListeners(tabData) {
        const content = tabData.content;
        
        // Handle content changes to mark tab as modified
        const textarea = content.querySelector(`#content-${tabData.id}`);
        if (textarea) {
            textarea.addEventListener('input', () => {
                this.markTabModified(tabData.id, true);
            });
        }
        
        // Handle action buttons
        content.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                const tabId = btn.dataset.tab;
                this.handleTabAction(action, tabId);
            });
        });
    }
    
    /**
     * Switch to a different tab
     */
    switchToTab(tabId) {
        const tabData = this.tabs.get(tabId);
        if (!tabData) return;
        
        // Hide all tab contents
        document.querySelectorAll(`#tabContentArea-${this.windowId} .tab-content`).forEach(content => {
            content.style.display = 'none';
        });
        
        // Remove active class from all tabs
        document.querySelectorAll(`#tabGrid-${this.windowId} .tab-square`).forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Show selected tab content
        if (tabData.content) {
            tabData.content.style.display = 'block';
        }
        
        // Mark tab as active
        if (tabData.element) {
            tabData.element.classList.add('active');
        }
        
        // Update active tab ID
        this.activeTabId = tabId;
        
        // Update tab title display
        const titleDisplay = document.getElementById(`tabTitle-${this.windowId}`);
        if (titleDisplay) {
            titleDisplay.textContent = tabData.title;
        }
        
        // Update window title
        if (window.windowManager) {
            window.windowManager.setWindowTitle(this.windowId, `My Tabbed App - ${tabData.title}`);
        }
        
        console.log(`Switched to tab: ${tabData.title}`);
    }
    
    /**
     * Close a tab
     */
    closeTab(tabId) {
        const tabData = this.tabs.get(tabId);
        if (!tabData) return;
        
        // Check if tab has unsaved changes
        if (tabData.isModified) {
            if (!confirm(`"${tabData.title}" has unsaved changes. Close anyway?`)) {
                return;
            }
        }
        
        // Remove tab element
        if (tabData.element) {
            tabData.element.remove();
        }
        
        // Remove tab content
        if (tabData.content) {
            tabData.content.remove();
        }
        
        // Remove from tabs map
        this.tabs.delete(tabId);
        
        // If this was the active tab, switch to another
        if (this.activeTabId === tabId) {
            const remainingTabs = Array.from(this.tabs.keys());
            if (remainingTabs.length > 0) {
                this.switchToTab(remainingTabs[0]);
            } else {
                this.activeTabId = null;
                // Create a welcome tab if no tabs remain
                this.createTab('Welcome');
            }
        }
        
        this.updateTabCount();
        console.log(`Closed tab: ${tabData.title}`);
    }
    
    /**
     * Mark a tab as modified or unmodified
     */
    markTabModified(tabId, isModified) {
        const tabData = this.tabs.get(tabId);
        if (!tabData) return;
        
        tabData.isModified = isModified;
        
        // Update visual indicator
        const indicator = tabData.element?.querySelector('.tab-modified-indicator');
        if (indicator) {
            indicator.style.display = isModified ? 'block' : 'none';
        }
        
        // Update title display with asterisk
        const titleDisplay = document.getElementById(`tabTitle-${this.windowId}`);
        if (titleDisplay && tabId === this.activeTabId) {
            titleDisplay.textContent = tabData.title + (isModified ? ' *' : '');
        }
    }
    
    /**
     * Handle tab-specific actions
     * TODO: Implement actions for your tab content
     */
    handleTabAction(action, tabId) {
        const tabData = this.tabs.get(tabId);
        if (!tabData) return;
        
        switch (action) {
            case 'save':
                // TODO: Implement save functionality
                console.log(`Saving tab: ${tabData.title}`);
                this.markTabModified(tabId, false);
                this.updateStatus('Saved');
                break;
                
            case 'export':
                // TODO: Implement export functionality
                console.log(`Exporting tab: ${tabData.title}`);
                this.updateStatus('Exported');
                break;
                
            // TODO: Add more actions as needed
            default:
                console.log(`Unknown action: ${action}`);
        }
    }
    
    /**
     * Toggle sidebar visibility
     */
    toggleSidebar() {
        const sidebar = document.getElementById(`appSidebar-${this.windowId}`);
        const toggleBtn = document.getElementById(`toggleTabsBtn-${this.windowId}`);
        const icon = toggleBtn?.querySelector('.material-symbols-outlined');
        
        if (sidebar && icon) {
            if (!sidebar.classList.contains('collapsed')) {
                sidebar.classList.add('collapsed');
                icon.textContent = 'left_panel_open';
                toggleBtn.title = 'Show Tabs Sidebar';
            } else {
                sidebar.classList.remove('collapsed');
                icon.textContent = 'left_panel_close';
                toggleBtn.title = 'Hide Tabs Sidebar';
            }
        }
    }
    
    /**
     * Update tab count in status bar
     */
    updateTabCount() {
        const statusDetails = document.getElementById(`statusDetails-${this.windowId}`);
        if (statusDetails) {
            const count = this.tabs.size;
            statusDetails.textContent = `${count} tab${count !== 1 ? 's' : ''}`;
        }
    }
    
    /**
     * Update status bar
     */
    updateStatus(message) {
        const statusInfo = document.getElementById(`statusInfo-${this.windowId}`);
        if (statusInfo) {
            statusInfo.textContent = message;
        }
    }
    
    /**
     * Set up event listeners for the app
     */
    setupEventListeners() {
        // New tab button
        document.getElementById(`newTabBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.createTab(`Tab ${this.nextTabId}`);
        });
        
        // Toggle sidebar button
        document.getElementById(`toggleTabsBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.toggleSidebar();
        });
        
        // TODO: Add your toolbar button handlers
        document.getElementById(`actionBtn1-${this.windowId}`)?.addEventListener('click', () => {
            this.handleToolbarAction('action1');
        });
        
        document.getElementById(`actionBtn2-${this.windowId}`)?.addEventListener('click', () => {
            this.handleToolbarAction('action2');
        });
        
        document.getElementById(`settingsBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.showSettings();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            const windowElement = document.getElementById(this.windowId);
            if (!windowElement || !windowElement.contains(document.activeElement)) {
                return;
            }
            
            // TODO: Add your keyboard shortcuts
            if (e.ctrlKey && e.key === 't') {
                e.preventDefault();
                this.createTab(`Tab ${this.nextTabId}`);
            }
            
            if (e.ctrlKey && e.key === 'w') {
                e.preventDefault();
                if (this.activeTabId) {
                    this.closeTab(this.activeTabId);
                }
            }
        });
    }
    
    /**
     * Handle toolbar actions
     * TODO: Implement your toolbar functionality
     */
    handleToolbarAction(action) {
        switch (action) {
            case 'action1':
                console.log('Toolbar action 1');
                this.updateStatus('Action 1 executed');
                break;
            case 'action2':
                console.log('Toolbar action 2');
                this.updateStatus('Action 2 executed');
                break;
            default:
                console.log(`Unknown toolbar action: ${action}`);
        }
    }
    
    /**
     * Show settings
     * TODO: Implement settings dialog
     */
    showSettings() {
        console.log('Settings clicked');
        alert('Settings dialog would open here');
    }
    
    /**
     * Add CSS styles for the tabbed interface
     */
    addTabbedAppStyles() {
        if (document.querySelector('#mytabbedapp-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'mytabbedapp-styles';
        style.textContent = `
            /* Sidebar Styles */
            .app-sidebar {
                width: 144px;
                background: var(--nebula-surface);
                border-right: 1px solid var(--nebula-border);
                display: flex;
                flex-direction: column;
                flex-shrink: 0;
                transition: var(--nebula-transition);
            }
            
            .app-sidebar.collapsed {
                width: 0;
                border-right: none;
                overflow: hidden;
            }
            
            /* Tab Grid - 2 columns of 64x64px squares */
            .tab-grid {
                flex: 1;
                padding: 8px;
                display: grid;
                grid-template-columns: repeat(2, 64px);
                gap: 8px;
                justify-content: center;
                align-content: start;
                overflow-y: auto;
            }
            
            /* Tab Square (64x64px) */
            .tab-square {
                width: 64px;
                height: 64px;
                background: var(--nebula-bg-secondary);
                border: 1px solid var(--nebula-border);
                border-radius: var(--nebula-radius-md);
                cursor: pointer;
                transition: var(--nebula-transition);
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
                user-select: none;
            }
            
            .tab-square:hover {
                background: var(--nebula-surface-hover);
                border-color: var(--nebula-border-hover);
                transform: scale(1.05);
            }
            
            .tab-square.active {
                background: var(--nebula-surface-elevated);
                border-color: var(--nebula-primary);
                box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.3);
            }
            
            .tab-icon-large {
                font-size: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .tab-close-btn {
                position: absolute;
                bottom: 2px;
                right: 2px;
                width: 20px;
                height: 20px;
                border: none;
                background: var(--nebula-danger);
                color: white;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: var(--nebula-transition);
                z-index: 20;
            }
            
            .tab-square:hover .tab-close-btn {
                opacity: 1;
            }
            
            .tab-modified-indicator {
                position: absolute;
                top: 2px;
                right: 2px;
                width: 8px;
                height: 8px;
                background: var(--nebula-warning);
                border-radius: 50%;
            }
            
            /* Sidebar Controls */
            .sidebar-controls {
                padding: 8px;
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .new-tab-btn {
                width: 64px;
                height: 32px;
                background: var(--nebula-surface-hover);
                border: 1px dashed var(--nebula-border);
                color: var(--nebula-primary);
                border-radius: var(--nebula-radius-md);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto;
                transition: var(--nebula-transition);
            }
            
            .new-tab-btn:hover {
                background: var(--nebula-surface-active);
                border-color: var(--nebula-primary);
            }
            
            /* Main Area */
            .app-main {
                flex: 1;
                display: flex;
                flex-direction: column;
                background: var(--nebula-bg-primary);
            }
            
            /* Toolbar */
            .app-toolbar {
                height: 52px;
                background: var(--nebula-surface);
                border-bottom: 1px solid var(--nebula-border);
                display: flex;
                align-items: center;
                padding: 0 16px;
                gap: 8px;
            }
            
            .nav-btn {
                width: 40px;
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
            
            .nav-btn:hover {
                background: var(--nebula-surface-hover);
                border-color: var(--nebula-border-hover);
            }
            
            .toolbar-separator {
                width: 1px;
                height: 24px;
                background: var(--nebula-border);
                margin: 0 8px;
            }
            
            /* Content Area */
            .tab-content-area {
                flex: 1;
                overflow: hidden;
                position: relative;
            }
            
            /* Status Bar */
            .app-status-bar {
                height: 24px;
                background: var(--nebula-surface);
                border-top: 1px solid var(--nebula-border);
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 16px;
                font-size: 12px;
                color: var(--nebula-text-secondary);
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * Required methods for WindowManager integration
     */
    getTitle() {
        const activeTab = this.tabs.get(this.activeTabId);
        return activeTab ? `My Tabbed App - ${activeTab.title}` : 'My Tabbed App';
    }
    
    getIcon() {
        return '📑'; // TODO: Change to your app's icon
    }
    
    /**
     * Cleanup when app is closed
     */
    cleanup() {
        // TODO: Save any unsaved data from all tabs
        this.tabs.forEach(tabData => {
            if (tabData.isModified) {
                console.warn(`Tab "${tabData.title}" has unsaved changes`);
            }
        });
        
        console.log('MyTabbedApp cleanup completed');
    }
}

// Export for use in NebulaDesktop
// TODO: Change class name to match your app
window.NebulaMyTabbedApp = NebulaMyTabbedApp;