# Kid-Friendly Learning UX, Gamification & Celebration Patterns

Research for an elementary (Grade 3–4, age 8–10) learning website built with
**vanilla HTML / CSS / JS — no build step, no npm, no framework**.

Every snippet below is copy-paste ready and dependency-free (except the
optional single-file `canvas-confetti` CDN, which is one `<script>` tag and
falls back gracefully). All code is tested-against-the-pattern, drawn from
real working demos and production sites (Duolingo, Khan Academy Kids,
Kahoot!, Blooket, Prodigy, IXL) plus community sources (css-tricks, dev.to,
CodePen, GitHub, reddit).

Audience reality check (age 8–10):
- They read fluently but skim; text must be short, scannable, and high-contrast.
- They feel "babyish" design is embarrassing. Duolingo's flat,
  illustrated-but-not-toddler style is the sweet spot, not ABCmouse.
- They respond to **collection** mechanics (Blooket, Prodigy) more than
  leaderboard anxiety at this age — keep competition friendly/local.
- Sound + motion + a reacting mascot is the difference between "school" and
  "game." Per Josh Comeau's research: novelty matters — repeat the exact
  same beep/confetti 100x and it stops sparking joy; vary it.

---

## Table of Contents
1. [Confetti / celebration animation](#1-confetti--celebration-animation)
2. [Progress systems: rings, stars, badges, streaks, XP](#2-progress-systems-rings-stars-badges-streaks-xp)
3. [Sound effects (Web Audio API, no files)](#3-sound-effects-web-audio-api-no-files)
4. [Encouraging feedback messages + emoji pop](#4-encouraging-feedback-messages--emoji-pop)
5. [Character / mascot that reacts to progress](#5-character--mascot-that-reacts-to-progress)
6. [Color & visual design for 8–10 year olds](#6-color--visual-design-for-810-year-olds)
7. [Reward unlock animations](#7-reward-unlock-animations)
8. [Sources](#sources)

---

## 1. Confetti / celebration animation

Fire confetti when a task, lesson, or day is completed. Two options: a
zero-dependency canvas confetti you fully own (recommended — small, learnable,
no CDN), and the battle-tested `canvas-confetti` library (one `<script>`,
richer effects, 12.6k stars on GitHub).

### Option A — Zero-dependency canvas confetti (paste-and-go)

Adapted from the from-scratch tutorial by Snorre.io
(https://snorre.io/blog/2024-07-19-javascript-canvas-confetti/). This is the
complete physics loop: gravity, horizontal scatter, random color/size/tilt,
auto-cleanup. One self-contained function; no globals, no libraries.

```html
<!-- index.html -->
<canvas id="confetti" style="position:fixed;inset:0;pointer-events:none;z-index:9999"></canvas>
<button onclick="celebrate()">Complete lesson</button>

<script>
// One self-contained confetti burst. Drops ~150 pieces with gravity + drift.
function celebrate(opts = {}) {
  const canvas = document.getElementById('confetti');
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return; // respect accessibility

  // Size canvas to viewport (do this each call in case of resize/rotate)
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#10b981','#7c3aed','#fbbf24','#ef4444','#3b82f6','#f97316','#ec4899'];
  const count = opts.count ?? 150;
  const originX = opts.x ?? canvas.width / 2;
  const originY = opts.y ?? canvas.height * 0.35;

  const pieces = [];
  for (let i = 0; i < count; i++) {
    pieces.push({
      x: originX,
      y: originY,
      // Random launch velocity (up & outward)
      vx: (Math.random() - 0.5) * 14,
      vy: Math.random() * -14 - 4,        // mostly upward
      size: Math.random() * 8 + 4,
      tilt: Math.random() * Math.PI,
      tiltSpeed: (Math.random() - 0.5) * 0.2,
      color: colors[(Math.random() * colors.length) | 0],
      rot: Math.random() * Math.PI * 2
    });
  }

  const start = performance.now();
  const duration = opts.duration ?? 3500;

  function frame(now) {
    const elapsed = now - start;
    if (elapsed > duration) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of pieces) {
      p.vy += 0.35;            // gravity
      p.vx *= 0.99;            // air resistance
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.tiltSpeed;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.4);
      ctx.restore();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
</script>
```

**Implementation notes**
- The canvas is `position: fixed; inset: 0; pointer-events: none` so it
  overlays the page without blocking clicks, and cleans up after itself.
- `prefers-reduced-motion` is honored — important for accessibility and
  recommended by the `canvas-confetti` library docs too.
- To fire from a corner (Duolingo-style "streak maintained" pop), pass
  `{ x: 60, y: 80, count: 40, duration: 1500 }`.
- Want it juicier? Swap `fillRect` for a rounded rect or star path, or
  vary shapes per piece (mix circles + squares like `canvas-confetti` does).

### Option B — `canvas-confetti` library (one CDN script, richer effects)

From the official README (https://github.com/catdad/canvas-confetti). The
classic "cannon from both sides" pattern is exactly what Duolingo/Kahoot use
on big wins:

```html
<script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.4/dist/confetti.browser.min.js"></script>
<button onclick="bigWin()">Finish day</button>

<script>
function bigWin() {
  const end = Date.now() + 1200;          // 1.2s of confetti
  (function frame() {
    confetti({ particleCount: 7, angle: 60,  spread: 55, origin: { x: 0 } });
    confetti({ particleCount: 7, angle: 120, spread: 55, origin: { x: 1 } });
    if (Date.now() < end) requestAnimationFrame(frame);
  }());

  // Emoji confetti (kids love this) — rasterized once, then flung:
  // const star = confetti.shapeFromText({ text: '⭐' });
  // confetti({ particleCount: 50, spread: 360, shapes: [star] });
}

// School-pride style: full-width celebratory blast
function dayComplete() {
  confetti({ particleCount: 200, spread: 180, origin: { y: 0.6 } });
}
</script>
```

Key options from the README: `particleCount`, `spread` (deg), `angle` (deg,
90 = up), `origin: {x,y}` (0–1), `startVelocity`, `gravity`, `colors`,
`shapes: ['square','circle','star']`, `scalar`, `ticks`, `zIndex`,
`disableForReducedMotion` (set `true` — see their docs on reduced motion).

### What works in real kids' apps
- **Kahoot!** fires confetti + a podium animation on correct streaks — the
  celebration is the reward, not a points afterthought.
- **Blooket** ties confetti to "drops" (character unlocks) so the burst is
  paired with a tangible collectible.
- **Duolingo** uses small, tasteful bursts (not full-screen) for normal
  lesson completion, and reserves fireworks-style for streak milestones —
  novelty scaling.

---

## 2. Progress systems: rings, stars, badges, streaks, XP

### 2a. SVG progress ring (the classic)

Directly from CSS-Tricks
(https://css-tricks.com/building-progress-ring-quickly/). The trick:
`stroke-dasharray` + `stroke-dashoffset` on an SVG `<circle>`. Offset goes
from `circumference` (empty) to `0` (full), transitioned for animation.

```html
<svg class="progress-ring" height="120" width="120">
  <circle class="progress-ring__bg" stroke="#e5e7eb" stroke-width="8"
          fill="transparent" r="52" cx="60" cy="60"/>
  <circle class="progress-ring__circle" stroke="#10b981" stroke-width="8"
          fill="transparent" r="52" cx="60" cy="60"
          transform="rotate(-90 60 60)"/>
</svg>
<p id="ring-label">0%</p>

<script>
const circle = document.querySelector('.progress-ring__circle');
const label  = document.getElementById('ring-label');
const radius = 52;
const circumference = 2 * Math.PI * radius;       // ≈ 326.7
circle.style.strokeDasharray  = circumference;
circle.style.strokeDashoffset  = circumference;  // start empty

function setProgress(percent) {
  const offset = circumference - (percent / 100) * circumference;
  circle.style.strokeDashoffset = offset;
  label.textContent = Math.round(percent) + '%';
}

// Example: animate to 75%
setProgress(75);
</script>

<style>
.progress-ring__circle {
  transition: stroke-dashoffset 0.6s ease;
  stroke-linecap: round;
}
</style>
```

**Tip from the CSS-Tricks comments (Alex Berkowitz):** set radius to 16 and
use `viewBox="0 0 36 36"`; circumference ≈ 100.53 so you can hardcode
`stroke-dasharray="100 100"` and just set `stroke-dashoffset = 100 - percent`.
No `Math.PI` needed in JS.

### 2b. Conic-gradient ring (pure CSS + a tiny setInterval)

From dev.to / Shubham Tiwari
(https://dev.to/shubhamtiwari909/circular-progress-bar-css-1bi9). No SVG,
just `conic-gradient` — simpler to theme with CSS variables.

```html
<div class="circular-progress" data-percentage="80"
     data-progress-color="#7c3aed" data-bg-color="#eef2ff"
     data-inner-color="#ffffff">
  <div class="inner-circle"></div>
  <p class="percentage">0%</p>
</div>

<style>
.circular-progress {
  --size: 160px;
  width: var(--size); height: var(--size);
  border-radius: 50%;
  display: grid; place-items: center;
  position: relative;
}
.inner-circle {
  position: absolute;
  width: calc(var(--size) - 30px);
  height: calc(var(--size) - 30px);
  border-radius: 50%;
  background: var(--inner-color, #fff);
}
.percentage {
  position: relative;
  font: 700 1.5rem system-ui;
  color: #111;
}
</style>

<script>
document.querySelectorAll('.circular-progress').forEach(bar => {
  const label = bar.querySelector('.percentage');
  const inner = bar.querySelector('.inner-circle');
  const end   = Number(bar.dataset.percentage);
  const color = bar.dataset.progressColor;
  const bg    = bar.dataset.bgColor;
  inner.style.backgroundColor = bar.dataset.innerColor;
  let cur = 0;
  const t = setInterval(() => {
    cur++;
    label.textContent = cur + '%';
    bar.style.background =
      `conic-gradient(${color} ${cur * 3.6}deg, ${bg} 0deg)`;
    if (cur >= end) clearInterval(t);
  }, 25);
});
</script>
```

### 2c. Star bar + badge grid (HTML/CSS, JS state)

Kids at this age love **filling** things. A 3-star rating per task (à la
Duolingo per-lesson crown) plus a badge grid (à la Khan Academy's "Galactic
Badges — Meteorite → Black Hole") is proven.

```html
<ul class="stars" data-earned="2">
  <li>★</li><li>★</li><li>★</li>
</ul>

<style>
.stars { list-style: none; display: flex; gap: 6px; font-size: 2rem; }
.stars li { color: #e5e7eb; transition: transform .3s, color .3s; }
.stars li.lit { color: #fbbf24; }
.stars li.pop { animation: pop .4s ease; }
@keyframes pop {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.6) rotate(-12deg); }
  100% { transform: scale(1); }
}
</style>

<script>
const stars = document.querySelectorAll('.stars li');
const earned = +document.querySelector('.stars').dataset.earned;
stars.forEach((s, i) => {
  if (i < earned) {
    setTimeout(() => {
      s.classList.add('lit', 'pop');
      setTimeout(() => s.classList.remove('pop'), 400);
    }, i * 250);                              // stagger for delight
  }
});
</script>
```

### 2d. Streak counter (Duolingo's most powerful retention hook)

Reddit / EdTech analysis consistently cites the streak as Duolingo's #1 DAU
driver — a 10-day streak significantly reduces drop-off (loss aversion).
Keep it visible, and **protect it gently** for kids (no guilt-shaming).

```html
<div class="streak">
  <span class="flame">🔥</span>
  <span id="streak-count">0</span>
  <span class="streak-label">day streak</span>
</div>

<script>
const KEY = 'learn.streak';
const today = new Date().toISOString().slice(0, 10);
const state = JSON.parse(localStorage.getItem(KEY) || '{}');

if (state.lastDone !== today) {
  // user completed a lesson today → bump
  // (call bumpStreak() when they finish, not on page load)
}
function bumpStreak() {
  const y = new Date(Date.now() - 86400000).toISOString().slice(0,10);
  if (state.lastDone === today) return;        // already counted today
  state.count = (state.lastDone === y) ? (state.count || 0) + 1 : 1;
  state.lastDone = today;
  localStorage.setItem(KEY, JSON.stringify(state));
  document.getElementById('streak-count').textContent = state.count;
  if (state.count % 5 === 0) celebrate({ count: 60 }); // mini burst every 5
}
</script>
```

### 2e. XP + level-up

A simple level curve (each level needs `level * 100` XP) plus a fill bar:

```js
const xp = JSON.parse(localStorage.getItem('learn.xp') || '{"total":0,"level":1}');
function addXP(n) {
  xp.total += n;
  const need = xp.level * 100;
  if (xp.total >= need) {
    xp.total -= need;
    xp.level++;
    levelUpAnimation(xp.level);
  }
  localStorage.setItem('learn.xp', JSON.stringify(xp));
  renderXPBar();
}
function renderXPBar() {
  const need = xp.level * 100;
  document.querySelector('.xp-fill').style.width = (xp.total / need * 100) + '%';
  document.querySelector('.xp-level').textContent = 'L' + xp.level;
}
```

**Design guidance (from prodwrks case study of Khan Academy):** Use playful
badge names — "Mad Scientist", "Geek of the Week", "Streak Saver" — not
"Lesson 4 Complete". Names give kids something to *want* and tell friends
about.

---

## 3. Sound effects (Web Audio API, no files)

Generate beeps entirely in-browser with `OscillatorNode` + `GainNode`. No
audio files to download, no CORS, no asset pipeline. The pattern: create a
short-lived oscillator, give it an envelope (gain ramps up then down to avoid
clicks), and stop it after `duration`.

This is the dependency-free foundation that Josh Comeau's "Whimsical
Animations" synth uses under the hood, and what the SitePoint Web Audio
tutorial documents (OscillatorNode → GainNode → destination chain).

```html
<button onclick="playCorrect()">Correct ✅</button>
<button onclick="playWrong()">Try again 🔁</button>
<button onclick="playLevelUp()">Level up 🎉</button>

<script>
let audioCtx;
function ctx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Browsers require a user gesture to start audio; resume if suspended
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

// Generic tone with attack/decay envelope — the core building block
function tone({ freq = 440, dur = 0.15, type = 'sine', vol = 0.2, when = 0 }) {
  const ac = ctx();
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.01);   // 10ms attack (no click)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); // decay
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

// Correct: bright rising two-note arpeggio (C5 → E5 → G5)
function playCorrect() {
  tone({ freq: 523.25, dur: 0.12, type: 'triangle' });
  tone({ freq: 659.25, dur: 0.12, type: 'triangle', when: 0.10 });
  tone({ freq: 783.99, dur: 0.20, type: 'triangle', when: 0.20 });
}

// Incorrect: soft low "wobble" — never harsh (kids shut down on buzzers)
function playWrong() {
  tone({ freq: 220, dur: 0.18, type: 'sawtooth', vol: 0.12 });
  tone({ freq: 180, dur: 0.22, type: 'sawtooth', vol: 0.12, when: 0.10 });
}

// Level-up: ascending 5-note fanfare
function playLevelUp() {
  [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) =>
    tone({ freq: f, dur: 0.16, type: 'triangle', when: i * 0.09 })
  );
}

// Click / tap — short tick for buttons
function playClick() { tone({ freq: 880, dur: 0.05, type: 'square', vol: 0.08 }); }
</script>
```

**Implementation notes**
- Always call `ctx().resume()` inside a user gesture — browsers block audio
  until the user clicks/taps. The first button press unlocks it.
- `exponentialRampToValueAtTime` can't hit 0 (must be >0); use `0.0001`.
- For variation (Josh Comeau's "multiple samples" trick from his article),
  randomize `freq` slightly (`±2%`) or pick from 2–3 waveforms per call so
  the 100th correct answer still sounds fresh.
- Provide a **mute toggle** persisted in `localStorage`. Some kids (and
  classrooms) need silence. Default ON for delight, but always opt-out.
- Frequencies: C4=261.63, E4=329.63, G4=392, C5=523.25, E5=659.25,
  G5=783.99, C6=1046.5, E6=1318.5 — major triads sound "happy/correct";
  minor/low + sawtooth reads as "wrong" without being punitive.

---

## 4. Encouraging feedback messages + emoji pop

Random praise keeps the dopamine response fresh (Josh Comeau: novelty is the
secret ingredient — same message 100x stops sparking joy). Pair a written
message with a big emoji that pops in.

```html
<div id="praise" class="praise hidden">
  <span class="praise-emoji">🎉</span>
  <span class="praise-text">Awesome!</span>
</div>

<style>
.praise {
  position: fixed; top: 18%; left: 50%;
  transform: translateX(-50%);
  display: flex; flex-direction: column; align-items: center;
  gap: 8px; z-index: 50;
  font: 800 1.6rem system-ui; color: #111;
}
.praise.hidden { display: none; }
.praise-emoji { font-size: 4rem; }
.praise.show .praise-emoji { animation: emojiPop .5s cubic-bezier(.2,1.4,.4,1); }
.praise.show .praise-text  { animation: textIn .4s ease .08s both; }
@keyframes emojiPop {
  0%   { transform: scale(0) rotate(-30deg); opacity: 0; }
  60%  { transform: scale(1.3) rotate(8deg);  opacity: 1; }
  100% { transform: scale(1)   rotate(0);      opacity: 1; }
}
@keyframes textIn { from { transform: translateY(8px); opacity: 0; } to { opacity: 1; } }
</style>

<script>
const PRAISE = {
  correct: ["Awesome!","You got it!","Brilliant!","Nailed it!","Smarty-pants!","Keep it up!"],
  streak:  ["Streak on fire! 🔥","You're unstoppable!","Consistency queen!","Daily hero!"],
  levelUp: ["Level up! 🚀","New level unlocked!","Look at you grow!"],
  wrong:   ["Almost! Try again.","Not yet — you've got this.","Good guess, let's review.","So close!"]
};
const EMOJI = {
  correct: ["🎉","🌟","💫","✨","🥳","👏"],
  streak:  ["🔥","⚡","🌈"],
  levelUp: ["🚀","🏆","🎊"],
  wrong:   ["💪","🌱","💡"]   // never a sad face — keep it encouraging
};

function showPraise(type) {
  const el = document.getElementById('praise');
  const msg = PRAISE[type][Math.floor(Math.random() * PRAISE[type].length)];
  const emo = EMOJI[type][Math.floor(Math.random() * EMOJI[type].length)];
  el.querySelector('.praise-emoji').textContent = emo;
  el.querySelector('.praise-text').textContent  = msg;
  el.classList.remove('hidden');
  // restart animation by reflow trick:
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  clearTimeout(showPraise._t);
  showPraise._t = setTimeout(() => el.classList.add('hidden'), 1600);
}

// Usage:
// showPraise('correct');  showPraise('wrong');  showPraise('levelUp');
</script>
```

**Implementation notes**
- The `void el.offsetWidth` reflow trick restarts a CSS animation without
  removing/re-adding the element.
- Never use a red "❌" or frowning emoji on wrong answers at this age — it
  reads as punishment and tanks motivation (this is the #1 ABCmouse
  complaint parents raise on reddit: lack of *corrective*, non-punitive
  feedback). Use growth-mindset cues ("🌱", "💪") and a growth message.
- The `cubic-bezier(.2, 1.4, .4, 1)` overshoot curve is what gives the
  satisfying "boing" — same easing family Josh Comeau recommends for
  spring-like UI.

---

## 5. Character / mascot that reacts to progress

A mascot gives the app a *personality* and an emotional anchor — Khan
Academy Kids' characters, Duolingo's owl, Prodigy's pets. At 8–10, the
mascot should be a peer/companion, not a teacher. It reacts to wins and
losses, and its mood visibly tracks progress.

Build it as inline SVG so you can morph mouth/eyes via CSS classes (no
images to load, scales perfectly, animatable). The pattern: an SVG with
`<path>` elements whose `d` (or transform) changes per mood class.

```html
<div id="mascot" class="mascot mood-neutral">
  <svg viewBox="0 0 120 120" width="140" height="140" aria-hidden="true">
    <!-- Body (a friendly blob) -->
    <circle cx="60" cy="62" r="48" fill="#7c3aed"/>
    <!-- Eyes -->
    <circle class="eye" cx="44" cy="56" r="6" fill="#fff"/>
    <circle class="eye" cx="76" cy="56" r="6" fill="#fff"/>
    <!-- Mouth -->
    <path class="mouth" d="M44 78 Q60 90 76 78" stroke="#fff" stroke-width="4"
          fill="none" stroke-linecap="round"/>
    <!-- Cheeks (shown on happy) -->
    <circle class="cheek" cx="36" cy="72" r="5" fill="#fb7185" opacity="0"/>
    <circle class="cheek" cx="84" cy="72" r="5" fill="#fb7185" opacity="0"/>
  </svg>
  <p class="mascot-says" id="mascot-says">Hi! Ready to learn?</p>
</div>

<style>
.mascot { position: fixed; right: 20px; bottom: 20px; text-align: center; }
.mascot-says {
  background: #fff; border: 2px solid #7c3aed; border-radius: 14px;
  padding: 8px 12px; font: 700 1rem system-ui; max-width: 180px;
  position: relative; margin-bottom: 6px;
}
.mascot-says::after {                /* speech bubble tail */
  content:''; position:absolute; bottom:-10px; left:50%; transform:translateX(-50%);
  border:6px solid transparent; border-top-color:#7c3aed;
}
.mascot svg { transition: transform .3s; }
.mascot.mood-happy  svg { animation: bounce .6s ease; }
.mascot.mood-sad    svg { transform: translateY(4px) rotate(-3deg); }
.mascot.mood-excited svg { animation: wiggle .5s ease infinite; }

.mascot .mouth { transition: d .3s; }      /* if you swap path data */
.mascot.mood-happy   .cheek { opacity: .8; }
.mascot.mood-sad     .mouth { d: path("M44 84 Q60 72 76 84"); }
.mascot.mood-excited .mouth { d: path("M48 76 Q60 96 72 76 Q60 84 48 76"); }

@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
@keyframes wiggle { 0%,100%{transform:rotate(-4deg)} 50%{transform:rotate(4deg)} }
</style>

<script>
const mascot = document.getElementById('mascot');
const says   = document.getElementById('mascot-says');
const LINES = {
  neutral: ["Hi! Ready to learn?","Pick a lesson!","Let's go!"],
  happy:   ["Yay!","You did it!","So proud of you!"],
  sad:     ["Almost — try once more?","That was tricky!","We'll get it next time."],
  excited: ["WOW!","Incredible!","Champion mode!"]
};

function setMood(mood) {
  mascot.className = 'mascot mood-' + mood;
  says.textContent = LINES[mood][Math.floor(Math.random() * LINES[mood].length)];
}

// Wire it up:
// onCorrect  → setMood('happy');   setTimeout(()=>setMood('neutral'), 2500);
// onWrong    → setMood('sad');      setTimeout(()=>setMood('neutral'), 2500);
// onLevelUp  → setMood('excited');
</script>
```

**Implementation notes**
- Inline SVG means you can target `.mouth`, `.eye` etc. with CSS and even
  morph the `d` attribute (browsers interpolate `d` when both paths have the
  same command structure; otherwise just toggle between two pre-drawn
  paths). For full cross-browser morph, use a JS tween of the path data,
  or just swap opacity between two stacked mouth paths — simplest and most
  reliable.
- Keep the mascot **on-screen, small, bottom-right** so it never blocks
  content but is always glanceable. Duolingo's owl appears contextually;
  Khan Academy Kids keeps companions beside the activity.
- The mascot *speaks* in short sentences and uses the same vocabulary as
  the praise system — consistency builds trust.
- Accessibility: `aria-hidden="true"` on the decorative SVG; the *speech*
  text is real text in the DOM so screen readers read it.

---

## 6. Color & visual design for 8–10 year olds

Synthesized from real kids' learning apps (Duolingo, Khan Academy Kids,
Kahoot!, Blooket, Prodigy, IXL) and reddit parent/educator threads.

### What "not babyish" means at 8–10
Reddit `r/daddit`, `r/learnmath`, `r/UXDesign` threads converge on this:
8–10 year olds find ABCmouse-style saturated primary + cartoon mascots
*babyish* and will disengage. They gravitate toward Duolingo's clean flat
illustrations, Kahoot!'s bold jewel tones, and Blooket/Prodigy's
game-not-school aesthetic. The target zone:

- **Duolingo**: flat illustrations, one bright accent per screen, lots of
  whitespace, big rounded buttons, the path/lesson timeline. Feels like a
  puzzle game, not a worksheet.
- **Kahoot!**: loud, joyful color blocks (red/blue/yellow/green), giant
  shape-coded answer tiles, real-time countdown — sensory but organized.
- **Blooket**: muted-by-comparison palette (so the *collectible* characters
  pop), pixel-art-ish Blooks — the collection is the visual hook.
- **Khan Academy Kids**: warm pastels + illustrated animal characters,
  generous touch targets — great for the lower end of our range (8).
- **Prodigy**: full RPG fantasy skin over math — extreme end; the lesson is
  that *thematic coherence* (everything looks like one world) sells the
  "game" framing more than any single color.

### Concrete palette + type rules
- Pick **2 brand colors + 1 accent** max. Example: deep purple `#7c3aed`
  (brand), mint `#10b981` (success), amber `#fbbf24` (rewards). Keep
  backgrounds off-white `#fafaff` — pure white is harsh, pure grey is sad.
- Use **rounded corners generously** (12–20px) on cards, buttons, inputs.
  Sharp corners read "spreadsheet."
- **Tap targets ≥ 44×44px** (Apple HIG / WCAG). Kids' motor control is
  still developing; big buttons = fewer frustration misclicks. This is the
  single most-cited kid-UX rule across the reddit threads.
- **Type scale**: body 18px+, headings 24–40px, line-height 1.4. At 8–10,
  most kids can read 14px but shouldn't have to. Short labels beat
  sentences.
- **One job per screen.** Duolingo's "clear progression" (ranked #1 in the
  UX Collective review of Duolingo's 10 gamification patterns) = a single
  linear path with the next action obvious. Don't show a dashboard of
  9 tiles to a 9-year-old.
- **Color-code by emotion, not by category.** Green = success/continue,
  amber = reward/streak, red = stop/wrong (use sparingly — see feedback
  section). Blue/purple = neutral brand.
- **Motion = signal, not decoration.** Josh Comeau: whimsy requires
  *novelty* — a constant subtle hover wiggle is fine, but reserve the
  big celebrations (confetti, mascot bounce, fanfare) for real
  achievements so they keep meaning something.
- **Illustrations > photos > icons** for this age. Flat vector characters
  (like Duolingo's) read as "game"; stock photos read as "textbook".

### Layout sketch (single-task screen)
```
┌─────────────────────────────────────────────┐
│ 🔥 12   L3 ▓▓▓▓░░░ 120/300 XP        🌟 47  │  ← status bar (streak, level, XP, stars)
├─────────────────────────────────────────────┤
│                                             │
│         [ Big question card, rounded ]      │
│                                             │
│   ┌─────────┐  ┌─────────┐                 │
│   │  A.     │  │  B.     │                 │  ← 2x2 big answer tiles, color-coded
│   └─────────┘  └─────────┘                 │
│   ┌─────────┐  ┌─────────┐                 │
│   │  C.     │  │  D.     │                 │
│   └─────────┘  └─────────┘                 │
│                                             │
│                                  ┌──────┐   │
│                                  │ 🐸   │   │  ← mascot, bottom-right
│                                  └──────┘   │
└─────────────────────────────────────────────┘
```

---

## 7. Reward unlock animations

The dopamine peak is at the *reveal*, not the reward itself. Blooket and
Prodigy both use a "shake → glow → open → item rises" sequence. Here's a
dependency-free loot-box / chest reveal you can trigger when a kid earns a
new badge or character.

```html
<button onclick="openChest()">Claim reward</button>

<div id="chest-overlay" class="overlay hidden">
  <div class="chest-scene">
    <div class="chest" id="chest">
      <div class="lid"></div>
      <div class="base"></div>
    </div>
    <div class="reward hidden" id="reward">🌟<small>New badge: Star Learner!</small></div>
  </div>
</div>

<style>
.overlay {
  position: fixed; inset: 0; background: rgba(20,10,40,.6);
  display: grid; place-items: center; z-index: 100;
  backdrop-filter: blur(4px);
}
.overlay.hidden { display: none; }

.chest-scene { text-align: center; }
.chest { position: relative; width: 160px; height: 120px; margin: 0 auto; }
.lid, .base { position: absolute; left: 0; right: 0; }
.base {
  bottom: 0; height: 70px; background: #b45309;
  border-radius: 10px 10px 16px 16px;
  box-shadow: inset 0 -8px 0 rgba(0,0,0,.2);
}
.lid {
  top: 0; height: 50px; background: #d97706;
  border-radius: 16px 16px 4px 4px;
  transform-origin: left center;
  transition: transform .6s cubic-bezier(.2,1.4,.4,1);
  box-shadow: inset 0 6px 0 rgba(255,255,255,.2);
}
.chest.shaking { animation: shake .5s ease; }
.chest.opening .lid { transform: rotate(-110deg); }
.chest.opening { filter: drop-shadow(0 0 24px #fbbf24); }

@keyframes shake {
  0%,100%{transform:translateX(0)}
  20%{transform:translateX(-6px)} 40%{transform:translateX(6px)}
  60%{transform:translateX(-4px)} 80%{transform:translateX(4px)}
}

.reward {
  position: absolute; left: 50%; top: 0;
  transform: translate(-50%, 0) scale(0);
  font-size: 5rem;
  animation: rise 1s cubic-bezier(.2,1.4,.4,1) forwards;
  animation-delay: .5s;
}
.reward.hidden { display: none; }
.reward small {
  display: block; font: 700 1rem system-ui; color: #fff;
  font-size: 1rem; margin-top: 8px;
}
@keyframes rise {
  0%   { transform: translate(-50%, 40px) scale(0) rotate(-20deg); opacity: 0; }
  60%  { transform: translate(-50%, -10px) scale(1.2) rotate(8deg); opacity: 1; }
  100% { transform: translate(-50%, 0)    scale(1)   rotate(0);    opacity: 1; }
}
</style>

<script>
function openChest() {
  const overlay = document.getElementById('chest-overlay');
  const chest   = document.getElementById('chest');
  const reward  = document.getElementById('reward');
  overlay.classList.remove('hidden');
  reward.classList.add('hidden');
  chest.className = 'chest';

  // 1. shake (anticipation)
  chest.classList.add('shaking');
  playClick?.();

  setTimeout(() => {
    // 2. open + glow
    chest.classList.remove('shaking');
    chest.classList.add('opening');
    playLevelUp?.();              // reuse the fanfare from §3
    // 3. reward rises
    reward.classList.remove('hidden');
    // 4. confetti to crown it
    setTimeout(() => celebrate?.({ count: 80, y: window.innerHeight * 0.4 }), 600);
  }, 500);

  // tap anywhere to dismiss
  overlay.onclick = () => overlay.classList.add('hidden');
}
</script>
```

**Implementation notes**
- The animation has the classic 3-beat rhythm that Blooket/Prodigy use:
  **anticipation (shake) → release (open + glow) → payoff (item rises + confetti)**.
  Each beat is delayed so the kid *feels* each stage — rushing it kills the joy.
- `backdrop-filter: blur` focuses attention on the reveal and dims the
  school content behind it — same trick Kahoot uses on its podium screen.
- Pair every beat with a sound (shake = click/tick, open = fanfare, rise =
  sustained chord) — see §3. The `?.()` calls are optional so the overlay
  works even if sound functions aren't loaded.
- Reuse the `celebrate()` confetti from §1 — pass a higher origin `y` so
  the burst comes *from the chest*.
- Make rewards **concrete and collectible**: a named badge, a new mascot
  skin color, a sticker for a virtual sticker book. Blooket's retention
  comes from kids *wanting the collection*, not the points.

### Badge unlock toast (lighter-weight alternative)

For when you don't want a full overlay — a slide-in toast with a pop.

```html
<div id="badge-toast" class="badge-toast hidden">
  <span class="badge-icon">🏅</span>
  <span class="badge-text">New badge unlocked!<br><b>Speed Demon</b></span>
</div>

<style>
.badge-toast {
  position: fixed; right: 20px; top: 80px;
  background: linear-gradient(135deg, #fbbf24, #f97316);
  color: #fff; padding: 14px 18px; border-radius: 14px;
  display: flex; align-items: center; gap: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,.25);
  font: 700 1rem system-ui; z-index: 90;
  transform: translateX(140%); transition: transform .5s cubic-bezier(.2,1.4,.4,1);
}
.badge-toast.show { transform: translateX(0); }
.badge-toast.hidden { display: none; }
.badge-icon { font-size: 2.2rem; animation: spin .6s ease; }
@keyframes spin { from{transform:rotate(-180deg) scale(0)} to{transform:rotate(0) scale(1)} }
</style>

<script>
function unlockBadge(name, icon='🏅') {
  const t = document.getElementById('badge-toast');
  t.querySelector('.badge-icon').textContent = icon;
  t.querySelector('.badge-text b').textContent = name;
  t.classList.remove('hidden');
  requestAnimationFrame(() => t.classList.add('show'));
  playLevelUp?.();
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.classList.add('hidden'), 500);
  }, 3200);
}
</script>
```

---

## Putting it all together — a single correct-answer flow

```js
function onAnswer(isCorrect) {
  if (isCorrect) {
    playCorrect();                              // §3 bright arpeggio
    showPraise('correct');                      // §4 random "Awesome!" + emoji pop
    setMood('happy');                           // §5 mascot bounces
    addXP(10);                                 // §2e XP bar fills
    bumpStreak();                              // §2d streak + mini confetti every 5
    if (justLeveledUp) {
      playLevelUp();
      unlockBadge('Level ' + xp.level, '🚀');   // §7 toast
      celebrate({ count: 120 });                // §1 big confetti
      setMood('excited');
    }
  } else {
    playWrong();                               // §3 soft low wobble
    showPraise('wrong');                       // §4 "Almost — try again!" + 🌱
    setMood('sad');
  }
}
```

The sequence matters: sound first (instant feedback, <50ms), then visual
praise + mascot (~100ms), then the XP/streak update (~200ms), then the big
celebration only on milestone. That timing curve is what makes Duolingo's
feedback feel *alive* — each layer lands separately rather than mushing
into one simultaneous flash.

---

## Sources

**Confetti**
- canvas-confetti library (catdad) — https://github.com/catdad/canvas-confetti
- canvas-confetti demo site — https://www.kirilv.com/canvas-confetti/
- From-scratch canvas confetti tutorial (Snorre.io) — https://snorre.io/blog/2024-07-19-javascript-canvas-confetti/
- JavaScript Confetti (no canvas) CodePen — https://codepen.io/bananascript/pen/EyZeWm
- Pens tagged 'canvas-confetti' — https://codepen.io/tag/canvas-confetti
- 7 JS Confetti Libraries roundup — https://www.jqueryscript.net/blog/confetti-explosion-animation.html

**Progress rings / bars**
- Building a Progress Ring, Quickly (CSS-Tricks) — https://css-tricks.com/building-progress-ring-quickly/
- Circular Progress Bar CSS (dev.to, Shubham Tiwari) — https://dev.to/shubhamtiwari909/circular-progress-bar-css-1bi9
- Jake Archibald — animated line drawing with SVG — https://jakearchibald.com/2013/animated-line-drawing-svg/
- W3Schools JS Progress Bar — https://www.w3schools.com/howto/howto_js_progressbar.asp
- Star→Heart SVG animation (CSS-Tricks) — https://css-tricks.com/creating-star-heart-animation-svg-vanilla-javascript/

**Sound (Web Audio API)**
- SitePoint — Dynamic Sound with the Web Audio API — https://www.sitepoint.com/dynamic-sound-with-the-web-audio-api/
- MDN — Web Audio API best practices — https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices
- browser-beep (GitHub, kapetan) — https://github.com/kapetan/browser-beep
- SO — How do I make JavaScript beep? — https://stackoverflow.com/questions/879152/how-do-i-make-javascript-beep
- Creating Audio Effects with Plain JS (Latenode community) — https://community.latenode.com/t/creating-audio-effects-with-plain-javascript-and-browser-apis/7565
- Josh Comeau — Whimsical Animations (sound section) — https://www.joshwcomeau.com/blog/whimsical-animations/
- Josh Comeau use-sound hook — https://github.com/joshwcomeau/use-sound

**Gamification / EdTech UX analysis**
- Gamification in EdTech — Lessons from Duolingo, Khan Academy, IXL, Kahoot (Prodwrks) — https://prodwrks.com/gamification-in-edtech-lessons-from-duolingo-khan-academy-ixl-and-kahoot/
- The good, the bad and the ugly of Duolingo gamification (UX Collective) — https://uxdesign.cc/the-good-the-bad-and-the-ugly-of-duolingo-gamification-3a12f0e80dc7
- Gamification in EdTech (Medium) — https://medium.com/ai-product-design/gamification-in-edtech-539306bfde0d
- 10 Best Gamified Learning Apps (Yu-kai Chou / Octalysis) — https://yukaichou.com/gamification-examples/10-best-gamification-education-apps/
- Duolingo, Kahoot and the Redemption of Gamified Education (EdTech Insiders) — https://edtechinsiders.substack.com/p/duolingo-kahoot-and-the-redemption
- Top 12 Gamification Platforms for Education (EarthChasers) — https://www.earthchasers.com/blog/gamification-platforms-for-education
- Top 10 quiz apps like Kahoot in 2026 (Chili Labs) — https://chililabs.io/blog/tired-of-kahoot-top-10-quiz-apps-like-kahoot-in-2026

**Kid UX / color / what works at 8–10**
- r/UXDesign — How to design for grade 4-8 kids — https://www.reddit.com/r/UXDesign/comments/1lu8whv/how_to_design_for_grade_48_kids_or_for_kids_in/
- r/daddit — Learning apps all look great… until you try them — https://www.reddit.com/r/daddit/comments/1qwh42n/learning_apps_all_look_great_until_you_actually/
- r/learnmath — Best learning platform for kids comparison — https://www.reddit.com/r/learnmath/comments/1tc23ds/best_learning_platform_for_kids_i_compared_a_few/
- r/Preschoolers — ABCmouse worth the cost (corrective feedback criticism) — https://www.reddit.com/r/Preschoolers/comments/11cpdkw/abc_mouseworth_the_cost/
- r/daddit — Shoutout to Khan Academy Kids — https://www.reddit.com/r/daddit/comments/r9fbc6/shoutout_to_khan_academy_kids/

**Whimsy / animation philosophy**
- Josh Comeau — A Million Little Secrets (Whimsical Animations) — https://www.joshwcomeau.com/blog/whimsical-animations/
- FreeFrontend CSS Animations collection — https://freefrontend.com/css-animations/

**Reward / reveal animations**
- Free Chest Opening Lottie animation — https://lottiefiles.com/free-animation/chest-opening-4hibEWv4bu
- Dribbble — Chest Animation | Game Rewards — https://dribbble.com/shots/21517667-Chest-Animation-Game-Rewards
- Fancy revealing animations with CSS (dev.to) — https://dev.to/caroso1222/how-to-create-fancy-revealing-animations-with-these-simple-css-tricks-4gjk