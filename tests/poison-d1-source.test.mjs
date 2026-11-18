import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/poison-store.js'), 'utf8');

// The D1 store has no behavioral tests (no D1 in the Node test runner). These
// assertions pin the queries that diverged from the memory store in review.
test('D1 active-game lookup includes finished games so the leaderboard is reachable', () => {
  assert.match(source, /status IN \('lobby','placement','playing','finished'\)/);
});

test('D1 lobby creation is conditional so simultaneous joins share one room', () => {
  assert.match(source, /WHERE NOT EXISTS \(SELECT 1 FROM games WHERE status IN \('lobby','placement','playing'\)\)/);
});

test('D1 join is idempotent under double submit', () => {
  assert.match(source, /INSERT OR IGNORE INTO players/);
});

test('D1 store exposes forceStart for stalled placements', () => {
  assert.match(source, /async forceStart\(gameId, rng = Math\.random\)/);
});
