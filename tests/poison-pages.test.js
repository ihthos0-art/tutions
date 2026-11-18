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

test('admin panel loads game room controls', () => {
  const html = fs.readFileSync(path.join(root, 'public/parent.html'), 'utf8');
  assert.match(html, /assets\/js\/game-admin\.js/);
  const js = fs.readFileSync(path.join(root, 'public/assets/js/game-admin.js'), 'utf8');
  assert.match(js, /data-tab/);
  assert.match(js, /game-room/);
  assert.match(js, /\/api\/game\/start/);
  assert.match(js, /\/api\/game\/reset/);
  assert.match(js, /\/api\/game\/force-start/);
});

test('a hit re-renders before the boom so the animation survives', () => {
  const js = fs.readFileSync(path.join(root, 'public/assets/js/poison-game.js'), 'utf8');
  assert.match(js, /game = data\.game;\s*render\(\);\s*if \(data\.result && data\.result\.hit\) boom\(index\);/);
  assert.match(js, /if \(game && !pollTimer\) startPolling\(\);/);
  assert.doesNotMatch(js, /\n  poll\(\);\n  startPolling\(\);\n\}\)\(\);/);
});

test('demo page is public, bot-driven, and reuses the game styling', () => {
  const html = fs.readFileSync(path.join(root, 'public/poison-demo.html'), 'utf8');
  assert.match(html, /assets\/js\/poison-demo\.js/);
  assert.match(html, /assets\/css\/poison\.css/);
  assert.doesNotMatch(html, /student-auth\.js/);
  const js = fs.readFileSync(path.join(root, 'public/assets/js/poison-demo.js'), 'utf8');
  assert.match(js, /Bot Amina/);
  assert.match(js, /Not your turn/);
  assert.match(js, /AudioContext/);
});

test('boards show a varied item pool and colorful tiles', () => {
  const game = fs.readFileSync(path.join(root, 'public/assets/js/poison-game.js'), 'utf8');
  const demo = fs.readFileSync(path.join(root, 'public/assets/js/poison-demo.js'), 'utf8');
  for (const src of [game, demo]) {
    assert.match(src, /ITEM_POOL/);
    assert.match(src, /itemFor\(/);
    assert.match(src, /🦄/);
  }
  assert.doesNotMatch(game, /itemFor\(game\.id,\s*index\)/, 'one item per game, not per cell');
  assert.match(demo, /gameItem = itemFor\(salt\)/);
  const css = fs.readFileSync(path.join(root, 'public/assets/css/poison.css'), 'utf8');
  assert.match(css, /--tile/);
  assert.match(css, /nth-child\(6n\+1\)/);
  assert.match(css, /\.cell--own::after/);
});

test('game pages self-host fonts and use the arcade theme tokens', () => {
  const fonts = fs.readFileSync(path.join(root, 'public/assets/css/fonts.css'), 'utf8');
  assert.match(fonts, /Baloo 2/);
  assert.match(fonts, /Nunito/);
  const css = fs.readFileSync(path.join(root, 'public/assets/css/poison.css'), 'utf8');
  assert.match(css, /--bg-plum/);
  assert.match(css, /radial-gradient/);
  assert.match(css, /prefers-reduced-motion/);
  for (const page of ['public/poison.html', 'public/poison-demo.html']) {
    const html = fs.readFileSync(path.join(root, page), 'utf8');
    assert.match(html, /assets\/css\/fonts\.css/);
  }
});

test('game copy carries no em-dashes', () => {
  const files = ['public/poison.html', 'public/poison-demo.html',
    'public/assets/js/poison-game.js', 'public/assets/js/poison-demo.js'];
  for (const file of files) {
    const text = fs.readFileSync(path.join(root, file), 'utf8');
    assert.ok(!text.includes('—'), 'em-dash in ' + file);
  }
});

test('number cross page wires a 10x6 board with 2 second holds and a 3 second countdown', () => {
  const html = fs.readFileSync(path.join(root, 'public/number-cross.html'), 'utf8');
  assert.match(html, /assets\/js\/number-cross\.js/);
  assert.match(html, /assets\/css\/number-cross\.css/);
  assert.match(html, /assets\/css\/fonts\.css/);
  const js = fs.readFileSync(path.join(root, 'public/assets/js/number-cross.js'), 'utf8');
  assert.match(js, /var COLS = 10;/);
  assert.match(js, /var ROWS = 6;/);
  assert.match(js, /var HOLD_MS = 2000;/);
  assert.match(js, /var COUNTDOWN_MS = 3000;/);
  assert.match(js, /Team Sun/);
  assert.match(js, /Team Wave/);
  assert.match(js, /crossed\.size >= CELLS/);
  assert.ok(!js.includes('—'), 'em-dash in number-cross.js');
});
