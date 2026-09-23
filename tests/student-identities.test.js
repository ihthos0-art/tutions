const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

// Salma and Khadija share one page and one combined menu entry. They were briefly
// split into two per-girl links (?student=salma|khadija); that was reverted, so the
// menu must carry the combined entry and must not still offer the split ones.
test('Salma and Khadija share one combined menu entry', () => {
  const menu = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(menu, /<a class="name-btn" href="salma-khadija\.html">Salma &amp; Khadija<\/a>/);
  assert.equal(/salma-khadija\.html\?student=/.test(menu), false,
    'a per-girl link survives in the menu; it was reverted to one combined entry');
});

// The per-girl links are gone from the menu, but the ids must stay in the worker:
// records already stored under 'salma' and 'khadija' would become unreachable, and
// those two URLs still work for anyone who bookmarked them.
test('the worker still accepts the per-girl ids', () => {
  const worker = fs.readFileSync(path.join(root, 'src/index.js'), 'utf8');
  assert.match(worker, /'salma'/);
  assert.match(worker, /'khadija'/);
});

// The combined entry means STUDENT === 'salma-khadija', and that id is whitelisted
// in the worker. If it is missing from this guard, a KV record for it is injected
// straight over the page's static Microbiome worksheet and ELA passage.
test('the combined id is protected from KV injection too', () => {
  const loader = fs.readFileSync(path.join(root, 'homework-loader.js'), 'utf8');
  const guard = loader.match(/var isSalmaKhadija = \(([^)]*)\)/);
  assert.ok(guard, 'the isSalmaKhadija guard is gone from homework-loader.js');
  ['salma', 'khadija', 'salma-khadija'].forEach(id => {
    assert.ok(guard[1].indexOf("'" + id + "'") !== -1,
      "the guard does not cover '" + id + "', so KV content can overwrite the static page");
  });
});
