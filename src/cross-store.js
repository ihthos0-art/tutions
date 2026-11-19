/* ============================================================================
   Find and Cross persistence and rules.

   Two teams, each with its own 10x6 board holding the same 60 numbers. A team
   picks a number for the other team to find; the finder holds that tile for
   two seconds to cross it on its own board. First team with all 60 crossed
   wins. Same interface for the memory store (tests) and D1 (production).
   ========================================================================== */

export const CROSS_CELLS = 60;
export const CROSS_HOLD_MS = 2000;
export const CROSS_COUNTDOWN_MS = 3000;
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

function effectivePhase(game, now) {
  if (game.phase === 'countdown' && now >= Number(game.countdownUntil || 0)) return 'find';
  return game.phase;
}

function requireTeam(team) {
  if (!TEAMS.includes(team)) throw new Error('team must be sun or wave');
  return team;
}

function publicPlayers(players) {
  return players.map((player) => ({
    id: player.id, name: player.name, team: player.team, joinIndex: player.joinIndex
  }));
}

function snapshot(game, players, crosses, viewerId) {
  const now = Date.now();
  const phase = effectivePhase(game, now);
  const me = players.find((player) => player.id === viewerId);
  const myTeam = me ? me.team : null;
  const picking = phase === 'pick';
  const isPicker = myTeam === game.pickerTeam;
  const numbersVisible = game.status !== 'lobby' && (!picking || isPicker);
  return {
    id: game.id,
    status: game.status,
    phase,
    numbers: numbersVisible ? game.numbers : null,
    pickerTeam: game.pickerTeam,
    finderTeam: game.finderTeam,
    target: picking ? null : game.target,
    countdownMsLeft: phase === 'countdown' ? Math.max(0, Number(game.countdownUntil) - now) : 0,
    players: publicPlayers(players),
    myTeam,
    crossed: {
      sun: [...crosses.sun],
      wave: [...crosses.wave]
    },
    canPick: Boolean(me) && picking && isPicker,
    canHold: Boolean(me) && phase === 'find' && myTeam === game.finderTeam,
    holdingCell: me && game.holdBy === viewerId ? game.holdCell : null,
    winner: game.winner || null,
    version: game.version
  };
}

function createMemoryCrossStore(options = {}) {
  const holdMs = Number.isFinite(options.holdMs) ? options.holdMs : CROSS_HOLD_MS;
  const countdownMs = Number.isFinite(options.countdownMs) ? options.countdownMs : CROSS_COUNTDOWN_MS;
  const games = new Map();
  const players = new Map();
  const crosses = new Map();
  let activeId = null;

  function game(id) {
    const found = games.get(id);
    if (!found) throw new Error('game not found');
    return found;
  }

  function playerList(id) {
    if (!players.has(id)) players.set(id, []);
    return players.get(id);
  }

  function crossMap(id) {
    if (!crosses.has(id)) crosses.set(id, { sun: new Set(), wave: new Set() });
    return crosses.get(id);
  }

  function requirePlayer(id, studentId) {
    const found = playerList(id).find((player) => player.id === studentId);
    if (!found) throw new Error('player is not in this game');
    return found;
  }

  function bump(found) { found.version += 1; }

  function advanceAfterCross(id) {
    const found = game(id);
    const crossedMap = crossMap(id);
    if (crossedMap[found.finderTeam].size >= CROSS_CELLS) {
      found.status = 'finished';
      found.phase = 'finished';
      found.winner = found.finderTeam;
      found.holdBy = null;
      found.holdCell = null;
      found.holdStartedAt = null;
      found.countdownUntil = null;
      bump(found);
      return;
    }
    const finder = found.finderTeam;
    found.pickerTeam = finder;
    found.finderTeam = otherTeam(finder);
    found.phase = 'pick';
    found.target = null;
    found.targetCell = null;
    found.countdownUntil = null;
    found.holdBy = null;
    found.holdCell = null;
    found.holdStartedAt = null;
    bump(found);
  }

  return {
    async getActive() {
      const found = activeId ? games.get(activeId) : null;
      if (!found) return null;
      const me = (playerList(found.id)[0] || {}).id;
      return snapshot(found, playerList(found.id), crossMap(found.id), me);
    },

    async createLobby(rng = Math.random) {
      if (activeId) {
        const current = games.get(activeId);
        if (current && current.status !== 'finished') return current.id;
      }
      const id = newId();
      games.set(id, {
        id, status: 'lobby', phase: 'lobby', numbers: makeCrossNumbers(rng),
        pickerTeam: null, finderTeam: null, target: null, targetCell: null,
        countdownUntil: null, holdBy: null, holdCell: null, holdStartedAt: null,
        winner: null, version: 0, createdAt: new Date().toISOString()
      });
      players.set(id, []);
      crosses.set(id, { sun: new Set(), wave: new Set() });
      activeId = id;
      return id;
    },

    async join(gameId, student, team) {
      const found = game(gameId);
      requireTeam(team);
      if (found.status !== 'lobby') throw new Error('game already started');
      const list = playerList(gameId);
      const existing = list.find((player) => player.id === student.id);
      if (existing) {
        existing.team = team;
        existing.name = student.name;
        bump(found);
        return snapshot(found, list, crossMap(gameId), student.id);
      }
      list.push({ id: student.id, name: student.name, team, joinIndex: list.length });
      bump(found);
      return snapshot(found, list, crossMap(gameId), student.id);
    },

    async start(gameId) {
      const found = game(gameId);
      if (found.status !== 'lobby') throw new Error('game already started');
      const list = playerList(gameId);
      if (list.length < 2) throw new Error('need at least two players');
      if (!TEAMS.every((team) => list.some((player) => player.team === team))) {
        throw new Error('both teams need at least one player');
      }
      const pickerTeam = Math.random() < 0.5 ? 'sun' : 'wave';
      found.status = 'playing';
      found.phase = 'pick';
      found.pickerTeam = pickerTeam;
      found.finderTeam = otherTeam(pickerTeam);
      found.target = null;
      found.targetCell = null;
      bump(found);
      return snapshot(found, list, crossMap(gameId), '');
    },

    async pick(gameId, studentId, cell, expectedVersion) {
      const found = game(gameId);
      if (found.version !== expectedVersion) throw new Error('version conflict');
      if (found.status !== 'playing') throw new Error('game is not in play');
      if (effectivePhase(found, Date.now()) !== 'pick') throw new Error('not the pick phase');
      const player = requirePlayer(gameId, studentId);
      if (player.team !== found.pickerTeam) throw new Error('not your team to pick');
      if (!Number.isInteger(cell) || cell < 0 || cell >= CROSS_CELLS) throw new Error('cell out of range');
      if (crossMap(gameId)[found.finderTeam].has(cell)) throw new Error('that block is already crossed');
      found.target = found.numbers[cell];
      found.targetCell = cell;
      found.phase = 'countdown';
      found.countdownUntil = Date.now() + countdownMs;
      bump(found);
      return snapshot(found, playerList(gameId), crossMap(gameId), studentId);
    },

    async holdStart(gameId, studentId, cell) {
      const found = game(gameId);
      if (found.status !== 'playing') throw new Error('game is not in play');
      if (effectivePhase(found, Date.now()) !== 'find') throw new Error('not the find phase');
      const player = requirePlayer(gameId, studentId);
      if (player.team !== found.finderTeam) throw new Error('only the finding team can hold');
      if (cell !== found.targetCell) throw new Error('that is not the target number');
      if (crossMap(gameId)[found.finderTeam].has(cell)) throw new Error('already crossed');
      found.holdBy = studentId;
      found.holdCell = cell;
      found.holdStartedAt = Date.now();
      bump(found);
      return snapshot(found, playerList(gameId), crossMap(gameId), studentId);
    },

    async holdCancel(gameId, studentId) {
      const found = game(gameId);
      if (found.holdBy === studentId) {
        found.holdBy = null;
        found.holdCell = null;
        found.holdStartedAt = null;
        bump(found);
      }
    },

    async completeHold(gameId, studentId, cell, expectedVersion) {
      const found = game(gameId);
      if (found.version !== expectedVersion) throw new Error('version conflict');
      const player = requirePlayer(gameId, studentId);
      if (player.team !== found.finderTeam) throw new Error('only the finding team can cross');
      if (effectivePhase(found, Date.now()) !== 'find') throw new Error('not the find phase');
      if (found.holdBy !== studentId || found.holdCell !== cell) throw new Error('hold was not started');
      if (Date.now() - Number(found.holdStartedAt) < holdMs) throw new Error('hold too short');
      if (crossMap(gameId)[found.finderTeam].has(cell)) throw new Error('already crossed');
      crossMap(gameId)[found.finderTeam].add(cell);
      found.holdBy = null;
      found.holdCell = null;
      found.holdStartedAt = null;
      advanceAfterCross(gameId);
      return snapshot(found, playerList(gameId), crossMap(gameId), studentId);
    },

    async state(gameId, viewerId) {
      const found = game(gameId);
      return snapshot(found, playerList(gameId), crossMap(gameId), viewerId);
    },

    async reset() {
      games.clear();
      players.clear();
      crosses.clear();
      activeId = null;
    }
  };
}

function createD1CrossStore(db) {
  if (!db) throw new Error('GAMES_DB binding is not configured');

  async function loadGame(id) {
    const row = await db.prepare('SELECT * FROM cross_games WHERE id = ?').bind(id).first();
    if (!row) return null;
    return {
      id: row.id,
      status: row.status,
      phase: row.phase,
      numbers: JSON.parse(row.numbers || '[]'),
      pickerTeam: row.picker_team,
      finderTeam: row.finder_team,
      target: row.target,
      targetCell: row.target_cell,
      countdownUntil: row.countdown_until,
      holdBy: row.hold_by,
      holdCell: row.hold_cell,
      holdStartedAt: row.hold_started_at,
      winner: row.winner,
      version: row.version,
      createdAt: row.created_at
    };
  }

  async function loadPlayers(id) {
    const rows = await db.prepare('SELECT * FROM cross_players WHERE game_id = ? ORDER BY join_index').bind(id).all();
    return (rows.results || []).map((row) => ({
      id: row.student_id, name: row.name, team: row.team, joinIndex: row.join_index
    }));
  }

  async function loadCrosses(id) {
    const rows = await db.prepare('SELECT team, cell FROM cross_crosses WHERE game_id = ?').bind(id).all();
    const out = { sun: new Set(), wave: new Set() };
    for (const row of rows.results || []) {
      if (out[row.team]) out[row.team].add(row.cell);
    }
    return out;
  }

  async function requireGame(id) {
    const found = await loadGame(id);
    if (!found) throw new Error('game not found');
    return found;
  }

  async function saveGame(game) {
    await db.prepare(
      `UPDATE cross_games SET status = ?, phase = ?, picker_team = ?, finder_team = ?,
       target = ?, target_cell = ?, countdown_until = ?, hold_by = ?, hold_cell = ?,
       hold_started_at = ?, winner = ?, version = ? WHERE id = ?`
    ).bind(
      game.status, game.phase, game.pickerTeam, game.finderTeam,
      game.target, game.targetCell, game.countdownUntil, game.holdBy, game.holdCell,
      game.holdStartedAt, game.winner, game.version, game.id
    ).run();
  }

  async function guard(id, expectedVersion) {
    const result = await db.prepare('UPDATE cross_games SET version = version + 1 WHERE id = ? AND version = ?')
      .bind(id, expectedVersion).run();
    if (!result.meta || result.meta.changes !== 1) throw new Error('version conflict');
    const found = await requireGame(id);
    found.version = expectedVersion + 1;
    return found;
  }

  return {
    async getActive() {
      const row = await db.prepare(
        `SELECT id FROM cross_games WHERE status IN ('lobby','playing','finished') ORDER BY created_at DESC LIMIT 1`
      ).first();
      if (!row) return null;
      const found = await loadGame(row.id);
      const players = await loadPlayers(row.id);
      return snapshot(found, players, await loadCrosses(row.id), (players[0] || {}).id || '');
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
      requireTeam(team);
      const found = await requireGame(gameId);
      if (found.status !== 'lobby') throw new Error('game already started');
      const existing = (await loadPlayers(gameId)).find((player) => player.id === student.id);
      if (existing) {
        await db.prepare('UPDATE cross_players SET team = ?, name = ? WHERE game_id = ? AND student_id = ?')
          .bind(team, student.name, gameId, student.id).run();
      } else {
        const rows = await db.prepare('SELECT COUNT(*) AS n FROM cross_players WHERE game_id = ?').bind(gameId).first();
        await db.prepare(
          'INSERT OR IGNORE INTO cross_players (game_id, student_id, name, team, join_index) VALUES (?, ?, ?, ?, ?)'
        ).bind(gameId, student.id, student.name, team, Number(rows.n)).run();
      }
      await db.prepare('UPDATE cross_games SET version = version + 1 WHERE id = ?').bind(gameId).run();
      const players = await loadPlayers(gameId);
      return snapshot(await requireGame(gameId), players, await loadCrosses(gameId), student.id);
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
      found.version += 1;
      await saveGame(found);
      return snapshot(found, players, await loadCrosses(gameId), '');
    },

    async pick(gameId, studentId, cell, expectedVersion) {
      const preliminary = await requireGame(gameId);
      if (preliminary.version !== expectedVersion) throw new Error('version conflict');
      if (preliminary.status !== 'playing') throw new Error('game is not in play');
      if (effectivePhase(preliminary, Date.now()) !== 'pick') throw new Error('not the pick phase');
      const players = await loadPlayers(gameId);
      const player = players.find((item) => item.id === studentId);
      if (!player) throw new Error('player is not in this game');
      if (player.team !== preliminary.pickerTeam) throw new Error('not your team to pick');
      if (!Number.isInteger(cell) || cell < 0 || cell >= CROSS_CELLS) throw new Error('cell out of range');
      const crosses = await loadCrosses(gameId);
      if (crosses[preliminary.finderTeam].has(cell)) throw new Error('that block is already crossed');
      const found = await guard(gameId, expectedVersion);
      found.target = found.numbers[cell];
      found.targetCell = cell;
      found.phase = 'countdown';
      found.countdownUntil = Date.now() + CROSS_COUNTDOWN_MS;
      await saveGame(found);
      return snapshot(found, players, crosses, studentId);
    },

    async holdStart(gameId, studentId, cell) {
      const found = await requireGame(gameId);
      if (found.status !== 'playing') throw new Error('game is not in play');
      if (effectivePhase(found, Date.now()) !== 'find') throw new Error('not the find phase');
      const player = (await loadPlayers(gameId)).find((item) => item.id === studentId);
      if (!player || player.team !== found.finderTeam) throw new Error('only the finding team can hold');
      if (cell !== found.targetCell) throw new Error('that is not the target number');
      found.holdBy = studentId;
      found.holdCell = cell;
      found.holdStartedAt = Date.now();
      found.version += 1;
      await saveGame(found);
      return snapshot(found, await loadPlayers(gameId), await loadCrosses(gameId), studentId);
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
      const preliminary = await requireGame(gameId);
      if (preliminary.version !== expectedVersion) throw new Error('version conflict');
      const player = (await loadPlayers(gameId)).find((item) => item.id === studentId);
      if (!player || player.team !== preliminary.finderTeam) throw new Error('only the finding team can cross');
      if (effectivePhase(preliminary, Date.now()) !== 'find') throw new Error('not the find phase');
      if (preliminary.holdBy !== studentId || preliminary.holdCell !== cell) throw new Error('hold was not started');
      if (Date.now() - Number(preliminary.holdStartedAt) < CROSS_HOLD_MS) throw new Error('hold too short');
      const crosses = await loadCrosses(gameId);
      if (crosses[preliminary.finderTeam].has(cell)) throw new Error('already crossed');
      const found = await guard(gameId, expectedVersion);
      await db.prepare('INSERT OR IGNORE INTO cross_crosses (game_id, team, cell, created_at) VALUES (?, ?, ?, ?)')
        .bind(gameId, found.finderTeam, cell, new Date().toISOString()).run();
      crosses[found.finderTeam].add(cell);
      found.holdBy = null;
      found.holdCell = null;
      found.holdStartedAt = null;
      if (crosses[found.finderTeam].size >= CROSS_CELLS) {
        found.status = 'finished';
        found.phase = 'finished';
        found.winner = found.finderTeam;
        found.countdownUntil = null;
      } else {
        const finder = found.finderTeam;
        found.pickerTeam = finder;
        found.finderTeam = otherTeam(finder);
        found.phase = 'pick';
        found.target = null;
        found.targetCell = null;
        found.countdownUntil = null;
      }
      found.version += 1;
      await saveGame(found);
      return snapshot(found, await loadPlayers(gameId), crosses, studentId);
    },

    async state(gameId, viewerId) {
      const found = await requireGame(gameId);
      return snapshot(found, await loadPlayers(gameId), await loadCrosses(gameId), viewerId);
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

export { createMemoryCrossStore, createD1CrossStore };
