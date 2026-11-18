const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

test('poison page loads auth, game module, and styles', () => {
  const html = fs.readFileSync(path.join(root, 'public/poison.html'), 'utf8');
  assert.match(html, /assets\/js\/student-auth\.js/);
  assert.match(html, /assets\/js\/poison-game\.js/);
  assert.match(html, /assets\/css\/poison\.css/);
});

test('game module has pin, placement, polling, boom, and leaderboard', () => {
  const js = fs.readFileSync(path.join(root, 'public/assets/js/poison-game.js'), 'utf8');
  for (const needle of [
    '/api/game/join', '/api/game/poison', '/api/game/pick', '/api/game/state',
    'AudioContext', 'boom', 'leaderboard', 'Not your turn', 'ownPoisons'
  ]) {
    assert.ok(js.includes(needle), 'missing ' + needle);
  }
});

test('boom animation and grey-out turn styling exist', () => {
  const css = fs.readFileSync(path.join(root, 'public/assets/css/poison.css'), 'utf8');
  assert.match(css, /@keyframes boom/);
  assert.match(css, /\.locked/);
  assert.match(css, /\.cell--poison/);
});

test('student pages include the game entry and it links to /poison', () => {
  const js = fs.readFileSync(path.join(root, 'public/assets/js/game-entry.js'), 'utf8');
  assert.match(js, /\/poison/);
  assert.match(js, /Game mode/);
  const html = fs.readFileSync(path.join(root, 'public/nafis.html'), 'utf8');
  assert.match(html, /assets\/js\/game-entry\.js/);
});
