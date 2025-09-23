# NebulaQBasic - QBasic Integration for NebulaDesktop

This directory contains the QBasic integration for NebulaDesktop, powered by the qbjc compiler.

## Files

- `QBTerminal.js` - Main QBasic Terminal application with Monaco editor and xterm.js terminal
- `README.md` - This documentation file
- `CREDITS.md` - Attribution and licensing information

## Features

### QBTerminal App
- **Monaco Editor**: Syntax-highlighted QBasic code editing
- **xterm.js Terminal**: Authentic terminal experience for QBasic programs
- **qbjc Compiler**: Professional QBasic to JavaScript compilation
- **File Operations**: Open/Save .BAS files
- **Real-time Execution**: Run QBasic programs with proper I/O

### Supported QBasic Features
- PRINT, INPUT, CLS statements
- FOR/NEXT loops
- IF/THEN/ELSE conditionals
- SUB/FUNCTION procedures
- Arrays (DIM)
- DATA/READ statements
- Built-in functions (VAL, STR$, etc.)
- File I/O operations
- Graphics commands (limited browser support)

## Usage

1. Launch the QBTerminal app from NebulaDesktop
2. Type or paste QBasic code in the editor
3. Press F5 or click Run to execute
4. View output in the terminal below

## Example Program

```basic
CLS
PRINT "Hello from NebulaQBasic!"
PRINT "This runs on the real qbjc compiler"
PRINT

FOR i = 1 TO 5
    PRINT "Count: "; i
NEXT i

PRINT "Program completed!"
END
```

## Integration Notes

- Uses Apache-2.0 licensed qbjc compiler
- Integrates with NebulaDesktop window management
- File operations need further integration with NebulaDesktop APIs
- Terminal resizing and theming matches NebulaDesktop design

## Future Enhancements

- Full NebulaDesktop file system integration
- QBasic syntax highlighting in Monaco
- Multiple terminal sessions
- Debug support
- Graphics mode support