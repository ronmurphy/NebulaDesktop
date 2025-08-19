# WindowManager Icon Support - Integration Guide

## Overview

The enhanced WindowManager.js now supports adding icons to window titlebars with three different icon types:
- **Emoji Icons**: Colorful emoji characters (📁, 🎨, 🌐)
- **Material Icons**: Google Material Design icons (language, palette, settings)
- **Web Glyphs**: Unicode symbols and special characters (⚙, ✏, ★)

## Integration Steps

### 1. Replace WindowManager.js
Replace your existing `src/js/WindowManager.js` file with the enhanced version (`WindowManager_Enhanced.js`).

### 2. Add CSS Styles
Add the icon styles from `window-icons.css` to your existing CSS files or include it as a separate stylesheet.

### 3. Include Google Material Symbols (Optional)
If you want to use Material Icons, add this to your HTML head:
```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
```

## Usage Examples

### Creating Windows with Icons

```javascript
// Emoji icon
const fileManagerWindow = windowManager.createWindow({
    title: 'File Manager',
    icon: '📁',
    iconType: 'emoji',
    width: 600,
    height: 400
});

// Material icon
const browserWindow = windowManager.createWindow({
    title: 'Web Browser',
    icon: 'language',
    iconType: 'material',
    width: 800,
    height: 600
});

// Web glyph
const settingsWindow = windowManager.createWindow({
    title: 'Settings',
    icon: '⚙',
    iconType: 'glyph',
    width: 500,
    height: 400
});

// No icon (clean appearance)
const plainWindow = windowManager.createWindow({
    title: 'Plain Window',
    // No icon specified
    width: 400,
    height: 300
});
```

### Dynamic Icon Updates

```javascript
// Change icon at runtime
windowManager.setWindowIcon(windowId, '🎨', 'emoji');
windowManager.setWindowIcon(windowId, 'palette', 'material');
windowManager.setWindowIcon(windowId, '★', 'glyph');
```

## Icon Type Reference

### Emoji Icons (`iconType: 'emoji'`)
- **Usage**: Perfect for colorful, expressive icons
- **Examples**: 📁 (folder), 🌐 (globe), 🎨 (palette), ⚡ (lightning)
- **Pros**: Colorful, universally supported, expressive
- **Cons**: May look inconsistent across different systems

### Material Icons (`iconType: 'material'`)
- **Usage**: Professional, consistent design system
- **Examples**: `language`, `folder`, `settings`, `palette`, `home`
- **Pros**: Consistent, professional, part of Material Design
- **Cons**: Requires Google Fonts, monochrome
- **Reference**: [Material Symbols Guide](https://fonts.google.com/icons)

### Web Glyphs (`iconType: 'glyph'`)
- **Usage**: Simple Unicode symbols
- **Examples**: ⚙ (gear), ✏ (pencil), ★ (star), ♠ (spade)
- **Pros**: Lightweight, no external dependencies
- **Cons**: Limited selection, may not render consistently

## Configuration Options

When creating windows, you can now specify:

```javascript
{
    title: 'Window Title',           // Window title text
    icon: 'icon_value',             // Icon content (emoji, material name, or glyph)
    iconType: 'emoji',              // Icon type: 'emoji', 'material', or 'glyph'
    width: 800,                     // Window width
    height: 600,                    // Window height
    // ... other existing options
}
```

## Backward Compatibility

The enhanced WindowManager is fully backward compatible. Existing code will continue to work without modification. Windows created without icon parameters will display normally without icons.

## CSS Customization

You can customize the icon appearance by modifying the CSS:

```css
.window-icon {
    margin-right: 8px;    /* Space between icon and title */
    font-size: 16px;      /* Icon size */
}

.window-icon.emoji-icon {
    font-size: 16px;      /* Emoji size */
}

.window-icon.material-icon {
    font-size: 18px;      /* Material icon size */
}

.window-icon.glyph-icon {
    font-size: 16px;      /* Glyph size */
}
```

## Best Practices

1. **Consistency**: Use the same icon type throughout your application for consistency
2. **Meaningful Icons**: Choose icons that clearly represent the window's purpose
3. **Size Considerations**: Icons are automatically sized to fit the titlebar
4. **Fallback**: Always provide meaningful window titles even with icons
5. **Testing**: Test icons across different browsers and systems

## Troubleshooting

**Material Icons not showing?**
- Ensure Google Material Symbols font is loaded
- Check internet connection for font loading
- Verify icon name spelling (use Google Fonts icon picker)

**Emoji rendering inconsistently?**
- This is normal across different operating systems
- Consider using Material Icons for consistency

**Icons too large/small?**
- Adjust font-size in the CSS for each icon type
- Icons automatically scale with the titlebar

## Future Enhancements

Potential future improvements:
- Custom icon image support (PNG/SVG)
- Icon color customization
- Animated icons
- Icon tooltips
- Contextual icon changes based on window state

