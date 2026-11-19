import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../src/index.js';
import { createMemoryGameStore } from '../src/poison-store.js';
import { createMemoryCrossStore } from '../src/cross-store.js';
import { createMemoryOddStore } from '../src/odd-store.js';

function env() {
  const kv = new Map();
  return {
    ADMIN_USERNAME: 'kazi', ADMIN_PASSWORD: '5649', ADMIN_TOKEN_SECRET: 'test-secret',
    GAME_STORE: createMemoryGameStore(),
    CROSS_STORE: createMemoryCrossStore({ holdMs: 0, countdownMs: 0 }),
    ODD_STORE: createMemoryOddStore(),
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
async function adminToken(e) {
  return (await (await post(e, '/api/admin/login', { username: 'kazi', password: '5649' })).json()).token;
}
async function studentToken(e, name) {
  const login = await post(e, '/api/auth/login', { name, pin: '0000' });
  const first = await login.json();
  if (first.sessionToken) return first.sessionToken;
  const setup = await post(e, '/api/auth/set-pin', { setupToken: first.setupToken, newPin: '1234' });
  return (await setup.json()).sessionToken;
}

test('admin game overview needs an admin token', async () => {
  const e = env();
  assert.equal((await get(e, '/api/admin/games')).status, 401);
});

test('admin overview lists all three games with players', async () => {
  const e = env();
  const admin = await adminToken(e);
  const a = await studentToken(e, 'Adnan');
  await post(e, '/api/game/join', { pin: '5649' }, a);
  await post(e, '/api/cross/join', { team: 'sun' }, a);
  await post(e, '/api/odd/join', {}, a);
  const response = await get(e, '/api/admin/games', admin);
  assert.equal(response.status, 200);
  const games = (await response.json()).games;
  assert.equal(games.poison.players.length, 1);
  assert.equal(games.cross.players.length, 1);
  assert.equal(games.odd.players.length, 1);
  assert.equal(typeof games.poison.players[0].online, 'boolean');
});

test('admin can kick a lobby player and start poison', async () => {
  const e = env();
  const admin = await adminToken(e);
  const a = await studentToken(e, 'Adnan');
  const b = await studentToken(e, 'Nafis');
  await post(e, '/api/game/join', { pin: '5649' }, a);
  await post(e, '/api/game/join', { pin: '5649' }, b);
  const kicked = await post(e, '/api/admin/games/poison/kick', { student: 'nafis' }, admin);
  assert.equal(kicked.status, 200);
  assert.deepEqual((await kicked.json()).game.players.map((p) => p.id), ['adnan']);
  const started = await post(e, '/api/admin/games/poison/start', {}, admin);
  assert.equal(started.status, 200);
  assert.equal((await started.json()).game.status, 'placement');
});

test('admin reset works for every game', async () => {
  const e = env();
  const admin = await adminToken(e);
  const a = await studentToken(e, 'Adnan');
  await post(e, '/api/cross/join', { team: 'sun' }, a);
  await post(e, '/api/odd/join', {}, a);
  for (const mode of ['cross', 'odd', 'poison']) {
    const response = await post(e, `/api/admin/games/${mode}/reset`, {}, admin);
    assert.equal(response.status, 200);
  }
});
