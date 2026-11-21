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
  const nafis = await studentToken(e, 'Nafis');
  await post(e, '/api/game/join', { pin: '5649' }, adnan);
  await post(e, '/api/game/join', { pin: '5649' }, nafis);
  const admin = await adminToken(e);
  const started = await post(e, '/api/game/start', {}, admin);
  assert.equal(started.status, 200);
  assert.equal((await started.json()).game.status, 'placement');
  const reset = await post(e, '/api/game/reset', {}, admin);
  assert.equal(reset.status, 200);
  assert.equal(await store.getActive(), null);
});

test('a non-member student cannot see the game or skip the PIN', async () => {
  const store = createMemoryGameStore();
  const e = env(store);
  const adnan = await studentToken(e, 'Adnan');
  const nafis = await studentToken(e, 'Nafis');
  await post(e, '/api/game/join', { pin: '5649' }, adnan);
  const peeking = await get(e, '/api/game/state', nafis);
  assert.equal(peeking.status, 200);
  assert.equal((await peeking.json()).game, null);
});

test('a member who reloads rejoins a game already in play', async () => {
  const store = createMemoryGameStore();
  const e = env(store);
  const adnan = await studentToken(e, 'Adnan');
  const nafis = await studentToken(e, 'Nafis');
  const admin = await adminToken(e);
  await post(e, '/api/game/join', { pin: '5649' }, adnan);
  await post(e, '/api/game/join', { pin: '5649' }, nafis);
  await post(e, '/api/game/start', {}, admin);
  const again = await post(e, '/api/game/join', { pin: '5649' }, adnan);
  assert.equal(again.status, 200);
  assert.equal((await again.json()).game.status, 'placement');
});

test('join is idempotent and does not 500 when repeated', async () => {
  const store = createMemoryGameStore();
  const e = env(store);
  const adnan = await studentToken(e, 'Adnan');
  const first = await post(e, '/api/game/join', { pin: '5649' }, adnan);
  const second = await post(e, '/api/game/join', { pin: '5649' }, adnan);
  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal((await second.json()).game.players.length, 1);
});

test('finished games stay readable so the leaderboard can render', async () => {
  const store = createMemoryGameStore();
  const game = await store.createLobby();
  await store.join(game.id, { id: 'adnan', name: 'Adnan' });
  await store.join(game.id, { id: 'nafis', name: 'Nafis' });
  await store.start(game.id, () => 0.5);
  await store.setPlacement(game.id, 'adnan', [0, 1, 2]);
  await store.setPlacement(game.id, 'nafis', [3, 4, 5]);
  let current = await store.getActive();
  for (let i = 0; i < 40 && current.status !== 'finished'; i += 1) {
    const turn = current.turnOrder[current.turnIndex];
    const open = [];
    for (let cell = 0; cell < current.cols * current.rows; cell += 1) {
      if (!(await store.state(current.id, turn)).revealed[String(cell)]) open.push(cell);
    }
    const picked = await store.pick(current.id, turn, open[0], current.version);
    current = { ...picked.game };
  }
  assert.equal(current.status, 'finished');
  const viewed = await store.state(current.id, 'adnan');
  assert.equal(viewed.status, 'finished');
  assert.equal(viewed.leaderboard.length, 2);
});

test('state during an admin reset returns a clean null, not a 500', async () => {
  const inner = createMemoryGameStore();
  const game = await inner.createLobby();
  let armed = false;
  const racy = {
    getActive: async () => {
      const active = await inner.getActive();
      if (armed) armed = false;
      return active;
    },
    state: async (gameId, viewer) => {
      if (armed === false && gameId === game.id) {
        await inner.reset();
        throw new Error('game not found');
      }
      return inner.state(gameId, viewer);
    }
  };
  const e = env(racy);
  const adnan = await studentToken(e, 'Adnan');
  await inner.join(game.id, { id: 'adnan', name: 'Adnan' });
  armed = true;
  const response = await get(e, '/api/game/state', adnan);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).game, null);
});

test('admin can force-start a stalled placement', async () => {
  const store = createMemoryGameStore();
  const e = env(store);
  const adnan = await studentToken(e, 'Adnan');
  const nafis = await studentToken(e, 'Nafis');
  const admin = await adminToken(e);
  await post(e, '/api/game/join', { pin: '5649' }, adnan);
  await post(e, '/api/game/join', { pin: '5649' }, nafis);
  await post(e, '/api/game/start', {}, admin);
  const active = await store.getActive();
  await post(e, '/api/game/poison', { cells: [0, 1, 2], version: active.version }, adnan);
  const forced = await post(e, '/api/game/force-start', {}, admin);
  assert.equal(forced.status, 200);
  assert.equal((await forced.json()).game.status, 'playing');
});

test('a pick outside the grid is rejected without mutating state', async () => {
  const store = createMemoryGameStore();
  const game = await store.createLobby();
  await store.join(game.id, { id: 'adnan', name: 'Adnan' });
  await store.join(game.id, { id: 'nafis', name: 'Nafis' });
  await store.start(game.id, () => 0.5);
  await store.setPlacement(game.id, 'adnan', [0, 1, 2]);
  const playing = await store.setPlacement(game.id, 'nafis', [3, 4, 5]);
  const turn = playing.turnOrder[playing.turnIndex];
  const e = env(store);
  const token = await studentToken(e, turn === 'adnan' ? 'Adnan' : 'Nafis');
  const response = await post(e, '/api/game/pick', { cell: 9999, version: playing.version }, token);
  assert.equal(response.status, 400);
  assert.equal((await store.getActive()).version, playing.version);
});

test('lobby creation is idempotent so simultaneous first joins share a room', async () => {
  const store = createMemoryGameStore();
  const first = await store.createLobby();
  const second = await store.createLobby();
  assert.equal(second.id, first.id);
});
