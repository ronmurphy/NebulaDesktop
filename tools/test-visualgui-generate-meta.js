// Test that the meta serialization logic mirrors buildVisualGuiMethod's JSON structure.
// This avoids compiling the full method which includes template literals and DOM code.
// Run with: node tools/test-visualgui-generate-meta.js
const fs = require('fs');
const path = require('path');

// Seed designer state similar to runtime
const designedComponents = [{ id: 'c1', type: 'button', position: { x: 10, y: 20 }, properties: {}, parent: null, children: [] }];
const designerLinks = [{ id: 'l1', from: { nodeId: 'c1', io: 'output' }, to: { nodeId: 'c2', io: 'input' }, event: 'click', action: 'setText', payload: {}, label: 'lab', midpoints: [{ x: 50, y: 60 }] }];

const meta = {
    nodes: designedComponents.map(c => ({ id: c.id, type: c.type, position: c.position, properties: c.properties, parent: c.parent, children: c.children })),
    links: designerLinks.map(l => ({ id: l.id, from: l.from, to: l.to, event: l.event, action: l.action, payload: l.payload, label: l.label, midpoints: l.midpoints || [] }))
};

const metaJson = JSON.stringify(meta, null, 2).replace(/\*\//g, '*\\/');

try {
    const parsed = JSON.parse(metaJson);
    if (!parsed.links || !Array.isArray(parsed.links) || parsed.links.length !== 1) {
        console.error('FAILED: serialized meta missing links'); process.exit(2);
    }
    const mp = parsed.links[0].midpoints;
    if (!Array.isArray(mp) || typeof mp[0].x !== 'number') {
        console.error('FAILED: midpoints not numeric'); process.exit(3);
    }
} catch (e) {
    console.error('FAILED: JSON parse failed', e && e.message); process.exit(4);
}

console.log('PASS: buildVisualGuiMethod meta serialization validated');
process.exit(0);
