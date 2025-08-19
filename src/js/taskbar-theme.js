// Enhanced Taskbar Theme Integration
//  taskbar-theme.js file

class TaskbarThemeIntegration {
    constructor() {
        this.themeManager = null;
        this.themeSelectorVisible = false;
        this.init();
    }

    init() {
        // Wait for theme manager to be available
        this.waitForThemeManager().then(() => {
            this.setupTaskbarThemeButton();
        });
    }

    waitForThemeManager() {
        return new Promise((resolve) => {
            if (window.nebulaThemeManager) {
                this.themeManager = window.nebulaThemeManager;
                resolve();
            } else {
                // Check every 100ms for theme manager
                const interval = setInterval(() => {
                    if (window.nebulaThemeManager) {
                        this.themeManager = window.nebulaThemeManager;
                        clearInterval(interval);
                        resolve();
                    }
                }, 100);
            }
        });
    }

    setupTaskbarThemeButton() {
        console.log('🎨 Setting up taskbar theme integration');
        
        // Find the existing theme toggle button
        const existingThemeToggle = document.querySelector('.theme-toggle');
        
        if (existingThemeToggle) {
            // Replace the existing theme toggle with our enhanced version
            this.replaceThemeToggle(existingThemeToggle);
        } else {
            // If no theme toggle exists, add one to system tray
            this.addThemeToggleToSystemTray();
        }
        
        // Hide the default theme selector that appears in top-right
        this.hideDefaultThemeSelector();
    }

    replaceThemeToggle(existingButton) {
        console.log('🔄 Replacing existing theme toggle with enhanced version');
        
        // Create new enhanced theme button
        const enhancedButton = document.createElement('button');
        enhancedButton.className = 'taskbar-theme-button';
        enhancedButton.innerHTML = '🎨'; // Art emoji as requested
        enhancedButton.title = 'Theme Selector';
        
        // Style the button to match taskbar
        enhancedButton.style.cssText = `
            background: transparent;
            border: none;
            color: var(--nebula-text-primary);
            font-size: 18px;
            cursor: pointer;
            padding: 8px;
            border-radius: var(--nebula-radius, 6px);
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 40px;
            height: 34px;
        `;
        
        // Add hover effects
        enhancedButton.addEventListener('mouseenter', () => {
            enhancedButton.style.background = 'var(--nebula-surface-hover, rgba(255, 255, 255, 0.1))';
        });
        
        enhancedButton.addEventListener('mouseleave', () => {
            enhancedButton.style.background = 'transparent';
        });
        
        // Add click handler
        enhancedButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleThemeSelector();
        });
        
        // Replace the existing button
        existingButton.parentNode.replaceChild(enhancedButton, existingButton);
        
        console.log('✅ Theme toggle replaced successfully');
    }

    addThemeToggleToSystemTray() {
        console.log('➕ Adding theme toggle to system tray');
        
        // Find the system tray
        const systemTray = document.querySelector('.system-tray');
        
        if (systemTray) {
            // Create theme button
            const themeButton = document.createElement('button');
            themeButton.className = 'taskbar-theme-button';
            themeButton.innerHTML = '🎨';
            themeButton.title = 'Theme Selector';
            
            // Style to match other system tray items
            themeButton.style.cssText = `
                background: transparent;
                border: none;
                color: var(--nebula-text-primary);
                font-size: 18px;
                cursor: pointer;
                padding: 8px;
                border-radius: var(--nebula-radius, 6px);
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                min-width: 40px;
                height: 34px;
            `;
            
            // Add hover effects
            themeButton.addEventListener('mouseenter', () => {
                themeButton.style.background = 'var(--nebula-surface-hover, rgba(255, 255, 255, 0.1))';
            });
            
            themeButton.addEventListener('mouseleave', () => {
                themeButton.style.background = 'transparent';
            });
            
            // Add click handler
            themeButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleThemeSelector();
            });
            
            // Add to system tray (before clock if it exists)
            const clock = systemTray.querySelector('.clock');
            if (clock) {
                systemTray.insertBefore(themeButton, clock);
            } else {
                systemTray.appendChild(themeButton);
            }
            
            console.log('✅ Theme button added to system tray');
        } else {
            console.warn('⚠️ System tray not found, cannot add theme button');
        }
    }

    hideDefaultThemeSelector() {
        // Hide the default theme selector that appears in top-right
        const defaultSelector = document.getElementById('nebula-theme-selector');
        if (defaultSelector) {
            defaultSelector.style.display = 'none';
            console.log('🙈 Default theme selector hidden');
        }
    }

    toggleThemeSelector() {
        if (this.themeSelectorVisible) {
            this.hideThemeSelector();
        } else {
            this.showThemeSelector();
        }
    }

    showThemeSelector() {
        console.log('🎨 Showing taskbar theme selector');
        
        // Hide any existing selector
        this.hideThemeSelector();
        
        // Create taskbar-positioned theme selector
        const selector = document.createElement('div');
        selector.id = 'taskbar-theme-selector';
        selector.className = 'taskbar-theme-selector';
        
        // Position it above the taskbar
        const taskbar = document.querySelector('.taskbar');
        const taskbarRect = taskbar.getBoundingClientRect();
        
        selector.style.cssText = `
            position: fixed;
            bottom: ${window.innerHeight - taskbarRect.top + 10}px;
            right: 20px;
            z-index: 10000;
            background: var(--nebula-surface, #ffffff);
            border: 1px solid var(--nebula-border, #e2e8f0);
            border-radius: var(--nebula-radius-md, 8px);
            padding: 16px;
            box-shadow: var(--nebula-shadow-lg, 0 8px 32px rgba(0, 0, 0, 0.15));
            backdrop-filter: blur(20px);
            min-width: 280px;
            animation: themeSelectorSlideUp 0.3s ease;
        `;
        
        // Get themes from theme manager
        const themes = this.themeManager.getThemes();
        const currentTheme = this.themeManager.getTheme();
        
        // Create selector content
        selector.innerHTML = `
            <div class="theme-selector-header">
                <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: var(--nebula-text-primary, #1a202c);">
                    🎨 Choose Theme
                </h3>
                <button class="theme-close-btn" style="background: none; border: none; font-size: 18px; cursor: pointer; color: var(--nebula-text-secondary, #64748b);">×</button>
            </div>
            <div class="theme-categories">
                ${this.renderThemeCategories(themes, currentTheme)}
            </div>
            <div class="theme-shortcuts" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--nebula-border, #e2e8f0); font-size: 11px; color: var(--nebula-text-secondary, #64748b);">
                <strong>Shortcuts:</strong> Ctrl+Shift+T (cycle) • Ctrl+Shift+1-9 (quick select)
            </div>
        `;
        
        // Add event listeners
        this.setupThemeSelectorEvents(selector);
        
        // Add to DOM
        document.body.appendChild(selector);
        this.themeSelectorVisible = true;
        
        // Close when clicking outside
        setTimeout(() => {
            document.addEventListener('click', this.handleOutsideClick);
        }, 100);
    }

    renderThemeCategories(themes, currentTheme) {
        const categories = ['original', 'cosmic', 'professional'];
        
        return categories.map(category => {
            const categoryThemes = themes.filter(t => t.category === category);
            
            return `
                <div class="theme-category" style="margin-bottom: 16px;">
                    <div class="category-title" style="font-size: 12px; font-weight: 600; color: var(--nebula-text-secondary, #64748b); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
                        ${category}
                    </div>
                    <div class="theme-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(60px, 1fr)); gap: 8px;">
                        ${categoryThemes.map(theme => `
                            <div class="theme-option ${theme.id === currentTheme ? 'active' : ''}" 
                                 data-theme="${theme.id}" 
                                 title="${theme.name} - ${theme.description}"
                                 style="
                                     width: 60px; 
                                     height: 40px; 
                                     border-radius: 6px; 
                                     cursor: pointer; 
                                     border: 2px solid ${theme.id === currentTheme ? 'var(--nebula-primary, #667eea)' : 'transparent'}; 
                                     transition: all 0.2s ease;
                                     position: relative;
                                     overflow: hidden;
                                     ${this.getThemePreviewStyle(theme.id)}
                                 ">
                                <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.7); color: white; font-size: 9px; padding: 2px 4px; text-align: center;">
                                    ${theme.name}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    getThemePreviewStyle(themeId) {
        const themeStyles = {
            'light': 'background: linear-gradient(135deg, #ffffff, #f8fafc);',
            'dark': 'background: linear-gradient(135deg, #0f172a, #1e293b);',
            'nebula-slate': 'background: linear-gradient(135deg, #475569, #64748b);',
            'nebula-ocean': 'background: linear-gradient(135deg, #0c1e2e, #2d5a7a);',
            'nebula-forest': 'background: linear-gradient(135deg, #0d1f0d, #2d5a2d);',
            'nebula-sunset': 'background: linear-gradient(135deg, #2d1b0d, #6b4226);',
            'nebula-midnight': 'background: linear-gradient(135deg, #1a0d2e, #42266b);',
            'nebula-rose': 'background: linear-gradient(135deg, #2d0d1a, #6b2642);',
            'nebula-cyber': 'background: linear-gradient(135deg, #0a0a0a, #00ffff);',
            'nebula-aurora': 'background: linear-gradient(135deg, #0a0f1c, #00e676);',
            'nebula-volcano': 'background: linear-gradient(135deg, #1a0a0a, #ff4444);',
            'nebula-arctic': 'background: linear-gradient(135deg, #0a1a1a, #00bcd4);',
            'nebula-retro': 'background: linear-gradient(135deg, #0d0221, #ff00ff);',
            'nebula-minimal': 'background: linear-gradient(135deg, #fafafa, #2196f3);',
            'nebula-glass': 'background: linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(51, 65, 85, 0.9));',
            'windows-11': 'background: linear-gradient(135deg, #f3f3f3, #0078d4);',
            'macos': 'background: linear-gradient(135deg, #f5f5f7, #007aff);'
        };
        
        return themeStyles[themeId] || 'background: linear-gradient(135deg, #667eea, #764ba2);';
    }

    setupThemeSelectorEvents(selector) {
        // Close button
        const closeBtn = selector.querySelector('.theme-close-btn');
        closeBtn.addEventListener('click', () => {
            this.hideThemeSelector();
        });
        
        // Theme option clicks
        selector.addEventListener('click', (e) => {
            const themeOption = e.target.closest('.theme-option');
            if (themeOption) {
                const themeId = themeOption.dataset.theme;
                console.log('🎨 Applying theme:', themeId);
                
                // Apply theme using theme manager
                this.themeManager.applyTheme(themeId);
                
                // Update active state
                selector.querySelectorAll('.theme-option').forEach(opt => {
                    opt.classList.remove('active');
                    opt.style.borderColor = 'transparent';
                });
                
                themeOption.classList.add('active');
                themeOption.style.borderColor = 'var(--nebula-primary, #667eea)';
                
                // Close selector after short delay
                setTimeout(() => {
                    this.hideThemeSelector();
                }, 500);
            }
        });
        
        // Hover effects
        selector.addEventListener('mouseover', (e) => {
            const themeOption = e.target.closest('.theme-option');
            if (themeOption && !themeOption.classList.contains('active')) {
                themeOption.style.borderColor = 'var(--nebula-border-hover, #94a3b8)';
                themeOption.style.transform = 'scale(1.05)';
            }
        });
        
        selector.addEventListener('mouseout', (e) => {
            const themeOption = e.target.closest('.theme-option');
            if (themeOption && !themeOption.classList.contains('active')) {
                themeOption.style.borderColor = 'transparent';
                themeOption.style.transform = 'scale(1)';
            }
        });
    }

    handleOutsideClick = (e) => {
        const selector = document.getElementById('taskbar-theme-selector');
        const themeButton = document.querySelector('.taskbar-theme-button');
        
        if (selector && !selector.contains(e.target) && !themeButton.contains(e.target)) {
            this.hideThemeSelector();
        }
    }

    hideThemeSelector() {
        const selector = document.getElementById('taskbar-theme-selector');
        if (selector) {
            selector.style.animation = 'themeSelectorSlideDown 0.2s ease forwards';
            setTimeout(() => {
                if (selector.parentNode) {
                    selector.parentNode.removeChild(selector);
                }
            }, 200);
        }
        
        this.themeSelectorVisible = false;
        document.removeEventListener('click', this.handleOutsideClick);
        
        console.log('🙈 Theme selector hidden');
    }
}

// Enhanced CSS for taskbar theme selector
const taskbarThemeSelectorStyles = `
<style id="taskbar-theme-selector-styles">
@keyframes themeSelectorSlideUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes themeSelectorSlideDown {
    from {
        opacity: 1;
        transform: translateY(0);
    }
    to {
        opacity: 0;
        transform: translateY(20px);
    }
}

.taskbar-theme-selector {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.theme-selector-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
}

.theme-close-btn:hover {
    background: var(--nebula-surface-hover, #f1f5f9) !important;
    border-radius: 4px;
}

.theme-option:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Dark theme support */
[data-theme="dark"] .taskbar-theme-selector,
[data-theme*="nebula"] .taskbar-theme-selector {
    background: var(--nebula-surface, #2d3748);
    border-color: var(--nebula-border, #4a5568);
    color: var(--nebula-text-primary, #e2e8f0);
}

[data-theme="dark"] .theme-close-btn:hover,
[data-theme*="nebula"] .theme-close-btn:hover {
    background: var(--nebula-surface-hover, #4a5568) !important;
}
</style>
`;

// Inject styles
if (!document.getElementById('taskbar-theme-selector-styles')) {
    document.head.insertAdjacentHTML('beforeend', taskbarThemeSelectorStyles);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new TaskbarThemeIntegration();
    });
} else {
    new TaskbarThemeIntegration();
}

console.log('✅ Taskbar Theme Integration loaded!');