// Test NebulaDesktop App WITHOUT Stub Environment
// This should show errors when run without stub environment enabled

class TestNebulaApp extends NebulaApp {
    constructor() {
        super();
        console.log('TestNebulaApp created');
    }

    render() {
        const container = document.createElement('div');
        container.innerHTML = `
            <h1>Test NebulaDesktop App</h1>
            <p>This app tests NebulaDesktop APIs.</p>
            <button id="testBtn">Test Window Manager</button>
            <button id="testFS">Test File System</button>
            <div id="output"></div>
        `;

        // Test window manager
        container.querySelector('#testBtn').addEventListener('click', () => {
            try {
                const windowId = window.windowManager.createWindow({
                    title: 'Test Window',
                    width: 400,
                    height: 300
                });
                container.querySelector('#output').textContent = `Created window: ${windowId}`;
            } catch (error) {
                container.querySelector('#output').textContent = `Error: ${error.message}`;
            }
        });

        // Test file system
        container.querySelector('#testFS').addEventListener('click', async () => {
            try {
                const homeDir = window.nebula.fs.getHomeDir();
                container.querySelector('#output').textContent = `Home dir: ${homeDir}`;
            } catch (error) {
                container.querySelector('#output').textContent = `Error: ${error.message}`;
            }
        });

        return container;
    }

    afterRender() {
        console.log('TestNebulaApp rendered');
    }
}

// Try to create app instance
try {
    const testApp = new TestNebulaApp();
    console.log('App created successfully:', testApp);
} catch (error) {
    console.error('Failed to create app:', error);
}