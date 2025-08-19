note: as how this seems to be an issue with window creation, here is the flow for how it works.

The NebulaDesktop App Pattern:

Constructor → calls init()
init() → createWindow() + loadApp(windowId, this)
render() → returns DOM element for window content
WindowManager puts the rendered content in .window-content

also...

the correct WindowManager pattern:

createWindow(options) → returns windowId
loadApp(windowId, this) → calls app.render()
render() → returns DOM element for .window-content


existing app patterns:

Constructor calls init()
init() creates window and loads app
render() builds and returns the UI
Proper getTitle(), getIcon(), cleanup() methods