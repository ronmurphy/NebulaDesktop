// Quick round-trip test for Visual GUI metadata
// Run with: node tools/test-visualgui-meta-roundtrip.js
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'src', 'js', 'code-assistant.js');
const code = fs.readFileSync(file, 'utf8');

function parseVisualGuiMeta(code) {
    if (!code || typeof code !== 'string') return null;
    const marker = '__VISUAL_GUI_META__';
    const start = code.indexOf(marker);
    if (start === -1) return null;

    const commentStart = code.lastIndexOf('/*', start);
    const commentEnd = code.indexOf('*/', start);
    if (commentStart === -1 || commentEnd === -1) return null;

    const jsonText = code.substring(commentStart + 2, commentEnd).replace(marker, '').trim();
    try {
        return JSON.parse(jsonText);
    } catch (e) {
        console.warn('parseVisualGuiMeta: failed to parse JSON meta', e);
        return null;
    }
}

// Create a fake meta and embed it into a method string
const meta = {
    nodes: [{ id: 'comp_1', type: 'input', position: { x: 10, y: 20 }, properties: {}, parent: null, children: [] }],
    links: [{ id: 'link_1', from: { nodeId: 'comp_1', io: 'output' }, to: { nodeId: 'comp_2', io: 'input' }, event: 'click', action: 'setText', payload: { kind: 'sourceValue' }, label: 'Test label', midpoints: [{ x: 120, y: 150 }] }]
};

const metaJson = JSON.stringify(meta, null, 2).replace(/\*\//g, '*\\/');
const wrapped = '/* __VISUAL_GUI_META__' + "\n" + metaJson + "\n*/\nfunction visualGui() { return 1; }";

// Now parse it using the same function
const parsed = parseVisualGuiMeta(wrapped);
if (!parsed) { console.error('FAILED: Could not parse embedded meta'); process.exit(2); }

// Validate
function deepEqual(a,b){ return JSON.stringify(a)===JSON.stringify(b); }
if (!deepEqual(parsed, meta)) {
    console.error('FAILED: parsed meta does not match original');
    console.log('original:', JSON.stringify(meta, null, 2));
    console.log('parsed  :', JSON.stringify(parsed, null, 2));
    process.exit(3);
}

console.log('PASS: meta parsed and matches original');
process.exit(0);
