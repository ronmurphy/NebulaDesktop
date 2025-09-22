// Test NebulaDesktop App with Stub Environment
class TestNebulaApp extends NebulaApp {
    constructor() {
        super();
        console.log('TestNebulaApp created');
    }

    render() {
        const container = document.createElement('div');
        container.innerHTML = `
            <h1>Test NebulaDesktop App</h1>
            <p>This app tests the stub environment functionality.</p>
            <button id="testBtn">Test Window Manager</button>
            <button id="testFS">Test File System</button>
        `;

        // Test window manager
        container.querySelector('#testBtn').addEventListener('click', () => {
            const windowId = window.windowManager.createWindow({
                title: 'Test Window',
                width: 400,
                height: 300
            });
            console.log('Created test window:', windowId);
        });

        // Test file system
        container.querySelector('#testFS').addEventListener('click', async () => {
            try {
                const homeDir = window.nebula.fs.getHomeDir();
                console.log('Home directory:', homeDir);

                const exists = await window.nebula.fs.exists('/test/path');
                console.log('Path exists:', exists);
            } catch (error) {
                console.error('File system error:', error.message);
            }
        });

        return container;
    }

    afterRender() {
        console.log('TestNebulaApp rendered and ready');
    }
}

// Create and run the app
const testApp = new TestNebulaApp();
console.log('Test app instance:', testApp);