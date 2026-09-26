# Tutions

A small, student-friendly learning hub for tutoring students. Each student has
a stable page URL; shared browser modules provide the learning interactions.
The four-subject dashboard is currently a scaffold: Math, English, Social
Studies, and Science are marked **Coming soon** until the curriculum mapping is
provided.

## How it is arranged

```text
Browser
  ├── public/                 Static site and its published URL structure
  │   ├── index.html          Private learning-workspace landing page
  │   ├── login.html          Name + PIN sign-in and first-use PIN setup
  │   ├── about.html          Site purpose and school-use notes
  │   ├── privacy.html        Plain-language privacy policy
  │   ├── terms.html          Terms of use
  │   ├── <student>.html      Lightweight subject dashboards
  │   └── assets/             Shared JavaScript and CSS
  ├── functions/api/[[path]].js  Pages Function adapter for `/api/*`
  └── src/index.js               Shared Cloudflare Worker handler
                                  └── Cloudflare KV for auth, homework, and answers
```

Cloudflare Pages serves the static files from `public/` and routes `/api/*`
through the Pages Function adapter into `src/index.js`. AI provider keys,
admin credentials, and the signing key remain server-side secrets.

## Repository map

| Location | What belongs there |
| --- | --- |
| `public/` | Website files deployed as static assets; Pages exposes HTML pages at clean, extensionless routes. |
| `public/assets/js/` | Runtime dashboard, sign-in, tutor, and parent-dashboard modules. |
| `public/assets/css/` | Shared page styles. |
| `src/` | Cloudflare Worker API entry point. |
| `tests/` | Node.js tests for student identity, assignments, and math rendering. |
| `docs/curriculum-research/` | Curriculum references, research notes, and source documents. |
| `docs/architecture/` | Architecture and feature plans. |
| `docs/superpowers/` | Historical design specs and implementation plans. |
| `archive/` | Retired code retained for reference; not part of the deployed site. |
| `wrangler.toml` | Worker, static-asset, and KV configuration. |
| `graphify-out/` | Generated codebase map; not runtime application code. |

Student HTML files remain at the root of the *published site* (`public/`).
Cloudflare Pages serves them at clean routes such as `/nafis` and
`/salma-khadija?student=khadija`; requests to the old `.html` URLs redirect to
those routes.

The current student routes are intentionally small: each page requires a
server-issued student session, then loads the shared subject-dashboard module,
which renders Math, English, Social Studies, and Science cards. The former worksheet pages and their unused homework/quiz
modules are kept in `archive/legacy-pages/` and `archive/legacy-assets/` so they
are recoverable but are not uploaded to Pages.

Each student dashboard also has an **Assigned** tab. The parent panel’s
**Daily Assignments** tab uses one four-subject template (date, optional message,
title, instructions, and optional resource link) and stores records through
`/api/assignments/:student`. The browser keeps a local preview fallback, clearly
labeled as browser-only, if the API is temporarily unavailable.

The parent panel’s **Worksheet Builder** accepts a copy/paste template generated
by ChatGPT or another editor. Use `QUESTION 1:` / `ANSWER 1:` pairs (and continue
the numbering for as many questions as needed), then parse and publish. Math,
reading, and ELA worksheets render in the student’s Assigned tab with a Check
answers button. The answer key remains server-side; checks are recorded under the
student’s answer record.

## Develop and test

Requirements: Node.js 20 or newer and Wrangler for local Cloudflare development.

```sh
npm test
npx wrangler dev
```

Create a local `.dev.vars` file for secrets when exercising API features. Never
commit that file or real credentials. Tests run with Node's built-in test
runner; the project has no third-party npm dependencies.

## Current hosting

The public static site is deployed to Cloudflare Pages at
`https://learnflow.ihthos.dev`. Cloudflare Pages exposes the HTML files at clean
routes such as `/login`, `/about`, `/privacy`, `/terms`, and `/nafis`.

The Pages deployment now includes the API function. The existing API
implementation provides:

- `/api/auth/login` and `/api/auth/set-pin` — student first-use PIN setup and admin sign-in
- `/api/admin/students` and `/api/admin/students/:id/reset-pin` — authenticated staff directory and PIN reset
- `/api/chat` — student AI help
- `/api/homework/:student` — homework read/write
- `/api/answers/:student` — answer sync and parent review
- `/api/admin/*` — parent/admin login and content tools

Do not put API keys, passwords, or student PINs in `public/`; the login UI uses
the Worker/KV auth contract and intentionally does not contain a public student
roster. If the API is unavailable, the student UI reports that explicitly and
does not fall back to client-only authentication.

Production publishing follows the connected GitHub `main` branch. Commit and
push website changes to `origin main`; Cloudflare Pages publishes them to
`https://learnflow.ihthos.dev`. Verify the live page after the push. Use Wrangler
for local development or explicit infrastructure work, not routine publishing.

## Security notes

- Keep `.dev.vars`, API keys, passwords, and signing keys out of Git.
- Store production credentials as Cloudflare secrets, not in `public/`.
- The archived Pages chat handler is inactive; the live API entry point is
  `src/index.js`.
