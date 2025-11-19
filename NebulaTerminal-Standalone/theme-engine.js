// Theme Engine - Popular terminal themes for customization
// Includes themes loved by Linux ricers: Dracula, Nord, Gruvbox, Tokyo Night, etc.

class ThemeEngine {
    constructor() {
        this.themes = this.getThemes();
        this.currentTheme = null;
    }

    getThemes() {
        return {
            'nebula-green': {
                name: 'Nebula Green',
                author: 'Nebula Terminal',
                background: '#1a1a1a',
                foreground: '#00ff00',
                cursor: '#00ff00',
                cursorAccent: '#1a1a1a',
                selection: 'rgba(0, 255, 0, 0.3)',
                black: '#000000',
                red: '#ff6b6b',
                green: '#00ff00',
                yellow: '#ffeb3b',
                blue: '#66d9ef',
                magenta: '#f92672',
                cyan: '#a6e22e',
                white: '#f8f8f2',
                brightBlack: '#555555',
                brightRed: '#ff8787',
                brightGreen: '#5fff5f',
                brightYellow: '#ffff87',
                brightBlue: '#87d7ff',
                brightMagenta: '#ff87ff',
                brightCyan: '#87ffaf',
                brightWhite: '#ffffff'
            },

            'dracula': {
                name: 'Dracula',
                author: 'Zeno Rocha',
                background: '#282a36',
                foreground: '#f8f8f2',
                cursor: '#f8f8f0',
                cursorAccent: '#282a36',
                selection: 'rgba(68, 71, 90, 0.5)',
                black: '#21222c',
                red: '#ff5555',
                green: '#50fa7b',
                yellow: '#f1fa8c',
                blue: '#bd93f9',
                magenta: '#ff79c6',
                cyan: '#8be9fd',
                white: '#f8f8f2',
                brightBlack: '#6272a4',
                brightRed: '#ff6e6e',
                brightGreen: '#69ff94',
                brightYellow: '#ffffa5',
                brightBlue: '#d6acff',
                brightMagenta: '#ff92df',
                brightCyan: '#a4ffff',
                brightWhite: '#ffffff'
            },

            'nord': {
                name: 'Nord',
                author: 'Arctic Ice Studio',
                background: '#2e3440',
                foreground: '#d8dee9',
                cursor: '#d8dee9',
                cursorAccent: '#2e3440',
                selection: 'rgba(76, 86, 106, 0.5)',
                black: '#3b4252',
                red: '#bf616a',
                green: '#a3be8c',
                yellow: '#ebcb8b',
                blue: '#81a1c1',
                magenta: '#b48ead',
                cyan: '#88c0d0',
                white: '#e5e9f0',
                brightBlack: '#4c566a',
                brightRed: '#bf616a',
                brightGreen: '#a3be8c',
                brightYellow: '#ebcb8b',
                brightBlue: '#81a1c1',
                brightMagenta: '#b48ead',
                brightCyan: '#8fbcbb',
                brightWhite: '#eceff4'
            },

            'gruvbox-dark': {
                name: 'Gruvbox Dark',
                author: 'Pavel Pertsev',
                background: '#282828',
                foreground: '#ebdbb2',
                cursor: '#ebdbb2',
                cursorAccent: '#282828',
                selection: 'rgba(80, 73, 69, 0.5)',
                black: '#282828',
                red: '#cc241d',
                green: '#98971a',
                yellow: '#d79921',
                blue: '#458588',
                magenta: '#b16286',
                cyan: '#689d6a',
                white: '#a89984',
                brightBlack: '#928374',
                brightRed: '#fb4934',
                brightGreen: '#b8bb26',
                brightYellow: '#fabd2f',
                brightBlue: '#83a598',
                brightMagenta: '#d3869b',
                brightCyan: '#8ec07c',
                brightWhite: '#ebdbb2'
            },

            'tokyo-night': {
                name: 'Tokyo Night',
                author: 'enkia',
                background: '#1a1b26',
                foreground: '#c0caf5',
                cursor: '#c0caf5',
                cursorAccent: '#1a1b26',
                selection: 'rgba(51, 65, 92, 0.5)',
                black: '#15161e',
                red: '#f7768e',
                green: '#9ece6a',
                yellow: '#e0af68',
                blue: '#7aa2f7',
                magenta: '#bb9af7',
                cyan: '#7dcfff',
                white: '#a9b1d6',
                brightBlack: '#414868',
                brightRed: '#f7768e',
                brightGreen: '#9ece6a',
                brightYellow: '#e0af68',
                brightBlue: '#7aa2f7',
                brightMagenta: '#bb9af7',
                brightCyan: '#7dcfff',
                brightWhite: '#c0caf5'
            },

            'catppuccin-mocha': {
                name: 'Catppuccin Mocha',
                author: 'Catppuccin',
                background: '#1e1e2e',
                foreground: '#cdd6f4',
                cursor: '#f5e0dc',
                cursorAccent: '#1e1e2e',
                selection: 'rgba(88, 91, 112, 0.5)',
                black: '#45475a',
                red: '#f38ba8',
                green: '#a6e3a1',
                yellow: '#f9e2af',
                blue: '#89b4fa',
                magenta: '#f5c2e7',
                cyan: '#94e2d5',
                white: '#bac2de',
                brightBlack: '#585b70',
                brightRed: '#f38ba8',
                brightGreen: '#a6e3a1',
                brightYellow: '#f9e2af',
                brightBlue: '#89b4fa',
                brightMagenta: '#f5c2e7',
                brightCyan: '#94e2d5',
                brightWhite: '#a6adc8'
            },

            'one-dark': {
                name: 'One Dark',
                author: 'Atom',
                background: '#282c34',
                foreground: '#abb2bf',
                cursor: '#528bff',
                cursorAccent: '#ffffff',
                selection: 'rgba(67, 76, 94, 0.5)',
                black: '#282c34',
                red: '#e06c75',
                green: '#98c379',
                yellow: '#e5c07b',
                blue: '#61afef',
                magenta: '#c678dd',
                cyan: '#56b6c2',
                white: '#abb2bf',
                brightBlack: '#5c6370',
                brightRed: '#e06c75',
                brightGreen: '#98c379',
                brightYellow: '#e5c07b',
                brightBlue: '#61afef',
                brightMagenta: '#c678dd',
                brightCyan: '#56b6c2',
                brightWhite: '#ffffff'
            },

            'monokai': {
                name: 'Monokai',
                author: 'Wimer Hazenberg',
                background: '#272822',
                foreground: '#f8f8f2',
                cursor: '#f8f8f0',
                cursorAccent: '#272822',
                selection: 'rgba(73, 72, 62, 0.5)',
                black: '#272822',
                red: '#f92672',
                green: '#a6e22e',
                yellow: '#f4bf75',
                blue: '#66d9ef',
                magenta: '#ae81ff',
                cyan: '#a1efe4',
                white: '#f8f8f2',
                brightBlack: '#75715e',
                brightRed: '#f92672',
                brightGreen: '#a6e22e',
                brightYellow: '#f4bf75',
                brightBlue: '#66d9ef',
                brightMagenta: '#ae81ff',
                brightCyan: '#a1efe4',
                brightWhite: '#f9f8f5'
            },

            'solarized-dark': {
                name: 'Solarized Dark',
                author: 'Ethan Schoonover',
                background: '#002b36',
                foreground: '#839496',
                cursor: '#839496',
                cursorAccent: '#002b36',
                selection: 'rgba(7, 54, 66, 0.5)',
                black: '#073642',
                red: '#dc322f',
                green: '#859900',
                yellow: '#b58900',
                blue: '#268bd2',
                magenta: '#d33682',
                cyan: '#2aa198',
                white: '#eee8d5',
                brightBlack: '#002b36',
                brightRed: '#cb4b16',
                brightGreen: '#586e75',
                brightYellow: '#657b83',
                brightBlue: '#839496',
                brightMagenta: '#6c71c4',
                brightCyan: '#93a1a1',
                brightWhite: '#fdf6e3'
            },

            'material': {
                name: 'Material',
                author: 'Mattia Astorino',
                background: '#263238',
                foreground: '#eeffff',
                cursor: '#ffcc00',
                cursorAccent: '#000000',
                selection: 'rgba(128, 203, 196, 0.2)',
                black: '#000000',
                red: '#e53935',
                green: '#91b859',
                yellow: '#ffb62c',
                blue: '#6182b8',
                magenta: '#7c4dff',
                cyan: '#39adb5',
                white: '#ffffff',
                brightBlack: '#44484a',
                brightRed: '#ff5370',
                brightGreen: '#c3e88d',
                brightYellow: '#ffcb6b',
                brightBlue: '#82aaff',
                brightMagenta: '#c792ea',
                brightCyan: '#89ddff',
                brightWhite: '#ffffff'
            },

            'synthwave': {
                name: 'Synthwave \'84',
                author: 'Robb Owen',
                background: '#241b2f',
                foreground: '#f0eff1',
                cursor: '#ff7edb',
                cursorAccent: '#241b2f',
                selection: 'rgba(255, 126, 219, 0.2)',
                black: '#241b2f',
                red: '#ff2e97',
                green: '#72f1b8',
                yellow: '#fede5d',
                blue: '#03edf9',
                magenta: '#ff7edb',
                cyan: '#00d9d9',
                white: '#f0eff1',
                brightBlack: '#495495',
                brightRed: '#ff2e97',
                brightGreen: '#72f1b8',
                brightYellow: '#fede5d',
                brightBlue: '#03edf9',
                brightMagenta: '#ff7edb',
                brightCyan: '#00d9d9',
                brightWhite: '#f0eff1'
            },

            'cyberpunk': {
                name: 'Cyberpunk',
                author: 'Nebula',
                background: '#000b1e',
                foreground: '#00ffff',
                cursor: '#ff00ff',
                cursorAccent: '#000b1e',
                selection: 'rgba(0, 255, 255, 0.2)',
                black: '#000000',
                red: '#ff003c',
                green: '#00ff9f',
                yellow: '#fffc58',
                blue: '#00d9ff',
                magenta: '#ff00ff',
                cyan: '#00ffff',
                white: '#ffffff',
                brightBlack: '#121212',
                brightRed: '#ff0055',
                brightGreen: '#00ffcc',
                brightYellow: '#ffff00',
                brightBlue: '#00f0ff',
                brightMagenta: '#ff00ff',
                brightCyan: '#00ffff',
                brightWhite: '#ffffff'
            }
        };
    }

    getTheme(name) {
        return this.themes[name] || this.themes['nebula-green'];
    }

    getAllThemes() {
        return Object.keys(this.themes).map(key => ({
            id: key,
            ...this.themes[key]
        }));
    }

    applyTheme(terminalInstance, themeName) {
        const theme = this.getTheme(themeName);
        this.currentTheme = themeName;

        terminalInstance.options.theme = {
            background: theme.background,
            foreground: theme.foreground,
            cursor: theme.cursor,
            cursorAccent: theme.cursorAccent,
            selection: theme.selection,
            black: theme.black,
            red: theme.red,
            green: theme.green,
            yellow: theme.yellow,
            blue: theme.blue,
            magenta: theme.magenta,
            cyan: theme.cyan,
            white: theme.white,
            brightBlack: theme.brightBlack,
            brightRed: theme.brightRed,
            brightGreen: theme.brightGreen,
            brightYellow: theme.brightYellow,
            brightBlue: theme.brightBlue,
            brightMagenta: theme.brightMagenta,
            brightCyan: theme.brightCyan,
            brightWhite: theme.brightWhite
        };

        // Also update body background to match
        document.body.style.backgroundColor = theme.background;

        // Set CSS variables for inline apps (nfm, ngit, etc.)
        const root = document.documentElement;
        root.style.setProperty('--theme-background', theme.background);
        root.style.setProperty('--theme-foreground', theme.foreground);
        root.style.setProperty('--theme-cursor', theme.cursor);
        root.style.setProperty('--theme-selection', theme.selection);
        root.style.setProperty('--theme-green', theme.green);
        root.style.setProperty('--theme-bright-green', theme.brightGreen);
        root.style.setProperty('--theme-cyan', theme.cyan);
        root.style.setProperty('--theme-bright-cyan', theme.brightCyan);
        root.style.setProperty('--theme-blue', theme.blue);
        root.style.setProperty('--theme-bright-blue', theme.brightBlue);
        root.style.setProperty('--theme-yellow', theme.yellow);
        root.style.setProperty('--theme-bright-yellow', theme.brightYellow);
        root.style.setProperty('--theme-red', theme.red);
        root.style.setProperty('--theme-bright-red', theme.brightRed);
        root.style.setProperty('--theme-magenta', theme.magenta);
        root.style.setProperty('--theme-bright-magenta', theme.brightMagenta);
        root.style.setProperty('--theme-black', theme.black);
        root.style.setProperty('--theme-bright-black', theme.brightBlack);
        root.style.setProperty('--theme-white', theme.white);
        root.style.setProperty('--theme-bright-white', theme.brightWhite);

        return theme;
    }

    createCustomTheme(name, colors) {
        this.themes[name] = {
            name: name,
            author: 'Custom',
            ...colors
        };
        return this.themes[name];
    }
}

// Global theme engine instance
window.themeEngine = new ThemeEngine();
