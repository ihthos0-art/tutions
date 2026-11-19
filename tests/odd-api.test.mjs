import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../src/index.js';
import { createMemoryOddStore } from '../src/odd-store.js';

function env(store) {
  const kv = new Map();
  return {
    ADMIN_USERNAME: 'kazi', ADMIN_PASSWORD: '5649', ADMIN_TOKEN_SECRET: 'test-secret',
    ODD_STORE: store,
    HOMEWORK: { get: async (k) => kv.get(k) || null, put: async (k, v) => { kv.set(k, v); } }
  };
}
function post(e, path, body, token) {
  const headers = { 'content-type': 'application/json' };
  if (token) headers.authorization = 'Bearer ' + token;
  return worker.fetch(new Request('https://t.local' + path, {
    method: 'POST', headers, body: JSON.stringify(body || {})
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
async function threeJoined(e) {
  const names = ['Adnan', 'Nafis', 'Manha'];
  const tokens = [];
  for (const name of names) tokens.push(await studentToken(e, name));
  for (const token of tokens) await post(e, '/api/odd/join', {}, token);
  return tokens;
}

test('odd one out requires a student session', async () => {
  const e = env(createMemoryOddStore());
  assert.equal((await get(e, '/api/odd/state')).status, 401);
});

test('three players can start and each gets a private word', async () => {
  const e = env(createMemoryOddStore({ cluesMs: 10 }));
  const tokens = await threeJoined(e);
  const started = await post(e, '/api/odd/start', {}, tokens[0]);
  assert.equal(started.status, 200);
  const views = [];
  for (const token of tokens) views.push((await (await get(e, '/api/odd/state', token)).json()).game);
  const roles = views.map((view) => view.myRole);
  assert.equal(roles.filter((role) => role === 'imposter').length, 1);
  const civilianWords = new Set(views.filter((v) => v.myRole === 'civilian').map((v) => v.myWord));
  assert.equal(civilianWords.size, 1);
  assert.ok(views.every((view) => view.players.every((player) => player.word === undefined)));
});

test('full round: ready, clues, votes, result', async () => {
  const e = env(createMemoryOddStore({ cluesMs: 10 }));
  const tokens = await threeJoined(e);
  await post(e, '/api/odd/start', {}, tokens[0]);
  for (const token of tokens) await post(e, '/api/odd/ready', {}, token);
  const clues = (await (await get(e, '/api/odd/state', tokens[0])).json()).game;
  assert.equal(clues.phase, 'clues');
  await post(e, '/api/odd/start-vote', {}, tokens[0]);
  const votePhase = (await (await get(e, '/api/odd/state', tokens[0])).json()).game;
  assert.equal(votePhase.phase, 'vote');

  const views = [];
  for (const token of tokens) views.push((await (await get(e, '/api/odd/state', token)).json()).game);
  const imposterIndex = views.findIndex((view) => view.myRole === 'imposter');
  const voters = tokens.filter((_, index) => index !== imposterIndex);
  await post(e, '/api/odd/vote', { target: views[imposterIndex].players[imposterIndex].id }, voters[0]);
  await post(e, '/api/odd/vote', { target: views[imposterIndex].players[imposterIndex].id }, voters[1]);
  await post(e, '/api/odd/vote', { target: views[imposterIndex].players[(imposterIndex + 1) % 3].id }, tokens[imposterIndex]);
  const finalState = (await (await get(e, '/api/odd/state', tokens[0])).json()).game;
  assert.equal(finalState.phase, 'result');
  assert.equal(finalState.result.imposterId, views[imposterIndex].players[imposterIndex].id);
  assert.equal(finalState.result.caught, true);
});

test('non-members cannot see the room', async () => {
  const e = env(createMemoryOddStore());
  await threeJoined(e);
  const outsider = await studentToken(e, 'Taha');
  const response = await get(e, '/api/odd/state', outsider);
  assert.equal((await response.json()).game, null);
});
