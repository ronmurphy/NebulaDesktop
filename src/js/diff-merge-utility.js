// Enhanced Diff/Merge Utility for Monaco Editor
// This module provides diff/merge functionality for your Code Assistant

class DiffMergeUtility {
    constructor(codeAssistant) {
        this.codeAssistant = codeAssistant;
        this.windowManager = window.windowManager;
    }

    /**
     * Main function to merge source with patch and create new Monaco tab
     * @param {string} sourceFilePath - Path to source file
     * @param {string} patchFilePath - Path to patch file
     * @param {string} outputFileName - Name for the new merged file tab
     */
    async consoleMergeDiff(sourceFilePath, patchFilePath, outputFileName = 'merged.js') {
        try {
            console.log('Starting diff merge operation...');
            console.log('Source:', sourceFilePath);
            console.log('Patch:', patchFilePath);

            // Step 1: Read source file content
            const sourceContent = await this.readFileContent(sourceFilePath);
            if (!sourceContent) {
                throw new Error(`Failed to read source file: ${sourceFilePath}`);
            }

            // Step 2: Read patch file content  
            const patchContent = await this.readFileContent(patchFilePath);
            if (!patchContent) {
                throw new Error(`Failed to read patch file: ${patchFilePath}`);
            }

            // Step 3: Apply the merge/patch
            const mergedContent = await this.applyPatch(sourceContent, patchContent);

            // Step 4: Create new Monaco tab with merged content
            await this.createMergedTab(outputFileName, mergedContent);

            console.log('✅ Diff merge completed successfully!');
            return mergedContent;

        } catch (error) {
            console.error('❌ Diff merge failed:', error);
            this.showError(`Diff merge failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Read file content - supports both filesystem and Monaco tabs
     */
    async readFileContent(filePath) {
        try {
            // First try to read from filesystem
            if (window.nebula?.fs) {
                const exists = await window.nebula.fs.exists(filePath);
                if (exists) {
                    return await window.nebula.fs.readFile(filePath);
                }
            }

            // If not found in filesystem, try to find in Monaco tabs
            const tabContent = this.getContentFromMonacoTab(filePath);
            if (tabContent !== null) {
                return tabContent;
            }

            // Fallback: try to read as URL or relative path
            const response = await fetch(filePath);
            if (response.ok) {
                return await response.text();
            }

            return null;
        } catch (error) {
            console.error(`Failed to read file ${filePath}:`, error);
            return null;
        }
    }

    /**
     * Get content from Monaco tab by filename
     */
    getContentFromMonacoTab(fileName) {
        // This would need to be integrated with your tab system
        // For now, we'll use the current Monaco editor content if filename matches
        if (this.codeAssistant?.monacoEditor) {
            const currentPath = this.codeAssistant.currentFilePath;
            if (currentPath && currentPath.includes(fileName)) {
                return this.codeAssistant.monacoEditor.getValue();
            }
        }
        return null;
    }

    /**
     * Apply patch to source content using different merge strategies
     */
    async applyPatch(sourceContent, patchContent) {
        // Detect patch format and apply appropriate merge strategy
        if (this.isUnifiedDiffFormat(patchContent)) {
            return this.applyUnifiedDiff(sourceContent, patchContent);
        } else if (this.isSimpleDiffFormat(patchContent)) {
            return this.applySimpleDiff(sourceContent, patchContent);
        } else {
            // Treat as replacement content or merge content
            return this.applyContentMerge(sourceContent, patchContent);
        }
    }

    /**
     * Check if patch is in unified diff format
     */
    isUnifiedDiffFormat(patchContent) {
        return patchContent.includes('@@') && 
               (patchContent.includes('+++') || patchContent.includes('---'));
    }

    /**
     * Check if patch is in simple diff format
     */
    isSimpleDiffFormat(patchContent) {
        const lines = patchContent.split('\n');
        return lines.some(line => line.startsWith('+') || line.startsWith('-'));
    }

    /**
     * Apply unified diff format patch
     */
    applyUnifiedDiff(sourceContent, patchContent) {
        try {
            const sourceLines = sourceContent.split('\n');
            const patchLines = patchContent.split('\n');
            const result = [...sourceLines];

            let sourceLineNum = 0;
            let i = 0;

            while (i < patchLines.length) {
                const line = patchLines[i];

                // Find hunk headers (@@)
                if (line.startsWith('@@')) {
                    const hunkMatch = line.match(/@@ -(\d+),?(\d+)? \+(\d+),?(\d+)? @@/);
                    if (hunkMatch) {
                        const oldStart = parseInt(hunkMatch[1]) - 1; // 0-based
                        const newStart = parseInt(hunkMatch[3]) - 1; // 0-based
                        sourceLineNum = oldStart;

                        i++;
                        // Process the hunk
                        while (i < patchLines.length && !patchLines[i].startsWith('@@')) {
                            const hunkLine = patchLines[i];
                            
                            if (hunkLine.startsWith('+')) {
                                // Add new line
                                result.splice(sourceLineNum, 0, hunkLine.substring(1));
                                sourceLineNum++;
                            } else if (hunkLine.startsWith('-')) {
                                // Remove line
                                result.splice(sourceLineNum, 1);
                            } else if (hunkLine.startsWith(' ')) {
                                // Context line - move forward
                                sourceLineNum++;
                            }
                            i++;
                        }
                        continue;
                    }
                }
                i++;
            }

            return result.join('\n');
        } catch (error) {
            console.error('Unified diff application failed:', error);
            throw new Error('Failed to apply unified diff: ' + error.message);
        }
    }

    /**
     * Apply simple diff format (+/- lines)
     */
    applySimpleDiff(sourceContent, patchContent) {
        try {
            const sourceLines = sourceContent.split('\n');
            const patchLines = patchContent.split('\n');
            const result = [...sourceLines];

            // Simple strategy: apply additions and removals in order
            for (const patchLine of patchLines) {
                if (patchLine.startsWith('+')) {
                    const addContent = patchLine.substring(1);
                    result.push(addContent);
                } else if (patchLine.startsWith('-')) {
                    const removeContent = patchLine.substring(1);
                    const index = result.indexOf(removeContent);
                    if (index !== -1) {
                        result.splice(index, 1);
                    }
                }
            }

            return result.join('\n');
        } catch (error) {
            console.error('Simple diff application failed:', error);
            throw new Error('Failed to apply simple diff: ' + error.message);
        }
    }

    /**
     * Apply content merge (intelligent merging)
     */
    applyContentMerge(sourceContent, patchContent) {
        try {
            // Strategy 1: If patch looks like complete replacement
            if (this.isCompleteReplacement(patchContent)) {
                return patchContent;
            }

            // Strategy 2: Smart merge - append functions/classes from patch
            if (this.isJavaScriptContent(sourceContent) && this.isJavaScriptContent(patchContent)) {
                return this.mergeJavaScriptContent(sourceContent, patchContent);
            }

            // Strategy 3: Simple append
            return sourceContent + '\n\n// === MERGED CONTENT ===\n' + patchContent;

        } catch (error) {
            console.error('Content merge failed:', error);
            throw new Error('Failed to merge content: ' + error.message);
        }
    }

    /**
     * Check if patch is a complete file replacement
     */
    isCompleteReplacement(patchContent) {
        // Heuristic: if patch has typical file structure markers
        return patchContent.includes('function ') || 
               patchContent.includes('class ') ||
               patchContent.includes('export ') ||
               patchContent.includes('import ') ||
               patchContent.includes('<!DOCTYPE') ||
               patchContent.includes('<html');
    }

    /**
     * Check if content is JavaScript
     */
    isJavaScriptContent(content) {
        return content.includes('function ') || 
               content.includes('class ') ||
               content.includes('const ') ||
               content.includes('let ') ||
               content.includes('=>');
    }

    /**
     * Intelligent JavaScript content merging
     */
    mergeJavaScriptContent(sourceContent, patchContent) {
        try {
            // Extract functions and classes from both source and patch
            const sourceFunctions = this.extractJavaScriptFunctions(sourceContent);
            const patchFunctions = this.extractJavaScriptFunctions(patchContent);

            // Merge strategy: patch functions override source functions
            const mergedFunctions = { ...sourceFunctions, ...patchFunctions };

            // Rebuild the content
            let result = sourceContent;
            
            // Add new functions from patch
            for (const [name, code] of Object.entries(patchFunctions)) {
                if (!sourceFunctions[name]) {
                    result += '\n\n' + code;
                } else {
                    // Replace existing function
                    const sourceFunc = sourceFunctions[name];
                    result = result.replace(sourceFunc, code);
                }
            }

            return result;
        } catch (error) {
            console.error('JavaScript merge failed:', error);
            // Fallback to simple append
            return sourceContent + '\n\n// === MERGED CONTENT ===\n' + patchContent;
        }
    }

    /**
     * Extract JavaScript functions and classes
     */
    extractJavaScriptFunctions(content) {
        const functions = {};
        
        // Simple regex to extract functions and classes
        const functionRegex = /(?:function\s+(\w+)|class\s+(\w+)|const\s+(\w+)\s*=|\w+\s*:\s*function)/g;
        const lines = content.split('\n');
        
        let match;
        while ((match = functionRegex.exec(content)) !== null) {
            const functionName = match[1] || match[2] || match[3];
            if (functionName) {
                // Find the complete function/class definition
                const startIndex = content.indexOf(match[0]);
                const functionCode = this.extractCompleteFunction(content, startIndex);
                if (functionCode) {
                    functions[functionName] = functionCode;
                }
            }
        }

        return functions;
    }

    /**
     * Extract complete function definition from starting position
     */
    extractCompleteFunction(content, startIndex) {
        try {
            let braceCount = 0;
            let inString = false;
            let stringChar = '';
            let result = '';
            let foundOpenBrace = false;

            for (let i = startIndex; i < content.length; i++) {
                const char = content[i];
                result += char;

                // Handle strings
                if ((char === '"' || char === "'" || char === '`') && content[i-1] !== '\\') {
                    if (!inString) {
                        inString = true;
                        stringChar = char;
                    } else if (char === stringChar) {
                        inString = false;
                        stringChar = '';
                    }
                }

                if (!inString) {
                    if (char === '{') {
                        braceCount++;
                        foundOpenBrace = true;
                    } else if (char === '}') {
                        braceCount--;
                        if (foundOpenBrace && braceCount === 0) {
                            break;
                        }
                    }
                }
            }

            return foundOpenBrace ? result : '';
        } catch (error) {
            console.error('Function extraction failed:', error);
            return '';
        }
    }

    /**
     * Create new Monaco tab with merged content
     */
    async createMergedTab(fileName, content) {
        try {
            if (!this.codeAssistant?.monacoEditor) {
                throw new Error('Monaco editor not available');
            }

            // For now, we'll replace the current editor content
            // In a full implementation, you'd create a new tab
            const confirmed = confirm(`Create new tab "${fileName}" with merged content?\nThis will replace current editor content.`);
            
            if (confirmed) {
                this.codeAssistant.monacoEditor.setValue(content);
                this.codeAssistant.currentFilePath = fileName;
                this.codeAssistant.hasUnsavedChanges = true;
                this.codeAssistant.updateWindowTitle();

                // Log success
                this.codeAssistant.writeOutput(`✅ Created merged tab: ${fileName}`, 'success');
                console.log(`Created merged tab: ${fileName}`);
            }
        } catch (error) {
            console.error('Failed to create merged tab:', error);
            throw error;
        }
    }

    /**
     * Show error message to user
     */
    showError(message) {
        if (this.codeAssistant?.writeOutput) {
            this.codeAssistant.writeOutput(`❌ ${message}`, 'error');
        }
        console.error(message);
        alert(message);
    }

    /**
     * Utility method to test the merge functionality
     */
    async testMerge() {
        try {
            // Create test source content
            const testSource = `// Test source file
function originalFunction() {
    console.log("Original function");
    return "original";
}

class OriginalClass {
    constructor() {
        this.name = "original";
    }
}`;

            // Create test patch content
            const testPatch = `// Test patch additions
function newFunction() {
    console.log("New function added");
    return "new";
}

function originalFunction() {
    console.log("Updated original function");
    return "updated";
}`;

            // Apply merge
            const merged = await this.applyContentMerge(testSource, testPatch);
            
            console.log('Test merge result:', merged);
            
            if (this.codeAssistant?.monacoEditor) {
                this.codeAssistant.monacoEditor.setValue(merged);
                this.codeAssistant.writeOutput('✅ Test merge completed successfully!', 'success');
            }
            
            return merged;
        } catch (error) {
            console.error('Test merge failed:', error);
            this.showError('Test merge failed: ' + error.message);
        }
    }
}

// Integration with your Code Assistant
if (window.NebulaCodeAssistant) {
    NebulaCodeAssistant.prototype.initializeDiffMerge = function() {
        this.diffMerge = new DiffMergeUtility(this);
        
        // Add UI button for merge functionality
        const toolbar = document.querySelector(`#languageSelect-${this.windowId}`)?.parentElement;
        if (toolbar) {
            const mergeBtn = document.createElement('button');
            mergeBtn.id = `diffMergeBtn-${this.windowId}`;
            mergeBtn.className = 'toolbar-btn';
            mergeBtn.title = 'Diff & Merge Files';
            mergeBtn.innerHTML = `
                <span class="material-symbols-outlined">merge</span>
                <span>Merge</span>
            `;
            
            mergeBtn.addEventListener('click', async () => {
                await this.showDiffMergeDialog();
            });
            
            // Insert after save button
            const saveBtn = document.getElementById(`saveBtn-${this.windowId}`);
            if (saveBtn) {
                saveBtn.parentElement.insertBefore(mergeBtn, saveBtn.nextSibling);
            }
        }
    };

    NebulaCodeAssistant.prototype.showDiffMergeDialog = async function() {
        const sourceFile = prompt('Enter source file path:', this.currentFilePath || '');
        if (!sourceFile) return;

        const patchFile = prompt('Enter patch file path:');
        if (!patchFile) return;

        const outputName = prompt('Enter output file name:', 'merged.js');
        if (!outputName) return;

        try {
            await this.diffMerge.consoleMergeDiff(sourceFile, patchFile, outputName);
        } catch (error) {
            console.error('Merge operation failed:', error);
        }
    };

    // Add the consoleMergeDiff method directly to NebulaCodeAssistant
    NebulaCodeAssistant.prototype.consoleMergeDiff = async function(sourceFile, patchFile, outputName = 'merged.js') {
        if (!this.diffMerge) {
            this.initializeDiffMerge();
        }
        return await this.diffMerge.consoleMergeDiff(sourceFile, patchFile, outputName);
    };
}

// Export the utility
window.DiffMergeUtility = DiffMergeUtility;