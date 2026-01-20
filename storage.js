/**
 * Local Storage Manager for FocusFlow
 * Handles persisting user preferences between sessions
 */

const StorageManager = {
    // Storage keys
    KEYS: {
        MUSIC_SOURCE: 'focusflow_music_source',
        FOCUS_TEMPLATE: 'focusflow_focus_template',
        TIMER_MODE: 'focusflow_timer_mode',
        TIMER_DURATION: 'focusflow_timer_duration',
        POMODORO_SETTINGS: 'focusflow_pomodoro_settings',
        VOLUME: 'focusflow_volume'
    },

    // Save music source selection
    saveMusicSource(source) {
        if (!source) return;
        localStorage.setItem(this.KEYS.MUSIC_SOURCE, JSON.stringify(source));
    },

    // Get saved music source
    getMusicSource() {
        const saved = localStorage.getItem(this.KEYS.MUSIC_SOURCE);
        return saved ? JSON.parse(saved) : null;
    },

    // Save focus template selection
    saveFocusTemplate(templateId) {
        if (!templateId) return;
        localStorage.setItem(this.KEYS.FOCUS_TEMPLATE, templateId);
    },

    // Get saved focus template
    getFocusTemplate() {
        return localStorage.getItem(this.KEYS.FOCUS_TEMPLATE);
    },

    // Save timer mode (timer or skip)
    saveTimerMode(mode) {
        if (!mode) return;
        localStorage.setItem(this.KEYS.TIMER_MODE, mode);
    },

    // Get saved timer mode
    getTimerMode() {
        return localStorage.getItem(this.KEYS.TIMER_MODE) || 'timer';
    },

    // Save timer duration in seconds
    saveTimerDuration(seconds) {
        if (!seconds && seconds !== 0) return;
        localStorage.setItem(this.KEYS.TIMER_DURATION, seconds.toString());
    },

    // Get saved timer duration
    getTimerDuration() {
        const saved = localStorage.getItem(this.KEYS.TIMER_DURATION);
        return saved ? parseInt(saved, 10) : 1500; // Default: 25 minutes
    },

    // Save Pomodoro settings
    savePomodoroSettings(settings) {
        if (!settings) return;
        localStorage.setItem(this.KEYS.POMODORO_SETTINGS, JSON.stringify(settings));
    },

    // Get saved Pomodoro settings
    getPomodoroSettings() {
        const saved = localStorage.getItem(this.KEYS.POMODORO_SETTINGS);
        return saved ? JSON.parse(saved) : {
            enabled: false,
            focusDuration: 25,
            breakDuration: 5,
            cycles: 4
        };
    },

    // Save volume level
    saveVolume(volume) {
        if (volume === undefined || volume === null) return;
        localStorage.setItem(this.KEYS.VOLUME, volume.toString());
    },

    // Get saved volume level
    getVolume() {
        const saved = localStorage.getItem(this.KEYS.VOLUME);
        return saved ? parseInt(saved, 10) : 70; // Default: 70%
    },

    // Clear all saved settings
    clearAll() {
        Object.values(this.KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
    },

    // Check if user has any saved preferences
    hasSavedPreferences() {
        return Object.values(this.KEYS).some(key => 
            localStorage.getItem(key) !== null
        );
    },

    // Load all saved preferences
    loadAllPreferences() {
        return {
            musicSource: this.getMusicSource(),
            focusTemplate: this.getFocusTemplate(),
            timerMode: this.getTimerMode(),
            timerDuration: this.getTimerDuration(),
            pomodoroSettings: this.getPomodoroSettings(),
            volume: this.getVolume()
        };
    }
};
