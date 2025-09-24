// NebulaApp Visual GUI Boilerplate Template
// This template is a boilerplate app that will host user-designed GUI HTML

class NebulaAppVisualGUI {
    constructor() {
        this.windowId = null;
        this.init();
    }

    async init() {
        if (!window.windowManager) {
            console.error('WindowManager not available');
            return;
        }

        this.windowId = window.windowManager.createWindow({
            title: 'Visual GUI App',
            width: 1000,
            height: 700,
            resizable: true,
            maximizable: true,
            minimizable: true
        });

        window.windowManager.loadApp(this.windowId, this);
    }

    render() {
        const container = document.createElement('div');
        container.style.cssText = `
            width:100%;
            height:100%;
            display:flex;
            flex-direction:column;
            background:var(--nebula-bg-primary);
            font-family:var(--nebula-font-family);
        `;

        const toolbar = document.createElement('div');
        toolbar.style.cssText = `
            height:48px;
            display:flex;
            align-items:center;
            padding:8px 12px;
            background:var(--nebula-surface);
            border-bottom:1px solid var(--nebula-border);
        `;
        toolbar.innerHTML = `<div style="font-weight:600;color:var(--nebula-text-primary)">${this.getTitle()}</div>`;

        const content = document.createElement('div');
        content.style.cssText = `
            flex:1; overflow:auto; padding:16px; background:var(--nebula-bg-primary);
        `;

        // Placeholder for injected design HTML
        content.innerHTML = `
            <div id="visual-gui-root">
                <!-- __VISUAL_GUI_HTML__ -->
            </div>
        `;

        container.appendChild(toolbar);
        container.appendChild(content);

        return container;
    }

    getTitle() { return 'Visual GUI App'; }
    getIcon() { return '🎨'; }
    cleanup() { }
}

window.NebulaAppVisualGUI = NebulaAppVisualGUI;
