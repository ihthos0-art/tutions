# Grade 4 Summer — Interactive Learning Page (Design Spec)

**Date:** 2026-06-27
**Target file:** `manha.html` (Grade 4 Summer tab) + new `summer-games.js`, `summer-games.css`
**Student:** Manha (age 8-10), rising Grade 4, Brooklyn NYC
**Constraints:** vanilla HTML/CSS/JS, no build step, Cloudflare Workers static site. Touch + mouse universal. No commit/push until user approves.

## 1. Goal

Transform the existing "Grade 4 Summer" tab from a static checkbox schedule into a fun, interactive learning page: **one unique-feeling game per day, tied to that day's actual learning topics**, with scroll/click/swipe animations, confetti, sound, a mascot, and progress rewards.

## 2. Locked Decisions

- **Device:** Universal — touch + mouse. Use Pointer Events, not HTML5 drag-and-drop.
- **Integration depth:** Replace existing day cards with game cards. Game completion = day done (feeds existing progress counter).
- **Variety:** Rotate 8 game engines across 32 days; each day's *content* (words/facts/questions) is unique and matches that day's subjects. All 8 engines cycle through each week.
- **Wrong answers:** No red X. Growth-mindset 🌱💪 feedback (age 8-10 rule).

## 3. Architecture

### 3.1 Files

- **`summer-games.js` (new)** — single module, data-driven.
  - `GAMES["w-d"] = { type, subject, title, content }` — 32 entries, one per scheduled day.
  - 8 renderer functions, one per game type. Each signature: `renderTYPE(container, data, onWin)`.
  - `pointerDnD` helper (pointerdown/move/up) replacing HTML5 DnD for scratch, drag-sort, word-search drag, memory-match.
  - Gamification: `confetti()`, `sound.play(name)`, `progressRing()`, `mascot.setMood()`, `streaks`.
- **`summer-games.css` (new)** — game styles + animations (scroll-reveal, stagger, scroll-snap, mascot, ring).
- **`manha.html`** — replace inline summer IIFE's `renderSchedule()` to emit game cards. Keep week nav, overall progress bar, reset button, existing localStorage keys.

### 3.2 Data flow

```
SCHEDULE[w][d] (existing: subjects + topics + bullets)
   └─> GAMES["w-d"] authored from SCHEDULE + vocab lists (summer-prep-plan.md §4)
         └─> renderGameCard(dayKey) builds card → mounts renderer into container
               └─> onWin() → mark done (localStorage manha:summer-game-done:w-d)
                     └─> updateProgress() (existing: X / 32 days) + confetti + sound + mascot + ring
```

Existing localStorage keys preserved:
- `manha:summer-progress` — per-subject completion (kept; now set by game win, not checkbox)
- New: `manha:summer-game-done:w-d` — per-day game win flag
- New: `manha:summer-streak` — consecutive-day completion streak

## 4. The 8 Game Engines

All Pointer-Events based (work on finger + mouse). Content swappable via `content` field.

| # | Engine | Mechanic | Best subject fit |
|---|--------|----------|------------------|
| 1 | **Scratch/Reveal** | Canvas destination-out; finger/mouse wipes to uncover a hidden fact | Science (uncover a fact), vocab reveals |
| 2 | **Word Search** | Grid of letters; pointer-drag selects letters; find vocab terms | Any subject vocab |
| 3 | **Match Pairs** | Click a left item then its right pair; correct = lock | term↔definition (any) |
| 4 | **Drag-Sort Sequence** | pointerDnD reorders items into correct order | SS timelines, math procedure steps |
| 5 | **Flip Cards** | 3D flip (preserve-3d) reveals fact | Science/social fact discovery |
| 6 | **Hangman** | Click letter buttons; guess the vocab word | ELA vocab, Greek/Latin roots |
| 7 | **Fill-in-Blank** | Word bank; click word → drops into sentence blank | ELA sentences, math number-sentences |
| 8 | **T/F + Multiple Choice** | Click answer; instant feedback | Quick check, any subject |

Per-week assignment: each of the 8 types appears once across the week's days; type chosen to fit the day's subjects (e.g., SS day → drag-sort timeline; ELA vocab day → hangman). Authoring table in §6.

## 5. Gamification Layer (shared, all games)

- **Confetti** on win — zero-dep canvas-confetti (or inline canvas burst).
- **Web Audio** beeps via `OscillatorNode`: correct (C-E-G arpeggio), wrong (soft low sawtooth), level-up (5-note fanfare), click. Resume-on-first-gesture (AudioContext resume on pointerdown).
- **Progress ring** per day (SVG stroke-dasharray, 3 states) + keep overall progress bar.
- **Mascot** — inline SVG (owl), mood classes (idle/happy/celebrate/think) in page corner; reacts on win/wrong.
- **Streaks** — consecutive-day completion counter in localStorage; drives DAU.
- **No red X** — wrong = 🌱 "try again" / 💪 "almost", varied praise array (cubic-bezier pop).
- **Win timing** (kid-ux): sound (<50ms) → praise+mascot (~100ms) → XP/streak (~200ms) → confetti on milestone.
- **`prefers-reduced-motion`** — disable confetti motion, instant reveals.

## 6. Animations Throughout

- **IntersectionObserver** scroll-reveal on game cards (translateY + opacity).
- **CSS scroll-snap** on weeks container — swipe moves between weeks (no JS).
- **Day-card entrance stagger** via `--i` CSS var.
- **Count-up** XP with rAF easeOutQuad.
- **Ripple** on tappable targets (fixed getBoundingClientRect version).

## 7. Per-Day Game Assignment (32 days)

Type chosen to fit day's subjects. Content authored from `summer-prep-plan.md` (weeks 1-8) + vocab lists (§4 of plan).

| Wk | D1 (Math+Sci) | D2 (ELA+SS) | D3 (Math+ELA) | D4 (Sci+SS) |
|----|---------------|-------------|---------------|-------------|
| 1 | Scratch (energy forms) | Word Search (NYS geo vocab) | Fill-blank (multiplicative compare) | Flip Cards (energy transfers) |
| 2 | Match (add/sub alg terms) | Drag-Sort (Haudenosaunee life) | T/F+MC (paragraph structure) | Scratch (energy conversion device) |
| 3 | Fill-blank (2×2 multiply) | Hangman (explorer names) | T/F+MC (division remainders) | Match (light/vision terms) |
| 4 | Drag-Sort (fraction equivalence steps) | Match (colonial life terms) | Word Search (Greek/Latin roots) | T/F+MC (animal senses) |
| 5 | Fill-blank (add fractions) | Hangman (simile/metaphor words) | Match (mixed number terms) | Scratch (rock layers/fossils) |
| 6 | Match (decimal terms) | Hangman (idioms/proverbs) | Drag-Sort (measurement conversion) | Flip Cards (natural hazards) |
| 7 | Drag-Sort (angle measure steps) | Match (primary/secondary source) | Word Search (research vocab) | T/F+MC (waves/amplitude) |
| 8 | T/F+MC (multi-step review) | Fill-blank (informative article) | Hangman (mixed skills vocab) | Match (famous New Yorkers) |

(Content arrays per day authored in §8 build step from the curriculum research files.)

## 8. Build Order

1. `summer-games.css` — layout, game card, animations, mascot, ring, scroll-snap, reduced-motion.
2. `summer-games.js` — `pointerDnD` helper; 8 renderers; gamification (confetti, sound, ring, mascot, streak); `renderGameCard(dayKey)`; `GAMES` data object shell.
3. `manha.html` — link new css/js; replace inline `renderSchedule()` with game-card rendering; wire onWin → existing progress; keep week nav + reset.
4. Author 32 days of `GAMES` content (terms, facts, questions, sentences) from curriculum research + vocab.
5. Verify both repo copies in sync (`cp` + `diff -q`).

## 9. Scope Guards

- Do NOT touch Assigned / Math Practice / ELA Practice tabs.
- Keep existing localStorage keys working (`manha:summer-progress`).
- No commit/push until user explicitly approves.
- Keep both repo copies in sync: `/home/ihthos/tutions/` and `/home/ihthos/ihthos0-art/tutions/`.

## 10. Testing

- Manual: each game type win/lose path on desktop + touch (DevTools device mode).
- Progress: complete a day → overall counter increments; reset clears games too.
- Reduced-motion: verify confetti/motion disabled.
- Audio: verify resume-on-gesture (autoplay policy).

## 11. Sources (research reports)

- `curriculum-research/interactive-activities.md` — 10 activity types with vanilla JS code.
- `curriculum-research/animations.md` — scroll-reveal, scroll-snap, ripple, count-up, CDN libs.
- `curriculum-research/kid-ux-gamification.md` — confetti, Web Audio, ring, mascot, feedback timing.
- `curriculum-research/summer-prep-plan.md` — 8-week schedule + vocab lists.
- `curriculum-research/grade4-*.md` — subject standards.