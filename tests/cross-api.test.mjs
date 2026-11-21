import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../src/index.js';
import { createMemoryCrossStore } from '../src/cross-store.js';

function env(store) {
  const kv = new Map();
  return {
    ADMIN_USERNAME: 'kazi', ADMIN_PASSWORD: '5649', ADMIN_TOKEN_SECRET: 'test-secret',
    CROSS_STORE: store,
    HOMEWORK: { get: async (k) => kv.get(k) || null, put: async (k, v) => { kv.set(k, v); } }
  };
}
function post(e, path, body, token) {
  const headers = { 'content-type': 'application/json' };
  if (token) headers.authorization = 'Bearer ' + token;
  return worker.fetch(new Request('https://t.local' + path, { method: 'POST', headers, body: JSON.stringify(body || {}) }), e);
}
function get(e, path, token) {
  const headers = {};
  if (token) headers.authorization = 'Bearer ' + token;
  return worker.fetch(new Request('https://t.local' + path, { headers }), e);
}
async function studentToken(e, name) {
  const login = await post(e, '/api/auth/login', { name, pin: '0000' });
  const first = await login.json();
  if (first.sessionToken) return first.sessionToken;
  const setup = await post(e, '/api/auth/set-pin', { setupToken: first.setupToken, newPin: '1234' });
  return (await setup.json()).sessionToken;
}
async function joined(e) {
  const a = await studentToken(e, 'Adnan');
  const b = await studentToken(e, 'Nafis');
  await post(e, '/api/cross/join', { team: 'sun' }, a);
  await post(e, '/api/cross/join', { team: 'wave' }, b);
  const started = await post(e, '/api/cross/start', {}, a);
  return { a, b, game: (await started.json()).game };
}

test('needs a student session', async () => {
  const e = env(createMemoryCrossStore({ holdMs: 0, wrongMs: 0 }));
  assert.equal((await get(e, '/api/cross/state')).status, 401);
});

test('secret number is hidden from the hunting team', async () => {
  const e = env(createMemoryCrossStore({ holdMs: 0, wrongMs: 0 }));
  const { a, b, game } = await joined(e);
  const pickerToken = game.pickerTeam === 'sun' ? a : b;
  const finderToken = game.pickerTeam === 'sun' ? b : a;
  const pickerView = (await (await get(e, '/api/cross/state', pickerToken)).json()).game;
  const picked = await post(e, '/api/cross/pick', { cell: 2, version: pickerView.version }, pickerToken);
  assert.equal(picked.status, 200);
  const secret = (await picked.json()).game.secretNumber;
  assert.ok(secret);
  const finder = (await (await get(e, '/api/cross/state', finderToken)).json()).game;
  assert.equal(finder.secretNumber, null);
  assert.equal(finder.secretCell, null);
  assert.equal(finder.canGuess, true);
});

test('correct guess stops crossing and swaps roles', async () => {
  const e = env(createMemoryCrossStore({ holdMs: 0, wrongMs: 0 }));
  const { a, b, game } = await joined(e);
  const pickerToken = game.pickerTeam === 'sun' ? a : b;
  const finderToken = game.pickerTeam === 'sun' ? b : a;
  const pickerView = (await (await get(e, '/api/cross/state', pickerToken)).json()).game;
  const picked = (await (await post(e, '/api/cross/pick', { cell: 5, version: pickerView.version }, pickerToken)).json()).game;
  const response = await post(e, '/api/cross/guess', { cell: pickerView.numbers.indexOf(picked.secretNumber) }, finderToken);
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.stopped, true);
  assert.notEqual(data.game.pickerTeam, game.pickerTeam);
});

test('wrong guess is rejected', async () => {
  const e = env(createMemoryCrossStore({ holdMs: 0, wrongMs: 0 }));
  const { a, b, game } = await joined(e);
  const pickerToken = game.pickerTeam === 'sun' ? a : b;
  const finderToken = game.pickerTeam === 'sun' ? b : a;
  const view = (await (await get(e, '/api/cross/state', pickerToken)).json()).game;
  await post(e, '/api/cross/pick', { cell: 2, version: view.version }, pickerToken);
  const wrongCell = 2 === 0 ? 1 : 0;
  const response = await post(e, '/api/cross/guess', { cell: wrongCell }, finderToken);
  assert.equal(response.status, 409);
  assert.equal((await response.json()).error, 'wrong number');
});

test('hold and complete crosses a box for the picking team', async () => {
  const e = env(createMemoryCrossStore({ holdMs: 0, wrongMs: 0 }));
  const { a, b, game } = await joined(e);
  const pickerToken = game.pickerTeam === 'sun' ? a : b;
  let view = (await (await get(e, '/api/cross/state', pickerToken)).json()).game;
  view = (await (await post(e, '/api/cross/pick', { cell: 0, version: view.version }, pickerToken)).json()).game;
  const started = await post(e, '/api/cross/hold', { action: 'start', cell: 7 }, pickerToken);
  assert.equal(started.status, 200);
  const held = (await started.json()).game;
  const done = await post(e, '/api/cross/complete', { cell: 7, version: held.version }, pickerToken);
  assert.equal(done.status, 200);
  const finalGame = (await done.json()).game;
  assert.equal(finalGame.counts[finalGame.myTeam], 1);
});

test('admin kick and reset work', async () => {
  const e = env(createMemoryCrossStore({ holdMs: 0, wrongMs: 0 }));
  const a = await studentToken(e, 'Adnan');
  const b = await studentToken(e, 'Nafis');
  await post(e, '/api/cross/join', { team: 'sun' }, a);
  await post(e, '/api/cross/join', { team: 'wave' }, b);
  const admin = (await (await post(e, '/api/admin/login', { username: 'kazi', password: '5649' })).json()).token;
  const kicked = await post(e, '/api/admin/games/cross/kick', { student: 'nafis' }, admin);
  assert.equal(kicked.status, 200);
  const reset = await post(e, '/api/admin/games/cross/reset', {}, admin);
  assert.equal(reset.status, 200);
});
