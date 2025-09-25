// PickerApp - NebulaApp wrapper for the in-app file picker
// Migrated from ui/nebula-filepicker.js and exposed as a NebulaApp that other apps
// can call transiently. Provides PickerApp.open(options) -> Promise

class PickerApp {
    constructor(options = {}) {
        this.windowId = null;
        this.options = options || {};
        this.currentPath = null;
        this.entries = [];
        this.selected = null;
        this._resolve = null;
        this._closing = false;
        // filters: expect options.filters = [{name:'BASIC', extensions:['bas']}, ...]
        this.filters = this.options.filters || [];
        // default active filter: 'all' or index into this.filters as string
        this.activeFilter = 'all';
        // If options specify filters and a preferred filter index/name, try to set it
        if (this.options.filters && Array.isArray(this.options.filters) && this.options.preferFilter != null) {
            // preferFilter can be an index or a name
            if (typeof this.options.preferFilter === 'number' && this.options.preferFilter >= 0 && this.options.preferFilter < this.options.filters.length) {
                this.activeFilter = String(this.options.preferFilter);
            } else if (typeof this.options.preferFilter === 'string') {
                const idx = this.options.filters.findIndex(f => (f.name || '').toLowerCase() === this.options.preferFilter.toLowerCase());
                if (idx >= 0) this.activeFilter = String(idx);
            }
        } else if (this.options.filters && Array.isArray(this.options.filters) && this.options.filters.length === 1) {
            // If caller provided a single filter, auto-select it
            this.activeFilter = '0';
        }
    }

    // Open the picker as a transient app window and return a Promise that resolves
    // with the selected path (string) or null when cancelled.
    static open(options = {}) {
        const picker = new PickerApp(options);
        return picker._openWindow();
    }

    // Small runtime helper to let callers detect whether PickerApp is usable
    // Returns true when the PickerApp.open function is present and callable.
    static canUse() {
        try {
            return !!(window.PickerApp && typeof window.PickerApp.open === 'function');
        } catch (e) { return false; }
    }

    // Return detailed availability info: { canUse: boolean, reason: string|null }
    // Reasons: missing windowManager, incomplete windowManager API, missing nebula.fs (warning), or null when fully usable.
    static isAvailableDetail() {
        try {
            if (typeof window === 'undefined') return { canUse: false, reason: 'no window object' };
            if (!window.windowManager) return { canUse: false, reason: 'windowManager not available' };
            if (typeof window.windowManager.createWindow !== 'function' || typeof window.windowManager.loadApp !== 'function') {
                return { canUse: false, reason: 'windowManager API incomplete' };
            }
            // nebula.fs is strongly recommended for filesystem-backed picker features, but absence is not a hard blocker
            if (!(window.nebula && window.nebula.fs && typeof window.nebula.fs.readDir === 'function')) {
                return { canUse: true, reason: 'nebula.fs not available — filesystem operations may be limited' };
            }
            return { canUse: true, reason: null };
        } catch (e) {
            return { canUse: false, reason: String(e) };
        }
    }

    async _openWindow() {
        if (!window.windowManager) {
            console.warn('WindowManager not available - falling back to old modal');
            // fallback to old modal if available
            if (window.NebulaFilePicker) {
                const modal = new window.NebulaFilePicker();
                return await modal.open(this.options);
            }
            return null;
        }

        // create a compact picker window
        this.windowId = window.windowManager.createWindow({
            title: this.options.title || 'File Picker',
            width: this.options.width || 900,
            height: this.options.height || 520,
            resizable: !!this.options.resizable,
            maximizable: false,
            minimizable: false
        });

        // Load this app into the window
        window.windowManager.loadApp(this.windowId, this);

        // store the promise resolve so the app can resolve later; closing the
        // window is handled by closeAndResolve to avoid races between app and
        // external calls.
        return new Promise((resolve) => {
            this._resolve = resolve;
        });
    }

    // NebulaApp render() API
    render() {
        // Inject CSS styles for Nebula buttons if not already present
        if (!document.querySelector('#picker-app-styles')) {
            const style = document.createElement('style');
            style.id = 'picker-app-styles';
            style.textContent = `
                .nebula-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: var(--nebula-space-xs, 4px);
                    padding: var(--nebula-space-sm, 8px) var(--nebula-space-md, 16px);
                    border-radius: var(--nebula-radius-sm, 6px);
                    font-size: 14px;
                    font-weight: 500;
                    line-height: 1.5;
                    text-decoration: none;
                    cursor: pointer;
                    border: 1px solid transparent;
                    transition: var(--nebula-transition-fast, all 0.15s ease);
                    min-height: 36px;
                    white-space: nowrap;
                }

                .nebula-btn .material-symbols-outlined {
                    font-size: 18px;
                    margin: 0;
                }

                .nebula-btn-primary {
                    background: var(--nebula-primary, #667eea);
                    color: var(--nebula-text-on-primary, white);
                    border-color: var(--nebula-primary, #667eea);
                }

                .nebula-btn-primary:hover {
                    background: var(--nebula-accent, #4f46e5);
                    border-color: var(--nebula-accent, #4f46e5);
                    transform: translateY(-1px);
                    box-shadow: var(--nebula-shadow-sm, 0 2px 8px rgba(0,0,0,0.15));
                }

                .nebula-btn-secondary {
                    background: var(--nebula-bg-secondary, #f8fafc);
                    color: var(--nebula-text-primary, #1e293b);
                    border-color: var(--nebula-border, #e2e8f0);
                }

                .nebula-btn-secondary:hover {
                    background: var(--nebula-surface-hover, #f1f5f9);
                    border-color: var(--nebula-border-hover, #cbd5e1);
                    transform: translateY(-1px);
                    box-shadow: var(--nebula-shadow-sm, 0 2px 8px rgba(0,0,0,0.15));
                }

                .nebula-btn-outline {
                    background: transparent;
                    color: var(--nebula-primary, #667eea);
                    border-color: var(--nebula-primary, #667eea);
                }

                .nebula-btn-outline:hover {
                    background: var(--nebula-primary, #667eea);
                    color: var(--nebula-text-on-primary, white);
                    transform: translateY(-1px);
                    box-shadow: var(--nebula-shadow-sm, 0 2px 8px rgba(0,0,0,0.15));
                }

                .nebula-btn-ghost {
                    background: transparent;
                    color: var(--nebula-text-secondary, #64748b);
                    border-color: transparent;
                    padding: var(--nebula-space-xs, 4px) var(--nebula-space-sm, 8px);
                    min-height: 32px;
                    justify-content: flex-start;
                    width: 100%;
                    text-align: left;
                }

                .nebula-btn-ghost:hover {
                    background: var(--nebula-surface-hover, #f8fafc);
                    color: var(--nebula-text-primary, #1e293b);
                    border-color: var(--nebula-border, #e2e8f0);
                }

                .picker-app-container {
                    font-family: system-ui, -apple-system, sans-serif;
                }

                .picker-filter {
                    padding: var(--nebula-space-xs, 4px) var(--nebula-space-sm, 8px);
                    border-radius: var(--nebula-radius-sm, 6px);
                    border: 1px solid var(--nebula-border, #e2e8f0);
                    background: var(--nebula-bg-primary, white);
                    color: var(--nebula-text-primary, #1e293b);
                    font-size: 14px;
                    min-width: 120px;
                }

                .picker-entry:hover {
                    transform: translateY(-1px);
                    box-shadow: var(--nebula-shadow-sm, 0 2px 8px rgba(0,0,0,0.15));
                }

                .picker-entry.selected {
                    background: var(--nebula-primary, #667eea) !important;
                    color: var(--nebula-text-on-primary, white);
                }

                /* New design-specific styles */
                .picker-breadcrumb {
                    display: flex;
                    align-items: center;
                    gap: var(--nebula-space-xs, 4px);
                    padding: var(--nebula-space-sm, 8px) var(--nebula-space-md, 12px);
                    background: var(--nebula-bg-primary, white);
                    border: 1px solid var(--nebula-border, #e2e8f0);
                    border-radius: var(--nebula-radius-sm, 6px);
                    font-family: monospace;
                    font-size: 13px;
                }

                .breadcrumb-segment {
                    color: var(--nebula-primary, #667eea);
                    cursor: pointer;
                    padding: 2px 4px;
                    border-radius: 3px;
                    transition: var(--nebula-transition-fast);
                }

                .breadcrumb-segment:hover {
                    background: var(--nebula-surface-hover, #f8fafc);
                }

                .breadcrumb-separator {
                    color: var(--nebula-text-muted, #94a3b8);
                    font-size: 12px;
                }

                .picker-search {
                    flex: 1;
                    padding: var(--nebula-space-sm, 8px) var(--nebula-space-md, 12px);
                    border: 1px solid var(--nebula-border, #e2e8f0);
                    border-radius: var(--nebula-radius-sm, 6px);
                    background: var(--nebula-bg-primary, white);
                    color: var(--nebula-text-primary, #1e293b);
                    font-size: 14px;
                }

                .picker-search:focus {
                    outline: none;
                    border-color: var(--nebula-primary, #667eea);
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                }

                .quick-access-bar {
                    display: flex;
                    gap: var(--nebula-space-xs, 4px);
                    padding: var(--nebula-space-sm, 8px);
                    background: var(--nebula-bg-tertiary, #f1f5f9);
                    border-radius: var(--nebula-radius-sm, 6px);
                    border: 1px solid var(--nebula-border, #e2e8f0);
                    overflow-x: auto;
                }

                .quick-access-btn {
                    display: flex;
                    align-items: center;
                    gap: var(--nebula-space-xs, 4px);
                    padding: var(--nebula-space-xs, 4px) var(--nebula-space-sm, 8px);
                    background: var(--nebula-bg-primary, white);
                    border: 1px solid transparent;
                    border-radius: var(--nebula-radius-sm, 6px);
                    color: var(--nebula-text-secondary, #64748b);
                    cursor: pointer;
                    transition: var(--nebula-transition-fast);
                    white-space: nowrap;
                    font-size: 13px;
                }

                .quick-access-btn:hover {
                    background: var(--nebula-surface-hover, #f8fafc);
                    color: var(--nebula-text-primary, #1e293b);
                    border-color: var(--nebula-border, #e2e8f0);
                    transform: translateY(-1px);
                }

                .preview-toggle {
                    background: var(--nebula-bg-secondary, #f8fafc);
                    border: 1px solid var(--nebula-border, #e2e8f0);
                }

                .preview-toggle.active {
                    background: var(--nebula-primary, #667eea);
                    color: var(--nebula-text-on-primary, white);
                    border-color: var(--nebula-primary, #667eea);
                }

                .picker-main-area {
                    transition: var(--nebula-transition, all 0.3s ease);
                }

                .preview-panel {
                    width: 300px;
                    background: var(--nebula-bg-secondary, #f8fafc);
                    border-left: 1px solid var(--nebula-border, #e2e8f0);
                    transform: translateX(100%);
                    transition: transform var(--nebula-transition, 0.3s ease);
                }

                .preview-panel.visible {
                    transform: translateX(0);
                }
            `;
            document.head.appendChild(style);
        }

        const container = document.createElement('div');
        container.className = 'picker-app-container';
        container.style.cssText = 'width:100%;height:100%;display:flex;flex-direction:column;gap:var(--nebula-space-sm, 8px);padding:var(--nebula-space-md, 16px);box-sizing:border-box;';

        // === HEADER SECTION ===
        const header = document.createElement('div');
        header.style.cssText = 'display:flex;flex-direction:column;gap:var(--nebula-space-sm, 8px);';

        // Title and breadcrumb row
        const titleRow = document.createElement('div');
        titleRow.style.cssText = 'display:flex;align-items:center;gap:var(--nebula-space-md, 16px);';

        const title = document.createElement('h2');
        title.textContent = this.options.title || 'Select File';
        title.style.cssText = 'margin:0;font-size:18px;font-weight:600;color:var(--nebula-text-primary);';

        const breadcrumb = document.createElement('div');
        breadcrumb.className = 'picker-breadcrumb';

        titleRow.appendChild(title);
        titleRow.appendChild(breadcrumb);

        // Controls row
        const controlsRow = document.createElement('div');
        controlsRow.style.cssText = 'display:flex;align-items:center;gap:var(--nebula-space-sm, 8px);';

        const searchInput = document.createElement('input');
        searchInput.className = 'picker-search';
        searchInput.type = 'text';
        searchInput.placeholder = 'Search files...';

        const btnViewToggle = document.createElement('button');
        btnViewToggle.innerHTML = '<span class="material-symbols-outlined">grid_view</span>';
        btnViewToggle.title = 'Toggle Grid/List';
        btnViewToggle.className='nebula-btn nebula-btn-secondary';

        const btnShowHidden = document.createElement('button');
        btnShowHidden.innerHTML = '<span class="material-symbols-outlined">visibility</span>';
        btnShowHidden.title = 'Toggle show hidden files';
        btnShowHidden.className='nebula-btn nebula-btn-secondary';

        const previewToggle = document.createElement('button');
        previewToggle.innerHTML = '<span class="material-symbols-outlined">preview</span>';
        previewToggle.title = 'Toggle preview panel';
        previewToggle.className='nebula-btn nebula-btn-secondary preview-toggle';

        const filterSelect = document.createElement('select');
        filterSelect.className = 'picker-filter';
        const allOpt = document.createElement('option');
        allOpt.value = 'all';
        allOpt.textContent = 'All files';
        filterSelect.appendChild(allOpt);

        if (this.filters && this.filters.length) {
            this.filters.forEach((f, idx)=>{
                const opt = document.createElement('option');
                opt.value = String(idx);
                opt.textContent = f.name ? `${f.name}` : `Filter ${idx+1}`;
                filterSelect.appendChild(opt);
            });
        }

        try { filterSelect.value = this.activeFilter; } catch(e) {}

        controlsRow.appendChild(searchInput);
        controlsRow.appendChild(btnViewToggle);
        controlsRow.appendChild(btnShowHidden);
        controlsRow.appendChild(previewToggle);
        controlsRow.appendChild(filterSelect);

        header.appendChild(titleRow);
        header.appendChild(controlsRow);

        // === QUICK ACCESS BAR ===
        const quickAccessBar = document.createElement('div');
        quickAccessBar.className = 'quick-access-bar';

        // === MAIN CONTENT AREA ===
        const contentWrapper = document.createElement('div');
        contentWrapper.style.cssText = 'flex:1;display:flex;gap:var(--nebula-space-md, 16px);overflow:hidden;background:var(--nebula-bg-primary);border-radius:var(--nebula-radius-md, 8px);border:1px solid var(--nebula-border);';

        const mainArea = document.createElement('div');
        mainArea.className = 'picker-main-area';
        mainArea.style.cssText = 'flex:1;display:flex;flex-direction:column;overflow:hidden;';

        const list = document.createElement('div');
        list.className='picker-list';
        list.style.cssText = 'flex:1;display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:var(--nebula-space-sm, 8px);overflow:auto;padding:var(--nebula-space-md, 16px);';

        const preview = document.createElement('div');
        preview.className='picker-preview preview-panel';
        preview.style.cssText='display:flex;flex-direction:column;gap:var(--nebula-space-sm, 8px);padding:var(--nebula-space-md, 16px);overflow:auto;position:relative;';

        const previewContent = document.createElement('div');
        previewContent.className = 'preview-content';
        previewContent.style.cssText = 'flex:1;background:var(--nebula-bg-primary);border-radius:var(--nebula-radius-sm, 6px);border:1px solid var(--nebula-border);padding:var(--nebula-space-md, 16px);overflow:auto;';
        previewContent.innerHTML = '<div style="text-align:center;color:var(--nebula-text-muted);padding:2rem;">Select a file to preview</div>';

        const sysBtn = document.createElement('button');
        sysBtn.innerHTML = '<span class="material-symbols-outlined">folder_open</span> System Picker';
        sysBtn.className='nebula-btn nebula-btn-outline';

        preview.appendChild(previewContent);
        preview.appendChild(sysBtn);

        mainArea.appendChild(list);
        contentWrapper.appendChild(mainArea);
        contentWrapper.appendChild(preview);

        // === FOOTER ===
        const footer = document.createElement('div');
        footer.style.cssText='display:flex;gap:var(--nebula-space-sm, 8px);align-items:center;padding:var(--nebula-space-md, 16px);background:var(--nebula-bg-secondary);border-radius:var(--nebula-radius-md, 8px);border:1px solid var(--nebula-border);';

        const filename = document.createElement('input');
        filename.className='picker-filename';
        filename.placeholder = 'Enter filename...';
        filename.style.cssText='flex:1;padding:var(--nebula-space-sm, 8px) var(--nebula-space-md, 12px);border-radius:var(--nebula-radius-sm, 6px);border:1px solid var(--nebula-border);background:var(--nebula-bg-primary);color:var(--nebula-text-primary);font-size:14px;';

        const cancelBtn = document.createElement('button');
        cancelBtn.innerHTML = '<span class="material-symbols-outlined">cancel</span> Cancel';
        cancelBtn.className='nebula-btn nebula-btn-secondary';

        const openBtn = document.createElement('button');
        const isOpenMode = this.options.pickType !== 'save';
        openBtn.innerHTML = `<span class="material-symbols-outlined">${isOpenMode ? 'folder_open' : 'save'}</span> ${isOpenMode ? 'Open' : 'Save'}`;
        openBtn.className='nebula-btn nebula-btn-primary';

        footer.appendChild(filename);
        footer.appendChild(cancelBtn);
        footer.appendChild(openBtn);

        // Assemble the layout
        container.appendChild(header);
        container.appendChild(quickAccessBar);
        container.appendChild(contentWrapper);
        container.appendChild(footer);

    // store references for new layout
    this._els = {
        container,
        list,
        preview: previewContent,
        filename,
        breadcrumb,
        openBtn,
        cancelBtn,
        sysBtn,
        btnViewToggle,
        btnShowHidden,
        filterSelect,
        searchInput,
        previewToggle,
        quickAccessBar
    };

    // Internal state
    this.showPreview = false; // Preview panel hidden by default

    // internal state: hide dotfiles by default unless option showHidden true
    try { this.showHidden = JSON.parse(localStorage.getItem('nebula.picker.showHidden')) ?? !!this.options.showHidden; } catch(e) { this.showHidden = !!this.options.showHidden; }
    // view mode: 'grid' or 'list'
    this.viewMode = 'grid';

        // === EVENT HANDLERS ===

        // Action buttons
        cancelBtn.addEventListener('click', () => this.closeAndResolve(null));

        openBtn.addEventListener('click', () => {
            if (this.options.pickType === 'save') {
                const name = (filename.value || '').trim();
                const final = name ? (this.currentPath.endsWith('/') ? this.currentPath + name : this.currentPath + '/' + name) : null;
                this.closeAndResolve(final);
            } else {
                this.closeAndResolve(this.selected || null);
            }
        });

        sysBtn.addEventListener('click', async () => {
            try {
                const native = window.nebula && window.nebula.dialog && window.nebula.dialog.openFile;
                if (typeof native === 'function') {
                    const res = await native(this.options || {});
                    if (res && res.filePaths && res.filePaths.length > 0) return this.closeAndResolve(res.filePaths[0]);
                    if (Array.isArray(res) && res.length > 0) return this.closeAndResolve(res[0]);
                    if (typeof res === 'string') return this.closeAndResolve(res);
                }
            } catch (e) {
                console.warn('System picker failed', e);
            }
        });

        // View controls
        btnViewToggle.addEventListener('click', () => {
            this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
            const icon = this.viewMode === 'grid' ? 'grid_view' : 'view_list';
            btnViewToggle.innerHTML = `<span class="material-symbols-outlined">${icon}</span>`;
            btnViewToggle.title = `Switch to ${this.viewMode === 'grid' ? 'List' : 'Grid'} view`;
            this.renderEntries();
        });

        btnShowHidden.addEventListener('click', () => {
            this.showHidden = !this.showHidden;
            try { localStorage.setItem('nebula.picker.showHidden', JSON.stringify(this.showHidden)); } catch(e) {}
            const icon = this.showHidden ? 'visibility_off' : 'visibility';
            btnShowHidden.innerHTML = `<span class="material-symbols-outlined">${icon}</span>`;
            btnShowHidden.title = this.showHidden ? 'Hide hidden files' : 'Show hidden files';
            this.renderEntries();
        });

        // Preview toggle
        previewToggle.addEventListener('click', () => {
            this.showPreview = !this.showPreview;
            previewToggle.classList.toggle('active', this.showPreview);
            preview.classList.toggle('visible', this.showPreview);
            previewToggle.title = this.showPreview ? 'Hide preview' : 'Show preview';
        });

        // Filter selection
        filterSelect.addEventListener('change', (e) => {
            this.activeFilter = e.target.value;
            this.renderEntries();
        });

        // Search functionality
        searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.renderEntries();
        });

        // File list interactions
        list.addEventListener('click', async (ev) => {
            const el = ev.target.closest('.picker-entry');
            if (!el) return;
            const p = el.dataset.path;
            if (!p) return;
            const item = this.entries.find(x => x.path === p);

            if (item && item.isDirectory) {
                await this.loadDir(p);
                return;
            }

            this.select(p, (item && item.name) || p.split('/').pop());
            if (this.showPreview) {
                await this.showPreviewFor(p);
            }
        });

        list.addEventListener('dblclick', (ev) => {
            const el = ev.target.closest('.picker-entry');
            if (!el) return;
            const p = el.dataset.path;
            if (!p) return;
            const item = this.entries.find(x => x.path === p);
            if (item && !item.isDirectory) {
                this.closeAndResolve(p);
            }
        });

        // Breadcrumb navigation
        breadcrumb.addEventListener('click', (ev) => {
            const segment = ev.target.closest('.breadcrumb-segment');
            if (segment) {
                const path = segment.dataset.path;
                if (path) {
                    this.loadDir(path);
                }
            }
        });

        // Keyboard navigation
        container.tabIndex = 0;
        container.addEventListener('keydown', (e) => {
            try {
                if (e.target.tagName === 'INPUT') return; // Don't interfere with input fields

                const focusable = Array.from(this._els.list.querySelectorAll('.picker-entry:not(.picker-up)'));
                if (!focusable.length) return;
                const idx = focusable.findIndex(n => n.classList.contains('selected'));

                if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                    e.preventDefault();
                    const next = focusable[Math.min(focusable.length - 1, Math.max(0, idx + 1))];
                    if (next) {
                        next.click();
                        next.scrollIntoView({ block: 'nearest' });
                    }
                } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                    e.preventDefault();
                    const prev = focusable[Math.max(0, (idx === -1 ? 0 : idx) - 1)];
                    if (prev) {
                        prev.click();
                        prev.scrollIntoView({ block: 'nearest' });
                    }
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (this.selected) this.closeAndResolve(this.selected);
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    this.closeAndResolve(null);
                }
            } catch (err) {
                console.warn('keyboard nav error', err);
            }
        });

        // Initialize
        setTimeout(() => this.loadDir(this.options.startPath || (window.nebula && window.nebula.fs && window.nebula.fs.getHomeDir ? window.nebula.fs.getHomeDir() : '/')), 0);
        setTimeout(() => this._populateQuickAccess(), 100);

        return container;
    }

    // Generate breadcrumb navigation
    updateBreadcrumb(path) {
        const breadcrumb = this._els.breadcrumb;
        breadcrumb.innerHTML = '';

        const parts = path.split('/').filter(Boolean);
        if (parts.length === 0) {
            // Root directory
            const segment = document.createElement('span');
            segment.className = 'breadcrumb-segment';
            segment.textContent = '/';
            segment.dataset.path = '/';
            breadcrumb.appendChild(segment);
            return;
        }

        // Home segment
        const homeSegment = document.createElement('span');
        homeSegment.className = 'breadcrumb-segment';
        homeSegment.innerHTML = '<span class="material-symbols-outlined" style="font-size:16px;">home</span>';
        homeSegment.dataset.path = '/';
        breadcrumb.appendChild(homeSegment);

        // Path segments
        let currentPath = '';
        parts.forEach((part) => {
            // Add separator
            const sep = document.createElement('span');
            sep.className = 'breadcrumb-separator';
            sep.textContent = '>';
            breadcrumb.appendChild(sep);

            currentPath += '/' + part;
            const segment = document.createElement('span');
            segment.className = 'breadcrumb-segment';
            segment.textContent = part;
            segment.dataset.path = currentPath;
            breadcrumb.appendChild(segment);
        });
    }

    async loadDir(dirPath) {
        this.currentPath = await Promise.resolve(dirPath);
        const { list } = this._els;

        // Update breadcrumb
        this.updateBreadcrumb(this.currentPath);

        list.innerHTML = '<div class="picker-loading" style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--nebula-text-muted);">Loading...</div>';

        try {
            const names = await window.nebula.fs.readDir(this.currentPath);
            const promises = names.map(async (name)=>{
                try {
                    const full = (this.currentPath.endsWith('/')? this.currentPath+name : this.currentPath+'/'+name);
                    const st = await window.nebula.fs.stat(full);
                    return { name, path: full, isDirectory: !!st.isDirectory };
                } catch(e){ return null; }
            });
            const items = (await Promise.all(promises)).filter(Boolean);
            items.sort((a,b)=>{ if(a.isDirectory===b.isDirectory) return a.name.localeCompare(b.name); return a.isDirectory? -1:1; });
            this.entries = items;
            this.renderEntries();
        } catch (err) {
            list.innerHTML = `<div class="picker-error">Failed to read directory: ${err.message||err}</div>`;
        }
    }

    // populate horizontal quick access bar
    async _populateQuickAccess() {
        try {
            const bar = this._els && this._els.quickAccessBar;
            if (!bar) return;

            const home = await (window.nebula && window.nebula.fs && window.nebula.fs.getHomeDir ? window.nebula.fs.getHomeDir() : '/home');
            const quick = [
                { name: 'Home', path: home, icon: 'home' },
                { name: 'Desktop', path: (home.endsWith('/') ? home : home + '/') + 'Desktop', icon: 'desktop_windows' },
                { name: 'Documents', path: (home.endsWith('/') ? home : home + '/') + 'Documents', icon: 'description' },
                { name: 'Downloads', path: (home.endsWith('/') ? home : home + '/') + 'Downloads', icon: 'download' },
                { name: 'Pictures', path: (home.endsWith('/') ? home : home + '/') + 'Pictures', icon: 'image' },
                { name: 'Music', path: (home.endsWith('/') ? home : home + '/') + 'Music', icon: 'music_note' }
            ];

            bar.innerHTML = '';
            quick.forEach(q => {
                const b = document.createElement('button');
                b.className = 'quick-access-btn';
                b.innerHTML = `<span class="material-symbols-outlined" style="font-size:16px;">${q.icon}</span> ${q.name}`;
                b.title = q.path;
                b.addEventListener('click', () => this.loadDir(q.path));
                bar.appendChild(b);
            });

        } catch(e) {
            console.warn('populateQuickAccess failed', e);
        }
    }

    renderEntries() {
        const { list } = this._els;
        list.innerHTML = '';

        // Add "up" directory entry
        if (this.currentPath && this.currentPath !== '/') {
            const up = document.createElement('div');
            up.className = 'picker-entry picker-up';
            up.dataset.path = '';
            up.style.cssText = this.viewMode === 'grid'
                ? 'display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px;border-radius:var(--nebula-radius-sm);background:var(--nebula-bg-tertiary);cursor:pointer;border:2px dashed var(--nebula-border);color:var(--nebula-text-secondary);min-height:80px;'
                : 'display:flex;gap:var(--nebula-space-sm);align-items:center;padding:var(--nebula-space-sm);border-radius:var(--nebula-radius-sm);background:var(--nebula-bg-tertiary);cursor:pointer;border:2px dashed var(--nebula-border);color:var(--nebula-text-secondary);min-height:48px;';

            up.innerHTML = this.viewMode === 'grid'
                ? '<span class="material-symbols-outlined" style="font-size:24px;">arrow_upward</span><div style="font-size:12px;margin-top:4px;">Up</div>'
                : '<span class="material-symbols-outlined">arrow_back</span><div>Go up</div>';

            up.addEventListener('click', () => {
                const parent = this.currentPath.split('/').slice(0, -1).join('/') || '/';
                this.loadDir(parent);
            });

            list.appendChild(up);
        }

        // Filter and search entries
        const items = this.entries.filter(it => {
            // Hidden files handling
            if (!this.showHidden && it.name && it.name.startsWith('.')) return false;

            // Search filtering
            if (this.searchQuery && this.searchQuery.trim()) {
                const query = this.searchQuery.toLowerCase();
                if (!it.name.toLowerCase().includes(query)) return false;
            }

            // Always show directories
            if (it.isDirectory) return true;

            // File type filter
            if (this.activeFilter && this.activeFilter !== 'all' && this.filters && this.filters.length) {
                const idx = parseInt(this.activeFilter, 10);
                const filt = this.filters[idx];
                if (filt && filt.extensions && filt.extensions.length) {
                    const ext = (it.name || '').split('.').pop().toLowerCase();
                    return filt.extensions.map(e => e.toLowerCase()).includes(ext);
                }
            }

            return true;
        });

        // Render entries
        for (const it of items) {
            const el = document.createElement('div');
            el.className = 'picker-entry';
            el.dataset.path = it.path;

            if (this.viewMode === 'grid') {
                el.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;padding:var(--nebula-space-md);border-radius:var(--nebula-radius-sm);background:var(--nebula-bg-secondary);cursor:pointer;min-height:100px;border:1px solid var(--nebula-border);transition:var(--nebula-transition-fast);';

                const icon = document.createElement('div');
                icon.innerHTML = it.isDirectory
                    ? '<span class="material-symbols-outlined" style="font-size:32px;color:var(--nebula-primary);">folder</span>'
                    : '<span class="material-symbols-outlined" style="font-size:32px;color:var(--nebula-text-secondary);">description</span>';

                const name = document.createElement('div');
                name.textContent = it.name;
                name.style.cssText = 'margin-top:var(--nebula-space-xs);text-align:center;font-size:13px;line-height:1.3;word-break:break-word;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;';

                el.appendChild(icon);
                el.appendChild(name);
            } else {
                el.style.cssText = 'display:flex;gap:var(--nebula-space-sm);align-items:center;padding:var(--nebula-space-sm) var(--nebula-space-md);border-radius:var(--nebula-radius-sm);background:var(--nebula-bg-secondary);cursor:pointer;min-height:48px;border:1px solid var(--nebula-border);transition:var(--nebula-transition-fast);';

                const icon = document.createElement('div');
                icon.innerHTML = it.isDirectory
                    ? '<span class="material-symbols-outlined" style="font-size:20px;color:var(--nebula-primary);">folder</span>'
                    : '<span class="material-symbols-outlined" style="font-size:20px;color:var(--nebula-text-secondary);">description</span>';
                icon.style.cssText = 'min-width:24px;display:flex;align-items:center;justify-content:center;';

                const name = document.createElement('div');
                name.textContent = it.name;
                name.style.cssText = 'flex:1;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';

                el.appendChild(icon);
                el.appendChild(name);
            }

            list.appendChild(el);
        }

        // Show message if no items found
        if (items.length === 0) {
            const message = document.createElement('div');
            message.style.cssText = 'grid-column:1/-1;text-align:center;padding:3rem;color:var(--nebula-text-muted);';
            message.textContent = this.searchQuery ? 'No files found matching your search' : 'This folder is empty';
            list.appendChild(message);
        }
    }

    select(path, name) {
        this.selected = path;
        this._els.filename.value = name || path.split('/').pop();
        this._els.list.querySelectorAll('.picker-entry').forEach(e=>e.classList.remove('selected'));
        const sel = this._els.list.querySelector(`[data-path="${path}"]`);
        if (sel) sel.classList.add('selected');
    }

    async showPreviewFor(p) {
        const preview = this._els.preview;
        if (!preview) return;

        preview.innerHTML = '<div style="text-align:center;color:var(--nebula-text-muted);padding:2rem;"><span class="material-symbols-outlined" style="display:block;font-size:32px;margin-bottom:8px;">hourglass_empty</span>Loading preview...</div>';

        try {
            const data = await window.nebula.fs.readFile(p);

            if (data instanceof Uint8Array || (data && data.buffer && data.buffer instanceof ArrayBuffer)) {
                const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
                const blob = new Blob([bytes]);

                // Try to create image preview
                if (typeof createImageBitmap === 'function') {
                    try {
                        const bitmap = await createImageBitmap(blob);
                        const imgEl = document.createElement('canvas');
                        imgEl.style.cssText = 'max-width:100%;max-height:100%;border-radius:var(--nebula-radius-sm);';
                        imgEl.width = bitmap.width;
                        imgEl.height = bitmap.height;
                        const ctx = imgEl.getContext('2d');
                        ctx.drawImage(bitmap, 0, 0);
                        try { if (bitmap && typeof bitmap.close === 'function') bitmap.close(); } catch(e){}

                        const wrapper = document.createElement('div');
                        wrapper.style.cssText = 'text-align:center;padding:1rem;';
                        wrapper.appendChild(imgEl);

                        const info = document.createElement('div');
                        info.style.cssText = 'margin-top:8px;font-size:12px;color:var(--nebula-text-muted);';
                        info.textContent = `${bitmap.width} × ${bitmap.height}`;
                        wrapper.appendChild(info);

                        preview.innerHTML = '';
                        preview.appendChild(wrapper);
                        return;
                    } catch (e) {
                        // fallback to object URL
                    }
                }

                const url = URL.createObjectURL(blob);
                const img = document.createElement('img');
                img.style.cssText = 'max-width:100%;max-height:100%;border-radius:var(--nebula-radius-sm);';
                img.onload = () => { try { URL.revokeObjectURL(url); } catch(e){} };
                img.onerror = () => { try { URL.revokeObjectURL(url); } catch(e){} };
                img.src = url;

                const wrapper = document.createElement('div');
                wrapper.style.cssText = 'text-align:center;padding:1rem;';
                wrapper.appendChild(img);
                preview.innerHTML = '';
                preview.appendChild(wrapper);

            } else if (typeof data === 'string') {
                const wrapper = document.createElement('div');
                wrapper.style.cssText = 'padding:1rem;';

                const header = document.createElement('div');
                header.style.cssText = 'font-weight:600;margin-bottom:8px;color:var(--nebula-text-primary);font-size:14px;';
                header.textContent = 'Text Preview';

                const pre = document.createElement('pre');
                pre.style.cssText = 'white-space:pre-wrap;margin:0;font-size:12px;line-height:1.4;color:var(--nebula-text-secondary);background:var(--nebula-bg-tertiary);padding:12px;border-radius:var(--nebula-radius-sm);border:1px solid var(--nebula-border);overflow:auto;max-height:300px;';
                pre.textContent = data.slice(0, 2000);

                if (data.length > 2000) {
                    const more = document.createElement('div');
                    more.style.cssText = 'margin-top:8px;font-size:11px;color:var(--nebula-text-muted);font-style:italic;';
                    more.textContent = `... and ${data.length - 2000} more characters`;
                    wrapper.appendChild(more);
                }

                wrapper.appendChild(header);
                wrapper.appendChild(pre);
                preview.innerHTML = '';
                preview.appendChild(wrapper);

            } else {
                preview.innerHTML = '<div style="text-align:center;color:var(--nebula-text-muted);padding:2rem;"><span class="material-symbols-outlined" style="display:block;font-size:32px;margin-bottom:8px;">description</span>Cannot preview this file type</div>';
            }
        } catch (err) {
            preview.innerHTML = `<div style="text-align:center;color:var(--nebula-danger);padding:2rem;"><span class="material-symbols-outlined" style="display:block;font-size:32px;margin-bottom:8px;">error</span>Preview failed: ${err.message || err}</div>`;
        }
    }

    // centralized close that avoids double-resolve and always closes the window
    closeAndResolve(val) {
        if (this._closing) return; this._closing = true;

        // call stored resolve first (before closing window to avoid race conditions)
        try {
            if (this._resolve) {
                const r = this._resolve; this._resolve = null; r(val);
            }
        } catch(e) { console.warn('error resolving picker promise', e); }

        // close window after resolving
        try {
            if (window.windowManager && this.windowId) {
                window.windowManager.closeWindow(this.windowId);
            }
        } catch(e) {
            console.warn('error closing picker window', e);
        }
    }

    // Required API for WindowManager
    getTitle() { return this.options.title || 'Picker'; }
    getIcon() { return '📁'; }

    cleanup() {
        // nothing special
    }
}

// expose global helper and override nebula.dialog.openFile to prefer PickerApp
window.PickerApp = PickerApp;

// For backward compatibility: ensure window.NebulaFilePicker.open funnels to PickerApp
window.NebulaFilePicker = window.NebulaFilePicker || { open: (opts)=> PickerApp.open(opts) };

// Wrap the existing window.nebula.dialog.openFile to call PickerApp first when available
try {
    if (window.nebula && window.nebula.dialog && typeof window.nebula.dialog.openFile === 'function') {
        const _nativeOpen = window.nebula.dialog.openFile.bind(window.nebula.dialog);
        window.nebula.dialog.openFile = async (options = {}) => {
            try {
                // prefer PickerApp unless options.forceNative is true
                if (!options.forceNative && window.PickerApp) {
                    const res = await PickerApp.open(options || {});
                    // normalize
                    if (res === null || res === undefined) return { canceled: true, filePaths: [] };
                    if (Array.isArray(res)) return { canceled: false, filePaths: res };
                    return { canceled: false, filePaths: [res] };
                }
            } catch (e) {
                console.warn('PickerApp failed, falling back to native open', e);
            }
            // fallback to native
            try {
                return await _nativeOpen(options);
            } catch (e) { return null; }
        };
    }
} catch (e) { console.warn('PickerApp shim failed', e); }

// also expose convenience alias
window.PickerApp.open = PickerApp.open.bind(PickerApp);
