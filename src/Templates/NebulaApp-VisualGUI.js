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
            position: sticky;
            top: 0;
            z-index: 30;
        `;
        toolbar.innerHTML = `<div style="font-weight:600;color:var(--nebula-text-primary)">${this.getTitle()}</div>`;

        const content = document.createElement('div');
        content.style.cssText = `
            flex:1; overflow:auto; padding:16px; background:var(--nebula-bg-primary);
        `;

        // Placeholder for injected design HTML
        content.innerHTML = `
            <div id="visual-gui-root">
                <!-- Shoelace imports needed by components used in the designer -->
                <link rel="stylesheet" href="css/shoelace-nebula-bridge.css">
                <script type="module" src="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.12.0/cdn/components/button/button.js"></script>
                <script type="module" src="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.12.0/cdn/components/input/input.js"></script>
                <script type="module" src="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.12.0/cdn/components/textarea/textarea.js"></script>
                <script type="module" src="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.12.0/cdn/components/select/select.js"></script>
                <script type="module" src="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.12.0/cdn/components/menu/menu.js"></script>
                <script type="module" src="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.12.0/cdn/components/menu-item/menu-item.js"></script>
                <script type="module" src="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.12.0/cdn/components/checkbox/checkbox.js"></script>
                <script type="module" src="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.12.0/cdn/components/radio/radio.js"></script>
                <script type="module" src="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.12.0/cdn/components/switch/switch.js"></script>
                <script type="module" src="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.12.0/cdn/components/range/range.js"></script>
                <script type="module" src="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.12.0/cdn/components/icon/icon.js"></script>
                <script type="module" src="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.12.0/cdn/components/icon-button/icon-button.js"></script>
                <script type="module" src="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.12.0/cdn/components/dropdown/dropdown.js"></script>
                <script type="module" src="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.12.0/cdn/components/menu/menu.js"></script>
                <script type="module" src="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.12.0/cdn/components/dialog/dialog.js"></script>
                <script type="module" src="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.12.0/cdn/components/badge/badge.js"></script>
                <script type="module" src="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.12.0/cdn/components/avatar/avatar.js"></script>
                <script type="module" src="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.12.0/cdn/components/progress/progress.js"></script>
                <script type="module" src="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.12.0/cdn/components/spinner/spinner.js"></script>
                <script type="module" src="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.12.0/cdn/components/tooltip/tooltip.js"></script>
                <script type="module" src="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.12.0/cdn/components/tabs/tabs.js"></script>
                <script type="module" src="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.12.0/cdn/components/tab/tab.js"></script>
                <script type="module" src="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.12.0/cdn/components/toast/toast.js"></script>

                <!-- Scoped Shoelace overrides so components match Nebula theme -->
                <style>
                    /* Add top padding to make room for the sticky toolbar */
                    #visual-gui-root { padding-top: 64px; box-sizing: border-box; }
                    sl-button::part(base) {
                        border-radius: var(--nebula-radius-sm);
                        padding: 6px 12px;
                        font-family: var(--nebula-font-family);
                        background: var(--nebula-primary);
                        color: var(--nebula-text-on-primary);
                        border: 1px solid var(--nebula-border);
                    }
                    sl-input::part(base), sl-textarea::part(base) {
                        font-family: var(--nebula-font-family);
                        border-radius: var(--nebula-radius-sm);
                        border: 1px solid var(--nebula-border);
                        background: var(--nebula-surface);
                        color: var(--nebula-text-on-surface);
                    }
                    /* Ensure native elements in the design area use Nebula defaults */
                    #visual-gui-root button { font-family: var(--nebula-font-family); }
                </style>

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

    // After the app renders, request a theme refresh so Shoelace components pick up variables
    onLoad() {
        try {
            const theme = window.nebulaThemeManager ? window.nebulaThemeManager.getTheme() : null;
            window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
        } catch (err) {
            console.warn('Failed to dispatch theme refresh from VisualGUI', err);
        }
    }
}

window.NebulaAppVisualGUI = NebulaAppVisualGUI;
