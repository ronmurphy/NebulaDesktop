// Enhanced Stylus and Tablet Support
// This module provides advanced stabilization and tablet-specific features

class TabletInputManager {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.isTabletConnected = false;
        this.supportedEvents = new Set();
        this.calibration = {
            pressureMin: 0,
            pressureMax: 1,
            tiltSensitivity: 1,
            rotationSensitivity: 1
        };
        
        this.detectTabletSupport();
        this.setupEventListeners();
    }
    
    detectTabletSupport() {
        // Check for pointer events support
        if (window.PointerEvent) {
            this.supportedEvents.add('pointer');
        }
        
        // Check for touch events
        if ('ontouchstart' in window) {
            this.supportedEvents.add('touch');
        }
        
        // Check for specific tablet APIs
        if (navigator.maxTouchPoints > 1) {
            this.isTabletConnected = true;
        }
        
        console.log('Tablet support detected:', {
            isTabletConnected: this.isTabletConnected,
            supportedEvents: Array.from(this.supportedEvents),
            maxTouchPoints: navigator.maxTouchPoints
        });
    }
    
    setupEventListeners() {
        // Listen for tablet connection/disconnection
        if ('onpointerover' in window) {
            document.addEventListener('pointerover', (e) => {
                if (e.pointerType === 'pen') {
                    this.isTabletConnected = true;
                    this.eventManager.emit('tabletConnected', { pointerType: e.pointerType });
                }
            });
        }
    }
    
    processInputEvent(event) {
        const inputData = {
            x: event.clientX || event.touches?.[0]?.clientX || 0,
            y: event.clientY || event.touches?.[0]?.clientY || 0,
            pressure: this.extractPressure(event),
            tiltX: this.extractTiltX(event),
            tiltY: this.extractTiltY(event),
            rotation: this.extractRotation(event),
            pointerType: event.pointerType || 'mouse',
            timestamp: Date.now(),
            originalEvent: event
        };
        
        // Apply calibration
        inputData.pressure = this.calibratePressure(inputData.pressure);
        inputData.tiltX = this.calibrateTilt(inputData.tiltX);
        inputData.tiltY = this.calibrateTilt(inputData.tiltY);
        
        return inputData;
    }
    
    extractPressure(event) {
        // Try different pressure sources
        if (event.pressure !== undefined) {
            return event.pressure;
        }
        
        if (event.force !== undefined) {
            return event.force;
        }
        
        if (event.touches && event.touches[0] && event.touches[0].force !== undefined) {
            return event.touches[0].force;
        }
        
        // Fallback to simulated pressure
        return 0.5;
    }
    
    extractTiltX(event) {
        return event.tiltX || 0;
    }
    
    extractTiltY(event) {
        return event.tiltY || 0;
    }
    
    extractRotation(event) {
        return event.twist || event.rotation || 0;
    }
    
    calibratePressure(pressure) {
        const { pressureMin, pressureMax } = this.calibration;
        const normalized = (pressure - pressureMin) / (pressureMax - pressureMin);
        return Math.max(0, Math.min(1, normalized));
    }
    
    calibrateTilt(tilt) {
        return tilt * this.calibration.tiltSensitivity;
    }
    
    startCalibration() {
        return new Promise((resolve) => {
            const calibrationData = {
                pressureValues: [],
                tiltValues: [],
                rotationValues: []
            };
            
            const calibrationHandler = (event) => {
                const inputData = this.processInputEvent(event);
                calibrationData.pressureValues.push(inputData.pressure);
                calibrationData.tiltValues.push(inputData.tiltX, inputData.tiltY);
                calibrationData.rotationValues.push(inputData.rotation);
                
                if (calibrationData.pressureValues.length >= 50) {
                    document.removeEventListener('pointermove', calibrationHandler);
                    this.applyCalibration(calibrationData);
                    resolve(this.calibration);
                }
            };
            
            document.addEventListener('pointermove', calibrationHandler);
        });
    }
    
    applyCalibration(data) {
        if (data.pressureValues.length > 0) {
            this.calibration.pressureMin = Math.min(...data.pressureValues);
            this.calibration.pressureMax = Math.max(...data.pressureValues);
        }
        
        this.eventManager.emit('calibrationComplete', this.calibration);
    }
}

class AdvancedStabilizer {
    constructor(options = {}) {
        this.options = {
            smoothingLevel: options.smoothingLevel || 5,
            predictionStrength: options.predictionStrength || 0.3,
            catchUpSpeed: options.catchUpSpeed || 0.1,
            maxLag: options.maxLag || 100, // milliseconds
            adaptiveSmoothing: options.adaptiveSmoothing || true,
            velocitySmoothing: options.velocitySmoothing || true,
            ...options
        };
        
        this.inputBuffer = [];
        this.outputBuffer = [];
        this.velocityBuffer = [];
        this.lastOutputTime = 0;
        this.isActive = false;
    }
    
    reset() {
        this.inputBuffer = [];
        this.outputBuffer = [];
        this.velocityBuffer = [];
        this.lastOutputTime = 0;
        this.isActive = false;
    }
    
    addPoint(point) {
        this.inputBuffer.push({
            ...point,
            timestamp: point.timestamp || Date.now()
        });
        
        // Limit buffer size
        if (this.inputBuffer.length > this.options.smoothingLevel * 2) {
            this.inputBuffer.shift();
        }
        
        this.isActive = true;
        return this.processBuffer();
    }
    
    processBuffer() {
        if (this.inputBuffer.length < 2) {
            return [];
        }
        
        const stabilizedPoints = [];
        const currentTime = Date.now();
        
        // Calculate adaptive smoothing based on velocity
        const smoothingLevel = this.options.adaptiveSmoothing ? 
            this.calculateAdaptiveSmoothing() : this.options.smoothingLevel;
        
        // Process points with stabilization
        for (let i = 1; i < this.inputBuffer.length; i++) {
            const stabilizedPoint = this.stabilizePoint(i, smoothingLevel);
            
            // Apply prediction if enabled
            if (this.options.predictionStrength > 0) {
                this.applyPrediction(stabilizedPoint);
            }
            
            stabilizedPoints.push(stabilizedPoint);
        }
        
        // Update output buffer
        this.outputBuffer.push(...stabilizedPoints);
        if (this.outputBuffer.length > 50) {
            this.outputBuffer = this.outputBuffer.slice(-25);
        }
        
        this.lastOutputTime = currentTime;
        return stabilizedPoints;
    }
    
    stabilizePoint(index, smoothingLevel) {
        const currentPoint = this.inputBuffer[index];
        const windowStart = Math.max(0, index - smoothingLevel);
        const window = this.inputBuffer.slice(windowStart, index + 1);
        
        // Calculate weighted average
        let totalWeight = 0;
        let weightedX = 0;
        let weightedY = 0;
        let weightedPressure = 0;
        
        window.forEach((point, i) => {
            const age = window.length - 1 - i;
            const weight = Math.exp(-age * 0.3); // Exponential decay
            
            totalWeight += weight;
            weightedX += point.x * weight;
            weightedY += point.y * weight;
            weightedPressure += point.pressure * weight;
        });
        
        const stabilized = {
            x: weightedX / totalWeight,
            y: weightedY / totalWeight,
            pressure: weightedPressure / totalWeight,
            timestamp: currentPoint.timestamp,
            tiltX: currentPoint.tiltX,
            tiltY: currentPoint.tiltY,
            rotation: currentPoint.rotation
        };
        
        // Apply velocity smoothing
        if (this.options.velocitySmoothing) {
            this.applyVelocitySmoothing(stabilized);
        }
        
        return stabilized;
    }
    
    calculateAdaptiveSmoothing() {
        if (this.inputBuffer.length < 3) {
            return this.options.smoothingLevel;
        }
        
        // Calculate recent velocity
        const recent = this.inputBuffer.slice(-3);
        let totalVelocity = 0;
        
        for (let i = 1; i < recent.length; i++) {
            const dx = recent[i].x - recent[i-1].x;
            const dy = recent[i].y - recent[i-1].y;
            const dt = recent[i].timestamp - recent[i-1].timestamp;
            
            if (dt > 0) {
                const velocity = Math.sqrt(dx * dx + dy * dy) / dt;
                totalVelocity += velocity;
            }
        }
        
        const avgVelocity = totalVelocity / (recent.length - 1);
        
        // More smoothing for faster movements
        const velocityFactor = Math.min(2, avgVelocity * 0.1);
        return Math.round(this.options.smoothingLevel * (1 + velocityFactor));
    }
    
    applyVelocitySmoothing(point) {
        if (this.velocityBuffer.length === 0) {
            this.velocityBuffer.push({ x: 0, y: 0 });
            return;
        }
        
        const lastPoint = this.outputBuffer[this.outputBuffer.length - 1];
        if (!lastPoint) return;
        
        const velocity = {
            x: point.x - lastPoint.x,
            y: point.y - lastPoint.y
        };
        
        this.velocityBuffer.push(velocity);
        if (this.velocityBuffer.length > 5) {
            this.velocityBuffer.shift();
        }
        
        // Smooth velocity
        const smoothedVelocity = this.velocityBuffer.reduce((acc, vel) => ({
            x: acc.x + vel.x,
            y: acc.y + vel.y
        }), { x: 0, y: 0 });
        
        smoothedVelocity.x /= this.velocityBuffer.length;
        smoothedVelocity.y /= this.velocityBuffer.length;
        
        // Apply smoothed velocity
        point.x = lastPoint.x + smoothedVelocity.x;
        point.y = lastPoint.y + smoothedVelocity.y;
    }
    
    applyPrediction(point) {
        if (this.outputBuffer.length < 2) return;
        
        const recent = this.outputBuffer.slice(-2);
        const velocity = {
            x: recent[1].x - recent[0].x,
            y: recent[1].y - recent[0].y
        };
        
        const prediction = {
            x: point.x + velocity.x * this.options.predictionStrength,
            y: point.y + velocity.y * this.options.predictionStrength
        };
        
        // Blend prediction with actual point
        point.x = point.x * (1 - this.options.predictionStrength) + prediction.x * this.options.predictionStrength;
        point.y = point.y * (1 - this.options.predictionStrength) + prediction.y * this.options.predictionStrength;
    }
    
    flush() {
        // Return any remaining points for final processing
        const remaining = this.inputBuffer.slice(-2);
        this.reset();
        return remaining;
    }
    
    setOptions(newOptions) {
        this.options = { ...this.options, ...newOptions };
    }
}

class PressureProcessor {
    constructor(options = {}) {
        this.options = {
            pressureCurve: options.pressureCurve || 'linear', // linear, ease-in, ease-out, custom
            minPressure: options.minPressure || 0.1,
            maxPressure: options.maxPressure || 1.0,
            pressureSmoothing: options.pressureSmoothing || 0.3,
            velocityInfluence: options.velocityInfluence || 0.2,
            ...options
        };
        
        this.pressureHistory = [];
        this.velocityHistory = [];
    }
    
    processPressure(inputData) {
        let pressure = inputData.pressure;
        
        // Apply pressure curve
        pressure = this.applyCurve(pressure);
        
        // Apply smoothing
        pressure = this.smoothPressure(pressure);
        
        // Apply velocity influence
        if (this.options.velocityInfluence > 0) {
            pressure = this.applyVelocityInfluence(pressure, inputData);
        }
        
        // Clamp to range
        pressure = Math.max(this.options.minPressure, Math.min(this.options.maxPressure, pressure));
        
        return pressure;
    }
    
    applyCurve(pressure) {
        switch (this.options.pressureCurve) {
            case 'ease-in':
                return pressure * pressure;
            case 'ease-out':
                return 1 - Math.pow(1 - pressure, 2);
            case 'ease-in-out':
                return pressure < 0.5 ? 
                    2 * pressure * pressure : 
                    1 - Math.pow(-2 * pressure + 2, 2) / 2;
            case 'custom':
                return this.customPressureCurve(pressure);
            default:
                return pressure;
        }
    }
    
    customPressureCurve(pressure) {
        // S-curve for more natural pressure response
        return 1 / (1 + Math.exp(-6 * (pressure - 0.5)));
    }
    
    smoothPressure(pressure) {
        this.pressureHistory.push(pressure);
        if (this.pressureHistory.length > 5) {
            this.pressureHistory.shift();
        }
        
        if (this.pressureHistory.length === 1) {
            return pressure;
        }
        
        // Weighted average with more weight on recent values
        let totalWeight = 0;
        let weightedSum = 0;
        
        this.pressureHistory.forEach((p, i) => {
            const weight = Math.pow(2, i); // Exponential weighting
            totalWeight += weight;
            weightedSum += p * weight;
        });
        
        return weightedSum / totalWeight;
    }
    
    applyVelocityInfluence(pressure, inputData) {
        // Calculate velocity
        if (this.velocityHistory.length > 0) {
            const lastData = this.velocityHistory[this.velocityHistory.length - 1];
            const dx = inputData.x - lastData.x;
            const dy = inputData.y - lastData.y;
            const dt = inputData.timestamp - lastData.timestamp;
            
            if (dt > 0) {
                const velocity = Math.sqrt(dx * dx + dy * dy) / dt;
                const normalizedVelocity = Math.min(1, velocity * 0.01); // Normalize velocity
                
                // Reduce pressure for fast movements (simulates natural pen behavior)
                const velocityFactor = 1 - (normalizedVelocity * this.options.velocityInfluence);
                pressure *= velocityFactor;
            }
        }
        
        this.velocityHistory.push({
            x: inputData.x,
            y: inputData.y,
            timestamp: inputData.timestamp
        });
        
        if (this.velocityHistory.length > 3) {
            this.velocityHistory.shift();
        }
        
        return pressure;
    }
}

class TiltProcessor {
    constructor(options = {}) {
        this.options = {
            tiltInfluence: options.tiltInfluence || 0.5,
            tiltSmoothing: options.tiltSmoothing || 0.3,
            maxTiltAngle: options.maxTiltAngle || 60, // degrees
            ...options
        };
        
        this.tiltHistory = [];
    }
    
    processTilt(inputData) {
        const tilt = {
            x: this.smoothTilt(inputData.tiltX, 'x'),
            y: this.smoothTilt(inputData.tiltY, 'y'),
            angle: this.calculateTiltAngle(inputData.tiltX, inputData.tiltY),
            magnitude: this.calculateTiltMagnitude(inputData.tiltX, inputData.tiltY)
        };
        
        return tilt;
    }
    
    smoothTilt(tiltValue, axis) {
        if (!this.tiltHistory[axis]) {
            this.tiltHistory[axis] = [];
        }
        
        this.tiltHistory[axis].push(tiltValue);
        if (this.tiltHistory[axis].length > 3) {
            this.tiltHistory[axis].shift();
        }
        
        // Simple moving average
        return this.tiltHistory[axis].reduce((sum, val) => sum + val, 0) / this.tiltHistory[axis].length;
    }
    
    calculateTiltAngle(tiltX, tiltY) {
        return Math.atan2(tiltY, tiltX) * 180 / Math.PI;
    }
    
    calculateTiltMagnitude(tiltX, tiltY) {
        const magnitude = Math.sqrt(tiltX * tiltX + tiltY * tiltY);
        return Math.min(1, magnitude / this.options.maxTiltAngle);
    }
    
    applyTiltToBrush(brushProperties, tiltData) {
        if (this.options.tiltInfluence === 0) return brushProperties;
        
        const modified = { ...brushProperties };
        
        // Modify brush size based on tilt
        const tiltFactor = 1 - (tiltData.magnitude * this.options.tiltInfluence * 0.3);
        modified.size *= tiltFactor;
        
        // Modify brush rotation based on tilt angle
        if (Math.abs(tiltData.angle) > 10) { // Only apply if significant tilt
            modified.rotation = tiltData.angle * this.options.tiltInfluence;
        }
        
        return modified;
    }
}

class StylusTabletManager {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.tabletInput = new TabletInputManager(eventManager);
        this.stabilizer = new AdvancedStabilizer();
        this.pressureProcessor = new PressureProcessor();
        this.tiltProcessor = new TiltProcessor();
        
        this.isEnabled = true;
        this.settings = {
            stabilizationLevel: 5,
            pressureSensitivity: 1.0,
            tiltSensitivity: 0.5,
            enablePrediction: true,
            enableVelocitySmoothing: true
        };
    }
    
    processInput(event) {
        if (!this.isEnabled) {
            return this.createBasicInputData(event);
        }
        
        // Extract raw input data
        const rawInput = this.tabletInput.processInputEvent(event);
        
        // Process pressure
        rawInput.pressure = this.pressureProcessor.processPressure(rawInput);
        
        // Process tilt
        rawInput.tilt = this.tiltProcessor.processTilt(rawInput);
        
        // Apply stabilization
        const stabilizedPoints = this.stabilizer.addPoint(rawInput);
        
        return stabilizedPoints.length > 0 ? stabilizedPoints[stabilizedPoints.length - 1] : rawInput;
    }
    
    createBasicInputData(event) {
        return {
            x: event.clientX || event.touches?.[0]?.clientX || 0,
            y: event.clientY || event.touches?.[0]?.clientY || 0,
            pressure: event.pressure || 0.5,
            tiltX: 0,
            tiltY: 0,
            rotation: 0,
            timestamp: Date.now()
        };
    }
    
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        
        // Update stabilizer options
        this.stabilizer.setOptions({
            smoothingLevel: this.settings.stabilizationLevel,
            predictionStrength: this.settings.enablePrediction ? 0.3 : 0,
            velocitySmoothing: this.settings.enableVelocitySmoothing
        });
        
        // Update pressure processor
        this.pressureProcessor.options.pressureSmoothing = this.settings.pressureSensitivity;
        
        // Update tilt processor
        this.tiltProcessor.options.tiltInfluence = this.settings.tiltSensitivity;
    }
    
    calibrateTablet() {
        return this.tabletInput.startCalibration();
    }
    
    reset() {
        this.stabilizer.reset();
        this.pressureProcessor.pressureHistory = [];
        this.pressureProcessor.velocityHistory = [];
        this.tiltProcessor.tiltHistory = [];
    }
    
    enable() {
        this.isEnabled = true;
        this.eventManager.emit('stylusTabletEnabled');
    }
    
    disable() {
        this.isEnabled = false;
        this.reset();
        this.eventManager.emit('stylusTabletDisabled');
    }
    
    getStatus() {
        return {
            isEnabled: this.isEnabled,
            isTabletConnected: this.tabletInput.isTabletConnected,
            supportedEvents: Array.from(this.tabletInput.supportedEvents),
            settings: this.settings
        };
    }
}

// Stylus/Tablet Settings Panel
class StylusTabletPanel {
    constructor(stylusTabletManager) {
        this.stylusTabletManager = stylusTabletManager;
    }
    
    createPanel() {
        const panel = document.createElement('div');
        panel.className = 'stylus-tablet-panel';
        panel.style.cssText = `
            padding: 20px;
            background: var(--nebula-surface);
            border-radius: 8px;
            margin-top: 20px;
        `;
        
        panel.innerHTML = `
            <div class="panel-header">
                <h3 class="panel-title">Stylus & Tablet</h3>
                <div class="status-indicator" id="tablet-status">
                    <span class="status-dot"></span>
                    <span class="status-text">Detecting...</span>
                </div>
            </div>
            
            <div class="tablet-settings">
                <div class="property-group checkbox-group">
                    <label class="checkbox-label">
                        <input type="checkbox" id="enable-stylus-support" checked>
                        <span class="checkmark"></span>
                        Enable Stylus/Tablet Support
                    </label>
                </div>
                
                <div class="property-group">
                    <label class="property-label">Stabilization Level</label>
                    <div class="property-control">
                        <input type="range" id="stabilization-level" min="0" max="20" value="5" class="enhanced-slider">
                        <span id="stabilization-level-value" class="property-value">5</span>
                    </div>
                </div>
                
                <div class="property-group">
                    <label class="property-label">Pressure Sensitivity</label>
                    <div class="property-control">
                        <input type="range" id="pressure-sensitivity" min="0" max="200" value="100" class="enhanced-slider">
                        <span id="pressure-sensitivity-value" class="property-value">100%</span>
                    </div>
                </div>
                
                <div class="property-group">
                    <label class="property-label">Tilt Sensitivity</label>
                    <div class="property-control">
                        <input type="range" id="tilt-sensitivity" min="0" max="100" value="50" class="enhanced-slider">
                        <span id="tilt-sensitivity-value" class="property-value">50%</span>
                    </div>
                </div>
                
                <div class="property-group checkbox-group">
                    <label class="checkbox-label">
                        <input type="checkbox" id="enable-prediction" checked>
                        <span class="checkmark"></span>
                        Enable Stroke Prediction
                    </label>
                </div>
                
                <div class="property-group checkbox-group">
                    <label class="checkbox-label">
                        <input type="checkbox" id="enable-velocity-smoothing" checked>
                        <span class="checkmark"></span>
                        Enable Velocity Smoothing
                    </label>
                </div>
            </div>
            
            <div class="tablet-actions">
                <button class="enhanced-btn" id="calibrate-tablet">Calibrate Tablet</button>
                <button class="enhanced-btn" id="test-pressure">Test Pressure</button>
                <button class="enhanced-btn" id="reset-settings">Reset Settings</button>
            </div>
            
            <div class="tablet-info">
                <h4 class="section-title">Device Information</h4>
                <div class="info-grid" id="device-info">
                    <!-- Device info will be populated here -->
                </div>
            </div>
        `;
        
        this.setupEventListeners(panel);
        this.updateStatus(panel);
        this.updateDeviceInfo(panel);
        
        return panel;
    }
    
    setupEventListeners(panel) {
        // Enable/disable stylus support
        const enableCheckbox = panel.querySelector('#enable-stylus-support');
        if (enableCheckbox) {
            enableCheckbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.stylusTabletManager.enable();
                } else {
                    this.stylusTabletManager.disable();
                }
                this.updateStatus(panel);
            });
        }
        
        // Stabilization level
        const stabilizationSlider = panel.querySelector('#stabilization-level');
        const stabilizationValue = panel.querySelector('#stabilization-level-value');
        if (stabilizationSlider && stabilizationValue) {
            stabilizationSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                stabilizationValue.textContent = value;
                this.stylusTabletManager.updateSettings({ stabilizationLevel: value });
            });
        }
        
        // Pressure sensitivity
        const pressureSlider = panel.querySelector('#pressure-sensitivity');
        const pressureValue = panel.querySelector('#pressure-sensitivity-value');
        if (pressureSlider && pressureValue) {
            pressureSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                pressureValue.textContent = value + '%';
                this.stylusTabletManager.updateSettings({ pressureSensitivity: value / 100 });
            });
        }
        
        // Tilt sensitivity
        const tiltSlider = panel.querySelector('#tilt-sensitivity');
        const tiltValue = panel.querySelector('#tilt-sensitivity-value');
        if (tiltSlider && tiltValue) {
            tiltSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                tiltValue.textContent = value + '%';
                this.stylusTabletManager.updateSettings({ tiltSensitivity: value / 100 });
            });
        }
        
        // Checkboxes
        const predictionCheckbox = panel.querySelector('#enable-prediction');
        if (predictionCheckbox) {
            predictionCheckbox.addEventListener('change', (e) => {
                this.stylusTabletManager.updateSettings({ enablePrediction: e.target.checked });
            });
        }
        
        const velocitySmoothingCheckbox = panel.querySelector('#enable-velocity-smoothing');
        if (velocitySmoothingCheckbox) {
            velocitySmoothingCheckbox.addEventListener('change', (e) => {
                this.stylusTabletManager.updateSettings({ enableVelocitySmoothing: e.target.checked });
            });
        }
        
        // Action buttons
        panel.querySelector('#calibrate-tablet')?.addEventListener('click', () => {
            this.calibrateTablet();
        });
        
        panel.querySelector('#test-pressure')?.addEventListener('click', () => {
            this.testPressure();
        });
        
        panel.querySelector('#reset-settings')?.addEventListener('click', () => {
            this.resetSettings(panel);
        });
    }
    
    updateStatus(panel) {
        const statusIndicator = panel.querySelector('#tablet-status');
        if (!statusIndicator) return;
        
        const status = this.stylusTabletManager.getStatus();
        const statusDot = statusIndicator.querySelector('.status-dot');
        const statusText = statusIndicator.querySelector('.status-text');
        
        if (status.isEnabled && status.isTabletConnected) {
            statusDot.style.backgroundColor = '#4caf50';
            statusText.textContent = 'Tablet Connected';
        } else if (status.isEnabled) {
            statusDot.style.backgroundColor = '#ff9800';
            statusText.textContent = 'Mouse/Touch';
        } else {
            statusDot.style.backgroundColor = '#f44336';
            statusText.textContent = 'Disabled';
        }
    }
    
    updateDeviceInfo(panel) {
        const deviceInfo = panel.querySelector('#device-info');
        if (!deviceInfo) return;
        
        const status = this.stylusTabletManager.getStatus();
        
        deviceInfo.innerHTML = `
            <div class="info-item">
                <span class="info-label">Max Touch Points:</span>
                <span class="info-value">${navigator.maxTouchPoints || 'Unknown'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Supported Events:</span>
                <span class="info-value">${status.supportedEvents.join(', ') || 'None'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Tablet Connected:</span>
                <span class="info-value">${status.isTabletConnected ? 'Yes' : 'No'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Platform:</span>
                <span class="info-value">${navigator.platform}</span>
            </div>
        `;
    }
    
    async calibrateTablet() {
        try {
            const calibration = await this.stylusTabletManager.calibrateTablet();
            alert('Tablet calibration complete! Move your stylus around the canvas to calibrate pressure and tilt sensitivity.');
        } catch (error) {
            alert('Calibration failed. Please ensure your tablet is connected and try again.');
        }
    }
    
    testPressure() {
        alert('Pressure test mode activated. Draw on the canvas to see pressure visualization.');
        // TODO: Implement pressure test visualization
    }
    
    resetSettings(panel) {
        // Reset to default values
        panel.querySelector('#stabilization-level').value = 5;
        panel.querySelector('#stabilization-level-value').textContent = '5';
        panel.querySelector('#pressure-sensitivity').value = 100;
        panel.querySelector('#pressure-sensitivity-value').textContent = '100%';
        panel.querySelector('#tilt-sensitivity').value = 50;
        panel.querySelector('#tilt-sensitivity-value').textContent = '50%';
        panel.querySelector('#enable-prediction').checked = true;
        panel.querySelector('#enable-velocity-smoothing').checked = true;
        
        // Update manager settings
        this.stylusTabletManager.updateSettings({
            stabilizationLevel: 5,
            pressureSensitivity: 1.0,
            tiltSensitivity: 0.5,
            enablePrediction: true,
            enableVelocitySmoothing: true
        });
    }
}

// Export classes
window.StylusTabletManager = StylusTabletManager;
window.StylusTabletPanel = StylusTabletPanel;
window.AdvancedStabilizer = AdvancedStabilizer;
window.TabletInputManager = TabletInputManager;
window.PressureProcessor = PressureProcessor;
window.TiltProcessor = TiltProcessor;

