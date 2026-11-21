import assert from 'node:assert/strict';
import test from 'node:test';
import {
  gridForPlayers, shuffleOrder, resolvePick, rankTeams, rankPlayers,
  POISON_COUNT, LIVES
} from '../src/poison-engine.js';

function baseState(mode) {
  return {
    mode,
    status: 'playing', turnOrder: ['a', 'b'], turnIndex: 0, version: 1,
    poisons: { 7: ['b'] }, revealed: {},
    teamLives: { sun: 3, wave: 3 },
    players: [
      { id: 'a', name: 'A', team: 'sun', lives: 3, eliminated: false },
      { id: 'b', name: 'B', team: 'wave', lives: 3, eliminated: false }
    ]
  };
}

test('grid grows with player count and always fits eight cells per player', () => {
  assert.deepEqual(gridForPlayers(2), { cols: 4, rows: 4, cells: 16 });
  assert.deepEqual(gridForPlayers(3), { cols: 5, rows: 5, cells: 25 });
  for (let n = 1; n <= 12; n += 1) {
    assert.ok(gridForPlayers(n).cells >= Math.max(16, n * 8));
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

test('teams: a hit costs the team one shared life', () => {
  const { state, result } = resolvePick(baseState('teams'), 7);
  assert.equal(result.hit, true);
  assert.deepEqual(result.poisonedBy, ['b']);
  assert.equal(state.teamLives.sun, 2);
  assert.equal(state.teamLives.wave, 3);
  assert.equal(state.players[0].eliminated, false);
});

test('teams: zero lives eliminates every member of that team', () => {
  const state = baseState('teams');
  state.teamLives.sun = 1;
  const { state: next, result } = resolvePick(state, 7);
  assert.deepEqual(result.eliminated, ['a']);
  assert.equal(next.players[0].eliminated, true);
  assert.equal(next.winnerTeam, 'wave');
  assert.equal(next.status, 'finished');
});

test('solo: a hit costs only that player a life', () => {
  const { state, result } = resolvePick(baseState('solo'), 7);
  assert.equal(result.hit, true);
  assert.equal(state.players[0].lives, 2);
  assert.equal(state.teamLives.sun, 3);
  assert.equal(result.eliminated.length, 0);
});

test('solo: zero lives eliminates that player and the last one wins', () => {
  const state = baseState('solo');
  state.players[0].lives = 1;
  const { state: next, result } = resolvePick(state, 7);
  assert.deepEqual(result.eliminated, ['a']);
  assert.equal(next.winnerPlayer, 'b');
  assert.equal(next.status, 'finished');
});

test('picking an already revealed cell is rejected', () => {
  const state = baseState('teams');
  state.revealed = { 3: { hit: false, by: 'a' } };
  assert.throws(() => resolvePick(state, 3), /already revealed/);
});

test('rankTeams orders by shared lives', () => {
  const rows = rankTeams({ sun: 1, wave: 3 }, [
    { team: 'sun', name: 'A' }, { team: 'wave', name: 'B' }
  ]);
  assert.equal(rows[0].team, 'wave');
  assert.equal(rows[1].team, 'sun');
});

test('rankPlayers orders survivors then lives', () => {
  const rows = rankPlayers([
    { id: 'a', name: 'A', lives: 2, eliminated: false, joinIndex: 0 },
    { id: 'b', name: 'B', lives: 1, eliminated: true, joinIndex: 1 },
    { id: 'c', name: 'C', lives: 2, eliminated: false, joinIndex: 2 }
  ]);
  assert.deepEqual(rows.map((row) => row.id), ['a', 'c', 'b']);
});

test('constants match the design', () => {
  assert.equal(POISON_COUNT, 3);
  assert.equal(LIVES, 3);
});
