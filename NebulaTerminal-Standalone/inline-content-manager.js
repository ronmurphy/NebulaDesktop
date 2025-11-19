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
            showHidden: false
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

                // Filter hidden files if needed
                if (!state.showHidden) {
                    items = items.filter(item => !item.name.startsWith('.'));
                }

                // Sort: directories first, then files, alphabetically
                items.sort((a, b) => {
                    if (a.isDirectory && !b.isDirectory) return -1;
                    if (!a.isDirectory && b.isDirectory) return 1;
                    return a.name.localeCompare(b.name);
                });
            } else {
                error = result.error;
            }
        } catch (err) {
            error = err.message;
        }

        // Replace pane content with file manager
        const content = pane.element.querySelector('.pane-content');
        content.innerHTML = `
            <div class="file-manager" id="${managerId}" data-pane-id="${pane.id}">
                <div class="fm-header">
                    <div class="fm-nav-buttons">
                        <button class="fm-btn" onclick="window.fileManagerGoBack(${pane.id})" title="Back" ${state.historyIndex === 0 ? 'disabled' : ''}>←</button>
                        <button class="fm-btn" onclick="window.fileManagerGoForward(${pane.id})" title="Forward" ${state.historyIndex === state.history.length - 1 ? 'disabled' : ''}>→</button>
                        <button class="fm-btn" onclick="window.fileManagerGoUp(${pane.id})" title="Up">↑</button>
                    </div>
                    <div class="fm-controls">
                        <button class="fm-btn" onclick="window.fileManagerToggleView(${pane.id})" title="Toggle View">${state.viewMode === 'list' ? '⊞' : '☰'}</button>
                        <button class="fm-btn" onclick="window.fileManagerToggleHidden(${pane.id})" title="Show/Hide Hidden Files">${state.showHidden ? '👁️' : '👁️‍🗨️'}</button>
                        <button class="fm-btn fm-terminal-btn" onclick="window.fileManagerOpenTerminal(${pane.id})" title="Open Terminal Here">⌘</button>
                    </div>
                    <div class="fm-pane-controls">
                        <button class="fm-btn" onclick="window.tabManager.getActiveTab().paneManager.requestPaneMove(${pane.id})" title="Move Pane">⇄</button>
                        <button class="fm-btn" onclick="window.tabManager.getActiveTab().paneManager.closePane(${pane.id})" title="Close">×</button>
                    </div>
                </div>
                <div class="fm-breadcrumb">
                    ${this.renderBreadcrumb(state.currentPath, pane.id)}
                </div>
                <div class="fm-content ${state.viewMode === 'grid' ? 'fm-grid-view' : 'fm-list-view'}">
                    ${error ? `<div class="fm-error">⚠️ Error: ${error}</div>` : this.renderFileList(items, state.viewMode, pane.id)}
                </div>
            </div>
        `;
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

    renderFileList(items, viewMode, paneId) {
        if (items.length === 0) {
            return '<div class="fm-empty">📭 Empty folder</div>';
        }

        if (viewMode === 'list') {
            return items.map(item => {
                const icon = this.getFileIcon(item);
                const size = item.isDirectory ? '' : this.formatSize(item.size);
                const date = item.modified ? new Date(item.modified).toLocaleDateString() : '';

                return `
                    <div class="fm-item fm-list-item" data-path="${item.path}" ondblclick="window.fileManagerItemDoubleClick('${item.path}', ${item.isDirectory}, ${paneId})">
                        <span class="fm-item-icon">${icon}</span>
                        <span class="fm-item-name">${item.name}</span>
                        <span class="fm-item-size">${size}</span>
                        <span class="fm-item-date">${date}</span>
                    </div>
                `;
            }).join('');
        } else {
            // Grid view
            return items.map(item => {
                const icon = this.getFileIcon(item);
                const thumbnail = this.shouldShowThumbnail(item) ? `<img src="file://${item.path}" class="fm-thumbnail" onerror="this.style.display='none'">` : '';

                return `
                    <div class="fm-item fm-grid-item" data-path="${item.path}" ondblclick="window.fileManagerItemDoubleClick('${item.path}', ${item.isDirectory}, ${paneId})">
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
