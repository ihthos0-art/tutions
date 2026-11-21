/* ============================================================================
   Find and Cross.

   Two teams, one shared board of 50 numbers. The active team secretly picks a
   number, then crosses boxes on their own progress by holding each one for two
   seconds. The other team hunts for the secret number; tapping it stops the
   crossing and swaps roles. First team with all 50 crossed wins.
   ========================================================================== */

export const CROSS_CELLS = 50;
export const CROSS_HOLD_MS = 500;
export const CROSS_WRONG_MS = 1500;
const TEAMS = ['sun', 'wave'];

function newId() { return crypto.randomUUID(); }
function otherTeam(team) { return team === 'sun' ? 'wave' : 'sun'; }

export function makeCrossNumbers(rng = Math.random) {
  const pool = [];
  for (let n = 1; n <= 99; n += 1) pool.push(n);
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, CROSS_CELLS);
}

function publicPlayers(players, nowMs = Date.now()) {
  return players.map((player) => ({
    id: player.id, name: player.name, team: player.team, joinIndex: player.joinIndex,
    online: Boolean(player.lastSeen) && nowMs - Number(player.lastSeen) <= 25000
  }));
}

function snapshot(game, players, crosses, viewerId, nowMs = Date.now()) {
  const me = players.find((player) => player.id === viewerId);
  const myTeam = me ? me.team : null;
  const isPicker = myTeam === game.pickerTeam;
  return {
    id: game.id,
    status: game.status,
    phase: game.phase,
    round: game.round,
    numbers: (game.status === 'playing' && game.phase === 'pick' && !isPicker) ? null : game.numbers,
    pickerTeam: game.pickerTeam,
    finderTeam: game.finderTeam,
    secretCell: isPicker ? game.secretCell : null,
    secretNumber: game.secretNumber,
    players: publicPlayers(players, nowMs),
    myTeam,
    crossed: { sun: [...crosses.sun], wave: [...crosses.wave] },
    counts: { sun: crosses.sun.size, wave: crosses.wave.size },
    canPick: Boolean(me) && game.phase === 'pick' && isPicker,
    canCross: Boolean(me) && game.phase === 'cross' && isPicker,
    canGuess: Boolean(me) && game.phase === 'cross' && myTeam === game.finderTeam,
    holdingCell: me && game.holdBy === viewerId ? game.holdCell : null,
    guessCooldown: game.lastWrongAt
      ? Math.max(0, Number(game.lastWrongAt) + CROSS_WRONG_MS - nowMs)
      : 0,
    winner: game.winner || null,
    version: game.version
  };
}

export function createMemoryCrossStore(options = {}) {
  const now = options.now || (() => Date.now());
  const holdMs = Number.isFinite(options.holdMs) ? options.holdMs : CROSS_HOLD_MS;
  const wrongMs = Number.isFinite(options.wrongMs) ? options.wrongMs : CROSS_WRONG_MS;
  const lobbyTtl = Number.isFinite(options.lobbyTtlMs) ? options.lobbyTtlMs : 90000;
  const games = new Map();
  const players = new Map();
  const crosses = new Map();
  let activeId = null;

  function game(id) {
    const found = games.get(id);
    if (!found) throw new Error('game not found');
    return found;
  }
  function roster(id) {
    if (!players.has(id)) players.set(id, []);
    return players.get(id);
  }
  function crossMap(id) {
    if (!crosses.has(id)) crosses.set(id, { sun: new Set(), wave: new Set() });
    return crosses.get(id);
  }
  function requirePlayer(id, studentId) {
    const found = roster(id).find((player) => player.id === studentId);
    if (!found) throw new Error('player is not in this game');
    return found;
  }
  function bump(found) { found.version += 1; }
  function snap(id, viewerId) {
    const found = game(id);
    return snapshot(found, roster(id), crossMap(id), viewerId, now());
  }

  function swapRoles(found) {
    const finder = found.finderTeam;
    found.pickerTeam = finder;
    found.finderTeam = otherTeam(finder);
    found.phase = 'pick';
    found.secretCell = null;
    found.secretNumber = null;
    found.holdBy = null;
    found.holdCell = null;
    found.holdStartedAt = null;
    found.lastWrongAt = null;
    found.round += 1;
    bump(found);
  }

  const store = {
    async getActive() {
      const found = activeId ? games.get(activeId) : null;
      if (!found) return null;
      return snap(found.id, (roster(found.id)[0] || {}).id || '');
    },

    async createLobby(rng = Math.random) {
      if (activeId) {
        const current = games.get(activeId);
        if (current && current.status !== 'finished') return current.id;
      }
      const id = newId();
      games.set(id, {
        id, status: 'lobby', phase: 'lobby', round: 0, numbers: makeCrossNumbers(rng),
        pickerTeam: null, finderTeam: null, secretCell: null, secretNumber: null,
        holdBy: null, holdCell: null, holdStartedAt: null, lastWrongAt: null,
        winner: null, version: 0, createdAt: new Date().toISOString()
      });
      players.set(id, []);
      crosses.set(id, { sun: new Set(), wave: new Set() });
      activeId = id;
      return id;
    },

    async join(gameId, student, team) {
      if (!TEAMS.includes(team)) throw new Error('team must be sun or wave');
      const found = game(gameId);
      if (found.status !== 'lobby') throw new Error('game already started');
      const list = roster(gameId);
      const existing = list.find((player) => player.id === student.id);
      if (existing) {
        existing.team = team;
        existing.name = student.name;
        existing.lastSeen = now();
      } else {
        list.push({ id: student.id, name: student.name, team, joinIndex: list.length, lastSeen: now() });
      }
      bump(found);
      return snap(gameId, student.id);
    },

    async start(gameId) {
      const found = game(gameId);
      if (found.status !== 'lobby') throw new Error('game already started');
      const list = roster(gameId);
      if (list.length < 2) throw new Error('need at least two players');
      if (!TEAMS.every((team) => list.some((player) => player.team === team))) {
        throw new Error('both teams need at least one player');
      }
      const pickerTeam = Math.random() < 0.5 ? 'sun' : 'wave';
      found.status = 'playing';
      found.phase = 'pick';
      found.pickerTeam = pickerTeam;
      found.finderTeam = otherTeam(pickerTeam);
      found.round = 1;
      found.secretCell = null;
      found.secretNumber = null;
      bump(found);
      return snap(gameId, '');
    },

    async pick(gameId, studentId, cell, expectedVersion) {
      const found = game(gameId);
      if (found.version !== expectedVersion) throw new Error('version conflict');
      if (found.phase !== 'pick') throw new Error('not the pick phase');
      const player = requirePlayer(gameId, studentId);
      if (player.team !== found.pickerTeam) throw new Error('not your team to pick');
      if (!Number.isInteger(cell) || cell < 0 || cell >= CROSS_CELLS) throw new Error('cell out of range');
      found.secretCell = cell;
      found.secretNumber = found.numbers[cell];
      found.phase = 'cross';
      found.lastWrongAt = null;
      bump(found);
      return snap(gameId, studentId);
    },

    async holdStart(gameId, studentId, cell) {
      const found = game(gameId);
      if (found.phase !== 'cross') throw new Error('not the cross phase');
      const player = requirePlayer(gameId, studentId);
      if (player.team !== found.pickerTeam) throw new Error('only the picking team crosses');
      if (!Number.isInteger(cell) || cell < 0 || cell >= CROSS_CELLS) throw new Error('cell out of range');
      if (crossMap(gameId)[player.team].has(cell)) throw new Error('already crossed');
      found.holdBy = studentId;
      found.holdCell = cell;
      found.holdStartedAt = now();
      bump(found);
      return snap(gameId, studentId);
    },

    async holdCancel(gameId, studentId) {
      const found = game(gameId);
      if (found.holdBy !== studentId) return;
      found.holdBy = null;
      found.holdCell = null;
      found.holdStartedAt = null;
      bump(found);
    },

    async completeHold(gameId, studentId, cell, expectedVersion) {
      const found = game(gameId);
      if (found.version !== expectedVersion) throw new Error('version conflict');
      const player = requirePlayer(gameId, studentId);
      if (player.team !== found.pickerTeam) throw new Error('only the picking team crosses');
      if (found.phase !== 'cross') throw new Error('not the cross phase');
      if (found.holdBy !== studentId || found.holdCell !== cell) throw new Error('hold was not started');
      if (now() - Number(found.holdStartedAt) < holdMs) throw new Error('hold too short');
      const map = crossMap(gameId);
      if (map[player.team].has(cell)) throw new Error('already crossed');
      map[player.team].add(cell);
      found.holdBy = null;
      found.holdCell = null;
      found.holdStartedAt = null;
      if (map[player.team].size >= CROSS_CELLS) {
        found.status = 'finished';
        found.phase = 'finished';
        found.winner = player.team;
        found.secretCell = null;
        found.secretNumber = null;
      }
      bump(found);
      return snap(gameId, studentId);
    },

    async guess(gameId, studentId, cell) {
      const found = game(gameId);
      if (found.phase !== 'cross') throw new Error('not the cross phase');
      const player = requirePlayer(gameId, studentId);
      if (player.team !== found.finderTeam) throw new Error('only the hunting team guesses');
      if (now() < Number(found.lastWrongAt || 0) + wrongMs) throw new Error('wait a moment');
      if (cell === found.secretCell) {
        swapRoles(found);
        return { stopped: true, game: snap(gameId, studentId) };
      }
      found.lastWrongAt = now();
      bump(found);
      throw Object.assign(new Error('wrong number'), { wrong: true });
    },

    async state(gameId, viewerId) {
      const found = game(gameId);
      const list = roster(gameId);
      const viewer = list.find((player) => player.id === viewerId);
      if (viewer) viewer.lastSeen = now();
      if (found.status === 'playing' && found.phase !== 'finished') {
        const online = (team) => list.some((player) => player.team === team
          && now() - Number(player.lastSeen || 0) <= 25000);
        const others = online(found.finderTeam);
        const acting = online(found.pickerTeam);
        if (!acting && others) {
          const next = found.pickerTeam;
          found.pickerTeam = found.finderTeam;
          found.finderTeam = next;
          found.phase = 'pick';
          found.secretCell = null;
          found.secretNumber = null;
          found.holdBy = null;
          found.holdCell = null;
          found.holdStartedAt = null;
          found.lastWrongAt = null;
          if (found.round < 1) found.round = 1;
          bump(found);
        }
      }
      if (found.status === 'lobby') {
        const kept = list.filter((player) => now() - Number(player.lastSeen) < lobbyTtl);
        if (kept.length !== list.length) {
          players.set(gameId, kept);
          kept.forEach((player, index) => { player.joinIndex = index; });
          bump(found);
        }
      }
      return snap(gameId, viewerId);
    },

    async kick(gameId, studentId) {
      const found = game(gameId);
      if (found.status !== 'lobby') throw new Error('can only remove players from the lobby');
      const list = roster(gameId);
      const kept = list.filter((player) => player.id !== studentId);
      if (kept.length === list.length) throw new Error('player is not in this game');
      kept.forEach((player, index) => { player.joinIndex = index; });
      players.set(gameId, kept);
      bump(found);
      return snap(gameId, '');
    },

    async reset() {
      games.clear();
      players.clear();
      crosses.clear();
      activeId = null;
    }
  };

  return store;
}

export function createD1CrossStore(db) {
  if (!db) throw new Error('GAMES_DB binding is not configured');

  async function loadGame(id) {
    const row = await db.prepare('SELECT * FROM cross_games WHERE id = ?').bind(id).first();
    if (!row) return null;
    return {
      id: row.id,
      status: row.status,
      phase: row.phase,
      round: row.round_no || 0,
      numbers: JSON.parse(row.numbers || '[]'),
      pickerTeam: row.picker_team,
      finderTeam: row.finder_team,
      secretCell: row.secret_cell,
      secretNumber: row.secret_number,
      holdBy: row.hold_by,
      holdCell: row.hold_cell,
      holdStartedAt: row.hold_started_at,
      lastWrongAt: row.last_wrong_at,
      winner: row.winner,
      version: row.version,
      createdAt: row.created_at
    };
  }
  async function loadPlayers(id) {
    const rows = await db.prepare('SELECT * FROM cross_players WHERE game_id = ? ORDER BY join_index').bind(id).all();
    return (rows.results || []).map((row) => ({
      id: row.student_id, name: row.name, team: row.team, joinIndex: row.join_index, lastSeen: row.last_seen
    }));
  }
  async function loadCrosses(id) {
    const rows = await db.prepare('SELECT team, cell FROM cross_crosses WHERE game_id = ?').bind(id).all();
    const out = { sun: new Set(), wave: new Set() };
    for (const row of rows.results || []) if (out[row.team]) out[row.team].add(row.cell);
    return out;
  }
  async function requireGame(id) {
    const found = await loadGame(id);
    if (!found) throw new Error('game not found');
    return found;
  }
  async function saveGame(game) {
    await db.prepare(
      `UPDATE cross_games SET status = ?, phase = ?, round_no = ?, picker_team = ?, finder_team = ?,
       secret_cell = ?, secret_number = ?, hold_by = ?, hold_cell = ?, hold_started_at = ?,
       last_wrong_at = ?, winner = ?, version = ? WHERE id = ?`
    ).bind(
      game.status, game.phase, game.round, game.pickerTeam, game.finderTeam,
      game.secretCell, game.secretNumber, game.holdBy, game.holdCell, game.holdStartedAt,
      game.lastWrongAt, game.winner, game.version, game.id
    ).run();
  }
  function snap(found, players, crosses, viewerId) {
    return snapshot(found, players, crosses, viewerId);
  }

  return {
    async getActive() {
      const row = await db.prepare(
        `SELECT id FROM cross_games WHERE status IN ('lobby','playing','finished') ORDER BY created_at DESC LIMIT 1`
      ).first();
      if (!row) return null;
      const players = await loadPlayers(row.id);
      return snap(await requireGame(row.id), players, await loadCrosses(row.id), (players[0] || {}).id || '');
    },

    async createLobby(rng = Math.random) {
      const id = newId();
      const numbers = JSON.stringify(makeCrossNumbers(rng));
      const inserted = await db.prepare(
        `INSERT INTO cross_games (id, status, phase, numbers, created_at)
         SELECT ?, 'lobby', 'lobby', ?, ?
         WHERE NOT EXISTS (SELECT 1 FROM cross_games WHERE status IN ('lobby','playing'))`
      ).bind(id, numbers, new Date().toISOString()).run();
      if (inserted.meta && inserted.meta.changes === 1) return id;
      const row = await db.prepare(
        `SELECT id FROM cross_games WHERE status IN ('lobby','playing') ORDER BY created_at DESC LIMIT 1`
      ).first();
      return row.id;
    },

    async join(gameId, student, team) {
      if (!TEAMS.includes(team)) throw new Error('team must be sun or wave');
      const found = await requireGame(gameId);
      if (found.status !== 'lobby') throw new Error('game already started');
      const players = await loadPlayers(gameId);
      if (players.some((player) => player.id === student.id)) {
        await db.prepare('UPDATE cross_players SET team = ?, name = ?, last_seen = ? WHERE game_id = ? AND student_id = ?')
          .bind(team, student.name, Date.now(), gameId, student.id).run();
      } else {
        await db.prepare(
          'INSERT OR IGNORE INTO cross_players (game_id, student_id, name, team, join_index, last_seen) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(gameId, student.id, student.name, team, players.length, Date.now()).run();
      }
      await db.prepare('UPDATE cross_games SET version = version + 1 WHERE id = ?').bind(gameId).run();
      return snap(await requireGame(gameId), await loadPlayers(gameId), await loadCrosses(gameId), student.id);
    },

    async start(gameId) {
      const found = await requireGame(gameId);
      if (found.status !== 'lobby') throw new Error('game already started');
      const players = await loadPlayers(gameId);
      if (players.length < 2) throw new Error('need at least two players');
      if (!TEAMS.every((team) => players.some((player) => player.team === team))) {
        throw new Error('both teams need at least one player');
      }
      const pickerTeam = Math.random() < 0.5 ? 'sun' : 'wave';
      found.status = 'playing';
      found.phase = 'pick';
      found.pickerTeam = pickerTeam;
      found.finderTeam = otherTeam(pickerTeam);
      found.round = 1;
      found.secretCell = null;
      found.secretNumber = null;
      found.version += 1;
      await saveGame(found);
      return snap(found, players, await loadCrosses(gameId), '');
    },

    async pick(gameId, studentId, cell, expectedVersion) {
      const found = await requireGame(gameId);
      if (found.version !== expectedVersion) throw new Error('version conflict');
      if (found.phase !== 'pick') throw new Error('not the pick phase');
      const players = await loadPlayers(gameId);
      const player = players.find((item) => item.id === studentId);
      if (!player) throw new Error('player is not in this game');
      if (player.team !== found.pickerTeam) throw new Error('not your team to pick');
      if (!Number.isInteger(cell) || cell < 0 || cell >= CROSS_CELLS) throw new Error('cell out of range');
      found.secretCell = cell;
      found.secretNumber = found.numbers[cell];
      found.phase = 'cross';
      found.lastWrongAt = null;
      found.version += 1;
      await saveGame(found);
      return snap(found, players, await loadCrosses(gameId), studentId);
    },

    async holdStart(gameId, studentId, cell) {
      const found = await requireGame(gameId);
      if (found.phase !== 'cross') throw new Error('not the cross phase');
      const players = await loadPlayers(gameId);
      const player = players.find((item) => item.id === studentId);
      if (!player || player.team !== found.pickerTeam) throw new Error('only the picking team crosses');
      if (!Number.isInteger(cell) || cell < 0 || cell >= CROSS_CELLS) throw new Error('cell out of range');
      const crosses = await loadCrosses(gameId);
      if (crosses[player.team].has(cell)) throw new Error('already crossed');
      found.holdBy = studentId;
      found.holdCell = cell;
      found.holdStartedAt = Date.now();
      found.version += 1;
      await saveGame(found);
      return snap(found, players, crosses, studentId);
    },

    async holdCancel(gameId, studentId) {
      const found = await requireGame(gameId);
      if (found.holdBy !== studentId) return;
      found.holdBy = null;
      found.holdCell = null;
      found.holdStartedAt = null;
      found.version += 1;
      await saveGame(found);
    },

    async completeHold(gameId, studentId, cell, expectedVersion) {
      const found = await requireGame(gameId);
      if (found.version !== expectedVersion) throw new Error('version conflict');
      const players = await loadPlayers(gameId);
      const player = players.find((item) => item.id === studentId);
      if (!player || player.team !== found.pickerTeam) throw new Error('only the picking team crosses');
      if (found.phase !== 'cross') throw new Error('not the cross phase');
      if (found.holdBy !== studentId || found.holdCell !== cell) throw new Error('hold was not started');
      if (Date.now() - Number(found.holdStartedAt) < CROSS_HOLD_MS) throw new Error('hold too short');
      const crosses = await loadCrosses(gameId);
      if (crosses[player.team].has(cell)) throw new Error('already crossed');
      await db.prepare('INSERT OR IGNORE INTO cross_crosses (game_id, team, cell, created_at) VALUES (?, ?, ?, ?)')
        .bind(gameId, player.team, cell, new Date().toISOString()).run();
      crosses[player.team].add(cell);
      found.holdBy = null;
      found.holdCell = null;
      found.holdStartedAt = null;
      if (crosses[player.team].size >= CROSS_CELLS) {
        found.status = 'finished';
        found.phase = 'finished';
        found.winner = player.team;
        found.secretCell = null;
        found.secretNumber = null;
      }
      found.version += 1;
      await saveGame(found);
      return snap(found, players, crosses, studentId);
    },

    async guess(gameId, studentId, cell) {
      const found = await requireGame(gameId);
      if (found.phase !== 'cross') throw new Error('not the cross phase');
      const players = await loadPlayers(gameId);
      const player = players.find((item) => item.id === studentId);
      if (!player || player.team !== found.finderTeam) throw new Error('only the hunting team guesses');
      if (Date.now() < Number(found.lastWrongAt || 0) + CROSS_WRONG_MS) throw new Error('wait a moment');
      const crosses = await loadCrosses(gameId);
      if (cell === found.secretCell) {
        const finder = found.finderTeam;
        found.pickerTeam = finder;
        found.finderTeam = otherTeam(finder);
        found.phase = 'pick';
        found.round += 1;
        found.secretCell = null;
        found.secretNumber = null;
        found.holdBy = null;
        found.holdCell = null;
        found.holdStartedAt = null;
        found.lastWrongAt = null;
        found.version += 1;
        await saveGame(found);
        return { stopped: true, game: snap(found, players, crosses, studentId) };
      }
      found.lastWrongAt = Date.now();
      found.version += 1;
      await saveGame(found);
      throw Object.assign(new Error('wrong number'), { wrong: true });
    },

    async state(gameId, viewerId) {
      const found = await requireGame(gameId);
      const players = await loadPlayers(gameId);
      if (players.some((player) => player.id === viewerId)) {
        await db.prepare('UPDATE cross_players SET last_seen = ? WHERE game_id = ? AND student_id = ?')
          .bind(Date.now(), gameId, viewerId).run();
      }
      if (found.status === 'playing' && found.phase !== 'finished') {
        const nowMs = Date.now();
        const online = (team) => players.some((player) => player.team === team
          && nowMs - Number(player.lastSeen || 0) <= 25000);
        if (!online(found.pickerTeam) && online(found.finderTeam)) {
          const next = found.pickerTeam;
          const guard = await db.prepare(
            `UPDATE cross_games SET picker_team = ?, finder_team = ?, phase = 'pick', secret_cell = NULL,
             secret_number = NULL, hold_by = NULL, hold_cell = NULL, hold_started_at = NULL,
             last_wrong_at = NULL, version = version + 1, round_no = MAX(round_no, 1)
             WHERE id = ? AND version = ?`
          ).bind(found.finderTeam, next, gameId, found.version).run();
          if (guard.meta && guard.meta.changes === 1) {
            return snap(await requireGame(gameId), await loadPlayers(gameId), await loadCrosses(gameId), viewerId);
          }
        }
      }
      if (found.status === 'lobby') {
        await db.prepare('DELETE FROM cross_players WHERE game_id = ? AND (last_seen IS NULL OR last_seen < ?)')
          .bind(gameId, Date.now() - 90000).run();
      }
      return snap(found, await loadPlayers(gameId), await loadCrosses(gameId), viewerId);
    },

    async kick(gameId, studentId) {
      const found = await requireGame(gameId);
      if (found.status !== 'lobby') throw new Error('can only remove players from the lobby');
      const result = await db.prepare('DELETE FROM cross_players WHERE game_id = ? AND student_id = ?')
        .bind(gameId, studentId).run();
      if (!result.meta || result.meta.changes !== 1) throw new Error('player is not in this game');
      await db.prepare('UPDATE cross_games SET version = version + 1 WHERE id = ?').bind(gameId).run();
      return snap(await requireGame(gameId), await loadPlayers(gameId), await loadCrosses(gameId), '');
    },

    async reset() {
      await db.batch([
        db.prepare('DELETE FROM cross_crosses'),
        db.prepare('DELETE FROM cross_players'),
        db.prepare('DELETE FROM cross_games')
      ]);
    }
  };
}
