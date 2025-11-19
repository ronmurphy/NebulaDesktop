// InlineContentManager - Handles inline content rendering (images, editors, etc)
// Part of Nebula Terminal v3.0 - Ultimate Customizable Terminal

class InlineContentManager {
    constructor(paneManager) {
        this.paneManager = paneManager;
        this.activeContent = null;
    }

    // Intercept terminal input to catch special commands
    interceptCommand(input, pane) {
        // Trim and parse command
        const trimmed = input.trim();

        // nip <file> [--inline] - Nebula Inline Picture (default: split mode)
        const nipMatch = trimmed.match(/^nip\s+(.+?)(\s+--inline)?$/);
        if (nipMatch) {
            const filePath = nipMatch[1].trim();
            const useInline = !!nipMatch[2];
            this.openImageViewer(filePath, pane, useInline);
            return true;
        }

        // nie <file> [--inline] - Nebula Inline Editor (default: split mode)
        const nieMatch = trimmed.match(/^nie\s+(.+?)(\s+--inline)?$/);
        if (nieMatch) {
            const filePath = nieMatch[1].trim();
            const useInline = !!nieMatch[2];
            this.openTextEditor(filePath, pane, useInline);
            return true;
        }

        // nid <file> [--inline] - Nebula Inline Developer (Monaco) (default: split mode)
        const nidMatch = trimmed.match(/^nid\s+(.+?)(\s+--inline)?$/);
        if (nidMatch) {
            const filePath = nidMatch[1].trim();
            const useInline = !!nidMatch[2];
            this.openMonacoEditor(filePath, pane, useInline);
            return true;
        }

        // niw <url> [--inline] - Nebula Inline Web (default: split mode)
        const niwMatch = trimmed.match(/^niw\s+(.+?)(\s+--inline)?$/);
        if (niwMatch) {
            const url = niwMatch[1].trim();
            const useInline = !!niwMatch[2];
            this.openWebViewer(url, pane, useInline);
            return true;
        }

        // nfm [path] - Nebula File Manager (always opens in split pane)
        const nfmMatch = trimmed.match(/^nfm(\s+(.+))?$/);
        if (nfmMatch) {
            const dirPath = nfmMatch[2] ? nfmMatch[2].trim() : null;
            this.openFileManager(dirPath, pane);
            return true;
        }

        // ngit - Nebula Git Manager (always opens in split pane)
        const ngitMatch = trimmed.match(/^ngit$/);
        if (ngitMatch) {
            this.openGitManager(pane);
            return true;
        }

        // ndiff <file1> <file2> - Nebula Diff Viewer (always opens in split pane)
        const ndiffMatch = trimmed.match(/^ndiff\s+(.+?)\s+(.+)$/);
        if (ndiffMatch) {
            const file1 = ndiffMatch[1].trim();
            const file2 = ndiffMatch[2].trim();
            this.openDiffViewer(file1, file2, pane);
            return true;
        }

        return false; // Not a special command
    }

    async openImageViewer(filePath, pane, useInline) {
        if (useInline) {
            // Render inline in current pane
            this.renderImageInline(filePath, pane);
        } else {
            // Default: Create new split pane with image viewer
            await this.paneManager.splitPane(pane.id, 'horizontal');
            const newPane = this.paneManager.panes[this.paneManager.panes.length - 1];
            this.renderImageInPane(filePath, newPane);
        }
    }

    renderImageInline(filePath, pane) {
        const imageHtml = `
            <div class="inline-content image-viewer" data-file="${filePath}">
                <div class="inline-header">
                    <span class="inline-title">🖼️ ${filePath}</span>
                    <button class="inline-close" onclick="this.parentElement.parentElement.remove()">×</button>
                </div>
                <div class="inline-body">
                    <img src="file://${filePath}" style="max-width: 100%; height: auto; display: block;">
                </div>
            </div>
        `;

        // Write to terminal as HTML (using xterm's write method)
        pane.term.write('\r\n');

        // Create DOM element and insert after terminal
        const container = pane.element.querySelector('.pane-content');
        const inlineDiv = document.createElement('div');
        inlineDiv.innerHTML = imageHtml;
        container.appendChild(inlineDiv.firstElementChild);

        pane.term.write(`\x1b[32m✓ Image viewer opened: ${filePath}\x1b[0m\r\n$ `);
    }

    renderImageInPane(filePath, pane) {
        // Replace pane content with image viewer
        const content = pane.element.querySelector('.pane-content');
        content.innerHTML = `
            <div class="inline-content image-viewer fullscreen" data-file="${filePath}">
                <div class="inline-header">
                    <span class="inline-title">🖼️ ${filePath}</span>
                    <button class="inline-close" onclick="window.tabManager.getActiveTab().paneManager.closePane(${pane.id})">×</button>
                </div>
                <div class="inline-body" style="flex: 1; display: flex; align-items: center; justify-content: center; overflow: auto;">
                    <img src="file://${filePath}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                </div>
            </div>
        `;
    }

    async openTextEditor(filePath, pane, useInline) {
        // Load file content
        const content = await this.loadFile(filePath);

        if (useInline) {
            // Render inline in current pane
            this.renderTextEditorInline(filePath, content, pane);
        } else {
            // Default: Create new split pane with text editor
            await this.paneManager.splitPane(pane.id, 'horizontal');
            const newPane = this.paneManager.panes[this.paneManager.panes.length - 1];
            this.renderTextEditorInPane(filePath, content, newPane);
        }
    }

    renderTextEditorInline(filePath, content, pane) {
        const editorId = `editor-${Date.now()}`;
        const editorHtml = `
            <div class="inline-content text-editor" data-file="${filePath}">
                <div class="inline-header">
                    <span class="inline-title">📝 ${filePath}</span>
                    <div class="inline-actions">
                        <button class="inline-btn" onclick="window.tabManager.getActiveTab().paneManager.inlineContentManager.saveTextEditor('${editorId}', '${filePath}')">Save</button>
                        <button class="inline-close" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
                    </div>
                </div>
                <div class="inline-body">
                    <textarea id="${editorId}" class="simple-editor">${content}</textarea>
                </div>
            </div>
        `;

        const container = pane.element.querySelector('.pane-content');
        const inlineDiv = document.createElement('div');
        inlineDiv.innerHTML = editorHtml;
        container.appendChild(inlineDiv.firstElementChild);

        pane.term.write(`\r\n\x1b[32m✓ Text editor opened: ${filePath}\x1b[0m\r\n$ `);
    }

    renderTextEditorInPane(filePath, content, pane) {
        const editorId = `editor-${Date.now()}`;
        const contentDiv = pane.element.querySelector('.pane-content');
        contentDiv.innerHTML = `
            <div class="inline-content text-editor fullscreen" data-file="${filePath}">
                <div class="inline-header">
                    <span class="inline-title">📝 ${filePath}</span>
                    <div class="inline-actions">
                        <button class="inline-btn" onclick="window.tabManager.getActiveTab().paneManager.inlineContentManager.saveTextEditor('${editorId}', '${filePath}')">Save (Ctrl+S)</button>
                        <button class="inline-close" onclick="window.tabManager.getActiveTab().paneManager.closePane(${pane.id})">×</button>
                    </div>
                </div>
                <div class="inline-body" style="flex: 1;">
                    <textarea id="${editorId}" class="simple-editor" style="width: 100%; height: 100%;">${content}</textarea>
                </div>
            </div>
        `;

        // Add Ctrl+S handler
        const textarea = document.getElementById(editorId);
        textarea.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveTextEditor(editorId, filePath);
            }
        });
    }

    async openMonacoEditor(filePath, pane, useInline) {
        // Check if Monaco is loaded
        if (!window.monaco) {
            pane.term.write('\r\n\x1b[33m⚠ Monaco Editor not loaded. Loading from CDN...\x1b[0m\r\n');
            try {
                await this.loadMonaco();
                pane.term.write('\x1b[32m✓ Monaco Editor loaded successfully!\x1b[0m\r\n');
            } catch (error) {
                pane.term.write(`\x1b[31m✗ Failed to load Monaco Editor: ${error.message}\x1b[0m\r\n$ `);
                console.error('Monaco load failed:', error);
                return;
            }
        }

        const content = await this.loadFile(filePath);

        if (useInline) {
            // Render inline in current pane
            this.renderMonacoInline(filePath, content, pane);
        } else {
            // Default: Create new split pane with Monaco editor
            await this.paneManager.splitPane(pane.id, 'horizontal');
            const newPane = this.paneManager.panes[this.paneManager.panes.length - 1];
            this.renderMonacoInPane(filePath, content, newPane);
        }
    }

    renderMonacoInline(filePath, content, pane) {
        const editorId = `monaco-${Date.now()}`;
        const editorHtml = `
            <div class="inline-content monaco-editor" data-file="${filePath}">
                <div class="inline-header">
                    <span class="inline-title">💻 ${filePath}</span>
                    <div class="inline-actions">
                        <button class="inline-btn" onclick="window.tabManager.getActiveTab().paneManager.inlineContentManager.saveMonaco('${editorId}', '${filePath}')">Save (Ctrl+S)</button>
                        <button class="inline-close" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
                    </div>
                </div>
                <div class="inline-body" style="height: 400px;">
                    <div id="${editorId}" style="width: 100%; height: 100%;"></div>
                </div>
            </div>
        `;

        const container = pane.element.querySelector('.pane-content');
        const inlineDiv = document.createElement('div');
        inlineDiv.innerHTML = editorHtml;
        container.appendChild(inlineDiv.firstElementChild);

        // Wait for DOM to be ready, then create Monaco editor
        setTimeout(() => {
            const language = this.detectLanguage(filePath);
            const editor = monaco.editor.create(document.getElementById(editorId), {
                value: content,
                language: language,
                theme: 'vs-dark',
                automaticLayout: true,
                minimap: { enabled: false },
                fontSize: 14
            });

            // Store editor instance
            window[`monacoInstance_${editorId}`] = editor;

            // Add Ctrl+S handler
            editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, () => {
                this.saveMonaco(editorId, filePath);
            });

            pane.term.write(`\r\n\x1b[32m✓ Monaco editor opened: ${filePath}\x1b[0m\r\n$ `);
        }, 100);
    }

    renderMonacoInPane(filePath, content, pane) {
        const editorId = `monaco-${Date.now()}`;
        const contentDiv = pane.element.querySelector('.pane-content');
        contentDiv.innerHTML = `
            <div class="inline-content monaco-editor fullscreen" data-file="${filePath}">
                <div class="inline-header">
                    <span class="inline-title">💻 ${filePath}</span>
                    <div class="inline-actions">
                        <button class="inline-btn" onclick="window.tabManager.getActiveTab().paneManager.inlineContentManager.saveMonaco('${editorId}', '${filePath}')">Save (Ctrl+S)</button>
                        <button class="inline-close" onclick="window.tabManager.getActiveTab().paneManager.closePane(${pane.id})">×</button>
                    </div>
                </div>
                <div class="inline-body" style="flex: 1;">
                    <div id="${editorId}" style="width: 100%; height: 100%;"></div>
                </div>
            </div>
        `;

        // Wait for DOM, then create Monaco editor
        setTimeout(() => {
            const language = this.detectLanguage(filePath);
            const editor = monaco.editor.create(document.getElementById(editorId), {
                value: content,
                language: language,
                theme: 'vs-dark',
                automaticLayout: true,
                minimap: { enabled: true },
                fontSize: 14
            });

            // Store editor instance
            window[`monacoInstance_${editorId}`] = editor;

            // Add Ctrl+S handler
            editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, () => {
                this.saveMonaco(editorId, filePath);
            });
        }, 100);
    }

    async openWebViewer(url, pane, useInline) {
        // Ensure URL has protocol
        if (!url.match(/^https?:\/\//)) {
            url = 'https://' + url;
        }

        if (useInline) {
            // Render inline in current pane
            this.renderWebViewInline(url, pane);
        } else {
            // Default: Create new split pane with web viewer
            await this.paneManager.splitPane(pane.id, 'horizontal');
            const newPane = this.paneManager.panes[this.paneManager.panes.length - 1];
            this.renderWebViewInPane(url, newPane);
        }
    }

    renderWebViewInline(url, pane) {
        const viewerId = `webview-${Date.now()}`;
        const viewerHtml = `
            <div class="inline-content web-viewer" data-url="${url}">
                <div class="inline-header">
                    <span class="inline-title">🌐 ${url}</span>
                    <button class="inline-close" onclick="this.parentElement.parentElement.remove()">×</button>
                </div>
                <div class="inline-body" style="flex: 1;">
                    <webview id="${viewerId}" src="${url}" style="width: 100%; height: 100%;"></webview>
                </div>
            </div>
        `;

        const container = pane.element.querySelector('.pane-content');
        const inlineDiv = document.createElement('div');
        inlineDiv.innerHTML = viewerHtml;
        container.appendChild(inlineDiv.firstElementChild);

        pane.term.write(`\r\n\x1b[32m✓ Web viewer opened: ${url}\x1b[0m\r\n$ `);
    }

    renderWebViewInPane(url, pane) {
        const viewerId = `webview-${Date.now()}`;
        const contentDiv = pane.element.querySelector('.pane-content');

        contentDiv.innerHTML = `
            <div class="inline-content web-viewer fullscreen" data-url="${url}">
                <div class="inline-header">
                    <div class="web-nav-controls">
                        <button class="inline-btn" onclick="document.getElementById('${viewerId}').goBack()" title="Back">←</button>
                        <button class="inline-btn" onclick="document.getElementById('${viewerId}').goForward()" title="Forward">→</button>
                        <button class="inline-btn" onclick="document.getElementById('${viewerId}').reload()" title="Reload">⟳</button>
                        <input type="text" id="${viewerId}-url" value="${url}" class="web-url-bar"
                            onkeydown="if(event.key==='Enter'){document.getElementById('${viewerId}').src=this.value}">
                    </div>
                    <button class="inline-close" onclick="window.tabManager.getActiveTab().paneManager.closePane(${pane.id})">×</button>
                </div>
                <div class="inline-body" style="flex: 1;">
                    <webview id="${viewerId}" src="${url}" style="width: 100%; height: 100%;"></webview>
                </div>
            </div>
        `;

        // Update URL bar when navigation happens
        const webview = document.getElementById(viewerId);
        const urlBar = document.getElementById(`${viewerId}-url`);

        webview.addEventListener('did-navigate', (e) => {
            urlBar.value = e.url;
        });

        webview.addEventListener('did-navigate-in-page', (e) => {
            urlBar.value = e.url;
        });
    }

    async loadMonaco() {
        return new Promise((resolve, reject) => {
            // Check if already loading
            if (this.monacoLoading) {
                return resolve();
            }
            this.monacoLoading = true;

            // Load Monaco from CDN using AMD loader
            const loaderScript = document.createElement('script');
            loaderScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/loader.min.js';

            loaderScript.onload = () => {
                // Monaco's loader creates a global 'require' object
                if (window.require) {
                    window.require.config({
                        paths: {
                            vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs'
                        }
                    });

                    window.require(['vs/editor/editor.main'], () => {
                        console.log('✓ Monaco Editor loaded successfully');
                        this.monacoLoading = false;
                        resolve();
                    }, (err) => {
                        console.error('Monaco loading error:', err);
                        this.monacoLoading = false;
                        reject(err);
                    });
                } else {
                    console.error('Monaco loader did not create require function');
                    this.monacoLoading = false;
                    reject(new Error('Monaco loader failed'));
                }
            };

            loaderScript.onerror = (err) => {
                console.error('Failed to load Monaco loader script:', err);
                this.monacoLoading = false;
                reject(err);
            };

            document.head.appendChild(loaderScript);
        });
    }

    detectLanguage(filePath) {
        const ext = filePath.split('.').pop().toLowerCase();
        const langMap = {
            'js': 'javascript',
            'ts': 'typescript',
            'py': 'python',
            'rb': 'ruby',
            'java': 'java',
            'cpp': 'cpp',
            'c': 'c',
            'h': 'cpp',
            'cs': 'csharp',
            'go': 'go',
            'rs': 'rust',
            'php': 'php',
            'html': 'html',
            'css': 'css',
            'json': 'json',
            'xml': 'xml',
            'md': 'markdown',
            'sh': 'shell',
            'bash': 'shell',
            'sql': 'sql'
        };
        return langMap[ext] || 'plaintext';
    }

    async loadFile(filePath) {
        try {
            if (window.fileAPI && window.fileAPI.readFile) {
                const result = await window.fileAPI.readFile(filePath);
                if (result.success) {
                    return result.content;
                } else {
                    throw new Error(result.error || 'Failed to read file');
                }
            } else {
                throw new Error('File API not available');
            }
        } catch (error) {
            console.error('Failed to load file:', error);
            return `# Error loading file: ${filePath}\n# ${error.message}`;
        }
    }

    async saveTextEditor(editorId, filePath) {
        const textarea = document.getElementById(editorId);
        if (!textarea) return;

        const content = textarea.value;
        await this.saveFile(filePath, content);
    }

    async saveMonaco(editorId, filePath) {
        const editor = window[`monacoInstance_${editorId}`];
        if (!editor) return;

        const content = editor.getValue();
        await this.saveFile(filePath, content);
    }

    async saveFile(filePath, content) {
        // Use file API to save
        if (window.fileAPI && window.fileAPI.saveFile) {
            try {
                await window.fileAPI.saveFile(filePath, content);
                console.log(`✓ Saved: ${filePath}`);
                // Show success message in active terminal
                const activePane = this.paneManager.getActivePane();
                if (activePane && activePane.term) {
                    activePane.term.write(`\r\n\x1b[32m✓ Saved: ${filePath}\x1b[0m\r\n$ `);
                }
            } catch (error) {
                console.error('Save failed:', error);
                const activePane = this.paneManager.getActivePane();
                if (activePane && activePane.term) {
                    activePane.term.write(`\r\n\x1b[31m✗ Save failed: ${error.message}\x1b[0m\r\n$ `);
                }
            }
        } else {
            alert('File saving not available. Running in Electron?');
        }
    }

    // ===== FILE MANAGER =====

    async openFileManager(dirPath, pane) {
        // Get home directory from terminal info
        const terminalInfo = await window.terminal.info();
        const homeDir = terminalInfo.home;

        // If no path specified, use pane's current working directory
        if (!dirPath) {
            dirPath = pane.cwd || homeDir;
        }

        // Resolve relative paths
        if (!dirPath.startsWith('/')) {
            const basePath = pane.cwd || homeDir;
            dirPath = basePath + '/' + dirPath;
        }

        // Create new split pane with file manager
        await this.paneManager.splitPane(pane.id, 'horizontal');
        const newPane = this.paneManager.panes[this.paneManager.panes.length - 1];

        // Store file manager state in the pane
        newPane.fileManagerState = {
            currentPath: dirPath,
            viewMode: 'list', // 'list' or 'grid'
            history: [dirPath],
            historyIndex: 0,
            showHidden: false,
            sortBy: 'name-asc',
            searchQuery: '',
            allItems: [], // Store all items for search/filter
            filteredItems: [], // Items after filter/sort
            selectedIndex: 0, // Currently selected item for keyboard nav
            selectedFiles: [], // Multi-select: array of selected file paths
            contextMenu: null // Context menu element reference
        };

        await this.renderFileManager(newPane);
    }

    async renderFileManager(pane) {
        const state = pane.fileManagerState;
        const managerId = `filemgr-${pane.id}`;

        // Read directory contents
        let items = [];
        let error = null;

        try {
            const result = await window.fileAPI.readDir(state.currentPath);
            if (result.success) {
                items = result.items;

                // Store all items for search/filter
                state.allItems = items;

                // Filter hidden files if needed
                if (!state.showHidden) {
                    items = items.filter(item => !item.name.startsWith('.'));
                }

                // Apply search filter
                if (state.searchQuery) {
                    const query = state.searchQuery.toLowerCase();
                    items = items.filter(item => item.name.toLowerCase().includes(query));
                }

                // Sort based on sortBy setting
                items = this.sortFileItems(items, state.sortBy);

                // Store filtered items for keyboard navigation
                state.filteredItems = items;

                // Ensure selected index is in bounds
                if (state.selectedIndex >= items.length) {
                    state.selectedIndex = Math.max(0, items.length - 1);
                }
            } else {
                error = result.error;
            }
        } catch (err) {
            error = err.message;
        }

        // Replace pane content with file manager
        const content = pane.element.querySelector('.pane-content');
        content.innerHTML = `
            <div class="file-manager" id="${managerId}" data-pane-id="${pane.id}" tabindex="0">
                <div class="fm-header">
                    <div class="fm-nav-buttons">
                        <button class="fm-btn" onclick="window.fileManagerGoBack(${pane.id})" title="Back" ${state.historyIndex === 0 ? 'disabled' : ''}>←</button>
                        <button class="fm-btn" onclick="window.fileManagerGoForward(${pane.id})" title="Forward" ${state.historyIndex === state.history.length - 1 ? 'disabled' : ''}>→</button>
                        <button class="fm-btn" onclick="window.fileManagerGoUp(${pane.id})" title="Up">↑</button>
                        <button class="fm-btn" onclick="window.fileManagerRefresh(${pane.id})" title="Refresh">⟳</button>
                    </div>
                    <div class="fm-search-container">
                        <input type="text" class="fm-search-input" id="fm-search-${pane.id}" placeholder="🔍 Search files..." value="${state.searchQuery}"
                            oninput="window.fileManagerSearch(${pane.id}, this.value)">
                    </div>
                    <div class="fm-controls">
                        <select class="fm-sort-select" onchange="window.fileManagerSort(${pane.id}, this.value)" title="Sort by">
                            <option value="name-asc" ${state.sortBy === 'name-asc' ? 'selected' : ''}>Name ↑</option>
                            <option value="name-desc" ${state.sortBy === 'name-desc' ? 'selected' : ''}>Name ↓</option>
                            <option value="size-asc" ${state.sortBy === 'size-asc' ? 'selected' : ''}>Size ↑</option>
                            <option value="size-desc" ${state.sortBy === 'size-desc' ? 'selected' : ''}>Size ↓</option>
                            <option value="date-asc" ${state.sortBy === 'date-asc' ? 'selected' : ''}>Date ↑</option>
                            <option value="date-desc" ${state.sortBy === 'date-desc' ? 'selected' : ''}>Date ↓</option>
                            <option value="type-asc" ${state.sortBy === 'type-asc' ? 'selected' : ''}>Type ↑</option>
                            <option value="type-desc" ${state.sortBy === 'type-desc' ? 'selected' : ''}>Type ↓</option>
                        </select>
                        <button class="fm-btn" onclick="window.fileManagerToggleView(${pane.id})" title="Toggle View">${state.viewMode === 'list' ? '⊞' : '☰'}</button>
                        <button class="fm-btn" onclick="window.fileManagerToggleHidden(${pane.id})" title="Show/Hide Hidden Files">${state.showHidden ? '👁️' : '👁️‍🗨️'}</button>
                        <button class="fm-btn fm-terminal-btn" onclick="window.fileManagerOpenTerminal(${pane.id})" title="Open Terminal Here">⌘</button>
                    </div>
                </div>
                ${state.selectedFiles.length > 0 ? this.renderMultiSelectToolbar(pane.id, state.selectedFiles.length) : ''}
                <div class="fm-breadcrumb">
                    ${this.renderBreadcrumb(state.currentPath, pane.id)}
                </div>
                <div class="fm-content ${state.viewMode === 'grid' ? 'fm-grid-view' : 'fm-list-view'}">
                    ${error ? `<div class="fm-error">⚠️ Error: ${error}</div>` : this.renderFileList(items, state.viewMode, pane.id, state.selectedIndex, state.selectedFiles)}
                </div>
            </div>
        `;

        // Add keyboard navigation
        const fileManagerEl = document.getElementById(managerId);
        if (fileManagerEl) {
            fileManagerEl.addEventListener('keydown', (e) => {
                window.fileManagerHandleKeyboard(pane.id, e);
            });

            // Auto-focus file manager for keyboard nav
            fileManagerEl.focus();
        }
    }

    renderBreadcrumb(path, paneId) {
        const parts = path.split('/').filter(p => p);
        let breadcrumb = `<span class="fm-breadcrumb-part" onclick="window.fileManagerNavigate('/', ${paneId})">📁 /</span>`;

        let currentPath = '';
        parts.forEach((part, index) => {
            currentPath += '/' + part;
            const thisPath = currentPath;
            breadcrumb += ` <span class="fm-breadcrumb-separator">/</span> <span class="fm-breadcrumb-part" onclick="window.fileManagerNavigate('${thisPath}', ${paneId})">${part}</span>`;
        });

        return breadcrumb;
    }

    renderMultiSelectToolbar(paneId, selectedCount) {
        return `
            <div class="fm-multiselect-toolbar">
                <span class="fm-selected-count">${selectedCount} item${selectedCount > 1 ? 's' : ''} selected</span>
                <div class="fm-multiselect-actions">
                    <button class="fm-btn" onclick="window.fileManagerCopySelected(${paneId})" title="Copy to...">📋 Copy</button>
                    <button class="fm-btn" onclick="window.fileManagerMoveSelected(${paneId})" title="Move to...">📦 Move</button>
                    <button class="fm-btn fm-delete-btn" onclick="window.fileManagerDeleteSelected(${paneId})" title="Delete">🗑️ Delete</button>
                    <button class="fm-btn" onclick="window.fileManagerClearSelection(${paneId})" title="Clear">✖ Clear</button>
                </div>
            </div>
        `;
    }

    renderFileList(items, viewMode, paneId, selectedIndex, selectedFiles) {
        if (items.length === 0) {
            return '<div class="fm-empty">📭 Empty folder</div>';
        }

        if (viewMode === 'list') {
            return items.map((item, index) => {
                const icon = this.getFileIcon(item);
                const size = item.isDirectory ? '' : this.formatSize(item.size);
                const date = item.modified ? new Date(item.modified).toLocaleDateString() : '';
                const selectedClass = index === selectedIndex ? ' fm-item-selected' : '';
                const isChecked = selectedFiles.includes(item.path);
                const checkedClass = isChecked ? ' fm-item-checked' : '';

                return `
                    <div class="fm-item fm-list-item${selectedClass}${checkedClass}" data-path="${item.path}" data-index="${index}"
                         onclick="window.fileManagerSelectItem(${paneId}, ${index})"
                         ondblclick="window.fileManagerItemDoubleClick('${item.path}', ${item.isDirectory}, ${paneId})"
                         oncontextmenu="window.fileManagerContextMenu(event, ${paneId}, '${item.path}', ${item.isDirectory})">
                        <input type="checkbox" class="fm-checkbox" ${isChecked ? 'checked' : ''}
                               onclick="event.stopPropagation(); window.fileManagerToggleSelect(${paneId}, '${item.path}')">
                        <span class="fm-item-icon">${icon}</span>
                        <span class="fm-item-name">${item.name}</span>
                        <span class="fm-item-size">${size}</span>
                        <span class="fm-item-date">${date}</span>
                    </div>
                `;
            }).join('');
        } else {
            // Grid view
            return items.map((item, index) => {
                const icon = this.getFileIcon(item);
                const thumbnail = this.shouldShowThumbnail(item) ? `<img src="file://${item.path}" class="fm-thumbnail" onerror="this.style.display='none'">` : '';
                const selectedClass = index === selectedIndex ? ' fm-item-selected' : '';
                const isChecked = selectedFiles.includes(item.path);
                const checkedClass = isChecked ? ' fm-item-checked' : '';

                return `
                    <div class="fm-item fm-grid-item${selectedClass}${checkedClass}" data-path="${item.path}" data-index="${index}"
                         onclick="window.fileManagerSelectItem(${paneId}, ${index})"
                         ondblclick="window.fileManagerItemDoubleClick('${item.path}', ${item.isDirectory}, ${paneId})"
                         oncontextmenu="window.fileManagerContextMenu(event, ${paneId}, '${item.path}', ${item.isDirectory})">
                        <input type="checkbox" class="fm-checkbox fm-checkbox-grid" ${isChecked ? 'checked' : ''}
                               onclick="event.stopPropagation(); window.fileManagerToggleSelect(${paneId}, '${item.path}')">
                        <div class="fm-grid-icon">
                            ${thumbnail || `<span class="fm-item-icon-large">${icon}</span>`}
                        </div>
                        <div class="fm-grid-name">${item.name}</div>
                    </div>
                `;
            }).join('');
        }
    }

    getFileIcon(item) {
        if (item.isDirectory) return '📁';

        const ext = item.name.split('.').pop().toLowerCase();
        const iconMap = {
            // Images
            png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️', svg: '🖼️', webp: '🖼️',
            // Code
            js: '📜', ts: '📜', jsx: '📜', tsx: '📜', py: '🐍', java: '☕', cpp: '⚙️', c: '⚙️', go: '🔷',
            html: '🌐', css: '🎨', scss: '🎨', less: '🎨',
            // Documents
            pdf: '📕', doc: '📘', docx: '📘', txt: '📄', md: '📝',
            // Archives
            zip: '📦', tar: '📦', gz: '📦', rar: '📦',
            // Media
            mp3: '🎵', wav: '🎵', mp4: '🎬', avi: '🎬', mov: '🎬',
            // Config
            json: '⚙️', yaml: '⚙️', yml: '⚙️', toml: '⚙️', xml: '⚙️'
        };

        return iconMap[ext] || '📄';
    }

    shouldShowThumbnail(item) {
        if (item.isDirectory) return false;
        const ext = item.name.split('.').pop().toLowerCase();
        return ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext);
    }

    formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 10) / 10 + ' ' + sizes[i];
    }

    // ===== GIT MANAGER =====

    async openGitManager(pane) {
        // Create new split pane with git manager
        await this.paneManager.splitPane(pane.id, 'horizontal');
        const newPane = this.paneManager.panes[this.paneManager.panes.length - 1];

        // Store git manager state in the pane
        newPane.gitManagerState = {
            repoPath: pane.cwd || '.',
            status: null,
            branches: [],
            currentBranch: '',
            stagedFiles: [],
            unstagedFiles: [],
            untrackedFiles: []
        };

        await this.renderGitManager(newPane);
    }

    async renderGitManager(pane) {
        const state = pane.gitManagerState;
        const managerId = `gitmgr-${pane.id}`;

        // Get git status
        try {
            await this.loadGitStatus(pane);
        } catch (error) {
            console.error('Git status failed:', error);
        }

        // Replace pane content with git manager
        const content = pane.element.querySelector('.pane-content');
        content.innerHTML = `
            <div class="git-manager" id="${managerId}" data-pane-id="${pane.id}">
                <div class="git-header">
                    <div class="git-title">
                        <span class="git-icon">🌳</span>
                        <span>Git Manager</span>
                    </div>
                    <div class="git-branch-selector">
                        <span>Branch:</span>
                        <select class="git-branch-select" onchange="window.gitManagerSwitchBranch(${pane.id}, this.value)">
                            ${state.branches.map(b => `<option value="${b}" ${b === state.currentBranch ? 'selected' : ''}>${b}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="git-toolbar">
                    <button class="git-btn git-btn-primary" onclick="window.gitManagerStageAll(${pane.id})">📥 Stage All</button>
                    <button class="git-btn" onclick="window.gitManagerUnstageAll(${pane.id})">📤 Unstage All</button>
                    <button class="git-btn git-btn-primary" onclick="window.gitManagerCommit(${pane.id})">✅ Commit</button>
                    <button class="git-btn git-btn-success" onclick="window.gitManagerPush(${pane.id})">⬆️ Push</button>
                    <button class="git-btn" onclick="window.gitManagerPull(${pane.id})">⬇️ Pull</button>
                    <button class="git-btn" onclick="window.gitManagerRefresh(${pane.id})">⟳</button>
                </div>
                <div class="git-content">
                    ${this.renderGitFileList(state, pane.id)}
                </div>
            </div>
        `;
    }

    async loadGitStatus(pane) {
        const state = pane.gitManagerState;

        // Run git status --porcelain
        const statusResult = await this.runGitCommand(state.repoPath, ['status', '--porcelain']);
        const branchResult = await this.runGitCommand(state.repoPath, ['branch']);
        const branchesResult = await this.runGitCommand(state.repoPath, ['branch', '-a']);

        // Parse current branch
        const branchLines = branchResult.split('\n');
        state.currentBranch = branchLines.find(l => l.startsWith('*'))?.replace('* ', '').trim() || 'main';

        // Parse all branches
        state.branches = branchesResult.split('\n')
            .filter(l => l.trim())
            .map(l => l.replace('* ', '').trim())
            .filter(l => !l.includes('->'))
            .map(l => l.replace('remotes/origin/', ''))
            .filter((v, i, a) => a.indexOf(v) === i); // unique

        // Parse status
        state.stagedFiles = [];
        state.unstagedFiles = [];
        state.untrackedFiles = [];

        const lines = statusResult.split('\n').filter(l => l.trim());
        for (const line of lines) {
            const status = line.substring(0, 2);
            const file = line.substring(3);

            if (status[0] !== ' ' && status[0] !== '?') {
                // Staged
                state.stagedFiles.push({ file, status: status[0] });
            }
            if (status[1] !== ' ' && status[1] !== '?') {
                // Unstaged
                state.unstagedFiles.push({ file, status: status[1] });
            }
            if (status === '??') {
                // Untracked
                state.untrackedFiles.push({ file });
            }
        }
    }

    async runGitCommand(cwd, args) {
        return new Promise((resolve, reject) => {
            const { spawn } = require('child_process');
            const proc = spawn('git', args, { cwd });

            let stdout = '';
            let stderr = '';

            proc.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            proc.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            proc.on('close', (code) => {
                if (code === 0) {
                    resolve(stdout);
                } else {
                    reject(new Error(stderr || `Git command failed with code ${code}`));
                }
            });
        });
    }

    renderGitFileList(state, paneId) {
        let html = '';

        // Staged files
        if (state.stagedFiles.length > 0) {
            html += '<div class="git-section">';
            html += '<div class="git-section-header">📦 Staged Changes (' + state.stagedFiles.length + ')</div>';
            html += state.stagedFiles.map(f => `
                <div class="git-file-item git-staged">
                    <input type="checkbox" class="git-checkbox" checked
                           onclick="window.gitManagerUnstageFile(${paneId}, '${f.file}')">
                    <span class="git-status">${this.getGitStatusIcon(f.status)}</span>
                    <span class="git-filename">${f.file}</span>
                </div>
            `).join('');
            html += '</div>';
        }

        // Unstaged files
        if (state.unstagedFiles.length > 0) {
            html += '<div class="git-section">';
            html += '<div class="git-section-header">📝 Unstaged Changes (' + state.unstagedFiles.length + ')</div>';
            html += state.unstagedFiles.map(f => `
                <div class="git-file-item git-unstaged">
                    <input type="checkbox" class="git-checkbox"
                           onclick="window.gitManagerStageFile(${paneId}, '${f.file}')">
                    <span class="git-status">${this.getGitStatusIcon(f.status)}</span>
                    <span class="git-filename">${f.file}</span>
                </div>
            `).join('');
            html += '</div>';
        }

        // Untracked files
        if (state.untrackedFiles.length > 0) {
            html += '<div class="git-section">';
            html += '<div class="git-section-header">❓ Untracked Files (' + state.untrackedFiles.length + ')</div>';
            html += state.untrackedFiles.map(f => `
                <div class="git-file-item git-untracked">
                    <input type="checkbox" class="git-checkbox"
                           onclick="window.gitManagerStageFile(${paneId}, '${f.file}')">
                    <span class="git-status">➕</span>
                    <span class="git-filename">${f.file}</span>
                </div>
            `).join('');
            html += '</div>';
        }

        if (state.stagedFiles.length === 0 && state.unstagedFiles.length === 0 && state.untrackedFiles.length === 0) {
            html = '<div class="git-empty">✨ Working tree clean!</div>';
        }

        return html;
    }

    getGitStatusIcon(status) {
        const icons = {
            'A': '➕',  // Added
            'M': '📝',  // Modified
            'D': '🗑️',  // Deleted
            'R': '🔄',  // Renamed
            'C': '📋',  // Copied
            'U': '⚠️'   // Updated but unmerged
        };
        return icons[status] || '❓';
    }

    sortFileItems(items, sortBy) {
        const [field, direction] = sortBy.split('-');
        const ascending = direction === 'asc';

        return items.sort((a, b) => {
            // Always put directories first in list view
            if (a.isDirectory && !b.isDirectory) return -1;
            if (!a.isDirectory && b.isDirectory) return 1;

            let compareValue = 0;

            switch (field) {
                case 'name':
                    compareValue = a.name.localeCompare(b.name);
                    break;
                case 'size':
                    compareValue = (a.size || 0) - (b.size || 0);
                    break;
                case 'date':
                    const dateA = a.modified ? new Date(a.modified).getTime() : 0;
                    const dateB = b.modified ? new Date(b.modified).getTime() : 0;
                    compareValue = dateA - dateB;
                    break;
                case 'type':
                    const extA = a.name.split('.').pop().toLowerCase();
                    const extB = b.name.split('.').pop().toLowerCase();
                    compareValue = extA.localeCompare(extB);
                    break;
            }

            return ascending ? compareValue : -compareValue;
        });
    }

    // ==================== DIFF VIEWER ====================

    async openDiffViewer(file1, file2, pane) {
        try {
            await this.paneManager.splitPane(pane.id, 'horizontal');
            const newPane = this.paneManager.panes[this.paneManager.panes.length - 1];

            newPane.diffViewerState = {
                file1,
                file2,
                content1: null,
                content2: null,
                diff: null
            };

            await this.renderDiffViewer(newPane);
        } catch (error) {
            console.error('Failed to open diff viewer:', error);
            pane.term.writeln(`\r\n\x1b[31mError: Failed to open diff viewer: ${error.message}\x1b[0m\r\n`);
        }
    }

    async renderDiffViewer(pane) {
        const state = pane.diffViewerState;

        // Read both files
        try {
            state.content1 = await window.fileAPI.readFile(state.file1);
            state.content2 = await window.fileAPI.readFile(state.file2);
            state.diff = this.generateUnifiedDiff(state.content1, state.content2, state.file1, state.file2);
        } catch (error) {
            console.error('Failed to read files for diff:', error);
            pane.element.innerHTML = `
                <div class="diff-viewer">
                    <div class="diff-header">
                        <h3>⚠️ Diff Viewer - Error</h3>
                    </div>
                    <div class="diff-error">
                        Failed to read files: ${error.message}
                    </div>
                </div>
            `;
            return;
        }

        // Render diff viewer UI
        const html = `
            <div class="diff-viewer">
                <div class="diff-header">
                    <h3>🔍 Diff Viewer</h3>
                    <div class="diff-file-names">
                        <span class="diff-file-label">📄 ${state.file1}</span>
                        <span class="diff-vs">vs</span>
                        <span class="diff-file-label">📄 ${state.file2}</span>
                    </div>
                </div>
                <div class="diff-toolbar">
                    <button class="diff-btn" onclick="window.diffViewerToggleView(${pane.id})">🔄 Toggle View</button>
                    <button class="diff-btn" onclick="window.diffViewerCopyDiff(${pane.id})">📋 Copy Diff</button>
                </div>
                <div class="diff-content" id="diff-content-${pane.id}">
                    ${this.renderUnifiedDiff(state.diff)}
                </div>
            </div>
        `;

        pane.element.innerHTML = html;
    }

    generateUnifiedDiff(content1, content2, file1, file2) {
        const lines1 = content1.split('\n');
        const lines2 = content2.split('\n');

        // Simple diff algorithm (LCS-based)
        const diff = this.computeDiff(lines1, lines2);

        // Generate unified diff format
        let result = `--- ${file1}\n+++ ${file2}\n`;

        let i = 0;
        while (i < diff.length) {
            // Find start of change block
            while (i < diff.length && diff[i].type === 'equal') i++;
            if (i >= diff.length) break;

            // Find start and end of this hunk
            const hunkStart = Math.max(0, i - 3); // Include 3 lines of context
            let hunkEnd = i;
            while (hunkEnd < diff.length && (diff[hunkEnd].type !== 'equal' || hunkEnd - i < 3)) {
                hunkEnd++;
            }
            hunkEnd = Math.min(diff.length, hunkEnd + 3);

            // Calculate line numbers
            let oldStart = 0, oldCount = 0, newStart = 0, newCount = 0;
            for (let j = 0; j < hunkStart; j++) {
                if (diff[j].type !== 'add') oldStart++;
                if (diff[j].type !== 'remove') newStart++;
            }

            for (let j = hunkStart; j < hunkEnd; j++) {
                if (diff[j].type !== 'add') oldCount++;
                if (diff[j].type !== 'remove') newCount++;
            }

            result += `@@ -${oldStart + 1},${oldCount} +${newStart + 1},${newCount} @@\n`;

            // Add hunk lines
            for (let j = hunkStart; j < hunkEnd; j++) {
                const item = diff[j];
                if (item.type === 'equal') {
                    result += ` ${item.value}\n`;
                } else if (item.type === 'remove') {
                    result += `-${item.value}\n`;
                } else if (item.type === 'add') {
                    result += `+${item.value}\n`;
                }
            }

            i = hunkEnd;
        }

        return result;
    }

    computeDiff(lines1, lines2) {
        // Simple LCS-based diff algorithm
        const m = lines1.length;
        const n = lines2.length;
        const lcs = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

        // Build LCS table
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (lines1[i - 1] === lines2[j - 1]) {
                    lcs[i][j] = lcs[i - 1][j - 1] + 1;
                } else {
                    lcs[i][j] = Math.max(lcs[i - 1][j], lcs[i][j - 1]);
                }
            }
        }

        // Backtrack to find diff
        const diff = [];
        let i = m, j = n;
        while (i > 0 || j > 0) {
            if (i > 0 && j > 0 && lines1[i - 1] === lines2[j - 1]) {
                diff.unshift({ type: 'equal', value: lines1[i - 1] });
                i--;
                j--;
            } else if (j > 0 && (i === 0 || lcs[i][j - 1] >= lcs[i - 1][j])) {
                diff.unshift({ type: 'add', value: lines2[j - 1] });
                j--;
            } else if (i > 0) {
                diff.unshift({ type: 'remove', value: lines1[i - 1] });
                i--;
            }
        }

        return diff;
    }

    renderUnifiedDiff(diffText) {
        const lines = diffText.split('\n');
        let html = '<div class="diff-unified">';

        for (const line of lines) {
            if (line.startsWith('---')) {
                html += `<div class="diff-line diff-header-line">${this.escapeHtml(line)}</div>`;
            } else if (line.startsWith('+++')) {
                html += `<div class="diff-line diff-header-line">${this.escapeHtml(line)}</div>`;
            } else if (line.startsWith('@@')) {
                html += `<div class="diff-line diff-hunk-header">${this.escapeHtml(line)}</div>`;
            } else if (line.startsWith('+')) {
                html += `<div class="diff-line diff-addition">${this.escapeHtml(line)}</div>`;
            } else if (line.startsWith('-')) {
                html += `<div class="diff-line diff-deletion">${this.escapeHtml(line)}</div>`;
            } else if (line.startsWith(' ')) {
                html += `<div class="diff-line diff-context">${this.escapeHtml(line)}</div>`;
            } else {
                html += `<div class="diff-line">${this.escapeHtml(line)}</div>`;
            }
        }

        html += '</div>';
        return html;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Export globally
window.InlineContentManager = InlineContentManager;

// ===== GLOBAL FILE MANAGER HELPERS =====

window.fileManagerNavigate = async function(path, paneId) {
    const tab = window.tabManager.getActiveTab();
    if (!tab) return;

    const pane = tab.paneManager.panes.find(p => p.id === paneId);
    if (!pane || !pane.fileManagerState) return;

    // Add to history
    if (pane.fileManagerState.historyIndex < pane.fileManagerState.history.length - 1) {
        // Remove forward history
        pane.fileManagerState.history = pane.fileManagerState.history.slice(0, pane.fileManagerState.historyIndex + 1);
    }

    pane.fileManagerState.currentPath = path;
    pane.fileManagerState.history.push(path);
    pane.fileManagerState.historyIndex++;

    await tab.paneManager.inlineContentManager.renderFileManager(pane);
};

window.fileManagerGoBack = async function(paneId) {
    const tab = window.tabManager.getActiveTab();
    if (!tab) return;

    const pane = tab.paneManager.panes.find(p => p.id === paneId);
    if (!pane || !pane.fileManagerState) return;

    if (pane.fileManagerState.historyIndex > 0) {
        pane.fileManagerState.historyIndex--;
        pane.fileManagerState.currentPath = pane.fileManagerState.history[pane.fileManagerState.historyIndex];
        await tab.paneManager.inlineContentManager.renderFileManager(pane);
    }
};

window.fileManagerGoForward = async function(paneId) {
    const tab = window.tabManager.getActiveTab();
    if (!tab) return;

    const pane = tab.paneManager.panes.find(p => p.id === paneId);
    if (!pane || !pane.fileManagerState) return;

    if (pane.fileManagerState.historyIndex < pane.fileManagerState.history.length - 1) {
        pane.fileManagerState.historyIndex++;
        pane.fileManagerState.currentPath = pane.fileManagerState.history[pane.fileManagerState.historyIndex];
        await tab.paneManager.inlineContentManager.renderFileManager(pane);
    }
};

window.fileManagerGoUp = async function(paneId) {
    const tab = window.tabManager.getActiveTab();
    if (!tab) return;

    const pane = tab.paneManager.panes.find(p => p.id === paneId);
    if (!pane || !pane.fileManagerState) return;

    const currentPath = pane.fileManagerState.currentPath;
    if (currentPath === '/') return; // Already at root

    const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
    await window.fileManagerNavigate(parentPath, paneId);
};

window.fileManagerToggleView = async function(paneId) {
    const tab = window.tabManager.getActiveTab();
    if (!tab) return;

    const pane = tab.paneManager.panes.find(p => p.id === paneId);
    if (!pane || !pane.fileManagerState) return;

    pane.fileManagerState.viewMode = pane.fileManagerState.viewMode === 'list' ? 'grid' : 'list';
    await tab.paneManager.inlineContentManager.renderFileManager(pane);
};

window.fileManagerToggleHidden = async function(paneId) {
    const tab = window.tabManager.getActiveTab();
    if (!tab) return;

    const pane = tab.paneManager.panes.find(p => p.id === paneId);
    if (!pane || !pane.fileManagerState) return;

    pane.fileManagerState.showHidden = !pane.fileManagerState.showHidden;
    await tab.paneManager.inlineContentManager.renderFileManager(pane);
};

window.fileManagerItemDoubleClick = async function(path, isDirectory, paneId) {
    const tab = window.tabManager.getActiveTab();
    if (!tab) return;

    const pane = tab.paneManager.panes.find(p => p.id === paneId);
    if (!pane) return;

    if (isDirectory) {
        // Navigate into directory
        await window.fileManagerNavigate(path, paneId);
    } else {
        // Open file with appropriate Nebula utility
        const ext = path.split('.').pop().toLowerCase();

        // Get a terminal pane to execute the command
        let terminalPane = tab.paneManager.panes.find(p => p.ptyId && !p.fileManagerState);

        if (!terminalPane) {
            // Create a new terminal pane if none exists
            await tab.paneManager.splitPane(paneId, 'vertical');
            terminalPane = tab.paneManager.panes[tab.paneManager.panes.length - 1];
        }

        // Determine which Nebula utility to use
        const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'];
        const codeExts = ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'go', 'rs', 'rb', 'php', 'html', 'css', 'scss', 'json', 'yaml', 'yml', 'toml', 'xml', 'sh', 'bash'];

        if (imageExts.includes(ext)) {
            await tab.paneManager.inlineContentManager.openImageViewer(path, terminalPane, false);
        } else if (codeExts.includes(ext)) {
            await tab.paneManager.inlineContentManager.openMonacoEditor(path, terminalPane, false);
        } else {
            // Default to text editor
            await tab.paneManager.inlineContentManager.openTextEditor(path, terminalPane, false);
        }
    }
};

window.fileManagerOpenTerminal = async function(paneId) {
    const tab = window.tabManager.getActiveTab();
    if (!tab) return;

    const pane = tab.paneManager.panes.find(p => p.id === paneId);
    if (!pane || !pane.fileManagerState) return;

    // Split and create new terminal pane
    await tab.paneManager.splitPane(paneId, 'vertical');
    const newPane = tab.paneManager.panes[tab.paneManager.panes.length - 1];

    // Send cd command to new terminal to navigate to current folder
    if (newPane.ptyId && newPane.inputBuffer !== undefined) {
        const cdCommand = `cd "${pane.fileManagerState.currentPath}"\n`;
        newPane.inputBuffer += cdCommand;

        // Send to PTY if ready
        if (newPane.isTerminalReady && window.terminal) {
            window.terminal.write(newPane.ptyId, newPane.inputBuffer);
            newPane.inputBuffer = '';
        }
    }
};

window.fileManagerRefresh = async function(paneId) {
    const tab = window.tabManager.getActiveTab();
    if (!tab) return;

    const pane = tab.paneManager.panes.find(p => p.id === paneId);
    if (!pane || !pane.fileManagerState) return;

    await tab.paneManager.inlineContentManager.renderFileManager(pane);
};

window.fileManagerSearch = async function(paneId, query) {
    const tab = window.tabManager.getActiveTab();
    if (!tab) return;

    const pane = tab.paneManager.panes.find(p => p.id === paneId);
    if (!pane || !pane.fileManagerState) return;

    pane.fileManagerState.searchQuery = query;
    await tab.paneManager.inlineContentManager.renderFileManager(pane);
};

window.fileManagerSort = async function(paneId, sortBy) {
    const tab = window.tabManager.getActiveTab();
    if (!tab) return;

    const pane = tab.paneManager.panes.find(p => p.id === paneId);
    if (!pane || !pane.fileManagerState) return;

    pane.fileManagerState.sortBy = sortBy;
    await tab.paneManager.inlineContentManager.renderFileManager(pane);
};

window.fileManagerSelectItem = async function(paneId, index) {
    const tab = window.tabManager.getActiveTab();
    if (!tab) return;

    const pane = tab.paneManager.panes.find(p => p.id === paneId);
    if (!pane || !pane.fileManagerState) return;

    pane.fileManagerState.selectedIndex = index;
    await tab.paneManager.inlineContentManager.renderFileManager(pane);
};

window.fileManagerHandleKeyboard = async function(paneId, event) {
    const tab = window.tabManager.getActiveTab();
    if (!tab) return;

    const pane = tab.paneManager.panes.find(p => p.id === paneId);
    if (!pane || !pane.fileManagerState) return;

    const state = pane.fileManagerState;
    const items = state.filteredItems;

    // Don't handle keys if search input is focused
    if (event.target.classList.contains('fm-search-input')) {
        if (event.key === 'Escape') {
            event.target.blur();
            const fileManager = document.getElementById(`filemgr-${paneId}`);
            if (fileManager) fileManager.focus();
            event.preventDefault();
        }
        return;
    }

    switch (event.key) {
        case 'ArrowDown':
            event.preventDefault();
            if (items.length > 0) {
                state.selectedIndex = Math.min(state.selectedIndex + 1, items.length - 1);
                await tab.paneManager.inlineContentManager.renderFileManager(pane);
                scrollSelectedIntoView(paneId);
            }
            break;

        case 'ArrowUp':
            event.preventDefault();
            if (items.length > 0) {
                state.selectedIndex = Math.max(state.selectedIndex - 1, 0);
                await tab.paneManager.inlineContentManager.renderFileManager(pane);
                scrollSelectedIntoView(paneId);
            }
            break;

        case 'Enter':
            event.preventDefault();
            if (items.length > 0 && state.selectedIndex < items.length) {
                const selectedItem = items[state.selectedIndex];
                await window.fileManagerItemDoubleClick(selectedItem.path, selectedItem.isDirectory, paneId);
            }
            break;

        case 'Backspace':
            event.preventDefault();
            await window.fileManagerGoUp(paneId);
            break;

        case '/':
            event.preventDefault();
            const searchInput = document.getElementById(`fm-search-${paneId}`);
            if (searchInput) {
                searchInput.focus();
            }
            break;

        case 'Escape':
            event.preventDefault();
            state.selectedIndex = 0;
            await tab.paneManager.inlineContentManager.renderFileManager(pane);
            break;

        case 'c':
            if (event.ctrlKey || event.metaKey) {
                event.preventDefault();
                if (items.length > 0 && state.selectedIndex < items.length) {
                    const selectedItem = items[state.selectedIndex];
                    // Copy path to clipboard
                    if (navigator.clipboard) {
                        navigator.clipboard.writeText(selectedItem.path);
                        console.log('✓ Path copied to clipboard:', selectedItem.path);
                    }
                }
            }
            break;
    }

    function scrollSelectedIntoView(paneId) {
        setTimeout(() => {
            const selected = document.querySelector(`#filemgr-${paneId} .fm-item-selected`);
            if (selected) {
                selected.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }, 50);
    }
};

// Multi-select functions
window.fileManagerToggleSelect = async function(paneId, filePath) {
    const tab = window.tabManager.getActiveTab();
    if (!tab) return;

    const pane = tab.paneManager.panes.find(p => p.id === paneId);
    if (!pane || !pane.fileManagerState) return;

    const index = pane.fileManagerState.selectedFiles.indexOf(filePath);
    if (index > -1) {
        pane.fileManagerState.selectedFiles.splice(index, 1);
    } else {
        pane.fileManagerState.selectedFiles.push(filePath);
    }

    await tab.paneManager.inlineContentManager.renderFileManager(pane);
};

window.fileManagerClearSelection = async function(paneId) {
    const tab = window.tabManager.getActiveTab();
    if (!tab) return;

    const pane = tab.paneManager.panes.find(p => p.id === paneId);
    if (!pane || !pane.fileManagerState) return;

    pane.fileManagerState.selectedFiles = [];
    await tab.paneManager.inlineContentManager.renderFileManager(pane);
};

// Context menu
window.fileManagerContextMenu = function(event, paneId, filePath, isDirectory) {
    event.preventDefault();

    // Remove any existing context menu
    const existingMenu = document.querySelector('.fm-context-menu');
    if (existingMenu) existingMenu.remove();

    // Create context menu
    const menu = document.createElement('div');
    menu.className = 'fm-context-menu';
    menu.style.left = event.pageX + 'px';
    menu.style.top = event.pageY + 'px';
    menu.innerHTML = `
        <div class="fm-menu-item" onclick="window.fileManagerRenameFile(${paneId}, '${filePath}')">✏️ Rename</div>
        <div class="fm-menu-item" onclick="window.fileManagerDeleteFile(${paneId}, '${filePath}')">🗑️ Delete</div>
        <div class="fm-menu-separator"></div>
        <div class="fm-menu-item" onclick="window.fileManagerCopyPath('${filePath}')">📋 Copy Path</div>
    `;

    document.body.appendChild(menu);

    // Close menu on click outside
    const closeMenu = (e) => {
        if (!menu.contains(e.target)) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        }
    };
    setTimeout(() => document.addEventListener('click', closeMenu), 10);
};

window.fileManagerCopyPath = function(filePath) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(filePath);
        console.log('✓ Path copied:', filePath);
    }
};

window.fileManagerRenameFile = async function(paneId, filePath) {
    const tab = window.tabManager.getActiveTab();
    if (!tab) return;

    const fileName = filePath.split('/').pop();
    const newName = prompt('Rename file:', fileName);

    if (!newName || newName === fileName) return;

    const newPath = filePath.substring(0, filePath.lastIndexOf('/') + 1) + newName;

    try {
        const result = await window.fileAPI.rename(filePath, newPath);
        if (result.success) {
            const pane = tab.paneManager.panes.find(p => p.id === paneId);
            if (pane) await tab.paneManager.inlineContentManager.renderFileManager(pane);
        } else {
            alert(`Rename failed: ${result.error}`);
        }
    } catch (error) {
        alert(`Rename failed: ${error.message}`);
    }
};

window.fileManagerDeleteFile = async function(paneId, filePath) {
    const tab = window.tabManager.getActiveTab();
    if (!tab) return;

    const fileName = filePath.split('/').pop();
    if (!confirm(`Delete "${fileName}"?\n\nThis action cannot be undone.`)) return;

    try {
        const result = await window.fileAPI.delete(filePath);
        if (result.success) {
            const pane = tab.paneManager.panes.find(p => p.id === paneId);
            if (pane) {
                // Remove from selected files if present
                pane.fileManagerState.selectedFiles = pane.fileManagerState.selectedFiles.filter(p => p !== filePath);
                await tab.paneManager.inlineContentManager.renderFileManager(pane);
            }
        } else {
            alert(`Delete failed: ${result.error}`);
        }
    } catch (error) {
        alert(`Delete failed: ${error.message}`);
    }
};

window.fileManagerDeleteSelected = async function(paneId) {
    const tab = window.tabManager.getActiveTab();
    if (!tab) return;

    const pane = tab.paneManager.panes.find(p => p.id === paneId);
    if (!pane || !pane.fileManagerState) return;

    const count = pane.fileManagerState.selectedFiles.length;
    if (!confirm(`Delete ${count} item${count > 1 ? 's' : ''}?\n\nThis action cannot be undone.`)) return;

    try {
        for (const filePath of pane.fileManagerState.selectedFiles) {
            await window.fileAPI.delete(filePath);
        }
        pane.fileManagerState.selectedFiles = [];
        await tab.paneManager.inlineContentManager.renderFileManager(pane);
    } catch (error) {
        alert(`Delete failed: ${error.message}`);
    }
};

window.fileManagerCopySelected = async function(paneId) {
    const tab = window.tabManager.getActiveTab();
    if (!tab) return;

    const pane = tab.paneManager.panes.find(p => p.id === paneId);
    if (!pane || !pane.fileManagerState) return;

    const selectedFiles = pane.fileManagerState.selectedFiles;
    const destPath = prompt(`Copy ${selectedFiles.length} item${selectedFiles.length > 1 ? 's' : ''} to:\n\nEnter destination folder path:`, pane.fileManagerState.currentPath);

    if (!destPath) return;

    try {
        for (const sourcePath of selectedFiles) {
            const fileName = sourcePath.split('/').pop();
            const newPath = destPath + '/' + fileName;
            await window.fileAPI.copy(sourcePath, newPath);
        }
        alert(`✓ Copied ${selectedFiles.length} item${selectedFiles.length > 1 ? 's' : ''} successfully!`);
        pane.fileManagerState.selectedFiles = [];
        await tab.paneManager.inlineContentManager.renderFileManager(pane);
    } catch (error) {
        alert(`Copy failed: ${error.message}`);
    }
};

window.fileManagerMoveSelected = async function(paneId) {
    const tab = window.tabManager.getActiveTab();
    if (!tab) return;

    const pane = tab.paneManager.panes.find(p => p.id === paneId);
    if (!pane || !pane.fileManagerState) return;

    const selectedFiles = pane.fileManagerState.selectedFiles;
    const destPath = prompt(`Move ${selectedFiles.length} item${selectedFiles.length > 1 ? 's' : ''} to:\n\nEnter destination folder path:`, pane.fileManagerState.currentPath);

    if (!destPath) return;

    try {
        for (const sourcePath of selectedFiles) {
            const fileName = sourcePath.split('/').pop();
            const newPath = destPath + '/' + fileName;
            await window.fileAPI.move(sourcePath, newPath);
        }
        alert(`✓ Moved ${selectedFiles.length} item${selectedFiles.length > 1 ? 's' : ''} successfully!`);
        pane.fileManagerState.selectedFiles = [];
        await tab.paneManager.inlineContentManager.renderFileManager(pane);
    } catch (error) {
        alert(`Move failed: ${error.message}`);
    }
};

// ==================== GIT MANAGER HELPER FUNCTIONS ====================

window.gitManagerStageFile = async function(paneId, file) {
    const tab = window.tabManager.getActiveTab();
    if (!tab) return;

    const pane = tab.paneManager.panes.find(p => p.id === paneId);
    if (!pane || !pane.gitManagerState) return;

    try {
        const state = pane.gitManagerState;
        await tab.paneManager.inlineContentManager.runGitCommand(state.repoPath, ['add', file]);
        await tab.paneManager.inlineContentManager.loadGitStatus(pane);
        await tab.paneManager.inlineContentManager.renderGitManager(pane);
    } catch (error) {
        alert(`Failed to stage file: ${error.message}`);
    }
};

window.gitManagerUnstageFile = async function(paneId, file) {
    const tab = window.tabManager.getActiveTab();
    if (!tab) return;

    const pane = tab.paneManager.panes.find(p => p.id === paneId);
    if (!pane || !pane.gitManagerState) return;

    try {
        const state = pane.gitManagerState;
        await tab.paneManager.inlineContentManager.runGitCommand(state.repoPath, ['reset', 'HEAD', file]);
        await tab.paneManager.inlineContentManager.loadGitStatus(pane);
        await tab.paneManager.inlineContentManager.renderGitManager(pane);
    } catch (error) {
        alert(`Failed to unstage file: ${error.message}`);
    }
};

window.gitManagerStageAll = async function(paneId) {
    const tab = window.tabManager.getActiveTab();
    if (!tab) return;

    const pane = tab.paneManager.panes.find(p => p.id === paneId);
    if (!pane || !pane.gitManagerState) return;

    try {
        const state = pane.gitManagerState;
        await tab.paneManager.inlineContentManager.runGitCommand(state.repoPath, ['add', '.']);
        await tab.paneManager.inlineContentManager.loadGitStatus(pane);
        await tab.paneManager.inlineContentManager.renderGitManager(pane);
    } catch (error) {
        alert(`Failed to stage all files: ${error.message}`);
    }
};

window.gitManagerUnstageAll = async function(paneId) {
    const tab = window.tabManager.getActiveTab();
    if (!tab) return;

    const pane = tab.paneManager.panes.find(p => p.id === paneId);
    if (!pane || !pane.gitManagerState) return;

    try {
        const state = pane.gitManagerState;
        await tab.paneManager.inlineContentManager.runGitCommand(state.repoPath, ['reset', 'HEAD']);
        await tab.paneManager.inlineContentManager.loadGitStatus(pane);
        await tab.paneManager.inlineContentManager.renderGitManager(pane);
    } catch (error) {
        alert(`Failed to unstage all files: ${error.message}`);
    }
};

window.gitManagerCommit = async function(paneId) {
    const tab = window.tabManager.getActiveTab();
    if (!tab) return;

    const pane = tab.paneManager.panes.find(p => p.id === paneId);
    if (!pane || !pane.gitManagerState) return;

    const state = pane.gitManagerState;

    // Check if there are staged changes
    if (state.stagedFiles.length === 0) {
        alert('No staged changes to commit.');
        return;
    }

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'git-commit-modal';
    modal.innerHTML = `
        <div class="git-commit-modal-content">
            <div class="git-commit-header">
                <h3>📝 Commit Changes</h3>
                <button class="git-modal-close" onclick="this.closest('.git-commit-modal').remove()">✖</button>
            </div>
            <div class="git-commit-body">
                <label>Commit Message:</label>
                <textarea class="git-commit-message" placeholder="Enter your commit message here..." rows="8"></textarea>
                <div class="git-commit-preview">
                    <strong>Files to commit:</strong>
                    <div class="git-commit-files">
                        ${state.stagedFiles.map(f => `<div class="git-commit-file">✓ ${f}</div>`).join('')}
                    </div>
                </div>
            </div>
            <div class="git-commit-footer">
                <button class="git-btn git-btn-cancel" onclick="this.closest('.git-commit-modal').remove()">Cancel</button>
                <button class="git-btn git-btn-commit" id="git-commit-submit-${paneId}">Commit</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Focus textarea
    const textarea = modal.querySelector('.git-commit-message');
    textarea.focus();

    // Handle submit
    document.getElementById(`git-commit-submit-${paneId}`).addEventListener('click', async () => {
        const message = textarea.value.trim();
        if (!message) {
            alert('Please enter a commit message.');
            return;
        }

        try {
            await tab.paneManager.inlineContentManager.runGitCommand(state.repoPath, ['commit', '-m', message]);
            modal.remove();
            alert(`✓ Committed ${state.stagedFiles.length} file${state.stagedFiles.length > 1 ? 's' : ''} successfully!`);
            await tab.paneManager.inlineContentManager.loadGitStatus(pane);
            await tab.paneManager.inlineContentManager.renderGitManager(pane);
        } catch (error) {
            alert(`Commit failed: ${error.message}`);
        }
    });

    // Handle Enter to submit (Ctrl+Enter)
    textarea.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            document.getElementById(`git-commit-submit-${paneId}`).click();
        }
    });
};

window.gitManagerPush = async function(paneId) {
    const tab = window.tabManager.getActiveTab();
    if (!tab) return;

    const pane = tab.paneManager.panes.find(p => p.id === paneId);
    if (!pane || !pane.gitManagerState) return;

    const state = pane.gitManagerState;

    // Ask if force push is needed
    const forceConfirm = confirm(`Push to remote?\n\nCurrent branch: ${state.currentBranch}\n\nClick "OK" for normal push\nClick "Cancel" to abort\n\nTip: Hold Shift+Click to force push`);

    if (!forceConfirm) return;

    const force = window.event && window.event.shiftKey;

    try {
        const args = force ? ['push', '--force'] : ['push'];
        await tab.paneManager.inlineContentManager.runGitCommand(state.repoPath, args);
        alert(`✓ Pushed successfully${force ? ' (forced)' : ''}!`);
        await tab.paneManager.inlineContentManager.loadGitStatus(pane);
        await tab.paneManager.inlineContentManager.renderGitManager(pane);
    } catch (error) {
        if (!force) {
            const forceRetry = confirm(`Push failed: ${error.message}\n\nDo you want to force push?`);
            if (forceRetry) {
                try {
                    await tab.paneManager.inlineContentManager.runGitCommand(state.repoPath, ['push', '--force']);
                    alert('✓ Force pushed successfully!');
                    await tab.paneManager.inlineContentManager.loadGitStatus(pane);
                    await tab.paneManager.inlineContentManager.renderGitManager(pane);
                } catch (forceError) {
                    alert(`Force push failed: ${forceError.message}`);
                }
            }
        } else {
            alert(`Force push failed: ${error.message}`);
        }
    }
};

window.gitManagerPull = async function(paneId) {
    const tab = window.tabManager.getActiveTab();
    if (!tab) return;

    const pane = tab.paneManager.panes.find(p => p.id === paneId);
    if (!pane || !pane.gitManagerState) return;

    const state = pane.gitManagerState;

    // Ask if force pull is needed
    const pullType = confirm(`Pull from remote?\n\nCurrent branch: ${state.currentBranch}\n\nClick "OK" for normal pull\nClick "Cancel" to abort\n\nTip: Hold Shift+Click to force pull (reset --hard)`);

    if (!pullType) return;

    const force = window.event && window.event.shiftKey;

    try {
        if (force) {
            // Force pull: fetch and reset hard
            await tab.paneManager.inlineContentManager.runGitCommand(state.repoPath, ['fetch', 'origin']);
            await tab.paneManager.inlineContentManager.runGitCommand(state.repoPath, ['reset', '--hard', `origin/${state.currentBranch}`]);
            alert('✓ Force pulled successfully! (reset to remote)');
        } else {
            await tab.paneManager.inlineContentManager.runGitCommand(state.repoPath, ['pull']);
            alert('✓ Pulled successfully!');
        }
        await tab.paneManager.inlineContentManager.loadGitStatus(pane);
        await tab.paneManager.inlineContentManager.renderGitManager(pane);
    } catch (error) {
        if (!force) {
            const forceRetry = confirm(`Pull failed: ${error.message}\n\nDo you want to force pull? (This will reset to remote and discard local changes!)`);
            if (forceRetry) {
                try {
                    await tab.paneManager.inlineContentManager.runGitCommand(state.repoPath, ['fetch', 'origin']);
                    await tab.paneManager.inlineContentManager.runGitCommand(state.repoPath, ['reset', '--hard', `origin/${state.currentBranch}`]);
                    alert('✓ Force pulled successfully! (reset to remote)');
                    await tab.paneManager.inlineContentManager.loadGitStatus(pane);
                    await tab.paneManager.inlineContentManager.renderGitManager(pane);
                } catch (forceError) {
                    alert(`Force pull failed: ${forceError.message}`);
                }
            }
        } else {
            alert(`Force pull failed: ${error.message}`);
        }
    }
};

window.gitManagerSwitchBranch = async function(paneId, branch) {
    const tab = window.tabManager.getActiveTab();
    if (!tab) return;

    const pane = tab.paneManager.panes.find(p => p.id === paneId);
    if (!pane || !pane.gitManagerState) return;

    const state = pane.gitManagerState;

    // Don't switch if already on this branch
    if (branch === state.currentBranch) return;

    try {
        await tab.paneManager.inlineContentManager.runGitCommand(state.repoPath, ['checkout', branch]);
        alert(`✓ Switched to branch: ${branch}`);
        await tab.paneManager.inlineContentManager.loadGitStatus(pane);
        await tab.paneManager.inlineContentManager.renderGitManager(pane);
    } catch (error) {
        alert(`Branch switch failed: ${error.message}`);
    }
};

window.gitManagerRefresh = async function(paneId) {
    const tab = window.tabManager.getActiveTab();
    if (!tab) return;

    const pane = tab.paneManager.panes.find(p => p.id === paneId);
    if (!pane || !pane.gitManagerState) return;

    try {
        await tab.paneManager.inlineContentManager.loadGitStatus(pane);
        await tab.paneManager.inlineContentManager.renderGitManager(pane);
    } catch (error) {
        alert(`Refresh failed: ${error.message}`);
    }
};

// ==================== DIFF VIEWER HELPER FUNCTIONS ====================

window.diffViewerToggleView = function(paneId) {
    const tab = window.tabManager.getActiveTab();
    if (!tab) return;

    const pane = tab.paneManager.panes.find(p => p.id === paneId);
    if (!pane || !pane.diffViewerState) return;

    // TODO: Implement side-by-side view toggle
    alert('Side-by-side view coming soon! Currently showing unified diff.');
};

window.diffViewerCopyDiff = function(paneId) {
    const tab = window.tabManager.getActiveTab();
    if (!tab) return;

    const pane = tab.paneManager.panes.find(p => p.id === paneId);
    if (!pane || !pane.diffViewerState) return;

    const diffText = pane.diffViewerState.diff;
    if (!diffText) return;

    // Copy to clipboard
    navigator.clipboard.writeText(diffText).then(() => {
        alert('✓ Diff copied to clipboard!');
    }).catch(err => {
        alert(`Failed to copy: ${err.message}`);
    });
};
