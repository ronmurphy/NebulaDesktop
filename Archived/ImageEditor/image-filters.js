// Image Filters and Manipulation Tools for NebulaImageEditor

class ImageFilters {
    constructor() {
        this.filters = new Map();
        this.initializeFilters();
    }
    
    initializeFilters() {
        // Basic adjustments
        this.filters.set('brightness', this.brightness.bind(this));
        this.filters.set('contrast', this.contrast.bind(this));
        this.filters.set('saturation', this.saturation.bind(this));
        this.filters.set('hue', this.hue.bind(this));
        this.filters.set('gamma', this.gamma.bind(this));
        
        // Color filters
        this.filters.set('grayscale', this.grayscale.bind(this));
        this.filters.set('sepia', this.sepia.bind(this));
        this.filters.set('invert', this.invert.bind(this));
        this.filters.set('threshold', this.threshold.bind(this));
        
        // Blur and sharpen
        this.filters.set('blur', this.blur.bind(this));
        this.filters.set('sharpen', this.sharpen.bind(this));
        this.filters.set('edge-detect', this.edgeDetect.bind(this));
        
        // Artistic filters
        this.filters.set('emboss', this.emboss.bind(this));
        this.filters.set('vintage', this.vintage.bind(this));
        this.filters.set('warm', this.warm.bind(this));
        this.filters.set('cool', this.cool.bind(this));
    }
    
    applyFilter(imageData, filterName, options = {}) {
        const filter = this.filters.get(filterName);
        if (!filter) {
            console.warn(`Filter '${filterName}' not found`);
            return imageData;
        }
        
        return filter(imageData, options);
    }
    
    // Basic Adjustments
    brightness(imageData, options = {}) {
        const { value = 0 } = options; // -100 to 100
        const data = imageData.data;
        const adjustment = (value / 100) * 255;
        
        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.max(0, Math.min(255, data[i] + adjustment));     // R
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + adjustment)); // G
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + adjustment)); // B
        }
        
        return imageData;
    }
    
    contrast(imageData, options = {}) {
        const { value = 0 } = options; // -100 to 100
        const data = imageData.data;
        const factor = (259 * (value + 255)) / (255 * (259 - value));
        
        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.max(0, Math.min(255, factor * (data[i] - 128) + 128));     // R
            data[i + 1] = Math.max(0, Math.min(255, factor * (data[i + 1] - 128) + 128)); // G
            data[i + 2] = Math.max(0, Math.min(255, factor * (data[i + 2] - 128) + 128)); // B
        }
        
        return imageData;
    }
    
    saturation(imageData, options = {}) {
        const { value = 0 } = options; // -100 to 100
        const data = imageData.data;
        const factor = (value + 100) / 100;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            
            data[i] = Math.max(0, Math.min(255, gray + factor * (r - gray)));
            data[i + 1] = Math.max(0, Math.min(255, gray + factor * (g - gray)));
            data[i + 2] = Math.max(0, Math.min(255, gray + factor * (b - gray)));
        }
        
        return imageData;
    }
    
    hue(imageData, options = {}) {
        const { value = 0 } = options; // -180 to 180
        const data = imageData.data;
        const hueShift = value * Math.PI / 180;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i] / 255;
            const g = data[i + 1] / 255;
            const b = data[i + 2] / 255;
            
            const [h, s, l] = this.rgbToHsl(r, g, b);
            const newH = (h + hueShift) % (2 * Math.PI);
            const [newR, newG, newB] = this.hslToRgb(newH, s, l);
            
            data[i] = Math.round(newR * 255);
            data[i + 1] = Math.round(newG * 255);
            data[i + 2] = Math.round(newB * 255);
        }
        
        return imageData;
    }
    
    gamma(imageData, options = {}) {
        const { value = 1.0 } = options; // 0.1 to 3.0
        const data = imageData.data;
        const gammaCorrection = 1 / value;
        
        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.pow(data[i] / 255, gammaCorrection) * 255;
            data[i + 1] = Math.pow(data[i + 1] / 255, gammaCorrection) * 255;
            data[i + 2] = Math.pow(data[i + 2] / 255, gammaCorrection) * 255;
        }
        
        return imageData;
    }
    
    // Color Filters
    grayscale(imageData, options = {}) {
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            data[i] = gray;     // R
            data[i + 1] = gray; // G
            data[i + 2] = gray; // B
        }
        
        return imageData;
    }
    
    sepia(imageData, options = {}) {
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
            data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
            data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
        }
        
        return imageData;
    }
    
    invert(imageData, options = {}) {
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            data[i] = 255 - data[i];         // R
            data[i + 1] = 255 - data[i + 1]; // G
            data[i + 2] = 255 - data[i + 2]; // B
        }
        
        return imageData;
    }
    
    threshold(imageData, options = {}) {
        const { value = 128 } = options; // 0 to 255
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            const bw = gray > value ? 255 : 0;
            data[i] = bw;     // R
            data[i + 1] = bw; // G
            data[i + 2] = bw; // B
        }
        
        return imageData;
    }
    
    // Convolution Filters
    blur(imageData, options = {}) {
        const { radius = 1 } = options;
        return this.applyConvolution(imageData, this.getBlurKernel(radius));
    }
    
    sharpen(imageData, options = {}) {
        const kernel = [
            0, -1, 0,
            -1, 5, -1,
            0, -1, 0
        ];
        return this.applyConvolution(imageData, kernel, 3);
    }
    
    edgeDetect(imageData, options = {}) {
        const kernel = [
            -1, -1, -1,
            -1, 8, -1,
            -1, -1, -1
        ];
        return this.applyConvolution(imageData, kernel, 3);
    }
    
    emboss(imageData, options = {}) {
        const kernel = [
            -2, -1, 0,
            -1, 1, 1,
            0, 1, 2
        ];
        return this.applyConvolution(imageData, kernel, 3);
    }
    
    // Artistic Filters
    vintage(imageData, options = {}) {
        // Apply sepia first
        imageData = this.sepia(imageData);
        
        // Add some noise and reduce contrast
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            // Add noise
            const noise = (Math.random() - 0.5) * 20;
            data[i] = Math.max(0, Math.min(255, data[i] + noise));
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
            
            // Reduce contrast slightly
            data[i] = data[i] * 0.9 + 25;
            data[i + 1] = data[i + 1] * 0.9 + 25;
            data[i + 2] = data[i + 2] * 0.9 + 25;
        }
        
        return imageData;
    }
    
    warm(imageData, options = {}) {
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, data[i] * 1.1);     // Increase red
            data[i + 1] = Math.min(255, data[i + 1] * 1.05); // Slightly increase green
            data[i + 2] = Math.max(0, data[i + 2] * 0.9);     // Decrease blue
        }
        
        return imageData;
    }
    
    cool(imageData, options = {}) {
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.max(0, data[i] * 0.9);       // Decrease red
            data[i + 1] = Math.min(255, data[i + 1] * 1.05); // Slightly increase green
            data[i + 2] = Math.min(255, data[i + 2] * 1.1);   // Increase blue
        }
        
        return imageData;
    }
    
    // Helper methods
    applyConvolution(imageData, kernel, kernelSize = 3) {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        const output = new Uint8ClampedArray(data);
        
        const half = Math.floor(kernelSize / 2);
        
        for (let y = half; y < height - half; y++) {
            for (let x = half; x < width - half; x++) {
                let r = 0, g = 0, b = 0;
                
                for (let ky = 0; ky < kernelSize; ky++) {
                    for (let kx = 0; kx < kernelSize; kx++) {
                        const px = x + kx - half;
                        const py = y + ky - half;
                        const idx = (py * width + px) * 4;
                        const weight = kernel[ky * kernelSize + kx];
                        
                        r += data[idx] * weight;
                        g += data[idx + 1] * weight;
                        b += data[idx + 2] * weight;
                    }
                }
                
                const idx = (y * width + x) * 4;
                output[idx] = Math.max(0, Math.min(255, r));
                output[idx + 1] = Math.max(0, Math.min(255, g));
                output[idx + 2] = Math.max(0, Math.min(255, b));
            }
        }
        
        return new ImageData(output, width, height);
    }
    
    getBlurKernel(radius) {
        const size = radius * 2 + 1;
        const kernel = new Array(size * size);
        const sigma = radius / 3;
        const twoSigmaSquare = 2 * sigma * sigma;
        const center = radius;
        let sum = 0;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const dx = x - center;
                const dy = y - center;
                const distance = dx * dx + dy * dy;
                const value = Math.exp(-distance / twoSigmaSquare);
                kernel[y * size + x] = value;
                sum += value;
            }
        }
        
        // Normalize kernel
        for (let i = 0; i < kernel.length; i++) {
            kernel[i] /= sum;
        }
        
        return kernel;
    }
    
    rgbToHsl(r, g, b) {
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
            h = s = 0; // achromatic
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        
        return [h * 2 * Math.PI, s, l];
    }
    
    hslToRgb(h, s, l) {
        h = h / (2 * Math.PI);
        let r, g, b;
        
        if (s === 0) {
            r = g = b = l; // achromatic
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        
        return [r, g, b];
    }
}

// Adjustment Panel for the Image Editor
class AdjustmentPanel {
    constructor(imageEditor) {
        this.imageEditor = imageEditor;
        this.filters = new ImageFilters();
        this.currentAdjustments = {};
        this.previewMode = false;
    }
    
    createPanel() {
        const panel = document.createElement('div');
        panel.className = 'adjustment-panel';
        panel.style.cssText = `
            padding: 16px;
            border-bottom: 1px solid var(--nebula-border);
            background: var(--nebula-surface);
        `;
        
        panel.innerHTML = `
            <h3 style="margin: 0 0 16px 0; color: var(--nebula-text-primary); font-size: 14px;">Adjustments</h3>
            
            <div class="adjustment-group">
                <label style="display: block; margin-bottom: 8px; color: var(--nebula-text-primary); font-size: 12px;">Brightness</label>
                <input type="range" id="brightness-slider" min="-100" max="100" value="0" style="width: 100%;">
                <span id="brightness-value" style="font-size: 11px; color: var(--nebula-text-secondary);">0</span>
            </div>
            
            <div class="adjustment-group" style="margin-top: 12px;">
                <label style="display: block; margin-bottom: 8px; color: var(--nebula-text-primary); font-size: 12px;">Contrast</label>
                <input type="range" id="contrast-slider" min="-100" max="100" value="0" style="width: 100%;">
                <span id="contrast-value" style="font-size: 11px; color: var(--nebula-text-secondary);">0</span>
            </div>
            
            <div class="adjustment-group" style="margin-top: 12px;">
                <label style="display: block; margin-bottom: 8px; color: var(--nebula-text-primary); font-size: 12px;">Saturation</label>
                <input type="range" id="saturation-slider" min="-100" max="100" value="0" style="width: 100%;">
                <span id="saturation-value" style="font-size: 11px; color: var(--nebula-text-secondary);">0</span>
            </div>
            
            <div class="filter-group" style="margin-top: 16px;">
                <h4 style="margin: 0 0 8px 0; color: var(--nebula-text-primary); font-size: 12px;">Filters</h4>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px;">
                    <button class="filter-btn" data-filter="grayscale">Grayscale</button>
                    <button class="filter-btn" data-filter="sepia">Sepia</button>
                    <button class="filter-btn" data-filter="invert">Invert</button>
                    <button class="filter-btn" data-filter="blur">Blur</button>
                    <button class="filter-btn" data-filter="sharpen">Sharpen</button>
                    <button class="filter-btn" data-filter="vintage">Vintage</button>
                    <button class="filter-btn" data-filter="warm">Warm</button>
                    <button class="filter-btn" data-filter="cool">Cool</button>
                </div>
            </div>
            
            <div class="adjustment-controls" style="margin-top: 16px; display: flex; gap: 8px;">
                <button id="reset-adjustments" class="small-btn" style="flex: 1; padding: 6px;">Reset</button>
                <button id="apply-adjustments" class="small-btn" style="flex: 1; padding: 6px; background: var(--nebula-primary); color: white;">Apply</button>
            </div>
        `;
        
        this.setupAdjustmentListeners(panel);
        return panel;
    }
    
    setupAdjustmentListeners(panel) {
        // Slider adjustments
        const sliders = ['brightness', 'contrast', 'saturation'];
        sliders.forEach(adjustment => {
            const slider = panel.querySelector(`#${adjustment}-slider`);
            const valueDisplay = panel.querySelector(`#${adjustment}-value`);
            
            if (slider && valueDisplay) {
                slider.addEventListener('input', (e) => {
                    const value = parseInt(e.target.value);
                    valueDisplay.textContent = value;
                    this.currentAdjustments[adjustment] = value;
                    this.previewAdjustments();
                });
            }
        });
        
        // Filter buttons
        panel.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.applyFilter(filter);
            });
        });
        
        // Control buttons
        panel.querySelector('#reset-adjustments')?.addEventListener('click', () => {
            this.resetAdjustments();
        });
        
        panel.querySelector('#apply-adjustments')?.addEventListener('click', () => {
            this.applyAdjustments();
        });
        
        // Add filter button styles
        this.addFilterStyles();
    }
    
    previewAdjustments() {
        const layer = this.imageEditor.layerManager.getActiveLayer();
        if (!layer) return;
        
        // Get original image data
        const imageData = layer.getImageData();
        let processedData = new ImageData(
            new Uint8ClampedArray(imageData.data),
            imageData.width,
            imageData.height
        );
        
        // Apply adjustments in order
        if (this.currentAdjustments.brightness !== undefined && this.currentAdjustments.brightness !== 0) {
            processedData = this.filters.brightness(processedData, { value: this.currentAdjustments.brightness });
        }
        
        if (this.currentAdjustments.contrast !== undefined && this.currentAdjustments.contrast !== 0) {
            processedData = this.filters.contrast(processedData, { value: this.currentAdjustments.contrast });
        }
        
        if (this.currentAdjustments.saturation !== undefined && this.currentAdjustments.saturation !== 0) {
            processedData = this.filters.saturation(processedData, { value: this.currentAdjustments.saturation });
        }
        
        // Apply to layer and render
        layer.putImageData(processedData);
        this.imageEditor.layerManager.render();
    }
    
    applyFilter(filterName) {
        const layer = this.imageEditor.layerManager.getActiveLayer();
        if (!layer) return;
        
        const imageData = layer.getImageData();
        const filteredData = this.filters.applyFilter(imageData, filterName);
        
        layer.putImageData(filteredData);
        this.imageEditor.layerManager.render();
        this.imageEditor.updateStatus(`${filterName} filter applied`);
    }
    
    applyAdjustments() {
        // Adjustments are already applied through preview
        this.currentAdjustments = {};
        this.imageEditor.updateStatus('Adjustments applied');
    }
    
    resetAdjustments() {
        // Reset sliders
        const panel = document.querySelector('.adjustment-panel');
        if (panel) {
            panel.querySelector('#brightness-slider').value = 0;
            panel.querySelector('#contrast-slider').value = 0;
            panel.querySelector('#saturation-slider').value = 0;
            panel.querySelector('#brightness-value').textContent = '0';
            panel.querySelector('#contrast-value').textContent = '0';
            panel.querySelector('#saturation-value').textContent = '0';
        }
        
        this.currentAdjustments = {};
        this.imageEditor.updateStatus('Adjustments reset');
    }
    
    addFilterStyles() {
        if (document.querySelector('#filter-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'filter-styles';
        style.textContent = `
            .filter-btn {
                padding: 6px 8px;
                border: 1px solid var(--nebula-border);
                background: var(--nebula-bg-secondary);
                color: var(--nebula-text-primary);
                border-radius: var(--nebula-radius-sm);
                cursor: pointer;
                font-size: 11px;
                transition: var(--nebula-transition);
            }
            
            .filter-btn:hover {
                background: var(--nebula-surface-hover);
                border-color: var(--nebula-border-hover);
            }
            
            .filter-btn:active {
                background: var(--nebula-primary);
                color: white;
            }
        `;
        document.head.appendChild(style);
    }
}

// Export for use in the main image editor
window.ImageFilters = ImageFilters;
window.AdjustmentPanel = AdjustmentPanel;

