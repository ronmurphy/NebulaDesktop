// code-assistant.js - Standalone Code Assistant
class NebulaCodeAssistant {
    constructor() {
        this.windowId = null;
        this.currentLanguage = 'javascript';
        this.chatHistory = [];
        this.savedProjects = [];
    }
    
    /**
     * Launch the Code Assistant window
     */
    launch() {
        console.log('Launching Code Assistant...');
        
        if (!window.windowManager) {
            console.error('WindowManager not available');
            return null;
        }
        
        // Close existing window if open
        if (this.windowId) {
            window.windowManager.closeWindow(this.windowId);
            this.windowId = null;
        }
        
        this.windowId = window.windowManager.createWindow({
            title: '📝 Code Assistant',
            width: 1200,
            height: 800,
            x: 150,
            y: 50,
            resizable: true,
            maximizable: true,
            minimizable: true
        });
        
        const windowData = window.windowManager.getWindow(this.windowId);
        if (!windowData) {
            console.error('Failed to get window data');
            return null;
        }
        
        this.setupInterface(windowData.element);
        this.setupEventListeners();
        this.loadWelcomeCode();
        
        return this.windowId;
    }
    
    /**
     * Set up the code assistant interface
     */
    setupInterface(windowElement) {
        const contentArea = windowElement.querySelector('.window-content');
        contentArea.innerHTML = `
            <div class="code-assistant-container" style="
                height: 100%;
                display: flex;
                background: var(--nebula-bg-primary);
                font-family: var(--nebula-font-family);
            ">
                <!-- Code Editor Side -->
                <div class="code-editor-side" style="
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    border-right: 1px solid var(--nebula-border);
                ">
                    <!-- Code Toolbar -->
                    <div class="code-toolbar" style="
                        padding: 12px 16px;
                        border-bottom: 1px solid var(--nebula-border);
                        background: var(--nebula-surface);
                        display: flex;
                        gap: 12px;
                        align-items: center;
                        flex-wrap: wrap;
                    ">
                        <select id="languageSelect-${this.windowId}" style="
                            padding: 6px 12px;
                            border: 1px solid var(--nebula-border);
                            border-radius: var(--nebula-radius-sm);
                            background: var(--nebula-bg-primary);
                            color: var(--nebula-text-primary);
                            min-width: 120px;
                        ">
                            <option value="javascript">JavaScript</option>
                            <option value="python">Python</option>
                            <option value="html">HTML</option>
                            <option value="css">CSS</option>
                            <option value="json">JSON</option>
                            <option value="markdown">Markdown</option>
                            <option value="typescript">TypeScript</option>
                            <option value="php">PHP</option>
                            <option value="java">Java</option>
                            <option value="cpp">C++</option>
                        </select>
                        
                        <!-- File Operations -->
                        <button id="newFile-${this.windowId}" style="
                            background: var(--nebula-success);
                            color: white;
                            border: none;
                            padding: 6px 12px;
                            border-radius: var(--nebula-radius-sm);
                            cursor: pointer;
                            font-size: 12px;
                        ">📄 New</button>
                        
                        <button id="saveCode-${this.windowId}" style="
                            background: var(--nebula-info);
                            color: white;
                            border: none;
                            padding: 6px 12px;
                            border-radius: var(--nebula-radius-sm);
                            cursor: pointer;
                            font-size: 12px;
                        ">💾 Save</button>
                        
                        <button id="loadProject-${this.windowId}" style="
                            background: var(--nebula-warning);
                            color: white;
                            border: none;
                            padding: 6px 12px;
                            border-radius: var(--nebula-radius-sm);
                            cursor: pointer;
                            font-size: 12px;
                        ">📂 Load</button>
                        
                        <!-- File Automation -->
                        <div style="border-left: 1px solid var(--nebula-border); margin: 0 8px; height: 24px;"></div>
                        
                        <button id="insertCode-${this.windowId}" style="
                            background: var(--nebula-primary);
                            color: white;
                            border: none;
                            padding: 6px 12px;
                            border-radius: var(--nebula-radius-sm);
                            cursor: pointer;
                            font-size: 12px;
                        ">📁 Insert to File</button>
                        
                        <button id="formatCode-${this.windowId}" style="
                            background: var(--nebula-secondary);
                            color: white;
                            border: none;
                            padding: 6px 12px;
                            border-radius: var(--nebula-radius-sm);
                            cursor: pointer;
                            font-size: 12px;
                        ">✨ Format</button>
                        
                        <!-- AI Services -->
                        <div style="border-left: 1px solid var(--nebula-border); margin: 0 8px; height: 24px;"></div>
                        
                        <button id="openChatGPT-${this.windowId}" style="
                            background: #10a37f;
                            color: white;
                            border: none;
                            padding: 6px 12px;
                            border-radius: var(--nebula-radius-sm);
                            cursor: pointer;
                            font-size: 12px;
                        ">🤖 ChatGPT</button>
                        
                        <button id="openClaude-${this.windowId}" style="
                            background: #d97706;
                            color: white;
                            border: none;
                            padding: 6px 12px;
                            border-radius: var(--nebula-radius-sm);
                            cursor: pointer;
                            font-size: 12px;
                        ">🧠 Claude</button>
                    </div>
                    
                    <!-- Code Editor -->
                    <textarea id="codeEditor-${this.windowId}" style="
                        flex: 1;
                        border: none;
                        padding: 16px;
                        font-family: 'Consolas', 'Monaco', 'Courier New', 'SF Mono', monospace;
                        font-size: 14px;
                        background: var(--nebula-bg-primary);
                        color: var(--nebula-text-primary);
                        resize: none;
                        outline: none;
                        line-height: 1.6;
                        tab-size: 4;
                    " placeholder="// Enter your code here...
// Use the AI chat on the right for help and suggestions
// Try the quick action buttons below!"></textarea>
                </div>
                
                <!-- AI Chat Side -->
                <div class="ai-chat-side" style="
                    width: 400px;
                    display: flex;
                    flex-direction: column;
                    background: var(--nebula-surface);
                ">
                    <!-- Chat Header -->
                    <div class="chat-header" style="
                        padding: 12px 16px;
                        border-bottom: 1px solid var(--nebula-border);
                        background: var(--nebula-surface-elevated);
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                    ">
                        <h4 style="margin: 0; color: var(--nebula-text-primary); display: flex; align-items: center; gap: 8px;">
                            <span>🤖</span> AI Code Helper
                        </h4>
                        <button id="clearChat-${this.windowId}" style="
                            background: var(--nebula-danger);
                            color: white;
                            border: none;
                            padding: 4px 8px;
                            border-radius: var(--nebula-radius-sm);
                            cursor: pointer;
                            font-size: 11px;
                        ">Clear</button>
                    </div>
                    
                    <!-- Chat Messages -->
                    <div class="chat-messages" id="chatMessages-${this.windowId}" style="
                        flex: 1;
                        overflow-y: auto;
                        padding: 16px;
                    ">
                        ${this.renderWelcomeMessage()}
                    </div>
                    
                    <!-- Chat Input Area -->
                    <div class="chat-input-area" style="
                        padding: 16px;
                        border-top: 1px solid var(--nebula-border);
                    ">
                        <!-- Quick Action Buttons -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; margin-bottom: 8px;">
                            <button id="explainCode-${this.windowId}" style="
                                background: var(--nebula-info);
                                color: white;
                                border: none;
                                padding: 6px 8px;
                                border-radius: var(--nebula-radius-sm);
                                cursor: pointer;
                                font-size: 11px;
                            ">🔍 Explain</button>
                            <button id="optimizeCode-${this.windowId}" style="
                                background: var(--nebula-warning);
                                color: white;
                                border: none;
                                padding: 6px 8px;
                                border-radius: var(--nebula-radius-sm);
                                cursor: pointer;
                                font-size: 11px;
                            ">⚡ Optimize</button>
                            <button id="debugCode-${this.windowId}" style="
                                background: var(--nebula-danger);
                                color: white;
                                border: none;
                                padding: 6px 8px;
                                border-radius: var(--nebula-radius-sm);
                                cursor: pointer;
                                font-size: 11px;
                            ">🐛 Debug</button>
                        </div>
                        
                        <!-- More Quick Actions -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 8px;">
                            <button id="addComments-${this.windowId}" style="
                                background: var(--nebula-success);
                                color: white;
                                border: none;
                                padding: 6px 8px;
                                border-radius: var(--nebula-radius-sm);
                                cursor: pointer;
                                font-size: 11px;
                            ">💬 Add Comments</button>
                            <button id="generateTests-${this.windowId}" style="
                                background: var(--nebula-secondary);
                                color: white;
                                border: none;
                                padding: 6px 8px;
                                border-radius: var(--nebula-radius-sm);
                                cursor: pointer;
                                font-size: 11px;
                            ">🧪 Generate Tests</button>
                        </div>
                        
                        <!-- Chat Input -->
                        <div style="display: flex; gap: 8px;">
                            <input type="text" id="chatInput-${this.windowId}" placeholder="Ask about your code..." style="
                                flex: 1;
                                padding: 8px 12px;
                                border: 1px solid var(--nebula-border);
                                border-radius: var(--nebula-radius-sm);
                                background: var(--nebula-bg-primary);
                                color: var(--nebula-text-primary);
                            ">
                            <button id="sendChat-${this.windowId}" style="
                                background: var(--nebula-primary);
                                color: white;
                                border: none;
                                padding: 8px 12px;
                                border-radius: var(--nebula-radius-sm);
                                cursor: pointer;
                            ">📤</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Language selector
        const languageSelect = document.getElementById(`languageSelect-${this.windowId}`);
        languageSelect?.addEventListener('change', (e) => {
            this.currentLanguage = e.target.value;
            this.updateEditorPlaceholder();
            this.addChatMessage('assistant', `🔄 Switched to ${e.target.value}. Ready to help with ${e.target.value} code!`);
        });
        
        // File operations
        document.getElementById(`newFile-${this.windowId}`)?.addEventListener('click', () => {
            this.newFile();
        });
        
        document.getElementById(`saveCode-${this.windowId}`)?.addEventListener('click', () => {
            this.saveProject();
        });
        
        document.getElementById(`loadProject-${this.windowId}`)?.addEventListener('click', () => {
            this.showProjectsList();
        });
        
        // Code operations
        document.getElementById(`insertCode-${this.windowId}`)?.addEventListener('click', () => {
            this.insertCodeToFile();
        });
        
        document.getElementById(`formatCode-${this.windowId}`)?.addEventListener('click', () => {
            this.formatCode();
        });
        
        // AI services
        document.getElementById(`openChatGPT-${this.windowId}`)?.addEventListener('click', () => {
            this.openAIService('https://chat.openai.com/', 'ChatGPT');
        });
        
        document.getElementById(`openClaude-${this.windowId}`)?.addEventListener('click', () => {
            this.openAIService('https://claude.ai/', 'Claude');
        });
        
        // Quick actions
        document.getElementById(`explainCode-${this.windowId}`)?.addEventListener('click', () => {
            this.explainCurrentCode();
        });
        
        document.getElementById(`optimizeCode-${this.windowId}`)?.addEventListener('click', () => {
            this.optimizeCurrentCode();
        });
        
        document.getElementById(`debugCode-${this.windowId}`)?.addEventListener('click', () => {
            this.debugCurrentCode();
        });
        
        document.getElementById(`addComments-${this.windowId}`)?.addEventListener('click', () => {
            this.addComments();
        });
        
        document.getElementById(`generateTests-${this.windowId}`)?.addEventListener('click', () => {
            this.generateTests();
        });
        
        // Chat functionality
        const sendBtn = document.getElementById(`sendChat-${this.windowId}`);
        const chatInput = document.getElementById(`chatInput-${this.windowId}`);
        
        sendBtn?.addEventListener('click', () => {
            this.sendChatMessage();
        });
        
        chatInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendChatMessage();
            }
        });
        
        document.getElementById(`clearChat-${this.windowId}`)?.addEventListener('click', () => {
            this.clearChat();
        });
    }
    
    /**
     * Render welcome message
     */
    renderWelcomeMessage() {
        return `
            <div class="welcome-message" style="
                color: var(--nebula-text-secondary);
                text-align: center;
                padding: 20px;
            ">
                <div style="font-size: 32px; margin-bottom: 12px;">🤖</div>
                <p style="margin: 0 0 8px 0;"><strong>Welcome to Code Assistant!</strong></p>
                <p style="margin: 0 0 16px 0; font-size: 12px;">I'm here to help with your code development.</p>
                
                <div style="margin-top: 16px; padding: 12px; background: var(--nebula-surface-elevated); border-radius: var(--nebula-radius-md); font-size: 11px; text-align: left;">
                    <strong>💡 What I can help with:</strong><br>
                    • Explain your code logic<br>
                    • Optimize performance<br>
                    • Debug issues and errors<br>
                    • Add helpful comments<br>
                    • Generate test cases<br>
                    • Format and clean code<br>
                    • Answer programming questions
                </div>
                
                <div style="margin-top: 12px; font-size: 10px; color: var(--nebula-text-secondary);">
                    Use the quick action buttons or ask me anything!
                </div>
            </div>
        `;
    }
    
    /**
     * Load welcome code example
     */
    loadWelcomeCode() {
        const codeEditor = document.getElementById(`codeEditor-${this.windowId}`);
        if (!codeEditor) return;
        
        const welcomeCode = `// Welcome to Nebula Code Assistant! 🚀
// This is your coding workspace with AI assistance

function greetUser(name = "Developer") {
    const message = \`Hello, \${name}! Ready to code?\`;
    console.log(message);
    return message;
}

// Try the AI buttons on the right →
// • Click "Explain" to understand this code
// • Click "Optimize" for performance tips  
// • Click "Add Comments" for documentation
// • Ask questions in the chat below!

greetUser("Nebula User");

// TODO: Start coding your amazing project here!`;
        
        codeEditor.value = welcomeCode;
    }
    
    /**
     * Update editor placeholder based on language
     */
    updateEditorPlaceholder() {
        const codeEditor = document.getElementById(`codeEditor-${this.windowId}`);
        if (!codeEditor) return;
        
        const placeholders = {
            javascript: '// Enter your JavaScript code here...',
            python: '# Enter your Python code here...',
            html: '<!-- Enter your HTML code here -->',
            css: '/* Enter your CSS code here */',
            java: '// Enter your Java code here...',
            cpp: '// Enter your C++ code here...',
            php: '<?php // Enter your PHP code here ?>',
            typescript: '// Enter your TypeScript code here...',
            json: '{ "note": "Enter your JSON here" }',
            markdown: '# Enter your Markdown here'
        };
        
        codeEditor.placeholder = placeholders[this.currentLanguage] || '// Enter your code here...';
    }
    
    /**
     * File operations
     */
    newFile() {
        const codeEditor = document.getElementById(`codeEditor-${this.windowId}`);
        if (!codeEditor) return;
        
        if (codeEditor.value.trim() && !confirm('Create new file? Current code will be lost.')) {
            return;
        }
        
        codeEditor.value = '';
        this.updateEditorPlaceholder();
        this.addChatMessage('assistant', '📄 New file created. Ready for your code!');
    }
    
    saveProject() {
        const codeEditor = document.getElementById(`codeEditor-${this.windowId}`);
        const code = codeEditor?.value || '';
        
        if (!code.trim()) {
            this.addChatMessage('assistant', '⚠️ No code to save. Please write some code first!');
            return;
        }
        
        const projectName = prompt('Enter project name:', `${this.currentLanguage}-project-${Date.now()}`);
        if (!projectName) return;
        
        const project = {
            id: Date.now(),
            name: projectName,
            language: this.currentLanguage,
            code: code,
            timestamp: new Date().toLocaleString(),
            lines: code.split('\n').length,
            characters: code.length
        };
        
        this.savedProjects.unshift(project);
        
        // Save to localStorage
        try {
            localStorage.setItem('nebula-code-projects', JSON.stringify(this.savedProjects));
        } catch (e) {
            console.warn('Could not save to localStorage:', e);
        }
        
        this.addChatMessage('assistant', `💾 Project "${projectName}" saved successfully!\n📊 ${project.lines} lines, ${project.characters} characters`);
        console.log('Project saved:', project);
    }
    
    showProjectsList() {
        // Load from localStorage
        try {
            const saved = localStorage.getItem('nebula-code-projects');
            if (saved) {
                this.savedProjects = JSON.parse(saved);
            }
        } catch (e) {
            console.warn('Could not load from localStorage:', e);
        }
        
        if (this.savedProjects.length === 0) {
            this.addChatMessage('assistant', '📂 No saved projects found. Save your current code to create a project!');
            return;
        }
        
        let projectsList = '📂 **Saved Projects:**\n\n';
        this.savedProjects.forEach((project, index) => {
            projectsList += `${index + 1}. **${project.name}** (${project.language})\n`;
            projectsList += `   📅 ${project.timestamp}\n`;
            projectsList += `   📊 ${project.lines} lines\n\n`;
        });
        
        this.addChatMessage('assistant', projectsList + 'Type a project number to load it!');
    }
    
    /**
     * AI assistance methods
     */
    explainCurrentCode() {
        const codeEditor = document.getElementById(`codeEditor-${this.windowId}`);
        const code = codeEditor?.value || '';
        
        if (!code.trim()) {
            this.addChatMessage('assistant', '🤔 Please enter some code first, then I can explain it!');
            return;
        }
        
        this.addChatMessage('user', 'Please explain this code');
        
        const explanation = this.generateCodeExplanation(code);
        this.addChatMessage('assistant', explanation);
    }
    
    optimizeCurrentCode() {
        const codeEditor = document.getElementById(`codeEditor-${this.windowId}`);
        const code = codeEditor?.value || '';
        
        if (!code.trim()) {
            this.addChatMessage('assistant', '💡 Please enter some code first, then I can suggest optimizations!');
            return;
        }
        
        this.addChatMessage('user', 'Please optimize this code');
        
        const optimization = this.generateOptimizationSuggestions(code);
        this.addChatMessage('assistant', optimization);
    }
    
    debugCurrentCode() {
        const codeEditor = document.getElementById(`codeEditor-${this.windowId}`);
        const code = codeEditor?.value || '';
        
        if (!code.trim()) {
            this.addChatMessage('assistant', '🔍 Please enter some code first, then I can help debug it!');
            return;
        }
        
        this.addChatMessage('user', 'Help me debug this code');
        
        const debugging = this.generateDebuggingSuggestions(code);
        this.addChatMessage('assistant', debugging);
    }
    
    addComments() {
        const codeEditor = document.getElementById(`codeEditor-${this.windowId}`);
        const code = codeEditor?.value || '';
        
        if (!code.trim()) {
            this.addChatMessage('assistant', '💬 Please enter some code first, then I can add helpful comments!');
            return;
        }
        
        this.addChatMessage('user', 'Add comments to my code');
        this.addChatMessage('assistant', '💬 I would add helpful comments to explain each section of your code. Use ChatGPT/Claude buttons for real AI-powered commenting!');
    }
    
    generateTests() {
        const codeEditor = document.getElementById(`codeEditor-${this.windowId}`);
        const code = codeEditor?.value || '';
        
        if (!code.trim()) {
            this.addChatMessage('assistant', '🧪 Please enter some code first, then I can generate test cases!');
            return;
        }
        
        this.addChatMessage('user', 'Generate test cases for my code');
        this.addChatMessage('assistant', '🧪 I would generate comprehensive test cases for your functions. Use the AI service buttons for actual test generation!');
    }
    
    /**
     * Code analysis helpers
     */
    generateCodeExplanation(code) {
        const lines = code.split('\n').length;
        const hasLoops = /for\s*\(|while\s*\(|forEach|map|filter/.test(code);
        const hasFunctions = /function\s+\w+|const\s+\w+\s*=|def\s+\w+|class\s+\w+/.test(code);
        const hasConditionals = /if\s*\(|switch\s*\(|case\s|else/.test(code);
        
        let explanation = `📖 **Code Analysis:**\n\n`;
        explanation += `📊 **Structure:** ${lines} lines of ${this.currentLanguage} code\n\n`;
        
        if (hasFunctions) {
            explanation += `🔧 **Functions:** This code defines functions/methods\n`;
        }
        if (hasLoops) {
            explanation += `🔄 **Loops:** Contains iteration logic\n`;
        }
        if (hasConditionals) {
            explanation += `🤔 **Logic:** Uses conditional statements\n`;
        }
        
        explanation += `\n💡 **For detailed explanations, use the ChatGPT or Claude buttons above!**`;
        
        return explanation;
    }
    
    generateOptimizationSuggestions(code) {
        const suggestions = [
            '⚡ Consider using const/let instead of var',
            '🚀 Look for opportunities to reduce nested loops',
            '📦 Extract repeated code into reusable functions',
            '💾 Consider caching expensive calculations',
            '🔍 Use more descriptive variable names'
        ];
        
        const randomSuggestions = suggestions.sort(() => 0.5 - Math.random()).slice(0, 3);
        
        let optimization = `⚡ **Optimization Suggestions:**\n\n`;
        randomSuggestions.forEach((suggestion, index) => {
            optimization += `${index + 1}. ${suggestion}\n`;
        });
        
        optimization += `\n🤖 **For specific optimizations, use the ChatGPT or Claude buttons!**`;
        
        return optimization;
    }
    
    generateDebuggingSuggestions(code) {
        const commonIssues = [
            '🔍 Check for missing semicolons or syntax errors',
            '❓ Verify variable names are spelled correctly',
            '🔢 Check for off-by-one errors in loops',
            '🚫 Look for null/undefined reference errors',
            '📝 Add console.log statements to trace execution'
        ];
        
        const randomIssues = commonIssues.sort(() => 0.5 - Math.random()).slice(0, 3);
        
        let debugging = `🐛 **Debugging Checklist:**\n\n`;
        randomIssues.forEach((issue, index) => {
            debugging += `${index + 1}. ${issue}\n`;
        });
        
        debugging += `\n🔧 **For detailed debugging help, use the AI service buttons!**`;
        
        return debugging;
    }
    
    /**
     * Chat functionality
     */
    sendChatMessage() {
        const chatInput = document.getElementById(`chatInput-${this.windowId}`);
        const message = chatInput?.value.trim();
        
        if (!message) return;
        
        this.addChatMessage('user', message);
        chatInput.value = '';
        
        // Check for project loading
        if (/^\d+$/.test(message)) {
            const projectIndex = parseInt(message) - 1;
            if (projectIndex >= 0 && projectIndex < this.savedProjects.length) {
                this.loadProject(projectIndex);
                return;
            }
        }
        
        // Simulate AI response
        setTimeout(() => {
            const responses = [
                `🤖 I'd help with: "${message}"`,
                `💡 For this question about ${this.currentLanguage}, I'd suggest using the ChatGPT button for detailed help!`,
                `📚 That's a great ${this.currentLanguage} question! The AI service buttons can provide comprehensive answers.`,
                `🚀 I'd love to help! Use the ChatGPT or Claude buttons above for AI-powered responses.`
            ];
            const response = responses[Math.floor(Math.random() * responses.length)];
            this.addChatMessage('assistant', response);
        }, 1000);
    }
    
    addChatMessage(sender, message) {
        const chatMessages = document.getElementById(`chatMessages-${this.windowId}`);
        if (!chatMessages) return;
        
        // Remove welcome message if it exists
        const welcome = chatMessages.querySelector('.welcome-message');
        if (welcome && sender === 'user') welcome.remove();
        
        const messageEl = document.createElement('div');
        messageEl.style.cssText = `
            margin-bottom: 12px;
            padding: 10px 14px;
            border-radius: var(--nebula-radius-md);
            background: ${sender === 'user' ? 'var(--nebula-primary)' : 'var(--nebula-surface-elevated)'};
            color: ${sender === 'user' ? 'white' : 'var(--nebula-text-primary)'};
            font-size: 13px;
            line-height: 1.4;
            white-space: pre-wrap;
            border: ${sender === 'assistant' ? '1px solid var(--nebula-border)' : 'none'};
        `;
        
        messageEl.textContent = message;
        chatMessages.appendChild(messageEl);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Store in history
        this.chatHistory.push({ sender, message, timestamp: Date.now() });
    }
    
    clearChat() {
        const chatMessages = document.getElementById(`chatMessages-${this.windowId}`);
        if (!chatMessages) return;
        
        chatMessages.innerHTML = this.renderWelcomeMessage();
        this.chatHistory = [];
        console.log('Chat cleared');
    }
    
    /**
     * Utility methods
     */
    loadProject(index) {
        const project = this.savedProjects[index];
        if (!project) return;
        
        const codeEditor = document.getElementById(`codeEditor-${this.windowId}`);
        const languageSelect = document.getElementById(`languageSelect-${this.windowId}`);
        
        if (codeEditor) codeEditor.value = project.code;
        if (languageSelect) languageSelect.value = project.language;
        
        this.currentLanguage = project.language;
        this.addChatMessage('assistant', `📂 Loaded project "${project.name}"\n📊 ${project.lines} lines of ${project.language} code`);
    }
    
    formatCode() {
        const codeEditor = document.getElementById(`codeEditor-${this.windowId}`);
        const code = codeEditor?.value || '';
        
        if (!code.trim()) {
            this.addChatMessage('assistant', '✨ No code to format. Please write some code first!');
            return;
        }
        
        // Basic formatting (just as an example)
        let formattedCode = code
            .split('\n')
            .map(line => line.trim())
            .join('\n')
            .replace(/\n\n\n+/g, '\n\n'); // Remove excess blank lines
        
        codeEditor.value = formattedCode;
        this.addChatMessage('assistant', '✨ Code formatted! For advanced formatting, use the AI service buttons.');
    }
    
    insertCodeToFile() {
        const codeEditor = document.getElementById(`codeEditor-${this.windowId}`);
        const code = codeEditor?.value || '';
        
        if (!code.trim()) {
            this.addChatMessage('assistant', '📁 No code to insert. Please write some code first!');
            return;
        }
        
        // TODO: Implement actual file insertion using Electron APIs
        console.log('Would insert code to file:', { code, language: this.currentLanguage });
        this.addChatMessage('assistant', `📁 Ready to insert ${this.currentLanguage} code to file!\n\n🔧 **File automation features:**\n• File picker dialog\n• Insert at cursor position\n• Create new file if needed\n• Apply proper formatting\n\n*This connects to your file system APIs.*`);
    }
    
    openAIService(url, serviceName) {
        console.log(`Opening ${serviceName}...`);
        window.open(url, '_blank');
        this.addChatMessage('assistant', `🚀 Opening ${serviceName} in a new tab. You can copy your code and get AI-powered help!`);
    }
    
    /**
     * Clean up when window is closed
     */
    cleanup() {
        this.windowId = null;
        console.log('Code Assistant cleaned up');
    }
}

// Export for global use
window.NebulaCodeAssistant = NebulaCodeAssistant;
window.nebulaCodeAssistant = new NebulaCodeAssistant();