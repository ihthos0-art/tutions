const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

test('Salma and Khadija share one combined menu entry', () => {
  const menu = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(menu, /<a class="name-btn" href="salma-khadija\.html">Salma &amp; Khadija<\/a>/);
  assert.equal(/salma-khadija\.html\?student=/.test(menu), false);
});

test('public menu keeps roster private and their shared page preserves separate sign-ins', () => {
  const menu = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');
  const page = fs.readFileSync(path.join(root, 'public/salma-khadija.html'), 'utf8');
  const renderer = fs.readFileSync(path.join(root, 'public/assets/js/student-subjects.js'), 'utf8');
  const worker = fs.readFileSync(path.join(root, 'src/index.js'), 'utf8');
  assert.doesNotMatch(menu, /Salma|Khadija/);
  assert.match(page, /data-student="salma-khadija"/);
  assert.match(renderer, /requestedId === 'khadija' \? 'khadija' : 'salma'/);
  assert.match(renderer, /combinedPage && \['salma', 'khadija'/);
  assert.match(worker, /id: 'salma'/);
  assert.match(worker, /id: 'khadija'/);
});
