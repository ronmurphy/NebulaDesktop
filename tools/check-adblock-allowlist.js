#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const FILE = path.resolve(__dirname, '..', 'adblock-lists.json');
const ENSURE = [
  '@@||claude.ai^',
  '@@||chat.openai.com^',
  '@@||chat.openai.com^$popup',
  '@@||manus.im^',
  '@@||perplexity.ai^',
  '@@||copilot.microsoft.com^',
  '@@||copilot.microsoft.com^$popup',
  '@@||gemini.google.com^',
  '@@||bolt.new^',
  '@@||poe.com^',
  '@@||llmstudio.ai^'
];

function load() {
  try {
    const raw = fs.readFileSync(FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read adblock file:', e.message);
    process.exit(2);
  }
}

function save(obj) {
  try {
    fs.writeFileSync(FILE, JSON.stringify(obj, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to write adblock file:', e.message);
    process.exit(3);
  }
}

function ensure() {
  const data = load();
  if (!Array.isArray(data.filters)) {
    console.error('adblock-lists.json missing "filters" array');
    process.exit(4);
  }

  let changed = false;
  ENSURE.forEach(entry => {
    if (!data.filters.includes(entry)) {
      console.log('Adding missing allow entry:', entry);
      data.filters.unshift(entry);
      changed = true;
    }
  });

  if (changed) {
    save(data);
    console.log('adblock-lists.json updated');
  } else {
    console.log('All required entries present');
  }
}

ensure();
