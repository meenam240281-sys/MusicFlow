/**
 * Embed Manager for FocusFlow
 * Handles music platform embeds and playback control
 */

const EmbedManager = {
    // Player instances
    youtubePlayer: null,
    spotifyPlayer: null,
    
    // Current state
    currentSource: null,
    currentUrl: null,
    isPlaying: false,
    currentVolume: 70,
    fadeInterval: null,
    
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
            console.log('YouTube API ready');
        };
    },
    
    // Set music source
    setMusicSource(source, url = null) {
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
        const placeholder = document.getElementById('player-placeholder');
        
        if (!container) return;
        
        // Clear container
        container.innerHTML = '';
        
        if (source === 'manual') {
            // For manual control, just show instructions
            container.innerHTML = `
                <div class="player-placeholder">
                    <i class="fas fa-headphones"></i>
                    <h3>Manual Music Control</h3>
                    <p>Start playing music on your device, then use the session controls below.</p>
                    <p class="small-note">Volume control will affect system volume if supported by your browser.</p>
                </div>
            `;
            return;
        }
        
        if (source === 'apple') {
            // For Apple Music, show external link
            container.innerHTML = `
                <div class="player-placeholder">
                    <i class="fab fa-apple"></i>
                    <h3>Apple Music</h3>
                    <p>Open Apple Music in a new tab to play your music.</p>
                    ${url ? `<a href="${url}" target="_blank" class="btn-primary" style="margin-top: 1rem;">Open Apple Music</a>` : ''}
                    <p class="small-note">Music controls will not be available in this app.</p>
                </div>
            `;
            return;
        }
        
        if (source === 'spotify' && url) {
            // Create Spotify embed
            this.createSpotifyEmbed(container, url);
            return;
        }
        
        if (source === 'youtube' && url) {
            // Create YouTube embed
            this.createYouTubeEmbed(container, url);
            return;
        }
        
        // Fallback to placeholder
        if (placeholder) {
            placeholder.classList.remove('hidden');
            container.appendChild(placeholder);
        }
    },
    
    // Create Spotify embed
    createSpotifyEmbed(container, url) {
        // Extract track/playlist ID from URL
        let embedUrl = '';
        
        if (url.includes('track/')) {
            const trackId = url.split('track/')[1]?.split('?')[0];
            if (trackId) {
                embedUrl = `https://open.spotify.com/embed/track/${trackId}`;
            }
        } else if (url.includes('playlist/')) {
            const playlistId = url.split('playlist/')[1]?.split('?')[0];
            if (playlistId) {
                embedUrl = `https://open.spotify.com/embed/playlist/${playlistId}`;
            }
        } else if (url.includes('album/')) {
            const albumId = url.split('album/')[1]?.split('?')[0];
            if (albumId) {
                embedUrl = `https://open.spotify.com/embed/album/${albumId}`;
            }
        }
        
        if (!embedUrl) {
            container.innerHTML = `
                <div class="player-placeholder">
                    <i class="fab fa-spotify"></i>
                    <h3>Invalid Spotify URL</h3>
                    <p>Please enter a valid Spotify track, playlist, or album URL.</p>
                </div>
            `;
            return;
        }
        
        // Create iframe
        const iframe = document.createElement('iframe');
        iframe.src = embedUrl;
        iframe.width = '100%';
        iframe.height = '200';
        iframe.frameBorder = '0';
        iframe.allowTransparency = 'true';
        iframe.allow = 'encrypted-media';
        iframe.style.borderRadius = 'var(--radius-lg)';
        iframe.title = 'Spotify Player';
        
        container.appendChild(iframe);
        
        // Note: Spotify embed doesn't provide full control via JS
        // We'll rely on the embed's built-in controls
    },
    
    // Create YouTube embed
    createYouTubeEmbed(container, url) {
        // Extract video ID from URL
        let videoId = '';
        
        if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1]?.split('?')[0];
        } else if (url.includes('youtube.com/watch?v=')) {
            videoId = url.split('v=')[1]?.split('&')[0];
        } else if (url.includes('youtube.com/embed/')) {
            videoId = url.split('embed/')[1]?.split('?')[0];
        } else if (url.includes('youtube.com/playlist?list=')) {
            const playlistId = url.split('list=')[1]?.split('&')[0];
            if (playlistId) {
                this.createYouTubePlaylistEmbed(container, playlistId);
                return;
            }
        }
        
        if (!videoId) {
            container.innerHTML = `
                <div class="player-placeholder">
                    <i class="fab fa-youtube"></i>
                    <h3>Invalid YouTube URL</h3>
                    <p>Please enter a valid YouTube video or playlist URL.</p>
                </div>
            `;
            return;
        }
        
        // Create player div
        const playerDiv = document.createElement('div');
        playerDiv.id = 'youtube-player';
        playerDiv.style.width = '100%';
        playerDiv.style.height = '200px';
        playerDiv.style.borderRadius = 'var(--radius-lg)';
        playerDiv.style.overflow = 'hidden';
        
        container.appendChild(playerDiv);
        
        // Wait for YouTube API to be ready
        const checkInterval = setInterval(() => {
            if (this.youtubeAPIReady || window.YT) {
                clearInterval(checkInterval);
                this.initializeYouTubePlayer(videoId);
            }
        }, 100);
    },
    
    // Initialize YouTube player
    initializeYouTubePlayer(videoId) {
        // Check if player already exists
        if (this.youtubePlayer) {
            this.youtubePlayer.destroy();
        }
        
        this.youtubePlayer = new YT.Player('youtube-player', {
            height: '200',
            width: '100%',
            videoId: videoId,
            playerVars: {
                'autoplay': 0,
                'controls': 1,
                'disablekb': 0,
                'enablejsapi': 1,
                'fs': 0,
                'iv_load_policy': 3,
                'modestbranding': 1,
                'playsinline': 1,
                'rel': 0
            },
            events: {
                'onReady': this.onYouTubePlayerReady.bind(this),
                'onStateChange': this.onYouTubePlayerStateChange.bind(this)
            }
        });
    },
    
    // Create YouTube playlist embed
    createYouTubePlaylistEmbed(container, playlistId) {
        const embedUrl = `https://www.youtube.com/embed/videoseries?list=${playlistId}`;
        
        const iframe = document.createElement('iframe');
        iframe.src = embedUrl;
        iframe.width = '100%';
        iframe.height = '200';
        iframe.frameBorder = '0';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        iframe.style.borderRadius = 'var(--radius-lg)';
        iframe.title = 'YouTube Playlist';
        
        container.appendChild(iframe);
        
        // Note: Playlist embed doesn't provide full JS API control
    },
    
    // YouTube player ready callback
    onYouTubePlayerReady(event) {
        console.log('YouTube player ready');
        // Set initial volume
        if (this.youtubePlayer && this.youtubePlayer.setVolume) {
            this.youtubePlayer.setVolume(this.currentVolume);
        }
    },
    
    // YouTube player state change callback
    onYouTubePlayerStateChange(event) {
        // Update playing state
        this.isPlaying = event.data === YT.PlayerState.PLAYING;
    },
    
    // Play music
    play() {
        if (this.currentSource === 'youtube' && this.youtubePlayer) {
            this.youtubePlayer.playVideo();
            this.isPlaying = true;
        }
        // Note: Spotify and Apple Music embeds don't support JS control for play
    },
    
    // Pause music
    pause() {
        if (this.currentSource === 'youtube' && this.youtubePlayer) {
            this.youtubePlayer.pauseVideo();
            this.isPlaying = false;
        }
    },
    
    // Stop music with fadeout
    stop(fadeDuration = 5) {
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
        
        this.fadeInterval = setInterval(() => {
            currentStep++;
            const newVolume = Math.max(0, startVolume - (startVolume * (currentStep / fadeSteps)));
            this.setVolume(Math.floor(newVolume));
            
            if (currentStep >= fadeSteps) {
                clearInterval(this.fadeInterval);
                this.fadeInterval = null;
                this.pause();
                
                // Reset volume after fadeout
                setTimeout(() => {
                    this.setVolume(startVolume);
                }, 500);
            }
        }, stepDuration);
    },
    
    // Set volume
    setVolume(volume) {
        this.currentVolume = Math.max(0, Math.min(100, volume));
        
        // Update YouTube player
        if (this.currentSource === 'youtube' && this.youtubePlayer && this.youtubePlayer.setVolume) {
            this.youtubePlayer.setVolume(this.currentVolume);
        }
        
        // Update system volume (if supported)
        this.setSystemVolume(this.currentVolume / 100);
        
        // Update UI
        this.updateVolumeDisplay();
        
        // Save to storage
        StorageManager.saveVolume(this.currentVolume);
    },
    
    // Set system volume (for manual/Apple Music)
    setSystemVolume(volume) {
        // Create an audio element for system volume control
        // This only works for audio we control, not external tabs
        const audioElements = document.querySelectorAll('audio, video');
        audioElements.forEach(element => {
            element.volume = volume;
        });
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
    },
    
    // Get current state
    getState() {
        return {
            source: this.currentSource,
            url: this.currentUrl,
            isPlaying: this.isPlaying,
            volume: this.currentVolume
        };
    },
    
    // Clean up
    destroy() {
        this.clearPlayer();
    }
};
