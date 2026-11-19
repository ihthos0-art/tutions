/* ============================================================================
   Odd One Out API routes. Student sessions for play, admin for reset.
   ========================================================================== */

import { createD1OddStore } from './odd-store.js';

export async function handleOddRoutes(ctx) {
  const { request, url, env, json, readSignedToken, bearer, validStudent, roster } = ctx;
  if (!url.pathname.startsWith('/api/odd/')) return null;

  const store = env.ODD_STORE || (env.GAMES_DB ? createD1OddStore(env.GAMES_DB) : null);
  if (!store) return json({ error: 'Game service is not configured' }, 503);

  const claims = await readSignedToken(env, bearer(request));
  const isStudent = Boolean(claims && claims.role === 'student' && validStudent(claims.student));
  const isAdmin = Boolean(claims && claims.role === 'admin');
  const actingId = isAdmin ? 'admin' : (claims ? claims.student : '');

  function mapError(error) {
    const message = error.message || 'request failed';
    if (message === 'game not found') return json({ error: message }, 404);
    if (/already started/.test(message)) return json({ error: message }, 409);
    return json({ error: message }, 409);
  }

  async function withGame(handler) {
    const active = await store.getActive();
    if (!active) return json({ error: 'game not found' }, 404);
    try {
      return json({ ok: true, game: await handler(active.id) });
    } catch (error) {
      return mapError(error);
    }
  }

  if (url.pathname === '/api/odd/join' && request.method === 'POST') {
    if (!isStudent && !isAdmin) return json({ error: 'unauthorized' }, 401);
    const student = isAdmin ? { id: 'admin', name: 'Teacher' } : roster.find((item) => item.id === claims.student);
    if (!student) return json({ error: 'unknown student' }, 401);
    try {
      let active = await store.getActive();
      let gameId = active ? active.id : null;
      if (!active || active.status === 'finished') gameId = await store.createLobby();
      const state = await store.state(gameId, student.id);
      if (state.players.some((player) => player.id === student.id)) {
        return json({ ok: true, game: state });
      }
      if (state.status !== 'lobby') return json({ error: 'game already started' }, 409);
      return json({ ok: true, game: await store.join(gameId, { id: student.id, name: student.name }) });
    } catch (error) {
      return mapError(error);
    }
  }

  if (url.pathname === '/api/odd/state' && request.method === 'GET') {
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

  if (url.pathname === '/api/odd/start' && request.method === 'POST') {
    if (!isStudent && !isAdmin) return json({ error: 'unauthorized' }, 401);
    return withGame(async (id) => {
      const state = await store.state(id, actingId);
      if (!state.players.some((player) => player.id === actingId)) {
        throw new Error('join the game first');
      }
      return store.start(id);
    });
  }

  if (url.pathname === '/api/odd/ready' && request.method === 'POST') {
    if (!isStudent && !isAdmin) return json({ error: 'unauthorized' }, 401);
    return withGame((id) => store.markReady(id, actingId));
  }

  if (url.pathname === '/api/odd/start-vote' && request.method === 'POST') {
    if (!isStudent && !isAdmin) return json({ error: 'unauthorized' }, 401);
    return withGame((id) => store.startVote(id, actingId));
  }

  if (url.pathname === '/api/odd/vote' && request.method === 'POST') {
    if (!isStudent && !isAdmin) return json({ error: 'unauthorized' }, 401);
    const body = await request.json().catch(() => ({}));
    return withGame((id) => store.vote(id, actingId, String(body.target || '')));
  }

  if (url.pathname === '/api/odd/next-round' && request.method === 'POST') {
    if (!isStudent && !isAdmin) return json({ error: 'unauthorized' }, 401);
    return withGame((id) => store.nextRound(id, actingId));
  }

  if (url.pathname === '/api/odd/reset' && request.method === 'POST') {
    if (!isAdmin) return json({ error: 'unauthorized' }, 401);
    await store.reset();
    return json({ ok: true });
  }

  return json({ error: 'not found' }, 404);
}
