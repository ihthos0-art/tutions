// Provider chain — tries each in order until one succeeds
// All use OpenAI-compatible /chat/completions format
const PROVIDERS = [
  {
    name: 'groq',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.3-70b-versatile',
    keyEnv: 'GROQ_API_KEY'
  },
  {
    name: 'groq-fast',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.1-8b-instant',
    keyEnv: 'GROQ_API_KEY'
  },
  {
    name: 'cerebras',
    url: 'https://api.cerebras.ai/v1/chat/completions',
    model: 'llama-3.3-70b',
    keyEnv: 'CEREBRAS_API_KEY'
  },
  {
    name: 'mistral',
    url: 'https://api.mistral.ai/v1/chat/completions',
    model: 'mistral-small-latest',
    keyEnv: 'MISTRAL_API_KEY'
  },
  {
    name: 'openrouter',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'meta-llama/llama-3.1-8b-instruct:free',
    keyEnv: 'OPENROUTER_API_KEY'
  },
  {
    name: 'cohere',
    url: 'https://api.cohere.ai/compatibility/v1/chat/completions',
    model: 'command-r-plus',
    keyEnv: 'COHERE_API_KEY'
  }
];

async function tryProvider(provider, apiKey, body) {
  const res = await fetch(provider.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey,
      'HTTP-Referer': 'https://tutions.ihthos0-art.workers.dev',
      'X-Title': 'NYC Tutoring Center'
    },
    body: JSON.stringify({
      model: provider.model,
      messages: body.messages,
      temperature: body.temperature || 0.7,
      max_tokens: body.max_tokens || 1024
    })
  });
  const data = await res.json();
  const ok = res.ok && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  return { ok, data, provider: provider.name + '/' + provider.model };
}

// ---- Shared helpers ----
const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

function json(obj, status = 200, extra = {}) {
  return new Response(JSON.stringify(obj), { status, headers: { ...JSON_HEADERS, ...extra } });
}

const STUDENT_IDS = [
  'nabila-naviha', 'salma-khadija', 'adnan', 'nafis', 'nahid',
  'sameer', 'manha', 'mahiya', 'taha', 'salma', 'khadija'
];
function validStudent(id) { return STUDENT_IDS.includes(id); }

// ---- HMAC-signed admin token (8h, no DB needed) ----
function b64url(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
async function hmac(secret, data) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return b64url(sig);
}
async function makeToken(env) {
  const exp = Date.now() + 1000 * 60 * 60 * 8;
  const payload = b64url(new TextEncoder().encode(JSON.stringify({ exp })));
  const sig = await hmac(env.ADMIN_TOKEN_SECRET || 'dev', payload);
  return payload + '.' + sig;
}
async function verifyToken(env, token) {
  if (!token) return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  const expected = await hmac(env.ADMIN_TOKEN_SECRET || 'dev', payload);
  if (sig !== expected) return false;
  try {
    const { exp } = JSON.parse(new TextDecoder().decode(
      Uint8Array.from(atob(payload.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
    ));
    return Date.now() < exp;
  } catch { return false; }
}
function bearer(request) {
  const h = request.headers.get('Authorization') || '';
  return h.startsWith('Bearer ') ? h.slice(7) : '';
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') return new Response(null, { headers: JSON_HEADERS });

    // ---- ADMIN LOGIN ----
    if (url.pathname === '/api/admin/login' && request.method === 'POST') {
      const { username, password } = await request.json().catch(() => ({}));
      if (username === env.ADMIN_USERNAME && password === env.ADMIN_PASSWORD) {
        return json({ ok: true, token: await makeToken(env) });
      }
      return json({ ok: false, error: 'Invalid credentials' }, 401);
    }

    // ---- HOMEWORK: read (public) / write (admin) ----
    {
      const m = url.pathname.match(/^\/api\/homework\/([a-z0-9-]+)$/);
      if (m && request.method === 'GET') {
        if (!validStudent(m[1])) return json({ error: 'unknown student' }, 404);
        if (!env.HOMEWORK) return json({ content: null });
        const raw = await env.HOMEWORK.get('homework:' + m[1]);
        return json({ content: raw ? JSON.parse(raw) : null });
      }
      if (m && request.method === 'POST') {
        if (!await verifyToken(env, bearer(request))) return json({ error: 'unauthorized' }, 401);
        if (!validStudent(m[1])) return json({ error: 'unknown student' }, 404);
        if (!env.HOMEWORK) return json({ error: 'KV not configured' }, 503);
        const content = await request.json();
        content.updatedAt = new Date().toISOString();
        content.student = m[1];
        await env.HOMEWORK.put('homework:' + m[1], JSON.stringify(content));
        return json({ ok: true, content });
      }
    }

    // ---- ANSWERS: student submits (public) / admin reads (auth) ----
    {
      const m = url.pathname.match(/^\/api\/answers\/([a-z0-9-]+)$/);
      if (m && request.method === 'POST') {
        if (!validStudent(m[1])) return json({ error: 'unknown student' }, 404);
        if (!env.HOMEWORK) return json({ ok: true });
        const body = await request.json().catch(() => ({}));
        const record = { updatedAt: new Date().toISOString(), student: m[1], answers: body.answers || {} };
        await env.HOMEWORK.put('answers:' + m[1], JSON.stringify(record));
        return json({ ok: true });
      }
      if (m && request.method === 'GET') {
        if (!await verifyToken(env, bearer(request))) return json({ error: 'unauthorized' }, 401);
        if (!env.HOMEWORK) return json({ answers: null });
        const raw = await env.HOMEWORK.get('answers:' + m[1]);
        return json({ record: raw ? JSON.parse(raw) : null });
      }
    }

    // ---- ADMIN: AI generates homework via Kimi K2.6 (Ollama Cloud) ----
    if (url.pathname === '/api/admin/generate' && request.method === 'POST') {
      if (!await verifyToken(env, bearer(request))) return json({ error: 'unauthorized' }, 401);
      const { instruction, section, current, grade } = await request.json().catch(() => ({}));

      const KIMI_URL = 'https://ollama.com/v1/chat/completions';
      const KIMI_MODEL = 'kimi-k2.6:cloud';

      const schemaHint = {
        fillBlank: '{"title":string,"instructions":string,"wordBank":string[],"sentences":[{"before":string,"answer":string,"after":string}]}',
        stories:   '[{"title":string,"paragraphs":string[],"prompt":string}]',
        math:      '{"title":string,"problems":[{"q":string,"answer":string}]}',
        ela:       '{"title":string,"paragraphs":string[],"questions":[{"label":string,"question":string,"placeholder":string,"save":string}]}'
      }[section] || '{}';

      const sys = 'You are a curriculum editor for NYC ESL students (Bengali speakers, grades 1-8). ' +
        'You edit homework content. Return ONLY valid minified JSON matching this schema for the "' +
        section + '" section: ' + schemaHint +
        '. For fillBlank, every answer MUST appear in wordBank. Keep language simple and grade-appropriate. No markdown, no commentary.';
      const usr = 'Grade: ' + (grade || 'unknown') + '\nCurrent content (may be empty):\n' +
        JSON.stringify(current || null) + '\n\nInstruction: ' + instruction;

      const res = await fetch(KIMI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + env.OLLAMA_API_KEY },
        body: JSON.stringify({ model: KIMI_MODEL, temperature: 0.7, max_tokens: 4000, think: false,
          messages: [{ role: 'system', content: sys }, { role: 'user', content: usr }] })
      });
      const data = await res.json();
      // Kimi K2.6 is a reasoning model — content may be empty; fall back to reasoning field
      const text = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.message?.reasoning;
      if (!text) return json({ error: 'AI failed', detail: data }, 502);

      let parsed;
      try {
        const clean = text.replace(/```json?/gi, '').replace(/```/g, '').trim();
        parsed = JSON.parse(clean.match(/[[{][\s\S]*[\]}]/)?.[0] || clean);
      } catch (e) { return json({ error: 'AI returned non-JSON', raw: text }, 502); }

      return json({ ok: true, section, generated: parsed });
    }

    // ---- STUDENT AI CHAT (existing multi-provider chain) ----
    if (url.pathname === '/api/chat' && request.method === 'POST') {
      try {
        const body = await request.json();
        const errors = [];

        for (const provider of PROVIDERS) {
          const apiKey = env[provider.keyEnv];
          if (!apiKey) continue;

          try {
            const { ok, data, provider: providerName } = await tryProvider(provider, apiKey, body);
            if (ok) {
              return new Response(JSON.stringify(data), {
                headers: {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*',
                  'X-Routed-Via': providerName
                }
              });
            }
            errors.push({ provider: providerName, error: data.error || 'no choices' });
          } catch (e) {
            errors.push({ provider: provider.name, error: e.message });
          }
        }

        return new Response(JSON.stringify({ error: 'All providers failed', details: errors }), {
          status: 502,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Request failed: ' + e.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    return env.ASSETS.fetch(request);
  }
};
