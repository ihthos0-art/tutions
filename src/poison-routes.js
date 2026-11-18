/* ============================================================================
   Poison Challenge API routes.

   Kept out of src/index.js so the Worker entry stays under the 800-line
   ceiling. The caller passes the shared helpers, so auth and JSON shaping are
   identical to the rest of the API.
   ========================================================================== */

import { createD1GameStore } from './poison-store.js';

const DEFAULT_GAME_PIN = '5649';
const GAME_PIN_ATTEMPTS = 5;
const GAME_PIN_WINDOW_MS = 1000 * 60 * 10;

const gamePinAttempts = new Map();

export async function handleGameRoutes(ctx) {
  const { request, url, env, json, readSignedToken, bearer, validStudent, roster } = ctx;
  if (!url.pathname.startsWith('/api/game/')) return null;

  const store = env.GAME_STORE || (env.GAMES_DB ? createD1GameStore(env.GAMES_DB) : null);
  if (!store) return json({ error: 'Game service is not configured' }, 503);

  const claims = await readSignedToken(env, bearer(request));
  const isStudent = Boolean(claims && claims.role === 'student' && validStudent(claims.student));
  const isAdmin = Boolean(claims && claims.role === 'admin');

  if (url.pathname === '/api/game/join' && request.method === 'POST') {
    if (!isStudent) return json({ error: 'unauthorized' }, 401);
    const body = await request.json().catch(() => ({}));
    const pin = String(body.pin || '').trim();
    const expectedPin = String(env.GAME_PIN || DEFAULT_GAME_PIN);
    const now = Date.now();
    const attempts = gamePinAttempts.get(claims.student);
    if (pin !== expectedPin) {
      const recent = attempts && now - attempts.firstAt < GAME_PIN_WINDOW_MS;
      const count = recent ? attempts.count + 1 : 1;
      gamePinAttempts.set(claims.student, { count, firstAt: recent ? attempts.firstAt : now });
      if (count > GAME_PIN_ATTEMPTS) return json({ error: 'Too many PIN attempts. Wait 10 minutes.' }, 429);
      return json({ error: 'Wrong PIN' }, 403);
    }
    gamePinAttempts.delete(claims.student);
    const student = roster.find((item) => item.id === claims.student);
    let active = await store.getActive();
    if (!active || active.status === 'finished') active = await store.createLobby();
    if (active.status !== 'lobby') return json({ error: 'game already started' }, 409);
    const game = await store.join(active.id, { id: student.id, name: student.name });
    return json({ ok: true, game });
  }

  if (url.pathname === '/api/game/state' && request.method === 'GET') {
    if (!isStudent && !isAdmin) return json({ error: 'unauthorized' }, 401);
    const active = await store.getActive();
    if (!active) return json({ ok: true, game: null });
    const viewer = isStudent ? claims.student : '';
    return json({ ok: true, game: await store.state(active.id, viewer) });
  }

  if (url.pathname === '/api/game/poison' && request.method === 'POST') {
    if (!isStudent) return json({ error: 'unauthorized' }, 401);
    const body = await request.json().catch(() => ({}));
    const active = await store.getActive();
    if (!active) return json({ error: 'game not found' }, 404);
    if (active.version !== body.version) return json({ error: 'state changed, refresh' }, 409);
    try {
      const game = await store.setPlacement(active.id, claims.student, body.cells);
      return json({ ok: true, game });
    } catch (error) {
      return json({ error: error.message || 'invalid placement' }, 400);
    }
  }

  if (url.pathname === '/api/game/pick' && request.method === 'POST') {
    if (!isStudent) return json({ error: 'unauthorized' }, 401);
    const body = await request.json().catch(() => ({}));
    const active = await store.getActive();
    if (!active) return json({ error: 'game not found' }, 404);
    try {
      const { game, result } = await store.pick(
        active.id, claims.student, Number(body.cell), Number(body.version)
      );
      return json({ ok: true, game, result });
    } catch (error) {
      const message = error.message || 'pick failed';
      if (message === 'version conflict') return json({ error: 'state changed, refresh' }, 409);
      if (message === 'not your turn') return json({ error: 'not your turn' }, 409);
      if (message === 'cell already revealed') return json({ error: 'cell already revealed' }, 409);
      if (message === 'game not found') return json({ error: 'game not found' }, 404);
      return json({ error: message }, 409);
    }
  }

  if (url.pathname === '/api/game/start' && request.method === 'POST') {
    if (!isAdmin) return json({ error: 'unauthorized' }, 401);
    const active = await store.getActive();
    if (!active) return json({ error: 'game not found' }, 404);
    try {
      return json({ ok: true, game: await store.start(active.id) });
    } catch (error) {
      return json({ error: error.message || 'cannot start' }, 409);
    }
  }

  if (url.pathname === '/api/game/reset' && request.method === 'POST') {
    if (!isAdmin) return json({ error: 'unauthorized' }, 401);
    await store.reset();
    return json({ ok: true });
  }

  return json({ error: 'not found' }, 404);
}
