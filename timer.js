/**
 * Timer System for FocusFlow
 * Handles countdown, Pomodoro cycles, and music fadeout
 */

class FocusTimer {
    constructor() {
        this.timer = null;
        this.startTime = null;
        this.endTime = null;
        this.pausedTime = null;
        this.isPaused = false;
        this.isRunning = false;
        this.totalSeconds = 0;
        this.remainingSeconds = 0;
        
        // Pomodoro state
        this.pomodoroEnabled = false;
        this.pomodoroSettings = {
            focusDuration: 25 * 60, // in seconds
            breakDuration: 5 * 60,  // in seconds
            cycles: 4,
            currentCycle: 1,
            isBreak: false
        };
        
        // Callbacks
        this.onTick = null;
        this.onComplete = null;
        this.onPomodoroCycleChange = null;
        
        // DOM elements
        this.timeDisplay = document.getElementById('time-remaining');
        this.phaseLabel = document.getElementById('timer-phase-label');
        this.progressFill = document.querySelector('.progress-fill');
        this.cycleCount = document.getElementById('current-cycle');
        this.totalCycles = document.getElementById('total-cycles');
        
        this.initialize();
    }

    initialize() {
        // Load saved Pomodoro settings
        const savedSettings = StorageManager.getPomodoroSettings();
        this.pomodoroEnabled = savedSettings.enabled;
        this.pomodoroSettings.focusDuration = savedSettings.focusDuration * 60;
        this.pomodoroSettings.breakDuration = savedSettings.breakDuration * 60;
        this.pomodoroSettings.cycles = savedSettings.cycles;
        
        if (this.totalCycles) {
            this.totalCycles.textContent = this.pomodoroSettings.cycles;
        }
    }

    // Set timer duration in seconds
    setDuration(seconds) {
        if (seconds < 60) seconds = 60; // Minimum 1 minute
        if (seconds > 99 * 60 * 60) seconds = 99 * 60 * 60; // Maximum 99 hours
        
        this.totalSeconds = seconds;
        this.remainingSeconds = seconds;
        
        this.updateDisplay();
    }

    // Enable/disable Pomodoro mode
    setPomodoro(enabled, settings = null) {
        this.pomodoroEnabled = enabled;
        
        if (settings) {
            this.pomodoroSettings.focusDuration = settings.focusDuration * 60;
            this.pomodoroSettings.breakDuration = settings.breakDuration * 60;
            this.pomodoroSettings.cycles = settings.cycles;
            this.pomodoroSettings.currentCycle = 1;
            this.pomodoroSettings.isBreak = false;
        }
        
        if (enabled) {
            // Set initial duration to focus duration
            this.setDuration(this.pomodoroSettings.focusDuration);
            this.updatePhaseLabel();
        }
        
        if (this.totalCycles) {
            this.totalCycles.textContent = this.pomodoroSettings.cycles;
        }
    }

    // Start the timer
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.isPaused = false;
        this.startTime = new Date();
        this.endTime = new Date(this.startTime.getTime() + this.remainingSeconds * 1000);
        
        this.timer = setInterval(() => this.tick(), 1000);
        
        this.updatePhaseLabel();
    }

    // Pause the timer
    pause() {
        if (!this.isRunning || this.isPaused) return;
        
        this.isPaused = true;
        this.pausedTime = new Date();
        clearInterval(this.timer);
    }

    // Resume the timer
    resume() {
        if (!this.isRunning || !this.isPaused) return;
        
        this.isPaused = false;
        const now = new Date();
        const pauseDuration = (now - this.pausedTime) / 1000;
        this.endTime = new Date(this.endTime.getTime() + pauseDuration * 1000);
        
        this.timer = setInterval(() => this.tick(), 1000);
    }

    // Stop the timer completely
    stop() {
        this.isRunning = false;
        this.isPaused = false;
        clearInterval(this.timer);
        this.timer = null;
        
        this.remainingSeconds = this.totalSeconds;
        this.updateDisplay();
    }

    // Reset the timer
    reset() {
        this.stop();
        this.pomodoroSettings.currentCycle = 1;
        this.pomodoroSettings.isBreak = false;
        
        if (this.pomodoroEnabled) {
            this.setDuration(this.pomodoroSettings.focusDuration);
        }
        
        this.updatePhaseLabel();
        this.updateDisplay();
    }

    // Timer tick function
    tick() {
        const now = new Date();
        const diff = Math.max(0, Math.floor((this.endTime - now) / 1000));
        
        this.remainingSeconds = diff;
        
        // Update display
        this.updateDisplay();
        
        // Call onTick callback if provided
        if (this.onTick) {
            this.onTick(this.remainingSeconds, this.getProgressPercentage());
        }
        
        // Check if timer is complete
        if (diff <= 0) {
            this.handleTimerComplete();
        }
    }

    // Handle timer completion
    handleTimerComplete() {
        clearInterval(this.timer);
        this.isRunning = false;
        
        if (this.pomodoroEnabled && !this.pomodoroSettings.isBreak) {
            // Focus session complete, start break if there are cycles left
            if (this.pomodoroSettings.currentCycle < this.pomodoroSettings.cycles) {
                this.startBreak();
                return;
            }
        } else if (this.pomodoroEnabled && this.pomodoroSettings.isBreak) {
            // Break complete, start next focus session or finish
            if (this.pomodoroSettings.currentCycle < this.pomodoroSettings.cycles) {
                this.startNextFocus();
                return;
            }
        }
        
        // Timer is completely done
        if (this.onComplete) {
            this.onComplete();
        }
    }

    // Start a break session
    startBreak() {
        this.pomodoroSettings.isBreak = true;
        this.setDuration(this.pomodoroSettings.breakDuration);
        
        // Notify about cycle change
        if (this.onPomodoroCycleChange) {
            this.onPomodoroCycleChange(this.pomodoroSettings.currentCycle, true);
        }
        
        this.start();
    }

    // Start next focus session
    startNextFocus() {
        this.pomodoroSettings.isBreak = false;
        this.pomodoroSettings.currentCycle++;
        this.setDuration(this.pomodoroSettings.focusDuration);
        
        // Notify about cycle change
        if (this.onPomodoroCycleChange) {
            this.onPomodoroCycleChange(this.pomodoroSettings.currentCycle, false);
        }
        
        this.start();
    }

    // Update the timer display
    updateDisplay() {
        if (!this.timeDisplay) return;
        
        const hours = Math.floor(this.remainingSeconds / 3600);
        const minutes = Math.floor((this.remainingSeconds % 3600) / 60);
        const seconds = this.remainingSeconds % 60;
        
        let display = '';
        
        if (hours > 0) {
            display += `${hours.toString().padStart(2, '0')}:`;
        }
        
        display += `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        this.timeDisplay.textContent = display;
        
        // Update progress bar
        this.updateProgressBar();
        
        // Update cycle count
        if (this.cycleCount) {
            this.cycleCount.textContent = this.pomodoroSettings.currentCycle;
        }
    }

    // Update progress bar
    updateProgressBar() {
        if (!this.progressFill) return;
        
        const percentage = this.getProgressPercentage();
        this.progressFill.style.width = `${percentage}%`;
    }

    // Get progress percentage
    getProgressPercentage() {
        if (!this.totalSeconds) return 0;
        
        let totalForCurrentPhase = this.pomodoroEnabled 
            ? (this.pomodoroSettings.isBreak 
                ? this.pomodoroSettings.breakDuration 
                : this.pomodoroSettings.focusDuration)
            : this.totalSeconds;
            
        const elapsed = totalForCurrentPhase - this.remainingSeconds;
        return Math.min(100, Math.max(0, (elapsed / totalForCurrentPhase) * 100));
    }

    // Update phase label (Focus/Break)
    updatePhaseLabel() {
        if (!this.phaseLabel) return;
        
        if (this.pomodoroEnabled) {
            this.phaseLabel.textContent = this.pomodoroSettings.isBreak ? 'Break' : 'Focus';
            this.phaseLabel.style.color = this.pomodoroSettings.isBreak 
                ? 'var(--accent-success)' 
                : 'var(--accent-primary)';
        } else {
            this.phaseLabel.textContent = 'Focus';
            this.phaseLabel.style.color = 'var(--accent-primary)';
        }
    }

    // Format seconds to HH:MM:SS
    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }

    // Get current timer status
    getStatus() {
        return {
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            isBreak: this.pomodoroSettings.isBreak,
            currentCycle: this.pomodoroSettings.currentCycle,
            totalCycles: this.pomodoroSettings.cycles,
            remainingSeconds: this.remainingSeconds,
            totalSeconds: this.totalSeconds,
            progressPercentage: this.getProgressPercentage()
        };
    }

    // Clean up
    destroy() {
        this.stop();
        this.onTick = null;
        this.onComplete = null;
        this.onPomodoroCycleChange = null;
    }
}

// Create global timer instance
const focusTimer = new FocusTimer();
