# Poison Challenge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a PIN-gated, multiplayer "Poison Challenge" where joined students place three secret poisons, take turns picking grid cells, and lose lives on booms until one student remains.

**Architecture:** Pure game rules live in `src/poison-engine.js`; persistence is a small store interface with a D1 implementation (`src/poison-store.js`) and an in-memory fake used by tests. Route handlers in `src/index.js` call engine + store. The browser page polls `/api/game/state` every second; every action posts with the version it saw, so a stale action conflicts instead of corrupting state.

**Tech Stack:** Cloudflare Pages + Pages Functions, D1, vanilla ES modules on the server, vanilla JS + CSS + Web Audio in the browser, Node's built-in test runner.

**Spec:** `docs/superpowers/specs/2026-11-18-poison-challenge-design.md`

## Global Constraints

- No third-party npm dependencies; tests use `node --test`.
- Existing 100 tests must stay green (`npm test`).
- Secrets never in `public/`; `GAME_PIN` defaults to `5649` and is compared only server-side.
- Student identity comes from the signed bearer token, never from a request body.
- Files under `public/` are deployed by `wrangler pages deploy public --project-name learnflow --branch main`; API changes ship in the same deployment.
- Keep `src/index.js` route style: `if (url.pathname === ... )` blocks inside `export default { async fetch(request, env) }`.

## Review Focus

- A student polling after the room resets gets a clean lobby payload, never a 500.
- Two players picking the same cell at once produce exactly one reveal and one life loss; the loser gets `409` and refreshes.
- A player who never places poisons cannot stall the game forever — admin reset and admin force-start both end the stall.
- An eliminated player still polls, sees the board, and cannot pick (`409`), rather than desyncing the turn.
- Five wrong PIN attempts do not lock a student out permanently, and a correct PIN after them still joins.

---

## File Structure

| File | Responsibility |
| --- | --- |
| `src/poison-engine.js` | Pure rules: grid size, shuffle, pick resolution, elimination, ranking. No I/O. |
| `src/poison-store.js` | `createMemoryGameStore()` and `createD1GameStore(db)`; same async interface. |
| `src/index.js` | `/api/game/*` routes, PIN gate, bearer auth, engine + store orchestration. |
| `migrations/0001_poison.sql` | D1 schema. |
| `wrangler.toml` | `[[d1_databases]]` binding `GAMES_DB`. |
| `public/poison.html` | Game page shell. |
| `public/assets/css/poison.css` | Board, states, boom animation, shake. |
| `public/assets/js/poison-game.js` | PIN gate, lobby, placement, polling, board, audio, leaderboard. |
| `public/assets/js/student-subjects.js` | Adds the "Game mode" entry button. |
| `public/parent.html` | Admin Start / Reset room controls. |
| `tests/poison-engine.test.mjs` | Engine unit tests (ESM, matching `src/`). |
| `tests/poison-store.test.mjs` | Store tests with the memory store. |
| `tests/poison-api.test.mjs` | Route tests with the memory store. |
| `tests/poison-pages.test.js` | Static page wiring assertions (CommonJS, like the other page tests). |
| `package.json` | Test glob adds `tests/*.test.mjs`. |

---

### Task 1: Pure game engine

**Files:**
- Create: `src/poison-engine.js` (ESM, matching `src/progress.js`)
- Modify: `package.json` (test script)
- Test: `tests/poison-engine.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `gridForPlayers(playerCount: number): { cols: number, rows: number, cells: number }`
  - `shuffleOrder(ids: string[], rng?: () => number): string[]`
  - `activePlayers(players): Player[]` where `Player = { id, name, lives, eliminated, placementDone }`
  - `resolvePick(state, cell: number, rng?: () => number): { state, result }` — `result = { hit: boolean, poisonedBy: string[], eliminated: string[], winner: string | null }`
  - `rankPlayers(players): { id, name, lives, rank }[]`
  - `POISON_COUNT = 3`, `LIVES = 3`

- [ ] **Step 1: Write the failing tests**

```js
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
    status: 'playing', turnOrder: ['a', 'b'], turnIndex: 0, version: 1,
    poisons: { 1: ['b'] }, revealed: {},
    players: [
      { id: 'a', name: 'A', lives: 1, eliminated: false },
      { id: 'b', name: 'B', lives: 3, eliminated: false }
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
```

- [ ] **Step 2: Update the test script and run to verify failure**

Change `package.json` `"test"` to:

```json
"test": "node --test tests/*.test.js tests/*.test.mjs"
```

Run: `node --test tests/poison-engine.test.mjs`
Expected: FAIL — `Cannot find module '../src/poison-engine.js'`.

- [ ] **Step 3: Implement `src/poison-engine.js`**

ESM, named exports (same style as `src/progress.js`). Implement the eight exports above. Requirements: `gridForPlayers` picks `Math.ceil(Math.sqrt(Math.max(16, n * 8)))` for both sides; `resolvePick` throws `Error('cell already revealed')` and `Error('game is not in play')`; `resolvePick` advances `turnIndex` to the next non-eliminated player, wrapping.

- [ ] **Step 4: Run to verify pass**

Run: `node --test tests/poison-engine.test.mjs`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/poison-engine.js tests/poison-engine.test.mjs package.json
git commit -m "feat(poison): add pure game engine with tests"
```

---

### Task 2: Store interface, D1 schema, and binding

**Files:**
- Create: `src/poison-store.js`
- Create: `migrations/0001_poison.sql`
- Modify: `wrangler.toml`
- Test: `tests/poison-store.test.mjs`

**Interfaces:**
- Consumes: `Player` shape from Task 1.
- Produces `createMemoryGameStore()` and `createD1GameStore(db)` returning the same object:
  - `getActive(): Promise<Game | null>`
  - `createLobby(): Promise<Game>`
  - `join(gameId, student: { id, name }): Promise<Game>`
  - `setPlacement(gameId, studentId, cells: number[]): Promise<Game>`
  - `start(gameId, rng?): Promise<Game>`
  - `pick(gameId, studentId, cell, expectedVersion): Promise<{ game, result }>` — throws `Error('version conflict')` on mismatch
  - `reset(): Promise<void>`
  - `state(gameId, viewerId): Promise<object>` — poisons of other players are omitted; own poisons and all reveals included
  - `Game = { id, status: 'lobby'|'placement'|'playing'|'finished', cols, rows, players: Player[], turnOrder: string[], turnIndex: number, version: number, winner: string|null }`

- [ ] **Step 1: Write the failing test**

```js
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
```

- [ ] **Step 2: Run to verify failure**

Run: `node --test tests/poison-store.test.mjs`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `migrations/0001_poison.sql`**

```sql
CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  cols INTEGER NOT NULL DEFAULT 0,
  rows INTEGER NOT NULL DEFAULT 0,
  turn_order TEXT NOT NULL DEFAULT '[]',
  turn_index INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 0,
  winner TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS players (
  game_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  name TEXT NOT NULL,
  lives INTEGER NOT NULL DEFAULT 3,
  eliminated INTEGER NOT NULL DEFAULT 0,
  join_index INTEGER NOT NULL,
  placement TEXT,
  PRIMARY KEY (game_id, student_id)
);
CREATE TABLE IF NOT EXISTS poisons (
  game_id TEXT NOT NULL,
  cell INTEGER NOT NULL,
  owner TEXT NOT NULL,
  PRIMARY KEY (game_id, cell, owner)
);
CREATE TABLE IF NOT EXISTS reveals (
  game_id TEXT NOT NULL,
  cell INTEGER NOT NULL,
  student_id TEXT NOT NULL,
  hit INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (game_id, cell)
);
```

- [ ] **Step 4: Add the binding to `wrangler.toml`**

```toml
[[d1_databases]]
binding = "GAMES_DB"
database_name = "learnflow-games"
database_id = "REPLACE_WITH_ID_FROM_wrangler_d1_create"
```

Create the real database and paste the returned `database_id`:

```bash
npx wrangler d1 create learnflow-games
npx wrangler d1 execute learnflow-games --remote --file=migrations/0001_poison.sql
npx wrangler d1 execute learnflow-games --local --file=migrations/0001_poison.sql
```

- [ ] **Step 5: Implement `src/poison-store.js`**

Exports `createMemoryGameStore()` (Map-backed, used by tests) and `createD1GameStore(db)` (uses `db.prepare(...).bind(...).first()/all()/run()` and `db.batch`). Both must expose the exact interface above and share the engine for `start`/`pick`. D1 version guard:

```js
const guard = await db.prepare('UPDATE games SET version = version + 1 WHERE id = ? AND version = ?')
  .bind(gameId, expectedVersion).run();
if (!guard.meta || guard.meta.changes !== 1) throw new Error('version conflict');
```

- [ ] **Step 6: Run tests**

Run: `node --test tests/poison-store.test.js`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/poison-store.js migrations/0001_poison.sql wrangler.toml tests/poison-store.test.js
git commit -m "feat(poison): add store interface, D1 schema, and binding"
```

---

### Task 3: API routes

**Files:**
- Modify: `src/index.js` (new route block before the `// ---- HOMEWORK` block)
- Test: `tests/poison-api.test.mjs`

**Interfaces:**
- Consumes: engine (Task 1), store (Task 2), existing `readSignedToken`, `verifyToken`, `bearer`.
- Produces routes:
  - `POST /api/game/join` `{ pin }` → `{ ok, game }`; `403` wrong PIN; `429` after 5 wrong attempts for the same student within 10 minutes.
  - `POST /api/game/poison` `{ cells: number[3], version }` → `{ ok, game }`
  - `POST /api/game/pick` `{ cell, version }` → `{ ok, game, result }`
  - `GET /api/game/state` → `{ ok, game }`
  - `POST /api/game/start` (admin bearer) → `{ ok, game }`
  - `POST /api/game/reset` (admin bearer) → `{ ok }`
- Store selection: `env.GAME_STORE || createD1GameStore(env.GAMES_DB)`; if neither, `503`.

- [ ] **Step 1: Write the failing test**

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../src/index.js';
import { createMemoryGameStore } from '../src/poison-store.js';

function env(store) {
  return {
    ADMIN_USERNAME: 'kazi', ADMIN_PASSWORD: '5649', ADMIN_TOKEN_SECRET: 'test-secret',
    GAME_PIN: '5649', GAME_STORE: store, HOMEWORK: { get: async () => null, put: async () => {} }
  };
}
async function studentToken(e, name) {
  const login = await worker.fetch(new Request('https://t.local/api/auth/login', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name, pin: '0000' })
  }), e);
  const first = await login.json();
  if (first.sessionToken) return first.sessionToken;
  const setup = await worker.fetch(new Request('https://t.local/api/auth/set-pin', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ setupToken: first.setupToken, newPin: '1234' })
  }), e);
  return (await setup.json()).sessionToken;
}

function post(path, body, token) {
  const headers = { 'content-type': 'application/json' };
  if (token) headers.authorization = 'Bearer ' + token;
  return worker.fetch(new Request('https://t.local' + path, {
    method: 'POST', headers, body: JSON.stringify(body)
  }), env(store));
}

test('join requires the game pin and a student session', async () => {
  const store = createMemoryGameStore();
  const anon = await post('/api/game/join', { pin: '5649' });
  assert.equal(anon.status, 401);
  const token = await studentToken(env(store), 'Adnan');
  const badPin = await post('/api/game/join', { pin: '0000' }, token);
  assert.equal(badPin.status, 403);
  const ok = await post('/api/game/join', { pin: '5649' }, token);
  assert.equal(ok.status, 200);
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
  const token = await studentToken(env(store), other === 'adnan' ? 'Adnan' : 'Nafis');
  const response = await post('/api/game/pick', { cell: 9, version: playing.version }, token);
  assert.equal(response.status, 409);
  assert.equal((await response.json()).error, 'not your turn');
});
```

- [ ] **Step 2: Run and confirm failure**

Run: `node --test tests/poison-api.test.mjs`
Expected: FAIL — 404 on `/api/game/join`.

- [ ] **Step 3: Implement the routes in `src/index.js`**

Each route: resolve claims via `readSignedToken(env, bearer(request))`; require `claims.role === 'student'` for join/poison/pick, and accept admin for state. Use `validStudent(claims.student)`. Map errors: `version conflict` → `409 { error: 'state changed, refresh' }`; `not your turn` → `409`; wrong PIN → `403 { error: 'Wrong PIN' }`; unknown/absent game → `404`.

- [ ] **Step 4: Run tests**

Run: `node --test tests/poison-api.test.mjs && npm test`
Expected: PASS, existing suite still 100+ green.

- [ ] **Step 5: Commit**

```bash
git add src/index.js tests/poison-api.test.js
git commit -m "feat(poison): add game API routes with auth and turn checks"
```

---

### Task 4: Game page, animation, sound, polling

**Files:**
- Create: `public/poison.html`
- Create: `public/assets/js/poison-game.js`
- Create: `public/assets/css/poison.css`
- Test: `tests/poison-pages.test.js`

**Interfaces:**
- Consumes: all route shapes from Task 3; `window.LEARNFLOW_AUTH` set by `student-auth.js`.
- Produces: page at `/poison`; visible states `pin`, `lobby`, `placement`, `playing`, `finished`.

- [ ] **Step 1: Write the failing page test**

```js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const root = path.resolve(__dirname, '..');

test('poison page loads auth, game module, and styles', () => {
  const html = fs.readFileSync(path.join(root, 'public/poison.html'), 'utf8');
  assert.match(html, /assets\/js\/student-auth\.js/);
  assert.match(html, /assets\/js\/poison-game\.js/);
  assert.match(html, /assets\/css\/poison\.css/);
});

test('game module has pin, placement, polling, boom, and leaderboard', () => {
  const js = fs.readFileSync(path.join(root, 'public/assets/js/poison-game.js'), 'utf8');
  for (const needle of ['/api/game/join', '/api/game/pick', '/api/game/state', 'AudioContext', 'boom', 'leaderboard', 'Not your turn']) {
    assert.ok(js.includes(needle), 'missing ' + needle);
  }
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `node --test tests/poison-pages.test.js`
Expected: FAIL — `ENOENT public/poison.html`.

- [ ] **Step 3: Implement the page, CSS, and client module**

Client requirements: PIN form posts to `/api/game/join`; polls `GET /api/game/state` every 1000 ms; renders a CSS grid sized from `game.cols`/`game.rows`; placement lets the student toggle exactly 3 cells then submit; non-current players get `pointer-events: none` plus `aria-disabled="true"` and an overlay label **"Not your turn"**; clicking anyway shows the same message; boom play uses `AudioContext` oscillator + noise burst (no files) and adds a `.boom` class for 700 ms plus a `body.shake` class for 300 ms; finished state renders the leaderboard from `game.players` ordered by rank.

- [ ] **Step 4: Run tests**

Run: `node --test tests/poison-pages.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add public/poison.html public/assets/js/poison-game.js public/assets/css/poison.css tests/poison-pages.test.js
git commit -m "feat(poison): add game page with boom animation and sound"
```

---

### Task 5: Student dashboard entry

**Files:**
- Modify: `public/assets/js/student-subjects.js` (after the Assignments load block, ~line 929)
- Test: `tests/poison-pages.test.js` (extend)

**Interfaces:**
- Consumes: nothing new.
- Produces: a card/link pointing to `/poison` labelled **Game mode**.

- [ ] **Step 1: Add the failing assertion**

```js
test('student dashboard links to the game page', () => {
  const js = fs.readFileSync(path.join(root, 'public/assets/js/student-subjects.js'), 'utf8');
  assert.match(js, /\/poison/);
  assert.match(js, /Game mode/);
});
```

- [ ] **Step 2: Run — expect failure**

Run: `node --test tests/poison-pages.test.js`
Expected: FAIL on the new assertion.

- [ ] **Step 3: Implement**

Append to the assigned panel a small section built with the existing `createElement` helper: title **Game mode**, text **Poison Challenge — pin required**, anchor to `/poison`. Use existing class names where possible; add one class `.game-entry` to `public/assets/css/poison.css`.

- [ ] **Step 4: Run tests**

Run: `node --test tests/poison-pages.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add public/assets/js/student-subjects.js public/assets/css/poison.css tests/poison-pages.test.js
git commit -m "feat(poison): add game mode entry to student dashboards"
```

---

### Task 6: Admin controls

**Files:**
- Modify: `public/parent.html` (new tab content + JS using the existing `token` variable)
- Test: `tests/poison-pages.test.js` (extend)

**Interfaces:**
- Consumes: `POST /api/game/start`, `POST /api/game/reset`.
- Produces: **Game room** tab with status line, **Start game** button, **Reset room** button.

- [ ] **Step 1: Add the failing assertion**

```js
test('admin panel exposes game room controls', () => {
  const html = fs.readFileSync(path.join(root, 'public/parent.html'), 'utf8');
  assert.match(html, /data-tab="game-room"/);
  assert.match(html, /\/api\/game\/start/);
  assert.match(html, /\/api\/game\/reset/);
});
```

- [ ] **Step 2: Run — expect failure**

Run: `node --test tests/poison-pages.test.js`
Expected: FAIL.

- [ ] **Step 3: Implement**

Add a main tab button and `#tab-game-room` content block matching existing tab markup; wire the two buttons with `fetch(..., { method: 'POST', headers: { Authorization: 'Bearer ' + token } })`; show the JSON error text on failure.

- [ ] **Step 4: Run tests**

Run: `node --test tests/poison-pages.test.js && npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add public/parent.html tests/poison-pages.test.js
git commit -m "feat(poison): add admin start and reset controls"
```

---

### Task 7: Deploy and verify

**Files:** none.

- [ ] **Step 1: Full test run**

Run: `npm test`
Expected: all tests pass, exit 0.

- [ ] **Step 2: Deploy**

```bash
cd ~/tutions
export CLOUDFLARE_API_TOKEN=$(grep -m1 '^CLOUDFLARE_API_TOKEN=' /home/ihthos/Desktop/learnflow-cloudflare.env | cut -d= -f2-)
export CLOUDFLARE_ACCOUNT_ID=31be8927317743de7c53735967899b39
npx wrangler pages deploy public --project-name learnflow --branch main
```

- [ ] **Step 3: Verify**

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://learnflow.ihthos.dev/poison
curl -s -o /dev/null -w '%{http_code}\n' https://learnflow.ihthos.dev/api/game/state
```

Expected: page `200`; state `401` without a token.

- [ ] **Step 4: Commit any residual changes and report the deployment URL**
