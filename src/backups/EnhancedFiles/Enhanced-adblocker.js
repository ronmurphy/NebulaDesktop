// Enhanced Adblocker App for NebulaDesktop
class NebulaAdblocker {
    constructor() {
        this.windowId = null;
        this.engine = null;
        this.isEnabled = localStorage.getItem('nebula-adblocker-enabled') !== 'false';
        this.blockedCount = parseInt(localStorage.getItem('nebula-adblocker-blocked-count') || '0');
        this.whitelist = JSON.parse(localStorage.getItem('nebula-adblocker-whitelist') || '[]');
        this.blocklist = JSON.parse(localStorage.getItem('nebula-adblocker-blocklist') || '[]');
        this.filterLists = JSON.parse(localStorage.getItem('nebula-adblocker-filter-lists') || JSON.stringify([
            'https://easylist.to/easylist/easylist.txt',
            'https://easylist.to/easylist/easyprivacy.txt'
        ]));
        this.stats = {
            totalBlocked: this.blockedCount,
            sessionsBlocked: 0,
            topBlockedDomains: JSON.parse(localStorage.getItem('nebula-adblocker-top-domains') || '{}')
        };
        
        this.init();
    }

    async init() {
        if (!window.windowManager) {
            console.error('WindowManager not available');
            return;
        }
        
        // Create a window for the adblocker app
        this.windowId = window.windowManager.createWindow({
            title: '🛡️ Adblocker',
            icon: '🛡️',
            width: 900,
            height: 600,
            resizable: true,
            maximizable: true,
            minimizable: true
        });
        
        // Load this adblocker app into the window
        window.windowManager.loadApp(this.windowId, this);
        
        // Initialize the adblocker engine
        await this.initializeEngine();
        
        console.log(`Adblocker app initialized with window ${this.windowId}`);
    }

    async initializeEngine() {
        try {
            // For demo purposes, we'll simulate the Ghostery adblocker
            // In a real implementation, you would install @ghostery/adblocker via npm
            this.engine = {
                match: (request) => {
                    // Simulate ad blocking logic
                    const url = request.url || request;
                    const adPatterns = [
                        /ads?\./,
                        /doubleclick/,
                        /googleadservices/,
                        /googlesyndication/,
                        /amazon-adsystem/,
                        /facebook\.com\/tr/,
                        /analytics/,
                        /tracking/,
                        /metrics/
                    ];
                    
                    const isBlocked = adPatterns.some(pattern => pattern.test(url));
                    
                    if (isBlocked && this.isEnabled) {
                        this.incrementBlockedCount(url);
                        return { match: true, filter: { toString: () => 'Simulated ad filter' } };
                    }
                    
                    return { match: false };
                }
            };
            
            console.log('Adblocker engine initialized');
        } catch (error) {
            console.error('Failed to initialize adblocker engine:', error);
        }
    }

    incrementBlockedCount(url) {
        this.blockedCount++;
        this.stats.totalBlocked++;
        this.stats.sessionsBlocked++;
        
        // Track top blocked domains
        try {
            const domain = new URL(url).hostname;
            this.stats.topBlockedDomains[domain] = (this.stats.topBlockedDomains[domain] || 0) + 1;
        } catch (e) {
            // Invalid URL
        }
        
        localStorage.setItem('nebula-adblocker-blocked-count', this.blockedCount.toString());
        localStorage.setItem('nebula-adblocker-top-domains', JSON.stringify(this.stats.topBlockedDomains));
        
        // Update UI if window is open
        this.updateStats();
    }

    updateStats() {
        const statsElements = {
            totalBlocked: document.getElementById(`totalBlocked-${this.windowId}`),
            sessionBlocked: document.getElementById(`sessionBlocked-${this.windowId}`),
            topDomains: document.getElementById(`topDomains-${this.windowId}`)
        };

        if (statsElements.totalBlocked) {
            statsElements.totalBlocked.textContent = this.stats.totalBlocked.toLocaleString();
        }
        
        if (statsElements.sessionBlocked) {
            statsElements.sessionBlocked.textContent = this.stats.sessionsBlocked.toLocaleString();
        }
        
        if (statsElements.topDomains) {
            const topDomains = Object.entries(this.stats.topBlockedDomains)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5);
            
            statsElements.topDomains.innerHTML = topDomains.map(([domain, count]) => `
                <div style="display: flex; justify-content: space-between; padding: var(--nebula-space-xs) 0;">
                    <span style="color: var(--nebula-text-primary);">${domain}</span>
                    <span style="color: var(--nebula-text-secondary);">${count}</span>
                </div>
            `).join('') || '<div style="color: var(--nebula-text-secondary); text-align: center; padding: var(--nebula-space-md);">No blocked domains yet</div>';
        }
    }

    render() {
        const container = document.createElement('div');
        container.className = 'adblocker-container';
        container.style.cssText = `
            width: 100%;
            height: 100%;
            background: var(--nebula-bg-primary);
            color: var(--nebula-text-primary);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            overflow-y: auto;
            padding: var(--nebula-space-xl);
        `;
        
        container.innerHTML = `
            <div class="adblocker-header" style="margin-bottom: var(--nebula-space-xl);">
                <h1 style="color: var(--nebula-text-primary); margin: 0 0 var(--nebula-space-sm) 0; font-size: 28px; font-weight: 700; display: flex; align-items: center; gap: var(--nebula-space-md);">
                    <span style="font-size: 32px;">🛡️</span>
                    Adblocker
                </h1>
                <p style="color: var(--nebula-text-secondary); margin: 0; font-size: 16px;">Block ads, trackers, and malicious content</p>
            </div>

            <!-- Main Toggle -->
            <div class="main-toggle" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: var(--nebula-radius-lg); padding: var(--nebula-space-lg); margin-bottom: var(--nebula-space-lg);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h3 style="color: var(--nebula-text-primary); margin: 0 0 var(--nebula-space-xs) 0; font-size: 18px; font-weight: 600;">Adblocker Protection</h3>
                        <p style="color: var(--nebula-text-secondary); margin: 0; font-size: 14px;">Block ads and trackers across all websites</p>
                    </div>
                    <label class="main-toggle-switch" style="position: relative; display: inline-block; width: 60px; height: 30px;">
                        <input type="checkbox" id="mainToggle" ${this.isEnabled ? 'checked' : ''} style="opacity: 0; width: 0; height: 0;">
                        <span style="
                            position: absolute;
                            cursor: pointer;
                            top: 0;
                            left: 0;
                            right: 0;
                            bottom: 0;
                            background: ${this.isEnabled ? 'var(--nebula-primary)' : 'var(--nebula-border)'};
                            transition: var(--nebula-transition);
                            border-radius: 30px;
                        ">
                            <span style="
                                position: absolute;
                                content: '';
                                height: 22px;
                                width: 22px;
                                left: ${this.isEnabled ? '34px' : '4px'};
                                bottom: 4px;
                                background: white;
                                transition: var(--nebula-transition);
                                border-radius: 50%;
                            "></span>
                        </span>
                    </label>
                </div>
            </div>

            <!-- Statistics -->
            <div class="stats-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: var(--nebula-radius-lg); padding: var(--nebula-space-lg); margin-bottom: var(--nebula-space-lg);">
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 var(--nebula-space-md) 0; font-size: 18px; font-weight: 600;">Statistics</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--nebula-space-md); margin-bottom: var(--nebula-space-lg);">
                    <div class="stat-card" style="background: var(--nebula-surface-elevated); border: 1px solid var(--nebula-border); border-radius: var(--nebula-radius-md); padding: var(--nebula-space-md); text-align: center;">
                        <div style="font-size: 24px; font-weight: 700; color: var(--nebula-primary); margin-bottom: var(--nebula-space-xs);" id="totalBlocked-${this.windowId}">${this.stats.totalBlocked.toLocaleString()}</div>
                        <div style="color: var(--nebula-text-secondary); font-size: 12px;">Total Blocked</div>
                    </div>
                    <div class="stat-card" style="background: var(--nebula-surface-elevated); border: 1px solid var(--nebula-border); border-radius: var(--nebula-radius-md); padding: var(--nebula-space-md); text-align: center;">
                        <div style="font-size: 24px; font-weight: 700; color: var(--nebula-success); margin-bottom: var(--nebula-space-xs);" id="sessionBlocked-${this.windowId}">${this.stats.sessionsBlocked.toLocaleString()}</div>
                        <div style="color: var(--nebula-text-secondary); font-size: 12px;">This Session</div>
                    </div>
                    <div class="stat-card" style="background: var(--nebula-surface-elevated); border: 1px solid var(--nebula-border); border-radius: var(--nebula-radius-md); padding: var(--nebula-space-md); text-align: center;">
                        <div style="font-size: 24px; font-weight: 700; color: var(--nebula-warning); margin-bottom: var(--nebula-space-xs);">${this.filterLists.length}</div>
                        <div style="color: var(--nebula-text-secondary); font-size: 12px;">Filter Lists</div>
                    </div>
                </div>
                
                <div style="background: var(--nebula-surface-elevated); border: 1px solid var(--nebula-border); border-radius: var(--nebula-radius-md); padding: var(--nebula-space-md);">
                    <h4 style="color: var(--nebula-text-primary); margin: 0 0 var(--nebula-space-sm) 0; font-size: 14px; font-weight: 600;">Top Blocked Domains</h4>
                    <div id="topDomains-${this.windowId}">
                        <!-- Will be populated by updateStats() -->
                    </div>
                </div>
            </div>

            <!-- Filter Lists Management -->
            <div class="filter-lists-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: var(--nebula-radius-lg); padding: var(--nebula-space-lg); margin-bottom: var(--nebula-space-lg);">
                <h3 style="color: var(--nebula-text-primary); margin: 0 0 var(--nebula-space-md) 0; font-size: 18px; font-weight: 600;">Filter Lists</h3>
                <div id="filterListsContainer">
                    ${this.renderFilterLists()}
                </div>
                <div style="margin-top: var(--nebula-space-md);">
                    <input type="url" id="newFilterListUrl" placeholder="Enter filter list URL..." style="
                        flex: 1;
                        padding: var(--nebula-space-sm) var(--nebula-space-md);
                        border: 1px solid var(--nebula-border);
                        border-radius: var(--nebula-radius-md);
                        background: var(--nebula-surface);
                        color: var(--nebula-text-primary);
                        margin-right: var(--nebula-space-sm);
                        width: calc(100% - 120px);
                    ">
                    <button id="addFilterList" style="
                        background: var(--nebula-primary);
                        color: white;
                        border: none;
                        padding: var(--nebula-space-sm) var(--nebula-space-md);
                        border-radius: var(--nebula-radius-md);
                        cursor: pointer;
                        font-weight: 500;
                        width: 100px;
                        margin-left: var(--nebula-space-sm);
                    ">Add List</button>
                </div>
            </div>

            <!-- Whitelist/Blacklist Management -->
            <div class="lists-management" style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--nebula-space-lg);">
                <!-- Whitelist -->
                <div class="whitelist-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: var(--nebula-radius-lg); padding: var(--nebula-space-lg);">
                    <h3 style="color: var(--nebula-text-primary); margin: 0 0 var(--nebula-space-md) 0; font-size: 18px; font-weight: 600;">Whitelist</h3>
                    <p style="color: var(--nebula-text-secondary); margin: 0 0 var(--nebula-space-md) 0; font-size: 12px;">Domains that will never be blocked</p>
                    <div id="whitelistContainer" style="max-height: 200px; overflow-y: auto; margin-bottom: var(--nebula-space-md);">
                        ${this.renderDomainList(this.whitelist, 'whitelist')}
                    </div>
                    <div style="display: flex; gap: var(--nebula-space-sm);">
                        <input type="text" id="newWhitelistDomain" placeholder="example.com" style="
                            flex: 1;
                            padding: var(--nebula-space-sm);
                            border: 1px solid var(--nebula-border);
                            border-radius: var(--nebula-radius-md);
                            background: var(--nebula-surface);
                            color: var(--nebula-text-primary);
                        ">
                        <button id="addWhitelistDomain" style="
                            background: var(--nebula-success);
                            color: white;
                            border: none;
                            padding: var(--nebula-space-sm) var(--nebula-space-md);
                            border-radius: var(--nebula-radius-md);
                            cursor: pointer;
                            font-weight: 500;
                        ">Add</button>
                    </div>
                </div>

                <!-- Blacklist -->
                <div class="blacklist-section" style="background: var(--nebula-surface); border: 1px solid var(--nebula-border); border-radius: var(--nebula-radius-lg); padding: var(--nebula-space-lg);">
                    <h3 style="color: var(--nebula-text-primary); margin: 0 0 var(--nebula-space-md) 0; font-size: 18px; font-weight: 600;">Blacklist</h3>
                    <p style="color: var(--nebula-text-secondary); margin: 0 0 var(--nebula-space-md) 0; font-size: 12px;">Additional domains to block</p>
                    <div id="blacklistContainer" style="max-height: 200px; overflow-y: auto; margin-bottom: var(--nebula-space-md);">
                        ${this.renderDomainList(this.blocklist, 'blacklist')}
                    </div>
                    <div style="display: flex; gap: var(--nebula-space-sm);">
                        <input type="text" id="newBlacklistDomain" placeholder="ads.example.com" style="
                            flex: 1;
                            padding: var(--nebula-space-sm);
                            border: 1px solid var(--nebula-border);
                            border-radius: var(--nebula-radius-md);
                            background: var(--nebula-surface);
                            color: var(--nebula-text-primary);
                        ">
                        <button id="addBlacklistDomain" style="
                            background: var(--nebula-danger);
                            color: white;
                            border: none;
                            padding: var(--nebula-space-sm) var(--nebula-space-md);
                            border-radius: var(--nebula-radius-md);
                            cursor: pointer;
                            font-weight: 500;
                        ">Add</button>
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners(container);
        this.updateStats();

        return container;
    }

    renderFilterLists() {
        return this.filterLists.map((url, index) => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--nebula-space-sm); border: 1px solid var(--nebula-border); border-radius: var(--nebula-radius-md); margin-bottom: var(--nebula-space-sm);">
                <div>
                    <div style="color: var(--nebula-text-primary); font-weight: 500; font-size: 14px;">${this.getFilterListName(url)}</div>
                    <div style="color: var(--nebula-text-secondary); font-size: 12px;">${url}</div>
                </div>
                <button class="remove-filter-list" data-index="${index}" style="
                    background: var(--nebula-danger);
                    color: white;
                    border: none;
                    padding: var(--nebula-space-xs) var(--nebula-space-sm);
                    border-radius: var(--nebula-radius-sm);
                    cursor: pointer;
                    font-size: 12px;
                ">Remove</button>
            </div>
        `).join('');
    }

    renderDomainList(domains, type) {
        if (domains.length === 0) {
            return `<div style="color: var(--nebula-text-secondary); text-align: center; padding: var(--nebula-space-md);">No domains added</div>`;
        }

        return domains.map((domain, index) => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--nebula-space-xs) var(--nebula-space-sm); border: 1px solid var(--nebula-border); border-radius: var(--nebula-radius-sm); margin-bottom: var(--nebula-space-xs);">
                <span style="color: var(--nebula-text-primary); font-size: 14px;">${domain}</span>
                <button class="remove-domain" data-type="${type}" data-index="${index}" style="
                    background: var(--nebula-danger);
                    color: white;
                    border: none;
                    padding: 2px 6px;
                    border-radius: var(--nebula-radius-sm);
                    cursor: pointer;
                    font-size: 10px;
                ">×</button>
            </div>
        `).join('');
    }

    getFilterListName(url) {
        const names = {
            'https://easylist.to/easylist/easylist.txt': 'EasyList',
            'https://easylist.to/easylist/easyprivacy.txt': 'EasyPrivacy',
            'https://secure.fanboy.co.nz/fanboy-annoyance.txt': 'Fanboy Annoyances',
            'https://easylist-downloads.adblockplus.org/malwaredomains_full.txt': 'Malware Domains'
        };
        return names[url] || 'Custom List';
    }

    setupEventListeners(container) {
        // Main toggle
        const mainToggle = container.querySelector('#mainToggle');
        mainToggle.addEventListener('change', () => {
            this.isEnabled = mainToggle.checked;
            localStorage.setItem('nebula-adblocker-enabled', this.isEnabled.toString());
            
            // Update toggle appearance
            const slider = mainToggle.nextElementSibling;
            const knob = slider.querySelector('span');
            slider.style.background = this.isEnabled ? 'var(--nebula-primary)' : 'var(--nebula-border)';
            knob.style.left = this.isEnabled ? '34px' : '4px';
        });

        // Add filter list
        const addFilterListBtn = container.querySelector('#addFilterList');
        const newFilterListInput = container.querySelector('#newFilterListUrl');
        
        addFilterListBtn.addEventListener('click', () => {
            const url = newFilterListInput.value.trim();
            if (url && !this.filterLists.includes(url)) {
                this.filterLists.push(url);
                localStorage.setItem('nebula-adblocker-filter-lists', JSON.stringify(this.filterLists));
                
                // Update UI
                const filterListsContainer = container.querySelector('#filterListsContainer');
                filterListsContainer.innerHTML = this.renderFilterLists();
                this.setupFilterListListeners(container);
                
                newFilterListInput.value = '';
            }
        });

        // Add whitelist domain
        const addWhitelistBtn = container.querySelector('#addWhitelistDomain');
        const newWhitelistInput = container.querySelector('#newWhitelistDomain');
        
        addWhitelistBtn.addEventListener('click', () => {
            const domain = newWhitelistInput.value.trim();
            if (domain && !this.whitelist.includes(domain)) {
                this.whitelist.push(domain);
                localStorage.setItem('nebula-adblocker-whitelist', JSON.stringify(this.whitelist));
                
                // Update UI
                const whitelistContainer = container.querySelector('#whitelistContainer');
                whitelistContainer.innerHTML = this.renderDomainList(this.whitelist, 'whitelist');
                this.setupDomainListListeners(container);
                
                newWhitelistInput.value = '';
            }
        });

        // Add blacklist domain
        const addBlacklistBtn = container.querySelector('#addBlacklistDomain');
        const newBlacklistInput = container.querySelector('#newBlacklistDomain');
        
        addBlacklistBtn.addEventListener('click', () => {
            const domain = newBlacklistInput.value.trim();
            if (domain && !this.blocklist.includes(domain)) {
                this.blocklist.push(domain);
                localStorage.setItem('nebula-adblocker-blocklist', JSON.stringify(this.blocklist));
                
                // Update UI
                const blacklistContainer = container.querySelector('#blacklistContainer');
                blacklistContainer.innerHTML = this.renderDomainList(this.blocklist, 'blacklist');
                this.setupDomainListListeners(container);
                
                newBlacklistInput.value = '';
            }
        });

        this.setupFilterListListeners(container);
        this.setupDomainListListeners(container);
    }

    setupFilterListListeners(container) {
        container.querySelectorAll('.remove-filter-list').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                this.filterLists.splice(index, 1);
                localStorage.setItem('nebula-adblocker-filter-lists', JSON.stringify(this.filterLists));
                
                // Update UI
                const filterListsContainer = container.querySelector('#filterListsContainer');
                filterListsContainer.innerHTML = this.renderFilterLists();
                this.setupFilterListListeners(container);
            });
        });
    }

    setupDomainListListeners(container) {
        container.querySelectorAll('.remove-domain').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                const index = parseInt(btn.dataset.index);
                
                if (type === 'whitelist') {
                    this.whitelist.splice(index, 1);
                    localStorage.setItem('nebula-adblocker-whitelist', JSON.stringify(this.whitelist));
                    
                    const whitelistContainer = container.querySelector('#whitelistContainer');
                    whitelistContainer.innerHTML = this.renderDomainList(this.whitelist, 'whitelist');
                } else if (type === 'blacklist') {
                    this.blocklist.splice(index, 1);
                    localStorage.setItem('nebula-adblocker-blocklist', JSON.stringify(this.blocklist));
                    
                    const blacklistContainer = container.querySelector('#blacklistContainer');
                    blacklistContainer.innerHTML = this.renderDomainList(this.blocklist, 'blacklist');
                }
                
                this.setupDomainListListeners(container);
            });
        });
    }

    // Public API for browser integration
    shouldBlock(url) {
        if (!this.isEnabled || !this.engine) return false;
        
        try {
            // Check whitelist first
            const hostname = new URL(url).hostname;
            if (this.whitelist.some(domain => hostname.includes(domain))) {
                return false;
            }
            
            // Check blacklist
            if (this.blocklist.some(domain => hostname.includes(domain))) {
                this.incrementBlockedCount(url);
                return true;
            }
            
            // Use engine to check
            const result = this.engine.match({ url });
            return result.match;
        } catch (error) {
            console.error('Error checking if URL should be blocked:', error);
            return false;
        }
    }

    getTitle() {
        return 'Adblocker';
    }

    getIcon() {
        return '🛡️';
    }

    cleanup() {
        console.log('Adblocker app cleanup');
    }
}

// Export for use in other files
window.NebulaAdblocker = NebulaAdblocker;

