# Admin AI Homework Editor — Implementation Plan & Code

> **For the executing model:** This document is a complete build spec. Implement it
> in order, phase by phase. Each phase ends with a **verify** step — do not advance
> until it passes. All code blocks are real and intended to be used close to as-is.
> Commit after each phase. **Never commit secrets** (admin password, API keys) into
> any file — they go into Cloudflare via `wrangler secret put`.

---

## 1. Goal

Turn the admin panel (`parent.html`) into an **AI-driven homework editor**:

- Admin logs in (real auth; password stored as a Cloudflare secret, NOT in code).
- Admin picks a student, types a natural-language instruction
  (e.g. *"replace the fill-in-the-blanks with 10 sentences about animals"*).
- A strong model (**Kimi K2.6**, via the admin's own API key) generates new homework
  content as structured JSON.
- Admin previews it, clicks **Save** → it is written to **Cloudflare KV**.
- The student's page reads its homework from KV on load and renders it. Falls back to
  the hardcoded HTML if the server has nothing (offline-safe).
- Student written answers **sync to the server**, so the admin panel shows every
  student's work from any device.

This replaces the current "edit HTML in git and push" workflow.

---

## 2. Current architecture (as-is)

- **Single Cloudflare Worker** `src/index.js`, configured by `wrangler.toml`:
  - `[assets] directory = "."` serves the static HTML/JS files.
  - `run_worker_first = ["/api/*"]` routes API calls to the worker.
  - `/api/chat` proxies to a chain of AI providers (keys in Cloudflare secrets).
- **Per-student HTML files** (`nabila-naviha.html`, `salma-khadija.html`, `adnan.html`,
  `nafis.html`, `nahid.html`, `sameer.html`, `manha.html`, `mahiya.html`, `taha.html`)
  with three tabs: **Assigned**, **Math Practice**, **ELA Practice**. Content is hardcoded.
- **Answers persist only in browser `localStorage`** under the `"<page>:<key>"` namespace.
- `parent.html` is an admin panel that reads `localStorage` (so it only sees the current
  device — the limitation we are fixing).
- `ai-generator.js` already generates math/ELA client-side and (recently) persists the
  generated content to `localStorage` so it survives refresh.

**Key constraint discovered:** each page's inline JS binds the fill-in-the-blank
drag/drop, the math "Check Answers", and the auto-save **synchronously on load**. If the
loader replaces section HTML *after* that, listeners won't be attached. The plan solves
this by extracting binding into a shared module with an explicit `initAll()` the loader
calls after hydration (see Phase 4).

---

## 3. Target architecture

```
                 ┌──────────────────────────────────────────┐
                 │            Cloudflare Worker               │
  Student page   │  src/index.js                              │
  ───────────────┤   GET  /api/homework/:student  ◄── KV read │
  homework-loader│   POST /api/answers/:student   ──► KV write │
  answers-sync   │                                            │
                 │  Admin panel (parent.html)                 │
  Admin browser  │   POST /api/admin/login    (verify secret) │
  ───────────────┤   POST /api/admin/generate (call Kimi)     │
                 │   POST /api/homework/:student ──► KV write  │
                 │   GET  /api/answers/:student  ◄── KV read   │
                 │                                            │
                 │  KV namespace: HOMEWORK                     │
                 │    homework:<student>  → content JSON       │
                 │    answers:<student>   → answers JSON       │
                 └──────────────────────────────────────────┘
```

**Storage choice: Cloudflare KV** (not D1). The data is a handful of JSON blobs keyed by
student; KV is the simplest fit and free-tier limits (100k reads/day, 1k writes/day) are
far beyond this use. Note KV is eventually consistent (writes can take up to ~60s to
propagate globally) — fine for homework.

---

## 4. Prerequisites the human must do (document these; do not attempt yourself)

These require the account owner's terminal / Cloudflare dashboard:

1. **Create the KV namespace** and copy the returned `id`:
   ```bash
   npx wrangler kv namespace create HOMEWORK
   npx wrangler kv namespace create HOMEWORK --preview
   ```
2. **Set secrets** (interactive — values never touch the repo; values in `SECRETS.local.md`):
   ```bash
   npx wrangler secret put ADMIN_USERNAME      # enter: ihthos
   npx wrangler secret put ADMIN_PASSWORD      # enter: (the chosen password)
   npx wrangler secret put ADMIN_TOKEN_SECRET  # enter: any long random string (HMAC key)
   npx wrangler secret put OLLAMA_API_KEY      # enter: the Ollama Cloud key (Kimi K2.6)
   ```
3. **Kimi provider — CONFIRMED (Ollama Cloud):** the AI editor uses Ollama Cloud's
   OpenAI-compatible endpoint. No further confirmation needed.
   - Endpoint: `https://ollama.com/v1/chat/completions`
   - Model tag: **`kimi-k2.6:cloud`**
   - Auth: `Authorization: Bearer <OLLAMA_API_KEY>`
   - The key is stored locally in `SECRETS.local.md` (git-ignored) and set as the Cloudflare
     secret `OLLAMA_API_KEY` via `wrangler secret put OLLAMA_API_KEY`.

> **Real credential values live in `SECRETS.local.md`** (git-ignored, never committed). The
> Cloudflare account id + API token, R2 keys, and the Ollama key are all there. Use them for
> the `wrangler` commands below; do not paste them into any committed file.

> Until KV id + secrets exist, the worker code is written defensively (missing bindings →
> clean error, page falls back to static content). So the executor can build & deploy code
> first; features light up once the human finishes step 1–3.

---

## 5. The homework content schema (the contract everything shares)

One JSON object per student under KV key `homework:<student>`. Any section that is
**absent** means "use the page's hardcoded HTML." This makes adoption incremental and safe.

```jsonc
{
  "version": 1,
  "updatedAt": "2026-06-26T18:00:00.000Z",
  "student": "nabila-naviha",

  // ----- ASSIGNED TAB -----
  "assigned": {
    "fillBlank": {
      "title": "Fill in the Blank",
      "instructions": "Drag a word onto a blank — or tap a word, then tap a blank",
      "wordBank": ["play", "blue", "sleep", "ride", "grow"],
      "sentences": [
        { "before": "Children like to ", "answer": "play", "after": " on the playground." }
      ]
    },
    "stories": [
      {
        "title": "The Brave Little Bee",
        "paragraphs": ["Paragraph one…", "Paragraph two…"],
        "prompt": "Tell your teacher about this story. What happened? Write 2–3 sentences."
      }
    ],
    "math": {                       // optional; omit if this student has no assigned math
      "title": "2-Digit Addition",
      "problems": [ { "q": "43 + 25 =", "answer": "68" } ]
    }
  },

  // ----- MATH PRACTICE TAB -----
  "math": {
    "title": "Simple Addition",
    "problems": [ { "q": "21 + 35 =", "answer": "56" } ]
  },

  // ----- ELA PRACTICE TAB -----
  "ela": {
    "title": "The Big Puddle",
    "paragraphs": ["…", "…"],
    "questions": [
      { "label": "Tell Your Teacher", "question": "What did the boy do?", "placeholder": "In this story…", "save": "ela-story" }
    ]
  }
}
```

**Answers** are stored separately under KV key `answers:<student>`:

```jsonc
{
  "updatedAt": "2026-06-26T18:00:00.000Z",
  "student": "nabila-naviha",
  "answers": {
    "ws1-summary": "The bee was scared but flew home.",
    "ela-story": "A boy jumped in a puddle and got wet."
  }
}
```

---

## 6. Phase 1 — Worker: storage, auth, homework & answers API

Edit `src/index.js`. Keep the existing `/api/chat` block. Add the helpers and routes below.

### 6.1 wrangler.toml — bind KV

Add (fill `id`/`preview_id` from §4 step 1):

```toml
[[kv_namespaces]]
binding = "HOMEWORK"
id = "PASTE_PRODUCTION_ID_HERE"
preview_id = "PASTE_PREVIEW_ID_HERE"
```

### 6.2 Shared helpers (top of `src/index.js`, after the PROVIDERS array)

```js
const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

function json(obj, status = 200, extra = {}) {
  return new Response(JSON.stringify(obj), { status, headers: { ...JSON_HEADERS, ...extra } });
}

// Allow only known students (prevents arbitrary KV keys)
const STUDENT_IDS = [
  'nabila-naviha','salma-khadija','adnan','nafis','nahid',
  'sameer','manha','mahiya','taha'
];
function validStudent(id) { return STUDENT_IDS.includes(id); }

// ---- HMAC-signed admin token (no DB needed) ----
function b64url(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
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
  const exp = Date.now() + 1000 * 60 * 60 * 8; // 8h
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
      Uint8Array.from(atob(payload.replace(/-/g,'+').replace(/_/g,'/')), c => c.charCodeAt(0))
    ));
    return Date.now() < exp;
  } catch { return false; }
}
function bearer(request) {
  const h = request.headers.get('Authorization') || '';
  return h.startsWith('Bearer ') ? h.slice(7) : '';
}
```

### 6.3 Routes (inside `fetch`, BEFORE the existing `/api/chat` block is fine; keep chat too)

```js
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

// ---- READ HOMEWORK (public; student pages call this) ----
{
  const m = url.pathname.match(/^\/api\/homework\/([a-z0-9-]+)$/);
  if (m && request.method === 'GET') {
    if (!validStudent(m[1])) return json({ error: 'unknown student' }, 404);
    if (!env.HOMEWORK) return json({ content: null });        // KV not bound yet → fallback
    const raw = await env.HOMEWORK.get('homework:' + m[1]);
    return json({ content: raw ? JSON.parse(raw) : null });
  }
  // ---- WRITE HOMEWORK (admin only) ----
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

// ---- ANSWERS: student submits (public), admin reads (auth) ----
{
  const m = url.pathname.match(/^\/api\/answers\/([a-z0-9-]+)$/);
  if (m && request.method === 'POST') {
    if (!validStudent(m[1])) return json({ error: 'unknown student' }, 404);
    if (!env.HOMEWORK) return json({ ok: true });             // soft-noop if no KV
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
```

### 6.4 AI generate endpoint (Kimi K2.6 via Ollama Cloud) — CONFIRMED

```js
// ---- ADMIN: AI generates homework content from a prompt ----
if (url.pathname === '/api/admin/generate' && request.method === 'POST') {
  if (!await verifyToken(env, bearer(request))) return json({ error: 'unauthorized' }, 401);
  const { instruction, section, current, grade } = await request.json().catch(() => ({}));

  // Ollama Cloud, OpenAI-compatible:
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
    body: JSON.stringify({ model: KIMI_MODEL, temperature: 0.7, max_tokens: 2000,
      messages: [{ role:'system', content: sys }, { role:'user', content: usr }] })
  });
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) return json({ error: 'AI failed', detail: data }, 502);

  // strip code fences, parse
  let parsed;
  try {
    const clean = text.replace(/```json?/gi,'').replace(/```/g,'').trim();
    parsed = JSON.parse(clean.match(/[[{][\s\S]*[\]}]/)?.[0] || clean);
  } catch (e) { return json({ error: 'AI returned non-JSON', raw: text }, 502); }

  return json({ ok: true, section, generated: parsed });
}
```

### Phase 1 verify
- `npx wrangler deploy` succeeds.
- `curl -X POST .../api/admin/login -d '{"username":"ihthos","password":"…"}'` returns a token.
- `GET /api/homework/nabila-naviha` returns `{"content":null}` (or fallback) without error.
- Commit: `feat: worker storage, admin auth, homework/answers/generate API`.

---

## 7. Phase 2 — Student page: hydrate homework + sync answers

Create **`homework-loader.js`** (shared by all student pages). It fetches the student's
homework and, for each present section, rebuilds the DOM using the **same class names** the
existing pages use, then calls a shared `initAll()` (Phase 4) so handlers bind once.

```js
(function () {
  'use strict';
  // Student id = file name without .html
  var STUDENT = location.pathname.split('/').pop().replace('.html','') || 'index';
  window.HW = { content: null, student: STUDENT };

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  // --- renderers: write JSON into the existing containers ---
  function renderFillBlank(fb) {
    var wb = document.querySelector('#assigned .wb-words');
    var list = document.querySelector('#assigned .fitb-list');
    if (!wb || !list || !fb) return;
    wb.innerHTML = fb.wordBank.map(function (w) {
      return '<span class="wb-chip" data-word="'+esc(w)+'">'+esc(w)+'</span>';
    }).join('');
    list.innerHTML = fb.sentences.map(function (s, i) {
      return '<div class="fitb-item"><span class="fitb-num">'+(i+1)+'.</span>'+
        '<p class="fitb-text">'+esc(s.before)+
        '<span class="fitb-drop" data-save="hw'+(i+1)+'" data-answer="'+esc(s.answer)+'"></span>'+
        esc(s.after)+'</p></div>';
    }).join('');
  }
  function renderStories(stories) {
    // Replace every reading .ws-card in #assigned that has a [data-save$="summary"] textarea.
    // Simplest: leave hardcoded stories, only override if provided. See Phase 4 note.
  }
  function renderMath(targetSel, math) {
    var grid = document.querySelector(targetSel);
    if (!grid || !math) return;
    grid.innerHTML = math.problems.map(function (p, i) {
      return '<div class="math-prob"><span class="problem-eq">'+esc(p.q)+
        '</span><input type="text" data-save="m1-'+(i+1)+'" data-answer="'+esc(p.answer)+'" placeholder="?" /></div>';
    }).join('');
  }

  function apply(content) {
    if (!content) return;
    window.HW.content = content;
    if (content.assigned && content.assigned.fillBlank) renderFillBlank(content.assigned.fillBlank);
    if (content.math) renderMath('#math .math-grid', content.math);
    if (content.assigned && content.assigned.math) renderMath('#assigned .problems-grid', content.assigned.math);
    // stories / ela handled in Phase 4 once init is shared
  }

  // Fetch then init. initAll() is defined in interactive.js (Phase 4).
  window.HW.ready = fetch('/api/homework/' + STUDENT)
    .then(function (r) { return r.json(); })
    .then(function (d) { apply(d.content); })
    .catch(function () { /* offline → keep static HTML */ })
    .then(function () { if (window.initAll) window.initAll(); });
})();
```

Create **`answers-sync.js`** — debounced POST of all `data-save` text answers:

```js
(function () {
  'use strict';
  var STUDENT = location.pathname.split('/').pop().replace('.html','') || 'index';
  var timer = null;
  function collect() {
    var out = {};
    document.querySelectorAll('textarea[data-save]').forEach(function (t) {
      if (t.value && t.value.trim()) out[t.dataset.save] = t.value;
    });
    return out;
  }
  function push() {
    clearTimeout(timer);
    timer = setTimeout(function () {
      fetch('/api/answers/' + STUDENT, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: collect() })
      }).catch(function () {});
    }, 1500);
  }
  document.addEventListener('input', function (e) {
    if (e.target.matches && e.target.matches('textarea[data-save]')) push();
  });
})();
```

**Include order matters.** In each student page, the scripts must load so that hydration
happens before binding. Replace the existing tail script tags with:

```html
<script src="homework-loader.js?v=1"></script>
<script src="interactive.js?v=1"></script>   <!-- Phase 4: defines window.initAll -->
<script src="answers-sync.js?v=1"></script>
<script src="ai-tutor.js"></script>
<script src="quiz.js"></script>
<script src="flashcards.js"></script>
```

> The loader awaits the fetch, then calls `window.initAll()`. `interactive.js` must define
> `initAll` but NOT auto-run it (the loader controls timing). See Phase 4.

### Phase 2 verify
- With no KV content, page renders hardcoded HTML exactly as before (fallback works).
- Network tab shows `GET /api/homework/<student>` returning `{"content":null}`.
- Commit: `feat: homework-loader + answers-sync (no behavior change when KV empty)`.

---

## 8. Phase 4 — Extract interactive binding into `interactive.js`

> Phase 3 (admin UI) depends on nothing here, but the student render path does. This is the
> riskiest refactor; do it on **`nabila-naviha.html` first** as the reference, verify, then
> replicate to the other 8 pages.

**Why:** today each page binds drag/drop + check + autosave inline on load. The loader needs
to (re)bind after replacing DOM. Move that logic into one `initAll()`.

Steps:
1. Move the fill-in-the-blank drag/drop code, the math "Check Answers" handlers, the
   "Reset All Answers" handler, and the textarea autosave from each page's inline `<script>`
   into `interactive.js`, wrapped as:
   ```js
   window.initAll = function () {
     // guard so it only runs once
     if (window.__initDone) return; window.__initDone = true;
     initFillBlank(); initMathCheck(); initAutosave(); initReset();
   };
   ```
   Each `initX` must **query the DOM at call time** (not at module load), so it sees the
   loader's freshly-rendered nodes.
2. Remove the now-duplicated inline script from the page, leaving only `window.STUDENT_CONFIG`.
3. Keep `localStorage` autosave AND add the server sync (Phase 2) — both can coexist;
   localStorage is the offline cache, server is the source of truth for the admin view.
4. For **stories** and **ELA** override: extend the loader's `renderStories`/ELA to rebuild
   those `.ws-card`s from JSON, reusing the existing markup pattern (passage-box + textarea
   with the same `data-save` keys). Only override when the JSON section is present.

### Phase 4 verify (nabila-naviha first)
- Hardcoded page still fully works (drag/drop, check, reset, save) with `initAll` driving it.
- Manually `PUT` a test homework JSON via the admin token and confirm the page renders the
  new fill-in-the-blanks after refresh.
- Then replicate to the other 8 pages. Commit per batch.

---

## 9. Phase 3 — Admin panel: login + AI editor + answer viewer

Rewrite `parent.html`. **Remove the hardcoded password** (it currently sits in client JS —
a real leak). Auth now goes through `/api/admin/login`; the token is held in `sessionStorage`.

Core pieces (build as one page; pseudocode-tight, fill styling to match existing dark admin UI):

```js
var token = sessionStorage.getItem('admin-token') || '';
var STUDENTS = ['nabila-naviha','salma-khadija','adnan','nafis','nahid','sameer','manha','mahiya','taha'];

async function login(u, p) {
  var r = await fetch('/api/admin/login', { method:'POST',
    headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username:u, password:p }) });
  var d = await r.json();
  if (d.ok) { token = d.token; sessionStorage.setItem('admin-token', token); showPanel(); }
  else showLoginError();
}

// Editor: choose student + section, type instruction, call AI, preview, save.
async function generate(student, section, instruction, grade, current) {
  var r = await fetch('/api/admin/generate', { method:'POST',
    headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
    body: JSON.stringify({ student, section, instruction, grade, current }) });
  return r.json();           // { ok, section, generated }
}

async function loadCurrent(student) {
  var r = await fetch('/api/homework/' + student);
  return (await r.json()).content || {};
}

async function save(student, content) {
  var r = await fetch('/api/homework/' + student, { method:'POST',
    headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
    body: JSON.stringify(content) });
  return r.json();
}

async function loadAnswers(student) {
  var r = await fetch('/api/answers/' + student, { headers:{'Authorization':'Bearer '+token} });
  return (await r.json()).record;   // { updatedAt, answers:{...} }
}
```

**Editor UX flow:**
1. Pick a student (dropdown of the 9).
2. Pick a section: Fill-in-the-Blank · Reading Stories · Assigned Math · Math Practice · ELA.
3. Type an instruction → **Generate** → preview the returned JSON rendered nicely
   (and/or raw). 
4. **Save** merges `generated` into the loaded `content[section-path]` and POSTs the whole
   object. Show "Saved — live for <student>".
5. A separate **Answers** view per student calls `loadAnswers` and lists each `data-save`
   response (reuse the existing label map already in `parent.html`).

**Merge rules** (client side, before save):
- `fillBlank` → `content.assigned.fillBlank`
- `stories` → `content.assigned.stories`
- assigned `math` → `content.assigned.math`
- `math` (practice) → `content.math`
- `ela` → `content.ela`

### Phase 3 verify
- Login with the real secret works; wrong password rejected by the server (not client).
- Generate → preview → Save round-trips; refreshing the student page shows the new content.
- Answers view shows responses submitted from a different browser/device.
- Commit: `feat: AI homework editor admin panel`.

---

## 10. Execution order (summary checklist)

- [ ] **Phase 1** — Worker API (`src/index.js`) + `wrangler.toml` KV binding. Deploy. Verify login/health.
- [ ] **Human** — create KV namespace, set 4 secrets, confirm Kimi URL/model (§4). Executor fills the two TODO constants and KV ids.
- [ ] **Phase 2** — `homework-loader.js` + `answers-sync.js`; wire script tags. Verify fallback unchanged.
- [ ] **Phase 4** — `interactive.js` refactor on `nabila-naviha.html`; verify; replicate to 8 others.
- [ ] **Phase 3** — rewrite `parent.html` as AI editor + answer viewer. Verify end-to-end.
- [ ] Final pass: all 9 pages load, edit one student live from the panel, confirm answers sync.

---

## 11. Security notes

- **No credentials in the repo.** Admin user/pass and all API keys live only in Cloudflare
  secrets. The earlier `parent.html` hardcoded password is removed in Phase 3.
- Admin endpoints require a valid **HMAC-signed token**; tokens expire in 8h. The signing
  key is the `ADMIN_TOKEN_SECRET`.
- `validStudent()` whitelists KV keys so the API can't be used to write arbitrary data.
- This is low-stakes (student homework/answers), so token-in-sessionStorage is acceptable.
  If you later want stronger isolation, move to Cloudflare Access in front of `/parent.html`.
- The student answer-submit endpoint is intentionally **unauthenticated** (kids have no
  logins). It only writes to a whitelisted `answers:<student>` key. Acceptable for this use;
  worst case is a bad actor overwriting one student's answer blob. If that matters later, add
  a lightweight per-page write token.

---

## 12. Open decisions / TODO for the executor

1. ~~Kimi endpoint + model id~~ — **RESOLVED**: Ollama Cloud,
   `https://ollama.com/v1/chat/completions`, model `kimi-k2.6:cloud`, secret `OLLAMA_API_KEY`.
2. **Stories/ELA override depth** — Phase 4 note: decide whether to fully rebuild story
   `.ws-card`s from JSON or only swap passage text + prompt. Recommend full rebuild for
   consistency, but verify the `data-save` keys stay stable so existing saved answers map.
3. **Rollout** — do `nabila-naviha` end-to-end first as the reference page; only then
   replicate the `interactive.js` wiring to the other 8.
```
