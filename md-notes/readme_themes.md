# NebulaDesktop Theme System & Customization Guide

## Overview

NebulaDesktop features a sophisticated theming system designed for both casual users and power customizers. Whether you want to quickly switch between beautiful pre-built themes or dive deep into creating custom color schemes, wallpapers, and UI modifications, NebulaDesktop has you covered.

**Perfect for**: UI/UX designers, artists, Linux ricers, and anyone who loves customizing their desktop environment.

## Theme Architecture

### CSS Variable Foundation

The entire theme system is built on CSS custom properties (variables), making it incredibly flexible and consistent:

```css
:root {
    /* Core Colors */
    --nebula-primary: #667eea;
    --nebula-secondary: #764ba2;
    --nebula-accent: #4f46e5;
    
    /* Background Hierarchy */
    --nebula-bg-primary: #ffffff;
    --nebula-bg-secondary: #f8fafc;
    --nebula-bg-tertiary: #f1f5f9;
    
    /* Surface Colors */
    --nebula-surface: #ffffff;
    --nebula-surface-elevated: #ffffff;
    --nebula-surface-hover: #f8fafc;
    --nebula-surface-active: #f1f5f9;
    
    /* Text Colors */
    --nebula-text-primary: #1e293b;
    --nebula-text-secondary: #64748b;
    --nebula-text-muted: #94a3b8;
    
    /* Borders & Dividers */
    --nebula-border: #e2e8f0;
    --nebula-border-hover: #cbd5e1;
    --nebula-divider: #f1f5f9;
}
```

### Theme Management System

#### 1. NebulaThemeManager (`nebula-theme-manager.js`)
Central theme switching and management system.

#### 2. Core Theme Definitions (`nebula-theme.css`)
Base theme definitions for light, dark, and nebula-slate themes.

#### 3. Extended Themes (`nebula-extended-themes.css`)
Advanced themes with special effects and unique color schemes.

#### 4. Theme Bridge (`nebula-theme-bridge.css`)
Ensures legacy components work with the modern theme system.

#### 5. NebulaSettings Integration
Full GUI for theme creation, wallpaper management, and customization.

## Available Themes

### 🌟 Original Themes

#### Light Theme
- **Style**: Clean, minimal light interface
- **Best For**: Productivity, bright environments
- **Colors**: White backgrounds, dark text, blue accents

#### Dark Theme  
- **Style**: Modern dark interface with blue-gray tones
- **Best For**: Late night work, low light environments
- **Colors**: Dark blue-gray backgrounds, light text

#### Nebula Slate (Default)
- **Style**: Balanced theme between light and dark
- **Best For**: All-day use, balanced contrast
- **Colors**: Slate grays with blue accents

### 🌌 Cosmic Themes

#### Nebula Ocean
```css
--nebula-primary: #0ea5e9;
--nebula-bg-primary: #0c1e2e;
--nebula-text-primary: #e0f7fa;
```
Deep blue oceanic theme with cyan accents.

#### Nebula Forest
```css
--nebula-primary: #10b981;
--nebula-bg-primary: #0d1f0d;
--nebula-text-primary: #e8f5e8;
```
Natural green theme inspired by forest environments.

#### Nebula Sunset
```css
--nebula-primary: #f97316;
--nebula-bg-primary: #2d1b0d;
--nebula-text-primary: #fff7ed;
```
Warm orange and amber sunset colors.

#### Nebula Midnight
```css
--nebula-primary: #8b5cf6;
--nebula-bg-primary: #1a0d2e;
--nebula-text-primary: #f3e8ff;
```
Deep purple midnight theme with violet accents.

#### Nebula Aurora ✨
```css
--nebula-primary: #00e676;
--nebula-bg-primary: #0a0f1c;
--aurora-glow: 0 0 20px rgba(0, 230, 118, 0.3);
```
**Special Effects**: Northern lights inspired with glow effects.

#### Nebula Volcano 🌋
```css
--nebula-primary: #ff5722;
--nebula-bg-primary: #1a0a0a;
```
Fiery red and orange theme with warm tones.

#### Nebula Arctic ❄️
```css
--nebula-primary: #00b4d8;
--nebula-bg-primary: #0a1a2e;
```
Cool ice blue theme with arctic feels.

#### Nebula Retro 🌈
```css
--nebula-primary: #ff00ff;
--nebula-secondary: #00ffff;
--nebula-bg-primary: #0d0221;
```
80s synthwave inspired neon colors.

### 💼 Professional Themes

#### Windows 11 Style
```css
--nebula-primary: #0078d4;
--window-primary-accent: #0078d4;
/* Fluent Design inspired */
```
Microsoft Fluent Design language with rounded corners and subtle shadows.

#### macOS Style
```css
--nebula-primary: #007aff;
--window-primary-accent: #007aff;
/* Apple design language */
```
Apple design language with enhanced blur effects and rounded corners.

#### Nebula Glass ✨
```css
backdrop-filter: blur(20px);
-webkit-backdrop-filter: blur(20px);
```
**Special Effects**: Frosted glass with transparency and blur effects.

#### Nebula Minimal
Clean, minimal light theme focused on content and productivity.

### ⚠️ Enhanced OS Themes (Experimental)

Located in `src/css/themes/`:
- `windows10-theme.css`
- `windows11-theme.css` 
- `macos-theme.css`
- `ubuntu-theme.css`

**⚠️ Important Note**: These files were created for an EnhancedSettings mockup and may not be fully functional. They contain interesting ideas and code patterns that could be useful for theme development, but use with caution as they may conflict with the current system.

**Status**: Reference only - not integrated into the main theme system.

## Theme Switching

### Programmatic Switching

```javascript
// Using NebulaThemeManager
const themeManager = new NebulaThemeManager();
themeManager.setTheme('nebula-aurora');

// Direct DOM manipulation
document.documentElement.setAttribute('data-theme', 'dark');

// Using NebulaSettings (full GUI)
const settings = new NebulaSettings();
settings.applyTheme('nebula-volcano');
```

### Theme Selector UI

The theme system includes a floating theme selector widget:

```javascript
// Automatic theme selector creation
this.createThemeSelector();

// Theme selector appears in top-right corner
// Click any color circle to switch themes
// Hover effects and active state indicators
```

### Settings App Integration

NebulaDesktop includes a comprehensive Settings app (`NebulaSettings.js`) with:
- **Theme Gallery**: Visual preview of all themes
- **Custom Theme Creator**: Build themes from scratch
- **Wallpaper Manager**: Integrated wallpaper system
- **Theme Import/Export**: Share themes with others

## Creating Custom Themes

### Method 1: CSS Variable Override

Create a new theme by defining CSS variables:

```css
[data-theme="my-custom-theme"] {
    --nebula-primary: #your-color;
    --nebula-secondary: #your-color;
    --nebula-bg-primary: #your-color;
    --nebula-bg-secondary: #your-color;
    --nebula-surface: #your-color;
    --nebula-text-primary: #your-color;
    --nebula-text-secondary: #your-color;
    --nebula-border: #your-color;
    
    /* Optional: Special effects */
    --my-special-glow: 0 0 20px rgba(255, 0, 255, 0.3);
}

/* Apply special effects */
[data-theme="my-custom-theme"] .window {
    box-shadow: var(--my-special-glow);
}
```

### Method 2: NebulaSettings GUI

1. **Open Settings App** from launcher
2. **Go to Theme Section**
3. **Create Custom Theme**:
   - Choose base colors
   - Preview in real-time
   - Save and apply
4. **Export Theme** to share with others

### Method 3: Wallpaper-Based Themes

NebulaSettings can extract colors from wallpapers:

```javascript
// Wallpaper meta theme creation
const wallpaperTheme = {
    primary: extractedColor1,
    secondary: extractedColor2,
    background: extractedColor3,
    titlebarStart: extractedColor4,
    titlebarEnd: extractedColor5,
    // ... other colors
};
```

## Advanced Customization

### Special Effects

#### Glow Effects
```css
[data-theme="my-theme"] {
    --my-glow: 0 0 20px rgba(255, 0, 255, 0.3);
}

[data-theme="my-theme"] .window,
[data-theme="my-theme"] .widget {
    box-shadow: var(--my-glow);
}
```

#### Backdrop Blur
```css
[data-theme="my-theme"] .window {
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
}
```

#### Animated Gradients
```css
[data-theme="my-theme"] {
    --nebula-bg-primary: linear-gradient(45deg, #color1, #color2);
    animation: gradient-shift 10s ease infinite;
}

@keyframes gradient-shift {
    0%, 100% { --nebula-bg-primary: linear-gradient(45deg, #color1, #color2); }
    50% { --nebula-bg-primary: linear-gradient(45deg, #color2, #color1); }
}
```

### Icon Theming

Material icons adapt to themes:

```css
/* Theme-specific icon colors */
[data-theme="my-theme"] .material-icon-primary { 
    color: var(--nebula-primary); 
}

[data-theme="my-theme"] .material-icon-secondary { 
    color: var(--nebula-secondary); 
}

[data-theme="my-theme"] .material-icon-accent { 
    color: var(--nebula-accent); 
}
```

### Component-Specific Theming

#### Window Theming
```css
[data-theme="my-theme"] .window {
    --window-bg: var(--nebula-surface);
    --window-border-color: var(--nebula-border);
    --window-control-bg: var(--nebula-surface-hover);
}
```

#### Taskbar Theming
```css
[data-theme="my-theme"] {
    --taskbar-bg: rgba(your-color, 0.95);
    --taskbar-border: rgba(your-color, 0.1);
}
```

#### Widget Theming
```css
[data-theme="my-theme"] .widget {
    background: var(--nebula-surface);
    border: 1px solid var(--nebula-border);
    box-shadow: var(--nebula-shadow-md);
}
```

## Wallpaper Integration

### Wallpaper Types Supported

#### 1. Image Wallpapers
```javascript
wallpaperSettings: {
    type: 'image',
    image: 'data:image/jpeg;base64,...', // Base64 or URL
    imageSource: 'Upload: myimage.jpg'
}
```

#### 2. Gradient Wallpapers
```javascript
wallpaperSettings: {
    type: 'gradient',
    gradient: {
        direction: '135deg',
        start: '#667eea',
        end: '#764ba2'
    }
}
```

#### 3. Solid Color Wallpapers
```javascript
wallpaperSettings: {
    type: 'solid',
    solid: '#1a202c'
}
```

### Wallpaper-Meta Themes

NebulaSettings can create themes based on wallpaper colors:

1. **Upload wallpaper image**
2. **Extract dominant colors** automatically
3. **Assign colors to UI elements**:
   - Primary: Most vibrant color
   - Secondary: Complementary color
   - Background: Darkest/lightest color
   - Titlebar: Gradient from extracted colors
4. **Generate complete theme** with wallpaper integration

## Theme Development Workflow

### 1. Design Phase
- **Color Palette**: Choose 3-5 main colors
- **Hierarchy**: Define background, surface, and accent colors
- **Typography**: Ensure text contrast meets accessibility standards
- **Special Effects**: Plan any glows, blurs, or animations

### 2. Implementation Phase
```css
/* Start with base structure */
[data-theme="my-theme"] {
    /* Background hierarchy */
    --nebula-bg-primary: #base-bg;
    --nebula-bg-secondary: #secondary-bg;
    --nebula-surface: #surface-color;
    
    /* Text colors (ensure proper contrast) */
    --nebula-text-primary: #primary-text;
    --nebula-text-secondary: #secondary-text;
    
    /* Accent colors */
    --nebula-primary: #brand-color;
    --nebula-secondary: #secondary-brand;
    
    /* Borders */
    --nebula-border: #border-color;
}
```

### 3. Testing Phase
- **Test in light and dark environments**
- **Verify text readability** (aim for 4.5:1 contrast ratio minimum)
- **Check all components**: windows, widgets, apps, settings
- **Test theme switching** doesn't break layouts
- **Verify accessibility** with screen readers if possible

### 4. Sharing Phase
```javascript
// Export theme via NebulaSettings
const themeData = {
    name: 'My Amazing Theme',
    theme: 'custom',
    customTheme: { /* your theme colors */ },
    wallpaperSettings: { /* optional wallpaper */ },
    version: 'NebulaDesktop v4.0'
};

// Save to ~/.nebula/themes/my-amazing-theme.json
```

## File Structure

```
src/css/
├── nebula-theme.css              # Core theme definitions
├── nebula-extended-themes.css    # Advanced themes with effects
├── nebula-theme-bridge.css       # Legacy component integration
├── nebula-material-icons.css     # Icon theming
└── themes/                       # ⚠️ Enhanced themes (reference only)
    ├── windows10-theme.css       # ⚠️ Experimental
    ├── windows11-theme.css       # ⚠️ Experimental
    ├── macos-theme.css           # ⚠️ Experimental
    ├── ubuntu-theme.css          # ⚠️ Experimental
    └── themes.txt               # Theme descriptions

src/js/
├── nebula-theme-manager.js       # Theme switching system
├── NebulaSettings.js            # GUI theme creator
└── taskbar-theme.js             # Taskbar-specific theming
```

## Loading Order (Critical)

```html
<!-- 1. Core theme system -->
<link rel="stylesheet" href="css/nebula-theme.css">

<!-- 2. Extended themes -->
<link rel="stylesheet" href="css/nebula-extended-themes.css">

<!-- 3. Material icons theming -->
<link rel="stylesheet" href="css/nebula-material-icons.css">

<!-- 4. Theme bridge (MUST be last) -->
<link rel="stylesheet" href="css/nebula-theme-bridge.css">
```

## Accessibility Guidelines

### Color Contrast
```css
/* Ensure proper contrast ratios */
--nebula-text-primary: #contrast-checked-color; /* 4.5:1 minimum */
--nebula-text-secondary: #contrast-checked-color; /* 3:1 minimum */
```

### Dark Mode Considerations
- **Avoid pure black** backgrounds (#000000)
- **Use dark grays** (#1a1a1a or similar) for better readability
- **Ensure sufficient contrast** in both light and dark variants

### Focus Indicators
```css
[data-theme="my-theme"] :focus {
    outline: 2px solid var(--nebula-primary);
    outline-offset: 2px;
}
```

## Troubleshooting

### Common Issues

#### 1. Theme Not Applying
```javascript
// Check theme attribute
console.log(document.documentElement.getAttribute('data-theme'));

// Force theme application
document.documentElement.setAttribute('data-theme', 'your-theme');
```

#### 2. Components Not Themed
- Ensure `nebula-theme-bridge.css` is loaded last
- Check CSS variable inheritance
- Verify component uses theme variables

#### 3. Text Readability Issues
```css
/* Add text shadows for better contrast */
[data-theme="my-theme"] .text-on-image {
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}
```

#### 4. Performance Issues
- **Avoid complex animations** on theme switch
- **Use `transform` and `opacity`** instead of layout properties
- **Limit backdrop-filter usage** (expensive on some systems)

### Debug Tools

```javascript
// Theme debugging
console.log('Current theme:', window.themeManager?.currentTheme);
console.log('Available themes:', window.themeManager?.themes);

// CSS variable inspection
const styles = getComputedStyle(document.documentElement);
console.log('Primary color:', styles.getPropertyValue('--nebula-primary'));
```

## Best Practices for Theme Creators

### 1. Color Theory
- **Use complementary colors** for accents
- **Maintain visual hierarchy** with proper contrast
- **Consider color psychology** for intended mood
- **Test with colorblind simulators**

### 2. Consistency
- **Define complete color palettes** (don't leave gaps)
- **Use systematic naming** for color variables
- **Maintain consistent spacing** and proportions
- **Follow existing patterns** in NebulaDesktop

### 3. Performance
- **Minimize CSS complexity** in theme definitions
- **Avoid heavy animations** on theme switches
- **Use efficient selectors** (avoid deep nesting)
- **Test on lower-end hardware**

### 4. Community
- **Share your themes** via GitHub or community forums
- **Document your color choices** and inspiration
- **Provide both light and dark variants** when possible
- **Consider accessibility** in all designs

## Contributing Themes

### Theme Submission Guidelines

1. **Test thoroughly** across all NebulaDesktop components
2. **Provide theme metadata**:
   ```json
   {
     "name": "Theme Name",
     "description": "Brief description",
     "author": "Your Name",
     "version": "1.0.0",
     "category": "cosmic|professional|original",
     "accessibility": "WCAG AA compliant",
     "inspiration": "What inspired this theme"
   }
   ```
3. **Include preview screenshots**
4. **Document any special features** or effects
5. **Ensure GPL/MIT compatible licensing**

### Community Resources

- **Theme Gallery**: Share screenshots and .json files
- **Color Palette Tools**: Adobe Color, Coolors.co integration
- **Accessibility Checkers**: WebAIM Contrast Checker
- **Design Inspiration**: Dribbble, Behance, Material Design

---

**Remember**: NebulaDesktop's theme system is designed to be both powerful for advanced users and accessible for beginners. Start with small modifications and gradually build more complex themes as you learn the system!

**Avoid the `themes/` directory files** - they're experimental and may cause conflicts. Stick to the main theme system for reliable results.