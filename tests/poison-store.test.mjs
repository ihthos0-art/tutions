import assert from 'node:assert/strict';
import test from 'node:test';
import { createMemoryGameStore } from '../src/poison-store.js';

test('memory store runs a lobby -> placement -> play -> finish flow', async () => {
  const store = createMemoryGameStore();
  const game = await store.createLobby();
  assert.equal(game.status, 'lobby');
  await store.join(game.id, { id: 'a', name: 'A' });
  await store.join(game.id, { id: 'b', name: 'B' });
  const started = await store.start(game.id, () => 0.5);
  assert.equal(started.status, 'placement');
  assert.equal(started.players.length, 2);
  await store.setPlacement(game.id, 'a', [0, 1, 2]);
  const placed = await store.setPlacement(game.id, 'b', [3, 4, 5]);
  assert.equal(placed.status, 'playing');
});

test('picks with a stale version are rejected', async () => {
  const store = createMemoryGameStore();
  const game = await store.createLobby();
  await store.join(game.id, { id: 'a', name: 'A' });
  await store.join(game.id, { id: 'b', name: 'B' });
  await store.start(game.id, () => 0.5);
  await store.setPlacement(game.id, 'a', [0, 1, 2]);
  const playing = await store.setPlacement(game.id, 'b', [3, 4, 5]);
  await assert.rejects(() => store.pick(game.id, 'a', 10, playing.version - 1), /version conflict/);
});

test('state hides other players poisons', async () => {
  const store = createMemoryGameStore();
  const game = await store.createLobby();
  await store.join(game.id, { id: 'a', name: 'A' });
  await store.join(game.id, { id: 'b', name: 'B' });
  await store.start(game.id, () => 0.5);
  await store.setPlacement(game.id, 'a', [0, 1, 2]);
  await store.setPlacement(game.id, 'b', [3, 4, 5]);
  const forA = await store.state(game.id, 'a');
  assert.deepEqual(forA.ownPoisons.sort(), [0, 1, 2]);
  assert.equal(forA.poisons, undefined);
});

test('placement rejects the wrong number of cells', async () => {
  const store = createMemoryGameStore();
  const game = await store.createLobby();
  await store.join(game.id, { id: 'a', name: 'A' });
  await store.join(game.id, { id: 'b', name: 'B' });
  await store.start(game.id, () => 0.5);
  await assert.rejects(() => store.setPlacement(game.id, 'a', [0, 1]), /exactly 3/);
  await assert.rejects(() => store.setPlacement(game.id, 'a', [0, 1, 1]), /exactly 3/);
});

test('a player cannot pick out of turn', async () => {
  const store = createMemoryGameStore();
  const game = await store.createLobby();
  await store.join(game.id, { id: 'a', name: 'A' });
  await store.join(game.id, { id: 'b', name: 'B' });
  await store.start(game.id, () => 0.5);
  await store.setPlacement(game.id, 'a', [0, 1, 2]);
  const playing = await store.setPlacement(game.id, 'b', [3, 4, 5]);
  const other = playing.turnOrder[playing.turnIndex] === 'a' ? 'b' : 'a';
  await assert.rejects(() => store.pick(game.id, other, 12, playing.version), /not your turn/);
});

test('reset clears the active game', async () => {
  const store = createMemoryGameStore();
  await store.createLobby();
  await store.reset();
  assert.equal(await store.getActive(), null);
});
