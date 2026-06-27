# Interactive Learning Activities — Vanilla HTML/CSS/JS (Grade 3-4, ages 8-10)

Research for the static tutoring site (Cloudflare-hosted, NO build step, NO React).
Every snippet below is a **single self-contained `.html` file** — paste into a file and double-click to run.
All are vanilla JS with no frameworks and no CDNs (except where trivially removable; noted).

Each activity is mapped to a real community source (CodePen, GitHub repo/gist, tutorial site).
Code was extracted from those sources and lightly adapted for age 8-10 (larger fonts, emoji,
kid-friendly colors, touch handling). Provenance is noted under each.

> **Cross-cutting gotchas (apply to several activities):**
> - The native **HTML5 Drag and Drop API does NOT fire on touch devices** (iPads/Chromebooks).
>   Activities 4, 7, 9 use it. Where noted, a click/tap fallback is included. For full touch
>   drag support, adopt the pointer-events approach (see Notes under Activity 9).
> - Keep word lists short (6-10 items) to match Grade 3-4 attention spans.
> - Use lowercase words or `.toLowerCase()` matching to avoid "almost right" frustration.
> - Put `touch-action: none` on canvas/scratch elements so the page doesn't scroll during play.

---

## Table of Contents
1. Reveal / Scratch-off Card
2. Word Search Grid
3. Matching Game (click term → definition)
4. Drag-and-Drop Sorting (categorize into buckets)
5. Flip Cards (3D flashcard)
6. Hangman / Guessing Game
7. Fill-in-the-Blank with Word Bank (drag words into slots)
8. Memory Match (concentration) grid
9. Sequencing / Timeline drag-to-reorder
10. True/False + Multiple Choice with animated feedback

---

## 1. Reveal / Scratch-off Card

**Gameplay & learning:** A canvas overlay painted with an opaque "foil" sits on top of an answer.
The child drags/finger-scratches to erase the foil (canvas `destination-out` composite) and reveal
the hidden vocabulary word or math fact underneath. Great for "guess then check" — kids commit an
answer in their head, then scratch to verify, building self-testing habits without the shame of
being "wrong."

**Difficulty:** Easy.

**Gotchas:**
- Canvas must be sized to `card.offsetWidth/Height` in JS (CSS width alone scales the bitmap and
  blurs the eraser).
- `touch-action: none` on the canvas + `preventDefault()` on touch events are needed so the page
  doesn't scroll while the child scratches.
- To check "fully revealed" you can sample `getImageData` alpha; for kids a partial scratch is
  usually fine — they keep going.

**Source:** Tuts+ (Esther Vaati) — "How to Create a Scratch Card Effect in Vanilla JavaScript"
<https://webdesign.tutsplus.com/how-to-create-a-scratch-card-effect-in-vanilla-javascript--cms-108922t>
Alternate reference: CodePen by dudleystorey <https://codepen.io/dudleystorey/pen/yJQxLX>

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Scratch Reveal</title>
<style>
  body {
    font-family: system-ui, sans-serif;
    background: #f3f1f5;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    min-height: 100vh; margin: 0;
  }
  #card {
    position: relative; width: 320px; height: 120px;
    border: 2px solid #ddd; border-radius: 12px;
    background: #fff; overflow: hidden;
  }
  #answer {
    font-size: 40px; font-weight: 800; text-align: center;
    line-height: 120px; color: #333;
  }
  #scratch {
    position: absolute; top: 0; left: 0; cursor: crosshair;
    touch-action: none;
  }
</style>
</head>
<body>
  <h2>Scratch to reveal the answer!</h2>
  <div id="card">
    <div id="answer">12 &times; 8 = 96</div>
    <canvas id="scratch"></canvas>
  </div>

<script>
const answerEl = document.getElementById('answer');
const canvas   = document.getElementById('scratch');
const card     = document.getElementById('card');
const ctx      = canvas.getContext('2d');

canvas.width  = card.offsetWidth;
canvas.height = card.offsetHeight;

const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
grad.addColorStop(0, '#DFBD69');
grad.addColorStop(1, '#926F34');
ctx.fillStyle = grad;
ctx.fillRect(0, 0, canvas.width, canvas.height);

let isDrawing = false;

function pos(e) {
  const r = canvas.getBoundingClientRect();
  const p = e.touches ? e.touches[0] : e;
  return { x: p.clientX - r.left, y: p.clientY - r.top };
}

function scratch(e) {
  if (!isDrawing) return;
  const { x, y } = pos(e);
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(x, y, 20, 0, Math.PI * 2);
  ctx.fill();
}

canvas.addEventListener('mousedown', () => isDrawing = true);
canvas.addEventListener('mouseup',   () => isDrawing = false);
canvas.addEventListener('mouseleave',() => isDrawing = false);
canvas.addEventListener('mousemove', scratch);

canvas.addEventListener('touchstart', (e) => { isDrawing = true; scratch(e); e.preventDefault(); }, {passive:false});
canvas.addEventListener('touchmove',  (e) => { scratch(e); e.preventDefault(); }, {passive:false});
canvas.addEventListener('touchend',  () => isDrawing = false);
</script>
</body>
</html>
```

---

## 2. Word Search Grid

**Gameplay & learning:** A grid of letters is shown with a word list. The player clicks and drags
across letters in a straight line (horizontal/vertical/diagonal) to highlight a hidden word; matched
words turn green and get crossed off the list. For ages 8-10 it builds spelling pattern recognition,
visual scanning, and vocabulary recall without feeling like drill.

**Difficulty:** Easy-medium.

**Gotchas:**
- Selection must constrain to straight lines (same row, same column, or perfect 45° diagonal) — the
  `cellsBetween` guard enforces this.
- Words may be placed forward or reversed; check both `word` and reversed.
- Mouse events only — no touch support out of the box; for tablets add pointer/touch events.
- A word that fails to place after N tries is silently dropped — for larger lists bump the retry count.

**Sources:**
- Grid-generation + word-placement algorithm: `nooraftab/wordsearch`
  <https://github.com/nooraftab/wordsearch> (jQuery removed, plain DOM added)
- Click-adjacent selection concept: freeCodeCamp word-search tutorial
  <https://www.freecodecamp.org/news/build-a-word-search-game-using-html-css-and-javascript/>

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Word Search</title>
<style>
  body{font-family:system-ui,Arial,sans-serif;background:#fdf6e3;color:#333;padding:1rem}
  h1{font-size:1.4rem}
  #grid{display:grid;gap:2px;user-select:none;margin:1rem 0}
  .cell{width:34px;height:34px;display:flex;align-items:center;justify-content:center;
        background:#fff;border:1px solid #d9c9a3;font-weight:600}
  .cell.sel{background:#ffe08a}
  .cell.found{background:#a5d6a7;color:#1b5e20}
  #words span{display:inline-block;margin:.2rem .4rem;padding:.15rem .5rem;
              border:1px solid #bbb;border-radius:999px;background:#fff}
  #words span.done{text-decoration:line-through;color:#888;background:#e8f5e9}
</style>
</head>
<body>
<h1>Find the words!</h1>
<div id="grid"></div>
<p id="words"></p>
<script>
const SIZE=10;
const WORDS=["CAT","DOG","SUN","TREE","BOOK","MILK"];
let grid=[], found=new Set(), sel=[];

function placeWords(){
  grid=Array.from({length:SIZE},()=>Array(SIZE).fill(null));
  const dirs=[[0,1],[1,0],[1,1],[1,-1]]; // right, down, diag-down-right, diag-down-left
  for(const w of WORDS){
    let placed=false;
    for(let t=0;t<200&&!placed;t++){
      const d=dirs[Math.floor(Math.random()*dirs.length)];
      const r=Math.floor(Math.random()*SIZE), c=Math.floor(Math.random()*SIZE);
      const endR=r+d[0]*(w.length-1), endC=c+d[1]*(w.length-1);
      if(endR<0||endR>=SIZE||endC<0||endC>=SIZE) continue;
      let ok=true;
      for(let k=0;k<w.length;k++){
        const rr=r+d[0]*k, cc=c+d[1]*k;
        if(grid[rr][cc] && grid[rr][cc]!==w[k]){ok=false;break;}
      }
      if(!ok) continue;
      for(let k=0;k<w.length;k++) grid[r+d[0]*k][c+d[1]*k]=w[k];
      placed=true;
    }
  }
  for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++)
    if(!grid[r][c]) grid[r][c]=String.fromCharCode(65+Math.floor(Math.random()*26));
}

function render(){
  const g=document.getElementById('grid');
  g.style.gridTemplateColumns=`repeat(${SIZE},34px)`;
  g.innerHTML='';
  for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++){
    const d=document.createElement('div');
    d.className='cell'; d.textContent=grid[r][c];
    d.dataset.r=r; d.dataset.c=c;
    g.appendChild(d);
  }
  const w=document.getElementById('words'); w.innerHTML='';
  WORDS.forEach(x=>{const s=document.createElement('span');s.textContent=x;s.dataset.w=x;w.appendChild(s);});
}

const gridEl=()=>document.getElementById('grid');
const idx=(r,c)=>r*SIZE+c;
let dragging=false,startCell=null;
function clearSel(){[...gridEl().children].forEach(c=>c.classList.remove('sel'));sel=[];}

function cellsBetween(a,b){
  const r1=+a.dataset.r,c1=+a.dataset.c,r2=+b.dataset.r,c2=+b.dataset.c;
  const dr=Math.sign(r2-r1),dc=Math.sign(c2-c1);
  if(dr!==0&&dc!==0&&Math.abs(r2-r1)!==Math.abs(c2-c1)) return null;
  if(dr===0&&dc===0) return [a];
  const len=Math.max(Math.abs(r2-r1),Math.abs(c2-c1));
  const out=[];
  for(let k=0;k<=len;k++){
    const r=r1+dr*k,c=c1+dc*k;
    if(r<0||r>=SIZE||c<0||c>=SIZE) return null;
    out.push(gridEl().children[idx(r,c)]);
  }
  return out;
}

gridEl().addEventListener('mousedown',e=>{
  if(!e.target.classList.contains('cell'))return;
  dragging=true;startCell=e.target;clearSel();e.target.classList.add('sel');sel=[e.target];
});
gridEl().addEventListener('mouseover',e=>{
  if(!dragging||!e.target.classList.contains('cell'))return;
  const path=cellsBetween(startCell,e.target);
  if(path){clearSel();path.forEach(c=>c.classList.add('sel'));sel=path;}
});
window.addEventListener('mouseup',()=>{
  if(!dragging)return;dragging=false;
  const word=sel.map(c=>c.textContent).join('');
  const rev=word.split('').reverse().join('');
  const match=WORDS.includes(word)?word:(WORDS.includes(rev)?rev:null);
  if(match && !found.has(match)){
    sel.forEach(c=>c.classList.add('found'));
    found.add(match);
    const span=document.querySelector(`#words span[data-w="${match}"]`);
    if(span)span.classList.add('done');
    if(found.size===WORDS.length) setTimeout(()=>alert('You found them all!'),50);
  }
  clearSel();
});

placeWords();render();
</script>
</body>
</html>
```

---

## 3. Matching Game (click term → definition)

**Gameplay & learning:** Two columns — vocabulary terms on the left, definitions on the right
(shuffled). The student clicks a term, then clicks the definition they think matches. A correct
pair locks in green and stays; a wrong pair shakes and resets so they can try again. Builds recall
and discrimination for vocabulary/definitions without the memory-load of a flip-card game.

**Difficulty:** Easy.

**Gotchas:**
- The original uses `e.target.parentNode` because the text lives in a `<span>` inside the `<li>` —
  keep that wrapper or change the selector. (This version uses `closest("li")`, so either works.)
- The `pairs` object is the answer key (term index → def index).
- Shuffle runs on load and on Reset so kids can replay.

**Source:** CodePen "KodEtude - Matching Quiz" by Carlito (x-dream)
<https://codepen.io/x-dream/pen/ZGbBVd> (extracted via crawl4ai). Adapted with a shake-on-wrong
animation (original deselected silently).

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Vocabulary Matching</title>
<style>
  * { box-sizing: border-box; font-family: 'Comic Sans MS', 'Trebuchet MS', sans-serif; }
  body { background: #fff8e1; margin: 0; padding: 20px; text-align: center; }
  h1 { color: #d84315; margin: 0 0 6px; }
  p#hint { color: #6d4c41; margin: 0 0 18px; }
  #board { display: flex; justify-content: center; gap: 30px; flex-wrap: wrap; }
  ul { list-style: none; padding: 0; margin: 0; width: 260px; display: flex; flex-direction: column; gap: 10px; }
  h2 { font-size: 18px; color: #4e342e; }
  li { background: #fff; border: 3px solid #ffb74d; border-radius: 12px; padding: 14px; cursor: pointer; transition: transform .15s, box-shadow .15s; box-shadow: 0 3px 0 #ffb74d; min-height: 52px; display: flex; align-items: center; justify-content: center; text-align: center; }
  li:hover { transform: translateY(-2px); box-shadow: 0 5px 0 #ffb74d; }
  li[data-selected] { outline: 4px solid #1e88e5; outline-offset: 2px; transform: scale(1.04); }
  li.score { background: #c8e6c9; border-color: #43a047; box-shadow: 0 3px 0 #43a047; cursor: default; }
  li.shake { animation: shake .4s; border-color: #e53935; }
  @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)} }
  #controls { margin-top: 22px; }
  button { background: #1e88e5; color: #fff; border: none; border-radius: 10px; padding: 12px 22px; font-size: 16px; cursor: pointer; box-shadow: 0 4px 0 #1565c0; }
  button:active { transform: translateY(2px); box-shadow: 0 2px 0 #1565c0; }
  #done { font-size: 20px; color: #2e7d32; font-weight: bold; margin-top: 14px; min-height: 26px; }
</style>
</head>
<body>
  <h1>Match the Word to Its Meaning</h1>
  <p id="hint">Click a word, then click its meaning. Get them all!</p>
  <div id="board">
    <div>
      <h2>Words</h2>
      <ul id="terms"></ul>
    </div>
    <div>
      <h2>Meanings</h2>
      <ul id="defs"></ul>
    </div>
  </div>
  <div id="controls">
    <button id="resetBtn">Shuffle &amp; Reset</button>
  </div>
  <div id="done"></div>

<script>
// Answer-key pattern adapted from CodePen "KodEtude - Matching Quiz" (x-dream)
// https://codepen.io/x-dream/pen/ZGbBVd
var data = {
  terms: [
    { i: 0, text: "Noun" },
    { i: 1, text: "Verb" },
    { i: 2, text: "Adjective" },
    { i: 3, text: "Habitat" },
    { i: 4, text: "Predator" }
  ],
  definitions: [
    { i: 0, text: "A person, place, or thing" },
    { i: 1, text: "An action word" },
    { i: 2, text: "A word that describes" },
    { i: 3, text: "Where an animal lives" },
    { i: 4, text: "An animal that hunts others" }
  ],
  pairs: { 0: 0, 1: 1, 2: 2, 3: 3, 4: 4 }  // term index -> def index
};

var selectedTerm = null, selectedDef = null;
var termsBox = document.querySelector("#terms");
var defsBox  = document.querySelector("#defs");

function isMatch(t, d) { return data.pairs[t] === d; }

function build(list, box) {
  box.innerHTML = "";
  list.forEach(function(item){
    var li = document.createElement("li");
    li.setAttribute("data-index", item.i);
    li.innerHTML = "<span>" + item.text + "</span>";
    box.appendChild(li);
  });
}

function tryMatch() {
  if (selectedTerm === null || selectedDef === null) return;
  var tEl = termsBox.querySelector("li[data-index='" + selectedTerm + "']");
  var dEl = defsBox.querySelector("li[data-index='" + selectedDef + "']");
  if (isMatch(selectedTerm, selectedDef)) {
    tEl.classList.add("score");
    dEl.classList.add("score");
    tEl.removeAttribute("data-selected");
    dEl.removeAttribute("data-selected");
    if (document.querySelectorAll("li.score").length === data.terms.length * 2) {
      document.querySelector("#done").textContent = "You did it! 🎉";
    }
  } else {
    [tEl, dEl].forEach(function(el){
      el.classList.add("shake");
      setTimeout(function(){ el.classList.remove("shake"); }, 400);
      el.removeAttribute("data-selected");
    });
  }
  selectedTerm = null; selectedDef = null;
}

termsBox.addEventListener("click", function(e){
  var li = e.target.closest("li");
  if (!li || li.classList.contains("score")) return;
  if (selectedTerm !== null) termsBox.querySelector("li[data-index='" + selectedTerm + "']").removeAttribute("data-selected");
  li.setAttribute("data-selected", "true");
  selectedTerm = Number(li.getAttribute("data-index"));
  tryMatch();
});

defsBox.addEventListener("click", function(e){
  var li = e.target.closest("li");
  if (!li || li.classList.contains("score")) return;
  if (selectedDef !== null) defsBox.querySelector("li[data-index='" + selectedDef + "']").removeAttribute("data-selected");
  li.setAttribute("data-selected", "true");
  selectedDef = Number(li.getAttribute("data-index"));
  tryMatch();
});

function shuffle(array){
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = array[i]; array[i] = array[j]; array[j] = tmp;
  }
  return array;
}

function reset(){
  shuffle(data.terms);
  shuffle(data.definitions);
  build(data.terms, termsBox);
  build(data.definitions, defsBox);
  selectedTerm = null; selectedDef = null;
  document.querySelector("#done").textContent = "";
}

document.querySelector("#resetBtn").addEventListener("click", reset);
reset();
</script>
</body>
</html>
```

---

## 4. Drag-and-Drop Sorting (categorize into buckets)

**Gameplay & learning:** A row of animal cards sits in a "pool". The student drags each animal into
the correct bucket — Mammals or Reptiles. A correct drop turns green and locks in; a wrong drop
flashes red and snaps back to the pool so they can reconsider. Teaches classification, a core
Grade 3-4 science skill.

**Difficulty:** Easy.

**Gotchas:**
- `dragover` MUST call `e.preventDefault()` or `drop` never fires (the #1 DnD beginner bug).
- On a wrong drop, simply not appending the node leaves it where it was (the pool), which gives
  the snap-back for free.
- HTML5 DnD does NOT work on touch devices — for tablets/phones use a pointer-events polyfill.

**Source:** DigitalOcean tutorial "How To Create Drag and Drop Elements with Vanilla JavaScript"
<https://www.digitalocean.com/community/tutorials/js-drag-and-drop-vanilla-js>
Adapted to two-bucket categorize with correct/wrong validation and snap-back.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Sort the Animals</title>
<style>
  * { box-sizing: border-box; font-family: 'Comic Sans MS', 'Trebuchet MS', sans-serif; }
  body { background: #e8f5e9; margin: 0; padding: 20px; text-align: center; }
  h1 { color: #2e7d32; margin: 0 0 16px; }
  #pool { background: #fff; border: 3px dashed #81c784; border-radius: 14px; padding: 14px; min-height: 90px; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-bottom: 24px; }
  .card { background: #fff3e0; border: 2px solid #ffb74d; border-radius: 10px; padding: 12px 16px; font-size: 18px; cursor: grab; user-select: none; box-shadow: 0 3px 0 #ffb74d; }
  .card:active { cursor: grabbing; }
  .card.correct { background: #c8e6c9; border-color: #43a047; box-shadow: 0 3px 0 #43a047; cursor: default; }
  .card.wrong { animation: jiggle .4s; border-color: #e53935; }
  @keyframes jiggle { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }
  #buckets { display: flex; justify-content: center; gap: 24px; flex-wrap: wrap; }
  .bucket { width: 240px; min-height: 220px; border: 3px solid; border-radius: 14px; padding: 12px; display: flex; flex-direction: column; gap: 10px; align-items: center; }
  .bucket h2 { margin: 0 0 6px; font-size: 20px; }
  #mammals { background: #fffde7; border-color: #fbc02d; }
  #mammals h2 { color: #f57f17; }
  #reptiles { background: #e1f5fe; border-color: #0288d1; }
  #reptiles h2 { color: #01579b; }
  .bucket.over { background: #fff59d !important; }
  #done { font-size: 20px; color: #2e7d32; font-weight: bold; margin-top: 18px; min-height: 26px; }
</style>
</head>
<body>
  <h1>Drag each animal to its group</h1>
  <div id="pool" ondragover="onDragOver(event)" ondrop="onDrop(event, 'pool')">
    <div class="card" draggable="true" ondragstart="onDragStart(event)" data-category="mammals">Dog 🐶</div>
    <div class="card" draggable="true" ondragstart="onDragStart(event)" data-category="reptiles">Snake 🐍</div>
    <div class="card" draggable="true" ondragstart="onDragStart(event)" data-category="mammals">Whale 🐋</div>
    <div class="card" draggable="true" ondragstart="onDragStart(event)" data-category="reptiles">Turtle 🐢</div>
    <div class="card" draggable="true" ondragstart="onDragStart(event)" data-category="mammals">Rabbit 🐰</div>
    <div class="card" draggable="true" ondragstart="onDragStart(event)" data-category="reptiles">Lizard 🦎</div>
  </div>
  <div id="buckets">
    <div id="mammals" class="bucket" data-accept="mammals" ondragover="onDragOver(event)" ondrop="onDrop(event, 'mammals')">
      <h2>🦁 Mammals</h2>
    </div>
    <div id="reptiles" class="bucket" data-accept="reptiles" ondragover="onDragOver(event)" ondrop="onDrop(event, 'reptiles')">
      <h2>🦎 Reptiles</h2>
    </div>
  </div>
  <div id="done"></div>

<script>
// HTML5 Drag and Drop API pattern from DigitalOcean tutorial
// https://www.digitalocean.com/community/tutorials/js-drag-and-drop-vanilla-js
function onDragStart(event) {
  event.dataTransfer.setData("text/plain", event.target.id || "card-" + Math.random());
  event.dataTransfer.effectAllowed = "move";
  event.target.id = event.target.id || ("card-" + Date.now());
  window._draggedEl = event.target;
}

function onDragOver(event) {
  event.preventDefault(); // REQUIRED or drop won't fire
  event.currentTarget.classList.add("over");
}

document.addEventListener("dragleave", function(e){
  if (e.target.classList && e.target.classList.contains("bucket")) e.target.classList.remove("over");
});

function onDrop(event, bucketName) {
  event.preventDefault();
  event.currentTarget.classList.remove("over");
  var el = window._draggedEl;
  if (!el || el.classList.contains("correct")) return;

  if (bucketName === "pool") {
    document.querySelector("#pool").appendChild(el);
    return;
  }

  var bucket = event.currentTarget;
  if (el.getAttribute("data-category") === bucket.getAttribute("data-accept")) {
    el.classList.add("correct");
    el.removeAttribute("draggable");
    el.removeAttribute("ondragstart");
    bucket.appendChild(el);
    if (document.querySelectorAll(".card.correct").length === 6) {
      document.querySelector("#done").textContent = "All sorted! Great job! 🎉";
    }
  } else {
    el.classList.add("wrong");
    setTimeout(function(){ el.classList.remove("wrong"); }, 400);
  }
}
</script>
</body>
</html>
```

---

## 5. Flip Cards (3D Flashcard)

**Gameplay & learning:** A card with a front (the question — e.g. "What is 7 × 6?") and a back
(the answer "42") rotates 180° on the Y axis on click/tap, using CSS `transform-style:
preserve-3d` + `backface-visibility: hidden`. Kids tap to flip and self-check, then tap to flip
back and try the next card. The 3D flip is the reward that makes drilling facts feel like a game.

**Difficulty:** Easy.

**Gotchas:**
- Both faces need `backface-visibility: hidden` (and the `-webkit-` prefix for older iOS Safari)
  or you'll see a mirror-image ghost during the flip.
- The back face must be pre-rotated `rotateY(180deg)` so it shows up correctly after the parent rotates.
- Put the click listener on the **container**, not the inner faces, so it always toggles.
- Use `click` (not `hover`) for kids on tablets — hover-only cards are unusable on touchscreens.

**Sources:**
- DEV Community (Ellaine Tolentino) "Cards that Flip" <https://dev.to/tolentinoel/cards-that-flip-169o>
- Medium "Coding with Carla" — Build a card that flips on click
  <https://medium.com/coding-with-carla/build-a-card-that-flips-on-click-with-html-css-and-vanilla-javascript-part-1-937cd2242c90>

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Flip Cards</title>
<style>
  body {
    font-family: system-ui, sans-serif;
    background: #f3f1f5;
    display: flex; flex-wrap: wrap; gap: 20px;
    justify-content: center; padding: 40px 20px; margin: 0;
  }
  .card-container {
    width: 180px; height: 200px; perspective: 1000px;
    border-radius: 16px; cursor: pointer;
  }
  .flip-card {
    position: relative; width: 100%; height: 100%;
    transition: transform 0.6s; transform-style: preserve-3d;
  }
  .card-container.flip .flip-card { transform: rotateY(180deg); }
  .flip-card-front, .flip-card-back {
    position: absolute; width: 100%; height: 100%;
    border-radius: 16px; display: flex; align-items: center;
    justify-content: center; font-size: 22px; font-weight: bold;
    text-align: center; padding: 16px;
    backface-visibility: hidden; -webkit-backface-visibility: hidden;
  }
  .flip-card-front { background: #333; color: #fff; }
  .flip-card-back {
    background: #05486b; color: #fff; transform: rotateY(180deg);
  }
</style>
</head>
<body>
  <div class="card-container">
    <div class="flip-card">
      <div class="flip-card-front">7 &times; 6 = ?</div>
      <div class="flip-card-back">42</div>
    </div>
  </div>

  <div class="card-container">
    <div class="flip-card">
      <div class="flip-card-front">Capital of France?</div>
      <div class="flip-card-back">Paris</div>
    </div>
  </div>

  <div class="card-container">
    <div class="flip-card">
      <div class="flip-card-front">12 &divide; 4 = ?</div>
      <div class="flip-card-back">3</div>
    </div>
  </div>

<script>
document.querySelectorAll('.card-container').forEach(card => {
  card.addEventListener('click', () => card.classList.toggle('flip'));
});
</script>
</body>
</html>
```

---

## 6. Hangman / Guessing Game

**Gameplay & learning:** A word is hidden as underscores; the player clicks letter buttons to
guess. Correct letters reveal in place; wrong guesses cost a life shown as ❤️ → 💔. Builds
spelling, phonics, and vocabulary with low reading load — no ASCII gallows, just emoji hearts,
which suits 8-10 year olds.

**Difficulty:** Easy.

**Gotchas:**
- Word list is hardcoded; swap in your vocabulary.
- Use lowercase words and lowercase buttons so matching is exact.
- Inline `onclick` per button is fine for ~26 buttons; no perf concern.

**Source:** Adapted from `Utkarsh575/hangman` (vanilla JS)
<https://github.com/Utkarsh575/hangman> — Tailwind-CDN styling replaced with plain CSS;
`<img>` gallows progression swapped for an emoji-hearts lives display.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Guess the Word</title>
<style>
  body{font-family:system-ui,Arial,sans-serif;background:#e3f2fd;color:#0d47a1;padding:1rem;text-align:center}
  h1{font-size:1.4rem}
  #word{font-size:2rem;letter-spacing:.5rem;margin:1rem 0;font-weight:700}
  #lives{font-size:1.6rem;margin:.5rem 0}
  #keyboard{display:flex;flex-wrap:wrap;justify-content:center;gap:.4rem;max-width:440px;margin:1rem auto}
  #keyboard button{width:38px;height:42px;font-size:1rem;border:1px solid #90caf9;border-radius:6px;background:#fff;cursor:pointer}
  #keyboard button:disabled{background:#cfd8dc;color:#888;cursor:default}
  #keyboard button.correct{background:#a5d6a7}
  #keyboard button.wrong{background:#ef9a9a}
  #reset{margin-top:1rem;padding:.6rem 1.2rem;border:none;border-radius:8px;background:#1976d2;color:#fff;font-size:1rem;cursor:pointer}
  #msg{font-size:1.3rem;font-weight:700;margin-top:.5rem}
</style>
</head>
<body>
<h1>Guess the Word</h1>
<p id="lives"></p>
<p id="word"></p>
<div id="keyboard"></div>
<p id="msg"></p>
<button id="reset">New Word</button>
<script>
const WORDS=["planet","garden","monkey","rabbit","winter","bridge","pencil","dolphin","kitchen","forest"];
let answer="", guessed=[], wrong=0;
const MAX_WRONG=6;

function pick(){answer=WORDS[Math.floor(Math.random()*WORDS.length)];guessed=[];wrong=0;render();}

function render(){
  document.getElementById('word').textContent=
    answer.split('').map(l=>guessed.includes(l)?l:'_').join(' ');
  const hearts=Array.from({length:MAX_WRONG},(_,i)=>i<wrong?'💔':'❤️').join(' ');
  document.getElementById('lives').textContent='Lives: '+hearts;
  const kb=document.getElementById('keyboard');kb.innerHTML='';
  const over=wrong>=MAX_WRONG;
  const won=answer.split('').every(l=>guessed.includes(l));
  'abcdefghijklmnopqrstuvwxyz'.split('').forEach(l=>{
    const b=document.createElement('button');b.textContent=l;
    b.disabled=guessed.includes(l)||over||won;
    if(guessed.includes(l))b.classList.add(answer.includes(l)?'correct':'wrong');
    if(!over&&!won)b.onclick=()=>guess(l);
    kb.appendChild(b);
  });
  const msg=document.getElementById('msg');
  if(won) msg.textContent='You won! 🎉';
  else if(over) msg.textContent='You lost. The word was: '+answer;
  else msg.textContent='';
}

function guess(l){
  if(guessed.includes(l)||wrong>=MAX_WRONG)return;
  guessed.push(l);
  if(!answer.includes(l))wrong++;
  render();
}

document.getElementById('reset').onclick=pick;
pick();
</script>
</body>
</html>
```

### Alternative variant — whole-word + letter guessing (erichlof gist)

This version lets a confident child guess the whole word at once (risky — a wrong whole-word guess
ends the game). Single self-contained file, already vanilla, no dependencies.

**Source:** erichlof gist "A simple Hangman game written in HTML and JavaScript"
<https://gist.github.com/erichlof/d9dd70a3657ef082162791561ff39a2b>

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Hangman</title>
<style>
  body{font-family:system-ui,sans-serif;background:#fff8e1;padding:24px;max-width:680px;margin:auto}
  h2{margin-top:0}
  #hangmanWord{font-size:2rem;letter-spacing:8px;font-family:monospace}
  input{padding:6px;font-size:1rem}
  button{padding:6px 14px;font-size:1rem;cursor:pointer}
</style>
</head>
<body>
  <h2>Hangman!</h2>
  <div id="hangmanWord"></div><br>
  <div id="playerInfo"></div>
  <div id="guessesLeft"></div><br>

  <label>Guess a letter: </label><br>
  <input type="text" id="letterGuess" placeholder="enter a single letter">
  <input type="submit" value="Submit" onclick="handleLetterGuess()">
  <br><br>
  <label>Or, if you think you know the answer, guess the word:</label><br>
  <input type="text" id="wordGuess" placeholder="enter the whole word">
  <input type="submit" value="Submit" onclick="handleWordGuess()">
  <p>(Warning: an incorrect word guess will end the game!)</p>

<script>
/* Source: erichlof gist — A simple Hangman game in HTML + JavaScript (vanilla, single file) */
let wordList = ["javascript", "monkey", "amazing", "pancake", "rainbow", "dinosaur", "pencil", "garden"];
let secretWord, answerArray = [], guessedArray = [], remainingLetters;
let letterGuess, wordGuess, alreadyGuessed = false;
let numGuessesLeft = 10;
let hangmanWordElement = document.getElementById("hangmanWord");
let playerInfoElement  = document.getElementById("playerInfo");
let guessesLeftElement = document.getElementById("guessesLeft");
let letterInputElement = document.getElementById("letterGuess");
let wordInputElement   = document.getElementById("wordGuess");

setupNewGame();

function handleLetterGuess() {
  letterGuess = letterInputElement.value.toLowerCase();
  letterInputElement.value = "";
  updateGameState();
}

function handleWordGuess() {
  wordGuess = wordInputElement.value.toLowerCase().trim();
  letterInputElement.value = "";
  wordInputElement.value = "";
  if (wordGuess === secretWord)
    playerInfoElement.innerHTML = "Good job! The answer was <b>" + secretWord + "</b>. - Starting new game...";
  else
    playerInfoElement.innerHTML = "Sorry, that's incorrect. The answer was <b>" + secretWord + "</b>. - Starting new game...";
  setTimeout(setupNewGame, 4000);
}

function setupNewGame() {
  playerInfoElement.innerHTML = "Good luck!";
  numGuessesLeft = 10;
  secretWord = wordList[Math.floor(Math.random() * wordList.length)];
  answerArray = []; guessedArray = [];
  for (let i = 0; i < secretWord.length; i++) answerArray[i] = '_';
  remainingLetters = secretWord.length;
  hangmanWordElement.innerHTML = answerArray.join(" ");
  guessesLeftElement.innerHTML = numGuessesLeft + " guesses left.";
}

function updateGameState() {
  if (remainingLetters > 0 && numGuessesLeft > 0) {
    if (letterGuess.length !== 1) {
      playerInfoElement.innerHTML = "Please enter a single letter";
    } else {
      alreadyGuessed = false;
      for (let i = 0; i < guessedArray.length; i++) {
        if (letterGuess === guessedArray[i]) {
          alreadyGuessed = true;
          playerInfoElement.innerHTML = "That letter was already guessed!";
        }
      }
      if (!alreadyGuessed) {
        numGuessesLeft--;
        playerInfoElement.innerHTML = "no";
        guessedArray.push(letterGuess);
        for (let j = 0; j < secretWord.length; j++) {
          if (letterGuess === secretWord[j]) {
            answerArray[j] = letterGuess;
            remainingLetters -= 1;
            playerInfoElement.innerHTML = "yes!";
          }
        }
        hangmanWordElement.innerHTML = answerArray.join(" ");
        guessesLeftElement.innerHTML = numGuessesLeft + " guesses left.";
      }
    }
  }
  if (remainingLetters <= 0) {
    playerInfoElement.innerHTML = "Good job! The answer was <b>" + secretWord + "</b>. - Starting new game...";
    setTimeout(setupNewGame, 4000);
  } else if (numGuessesLeft == 0) {
    playerInfoElement.innerHTML = "Sorry, you're out of guesses. The answer was <b>" + secretWord + "</b>. - Starting new game...";
    setTimeout(setupNewGame, 4000);
  }
}
</script>
</body>
</html>
```

---

## 7. Fill-in-the-Blank with Word Bank (drag words into slots)

**Gameplay & learning:** A sentence is shown with blank slots; a shuffled word bank sits below. The
player drags a word chip into a slot (or taps it on touch — click fallback included). Pressing
Check colors slots green/red. Reinforces grammar, vocabulary in context, and reading comprehension.

**Difficulty:** Medium.

**Gotchas:**
- HTML5 Drag and Drop does NOT fire on touch devices — a click fallback is included (tap a bank word
  → fills the first empty slot; tap a filled slot → clears it) so it works on iPads/Chromebooks.
- You must `e.preventDefault()` in `dragover` or `drop` won't fire.
- A word placed in one slot then dragged to another should vacate the old slot — handled by the
  `prev` check.
- Matching is exact-case here; for younger kids consider `.toLowerCase()` comparison.
- `*` is the blank placeholder — avoid sentences containing a literal asterisk.

**Sources:**
- Concept (text → blanked exercise): `daviferreira/fillintheblanks`
  <https://github.com/daviferreira/fillintheblanks> (a jQuery plugin — concept only, not lifted)
- Native DnD API reference: MDN
  <https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API>

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Fill in the Blanks</title>
<style>
  body{font-family:system-ui,Arial,sans-serif;background:#fff8e1;color:#333;padding:1rem;max-width:680px;margin:auto}
  h1{font-size:1.3rem}
  #sentence{font-size:1.3rem;line-height:2}
  .slot{display:inline-block;min-width:90px;padding:.05rem .35rem;margin:0 .15rem;
        border-bottom:3px solid #fb8c00;text-align:center;font-weight:700;color:#e65100;
        background:#fff3e0;border-radius:4px}
  .slot.over{background:#ffe0b2}
  .slot.filled{border-bottom-color:#43a047;color:#1b5e20}
  .slot.wrong{border-bottom-color:#e53935;color:#c62828;background:#ffebee}
  #bank{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:1.5rem;justify-content:center}
  .word{padding:.4rem .9rem;background:#1976d2;color:#fff;border-radius:999px;
        cursor:grab;font-weight:600;user-select:none}
  .word.used{opacity:.3;cursor:default}
  #result{font-weight:700;margin-top:1rem;min-height:1.4rem}
  .ctrl{margin-top:1rem;padding:.5rem 1.1rem;border:none;border-radius:8px;
        background:#1976d2;color:#fff;font-size:1rem;cursor:pointer}
  .ctrl.alt{background:#43a047}
</style>
</head>
<body>
<h1>Complete the sentence</h1>
<p id="sentence"></p>
<div id="bank"></div>
<p id="result"></p>
<button class="ctrl" id="check">Check</button>
<button class="ctrl alt" id="next" style="display:none">Next →</button>
<script>
// Concept after daviferreira/fillintheblanks; DnD via native HTML5 API (MDN).
// Blank placeholder in each sentence is "*".
const ITEMS=[
  {sentence:"The cat * on the * and fell *.", blanks:["sat","mat","asleep"]},
  {sentence:"* is the largest * in our * system.", blanks:["Jupiter","planet","solar"]},
  {sentence:"Plants need * and * to grow big and *.", blanks:["sun","water","strong"]}
];
let cur=0, answers=[];

function load(){
  const it=ITEMS[cur];answers=Array(it.blanks.length).fill(null);
  const parts=it.sentence.split('*');
  const s=document.getElementById('sentence');s.innerHTML='';
  const slots=[];
  for(let i=0;i<parts.length;i++){
    s.appendChild(document.createTextNode(parts[i]));
    if(i<it.blanks.length){
      const slot=document.createElement('span');slot.className='slot';slot.dataset.i=i;
      slot.textContent='____';
      slot.addEventListener('dragover',e=>{e.preventDefault();slot.classList.add('over');});
      slot.addEventListener('dragleave',()=>slot.classList.remove('over'));
      slot.addEventListener('drop',e=>{e.preventDefault();slot.classList.remove('over');
        fillSlot(i,e.dataTransfer.getData('text'),slot);});
      slot.addEventListener('click',()=>{answers[i]=null;slot.textContent='____';
        slot.classList.remove('filled','wrong');checkUsed();clearResult();});
      s.appendChild(slot);slots.push(slot);
    }
  }
  const bank=document.getElementById('bank');bank.innerHTML='';
  [...it.blanks].sort(()=>Math.random()-0.5).forEach(w=>{
    const c=document.createElement('span');c.className='word';c.textContent=w;c.draggable=true;c.dataset.w=w;
    c.addEventListener('dragstart',e=>e.dataTransfer.setData('text',w));
    c.addEventListener('click',()=>{
      const empty=answers.findIndex(a=>a===null);
      if(empty>=0) fillSlot(empty,w,slots[empty]);
    });
    bank.appendChild(c);
  });
  clearResult();
  document.getElementById('next').style.display='none';
  document.getElementById('check').style.display='inline-block';
}

function fillSlot(i,w,slot){
  const prev=answers.indexOf(w);
  if(prev>=0){answers[prev]=null;
    const ps=document.querySelectorAll('.slot')[prev];
    ps.textContent='____';ps.classList.remove('filled','wrong');}
  answers[i]=w;slot.textContent=w;slot.classList.add('filled');slot.classList.remove('wrong');
  checkUsed();clearResult();
}
function checkUsed(){
  document.querySelectorAll('.word').forEach(c=>c.classList.toggle('used',answers.includes(c.dataset.w)));
}
function clearResult(){document.getElementById('result').textContent='';}

document.getElementById('check').onclick=()=>{
  const it=ITEMS[cur];let ok=0;
  document.querySelectorAll('.slot').forEach((slot,i)=>{
    slot.classList.remove('wrong');
    if(answers[i]===it.blanks[i]){slot.classList.add('filled');ok++;}
    else{slot.classList.add('wrong');}
  });
  const r=document.getElementById('result');
  if(ok===it.blanks.length){
    r.textContent='Correct! 🎉';r.style.color='#2e7d32';
    const nxt=document.getElementById('next');nxt.style.display='inline-block';
    nxt.textContent=cur<ITEMS.length-1?'Next →':'Start over';
  } else {
    r.textContent=ok+' of '+it.blanks.length+' correct. Try again!';r.style.color='#c62828';
  }
};
document.getElementById('next').onclick=()=>{cur=(cur+1)%ITEMS.length;load();};
load();
</script>
</body>
</html>
```

---

## 8. Memory Match (concentration) grid

**Gameplay & learning:** A 4×3 grid of face-down cards. The child flips two cards trying to find a
matching pair (e.g. a math fact "5 × 3" and its answer "15", or two matching emoji). Match → cards
stay up; no match → both flip back after ~1 second. Builds working memory and recall of fact pairs —
exactly the cognitive muscle Grade 3-4 needs. Cards shuffle on each load via random `order` flexbox
values.

**Difficulty:** Medium.

**Gotchas (board-lock concerns):**
- `lockBoard` must be `true` during the unflip delay or a fast kid can flip a third card and
  corrupt state.
- The `this === firstCard` guard stops a single card being counted as both picks.
- `resetBoard()` must run in **both** `disableCards` and `unflipCards` or the next round's
  `firstCard` still points at the previous card.
- Shuffle uses CSS `order` (flexbox), so the grid must be `display:flex; flex-wrap:wrap` — it won't
  shuffle a CSS-grid layout.
- To extend: swap emoji for term/answer text pairs (front shows "5×3", matching pair's front shows
  "15") to make it a math-fact matching game.

**Source:** Marina Ferreira's tutorial <https://marina-ferreira.github.io/tutorials/js/memory-game/>
Repo: `kubowania/memory-game` <https://github.com/kubowania/memory-game> (freeCodeCamp).
Emoji pairs swapped in (no asset download); unflip timeout shortened to 1200ms for younger kids.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Memory Match</title>
<style>
  * { padding: 0; margin: 0; box-sizing: border-box; }
  body {
    font-family: system-ui, sans-serif;
    background: #060AB2;
    height: 100vh;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center; color: #fff;
  }
  .memory-game {
    width: 640px; max-width: 95vw; height: 480px; margin: auto;
    display: flex; flex-wrap: wrap; perspective: 1000px;
  }
  .memory-card {
    width: calc(25% - 10px); height: calc(33.333% - 10px); margin: 5px;
    position: relative; transform: scale(1);
    transform-style: preserve-3d; transition: transform .5s; cursor: pointer;
  }
  .memory-card:active { transform: scale(0.97); transition: transform .2s; }
  .memory-card.flip { transform: rotateY(180deg); }
  .front-face, .back-face {
    width: 100%; height: 100%; padding: 20px; position: absolute;
    border-radius: 8px; background: #1C7CCC;
    display: flex; align-items: center; justify-content: center;
    font-size: 44px;
    backface-visibility: hidden; -webkit-backface-visibility: hidden;
  }
  .front-face { transform: rotateY(180deg); background: #fff; }
  .back-face { background: #1C7CCC; color: #fff; font-size: 32px; }
</style>
</head>
<body>
  <h2 style="margin-bottom:10px;">Find the matching pairs!</h2>
  <section class="memory-game">
    <div class="memory-card" data-framework="A"><div class="front-face">🍎</div><div class="back-face">?</div></div>
    <div class="memory-card" data-framework="A"><div class="front-face">🍎</div><div class="back-face">?</div></div>
    <div class="memory-card" data-framework="B"><div class="front-face">🍌</div><div class="back-face">?</div></div>
    <div class="memory-card" data-framework="B"><div class="front-face">🍌</div><div class="back-face">?</div></div>
    <div class="memory-card" data-framework="C"><div class="front-face">⭐</div><div class="back-face">?</div></div>
    <div class="memory-card" data-framework="C"><div class="front-face">⭐</div><div class="back-face">?</div></div>
    <div class="memory-card" data-framework="D"><div class="front-face">🚀</div><div class="back-face">?</div></div>
    <div class="memory-card" data-framework="D"><div class="front-face">🚀</div><div class="back-face">?</div></div>
    <div class="memory-card" data-framework="E"><div class="front-face">🐸</div><div class="back-face">?</div></div>
    <div class="memory-card" data-framework="E"><div class="front-face">🐸</div><div class="back-face">?</div></div>
    <div class="memory-card" data-framework="F"><div class="front-face">🐙</div><div class="back-face">?</div></div>
    <div class="memory-card" data-framework="F"><div class="front-face">🐙</div><div class="back-face">?</div></div>
  </section>

<script>
const cards = document.querySelectorAll('.memory-card');
let hasFlippedCard = false;
let lockBoard = false;
let firstCard, secondCard;

function flipCard() {
  if (lockBoard) return;
  if (this === firstCard) return;
  this.classList.add('flip');

  if (!hasFlippedCard) {
    hasFlippedCard = true;
    firstCard = this;
    return;
  }
  secondCard = this;
  lockBoard = true;
  checkForMatch();
}

function checkForMatch() {
  let isMatch = firstCard.dataset.framework === secondCard.dataset.framework;
  isMatch ? disableCards() : unflipCards();
}

function disableCards() {
  firstCard.removeEventListener('click', flipCard);
  secondCard.removeEventListener('click', flipCard);
  resetBoard();
}

function unflipCards() {
  setTimeout(() => {
    firstCard.classList.remove('flip');
    secondCard.classList.remove('flip');
    resetBoard();
  }, 1200);
}

function resetBoard() {
  [hasFlippedCard, lockBoard] = [false, false];
  [firstCard, secondCard] = [null, null];
}

(function shuffle() {
  cards.forEach(card => {
    let randomPos = Math.floor(Math.random() * 12);
    card.style.order = randomPos;
  });
})();

cards.forEach(card => card.addEventListener('click', flipCard));
</script>
</body>
</html>
```

---

## 9. Sequencing / Timeline drag-to-reorder

**Gameplay & learning:** Five scrambled story events appear in a list. The student drags events
up/down to put them in the correct order, then clicks "Check Order". Correct positions turn green,
wrong ones turn red so they can fix them. Teaches sequence, cause-and-effect, and procedural
ordering (story events, life cycles, math steps).

**Difficulty:** Medium.

**Gotchas:**
- This approach swaps the *content* (`innerHTML`) between two `<li>` elements rather than moving
  DOM nodes — event listeners stay attached to the original elements, which is convenient here.
- The trade-off: the dragged item's element identity doesn't follow its content, so re-read
  text/order at check time (which is what the validator does).
- Native DnD doesn't work on touch. For tablet/Chromebook support, adopt the pointer-events approach
  from <https://tahazsh.com/blog/seamless-ui-with-js-drag-to-reorder-example/> (mouse + touch,
  ~120 lines, no library).

**Source:** web.dev "The HTML Drag and Drop API" <https://web.dev/articles/drag-and-drop>
Adapted with `.over` hover state and a "Check Order" validator that compares current text order to
a correct-order array.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Put the Story in Order</title>
<style>
  * { box-sizing: border-box; font-family: 'Comic Sans MS', 'Trebuchet MS', sans-serif; }
  body { background: #ede7f6; margin: 0; padding: 20px; text-align: center; }
  h1 { color: #4527a0; margin: 0 0 6px; }
  p#hint { color: #5e35b1; margin: 0 0 18px; }
  ol#sequence { list-style: decimal inside; max-width: 480px; margin: 0 auto; padding: 0; display: flex; flex-direction: column; gap: 10px; }
  ol#sequence li { background: #fff; border: 3px solid #9575cd; border-radius: 12px; padding: 14px; cursor: move; box-shadow: 0 3px 0 #9575cd; font-size: 17px; text-align: left; }
  ol#sequence li.over { border-style: dashed; background: #fff9c4; }
  ol#sequence li.dragging { opacity: 0.4; }
  ol#sequence li.right { background: #c8e6c9; border-color: #43a047; box-shadow: 0 3px 0 #43a047; }
  ol#sequence li.wrong-pos { background: #ffcdd2; border-color: #e53935; box-shadow: 0 3px 0 #e53935; }
  #checkBtn { margin-top: 20px; background: #5e35b1; color: #fff; border: none; border-radius: 10px; padding: 12px 24px; font-size: 16px; cursor: pointer; box-shadow: 0 4px 0 #311b92; }
  #checkBtn:active { transform: translateY(2px); box-shadow: 0 2px 0 #311b92; }
  #result { font-size: 20px; font-weight: bold; margin-top: 14px; min-height: 26px; }
</style>
</head>
<body>
  <h1>Put the Story in Order</h1>
  <p id="hint">Drag the sentences up or down, then click Check.</p>
  <ol id="sequence">
    <li draggable="true">She found a tiny kitten in the bushes.</li>
    <li draggable="true">Her mom said they could keep it.</li>
    <li draggable="true">They named it Pepper and gave it milk.</li>
    <li draggable="true">Pepper grew strong and chased string every day.</li>
    <li draggable="true">One year later, Pepper was a big, happy cat.</li>
  </ol>
  <button id="checkBtn">Check Order</button>
  <div id="result"></div>

<script>
// Native HTML5 drag-to-reorder (swap innerHTML) from web.dev
// https://web.dev/articles/drag-and-drop
var list = document.querySelector("#sequence");
var dragSrcEl = null;

list.addEventListener("dragstart", function(e){
  if (e.target.tagName !== "LI") return;
  dragSrcEl = e.target;
  e.target.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", e.target.innerHTML);
});

list.addEventListener("dragend", function(e){
  e.target.classList.remove("dragging");
  document.querySelectorAll("#sequence li").forEach(function(li){ li.classList.remove("over"); });
});

list.addEventListener("dragover", function(e){
  e.preventDefault();
  return false;
});

list.addEventListener("dragenter", function(e){
  if (e.target.tagName === "LI" && e.target !== dragSrcEl) e.target.classList.add("over");
});

list.addEventListener("dragleave", function(e){
  if (e.target.tagName === "LI") e.target.classList.remove("over");
});

list.addEventListener("drop", function(e){
  e.stopPropagation();
  if (dragSrcEl && e.target.tagName === "LI" && dragSrcEl !== e.target) {
    var tmp = dragSrcEl.innerHTML;
    dragSrcEl.innerHTML = e.target.innerHTML;
    e.target.innerHTML = tmp;
  }
  document.querySelectorAll("#sequence li").forEach(function(li){ li.classList.remove("over"); });
  e.preventDefault();
  return false;
});

var correctOrder = [
  "She found a tiny kitten in the bushes.",
  "Her mom said they could keep it.",
  "They named it Pepper and gave it milk.",
  "Pepper grew strong and chased string every day.",
  "One year later, Pepper was a big, happy cat."
];

document.querySelector("#checkBtn").addEventListener("click", function(){
  var items = Array.from(document.querySelectorAll("#sequence li"));
  var allRight = true;
  items.forEach(function(li, i){
    li.classList.remove("right", "wrong-pos");
    if (li.textContent.trim() === correctOrder[i]) {
      li.classList.add("right");
    } else {
      li.classList.add("wrong-pos");
      allRight = false;
    }
  });
  document.querySelector("#result").textContent = allRight ? "Perfect order! 🎉" : "Some are out of order — try again!";
});

(function shuffle(){
  var items = Array.from(list.children);
  for (var i = items.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    list.appendChild(items[j]);
    items[i] = items[j];
  }
})();
</script>
</body>
</html>
```

---

## 10. True/False + Multiple Choice with animated feedback

**Gameplay & learning:** A question with answer options; on click, correct answer animates (green
bounce + ✓ + confetti) and wrong answer animates (red shake + ✗), with the correct option revealed.
A running score is shown; a final summary appears at the end. Builds quick recall of
grade-appropriate science/general-knowledge facts.

**Difficulty:** Easy (T/F) / Easy-medium (MC).

**Gotchas:**
- Reset each option's classes/icons and re-enable pointer events on every new question, otherwise
  animation state from the previous question leaks.
- Remove the confetti canvas's leftover pixels with a final `clearRect` after the last particle
  dies, or a faint ghost stays on screen.
- Keep the `disabled` class so kids can't click twice and inflate the score.

**Sources:**
- Multiple-choice quiz logic + animated correct/incorrect CSS: `RaminMikayilov/quiz-app`
  <https://github.com/RaminMikayilov/quiz-app> (Bootstrap/FontAwesome removed; inline ✓/✗ used)
- Canvas confetti animation: `vielhuber/confetti` gist
  <https://gist.github.com/vielhuber/e453d53a28d803680ec156599a0ef3d6>

### (a) True/False version

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>True / False Quiz</title>
<style>
  body{font-family:system-ui,sans-serif;background:#f3f0ff;display:flex;flex-direction:column;
       align-items:center;min-height:100vh;margin:0;padding:20px}
  .score{font-size:1.2rem;font-weight:bold;margin-bottom:10px}
  #question{font-size:1.5rem;text-align:center;max-width:600px;margin:10px 0 24px}
  .options{display:flex;gap:24px}
  .opt{padding:16px 36px;font-size:1.25rem;border:3px solid #6c5ce7;border-radius:14px;
       background:#fff;cursor:pointer;transition:transform .2s, background .2s}
  .opt:hover{transform:translateY(-3px)}
  .opt.correct{background:#8eff8e;border-color:#27ae60;animation:bounce .5s}
  .opt.incorrect{background:#ff7675;border-color:#c0392b;animation:shake .4s}
  .opt.disabled{pointer-events:none}
  .ic{margin-left:8px;font-weight:bold}
  #next{margin-top:24px;padding:10px 26px;font-size:1rem;border:none;border-radius:10px;
        background:#6c5ce7;color:#fff;cursor:pointer;display:none}
  @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
  @keyframes bounce{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}
</style>
</head>
<body>
  <div class="score">Score: <span id="score">0</span> / <span id="total">0</span></div>
  <div id="question"></div>
  <div class="options">
    <button class="opt" data-val="true">True <span class="ic"></span></button>
    <button class="opt" data-val="false">False <span class="ic"></span></button>
  </div>
  <button id="next">Next ›</button>

<script>
const questions = [
  { q: "A spider is an insect.",            a: false },
  { q: "The Sun is a star.",                a: true  },
  { q: "Water freezes at 0 degrees Celsius.", a: true },
  { q: "Whales are fish.",                  a: false }
];
let i = 0, score = 0;
const qEl = document.getElementById("question");
const scoreEl = document.getElementById("score");
const totalEl = document.getElementById("total");
const opts = document.querySelectorAll(".opt");
const nextBtn = document.getElementById("next");
totalEl.textContent = questions.length;

function render() {
  qEl.textContent = (i + 1) + ".  " + questions[i].q;
  opts.forEach(o => {
    o.classList.remove("correct", "incorrect", "disabled");
    o.style.display = "";
    o.querySelector(".ic").textContent = "";
  });
  nextBtn.style.display = "none";
}

opts.forEach(o => o.addEventListener("click", () => {
  const val = o.dataset.val === "true";
  if (val === questions[i].a) {
    o.classList.add("correct");
    o.querySelector(".ic").textContent = "✓";
    score++; scoreEl.textContent = score;
    fireConfetti();
  } else {
    o.classList.add("incorrect");
    o.querySelector(".ic").textContent = "✗";
    opts.forEach(p => {
      if ((p.dataset.val === "true") === questions[i].a) {
        p.classList.add("correct");
        p.querySelector(".ic").textContent = "✓";
      }
    });
  }
  opts.forEach(p => p.classList.add("disabled"));
  nextBtn.style.display = "block";
}));

nextBtn.addEventListener("click", () => {
  i++;
  if (i < questions.length) { render(); }
  else {
    qEl.textContent = "Done! You scored " + score + " / " + questions.length;
    opts.forEach(o => o.style.display = "none");
    nextBtn.style.display = "none";
  }
});

let canvas, ctx, parts = [], raf;
function fireConfetti() {
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999";
    document.body.appendChild(canvas);
  }
  canvas.width = innerWidth; canvas.height = innerHeight;
  ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  const colors = ["#ff595e","#ffca3a","#8ac926","#1982c4","#6a4c93"];
  parts = [];
  for (let k = 0; k < 120; k++) {
    parts.push({ x: Math.random()*w, y: Math.random()*-h,
      d: Math.random()*8+4, c: colors[k % colors.length],
      vx: (Math.random()-.5)*4, vy: Math.random()*3+2, life: 120 });
  }
  cancelAnimationFrame(raf);
  loop();
}
function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  let alive = false;
  parts.forEach(p => {
    p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.life--;
    if (p.life > 0 && p.y < canvas.height) {
      alive = true; ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, p.d, p.d);
    }
  });
  if (alive) raf = requestAnimationFrame(loop);
  else ctx.clearRect(0, 0, canvas.width, canvas.height);
}

render();
</script>
</body>
</html>
```

### (b) Multiple-choice (4 options) version

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Multiple Choice Quiz</title>
<style>
  body{font-family:system-ui,sans-serif;background:#eaf7ff;display:flex;flex-direction:column;
       align-items:center;min-height:100vh;margin:0;padding:20px}
  .score{font-size:1.2rem;font-weight:bold;margin-bottom:6px}
  #progress{color:#555;margin-bottom:14px}
  #question{font-size:1.4rem;text-align:center;max-width:620px;margin:6px 0 20px}
  #options{display:flex;flex-direction:column;gap:12px;width:100%;max-width:520px}
  .opt{padding:14px 18px;font-size:1.05rem;border:3px solid #1d6fb8;border-radius:12px;
       background:#fff;cursor:pointer;text-align:left;transition:transform .15s,background .2s}
  .opt:hover{transform:translateX(4px)}
  .opt.correct{background:#8eff8e;border-color:#27ae60;animation:bounce .5s}
  .opt.incorrect{background:#ff9a9a;border-color:#c0392b;animation:shake .4s}
  .opt.disabled{pointer-events:none}
  .ic{float:right;font-weight:bold}
  #next{margin-top:22px;padding:10px 26px;font-size:1rem;border:none;border-radius:10px;
        background:#1d6fb8;color:#fff;cursor:pointer;display:none}
  @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
  @keyframes bounce{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
</style>
</head>
<body>
  <div class="score">Score: <span id="score">0</span> / <span id="total">0</span></div>
  <div id="progress"></div>
  <div id="question"></div>
  <div id="options"></div>
  <button id="next">Next ›</button>

<script>
const questions = [
  { q: "Which planet is the hottest in our Solar System?",
    options: ["Mars", "Venus", "Mercury", "Saturn"], a: 1 },
  { q: "How many legs does an insect have?",
    options: ["4", "6", "8", "10"], a: 1 },
  { q: "Which gas do plants take in to make food?",
    options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"], a: 2 },
  { q: "What is 7 x 6?",
    options: ["36", "42", "48", "56"], a: 1 }
];
let i = 0, score = 0, answered = false;
const qEl = document.getElementById("question");
const box = document.getElementById("options");
const scoreEl = document.getElementById("score");
const totalEl = document.getElementById("total");
const progEl = document.getElementById("progress");
const nextBtn = document.getElementById("next");
totalEl.textContent = questions.length;

function render() {
  answered = false;
  progEl.textContent = "Question " + (i + 1) + " of " + questions.length;
  qEl.textContent = questions[i].q;
  box.innerHTML = "";
  questions[i].options.forEach((txt, idx) => {
    const b = document.createElement("button");
    b.className = "opt";
    b.innerHTML = '<span class="txt">' + txt + '</span><span class="ic"></span>';
    b.addEventListener("click", () => select(idx, b));
    box.appendChild(b);
  });
  nextBtn.style.display = "none";
}

function select(idx, btn) {
  if (answered) return;
  answered = true;
  const correct = idx === questions[i].a;
  if (correct) {
    btn.classList.add("correct");
    btn.querySelector(".ic").textContent = "✓";
    score++; scoreEl.textContent = score;
    fireConfetti();
  } else {
    btn.classList.add("incorrect");
    btn.querySelector(".ic").textContent = "✗";
    box.children[questions[i].a].classList.add("correct");
    box.children[questions[i].a].querySelector(".ic").textContent = "✓";
  }
  Array.from(box.children).forEach(c => c.classList.add("disabled"));
  nextBtn.style.display = "block";
}

nextBtn.addEventListener("click", () => {
  i++;
  if (i < questions.length) render();
  else {
    qEl.textContent = "Quiz finished! You scored " + score + " / " + questions.length;
    box.innerHTML = ""; nextBtn.style.display = "none"; progEl.textContent = "";
  }
});

let canvas, ctx, parts = [], raf;
function fireConfetti() {
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999";
    document.body.appendChild(canvas);
  }
  canvas.width = innerWidth; canvas.height = innerHeight;
  ctx = canvas.getContext("2d");
  const colors = ["#ff595e","#ffca3a","#8ac926","#1982c4","#6a4c93"];
  parts = [];
  for (let k = 0; k < 120; k++) parts.push({
    x: Math.random()*canvas.width, y: Math.random()*-canvas.height,
    d: Math.random()*8+4, c: colors[k % colors.length],
    vx: (Math.random()-.5)*4, vy: Math.random()*3+2, life: 120
  });
  cancelAnimationFrame(raf); loop();
}
function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  let alive = false;
  parts.forEach(p => {
    p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.life--;
    if (p.life > 0 && p.y < canvas.height) {
      alive = true; ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, p.d, p.d);
    }
  });
  if (alive) raf = requestAnimationFrame(loop);
  else ctx.clearRect(0, 0, canvas.width, canvas.height);
}

render();
</script>
</body>
</html>
```

---

## Summary table

| # | Activity | Real source | Difficulty | Touch support |
|---|----------|-------------|------------|----------------|
| 1 | Scratch-off reveal | Tuts+ (Esther Vaati) | Easy | Yes (touch events wired) |
| 2 | Word search grid | nooraftab/wordsearch + freeCodeCamp | Easy-Medium | No (mouse only) |
| 3 | Matching (click pairs) | CodePen x-dream/ZGbBVd | Easy | Yes (click) |
| 4 | Drag-drop sorting | DigitalOcean DnD tutorial | Easy | No (HTML5 DnD) |
| 5 | Flip cards 3D | DEV.to tolentinoel + Coding with Carla | Easy | Yes (click) |
| 6 | Hangman (emoji lives) | Utkarsh575/hangman | Easy | Yes (click) |
| 6b| Hangman (whole-word) | erichlof gist | Easy | Yes (inputs) |
| 7 | Fill-in-the-blank w/ word bank | daviferreira concept + MDN DnD | Medium | Yes (click fallback) |
| 8 | Memory match grid | Marina Ferreira / kubowania | Medium | Yes (click) |
| 9 | Sequencing drag-reorder | web.dev DnD article | Medium | No (HTML5 DnD) |
| 10| True/False + MC animated | RaminMikayilov/quiz-app + vielhuber confetti | Easy | Yes (click) |

**Content is trivially swappable** in every activity — the `data`/`WORDS`/`ITEMS`/`questions`/
`correctOrder` arrays are the only things you edit to make new lessons. To let teachers edit
content without touching code, load those arrays from a JSON file via `fetch()`.

**Touch upgrade path for the three HTML5-DnD activities (4, 7, 9):** adopt the pointer-events
approach from <https://tahazsh.com/blog/seamless-ui-with-js-drag-to-reorder-example/> (mouse +
touch, ~120 lines, no library). Activity 7 already includes a click-based fallback that covers
iPads/Chromebooks without rewriting.

---

## Sources

- Tuts+ — How to Create a Scratch Card Effect in Vanilla JavaScript: <https://webdesign.tutsplus.com/how-to-create-a-scratch-card-effect-in-vanilla-javascript--cms-108922t>
- CodePen dudleystorey scratch card: <https://codepen.io/dudleystorey/pen/yJQxLX>
- nooraftab/wordsearch (GitHub): <https://github.com/nooraftab/wordsearch>
- freeCodeCamp word-search tutorial: <https://www.freecodecamp.org/news/build-a-word-search-game-using-html-css-and-javascript/>
- CodePen "KodEtude - Matching Quiz" (x-dream): <https://codepen.io/x-dream/pen/ZGbBVd>
- DigitalOcean — Drag and Drop with Vanilla JavaScript: <https://www.digitalocean.com/community/tutorials/js-drag-and-drop-vanilla-js>
- DEV.to (Ellaine Tolentino) — Cards that Flip: <https://dev.to/tolentinoel/cards-that-flip-169o>
- Medium "Coding with Carla" — flip card on click: <https://medium.com/coding-with-carla/build-a-card-that-flips-on-click-with-html-css-and-vanilla-javascript-part-1-937cd2242c90>
- Utkarsh575/hangman (GitHub): <https://github.com/Utkarsh575/hangman>
- erichlof hangman gist: <https://gist.github.com/erichlof/d9dd70a3657ef082162791561ff39a2b>
- daviferreira/fillintheblanks (GitHub): <https://github.com/daviferreira/fillintheblanks>
- MDN — HTML Drag and Drop API: <https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API>
- Marina Ferreira — Memory Game tutorial: <https://marina-ferreira.github.io/tutorials/js/memory-game/>
- kubowania/memory-game (GitHub): <https://github.com/kubowania/memory-game>
- web.dev — The HTML Drag and Drop API: <https://web.dev/articles/drag-and-drop>
- tahazsh — drag-to-reorder with pointer events (touch upgrade path): <https://tahazsh.com/blog/seamless-ui-with-js-drag-to-reorder-example/>
- RaminMikayilov/quiz-app (GitHub): <https://github.com/RaminMikayilov/quiz-app>
- vielhuber confetti gist: <https://gist.github.com/vielhuber/e453d53a28d803680ec156599a0ef3d6>