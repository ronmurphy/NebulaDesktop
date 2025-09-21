// NebulaAssistant.js - Full Height AI Assistant Panel with Pin & Full View
class NebulaAssistant {
    constructor() {
        this.panel = null;
        this.webview = null;
        this.isOpen = false;
        this.isPinned = false;
        this.isFullView = false;
        this.currentAI = 'claude';
        this.isLoading = false;

        // Configuration
        this.config = {
            isPinned: false,
            isFullView: false,
            fullViewSize: '33', // Default to 33% width
            currentAI: 'claude'
        };

        // Persisted user-defined services (APIs or custom web UIs)
        this.savedServices = {};

        // Full view size options
        this.fullViewSizes = {
            '25': { class: 'full-view-25', label: '25%', width: '25vw' },
            '33': { class: 'full-view-33', label: '33%', width: '33.333vw' },
            '50': { class: 'full-view-50', label: '50%', width: '50vw' }
        };

        // AI Services configuration
        this.aiServices = {
            claude: {
                name: 'Claude',
                url: 'https://claude.ai',
                icon: '🧠'
            },
            chatgpt: {
                name: 'ChatGPT',
                url: 'https://chat.openai.com',
                icon: '💬'
            },
            manus: {
                name: 'Manus',
                url: 'https://manus.im',
                icon: '🤖'
            },
            perplexity: {
                name: 'Perplexity',
                url: 'https://perplexity.ai',
                icon: '🔍'
            },
            copilot: {
                name: 'Copilot',
                url: 'https://copilot.microsoft.com',
                icon: '🚀'
            },
            gemini: {
                name: 'Gemini',
                url: 'https://gemini.google.com',
                icon: '💎'
            },
            bolt: {
                name: 'Bolt',
                url: 'https://bolt.new',
                icon: '⚡'
            },
            poe: {
                name: 'Poe',
                icon: '🎭',
                url: 'https://poe.com',
                description: 'Quora Poe Multi-AI'
            }
        };

        this.init();
    }

    /**
     * Initialize the assistant
     */
    init() {
        this.loadConfig();
        this.loadSavedServices();
        this.createAssistantButton();
        this.createAssistantPanel();
        this.setupEventListeners();
        this.applyConfig();

        console.log('NebulaAssistant initialized with full height design');
    }

    /**
     * Create the assistant button in the taskbar
     */
    createAssistantButton() {
        const taskbar = document.querySelector('.taskbar');
        const startButton = document.querySelector('.start-button');

        if (!taskbar || !startButton) {
            console.error('Could not find taskbar or start button');
            return;
        }

        const assistantButton = document.createElement('button');
        assistantButton.className = 'assistant-button';
        assistantButton.id = 'assistantBtn';
        assistantButton.innerHTML = `
            <span class="material-symbols-outlined icon">smart_toy</span>
            <span>AI</span>
        `;
        assistantButton.title = 'AI Assistant (Alt+A)';

        // Insert after the start button
        startButton.insertAdjacentElement('afterend', assistantButton);

        console.log('Assistant button created');
    }

    /**
     * Create the full-height assistant panel
     */
    createAssistantPanel() {
        this.panel = document.createElement('div');
        this.panel.className = 'assistant-panel';
        this.panel.id = 'assistantPanel';

        this.panel.innerHTML = `
            <div class="assistant-header">
                <div class="assistant-title-row">
<div class="assistant-title">
    <span class="material-symbols-outlined icon">smart_toy</span>
AI Assistant
<!-- Tool buttons -->
<div class="assistant-tools">
    <button class="tool-btn" id="artToolBtn" title="Open Art Assistant">
        🎨
    </button>
    <button class="tool-btn" id="codeToolBtn" title="Open Code Assistant">  
        📝
    </button>
</div>
</div>

                    <div class="assistant-controls">
                        <button class="control-btn pin-btn" id="pinBtn" title="Pin panel">
                            <span class="material-symbols-outlined">push_pin</span>
                        </button>
                        <button class="control-btn full-view-btn" id="fullViewBtn" title="Full view (33%)">
                            <span class="material-symbols-outlined">open_in_full</span>
                        </button>
                    </div>
                </div>
                <select class="ai-selector" id="aiSelector">
                    ${Object.entries(this.aiServices).map(([key, service]) => `
                        <option value="${key}" ${key === this.currentAI ? 'selected' : ''}>
                            ${service.icon} ${service.name}
                        </option>
                    `).join('')}
                </select>

            </div>


            <div class="assistant-content" id="assistantContent">
                <div class="assistant-loading" id="assistantLoading">
                    <span class="material-symbols-outlined icon">autorenew</span>
                    Loading AI service...
                </div>
                <!-- Webview will be added here -->
            </div>
            <div class="assistant-footer">
                <div class="status" id="assistantStatus">Ready</div>
                <div class="controls">
                    <button class="footer-btn" id="refreshAI" title="Refresh">
                        <span class="material-symbols-outlined">refresh</span>
                    </button>
                    <button class="footer-btn" id="newChat" title="New Chat">
                        <span class="material-symbols-outlined">add</span>
                    </button>
                    <button class="footer-btn" id="settingsBtn" title="Settings">
                        <span class="material-symbols-outlined">settings</span>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(this.panel);
        console.log('Full-height assistant panel created');
    }

    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // Assistant button click
        const assistantBtn = document.getElementById('assistantBtn');
        assistantBtn?.addEventListener('click', () => {
            this.togglePanel();
        });

        // Tool buttons (Art and Code Assistants)
        const artToolBtn = document.getElementById('artToolBtn');
        artToolBtn?.addEventListener('click', () => {
            this.launchArtAssistant();
        });

        const codeToolBtn = document.getElementById('codeToolBtn');
        codeToolBtn?.addEventListener('click', () => {
            this.launchCodeAssistant();
        });

        // Pin button
        const pinBtn = document.getElementById('pinBtn');
        pinBtn?.addEventListener('click', () => {
            this.togglePin();
        });

        // Full view button
        const fullViewBtn = document.getElementById('fullViewBtn');
        fullViewBtn?.addEventListener('click', () => {
            this.toggleFullView();
        });

        // AI service selector
        const aiSelector = document.getElementById('aiSelector');
        aiSelector?.addEventListener('change', (e) => {
            this.switchAI(e.target.value);
        });

        // Footer controls
        const refreshBtn = document.getElementById('refreshAI');
        refreshBtn?.addEventListener('click', () => {
            this.refreshWebview();
        });

        const newChatBtn = document.getElementById('newChat');
        newChatBtn?.addEventListener('click', () => {
            this.startNewChat();
        });

        const settingsBtn = document.getElementById('settingsBtn');
        settingsBtn?.addEventListener('click', () => {
            this.showSettings();
        });

        // Click outside to close panel (only if not pinned)
        document.addEventListener('click', (e) => {
            if (this.isPinned) return; // Don't close if pinned

            if (this.panel && !this.panel.contains(e.target) &&
                !e.target.closest('#assistantBtn') &&
                this.isOpen) {
                this.hidePanel();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Alt + A - Toggle AI Assistant
            if (e.altKey && e.key === 'a') {
                e.preventDefault();
                this.togglePanel();
            }

            // Escape - Close panel (only if not pinned)
            if (e.key === 'Escape' && this.isOpen && !this.isPinned) {
                this.hidePanel();
            }

            // Ctrl + Shift + P - Toggle Pin
            if (e.ctrlKey && e.shiftKey && e.key === 'P' && this.isOpen) {
                e.preventDefault();
                this.togglePin();
            }

            // Ctrl + Shift + F - Toggle Full View
            if (e.ctrlKey && e.shiftKey && e.key === 'F' && this.isOpen) {
                e.preventDefault();
                this.toggleFullView();
            }
        });

        console.log('Assistant event listeners set up');
    }

    /**
     * Launch Art Assistant
     */
    launchArtAssistant() {
        try {
            const artAssistant = new NebulaArtAssistant();
            this.updateStatus('Art Assistant launched');
            console.log('Art Assistant launched successfully');
        } catch (error) {
            console.error('Failed to launch Art Assistant:', error);
            this.updateStatus('Art Assistant failed to launch');
        }
    }

    /**
     * Launch Code Assistant  
     */
    launchCodeAssistant() {
        try {
            const codeAssistant = new NebulaCodeAssistant();
            this.updateStatus('Code Assistant launched');
            console.log('Code Assistant launched successfully');
        } catch (error) {
            console.error('Failed to launch Code Assistant:', error);
            this.updateStatus('Code Assistant failed to launch');
        }
    }

    /**
     * Toggle the assistant panel visibility
     */
    togglePanel() {
        if (this.isOpen) {
            this.hidePanel();
        } else {
            this.showPanel();
        }
    }

    /**
     * Show the assistant panel
     */
    showPanel() {
        if (!this.panel) return;

        // Hide launcher if it's open (unless pinned)
        if (!this.isPinned) {
            const launcher = document.querySelector('.launcher');
            if (launcher && !launcher.classList.contains('hidden')) {
                launcher.classList.add('hidden');
            }
        }

        // Show panel
        this.panel.classList.add('visible');
        this.isOpen = true;

        // Update button state
        const assistantBtn = document.getElementById('assistantBtn');
        if (assistantBtn) {
            assistantBtn.classList.add('active');
        }

        // Apply desktop adjustments if pinned
        this.updateDesktopLayout();

        // Load webview if not already loaded
        if (!this.webview) {
            this.createWebview();
        }

        this.updateStatus('Active');
        console.log('Assistant panel shown');
    }

    /**
     * Hide the assistant panel
     */
    hidePanel() {
        if (!this.panel || this.isPinned) return; // Can't hide if pinned

        this.panel.classList.remove('visible');
        this.isOpen = false;

        // Update button state
        const assistantBtn = document.getElementById('assistantBtn');
        if (assistantBtn) {
            assistantBtn.classList.remove('active');
        }

        // Remove desktop adjustments
        this.updateDesktopLayout();

        this.updateStatus('Ready');
        console.log('Assistant panel hidden');
    }

    /**
     * Toggle pin state
     */
    togglePin() {
        this.isPinned = !this.isPinned;

        // Update UI
        const pinBtn = document.getElementById('pinBtn');
        if (pinBtn) {
            pinBtn.classList.toggle('active', this.isPinned);
            pinBtn.title = this.isPinned ? 'Unpin panel' : 'Pin panel';
        }

        // Update panel classes
        this.panel.classList.toggle('pinned', this.isPinned);

        // Update desktop layout
        this.updateDesktopLayout();

        // Save config
        this.config.isPinned = this.isPinned;
        this.saveConfig();

        this.updateStatus(this.isPinned ? 'Pinned' : 'Active');
        console.log(`Assistant panel ${this.isPinned ? 'pinned' : 'unpinned'}`);
    }

    /**
     * Toggle full view mode
     */
    toggleFullView() {
        this.isFullView = !this.isFullView;

        // Update UI
        const fullViewBtn = document.getElementById('fullViewBtn');
        if (fullViewBtn) {
            fullViewBtn.classList.toggle('active', this.isFullView);
            const sizeInfo = this.fullViewSizes[this.config.fullViewSize];
            fullViewBtn.title = this.isFullView ?
                `Normal view` :
                `Full view (${sizeInfo.label})`;
        }

        // Apply/remove full view class
        Object.values(this.fullViewSizes).forEach(size => {
            this.panel.classList.remove(size.class);
        });

        if (this.isFullView) {
            const sizeClass = this.fullViewSizes[this.config.fullViewSize].class;
            this.panel.classList.add(sizeClass);
        }

        // Update desktop layout
        this.updateDesktopLayout();

        // Save config
        this.config.isFullView = this.isFullView;
        this.saveConfig();

        console.log(`Assistant panel ${this.isFullView ? 'expanded' : 'normal'} view`);
    }

    /**
     * Update desktop layout (CSS handles the shifting, no WindowManager involvement)
     */
    updateDesktopLayout() {
        const desktop = document.querySelector('.desktop');

        if (!desktop) return;

        // Remove all classes first
        desktop.classList.remove('assistant-open', 'pinned', 'full-view-25', 'full-view-33', 'full-view-50');

        if (this.isOpen && this.isPinned) {
            desktop.classList.add('assistant-open', 'pinned');

            if (this.isFullView) {
                const sizeClass = this.fullViewSizes[this.config.fullViewSize].class;
                desktop.classList.add(sizeClass);
            }

            console.log('Desktop shifted by CSS - WindowManager uses normal maximize');
        } else {
            console.log('Desktop restored - WindowManager uses full screen');
        }
    }

    /**
     * Notify WindowManager about assistant panel state for proper window management
     */
    notifyWindowManagerOfPanelState() {
        if (!window.windowManager) return;

        let panelWidth = 420; // Default width in pixels

        if (this.isFullView) {
            // Calculate pixel width from viewport percentage
            const viewportWidth = window.innerWidth;
            const percentage = parseInt(this.config.fullViewSize);
            panelWidth = Math.floor(viewportWidth * (percentage / 100));

            // Ensure minimum width
            panelWidth = Math.max(400, panelWidth);
        }

        console.log(`Assistant panel width: ${panelWidth}px out of ${window.innerWidth}px total`);

        // Update WindowManager's available area
        window.windowManager.updateAvailableArea(panelWidth, 0, 0, 50);

        // Reposition any windows that are now off-screen
        window.windowManager.repositionWindowsForDesktopResize(panelWidth);

        console.log(`Notified WindowManager: Panel width = ${panelWidth}px`);
    }

    /**
     * Create the webview for the current AI service
     */
    createWebview() {
        const content = document.getElementById('assistantContent');
        const loading = document.getElementById('assistantLoading');

        if (!content) return;

        // Show loading
        this.showLoading();

        // Remove existing webview
        if (this.webview) {
            this.webview.remove();
            this.webview = null;
        }

        // Create new webview with attributes suitable for AI web services
        this.webview = document.createElement('webview');
        this.webview.className = 'assistant-webview';
        this.webview.id = 'assistantWebview';

        // Use a persistent partition so logins/cookies persist across reloads
        this.webview.setAttribute('partition', 'persist:nebula-assistant');

        // Allow popups for login flows (restricting to AI services later)
        this.webview.setAttribute('allowpopups', 'true');

        // Preload script for controlled messaging (path relative to built assets)
        this.webview.setAttribute('preload', 'src/preload.js');

        const currentService = this.aiServices[this.currentAI];
        this.webview.src = currentService.url;

        // Set a conservative user agent to avoid some blocks (keeps desktop UA)
        try {
            const ua = navigator.userAgent + ' NebulaAssistant/1.0';
            this.webview.setAttribute('useragent', ua);
        } catch (e) {
            console.warn('Could not set webview useragent:', e);
        }

        // Set up webview event listeners
        this.setupWebviewListeners();

        // Add to DOM
        content.appendChild(this.webview);

        console.log(`Created webview for ${currentService.name} (src=${currentService.url})`);
    }

    /**
     * Set up webview event listeners
     */
    setupWebviewListeners() {
        if (!this.webview) return;

        this.webview.addEventListener('dom-ready', () => {
            this.hideLoading();
            this.updateStatus(`Connected to ${this.aiServices[this.currentAI].name}`);
            console.log('Webview loaded');
        });

        this.webview.addEventListener('did-start-loading', () => {
            this.showLoading();
            this.updateStatus('Loading...');
        });

        this.webview.addEventListener('did-stop-loading', () => {
            this.hideLoading();
            this.updateStatus(`Connected to ${this.aiServices[this.currentAI].name}`);
        });

        this.webview.addEventListener('did-fail-load', (e) => {
            this.hideLoading();
            const errMsg = `Failed to load (${e.errorCode}): ${e.errorDescription} -> ${e.validatedURL || e.url}`;
            this.updateStatus('Failed to load');
            console.error('Webview failed to load:', errMsg, e);

            // If the load failed due to frame embedding or CSP, offer to open externally
            if (e.errorDescription && /blocked|frame|x-frame|refused/i.test(e.errorDescription)) {
                const openExternal = confirm(`${errMsg}\n\nOpen in external browser instead?`);
                if (openExternal) {
                    const svc = this.aiServices[this.currentAI];
                    window.open(svc.url, '_blank');
                }
            }
        });

        this.webview.addEventListener('page-title-updated', (e) => {
            console.log('Page title updated:', e.title);
        });

        // Handle new windows
        this.webview.addEventListener('new-window', (e) => {
            e.preventDefault();
            console.log('New window requested:', e.url);
            // Could integrate with Nebula browser here
        });
    }

    /**
     * Switch to a different AI service
     */
    switchAI(aiKey) {
        if (!this.aiServices[aiKey]) {
            console.error('Unknown AI service:', aiKey);
            return;
        }

        this.currentAI = aiKey;
        this.config.currentAI = aiKey;
        this.saveConfig();

        // Recreate webview with new service
        if (this.isOpen) {
            this.createWebview();
        }

        console.log(`Switched to ${this.aiServices[aiKey].name}`);
    }

    /**
     * Show settings modal (placeholder for now)
     */
    showSettings() {
        // Build a more complete settings modal that includes saved services
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
        `;

        // Built-in services list
        const builtIn = Object.entries(this.aiServices).map(([key, s]) => `
            <div class="svc-item" data-key="${key}" style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--nebula-border);">
                <div><strong>${s.icon} ${s.name}</strong><div style="font-size:11px;color:var(--nebula-text-secondary);">${s.url || ''}</div></div>
                <div style="display:flex;gap:8px;align-items:center;">
                    <label style="font-size:11px;color:var(--nebula-text-secondary);"><input type="checkbox" data-image-capable="${key}"> Image</label>
                </div>
            </div>
        `).join('');

        // Saved services list
        const savedEntries = Object.entries(this.savedServices).map(([id, s]) => `
            <div class="svc-saved" data-id="${id}" style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--nebula-border);">
                <div><strong>${s.name}</strong><div style="font-size:11px;color:var(--nebula-text-secondary);">${s.url || ''}</div></div>
                <div style="display:flex;gap:8px;align-items:center;">
                    <button class="edit-svc" data-id="${id}">Edit</button>
                    <button class="del-svc" data-id="${id}">Delete</button>
                </div>
            </div>
        `).join('');

        modal.innerHTML = `
            <div style="
                background: var(--nebula-surface);
                border: 1px solid var(--nebula-border);
                border-radius: var(--nebula-radius-lg);
                padding: 16px;
                max-width: 760px;
                width: 95%;
                color: var(--nebula-text-primary);
                display: flex;
                gap: 12px;
            ">
                <div style="flex:1; min-width: 260px;">
                    <h4 style="margin:6px 0 8px 0;">Layout</h4>
                    <label style="display:block;margin-bottom:12px;font-size:13px;color:var(--nebula-text-secondary);">Full View Size:
                        <select id="fullViewSizeSelect" style="width:100%;padding:8px;margin-top:6px;background:var(--nebula-bg-secondary);border:1px solid var(--nebula-border);color:var(--nebula-text-primary);border-radius:4px;">
                            ${Object.entries(this.fullViewSizes).map(([key, size]) => `
                                <option value="${key}" ${key === this.config.fullViewSize ? 'selected' : ''}>${size.label} width</option>
                            `).join('')}
                        </select>
                    </label>
                    <h3 style="margin:0 0 8px 0;">AI Assistant Settings</h3>
                    <div style="margin-bottom:12px; font-size:13px; color:var(--nebula-text-secondary);">Manage built-in and saved AI services. Mark services that can generate images as <strong>Image</strong> to surface them in OLLIE.</div>

                    <div style="margin-top:8px;">
                        <h4 style="margin:6px 0;">Built-in Services</h4>
                        <div style="max-height:220px; overflow:auto; padding-right:8px;">${builtIn}</div>
                    </div>
                </div>

                <div style="flex:1; min-width: 260px;">
                    <h4 style="margin:6px 0;">Saved Services</h4>
                    <div id="savedServicesList" style="max-height:300px; overflow:auto; padding-right:8px;">${savedEntries || '<div style="color:var(--nebula-text-secondary);">No saved services</div>'}</div>
                    <div style="margin-top:12px; display:flex; gap:8px;">
                        <button id="addServiceBtn" style="padding:8px 12px;">Add Service</button>
                        <button id="closeSettingsBtn" style="padding:8px 12px; margin-left:auto;">Close</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Hook up built-in image checkboxes
        modal.querySelectorAll('[data-image-capable]').forEach(chk => {
            const key = chk.getAttribute('data-image-capable');
            // default off; user can add saved services to mark image capable
            chk.checked = false;
            chk.addEventListener('change', (e) => {
                const isOn = e.target.checked;
                // store in savedServices under special key so OLLIE can detect it
                const metaKey = `builtin::${key}`;
                if (isOn) {
                    this.savedServices[metaKey] = { name: this.aiServices[key].name, url: this.aiServices[key].url, imageCapable: true };
                } else {
                    delete this.savedServices[metaKey];
                }
                this.saveSavedServices();
            });
        });

        // Add service button
        modal.querySelector('#addServiceBtn').onclick = () => {
            this.showEditServiceModal(null, modal.querySelector('#savedServicesList'));
        };

        // Close settings
        modal.querySelector('#closeSettingsBtn').onclick = () => {
            const sel = modal.querySelector('#fullViewSizeSelect');
            if (sel) {
                const newSize = sel.value;
                this.config.fullViewSize = newSize;
                this.saveConfig();
                // Update tooltip
                const fullViewBtn = document.getElementById('fullViewBtn');
                if (fullViewBtn && !this.isFullView) {
                    const sizeInfo = this.fullViewSizes[newSize];
                    fullViewBtn.title = `Full view (${sizeInfo.label})`;
                }
                // If currently in full view, apply immediately
                if (this.isFullView) {
                    Object.values(this.fullViewSizes).forEach(size => this.panel.classList.remove(size.class));
                    const sizeClass = this.fullViewSizes[newSize].class;
                    this.panel.classList.add(sizeClass);
                    this.updateDesktopLayout();
                }
            }
            modal.remove();
        };

        // Edit / delete handlers for saved services
        modal.querySelectorAll('.edit-svc').forEach(btn => {
            btn.onclick = (e) => {
                const id = btn.getAttribute('data-id');
                this.showEditServiceModal(id, modal.querySelector('#savedServicesList'));
            };
        });

        modal.querySelectorAll('.del-svc').forEach(btn => {
            btn.onclick = (e) => {
                const id = btn.getAttribute('data-id');
                if (confirm('Delete this saved service?')) {
                    delete this.savedServices[id];
                    this.saveSavedServices();
                    const list = modal.querySelector('#savedServicesList');
                    list.innerHTML = Object.entries(this.savedServices).map(([id, s]) => `
                        <div class="svc-saved" data-id="${id}" style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--nebula-border);">
                            <div><strong>${s.name}</strong><div style="font-size:11px;color:var(--nebula-text-secondary);">${s.url || ''}</div></div>
                            <div style="display:flex;gap:8px;align-items:center;">
                                <button class="edit-svc" data-id="${id}">Edit</button>
                                <button class="del-svc" data-id="${id}">Delete</button>
                            </div>
                        </div>
                    `).join('');
                }
            };
        });

        // Close on background click
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    }

    /**
     * Refresh the current webview
     */
    refreshWebview() {
        if (this.webview && this.webview.reload) {
            this.webview.reload();
            this.updateStatus('Refreshing...');
        } else if (this.webview) {
            this.createWebview();
        }
    }

    /**
     * Start a new chat
     */
    startNewChat() {
        this.refreshWebview();
    }

    /**
     * Show modal to add or edit a saved service
     */
    showEditServiceModal(serviceId = null, insertListElement = null) {
        const isEdit = !!serviceId;
        const svc = isEdit ? this.savedServices[serviceId] : { name: '', url: '', imageCapable: false };

        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top:0; left:0; right:0; bottom:0; display:flex; align-items:center; justify-content:center; background: rgba(0,0,0,0.45); z-index:2100;
        `;

        modal.innerHTML = `
            <div style="background:var(--nebula-surface); padding:16px; border-radius:8px; border:1px solid var(--nebula-border); width:420px; color:var(--nebula-text-primary);">
                <h3 style="margin:0 0 8px 0;">${isEdit ? 'Edit' : 'Add'} Service</h3>
                <label style="display:block;margin-bottom:8px;font-size:13px;color:var(--nebula-text-secondary);">Name<input id="svcName" style="width:100%;padding:8px;margin-top:6px;background:var(--nebula-bg-secondary);border:1px solid var(--nebula-border);color:var(--nebula-text-primary);border-radius:4px;" value="${svc.name||''}"></label>
                <label style="display:block;margin-bottom:8px;font-size:13px;color:var(--nebula-text-secondary);">URL<input id="svcUrl" style="width:100%;padding:8px;margin-top:6px;background:var(--nebula-bg-secondary);border:1px solid var(--nebula-border);color:var(--nebula-text-primary);border-radius:4px;" value="${svc.url||''}"></label>
                <label style="display:block;margin-bottom:8px;font-size:13px;color:var(--nebula-text-secondary);"><input type="checkbox" id="svcImageCap" ${svc.imageCapable ? 'checked' : ''}> Can generate images</label>
                <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px;">
                    <button id="cancelSvc" style="padding:8px 12px;">Cancel</button>
                    <button id="saveSvc" style="padding:8px 12px;background:var(--nebula-primary);color:white;border:none;border-radius:4px;">Save</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('#cancelSvc').onclick = () => modal.remove();
        modal.querySelector('#saveSvc').onclick = () => {
            const name = modal.querySelector('#svcName').value.trim();
            const url = modal.querySelector('#svcUrl').value.trim();
            const imageCap = !!modal.querySelector('#svcImageCap').checked;
            if (!name || !url) return alert('Name and URL are required');

            const id = isEdit ? serviceId : `svc_${Math.random().toString(36).substr(2,9)}`;
            this.savedServices[id] = { name, url, imageCapable: imageCap };
            this.saveSavedServices();

            // Update list if provided
            if (insertListElement) {
                insertListElement.innerHTML = Object.entries(this.savedServices).map(([id, s]) => `
                    <div class="svc-saved" data-id="${id}" style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--nebula-border);">
                        <div><strong>${s.name}</strong><div style="font-size:11px;color:var(--nebula-text-secondary);">${s.url || ''}</div></div>
                        <div style="display:flex;gap:8px;align-items:center;">
                            <button class="edit-svc" data-id="${id}">Edit</button>
                            <button class="del-svc" data-id="${id}">Delete</button>
                        </div>
                    </div>
                `).join('');
            }

            modal.remove();
        };
    }

    /**
     * Show/hide loading state
     */
    showLoading() {
        const loading = document.getElementById('assistantLoading');
        if (loading) loading.style.display = 'block';
        this.isLoading = true;
    }

    hideLoading() {
        const loading = document.getElementById('assistantLoading');
        if (loading) loading.style.display = 'none';
        this.isLoading = false;
    }

    /**
     * Update status text
     */
    updateStatus(status) {
        const statusElement = document.getElementById('assistantStatus');
        if (statusElement) {
            statusElement.textContent = status;
        }
    }

    /**
     * Load configuration from localStorage
     */
    loadConfig() {
        try {
            const saved = localStorage.getItem('nebula-assistant-config');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.config = { ...this.config, ...parsed };
                this.isPinned = this.config.isPinned;
                this.isFullView = this.config.isFullView;
                this.currentAI = this.config.currentAI;
            }
        } catch (error) {
            console.warn('Could not load assistant config:', error);
        }
    }

    /**
     * Load saved AI services from localStorage
     */
    loadSavedServices() {
        try {
            const saved = localStorage.getItem('nebula-assistant-services');
            if (saved) {
                this.savedServices = JSON.parse(saved) || {};
            }
        } catch (e) {
            console.warn('Could not load saved services:', e);
            this.savedServices = {};
        }
    }

    /**
     * Save the user-defined services to localStorage
     */
    saveSavedServices() {
        try {
            localStorage.setItem('nebula-assistant-services', JSON.stringify(this.savedServices));
        } catch (e) {
            console.warn('Could not save services:', e);
        }
    }

    /**
     * Save configuration to localStorage
     */
    saveConfig() {
        try {
            localStorage.setItem('nebula-assistant-config', JSON.stringify(this.config));
        } catch (error) {
            console.warn('Could not save assistant config:', error);
        }
    }

    /**
     * Apply loaded configuration
     */
    applyConfig() {
        // Apply pin state
        if (this.isPinned) {
            const pinBtn = document.getElementById('pinBtn');
            if (pinBtn) {
                pinBtn.classList.add('active');
                pinBtn.title = 'Unpin panel';
            }
            this.panel.classList.add('pinned');
        }

        // Apply full view state
        if (this.isFullView) {
            const fullViewBtn = document.getElementById('fullViewBtn');
            if (fullViewBtn) {
                fullViewBtn.classList.add('active');
                fullViewBtn.title = 'Normal view';
            }

            const sizeClass = this.fullViewSizes[this.config.fullViewSize].class;
            this.panel.classList.add(sizeClass);
        }

        // Update AI selector
        const aiSelector = document.getElementById('aiSelector');
        if (aiSelector) {
            aiSelector.value = this.currentAI;
        }
    }

    /**
     * Clean up resources
     */
    destroy() {
        // Remove desktop layout classes
        const desktop = document.querySelector('.desktop');

        if (desktop) {
            desktop.classList.remove('assistant-open', 'pinned', 'full-view-25', 'full-view-33', 'full-view-50');
        }

        // Remove webview
        if (this.webview) {
            this.webview.remove();
            this.webview = null;
        }

        // Remove panel
        if (this.panel) {
            this.panel.remove();
            this.panel = null;
        }

        // Remove button
        const assistantBtn = document.getElementById('assistantBtn');
        if (assistantBtn) {
            assistantBtn.remove();
        }

        console.log('NebulaAssistant destroyed');
    }
}

// Make NebulaAssistant available globally
window.NebulaAssistant = NebulaAssistant;