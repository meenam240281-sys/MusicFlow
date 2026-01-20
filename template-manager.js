/**
 * Focus Template Manager
 * Defines and manages task-based focus templates
 */

const TemplateManager = {
    templates: [
        {
            id: 'theory-reading',
            title: '📖 Theory / Reading',
            description: 'Deep focus for understanding complex concepts, reading dense material, or studying theory.',
            icon: 'fas fa-book',
            intensity: 'medium',
            suggestedDuration: 45, // minutes
            tips: [
                'Avoid frequent track changes',
                'Lower volume for maximum concentration',
                'Instrumental music works best'
            ]
        },
        {
            id: 'maths-numericals',
            title: '➗ Maths / Numericals',
            description: 'Steady rhythm for solving problems, calculations, and logical thinking tasks.',
            icon: 'fas fa-calculator',
            intensity: 'high',
            suggestedDuration: 30,
            tips: [
                'Consistent tempo helps maintain flow',
                'Minimal vocals prevent distraction',
                'Consider electronic or classical'
            ]
        },
        {
            id: 'writing-copying',
            title: '✍️ Writing / Copying',
            description: 'Creative flow for writing, note-taking, transcription, or content creation.',
            icon: 'fas fa-pen-nib',
            intensity: 'low',
            suggestedDuration: 50,
            tips: [
                'Lyrical music can help with creative flow',
                'Familiar playlists reduce decision fatigue',
                'Smooth transitions between tracks'
            ]
        },
        {
            id: 'science-practice',
            title: '🧪 Science Practice',
            description: 'Experimental focus for lab work, data analysis, or systematic practice.',
            icon: 'fas fa-flask',
            intensity: 'medium',
            suggestedDuration: 40,
            tips: [
                'Ambient backgrounds enhance concentration',
                'Avoid sudden volume changes',
                'Nature sounds can complement focus'
            ]
        },
        {
            id: 'light-revision',
            title: '🧠 Light Focus / Revision',
            description: 'Gentle concentration for review, light study, or repetitive tasks.',
            icon: 'fas fa-brain',
            intensity: 'low',
            suggestedDuration: 25,
            tips: [
                'Lo-fi or chill beats work well',
                'Softer volumes maintain relaxed focus',
                'Familiar music enhances comfort'
            ]
        },
        {
            id: 'deep-work',
            title: '🚀 Deep Work',
            description: 'Maximum concentration for challenging tasks requiring sustained mental effort.',
            icon: 'fas fa-rocket',
            intensity: 'high',
            suggestedDuration: 90,
            tips: [
                'Minimalist music with no lyrics',
                'Consistent volume throughout',
                'Long tracks or seamless mixes'
            ]
        },
        {
            id: 'creative-brainstorm',
            title: '💡 Creative Brainstorm',
            description: 'Inspirational background for ideation, planning, or creative thinking.',
            icon: 'fas fa-lightbulb',
            intensity: 'low',
            suggestedDuration: 20,
            tips: [
                'Uplifting or epic soundtracks',
                'Allow for natural pauses in music',
                'Volume should support not dominate'
            ]
        },
        {
            id: 'administrative',
            title: '📋 Administrative Tasks',
            description: 'Background focus for emails, organization, or routine administrative work.',
            icon: 'fas fa-tasks',
            intensity: 'low',
            suggestedDuration: 60,
            tips: [
                'Upbeat but not distracting',
                'Familiar playlists you enjoy',
                'Consider focus playlists from platforms'
            ]
        }
    ],

    // Get all templates
    getAllTemplates() {
        return this.templates;
    },

    // Get template by ID
    getTemplateById(id) {
        return this.templates.find(template => template.id === id);
    },

    // Render templates to the DOM
    renderTemplates(containerSelector) {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        container.innerHTML = '';

        this.templates.forEach(template => {
            const templateElement = document.createElement('div');
            templateElement.className = 'template-card';
            templateElement.dataset.id = template.id;
            templateElement.dataset.intensity = template.intensity;
            
            templateElement.innerHTML = `
                <div class="template-header">
                    <div class="template-icon">
                        <i class="${template.icon}"></i>
                    </div>
                    <span class="intensity-badge">${template.intensity} intensity</span>
                </div>
                <h3>${template.title}</h3>
                <p>${template.description}</p>
                <div class="template-footer">
                    <small>Suggested: ${template.suggestedDuration} min session</small>
                </div>
            `;

            container.appendChild(templateElement);
        });
    },

    // Get intensity color class
    getIntensityColor(intensity) {
        const colors = {
            low: 'var(--accent-success)',
            medium: 'var(--accent-warning)',
            high: 'var(--accent-danger)'
        };
        return colors[intensity] || 'var(--text-secondary)';
    },

    // Get intensity label
    getIntensityLabel(intensity) {
        const labels = {
            low: 'Light Focus',
            medium: 'Moderate Focus',
            high: 'Deep Focus'
        };
        return labels[intensity] || 'Focus';
    }
};
