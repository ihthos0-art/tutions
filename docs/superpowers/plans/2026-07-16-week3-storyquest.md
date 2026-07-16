# Week 3 Story-Quest Activities Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the final activity phase of each Week 3 day (`2-0`…`2-3`) on the Manha summer site with a story-roleplay quest: a visible emoji character walks a CSS scene path, solving challenges drawn from the existing engine pool to advance the story.

**Architecture:** One new `renderQuest` renderer added inside the existing `renderMission` closure (shares state/persist/ring/ctx). New phase kind `'quest'`. Each quest = 4 nodes; each node's challenge reuses an existing RENDERER (hangman, fillBlank, match, scramble, dragSort, timeline, categorize, twoTruths, labelDiagram, quizMC) — zero changes to those engines. CSS-only scenes (emoji + gradients, no images). Forgiving: a node never advances until its challenge's `onWin` fires, so wrong answers just let the kid retry.

**Tech Stack:** Vanilla JS, static site, no build. Playwright (python) for smoke verification. `node -c` syntax gate.

## Global Constraints (iron rules — from spec)

- **ONLY the last activity phase of days `2-0`, `2-1`, `2-2`, `2-3` changes.** Each becomes `{kind:'quest', …}` with `nodes`. Nothing else in those phases arrays is touched.
- Do NOT change any lesson, drill, or practice phase (any week).
- Do NOT change the other 28 days (Weeks 1, 2, 4–8).
- Do NOT change `SG.SCHEDULE`, `priorDone`/lock/unlock, streak, XP, any storage key.
- Do NOT change `parent.html`, `ayan.html`, `salma.html`, `khadija.html`, `taha.html`.
- Do NOT change the code of any existing RENDERER (hangman, dragSort, fillBlank, scramble, match, wordSearch, labelDiagram, timeline, categorize, twoTruths, quizMC, crossword, cloze, etc.). Reused as-is.
- No external images — emoji + CSS/SVG only.
- After every task: `node -c /home/ihthos/tutions/summer-games.js` must pass before commit.
- Keep both repo copies in parity: after the final task, sync `~/ihthos0-art/tutions/`.
- Per user memory: no screenshot tools for verification — use Playwright DOM assertions only.

## File Structure

- `summer-games.js` — add `renderQuest` inside `renderMission`; add one `else if (ph.kind==='quest')` branch in `renderPhase`; add `quest:'🧭'` to `phaseIcon`; replace 4 days' last phase object with quest content.
- `summer-games.css` — append `.sg-quest-*` classes (stage, scene variants, path, nodes, character, bubble, host). Scoped, no overlap.
- `manha.html` — bump cache `?v=18` → `?v=19` (final task only).
- `docs/superpowers/specs/2026-07-16-week3-storyquest-design.md` — already committed, source of truth.

## Verification harness (reused every task)

Save once at Task 1, reused by Tasks 1–4. Path: `/tmp/quest_smoke.py`. It opens a day card, jumps straight to the last phase (the quest) via `pi:99` clamp, and asserts: no literal `undefined` in card DOM, character emoji present, path nodes present, and the node-1 challenge engine rendered a signature element. Per-day expected signatures are listed in each task.

---

### Task 1: Add `renderQuest` engine + branch + phaseIcon + CSS + wire first quest (2-2 Monkey Bridge)

**Files:**
- Modify: `summer-games.js` — add `renderQuest` inside `renderMission`; add branch in `renderPhase`; add `quest` to `phaseIcon`; replace `2-2` last phase (activity at line ~2991) with the Monkey Bridge quest.
- Modify: `summer-games.css` — append quest CSS.
- Create: `/tmp/quest_smoke.py` — verification harness.

**Interfaces:**
- Consumes (from existing renderMission closure): `el`, `esc`, `state`, `pi`, `persist`, `ringOf`, `ctx`, `sound`, `SG.mascot`, `SG.confetti`, `SG.speak`, `RENDERERS`, `scene`. All already in scope.
- Produces: `renderQuest(ph)` function + the `'quest'` phase kind. Later tasks rely on these existing unchanged — they only edit GAMES content.

- [ ] **Step 1: Add `renderQuest` inside `renderMission`.**

In `summer-games.js`, find the line `    // ---------- phase driver ----------` (just above `function renderPhase()`). Insert this block immediately **before** it:

```js
    // ---------- quest engine (visible character walks a scene path; each node = one existing engine) ----------
    function renderQuest(ph) {
      var nodes = ph.nodes || [];
      var qstate = state.phases[pi] || {};
      var ni = Math.min(qstate.ni || 0, Math.max(0, nodes.length - 1));
      function saveQuest() { state.phases[pi] = { ni: ni }; persist(); }
      scene.innerHTML = '';
      scene.appendChild(el('div', 'sg-phase-label', esc(ph.subject || 'Quest') + ' · Quest — ' + esc(ph.title)));
      if (ph.intro) scene.appendChild(el('div', 'sg-mis-intro', esc(ph.intro)));

      var stage = el('div', 'sg-quest-stage scene-' + (ph.scene || 'cave'));
      var path = el('div', 'sg-quest-path');
      nodes.forEach(function (n, i) {
        var node = el('div', 'sg-quest-node' + (i < ni ? ' done' : (i === ni ? ' cur' : ' lock')));
        node.innerHTML = '<span class="sg-qnode-ic">' + (i < ni ? '✓' : (i + 1)) + '</span>';
        path.appendChild(node);
      });
      stage.appendChild(path);

      var charEl = el('div', 'sg-quest-char', ph.char || '🦸');
      function placeChar(at) { var pct = nodes.length ? ((at + 0.5) / nodes.length) * 100 : 50; charEl.style.left = pct + '%'; }
      placeChar(ni);
      stage.appendChild(charEl);

      var bubble = el('div', 'sg-quest-bubble');
      stage.appendChild(bubble);
      scene.appendChild(stage);
      var host = el('div', 'sg-quest-host'); scene.appendChild(host);

      function showBeat(t) { bubble.innerHTML = '<span class="sg-quest-bub-txt">' + esc(t || '') + '</span>'; }
      function refreshPath() {
        Array.prototype.forEach.call(path.children, function (node, i) {
          node.className = 'sg-quest-node' + (i < ni ? ' done' : (i === ni ? ' cur' : ' lock'));
          node.querySelector('.sg-qnode-ic').textContent = i < ni ? '✓' : (i + 1);
        });
      }

      function nodeWin() {
        var n = nodes[ni];
        if (n && n.advance) showBeat(n.advance);
        ni++; saveQuest(); refreshPath(); placeChar(ni);
        if (ni - 1 >= 0 && path.children[ni - 1]) { path.children[ni - 1].className = 'sg-quest-node done'; path.children[ni - 1].querySelector('.sg-qnode-ic').textContent = '✓'; }
        sound.play('correct'); if (SG.mascot) SG.mascot.setMood('happy');
        setTimeout(function () { if (ni >= nodes.length) questWin(); else renderNode(); }, 750);
      }

      function renderNode() {
        if (ni >= nodes.length) { questWin(); return; }
        refreshPath(); placeChar(ni);
        var n = nodes[ni];
        showBeat(n.beat || '');
        host.innerHTML = ''; if (SG.speak) SG.speak.stop();
        ringOf(ni, nodes.length);
        var kind = n.challenge && n.challenge.kind;
        var r = RENDERERS[kind];
        if (!r) { console.warn('quest: unknown engine', kind); kind = 'quizMC'; r = RENDERERS.quizMC; n.challenge = { kind: 'quizMC', questions: [{ prompt: 'Continue?', options: ['OK'], a: 0 }] }; }
        r(host, n.challenge, { setRing: function (p) { ringOf(ni + p / 100, nodes.length); }, onWin: nodeWin });
      }

      function questWin() {
        ringOf(1, 1); refreshPath(); placeChar(nodes.length - 1);
        Array.prototype.forEach.call(path.children, function (node) { node.className = 'sg-quest-node done'; node.querySelector('.sg-qnode-ic').textContent = '✓'; });
        host.innerHTML = '<div class="sg-mis-win">' + esc(ph.winText || '🎉 Quest complete! Day done.') + '</div>';
        bubble.textContent = '';
        if (SG.mascot) SG.mascot.setMood('happy');
        if (SG.confetti) SG.confetti({ count: 60 });
        ctx.onWin();
      }

      if (ni >= nodes.length) { questWin(); return; }
      renderNode();
    }

```

- [ ] **Step 2: Add the `quest` branch in `renderPhase`.**

Find the `renderPhase` function (the `// ---------- phase driver ----------` block). Its body is:

```js
    function renderPhase() {
      var ph = phases[pi];
      if (SG.speak) SG.speak.stop();
      navRow.style.visibility = pi > 0 ? 'visible' : 'hidden';
      if (pi > 0) backBtn.textContent = '‹ Back to ' + labelForPrev(phases, pi);
      if (ph.kind === 'lesson') renderLesson(ph);
      else if (ph.kind === 'drill') renderDrill(ph);
      else if (ph.kind === 'practice') renderPractice(ph);
      else if (ph.kind === 'activity') renderActivity(ph);
    }
```

Replace the last `else if` line with two branches:

```js
      if (ph.kind === 'lesson') renderLesson(ph);
      else if (ph.kind === 'drill') renderDrill(ph);
      else if (ph.kind === 'practice') renderPractice(ph);
      else if (ph.kind === 'activity') renderActivity(ph);
      else if (ph.kind === 'quest') renderQuest(ph);
```

- [ ] **Step 3: Add `quest` icon to `phaseIcon`.**

Find `function phaseIcon(kind) { return { lesson: '📖', drill: '✏️', practice: '🔄', activity: '🎯' }[kind] || '•'; }` and replace with:

```js
  function phaseIcon(kind) { return { lesson: '📖', drill: '✏️', practice: '🔄', activity: '🎯', quest: '🧭' }[kind] || '•'; }
```

- [ ] **Step 4: Append quest CSS to `summer-games.css`.**

Append at end of file:

```css

/* ===== STORY QUEST (Week 3 activities) ===== */
.sg-quest-stage { position: relative; height: 180px; border-radius: 18px; overflow: hidden; margin: 12px 0; border: 2px solid #e8c9d0; }
.sg-quest-stage.scene-cave    { background: linear-gradient(180deg,#2a2350,#3c2f5a 60%,#1d1830); }
.sg-quest-stage.scene-coast   { background: linear-gradient(180deg,#bfe3f2,#6fbfd9 60%,#3d7a96); }
.sg-quest-stage.scene-jungle  { background: linear-gradient(180deg,#cfeec3,#8fc97a 60%,#5b9a4e); }
.sg-quest-stage.scene-village { background: linear-gradient(180deg,#243b5a,#34506f 60%,#1c2a44); }
.sg-quest-path { position: absolute; left: 0; right: 0; bottom: 22px; display: flex; justify-content: space-around; align-items: center; padding: 0 8%; }
.sg-quest-node { width: 34px; height: 34px; border-radius: 50%; background: rgba(255,255,255,.25); border: 2px solid rgba(255,255,255,.5); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 14px; }
.sg-quest-node.cur  { background: #ffd166; color: #333; border-color: #f4a300; box-shadow: 0 0 12px #ffd166; transform: scale(1.12); }
.sg-quest-node.done { background: #5bbf8a; border-color: #3f9a6a; color: #fff; }
.sg-quest-node.lock { opacity: .6; }
.sg-quest-char  { position: absolute; bottom: 18px; font-size: 44px; transform: translateX(-50%); transition: left .6s ease; z-index: 2; line-height: 1; }
.sg-quest-bubble { position: absolute; left: 50%; top: 14px; transform: translateX(-50%); max-width: 82%; background: #fff; color: #333; border: 1px solid #e8c9d0; border-radius: 14px; padding: 8px 12px; font-size: 14px; line-height: 1.3; box-shadow: 0 2px 8px rgba(0,0,0,.1); min-height: 18px; }
.sg-quest-bub-txt { display: block; }
.sg-quest-host { min-height: 80px; }
.sg-quest-host > div { margin-top: 8px; }
```

- [ ] **Step 5: Replace `2-2` activity phase with the Monkey Bridge quest.**

In `summer-games.js`, the `2-2` game's **last phase** is the `{ 'kind': 'activity', 'title': 'Split the Load', 'stages': [ ... ] }` object (starts ~line 2991, ends at the `}` just before the `]` that closes `phases`, ~line 3085). Replace that entire object with this quest object (keep the surrounding `phases` array braces intact):

```js
          {
            'kind': 'quest',
            'subject': 'Quest',
            'title': 'Monkey Bridge',
            'char': '🐵',
            'scene': 'jungle',
            'intro': 'A monkey wants to cross the river, but the bridge is missing planks. Solve each challenge to build a plank and help her across.',
            'winText': '🎉 Bridge built — the monkey swings across!',
            'nodes': [
              {
                'beat': 'Dark river ahead! A plank hides the word for "what is left over." Guess it.',
                'challenge': { 'kind': 'hangman', 'word': 'REMAINDER', 'hint': 'What is left when 17 is split into groups of 4' },
                'advance': 'A plank appears labeled REMAINDER!'
              },
              {
                'beat': 'The monkey uses banana-words as planks. Fill the blanks so she can step across.',
                'challenge': { 'kind': 'fillBlank', 'sentence': 'Share 17 bananas among 4 monkeys. Each gets * bananas, and the * is 1. Check: 4 × 4 + * = 17.', 'blanks': ['4', 'remainder', '1'] },
                'advance': 'Bananas split fair — the monkey steps forward!'
              },
              {
                'beat': 'A logbook plank needs a clean first sentence. Rebuild it.',
                'challenge': { 'kind': 'scramble', 'words': ['First', 'we', 'packed', 'our', 'bags'] },
                'advance': 'Logbook entry done — next plank!'
              },
              {
                'beat': 'Final plank: match each linking word to its job.',
                'challenge': { 'kind': 'match', 'pairs': [['First', 'shows order'], ['Because', 'shows cause'], ['However', 'shows contrast'], ['Also', 'adds more']] },
                'advance': 'Bridge complete — the monkey crosses!'
              }
            ]
          }
```

- [ ] **Step 6: Syntax gate.**

Run: `node -c /home/ihthos/tutions/summer-games.js`
Expected: no output (exit 0). If error, fix before continuing.

- [ ] **Step 7: Write the verification harness `/tmp/quest_smoke.py`.**

```python
import asyncio, sys
from playwright.async_api import async_playwright

URL = 'file:///home/ihthos/tutions/manha.html'

async def main():
    day = sys.argv[1]            # e.g. '2-2'
    sig = sys.argv[2]            # CSS selector expected in node-1 challenge, e.g. '.sg-hang-kb'
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True)
        page = await b.new_page(viewport={'width':1280,'height':900})
        await page.goto(URL)
        await page.wait_for_timeout(2500)
        await page.evaluate("""(day) => {
          localStorage.removeItem('manha:summer-state');
          var done={}; for(var w=0;w<8;w++) for(var d=0;d<4;d++) done[w+'-'+d]=true;
          localStorage.setItem('manha:summer-game-done', JSON.stringify(done));
          // pi:99 clamps to last phase (the quest); empty phases[] -> ni=0
          var s={}; s[day]={'pi':99,'phases':[]};
          localStorage.setItem('manha:summer-state', JSON.stringify(s));
          location.reload();
        }""", day)
        await page.wait_for_timeout(3000)
        html = await page.eval_on_selector(".day-game-card[data-day='"+day+"']", "el => el.innerHTML")
        low = html.lower()
        ok = True
        if 'undefined' in low:
            i = low.find('undefined'); print('FAIL undefined:', html[max(0,i-100):i+120]); ok=False
        if 'sg-quest-char' not in html:  print('FAIL: no character'); ok=False
        if html.count('sg-quest-node') < 4: print('FAIL: <4 nodes, got', html.count('sg-quest-node')); ok=False
        if sig and sig not in html: print('FAIL: node-1 signature', sig, 'missing'); ok=False
        print('OK' if ok else 'FAIL', 'for day', day)
        await b.close()
        sys.exit(0 if ok else 1)

asyncio.run(main())
```

- [ ] **Step 8: Run smoke for 2-2 (node-1 = hangman → signature `.sg-hang-kb`).**

Run: `python3 /tmp/quest_smoke.py 2-2 .sg-hang-kb`
Expected: `OK for day 2-2`

- [ ] **Step 9: Commit.**

```bash
git -C /home/ihthos/tutions add summer-games.js summer-games.css
git -C /home/ihthos/tutions commit -m "manha: add storyQuest engine + Monkey Bridge quest (2-2)

New renderQuest renderer inside renderMission; new 'quest' phase kind.
Character walks a CSS scene path; each node reuses an existing engine
(hangman/fillBlank/scramble/match). First quest: 2-2 Monkey Bridge.
Iron rule: only last activity phase of Week 3 days changes."
```

---

### Task 2: Wire 2-0 "Light the Cave" quest

**Files:**
- Modify: `summer-games.js` — replace `2-0` last phase (activity at line ~2490) with the Light the Cave quest.

**Interfaces:** Consumes `renderQuest` + `'quest'` kind from Task 1. No new interfaces.

- [ ] **Step 1: Replace the `2-0` activity phase.**

The `2-0` game's last phase is `{ 'kind': 'activity', 'title': 'See the Light', 'stages': [ ... ] }` (~line 2490 to its closing `}` before the `phases` array `]`). Replace that entire object with:

```js
          {
            'kind': 'quest',
            'subject': 'Quest',
            'title': 'Light the Cave',
            'char': '🦇',
            'scene': 'cave',
            'intro': 'A bat is lost in a dark cave. Solve each challenge to light the way and find the exit.',
            'winText': '🎉 Cave lit and exit found — the bat flies free!',
            'nodes': [
              {
                'beat': 'So dark! A shiny surface on the wall could help. Guess what it is.',
                'challenge': { 'kind': 'hangman', 'word': 'MIRROR', 'hint': 'It reflects light so you can see around a corner' },
                'advance': 'A mirror! The bat grabs it and light bounces off.'
              },
              {
                'beat': 'A crystal needs the right energy to glow. Fill the missing parts of the area model.',
                'challenge': { 'kind': 'fillBlank', 'sentence': 'To multiply 24 × 13, split 24 into 20 + * and 13 into 10 + *. The four partial products add to 312.', 'blanks': ['4', '3'] },
                'advance': 'Crystal glows! The cave lights up ahead.'
              },
              {
                'beat': 'An old map is carved on the wall. It shows only if you label the eye parts that read it.',
                'challenge': { 'kind': 'labelDiagram', 'slots': [{ 'hint': 'front clear window' }, { 'hint': 'bends light to focus' }, { 'hint': 'back screen that senses light' }], 'labels': [{ 'label': 'Cornea', 'slot': 0 }, { 'label': 'Lens', 'slot': 1 }, { 'label': 'Retina', 'slot': 2 }] },
                'advance': 'Now the bat can read the map — the exit is marked!'
              },
              {
                'beat': 'To reach the exit, put the light path in order from torch to brain.',
                'challenge': { 'kind': 'dragSort', 'items': [{ 'text': 'Light leaves the source', 'order': 0 }, { 'text': 'Light hits the mirror', 'order': 1 }, { 'text': 'Light reflects to the eye', 'order': 2 }, { 'text': 'The brain sees the image', 'order': 3 }] },
                'advance': 'Path clear! The bat follows the light out.'
              }
            ]
          }
```

- [ ] **Step 2: Syntax gate.**

Run: `node -c /home/ihthos/tutions/summer-games.js`
Expected: exit 0.

- [ ] **Step 3: Smoke (node-1 = hangman → `.sg-hang-kb`).**

Run: `python3 /tmp/quest_smoke.py 2-0 .sg-hang-kb`
Expected: `OK for day 2-0`

- [ ] **Step 4: Commit.**

```bash
git -C /home/ihthos/tutions add summer-games.js
git -C /home/ihthos/tutions commit -m "manha: 2-0 Light the Cave storyQuest (cave/bat)"
```

---

### Task 3: Wire 2-1 "The Captain's Voyage" quest

**Files:**
- Modify: `summer-games.js` — replace `2-1` last phase (activity at line ~2710) with the Captain's Voyage quest.

- [ ] **Step 1: Replace the `2-1` activity phase.**

The `2-1` game's last phase is `{ 'kind': 'activity', 'title': 'Chart the Coast', 'stages': [ ... ] }` (~line 2710 to its closing `}`). Replace with:

```js
          {
            'kind': 'quest',
            'subject': 'Quest',
            'title': "The Captain's Voyage",
            'char': '🧭',
            'scene': 'coast',
            'intro': 'A captain must convince the crew and chart the coast. Solve each challenge to sail the ship forward.',
            'winText': '🎉 Claim made and coast charted — anchor down!',
            'nodes': [
              {
                'beat': 'A stranger on the dock tells tales of who sailed here. One is a lie — spot it.',
                'challenge': { 'kind': 'twoTruths', 'statements': [{ 't': 'Verrazano sailed for France', 'a': true }, { 't': 'Henry Hudson found a big river in NY', 'a': true }, { 't': 'Explorers came to NY for gold alone', 'a': false }] },
                'advance': 'Crew believes you — the ship can sail.'
              },
              {
                'beat': 'Two flags fly on the dock. Sort each goal by the country that held it.',
                'challenge': { 'kind': 'categorize', 'bins': ['Dutch goals', 'French goals'], 'items': [{ 'text': 'Fur trading wealth', 'bin': 0 }, { 'text': 'Find Northwest Passage', 'bin': 1 }, { 'text': 'Build New Netherland colony', 'bin': 0 }, { 'text': 'Trade with Native peoples', 'bin': 1 }] },
                'advance': 'Cargo loaded right — the voyage can begin.'
              },
              {
                'beat': 'The crew will not sail without a strong reason. Build your claim.',
                'challenge': { 'kind': 'fillBlank', 'sentence': 'A strong opinion needs a clear claim: * is the best explorer because *.', 'blanks': ['Hudson', 'he explored a river we still use'] },
                'advance': 'The crew cheers your claim — anchor up!'
              },
              {
                'beat': 'Plot the voyage in order so the captain knows the plan.',
                'challenge': { 'kind': 'dragSort', 'items': [{ 'text': 'Explorer gets a goal from a king', 'order': 0 }, { 'text': 'Ship crosses the ocean', 'order': 1 }, { 'text': 'Explorer meets Native peoples', 'order': 2 }, { 'text': 'Explorer maps the coast', 'order': 3 }] },
                'advance': 'Course set — the coast is charted!'
              }
            ]
          }
```

- [ ] **Step 2: Syntax gate.**

Run: `node -c /home/ihthos/tutions/summer-games.js`
Expected: exit 0.

- [ ] **Step 3: Smoke (node-1 = twoTruths → `.sg-ttl-grid`).**

Run: `python3 /tmp/quest_smoke.py 2-1 .sg-ttl-grid`
Expected: `OK for day 2-1`

- [ ] **Step 4: Commit.**

```bash
git -C /home/ihthos/tutions add summer-games.js
git -C /home/ihthos/tutions commit -m "manha: 2-1 The Captain's Voyage storyQuest (coast/captain)"
```

---

### Task 4: Wire 2-3 "Mirror Signal" quest

**Files:**
- Modify: `summer-games.js` — replace `2-3` last phase (activity at line ~3228) with the Mirror Signal quest.

- [ ] **Step 1: Replace the `2-3` activity phase.**

The `2-3` game's last phase is `{ 'kind': 'activity', 'title': 'Colony Swap', 'stages': [ ... ] }` (~line 3228 to its closing `}`). Replace with:

```js
          {
            'kind': 'quest',
            'subject': 'Quest',
            'title': 'Mirror Signal',
            'char': '🕵️',
            'scene': 'village',
            'intro': 'A spy must send a signal across the harbor and swap the colony flag. Solve each challenge to build the signal.',
            'winText': '🎉 Reflection traced and colony renamed — flag swapped!',
            'nodes': [
              {
                'beat': 'To send a signal, the spy must know how light bounces.',
                'challenge': { 'kind': 'quizMC', 'questions': [{ 'prompt': 'A light beam hits a mirror at 30°. At what angle does it bounce off?', 'options': ['30°', '60°', '0°', '90°'], 'a': 0 }] },
                'advance': 'Angle matched — signal ready!'
              },
              {
                'beat': 'Build a periscope: label the eye parts it copies.',
                'challenge': { 'kind': 'labelDiagram', 'slots': [{ 'hint': 'front clear window' }, { 'hint': 'bends light to focus' }, { 'hint': 'back screen that senses light' }], 'labels': [{ 'label': 'Cornea', 'slot': 0 }, { 'label': 'Lens', 'slot': 1 }, { 'label': 'Retina', 'slot': 2 }] },
                'advance': 'Periscope assembled — the spy can see over the wall!'
              },
              {
                'beat': 'Place the colony story in time order.',
                'challenge': { 'kind': 'timeline', 'eras': ['Dutch rule', 'English takeover', 'New York'], 'events': [{ 'text': 'Dutch found New Netherland', 'era': 0 }, { 'text': 'English take the colony', 'era': 1 }, { 'text': 'Colony renamed New York', 'era': 2 }] },
                'advance': 'History set — the flag is ready to swap.'
              },
              {
                'beat': 'Arrange the signal steps so the message flies across the water.',
                'challenge': { 'kind': 'dragSort', 'items': [{ 'text': 'Pick a target across the harbor', 'order': 0 }, { 'text': 'Set mirror A to face the target', 'order': 1 }, { 'text': 'Tilt mirror B to catch moonlight', 'order': 2 }, { 'text': 'Light bounces A to B to target', 'order': 3 }] },
                'advance': 'Signal sent — the colony is renamed!'
              }
            ]
          }
```

- [ ] **Step 2: Syntax gate.**

Run: `node -c /home/ihthos/tutions/summer-games.js`
Expected: exit 0.

- [ ] **Step 3: Smoke (node-1 = quizMC → `.sg-quiz-opts`).**

Run: `python3 /tmp/quest_smoke.py 2-3 .sg-quiz-opts`
Expected: `OK for day 2-3`

- [ ] **Step 4: Commit.**

```bash
git -C /home/ihthos/tutions add summer-games.js
git -C /home/ihthos/tutions commit -m "manha: 2-3 Mirror Signal storyQuest (village/spy)"
```

---

### Task 5: Cache bump, parity sync, full smoke, push

**Files:**
- Modify: `manha.html` — bump cache `?v=18` → `?v=19`.
- Sync: `~/ihthos0-art/tutions/` parity.

- [ ] **Step 1: Bump cache in `manha.html`.**

Run:
```bash
sed -i 's/summer-games\.css?v=18/summer-games.css?v=19/; s/summer-games\.js?v=18/summer-games.js?v=19/' /home/ihthos/tutions/manha.html
```
Verify: `grep -n 'summer-games' /home/ihthos/tutions/manha.html` shows `?v=19` on both css and js lines.

- [ ] **Step 2: Full smoke — all 4 days.**

Run each (expect all `OK`):
```bash
python3 /tmp/quest_smoke.py 2-0 .sg-hang-kb
python3 /tmp/quest_smoke.py 2-1 .sg-ttl-grid
python3 /tmp/quest_smoke.py 2-2 .sg-hang-kb
python3 /tmp/quest_smoke.py 2-3 .sg-quiz-opts
```

- [ ] **Step 3: Regression — confirm a non-Week-3 day still works (no undefined, mission renders).**

Run:
```bash
python3 - <<'PY'
import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(headless=True); page=await b.new_page()
        await page.goto('file:///home/ihthos/tutions/manha.html'); await page.wait_for_timeout(2500)
        await page.evaluate("""() => { localStorage.removeItem('manha:summer-state'); var d={}; for(var w=0;w<8;w++)for(var x=0;x<4;x++)d[w+'-'+x]=true; localStorage.setItem('manha:summer-game-done',JSON.stringify(d)); localStorage.setItem('manha:summer-state',JSON.stringify({'0-0':{'pi':99,'phases':[]}})); location.reload(); }""")
        await page.wait_for_timeout(3000)
        html=await page.eval_on_selector(".day-game-card[data-day='0-0']","el=>el.innerHTML")
        print('0-0 undefined?', 'undefined' in html.lower(), '| mission stage?', 'sg-mission' in html)
        await b.close()
asyncio.run(main())
PY
```
Expected: `0-0 undefined? False | mission stage? True`

- [ ] **Step 4: Commit cache bump.**

```bash
git -C /home/ihthos/tutions add manha.html
git -C /home/ihthos/tutions commit -m "manha: bump cache v19 for Week 3 storyQuest activities"
```

- [ ] **Step 5: Sync second copy + push.**

```bash
cp /home/ihthos/tutions/summer-games.js /home/ihthos/ihthos0-art/tutions/summer-games.js
cp /home/ihthos/tutions/summer-games.css /home/ihthos/ihthos0-art/tutions/summer-games.css
cp /home/ihthos/tutions/manha.html     /home/ihthos/ihthos0-art/tutions/manha.html
git -C /home/ihthos/ihthos0-art/tutions stash
git -C /home/ihthos/ihthos0-art/tutions pull origin main
git -C /home/ihthos/ihthos0-art/tutions stash drop 2>/dev/null || true
git -C /home/ihthos/tutions push origin main
diff -q /home/ihthos/tutions/summer-games.js /home/ihthos/ihthos0-art/tutions/summer-games.js && echo "PARITY OK"
```
Expected: push succeeds (`main -> main`); `PARITY OK`.

- [ ] **Step 6: Report to user.**

Tell the user: pushed to `main`, live on `zidni0.github.io` after GitHub Pages rebuild, hard-refresh (v19 busts cache). Iron-rule confirmation: only the last activity phase of `2-0`…`2-3` changed; lessons/drills/practices, other 28 days, schedule/locks, parent key, other pages, and all existing engine code untouched.

---

## Verification summary

- `node -c summer-games.js` after every edit.
- Playwright DOM smoke per day: no `undefined`, character present, ≥4 path nodes, node-1 engine signature present.
- Non-Week-3 day regression: 0-0 still renders mission, no undefined.
- Parity between the two repo copies confirmed by `diff -q`.

## Rollback

`git -C /home/ihthos/tutions revert <task1-sha>..<task5-sha>` restores the 4 `activity` phases, removes the `renderQuest` function, branch, icon, and CSS. `manha.html` cache reverts to v18. Single push.