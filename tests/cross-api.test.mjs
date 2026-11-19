import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../src/index.js';
import { createMemoryCrossStore } from '../src/cross-store.js';

function env(store) {
  const kv = new Map();
  return {
    ADMIN_USERNAME: 'kazi',
    ADMIN_PASSWORD: '5649',
    ADMIN_TOKEN_SECRET: 'test-secret',
    CROSS_STORE: store,
    HOMEWORK: { get: async (k) => kv.get(k) || null, put: async (k, v) => { kv.set(k, v); } }
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
  return (await setup.json()).sessionToken;
}

async function twoTeams(e) {
  const a = await studentToken(e, 'Adnan');
  const b = await studentToken(e, 'Nafis');
  await post(e, '/api/cross/join', { team: 'sun' }, a);
  const joined = await post(e, '/api/cross/join', { team: 'wave' }, b);
  return { a, b, state: (await joined.json()).game };
}

test('cross game requires a student session', async () => {
  const e = env(createMemoryCrossStore({ holdMs: 0, countdownMs: 0 }));
  const response = await get(e, '/api/cross/state');
  assert.equal(response.status, 401);
});

test('both teams join and any player can start', async () => {
  const e = env(createMemoryCrossStore({ holdMs: 0, countdownMs: 0 }));
  const { a, state } = await twoTeams(e);
  assert.equal(state.status, 'lobby');
  const started = await post(e, '/api/cross/start', {}, a);
  assert.equal(started.status, 200);
  assert.equal((await started.json()).game.status, 'playing');
});

test('non-members cannot see the game', async () => {
  const e = env(createMemoryCrossStore({ holdMs: 0, countdownMs: 0 }));
  await twoTeams(e);
  const outsider = await studentToken(e, 'Taha');
  const response = await get(e, '/api/cross/state', outsider);
  assert.equal((await response.json()).game, null);
});

test('finder cannot see numbers during pick, picker can', async () => {
  const e = env(createMemoryCrossStore({ holdMs: 0, countdownMs: 0 }));
  const { a, b } = await twoTeams(e);
  await post(e, '/api/cross/start', {}, a);
  const stateA = (await (await get(e, '/api/cross/state', a)).json()).game;
  const pickerToken = stateA.pickerTeam === 'sun' ? a : b;
  const finderToken = stateA.pickerTeam === 'sun' ? b : a;
  const picker = (await (await get(e, '/api/cross/state', pickerToken)).json()).game;
  const finder = (await (await get(e, '/api/cross/state', finderToken)).json()).game;
  assert.equal(picker.numbers.length, 60);
  assert.equal(finder.numbers, null);
});

test('pick, hold, and complete cross a block and swap roles', async () => {
  const e = env(createMemoryCrossStore({ holdMs: 0, countdownMs: 0 }));
  const { a, b } = await twoTeams(e);
  await post(e, '/api/cross/start', {}, a);
  let pickerState = (await (await get(e, '/api/cross/state', a)).json()).game;
  const pickerToken = pickerState.pickerTeam === 'sun' ? a : b;
  const finderToken = pickerState.pickerTeam === 'sun' ? b : a;
  pickerState = (await (await get(e, '/api/cross/state', pickerToken)).json()).game;

  const picked = await post(e, '/api/cross/pick', { cell: 0, version: pickerState.version }, pickerToken);
  assert.equal(picked.status, 200);
  const afterPick = (await picked.json()).game;
  assert.equal(afterPick.target, pickerState.numbers[0]);

  await new Promise((resolve) => setTimeout(resolve, 5));
  const finderView = (await (await get(e, '/api/cross/state', finderToken)).json()).game;
  assert.equal(finderView.phase, 'find');
  const holdStarted = await post(e, '/api/cross/hold', { action: 'start', cell: 0 }, finderToken);
  assert.equal(holdStarted.status, 200);
  const held = (await holdStarted.json()).game;
  const done = await post(e, '/api/cross/complete', { cell: 0, version: held.version }, finderToken);
  assert.equal(done.status, 200);
  const finalState = (await done.json()).game;
  assert.equal(finalState.crossed[finderView.myTeam].length, 1);
  assert.equal(finalState.pickerTeam, finderView.myTeam);
});
