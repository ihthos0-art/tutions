const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

test('Salma and Khadija have distinct site routes and worker IDs', () => {
  const menu = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const worker = fs.readFileSync(path.join(root, 'src/index.js'), 'utf8');
  assert.match(menu, /salma-khadija\.html\?student=salma/);
  assert.match(menu, /salma-khadija\.html\?student=khadija/);
  assert.match(worker, /'salma'/);
  assert.match(worker, /'khadija'/);
});
