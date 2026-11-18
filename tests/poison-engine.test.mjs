import assert from 'node:assert/strict';
import test from 'node:test';
import {
  gridForPlayers, shuffleOrder, resolvePick, rankPlayers, POISON_COUNT, LIVES
} from '../src/poison-engine.js';

test('grid grows with player count and always fits eight cells per player', () => {
  assert.deepEqual(gridForPlayers(2), { cols: 4, rows: 4, cells: 16 });
  assert.deepEqual(gridForPlayers(3), { cols: 5, rows: 5, cells: 25 });
  assert.deepEqual(gridForPlayers(4), { cols: 6, rows: 6, cells: 36 });
  for (let n = 1; n <= 12; n += 1) {
    const grid = gridForPlayers(n);
    assert.ok(grid.cells >= Math.max(16, n * 8));
  }
});

test('shuffleOrder is a permutation and deterministic with a fixed rng', () => {
  const ids = ['a', 'b', 'c', 'd'];
  const seq = [0.1, 0.9, 0.5, 0.3, 0.7, 0.2];
  const seeded = () => {
    const value = seq[(seeded.i = (seeded.i || 0) + 1) % seq.length];
    return value;
  };
  seeded.i = 0;
  const out = shuffleOrder(ids, seeded);
  assert.deepEqual([...out].sort(), [...ids].sort());
  seeded.i = 0;
  assert.deepEqual(shuffleOrder(ids, seeded), out);
});

test('a poison hit costs a life and reveals the cell', () => {
  const state = {
    status: 'playing', turnOrder: ['a', 'b'], turnIndex: 0, version: 1,
    poisons: { 7: ['b'] }, revealed: {},
    players: [
      { id: 'a', name: 'A', lives: 3, eliminated: false },
      { id: 'b', name: 'B', lives: 3, eliminated: false }
    ]
  };
  const { state: next, result } = resolvePick(state, 7);
  assert.equal(result.hit, true);
  assert.deepEqual(result.poisonedBy, ['b']);
  assert.equal(next.players[0].lives, 2);
  assert.equal(next.revealed['7'].hit, true);
});

test('picking an already revealed cell is rejected', () => {
  const state = {
    status: 'playing', turnOrder: ['a', 'b'], turnIndex: 0, version: 1,
    poisons: {}, revealed: { 3: { hit: false, by: 'a' } },
    players: [
      { id: 'a', name: 'A', lives: 3, eliminated: false },
      { id: 'b', name: 'B', lives: 3, eliminated: false }
    ]
  };
  assert.throws(() => resolvePick(state, 3), /already revealed/);
});

test('reaching zero lives eliminates the player and skips their turn', () => {
  const state = {
    status: 'playing', turnOrder: ['a', 'b', 'c'], turnIndex: 0, version: 1,
    poisons: { 1: ['b'] }, revealed: {},
    players: [
      { id: 'a', name: 'A', lives: 1, eliminated: false },
      { id: 'b', name: 'B', lives: 3, eliminated: false },
      { id: 'c', name: 'C', lives: 3, eliminated: false }
    ]
  };
  const { state: next, result } = resolvePick(state, 1);
  assert.deepEqual(result.eliminated, ['a']);
  assert.equal(next.players[0].eliminated, true);
  assert.equal(next.turnIndex, 1);
  assert.equal(result.winner, null);
});

test('the last remaining player wins', () => {
  const state = {
    status: 'playing', turnOrder: ['a', 'b'], turnIndex: 1, version: 1,
    poisons: { 5: ['a'] }, revealed: {},
    players: [
      { id: 'a', name: 'A', lives: 3, eliminated: false },
      { id: 'b', name: 'B', lives: 1, eliminated: false }
    ]
  };
  const { result, state: next } = resolvePick(state, 5);
  assert.deepEqual(result.eliminated, ['b']);
  assert.equal(result.winner, 'a');
  assert.equal(next.status, 'finished');
});

test('leaderboard ranks survivors first, then lives, then join order', () => {
  const players = [
    { id: 'a', name: 'A', lives: 2, eliminated: false, joinIndex: 0 },
    { id: 'b', name: 'B', lives: 1, eliminated: true, joinIndex: 2 },
    { id: 'c', name: 'C', lives: 2, eliminated: false, joinIndex: 1 }
  ];
  assert.deepEqual(rankPlayers(players).map((p) => p.id), ['a', 'c', 'b']);
});

test('constants match the design', () => {
  assert.equal(POISON_COUNT, 3);
  assert.equal(LIVES, 3);
});
