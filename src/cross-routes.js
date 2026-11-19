/* ============================================================================
   Find and Cross API routes. Student sessions only, except reset which is
   admin. Split from src/index.js to stay under the size ceiling.
   ========================================================================== */

import { createD1CrossStore } from './cross-store.js';

export async function handleCrossRoutes(ctx) {
  const { request, url, env, json, readSignedToken, bearer, validStudent, roster } = ctx;
  if (!url.pathname.startsWith('/api/cross/')) return null;

  const store = env.CROSS_STORE || (env.GAMES_DB ? createD1CrossStore(env.GAMES_DB) : null);
  if (!store) return json({ error: 'Game service is not configured' }, 503);

  const claims = await readSignedToken(env, bearer(request));
  const isStudent = Boolean(claims && claims.role === 'student' && validStudent(claims.student));
  const isAdmin = Boolean(claims && claims.role === 'admin');
  const actingId = isAdmin ? 'admin' : (claims ? claims.student : '');

  function mapError(error) {
    const message = error.message || 'request failed';
    if (message === 'version conflict') return json({ error: 'state changed, refresh' }, 409);
    if (message === 'game not found') return json({ error: 'game not found' }, 404);
    if (/cell out of range/.test(message)) return json({ error: message }, 400);
    if (/team must be/.test(message)) return json({ error: message }, 400);
    return json({ error: message }, 409);
  }

  if (url.pathname === '/api/cross/join' && request.method === 'POST') {
    if (!isStudent && !isAdmin) return json({ error: 'unauthorized' }, 401);
    const body = await request.json().catch(() => ({}));
    const team = body.team;
    if (team !== 'sun' && team !== 'wave') return json({ error: 'pick a team first' }, 400);
    const student = isAdmin ? { id: 'admin', name: 'Teacher' } : roster.find((item) => item.id === claims.student);
    if (!student) return json({ error: 'unknown student' }, 401);
    try {
      let active = await store.getActive();
      let gameId = active ? active.id : null;
      if (!active || active.status === 'finished') gameId = await store.createLobby();
      const state = await store.state(gameId, student.id);
      if (state.players.some((player) => player.id === student.id)) {
        if (state.status !== 'lobby') return json({ ok: true, game: state });
        return json({ ok: true, game: await store.join(gameId, { id: student.id, name: student.name }, team) });
      }
      if (state.status !== 'lobby') return json({ error: 'game already started' }, 409);
      const joined = await store.join(gameId, { id: student.id, name: student.name }, team);
      return json({ ok: true, game: joined });
    } catch (error) {
      return mapError(error);
    }
  }

  if (url.pathname === '/api/cross/state' && request.method === 'GET') {
    if (!isStudent && !isAdmin) return json({ error: 'unauthorized' }, 401);
    const active = await store.getActive();
    if (!active) return json({ ok: true, game: null });
    try {
      const state = await store.state(active.id, actingId);
      if (!state.players.some((player) => player.id === actingId)) {
        return json({ ok: true, game: null });
      }
      return json({ ok: true, game: state });
    } catch (error) {
      if (/game not found/.test(error.message || '')) return json({ ok: true, game: null });
      throw error;
    }
  }

  if (url.pathname === '/api/cross/start' && request.method === 'POST') {
    if (!isStudent && !isAdmin) return json({ error: 'unauthorized' }, 401);
    const active = await store.getActive();
    if (!active) return json({ error: 'game not found' }, 404);
    try {
      const state = await store.state(active.id, actingId);
      if (!state.players.some((player) => player.id === actingId)) {
        return json({ error: 'join the game first' }, 403);
      }
      return json({ ok: true, game: await store.start(active.id) });
    } catch (error) {
      return mapError(error);
    }
  }

  if (url.pathname === '/api/cross/pick' && request.method === 'POST') {
    if (!isStudent && !isAdmin) return json({ error: 'unauthorized' }, 401);
    const body = await request.json().catch(() => ({}));
    const active = await store.getActive();
    if (!active) return json({ error: 'game not found' }, 404);
    try {
      const game = await store.pick(active.id, actingId, Number(body.cell), Number(body.version));
      return json({ ok: true, game });
    } catch (error) {
      return mapError(error);
    }
  }

  if (url.pathname === '/api/cross/hold' && request.method === 'POST') {
    if (!isStudent && !isAdmin) return json({ error: 'unauthorized' }, 401);
    const body = await request.json().catch(() => ({}));
    const active = await store.getActive();
    if (!active) return json({ error: 'game not found' }, 404);
    if (body.action === 'cancel') {
      await store.holdCancel(active.id, actingId);
      return json({ ok: true });
    }
    try {
      const game = await store.holdStart(active.id, actingId, Number(body.cell));
      return json({ ok: true, game });
    } catch (error) {
      return mapError(error);
    }
  }

  if (url.pathname === '/api/cross/complete' && request.method === 'POST') {
    if (!isStudent && !isAdmin) return json({ error: 'unauthorized' }, 401);
    const body = await request.json().catch(() => ({}));
    const active = await store.getActive();
    if (!active) return json({ error: 'game not found' }, 404);
    try {
      const game = await store.completeHold(
        active.id, actingId, Number(body.cell), Number(body.version)
      );
      return json({ ok: true, game });
    } catch (error) {
      return mapError(error);
    }
  }

  if (url.pathname === '/api/cross/reset' && request.method === 'POST') {
    if (!isAdmin) return json({ error: 'unauthorized' }, 401);
    await store.reset();
    return json({ ok: true });
  }

  return json({ error: 'not found' }, 404);
}
