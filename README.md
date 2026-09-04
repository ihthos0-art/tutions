# Socratic AI Homework Helper

Interactive homework workspace for NYC tutoring students. The project combines
static, student-specific ELA and math pages with a Cloudflare Worker for AI
assistance, answer sync, and an authenticated parent/admin workflow.

## Purpose

Give students a simple place to open assigned work, practice reading and math,
receive guided AI help, and save responses. The interface is designed for
younger learners and Bengali-speaking families, with the static pages remaining
usable when the server features are unavailable.

## Architecture

```text
Student HTML pages ──┐
                     ├── Cloudflare Pages assets
Shared JS modules ───┘          │
                                └── Cloudflare Worker (`src/index.js`)
                                     ├── AI chat provider chain
                                     ├── Admin HMAC login + homework editor
                                     └── KV homework / answer storage
```

- Student pages: per-student assigned work plus shared interactive math, ELA,
  quiz, flashcard, and word-game modules.
- Worker: `/api/chat`, `/api/homework/:student`, `/api/answers/:student`, and
  `/api/admin/*` routes.
- AI: OpenAI-compatible provider fallback for student chat; Kimi K2.6 through
  Ollama Cloud for the admin content editor.
- Storage: Cloudflare KV for homework and answer records; browser storage keeps
  the static experience resilient offline.

## Individual contribution

Built the student learning flows, reusable interaction modules, Cloudflare
Worker API, provider fallback logic, signed admin sessions, KV-backed homework
and answer synchronization, and the parent answer dashboard.

## Results and validation

- 10+ student-facing HTML routes with shared math/ELA interactions and answer
  persistence.
- Three focused JavaScript tests are committed under `tests/` for assignment
  rendering, math rendering, and student identities.
- No performance benchmark is currently published; response latency depends on
  the configured AI provider and Cloudflare runtime.

## Setup

Install the Cloudflare CLI if needed, then authenticate with the account that
owns the Worker:

```bash
npm install -g wrangler
npx wrangler login
npx wrangler dev
```

For local Worker secrets, create a `.dev.vars` file (never commit it):

```text
GROQ_API_KEY=...
ADMIN_USERNAME=...
ADMIN_PASSWORD=...
ADMIN_TOKEN_SECRET=generate-a-long-random-value
OLLAMA_API_KEY=...
```

The KV namespace IDs and secret names are declared in `wrangler.toml`; secret
values must be added with `wrangler secret put`. Deploy with:

```bash
npx wrangler deploy
```

Run the committed tests with any JavaScript test runner that supports ES
modules, or execute the test files directly while developing. The repository
does not currently include a `package.json`, so the test command is intentionally
not presented as a verified one-line script.

## Security notes

Never commit `.dev.vars`, `SECRETS.local.md`, API keys, passwords, or token
secrets. Production admin credentials belong in Cloudflare secrets. The Worker
whitelists student IDs and requires a signed bearer token for admin operations.

## Status

Active private tutoring deployment. The public repository is
[`ihthos0-art/tutions`](https://github.com/ihthos0-art/tutions).
