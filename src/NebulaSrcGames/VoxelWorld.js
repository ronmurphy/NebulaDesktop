// Nebula Voxel World - First NebulaApp Game
// Created by GitHub Copilot with human feedback and guidance
// Based on NebulaApp-Single template
// 
// A Minecraft-like 3D voxel world built with Three.js featuring:
// - Chunk-based world generation with procedural textures
// - Full 6DOF movement with physics and collision detection
// - Block placement/removal with visual feedback
// - Save/load system optimized for performance
// - Real-time 3D graphics at 60fps
//
// This represents the first fully functional game created for the NebulaDesktop platform!

class NebulaVoxelApp {
    constructor() {
        this.windowId = null;
        this.world = {};
        this.loadedChunks = new Set(); // Track which chunks are loaded
        this.chunkSize = 12; // Smaller chunks for better performance
        this.renderDistance = 2; // Reduced render distance (5x5 chunks)
        this.player = {
            position: { x: 0, y: 10, z: 0 }, // Start higher up and centered
            rotation: { x: 0, y: 0 }
        };
        this.keys = {};
        this.selectedBlock = "grass"; // Default block type to place
        this.init();
    }

    async init() {
        if (!window.windowManager) {
            console.error('WindowManager not available');
            return;
        }

        this.windowId = window.windowManager.createWindow({
            title: 'Voxel World',
            width: 900,
            height: 700,
            resizable: true,
            maximizable: true,
            minimizable: true
        });

        window.windowManager.loadApp(this.windowId, this);
        console.log(`VoxelApp initialized with window ${this.windowId}`);
    }

    render() {
        const container = document.createElement('div');
        container.className = 'voxelapp-container';
        container.style.cssText = `
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            background: black;
        `;

        const toolbar = this.createToolbar();
        const contentArea = this.createContentArea();
        const statusBar = this.createStatusBar();

        container.appendChild(toolbar);
        container.appendChild(contentArea);
        container.appendChild(statusBar);

        setTimeout(() => {
            this.loadThree(contentArea);
        }, 0);

        return container;
    }

    createToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'voxelapp-toolbar';
        toolbar.style.cssText = `
            height: 48px;
            background: var(--nebula-surface);
            border-bottom: 1px solid var(--nebula-border);
            display: flex;
            align-items: center;
            padding: 0 16px;
            gap: 8px;
            flex-shrink: 0;
        `;

        toolbar.innerHTML = `
            <button id="save-btn">💾 Save</button>
            <button id="load-btn">📂 Load</button>
            <button id="delete-btn">🗑 Delete Save</button>
            <div style="margin-left: auto; font-weight: 500;">
                Voxel World
            </div>
            // <button id="close-btn" style="margin-left: 8px;">✖ Close</button>
        `;

        return toolbar;
    }

    createContentArea() {
        const content = document.createElement('div');
        content.className = 'voxelapp-content';
        content.style.cssText = `
            flex: 1;
            overflow: hidden;
            position: relative;
        `;
        return content;
    }

    createStatusBar() {
        const statusBar = document.createElement('div');
        statusBar.className = 'voxelapp-status';
        statusBar.style.cssText = `
            height: 24px;
            background: var(--nebula-surface);
            border-top: 1px solid var(--nebula-border);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 16px;
            font-size: 12px;
            color: var(--nebula-text-secondary);
        `;
        statusBar.innerHTML = `
            <span id="status-info">Ready</span>
            <span id="status-details">VoxelApp v0.2</span>
        `;
        return statusBar;
    }

    updateStatus(msg) {
        const el = document.getElementById('status-info');
        if (el) el.textContent = msg;
    }

    loadThree(container) {
        // Check if Three.js is already loaded
        if (window.THREE) {
            this.startGame(container);
            return;
        }

        // Temporarily disable AMD to avoid conflicts with Monaco Editor's loader
        const originalDefine = window.define;
        if (window.define && window.define.amd) {
            window.define = undefined;
        }

        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js";
        script.onload = () => {
            // Restore original define after Three.js loads
            if (originalDefine) {
                window.define = originalDefine;
            }
            
            // Add a small delay to ensure THREE is fully available
            setTimeout(() => {
                if (window.THREE) {
                    console.log('✅ Three.js loaded successfully');
                    this.startGame(container);
                } else {
                    console.error('Three.js failed to load properly');
                    this.updateStatus('Failed to load 3D engine');
                }
            }, 100);
        };
        script.onerror = () => {
            // Restore original define on error too
            if (originalDefine) {
                window.define = originalDefine;
            }
            console.error('Failed to load Three.js');
            this.updateStatus('Failed to load 3D engine');
        };
        document.head.appendChild(script);
    }

    startGame(container) {
        // Verify Three.js is available
        if (!window.THREE) {
            console.error('Three.js not available');
            this.updateStatus('3D engine not loaded');
            return;
        }

        const THREE = window.THREE;
        console.log('✅ Three.js loaded successfully');
        this.updateStatus('Initializing 3D world...');

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setClearColor(0x87CEEB); // Sky blue background
        container.appendChild(renderer.domElement);

        // Handle window resize
        const handleResize = () => {
            const width = container.clientWidth;
            const height = container.clientHeight;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        };
        window.addEventListener('resize', handleResize);

        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        // Better lighting setup
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6); // Soft ambient light
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 50, 50);
        directionalLight.castShadow = true;
        scene.add(directionalLight);

        const blockTypes = {
            grass: { color: 0x228B22, texture: 'grass' },    // Forest green with grass pattern
            dirt: { color: 0xD2691E, texture: 'dirt' },      // Chocolate brown with dirt pattern  
            stone: { color: 0x696969, texture: 'stone' },    // Dim gray with stone pattern
            bedrock: { color: 0x2F2F2F, texture: 'bedrock' } // Dark gray, unbreakable
        };

        // Create textured materials
        const createBlockMaterial = (blockType) => {
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = 64;
            const ctx = canvas.getContext('2d');
            
            // Base color
            ctx.fillStyle = `#${blockType.color.toString(16).padStart(6, '0')}`;
            ctx.fillRect(0, 0, 64, 64);
            
            // Add simple texture patterns
            ctx.globalAlpha = 0.3;
            if (blockType.texture === 'grass') {
                // Grass texture - small green dots
                ctx.fillStyle = '#90EE90';
                for (let i = 0; i < 20; i++) {
                    ctx.fillRect(Math.random() * 64, Math.random() * 64, 2, 2);
                }
            } else if (blockType.texture === 'dirt') {
                // Dirt texture - brown spots
                ctx.fillStyle = '#8B4513';
                for (let i = 0; i < 15; i++) {
                    ctx.fillRect(Math.random() * 64, Math.random() * 64, 3, 3);
                }
            } else if (blockType.texture === 'stone') {
                // Stone texture - gray speckles
                ctx.fillStyle = '#A9A9A9';
                for (let i = 0; i < 25; i++) {
                    ctx.fillRect(Math.random() * 64, Math.random() * 64, 1, 1);
                }
            } else if (blockType.texture === 'bedrock') {
                // Bedrock texture - dark cracks
                ctx.strokeStyle = '#1C1C1C';
                ctx.lineWidth = 1;
                for (let i = 0; i < 10; i++) {
                    ctx.beginPath();
                    ctx.moveTo(Math.random() * 64, Math.random() * 64);
                    ctx.lineTo(Math.random() * 64, Math.random() * 64);
                    ctx.stroke();
                }
            }
            
            const texture = new THREE.CanvasTexture(canvas);
            texture.magFilter = THREE.NearestFilter; // Pixelated look
            return new THREE.MeshLambertMaterial({ map: texture });
        };

        // Create materials once for efficiency (normal + darker versions)
        const materials = {};
        const playerMaterials = {}; // Darker versions for player-placed blocks
        
        Object.keys(blockTypes).forEach(type => {
            // Normal materials
            materials[type] = createBlockMaterial(blockTypes[type]);
            
            // Pre-create darker materials for player-placed blocks (performance optimization)
            const darkerColor = new THREE.Color(blockTypes[type].color).multiplyScalar(0.7);
            playerMaterials[type] = new THREE.MeshBasicMaterial({ 
                map: materials[type].map, 
                color: darkerColor 
            });
        });

        const addBlock = (x, y, z, type, playerPlaced = false) => {
            const geo = new THREE.BoxGeometry(1, 1, 1);
            // Use darker material for player-placed blocks, normal for generated
            const mat = playerPlaced ? playerMaterials[type] : materials[type];
            const cube = new THREE.Mesh(geo, mat);
            cube.position.set(x, y, z);
            cube.userData = { type, playerPlaced };
            scene.add(cube);
            this.world[`${x},${y},${z}`] = { type, mesh: cube, playerPlaced };
        };

        const removeBlock = (x, y, z) => {
            const key = `${x},${y},${z}`;
            if (this.world[key]) {
                scene.remove(this.world[key].mesh);
                delete this.world[key];
            }
        };

        // Chunk-based terrain generation functions
        const getChunkKey = (chunkX, chunkZ) => `${chunkX},${chunkZ}`;
        
        const generateChunk = (chunkX, chunkZ) => {
            const chunkKey = getChunkKey(chunkX, chunkZ);
            if (this.loadedChunks.has(chunkKey)) return;
            
            console.log(`Generating chunk ${chunkKey}`);
            
            for (let x = 0; x < this.chunkSize; x++) {
                for (let z = 0; z < this.chunkSize; z++) {
                    const worldX = chunkX * this.chunkSize + x;
                    const worldZ = chunkZ * this.chunkSize + z;
                    
                    // Generate height with noise (simpler calculation)
                    const height = Math.floor(Math.sin(worldX * 0.05) * Math.cos(worldZ * 0.05) * 2);
                    
                    // Create layers: grass -> dirt -> stone -> bedrock
                    addBlock(worldX, height, worldZ, "grass");           // Surface
                    addBlock(worldX, height - 1, worldZ, "dirt");        // 1 dirt layer
                    addBlock(worldX, height - 2, worldZ, "stone");       // 1 stone layer
                    addBlock(worldX, height - 3, worldZ, "bedrock");     // Unbreakable bedrock
                }
            }
            
            this.loadedChunks.add(chunkKey);
        };
        
        const unloadChunk = (chunkX, chunkZ) => {
            const chunkKey = getChunkKey(chunkX, chunkZ);
            if (!this.loadedChunks.has(chunkKey)) return;
            
            console.log(`Unloading chunk ${chunkKey}`);
            
            for (let x = 0; x < this.chunkSize; x++) {
                for (let z = 0; z < this.chunkSize; z++) {
                    const worldX = chunkX * this.chunkSize + x;
                    const worldZ = chunkZ * this.chunkSize + z;
                    
                    // Only remove the 3 layers we actually create
                    for (let y = -5; y <= 5; y++) { // Small range around ground level
                        removeBlock(worldX, y, worldZ);
                    }
                }
            }
            
            this.loadedChunks.delete(chunkKey);
        };
        
        const updateChunks = () => {
            const playerChunkX = Math.floor(this.player.position.x / this.chunkSize);
            const playerChunkZ = Math.floor(this.player.position.z / this.chunkSize);
            
            // Load chunks around player
            for (let dx = -this.renderDistance; dx <= this.renderDistance; dx++) {
                for (let dz = -this.renderDistance; dz <= this.renderDistance; dz++) {
                    generateChunk(playerChunkX + dx, playerChunkZ + dz);
                }
            }
            
            // Unload distant chunks
            Array.from(this.loadedChunks).forEach(chunkKey => {
                const [chunkX, chunkZ] = chunkKey.split(',').map(Number);
                const distance = Math.max(
                    Math.abs(chunkX - playerChunkX),
                    Math.abs(chunkZ - playerChunkZ)
                );
                
                if (distance > this.renderDistance + 1) {
                    unloadChunk(chunkX, chunkZ);
                }
            });
        };

        // Initial chunk loading around spawn
        console.log('Loading initial chunks...');
        updateChunks();
        console.log('✅ Initial chunks loaded');
        this.updateStatus('World ready - Click to play!');

        // Controls - make sure to capture all key events properly
        this.keys = {}; // Reset keys object
        document.addEventListener("keydown", e => {
            const key = e.key.toLowerCase();
            this.keys[key] = true;
            
            // Don't prevent default for important shortcuts
            if (e.ctrlKey || e.altKey || e.metaKey) {
                return; // Allow Ctrl+Shift+R, Alt+Tab, etc.
            }
            e.preventDefault(); // Only prevent default for game keys
        });
        document.addEventListener("keyup", e => {
            const key = e.key.toLowerCase();
            this.keys[key] = false;
            
            // Don't prevent default for important shortcuts
            if (e.ctrlKey || e.altKey || e.metaKey) {
                return;
            }
            e.preventDefault();
        });

                // Add simple crosshair overlay (like Minecraft)
        const crosshair = document.createElement('div');
        crosshair.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            width: 4px;
            height: 4px;
            background: white;
            transform: translate(-50%, -50%);
            pointer-events: none;
            z-index: 1000;
            box-shadow: 
                0 -8px 0 white, 0 8px 0 white,
                -8px 0 0 white, 8px 0 0 white,
                0 0 0 1px rgba(0,0,0,0.5);
        `;
        container.appendChild(crosshair);

        container.requestPointerLock = container.requestPointerLock || container.mozRequestPointerLock;
        container.addEventListener("click", () => {
            container.requestPointerLock();
        });
        
        // Target block highlight
        let targetHighlight = null;
        const createTargetHighlight = () => {
            const highlightGeo = new THREE.BoxGeometry(1.05, 1.05, 1.05);
            const highlightMat = new THREE.MeshBasicMaterial({ 
                color: 0xffffff, 
                wireframe: true, 
                transparent: true, 
                opacity: 0.5 
            });
            targetHighlight = new THREE.Mesh(highlightGeo, highlightMat);
            scene.add(targetHighlight);
        };
        createTargetHighlight();
        
        // Update target highlight every frame
        const updateTargetHighlight = () => {
            raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
            const intersects = raycaster.intersectObjects(Object.values(this.world).map(b => b.mesh));
            
            if (intersects.length > 0) {
                const hit = intersects[0];
                targetHighlight.position.copy(hit.object.position);
                targetHighlight.visible = true;
            } else {
                targetHighlight.visible = false;
            }
        };
        document.addEventListener("mousemove", e => {
            if (document.pointerLockElement === container) {
                this.player.rotation.y -= e.movementX * 0.002;
                this.player.rotation.x -= e.movementY * 0.002;
                
                // Clamp vertical rotation to prevent flipping upside down
                const maxLookUp = Math.PI / 2 - 0.1;   // Almost straight up
                const maxLookDown = -Math.PI / 2 + 0.1; // Almost straight down
                this.player.rotation.x = Math.max(maxLookDown, Math.min(maxLookUp, this.player.rotation.x));
            }
        });

        // Simple block highlight system (only when clicking, not every frame)
        let currentHighlight = null;
        
        const highlightBlock = (position, isPlacement = false) => {
            // Remove previous highlight
            if (currentHighlight) {
                scene.remove(currentHighlight);
            }
            
            // Create new highlight
            const highlightGeo = new THREE.BoxGeometry(1.02, 1.02, 1.02);
            const highlightMat = new THREE.MeshBasicMaterial({ 
                color: isPlacement ? 0x00ff00 : 0xff0000, // Green for place, red for remove
                wireframe: true, 
                transparent: true, 
                opacity: 0.8 
            });
            currentHighlight = new THREE.Mesh(highlightGeo, highlightMat);
            currentHighlight.position.copy(position);
            scene.add(currentHighlight);
            
            // Auto-remove highlight after 0.5 seconds
            setTimeout(() => {
                if (currentHighlight) {
                    scene.remove(currentHighlight);
                    currentHighlight = null;
                }
            }, 500);
        };

        // Place & remove blocks
        container.addEventListener("mousedown", (e) => {
            raycaster.setFromCamera(new THREE.Vector2(0, 0), camera); // center of screen
            const intersects = raycaster.intersectObjects(Object.values(this.world).map(b => b.mesh));

            if (intersects.length > 0) {
                const hit = intersects[0];
                const pos = hit.object.position;

                if (e.button === 0) { // Left = place
                    const normal = hit.face.normal.clone();
                    const newPos = pos.clone().add(normal);
                    highlightBlock(newPos, true); // Green highlight for placement
                    addBlock(newPos.x, newPos.y, newPos.z, this.selectedBlock, true); // Mark as player-placed
                    this.updateStatus(`Placed ${this.selectedBlock}`);
                }

                if (e.button === 2) { // Right = remove
                    // Don't allow removing bedrock
                    if (hit.object.userData.type !== 'bedrock') {
                        highlightBlock(pos, false); // Red highlight for removal
                        removeBlock(pos.x, pos.y, pos.z);
                        this.updateStatus("Removed block");
                    } else {
                        this.updateStatus("Cannot break bedrock!");
                    }
                }
            }
        });
        container.addEventListener("contextmenu", (e) => e.preventDefault()); // prevent right-click menu

        // Save/load - optimized for performance
        const saveWorld = () => {
            // Only save player-modified blocks, not the entire generated world
            const modifiedBlocks = {};
            for (let key in this.world) {
                if (this.world[key].playerPlaced) {
                    modifiedBlocks[key] = this.world[key];
                }
            }
            
            const saveData = {
                modifiedBlocks: Object.entries(modifiedBlocks).map(([k, v]) => ({ 
                    pos: k, 
                    type: v.type,
                    playerPlaced: v.playerPlaced 
                })),
                player: this.player
            };
            localStorage.setItem("NebulaWorld", JSON.stringify(saveData));
            this.updateStatus(`World saved (${Object.keys(modifiedBlocks).length} custom blocks)`);
        };

        const loadWorld = () => {
            const data = localStorage.getItem("NebulaWorld");
            if (!data) return alert("No save found!");
            
            const saveData = JSON.parse(data);
            
            // Clear only player-placed blocks, keep generated world
            for (let key in this.world) {
                if (this.world[key].playerPlaced) {
                    removeBlock(...key.split(",").map(Number));
                }
            }
            
            // Load only the modified blocks
            saveData.modifiedBlocks.forEach(b => {
                const [x, y, z] = b.pos.split(",").map(Number);
                addBlock(x, y, z, b.type, true); // Mark as player-placed
            });
            
            this.player = saveData.player;
            this.updateStatus(`World loaded (${saveData.modifiedBlocks.length} custom blocks)`);
        };

        const deleteSave = () => {
            localStorage.removeItem("NebulaWorld");
            this.updateStatus("Save deleted");
        };

        document.getElementById("save-btn").onclick = saveWorld;
        document.getElementById("load-btn").onclick = loadWorld;
        document.getElementById("delete-btn").onclick = deleteSave;
        // document.getElementById("close-btn").onclick = () => {
        //     if (window.windowManager && this.windowId) {
        //         window.windowManager.closeWindow(this.windowId);
        //     }
        // };

        // Improved movement with gravity and chunk loading
        let lastChunkUpdate = 0;
        const animate = () => {
            requestAnimationFrame(animate);
            
            const speed = 0.15; // Slightly faster movement
            const jumpSpeed = 0.3;
            const gravity = 0.01;
            
            // Handle movement
            const dir = new THREE.Vector3();
            if (this.keys["w"]) dir.z -= 1;
            if (this.keys["s"]) dir.z += 1;
            if (this.keys["a"]) dir.x -= 1;
            if (this.keys["d"]) dir.x += 1;
            if (this.keys[" "]) this.player.velocity = this.player.velocity || jumpSpeed; // Spacebar to jump
            
            // Apply rotation to movement direction
            dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.player.rotation.y);
            
            // Optimized horizontal collision - more lenient checking
            const checkBlockCollision = (x, y, z) => {
                const blockX = Math.floor(x);
                const blockY = Math.floor(y);
                const blockZ = Math.floor(z);
                const key = `${blockX},${blockY},${blockZ}`;
                const hasBlock = this.world[key] && this.world[key] !== 'air';
                return hasBlock;
            };
            
            // Apply horizontal movement FIRST (before gravity/ground collision)
            const moveSpeed = speed;
            
            // X movement - always allow unless hitting a wall
            if (Math.abs(dir.x) > 0.001) {
                const newX = this.player.position.x + (dir.x * moveSpeed);
                const currentY = Math.floor(this.player.position.y);
                
                // Check for wall collision at current height only
                if (!checkBlockCollision(newX, currentY, this.player.position.z)) {
                    this.player.position.x = newX;
                }
            }
            
            // Z movement - always allow unless hitting a wall  
            if (Math.abs(dir.z) > 0.001) {
                const newZ = this.player.position.z + (dir.z * moveSpeed);
                const currentY = Math.floor(this.player.position.y);
                
                // Check for wall collision at current height only
                if (!checkBlockCollision(this.player.position.x, currentY, newZ)) {
                    this.player.position.z = newZ;
                }
            }
            
            // Apply gravity and vertical movement AFTER horizontal movement
            if (!this.player.velocity) this.player.velocity = 0;
            this.player.velocity -= gravity;
            this.player.position.y += this.player.velocity;
            
            // Ground collision - completely separate from horizontal movement
            const getGroundLevel = (x, z) => {
                const blockX = Math.floor(x);
                const blockZ = Math.floor(z);
                
                // Check downward from current position for ground
                const currentY = Math.floor(this.player.position.y);
                for (let y = currentY + 1; y >= currentY - 5; y--) { // Check one block above too
                    const key = `${blockX},${y},${blockZ}`;
                    if (this.world[key]) {
                        return y + 1; // Stand on top of the block
                    }
                }
                return currentY - 3; // Fallback
            };
            
            // Apply ground collision more aggressively to prevent falling through
            const groundLevel = getGroundLevel(this.player.position.x, this.player.position.z);
            const playerBottom = this.player.position.y - 0.9;
            
            if (playerBottom <= groundLevel) {
                this.player.position.y = groundLevel + 0.9;
                this.player.velocity = 0;
            }

            // Update chunks every 30 frames (about 0.5 seconds)
            if (++lastChunkUpdate > 30) {
                updateChunks();
                lastChunkUpdate = 0;
            }

            // Update camera with quaternion-based rotation (more stable)
            camera.position.set(this.player.position.x, this.player.position.y, this.player.position.z);
            
            // Use quaternions for stable rotation
            const yawQuaternion = new THREE.Quaternion();
            const pitchQuaternion = new THREE.Quaternion();
            
            yawQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.player.rotation.y);
            pitchQuaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.player.rotation.x);
            
            // Combine rotations: yaw first, then pitch
            const finalQuaternion = new THREE.Quaternion();
            finalQuaternion.multiplyQuaternions(yawQuaternion, pitchQuaternion);
            
            camera.quaternion.copy(finalQuaternion);

            renderer.render(scene, camera);
        };
        animate();

        window.addEventListener("beforeunload", saveWorld);
    }

    cleanup() {
        // Remove crosshair
        const crosshair = container.querySelector('div[style*="position: fixed"]');
        if (crosshair) crosshair.remove();
        console.log("VoxelApp cleanup complete");
    }

    getTitle() { return 'Voxel World'; }
    getIcon() { return '🟩'; }
}

// Register with Nebula
window.NebulaVoxelApp = NebulaVoxelApp;
if (window.registerNebulaApp) {
    window.registerNebulaApp({
        id: 'nebulavoxelapp',
        name: 'Voxel World',
        icon: '🟩',
        className: 'NebulaVoxelApp',
        description: 'Minecraft-like voxel game',
        category: 'games'
    });
}
new NebulaVoxelApp();
