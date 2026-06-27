/* === GRADE 4 SUMMER — INTERACTIVE LEARNING ENGINE ===
 * Vanilla JS, no deps. Touch + mouse (Pointer Events).
 * Exposes window.SummerGames.init(). Auto-inits on DOMContentLoaded.
 * Replaces the old checkbox schedule with one game per day.
 */
(function () {
  'use strict';
  if (window.SummerGames) return;
  var SG = {};

  /* ---------- utils ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function loadObj(k) { try { return JSON.parse(localStorage.getItem(k) || '{}'); } catch (e) { return {}; } }
  function saveObj(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function rnd(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  /* ---------- storage keys ---------- */
  var STORAGE_KEY = 'manha:summer-progress';   // { "w-d-s": true } — kept for backward compat
  var DONE_KEY = 'manha:summer-game-done';      // { "w-d": true }
  var STREAK_KEY = 'manha:summer-streak';        // { count, lastDay }
  var XP_KEY = 'manha:summer-xp';               // { total, level }
  var completed = loadObj(STORAGE_KEY);
  var done = loadObj(DONE_KEY);

  /* ---------- SCHEDULE (32 days; Week 3 fixed to 4 days) ---------- */
  // Each day: [ [Subject, topic, [bullets]], [Subject, topic, [bullets]] ]
  // Pattern: D1 Math+Sci, D2 ELA+SS, D3 Math+ELA, D4 Sci+SS
  SG.SCHEDULE = [
    [ // Week 1 — Foundations
      [['Math', 'Place value to 1,000,000', ['Read & write to 1,000,000', 'Compare with >, =, <', 'Round to any place']], ['Science', 'Forms of energy', ['Sound, light, heat, electrical', 'Energy transfers around us', 'Spot energy sources']]],
      [['ELA', 'Close reading — text evidence', ['Reread to locate details', 'Use evidence to answer', 'Explicit vs. inferred']], ['Social Studies', 'NYS geography basics', ['Locate NYS on a map', 'Major cities', 'Physical features']]],
      [['Math', 'Multiplicative comparison', ['"Times as many" language', 'Write comparison equations', 'Word problems']], ['ELA', 'Summary vs. central idea', ['Summarize in 2-3 sentences', 'Find the lesson/message', 'Support with key details']]],
      [['Science', 'Energy transfers', ['Observe energy changes', 'Describe energy movement', 'Everyday examples']], ['Social Studies', 'Maps: physical, political, thematic', ['Read different map types', 'Use a map key/legend', 'Compare map purposes']]]
    ],
    [ // Week 2 — Multi-digit operations
      [['Math', 'Multi-digit add & subtract', ['Add/subtract to 1,000,000', 'Standard algorithm', 'Check with estimation']], ['Science', 'Energy conversions', ['Devices change energy forms', 'Battery → light → heat', 'Engineering design basics']]],
      [['ELA', 'Text structure: sequence & cause/effect', ['Signal words: first, then, because', 'Find sequence in nonfiction', 'Cause-and-effect relations']], ['Social Studies', 'Haudenosaunee & Algonquian', ['Who lived here first', 'Longhouses and clans', 'Use of natural resources']]],
      [['Math', 'Multiply 4-digit × 1-digit', ['Place value strategies', 'Area models', 'Estimation check']], ['ELA', 'Paragraphs with topic sentences', ['Clear topic sentence', 'Supporting details', 'Closing sentence']]],
      [['Science', 'Designing energy-converting devices', ['Define a problem', 'Draw a design', 'Explain how it works']], ['Social Studies', 'Geography & Native American life', ['Climate and shelter', 'Rivers and food', 'Adaptation to environment']]]
    ],
    [ // Week 3 — Multiplication & division (FIXED: 4 days)
      [['Math', '2-digit × 2-digit multiplication', ['Area model', 'Partial products', 'Record final product']], ['Science', 'Vision and light', ['Light travels in straight lines', 'Objects reflect light', 'Eye structures & function']]],
      [['ELA', 'Opinion writing — claim + reasons', ['State a clear claim', 'Give 2-3 reasons', 'Linking words: because, for example']], ['Social Studies', 'European explorers', ['Verrazano, Hudson, Champlain', 'Dutch and French interests', 'Impact on Native peoples']]],
      [['Math', 'Division with remainders', ['Interpret the remainder', 'Multiply to check', 'Real-world problems']], ['ELA', 'Using linking words', ['First, next, finally', 'Connecting reasons', 'Connecting events']]],
      [['Science', 'Light reflection & eye structures', ['How mirrors reflect', 'Parts of the eye', 'Why animals see differently']], ['Social Studies', 'New Netherland → New York', ['Dutch colony', 'English takeover', 'Colonial life']]]
    ],
    [ // Week 4 — Fractions
      [['Math', 'Fraction equivalence with models', ['Draw equivalent fractions', 'Use number lines', 'Recognize same size']], ['Science', 'Animal structures & survival', ['Internal & external structures', 'Functions for survival', 'Compare animals']]],
      [['ELA', 'Informative/explanatory writing', ['Introduce a topic', 'Organize facts in paragraphs', 'Precise vocabulary']], ['Social Studies', 'Colonial life in New York', ['New Netherland → New York', 'Dutch, English, Africans', 'Daily life in colonies']]],
      [['Math', 'Comparing fractions', ['Compare with >, =, <', 'Benchmarks like 1/2', 'Justify with a model']], ['ELA', 'Greek & Latin roots and affixes', ['Roots: tele, photo, graph', 'Prefixes: un-, re-, pre-', 'Use roots to decode words']]],
      [['Science', 'Animals process info from senses', ['Sense receptors', 'Brain receives signals', 'Animals respond to info']], ['Social Studies', 'American Revolution in NY', ['Patriots vs. Loyalists', 'Battle of Long Island', 'Battle of Saratoga']]]
    ],
    [ // Week 5 — Fractions & decimals
      [['Math', 'Add & subtract fractions (like denominators)', ['Join/separate parts', 'Decompose fractions', 'Word problems']], ['Science', "Earth's features: rock layers & fossils", ['Sedimentary rock layers', 'Fossils as evidence', 'Landscape changes over time']]],
      [['ELA', 'Similes & metaphors', ['Identify similes & metaphors', 'Explain meaning in context', 'Write your own']], ['Social Studies', 'Branches of government', ['Federal: President, Congress, Courts', 'State: Governor, legislature', 'Local: mayor, city council']]],
      [['Math', 'Mixed numbers; whole × fraction', ['Add/subtract mixed numbers', 'Multiply whole × fraction', 'Word problems']], ['ELA', 'Multiple-meaning words & context clues', ['Use sentence clues', 'Choose the right meaning', 'Dictionary practice']]],
      [['Science', 'Weathering, erosion, deposition', ['Water, ice, wind, plants', 'Observe local examples', 'Model the processes']], ['Social Studies', 'Brooklyn / Kings County government', ['Brooklyn is Kings County', 'Borough president role', 'Local elected leaders']]]
    ],
    [ // Week 6 — Measurement & geometry
      [['Math', 'Decimals — tenths & hundredths', ['Fractions as decimals', 'Locate on number line', 'Compare decimals']], ['Science', 'Topographic maps & landforms', ['Read elevation maps', 'Identify landforms', 'Describe patterns']]],
      [['ELA', 'Idioms, adages, proverbs', ['Recognize common idioms', 'Explain figurative meaning', 'Use in writing']], ['Social Studies', 'Rights & responsibilities of citizens', ['Constitution protects rights', 'Voting, jury duty, laws', 'Active citizenship']]],
      [['Math', 'Measurement conversions; area & perimeter', ['Convert ft/in, km/m/cm', 'Area & perimeter formulas', 'Real-world problems']], ['ELA', 'Narrative writing with dialogue', ['Quotation marks', 'Show character feelings', 'Sequence events']]],
      [['Science', 'Natural hazards & engineering', ['Earthquakes, floods, tsunamis', 'Design protective structures', 'Compare solutions']], ['Social Studies', 'Slavery, abolition, Underground Railroad', ['Slavery in NY', 'Abolition leaders', 'Harriet Tubman & local history']]]
    ],
    [ // Week 7 — Angles & advanced reading
      [['Math', 'Angle measurement with a protractor', ['Measure in degrees', 'Draw angles', 'Acute, obtuse, right']], ['Science', 'Waves: amplitude, wavelength, sound', ['Model a wave', 'Amplitude = loudness', 'Wavelength = pitch']]],
      [['ELA', 'Primary vs. secondary sources', ['Firsthand & secondhand accounts', 'Author purpose', 'Use sources as evidence']], ['Social Studies', "Women's rights & Seneca Falls", ['Elizabeth Cady Stanton', 'Susan B. Anthony', 'Fighting for voting rights']]],
      [['Math', 'Additive angles; unknown angles', ['Straight line = 180°', 'Around a point = 360°', 'Find missing angles']], ['ELA', 'Research note-taking & categorizing', ['Take brief notes', 'Sort into categories', 'List sources']]],
      [['Science', 'How dolphins/waves communicate', ['Sound waves underwater', 'Send/receive signals', 'Humans encode info']], ['Social Studies', 'Immigration through Ellis Island', ['Why immigrants came', 'Ellis Island experience', 'Push and pull factors']]]
    ],
    [ // Week 8 — Capstone & review
      [['Math', 'Multi-step word problem review', ['Plan steps carefully', 'Choose operations', 'Check reasonableness']], ['Science', 'Engineering design challenge', ['Define problem & criteria', 'Build and test a prototype', 'Improve the design']]],
      [['ELA', 'Write a short informative article', ['Research a topic', 'Organize paragraphs', 'Use facts and definitions']], ['Social Studies', 'Industrialization, Erie Canal, transportation', ['Erie Canal changed NY', 'Steam engine, railroads', 'Factories and cities']]],
      [['Math', 'Mixed Grade 4 skills review', ['Place value, fractions, decimals', 'Operations, measurement', 'Geometry and angles']], ['ELA', 'Oral presentation practice', ['Speak clearly and loudly', 'Use visuals', 'Answer listener questions']]],
      [['Science', 'Science vocabulary review', ['Energy, light, earth, waves', 'Flashcards or quiz', 'Explain concepts aloud']], ['Social Studies', 'Famous New Yorkers — then & now', ['Frederick Douglass', 'Ruth Bader Ginsburg', 'Local leaders']]]
    ]
  ];

  /* ---------- GAMES content (keyed "w-d") ---------- */
  SG.GAMES = {
    '0-0': { type: 'scratch', content: { fact: 'Energy comes in many forms: sound, light, heat, and electrical! ⚡' } },
    '0-1': { type: 'wordSearch', content: { words: ['PROOF', 'EVIDENCE', 'RIVER', 'MAP', 'CITY', 'MOUNTAIN'] } },
    '0-2': { type: 'fillBlank', content: { sentence: '6 is * as many as 3. A good * names the main idea in 2-3 *.', blanks: ['times', 'summary', 'sentences'] } },
    '0-3': { type: 'flip', content: { cards: [ {front:'Sound is a form of ?',back:'Energy'}, {front:'A map key tells us ?',back:"What symbols mean"}, {front:'Heat moves from ?',back:'Warm to cool'}, {front:'A thematic map shows ?',back:'Patterns (rain, population)'} ] } },

    '1-0': { type: 'match', content: { pairs: [ ['Algorithm','Step-by-step method'], ['Estimate','A close guess'], ['Conversion','Changing one form to another'], ['Battery','Stores electrical energy'], ['Prototype','A first test model'] ] } },
    '1-1': { type: 'dragSort', content: { items: [ {text:'Native peoples lived in NY first', order:0}, {text:'They built longhouses in clans', order:1}, {text:'They used rivers for food & travel', order:2}, {text:'Geography shaped how they lived', order:3} ] } },
    '1-2': { type: 'quizMC', content: { questions: [ {q:'A topic sentence goes...', options:['At the end','At the start','In the middle'], a:1}, {q:'24 × 3 = ?', options:['62','72','81'], a:1}, {q:'Supporting details...', options:['Prove the topic','Are random','Are not needed'], a:0} ] } },
    '1-3': { type: 'scratch', content: { fact: 'A good design solves a problem — then you test it and make it better! 🔧' } },

    '2-0': { type: 'fillBlank', content: { sentence: '23 × 14: split 23 into * and 3. Light travels in * lines so we can *.', blanks: ['20', 'straight', 'see'] } },
    '2-1': { type: 'hangman', content: { word: 'hudson', hint: 'An explorer who sailed NY waters' } },
    '2-2': { type: 'quizMC', content: { questions: [ {q:'45 ÷ 6 = ? remainder ?', options:['7 r 3','8 r 0','7 r 5'], a:0}, {q:'A linking word that shows order:', options:['Because','Next','However'], a:1}, {q:'The remainder is what is...', options:['Left over','Added','Multiplied'], a:0} ] } },
    '2-3': { type: 'match', content: { pairs: [ ['Retina','Light enters here'], ['Mirror','Reflects light'], ['Pupil','The black hole'], ['Colony','A new settlement'], ['Dutch','First colonists of NY'], ] } },

    '3-0': { type: 'dragSort', content: { items: [ {text:'Draw 1/2 and 2/4 as models', order:0}, {text:'Compare their sizes', order:1}, {text:'See they are equal', order:2}, {text:'Write: 1/2 = 2/4', order:3} ] } },
    '3-1': { type: 'match', content: { pairs: [ ['Topic sentence','Starts a paragraph'], ['Supporting details','Prove the topic'], ['Colonist','Lived in a colony'], ['New Netherland','Dutch NY colony'], ['Precise vocabulary','Exact words'] ] } },
    '3-2': { type: 'wordSearch', content: { words: ['PHOTO', 'GRAPH', 'PREFIX', 'FRACTION', 'BENCHMARK'] } },
    '3-3': { type: 'quizMC', content: { questions: [ {q:'Sense receptors are found in...', options:['The brain','Eyes, ears, skin','The heart'], a:1}, {q:'Who wanted independence from Britain?', options:['Loyalists','Patriots','Both'], a:1}, {q:'Which battle was a big Patriot win in NY?', options:['Long Island','Saratoga','Yorktown'], a:1} ] } },

    '4-0': { type: 'fillBlank', content: { sentence: '2/5 + 1/5 = *. Fossils are evidence of * that lived long ago, found in * rock.', blanks: ['3/5', 'life', 'sedimentary'] } },
    '4-1': { type: 'hangman', content: { word: 'metaphor', hint: 'A comparison without "like" or "as"' } },
    '4-2': { type: 'match', content: { pairs: [ ['Mixed number','Whole + fraction'], ['Improper fraction','Top ≥ bottom'], ['Context clues','Hints around a word'], ['Multiple meaning','Two+ meanings'], ['Borrow','Used in subtraction'] ] } },
    '4-3': { type: 'scratch', content: { fact: 'Weathering breaks rock, erosion moves it, deposition drops it. Brooklyn is in Kings County! 🏛️' } },

    '5-0': { type: 'match', content: { pairs: [ ['Tenths','0.1 place'], ['Hundredths','0.01 place'], ['Elevation','Height above sea'], ['Landform','A shape of land'], ['Plain','Flat low land'] ] } },
    '5-1': { type: 'hangman', content: { word: 'proverb', hint: 'A short saying with a lesson' } },
    '5-2': { type: 'dragSort', content: { items: [ {text:'Pick the characters & setting', order:0}, {text:'Use quotation marks for dialogue', order:1}, {text:'Show character feelings', order:2}, {text:'Sequence the events clearly', order:3} ] } },
    '5-3': { type: 'flip', content: { cards: [ {front:'A flood is a natural ?',back:'Hazard'}, {front:'The Underground Railroad helped people ?',back:'Escape slavery'}, {front:'An engineer designs ?',back:'Solutions'}, {front:'Harriet Tubman was from ?',back:'New York (Auburn)'} ] } },

    '6-0': { type: 'dragSort', content: { items: [ {text:'Place the protractor center on the vertex', order:0}, {text:'Line up one ray with 0°', order:1}, {text:'Read where the other ray points', order:2}, {text:'Record the degrees', order:3} ] } },
    '6-1': { type: 'match', content: { pairs: [ ['Primary source','Firsthand account'], ['Secondary source','Report by others'], ['Diary','A primary source'], ['Stanton','Women’s rights leader'], ['Anthony','Fought for voting rights'] ] } },
    '6-2': { type: 'wordSearch', content: { words: ['ANGLE', 'DEGREE', 'NOTES', 'SOURCE', 'VERTEX'] } },
    '6-3': { type: 'quizMC', content: { questions: [ {q:'Dolphins communicate using...', options:['Light waves','Sound waves','Smell'], a:1}, {q:'A "push factor" to immigrate is...', options:['A reason to leave','A reason to come','A vacation'], a:0}, {q:'Ellis Island is in which state?', options:['New Jersey','New York','Connecticut'], a:1} ] } },

    '7-0': { type: 'quizMC', content: { questions: [ {q:'First step in a multi-step problem:', options:['Pick the answer','Plan the steps','Guess'], a:1}, {q:'A prototype is...', options:['The final product','A first test model','A drawing only'], a:1}, {q:'After testing, you should...', options:['Stop','Improve the design','Quit'], a:1} ] } },
    '7-1': { type: 'fillBlank', content: { sentence: 'The * Canal helped goods move across NY. An informative article uses * and definitions in organized *.', blanks: ['Erie', 'facts', 'paragraphs'] } },
    '7-2': { type: 'hangman', content: { word: 'protractor', hint: 'Tool to measure angles' } },
    '7-3': { type: 'match', content: { pairs: [ ['Amplitude','Loudness of a wave'], ['Wavelength','Pitch of a sound'], ['Douglass','Abolitionist leader'], ['Ginsburg','Supreme Court justice'], ['Energy','Power to do work'] ] } }
  };

  /* ---------- AUDIO ---------- */
  var audioCtx;
  function ac() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); if (audioCtx.state === 'suspended') audioCtx.resume(); return audioCtx; }
  function tone(o) {
    o = o || {}; var c = ac(), t0 = c.currentTime + (o.when || 0);
    var osc = c.createOscillator(), g = c.createGain();
    osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(o.freq || 440, t0);
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(o.vol || 0.18, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + (o.dur || 0.15));
    osc.connect(g).connect(c.destination); osc.start(t0); osc.stop(t0 + (o.dur || 0.15) + 0.02);
  }
  var sound = {
    play: function (n) {
      try {
        if (n === 'correct') { tone({ freq: 523.25, dur: 0.12, type: 'triangle' }); tone({ freq: 659.25, dur: 0.12, type: 'triangle', when: 0.1 }); tone({ freq: 783.99, dur: 0.2, type: 'triangle', when: 0.2 }); }
        else if (n === 'wrong') { tone({ freq: 220, dur: 0.18, type: 'sawtooth', vol: 0.1 }); tone({ freq: 180, dur: 0.22, type: 'sawtooth', vol: 0.1, when: 0.1 }); }
        else if (n === 'levelUp') { [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach(function (f, i) { tone({ freq: f, dur: 0.16, type: 'triangle', when: i * 0.09 }); }); }
        else if (n === 'click') { tone({ freq: 880, dur: 0.05, type: 'square', vol: 0.07 }); }
      } catch (e) {}
    }
  };
  document.addEventListener('pointerdown', function () { ac(); }, { once: true });

  /* ---------- CONFETTI ---------- */
  var ccCanvas, ccCtx, ccRAF, ccParts = [];
  function ensureConfetti() {
    if (ccCanvas) return ccCanvas;
    ccCanvas = document.getElementById('sg-confetti');
    if (!ccCanvas) { ccCanvas = el('canvas'); ccCanvas.id = 'sg-confetti'; document.body.appendChild(ccCanvas); }
    ccCtx = ccCanvas.getContext('2d');
    return ccCanvas;
  }
  SG.confetti = function (opts) {
    opts = opts || {};
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var cv = ensureConfetti(); cv.width = window.innerWidth; cv.height = window.innerHeight;
    var colors = ['#10b981', '#7c3aed', '#fbbf24', '#ef4444', '#3b82f6', '#f97316', '#ec4899'];
    var count = opts.count || 130, ox = opts.x || cv.width / 2, oy = opts.y || cv.height * 0.35;
    for (var i = 0; i < count; i++) {
      ccParts.push({ x: ox, y: oy, vx: (Math.random() - 0.5) * 14, vy: Math.random() * -14 - 4,
        size: Math.random() * 8 + 4, rot: Math.random() * Math.PI * 2, ts: (Math.random() - 0.5) * 0.2,
        color: colors[Math.floor(Math.random() * colors.length)] });
    }
    var start = performance.now(), dur = opts.duration || 3000;
    cancelAnimationFrame(ccRAF);
    (function frame(now) {
      var elapsed = now - start;
      if (elapsed > dur) { ccCtx.clearRect(0, 0, cv.width, cv.height); ccParts = []; return; }
      ccCtx.clearRect(0, 0, cv.width, cv.height);
      for (var i = 0; i < ccParts.length; i++) { var p = ccParts[i]; p.vy += 0.35; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.rot += p.ts;
        ccCtx.save(); ccCtx.translate(p.x, p.y); ccCtx.rotate(p.rot); ccCtx.fillStyle = p.color;
        ccCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.4); ccCtx.restore(); }
      ccRAF = requestAnimationFrame(frame);
    })(performance.now());
  };

  /* ---------- PRAISE ---------- */
  var PRAISE = {
    correct: ['Awesome!', 'You got it!', 'Brilliant!', 'Nailed it!', 'Smarty-pants!'],
    streak: ['Streak on fire! 🔥', "You're unstoppable!", 'Daily hero!'],
    levelUp: ['Level up! 🚀', 'New level unlocked!'],
    wrong: ['Almost! Try again.', "Not yet — you've got this!", 'Good guess — let’s review.', 'So close!']
  };
  var PEMOJI = { correct: ['🎉', '🌟', '💫', '✨', '🥳'], streak: ['🔥', '⚡', '🌈'], levelUp: ['🚀', '🏆', '🎊'], wrong: ['💪', '🌱', '💡'] };
  var praiseEl;
  SG.praise = {
    show: function (type) {
      if (!praiseEl) return;
      praiseEl.querySelector('.p-emoji').textContent = rnd(PEMOJI[type] || PEMOJI.correct);
      praiseEl.querySelector('.p-text').textContent = rnd(PRAISE[type] || PRAISE.correct);
      praiseEl.classList.add('show'); praiseEl.classList.remove('show'); void praiseEl.offsetWidth; praiseEl.classList.add('show');
      clearTimeout(SG.praise._t); SG.praise._t = setTimeout(function () { praiseEl.classList.remove('show'); }, 1500);
    }
  };

  /* ---------- MASCOT ---------- */
  var mascotEl, mascotSays;
  var MLINES = { neutral: ['Hi! Ready to play?', 'Pick a day!', "Let's learn!"], happy: ['Yay!', 'You did it!', 'So proud!'], think: ['Hmm, try once more?', 'That was tricky!', "We'll get it."], excited: ['WOW!', 'Incredible!', 'Champion!'] };
  SG.mascot = {
    setMood: function (m) {
      if (!mascotEl) return;
      mascotEl.className = 'mood-' + m;
      if (mascotSays) mascotSays.textContent = rnd(MLINES[m] || MLINES.neutral);
      if (m === 'happy' || m === 'excited') { clearTimeout(SG.mascot._t); SG.mascot._t = setTimeout(function () { SG.mascot.setMood('neutral'); }, 2500); }
    }
  };

  /* ---------- RING ---------- */
  SG.ring = {
    svg: function (pct) {
      var r = 18, c = 2 * Math.PI * r, off = c - (pct / 100) * c;
      return '<svg class="day-ring" viewBox="0 0 44 44"><circle class="ring-bg" cx="22" cy="22" r="' + r + '" fill="none" stroke-width="4"/><circle class="ring-fg" cx="22" cy="22" r="' + r + '" fill="none" stroke-width="4" stroke-dasharray="' + c + '" stroke-dashoffset="' + off + '"/><text x="22" y="26" text-anchor="middle">' + Math.round(pct) + '%</text></svg>';
    },
    set: function (svg, pct) {
      var c = svg.querySelector('.ring-fg'); if (!c) return;
      var r = 18, circ = 2 * Math.PI * r;
      c.style.strokeDasharray = circ; c.style.strokeDashoffset = circ - (pct / 100) * circ;
      var t = svg.querySelector('text'); if (t) t.textContent = Math.round(pct) + '%';
      if (pct >= 100) c.classList.add('ring-done');
    }
  };

  /* ---------- STREAK + XP ---------- */
  var streak = loadObj(STREAK_KEY), xp = loadObj(XP_KEY); xp.total = xp.total || 0; xp.level = xp.level || 1;
  SG.streak = {
    count: function () { return streak.count || 0; },
    bump: function (dayKey) {
      var today = new Date().toISOString().slice(0, 10);
      if (streak.lastDay === today) return;
      var y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      streak.count = (streak.lastDay === y) ? (streak.count || 0) + 1 : 1;
      streak.lastDay = today; saveObj(STREAK_KEY, streak);
      if (streak.count % 5 === 0) { SG.confetti({ count: 70 }); SG.praise.show('streak'); sound.play('levelUp'); }
    }
  };
  SG.xp = {
    add: function (n) {
      var need = xp.level * 100; xp.total += n;
      var leveled = false;
      while (xp.total >= need) { xp.total -= need; xp.level++; leveled = true; need = xp.level * 100; }
      saveObj(XP_KEY, xp);
      if (leveled) { sound.play('levelUp'); SG.mascot.setMood('excited'); SG.praise.show('levelUp'); SG.confetti({ count: 120 }); }
    }
  };

  /* ---------- progress (kept logic; counts day done when both subject slots true) ---------- */
  function updateProgress() {
    var totalDays = 0, doneDays = 0;
    for (var w = 0; w < SG.SCHEDULE.length; w++) {
      for (var d = 0; d < SG.SCHEDULE[w].length; d++) {
        var dayKey = w + '-' + d, subjects = SG.SCHEDULE[w][d], allDone = true;
        for (var s = 0; s < subjects.length; s++) { if (!completed[dayKey + '-' + s]) { allDone = false; break; } }
        totalDays++; if (allDone) doneDays++;
      }
    }
    var pct = totalDays ? Math.round((doneDays / totalDays) * 100) : 0;
    var fill = document.getElementById('summer-progress-fill');
    var txt = document.getElementById('summer-progress-text');
    if (fill) fill.style.width = pct + '%';
    if (txt) txt.textContent = doneDays + ' / ' + totalDays + ' days (' + pct + '%)';
  }

  /* ---------- onWin (per day) ---------- */
  function onWin(dayKey, ringSvg) {
    if (!done[dayKey]) {
      done[dayKey] = true; saveObj(DONE_KEY, done);
      completed[dayKey + '-0'] = true; completed[dayKey + '-1'] = true;
      saveObj(STORAGE_KEY, completed);
      updateProgress();
      SG.streak.bump(dayKey); SG.xp.add(20);
      var card = document.querySelector(".day-game-card[data-day='" + dayKey + "']");
      if (card) card.classList.add('done');
      if (ringSvg) SG.ring.set(ringSvg, 100);
      // timed feedback: sound → praise+mascot → celebration
      sound.play('correct');
      setTimeout(function () { SG.praise.show('correct'); SG.mascot.setMood('happy'); }, 90);
      setTimeout(function () { SG.confetti({ count: 100 }); }, 180);
    } else {
      // replay win — light feedback only
      sound.play('correct'); SG.praise.show('correct'); if (ringSvg) SG.ring.set(ringSvg, 100);
    }
  }

  /* ============================================================
     RENDERERS — each: function(stage, content, ctx)
     ctx = { setRing, onWin }
     ============================================================ */

  function ringPctOf(part, total) { return total ? Math.round((part / total) * 100) : 0; }

  // 1. SCRATCH
  function renderScratch(stage, c, ctx) {
    var box = el('div', 'sg-scratch');
    var answer = el('div', 'answer', esc(c.fact));
    var canvas = el('canvas');
    box.appendChild(answer); box.appendChild(canvas); stage.appendChild(box);
    setTimeout(init, 30);
    function init() {
      var w = box.clientWidth || 320, h = 150;
      canvas.width = w; canvas.height = h;
      var g = canvas.getContext('2d');
      var grad = g.createLinearGradient(0, 0, w, h); grad.addColorStop(0, '#DFBD69'); grad.addColorStop(1, '#926F34');
      g.fillStyle = grad; g.fillRect(0, 0, w, h);
      g.fillStyle = '#5a4a1a'; g.font = '600 14px "Merriweather Sans",sans-serif';
      g.textAlign = 'center'; g.fillText('👆 Wipe to reveal!', w / 2, h / 2);
      var drawing = false, wiped = 0, won = false;
      function pos(e) { var r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
      function wipe(e) {
        if (!drawing || won) return; var p = pos(e);
        g.globalCompositeOperation = 'destination-out';
        g.beginPath(); g.arc(p.x, p.y, 22, 0, Math.PI * 2); g.fill(); wiped++;
        if (wiped > 22 && !won) { won = true; ctx.setRing(100); ctx.onWin(); }
      }
      canvas.addEventListener('pointerdown', function (e) { drawing = true; wipe(e); });
      canvas.addEventListener('pointermove', wipe);
      window.addEventListener('pointerup', function () { drawing = false; });
    }
  }

  // 2. WORD SEARCH (pointer drag)
  function renderWordSearch(stage, c, ctx) {
    var SIZE = 10, words = c.words.slice();
    var grid = [], found = new Set(), sel = [], startCell = null, dragging = false;
    function place() {
      grid = []; for (var r = 0; r < SIZE; r++) { grid.push([]); for (var k = 0; k < SIZE; k++) grid[r].push(null); }
      var dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
      words.forEach(function (w) {
        for (var t = 0; t < 300; t++) {
          var d = dirs[Math.floor(Math.random() * dirs.length)];
          var r = Math.floor(Math.random() * SIZE), col = Math.floor(Math.random() * SIZE);
          var er = r + d[0] * (w.length - 1), ec = col + d[1] * (w.length - 1);
          if (er < 0 || er >= SIZE || ec < 0 || ec >= SIZE) continue;
          var ok = true;
          for (var k = 0; k < w.length; k++) { var cc = grid[r + d[0] * k][col + d[1] * k]; if (cc && cc !== w[k]) { ok = false; break; } }
          if (!ok) continue;
          for (var k = 0; k < w.length; k++) grid[r + d[0] * k][col + d[1] * k] = w[k];
          return;
        }
      });
      for (var r = 0; r < SIZE; r++) for (var col = 0; col < SIZE; col++) if (!grid[r][col]) grid[r][col] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    }
    place();
    var gridEl = el('div', 'sg-ws-grid'); gridEl.style.gridTemplateColumns = 'repeat(' + SIZE + ', 34px)';
    var cells = [];
    for (var r = 0; r < SIZE; r++) for (var col = 0; col < SIZE; col++) { var d = el('div', 'sg-ws-cell', grid[r][col]); d.dataset.r = r; d.dataset.c = col; cells.push(d); gridEl.appendChild(d); }
    var wordsEl = el('div', 'sg-ws-words'); words.forEach(function (w) { var s = el('span'); s.textContent = w; s.dataset.w = w; wordsEl.appendChild(s); });
    stage.appendChild(gridEl); stage.appendChild(wordsEl);
    function idx(r, cc) { return r * SIZE + cc; }
    function clearSel() { sel.forEach(function (x) { x.classList.remove('sel'); }); sel = []; }
    function between(a, b) {
      var r1 = +a.dataset.r, c1 = +a.dataset.c, r2 = +b.dataset.r, c2 = +b.dataset.c;
      var dr = Math.sign(r2 - r1), dc = Math.sign(c2 - c1);
      if (dr !== 0 && dc !== 0 && Math.abs(r2 - r1) !== Math.abs(c2 - c1)) return null;
      var len = Math.max(Math.abs(r2 - r1), Math.abs(c2 - c1)); var out = [];
      for (var k = 0; k <= len; k++) { var r = r1 + dr * k, cc = c1 + dc * k; if (r < 0 || r >= SIZE || cc < 0 || cc >= SIZE) return null; out.push(cells[idx(r, cc)]); }
      return out;
    }
    function cellFromPoint(x, y) { var el2 = document.elementFromPoint(x, y); if (el2 && el2.classList.contains('sg-ws-cell')) return el2; return null; }
    gridEl.addEventListener('pointerdown', function (e) {
      var t = e.target; if (!t.classList.contains('sg-ws-cell')) return;
      dragging = true; startCell = t; clearSel(); t.classList.add('sel'); sel = [t]; e.preventDefault();
    });
    window.addEventListener('pointermove', function (e) {
      if (!dragging) return; var t = cellFromPoint(e.clientX, e.clientY);
      if (!t || !t.classList.contains('sg-ws-cell')) return;
      var path = between(startCell, t); if (path) { clearSel(); path.forEach(function (x) { x.classList.add('sel'); }); sel = path; }
    });
    window.addEventListener('pointerup', function () {
      if (!dragging) return; dragging = false;
      var word = sel.map(function (x) { return x.textContent; }).join('');
      var rev = word.split('').reverse().join('');
      var match = words.indexOf(word) >= 0 ? word : (words.indexOf(rev) >= 0 ? rev : null);
      if (match && !found.has(match)) {
        sel.forEach(function (x) { x.classList.add('found'); });
        found.add(match);
        var span = wordsEl.querySelector('span[data-w="' + match + '"]'); if (span) span.classList.add('done');
        sound.play('correct'); SG.praise.show('correct');
        ctx.setRing(ringPctOf(found.size, words.length));
        if (found.size === words.length) ctx.onWin();
      }
      clearSel();
    });
  }

  // 3. MATCH (click pairs)
  function renderMatch(stage, c, ctx) {
    var pairs = c.pairs, n = pairs.length;
    var left = shuffle(pairs.map(function (p, i) { return { i: i, text: p[0] }; }));
    var right = shuffle(pairs.map(function (p, i) { return { i: i, text: p[1] }; }));
    var selL = null, selR = null, locked = 0;
    var wrap = el('div', 'sg-match');
    var lc = el('div'); lc.appendChild(el('div', 'col-title', 'Words'));
    var ulL = el('ul'); left.forEach(function (it) { var li = el('li'); li.dataset.i = it.i; li.innerHTML = '<span>' + esc(it.text) + '</span>'; ulL.appendChild(li); }); lc.appendChild(ulL);
    var rc = el('div'); rc.appendChild(el('div', 'col-title', 'Meanings'));
    var ulR = el('ul'); right.forEach(function (it) { var li = el('li'); li.dataset.i = it.i; li.innerHTML = '<span>' + esc(it.text) + '</span>'; ulR.appendChild(li); }); rc.appendChild(ulR);
    wrap.appendChild(lc); wrap.appendChild(rc); stage.appendChild(wrap);
    ulL.addEventListener('click', function (e) { var li = e.target.closest('li'); if (!li || li.classList.contains('score')) return; if (selL) ulL.querySelector('li[data-i="' + selL + '"]').removeAttribute('data-selected'); li.setAttribute('data-selected', 'true'); selL = li.dataset.i; tryMatch(); });
    ulR.addEventListener('click', function (e) { var li = e.target.closest('li'); if (!li || li.classList.contains('score')) return; if (selR) ulR.querySelector('li[data-i="' + selR + '"]').removeAttribute('data-selected'); li.setAttribute('data-selected', 'true'); selR = li.dataset.i; tryMatch(); });
    function tryMatch() {
      if (selL === null || selR === null) return;
      var lE = ulL.querySelector('li[data-i="' + selL + '"]'), rE = ulR.querySelector('li[data-i="' + selR + '"]');
      if (selL === selR) {
        lE.classList.add('score'); rE.classList.add('score'); lE.removeAttribute('data-selected'); rE.removeAttribute('data-selected');
        sound.play('correct'); locked++; ctx.setRing(ringPctOf(locked, n));
        if (locked === n) { SG.praise.show('correct'); ctx.onWin(); }
      } else {
        [lE, rE].forEach(function (x) { x.classList.add('shake'); setTimeout(function () { x.classList.remove('shake'); }, 400); x.removeAttribute('data-selected'); });
        sound.play('wrong'); SG.praise.show('wrong'); SG.mascot.setMood('think');
      }
      selL = null; selR = null;
    }
  }

  // 4. DRAG SORT (pointer reorder)
  function renderDragSort(stage, c, ctx) {
    var items = shuffle(c.items);
    var list = el('div', 'sg-sort');
    var nodeFor = function (it) { var n2 = el('div', 'sg-sort-item', esc(it.text)); n2.dataset.order = it.order; return n2; };
    items.forEach(function (it) { list.appendChild(nodeFor(it)); });
    var checkBtn = el('button', 'sg-btn accent', 'Check Order');
    list.appendChild(checkBtn);
    stage.appendChild(list);
    var dragNode = null, startTop = 0, pointerStart = 0, dragH = 0, placeholder = null;
    list.addEventListener('pointerdown', function (e) {
      var it = e.target.closest('.sg-sort-item'); if (!it || it === checkBtn) return;
      dragNode = it; dragH = it.offsetHeight; startTop = it.offsetTop; pointerStart = e.clientY;
      it.classList.add('dragging'); it.setPointerCapture(e.pointerId); e.preventDefault();
    });
    list.addEventListener('pointermove', function (e) {
      if (!dragNode) return; var dy = e.clientY - pointerStart;
      dragNode.style.transform = 'translateY(' + dy + 'px)';
      var siblings = Array.prototype.filter.call(list.children, function (x) { return x !== dragNode && x !== checkBtn; });
      var curTop = startTop + dy;
      for (var i = 0; i < siblings.length; i++) { var s = siblings[i]; if (s.offsetTop > curTop + dragH / 2) break; }
      // move dragNode to position before siblings[i]
      var ref = siblings[i] || null;
      if (ref && ref.previousElementSibling !== dragNode) list.insertBefore(dragNode, ref);
      else if (!ref && list.lastElementChild.previousElementSibling !== dragNode) list.insertBefore(dragNode, checkBtn);
    });
    function endDrag() {
      if (!dragNode) return; dragNode.style.transform = ''; dragNode.classList.remove('dragging'); dragNode = null;
    }
    list.addEventListener('pointerup', endDrag); list.addEventListener('pointercancel', endDrag);
    checkBtn.addEventListener('click', function () {
      sound.play('click');
      var orderNodes = Array.prototype.filter.call(list.children, function (x) { return x.classList.contains('sg-sort-item'); });
      var allOk = true;
      orderNodes.forEach(function (n2, i) { if (+n2.dataset.order === i) { n2.classList.add('correct'); } else { n2.classList.remove('correct'); allOk = false; } });
      if (allOk) { ctx.setRing(100); ctx.onWin(); }
      else { sound.play('wrong'); SG.praise.show('wrong'); SG.mascot.setMood('think'); }
    });
  }

  // 5. FLIP CARDS
  function renderFlip(stage, c, ctx) {
    var cards = c.cards, seen = 0;
    var grid = el('div', 'sg-flip-grid');
    cards.forEach(function (card) {
      var f = el('div', 'sg-flip'); f.innerHTML = '<div class="flip-inner"><div class="flip-front">' + esc(card.front) + '</div><div class="flip-back">' + esc(card.back) + '</div></div>';
      f.addEventListener('click', function () { if (f.classList.contains('flipped')) return; f.classList.add('flipped', 'seen'); sound.play('click'); seen++; ctx.setRing(ringPctOf(seen, cards.length)); if (seen === cards.length) { SG.praise.show('correct'); ctx.onWin(); } });
      grid.appendChild(f);
    });
    stage.appendChild(grid);
  }

  // 6. HANGMAN
  function renderHangman(stage, c, ctx) {
    var answer = c.word.toLowerCase(), guessed = [], wrong = 0, MAX = 6, over = false, won = false;
    var wrap = el('div', 'sg-hang');
    var hint = el('div', 'sg-hang-hint', 'Hint: ' + esc(c.hint));
    var wordEl = el('div', 'sg-hang-word'); var lives = el('div', 'sg-hang-lives'); var kb = el('div', 'sg-hang-kb'); var msg = el('div', 'sg-hang-msg');
    wrap.appendChild(hint); wrap.appendChild(lives); wrap.appendChild(wordEl); wrap.appendChild(kb); wrap.appendChild(msg);
    stage.appendChild(wrap);
    function render() {
      wordEl.textContent = answer.split('').map(function (l) { return guessed.indexOf(l) >= 0 ? l.toUpperCase() : '_'; }).join(' ');
      lives.textContent = 'Lives: ' + Array.from({ length: MAX }, function (_, i) { return i < wrong ? '💔' : '❤️'; }).join(' ');
      kb.innerHTML = '';
      won = answer.split('').every(function (l) { return guessed.indexOf(l) >= 0; }); over = wrong >= MAX;
      'abcdefghijklmnopqrstuvwxyz'.split('').forEach(function (l) {
        var b = el('button'); b.textContent = l.toUpperCase(); b.disabled = guessed.indexOf(l) >= 0 || over || won;
        if (guessed.indexOf(l) >= 0) b.classList.add(answer.indexOf(l) >= 0 ? 'correct' : 'wrong');
        if (!over && !won) b.addEventListener('click', function () { guess(l); });
        kb.appendChild(b);
      });
      if (won) { msg.textContent = 'You won! 🎉'; ctx.setRing(100); ctx.onWin(); }
      else if (over) { msg.textContent = 'The word was: ' + answer.toUpperCase() + ' — try a new day!'; sound.play('wrong'); SG.mascot.setMood('think'); }
      else { msg.textContent = ''; }
    }
    function guess(l) {
      if (guessed.indexOf(l) >= 0 || over || won) return; guessed.push(l);
      if (answer.indexOf(l) >= 0) { sound.play('correct'); ctx.setRing(ringPctOf(answer.split('').filter(function (x) { return guessed.indexOf(x) >= 0; }).length, answer.split('').filter(function (x, i, a) { return a.indexOf(x) === i; }).length)); }
      else { wrong++; sound.play('wrong'); SG.praise.show('wrong'); }
      render();
    }
    render();
  }

  // 7. FILL BLANK (click-to-fill, touch friendly)
  function renderFillBlank(stage, c, ctx) {
    var parts = c.sentence.split('*'), blanks = c.blanks, answers = new Array(blanks.length).fill(null), checked = false;
    var sentenceEl = el('div', 'sg-fb-sentence'); var slots = [];
    parts.forEach(function (p, i) { sentenceEl.appendChild(document.createTextNode(p)); if (i < blanks.length) { var s = el('span', 'sg-fb-slot', '____'); s.dataset.i = i; s.addEventListener('click', function () { answers[i] = null; s.textContent = '____'; s.classList.remove('filled', 'wrong'); checkUsed(); }); sentenceEl.appendChild(s); slots.push(s); } });
    var bank = el('div', 'sg-fb-bank');
    shuffle(blanks).forEach(function (w) { var wd = el('span', 'sg-fb-word', esc(w)); wd.dataset.w = w; wd.addEventListener('click', function () { var empty = answers.indexOf(null); if (empty < 0) return; fillSlot(empty, w, slots[empty]); }); bank.appendChild(wd); });
    var ctrl = el('div', 'sg-fb-controls');
    var checkBtn = el('button', 'sg-btn', 'Check'); var status = el('div', 'game-status'); ctrl.appendChild(checkBtn);
    stage.appendChild(sentenceEl); stage.appendChild(bank); stage.appendChild(ctrl); stage.appendChild(status);
    function fillSlot(i, w, s) { var prev = answers.indexOf(w); if (prev >= 0) { answers[prev] = null; slots[prev].textContent = '____'; slots[prev].classList.remove('filled', 'wrong'); } answers[i] = w; s.textContent = w; s.classList.add('filled'); s.classList.remove('wrong'); checkUsed(); }
    function checkUsed() { bank.querySelectorAll('.sg-fb-word').forEach(function (x) { x.classList.toggle('used', answers.indexOf(x.dataset.w) >= 0); }); }
    checkBtn.addEventListener('click', function () {
      sound.play('click'); var ok = 0; checked = true;
      slots.forEach(function (s, i) { s.classList.remove('wrong'); if (answers[i] === blanks[i]) { s.classList.add('filled'); ok++; } else { s.classList.add('wrong'); } });
      if (ok === blanks.length) { status.textContent = 'Correct! 🎉'; status.className = 'game-status ok'; ctx.setRing(100); ctx.onWin(); }
      else { status.textContent = ok + ' of ' + blanks.length + ' correct — try again!'; status.className = 'game-status no'; sound.play('wrong'); SG.praise.show('wrong'); SG.mascot.setMood('think'); }
    });
  }

  // 8. QUIZ (multiple choice; covers T/F with 2 options)
  function renderQuiz(stage, c, ctx) {
    var qs = c.questions, i = 0, score = 0, answered = false;
    var scoreEl = el('div', 'sg-quiz-score', 'Score: 0 / ' + qs.length);
    var prog = el('div', 'sg-quiz-prog');
    var qEl = el('div', 'sg-quiz-q');
    var opts = el('div', 'sg-quiz-opts');
    var nextWrap = el('div', 'sg-quiz-controls');
    var nextBtn = el('button', 'sg-btn', 'Next ›'); nextBtn.style.display = 'none'; nextWrap.appendChild(nextBtn);
    stage.appendChild(scoreEl); stage.appendChild(prog); stage.appendChild(qEl); stage.appendChild(opts); stage.appendChild(nextWrap);
    function render() {
      answered = false; prog.textContent = 'Question ' + (i + 1) + ' of ' + qs.length; qEl.textContent = qs[i].q; opts.innerHTML = '';
      qs[i].options.forEach(function (txt, idx) {
        var b = el('button', 'sg-quiz-opt'); b.innerHTML = '<span class="txt">' + esc(txt) + '</span><span class="ic"></span>';
        b.addEventListener('click', function () { select(idx, b); });
        opts.appendChild(b);
      });
      opts.classList.toggle('row', qs[i].options.length === 2);
      nextBtn.style.display = 'none';
    }
    function select(idx, btn) {
      if (answered) return; answered = true;
      var correct = idx === qs[i].a;
      if (correct) { btn.classList.add('correct'); btn.querySelector('.ic').textContent = '✓'; score++; scoreEl.textContent = 'Score: ' + score + ' / ' + qs.length; sound.play('correct'); SG.praise.show('correct'); }
      else { btn.classList.add('incorrect'); btn.querySelector('.ic').textContent = '✗'; opts.children[qs[i].a].classList.add('correct'); opts.children[qs[i].a].querySelector('.ic').textContent = '✓'; sound.play('wrong'); SG.mascot.setMood('think'); }
      Array.prototype.forEach.call(opts.children, function (x) { x.classList.add('disabled'); });
      ctx.setRing(ringPctOf(i + 1, qs.length));
      nextBtn.style.display = '';
    }
    nextBtn.addEventListener('click', function () { sound.play('click'); i++; if (i < qs.length) render(); else { qEl.textContent = 'Done! You scored ' + score + ' / ' + qs.length + ' 🎉'; opts.innerHTML = ''; nextBtn.style.display = 'none'; prog.textContent = ''; ctx.onWin(); } });
    render();
  }

  var RENDERERS = { scratch: renderScratch, wordSearch: renderWordSearch, match: renderMatch, dragSort: renderDragSort, flip: renderFlip, hangman: renderHangman, fillBlank: renderFillBlank, quizMC: renderQuiz };

  /* ---------- ripple ---------- */
  function attachRipple(btn) {
    btn.addEventListener('pointerdown', function (e) {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      var r = btn.getBoundingClientRect(); var sp = el('span', 'ripple'); var d = Math.max(r.width, r.height);
      sp.style.width = sp.style.height = d + 'px';
      var x = (e.clientX || 0) - (r.left + d / 2), y = (e.clientY || 0) - (r.top + d / 2);
      sp.style.left = x + 'px'; sp.style.top = y + 'px';
      sp.addEventListener('animationend', function () { sp.remove(); }); btn.appendChild(sp);
    });
  }

  /* ---------- build day-game-card ---------- */
  function pairClass(day) {
    // determine ribbon class from the two subjects
    var a = day[0][0], b = day[1][0];
    var has = function (s) { return a === s || b === s; };
    if (has('Math') && has('Science')) return 'math-sci';
    if (has('ELA') && has('Social Studies')) return 'ela-ss';
    if (has('Math') && has('ELA')) return 'math-ela';
    return 'sci-ss';
  }
  function subjectClass(name) { return { Math: 'math', ELA: 'ela', Science: 'science', 'Social Studies': 'social' }[name] || 'math'; }

  function buildDayCard(w, d) {
    var dayKey = w + '-' + d, day = SG.SCHEDULE[w][d], g = SG.GAMES[dayKey];
    var isDone = !!done[dayKey];
    var card = el('div', 'day-game-card sg-reveal ' + pairClass(day) + (isDone ? ' done' : ''));
    card.dataset.day = dayKey; card.style.setProperty('--i', d);
    var ribbon = el('div', 'day-ribbon'); card.appendChild(ribbon);

    var header = el('div', 'day-header');
    var dots = '<span class="day-subj-dots">' + day.map(function (s) { return '<i class="dot dot-' + subjectClass(s[0]) + '"></i>'; }).join('') + '</span>';
    var streakCount = SG.streak.count();
    header.innerHTML = '<span class="day-label">Day ' + (d + 1) + '</span>' + dots +
      '<span class="day-streak' + (streakCount ? '' : ' empty') + '">🔥 ' + streakCount + '</span>' + SG.ring.svg(isDone ? 100 : 0);
    card.appendChild(header);

    var tags = el('div', 'subject-tags');
    day.forEach(function (s) { var t = el('span', 'gtag ' + subjectClass(s[0])); t.textContent = s[0]; tags.appendChild(t); });
    card.appendChild(tags);

    var topics = el('div', 'game-topics');
    day.forEach(function (s) { topics.appendChild(el('div', 'gt', '<b>' + esc(s[0]) + '</b>' + esc(s[1]))); });
    card.appendChild(topics);

    var title = el('div', 'game-title', '🎯 Activity: ' + activityName(g.type));
    card.appendChild(title);
    var hint = el('div', 'game-hint', activityHint(g.type));
    card.appendChild(hint);

    var stage = el('div', 'game-stage'); card.appendChild(stage);
    var ringSvg = header.querySelector('svg.day-ring');
    var ctx = {
      setRing: function (pct) { SG.ring.set(ringSvg, pct); },
      onWin: function () { onWin(dayKey, ringSvg); }
    };
    // render game immediately (card is in DOM after append)
    setTimeout(function () {
      var r = RENDERERS[g.type];
      if (r) r(stage, g.content, ctx);
    }, 0);

    return card;
  }

  function activityName(t) {
    return { scratch: 'Scratch & Reveal', wordSearch: 'Word Search', match: 'Match the Pairs', dragSort: 'Drag to Order', flip: 'Flip the Cards', hangman: 'Guess the Word', fillBlank: 'Fill the Blanks', quizMC: 'Quick Quiz' }[t] || 'Game';
  }
  function activityHint(t) {
    return {
      scratch: 'Wipe the gold card to uncover the answer.',
      wordSearch: 'Drag across the letters to find each word.',
      match: 'Tap a word, then tap its meaning.',
      dragSort: 'Drag the steps into the right order, then Check.',
      flip: 'Tap each card to flip and reveal.',
      hangman: 'Guess the letters before you run out of hearts.',
      fillBlank: 'Tap a word, then a blank. Check when ready.',
      quizMC: 'Pick the best answer for each question.'
    }[t] || '';
  }

  /* ---------- render all weeks ---------- */
  function renderGameCards() {
    var container = document.getElementById('summer-weeks');
    if (!container) return;
    container.innerHTML = '';
    container.classList.add('summer-weeks');
    for (var w = 0; w < SG.SCHEDULE.length; w++) {
      var panel = el('div', 'week-panel'); panel.dataset.weekPanel = w;
      panel.appendChild(el('div', 'week-panel-title', 'Week ' + (w + 1)));
      for (var d = 0; d < SG.SCHEDULE[w].length; d++) panel.appendChild(buildDayCard(w, d));
      container.appendChild(panel);
    }
    revealObserve(container);
  }

  /* ---------- scroll reveal (IntersectionObserver) ---------- */
  function revealObserve(root) {
    var els = root.querySelectorAll('.sg-reveal, .sg-stagger');
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('is-visible'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ---------- week nav (scroll-snap, scrollIntoView) ---------- */
  function wireWeekNav() {
    var nav = document.getElementById('week-nav'); if (!nav) return;
    nav.addEventListener('click', function (e) {
      var btn = e.target.closest('.week-btn'); if (!btn) return;
      var w = btn.dataset.week;
      nav.querySelectorAll('.week-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var panel = document.querySelector(".week-panel[data-week-panel='" + w + "']");
      if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      sound.play('click');
    });
    // update active button on scroll
    var weeks = document.getElementById('summer-weeks');
    if (weeks && 'IntersectionObserver' in window) {
      var panels = weeks.querySelectorAll('.week-panel');
      var pio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { var w = en.target.dataset.weekPanel; nav.querySelectorAll('.week-btn').forEach(function (b) { b.classList.toggle('active', b.dataset.week === w); }); } });
      }, { threshold: 0.5, root: weeks });
      panels.forEach(function (p) { pio.observe(p); });
    }
  }

  /* ---------- reset ---------- */
  function wireReset() {
    var btn = document.getElementById('reset-summer'); if (!btn) return;
    attachRipple(btn);
    btn.addEventListener('click', function () {
      if (!confirm('Reset all Grade 4 Summer games & progress?')) return;
      completed = {}; done = {}; streak = {}; saveObj(STORAGE_KEY, completed); saveObj(DONE_KEY, done); saveObj(STREAK_KEY, streak);
      updateProgress(); renderGameCards(); sound.play('click'); SG.mascot.setMood('neutral');
    });
  }

  /* ---------- build overlay elements (mascot, praise) ---------- */
  function buildOverlays() {
    var summer = document.getElementById('summer'); if (!summer) return;
    if (!document.getElementById('sg-praise')) {
      praiseEl = el('div'); praiseEl.id = 'sg-praise';
      praiseEl.innerHTML = '<div class="p-emoji">🎉</div><div class="p-text">Awesome!</div>';
      summer.appendChild(praiseEl);
    } else praiseEl = document.getElementById('sg-praise');
    if (!document.getElementById('sg-mascot')) {
      mascotEl = el('div'); mascotEl.id = 'sg-mascot'; mascotEl.className = 'mood-neutral';
      mascotEl.innerHTML = '<div class="mascot-says">Hi! Ready to play?</div>' +
        '<svg viewBox="0 0 120 120" width="120" height="120" aria-hidden="true">' +
        '<circle cx="60" cy="62" r="48" fill="#7c3aed"/><circle class="eye" cx="44" cy="56" r="6" fill="#fff"/><circle class="eye" cx="76" cy="56" r="6" fill="#fff"/>' +
        '<path class="mouth" d="M44 78 Q60 90 76 78" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/>' +
        '<circle class="cheek" cx="36" cy="72" r="5" fill="#fb7185" opacity="0"/><circle class="cheek" cx="84" cy="72" r="5" fill="#fb7185" opacity="0"/></svg>';
      summer.appendChild(mascotEl);
      mascotSays = mascotEl.querySelector('.mascot-says');
    } else { mascotEl = document.getElementById('sg-mascot'); mascotSays = mascotEl.querySelector('.mascot-says'); }
    ensureConfetti();
  }

  /* ---------- ripple for all sg-btn ---------- */
  function wireRipples() {
    document.querySelectorAll('.sg-btn').forEach(attachRipple);
  }

  /* ---------- INIT ---------- */
  SG.init = function () {
    if (!document.getElementById('summer-weeks')) return;
    buildOverlays();
    renderGameCards();
    wireWeekNav();
    wireReset();
    updateProgress();
    wireRipples();
    // re-wire ripples for dynamically created buttons
    var obs = new MutationObserver(function () { document.querySelectorAll('.sg-btn:not([data-rip])').forEach(function (b) { b.dataset.rip = '1'; attachRipple(b); }); });
    var weeks = document.getElementById('summer-weeks'); if (weeks) obs.observe(weeks, { childList: true, subtree: true });
  };

  window.SummerGames = SG;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', SG.init);
  else SG.init();
})();