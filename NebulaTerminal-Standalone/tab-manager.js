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

        // Create terminal instance
        const settings = window.settingsManager.settings;

        const term = new Terminal({
            cursorBlink: settings.cursorBlink,
            cursorStyle: settings.cursorStyle,
            fontFamily: settings.fontFamily,
            fontSize: settings.fontSize,
            lineHeight: 1.2,
            letterSpacing: 0,
            theme: {},
            allowProposedApi: true
        });

        // Load addons
        const fitAddon = new FitAddon.FitAddon();
        const webLinksAddon = new WebLinksAddon.WebLinksAddon();
        const searchAddon = new SearchAddon.SearchAddon();

        term.loadAddon(fitAddon);
        term.loadAddon(webLinksAddon);
        term.loadAddon(searchAddon);

        // Apply theme
        window.themeEngine.applyTheme(term, settings.theme);

        // Open terminal in container
        term.open(tabContainer);
        fitAddon.fit();

        // Create PTY for this tab
        const ptyData = await window.terminal.create();
        const ptyId = ptyData.id;

        console.log(`Tab ${tabId} created with PTY ${ptyId}`);

        // Setup PTY data handler
        window.terminal.onData(ptyId, (data) => {
            term.write(data);
        });

        // Setup terminal input handler
        term.onData((data) => {
            window.terminal.write(ptyId, data);
        });

        // Setup resize handler
        const resizeHandler = () => {
            if (this.activeTabId === tabId) {
                fitAddon.fit();
                window.terminal.resize(ptyId, term.cols, term.rows);
            }
        };
        window.addEventListener('resize', resizeHandler);

        // Create tab object
        const tab = {
            id: tabId,
            title: tabTitle,
            term,
            fitAddon,
            searchAddon,
            ptyId,
            container: tabContainer,
            button: tabButton,
            resizeHandler
        };

        this.tabs.push(tab);

        // Switch to new tab
        this.switchTab(tabId);

        // Fit and notify PTY of size
        fitAddon.fit();
        await window.terminal.resize(ptyId, term.cols, term.rows);

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

            // Update global terminal instance reference for settings modal
            window.terminalInstance = newTab.term;
            window.fitAddon = newTab.fitAddon;

            // Focus terminal
            newTab.term.focus();

            // Fit to ensure correct size
            setTimeout(() => {
                newTab.fitAddon.fit();
                window.terminal.resize(newTab.ptyId, newTab.term.cols, newTab.term.rows);
            }, 10);

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

        // Cleanup
        window.removeEventListener('resize', tab.resizeHandler);
        tab.term.dispose();
        tab.container.remove();
        tab.button.remove();

        // Kill PTY
        await window.terminal.kill(tab.ptyId);

        console.log(`Tab ${tabId} closed`);
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

    // Font size controls for active tab
    increaseFontSize() {
        const activeTab = this.getActiveTab();
        if (activeTab) {
            const currentSize = activeTab.term.options.fontSize;
            activeTab.term.options.fontSize = Math.min(currentSize + 1, 32);
            activeTab.fitAddon.fit();
            window.settingsManager.set('fontSize', activeTab.term.options.fontSize);
        }
    }

    decreaseFontSize() {
        const activeTab = this.getActiveTab();
        if (activeTab) {
            const currentSize = activeTab.term.options.fontSize;
            activeTab.term.options.fontSize = Math.max(currentSize - 1, 8);
            activeTab.fitAddon.fit();
            window.settingsManager.set('fontSize', activeTab.term.options.fontSize);
        }
    }

    resetFontSize() {
        const activeTab = this.getActiveTab();
        if (activeTab) {
            activeTab.term.options.fontSize = 14;
            activeTab.fitAddon.fit();
            window.settingsManager.set('fontSize', 14);
        }
    }
}

// Export TabManager globally
window.TabManager = TabManager;
