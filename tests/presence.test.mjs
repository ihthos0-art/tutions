import assert from 'node:assert/strict';
import test from 'node:test';
import { createMemoryGameStore } from '../src/poison-store.js';
import { createMemoryCrossStore } from '../src/cross-store.js';
import { createMemoryOddStore } from '../src/odd-store.js';
import { isOnline, isLobbyStale, PRESENCE_ONLINE_MS } from '../src/presence.js';

function clock(start = 1000000) {
  let value = start;
  return { now: () => value, tick: (ms) => { value += ms; } };
}

test('presence helpers use the documented windows', () => {
  assert.equal(isOnline(1000, 1000 + PRESENCE_ONLINE_MS), true);
  assert.equal(isOnline(1000, 1000 + PRESENCE_ONLINE_MS + 1), false);
  assert.equal(isLobbyStale(1000, 1000 + 90000), false);
  assert.equal(isLobbyStale(1000, 1000 + 90001), true);
});

test('poison lobby drops a stale seat and the admin can kick', async () => {
  const c = clock();
  const store = createMemoryGameStore({ now: c.now, lobbyTtlMs: 100 });
  const game = await store.createLobby();
  await store.join(game.id, { id: 'a', name: 'A' });
  await store.join(game.id, { id: 'b', name: 'B' });
  c.tick(200);
  const forA = await store.state(game.id, 'a');
  assert.deepEqual(forA.players.map((p) => p.id), ['a']);
  await store.join(game.id, { id: 'c', name: 'C' });
  const kicked = await store.kick(game.id, 'c');
  assert.equal(kicked.players.length, 1);
  await assert.rejects(() => store.kick(game.id, 'zzz'), /not in this game/);
});

test('cross lobby prunes stale players and marks presence', async () => {
  const c = clock();
  const store = createMemoryCrossStore({ now: c.now, lobbyTtlMs: 60000, holdMs: 0, countdownMs: 0 });
  const id = await store.createLobby();
  await store.join(id, { id: 'a', name: 'A' }, 'sun');
  await store.join(id, { id: 'b', name: 'B' }, 'wave');
  let view = await store.state(id, 'a');
  assert.equal(view.players.every((p) => p.online), true);
  c.tick(30000);
  view = await store.state(id, 'b');
  const a = view.players.find((p) => p.id === 'a');
  assert.equal(a.online, false);
  c.tick(40000);
  view = await store.state(id, 'b');
  assert.deepEqual(view.players.map((p) => p.id), ['b']);
  await store.join(id, { id: 'c', name: 'C' }, 'sun');
  const kicked = await store.kick(id, 'c');
  assert.equal(kicked.players.length, 1);
});

test('odd lobby prunes stale players and the admin can kick', async () => {
  const c = clock();
  const store = createMemoryOddStore({ now: c.now, lobbyTtlMs: 100 });
  const id = await store.createLobby();
  await store.join(id, { id: 'a', name: 'A' });
  await store.join(id, { id: 'b', name: 'B' });
  c.tick(200);
  const view = await store.state(id, 'a');
  assert.deepEqual(view.players.map((p) => p.id), ['a']);
  await store.join(id, { id: 'c', name: 'C' });
  const kicked = await store.kick(id, 'c');
  assert.equal(kicked.players.length, 1);
});

test('kick is refused once a game has started', async () => {
  const store = createMemoryOddStore();
  const id = await store.createLobby();
  for (const [i, name] of ['A', 'B', 'C'].entries()) await store.join(id, { id: name.toLowerCase(), name });
  await store.start(id, () => 0);
  await assert.rejects(() => store.kick(id, 'a'), /lobby/);
});
