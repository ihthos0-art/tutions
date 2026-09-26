import worker from '../../src/index.js';

// Pages Functions owns the /api/* route on the same hostname as the static site.
// The existing Worker handler remains the single source of truth for auth,
// assignments, homework, answers, and chat.
export async function onRequest(context) {
  const env = {
    ...context.env,
    ASSETS: { fetch: () => context.next() }
  };
  return worker.fetch(context.request, env);
}
