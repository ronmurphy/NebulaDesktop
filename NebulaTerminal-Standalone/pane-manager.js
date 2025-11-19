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
        this.inlineContentManager = new InlineContentManager(this);
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

        // Command buffer for intercepting special commands
        let commandBuffer = '';

        // Setup terminal input handler with command interception
        term.onData((data) => {
            // Check if it's Enter key
            if (data === '\r' || data === '\n') {
                const trimmed = commandBuffer.trim();

                // Try to intercept Nebula inline commands BEFORE sending to PTY
                if (trimmed && this.inlineContentManager.interceptCommand(trimmed, pane)) {
                    // Command was intercepted! Don't send to PTY
                    term.write('\r\n');  // Visual feedback - new line
                    commandBuffer = '';
                    // The interceptCommand method will show success message and new prompt
                    return;
                }

                // Not a Nebula command - send the entire buffered command + Enter to PTY
                if (commandBuffer) {
                    window.terminal.write(ptyId, commandBuffer);
                }
                window.terminal.write(ptyId, data);  // Send Enter
                commandBuffer = '';
            } else if (data === '\x7f' || data === '\b') {
                // Backspace - remove from buffer and display
                if (commandBuffer.length > 0) {
                    commandBuffer = commandBuffer.slice(0, -1);
                    term.write('\b \b');  // Erase character visually
                }
            } else if (data === '\x03') {
                // Ctrl+C - send to PTY and clear buffer
                commandBuffer = '';
                window.terminal.write(ptyId, data);
            } else if (data === '\x04') {
                // Ctrl+D - send to PTY (don't buffer)
                window.terminal.write(ptyId, data);
            } else if (data.charCodeAt(0) < 32 && data !== '\t') {
                // Other control characters - send directly to PTY
                window.terminal.write(ptyId, data);
            } else {
                // Regular character - buffer it and echo to terminal display only
                commandBuffer += data;
                term.write(data);  // Echo to display, but DON'T send to PTY yet
            }
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

        // Drag and drop functionality
        this.setupPaneDragAndDrop(pane, header);
    }

    setupPaneDragAndDrop(pane, header) {
        let isDragging = false;
        let dragStartX = 0;
        let dragStartY = 0;
        let dropZoneOverlay = null;

        header.addEventListener('mousedown', (e) => {
            // Don't start drag if clicking on buttons
            if (e.target.tagName === 'BUTTON') return;

            isDragging = true;
            dragStartX = e.clientX;
            dragStartY = e.clientY;

            // Add dragging class after small movement to prevent accidental drags
            const onMove = (moveEvent) => {
                const deltaX = Math.abs(moveEvent.clientX - dragStartX);
                const deltaY = Math.abs(moveEvent.clientY - dragStartY);

                if (deltaX > 5 || deltaY > 5) {
                    pane.element.classList.add('dragging');
                    this.createDropZoneOverlay(pane);
                    document.removeEventListener('mousemove', onMove);
                }
            };

            document.addEventListener('mousemove', onMove);

            const cleanup = () => {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', cleanup);
            };
            document.addEventListener('mouseup', cleanup);
        });

        document.addEventListener('mouseup', (e) => {
            if (!isDragging) return;

            isDragging = false;
            pane.element.classList.remove('dragging');

            // Check if dropped on a drop zone
            const dropZone = document.elementFromPoint(e.clientX, e.clientY);
            if (dropZone && dropZone.classList.contains('drop-zone')) {
                const targetPaneId = parseInt(dropZone.dataset.targetPane);
                const dropPosition = dropZone.dataset.position;

                if (targetPaneId && dropPosition) {
                    this.reorganizePane(pane.id, targetPaneId, dropPosition);
                }
            }

            // Remove drop zone overlay
            this.removeDropZoneOverlay();
        });
    }

    createDropZoneOverlay(draggedPane) {
        // Remove existing overlay
        this.removeDropZoneOverlay();

        // Create overlay for each pane
        this.panes.forEach(targetPane => {
            if (targetPane.id === draggedPane.id) return; // Skip dragged pane

            const overlay = document.createElement('div');
            overlay.className = 'pane-drop-zone-overlay active';

            // Create drop zones: left, right, top, bottom, center
            const positions = ['left', 'right', 'top', 'bottom', 'center'];
            positions.forEach(pos => {
                const zone = document.createElement('div');
                zone.className = `drop-zone ${pos}`;
                zone.dataset.targetPane = targetPane.id;
                zone.dataset.position = pos;

                // Add hover effect
                zone.addEventListener('mouseenter', () => {
                    zone.classList.add('hover');
                });
                zone.addEventListener('mouseleave', () => {
                    zone.classList.remove('hover');
                });

                overlay.appendChild(zone);
            });

            targetPane.element.appendChild(overlay);
        });
    }

    removeDropZoneOverlay() {
        document.querySelectorAll('.pane-drop-zone-overlay').forEach(overlay => {
            overlay.remove();
        });
    }

    reorganizePane(sourcePaneId, targetPaneId, position) {
        console.log(`Reorganize pane ${sourcePaneId} to ${position} of pane ${targetPaneId}`);

        const sourcePane = this.getPane(sourcePaneId);
        const targetPane = this.getPane(targetPaneId);

        if (!sourcePane || !targetPane) return;

        // For now, just split the target pane and move source content
        // In a full implementation, this would reorganize the layout tree

        if (position === 'center') {
            // Swap pane contents
            this.swapPanes(sourcePaneId, targetPaneId);
        } else {
            // Create split and move pane
            const direction = (position === 'left' || position === 'right') ? 'vertical' : 'horizontal';
            this.splitPane(targetPaneId, direction);

            // Move source pane content to new pane
            setTimeout(() => {
                const newPane = this.panes[this.panes.length - 1];
                if (position === 'left' || position === 'top') {
                    // Swap to put dragged pane first
                    this.swapPanes(sourcePaneId, newPane.id);
                } else {
                    // Move dragged pane to new position
                    this.swapPanes(sourcePaneId, newPane.id);
                }
            }, 100);
        }
    }

    swapPanes(paneId1, paneId2) {
        const pane1 = this.getPane(paneId1);
        const pane2 = this.getPane(paneId2);

        if (!pane1 || !pane2) return;

        // Swap PTY IDs and terminal instances
        const tempPtyId = pane1.ptyId;
        const tempTerm = pane1.term;
        const tempFitAddon = pane1.fitAddon;

        pane1.ptyId = pane2.ptyId;
        pane1.term = pane2.term;
        pane1.fitAddon = pane2.fitAddon;

        pane2.ptyId = tempPtyId;
        pane2.term = tempTerm;
        pane2.fitAddon = tempFitAddon;

        // Re-render terminals in swapped positions
        const content1 = pane1.element.querySelector('.pane-content');
        const content2 = pane2.element.querySelector('.pane-content');

        // Clear and re-attach terminals
        content1.innerHTML = '';
        content2.innerHTML = '';

        pane1.term.open(content1);
        pane2.term.open(content2);

        // Refit
        setTimeout(() => {
            pane1.fitAddon.fit();
            pane2.fitAddon.fit();
            window.terminal.resize(pane1.ptyId, pane1.term.cols, pane1.term.rows);
            window.terminal.resize(pane2.ptyId, pane2.term.cols, pane2.term.rows);
        }, 100);
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
