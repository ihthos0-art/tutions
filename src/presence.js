/* Shared presence rules for the multiplayer games.
   Clients poll roughly once a second; 25s tolerance covers a short drop.
   Lobby-only stragglers are pruned after 90s so a logged-out student does
   not keep a seat forever. */

export const PRESENCE_ONLINE_MS = 25000;
export const LOBBY_OFFLINE_MS = 90000;

export function isOnline(lastSeen, now = Date.now()) {
  return Boolean(lastSeen) && now - Number(lastSeen) <= PRESENCE_ONLINE_MS;
}

export function isLobbyStale(lastSeen, now = Date.now(), limit = LOBBY_OFFLINE_MS) {
  return !lastSeen || now - Number(lastSeen) > limit;
}
