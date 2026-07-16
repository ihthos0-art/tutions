# Week 3 Story-Quest Activity Redesign — Design

Date: 2026-07-16
Scope: Manha summer site (`~/tutions/summer-games.js`), Week 3 days `2-0`…`2-3` only.

## Problem
All 4 Week 3 days end with the same lame `mission` activity: a row of MCQ gates that light up panels, then a win banner. No visible character, no story progression, no variety. Student disengages.

## Goal
Replace only the final activity phase of each Week 3 day with a real interactive story-roleplay: a visible character walks a scene path, solving challenges (drawn from the existing engine pool — hangman, dragSort, fillBlank, scramble, match, wordSearch, labelDiagram, timeline, categorize, twoTruths, quizMC, crossword, cloze) to advance the story. Each day a different character/scene/niche. Forgiving (stumble + retry, no restart). Persists across refresh.

## Non-goals
- Do NOT change lessons, drills, or practice phases (any week).
- Do NOT change the other 28 days.
- Do NOT change `SG.SCHEDULE`, lock/unlock, streak/XP, persistence keys.
- Do NOT change `parent.html`, other student pages, or other engines' code.
- No external images — emoji + CSS/SVG only (matches existing illustration rule).

## Architecture: one flexible `storyQuest` engine

New phase kind `'quest'`. `renderMission` gains one branch:

```js
if (ph.kind === 'lesson')      renderLesson(ph);
else if (ph.kind === 'drill')   renderDrill(ph);
else if (ph.kind === 'practice')renderPractice(ph);
else if (ph.kind === 'activity')renderActivity(ph);
else if (ph.kind === 'quest')   renderQuest(ph);   // NEW
```

`renderQuest` is defined inside `renderMission`'s closure so it shares `state`, `persist()`, `ringOf()`, `nextPhase()`, `ctx`, `fbOk/fbNo`, the phase-track dots, and the back-nav. No new outer wiring.

### Quest data shape
```js
{
  kind: 'quest',
  subject: 'Mixed',          // shows on phase-track dot
  title: 'Light the Cave',
  char: '🦇',                  // emoji that walks
  scene: 'cave',               // CSS scene key
  intro: 'narration shown on entry',
  nodes: [
    { beat: 'narration on arrival at this node',
      challenge: { kind: 'hangman', word: 'MIRROR', hint: '...' },
      advance: 'narration after solving' },
    // ... 3 more nodes
  ],
  winText: '🎉 ...'
}
```

### Node flow
1. Character emoji stands at current path node. `beat` shown in a speech bubble.
2. Challenge engine renders below via `RENDERERS[node.challenge.kind]` (existing dispatcher — same engines already used by drills/practices/activities). Shares `ctx.setRing` + a per-node `onWin`.
3. On win → character walks (CSS transition) to next node, `advance` text shows, sound plays, next node loads. `ringOf(ni+1, nodes.length)`.
4. Wrong answer → handled by the challenge engine itself (hangman hearts, fillBlank shake, match/sort just don't match). Character does a stumble wobble. Retry until solved. No restart-from-zero.
5. Final node solved → win scene + confetti + `ctx.onWin()` marks day done.

### Persistence
`state.phases[pi] = { ni: <current node index> }` via existing `persist()`. Refresh resumes at current node. Back button returns to prior phase (existing navRow).

### Fallback
If `node.challenge.kind` not in `RENDERERS`, fall back to `quizMC` and log to console. No crash, no `undefined`.

### Scene rendering (CSS only)
`.sg-quest-stage` keyed by `scene`:
- `cave`: dark gradient + 💎🕯️ decorations
- `coast`: blue sea gradient + ⚓🌊
- `jungle`: green gradient + 🌴🌿 river
- `village`: night-village gradient + 🏠🌙

`.sg-quest-path` = row of node dots. `.sg-quest-char` = emoji absolutely positioned, `left` transitions between nodes (CSS `transition: left .5s`). `.sg-quest-bubble` = speech bubble above character for narration.

## The 4 Week 3 quests

### 2-0 "Light the Cave" — char 🦇, scene cave
Topics: 2-digit×2-digit multiplication + vision/light.
- n1 `hangman` guess MIRROR → find a mirror
- n2 `fillBlank` area-model multiplication sentence → power a crystal
- n3 `labelDiagram` label eye parts → read wall map
- n4 `dragSort` order light path (source→reflect→eye→see) → exit opens
- win: cave lit, exit found

### 2-1 "The Captain's Voyage" — char 🧭, scene coast
Topics: opinion writing + European explorers.
- n1 `twoTruths` spot false explorer fact (Verrazano/Hudson/Champlain)
- n2 `categorize` sort motives Dutch vs French
- n3 `fillBlank` build a claim (claim + because + reason) → convince crew
- n4 `dragSort` order voyage steps → anchor down
- win: coast charted

### 2-2 "Monkey Bridge" — char 🐵, scene jungle river
Topics: division with remainders + linking words.
- n1 `hangman` guess REMAINDER → find a plank
- n2 `fillBlank` division sentence as word-blocks monkey places to cross (17 ÷ 4 = 4 r1, share bananas)
- n3 `scramble` rebuild sentence with linking words (first/then/finally)
- n4 `match` linking word → purpose (first=order, because=cause)
- win: monkey crosses bridge

### 2-3 "Mirror Signal" — char 🕵️, scene village at night
Topics: light reflection/eye + New Netherland→New York.
- n1 `quizMC` reflection science (angle in = angle out)
- n2 `labelDiagram` label eye parts → build periscope
- n3 `timeline` order New Netherland → English takeover → renamed NY
- n4 `dragSort` arrange mirror angles to send harbor signal
- win: flag swapped, colony renamed

Each quest = 4 nodes, 4 distinct engines, no two days repeat the same engine lineup.

## Integration — iron rules

**Only the last phase (activity) of days 2-0…2-3 changes.** Concretely: in each of those 4 days' `phases` arrays, the final `{kind:'activity', title, stages:[…]}` becomes `{kind:'quest', …}` with `nodes`. Nothing else in those arrays is touched.

### Files touched (3 only)
1. `summer-games.js`
   - Add `renderQuest` (~120 lines) inside `renderMission`.
   - Add the one `else if (ph.kind === 'quest')` branch.
   - Replace 4 days' last phase content (`2-0`…`2-3`) with quest nodes.
   - Add `'quest'` → icon in `phaseIcon` (🎯 or 🧭).
2. `summer-games.css`
   - Add `.sg-quest-stage`, `.sg-quest-path`, `.sg-quest-node`, `.sg-quest-char`, `.sg-quest-bubble`, scene variants, walk + stumble keyframes. Scoped — no overlap with existing classes.
3. `manha.html`
   - Bump cache `?v=18` → `?v=19`.

### Untouched (iron-clad)
- All 28 other days (Weeks 1, 2, 4–8).
- All Week 3 lessons, drills, practices.
- `SG.SCHEDULE`, `priorDone`/lock/unlock, streak, XP, all storage keys.
- `parent.html` answer key. (Quest challenges use existing engine shapes that the parent key already renders. Will verify no new `undefined` path.)
- Other student pages (`ayan.html`, `salma.html`, `khadija.html`, `taha.html` — do not load `summer-games.js`).
- Code of all existing RENDERERS (hangman, dragSort, fillBlank, scramble, match, wordSearch, labelDiagram, timeline, categorize, twoTruths, quizMC, crossword, cloze). Reused as-is.

## Verification
- `node -c summer-games.js` passes.
- Playwright smoke per day (2-0…2-3): open card → advance to quest phase (set `state.pi` to last phase index) → character renders at node 0 → solve node-1 challenge via JS-click → character advances → no literal `undefined` in card DOM → reach win.
- Confirm Back button returns to prior phase; refresh resumes at current node.
- Confirm parent answer key for 2-0…2-3 still shows no `undefined` (quest challenges reuse existing engine shapes).
- Sync `~/ihthos0-art/tutions/`, bump `?v=19`, commit, push. User reviews on GitHub Pages (no local preview, no screenshots — per `feedback_no_screenshots`).

## Rollback
Single commit revert restores the 4 `activity` phases + removes the branch + `renderQuest`. CSS classes inert if unused.