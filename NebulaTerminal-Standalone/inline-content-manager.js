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

        // nip <file> [--split] - Nebula Inline Picture
        const nipMatch = trimmed.match(/^nip\s+(.+?)(\s+--split)?$/);
        if (nipMatch) {
            const filePath = nipMatch[1].trim();
            const useSplit = !!nipMatch[2];
            this.openImageViewer(filePath, pane, useSplit);
            return true;
        }

        // nie <file> [--split] - Nebula Inline Editor
        const nieMatch = trimmed.match(/^nie\s+(.+?)(\s+--split)?$/);
        if (nieMatch) {
            const filePath = nieMatch[1].trim();
            const useSplit = !!nieMatch[2];
            this.openTextEditor(filePath, pane, useSplit);
            return true;
        }

        // nid <file> [--split] - Nebula Inline Developer (Monaco)
        const nidMatch = trimmed.match(/^nid\s+(.+?)(\s+--split)?$/);
        if (nidMatch) {
            const filePath = nidMatch[1].trim();
            const useSplit = !!nidMatch[2];
            this.openMonacoEditor(filePath, pane, useSplit);
            return true;
        }

        // niw <url> [--split] - Nebula Inline Web
        const niwMatch = trimmed.match(/^niw\s+(.+?)(\s+--split)?$/);
        if (niwMatch) {
            const url = niwMatch[1].trim();
            const useSplit = !!niwMatch[2];
            this.openWebViewer(url, pane, useSplit);
            return true;
        }

        return false; // Not a special command
    }

    async openImageViewer(filePath, pane, useSplit) {
        if (useSplit) {
            // Create new pane with image viewer
            await this.paneManager.splitPane(pane.id, 'horizontal');
            const newPane = this.paneManager.panes[this.paneManager.panes.length - 1];
            this.renderImageInPane(filePath, newPane);
        } else {
            // Render inline
            this.renderImageInline(filePath, pane);
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

    async openTextEditor(filePath, pane, useSplit) {
        // Load file content
        const content = await this.loadFile(filePath);

        if (useSplit) {
            await this.paneManager.splitPane(pane.id, 'horizontal');
            const newPane = this.paneManager.panes[this.paneManager.panes.length - 1];
            this.renderTextEditorInPane(filePath, content, newPane);
        } else {
            this.renderTextEditorInline(filePath, content, pane);
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

    async openMonacoEditor(filePath, pane, useSplit) {
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

        if (useSplit) {
            await this.paneManager.splitPane(pane.id, 'horizontal');
            const newPane = this.paneManager.panes[this.paneManager.panes.length - 1];
            this.renderMonacoInPane(filePath, content, newPane);
        } else {
            this.renderMonacoInline(filePath, content, pane);
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

    async openWebViewer(url, pane, useSplit) {
        // Ensure URL has protocol
        if (!url.match(/^https?:\/\//)) {
            url = 'https://' + url;
        }

        if (useSplit) {
            await this.paneManager.splitPane(pane.id, 'horizontal');
            const newPane = this.paneManager.panes[this.paneManager.panes.length - 1];
            this.renderWebViewInPane(url, newPane);
        } else {
            this.renderWebViewInline(url, pane);
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
}

// Export globally
window.InlineContentManager = InlineContentManager;
