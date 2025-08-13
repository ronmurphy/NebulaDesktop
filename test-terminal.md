# Terminal Testing Guide

## Real Terminal Features Implemented

The NebulaTerminal now supports real file system operations and command execution. Here's what you can test:

### Built-in Commands (handled internally):
- `help` - Show all available commands
- `clear` - Clear the terminal screen
- `pwd` - Show current working directory
- `cd [path]` - Change directory (supports ~, .., absolute and relative paths)
- `ls [path]` - List directory contents
- `ll [path]` - List directory contents with detailed info
- `cat <file>` - Display file contents
- `mkdir <dir>` - Create directory
- `rmdir <dir>` - Remove directory
- `rm <file>` - Remove file
- `touch <file>` - Create empty file
- `echo <text>` - Print text
- `date` - Show current date
- `whoami` - Show current user
- `uname` - Show system info
- `history` - Show command history
- `js <code>` - Execute JavaScript code
- `debug <cmd>` - Debug commands
- `exit` - Close terminal

### System Commands (executed through system shell):
- Any other command will be executed as a real system command
- Examples: `git status`, `npm list`, `python --version`, `ls -la`, `grep`, `find`, `ps`, etc.

## Test Examples

1. **Navigate your real file system:**
   ```bash
   cd ~
   pwd
   ls
   cd Documents
   ls -la
   ```

2. **Create and manipulate files:**
   ```bash
   mkdir test-folder
   cd test-folder
   touch test.txt
   echo "Hello World" > test.txt  # (if echo redirection is implemented)
   cat test.txt
   rm test.txt
   cd ..
   rmdir test-folder
   ```

3. **Run real system commands:**
   ```bash
   git --version
   node --version
   python3 --version
   ls -la /home
   ps aux | head
   ```

4. **JavaScript execution:**
   ```bash
   js console.log("Hello from NebulaTerminal!")
   js Math.PI * 2
   js new Date().toISOString()
   ```

5. **Debug commands:**
   ```bash
   debug help
   debug vars
   debug system
   debug fs
   ```

## How it Works

1. **Built-in commands** are handled directly in JavaScript using the Electron IPC APIs
2. **File system operations** use real Node.js fs APIs through IPC
3. **System commands** are executed using Node.js child_process.spawn through IPC
4. **Path handling** uses a custom pathUtils implementation to work in the renderer process
5. **Current working directory** is tracked and used for relative path operations

The terminal now provides a real shell-like experience while running inside your Electron desktop environment!
