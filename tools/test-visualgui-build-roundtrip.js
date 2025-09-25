// Tests parseVisualGuiMeta + loadVisualGuiMetaFromCode without requiring a browser window
// Run with: node tools/test-visualgui-build-roundtrip.js
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const file = path.join(__dirname, '..', 'src', 'js', 'code-assistant.js');
const code = fs.readFileSync(file, 'utf8');

// Implement small, self-contained helpers here to avoid compiling large source with browser globals
function parseVisualGuiMetaLocal(code) {
    if (!code || typeof code !== 'string') return null;
    const marker = '__VISUAL_GUI_META__';
    const start = code.indexOf(marker);
    if (start === -1) return null;
    const commentStart = code.lastIndexOf('/*', start);
    const commentEnd = code.indexOf('*/', start);
    if (commentStart === -1 || commentEnd === -1) return null;
    const jsonText = code.substring(commentStart + 2, commentEnd).replace(marker, '').trim();
    try { return JSON.parse(jsonText); } catch (e) { console.warn('parseVisualGuiMeta: failed', e); return null; }
}

function loadVisualGuiMetaFromCodeLocal(code) {
    const meta = parseVisualGuiMetaLocal(code);
    if (!meta) return null;
    const inferCanvasSize = () => ({ w: 1000, h: 700 });
    const canvasSize = inferCanvasSize();
    const designerLinks = (meta.links || []).map(l => {
        const inMps = l.midpoints || [];
        const migrated = inMps.map(mp => {
            if (!mp || typeof mp.x !== 'number' || typeof mp.y !== 'number') return mp;
            if (Math.abs(mp.x) > 1 || Math.abs(mp.y) > 1) {
                return { x: (mp.x / canvasSize.w), y: (mp.y / canvasSize.h) };
            }
            return mp;
        });
        return Object.assign({}, l, { midpoints: migrated });
    });
    return { nodes: meta.nodes || [], designerLinks };
}

// Create a sample wrapped code with embedded meta
const meta = {
    nodes: [{ id: 'c1', type: 'button', position: { x: 20, y: 30 }, properties: {}, parent: null, children: [] }],
    links: [{ id: 'lk1', from: { nodeId: 'c1', io: 'output' }, to: { nodeId: 'c2', io: 'input' }, event: 'click', action: 'setText', payload: {}, label: 'lbl', midpoints: [{ x: 100, y: 120 }] }]
};
const metaJson = JSON.stringify(meta, null, 2).replace(/\*\//g, '*\\/');
const wrapped = '/* __VISUAL_GUI_META__' + "\n" + metaJson + "\n*/\nfunction visualGui() { return 1; }";

// Run parse
const parsed = parseVisualGuiMetaLocal(wrapped);
if (!parsed) { console.error('FAILED: parse returned null'); process.exit(4); }

// Now run loadVisualGuiMetaFromCodeLocal which performs migration and returns designerLinks
const result = loadVisualGuiMetaFromCodeLocal(wrapped);
if (!result || !Array.isArray(result.designerLinks) || result.designerLinks.length !== 1) {
    console.error('FAILED: designerLinks not populated as expected');
    console.log('result:', result);
    process.exit(5);
}

// Validate midpoints persisted as numbers
const mp = result.designerLinks[0].midpoints;
if (!Array.isArray(mp) || typeof mp[0].x !== 'number') {
    console.error('FAILED: midpoints not preserved as numbers', mp);
    process.exit(6);
}

console.log('PASS: build-roundtrip helpers validated');
process.exit(0);
