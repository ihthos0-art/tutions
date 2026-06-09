export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/chat' && request.method === 'POST') {
      return handleChat(request, env);
    }

    if (url.pathname === '/api/health' && request.method === 'GET') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    return env.ASSETS.fetch(request);
  }
};

// ===== MODEL CATALOG =====
// Derived from FreeLLMAPI fallback_config. Ordered by priority (lower = tried first).
// Each entry: provider, model_id, keyEnv, api_url, timeout, max_tokens, rpm_limit
const MODEL_CHAIN = [
  // --- Google (Gemini) ---
  { provider: 'google', model: 'gemini-2.5-flash', keyEnv: 'GEMINI_API_KEY', url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', timeout: 25000, maxTokens: 8192, rpm: 10 },
  { provider: 'google', model: 'gemini-2.5-flash-lite', keyEnv: 'GEMINI_API_KEY', url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', timeout: 25000, maxTokens: 8192, rpm: 15 },
  { provider: 'google', model: 'gemini-3.5-flash', keyEnv: 'GEMINI_API_KEY', url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', timeout: 25000, maxTokens: 8192, rpm: 10 },

  // --- Groq ---
  { provider: 'groq', model: 'llama-3.1-8b-instant', keyEnv: 'GROQ_API_KEY', url: 'https://api.groq.com/openai/v1/chat/completions', timeout: 15000, maxTokens: 8192, rpm: 30 },
  { provider: 'groq', model: 'llama-3.3-70b-versatile', keyEnv: 'GROQ_API_KEY', url: 'https://api.groq.com/openai/v1/chat/completions', timeout: 15000, maxTokens: 8192, rpm: 30 },
  { provider: 'groq', model: 'meta-llama/llama-4-scout-17b-16e-instruct', keyEnv: 'GROQ_API_KEY', url: 'https://api.groq.com/openai/v1/chat/completions', timeout: 15000, maxTokens: 8192, rpm: 30 },

  // --- Mistral ---
  { provider: 'mistral', model: 'mistral-small-latest', keyEnv: 'MISTRAL_API_KEY', url: 'https://api.mistral.ai/v1/chat/completions', timeout: 15000, maxTokens: 8192, rpm: 2 },
  { provider: 'mistral', model: 'codestral-latest', keyEnv: 'MISTRAL_API_KEY', url: 'https://api.mistral.ai/v1/chat/completions', timeout: 15000, maxTokens: 8192, rpm: 2 },
  { provider: 'mistral', model: 'mistral-large-latest', keyEnv: 'MISTRAL_API_KEY', url: 'https://api.mistral.ai/v1/chat/completions', timeout: 15000, maxTokens: 8192, rpm: 2 },

  // --- Cerebras ---
  { provider: 'cerebras', model: 'zai-glm-4.7', keyEnv: 'CEREBRAS_API_KEY', url: 'https://api.cerebras.ai/v1/chat/completions', timeout: 15000, maxTokens: 8192, rpm: 10 },

  // --- OpenRouter ---
  { provider: 'openrouter', model: 'meta-llama/llama-3.1-8b-instruct:free', keyEnv: 'OPENROUTER_API_KEY', url: 'https://openrouter.ai/api/v1/chat/completions', timeout: 25000, maxTokens: 4096, rpm: 20 },
  { provider: 'openrouter', model: 'meta-llama/llama-3.3-70b-instruct:free', keyEnv: 'OPENROUTER_API_KEY', url: 'https://openrouter.ai/api/v1/chat/completions', timeout: 25000, maxTokens: 4096, rpm: 20 },
  { provider: 'openrouter', model: 'openai/gpt-oss-20b:free', keyEnv: 'OPENROUTER_API_KEY', url: 'https://openrouter.ai/api/v1/chat/completions', timeout: 25000, maxTokens: 4096, rpm: 20 },

  // --- Zhipu ---
  { provider: 'zhipu', model: 'glm-4.5-flash', keyEnv: 'ZHIPU_API_KEY', url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions', timeout: 25000, maxTokens: 8192, rpm: 1000 },
  { provider: 'zhipu', model: 'glm-4.7-flash', keyEnv: 'ZHIPU_API_KEY', url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions', timeout: 25000, maxTokens: 8192, rpm: 1000 },

  // --- Cohere ---
  { provider: 'cohere', model: 'command-r-08-2024', keyEnv: 'COHERE_API_KEY', url: 'https://api.cohere.ai/compatibility/v1/chat/completions', timeout: 25000, maxTokens: 8192, rpm: 20 },

  // --- Cloudflare ---
  { provider: 'cloudflare', model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast', keyEnv: 'CLOUDFLARE_API_KEY', url: null, timeout: 25000, maxTokens: 8192, rpm: 1000 },
  { provider: 'cloudflare', model: '@cf/qwen/qwen3-30b-a3b-fp8', keyEnv: 'CLOUDFLARE_API_KEY', url: null, timeout: 25000, maxTokens: 8192, rpm: 1000 },

  // --- HuggingFace ---
  { provider: 'huggingface', model: 'moonshotai/Kimi-K2.6', keyEnv: 'HUGGINGFACE_API_KEY', url: 'https://router.huggingface.co/v1/chat/completions', timeout: 30000, maxTokens: 4096, rpm: 1000 },

  // --- NVIDIA ---
  { provider: 'nvidia', model: 'meta/llama-3.1-70b-instruct', keyEnv: 'NVIDIA_API_KEY', url: 'https://integrate.api.nvidia.com/v1/chat/completions', timeout: 30000, maxTokens: 4096, rpm: 40 },

  // --- Kilo ---
  { provider: 'kilo', model: 'poolside/laguna-m.1:free', keyEnv: 'KILO_API_KEY', url: 'https://router.kilo.ai/v1/chat/completions', timeout: 30000, maxTokens: 4096, rpm: 1000 },

  // --- Ollama Cloud ---
  { provider: 'ollama', model: 'qwen3-coder:480b', keyEnv: 'OLLAMA_API_KEY', url: 'https://api.ollama.com/v1/chat/completions', timeout: 30000, maxTokens: 4096, rpm: 1000 },
];

const MAX_ATTEMPTS = 20;

// In-memory cooldown map ( Worker isolates per request, so this resets each request )
// For persistent cooldowns, switch to KV. Single-request cooldown is still useful
// for retrying within one request when a provider 429s.
const cooldowns = new Map(); // key: "provider/model" → timestamp when cooldown ends

function isRetryable(err) {
  const msg = (err.message || '').toLowerCase();
  return msg.includes('429')
    || msg.includes('rate limit')
    || msg.includes('too many requests')
    || msg.includes('timeout')
    || msg.includes('abort')
    || msg.includes('failed to fetch')
    || msg.includes('econnrefused')
    || msg.includes('econnreset')
    || msg.includes('quota')
    || msg.includes('resource_exhausted')
    || msg.includes('503')
    || msg.includes('502')
    || msg.includes('500')
    || msg.includes('504')
    || msg.includes('413')
    || msg.includes('payment required')
    || msg.includes('402');
}

function isOnCooldown(provider, model) {
  const key = provider + '/' + model;
  const until = cooldowns.get(key);
  return until ? Date.now() < until : false;
}

function setCooldown(provider, model, ms = 30000) {
  cooldowns.set(provider + '/' + model, Date.now() + ms);
}

async function handleChat(request, env) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  if (!body.messages || !Array.isArray(body.messages)) {
    return jsonResponse({ error: '`messages` array is required' }, 400);
  }

  const temperature = typeof body.temperature === 'number' ? body.temperature : 0.7;
  const maxTokens = typeof body.max_tokens === 'number' && body.max_tokens > 0
    ? body.max_tokens
    : 1024;

  let lastError = null;
  let attempts = 0;

  for (const entry of MODEL_CHAIN) {
    if (attempts >= MAX_ATTEMPTS) break;
    attempts++;

    const apiKey = env[entry.keyEnv];
    if (!apiKey) continue;
    if (entry.keyEnv === 'KILO_API_KEY' && apiKey === 'no-key') {
      // Kilo allows anonymous; skip if explicitly unset
      continue;
    }

    // Skip if on cooldown
    if (isOnCooldown(entry.provider, entry.model)) {
      console.warn(`[router] ${entry.provider}/${entry.model} on cooldown, skipping`);
      continue;
    }

    // Cloudflare needs special URL construction
    let url = entry.url;
    if (entry.provider === 'cloudflare') {
      const parts = apiKey.split(':');
      if (parts.length !== 2) {
        console.error(`[router] Cloudflare key must be "account_id:token"`);
        continue;
      }
      url = `https://api.cloudflare.com/client/v4/accounts/${parts[0]}/ai/v1/chat/completions`;
    }

    if (!url) {
      console.error(`[router] No URL for ${entry.provider}`);
      continue;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), entry.timeout);

      const auth = entry.provider === 'cloudflare'
        ? { 'Authorization': 'Bearer ' + apiKey.split(':')[1] }
        : { 'Authorization': 'Bearer ' + apiKey };

      const res = await fetch(url, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...auth
        },
        body: JSON.stringify({
          model: entry.model,
          messages: body.messages,
          temperature: temperature,
          max_tokens: Math.min(maxTokens, entry.maxTokens)
        })
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const text = await res.text();
        const err = new Error(`${entry.provider} ${res.status}: ${text.slice(0, 200)}`);
        err.status = res.status;
        throw err;
      }

      const data = await res.json();

      // Add routing header so frontend can show which provider served it
      return new Response(JSON.stringify(data), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-Routed-Via': `${entry.provider}/${entry.model}`
        }
      });
    } catch (err) {
      lastError = err;
      if (isRetryable(err)) {
        console.warn(`[router] ${entry.provider}/${entry.model} failed, trying next...`, err.message);
        // Short cooldown for this model so rapid retries don't hammer it
        setCooldown(entry.provider, entry.model, 5000);
        continue;
      }
      // Non-retryable: stop trying this provider entirely
      break;
    }
  }

  const safeError = lastError ? lastError.message : 'All models unavailable';
  return jsonResponse({
    error: `All LLM providers failed after ${attempts} attempts. Last error: ${safeError}`,
    type: 'provider_error'
  }, 503);
}

function jsonResponse(data, status) {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
