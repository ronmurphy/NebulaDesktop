# NebulaDesktop AI Assistant Systems

## Philosophy

NebulaDesktop takes a unique approach to AI integration - instead of managing API keys and rate limits, we embed AI services directly through webviews. This provides seamless access to multiple AI platforms while maintaining the security and functionality of their native web interfaces.

**Core Principle**: *Self-hosting development environment where you can build NebulaDesktop using NebulaDesktop itself.*

## Assistant Applications

### 1. Code Assistant (`code-assistant.js`)

The flagship AI-powered development environment - a complete IDE with Monaco editor, template system, and integrated AI chat.

**Key Features:**
- **Monaco Editor Integration**: Full-featured code editor with syntax highlighting
- **Multi-Language Support**: JavaScript, Python, HTML, CSS, TypeScript, etc.
- **Template System**: Pre-built app templates for rapid development
- **JavaScript Execution**: Live code execution with output panel
- **File System Integration**: Real file operations through Electron IPC
- **Multi-Tab Support**: Work on multiple files simultaneously
- **AI Integration**: Side-by-side chat with multiple AI services

**Architecture:**
```javascript
class NebulaCodeAssistant {
    constructor() {
        this.windowId = null;
        this.monacoEditor = null;
        this.currentLanguage = 'javascript';
        this.currentAIService = 'claude';
        this.webview = null;
        this.openFiles = new Map(); // Multi-file support
        this.templates = {}; // Template system
    }
}
```

**Template System:**
Located in `src/Templates/`:
- **NebulaApp-Single.js**: Single window application template
- **NebulaApp-Tabbed.js**: Multi-tab application template  
- **NebulaApp-PWA.js**: Progressive Web App template

**AI Service Integration:**
```javascript
this.aiServices = {
    claude: { name: 'Claude', url: 'https://claude.ai', icon: '🧠' },
    chatgpt: { name: 'ChatGPT', url: 'https://chat.openai.com', icon: '💬' },
    manus: { name: 'Manus', url: 'https://manus.im', icon: '🤖' },
    perplexity: { name: 'Perplexity', url: 'https://perplexity.ai', icon: '🔍' },
    copilot: { name: 'Copilot', url: 'https://copilot.microsoft.com', icon: '🚀' },
    gemini: { name: 'Gemini', url: 'https://gemini.google.com', icon: '💎' },
    bolt: { name: 'Bolt', url: 'https://bolt.new', icon: '⚡' }
};
```

**Development Workflow:**
1. Open Code Assistant in NebulaDesktop
2. Load or create code files
3. Use AI chat for code assistance
4. Execute JavaScript live for testing
5. Save changes to NebulaDesktop source files
6. Reload NebulaDesktop to see changes
7. *Repeat - you're now developing NebulaDesktop with NebulaDesktop!*

**Features Breakdown:**

**Editor Features:**
- Syntax highlighting for 20+ languages
- Code folding and minimap
- Symbol navigation and go-to-definition
- Multi-cursor editing
- Bracket matching and auto-completion

**File Operations:**
```javascript
// Real file system integration
async saveFile(forceDialog = false) {
    const content = this.monacoEditor.getValue();
    await window.nebula.fs.writeFile(this.currentFilePath, content);
}

async openFile() {
    const filePath = await this.showFileDialog();
    const content = await window.nebula.fs.readFile(filePath);
    this.monacoEditor.setValue(content);
}
```

**JavaScript Execution:**
```javascript
executeJS(code) {
    try {
        // Safe execution context with console capture
        const result = Function('"use strict"; return (' + code + ')')();
        this.writeOutput(`Result: ${JSON.stringify(result)}`, 'success');
    } catch (error) {
        this.writeOutput(`Error: ${error.message}`, 'error');
    }
}
```

**AI Integration Patterns:**
- **Explain Code**: Copy code with explanation prompt to AI
- **Optimize Code**: Request performance improvements
- **Debug Code**: Get debugging assistance
- **Generate Tests**: Create unit tests for code
- **Paste from AI**: Extract code from AI responses

### 2. General AI Assistant (`assistant.js`)

A dedicated AI chat interface with advanced features and service switching.

**Key Features:**
- **Full-Height Panel**: Maximizes chat real estate
- **Pin Functionality**: Keep assistant always visible
- **Full View Mode**: Expand to 25%, 33%, or 50% of screen width
- **Service Switching**: Quick switching between AI platforms
- **Loading States**: Proper webview loading feedback

**Architecture:**
```javascript
class NebulaAssistant {
    constructor() {
        this.panel = null;
        this.webview = null;
        this.isOpen = false;
        this.isPinned = false;
        this.isFullView = false;
        this.currentAI = 'claude';
    }
}
```

**Panel Management:**
```javascript
// Configuration persisted to localStorage
this.config = {
    isPinned: false,
    isFullView: false,
    fullViewSize: '33', // 25%, 33%, or 50%
    currentAI: 'claude'
};
```

**Webview Integration:**
```javascript
createWebview() {
    this.webview = document.createElement('webview');
    this.webview.src = this.aiServices[this.currentAI].url;
    this.webview.style.cssText = `
        width: 100%;
        height: 100%;
        border: none;
    `;
    
    // Handle webview events
    this.webview.addEventListener('dom-ready', () => {
        this.isLoading = false;
        this.updateLoadingState();
    });
}
```

**View Modes:**
- **Hidden**: Assistant panel closed
- **Standard**: Left-side panel, auto-hide on blur
- **Pinned**: Always visible, stays open
- **Full View**: Expanded width options (25%, 33%, 50%)

### 3. Art Assistant (`art-assistant.js`)

Currently a shell application planned for image generation and creative AI tools.

**Planned Features:**
- Integration with AI image generation services
- Canvas tools for image editing
- Gallery management for generated art
- Style transfer and AI art tools
- Creative prompt assistance

**Current Status:**
```javascript
// Shell implementation - ready for development
class NebulaArtAssistant {
    constructor() {
        // TODO: Implement art generation features
        // TODO: Add image editing capabilities
        // TODO: Integrate with art generation APIs/services
    }
}
```

## Integration Architecture

### WindowManager Integration

All assistants are fully integrated with the WindowManager system:

```javascript
// Code Assistant creates a window with special configuration
const windowId = window.windowManager.createWindow({
    title: '💻 Code Assistant Pro',
    width: 1200,
    height: 800,
    resizable: true,
    app: this
});
```

### Layout Patterns

**Split View Layout** (Code Assistant):
```
┌─────────────────┬─────────────────┐
│                 │                 │
│   Monaco Editor │   AI Chat       │
│                 │   (Webview)     │
│                 │                 │
├─────────────────┼─────────────────┤
│  Output Panel   │   AI Controls   │
└─────────────────┴─────────────────┘
```

**Panel Layout** (General Assistant):
```
┌─────────┬─────────────────────────┐
│         │                         │
│   AI    │   Main Desktop          │
│  Chat   │   Applications          │
│(Webview)│                         │
│         │                         │
└─────────┴─────────────────────────┘
```

### Webview Security

All AI integrations use Electron's webview with security considerations:

```javascript
// Webview configuration
<webview 
    src="https://claude.ai"
    nodeintegration="false"
    contextIsolation="true"
    webSecurity="true"
    allowpopups="false">
</webview>
```

## Development Workflow Examples

### Self-Hosting Development

1. **Open Code Assistant** in NebulaDesktop
2. **Navigate to NebulaDesktop source**: `cd ~/NebulaDesktop/src`
3. **Open source file**: Load `js/WindowManager.js`
4. **Chat with Claude**: Ask for feature improvements
5. **Implement changes**: Edit code in Monaco editor
6. **Test live**: Use JavaScript execution for testing
7. **Save changes**: Write back to source file
8. **Reload NebulaDesktop**: See changes immediately
9. **Document changes**: Use AI to help write documentation

### Typical AI Assistance Patterns

**Code Explanation:**
```javascript
// User copies code to AI:
"Explain this JavaScript class and how it manages windows"
```

**Bug Debugging:**
```javascript
// User shares error with AI:
"This window drag function isn't working properly, here's the code..."
```

**Feature Development:**
```javascript
// User collaborates with AI:
"Help me add window snapping to this WindowManager class"
```

## File Structure

```
src/
├── js/
│   ├── code-assistant.js    # Main development IDE
│   ├── assistant.js         # General AI chat
│   └── art-assistant.js     # Creative AI tools (shell)
├── css/
│   ├── code-assistant.css   # IDE styling
│   └── assistant.css        # Chat panel styling
└── Templates/
    ├── NebulaApp-Single.js  # Single window template
    ├── NebulaApp-Tabbed.js  # Multi-tab template
    └── NebulaApp-PWA.js     # PWA template
```

## Configuration

### Code Assistant Settings

```javascript
// Saved to localStorage
const config = {
    chatWidth: 33,           // Chat panel width percentage
    outputVisible: false,    // Output panel visibility
    currentLanguage: 'javascript',
    currentAIService: 'claude',
    openFiles: [],          // Multi-tab file state
    editorSettings: {
        fontSize: 14,
        theme: 'vs-dark',
        minimap: true
    }
};
```

### Assistant Panel Settings

```javascript
// Saved to localStorage
const config = {
    isPinned: false,        // Always visible
    isFullView: false,      // Expanded mode
    fullViewSize: '33',     // Width percentage
    currentAI: 'claude',    // Active AI service
    position: 'left'        // Panel position
};
```

## Advanced Features

### Template System

Templates provide starting points for rapid development:

**Loading Templates:**
```javascript
async loadTemplate(templateKey) {
    const template = this.templates[templateKey];
    const response = await fetch(template.path);
    const content = await response.text();
    this.monacoEditor.setValue(content);
}
```

**Template Categories:**
- **App Templates**: Complete application boilerplates
- **Widget Templates**: Desktop widget starters
- **Component Templates**: Reusable UI components

### Multi-Tab File Management

```javascript
// File tab system
this.openFiles = new Map(); // fileId -> fileData
this.activeFileId = null;

createNewTab(filePath = null, content = null) {
    const fileId = `file-${this.nextFileId++}`;
    const fileData = {
        id: fileId,
        path: filePath,
        name: fileName,
        content: content,
        hasUnsavedChanges: false
    };
    this.openFiles.set(fileId, fileData);
}
```

### AI Service Abstraction

```javascript
// Unified AI service switching
switchAIService(serviceId) {
    this.currentAIService = serviceId;
    const service = this.aiServices[serviceId];
    this.webview.src = service.url;
    this.updateServiceIndicator(service);
}
```

## Troubleshooting

### Common Issues

1. **Webview Not Loading**: Check network connectivity and service URLs
2. **Monaco Editor Issues**: Verify CDN access for Monaco libraries
3. **File Save Errors**: Check file permissions and path validity
4. **Template Loading**: Ensure template files exist in `src/Templates/`

### Debug Tools

```javascript
// Code Assistant debug mode
this.debug = true;
console.log('Code Assistant Debug:', message);

// File operation debugging
async debugFileOp(operation, ...args) {
    console.log(`File operation: ${operation}`, args);
    try {
        const result = await window.nebula.fs[operation](...args);
        console.log('Success:', result);
        return result;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}
```

## Future Enhancements

### Planned Features
- **Art Assistant**: Complete image generation and editing suite
- **Code Completion**: AI-powered autocomplete integration
- **Voice Assistant**: Speech-to-text for hands-free coding
- **Collaborative Editing**: Multi-user development sessions
- **Plugin System**: Extensible AI tool ecosystem

### Integration Possibilities
- **Terminal Assistant**: AI help within the terminal
- **File Manager AI**: Intelligent file organization
- **Browser Assistant**: AI-powered web navigation
- **System Assistant**: OS-level AI automation

## Contributing

The assistant systems are designed for easy extension:

1. **New AI Services**: Add to `aiServices` configuration
2. **Custom Templates**: Create new templates in `src/Templates/`
3. **Enhanced Features**: Extend existing assistant classes
4. **New Assistants**: Follow the established patterns

The self-hosting development workflow means you can improve the assistants using the assistants themselves - a truly recursive development experience that embodies the NebulaDesktop philosophy.