// Theme Integration Guide - JavaScript for Material Icons and Theme Switching
// Add this to your main JavaScript file or create a new themes.js file

class NebulaThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('nebula-theme') || 'dark';
        this.themes = [
            // Original Themes
            { id: 'light', name: 'Light', description: 'Clean light theme', category: 'original' },
            { id: 'dark', name: 'Dark', description: 'Original dark theme', category: 'original' },
            { id: 'nebula-slate', name: 'Nebula Slate', description: 'Balanced slate theme', category: 'original' },
            
            // Cosmic Themes
            { id: 'nebula-ocean', name: 'Ocean', description: 'Deep blue oceanic theme', category: 'cosmic' },
            { id: 'nebula-forest', name: 'Forest', description: 'Natural green theme', category: 'cosmic' },
            { id: 'nebula-sunset', name: 'Sunset', description: 'Warm orange sunset theme', category: 'cosmic' },
            { id: 'nebula-midnight', name: 'Midnight', description: 'Deep purple midnight theme', category: 'cosmic' },
            { id: 'nebula-rose', name: 'Rose', description: 'Elegant pink rose theme', category: 'cosmic' },
            { id: 'nebula-cyber', name: 'Cyber', description: 'Neon cyan cyberpunk theme', category: 'cosmic' },
            { id: 'nebula-aurora', name: 'Aurora', description: 'Northern lights inspired theme', category: 'cosmic' },
            { id: 'nebula-volcano', name: 'Volcano', description: 'Fiery red and orange theme', category: 'cosmic' },
            { id: 'nebula-arctic', name: 'Arctic', description: 'Cool ice blue theme', category: 'cosmic' },
            { id: 'nebula-retro', name: 'Retro', description: '80s synthwave inspired theme', category: 'cosmic' },
            
            // Professional Themes
            { id: 'nebula-minimal', name: 'Minimal', description: 'Clean minimal light theme', category: 'professional' },
            { id: 'nebula-glass', name: 'Glass', description: 'Frosted glass with transparency', category: 'professional' },
            { id: 'windows-11', name: 'Windows 11', description: 'Microsoft Fluent Design inspired', category: 'professional' },
            { id: 'macos', name: 'macOS', description: 'Apple design language inspired', category: 'professional' }
        ];
        
        this.init();
    }
    
    init() {
        this.applyTheme(this.currentTheme);
        this.createThemeSelector();
        this.setupKeyboardShortcuts();
        this.convertEmojisToMaterialIcons();
    }
    
    applyTheme(themeId) {
        document.documentElement.setAttribute('data-theme', themeId);
        document.body.setAttribute('data-theme', themeId);
        this.currentTheme = themeId;
        localStorage.setItem('nebula-theme', themeId);
        
        // Update theme selector if it exists
        this.updateThemeSelector();
        
        // Dispatch theme change event
        window.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme: themeId } 
        }));
        
        console.log(`Applied theme: ${themeId}`);
    }
    
    createThemeSelector() {
        // Remove existing selector
        const existing = document.getElementById('nebula-theme-selector');
        if (existing) existing.remove();
        
        const selector = document.createElement('div');
        selector.id = 'nebula-theme-selector';
        selector.className = 'theme-selector';
        selector.innerHTML = `
            <div class="theme-selector-title">Themes</div>
            <div class="theme-options">
                ${this.themes.map(theme => `
                    <div class="theme-option ${theme.id === this.currentTheme ? 'active' : ''}" 
                         data-theme="${theme.id}" 
                         title="${theme.name} - ${theme.description}">
                    </div>
                `).join('')}
            </div>
        `;
        
        // Add click handlers
        selector.addEventListener('click', (e) => {
            const option = e.target.closest('.theme-option');
            if (option) {
                const themeId = option.dataset.theme;
                this.applyTheme(themeId);
            }
        });
        
        document.body.appendChild(selector);
    }
    
    updateThemeSelector() {
        const options = document.querySelectorAll('.theme-option');
        options.forEach(option => {
            option.classList.toggle('active', option.dataset.theme === this.currentTheme);
        });
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+T to cycle themes
            if (e.ctrlKey && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                this.cycleTheme();
            }
            
            // Ctrl+Shift+1-9 for direct theme selection (first 9 themes)
            if (e.ctrlKey && e.shiftKey && e.key >= '1' && e.key <= '9') {
                e.preventDefault();
                const index = parseInt(e.key) - 1;
                if (this.themes[index]) {
                    this.applyTheme(this.themes[index].id);
                }
            }
            
            // Ctrl+Alt+1-8 for themes 10-17
            if (e.ctrlKey && e.altKey && e.key >= '1' && e.key <= '8') {
                e.preventDefault();
                const index = parseInt(e.key) + 8; // Offset by 9 to get themes 10-17
                if (this.themes[index]) {
                    this.applyTheme(this.themes[index].id);
                }
            }
            
            // Ctrl+Shift+C to cycle through categories
            if (e.ctrlKey && e.shiftKey && e.key === 'C') {
                e.preventDefault();
                this.cycleThemeCategory();
            }
        });
    }
    
    cycleTheme() {
        const currentIndex = this.themes.findIndex(t => t.id === this.currentTheme);
        const nextIndex = (currentIndex + 1) % this.themes.length;
        this.applyTheme(this.themes[nextIndex].id);
    }
    
    cycleThemeCategory() {
        const categories = ['original', 'cosmic', 'professional'];
        const currentCategory = this.themes.find(t => t.id === this.currentTheme)?.category || 'original';
        const currentCategoryIndex = categories.indexOf(currentCategory);
        const nextCategoryIndex = (currentCategoryIndex + 1) % categories.length;
        const nextCategory = categories[nextCategoryIndex];
        
        // Find first theme in next category
        const nextTheme = this.themes.find(t => t.category === nextCategory);
        if (nextTheme) {
            this.applyTheme(nextTheme.id);
        }
    }
    
    getThemesByCategory(category) {
        return this.themes.filter(t => t.category === category);
    }
    
    getRandomTheme() {
        const randomIndex = Math.floor(Math.random() * this.themes.length);
        return this.themes[randomIndex];
    }
    
    applyRandomTheme() {
        const randomTheme = this.getRandomTheme();
        this.applyTheme(randomTheme.id);
    }
    
    convertEmojisToMaterialIcons() {
        // Convert app icons from emoji to Material Icons
        const appIconMappings = {
            '🌐': { icon: 'language', class: 'material-icon-primary' },
            '📁': { icon: 'folder', class: 'material-icon-warning' },
            '🧮': { icon: 'calculate', class: 'material-icon-accent' },
            '💻': { icon: 'terminal', class: 'material-icon-text' },
            '⚙️': { icon: 'settings', class: 'material-icon-secondary' },
            '📧': { icon: 'mail', class: 'material-icon-danger' },
            '📄': { icon: 'description', class: 'material-icon-primary' },
            '📺': { icon: 'play_circle', class: 'material-icon-danger' },
            '🐙': { icon: 'code', class: 'material-icon-text' },
            '🚀': { icon: 'apps', class: 'material-icon-accent' },
            '📋': { icon: 'view_list', class: 'material-icon-secondary' },
            '⏰': { icon: 'schedule', class: 'material-icon-primary' },
            '🤖': { icon: 'smart_toy', class: 'material-icon-primary' },
            '🎨': { icon: 'palette', class: 'material-icon-warning' },
            '💾': { icon: 'save', class: 'material-icon-success' },
            '🔍': { icon: 'search', class: 'material-icon-secondary' },
            '📊': { icon: 'bar_chart', class: 'material-icon-accent' },
            '🔧': { icon: 'build', class: 'material-icon-warning' },
            '📱': { icon: 'smartphone', class: 'material-icon-primary' },
            '🖥️': { icon: 'computer', class: 'material-icon-text' }
        };
        
        // Convert existing emoji icons
        document.querySelectorAll('.app-icon, .widget-icon').forEach(icon => {
            const emoji = icon.textContent.trim();
            if (appIconMappings[emoji]) {
                const mapping = appIconMappings[emoji];
                icon.innerHTML = '';
                icon.className += ` material-icon ${mapping.class}`;
                icon.setAttribute('data-icon', mapping.icon);
                icon.style.fontFamily = 'Material Icons';
                icon.textContent = mapping.icon;
            }
        });
        
        // Set up observer for dynamically added icons
        this.setupIconObserver();
    }
    
    setupIconObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const icons = node.querySelectorAll ? 
                            node.querySelectorAll('.app-icon, .widget-icon') : [];
                        
                        icons.forEach(icon => {
                            const emoji = icon.textContent.trim();
                            const appIconMappings = {
                                '🌐': { icon: 'language', class: 'material-icon-primary' },
                                '📁': { icon: 'folder', class: 'material-icon-warning' },
                                '🧮': { icon: 'calculate', class: 'material-icon-accent' },
                                '💻': { icon: 'terminal', class: 'material-icon-text' },
                                '⚙️': { icon: 'settings', class: 'material-icon-secondary' }
                                // Add more mappings as needed
                            };
                            
                            if (appIconMappings[emoji]) {
                                const mapping = appIconMappings[emoji];
                                icon.innerHTML = '';
                                icon.className += ` material-icon ${mapping.class}`;
                                icon.setAttribute('data-icon', mapping.icon);
                                icon.style.fontFamily = 'Material Icons';
                                icon.textContent = mapping.icon;
                            }
                        });
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    // Utility methods
    getTheme() {
        return this.currentTheme;
    }
    
    getThemes() {
        return this.themes;
    }
    
    setTheme(themeId) {
        if (this.themes.find(t => t.id === themeId)) {
            this.applyTheme(themeId);
        } else {
            console.warn(`Theme ${themeId} not found`);
        }
    }
    
    // Material Icon helper methods
    createMaterialIcon(iconName, options = {}) {
        const icon = document.createElement('span');
        icon.className = `material-icon ${options.variant || ''} ${options.size || ''} ${options.color || ''}`;
        icon.textContent = iconName;
        
        if (options.clickable) {
            icon.classList.add('material-icon-clickable');
        }
        
        if (options.disabled) {
            icon.classList.add('material-icon-disabled');
        }
        
        if (options.animation) {
            icon.classList.add(`material-icon-${options.animation}`);
        }
        
        return icon;
    }
    
    replaceMaterialIcon(element, iconName, options = {}) {
        element.innerHTML = '';
        element.className = `material-icon ${options.variant || ''} ${options.size || ''} ${options.color || ''}`;
        element.textContent = iconName;
        element.style.fontFamily = 'Material Icons';
    }
}

// Widget Integration Helper
class WidgetIconManager {
    static updateWidgetIcons() {
        // Update widget icons to use Material Icons
        const widgetIconMappings = {
            'clock': { icon: 'schedule', color: 'material-icon-primary' },
            'launcher': { icon: 'apps', color: 'material-icon-accent' },
            'taskbar': { icon: 'view_list', color: 'material-icon-secondary' },
            'assistant': { icon: 'smart_toy', color: 'material-icon-primary' },
            'art-assistant': { icon: 'palette', color: 'material-icon-warning' },
            'code-assistant': { icon: 'code', color: 'material-icon-success' },
            'system-monitor': { icon: 'monitor_heart', color: 'material-icon-accent' },
            'weather': { icon: 'wb_sunny', color: 'material-icon-warning' },
            'notes': { icon: 'note', color: 'material-icon-secondary' }
        };
        
        document.querySelectorAll('.widget').forEach(widget => {
            const widgetType = widget.dataset.type;
            const iconElement = widget.querySelector('.widget-icon');
            
            if (widgetType && iconElement && widgetIconMappings[widgetType]) {
                const mapping = widgetIconMappings[widgetType];
                iconElement.innerHTML = '';
                iconElement.className = `widget-icon material-icon ${mapping.color}`;
                iconElement.textContent = mapping.icon;
                iconElement.style.fontFamily = 'Material Icons';
            }
        });
    }
    
    static createWidgetIcon(widgetType, size = 'md') {
        const widgetIconMappings = {
            'clock': { icon: 'schedule', color: 'material-icon-primary' },
            'launcher': { icon: 'apps', color: 'material-icon-accent' },
            'taskbar': { icon: 'view_list', color: 'material-icon-secondary' },
            'assistant': { icon: 'smart_toy', color: 'material-icon-primary' },
            'art-assistant': { icon: 'palette', color: 'material-icon-warning' },
            'code-assistant': { icon: 'code', color: 'material-icon-success' }
        };
        
        const mapping = widgetIconMappings[widgetType];
        if (!mapping) return null;
        
        const icon = document.createElement('span');
        icon.className = `widget-icon material-icon material-icon-${size} ${mapping.color}`;
        icon.textContent = mapping.icon;
        icon.style.fontFamily = 'Material Icons';
        
        return icon;
    }
}

// Initialize theme manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.nebulaThemeManager = new NebulaThemeManager();
    
    // Update widget icons after a short delay to ensure widgets are loaded
    setTimeout(() => {
        WidgetIconManager.updateWidgetIcons();
    }, 1000);
    
    // Listen for widget additions and update their icons
    window.addEventListener('widgetAdded', () => {
        setTimeout(() => {
            WidgetIconManager.updateWidgetIcons();
        }, 100);
    });
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NebulaThemeManager, WidgetIconManager };
}

// Global helper functions
window.setNebulaTheme = (themeId) => {
    if (window.nebulaThemeManager) {
        window.nebulaThemeManager.setTheme(themeId);
    }
};

window.cycleNebulaTheme = () => {
    if (window.nebulaThemeManager) {
        window.nebulaThemeManager.cycleTheme();
    }
};

window.cycleThemeCategory = () => {
    if (window.nebulaThemeManager) {
        window.nebulaThemeManager.cycleThemeCategory();
    }
};

window.applyRandomTheme = () => {
    if (window.nebulaThemeManager) {
        window.nebulaThemeManager.applyRandomTheme();
    }
};

window.getThemesByCategory = (category) => {
    if (window.nebulaThemeManager) {
        return window.nebulaThemeManager.getThemesByCategory(category);
    }
    return [];
};

window.createMaterialIcon = (iconName, options = {}) => {
    if (window.nebulaThemeManager) {
        return window.nebulaThemeManager.createMaterialIcon(iconName, options);
    }
    return null;
};

// Console commands for testing
console.log(`
🎨 Nebula Theme Manager Loaded! (17 Themes Available)

Available commands:
- setNebulaTheme('theme-name') - Switch to a specific theme
- cycleNebulaTheme() - Cycle through all themes
- cycleThemeCategory() - Cycle through theme categories (Original → Cosmic → Professional)
- applyRandomTheme() - Apply a random theme
- getThemesByCategory('category') - Get themes by category ('original', 'cosmic', 'professional')
- createMaterialIcon('icon_name', options) - Create a Material Icon element

Keyboard shortcuts:
- Ctrl+Shift+T - Cycle through all themes
- Ctrl+Shift+C - Cycle through theme categories
- Ctrl+Shift+1-9 - Select themes 1-9 directly
- Ctrl+Alt+1-8 - Select themes 10-17 directly

Theme Categories:
📋 Original (3): Light, Dark, Nebula Slate
🌌 Cosmic (10): Ocean, Forest, Sunset, Midnight, Rose, Cyber, Aurora, Volcano, Arctic, Retro
💼 Professional (4): Minimal, Glass, Windows 11, macOS

All ${window.nebulaThemeManager ? window.nebulaThemeManager.getThemes().length : '17'} themes:
${window.nebulaThemeManager ? window.nebulaThemeManager.getThemes().map((t, i) => `${i + 1}. ${t.name} (${t.id}) - ${t.category}`).join('\n') : 'Loading...'}
`);

