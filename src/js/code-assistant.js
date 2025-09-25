// Enhanced Code Assistant with JS Execution + Template Loading
// Preserves ALL original functionality + adds new features
class NebulaCodeAssistant {
    constructor() {
        this.windowId = null;
        this.monacoEditor = null;
        this.currentLanguage = 'javascript';
        this.currentAIService = 'lmstudio'; // Default to LM Studio
        this.webview = null;
        this.savedProjects = [];
        this.outputVisible = false; // NEW: for output panel
        this.currentFilePath = null; // NEW: track current open file
        this.hasUnsavedChanges = false; // NEW: track unsaved changes

        // LM Studio Configuration
        this.lmStudioConfig = {
            baseUrl: 'http://127.0.0.1:1234',
            model: 'local-model', // Will be detected automatically
            temperature: 0.7,
            maxTokens: 2048
        };

        // File context for AI chat
        this.fileContext = {
            includeCurrentFile: false,
            includeSelection: false,
            currentFileContent: null,
            selectedText: null,
            fileName: null
        };

        // NEW: Multi-file tab system
        this.openFiles = new Map(); // fileId -> fileData
        this.activeFileId = null;
        this.nextFileId = 1;
        this.symbolUpdateTimeout = null; // For debounced symbol updates


        // NEW: Monaco model management
        this.monacoModels = new Map(); // Track all Monaco models for proper disposal
        this.errorCheckTimeout = null; // For debounced error checking
        
        // NEW: Plugin system
        this.plugins = new Map();
        this.pluginHooks = ['beforeSave', 'afterLoad', 'onError', 'beforeAIRequest'];

        // NEW: Chat width management
        this.assistantVisible = true;
        // this.chatWidth = '400px'; // Default width
        this.chatWidthPercent = 33; // Default 33%

        // NEW: Stub environment for testing
        this.stubEnvironmentEnabled = false;
        this.stubEnvironmentSettings = {
            injectWindowManager: true,
            injectNebulaApp: true,
            injectFileSystem: true,
            showWarnings: true
        };

        // Load stub environment settings from localStorage
        this.loadStubEnvironmentSettings();

        // Available templates for loading - NEW FEATURE
        this.templates = {
            'single-app': {
                name: 'Single Window App',
                description: 'Simple focused application template',
                path: '../src/Templates/NebulaApp-Single.js'
            },
            'tabbed-app': {
                name: 'Tabbed Window App',
                description: 'Multi-tab application template',
                path: '../src/Templates/NebulaApp-Tabbed.js'
            },
            'PWA-app': {
                name: 'Progressive Web App',
                description: 'Progressive Web App template',
                path: '../src/Templates/NebulaApp-PWA.js'
            }
            ,
            'visual-gui': {
                name: 'Visual GUI Designer',
                description: 'WYSIWYG GUI builder with live preview and component palette',
                path: '../src/Templates/NebulaApp-VisualGUI.js'
            }
        };

        // Component palette for Visual Designer
        this.visualComponents = [
            { type: 'button', label: 'Button', tag: 'sl-button', attrs: { type: 'primary' } },
            { type: 'input', label: 'Input', tag: 'sl-input', attrs: { placeholder: 'Enter text' } },
            { type: 'textarea', label: 'Textarea', tag: 'sl-textarea', attrs: { placeholder: 'Enter text' } },
            { type: 'select', label: 'Select', tag: 'sl-select', attrs: {} },
            { type: 'checkbox', label: 'Checkbox', tag: 'sl-checkbox', attrs: {} },
            { type: 'radio', label: 'Radio', tag: 'sl-radio', attrs: { name: 'group1' } },
            { type: 'switch', label: 'Switch', tag: 'sl-switch', attrs: {} },
            { type: 'range', label: 'Range', tag: 'sl-range', attrs: {} },
            { type: 'icon', label: 'Icon', tag: 'sl-icon', attrs: { name: 'star' } },
            { type: 'icon-button', label: 'Icon Button', tag: 'sl-icon-button', attrs: { name: 'star' } },
            { type: 'dropdown', label: 'Dropdown', tag: 'sl-dropdown', attrs: {} },
            { type: 'dialog', label: 'Dialog', tag: 'sl-dialog', attrs: {} },
            { type: 'nebula-filepicker', label: 'Nebula FilePicker', tag: 'nebula-filepicker', attrs: {} }
        ];

        // Add extended shoelace components
        this.visualComponents.push(
            { type: 'sl-badge', label: 'Badge', tag: 'sl-badge', attrs: { value: '1' } },
            { type: 'sl-avatar', label: 'Avatar', tag: 'sl-avatar', attrs: { initials: 'AB' } },
            { type: 'sl-progress', label: 'Progress', tag: 'sl-progress', attrs: { value: 50 } },
            { type: 'sl-spinner', label: 'Spinner', tag: 'sl-spinner', attrs: {} },
            { type: 'sl-tooltip', label: 'Tooltip', tag: 'sl-tooltip', attrs: { content: 'Hint' } },
            { type: 'sl-tabs', label: 'Tabs', tag: 'sl-tabs', attrs: {} },
            { type: 'sl-toast', label: 'Toast', tag: 'sl-toast', attrs: {} }
        );

        // AI Services (enhanced with LM Studio)
        this.aiServices = {
            lmstudio: { name: 'LM Studio (Local)', url: 'http://192.168.1.254:1234', icon: '🏠', type: 'api' },
            claude: { name: 'Claude', url: 'https://claude.ai', icon: '🧠', type: 'webview' },
            chatgpt: { name: 'ChatGPT', url: 'https://chat.openai.com', icon: '💬', type: 'webview' },
            manus: { name: 'Manus', url: 'https://manus.im', icon: '🤖', type: 'webview' },
            perplexity: { name: 'Perplexity', url: 'https://perplexity.ai', icon: '🔍', type: 'webview' },
            copilot: { name: 'Copilot', url: 'https://copilot.microsoft.com', icon: '🚀', type: 'webview' },
            gemini: { name: 'Gemini', url: 'https://gemini.google.com', icon: '💎', type: 'webview' },
            bolt: { name: 'Bolt', url: 'https://bolt.new', icon: '⚡', type: 'webview' }
        };

        // Load saved preferences
        this.loadLayoutPreferences();

        // Only auto-init if explicitly requested (not on script load)
        if (window.CODE_ASSISTANT_AUTO_INIT) {
            this.init();
        }
    }

    // Serialize current canvas components into an HTML snippet
    generateDesignedHTML() {
        const windowId = this.windowId;
        const canvas = document.getElementById(`designCanvas-${windowId}`);
        if (!canvas) return '';

        const wrapper = document.createElement('div');
        wrapper.id = 'visual-gui-root';

        const comps = canvas.querySelectorAll('.gui-component');
        comps.forEach(c => {
            const clone = c.cloneNode(true);
            clone.removeAttribute('data-component-id');
            clone.removeAttribute('data-type');
            clone.classList.remove('selected');
            const handles = clone.querySelectorAll('.drag-handle');
            handles.forEach(h => h.remove());
            // remove designer-only ports/outlines/placeholders so runtime HTML is clean
            // If user set exportIncludePorts, we keep port elements present in the export
            if (!this.exportIncludePorts) {
                const ports = clone.querySelectorAll('[data-port], .component-port');
                ports.forEach(p => p.remove());
            }
            const outlines = clone.querySelectorAll('.component-outline');
            outlines.forEach(o => o.remove());
            const ghosts = clone.querySelectorAll('.ghost-placeholder');
            ghosts.forEach(g => g.remove());
            wrapper.appendChild(clone);
        });

        // Optionally inject runtime CSS to hide ports while keeping them in DOM
        if (this.exportHidePortsCSS) {
            const style = document.createElement('style');
            style.textContent = '.component-port, [data-port] { display: none !important; }';
            wrapper.insertBefore(style, wrapper.firstChild);
        }

        return wrapper.innerHTML;
    }

    // Apply the generated design HTML into any open template dialog (#designHtml)
    async applyDesignToTemplate() {
        const html = this.generateDesignedHTML();
        this.latestDesignHtml = html;

        const textareas = document.querySelectorAll('textarea#designHtml');
        if (textareas.length) {
            textareas.forEach(t => {
                t.value = html;
                t.dispatchEvent(new Event('input', { bubbles: true }));
            });
            this.writeOutput('✅ Design applied to template dialog', 'success');
            return;
        }

        // No template modal open — generate the full template and place it into the editor
        try {
            const formData = {
                appName: 'Visual GUI',
                developerName: 'Nebula Designer',
                className: this.generateClassName('Visual GUI'),
                appIcon: '🎨',
                description: 'Generated from Visual Designer',
                designHtml: html
            };

            const customizedCode = await this.loadAndCustomizeTemplate('visual-gui', formData); // Load the visual-gui template
            if (customizedCode && this.monacoEditor) {
                // Replace current editor content (no confirmation)
                this.monacoEditor.setValue(customizedCode);
                this.writeOutput('✅ Design applied and template set in editor', 'success');
            } else {
                this.writeOutput('❌ Failed to set design into editor', 'error');
            }
        } catch (err) {
            console.error('applyDesignToTemplate error:', err);
            this.writeOutput(`❌ Error generating template: ${err.message}`, 'error');
        }
    }

    // 2. ADD NEW METHOD - Load layout preferences
    loadLayoutPreferences() {
        try {
            const saved = localStorage.getItem('codeAssistant-layout');
            if (saved) {
                const prefs = JSON.parse(saved);
                this.assistantVisible = prefs.assistantVisible !== false;
                this.chatWidthPercent = prefs.chatWidthPercent || 33;
            }
        } catch (error) {
            console.log('Using default layout preferences');
        }
    }

    saveLayoutPreferences() {
        try {
            const prefs = {
                assistantVisible: this.assistantVisible,
                chatWidthPercent: this.chatWidthPercent
            };
            localStorage.setItem('codeAssistant-layout', JSON.stringify(prefs));
        } catch (error) {
            console.log('Could not save layout preferences');
        }
    }

    // FIX 1: Toggle Assistant - Replace your toggleAssistant() method with this:
    toggleAssistant() {
    this.assistantVisible = !this.assistantVisible;
    
    const container = document.querySelector(`[data-window-id="${this.windowId}"] .code-assistant-container`);
    const chatSide = container?.querySelector('.code-chat-side');
    const editorSide = container?.querySelector('.code-editor-side'); // ADD THIS
    const toggleBtn = document.getElementById(`toggleAssistantBtn-${this.windowId}`);
    const widthControls = document.getElementById(`chatWidthControls-${this.windowId}`);
    
    if (chatSide) {
        if (this.assistantVisible) {
            // SHOW: Restore display and width
            chatSide.style.display = 'flex';
            chatSide.style.width = `${this.chatWidthPercent}%`;
            
            // 🆕 ADD: Restore editor width
            if (editorSide) {
                editorSide.style.width = `${100 - this.chatWidthPercent}%`;
            }
        } else {
            // HIDE: Set display to none
            chatSide.style.display = 'none';
            
            // 🆕 ADD: Make editor full width
            if (editorSide) {
                editorSide.style.width = '100%';
            }
        }
    }

        if (toggleBtn) {
            if (this.assistantVisible) {
                toggleBtn.classList.add('active');
                toggleBtn.querySelector('span:last-child').textContent = 'Hide AI';
            } else {
                toggleBtn.classList.remove('active');
                toggleBtn.querySelector('span:last-child').textContent = 'Show AI';
            }
        }

        if (widthControls) {
            widthControls.style.display = this.assistantVisible ? 'flex' : 'none';
        }

        this.saveLayoutPreferences();
        setTimeout(() => this.handleWindowResize(), 100);
    }

    // FIX 2: Chat Width - Replace your setChatWidth() method with this:
    setChatWidth(percent) {
        this.chatWidthPercent = percent;

        const container = document.querySelector(`[data-window-id="${this.windowId}"] .code-assistant-container`);
        const chatSide = container?.querySelector('.code-chat-side');
        const editorSide = container?.querySelector('.code-editor-side');

        if (chatSide && editorSide) {
            // FIX: Set both sides explicitly to prevent expanding off-screen
            const chatWidth = `${percent}%`;
            const editorWidth = `${100 - percent}%`;

            chatSide.style.width = chatWidth;
            chatSide.style.flexShrink = '0';
            chatSide.style.flexGrow = '0';

            editorSide.style.width = editorWidth;
            editorSide.style.flexShrink = '0';
            editorSide.style.flexGrow = '0';

            // Force container to use explicit flex basis
            container.style.display = 'flex';
            container.style.flexDirection = 'row';
        }

        // Update button states
        document.querySelectorAll(`[id^="chatWidth"][id$="-${this.windowId}"]`).forEach(btn => {
            btn.classList.remove('active');
        });

        const activeBtn = document.getElementById(`chatWidth${percent}-${this.windowId}`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        this.saveLayoutPreferences();
        setTimeout(() => this.handleWindowResize(), 100);
    }

    handleWindowResize() {
        const webview = document.querySelector(`[data-window-id="${this.windowId}"]  .code-webview`);
        if (webview) {
            webview.style.width = '100%';
            webview.style.height = '100%';

            if (webview.getWebContentsId) {
                try {
                    webview.executeJavaScript('window.dispatchEvent(new Event("resize"))');
                } catch (error) {
                    // Ignore errors if webview not ready
                }
            }
        }

        if (this.monacoEditor) {
            setTimeout(() => {
                this.monacoEditor.layout();
            }, 100);
        }
    }

    applySavedLayout() {
        // Apply assistant visibility first
        const chatSide = document.querySelector(`[data-window-id="${this.windowId}"] .code-chat-side`);

        if (!this.assistantVisible && chatSide) {
            chatSide.style.display = 'none';
            const toggleBtn = document.getElementById(`toggleAssistantBtn-${this.windowId}`);
            if (toggleBtn) {
                toggleBtn.classList.remove('active');
                toggleBtn.querySelector('span:last-child').textContent = 'Show AI';
            }
            const widthControls = document.getElementById(`chatWidthControls-${this.windowId}`);
            if (widthControls) {
                widthControls.style.display = 'none';
            }
        } else {
            // Apply chat width for visible assistant
            this.setChatWidth(this.chatWidthPercent);
        }
    }

    async init() {
        // Wait for WindowManager to be available
        if (!window.windowManager) {
            console.log('CodeAssistant: Waiting for WindowManager...');
            await this.waitForWindowManager();
        }

        this.windowId = window.windowManager.createWindow({
            title: 'Code Assistant Pro',
            width: 1400,
            height: 900,
            resizable: true,
            maximizable: true,
            minimizable: true
        });

            try {
        await this.loadDiffMatchPatch();
        console.log('✅ diff-match-patch pre-loaded');
    } catch (e) {
        console.warn('diff-match-patch not available:', e);
    }



        window.windowManager.loadApp(this.windowId, this);
        console.log(`Code Assistant initialized with window ${this.windowId}`);
    }

    async waitForWindowManager() {
        return new Promise((resolve) => {
            const checkWM = () => {
                if (window.windowManager) {
                    resolve();
                } else {
                    setTimeout(checkWM, 100);
                }
            };
            checkWM();
        });
    }

    render() {
        const container = document.createElement('div');
        container.className = 'code-assistant-container';
        container.style.cssText = `
        height: 100%;
        display: flex;
        flex-direction: row;
        background: var(--nebula-bg-primary);
        font-family: var(--nebula-font-family);
        overflow: hidden;
        align-items: stretch;
    `;

        // Left side - Monaco Editor + Controls
        const editorSide = this.createEditorSide();

        // Right side - AI Chat with Webview  
        const chatSide = this.createChatSide();

        container.appendChild(editorSide);
        container.appendChild(chatSide);

        // Setup after DOM is ready
        // setTimeout(() => {
        //     this.setupEventListeners();
        //     this.initializeMonaco();
        //     this.createWebview();
        //     this.setupErrorDetection(); // NEW: Add error detection
        //     this.createNewTab(); // Initialize with first tab
        //     this.updateWindowTitle(); // Set initial window title and status

        //     // Update stub environment button state
        //     this.updateStubEnvironmentButtonState();
        // }, 0);

                setTimeout(async () => {
            this.setupEventListeners();
            await this.initializeMonaco();  // Wait for Monaco to load
            this.createWebview();
            this.setupErrorDetection();
            this.createNewTab();  // Now Monaco is available
            this.updateWindowTitle();
            this.updateStubEnvironmentButtonState();
        }, 0);

        // Apply saved layout after creation
        setTimeout(() => {
            this.applySavedLayout();
        }, 200);

        return container;
    }



    createEditorSide() {
        const editorSide = document.createElement('div');
        editorSide.className = 'code-editor-side';
        editorSide.style.cssText = `
            width: 67%;
    flex-shrink: 0;
    flex-grow: 0;
        display: flex;
        flex-direction: column;
        border-right: 1px solid var(--nebula-border);
        min-width: 0;
        overflow: hidden;
    `;

        // Enhanced Toolbar with Templates + Run Controls
        const toolbar = document.createElement('div');
        toolbar.className = 'code-toolbar';
        toolbar.style.cssText = `
            padding: 12px 16px;
            border-bottom: 1px solid var(--nebula-border);
            background: var(--nebula-surface);
            display: flex;
            gap: 12px;
            align-items: center;
            flex-wrap: wrap;
        `;

        toolbar.innerHTML = `
            <!-- Language & Template Section - ENHANCED -->
            <select id="languageSelect-${this.windowId}" style="
                padding: 6px 12px;
                border: 1px solid var(--nebula-border);
                border-radius: var(--nebula-radius-sm);
                background: var(--nebula-bg-primary);
                color: var(--nebula-text-primary);
            ">
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="basic">QBasic</option>
                <option value="python">Python</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="json">JSON</option>
                <option value="markdown">Markdown</option>
            </select>
            
            <!-- NEW: Template Selector -->
            <select id="templateSelect-${this.windowId}" style="
                padding: 6px 12px;
                border: 1px solid var(--nebula-border);
                border-radius: var(--nebula-radius-sm);
                background: var(--nebula-bg-primary);
                color: var(--nebula-text-primary);
            ">
                <option value="">📋 Load Template...</option>
                <option value="single-app">🎯 Single Window App</option>
                <option value="tabbed-app">📑 Tabbed Window App</option>
                <option value="PWA-app">🌐 Progressive Web App</option>
                <option value="visual-gui">🎨 Visual GUI Designer</option>
            </select>
            
            <div class="toolbar-separator" style="width: 1px; height: 20px; background: var(--nebula-border); margin: 0 4px;"></div>
            
            <!-- File Operations - ENHANCED -->
            <button id="newFileBtn-${this.windowId}" class="code-toolbar-btn" title="New File (Ctrl+N)">
                <span class="material-symbols-outlined">note_add</span>
            </button>
            
<button id="openFileBtn-${this.windowId}" class="code-toolbar-btn" title="Open File (Ctrl+O)">
                <span class="material-symbols-outlined">folder_open</span>
            </button>
            
<button id="saveBtn-${this.windowId}" class="code-toolbar-btn" title="Save File (Ctrl+S)">
                <span class="material-symbols-outlined">save</span>
            </button>
            
            <button id="saveAsBtn-${this.windowId}" class="code-toolbar-btn title="Save As (Ctrl+Shift+S)">
                <span class="material-symbols-outlined">save_as</span>
            </button>

                <!-- Hot Reload Button -->
                <button id="hotReloadBtn-${this.windowId}" class="code-toolbar-btn" title="Hot Reload File">
                    <span class="material-symbols-outlined">refresh</span>
                </button>
                <button id="linkModeToggle-${this.windowId}" style="
                    background: var(--nebula-surface);
                    color: var(--nebula-text-primary);
                    border: 1px solid var(--nebula-border);
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                ">Link Mode</button>

            <div class="toolbar-separator" style="width: 1px; height: 20px; background: var(--nebula-border); margin: 0 4px;"></div>
            
            <!-- NEW: Monaco Features -->
            <select id="symbolSelect-${this.windowId}" class="code-toolbar-btn title="Go to Symbol" style="
                padding: 6px 12px;
                border: 1px solid var(--nebula-border);
                border-radius: var(--nebula-radius-sm);
                background: var(--nebula-bg-primary);
                color: var(--nebula-text-primary);
                font-size: 13px;
                max-width: 200px;
            ">
                <option value="">📋 Go to Symbol...</option>
            </select>

                      
            <div class="toolbar-separator" style="width: 1px; height: 20px; background: var(--nebula-border); margin: 0 4px;"></div>
            
            <!-- ⚡ NEW: JS Execution Controls -->
            <button id="runBtn-${this.windowId}" class="toolbar-btn run-btn" title="Run JavaScript (F5)" style="
    width: 36px;
    height: 36px;
    border: none;
    background: var(--nebula-surface-hover);
    color: var(--nebula-text-secondary);
    border-radius: var(--nebula-radius-sm);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: var(--nebula-transition-fast);
    font-size: 14px;
    gap: 4px;
    padding: 0 8px;
    min-width: 36px;
    width: auto;
    background: var(--nebula-success);
    color: white;
    font-weight: 600;
            ">
                <span class="material-symbols-outlined">play_arrow</span>
                <span>Run</span>
            </button>
            
            <button id="debugBtn-${this.windowId}" class="code-toolbar-btn title="Debug Mode">
                <span class="material-symbols-outlined">bug_report</span>
            </button>
            
            <button id="stubEnvBtn-${this.windowId}" class="code-toolbar-btn ${this.stubEnvironmentEnabled ? 'active' : ''}" title="Stub Environment Settings">
                <span class="material-symbols-outlined">settings</span>
                <span>Stub Env</span>
            </button>
            
            <button id="toggleOutputBtn-${this.windowId}" class="code-toolbar-btn title="Toggle Output Panel">
                <span class="material-symbols-outlined">terminal</span>
            </button>
            
            <div class="toolbar-separator" style="width: 1px; height: 20px; background: var(--nebula-border); margin: 0 4px;"></div>
            
            <!-- Code Operations (original) -->
            <button id="formatBtn-${this.windowId}" class="code-toolbar-btn title="Format Code">
                <span class="material-symbols-outlined">code</span>
            </button>
            
            <!-- Legacy Design Mode button commented out - replaced by improved Visual Designer -->
            <!-- <button id="designModeBtn-${this.windowId}" class="code-toolbar-btn" title="Design Mode - Visual UI Builder">
                <span class="material-symbols-outlined">design_services</span>
            </button> -->

            <button id="visualDesignerBtn-${this.windowId}" class="code-toolbar-btn" title="Visual Designer">
                <span class="material-symbols-outlined">palette</span>
            </button>
            
            <button id="copyAllBtn-${this.windowId}" class="code-toolbar-btn title="Copy All Code">
                <span class="material-symbols-outlined">content_copy</span>
            </button>
            
            <button id="insertToFileBtn-${this.windowId}" class="code-toolbar-btn title="Insert Code to File">
                <span class="material-symbols-outlined">insert_drive_file</span>
            </button>

                        <div class="toolbar-separator" style="width: 1px; height: 20px; background: var(--nebula-border); margin: 0 4px;"></div>
            
            <!-- 🆕 NEW: Assistant Layout Controls -->
<button id="toggleAssistantBtn-${this.windowId}" class="code-toolbar-btn code-assistant-toggle" title="Toggle AI Assistant">
    <span class="material-symbols-outlined">smart_toy</span>
    <span>${this.assistantVisible ? 'Hide' : 'Show'} AI</span>
</button>

<button id="diffMergeBtn-${this.windowId}" class="code-toolbar-btn" title="Diff & Merge Tool">
    <span class="material-symbols-outlined">merge</span>
    <span>Diff/Merge</span>
</button>

<div class="toolbar-separator" style="width: 1px; height: 20px; background: var(--nebula-border); margin: 0 4px;"></div>

<!-- Chat Width Controls -->
<div id="chatWidthControls-${this.windowId}" style="
    display: ${this.assistantVisible ? 'flex' : 'none'};
    gap: 4px;
    align-items: center;
">
    <span style="font-size: 12px; color: var(--nebula-text-secondary);">Chat:</span>
    <button id="chatWidth25-${this.windowId}" class="code-width-btn ${this.chatWidthPercent === 25 ? 'active' : ''}" title="25% Width">25%</button>
    <button id="chatWidth33-${this.windowId}" class="code-width-btn ${this.chatWidthPercent === 33 ? 'active' : ''}" title="33% Width">33%</button>
    <button id="chatWidth50-${this.windowId}" class="code-width-btn ${this.chatWidthPercent === 50 ? 'active' : ''}" title="50% Width">50%</button>
</div>
        `;

        // NEW: File Tab Bar
        const tabBar = document.createElement('div');
        tabBar.id = `fileTabBar-${this.windowId}`;
        tabBar.className = 'file-tab-bar';
        tabBar.style.cssText = `
            background: var(--nebula-surface-secondary);
            border-bottom: 1px solid var(--nebula-border);
            display: flex;
            align-items: center;
            min-height: 36px;
            overflow-x: auto;
            overflow-y: hidden;
            flex-shrink: 0;
        `;

        tabBar.innerHTML = `
            <div class="tab-list" id="tabList-${this.windowId}" style="
                display: flex;
                flex: 1;
                min-width: 0;
            "></div>
            <button id="newTabBtn-${this.windowId}" class="new-tab-btn" title="New Tab" style="
                background: none;
                border: none;
                color: var(--nebula-text-secondary);
                padding: 8px 12px;
                cursor: pointer;
                display: flex;
                align-items: center;
                border-left: 1px solid var(--nebula-border);
                flex-shrink: 0;
            ">
                <span class="material-symbols-outlined" style="font-size: 18px;">add</span>
            </button>
        `;

        // Editor Container with Output Panel
        const editorContainer = document.createElement('div');
        editorContainer.style.cssText = `
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 0;
        `;

        // Monaco Editor (original)
        const monacoContainer = document.createElement('div');
        monacoContainer.id = `monacoEditor-${this.windowId}`;
        monacoContainer.style.cssText = `
            flex: 1;
            min-height: 0;
        `;

        // ⚡ NEW: Output Panel (initially hidden)
        const outputPanel = document.createElement('div');
        outputPanel.id = `outputPanel-${this.windowId}`;
        outputPanel.className = 'output-panel';
        outputPanel.style.cssText = `
            height: 0;
            background: #1a1a1a;
            border-top: 1px solid var(--nebula-border);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            transition: height 0.3s ease;
        `;

        outputPanel.innerHTML = `
            <div style="
                padding: 8px 16px;
                background: var(--nebula-surface);
                border-bottom: 1px solid var(--nebula-border);
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 12px;
                font-weight: 600;
                color: var(--nebula-text-primary);
            ">
                <span>🖥️ JavaScript Output</span>
                <div style="display: flex; gap: 8px;">
                    <button id="copyOutputBtn-${this.windowId}" style="
                        background: none;
                        border: none;
                        color: var(--nebula-text-secondary);
                        cursor: pointer;
                        padding: 4px;
                        title="Copy output to clipboard";
                    ">
                        <span class="material-symbols-outlined" style="font-size: 16px;">content_copy</span>
                    </button>
                    <button id="clearOutputBtn-${this.windowId}" style="
                        background: none;
                        border: none;
                        color: var(--nebula-text-secondary);
                        cursor: pointer;
                        padding: 4px;
                        title="Clear output";
                    ">
                        <span class="material-symbols-outlined" style="font-size: 16px;">clear</span>
                    </button>
                </div>
            </div>
            <div id="outputContent-${this.windowId}" style="
                flex: 1;
                padding: 16px;
                font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
                font-size: 13px;
                line-height: 1.4;
                color: #d4d4d4;
                overflow: auto;
                white-space: pre-wrap;
            ">Ready to run JavaScript code... 🚀</div>
        `;

        // Show welcome message after a short delay to ensure UI is ready
        setTimeout(() => {
            this.showWelcomeMessage();
        }, 500);

        editorContainer.appendChild(monacoContainer);
        editorContainer.appendChild(outputPanel);

        // NEW: Status bar for file info
        const statusBar = document.createElement('div');
        statusBar.className = 'code-status-bar';
        statusBar.style.cssText = `
            height: 24px;
            background: var(--nebula-surface-secondary);
            border-top: 1px solid var(--nebula-border);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 16px;
            font-size: 12px;
            color: var(--nebula-text-secondary);
            flex-shrink: 0;
        `;

        statusBar.innerHTML = `
            <span id="fileStatus-${this.windowId}">Ready</span>
            <span id="fileInfo-${this.windowId}">No file open</span>
        `;

        editorContainer.appendChild(statusBar);

        editorSide.appendChild(toolbar);
        editorSide.appendChild(tabBar); // NEW: Add tab bar
        editorSide.appendChild(editorContainer);

        return editorSide;
    }

    createChatSide() {
        const chatSide = document.createElement('div');
        chatSide.className = 'code-chat-side';
        chatSide.style.cssText = `
            width: 33%;
    flex-shrink: 0;
    flex-grow: 0;
        display: flex;
        flex-direction: column;
        background: var(--nebula-surface);
        flex-shrink: 0;
        flex-grow: 0;
        min-width: 250px;
        max-width: 60%;
    `;

        // AI Service Selector (original + enhanced)
        const chatHeader = document.createElement('div');
        chatHeader.style.cssText = `
            padding: 12px 16px;
            border-bottom: 1px solid var(--nebula-border);
            background: var(--nebula-surface-elevated);
        `;

        chatHeader.innerHTML = `
            <div style="margin-bottom: 12px;">
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--nebula-text-secondary); margin-bottom: 4px;">AI ASSISTANT</label>
                <select id="aiServiceSelect-${this.windowId}" style="
                    width: 100%;
                    padding: 8px 12px;
                    border: 1px solid var(--nebula-border);
                    border-radius: var(--nebula-radius-sm);
                    background: var(--nebula-bg-primary);
                    color: var(--nebula-text-primary);
                ">
                    ${Object.entries(this.aiServices).map(([key, service]) =>
            `<option value="${key}">${service.icon} ${service.name}</option>`
        ).join('')}
                </select>
            </div>
            
            <!-- Quick AI Actions (original) -->
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <button id="explainCodeBtn-${this.windowId}" class="ai-action-btn">
                    📖 Explain
                </button>
                <button id="optimizeCodeBtn-${this.windowId}" class="ai-action-btn">
                    ⚡ Optimize
                </button>
                <button id="debugCodeBtn-${this.windowId}" class="ai-action-btn">
                    🐛 Debug
                </button>
                <button id="addCommentsBtn-${this.windowId}" class="ai-action-btn">
                    💬 Comment
                </button>
                <button id="generateTestsBtn-${this.windowId}" class="ai-action-btn">
                    🧪 Tests
                </button>
                <button id="pasteFromAIBtn-${this.windowId}" class="ai-action-btn">
                    📥 Paste AI
                </button>
            </div>
        `;

        // Webview Container (original)
        const webviewContainer = document.createElement('div');
        webviewContainer.id = `webviewContainer-${this.windowId}`;
        webviewContainer.style.cssText = `
            flex: 1;
            position: relative;
            background: var(--nebula-bg-primary);
        `;

        // Loading indicator (original)
        webviewContainer.innerHTML = `
            <div id="chatLoading-${this.windowId}" style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: var(--nebula-text-secondary);
                font-size: 14px;
                text-align: center;
                z-index: 10;
            ">
                <div style="font-size: 24px; margin-bottom: 8px; animation: spin 2s linear infinite;">⚙️</div>
                Loading AI Assistant...
            </div>
        `;

        chatSide.appendChild(chatHeader);
        chatSide.appendChild(webviewContainer);

        return chatSide;
    }

    setupEventListeners() {
        // NEW: Template selector
document.getElementById(`templateSelect-${this.windowId}`)?.addEventListener('change', (e) => {
    if (e.target.value) {
        this.showTemplateCustomizationModal(e.target.value);
        e.target.value = ''; // Reset selector
    }
});

document.getElementById(`diffMergeBtn-${this.windowId}`)?.addEventListener('click', () => {
    this.showDiffMergeDialog();
});

        // Language selector (original)
        document.getElementById(`languageSelect-${this.windowId}`)?.addEventListener('change', (e) => {
            this.switchLanguage(e.target.value);
        });

        // AI Service selector (original)
        document.getElementById(`aiServiceSelect-${this.windowId}`)?.addEventListener('change', (e) => {
            this.switchAIService(e.target.value);
        });

        // File operations - ENHANCED with real filesystem
        document.getElementById(`newFileBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.newFile();
        });

        document.getElementById(`openFileBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.openFile();
        });

        document.getElementById(`saveBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.saveFile();
        });

        document.getElementById(`saveAsBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.saveAsFile();
        });

        // NEW: Symbol navigation
        document.getElementById(`symbolSelect-${this.windowId}`)?.addEventListener('change', (e) => {
            if (e.target.value) {
                this.goToSymbol(e.target.value);
                e.target.value = ''; // Reset selector
            }
        });

        // NEW: Tab management

        document.getElementById(`newTabBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.createNewTab();
        });

        // Hot Reload Button handler
        document.getElementById(`hotReloadBtn-${this.windowId}`)?.addEventListener('click', async () => {
            const fileData = this.getCurrentFileData();
            if (!fileData || !fileData.path) {
                alert('No file to reload.');
                return;
            }
            // Close the current tab
            this.closeTab(fileData.id);
            // Load file content before creating new tab
            try {
                // Use Nebula/Electron API to read file
                let newContent = '';
                if (window.nebula?.fs?.readFile) {
                    newContent = await window.nebula.fs.readFile(fileData.path);
                } else if (window.electronAPI?.readFile) {
                    newContent = await window.electronAPI.readFile(fileData.path);
                }
                this.createNewTab(fileData.path, newContent);
            } catch (err) {
                alert('Failed to reload file: ' + err.message);
            }
        });

        // ⚡ NEW: Code Execution Controls
        document.getElementById(`runBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.runCode();
        });

        document.getElementById(`debugBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.debugCode();
        });

        document.getElementById(`toggleOutputBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.toggleOutputPanel();
        });

        document.getElementById(`clearOutputBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.clearOutput();
        });

        document.getElementById(`copyOutputBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.copyOutputToClipboard();
        });

        // Code operations (original)
        document.getElementById(`formatBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.formatCode();
        });

        // Legacy design button replaced by `visualDesignerBtn`.
        document.getElementById(`visualDesignerBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.openVisualDesigner();
        });

        document.getElementById(`copyAllBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.copyAllCode();
        });

        document.getElementById(`insertToFileBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.insertCodeToFile();
        });

        // AI Actions (original)
        document.getElementById(`explainCodeBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.explainCode();
        });

        document.getElementById(`optimizeCodeBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.optimizeCode();
        });

        document.getElementById(`debugCodeBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.debugCode();
        });

        document.getElementById(`addCommentsBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.addComments();
        });

        document.getElementById(`generateTestsBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.generateTests();
        });

        document.getElementById(`pasteFromAIBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.pasteFromAI();
        });

        // 🆕 NEW: Assistant toggle button
        document.getElementById(`toggleAssistantBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.toggleAssistant();
        });

        // 🆕 NEW: Chat width buttons
        document.getElementById(`chatWidth25-${this.windowId}`)?.addEventListener('click', () => {
            this.setChatWidth(25);
        });

        document.getElementById(`chatWidth33-${this.windowId}`)?.addEventListener('click', () => {
            this.setChatWidth(33);
        });

        document.getElementById(`chatWidth50-${this.windowId}`)?.addEventListener('click', () => {
            this.setChatWidth(50);
        });

        // 🆕 FIX: Window resize handler
        window.addEventListener('resize', () => {
            this.handleWindowResize();
        });


        document.addEventListener('keydown', (e) => {
            if (!this.isWindowActive()) return;

            // 🔥 FIX: Allow Electron dev tools shortcuts to pass through
            if (e.ctrlKey && e.shiftKey && e.key === 'I') {
                // Don't prevent default - let Electron handle Ctrl+Shift+I
                return;
            }

            if (e.key === 'F12') {
                // Don't prevent default - let Electron handle F12
                return;
            }

            // 🔥 FIX: Also allow Ctrl+Shift+J (Chrome dev tools alternative)
            if (e.ctrlKey && e.shiftKey && e.key === 'J') {
                return;
            }

            // File operations shortcuts
            if (e.ctrlKey && e.key === 's' && !e.shiftKey) {
                e.preventDefault();
                this.saveFile();
            }

            if (e.ctrlKey && e.shiftKey && e.key === 'S') {
                e.preventDefault();
                this.saveAsFile();
            }

            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                this.newFile();
            }

            if (e.ctrlKey && e.key === 'o') {
                e.preventDefault();
                this.openFile();
            }

            // F5 for running code (but not Ctrl+F5 for refresh)
            if (e.key === 'F5' && !e.ctrlKey) {
                e.preventDefault();
                this.runCode();
            }
        });

        // 🆕 NEW: Stub Environment button
        document.getElementById(`stubEnvBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.showStubEnvironmentSettings();
        });

        // Add CSS for button styles
        this.addToolbarStyles();
    }




    // ⚡ NEW: Generic Code Execution (dispatches based on language)
    runCode() {
        if (!this.monacoEditor) {
            this.writeOutput('Error: Editor not initialized', 'error');
            return;
        }

        const code = this.monacoEditor.getValue();
        if (!code.trim()) {
            this.writeOutput('Error: No code to execute', 'error');
            return;
        }

        // Show output panel if hidden
        if (!this.outputVisible) {
            this.toggleOutputPanel();
        }

        // Dispatch based on current language
        switch (this.currentLanguage) {
            case 'javascript':
            case 'typescript':
                this.runJavaScriptCode(code);
                break;
            case 'basic':
                this.runBasicCode(code);
                break;
            case 'python':
                this.writeOutput('Python execution not yet implemented', 'warning');
                break;
            default:
                this.writeOutput(`Execution not supported for ${this.currentLanguage}`, 'warning');
        }
    }

    // ⚡ NEW: JavaScript Execution (renamed from runJavaScript)
    runJavaScriptCode(code) {
        // NEW: Combine all open files for execution context
        const combinedCode = this.combineOpenFilesForExecution();
        const executionCode = combinedCode || code;

        this.writeOutput(`> Running JavaScript...\n`, 'info');

        if (combinedCode) {
            const fileCount = this.openFiles.size;
            this.writeOutput(`📦 Executing ${fileCount} file${fileCount > 1 ? 's' : ''} in combined context`, 'info');
        }

        // NEW: Inject stub environment if enabled
        let finalCode = executionCode;
        if (this.stubEnvironmentEnabled) {
            finalCode = this.injectStubEnvironment(executionCode);
        }

        try {
            // Capture console output (from Terminal's executeJS method)
            const originalLog = console.log;
            const originalError = console.error;
            const originalWarn = console.warn;
            let output = '';

            const captureOutput = (...args) => {
                output += args.map(arg =>
                    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                ).join(' ') + '\n';
            };

            console.log = captureOutput;
            console.error = captureOutput;
            console.warn = captureOutput;

            // Execute code in safe context - handle both expressions and full scripts
            let result;
            try {
                // First try as a full script (for function definitions, multiple statements)
                result = Function('"use strict"; ' + finalCode)();
            } catch (firstError) {
                try {
                    // If that fails, try as an expression (for simple returns)
                    result = Function('"use strict"; return (' + finalCode + ')')();
                } catch (secondError) {
                    // If both fail, throw the original error
                    throw firstError;
                }
            }

            // Restore console methods
            console.log = originalLog;
            console.error = originalError;
            console.warn = originalWarn;

            // Show captured output
            if (output) {
                this.writeOutput('Console Output:', 'success');
                this.writeOutput(output.trim(), 'output');
            }

            // Show result if not undefined
            if (result !== undefined) {
                this.writeOutput('\nResult:', 'success');
                this.writeOutput(
                    typeof result === 'object' ?
                        JSON.stringify(result, null, 2) : String(result),
                    'result'
                );
            }

            this.writeOutput('\n✅ Execution completed successfully\n', 'success');

        } catch (error) {
            this.writeOutput(`❌ JavaScript Error: ${error.message}\n`, 'error');

            // NEW: Try to provide helpful error context
            if (error.stack) {
                this.writeOutput('Stack trace:', 'error');
                this.writeOutput(error.stack, 'error');
            }
        }
    }

    // 🆕 NEW: QBasic Code Execution using qbjc compiler
    runBasicCode(code) {
        this.writeOutput(`> Running QBasic code with qbjc...\n`, 'info');

        try {
            // For now, we'll use a simple transpilation approach
            // In Phase 2, we'll integrate the full qbjc compiler
            const transpiledCode = this.transpileBasicToJavaScript(code);

            this.writeOutput('📝 Transpiled to JavaScript:', 'info');
            this.writeOutput(transpiledCode, 'code');

            // Execute the transpiled JavaScript
            this.writeOutput('\n▶️ Executing transpiled code...\n', 'info');
            this.executeTranspiledBasic(transpiledCode);

        } catch (error) {
            this.writeOutput(`❌ QBasic Error: ${error.message}\n`, 'error');
        }
    }

    // 🆕 NEW: Simple BASIC to JavaScript transpiler (Phase 1)
    transpileBasicToJavaScript(basicCode) {
        let jsCode = '';
        let indentLevel = 0;
        const indent = () => '    '.repeat(indentLevel);

        // Split into lines and process each
        const lines = basicCode.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line || line.startsWith("'")) continue; // Skip empty lines and comments

            const upperLine = line.toUpperCase();

            // FOR loop
            if (upperLine.startsWith('FOR ')) {
                const forMatch = line.match(/FOR\s+(\w+)\s*=\s*(\d+)\s+TO\s+(\d+)/i);
                if (forMatch) {
                    const [_, varName, start, end] = forMatch;
                    jsCode += `${indent()}for (let ${varName} = ${start}; ${varName} <= ${end}; ${varName}++) {\n`;
                    indentLevel++;
                } else {
                    jsCode += `${indent()}// Invalid FOR statement: ${line}\n`;
                }
            }
            // NEXT statement
            else if (upperLine.startsWith('NEXT ')) {
                indentLevel = Math.max(0, indentLevel - 1);
                jsCode += `${indent()}}\n`;
            }
            // IF/THEN statement
            else if (upperLine.startsWith('IF ')) {
                const ifMatch = line.match(/IF\s+(.+?)\s+THEN\s*(.+)?/i);
                if (ifMatch) {
                    const [_, condition, thenPart] = ifMatch;
                    jsCode += `${indent()}if (${condition}) {\n`;
                    indentLevel++;
                    // Handle inline THEN statements
                    if (thenPart && thenPart.trim()) {
                        // For now, treat inline statements as comments since we don't parse complex statements
                        jsCode += `${indent()}// ${thenPart.trim()}\n`;
                        indentLevel--;
                        jsCode += `${indent()}}\n`;
                    }
                } else {
                    jsCode += `${indent()}// Invalid IF statement: ${line}\n`;
                }
            }
            // ELSE statement
            else if (upperLine.trim() === 'ELSE') {
                indentLevel = Math.max(0, indentLevel - 1);
                jsCode += `${indent()}} else {\n`;
                indentLevel++;
            }
            // END IF statement
            else if (upperLine === 'END IF') {
                indentLevel = Math.max(0, indentLevel - 1);
                jsCode += `${indent()}}\n`;
            }
            // Simple PRINT statement
            else if (upperLine.startsWith('PRINT ')) {
                const content = line.substring(6).trim();
                if (content.startsWith('"') && content.endsWith('"')) {
                    // String literal
                    jsCode += `${indent()}console.log(${content});\n`;
                } else {
                    // Expression
                    jsCode += `${indent()}console.log(${content});\n`;
                }
            }
            // Simple variable assignment
            else if (line.includes('=')) {
                const parts = line.split('=');
                if (parts.length === 2) {
                    const varName = parts[0].trim();
                    const value = parts[1].trim();
                    // Skip if this looks like a FOR loop (already handled above)
                    if (!upperLine.startsWith('FOR ')) {
                        jsCode += `${indent()}let ${varName} = ${value};\n`;
                    }
                }
            }
            // REM comments
            else if (upperLine.startsWith('REM ')) {
                jsCode += `${indent()}// ${line.substring(4)}\n`;
            }
            // CLS (clear screen)
            else if (upperLine === 'CLS') {
                jsCode += `${indent()}console.clear();\n`;
            }
            // END
            else if (upperLine === 'END') {
                jsCode += `${indent()}// END\n`;
            }
            // Unknown statements - pass through as comment for now
            else {
                jsCode += `${indent()}// Unknown BASIC statement: ${line}\n`;
            }
        }

        return jsCode || '// No transpilable BASIC code found';
    }

    // 🆕 NEW: Execute transpiled BASIC code
    executeTranspiledBasic(jsCode) {
        try {
            // Capture console output
            const originalLog = console.log;
            const originalError = console.error;
            const originalWarn = console.warn;
            let output = '';

            const captureOutput = (...args) => {
                output += args.map(arg =>
                    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                ).join(' ') + '\n';
            };

            console.log = captureOutput;
            console.error = captureOutput;
            console.warn = captureOutput;

            // Execute the transpiled code
            eval(jsCode);

            // Restore console
            console.log = originalLog;
            console.error = originalError;
            console.warn = originalWarn;

            // Show captured output
            if (output.trim()) {
                this.writeOutput('\n📄 Program Output:', 'success');
                this.writeOutput(output, 'result');
            }

            this.writeOutput('\n✅ QBasic program completed successfully\n', 'success');

        } catch (error) {
            this.writeOutput(`❌ Runtime Error: ${error.message}\n`, 'error');
        }
    }

    // NEW: Inject stub environment for testing NebulaDesktop apps
    injectStubEnvironment(code) {
        let stubCode = '';

        if (this.stubEnvironmentSettings.showWarnings) {
            stubCode += `
// ⚠️ STUB ENVIRONMENT ACTIVE ⚠️
// This code is running with injected stub implementations
// These may not behave exactly like the real NebulaDesktop environment
console.warn('🧪 Stub environment active - some features may not work as expected');
`;
        }

        // Inject WindowManager stub - only if real implementation doesn't exist
        if (this.stubEnvironmentSettings.injectWindowManager) {
            stubCode += `
// Injected WindowManager stub
if (typeof window.windowManager === 'undefined') {
    window.windowManager = {
        createWindow: function(config) {
            const windowId = 'stub-window-' + Date.now();
            console.log('🪟 Stub WindowManager: Created window', windowId, 'with config:', config);
            console.log('✅ Window created:', windowId, config);
            return windowId;
        },
        loadApp: function(windowId, app) {
            console.log('📦 Stub WindowManager: Loading app into window', windowId);
            // Simulate async loading
            setTimeout(() => {
                if (app && typeof app.render === 'function') {
                    const container = app.render();
                    console.log('🎨 Stub WindowManager: App rendered, container:', container);
                    if (app.afterRender) {
                        app.afterRender();
                    }
                }
            }, 0);
        }
    };
    ${this.stubEnvironmentSettings.showWarnings ? 'console.log(\'🔧 Injected stub: window.windowManager\');' : ''}
}
`;
        }

        // Inject NebulaApp stub - only if real implementation doesn't exist
        if (this.stubEnvironmentSettings.injectNebulaApp) {
            stubCode += `
// Injected NebulaApp stub
if (typeof NebulaApp === 'undefined') {
    window.NebulaApp = class NebulaApp {
        constructor() {
            console.log('📱 Stub NebulaApp: Created app instance');
        }
    };
    ${this.stubEnvironmentSettings.showWarnings ? 'console.log(\'🔧 Injected stub: NebulaApp\');' : ''}
}
`;
        }

        // Inject file system stub - only if real implementation doesn't exist
        if (this.stubEnvironmentSettings.injectFileSystem) {
            stubCode += `
// Injected file system stub
if (typeof window.nebula === 'undefined') {
    window.nebula = {
        fs: {
            readFile: async function(path) {
                console.log('📁 Stub FS: Reading file', path);
                throw new Error('Stub FS: File reading not implemented - use real NebulaDesktop for file operations');
            },
            writeFile: async function(path, content) {
                console.log('📁 Stub FS: Writing file', path);
                throw new Error('Stub FS: File writing not implemented - use real NebulaDesktop for file operations');
            },
            exists: async function(path) {
                console.log('📁 Stub FS: Checking if exists', path);
                return false; // Stub always returns false
            },
            getHomeDir: function() {
                console.log('📁 Stub FS: Getting home directory');
                return '/stub/home';
            }
        }
    };
    ${this.stubEnvironmentSettings.showWarnings ? 'console.log(\'🔧 Injected stub: window.nebula.fs\');' : ''}
}
`;

        }

        return stubCode + '\n' + code;
    }

    // 🆕 NEW: Show stub environment settings modal
    showStubEnvironmentSettings() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content stub-env-modal">
                <div class="modal-header">
                    <h3>🧪 Stub Environment Settings</h3>
                    <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div class="modal-body">
                    <p class="modal-description">
                        Configure stub implementations for testing NebulaDesktop apps without the full environment.
                        These stubs provide basic functionality for development and testing.
                    </p>

                    <div class="setting-group">
                        <label class="setting-toggle">
                            <input type="checkbox" id="stubEnvEnabled-${this.windowId}"
                                   ${this.stubEnvironmentEnabled ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                            Enable Stub Environment
                        </label>
                        <p class="setting-description">
                            When enabled, stub implementations will be injected before code execution.
                        </p>
                    </div>

                    <div class="setting-group">
                        <label class="setting-toggle">
                            <input type="checkbox" id="injectWindowManager-${this.windowId}"
                                   ${this.stubEnvironmentSettings.injectWindowManager ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                            Inject WindowManager Stub
                        </label>
                        <p class="setting-description">
                            Provides window.windowManager.createWindow() and loadApp() methods.
                        </p>
                    </div>

                    <div class="setting-group">
                        <label class="setting-toggle">
                            <input type="checkbox" id="injectNebulaApp-${this.windowId}"
                                   ${this.stubEnvironmentSettings.injectNebulaApp ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                            Inject NebulaApp Stub
                        </label>
                        <p class="setting-description">
                            Provides the NebulaApp base class for app development.
                        </p>
                    </div>

                    <div class="setting-group">
                        <label class="setting-toggle">
                            <input type="checkbox" id="injectFileSystem-${this.windowId}"
                                   ${this.stubEnvironmentSettings.injectFileSystem ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                            Inject File System Stub
                        </label>
                        <p class="setting-description">
                            Provides window.nebula.fs with basic file operations (throws errors for safety).
                        </p>
                    </div>

                    <div class="setting-group">
                        <label class="setting-toggle">
                            <input type="checkbox" id="showWarnings-${this.windowId}"
                                   ${this.stubEnvironmentSettings.showWarnings ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                            Show Stub Warnings
                        </label>
                        <p class="setting-description">
                            Display console warnings when stubs are active to remind you of the test environment.
                        </p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                    <button class="btn-primary" id="saveStubSettings-${this.windowId}">Save Settings</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add event listeners
        document.getElementById(`saveStubSettings-${this.windowId}`)?.addEventListener('click', () => {
            this.saveStubEnvironmentSettings();
            modal.remove();
        });

        // Update button state based on enabled setting
        const enabledCheckbox = document.getElementById(`stubEnvEnabled-${this.windowId}`);
        const updateButtonState = () => {
            const btn = document.getElementById(`stubEnvBtn-${this.windowId}`);
            if (btn) {
                btn.classList.toggle('active', enabledCheckbox.checked);
            }
        };
        enabledCheckbox.addEventListener('change', updateButtonState);
        updateButtonState();
    }

    // 🆕 NEW: Save stub environment settings
    saveStubEnvironmentSettings() {
        this.stubEnvironmentEnabled = document.getElementById(`stubEnvEnabled-${this.windowId}`).checked;
        this.stubEnvironmentSettings.injectWindowManager = document.getElementById(`injectWindowManager-${this.windowId}`).checked;
        this.stubEnvironmentSettings.injectNebulaApp = document.getElementById(`injectNebulaApp-${this.windowId}`).checked;
        this.stubEnvironmentSettings.injectFileSystem = document.getElementById(`injectFileSystem-${this.windowId}`).checked;
        this.stubEnvironmentSettings.showWarnings = document.getElementById(`showWarnings-${this.windowId}`).checked;

        // Update button visual state
        const btn = document.getElementById(`stubEnvBtn-${this.windowId}`);
        if (btn) {
            btn.classList.toggle('active', this.stubEnvironmentEnabled);
        }

        // Save to localStorage
        localStorage.setItem(`stubEnvEnabled-${this.windowId}`, this.stubEnvironmentEnabled);
        localStorage.setItem(`stubEnvSettings-${this.windowId}`, JSON.stringify(this.stubEnvironmentSettings));

        this.writeOutput('🧪 Stub environment settings saved', 'success');
    }

    // 🆕 NEW: Update stub environment button visual state
    updateStubEnvironmentButtonState() {
        const btn = document.getElementById(`stubEnvBtn-${this.windowId}`);
        if (btn) {
            btn.classList.toggle('active', this.stubEnvironmentEnabled);
        }
    }

    // 🆕 NEW: Load stub environment settings from localStorage
    loadStubEnvironmentSettings() {
        try {
            const enabled = localStorage.getItem(`stubEnvEnabled-${this.windowId}`);
            const settings = localStorage.getItem(`stubEnvSettings-${this.windowId}`);

            if (enabled !== null) {
                this.stubEnvironmentEnabled = enabled === 'true';
            }

            if (settings) {
                const parsedSettings = JSON.parse(settings);
                this.stubEnvironmentSettings = { ...this.stubEnvironmentSettings, ...parsedSettings };
            }
        } catch (error) {
            console.warn('Failed to load stub environment settings:', error);
        }
    }

    // NEW: Combine all open JavaScript files for execution
    combineOpenFilesForExecution() {
        if (this.openFiles.size <= 1) return null;

        const jsFiles = [];
        const otherFiles = [];

        // Separate JS files from other files
        for (const [fileId, fileData] of this.openFiles) {
            if (fileData.path && fileData.path.endsWith('.js')) {
                jsFiles.push({
                    name: fileData.name,
                    path: fileData.path,
                    content: fileData.content,
                    isActive: fileId === this.activeFileId
                });
            } else {
                otherFiles.push(fileData);
            }
        }

        if (jsFiles.length <= 1) return null;

        // Sort files: ensure base classes come first, then dependencies, then active file
        jsFiles.sort((a, b) => {
            if (a.isActive) return 1;  // Active file last
            if (b.isActive) return -1;

            // Priority order: base classes first, then dependent classes
            const baseClasses = ['Tool', 'EventManager', 'LayerManager'];
            const dependentClasses = [
                'AdvancedToolManager', 'SelectionToolManager', 'GradientManager',
                'StylusTabletManager', 'ThreeJSReferenceButton', 'AdvancedBrushPanel',
                'SelectionToolsPanel', 'GradientFillPanel', 'StylusTabletPanel',
                'TabletInputManager', 'AdvancedStabilizer', 'PressureProcessor', 'TiltProcessor'
            ];

            const aHasBase = baseClasses.some(cls => a.content.includes(`class ${cls}`));
            const bHasBase = baseClasses.some(cls => b.content.includes(`class ${cls}`));
            const aHasDependent = dependentClasses.some(cls => a.content.includes(`class ${cls}`));
            const bHasDependent = dependentClasses.some(cls => b.content.includes(`class ${cls}`));

            // Base classes first
            if (aHasBase && !bHasBase) return -1;
            if (bHasBase && !aHasBase) return 1;

            // Then dependent classes
            if (aHasDependent && !bHasDependent) return -1;
            if (bHasDependent && !aHasDependent) return 1;

            return a.name.localeCompare(b.name); // Alphabetical fallback
        });

        // Combine all JS files with clear separation
        let combinedCode = `// 🌟 Combined Execution Context\n`;
        combinedCode += `// 📦 Loading ${jsFiles.length} JavaScript files:\n`;

        jsFiles.forEach((file, index) => {
            combinedCode += `// ${index + 1}. ${file.name}${file.isActive ? ' (ACTIVE)' : ''}\n`;
        });

        combinedCode += `// File execution order:\n`;
        jsFiles.forEach((file, index) => {
            combinedCode += `// ${index + 1}: ${file.name}\n`;
        });
        combinedCode += `\n`;

        // Add each file's content with source mapping comments
        jsFiles.forEach((file, index) => {
            combinedCode += `// ===== START: ${file.name} =====\n`;
            combinedCode += `// File: ${file.path}\n`;
            combinedCode += `${file.content}\n`;
            combinedCode += `// ===== END: ${file.name} =====\n\n`;
        });

        return combinedCode;
    }

    // ⚡ NEW: Output Panel Management
    toggleOutputPanel() {
        const outputPanel = document.getElementById(`outputPanel-${this.windowId}`);
        if (!outputPanel) return;

        this.outputVisible = !this.outputVisible;

        if (this.outputVisible) {
            outputPanel.style.height = '250px';
        } else {
            outputPanel.style.height = '0';
        }

        // Update button appearance
        const toggleBtn = document.getElementById(`toggleOutputBtn-${this.windowId}`);
        if (toggleBtn) {
            toggleBtn.style.background = this.outputVisible ? 'var(--nebula-primary)' : '';
            toggleBtn.style.color = this.outputVisible ? 'white' : '';
        }
    }

    writeOutput(text, type = 'output') {
        const outputContent = document.getElementById(`outputContent-${this.windowId}`);
        if (!outputContent) return;

        const colors = {
            info: '#61dafb',
            success: '#4ade80',
            error: '#ef4444',
            warning: '#f59e0b',
            result: '#fbbf24',
            output: '#d4d4d4',
            debug: '#8b5cf6'
        };

        // Add icons for different message types
        const icons = {
            info: 'ℹ️',
            success: '✅',
            error: '❌',
            warning: '⚠️',
            result: '📊',
            output: '💬',
            debug: '🔍'
        };

        const span = document.createElement('span');
        span.style.color = colors[type] || colors.output;

        // Add timestamp for important messages
        const timestamp = type === 'error' || type === 'success' ? `[${new Date().toLocaleTimeString()}] ` : '';

        // Add icon for certain message types
        const icon = (type === 'error' || type === 'success' || type === 'warning' || type === 'info') ? `${icons[type]} ` : '';

        span.textContent = `${timestamp}${icon}${text}\n`;

        outputContent.appendChild(span);
        outputContent.scrollTop = outputContent.scrollHeight;
    }

    // NEW: Clear console output
    clearOutput() {
        const outputContent = document.getElementById(`outputContent-${this.windowId}`);
        if (outputContent) {
            outputContent.innerHTML = '';
            this.writeOutput('🧹 Console cleared', 'info');
        }
    }

    // NEW: Copy output to clipboard
    copyOutputToClipboard() {
        const outputContent = document.getElementById(`outputContent-${this.windowId}`);
        if (!outputContent) return;

        // Get all text content from the output
        const textToCopy = outputContent.textContent || outputContent.innerText || '';

        // Use the Clipboard API if available, fallback to execCommand
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(textToCopy).then(() => {
                this.writeOutput('📋 Output copied to clipboard!', 'success');
            }).catch(err => {
                console.error('Failed to copy: ', err);
                this.fallbackCopyTextToClipboard(textToCopy);
            });
        } else {
            this.fallbackCopyTextToClipboard(textToCopy);
        }
    }

    // Fallback method for older browsers
    fallbackCopyTextToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            const successful = document.execCommand('copy');
            if (successful) {
                this.writeOutput('📋 Output copied to clipboard!', 'success');
            } else {
                this.writeOutput('❌ Failed to copy output to clipboard', 'error');
            }
        } catch (err) {
            this.writeOutput('❌ Failed to copy output to clipboard', 'error');
        }

        document.body.removeChild(textArea);
    }

    // NEW: Show welcome message with current status
    showWelcomeMessage() {
        this.clearOutput();
        this.writeOutput('🚀 Nebula Code Assistant Ready!', 'success');
        this.writeOutput(`📂 Open files: ${this.openFiles.size}`, 'info');

        if (this.openFiles.size > 0) {
            this.writeOutput('📋 Current files:', 'info');
            for (const [fileId, fileData] of this.openFiles) {
                const active = fileId === this.activeFileId ? ' (ACTIVE)' : '';
                this.writeOutput(`  • ${fileData.name}${active}`, 'output');
            }
        }

        this.writeOutput('💡 Tips:', 'info');
        this.writeOutput('  • Dependencies are automatically loaded when opening JS files', 'output');
        this.writeOutput('  • All open JS files are combined for execution', 'output');
        this.writeOutput('  • Use Ctrl+O to open files, Ctrl+S to save', 'output');
        this.writeOutput('', 'output');
    }

    // ⚡ NEW: Multi-File Tab Management System

    // createNewTab(filePath = null, content = null) {
    //     const fileId = `file-${this.nextFileId++}`;
    //     const fileName = filePath ? filePath.split('/').pop() : 'Untitled';
    //     const language = this.detectLanguageFromPath(filePath || fileName);

    //     const fileData = {
    //         id: fileId,
    //         path: filePath,
    //         name: fileName,
    //         content: content || this.getWelcomeCode(),
    //         language: language,
    //         hasUnsavedChanges: false,
    //         monacoModel: null
    //     };

    //     this.openFiles.set(fileId, fileData);
    //     this.createTabElement(fileData);
    //     this.switchToTab(fileId);

    //     console.log(`Created new tab: ${fileName}`);
    //     return fileId;
    // }

        createNewTab(filePath = null, content = null) {
        const fileId = `file-${this.nextFileId++}`;
        const fileName = filePath ? filePath.split('/').pop() : 'Untitled';
        const language = this.detectLanguageFromPath(filePath || fileName);
    
        const fileData = {
            id: fileId,
            path: filePath,
            name: fileName,
            content: content || this.getWelcomeCode(),
            language: language,
            hasUnsavedChanges: false,
            monacoModel: null
        };
    
        // Create Monaco model with proper URI (use file name for lookup)
        const uri = monaco.Uri.file(fileName);  // e.g., file:///code-assistant.js
        fileData.monacoModel = monaco.editor.createModel(
            fileData.content,
            fileData.language,
            uri  // Set the URI so uri.path ends with the file name
        );
    
        this.openFiles.set(fileId, fileData);
        this.createTabElement(fileData);
        this.switchToTab(fileId);
    
        console.log(`Created new tab: ${fileName} with URI: ${uri.toString()}`);
        return fileId;
    }

    createTabElement(fileData) {
        const tabList = document.getElementById(`tabList-${this.windowId}`);
        if (!tabList) return;

        const fileIcon = this.getFileTypeIcon(fileData.name, fileData.language);
        const displayName = fileData.name.length > 20 ?
            fileData.name.substring(0, 17) + '...' : fileData.name;

        const tab = document.createElement('div');
        tab.className = 'file-tab';
        tab.dataset.fileId = fileData.id;
        tab.dataset.language = fileData.language; // NEW: For CSS styling
        tab.style.cssText = `
            display: flex;
            align-items: center;
            padding: 6px 12px;
            border-right: 1px solid var(--nebula-border);
            background: var(--nebula-surface);
            color: var(--nebula-text-primary);
            cursor: pointer;
            font-size: 13px;
            min-width: 0;
            flex-shrink: 0;
            transition: var(--nebula-transition-fast);
            gap: 6px;
            max-width: 200px;
        `;

        tab.innerHTML = `
            <span class="file-icon" style="font-size: 14px; flex-shrink: 0;">${fileIcon}</span>
            <span class="file-name" style="flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${displayName}</span>
            <span class="unsaved-indicator" style="
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: var(--nebula-warning);
                flex-shrink: 0;
                display: none;
            "></span>
            <button class="tab-close-btn" style="
                background: none;
                border: none;
                color: var(--nebula-text-secondary);
                padding: 2px;
                cursor: pointer;
                display: flex;
                align-items: center;
                border-radius: 2px;
                flex-shrink: 0;
            ">
                <span class="material-symbols-outlined" style="font-size: 14px;">close</span>
            </button>
        `;

        // Add event listeners
        tab.addEventListener('click', (e) => {
            if (e.target.closest('.tab-close-btn')) return;
            this.switchToTab(fileData.id);
        });

        tab.querySelector('.tab-close-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeTab(fileData.id);
        });

        // Add tooltip with full path
        if (fileData.path) {
            tab.title = fileData.path;
        }

        tabList.appendChild(tab);
        fileData.tabElement = tab;
    }

    switchToTab(fileId) {
        const fileData = this.openFiles.get(fileId);
        if (!fileData) return;

        // Update visual state of tabs
        document.querySelectorAll(`#tabList-${this.windowId} .file-tab`).forEach(tab => {
            tab.style.background = 'var(--nebula-surface)';
            tab.style.borderBottom = 'none';
        });

        if (fileData.tabElement) {
            fileData.tabElement.style.background = 'var(--nebula-bg-primary)';
            fileData.tabElement.style.borderBottom = '2px solid var(--nebula-primary)';
        }

        // Switch Monaco model
        if (this.monacoEditor && monaco) {
            if (!fileData.monacoModel) {
                fileData.monacoModel = monaco.editor.createModel(
                    fileData.content,
                    fileData.language
                );
            }
            this.monacoEditor.setModel(fileData.monacoModel);
        } else if (this.monacoEditor) {
            // Fallback editor
            this.monacoEditor.setValue(fileData.content);
        }

        // Update current file tracking
        this.activeFileId = fileId;
        this.currentFilePath = fileData.path;
        this.hasUnsavedChanges = fileData.hasUnsavedChanges;

        // Update language selector
        const languageSelect = document.getElementById(`languageSelect-${this.windowId}`);
        if (languageSelect) languageSelect.value = fileData.language;

        this.updateWindowTitle();
        console.log(`Switched to tab: ${fileData.name}`);
    }

    closeTab(fileId) {
        const fileData = this.openFiles.get(fileId);
        if (!fileData) return;

        // Check for unsaved changes
        if (fileData.hasUnsavedChanges) {
            if (!confirm(`"${fileData.name}" has unsaved changes. Close anyway?`)) {
                return;
            }
        }

        // Remove tab element
        if (fileData.tabElement) {
            fileData.tabElement.remove();
        }

        // Dispose Monaco model
        if (fileData.monacoModel) {
            this.monacoModels.delete(fileData.id);
            fileData.monacoModel.dispose();
        }

        // Remove from open files
        this.openFiles.delete(fileId);

        // If this was the active tab, switch to another
        if (this.activeFileId === fileId) {
            const remainingFiles = Array.from(this.openFiles.keys());
            if (remainingFiles.length > 0) {
                this.switchToTab(remainingFiles[remainingFiles.length - 1]);
            } else {
                // No files left, create a new one
                this.createNewTab();
            }
        }

        console.log(`Closed tab: ${fileData.name}`);
    }

    detectLanguageFromPath(filePath) {
        if (!filePath) return 'javascript';

        const extension = filePath.split('.').pop().toLowerCase();
        const languageMap = {
            'js': 'javascript',
            'ts': 'typescript',
            'py': 'python',
            'bas': 'basic',
            'qb': 'basic',
            'html': 'html',
            'htm': 'html',
            'css': 'css',
            'json': 'json',
            'md': 'markdown',
            'txt': 'plaintext'
        };

        return languageMap[extension] || 'javascript';
    }

    getFileTypeIcon(fileName, language) {
        if (!fileName) return '📄';

        const extension = fileName.split('.').pop()?.toLowerCase();

        // Better web glyph icons for different file types
        const iconMap = {
            // JavaScript/TypeScript
            'js': '◉', // JavaScript - filled circle (yellow-ish when styled)
            'ts': '◈', // TypeScript - diamond
            'jsx': '⬟', // React JSX
            'tsx': '⬢', // React TSX

            // Web Technologies  
            'html': '⬢', // HTML - hexagon
            'htm': '⬢',
            'css': '◼', // CSS - filled square
            'scss': '◼',
            'sass': '◼',
            'less': '◼',

            // Python
            'py': '◉', // Python - filled circle 
            'pyc': '○', // Python compiled

            // Data/Config
            'json': '⧨', // JSON - data symbol
            'xml': '⧫', // XML - diamond
            'yml': '⚙', // YAML - gear
            'yaml': '⚙',
            'toml': '⚙',
            'ini': '⚙',
            'cfg': '⚙',
            'conf': '⚙',

            // Documentation
            'md': '◈', // Markdown - diamond outline
            'txt': '◇', // Text - empty diamond
            'rtf': '◇',
            'doc': '◇',
            'docx': '◇',

            // Images
            'png': '⬛', // Images - filled square
            'jpg': '⬛',
            'jpeg': '⬛',
            'gif': '⬛',
            'svg': '◆', // SVG - filled diamond
            'ico': '⬛',
            'webp': '⬛',

            // Archives
            'zip': '⬢', // Archives - hexagon
            'tar': '⬢',
            'gz': '⬢',
            'rar': '⬢',
            '7z': '⬢',

            // Executables
            'exe': '▲', // Executables - triangle
            'msi': '▲',
            'deb': '▲',
            'rpm': '▲',
            'app': '▲'
        };

        return iconMap[extension] || '◯'; // Default: empty circle
    }

    markTabAsModified(fileId, isModified) {
        const fileData = this.openFiles.get(fileId);
        if (!fileData) return;

        fileData.hasUnsavedChanges = isModified;

        if (fileData.tabElement) {
            const indicator = fileData.tabElement.querySelector('.unsaved-indicator');
            if (indicator) {
                indicator.style.display = isModified ? 'block' : 'none';
            }
        }

        // If this is the active tab, update window title
        if (fileId === this.activeFileId) {
            this.hasUnsavedChanges = isModified;
            this.updateWindowTitle();
        }
    }

    clearOutput() {
        const outputContent = document.getElementById(`outputContent-${this.windowId}`);
        if (outputContent) {
            outputContent.innerHTML = 'Output cleared... 🧹\n';
        }
    }

    // NEW: Enhanced error detection and suggestions
setupErrorDetection() {
    if (!this.monacoEditor) return;
    
    this.monacoEditor.onDidChangeModelContent(() => {
        clearTimeout(this.errorCheckTimeout);
        this.errorCheckTimeout = setTimeout(() => {
            this.checkForErrors();
        }, 2000);
    });
}

checkForErrors() {
    if (!this.monacoEditor || !monaco) return;
    
    const model = this.monacoEditor.getModel();
    if (!model) return;
    
    const markers = monaco.editor.getModelMarkers({ resource: model.uri });
    
    if (markers.length > 0) {
        this.updateErrorStatus(markers);
    } else {
        this.clearErrorStatus();
    }
}

updateErrorStatus(errors) {
    const fileStatus = document.getElementById(`fileStatus-${this.windowId}`);
    if (!fileStatus) return;
    
    const errorCount = errors.filter(e => e.severity === 8).length;
    const warningCount = errors.filter(e => e.severity === 4).length;
    
    let statusText = '';
    if (errorCount > 0) {
        statusText += `${errorCount} error${errorCount > 1 ? 's' : ''}`;
    }
    if (warningCount > 0) {
        if (statusText) statusText += ', ';
        statusText += `${warningCount} warning${warningCount > 1 ? 's' : ''}`;
    }
    
    if (statusText) {
        fileStatus.innerHTML = `<span style="color: ${errorCount > 0 ? '#ef4444' : '#f59e0b'}">${statusText}</span>`;
        fileStatus.title = 'Click to see AI suggestions for fixes';
        fileStatus.style.cursor = 'pointer';
        fileStatus.onclick = () => this.showErrorSuggestions(errors);
    }
}

clearErrorStatus() {
    const fileStatus = document.getElementById(`fileStatus-${this.windowId}`);
    if (fileStatus) {
        const fileData = this.getCurrentFileData();
        fileStatus.textContent = fileData && fileData.hasUnsavedChanges ? 'Modified' : 'Saved';
        fileStatus.style.cursor = 'default';
        fileStatus.onclick = null;
        fileStatus.title = '';
    }
}

async showErrorSuggestions(errors) {
    const errorContext = errors.map(error => 
        `Line ${error.startLineNumber}: ${error.message}`
    ).join('\n');
    
    const code = this.monacoEditor.getValue();
    const fileData = this.getCurrentFileData();
    
    const prompt = `I have ${errors.length} error${errors.length > 1 ? 's' : ''} in my ${fileData?.language || 'JavaScript'} code. Can you help me fix them?

Errors:
${errorContext}

Code context:
\`\`\`${fileData?.language || 'javascript'}
${code}
\`\`\`

Please provide specific fixes for each error.`;

    if (this.isAPIService() && this.currentAIService === 'lmstudio') {
        await this.sendToLMStudio(prompt, 'fix-errors');
    } else {
        navigator.clipboard.writeText(prompt);
        this.writeOutput('Error fixing prompt copied to clipboard!', 'info');
        alert('Error analysis prompt copied to clipboard!\nPaste it into the AI chat for assistance.');
    }
}

// --- Diff/Patch Merge using diff-match-patch ---
// async diffMerge(sourceContent, patchContent) {
//     // Load diff-match-patch from CDN if not available
//     if (!window.diff_match_patch) {
//         await this.loadDiffMatchPatch();
//     }

//     let DiffMatchPatch;
//     try {
//         DiffMatchPatch = window.diff_match_patch;
//     } catch (e) {
//         this.writeOutput('❌ diff-match-patch library not found.', 'error');
//         throw new Error('diff-match-patch not available');
//     }

//     const dmp = new DiffMatchPatch();

//     // Parse the patch (unified diff format)
//     let patches;
//     try {
//         patches = dmp.patch_fromText(patchContent);
//     } catch (err) {
//         this.writeOutput('❌ Failed to parse patch/diff file: ' + err.message, 'error');
//         throw err;
//     }

//     // Apply the patch
//     const [mergedText, results] = dmp.patch_apply(patches, sourceContent);

//     // Check for failed patches
//     if (results.some(r => !r)) {
//         this.writeOutput('⚠️ Some hunks in the patch did not apply cleanly.', 'warning');
//     }

//     return mergedText;
// }

async loadJSDiff() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/jsdiff@5.1.0/dist/jsdiff.umd.js';
        script.onload = () => {
            console.log('✅ jsdiff loaded from CDN (UMD)');
            resolve();
        };
        script.onerror = (e) => {
            console.error('❌ Failed to load jsdiff from CDN', e);
            reject(e);
        };
        document.head.appendChild(script);
    });
}

// async diffMerge(sourceContent, patchContent) {
//     // Load jsdiff from CDN if not available
//     if (!window.jsdiff) {
//         await this.loadJSDiff();
//     }

//     let jsdiff;
//     try {
//         jsdiff = window.jsdiff;
//     } catch (e) {
//         this.writeOutput('❌ jsdiff library not found.', 'error');
//         throw new Error('jsdiff not available');
//     }

//     try {
//         // Parse the unified diff
//         const patches = jsdiff.parsePatch(patchContent);
        
//         if (patches.length === 0) {
//             throw new Error('No valid patches found in diff file');
//         }

//         // Apply the first patch (unified diffs usually have one main patch)
//         const result = jsdiff.applyPatch(sourceContent, patches[0]);
        
//         if (!result || typeof result !== 'string') {
//             throw new Error('Patch application failed - check diff format');
//         }

//         return result;
//     } catch (error) {
//         console.error('Patch parsing error:', error);
//         throw new Error(`Failed to apply patch: ${error.message}`);
//     }
// }

async loadDiffMatchPatch() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/diff_match_patch/20121119/diff_match_patch.js';
        script.onload = () => {
            console.log('✅ diff-match-patch loaded from CDN');
            resolve();
        };
        script.onerror = (e) => {
            console.error('❌ Failed to load diff-match-patch from CDN', e);
            reject(e);
        };
        document.head.appendChild(script);
    });
}

// async diffMerge(sourceContent, patchContent) {
//     // Use diff-match-patch (already loaded)
//     if (!window.diff_match_patch) {
//         await this.loadDiffMatchPatch();
//     }

//     const dmp = new diff_match_patch();
//     dmp.Diff_Timeout = 1.0; // Fast processing

//     try {
//         // Parse unified diff manually
//         const patches = this.parseUnifiedDiff(patchContent);
        
//         if (patches.length === 0) {
//             throw new Error('No valid patches found in diff file');
//         }

//         let result = sourceContent;

//         // Apply each patch
//         for (const patch of patches) {
//             result = this.applyPatchHunk(result, patch, dmp);
//         }

//         return result;
//     } catch (error) {
//         console.error('Custom diff merge error:', error);
//         throw new Error(`Failed to apply patch: ${error.message}`);
//     }
// }

// Parse unified diff format manually

async diffMerge(sourceContent, patchContent) {

        // Add to the beginning of diffMerge
    console.log('Diff content preview:', patchContent.substring(0, 500));
    console.log('Diff lines starting with @@:', patchContent.split('\n').filter(line => line.startsWith('@@')).length);
    // Load jsdiff from CDN if not available
    if (!window.jsdiff) {
        await this.loadJSDiff();
    }

    let jsdiff;
    try {
        jsdiff = window.jsdiff;
    } catch (e) {
        this.writeOutput('❌ jsdiff library not found.', 'error');
        throw new Error('jsdiff not available');
    }

    try {
        // Parse the unified diff
        const patches = jsdiff.parsePatch(patchContent);
        
        if (patches.length === 0) {
            throw new Error('No valid patches found in diff file');
        }

        // Apply all patches (unified diffs can have multiple hunks)
        let result = sourceContent;
        for (const patch of patches) {
            const applied = jsdiff.applyPatch(result, patch);
            if (applied) {
                result = applied;
            } else {
                throw new Error(`Failed to apply patch hunk: ${patch.oldFileName || 'unknown'}`);
            }
        }

        return result;
    } catch (error) {
        console.error('Patch parsing error:', error);
        throw new Error(`Failed to apply patch: ${error.message}`);
    }
}


parseUnifiedDiff(diffContent) {
    const lines = diffContent.split('\n');
    const patches = [];
    let currentPatch = null;
    let inHunk = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Skip empty lines
        if (!line.trim()) continue;

        // Header lines (--- and +++)
        if (line.startsWith('---') || line.startsWith('+++')) {
            continue;
        }

        // Hunk header (@@ -start,len +start,len @@)
        const hunkMatch = line.match(/^@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@/);
        if (hunkMatch) {
            if (currentPatch) {
                patches.push(currentPatch);
            }

            const oldStart = parseInt(hunkMatch[1]);
            const oldLen = hunkMatch[2] ? parseInt(hunkMatch[2]) : 1;
            const newStart = parseInt(hunkMatch[3]);
            const newLen = hunkMatch[4] ? parseInt(hunkMatch[4]) : 1;

            currentPatch = {
                oldStart: oldStart - 1, // Convert to 0-based
                oldLen: oldLen,
                newStart: newStart - 1,
                newLen: newLen,
                context: [],
                removals: [],
                additions: []
            };
            inHunk = true;
            continue;
        }

        if (!inHunk || !currentPatch) continue;

        // Process hunk lines
        if (line.startsWith(' ')) {
            // Context line
            currentPatch.context.push(line.substring(1));
        } else if (line.startsWith('-')) {
            // Removal line
            currentPatch.removals.push(line.substring(1));
        } else if (line.startsWith('+')) {
            // Addition line
            currentPatch.additions.push(line.substring(1));
        }
    }

    // Add final patch
    if (currentPatch) {
        patches.push(currentPatch);
    }

    return patches;
}

// Apply a single patch hunk
applyPatchHunk(sourceText, patch, dmp) {
    const lines = sourceText.split('\n');
    
    // Find the context in the source
    const contextStart = this.findContextInSource(lines, patch);
    if (contextStart === -1) {
        throw new Error(`Could not find context for patch at line ${patch.oldStart + 1}`);
    }

    // Build the original text block
    const originalBlock = [];
    for (let i = 0; i < patch.context.length; i++) {
        const lineIndex = contextStart + i;
        if (lineIndex < lines.length) {
            originalBlock.push(lines[lineIndex]);
        }
    }

    // Build the modified text block
    const modifiedBlock = [...patch.context];
    
    // Apply removals and additions
    let contextIndex = 0;
    let removalIndex = 0;
    let additionIndex = 0;

    while (contextIndex < patch.context.length || removalIndex < patch.removals.length || additionIndex < patch.additions.length) {
        // Add context lines
        while (contextIndex < patch.context.length) {
            modifiedBlock.splice(contextIndex + removalIndex + additionIndex, 0, patch.context[contextIndex]);
            contextIndex++;
        }

        // Remove lines
        while (removalIndex < patch.removals.length) {
            const removeIndex = contextIndex + removalIndex;
            if (removeIndex < modifiedBlock.length) {
                modifiedBlock.splice(removeIndex, 1);
            }
            removalIndex++;
        }

        // Add lines
        while (additionIndex < patch.additions.length) {
            const addIndex = contextIndex + removalIndex + additionIndex;
            modifiedBlock.splice(addIndex, 0, patch.additions[additionIndex]);
            additionIndex++;
        }
    }

    // Use diff-match-patch to compute and apply the precise changes
    const originalText = originalBlock.join('\n');
    const modifiedText = modifiedBlock.join('\n');

    const diffs = dmp.diff_main(originalText, modifiedText);
    dmp.diff_cleanupSemantic(diffs);
    dmp.diff_cleanupEfficiency(diffs);

    const patches = dmp.patch_make(originalText, diffs);
    const results = dmp.patch_apply(patches, originalText);

    if (!results[0]) {
        throw new Error('Failed to apply patch hunk');
    }

    // Replace the block in the source
    const beforeBlock = lines.slice(0, contextStart);
    const afterBlock = lines.slice(contextStart + originalBlock.length);
    const newLines = [...beforeBlock, ...results[0].split('\n'), ...afterBlock];

    return newLines.join('\n');
}

// Find context in source text
findContextInSource(lines, patch) {
    if (patch.context.length === 0) {
        // No context, use line numbers
        return Math.max(0, patch.oldStart);
    }

    // Look for the context block
    for (let i = 0; i <= lines.length - patch.context.length; i++) {
        let match = true;
        for (let j = 0; j < patch.context.length; j++) {
            if (lines[i + j] !== patch.context[j]) {
                match = false;
                break;
            }
        }
        if (match) {
            return i;
        }
    }

    // Fallback to line number
    return Math.max(0, patch.oldStart);
}

// --- Console command: Merge two Monaco tabs by filename ---
// Helper method to list all open Monaco tabs/models
listOpenTabs() {
    const models = monaco.editor.getModels();
    console.log('Available Monaco Tabs/Models:');
    models.forEach((model, index) => {
        console.log(`${index + 1}. Path: ${model.uri.path}`);
        console.log(`   Full URI: ${model.uri.toString()}`);
        console.log(`   Content length: ${model.getValue().length} chars`);
        console.log('---');
    });
    
    // Also list openFiles for comparison
    console.log('Tracked in openFiles:');
    Array.from(this.openFiles.values()).forEach((fileData, index) => {
        console.log(`${index + 1}. Name: ${fileData.name}, Path: ${fileData.path}`);
    });
    
    this.writeOutput('📋 Tab list logged to console', 'info');
}

async consoleDiffMerge(sourceTabName, patchTabName) {
    const models = monaco.editor.getModels();
    
    // More flexible model lookup - try multiple matching strategies
    const findModel = (tabName) => {
        return models.find(model => {
            const path = model.uri.path;
            return path.endsWith(tabName) || 
                   path.endsWith('/' + tabName) || 
                   path.includes(tabName);
        });
    };
    
    const sourceModel = findModel(sourceTabName);
    const patchModel = findModel(patchTabName);
    
    console.log('Searching for:', sourceTabName, 'and', patchTabName);
    console.log('Source Model found:', sourceModel ? sourceModel.uri.path : 'NOT FOUND');
    console.log('Patch Model found:', patchModel ? patchModel.uri.path : 'NOT FOUND');
    
    if (!sourceModel || !patchModel) {
        this.writeOutput('❌ Monaco tab not found for diff merge. Run codeAssistant.listOpenTabs() to see available tabs.', 'error');
        return;
    }
    
    const sourceContent = sourceModel.getValue();
    const patchContent = patchModel.getValue();
    
    console.log('Source content length:', sourceContent.length);
    console.log('Patch content length:', patchContent.length);
    
    try {
        const merged = await this.diffMerge(sourceContent, patchContent);
        this.createNewTab(`${sourceTabName}.merged.js`, merged);
        this.writeOutput('✅ Diff merge completed and opened in new tab', 'success');
    } catch (err) {
        this.writeOutput('❌ Diff merge failed: ' + err.message, 'error');
        console.error('Diff merge error:', err);
    }
}

// async consoleDiffMerge(sourceTabName, patchTabName) {
//     const models = monaco.editor.getModels();
//     const sourceModel = models.find(model => model.uri.path.endsWith(sourceTabName));
//     const patchModel = models.find(model => model.uri.path.endsWith(patchTabName));

// console.log('Source Model:', sourceModel ? sourceModel.uri.path : 'undefined');
// console.log('Patch Model:', patchModel ? patchModel.uri.path : 'undefined');

//     if (!sourceModel || !patchModel) {
//         this.writeOutput('❌ Monaco tab not found for diff merge', 'error');
//         return;
//     }

//     const sourceContent = sourceModel.getValue();
//     const patchContent = patchModel.getValue();

//     try {
//         const merged = await this.diffMerge(sourceContent, patchContent);
//         this.createNewTab(`${sourceTabName}.merged.js`, merged);
//         this.writeOutput('✅ Diff merge completed and opened in new tab', 'success');
//     } catch (err) {
//         this.writeOutput('❌ Diff merge failed: ' + err.message, 'error');
//     }
// }

    // Update existing methods to work with tabs
    getCurrentFileData() {
        return this.openFiles.get(this.activeFileId);
    }

    // ⚡ NEW: Symbol Navigation (VS Code-like feature)
    updateSymbolDropdown() {
        const symbolSelect = document.getElementById(`symbolSelect-${this.windowId}`);
        if (!symbolSelect || !this.monacoEditor) return;

        const fileData = this.getCurrentFileData();
        if (!fileData) {
            symbolSelect.innerHTML = '<option value="">📋 Go to Symbol...</option>';
            return;
        }

        // Parse symbols based on language
        const symbols = this.parseSymbols(fileData.content, fileData.language);

        symbolSelect.innerHTML = '<option value="">📋 Go to Symbol...</option>' +
            symbols.map(symbol =>
                `<option value="${symbol.line}">${symbol.icon} ${symbol.name}</option>`
            ).join('');
    }

    parseSymbols(content, language) {
        const symbols = [];
        const lines = content.split('\n');

        if (language === 'javascript' || language === 'typescript') {
            lines.forEach((line, index) => {
                const trimmed = line.trim();

                // Classes
                if (trimmed.match(/^class\s+(\w+)/)) {
                    const match = trimmed.match(/^class\s+(\w+)/);
                    symbols.push({
                        name: match[1],
                        line: index + 1,
                        icon: '🏛️',
                        type: 'class'
                    });
                }

                // Functions (various patterns)
                const funcPatterns = [
                    /^function\s+(\w+)/,           // function name()
                    /^async function\s+(\w+)/,     // async function name()
                    /(\w+)\s*:\s*function/,        // name: function
                    /(\w+)\s*:\s*async function/,  // name: async function
                    /(\w+)\(.*\)\s*{/,             // name() {
                    /(\w+)\s*=\s*\(.*\)\s*=>/,     // name = () =>
                    /(\w+)\s*=\s*async\s*\(/,      // name = async (
                    /^\s*(\w+)\(.*\)\s*{/          // method() {
                ];

                funcPatterns.forEach(pattern => {
                    const match = trimmed.match(pattern);
                    if (match && !['if', 'for', 'while', 'switch', 'catch'].includes(match[1])) {
                        symbols.push({
                            name: match[1],
                            line: index + 1,
                            icon: '⚡',
                            type: 'function'
                        });
                    }
                });

                // Variables and constants
                if (trimmed.match(/^(const|let|var)\s+(\w+)/)) {
                    const match = trimmed.match(/^(const|let|var)\s+(\w+)/);
                    symbols.push({
                        name: match[2],
                        line: index + 1,
                        icon: '📦',
                        type: 'variable'
                    });
                }
            });
        } else if (language === 'python') {
            lines.forEach((line, index) => {
                const trimmed = line.trim();

                // Classes
                if (trimmed.match(/^class\s+(\w+)/)) {
                    const match = trimmed.match(/^class\s+(\w+)/);
                    symbols.push({
                        name: match[1],
                        line: index + 1,
                        icon: '🏛️',
                        type: 'class'
                    });
                }

                // Functions/methods
                if (trimmed.match(/^def\s+(\w+)/)) {
                    const match = trimmed.match(/^def\s+(\w+)/);
                    symbols.push({
                        name: match[1],
                        line: index + 1,
                        icon: '⚡',
                        type: 'function'
                    });
                }
            });
        } else if (language === 'html') {
            lines.forEach((line, index) => {
                const trimmed = line.trim();

                // HTML IDs and classes
                const idMatch = trimmed.match(/id=["']([^"']+)["']/);
                if (idMatch) {
                    symbols.push({
                        name: `#${idMatch[1]}`,
                        line: index + 1,
                        icon: '🎯',
                        type: 'id'
                    });
                }

                const classMatch = trimmed.match(/class=["']([^"']+)["']/);
                if (classMatch) {
                    symbols.push({
                        name: `.${classMatch[1].split(' ')[0]}`,
                        line: index + 1,
                        icon: '🎨',
                        type: 'class'
                    });
                }
            });
        }

        // Sort symbols by line number
        return symbols.sort((a, b) => a.line - b.line);
    }

    goToSymbol(lineNumber) {
        if (!this.monacoEditor || !monaco) return;

        const line = parseInt(lineNumber);
        this.monacoEditor.revealLineInCenter(line);
        this.monacoEditor.setPosition({ lineNumber: line, column: 1 });
        this.monacoEditor.focus();

        this.writeOutput(`Jumped to line ${line}`, 'info');
    }

    // ⚡ NEW: Template Loading System
    async loadTemplate(templateKey) {
        const template = this.templates[templateKey];
        if (!template) {
            alert('Template not found!');
            return;
        }

        try {
            this.writeOutput(`Loading template: ${template.name}...`, 'info');

            // Fetch the actual template file from src/Templates/
            const response = await fetch(template.path);
            if (!response.ok) {
                throw new Error(`Failed to fetch template: ${response.status}`);
            }

            const templateContent = await response.text();

            if (this.monacoEditor) {
                const currentCode = this.monacoEditor.getValue();
                if (currentCode.trim() && !confirm(`Load template "${template.name}"?\n\nThis will replace current code.`)) {
                    return;
                }

                this.monacoEditor.setValue(templateContent);
                this.writeOutput(`✅ Template "${template.name}" loaded successfully!`, 'success');
            }

        } catch (error) {
            this.writeOutput(`❌ Failed to load template: ${error.message}`, 'error');
            console.error('Template loading error:', error);

            // Fallback to embedded templates if fetch fails
            this.writeOutput('Falling back to embedded template...', 'info');
            this.loadEmbeddedTemplate(templateKey);
        }
    }

    // Fallback method for embedded templates (simple versions)
    loadEmbeddedTemplate(templateKey) {
        let templateContent = '';

        if (templateKey === 'single-app') {
            templateContent = '// NebulaApp Single Window Template\n' +
                'class NebulaMyApp {\n' +
                '    constructor() {\n' +
                '        this.windowId = null;\n' +
                '        this.init();\n' +
                '    }\n' +
                '    \n' +
                '    async init() {\n' +
                '        if (!window.windowManager) return;\n' +
                '        \n' +
                '        this.windowId = window.windowManager.createWindow({\n' +
                '            title: "My App",\n' +
                '            width: 800,\n' +
                '            height: 600,\n' +
                '            resizable: true\n' +
                '        });\n' +
                '        \n' +
                '        window.windowManager.loadApp(this.windowId, this);\n' +
                '    }\n' +
                '    \n' +
                '    render() {\n' +
                '        const container = document.createElement("div");\n' +
                '        container.innerHTML = "<h1>My App Content</h1>";\n' +
                '        return container;\n' +
                '    }\n' +
                '    \n' +
                '    getTitle() { return "My App"; }\n' +
                '    getIcon() { return "🚀"; }\n' +
                '    cleanup() { console.log("Cleanup"); }\n' +
                '}\n' +
                '\n' +
                'window.NebulaMyApp = NebulaMyApp;';
        } else if (templateKey === 'tabbed-app') {
            templateContent = '// NebulaApp Tabbed Window Template\n' +
                'class NebulaMyTabbedApp {\n' +
                '    constructor() {\n' +
                '        this.windowId = null;\n' +
                '        this.tabs = new Map();\n' +
                '        this.init();\n' +
                '    }\n' +
                '    \n' +
                '    async init() {\n' +
                '        if (!window.windowManager) return;\n' +
                '        \n' +
                '        this.windowId = window.windowManager.createWindow({\n' +
                '            title: "My Tabbed App",\n' +
                '            width: 1200,\n' +
                '            height: 700,\n' +
                '            hasTabBar: false,\n' +
                '            resizable: true\n' +
                '        });\n' +
                '        \n' +
                '        window.windowManager.loadApp(this.windowId, this);\n' +
                '    }\n' +
                '    \n' +
                '    render() {\n' +
                '        const container = document.createElement("div");\n' +
                '        container.innerHTML = "<h1>My Tabbed App</h1>";\n' +
                '        return container;\n' +
                '    }\n' +
                '    \n' +
                '    getTitle() { return "My Tabbed App"; }\n' +
                '    getIcon() { return "📑"; }\n' +
                '    cleanup() { console.log("Cleanup"); }\n' +
                '}\n' +
                '\n' +
                'window.NebulaMyTabbedApp = NebulaMyTabbedApp;';
        }

        if (this.monacoEditor && templateContent) {
            this.monacoEditor.setValue(templateContent);
            this.writeOutput('✅ Fallback template loaded!', 'success');
        }
    }

    // Continue with existing methods...
    async initializeMonaco() {
        try {
            // Load Monaco Editor from CDN if not already loaded
            if (!window.monaco) {
                await this.loadMonaco();
            }

            const container = document.getElementById(`monacoEditor-${this.windowId}`);
            if (!container) return;

            this.monacoEditor = monaco.editor.create(container, {
                value: this.getWelcomeCode(),
                language: this.currentLanguage,
                theme: 'vs-dark',
                fontSize: 14,
                fontFamily: 'Consolas, Monaco, Courier New, monospace',
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                wordWrap: 'on',
                bracketPairColorization: { enabled: true },
                guides: {
                    bracketPairs: true,
                    indentation: true
                }
            });

            // NEW: Track changes for unsaved indicator
            this.monacoEditor.onDidChangeModelContent(() => {
                if (this.activeFileId) {
                    this.markTabAsModified(this.activeFileId, true);

                    // Update content in file data
                    const fileData = this.getCurrentFileData();
                    if (fileData) {
                        fileData.content = this.monacoEditor.getValue();

                        // Update symbols when content changes (debounced)
                        clearTimeout(this.symbolUpdateTimeout);
                        this.symbolUpdateTimeout = setTimeout(() => {
                            this.updateSymbolDropdown();
                        }, 1000);
                    }
                }
            });
            this.setupErrorDetection();

            console.log('Monaco Editor initialized');
        } catch (error) {
            console.error('Failed to initialize Monaco Editor:', error);
            // Fallback to textarea if Monaco fails
            this.createFallbackEditor();
        }
    }

    /**
     * Load Monaco Editor from CDN (original)
     */
    loadMonaco() {
        return new Promise((resolve, reject) => {
            if (window.monaco) {
                resolve();
                return;
            }

            // Check if Monaco loader script is already loaded
            const existingLoader = document.querySelector('script[src*="monaco-editor"][src*="loader.min.js"]');
            if (existingLoader) {
                console.log('Monaco loader script already exists, waiting for it to load...');
                // Wait for the existing script to finish loading
                const checkMonaco = () => {
                    if (window.monaco) {
                        resolve();
                    } else {
                        setTimeout(checkMonaco, 100);
                    }
                };
                checkMonaco();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/loader.min.js';
            script.onload = () => {
                // Configure require to work with nodeIntegration
                require.config({
                    paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' },
                    // Disable Node.js file system access for CDN URLs
                    nodeRequire: false,
                    nodeMain: false
                });

                // Override the loader's file reading to use fetch for HTTP URLs
                const originalLoad = require.load;
                require.load = function(context, moduleName, url) {
                    if (url && url.startsWith('http')) {
                        // Use fetch for HTTP URLs instead of Node.js fs
                        return fetch(url)
                            .then(response => response.text())
                            .then(text => {
                                eval(text);
                                context.completeLoad(moduleName);
                            })
                            .catch(error => {
                                console.error('Failed to load Monaco module:', url, error);
                                context.onError(error);
                            });
                    } else {
                        // Use original loader for other URLs
                        return originalLoad.call(this, context, moduleName, url);
                    }
                };

                require(['vs/editor/editor.main'], () => {
                    resolve();
                });
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Create fallback textarea editor if Monaco fails (original)
     */
    createFallbackEditor() {
        const container = document.getElementById(`monacoEditor-${this.windowId}`);
        if (!container) return;

        container.innerHTML = `
            <textarea id="fallbackEditor-${this.windowId}" style="
                width: 100%;
                height: 100%;
                border: none;
                padding: 16px;
                font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
                font-size: 14px;
                background: #1e1e1e;
                color: #d4d4d4;
                resize: none;
                outline: none;
                line-height: 1.6;
                tab-size: 4;
            " placeholder="// Monaco Editor failed to load, using fallback editor">${this.getWelcomeCode()}</textarea>
        `;

        this.monacoEditor = {
            getValue: () => document.getElementById(`fallbackEditor-${this.windowId}`)?.value || '',
            setValue: (value) => {
                const editor = document.getElementById(`fallbackEditor-${this.windowId}`);
                if (editor) {
                    editor.value = value;
                    this.hasUnsavedChanges = false;
                    this.updateWindowTitle();
                }
            },
            getModel: () => ({ getLanguageId: () => this.currentLanguage }),
            onDidChangeModelContent: (callback) => {
                // Set up change tracking for fallback editor
                const editor = document.getElementById(`fallbackEditor-${this.windowId}`);
                if (editor) {
                    editor.addEventListener('input', callback);
                }
            }
        };

        // Set up change tracking for fallback editor
        this.monacoEditor.onDidChangeModelContent(() => {
            this.hasUnsavedChanges = true;
            this.updateWindowTitle();
        });
    }

    /**
     * Get welcome code example (original + enhanced)
     */
    getWelcomeCode() {
        const examples = {
            javascript: `// 🚀 Welcome to Enhanced Code Assistant!
// Now with JS execution + template loading

// Try these features:
// 1. 📋 Load templates from the dropdown above
// 2. ▶️ Click "Run" or press F5 to execute JavaScript
// 3. 🤖 Use AI buttons to get code help
// 4. 💾 Save your projects for later

// Example: Run this code with the Run button!
function greetUser(name = "Developer") {
    const message = 'Hello, ' + name + '! 🎉';
    console.log(message);
    
    // This will appear in the output panel
    console.log("Current time:", new Date().toLocaleTimeString());
    
    return {
        greeting: message,
        timestamp: Date.now(),
        features: ["JS Execution", "Template Loading", "AI Integration"]
    };
}

// Call the function - result will show in output
greetUser("Nebula Coder");

// TODO: Start coding your amazing project here!`,

            python: `# Welcome to Nebula Code Assistant! 🚀
# This Monaco editor supports full Python syntax highlighting

def greet_user(name="Developer"):
    message = f"Hello, {name}! Ready to code?"
    print(message)
    return message

# Try the AI buttons on the right →
# • Select an AI service (ChatGPT, Claude, etc.)
# • Click "Explain Code" to understand this code
# • Click "Optimize" for performance tips
# • Use "Paste from AI" to insert generated code

greet_user("Nebula User")

# TODO: Start coding your amazing project here!`,

            html: `<!-- Welcome to Nebula Code Assistant! 🚀 -->
<!-- This Monaco editor supports full HTML syntax highlighting -->

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Amazing Project</title>
</head>
<body>
    <h1>Hello, Nebula User! 👋</h1>
    <p>Ready to code?</p>
    
    <!-- Try the AI buttons on the right → -->
    <!-- • Select an AI service (ChatGPT, Claude, etc.) -->
    <!-- • Click "Explain Code" to understand this structure -->
    <!-- • Use "Paste from AI" to insert generated code -->
    
    <!-- TODO: Start building your amazing website here! -->
</body>
</html>`,

            css: `/* Welcome to Nebula Code Assistant! 🚀 */
/* This Monaco editor supports full CSS syntax highlighting */

:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    --text-color: #333;
    --bg-color: #f8f9fa;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    color: var(--text-color);
    margin: 0;
    padding: 20px;
}

.container {
    max-width: 800px;
    margin: 0 auto;
    background: var(--bg-color);
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

/* Try the AI buttons on the right → */
/* • Click "Explain Code" to understand this CSS */
/* • Use "Optimize" for better performance tips */
/* • Use "Paste from AI" to insert generated styles */

/* TODO: Start styling your amazing project here! */`,

            typescript: `// Welcome to Nebula Code Assistant! 🚀
// This Monaco editor supports full TypeScript syntax highlighting

interface User {
    name: string;
    email: string;
    isActive: boolean;
}

class UserManager {
    private users: User[] = [];
    
    constructor() {
        console.log('UserManager initialized');
    }
    
    addUser(user: User): void {
        this.users.push(user);
        console.log('Added user: ' + user.name);
    }
    
    getActiveUsers(): User[] {
        return this.users.filter(user => user.isActive);
    }
}

// Try the AI buttons on the right →
// • Click "Explain Code" to understand TypeScript concepts
// • Use "Optimize" for better type safety tips
// • Use "Paste from AI" to insert generated code

const userManager = new UserManager();
userManager.addUser({
    name: "Nebula Developer",
    email: "dev@nebula.com",
    isActive: true
});

// TODO: Start coding your amazing TypeScript project here!`,

            json: `{
  "name": "my-nebula-project",
  "version": "1.0.0",
  "description": "An amazing project built with Nebula Code Assistant 🚀",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.0",
    "lodash": "^4.17.21"
  },
  "devDependencies": {
    "nodemon": "^2.0.20",
    "jest": "^29.0.0"
  },
  "keywords": [
    "nebula",
    "desktop",
    "electron",
    "javascript"
  ],
  "author": "Nebula Developer",
  "license": "MIT"
}`,

            markdown: `# Welcome to Nebula Code Assistant! 🚀

This Monaco editor supports full **Markdown** syntax highlighting with live preview capabilities.

## Features

- ✅ **Syntax Highlighting** - Beautiful code coloring
- ✅ **AI Integration** - Smart code assistance  
- ✅ **Template Loading** - Quick project starters
- ✅ **Live Execution** - Run JavaScript instantly
- ✅ **Multi-language Support** - JS, Python, HTML, CSS, and more

## Quick Start

1. 📋 Load a template from the dropdown above
2. ✏️ Edit the code in the Monaco editor
3. ▶️ Press **F5** or click **Run** to execute JavaScript
4. 🤖 Use AI buttons for code help and optimization

## Code Example

\`\`\`javascript
function createAmazingApp() {
    console.log('Building something awesome with Nebula! 🌟');
    return { success: true, message: 'Ready to code!' };
}
\`\`\`

## Try the AI Features →

- 📖 **Explain** - Understand code concepts
- ⚡ **Optimize** - Improve performance  
- 🐛 **Debug** - Find and fix issues
- 💬 **Comment** - Add helpful comments
- 🧪 **Tests** - Generate unit tests

---

**TODO:** Start building your amazing project here!`
        };

        return examples[this.currentLanguage] || examples.javascript;
    }

    /**
     * Create webview for AI service (original)
     */
    createWebview() {
        // Check if current service is API-based (like LM Studio)
        if (this.isAPIService()) {
            this.createAPIInterface();
            return;
        }

        const container = document.getElementById(`webviewContainer-${this.windowId}`);
        if (!container) return;

        this.showLoading();

        // Remove existing webview
        if (this.webview) {
            this.webview.remove();
            this.webview = null;
        }

        // Create new webview
        this.webview = document.createElement('webview');
        this.webview.className = 'code-webview';
        this.webview.style.cssText = `
            width: 100%;
            height: 100%;
            border: none;
            background: var(--nebula-bg-primary);
        `;

        const currentService = this.aiServices[this.currentAIService];
        this.webview.src = currentService.url;

        this.setupWebviewListeners();
        container.appendChild(this.webview);

        console.log(`Created code webview for ${currentService.name}`);
    }

    /**
     * Create API interface for LM Studio with Chat
     */
    createAPIInterface() {
        const container = document.getElementById(`webviewContainer-${this.windowId}`);
        if (!container) return;

        container.innerHTML = `
            <div style="
                height: 100%;
                display: flex;
                flex-direction: column;
                background: var(--nebula-bg-primary);
                font-family: var(--nebula-font-family);
                overflow: hidden;
            ">
                <!-- Header -->
                <div style="
                    padding: 16px;
                    border-bottom: 1px solid var(--nebula-border);
                    background: var(--nebula-surface);
                    text-align: center;
                    position: relative;
                    flex-shrink: 0;
                ">
                    <button id="lmConfigBtn-${this.windowId}" style="
                        position: absolute;
                        top: 12px;
                        right: 12px;
                        background: var(--nebula-surface-hover);
                        border: 1px solid var(--nebula-border);
                        color: var(--nebula-text-secondary);
                        padding: 6px;
                        border-radius: var(--nebula-radius-sm);
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        width: 32px;
                        height: 32px;
                    " title="LM Studio Settings">
                        ⚙️
                    </button>
                    <div style="font-size: 24px; margin-bottom: 8px;">🏠</div>
                    <div style="font-weight: 600; color: var(--nebula-text-primary);">LM Studio Local AI</div>
                    <div style="font-size: 12px; color: var(--nebula-text-secondary); margin-top: 4px;">
                        Status: <span id="lmStatus-${this.windowId}" style="color: #ef4444;">Checking connection...</span>
                    </div>
                </div>
                
                <!-- Chat Area -->
                <div id="chatArea-${this.windowId}" style="
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    min-height: 0;
                    height: 100%;
                ">
                    <!-- Messages Container -->
                    <div id="messagesContainer-${this.windowId}" style="
                        flex: 1;
                        overflow-y: auto;
                        overflow-x: hidden;
                        padding: 16px;
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                        min-height: 0;
                        scrollbar-width: thin;
                        scrollbar-color: var(--nebula-border) transparent;
                    ">
                        <!-- Welcome Message -->
                        <div style="
                            background: var(--nebula-surface);
                            border: 1px solid var(--nebula-border);
                            border-radius: var(--nebula-radius-md);
                            padding: 16px;
                            text-align: center;
                        ">
                            <div style="font-size: 32px; margin-bottom: 12px;">🤖</div>
                            <div style="font-weight: 600; color: var(--nebula-text-primary); margin-bottom: 8px;">Welcome to LM Studio Chat!</div>
                            <div style="color: var(--nebula-text-secondary); font-size: 14px;">
                                Ask me anything about coding, get help with your projects, or just chat!<br>
                                I can also help with the code in your editor using the action buttons above.
                            </div>
                        </div>
                    </div>
                    
                    <!-- Input Area -->
                    <div style="
                        border-top: 1px solid var(--nebula-border);
                        background: var(--nebula-surface);
                        padding: 16px;
                        flex-shrink: 0;
                    ">
                        <!-- File Context Controls -->
                        <div style="
                            display: flex;
                            gap: 8px;
                            margin-bottom: 12px;
                            flex-wrap: wrap;
                        ">
                            <button id="includeCurrentFileBtn-${this.windowId}" style="
                                background: var(--nebula-surface-hover);
                                border: 1px solid var(--nebula-border);
                                color: var(--nebula-text-secondary);
                                padding: 6px 12px;
                                border-radius: var(--nebula-radius-sm);
                                cursor: pointer;
                                font-size: 12px;
                                display: flex;
                                align-items: center;
                                gap: 4px;
                                transition: all 0.2s;
                            " title="Include current file content">
                                📄 <span>Current File</span>
                            </button>
                            <button id="includeSelectionBtn-${this.windowId}" style="
                                background: var(--nebula-surface-hover);
                                border: 1px solid var(--nebula-border);
                                color: var(--nebula-text-secondary);
                                padding: 6px 12px;
                                border-radius: var(--nebula-radius-sm);
                                cursor: pointer;
                                font-size: 12px;
                                display: flex;
                                align-items: center;
                                gap: 4px;
                                transition: all 0.2s;
                            " title="Include selected text">
                                ✂️ <span>Selection</span>
                            </button>
                            <div id="contextIndicator-${this.windowId}" style="
                                color: var(--nebula-text-secondary);
                                font-size: 11px;
                                padding: 6px 8px;
                                display: none;
                                align-items: center;
                                gap: 4px;
                                background: rgba(76, 175, 80, 0.1);
                                border: 1px solid rgba(76, 175, 80, 0.3);
                                border-radius: var(--nebula-radius-sm);
                            ">
                                📎 <span id="contextText-${this.windowId}">Context included</span>
                            </div>
                        </div>
                        
                        <div style="display: flex; gap: 8px; align-items: flex-end;">
                            <textarea id="chatInput-${this.windowId}" 
                                placeholder="Type your message here... (Shift+Enter for new line, Enter to send)"
                                style="
                                    flex: 1;
                                    min-height: 40px;
                                    max-height: 120px;
                                    padding: 10px;
                                    border: 1px solid var(--nebula-border);
                                    border-radius: var(--nebula-radius-sm);
                                    background: var(--nebula-bg-primary);
                                    color: var(--nebula-text-primary);
                                    font-family: var(--nebula-font-family);
                                    font-size: 14px;
                                    resize: vertical;
                                    outline: none;
                                "
                            ></textarea>
                            <button id="sendBtn-${this.windowId}" style="
                                background: var(--nebula-primary);
                                border: 1px solid var(--nebula-primary);
                                color: white;
                                padding: 10px 16px;
                                border-radius: var(--nebula-radius-sm);
                                cursor: pointer;
                                font-weight: 600;
                                min-width: 70px;
                                height: 40px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                gap: 6px;
                            " disabled>
                                <span>Send</span>
                                <span style="font-size: 12px;">↵</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Setup event listeners
        this.setupChatEventListeners();
        
        // Fix chat container height
        this.fixChatContainerHeight();
        
        // Setup settings button
        document.getElementById(`lmConfigBtn-${this.windowId}`)?.addEventListener('click', () => {
            this.showLMStudioConfig();
        });

        // Test LM Studio connection
        this.testLMStudioConnection();
        console.log('Created LM Studio API interface with chat');
    }

    /**
     * Fix chat container height to enable proper scrolling
     */
    fixChatContainerHeight() {
        const container = document.getElementById(`webviewContainer-${this.windowId}`);
        const chatArea = document.getElementById(`chatArea-${this.windowId}`);
        const messagesContainer = document.getElementById(`messagesContainer-${this.windowId}`);
        
        if (!container || !chatArea || !messagesContainer) return;
        
        // Force a specific height calculation
        setTimeout(() => {
            const containerHeight = container.offsetHeight;
            const headerHeight = 120; // Approximate header height
            const inputHeight = 100;  // Approximate input area height
            const availableHeight = containerHeight - headerHeight - inputHeight;
            
            messagesContainer.style.height = `${availableHeight}px`;
            messagesContainer.style.maxHeight = `${availableHeight}px`;
            
            console.log(`Set messages container height to ${availableHeight}px`);
        }, 100);
        
        // Add resize handler to recalculate on window resize
        window.addEventListener('resize', () => {
            setTimeout(() => this.fixChatContainerHeight(), 100);
        });
    }

    /**
     * Setup chat event listeners
     */
    setupChatEventListeners() {
        const chatInput = document.getElementById(`chatInput-${this.windowId}`);
        const sendBtn = document.getElementById(`sendBtn-${this.windowId}`);
        const includeCurrentFileBtn = document.getElementById(`includeCurrentFileBtn-${this.windowId}`);
        const includeSelectionBtn = document.getElementById(`includeSelectionBtn-${this.windowId}`);
        
        if (!chatInput || !sendBtn) return;

        // Enable/disable send button based on input
        chatInput.addEventListener('input', () => {
            const hasText = chatInput.value.trim().length > 0;
            sendBtn.disabled = !hasText;
            sendBtn.style.opacity = hasText ? '1' : '0.5';
        });

        // Handle Enter key (send) and Shift+Enter (new line)
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendChatMessage();
            }
        });

        // Send button click
        sendBtn.addEventListener('click', () => {
            this.sendChatMessage();
        });

        // File context buttons
        if (includeCurrentFileBtn) {
            includeCurrentFileBtn.addEventListener('click', () => {
                this.toggleCurrentFileContext();
            });
        }

        if (includeSelectionBtn) {
            includeSelectionBtn.addEventListener('click', () => {
                this.toggleSelectionContext();
            });
        }
    }

    /**
     * Toggle current file inclusion in chat context
     */
    toggleCurrentFileContext() {
        this.fileContext.includeCurrentFile = !this.fileContext.includeCurrentFile;
        
        if (this.fileContext.includeCurrentFile) {
            this.extractCurrentFileContent();
        } else {
            this.fileContext.currentFileContent = null;
            this.fileContext.fileName = null;
        }
        
        this.updateFileContextButtons();
        this.updateContextIndicator();
    }

    /**
     * Toggle selection inclusion in chat context
     */
    toggleSelectionContext() {
        this.fileContext.includeSelection = !this.fileContext.includeSelection;
        
        if (this.fileContext.includeSelection) {
            this.extractSelectedText();
        } else {
            this.fileContext.selectedText = null;
        }
        
        this.updateFileContextButtons();
        this.updateContextIndicator();
    }

    /**
     * Extract current file content from Monaco editor
     */
    extractCurrentFileContent() {
        if (!this.monacoEditor) {
            console.warn('Monaco editor not available');
            return;
        }

        try {
            const content = this.monacoEditor.getValue();
            const model = this.monacoEditor.getModel();
            const fileName = model ? model.uri.path.split('/').pop() : 'current-file';
            
            this.fileContext.currentFileContent = content;
            this.fileContext.fileName = fileName;
            
            console.log(`Extracted ${content.length} characters from ${fileName}`);
        } catch (error) {
            console.error('Error extracting file content:', error);
            this.fileContext.currentFileContent = null;
            this.fileContext.fileName = null;
        }
    }

    /**
     * Extract selected text from Monaco editor
     */
    extractSelectedText() {
        if (!this.monacoEditor) {
            console.warn('Monaco editor not available');
            return;
        }

        try {
            const selection = this.monacoEditor.getSelection();
            const selectedText = this.monacoEditor.getModel().getValueInRange(selection);
            
            this.fileContext.selectedText = selectedText.trim();
            
            if (!this.fileContext.selectedText) {
                // If no selection, get current line
                const position = this.monacoEditor.getPosition();
                const lineText = this.monacoEditor.getModel().getLineContent(position.lineNumber);
                this.fileContext.selectedText = lineText.trim();
            }
            
            console.log(`Extracted selection: ${this.fileContext.selectedText.length} characters`);
        } catch (error) {
            console.error('Error extracting selection:', error);
            this.fileContext.selectedText = null;
        }
    }

    /**
     * Update file context button states
     */
    updateFileContextButtons() {
        const currentFileBtn = document.getElementById(`includeCurrentFileBtn-${this.windowId}`);
        const selectionBtn = document.getElementById(`includeSelectionBtn-${this.windowId}`);
        
        if (currentFileBtn) {
            if (this.fileContext.includeCurrentFile) {
                currentFileBtn.style.background = 'var(--nebula-primary)';
                currentFileBtn.style.color = 'white';
                currentFileBtn.style.borderColor = 'var(--nebula-primary)';
            } else {
                currentFileBtn.style.background = 'var(--nebula-surface-hover)';
                currentFileBtn.style.color = 'var(--nebula-text-secondary)';
                currentFileBtn.style.borderColor = 'var(--nebula-border)';
            }
        }
        
        if (selectionBtn) {
            if (this.fileContext.includeSelection) {
                selectionBtn.style.background = 'var(--nebula-primary)';
                selectionBtn.style.color = 'white';
                selectionBtn.style.borderColor = 'var(--nebula-primary)';
            } else {
                selectionBtn.style.background = 'var(--nebula-surface-hover)';
                selectionBtn.style.color = 'var(--nebula-text-secondary)';
                selectionBtn.style.borderColor = 'var(--nebula-border)';
            }
        }
    }

    /**
     * Update context indicator
     */
    updateContextIndicator() {
        const indicator = document.getElementById(`contextIndicator-${this.windowId}`);
        const contextText = document.getElementById(`contextText-${this.windowId}`);
        
        if (!indicator || !contextText) return;
        
        const hasContext = this.fileContext.includeCurrentFile || this.fileContext.includeSelection;
        
        if (hasContext) {
            let text = '';
            if (this.fileContext.includeCurrentFile && this.fileContext.includeSelection) {
                text = `File + Selection (${this.fileContext.fileName || 'current'})`;
            } else if (this.fileContext.includeCurrentFile) {
                text = `File: ${this.fileContext.fileName || 'current'}`;
            } else if (this.fileContext.includeSelection) {
                text = 'Selection included';
            }
            
            contextText.textContent = text;
            indicator.style.display = 'flex';
        } else {
            indicator.style.display = 'none';
        }
    }

    /**
     * Build context message for AI
     */
    buildContextMessage(userMessage) {
        let message = userMessage;
        let contextParts = [];
        
        if (this.fileContext.includeCurrentFile && this.fileContext.currentFileContent) {
            const content = this.fileContext.currentFileContent;
            const fileName = this.fileContext.fileName || 'current-file';
            
            // For large files, include a smart summary
            if (content.length > 8000) {
                const preview = content.substring(0, 4000);
                const ending = content.substring(content.length - 2000);
                contextParts.push(`\n\n--- FILE CONTEXT: ${fileName} (${content.length} chars, showing preview) ---\n${preview}\n\n... [file continues] ...\n\n${ending}\n--- END FILE CONTEXT ---`);
            } else {
                contextParts.push(`\n\n--- FILE CONTEXT: ${fileName} ---\n${content}\n--- END FILE CONTEXT ---`);
            }
        }
        
        if (this.fileContext.includeSelection && this.fileContext.selectedText) {
            contextParts.push(`\n\n--- SELECTED TEXT ---\n${this.fileContext.selectedText}\n--- END SELECTION ---`);
        }
        
        if (contextParts.length > 0) {
            message = userMessage + contextParts.join('');
        }
        
        return message;
    }

    /**
     * Clear file context after sending message
     */
    clearFileContext() {
        this.fileContext.includeCurrentFile = false;
        this.fileContext.includeSelection = false;
        this.fileContext.currentFileContent = null;
        this.fileContext.selectedText = null;
        this.fileContext.fileName = null;
        
        this.updateFileContextButtons();
        this.updateContextIndicator();
    }

    /**
     * Send chat message to LM Studio
     */
    async sendChatMessage() {
        const chatInput = document.getElementById(`chatInput-${this.windowId}`);
        const sendBtn = document.getElementById(`sendBtn-${this.windowId}`);
        
        if (!chatInput || !sendBtn) return;
        
        const message = chatInput.value.trim();
        if (!message) return;

        // Clear input and disable send button
        chatInput.value = '';
        sendBtn.disabled = true;
        sendBtn.style.opacity = '0.5';
        
        // Re-focus the input for better UX
        chatInput.focus();

        // Add user message to chat
        this.addChatMessage(message, 'user');
        
        // Build message with context if enabled
        const contextualMessage = this.buildContextMessage(message);
        
        // Clear file context after sending (optional - comment out if you want it to persist)
        this.clearFileContext();
        
        // Show typing indicator
        const typingId = this.addTypingIndicator();
        
        try {
            // Send to LM Studio
            const response = await fetch(`${this.lmStudioConfig.baseUrl}/v1/chat/completions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(30000),
                body: JSON.stringify({
                    model: this.lmStudioConfig.model,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a helpful AI assistant specializing in coding and development. Provide clear, concise, and helpful responses. When provided with file context, analyze the code carefully and provide specific suggestions.'
                        },
                        { role: 'user', content: contextualMessage }
                    ],
                    temperature: this.lmStudioConfig.temperature,
                    max_tokens: this.lmStudioConfig.maxTokens
                })
            });

            if (!response.ok) throw new Error(`API error: ${response.status}`);

            const result = await response.json();
            const aiResponse = result.choices[0]?.message?.content || 'No response received';
            
            // Remove typing indicator and add AI response
            this.removeTypingIndicator(typingId);
            this.addChatMessage(aiResponse, 'assistant');
            
        } catch (error) {
            console.error('❌ LM Studio chat error:', error);
            this.removeTypingIndicator(typingId);
            this.addChatMessage('❌ Sorry, I encountered an error. Please check your LM Studio connection.', 'error');
        }
    }

    /**
     * Add message to chat
     */
    addChatMessage(content, type = 'user') {
        const container = document.getElementById(`messagesContainer-${this.windowId}`);
        if (!container) return;

        const messageDiv = document.createElement('div');
        
        if (type === 'user') {
            messageDiv.style.cssText = `
                align-self: flex-end;
                max-width: 80%;
                background: var(--nebula-primary);
                color: white;
                padding: 12px 16px;
                border-radius: 18px 18px 4px 18px;
                font-size: 14px;
                line-height: 1.4;
                white-space: pre-wrap;
            `;
            messageDiv.textContent = content;
        } else if (type === 'assistant') {
            messageDiv.style.cssText = `
                align-self: flex-start;
                max-width: 80%;
                background: var(--nebula-surface);
                border: 1px solid var(--nebula-border);
                color: var(--nebula-text-primary);
                padding: 12px 16px;
                border-radius: 18px 18px 18px 4px;
                font-size: 14px;
                line-height: 1.4;
                white-space: pre-wrap;
            `;
            
            // 🚀 NEW: Enhanced message processing for code blocks and placement suggestions
            this.processAssistantMessage(messageDiv, content);
            
        } else if (type === 'error') {
            messageDiv.style.cssText = `
                align-self: center;
                max-width: 80%;
                background: rgba(239, 68, 68, 0.1);
                border: 1px solid rgba(239, 68, 68, 0.3);
                color: #ef4444;
                padding: 12px 16px;
                border-radius: var(--nebula-radius-md);
                font-size: 14px;
                line-height: 1.4;
                text-align: center;
            `;
            messageDiv.textContent = content;
        }

        container.appendChild(messageDiv);
        
        // Smooth scroll to bottom
        setTimeout(() => {
            container.scrollTo({
                top: container.scrollHeight,
                behavior: 'smooth'
            });
        }, 10);
    }

    /**
     * 🚀 NEW: Process assistant messages for code blocks and placement suggestions
     */
    processAssistantMessage(messageDiv, content) {
        // Detect code blocks with ```
        const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)\n?```/g;
        const placementSuggestionRegex = /(place|add|insert|put).*(?:in|at|to|inside|above|below|after|before)\s+([^\n.]+)/gi;
        
        let lastIndex = 0;
        let hasCodeBlocks = false;
        const matches = [...content.matchAll(codeBlockRegex)];
        
        if (matches.length === 0) {
            // No code blocks, just add as text
            messageDiv.textContent = content;
            return;
        }

        // Process message with code blocks
        matches.forEach((match, index) => {
            const beforeText = content.slice(lastIndex, match.index);
            const codeLanguage = match[1] || 'javascript';
            const codeContent = match[2].trim();
            
            // Add text before code block
            if (beforeText.trim()) {
                const textSpan = document.createElement('span');
                textSpan.textContent = beforeText;
                messageDiv.appendChild(textSpan);
            }
            
            // Create code block container
            const codeContainer = document.createElement('div');
            codeContainer.style.cssText = `
                margin: 8px 0;
                border: 1px solid var(--nebula-border);
                border-radius: 6px;
                background: #1e1e1e;
                overflow: hidden;
            `;
            
            // Code header with language and placement button
            const codeHeader = document.createElement('div');
            codeHeader.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 12px;
                background: rgba(255, 255, 255, 0.05);
                border-bottom: 1px solid var(--nebula-border);
                font-size: 12px;
                color: #888;
            `;
            
            const languageLabel = document.createElement('span');
            languageLabel.textContent = codeLanguage;
            codeHeader.appendChild(languageLabel);
            
            // Check for placement suggestions in the surrounding text
            const contextText = beforeText + content.slice(match.index + match[0].length, match.index + match[0].length + 200);
            const placementMatches = [...contextText.matchAll(placementSuggestionRegex)];
            
            if (placementMatches.length > 0) {
                const placementBtn = document.createElement('button');
                placementBtn.innerHTML = '📍 Smart Place';
                placementBtn.style.cssText = `
                    background: var(--nebula-primary);
                    color: white;
                    border: none;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 11px;
                    cursor: pointer;
                    transition: background 0.2s;
                `;
                
                placementBtn.addEventListener('mouseover', () => {
                    placementBtn.style.background = 'var(--nebula-primary-hover)';
                });
                
                placementBtn.addEventListener('mouseout', () => {
                    placementBtn.style.background = 'var(--nebula-primary)';
                });
                
                placementBtn.addEventListener('click', () => {
                    this.smartPlaceCode(codeContent, placementMatches[0][0], contextText);
                });
                
                codeHeader.appendChild(placementBtn);
            }
            
            codeContainer.appendChild(codeHeader);
            
            // Code content
            const codeElement = document.createElement('pre');
            codeElement.style.cssText = `
                margin: 0;
                padding: 12px;
                color: #d4d4d4;
                font-family: 'Fira Code', monospace;
                font-size: 13px;
                line-height: 1.4;
                overflow-x: auto;
                white-space: pre-wrap;
            `;
            codeElement.textContent = codeContent;
            codeContainer.appendChild(codeElement);
            
            messageDiv.appendChild(codeContainer);
            
            lastIndex = match.index + match[0].length;
            hasCodeBlocks = true;
        });
        
        // Add any remaining text after the last code block
        const remainingText = content.slice(lastIndex);
        if (remainingText.trim()) {
            const textSpan = document.createElement('span');
            textSpan.textContent = remainingText;
            messageDiv.appendChild(textSpan);
        }
    }

    /**
     * 🚀 NEW: Smart placement of code based on AI suggestions
     */
    smartPlaceCode(code, suggestion, context) {
        if (!this.monacoEditor) {
            this.showNotification('❌ No active editor to place code', 'error');
            return;
        }
        
        const currentCode = this.monacoEditor.getValue();
        const lines = currentCode.split('\n');
        
        // Parse placement suggestion
        const lowerSuggestion = suggestion.toLowerCase();
        const lowerContext = context.toLowerCase();
        
        let targetLocation = null;
        let insertMode = 'at-cursor'; // Default fallback
        
        // Try to extract target method/function/location
        const methodMatch = suggestion.match(/(?:in|at|to|inside|above|below|after|before)\s+([^.\n]+)/i);
        if (methodMatch) {
            const target = methodMatch[1].trim();
            
            // Search for the target in the code
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (line.includes(target)) {
                    targetLocation = i;
                    
                    // Determine insertion mode based on suggestion
                    if (lowerSuggestion.includes('above') || lowerSuggestion.includes('before')) {
                        insertMode = 'above';
                    } else if (lowerSuggestion.includes('below') || lowerSuggestion.includes('after')) {
                        insertMode = 'below';
                    } else if (lowerSuggestion.includes('inside') || lowerSuggestion.includes('in')) {
                        insertMode = 'inside';
                    }
                    break;
                }
            }
        }
        
        // Perform the placement
        if (targetLocation !== null) {
            this.placeCodeAtLocation(code, targetLocation, insertMode);
            this.showNotification(`✅ Code placed ${insertMode} target location!`, 'success');
        } else {
            // Fallback to cursor position
            const position = this.monacoEditor.getPosition();
            this.monacoEditor.executeEdits('smart-placement', [{
                range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
                text: '\n' + code + '\n'
            }]);
            this.showNotification('📍 Code placed at cursor (target not found)', 'info');
        }
    }

    /**
     * 🚀 NEW: Place code at specific location with different modes
     */
    placeCodeAtLocation(code, targetLine, mode) {
        const lines = this.monacoEditor.getValue().split('\n');
        let insertLine = targetLine;
        
        if (mode === 'above') {
            insertLine = targetLine;
        } else if (mode === 'below') {
            insertLine = targetLine + 1;
        } else if (mode === 'inside') {
            // Look for opening brace after target line
            for (let i = targetLine; i < Math.min(targetLine + 10, lines.length); i++) {
                if (lines[i].includes('{')) {
                    insertLine = i + 1;
                    break;
                }
            }
        }
        
        // Insert the code
        this.monacoEditor.executeEdits('smart-placement', [{
            range: new monaco.Range(insertLine + 1, 1, insertLine + 1, 1),
            text: code + '\n'
        }]);
        
        // Move cursor to inserted code
        this.monacoEditor.setPosition({ lineNumber: insertLine + 1, column: 1 });
        this.monacoEditor.focus();
    }

    /**
     * Add typing indicator
     */
    addTypingIndicator() {
        const container = document.getElementById(`messagesContainer-${this.windowId}`);
        if (!container) return null;

        const typingDiv = document.createElement('div');
        const typingId = `typing-${Date.now()}`;
        typingDiv.id = typingId;
        
        typingDiv.style.cssText = `
            align-self: flex-start;
            background: var(--nebula-surface);
            border: 1px solid var(--nebula-border);
            color: var(--nebula-text-secondary);
            padding: 12px 16px;
            border-radius: 18px 18px 18px 4px;
            font-size: 14px;
            font-style: italic;
        `;
        
        typingDiv.innerHTML = `
            <span>🤖 AI is thinking</span>
            <span class="typing-dots">...</span>
        `;
        
        container.appendChild(typingDiv);
        
        // Smooth scroll to bottom
        setTimeout(() => {
            container.scrollTo({
                top: container.scrollHeight,
                behavior: 'smooth'
            });
        }, 10);
        
        return typingId;
    }

    /**
     * Remove typing indicator
     */
    removeTypingIndicator(typingId) {
        if (typingId) {
            const element = document.getElementById(typingId);
            if (element) element.remove();
        }
    }

    /**
     * Test connection to LM Studio
     */
    async testLMStudioConnection() {
        const statusElement = document.getElementById(`lmStatus-${this.windowId}`);
        if (!statusElement) return;

        try {
            const response = await fetch(`${this.lmStudioConfig.baseUrl}/v1/models`, {
                method: 'GET',
                signal: AbortSignal.timeout(3000) // 3 second timeout
            });

            if (response.ok) {
                statusElement.textContent = 'Connected ✅';
                statusElement.style.color = '#4ade80';
                console.log('✅ LM Studio connection successful');
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            statusElement.textContent = 'Disconnected ❌';
            statusElement.style.color = '#ef4444';
            console.log('❌ LM Studio connection failed:', error.message);
        }
    }

    /**
     * Show LM Studio configuration modal
     */
    showLMStudioConfig() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: var(--nebula-surface);
            border: 1px solid var(--nebula-border);
            border-radius: var(--nebula-radius-md);
            padding: 24px;
            min-width: 500px;
            max-width: 600px;
        `;

        dialog.innerHTML = `
            <h3 style="color: var(--nebula-text-primary); margin: 0 0 16px 0;">🏠 LM Studio Configuration</h3>
            
            <div style="margin-bottom: 16px;">
                <label style="display: block; font-size: 12px; font-weight: 600; color: var(--nebula-text-secondary); margin-bottom: 4px;">
                    API Base URL
                </label>
                <input type="text" id="lmBaseUrl" value="${this.lmStudioConfig.baseUrl}" style="
                    width: 100%;
                    padding: 8px 12px;
                    border: 1px solid var(--nebula-border);
                    border-radius: var(--nebula-radius-sm);
                    background: var(--nebula-bg-primary);
                    color: var(--nebula-text-primary);
                    font-size: 14px;
                    font-family: monospace;
                ">
                <div style="font-size: 11px; color: var(--nebula-text-secondary); margin-top: 4px;">
                    Example: http://192.168.1.100:1234 or http://localhost:1234
                </div>
            </div>

            <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px;">
                <button id="testConnectionBtn" style="
                    background: var(--nebula-secondary);
                    border: 1px solid var(--nebula-secondary);
                    color: white;
                    padding: 8px 16px;
                    border-radius: var(--nebula-radius-sm);
                    cursor: pointer;
                ">Test Connection</button>
                <button id="saveConfigBtn" style="
                    background: var(--nebula-primary);
                    border: 1px solid var(--nebula-primary);
                    color: white;
                    padding: 8px 16px;
                    border-radius: var(--nebula-radius-sm);
                    cursor: pointer;
                ">Save & Apply</button>
                <button id="cancelConfigBtn" style="
                    background: var(--nebula-surface-hover);
                    border: 1px solid var(--nebula-border);
                    color: var(--nebula-text-primary);
                    padding: 8px 16px;
                    border-radius: var(--nebula-radius-sm);
                    cursor: pointer;
                ">Cancel</button>
            </div>
        `;

        modal.appendChild(dialog);
        document.body.appendChild(modal);

        const cleanup = () => document.body.removeChild(modal);

        // Save button
        dialog.querySelector('#saveConfigBtn').addEventListener('click', () => {
            const baseUrl = dialog.querySelector('#lmBaseUrl').value.trim();
            if (baseUrl) {
                this.lmStudioConfig.baseUrl = baseUrl;
                localStorage.setItem('lmStudioConfig', JSON.stringify(this.lmStudioConfig));
                this.testLMStudioConnection();
                console.log('LM Studio config saved:', baseUrl);
            }
            cleanup();
        });

        // Test button
        dialog.querySelector('#testConnectionBtn').addEventListener('click', async () => {
            const baseUrl = dialog.querySelector('#lmBaseUrl').value.trim();
            const btn = dialog.querySelector('#testConnectionBtn');
            btn.textContent = 'Testing...';
            
            try {
                const response = await fetch(`${baseUrl}/v1/models`, { signal: AbortSignal.timeout(5000) });
                btn.textContent = response.ok ? 'Connected ✅' : 'Failed ❌';
                btn.style.background = response.ok ? '#4ade80' : '#ef4444';
            } catch (error) {
                btn.textContent = 'Failed ❌';
                btn.style.background = '#ef4444';
            }
            
            setTimeout(() => {
                btn.textContent = 'Test Connection';
                btn.style.background = '';
            }, 2000);
        });

        dialog.querySelector('#cancelConfigBtn').addEventListener('click', cleanup);
    }

    /**
     * Set up webview event listeners (original)
     */
    setupWebviewListeners() {
        if (!this.webview) return;

        this.webview.addEventListener('dom-ready', () => {
            this.hideLoading();
            console.log('Code AI webview loaded');
        });

        this.webview.addEventListener('did-start-loading', () => {
            this.showLoading();
        });

        this.webview.addEventListener('did-stop-loading', () => {
            this.hideLoading();
        });

        this.webview.addEventListener('did-fail-load', (e) => {
            this.hideLoading();
            console.error('Code AI webview failed to load:', e);
        });

        this.webview.addEventListener('new-window', (e) => {
            e.preventDefault();
            console.log('New window requested:', e.url);
        });
    }

    /**
     * Switch programming language (original)
     */
    switchLanguage(language) {
        this.currentLanguage = language;

        if (this.monacoEditor && monaco) {
            // Handle special cases for languages not natively supported by Monaco
            let monacoLanguage = language;
            if (language === 'basic') {
                monacoLanguage = 'plaintext'; // Use plaintext for now, custom definition in Phase 2
            }

            monaco.editor.setModelLanguage(this.monacoEditor.getModel(), monacoLanguage);
        }

        console.log(`Switched to ${language}`);
    }

    /**
     * Switch AI service (original)
     */
    switchAIService(serviceKey) {
        if (!this.aiServices[serviceKey]) {
            console.error('Unknown AI service:', serviceKey);
            return;
        }

        this.currentAIService = serviceKey;
        this.createWebview();

        console.log(`Switched to ${this.aiServices[serviceKey].name}`);
    }

    /**
     * Show/hide loading indicator (original)
     */
    showLoading() {
        const loading = document.getElementById(`chatLoading-${this.windowId}`);
        if (loading) loading.style.display = 'block';
    }

    hideLoading() {
        const loading = document.getElementById(`chatLoading-${this.windowId}`);
        if (loading) loading.style.display = 'none';
    }

    /**
     * File operations - ENHANCED with real filesystem access
     */
    // newFile() {
    //     if (this.hasUnsavedChanges && this.monacoEditor) {
    //         if (!confirm('Create new file? Unsaved changes will be lost.')) {
    //             return;
    //         }
    //     }

    //     if (this.monacoEditor) {
    //         this.monacoEditor.setValue(this.getWelcomeCode());
    //     }
    //     this.currentFilePath = null;
    //     this.hasUnsavedChanges = false;
    //     this.updateWindowTitle();
    //     this.clearOutput();
    //     this.writeOutput('New file created', 'info');
    //     console.log('New file created');
    // }

    newFile() {
    // Warn about unsaved changes in the current tab
    if (this.hasUnsavedChanges && this.monacoEditor) {
        if (!confirm('Create new file? Unsaved changes will be lost.')) {
            return;
        }
    }

    // Create a new tab with default welcome code
    this.createNewTab(null, this.getWelcomeCode());
    this.writeOutput('New file tab created', 'info');
    console.log('New file tab created');
}

    // NEW: Open file from filesystem using NATIVE dialog
    async openFile() {
        try {
            // Use native file dialog if available, fallback to custom dialog
            if (window.PickerApp && typeof window.PickerApp.open === 'function') {
                const resultPath = await window.PickerApp.open({
                    title: 'Open File',
                    startPath: await window.nebula.fs.getHomeDir(),
                    pickType: 'open',
                    filters: [{ name: 'Code', extensions: ['html','css','md','txt','qbasic','bas','js','ts','json'] }],
                    preferFilter: 0
                });
                if (!resultPath) return;
                await this.loadFileContent(resultPath);
                return;
            } else if (window.nebula?.dialog?.openFile) {
                const result = await window.nebula.dialog.openFile({
                    title: 'Open File',
                    defaultPath: await window.nebula.fs.getHomeDir()
                });

                if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
                    return;
                }

                const filePath = result.filePaths[0];
                await this.loadFileContent(filePath);
            } else {
                // Fallback to custom dialog
                const homeDir = await window.nebula.fs.getHomeDir();
                const filePath = await this.showInputDialog('Open File', 'Enter file path to open:', homeDir + '/');
                if (!filePath) return;

                await this.loadFileContent(filePath);
            }

        } catch (error) {
            this.writeOutput(`❌ Failed to open file: ${error.message}`, 'error');
            console.error('File open error:', error);
        }
    }

    // NEW: Load file content (extracted for reuse)
    async loadFileContent(filePath) {
        // Check if file exists
        const exists = await window.nebula.fs.exists(filePath);
        if (!exists) {
            alert('File not found: ' + filePath);
            return;
        }

        // Read file content
        this.writeOutput(`Opening file: ${filePath}...`, 'info');
        const content = await window.nebula.fs.readFile(filePath);

        // Always open in a new tab and set file path
        this.createNewTab(filePath, content);
        this.currentFilePath = filePath;
        this.hasUnsavedChanges = false;
        this.updateWindowTitle();

        // Auto-detect language from file extension
        const extension = filePath.split('.').pop().toLowerCase();
        const languageMap = {
            'js': 'javascript',
            'ts': 'typescript',
            'py': 'python',
            'bas': 'basic',
            'qb': 'basic',
            'html': 'html',
            'css': 'css',
            'json': 'json',
            'md': 'markdown'
        };
        // yay it works!

        if (languageMap[extension]) {
            this.switchLanguage(languageMap[extension]);
            const languageSelect = document.getElementById(`languageSelect-${this.windowId}`);
            if (languageSelect) languageSelect.value = languageMap[extension];
        }

        this.writeOutput(`✅ File opened successfully!`, 'success');

        // NEW: Check for dependencies and load them automatically
        await this.detectAndLoadDependencies(filePath, content);
    }

    // NEW: Dependency Detection and Loading System
    async detectAndLoadDependencies(mainFilePath, content) {
        if (!content || typeof content !== 'string') return;

        this.writeOutput(`🔍 Analyzing dependencies for ${mainFilePath}...`, 'info');

        // Extract potential dependencies from JavaScript code
        const result = this.extractDependencies(content);
        const dependencies = result.dependencies;
        const inFileClasses = result.inFileClasses;

        // Report in-file classes
        if (inFileClasses.length > 0) {
            inFileClasses.forEach(className => {
                this.writeOutput(`📄 In-file class found: ${className}`, 'info');
            });
        }

        if (dependencies.length === 0) {
            this.writeOutput(`✅ No external dependencies found.`, 'success');
            return;
        }

        this.writeOutput(`📦 Found ${dependencies.length} potential dependencies: ${dependencies.join(', ')}`, 'info');

        // Get directory of main file
        const dirPath = mainFilePath.substring(0, mainFilePath.lastIndexOf('/'));
        const loadedDeps = [];

        // Try to find and load each dependency
        for (const dep of dependencies) {
            let depPath = null;
            let foundFile = null;

            // First try exact match: ClassName.js
            const exactPath = `${dirPath}/${dep}.js`;
            if (await window.nebula.fs.exists(exactPath)) {
                depPath = exactPath;
                foundFile = `${dep}.js`;
            } else {
                // If exact match doesn't exist, scan directory for JS files that might contain the class
                try {
                    const files = await window.nebula.fs.readDir(dirPath);
                    this.writeOutput(`🔍 Scanning ${files.length} files in ${dirPath} for ${dep}`, 'info');
                    for (const file of files) {
                        if (file.endsWith('.js') && file !== mainFilePath.split('/').pop()) {
                            const filePath = `${dirPath}/${file}`;
                            try {
                                const fileContent = await window.nebula.fs.readFile(filePath);
                                // Check if file contains class definition
                                if (fileContent.includes(`class ${dep}`) || fileContent.includes(`function ${dep}`)) {
                                    depPath = filePath;
                                    foundFile = file;
                                    this.writeOutput(`✅ Found ${dep} in ${file}`, 'success');
                                    break;
                                }
                            } catch (error) {
                                this.writeOutput(`⚠️  Could not read ${file}: ${error.message}`, 'warning');
                                continue;
                            }
                        }
                    }
                } catch (error) {
                    this.writeOutput(`❌ Directory scan failed for ${dirPath}: ${error.message}`, 'error');
                }
            }

            if (depPath) {
                // Check if already loaded
                const alreadyLoaded = Array.from(this.openFiles.values()).some(file =>
                    file.path === depPath
                );

                if (!alreadyLoaded) {
                    this.writeOutput(`📂 Loading dependency: ${foundFile}`, 'info');
                    try {
                        const depContent = await window.nebula.fs.readFile(depPath);
                        this.createNewTab(depPath, depContent);
                        loadedDeps.push(foundFile);
                        this.writeOutput(`✅ Loaded ${foundFile}`, 'success');
                    } catch (error) {
                        this.writeOutput(`❌ Failed to load ${foundFile}: ${error.message}`, 'error');
                    }
                } else {
                    this.writeOutput(`ℹ️  ${foundFile} already loaded`, 'info');
                }
            } else {
                this.writeOutput(`⚠️  Dependency ${dep} not found in ${dirPath}`, 'warning');
            }
        }

        if (loadedDeps.length > 0) {
            this.writeOutput(`🎉 Successfully loaded ${loadedDeps.length} dependencies: ${loadedDeps.join(', ')}`, 'success');
        }
    }

    // Extract potential class/function dependencies from JavaScript code
    extractDependencies(code) {
        const dependencies = new Set();
        const inFileClasses = new Set();

        // First, find all classes defined in this file to exclude them
        const definedClasses = new Set();
        const classDeclarations = code.match(/class\s+([A-Z][a-zA-Z0-9_]*)/g);
        if (classDeclarations) {
            classDeclarations.forEach(match => {
                const className = match.match(/class\s+([A-Z][a-zA-Z0-9_]*)/)[1];
                definedClasses.add(className);
                inFileClasses.add(className);
            });
        }

        // Also check for function declarations that might be constructors
        const functionDeclarations = code.match(/function\s+([A-Z][a-zA-Z0-9_]*)\s*\(/g);
        if (functionDeclarations) {
            functionDeclarations.forEach(match => {
                const funcName = match.match(/function\s+([A-Z][a-zA-Z0-9_]*)/)[1];
                definedClasses.add(funcName);
                inFileClasses.add(funcName);
            });
        }

        // Expanded list of built-in JavaScript classes and globals to exclude
        const builtIns = new Set([
            'Array', 'Object', 'String', 'Number', 'Boolean', 'Date', 'RegExp', 'Error', 'Promise',
            'Map', 'Set', 'WeakMap', 'WeakSet', 'Symbol', 'BigInt', 'Math', 'JSON', 'URL', 'URLSearchParams',
            'FormData', 'Blob', 'File', 'FileReader', 'Image', 'ImageData', 'Canvas', 'Audio', 'Video',
            'MouseEvent', 'KeyboardEvent', 'TouchEvent', 'Event', 'CustomEvent', 'HTMLElement', 'Element',
            'Node', 'Document', 'Window', 'Navigator', 'Location', 'History', 'Storage', 'XMLHttpRequest',
            'WebSocket', 'Worker', 'SharedWorker', 'ServiceWorker', 'Notification', 'Geolocation',
            'MediaQueryList', 'CSSStyleDeclaration', 'DOMParser', 'XMLSerializer', 'TextEncoder', 'TextDecoder'
        ]);

        // Match class instantiations: new ClassName(
        const classMatches = code.match(/new\s+([A-Z][a-zA-Z0-9_]*)\s*\(/g);
        if (classMatches) {
            classMatches.forEach(match => {
                const className = match.match(/new\s+([A-Z][a-zA-Z0-9_]*)/)[1];
                // Skip built-ins and locally defined classes
                if (!builtIns.has(className) && !definedClasses.has(className)) {
                    dependencies.add(className);
                }
            });
        }

        // Match extends clauses: class Child extends Parent
        const extendsMatches = code.match(/extends\s+([A-Z][a-zA-Z0-9_]*)/g);
        if (extendsMatches) {
            extendsMatches.forEach(match => {
                const parentClass = match.match(/extends\s+([A-Z][a-zA-Z0-9_]*)/)[1];
                if (!builtIns.has(parentClass) && !definedClasses.has(parentClass)) {
                    dependencies.add(parentClass);
                }
            });
        }

        // More selective pattern matching - only match clear class references
        // Look for patterns like: this.manager = new SomeClass()
        // or: const manager = new SomeClass()
        const selectivePatterns = [
            // Assignment with new: const/let/var x = new ClassName
            /(?:const|let|var)\s+\w+\s*=\s*new\s+([A-Z][a-zA-Z0-9_]*)\s*\(/g,
            // Property assignment: this.prop = new ClassName
            /this\.\w+\s*=\s*new\s+([A-Z][a-zA-Z0-9_]*)\s*\(/g
            // Removed problematic pattern that was matching CSS classes and property names
        ];

        selectivePatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(code)) !== null) {
                const className = match[1];
                if (className && !builtIns.has(className) && !definedClasses.has(className)) {
                    // Additional heuristic: only include if it looks like a custom class name
                    // (longer than 3 chars, or contains multiple capital letters suggesting CamelCase)
                    if (className.length > 3 || (className.match(/[A-Z]/g) || []).length > 1) {
                        dependencies.add(className);
                    }
                }
            }
        });

        return {
            dependencies: Array.from(dependencies),
            inFileClasses: Array.from(inFileClasses)
        };
    }

    // ENHANCED: Save using NATIVE dialog
    async saveFile(saveAs = false) {
        if (!this.monacoEditor) return;

        const code = this.monacoEditor.getValue();
        if (!code.trim()) {
            alert('No content to save!');
            return;
        }

        try {
            let filePath = this.currentFilePath;

            // If no current file or Save As requested, use native save dialog
            if (!filePath || saveAs) {
                if (window.nebula?.dialog?.saveFile) {
                    const result = await window.nebula.dialog.saveFile({
                        title: saveAs ? 'Save As' : 'Save File',
                        defaultPath: filePath || (await window.nebula.fs.getHomeDir()) + '/untitled.js'
                    });

                    if (result.canceled || !result.filePath) {
                        return;
                    }

                    filePath = result.filePath;
                } else {
                    // Fallback to custom dialog
                    const homeDir = await window.nebula.fs.getHomeDir();
                    const defaultPath = filePath || homeDir + '/untitled.js';
                    filePath = await this.showInputDialog('Save File', 'Save file as:', defaultPath);
                    if (!filePath) return;
                }
            }

            this.writeOutput(`Saving file: ${filePath}...`, 'info');

            // Write file to filesystem
            await window.nebula.fs.writeFile(filePath, code);

            this.currentFilePath = filePath;
            this.hasUnsavedChanges = false;
            this.updateWindowTitle();
            this.writeOutput(`✅ File saved successfully!`, 'success');

            console.log(`File saved: ${filePath}`);

        } catch (error) {
            this.writeOutput(`❌ Failed to save file: ${error.message}`, 'error');
            console.error('File save error:', error);
        }
    }

    // NEW: Custom input dialog (replaces prompt())
    showInputDialog(title, message, defaultValue = '') {
        return new Promise((resolve) => {
            // Create modal dialog
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            `;

            const dialog = document.createElement('div');
            dialog.style.cssText = `
                background: var(--nebula-surface);
                border: 1px solid var(--nebula-border);
                border-radius: var(--nebula-radius-md);
                padding: 24px;
                min-width: 400px;
                max-width: 600px;
            `;

            dialog.innerHTML = `
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 16px 0;">${title}</h3>
                <p style="color: var(--nebula-text-secondary); margin: 0 0 16px 0;">${message}</p>
                <input type="text" id="inputField" value="${defaultValue}" style="
                    width: 100%;
                    padding: 8px 12px;
                    border: 1px solid var(--nebula-border);
                    border-radius: var(--nebula-radius-sm);
                    background: var(--nebula-bg-primary);
                    color: var(--nebula-text-primary);
                    font-size: 14px;
                    margin-bottom: 16px;
                ">
                <div style="display: flex; gap: 12px; justify-content: flex-end;">
                    <button id="cancelBtn" style="
                        background: var(--nebula-surface-hover);
                        border: 1px solid var(--nebula-border);
                        color: var(--nebula-text-primary);
                        padding: 8px 16px;
                        border-radius: var(--nebula-radius-sm);
                        cursor: pointer;
                    ">Cancel</button>
                    <button id="okBtn" style="
                        background: var(--nebula-primary);
                        border: 1px solid var(--nebula-primary);
                        color: white;
                        padding: 8px 16px;
                        border-radius: var(--nebula-radius-sm);
                        cursor: pointer;
                    ">OK</button>
                </div>
            `;

            modal.appendChild(dialog);
            document.body.appendChild(modal);

            // Focus input and select text
            const input = dialog.querySelector('#inputField');
            input.focus();
            input.select();

            // Handle buttons
            const cleanup = (result) => {
                document.body.removeChild(modal);
                resolve(result);
            };

            dialog.querySelector('#okBtn').addEventListener('click', () => {
                cleanup(input.value.trim() || null);
            });

            dialog.querySelector('#cancelBtn').addEventListener('click', () => {
                cleanup(null);
            });

            // Handle Enter/Escape keys
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    cleanup(input.value.trim() || null);
                } else if (e.key === 'Escape') {
                    cleanup(null);
                }
            });
        });
    }

    // NEW: Save As functionality
    async saveAsFile() {
        await this.saveFile(true);
    }

    // NEW: File browser for opening files
    async browseAndOpenFile() {
        try {
            const homeDir = await window.nebula.fs.getHomeDir();

            // Simple file browser - list directory contents
            const files = await window.nebula.fs.readDir(homeDir);

            // Filter for code files
            const codeFiles = files.filter(file => {
                const extensions = ['.js', '.ts', '.py', '.html', '.css', '.json', '.md', '.txt'];
                return extensions.some(ext => file.toLowerCase().endsWith(ext));
            });

            if (codeFiles.length === 0) {
                alert('No code files found in home directory.');
                return;
            }

            // Show file selection dialog
            const selectedFile = await this.showFilePickerDialog('Select File to Open', codeFiles, homeDir);
            if (!selectedFile) return;

            // Read and open the selected file
            const content = await window.nebula.fs.readFile(selectedFile);

            if (this.monacoEditor) {
                this.monacoEditor.setValue(content);
                this.currentFilePath = selectedFile;
                this.hasUnsavedChanges = false;
                this.updateWindowTitle();
                this.writeOutput(`✅ File opened: ${selectedFile}`, 'success');
            }

        } catch (error) {
            this.writeOutput(`❌ Failed to browse files: ${error.message}`, 'error');
            console.error('File browse error:', error);
        }
    }

    // NEW: File picker dialog (replaces prompt() for file selection)
    showFilePickerDialog(title, files, basePath) {
        return new Promise((resolve) => {
            // Create modal dialog
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            `;

            const dialog = document.createElement('div');
            dialog.style.cssText = `
                background: var(--nebula-surface);
                border: 1px solid var(--nebula-border);
                border-radius: var(--nebula-radius-md);
                padding: 24px;
                min-width: 500px;
                max-width: 700px;
                max-height: 80vh;
                display: flex;
                flex-direction: column;
            `;

            const fileListHtml = files.map((file, index) => `
                <div class="file-option" data-file="${file}" style="
                    padding: 8px 12px;
                    border: 1px solid transparent;
                    border-radius: var(--nebula-radius-sm);
                    cursor: pointer;
                    color: var(--nebula-text-primary);
                    transition: var(--nebula-transition-fast);
                " onmouseover="this.style.background='var(--nebula-surface-hover)'" 
                   onmouseout="this.style.background='transparent'">
                    📄 ${file}
                </div>
            `).join('');

            dialog.innerHTML = `
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 16px 0;">${title}</h3>
                <div style="
                    flex: 1;
                    border: 1px solid var(--nebula-border);
                    border-radius: var(--nebula-radius-sm);
                    padding: 12px;
                    background: var(--nebula-bg-primary);
                    overflow-y: auto;
                    margin-bottom: 16px;
                    max-height: 300px;
                ">
                    ${fileListHtml}
                </div>
                <div style="display: flex; gap: 12px; justify-content: flex-end;">
                    <button id="cancelBtn" style="
                        background: var(--nebula-surface-hover);
                        border: 1px solid var(--nebula-border);
                        color: var(--nebula-text-primary);
                        padding: 8px 16px;
                        border-radius: var(--nebula-radius-sm);
                        cursor: pointer;
                    ">Cancel</button>
                </div>
            `;

            modal.appendChild(dialog);
            document.body.appendChild(modal);

            let selectedFile = null;

            // Handle file selection
            dialog.querySelectorAll('.file-option').forEach(option => {
                option.addEventListener('click', () => {
                    // Remove previous selection
                    dialog.querySelectorAll('.file-option').forEach(o => {
                        o.style.background = 'transparent';
                        o.style.borderColor = 'transparent';
                    });

                    // Highlight selected
                    option.style.background = 'var(--nebula-primary)';
                    option.style.borderColor = 'var(--nebula-primary)';
                    option.style.color = 'white';

                    selectedFile = basePath + '/' + option.dataset.file;
                });

                // Double click to open
                option.addEventListener('dblclick', () => {
                    selectedFile = basePath + '/' + option.dataset.file;
                    cleanup(selectedFile);
                });
            });

            // Handle buttons
            const cleanup = (result) => {
                document.body.removeChild(modal);
                resolve(result);
            };

            dialog.querySelector('#cancelBtn').addEventListener('click', () => {
                cleanup(null);
            });

            // Handle Escape key
            document.addEventListener('keydown', function escapeHandler(e) {
                if (e.key === 'Escape') {
                    document.removeEventListener('keydown', escapeHandler);
                    cleanup(null);
                }
            });
        });
    }

    // NEW: Update window title and status bar with current tab
    updateWindowTitle() {
        const fileData = this.getCurrentFileData();
        const fileName = fileData ? fileData.name : 'No files open';
        const modified = fileData && fileData.hasUnsavedChanges ? ' •' : '';

        // Update window title
        if (window.windowManager && this.windowId) {
            const title = `💻 Code Assistant Pro - ${fileName}${modified}`;
            window.windowManager.setWindowTitle(this.windowId, title);
        }

        // Update status bar
        const fileStatus = document.getElementById(`fileStatus-${this.windowId}`);
        const fileInfo = document.getElementById(`fileInfo-${this.windowId}`);

        if (fileStatus) {
            if (!fileData) {
                fileStatus.textContent = 'No files open';
            } else {
                fileStatus.textContent = fileData.hasUnsavedChanges ? 'Modified' : 'Saved';
            }
        }

        if (fileInfo) {
            if (fileData && fileData.path) {
                fileInfo.textContent = fileData.path;
            } else if (fileData) {
                fileInfo.textContent = fileData.name;
            } else {
                fileInfo.textContent = 'Open a file to get started';
            }
        }
    }

    // LEGACY: Keep old project system as backup
    saveProject() {
        // Use new file save instead
        this.saveFile();
    }

    showLoadProjectDialog() {
        // Use new file browser instead
        this.browseAndOpenFile();
    }

    /**
     * Code operations (original)
     */
    formatCode() {
        if (this.monacoEditor && monaco) {
            this.monacoEditor.getAction('editor.action.formatDocument').run();
            console.log('Code formatted');
        }
    }

    copyAllCode() {
        if (this.monacoEditor) {
            const code = this.monacoEditor.getValue();
            navigator.clipboard.writeText(code).then(() => {
                alert('Code copied to clipboard!');
            }).catch(() => {
                alert('Failed to copy code');
            });
        }
    }

    insertCodeToFile() {
        if (!this.monacoEditor) return;

        const code = this.monacoEditor.getValue();
        if (!code.trim()) {
            alert('No code to insert!');
            return;
        }

        // TODO: Implement actual file insertion using Electron APIs
        console.log('Would insert code to file:', { code, language: this.currentLanguage });
        alert(`Ready to insert ${this.currentLanguage} code to file!\n\nThis would open a file picker and insert the code.`);
    }

    /**
     * AI-powered code actions (original)
     */
    explainCode() {
        if (!this.monacoEditor) return;

        const code = this.monacoEditor.getValue();
        if (!code.trim()) {
            alert('Please enter some code first!');
            return;
        }

        // Copy code to clipboard for pasting into AI
        navigator.clipboard.writeText(`Please explain this ${this.currentLanguage} code:\n\n\`\`\`${this.currentLanguage}\n${code}\n\`\`\``);
        alert('Code explanation prompt copied to clipboard!\nPaste it into the AI chat on the right.');
    }

    async optimizeCode() {
        if (!this.monacoEditor) return;

        const code = this.monacoEditor.getValue();
        if (!code.trim()) {
            alert('Please enter some code first!');
            return;
        }

        const prompt = `Please optimize this ${this.currentLanguage} code for better performance, readability, and best practices. Provide the complete improved code:\n\n\`\`\`${this.currentLanguage}\n${code}\n\`\`\``;

        // Check if we're using LM Studio API
        if (this.isAPIService() && this.currentAIService === 'lmstudio') {
            await this.sendToLMStudio(prompt, 'optimize');
        } else {
            // Fallback to clipboard for webview services
            navigator.clipboard.writeText(prompt);
            alert('🔧 Code optimization prompt copied to clipboard!\nPaste it into the AI chat on the right.');
        }
    }

    // NEW: Diff/Merge Tool
showDiffMergeDialog() {
    const modal = document.createElement('div');
    modal.className = 'diff-merge-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;

    const dialog = document.createElement('div');
    dialog.style.cssText = `
        background: var(--nebula-surface);
        border: 1px solid var(--nebula-border);
        border-radius: var(--nebula-radius-lg);
        width: 90%;
        height: 85%;
        max-width: 1200px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    `;

    dialog.innerHTML = `
        <div class="diff-header" style="
            padding: 20px;
            border-bottom: 1px solid var(--nebula-border);
            background: var(--nebula-surface-elevated);
        ">
            <h2 style="margin: 0 0 16px 0; color: var(--nebula-text-primary); display: flex; align-items: center; gap: 12px;">
                <span class="material-symbols-outlined" style="font-size: 28px;">merge</span>
                Diff & Merge Tool
            </h2>
            
            <div style="display: flex; gap: 16px; align-items: center; margin-bottom: 16px;">
                <button id="selectSourceBtn" class="diff-btn primary">
                    📄 Select Source File
                </button>
                <span style="color: var(--nebula-text-secondary);">vs</span>
                <button id="selectDiffBtn" class="diff-btn primary">
                    📝 Select Diff/Modified File
                </button>
                <div style="flex: 1;"></div>
                <div style="display:flex;gap:8px;align-items:center;margin-right:12px;font-size:12px;color:var(--nebula-text-secondary);">
                    <label style="display:flex;align-items:center;gap:6px;">Include ports in export <input id="exportIncludePorts-${this.windowId}" type="checkbox" style="transform:scale(1.0);margin-left:4px;" /></label>
                    <label style="display:flex;align-items:center;gap:6px;">Hide ports via CSS <input id="exportHidePortsCSS-${this.windowId}" type="checkbox" style="transform:scale(1.0);margin-left:4px;" /></label>
                </div>
                <button id="applyMergeBtn" class="diff-btn success" disabled>
                    ✅ Apply Merge to Current File
                </button>
            </div>
            
            <div id="diffStatus" style="
                color: var(--nebula-text-secondary);
                font-size: 14px;
                min-height: 20px;
            ">Select source and modified files to see differences</div>
        </div>

        <div id="diffEditorContainer" style="
            flex: 1;
            background: var(--nebula-bg-primary);
            position: relative;
        ">
            <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                text-align: center;
                color: var(--nebula-text-secondary);
            ">
                <div style="font-size: 48px; margin-bottom: 16px;">⚡</div>
                <div style="font-size: 18px; margin-bottom: 8px;">Ready for Diff & Merge</div>
                <div style="font-size: 14px;">Select your source and modified files above</div>
            </div>
        </div>

        <div class="diff-footer" style="
            padding: 16px 20px;
            border-top: 1px solid var(--nebula-border);
            background: var(--nebula-surface);
            display: flex;
            gap: 12px;
            justify-content: flex-end;
        ">
            <button id="closeDiffBtn" class="diff-btn secondary">Close</button>
        </div>
    `;

    modal.appendChild(dialog);
    document.body.appendChild(modal);

    // Setup diff dialog functionality
    this.setupDiffDialog(modal, dialog);
}

setupDiffDialog(modal, dialog) {
    let sourceContent = '';
    let modifiedContent = '';
    let diffEditor = null;

    const selectSourceBtn = dialog.querySelector('#selectSourceBtn');
    const selectDiffBtn = dialog.querySelector('#selectDiffBtn');
    const applyMergeBtn = dialog.querySelector('#applyMergeBtn');
    const closeDiffBtn = dialog.querySelector('#closeDiffBtn');
    const diffStatus = dialog.querySelector('#diffStatus');
    const diffContainer = dialog.querySelector('#diffEditorContainer');

    // Source file selection
    selectSourceBtn.addEventListener('click', async () => {
        try {
            const result = await this.selectFileForDiff('Select Source File');
            if (result) {
                sourceContent = result.content;
                selectSourceBtn.innerHTML = `📄 Source: ${result.name}`;
                selectSourceBtn.classList.remove('primary');
                selectSourceBtn.classList.add('success');
                this.updateDiffView();
            }
        } catch (error) {
            alert('Error loading source file: ' + error.message);
        }
    });

    // Modified file selection
    selectDiffBtn.addEventListener('click', async () => {
        try {
            const result = await this.selectFileForDiff('Select Modified/Diff File');
            if (result) {
                modifiedContent = result.content;
                selectDiffBtn.innerHTML = `📝 Modified: ${result.name}`;
                selectDiffBtn.classList.remove('primary');
                selectDiffBtn.classList.add('success');
                this.updateDiffView();
            }
        } catch (error) {
            alert('Error loading modified file: ' + error.message);
        }
    });

    // Apply merge
    // applyMergeBtn.addEventListener('click', () => {
    //     if (diffEditor && this.monacoEditor) {
    //         const mergedContent = diffEditor.getModifiedEditor().getValue();
    //         this.monacoEditor.setValue(mergedContent);
    //         this.hasUnsavedChanges = true;
    //         this.updateWindowTitle();
    //         this.writeOutput('Merged content applied to current file!', 'success');
    //         this.closeDiffModal(modal, diffEditor);
    //     }
    // });

    // Apply merge
applyMergeBtn.addEventListener('click', () => {
    if (diffEditor && this.monacoEditor) {
        // Get the modified content (this is what David wants - the "patched" version)
        const mergedContent = diffEditor.getModifiedEditor().getValue();
        
        // Apply to current editor
        this.monacoEditor.setValue(mergedContent);
        this.hasUnsavedChanges = true;
        this.updateWindowTitle();
        
        // Mark the current tab as modified if using tabs
        if (this.activeFileId) {
            this.markTabAsModified(this.activeFileId, true);
        }
        
        this.writeOutput('Changes from diff file applied to current editor!', 'success');
        this.closeDiffModal(modal, diffEditor);
    } else {
        console.error('Diff editor not available:', {diffEditor, monacoEditor: this.monacoEditor});
        alert('Diff editor not properly initialized. Try selecting files again.');
    }
});

    // Close dialog
    closeDiffBtn.addEventListener('click', () => {
        this.closeDiffModal(modal, diffEditor);
    });

    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            this.closeDiffModal(modal, diffEditor);
        }
    });

    // const updateDiffView = () => {
    //     if (sourceContent && modifiedContent) {
    //         this.createMonacoDiffEditor(diffContainer, sourceContent, modifiedContent);
    //         diffStatus.textContent = 'Diff loaded! Review changes and click "Apply Merge" when ready.';
    //         diffStatus.style.color = 'var(--nebula-success)';
    //         applyMergeBtn.disabled = false;
    //         applyMergeBtn.style.opacity = '1';
    //     }
    // };

    const updateDiffView = () => {
    if (sourceContent && modifiedContent) {
        diffEditor = this.createMonacoDiffEditor(diffContainer, sourceContent, modifiedContent);
        diffStatus.textContent = 'Diff loaded! Review changes and click "Apply Merge" when ready.';
        diffStatus.style.color = 'var(--nebula-success)';
        applyMergeBtn.disabled = false;
        applyMergeBtn.style.opacity = '1';
    }
};

    this.updateDiffView = updateDiffView;
}

async selectFileForDiff(title) {
    return new Promise((resolve) => {
        const options = [
            { id: 'current', name: 'Current File in Editor', content: () => this.monacoEditor?.getValue() || '' },
            { id: 'clipboard', name: 'From Clipboard', content: () => navigator.clipboard.readText() },
            { id: 'file', name: 'Browse for File...', content: null }
        ];

        const selectionModal = document.createElement('div');
        selectionModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
        `;

        const selectionDialog = document.createElement('div');
        selectionDialog.style.cssText = `
            background: var(--nebula-surface);
            border: 1px solid var(--nebula-border);
            border-radius: var(--nebula-radius-md);
            padding: 24px;
            min-width: 400px;
        `;

        selectionDialog.innerHTML = `
            <h3 style="color: var(--nebula-text-primary); margin: 0 0 20px 0;">${title}</h3>
            <div class="file-options">
                ${options.map(option => `
                    <button class="file-option-btn" data-id="${option.id}" style="
                        width: 100%;
                        padding: 12px 16px;
                        margin-bottom: 8px;
                        border: 1px solid var(--nebula-border);
                        border-radius: var(--nebula-radius-sm);
                        background: var(--nebula-surface-hover);
                        color: var(--nebula-text-primary);
                        cursor: pointer;
                        text-align: left;
                        transition: var(--nebula-transition-fast);
                    ">${option.name}</button>
                `).join('')}
            </div>
            <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 16px;">
                <button id="cancelSelection" style="
                    background: var(--nebula-surface-hover);
                    border: 1px solid var(--nebula-border);
                    color: var(--nebula-text-primary);
                    padding: 8px 16px;
                    border-radius: var(--nebula-radius-sm);
                    cursor: pointer;
                ">Cancel</button>
            </div>
        `;

        selectionModal.appendChild(selectionDialog);
        document.body.appendChild(selectionModal);

        selectionDialog.querySelectorAll('.file-option-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const optionId = btn.dataset.id;
                const option = options.find(o => o.id === optionId);

                try {
                    let content = '';
                    let name = option.name;

                    if (optionId === 'current') {
                        content = option.content();
                        const fileData = this.getCurrentFileData();
                        name = fileData ? fileData.name : 'Current File';
                    } else if (optionId === 'clipboard') {
                        content = await option.content();
                        name = 'Clipboard Content';
                    } else if (optionId === 'file') {
                        // File browsing would go here - for now, show input dialog
                        const filePath = await this.showInputDialog('Enter File Path', 'Enter the path to your file:');
                        if (filePath && window.nebula?.fs) {
                            content = await window.nebula.fs.readFile(filePath);
                            name = filePath.split('/').pop();
                        } else {
                            document.body.removeChild(selectionModal);
                            resolve(null);
                            return;
                        }
                    }

                    document.body.removeChild(selectionModal);
                    resolve({ content, name });
                } catch (error) {
                    alert('Error loading content: ' + error.message);
                    document.body.removeChild(selectionModal);
                    resolve(null);
                }
            });

            btn.addEventListener('mouseenter', () => {
                btn.style.background = 'var(--nebula-surface-active)';
            });

            btn.addEventListener('mouseleave', () => {
                btn.style.background = 'var(--nebula-surface-hover)';
            });
        });

        selectionDialog.querySelector('#cancelSelection').addEventListener('click', () => {
            document.body.removeChild(selectionModal);
            resolve(null);
        });
    });
}

createMonacoDiffEditor(container, original, modified) {
    container.innerHTML = '';

    if (!monaco) {
        container.innerHTML = `
            <div style="padding: 40px; text-align: center; color: var(--nebula-text-secondary);">
                <div style="font-size: 24px; margin-bottom: 16px;">⚠️</div>
                <div>Monaco Editor not available</div>
                <div style="font-size: 14px; margin-top: 8px;">Diff comparison requires Monaco Editor to be loaded</div>
            </div>
        `;
        return null;
    }

    const diffEditor = monaco.editor.createDiffEditor(container, {
        theme: 'vs-dark',
        renderSideBySide: true,
        readOnly: false,
        automaticLayout: true,
        originalEditable: false,
        fontSize: 13,
        wordWrap: 'on'
    });

    const originalModel = monaco.editor.createModel(original, this.currentLanguage);
    const modifiedModel = monaco.editor.createModel(modified, this.currentLanguage);

    diffEditor.setModel({
        original: originalModel,
        modified: modifiedModel
    });

    return diffEditor;
}

closeDiffModal(modal, diffEditor) {
    if (diffEditor) {
        diffEditor.dispose();
    }
    if (modal && modal.parentNode) {
        modal.parentNode.removeChild(modal);
    }
}

    /**
     * Send request to LM Studio API
     */
    async sendToLMStudio(prompt, action = null) {
        try {
            console.log('🚀 Sending request to LM Studio...');
            
            const response = await fetch(`${this.lmStudioConfig.baseUrl}/v1/chat/completions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(30000),
                body: JSON.stringify({
                    model: this.lmStudioConfig.model,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a helpful coding assistant. When optimizing code, provide the complete improved code in a code block.'
                        },
                        { role: 'user', content: prompt }
                    ],
                    temperature: this.lmStudioConfig.temperature,
                    max_tokens: this.lmStudioConfig.maxTokens
                })
            });

            if (!response.ok) throw new Error(`API error: ${response.status}`);

            const result = await response.json();
            const aiResponse = result.choices[0]?.message?.content || 'No response received';
            
            console.log('✅ LM Studio response received');
            this.showAIResponse(aiResponse, action);
            
        } catch (error) {
            console.error('❌ LM Studio error:', error);
            navigator.clipboard.writeText(prompt);
            alert(`❌ LM Studio connection failed.\n\n📋 Prompt copied to clipboard as fallback.`);
        }
    }

    /**
     * Show AI response with apply options
     */
    showAIResponse(response, action) {
        // Special handling for GUI placement analysis - route to chat sidebar
        if (action === 'gui-placement') {
            this.addChatMessage(`🤖 **AI GUI Placement Analysis**\n\n${response}`, 'assistant');
            return;
        }

        // Special handling for AI placement suggestions
        if (action === 'ai-placement') {
            this.showAIPlacementDialog(response);
            return;
        }

        const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)\n?```/g;
        const matches = [...response.matchAll(codeBlockRegex)];
        
        if (matches.length > 0) {
            const code = matches[0][2].trim();
            this.showApplyCodeDialog(code, action);
        } else {
            alert(`AI Response:\n\n${response}`);
        }
    }

    /**
     * Show AI placement suggestions dialog
     */
    showAIPlacementDialog(response) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.8); display: flex; align-items: center;
            justify-content: center; z-index: 10000;
        `;

        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: var(--nebula-surface); border: 1px solid var(--nebula-border);
            border-radius: var(--nebula-radius-md); padding: 24px; min-width: 600px;
            max-width: 90vw; max-height: 80vh; display: flex; flex-direction: column;
        `;

        dialog.innerHTML = `
            <h3 style="color: var(--nebula-text-primary); margin: 0 0 16px 0;">🤖 AI Placement Suggestions</h3>
            <div style="
                border: 1px solid var(--nebula-border); border-radius: var(--nebula-radius-sm);
                background: var(--nebula-bg-primary); color: var(--nebula-text-primary);
                font-size: 13px; padding: 16px; overflow: auto; max-height: 400px;
                margin-bottom: 16px; line-height: 1.5;
            ">${response.replace(/\n/g, '<br>')}</div>
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button id="insertManuallyBtn" style="
                    background: var(--nebula-primary); color: white; border: none;
                    padding: 8px 16px; border-radius: 4px; cursor: pointer;
                ">Insert at Cursor Anyway</button>
                <button id="closeAIDialog" style="
                    background: var(--nebula-surface); color: var(--nebula-text-primary);
                    border: 1px solid var(--nebula-border); padding: 8px 16px;
                    border-radius: 4px; cursor: pointer;
                ">Close</button>
            </div>
        `;

        modal.appendChild(dialog);
        document.body.appendChild(modal);

        // Event listeners
        modal.addEventListener('click', (e) => {
            if (e.target === modal) document.body.removeChild(modal);
        });

        document.getElementById('closeAIDialog').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        document.getElementById('insertManuallyBtn').addEventListener('click', () => {
            document.body.removeChild(modal);
            this.generateButtonCode(); // Insert at cursor as fallback
        });
    }

    /**
     * Show dialog to apply AI-generated code
     */
    showApplyCodeDialog(code, action) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.8); display: flex; align-items: center;
            justify-content: center; z-index: 10000;
        `;

        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: var(--nebula-surface); border: 1px solid var(--nebula-border);
            border-radius: var(--nebula-radius-md); padding: 24px; min-width: 600px;
            max-width: 90vw; max-height: 80vh; display: flex; flex-direction: column;
        `;

        dialog.innerHTML = `
            <h3 style="color: var(--nebula-text-primary); margin: 0 0 16px 0;">🤖 Optimized Code</h3>
            <div style="
                border: 1px solid var(--nebula-border); border-radius: var(--nebula-radius-sm);
                background: #1e1e1e; color: #d4d4d4; font-family: 'Consolas', monospace;
                font-size: 13px; padding: 16px; overflow: auto; max-height: 400px;
                white-space: pre; margin-bottom: 16px;
            ">${code}</div>
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button id="replaceBtn" style="
                    background: var(--nebula-primary); border: 1px solid var(--nebula-primary);
                    color: white; padding: 8px 16px; border-radius: var(--nebula-radius-sm); cursor: pointer;
                ">Replace All</button>
                <button id="cancelBtn" style="
                    background: var(--nebula-surface-hover); border: 1px solid var(--nebula-border);
                    color: var(--nebula-text-primary); padding: 8px 16px; border-radius: var(--nebula-radius-sm); cursor: pointer;
                ">Cancel</button>
            </div>
        `;

        modal.appendChild(dialog);
        document.body.appendChild(modal);

        const cleanup = () => document.body.removeChild(modal);

        dialog.querySelector('#replaceBtn').addEventListener('click', () => {
            if (this.monacoEditor) {
                this.monacoEditor.setValue(code);
                this.hasUnsavedChanges = true;
                this.updateWindowTitle();
                console.log('✅ Code replaced with AI optimization');
            }
            cleanup();
        });

        dialog.querySelector('#cancelBtn').addEventListener('click', cleanup);
    }

    debugCode() {
        if (!this.monacoEditor) return;

        const code = this.monacoEditor.getValue();
        if (!code.trim()) {
            alert('Please enter some code first!');
            return;
        }

        navigator.clipboard.writeText(`Please help me debug this ${this.currentLanguage} code and find potential issues:\n\n\`\`\`${this.currentLanguage}\n${code}\n\`\`\``);
        alert('Debug prompt copied to clipboard!\nPaste it into the AI chat on the right.');
    }

    addComments() {
        if (!this.monacoEditor) return;

        const code = this.monacoEditor.getValue();
        if (!code.trim()) {
            alert('Please enter some code first!');
            return;
        }

        navigator.clipboard.writeText(`Please add helpful comments to this ${this.currentLanguage} code:\n\n\`\`\`${this.currentLanguage}\n${code}\n\`\`\``);
        alert('Add comments prompt copied to clipboard!\nPaste it into the AI chat on the right.');
    }

    generateTests() {
        if (!this.monacoEditor) return;

        const code = this.monacoEditor.getValue();
        if (!code.trim()) {
            alert('Please enter some code first!');
            return;
        }

        navigator.clipboard.writeText(`Please generate unit tests for this ${this.currentLanguage} code:\n\n\`\`\`${this.currentLanguage}\n${code}\n\`\`\``);
        alert('Generate tests prompt copied to clipboard!\nPaste it into the AI chat on the right.');
    }

    /**
     * Paste AI-generated code (original)
     */
    async pasteFromAI() {
        if (!this.monacoEditor) return;

        try {
            const clipboardText = await navigator.clipboard.readText();

            // Try to extract code from clipboard (look for code blocks)
            const codeBlockMatch = clipboardText.match(/```[\w]*\n?([\s\S]*?)\n?```/);
            const codeToInsert = codeBlockMatch ? codeBlockMatch[1] : clipboardText;

            if (codeToInsert.trim()) {
                this.monacoEditor.setValue(codeToInsert);
                alert('Code pasted from clipboard!');
            } else {
                alert('No code found in clipboard!');
            }
        } catch (error) {
            alert('Failed to read from clipboard. Please paste manually.');
        }
    }

    /**
 * Show template customization modal
 */
showTemplateCustomizationModal(templateKey) {
    const template = this.templates[templateKey];
    if (!template) {
        alert('Template not found!');
        return;
    }

    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'template-modal-overlay';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
    `;

    // Create modal dialog
    const dialog = document.createElement('div');
    dialog.className = 'template-modal-dialog';
    dialog.style.cssText = `
        background: var(--nebula-surface);
        border: 1px solid var(--nebula-border);
        border-radius: var(--nebula-radius-lg);
        padding: 32px;
        min-width: 500px;
        max-width: 600px;
        box-shadow: var(--nebula-shadow-xl);
    `;

    // Get template-specific defaults
    const templateDefaults = this.getTemplateDefaults(templateKey);

    dialog.innerHTML = `
        <div class="modal-header" style="margin-bottom: 24px;">
            <h2 style="
                color: var(--nebula-text-primary);
                margin: 0 0 8px 0;
                font-size: 24px;
                font-weight: 700;
                display: flex;
                align-items: center;
                gap: 12px;
            ">
                <span style="font-size: 28px;">${templateDefaults.icon}</span>
                Create ${template.name}
            </h2>
            <p style="
                color: var(--nebula-text-secondary);
                margin: 0;
                font-size: 14px;
                line-height: 1.5;
            ">${template.description}</p>
        </div>

        <form class="template-form">
            <!-- App Name -->
            <div class="form-group" style="margin-bottom: 20px;">
                <label style="
                    display: block;
                    color: var(--nebula-text-primary);
                    font-weight: 600;
                    font-size: 13px;
                    margin-bottom: 6px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                ">App Name *</label>
                <input 
                    type="text" 
                    id="appName" 
                    value="${templateDefaults.appName}"
                    placeholder="My Awesome App"
                    style="
                        width: 100%;
                        padding: 12px 16px;
                        border: 1px solid var(--nebula-border);
                        border-radius: var(--nebula-radius-md);
                        background: var(--nebula-bg-primary);
                        color: var(--nebula-text-primary);
                        font-size: 14px;
                        transition: var(--nebula-transition-fast);
                    "
                >
                <small style="color: var(--nebula-text-secondary); font-size: 12px;">This will be the window title and app display name</small>
            </div>

            <!-- Developer Name -->
            <div class="form-group" style="margin-bottom: 20px;">
                <label style="
                    display: block;
                    color: var(--nebula-text-primary);
                    font-weight: 600;
                    font-size: 13px;
                    margin-bottom: 6px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                ">Developer</label>
                <input 
                    type="text" 
                    id="developerName" 
                    value="Nebula Developer"
                    placeholder="Your Name"
                    style="
                        width: 100%;
                        padding: 12px 16px;
                        border: 1px solid var(--nebula-border);
                        border-radius: var(--nebula-radius-md);
                        background: var(--nebula-bg-primary);
                        color: var(--nebula-text-primary);
                        font-size: 14px;
                        transition: var(--nebula-transition-fast);
                    "
                >
            </div>

            <!-- Class Name (auto-generated) -->
            <div class="form-group" style="margin-bottom: 20px;">
                <label style="
                    display: block;
                    color: var(--nebula-text-primary);
                    font-weight: 600;
                    font-size: 13px;
                    margin-bottom: 6px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                ">Class Name</label>
                <input 
                    type="text" 
                    id="className" 
                    value="${templateDefaults.className}"
                    style="
                        width: 100%;
                        padding: 12px 16px;
                        border: 1px solid var(--nebula-border);
                        border-radius: var(--nebula-radius-md);
                        background: var(--nebula-bg-secondary);
                        color: var(--nebula-text-secondary);
                        font-size: 14px;
                        font-family: 'Consolas', 'Monaco', monospace;
                    "
                    readonly
                >
                <small style="color: var(--nebula-text-secondary); font-size: 12px;">Auto-generated from app name (JavaScript class name)</small>
            </div>

            <!-- Icon Selector -->
            <div class="form-group" style="margin-bottom: 20px;">
                <label style="
                    display: block;
                    color: var(--nebula-text-primary);
                    font-weight: 600;
                    font-size: 13px;
                    margin-bottom: 6px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                ">Icon</label>
                <div style="display: flex; gap: 12px; align-items: center;">
                    <input 
                        type="text" 
                        id="appIcon" 
                        value="${templateDefaults.icon}"
                        maxlength="2"
                        style="
                            width: 60px;
                            padding: 12px;
                            border: 1px solid var(--nebula-border);
                            border-radius: var(--nebula-radius-md);
                            background: var(--nebula-bg-primary);
                            color: var(--nebula-text-primary);
                            font-size: 20px;
                            text-align: center;
                        "
                    >
                    <div class="icon-suggestions" style="display: flex; gap: 6px;">
                        ${this.getIconSuggestionsHTML(templateKey)}
                    </div>
                </div>
                <small style="color: var(--nebula-text-secondary); font-size: 12px;">Click suggestions or type your own emoji</small>
            </div>

            <!-- Template-specific fields -->
            ${this.getTemplateSpecificFieldsHTML(templateKey)}

            <!-- Description -->
            <div class="form-group" style="margin-bottom: 24px;">
                <label style="
                    display: block;
                    color: var(--nebula-text-primary);
                    font-weight: 600;
                    font-size: 13px;
                    margin-bottom: 6px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                ">Description</label>
                <textarea 
                    id="appDescription" 
                    placeholder="Brief description of your app..."
                    style="
                        width: 100%;
                        padding: 12px 16px;
                        border: 1px solid var(--nebula-border);
                        border-radius: var(--nebula-radius-md);
                        background: var(--nebula-bg-primary);
                        color: var(--nebula-text-primary);
                        font-size: 14px;
                        min-height: 80px;
                        resize: vertical;
                        font-family: inherit;
                    "
                >${templateDefaults.description || ''}</textarea>
            </div>
        </form>

        <!-- Modal Actions -->
        <div class="modal-actions" style="
            display: flex;
            gap: 12px;
            justify-content: flex-end;
            border-top: 1px solid var(--nebula-border);
            padding-top: 20px;
            margin-top: 24px;
        ">
            <button id="cancelBtn" style="
                background: var(--nebula-surface-hover);
                border: 1px solid var(--nebula-border);
                color: var(--nebula-text-primary);
                padding: 12px 24px;
                border-radius: var(--nebula-radius-md);
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: var(--nebula-transition-fast);
            ">Cancel</button>
            <button id="createBtn" style="
                background: var(--nebula-primary);
                border: 1px solid var(--nebula-primary);
                color: white;
                padding: 12px 24px;
                border-radius: var(--nebula-radius-md);
                cursor: pointer;
                font-size: 14px;
                font-weight: 600;
                transition: var(--nebula-transition-fast);
                display: flex;
                align-items: center;
                gap: 8px;
            ">
                <span class="material-symbols-outlined" style="font-size: 16px;">rocket_launch</span>
                Create App
            </button>
        </div>
    `;

    modal.appendChild(dialog);
    document.body.appendChild(modal);

    // Set up modal interactions
    this.setupModalEventListeners(modal, templateKey);

    // Focus the app name field
    const appNameInput = dialog.querySelector('#appName');
    if (appNameInput) {
        appNameInput.focus();
        appNameInput.select();
    }
}

/**
 * Get template-specific default values
 */
getTemplateDefaults(templateKey) {
    const defaults = {
        'single-app': {
            appName: 'My App',
            className: 'NebulaMyApp',
            icon: '🚀',
            description: 'A focused single-window application'
        },
        'tabbed-app': {
            appName: 'My Tabbed App',
            className: 'NebulaMyTabbedApp',
            icon: '📑',
            description: 'A multi-tab application for complex workflows'
        },
        'PWA-app': {
            appName: 'My Web App',
            className: 'NebulaMyWebApp',
            icon: '🌐',
            description: 'A Progressive Web App with clean interface'
            },
            'visual-gui': {
                appName: 'Visual GUI',
                className: 'NebulaVisualGUIDesigner',
                icon: '🎨',
                description: 'WYSIWYG GUI builder with Shoelace components and live preview'
        }
    };

    return defaults[templateKey] || defaults['single-app'];
}

/**
 * Get icon suggestions for template
 */
getIconSuggestionsHTML(templateKey) {
    const iconSets = {
        'single-app': ['🚀', '⭐', '💎', '🔧', '📱', '💻'],
        'tabbed-app': ['📑', '📊', '📋', '🗂️', '📚', '🎯'],
        'PWA-app': ['🌐', '📱', '🔗', '💻', '📺', '🎬', '🎵', '📧', '💬', '🛒']
    };

    const icons = iconSets[templateKey] || iconSets['single-app'];
    
    return icons.map(icon => 
        `<button type="button" class="icon-suggestion" data-icon="${icon}" style="
            background: var(--nebula-surface-hover);
            border: 1px solid var(--nebula-border);
            width: 36px;
            height: 36px;
            border-radius: var(--nebula-radius-sm);
            cursor: pointer;
            font-size: 16px;
            transition: var(--nebula-transition-fast);
            display: flex;
            align-items: center;
            justify-content: center;
        " title="Use ${icon}">${icon}</button>`
    ).join('');
}

/**
 * Get template-specific form fields
 */
getTemplateSpecificFieldsHTML(templateKey) {
    if (templateKey === 'PWA-app') {
        return `
            <!-- Initial URL for PWA -->
            <div class="form-group" style="margin-bottom: 20px;">
                <label style="
                    display: block;
                    color: var(--nebula-text-primary);
                    font-weight: 600;
                    font-size: 13px;
                    margin-bottom: 6px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                ">Website URL *</label>
                <input 
                    type="url" 
                    id="initialUrl" 
                    value="https://example.com"
                    placeholder="https://youtube.com"
                    style="
                        width: 100%;
                        padding: 12px 16px;
                        border: 1px solid var(--nebula-border);
                        border-radius: var(--nebula-radius-md);
                        background: var(--nebula-bg-primary);
                        color: var(--nebula-text-primary);
                        font-size: 14px;
                        font-family: 'Consolas', 'Monaco', monospace;
                    "
                >
                <small style="color: var(--nebula-text-secondary); font-size: 12px;">The website your PWA will display</small>
            </div>
        `;
    }
    if (templateKey === 'visual-gui') {
        return `
            <div class="form-group" style="margin-bottom:20px;">
                <label style="display:block;color:var(--nebula-text-primary);font-weight:600;font-size:13px;margin-bottom:6px;text-transform:uppercase;">Initial Design HTML</label>
                <textarea id="designHtml" placeholder="Paste or write initial HTML for the app's design" style="width:100%;min-height:120px;padding:12px;border:1px solid var(--nebula-border);border-radius:var(--nebula-radius-md);background:var(--nebula-bg-primary);color:var(--nebula-text-primary);font-family:monospace;"></textarea>
                <small style="color:var(--nebula-text-secondary);">This HTML will be injected into the visual app's content area.</small>
            </div>
        `;
    }

    return ''; // No extra fields for other templates
}

/**
 * Set up modal event listeners
 */
setupModalEventListeners(modal, templateKey) {
    const dialog = modal.querySelector('.template-modal-dialog');
    
    // Auto-update class name when app name changes
    const appNameInput = dialog.querySelector('#appName');
    const classNameInput = dialog.querySelector('#className');
    
    appNameInput?.addEventListener('input', (e) => {
        const appName = e.target.value.trim();
        const className = this.generateClassName(appName);
        if (classNameInput) {
            classNameInput.value = className;
        }
    });

    // Icon suggestion clicks
    dialog.querySelectorAll('.icon-suggestion').forEach(btn => {
        btn.addEventListener('click', () => {
            const icon = btn.dataset.icon;
            const iconInput = dialog.querySelector('#appIcon');
            if (iconInput) {
                iconInput.value = icon;
            }
            
            // Visual feedback
            dialog.querySelectorAll('.icon-suggestion').forEach(b => {
                b.style.background = 'var(--nebula-surface-hover)';
            });
            btn.style.background = 'var(--nebula-primary)';
        });
    });

    // Cancel button
    dialog.querySelector('#cancelBtn')?.addEventListener('click', () => {
        this.closeModal(modal);
    });

    // Create button
    dialog.querySelector('#createBtn')?.addEventListener('click', () => {
        this.createCustomTemplate(modal, templateKey);
    });

    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            this.closeModal(modal);
        }
    });

    // Close on escape key
    document.addEventListener('keydown', function escapeHandler(e) {
        if (e.key === 'Escape') {
            document.removeEventListener('keydown', escapeHandler);
            this.closeModal(modal);
        }
    }.bind(this));
}

/**
 * Generate valid JavaScript class name from app name
 */
generateClassName(appName) {
    if (!appName.trim()) return 'NebulaMyApp';
    
    // Remove special characters and spaces, capitalize words
    const cleanName = appName
        .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special chars
        .replace(/\s+/g, ' ') // Normalize spaces
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
    
    // Ensure it starts with a letter
    const className = cleanName.match(/^[a-zA-Z]/) ? cleanName : 'Nebula' + cleanName;
    
    return className || 'NebulaMyApp';
}

/**
 * Create customized template
 */
async createCustomTemplate(modal, templateKey) {
    const dialog = modal.querySelector('.template-modal-dialog');
    
    // Collect form data
    const formData = {
        appName: dialog.querySelector('#appName')?.value.trim() || 'My App',
        developerName: dialog.querySelector('#developerName')?.value.trim() || 'Nebula Developer',
        className: dialog.querySelector('#className')?.value.trim() || 'NebulaMyApp',
        appIcon: dialog.querySelector('#appIcon')?.value.trim() || '🚀',
        description: dialog.querySelector('#appDescription')?.value.trim() || '',
        initialUrl: dialog.querySelector('#initialUrl')?.value.trim() || null
    };

    // Validate required fields
    if (!formData.appName) {
        alert('App name is required!');
        return;
    }

    // Show loading state
    const createBtn = dialog.querySelector('#createBtn');
    const originalText = createBtn.innerHTML;
    createBtn.innerHTML = '<span class="material-symbols-outlined spinning">refresh</span> Creating...';
    createBtn.disabled = true;

    try {
        // Capture design HTML for visual-gui templates
        if (templateKey === 'visual-gui') {
            const designHtml = dialog.querySelector('#designHtml')?.value || '';
            formData.designHtml = designHtml;
        }

        // Load and customize template
        const customizedCode = await this.loadAndCustomizeTemplate(templateKey, formData);
        
        if (customizedCode && this.monacoEditor) {
            // Check if current code should be replaced
            const currentCode = this.monacoEditor.getValue();
            if (currentCode.trim() && !confirm(`Create "${formData.appName}"?\n\nThis will replace current code.`)) {
                return;
            }

            // Set the customized code
            this.monacoEditor.setValue(customizedCode);
            
            // Update current file name if we have tabs
            if (this.activeFileId) {
                const fileData = this.getCurrentFileData();
                if (fileData) {
                    fileData.name = `${formData.appName}.js`;
                    fileData.hasUnsavedChanges = true;
                    if (fileData.tabElement) {
                        const fileName = fileData.tabElement.querySelector('.file-name');
                        if (fileName) fileName.textContent = fileData.name;
                    }
                }
            }

            this.writeOutput(`✅ "${formData.appName}" created successfully!`, 'success');
            this.writeOutput(`Developer: ${formData.developerName}`, 'info');
            if (formData.initialUrl) {
                this.writeOutput(`URL: ${formData.initialUrl}`, 'info');
            }

            // Close modal
            this.closeModal(modal);
        }

    } catch (error) {
        this.writeOutput(`❌ Failed to create template: ${error.message}`, 'error');
        console.error('Template creation error:', error);
    } finally {
        // Restore button
        createBtn.innerHTML = originalText;
        createBtn.disabled = false;
    }
}

/**
 * Load and customize template with user data
 */
async loadAndCustomizeTemplate(templateKey, formData) {
    const template = this.templates[templateKey];
    if (!template) throw new Error('Template not found');

    try {
        // Load template content
        const response = await fetch(template.path);
        if (!response.ok) {
            throw new Error(`Failed to fetch template: ${response.status}`);
        }

        let templateContent = await response.text();

        // Apply customizations based on template type
        templateContent = this.applyTemplateCustomizations(templateContent, templateKey, formData);

        return templateContent;

    } catch (error) {
        // Fallback to embedded template
        console.warn('Falling back to embedded template:', error);
        return this.createEmbeddedCustomTemplate(templateKey, formData);
    }
}

/**
 * Apply customizations to template content
 */
/**
 * Apply customizations to template content - FIXED VERSION
 */
applyTemplateCustomizations(templateContent, templateKey, formData) {
    // Common replacements for all templates
    let customized = templateContent
        // Replace class names
        .replace(/class\s+\w+/g, `class ${formData.className}`)
        // Replace window titles
        .replace(/title:\s*['"`][^'"`]*['"`]/g, `title: '${formData.appName}'`)
        // Replace getTitle() return values
        .replace(/getTitle\(\)\s*{\s*return\s*['"`][^'"`]*['"`]/g, `getTitle() {\n        return '${formData.appName}'`)
        // Replace getIcon() return values
        .replace(/getIcon\(\)\s*{\s*return\s*['"`][^'"`]*['"`]/g, `getIcon() {\n        return '${formData.appIcon}'`);

    // Template-specific customizations
    if (templateKey === 'PWA-app' && formData.initialUrl) {
        // Replace initial URL in PWA template
        customized = customized
            .replace(/initialUrl\s*=\s*['"`][^'"`]*['"`]/g, `initialUrl = '${formData.initialUrl}'`)
            .replace(/defaultHomePage:\s*['"`][^'"`]*['"`]/g, `defaultHomePage: '${formData.initialUrl}'`);
    }

    // FIX: Handle the ending registration block properly
    // Find the original class name from the template
    const originalClassMatch = templateContent.match(/class\s+(\w+)/);
    const originalClassName = originalClassMatch ? originalClassMatch[1] : 'NebulaPWAHost';
    
    // Replace the final registration block completely
    const properRegistration = `
// Register the app class globally  
window.${formData.className} = ${formData.className};

// Register with launcher if available
if (window.registerNebulaApp) {
    window.registerNebulaApp({
        id: '${formData.className.toLowerCase()}',
        name: '${formData.appName}',
        icon: '${formData.appIcon}',
        className: '${formData.className}',
        description: '${formData.description || ''}',
        category: 'user-generated'
    });
}

// Create initial instance
new ${formData.className}();`;

    // Replace everything from the first "window." assignment to the end
    customized = customized.replace(
        /\/\/\s*Register.*[\s\S]*$/,
        properRegistration
    );

    // Also handle case where there's no comment, just direct registration
    customized = customized.replace(
        /window\.\w+\s*=\s*\w+;[\s\S]*$/,
        properRegistration
    );

    // Add developer comment at the top
    const header = `// ${formData.appName}
// Created by: ${formData.developerName}
${formData.description ? `// Description: ${formData.description}\n` : ''}// Generated by Nebula Code Assistant
// Template: ${this.templates[templateKey].name}

`;

    // For visual-gui templates, inject user-provided HTML into the placeholder
    if (templateKey === 'visual-gui' && formData.designHtml) {
        const injected = customized.replace('<!-- __VISUAL_GUI_HTML__ -->', formData.designHtml);
        return header + injected;
    }

    return header + customized;
}


/**
 * Additional helper method to ensure proper class registration
 */
ensureProperClassRegistration(content, className) {
    // Make sure the final lines are correct
    const lines = content.split('\n');
    const lastNonEmptyLines = lines.filter(line => line.trim()).slice(-3);
    
    // Check if the last few lines contain proper registration
    const hasWindowAssignment = lastNonEmptyLines.some(line => 
        line.includes(`window.${className} = ${className}`)
    );
    const hasInstantiation = lastNonEmptyLines.some(line => 
        line.includes(`new ${className}()`)
    );
    
    if (!hasWindowAssignment || !hasInstantiation) {
        // Append correct registration
        const properEnding = `
// Register the app with WindowManager
window.${className} = ${className};
new ${className}();`;
        
        return content.replace(/\/\/.*Register.*[\s\S]*$/, properEnding);
    }
    
    return content;
}

/**
 * Create embedded custom template (fallback)
 */
createEmbeddedCustomTemplate(templateKey, formData) {
    if (templateKey === 'PWA-app') {
        return `// ${formData.appName}
// Created by: ${formData.developerName}
${formData.description ? `// Description: ${formData.description}\n` : ''}
class ${formData.className} {
    constructor() {
        this.windowId = null;
        this.initialUrl = '${formData.initialUrl || 'https://example.com'}';
        this.init();
    }
    
    async init() {
        if (!window.windowManager) return;
        
        this.windowId = window.windowManager.createWindow({
            title: '${formData.appName}',
            width: 1200,
            height: 800,
            resizable: true
        });
        
        window.windowManager.loadApp(this.windowId, this);
    }
    
    render() {
        // PWA implementation here
        const container = document.createElement('div');
        container.innerHTML = '<h1>${formData.appName}</h1>';
        return container;
    }
    
    getTitle() { return '${formData.appName}'; }
    getIcon() { return '${formData.appIcon}'; }
    cleanup() { console.log('${formData.appName} cleanup'); }
}

window.${formData.className} = ${formData.className};`;
    }

        if (templateKey === 'visual-gui') {
            return `// ${formData.appName}
    // Created by: ${formData.developerName}
    ${formData.description ? `// Description: ${formData.description}\n` : ''}
    class ${formData.className} {
        constructor() {
            this.windowId = null;
            this.init();
        }
        async init() {
            if (!window.windowManager) return;
            this.windowId = window.windowManager.createWindow({ title: '${formData.appName}', width: 1200, height: 800 });
            window.windowManager.loadApp(this.windowId, this);
        }
        render() {
            const container = document.createElement('div');
            container.innerHTML = '<h1>${formData.appName}</h1><p>Visual GUI Designer (embedded fallback)</p>';
            return container;
        }
        getTitle() { return '${formData.appName}'; }
        getIcon() { return '${formData.appIcon}'; }
        cleanup() {}
    }

    window.${formData.className} = ${formData.className};`;
        }

        // Similar for other templates...
        return `// ${formData.appName} - Generated Template`;
}

/**
 * Close modal
 */
closeModal(modal) {
    if (modal && modal.parentNode) {
        modal.parentNode.removeChild(modal);
    }
}

    /**
     * Utility methods (original)
     */
    isWindowActive() {
        const windowElement = document.getElementById(this.windowId);
        return windowElement && windowElement.contains(document.activeElement);
    }

    addToolbarStyles() {
        if (document.querySelector('#code-assistant-toolbar-styles')) return;

        const style = document.createElement('style');
        style.id = 'code-assistant-toolbar-styles';
        style.textContent = `
            .code-toolbar-btn {
                background: var(--nebula-surface-hover);
                border: 1px solid var(--nebula-border);
                color: var(--nebula-text-primary);
                padding: 8px 12px;
                border-radius: var(--nebula-radius-sm);
                cursor: pointer;
                font-size: 13px;
                transition: var(--nebula-transition-fast);
                display: flex;
                align-items: center;
                gap: 6px;
                font-weight: 500;
            }
            
            .code-toolbar-btn:hover {
                background: var(--nebula-surface-active);
                border-color: var(--nebula-border-hover);
            }
            
            .code-toolbar-btn .material-symbols-outlined {
                font-size: 16px;
            }
            
            .run-btn:hover {
                background: var(--nebula-success-hover) !important;
            }
            
            .code-ai-action-btn {
                background: var(--nebula-surface);
                border: 1px solid var(--nebula-border);
                color: var(--nebula-text-primary);
                padding: 6px 10px;
                border-radius: var(--nebula-radius-sm);
                cursor: pointer;
                font-size: 11px;
                transition: var(--nebula-transition-fast);
                white-space: nowrap;
            }
            
            .code-ai-action-btn:hover {
                background: var(--nebula-surface-hover);
                border-color: var(--nebula-primary);
            }
            
            /* NEW: File Tab Styles */
            .file-tab-bar {
                scrollbar-width: thin;
                scrollbar-color: var(--nebula-surface-hover) transparent;
            }
            
            .file-tab-bar::-webkit-scrollbar {
                height: 6px;
            }
            
            .file-tab-bar::-webkit-scrollbar-track {
                background: transparent;
            }
            
            .file-tab-bar::-webkit-scrollbar-thumb {
                background: var(--nebula-surface-hover);
                border-radius: 3px;
            }
            
            .file-tab:hover {
                background: var(--nebula-surface-hover) !important;
            }
            
            .file-tab .tab-close-btn {
                opacity: 0;
                transition: opacity 0.2s ease;
            }
            
            .file-tab:hover .tab-close-btn {
                opacity: 1;
            }
            
            .file-tab .tab-close-btn:hover {
                background: var(--nebula-surface-active);
            }
            
            .new-tab-btn:hover {
                background: var(--nebula-surface-hover);
            }
            
            /* File Type Icon Colors */
            .file-tab .file-icon {
                font-weight: bold;
                font-size: 14px;
            }
            
            /* JavaScript - Yellow */
            .file-tab[data-language="javascript"] .file-icon {
                color: #f7df1e;
            }
            
            /* TypeScript - Blue */
            .file-tab[data-language="typescript"] .file-icon {
                color: #3178c6;
            }
            
            /* Python - Green/Blue */
            .file-tab[data-language="python"] .file-icon {
                color: #3776ab;
            }
            
            /* HTML - Orange */
            .file-tab[data-language="html"] .file-icon {
                color: #e34f26;
            }
            
            /* CSS - Blue */
            .file-tab[data-language="css"] .file-icon {
                color: #1572b6;
            }
            
            /* JSON - Green */
            .file-tab[data-language="json"] .file-icon {
                color: #00d084;
            }
            
            /* Markdown - Gray */
            .file-tab[data-language="markdown"] .file-icon {
                color: #666666;
            }
            
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }

                    .code-toolbar-btn {
            background: var(--nebula-surface-hover);
            border: 1px solid var(--nebula-border);
            color: var(--nebula-text-primary);
            padding: 8px 12px;
            border-radius: var(--nebula-radius-sm);
            cursor: pointer;
            font-size: 13px;
            transition: var(--nebula-transition-fast);
            display: flex;
            align-items: center;
            gap: 6px;
            font-weight: 500;
        }
        
        .code-toolbar-btn:hover {
            background: var(--nebula-surface-active);
            border-color: var(--nebula-border-hover);
        }
        
        .run-btn:hover {
            background: var(--nebula-success-hover) !important;
        }
        
        /* 🆕 NEW: Width button styles */
        .code-width-btn {
            background: var(--nebula-surface-hover);
            border: 1px solid var(--nebula-border);
            color: var(--nebula-text-secondary);
            padding: 4px 8px;
            border-radius: var(--nebula-radius-sm);
            cursor: pointer;
            font-size: 11px;
            transition: var(--nebula-transition-fast);
            min-width: 32px;
            text-align: center;
        }
        
        .code-width-btn:hover {
            background: var(--nebula-surface-active);
            color: var(--nebula-text-primary);
        }
        
        .code-width-btn.active {
            background: var(--nebula-primary);
            color: white;
            border-color: var(--nebula-primary);
        }

        /* Template Modal Styles */
.template-modal-overlay input:focus,
.template-modal-overlay textarea:focus {
    outline: none;
    border-color: var(--nebula-primary);
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.template-modal-overlay button:hover {
    transform: translateY(-1px);
    box-shadow: var(--nebula-shadow-md);
}

.template-modal-overlay .icon-suggestion:hover {
    background: var(--nebula-surface-active) !important;
    transform: translateY(-1px);
    box-shadow: var(--nebula-shadow-sm);
}

.spinning {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.diff-btn {
    padding: 8px 16px;
    border-radius: var(--nebula-radius-sm);
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: var(--nebula-transition-fast);
    border: none;
}

.diff-btn.primary {
    background: var(--nebula-primary);
    color: white;
}

.diff-btn.success {
    background: var(--nebula-success);
    color: white;
}

.diff-btn.secondary {
    background: var(--nebula-surface-hover);
    border: 1px solid var(--nebula-border);
    color: var(--nebula-text-primary);
}

.diff-btn:hover {
    transform: translateY(-1px);
    box-shadow: var(--nebula-shadow-sm);
}

.diff-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
}

/* 🆕 NEW: Stub Environment Modal Styles */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
}

.modal-content {
    background: var(--nebula-bg-primary);
    border-radius: var(--nebula-radius-md);
    box-shadow: var(--nebula-shadow-xl);
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    border: 1px solid var(--nebula-border);
}

.modal-header {
    padding: 20px 24px 16px;
    border-bottom: 1px solid var(--nebula-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.modal-header .close-btn {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: var(--nebula-text-secondary);
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--nebula-radius-sm);
}

.modal-header .close-btn:hover {
    background: var(--nebula-surface-hover);
    color: var(--nebula-text-primary);
}

.modal-body {
    padding: 20px 24px;
}

.modal-footer {
    padding: 16px 24px 20px;
    border-top: 1px solid var(--nebula-border);
    display: flex;
    gap: 12px;
    justify-content: flex-end;
}

.btn-primary, .btn-secondary {
    padding: 8px 16px;
    border-radius: var(--nebula-radius-sm);
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: var(--nebula-transition-fast);
    border: none;
}

.btn-primary {
    background: var(--nebula-primary);
    color: white;
}

.btn-primary:hover {
    background: var(--nebula-primary-hover);
}

.btn-secondary {
    background: var(--nebula-surface-hover);
    border: 1px solid var(--nebula-border);
    color: var(--nebula-text-primary);
}

.btn-secondary:hover {
    background: var(--nebula-surface-active);
}

.stub-env-modal .modal-header h3 {
    color: var(--nebula-primary);
    margin: 0;
    font-size: 18px;
}

.stub-env-modal .modal-description {
    color: var(--nebula-text-secondary);
    margin-bottom: 20px;
    line-height: 1.5;
}

.stub-env-modal .setting-group {
    margin-bottom: 20px;
    padding: 16px;
    background: var(--nebula-surface);
    border-radius: var(--nebula-radius-sm);
    border: 1px solid var(--nebula-border);
}

.stub-env-modal .setting-toggle {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    font-weight: 500;
    color: var(--nebula-text-primary);
    margin-bottom: 8px;
}

.stub-env-modal .setting-toggle input[type="checkbox"] {
    display: none;
}

.stub-env-modal .toggle-slider {
    position: relative;
    width: 44px;
    height: 24px;
    background: var(--nebula-surface-hover);
    border-radius: 12px;
    transition: var(--nebula-transition-fast);
}

.stub-env-modal .toggle-slider::before {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    transition: var(--nebula-transition-fast);
    box-shadow: var(--nebula-shadow-sm);
}

.stub-env-modal .setting-toggle input:checked + .toggle-slider {
    background: var(--nebula-primary);
}

.stub-env-modal .setting-toggle input:checked + .toggle-slider::before {
    transform: translateX(20px);
}

.stub-env-modal .setting-description {
    color: var(--nebula-text-secondary);
    font-size: 12px;
    margin: 0;
    margin-left: 56px;
    line-height: 1.4;
}

/* Stub Environment Button Styles */
.code-toolbar-btn.active {
    background: var(--nebula-warning) !important;
    border-color: var(--nebula-warning) !important;
    color: white !important;
}

.code-toolbar-btn.active:hover {
    background: var(--nebula-warning-hover) !important;
}
        `;
        document.head.appendChild(style);


    }

    /**
     * Required methods for WindowManager integration (original)
     */

    // Helper function to check if current AI service uses API
    isAPIService() {
        return this.aiServices[this.currentAIService]?.type === 'api';
    }

    getTitle() {
        return 'Code Assistant Pro';
    }

    getIcon() {
        return '💻';
    }

    cleanup() {
        // Check for unsaved changes before closing
        if (this.hasUnsavedChanges) {
            if (confirm('You have unsaved changes. Close anyway?')) {
                // User confirmed, proceed with cleanup
            } else {
                // User cancelled, prevent close
                return false;
            }
        }

        if (this.monacoEditor) {
            this.monacoEditor.dispose();
            this.monacoEditor = null;
        }
        console.log('Code Assistant cleanup');
        return true;
    }



    // ==================== DESIGN MODE - Visual UI Builder ====================
    
    toggleDesignMode() {
        const designPanel = document.getElementById(`designPanel-${this.windowId}`);
        
        if (designPanel) {
            // Design mode is open, close it
            designPanel.remove();
            console.log('Design mode closed');
        } else {
            // Open design mode
            this.openDesignMode();
            console.log('Design mode opened');
        }
    }

    // New entrypoint for the toolbar Visual Designer button. Keeps behavior
    // stable by delegating to the existing designer, but provides a clear
    // location to enhance or replace the designer implementation later.
    openVisualDesigner() {
        // Future: replace with improved designer UI. For now, reuse existing.
        if (typeof this.openDesignMode === 'function') {
            this.openDesignMode();
            console.log('Visual Designer opened (wrapper)');
        } else {
            console.warn('Visual Designer not available');
        }
    }

    openDesignMode() {
        // Check if designer is already open
        if (document.getElementById(`gui-designer-${this.windowId}`)) {
            return; // Already open
        }

        // Create full-screen modal GUI designer (Visual Basic style)
        const designerModal = document.createElement('div');
        designerModal.id = `gui-designer-${this.windowId}`;
        designerModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: var(--nebula-bg-primary);
            z-index: 50000;
            display: flex;
            flex-direction: column;
            font-family: var(--nebula-font-family);
        `;

        designerModal.innerHTML = `
            <style>
                /* Designer helper styles */
                .gui-component { position: absolute; box-sizing: border-box; }
                .component-frame { position: relative; display: inline-block; }
                .component-inner { display: inline-block; }
                .drag-handle { box-shadow: 0 1px 2px rgba(0,0,0,0.12); }
                /* resize-handle removed - use properties panel to set size */
                .component-outline { position:absolute; left:0; top:0; right:0; bottom:0; pointer-events:none; border: 1px dashed rgba(0,0,0,0.08); border-radius:4px; }
                .ghost-placeholder { position: absolute; left:8px; bottom:8px; background: rgba(0,0,0,0.06); color: var(--nebula-text-secondary); padding:4px 6px; font-size:11px; border-radius:4px; display:flex; align-items:center; gap:6px; z-index:25; }
                .design-canvas { background: #f7f7f9; position: relative; }
                /* App frame simulating NebulaApp viewport */
                .app-frame { width: 900px; height: 600px; background: white; border: 2px solid #e6e6e6; box-shadow: 0 6px 20px rgba(0,0,0,0.08); border-radius:8px; position: relative; margin: 0 auto; overflow: hidden; }
            </style>
            <!-- GUI Designer Header -->
            <div style="
                height: 50px;
                background: var(--nebula-surface);
                border-bottom: 1px solid var(--nebula-border);
                display: flex;
                align-items: center;
                padding: 0 16px;
                gap: 16px;
            ">
                <div style="
                    font-weight: 600;
                    color: var(--nebula-text-primary);
                    font-size: 14px;
                ">🎨 Visual GUI Designer</div>
                
                <div style="flex: 1;"></div>
                
                <!-- Generate visualGui() Method removed - use Save & Apply instead -->
                
                <button id="aiAnalyzeGui-${this.windowId}" style="
                    background: var(--nebula-accent);
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 500;
                ">AI Suggest Where to Place</button>

                <button id="saveApplyDesigner-${this.windowId}" style="
                    background: var(--nebula-success);
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 500;
                ">Save & Apply</button>

                <button id="closeDesigner-${this.windowId}" style="
                    background: var(--nebula-surface);
                    color: var(--nebula-text-primary);
                    border: 1px solid var(--nebula-border);
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                ">Close Designer</button>
            </div>

                <!-- Main Designer Area -->
            <div style="
                flex: 1;
                display: flex;
                overflow: hidden;
            ">
                <!-- Component Toolbox -->
                <div style="
                    width: 200px;
                    background: var(--nebula-surface);
                    border-right: 1px solid var(--nebula-border);
                    padding: 16px;
                    overflow-y: auto;
                ">
                    <h4 style="
                        margin: 0 0 12px 0;
                        color: var(--nebula-text-primary);
                        font-size: 13px;
                        font-weight: 600;
                    ">Components</h4>
                    
                    <div class="component-toolbox">
                        <!-- Controls -->
                        <div class="component-category" style="margin-bottom: 16px;">
                            <div style="
                                font-size: 11px;
                                color: var(--nebula-text-secondary);
                                margin-bottom: 8px;
                                text-transform: uppercase;
                                font-weight: 600;
                            ">Controls</div>
                            
                            <div class="component-item" data-type="button" style="
                                padding: 8px;
                                background: var(--nebula-bg-primary);
                                border: 1px solid var(--nebula-border);
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 12px;
                                margin-bottom: 4px;
                                display: flex;
                                align-items: center;
                                gap: 8px;
                            ">
                                <span style="color: var(--nebula-primary);">▣</span>
                                Button
                            </div>
                            
                            <div class="component-item" data-type="sl-button" style="
                                padding: 8px;
                                background: var(--nebula-bg-primary);
                                border: 1px solid var(--nebula-border);
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 12px;
                                margin-bottom: 4px;
                                display: flex;
                                align-items: center;
                                gap: 8px;
                            ">
                                <span style="color: var(--nebula-primary);">▣</span>
                                Sl Button
                            </div>

                            <div class="component-item" data-type="input" style="
                                padding: 8px;
                                background: var(--nebula-bg-primary);
                                border: 1px solid var(--nebula-border);
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 12px;
                                margin-bottom: 4px;
                                display: flex;
                                align-items: center;
                                gap: 8px;
                            ">
                                <span style="color: var(--nebula-accent);">▭</span>
                                Text Input
                            </div>
                            
                            <div class="component-item" data-type="label" style="
                                padding: 8px;
                                background: var(--nebula-bg-primary);
                                border: 1px solid var(--nebula-border);
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 12px;
                                margin-bottom: 4px;
                                display: flex;
                                align-items: center;
                                gap: 8px;
                            ">
                                <span style="color: var(--nebula-text-secondary);">A</span>
                                Label
                            </div>
                            
                            <div class="component-item" data-type="sl-input" style="
                                padding: 8px;
                                background: var(--nebula-bg-primary);
                                border: 1px solid var(--nebula-border);
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 12px;
                                margin-bottom: 4px;
                                display: flex;
                                align-items: center;
                                gap: 8px;
                            ">
                                <span style="color: var(--nebula-accent);">▭</span>
                                Sl Input
                            </div>
                            
                            <div class="component-item" data-type="checkbox" style="
                                padding: 8px;
                                background: var(--nebula-bg-primary);
                                border: 1px solid var(--nebula-border);
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 12px;
                                margin-bottom: 4px;
                                display: flex;
                                align-items: center;
                                gap: 8px;
                            ">
                                <span style="color: var(--nebula-success);">☑</span>
                                Checkbox
                            </div>
                            
                            <div class="component-item" data-type="sl-checkbox" style="
                                padding: 8px;
                                background: var(--nebula-bg-primary);
                                border: 1px solid var(--nebula-border);
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 12px;
                                margin-bottom: 4px;
                                display: flex;
                                align-items: center;
                                gap: 8px;
                            ">
                                <span style="color: var(--nebula-success);">☑</span>
                                Sl Checkbox
                            </div>
                            
                            <div class="component-item" data-type="select" style="
                                padding: 8px;
                                background: var(--nebula-bg-primary);
                                border: 1px solid var(--nebula-border);
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 12px;
                                margin-bottom: 4px;
                                display: flex;
                                align-items: center;
                                gap: 8px;
                            ">
                                <span style="color: var(--nebula-warning);">▼</span>
                                Dropdown
                            </div>
                            
                            <div class="component-item" data-type="sl-select" style="
                                padding: 8px;
                                background: var(--nebula-bg-primary);
                                border: 1px solid var(--nebula-border);
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 12px;
                                margin-bottom: 4px;
                                display: flex;
                                align-items: center;
                                gap: 8px;
                            ">
                                <span style="color: var(--nebula-warning);">▼</span>
                                Sl Select
                            </div>
                        </div>
                        
                        <!-- Layout -->
                        <div class="component-category">
                            <div style="
                                font-size: 11px;
                                color: var(--nebula-text-secondary);
                                margin-bottom: 8px;
                                text-transform: uppercase;
                                font-weight: 600;
                            ">Layout</div>
                            
                            <div class="component-item" data-type="div" style="
                                padding: 8px;
                                background: var(--nebula-bg-primary);
                                border: 1px solid var(--nebula-border);
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 12px;
                                margin-bottom: 4px;
                                display: flex;
                                align-items: center;
                                gap: 8px;
                            ">
                                <span style="color: var(--nebula-info);">▢</span>
                                Container
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Design Canvas -->
                <div style="
                    flex: 1;
                    background: #f5f5f5;
                    position: relative;
                    overflow: auto;
                    padding: 20px;
                ">
                    <div id="designCanvas-${this.windowId}" style="
                        width: 1000px;
                        height: 700px;
                        background: white;
                        border: 2px solid #ddd;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                        position: relative;
                        margin: 0 auto;
                        border-radius: 8px;
                        overflow: hidden;
                    ">
                        <div style="
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            text-align: center;
                            color: #999;
                            font-size: 14px;
                            pointer-events: none;
                        ">
                            <div style="font-size: 32px; margin-bottom: 8px;">🎨</div>
                            Drop components here to design your GUI
                        </div>
                    </div>
                </div>

                <!-- Properties Panel -->
                <div style="
                    width: 250px;
                    background: var(--nebula-surface);
                    border-left: 1px solid var(--nebula-border);
                    padding: 16px;
                    overflow-y: auto;
                ">
                    <h4 style="
                        margin: 0 0 12px 0;
                        color: var(--nebula-text-primary);
                        font-size: 13px;
                        font-weight: 600;
                    ">Properties</h4>
                    
                    <div id="propertiesPanel-${this.windowId}" style="
                        color: var(--nebula-text-secondary);
                        font-size: 12px;
                    ">
                        Select a component to edit properties
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(designerModal);
        // After inserting designer, try to size the canvas to match the target window/template size
        try {
            // Default desired size
            let targetW = 1000, targetH = 700;
            // If editor has template code loaded, try to parse createWindow width/height
            const currentCode = this.monacoEditor?.getValue && this.monacoEditor.getValue() || '';
            const match = currentCode.match(/createWindow\([^\)]*width\s*:\s*(\d+)\s*,\s*height\s*:\s*(\d+)/);
            if (match) {
                targetW = parseInt(match[1],10) || targetW;
                targetH = parseInt(match[2],10) || targetH;
            } else {
                // fallback: try reading the VisualGUI template file for defaults
                try {
                    // Attempt to synchronously read known template file via fetch if available
                    const tplPath = 'src/Templates/NebulaApp-VisualGUI.js';
                    fetch(tplPath).then(resp => {
                        if (!resp.ok) return;
                        resp.text().then(text => {
                            const m = text.match(/createWindow\([^\)]*width\s*:\s*(\d+)\s*,\s*height\s*:\s*(\d+)/);
                            if (m) {
                                targetW = parseInt(m[1],10) || targetW;
                                targetH = parseInt(m[2],10) || targetH;
                                const canvasEl = document.getElementById(`designCanvas-${this.windowId}`);
                                if (canvasEl) { canvasEl.style.width = targetW + 'px'; canvasEl.style.height = targetH + 'px'; }
                            }
                        });
                    }).catch(() => {});
                } catch(e){}
            }

            const canvasEl = document.getElementById(`designCanvas-${this.windowId}`);
            if (canvasEl) {
                canvasEl.style.width = targetW + 'px';
                canvasEl.style.height = targetH + 'px';
            }
        } catch (e) { /* ignore sizing if anything fails */ }

        this.setupGuiDesigner();
    }

    setupGuiDesigner() {
        const windowId = this.windowId;
        
        // Track designed components
        this.designedComponents = [];
        this.selectedComponent = null;
        this.componentIdCounter = 1;
    // Export options
    this.exportIncludePorts = this.exportIncludePorts || false;
    this.exportHidePortsCSS = this.exportHidePortsCSS || false;

        // Get elements
        const canvas = document.getElementById(`designCanvas-${windowId}`);
        const propertiesPanel = document.getElementById(`propertiesPanel-${windowId}`);
        const generateBtn = document.getElementById(`generateGuiCode-${windowId}`);
        const aiBtn = document.getElementById(`aiAnalyzeGui-${windowId}`);
        const saveApplyBtn = document.getElementById(`saveApplyDesigner-${windowId}`);
        const closeBtn = document.getElementById(`closeDesigner-${windowId}`);
        const linkToggle = document.getElementById(`linkModeToggle-${windowId}`);

        // Create an SVG overlay on the main design canvas for links
        let designerSvg = document.getElementById(`designer-link-svg-${windowId}`);
        if (!designerSvg) {
            designerSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            designerSvg.id = `designer-link-svg-${windowId}`;
            designerSvg.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:50;';
            const canvasContainer = document.getElementById(`designCanvas-${windowId}`);
            canvasContainer.style.position = 'relative';
            canvasContainer.appendChild(designerSvg);
        }

        // Designer-level selected link id
        this.selectedDesignerLinkId = null;

        // Key handler for deleting selected links
        this._designerKeyHandler = (e) => {
            if (!document.getElementById(`gui-designer-${windowId}`)) return; // designer closed
            if ((e.key === 'Delete' || e.key === 'Backspace') && this.selectedDesignerLinkId) {
                this.designerLinks = (this.designerLinks || []).filter(l => l.id !== this.selectedDesignerLinkId);
                this.selectedDesignerLinkId = null;
                this.updateLinksSVG();
                this.updateLinkListUI();
            }
        };
        document.addEventListener('keydown', this._designerKeyHandler);

        // Component drag and drop
        const componentItems = document.querySelectorAll('.component-item');
        componentItems.forEach(item => {
            item.addEventListener('click', () => {
                const type = item.dataset.type;
                this.addComponentToCanvas(type, canvas, propertiesPanel);
            });
        });

        // Generate visualGui() method
        generateBtn?.addEventListener('click', () => {
            this.generateVisualGuiMethod();
        });

        // Save & apply designed HTML to template modal (if open)
        saveApplyBtn?.addEventListener('click', () => {
            this.applyDesignToTemplate();
        });

        // AI placement analysis
        aiBtn?.addEventListener('click', () => {
            this.analyzeGuiPlacementWithAI();
        });

        // Close designer
        closeBtn?.addEventListener('click', () => {
            const designer = document.getElementById(`gui-designer-${windowId}`);
            designer?.remove();
        });

        // Canvas click to deselect
        canvas?.addEventListener('click', (e) => {
            if (e.target === canvas) {
                this.selectComponent(null, propertiesPanel);
            }
        });

        // Link Mode toggle
        if (linkToggle) {
            linkToggle.addEventListener('click', () => {
                const on = linkToggle.dataset.on === '1';
                if (on) {
                    linkToggle.dataset.on = '0';
                    linkToggle.style.background = 'var(--nebula-surface)';
                    linkToggle.textContent = 'Link Mode';
                    this.disableLinkMode(windowId);
                } else {
                    linkToggle.dataset.on = '1';
                    linkToggle.style.background = 'var(--nebula-accent)';
                    linkToggle.style.color = '#fff';
                    linkToggle.textContent = 'Link Mode: ON';
                    this.enableLinkMode(windowId);
                }
            });
        }

        // Wire export option checkboxes
        const inclCheckbox = document.getElementById(`exportIncludePorts-${windowId}`);
        const hideCssCheckbox = document.getElementById(`exportHidePortsCSS-${windowId}`);
        if (inclCheckbox) {
            inclCheckbox.checked = !!this.exportIncludePorts;
            inclCheckbox.addEventListener('change', (e) => { this.exportIncludePorts = !!e.target.checked; });
        }
        if (hideCssCheckbox) {
            hideCssCheckbox.checked = !!this.exportHidePortsCSS;
            hideCssCheckbox.addEventListener('change', (e) => { this.exportHidePortsCSS = !!e.target.checked; });
        }
    }

    // Show a small instruction toast inside the designer explaining how to link
    showLinkModeToast(windowId) {
        const id = `link-mode-toast-${windowId}`;
        if (document.getElementById(id)) return; // already visible
        const designer = document.getElementById(`gui-designer-${windowId}`);
        if (!designer) return;
        const toast = document.createElement('div');
        toast.id = id;
        toast.style.cssText = 'position:fixed;left:50%;top:72px;transform:translateX(-50%);background:var(--nebula-surface);border:1px solid var(--nebula-border);padding:10px 14px;border-radius:8px;z-index:60002;box-shadow:0 8px 30px rgba(0,0,0,0.12);display:flex;align-items:center;gap:12px;min-width:300px;';
        toast.innerHTML = `<div style="flex:1;color:var(--nebula-text-primary);font-size:13px;">Link Mode ON — drag from a highlighted output port to another component to create a connection.</div><button id="linkModeToastOk-${windowId}" style="padding:6px 10px;border-radius:4px;border:1px solid var(--nebula-border);background:var(--nebula-bg-primary);">Got it</button>`;
        document.body.appendChild(toast);
        document.getElementById(`linkModeToastOk-${windowId}`).addEventListener('click', () => {
            toast.remove();
        });
    }

    addComponentToCanvas(type, canvas, propertiesPanel) {
        const componentId = `comp_${this.componentIdCounter++}`;
        
        const component = document.createElement('div');
        component.className = 'gui-component';
        component.dataset.componentId = componentId;
        component.dataset.type = type;
        component.style.cssText = `
            position: absolute;
            top: 50px;
            left: 50px;
            cursor: move;
            border: 2px solid transparent;
            min-width: 80px;
            min-height: 30px;
        `;

        // Create component content based on type
        const componentData = this.createComponentContent(type, componentId);

        // Wrap in frame so we can draw outlines and add resize handle
        const frame = document.createElement('div');
        frame.className = 'component-frame';
        frame.style.cssText = 'position:relative; display:inline-block;';

        const inner = document.createElement('div');
        inner.className = 'component-inner';
        inner.innerHTML = componentData.html;

        const outline = document.createElement('div');
        outline.className = 'component-outline';

    frame.appendChild(inner);
    frame.appendChild(outline);

        // For components that are not normally visible (toast/dialog), show a ghost placeholder
        if (this.isNonVisibleComponent(type)) {
            const ghost = document.createElement('div');
            ghost.className = 'ghost-placeholder';
            ghost.innerHTML = `<span style="opacity:0.7">◪</span><span>${type}</span>`;
            frame.appendChild(ghost);
        }

        component.appendChild(frame);
    // Attach port placeholders for linking (top input, bottom output)
    const inputPort = document.createElement('div');
    inputPort.className = 'component-port input-port';
    inputPort.dataset.port = 'input';
    inputPort.style.cssText = 'position:absolute;left:50%;transform:translateX(-50%);top:-8px;width:12px;height:12px;border-radius:8px;background:#fff;border:2px solid #666;display:none;pointer-events:auto;z-index:60;';
    const outputPort = document.createElement('div');
    outputPort.className = 'component-port output-port';
    outputPort.dataset.port = 'output';
    outputPort.style.cssText = 'position:absolute;left:50%;transform:translateX(-50%);bottom:-8px;width:12px;height:12px;border-radius:8px;background:#fff;border:2px solid #1f8cff;display:none;pointer-events:auto;z-index:60;';
    frame.appendChild(inputPort);
    frame.appendChild(outputPort);
        
        // Store component data
        this.designedComponents.push({
            id: componentId,
            type: type,
            element: component,
            properties: componentData.properties,
            position: { x: 50, y: 50 },
            parent: null, // Track container relationships
            children: [] // Track child components
        });

        // Make draggable
        this.makeComponentDraggable(component);

        // Click to select
        component.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectComponent(componentId, propertiesPanel);
        });

        // store port references in componentData for link rendering
        const compData = this.designedComponents.find(c => c.id === componentId);
        if (compData) {
            compData.portEls = { input: inputPort, output: outputPort };
        }

        canvas.appendChild(component);
        this.selectComponent(componentId, propertiesPanel);
    }

    createComponentContent(type, componentId) {
        const baseId = componentId;
        
        switch (type) {
            case 'button':
                return {
                    html: `<button style="
                        background: var(--nebula-primary);
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 13px;
                    ">Button</button>`,
                    properties: {
                        text: 'Button',
                        backgroundColor: '#667eea',
                        color: '#ffffff',
                        width: '80px',
                        height: '32px'
                    }
                };
            
            case 'input':
                return {
                    html: `<input type="text" placeholder="Enter text" style="
                        padding: 8px;
                        border: 1px solid #ccc;
                        border-radius: 4px;
                        font-size: 13px;
                        width: 120px;
                    ">`,
                    properties: {
                        placeholder: 'Enter text',
                        width: '120px',
                        height: '32px'
                    }
                };
            
            case 'label':
                return {
                    html: `<label style="
                        color: var(--nebula-text-primary);
                        font-size: 13px;
                        display: block;
                    ">Label Text</label>`,
                    properties: {
                        text: 'Label Text',
                        fontSize: '13px',
                        color: '#333333'
                    }
                };
            
            case 'checkbox':
                return {
                    html: `<label style="display: flex; align-items: center; gap: 6px; font-size: 13px;">
                        <input type="checkbox"> Checkbox
                    </label>`,
                    properties: {
                        text: 'Checkbox',
                        checked: false
                    }
                };
            
            case 'select':
                return {
                    html: `<select style="
                        padding: 8px;
                        border: 1px solid #ccc;
                        border-radius: 4px;
                        font-size: 13px;
                        width: 120px;
                    ">
                        <option>Option 1</option>
                        <option>Option 2</option>
                    </select>`,
                    properties: {
                        options: ['Option 1', 'Option 2'],
                        width: '120px'
                    }
                };
            
            case 'div':
                return {
                    html: `<div style="
                        border: 2px dashed #ccc;
                        padding: 20px;
                        min-width: 150px;
                        min-height: 80px;
                        background: rgba(0,0,0,0.02);
                        text-align: center;
                        color: #999;
                        font-size: 12px;
                    ">Container</div>`,
                    properties: {
                        width: '150px',
                        height: '80px',
                        padding: '20px'
                    }
                };

            case 'sl-button':
                return {
                    html: `<sl-button type="default">Button</sl-button>`,
                    properties: { text: 'Button', type: 'default' }
                };

            case 'sl-input':
                return {
                    html: `<sl-input placeholder="Enter text"></sl-input>`,
                    properties: { placeholder: 'Enter text', value: '' }
                };

            case 'sl-textarea':
                return {
                    html: `<sl-textarea placeholder="Enter text"></sl-textarea>`,
                    properties: { placeholder: 'Enter text', value: '' }
                };

            case 'sl-select':
                return {
                    html: `<sl-select>
                                <sl-menu-item>Option 1</sl-menu-item>
                                <sl-menu-item>Option 2</sl-menu-item>
                           </sl-select>`,
                    properties: { options: ['Option 1', 'Option 2'] }
                };

            case 'sl-checkbox':
                return {
                    html: `<sl-checkbox>Check me</sl-checkbox>`,
                    properties: { checked: false }
                };

            case 'sl-radio':
                return {
                    html: `<div style="display:flex;gap:8px;align-items:center;"><sl-radio name="r1">A</sl-radio><sl-radio name="r1">B</sl-radio></div>`,
                    properties: { name: 'r1' }
                };

            case 'sl-switch':
                return {
                    html: `<sl-switch></sl-switch>`,
                    properties: { checked: false }
                };

            case 'sl-range':
                return {
                    html: `<sl-range min="0" max="100" value="50"></sl-range>`,
                    properties: { min: 0, max: 100, value: 50 }
                };

            case 'sl-icon':
                return {
                    html: `<sl-icon name="star"></sl-icon>`,
                    properties: { name: 'star' }
                };

            case 'sl-icon-button':
                return {
                    html: `<sl-icon-button name="star"></sl-icon-button>`,
                    properties: { name: 'star' }
                };

            case 'sl-dropdown':
                return {
                    html: `<sl-dropdown>
                                <sl-button slot="trigger">Menu</sl-button>
                                <sl-menu>
                                    <sl-menu-item>Item 1</sl-menu-item>
                                    <sl-menu-item>Item 2</sl-menu-item>
                                </sl-menu>
                           </sl-dropdown>`,
                    properties: { items: ['Item 1', 'Item 2'] }
                };

            case 'sl-dialog':
                return {
                    html: `<sl-dialog label="Dialog">
                                <div>Dialog content</div>
                                <sl-button slot="footer" variant="primary">OK</sl-button>
                           </sl-dialog>`,
                    properties: { label: 'Dialog' }
                };

            case 'sl-badge':
                return {
                    html: `<sl-badge>1</sl-badge>`,
                    properties: { value: '1' }
                };

            case 'sl-avatar':
                return {
                    html: `<sl-avatar initials="AB"></sl-avatar>`,
                    properties: { initials: 'AB' }
                };

            case 'sl-progress':
                return {
                    html: `<sl-progress value="50"></sl-progress>`,
                    properties: { value: 50 }
                };

            case 'sl-spinner':
                return {
                    html: `<sl-spinner></sl-spinner>`,
                    properties: {}
                };

            case 'sl-tooltip':
                return {
                    html: `<sl-tooltip content="Hint"><sl-button>Hover</sl-button></sl-tooltip>`,
                    properties: { content: 'Hint' }
                };

            case 'sl-tabs':
                return {
                    html: `<sl-tabs>
                                <sl-tab slot="nav">Tab 1</sl-tab>
                                <sl-tab slot="nav">Tab 2</sl-tab>
                                <div>Content for tabs</div>
                           </sl-tabs>`,
                    properties: { tabs: ['Tab 1', 'Tab 2'] }
                };

            case 'sl-toast':
                return {
                    html: `<sl-toast>Notification</sl-toast>`,
                    properties: { text: 'Notification' }
                };

            case 'nebula-filepicker':
                return {
                    html: `<div data-nebula-filepicker="true" style="display:inline-block; padding:8px 10px; border-radius:6px; background: rgba(0,0,0,0.04);">NebulaFilePicker</div>`,
                    properties: { provider: 'nebula-filepicker' }
                };
            
            default:
                return {
                    html: '<div>Unknown Component</div>',
                    properties: {}
                };
        }
    }

    makeComponentDraggable(component) {
        let isDragging = false;
        let startX, startY, startLeft, startTop;
        let dragPreview = null;
        let potentialDropTarget = null;

        // Ensure there is a visible drag handle to avoid clicking into Shadow DOM elements
        if (!component.querySelector('.drag-handle')) {
            const handle = document.createElement('div');
            handle.className = 'drag-handle';
            handle.style.cssText = `
                width:12px; height:12px; background:rgba(0,0,0,0.12); position:absolute; right:6px; top:6px; border-radius:2px; cursor:grab; z-index:10;
            `;
            component.appendChild(handle);
        }

        // Track whether we're resizing instead of dragging
        let isResizing = false;

        component.addEventListener('mousedown', (e) => {
            const path = e.composedPath ? e.composedPath() : (e.path || []);
            const clickedHandle = path.some(node => node && node.classList && node.classList.contains && node.classList.contains('drag-handle'));
            const clickedSelf = path.includes(component);
            if (!clickedHandle && !clickedSelf) return;

            startX = e.clientX;
            startY = e.clientY;
            startLeft = parseInt(component.style.left) || 0;
            startTop = parseInt(component.style.top) || 0;

            isDragging = true;
            component.style.cursor = 'move';
            // Create drag preview indicator
            component.style.opacity = '0.7';
            component.style.zIndex = '9999';

            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            component.style.left = (startLeft + deltaX) + 'px';
            component.style.top = (startTop + deltaY) + 'px';
            
            // Check for container drop targets
            this.updateContainerDropTargets(e, component);
        });

        document.addEventListener('mouseup', (e) => {
            if (isDragging) {
                isDragging = false;
                
                // Restore visual state
                component.style.opacity = '1';
                component.style.zIndex = 'auto';
                component.style.cursor = 'default';
                
                // Clear any drop target highlights
                this.clearContainerDropHighlights();
                
                // Check if dropped into a container
                const dropTarget = this.findContainerDropTarget(e, component);
                
                if (dropTarget) {
                    this.moveComponentToContainer(component, dropTarget);
                } else {
                    // Check if moved out of a container
                    this.checkRemoveFromContainer(component);
                }
                
                // Update component data
                const componentData = this.designedComponents.find(c => c.element === component);
                if (componentData) {
                    componentData.position.x = parseInt(component.style.left) || 0;
                    componentData.position.y = parseInt(component.style.top) || 0;
                    // If resized, stash frame dimensions
                    const frame = component.querySelector('.component-frame');
                    if (frame) {
                        componentData.properties.width = frame.style.width || (frame.offsetWidth + 'px');
                        componentData.properties.height = frame.style.height || (frame.offsetHeight + 'px');
                    }
                }
            }
        });
    }

    isNonVisibleComponent(type) {
        // Components that do not render immediately inside the layout but appear in overlays
        const nonVisible = ['sl-toast', 'sl-dialog', 'sl-dropdown'];
        return nonVisible.includes(type);
    }

    updateContainerDropTargets(mouseEvent, draggedComponent) {
        // Clear previous highlights
        this.clearContainerDropHighlights();
        
        // Find containers that could be drop targets
        const containers = this.designedComponents.filter(comp => 
            comp.type === 'div' && comp.element !== draggedComponent
        );
        
        containers.forEach(container => {
            const rect = container.element.getBoundingClientRect();
            const mouseX = mouseEvent.clientX;
            const mouseY = mouseEvent.clientY;
            
            // Check if mouse is over this container
            if (mouseX >= rect.left && mouseX <= rect.right && 
                mouseY >= rect.top && mouseY <= rect.bottom) {
                
                // Highlight as potential drop target
                container.element.style.border = '3px dashed var(--nebula-accent)';
                container.element.style.backgroundColor = 'rgba(102, 126, 234, 0.1)';
            }
        });
    }

    clearContainerDropHighlights() {
        this.designedComponents.forEach(comp => {
            if (comp.type === 'div') {
                comp.element.style.border = '2px dashed #ccc';
                comp.element.style.backgroundColor = 'rgba(0,0,0,0.02)';
            }
        });
    }

    findContainerDropTarget(mouseEvent, draggedComponent) {
        const containers = this.designedComponents.filter(comp => 
            comp.type === 'div' && comp.element !== draggedComponent
        );
        
        for (const container of containers) {
            const rect = container.element.getBoundingClientRect();
            const mouseX = mouseEvent.clientX;
            const mouseY = mouseEvent.clientY;
            
            if (mouseX >= rect.left && mouseX <= rect.right && 
                mouseY >= rect.top && mouseY <= rect.bottom) {
                return container;
            }
        }
        return null;
    }

    moveComponentToContainer(component, containerData) {
        const componentData = this.designedComponents.find(c => c.element === component);
        if (!componentData) return;
        
        // Remove from previous parent if any
        if (componentData.parent) {
            const oldParent = this.designedComponents.find(c => c.id === componentData.parent);
            if (oldParent) {
                oldParent.children = oldParent.children.filter(id => id !== componentData.id);
            }
        }
        
        const container = containerData.element;
        
        // Calculate relative position within container
        const componentLeft = parseInt(component.style.left) || 0;
        const componentTop = parseInt(component.style.top) || 0;
        
        const containerLeft = parseInt(container.style.left) || 0;
        const containerTop = parseInt(container.style.top) || 0;
        
        // Set position relative to container
        const relativeLeft = componentLeft - containerLeft;
        const relativeTop = componentTop - containerTop;
        
        // Move component into container DOM-wise
        container.appendChild(component);
        
        // Update position to be relative within container
        component.style.left = relativeLeft + 'px';
        component.style.top = relativeTop + 'px';
        
        // Update parent-child relationships
        componentData.parent = containerData.id;
        componentData.position.x = relativeLeft;
        componentData.position.y = relativeTop;
        
        // Add to container's children
        if (!containerData.children.includes(componentData.id)) {
            containerData.children.push(componentData.id);
        }
        
        console.log(`Component ${componentData.id} moved into container ${containerData.id}`);
        this.showNotification(`✅ Component moved into container`, 'success');
    }

    checkRemoveFromContainer(component) {
        const componentData = this.designedComponents.find(c => c.element === component);
        if (!componentData || !componentData.parent) return;
        
        const canvas = document.getElementById(`designCanvas-${this.windowId}`);
        const containerData = this.designedComponents.find(c => c.id === componentData.parent);
        
        if (!containerData) return;
        
        const containerRect = containerData.element.getBoundingClientRect();
        const componentRect = component.getBoundingClientRect();
        
        // Check if component is dragged outside container bounds
        const isOutside = (
            componentRect.left < containerRect.left ||
            componentRect.right > containerRect.right ||
            componentRect.top < containerRect.top ||
            componentRect.bottom > containerRect.bottom
        );
        
        if (isOutside) {
            // Move component back to canvas
            const containerLeft = parseInt(containerData.element.style.left) || 0;
            const containerTop = parseInt(containerData.element.style.top) || 0;
            
            // Calculate absolute position
            const relativeLeft = parseInt(component.style.left) || 0;
            const relativeTop = parseInt(component.style.top) || 0;
            
            const absoluteLeft = containerLeft + relativeLeft;
            const absoluteTop = containerTop + relativeTop;
            
            // Move back to canvas
            canvas.appendChild(component);
            component.style.left = absoluteLeft + 'px';
            component.style.top = absoluteTop + 'px';
            
            // Remove from parent's children list
            containerData.children = containerData.children.filter(id => id !== componentData.id);
            
            // Update component data
            componentData.parent = null;
            componentData.position.x = absoluteLeft;
            componentData.position.y = absoluteTop;
            
            console.log(`Component ${componentData.id} moved out of container ${containerData.id}`);
            this.showNotification(`✅ Component moved out of container`, 'success');
        }
    }

    selectComponent(componentId, propertiesPanel) {
        // Remove previous selection
        document.querySelectorAll('.gui-component').forEach(comp => {
            comp.style.border = '2px solid transparent';
        });

        this.selectedComponent = componentId;

        if (componentId) {
            // Highlight selected component
            const component = this.designedComponents.find(c => c.id === componentId);
            if (component) {
                component.element.style.border = '2px solid var(--nebula-primary)';
                this.showComponentProperties(component, propertiesPanel);
            }
        } else {
            propertiesPanel.innerHTML = `
                <div style="color: var(--nebula-text-secondary); font-size: 12px;">
                    Select a component to edit properties
                </div>
            `;
        }
    }

    showComponentProperties(component, propertiesPanel) {
        const props = component.properties;
        let html = `<div style="color: var(--nebula-text-primary); font-weight: 600; margin-bottom: 12px; font-size: 13px;">
            ${component.type.charAt(0).toUpperCase() + component.type.slice(1)} Properties
        </div>`;
        // Schema-driven properties for common components
        const schema = this.getPropertySchemaForType(component.type, props);

        schema.forEach(field => {
            const val = component.properties[field.key] ?? field.default ?? '';
            if (field.type === 'textarea') {
                html += `
                    <div style="margin-bottom: 12px;">
                        <label style="display:block;font-size:11px;color:var(--nebula-text-secondary);margin-bottom:4px;">${field.label}</label>
                        <textarea data-component-id="${component.id}" data-property="${field.key}" style="width:100%;min-height:60px;padding:6px;border:1px solid var(--nebula-border);border-radius:3px;background:var(--nebula-bg-primary);color:var(--nebula-text-primary);">${val}</textarea>
                    </div>
                `;
            } else if (field.type === 'select') {
                html += `<div style="margin-bottom:12px;"><label style="display:block;font-size:11px;color:var(--nebula-text-secondary);margin-bottom:4px;">${field.label}</label><select data-component-id="${component.id}" data-property="${field.key}" style="width:100%;padding:6px;border:1px solid var(--nebula-border);border-radius:3px;background:var(--nebula-bg-primary);color:var(--nebula-text-primary);">`;
                field.options.forEach(o => {
                    const s = (o === val) ? 'selected' : '';
                    html += `<option value="${o}" ${s}>${o}</option>`;
                });
                html += `</select></div>`;
            } else if (field.type === 'checkbox') {
                const checked = val ? 'checked' : '';
                html += `<div style="margin-bottom:12px;"><label style="font-size:11px;color:var(--nebula-text-secondary);"><input type="checkbox" data-component-id="${component.id}" data-property="${field.key}" ${checked}> ${field.label}</label></div>`;
            } else {
                const inputType = field.type === 'color' ? 'color' : 'text';
                html += `
                    <div style="margin-bottom: 12px;">
                        <label style="display: block; font-size: 11px; color: var(--nebula-text-secondary); margin-bottom: 4px;">${field.label}</label>
                        <input type="${inputType}" value="${val}" data-component-id="${component.id}" data-property="${field.key}" style="width:100%;padding:6px;border:1px solid var(--nebula-border);border-radius:3px;background:var(--nebula-bg-primary);color:var(--nebula-text-primary);">
                    </div>
                `;
            }
        });

        // Add preview controls for certain components
        if (component.type === 'sl-toast') {
            html += `<div style="margin-top:8px;display:flex;gap:8px;"><button id="previewShowToast-${component.id}" style="padding:6px 10px;border-radius:4px;border:1px solid var(--nebula-border);background:var(--nebula-bg-primary);">Show Toast</button></div>`;
        }
        if (component.type === 'sl-dialog') {
            html += `<div style="margin-top:8px;display:flex;gap:8px;"><button id="previewOpenDialog-${component.id}" style="padding:6px 10px;border-radius:4px;border:1px solid var(--nebula-border);background:var(--nebula-bg-primary);">Open Dialog</button></div>`;
        }

    // Add a small helper for linking events (now starts integrated link flow)
    html += `<div style="margin-top:8px;"><button id="linkEventBtn-${component.id}" style="padding:6px 10px;border-radius:4px;border:1px solid var(--nebula-border);background:var(--nebula-bg-primary);">Link to...</button></div>`;

        propertiesPanel.innerHTML = html;

        // Attach listeners for inputs
        propertiesPanel.querySelectorAll('input, textarea, select').forEach(input => {
            const eventType = input.tagName === 'SELECT' ? 'change' : 'input';
            input.addEventListener(eventType, (e) => {
                const dataset = e.target.dataset;
                const value = (e.target.type === 'checkbox') ? e.target.checked : e.target.value;
                this.updateComponentProperty(dataset.componentId, dataset.property, value);
            });
        });

        // Link button: enable integrated in-canvas linking (preferred) or fall back to modal
        const linkBtn = propertiesPanel.querySelector(`#linkEventBtn-${component.id}`);
        if (linkBtn) {
            linkBtn.addEventListener('click', (e) => {
                e.preventDefault();
                // If link mode is not active, enable it first
                const windowId = this.windowId;
                if (!this.linkMode) {
                    this.enableLinkMode(windowId);
                    // Inform the user briefly
                    try { showNotification && showNotification('Link Mode', 'Link Mode enabled — drag from the highlighted output port to the target component.'); } catch(e) { /* ignore */ }
                }

                // Find the component record
                const comp = this.designedComponents.find(c => c.id === component.id);
                if (!comp) {
                    // fallback to the modal editor
                    this.openLinkEditor(component);
                    return;
                }

                // If ports are visible and output port exists, flash it once and dispatch mousedown to start linking
                const out = comp.portEls && comp.portEls.output;
                if (out) {
                    // One-time highlight per component per session
                    this._linkHintShown = this._linkHintShown || {};
                    if (!this._linkHintShown[comp.id]) {
                        this._linkHintShown[comp.id] = true;
                        // apply highlight style and remove after animation
                        const origBorder = out.style.border;
                        const origBox = out.style.boxShadow;
                        out.style.transition = 'box-shadow 400ms ease, transform 400ms ease';
                        out.style.boxShadow = '0 0 14px rgba(31,140,255,0.85)';
                        out.style.transform = 'scale(1.25)';
                        setTimeout(() => {
                            out.style.boxShadow = origBox || '';
                            out.style.transform = '';
                        }, 600);
                    }

                    // synthesize a mousedown event on the output port element so user can immediately drag to target
                    try {
                        const ev = new MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX: out.getBoundingClientRect().left + 4, clientY: out.getBoundingClientRect().top + 4 });
                        out.dispatchEvent(ev);
                    } catch (err) {
                        // If synthetic dispatch doesn't work, fall back to opening modal
                        console.warn('Could not start in-canvas linking programmatically, opening Link Editor modal', err);
                        this.openLinkEditor(component);
                    }
                } else {
                    // No port element found - fallback to modal
                    this.openLinkEditor(component);
                }
            });
        }

        const toastBtn = propertiesPanel.querySelector(`#previewShowToast-${component.id}`);
        if (toastBtn) {
            toastBtn.addEventListener('click', () => {
                const inner = component.element.querySelector('.component-inner');
                const sl = inner && inner.querySelector('sl-toast');
                if (sl) {
                    try { sl.show(); } catch (e) { sl.setAttribute('open',''); }
                }
            });
        }

        const dialogBtn = propertiesPanel.querySelector(`#previewOpenDialog-${component.id}`);
        if (dialogBtn) {
            dialogBtn.addEventListener('click', () => {
                const inner = component.element.querySelector('.component-inner');
                const sl = inner && inner.querySelector('sl-dialog');
                if (sl) {
                    try { sl.show(); } catch (e) { sl.setAttribute('open',''); }
                }
            });
        }
    }

    getPropertySchemaForType(type, existingProps) {
        // Provide editable fields for common native and shoelace components
        const base = [ { key: 'id', label: 'ID', type: 'text', default: existingProps.id || '' } ];

        const schemas = {
            'button': [ { key: 'text', label: 'Text', type: 'text', default: existingProps.text || 'Button' }, { key: 'backgroundColor', label: 'Background', type: 'color', default: existingProps.backgroundColor || '#667eea' } ],
            'input': [ { key: 'placeholder', label: 'Placeholder', type: 'text', default: existingProps.placeholder || 'Enter text' }, { key: 'value', label: 'Value', type: 'text', default: existingProps.value || '' } ],
            'sl-button': [ { key: 'text', label: 'Text', type: 'text', default: existingProps.text || 'Button' }, { key: 'variant', label: 'Variant', type: 'select', options: ['default','primary','success','danger'], default: existingProps.variant || 'default' }, { key: 'icon', label: 'Icon', type: 'text', default: existingProps.icon || '' } ],
            'sl-input': [ { key: 'placeholder', label: 'Placeholder', type: 'text', default: existingProps.placeholder || 'Enter text' }, { key: 'value', label: 'Value', type: 'text', default: existingProps.value || '' } ],
            'sl-select': [ { key: 'options', label: 'Options (comma separated)', type: 'text', default: (existingProps.options || []).join(',') } ],
            'sl-checkbox': [ { key: 'checked', label: 'Checked', type: 'checkbox', default: existingProps.checked || false } ],
            'sl-progress': [ { key: 'value', label: 'Value', type: 'text', default: existingProps.value || 0 } ],
            'sl-badge': [ { key: 'value', label: 'Value', type: 'text', default: existingProps.value || '' } ],
            'sl-icon': [ { key: 'name', label: 'Icon name', type: 'text', default: existingProps.name || 'star' } ],
            'sl-tabs': [ { key: 'tabs', label: 'Tabs (label::content per line)', type: 'textarea', default: (existingProps.tabs || []).map(t=> (t.label + '::' + (t.content||''))).join('\n') } ],
            'sl-toast': [ { key: 'text', label: 'Text', type: 'text', default: existingProps.text || 'Notification' }, { key: 'timeout', label: 'Timeout (ms)', type: 'text', default: existingProps.timeout || '4000' } ],
            'sl-dialog': [ { key: 'label', label: 'Label', type: 'text', default: existingProps.label || 'Dialog' }, { key: 'content', label: 'Content (HTML)', type: 'textarea', default: existingProps.content || '' }, { key: 'open', label: 'Open', type: 'checkbox', default: existingProps.open || false } ]
        };

        return schemas[type] ? schemas[type] : Object.entries(existingProps).map(([k,v]) => ({ key: k, label: k, type: 'text', default: v }));
    }

    updateComponentProperty(componentId, property, value) {
        const component = this.designedComponents.find(c => c.id === componentId);
        if (!component) return;

        component.properties[property] = value;

        // Update the visual element
        const element = component.element;
        const inner = element.querySelector('.component-inner');
        const native = inner && inner.querySelector('button, input, label, select, textarea, div');

        // If this is a Shoelace component, prefer setting attributes/properties on the custom element
        const sl = inner && inner.querySelector('[is^="sl-"]') || inner && inner.querySelector('sl-button, sl-input, sl-select, sl-checkbox, sl-progress, sl-badge, sl-icon');

        // Generic mapping logic
        if (sl) {
            // For sl-select options we accept comma-separated string
            if (property === 'options' && typeof value === 'string') {
                const opts = value.split(',').map(s => s.trim()).filter(Boolean);
                // Clear existing menu items
                while (sl.firstChild) sl.removeChild(sl.firstChild);
                opts.forEach(o => {
                    const mi = document.createElement('sl-menu-item');
                    mi.textContent = o;
                    sl.appendChild(mi);
                });
                component.properties.options = opts;
                return;
            }

            // boolean
            if (property === 'checked') {
                try { sl.checked = !!value; } catch(e) { sl.setAttribute('checked', value ? '': ''); }
                return;
            }

            // numeric/value
            if (property === 'value') {
                try { sl.value = value; } catch (e) { sl.setAttribute('value', value); }
                return;
            }

            // sl-tabs special handling: parse textarea with lines label::content
            if (sl.tagName && sl.tagName.toLowerCase() === 'sl-tabs' && property === 'tabs') {
                // Clear current tabs
                while (sl.firstChild) sl.removeChild(sl.firstChild);
                const lines = value.split('\n').map(l => l.trim()).filter(Boolean);
                lines.forEach((ln, idx) => {
                    const parts = ln.split('::');
                    const label = parts[0] || `Tab ${idx+1}`;
                    const content = parts[1] || '';
                    const tab = document.createElement('sl-tab');
                    tab.setAttribute('slot', 'nav');
                    tab.textContent = label;
                    sl.appendChild(tab);
                    const panel = document.createElement('div');
                    panel.innerHTML = content;
                    sl.appendChild(panel);
                });
                component.properties.tabs = lines.map(l => { const p = l.split('::'); return { label: p[0], content: p[1]||'' }; });
                return;
            }

            // sl-toast: update text/timeout and offer preview
            if (sl.tagName && sl.tagName.toLowerCase() === 'sl-toast') {
                if (property === 'text') {
                    sl.textContent = value;
                    component.properties.text = value;
                    return;
                }
                if (property === 'timeout') {
                    try { sl.timeout = parseInt(value); } catch (e) { sl.setAttribute('timeout', value); }
                    component.properties.timeout = value;
                    return;
                }
            }

            // sl-dialog: set label/content/open
            if (sl.tagName && sl.tagName.toLowerCase() === 'sl-dialog') {
                if (property === 'label') { try { sl.label = value; } catch(e) { sl.setAttribute('label', value); } component.properties.label = value; return; }
                if (property === 'content') { // replace dialog inner HTML
                    // remove existing non-template children
                    while (sl.firstChild) sl.removeChild(sl.firstChild);
                    const wrapper = document.createElement('div');
                    wrapper.innerHTML = value;
                    sl.appendChild(wrapper);
                    component.properties.content = value;
                    return;
                }
                if (property === 'open') {
                    const shouldOpen = !!value;
                    try { if (shouldOpen) sl.show(); else sl.hide(); } catch(e) { if (shouldOpen) sl.setAttribute('open',''); else sl.removeAttribute('open'); }
                    component.properties.open = shouldOpen;
                    return;
                }
            }

            // fallback: set attribute
            try { sl.setAttribute(property, value); } catch (e) { /* ignore */ }
            return;
        }

        // Native element fallback
        if (native) {
            switch (property) {
                case 'text':
                    native.textContent = value;
                    break;
                case 'placeholder':
                    if (native.tagName === 'INPUT' || native.tagName === 'TEXTAREA') native.placeholder = value;
                    break;
                case 'backgroundColor':
                    native.style.backgroundColor = value; break;
                case 'width':
                    native.style.width = value; break;
                case 'height':
                    native.style.height = value; break;
                default:
                    try { native.setAttribute(property, value); } catch (e) {}
            }
        }
    }

    openLinkEditor(component) {
        // Open a Link Editor modal to visually connect component events -> actions
        const id = `link-editor-${this.windowId}`;
        if (document.getElementById(id)) return; // already open

        // Prepare basic data structures
        if (!this.designerLinks) this.designerLinks = [];
        if (!this.designerNodes) this.designerNodes = [];

        // Build modal
        const modal = document.createElement('div');
        modal.id = id;
        modal.style.cssText = `position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:900px;height:600px;background:var(--nebula-surface);border:1px solid var(--nebula-border);z-index:60000;box-shadow:0 12px 40px rgba(0,0,0,0.2);display:flex;flex-direction:row;`;

        // Left: component list
        const list = document.createElement('div');
        list.style.cssText = 'width:240px;padding:12px;border-right:1px solid var(--nebula-border);overflow:auto;';
        list.innerHTML = `<div style="font-weight:600;margin-bottom:8px;color:var(--nebula-text-primary);">Components</div>`;

        // Populate components as nodes (click to add to canvas)
        this.designedComponents.forEach(c => {
            const row = document.createElement('div');
            row.style.cssText = 'padding:8px;border:1px solid transparent;border-radius:4px;margin-bottom:6px;cursor:pointer;';
            row.textContent = `${c.type} (${c.id})`;
            row.addEventListener('click', () => {
                this.addLinkNodeToCanvas(c);
            });
            list.appendChild(row);
        });

        // Center: node canvas with svg for links
        const canvasWrap = document.createElement('div');
        canvasWrap.style.cssText = 'flex:1;position:relative;overflow:hidden;background:var(--nebula-bg-primary);';

        const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
        svg.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;';
        svg.setAttribute('id','link-editor-svg');
        canvasWrap.appendChild(svg);

        const nodesLayer = document.createElement('div');
        nodesLayer.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:auto;';
        canvasWrap.appendChild(nodesLayer);

        // Right: controls
        const right = document.createElement('div');
        right.style.cssText = 'width:240px;padding:12px;border-left:1px solid var(--nebula-border);overflow:auto;';
        right.innerHTML = `<div style="font-weight:600;margin-bottom:8px;color:var(--nebula-text-primary);">Links</div><div id="linkList-${this.windowId}"></div><div style="margin-top:12px;"><button id="saveLinks-${this.windowId}" style="padding:8px 10px;margin-right:8px;">Save</button><button id="closeLinks-${this.windowId}" style="padding:8px 10px;">Close</button></div>`;

        modal.appendChild(list);
        modal.appendChild(canvasWrap);
        modal.appendChild(right);
        document.body.appendChild(modal);

        // store references
        this.linkEditor = { modal, svg, nodesLayer, rightPanel: right };

        // Populate existing nodes/links on load
        this.designerNodes = this.designerNodes || [];
        this.designerLinks = this.designerLinks || [];
        this.designerNodes.forEach(n => this.renderLinkNode(n));
        this.designerLinks.forEach(l => this.renderLink(l));

        // Save/Close handlers
        document.getElementById(`saveLinks-${this.windowId}`).addEventListener('click', () => {
            // Save data; keep in memory for now
            this.showNotification('✅ Links saved in designer (in-memory).', 'success');
            this.updateLinkListUI();
        });

        document.getElementById(`closeLinks-${this.windowId}`).addEventListener('click', () => {
            modal.remove();
        });
    }

    addLinkNodeToCanvas(component) {
        // create a node object and render it in the link-editor canvas
        const id = `node_${component.id}_${Date.now()}`;
        const grid = 20;
        const x = Math.round(40 / grid) * grid;
        const y = Math.round(40 / grid) * grid;
        const node = { id, compId: component.id, type: component.type, x, y, width: 160, height: 80 };
        this.designerNodes.push(node);
        this.renderLinkNode(node);
    }

    renderLinkNode(node) {
        if (!this.linkEditor) return;
        const nodesLayer = this.linkEditor.nodesLayer;
        const nEl = document.createElement('div');
        nEl.className = 'link-node';
        nEl.id = node.id;
        nEl.style.cssText = `position:absolute;left:${node.x}px;top:${node.y}px;width:${node.width}px;height:${node.height}px;border:1px solid var(--nebula-border);background:var(--nebula-surface);border-radius:6px;box-shadow:0 6px 14px rgba(0,0,0,0.06);`;

        // Node HTML: title, top input port, body, bottom output port
        nEl.innerHTML = `
            <div class="node-header" style="cursor:grab;padding:8px;border-bottom:1px solid rgba(0,0,0,0.03);font-weight:600;font-size:13px;">${node.type}</div>
            <div class="node-input-port" data-port="input" style="position:absolute;left:50%;transform:translateX(-50%);top:-8px;width:14px;height:14px;border-radius:8px;background:#fff;border:2px solid #666;box-shadow:0 1px 3px rgba(0,0,0,0.15);"></div>
            <div class="node-body" style="padding:8px;font-size:12px;color:var(--nebula-text-secondary);">${node.compId}</div>
            <div class="node-output-port" data-port="output" style="position:absolute;left:50%;transform:translateX(-50%);bottom:-8px;width:14px;height:14px;border-radius:8px;background:#fff;border:2px solid #1f8cff;box-shadow:0 1px 3px rgba(0,0,0,0.15);"></div>
        `;
        nodesLayer.appendChild(nEl);

        // Grid snap & drag
        const grid = 20;
        let dragging = false, sx = 0, sy = 0, ox = 0, oy = 0;
        const header = nEl.querySelector('.node-header');
        header.addEventListener('mousedown', (e) => {
            dragging = true; sx = e.clientX; sy = e.clientY; ox = node.x; oy = node.y; header.style.cursor = 'grabbing'; e.preventDefault();
        });

        const onMouseMove = (e) => {
            if (!dragging) return;
            const dx = e.clientX - sx; const dy = e.clientY - sy;
            node.x = Math.round((ox + dx) / grid) * grid;
            node.y = Math.round((oy + dy) / grid) * grid;
            nEl.style.left = node.x + 'px'; nEl.style.top = node.y + 'px';
            this.updateLinksSVG();
        };

        const onMouseUp = () => { dragging = false; header.style.cursor = 'grab'; };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        // Port interaction: start/connect links via ports
        const svg = this.linkEditor.svg;
        const getPortCenter = (portEl) => {
            const r = portEl.getBoundingClientRect();
            const svgR = svg.getBoundingClientRect();
            return { x: r.left + r.width / 2 - svgR.left, y: r.top + r.height / 2 - svgR.top };
        };

        nEl.querySelectorAll('[data-port]').forEach(port => {
            port.addEventListener('mousedown', (e) => {
                e.stopPropagation(); e.preventDefault();
                const type = port.dataset.port; // 'input' or 'output'
                // Start linking only from output ports
                if (type !== 'output') return;

                // create temp path
                this._linking = this._linking || {};
                if (this._linking.tempPath) { this._linking.tempPath.remove(); }
                const p = document.createElementNS('http://www.w3.org/2000/svg','path');
                p.setAttribute('stroke','#1f8cff'); p.setAttribute('stroke-width','3'); p.setAttribute('fill','none'); p.setAttribute('opacity','0.95');
                svg.appendChild(p);
                this._linking = { fromNodeId: node.id, fromPort: 'output', tempPath: p };

                const movefn = (ev) => {
                    const svgRect = svg.getBoundingClientRect();
                    const from = getPortCenter(port);
                    const toX = ev.clientX - svgRect.left;
                    const toY = ev.clientY - svgRect.top;
                    const cx = (from.x + toX) / 2;
                    const d = `M ${from.x} ${from.y} C ${cx} ${from.y} ${cx} ${toY} ${toX} ${toY}`;
                    p.setAttribute('d', d);
                };

                const upfn = (ev) => {
                    document.removeEventListener('mousemove', movefn);
                    document.removeEventListener('mouseup', upfn);
                    // detect target input port
                    const el = document.elementFromPoint(ev.clientX, ev.clientY);
                    if (el && el.dataset && el.dataset.port === 'input') {
                        const targetNodeEl = el.closest('.link-node');
                        if (targetNodeEl && targetNodeEl.id !== node.id) {
                            const link = { id: `link_${Date.now()}`, from: { nodeId: node.id, io: 'output' }, to: { nodeId: targetNodeEl.id, io: 'input' } };
                            this.designerLinks.push(link);
                            this.updateLinksSVG();
                            this.updateLinkListUI();
                        }
                    }
                    // cleanup temp
                    if (p && p.parentNode) p.remove();
                    this._linking = null;
                };

                document.addEventListener('mousemove', movefn);
                document.addEventListener('mouseup', upfn);
            });
        });
    }

    createLinkStub(node, io) {
        // Deprecated - legacy helper kept for compatibility: add direct link from node -> next node if present
        const other = this.designerNodes.find(n => n.id !== node.id);
        if (other) {
            const link = { id: `link_${Date.now()}`, from: { nodeId: node.id, io }, to: { nodeId: other.id, io: io === 'output' ? 'input' : 'output' } };
            this.designerLinks.push(link);
            this.updateLinksSVG();
            this.updateLinkListUI();
        } else {
            this.showNotification('Add another node to connect to.', 'info');
        }
    }

    renderLink(link) {
        // kept for backward compatibility: single-line render (not used by new renderer)
        this.updateLinksSVG();
    }

    updateLinksSVG() {
        // Use modal svg when Link Editor modal is open, otherwise use designer svg overlay
        const svg = (this.linkEditor && this.linkEditor.svg) || document.getElementById(`designer-link-svg-${this.windowId}`);
        if (!svg) return;
        // clear existing
        while (svg.firstChild) svg.removeChild(svg.firstChild);

        // render each link as a smooth multi-segment cubic bezier path with label, midpoints and click-to-select
        const svgRect = svg.getBoundingClientRect();
        this.designerLinks.forEach((l, linkIdx) => {
            const fromNode = this.designerNodes.find(n => n.id === l.from.nodeId);
            const toNode = this.designerNodes.find(n => n.id === l.to.nodeId);
            if (!fromNode || !toNode) return;

            // find port elements (may be in designer modal or in link-editor nodes)
            const fromEl = document.getElementById(fromNode.id)?.querySelector('[data-port="output"]');
            const toEl = document.getElementById(toNode.id)?.querySelector('[data-port="input"]');
            if (!fromEl || !toEl) return;

            const fRect = fromEl.getBoundingClientRect();
            const tRect = toEl.getBoundingClientRect();
            const x1 = fRect.left + fRect.width / 2 - svgRect.left;
            const y1 = fRect.top + fRect.height / 2 - svgRect.top;
            const x2 = tRect.left + tRect.width / 2 - svgRect.left;
            const y2 = tRect.top + tRect.height / 2 - svgRect.top;

            // Build points sequence: start, midpoints..., end
            const points = [{ x: x1, y: y1 }];
            l.midpoints = l.midpoints || [];
            // Convert stored normalized midpoints (0..1) to absolute pixel coordinates
            l.midpoints.forEach(mp => {
                if (mp && typeof mp.x === 'number' && typeof mp.y === 'number') {
                    // if values look normalized (<=1), scale by svg size; otherwise assume absolute
                    if (Math.abs(mp.x) <= 1 && Math.abs(mp.y) <= 1) {
                        points.push({ x: (mp.x * svgRect.width), y: (mp.y * svgRect.height) });
                    } else {
                        points.push({ x: Number(mp.x) || 0, y: Number(mp.y) || 0 });
                    }
                }
            });
            points.push({ x: x2, y: y2 });

            // Build path using multiple cubic segments between consecutive points
            let d = '';
            if (points.length > 0) {
                d = `M ${points[0].x} ${points[0].y}`;
                for (let i = 0; i < points.length - 1; i++) {
                    const p0 = points[i];
                    const p1 = points[i + 1];
                    const cx = (p0.x + p1.x) / 2;
                    d += ` C ${cx} ${p0.y} ${cx} ${p1.y} ${p1.x} ${p1.y}`;
                }
            }

            const path = document.createElementNS('http://www.w3.org/2000/svg','path');
            path.setAttribute('d', d);
            path.setAttribute('stroke', this.selectedDesignerLinkId === l.id ? '#1f8cff' : '#888');
            path.setAttribute('stroke-width', this.selectedDesignerLinkId === l.id ? '4' : '3');
            path.setAttribute('fill','none');
            path.setAttribute('data-link-id', l.id);
            path.style.cursor = 'pointer';
            path.style.transition = 'stroke 160ms ease, stroke-width 160ms ease';
            path.style.pointerEvents = 'auto';
            svg.appendChild(path);

            // Allow double-click on path to add a midpoint at clicked position
            path.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                const svgR = svg.getBoundingClientRect();
                const nx = e.clientX - svgR.left;
                const ny = e.clientY - svgR.top;
                l.midpoints = l.midpoints || [];
                // store normalized coords (0..1) so midpoints survive canvas resize
                const nxn = Math.max(0, Math.min(1, nx / svgR.width || 0));
                const nyn = Math.max(0, Math.min(1, ny / svgR.height || 0));
                l.midpoints.push({ x: nxn, y: nyn });
                this.updateLinksSVG();
                this.updateLinkListUI();
            });

            // Label at midpoint (prefer explicit label)
            const midIndex = Math.floor(points.length / 2);
            const midX = points[midIndex].x;
            const midY = points[midIndex].y;
            const label = document.createElementNS('http://www.w3.org/2000/svg','text');
            label.setAttribute('x', midX);
            label.setAttribute('y', midY - 8);
            label.setAttribute('fill', '#444');
            label.setAttribute('font-size', '11');
            label.setAttribute('text-anchor', 'middle');
            label.textContent = (l.label && String(l.label).trim()) ? String(l.label) : ((l.event || 'click') + ' → ' + (l.action || 'setText'));
            label.style.pointerEvents = 'auto';
            svg.appendChild(label);

            // Inline edit on double-click of the label
            label.addEventListener('dblclick', (ev) => {
                ev.stopPropagation();
                // Create an input that follows the SVG label even with scroll/zoom/nested transforms
                const input = document.createElement('input');
                input.type = 'text';
                input.value = l.label || '';
                input.style.position = 'fixed';
                input.style.width = '160px';
                input.style.padding = '6px';
                input.style.zIndex = 70000;
                document.body.appendChild(input);

                // Helper to position input based on SVG text coords using getScreenCTM
                const positionInput = () => {
                    try {
                        const svgNode = svg;
                        if (svgNode && svgNode.createSVGPoint) {
                            const pt = svgNode.createSVGPoint();
                            pt.x = Number(label.getAttribute('x')) || 0;
                            pt.y = Number(label.getAttribute('y')) || 0;
                            const ctm = label.getCTM ? label.getCTM() : svgNode.getScreenCTM();
                            const screenPt = pt.matrixTransform(ctm || svgNode.getScreenCTM());
                            // screenPt is in screen coordinates
                            input.style.left = (screenPt.x - (input.offsetWidth / 2)) + 'px';
                            input.style.top = (screenPt.y - 18) + 'px';
                        } else {
                            // fallback to bounding rect
                            const svgR = svg.getBoundingClientRect();
                            input.style.left = (svgR.left + Number(label.getAttribute('x')) - 60) + 'px';
                            input.style.top = (svgR.top + Number(label.getAttribute('y')) - 18) + 'px';
                        }
                    } catch (err) {
                        const svgR = svg.getBoundingClientRect();
                        input.style.left = (svgR.left + Number(label.getAttribute('x')) - 60) + 'px';
                        input.style.top = (svgR.top + Number(label.getAttribute('y')) - 18) + 'px';
                    }
                };

                positionInput();
                input.focus();
                // Reposition while typing to keep the input centered over the label when width changes
                const onInputResize = () => positionInput();
                input.addEventListener('input', onInputResize);

                // Reposition on scroll/resize while editing
                const onWindowChange = () => positionInput();
                window.addEventListener('scroll', onWindowChange, true);
                window.addEventListener('resize', onWindowChange);

                const cleanup = () => {
                    window.removeEventListener('scroll', onWindowChange, true);
                    window.removeEventListener('resize', onWindowChange);
                    input.removeEventListener('input', onInputResize);
                    if (input && input.parentNode) input.parentNode.removeChild(input);
                };

                const commit = () => {
                    l.label = input.value.trim() || null;
                    cleanup();
                    this.updateLinksSVG();
                    this.updateLinkListUI();
                };
                const cancel = () => { cleanup(); };

                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') commit();
                    else if (e.key === 'Escape') cancel();
                });
                input.addEventListener('blur', () => commit());
            });

            // Path click selects / opens inspector
            path.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.selectedDesignerLinkId === l.id) {
                    this.showLinkInspector(l, e.clientX, e.clientY);
                } else {
                    this.selectedDesignerLinkId = l.id;
                    this.updateLinksSVG();
                    this.updateLinkListUI();
                }
            });

            // Render draggable midpoint handles
            points.forEach((pt, idx) => {
                // skip rendering handles for endpoints (idx 0 and last) unless there is a stored midpoint corresponding
            });

            // Render handles for stored midpoints only
            l.midpoints.forEach((mp, midIdx) => {
                let cx = 0, cy = 0;
                if (mp && typeof mp.x === 'number' && typeof mp.y === 'number') {
                    if (Math.abs(mp.x) <= 1 && Math.abs(mp.y) <= 1) {
                        cx = mp.x * svgRect.width; cy = mp.y * svgRect.height;
                    } else { cx = Number(mp.x) || 0; cy = Number(mp.y) || 0; }
                }
                const handle = document.createElementNS('http://www.w3.org/2000/svg','circle');
                handle.setAttribute('cx', cx);
                handle.setAttribute('cy', cy);
                handle.setAttribute('r', 6);
                handle.setAttribute('fill', '#fff');
                handle.setAttribute('stroke', '#1f8cff');
                handle.setAttribute('stroke-width', '2');
                handle.setAttribute('data-link-id', l.id);
                handle.setAttribute('data-mid-index', midIdx);
                handle.style.cursor = 'grab';
                handle.style.pointerEvents = 'auto';
                svg.appendChild(handle);

                // Drag support for handle
                let dragging = false;
                let startX = 0, startY = 0;
                const onDown = (ev) => {
                    ev.stopPropagation(); ev.preventDefault();
                    dragging = true; startX = ev.clientX; startY = ev.clientY; handle.style.cursor = 'grabbing';
                    document.addEventListener('mousemove', onMove);
                    document.addEventListener('mouseup', onUp);
                };
                const onMove = (ev) => {
                    if (!dragging) return;
                    const svgR = svg.getBoundingClientRect();
                    const nx = ev.clientX - svgR.left;
                    const ny = ev.clientY - svgR.top;
                    handle.setAttribute('cx', nx); handle.setAttribute('cy', ny);
                    // update data model (store normalized to svg dimensions)
                    const nxn = Math.max(0, Math.min(1, nx / svgR.width || 0));
                    const nyn = Math.max(0, Math.min(1, ny / svgR.height || 0));
                    l.midpoints[midIdx] = { x: nxn, y: nyn };
                    // update path/label positions
                    this.updateLinksSVG();
                };
                const onUp = (ev) => {
                    dragging = false; handle.style.cursor = 'grab';
                    document.removeEventListener('mousemove', onMove);
                    document.removeEventListener('mouseup', onUp);
                    this.updateLinkListUI();
                };
                handle.addEventListener('mousedown', onDown);
            });
        });
    }

    showLinkInspector(link, x = 100, y = 100) {
        // Remove any existing inspector
        const existing = document.getElementById(`link-inspector-${this.windowId}`);
        if (existing) existing.remove();

        const inspector = document.createElement('div');
        inspector.id = `link-inspector-${this.windowId}`;
        inspector.style.cssText = `position:fixed;left:${x}px;top:${y}px;transform:translate(-50%,-50%);background:var(--nebula-surface);border:1px solid var(--nebula-border);padding:12px;border-radius:8px;z-index:60001;min-width:260px;`;

        // basic form: event, action, payload
        const events = ['click','input','change','submit'];
        const actions = ['setText','setValue','openDialog','showToast'];

        inspector.innerHTML = `
            <div style="font-weight:600;margin-bottom:8px;">Edit Link</div>
            <label style="font-size:12px;color:var(--nebula-text-secondary);">Label</label>
            <input id="link-label" style="width:100%;padding:6px;margin-bottom:8px;" placeholder="Optional short label (e.g. 'Submit → Save')" />
            <label style="font-size:12px;color:var(--nebula-text-secondary);">Event</label>
            <select id="link-event" style="width:100%;padding:6px;margin-bottom:8px;"></select>
            <label style="font-size:12px;color:var(--nebula-text-secondary);">Action</label>
            <select id="link-action" style="width:100%;padding:6px;margin-bottom:8px;"></select>
            <label style="font-size:12px;color:var(--nebula-text-secondary);">Payload</label>
            <input id="link-payload" style="width:100%;padding:6px;margin-bottom:8px;" />
            <div style="display:flex;gap:8px;justify-content:flex-end;">
                <button id="link-cancel" style="padding:6px 8px;">Cancel</button>
                <button id="link-save" style="padding:6px 8px;background:var(--nebula-accent);color:#fff;border-radius:4px;">Save</button>
            </div>
        `;

        document.body.appendChild(inspector);

    const labelInput = inspector.querySelector('#link-label');
    const eventSel = inspector.querySelector('#link-event');
        const actionSel = inspector.querySelector('#link-action');
        const payloadInput = inspector.querySelector('#link-payload');

        events.forEach(ev => { const o = document.createElement('option'); o.value = ev; o.textContent = ev; if (link.event === ev) o.selected = true; eventSel.appendChild(o); });
        actions.forEach(a => { const o = document.createElement('option'); o.value = a; o.textContent = a; if (link.action === a) o.selected = true; actionSel.appendChild(o); });

        // payload display
        // label display
        if (link.label) labelInput.value = link.label;
        if (link.payload) {
            if (link.payload.kind === 'const') payloadInput.value = link.payload.value;
            else if (link.payload.kind === 'sourceValue') payloadInput.value = '{{source.value}}';
            else if (link.payload.kind === 'template') payloadInput.value = link.payload.value;
        }

        inspector.querySelector('#link-cancel').addEventListener('click', () => inspector.remove());
        inspector.querySelector('#link-save').addEventListener('click', () => {
            const newLabel = labelInput.value || null;
            const ev = eventSel.value;
            const act = actionSel.value;
            let payloadVal = payloadInput.value || '';
            let payloadObj = { kind: 'const', value: payloadVal };
            if (payloadVal.trim() === '{{source.value}}') payloadObj = { kind: 'sourceValue' };
            else if (payloadVal.includes('{{')) payloadObj = { kind: 'template', value: payloadVal };

            // Update link
            link.event = ev; link.action = act; link.payload = payloadObj; link.label = newLabel;
            this.updateLinksSVG();
            this.updateLinkListUI();
            inspector.remove();
        });
    }

    enableLinkMode(windowId) {
        this.linkMode = true;
        this._linkHandlers = this._linkHandlers || {};
        const svg = document.getElementById(`designer-link-svg-${windowId}`);
        // Show ports for all components and attach mousedown for output ports
        this.designedComponents.forEach(comp => {
            const els = comp.portEls;
            if (!els) return;
            els.input.style.display = 'block';
            els.output.style.display = 'block';

            // Avoid double-binding
            if (this._linkHandlers[comp.id]) return;

            const mousedownHandler = (e) => {
                e.stopPropagation(); e.preventDefault();
                // only start from output
                const port = e.currentTarget;
                if (port.dataset.port !== 'output') return;

                // create temp path
                if (!svg) return;
                const p = document.createElementNS('http://www.w3.org/2000/svg','path');
                p.setAttribute('stroke','#1f8cff'); p.setAttribute('stroke-width','3'); p.setAttribute('fill','none'); p.setAttribute('opacity','0.95');
                svg.appendChild(p);
                this._linking = { fromNodeId: comp.id, fromPort: 'output', tempPath: p };

                const getPortCenter = (portEl) => {
                    const r = portEl.getBoundingClientRect();
                    const svgR = svg.getBoundingClientRect();
                    return { x: r.left + r.width / 2 - svgR.left, y: r.top + r.height / 2 - svgR.top };
                };

                const movefn = (ev) => {
                    const from = getPortCenter(port);
                    const svgRect = svg.getBoundingClientRect();
                    const toX = ev.clientX - svgRect.left;
                    const toY = ev.clientY - svgRect.top;
                    const cx = (from.x + toX) / 2;
                    const d = `M ${from.x} ${from.y} C ${cx} ${from.y} ${cx} ${toY} ${toX} ${toY}`;
                    p.setAttribute('d', d);
                };

                const upfn = (ev) => {
                    document.removeEventListener('mousemove', movefn);
                    document.removeEventListener('mouseup', upfn);
                    const el = document.elementFromPoint(ev.clientX, ev.clientY);
                    // find closest component element
                    const targetCompEl = el && el.closest ? el.closest('.gui-component') : null;
                    if (targetCompEl) {
                        const targetId = targetCompEl.dataset.componentId;
                        if (targetId && targetId !== comp.id) {
                            // choose a sensible default payload: if source is an input-like component, use its value
                            const sourceComp = this.designedComponents.find(d => d.id === comp.id);
                            let defaultPayload = { kind: 'const', value: 'Hello' };
                            if (sourceComp && ['input','sl-input','sl-textarea','select'].includes(sourceComp.type)) {
                                defaultPayload = { kind: 'sourceValue' };
                            }
                            const link = { id: `link_${Date.now()}`, from: { nodeId: comp.id, io: 'output' }, to: { nodeId: targetId, io: 'input' }, event: 'click', action: 'setText', payload: defaultPayload };
                            this.designerLinks.push(link);
                            this.updateLinksSVG();
                            this.updateLinkListUI();
                            // Open inspector right after creation to let user fine-tune
                            this.showLinkInspector(link, ev.clientX, ev.clientY);
                        }
                    }
                    // cleanup temp
                    if (p && p.parentNode) p.remove();
                    this._linking = null;
                };

                document.addEventListener('mousemove', movefn);
                document.addEventListener('mouseup', upfn);
            };

            els.output.addEventListener('mousedown', mousedownHandler);
            this._linkHandlers[comp.id] = mousedownHandler;
        });
    }

    disableLinkMode(windowId) {
        this.linkMode = false;
        // Hide ports and remove handlers
        this.designedComponents.forEach(comp => {
            const els = comp.portEls;
            if (!els) return;
            els.input.style.display = 'none';
            els.output.style.display = 'none';
            const handler = this._linkHandlers && this._linkHandlers[comp.id];
            if (handler) {
                try { els.output.removeEventListener('mousedown', handler); } catch(e){}
                delete this._linkHandlers[comp.id];
            }
        });
        // Remove any temp path
        const svg = document.getElementById(`designer-link-svg-${windowId}`);
        if (svg) { while (svg.firstChild) svg.removeChild(svg.firstChild); }
        this._linking = null;
    }

    updateLinkListUI() {
        const container = document.getElementById(`linkList-${this.windowId}`);
        if (!container) return;
        container.innerHTML = '';
        this.designerLinks.forEach(l => {
            const div = document.createElement('div');
            div.style.cssText = 'padding:6px;border-bottom:1px solid var(--nebula-border);display:flex;align-items:center;justify-content:space-between;';
            const txt = document.createElement('div'); txt.textContent = l.label ? `${l.label} (${l.from.nodeId} → ${l.to.nodeId})` : `${l.from.nodeId} → ${l.to.nodeId}`;
            const del = document.createElement('button'); del.textContent = 'Delete'; del.style.cssText = 'padding:6px 8px;';
            del.addEventListener('click', () => {
                this.designerLinks = this.designerLinks.filter(x => x.id !== l.id);
                this.updateLinksSVG();
                this.updateLinkListUI();
            });
            div.appendChild(txt); div.appendChild(del);
            container.appendChild(div);
        });
    }

    generateVisualGuiMethod() {
        if (this.designedComponents.length === 0) {
            this.showNotification('❌ No components to generate! Add some components to the canvas first.', 'error');
            return;
        }

        // Get current file content for template detection
        const currentCode = this.monacoEditor?.getValue() || '';
        if (!currentCode.trim()) {
            this.showNotification('📝 Please have some code in the editor first.', 'info');
            return;
        }

        // Check if this is a template file by looking at first 8 lines
        const lines = currentCode.split('\n');
        const firstEightLines = lines.slice(0, 8).join('\n');
        const isTemplate = /\/\/ Template:/i.test(firstEightLines);

        console.log('Template detection:', isTemplate);

        if (isTemplate) {
            this.generateForTemplate(currentCode);
        } else {
            this.generateManualPlacement();
        }
    }

    generateForTemplate(currentCode) {
        // Find createContentArea method location
        const lines = currentCode.split('\n');
        let createContentAreaLine = -1;
        let methodStartLine = -1;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.includes('createContentArea()')) {
                createContentAreaLine = i;
                // Find the opening brace (could be same line or next few lines)
                for (let j = i; j < Math.min(i + 5, lines.length); j++) {
                    if (lines[j].includes('{')) {
                        methodStartLine = j;
                        break;
                    }
                }
                break;
            }
        }

        if (createContentAreaLine === -1) {
            this.showNotification('❌ Could not find createContentArea() method in template', 'error');
            return;
        }

        // Generate the visualGui method
        const visualGuiMethod = this.buildVisualGuiMethod();

        // Find where to insert the method (above createContentArea)
        let insertLine = createContentAreaLine;
        // Look backward to find a good insertion point (after previous method)
        for (let i = createContentAreaLine - 1; i >= 0; i--) {
            const line = lines[i].trim();
            if (line === '}' || line.startsWith('/**') || line === '') {
                insertLine = i + 1;
                break;
            }
        }

        // Insert the visualGui method
        const beforeLines = lines.slice(0, insertLine);
        const afterLines = lines.slice(insertLine);
        const newContent = beforeLines.join('\n') + '\n' + visualGuiMethod + '\n\n' + afterLines.join('\n');

        // Now find the createContentArea method again in the new content to add the call
        const updatedLines = newContent.split('\n');
        let contentAreaBodyStart = -1;

        for (let i = 0; i < updatedLines.length; i++) {
            if (updatedLines[i].includes('createContentArea()')) {
                // Find the opening brace and the first line inside
                for (let j = i; j < Math.min(i + 10, updatedLines.length); j++) {
                    if (updatedLines[j].includes('{')) {
                        contentAreaBodyStart = j + 1;
                        break;
                    }
                }
                break;
            }
        }

        if (contentAreaBodyStart !== -1) {
            // Look for existing contentArea creation or good insertion point
            let insertCallLine = contentAreaBodyStart;
            for (let i = contentAreaBodyStart; i < Math.min(contentAreaBodyStart + 20, updatedLines.length); i++) {
                const line = updatedLines[i].trim();
                if (line.includes('contentArea') && line.includes('createElement')) {
                    insertCallLine = i + 1;
                    break;
                } else if (line.includes('innerHTML') || line.includes('appendChild')) {
                    insertCallLine = i;
                    break;
                }
            }

            // Add the visualGui call
            const guiCall = `
        // Add visual GUI components
        const visualGuiContainer = this.visualGui();
        contentArea.appendChild(visualGuiContainer);`;

            const finalBeforeLines = updatedLines.slice(0, insertCallLine);
            const finalAfterLines = updatedLines.slice(insertCallLine);
            const finalContent = finalBeforeLines.join('\n') + guiCall + '\n' + finalAfterLines.join('\n');

            // Replace all content in editor
            if (this.monacoEditor) {
                this.monacoEditor.setValue(finalContent);
                this.showNotification('✅ Template auto-integrated! visualGui() method added and called from createContentArea()', 'success');
                
                // Close designer
                const designer = document.getElementById(`gui-designer-${this.windowId}`);
                designer?.remove();
            }
        } else {
            this.showNotification('❌ Could not find insertion point in createContentArea method', 'error');
        }
    }

    generateManualPlacement() {
        // For non-template files, just insert at cursor like before
        const methodCode = this.buildVisualGuiMethod();

        if (this.monacoEditor) {
            const position = this.monacoEditor.getPosition();
            this.monacoEditor.executeEdits('gui-designer', [{
                range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
                text: methodCode
            }]);
            
            this.showNotification('✅ visualGui() method generated! Add call manually where needed.', 'success');
            
            // Close designer
            const designer = document.getElementById(`gui-designer-${this.windowId}`);
            designer?.remove();
        }
    }

    buildVisualGuiMethod() {
        // Generate the complete visualGui() method with proper nesting
        // Persist designer metadata as a JSON comment so designs are round-trippable
        const meta = {
            nodes: (this.designedComponents || []).map(c => ({ id: c.id, type: c.type, position: c.position, properties: c.properties, parent: c.parent, children: c.children })),
            // include label in link meta so labels round-trip with the generated code
            links: (this.designerLinks || []).map(l => ({ id: l.id, from: l.from, to: l.to, event: l.event, action: l.action, payload: l.payload, label: l.label, midpoints: l.midpoints || [] }))
        };
        const metaJson = JSON.stringify(meta, null, 2).replace(/\*\//g, '*\\/');
        let methodCode = '/* __VISUAL_GUI_META__' + "\n" + metaJson + "\n*/\n" + `    /**
     * Visual GUI Method - Generated by NebulaDesktop GUI Designer
     * Call this method from createContentArea() or anywhere you need the GUI
     */
    visualGui() {
        const container = document.createElement('div');
        container.className = 'visual-gui-container';
        container.style.cssText = ` + '`' + `
            position: relative;
            width: 100%;
            height: 100%;
            background: transparent;
            overflow: visible;
        ` + '`' + `;

`;

        // First, create all components
        const componentVars = new Map();
        this.designedComponents.forEach((comp, index) => {
            const varName = `${comp.type}${index + 1}`;
            componentVars.set(comp.id, varName);
            
            methodCode += `        // ${comp.type.charAt(0).toUpperCase() + comp.type.slice(1)} Component\n`;
            methodCode += `        const ${varName} = document.createElement('${this.getElementTag(comp.type)}');\n`;
            
            // Add properties based on component type
            methodCode += this.generateComponentProperties(comp, varName);
            
            // Add styling
            methodCode += this.generateComponentStyling(comp, varName);
            
            methodCode += '\n';
        });

        // Then, build the hierarchy (containers first, then children)
        methodCode += `        // Build component hierarchy\n`;
        
        // Add top-level components (no parent) to main container
        const topLevelComponents = this.designedComponents.filter(comp => !comp.parent);
        topLevelComponents.forEach(comp => {
            const varName = componentVars.get(comp.id);
            methodCode += `        container.appendChild(${varName});\n`;
        });

        // Add child components to their containers
        const containers = this.designedComponents.filter(comp => comp.type === 'div');
        containers.forEach(containerComp => {
            if (containerComp.children && containerComp.children.length > 0) {
                const containerVar = componentVars.get(containerComp.id);
                methodCode += `\n        // Add children to ${containerVar}\n`;
                
                containerComp.children.forEach(childId => {
                    const childVar = componentVars.get(childId);
                    if (childVar) {
                        methodCode += `        ${containerVar}.appendChild(${childVar});\n`;
                    }
                });
            }
        });

        // Generate wiring code from designerLinks (if any)
        if (this.designerLinks && this.designerLinks.length > 0) {
            methodCode += '\n        // Wiring generated from Designer Links\n';
            this.designerLinks.forEach((link, idx) => {
                const fromVar = componentVars.get(link.from.nodeId) || `/*missing:${link.from.nodeId}*/null`;
                const toVar = componentVars.get(link.to.nodeId) || `/*missing:${link.to.nodeId}*/null`;
                const event = link.event || (link.from && link.from.io === 'output' ? 'click' : 'input');
                const action = (link.action || 'setText');
                // payload handling
                let payloadCode = 'undefined';
                if (link.payload) {
                    if (link.payload.kind === 'const') payloadCode = JSON.stringify(link.payload.value);
                    else if (link.payload.kind === 'sourceValue') payloadCode = `${fromVar}.value`;
                    else if (link.payload.kind === 'template') {
                        const t = String(link.payload.value || '').replace(/{{\s*source.value\s*}}/g, `' + ${fromVar}.value + '`).replace(/'/g, "\\'");
                        payloadCode = `'${t}'`;
                    }
                }

                // Build action code
                let actionSnippet = `// TODO: unsupported action ${action}`;
                if (action === 'setText') actionSnippet = `${toVar}.textContent = ${payloadCode};`;
                if (action === 'setValue') actionSnippet = `${toVar}.value = ${payloadCode};`;
                if (action === 'openDialog') actionSnippet = `try { ${toVar}.show(); } catch (e) { ${toVar}.setAttribute('open',''); }`;
                if (action === 'showToast') actionSnippet = `${toVar}.textContent = ${payloadCode}; try { ${toVar}.show(); } catch(e) { /* toast may be non-sl */ }`;

                // Guarded listener: avoid immediate re-entrancy by using a short busy flag
                const guardName = `guard_${idx}`;
                methodCode += `        try { (function(){ var ${guardName} = false; try { ${fromVar}.addEventListener('${event}', function() { if (${guardName}) return; ${guardName} = true; try { ${actionSnippet} } catch(e) { console.error('Link action failed', e); } setTimeout(function(){ ${guardName} = false; }, 30); }); } catch(e){} })(); } catch(e) { /* missing element for link ${link.id} */ }\n`;
            });
        }

        methodCode += `\n        return container;\n    }`;

        return methodCode;
    }

    // Parse embedded visual GUI metadata from generated code
    parseVisualGuiMeta(code) {
        if (!code || typeof code !== 'string') return null;
        const marker = '__VISUAL_GUI_META__';
        const start = code.indexOf(marker);
        if (start === -1) return null;

        // Find the opening comment start before marker
        const commentStart = code.lastIndexOf('/*', start);
        const commentEnd = code.indexOf('*/', start);
        if (commentStart === -1 || commentEnd === -1) return null;

        const jsonText = code.substring(commentStart + 2, commentEnd).replace(marker, '').trim();
        try {
            const parsed = JSON.parse(jsonText);
            return parsed;
        } catch (e) {
            console.warn('parseVisualGuiMeta: failed to parse JSON meta', e);
            return null;
        }
    }

    // Load designer metadata from a code string (e.g., editor content) and populate designer state
    loadVisualGuiMetaFromCode(code) {
        const meta = this.parseVisualGuiMeta(code);
        if (!meta) return false;

        // Helper: attempt to infer canvas size from code (createWindow(width,height) or template)
        const inferCanvasSize = (src) => {
            try {
                if (!src || typeof src !== 'string') return { w: 1000, h: 700 };
                // look for createWindow(x, y, ... ) or createWindow({ width: X, height: Y })
                const cwMatch = src.match(/createWindow\s*\(\s*(\d{2,5})\s*,\s*(\d{2,5})/i);
                if (cwMatch) return { w: Number(cwMatch[1]), h: Number(cwMatch[2]) };
                const objMatch = src.match(/createWindow\s*\(\s*\{[^}]*width\s*:\s*(\d{2,5})[^}]*height\s*:\s*(\d{2,5})/i);
                if (objMatch) return { w: Number(objMatch[1]), h: Number(objMatch[2]) };
                // try to parse template file for visual-gui if available
                try {
                    const path = 'src/Templates/NebulaApp-VisualGUI.js';
                    const t = require(path);
                    // if template exports sizes, use them (best-effort)
                    if (t && t.default && t.default.width && t.default.height) return { w: t.default.width, h: t.default.height };
                } catch (e) {
                    // ignore
                }
            } catch (e) {}
            // fallback
            return { w: 1000, h: 700 };
        };

        const canvasSize = inferCanvasSize(code);

        // Map parsed nodes into internal shapes expected by the designer
        this.designedComponents = (meta.nodes || []).map(n => ({
            id: n.id,
            type: n.type,
            position: n.position || { x: 0, y: 0 },
            properties: n.properties || {},
            parent: n.parent || null,
            children: n.children || []
        }));

        this.designerLinks = (meta.links || []).map(l => {
            // migrate midpoints: if midpoints appear to be absolute pixel coords (>1), normalize
            const inMps = l.midpoints || [];
            const migrated = inMps.map(mp => {
                if (!mp || typeof mp.x !== 'number' || typeof mp.y !== 'number') return mp;
                // If values look like pixels (greater than 1 or unusually large), normalize
                if (Math.abs(mp.x) > 1 || Math.abs(mp.y) > 1) {
                    return { x: (mp.x / canvasSize.w), y: (mp.y / canvasSize.h) };
                }
                // already normalized
                return mp;
            });

            return {
                id: l.id,
                from: l.from,
                to: l.to,
                event: l.event,
                action: l.action,
                payload: l.payload,
                // preserve any user-provided label
                label: l.label || null,
                midpoints: migrated
            };
        });

        return true;
    }

    generateComponentProperties(comp, varName) {
        let code = '';
        
        switch (comp.type) {
            case 'button':
                code += `        ${varName}.textContent = '${comp.properties.text || 'Button'}';\n`;
                code += `        ${varName}.addEventListener('click', () => {\n`;
                code += `            console.log('${comp.properties.text || 'Button'} clicked');\n`;
                code += `            // TODO: Add your click functionality here\n`;
                code += `        });\n`;
                break;
                
            case 'input':
                code += `        ${varName}.type = 'text';\n`;
                code += `        ${varName}.placeholder = '${comp.properties.placeholder || 'Enter text'}';\n`;
                break;
                
            case 'label':
                code += `        ${varName}.textContent = '${comp.properties.text || 'Label Text'}';\n`;
                break;
                
            case 'select':
                const options = comp.properties.options || ['Option 1', 'Option 2'];
                options.forEach(option => {
                    code += `        ${varName}.innerHTML += '<option value="${option}">${option}</option>';\n`;
                });
                break;
                
            case 'checkbox':
                code += `        ${varName}.innerHTML = \`
            <input type="checkbox" id="${varName}_input"> 
            <label for="${varName}_input">${comp.properties.text || 'Checkbox'}</label>
        \`;\n`;
                break;
                
            case 'div':
                // Container doesn't need special properties
                break;
        }
        
        return code;
    }

    generateComponentStyling(comp, varName) {
        let code = `        ${varName}.style.cssText = \`\n            position: ${comp.parent ? 'absolute' : 'absolute'};\n`;
        
        // Position
        code += `            left: ${comp.position.x}px;\n`;
        code += `            top: ${comp.position.y}px;\n`;

        // Component-specific properties
        Object.entries(comp.properties).forEach(([key, value]) => {
            if (key === 'backgroundColor') code += `            background-color: ${value};\n`;
            else if (key === 'color') code += `            color: ${value};\n`;
            else if (key === 'width') code += `            width: ${value};\n`;
            else if (key === 'height') code += `            height: ${value};\n`;
            else if (key === 'fontSize') code += `            font-size: ${value};\n`;
            else if (key === 'padding') code += `            padding: ${value};\n`;
        });

        // Default styling based on component type
        switch (comp.type) {
            case 'button':
                code += `            border: none;\n`;
                code += `            border-radius: 4px;\n`;
                code += `            cursor: pointer;\n`;
                code += `            font-weight: 500;\n`;
                break;
                
            case 'input':
                code += `            border: 1px solid #ccc;\n`;
                code += `            border-radius: 4px;\n`;
                code += `            padding: 8px;\n`;
                break;
                
            case 'div':
                code += `            border: 2px dashed #ccc;\n`;
                code += `            background: rgba(0,0,0,0.02);\n`;
                code += `            min-width: 150px;\n`;
                code += `            min-height: 80px;\n`;
                break;
        }

        code += `        \`;\n`;
        return code;
    }

    getElementTag(type) {
        const tagMap = {
            'button': 'button',
            'input': 'input',
            'label': 'div',
            'select': 'select',
            'checkbox': 'div',
            'div': 'div'
        };
        return tagMap[type] || 'div';
    }

    async analyzeGuiPlacementWithAI() {
        if (this.designedComponents.length === 0) {
            this.showNotification('❌ No GUI components to analyze! Design something first.', 'error');
            return;
        }

        // Check if LM Studio is available
        if (this.currentAIService !== 'lmstudio') {
            this.showNotification('🤖 Please switch to LM Studio for AI placement analysis', 'info');
            return;
        }

        // Get current file content
        const currentCode = this.monacoEditor?.getValue() || '';
        const fileName = this.openFiles.get(this.activeFileId)?.name || 'untitled.js';

        if (!currentCode.trim()) {
            this.showNotification('📝 Please have some code in the editor so AI can suggest where to place the visualGui() method', 'info');
            return;
        }

        // Show loading state
        const aiBtn = document.getElementById(`aiAnalyzeGui-${this.windowId}`);
        const originalText = aiBtn ? aiBtn.innerHTML : '';
        if (aiBtn) {
            aiBtn.innerHTML = '⏳ Analyzing...';
            aiBtn.disabled = true;
        }

        try {
            // Describe the designed GUI
            const guiDescription = this.designedComponents.map(comp => {
                return `- ${comp.type}: "${comp.properties.text || comp.type}" at position (${comp.position.x}, ${comp.position.y})`;
            }).join('\n');

            // Create prompt for AI analysis
            const prompt = `
I've designed a GUI with these components using a visual designer:

DESIGNED GUI COMPONENTS:
${guiDescription}

This generates a visualGui() method that creates these components. I need your help to understand where to place and call this method in my existing code.

CURRENT CODE (${fileName}):
\`\`\`javascript
${currentCode}
\`\`\`

Please analyze my code and suggest:

1. **WHERE** should I place the visualGui() method? (Which class, after which method, etc.)

2. **HOW** should I call visualGui()? Looking at patterns like:
   - If there's a createContentArea() method, should I call it from there?
   - If this is a template, where does the GUI fit best?
   - What's the best integration point?

3. **WHY** that location makes sense for the code structure

4. **INTEGRATION** tips - any modifications needed to make it work well

Focus on:
- Existing code patterns and architecture
- Best practices for code organization  
- How the GUI fits into the overall application structure
- Template patterns (like NebulaApp templates)

Provide specific, actionable advice for integrating the visualGui() method.`;

            // Add this as a message to the AI chat instead of showing modal
            this.addChatMessage(`🎨 **GUI Placement Analysis Request**\n\nAnalyzing designed GUI components and suggesting optimal placement in code...`, 'user');

            // Send to LM Studio (this will add response to chat)
            await this.sendToLMStudio(prompt, 'gui-placement');

        } catch (error) {
            console.error('AI GUI analysis error:', error);
            this.showNotification('❌ AI analysis failed. Try again.', 'error');
        } finally {
            // Restore button state
            if (aiBtn) {
                aiBtn.innerHTML = originalText;
                aiBtn.disabled = false;
            }
        }
    }

    generateButtonCode() {
        const buttonText = document.getElementById(`buttonText-${this.windowId}`)?.value || 'Click Me';
        const buttonColor = document.getElementById(`buttonColor-${this.windowId}`)?.value || '#667eea';
        const buttonSize = document.getElementById(`buttonSize-${this.windowId}`)?.value || 'medium';

        // Size configurations
        const sizeMap = {
            small: { padding: '6px 12px', fontSize: '12px' },
            medium: { padding: '8px 16px', fontSize: '13px' },
            large: { padding: '12px 24px', fontSize: '14px' }
        };

        const sizeConfig = sizeMap[buttonSize] || sizeMap.medium;

        // Generate clean button code
        const buttonCode = `
        // Button created with Design Mode
        const button = document.createElement('button');
        button.textContent = '${buttonText}';
        button.style.cssText = \`
            background: ${buttonColor};
            color: white;
            border: none;
            padding: ${sizeConfig.padding};
            border-radius: 4px;
            cursor: pointer;
            font-size: ${sizeConfig.fontSize};
            font-weight: 500;
            transition: opacity 0.2s ease;
        \`;
        
        // Add hover effect
        button.addEventListener('mouseenter', () => {
            button.style.opacity = '0.8';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.opacity = '1';
        });
        
        // Add click handler
        button.addEventListener('click', () => {
            console.log('Button clicked: ${buttonText}');
            // TODO: Add your click functionality here
        });
        
        container.appendChild(button);`.trim();

        // Insert the code into the active editor
        if (this.monacoEditor) {
            const position = this.monacoEditor.getPosition();
            this.monacoEditor.executeEdits('design-mode', [{
                range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
                text: buttonCode
            }]);
            
            console.log('Button code inserted at cursor position');
            
            // Optional: Show notification
            this.showNotification('✅ Button code inserted!', 'success');
        }
    }

    async generateButtonCodeWithAI() {
        const buttonText = document.getElementById(`buttonText-${this.windowId}`)?.value || 'Click Me';
        const buttonColor = document.getElementById(`buttonColor-${this.windowId}`)?.value || '#667eea';
        const buttonSize = document.getElementById(`buttonSize-${this.windowId}`)?.value || 'medium';

        // Get current file content for AI analysis
        const currentCode = this.monacoEditor?.getValue() || '';
        const fileName = this.openFiles.get(this.activeFileId)?.name || 'untitled.js';

        if (!currentCode.trim()) {
            this.showNotification('📝 Please add some code first so AI can suggest placement', 'info');
            return;
        }

        // Check if LM Studio is available
        if (this.currentAIService !== 'lmstudio') {
            this.showNotification('🤖 Please switch to LM Studio for AI placement suggestions', 'info');
            return;
        }

        // Show loading state
        const aiBtn = document.getElementById(`aiPlacementBtn-${this.windowId}`);
        const originalText = aiBtn ? aiBtn.innerHTML : '';
        if (aiBtn) {
            aiBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px;">hourglass_empty</span> Analyzing...';
            aiBtn.disabled = true;
        }

        try {
            // Create prompt for AI analysis
            const prompt = `
I'm building a "${buttonText}" button in my code. Please analyze my current code and suggest the best place to insert this button.

CURRENT CODE (${fileName}):
\`\`\`javascript
${currentCode}
\`\`\`

BUTTON DESCRIPTION:
- Text: "${buttonText}"
- Color: ${buttonColor}
- Size: ${buttonSize}
- Purpose: ${buttonText.toLowerCase().includes('submit') ? 'Form submission' : 
                 buttonText.toLowerCase().includes('save') ? 'Save data' :
                 buttonText.toLowerCase().includes('cancel') ? 'Cancel action' :
                 buttonText.toLowerCase().includes('delete') ? 'Delete action' :
                 buttonText.toLowerCase().includes('add') ? 'Add new item' :
                 'General action button'}

Please analyze the code structure and provide:

1. **BEST PLACEMENT LOCATION**: Where should this button go? Be specific about:
   - After which existing line or element
   - Inside which container/function
   - Line number if possible

2. **REASONING**: Why this location makes sense from UX/UI perspective

3. **INTEGRATION SUGGESTIONS**: Any modifications needed to integrate properly

4. **CODE CONTEXT**: What other elements should this button be near

Focus on:
- Existing UI patterns in the code
- Logical grouping with related elements  
- User workflow and accessibility
- Code organization

Provide specific, actionable placement advice with technical details.`;

            // Send to LM Studio
            await this.sendToLMStudio(prompt, 'ai-placement');

        } catch (error) {
            console.error('AI placement error:', error);
            this.showNotification('❌ AI analysis failed. Try manual placement.', 'error');
        } finally {
            // Restore button state
            if (aiBtn) {
                aiBtn.innerHTML = originalText;
                aiBtn.disabled = false;
            }
        }
    }

    showNotification(message, type = 'info') {
        // Simple notification system
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'var(--nebula-accent)' : 'var(--nebula-primary)'};
            color: white;
            padding: 12px 16px;
            border-radius: 6px;
            font-size: 13px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Export for use in NebulaDesktop (original)
window.NebulaCodeAssistant = NebulaCodeAssistant;

// Create and expose a global instance for console commands
const myCodeAssistantInstance = new NebulaCodeAssistant();
window.codeAssistant = myCodeAssistantInstance;