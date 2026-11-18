/* ============================================================================
   Poison Challenge rules.

   Pure functions only: no storage, no network, no clock. The Worker route
   layer and the store both run this same code, so a bug here shows up in the
   tests for every caller instead of only in production.
   ========================================================================== */

export const POISON_COUNT = 3;
export const LIVES = 3;

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

export function resolvePick(state, cell) {
  if (!state || state.status !== 'playing') throw new Error('game is not in play');
  if (state.revealed && state.revealed[String(cell)]) throw new Error('cell already revealed');

  const turnOrder = state.turnOrder || state.players.map((player) => player.id);
  const currentId = turnOrder[state.turnIndex];
  const players = state.players.map((player) => ({ ...player }));
  const current = players.find((player) => player.id === currentId);
  if (!current) throw new Error('current player is missing');
  if (current.eliminated) throw new Error('current player is eliminated');

  const poisonedBy = (state.poisons && state.poisons[String(cell)]) || [];
  const hit = poisonedBy.length > 0;
  if (hit) current.lives = Math.max(0, current.lives - 1);
  if (hit && current.lives === 0) current.eliminated = true;

  const revealed = { ...(state.revealed || {}), [String(cell)]: { hit, by: currentId, poisonedBy } };
  const eliminated = current.eliminated ? [currentId] : [];

  const alive = players.filter((player) => !player.eliminated);
  const finished = alive.length <= 1;
  const winner = finished && alive.length === 1 ? alive[0].id : null;

  let turnIndex = state.turnIndex;
  if (!finished) {
    do {
      turnIndex = (turnIndex + 1) % turnOrder.length;
    } while (players.find((player) => player.id === turnOrder[turnIndex])?.eliminated);
  }

  const next = {
    ...state,
    status: finished ? 'finished' : 'playing',
    players,
    revealed,
    turnIndex,
    winner
  };
  return { state: next, result: { hit, poisonedBy, eliminated, winner, cell, by: currentId } };
}

export function rankPlayers(players) {
  const ordered = players.slice().sort((a, b) => {
    const aOut = a.eliminated ? 1 : 0;
    const bOut = b.eliminated ? 1 : 0;
    if (aOut !== bOut) return aOut - bOut;
    if (a.lives !== b.lives) return b.lives - a.lives;
    return (a.joinIndex || 0) - (b.joinIndex || 0);
  });
  return ordered.map((player, index) => ({
    id: player.id,
    name: player.name,
    lives: player.lives,
    eliminated: Boolean(player.eliminated),
    rank: index + 1
  }));
}
