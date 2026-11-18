import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../src/index.js';
import { createMemoryGameStore } from '../src/poison-store.js';

function env(store) {
  const kv = new Map();
  return {
    ADMIN_USERNAME: 'kazi',
    ADMIN_PASSWORD: '5649',
    ADMIN_TOKEN_SECRET: 'test-secret',
    GAME_PIN: '5649',
    GAME_STORE: store,
    HOMEWORK: {
      get: async (key) => kv.get(key) || null,
      put: async (key, value) => { kv.set(key, value); }
    }
  };
}

function post(e, path, body, token) {
  const headers = { 'content-type': 'application/json' };
  if (token) headers.authorization = 'Bearer ' + token;
  return worker.fetch(new Request('https://t.local' + path, {
    method: 'POST', headers, body: JSON.stringify(body)
  }), e);
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
  const data = await setup.json();
  if (!data.sessionToken) throw new Error('student token failed: ' + JSON.stringify(data));
  return data.sessionToken;
}

async function adminToken(e) {
  const response = await post(e, '/api/admin/login', { username: 'kazi', password: '5649' });
  return (await response.json()).token;
}

test('join requires the game pin and a student session', async () => {
  const store = createMemoryGameStore();
  const e = env(store);
  const anon = await post(e, '/api/game/join', { pin: '5649' });
  assert.equal(anon.status, 401);
  const token = await studentToken(e, 'Adnan');
  const badPin = await post(e, '/api/game/join', { pin: '0000' }, token);
  assert.equal(badPin.status, 403);
  const ok = await post(e, '/api/game/join', { pin: '5649' }, token);
  assert.equal(ok.status, 200);
  assert.equal((await ok.json()).game.status, 'lobby');
});

test('state is readable by the student and hides other poisons', async () => {
  const store = createMemoryGameStore();
  const e = env(store);
  const adnan = await studentToken(e, 'Adnan');
  const nafis = await studentToken(e, 'Nafis');
  await post(e, '/api/game/join', { pin: '5649' }, adnan);
  await post(e, '/api/game/join', { pin: '5649' }, nafis);
  const admin = await adminToken(e);
  await post(e, '/api/game/start', {}, admin);
  const state = await get(e, '/api/game/state', adnan);
  assert.equal(state.status, 200);
  const body = await state.json();
  assert.equal(body.game.status, 'placement');
  assert.equal(body.game.poisons, undefined);
});

test('student actions are rejected when it is not their turn', async () => {
  const store = createMemoryGameStore();
  const game = await store.createLobby();
  await store.join(game.id, { id: 'adnan', name: 'Adnan' });
  await store.join(game.id, { id: 'nafis', name: 'Nafis' });
  await store.start(game.id, () => 0.5);
  await store.setPlacement(game.id, 'adnan', [0, 1, 2]);
  const playing = await store.setPlacement(game.id, 'nafis', [3, 4, 5]);
  const current = playing.turnOrder[playing.turnIndex];
  const other = current === 'adnan' ? 'nafis' : 'adnan';
  const e = env(store);
  const token = await studentToken(e, other === 'adnan' ? 'Adnan' : 'Nafis');
  const response = await post(e, '/api/game/pick', { cell: 9, version: playing.version }, token);
  assert.equal(response.status, 409);
  assert.equal((await response.json()).error, 'not your turn');
});

test('a stale version returns 409 instead of mutating state', async () => {
  const store = createMemoryGameStore();
  const game = await store.createLobby();
  await store.join(game.id, { id: 'adnan', name: 'Adnan' });
  await store.join(game.id, { id: 'nafis', name: 'Nafis' });
  await store.start(game.id, () => 0.5);
  await store.setPlacement(game.id, 'adnan', [0, 1, 2]);
  const playing = await store.setPlacement(game.id, 'nafis', [3, 4, 5]);
  const current = playing.turnOrder[playing.turnIndex];
  const e = env(store);
  const token = await studentToken(e, current === 'adnan' ? 'Adnan' : 'Nafis');
  const response = await post(e, '/api/game/pick', { cell: 9, version: playing.version - 1 }, token);
  assert.equal(response.status, 409);
  assert.equal((await response.json()).error, 'state changed, refresh');
});

test('admin can start and reset the room', async () => {
  const store = createMemoryGameStore();
  const e = env(store);
  const adnan = await studentToken(e, 'Adnan');
  await post(e, '/api/game/join', { pin: '5649' }, adnan);
  const admin = await adminToken(e);
  const started = await post(e, '/api/game/start', {}, admin);
  assert.equal(started.status, 200);
  assert.equal((await started.json()).game.status, 'placement');
  const reset = await post(e, '/api/game/reset', {}, admin);
  assert.equal(reset.status, 200);
  assert.equal(await store.getActive(), null);
});
