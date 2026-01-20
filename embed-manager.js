/**
 * Embed Manager for FocusFlow
 * Handles music platform embeds and playback control with proper fixes
 */

const EmbedManager = {
    // Player instances
    youtubePlayer: null,
    spotifyIframe: null,
    
    // Current state
    currentSource: null,
    currentUrl: null,
    isPlaying: false,
    currentVolume: 70,
    fadeInterval: null,
    manualAudioElement: null,
    
    // YouTube API ready flag
    youtubeAPIReady: false,
    
    // Initialize
    initialize() {
        // Load saved volume
        this.currentVolume = StorageManager.getVolume();
        this.updateVolumeDisplay();
        
        // Setup volume slider
        const volumeSlider = document.getElementById('volume-slider');
        if (volumeSlider) {
            volumeSlider.value = this.currentVolume;
            volumeSlider.addEventListener('input', (e) => {
                this.setVolume(parseInt(e.target.value, 10));
            });
        }
        
        // Listen for YouTube API ready
        window.onYouTubeIframeAPIReady = () => {
            this.youtubeAPIReady = true;
            console.log('FocusFlow: YouTube API ready');
        };
        
        // Initialize manual audio element for system volume control
        this.manualAudioElement = new Audio();
        this.manualAudioElement.volume = this.currentVolume / 100;
        
        console.log('FocusFlow: Embed Manager initialized');
    },
    
    // Set music source
    setMusicSource(source, url = null) {
        console.log(`FocusFlow: Setting music source to ${source}`, url);
        
        this.currentSource = source;
        this.currentUrl = url;
        
        // Clear any existing player
        this.clearPlayer();
        
        // Update UI based on source
        this.updatePlayerContainer(source, url);
        
        // Save to storage
        StorageManager.saveMusicSource({ source, url });
        
        return true;
    },
    
    // Update player container based on source
    updatePlayerContainer(source, url) {
        const container = document.getElementById('player-container');
        
        if (!container) return;
        
        // Clear container
        container.innerHTML = '';
        
        switch (source) {
            case 'manual':
                this.createManualPlayer(container);
                break;
                
            case 'apple':
                this.createAppleMusicPlayer(container, url);
                break;
                
            case 'spotify':
                this.createSpotifyPlayer(container, url);
                break;
                
            case 'youtube':
                this.createYouTubePlayer(container, url);
                break;
                
            default:
                this.createPlaceholderPlayer(container);
        }
    },
    
    // Create manual player with instructions
    createManualPlayer(container) {
        container.innerHTML = `
            <div class="player-instructions">
                <div class="instructions-header">
                    <i class="fas fa-headphones"></i>
                    <h3>Manual Music Control</h3>
                </div>
                <div class="instructions-content">
                    <p><strong>How to use:</strong></p>
                    <ol>
                        <li>Open Spotify, Apple Music, YouTube, or any music app on your device</li>
                        <li>Start playing your music in that app</li>
                        <li>Return to FocusFlow and start your session</li>
                        <li>Use the volume control below to adjust your system volume</li>
                    </ol>
                    <div class="instruction-note">
                        <i class="fas fa-info-circle"></i>
                        <p>Volume control works with system audio. Some browsers may have limitations.</p>
                    </div>
                </div>
                <div class="player-controls">
                    <button class="btn-secondary" id="test-volume-btn">
                        <i class="fas fa-volume-up"></i> Test Volume
                    </button>
                </div>
            </div>
        `;
        
        // Add test volume button listener
        const testBtn = document.getElementById('test-volume-btn');
        if (testBtn) {
            testBtn.addEventListener('click', () => this.testVolume());
        }
    },
    
    // Create Apple Music player
    createAppleMusicPlayer(container, url) {
        const appleMusicUrl = url || 'https://music.apple.com';
        
        container.innerHTML = `
            <div class="player-instructions">
                <div class="instructions-header">
                    <i class="fab fa-apple"></i>
                    <h3>Apple Music</h3>
                </div>
                <div class="instructions-content">
                    <p><strong>How to use:</strong></p>
                    <ol>
                        <li>Click the button below to open Apple Music</li>
                        <li>Log in to your Apple Music account if needed</li>
                        <li>Start playing your music in the new tab</li>
                        <li>Return to FocusFlow and start your session</li>
                    </ol>
                    <div class="instruction-note">
                        <i class="fas fa-external-link-alt"></i>
                        <p>Apple Music will open in a new tab. Keep it playing in the background.</p>
                    </div>
                </div>
                <div class="player-controls">
                    <a href="${appleMusicUrl}" target="_blank" class="btn-primary">
                        <i class="fab fa-apple"></i> Open Apple Music
                    </a>
                    <button class="btn-secondary" id="test-volume-btn">
                        <i class="fas fa-volume-up"></i> Test Volume
                    </button>
                </div>
            </div>
        `;
        
        // Add test volume button listener
        const testBtn = document.getElementById('test-volume-btn');
        if (testBtn) {
            testBtn.addEventListener('click', () => this.testVolume());
        }
    },
    
    // Create Spotify player with proper embed
    createSpotifyPlayer(container, url) {
        if (!url || !this.validateSpotifyUrl(url)) {
            container.innerHTML = `
                <div class="player-error">
                    <i class="fab fa-spotify"></i>
                    <h3>Invalid Spotify URL</h3>
                    <p>Please enter a valid Spotify track, playlist, or album URL.</p>
                    <p class="small-note">Example: https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M</p>
                </div>
            `;
            return;
        }
        
        // Extract Spotify URI
        const spotifyUri = this.extractSpotifyUri(url);
        if (!spotifyUri) {
            container.innerHTML = `
                <div class="player-error">
                    <i class="fab fa-spotify"></i>
                    <h3>Invalid Spotify URL</h3>
                    <p>Could not extract Spotify URI from the URL.</p>
                </div>
            `;
            return;
        }
        
        const embedUrl = `https://open.spotify.com/embed/${spotifyUri}`;
        
        container.innerHTML = `
            <div class="player-instructions">
                <div class="instructions-header">
                    <i class="fab fa-spotify"></i>
                    <h3>Spotify Player</h3>
                </div>
                <div class="instructions-content">
                    <p><strong>Important:</strong> Spotify requires manual play initiation due to browser restrictions.</p>
                    <ol>
                        <li>Click the play button in the Spotify player below</li>
                        <li>You may need to log in to your Spotify account</li>
                        <li>Once music is playing, start your focus session</li>
                    </ol>
                    <div class="instruction-note warning">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Autoplay is blocked by browsers. You must manually click play in the Spotify widget.</p>
                    </div>
                </div>
            </div>
            <div class="spotify-embed-container">
                <iframe 
                    id="spotify-iframe"
                    src="${embedUrl}?utm_source=generator&theme=0"
                    width="100%" 
                    height="200" 
                    frameBorder="0" 
                    allowfullscreen="" 
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                    loading="lazy"
                    title="Spotify Player"
                    style="border-radius: 12px;">
                </iframe>
            </div>
            <div class="player-controls">
                <button class="btn-secondary" id="refresh-spotify-btn">
                    <i class="fas fa-redo"></i> Refresh Player
                </button>
                <button class="btn-secondary" id="test-volume-btn">
                    <i class="fas fa-volume-up"></i> Test Volume
                </button>
            </div>
        `;
        
        this.spotifyIframe = document.getElementById('spotify-iframe');
        
        // Add refresh button listener
        const refreshBtn = document.getElementById('refresh-spotify-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                if (this.spotifyIframe) {
                    this.spotifyIframe.src = this.spotifyIframe.src;
                }
            });
        }
        
        // Add test volume button listener
        const testBtn = document.getElementById('test-volume-btn');
        if (testBtn) {
            testBtn.addEventListener('click', () => this.testVolume());
        }
    },
    
    // Create YouTube player
    createYouTubePlayer(container, url) {
        if (!url || !this.validateYouTubeUrl(url)) {
            container.innerHTML = `
                <div class="player-error">
                    <i class="fab fa-youtube"></i>
                    <h3>Invalid YouTube URL</h3>
                    <p>Please enter a valid YouTube video or playlist URL.</p>
                    <p class="small-note">Example: https://www.youtube.com/watch?v=dQw4w9WgXcQ</p>
                </div>
            `;
            return;
        }
        
        // Extract video ID
        const videoId = this.extractYouTubeVideoId(url);
        const isPlaylist = url.includes('list=');
        
        container.innerHTML = `
            <div class="player-instructions">
                <div class="instructions-header">
                    <i class="fab fa-youtube"></i>
                    <h3>YouTube Player</h3>
                </div>
                <div class="instructions-content">
                    <p><strong>Note:</strong> YouTube autoplay may be restricted in some browsers.</p>
                    <ol>
                        <li>Wait for the player to load below</li>
                        <li>Click play in the YouTube player if needed</li>
                        <li>Start your focus session when ready</li>
                    </ol>
                </div>
            </div>
            <div id="youtube-player-container" style="width: 100%; height: 200px; border-radius: 12px; overflow: hidden; background: #000;">
                <!-- YouTube player will be loaded here -->
            </div>
            <div class="player-controls">
                <button class="btn-secondary" id="load-youtube-btn">
                    <i class="fas fa-play-circle"></i> Load YouTube Player
                </button>
                <button class="btn-secondary" id="test-volume-btn">
                    <i class="fas fa-volume-up"></i> Test Volume
                </button>
            </div>
        `;
        
        // Add load button listener
        const loadBtn = document.getElementById('load-youtube-btn');
        if (loadBtn) {
            loadBtn.addEventListener('click', () => {
                this.loadYouTubePlayer(videoId, isPlaylist ? url : null);
                loadBtn.disabled = true;
                loadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
            });
        }
        
        // Add test volume button listener
        const testBtn = document.getElementById('test-volume-btn');
        if (testBtn) {
            testBtn.addEventListener('click', () => this.testVolume());
        }
        
        // Auto-load YouTube player after a short delay
        setTimeout(() => {
            if (loadBtn && !loadBtn.disabled) {
                loadBtn.click();
            }
        }, 500);
    },
    
    // Create placeholder player
    createPlaceholderPlayer(container) {
        container.innerHTML = `
            <div class="player-placeholder">
                <i class="fas fa-music"></i>
                <h3>No Music Source Selected</h3>
                <p>Please select a music source in Step 1 to continue.</p>
            </div>
        `;
    },
    
    // Load YouTube player
    loadYouTubePlayer(videoId, playlistUrl = null) {
        const container = document.getElementById('youtube-player-container');
        if (!container) return;
        
        if (this.youtubePlayer) {
            this.youtubePlayer.destroy();
            this.youtubePlayer = null;
        }
        
        let playerVars = {
            'autoplay': 0,
            'controls': 1,
            'disablekb': 0,
            'enablejsapi': 1,
            'fs': 0,
            'iv_load_policy': 3,
            'modestbranding': 1,
            'playsinline': 1,
            'rel': 0,
            'showinfo': 0
        };
        
        // Check if YouTube API is already loaded
        if (!window.YT) {
            console.log('FocusFlow: Loading YouTube API');
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
            
            // Set up callback for when API loads
            window.onYouTubeIframeAPIReady = () => {
                this.createYouTubePlayerInstance(videoId, playerVars, playlistUrl);
            };
        } else {
            this.createYouTubePlayerInstance(videoId, playerVars, playlistUrl);
        }
    },
    
    // Create YouTube player instance
    createYouTubePlayerInstance(videoId, playerVars, playlistUrl = null) {
        const container = document.getElementById('youtube-player-container');
        if (!container) return;
        
        if (playlistUrl) {
            // For playlists, use playlist parameter
            playerVars.listType = 'playlist';
            playerVars.list = this.extractYouTubePlaylistId(playlistUrl);
            videoId = undefined;
        }
        
        this.youtubePlayer = new YT.Player('youtube-player-container', {
            height: '200',
            width: '100%',
            videoId: videoId,
            playerVars: playerVars,
            events: {
                'onReady': this.onYouTubePlayerReady.bind(this),
                'onStateChange': this.onYouTubePlayerStateChange.bind(this),
                'onError': this.onYouTubePlayerError.bind(this)
            }
        });
    },
    
    // YouTube player ready callback
    onYouTubePlayerReady(event) {
        console.log('FocusFlow: YouTube player ready');
        // Set initial volume
        if (this.youtubePlayer && this.youtubePlayer.setVolume) {
            this.youtubePlayer.setVolume(this.currentVolume);
        }
        
        // Update load button
        const loadBtn = document.getElementById('load-youtube-btn');
        if (loadBtn) {
            loadBtn.innerHTML = '<i class="fas fa-check-circle"></i> Player Loaded';
            loadBtn.classList.add('success');
        }
    },
    
    // YouTube player state change callback
    onYouTubePlayerStateChange(event) {
        // Update playing state
        this.isPlaying = event.data === YT.PlayerState.PLAYING;
        console.log('FocusFlow: YouTube player state:', this.isPlaying ? 'Playing' : 'Paused');
    },
    
    // YouTube player error callback
    onYouTubePlayerError(event) {
        console.error('FocusFlow: YouTube player error:', event.data);
        const container = document.getElementById('youtube-player-container');
        if (container) {
            container.innerHTML = `
                <div class="player-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>YouTube Player Error</h3>
                    <p>Failed to load YouTube player. Please check your URL and try again.</p>
                    <button class="btn-secondary" id="retry-youtube-btn">
                        <i class="fas fa-redo"></i> Retry
                    </button>
                </div>
            `;
            
            const retryBtn = document.getElementById('retry-youtube-btn');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => {
                    window.location.reload();
                });
            }
        }
    },
    
    // Play music
    play() {
        console.log('FocusFlow: Play requested for source:', this.currentSource);
        
        switch (this.currentSource) {
            case 'youtube':
                if (this.youtubePlayer && this.youtubePlayer.playVideo) {
                    this.youtubePlayer.playVideo();
                    this.isPlaying = true;
                } else {
                    console.warn('FocusFlow: YouTube player not ready');
                }
                break;
                
            case 'spotify':
                // Spotify embed cannot be controlled via JavaScript due to security restrictions
                console.warn('FocusFlow: Spotify cannot be controlled programmatically. User must click play in the embed.');
                break;
                
            default:
                console.log('FocusFlow: Manual/Apple Music - cannot control playback programmatically');
        }
    },
    
    // Pause music
    pause() {
        console.log('FocusFlow: Pause requested for source:', this.currentSource);
        
        switch (this.currentSource) {
            case 'youtube':
                if (this.youtubePlayer && this.youtubePlayer.pauseVideo) {
                    this.youtubePlayer.pauseVideo();
                    this.isPlaying = false;
                }
                break;
                
            default:
                console.log('FocusFlow: Manual/Apple Music/Spotify - cannot control pause programmatically');
        }
    },
    
    // Stop music with fadeout
    stop(fadeDuration = 5) {
        console.log('FocusFlow: Stop requested with fade duration:', fadeDuration);
        
        if (fadeDuration <= 0) {
            this.pause();
            return;
        }
        
        // Start fadeout
        this.startFadeOut(fadeDuration);
    },
    
    // Start fadeout effect
    startFadeOut(duration) {
        if (this.fadeInterval) {
            clearInterval(this.fadeInterval);
        }
        
        const startVolume = this.currentVolume;
        const fadeSteps = 20; // Steps for fadeout
        const stepDuration = (duration * 1000) / fadeSteps;
        let currentStep = 0;
        
        console.log('FocusFlow: Starting fadeout from volume', startVolume);
        
        this.fadeInterval = setInterval(() => {
            currentStep++;
            const newVolume = Math.max(0, startVolume - (startVolume * (currentStep / fadeSteps)));
            this.setVolume(Math.floor(newVolume), true); // Skip storage during fade
            
            if (currentStep >= fadeSteps) {
                clearInterval(this.fadeInterval);
                this.fadeInterval = null;
                this.pause();
                
                console.log('FocusFlow: Fadeout complete');
                
                // Reset volume after fadeout
                setTimeout(() => {
                    this.setVolume(startVolume);
                    console.log('FocusFlow: Volume reset to', startVolume);
                }, 500);
            }
        }, stepDuration);
    },
    
    // Set volume
    setVolume(volume, skipStorage = false) {
        const newVolume = Math.max(0, Math.min(100, volume));
        
        if (newVolume === this.currentVolume) return;
        
        this.currentVolume = newVolume;
        
        // Update YouTube player
        if (this.currentSource === 'youtube' && this.youtubePlayer && this.youtubePlayer.setVolume) {
            this.youtubePlayer.setVolume(this.currentVolume);
        }
        
        // Update manual audio element for system volume simulation
        if (this.manualAudioElement) {
            this.manualAudioElement.volume = this.currentVolume / 100;
        }
        
        // Update UI
        this.updateVolumeDisplay();
        
        // Save to storage (unless skipped during fadeout)
        if (!skipStorage) {
            StorageManager.saveVolume(this.currentVolume);
        }
        
        console.log('FocusFlow: Volume set to', this.currentVolume);
    },
    
    // Test volume with a beep
    testVolume() {
        console.log('FocusFlow: Testing volume at', this.currentVolume);
        
        // Create a test sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 440; // A4 note
        oscillator.type = 'sine';
        
        // Set volume based on current volume
        gainNode.gain.value = this.currentVolume / 100 * 0.1; // Scale down for comfort
        
        oscillator.start();
        
        // Stop after 300ms
        setTimeout(() => {
            oscillator.stop();
            audioContext.close();
        }, 300);
        
        // Visual feedback
        const volumeValue = document.getElementById('volume-value');
        if (volumeValue) {
            const originalText = volumeValue.textContent;
            volumeValue.textContent = 'Testing...';
            volumeValue.style.color = 'var(--accent-success)';
            
            setTimeout(() => {
                volumeValue.textContent = originalText;
                volumeValue.style.color = '';
            }, 500);
        }
    },
    
    // Update volume display
    updateVolumeDisplay() {
        const volumeValue = document.getElementById('volume-value');
        if (volumeValue) {
            volumeValue.textContent = `${this.currentVolume}%`;
        }
        
        const volumeSlider = document.getElementById('volume-slider');
        if (volumeSlider) {
            volumeSlider.value = this.currentVolume;
        }
    },
    
    // Clear player
    clearPlayer() {
        if (this.youtubePlayer) {
            this.youtubePlayer.destroy();
            this.youtubePlayer = null;
        }
        
        if (this.fadeInterval) {
            clearInterval(this.fadeInterval);
            this.fadeInterval = null;
        }
        
        this.isPlaying = false;
        this.spotifyIframe = null;
        
        console.log('FocusFlow: Player cleared');
    },
    
    // URL validation helpers
    validateSpotifyUrl(url) {
        const spotifyPattern = /^https?:\/\/open\.spotify\.com\/(track|playlist|album|artist)\/[a-zA-Z0-9]+(\?.*)?$/;
        return spotifyPattern.test(url);
    },
    
    validateYouTubeUrl(url) {
        const youtubePattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
        return youtubePattern.test(url);
    },
    
    extractSpotifyUri(url) {
        const patterns = [
            /open\.spotify\.com\/track\/([a-zA-Z0-9]+)/,
            /open\.spotify\.com\/playlist\/([a-zA-Z0-9]+)/,
            /open\.spotify\.com\/album\/([a-zA-Z0-9]+)/,
            /open\.spotify\.com\/artist\/([a-zA-Z0-9]+)/
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                const type = pattern.toString().includes('track') ? 'track' :
                            pattern.toString().includes('playlist') ? 'playlist' :
                            pattern.toString().includes('album') ? 'album' : 'artist';
                return `${type}/${match[1]}`;
            }
        }
        
        return null;
    },
    
    extractYouTubeVideoId(url) {
        const patterns = [
            /youtu\.be\/([a-zA-Z0-9_-]+)/,
            /youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
            /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
            /youtube\.com\/v\/([a-zA-Z0-9_-]+)/
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                return match[1];
            }
        }
        
        return null;
    },
    
    extractYouTubePlaylistId(url) {
        const match = url.match(/list=([a-zA-Z0-9_-]+)/);
        return match ? match[1] : null;
    },
    
    // Get current state
    getState() {
        return {
            source: this.currentSource,
            url: this.currentUrl,
            isPlaying: this.isPlaying,
            volume: this.currentVolume,
            canControlPlayback: this.currentSource === 'youtube'
        };
    },
    
    // Clean up
    destroy() {
        this.clearPlayer();
        if (this.manualAudioElement) {
            this.manualAudioElement.pause();
            this.manualAudioElement = null;
        }
    }
};

// Add CSS for player instructions
const style = document.createElement('style');
style.textContent = `
.player-instructions {
    background: var(--bg-card);
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-md);
    border: 1px solid var(--border-color);
}

.instructions-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
}

.instructions-header i {
    font-size: 2rem;
    color: var(--accent-primary);
}

.instructions-header h3 {
    margin: 0;
    font-size: 1.5rem;
}

.instructions-content {
    margin-bottom: var(--spacing-lg);
}

.instructions-content ol {
    margin-left: var(--spacing-lg);
    margin-bottom: var(--spacing-md);
}

.instructions-content li {
    margin-bottom: var(--spacing-sm);
    color: var(--text-secondary);
}

.instruction-note {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-sm);
    padding: var(--spacing-md);
    background: rgba(59, 130, 246, 0.1);
    border-radius: var(--radius-md);
    margin-top: var(--spacing-md);
}

.instruction-note.warning {
    background: rgba(245, 158, 11, 0.1);
}

.instruction-note i {
    color: var(--accent-primary);
    margin-top: 2px;
}

.instruction-note.warning i {
    color: var(--accent-warning);
}

.instruction-note p {
    margin: 0;
    font-size: 0.9rem;
    color: var(--text-secondary);
}

.player-controls {
    display: flex;
    gap: var(--spacing-md);
    margin-top: var(--spacing-lg);
    flex-wrap: wrap;
}

.player-controls .btn-primary,
.player-controls .btn-secondary {
    flex: 1;
    min-width: 140px;
}

.player-error {
    text-align: center;
    padding: var(--spacing-2xl);
    color: var(--text-secondary);
}

.player-error i {
    font-size: 3rem;
    color: var(--accent-danger);
    margin-bottom: var(--spacing-md);
}

.player-error h3 {
    margin-bottom: var(--spacing-md);
}

.spotify-embed-container {
    margin: var(--spacing-lg) 0;
    border-radius: 12px;
    overflow: hidden;
}

.btn-secondary.success {
    background-color: var(--accent-success);
    border-color: var(--accent-success);
    color: white;
}

.small-note {
    font-size: 0.85rem;
    color: var(--text-muted);
    margin-top: var(--spacing-sm);
}

.player-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 200px;
    color: var(--text-muted);
    text-align: center;
}

.player-placeholder i {
    font-size: 3rem;
    margin-bottom: var(--spacing-md);
    color: var(--bg-tertiary);
}
`;
document.head.appendChild(style);
