// MediaPlayer.js - Media player app for NebulaDesktop

class MediaPlayer {
    constructor(filename, filepath, mediaType = 'auto') {
        this.filename = filename;
        this.filepath = filepath;
        this.mediaType = mediaType; // 'audio', 'video', or 'auto'
        this.windowId = null;
        this.mediaElement = null;
        this.isPlaying = false;
        this.currentTime = 0;
        this.duration = 0;
        this.volume = 1;
        this.isMuted = false;
        this.isFullscreen = false;
        
        this.init();
    }
    
    async init() {
        if (!window.windowManager) {
            console.error('WindowManager not available');
            return;
        }
        
        // Determine media type if auto
        if (this.mediaType === 'auto') {
            this.mediaType = this.detectMediaType(this.filename);
        }
        
        // Create media player window
        this.windowId = window.windowManager.createWindow({
            title: `${this.mediaType === 'video' ? 'Video' : 'Audio'} Player - ${this.filename}`,
            width: this.mediaType === 'video' ? 800 : 400,
            height: this.mediaType === 'video' ? 600 : 200,
            resizable: true,
            maximizable: true,
            minimizable: true
        });
        
        // Load media player into window
        window.windowManager.loadApp(this.windowId, this);
        
        console.log(`Media player initialized for: ${this.filename} (${this.mediaType})`);
    }
    
    /**
     * Detect media type from filename
     */
    detectMediaType(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const audioExts = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'];
        const videoExts = ['mp4', 'avi', 'mov', 'mkv', 'webm', 'ogv', 'm4v'];
        
        if (audioExts.includes(ext)) return 'audio';
        if (videoExts.includes(ext)) return 'video';
        return 'video'; // Default to video
    }
    
    /**
     * Called by WindowManager to render the media player
     */
    render() {
        const container = document.createElement('div');
        container.className = 'media-player-container';
        container.style.cssText = `
            width: 100%;
            height: 100%;
            background: var(--nebula-surface, #2a2a2a);
            display: flex;
            flex-direction: column;
            overflow: hidden;
        `;
        
        // Create media display area
        const mediaArea = this.createMediaArea();
        container.appendChild(mediaArea);
        
        // Create controls
        const controls = this.createControls();
        container.appendChild(controls);
        
        // Create status bar
        const statusBar = this.createStatusBar();
        container.appendChild(statusBar);
        
        // Load the media
        this.loadMedia();
        
        return container;
    }
    
    /**
     * Create media display area
     */
    createMediaArea() {
        const mediaArea = document.createElement('div');
        mediaArea.className = 'media-display-area';
        mediaArea.style.cssText = `
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--nebula-background, #1a1a1a);
            position: relative;
            overflow: hidden;
        `;
        
        if (this.mediaType === 'video') {
            // Create video element
            const video = document.createElement('video');
            video.className = 'media-element';
            video.style.cssText = `
                max-width: 100%;
                max-height: 100%;
                width: auto;
                height: auto;
            `;
            video.controls = false; // We'll use custom controls
            mediaArea.appendChild(video);
            this.mediaElement = video;
        } else {
            // Create audio visualization area
            const audioViz = document.createElement('div');
            audioViz.className = 'audio-visualization';
            audioViz.style.cssText = `
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
            `;
            
            audioViz.innerHTML = `
                <div class="audio-icon" style="font-size: 64px; margin-bottom: 20px;">🎵</div>
                <div class="audio-title" style="font-size: 24px; font-weight: bold; color: var(--nebula-text, #ffffff); margin-bottom: 10px;">${this.filename}</div>
                <div class="audio-artist" style="font-size: 16px; color: var(--nebula-text-secondary, #9ca3af);">Unknown Artist</div>
                <div class="audio-waveform" style="width: 80%; height: 60px; margin-top: 30px; background: var(--nebula-primary, #667eea); border-radius: 4px; position: relative; overflow: hidden;">
                    <div class="waveform-progress" style="height: 100%; background: var(--nebula-accent, #f093fb); width: 0%; transition: width 0.1s;"></div>
                </div>
            `;
            
            mediaArea.appendChild(audioViz);
            
            // Create hidden audio element
            const audio = document.createElement('audio');
            audio.className = 'media-element';
            mediaArea.appendChild(audio);
            this.mediaElement = audio;
        }
        
        return mediaArea;
    }
    
    /**
     * Create media controls
     */
    createControls() {
        const controls = document.createElement('div');
        controls.className = 'media-controls';
        controls.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 15px;
            background: var(--nebula-primary, #667eea);
            color: white;
            border-top: 1px solid var(--nebula-border, #444);
            flex-shrink: 0;
        `;
        
        controls.innerHTML = `
            <button class="control-btn" id="play-pause" title="Play/Pause">
                <span class="material-symbols-outlined">play_arrow</span>
            </button>
            <button class="control-btn" id="stop" title="Stop">
                <span class="material-symbols-outlined">stop</span>
            </button>
            <div class="time-display" id="current-time">0:00</div>
            <div class="progress-container" style="flex: 1; margin: 0 10px;">
                <input type="range" class="progress-slider" id="progress" min="0" max="100" value="0" style="width: 100%;">
            </div>
            <div class="time-display" id="duration">0:00</div>
            <button class="control-btn" id="mute" title="Mute/Unmute">
                <span class="material-symbols-outlined">volume_up</span>
            </button>
            <div class="volume-container" style="width: 80px;">
                <input type="range" class="volume-slider" id="volume" min="0" max="100" value="100" style="width: 100%;">
            </div>
            ${this.mediaType === 'video' ? `
                <button class="control-btn" id="fullscreen" title="Fullscreen">
                    <span class="material-symbols-outlined">fullscreen</span>
                </button>
            ` : ''}
        `;
        
        // Add control styles
        const style = document.createElement('style');
        style.textContent = `
            .control-btn {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: white;
                padding: 8px;
                border-radius: 4px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background-color 0.2s;
                width: 40px;
                height: 40px;
            }
            
            .control-btn:hover {
                background: rgba(255, 255, 255, 0.2);
            }
            
            .control-btn:active {
                background: rgba(255, 255, 255, 0.3);
            }
            
            .time-display {
                font-family: monospace;
                font-size: 14px;
                min-width: 40px;
                text-align: center;
            }
            
            .progress-slider, .volume-slider {
                -webkit-appearance: none;
                appearance: none;
                height: 4px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 2px;
                outline: none;
            }
            
            .progress-slider::-webkit-slider-thumb, .volume-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 16px;
                height: 16px;
                background: white;
                border-radius: 50%;
                cursor: pointer;
            }
            
            .progress-slider::-moz-range-thumb, .volume-slider::-moz-range-thumb {
                width: 16px;
                height: 16px;
                background: white;
                border-radius: 50%;
                cursor: pointer;
                border: none;
            }
        `;
        document.head.appendChild(style);
        
        // Add event listeners
        this.setupControlListeners(controls);
        
        return controls;
    }
    
    /**
     * Create status bar
     */
    createStatusBar() {
        const statusBar = document.createElement('div');
        statusBar.className = 'media-player-status';
        statusBar.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 5px 15px;
            background: var(--nebula-surface, #2a2a2a);
            border-top: 1px solid var(--nebula-border, #444);
            font-size: 12px;
            color: var(--nebula-text-secondary, #9ca3af);
            flex-shrink: 0;
        `;
        
        statusBar.innerHTML = `
            <span class="media-info" id="media-info">Loading...</span>
            <span class="media-path" id="media-path">${this.filepath}</span>
        `;
        
        return statusBar;
    }
    
    /**
     * Setup control event listeners
     */
    setupControlListeners(controls) {
        const playPauseBtn = controls.querySelector('#play-pause');
        const stopBtn = controls.querySelector('#stop');
        const muteBtn = controls.querySelector('#mute');
        const progressSlider = controls.querySelector('#progress');
        const volumeSlider = controls.querySelector('#volume');
        const fullscreenBtn = controls.querySelector('#fullscreen');
        
        playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        stopBtn.addEventListener('click', () => this.stop());
        muteBtn.addEventListener('click', () => this.toggleMute());
        
        progressSlider.addEventListener('input', (e) => {
            if (this.mediaElement && this.duration > 0) {
                const time = (e.target.value / 100) * this.duration;
                this.mediaElement.currentTime = time;
            }
        });
        
        volumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            this.setVolume(volume);
        });
        
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        }
    }
    
    /**
     * Load and setup media
     */
    async loadMedia() {
        const mediaInfo = document.getElementById('media-info');
        
        try {
            // For now, we'll create a placeholder since we don't have real file system access
            // In a real implementation, this would load the actual media file
            this.mediaElement.src = this.createPlaceholderMedia();
            
            // Setup media event listeners
            this.mediaElement.addEventListener('loadedmetadata', () => {
                this.duration = this.mediaElement.duration;
                this.updateDurationDisplay();
                mediaInfo.textContent = `${this.mediaType.toUpperCase()} • ${this.formatTime(this.duration)}`;
            });
            
            this.mediaElement.addEventListener('timeupdate', () => {
                this.currentTime = this.mediaElement.currentTime;
                this.updateProgress();
                this.updateCurrentTimeDisplay();
                this.updateWaveform();
            });
            
            this.mediaElement.addEventListener('ended', () => {
                this.isPlaying = false;
                this.updatePlayPauseButton();
            });
            
            this.mediaElement.addEventListener('error', (e) => {
                console.error('Media error:', e);
                mediaInfo.textContent = 'Error loading media';
            });
            
        } catch (error) {
            console.error('Error loading media:', error);
            mediaInfo.textContent = 'Error loading media';
        }
    }
    
    /**
     * Create placeholder media (for demo purposes)
     */
    createPlaceholderMedia() {
        // Create a simple audio tone or video for demonstration
        if (this.mediaType === 'audio') {
            // Create a simple audio tone using Web Audio API
            return this.createAudioTone();
        } else {
            // For video, we could create a canvas-based video or use a placeholder
            return 'data:video/mp4;base64,'; // Empty video data
        }
    }
    
    /**
     * Create a simple audio tone for demonstration
     */
    createAudioTone() {
        // This would create a simple audio tone
        // For now, return empty data URL
        return 'data:audio/wav;base64,';
    }
    
    /**
     * Toggle play/pause
     */
    togglePlayPause() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }
    
    /**
     * Play media
     */
    play() {
        if (this.mediaElement) {
            this.mediaElement.play().then(() => {
                this.isPlaying = true;
                this.updatePlayPauseButton();
            }).catch(error => {
                console.error('Error playing media:', error);
            });
        }
    }
    
    /**
     * Pause media
     */
    pause() {
        if (this.mediaElement) {
            this.mediaElement.pause();
            this.isPlaying = false;
            this.updatePlayPauseButton();
        }
    }
    
    /**
     * Stop media
     */
    stop() {
        if (this.mediaElement) {
            this.mediaElement.pause();
            this.mediaElement.currentTime = 0;
            this.isPlaying = false;
            this.updatePlayPauseButton();
            this.updateProgress();
            this.updateCurrentTimeDisplay();
        }
    }
    
    /**
     * Toggle mute
     */
    toggleMute() {
        if (this.mediaElement) {
            this.isMuted = !this.isMuted;
            this.mediaElement.muted = this.isMuted;
            this.updateMuteButton();
        }
    }
    
    /**
     * Set volume
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.mediaElement) {
            this.mediaElement.volume = this.volume;
        }
    }
    
    /**
     * Toggle fullscreen (video only)
     */
    toggleFullscreen() {
        if (this.mediaType !== 'video') return;
        
        if (!this.isFullscreen) {
            if (this.mediaElement.requestFullscreen) {
                this.mediaElement.requestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
        this.isFullscreen = !this.isFullscreen;
    }
    
    /**
     * Update play/pause button
     */
    updatePlayPauseButton() {
        const playPauseBtn = document.querySelector('#play-pause span');
        if (playPauseBtn) {
            playPauseBtn.textContent = this.isPlaying ? 'pause' : 'play_arrow';
        }
    }
    
    /**
     * Update mute button
     */
    updateMuteButton() {
        const muteBtn = document.querySelector('#mute span');
        if (muteBtn) {
            muteBtn.textContent = this.isMuted ? 'volume_off' : 'volume_up';
        }
    }
    
    /**
     * Update progress slider
     */
    updateProgress() {
        const progressSlider = document.querySelector('#progress');
        if (progressSlider && this.duration > 0) {
            const progress = (this.currentTime / this.duration) * 100;
            progressSlider.value = progress;
        }
    }
    
    /**
     * Update current time display
     */
    updateCurrentTimeDisplay() {
        const currentTimeDisplay = document.querySelector('#current-time');
        if (currentTimeDisplay) {
            currentTimeDisplay.textContent = this.formatTime(this.currentTime);
        }
    }
    
    /**
     * Update duration display
     */
    updateDurationDisplay() {
        const durationDisplay = document.querySelector('#duration');
        if (durationDisplay) {
            durationDisplay.textContent = this.formatTime(this.duration);
        }
    }
    
    /**
     * Update audio waveform visualization
     */
    updateWaveform() {
        if (this.mediaType === 'audio') {
            const waveformProgress = document.querySelector('.waveform-progress');
            if (waveformProgress && this.duration > 0) {
                const progress = (this.currentTime / this.duration) * 100;
                waveformProgress.style.width = `${progress}%`;
            }
        }
    }
    
    /**
     * Format time in MM:SS format
     */
    formatTime(seconds) {
        if (isNaN(seconds) || seconds < 0) return '0:00';
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    /**
     * Get window title
     */
    getTitle() {
        return `${this.mediaType === 'video' ? 'Video' : 'Audio'} Player - ${this.filename}`;
    }
    
    /**
     * Get window icon
     */
    getIcon() {
        return this.mediaType === 'video' ? '🎬' : '🎵';
    }
    
    /**
     * Cleanup when window is closed
     */
    cleanup() {
        console.log('Media player cleanup');
        if (this.mediaElement) {
            this.mediaElement.pause();
            this.mediaElement.src = '';
        }
    }
}

// Make MediaPlayer available globally
window.MediaPlayer = MediaPlayer;

