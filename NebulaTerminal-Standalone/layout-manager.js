// LayoutManager - Save and Load tab/pane layouts
// Supports localStorage (quick access) and JSON export/import (shareable)

class LayoutManager {
    constructor(tabManager) {
        this.tabManager = tabManager;
    }

    // Serialize current layout to JSON
    serializeLayout() {
        const layout = {
            version: '1.0',
            tabs: [],
            activeTabId: this.tabManager.activeTabId,
            timestamp: new Date().toISOString()
        };

        this.tabManager.tabs.forEach(tab => {
            const tabData = {
                id: tab.id,
                title: tab.title,
                panes: []
            };

            // Serialize each pane
            if (tab.paneManager && tab.paneManager.panes) {
                tab.paneManager.panes.forEach(pane => {
                    tabData.panes.push({
                        id: pane.id,
                        // We can't serialize the terminal content or PTY
                        // But we can save metadata for reconstruction
                        isActive: pane.id === tab.paneManager.activePaneId
                    });
                });
            }

            layout.tabs.push(tabData);
        });

        return layout;
    }

    // Save layout to localStorage
    saveLayout() {
        try {
            const layout = this.serializeLayout();
            localStorage.setItem('nebulaTerminalLayout', JSON.stringify(layout));
            console.log('Layout saved to localStorage');
            return { success: true, message: 'Layout saved successfully!' };
        } catch (error) {
            console.error('Failed to save layout:', error);
            return { success: false, message: `Failed to save layout: ${error.message}` };
        }
    }

    // Load layout from localStorage
    async loadLayout() {
        try {
            const layoutJson = localStorage.getItem('nebulaTerminalLayout');
            if (!layoutJson) {
                return { success: false, message: 'No saved layout found' };
            }

            const layout = JSON.parse(layoutJson);
            await this.applyLayout(layout);

            console.log('Layout loaded from localStorage');
            return { success: true, message: 'Layout loaded successfully!' };
        } catch (error) {
            console.error('Failed to load layout:', error);
            return { success: false, message: `Failed to load layout: ${error.message}` };
        }
    }

    // Export layout to JSON file
    async exportLayout() {
        try {
            const layout = this.serializeLayout();
            const jsonStr = JSON.stringify(layout, null, 2);

            // Create blob and download
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `nebula-layout-${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            console.log('Layout exported to JSON');
            return { success: true, message: 'Layout exported successfully!' };
        } catch (error) {
            console.error('Failed to export layout:', error);
            return { success: false, message: `Failed to export layout: ${error.message}` };
        }
    }

    // Import layout from JSON file
    async importLayout() {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';

            input.onchange = async (e) => {
                try {
                    const file = e.target.files[0];
                    if (!file) {
                        resolve({ success: false, message: 'No file selected' });
                        return;
                    }

                    const text = await file.text();
                    const layout = JSON.parse(text);

                    // Validate layout
                    if (!layout.version || !layout.tabs) {
                        throw new Error('Invalid layout file format');
                    }

                    await this.applyLayout(layout);

                    console.log('Layout imported from JSON');
                    resolve({ success: true, message: 'Layout imported successfully!' });
                } catch (error) {
                    console.error('Failed to import layout:', error);
                    resolve({ success: false, message: `Failed to import layout: ${error.message}` });
                }
            };

            input.click();
        });
    }

    // Apply a layout to the current session
    async applyLayout(layout) {
        // Close all existing tabs except the first one
        const tabsToClose = [...this.tabManager.tabs].slice(1);
        for (const tab of tabsToClose) {
            this.tabManager.closeTab(tab.id);
        }

        // Create tabs based on layout
        for (let i = 0; i < layout.tabs.length; i++) {
            const tabData = layout.tabs[i];

            let tab;
            if (i === 0) {
                // Use the existing first tab
                tab = this.tabManager.tabs[0];
                if (tab) {
                    this.tabManager.updateTabTitle(tab.id, tabData.title);
                }
            } else {
                // Create new tabs
                await this.tabManager.createTab(tabData.title);
                tab = this.tabManager.tabs[this.tabManager.tabs.length - 1];
            }

            // For now, we'll just recreate the number of panes
            // In a full implementation, we'd reconstruct the split layout
            if (tabData.panes && tabData.panes.length > 1) {
                // Create splits to match pane count
                for (let p = 1; p < tabData.panes.length; p++) {
                    if (tab && tab.paneManager) {
                        const activePane = tab.paneManager.getActivePane();
                        if (activePane) {
                            // Alternate between horizontal and vertical splits
                            const direction = p % 2 === 0 ? 'horizontal' : 'vertical';
                            await tab.paneManager.splitPane(activePane.id, direction);
                            await new Promise(resolve => setTimeout(resolve, 100));
                        }
                    }
                }
            }
        }

        // Activate the tab that was active when layout was saved
        if (layout.activeTabId) {
            const targetTab = this.tabManager.tabs.find(t => t.id <= layout.activeTabId);
            if (targetTab) {
                this.tabManager.activateTab(targetTab.id);
            }
        }
    }
}

// Export globally
window.LayoutManager = LayoutManager;
