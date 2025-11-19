// TabManager - Manages multiple terminal tabs
// Part of Nebula Terminal v3.0 - Ultimate Customizable Terminal

class TabManager {
    constructor() {
        this.tabs = [];
        this.activeTabId = null;
        this.nextTabId = 1;
        this.tabListElement = document.getElementById('tab-list');
        this.tabsContainerElement = document.getElementById('tabs-container');
        this.newTabButton = document.getElementById('new-tab-btn');
    }

    init() {
        // Setup new tab button
        if (this.newTabButton) {
            this.newTabButton.addEventListener('click', () => this.createTab());
        }

        // Setup keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+T - New tab
            if (e.ctrlKey && e.key === 't') {
                e.preventDefault();
                this.createTab();
            }

            // Ctrl+W - Close tab
            if (e.ctrlKey && e.key === 'w') {
                e.preventDefault();
                this.closeTab(this.activeTabId);
            }

            // Ctrl+Tab - Next tab
            if (e.ctrlKey && e.key === 'Tab') {
                e.preventDefault();
                this.switchToNextTab();
            }

            // Ctrl+Shift+Tab - Previous tab
            if (e.ctrlKey && e.shiftKey && e.key === 'Tab') {
                e.preventDefault();
                this.switchToPreviousTab();
            }

            // Ctrl+1-9 - Switch to tab by number
            if (e.ctrlKey && e.key >= '1' && e.key <= '9') {
                e.preventDefault();
                const tabIndex = parseInt(e.key) - 1;
                if (this.tabs[tabIndex]) {
                    this.switchTab(this.tabs[tabIndex].id);
                }
            }

            // Ctrl+Shift+H - Split pane horizontally
            if (e.ctrlKey && e.shiftKey && e.key === 'H') {
                e.preventDefault();
                const activeTab = this.getActiveTab();
                if (activeTab && activeTab.paneManager) {
                    const activePane = activeTab.paneManager.getActivePane();
                    if (activePane) {
                        activeTab.paneManager.splitPane(activePane.id, 'horizontal');
                    }
                }
            }

            // Ctrl+Shift+V - Split pane vertically
            if (e.ctrlKey && e.shiftKey && e.key === 'V') {
                e.preventDefault();
                const activeTab = this.getActiveTab();
                if (activeTab && activeTab.paneManager) {
                    const activePane = activeTab.paneManager.getActivePane();
                    if (activePane) {
                        activeTab.paneManager.splitPane(activePane.id, 'vertical');
                    }
                }
            }

            // Ctrl+Shift+W - Close pane
            if (e.ctrlKey && e.shiftKey && e.key === 'W') {
                e.preventDefault();
                const activeTab = this.getActiveTab();
                if (activeTab && activeTab.paneManager) {
                    const activePane = activeTab.paneManager.getActivePane();
                    if (activePane) {
                        activeTab.paneManager.closePane(activePane.id);
                    }
                }
            }
        });

        // Create initial tab
        this.createTab();

        console.log('TabManager initialized');
    }

    async createTab(title = null) {
        const tabId = this.nextTabId++;
        const tabTitle = title || `Terminal ${tabId}`;

        // Create tab container
        const tabContainer = document.createElement('div');
        tabContainer.id = `tab-${tabId}`;
        tabContainer.className = 'terminal-tab';
        this.tabsContainerElement.appendChild(tabContainer);

        // Create tab button
        const tabButton = document.createElement('div');
        tabButton.className = 'tab-button';
        tabButton.dataset.tabId = tabId;
        tabButton.innerHTML = `
            <span class="tab-title">${tabTitle}</span>
            <button class="tab-close" title="Close tab">×</button>
        `;

        // Tab button click - switch to this tab
        tabButton.addEventListener('click', (e) => {
            if (!e.target.classList.contains('tab-close')) {
                this.switchTab(tabId);
            }
        });

        // Close button click
        const closeBtn = tabButton.querySelector('.tab-close');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeTab(tabId);
        });

        // Add drag and drop support
        this.setupDragAndDrop(tabButton, tabId);

        this.tabListElement.appendChild(tabButton);

        // Create pane manager for this tab
        const paneManager = new PaneManager(tabContainer, tabId);
        await paneManager.init();

        console.log(`Tab ${tabId} created with pane support`);

        // Create tab object
        const tab = {
            id: tabId,
            title: tabTitle,
            paneManager,
            container: tabContainer,
            button: tabButton
        };

        this.tabs.push(tab);

        // Switch to new tab
        this.switchTab(tabId);

        return tab;
    }

    switchTab(tabId) {
        // Deactivate current tab
        if (this.activeTabId !== null) {
            const currentTab = this.getTab(this.activeTabId);
            if (currentTab) {
                currentTab.container.classList.remove('active');
                currentTab.button.classList.remove('active');
            }
        }

        // Activate new tab
        const newTab = this.getTab(tabId);
        if (newTab) {
            newTab.container.classList.add('active');
            newTab.button.classList.add('active');
            this.activeTabId = tabId;

            // Focus active pane in the tab
            const activePane = newTab.paneManager.getActivePane();
            if (activePane) {
                newTab.paneManager.focusPane(activePane.id);

                // Update global terminal instance reference for settings modal
                window.terminalInstance = activePane.term;
                window.fitAddon = activePane.fitAddon;

                // Fit all panes to ensure correct size
                setTimeout(() => {
                    newTab.paneManager.getAllPanes().forEach(pane => {
                        pane.fitAddon.fit();
                        window.terminal.resize(pane.ptyId, pane.term.cols, pane.term.rows);
                    });
                }, 10);
            }

            // Scroll tab button into view
            newTab.button.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        }
    }

    switchToNextTab() {
        const currentIndex = this.tabs.findIndex(tab => tab.id === this.activeTabId);
        const nextIndex = (currentIndex + 1) % this.tabs.length;
        this.switchTab(this.tabs[nextIndex].id);
    }

    switchToPreviousTab() {
        const currentIndex = this.tabs.findIndex(tab => tab.id === this.activeTabId);
        const prevIndex = (currentIndex - 1 + this.tabs.length) % this.tabs.length;
        this.switchTab(this.tabs[prevIndex].id);
    }

    async closeTab(tabId) {
        const tab = this.getTab(tabId);
        if (!tab) return;

        // Don't close if it's the last tab
        if (this.tabs.length === 1) {
            console.log('Cannot close last tab');
            return;
        }

        // Remove tab from array
        const tabIndex = this.tabs.findIndex(t => t.id === tabId);
        this.tabs.splice(tabIndex, 1);

        // If closing active tab, switch to another tab
        if (this.activeTabId === tabId) {
            // Switch to previous tab if available, otherwise next
            const newActiveTab = this.tabs[Math.max(0, tabIndex - 1)];
            this.switchTab(newActiveTab.id);
        }

        // Cleanup all panes in the tab
        const panes = tab.paneManager.getAllPanes();
        for (const pane of panes) {
            window.removeEventListener('resize', pane.resizeHandler);
            pane.term.dispose();
            await window.terminal.kill(pane.ptyId);
        }

        tab.container.remove();
        tab.button.remove();

        console.log(`Tab ${tabId} closed with ${panes.length} pane(s)`);
    }

    getTab(tabId) {
        return this.tabs.find(tab => tab.id === tabId);
    }

    getActiveTab() {
        return this.getTab(this.activeTabId);
    }

    updateTabTitle(tabId, newTitle) {
        const tab = this.getTab(tabId);
        if (tab) {
            tab.title = newTitle;
            const titleElement = tab.button.querySelector('.tab-title');
            if (titleElement) {
                titleElement.textContent = newTitle;
            }
        }
    }

    setupDragAndDrop(tabButton, tabId) {
        // Make tab draggable
        tabButton.draggable = true;

        tabButton.addEventListener('dragstart', (e) => {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', tabId);
            tabButton.style.opacity = '0.5';
        });

        tabButton.addEventListener('dragend', (e) => {
            tabButton.style.opacity = '1';
        });

        tabButton.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });

        tabButton.addEventListener('drop', (e) => {
            e.preventDefault();
            const draggedTabId = parseInt(e.dataTransfer.getData('text/plain'));
            this.reorderTabs(draggedTabId, tabId);
        });
    }

    reorderTabs(draggedTabId, targetTabId) {
        if (draggedTabId === targetTabId) return;

        const draggedIndex = this.tabs.findIndex(t => t.id === draggedTabId);
        const targetIndex = this.tabs.findIndex(t => t.id === targetTabId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        // Reorder tabs array
        const [draggedTab] = this.tabs.splice(draggedIndex, 1);
        this.tabs.splice(targetIndex, 0, draggedTab);

        // Reorder DOM buttons
        const draggedButton = draggedTab.button;
        const targetButton = this.getTab(targetTabId).button;

        if (draggedIndex < targetIndex) {
            targetButton.after(draggedButton);
        } else {
            targetButton.before(draggedButton);
        }

        console.log(`Reordered tab ${draggedTabId} to position of tab ${targetTabId}`);
    }

    // Font size controls for active pane
    increaseFontSize() {
        const activeTab = this.getActiveTab();
        if (activeTab && activeTab.paneManager) {
            activeTab.paneManager.increaseFontSize();
        }
    }

    decreaseFontSize() {
        const activeTab = this.getActiveTab();
        if (activeTab && activeTab.paneManager) {
            activeTab.paneManager.decreaseFontSize();
        }
    }

    resetFontSize() {
        const activeTab = this.getActiveTab();
        if (activeTab && activeTab.paneManager) {
            activeTab.paneManager.resetFontSize();
        }
    }
}

// Export TabManager globally
window.TabManager = TabManager;
