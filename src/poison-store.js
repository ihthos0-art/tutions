/* ============================================================================
   Poison Challenge persistence, two-team edition.

   Memory store for tests, D1 store for production, one shared snapshot shape.
   Teams share three lives; the engine owns the rules.
   ========================================================================== */

import {
  gridForPlayers, shuffleOrder, resolvePick, rankTeams, rankPlayers,
  POISON_COUNT, LIVES, TEAMS, MODES
} from './poison-engine.js';
import { isOnline, isLobbyStale } from './presence.js';

function newId() { return crypto.randomUUID(); }

function assertCells(cells, cellCount) {
  if (!Array.isArray(cells) || cells.length !== POISON_COUNT) throw new Error('exactly 3 poison cells are required');
  const unique = new Set(cells);
  if (unique.size !== POISON_COUNT) throw new Error('exactly 3 distinct poison cells are required');
  for (const cell of unique) {
    if (!Number.isInteger(cell) || cell < 0 || cell >= cellCount) throw new Error('poison cell is out of range');
  }
  return [...unique];
}

function assertTeam(team) {
  if (!TEAMS.includes(team)) throw new Error('team must be sun or wave');
  return team;
}

function publicPlayers(game, nowMs) {
  return game.players.map((player) => ({
    id: player.id,
    name: player.name,
    team: player.team,
    lives: Number(player.lives ?? LIVES),
    eliminated: Boolean(player.eliminated),
    joinIndex: player.joinIndex,
    placementDone: Boolean(player.placementDone),
    online: isOnline(player.lastSeen, nowMs)
  }));
}

function publicGame(game, nowMs = Date.now()) {
  return {
    id: game.id,
    status: game.status,
    cols: game.cols,
    rows: game.rows,
    turnOrder: game.turnOrder.slice(),
    turnIndex: game.turnIndex,
    version: game.version,
    mode: game.mode || 'solo',
    winnerTeam: game.winnerTeam || null,
    winnerPlayer: game.winnerPlayer || null,
    teamLives: { sun: game.teamLives.sun, wave: game.teamLives.wave },
    players: publicPlayers(game, nowMs)
  };
}

export function createMemoryGameStore(options = {}) {
  const now = options.now || (() => Date.now());
  const lobbyTtl = Number.isFinite(options.lobbyTtlMs) ? options.lobbyTtlMs : 90000;
  let activeId = null;
  const games = new Map();
  const poisons = new Map();
  const reveals = new Map();

  function game(gameId) {
    const found = games.get(gameId);
    if (!found) throw new Error('game not found');
    return found;
  }
  function poisonMap(gameId) {
    if (!poisons.has(gameId)) poisons.set(gameId, new Map());
    return poisons.get(gameId);
  }
  function revealMap(gameId) {
    if (!reveals.has(gameId)) reveals.set(gameId, new Map());
    return reveals.get(gameId);
  }

  const store = {
    async getActive() {
      const found = activeId ? games.get(activeId) : null;
      return found ? publicGame(found, now()) : null;
    },

    async createLobby() {
      if (activeId) {
        const current = games.get(activeId);
        if (current && current.status !== 'finished') return publicGame(current, now());
      }
      const id = newId();
      games.set(id, {
        id, status: 'lobby', cols: 0, rows: 0, turnOrder: [], turnIndex: 0,
        version: 0, mode: 'solo', winnerTeam: null, winnerPlayer: null, players: [],
        teamLives: { sun: LIVES, wave: LIVES },
        createdAt: new Date().toISOString()
      });
      poisons.set(id, new Map());
      reveals.set(id, new Map());
      activeId = id;
      return publicGame(games.get(id), now());
    },

    async join(gameId, student, team) {
      const found = game(gameId);
      if (found.status !== 'lobby') throw new Error('game already started');
      const wantsTeam = found.mode === 'teams';
      if (wantsTeam) assertTeam(team);
      const existing = found.players.find((player) => player.id === student.id);
      if (existing) {
        existing.team = wantsTeam ? team : null;
        existing.name = student.name;
        existing.lastSeen = now();
      } else {
        found.players.push({
          id: student.id, name: student.name, team: wantsTeam ? team : null,
          lives: LIVES, eliminated: false,
          joinIndex: found.players.length, placementDone: false, lastSeen: now()
        });
      }
      found.version += 1;
      return publicGame(found, now());
    },

    async leave(gameId, studentId) {
      const found = game(gameId);
      if (found.status !== 'lobby') throw new Error('cannot leave after the game starts');
      const before = found.players.length;
      found.players = found.players.filter((player) => player.id !== studentId);
      if (found.players.length === before) throw new Error('player is not in this game');
      found.players.forEach((player, index) => { player.joinIndex = index; });
      found.version += 1;
      return publicGame(found, now());
    },

    async kick(gameId, studentId) {
      return store.leave(gameId, studentId);
    },

    async setMode(gameId, mode) {
      const found = await requireGame(gameId);
      if (found.status !== 'lobby') throw new Error('mode can only change in the lobby');
      if (!MODES.includes(mode)) throw new Error('mode must be solo or teams');
      await db.prepare('UPDATE games SET mode = ?, version = version + 1 WHERE id = ?')
        .bind(mode, gameId).run();
      if (mode === 'teams') {
        const rows = await db.prepare(
          'SELECT student_id FROM players WHERE game_id = ? AND (team IS NULL OR team = \'\') ORDER BY join_index'
        ).bind(gameId).all();
        const statements = (rows.results || []).map((row, index) => db.prepare(
          'UPDATE players SET team = ? WHERE game_id = ? AND student_id = ?'
        ).bind(TEAMS[index % 2], gameId, row.student_id));
        if (statements.length) await db.batch(statements);
      }
      return publicGame(await requireGame(gameId));
    },

    async setMode(gameId, mode) {
      const found = game(gameId);
      if (found.status !== 'lobby') throw new Error('mode can only change in the lobby');
      if (!MODES.includes(mode)) throw new Error('mode must be solo or teams');
      found.mode = mode;
      if (mode === 'teams') {
        found.players.forEach((player, index) => {
          if (!TEAMS.includes(player.team)) player.team = TEAMS[index % 2];
        });
      }
      found.version += 1;
      return publicGame(found, now());
    },



    async start(gameId, rng = Math.random) {
      const found = game(gameId);
      if (found.status !== 'lobby') throw new Error('game already started');
      if (found.players.length < 2) throw new Error('need at least two players');
      if (found.mode === 'teams' && !TEAMS.every((team) => found.players.some((player) => player.team === team))) {
        throw new Error('both teams need at least one player');
      }
      found.players.forEach((player) => {
        player.eliminated = false;
        player.lives = LIVES;
      });
      const grid = gridForPlayers(found.players.length);
      found.cols = grid.cols;
      found.rows = grid.rows;
      found.turnOrder = shuffleOrder(found.players.map((player) => player.id), rng);
      found.turnIndex = 0;
      found.status = 'placement';
      found.teamLives = { sun: LIVES, wave: LIVES };
      found.winnerTeam = null;
      found.winnerPlayer = null;
      found.version += 1;
      return publicGame(found, now());
    },

    async setPlacement(gameId, studentId, cells) {
      const found = game(gameId);
      if (found.status !== 'placement') throw new Error('game is not in placement');
      const player = found.players.find((item) => item.id === studentId);
      if (!player) throw new Error('player is not in this game');
      const checked = assertCells(cells, found.cols * found.rows);
      const map = poisonMap(gameId);
      for (const [cell, owners] of map) {
        const filtered = owners.filter((owner) => owner !== studentId);
        if (filtered.length) map.set(cell, filtered);
        else map.delete(cell);
      }
      for (const cell of checked) {
        map.set(cell, [...(map.get(cell) || []), studentId]);
      }
      player.placementDone = true;
      found.version += 1;
      if (found.players.every((item) => item.placementDone)) found.status = 'playing';
      return publicGame(found, now());
    },

    async forceStart(gameId, rng = Math.random) {
      const found = game(gameId);
      if (found.status !== 'placement') throw new Error('game is not in placement');
      const map = poisonMap(gameId);
      for (const player of found.players) {
        if (player.placementDone) continue;
        const cells = new Set();
        while (cells.size < POISON_COUNT) cells.add(Math.floor(rng() * found.cols * found.rows));
        for (const cell of cells) map.set(cell, [...(map.get(cell) || []), player.id]);
        player.placementDone = true;
      }
      found.status = 'playing';
      found.version += 1;
      return publicGame(found, now());
    },

    async pick(gameId, studentId, cell, expectedVersion) {
      const found = game(gameId);
      if (found.version !== expectedVersion) throw new Error('version conflict');
      if (found.status !== 'playing') throw new Error('game is not in play');
      if (found.turnOrder[found.turnIndex] !== studentId) throw new Error('not your turn');
      const map = poisonMap(gameId);
      const revealMapRef = revealMap(gameId);
      const engineState = {
        mode: found.mode,
        status: found.status,
        turnOrder: found.turnOrder,
        turnIndex: found.turnIndex,
        players: found.players.map((player) => ({ ...player })),
        teamLives: { ...found.teamLives },
        poisons: Object.fromEntries(map),
        revealed: Object.fromEntries(revealMapRef)
      };
      const { state: next, result } = resolvePick(engineState, cell);
      found.players = found.players.map((player) => {
        const updated = next.players.find((item) => item.id === player.id);
        return { ...player, eliminated: updated.eliminated, lives: updated.lives };
      });
      found.teamLives = next.teamLives;
      found.turnIndex = next.turnIndex;
      found.status = next.status;
      found.winnerTeam = next.winnerTeam;
      found.winnerPlayer = next.winnerPlayer;
      found.version += 1;
      revealMapRef.set(String(cell), next.revealed[String(cell)]);
      return { game: await store.state(gameId, studentId), result };
    },

    async state(gameId, viewerId) {
      const found = game(gameId);
      const viewer = found.players.find((player) => player.id === viewerId);
      if (viewer) viewer.lastSeen = now();
      if (found.status === 'lobby') {
        const before = found.players.length;
        found.players = found.players.filter((player) => !isLobbyStale(player.lastSeen, now(), lobbyTtl));
        if (found.players.length !== before) found.version += 1;
      }
      const map = poisonMap(gameId);
      const ownPoisons = [];
      for (const [cell, owners] of map) {
        if (owners.includes(viewerId)) ownPoisons.push(Number(cell));
      }
      ownPoisons.sort((a, b) => a - b);
      return {
        ...publicGame(found, now()),
        revealed: Object.fromEntries(revealMap(gameId)),
        ownPoisons,
        myTeam: viewer ? viewer.team : null,
        myTurn: found.status === 'playing' && found.turnOrder[found.turnIndex] === viewerId,
        leaderboard: found.status === 'finished'
          ? (found.mode === 'solo' ? rankPlayers(found.players) : rankTeams(found.teamLives, found.players))
          : []
      };
    },

    async reset() {
      games.clear();
      poisons.clear();
      reveals.clear();
      activeId = null;
    }
  };

  return store;
}

export function createD1GameStore(db) {
  if (!db) throw new Error('GAMES_DB binding is not configured');

  async function loadGame(gameId) {
    const row = await db.prepare('SELECT * FROM games WHERE id = ?').bind(gameId).first();
    if (!row) return null;
    const players = await db.prepare('SELECT * FROM players WHERE game_id = ? ORDER BY join_index').bind(gameId).all();
    return {
      id: row.id,
      status: row.status,
      cols: row.cols,
      rows: row.rows,
      turnOrder: JSON.parse(row.turn_order || '[]'),
      turnIndex: row.turn_index,
      version: row.version,
      mode: row.mode || 'solo',
      winnerTeam: row.winner || null,
      winnerPlayer: row.winner_player || null,
      teamLives: {
        sun: Number(row.team_lives_sun ?? LIVES),
        wave: Number(row.team_lives_wave ?? LIVES)
      },
      players: (players.results || []).map((player) => ({
        id: player.student_id,
        name: player.name,
        team: player.team,
        lives: Number(player.lives ?? LIVES),
        eliminated: Boolean(player.eliminated),
        joinIndex: player.join_index,
        placementDone: Boolean(player.placement),
        lastSeen: player.last_seen
      }))
    };
  }

  async function loadPoisons(gameId) {
    const rows = await db.prepare('SELECT cell, owner FROM poisons WHERE game_id = ?').bind(gameId).all();
    const map = new Map();
    for (const row of rows.results || []) map.set(row.cell, [...(map.get(row.cell) || []), row.owner]);
    return map;
  }

  async function loadReveals(gameId) {
    const rows = await db.prepare('SELECT cell, student_id, hit FROM reveals WHERE game_id = ?').bind(gameId).all();
    const out = {};
    for (const row of rows.results || []) out[String(row.cell)] = { hit: Boolean(row.hit), by: row.student_id };
    return out;
  }

  async function requireGame(id) {
    const found = await loadGame(id);
    if (!found) throw new Error('game not found');
    return found;
  }

  async function saveState(game) {
    await db.prepare(
      `UPDATE games SET status = ?, mode = ?, cols = ?, rows = ?, turn_order = ?, turn_index = ?,
       version = ?, winner = ?, team_lives_sun = ?, team_lives_wave = ? WHERE id = ?`
    ).bind(
      game.status, game.mode || 'solo', game.cols, game.rows, JSON.stringify(game.turnOrder), game.turnIndex,
      game.version, game.winnerTeam, game.teamLives.sun, game.teamLives.wave, game.id
    ).run();
  }

  const store = {
    async getActive() {
      const row = await db.prepare(
        `SELECT id FROM games WHERE status IN ('lobby','placement','playing','finished') ORDER BY created_at DESC LIMIT 1`
      ).first();
      if (!row) return null;
      const found = await requireGame(row.id);
      return publicGame(found);
    },

    async createLobby() {
      const id = newId();
      const inserted = await db.prepare(
        `INSERT INTO games (id, status, created_at)
         SELECT ?, 'lobby', ?
         WHERE NOT EXISTS (SELECT 1 FROM games WHERE status IN ('lobby','placement','playing'))`
      ).bind(id, new Date().toISOString()).run();
      if (inserted.meta && inserted.meta.changes === 1) return publicGame(await requireGame(id));
      const row = await db.prepare(
        `SELECT id FROM games WHERE status IN ('lobby','placement','playing') ORDER BY created_at DESC LIMIT 1`
      ).first();
      return publicGame(await requireGame(row.id));
    },

    async join(gameId, student, team) {
      const found = await requireGame(gameId);
      if (found.status !== 'lobby') throw new Error('game already started');
      const wantsTeam = found.mode === 'teams';
      if (wantsTeam) assertTeam(team);
      const seat = wantsTeam ? team : null;
      const existing = found.players.find((player) => player.id === student.id);
      if (existing) {
        await db.prepare('UPDATE players SET team = ?, name = ?, last_seen = ? WHERE game_id = ? AND student_id = ?')
          .bind(seat, student.name, Date.now(), gameId, student.id).run();
      } else {
        await db.prepare(
          'INSERT OR IGNORE INTO players (game_id, student_id, name, lives, eliminated, join_index, team, last_seen) VALUES (?, ?, ?, ?, 0, ?, ?, ?)'
        ).bind(gameId, student.id, student.name, LIVES, found.players.length, seat, Date.now()).run();
      }
      await db.prepare('UPDATE games SET version = version + 1 WHERE id = ?').bind(gameId).run();
      return publicGame(await requireGame(gameId));
    },

    async leave(gameId, studentId) {
      const found = await requireGame(gameId);
      if (found.status !== 'lobby') throw new Error('cannot leave after the game starts');
      const result = await db.prepare('DELETE FROM players WHERE game_id = ? AND student_id = ?')
        .bind(gameId, studentId).run();
      if (!result.meta || result.meta.changes !== 1) throw new Error('player is not in this game');
      await db.prepare('UPDATE games SET version = version + 1 WHERE id = ?').bind(gameId).run();
      return publicGame(await requireGame(gameId));
    },

    async kick(gameId, studentId) {
      return store.leave(gameId, studentId);
    },



    async start(gameId, rng = Math.random) {
      const found = await requireGame(gameId);
      if (found.status !== 'lobby') throw new Error('game already started');
      if (found.players.length < 2) throw new Error('need at least two players');
      if (found.mode === 'teams' && !TEAMS.every((team) => found.players.some((player) => player.team === team))) {
        throw new Error('both teams need at least one player');
      }
      await db.prepare('UPDATE players SET lives = ?, eliminated = 0 WHERE game_id = ?')
        .bind(LIVES, gameId).run();
      const grid = gridForPlayers(found.players.length);
      found.cols = grid.cols;
      found.rows = grid.rows;
      found.turnOrder = shuffleOrder(found.players.map((player) => player.id), rng);
      found.turnIndex = 0;
      found.status = 'placement';
      found.teamLives = { sun: LIVES, wave: LIVES };
      found.winnerTeam = null;
      found.version += 1;
      await saveState(found);
      return publicGame(await requireGame(gameId));
    },

    async setPlacement(gameId, studentId, cells) {
      const found = await requireGame(gameId);
      if (found.status !== 'placement') throw new Error('game is not in placement');
      if (!found.players.some((player) => player.id === studentId)) throw new Error('player is not in this game');
      const checked = assertCells(cells, found.cols * found.rows);
      const statements = [
        db.prepare('DELETE FROM poisons WHERE game_id = ? AND owner = ?').bind(gameId, studentId),
        db.prepare('UPDATE players SET placement = ? WHERE game_id = ? AND student_id = ?')
          .bind(JSON.stringify(checked), gameId, studentId),
        ...checked.map((cell) => db.prepare('INSERT OR REPLACE INTO poisons (game_id, cell, owner) VALUES (?, ?, ?)')
          .bind(gameId, cell, studentId))
      ];
      await db.batch(statements);
      const placed = await db.prepare(
        'SELECT COUNT(*) AS done FROM players WHERE game_id = ? AND placement IS NOT NULL'
      ).bind(gameId).first();
      const status = Number(placed.done) === found.players.length ? 'playing' : 'placement';
      await db.prepare('UPDATE games SET status = ?, version = version + 1 WHERE id = ?')
        .bind(status, gameId).run();
      return publicGame(await requireGame(gameId));
    },

    async forceStart(gameId, rng = Math.random) {
      const found = await requireGame(gameId);
      if (found.status !== 'placement') throw new Error('game is not in placement');
      const statements = [];
      for (const player of found.players) {
        if (player.placementDone) continue;
        const cells = new Set();
        while (cells.size < POISON_COUNT) cells.add(Math.floor(rng() * found.cols * found.rows));
        for (const cell of cells) {
          statements.push(db.prepare('INSERT OR REPLACE INTO poisons (game_id, cell, owner) VALUES (?, ?, ?)')
            .bind(gameId, cell, player.id));
        }
        statements.push(db.prepare('UPDATE players SET placement = ? WHERE game_id = ? AND student_id = ?')
          .bind(JSON.stringify([...cells]), gameId, player.id));
      }
      statements.push(db.prepare(`UPDATE games SET status = 'playing', version = version + 1 WHERE id = ?`)
        .bind(gameId));
      await db.batch(statements);
      return publicGame(await requireGame(gameId));
    },

    async pick(gameId, studentId, cell, expectedVersion) {
      const preliminary = await requireGame(gameId);
      if (preliminary.version !== expectedVersion) throw new Error('version conflict');
      if (preliminary.status !== 'playing') throw new Error('game is not in play');
      if (preliminary.turnOrder[preliminary.turnIndex] !== studentId) throw new Error('not your turn');
      const guard = await db.prepare('UPDATE games SET version = version + 1 WHERE id = ? AND version = ? AND status = ?')
        .bind(gameId, expectedVersion, 'playing').run();
      if (!guard.meta || guard.meta.changes !== 1) throw new Error('version conflict');

      const found = await requireGame(gameId);
      const map = await loadPoisons(gameId);
      const revealed = await loadReveals(gameId);
      const engineState = {
        mode: found.mode,
        status: found.status,
        turnOrder: found.turnOrder,
        turnIndex: found.turnIndex,
        players: found.players.map((player) => ({ ...player })),
        teamLives: { ...found.teamLives },
        poisons: Object.fromEntries(map),
        revealed
      };
      const { state: next, result } = resolvePick(engineState, cell);
      const statements = [
        ...next.players.map((player) => db.prepare('UPDATE players SET eliminated = ?, lives = ? WHERE game_id = ? AND student_id = ?')
          .bind(player.eliminated ? 1 : 0, player.lives, gameId, player.id)),
        db.prepare('INSERT OR REPLACE INTO reveals (game_id, cell, student_id, hit, created_at) VALUES (?, ?, ?, ?, ?)')
          .bind(gameId, cell, studentId, result.hit ? 1 : 0, new Date().toISOString()),
        db.prepare('UPDATE games SET status = ?, turn_index = ?, winner = ?, team_lives_sun = ?, team_lives_wave = ? WHERE id = ?')
          .bind(next.status, next.turnIndex, next.winnerTeam, next.teamLives.sun, next.teamLives.wave, gameId)
      ];
      await db.batch(statements);
      return { game: await store.state(gameId, studentId), result };
    },

    async state(gameId, viewerId) {
      const found = await requireGame(gameId);
      if (found.players.some((player) => player.id === viewerId)) {
        await db.prepare('UPDATE players SET last_seen = ? WHERE game_id = ? AND student_id = ?')
          .bind(Date.now(), gameId, viewerId).run();
      }
      if (found.status === 'lobby') {
        await db.prepare('DELETE FROM players WHERE game_id = ? AND (last_seen IS NULL OR last_seen < ?)')
          .bind(gameId, Date.now() - 90000).run();
      }
      const fresh = await requireGame(gameId);
      const map = await loadPoisons(gameId);
      const revealed = await loadReveals(gameId);
      const viewer = fresh.players.find((player) => player.id === viewerId);
      const ownPoisons = [];
      for (const [cell, owners] of map) {
        if (owners.includes(viewerId)) ownPoisons.push(cell);
      }
      ownPoisons.sort((a, b) => a - b);
      return {
        ...publicGame(fresh),
        revealed,
        ownPoisons,
        myTeam: viewer ? viewer.team : null,
        myTurn: fresh.status === 'playing' && fresh.turnOrder[fresh.turnIndex] === viewerId,
        leaderboard: fresh.status === 'finished'
          ? (fresh.mode === 'solo' ? rankPlayers(fresh.players) : rankTeams(fresh.teamLives, fresh.players))
          : []
      };
    },

    async reset() {
      await db.batch([
        db.prepare('DELETE FROM reveals'),
        db.prepare('DELETE FROM poisons'),
        db.prepare('DELETE FROM players'),
        db.prepare('DELETE FROM games')
      ]);
    }
  };

  return store;
}
