/* ============================================================================
   Poison Challenge rules, two-team edition.

   Two teams share three lives each. A player who hits a poison costs their
   whole team one life. A team at zero lives is out entirely. Last team with
   lives left wins. Placement is still three secret poison cells per player on
   one shared board.
   ========================================================================== */

export const POISON_COUNT = 3;
export const LIVES = 3;
export const TEAMS = ['sun', 'wave'];
export const MODES = ['solo', 'teams'];

export function gridForPlayers(playerCount) {
  const wanted = Math.max(16, Math.ceil(playerCount) * 8);
  const side = Math.ceil(Math.sqrt(wanted));
  return { cols: side, rows: side, cells: side * side };
}

export function shuffleOrder(ids, rng = Math.random) {
  const out = ids.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

export function activePlayers(players) {
  return players.filter((player) => !player.eliminated);
}

export function teamLivesFrom(state) {
  return {
    sun: Number(state.teamLives && state.teamLives.sun),
    wave: Number(state.teamLives && state.teamLives.wave)
  };
}

export function resolvePick(state, cell) {
  if (!state || state.status !== 'playing') throw new Error('game is not in play');
  if (state.revealed && state.revealed[String(cell)]) throw new Error('cell already revealed');

  const turnOrder = state.turnOrder || state.players.map((player) => player.id);
  const currentId = turnOrder[state.turnIndex];
  const players = state.players.map((player) => ({ ...player }));
  const current = players.find((player) => player.id === currentId);
  if (!current) throw new Error('current player is missing');
  if (current.eliminated) throw new Error('current player is eliminated');

  const mode = state.mode === 'solo' ? 'solo' : 'teams';
  const poisonedBy = (state.poisons && state.poisons[String(cell)]) || [];
  const hit = poisonedBy.length > 0;
  const teamLives = teamLivesFrom(state);
  const eliminated = [];
  let winnerPlayer = null;
  let winnerTeam = null;

  if (hit) {
    if (mode === 'solo') {
      current.lives = Math.max(0, Number(current.lives ?? LIVES) - 1);
      if (current.lives === 0) {
        current.eliminated = true;
        eliminated.push(current.id);
      }
    } else {
      const team = current.team;
      if (!TEAMS.includes(team)) throw new Error('current player has no team');
      teamLives[team] = Math.max(0, teamLives[team] - 1);
      if (teamLives[team] === 0) {
        players.forEach((player) => {
          if (player.team === team && !player.eliminated) {
            player.eliminated = true;
            eliminated.push(player.id);
          }
        });
      }
    }
  }

  const revealed = { ...(state.revealed || {}), [String(cell)]: { hit, by: currentId, poisonedBy } };
  let finished = false;
  if (mode === 'solo') {
    const alivePlayers = players.filter((player) => !player.eliminated);
    finished = alivePlayers.length <= 1;
    winnerPlayer = finished && alivePlayers.length === 1 ? alivePlayers[0].id : null;
  } else {
    const aliveTeams = TEAMS.filter((team) => teamLives[team] > 0);
    finished = aliveTeams.length <= 1;
    winnerTeam = finished && aliveTeams.length === 1 ? aliveTeams[0] : null;
  }

  let turnIndex = state.turnIndex;
  if (!finished) {
    let guard = 0;
    do {
      turnIndex = (turnIndex + 1) % turnOrder.length;
      guard += 1;
    } while (
      guard <= turnOrder.length &&
      players.find((player) => player.id === turnOrder[turnIndex])?.eliminated
    );
  }

  const next = {
    ...state,
    mode,
    status: finished ? 'finished' : 'playing',
    players,
    teamLives,
    revealed,
    turnIndex,
    winnerTeam,
    winnerPlayer
  };
  return {
    state: next,
    result: {
      hit, poisonedBy, eliminated, winnerTeam, winnerPlayer, cell, by: currentId,
      team: mode === 'solo' ? null : current.team
    }
  };
}

export function rankTeams(teamLives, players) {
  return TEAMS.map((team) => ({
    team,
    lives: Number(teamLives[team] || 0),
    members: players.filter((player) => player.team === team).map((player) => player.name)
  })).sort((a, b) => b.lives - a.lives)
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

export function rankPlayers(players) {
  return players.slice().sort((a, b) => {
    const aOut = a.eliminated ? 1 : 0;
    const bOut = b.eliminated ? 1 : 0;
    if (aOut !== bOut) return aOut - bOut;
    if (Number(a.lives ?? 0) !== Number(b.lives ?? 0)) return Number(b.lives ?? 0) - Number(a.lives ?? 0);
    return (a.joinIndex || 0) - (b.joinIndex || 0);
  }).map((player, index) => ({
    id: player.id,
    name: player.name,
    lives: Number(player.lives ?? 0),
    eliminated: Boolean(player.eliminated),
    rank: index + 1
  }));
}
