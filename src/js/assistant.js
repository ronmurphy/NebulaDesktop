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
        // Listen for requests from webviews (test webview) asking the host to proxy an online generation
        window.addEventListener('message', async (e) => {
            try {
                const msg = e.data;
                if (!msg || !msg.type) return;
                if (msg.type === 'nebula-request-image') {
                    // Expect options: { prompt, url, apiKey, width, height, method, contentType }
                    const opts = msg.options || {};
                    const url = opts.url;
                    if (!url) {
                        // respond with error
                        window.postMessage({ type: 'nebula-generated-image', error: 'No URL provided' }, '*');
                        return;
                    }

                    // Build proxy request
                    const headers = { 'Content-Type': opts.contentType || 'application/json' };
                    if (opts.apiKey) headers['Authorization'] = opts.apiKey.startsWith('Bearer') ? opts.apiKey : `Bearer ${opts.apiKey}`;

                    try {
                        if (!(window.nebula && window.nebula.assistant && typeof window.nebula.assistant.proxyFetch === 'function')) {
                            window.postMessage({ type: 'nebula-generated-image', error: 'proxyFetch not available' }, '*');
                            return;
                        }

                        const proxyRes = await window.nebula.assistant.proxyFetch({ url, options: { method: opts.method || 'POST', headers, body: opts.contentType === 'application/x-www-form-urlencoded' ? new URLSearchParams({ prompt: opts.prompt || '' }) : JSON.stringify({ prompt: opts.prompt || '' }) }});

                        if (!proxyRes.ok) {
                            window.postMessage({ type: 'nebula-generated-image', error: proxyRes.error || 'proxy failed' }, '*');
                            return;
                        }

                        // Normalize responses
                        let dataURL = null;
                        let meta = { source: 'proxy', url };

                        if (proxyRes.type === 'dataURL') {
                            dataURL = proxyRes.dataURL;
                        } else if (proxyRes.type === 'json') {
                            const body = proxyRes.data || {};
                            if (body.data && Array.isArray(body.data) && body.data[0] && body.data[0].b64_json) {
                                dataURL = 'data:image/png;base64,' + body.data[0].b64_json;
                                meta.response = body;
                            } else if (body.images && Array.isArray(body.images) && body.images[0]) {
                                const first = body.images[0];
                                if (first.startsWith('data:')) dataURL = first;
                                else if (first.startsWith('http')) {
                                    // fetch via proxy to get dataURL
                                    const fetched = await window.nebula.assistant.proxyFetch({ url: first, options: { method: 'GET' } });
                                    if (fetched.ok && fetched.type === 'dataURL') dataURL = fetched.dataURL;
                                }
                            } else if (body.result && typeof body.result === 'string') {
                                const maybe = body.result;
                                if (maybe.startsWith('data:')) dataURL = maybe;
                                else dataURL = 'data:image/png;base64,' + maybe;
                            }
                        } else if (proxyRes.type === 'text') {
                            const txt = (proxyRes.data || '').trim();
                            if (txt.startsWith('data:')) dataURL = txt;
                            else if (txt.startsWith('http')) {
                                const fetched = await window.nebula.assistant.proxyFetch({ url: txt, options: { method: 'GET' } });
                                if (fetched.ok && fetched.type === 'dataURL') dataURL = fetched.dataURL;
                            }
                        }

                        if (dataURL) {
                            // Post back to host listeners
                            window.postMessage({ type: 'nebula-generated-image', dataURL, meta }, '*');

                            // Also try to notify the originating webview content for its UI via executeJavaScript
                            try {
                                if (this.testWebview && this.testWebview.executeJavaScript) {
                                    const payload = { type: 'nebula-generated-image', dataURL, meta };
                                    this.testWebview.executeJavaScript(`window.postMessage(${JSON.stringify(payload)}, '*')`).catch(()=>{});
                                }
                            } catch (x) { /* ignore */ }
                        } else {
                            window.postMessage({ type: 'nebula-generated-image', error: 'Could not extract image from proxy response' }, '*');
                        }
                    } catch (err) {
                        window.postMessage({ type: 'nebula-generated-image', error: String(err) }, '*');
                    }
                }
                if (msg.type === 'nebula-webview-action') {
                    // Instruct the assistant to inject JS into the loaded test webview to set prompt, submit, and capture image
                    const opts = msg.options || {};
                    if (!this.testWebview || !this.testWebview.executeJavaScript) {
                        window.postMessage({ type: 'nebula-generated-image', error: 'No test webview available' }, '*');
                        return;
                    }

                    const script = `(async function(){
                        try {
                            const prompt = ${JSON.stringify(opts.prompt || '')};
                            const inputSelector = ${JSON.stringify(opts.inputSelector || '')} || '';
                            const submitSelector = ${JSON.stringify(opts.submitSelector || '')} || '';
                            const imageSelector = ${JSON.stringify(opts.imageSelector || '')} || 'img.result, img.generated, img';

                            // helper: find contenteditable or textarea/input
                            const findInput = ()=>{
                                if (inputSelector) return document.querySelector(inputSelector);
                                // common OpenAI chat input: contenteditable ProseMirror with id 'prompt-textarea'
                                const byId = document.getElementById('prompt-textarea');
                                if (byId) return byId;
                                const pm = document.querySelector('.ProseMirror[contenteditable]');
                                if (pm) return pm;
                                const ta = document.querySelector('textarea[name="prompt-textarea"], textarea');
                                if (ta) return ta;
                                const txt = document.querySelector('input[type="search"], input[type="text"]');
                                if (txt) return txt;
                                return null;
                            };

                            function dispatchInput(el, value){
                                try { el.focus && el.focus(); } catch(e){}
                                if (el.isContentEditable) {
                                    // replace HTML with a paragraph to mimic user input
                                    el.innerHTML = '<p>' + (value || '') + '</p>';
                                    el.dispatchEvent(new InputEvent('input', { bubbles: true }));
                                    el.dispatchEvent(new Event('change', { bubbles: true }));
                                } else if (el.tagName && el.tagName.toLowerCase() === 'textarea' || (el.tagName && el.tagName.toLowerCase() === 'input')) {
                                    el.value = value || '';
                                    el.dispatchEvent(new Event('input', { bubbles: true }));
                                    el.dispatchEvent(new Event('change', { bubbles: true }));
                                } else {
                                    try { el.textContent = value || ''; } catch(e){}
                                }
                            }

                            const input = findInput();
                            if (!input) return { ok:false, error:'Could not find input element' };
                            const fullPrompt = (prompt || '') + (window.__nebula_prompt_suffix__ || '');
                            // accept promptSuffix passed via options by temporarily setting a global
                            try { window.__nebula_prompt_suffix__ = ${JSON.stringify(opts.promptSuffix || '')}; } catch(e){}
                            dispatchInput(input, (prompt || '') + ( ${JSON.stringify(opts.promptSuffix || '')} || '' ));

                            // Try to find a submit/send button
                            const findSubmit = ()=>{
                                if (submitSelector) return document.querySelector(submitSelector);
                                // common candidates
                                const candidates = Array.from(document.querySelectorAll('button, [role="button"]'));
                                for (const c of candidates) {
                                    const txt = (c.innerText || c.getAttribute('aria-label') || c.title || '').trim().toLowerCase();
                                    if (!txt) continue;
                                    if (txt.includes('send') || txt.includes('generate') || txt.includes('submit') || txt.includes('create') || txt.includes('generate image')) return c;
                                }
                                // try specific OpenAI send button structure
                                const btn = document.querySelector('button[type="submit"]');
                                if (btn) return btn;
                                return null;
                            };

                            // Prefer OpenAI's composer submit button if present
                            const oaBtn = document.querySelector('#composer-submit-button');
                            const submitBtn = oaBtn || findSubmit();
                            if (submitBtn) {
                                try { submitBtn.click(); } catch(e) { /* ignore */ }
                            } else {
                                // fallback: emulate Enter / Ctrl+Enter
                                try {
                                    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
                                    input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', bubbles: true }));
                                    // Ctrl+Enter
                                    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', ctrlKey: true, bubbles: true }));
                                    input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', ctrlKey: true, bubbles: true }));
                                } catch(e){}
                            }

                            // helper: query across shadow roots
                            function queryAllDeep(selector) {
                                const result = [];
                                const traverse = (root) => {
                                    try {
                                        const nodes = root.querySelectorAll(selector || '*');
                                        nodes.forEach(n=>result.push(n));
                                    } catch(e){}
                                    const children = root.children || [];
                                    for (const c of children) {
                                        if (c.shadowRoot) traverse(c.shadowRoot);
                                        try { traverse(c); } catch(e){}
                                    }
                                };
                                traverse(document);
                                return result;
                            }

                            const waitForImage = async (sel, timeoutMs=30000) => {
                                const start = Date.now();
                                while (Date.now() - start < timeoutMs) {
                                    // try normal query
                                    let el = document.querySelector(sel);
                                    if (el) return el;
                                    // try deep search
                                    const deep = queryAllDeep(sel);
                                    if (deep && deep.length) return deep[0];
                                    await new Promise(r=>setTimeout(r, 400));
                                }
                                return null;
                            };

                            // Wait longer for some UIs that take more time
                            const img = await waitForImage(imageSelector, 30000);
                            if (!img) {
                                // try canvas elements
                                const canv = document.querySelector('canvas');
                                if (canv) {
                                    try {
                                        const dataURL = canv.toDataURL('image/png');
                                        return { ok:true, dataURL };
                                    } catch(e) {
                                        // ignore and continue to bg checks
                                    }
                                }

                                // try background-image detection
                                const bgEl = Array.from(document.querySelectorAll('*')).find(el=>{
                                    try { const s = window.getComputedStyle(el); return s && s.backgroundImage && s.backgroundImage !== 'none' && s.backgroundImage.includes('url('); } catch(e){ return false }
                                });
                                if (bgEl) {
                                    try {
                                        const bg = window.getComputedStyle(bgEl).backgroundImage;
                                        const m = bg.match(/url\(["']?([^\)"']+)["']?\)/);
                                        if (m && m[1]) {
                                            const url = m[1];
                                            const fetched = await fetch(url);
                                            const blob = await fetched.blob();
                                            const reader = new FileReader();
                                            const dataURL = await new Promise((resolve, reject) => {
                                                reader.onloadend = () => resolve(reader.result);
                                                reader.onerror = reject;
                                                reader.readAsDataURL(blob);
                                            });
                                            return { ok:true, dataURL };
                                        }
                                    } catch(e) { /* ignore */ }
                                }

                                // gather diagnostics if nothing found
                                const imgs = Array.from(queryAllDeep('img')).slice(0,40).map(i=>({ src: i.currentSrc||i.src||i.getAttribute('src')||'', alt: i.alt||'', outer: (i.outerHTML||'').slice(0,300) }));
                                const withBg = Array.from(queryAllDeep('*')).filter(el=>{
                                    try { const s = window.getComputedStyle(el); return s && s.backgroundImage && s.backgroundImage !== 'none'; } catch(e){ return false }
                                }).slice(0,40).map(el=>({ tag: el.tagName, bg: (window.getComputedStyle(el).backgroundImage||'').slice(0,200), outer: (el.outerHTML||'').slice(0,200) }));
                                // find anchor download links / filenames
                                const anchors = Array.from(queryAllDeep('a')).slice(0,60).map(a=>({ href: a.href||a.getAttribute('href')||'', text: a.innerText||'', outer: (a.outerHTML||'').slice(0,300) }));
                                const snippet = (document.querySelector('main') && document.querySelector('main').innerText) || document.body.innerText || '';
                                return { ok:false, error:'Timed out waiting for generated image', diag: { imgs, withBg, anchors, snippet: snippet.slice(0,2000) } };
                            }

                            const src = img.currentSrc || img.src || img.getAttribute && img.getAttribute('src');
                            if (!src) return { ok:false, error:'Image has no src' };
                            if (src.startsWith('data:')) return { ok:true, dataURL: src };

                            // attempt to fetch via page context
                            try {
                                const resp = await fetch(src);
                                const blob = await resp.blob();
                                const reader = new FileReader();
                                const dataURL = await new Promise((resolve, reject) => {
                                    reader.onloadend = () => resolve(reader.result);
                                    reader.onerror = reject;
                                    reader.readAsDataURL(blob);
                                });
                                return { ok:true, dataURL };
                            } catch (e) {
                                return { ok:false, error: 'Failed to fetch image: ' + e.message };
                            }
                        } catch (err) { return { ok:false, error: String(err) } }
                    })()`;

                    try {
                        const res = await this.testWebview.executeJavaScript(script, true);
                        if (res && res.ok && res.dataURL) {
                            window.postMessage({ type: 'nebula-generated-image', dataURL: res.dataURL, meta: { source: 'webview-inject' } }, '*');
                        } else {
                            // If injection timed out or returned diagnostics, try automatic fallback:
                            // look for anchors/img candidates in res.diag.anchors or res.diag.imgs and proxy-fetch them
                            const diag = (res && res.diag) || {};
                            const candidates = [];
                            try {
                                const marker = (diag && diag.snippet && typeof diag.snippet === 'string') ? (diag.snippet.match(/\[nebula-generated-image\]/) ? '[nebula-generated-image]' : null) : null;
                                const copilotRegex = /copilot[_-][0-9a-zA-Z._-]+/i;
                                const extRegex = /\.(png|jpe?g|svg|gif|webp)(?:$|[?#])/i;

                                const extractFromSrcset = (outer) => {
                                    if (!outer || typeof outer !== 'string') return [];
                                    const urls = [];
                                    // crude src/srcset url extraction
                                    const re = /https?:\/\/[\w\-._~:\/?#\[\]@!$&'()*+,;=%]+/g;
                                    const m = outer.match(re);
                                    if (m && m.length) return m;
                                    return urls;
                                };

                                // collect anchors
                                if (diag.anchors && Array.isArray(diag.anchors)) {
                                    for (const a of diag.anchors) {
                                        const href = (a && (a.href || a.url || a.hrefRaw || a.getAttribute && a.getAttribute('href'))) || '';
                                        if (!href) continue;
                                        let candidate = href;
                                        // strip fragment and keep query for proxy but test ext without query
                                        const testPath = (candidate.split('#')[0] || '').split('?')[0] || '';
                                        const lower = testPath.toLowerCase();
                                        const outer = (a && a.outer) || (a && a.outerHTML) || '';
                                        // include if matches copilot pattern, marker or has image extension
                                        if (copilotRegex.test(candidate) || (marker && candidate.includes(marker)) || extRegex.test(candidate) || copilotRegex.test(outer) || extRegex.test(outer)) {
                                            candidates.push(candidate);
                                        } else {
                                            // also consider anchor text as filename
                                            const text = (a && a.text) || '';
                                            if (copilotRegex.test(text) || extRegex.test(text)) candidates.push(candidate);
                                        }
                                    }
                                }

                                // collect imgs
                                if (diag.imgs && Array.isArray(diag.imgs)) {
                                    for (const i of diag.imgs) {
                                        const src = (i && (i.src || i.currentSrc || i.srcset)) || '';
                                        const outer = (i && i.outer) || '';
                                        if (!src && !outer) continue;
                                        // if srcset present, extract URLs
                                        const candidatesFromSrcset = [];
                                        if (typeof src === 'string' && src.includes(',')) {
                                            // common srcset with commas
                                            const parts = src.split(',').map(s=>s.trim().split(' ')[0]).filter(Boolean);
                                            parts.forEach(p=>candidatesFromSrcset.push(p));
                                        }
                                        // also inspect outer HTML for urls
                                        const extracted = extractFromSrcset(outer || '');
                                        extracted.forEach(u=>candidatesFromSrcset.push(u));
                                        // push direct src too
                                        if (src) candidatesFromSrcset.push(src);

                                        for (const cand of candidatesFromSrcset) {
                                            if (!cand) continue;
                                            const testPath = (cand.split('#')[0] || '').split('?')[0] || '';
                                            if (copilotRegex.test(cand) || copilotRegex.test(outer) || (marker && cand.includes(marker)) || extRegex.test(testPath) || extRegex.test(outer)) {
                                                candidates.push(cand);
                                            }
                                        }
                                    }
                                }
                            } catch (x) { /* ignore diag parsing errors */ }

                            // dedupe
                            const uniq = Array.from(new Set(candidates)).slice(0, 12);
                            let found = false;
                            for (const url of uniq) {
                                try {
                                    if (!(window.nebula && window.nebula.assistant && typeof window.nebula.assistant.proxyFetch === 'function')) break;
                                    const fetched = await window.nebula.assistant.proxyFetch({ url, options: { method: 'GET' } });
                                    if (fetched && fetched.ok && fetched.type === 'dataURL' && fetched.dataURL) {
                                        window.postMessage({ type: 'nebula-generated-image', dataURL: fetched.dataURL, meta: { source: 'webview-anchor-proxy', url } }, '*');
                                        found = true;
                                        break;
                                    }
                                } catch (e) {
                                    // continue to next candidate
                                }
                            }

                            if (!found) {
                                window.postMessage({ type: 'nebula-generated-image', error: (res && res.error) || 'webview injection failed (and anchor fallback found nothing)', meta: res || {} }, '*');
                            }
                        }
                    } catch (err) {
                        window.postMessage({ type: 'nebula-generated-image', error: String(err) }, '*');
                    }
                }
            } catch (e) {
                // ignore
            }
        });

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
    <button class="tool-btn" id="artToolBtn" title="Open OLLIE (Image Editor)">
        🖼️
    </button>
    <button class="tool-btn" id="testWebviewBtn" title="Open Test Webview (debug)">
        🧪
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

        const testWebviewBtn = document.getElementById('testWebviewBtn');
        testWebviewBtn?.addEventListener('click', () => {
            this.launchTestWebviewModal();
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
     * Launch OLLIE (NebulaImageEditor) instead of the separate Art Assistant
     */
    launchArtAssistant() {
        try {
            const launchOLLIE = () => {
                try {
                    // If an OLLIE window is already open, bring it to front
                    if (window.windowManager && window.windowManager.windows) {
                        const wm = window.windowManager;
                        for (const [id, win] of wm.windows) {
                            if (win && win.app && win.app instanceof NebulaImageEditor) {
                                if (typeof wm.bringToFront === 'function') {
                                    wm.bringToFront(id);
                                } else if (typeof wm.focusWindow === 'function') {
                                    wm.focusWindow(id);
                                } else if (typeof wm.restoreWindow === 'function') {
                                    wm.restoreWindow(id);
                                }
                                this.updateStatus('OLLIE brought to front');
                                return true;
                            }
                        }
                    }

                    // Otherwise instantiate
                    const ollie = new NebulaImageEditor();
                    this.updateStatus('OLLIE launched');
                    console.log('OLLIE (NebulaImageEditor) launched successfully');
                    return true;
                } catch (e) {
                    console.error('Failed to instantiate OLLIE after load:', e);
                    return false;
                }
            };

            if (window.NebulaImageEditor) {
                launchOLLIE();
            } else {
                // Attempt to dynamically load the OLLIE script
                const scriptPath = '../CustomApps/OLLIE/OLLIE-tabs.js';
                const existing = Array.from(document.getElementsByTagName('script')).find(s => s.src && s.src.endsWith('OLLIE.js'));
                if (!existing) {
                    const script = document.createElement('script');
                    script.src = scriptPath;
                    script.onload = () => {
                        console.log('Loaded OLLIE script dynamically');
                        if (window.NebulaImageEditor) {
                            launchOLLIE();
                        } else {
                            console.error('OLLIE script loaded but NebulaImageEditor not defined');
                            // fallback
                            if (window.NebulaArtAssistant) new NebulaArtAssistant();
                        }
                    };
                    script.onerror = () => {
                        console.error('Failed to load OLLIE script:', scriptPath);
                        if (window.NebulaArtAssistant) new NebulaArtAssistant();
                    };
                    document.body.appendChild(script);
                } else {
                    // Script tag exists but class not ready - try again shortly
                    setTimeout(() => {
                        if (window.NebulaImageEditor) launchOLLIE();
                        else if (window.NebulaArtAssistant) new NebulaArtAssistant();
                    }, 300);
                }
            }
        } catch (error) {
            console.error('Failed to launch OLLIE/Art Assistant:', error);
            this.updateStatus('Failed to launch art assistant');
        }
    }

    /**
     * Launch Code Assistant  
     */
    launchCodeAssistant() {
        try {
            window.CODE_ASSISTANT_AUTO_INIT = true;
            const codeAssistant = new NebulaCodeAssistant();
            delete window.CODE_ASSISTANT_AUTO_INIT;
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
                    <button class="test-svc" data-id="${id}">Test</button>
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

        // Test handlers for saved services
        modal.querySelectorAll('.test-svc').forEach(btn => {
            btn.onclick = async (e) => {
                const id = btn.getAttribute('data-id');
                const svc = this.savedServices[id];
                if (!svc) return alert('Service not found');

                const previewModal = document.createElement('div');
                previewModal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:2600;';
                const box = document.createElement('div');
                box.style.cssText = 'width:760px;max-width:95%;max-height:80%;background:var(--nebula-surface);padding:12px;border-radius:8px;overflow:auto;color:var(--nebula-text-primary);';
                box.innerHTML = `<h3 style="margin:0 0 8px 0;">Test Service: ${svc.name}</h3><div id="svcTestResult">Running test...</div><div style="margin-top:8px;text-align:right;"><button id="closePreview">Close</button></div>`;
                previewModal.appendChild(box);
                document.body.appendChild(previewModal);
                previewModal.querySelector('#closePreview').onclick = () => previewModal.remove();

                try {
                    // Use proxy if available to avoid renderer adblock interference
                    if (window.nebula && window.nebula.assistant && typeof window.nebula.assistant.proxyFetch === 'function') {
                        const proxyRes = await window.nebula.assistant.proxyFetch({ url: svc.url, options: { method: svc.method || 'POST', headers: { 'Content-Type': svc.contentType || 'application/json', ...(svc.apiKey ? { 'Authorization': svc.apiKey.startsWith('Bearer') ? svc.apiKey : `Bearer ${svc.apiKey}` } : {}) }, body: svc.contentType === 'application/x-www-form-urlencoded' ? new URLSearchParams({ prompt: 'test' }) : JSON.stringify({ prompt: 'test' }) }});
                        const container = previewModal.querySelector('#svcTestResult');
                        if (!proxyRes.ok) {
                            container.innerText = 'Proxy fetch failed: ' + (proxyRes.error || 'unknown');
                        } else if (proxyRes.type === 'json') {
                            container.innerHTML = `<pre style="white-space:pre-wrap;max-height:60vh;overflow:auto">${JSON.stringify(proxyRes.data, null, 2)}</pre>`;
                        } else if (proxyRes.type === 'dataURL') {
                            container.innerHTML = `<img src="${proxyRes.dataURL}" style="max-width:100%;height:auto;border:1px solid var(--nebula-border)"><div style="font-size:12px;color:var(--nebula-text-secondary)">Returned image (via proxy)</div>`;
                        } else {
                            container.innerHTML = `<pre style="white-space:pre-wrap;max-height:60vh;overflow:auto">${String(proxyRes.data).slice(0,2000)}</pre>`;
                        }
                    } else {
                        alert('Proxy fetch not available.');
                        previewModal.remove();
                    }
                } catch (err) {
                    const container = previewModal.querySelector('#svcTestResult');
                    container.innerText = 'Test failed: ' + (err.message || String(err));
                }
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
                <label style="display:block;margin-bottom:8px;font-size:13px;color:var(--nebula-text-secondary);">API Key (optional)<input id="svcApiKey" placeholder="Bearer ... or raw key" style="width:100%;padding:8px;margin-top:6px;background:var(--nebula-bg-secondary);border:1px solid var(--nebula-border);color:var(--nebula-text-primary);border-radius:4px;" value="${svc.apiKey||''}"></label>
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
            const apiKey = modal.querySelector('#svcApiKey')?.value.trim() || null;
            const imageCap = !!modal.querySelector('#svcImageCap').checked;
            if (!name || !url) return alert('Name and URL are required');

            const id = isEdit ? serviceId : `svc_${Math.random().toString(36).substr(2,9)}`;
            this.savedServices[id] = { name, url, apiKey, imageCapable: imageCap };
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
     * High-level image generation helper.
     * Tries to use a configured saved service (or builtin) and normalizes common
     * response shapes into a dataURL. Publishes the result via publishGeneratedImage().
     */
    async generateImage(serviceKey = null, options = {}) {
        // Build canonical payload used for caching and for API/webview calls
        const payload = {
            prompt: options.prompt || '',
            width: options.width || 800,
            height: options.height || 600,
            transparent: !!options.transparent,
            model: options.model || null
        };

        const cacheKeyFor = (p) => {
            try {
                const s = JSON.stringify({ prompt: p.prompt || '', width: p.width || 0, height: p.height || 0, model: p.model || null });
                return 'nebula-gen-' + btoa(unescape(encodeURIComponent(s)));
            } catch (e) {
                return 'nebula-gen-' + Math.abs((p.prompt || '').split('').reduce((a,c)=>a+ c.charCodeAt(0),0));
            }
        };

        const cacheKey = cacheKeyFor(payload);

        // If not forcing regeneration, return cache when available to avoid burning requests
        if (!options.force) {
            const cached = this._getCacheEntry(cacheKey);
            if (cached && cached.dataURL) {
                // Publish again so consumers can react
                this.publishGeneratedImage(cached.dataURL, cached.meta || { cached: true });
                return { dataURL: cached.dataURL, meta: cached.meta || { cached: true } };
            }
        }

        // If the dedicated test webview is present, prefer driving it first.
        // Avoid attempting to control third-party AI web UIs (they often block or ignore messages).
        if (this.testWebview) {
            try {
                const res = await this.generateImageViaWebview(payload);
                if (res && res.dataURL) {
                    this._saveCacheEntry(cacheKey, { dataURL: res.dataURL, meta: res.meta });
                    return res;
                }
            } catch (e) {
                console.warn('generateImageViaWebview failed, falling back to API path:', e);
            }
        }

        // Lightweight wrapper that delegates to saved services or builtins.
        try {
            // Use existing savedServices marked imageCapable (or explicit key)
            let svc = null;
            if (serviceKey && this.savedServices && this.savedServices[serviceKey]) {
                svc = this.savedServices[serviceKey];
            }

            if (!svc && this.savedServices) {
                for (const [id, s] of Object.entries(this.savedServices)) {
                    if (s.imageCapable) { svc = { ...s, id }; break; }
                }
            }

            // Also accept builtin:: entries created from settings checkboxes
            if (!svc && this.savedServices) {
                for (const [id, s] of Object.entries(this.savedServices)) {
                    if (id.startsWith('builtin::')) { svc = { ...s, id }; break; }
                }
            }

            if (!svc) throw new Error('No image-capable service configured');

            const url = svc.url;
            const apiKey = svc.apiKey || svc.key || null;

            console.log('Assistant.generateImage ->', url, payload);

            let resp = null;
            try {
                resp = await fetch(url, {
                    method: svc.method || 'POST',
                    headers: {
                        'Content-Type': svc.contentType || 'application/json',
                        ...(apiKey ? { 'Authorization': apiKey.startsWith('Bearer') ? apiKey : `Bearer ${apiKey}` } : {})
                    },
                    body: svc.contentType === 'application/x-www-form-urlencoded' ? new URLSearchParams(payload) : JSON.stringify(payload)
                });
            } catch (fetchErr) {
                console.warn('Renderer fetch failed, attempting main-process proxy fetch:', fetchErr);
                // If preload bridge is available, try proxying via main process
                try {
                    if (window.nebula && window.nebula.assistant && typeof window.nebula.assistant.proxyFetch === 'function') {
                        const proxyRes = await window.nebula.assistant.proxyFetch({ url, options: {
                            method: svc.method || 'POST',
                            headers: {
                                'Content-Type': svc.contentType || 'application/json',
                                ...(apiKey ? { 'Authorization': apiKey.startsWith('Bearer') ? apiKey : `Bearer ${apiKey}` } : {})
                            },
                            body: svc.contentType === 'application/x-www-form-urlencoded' ? new URLSearchParams(payload) : JSON.stringify(payload)
                        }});
                        if (!proxyRes.ok) throw new Error(proxyRes.error || 'proxy fetch failed');
                        // Reconstruct a minimal response-like object for downstream logic
                        if (proxyRes.type === 'json') {
                            resp = { ok: true, headers: { get: (k) => k === 'content-type' ? 'application/json' : '' }, json: async () => proxyRes.data, status: proxyRes.status };
                        } else if (proxyRes.type === 'dataURL') {
                            // return a fake resp that our code can handle later
                            resp = { ok: true, headers: { get: (k) => proxyRes.contentType }, blob: async () => { const bin = atob(proxyRes.dataURL.split(',')[1]); const len = bin.length; const u8 = new Uint8Array(len); for (let i=0;i<len;i++) u8[i]=bin.charCodeAt(i); return new Blob([u8], { type: proxyRes.contentType }); }, status: proxyRes.status };
                        } else {
                            resp = { ok: true, headers: { get: (k) => proxyRes.contentType || '' }, text: async () => proxyRes.data, status: proxyRes.status };
                        }
                    } else {
                        throw fetchErr;
                    }
                } catch (proxyErr) {
                    console.error('Proxy fetch failed or unavailable:', proxyErr);
                    throw fetchErr;
                }
            }

            if (!resp.ok) {
                const txt = await resp.text().catch(() => '');
                throw new Error(`Service responded ${resp.status}: ${txt}`);
            }

            const contentType = resp.headers.get('content-type') || '';

            if (contentType.includes('application/json')) {
                const body = await resp.json();

                // Common shapes
                if (body.data && Array.isArray(body.data) && body.data[0] && body.data[0].b64_json) {
                    const b64 = body.data[0].b64_json;
                    const dataURL = 'data:image/png;base64,' + b64;
                    const meta = { service: svc.name || svc.id, response: body, prompt: payload.prompt };
                    this.publishGeneratedImage(dataURL, meta);
                    this._saveCacheEntry(cacheKey, { dataURL, meta });
                    return { dataURL, meta };
                }

                if (body.images && Array.isArray(body.images) && body.images[0]) {
                    const first = body.images[0];
                    if (first.startsWith('data:')) {
                        const dataURL = first;
                        const meta = { service: svc.name || svc.id, response: body };
                        this.publishGeneratedImage(dataURL, meta);
                        this._saveCacheEntry(cacheKey, { dataURL, meta });
                        return { dataURL, meta };
                    }
                    const fetched = await fetch(first);
                    const blob = await fetched.blob();
                    const dataURL = await this._blobToDataURL(blob);
                    const meta = { service: svc.name || svc.id, response: body };
                    this.publishGeneratedImage(dataURL, meta);
                    this._saveCacheEntry(cacheKey, { dataURL, meta });
                    return { dataURL, meta };
                }

                if (body.result && typeof body.result === 'string') {
                    const maybe = body.result;
                    if (maybe.startsWith('data:')) {
                        const dataURL = maybe;
                        const meta = { service: svc.name || svc.id, response: body };
                        this.publishGeneratedImage(dataURL, meta);
                        this._saveCacheEntry(cacheKey, { dataURL, meta });
                        return { dataURL, meta };
                    }
                    const dataURL = 'data:image/png;base64,' + maybe;
                    const meta = { service: svc.name || svc.id, response: body };
                    this.publishGeneratedImage(dataURL, meta);
                    this._saveCacheEntry(cacheKey, { dataURL, meta });
                    return { dataURL, meta };
                }

                if (body.urls && Array.isArray(body.urls) && body.urls[0]) {
                    const first = body.urls[0];
                    const fetched = await fetch(first);
                    const blob = await fetched.blob();
                    const dataURL = await this._blobToDataURL(blob);
                    const meta = { service: svc.name || svc.id, response: body };
                    this.publishGeneratedImage(dataURL, meta);
                    this._saveCacheEntry(cacheKey, { dataURL, meta });
                    return { dataURL, meta };
                }

                throw new Error('Unknown JSON response shape');
            }

            if (contentType.startsWith('image/')) {
                const blob = await resp.blob();
                const dataURL = await this._blobToDataURL(blob);
                const meta = { service: svc.name || svc.id };
                this.publishGeneratedImage(dataURL, meta);
                this._saveCacheEntry(cacheKey, { dataURL, meta });
                return { dataURL, meta };
            }

            const txt = await resp.text().catch(() => '');
                // Trim and inspect textual responses. If the service returned HTML (login page, blocked page),
                // provide a clearer error message and include a small preview to aid debugging.
                const trimmed = (txt || '').trim();
                if (trimmed.startsWith('<')) {
                    console.error('Assistant.generateImage: service returned HTML (likely login/blocked page). Preview:', trimmed.slice(0,200));
                    throw new Error('Service returned HTML (likely login or blocked page). Check saved-service URL and authentication. Preview: ' + trimmed.slice(0,200));
                }
                if (trimmed && (trimmed.startsWith('http') || trimmed.startsWith('data:'))) {
                if (txt.startsWith('data:')) {
                    const dataURL = txt;
                    const meta = { service: svc.name || svc.id };
                    this.publishGeneratedImage(dataURL, meta);
                    this._saveCacheEntry(cacheKey, { dataURL, meta });
                    return { dataURL, meta };
                }
                const fetched = await fetch(txt);
                const blob = await fetched.blob();
                const dataURL = await this._blobToDataURL(blob);
                const meta = { service: svc.name || svc.id };
                this.publishGeneratedImage(dataURL, meta);
                this._saveCacheEntry(cacheKey, { dataURL, meta });
                return { dataURL, meta };
            }

            // If we reached here, the response couldn't be parsed into an image.
            console.error('Assistant.generateImage: could not parse response; content-type=', contentType, 'textPreview=', (typeof txt === 'string' ? txt.slice(0,200) : '[binary]'));
            throw new Error('Could not parse image response — see console for details. Service may be returning HTML or an unexpected payload.');
        } catch (err) {
            console.error('Assistant.generateImage failed:', err);
            throw err;
        }
    }

    async _blobToDataURL(blob) {
        return await new Promise((resolve, reject) => {
            try {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            } catch (e) { reject(e); }
        });
    }

    /**
     * Try to drive the currently loaded webview (AI web UI) by posting a message
     * with generation parameters. The webview's page must implement a listener
     * that performs generation and posts back { type: 'nebula-generated-image', dataURL }
     * This is best-effort — many public AI web UIs won't accept programmatic control,
     * but custom saved service pages can implement the bridge.
     */
    async generateImageViaWebview(options = {}) {
        // prefer a dedicated test webview when present
        const targetWebview = this.testWebview || this.webview;
        if (!targetWebview) throw new Error('No assistant webview available');

        const message = { type: 'nebula-generate-image', options };

        const waitForResponse = (timeout = 20000) => new Promise((resolve, reject) => {
            let settled = false;
            const onMessage = (e) => {
                try {
                    const msg = e.data;
                    if (!msg || msg.type !== 'nebula-generated-image') return;
                    settled = true;
                    window.removeEventListener('message', onMessage);
                    resolve({ dataURL: msg.dataURL, meta: msg.meta || {} });
                } catch (err) {
                    // ignore
                }
            };

            window.addEventListener('message', onMessage);

            // Timeout
            const to = setTimeout(() => {
                if (settled) return;
                window.removeEventListener('message', onMessage);
                reject(new Error('Timed out waiting for webview response'));
            }, timeout);
        });

        // Ensure test webview is ready (if using it)
        if (targetWebview === this.testWebview && this.testWebviewReady) {
            try { await this.testWebviewReady; } catch (e) { /* ignore */ }
        }

        // Post message to webview
        try {
            targetWebview.send && targetWebview.send('nebula-message', message);
            // As a secondary channel, execute a window.postMessage inside the webview
            try { await targetWebview.executeJavaScript(`window.postMessage(${JSON.stringify(message)}, '*')`); } catch (ex) { /* ignore */ }
        } catch (e) {
            // Fallback: try contentWindow.postMessage via executeJavaScript
            try {
                await targetWebview.executeJavaScript(`window.postMessage(${JSON.stringify(message)}, '*')`);
            } catch (ex) {
                console.warn('Could not post message to webview', ex);
            }
        }

        const res = await waitForResponse();
        if (res && res.dataURL) {
            this.publishGeneratedImage(res.dataURL, { service: this.aiServices[this.currentAI]?.name || 'webview', ...res.meta });
            return { dataURL: res.dataURL, meta: { service: this.aiServices[this.currentAI]?.name || 'webview', ...res.meta } };
        }
        throw new Error('Webview did not return an image');
    }

    /**
     * Open a temporary modal containing a webview that loads the local test generator.
     * This provides a short-lived visible webview for debugging and will set `this.testWebview`.
     */
    launchTestWebviewModal() {
        try {
            const modal = document.createElement('div');
            modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:2500;';

            const box = document.createElement('div');
            box.style.cssText = 'width:880px;height:640px;background:var(--nebula-surface);border-radius:8px;overflow:hidden;display:flex;flex-direction:column;';

            const header = document.createElement('div');
            header.style.cssText = 'padding:8px 12px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--nebula-border);';
            header.innerHTML = `<div style="display:flex;gap:8px;align-items:center;">
                <strong>Test Webview (debug)</strong>
            </div>`;

            // address input + load
            const addrWrap = document.createElement('div');
            addrWrap.style.cssText = 'display:flex;gap:6px;align-items:center;margin-left:12px;flex:1;';
            const urlInput = document.createElement('input');
            urlInput.type = 'text';
            urlInput.placeholder = 'https://example.com (load target site here)';
            urlInput.style.cssText = 'flex:1;padding:6px;border-radius:6px;border:1px solid var(--nebula-border);background:transparent;color:var(--nebula-text)';
            urlInput.value = 'https://chat.openai.com';
            const loadBtn2 = document.createElement('button');
            loadBtn2.textContent = 'Load';
            loadBtn2.style.cssText = 'padding:6px 8px;margin-left:6px;';
            addrWrap.appendChild(urlInput);
            addrWrap.appendChild(loadBtn2);
            header.appendChild(addrWrap);

            // prompt input + inject button
            const promptWrap = document.createElement('div');
            promptWrap.style.cssText = 'display:flex;gap:6px;align-items:center;margin-left:12px;';
            const promptInput = document.createElement('input');
            promptInput.type = 'text';
            promptInput.placeholder = 'Prompt to inject into webview';
            promptInput.style.cssText = 'width:360px;padding:6px;border-radius:6px;border:1px solid var(--nebula-border);background:transparent;color:var(--nebula-text)';
            // selector inputs
            const inputSelectorInput = document.createElement('input');
            inputSelectorInput.type = 'text';
            inputSelectorInput.placeholder = 'Input selector (optional)';
            inputSelectorInput.style.cssText = 'width:220px;padding:6px;border-radius:6px;border:1px solid var(--nebula-border);background:transparent;color:var(--nebula-text);margin-left:6px';
            const submitSelectorInput = document.createElement('input');
            submitSelectorInput.type = 'text';
            submitSelectorInput.placeholder = 'Submit selector (optional)';
            submitSelectorInput.style.cssText = 'width:220px;padding:6px;border-radius:6px;border:1px solid var(--nebula-border);background:transparent;color:var(--nebula-text);margin-left:6px';
            const imageSelectorInput = document.createElement('input');
            imageSelectorInput.type = 'text';
            imageSelectorInput.placeholder = 'Image selector (optional)';
            imageSelectorInput.style.cssText = 'width:220px;padding:6px;border-radius:6px;border:1px solid var(--nebula-border);background:transparent;color:var(--nebula-text);margin-left:6px';
            const markerWrap = document.createElement('label');
            markerWrap.style.cssText = 'display:flex;gap:6px;align-items:center;color:var(--nebula-text);font-size:12px;margin-left:6px;';
            const markerCheckbox = document.createElement('input');
            markerCheckbox.type = 'checkbox';
            markerCheckbox.title = 'Append capture marker to the prompt';
            const markerLabel = document.createElement('span');
            markerLabel.textContent = 'Append marker';
            markerWrap.appendChild(markerCheckbox);
            markerWrap.appendChild(markerLabel);
            const injectBtn = document.createElement('button');
            injectBtn.textContent = 'Inject Prompt';
            injectBtn.style.cssText = 'padding:6px 8px;';
            promptWrap.appendChild(promptInput);
            promptWrap.appendChild(inputSelectorInput);
            promptWrap.appendChild(submitSelectorInput);
            promptWrap.appendChild(imageSelectorInput);
            promptWrap.appendChild(markerWrap);
            promptWrap.appendChild(injectBtn);
            header.appendChild(promptWrap);

            const closeBtn = document.createElement('button');
            closeBtn.textContent = 'Close';
            closeBtn.style.cssText = 'padding:6px 10px;margin-left:12px;';
            header.appendChild(closeBtn);

            const webview = document.createElement('webview');
            webview.style.cssText = 'flex:1;border:0;';
            webview.setAttribute('partition', 'persist:nebula-assistant-test');
            webview.setAttribute('allowpopups', 'true');
            webview.setAttribute('preload', 'src/preload.js');
            // load the test generator (DO NOT use explicit src path)
            webview.src = 'tools/test-webview-generator.html';

            box.appendChild(header);
            box.appendChild(webview);
            modal.appendChild(box);
            document.body.appendChild(modal);

            // store ref so generateImageViaWebview can use it
            this.testWebview = webview;

            // expose a readiness promise so callers can await dom-ready
            this.testWebviewReady = new Promise((resolve) => {
                webview.addEventListener('dom-ready', () => {
                    console.log('Test webview ready');
                    resolve();
                });
            });

            // load button behavior
            loadBtn2.onclick = () => {
                const val = urlInput.value && urlInput.value.trim();
                if (!val) return;
                try { webview.src = val; } catch (e) { console.warn('Failed to load URL in webview', e); }
            };

            // Inject prompt behavior: send a nebula-webview-action message to the host listener
            injectBtn.onclick = () => {
                const p = promptInput.value || '';
                const suffix = markerCheckbox.checked ? '\n\n[nebula-generated-image]' : '';
                // Options can include custom selectors from the header inputs
                const inputSel = (inputSelectorInput && inputSelectorInput.value) ? inputSelectorInput.value : '';
                const submitSel = (submitSelectorInput && submitSelectorInput.value) ? submitSelectorInput.value : '';
                const imageSel = (imageSelectorInput && imageSelectorInput.value) ? imageSelectorInput.value : '';
                window.postMessage({ type: 'nebula-webview-action', options: { prompt: p, promptSuffix: suffix, inputSelector: inputSel, submitSelector: submitSel, imageSelector: imageSel } }, '*');
                // provide UI feedback
                promptInput.disabled = true;
                injectBtn.disabled = true;
                markerCheckbox.disabled = true;
                setTimeout(() => { promptInput.disabled = false; injectBtn.disabled = false; markerCheckbox.disabled = false; }, 12000);
            };

            // on close, remove and clear ref
            closeBtn.onclick = () => {
                try { modal.remove(); } catch (e) {}
                try { this.testWebview = null; this.testWebviewReady = null; } catch (e) {}
            };
        } catch (err) {
            console.error('Failed to open test webview modal', err);
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
     * Save a generated image to the assistant cache (localStorage)
     */
    _saveCacheEntry(key, entry) {
        try {
            const store = JSON.parse(localStorage.getItem('nebula-assistant-gen-cache') || '{}');
            store[key] = { ...entry, ts: Date.now() };
            localStorage.setItem('nebula-assistant-gen-cache', JSON.stringify(store));
        } catch (e) {
            console.warn('Failed to save cache entry', e);
        }
    }

    _getCacheEntry(key) {
        try {
            const store = JSON.parse(localStorage.getItem('nebula-assistant-gen-cache') || '{}');
            return store[key] || null;
        } catch (e) {
            return null;
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