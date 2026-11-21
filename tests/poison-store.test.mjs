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

test('lobby can switch to teams and sides get assigned', async () => {
  const store = createMemoryGameStore();
  const g = await store.createLobby();
  await store.join(g.id, { id: 'a', name: 'A' });
  await store.join(g.id, { id: 'b', name: 'B' });
  const teams = await store.setMode(g.id, 'teams');
  assert.equal(teams.mode, 'teams');
  assert.deepEqual(teams.players.map((p) => p.team).sort(), ['sun', 'wave']);
  const started = await store.start(g.id, () => 0.5);
  assert.equal(started.status, 'placement');
});

test('teams mode shares three lives and eliminates the whole team', async () => {
  const store = createMemoryGameStore();
  const g = await store.createLobby();
  await store.setMode(g.id, 'teams');
  await store.join(g.id, { id: 'a1', name: 'A1' }, 'sun');
  await store.join(g.id, { id: 'a2', name: 'A2' }, 'sun');
  await store.join(g.id, { id: 'b', name: 'B' }, 'wave');
  const started = await store.start(g.id, () => 0.1);
  await store.setPlacement(g.id, 'a1', [0, 1, 2]);
  await store.setPlacement(g.id, 'a2', [0, 1, 2]);
  await store.setPlacement(g.id, 'b', [3, 4, 5]);
  let view = await store.state(g.id, 'b');
  let guard = 0;
  while (view.status === 'playing' && guard < 40) {
    const current = view.turnOrder[view.turnIndex];
    const team = view.players.find((p) => p.id === current).team;
    const cells = team === 'sun' ? [0, 1, 2] : [3, 4, 5];
    const cell = cells.find((c) => !view.revealed[String(c)]);
    const picked = await store.pick(g.id, current, cell, view.version);
    view = picked.game;
    guard += 1;
  }
  assert.equal(view.status, 'finished');
  assert.equal(view.winnerTeam, 'wave');
  assert.ok(view.players.filter((p) => p.team === 'sun').every((p) => p.eliminated));
});

test('solo mode keeps individual lives and one winner', async () => {
  const store = createMemoryGameStore();
  const g = await store.createLobby();
  await store.join(g.id, { id: 'a', name: 'A' });
  await store.join(g.id, { id: 'b', name: 'B' });
  assert.equal(g.mode, 'solo');
  await store.start(g.id, () => 0.1);
  await store.setPlacement(g.id, 'a', [0, 1, 2]);
  await store.setPlacement(g.id, 'b', [3, 4, 5]);
  let view = await store.state(g.id, 'b');
  let guard = 0;
  while (view.status === 'playing' && guard < 40) {
    const current = view.turnOrder[view.turnIndex];
    const cell = [0, 1, 2, 3, 4, 5].find((c) => !view.revealed[String(c)]);
    const picked = await store.pick(g.id, current, cell, view.version);
    view = picked.game;
    guard += 1;
  }
  assert.equal(view.status, 'finished');
  assert.ok(view.winnerPlayer);
  assert.ok(view.leaderboard.length === 2);
});
