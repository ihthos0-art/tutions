/* ============================================================================
   Odd One Out: social deduction game.

   Every player gets a secret word on their own device. One player is the
   imposter and gets a similar but different word. Players give clues in
   person, then vote. Pure rules live here; the D1 and memory stores share
   one snapshot shape so the client never needs to know which one answered.
   ========================================================================== */

export const ODD_MIN_PLAYERS = 3;
export const ODD_MAX_PLAYERS = 12;
export const ODD_CLUES_MS = 1000 * 180;

export const ODD_BANK = {
  Food: [
    ['Pizza', 'Flatbread', '🍕', '🫓'], ['Pancake', 'Waffle', '🥞', '🧇'],
    ['Lemon', 'Orange', '🍋', '🍊'], ['Cake', 'Cupcake', '🎂', '🧁'],
    ['Burger', 'Sandwich', '🍔', '🥪'], ['Ice cream', 'Frozen yogurt', '🍦', '🍨'],
    ['Rice', 'Noodles', '🍚', '🍜'], ['Apple', 'Pear', '🍎', '🍐'],
    ['Peach', 'Mango', '🍑', '🥭'], ['Chocolate', 'Brownie', '🍫', '🟫'],
    ['Cookie', 'Biscuit', '🍪', '🍪'], ['Coffee', 'Tea', '☕', '🍵'],
    ['Juice', 'Smoothie', '🧃', '🥤'], ['Sushi', 'Rice ball', '🍣', '🍙'],
    ['Taco', 'Burrito', '🌮', '🌯'], ['Fries', 'Chips', '🍟', '🥔'],
    ['Honey', 'Syrup', '🍯', '🥞'], ['Strawberry', 'Raspberry', '🍓', '🫐'],
    ['Soup', 'Stew', '🥣', '🍲'], ['Donut', 'Bagel', '🍩', '🥯']
  ],
  Animals: [
    ['Cat', 'Tiger', '🐱', '🐯'], ['Dog', 'Wolf', '🐶', '🐺'],
    ['Horse', 'Zebra', '🐴', '🦓'], ['Lion', 'Tiger', '🦁', '🐯'],
    ['Dolphin', 'Whale', '🐬', '🐳'], ['Butterfly', 'Moth', '🦋', '🦋'],
    ['Bee', 'Wasp', '🐝', '🐝'], ['Frog', 'Toad', '🐸', '🐸'],
    ['Duck', 'Goose', '🦆', '🪿'], ['Rabbit', 'Hamster', '🐰', '🐹'],
    ['Turtle', 'Tortoise', '🐢', '🐢'], ['Shark', 'Dolphin', '🦈', '🐬'],
    ['Owl', 'Eagle', '🦉', '🦅'], ['Monkey', 'Gorilla', '🐒', '🦍'],
    ['Penguin', 'Puffin', '🐧', '🐦'], ['Crocodile', 'Alligator', '🐊', '🐊']
  ],
  Places: [
    ['Beach', 'Island', '🏖️', '🏝️'], ['Mountain', 'Volcano', '⛰️', '🌋'],
    ['School', 'University', '🏫', '🎓'], ['Cafe', 'Restaurant', '☕', '🍽️'],
    ['Library', 'Bookstore', '📚', '📖'], ['Hotel', 'Resort', '🏨', '🏖️'],
    ['Forest', 'Jungle', '🌲', '🌴'], ['Lake', 'Ocean', '🏞️', '🌊'],
    ['Castle', 'Palace', '🏰', '👑'], ['Park', 'Garden', '🌳', '🌷'],
    ['Cinema', 'Theater', '🎬', '🎭'], ['Airport', 'Train station', '✈️', '🚉']
  ],
  Things: [
    ['Phone', 'Tablet', '📱', '📲'], ['Laptop', 'Desktop', '💻', '🖥️'],
    ['Bicycle', 'Motorcycle', '🚲', '🏍️'], ['Car', 'Taxi', '🚗', '🚕'],
    ['Train', 'Subway', '🚆', '🚇'], ['Boat', 'Ship', '⛵', '🚢'],
    ['Pen', 'Pencil', '🖊️', '✏️'], ['Sofa', 'Armchair', '🛋️', '🪑'],
    ['Sneakers', 'Boots', '👟', '🥾'], ['Hat', 'Cap', '🎩', '🧢'],
    ['Ring', 'Bracelet', '💍', '📿'], ['Guitar', 'Ukulele', '🎸', '🎸'],
    ['Drum', 'Tambourine', '🥁', '🪘'], ['Clock', 'Watch', '🕰️', '⌚'],
    ['Umbrella', 'Raincoat', '☂️', '🧥'], ['Candle', 'Flashlight', '🕯️', '🔦']
  ],
  Activities: [
    ['Football', 'Basketball', '⚽', '🏀'], ['Tennis', 'Badminton', '🎾', '🏸'],
    ['Swimming', 'Diving', '🏊', '🤿'], ['Running', 'Jogging', '🏃', '👟'],
    ['Skiing', 'Snowboarding', '⛷️', '🏂'], ['Camping', 'Hiking', '⛺', '🥾'],
    ['Drawing', 'Painting', '✏️', '🎨'], ['Singing', 'Rapping', '🎤', '🎵'],
    ['Chess', 'Checkers', '♟️', '🎲'], ['Surfing', 'Skateboarding', '🏄', '🛹'],
    ['Yoga', 'Meditation', '🧘', '🕉️'], ['Cooking', 'Baking', '🍳', '🧁']
  ]
};

const ALL_PAIRS = Object.values(ODD_BANK).flat();
import { isOnline, isLobbyStale } from './presence.js';

const PHASES = ['lobby', 'reveal', 'clues', 'vote', 'result'];

function newId() { return crypto.randomUUID(); }
function pickIndex(n, rng) { return Math.floor(rng() * n); }

export function makeOddRound(rng = Math.random) {
  const pair = ALL_PAIRS[pickIndex(ALL_PAIRS.length, rng)].slice();
  const swap = rng() < 0.5;
  return { pair, swap };
}

function tallyVotes(votes, players) {
  const tally = {};
  players.forEach((player) => { tally[player.id] = 0; });
  Object.values(votes).forEach((target) => {
    if (tally[target] !== undefined) tally[target] += 1;
  });
  return tally;
}

function decideResult(votes, imposterId, players) {
  const tally = tallyVotes(votes, players);
  const counts = Object.entries(tally).map(([id, n]) => ({ id, n }));
  counts.sort((a, b) => b.n - a.n);
  const top = counts[0];
  const tied = counts.filter((row) => row.n === top.n).length > 1;
  const caught = !tied && top.id === imposterId && top.n > 0;
  return { tally, caught, winner: caught ? 'civilians' : 'imposter' };
}

function baseSnapshot(game, players, viewerId, nowMs = Date.now()) {
  const me = players.find((player) => player.id === viewerId);
  const isImposter = Boolean(me && me.id === game.imposter);
  const myWord = me
    ? (isImposter ? game.pair[1] : game.pair[0])
    : null;
  const myEmoji = me ? (isImposter ? game.pair[3] : game.pair[2]) : null;
  const ready = Array.isArray(game.ready) ? game.ready : [];
  const votes = game.votes || {};
  return {
    id: game.id,
    status: game.status,
    phase: game.phase,
    round: game.round,
    players: players.map((player) => ({
      id: player.id,
      name: player.name,
      online: isOnline(player.lastSeen, nowMs),
      ready: ready.includes(player.id),
      voted: Boolean(votes[player.id])
    })),
    myRole: me ? (isImposter ? 'imposter' : 'civilian') : null,
    myWord,
    myEmoji,
    readyCount: ready.length,
    votesCast: Object.keys(votes).length,
    cluesEndsAt: game.cluesEndsAt,
    myVote: votes[viewerId] || null,
    version: game.version
  };
}

function resultSnapshot(game, players, viewerId, base) {
  const { tally, caught } = decideResult(game.votes || {}, game.imposter, players);
  const imposter = players.find((player) => player.id === game.imposter);
  return {
    ...base,
    result: {
      imposterId: game.imposter,
      imposterName: imposter ? imposter.name : 'Unknown',
      civilianWord: game.pair[0],
      imposterWord: game.pair[1],
      civilianEmoji: game.pair[2],
      imposterEmoji: game.pair[3],
      tally,
      caught,
      winner: caught ? 'civilians' : 'imposter'
    }
  };
}

export function createMemoryOddStore(options = {}) {
  const cluesMs = Number.isFinite(options.cluesMs) ? options.cluesMs : ODD_CLUES_MS;
  const now = options.now || (() => Date.now());
  const lobbyTtl = Number.isFinite(options.lobbyTtlMs) ? options.lobbyTtlMs : 90000;
  const games = new Map();
  const players = new Map();
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
  function requirePlayer(id, studentId) {
    const found = roster(id).find((player) => player.id === studentId);
    if (!found) throw new Error('player is not in this game');
    return found;
  }
  function snapshot(id, viewerId) {
    const found = game(id);
    const base = baseSnapshot(found, roster(id), viewerId, now());
    if (found.phase === 'result') return resultSnapshot(found, roster(id), viewerId, base);
    return base;
  }
  function bump(found) { found.version += 1; }

  return {
    async getActive() {
      const found = activeId ? games.get(activeId) : null;
      if (!found) return null;
      return snapshot(found.id, (roster(found.id)[0] || {}).id || '');
    },

    async createLobby() {
      if (activeId) {
        const current = games.get(activeId);
        if (current && current.status !== 'finished') return current.id;
      }
      const id = newId();
      games.set(id, {
        id, status: 'lobby', phase: 'lobby', round: 0, pair: ['', '', '', ''],
        imposter: null, ready: [], votes: {}, cluesEndsAt: null, winner: null,
        version: 0, createdAt: new Date().toISOString()
      });
      players.set(id, []);
      activeId = id;
      return id;
    },

    async join(gameId, student) {
      const found = game(gameId);
      if (found.status !== 'lobby') throw new Error('game already started');
      const list = roster(gameId);
      if (!list.some((player) => player.id === student.id)) {
        if (list.length >= ODD_MAX_PLAYERS) throw new Error('room is full');
        list.push({ id: student.id, name: student.name, joinIndex: list.length, lastSeen: now() });
        bump(found);
      } else {
        const existing = list.find((player) => player.id === student.id);
        existing.lastSeen = now();
      }
      return snapshot(gameId, student.id);
    },

    async start(gameId, rng = Math.random) {
      const found = game(gameId);
      if (found.status !== 'lobby') throw new Error('game already started');
      const list = roster(gameId);
      if (list.length < ODD_MIN_PLAYERS) throw new Error('need at least ' + ODD_MIN_PLAYERS + ' players');
      const { pair } = makeOddRound(rng);
      found.pair = pair;
      found.imposter = list[pickIndex(list.length, rng)].id;
      found.status = 'playing';
      found.phase = 'reveal';
      found.round = 1;
      found.ready = [];
      found.votes = {};
      found.winner = null;
      bump(found);
      return snapshot(gameId, '');
    },

    async markReady(gameId, studentId) {
      const found = game(gameId);
      if (found.phase !== 'reveal') throw new Error('not in the reveal phase');
      requirePlayer(gameId, studentId);
      const list = roster(gameId);
      if (!found.ready.includes(studentId)) {
        found.ready.push(studentId);
        bump(found);
      }
      if (found.ready.length === list.length) {
        found.phase = 'clues';
        found.cluesEndsAt = now() + cluesMs;
        bump(found);
      }
      return snapshot(gameId, studentId);
    },

    async startVote(gameId, studentId) {
      const found = game(gameId);
      if (found.phase !== 'clues') throw new Error('not in the clue phase');
      requirePlayer(gameId, studentId);
      found.phase = 'vote';
      found.votes = {};
      bump(found);
      return snapshot(gameId, studentId);
    },

    async vote(gameId, studentId, targetId) {
      const found = game(gameId);
      if (found.phase !== 'vote') throw new Error('not in the vote phase');
      requirePlayer(gameId, studentId);
      const list = roster(gameId);
      if (!list.some((player) => player.id === targetId)) throw new Error('unknown vote target');
      if (targetId === studentId) throw new Error('you cannot vote for yourself');
      if (!found.votes || typeof found.votes !== 'object') found.votes = {};
      found.votes[studentId] = targetId;
      if (Object.keys(found.votes).length === list.length) {
        const { caught, winner } = decideResult(found.votes, found.imposter, list);
        found.phase = 'result';
        found.status = 'finished';
        found.winner = winner;
        found.cluesEndsAt = null;
        void caught;
      }
      bump(found);
      return snapshot(gameId, studentId);
    },

    async nextRound(gameId, studentId, rng = Math.random) {
      const found = game(gameId);
      if (found.phase !== 'result') throw new Error('round is not finished');
      requirePlayer(gameId, studentId);
      const list = roster(gameId);
      const { pair } = makeOddRound(rng);
      found.pair = pair;
      found.imposter = list[pickIndex(list.length, rng)].id;
      found.phase = 'reveal';
      found.round += 1;
      found.ready = [];
      found.votes = {};
      found.status = 'playing';
      found.winner = null;
      found.cluesEndsAt = null;
      bump(found);
      return snapshot(gameId, studentId);
    },

    async state(gameId, viewerId) {
      const found = game(gameId);
      const list = roster(gameId);
      const viewer = list.find((player) => player.id === viewerId);
      if (viewer) viewer.lastSeen = now();
      if (found.status === 'lobby') {
        const before = list.length;
        const kept = list.filter((player) => !isLobbyStale(player.lastSeen, now(), lobbyTtl));
        if (kept.length !== before) {
          players.set(gameId, kept);
          kept.forEach((player, index) => { player.joinIndex = index; });
          bump(found);
        }
      }
      return snapshot(gameId, viewerId);
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
      return snapshot(gameId, '');
    },

    async reset() {
      games.clear();
      players.clear();
      activeId = null;
    }
  };
}

export function createD1OddStore(db) {
  if (!db) throw new Error('GAMES_DB binding is not configured');

  async function loadGame(id) {
    const row = await db.prepare('SELECT * FROM odd_games WHERE id = ?').bind(id).first();
    if (!row) return null;
    return {
      id: row.id,
      status: row.status,
      phase: row.phase,
      round: row.round_no,
      pair: JSON.parse(row.pair || '[]'),
      imposter: row.imposter,
      ready: JSON.parse(row.ready || '[]'),
      votes: JSON.parse(row.votes || '{}'),
      cluesEndsAt: row.clues_ends_at,
      winner: row.winner,
      version: row.version,
      createdAt: row.created_at
    };
  }
  async function loadPlayers(id) {
    const rows = await db.prepare('SELECT * FROM odd_players WHERE game_id = ? ORDER BY join_index').bind(id).all();
    return (rows.results || []).map((row) => ({
      id: row.student_id, name: row.name, joinIndex: row.join_index, lastSeen: row.last_seen
    }));
  }
  async function requireGame(id) {
    const found = await loadGame(id);
    if (!found) throw new Error('game not found');
    return found;
  }
  async function saveGame(found) {
    await db.prepare(
      `UPDATE odd_games SET status = ?, phase = ?, round_no = ?, pair = ?, imposter = ?,
       ready = ?, votes = ?, clues_ends_at = ?, winner = ?, version = ? WHERE id = ?`
    ).bind(
      found.status, found.phase, found.round, JSON.stringify(found.pair), found.imposter,
      JSON.stringify(found.ready), JSON.stringify(found.votes), found.cluesEndsAt,
      found.winner, found.version, found.id
    ).run();
  }
  function snap(found, players, viewerId) {
    const base = baseSnapshot(found, players, viewerId);
    return found.phase === 'result' ? resultSnapshot(found, players, viewerId, base) : base;
  }

  return {
    async getActive() {
      const row = await db.prepare(
        `SELECT id FROM odd_games WHERE status IN ('lobby','playing','finished') ORDER BY created_at DESC LIMIT 1`
      ).first();
      if (!row) return null;
      const found = await requireGame(row.id);
      const players = await loadPlayers(row.id);
      return snap(found, players, (players[0] || {}).id || '');
    },

    async createLobby() {
      const id = newId();
      const inserted = await db.prepare(
        `INSERT INTO odd_games (id, status, phase, created_at)
         SELECT ?, 'lobby', 'lobby', ?
         WHERE NOT EXISTS (SELECT 1 FROM odd_games WHERE status IN ('lobby','playing'))`
      ).bind(id, new Date().toISOString()).run();
      if (inserted.meta && inserted.meta.changes === 1) return id;
      const row = await db.prepare(
        `SELECT id FROM odd_games WHERE status IN ('lobby','playing') ORDER BY created_at DESC LIMIT 1`
      ).first();
      return row.id;
    },

    async join(gameId, student) {
      const found = await requireGame(gameId);
      if (found.status !== 'lobby') throw new Error('game already started');
      const players = await loadPlayers(gameId);
      if (!players.some((player) => player.id === student.id)) {
        if (players.length >= ODD_MAX_PLAYERS) throw new Error('room is full');
        await db.prepare(
          'INSERT OR IGNORE INTO odd_players (game_id, student_id, name, join_index, last_seen) VALUES (?, ?, ?, ?, ?)'
        ).bind(gameId, student.id, student.name, players.length, Date.now()).run();
        found.version += 1;
        await saveGame(found);
      } else {
        await db.prepare('UPDATE odd_players SET last_seen = ? WHERE game_id = ? AND student_id = ?')
          .bind(Date.now(), gameId, student.id).run();
      }
      return snap(found, await loadPlayers(gameId), student.id);
    },

    async start(gameId, rng = Math.random) {
      const found = await requireGame(gameId);
      if (found.status !== 'lobby') throw new Error('game already started');
      const players = await loadPlayers(gameId);
      if (players.length < ODD_MIN_PLAYERS) throw new Error('need at least ' + ODD_MIN_PLAYERS + ' players');
      const { pair } = makeOddRound(rng);
      found.pair = pair;
      found.imposter = players[pickIndex(players.length, rng)].id;
      found.status = 'playing';
      found.phase = 'reveal';
      found.round = 1;
      found.ready = [];
      found.votes = {};
      found.winner = null;
      found.version += 1;
      await saveGame(found);
      return snap(found, players, '');
    },

    async markReady(gameId, studentId) {
      const found = await requireGame(gameId);
      if (found.phase !== 'reveal') throw new Error('not in the reveal phase');
      const players = await loadPlayers(gameId);
      if (!players.some((player) => player.id === studentId)) throw new Error('player is not in this game');
      if (!found.ready.includes(studentId)) found.ready.push(studentId);
      if (found.ready.length === players.length) {
        found.phase = 'clues';
        found.cluesEndsAt = Date.now() + ODD_CLUES_MS;
      }
      found.version += 1;
      await saveGame(found);
      return snap(found, players, studentId);
    },

    async startVote(gameId, studentId) {
      const found = await requireGame(gameId);
      if (found.phase !== 'clues') throw new Error('not in the clue phase');
      const players = await loadPlayers(gameId);
      if (!players.some((player) => player.id === studentId)) throw new Error('player is not in this game');
      found.phase = 'vote';
      found.votes = {};
      found.version += 1;
      await saveGame(found);
      return snap(found, players, studentId);
    },

    async vote(gameId, studentId, targetId) {
      const found = await requireGame(gameId);
      if (found.phase !== 'vote') throw new Error('not in the vote phase');
      const players = await loadPlayers(gameId);
      if (!players.some((player) => player.id === studentId)) throw new Error('player is not in this game');
      if (!players.some((player) => player.id === targetId)) throw new Error('unknown vote target');
      if (targetId === studentId) throw new Error('you cannot vote for yourself');
      found.votes[studentId] = targetId;
      if (Object.keys(found.votes).length === players.length) {
        const { winner } = decideResult(found.votes, found.imposter, players);
        found.phase = 'result';
        found.status = 'finished';
        found.winner = winner;
        found.cluesEndsAt = null;
      }
      found.version += 1;
      await saveGame(found);
      return snap(found, players, studentId);
    },

    async nextRound(gameId, studentId, rng = Math.random) {
      const found = await requireGame(gameId);
      if (found.phase !== 'result') throw new Error('round is not finished');
      const players = await loadPlayers(gameId);
      if (!players.some((player) => player.id === studentId)) throw new Error('player is not in this game');
      const { pair } = makeOddRound(rng);
      found.pair = pair;
      found.imposter = players[pickIndex(players.length, rng)].id;
      found.phase = 'reveal';
      found.round += 1;
      found.ready = [];
      found.votes = {};
      found.status = 'playing';
      found.winner = null;
      found.cluesEndsAt = null;
      found.version += 1;
      await saveGame(found);
      return snap(found, players, studentId);
    },

    async state(gameId, viewerId) {
      const found = await requireGame(gameId);
      if ((await loadPlayers(gameId)).some((player) => player.id === viewerId)) {
        await db.prepare('UPDATE odd_players SET last_seen = ? WHERE game_id = ? AND student_id = ?')
          .bind(Date.now(), gameId, viewerId).run();
      }
      if (found.status === 'lobby') {
        await db.prepare('DELETE FROM odd_players WHERE game_id = ? AND (last_seen IS NULL OR last_seen < ?)')
          .bind(gameId, Date.now() - 90000).run();
      }
      return snap(found, await loadPlayers(gameId), viewerId);
    },

    async kick(gameId, studentId) {
      const found = await requireGame(gameId);
      if (found.status !== 'lobby') throw new Error('can only remove players from the lobby');
      const result = await db.prepare('DELETE FROM odd_players WHERE game_id = ? AND student_id = ?')
        .bind(gameId, studentId).run();
      if (!result.meta || result.meta.changes !== 1) throw new Error('player is not in this game');
      found.version += 1;
      await saveGame(found);
      return snap(found, await loadPlayers(gameId), '');
    },

    async reset() {
      await db.batch([
        db.prepare('DELETE FROM odd_players'),
        db.prepare('DELETE FROM odd_games')
      ]);
    }
  };
}
