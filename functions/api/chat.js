// NOTE: This file is superseded by src/index.js (the main Worker entry point).
// Wrangler.toml routes /api/* to the worker first, so this Pages Function
// is not executed. Kept for reference only.

export async function onRequestPost(context) {
  return new Response(JSON.stringify({ error: 'Use src/index.js' }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' }
  });
}
