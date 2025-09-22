// Three.js 3D Reference Modal
// This module provides 3D model loading, positioning, and scene capture for reference drawing

class ThreeJSReferenceModal {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.modal = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.loadedModel = null;
        this.lights = [];
        this.isVisible = false;
        
        // Scene settings
        this.sceneSettings = {
            backgroundColor: '#2a2a2a',
            ambientLightIntensity: 0.4,
            directionalLightIntensity: 0.8,
            enableShadows: true,
            enableGrid: true,
            gridSize: 10,
            cameraFov: 75,
            cameraNear: 0.1,
            cameraFar: 1000
        };
        
        // Model settings
        this.modelSettings = {
            scale: { x: 1, y: 1, z: 1 },
            rotation: { x: 0, y: 0, z: 0 },
            position: { x: 0, y: 0, z: 0 },
            wireframe: false,
            material: 'default'
        };
        
        this.loadThreeJS();
    }
    
    async loadThreeJS() {
        // Load Three.js from CDN
        if (typeof THREE === 'undefined') {
            await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js');
        }
        
        // Load additional Three.js modules
        await this.loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js');
        await this.loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js');
        await this.loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/OBJLoader.js');
        await this.loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/FBXLoader.js');
        
        console.log('Three.js loaded successfully');
    }
    
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'threejs-reference-modal';
        this.modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 1000;
            display: none;
            backdrop-filter: blur(5px);
        `;
        
        this.modal.innerHTML = `
            <div class="modal-content" style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 90%;
                height: 90%;
                background: var(--nebula-surface);
                border-radius: 12px;
                display: flex;
                overflow: hidden;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            ">
                <div class="threejs-viewport" style="
                    flex: 1;
                    position: relative;
                    background: #2a2a2a;
                ">
                    <canvas id="threejs-canvas" style="
                        width: 100%;
                        height: 100%;
                        display: block;
                    "></canvas>
                    
                    <div class="viewport-controls" style="
                        position: absolute;
                        top: 20px;
                        left: 20px;
                        display: flex;
                        gap: 10px;
                    ">
                        <button class="viewport-btn" id="reset-camera" title="Reset Camera">
                            <span class="material-symbols-outlined">3d_rotation</span>
                        </button>
                        <button class="viewport-btn" id="toggle-wireframe" title="Toggle Wireframe">
                            <span class="material-symbols-outlined">grid_on</span>
                        </button>
                        <button class="viewport-btn" id="toggle-grid" title="Toggle Grid">
                            <span class="material-symbols-outlined">grid_4x4</span>
                        </button>
                    </div>
                    
                    <div class="capture-controls" style="
                        position: absolute;
                        bottom: 20px;
                        right: 20px;
                        display: flex;
                        gap: 10px;
                    ">
                        <button class="enhanced-btn primary" id="capture-render">
                            <span class="material-symbols-outlined">camera_alt</span>
                            Capture as Layer
                        </button>
                    </div>
                </div>
                
                <div class="control-panel" style="
                    width: 350px;
                    background: var(--nebula-background);
                    padding: 20px;
                    overflow-y: auto;
                    border-left: 1px solid var(--nebula-border);
                ">
                    <div class="panel-header" style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 20px;
                    ">
                        <h3 class="panel-title">3D Reference</h3>
                        <button class="close-btn" id="close-modal" style="
                            background: none;
                            border: none;
                            color: var(--nebula-text);
                            cursor: pointer;
                            font-size: 24px;
                        ">
                            <span class="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    
                    <div class="model-loader">
                        <h4 class="section-title">Load Model</h4>
                        <div class="file-input-wrapper">
                            <input type="file" id="model-file-input" accept=".gltf,.glb,.obj,.fbx" style="display: none;">
                            <button class="enhanced-btn" id="load-model-btn">
                                <span class="material-symbols-outlined">upload</span>
                                Load 3D Model
                            </button>
                        </div>
                        
                        <div class="preset-models">
                            <h5 class="subsection-title">Preset Models</h5>
                            <div class="preset-grid">
                                <button class="preset-model-btn" data-model="cube">Cube</button>
                                <button class="preset-model-btn" data-model="sphere">Sphere</button>
                                <button class="preset-model-btn" data-model="cylinder">Cylinder</button>
                                <button class="preset-model-btn" data-model="torus">Torus</button>
                                <button class="preset-model-btn" data-model="plane">Plane</button>
                                <button class="preset-model-btn" data-model="teapot">Teapot</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="transform-controls">
                        <h4 class="section-title">Transform</h4>
                        
                        <div class="transform-group">
                            <h5 class="subsection-title">Position</h5>
                            <div class="xyz-controls">
                                <div class="xyz-control">
                                    <label>X</label>
                                    <input type="range" id="pos-x" min="-10" max="10" step="0.1" value="0" class="enhanced-slider">
                                    <span id="pos-x-value">0</span>
                                </div>
                                <div class="xyz-control">
                                    <label>Y</label>
                                    <input type="range" id="pos-y" min="-10" max="10" step="0.1" value="0" class="enhanced-slider">
                                    <span id="pos-y-value">0</span>
                                </div>
                                <div class="xyz-control">
                                    <label>Z</label>
                                    <input type="range" id="pos-z" min="-10" max="10" step="0.1" value="0" class="enhanced-slider">
                                    <span id="pos-z-value">0</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="transform-group">
                            <h5 class="subsection-title">Rotation</h5>
                            <div class="xyz-controls">
                                <div class="xyz-control">
                                    <label>X</label>
                                    <input type="range" id="rot-x" min="0" max="360" step="1" value="0" class="enhanced-slider">
                                    <span id="rot-x-value">0°</span>
                                </div>
                                <div class="xyz-control">
                                    <label>Y</label>
                                    <input type="range" id="rot-y" min="0" max="360" step="1" value="0" class="enhanced-slider">
                                    <span id="rot-y-value">0°</span>
                                </div>
                                <div class="xyz-control">
                                    <label>Z</label>
                                    <input type="range" id="rot-z" min="0" max="360" step="1" value="0" class="enhanced-slider">
                                    <span id="rot-z-value">0°</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="transform-group">
                            <h5 class="subsection-title">Scale</h5>
                            <div class="xyz-controls">
                                <div class="xyz-control">
                                    <label>Uniform</label>
                                    <input type="range" id="scale-uniform" min="0.1" max="5" step="0.1" value="1" class="enhanced-slider">
                                    <span id="scale-uniform-value">1.0</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="lighting-controls">
                        <h4 class="section-title">Lighting</h4>
                        
                        <div class="property-group">
                            <label class="property-label">Ambient Light</label>
                            <div class="property-control">
                                <input type="range" id="ambient-intensity" min="0" max="100" value="40" class="enhanced-slider">
                                <span id="ambient-intensity-value" class="property-value">40%</span>
                            </div>
                        </div>
                        
                        <div class="property-group">
                            <label class="property-label">Directional Light</label>
                            <div class="property-control">
                                <input type="range" id="directional-intensity" min="0" max="100" value="80" class="enhanced-slider">
                                <span id="directional-intensity-value" class="property-value">80%</span>
                            </div>
                        </div>
                        
                        <div class="property-group">
                            <label class="property-label">Background</label>
                            <input type="color" id="background-color" value="#2a2a2a" class="enhanced-color-picker">
                        </div>
                    </div>
                    
                    <div class="material-controls">
                        <h4 class="section-title">Material</h4>
                        
                        <div class="property-group">
                            <label class="property-label">Material Type</label>
                            <select id="material-type" class="enhanced-select">
                                <option value="default">Default</option>
                                <option value="basic">Basic</option>
                                <option value="lambert">Lambert</option>
                                <option value="phong">Phong</option>
                                <option value="standard">Standard</option>
                                <option value="wireframe">Wireframe</option>
                            </select>
                        </div>
                        
                        <div class="property-group">
                            <label class="property-label">Color</label>
                            <input type="color" id="material-color" value="#ffffff" class="enhanced-color-picker">
                        </div>
                    </div>
                    
                    <div class="capture-settings">
                        <h4 class="section-title">Capture Settings</h4>
                        
                        <div class="property-group">
                            <label class="property-label">Resolution</label>
                            <select id="capture-resolution" class="enhanced-select">
                                <option value="512x512">512 × 512</option>
                                <option value="1024x1024" selected>1024 × 1024</option>
                                <option value="2048x2048">2048 × 2048</option>
                                <option value="custom">Custom</option>
                            </select>
                        </div>
                        
                        <div class="property-group checkbox-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="transparent-background">
                                <span class="checkmark"></span>
                                Transparent Background
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.modal);
        this.setupEventListeners();
        this.initializeThreeJS();
        
        return this.modal;
    }
    
    setupEventListeners() {
        // Close modal
        this.modal.querySelector('#close-modal')?.addEventListener('click', () => {
            this.hide();
        });
        
        // Click outside to close
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hide();
            }
        });
        
        // Model loading
        const loadModelBtn = this.modal.querySelector('#load-model-btn');
        const fileInput = this.modal.querySelector('#model-file-input');
        
        loadModelBtn?.addEventListener('click', () => {
            fileInput?.click();
        });
        
        fileInput?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.loadModelFile(file);
            }
        });
        
        // Preset models
        this.modal.querySelectorAll('.preset-model-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modelType = e.target.dataset.model;
                this.loadPresetModel(modelType);
            });
        });
        
        // Transform controls
        this.setupTransformControls();
        
        // Lighting controls
        this.setupLightingControls();
        
        // Material controls
        this.setupMaterialControls();
        
        // Viewport controls
        this.setupViewportControls();
        
        // Capture button
        this.modal.querySelector('#capture-render')?.addEventListener('click', () => {
            this.captureRender();
        });
    }
    
    setupTransformControls() {
        // Position controls
        ['x', 'y', 'z'].forEach(axis => {
            const slider = this.modal.querySelector(`#pos-${axis}`);
            const valueDisplay = this.modal.querySelector(`#pos-${axis}-value`);
            
            slider?.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                valueDisplay.textContent = value.toFixed(1);
                this.modelSettings.position[axis] = value;
                this.updateModelTransform();
            });
        });
        
        // Rotation controls
        ['x', 'y', 'z'].forEach(axis => {
            const slider = this.modal.querySelector(`#rot-${axis}`);
            const valueDisplay = this.modal.querySelector(`#rot-${axis}-value`);
            
            slider?.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                valueDisplay.textContent = value + '°';
                this.modelSettings.rotation[axis] = value * Math.PI / 180; // Convert to radians
                this.updateModelTransform();
            });
        });
        
        // Scale control
        const scaleSlider = this.modal.querySelector('#scale-uniform');
        const scaleValue = this.modal.querySelector('#scale-uniform-value');
        
        scaleSlider?.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            scaleValue.textContent = value.toFixed(1);
            this.modelSettings.scale.x = value;
            this.modelSettings.scale.y = value;
            this.modelSettings.scale.z = value;
            this.updateModelTransform();
        });
    }
    
    setupLightingControls() {
        // Ambient light
        const ambientSlider = this.modal.querySelector('#ambient-intensity');
        const ambientValue = this.modal.querySelector('#ambient-intensity-value');
        
        ambientSlider?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            ambientValue.textContent = value + '%';
            this.sceneSettings.ambientLightIntensity = value / 100;
            this.updateLighting();
        });
        
        // Directional light
        const directionalSlider = this.modal.querySelector('#directional-intensity');
        const directionalValue = this.modal.querySelector('#directional-intensity-value');
        
        directionalSlider?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            directionalValue.textContent = value + '%';
            this.sceneSettings.directionalLightIntensity = value / 100;
            this.updateLighting();
        });
        
        // Background color
        const backgroundColorPicker = this.modal.querySelector('#background-color');
        backgroundColorPicker?.addEventListener('input', (e) => {
            this.sceneSettings.backgroundColor = e.target.value;
            this.updateBackground();
        });
    }
    
    setupMaterialControls() {
        // Material type
        const materialSelect = this.modal.querySelector('#material-type');
        materialSelect?.addEventListener('change', (e) => {
            this.modelSettings.material = e.target.value;
            this.updateMaterial();
        });
        
        // Material color
        const materialColorPicker = this.modal.querySelector('#material-color');
        materialColorPicker?.addEventListener('input', (e) => {
            this.modelSettings.materialColor = e.target.value;
            this.updateMaterial();
        });
    }
    
    setupViewportControls() {
        // Reset camera
        this.modal.querySelector('#reset-camera')?.addEventListener('click', () => {
            this.resetCamera();
        });
        
        // Toggle wireframe
        this.modal.querySelector('#toggle-wireframe')?.addEventListener('click', () => {
            this.modelSettings.wireframe = !this.modelSettings.wireframe;
            this.updateMaterial();
        });
        
        // Toggle grid
        this.modal.querySelector('#toggle-grid')?.addEventListener('click', () => {
            this.sceneSettings.enableGrid = !this.sceneSettings.enableGrid;
            this.updateGrid();
        });
    }
    
    async initializeThreeJS() {
        if (typeof THREE === 'undefined') {
            console.error('Three.js not loaded');
            return;
        }
        
        const canvas = this.modal.querySelector('#threejs-canvas');
        if (!canvas) return;
        
        // Create scene
        this.scene = new THREE.Scene();
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            this.sceneSettings.cameraFov,
            canvas.clientWidth / canvas.clientHeight,
            this.sceneSettings.cameraNear,
            this.sceneSettings.cameraFar
        );
        this.camera.position.set(5, 5, 5);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: canvas,
            antialias: true,
            preserveDrawingBuffer: true,
            alpha: true
        });
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        this.renderer.setClearColor(this.sceneSettings.backgroundColor);
        this.renderer.shadowMap.enabled = this.sceneSettings.enableShadows;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Create controls
        if (THREE.OrbitControls) {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
        }
        
        // Setup lighting
        this.setupLighting();
        
        // Setup grid
        this.setupGrid();
        
        // Load default model
        this.loadPresetModel('cube');
        
        // Start render loop
        this.startRenderLoop();
        
        // Handle resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }
    
    setupLighting() {
        // Clear existing lights
        this.lights.forEach(light => this.scene.remove(light));
        this.lights = [];
        
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, this.sceneSettings.ambientLightIntensity);
        this.scene.add(ambientLight);
        this.lights.push(ambientLight);
        
        // Directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, this.sceneSettings.directionalLightIntensity);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = this.sceneSettings.enableShadows;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
        this.lights.push(directionalLight);
        
        // Fill light
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-5, 5, -5);
        this.scene.add(fillLight);
        this.lights.push(fillLight);
    }
    
    setupGrid() {
        // Remove existing grid
        const existingGrid = this.scene.getObjectByName('grid');
        if (existingGrid) {
            this.scene.remove(existingGrid);
        }
        
        if (this.sceneSettings.enableGrid) {
            const grid = new THREE.GridHelper(this.sceneSettings.gridSize, this.sceneSettings.gridSize);
            grid.name = 'grid';
            this.scene.add(grid);
        }
    }
    
    loadPresetModel(type) {
        // Remove existing model
        if (this.loadedModel) {
            this.scene.remove(this.loadedModel);
        }
        
        let geometry;
        
        switch (type) {
            case 'cube':
                geometry = new THREE.BoxGeometry(2, 2, 2);
                break;
            case 'sphere':
                geometry = new THREE.SphereGeometry(1.5, 32, 32);
                break;
            case 'cylinder':
                geometry = new THREE.CylinderGeometry(1, 1, 2, 32);
                break;
            case 'torus':
                geometry = new THREE.TorusGeometry(1, 0.4, 16, 100);
                break;
            case 'plane':
                geometry = new THREE.PlaneGeometry(3, 3);
                break;
            case 'teapot':
                // Fallback to sphere if teapot geometry not available
                geometry = new THREE.SphereGeometry(1.5, 32, 32);
                break;
            default:
                geometry = new THREE.BoxGeometry(2, 2, 2);
        }
        
        const material = new THREE.MeshLambertMaterial({ color: 0xffffff });
        this.loadedModel = new THREE.Mesh(geometry, material);
        this.loadedModel.castShadow = true;
        this.loadedModel.receiveShadow = true;
        
        this.scene.add(this.loadedModel);
        this.resetTransform();
    }
    
    async loadModelFile(file) {
        const extension = file.name.split('.').pop().toLowerCase();
        const url = URL.createObjectURL(file);
        
        try {
            let loader;
            
            switch (extension) {
                case 'gltf':
                case 'glb':
                    if (THREE.GLTFLoader) {
                        loader = new THREE.GLTFLoader();
                        const gltf = await new Promise((resolve, reject) => {
                            loader.load(url, resolve, undefined, reject);
                        });
                        this.setLoadedModel(gltf.scene);
                    }
                    break;
                    
                case 'obj':
                    if (THREE.OBJLoader) {
                        loader = new THREE.OBJLoader();
                        const obj = await new Promise((resolve, reject) => {
                            loader.load(url, resolve, undefined, reject);
                        });
                        this.setLoadedModel(obj);
                    }
                    break;
                    
                case 'fbx':
                    if (THREE.FBXLoader) {
                        loader = new THREE.FBXLoader();
                        const fbx = await new Promise((resolve, reject) => {
                            loader.load(url, resolve, undefined, reject);
                        });
                        this.setLoadedModel(fbx);
                    }
                    break;
                    
                default:
                    throw new Error('Unsupported file format');
            }
        } catch (error) {
            console.error('Error loading model:', error);
            alert('Error loading model. Please check the file format and try again.');
        } finally {
            URL.revokeObjectURL(url);
        }
    }
    
    setLoadedModel(model) {
        // Remove existing model
        if (this.loadedModel) {
            this.scene.remove(this.loadedModel);
        }
        
        this.loadedModel = model;
        this.scene.add(this.loadedModel);
        
        // Enable shadows for all meshes
        this.loadedModel.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        this.resetTransform();
        this.fitCameraToModel();
    }
    
    fitCameraToModel() {
        if (!this.loadedModel) return;
        
        const box = new THREE.Box3().setFromObject(this.loadedModel);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        const maxDim = Math.max(size.x, size.y, size.z);
        const distance = maxDim * 2;
        
        this.camera.position.set(distance, distance, distance);
        this.camera.lookAt(center);
        
        if (this.controls) {
            this.controls.target.copy(center);
            this.controls.update();
        }
    }
    
    updateModelTransform() {
        if (!this.loadedModel) return;
        
        this.loadedModel.position.set(
            this.modelSettings.position.x,
            this.modelSettings.position.y,
            this.modelSettings.position.z
        );
        
        this.loadedModel.rotation.set(
            this.modelSettings.rotation.x,
            this.modelSettings.rotation.y,
            this.modelSettings.rotation.z
        );
        
        this.loadedModel.scale.set(
            this.modelSettings.scale.x,
            this.modelSettings.scale.y,
            this.modelSettings.scale.z
        );
    }
    
    updateLighting() {
        if (this.lights.length >= 2) {
            this.lights[0].intensity = this.sceneSettings.ambientLightIntensity; // Ambient
            this.lights[1].intensity = this.sceneSettings.directionalLightIntensity; // Directional
        }
    }
    
    updateBackground() {
        this.renderer.setClearColor(this.sceneSettings.backgroundColor);
    }
    
    updateMaterial() {
        if (!this.loadedModel) return;
        
        const color = this.modelSettings.materialColor || '#ffffff';
        let material;
        
        switch (this.modelSettings.material) {
            case 'basic':
                material = new THREE.MeshBasicMaterial({ 
                    color: color,
                    wireframe: this.modelSettings.wireframe
                });
                break;
            case 'lambert':
                material = new THREE.MeshLambertMaterial({ 
                    color: color,
                    wireframe: this.modelSettings.wireframe
                });
                break;
            case 'phong':
                material = new THREE.MeshPhongMaterial({ 
                    color: color,
                    wireframe: this.modelSettings.wireframe
                });
                break;
            case 'standard':
                material = new THREE.MeshStandardMaterial({ 
                    color: color,
                    wireframe: this.modelSettings.wireframe
                });
                break;
            case 'wireframe':
                material = new THREE.MeshBasicMaterial({ 
                    color: color,
                    wireframe: true
                });
                break;
            default:
                material = new THREE.MeshLambertMaterial({ 
                    color: color,
                    wireframe: this.modelSettings.wireframe
                });
        }
        
        this.loadedModel.traverse((child) => {
            if (child.isMesh) {
                child.material = material;
            }
        });
    }
    
    updateGrid() {
        this.setupGrid();
    }
    
    resetCamera() {
        this.camera.position.set(5, 5, 5);
        this.camera.lookAt(0, 0, 0);
        
        if (this.controls) {
            this.controls.target.set(0, 0, 0);
            this.controls.update();
        }
    }
    
    resetTransform() {
        this.modelSettings.position = { x: 0, y: 0, z: 0 };
        this.modelSettings.rotation = { x: 0, y: 0, z: 0 };
        this.modelSettings.scale = { x: 1, y: 1, z: 1 };
        
        // Update UI
        ['x', 'y', 'z'].forEach(axis => {
            const posSlider = this.modal.querySelector(`#pos-${axis}`);
            const posValue = this.modal.querySelector(`#pos-${axis}-value`);
            const rotSlider = this.modal.querySelector(`#rot-${axis}`);
            const rotValue = this.modal.querySelector(`#rot-${axis}-value`);
            
            if (posSlider) posSlider.value = 0;
            if (posValue) posValue.textContent = '0';
            if (rotSlider) rotSlider.value = 0;
            if (rotValue) rotValue.textContent = '0°';
        });
        
        const scaleSlider = this.modal.querySelector('#scale-uniform');
        const scaleValue = this.modal.querySelector('#scale-uniform-value');
        if (scaleSlider) scaleSlider.value = 1;
        if (scaleValue) scaleValue.textContent = '1.0';
        
        this.updateModelTransform();
    }
    
    startRenderLoop() {
        const animate = () => {
            requestAnimationFrame(animate);
            
            if (this.controls) {
                this.controls.update();
            }
            
            if (this.renderer && this.scene && this.camera) {
                this.renderer.render(this.scene, this.camera);
            }
        };
        
        animate();
    }
    
    handleResize() {
        if (!this.renderer || !this.camera) return;
        
        const canvas = this.modal.querySelector('#threejs-canvas');
        if (!canvas) return;
        
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
    
    captureRender() {
        if (!this.renderer) return;
        
        const resolutionSelect = this.modal.querySelector('#capture-resolution');
        const transparentBg = this.modal.querySelector('#transparent-background');
        
        let width = 1024;
        let height = 1024;
        
        if (resolutionSelect) {
            const resolution = resolutionSelect.value;
            if (resolution !== 'custom') {
                const [w, h] = resolution.split('x').map(Number);
                width = w;
                height = h;
            }
        }
        
        // Create temporary renderer for high-res capture
        const captureRenderer = new THREE.WebGLRenderer({ 
            antialias: true,
            preserveDrawingBuffer: true,
            alpha: transparentBg?.checked || false
        });
        
        captureRenderer.setSize(width, height);
        
        if (transparentBg?.checked) {
            captureRenderer.setClearColor(0x000000, 0); // Transparent
        } else {
            captureRenderer.setClearColor(this.sceneSettings.backgroundColor);
        }
        
        captureRenderer.shadowMap.enabled = this.sceneSettings.enableShadows;
        captureRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Render the scene
        captureRenderer.render(this.scene, this.camera);
        
        // Get the image data
        const canvas = captureRenderer.domElement;
        const dataURL = canvas.toDataURL('image/png');
        
        // Clean up
        captureRenderer.dispose();
        
        // Create new layer with the captured image
        this.createLayerFromCapture(dataURL, width, height);
        
        // Hide modal
        this.hide();
    }
    
    createLayerFromCapture(dataURL, width, height) {
        const img = new Image();
        img.onload = () => {
            // Add new layer to the image editor
            if (window.fixedImageEditor && window.fixedImageEditor.layerManager) {
                const layerManager = window.fixedImageEditor.layerManager;
                const newLayer = layerManager.addLayer(`3D Reference ${Date.now()}`);
                
                // Draw the captured image to the layer
                newLayer.context.drawImage(img, 0, 0, 
                    layerManager.canvasWidth, layerManager.canvasHeight);
                
                layerManager.render();
                
                // Store the 3D scene information with the layer
                newLayer.metadata = {
                    type: '3d_reference',
                    sceneSettings: { ...this.sceneSettings },
                    modelSettings: { ...this.modelSettings },
                    captureResolution: { width, height },
                    timestamp: Date.now()
                };
                
                this.eventManager.emit('3dReferenceLayerCreated', {
                    layer: newLayer,
                    metadata: newLayer.metadata
                });
            }
        };
        img.src = dataURL;
    }
    
    show() {
        if (!this.modal) {
            this.createModal();
        }
        
        this.modal.style.display = 'block';
        this.isVisible = true;
        
        // Handle resize when modal becomes visible
        setTimeout(() => {
            this.handleResize();
        }, 100);
        
        this.eventManager.emit('3dReferenceModalOpened');
    }
    
    hide() {
        if (this.modal) {
            this.modal.style.display = 'none';
        }
        this.isVisible = false;
        this.eventManager.emit('3dReferenceModalClosed');
    }
    
    destroy() {
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        if (this.modal && this.modal.parentNode) {
            this.modal.parentNode.removeChild(this.modal);
        }
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.loadedModel = null;
        this.lights = [];
    }
}

// 3D Reference Button for the main interface
class ThreeJSReferenceButton {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.modal = new ThreeJSReferenceModal(eventManager);
    }
    
    createButton() {
        const button = document.createElement('button');
        button.className = 'enhanced-btn threejs-reference-btn';
        button.title = '3D Reference';
        button.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            margin: 5px;
        `;
        
        button.innerHTML = `
            <span class="material-symbols-outlined">view_in_ar</span>
            <span>3D Reference</span>
        `;
        
        button.addEventListener('click', () => {
            this.modal.show();
        });
        
        return button;
    }
    
    getModal() {
        return this.modal;
    }
}

// Export classes
window.ThreeJSReferenceModal = ThreeJSReferenceModal;
window.ThreeJSReferenceButton = ThreeJSReferenceButton;

