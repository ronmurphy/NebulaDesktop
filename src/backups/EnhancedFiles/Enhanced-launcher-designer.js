// Launcher Designer - Drag-and-drop launcher customization tool
class LauncherDesigner {
    constructor() {
        this.windowId = null;
        this.currentTheme = this.loadLauncherTheme();
        this.availableApps = this.getAvailableApps();
        this.draggedElement = null;
        this.init();
    }

    init() {
        if (!window.windowManager) {
            console.error('WindowManager not available');
            return;
        }

        // Create launcher designer window
        this.windowId = window.windowManager.createWindow({
            title: '🎨 Launcher Designer',
            icon: '🎨',
            width: 1200,
            height: 800,
            resizable: true,
            maximizable: true,
            minimizable: true
        });

        // Load launcher designer into window
        window.windowManager.loadApp(this.windowId, this);

        console.log(`Launcher Designer initialized with window ${this.windowId}`);
    }

    loadLauncherTheme() {
        const saved = localStorage.getItem('nebula-launcher-theme');
        if (saved) {
            return JSON.parse(saved);
        }

        // Default launcher theme
        return {
            name: 'Default',
            layout: 'grid',
            columns: 4,
            rows: 3,
            iconSize: 'medium',
            spacing: 'normal',
            background: 'blur',
            borderRadius: 'medium',
            apps: [
                { id: 'browser', position: { row: 0, col: 0 }, visible: true },
                { id: 'filemanager', position: { row: 0, col: 1 }, visible: true },
                { id: 'localfilebrowser', position: { row: 0, col: 2 }, visible: true },
                { id: 'settings', position: { row: 0, col: 3 }, visible: true },
                { id: 'terminal', position: { row: 1, col: 0 }, visible: true },
                { id: 'assistant', position: { row: 1, col: 1 }, visible: true },
                { id: 'adblocker', position: { row: 1, col: 2 }, visible: true },
                { id: 'enhanced-assistant', position: { row: 1, col: 3 }, visible: true }
            ]
        };
    }

    saveLauncherTheme() {
        localStorage.setItem('nebula-launcher-theme', JSON.stringify(this.currentTheme));
        this.applyThemeToLauncher();
    }

    getAvailableApps() {
        return [
            { id: 'browser', name: 'Browser', icon: '🌐', description: 'Web browser with vertical tabs' },
            { id: 'filemanager', name: 'File Manager', icon: '📁', description: 'System file manager' },
            { id: 'localfilebrowser', name: 'Local Storage', icon: '💾', description: 'Browser storage file manager' },
            { id: 'settings', name: 'Settings', icon: '⚙️', description: 'System settings and preferences' },
            { id: 'terminal', name: 'Terminal', icon: '💻', description: 'Command line interface' },
            { id: 'assistant', name: 'Assistant', icon: '🤖', description: 'AI assistant' },
            { id: 'adblocker', name: 'AdBlocker', icon: '🛡️', description: 'Advertisement blocker' },
            { id: 'enhanced-assistant', name: 'AI Assistant Pro', icon: '✨', description: 'Enhanced AI assistant with art and coding' }
        ];
    }

    render() {
        const container = document.createElement('div');
        container.className = 'launcher-designer-container';
        container.style.cssText = `
            width: 100%;
            height: 100%;
            display: flex;
            background: var(--nebula-bg-primary);
            color: var(--nebula-text-primary);
            font-family: inherit;
            overflow: hidden;
        `;

        container.innerHTML = `
            <div class="designer-sidebar" style="
                width: 300px;
                background: var(--nebula-surface);
                border-right: 1px solid var(--nebula-border);
                display: flex;
                flex-direction: column;
                overflow-y: auto;
            ">
                <div class="sidebar-header" style="
                    padding: var(--nebula-space-lg);
                    border-bottom: 1px solid var(--nebula-border);
                ">
                    <h2 style="margin: 0 0 var(--nebula-space-sm) 0; font-size: 20px; font-weight: 600;">Launcher Designer</h2>
                    <p style="margin: 0; color: var(--nebula-text-secondary); font-size: 14px;">Customize your launcher layout</p>
                </div>

                <div class="design-controls" style="padding: var(--nebula-space-lg);">
                    <div class="control-group" style="margin-bottom: var(--nebula-space-lg);">
                        <h3 style="margin: 0 0 var(--nebula-space-md) 0; font-size: 16px; font-weight: 600;">Layout</h3>
                        <div class="layout-options" style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--nebula-space-sm);">
                            <button class="layout-btn ${this.currentTheme.layout === 'grid' ? 'active' : ''}" data-layout="grid" style="
                                padding: var(--nebula-space-md);
                                border: 1px solid var(--nebula-border);
                                border-radius: var(--nebula-radius-md);
                                background: ${this.currentTheme.layout === 'grid' ? 'var(--nebula-primary)' : 'var(--nebula-surface)'};
                                color: ${this.currentTheme.layout === 'grid' ? 'white' : 'var(--nebula-text-primary)'};
                                cursor: pointer;
                                transition: all 0.2s ease;
                            ">Grid</button>
                            <button class="layout-btn ${this.currentTheme.layout === 'list' ? 'active' : ''}" data-layout="list" style="
                                padding: var(--nebula-space-md);
                                border: 1px solid var(--nebula-border);
                                border-radius: var(--nebula-radius-md);
                                background: ${this.currentTheme.layout === 'list' ? 'var(--nebula-primary)' : 'var(--nebula-surface)'};
                                color: ${this.currentTheme.layout === 'list' ? 'white' : 'var(--nebula-text-primary)'};
                                cursor: pointer;
                                transition: all 0.2s ease;
                            ">List</button>
                        </div>
                    </div>

                    <div class="control-group" style="margin-bottom: var(--nebula-space-lg);">
                        <h3 style="margin: 0 0 var(--nebula-space-md) 0; font-size: 16px; font-weight: 600;">Grid Size</h3>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--nebula-space-md);">
                            <div>
                                <label style="display: block; margin-bottom: var(--nebula-space-xs); font-size: 14px;">Columns</label>
                                <input type="range" id="columnsSlider" min="2" max="6" value="${this.currentTheme.columns}" style="width: 100%;">
                                <span id="columnsValue" style="font-size: 12px; color: var(--nebula-text-secondary);">${this.currentTheme.columns}</span>
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: var(--nebula-space-xs); font-size: 14px;">Rows</label>
                                <input type="range" id="rowsSlider" min="2" max="5" value="${this.currentTheme.rows}" style="width: 100%;">
                                <span id="rowsValue" style="font-size: 12px; color: var(--nebula-text-secondary);">${this.currentTheme.rows}</span>
                            </div>
                        </div>
                    </div>

                    <div class="control-group" style="margin-bottom: var(--nebula-space-lg);">
                        <h3 style="margin: 0 0 var(--nebula-space-md) 0; font-size: 16px; font-weight: 600;">Icon Size</h3>
                        <select id="iconSizeSelect" style="
                            width: 100%;
                            padding: var(--nebula-space-sm);
                            border: 1px solid var(--nebula-border);
                            border-radius: var(--nebula-radius-md);
                            background: var(--nebula-surface);
                            color: var(--nebula-text-primary);
                        ">
                            <option value="small" ${this.currentTheme.iconSize === 'small' ? 'selected' : ''}>Small</option>
                            <option value="medium" ${this.currentTheme.iconSize === 'medium' ? 'selected' : ''}>Medium</option>
                            <option value="large" ${this.currentTheme.iconSize === 'large' ? 'selected' : ''}>Large</option>
                        </select>
                    </div>

                    <div class="control-group" style="margin-bottom: var(--nebula-space-lg);">
                        <h3 style="margin: 0 0 var(--nebula-space-md) 0; font-size: 16px; font-weight: 600;">Theme Actions</h3>
                        <div style="display: grid; gap: var(--nebula-space-sm);">
                            <button id="saveThemeBtn" style="
                                padding: var(--nebula-space-md);
                                border: none;
                                border-radius: var(--nebula-radius-md);
                                background: var(--nebula-primary);
                                color: white;
                                cursor: pointer;
                                font-weight: 500;
                            ">💾 Save Theme</button>
                            <button id="loadThemeBtn" style="
                                padding: var(--nebula-space-md);
                                border: 1px solid var(--nebula-border);
                                border-radius: var(--nebula-radius-md);
                                background: var(--nebula-surface);
                                color: var(--nebula-text-primary);
                                cursor: pointer;
                            ">📂 Load Theme</button>
                            <button id="exportThemeBtn" style="
                                padding: var(--nebula-space-md);
                                border: 1px solid var(--nebula-border);
                                border-radius: var(--nebula-radius-md);
                                background: var(--nebula-surface);
                                color: var(--nebula-text-primary);
                                cursor: pointer;
                            ">📤 Export Theme</button>
                            <button id="importThemeBtn" style="
                                padding: var(--nebula-space-md);
                                border: 1px solid var(--nebula-border);
                                border-radius: var(--nebula-radius-md);
                                background: var(--nebula-surface);
                                color: var(--nebula-text-primary);
                                cursor: pointer;
                            ">📥 Import Theme</button>
                        </div>
                    </div>
                </div>

                <div class="available-apps" style="
                    flex: 1;
                    padding: var(--nebula-space-lg);
                    border-top: 1px solid var(--nebula-border);
                ">
                    <h3 style="margin: 0 0 var(--nebula-space-md) 0; font-size: 16px; font-weight: 600;">Available Apps</h3>
                    <div class="apps-list" style="display: grid; gap: var(--nebula-space-sm);">
                        ${this.renderAvailableApps()}
                    </div>
                </div>
            </div>

            <div class="designer-main" style="
                flex: 1;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            ">
                <div class="preview-header" style="
                    padding: var(--nebula-space-lg);
                    border-bottom: 1px solid var(--nebula-border);
                    background: var(--nebula-surface);
                ">
                    <h2 style="margin: 0; font-size: 18px; font-weight: 600;">Launcher Preview</h2>
                    <p style="margin: var(--nebula-space-xs) 0 0 0; color: var(--nebula-text-secondary); font-size: 14px;">Drag apps from the sidebar to customize your launcher</p>
                </div>

                <div class="preview-area" style="
                    flex: 1;
                    padding: var(--nebula-space-xl);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--nebula-bg-secondary);
                ">
                    <div class="launcher-preview" id="launcherPreview" style="
                        background: var(--nebula-surface);
                        border: 1px solid var(--nebula-border);
                        border-radius: var(--nebula-radius-lg);
                        padding: var(--nebula-space-lg);
                        box-shadow: var(--nebula-shadow-lg);
                        backdrop-filter: blur(10px);
                        -webkit-backdrop-filter: blur(10px);
                        min-width: 400px;
                        min-height: 300px;
                    ">
                        ${this.renderLauncherPreview()}
                    </div>
                </div>
            </div>

            <input type="file" id="importFileInput" accept=".json" style="display: none;">
        `;

        this.setupEventListeners(container);
        return container;
    }

    renderAvailableApps() {
        return this.availableApps.map(app => `
            <div class="app-item" draggable="true" data-app-id="${app.id}" style="
                display: flex;
                align-items: center;
                gap: var(--nebula-space-sm);
                padding: var(--nebula-space-sm);
                border: 1px solid var(--nebula-border);
                border-radius: var(--nebula-radius-md);
                cursor: grab;
                transition: all 0.2s ease;
                background: var(--nebula-surface);
            ">
                <span style="font-size: 20px;">${app.icon}</span>
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: 500; font-size: 14px;">${app.name}</div>
                    <div style="color: var(--nebula-text-secondary); font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${app.description}</div>
                </div>
            </div>
        `).join('');
    }

    renderLauncherPreview() {
        const gridStyle = `
            display: grid;
            grid-template-columns: repeat(${this.currentTheme.columns}, 1fr);
            grid-template-rows: repeat(${this.currentTheme.rows}, 1fr);
            gap: var(--nebula-space-md);
            width: 100%;
            height: 100%;
            min-height: 300px;
        `;

        let content = `<div class="launcher-grid" style="${gridStyle}">`;

        // Create grid slots
        for (let row = 0; row < this.currentTheme.rows; row++) {
            for (let col = 0; col < this.currentTheme.columns; col++) {
                const app = this.currentTheme.apps.find(a => a.position.row === row && a.position.col === col && a.visible);
                const appData = app ? this.availableApps.find(a => a.id === app.id) : null;

                content += `
                    <div class="grid-slot" data-row="${row}" data-col="${col}" style="
                        border: 2px dashed var(--nebula-border);
                        border-radius: var(--nebula-radius-md);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 80px;
                        transition: all 0.2s ease;
                        ${appData ? `
                            border-style: solid;
                            background: var(--nebula-surface-hover);
                            cursor: pointer;
                        ` : ''}
                    ">
                        ${appData ? `
                            <div class="preview-app" data-app-id="${appData.id}" style="
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                gap: var(--nebula-space-xs);
                                padding: var(--nebula-space-sm);
                                text-align: center;
                            ">
                                <span style="font-size: ${this.getIconSize()};">${appData.icon}</span>
                                <span style="font-size: 12px; font-weight: 500;">${appData.name}</span>
                            </div>
                        ` : `
                            <span style="color: var(--nebula-text-muted); font-size: 12px;">Drop here</span>
                        `}
                    </div>
                `;
            }
        }

        content += '</div>';
        return content;
    }

    getIconSize() {
        const sizes = {
            small: '24px',
            medium: '32px',
            large: '40px'
        };
        return sizes[this.currentTheme.iconSize] || sizes.medium;
    }

    setupEventListeners(container) {
        // Layout buttons
        container.querySelectorAll('.layout-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentTheme.layout = btn.dataset.layout;
                this.updatePreview(container);
            });
        });

        // Sliders
        const columnsSlider = container.querySelector('#columnsSlider');
        const rowsSlider = container.querySelector('#rowsSlider');
        const columnsValue = container.querySelector('#columnsValue');
        const rowsValue = container.querySelector('#rowsValue');

        columnsSlider.addEventListener('input', () => {
            this.currentTheme.columns = parseInt(columnsSlider.value);
            columnsValue.textContent = columnsSlider.value;
            this.updatePreview(container);
        });

        rowsSlider.addEventListener('input', () => {
            this.currentTheme.rows = parseInt(rowsSlider.value);
            rowsValue.textContent = rowsSlider.value;
            this.updatePreview(container);
        });

        // Icon size select
        const iconSizeSelect = container.querySelector('#iconSizeSelect');
        iconSizeSelect.addEventListener('change', () => {
            this.currentTheme.iconSize = iconSizeSelect.value;
            this.updatePreview(container);
        });

        // Theme action buttons
        container.querySelector('#saveThemeBtn').addEventListener('click', () => this.saveTheme());
        container.querySelector('#loadThemeBtn').addEventListener('click', () => this.loadTheme());
        container.querySelector('#exportThemeBtn').addEventListener('click', () => this.exportTheme());
        container.querySelector('#importThemeBtn').addEventListener('click', () => this.importTheme(container));

        // Drag and drop
        this.setupDragAndDrop(container);
    }

    setupDragAndDrop(container) {
        // Make app items draggable
        container.querySelectorAll('.app-item').forEach(item => {
            item.addEventListener('dragstart', (e) => {
                this.draggedElement = {
                    type: 'app',
                    id: item.dataset.appId
                };
                item.style.opacity = '0.5';
            });

            item.addEventListener('dragend', () => {
                item.style.opacity = '1';
                this.draggedElement = null;
            });
        });

        // Make grid slots drop targets
        container.querySelectorAll('.grid-slot').forEach(slot => {
            slot.addEventListener('dragover', (e) => {
                e.preventDefault();
                slot.style.borderColor = 'var(--nebula-primary)';
                slot.style.backgroundColor = 'var(--nebula-surface-hover)';
            });

            slot.addEventListener('dragleave', () => {
                slot.style.borderColor = 'var(--nebula-border)';
                slot.style.backgroundColor = 'transparent';
            });

            slot.addEventListener('drop', (e) => {
                e.preventDefault();
                slot.style.borderColor = 'var(--nebula-border)';
                slot.style.backgroundColor = 'transparent';

                if (this.draggedElement && this.draggedElement.type === 'app') {
                    const row = parseInt(slot.dataset.row);
                    const col = parseInt(slot.dataset.col);
                    
                    // Remove app from current position
                    this.currentTheme.apps = this.currentTheme.apps.filter(app => app.id !== this.draggedElement.id);
                    
                    // Add app to new position
                    this.currentTheme.apps.push({
                        id: this.draggedElement.id,
                        position: { row, col },
                        visible: true
                    });

                    this.updatePreview(container);
                }
            });
        });

        // Make preview apps removable
        container.addEventListener('click', (e) => {
            const previewApp = e.target.closest('.preview-app');
            if (previewApp && e.ctrlKey) {
                // Remove app on Ctrl+click
                const appId = previewApp.dataset.appId;
                this.currentTheme.apps = this.currentTheme.apps.filter(app => app.id !== appId);
                this.updatePreview(container);
            }
        });
    }

    updatePreview(container) {
        const previewArea = container.querySelector('#launcherPreview');
        previewArea.innerHTML = this.renderLauncherPreview();
        this.setupDragAndDrop(container);
    }

    saveTheme() {
        const name = prompt('Enter theme name:', this.currentTheme.name || 'My Theme');
        if (name) {
            this.currentTheme.name = name;
            this.saveLauncherTheme();
            alert('Theme saved successfully!');
        }
    }

    loadTheme() {
        // For now, just reset to default
        this.currentTheme = this.loadLauncherTheme();
        alert('Default theme loaded!');
        // Refresh the window to show changes
        if (this.windowId && window.windowManager) {
            window.windowManager.refreshWindow(this.windowId);
        }
    }

    exportTheme() {
        const dataStr = JSON.stringify(this.currentTheme, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `${this.currentTheme.name || 'launcher-theme'}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    }

    importTheme(container) {
        const fileInput = container.querySelector('#importFileInput');
        fileInput.click();
        
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const theme = JSON.parse(e.target.result);
                        this.currentTheme = theme;
                        this.updatePreview(container);
                        alert('Theme imported successfully!');
                    } catch (error) {
                        alert('Error importing theme: Invalid file format');
                    }
                };
                reader.readAsText(file);
            }
        };
    }

    applyThemeToLauncher() {
        // Apply the current theme to the actual launcher
        const launcher = document.querySelector('.launcher');
        if (launcher) {
            // Update launcher grid
            const appGrid = launcher.querySelector('.app-grid');
            if (appGrid) {
                appGrid.style.gridTemplateColumns = `repeat(${this.currentTheme.columns}, 1fr)`;
                appGrid.style.gridTemplateRows = `repeat(${this.currentTheme.rows}, 1fr)`;
                
                // Update app positions
                const appIcons = appGrid.querySelectorAll('.app-icon');
                appIcons.forEach(icon => {
                    const appId = icon.dataset.app;
                    const appConfig = this.currentTheme.apps.find(app => app.id === appId);
                    if (appConfig && appConfig.visible) {
                        icon.style.gridRow = appConfig.position.row + 1;
                        icon.style.gridColumn = appConfig.position.col + 1;
                        icon.style.display = 'flex';
                    } else {
                        icon.style.display = 'none';
                    }
                });
            }
        }
    }

    cleanup() {
        // Cleanup when window is closed
        console.log('Launcher Designer cleanup');
    }
}

// Export for use
window.LauncherDesigner = LauncherDesigner;

