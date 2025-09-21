class NebulaApp_Rummikub {
  constructor() {
    this.windowId = null;
    this.windowContent = null;

    this.colors = ["red", "blue", "yellow", "black"];
    this.tiles = [];
    this.players = [];
    this.melds = [];
    this.turn = 0;
    this.message = "";

    this.init();
  }

async init() {
  if (!window.windowManager) {
    console.error('WindowManager not available');
    return;
  }

  // ✅ Initialize game data FIRST
  this.startGame();

  this.windowId = window.windowManager.createWindow({
    title: 'Rummikub',
    width: 800,
    height: 600,
    resizable: true,
    maximizable: true,
    minimizable: true
  });

  // Load the app — this triggers render()
  window.windowManager.loadApp(this.windowId, this);

  // Then get the content reference
  this.windowContent = window.windowManager.getWindowContent(this.windowId);
}



  startGame() {
    for (let i = 1; i <= 13; i++) {
      for (let c of this.colors) {
        this.tiles.push({ num: i, color: c });
        this.tiles.push({ num: i, color: c });
      }
    }
    this.tiles.push({ num: "J", color: "joker" });
    this.tiles.push({ num: "J", color: "joker" });

    this.tiles = this.tiles.sort(() => Math.random() - 0.5);

    for (let i = 0; i < 3; i++) {
      this.players.push({ hand: this.tiles.splice(0, 14), melded: false });
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
    `;
    bar.textContent = 'Rummikub';
    return bar;
  }

  createStatusBar() {
    const bar = document.createElement('div');
    bar.className = 'myapp-statusbar';
    bar.style.cssText = `
      padding: 8px 16px;
      background: var(--nebula-bg-secondary);
      color: var(--nebula-text-secondary);
      font-size: 12px;
    `;
    bar.innerHTML = this.message || 'Your turn!';
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
    `;

    // ✅ Safety check: ensure players are initialized
    if (!this.players || this.players.length === 0) {
      contentArea.innerHTML = `
        <div style="color: var(--nebula-text-primary); text-align: center; margin-top: 50px;">
          <h2>Initializing Rummikub...</h2>
          <p>Setting up tiles and players...</p>
        </div>
      `;
      return contentArea;
    }

    let html = `<h2 style="color: var(--nebula-text-primary);">Rummikub</h2>`;

    html += `<div><strong>Melds:</strong></div>`;
    for (let meld of this.melds) {
      html += `<div style="margin:5px;">${meld.map(t => this.tileHTML(t)).join(" ")}</div>`;
    }

    const player = this.players[0];
    html += `<div><strong>Your Hand:</strong></div>`;
    html += `<div id="player-hand">${player.hand.map((t, i) => `<span onclick="window.activeApp.playTile(${i})">${this.tileHTML(t)}</span>`).join(" ")}</div>`;

    html += `<div style="margin-top:10px;">
      <button onclick="window.activeApp.endTurn()">End Turn</button>
      <button onclick="window.activeApp.drawTile()">Draw Tile</button>
    </div>`;

    contentArea.innerHTML = html;
    return contentArea;
  }

  tileHTML(tile) {
    const colorMap = {
      red: "#e74c3c",
      blue: "#3498db",
      yellow: "#f1c40f",
      black: "#2c3e50",
      joker: "#9b59b6"
    };
    return `<span style="display:inline-block;padding:5px 10px;margin:2px;border-radius:4px;background:${colorMap[tile.color]};color:white;">${tile.num}</span>`;
  }

  playTile(index) {
    // ✅ Safety check
    if (!this.players || this.players.length === 0 || !this.players[0].hand) {
      console.error('Game not properly initialized');
      return;
    }

    const tile = this.players[0].hand.splice(index, 1)[0];
    this.melds.push([tile]);
    this.message = "Tile played. Build your melds!";
    this.windowContent.innerHTML = '';
    this.windowContent.appendChild(this.render());
  }

  drawTile() {
    // ✅ Safety check
    if (!this.players || this.players.length === 0 || !this.players[0].hand) {
      console.error('Game not properly initialized');
      return;
    }

    if (this.tiles.length > 0) {
      const tile = this.tiles.pop();
      this.players[0].hand.push(tile);
      this.message = "You drew a tile.";
    } else {
      this.message = "No tiles left to draw.";
    }
    this.windowContent.innerHTML = '';
    this.windowContent.appendChild(this.render());
  }

  endTurn() {
    this.message = "AI players are thinking...";
    this.windowContent.innerHTML = '';
    this.windowContent.appendChild(this.render());
    setTimeout(() => this.aiTurn(), 1000);
  }

  aiTurn() {
    for (let i = 1; i < this.players.length; i++) {
      const ai = this.players[i];
      const meld = this.findSimpleMeld(ai.hand);
      if (meld.length > 0) {
        this.melds.push(meld);
        ai.hand = ai.hand.filter(t => !meld.includes(t));
        this.message += `<br>AI ${i} played a meld.`;
      } else if (this.tiles.length > 0) {
        ai.hand.push(this.tiles.pop());
        this.message += `<br>AI ${i} drew a tile.`;
      } else {
        this.message += `<br>AI ${i} passed.`;
      }
    }
    this.message += `<br>Your turn!`;
    this.windowContent.innerHTML = '';
    this.windowContent.appendChild(this.render());
  }

  findSimpleMeld(hand) {
    for (let i = 1; i <= 13; i++) {
      const group = hand.filter(t => t.num === i && t.color !== "joker");
      const uniqueColors = [...new Set(group.map(t => t.color))];
      if (group.length >= 3 && uniqueColors.length === group.length) {
        return group.slice(0, 3);
      }
    }
    for (let c of this.colors) {
      const run = hand.filter(t => t.color === c && typeof t.num === "number").sort((a, b) => a.num - b.num);
      for (let i = 0; i < run.length - 2; i++) {
        if (run[i + 1].num === run[i].num + 1 && run[i + 2].num === run[i].num + 2) {
          return [run[i], run[i + 1], run[i + 2]];
        }
      }
    }
    return [];
  }
}

window.activeApp = new NebulaApp_Rummikub();
