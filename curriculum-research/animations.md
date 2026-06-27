# Web Animation Techniques for a Static Vanilla Site

Research for a static tutoring page (vanilla HTML/CSS/JS, no build step, served by Cloudflare).
Goal: make a learning page feel alive and playful for an elementary student.

All snippets below are **paste-ready** into a single `.html` file or a plain `.css`/`.js` pair.
Each section notes whether it is **dependency-free** or needs a **CDN library**.

---

## Quick Decision Guide

| Need | Best choice | Dependency? |
|------|------------|-------------|
| Reveal sections as you scroll | IntersectionObserver + CSS (Section 1) | None |
| Flip a "Did you know?" card | CSS 3D flip (Section 2) | None |
| Slide between "Day 1 / Day 2" | CSS scroll-snap + transform (Section 2) | None |
| Button press feedback | Ripple + scale (Section 3) | None |
| Swipe between days on mobile | Touch events + transform (Section 4) | None |
| Floating clouds/stars background | CSS `@keyframes` float (Section 5) | None |
| "Stars earned: 25" count-up | `requestAnimationFrame` (Section 6) | None |
| Quiz options pop in one-by-one | Staggered `transition-delay` (Section 7) | None |
| Heavy timeline / pinned scroll story | GSAP + ScrollTrigger (Section 8) | CDN |

**Performance rule of thumb:** animate only `transform` and `opacity` (they are GPU-composited and do not trigger layout/paint). Avoid animating `top`, `left`, `width`, `height`, `box-shadow` when possible.

**Accessibility rule:** always wrap motion in a `prefers-reduced-motion` guard (snippet at the end of Section 1). Never hide real content behind animation; the page must be usable with no animation at all.

---

## 1. Scroll-Reveal Animations (IntersectionObserver + CSS)

**Dependency:** none. Pure browser API.

**Approach:** elements start with a hidden state (`.reveal`). When the browser's `IntersectionObserver` notices the element entering the viewport, it adds `.reveal--visible`, and CSS transitions it into view.

### CSS

```css
/* default hidden state */
.reveal {
  opacity: 0;
  transform: translateY(40px) scale(0.96);
  transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: opacity, transform;
}
/* variant classes — pick one per element */
.reveal--fade   { transform: none; }                 /* fade only */
.reveal--slide  { transform: translateX(-60px); }    /* slide from left */
.reveal--zoom   { transform: scale(0.85); }         /* zoom in */
.reveal--pop    { transform: scale(0.7) rotate(-6deg); } /* playful pop */

/* visible state — the transition does the work */
.reveal.is-visible {
  opacity: 1;
  transform: none;
}

/* respect users who asked for less motion */
@media (prefers-reduced-motion: reduce) {
  .reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
}
```

### HTML (use any variant class alongside `.reveal`)

```html
<section class="reveal reveal--fade">  Welcome to Day 1!  </section>
<section class="reveal reveal--slide"> Today we learn about fractions. </section>
<div   class="reveal reveal--pop">   🎉 A fun fact card! </div>
```

### JS (one reusable observer for the whole page)

```js
// Reveal on scroll — fire once per element
const revealEls = document.querySelectorAll('.reveal');

const io = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target); // animate once
    }
  });
}, {
  threshold: 0.15,            // 15% visible before triggering
  rootMargin: '0px 0px -10% 0px' // trigger slightly before fully in view
});

revealEls.forEach(el => io.observe(el));
```

### Notes & caveats
- **Performance:** `IntersectionObserver` is far better than listening to `scroll` — the browser batches callbacks and only fires when something changes. Source: MDN / CSS-Tricks.
- **Accessibility:** with the reduced-motion media query above, content is simply visible. Without it, screen-reader users may hear nothing until they scroll — so never put critical instructions *only* inside a `.reveal` that depends on JS; the CSS fallback (opacity 0) should be applied by a class added by JS, or override it: see "robust fallback" below.
- **Robust no-JS fallback:** if JS fails, `.reveal` stays at `opacity:0` and content is invisible. Fix it by adding the hidden state via JS instead of CSS, OR add a `<noscript>` style: `<noscript><style>.reveal{opacity:1;transform:none}</style></noscript>`.
- Tune `threshold` (0 to 1) and `rootMargin` (negative bottom margin = trigger earlier).

**Source:** CSS-Tricks, "How to Make a Scroll-Triggered Animation With Basic JavaScript" — https://css-tricks.com/scroll-triggered-animation-vanilla-javascript/

---

## 2. Page / Section Transitions (Card-Flip + Swipe-between-days)

### 2A. CSS 3D Card Flip (dependency-free)

A "flashcard" effect — click/tap a card to flip it and reveal the answer. Works for vocab, math facts, "Did you know?".

#### HTML

```html
<div class="flip-card" tabindex="0" role="button" aria-pressed="false"
     aria-label="Tap to flip the card and see the answer">
  <div class="flip-card-inner">
    <div class="flip-card-front">
      <h3>What is 7 × 8?</h3>
      <p class="hint">(tap to flip)</p>
    </div>
    <div class="flip-card-back">
      <h3>56</h3>
      <p>Great job! 🎉</p>
    </div>
  </div>
</div>
```

#### CSS

```css
.flip-card {
  background-color: transparent;
  width: 280px;
  height: 200px;
  perspective: 1000px;            /* the 3D viewport */
  cursor: pointer;
}
.flip-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  text-align: center;
  transition: transform 0.8s cubic-bezier(0.4, 0.2, 0.2, 1);
  transform-style: preserve-3d; /* keep children in 3D space */
}
.flip-card.is-flipped .flip-card-inner,
.flip-card:focus .flip-card-inner { transform: rotateY(180deg); }

.flip-card-front, .flip-card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  box-sizing: border-box;
}
.flip-card-front { background: #ffe066; color: #333; }
.flip-card-back  { background: #4dabf7; color: #fff; transform: rotateY(180deg); }

@media (prefers-reduced-motion: reduce) {
  .flip-card-inner { transition: none; }
}
```

#### JS (flip on click/tap + keyboard)

```js
document.querySelectorAll('.flip-card').forEach(card => {
  const toggle = () => {
    const flipped = card.classList.toggle('is-flipped');
    card.setAttribute('aria-pressed', flipped);
  };
  card.addEventListener('click', toggle);
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
  });
});
```

#### Notes
- `perspective` on the parent + `transform-style: preserve-3d` + `backface-visibility: hidden` are the three magic lines.
- `tabindex="0"` + Enter/Space handler makes it keyboard-accessible.
- **Caveat:** content on the back is hidden visually but still in the DOM (good for screen readers — it reads both sides). Some older iOS Safari versions had a `backface-visibility` bug; add `-webkit-backface-visibility: hidden` (shown) to cover it.

**Source:** W3Schools "How To Create a Flip Card" — https://www.w3schools.com/howto/howto_css_flip_card.asp ; David DeSandro "Card Flip" — https://3dtransforms.desandro.com/card-flip

### 2B. Swipe / Slide between "Days" (CSS scroll-snap + transform)

A horizontal "day picker" that slides between Day 1, Day 2, Day 3. This version uses pure CSS `scroll-snap` — it works with mouse, touch, *and* keyboard out of the box, no JS needed for the sliding itself.

#### HTML

```html
<div class="day-slider" tabindex="0">
  <section class="day-slide" id="day1"><h2>Day 1 — Numbers</h2>...</section>
  <section class="day-slide" id="day2"><h2>Day 2 — Shapes</h2>...</section>
  <section class="day-slide" id="day3"><h2>Day 3 — Patterns</h2>...</section>
</div>
<nav class="day-nav">
  <a href="#day1">1</a><a href="#day2">2</a><a href="#day3">3</a>
</nav>
```

#### CSS

```css
.day-slider {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;   /* snaps one slide at a time */
  scroll-behavior: smooth;        /* animated jump on nav click */
  gap: 0;
  height: 60vh;
  border-radius: 18px;
  outline: none;
}
.day-slide {
  flex: 0 0 100%;                  /* each slide = full width */
  scroll-snap-align: start;
  scroll-snap-stop: always;        /* never skip a slide while swiping fast */
  padding: 2rem;
  box-sizing: border-box;
  background: #fff4e6;
}
.day-slide:nth-child(2) { background: #e3fafc; }
.day-slide:nth-child(3) { background: #ffe0f0; }
/* hide the scrollbar but keep scrolling */
.day-slider::-webkit-scrollbar { display: none; }
.day-slider { scrollbar-width: none; }
```

#### Notes
- `scroll-snap-type: x mandatory` + `scroll-snap-stop: always` = one slide per swipe gesture (great for kids' clumsy swipes).
- The nav links use `#day1` anchors + `scroll-behavior: smooth` → clicking a number smoothly scrolls to that day, no JS.
- **Caveat:** `scroll-snap` is supported in all modern browsers since 2020. On very old browsers it degrades to normal scrolling (still works).
- For a JS-driven version with arrows + active-dot tracking, see Section 4.

**Source:** MDN scroll-snap — https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-snap-type

---

## 3. Click / Tap Micro-Interactions (Ripple, Bounce, Pop)

### 3A. Material-Style Ripple (vanilla JS, no library)

A circle radiates from the exact point you clicked — very satisfying feedback for "Submit answer" buttons.

#### HTML

```html
<button class="btn-ripple">Check Answer</button>
```

#### CSS

```css
.btn-ripple {
  position: relative;
  overflow: hidden;
  transition: background 400ms, transform 120ms;
  color: #fff;
  background: #7950f2;
  padding: 1rem 2rem;
  font: 600 1.1rem system-ui, sans-serif;
  border: 0;
  border-radius: 999px;        /* pill shape */
  cursor: pointer;
}
.btn-ripple:active { transform: scale(0.96); }   /* press squash */

span.ripple {
  position: absolute;
  border-radius: 50%;
  transform: scale(0);
  animation: ripple 600ms ease-out;
  background-color: rgba(255, 255, 255, 0.6);
  pointer-events: none;        /* so rapid clicks don't hit the span */
}
@keyframes ripple {
  to { transform: scale(4); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .btn-ripple:active { transform: none; }
  span.ripple { display: none; }
}
```

#### JS (uses `getBoundingClientRect` — works even inside scrolled/offset parents)

```js
function createRipple(e) {
  const button = e.currentTarget;
  const rect   = button.getBoundingClientRect();
  const circle = document.createElement('span');
  const diameter = Math.max(rect.width, rect.height);
  const radius   = diameter / 2;

  circle.style.width  = circle.style.height = `${diameter}px`;
  // works whether the click is a mouse event or a pointer event
  const x = (e.clientX ?? e.touches?.[0]?.clientX) - (rect.left + radius);
  const y = (e.clientY ?? e.touches?.[0]?.clientY) - (rect.top  + radius);
  circle.style.left = `${x}px`;
  circle.style.top  = `${y}px`;
  circle.classList.add('ripple');

  // clean up after the animation finishes (avoids leftover spans)
  circle.addEventListener('animationend', () => circle.remove());
  button.appendChild(circle);
}

document.querySelectorAll('.btn-ripple').forEach(btn =>
  btn.addEventListener('pointerdown', createRipple)
);
```

#### Notes & caveats
- Use `pointerdown` (not `click`) so the ripple appears instantly under the finger on mobile — it feels far snappier.
- `getBoundingClientRect()` is the robust choice; `offsetLeft/offsetTop` breaks when the button is inside a positioned parent (a known bug in the original CSS-Tricks version, fixed in the comments — see sources).
- **Accessibility:** the original tutorial used `outline: 0`, which fails WCAG focus-visible. Keep a visible focus ring: `outline: 2px solid #fff; outline-offset: 2px;` on `:focus-visible`. The `@media (prefers-reduced-motion)` block above disables the ripple for users who asked for less motion.

**Source:** CSS-Tricks, "How to Recreate the Ripple Effect of Material Design Buttons" — https://css-tricks.com/how-to-recreate-the-ripple-effect-of-material-design-buttons/ (with the `getBoundingClientRect` + `animationend` fixes from the comments by Joao Rodrigues and Jonas).

### 3B. Pure-CSS Bounce / Pop (no JS at all)

For "Correct!" celebratory feedback or hover wobble on icons.

```css
@keyframes pop {
  0%   { transform: scale(1); }
  40%  { transform: scale(1.25) rotate(-4deg); }
  70%  { transform: scale(0.92); }
  100% { transform: scale(1); }
}
.celebrate { animation: pop 0.5s ease; transform-origin: center; }

@keyframes wobble {      /* gentle hover wobble for decorative icons */
  0%, 100% { transform: rotate(-3deg); }
  50%      { transform: rotate(3deg);  }
}
.icon-wobble:hover { animation: wobble 0.4s ease-in-out infinite; }

@keyframes float-bob {  /* see Section 5 */
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-10px); }
}
```

Trigger from JS when an answer is correct:
```js
const badge = document.querySelector('.star-badge');
badge.classList.remove('celebrate');      // reset
void badge.offsetWidth;                    // force reflow so animation replays
badge.classList.add('celebrate');
```

---

## 4. Swipe Gestures for Mobile (Vanilla Touch Events)

Detect a left/right swipe and switch "days" — works alongside the CSS scroll-snap slider from 2B, or as a standalone gesture handler for any element.

### Minimal swipe detector

```js
/**
 * Attach a swipe handler to any element.
 * onSwipe('left' | 'right') is called when the finger moves >threshold px.
 */
function addSwipe(el, onSwipe, threshold = 50) {
  let startX = 0, startY = 0, tracking = false;

  const start = (x, y) => { startX = x; startY = y; tracking = true; };
  const end   = (x, y) => {
    if (!tracking) return;
    tracking = false;
    const dx = x - startX, dy = y - startY;
    // only count horizontal-dominant swipes (so vertical scroll still works)
    if (Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy)) {
      onSwipe(dx < 0 ? 'left' : 'right');
    }
  };

  el.addEventListener('touchstart', e => start(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
  el.addEventListener('touchend',   e => end(e.changedTouches[0].clientX, e.changedTouches[0].clientY), { passive: true });
  // optional mouse support for desktop testing
  el.addEventListener('mousedown',  e => start(e.clientX, e.clientY));
  el.addEventListener('mouseup',    e => end(e.clientX, e.clientY));
}
```

### Using it to switch day-slides

```js
const slider   = document.querySelector('.day-slider');
const dots     = [...document.querySelectorAll('.day-nav a')];
const slides   = [...slider.children];
let current = 0;

function goTo(i) {
  current = Math.max(0, Math.min(slides.length - 1, i));
  slides[current].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
  dots.forEach((d, idx) => d.classList.toggle('active', idx === current));
}

addSwipe(slider, dir => goTo(current + (dir === 'left' ? 1 : -1)));
dots.forEach((d, idx) => d.addEventListener('click', () => goTo(idx)));
```

### Notes & caveats
- Use `{ passive: true }` on `touchstart`/`touchmove` so you don't block scrolling — call `e.preventDefault()` only inside a *non-passive* `touchmove` listener if you must suppress vertical scroll while swiping horizontally.
- The `Math.abs(dx) > Math.abs(dy)` check is what stops a vertical page-scroll from being misread as a swipe.
- **Accessibility:** swipes are *not* keyboard-accessible — always pair them with visible buttons/arrows (the `.day-nav` dots above). The CSS scroll-snap version in 2B handles keyboard arrow keys automatically.
- Pointer Events are the modern alternative to touch events and unify mouse+pen+touch: `el.addEventListener('pointerdown', …)`. See CSS-Tricks "Simple Swipe with Vanilla JavaScript" for a deep dive.

**Source:** CSS-Tricks, "Simple Swipe with Vanilla JavaScript" — https://css-tricks.com/simple-swipe-with-vanilla-javascript/ ; Stack Overflow touch-detection thread — https://stackoverflow.com/questions/2264072/detect-a-finger-swipe-through-javascript-on-the-iphone-and-android

---

## 5. Parallax & Floating Decorative Elements

### 5A. Floating clouds/stars (pure CSS, dependency-free)

Background decorations that gently bob up and down — gives a page a "living" feel without any JS.

```css
.floater {
  position: absolute;
  animation: float-bob 4s ease-in-out infinite;
  will-change: transform;
}
.floater--slow   { animation-duration: 6s; }
.floater--fast   { animation-duration: 2.5s; }
.floater--delay  { animation-delay: -2s; }   /* negative delay = starts mid-cycle */

@keyframes float-bob {
  0%, 100% { transform: translateY(0)    rotate(0deg); }
  50%      { transform: translateY(-14px) rotate(2deg); }
}

/* spin a sun or star slowly */
@keyframes spin-slow { to { transform: rotate(360deg); } }
.spin { animation: spin-slow 20s linear infinite; }

@media (prefers-reduced-motion: reduce) {
  .floater, .spin { animation: none !important; }
}
```

```html
<div class="scene" style="position:relative; height:300px;">
  <span class="floater"            style="top:10%; left:8%;  font-size:3rem;">☁️</span>
  <span class="floater floater--slow floater--delay" style="top:20%; right:10%; font-size:2.5rem;">⭐</span>
  <span class="spin"               style="top:5%;  right:30%; font-size:2rem;">☀️</span>
</div>
```

### 5B. Pure-CSS Parallax (the "Keith Clark" technique)

Real parallax with no JavaScript, using 3D transforms. Background layers move slower than foreground layers because they are pushed back along the Z axis.

```css
.parallax {
  height: 100vh;
  overflow-x: hidden;
  overflow-y: auto;
  perspective: 1px;                 /* the 3D viewport */
  /* some browsers need the perspective on body; see notes */
}
.parallax__group {
  position: relative;
  height: 100vh;
  transform-style: preserve-3d;     /* don't flatten children */
}
.parallax__layer {
  position: absolute;
  inset: 0;                         /* fill the group */
}
.parallax__layer--base  { transform: translateZ(0); }                /* normal speed */
.parallax__layer--back  { transform: translateZ(-1px) scale(2); }    /* slower + scaled back to size */
.parallax__layer--deep  { transform: translateZ(-2px) scale(3); }    /* even slower */

/* scale formula: 1 + (translateZ * -1) / perspective
   so with perspective 1px and translateZ -2px → scale(3) keeps the layer visually full-size */
```

```html
<div class="parallax">
  <div class="parallax__group">
    <div class="parallax__layer parallax__layer--back">🌈 far-away mountains</div>
    <div class="parallax__layer parallax__layer--base">🚶 a hero walking in front</div>
  </div>
  <div class="parallax__group">
    <div class="parallax__layer parallax__layer--base">Next section…</div>
  </div>
</div>
```

#### Notes & caveats
- Works in Chrome, Firefox, Safari, Edge (Chromium). Legacy IE11 lacks `preserve-3d` — content still shows, just no parallax (graceful degradation).
- **Don't** put `overflow: hidden` on `.parallax__group` — it flattens the 3D effect.
- A known Chrome bug lets scaled layers create horizontal scroll; fix by anchoring origins to the right: `perspective-origin-x: 100%; transform-origin-x: 100%;` (or put `perspective` on `<body>`).
- This is hardware-composited → very smooth, even on mobile.
- For a single hero image, the simpler `background-attachment: fixed` trick also reads as "parallax" and is one line — but it can cause jank on mobile (iOS historically drops the fixed background during momentum scroll). Use the 3D technique above for reliability.

**Source:** Keith Clark, "Pure CSS Parallax Websites" — https://keithclark.co.uk/articles/pure-css-parallax-websites/

---

## 6. Number Count-Up & Progress-Bar Animations

### 6A. Count-up with `requestAnimationFrame` (vanilla JS, no library)

Counts "0 → 25" smoothly when a stats card scrolls into view. Uses `requestAnimationFrame` so it stays smooth at 60fps and pauses when the tab is hidden.

#### HTML

```html
<h2 class="counter" data-count-to="25" data-duration="2000">0</h2> ⭐ Stars earned
<div class="progress"><div class="progress__bar" data-progress="80"></div></div>
```

#### CSS

```css
.progress {
  height: 14px;
  background: #e9ecef;
  border-radius: 999px;
  overflow: hidden;
}
.progress__bar {
  height: 100%;
  width: 0%;
  background: linear-gradient(90deg, #51cf66, #37b24d);
  border-radius: 999px;
  transition: width 1.5s cubic-bezier(0.22, 1, 0.36, 1);
}
```

#### JS

```js
// Count-up animation, triggered once when the element enters the viewport
function animateCounter(el) {
  const target   = parseFloat(el.dataset.countTo);
  const duration = parseInt(el.dataset.duration, 10) || 1500;
  let startTime = null;

  const step = (now) => {
    if (!startTime) startTime = now;
    const progress = Math.min((now - startTime) / duration, 1);
    // easeOutQuad for a nicer feel
    const eased = 1 - Math.pow(1 - progress, 2);
    el.textContent = Math.floor(eased * target);
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target;   // guarantee exact final value
  };
  requestAnimationFrame(step);
}

// progress bar
function animateProgress(el) {
  const target = parseFloat(el.dataset.progress);
  requestAnimationFrame(() => { el.style.width = target + '%'; }); // CSS transition does the smoothing
}

const io = new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      obs.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.counter').forEach(el => io.observe(el));
document.querySelectorAll('.progress__bar').forEach(animateProgress);
```

#### Notes
- `Math.min(...,1)` clamps progress so a long-tabbed-away animation never overshoots.
- **Accessibility:** screen readers may read intermediate values as they animate. A robust fix is to put the final number in an `aria-label` and hide the live text: `aria-label="25 stars earned", aria-live="off"`. Always provide the final value for users with `prefers-reduced-motion` (skip straight to target).
- A modern **CSS-only** alternative exists (`@property` + animated custom property + `counter()`), but it is Chromium-only as of 2026 — not safe for a general audience. The JS version above is universal.

**Source:** dev.to "Animated Counter" by sarmunbustillo — https://dev.to/sarmunbustillo/animated-counter-fjo ; CSS-Tricks "Animating Number Counters" — https://css-tricks.com/animating-number-counters/

### 6B. Page-load progress bar (top of screen)

A thin bar at the top that fills as the page loads — useful if you lazy-load images.

```css
#load-bar {
  position: fixed; top: 0; left: 0; height: 4px; width: 0;
  background: #7950f2; z-index: 9999;
  transition: width 0.3s ease;
}
#load-bar.done { width: 100% !important; opacity: 0; transition: width 0.3s ease, opacity 0.4s ease 0.2s; }
```
```html
<div id="load-bar"></div>
```
```js
const bar = document.getElementById('load-bar');
bar.style.width = '30%';
window.addEventListener('load', () => {
  bar.style.width = '100%';
  bar.classList.add('done');
});
```

---

## 7. Staggered List Reveals

Quiz options or list items that appear one-by-one with a small delay between each. Pure CSS + one inline custom property per item.

### Approach A — CSS custom property per item (recommended, dependency-free)

```html
<ul class="quiz-options">
  <li style="--i: 0">🍎 Apple</li>
  <li style="--i: 1">🍌 Banana</li>
  <li style="--i: 2">🍇 Grapes</li>
  <li style="--i: 3">🍊 Orange</li>
</ul>
```

```css
.quiz-options li {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
  /* each item waits (i * 120ms) longer before starting */
  transition-delay: calc(var(--i) * 120ms);
}
.quiz-options.is-revealed li {
  opacity: 1;
  transform: none;
}
@media (prefers-reduced-motion: reduce) {
  .quiz-options li { opacity: 1; transform: none; transition: none; }
}
```

```js
// reveal when the list scrolls into view (reuse the observer from Section 1)
const listObs = new IntersectionObserver((entries, obs) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-revealed'); obs.unobserve(e.target); }
  });
}, { threshold: 0.3 });
document.querySelectorAll('.quiz-options').forEach(l => listObs.observe(l));
```

### Approach B — pure `:nth-child` (no inline styles)

If you know the count up front:

```css
.quiz-options li { opacity: 0; transform: translateY(20px); transition: opacity .4s, transform .4s; }
.quiz-options.is-revealed li:nth-child(1) { transition-delay: 0ms;   }
.quiz-options.is-revealed li:nth-child(2) { transition-delay: 120ms; }
.quiz-options.is-revealed li:nth-child(3) { transition-delay: 240ms; }
.quiz-options.is-revealed li:nth-child(4) { transition-delay: 360ms; }
.quiz-options.is-revealed li { opacity: 1; transform: none; }
```

### Notes
- The custom-property approach scales to any number of items — you just set `--i` to the index in your HTML loop (or generate it with JS: `li.style.setProperty('--i', index)`).
- **Performance:** busy main threads (lots of ads/JS) can stutter long delays on iOS; keep the per-item delay small (≤150ms) and the total cascade short (<1s).
- `prefers-reduced-motion` block makes all items appear instantly — important for cognitive accessibility too.

**Source:** CSS-Tricks, "Different Approaches for Creating a Staggered Animation" — https://css-tricks.com/different-approaches-for-creating-a-staggered-animation/ ; GitHub 30-seconds-of-code "staggered-animation" — https://github.com/Chalarangelo/30-seconds-of-code/blob/master/content/snippets/css/s/staggered-animation.md

---

## 8. Lightweight CDN Libraries (when you want more power)

Reach for these only when vanilla gets tedious (long scroll-driven storylines, complex timelines). All load from a CDN `<script>` tag — **no npm, no build step**.

### 8A. GSAP + ScrollTrigger

Best for: pinned scroll-storylines ("scroll through the water cycle"), scrub-linked animations, sequenced timelines. ~30 KB gzipped, free for most uses.

```html
<head>
  <!-- GSAP core + ScrollTrigger plugin from cdnjs -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
</head>
```

```js
gsap.registerPlugin(ScrollTrigger);

// reveal every .reveal element as it enters, with a tiny stagger
gsap.utils.toArray('.reveal').forEach((el) => {
  gsap.from(el, {
    opacity: 0, y: 50, duration: 0.8, ease: 'power2.out',
    scrollTrigger: { trigger: el, start: 'top 85%', once: true }
  });
});

// a pinned section: progress through the water cycle as you scroll
gsap.timeline({
  scrollTrigger: { trigger: '#water-cycle', start: 'top top', end: '+=1500', scrub: true, pin: true }
})
  .to('#sun',   { y: -120, duration: 1 })
  .to('#cloud', { x: 200,  duration: 1 }, '<')
  .to('#rain',  { opacity: 1, duration: 0.5 });
```

#### Notes
- Add `once: true` to fire once; remove it (and use `toggleActions`) to replay on scroll-back.
- GSAP respects `prefers-reduced-motion` if you wrap with: `if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;`
- Use `gsap.from()` (not `fromTo`) carefully — if JS fails to load, `from` leaves the element at its natural (visible) state, which is a safer fallback than `fromTo` starting hidden.
- CDN: also available from `jsdelivr` (`https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js`).

**Source:** GSAP ScrollTrigger docs — https://gsap.com/docs/v3/Plugins/ScrollTrigger/ ; dev.to "A Beginner's Guide to Scroll-Based Animations with GSAP" — https://dev.to/andrew-saeed/bring-your-scroll-to-life-a-beginners-guide-to-scroll-based-animations-with-gsap-f95

### 8B. AOS (Animate On Scroll)

Simplest possible scroll animations: add `data-aos="fade-up"` and include one CSS + one JS file. ~4 KB. Good when you don't want to write any JS.

```html
<head>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.js"></script>
</head>
<body>
  <div data-aos="fade-up" data-aos-delay="100">I fade up when scrolled to.</div>
  <div data-aos="zoom-in" data-aos-delay="200">I zoom in next.</div>
  <script>AOS.init({ once: true, duration: 700, offset: 80 });</script>
</body>
```

#### Notes
- Built-in respect for `prefers-reduced-motion` (it ships a disable rule in its CSS).
- Limit animations: too many on a long page can cause jank on low-end phones. The IntersectionObserver approach in Section 1 gives you the same effect with zero dependencies.

**Source:** AOS GitHub — https://github.com/michalsnik/aos

### 8C. Anime.js (for choreographed SVG/icon animations)

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js"></script>
```
```js
// bounce a star icon on correct answer
anime({ targets: '.star-badge', scale: [1, 1.3, 1], rotate: [-8, 8, 0],
        duration: 600, easing: 'easeOutElastic(1, .6)' });
```

### 8D. Lottie (for designer-made JSON animations)

If you (or a designer) make an animation in Adobe After Effects, export it via the Lottie plugin and play it on the page — crisp at any size, tiny file.

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js"></script>
<div id="confetti" style="width:200px;height:200px"></div>
<script>
  lottie.loadAnimation({
    container: document.getElementById('confetti'),
    renderer: 'svg', loop: false, autoplay: true,
    path: 'confetti.json'   // your exported Lottie JSON
  });
</script>
```

---

## Universal Accessibility & Performance Checklist

1. **`prefers-reduced-motion`** — wrap every animation. The CSS block below is a safe global override to put at the top of your stylesheet:

   ```css
   @media (prefers-reduced-motion: reduce) {
     *, *::before, *::after {
       animation-duration: 0.01ms !important;
       animation-iteration-count: 1 !important;
       transition-duration: 0.01ms !important;
       scroll-behavior: auto !important;
     }
   }
   ```
2. **Don't hide content behind JS-only reveals.** Either add the hidden state with JS (so no-JS users see content), or include `<noscript><style>.reveal{opacity:1;transform:none}</style></noscript>`.
3. **Animate `transform` and `opacity`** — they're GPU-composited. Avoid animating layout properties (`top/left/width/height/margin`) which trigger reflow.
4. **`will-change`** on elements that will animate — but only on the ones that actually will, and remove it after, or it bloats memory.
5. **Touch targets ≥ 44×44 px** for kid-friendly tapping.
6. **Keyboard parity** — every swipe/flip must have an Enter/Space or arrow-key equivalent (shown above).
7. **Screen-reader values** for count-ups — set the final value in an `aria-label` and don't announce every intermediate number.
8. **Test on a real low-end Android phone** — desktop DevTools won't show the jank that an elementary student's hand-me-down tablet will.

---

## Sources

- CSS-Tricks — Scroll-Triggered Animation with Vanilla JavaScript: https://css-tricks.com/scroll-triggered-animation-vanilla-javascript/
- MDN — Intersection Observer API: https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
- MDN — scroll-snap-type: https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-snap-type
- W3Schools — How To Create a Flip Card: https://www.w3schools.com/howto/howto_css_flip_card.asp
- David DeSandro — Intro to CSS 3D transforms, Card Flip: https://3dtransforms.desandro.com/card-flip
- Smashing Magazine — Magic Flip Cards: Solving A Common Sizing Problem: https://www.smashingmagazine.com/2020/02/magic-flip-cards-common-sizing-problem/
- CSS-Tricks — Animating Layouts with the FLIP Technique: https://css-tricks.com/animating-layouts-with-the-flip-technique/
- CSS-Tricks — How to Recreate the Ripple Effect of Material Design Buttons: https://css-tricks.com/how-to-recreate-the-ripple-effect-of-material-design-buttons/
- CSS-Tricks — Simple Swipe with Vanilla JavaScript: https://css-tricks.com/simple-swipe-with-vanilla-javascript/
- Stack Overflow — Detect a finger swipe through JavaScript: https://stackoverflow.com/questions/2264072/detect-a-finger-swipe-through-javascript-on-the-iphone-and-android
- Keith Clark — Pure CSS Parallax Websites: https://keithclark.co.uk/articles/pure-css-parallax-websites/
- Keith Clark — Practical CSS Parallax: https://keithclark.co.uk/articles/practical-css-parallax/
- CSS-Tricks — Animating Number Counters: https://css-tricks.com/animating-number-counters/
- dev.to — Animated Counter (sarmunbustillo): https://dev.to/sarmunbustillo/animated-counter-fjo
- getbutterfly — Animated JS Counter-Up with Intersection Observer: https://getbutterfly.com/animated-javascript-counter-up-with-the-intersection-observer-api/
- CSS-Tricks — Different Approaches for Creating a Staggered Animation: https://css-tricks.com/different-approaches-for-creating-a-staggered-animation/
- 30-seconds-of-code — staggered-animation snippet: https://github.com/Chalarangelo/30-seconds-of-code/blob/master/content/snippets/css/s/staggered-animation.md
- GSAP — ScrollTrigger docs: https://gsap.com/docs/v3/Plugins/ScrollTrigger/
- dev.to — Beginner's Guide to Scroll-Based Animations with GSAP: https://dev.to/andrew-saeed/bring-your-scroll-to-life-a-beginners-guide-to-scroll-based-animations-with-gsap-f95
- AOS (Animate On Scroll) GitHub: https://github.com/michalsnik/aos
- MDN — prefers-reduced-motion: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion