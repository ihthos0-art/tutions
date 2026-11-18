# Poison Challenge — design

## Intent

A short multiplayer game for tutoring students on LearnFlow. It is a reward
activity, not coursework: join with the existing student login, place secret
poisons, take turns, last student with lives left wins.

## Goals

- Unlock only with the game PIN (5649), verified on the server.
- Every enrolled student can join one shared room and play together.
- Secret poison placement, then turn-based picks with clear turn ownership.
- Boom feedback: animation and sound on every poison hit.
- Leaderboard at the end; eliminated players become spectators.

## Non-goals

- Persistent scores or historical leaderboards across days.
- Multiple concurrent rooms, matchmaking, chat, or in-game messaging.
- Replacing or altering the worksheet/assignment features.
- Accounts or identities beyond the existing student roster and session tokens.

## Constraints

- Deployed as Cloudflare Pages + Pages Functions (`functions/api/[[path]].js`
  → `src/index.js`), static assets in `public/`.
- KV (`HOMEWORK`) is eventually consistent (up to ~60 s), so it cannot hold
  live turn state.
- No third-party npm dependencies; tests use Node's built-in test runner.
- Existing 100 tests must stay green; secrets never committed.

## Approaches considered

1. **D1 + polling (chosen).** Strongly consistent reads, one binding, works
   through the existing API adapter. Clients poll state every second.
2. **Durable Object + WebSocket.** True realtime and cheaper polling, but
   Pages Functions would need a `_worker.js` restructure that risks the current
   API adapter and deployment flow.
3. **KV + polling.** No new infrastructure, but reads from another colo can be
   stale for up to 60 s, which breaks turn order. Rejected.

## Rules

- PIN gate: server-side comparison against `GAME_PIN` (default `5649`).
  The PIN is never shipped to the client.
- One shared room. Students join using their existing bearer session; the
  server records `student_id` from the token, never from the request body.
- Grid: `cells = max(16, players * 8)`, laid out near-square.
  2 players → 4×4, 3 → 5×5, 4 → 6×6, 6 → 7×7. Grid is fixed when the admin
  starts the game; no joining after start.
- Placement: each student secretly marks exactly 3 cells. Overlaps are
  allowed; a cell hit is a boom regardless of how many owners it has.
- Turn order: randomly shuffled at start. Only the current player may pick.
  Other players' grids are greyed and clicking reports "Not your turn."
- A pick reveals the cell for everyone. Poison → boom + sound, −1 life.
  Safe → neutral tick.
- 3 lives each. At 0 the player is eliminated and spectates. Last player alive
  wins. If the room empties simultaneously (no single pick can do this), the
  later elimination ranks lower.
- Leaderboard ranks by survival, then remaining lives, then join order.
- Admin starts the game from `/parent`. A room stuck in lobby can be reset by
  the admin.

## Decisions made by the builder

- Own poison hurts its owner. Keeps placement secret and removes ownership
  advantage.
- Boom sound is synthesized with Web Audio; no audio files are hosted.
  Animation is CSS keyframes plus a short screen shake.
- Pure game logic lives in `src/poison-engine.js` and is unit-tested without
  network or database access.
- Game state persistence: four D1 tables —
  `games`, `players`, `poisons`, `reveals`.

## Deployed surface

- `GET /poison` — game page (static), entry button on student dashboards.
- `POST /api/game/join` — student joins the lobby.
- `POST /api/game/poison` — place the three poisons (placement phase).
- `POST /api/game/pick` — take a turn (current player only).
- `GET /api/game/state` — poll state; versioned payload.
- `POST /api/game/start` — admin starts/resets the room.

## Left to the builder

- Exact visual treatment (within the existing LearnFlow style).
- Poll interval details and retry behaviour under flaky school networks.
- D1 schema migration SQL and local dev instructions.
- Test fixtures for grid sizing and elimination ordering.
