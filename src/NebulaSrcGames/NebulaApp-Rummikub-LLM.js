class NebulaApp_Rummikub {
  constructor() {
    this.windowId = null;
    this.windowContent = null;

    // 🧠 Centralized game state
    this.state = {
      colors: ["red", "blue", "yellow", "black"],
      tiles: [],
      players: [],
      melds: [],
      turn: 0,
      message: "",
      score: { player: 0, ai1: 0, ai2: 0 },
      gameEnded: false,
      winner: null,
      debugMode: false,
      draggedTile: null,
      selectedMeld: null,
      // 🔧 NEW: Meld building state
      buildingMeld: [], // Tiles being assembled into a new meld
      pendingMelds: [], // Melds being modified but not yet committed
      manipulatedMelds: [], // Store original melds that were moved to building area
      playerMadePlay: false, // Track if player made a move this turn
    };

    // 🎨 UI Settings
    this.settings = {
      responsive: true,
      animations: true,
      autoSave: true
    };

    this.init();
  }

  async init() {
    if (!window.windowManager) {
      console.error('WindowManager not available');
      return;
    }

    // ✅ Initialize game data FIRST
    this.startGame();

    // Set global reference for compatibility
    window.activeApp = this;

    this.windowId = window.windowManager.createWindow({
      title: 'Rummikub',
      width: 800,
      height: 715,
      resizable: true,
      maximizable: true,
      minimizable: true
    });

    // Load the app — this triggers render()
    window.windowManager.loadApp(this.windowId, this);

    // Get the content reference after WindowManager loads the app
    const windowData = window.windowManager.windows.get(this.windowId);
    if (windowData && windowData.element) {
      this.windowContent = windowData.element.querySelector('.window-content');
    }
  }



  startGame() {
    // 🎮 Initialize tiles
    this.state.tiles = [];
    for (let i = 1; i <= 13; i++) {
      for (let c of this.state.colors) {
        this.state.tiles.push({ num: i, color: c, id: `${c}-${i}-1` });
        this.state.tiles.push({ num: i, color: c, id: `${c}-${i}-2` });
      }
    }
    this.state.tiles.push({ num: "J", color: "joker", id: "joker-1" });
    this.state.tiles.push({ num: "J", color: "joker", id: "joker-2" });

    // 🔀 Shuffle tiles
    this.state.tiles = this.state.tiles.sort(() => Math.random() - 0.5);

    // 👥 Initialize players with enhanced data
    this.state.players = [];
    for (let i = 0; i < 3; i++) {
      this.state.players.push({
        id: i,
        name: i === 0 ? 'You' : `AI ${i}`,
        hand: this.state.tiles.splice(0, 14),
        melded: false,
        score: 0,
        initialMeld: false // Track if player has made their initial meld
      });
    }

    // 🎯 Reset game state
    this.state.melds = [];
    this.state.buildingMeld = [];
    this.state.pendingMelds = [];
    this.state.manipulatedMelds = [];
    this.state.turn = 0;
    this.state.playerMadePlay = false;
    this.state.message = "Game started! Play your first meld (minimum 30 points).";
    this.state.gameEnded = false;
    this.state.winner = null;

    // 💾 Auto-save initial state
    if (this.settings.autoSave) {
      this.saveGameState();
    }
  }

  render() {
    const container = document.createElement('div');
    container.className = 'myapp-container';
    container.style.cssText = `
      width: 100%;
      height: 100%;
      background: var(--nebula-bg-primary);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      font-family: var(--nebula-font-family);
    `;

    const toolbar = this.createToolbar();
    const contentArea = this.createContentArea();
    const statusBar = this.createStatusBar();

    container.appendChild(toolbar);
    container.appendChild(contentArea);
    container.appendChild(statusBar);

    return container;
  }

  createToolbar() {
    const bar = document.createElement('div');
    bar.className = 'myapp-toolbar';
    bar.style.cssText = `
      padding: 8px 16px;
      background: var(--nebula-bg-secondary);
      color: var(--nebula-text-primary);
      font-weight: bold;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
    `;

    // Left side - Title and score
    const leftSection = document.createElement('div');
    leftSection.style.cssText = 'display: flex; align-items: center; gap: 15px;';
    
    const title = document.createElement('span');
    title.textContent = 'Rummikub';
    leftSection.appendChild(title);

    const scoreDisplay = document.createElement('span');
    scoreDisplay.style.cssText = 'font-size: 12px; color: var(--nebula-text-secondary);';
    scoreDisplay.textContent = `Score: ${this.state.score.player} | AI1: ${this.state.score.ai1} | AI2: ${this.state.score.ai2}`;
    leftSection.appendChild(scoreDisplay);

    // Right side - Controls
    const rightSection = document.createElement('div');
    rightSection.style.cssText = 'display: flex; align-items: center; gap: 8px;';

    // 🧪 Debug toggle
    const debugBtn = document.createElement('button');
    debugBtn.innerHTML = this.state.debugMode ? '🔍 Debug: ON' : '🔍 Debug';
    debugBtn.style.cssText = `
      padding: 4px 8px;
      border: none;
      border-radius: 4px;
      background: ${this.state.debugMode ? 'var(--nebula-primary)' : 'var(--nebula-bg-tertiary)'};
      color: ${this.state.debugMode ? 'white' : 'var(--nebula-text-primary)'};
      font-size: 11px;
      cursor: pointer;
    `;
    debugBtn.addEventListener('click', () => this.toggleDebugMode());
    rightSection.appendChild(debugBtn);

    // 💾 Save/Load
    const saveBtn = document.createElement('button');
    saveBtn.innerHTML = '💾';
    saveBtn.title = 'Save Game';
    saveBtn.style.cssText = 'padding: 4px 8px; border: none; border-radius: 4px; background: var(--nebula-bg-tertiary); cursor: pointer;';
    saveBtn.addEventListener('click', () => this.saveGameState());
    rightSection.appendChild(saveBtn);

    const loadBtn = document.createElement('button');
    loadBtn.innerHTML = '📁';
    loadBtn.title = 'Load Game';
    loadBtn.style.cssText = 'padding: 4px 8px; border: none; border-radius: 4px; background: var(--nebula-bg-tertiary); cursor: pointer;';
    loadBtn.addEventListener('click', () => this.loadGameState());
    rightSection.appendChild(loadBtn);

    // 🔄 New Game
    const newGameBtn = document.createElement('button');
    newGameBtn.innerHTML = '🔄';
    newGameBtn.title = 'New Game';
    newGameBtn.style.cssText = 'padding: 4px 8px; border: none; border-radius: 4px; background: var(--nebula-bg-tertiary); cursor: pointer;';
    newGameBtn.addEventListener('click', () => this.startGame() && this.refreshUI());
    rightSection.appendChild(newGameBtn);

    // 🆘 Help Button
    const helpBtn = document.createElement('button');
    helpBtn.innerHTML = '❓';
    helpBtn.title = 'Rummikub Rules & Help';
    helpBtn.style.cssText = 'padding: 4px 8px; border: none; border-radius: 4px; background: var(--nebula-bg-tertiary); cursor: pointer;';
    helpBtn.addEventListener('click', () => this.showHelpModal());
    rightSection.appendChild(helpBtn);

    bar.appendChild(leftSection);
    bar.appendChild(rightSection);
    return bar;
  }
  showHelpModal() {
    // Remove any existing modal
    const oldModal = document.getElementById('rummikub-help-modal');
    if (oldModal) oldModal.remove();

    const modal = document.createElement('div');
    modal.id = 'rummikub-help-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.45);
      display: flex; align-items: center; justify-content: center;
      z-index: 9999;
    `;

    const box = document.createElement('div');
    box.style.cssText = `
      background: var(--nebula-bg-primary);
      color: var(--nebula-text-primary);
      border-radius: 12px;
      box-shadow: 0 4px 32px rgba(0,0,0,0.18);
      padding: 32px 28px 24px 28px;
      max-width: 420px;
      width: 90vw;
      font-family: var(--nebula-font-family);
      position: relative;
      text-align: left;
    `;

    // Modal content (as elements)
    const title = document.createElement('h2');
    title.style.marginTop = '0';
    title.style.color = 'var(--nebula-primary)';
    title.textContent = 'Rummikub Rules';
    box.appendChild(title);

    const logoRow = document.createElement('div');
    logoRow.style.marginBottom = '12px';
    logoRow.innerHTML = `<img src='assets/nebula-desktop-logo.png' alt='Rummikub' style='height:38px; vertical-align:middle; margin-right:8px;'><span style='font-size:15px; color:var(--nebula-text-secondary);'>How to Play</span>`;
    box.appendChild(logoRow);

    const rulesList = document.createElement('ul');
    rulesList.style.fontSize = '14px';
    rulesList.style.lineHeight = '1.6';
    rulesList.style.paddingLeft = '18px';
    rulesList.innerHTML = `
      <li><b>Goal:</b> Be first to play all your tiles.</li>
      <li><b>Melds:</b> Play sets of tiles as either:<br>
        <span style='color:red;'>Runs</span>: 3+ consecutive numbers, same color (e.g., <span style='color:red;'>red 11, red 12, red 13</span>)<br>
        <span style='color:blue;'>Groups</span>: 3-4 same number, different colors (e.g., <span style='color:red;'>red 11</span>, <span style='color:blue;'>blue 11</span>, <span style='color:black;'>black 11</span>)
      </li>
      <li><b>Initial Meld:</b> Must total at least <b>30 points</b> (sum of tile numbers).</li>
      <li><b>Jokers:</b> Can substitute any tile in a meld.</li>
      <li><b>On Your Turn:</b> Play tiles, rearrange melds, or draw if stuck.</li>
      <li><b>End Turn:</b> Click 'End Turn' after playing.</li>
    `;
    box.appendChild(rulesList);

    const tip = document.createElement('div');
    tip.style.marginTop = '10px';
    tip.style.fontSize = '13px';
    tip.style.color = 'var(--nebula-text-secondary)';
    tip.innerHTML = `<b>Tip:</b> Click melds to edit, drag tiles, and use the toolbar for game actions.`;
    box.appendChild(tip);

    // Close button (append last so it overlays)
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✖';
    closeBtn.title = 'Close';
    closeBtn.style.cssText = `
      position: absolute; top: 12px; right: 16px;
      background: var(--nebula-bg-tertiary);
      color: var(--nebula-text-primary);
      border: none;
      border-radius: 4px;
      font-size: 16px;
      cursor: pointer;
      padding: 2px 8px;
    `;
    closeBtn.onclick = () => modal.remove();
    box.appendChild(closeBtn);

    modal.appendChild(box);
    document.body.appendChild(modal);
  }
  

  createStatusBar() {
    const bar = document.createElement('div');
    bar.className = 'myapp-statusbar';
    bar.style.cssText = `
      padding: 12px 16px;
      background: var(--nebula-bg-secondary);
      color: var(--nebula-text-secondary);
      font-size: 14px;
      border-top: 1px solid var(--nebula-border);
      line-height: 1.4;
    `;
    
    // Format message with emojis and styling
    let displayMessage = this.state.message || 'Welcome to Rummikub! 🎮';
    
    // Add turn indicator
    if (!this.state.gameEnded) {
      const currentPlayer = this.state.players[this.state.turn];
      const turnIndicator = `<span style="color: var(--nebula-primary); font-weight: bold;">
        ${currentPlayer ? currentPlayer.name : 'Player'}'s Turn
      </span> | `;
      displayMessage = turnIndicator + displayMessage;
    }
    
    bar.innerHTML = displayMessage;
    return bar;
  }

  createContentArea() {
    const contentArea = document.createElement('div');
    contentArea.className = 'myapp-content';
    contentArea.style.cssText = `
      flex: 1;
      overflow: auto;
      background: var(--nebula-bg-primary);
      padding: 16px;
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 16px;
    `;

    // ✅ Safety check: ensure players are initialized
    if (!this.state.players || this.state.players.length === 0) {
      contentArea.innerHTML = `
        <div style="color: var(--nebula-text-primary); text-align: center; margin-top: 50px;">
          <h2>Initializing Rummikub...</h2>
          <p>Setting up tiles and players...</p>
        </div>
      `;
      return contentArea;
    }

    // 🏁 Check for win condition
    if (this.state.gameEnded) {
      contentArea.appendChild(this.createWinScreen());
      return contentArea;
    }

    // 🗂️ Main Virtual Tabletop Section (now the primary focus)
    const tabletopSection = this.createMainTabletopSection();
    contentArea.appendChild(tabletopSection);

    // 🧠 Debug Section (if enabled)
    if (this.state.debugMode) {
      const debugSection = this.createDebugSection();
      contentArea.appendChild(debugSection);
    }

    // ️ Player Hand at Bottom (with controls in header)
    const handSection = this.createPlayerHandSection();
    contentArea.appendChild(handSection);

    // Set up event listeners for buttons in player hand section
    setTimeout(() => {
      const endTurnBtn = document.getElementById('end-turn-btn');
      const drawTileBtn = document.getElementById('draw-tile-btn');
      const playMeldBtn = document.getElementById('play-meld-btn');
      
      if (endTurnBtn) {
        endTurnBtn.addEventListener('click', () => this.endTurn());
      }
      
      if (drawTileBtn) {
        drawTileBtn.addEventListener('click', () => this.drawTile());
      }

      if (playMeldBtn) {
        playMeldBtn.addEventListener('click', () => this.validateAllMelds());
      }
    }, 0);

    return contentArea;
  }

  createMainTabletopSection() {
    const section = document.createElement('div');
    section.style.cssText = `
      background: var(--nebula-bg-secondary);
      border-radius: 8px;
      padding: 16px;
      height: 400px; /* Increased from 320px for main focus */
      display: flex;
      flex-direction: column;
      position: relative;
    `;

    const title = document.createElement('h3');
    title.innerHTML = '🗂️ Virtual Tabletop <span style="font-size: 12px; color: var(--nebula-text-secondary); font-weight: normal;">(Click melds to edit • Emoji shows who played)</span>';
    title.style.cssText = 'margin: 0 0 12px 0; color: var(--nebula-text-primary); flex-shrink: 0;';
    section.appendChild(title);

    // Tabletop container
    const tabletop = document.createElement('div');
    tabletop.id = 'virtual-tabletop';
    tabletop.style.cssText = `
      flex: 1;
      background: linear-gradient(45deg, #2c5530 25%, transparent 25%), 
                  linear-gradient(-45deg, #2c5530 25%, transparent 25%), 
                  linear-gradient(45deg, transparent 75%, #2c5530 75%), 
                  linear-gradient(-45deg, transparent 75%, #2c5530 75%);
      background-size: 20px 20px;
      background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
      background-color: #1a4a20;
      border-radius: 6px;
      position: relative;
      overflow: hidden;
      cursor: grab;
      border: 2px solid var(--nebula-border);
    `;

    // Tabletop viewport (the pannable area)
    const viewport = document.createElement('div');
    viewport.id = 'tabletop-viewport';
    viewport.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 2000px;
      height: 1500px;
      transition: transform 0.2s ease;
      transform: translate(0px, 0px) scale(1);
    `;

    // Add melds to the tabletop with emoji indicators
    this.layoutMeldsOnTabletop(viewport);

    tabletop.appendChild(viewport);

    // Add tabletop controls
    const controls = document.createElement('div');
    controls.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      display: flex;
      gap: 4px;
      z-index: 10;
    `;

    const zoomInBtn = this.createTabletopButton('🔍+', 'Zoom In');
    const zoomOutBtn = this.createTabletopButton('🔍-', 'Zoom Out');
    const resetBtn = this.createTabletopButton('🎯', 'Reset View');

    zoomInBtn.addEventListener('click', () => this.zoomTabletop(1.2));
    zoomOutBtn.addEventListener('click', () => this.zoomTabletop(0.8));
    resetBtn.addEventListener('click', () => this.resetTabletopView());

    controls.appendChild(zoomInBtn);
    controls.appendChild(zoomOutBtn);
    controls.appendChild(resetBtn);

    tabletop.appendChild(controls);

    // Add pan functionality
    this.addTabletopPanHandlers(tabletop, viewport);

    section.appendChild(tabletop);

    // Add instructions
    const instructions = document.createElement('div');
    instructions.style.cssText = `
      margin-top: 8px;
      font-size: 11px;
      color: var(--nebula-text-secondary);
      text-align: center;
    `;
    instructions.textContent = '🖱️ Drag to pan • 🔍 Use buttons to zoom • Drop tiles on melds to add • Click melds to edit • Rearrange in building area';
    section.appendChild(instructions);

    // Building zone integrated into tabletop area
    const buildingZone = document.createElement('div');
    buildingZone.id = 'building-meld-zone';
    buildingZone.style.cssText = `
      margin: 8px 0 0 0;
      padding: 8px 12px;
      border: 2px dashed ${this.state.buildingMeld.length > 0 ? 'var(--nebula-primary)' : 'rgba(255,255,255,0.3)'};
      border-radius: 6px;
      background: rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
      transition: all 0.2s ease;
      min-height: 40px;
      backdrop-filter: blur(5px);
    `;

    if (this.state.buildingMeld.length === 0) {
      const placeholder = document.createElement('div');
      placeholder.textContent = '🛠️ Drag tiles here to build a meld';
      placeholder.style.cssText = `
        color: rgba(255,255,255,0.7); 
        font-style: italic; 
        font-size: 12px;
        text-align: center; 
        width: 100%;
      `;
      buildingZone.appendChild(placeholder);
    } else {
      // Show tiles in building meld
      this.state.buildingMeld.forEach((tile, index) => {
        const tileElement = this.createTileElement(tile, null, false);
        tileElement.style.cursor = 'pointer';
        tileElement.title = 'Click to remove';
        tileElement.addEventListener('click', () => this.removeFromBuildingMeld(index));
        buildingZone.appendChild(tileElement);
      });

      // Show validity indicator
      const isValid = this.isValidMeld(this.state.buildingMeld);
      const validityIndicator = document.createElement('div');
      validityIndicator.textContent = isValid ? '✅ Valid' : '❌ Invalid';
      validityIndicator.title = isValid ? 'Valid meld - can play!' : 'Invalid meld';
      validityIndicator.style.cssText = `
        margin-left: auto; 
        font-size: 12px; 
        padding: 4px 8px; 
        border-radius: 4px;
        background: ${isValid ? 'rgba(39, 174, 96, 0.2)' : 'rgba(231, 76, 60, 0.2)'};
        color: ${isValid ? '#27ae60' : '#e74c3c'};
        font-weight: bold;
        backdrop-filter: blur(5px);
      `;
      buildingZone.appendChild(validityIndicator);

      // Add clear button for building area
      const clearBtn = document.createElement('button');
      clearBtn.textContent = '🗑️';
      clearBtn.title = 'Clear building area (return tiles to hand)';
      clearBtn.style.cssText = `
        background: rgba(231, 76, 60, 0.2);
        border: none;
        border-radius: 4px;
        color: #e74c3c;
        padding: 4px 8px;
        cursor: pointer;
        font-size: 12px;
        font-weight: bold;
        margin-left: 4px;
      `;
      clearBtn.addEventListener('click', () => this.clearBuildingMeld());
      buildingZone.appendChild(clearBtn);
    }

    section.appendChild(buildingZone);

    // Add drop handlers to building zone
    buildingZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      buildingZone.style.borderColor = 'var(--nebula-primary)';
      buildingZone.style.background = 'rgba(52, 152, 219, 0.3)';
    });

    buildingZone.addEventListener('dragleave', (e) => {
      buildingZone.style.borderColor = this.state.buildingMeld.length > 0 ? 'var(--nebula-primary)' : 'rgba(255,255,255,0.3)';
      buildingZone.style.background = 'rgba(0,0,0,0.3)';
    });

    buildingZone.addEventListener('drop', (e) => this.handleDropToBuildingMeld(e));

    return section;
  }

  createTabletopButton(text, title) {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.title = title;
    btn.style.cssText = `
      width: 28px;
      height: 28px;
      border: none;
      border-radius: 4px;
      background: rgba(0,0,0,0.7);
      color: white;
      font-size: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    `;
    btn.addEventListener('mouseenter', () => {
      btn.style.background = 'rgba(0,0,0,0.9)';
      btn.style.transform = 'scale(1.1)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'rgba(0,0,0,0.7)';
      btn.style.transform = 'scale(1)';
    });
    return btn;
  }

  layoutMeldsOnTabletop(viewport) {
    // Clear existing melds
    viewport.innerHTML = '';

    if (this.state.melds.length === 0) {
      const placeholder = document.createElement('div');
      placeholder.textContent = 'Drop your first meld here...';
      placeholder.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: rgba(255,255,255,0.6);
        font-style: italic;
        font-size: 16px;
        text-align: center;
        background: rgba(0,0,0,0.3);
        padding: 20px;
        border-radius: 8px;
        border: 2px dashed rgba(255,255,255,0.3);
      `;
      viewport.appendChild(placeholder);
      return;
    }

    // Layout melds in a grid pattern
    const meldWidth = 300;
    const meldHeight = 80;
    const padding = 20;
    const cols = 5;

    this.state.melds.forEach((meld, meldIndex) => {
      const row = Math.floor(meldIndex / cols);
      const col = meldIndex % cols;
      
      const x = 100 + col * (meldWidth + padding);
      const y = 100 + row * (meldHeight + padding);

      const meldContainer = this.createTabletopMeld(meld, meldIndex, x, y);
      viewport.appendChild(meldContainer);
    });

    // Add building meld area
    if (this.state.buildingMeld.length > 0) {
      const buildingContainer = this.createTabletopBuildingMeld();
      viewport.appendChild(buildingContainer);
    }
  }

  createTabletopMeld(meld, meldIndex, x, y) {
    const container = document.createElement('div');
    container.className = 'tabletop-meld';
    container.setAttribute('data-meld-index', meldIndex);
    container.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      background: rgba(255,255,255,0.95);
      border-radius: 8px;
      padding: 8px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      border: 2px solid transparent;
      transition: all 0.2s ease;
      min-width: 200px;
      display: flex;
      align-items: center;
      gap: 4px;
      flex-wrap: wrap;
    `;

    // Meld label with emoji indicator
    const label = document.createElement('span');
    const meldData = meld.tiles ? meld : { tiles: meld, emoji: '❓', playerName: 'Unknown' }; // Backward compatibility
    label.innerHTML = `${meldData.emoji || '❓'} M${meldIndex + 1}:`;
    label.title = `Played by ${meldData.playerName || 'Unknown'}`;
    label.style.cssText = `
      font-weight: bold;
      color: #333;
      font-size: 12px;
      margin-right: 6px;
      flex-shrink: 0;
      cursor: pointer;
    `;
    container.appendChild(label);

    // Tiles
    const tilesToRender = meld.tiles || meld; // Handle both old and new format
    tilesToRender.forEach(tile => {
      const tileElement = this.createTileElement(tile, null, false);
      tileElement.style.fontSize = '12px';
      tileElement.style.padding = '4px 8px';
      tileElement.style.margin = '1px';
      container.appendChild(tileElement);
    });

    // Score
    const scoreSpan = document.createElement('span');
    scoreSpan.textContent = `(${this.calculateMeldScore(tilesToRender)}pts)`;
    scoreSpan.style.cssText = `
      font-size: 10px;
      color: #666;
      margin-left: 4px;
      flex-shrink: 0;
    `;
    container.appendChild(scoreSpan);

    // Click to edit functionality
    container.addEventListener('click', (e) => {
      if (e.target.classList.contains('tile')) {
        // Individual tile clicked - add to building area
        const tileId = e.target.getAttribute('data-tile-id');
        this.moveTileFromMeldToBuilding(meldIndex, tileId);
      } else {
        // Meld container clicked - move entire meld to building area
        this.moveMeldToBuilding(meldIndex);
      }
    });

    // Add visual feedback for clickable meld
    container.addEventListener('mouseenter', () => {
      container.style.cursor = 'pointer';
      container.style.borderColor = 'var(--nebula-primary)';
      container.style.transform = 'scale(1.02)';
    });

    container.addEventListener('mouseleave', () => {
      container.style.cursor = 'default';
      container.style.borderColor = 'transparent';
      container.style.transform = 'scale(1)';
    });

    // Drop zone styling
    container.addEventListener('dragover', (e) => {
      e.preventDefault();
      container.style.borderColor = 'var(--nebula-primary)';
      container.style.background = 'rgba(52, 152, 219, 0.1)';
      container.style.transform = 'scale(1.02)';
    });

    container.addEventListener('dragleave', () => {
      container.style.borderColor = 'transparent';
      container.style.background = 'rgba(255,255,255,0.95)';
      container.style.transform = 'scale(1)';
    });

    container.addEventListener('drop', (e) => {
      e.preventDefault();
      this.handleDropToExistingMeld(e, meldIndex);
      container.style.borderColor = 'transparent';
      container.style.background = 'rgba(255,255,255,0.95)';
      container.style.transform = 'scale(1)';
    });

    return container;
  }

  createTabletopBuildingMeld() {
    const container = document.createElement('div');
    container.id = 'tabletop-building-meld';
    container.style.cssText = `
      position: absolute;
      left: 100px;
      top: 20px;
      background: rgba(255, 193, 7, 0.9);
      border-radius: 8px;
      padding: 8px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      border: 2px dashed var(--nebula-primary);
      min-width: 250px;
      display: flex;
      align-items: center;
      gap: 4px;
      flex-wrap: wrap;
    `;

    const label = document.createElement('span');
    label.textContent = '🛠️ Building:';
    label.style.cssText = `
      font-weight: bold;
      color: #333;
      font-size: 12px;
      margin-right: 6px;
      flex-shrink: 0;
    `;
    container.appendChild(label);

    this.state.buildingMeld.forEach((tile, index) => {
      const tileElement = this.createTileElement(tile, null, false);
      tileElement.style.fontSize = '12px';
      tileElement.style.padding = '4px 8px';
      tileElement.style.margin = '1px';
      tileElement.style.cursor = 'pointer';
      tileElement.title = 'Click to remove';
      tileElement.addEventListener('click', () => this.removeFromBuildingMeld(index));
      container.appendChild(tileElement);
    });

    return container;
  }

  // 🗺️ Tabletop Navigation System
  addTabletopPanHandlers(tabletop, viewport) {
    let isPanning = false;
    let startX = 0;
    let startY = 0;
    let currentTransformX = 0;
    let currentTransformY = 0;
    let currentScale = 1;

    // Initialize transform tracking
    this.tabletopState = {
      x: 0,
      y: 0,
      scale: 1
    };

    tabletop.addEventListener('mousedown', (e) => {
      // Don't pan if clicking on controls or melds
      if (e.target.closest('.tabletop-meld') || e.target.closest('button')) return;
      
      isPanning = true;
      startX = e.clientX - currentTransformX;
      startY = e.clientY - currentTransformY;
      tabletop.style.cursor = 'grabbing';
      e.preventDefault();
    });

    tabletop.addEventListener('mousemove', (e) => {
      if (!isPanning) return;
      
      currentTransformX = e.clientX - startX;
      currentTransformY = e.clientY - startY;
      
      // Limit panning to keep content visible
      const bounds = tabletop.getBoundingClientRect();
      const maxX = bounds.width * 0.3;
      const maxY = bounds.height * 0.3;
      const minX = -viewport.offsetWidth * currentScale + bounds.width * 0.7;
      const minY = -viewport.offsetHeight * currentScale + bounds.height * 0.7;
      
      currentTransformX = Math.max(minX, Math.min(maxX, currentTransformX));
      currentTransformY = Math.max(minY, Math.min(maxY, currentTransformY));
      
      this.updateTabletopTransform(viewport, currentTransformX, currentTransformY, currentScale);
    });

    tabletop.addEventListener('mouseup', () => {
      isPanning = false;
      tabletop.style.cursor = 'grab';
      this.tabletopState.x = currentTransformX;
      this.tabletopState.y = currentTransformY;
    });

    tabletop.addEventListener('mouseleave', () => {
      isPanning = false;
      tabletop.style.cursor = 'grab';
    });

    // Wheel zoom
    tabletop.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      this.zoomTabletop(zoomFactor);
    });

    // Store references for zoom functions
    this.tabletopViewport = viewport;
    this.tabletopContainer = tabletop;
    this.currentTransformX = currentTransformX;
    this.currentTransformY = currentTransformY;
    this.currentScale = currentScale;
  }

  updateTabletopTransform(viewport, x, y, scale) {
    viewport.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    this.tabletopState = { x, y, scale };
  }

  zoomTabletop(factor) {
    if (!this.tabletopViewport) return;
    
    const newScale = Math.max(0.3, Math.min(2, this.tabletopState.scale * factor));
    this.updateTabletopTransform(
      this.tabletopViewport, 
      this.tabletopState.x, 
      this.tabletopState.y, 
      newScale
    );
  }

  resetTabletopView() {
    if (!this.tabletopViewport) return;
    this.updateTabletopTransform(this.tabletopViewport, 0, 0, 1);
  }

  // New method to create player hand at bottom
  createPlayerHandSection() {
    const section = document.createElement('div');
    section.style.cssText = `
      background: var(--nebula-bg-secondary);
      border-radius: 8px;
      padding: 16px;
      margin-top: auto; /* Push to bottom */
    `;

    // Single row header with Your Hand | Buttons | Points
    const headerRow = document.createElement('div');
    headerRow.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
      gap: 16px;
    `;

    // Left: Your Hand title
    const handTitle = document.createElement('div');
    handTitle.textContent = '🗂️ Your Hand';
    handTitle.style.cssText = `
      color: var(--nebula-text-primary);
      font-weight: bold;
      font-size: 16px;
      flex-shrink: 0;
    `;

    // Center: Action buttons
    const buttonGroup = document.createElement('div');
    buttonGroup.style.cssText = `
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    `;

    const buttonStyle = `
      padding: 6px 12px;
      border: none;
      border-radius: 6px;
      color: white;
      cursor: pointer;
      font-weight: bold;
      transition: all 0.2s ease;
      font-size: 12px;
      white-space: nowrap;
    `;

    // Play Meld button (renamed from Validate Melds)
    const playMeldBtn = document.createElement('button');
    playMeldBtn.id = 'play-meld-btn';
    playMeldBtn.textContent = '🎯 Play Meld';
    playMeldBtn.style.cssText = buttonStyle + 'background: #27ae60;'; // Green for submit action
    buttonGroup.appendChild(playMeldBtn);

    // Draw Tile button
    const drawTileBtn = document.createElement('button');
    drawTileBtn.id = 'draw-tile-btn';
    drawTileBtn.textContent = '🎴 Draw Tile';
    drawTileBtn.style.cssText = buttonStyle + 'background: var(--nebula-primary);';
    buttonGroup.appendChild(drawTileBtn);

    // End Turn button
    const endTurnBtn = document.createElement('button');
    endTurnBtn.id = 'end-turn-btn';
    endTurnBtn.textContent = '⏭️ End Turn';
    endTurnBtn.style.cssText = buttonStyle + 'background: var(--nebula-primary);';
    buttonGroup.appendChild(endTurnBtn);

    // Right: Points display
    const player = this.state.players[0];
    const pointsDisplay = document.createElement('div');
    pointsDisplay.style.cssText = `
      color: var(--nebula-text-secondary);
      font-size: 12px;
      text-align: right;
      flex-shrink: 0;
    `;
    pointsDisplay.innerHTML = `<strong>${player.hand.length}</strong> tiles | <strong>${this.calculateHandScore(player.hand)}</strong> pts`;

    headerRow.appendChild(handTitle);
    headerRow.appendChild(buttonGroup);
    headerRow.appendChild(pointsDisplay);
    section.appendChild(headerRow);

    // 🗂️ Tile Rack Layout - centered at bottom
    const tileRack = document.createElement('div');
    tileRack.id = 'player-hand';
    tileRack.style.cssText = `
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 16px;
      background: var(--nebula-bg-tertiary);
      border-radius: 8px;
      min-height: 70px;
      align-items: center;
      justify-content: center; /* Center the tiles */
      max-width: 800px;
      margin: 0 auto; /* Center the container */
    `;

    // Sort hand for better organization
    const sortedHand = [...player.hand].sort((a, b) => {
      if (a.color === 'joker' && b.color !== 'joker') return 1;
      if (b.color === 'joker' && a.color !== 'joker') return -1;
      if (a.color !== b.color) return a.color.localeCompare(b.color);
      return a.num - b.num;
    });

    sortedHand.forEach((tile, i) => {
      const originalIndex = player.hand.findIndex(t => t.id === tile.id);
      const tileElement = this.createTileElement(tile, originalIndex, true);
      // Make tiles bigger for readability
      tileElement.style.fontSize = '14px';
      tileElement.style.padding = '6px 10px';
      tileElement.style.minWidth = '24px';
      tileRack.appendChild(tileElement);
    });

    section.appendChild(tileRack);

    return section;
  }

  createTileElement(tile, index, isDraggable = false) {
    const tileElement = document.createElement('span');
    tileElement.className = 'tile';
    tileElement.setAttribute('data-tile-id', tile.id);
    
    const colorMap = {
      red: "#e74c3c",
      blue: "#3498db",
      yellow: "#f1c40f",
      black: "#2c3e50",
      joker: "#9b59b6"
    };

    tileElement.style.cssText = `
      display: inline-block;
      padding: 8px 12px;
      margin: 2px;
      border-radius: 6px;
      background: ${colorMap[tile.color]};
      color: white;
      font-weight: bold;
      font-size: 14px;
      cursor: ${isDraggable ? 'grab' : 'default'};
      transition: all 0.2s ease;
      border: 2px solid transparent;
      user-select: none;
      min-width: 32px;
      text-align: center;
    `;

    // 🎨 Hover effects
    if (isDraggable) {
      tileElement.draggable = true;
      tileElement.addEventListener('dragstart', (e) => this.handleDragStart(e, index));
      
      tileElement.addEventListener('mouseenter', () => {
        tileElement.style.transform = 'translateY(-2px)';
        tileElement.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
        tileElement.style.borderColor = 'rgba(255,255,255,0.3)';
      });
      
      tileElement.addEventListener('mouseleave', () => {
        tileElement.style.transform = 'translateY(0)';
        tileElement.style.boxShadow = 'none';
        tileElement.style.borderColor = 'transparent';
      });

      tileElement.addEventListener('click', () => this.selectTileForMeld(index));
    }

    tileElement.textContent = tile.num;
    return tileElement;
  }

  createDropZoneSection() {
    const section = document.createElement('div');
    section.style.cssText = 'display: flex; flex-direction: column; gap: 12px;';

    // 🔧 Building Meld Area (simplified since melds are now on tabletop)
    const buildingSection = document.createElement('div');
    buildingSection.style.cssText = `
      background: var(--nebula-bg-secondary);
      border-radius: 8px;
      padding: 16px;
      border: 2px solid ${this.state.buildingMeld.length > 0 ? 'var(--nebula-primary)' : 'var(--nebula-border)'};
    `;

    const buildingTitle = document.createElement('h4');
    buildingTitle.textContent = '🛠️ Building New Meld';
    buildingTitle.style.cssText = 'margin: 0 0 12px 0; color: var(--nebula-text-primary);';
    buildingSection.appendChild(buildingTitle);

    // Building meld drop zone
    const buildingZone = document.createElement('div');
    buildingZone.id = 'building-meld-zone';
    buildingZone.style.cssText = `
      min-height: 60px;
      padding: 12px;
      border: 2px dashed ${this.state.buildingMeld.length > 0 ? 'var(--nebula-primary)' : 'var(--nebula-text-secondary)'};
      border-radius: 6px;
      background: var(--nebula-bg-tertiary);
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
      transition: all 0.2s ease;
    `;

    if (this.state.buildingMeld.length === 0) {
      const placeholder = document.createElement('div');
      placeholder.textContent = '🎯 Drag tiles here to build a meld (need 3+ tiles) • Or drag directly to tabletop melds!';
      placeholder.style.cssText = 'color: var(--nebula-text-secondary); font-style: italic; text-align: center; width: 100%;';
      buildingZone.appendChild(placeholder);
    } else {
      // Show tiles in building meld
      this.state.buildingMeld.forEach((tile, index) => {
        const tileElement = this.createTileElement(tile, null, false);
        tileElement.style.cursor = 'pointer';
        tileElement.title = 'Click to remove from meld';
        tileElement.addEventListener('click', () => this.removeFromBuildingMeld(index));
        buildingZone.appendChild(tileElement);
      });

      // Show meld score and validity
      const meldInfo = document.createElement('div');
      meldInfo.style.cssText = 'margin-left: auto; font-size: 12px; color: var(--nebula-text-secondary);';
      const isValid = this.isValidMeld(this.state.buildingMeld);
      const score = this.calculateMeldScore(this.state.buildingMeld);
      meldInfo.innerHTML = `
        ${this.state.buildingMeld.length} tiles | ${score} pts | 
        <span style="color: ${isValid ? '#27ae60' : '#e74c3c'}">
          ${isValid ? '✅ Valid' : '❌ Invalid'}
        </span>
      `;
      buildingZone.appendChild(meldInfo);
    }
    
    buildingZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      buildingZone.style.borderColor = 'var(--nebula-primary)';
      buildingZone.style.background = 'var(--nebula-bg-primary)';
    });
    
    buildingZone.addEventListener('dragleave', () => {
      buildingZone.style.borderColor = this.state.buildingMeld.length > 0 ? 'var(--nebula-primary)' : 'var(--nebula-text-secondary)';
      buildingZone.style.background = 'var(--nebula-bg-tertiary)';
    });
    
    buildingZone.addEventListener('drop', (e) => this.handleDropToBuildingMeld(e));

    buildingSection.appendChild(buildingZone);

    // Controls for building meld
    if (this.state.buildingMeld.length > 0) {
      const controls = document.createElement('div');
      controls.style.cssText = 'margin-top: 12px; display: flex; gap: 8px; justify-content: center;';

      const commitBtn = document.createElement('button');
      commitBtn.textContent = '✅ Commit to Tabletop';
      commitBtn.disabled = !this.isValidMeld(this.state.buildingMeld);
      commitBtn.style.cssText = `
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        background: ${commitBtn.disabled ? 'var(--nebula-bg-tertiary)' : '#27ae60'};
        color: ${commitBtn.disabled ? 'var(--nebula-text-secondary)' : 'white'};
        cursor: ${commitBtn.disabled ? 'not-allowed' : 'pointer'};
        font-weight: bold;
      `;
      commitBtn.addEventListener('click', () => this.commitBuildingMeld());
      controls.appendChild(commitBtn);

      const clearBtn = document.createElement('button');
      clearBtn.textContent = '🗑️ Clear';
      clearBtn.style.cssText = `
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        background: #e74c3c;
        color: white;
        cursor: pointer;
        font-weight: bold;
      `;
      clearBtn.addEventListener('click', () => this.clearBuildingMeld());
      controls.appendChild(clearBtn);

      buildingSection.appendChild(controls);
    }

    section.appendChild(buildingSection);

    return section;
  }

  createDebugSection() {
    const section = document.createElement('div');
    section.style.cssText = `
      background: var(--nebula-bg-secondary);
      border: 2px solid var(--nebula-primary);
      border-radius: 8px;
      padding: 12px;
      font-family: monospace;
      font-size: 12px;
    `;

    const title = document.createElement('h4');
    title.textContent = '🧪 Debug Information';
    title.style.cssText = 'margin: 0 0 8px 0; color: var(--nebula-primary);';
    section.appendChild(title);

    // AI hands
    this.state.players.slice(1).forEach((player, i) => {
      const playerDiv = document.createElement('div');
      playerDiv.style.cssText = 'margin: 8px 0; padding: 8px; background: var(--nebula-bg-tertiary); border-radius: 4px;';
      
      const playerTitle = document.createElement('div');
      playerTitle.textContent = `${player.name} Hand (${player.hand.length} tiles):`;
      playerTitle.style.cssText = 'font-weight: bold; margin-bottom: 4px; color: var(--nebula-text-primary);';
      playerDiv.appendChild(playerTitle);

      const handDiv = document.createElement('div');
      handDiv.style.cssText = 'display: flex; flex-wrap: wrap; gap: 2px;';
      
      player.hand.forEach(tile => {
        const tileSpan = this.createTileElement(tile, null, false);
        tileSpan.style.fontSize = '10px';
        tileSpan.style.padding = '4px 6px';
        handDiv.appendChild(tileSpan);
      });
      
      playerDiv.appendChild(handDiv);
      section.appendChild(playerDiv);
    });

    // Game state info
    const stateDiv = document.createElement('div');
    stateDiv.style.cssText = 'margin-top: 12px; padding: 8px; background: var(--nebula-bg-tertiary); border-radius: 4px;';
    stateDiv.innerHTML = `
      <strong>Game State:</strong>
      Turn: ${this.state.turn + 1}/∞ | Tiles left: ${this.state.tiles.length}
      Current player: ${this.state.players[this.state.turn].name}
    `;
    section.appendChild(stateDiv);

    return section;
  }

  createGameControls() {
    const section = document.createElement('div');
    section.style.cssText = `
      display: none; /* Hide since buttons moved to compact player section */
      gap: 12px;
      flex-wrap: wrap;
      justify-content: center;
      padding: 16px;
      background: var(--nebula-bg-secondary);
      border-radius: 8px;
    `;

    const buttonStyle = `
      padding: 10px 16px;
      border: none;
      border-radius: 6px;
      background: var(--nebula-primary);
      color: white;
      cursor: pointer;
      font-weight: bold;
      transition: all 0.2s ease;
    `;

    // End Turn button
    const endTurnBtn = document.createElement('button');
    endTurnBtn.textContent = '⏭️ End Turn';
    endTurnBtn.style.cssText = buttonStyle;
    endTurnBtn.addEventListener('click', () => this.endTurn());
    section.appendChild(endTurnBtn);

    // Draw Tile button
    const drawBtn = document.createElement('button');
    drawBtn.textContent = '🎴 Draw Tile';
    drawBtn.style.cssText = buttonStyle;
    drawBtn.addEventListener('click', () => this.drawTile());
    section.appendChild(drawBtn);

    // Validate Melds button (hidden - auto-validation used instead)
    const validateBtn = document.createElement('button');
    validateBtn.textContent = '✅ Validate Melds';
    validateBtn.style.cssText = buttonStyle.replace('var(--nebula-primary)', '#27ae60') + ' display: none;'; // Hidden
    validateBtn.addEventListener('click', () => this.validateAllMelds());
    section.appendChild(validateBtn);

    return section;
  }

  createWinScreen() {
    const winScreen = document.createElement('div');
    winScreen.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 40px;
      background: linear-gradient(135deg, var(--nebula-primary), var(--nebula-secondary));
      border-radius: 12px;
      color: white;
      margin: 20px;
    `;

    const trophy = document.createElement('div');
    trophy.textContent = '🏆';
    trophy.style.cssText = 'font-size: 64px; margin-bottom: 16px;';
    winScreen.appendChild(trophy);

    const winnerText = document.createElement('h2');
    winnerText.textContent = `${this.state.winner.name} Wins!`;
    winnerText.style.cssText = 'margin: 0 0 16px 0; font-size: 32px;';
    winScreen.appendChild(winnerText);

    const scoreText = document.createElement('div');
    scoreText.style.cssText = 'font-size: 18px; margin-bottom: 24px;';
    scoreText.innerHTML = `
      Final Scores:
      ${this.state.players.map(p => `${p.name}: ${p.score} points`).join('| ')}
    `;
    winScreen.appendChild(scoreText);

    const newGameBtn = document.createElement('button');
    newGameBtn.textContent = '🔄 New Game';
    newGameBtn.style.cssText = `
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      background: white;
      color: var(--nebula-primary);
      font-weight: bold;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.2s ease;
    `;
    newGameBtn.addEventListener('click', () => {
      this.startGame();
      this.refreshUI();
    });
    winScreen.appendChild(newGameBtn);

    return winScreen;
  }

  // 🎯 Enhanced Drag & Drop System
  handleDragStart(event, index) {
    this.state.draggedTile = {
      index: index,
      tile: this.state.players[0].hand[index]
    };
    event.dataTransfer.setData("text/plain", index);
    event.dataTransfer.effectAllowed = "move";
    
    // Visual feedback
    event.target.style.opacity = "0.5";
  }

  // 🔧 NEW: Drop to building meld area
  handleDropToBuildingMeld(event) {
    event.preventDefault();
    const index = parseInt(event.dataTransfer.getData("text/plain"));
    if (isNaN(index) || !this.state.draggedTile) return;

    const tile = this.state.players[0].hand.splice(index, 1)[0];
    this.state.buildingMeld.push(tile);
    
    const isValid = this.isValidMeld(this.state.buildingMeld);
    this.state.message = `Tile added to building meld! ${this.state.buildingMeld.length}/3+ tiles ${isValid && this.state.buildingMeld.length >= 3 ? '✅' : '⏳'}`;
    
    // Reset drag state
    this.state.draggedTile = null;
    
    this.refreshUI();
  }

  // 🔧 NEW: Drop to existing meld
  handleDropToExistingMeld(event, meldIndex) {
    event.preventDefault();
    const index = parseInt(event.dataTransfer.getData("text/plain"));
    if (isNaN(index) || !this.state.draggedTile) return;

    const tile = this.state.players[0].hand.splice(index, 1)[0];
    
    // Try adding to the existing meld
    const testMeld = [...this.state.melds[meldIndex], tile];
    
    if (this.isValidMeld(testMeld)) {
      this.state.melds[meldIndex].push(tile);
      this.state.playerMadePlay = true; // Mark that player made a play
      this.state.message = `✅ Tile added to existing meld! (+${this.calculateTileValue(tile)} pts)`;
    } else {
      // Invalid - return tile to hand
      this.state.players[0].hand.push(tile);
      this.state.message = `❌ That tile doesn't fit in this meld!`;
    }
    
    // Reset drag state
    this.state.draggedTile = null;
    
    this.refreshUI();
  }

  // 🔧 LEGACY: Keep old method for compatibility but redirect to building meld
  handleDropNewMeld(event) {
    this.handleDropToBuildingMeld(event);
  }

  // 🔧 NEW: Meld building operations
  removeFromBuildingMeld(index) {
    const tile = this.state.buildingMeld.splice(index, 1)[0];
    this.state.players[0].hand.push(tile);
    this.state.message = `Tile returned to hand. Building meld: ${this.state.buildingMeld.length} tiles`;
    this.refreshUI();
  }

  commitBuildingMeld() {
    if (!this.isValidMeld(this.state.buildingMeld)) {
      this.state.message = "❌ Cannot commit invalid meld!";
      this.refreshUI();
      return;
    }

    // Add to official melds with player ownership
    const newMeld = {
      tiles: [...this.state.buildingMeld],
      playedBy: 0, // Player index (0 = human player)
      playerName: this.state.players[0].name,
      emoji: '🙂' // Human player emoji
    };
    this.state.melds.push(newMeld);
    const score = this.calculateMeldScore(this.state.buildingMeld);
    
    // Mark that player made a play
    this.state.playerMadePlay = true;
    
    // Clear building meld and manipulation history
    this.state.buildingMeld = [];
    this.state.manipulatedMelds = [];
    
    this.state.message = `✅ Meld committed! +${score} points. You can end your turn or play more tiles.`;
    this.refreshUI();
  }

  clearBuildingMeld() {
    if (this.state.buildingMeld.length === 0) return;
    
    // Check if we can restore original melds unchanged
    if (this.state.manipulatedMelds.length > 0 && !this.hasPlayerAddedTilesToBuilding()) {
      // Player only moved table melds to building but didn't add any hand tiles
      // Restore the original melds to the table
      this.state.manipulatedMelds.forEach(({originalMeld}) => {
        this.state.melds.push(originalMeld);
      });
      
      this.state.message = "🔄 Meld manipulation cancelled. Original melds restored to table.";
    } else {
      // Player added tiles from their hand, so separate table tiles from hand tiles
      const handTiles = this.state.buildingMeld.filter(tile => 
        this.wasFromPlayerHand(tile)
      );
      
      // Return hand tiles to player's hand
      handTiles.forEach(tile => {
        this.state.players[0].hand.push(tile);
      });
      
      // Restore original table melds if possible
      this.state.manipulatedMelds.forEach(({originalMeld}) => {
        this.state.melds.push(originalMeld);
      });
      
      if (handTiles.length > 0) {
        this.state.message = `🔄 Building cleared. ${handTiles.length} tiles returned to hand, table melds restored.`;
      } else {
        this.state.message = "🔄 Meld manipulation cancelled. Original melds restored to table.";
      }
    }
    
    // Clear building state
    this.state.buildingMeld = [];
    this.state.manipulatedMelds = [];
    this.refreshUI();
  }

  // Helper function to check if player added any of their own tiles to building
  hasPlayerAddedTilesToBuilding() {
    const originalTableTileIds = new Set();
    this.state.manipulatedMelds.forEach(({originalMeld}) => {
      const tiles = originalMeld.tiles || originalMeld;
      tiles.forEach(tile => originalTableTileIds.add(tile.id));
    });
    
    // Check if building has any tiles that weren't from the original table melds
    return this.state.buildingMeld.some(tile => !originalTableTileIds.has(tile.id));
  }

  // Helper function to determine if a tile was originally from player's hand
  wasFromPlayerHand(tile) {
    const originalTableTileIds = new Set();
    this.state.manipulatedMelds.forEach(({originalMeld}) => {
      const tiles = originalMeld.tiles || originalMeld;
      tiles.forEach(t => originalTableTileIds.add(t.id));
    });
    
    return !originalTableTileIds.has(tile.id);
  }

  // 🎯 Meld Manipulation Functions
  moveMeldToBuilding(meldIndex) {
    if (!this.state.melds[meldIndex]) return;
    
    const meld = this.state.melds[meldIndex];
    const tiles = meld.tiles || meld;
    
    // Store the original meld for potential restoration
    this.state.manipulatedMelds.push({
      originalMeld: JSON.parse(JSON.stringify(meld)), // Deep copy
      originalIndex: meldIndex
    });
    
    // Add all tiles from the meld to building area
    this.state.buildingMeld.push(...tiles);
    
    // Remove the meld from tabletop
    this.state.melds.splice(meldIndex, 1);
    
    this.state.message = `🔧 Moved meld to building area for rearrangement. ${tiles.length} tiles added.`;
    this.refreshUI();
  }

  moveTileFromMeldToBuilding(meldIndex, tileId) {
    if (!this.state.melds[meldIndex]) return;
    
    const meld = this.state.melds[meldIndex];
    const tiles = meld.tiles || meld;
    const tileIndex = tiles.findIndex(t => t.id === tileId);
    
    if (tileIndex === -1) return;
    
    // Store the original meld for potential restoration
    this.state.manipulatedMelds.push({
      originalMeld: JSON.parse(JSON.stringify(meld)), // Deep copy
      originalIndex: meldIndex
    });
    
    // Move the specific tile to building area
    const tile = tiles.splice(tileIndex, 1)[0];
    this.state.buildingMeld.push(tile);
    
    // If meld becomes too small, remove it entirely and move remaining tiles to building
    if (tiles.length < 3) {
      this.state.buildingMeld.push(...tiles);
      this.state.melds.splice(meldIndex, 1);
      this.state.message = `🔧 Meld broken apart - all ${tiles.length + 1} tiles moved to building area.`;
    } else {
      this.state.message = `🔧 Tile moved to building area. Remaining meld: ${tiles.length} tiles.`;
    }
    
    this.refreshUI();
  }

  calculateTileValue(tile) {
    if (tile.color === 'joker') return 30;
    return typeof tile.num === 'number' ? tile.num : 0;
  }

  selectTileForMeld(index) {
    // Alternative to drag-and-drop for mobile/touch devices
    if (this.state.selectedTile === index) {
      this.state.selectedTile = null;
      this.state.message = "Tile deselected.";
    } else {
      this.state.selectedTile = index;
      this.state.message = "Tile selected. Click a meld to add it there, or click 'Create New Meld'.";
    }
    this.refreshUI();
  }

  // 📈 Scoring System
  calculateMeldScore(meld) {
    // Handle both old format (array) and new format (object with tiles property)
    const tiles = meld.tiles || meld;
    if (!tiles || tiles.length === 0) return 0;
    
    return tiles.reduce((total, tile) => {
      if (tile.color === 'joker') return total + 30; // Jokers worth 30 points
      return total + (typeof tile.num === 'number' ? tile.num : 0);
    }, 0);
  }

  calculateHandScore(hand) {
    return hand.reduce((total, tile) => {
      if (tile.color === 'joker') return total + 30;
      return total + (typeof tile.num === 'number' ? tile.num : 0);
    }, 0);
  }

  calculatePlayerScore(playerId) {
    const player = this.state.players[playerId];
    if (!player) return 0;
    
    // Score is negative hand value (penalty for remaining tiles)
    return -this.calculateHandScore(player.hand);
  }

  updateAllScores() {
    this.state.players.forEach((player, i) => {
      player.score = this.calculatePlayerScore(i);
      this.state.score[i === 0 ? 'player' : `ai${i}`] = player.score;
    });
  }

  // 🏁 Win Condition Logic
  checkWinCondition() {
    // Check if any player has emptied their hand
    const winner = this.state.players.find(player => player.hand.length === 0);
    
    if (winner) {
      this.state.gameEnded = true;
      this.state.winner = winner;
      
      // Award bonus points to winner
      winner.score += 100;
      
      // Update final scores
      this.updateAllScores();
      
      this.state.message = `🎉 ${winner.name} wins by emptying their hand!`;
      return true;
    }
    
    // Check if tile pile is empty and no one can play
    if (this.state.tiles.length === 0) {
      // Find player with lowest hand value
      let lowestScore = Infinity;
      let winner = null;
      
      this.state.players.forEach(player => {
        const handValue = this.calculateHandScore(player.hand);
        if (handValue < lowestScore) {
          lowestScore = handValue;
          winner = player;
        }
      });
      
      if (winner) {
        this.state.gameEnded = true;
        this.state.winner = winner;
        this.updateAllScores();
        this.state.message = `🎉 ${winner.name} wins with the lowest hand value!`;
        return true;
      }
    }
    
    return false;
  }

  // 🃏 Enhanced Joker Logic
  isValidMeld(meld) {
    // Handle both old format (array) and new format (object with tiles property)
    const tiles = meld.tiles || meld;
    if (!tiles || tiles.length < 3) return false;
    
    // Separate jokers from regular tiles
    const jokers = tiles.filter(t => t.color === 'joker');
    const regularTiles = tiles.filter(t => t.color !== 'joker');
    
    if (jokers.length === tiles.length) return false; // All jokers is not valid
    
    // Check if it's a run or a group
    return this.isValidRun(tiles) || this.isValidGroup(tiles);
  }

  isValidRun(meld) {
    const jokers = meld.filter(t => t.color === 'joker');
    const regularTiles = meld.filter(t => t.color !== 'joker' && typeof t.num === 'number');
    
    if (regularTiles.length === 0) return false;
    
    // All regular tiles must be same color
    const colors = [...new Set(regularTiles.map(t => t.color))];
    if (colors.length > 1) return false;
    
    // Sort numbers and check for sequence with jokers filling gaps
    const numbers = regularTiles.map(t => t.num).sort((a, b) => a - b);
    
    // Check for duplicates in regular tiles
    for (let i = 1; i < numbers.length; i++) {
      if (numbers[i] === numbers[i-1]) return false;
    }
    
    // Calculate required jokers
    let jokersNeeded = 0;
    for (let i = 1; i < numbers.length; i++) {
      const gap = numbers[i] - numbers[i-1] - 1;
      if (gap > 0) {
        jokersNeeded += gap;
      }
    }
    
    // Check if we can extend the sequence with remaining jokers
    let extraJokers = jokers.length - jokersNeeded;
    let minPossible = Math.max(1, numbers[0] - extraJokers);
    let maxPossible = Math.min(13, numbers[numbers.length - 1] + extraJokers);
    
    // Must be able to form a valid sequence within 1-13 range
    return jokersNeeded <= jokers.length && 
           (numbers[numbers.length - 1] - numbers[0] + 1 + (jokers.length - jokersNeeded)) >= 3;
  }

  isValidGroup(meld) {
    const jokers = meld.filter(t => t.color === 'joker');
    const regularTiles = meld.filter(t => t.color !== 'joker');
    
    if (regularTiles.length === 0) return false;
    
    // All regular tiles must have same number
    const numbers = [...new Set(regularTiles.map(t => t.num))];
    if (numbers.length > 1) return false;
    
    // All regular tiles must have different colors
    const colors = [...new Set(regularTiles.map(t => t.color))];
    if (colors.length !== regularTiles.length) return false;
    
    // Total unique colors (including jokers) must not exceed 4
    return colors.length + jokers.length <= 4;
  }

  validateAllMelds() {
    // First, try to commit the building meld if there is one
    if (this.state.buildingMeld.length > 0) {
      if (this.isValidMeld(this.state.buildingMeld)) {
        this.commitBuildingMeld();
        return true; // Successfully committed building meld
      } else {
        this.state.message = "❌ Cannot play invalid meld! Check your building area.";
        this.refreshUI();
        return false;
      }
    }

    // If no building meld, validate all existing melds on tabletop
    let allValid = true;
    let totalScore = 0;
    
    this.state.melds.forEach((meld, index) => {
      const isValid = this.isValidMeld(meld.tiles || meld);
      if (!isValid) {
        allValid = false;
        this.state.message = `❌ Meld ${index + 1} is invalid!`;
      } else {
        totalScore += this.calculateMeldScore(meld.tiles || meld);
      }
    });
    
    if (allValid && this.state.melds.length > 0) {
      this.state.message = `✅ All melds are valid! Total: ${totalScore} points.`;
    } else if (this.state.melds.length === 0) {
      this.state.message = "🛠️ Build a meld first, then click Play Meld to submit it!";
    }
    
    this.refreshUI();
    return allValid;
  }

  drawTile() {
    // ✅ Safety check
    if (!this.state.players || this.state.players.length === 0 || !this.state.players[0].hand) {
      console.error('Game not properly initialized');
      return;
    }

    if (this.state.tiles.length > 0) {
      const tile = this.state.tiles.pop();
      this.state.players[0].hand.push(tile);
      this.state.playerMadePlay = true; // Drawing a tile counts as making a play
      this.state.message = "You drew a tile. 🎴";
    } else {
      this.state.message = "No tiles left to draw! 😞";
    }
    
    this.refreshUI();
  }

  endTurn() {
    // Check if player has made a valid play
    if (!this.validatePlayerTurn()) {
      this.refreshUI();
      return;
    }

    // Reset player play flag for next turn
    this.state.playerMadePlay = false;

    this.state.turn = (this.state.turn + 1) % this.state.players.length;
    this.state.message = "AI players are thinking... 🤔";
    
    this.refreshUI();
    
    // Check win condition after player turn
    if (this.checkWinCondition()) {
      this.refreshUI();
      return;
    }
    
    setTimeout(() => this.aiTurn(), 1000);
  }

  validatePlayerTurn() {
    const player = this.state.players[0];
    
    // Check if player has made any move this turn
    if (this.state.buildingMeld.length > 0) {
      this.state.message = "❌ You have tiles in the building area! Commit or clear them first.";
      return false;
    }
    
    // Track initial meld requirement
    if (!player.initialMeld) {
      // Check if player has played at least one meld this game
      // For simplicity, if there are melds on the table, assume player contributed
      if (this.state.melds.length === 0) {
        this.state.message = "❌ You must play your first meld before ending your turn!";
        return false;
      }
      
      // Calculate the total value of all melds on table
      const totalTableScore = this.state.melds.reduce((sum, meld) => sum + this.calculateMeldScore(meld), 0);
      
      // If there's at least one meld worth 30+ points, assume player contributed enough
      const hasValidInitialMeld = this.state.melds.some(meld => this.calculateMeldScore(meld) >= 30);
      
      if (!hasValidInitialMeld) {
        this.state.message = "❌ Your first meld must be worth at least 30 points!";
        return false;
      }
      
      // Mark player as having made initial meld
      player.initialMeld = true;
    }
    
    // For subsequent turns, just check if player made any play this turn
    // We'll track this with a simple flag
    if (!this.state.playerMadePlay) {
      this.state.message = "❌ You must play at least one tile or draw a tile before ending your turn!";
      return false;
    }
    
    return true;
  }

  // 🧠 Enhanced AI Logic
  aiTurn() {
    for (let i = 1; i < this.state.players.length; i++) {
      const ai = this.state.players[i];
      let madePlay = false;
      
      // First, try to add tiles to existing melds
      if (ai.initialMeld && this.state.melds.length > 0) {
        for (let handIndex = ai.hand.length - 1; handIndex >= 0; handIndex--) {
          const tile = ai.hand[handIndex];
          for (let meldIndex = 0; meldIndex < this.state.melds.length; meldIndex++) {
            const testMeld = [...this.state.melds[meldIndex], tile];
            if (this.isValidMeld(testMeld)) {
              // Add tile to existing meld
              this.state.melds[meldIndex].push(tile);
              ai.hand.splice(handIndex, 1);
              madePlay = true;
              this.state.message += `🤖 AI ${i} added tile to existing meld (+${this.calculateTileValue(tile)} pts)`;
              
              if (ai.hand.length === 0) {
                this.state.gameEnded = true;
                this.state.winner = ai;
                this.updateAllScores();
                this.state.message = `🎉 ${ai.name} wins!`;
                this.refreshUI();
                return;
              }
              break;
            }
          }
        }
      }
      
      // Try to play new melds
      let attempts = 0;
      while (attempts < 5 && ai.hand.length >= 3) {
        const meld = this.findBestMeld(ai.hand);
        
        if (meld.length >= 3 && this.isValidMeld(meld)) {
          const meldScore = this.calculateMeldScore(meld);
          
          // Check if AI can make initial meld (30+ points)
          if (!ai.initialMeld && meldScore < 30) {
            // Try to find a better meld or combine with jokers
            const betterMeld = this.findInitialMeld(ai.hand);
            if (betterMeld.length >= 3 && this.calculateMeldScore(betterMeld) >= 30) {
              const aiMeld = {
                tiles: betterMeld,
                playedBy: i + 1,
                playerName: ai.name,
                emoji: i === 0 ? '🤖' : '🛸' // Different emojis for AI players
              };
              this.state.melds.push(aiMeld);
              ai.hand = ai.hand.filter(t => !betterMeld.some(m => m.id === t.id));
              ai.initialMeld = true;
              madePlay = true;
              this.state.message += ` 🤖 AI ${i} played initial meld (${this.calculateMeldScore(betterMeld)} pts)`;
            } else {
              break; // Can't make valid initial meld
            }
          } else {
            // Play the meld
            const aiMeld = {
              tiles: meld,
              playedBy: i + 1,
              playerName: ai.name,
              emoji: i === 0 ? '🤖' : '🛸' // Different emojis for AI players
            };
            this.state.melds.push(aiMeld);
            ai.hand = ai.hand.filter(t => !meld.some(m => m.id === t.id));
            if (!ai.initialMeld) ai.initialMeld = true;
            madePlay = true;
            
            this.state.message += ` 🤖 AI ${i} played a ${meld.length}-tile meld (${meldScore} pts)`;
          }
          
          // Check if AI won
          if (ai.hand.length === 0) {
            this.state.gameEnded = true;
            this.state.winner = ai;
            this.updateAllScores();
            this.state.message = `🎉 ${ai.name} wins!`;
            this.refreshUI();
            return;
          }
        } else {
          break; // No more valid melds
        }
        attempts++;
      }
      
      // If couldn't play, draw a tile (but not too many)
      if (!madePlay && this.state.tiles.length > 0 && ai.hand.length < 20) {
        ai.hand.push(this.state.tiles.pop());
        this.state.message += `🎴 AI ${i} drew a tile`;
      } else if (!madePlay) {
        this.state.message += `⏭️ AI ${i} passed`;
      }
    }

    this.state.message += ` 🎮 Your turn!`;
    this.state.turn = 0; // Back to player
    
    // Reset player play flag for the new turn
    this.state.playerMadePlay = false;
    
    this.updateAllScores();
    
    // Add a brief pause to let players see AI moves
    setTimeout(() => {
      this.refreshUI();
    }, 500);
  }

  findBestMeld(hand) {
    // Try to find the highest-scoring valid meld
    let bestMeld = [];
    let bestScore = 0;
    
    // Try runs first
    for (const color of this.state.colors) {
      const colorTiles = hand.filter(t => t.color === color && typeof t.num === 'number')
                             .sort((a, b) => a.num - b.num);
      
      for (let i = 0; i < colorTiles.length - 2; i++) {
        for (let j = i + 2; j < colorTiles.length; j++) {
          const potential = colorTiles.slice(i, j + 1);
          if (this.isConsecutiveRun(potential)) {
            const score = this.calculateMeldScore(potential);
            if (score > bestScore) {
              bestMeld = potential;
              bestScore = score;
            }
          }
        }
      }
    }
    
    // Try groups
    for (let num = 1; num <= 13; num++) {
      const numTiles = hand.filter(t => t.num === num && t.color !== 'joker');
      if (numTiles.length >= 3) {
        // Get best 3-4 tiles of different colors
        const uniqueColors = [...new Set(numTiles.map(t => t.color))];
        const groupTiles = uniqueColors.slice(0, 4).map(color => 
          numTiles.find(t => t.color === color)
        );
        
        if (groupTiles.length >= 3) {
          const score = this.calculateMeldScore(groupTiles);
          if (score > bestScore) {
            bestMeld = groupTiles;
            bestScore = score;
          }
        }
      }
    }
    
    // Try incorporating jokers for higher scores
    const jokers = hand.filter(t => t.color === 'joker');
    if (jokers.length > 0 && bestMeld.length > 0) {
      // Try to extend the best meld with jokers
      const extendedMeld = this.tryExtendMeldWithJokers([...bestMeld], jokers, hand);
      if (extendedMeld.length > bestMeld.length) {
        const score = this.calculateMeldScore(extendedMeld);
        if (score > bestScore) {
          bestMeld = extendedMeld;
          bestScore = score;
        }
      }
    }
    
    return bestMeld;
  }

  findInitialMeld(hand) {
    // Specifically find a meld worth 30+ points for initial play
    let bestMeld = [];
    let bestScore = 0;
    
    // Try high-value groups first (10, 11, 12, 13)
    for (let num = 10; num <= 13; num++) {
      const numTiles = hand.filter(t => t.num === num && t.color !== 'joker');
      if (numTiles.length >= 3) {
        const uniqueColors = [...new Set(numTiles.map(t => t.color))];
        const groupTiles = uniqueColors.slice(0, 4).map(color => 
          numTiles.find(t => t.color === color)
        );
        
        if (groupTiles.length >= 3) {
          const score = this.calculateMeldScore(groupTiles);
          if (score >= 30 && score > bestScore) {
            bestMeld = groupTiles;
            bestScore = score;
          }
        }
      }
    }
    
    // Try long runs with high values
    for (const color of this.state.colors) {
      const colorTiles = hand.filter(t => t.color === color && typeof t.num === 'number')
                             .sort((a, b) => a.num - b.num);
      
      for (let i = 0; i < colorTiles.length - 2; i++) {
        for (let j = i + 2; j < colorTiles.length; j++) {
          const potential = colorTiles.slice(i, j + 1);
          if (this.isConsecutiveRun(potential)) {
            const score = this.calculateMeldScore(potential);
            if (score >= 30 && score > bestScore) {
              bestMeld = potential;
              bestScore = score;
            }
          }
        }
      }
    }
    
    // Try using jokers to reach 30 points
    const jokers = hand.filter(t => t.color === 'joker');
    if (jokers.length > 0 && bestScore < 30) {
      // Try combinations with jokers
      for (let num = 10; num <= 13; num++) {
        const numTiles = hand.filter(t => t.num === num && t.color !== 'joker');
        if (numTiles.length >= 2 && jokers.length >= 1) {
          const meldWithJoker = [...numTiles.slice(0, 2), jokers[0]];
          if (this.isValidMeld(meldWithJoker)) {
            const score = this.calculateMeldScore(meldWithJoker);
            if (score >= 30 && score > bestScore) {
              bestMeld = meldWithJoker;
              bestScore = score;
            }
          }
        }
      }
    }
    
    return bestMeld;
  }

  tryExtendMeldWithJokers(meld, jokers, hand) {
    if (jokers.length === 0 || meld.length === 0) return meld;
    
    // Try to extend a run with jokers
    if (this.isValidRun(meld) && jokers.length > 0) {
      const sortedMeld = meld.filter(t => t.color !== 'joker').sort((a, b) => a.num - b.num);
      if (sortedMeld.length > 0) {
        const color = sortedMeld[0].color;
        const minNum = sortedMeld[0].num;
        const maxNum = sortedMeld[sortedMeld.length - 1].num;
        
        // Try adding joker at the beginning or end
        if (minNum > 1) {
          return [...meld, jokers[0]]; // Joker represents minNum - 1
        } else if (maxNum < 13) {
          return [...meld, jokers[0]]; // Joker represents maxNum + 1
        }
      }
    }
    
    // Try to extend a group with jokers
    if (this.isValidGroup(meld) && jokers.length > 0) {
      const regularTiles = meld.filter(t => t.color !== 'joker');
      const usedColors = new Set(regularTiles.map(t => t.color));
      if (usedColors.size < 4) {
        return [...meld, jokers[0]]; // Joker represents missing color
      }
    }
    
    return meld;
  }

  isConsecutiveRun(tiles) {
    if (tiles.length < 3) return false;
    for (let i = 1; i < tiles.length; i++) {
      if (tiles[i].num !== tiles[i-1].num + 1) return false;
    }
    return true;
  }

  // 🔄 Utility Functions
  refreshUI() {
    // Try to get window content if we don't have it
    if (!this.windowContent && this.windowId) {
      const windowData = window.windowManager?.windows?.get(this.windowId);
      if (windowData && windowData.element) {
        this.windowContent = windowData.element.querySelector('.window-content');
      }
    }

    if (this.windowContent) {
      // Clear and re-render the content
      this.windowContent.innerHTML = '';
      const newContent = this.render();
      if (newContent instanceof HTMLElement) {
        this.windowContent.appendChild(newContent);
      }
    } else {
      // Fallback: ask WindowManager to reload the app
      if (this.windowId && window.windowManager) {
        window.windowManager.loadApp(this.windowId, this);
      }
    }

    // Re-layout tabletop if it exists
    setTimeout(() => {
      const viewport = document.getElementById('tabletop-viewport');
      if (viewport) {
        this.layoutMeldsOnTabletop(viewport);
      }
    }, 100);
  }

  toggleDebugMode() {
    this.state.debugMode = !this.state.debugMode;
    this.state.message = `Debug mode ${this.state.debugMode ? 'enabled' : 'disabled'} 🧪`;
    this.refreshUI();
  }

  // 💾 Save/Load System
  saveGameState() {
    try {
      const saveData = {
        state: this.state,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };
      localStorage.setItem('rummikub_save', JSON.stringify(saveData));
      this.state.message = "Game saved! 💾";
      this.refreshUI();
    } catch (error) {
      console.error('Save failed:', error);
      this.state.message = "❌ Save failed!";
      this.refreshUI();
    }
  }

  loadGameState() {
    try {
      const saveData = localStorage.getItem('rummikub_save');
      if (!saveData) {
        this.state.message = "No saved game found! 📁";
        this.refreshUI();
        return;
      }
      
      const parsed = JSON.parse(saveData);
      this.state = { ...this.state, ...parsed.state };
      this.state.message = "Game loaded! 📁";
      this.refreshUI();
    } catch (error) {
      console.error('Load failed:', error);
      this.state.message = "❌ Load failed!";
      this.refreshUI();
    }
  }

  // 📱 Responsive helpers
  getWindowSize() {
    const rect = this.windowContent?.getBoundingClientRect();
    return {
      width: rect?.width || 800,
      height: rect?.height || 600,
      isSmall: (rect?.width || 800) < 600
    };
  }

}

// 🎮 Initialize the game (instance will set window.activeApp during init)
try {
  new NebulaApp_Rummikub();
} catch (error) {
  console.error('Failed to initialize Rummikub:', error);
}
