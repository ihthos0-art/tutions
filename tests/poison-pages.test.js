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
  assert.match(js, /\/api\/admin\/games\/poison\/start/);
  assert.match(js, /\/api\/admin\/games\/poison\/force-start/);
  assert.match(js, /\/api\/admin\/games\//);
  assert.match(js, /\/reset/);
  assert.match(js, /kick/);
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

test('number cross multiplayer page uses student auth and server routes', () => {
  const html = fs.readFileSync(path.join(root, 'public/number-cross.html'), 'utf8');
  assert.match(html, /assets\/js\/number-cross\.js/);
  assert.match(html, /assets\/js\/student-auth\.js/);
  assert.match(html, /assets\/css\/number-cross\.css/);
  const js = fs.readFileSync(path.join(root, 'public/assets/js/number-cross.js'), 'utf8');
  for (const needle of ['/api/cross/join', '/api/cross/start', '/api/cross/pick', '/api/cross/hold', '/api/cross/complete', '/api/cross/guess', 'var HOLD_MS = 2000', 'var CELLS = 50']) {
    assert.ok(js.includes(needle), 'missing ' + needle);
  }
});

test('number cross demo stays bot driven and login free', () => {
  const html = fs.readFileSync(path.join(root, 'public/number-cross-demo.html'), 'utf8');
  assert.match(html, /assets\/js\/number-cross-demo\.js/);
  assert.doesNotMatch(html, /look away/i);
  const js = fs.readFileSync(path.join(root, 'public/assets/js/number-cross-demo.js'), 'utf8');
  assert.match(js, /MODE = 'bots'/);
  assert.match(js, /scheduleBotSearch/);
  assert.match(js, /\['You', 'Mia', 'Leo'\]/);
});

test('odd one out page is login gated and wired to server routes', () => {
  const html = fs.readFileSync(path.join(root, 'public/odd-one-out.html'), 'utf8');
  assert.match(html, /assets\/js\/student-auth\.js/);
  assert.match(html, /assets\/js\/odd-one-out\.js/);
  assert.match(html, /assets\/css\/odd-one-out\.css/);
  const js = fs.readFileSync(path.join(root, 'public/assets/js/odd-one-out.js'), 'utf8');
  for (const needle of ['/api/odd/join', '/api/odd/start', '/api/odd/ready', '/api/odd/vote', '/api/odd/next-round']) {
    assert.ok(js.includes(needle), 'missing ' + needle);
  }
});

test('poison page offers both modes, team pick and leave', () => {
  const html = fs.readFileSync(path.join(root, 'public/poison.html'), 'utf8');
  assert.match(html, /pick-mode-solo/);
  assert.match(html, /pick-mode-teams/);
  assert.match(html, /leave-game/);
  const js = fs.readFileSync(path.join(root, 'public/assets/js/poison-game.js'), 'utf8');
  assert.match(js, /\/api\/game\/mode/);
  assert.match(js, /\/api\/game\/leave/);
  assert.match(js, /teamLives/);
});

test('one-screen poison page exists and is self contained', () => {
  const html = fs.readFileSync(path.join(root, 'public/poison-table.html'), 'utf8');
  assert.match(html, /assets\/js\/poison-table\.js/);
  const js = fs.readFileSync(path.join(root, 'public/assets/js/poison-table.js'), 'utf8');
  for (const needle of ['pt-mode-teams', 'cell--chosen', 'state.teamLives', 'renderPass']) {
    assert.ok(js.includes(needle) || html.includes(needle), 'missing ' + needle);
  }
  const main = fs.readFileSync(path.join(root, 'public/poison.html'), 'utf8');
  assert.match(main, /poison-table/);
});

test('cross board has visible boxes and a crossed state', () => {
  const css = fs.readFileSync(path.join(root, 'public/assets/css/number-cross.css'), 'utf8');
  assert.match(css, /\.nc-tile \{[^}]*background:/);
  assert.match(css, /\.nc-tile \{[^}]*border: 2px solid/);
  assert.match(css, /\.nc-tile\.is-crossed/);
  assert.match(css, /\.nc-tile\.is-holding/);
  const js = fs.readFileSync(path.join(root, 'public/assets/js/number-cross.js'), 'utf8');
  assert.match(js, /is-crossed/);
});

test('homework viewers ship the scribble tool', () => {
  const js = fs.readFileSync(path.join(root, 'public/assets/js/hw-viewer.js'), 'utf8');
  for (const needle of ['hw-ink', 'pointerdown', 'destination-out', 'localStorage', 'Undo', 'Clear page', 'hw-text', 'hw-check', 'data-mode="text"', 'data-mode="check"', 'data-mode="fill"', 'type="color"', 'type="range"', 'fillRegion']) {
    assert.ok(js.includes(needle), 'missing ' + needle);
  }
  const css = fs.readFileSync(path.join(root, 'public/assets/css/homework-viewer.css'), 'utf8');
  assert.match(css, /body\.ink-on \.hw-ink/);
  const page = fs.readFileSync(path.join(root, 'public/homework/manha/cats/index.html'), 'utf8');
  assert.match(page, /hw-viewer\.js/);
});

test('picker screen swaps the number board for boxes once picked', () => {
  const js = fs.readFileSync(path.join(root, 'public/assets/js/number-cross.js'), 'utf8');
  assert.match(js, /nc-boxes-wrap/);
  assert.match(js, /pickerCrossing/);
  assert.match(js, /parentElement\.hidden = pickerCrossing/);
});
