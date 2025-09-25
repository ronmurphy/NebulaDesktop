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
        const container = document.createElement('div');
        container.className = 'picker-app-container';
        container.style.cssText = 'width:100%;height:100%;display:flex;flex-direction:column;gap:8px;padding:8px;box-sizing:border-box;';
        // Toolbar (view options, show hidden, new folder)
        const header = document.createElement('div');
        header.style.cssText = 'display:flex;align-items:center;gap:12px;padding:8px;border-bottom:1px solid var(--nebula-border);';
        const title = document.createElement('div'); title.textContent = this.options.title || 'Nebula File Picker'; title.style.fontWeight='600';
        const pathEl = document.createElement('div'); pathEl.className='picker-path'; pathEl.style.marginLeft='8px'; pathEl.style.opacity='0.9'; pathEl.style.fontSize='12px';

        const toolbarRight = document.createElement('div');
        toolbarRight.style.cssText = 'margin-left:auto;display:flex;gap:8px;align-items:center;';

        const btnViewToggle = document.createElement('button'); btnViewToggle.textContent = 'Grid'; btnViewToggle.title = 'Toggle Grid/List'; btnViewToggle.className='picker-btn-view';
        const btnShowHidden = document.createElement('button'); btnShowHidden.textContent = 'Show hidden'; btnShowHidden.title = 'Toggle show hidden files'; btnShowHidden.className='picker-btn-hidden';
        const btnNewFolder = document.createElement('button'); btnNewFolder.textContent = 'New Folder'; btnNewFolder.title = 'Create new folder'; btnNewFolder.className='picker-btn-newfolder';

        toolbarRight.appendChild(btnNewFolder);
        toolbarRight.appendChild(btnViewToggle);
        toolbarRight.appendChild(btnShowHidden);

        header.appendChild(title); header.appendChild(pathEl); header.appendChild(toolbarRight);

        // filter select (file type filters)
        const filterSelect = document.createElement('select'); filterSelect.className = 'picker-filter';
        const allOpt = document.createElement('option'); allOpt.value = 'all'; allOpt.textContent = 'All files (*.*)'; filterSelect.appendChild(allOpt);
        if (this.filters && this.filters.length) {
            this.filters.forEach((f, idx)=>{
                const opt = document.createElement('option'); opt.value = String(idx); opt.textContent = f.name ? `${f.name} (*.${(f.extensions||[]).join(',*.')})` : `Filter ${idx+1}`; filterSelect.appendChild(opt);
            });
        }
        // reflect pre-selected active filter
        try { filterSelect.value = this.activeFilter; } catch(e) {}
        filterSelect.addEventListener('change', (e)=>{ this.activeFilter = e.target.value; this.renderEntries(); });
        toolbarRight.appendChild(filterSelect);

        // quick access bar (home, desktop, documents, downloads)
        const quickBar = document.createElement('div'); quickBar.className = 'picker-quickbar'; quickBar.style.cssText = 'display:flex;gap:6px;margin-left:12px;align-items:center;';
        header.appendChild(quickBar);

    // body layout: left quick-access column, main file grid, right preview column
    const body = document.createElement('div'); body.style.cssText = 'flex:1;display:flex;gap:12px;padding:8px;overflow:hidden;';
    const quickCol = document.createElement('div'); quickCol.className = 'picker-quickcol'; quickCol.style.cssText = 'width:160px;display:flex;flex-direction:column;gap:8px;';
    const list = document.createElement('div'); list.className='picker-list';
    // responsive grid: auto-fit columns with min width 160px
    list.style.cssText = 'flex:1;display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px;overflow:auto;padding:8px;background:var(--nebula-bg-primary);border-radius:6px;';
        const side = document.createElement('div'); side.style.cssText='width:260px;display:flex;flex-direction:column;gap:8px;';
        const preview = document.createElement('div'); preview.className='picker-preview'; preview.style.cssText='flex:1;background:var(--nebula-bg-secondary);border-radius:6px;padding:8px;overflow:auto;';
        const sysBtn = document.createElement('button'); sysBtn.textContent='System Picker'; sysBtn.className='picker-system-btn toolbar-btn';
        side.appendChild(preview); side.appendChild(sysBtn);

        body.appendChild(quickCol); body.appendChild(list); body.appendChild(side);

        const footer = document.createElement('div'); footer.style.cssText='display:flex;gap:8px;align-items:center;padding:8px;border-top:1px solid var(--nebula-border);';
    const filename = document.createElement('input'); filename.className='picker-filename'; filename.placeholder = 'filename'; filename.style.cssText='flex:1;padding:6px;border-radius:6px;border:1px solid var(--nebula-border);background:var(--nebula-bg-primary);color:var(--nebula-text-primary);';
    const cancelBtn = document.createElement('button'); cancelBtn.textContent='Cancel'; cancelBtn.className='picker-cancel toolbar-btn';
    const openBtn = document.createElement('button'); openBtn.textContent = this.options.pickType==='save' ? 'Save' : 'Open'; openBtn.className='picker-open toolbar-btn';
        footer.appendChild(filename); footer.appendChild(cancelBtn); footer.appendChild(openBtn);

        container.appendChild(header); container.appendChild(body); container.appendChild(footer);

    // store references
    this._els = { container, list, preview, filename, pathEl, openBtn, cancelBtn, sysBtn, btnViewToggle, btnShowHidden, btnNewFolder, filterSelect, quickBar, quickCol };

    // internal state: hide dotfiles by default unless option showHidden true
    try { this.showHidden = JSON.parse(localStorage.getItem('nebula.picker.showHidden')) ?? !!this.options.showHidden; } catch(e) { this.showHidden = !!this.options.showHidden; }
    // view mode: 'grid' or 'list'
    this.viewMode = 'grid';

        // wire events
    cancelBtn.addEventListener('click', ()=> this.closeAndResolve(null));
        openBtn.addEventListener('click', ()=> {
            if (this.options.pickType==='save') {
                const name = (filename.value||'').trim();
                const final = name ? (this.currentPath.endsWith('/')? this.currentPath+name : this.currentPath+'/'+name) : null;
                this.closeAndResolve(final);
            } else {
                this.closeAndResolve(this.selected || null);
            }
        });

        sysBtn.addEventListener('click', async ()=>{
            try {
                const native = window.nebula && window.nebula.dialog && window.nebula.dialog.openFile;
                if (typeof native === 'function') {
                    const res = await native(this.options || {});
                    // normalize shapes
                    if (res && res.filePaths && res.filePaths.length>0) return this.closeAndResolve(res.filePaths[0]);
                    if (Array.isArray(res) && res.length>0) return this.closeAndResolve(res[0]);
                    if (typeof res === 'string') return this.closeAndResolve(res);
                }
            } catch (e) {
                console.warn('System picker failed', e);
            }
        });

        // toolbar button behaviors
        btnViewToggle.addEventListener('click', ()=>{
            this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
            btnViewToggle.textContent = this.viewMode === 'grid' ? 'Grid' : 'List';
            this.renderEntries();
        });

        btnShowHidden.addEventListener('click', ()=>{
            this.showHidden = !this.showHidden;
            try { localStorage.setItem('nebula.picker.showHidden', JSON.stringify(this.showHidden)); } catch(e) {}
            btnShowHidden.textContent = this.showHidden ? 'Hide hidden' : 'Show hidden';
            this.renderEntries();
        });

        btnNewFolder.addEventListener('click', async ()=>{
            const name = prompt('New folder name:','New Folder');
            if (!name) return;
            const newPath = this.currentPath.endsWith('/') ? this.currentPath + name : this.currentPath + '/' + name;
            try {
                await window.nebula.fs.mkdir(newPath, { recursive: false });
                this.updateStatus('Folder created');
                await this.loadDir(this.currentPath);
            } catch (e) {
                this.updateStatus('Failed to create folder');
                console.warn('mkdir failed', e);
            }
        });

        // preview click handling delegated below by event delegation
        list.addEventListener('click', async (ev)=>{
            const el = ev.target.closest('.picker-entry'); if (!el) return;
            const p = el.dataset.path; if (!p) return;
            const item = this.entries.find(x=>x.path===p);
            if (item && item.isDirectory) {
                await this.loadDir(p);
                return;
            }
            this.select(p, (item && item.name) || p.split('/').pop());
            await this.showPreviewFor(p);
        });

        list.addEventListener('dblclick', (ev)=>{
            const el = ev.target.closest('.picker-entry'); if (!el) return;
            const p = el.dataset.path; if (!p) return;
            const item = this.entries.find(x=>x.path===p);
            if (item && !item.isDirectory) this.closeAndResolve(p);
        });

        // keyboard navigation: arrows, Enter, Esc
        container.tabIndex = 0;
        container.addEventListener('keydown', (e)=>{
            try {
                const focusable = Array.from(this._els.list.querySelectorAll('.picker-entry:not(.picker-up)'));
                if (!focusable.length) return;
                const idx = focusable.findIndex(n=>n.classList.contains('selected'));
                if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                    e.preventDefault();
                    const next = focusable[Math.min(focusable.length-1, Math.max(0, idx+1))];
                    if (next) { next.click(); next.scrollIntoView({block:'nearest'}); }
                } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                    e.preventDefault();
                    const prev = focusable[Math.max(0, (idx===-1?0:idx)-1)];
                    if (prev) { prev.click(); prev.scrollIntoView({block:'nearest'}); }
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (this.selected) this.closeAndResolve(this.selected);
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    this.closeAndResolve(null);
                }
            } catch (err) { console.warn('keyboard nav error', err); }
        });

    // load initial directory
    setTimeout(()=> this.loadDir(this.options.startPath || (window.nebula && window.nebula.fs && window.nebula.fs.getHomeDir? window.nebula.fs.getHomeDir() : '/')), 0);
    setTimeout(()=> this._populateQuickAccess(), 100);

        return container;
    }

    async loadDir(dirPath) {
        this.currentPath = await Promise.resolve(dirPath);
        const { list, pathEl } = this._els;
        pathEl.textContent = this.currentPath;
        list.innerHTML = '<div class="picker-loading">Loading...</div>';

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

    // populate quick access buttons (Home, Desktop, Documents, Downloads)
    async _populateQuickAccess() {
        try {
            const col = this._els && this._els.quickCol;
            if (!col) return;
            const home = await (window.nebula && window.nebula.fs && window.nebula.fs.getHomeDir ? window.nebula.fs.getHomeDir() : '/home');
            const quick = [
                { name: 'Home', path: home },
                { name: 'Desktop', path: (home.endsWith('/')?home:home+'/') + 'Desktop' },
                { name: 'Documents', path: (home.endsWith('/')?home:home+'/') + 'Documents' },
                { name: 'Downloads', path: (home.endsWith('/')?home:home+'/') + 'Downloads' }
            ];
            col.innerHTML = '';
            quick.forEach(q=>{
                const b = document.createElement('button'); b.textContent = q.name; b.title = q.path; b.className='picker-quickbtn toolbar-btn';
                b.addEventListener('click', ()=> this.loadDir(q.path));
                col.appendChild(b);
            });

            // best-effort: try to read GTK bookmarks and show them below quick entries
            const candidates = [
                (home.endsWith('/')?home:home+'/') + '.config/gtk-3.0/bookmarks',
                (home.endsWith('/')?home:home+'/') + '.config/gtk-4.0/bookmarks'
            ];
            for (const c of candidates) {
                try {
                    const raw = await window.nebula.fs.readFile(c);
                    if (!raw) continue;
                    const text = (typeof raw === 'string') ? raw : new TextDecoder().decode(raw);
                    const lines = text.split('\n').map(l=>l.trim()).filter(Boolean);
                    if (!lines.length) continue;
                    const header = document.createElement('div'); header.textContent = 'Bookmarks'; header.style.fontSize='12px'; header.style.opacity='0.85'; header.style.marginTop='8px';
                    col.appendChild(header);
                    lines.forEach(l=>{
                        // bookmarks format: file:///home/user/SomeFolder SomeName
                        const parts = l.split(' ');
                        const url = parts[0];
                        let path = url.replace('file://','');
                        const name = parts.slice(1).join(' ') || (path.split('/').pop() || path);
                        const b = document.createElement('button'); b.textContent = name; b.title = path; b.className='picker-quickbtn toolbar-btn';
                        b.addEventListener('click', ()=> this.loadDir(path));
                        col.appendChild(b);
                    });
                    break; // load first bookmarks file found
                } catch(e) { /* ignore missing files */ }
            }
        } catch(e){ console.warn('populateQuickAccess failed', e); }
    }

    renderEntries() {
        const { list } = this._els;
        list.innerHTML = '';
        if (this.currentPath && this.currentPath !== '/') {
            const up = document.createElement('div'); up.className='picker-entry picker-up'; up.textContent='..'; up.addEventListener('click', ()=>{
                const parent = this.currentPath.split('/').slice(0,-1).join('/') || '/'; this.loadDir(parent);
            }); list.appendChild(up);
        }

        const items = this.entries.filter(it => {
            // hidden handling
            if (!this.showHidden && it.name && it.name.startsWith('.')) return false;
            // always show directories
            if (it.isDirectory) return true;
            // if a filter is active and not 'all', enforce extension matching
            if (this.activeFilter && this.activeFilter !== 'all' && this.filters && this.filters.length) {
                const idx = parseInt(this.activeFilter,10);
                const filt = this.filters[idx];
                if (filt && filt.extensions && filt.extensions.length) {
                    const ext = (it.name||'').split('.').pop().toLowerCase();
                    return filt.extensions.map(e=>e.toLowerCase()).includes(ext);
                }
            }
            return true;
        });

        for (const it of items) {
            const el = document.createElement('div'); el.className='picker-entry'; el.dataset.path = it.path;
            // entry layout
            if (this.viewMode === 'grid') {
                el.style.cssText = 'display:flex;flex-direction:column;align-items:center;padding:12px;border-radius:6px;background:var(--nebula-bg-secondary);cursor:pointer;min-height:72px;';
            } else {
                el.style.cssText = 'display:flex;gap:8px;align-items:center;padding:8px;border-radius:6px;background:var(--nebula-bg-secondary);cursor:pointer;min-height:48px;';
            }
            const icon = document.createElement('div'); icon.textContent = it.isDirectory? '📁':'📄'; icon.style.width='28px'; icon.style.textAlign='center';
            const name = document.createElement('div'); name.textContent = it.name; name.style.flex='1'; name.style.textAlign = this.viewMode === 'grid' ? 'center' : 'left';
            // multiline/truncation: allow up to 2 lines with ellipsis
            name.style.display = '-webkit-box'; name.style.webkitLineClamp = '2'; name.style.webkitBoxOrient = 'vertical'; name.style.overflow = 'hidden'; name.style.textOverflow = 'ellipsis';
            el.appendChild(icon); el.appendChild(name);
            list.appendChild(el);
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
        const preview = this._els.preview; preview.innerHTML = 'Loading preview...';
        try {
            const data = await window.nebula.fs.readFile(p);
            if (data instanceof Uint8Array || (data && data.buffer && data.buffer instanceof ArrayBuffer)) {
                const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
                const blob = new Blob([bytes]);
                const url = URL.createObjectURL(blob);
                const img = document.createElement('img'); img.style.maxWidth='100%'; img.style.maxHeight='100%'; img.src = url; img.onload = ()=> URL.revokeObjectURL(url);
                preview.innerHTML = ''; preview.appendChild(img);
            } else if (typeof data === 'string') {
                const pre = document.createElement('pre'); pre.style.whiteSpace='pre-wrap'; pre.style.margin=0; pre.textContent = data.slice(0,2000);
                preview.innerHTML = ''; preview.appendChild(pre);
            } else {
                preview.innerHTML = '<div>Cannot preview this file</div>';
            }
        } catch (err) {
            preview.innerHTML = `<div class="picker-error">Preview failed: ${err.message||err}</div>`;
        }
    }

    // centralized close that avoids double-resolve and always closes the window
    closeAndResolve(val) {
        if (this._closing) return; this._closing = true;
        // close window first
        try { if (window.windowManager && this.windowId) window.windowManager.close(this.windowId); } catch(e) {}
        // call stored resolve if present
        try {
            if (this._resolve) {
                const r = this._resolve; this._resolve = null; r(val);
            }
        } catch(e) { console.warn('error resolving picker promise', e); }
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
