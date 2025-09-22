# NebulaQBasic - QBasic for NebulaDesktop

## Vision
Bring authentic QBasic programming experience to NebulaDesktop through a dedicated xterm.js-based terminal application powered by the qbjc compiler.

## Why QBasic?
- **Educational**: Simple, readable syntax perfect for beginners
- **Nostalgic**: Recreates the classic QBasic experience from the 90s
- **Authentic**: Uses real QBasic syntax, not a "BASIC-like" language
- **Powerful**: Can run classic games and programs like NIBBLES.BAS
- **Progressive**: Gateway to learning JavaScript through transpilation

## Technical Architecture

### Core Components
1. **NebulaQBasicTerminal App**: xterm.js-based terminal application
2. **qbjc Integration**: QBasic to JavaScript compiler
3. **File System Integration**: Load/save .BAS files
4. **NebulaDesktop Integration**: Window management, file browser

### Dependencies
- `qbjc`: QBasic compiler (npm install qbjc)
- `xterm`: Terminal emulator (npm install xterm)
- `xterm-addon-fit`: Auto-resize addon

## Implementation Phases

### Phase 1: Core Terminal (Week 1)
- [ ] Create NebulaQBasicTerminal.js app structure
- [ ] Integrate xterm.js for terminal interface
- [ ] Basic qbjc integration (compile and run simple programs)
- [ ] File loading/saving for .BAS files

### Phase 2: Enhanced Features (Week 2)
- [ ] QBasic syntax highlighting in terminal
- [ ] Command history and auto-completion
- [ ] Error handling and debugging
- [ ] Program state persistence

### Phase 3: IDE Features (Week 3)
- [ ] Integrated editor for .BAS files
- [ ] Syntax checking and validation
- [ ] Example programs and templates
- [ ] Help system and documentation

### Phase 4: Advanced Features (Week 4)
- [ ] Graphics mode support (if qbjc supports it)
- [ ] Sound and multimedia
- [ ] Multi-program execution
- [ ] Performance optimizations

## Key Features

### Terminal Interface
- Full xterm.js terminal emulation
- VT100-compatible for qbjc compatibility
- Proper cursor control, colors, and screen manipulation
- Keyboard input handling

### QBasic Support
- Full QBasic/QuickBASIC syntax support via qbjc
- Variables, arrays, user-defined types
- Control structures (IF/THEN, FOR/NEXT, WHILE, etc.)
- Functions and subroutines
- File I/O operations
- String and numeric operations

### File Management
- Load .BAS files from NebulaDesktop filesystem
- Save programs with syntax highlighting
- Import/export capabilities
- Program library with examples

### Educational Features
- Syntax help and reference
- Example programs (games, utilities, demos)
- Progressive difficulty levels
- JavaScript output viewing (optional)

## Integration with NebulaDesktop

### App Registration
- Register as "QBasic Terminal" in app launcher
- Icon: 💾 or 🟦 (QBasic blue screen reference)
- Category: Development/Education

### File Associations
- .BAS files open in QBasic Terminal
- Context menu integration
- Drag-and-drop support

### Window Management
- Resizable terminal window
- Multiple terminal instances
- Tab support for multiple programs

## Sample Programs

### Hello World
```basic
PRINT "Hello, NebulaQBasic!"
PRINT "Welcome to QBasic programming!"
END
```

### Number Guessing Game
```basic
RANDOMIZE TIMER
secret = INT(RND * 100) + 1
PRINT "I'm thinking of a number between 1 and 100"

DO
    INPUT "Your guess: ", guess
    IF guess < secret THEN
        PRINT "Too low!"
    ELSEIF guess > secret THEN
        PRINT "Too high!"
    ELSE
        PRINT "You got it!"
        EXIT DO
    END IF
LOOP

PRINT "Thanks for playing!"
```

### Classic NIBBLES.BAS
- Full snake game implementation
- Demonstrates graphics and game programming
- Authentic QBasic gaming experience

## Success Metrics

### User Experience
- [ ] Users can write and run QBasic programs within 5 minutes
- [ ] Classic programs like NIBBLES.BAS run correctly
- [ ] Intuitive interface for beginners
- [ ] Smooth performance with xterm.js

### Technical
- [ ] Full qbjc feature compatibility
- [ ] Proper error handling and debugging
- [ ] File system integration works seamlessly
- [ ] No conflicts with existing NebulaDesktop apps

## Challenges & Solutions

### Challenge: xterm.js Integration
**Solution**: Study qbjc's BrowserExecutor implementation and adapt for NebulaDesktop's window system.

### Challenge: File System Access
**Solution**: Use NebulaDesktop's window.nebula.fs API for loading/saving .BAS files.

### Challenge: Performance
**Solution**: qbjc compiles to optimized JavaScript, xterm.js is well-optimized for web use.

### Challenge: User Education
**Solution**: Include tutorials, examples, and progressive difficulty learning path.

## Future Enhancements

### Graphics Mode
- Canvas-based graphics rendering
- Sprite and animation support
- Screen mode switching

### Multiplayer
- Networked QBasic games
- Collaborative coding

### Extensions
- Custom QBasic commands for NebulaDesktop integration
- Hardware access (sensors, etc.)
- Mobile-responsive design

## Conclusion

NebulaQBasic will provide the most authentic QBasic experience possible in a modern web environment, serving as both an educational tool and a nostalgic trip back to the golden age of BASIC programming. By leveraging qbjc's professional compiler and xterm.js's terminal emulation, we can deliver a premium QBasic development environment that feels both familiar and modern.

---

*Document created: September 22, 2025*
*Next: Begin Phase 1 implementation*</content>
<parameter name="filePath">/home/brad/Documents/NebulaDesktop/NebulaQBasic.md