/* Admin game controls: one overview plus kick, start, force-start, reset. */

import { createD1GameStore } from './poison-store.js';
import { createD1CrossStore } from './cross-store.js';
import { createD1OddStore } from './odd-store.js';

export async function handleAdminGameRoutes(ctx) {
  const { request, url, env, json, readSignedToken, bearer } = ctx;
  if (!url.pathname.startsWith('/api/admin/games')) return null;

  const claims = await readSignedToken(env, bearer(request));
  if (!claims || claims.role !== 'admin') return json({ error: 'unauthorized' }, 401);

  const stores = {
    poison: env.GAME_STORE || (env.GAMES_DB ? createD1GameStore(env.GAMES_DB) : null),
    cross: env.CROSS_STORE || (env.GAMES_DB ? createD1CrossStore(env.GAMES_DB) : null),
    odd: env.ODD_STORE || (env.GAMES_DB ? createD1OddStore(env.GAMES_DB) : null)
  };

  if (url.pathname === '/api/admin/games' && request.method === 'GET') {
    const games = {};
    for (const key of Object.keys(stores)) {
      if (!stores[key]) { games[key] = null; continue; }
      try {
        const active = await stores[key].getActive();
        // state() also drops stale lobby seats and refreshes presence flags.
        games[key] = active ? await stores[key].state(active.id, 'admin') : null;
      } catch (error) {
        games[key] = { error: error.message || 'unavailable' };
      }
    }
    return json({ ok: true, games });
  }

  const match = url.pathname.match(/^\/api\/admin\/games\/(poison|cross|odd)\/(kick|start|force-start|reset)$/);
  if (!match || request.method !== 'POST') return json({ error: 'not found' }, 404);

  const store = stores[match[1]];
  if (!store) return json({ error: 'Game service is not configured' }, 503);
  const action = match[2];

  try {
    if (action === 'reset') {
      await store.reset();
      return json({ ok: true });
    }
    const active = await store.getActive();
    if (!active) return json({ error: 'game not found' }, 404);

    if (action === 'kick') {
      const body = await request.json().catch(() => ({}));
      if (!body.student) return json({ error: 'student is required' }, 400);
      return json({ ok: true, game: await store.kick(active.id, String(body.student)) });
    }

    if (match[1] !== 'poison') {
      return json({ error: 'players start this game from their own page' }, 400);
    }
    if (action === 'start') {
      return json({ ok: true, game: await store.start(active.id) });
    }
    if (action === 'force-start') {
      return json({ ok: true, game: await store.forceStart(active.id) });
    }
  } catch (error) {
    return json({ error: error.message || 'action failed' }, 409);
  }

  return json({ error: 'not found' }, 404);
}
