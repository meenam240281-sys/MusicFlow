/**
 * Main Application Controller for FocusFlow
 * Orchestrates all components and manages UI flow
 */

class FocusFlowApp {
    constructor() {
        // App state
        this.currentStep = 1;
        this.selectedMusicSource = null;
        this.selectedFocusTemplate = null;
        this.selectedTimerMode = 'timer'; // 'timer' or 'skip'
        this.timerDuration = 1500; // 25 minutes in seconds
        this.pomodoroEnabled = false;
        
        // UI elements
        this.stepElements = {};
        this.progressSteps = [];
        
        // Initialize
        this.initialize();
    }

    initialize() {
        // Cache DOM elements
        this.cacheElements();
        
        // Initialize components
        TemplateManager.renderTemplates('.focus-templates');
        EmbedManager.initialize();
        
        // Load saved preferences
        this.loadSavedPreferences();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Show first step
        this.showStep(1);
    }

    cacheElements() {
        // Step containers
        this.stepElements = {
            1: document.getElementById('step-music'),
            2: document.getElementById('step-focus'),
            3: document.getElementById('step-timer'),
            4: document.getElementById('step-session')
        };
        
        // Progress steps
        this.progressSteps = document.querySelectorAll('.progress-indicator .step');
        
        // Navigation buttons
        this.navButtons = {
            nextFromMusic: document.getElementById('next-from-music'),
            nextFromFocus: document.getElementById('next-from-focus'),
            nextFromTimer: document.getElementById('next-from-timer'),
            backToMusic: document.getElementById('back-to-music'),
            backToFocus: document.getElementById('back-to-focus'),
            backToTimer: document.getElementById('back-to-timer')
        };
        
        // Music source elements
        this.musicSourceCards = document.querySelectorAll('.source-card');
        this.spotifyInput = document.getElementById('spotify-input');
        this.youtubeInput = document.getElementById('youtube-input');
        this.spotifyConnectBtn = document.getElementById('spotify-connect');
        this.youtubeConnectBtn = document.getElementById('youtube-connect');
        this.appleConnectBtn = document.getElementById('apple-connect');
        
        // Timer elements
        this.timerHours = document.getElementById('hours');
        this.timerMinutes = document.getElementById('minutes');
        this.timerSeconds = document.getElementById('seconds');
        this.quickTimeButtons = document.querySelectorAll('.quick-time-btn');
        this.skipTimerBtn = document.getElementById('skip-timer-btn');
        this.customTimerOption = document.getElementById('custom-timer-option');
        this.skipTimerOption = document.getElementById('skip-timer-option');
        
        // Pomodoro elements
        this.pomodoroToggle = document.getElementById('pomodoro-toggle');
        this.pomodoroSettings = document.querySelector('.pomodoro-settings');
        this.focusDurationInput = document.getElementById('focus-duration');
        this.breakDurationInput = document.getElementById('break-duration');
        this.cyclesInput = document.getElementById('cycles');
        
        // Session elements
        this.startSessionBtn = document.getElementById('start-session');
        this.pauseSessionBtn = document.getElementById('pause-session');
        this.stopSessionBtn = document.getElementById('stop-session');
        this.sessionCompleteBtn = document.getElementById('session-complete-btn');
        this.currentMusicSourceEl = document.getElementById('current-music-source');
        this.currentFocusTemplateEl = document.getElementById('current-focus-template');
        this.currentTimerModeEl = document.getElementById('current-timer-mode');
        this.sessionDescription = document.getElementById('session-description');
        
        // Modal elements
        this.completionModal = document.getElementById('completion-modal');
        this.sessionDurationEl = document.getElementById('session-duration');
        this.newSessionBtn = document.getElementById('new-session-btn');
        this.closeModalBtn = document.getElementById('close-modal-btn');
    }

    loadSavedPreferences() {
        const prefs = StorageManager.loadAllPreferences();
        
        // Load music source
        if (prefs.musicSource) {
            this.selectedMusicSource = prefs.musicSource.source;
            this.selectMusicSource(this.selectedMusicSource, prefs.musicSource.url);
        }
        
        // Load focus template
        if (prefs.focusTemplate) {
            this.selectFocusTemplate(prefs.focusTemplate);
        }
        
        // Load timer mode and duration
        this.selectedTimerMode = prefs.timerMode;
        this.timerDuration = prefs.timerDuration;
        
        // Load Pomodoro settings
        this.pomodoroEnabled = prefs.pomodoroSettings.enabled;
        if (this.pomodoroToggle) {
            this.pomodoroToggle.checked = this.pomodoroEnabled;
            this.togglePomodoroSettings(this.pomodoroEnabled);
        }
        
        if (this.focusDurationInput) {
            this.focusDurationInput.value = prefs.pomodoroSettings.focusDuration;
        }
        
        if (this.breakDurationInput) {
            this.breakDurationInput.value = prefs.pomodoroSettings.breakDuration;
        }
        
        if (this.cyclesInput) {
            this.cyclesInput.value = prefs.pomodoroSettings.cycles;
        }
        
        // Update timer inputs with saved duration
        this.updateTimerInputsFromSeconds(this.timerDuration);
    }

    setupEventListeners() {
        // Music source selection
        this.musicSourceCards.forEach(card => {
            card.addEventListener('click', (e) => {
                const source = card.dataset.source;
                this.selectMusicSource(source);
            });
        });
        
        // Music source connection buttons
        if (this.spotifyConnectBtn) {
            this.spotifyConnectBtn.addEventListener('click', () => {
                const url = this.spotifyInput.value.trim();
                if (this.validateSpotifyUrl(url)) {
                    this.selectMusicSource('spotify', url);
                } else {
                    alert('Please enter a valid Spotify URL (track, playlist, or album)');
                }
            });
        }
        
        if (this.youtubeConnectBtn) {
            this.youtubeConnectBtn.addEventListener('click', () => {
                const url = this.youtubeInput.value.trim();
                if (this.validateYouTubeUrl(url)) {
                    this.selectMusicSource('youtube', url);
                } else {
                    alert('Please enter a valid YouTube URL (video or playlist)');
                }
            });
        }
        
        if (this.appleConnectBtn) {
            this.appleConnectBtn.addEventListener('click', () => {
                this.selectMusicSource('apple', 'https://music.apple.com');
            });
        }
        
        // Focus template selection
        document.addEventListener('click', (e) => {
            const templateCard = e.target.closest('.template-card');
            if (templateCard) {
                const templateId = templateCard.dataset.id;
                this.selectFocusTemplate(templateId);
            }
        });
        
        // Timer inputs
        if (this.timerHours) {
            this.timerHours.addEventListener('change', () => this.updateTimerDurationFromInputs());
        }
        
        if (this.timerMinutes) {
            this.timerMinutes.addEventListener('change', () => this.updateTimerDurationFromInputs());
        }
        
        if (this.timerSeconds) {
            this.timerSeconds.addEventListener('change', () => this.updateTimerDurationFromInputs());
        }
        
        // Quick time buttons
        this.quickTimeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const minutes = parseInt(btn.dataset.minutes, 10);
                this.setTimerDuration(minutes * 60);
            });
        });
        
        // Skip timer button
        if (this.skipTimerBtn) {
            this.skipTimerBtn.addEventListener('click', () => {
                this.selectTimerMode('skip');
            });
        }
        
        // Timer mode selection
        if (this.customTimerOption) {
            this.customTimerOption.addEventListener('click', () => {
                this.selectTimerMode('timer');
            });
        }
        
        if (this.skipTimerOption) {
            this.skipTimerOption.addEventListener('click', () => {
                this.selectTimerMode('skip');
            });
        }
        
        // Pomodoro toggle
        if (this.pomodoroToggle) {
            this.pomodoroToggle.addEventListener('change', (e) => {
                this.togglePomodoroSettings(e.target.checked);
            });
        }
        
        // Navigation buttons
        Object.keys(this.navButtons).forEach(key => {
            const btn = this.navButtons[key];
            if (btn) {
                btn.addEventListener('click', () => this.handleNavigation(key));
            }
        });
        
        // Session controls
        if (this.startSessionBtn) {
            this.startSessionBtn.addEventListener('click', () => this.startSession());
        }
        
        if (this.pauseSessionBtn) {
            this.pauseSessionBtn.addEventListener('click', () => this.pauseSession());
        }
        
        if (this.stopSessionBtn) {
            this.stopSessionBtn.addEventListener('click', () => this.stopSession());
        }
        
        if (this.sessionCompleteBtn) {
            this.sessionCompleteBtn.addEventListener('click', () => this.showCompletionModal());
        }
        
        // Modal buttons
        if (this.newSessionBtn) {
            this.newSessionBtn.addEventListener('click', () => this.startNewSession());
        }
        
        if (this.closeModalBtn) {
            this.closeModalBtn.addEventListener('click', () => this.closeModal());
        }
        
        // Setup timer callbacks
        focusTimer.onTick = (remainingSeconds, progress) => {
            // Update UI if needed
        };
        
        focusTimer.onComplete = () => {
            this.handleSessionComplete();
        };
        
        focusTimer.onPomodoroCycleChange = (cycle, isBreak) => {
            this.updateSessionDescription();
            
            // If it's a break, lower the volume
            if (isBreak) {
                const currentVolume = EmbedManager.getState().volume;
                EmbedManager.setVolume(Math.floor(currentVolume * 0.7)); // Reduce to 70% of current volume
            }
        };
    }

    // Step navigation
    showStep(stepNumber) {
        // Hide all steps
        Object.values(this.stepElements).forEach(el => {
            if (el) el.classList.remove('active');
        });
        
        // Show selected step
        if (this.stepElements[stepNumber]) {
            this.stepElements[stepNumber].classList.add('active');
        }
        
        // Update progress indicator
        this.progressSteps.forEach(step => {
            const stepNum = parseInt(step.dataset.step, 10);
            step.classList.toggle('active', stepNum <= stepNumber);
        });
        
        this.currentStep = stepNumber;
        
        // Update session info when showing step 4
        if (stepNumber === 4) {
            this.updateSessionInfo();
        }
    }

    handleNavigation(action) {
        switch (action) {
            case 'nextFromMusic':
                if (this.selectedMusicSource) {
                    this.showStep(2);
                }
                break;
                
            case 'nextFromFocus':
                if (this.selectedFocusTemplate) {
                    this.showStep(3);
                }
                break;
                
            case 'nextFromTimer':
                this.saveTimerSettings();
                this.showStep(4);
                break;
                
            case 'backToMusic':
                this.showStep(1);
                break;
                
            case 'backToFocus':
                this.showStep(2);
                break;
                
            case 'backToTimer':
                this.showStep(3);
                break;
        }
    }

    // Music source selection
    selectMusicSource(source, url = null) {
        // Update UI
        this.musicSourceCards.forEach(card => {
            card.classList.remove('selected');
            if (card.dataset.source === source) {
                card.classList.add('selected');
            }
        });
        
        // Show/hide input fields
        this.musicSourceCards.forEach(card => {
            const input = card.querySelector('.source-input');
            if (input) {
                if (card.dataset.source === source) {
                    input.classList.remove('hidden');
                } else {
                    input.classList.add('hidden');
                }
            }
        });
        
        // Set source in embed manager
        EmbedManager.setMusicSource(source, url);
        
        this.selectedMusicSource = source;
        
        // Enable next button
        if (this.navButtons.nextFromMusic) {
            this.navButtons.nextFromMusic.disabled = false;
        }
    }

    validateSpotifyUrl(url) {
        const spotifyPattern = /^https?:\/\/open\.spotify\.com\/(track|playlist|album|artist)\/[a-zA-Z0-9]+(\?.*)?$/;
        return spotifyPattern.test(url);
    }

    validateYouTubeUrl(url) {
        const youtubePattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
        return youtubePattern.test(url);
    }

    // Focus template selection
    selectFocusTemplate(templateId) {
        // Update UI
        document.querySelectorAll('.template-card').forEach(card => {
            card.classList.remove('selected');
            if (card.dataset.id === templateId) {
                card.classList.add('selected');
            }
        });
        
        this.selectedFocusTemplate = templateId;
        
        // Save to storage
        StorageManager.saveFocusTemplate(templateId);
        
        // Enable next button
        if (this.navButtons.nextFromFocus) {
            this.navButtons.nextFromFocus.disabled = false;
        }
    }

    // Timer management
    selectTimerMode(mode) {
        this.selectedTimerMode = mode;
        
        // Update UI
        if (mode === 'timer') {
            this.customTimerOption.classList.add('selected');
            this.skipTimerOption.classList.remove('selected');
        } else {
            this.customTimerOption.classList.remove('selected');
            this.skipTimerOption.classList.add('selected');
        }
        
        // Enable next button
        if (this.navButtons.nextFromTimer) {
            this.navButtons.nextFromTimer.disabled = false;
        }
    }

    setTimerDuration(seconds) {
        this.timerDuration = seconds;
        this.updateTimerInputsFromSeconds(seconds);
        
        // Update focus timer
        focusTimer.setDuration(seconds);
    }

    updateTimerDurationFromInputs() {
        const hours = parseInt(this.timerHours.value, 10) || 0;
        const minutes = parseInt(this.timerMinutes.value, 10) || 0;
        const seconds = parseInt(this.timerSeconds.value, 10) || 0;
        
        const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
        
        // Minimum 1 minute
        if (totalSeconds < 60) {
            this.timerMinutes.value = 1;
            this.timerSeconds.value = 0;
            this.setTimerDuration(60);
            return;
        }
        
        // Maximum 99 hours
        if (totalSeconds > 99 * 3600) {
            this.timerHours.value = 99;
            this.timerMinutes.value = 0;
            this.timerSeconds.value = 0;
            this.setTimerDuration(99 * 3600);
            return;
        }
        
        this.setTimerDuration(totalSeconds);
    }

    updateTimerInputsFromSeconds(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (this.timerHours) this.timerHours.value = hours;
        if (this.timerMinutes) this.timerMinutes.value = minutes;
        if (this.timerSeconds) this.timerSeconds.value = secs;
    }

    togglePomodoroSettings(show) {
        this.pomodoroEnabled = show;
        
        if (this.pomodoroSettings) {
            if (show) {
                this.pomodoroSettings.classList.remove('hidden');
            } else {
                this.pomodoroSettings.classList.add('hidden');
            }
        }
    }

    saveTimerSettings() {
        // Save timer mode
        StorageManager.saveTimerMode(this.selectedTimerMode);
        
        // Save timer duration
        StorageManager.saveTimerDuration(this.timerDuration);
        
        // Save Pomodoro settings
        const pomodoroSettings = {
            enabled: this.pomodoroEnabled,
            focusDuration: parseInt(this.focusDurationInput.value, 10) || 25,
            breakDuration: parseInt(this.breakDurationInput.value, 10) || 5,
            cycles: parseInt(this.cyclesInput.value, 10) || 4
        };
        
        StorageManager.savePomodoroSettings(pomodoroSettings);
        
        // Update focus timer
        focusTimer.setPomodoro(this.pomodoroEnabled, pomodoroSettings);
        if (!this.pomodoroEnabled) {
            focusTimer.setDuration(this.timerDuration);
        }
    }

    // Session management
    updateSessionInfo() {
        // Update music source display
        if (this.currentMusicSourceEl) {
            const sourceNames = {
                'spotify': 'Spotify',
                'youtube': 'YouTube',
                'apple': 'Apple Music',
                'manual': 'Manual Control'
            };
            this.currentMusicSourceEl.textContent = sourceNames[this.selectedMusicSource] || 'Not set';
        }
        
        // Update focus template display
        if (this.currentFocusTemplateEl && this.selectedFocusTemplate) {
            const template = TemplateManager.getTemplateById(this.selectedFocusTemplate);
            if (template) {
                this.currentFocusTemplateEl.textContent = template.title;
            }
        }
        
        // Update timer mode display
        if (this.currentTimerModeEl) {
            if (this.selectedTimerMode === 'skip') {
                this.currentTimerModeEl.textContent = 'Free Play (No Timer)';
            } else if (this.pomodoroEnabled) {
                this.currentTimerModeEl.textContent = 'Pomodoro Mode';
            } else {
                this.currentTimerModeEl.textContent = `${focusTimer.formatTime(this.timerDuration)} Timer`;
            }
        }
        
        // Update session description
        this.updateSessionDescription();
    }

    updateSessionDescription() {
        if (!this.sessionDescription) return;
        
        let description = 'Your focus session is ready. ';
        
        if (this.selectedTimerMode === 'skip') {
            description += 'Music will play continuously until you stop it manually.';
        } else if (this.pomodoroEnabled) {
            const status = focusTimer.getStatus();
            if (status.isBreak) {
                description += `Take a ${focusTimer.formatTime(status.remainingSeconds)} break. Next focus session starts automatically.`;
            } else {
                description += `Focus for ${focusTimer.formatTime(status.remainingSeconds)}. Break starts automatically.`;
            }
        } else {
            description += `Focus for ${focusTimer.formatTime(this.timerDuration)}. Music will stop automatically when time is up.`;
        }
        
        this.sessionDescription.textContent = description;
    }

    // NEW: Start session with improved instructions
    startSession() {
        console.log('FocusFlow: Starting session with source:', this.selectedMusicSource);
        
        // Update UI
        this.startSessionBtn.classList.add('hidden');
        this.pauseSessionBtn.classList.remove('hidden');
        this.stopSessionBtn.classList.remove('hidden');
        
        // Show instructions based on music source
        this.showSessionInstructions();
        
        // Start timer if enabled
        if (this.selectedTimerMode === 'timer') {
            focusTimer.start();
        }
        
        // For YouTube, try to autoplay
        if (this.selectedMusicSource === 'youtube') {
            setTimeout(() => {
                EmbedManager.play();
            }, 1000);
        }
        
        // For Spotify and others, show reminder
        if (['spotify', 'apple', 'manual'].includes(this.selectedMusicSource)) {
            this.showMusicReminder();
        }
    }

    // NEW: Show session instructions based on music source
    showSessionInstructions() {
        const sessionInfo = document.querySelector('.session-info');
        if (!sessionInfo) return;
        
        let instructions = '';
        
        switch (this.selectedMusicSource) {
            case 'spotify':
                instructions = `
                    <div class="session-instruction">
                        <i class="fas fa-info-circle"></i>
                        <p><strong>Spotify Users:</strong> You must manually click play in the Spotify player above.</p>
                    </div>
                `;
                break;
                
            case 'apple':
                instructions = `
                    <div class="session-instruction">
                        <i class="fas fa-info-circle"></i>
                        <p><strong>Apple Music Users:</strong> Make sure Apple Music is playing in the other tab.</p>
                    </div>
                `;
                break;
                
            case 'manual':
                instructions = `
                    <div class="session-instruction">
                        <i class="fas fa-info-circle"></i>
                        <p><strong>Manual Mode:</strong> Start playing music on your device, then return here.</p>
                    </div>
                `;
                break;
        }
        
        if (instructions) {
            const existing = sessionInfo.querySelector('.session-instruction');
            if (existing) existing.remove();
            
            sessionInfo.insertAdjacentHTML('beforeend', instructions);
        }
    }

    // NEW: Show music reminder for sources that need manual start
    showMusicReminder() {
        const reminder = `
            <div class="music-reminder">
                <div class="reminder-content">
                    <i class="fas fa-music"></i>
                    <div>
                        <h4>Start Your Music</h4>
                        <p>Please ensure your music is playing before starting the timer.</p>
                    </div>
                </div>
            </div>
        `;
        
        const existing = document.querySelector('.music-reminder');
        if (existing) existing.remove();
        
        document.querySelector('.session-display').insertAdjacentHTML('afterbegin', reminder);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            const reminder = document.querySelector('.music-reminder');
            if (reminder) reminder.remove();
        }, 10000);
    }

    pauseSession() {
        // Update UI
        this.pauseSessionBtn.classList.add('hidden');
        this.startSessionBtn.classList.remove('hidden');
        this.startSessionBtn.innerHTML = '<i class="fas fa-play"></i> Resume Session';
        
        // Pause music if we can control it
        if (this.selectedMusicSource === 'youtube') {
            EmbedManager.pause();
        }
        
        // Pause timer if enabled
        if (this.selectedTimerMode === 'timer') {
            focusTimer.pause();
        }
    }

    stopSession() {
        // Show confirmation
        if (confirm('Are you sure you want to end this session?')) {
            this.endSession();
        }
    }

    endSession() {
        // Stop music with fadeout
        EmbedManager.stop(3); // 3 second fadeout
        
        // Stop timer
        focusTimer.stop();
        
        // Reset UI
        this.startSessionBtn.classList.remove('hidden');
        this.startSessionBtn.innerHTML = '<i class="fas fa-play"></i> Start Focus Session';
        this.pauseSessionBtn.classList.add('hidden');
        this.stopSessionBtn.classList.add('hidden');
        this.sessionCompleteBtn.classList.remove('hidden');
        
        // Remove any instructions
        const instruction = document.querySelector('.session-instruction');
        if (instruction) instruction.remove();
    }

    handleSessionComplete() {
        // Stop music with fadeout
        EmbedManager.stop(5); // 5 second fadeout
        
        // Show completion modal after a delay
        setTimeout(() => {
            this.showCompletionModal();
        }, 1000);
    }

    showCompletionModal() {
        // Calculate session duration
        const duration = focusTimer.formatTime(this.timerDuration);
        if (this.sessionDurationEl) {
            this.sessionDurationEl.textContent = duration;
        }
        
        // Show modal
        if (this.completionModal) {
            this.completionModal.classList.remove('hidden');
        }
        
        // Hide session complete button
        if (this.sessionCompleteBtn) {
            this.sessionCompleteBtn.classList.add('hidden');
        }
    }

    closeModal() {
        if (this.completionModal) {
            this.completionModal.classList.add('hidden');
        }
    }

    startNewSession() {
        // Close modal
        this.closeModal();
        
        // Reset timer
        focusTimer.reset();
        
        // Reset UI
        this.startSessionBtn.classList.remove('hidden');
        this.startSessionBtn.innerHTML = '<i class="fas fa-play"></i> Start Focus Session';
        this.pauseSessionBtn.classList.add('hidden');
        this.stopSessionBtn.classList.add('hidden');
        this.sessionCompleteBtn.classList.add('hidden');
        
        // Remove any instructions
        const instruction = document.querySelector('.session-instruction');
        if (instruction) instruction.remove();
        
        // Go back to step 1
        this.showStep(1);
    }

    // Clean up
    destroy() {
        focusTimer.destroy();
        EmbedManager.destroy();
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.focusFlowApp = new FocusFlowApp();
});
