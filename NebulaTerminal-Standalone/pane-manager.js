// PaneManager - Manages split panes within a tab
// Part of Nebula Terminal v3.0 - Ultimate Customizable Terminal

class PaneManager {
    constructor(tabContainer, tabId) {
        this.tabContainer = tabContainer;
        this.tabId = tabId;
        this.panes = [];
        this.activePaneId = null;
        this.nextPaneId = 1;
        this.layout = null; // Root layout node
    }

    async init() {
        // Create initial single pane layout
        const paneContainer = document.createElement('div');
        paneContainer.className = 'pane-container';
        this.tabContainer.appendChild(paneContainer);

        // Create first pane
        await this.createPane(paneContainer, true);
    }

    async createPane(container, isInitial = false) {
        const paneId = this.nextPaneId++;
        const settings = window.settingsManager.settings;

        // Create pane element
        const paneElement = document.createElement('div');
        paneElement.className = 'pane';
        paneElement.dataset.paneId = paneId;

        // Create pane header
        const paneHeader = document.createElement('div');
        paneHeader.className = 'pane-header';
        paneHeader.innerHTML = `
            <div class="pane-title">Pane ${paneId}</div>
            <div class="pane-controls">
                <button class="pane-control-btn split-horizontal" title="Split Horizontal (Ctrl+Shift+H)">⬌</button>
                <button class="pane-control-btn split-vertical" title="Split Vertical (Ctrl+Shift+V)">⬍</button>
                ${!isInitial ? '<button class="pane-control-btn close-pane" title="Close Pane (Ctrl+Shift+W)">×</button>' : ''}
            </div>
        `;

        // Create pane content
        const paneContent = document.createElement('div');
        paneContent.className = 'pane-content';

        paneElement.appendChild(paneHeader);
        paneElement.appendChild(paneContent);
        container.appendChild(paneElement);

        // Create terminal instance
        const term = new Terminal({
            cursorBlink: settings.cursorBlink,
            cursorStyle: settings.cursorStyle,
            fontFamily: settings.fontFamily,
            fontSize: settings.fontSize,
            lineHeight: 1.2,
            letterSpacing: 0,
            theme: {},
            allowProposedApi: true
        });

        // Load addons
        const fitAddon = new FitAddon.FitAddon();
        const webLinksAddon = new WebLinksAddon.WebLinksAddon();
        const searchAddon = new SearchAddon.SearchAddon();

        term.loadAddon(fitAddon);
        term.loadAddon(webLinksAddon);
        term.loadAddon(searchAddon);

        // Apply theme
        window.themeEngine.applyTheme(term, settings.theme);

        // Open terminal in pane
        term.open(paneContent);
        fitAddon.fit();

        // Create PTY for this pane
        const ptyData = await window.terminal.create();
        const ptyId = ptyData.id;

        console.log(`Pane ${paneId} created with PTY ${ptyId}`);

        // Setup PTY data handler
        window.terminal.onData(ptyId, (data) => {
            term.write(data);
        });

        // Setup terminal input handler
        term.onData((data) => {
            window.terminal.write(ptyId, data);
        });

        // Setup resize handler
        const resizeHandler = () => {
            fitAddon.fit();
            window.terminal.resize(ptyId, term.cols, term.rows);
        };
        window.addEventListener('resize', resizeHandler);

        // Create pane object
        const pane = {
            id: paneId,
            term,
            fitAddon,
            searchAddon,
            ptyId,
            element: paneElement,
            container,
            resizeHandler
        };

        this.panes.push(pane);

        // Setup event listeners
        this.setupPaneEventListeners(pane, isInitial);

        // Focus pane
        this.focusPane(paneId);

        // Fit terminal
        setTimeout(() => {
            fitAddon.fit();
            window.terminal.resize(ptyId, term.cols, term.rows);
        }, 100);

        return pane;
    }

    setupPaneEventListeners(pane, isInitial) {
        // Click to focus
        pane.element.addEventListener('click', () => {
            this.focusPane(pane.id);
        });

        const header = pane.element.querySelector('.pane-header');

        // Split horizontal button
        const splitHBtn = header.querySelector('.split-horizontal');
        if (splitHBtn) {
            splitHBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.splitPane(pane.id, 'horizontal');
            });
        }

        // Split vertical button
        const splitVBtn = header.querySelector('.split-vertical');
        if (splitVBtn) {
            splitVBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.splitPane(pane.id, 'vertical');
            });
        }

        // Close button (only if not initial pane)
        if (!isInitial) {
            const closeBtn = header.querySelector('.close-pane');
            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.closePane(pane.id);
                });
            }
        }
    }

    async splitPane(paneId, direction) {
        const pane = this.getPane(paneId);
        if (!pane) return;

        const parentContainer = pane.container;

        // Create new container for split
        const splitContainer = document.createElement('div');
        splitContainer.className = `pane-container ${direction}`;

        // Move existing pane into split container
        pane.element.remove();
        splitContainer.appendChild(pane.element);

        // Create divider
        const divider = document.createElement('div');
        divider.className = `pane-divider ${direction}`;
        splitContainer.appendChild(divider);

        // Setup divider resizing
        this.setupDividerResize(divider, direction);

        // Update pane's container reference
        pane.container = splitContainer;

        // Create new pane
        const newPane = await this.createPane(splitContainer);

        // Add split container to parent
        parentContainer.appendChild(splitContainer);

        // Fit both panes
        setTimeout(() => {
            pane.fitAddon.fit();
            newPane.fitAddon.fit();
            window.terminal.resize(pane.ptyId, pane.term.cols, pane.term.rows);
            window.terminal.resize(newPane.ptyId, newPane.term.cols, newPane.term.rows);
        }, 100);

        console.log(`Split pane ${paneId} ${direction}`);
    }

    setupDividerResize(divider, direction) {
        let isDragging = false;
        let startPos = 0;
        let startSizes = [];

        divider.addEventListener('mousedown', (e) => {
            isDragging = true;
            divider.classList.add('dragging');
            startPos = direction === 'horizontal' ? e.clientX : e.clientY;

            // Get panes in this container
            const container = divider.parentElement;
            const panes = Array.from(container.querySelectorAll(':scope > .pane'));
            startSizes = panes.map(pane => {
                const rect = pane.getBoundingClientRect();
                return direction === 'horizontal' ? rect.width : rect.height;
            });

            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
            const delta = currentPos - startPos;

            const container = divider.parentElement;
            const panes = Array.from(container.querySelectorAll(':scope > .pane'));

            if (panes.length >= 2) {
                const pane1 = panes[0];
                const pane2 = panes[1];

                const size1 = Math.max(100, startSizes[0] + delta);
                const size2 = Math.max(100, startSizes[1] - delta);

                if (direction === 'horizontal') {
                    pane1.style.flex = `0 0 ${size1}px`;
                    pane2.style.flex = `0 0 ${size2}px`;
                } else {
                    pane1.style.flex = `0 0 ${size1}px`;
                    pane2.style.flex = `0 0 ${size2}px`;
                }

                // Fit terminals
                this.panes.forEach(pane => {
                    if (pane.element === pane1 || pane.element === pane2) {
                        pane.fitAddon.fit();
                        window.terminal.resize(pane.ptyId, pane.term.cols, pane.term.rows);
                    }
                });
            }
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                divider.classList.remove('dragging');
            }
        });
    }

    async closePane(paneId) {
        const pane = this.getPane(paneId);
        if (!pane) return;

        // Don't close if it's the only pane
        if (this.panes.length === 1) {
            console.log('Cannot close last pane in tab');
            return;
        }

        // Find sibling pane in the same container
        const container = pane.container;
        const siblingPanes = Array.from(container.querySelectorAll(':scope > .pane'));
        const sibling = siblingPanes.find(p => p.dataset.paneId !== String(paneId));

        if (sibling && container.parentElement) {
            // Remove the split container and replace with sibling
            const parent = container.parentElement;
            sibling.remove();
            container.remove();
            parent.appendChild(sibling);

            // Update sibling pane's container reference
            const siblingPane = this.getPane(parseInt(sibling.dataset.paneId));
            if (siblingPane) {
                siblingPane.container = parent;
                siblingPane.element.style.flex = '1';
                setTimeout(() => {
                    siblingPane.fitAddon.fit();
                    window.terminal.resize(siblingPane.ptyId, siblingPane.term.cols, siblingPane.term.rows);
                }, 100);
            }
        }

        // Remove pane from array
        const paneIndex = this.panes.findIndex(p => p.id === paneId);
        this.panes.splice(paneIndex, 1);

        // Cleanup
        window.removeEventListener('resize', pane.resizeHandler);
        pane.term.dispose();
        pane.element.remove();

        // Kill PTY
        await window.terminal.kill(pane.ptyId);

        // Focus another pane
        if (this.panes.length > 0) {
            this.focusPane(this.panes[0].id);
        }

        console.log(`Pane ${paneId} closed`);
    }

    focusPane(paneId) {
        // Unfocus current pane
        if (this.activePaneId !== null) {
            const currentPane = this.getPane(this.activePaneId);
            if (currentPane) {
                currentPane.element.classList.remove('active');
            }
        }

        // Focus new pane
        const newPane = this.getPane(paneId);
        if (newPane) {
            newPane.element.classList.add('active');
            this.activePaneId = paneId;

            // Update global terminal instance reference
            window.terminalInstance = newPane.term;
            window.fitAddon = newPane.fitAddon;

            // Focus terminal
            newPane.term.focus();
        }
    }

    getPane(paneId) {
        return this.panes.find(pane => pane.id === paneId);
    }

    getActivePane() {
        return this.getPane(this.activePaneId);
    }

    getAllPanes() {
        return this.panes;
    }

    // Font size controls for active pane
    increaseFontSize() {
        const activePane = this.getActivePane();
        if (activePane) {
            const currentSize = activePane.term.options.fontSize;
            activePane.term.options.fontSize = Math.min(currentSize + 1, 32);
            activePane.fitAddon.fit();
            window.settingsManager.set('fontSize', activePane.term.options.fontSize);
        }
    }

    decreaseFontSize() {
        const activePane = this.getActivePane();
        if (activePane) {
            const currentSize = activePane.term.options.fontSize;
            activePane.term.options.fontSize = Math.max(currentSize - 1, 8);
            activePane.fitAddon.fit();
            window.settingsManager.set('fontSize', activePane.term.options.fontSize);
        }
    }

    resetFontSize() {
        const activePane = this.getActivePane();
        if (activePane) {
            activePane.term.options.fontSize = 14;
            activePane.fitAddon.fit();
            window.settingsManager.set('fontSize', 14);
        }
    }
}

// Export PaneManager globally
window.PaneManager = PaneManager;
