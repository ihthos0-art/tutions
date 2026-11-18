// Provider chain — tries each in order until one succeeds
// All use OpenAI-compatible /chat/completions format
import { gradeFor, mergeProgress, sanitizeProgress } from './progress.js';
import { checkTopicAnswers, curriculumMapForGrade, learnerTopic, topicForGrade } from './curriculum-data.js';

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

export { PROVIDERS, tryProvider };
