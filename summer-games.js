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
    '0-0': { type: 'mission', content: {
      title: 'Power Up the City',
      intro: 'A blackout hit Brooklyn! Learn the skills, then restore power block by block.',
      winText: '🎉 The city is lit! You powered through Day 1.',
      phases: [
        { kind: 'lesson', subject: 'Math', title: 'Place Value to 1,000,000', blocks: [
          { h: 'What is place value?', p: 'Every digit in a number has a value based on its position — its place. The farther left a digit sits, the bigger its value. In Grade 4 we work with whole numbers up to 1,000,000 (one million).', example: 'In 342,891: the 3 means 300,000; the 4 means 40,000; the 2 means 2,000; the 8 means 800; the 9 means 90; the 1 means 1.' },
          { h: 'Each place is 10× the one to its right', p: 'Moving one place to the left makes a digit worth 10 times more. Moving one place to the right makes it worth 10 times less. This is why our number system is called base-ten.', example: 'A 4 in the ten-thousands place (40,000) is worth 10× a 4 in the thousands place (4,000), and 1/10 of a 4 in the hundred-thousands place (400,000).' },
          { h: 'Read it in groups of three', p: 'Read big numbers in groups of three from the right: ones, thousands, millions. Each group has ones, tens, hundreds. The comma marks the thousands group.', diagram: '<div class="sg-pv"><div class="sg-pv-group"><span class="sg-pv-glabel">Thousands</span><div class="sg-pv-cells"><b>7</b><b>4</b><b>2</b></div><div class="sg-pv-cols"><span>Hundred-thousands</span><span>Ten-thousands</span><span>Thousands</span></div></div><div class="sg-pv-comma">,</div><div class="sg-pv-group"><span class="sg-pv-glabel">Ones</span><div class="sg-pv-cells"><b>3</b><b>1</b><b>8</b></div><div class="sg-pv-cols"><span>Hundreds</span><span>Tens</span><span>Ones</span></div></div></div><div class="sg-pv-cap">742,318 → “seven hundred forty-two thousand, three hundred eighteen”</div>', example: '742,318 → “seven hundred forty-two thousand, three hundred eighteen.”', tip: 'Say the group name (thousand / million) at each comma — never at the last group.' },
          { h: 'Expanded form', p: 'Expanded form breaks a number apart to show the value of each digit, written as a sum. It proves you understand what every digit is worth.', example: '742,318 = 700,000 + 40,000 + 2,000 + 300 + 10 + 8. You can also write 50,327 = 50,000 + 300 + 20 + 7.' },
          { h: 'Compare digit by digit', p: 'To compare two numbers, line up their places and read from the left. The first place where the digits differ tells you which is bigger.', example: '845,210 vs 845,199 → same hundred-thousands, same ten-thousands, same thousands, same hundreds; the tens differ: 1 ten vs 9 tens, so 845,210 is greater. Use >, <, or =.' },
          { h: 'Rounding', p: 'Rounding gives a close, friendly number. Pick the place to round to, then look at the digit just to its right: 5 or more rounds up, less than 5 rounds down. Everything to the right becomes zero.', example: 'Round 742,318 to the nearest thousand → 742,000 (the hundreds digit 3 is less than 5). Round 742,318 to the nearest hundred-thousand → 700,000 (the ten-thousands digit 4 is less than 5).' },
          { h: 'Why it matters', p: 'Big numbers are everywhere — city populations, distances, money, test scores. Place value lets you read, compare, and round them quickly instead of being overwhelmed.', tip: 'On a test, underline the place you are rounding to before you look at the next digit — it stops careless errors.' }
        ] },
        { kind: 'drill', subject: 'Math', title: 'Place Value Drill', questions: [
          { prompt: 'What is the value of the digit 4 in 342,891?', options: ['4,000', '40,000', '400,000'], a: 1, okMsg: '40,000 — the ten-thousands place.' },
          { prompt: 'Which digit is in the hundred-thousands place in 742,318?', options: ['7', '4', '2'], a: 0, okMsg: '7 → 700,000.' },
          { prompt: 'Round 742,318 to the nearest thousand.', options: ['742,000', '740,000', '743,000'], a: 0, okMsg: '742,000 — the 3 hundreds rounds down.' },
          { prompt: 'Compare: 845,210 ___ 845,199', options: ['>', '<', '='], a: 0, okMsg: 'Greater — bigger tens digit.' },
          { prompt: 'In 912,004, the 9 is in which place?', options: ['Hundred-thousands', 'Ten-thousands', 'Millions'], a: 0, okMsg: 'Hundred-thousands — 900,000.' },
          { prompt: 'Write: three hundred twenty-four thousand, five.', options: ['324,005', '324,500', '32,405'], a: 0, okMsg: '324,005 — the “five” sits in the ones.' }
        ] },
        { kind: 'lesson', subject: 'Science', title: 'Forms of Energy', blocks: [
          { h: 'What is energy?', p: 'Energy is the ability to make things happen — to move, glow, heat up, make sound, or grow. Nothing around you can change without energy. It is in your food, the wind, a battery, and sunlight.', example: 'When you run, you use energy from food. When a TV turns on, it uses electrical energy.' },
          { h: 'The big rule: energy never disappears', p: 'Energy cannot be created or destroyed — it only changes form. The total amount of energy always stays the same. Scientists call this the law of conservation of energy.', tip: '“Disappear” is a trick — energy just changes into a form you can’t see, like heat spreading into the air.' },
          { h: 'The main forms of energy', p: 'Scientists sort energy into forms: sound (what you hear), light (what you see), heat or thermal (warmth), electrical (from outlets and batteries), motion (movement), and stored energy (like food or a stretched rubber band).', diagram: '<div class="sg-energy-forms"><span>🔊 Sound</span><span>💡 Light</span><span>🔥 Heat</span><span>⚡ Electrical</span><span>🏃 Motion</span><span>🔋 Stored</span></div>' },
          { h: 'Spot the clues', p: 'You can tell the form of energy by what it does: glows = light, hums or is loud = sound, feels warm = heat, needs a plug or battery = electrical, moving = motion.', example: 'A flashlight glows (light) and gets warm (heat). A speaker hums (sound) and vibrates (motion).' },
          { h: 'Energy changes form (conversion)', p: 'Devices convert energy from one form into another. Something goes IN and something comes OUT. Usually electrical energy goes in, and light, heat, sound, or motion comes out.', diagram: '<div class="sg-flow"><span class="sg-flow-in">⚡ Electrical</span><span class="sg-flow-arrow">→</span><span class="sg-flow-box">💡 Lamp</span><span class="sg-flow-arrow">→</span><span class="sg-flow-out">💡 Light + 🔥 Heat</span></div><div class="sg-flow"><span class="sg-flow-in">⚡ Electrical</span><span class="sg-flow-arrow">→</span><span class="sg-flow-box">🌀 Fan</span><span class="sg-flow-arrow">→</span><span class="sg-flow-out">🏃 Motion + 🔊 Sound</span></div>' },
          { h: 'Energy transfers', p: 'Energy also moves from object to object. A rolling ball carries motion energy and passes it to whatever it hits. The total energy is conserved — it just travels.', example: 'A bowling ball transfers motion to the pins — the pins fly (motion) and you hear a crash (sound).' },
          { h: 'Why it matters', p: 'Understanding energy helps you read science texts, explain how machines work, and save energy at home. Watch for the IN→OUT pattern whenever a device is described.', tip: 'On a test, look for “changes into” or “turns into” — that signals an energy conversion.' }
        ] },
        { kind: 'practice', subject: 'Science', title: 'Energy Recap — Match the Form', mode: 'match', pairs: [
          ['Sound', 'Energy we hear'],
          ['Light', 'Energy we see'],
          ['Heat', 'Thermal energy (warmth)'],
          ['Electrical', 'From outlets & batteries'],
          ['Motion', 'Energy of movement'],
          ['Stored', 'Waiting to be used (food, a battery)']
        ] },
        { kind: 'activity', title: 'Power Up the City', stages: [
          { type: 'quiz', subject: 'Math · Place value', story: 'The first meter reads 342,891. Find the value of the digit 4 to unlock Block 1.', prompt: 'What is the value of digit 4 in 342,891?', options: ['4,000', '40,000', '400,000'], a: 1, okMsg: '40,000 — ten-thousands. Block 1 online!' },
          { type: 'match', subject: 'Science · Energy sources', story: 'Block 2 needs power. Match each everyday source to the form of energy it gives off.', pairs: [ ['A glowing lamp','Light'], ['A campfire','Heat'], ['A barking dog','Sound'], ['A rolling skateboard','Motion'], ['A wall outlet','Electrical'] ] },
          { type: 'input', subject: 'Math · Rounding', story: 'Block 3’s meter shows 742,318. Round it to the nearest thousand to calibrate.', prompt: 'Round 742,318 to the nearest thousand (type the number):', accept: ['742000', '742,000'], okMsg: '742,000 — calibrated! Block 3 online!' },
          { type: 'fillBlank', subject: 'Science · Energy conversion', story: 'Final block. A lamp is plugged in. Complete the energy conversion to light the city.', sentence: 'A lamp changes * energy into light and *.', blanks: ['electrical', 'heat'] }
        ] }
      ]
    } },
    '0-1': { type: 'mission', content: {
      title: 'Map the Evidence',
      intro: 'A clue is hidden across New York. Learn to read closely and read maps, then follow the trail.',
      winText: '🎉 Case cracked — you tracked the clue across NY!',
      phases: [
        { kind: 'lesson', subject: 'ELA', title: 'Close Reading & Text Evidence', blocks: [
          { h: 'Read like a detective', p: 'Close reading means reading a text slowly and more than once to understand it deeply and notice details you would miss the first time. You read with a question in mind.', example: 'Read once for the gist, again for details, a third time to answer questions.' },
          { h: 'Reread three times', p: 'Each reread has a job: first for what it is mostly about, second for the important details, third to answer a question or prove a claim. Slowing down is the whole point.', tip: 'Underline confusing words on the second read and jot a quick question in the margin.' },
          { h: 'Explicit vs. inferred details', p: 'Explicit details are stated right in the text — the words are there. Inferred details are not said directly; you figure them out from clues plus what you already know.', example: '“The dog barked” = explicit. “The dog was probably hungry” (because it stared at the food) = inferred.' },
          { h: 'Prove it with evidence', p: 'Good readers do not guess — they prove answers using the text. Use direct quotes, the phrase “the text says…”, or reread to find the exact spot that supports your answer.', tip: 'A strong answer = your idea + the exact words from the text that prove it.' },
          { h: 'Direct quotes', p: 'A direct quote copies the exact words from the text, inside quotation marks. It is the strongest evidence because it is word-for-word.', example: 'The text says, “She had not spoken to anyone all week,” which proves she felt lonely.' },
          { h: 'Paraphrasing vs. quoting', p: 'Paraphrasing retells the evidence in your own words; quoting copies it exactly. Use a quote when the exact words matter, and paraphrase when only the idea matters.', example: 'Quote: “the storm hit at dawn.” Paraphrase: the storm arrived early in the morning.' },
          { h: 'Why it matters', p: 'Close reading is how you prove you understand a text — on tests, in discussions, and in writing. Claims without evidence are just opinions.', tip: 'On a test, always ask: “Where in the text did I get that?” If you can’t point to it, reread.' }
        ] },
        { kind: 'drill', subject: 'ELA', title: 'Text Evidence Drill', questions: [
          { prompt: 'Close reading means…', options: ['Reading once, fast', 'Reading carefully, more than once', 'Skipping hard parts'], a: 1, okMsg: 'Slow and repeated — that’s close reading.' },
          { prompt: '“The text says…” is an example of…', options: ['Text evidence', 'A guess', 'An opinion'], a: 0, okMsg: 'Citing the text = evidence.' },
          { prompt: 'A detail stated directly in the text is…', options: ['Explicit', 'Inferred', 'Made up'], a: 0, okMsg: 'Explicit — right there in the words.' },
          { prompt: 'A detail you figure out from clues is…', options: ['Inferred', 'Explicit', 'Wrong'], a: 0, okMsg: 'Inferred — reasoned from clues.' },
          { prompt: 'Best way to find evidence for an answer?', options: ['Reread the passage', 'Guess and move on', 'Ask a friend'], a: 0, okMsg: 'Reread — the proof is in the text.' },
          { prompt: 'A direct quote is…', options: ['Exact words copied from the text', 'Your own retelling', 'A short summary'], a: 0, okMsg: 'Exact words = a direct quote.' }
        ] },
        { kind: 'lesson', subject: 'Social Studies', title: 'NYS Geography Basics', blocks: [
          { h: 'Where is New York?', p: 'New York is a state in the Northeast of the United States. It sits along the Atlantic Ocean to the southeast and shares a northern and western border with Canada.', example: 'From Brooklyn, New York City is in the far southeast corner of the state.' },
          { h: 'Two Great Lakes and a border', p: 'New York borders two Great Lakes — Erie on the west and Ontario on the north — plus Canada to the north and west. Lakes and rivers made NY a natural route for travel and trade.', example: 'Lake Erie sits beside Buffalo; Lake Ontario sits beside Rochester.' },
          { h: 'Cities and the capital', p: 'Major cities include New York City (southeast, biggest), Buffalo (west), Rochester, Syracuse, and Albany. Albany is the capital — where the state government meets — even though NYC is bigger.', tip: 'Albany is the capital, but NYC is the biggest city. Don’t mix them up!' },
          { h: 'Rivers: Hudson and Mohawk', p: 'The Hudson River runs north–south down eastern NY, past Albany all the way to New York City. The Mohawk River cuts west and was a natural path into the interior.', example: 'The Hudson flows past Albany and NYC, connecting the capital to the sea.' },
          { h: 'Mountains: Adirondacks and Catskills', p: 'The Adirondacks are a mountain range in the north; the Catskills are in the south. High land, forests, and rivers shape where people settled.', diagram: '<div class="sg-energy-forms"><span>🏔️ Adirondacks</span><span>⛰️ Catskills</span><span>🌊 Hudson R.</span><span>💧 Lake Erie</span><span>💧 Lake Ontario</span><span>🏙️ Albany</span><span>🏙️ NYC</span></div>' },
          { h: 'Local connection: Brooklyn', p: 'Brooklyn is one of the five boroughs of New York City and sits in Kings County. Linking map work to your own community makes geography real.', example: 'On a political map, Brooklyn sits on the western end of Long Island, across the river from Manhattan.' },
          { h: 'Why it matters', p: 'Geography shapes how people live — where cities grow, how goods move, and which routes explorers and settlers used. Reading NY maps is the first step in understanding the state’s history.', tip: 'When you see a map, first check the key, then look for water and borders — they explain a lot.' }
        ] },
        { kind: 'practice', subject: 'Social Studies', title: 'NYS Geography — Word Search', mode: 'wordSearch', words: ['HUDSON', 'ALBANY', 'ERIE', 'ONTARIO', 'BUFFALO', 'CATSKILLS'] },
        { kind: 'activity', title: 'Map the Evidence', stages: [
          { type: 'quiz', subject: 'SS · NYS geography', story: 'Start in NY. Which two Great Lakes touch New York State?', prompt: 'New York borders which Great Lakes?', options: ['Erie & Ontario', 'Superior & Huron', 'Michigan only'], a: 0, okMsg: 'Erie & Ontario — western & northern borders. Clue 1 found!' },
          { type: 'dragSort', subject: 'ELA · Close reading', story: 'A detective reads in order. Put the close-reading steps in the right sequence.', items: [ {text:'Read once for the gist', order:0}, {text:'Reread for important details', order:1}, {text:'Reread a third time to answer', order:2}, {text:'Cite exact evidence from the text', order:3} ] },
          { type: 'match', subject: 'SS · NY cities', story: 'The trail crosses the state. Match each city to where it sits.', pairs: [ ['Buffalo','Western NY (Lake Erie)'], ['Albany','Capital, eastern NY'], ['New York City','Southeast, biggest city'], ['Rochester','North of Buffalo'] ] },
          { type: 'input', subject: 'ELA · Explicit vs inferred', story: 'A detail stated right in the text has a name. Type it to crack the case.', prompt: 'A detail stated directly in the text is ___ (one word):', accept: ['explicit'], okMsg: 'Explicit — stated right there. Case closed!' }
        ] }
      ]
    } },
    '0-2': { type: 'mission', content: {
      title: 'Times the Trouble',
      intro: 'The baker’s oven is acting up. Learn “times as many” and how to summarize, then fix the kitchen.',
      winText: '🎉 Recipes scaled, fix summarized — kitchen saved!',
      phases: [
        { kind: 'lesson', subject: 'Math', title: 'Multiplicative Comparison', blocks: [
          { h: '“Times as many”', p: 'Multiplicative comparison compares two amounts using multiplication. “A is 4 times as many as B” means A = 4 × B. The first amount is the bigger one and the second is the smaller one you multiply.', example: 'If one batch has 3 eggs and you need 4 times as many, that’s 4 × 3 = 12 eggs.' },
          { h: 'Write it as an equation', p: 'Turn the words into an equation: bigger = (times) × smaller. The “times” number is the multiplier, and it tells you how many copies of the smaller amount you need.', tip: 'Equation template:  bigger  =  multiplier  ×  smaller' },
          { h: 'Clue words', p: 'Word problems use clue words to signal multiplication: “times as many,” “twice as much,” “three times as long,” “double.” Spot the clue and you spot the multiplier.', example: '“A rope is 3 times as long as a 5-foot rope” → 3 × 5 = 15 feet.' },
          { h: 'Multiplicative vs. additive', p: 'Multiplicative comparison uses “times” (multiplication). Additive comparison uses “more than” (addition). “4 times as many” (×) is very different from “4 more than” (+).', example: '4 times as many as 3 = 12.  4 more than 3 = 7. Different!' },
          { h: 'Solving word problems', p: 'Steps: (1) read carefully, (2) find the smaller amount, (3) find the multiplier, (4) multiply. Circle the clue words and the numbers as you read.', example: 'A dog has 4 legs. 4 dogs → 4 × 4 = 16 legs. 16 is 4 times as many as 4.' },
          { h: 'Check reasonableness', p: 'After multiplying, ask: does my answer make sense? 4 times as many should be bigger than the smaller number (unless the multiplier is 1). If it is smaller, re-check.', tip: '“Times as many” with a multiplier bigger than 1 always gives a bigger answer than the smaller amount.' },
          { h: 'Why it matters', p: 'Multiplicative comparison is how we scale recipes, build arrays, and reason about groups. It is the foundation for ratios and multiplication word problems in Grade 4 and beyond.', tip: 'Whenever you hear “times as many,” think: multiply by the times number.' }
        ] },
        { kind: 'drill', subject: 'Math', title: 'Multiplicative Comparison — Fill the Blanks', engine: 'fillBlank', sentence: '12 is * times as many as 3.  4 × * = 20.  3 × 6 = *.  Twice as many as 7 = *.  5 × 8 = *.', blanks: ['4', '5', '18', '14', '40'] },
        { kind: 'lesson', subject: 'ELA', title: 'Summary vs. Central Idea', blocks: [
          { h: 'What is a summary?', p: 'A summary is a short retelling of a text in your own words — the important points, not every detail. It captures what happened without adding your opinion.', example: '“A girl moves to a new city and learns to make friends by joining a soccer team.”' },
          { h: 'How long, and whose words?', p: 'A summary is about 2–3 sentences long and uses your own words, not copied sentences from the text. Short, clear, and faithful to what the text actually says.', tip: 'If you copy a sentence word-for-word, that is a quote — not a summary.' },
          { h: 'What is the central idea?', p: 'The central idea is the big message or main point the text is mostly about — the lesson or the “so what?” It is one sentence that captures the heart of the text.', example: 'Central idea: “Trying new things helps you find where you belong.”' },
          { h: 'How details support it', p: 'Key details from the text prove the central idea. Pick the details that matter — the ones that would not make sense without the central idea — not random facts.', example: 'Detail: “She scored her first goal after a teammate passed her the ball” supports “teamwork helps you belong.”' },
          { h: 'Summary vs. central idea', p: 'A summary tells what happened (events). The central idea tells what it means (message). A text has one central idea but can be summarized many ways.', tip: 'Summary = retell the events. Central idea = state the message.' },
          { h: 'Building both', p: 'To find the central idea, ask “what is this mostly about?” Then pick 2–3 details that prove it. To summarize, retell those details in order in your own words.', example: 'Central idea first, then summary: “Teamwork helps you belong. A girl joins a soccer team, struggles, then scores her first goal after a teammate’s pass.”' },
          { h: 'Why it matters', p: 'Summarizing and finding the central idea are how you show you understood a text — on tests, in book reports, and in conversations. They separate the important from the unimportant.', tip: 'On a test, always answer: what is it mostly about (central idea) and what happened (summary).' }
        ] },
        { kind: 'practice', subject: 'ELA', title: 'Build a Summary — Drag in Order', mode: 'dragSort', items: [
          { text: 'Topic sentence: Mia joined a new soccer team.', order: 0 },
          { text: 'At first she struggled to fit in.', order: 1 },
          { text: 'A teammate passed her the ball at practice.', order: 2 },
          { text: 'She scored her first goal and felt she belonged.', order: 3 },
          { text: 'Closing: Teamwork helped Mia find her place.', order: 4 }
        ] },
        { kind: 'activity', title: 'Times the Trouble', stages: [
          { type: 'hangman', subject: 'Math · Comparison clue', story: 'Decode the clue word for “times as many” to scale the first recipe.', word: 'times', hint: 'Clue word: “___ as many” means multiply' },
          { type: 'fillBlank', subject: 'ELA · Summary', story: 'The logbook needs a clean summary line. Fill the missing words.', sentence: 'A good summary retells a text in your * words in about * to three sentences.', blanks: ['own', 'two'] },
          { type: 'input', subject: 'Math · Comparison equation', story: '4 dogs each have 4 legs. How many legs total? (4 × 4)', prompt: 'Type the total number of legs (4 × 4):', accept: ['16'], okMsg: '16 legs — 4 times as many as 4!' },
          { type: 'match', subject: 'ELA · Terms', story: 'Match each term to what it means to close the case.', pairs: [ ['Summary','Short retelling in your own words'], ['Central idea','The big message of the text'], ['Multiplier','The “times” number'], ['Key detail','Proves the central idea'] ] }
        ] }
      ]
    } },
    '0-3': { type: 'mission', content: {
      title: 'Energy Journey',
      intro: 'Track energy moving through a home, then read the right map to find the way home.',
      winText: '🎉 Energy traced and maps mastered — journey done!',
      phases: [
        { kind: 'lesson', subject: 'Science', title: 'Energy Transfers', blocks: [
          { h: 'Energy moves and changes', p: 'Energy never disappears — it transfers, meaning it changes from one form into another. The total amount stays the same. This is called conservation of energy.', example: 'A lamp takes electrical energy and turns it into light + heat. Nothing is lost — it just changes form.' },
          { h: 'Transfer vs. conversion', p: 'A transfer is energy moving from one object or place to another. A conversion is energy changing from one form into another. Most devices do both at once.', example: 'A hot cocoa warms your hands: heat transfers from cocoa to hands. A lamp converts electrical energy to light.' },
          { h: 'Everyday conversions', p: 'Devices convert energy for us: a toaster (electrical → heat), a fan (electrical → motion + sound), a TV (electrical → light + sound), a lamp (electrical → light + heat).', tip: 'Look for what goes IN (usually electrical) and what comes OUT (light, heat, sound, motion).' },
          { h: 'The IN → OUT pattern', p: 'Every energy story has an input form and output form(s). Trace it: IN → [device] → OUT. The output is what you see, hear, feel, or measure.', diagram: '<div class="sg-flow"><span class="sg-flow-in">⚡ Electrical</span><span class="sg-flow-arrow">→</span><span class="sg-flow-box">🔆 Lamp</span><span class="sg-flow-arrow">→</span><span class="sg-flow-out">💡 Light + 🔥 Heat</span></div>' },
          { h: 'Transfer object → object', p: 'Energy also moves between objects without changing form. A rolling ball transfers motion to a pin it knocks over. A hot pan transfers heat to your hand.', example: 'Ball → pin: motion in, motion out (plus a little sound and heat from the collision).' },
          { h: 'What carries energy', p: 'Sound, light, heat, and electric currents all carry energy from place to place. Anything that warms, glows, moves, or makes noise is moving energy.', tip: 'See motion → motion energy. See glow → light energy. Feel warmth → heat energy.' },
          { h: 'Why it matters', p: 'Tracing energy helps you understand machines, nature, and your own body (food → motion + heat). Engineers design devices by controlling the IN → OUT path.', tip: 'Whenever a device runs, ask: what form goes in, and what form(s) come out?' }
        ] },
        { kind: 'drill', subject: 'Science', title: 'Energy Transfer Drill', questions: [
          { prompt: 'Energy can…', options: ['Change from one form to another', 'Turn into nothing', 'Only stay the same'], a: 0, okMsg: 'It transfers — one form into another.' },
          { prompt: 'A toaster changes electrical energy into…', options: ['Heat', 'Light mainly', 'Motion'], a: 0, okMsg: 'Heat — that’s your toast.' },
          { prompt: 'A lamp changes electrical energy into…', options: ['Light and heat', 'Food', 'Nothing'], a: 0, okMsg: 'Light + heat.' },
          { prompt: 'True statement about energy:', options: ['It never disappears, only changes form', 'It can vanish', 'It is always created new'], a: 0, okMsg: 'Conservation — energy only changes form.' },
          { prompt: 'A fan mainly changes electrical energy into…', options: ['Motion', 'Food', 'Light'], a: 0, okMsg: 'Motion — spinning blades.' },
          { prompt: 'When a ball hits a pin, energy transfers as…', options: ['Motion', 'Heat only', 'Nothing'], a: 0, okMsg: 'Motion → motion (+ a little sound).' }
        ] },
        { kind: 'lesson', subject: 'Social Studies', title: 'Map Types: Physical, Political, Thematic', blocks: [
          { h: 'Political map', p: 'A political map shows boundaries and names — borders of countries/states, cities, and capitals. Use it to find where places are and who governs them.', example: 'A political map of NY shows the border with Pennsylvania, and cities like Buffalo and Albany.' },
          { h: 'Physical map', p: 'A physical map shows natural landforms and water — mountains, plains, rivers, lakes. Colors often show elevation (how high the land is).', tip: 'See mountains, rivers, lakes → physical. See borders, cities, names → political.' },
          { h: 'Thematic map', p: 'A thematic map shows a pattern or one topic across an area — rainfall, population, elections, or crops. It answers “where does this happen?”', example: 'A map shaded by how much rain each region gets is a thematic map.' },
          { h: 'Use the map key', p: 'Every map has a key (legend) that explains what its symbols and colors mean. Always check the key before you read a map — it is the map’s dictionary.', diagram: '<div class="sg-energy-forms"><span>🗺️ Political</span><span>🏔️ Physical</span><span>📊 Thematic</span><span>🔑 Key/Legend</span><span>📏 Scale</span><span>🧭 Compass</span></div>' },
          { h: 'Map scale', p: 'Scale tells you how map distance relates to real distance — for example, one inch on the map might equal 10 miles in real life. Scale lets you measure real distances.', example: 'A small scale bar on the map shows how far a mile is in real ground.' },
          { h: 'Pick the right map', p: 'Match the map to your question. Borders and cities? Political. Landforms and water? Physical. One topic or pattern? Thematic. Using the wrong map gives the wrong answer.', tip: 'Ask: what do I need to find? Then choose the map type that shows it.' },
          { h: 'Why it matters', p: 'Maps are tools for thinking geographically. Knowing the types lets you choose the right one for any question — from planning a trip to understanding weather or history.', tip: 'On a test, name the map type and say what it shows to prove you read it right.' }
        ] },
        { kind: 'practice', subject: 'Social Studies', title: 'Map Types — Flip the Cards', mode: 'flip', cards: [
          { front: 'Political map', back: 'Shows borders, cities, and names.' },
          { front: 'Physical map', back: 'Shows mountains, rivers, lakes, landforms.' },
          { front: 'Thematic map', back: 'Shows one topic — rainfall, population, elections.' },
          { front: 'Map key (legend)', back: 'Explains what symbols and colors mean.' },
          { front: 'Scale', back: 'Relates map distance to real distance.' }
        ] },
        { kind: 'activity', title: 'Energy Journey', stages: [
          { type: 'quiz', subject: 'Science · Energy transfer', story: 'Energy never disappears — it changes. Pick the true statement.', prompt: 'Energy can ___?', options: ['Change from one form to another', 'Turn into nothing', 'Only ever stay the same'], a: 0, okMsg: 'It transfers — one form into another. Stop 1!' },
          { type: 'match', subject: 'SS · Map types', story: 'Match each map type to the job it does best.', pairs: [ ['Political map','Find borders & cities'], ['Physical map','See mountains & rivers'], ['Thematic map','Show rainfall or population'], ['Map key','Explain symbols & colors'] ] },
          { type: 'input', subject: 'Science · Energy conversion', story: 'A toaster runs. It changes electrical energy into ___ (besides light).', prompt: 'A toaster turns electrical energy into ___ (one word):', accept: ['heat', 'thermal'], okMsg: 'Heat — your toast! Stop 3!' },
          { type: 'scratch', subject: 'SS · Map secret', story: 'Last stretch: wipe the card to reveal the final map fact.', fact: 'A physical map shows mountains, rivers, and lakes — not borders or cities! 🗺️' }
        ] }
      ]
    } },

    '1-0': { type: 'mission', content: {
      title: 'Power the Block',
      intro: 'A city block needs power. Master multi-digit add & subtract, learn how energy converts, then switch on the block.',
      winText: '🎉 Power flowing — the block is lit!',
      phases: [
        { kind: 'lesson', subject: 'Math', title: 'Multi-Digit Addition & Subtraction', blocks: [
          { h: 'Line up by place value', p: 'To add or subtract big numbers, stack them so ones line up with ones, tens with tens, hundreds with hundreds. The decimal/comma stays in the same column.', example: '  4,528 + 1,346 — line up the thousands, then hundreds, tens, ones.' },
          { h: 'Add: right to left, carry', p: 'Start at the ones. Add each column. If a column sums to 10 or more, carry the extra ten into the next column to the left.', tip: 'Carry = trade 10 ones for 1 ten, or 10 tens for 1 hundred.' },
          { h: 'Subtract: right to left, regroup', p: 'Start at the ones. If the top digit is too small, borrow (regroup) 1 from the column to the left — that becomes 10 in the current column.', example: '  5,000 − 1,263: the ones need borrowing because 0 < 3.' },
          { h: 'Regrouping across zeros', p: 'When you borrow across a zero, the zero becomes 9 after you take 1 from the first non-zero column to the left. Work carefully column by column.', tip: '5,000 − 1,263 = 3,737. Check: 3,737 + 1,263 = 5,000 ✓.' },
          { h: 'Check with an estimate', p: 'Round each number to the nearest hundred or thousand and compute roughly. If your exact answer is far from the estimate, re-check your work.', example: '4,528 + 1,346 ≈ 4,500 + 1,300 = 5,800. Exact = 5,874 — close ✓.' },
          { h: 'Word problems', p: 'Read the problem, decide add or subtract, line up the numbers, then compute and check. “How many more” usually means subtract; “in all” usually means add.', example: 'A block uses 4,528 kWh in June and 1,346 more in July. July = 4,528 + 1,346 = 5,874 kWh.' },
          { h: 'Why it matters', p: 'Multi-digit add and subtract are used everywhere — money, measurements, data. Getting the columns right is the whole secret.', tip: 'Always line up places and always estimate-check.' }
        ] },
        { kind: 'drill', subject: 'Math', title: 'Add & Subtract Drill', questions: [
          { prompt: '4,528 + 1,346 = ?', options: ['5,874', '5,784', '5,864'], a: 0, okMsg: '5,874 — carried correctly.' },
          { prompt: '5,000 − 1,263 = ?', options: ['3,737', '3,837', '4,737'], a: 0, okMsg: '3,737 — borrowed across zeros.' },
          { prompt: '6,200 + 2,705 = ?', options: ['8,905', '8,805', '8,915'], a: 0, okMsg: '8,905.' },
          { prompt: '9,000 − 4,518 = ?', options: ['4,482', '4,582', '5,482'], a: 0, okMsg: '4,482.' },
          { prompt: 'Estimate 3,910 + 2,080 (round to thousands).', options: ['6,000', '5,000', '7,000'], a: 0, okMsg: '4,000 + 2,000 = 6,000.' },
          { prompt: '“How many more” signals…', options: ['Subtract', 'Add', 'Multiply'], a: 0, okMsg: 'Subtract — find the difference.' }
        ] },
        { kind: 'lesson', subject: 'Science', title: 'Energy Conversions', blocks: [
          { h: 'Conversion = change form', p: 'An energy conversion is energy changing from one form into another. The device is the converter; the forms are what go in and what come out.', example: 'A fan converts electrical energy into motion (and a little sound).' },
          { h: 'Electrical → other forms', p: 'Most home devices take electrical energy in and convert it to useful outputs: light, heat, motion, or sound.', tip: 'Look for the plug or battery — that is usually the electrical input.' },
          { h: 'Everyday converters', p: 'Lamp: electrical → light + heat. Toaster: electrical → heat. TV: electrical → light + sound. Fan: electrical → motion + sound.', example: 'A phone turns electrical energy from the battery into light (screen) and sound (speaker).' },
          { h: 'The IN → OUT pattern', p: 'Trace every converter as IN → [device] → OUT. The output is what you see, hear, feel, or measure.', diagram: '<div class="sg-flow"><span class="sg-flow-in">⚡ Electrical</span><span class="sg-flow-arrow">→</span><span class="sg-flow-box">🔆 Lamp</span><span class="sg-flow-arrow">→</span><span class="sg-flow-out">💡 Light + 🔥 Heat</span></div>' },
          { h: 'Conservation', p: 'Energy is never lost in a conversion — the total amount stays the same. Some output (like heat) may be “wasted” but it still exists.', tip: 'Input energy = useful output + wasted output. Nothing disappears.' },
          { h: 'Where energy comes from', p: 'Electrical energy comes from sources. Renewable sources (sunlight, wind, water) replenish naturally. Non-renewable sources (coal, oil, natural gas) are used up.', example: 'Solar panels convert light into electricity; burning coal converts stored energy into heat.' },
          { h: 'Why it matters', p: 'Understanding conversions helps you choose efficient devices and protect the environment by favoring renewable sources.', tip: 'When a device runs, ask: what form goes in, what forms come out?' }
        ] },
        { kind: 'practice', subject: 'Science', title: 'Sort the Energy Sources', mode: 'categorize', bins: ['Renewable', 'Non-renewable'], items: [
          { text: 'Sunlight', bin: 0 }, { text: 'Wind', bin: 0 }, { text: 'Water (hydro)', bin: 0 },
          { text: 'Coal', bin: 1 }, { text: 'Oil', bin: 1 }, { text: 'Natural gas', bin: 1 }
        ] },
        { kind: 'activity', title: 'Power the Block', stages: [
          { type: 'trueFalse', subject: 'Math · Add & subtract', story: 'Check the meters. Tap True or False for each statement.', statements: [ {t:'4,528 + 1,346 = 5,874', a:true}, {t:'5,000 − 1,263 = 4,737', a:false}, {t:'Estimating helps you catch mistakes', a:true} ] },
          { type: 'match', subject: 'Science · Converters', story: 'Match each device to what it converts.', pairs: [ ['Solar panel','Light → Electrical'], ['Lamp','Electrical → Light'], ['Fan','Electrical → Motion'], ['Toaster','Electrical → Heat'] ] },
          { type: 'input', subject: 'Math · Subtract', story: 'One building used 6,000 kWh and another used 2,400 kWh. How many more did the first use?', prompt: '6,000 − 2,400 = ?', accept: ['3600', '3,600'], okMsg: '3,600 — the difference! Breaker 3 on.' },
          { type: 'fillBlank', subject: 'Science · Conversion', story: 'Finish the conversion sentence to close the circuit.', sentence: 'A lamp changes * energy into light and *.', blanks: ['electrical', 'heat'] }
        ] }
      ]
    } },

    '1-1': { type: 'mission', content: {
      title: 'The Longhouse Trail',
      intro: 'Walk the trail into NY’s first communities. Learn how texts are built and how the Haudenosaunee & Algonquian lived, then map the longhouse.',
      winText: '🎉 Trail mapped — the longhouse stands!',
      phases: [
        { kind: 'lesson', subject: 'ELA', title: 'Text Structure: Sequence & Cause/Effect', blocks: [
          { h: 'What is text structure?', p: 'Text structure is how a writer organizes information. Spotting the structure helps you follow and remember what you read.', example: 'A recipe uses sequence; a science article often uses cause and effect.' },
          { h: 'Sequence', p: 'Sequence tells events or steps in time order. Signal words: first, next, then, after, finally. Use it for steps, timelines, and how-tos.', tip: 'See first/next/finally → the structure is sequence.' },
          { h: 'Cause and effect', p: 'Cause and effect explains why something happens (cause) and what happens because of it (effect). One event makes another happen.', example: 'Cause: it rained. Effect: the trail got muddy.' },
          { h: 'Signal words for cause/effect', p: 'Because, so, since, therefore, as a result, due to. These words point from a cause to its effect.', tip: '“Because” introduces the cause; “so” introduces the effect.' },
          { h: 'Telling them apart', p: 'Sequence = time order (when). Cause/effect = reason (why). A text can mix both: steps in order, each step causing the next.', example: '“First she planted seeds, so they grew” mixes sequence (first) and cause/effect (so).' },
          { h: 'Use structure to understand', p: 'Once you know the structure, you can predict what comes next and find the main points faster. It turns a wall of text into a map.', tip: 'Ask: is the author telling me WHEN or WHY?' },
          { h: 'Why it matters', p: 'Strong readers use structure as a roadmap. It makes summarizing and answering questions easier and more accurate.', tip: 'On a test, name the structure and the signal words that prove it.' }
        ] },
        { kind: 'drill', subject: 'ELA', title: 'Rebuild the Sequence', engine: 'scramble', words: ['First', 'read', 'the', 'text', 'then', 'find', 'evidence'] },
        { kind: 'lesson', subject: 'Social Studies', title: 'Haudenosaunee & Algonquian', blocks: [
          { h: 'Native peoples first', p: 'Long before Europeans arrived, Native peoples lived in what is now New York. They had rich cultures, governments, and ways of life tied to the land.', example: 'The Haudenosaunee and Algonquian were two major groups in NY.' },
          { h: 'The Haudenosaunee', p: 'The Haudenosaunee (also called the Iroquois) were a confederacy of six nations in central and northern NY. They are famous for their longhouses and a peaceful alliance.', tip: 'Haudenosaunee = “people of the longhouse.”' },
          { h: 'The Algonquian', p: 'Algonquian peoples lived in eastern NY and along rivers and coasts. They relied heavily on water for food, travel, and trade.', example: 'Algonquian communities often lived near rivers and the Atlantic shore.' },
          { h: 'Longhouse & clan life', p: 'Longhouses were large wood-and-bark homes that held several families from one clan. A clan is a group of related families.', diagram: '<div class="sg-energy-forms"><span>🏠 Longhouse</span><span>👨‍👩‍👧 Clan</span><span>🌽 Three Sisters</span><span>🛶 Rivers</span><span>🦌 Hunting</span><span>🤝 Confederacy</span></div>' },
          { h: 'Three Sisters farming', p: 'The Haudenosaunee planted the “Three Sisters” — corn, beans, and squash — together. Each plant helped the others grow.', example: 'Corn gives beans a pole to climb; beans add nutrients to the soil; squash shades the ground.' },
          { h: 'Rivers for food & travel', p: 'Rivers and lakes provided fish, water, and easy travel by canoe. They also connected communities for trade.', tip: 'Geography shaped life: water nearby meant food and trade.' },
          { h: 'Why it matters', p: 'Native peoples of NY built lasting societies that shaped the state’s history. Their ideas (like the confederacy) even influenced the U.S. government.', tip: 'Remember: Native peoples were here first and their cultures continue today.' }
        ] },
        { kind: 'practice', subject: 'Social Studies', title: 'Build the NY History Timeline', mode: 'timeline', eras: ['Long ago', '1400s', '1500s'], events: [
          { text: 'Native peoples first settle NY', era: 0 },
          { text: 'Haudenosaunee nations unite as a confederacy', era: 1 },
          { text: 'Algonquian & Haudenosaunee trade & share land', era: 2 }
        ] },
        { kind: 'activity', title: 'The Longhouse Trail', stages: [
          { type: 'quiz', subject: 'SS · Haudenosaunee', story: 'A guide asks: which group built the famous longhouses?', prompt: 'Which NY group is known for longhouses?', options: ['Haudenosaunee', 'Aztec', 'Inca'], a: 0, okMsg: 'Haudenosaunee — people of the longhouse. Trail marker 1!' },
          { type: 'match', subject: 'SS · Village life', story: 'Match each term to its meaning.', pairs: [ ['Longhouse','Large shared home'], ['Clan','Group of related families'], ['Three Sisters','Corn, beans, squash'], ['Wampum','Beaded belt / record'] ] },
          { type: 'input', subject: 'SS · Another name', story: 'The Haudenosaunee are also called the ___ (starts with I).', prompt: 'The Haudenosaunee are also called the ___ (one word):', accept: ['iroquois'], okMsg: 'Iroquois — same people. Marker 3!' },
          { type: 'dragSort', subject: 'ELA · Text structure', story: 'Put the close-reading steps in sequence.', items: [ {text:'First, read for time order', order:0}, {text:'Next, find signal words', order:1}, {text:'Then, notice cause and effect', order:2}, {text:'Finally, name the structure', order:3} ] }
        ] }
      ]
    } },

    '1-2': { type: 'mission', content: {
      title: 'Build the Paragraph',
      intro: 'Construct a strong paragraph while multiplying 4-digit numbers with area models. Then assemble the final build.',
      winText: '🎉 Paragraph built and product found — build complete!',
      phases: [
        { kind: 'lesson', subject: 'Math', title: '4-Digit × 1-Digit with Area Models', blocks: [
          { h: 'Multiply = groups of', p: 'Multiplication is repeated addition. 3,426 × 3 means 3 groups of 3,426. The area model breaks the big number into place-value parts.', example: '3,426 × 3 = 3,426 + 3,426 + 3,426.' },
          { h: 'The area model', p: 'Split the big number into thousands, hundreds, tens, ones. Draw a box for each part. Multiply each part by the single digit, then add the partial products.', tip: 'Area model = break, multiply each part, add.' },
          { h: '4-digit example', p: '3,426 × 3: split into 3,000 + 400 + 20 + 6. Multiply each by 3: 9,000 + 1,200 + 60 + 18. Add them up.', example: '9,000 + 1,200 = 10,200; + 60 = 10,260; + 18 = 10,278.' },
          { h: 'Partial products', p: 'Each box gives a partial product (9,000; 1,200; 60; 18). Adding all partial products gives the final product.', tip: 'Write each partial product on its own line, then add — fewer mistakes.' },
          { h: 'Record the final product', p: 'The standard algorithm is the area model compressed: multiply ones, tens, hundreds, thousands, carrying as you go. Both give the same answer.', example: '3,426 × 3 = 10,278 (area model and algorithm agree).' },
          { h: 'Estimate to check', p: 'Round 3,426 to 3,000 and multiply: 3,000 × 3 = 9,000. Your answer 10,278 is in the right ballpark.', tip: 'Estimate first so a wrong digit doesn’t sneak past.' },
          { h: 'Why it matters', p: 'The area model builds number sense — you see WHY the algorithm works, not just how. It scales to bigger numbers and to 2-digit × 2-digit.', tip: 'Break it, multiply each part, add — works every time.' }
        ] },
        { kind: 'drill', subject: 'Math', title: 'Area Model — Fill the Parts', engine: 'fillBlank', sentence: '3,426 × 3: split 3,426 into * , 400, * and 6. Then add 9,000 + 1,200 + 60 + 18 to get the product *.', blanks: ['3000', '20', '10278'] },
        { kind: 'lesson', subject: 'ELA', title: 'Building a Paragraph', blocks: [
          { h: 'What is a paragraph?', p: 'A paragraph is a group of sentences about one main idea. It usually has 3–7 sentences and is indented or separated by a blank line.', example: 'A paragraph about soccer should stay on soccer, not switch to pizza.' },
          { h: 'The topic sentence', p: 'The topic sentence states the main idea of the paragraph. It is usually the first sentence and tells the reader what to expect.', tip: 'Topic sentence = the paragraph’s promise. Put it first.' },
          { h: 'Supporting details', p: 'Supporting details prove, explain, or describe the topic sentence. Pick details that matter — not random facts.', example: 'Topic: “Soccer is fast.” Detail: “A pro sprint can reach 20 mph during a match.”' },
          { h: 'Order & linking words', p: 'Put details in a clear order and connect them with linking words: first, also, for example, in addition, however. This guides the reader.', tip: 'Linking words are the glue between sentences.' },
          { h: 'Indent & paragraph breaks', p: 'Indent the first line or leave a blank line to show a new paragraph. Start a new paragraph when the topic changes.', example: 'New topic → new paragraph. One main idea per paragraph.' },
          { h: 'Closing sentence', p: 'A closing sentence wraps up the paragraph by restating the main idea or giving a final thought. It signals the reader the paragraph is ending.', tip: 'Closing sentence = the paragraph’s “done.”' },
          { h: 'Why it matters', p: 'Strong paragraphs make strong essays and reports. One idea per paragraph, in a clear order, is the backbone of Grade 4 writing.', tip: 'Every paragraph: topic, details, closing — in order.' }
        ] },
        { kind: 'practice', subject: 'ELA', title: 'Rebuild the Topic Sentence', engine: 'scramble', words: ['Soccer', 'is', 'fast', 'and', 'fun', 'to', 'play'] },
        { kind: 'activity', title: 'Build the Paragraph', stages: [
          { type: 'trueFalse', subject: 'ELA · Paragraphs', story: 'Inspect the blueprint. True or False for each.', statements: [ {t:'A topic sentence usually comes first', a:true}, {t:'Supporting details are random facts', a:false}, {t:'A paragraph needs a closing sentence', a:true} ] },
          { type: 'dragSort', subject: 'ELA · Build order', story: 'Stack the paragraph parts in the right order.', items: [ {text:'Topic sentence', order:0}, {text:'First supporting detail', order:1}, {text:'Second supporting detail', order:2}, {text:'Closing sentence', order:3} ] },
          { type: 'input', subject: 'Math · Product', story: 'The build needs the final product. 3,426 × 3 = ?', prompt: '3,426 × 3 = ?', accept: ['10278', '10,278'], okMsg: '10,278 — area model confirmed! Beam 3 placed.' },
          { type: 'match', subject: 'Math + ELA · Terms', story: 'Match each term to lock the build.', pairs: [ ['Topic sentence','States the main idea'], ['Supporting detail','Proves the topic'], ['Area model','Splits by place value'], ['Partial product','One part of the product'] ] }
        ] }
      ]
    } },

    '1-3': { type: 'mission', content: {
      title: 'Design the Solution',
      intro: 'Be an engineer. Learn the design process for energy devices and how geography shaped Native life, then design a working solution.',
      winText: '🎉 Prototype designed, tested, improved — solution shipped!',
      phases: [
        { kind: 'lesson', subject: 'Science', title: 'Designing Energy Devices', blocks: [
          { h: 'The engineering design process', p: 'Engineers solve problems with a process: identify the problem, design a solution, build a prototype, test it, then improve it. It loops — improve and test again.', tip: 'Design is a cycle, not a straight line. Improve → test → improve.' },
          { h: 'Identify the problem', p: 'Start with a clear question: what do you need the device to do, and for whom? A sharp problem guides every later choice.', example: 'Problem: light a room using sunlight so it needs no electricity.' },
          { h: 'Design a converter', p: 'Plan a device that converts energy from an input to the output you need. Sketch it and label the IN and OUT forms.', diagram: '<div class="sg-flow"><span class="sg-flow-in">☀️ Sunlight</span><span class="sg-flow-arrow">→</span><span class="sg-flow-box">🔭 Device</span><span class="sg-flow-arrow">→</span><span class="sg-flow-out">💡 Light</span></div>' },
          { h: 'Build a prototype', p: 'A prototype is a first, simple test model. It does not have to be perfect — it has to show whether your idea works.', tip: 'Prototype = first test model. Build simple, test fast.' },
          { h: 'Test & measure', p: 'Test the prototype and measure the results. Does it convert enough energy? Does it do the job? Record what worked and what failed.', example: 'Measure how bright the light is and how long it lasts.' },
          { h: 'Improve (iterate)', p: 'Use the test results to make it better, then test again. Each cycle improves the design. Engineers iterate many times.', tip: 'Improve = change one thing, test again, compare.' },
          { h: 'Why it matters', p: 'Engineering design turns ideas into devices that solve real problems — from lamps to clean-energy machines. The process works for any problem.', tip: 'Problem → design → prototype → test → improve. Repeat.' }
        ] },
        { kind: 'drill', subject: 'Science', title: 'Design Process Drill', questions: [
          { prompt: 'A prototype is…', options: ['A first test model', 'The final product', 'A drawing only'], a: 0, okMsg: 'First test model.' },
          { prompt: 'First step of the design process?', options: ['Identify the problem', 'Build it', 'Sell it'], a: 0, okMsg: 'Identify the problem first.' },
          { prompt: 'After testing, you should…', options: ['Improve the design', 'Quit', 'Throw it away'], a: 0, okMsg: 'Improve — then test again.' },
          { prompt: 'A device that converts energy has…', options: ['An input and output form', 'No energy', 'Only heat'], a: 0, okMsg: 'IN form → OUT form.' },
          { prompt: 'The design process is…', options: ['A cycle that repeats', 'One straight step', 'Always the same'], a: 0, okMsg: 'A cycle — iterate!' },
          { prompt: 'Why build a prototype?', options: ['To test if the idea works', 'To look nice', 'To skip testing'], a: 0, okMsg: 'To test the idea.' }
        ] },
        { kind: 'lesson', subject: 'Social Studies', title: 'How Geography Shaped Native Life', blocks: [
          { h: 'Geography = land + water + climate', p: 'Geography is the natural features of a place — landforms, water, and climate. It shapes how people live, eat, travel, and build.', example: 'A group near rivers lives differently than a group in mountains.' },
          { h: 'NY landforms', p: 'New York has mountains (Adirondacks, Catskills), plains, rivers (Hudson, Mohawk), and lakes (Erie, Ontario). Each feature offered different resources.', tip: 'Landforms = mountains, plains, valleys; waterways = rivers, lakes.' },
          { h: 'Rivers helped', p: 'Rivers and lakes gave fish and fresh water, and made travel and trade easy by canoe. Communities often grew near water.', example: 'The Hudson and Mohawk rivers were natural highways.' },
          { h: 'Forests shaped homes', p: 'Forests provided wood for longhouses, fuel, and animals to hunt. The Haudenosaunee built longhouses from wood and bark.', diagram: '<div class="sg-energy-forms"><span>🏞️ Rivers</span><span>🌲 Forests</span><span>🏔️ Mountains</span><span>🌽 Farming</span><span>🦌 Hunting</span><span>🛶 Travel</span></div>' },
          { h: 'Farming on the land', p: 'Fertile land let the Haudenosaunee farm the Three Sisters (corn, beans, squash). Farming fed larger communities.', tip: 'Good land + water → farming → bigger villages.' },
          { h: 'Seasons & resources', p: 'NY’s seasons shaped life: planting in spring, harvest in fall, hunting in winter. People used each season’s resources wisely.', example: 'Store food in fall to last through the frozen winter.' },
          { h: 'Why it matters', p: 'Geography drove how Native peoples lived — and how all people live. Reading land and water explains where cities, farms, and roads grow.', tip: 'Where people settle is no accident — follow the water and land.' }
        ] },
        { kind: 'practice', subject: 'Social Studies', title: 'Where Did It Come From?', mode: 'categorize', bins: ['From the river', 'From the forest', 'From farming'], items: [
          { text: 'Fish', bin: 0 }, { text: 'Travel by canoe', bin: 0 },
          { text: 'Wood for longhouses', bin: 1 }, { text: 'Deer hunting', bin: 1 },
          { text: 'Corn', bin: 2 }, { text: 'Beans & squash', bin: 2 }
        ] },
        { kind: 'activity', title: 'Design the Solution', stages: [
          { type: 'dragSort', subject: 'Science · Design steps', story: 'Put the engineering design steps in order.', items: [ {text:'Identify the problem', order:0}, {text:'Design a solution', order:1}, {text:'Build a prototype', order:2}, {text:'Test and improve', order:3} ] },
          { type: 'match', subject: 'Science · Terms', story: 'Match each design term to its meaning.', pairs: [ ['Prototype','First test model'], ['Test','Check if it works'], ['Improve','Make it better'], ['Problem','What needs solving'] ] },
          { type: 'input', subject: 'Science · The model', story: 'A first test model has a name. Type it.', prompt: 'A first test model is called a ___ (one word):', accept: ['prototype'], okMsg: 'Prototype — build it! Step 3 done.' },
          { type: 'timeline', subject: 'Science · Build cycle', story: 'Place each build stage on the timeline.', eras: ['Plan', 'Build', 'Test', 'Improve'], events: [ {text:'Identify the problem', era:0}, {text:'Make a prototype', era:1}, {text:'Test the device', era:2}, {text:'Make it better', era:3} ] }
        ] }
      ]
    } },

    '2-0': { type: 'mission', content: {
      title: 'See the Light',
      intro: 'Open your eyes — and your math. Master 2-digit × 2-digit, learn how we see, then light up the room.',
      winText: '🎉 Product found and eye labeled — the room is lit!',
      phases: [
        { kind: 'lesson', subject: 'Math', title: '2-Digit × 2-Digit Multiplication', blocks: [
          { h: 'Why two digits', p: '2-digit × 2-digit means multiplying numbers like 23 × 14. The area model breaks both numbers into place-value parts so every step is small and clear.', example: '23 × 14 = ? Break both into tens and ones.' },
          { h: 'The area model', p: 'Split each number into tens and ones. Draw a box for every combination. 23 = 20 + 3 and 14 = 10 + 4, giving four boxes.', tip: 'Two splits each → 2 × 2 = four partial products.' },
          { h: 'Partial products', p: 'Multiply each pair: 20×10, 20×4, 3×10, 3×4. These four partial products add up to the final product.', example: '20×10=200, 20×4=80, 3×10=30, 3×4=12.' },
          { h: 'Example: 23 × 14', p: 'Add the four partial products: 200 + 80 + 30 + 12 = 322. So 23 × 14 = 322.', diagram: '<div class="sg-flow"><span class="sg-flow-in">23 × 14</span><span class="sg-flow-arrow">→</span><span class="sg-flow-box">200+80+30+12</span><span class="sg-flow-arrow">→</span><span class="sg-flow-out">= 322</span></div>' },
          { h: 'Standard algorithm', p: 'The algorithm compresses the area model: multiply 23 by the 4 (ones), then 23 by the 10 (tens, shifted left), then add. Same answer: 322.', tip: 'Tens row is shifted one place left — that is the “0” you imagine.' },
          { h: 'Estimate to check', p: 'Round 23 → 20 and 14 → 10, so 20 × 10 = 200. Your answer 322 is bigger because you rounded both down. Reasonable ✓.', example: 'If you got 322 or 32.2, the estimate catches the decimal error.' },
          { h: 'Why it matters', p: '2-digit × 2-digit is used for area, money, and scaling. The area model makes the algorithm make sense.', tip: 'Break both, multiply each pair, add — works every time.' }
        ] },
        { kind: 'drill', subject: 'Math', title: 'Area Model — Fill the Parts', engine: 'fillBlank', sentence: '23 × 14: split 23 into 20 and * , split 14 into 10 and * . Then 200 + 80 + 30 + 12 = the product *.', blanks: ['3', '4', '322'] },
        { kind: 'lesson', subject: 'Science', title: 'Vision and Light', blocks: [
          { h: 'Light travels in straight lines', p: 'Light moves in straight lines called rays. It cannot bend around corners, which is why shadows have sharp edges.', example: 'A flashlight beam is a bundle of straight rays.' },
          { h: 'How we see', p: 'We see when light enters our eyes. Objects that give off their own light (the Sun, a lamp) are light sources; most objects only reflect light to us.', tip: 'No light entering the eye = nothing seen (a dark room).' },
          { h: 'Reflection', p: 'Reflection is light bouncing off a surface. We see a book because light bounces off it and into our eyes — the book is not a light source.', example: 'A mirror reflects light smoothly so you see an image.' },
          { h: 'Parts of the eye', p: 'The eye has key parts: the pupil (hole that lets light in), the iris (colored ring that changes pupil size), the lens (focuses light), and the retina (back layer that senses light).', diagram: '<div class="sg-energy-forms"><span>⚫ Pupil</span><span>🎨 Iris</span><span>🔍 Lens</span><span>🩷 Retina</span></div>' },
          { h: 'Forming an image', p: 'Light enters through the pupil, the lens focuses it, and the retina senses it. Signals travel to the brain, which builds the image you see.', tip: 'Eye gathers → lens focuses → retina senses → brain sees.' },
          { h: 'Light source vs. reflected', p: 'The Sun and lamps make light; a chair, a tree, and the Moon only reflect it. Knowing the difference explains why some things glow and others don’t.', example: 'The Moon shines because it reflects sunlight, not because it makes light.' },
          { h: 'Why it matters', p: 'Vision and light drive cameras, glasses, safety lights, and art. Understanding how we see helps you protect your eyes and design devices.', tip: 'If you can see it, light is entering your eye — from a source or a reflection.' }
        ] },
        { kind: 'practice', subject: 'Science', title: 'Label the Eye', mode: 'labelDiagram', slots: [
          { hint: 'Black opening in the center' }, { hint: 'Colored ring around it' }, { hint: 'Focuses light onto the back' }, { hint: 'Back layer that senses light' }
        ], labels: [ { label: 'Pupil', slot: 0 }, { label: 'Iris', slot: 1 }, { label: 'Lens', slot: 2 }, { label: 'Retina', slot: 3 } ] },
        { kind: 'activity', title: 'See the Light', stages: [
          { type: 'quiz', subject: 'Science · Light', story: 'First, how does light travel?', prompt: 'Light travels in…', options: ['Straight lines', 'Curves', 'Circles'], a: 0, okMsg: 'Straight lines — sharp shadows. Switch 1 on!' },
          { type: 'match', subject: 'Science · Eye parts', story: 'Match each eye part to its job.', pairs: [ ['Pupil','Hole that lets light in'], ['Iris','Colored ring'], ['Lens','Focuses light'], ['Retina','Senses light'] ] },
          { type: 'input', subject: 'Math · Product', story: 'The lamp needs the product. 23 × 14 = ?', prompt: '23 × 14 = ?', accept: ['322'], okMsg: '322 — area model confirmed! Bulb in.' },
          { type: 'twoTruths', subject: 'Science · Light & eye', story: 'One statement is FALSE. Tap the lie to close the circuit.', statements: [ {t:'Light travels in straight lines', a:true}, {t:'We see objects because light bounces off them into our eyes', a:true}, {t:'The retina focuses light onto the lens', a:false} ] }
        ] }
      ]
    } },

    '2-1': { type: 'mission', content: {
      title: 'Chart the Coast',
      intro: 'Sail with the explorers and argue your case. Learn opinion writing and NY’s European explorers, then chart the coast.',
      winText: '🎉 Claim made and coast charted — anchor down!',
      phases: [
        { kind: 'lesson', subject: 'ELA', title: 'Opinion Writing: Claim + Reasons', blocks: [
          { h: 'What is opinion writing?', p: 'Opinion writing shares what you think about a topic and backs it up with reasons. It is persuasive — you want the reader to agree.', example: '“Soccer is the best sport for kids” is an opinion to defend.' },
          { h: 'Make a claim', p: 'A claim is your main opinion stated clearly in one sentence — the topic sentence of your argument. It tells the reader your position.', tip: 'Claim = “I think/believe ____ because.” Put it early.' },
          { h: 'Support with reasons', p: 'Give 2–3 reasons that explain why your claim is true. Each reason is a separate point that supports the claim.', example: 'Claim: soccer is best. Reason: it builds teamwork and fitness.' },
          { h: 'Add evidence', p: 'Back each reason with evidence — facts, examples, or details. Evidence makes reasons convincing instead of just opinions.', tip: 'Reasons explain why; evidence proves it.' },
          { h: 'Counterclaim', p: 'A strong writer acknowledges the other side (counterclaim) and explains why their own view still holds. This is fair and persuasive.', example: '“Some say basketball is best, but soccer is played worldwide.”' },
          { h: 'Strong conclusion', p: 'End by restating your claim in a new way and leaving the reader with a final thought. Don’t just repeat — wrap up.', tip: 'Conclusion = restate claim + final punch.' },
          { h: 'Why it matters', p: 'Opinion writing teaches you to argue with reasons and evidence — a skill for essays, debates, and life.', tip: 'Claim → reasons → evidence → counterclaim → conclusion.' }
        ] },
        { kind: 'drill', subject: 'ELA', title: 'Rebuild the Claim', engine: 'scramble', words: ['I', 'believe', 'soccer', 'is', 'the', 'best', 'sport'] },
        { kind: 'lesson', subject: 'Social Studies', title: 'European Explorers of NY', blocks: [
          { h: 'Why Europeans explored', p: 'In the 1500s–1600s, European nations sailed to North America seeking trade routes, riches, and furs. They claimed land for their kings.', example: 'Furs from North America were valuable in Europe.' },
          { h: 'Verrazano (1524)', p: 'Giovanni da Verrazano, sailing for France, was the first European to explore New York Harbor (1524). He met Native peoples along the coast.', tip: 'Verrazano = 1524, NY Harbor, for France.' },
          { h: 'Henry Hudson (1609)', p: 'Henry Hudson, sailing for the Dutch, explored the river later named for him in 1609. His trip helped the Dutch claim the region.', example: 'The Hudson River is named after Henry Hudson.' },
          { h: 'Champlain (1608)', p: 'Samuel de Champlain founded Quebec in 1608 and built New France to the north. He allied with some Native nations and traded furs.', diagram: '<div class="sg-energy-forms"><span>⛵ Verrazano 1524</span><span>🗺️ Hudson 1609</span><span>🏰 Champlain 1608</span><span>🦦 Fur trade</span><span>🤝 Native alliances</span></div>' },
          { h: 'Explorers & Native peoples', p: 'Explorers met Native peoples who already lived here. Some traded and allied; others brought conflict and disease that harmed Native communities.', tip: 'Native peoples were here first; explorers changed their world.' },
          { h: 'Effects on NY', p: 'These voyages led to European claims, the fur trade, and later colonies (New Netherland, New France). They reshaped NY’s history.', example: 'Hudson’s trip opened the door for the Dutch colony.' },
          { h: 'Why it matters', p: 'Exploration began the colonial era in NY. Knowing who came, when, and why explains the state’s later history.', tip: 'Verrazano, Hudson, Champlain — three explorers, three nations.' }
        ] },
        { kind: 'practice', subject: 'Social Studies', title: 'Explorer Timeline', mode: 'timeline', eras: ['1524', '1608', '1609'], events: [
          { text: 'Verrazano reaches NY harbor', era: 0 },
          { text: 'Champlain founds Quebec', era: 1 },
          { text: 'Hudson explores the Hudson River', era: 2 }
        ] },
        { kind: 'activity', title: 'Chart the Coast', stages: [
          { type: 'quiz', subject: 'SS · Explorers', story: 'A sailor asks: who explored the river named for him in 1609?', prompt: 'Who explored the Hudson River in 1609?', options: ['Hudson', 'Verrazano', 'Champlain'], a: 0, okMsg: 'Hudson — the river bears his name. Marker 1!' },
          { type: 'match', subject: 'SS + ELA · Terms', story: 'Match each explorer and term to its detail.', pairs: [ ['Verrazano','Reached NY harbor, 1524'], ['Hudson','Sailed the Hudson R., 1609'], ['Champlain','Founded Quebec'], ['Claim','Your opinion statement'] ] },
          { type: 'input', subject: 'SS · Explorer name', story: 'The last name of the 1609 explorer (also a river name).', prompt: 'Henry ___ explored NY waters in 1609 (last name):', accept: ['hudson'], okMsg: 'Hudson — charted! Marker 3!' },
          { type: 'dragSort', subject: 'ELA · Opinion order', story: 'Order the parts of an opinion paragraph.', items: [ {text:'State your claim', order:0}, {text:'Give a first reason', order:1}, {text:'Add evidence', order:2}, {text:'Restate the claim', order:3} ] }
        ] }
      ]
    } },

    '2-2': { type: 'mission', content: {
      title: 'Split the Load',
      intro: 'Divide fairly and link your ideas. Learn division with remainders and linking words, then split the load.',
      winText: '🎉 Loads divided and paragraphs linked — camp set!',
      phases: [
        { kind: 'lesson', subject: 'Math', title: 'Division with Remainders', blocks: [
          { h: 'Division = sharing', p: 'Division splits a number into equal groups. 45 ÷ 6 asks: how many groups of 6 fit in 45, and what is left over?', example: '45 split into groups of 6 → 7 groups, 3 left over.' },
          { h: 'Quotient & remainder', p: 'The quotient is the whole-number result. The remainder is what is left over when it does not divide evenly. 45 ÷ 6 = 7 r 3.', tip: 'quotient r remainder — the “r” means remainder.' },
          { h: 'How to divide', p: 'Estimate, then multiply to check: 6 × 7 = 42, and 45 − 42 = 3, so 45 ÷ 6 = 7 r 3.', example: 'Pick the biggest multiple of 6 under 45: 42. Subtract: 45 − 42 = 3.' },
          { h: 'The remainder is left over', p: 'The remainder is always less than the divisor. If it’s not, your quotient is too small — bump it up.', tip: 'remainder < divisor, always.' },
          { h: 'Check your answer', p: 'Check with: quotient × divisor + remainder = dividend. 7 × 6 + 3 = 42 + 3 = 45 ✓.', example: 'If the check doesn’t equal the dividend, re-do it.' },
          { h: 'Word problems', p: 'In word problems, the remainder can mean “left over,” “make one more,” or “drop it.” Read the situation to decide.', tip: '“How many full groups” → drop remainder. “How many needed” → round up.' },
          { h: 'Why it matters', p: 'Division with remainders appears in sharing, measurement, and schedules. Checking with multiply + add catches mistakes.', tip: 'quotient × divisor + remainder = dividend. Always check.' }
        ] },
        { kind: 'drill', subject: 'Math', title: 'Division Drill', questions: [
          { prompt: '45 ÷ 6 = ? r ?', options: ['7 r 3', '8 r 0', '7 r 5'], a: 0, okMsg: '7 r 3 — 6×7=42, 45−42=3.' },
          { prompt: '50 ÷ 7 = ? r ?', options: ['7 r 1', '7 r 2', '8 r 1'], a: 0, okMsg: '7 r 1 — 7×7=49, 50−49=1.' },
          { prompt: 'The remainder must be…', options: ['Less than the divisor', 'Bigger than the divisor', 'Zero always'], a: 0, okMsg: 'Less than the divisor.' },
          { prompt: 'Check 7 r 3 for 45 ÷ 6:', options: ['7×6 + 3 = 45', '7+6+3 = 16', '7×3 + 6 = 27'], a: 0, okMsg: '7×6 + 3 = 45 ✓.' },
          { prompt: '38 ÷ 5 = ? r ?', options: ['7 r 3', '8 r 2', '7 r 2'], a: 0, okMsg: '7 r 3 — 5×7=35, 38−35=3.' },
          { prompt: '“How many full boxes” means…', options: ['Drop the remainder', 'Round up', 'Ignore the quotient'], a: 0, okMsg: 'Drop the remainder — full boxes only.' }
        ] },
        { kind: 'lesson', subject: 'ELA', title: 'Linking Words in Writing', blocks: [
          { h: 'What are linking words?', p: 'Linking words connect ideas so writing flows. They show how sentences and reasons relate — order, addition, cause, or contrast.', example: '“First we packed. Next we hiked.” Linking words show order.' },
          { h: 'Sequence words', p: 'Sequence words show order: first, next, then, after, finally. Use them for steps, timelines, and how-tos.', tip: 'first → next → then → finally = clear order.' },
          { h: 'Addition words', p: 'Addition words add more support: also, in addition, furthermore, another. Use them to stack reasons.', example: '“Also, soccer builds fitness.”' },
          { h: 'Cause/effect words', p: 'Cause/effect words show why: because, so, since, therefore, as a result. They link a cause to its effect.', tip: '“because” gives the cause; “so” gives the effect.' },
          { h: 'Contrast words', p: 'Contrast words show a turn: however, but, although, on the other hand. Use them for counterclaims.', example: '“Some prefer basketball; however, soccer is worldwide.”' },
          { h: 'Choose the right link', p: 'Match the linking word to the job: order, add, cause, or contrast. The wrong link confuses the reader.', tip: 'Ask: am I ordering, adding, causing, or turning?' },
          { h: 'Why it matters', p: 'Linking words turn choppy sentences into smooth, clear writing. They are the glue of strong paragraphs.', tip: 'Pick the link that matches the relationship.' }
        ] },
        { kind: 'practice', subject: 'ELA', title: 'Order the Trip (Drag in Sequence)', mode: 'dragSort', items: [
          { text: 'First, we packed supplies', order: 0 }, { text: 'Next, we hiked the trail', order: 1 },
          { text: 'Then, we set up camp', order: 2 }, { text: 'Finally, we watched the stars', order: 3 }
        ] },
        { kind: 'activity', title: 'Split the Load', stages: [
          { type: 'twoTruths', subject: 'Math · Division', story: 'One statement is FALSE. Tap the lie to start the load.', statements: [ {t:'The remainder is what is left over', a:true}, {t:'45 ÷ 6 = 7 r 3', a:true}, {t:'To check: quotient + divisor = dividend', a:false} ] },
          { type: 'match', subject: 'Math · Terms', story: 'Match each division term to its meaning.', pairs: [ ['Quotient','The result of dividing'], ['Remainder','What is left over'], ['Divisor','Number you divide by'], ['Dividend','Number being divided'] ] },
          { type: 'input', subject: 'Math · Remainder', story: 'What is the remainder of 45 ÷ 6?', prompt: '45 ÷ 6 = 7 r ?  (type the remainder):', accept: ['3'], okMsg: '3 — left over! Load 3 split.' },
          { type: 'fillBlank', subject: 'ELA · Linking words', story: 'Fill the linking words to finish the trip plan.', sentence: 'First we packed. * we hiked. Then we camped. * we watched stars.', blanks: ['Next', 'Finally'] }
        ] }
      ]
    } },

    '2-3': { type: 'mission', content: {
      title: 'Colony Swap',
      intro: 'Watch light bounce and a colony change hands. Learn reflection and the New Netherland → New York story, then swap the flag.',
      winText: '🎉 Reflection traced and colony renamed — flag swapped!',
      phases: [
        { kind: 'lesson', subject: 'Science', title: 'Light Reflection & the Eye', blocks: [
          { h: 'Reflection = light bounces', p: 'Reflection is light bouncing off a surface. The incoming ray hits the surface and bounces back as the reflected ray.', example: 'A flashlight on a mirror bounces a beam across the room.' },
          { h: 'Smooth vs. rough surfaces', p: 'Smooth, shiny surfaces (mirrors) reflect light in one direction — a clear image. Rough surfaces scatter light in many directions — no clear image.', tip: 'Smooth → clear reflection. Rough → scattered, dull.' },
          { h: 'Mirrors', p: 'A mirror reflects light smoothly so you see an image of yourself. The image appears “behind” the mirror but is really light bouncing back to your eyes.', example: 'A bathroom mirror shows a clear reflection.' },
          { h: 'How the eye uses reflected light', p: 'Most objects don’t make light — we see them because they reflect light into our eyes. The eye then focuses that light to form an image.', diagram: '<div class="sg-flow"><span class="sg-flow-in">💡 Light</span><span class="sg-flow-arrow">→</span><span class="sg-flow-box">🪞 Surface</span><span class="sg-flow-arrow">→</span><span class="sg-flow-out">👁️ Eye</span></div>' },
          { h: 'Seeing non-light sources', p: 'A chair, a tree, the Moon — we see them only by reflected light. Without a light source shining on them (or making light), they’d be invisible.', tip: 'If it doesn’t glow, you see it by reflection.' },
          { h: 'Colors we see', p: 'A red apple reflects red light and absorbs the other colors. The color you see is the color an object reflects most.', example: 'A leaf reflects green; a blue shirt reflects blue.' },
          { h: 'Why it matters', p: 'Reflection explains mirrors, how we see, and how cameras and glasses work. It is the basis of safe lighting and vision tools.', tip: 'To see a non-glowing object, light must reflect from it to your eye.' }
        ] },
        { kind: 'drill', subject: 'Science', title: 'Spot the Lie (Reflection)', engine: 'twoTruths', statements: [
          { t: 'A mirror reflects light smoothly', a: true }, { t: 'We see a chair because it gives off its own light', a: false }, { t: 'Rough surfaces scatter light in many directions', a: true }
        ] },
        { kind: 'lesson', subject: 'Social Studies', title: 'New Netherland → New York', blocks: [
          { h: 'The Dutch found New Netherland', p: 'In the early 1600s, the Dutch founded the colony of New Netherland in the Hudson River region, led by the Dutch West India Company.', example: 'The Dutch wanted furs and trade, not large settlements at first.' },
          { h: 'New Amsterdam', p: 'New Amsterdam, at the tip of Manhattan, was the colony’s capital and main port. It later became New York City.', tip: 'New Amsterdam = Dutch capital = today’s lower Manhattan.' },
          { h: 'Fur trade', p: 'The colony’s economy centered on the fur trade. Dutch traders exchanged goods with Native peoples for beaver pelts, valuable in Europe.', example: 'Beaver fur hats were fashionable in Europe.' },
          { h: 'A diverse colony', p: 'New Netherland welcomed people from many nations and backgrounds, including enslaved Africans and European settlers. Diversity shaped the colony.', diagram: '<div class="sg-energy-forms"><span>🇳🇱 Dutch</span><span>🦦 Fur trade</span><span>🏙️ New Amsterdam</span><span>🌍 Diversity</span><span>🪙 Trade goods</span><span>🏴 English 1664</span></div>' },
          { h: '1664: English take over', p: 'In 1664, the English took New Netherland without a fight and renamed it New York (after the Duke of York). New Amsterdam became New York City.', tip: '1664 → New Netherland becomes New York.' },
          { h: 'Dutch influences remain', p: 'Even after the English took over, Dutch people, place names (Harlem, Brooklyn), and customs stayed. NY kept its mixed character.', example: '“Brooklyn” and “Harlem” come from Dutch names.' },
          { h: 'Why it matters', p: 'The Dutch-to-English swap shaped NY’s culture, names, and trade. The colony’s diversity set the pattern for NY’s identity.', tip: 'Dutch founded it (1620s), English renamed it (1664), diversity stayed.' }
        ] },
        { kind: 'practice', subject: 'Social Studies', title: 'Dutch or English? (Venn)', mode: 'venn', left: 'Dutch', right: 'English', items: [
          { text: 'Founded New Netherland', set: 0 }, { text: 'Renamed it New York in 1664', set: 1 },
          { text: 'Wanted fur trade & land', set: 2 }, { text: 'Lived in NY first (Native peoples)', set: 3 }
        ] },
        { kind: 'activity', title: 'Colony Swap', stages: [
          { type: 'quiz', subject: 'SS · 1664', story: 'Who took over New Netherland in 1664 and renamed it New York?', prompt: 'Who took over in 1664?', options: ['The English', 'The French', 'The Spanish'], a: 0, okMsg: 'The English — New York is born! Flag 1 raised.' },
          { type: 'match', subject: 'SS + Sci · Terms', story: 'Match each term to its meaning.', pairs: [ ['New Amsterdam','Dutch capital (later NYC)'], ['1664','English took over'], ['Reflection','Light bouncing off a surface'], ['Mirror','Smooth, shiny reflector'] ] },
          { type: 'input', subject: 'SS · Capital name', story: 'The Dutch capital was New ___ (one word).', prompt: 'The Dutch capital was New ___ (one word):', accept: ['amsterdam'], okMsg: 'Amsterdam — New Amsterdam! Flag 3 raised.' },
          { type: 'labelDiagram', subject: 'Science · Reflection path', story: 'Label the reflection path to swap the flag.', slots: [ {hint:'Comes from the light source'}, {hint:'Bounces off the surface'}, {hint:'Smooth, shiny surface'}, {hint:'Enters your eye so you see'} ], labels: [ {label:'Light ray', slot:0}, {label:'Reflection', slot:1}, {label:'Mirror', slot:2}, {label:'Image', slot:3} ] }
        ] }
      ]
    } },

    '3-0': { type: 'mission', content: {
      title: 'Equal & Survive',
      intro: 'Slice fractions equally and meet animal super-powers. Learn equivalent fractions and animal structures, then keep the species alive.',
      winText: '🎉 Fractions matched and structures sorted — species saved!',
      phases: [
        { kind: 'lesson', subject: 'Math', title: 'Equivalent Fractions', blocks: [
          { h: 'What is a fraction?', p: 'A fraction names part of a whole. The top number is the numerator (how many parts you have); the bottom is the denominator (how many equal parts the whole is split into).', example: '1/2 = one part out of two equal parts.' },
          { h: 'Equivalent = same amount', p: 'Equivalent fractions name the same amount with different numbers. 1/2 and 2/4 cover the same sized piece of a whole — they are equal.', tip: 'Same amount, different numbers → equivalent.' },
          { h: 'Multiply top & bottom', p: 'Multiply (or divide) the numerator AND denominator by the same number to make an equivalent fraction. 1/2 × 2/2 = 2/4.', example: '×2 on top and bottom: 1/2 → 2/4 → 3/6.' },
          { h: 'Simplify by dividing', p: 'Divide top and bottom by the same number to simplify. 4/8 ÷ 4/4 = 1/2. Simplified fractions use the smallest numbers.', tip: 'Find a number that divides both evenly.' },
          { h: 'See it on a number line', p: 'Equivalent fractions land on the same dot on a number line. 1/2, 2/4, and 3/6 all sit at the same spot between 0 and 1.', diagram: '<div class="sg-flow"><span class="sg-flow-in">1/2</span><span class="sg-flow-arrow">=</span><span class="sg-flow-box">2/4</span><span class="sg-flow-arrow">=</span><span class="sg-flow-out">3/6</span></div>' },
          { h: 'Example: 1/2 = ?/4', p: 'Multiply top and bottom by 2: 1×2 = 2, 2×2 = 4, so 1/2 = 2/4. Same spot on the line.', example: 'To get denominator 4 from 2, multiply by 2.' },
          { h: 'Why it matters', p: 'Equivalent fractions let you compare, add, and simplify. They are the key to all fraction work.', tip: 'Multiply or divide both numbers by the same thing.' }
        ] },
        { kind: 'drill', subject: 'Math', title: 'Tap the Dot (Number Line)', engine: 'numberLine', questions: [
          { prompt: 'Tap the dot for 1/4', marks: [ {l:'0'},{l:'1/4'},{l:'1/2'},{l:'3/4'},{l:'1'} ], a: 1 },
          { prompt: 'Tap the dot for 1/2', marks: [ {l:'0'},{l:'1/4'},{l:'1/2'},{l:'3/4'},{l:'1'} ], a: 2 },
          { prompt: '2/4 is equivalent to 1/2 — tap it', marks: [ {l:'0'},{l:'1/4'},{l:'1/2'},{l:'3/4'},{l:'1'} ], a: 2 },
          { prompt: 'Tap the dot for 3/4', marks: [ {l:'0'},{l:'1/4'},{l:'1/2'},{l:'3/4'},{l:'1'} ], a: 3 },
          { prompt: 'Tap the whole (1)', marks: [ {l:'0'},{l:'1/4'},{l:'1/2'},{l:'3/4'},{l:'1'} ], a: 4 }
        ] },
        { kind: 'lesson', subject: 'Science', title: 'Animal Structures & Survival', blocks: [
          { h: 'Structures help animals survive', p: 'A structure is a body part with a job. Animals’ structures help them find food, stay safe, move, and survive in their environment.', example: 'A bird’s beak is a structure shaped for what it eats.' },
          { h: 'Internal vs external', p: 'External structures are on the outside (shell, fur, wings). Internal structures are inside (bones, heart, stomach). Both help survival.', tip: 'External = outside; internal = inside.' },
          { h: 'Sense structures', p: 'Eyes, ears, nose, tongue, and skin are sense structures. They gather information about the world so animals can respond.', example: 'A deer’s large ears hear predators far away.' },
          { h: 'Defense structures', p: 'Some structures protect animals: shells (turtles), quills (porcupines), camouflage (chameleons), and poison (some frogs).', diagram: '<div class="sg-energy-forms"><span>🐢 Shell</span><span>🦔 Quills</span><span>🦎 Camouflage</span><span>🦷 Teeth</span><span>🏃 Speed</span></div>' },
          { h: 'Movement structures', p: 'Wings, fins, legs, and tails are movement structures. Their shape fits how the animal moves and where it lives.', example: 'Fish fins swim; bird wings fly; cheetah legs run.' },
          { h: 'Structures fit the environment', p: 'A structure works best in the environment it evolved in. Webbed feet help in water; long legs help on grasslands.', tip: 'Match the structure to where the animal lives.' },
          { h: 'Why it matters', p: 'Studying structures explains how animals survive and inspires human designs (swim fins, camouflage, planes).', tip: 'Every part has a job that helps survival.' }
        ] },
        { kind: 'practice', subject: 'Science', title: 'Sort the Structures (Categorize)', mode: 'categorize', bins: ['Sense', 'Defense', 'Move'], items: [
          { text: 'Eyes', bin: 0 }, { text: 'Shell', bin: 1 }, { text: 'Wings', bin: 2 }, { text: 'Ears', bin: 0 }, { text: 'Quills', bin: 1 }, { text: 'Fins', bin: 2 }
        ] },
        { kind: 'activity', title: 'Equal & Survive', stages: [
          { type: 'quiz', subject: 'Math · Equivalence', story: 'First, find the missing number. 1/2 = ?/4', prompt: '1/2 = ?/4', options: ['2', '1', '3'], a: 0, okMsg: '1/2 = 2/4 — equivalent! Gene 1 on.' },
          { type: 'match', subject: 'Science · Structures', story: 'Match each structure to its job.', pairs: [ ['Eyes','See'], ['Shell','Protect'], ['Wings','Fly'], ['Camouflage','Hide'] ] },
          { type: 'input', subject: 'Math · Simplify', story: 'Simplify 4/8 to lowest terms (numerator).', prompt: '4/8 = ?/2  (type the numerator):', accept: ['1'], okMsg: '1/2 — simplified! Gene 3 on.' },
          { type: 'fillBlank', subject: 'Math · Rule', story: 'Finish the equivalence rule to seal the genome.', sentence: 'To make an equivalent fraction, multiply top and bottom by the * number. 1/2 × 2/2 = * /4.', blanks: ['same', '2'] }
        ] }
      ]
    } },

    '3-1': { type: 'mission', content: {
      title: 'Report from the Colony',
      intro: 'Write it clearly and live it back then. Learn informative writing and colonial life in NY, then file your report.',
      winText: '🎉 Report filed and colonial timeline built — dispatch sent!',
      phases: [
        { kind: 'lesson', subject: 'ELA', title: 'Informative/Explanatory Writing', blocks: [
          { h: 'What is informative writing?', p: 'Informative writing explains a topic with facts, definitions, and details — not opinions. It teaches the reader something true.', example: '“Colonial children helped on the farm” is a fact, not an opinion.' },
          { h: 'Introduce the topic', p: 'Start with a clear topic sentence that tells what the writing explains. The reader should know the subject right away.', tip: 'Topic sentence = “This is about ____.”' },
          { h: 'Facts, definitions, details', p: 'Support the topic with facts, definitions, and concrete details. Each sentence adds true information.', example: 'Define terms and give real examples.' },
          { h: 'Group related info', p: 'Put related information together in paragraphs. Each paragraph covers one part of the topic.', tip: 'One paragraph = one sub-topic.' },
          { h: 'Linking words + precise vocabulary', p: 'Use linking words (also, for example, however) and precise domain vocabulary so the writing flows and sounds expert.', example: '“For example, colonists grew corn.”' },
          { h: 'Concluding statement', p: 'End with a conclusion that wraps up the topic — a final true sentence, not a new opinion.', tip: 'Conclusion = restate the topic in a closing way.' },
          { h: 'Why it matters', p: 'Informative writing teaches you to explain clearly with evidence — used in reports, articles, and science.', tip: 'Topic → facts → groups → links → conclusion.' }
        ] },
        { kind: 'drill', subject: 'ELA', title: 'Rebuild the Topic Sentence', engine: 'scramble', words: ['Colonial', 'life', 'in', 'New', 'York', 'was', 'hard', 'work'] },
        { kind: 'lesson', subject: 'Social Studies', title: 'Colonial Life in NY', blocks: [
          { h: 'Who lived in colonial NY', p: 'Colonial NY was home to Dutch and English colonists, other European settlers, enslaved and free Africans, and Native peoples — a diverse colony.', example: 'People from many nations lived side by side.' },
          { h: 'Farming & work', p: 'Most colonists farmed — growing wheat, corn, and vegetables. Others were tradespeople: blacksmiths, coopers, weavers, and carpenters.', tip: 'Farms + trades filled the colony’s days.' },
          { h: 'Homes & daily life', p: 'Colonial homes were simple, often one room with a fireplace for cooking and heat. Whole families worked together on chores.', example: 'Children fetched water and helped in fields.' },
          { h: 'Schools & church', p: 'Some children went to school or were taught at home; many learned a trade instead. The church was a center of community life.', diagram: '<div class="sg-energy-forms"><span>🌾 Farming</span><span>🔨 Trades</span><span>🏫 School</span><span>⛪ Church</span><span>🛒 Markets</span></div>' },
          { h: 'Trade & cities', p: 'New York City and Albany were busy trade ports. Goods moved by river and road — furs, grain, and imported tools and cloth.', example: 'The Hudson River carried trade to Albany.' },
          { h: 'Enslaved & indentured workers', p: 'Enslaved Africans and indentured servants did much hard labor. Their work built much of the colony’s wealth, though their freedom was denied.', tip: 'Not all colonists were free; many were forced to work.' },
          { h: 'Why it matters', p: 'Colonial life shaped NY’s economy, diversity, and the tensions that led to the Revolution. It set the stage for the state’s future.', tip: 'Diverse people, hard work, growing trade — colonial NY.' }
        ] },
        { kind: 'practice', subject: 'Social Studies', title: 'Colonial Timeline', mode: 'timeline', eras: ['Early 1600s', '1664', '1700s'], events: [
          { text: 'Dutch settle New Netherland', era: 0 }, { text: 'English rename it New York', era: 1 }, { text: 'Colonial farms & trade grow', era: 2 }
        ] },
        { kind: 'activity', title: 'Report from the Colony', stages: [
          { type: 'twoTruths', subject: 'ELA · Informative writing', story: 'One statement is FALSE. Tap the lie to open the report.', statements: [ {t:'Informative writing uses facts and details', a:true}, {t:'Informative writing shares your opinion as the main point', a:false}, {t:'A clear topic sentence introduces the topic', a:true} ] },
          { type: 'match', subject: 'ELA · Terms', story: 'Match each writing term to its meaning.', pairs: [ ['Topic sentence','Introduces the topic'], ['Detail','A fact that supports'], ['Conclusion','Wraps it up'], ['Definition','Explains a term'] ] },
          { type: 'input', subject: 'SS · 1664', story: 'Colonial NY was renamed by the ___ in 1664.', prompt: 'Colonial NY was renamed by the ___ in 1664:', accept: ['english'], okMsg: 'English — New York! Section 3 filed.' },
          { type: 'dragSort', subject: 'ELA · Paragraph order', story: 'Order the parts of an informative paragraph.', items: [ {text:'Introduce the topic', order:0}, {text:'Give facts and details', order:1}, {text:'Group related info', order:2}, {text:'Conclude', order:3} ] }
        ] }
      ]
    } },

    '3-2': { type: 'mission', content: {
      title: 'Roots & Ranks',
      intro: 'Rank the fractions and crack the word roots. Learn comparing fractions and Greek & Latin roots, then rank the cards.',
      winText: '🎉 Fractions ranked and roots cracked — hand won!',
      phases: [
        { kind: 'lesson', subject: 'Math', title: 'Comparing Fractions', blocks: [
          { h: 'Compare same denominator', p: 'When denominators are the same, the fraction with the bigger numerator is bigger. 3/5 > 2/5 because 3 > 2.', example: 'Same-sized slices → more slices = bigger.' },
          { h: 'Compare same numerator', p: 'When numerators are the same, the fraction with the bigger denominator is SMALLER. 1/4 < 1/2 because fourths are smaller pieces.', tip: 'Same number of slices → smaller slices (bigger denom) = smaller fraction.' },
          { h: 'Benchmark to 1/2', p: 'Compare to 1/2 as a benchmark. 3/8 is less than 1/2 (3 < 4); 5/8 is more than 1/2 (5 > 4).', example: 'Is the numerator more or less than half the denominator?' },
          { h: 'Common denominator', p: 'For different denominators, rewrite both with a common denominator, then compare numerators. 1/2 vs 1/3 → 3/6 vs 2/6 → 1/2 is bigger.', diagram: '<div class="sg-flow"><span class="sg-flow-in">1/2 vs 1/3</span><span class="sg-flow-arrow">→</span><span class="sg-flow-box">3/6 vs 2/6</span><span class="sg-flow-arrow">→</span><span class="sg-flow-out">1/2 bigger</span></div>' },
          { h: 'Use a number line', p: 'Place fractions on a number line — the one farther right is bigger. This works for any fractions once placed.', tip: 'Right on the line = bigger.' },
          { h: 'Use <, >, =', p: 'Write comparisons with < (less than), > (greater than), or = (equal). 2/3 > 1/3; 1/4 < 1/2; 2/4 = 1/2.', example: 'The open side points to the bigger number.' },
          { h: 'Why it matters', p: 'Comparing fractions is used in cooking, measuring, and data. Common denominators and benchmarks make it reliable.', tip: 'Same denom → numerator. Same numer → denom flips. Else common denom.' }
        ] },
        { kind: 'drill', subject: 'Math', title: 'Higher or Lower? (Fraction Cards)', engine: 'higherLower', prompt: 'Will the next fraction be higher or lower?', cards: [
          { label: '1/4', val: 0.25 }, { label: '1/2', val: 0.5 }, { label: '3/4', val: 0.75 }, { label: '1/3', val: 0.333 }, { label: '2/3', val: 0.667 }
        ] },
        { kind: 'lesson', subject: 'ELA', title: 'Greek & Latin Roots and Affixes', blocks: [
          { h: 'What are roots & affixes?', p: 'Many English words are built from roots (the core meaning) plus affixes (prefixes before, suffixes after). Knowing them unlocks word meanings.', example: 're + view = view again.' },
          { h: 'Prefixes', p: 'Prefixes go before a root and change meaning: re- (again), un- (not), pre- (before), dis- (not).', tip: 're- = again; un- = not.' },
          { h: 'Suffixes', p: 'Suffixes go after a root and often change the word’s job: -ful (full of), -less (without), -ly (in that way), -er (one who).', example: 'hope + -ful = hopeful (full of hope).' },
          { h: 'Latin roots', p: 'Latin roots carry core meanings: port (carry), dict (speak), vis (see), tract (pull).', diagram: '<div class="sg-energy-forms"><span>port = carry</span><span>dict = speak</span><span>vis = see</span><span>tract = pull</span></div>' },
          { h: 'Greek roots', p: 'Greek roots appear in science words: photo (light), tele (far), graph (write), hydro (water).', example: 'tele + phone = sound from far.' },
          { h: 'Decode with roots', p: 'Break a word into parts to guess its meaning: “transport” = trans + port = carry across. Check with context.', tip: 'Split → read each part → combine meanings.' },
          { h: 'Why it matters', p: 'Roots and affixes let you decode thousands of words and spell them — a huge boost for reading and vocab.', tip: 'Prefix + root + suffix = most English words.' }
        ] },
        { kind: 'practice', subject: 'ELA', title: 'Match the Roots', mode: 'match', pairs: [ ['port','carry'], ['dict','speak'], ['vis','see'], ['photo','light'], ['tele','far'], ['graph','write'] ] },
        { kind: 'activity', title: 'Roots & Ranks', stages: [
          { type: 'numberLine', subject: 'Math · Compare', story: 'Tap the BIGGER fraction: 3/4 (vs 1/4).', prompt: 'Tap the bigger fraction, 3/4:', marks: [ {l:'0'},{l:'1/4'},{l:'1/2'},{l:'3/4'},{l:'1'} ], a: 3 },
          { type: 'categorize', subject: 'ELA · Affixes', story: 'Sort each part as Prefix, Suffix, or Root.', bins: ['Prefix', 'Suffix', 'Root'], items: [ {text:'re-', bin:0}, {text:'-ful', bin:1}, {text:'port', bin:2}, {text:'un-', bin:0}, {text:'-less', bin:1}, {text:'vis', bin:2} ] },
          { type: 'input', subject: 'ELA · Build a word', story: 'un- + happy = ?', prompt: 'un- + happy = ?', accept: ['unhappy'], okMsg: 'unhappy — “not happy”! Card 3 flipped.' },
          { type: 'dragSort', subject: 'Math · Compare steps', story: 'Order the steps to compare fractions.', items: [ {text:'Check the denominators', order:0}, {text:'If same, compare numerators', order:1}, {text:'If different, find a common denominator', order:2}, {text:'Compare and pick < > =', order:3} ] }
        ] }
      ]
    } },

    '3-3': { type: 'mission', content: {
      title: 'Sense the Revolution',
      intro: 'Feel the world and pick your side. Learn senses & processing and the American Revolution in NY, then signal the rebels.',
      winText: '🎉 Senses mapped and sides sorted — signal sent!',
      phases: [
        { kind: 'lesson', subject: 'Science', title: 'Senses & Processing Information', blocks: [
          { h: 'Senses gather information', p: 'Sense organs gather information about the world — light, sound, smell, taste, and touch. This information helps animals (and us) survive.', example: 'Your eyes gather light; your ears gather sound.' },
          { h: 'The five senses + organs', p: 'Sight (eyes), hearing (ears), smell (nose), taste (tongue), touch (skin). Each organ handles one kind of information.', tip: 'Eyes-ears-nose-tongue-skin = the five.' },
          { h: 'Signals to the brain', p: 'Sense organs turn information into signals that travel to the brain. The brain is what actually processes the information.', example: 'Ears make signals; the brain makes sense of them.' },
          { h: 'Brain processes & responds', p: 'The brain processes the signals, decides what they mean, and sends a response — move, duck, eat, run. Processing leads to action.', diagram: '<div class="sg-flow"><span class="sg-flow-in">👁️ Sense</span><span class="sg-flow-arrow">→</span><span class="sg-flow-box">🧠 Brain</span><span class="sg-flow-arrow">→</span><span class="sg-flow-out">⚡ Response</span></div>' },
          { h: 'Different animals, different senses', p: 'Animals have different senses tuned to their needs: eagles see far, dogs smell keenly, bats use sound (echolocation).', tip: 'Senses fit how an animal lives.' },
          { h: 'Protecting your senses', p: 'Senses can be damaged — loud noise hurts hearing, bright light hurts eyes. Protect them so they keep working.', example: 'Wear sunglasses and ear protection.' },
          { h: 'Why it matters', p: 'Sensing and processing let animals react and survive. The same loop drives robots and computers (sensors → processor → action).', tip: 'Sense → brain → response = how animals act.' }
        ] },
        { kind: 'drill', subject: 'Science', title: 'Spot the Lie (Senses)', engine: 'twoTruths', statements: [
          { t: 'The brain processes signals from the senses', a: true }, { t: 'Eyes gather light information', a: true }, { t: 'Skin only senses heat, not touch', a: false }
        ] },
        { kind: 'lesson', subject: 'Social Studies', title: 'American Revolution in NY', blocks: [
          { h: 'Causes of the Revolution', p: 'Colonists rebelled because Britain taxed them (“no taxation without representation”) and ruled without their consent. Tensions grew into war.', example: 'Stamp Act and tea taxes angered colonists.' },
          { h: 'Patriots vs Loyalists', p: 'Patriots wanted independence from Britain. Loyalists wanted to stay loyal to the king. NY had many of both — a divided colony.', tip: 'Patriot = independence; Loyalist = stay with Britain.' },
          { h: 'NY was divided', p: 'NY was split: Patriots, Loyalists, and many who were unsure. Neighbors sometimes fought neighbors during the war.', example: 'Families in NY were torn apart by loyalties.' },
          { h: 'Key NY events', p: 'The Battle of Brooklyn (1776) was a British victory. The Battle of Saratoga (1777) was a huge Patriot win and a turning point.', diagram: '<div class="sg-energy-forms"><span>1776 Brooklyn</span><span>1777 Saratoga</span><span>🗽 Turning point</span><span>⚔️ Patriots</span><span>👑 Loyalists</span></div>' },
          { h: 'Saratoga = turning point', p: 'The Patriot victory at Saratoga convinced France to join the war on the American side, which helped win independence.', tip: 'Saratoga → French help → independence.' },
          { h: 'NY’s role', p: 'NY was a major battleground and British base (occupied NYC). Its location and battles made it central to the war.', example: 'Britain held New York City for much of the war.' },
          { h: 'Why it matters', p: 'The Revolution made NY (and the US) independent. The Patriot/Loyalist divide shaped NY politics for years after.', tip: 'Taxes → war → Saratoga → independence.' }
        ] },
        { kind: 'practice', subject: 'Social Studies', title: 'Flip the Facts (Revolution)', mode: 'flip', cards: [
          { front: 'Patriot', back: 'Wanted independence' }, { front: 'Loyalist', back: 'Stayed loyal to Britain' },
          { front: 'Saratoga', back: 'Turning-point victory, 1777' }, { front: 'Brooklyn', back: 'British win, 1776' }, { front: 'Taxation', back: 'A cause of the war' }
        ] },
        { kind: 'activity', title: 'Sense the Revolution', stages: [
          { type: 'quiz', subject: 'SS · Turning point', story: 'Which battle was the turning point of the Revolution?', prompt: 'Which battle was the turning point?', options: ['Saratoga', 'Brooklyn', 'Yorktown'], a: 0, okMsg: 'Saratoga — turning point! Signal 1 lit.' },
          { type: 'labelDiagram', subject: 'Science · Senses path', story: 'Label the sense-and-process path.', slots: [ {hint:'Organ that sees'}, {hint:'Organ that hears'}, {hint:'Organ that smells'}, {hint:'Processes the signals'} ], labels: [ {label:'Eye', slot:0}, {label:'Ear', slot:1}, {label:'Nose', slot:2}, {label:'Brain', slot:3} ] },
          { type: 'input', subject: 'SS · Sides', story: 'Who wanted independence from Britain?', prompt: 'Who wanted independence? (P___):', accept: ['patriots', 'patriot'], okMsg: 'Patriots! Signal 3 lit.' },
          { type: 'venn', subject: 'SS · Sides in NY', story: 'Sort each trait into Patriot, Loyalist, both, or neither.', left: 'Patriot', right: 'Loyalist', items: [ {text:'Wanted independence from Britain', set:0}, {text:'Stayed loyal to the king', set:1}, {text:'Lived in NY colony', set:2}, {text:'Ruled NY from overseas', set:3} ] }
        ] }
      ]
    } },

    '4-0': { type: 'mission', content: {
      title: 'Layers & Slices',
      intro: 'Add the slices and dig the past. Learn adding/subtracting fractions and rock layers & fossils, then stack the strata.',
      winText: '🎉 Fractions sliced and layers stacked — fossil found!',
      phases: [
        { kind: 'lesson', subject: 'Math', title: 'Add & Subtract Fractions (Like Denominators)', blocks: [
          { h: 'Add the numerators', p: 'When fractions have the same denominator, add the numerators and keep the denominator. 1/4 + 2/4 = 3/4.', example: 'Same-size slices → just count the slices.' },
          { h: 'Same denominator = same pieces', p: '“Like denominators” means the pieces are the same size, so you can combine them directly — only the count (numerator) changes.', tip: 'Denominator stays the same.' },
          { h: 'Add example', p: '1/4 + 2/4: keep the 4, add 1 + 2 = 3, so 1/4 + 2/4 = 3/4. Three of the same-size pieces.', diagram: '<div class="sg-flow"><span class="sg-flow-in">1/4 + 2/4</span><span class="sg-flow-arrow">→</span><span class="sg-flow-box">(1+2)/4</span><span class="sg-flow-arrow">→</span><span class="sg-flow-out">= 3/4</span></div>' },
          { h: 'Subtract example', p: '3/5 − 1/5: keep the 5, subtract 3 − 1 = 2, so 3/5 − 1/5 = 2/5. Taking away same-size pieces.', example: '3/5 − 1/5 = 2/5.' },
          { h: 'Simplify if needed', p: 'If the answer can be simplified, do it. 2/4 = 1/2. Always check for a common factor of top and bottom.', tip: 'After adding, simplify when you can.' },
          { h: 'Whole = denominator over itself', p: 'When numerator equals denominator, it’s one whole: 4/4 = 1, 5/5 = 1. So 1/4 + 3/4 = 4/4 = 1.', example: 'All the pieces together = 1 whole.' },
          { h: 'Why it matters', p: 'Adding/subtracting like fractions is used in cooking, measuring, and sharing. It’s the base for unlike-denominator work.', tip: 'Like denom → add or subtract tops, keep bottom.' }
        ] },
        { kind: 'drill', subject: 'Math', title: 'Build the Answer (Fraction Bar)', engine: 'fractionBar', questions: [
          { prompt: '1/4 + 2/4 = ?/4 — tap 3 parts', denom: 4, target: 3 },
          { prompt: '3/5 − 1/5 = ?/5 — tap 2 parts', denom: 5, target: 2 },
          { prompt: '2/6 + 1/6 = ?/6 — tap 3 parts', denom: 6, target: 3 },
          { prompt: '4/5 − 2/5 = ?/5 — tap 2 parts', denom: 5, target: 2 },
          { prompt: '1/3 + 1/3 = ?/3 — tap 2 parts', denom: 3, target: 2 }
        ] },
        { kind: 'lesson', subject: 'Science', title: 'Rock Layers & Fossils', blocks: [
          { h: 'Rocks form in layers', p: 'Sediment piles up over time and hardens into rock in layers called strata. Each layer is a slice of time.', example: 'The Grand Canyon shows stacked rock layers.' },
          { h: 'Older layers are deeper', p: 'In an undisturbed stack, the bottom layer formed first (oldest) and the top layer formed last (youngest). Deeper = older.', tip: 'Bottom = oldest; top = youngest.' },
          { h: 'Fossils = evidence of past life', p: 'A fossil is the preserved remains or traces of a once-living thing — bones, shells, footprints, or imprints.', example: 'A dinosaur bone fossil shows it lived there.' },
          { h: 'Fossils form in sedimentary rock', p: 'Most fossils form in sedimentary rock, where sediment buries remains before they decay. Igneous and metamorphic rock rarely hold fossils.', diagram: '<div class="sg-energy-forms"><span>🪨 Strata</span><span>🦴 Fossils</span><span>📏 Deeper = older</span><span>🌊 Sediment</span><span>⏳ Time</span></div>' },
          { h: 'Relative dating', p: 'We can tell relative age by position: a layer below another is older. This is relative dating — ordering without exact dates.', tip: 'Lower layer → older than the one above.' },
          { h: 'Environments change', p: 'Fossils show environments change over time — a desert may once have been a sea. Layers tell Earth’s story.', example: 'Shell fossils on a mountain mean it was once underwater.' },
          { h: 'Why it matters', p: 'Rock layers and fossils are Earth’s history book. They reveal past life, climates, and events over millions of years.', tip: 'Layers + fossils = the story of life on Earth.' }
        ] },
        { kind: 'practice', subject: 'Science', title: 'Layer Timeline', mode: 'timeline', eras: ['Oldest (bottom)', 'Middle', 'Youngest (top)'], events: [
          { text: 'Bottom sediment settles first', era: 0 }, { text: 'Fossils form in lower layers', era: 0 },
          { text: 'More sediment piles on', era: 1 }, { text: 'Top layer is the youngest', era: 2 }
        ] },
        { kind: 'activity', title: 'Layers & Slices', stages: [
          { type: 'quiz', subject: 'Math · Add', story: 'First, add: 1/4 + 2/4 = ?', prompt: '1/4 + 2/4 = ?', options: ['3/4', '3/8', '1/4'], a: 0, okMsg: '3/4 — kept the 4! Layer 1 set.' },
          { type: 'match', subject: 'Science · Terms', story: 'Match each term to its meaning.', pairs: [ ['Fossil','Evidence of past life'], ['Strata','Rock layers'], ['Sedimentary rock','Where fossils form'], ['Older layer','Found deeper down'] ] },
          { type: 'input', subject: 'Math · Subtract', story: '3/5 − 1/5 = ?/5  (type the numerator).', prompt: '3/5 − 1/5 = ?/5  (numerator):', accept: ['2'], okMsg: '2 — 3/5 − 1/5 = 2/5! Layer 3 set.' },
          { type: 'fillBlank', subject: 'Math · Rule', story: 'Finish the rule to lock the layer.', sentence: 'To add fractions with the same denominator, add the * and keep the *.', blanks: ['numerators', 'denominator'] }
        ] }
      ]
    } },

    '4-1': { type: 'mission', content: {
      title: 'Branches & Comparisons',
      intro: 'Compare with figures and split the power. Learn similes/metaphors and the branches of government, then balance the tower.',
      winText: '🎉 Comparisons sharp and branches balanced — tower stands!',
      phases: [
        { kind: 'lesson', subject: 'ELA', title: 'Similes & Metaphors', blocks: [
          { h: 'Figures of speech compare', p: 'Similes and metaphors are figures of speech that compare two things to create a vivid picture in the reader’s mind.', example: '“Her smile was sunshine” paints a picture.' },
          { h: 'Simile uses like or as', p: 'A simile compares using “like” or “as.” “Brave as a lion” and “runs like the wind” are similes.', tip: 'like / as → simile.' },
          { h: 'Metaphor says one thing IS another', p: 'A metaphor compares by saying one thing IS another — no like/as. “The sun was a gold coin” is a metaphor.', example: '“The moon was a silver coin” = metaphor.' },
          { h: 'Simile example', p: '“Her smile was like sunshine” uses like, so it’s a simile. It compares her smile to sunshine to show warmth.', diagram: '<div class="sg-flow"><span class="sg-flow-in">brave as a lion</span><span class="sg-flow-arrow">→</span><span class="sg-flow-box">like / as</span><span class="sg-flow-arrow">→</span><span class="sg-flow-out">SIMILE</span></div>' },
          { h: 'Metaphor example', p: '“The sun was a gold coin” says the sun IS a coin — that’s a metaphor. It paints the sun’s shape and color.', example: 'No like/as + “is” → metaphor.' },
          { h: 'Why writers use them', p: 'Writers use similes and metaphors to make descriptions vivid, memorable, and emotional — they help readers see and feel.', tip: 'They turn plain descriptions into pictures.' },
          { h: 'Why it matters', p: 'Spotting similes and metaphors deepens reading and improves your own descriptive writing.', tip: 'like/as = simile; is/are/was = metaphor.' }
        ] },
        { kind: 'drill', subject: 'ELA', title: 'Rebuild the Simile', engine: 'scramble', words: ['Her', 'smile', 'was', 'like', 'sunshine'] },
        { kind: 'lesson', subject: 'Social Studies', title: 'Branches of Government', blocks: [
          { h: 'Why three branches', p: 'Power is split into three branches so no one person or group is too powerful. This is separation of powers.', example: 'No branch can do everything alone.' },
          { h: 'Legislative — makes laws', p: 'The legislative branch makes the laws. At the federal level that’s Congress (House + Senate); in NY, the State Legislature.', tip: 'Legislative = lawmakers.' },
          { h: 'Executive — carries out laws', p: 'The executive branch carries out the laws and leads the government. Federally that’s the President; in NY, the Governor.', example: 'President/Governor = executive.' },
          { h: 'Judicial — judges laws', p: 'The judicial branch interprets (judges) the laws — the courts. It decides if laws and actions are constitutional.', diagram: '<div class="sg-energy-forms"><span>📜 Legislative</span><span>🏛️ Executive</span><span>⚖️ Judicial</span><span>🤝 Checks</span><span>⚖️ Balances</span></div>' },
          { h: 'Checks & balances', p: 'Each branch can check the others — veto, override, rule a law unconstitutional. This keeps power balanced.', tip: 'Each branch limits the others.' },
          { h: 'State vs federal', p: 'Each level (federal, state) has its own three branches. NY State has its legislature, governor, and courts.', example: 'Federal and state each have all three branches.' },
          { h: 'Why it matters', p: 'Three branches protect freedom by preventing any one part from taking over. It’s how democracy stays balanced.', tip: 'Legislative, Executive, Judicial — make, do, judge.' }
        ] },
        { kind: 'practice', subject: 'Social Studies', title: 'Sort the Branches (Categorize)', mode: 'categorize', bins: ['Legislative', 'Executive', 'Judicial'], items: [
          { text: 'Makes laws', bin: 0 }, { text: 'President', bin: 1 }, { text: 'Courts', bin: 2 }, { text: 'Congress', bin: 0 }, { text: 'Governor', bin: 1 }, { text: 'Judges laws', bin: 2 }
        ] },
        { kind: 'activity', title: 'Branches & Comparisons', stages: [
          { type: 'quiz', subject: 'ELA · Simile', story: 'A simile uses ___ to compare.', prompt: 'A simile uses ___ to compare:', options: ['like or as', 'is / are', 'no words'], a: 0, okMsg: 'like or as — simile! Block 1 placed.' },
          { type: 'match', subject: 'ELA + SS · Terms', story: 'Match each term to its meaning.', pairs: [ ['Simile','Compares with like/as'], ['Metaphor','Says X IS Y'], ['Legislative','Makes laws'], ['Judicial','Judges laws'] ] },
          { type: 'input', subject: 'ELA · Metaphor', story: '“The moon was a silver coin” is a ___ .', prompt: '"The moon was a silver coin" is a ___ :', accept: ['metaphor'], okMsg: 'Metaphor — no like/as! Block 3 placed.' },
          { type: 'dragSort', subject: 'SS · How a bill works', story: 'Order how a bill moves through the branches.', items: [ {text:'Idea is written as a bill', order:0}, {text:'Legislative branch votes on it', order:1}, {text:'Executive signs or vetoes', order:2}, {text:'Judicial checks if lawful', order:3} ] }
        ] }
      ]
    } },

    '4-2': { type: 'mission', content: {
      title: 'Mixed & Meaning',
      intro: 'Mix the numbers and decode the words. Learn mixed numbers and multiple-meaning words, then crack the code.',
      winText: '🎉 Mixed numbers built and meanings decoded — code cracked!',
      phases: [
        { kind: 'lesson', subject: 'Math', title: 'Mixed Numbers & Whole × Fraction', blocks: [
          { h: 'Mixed number = whole + fraction', p: 'A mixed number combines a whole number and a fraction, like 1 1/2 (one and a half). It is more than one whole.', example: '1 1/2 = one whole plus one half.' },
          { h: 'Improper fraction', p: 'An improper fraction has a numerator greater than or equal to its denominator, like 3/2. It is also more than one whole.', tip: 'Top ≥ bottom → improper.' },
          { h: 'Convert between them', p: '1 1/2 = 3/2: the whole (1 = 2/2) plus the fraction (1/2) = 3/2. Going back, 3/2 = 1 1/2 (3 ÷ 2 = 1 r 1).', diagram: '<div class="sg-flow"><span class="sg-flow-in">1 1/2</span><span class="sg-flow-arrow">=</span><span class="sg-flow-box">2/2 + 1/2</span><span class="sg-flow-arrow">=</span><span class="sg-flow-out">3/2</span></div>' },
          { h: 'Whole × fraction', p: 'Multiply a whole number by a fraction: keep the denominator, multiply the numerator. 3 × 1/4 = 3/4.', example: '3 × 1/4 = (3×1)/4 = 3/4.' },
          { h: 'Repeated addition view', p: '3 × 1/4 is the same as 1/4 + 1/4 + 1/4 = 3/4. Multiplying by a whole = adding the fraction that many times.', tip: 'Whole × fraction = repeated addition.' },
          { h: 'Simplify answers', p: 'If your answer can be simplified, simplify it. 4/2 = 2; 6/4 = 1 1/2. Always reduce or write as a mixed number.', example: '4/2 = 2 wholes.' },
          { h: 'Why it matters', p: 'Mixed numbers appear in recipes, measurements, and distances. Whole × fraction is scaling — used in doubling recipes.', tip: 'Mixed = whole + fraction; × whole = multiply tops, keep bottom.' }
        ] },
        { kind: 'drill', subject: 'Math', title: 'Mixed to Improper', engine: 'fillBlank', sentence: 'A mixed number = whole + * . 1 1/2 = * /2 as an improper fraction (since 1 = 2/2).', blanks: ['fraction', '3'] },
        { kind: 'lesson', subject: 'ELA', title: 'Multiple-Meaning Words & Context Clues', blocks: [
          { h: 'Words have multiple meanings', p: 'Many words have more than one meaning. “Bank” can mean a river bank or a money bank. The word alone doesn’t tell you which.', example: 'bat, light, bark, match — all multiple-meaning.' },
          { h: 'Context = surrounding words', p: 'Context is the words and sentences around an unknown word. They hold clues to the correct meaning.', tip: 'Read the neighbors to find the meaning.' },
          { h: 'Use context to pick', p: 'Use context clues to choose the meaning that fits. “She sat on the river bank” → bank = edge of a river.', example: '“Deposit money in the bank” → bank = money bank.' },
          { h: 'Example: bank', p: '“The river bank was muddy” → edge of river. “I opened a bank account” → a money bank. Same word, different meaning by context.', diagram: '<div class="sg-energy-forms"><span>river bank = edge</span><span>money bank = savings</span><span>bat = mammal / club</span><span>light = lamp / weight</span></div>' },
          { h: 'Definition order', p: 'Dictionaries list meanings in order, often most common first. Pick the definition that fits the context, not just #1.', tip: 'Match the definition to the sentence.' },
          { h: 'Other clue types', p: 'Other context clues: synonyms (nearby similar words), antonyms (opposites), examples, and restatements. They all hint meaning.', example: '“The bark, the tree’s outer skin,…” defines bark by restatement.' },
          { h: 'Why it matters', p: 'Context clues let you decode new and multiple-meaning words while reading — without stopping for a dictionary.', tip: 'Surrounding words = the meaning key.' }
        ] },
        { kind: 'practice', subject: 'ELA', title: 'Flip the Meanings', mode: 'flip', cards: [
          { front: 'bank (river)', back: 'Edge of a river' }, { front: 'bank (money)', back: 'A place for money' },
          { front: 'bat (animal)', back: 'A flying mammal' }, { front: 'bat (sports)', back: 'A wooden club' },
          { front: 'light (lamp)', back: 'A source of light' }, { front: 'light (weight)', back: 'Not heavy' }
        ] },
        { kind: 'activity', title: 'Mixed & Meaning', stages: [
          { type: 'twoTruths', subject: 'Math · Mixed numbers', story: 'One statement is FALSE. Tap the lie to crack the code.', statements: [ {t:'1 1/2 is a mixed number', a:true}, {t:'3 × 1/4 = 3/4', a:true}, {t:'A mixed number has no whole part', a:false} ] },
          { type: 'match', subject: 'Math + ELA · Terms', story: 'Match each term to its meaning.', pairs: [ ['Mixed number','Whole + fraction'], ['Improper fraction','Numerator ≥ denom'], ['Whole × 1/4 (×3)','3/4'], ['Context','Surrounding words'] ] },
          { type: 'input', subject: 'Math · Improper', story: '1 1/2 = ?/2  (type the numerator).', prompt: '1 1/2 = ?/2  (numerator):', accept: ['3'], okMsg: '3 — 1 1/2 = 3/2! Code 3 cracked.' },
          { type: 'dragSort', subject: 'ELA · Context clues', story: 'Order the steps to use a context clue.', items: [ {text:'Find the unknown word', order:0}, {text:'Read the surrounding sentence', order:1}, {text:'Look for clue words', order:2}, {text:'Pick the meaning that fits', order:3} ] }
        ] }
      ]
    } },

    '4-3': { type: 'mission', content: {
      title: 'Wear & Borough',
      intro: 'Watch the land wear down and find your borough. Learn weathering/erosion/deposition and Brooklyn local government, then build the delta.',
      winText: '🎉 Landforms built and boroughs labeled — delta formed!',
      phases: [
        { kind: 'lesson', subject: 'Science', title: 'Weathering, Erosion & Deposition', blocks: [
          { h: 'Weathering breaks rock in place', p: 'Weathering is the breaking apart of rock where it is, without moving it. Water, ice, wind, and roots crack rock over time.', example: 'Water freezes in a crack and splits the rock.' },
          { h: 'Erosion moves the pieces', p: 'Erosion is the moving of weathered rock and soil by water, wind, or ice. It carries the broken pieces away.', tip: 'Weathering breaks; erosion moves.' },
          { h: 'Deposition drops them', p: 'Deposition is the dropping of eroded material in a new place. A river slows and drops sediment, building land.', example: 'A delta forms where a river deposits sediment.' },
          { h: 'Water, wind, ice cause all three', p: 'The same forces — water, wind, and ice — weather, erode, and deposit. They shape Earth’s surface constantly.', diagram: '<div class="sg-energy-forms"><span>💧 Water</span><span>🌬️ Wind</span><span>🧊 Ice</span><span>🪨 Weather</span><span>🚚 Erode</span><span>⬇️ Deposit</span></div>' },
          { h: 'The order', p: 'The process goes in order: weathering (break) → erosion (move) → deposition (drop). Each step follows the last.', tip: 'Break → move → drop.' },
          { h: 'Shapes landforms', p: 'Together these processes carve canyons, wear mountains, and build deltas and beaches. They slowly reshape the land.', example: 'The Grand Canyon was carved by erosion.' },
          { h: 'Why it matters', p: 'Understanding these processes explains landscapes and helps us predict erosion, plan building, and protect coasts.', tip: 'Weather → erode → deposit = Earth’s reshaping loop.' }
        ] },
        { kind: 'drill', subject: 'Science', title: 'Order the Process (Drag)', engine: 'dragSort', items: [
          { text: 'Weathering breaks rock', order: 0 }, { text: 'Erosion moves the pieces', order: 1 },
          { text: 'Deposition drops them', order: 2 }, { text: 'A new landform builds up', order: 3 }
        ] },
        { kind: 'lesson', subject: 'Social Studies', title: 'Brooklyn / Kings County Local Government', blocks: [
          { h: 'Brooklyn is Kings County', p: 'Brooklyn is one of NYC’s five boroughs and is also Kings County. Boroughs are both neighborhoods and counties.', example: 'Brooklyn = Kings County.' },
          { h: 'Borough president & community boards', p: 'Each borough has a Borough President and community boards that advise on local issues and budgets for the neighborhood.', tip: 'Borough President + community boards = local voice.' },
          { h: 'City Council representative', p: 'Brooklyn is divided into City Council districts, each with an elected Council member who votes on city laws and budgets.', example: 'Your council member represents your district.' },
          { h: 'City services', p: 'City government provides schools (DOE), sanitation, parks, police, and fire services that Brooklyn uses every day.', diagram: '<div class="sg-energy-forms"><span>🏫 Schools</span><span>🗑️ Sanitation</span><span>🌳 Parks</span><span>👮 Safety</span><span>🚒 Fire</span></div>' },
          { h: 'State representatives', p: 'Brooklyn also elects State Assembly members and State Senators who make laws in Albany for all of New York State.', tip: 'City council = NYC; Assembly/Senate = NY State.' },
          { h: 'You can participate', p: 'You can attend community board meetings, contact representatives, and vote in local elections. Local government affects your daily life.', example: 'Community boards meet monthly and are open to the public.' },
          { h: 'Why it matters', p: 'Local government runs your streets, schools, and parks. Knowing it helps you improve your neighborhood.', tip: 'Borough president, council, community boards — your local leaders.' }
        ] },
        { kind: 'practice', subject: 'Social Studies', title: 'Label the Boroughs', mode: 'labelDiagram', slots: [
          { hint: 'Where Brooklyn is (Kings Co.)' }, { hint: 'Manhattan (New York Co.)' }, { hint: 'Queens (Queens Co.)' }, { hint: 'The Bronx' }, { hint: 'Staten Island' }
        ], labels: [ { label: 'Brooklyn', slot: 0 }, { label: 'Manhattan', slot: 1 }, { label: 'Queens', slot: 2 }, { label: 'Bronx', slot: 3 }, { label: 'Staten Island', slot: 4 } ] },
        { kind: 'activity', title: 'Wear & Borough', stages: [
          { type: 'quiz', subject: 'Science · Order', story: 'Which process comes FIRST?', prompt: 'Which comes first?', options: ['Weathering', 'Erosion', 'Deposition'], a: 0, okMsg: 'Weathering breaks first! Sediment 1 dropped.' },
          { type: 'venn', subject: 'Science · Processes', story: 'Sort each trait into Weathering, Erosion, both, or neither.', left: 'Weathering', right: 'Erosion', items: [ {text:'Breaks rock in place', set:0}, {text:'Moves broken pieces', set:1}, {text:'Caused by water, wind, ice', set:2}, {text:'Drops sediment in a new spot', set:3} ] },
          { type: 'input', subject: 'SS · County', story: 'Brooklyn is also called ___ County.', prompt: 'Brooklyn is also called ___ County:', accept: ['kings'], okMsg: 'Kings — Brooklyn = Kings County! Sediment 3 dropped.' },
          { type: 'numberLine', subject: 'Science · Delta', story: 'Deposition filled 3/4 of the delta — tap 3/4.', prompt: 'Tap 3/4 (deposition filled the delta):', marks: [ {l:'0'},{l:'1/4'},{l:'1/2'},{l:'3/4'},{l:'1'} ], a: 3 }
        ] }
      ]
    } },

    '5-0': { type: 'mission', content: {
      title: 'Decimals & Heights',
      intro: 'Place the decimals and read the land. Learn decimals and topographic maps, then summit the peak.',
      winText: '🎉 Decimals placed and landforms read — summit reached!',
      phases: [
        { kind: 'lesson', subject: 'Math', title: 'Decimals: Tenths & Hundredths', blocks: [
          { h: 'Decimals name parts of a whole', p: 'A decimal is another way to write fractions, using a decimal point. 0.3 = 3/10 (three tenths); 0.07 = 7/100 (seven hundredths).', example: '0.1 = one tenth = 1/10.' },
          { h: 'Tenths place', p: 'The first digit right of the decimal point is tenths. 0.4 means four tenths, a little less than half.', tip: '1st after the point = tenths.' },
          { h: 'Hundredths place', p: 'The second digit right of the point is hundredths. 0.45 = 4 tenths and 5 hundredths (45/100).', example: '0.45 = 45 hundredths.' },
          { h: 'Read the place value', p: 'Read 0.62 as “sixty-two hundredths.” The denominator is always 10 (one digit) or 100 (two digits) after the point.', diagram: '<div class="sg-flow"><span class="sg-flow-in">0.62</span><span class="sg-flow-arrow">→</span><span class="sg-flow-box">6 tenths + 2 hundredths</span><span class="sg-flow-arrow">→</span><span class="sg-flow-out">62/100</span></div>' },
          { h: 'Compare decimals', p: 'Compare place by place left to right. 0.6 > 0.58 because 6 tenths > 5 tenths. Line up the decimal point.', tip: 'Line up points; compare tenths first.' },
          { h: 'Decimals on a number line', p: 'Decimals sit between whole numbers on a number line. 0.5 is halfway between 0 and 1; 0.25 is a quarter of the way.', example: '0.1, 0.2, … 0.9, 1.0 — tenths step up.' },
          { h: 'Why it matters', p: 'Decimals are used in money ($0.99), times, and measurements. Place value keeps them accurate.', tip: 'Tenths, then hundredths — read like fractions of 10 and 100.' }
        ] },
        { kind: 'drill', subject: 'Math', title: 'Tap the Decimal (Number Line)', engine: 'numberLine', questions: [
          { prompt: 'Tap 0.5 (five tenths)', marks: [ {l:'0'},{l:'0.2'},{l:'0.5'},{l:'0.7'},{l:'1.0'} ], a: 2 },
          { prompt: 'Tap 0.2 (two tenths)', marks: [ {l:'0'},{l:'0.2'},{l:'0.5'},{l:'0.7'},{l:'1.0'} ], a: 1 },
          { prompt: 'Tap 0.7 (seven tenths)', marks: [ {l:'0'},{l:'0.2'},{l:'0.5'},{l:'0.7'},{l:'1.0'} ], a: 3 },
          { prompt: 'Tap 1.0 (one whole)', marks: [ {l:'0'},{l:'0.2'},{l:'0.5'},{l:'0.7'},{l:'1.0'} ], a: 4 },
          { prompt: 'Tap 0 (zero)', marks: [ {l:'0'},{l:'0.2'},{l:'0.5'},{l:'0.7'},{l:'1.0'} ], a: 0 }
        ] },
        { kind: 'lesson', subject: 'Science', title: 'Topographic Maps & Landforms', blocks: [
          { h: 'What is a topographic map?', p: 'A topographic map shows the shape and height of the land using contour lines. Close lines mean steep slopes; far apart means flat.', example: 'Hikers use topo maps to see hills and valleys.' },
          { h: 'Contour lines', p: 'Each contour line connects points of equal elevation (height above sea level). Crossing lines mark cliffs; rings mark peaks.', tip: 'Close lines = steep; wide lines = gentle.' },
          { h: 'Elevation', p: 'Elevation is height above sea level. Contour lines are labeled with elevation numbers so you can read how tall the land is.', example: 'A 1000 ft contour marks land 1000 ft above sea.' },
          { h: 'Landforms', p: 'Landforms are shapes of the land: mountains, hills, plains, valleys, plateaus, canyons. Topo maps reveal them.', diagram: '<div class="sg-energy-forms"><span>⛰️ Mountain</span><span>🟫 Plain</span><span>🏞️ Valley</span><span>📈 Contour</span><span>📏 Elevation</span></div>' },
          { h: 'Reading slopes', p: 'Where contour lines bunch together, the slope is steep. Where they spread out, the land is flat or rolling.', tip: 'Bunched lines = steep climb.' },
          { h: 'Depression & peaks', p: 'Hatched contour lines mark a depression (a dip). Concentric rings with increasing elevation mark a mountain peak.', example: 'The innermost high ring = the summit.' },
          { h: 'Why it matters', p: 'Topographic maps guide hiking, building, and rescue. They let you “see” 3D land on flat paper.', tip: 'Contour lines = elevation; spacing = steepness.' }
        ] },
        { kind: 'practice', subject: 'Science', title: 'Label the Map', mode: 'labelDiagram', slots: [
          { hint: 'Tallest landform, pointed' }, { hint: 'Flat, low land' }, { hint: 'Low area between hills' }, { hint: 'Height above sea level' }
        ], labels: [ { label: 'Mountain', slot: 0 }, { label: 'Plain', slot: 1 }, { label: 'Valley', slot: 2 }, { label: 'Elevation', slot: 3 } ] },
        { kind: 'activity', title: 'Decimals & Heights', stages: [
          { type: 'quiz', subject: 'Math · Place value', story: 'What place is the 2 in 0.52?', prompt: 'In 0.52, the 2 is in the…', options: ['Hundredths', 'Tenths', 'Ones'], a: 0, okMsg: 'Hundredths — 0.52 = 52/100! Crampon 1 on.' },
          { type: 'match', subject: 'Science · Terms', story: 'Match each term to its meaning.', pairs: [ ['Contour line','Equal elevation'], ['Elevation','Height above sea'], ['Plain','Flat low land'], ['Mountain','Tall peaked land'] ] },
          { type: 'input', subject: 'Math · Compare', story: 'Which is bigger, 0.6 or 0.58? Type the bigger one.', prompt: 'Bigger: 0.6 or 0.58? Type it:', accept: ['0.6'], okMsg: '0.6 (6 tenths > 5 tenths)! Crampon 3 on.' },
          { type: 'fillBlank', subject: 'Math · Read', story: 'Finish the decimal read-out to plant the flag.', sentence: '0.45 = * tenths and * hundredths = 45 / * .', blanks: ['4', '5', '100'] }
        ] }
      ]
    } },

    '5-1': { type: 'mission', content: {
      title: 'Sayings & Citizenship',
      intro: 'Crack the sayings and know your rights. Learn idioms/adages/proverbs and rights & responsibilities, then earn your badge.',
      winText: '🎉 Sayings solved and rights reviewed — badge earned!',
      phases: [
        { kind: 'lesson', subject: 'ELA', title: 'Idioms, Adages & Proverbs', blocks: [
          { h: 'Figures of speech vs sayings', p: 'Idioms, adages, and proverbs are short sayings. Idioms mean something different from their words; adages and proverbs give advice or a lesson.', example: '“It’s raining cats and dogs” = raining hard (idiom).' },
          { h: 'Idioms', p: 'An idiom is a phrase whose meaning isn’t literal. “Kick the bucket” doesn’t mean kicking — it’s an idiom. You learn them by exposure.', tip: 'Idiom = can’t guess from the words alone.' },
          { h: 'Adages', p: 'An adage is a short traditional saying expressing a common truth. “Better safe than sorry” is an adage about caution.', example: '“A stitch in time saves nine” = fix problems early.' },
          { h: 'Proverbs', p: 'A proverb is a short saying that gives advice or a lesson, often from many cultures. “Don’t judge a book by its cover.”', diagram: '<div class="sg-energy-forms"><span>🗣️ Idiom</span><span>📜 Adage</span><span>💡 Proverb</span><span>🎯 Lesson</span><span>👵 Tradition</span></div>' },
          { h: 'Find the lesson', p: 'Many sayings teach a lesson. Ask: what advice is hidden here? “Look before you leap” = think before acting.', tip: 'What’s the advice inside the saying?' },
          { h: 'Use context', p: 'Context helps decode sayings. If a story says “she burned the candle at both ends,” the tired outcome shows it means overworking.', example: 'Surrounding events reveal the meaning.' },
          { h: 'Why it matters', p: 'Sayings are everywhere in speech and writing. Knowing them sharpens reading and makes your own writing colorful.', tip: 'Idiom = phrase; adage/proverb = advice.' }
        ] },
        { kind: 'drill', subject: 'ELA', title: 'Mini Crossword (Sayings)', engine: 'crossword', cols: 5, rows: 5, blocks: [0,2,3,4,7,9,12,13,14,17,18,19,22,23,24], words: [
          { num: 1, dir: 'across', clue: 'A phrase whose meaning differs from its words (5)', answer: 'IDIOM', cells: [5,6,7,8,9] },
          { num: 1, dir: 'down', clue: 'A short traditional saying (5)', answer: 'ADAGE', cells: [1,6,11,16,21] },
          { num: 2, dir: 'down', clue: '"_ your best" (2)', answer: 'DO', cells: [3,8] }
        ] },
        { kind: 'lesson', subject: 'Social Studies', title: 'Rights & Responsibilities of Citizens', blocks: [
          { h: 'What is a citizen?', p: 'A citizen is an official member of a community or country. Citizens have rights (freedoms protected by law) and responsibilities (duties they should do).', example: 'US citizens have rights under the Constitution.' },
          { h: 'Rights', p: 'Rights include freedom of speech, freedom of religion, and the right to vote. Rights are protected but not unlimited.', tip: 'Rights = freedoms protected by law.' },
          { h: 'Responsibilities', p: 'Responsibilities include obeying laws, paying taxes, serving on a jury, and voting. They keep the community working.', example: 'Voting is both a right and a responsibility.' },
          { h: 'Rights + responsibilities balance', p: 'Your rights end where others’ begin. Exercising rights responsibly keeps fairness for everyone.', diagram: '<div class="sg-energy-forms"><span>🗣️ Free speech</span><span>🗳️ Vote</span><span>⚖️ Obey laws</span><span>💰 Pay taxes</span><span>👥 Jury duty</span></div>' },
          { h: 'Civic participation', p: 'Citizens can attend meetings, contact leaders, volunteer, and vote. Participation is how democracy stays strong.', tip: 'Participate = be a good citizen.' },
          { h: 'Respect differences', p: 'Good citizens respect others’ rights and opinions even when disagreeing. Respect keeps peace.', example: 'Debate respectfully; don’t silence others.' },
          { h: 'Why it matters', p: 'Rights and responsibilities make communities fair and free. Knowing them helps you be an active citizen.', tip: 'Rights + responsibilities = citizenship.' }
        ] },
        { kind: 'practice', subject: 'Social Studies', title: 'Flip the Facts (Citizenship)', mode: 'flip', cards: [
          { front: 'Right', back: 'A freedom protected by law' }, { front: 'Responsibility', back: 'A duty citizens should do' },
          { front: 'Vote', back: 'Both a right and a duty' }, { front: 'Jury duty', back: 'A citizen responsibility' }, { front: 'Free speech', back: 'A citizen right' }
        ] },
        { kind: 'activity', title: 'Sayings & Citizenship', stages: [
          { type: 'quiz', subject: 'ELA · Sayings', story: '“Better safe than sorry” is best called an…', prompt: '"Better safe than sorry" is best called an…', options: ['Adage', 'Idiom', 'Decimal'], a: 0, okMsg: 'Adage — a wise saying! Badge 1.' },
          { type: 'match', subject: 'ELA + SS · Terms', story: 'Match each term to its meaning.', pairs: [ ['Idiom','Non-literal phrase'], ['Proverb','Short advice saying'], ['Right','A protected freedom'], ['Responsibility','A citizen duty'] ] },
          { type: 'input', subject: 'ELA · Idiom', story: '“It’s raining cats and ___” means raining hard.', prompt: '"It\'s raining cats and ___":', accept: ['dogs'], okMsg: 'dogs — idiom for heavy rain! Badge 3.' },
          { type: 'dragSort', subject: 'SS · Be a good citizen', story: 'Order the steps of civic participation.', items: [ {text:'Learn about an issue', order:0}, {text:'Form an opinion', order:1}, {text:'Vote or contact leaders', order:2}, {text:'Respect the outcome', order:3} ] }
        ] }
      ]
    } },

    '5-2': { type: 'mission', content: {
      title: 'Convert & Narrate',
      intro: 'Convert the units and tell the tale. Learn measurement conversions/area/perimeter and narrative writing, then finish the story.',
      winText: '🎉 Units converted and story finished — tale told!',
      phases: [
        { kind: 'lesson', subject: 'Math', title: 'Measurement Conversions, Area & Perimeter', blocks: [
          { h: 'Convert units', p: 'To convert within one system, multiply or divide by the relationship. 1 m = 100 cm, so 3 m = 300 cm; 1 ft = 12 in, so 2 ft = 24 in.', example: 'Bigger→smaller unit: multiply.' },
          { h: 'Know the relationships', p: 'Common facts: 1 km = 1000 m; 1 m = 100 cm; 1 hr = 60 min; 1 min = 60 s; 1 gal = 4 qt; 1 lb = 16 oz.', tip: 'Memorize the key conversions.' },
          { h: 'Perimeter', p: 'Perimeter is the distance around a shape. For a rectangle: P = 2 × (length + width). Add all the sides.', example: 'Rectangle 5×3 → P = 2×(5+3) = 16.' },
          { h: 'Area', p: 'Area is the space inside a shape. For a rectangle: A = length × width. It’s measured in square units (sq cm, sq ft).', diagram: '<div class="sg-flow"><span class="sg-flow-in">Rectangle</span><span class="sg-flow-arrow">→</span><span class="sg-flow-box">P = 2(L+W)</span><span class="sg-flow-arrow">+</span><span class="sg-flow-out">A = L×W</span></div>' },
          { h: 'Units matter', p: 'Perimeter uses plain units (cm, m); area uses square units (sq cm, sq m). Mixing them is a common mistake.', tip: 'Perimeter = around; area = inside.' },
          { h: 'Solve word problems', p: 'Read carefully: fence = perimeter; carpet = area. Pick the right measure, convert units if needed, then compute.', example: 'Fencing a garden → perimeter.' },
          { h: 'Why it matters', p: 'Conversions, area, and perimeter are used in building, crafts, and design. They turn measurements into real plans.', tip: 'Convert with facts; P = around; A = inside.' }
        ] },
        { kind: 'drill', subject: 'Math', title: 'Fill the Conversion', engine: 'fillBlank', sentence: '1 m = * cm, so 2 m = * cm. A 4×3 rectangle has perimeter * and area * sq units.', blanks: ['100', '200', '14', '12'] },
        { kind: 'lesson', subject: 'ELA', title: 'Narrative Writing with Dialogue', blocks: [
          { h: 'What is narrative writing?', p: 'A narrative tells a story — real or imagined — with characters, a setting, and a sequence of events.', example: 'A short story about a day at the beach.' },
          { h: 'Characters & setting', p: 'Establish who is in the story (characters) and where/when it happens (setting) early so readers can picture it.', tip: 'Who + where + when = the opening.' },
          { h: 'Plot in order', p: 'Sequence events clearly: beginning, middle (problem), end (resolution). Use transition words to move time along.', example: 'First, then, suddenly, finally.' },
          { h: 'Use dialogue', p: 'Dialogue shows what characters say, in quotation marks. “Watch out!” she shouted. It reveals character and moves the plot.', diagram: '<div class="sg-energy-forms"><span>“ ” Quotes</span><span>🗣️ Dialogue</span><span>😊 Feelings</span><span>⏳ Order</span><span>🎬 Show, don’t tell</span></div>' },
          { h: 'Show feelings', p: 'Show emotions through actions and dialogue, not just telling. “He slammed the door” beats “He was angry.”', tip: 'Show, don’t just tell.' },
          { h: 'Strong ending', p: 'End with a resolution or reflection. Wrap up the problem and leave the reader with a feeling or thought.', example: 'Resolve the problem; reflect on it.' },
          { h: 'Why it matters', p: 'Narrative writing builds imagination and storytelling skill — used in fiction, memoirs, and even explanations.', tip: 'Characters, setting, plot, dialogue, ending.' }
        ] },
        { kind: 'practice', subject: 'ELA', title: 'Order the Story (Drag)', engine: 'scramble', words: ['The', 'hero', 'opened', 'the', 'old', 'map'] },
        { kind: 'activity', title: 'Convert & Narrate', stages: [
          { type: 'twoTruths', subject: 'Math · Measures', story: 'One statement is FALSE. Tap the lie to start the tale.', statements: [ {t:'Perimeter is the distance around a shape', a:true}, {t:'Area of a rectangle = length × width', a:true}, {t:'Area uses plain units like cm, not square units', a:false} ] },
          { type: 'match', subject: 'Math · Terms', story: 'Match each term to its meaning.', pairs: [ ['Perimeter','Distance around'], ['Area','Space inside'], ['1 m','100 cm'], ['1 hr','60 min'] ] },
          { type: 'input', subject: 'Math · Perimeter', story: 'A 5×3 rectangle: perimeter = ?  (2×(5+3)).', prompt: 'Perimeter of a 5×3 rectangle:', accept: ['16'], okMsg: '16 — around the shape! Plot point 3.' },
          { type: 'dragSort', subject: 'ELA · Story order', story: 'Order the parts of a narrative.', items: [ {text:'Introduce characters & setting', order:0}, {text:'Build the problem', order:1}, {text:'Add dialogue and feelings', order:2}, {text:'Resolve and end', order:3} ] }
        ] }
      ]
    } },

    '5-3': { type: 'mission', content: {
      title: 'Hazards & Freedom',
      intro: 'Face the hazards and follow the road to freedom. Learn natural hazards/engineering and slavery/abolition/Underground Railroad, then light the lantern.',
      winText: '🎉 Hazards engineered out and lantern lit — freedom road found!',
      phases: [
        { kind: 'lesson', subject: 'Science', title: 'Natural Hazards & Engineering', blocks: [
          { h: 'What are natural hazards?', p: 'Natural hazards are events like floods, hurricanes, earthquakes, and wildfires that can harm people and places.', example: 'A hurricane brings wind, rain, and flooding.' },
          { h: 'Types of hazards', p: 'Hazards include floods, hurricanes, earthquakes, volcanoes, tsunamis, and wildfires. Each affects regions differently.', tip: 'Different regions face different hazards.' },
          { h: 'Engineering solutions', p: 'Engineers design solutions: levees and seawalls for floods, earthquake-resistant buildings, fire breaks for wildfires.', diagram: '<div class="sg-energy-forms"><span>🌊 Flood</span><span>🌀 Hurricane</span><span>🏚️ Quake</span><span>🔥 Wildfire</span><span>🛡️ Engineering</span></div>' },
          { h: 'Design process', p: 'Engineers use a design process: identify the problem, brainstorm, build a model, test, improve. Testing reveals weaknesses.', tip: 'Problem → design → test → improve.' },
          { h: 'Test & improve', p: 'A solution is tested under hazard conditions and improved. A levee is tested for how much water it holds back.', example: 'Fail in test → redesign → test again.' },
          { h: 'Reduce harm', p: 'Good engineering reduces harm and saves lives: early-warning systems, strong buildings, safe evacuation routes.', tip: 'Engineering protects people.' },
          { h: 'Why it matters', p: 'Understanding hazards and engineering helps communities prepare and survive. It saves lives and property.', tip: 'Hazards happen; engineering reduces harm.' }
        ] },
        { kind: 'drill', subject: 'Science', title: 'Sort the Hazards (Categorize)', engine: 'categorize', bins: ['Water hazard', 'Fire/heat hazard', 'Ground hazard'], items: [
          { text: 'Flood', bin: 0 }, { text: 'Hurricane', bin: 0 }, { text: 'Wildfire', bin: 1 }, { text: 'Volcano', bin: 1 }, { text: 'Earthquake', bin: 2 }, { text: 'Tsunami', bin: 2 }
        ] },
        { kind: 'lesson', subject: 'Social Studies', title: 'Slavery, Abolition & the Underground Railroad', blocks: [
          { h: 'Slavery in the US', p: 'For centuries, millions of Africans were enslaved in America, denied freedom and rights. Enslaved people resisted and sought freedom.', example: 'Enslaved people were forced to work without pay or freedom.' },
          { h: 'Abolition', p: 'Abolitionists were people who fought to end slavery. They spoke, wrote, and organized against it in the North and South.', tip: 'Abolition = the movement to end slavery.' },
          { h: 'The Underground Railroad', p: 'The Underground Railroad was a secret network of routes and safe houses that helped enslaved people escape to freedom in the North and Canada.', example: '“Conductors” guided people to freedom.' },
          { h: 'Harriet Tubman', p: 'Harriet Tubman was a famous conductor who returned many times to guide others to freedom. She later lived in Auburn, New York.', diagram: '<div class="sg-energy-forms"><span>🚂 Underground RR</span><span>🕯️ Lantern</span><span>✊ Tubman</span><span>🆓 Freedom</span><span>🗽 NY & Canada</span></div>' },
          { h: 'NY’s role', p: 'New York was a destination and route for freedom-seekers, with abolitionist communities. Tubman made her home in Auburn, NY.', tip: 'NY had strong abolitionist support.' },
          { h: 'Risks & courage', p: 'Escaping and helping escape were dangerous and illegal. The courage of freedom-seekers and helpers was extraordinary.', example: 'Helpers risked prison; escapees risked capture.' },
          { h: 'Why it matters', p: 'The fight against slavery and the Underground Railroad show the struggle for freedom that shaped US history.', tip: 'Slavery → abolition → Underground Railroad → freedom.' }
        ] },
        { kind: 'practice', subject: 'Social Studies', title: 'Freedom Timeline', mode: 'timeline', eras: ['Enslaved', 'Escape', 'Freedom'], events: [
          { text: 'Millions are enslaved in the US', era: 0 }, { text: 'Abolitionists fight to end slavery', era: 0 },
          { text: 'The Underground Railroad helps people flee', era: 1 }, { text: 'Freedom-seekers reach the North & Canada', era: 2 }
        ] },
        { kind: 'activity', title: 'Hazards & Freedom', stages: [
          { type: 'quiz', subject: 'Science · Solutions', story: 'Which engineering solution helps with floods?', prompt: 'Which helps with floods?', options: ['Levee / seawall', 'Fire break', 'Lightning rod'], a: 0, okMsg: 'Levee holds back water! Lantern 1 lit.' },
          { type: 'venn', subject: 'SS · People', story: 'Sort each trait into Enslaved people, Abolitionists, both, or neither.', left: 'Enslaved', right: 'Abolitionists', items: [ {text:'Were denied freedom', set:0}, {text:'Fought to end slavery', set:1}, {text:'Risked their safety for freedom', set:2}, {text:'Owned enslaved people', set:3} ] },
          { type: 'input', subject: 'SS · Conductor', story: 'The famous conductor who lived in Auburn, NY: first name.', prompt: 'Famous conductor, first name:', accept: ['harriet'], okMsg: 'Harriet Tubman! Lantern 3 lit.' },
          { type: 'dragSort', subject: 'Science · Design steps', story: 'Order the engineering design steps.', items: [ {text:'Identify the hazard problem', order:0}, {text:'Brainstorm a solution', order:1}, {text:'Build and test a model', order:2}, {text:'Improve the design', order:3} ] }
        ] }
      ]
    } },

    '6-0': { type: 'mission', content: {
      title: 'Angles & Waves',
      intro: 'Measure the angles and ride the waves. Learn angle measurement and sound waves, then tune the signal.',
      winText: '🎉 Angles measured and wave tuned — signal clear!',
      phases: [
        { kind: 'lesson', subject: 'Math', title: 'Measuring Angles with a Protractor', blocks: [
          { h: 'What is an angle?', p: 'An angle is formed where two rays meet at a point called the vertex. We measure angles in degrees (°).', example: 'A corner is a 90° angle (a right angle).' },
          { h: 'Types of angles', p: 'Acute < 90°, right = 90°, obtuse > 90° and < 180°, straight = 180°. The size tells how wide the angle opens.', tip: 'Acute small, right square, obtuse wide.' },
          { h: 'The protractor', p: 'A protractor is a tool that measures angles from 0° to 180°. It has a center point and two scales (inner/outer).', diagram: '<div class="sg-energy-forms"><span>📐 Protractor</span><span>📌 Vertex</span><span>0°–180°</span><span>🔺 Acute</span><span>🔵 Obtuse</span></div>' },
          { h: 'How to measure', p: 'Place the protractor’s center on the vertex. Line up one ray with 0°. Read where the other ray crosses the scale.', example: 'Ray at 0°, other ray at 40° → 40° angle.' },
          { h: 'Pick the right scale', p: 'Use the scale that starts at 0° on your first ray. Reading the wrong scale gives 180° minus the real angle.', tip: 'Start at 0° on your ray; follow that scale.' },
          { h: 'Estimate first', p: 'Estimate before measuring: does it look acute (<90) or obtuse (>90)? This catches wrong-scale errors.', example: 'A wide angle can’t be 30° — check the scale.' },
          { h: 'Why it matters', p: 'Measuring angles is used in building, art, sports, and navigation. Accuracy starts with the right steps.', tip: 'Center on vertex, ray to 0°, read other ray.' }
        ] },
        { kind: 'drill', subject: 'Math', title: 'Order the Protractor Steps (Drag)', engine: 'dragSort', items: [
          { text: 'Place the protractor center on the vertex', order: 0 }, { text: 'Line up one ray with 0°', order: 1 },
          { text: 'Read where the other ray points', order: 2 }, { text: 'Record the degrees', order: 3 }
        ] },
        { kind: 'lesson', subject: 'Science', title: 'Waves: Amplitude, Wavelength & Sound', blocks: [
          { h: 'What is a wave?', p: 'A wave is a repeating disturbance that carries energy. Sound and light both travel as waves.', example: 'A ripple on water is a wave.' },
          { h: 'Amplitude', p: 'Amplitude is the height of a wave from its rest position. In sound, bigger amplitude = louder; in light, brighter.', tip: 'Tall wave = more energy.' },
          { h: 'Wavelength', p: 'Wavelength is the distance between one point on a wave and the same point on the next (e.g., crest to crest).', diagram: '<div class="sg-flow"><span class="sg-flow-in">Wave</span><span class="sg-flow-arrow">→</span><span class="sg-flow-box">Amplitude = height</span><span class="sg-flow-arrow">+</span><span class="sg-flow-out">Wavelength = length</span></div>' },
          { h: 'Frequency & pitch', p: 'Frequency is how many waves pass per second. In sound, higher frequency = higher pitch; lower = lower pitch.', example: 'A whistle = high pitch (high frequency).' },
          { h: 'Sound waves need a medium', p: 'Sound travels through solids, liquids, and gases by vibrating particles — but not through empty space (a vacuum).', tip: 'No air in space = no sound in space.' },
          { h: 'Light vs sound', p: 'Light can travel through empty space (it doesn’t need a medium) and is much faster than sound. That’s why lightning precedes thunder.', example: 'See lightning before hearing thunder.' },
          { h: 'Why it matters', p: 'Understanding waves explains sound, light, music, and communication technologies like phones.', tip: 'Amplitude = loud/bright; wavelength/frequency = pitch/color.' }
        ] },
        { kind: 'practice', subject: 'Science', title: 'Fill the Wave (Cloze)', mode: 'cloze', text: 'A wave carries * . Its height is the * , which makes sound louder. The distance crest-to-crest is the * . Sound cannot travel through a * .', blanks: [
          { options: ['energy', 'water', 'color'], a: 0 }, { options: ['amplitude', 'wavelength', 'pitch'], a: 0 },
          { options: ['amplitude', 'wavelength', 'frequency'], a: 1 }, { options: ['vacuum', 'solid', 'liquid'], a: 0 }
        ] },
        { kind: 'activity', title: 'Angles & Waves', stages: [
          { type: 'quiz', subject: 'Math · Angle type', story: 'A 120° angle is…', prompt: 'A 120° angle is…', options: ['Obtuse', 'Acute', 'Right'], a: 0, okMsg: 'Obtuse (>90°)! Dial 1 tuned.' },
          { type: 'match', subject: 'Science · Waves', story: 'Match each term to its meaning.', pairs: [ ['Amplitude','Wave height / loudness'], ['Wavelength','Crest-to-crest distance'], ['Frequency','Waves per second / pitch'], ['Vacuum','Sound cannot travel here'] ] },
          { type: 'input', subject: 'Math · Measure', story: 'Right angle = ? degrees.', prompt: 'A right angle = ?°', accept: ['90', '90°', '90 degrees'], okMsg: '90° — right angle! Dial 3 tuned.' },
          { type: 'fillBlank', subject: 'Science · Sound', story: 'Finish the wave facts to lock the signal.', sentence: 'Sound travels through solids, liquids, and * , but not through a * .', blanks: ['gases', 'vacuum'] }
        ] }
      ]
    } },

    '6-1': { type: 'mission', content: {
      title: 'Sources & Suffrage',
      intro: 'Tell the sources apart and stand for rights. Learn primary/secondary sources and women’s rights/Seneca Falls, then cast the vote.',
      winText: '🎉 Sources sorted and votes cast — suffrage won!',
      phases: [
        { kind: 'lesson', subject: 'ELA', title: 'Primary vs Secondary Sources', blocks: [
          { h: 'What is a source?', p: 'A source is where information comes from. Historians and researchers sort sources into primary and secondary.', example: 'A diary and a textbook are both sources.' },
          { h: 'Primary sources', p: 'A primary source is a firsthand account from the time: diaries, letters, photos, speeches, interviews, original artifacts.', tip: 'Primary = was there, from the time.' },
          { h: 'Secondary sources', p: 'A secondary source is built from primary sources by someone later: textbooks, biographies, articles, documentaries.', example: 'A biography uses letters (primary) to retell a life.' },
          { h: 'Compare them', p: 'Primary gives direct evidence but may be biased or partial. Secondary interprets and summarizes but is once-removed.', diagram: '<div class="sg-energy-forms"><span>✉️ Primary</span><span>📷 Photo</span><span>📔 Diary</span><span>📖 Secondary</span><span>📰 Article</span></div>' },
          { h: 'Why use both', p: 'Researchers use primary sources for evidence and secondary sources for context and others’ interpretations.', tip: 'Primary = evidence; secondary = interpretation.' },
          { h: 'Evaluate reliability', p: 'Ask who made it, when, and why. A source close to the event by an eyewitness is usually strong primary evidence.', example: 'Check author, date, and purpose.' },
          { h: 'Why it matters', p: 'Telling sources apart is core to research and history. It decides what counts as solid evidence.', tip: 'Primary = firsthand; secondary = later retelling.' }
        ] },
        { kind: 'drill', subject: 'ELA', title: 'Spot the Lie (Sources)', engine: 'twoTruths', statements: [
          { t: 'A diary is a primary source', a: true }, { t: 'A textbook is a secondary source', a: true }, { t: 'A secondary source is a firsthand account', a: false }
        ] },
        { kind: 'lesson', subject: 'Social Studies', title: "Women's Rights & Seneca Falls", blocks: [
          { h: 'Before the movement', p: 'In the 1800s, women in the US could not vote and faced limits on property, jobs, and education. Reformers organized to change this.', example: 'Married women often couldn’t own property.' },
          { h: 'Seneca Falls Convention (1848)', p: 'In 1848, the Seneca Falls Convention in New York was the first women’s rights convention. It issued a Declaration of Sentiments demanding equality.', tip: 'Seneca Falls, NY, 1848 = first women’s rights convention.' },
          { h: 'Key leaders', p: 'Elizabeth Cady Stanton and Lucretia Mott organized Seneca Falls. Sojourner Truth and others spoke for equality across race and gender.', diagram: '<div class="sg-energy-forms"><span>📜 Declaration</span><span>✊ Stanton</span><span>🗣️ Truth</span><span>🗽 Seneca Falls</span><span>🗳️ Suffrage</span></div>' },
          { h: 'Declaration of Sentiments', p: 'Modeled on the Declaration of Independence, it declared men AND women are created equal and demanded the right to vote.', example: 'It listed grievances against women’s inequality.' },
          { h: 'A long fight', p: 'Suffrage (the right to vote) took decades. Women finally won national voting rights in 1920 with the 19th Amendment.', tip: '1848 convention → 1920 victory (19th Amendment).' },
          { h: 'NY’s role', p: 'New York was central: Seneca Falls, Rochester (Susan B. Anthony’s home), and many activists. NY later became a leader in reform.', example: 'Susan B. Anthony lived in Rochester, NY.' },
          { h: 'Why it matters', p: 'The women’s rights movement expanded democracy. Seneca Falls is a landmark of organized protest for equality.', tip: 'Seneca Falls 1848 → 19th Amendment 1920.' }
        ] },
        { kind: 'practice', subject: 'Social Studies', title: 'Suffrage Timeline', mode: 'timeline', eras: ['1848', '1800s fight', '1920'], events: [
          { text: 'Seneca Falls Convention held', era: 0 }, { text: 'Stanton, Anthony, Truth campaign for suffrage', era: 1 },
          { text: 'Women win the vote', era: 1 }, { text: '19th Amendment passes', era: 2 }
        ] },
        { kind: 'activity', title: 'Sources & Suffrage', stages: [
          { type: 'quiz', subject: 'ELA · Sources', story: 'A letter written during the event is a…', prompt: 'A letter written during the event is a…', options: ['Primary source', 'Secondary source', 'Not a source'], a: 0, okMsg: 'Primary — firsthand! Ballot 1 cast.' },
          { type: 'match', subject: 'ELA + SS · Terms', story: 'Match each term to its meaning.', pairs: [ ['Primary source','Firsthand account'], ['Secondary source','Later retelling'], ['Seneca Falls','First women’s rights convention'], ['Suffrage','The right to vote'] ] },
          { type: 'input', subject: 'SS · Year', story: 'Seneca Falls Convention year.', prompt: 'Seneca Falls was held in (year):', accept: ['1848'], okMsg: '1848! Ballot 3 cast.' },
          { type: 'dragSort', subject: 'SS · Suffrage path', story: 'Order the path to women’s voting rights.', items: [ {text:'Seneca Falls Convention, 1848', order:0}, {text:'Decades of campaigning', order:1}, {text:'More states grant voting rights', order:2}, {text:'19th Amendment, 1920', order:3} ] }
        ] }
      ]
    } },

    '6-2': { type: 'mission', content: {
      title: 'Add Angles & Take Notes',
      intro: 'Add the angles and sort the facts. Learn additive/unknown angles and research note-taking, then file the report.',
      winText: '🎉 Angles added and notes filed — report complete!',
      phases: [
        { kind: 'lesson', subject: 'Math', title: 'Additive & Unknown Angles', blocks: [
          { h: 'Angles add', p: 'When angles share a vertex and fill a space, their measures add. Two angles that form a right angle sum to 90°.', example: '30° + 60° = 90° (a right angle).' },
          { h: 'Additive angle', p: 'If a larger angle is split into parts, the whole equals the sum of the parts: whole = part1 + part2.', tip: 'Whole angle = sum of its parts.' },
          { h: 'Find an unknown angle', p: 'To find a missing angle, subtract the known part from the whole. If 110° = 40° + x, then x = 110 − 40 = 70°.', diagram: '<div class="sg-flow"><span class="sg-flow-in">110° = 40° + x</span><span class="sg-flow-arrow">→</span><span class="sg-flow-box">x = 110 − 40</span><span class="sg-flow-arrow">→</span><span class="sg-flow-out">x = 70°</span></div>' },
          { h: 'On a straight line', p: 'Angles on a straight line sum to 180°. If one is 70°, the other is 180 − 70 = 110°.', example: 'Straight line → parts add to 180°.' },
          { h: 'Around a point', p: 'Angles around a single point sum to 360°. Use this to find missing angles around a vertex.', tip: 'Around a point → 360°.' },
          { h: 'Check with addition', p: 'After solving, add the parts back to confirm they equal the whole. 40 + 70 = 110 ✓.', example: 'Always verify by re-adding.' },
          { h: 'Why it matters', p: 'Unknown angles appear in design, navigation, and geometry. Addition and subtraction are the tools.', tip: 'Whole = parts; missing = whole − known.' }
        ] },
        { kind: 'drill', subject: 'Math', title: 'Fill the Unknown Angle', engine: 'fillBlank', sentence: 'Two angles form a straight line (180°). One is 70°, so the other is * °. A 90° angle split into 35° and * °: 90 − 35 = * .', blanks: ['110', '55', '55'] },
        { kind: 'lesson', subject: 'ELA', title: 'Research Note-Taking & Categorizing Facts', blocks: [
          { h: 'Why take notes?', p: 'Note-taking records key information so you can learn and write without rereading everything. Good notes are short and organized.', example: 'Notes capture facts, not full sentences.' },
          { h: 'In your own words', p: 'Paraphrase — write facts in your own words to prove understanding and avoid copying. Quote only exact, important phrases.', tip: 'Paraphrase; quote rarely.' },
          { h: 'Record the source', p: 'Always note where each fact came from (title, author, page, URL). This lets you cite and check it later.', diagram: '<div class="sg-energy-forms"><span>✍️ Paraphrase</span><span>🗂️ Categorize</span><span>🔗 Source</span><span>⭐ Key facts</span><span>🚫 No copying</span></div>' },
          { h: 'Categorize facts', p: 'Group related facts under headings (e.g., “Early life,” “Achievements”). Categorizing organizes notes for writing.', tip: 'Sort facts into topic groups.' },
          { h: 'Pick what matters', p: 'Choose facts that support your topic or question. Skip trivia that doesn’t fit. Relevant notes make strong writing.', example: 'Keep facts tied to your research question.' },
          { h: 'Use a graphic organizer', p: 'A chart, web, or outline helps sort facts as you gather them. Organizers make the move to writing smoother.', tip: 'Organizer → easier writing.' },
          { h: 'Why it matters', p: 'Good note-taking builds research skills used in every subject — science, history, and reports.', tip: 'Paraphrase, cite, categorize, keep relevant.' }
        ] },
        { kind: 'practice', subject: 'ELA', title: 'Sort the Facts (Categorize)', mode: 'categorize', bins: ['Source info', 'Key fact', 'Own-words note'], items: [
          { text: '“Page 14, Smith 2021”', bin: 0 }, { text: '“Seneca Falls was in 1848”', bin: 1 }, { text: '“Convention demanded equality”', bin: 2 }, { text: '“URL: history.org/sf”', bin: 0 }, { text: '“Stanton led the convention”', bin: 2 }, { text: '“19th Amendment, 1920”', bin: 1 }
        ] },
        { kind: 'activity', title: 'Add Angles & Take Notes', stages: [
          { type: 'twoTruths', subject: 'Math · Angles', story: 'One statement is FALSE. Tap the lie to open the file.', statements: [ {t:'Angles on a straight line sum to 180°', a:true}, {t:'A missing angle = whole − known part', a:true}, {t:'Angles around a point sum to 90°', a:false} ] },
          { type: 'match', subject: 'Math + ELA · Terms', story: 'Match each term to its meaning.', pairs: [ ['Additive angles','Parts sum to the whole'], ['Unknown angle','Found by subtracting'], ['Paraphrase','Write in your own words'], ['Categorize','Group related facts'] ] },
          { type: 'input', subject: 'Math · Unknown', story: '110° = 40° + x. x = ?°', prompt: '110° = 40° + x. x = ?°', accept: ['70', '70°'], okMsg: '70° — subtracted the part! File 3 saved.' },
          { type: 'dragSort', subject: 'ELA · Note steps', story: 'Order the research note-taking steps.', items: [ {text:'Read the source', order:0}, {text:'Paraphrase the key facts', order:1}, {text:'Record the source info', order:2}, {text:'Categorize facts under headings', order:3} ] }
        ] }
      ]
    } },

    '6-3': { type: 'mission', content: {
      title: 'Signals & Ellis Island',
      intro: 'Trace the dolphin signal and decode the immigrant story. Learn dolphin/wave communication and immigration/Ellis Island, then crack the code.',
      winText: '🎉 Signal traced and code cracked — welcome to America!',
      phases: [
        { kind: 'lesson', subject: 'Science', title: 'How Dolphins & Waves Communicate', blocks: [
          { h: 'Animals communicate', p: 'Many animals communicate using signals. Dolphins use sound, bees dance, and birds call. Signals carry information.', example: 'A bee’s waggle dance tells where flowers are.' },
          { h: 'Dolphins use sound', p: 'Dolphins communicate with clicks, whistles, and squeaks — sound waves. Each dolphin has a “signature whistle” like a name.', tip: 'Dolphins “talk” with sound waves.' },
          { h: 'Echolocation', p: 'Dolphins and bats use echolocation: they send out sound waves that bounce off objects, revealing location and shape from the echo.', diagram: '<div class="sg-flow"><span class="sg-flow-in">🔊 Sound</span><span class="sg-flow-arrow">→</span><span class="sg-flow-box">🪞 Bounce</span><span class="sg-flow-arrow">→</span><span class="sg-flow-out">👂 Echo</span></div>' },
          { h: 'Sound carries info', p: 'Sound waves carry information such as danger, food, or identity. Pitch and pattern change the message.', example: 'A high whistle can mean “here I am.”' },
          { h: 'Waves in tech', p: 'People use waves to communicate too — radios, phones, and Wi-Fi use electromagnetic waves to carry signals.', tip: 'Humans mimic wave communication with devices.' },
          { h: 'Why sound underwater', p: 'Sound travels faster and farther in water than air, making it ideal for dolphins. Light fades fast underwater.', example: 'Whales can hear each other across oceans.' },
          { h: 'Why it matters', p: 'Studying animal signals inspires human tech and reveals how information travels through waves.', tip: 'Sound waves carry signals; dolphins echo-locate.' }
        ] },
        { kind: 'drill', subject: 'Science', title: 'Signal Maze', engine: 'maze', rows: 5, cols: 5, start: 20, goal: 4, walls: [1, 6, 13, 16, 18, 23], prompt: 'Tap a next cell to route the dolphin’s signal from ▶ to ★.' },
        { kind: 'lesson', subject: 'Social Studies', title: 'Immigration Through Ellis Island', blocks: [
          { h: 'What is immigration?', p: 'Immigration is moving to a new country to live. In the late 1800s–early 1900s, millions came to the US, many through New York.', example: 'People left Europe and Asia for new lives in America.' },
          { h: 'Push and pull factors', p: 'Push factors drive people away (poverty, war, persecution). Pull factors draw them in (jobs, freedom, family).', tip: 'Push = leave; pull = come.' },
          { h: 'Ellis Island', p: 'Ellis Island, in New York Harbor, was the main immigration station (1892–1954). Over 12 million people were processed there.', diagram: '<div class="sg-energy-forms"><span>🗽 Ellis Island</span><span>🚢 Arrival</span><span>📋 Processing</span><span>🆓 Freedom</span><span>🏠 New life</span></div>' },
          { h: 'The processing', p: 'At Ellis Island, immigrants had medical and legal checks. Most were admitted quickly; some were detained or sent back.', example: 'A quick health exam decided entry.' },
          { h: 'A new life in NY', p: 'Many immigrants settled in NYC neighborhoods, working in factories and building diverse communities. NY became a cultural mosaic.', tip: 'Immigrants shaped NYC’s culture.' },
          { h: 'Challenges', p: 'Immigrants faced hard work, language barriers, and prejudice, but also opportunity and freedom for their families.', example: 'Crowded tenements; but chances for jobs.' },
          { h: 'Why it matters', p: 'Immigration through Ellis Island shaped America’s population and culture. It’s a core story of NY and the US.', tip: 'Ellis Island = gateway for millions.' }
        ] },
        { kind: 'practice', subject: 'Social Studies', title: 'Crack the Code (Crypto Hack)', engine: 'cryptoHack', hidden: 'ELLIS ISLAND', clues: [
          { prompt: 'Moving to a new country to live is called…', options: ['immigration', 'vacation', 'trade'], a: 0, show: [0, 1, 2, 3, 4] },
          { prompt: 'The main NY immigration station was on ___ Island.', options: ['Ellis', 'Staten', 'Long'], a: 0, show: [6, 7, 8] },
          { prompt: 'A reason to LEAVE your country is a ___ factor.', options: ['push', 'pull', 'luck'], a: 0, show: [9, 10, 11] },
          { prompt: 'Ellis Island is in which state?', options: ['New York', 'Texas', 'Florida'], a: 0, show: [5] }
        ] },
        { kind: 'activity', title: 'Signals & Ellis Island', stages: [
          { type: 'quiz', subject: 'Science · Dolphins', story: 'Dolphins communicate using…', prompt: 'Dolphins communicate using…', options: ['Sound waves', 'Light waves', 'Smell'], a: 0, okMsg: 'Sound waves — clicks & whistles! Code 1.' },
          { type: 'venn', subject: 'SS · Factors', story: 'Sort each trait into Push, Pull, both, or neither.', left: 'Push factor', right: 'Pull factor', items: [ {text:'A reason to leave home', set:0}, {text:'A reason to come to the US', set:1}, {text:'Can involve jobs, war, or freedom', set:2}, {text:'A vacation trip', set:3} ] },
          { type: 'input', subject: 'SS · Station', story: 'The main NY immigration station: ___ Island.', prompt: '___ Island (NY immigration station):', accept: ['ellis'], okMsg: 'Ellis Island! Code 3.' },
          { type: 'numberLine', subject: 'Science · Underwater', story: 'Sound reaches 3/4 of the bay — tap 3/4.', prompt: 'Tap 3/4 (how far the signal reached):', marks: [ {l:'0'},{l:'1/4'},{l:'1/2'},{l:'3/4'},{l:'1'} ], a: 3 }
        ] }
      ]
    } },

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
      // unlock the next day's card after the celebration
      setTimeout(function () { unlockNext(dayKey); }, 1400);
    } else {
      // replay win — light feedback only
      sound.play('correct'); SG.praise.show('correct'); if (ringSvg) SG.ring.set(ringSvg, 100);
    }
  }

  function unlockNext(dayKey) {
    var parts = dayKey.split('-'), w = +parts[0], d = +parts[1];
    var nw = w, nd = d + 1;
    if (nd >= (SG.SCHEDULE[w] || []).length) { nw = w + 1; nd = 0; }
    if (nw >= SG.SCHEDULE.length) return;
    var nextKey = nw + '-' + nd;
    var old = document.querySelector(".day-game-card[data-day='" + nextKey + "']");
    if (!old) return;
    var fresh = buildDayCard(nw, nd);
    old.parentNode.replaceChild(fresh, old);
    revealObserve(fresh.parentNode);
    // gentle nudge: scroll the newly unlocked card into view
    setTimeout(function () { fresh.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 120);
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

  // 8a. TRUE/FALSE (sequential statements; distinct from MCQ)
  function renderTrueFalse(stage, c, ctx) {
    var qs = c.statements, i = 0, score = 0, answered = false;
    var scoreEl = el('div', 'sg-quiz-score', 'Score: 0 / ' + qs.length);
    var prog = el('div', 'sg-quiz-prog');
    var qEl = el('div', 'sg-quiz-q');
    var opts = el('div', 'sg-quiz-opts row tf');
    var nextWrap = el('div', 'sg-quiz-controls');
    var nextBtn = el('button', 'sg-btn', 'Next ›'); nextBtn.style.display = 'none'; nextWrap.appendChild(nextBtn);
    stage.appendChild(scoreEl); stage.appendChild(prog); stage.appendChild(qEl); stage.appendChild(opts); stage.appendChild(nextWrap);
    function render() {
      answered = false; prog.textContent = 'Statement ' + (i + 1) + ' of ' + qs.length; qEl.textContent = qs[i].t; opts.innerHTML = '';
      [true, false].forEach(function (val) {
        var b = el('button', 'sg-tf-opt'); b.innerHTML = '<span class="txt">' + esc(val ? 'True' : 'False') + '</span><span class="ic"></span>';
        b.addEventListener('click', function () { select(val, b); });
        opts.appendChild(b);
      });
      nextBtn.style.display = 'none';
    }
    function select(val, btn) {
      if (answered) return; answered = true;
      var correct = val === qs[i].a;
      if (correct) { btn.classList.add('correct'); btn.querySelector('.ic').textContent = '✓'; score++; scoreEl.textContent = 'Score: ' + score + ' / ' + qs.length; sound.play('correct'); SG.praise.show('correct'); }
      else {
        btn.classList.add('incorrect'); btn.querySelector('.ic').textContent = '✗';
        var other = btn === opts.children[0] ? opts.children[1] : opts.children[0];
        other.classList.add('correct'); other.querySelector('.ic').textContent = '✓';
        sound.play('wrong'); SG.mascot.setMood('think');
      }
      Array.prototype.forEach.call(opts.children, function (x) { x.classList.add('disabled'); });
      ctx.setRing(ringPctOf(i + 1, qs.length));
      nextBtn.style.display = '';
    }
    nextBtn.addEventListener('click', function () { sound.play('click'); i++; if (i < qs.length) render(); else { qEl.textContent = 'Done! ' + score + ' / ' + qs.length + ' correct 🎉'; opts.innerHTML = ''; nextBtn.style.display = 'none'; prog.textContent = ''; ctx.onWin(); } });
    render();
  }

  // 8b. SCRAMBLE (tap word tiles to rebuild a sentence)
  function renderScramble(stage, c, ctx) {
    var correct = c.words.slice();
    var placed = new Array(correct.length).fill(null);
    var slots = [], poolTiles = [];
    var board = el('div', 'sg-scram');
    var slotRow = el('div', 'sg-scram-slots');
    correct.forEach(function (w, s) {
      var sl = el('div', 'sg-scram-slot');
      sl.addEventListener('click', function () {
        if (!placed[s]) return;
        var rw = placed[s]; placed[s] = null; sl.textContent = ''; sl.classList.remove('filled', 'wrong');
        poolTiles.forEach(function (t) { if (t.dataset.w === rw && t.classList.contains('used')) t.classList.remove('used'); });
        sound.play('click');
      });
      slotRow.appendChild(sl); slots.push(sl);
    });
    var pool = el('div', 'sg-scram-pool');
    shuffle(correct).forEach(function (w) {
      var t = el('span', 'sg-scram-word', esc(w)); t.dataset.w = w;
      t.addEventListener('click', function () {
        if (t.classList.contains('used')) return;
        var empty = placed.indexOf(null); if (empty < 0) return;
        placed[empty] = w; slots[empty].textContent = w; slots[empty].classList.add('filled'); slots[empty].classList.remove('wrong'); t.classList.add('used'); sound.play('click');
      });
      pool.appendChild(t); poolTiles.push(t);
    });
    var ctrl = el('div', 'sg-fb-controls'); var checkBtn = el('button', 'sg-btn', 'Check'); var status = el('div', 'game-status'); ctrl.appendChild(checkBtn);
    board.appendChild(slotRow); board.appendChild(pool); board.appendChild(ctrl); board.appendChild(status);
    stage.appendChild(board);
    checkBtn.addEventListener('click', function () {
      sound.play('click'); var ok = 0;
      slots.forEach(function (sl, i) { sl.classList.remove('wrong'); if (placed[i] === correct[i]) { sl.classList.add('filled'); ok++; } else { sl.classList.add('wrong'); } });
      if (ok === correct.length) { status.textContent = 'Sentence rebuilt! 🎉'; status.className = 'game-status ok'; ctx.setRing(100); ctx.onWin(); }
      else { status.textContent = ok + ' of ' + correct.length + ' in the right place — try again!'; status.className = 'game-status no'; sound.play('wrong'); SG.praise.show('wrong'); SG.mascot.setMood('think'); }
    });
  }

  // 8c. TIMELINE (tap event, then tap the era slot it belongs in)
  function renderTimeline(stage, c, ctx) {
    var eras = c.eras, events = c.events, placed = 0, sel = null;
    var wrap = el('div', 'sg-tl');
    var track = el('div', 'sg-tl-track');
    eras.forEach(function (label, ei) {
      var slot = el('div', 'sg-tl-slot');
      slot.appendChild(el('div', 'sg-tl-era', esc(label)));
      var drop = el('div', 'sg-tl-drop'); slot.appendChild(drop);
      slot.addEventListener('click', function () {
        if (!sel) return;
        var card = sel, ev = events[+card.dataset.i];
        if (ev.era === ei) {
          drop.appendChild(card); card.classList.add('placed'); card.classList.remove('sel'); sound.play('correct'); SG.praise.show('correct');
          placed++; ctx.setRing(ringPctOf(placed, events.length)); sel = null;
          if (placed === events.length) ctx.onWin();
        } else { card.classList.add('shake'); setTimeout(function () { card.classList.remove('shake'); }, 400); sound.play('wrong'); SG.praise.show('wrong'); SG.mascot.setMood('think'); }
      });
      track.appendChild(slot);
    });
    var pool = el('div', 'sg-tl-pool');
    shuffle(events.map(function (e, i) { return { e: e, i: i }; })).forEach(function (o) {
      var card = el('div', 'sg-tl-card', esc(o.e.text)); card.dataset.i = o.i;
      card.addEventListener('click', function () {
        if (card.classList.contains('placed')) return;
        if (sel) sel.classList.remove('sel');
        sel = card; card.classList.add('sel'); sound.play('click');
      });
      pool.appendChild(card);
    });
    wrap.appendChild(track); wrap.appendChild(pool); stage.appendChild(wrap);
  }

  // 8d. CATEGORIZE (tap item, then tap the bin it belongs in)
  function renderCategorize(stage, c, ctx) {
    var bins = c.bins, items = c.items, placed = 0, sel = null;
    var wrap = el('div', 'sg-cat');
    var binRow = el('div', 'sg-cat-bins');
    bins.forEach(function (label, bi) {
      var bin = el('div', 'sg-cat-bin');
      bin.appendChild(el('div', 'sg-cat-bin-head', esc(label)));
      var body = el('div', 'sg-cat-bin-body'); bin.appendChild(body);
      bin.addEventListener('click', function () {
        if (!sel) return;
        var card = sel, it = items[+card.dataset.i];
        if (it.bin === bi) {
          body.appendChild(card); card.classList.add('placed'); card.classList.remove('sel'); sound.play('correct'); SG.praise.show('correct');
          placed++; ctx.setRing(ringPctOf(placed, items.length)); sel = null;
          if (placed === items.length) ctx.onWin();
        } else { card.classList.add('shake'); setTimeout(function () { card.classList.remove('shake'); }, 400); sound.play('wrong'); SG.praise.show('wrong'); SG.mascot.setMood('think'); }
      });
      binRow.appendChild(bin);
    });
    var pool = el('div', 'sg-cat-pool');
    shuffle(items.map(function (it, i) { return { it: it, i: i }; })).forEach(function (o) {
      var card = el('div', 'sg-cat-card', esc(o.it.text)); card.dataset.i = o.i;
      card.addEventListener('click', function () {
        if (card.classList.contains('placed')) return;
        if (sel) sel.classList.remove('sel');
        sel = card; card.classList.add('sel'); sound.play('click');
      });
      pool.appendChild(card);
    });
    wrap.appendChild(binRow); wrap.appendChild(pool); stage.appendChild(wrap);
  }

  // 8e. TWO TRUTHS & A LIE (tap the false statement)
  function renderTwoTruths(stage, c, ctx) {
    var stmts = c.statements, solved = false;
    var wrap = el('div', 'sg-ttl');
    wrap.appendChild(el('div', 'sg-ttl-prompt', 'One statement is FALSE. Tap the lie.'));
    var grid = el('div', 'sg-ttl-grid');
    stmts.forEach(function (s) {
      var b = el('button', 'sg-ttl-item'); b.innerHTML = '<span class="ic"></span><span class="txt">' + esc(s.t) + '</span>';
      b.addEventListener('click', function () {
        if (solved) return;
        if (!s.a) {
          b.classList.add('correct'); b.querySelector('.ic').textContent = '✓'; solved = true;
          sound.play('correct'); SG.praise.show('correct'); ctx.setRing(100); ctx.onWin();
          Array.prototype.forEach.call(grid.children, function (x) { x.classList.add('disabled'); });
        } else {
          b.classList.add('incorrect'); b.querySelector('.ic').textContent = '✗'; b.classList.add('shake');
          setTimeout(function () { if (solved) return; b.classList.remove('incorrect', 'shake'); b.querySelector('.ic').textContent = ''; }, 650);
          sound.play('wrong'); SG.praise.show('wrong'); SG.mascot.setMood('think');
        }
      });
      grid.appendChild(b);
    });
    wrap.appendChild(grid); stage.appendChild(wrap);
  }

  // 8f. LABEL THE DIAGRAM (tap a label, then tap the matching slot/hotspot)
  function renderLabelDiagram(stage, c, ctx) {
    var slots = c.slots, labels = c.labels, placed = 0, sel = null;
    var wrap = el('div', 'sg-label');
    var dia = el('div', 'sg-label-diagram');
    slots.forEach(function (sl, si) {
      (function (si) {
        var box = el('div', 'sg-label-slot');
        box.innerHTML = '<span class="sg-label-hint">' + esc(sl.hint) + '</span><span class="sg-label-tag"></span>';
        box.addEventListener('click', function () {
          if (!sel) return;
          var lab = sel, item = labels[+lab.dataset.i];
          if (item.slot === si) {
            box.classList.add('filled'); box.querySelector('.sg-label-tag').textContent = item.label;
            lab.classList.add('placed'); lab.classList.remove('sel'); sound.play('correct'); SG.praise.show('correct');
            placed++; ctx.setRing(ringPctOf(placed, labels.length)); sel = null;
            if (placed === labels.length) ctx.onWin();
          } else { lab.classList.add('shake'); setTimeout(function () { lab.classList.remove('shake'); }, 400); sound.play('wrong'); SG.praise.show('wrong'); SG.mascot.setMood('think'); }
        });
        dia.appendChild(box);
      })(si);
    });
    var pool = el('div', 'sg-label-pool');
    shuffle(labels.map(function (l, i) { return { l: l, i: i }; })).forEach(function (o) {
      var chip = el('span', 'sg-label-chip', esc(o.l.label)); chip.dataset.i = o.i;
      chip.addEventListener('click', function () {
        if (chip.classList.contains('placed')) return;
        if (sel) sel.classList.remove('sel');
        sel = chip; chip.classList.add('sel'); sound.play('click');
      });
      pool.appendChild(chip);
    });
    wrap.appendChild(dia); wrap.appendChild(pool); stage.appendChild(wrap);
  }

  // 8g. VENN DIAGRAM SORT (tap item, then tap left-only / both / right-only / neither)
  function renderVenn(stage, c, ctx) {
    var left = c.left, right = c.right, items = c.items, placed = 0, sel = null;
    var wrap = el('div', 'sg-venn');
    var dia = el('div', 'sg-venn-diagram');
    dia.innerHTML = '<div class="sg-venn-circ left"></div><div class="sg-venn-circ right"></div>' +
      '<div class="sg-venn-lab left">' + esc(left) + '</div><div class="sg-venn-lab right">' + esc(right) + '</div>';
    var regions = {};
    function makeRegion(cls, set, label) {
      var r = el('div', 'sg-venn-region ' + cls);
      r.innerHTML = '<span class="sg-venn-rlabel">' + esc(label) + '</span><div class="sg-venn-drop"></div>';
      r.addEventListener('click', function () {
        if (!sel) return;
        var card = sel, it = items[+card.dataset.i];
        if (it.set === set) {
          r.querySelector('.sg-venn-drop').appendChild(card); card.classList.add('placed'); card.classList.remove('sel');
          sound.play('correct'); SG.praise.show('correct'); placed++; ctx.setRing(ringPctOf(placed, items.length)); sel = null;
          if (placed === items.length) ctx.onWin();
        } else { card.classList.add('shake'); setTimeout(function () { card.classList.remove('shake'); }, 400); sound.play('wrong'); SG.praise.show('wrong'); SG.mascot.setMood('think'); }
      });
      return r;
    }
    var rL = makeRegion('rleft', 0, left + ' only');
    var rBoth = makeRegion('rboth', 2, 'Both');
    var rR = makeRegion('rright', 1, right + ' only');
    dia.appendChild(rL); dia.appendChild(rBoth); dia.appendChild(rR);
    var neither = makeRegion('neither', 3, 'Neither');
    wrap.appendChild(dia); wrap.appendChild(neither);
    var pool = el('div', 'sg-venn-pool');
    shuffle(items.map(function (it, i) { return { it: it, i: i }; })).forEach(function (o) {
      var card = el('div', 'sg-venn-card', esc(o.it.text)); card.dataset.i = o.i;
      card.addEventListener('click', function () {
        if (card.classList.contains('placed')) return;
        if (sel) sel.classList.remove('sel');
        sel = card; card.classList.add('sel'); sound.play('click');
      });
      pool.appendChild(card);
    });
    wrap.appendChild(pool); stage.appendChild(wrap);
  }

  // 8h. NUMBER LINE (tap the correct dot; supports single or multi-question)
  function renderNumberLine(stage, c, ctx) {
    var qs = c.questions ? c.questions : [{ prompt: c.prompt, marks: c.marks, a: c.a }];
    var qi = 0, wrap = el('div', 'sg-nl');
    function renderQ() {
      wrap.innerHTML = '';
      var q = qs[qi];
      wrap.appendChild(el('div', 'sg-nl-prompt', esc(q.prompt)));
      var line = el('div', 'sg-nl-line');
      q.marks.forEach(function (m, mi) {
        (function (mi) {
          var dot = el('button', 'sg-nl-dot');
          dot.innerHTML = '<span class="sg-nl-peg"></span><span class="sg-nl-lab">' + esc(m.l) + '</span>';
          dot.addEventListener('click', function () {
            if (dot.classList.contains('locked')) return;
            if (mi === q.a) {
              dot.classList.add('correct'); sound.play('correct'); SG.praise.show('correct');
              Array.prototype.forEach.call(line.querySelectorAll('.sg-nl-dot'), function (d) { d.classList.add('locked'); });
              qi++;
              ctx.setRing(ringPctOf(qi, qs.length));
              if (qi >= qs.length) { ctx.onWin(); }
              else { setTimeout(function () { sound.play('click'); renderQ(); }, 600); }
            } else {
              dot.classList.add('shake'); sound.play('wrong'); SG.praise.show('wrong'); SG.mascot.setMood('think');
              setTimeout(function () { dot.classList.remove('shake'); }, 400);
            }
          });
          line.appendChild(dot);
        })(mi);
      });
      wrap.appendChild(line); stage.appendChild(wrap);
    }
    renderQ();
  }

  // 8i. HIGHER / LOWER (reveal a card, guess if next is higher or lower; survive the chain)
  function renderHigherLower(stage, c, ctx) {
    var cards = c.cards, i = 0, solved = false;
    var wrap = el('div', 'sg-nl');
    wrap.appendChild(el('div', 'sg-nl-prompt', esc(c.prompt || 'Will the next card be higher or lower?')));
    var stage2 = el('div', 'sg-hl-stage'); wrap.appendChild(stage2);
    var ctrl = el('div', 'sg-hl-ctrl');
    var hi = el('button', 'sg-hl-btn up', '▲ Higher'); var lo = el('button', 'sg-hl-btn down', '▼ Lower');
    ctrl.appendChild(hi); ctrl.appendChild(lo); wrap.appendChild(ctrl); stage.appendChild(wrap);
    function showPair() {
      stage2.innerHTML = '';
      var cur = el('div', 'sg-hl-card cur', esc(cards[i].label));
      var next = el('div', 'sg-hl-card next', i < cards.length - 1 ? '?' : '★');
      stage2.appendChild(cur); stage2.appendChild(el('div', 'sg-hl-vs', 'vs')); stage2.appendChild(next);
      hi.disabled = false; lo.disabled = false;
    }
    function guess(isHigher) {
      if (solved || i >= cards.length - 1) return;
      var ok = isHigher ? (cards[i + 1].val > cards[i].val) : (cards[i + 1].val < cards[i].val);
      if (ok) {
        sound.play('correct'); SG.praise.show('correct');
        var next = stage2.querySelector('.next'); next.textContent = cards[i + 1].label; next.classList.add('reveal');
        i++; ctx.setRing(ringPctOf(i, cards.length - 1));
        if (i >= cards.length - 1) { solved = true; hi.disabled = true; lo.disabled = true; setTimeout(function () { ctx.onWin(); }, 500); }
        else { setTimeout(function () { sound.play('click'); showPair(); }, 700); }
      } else {
        sound.play('wrong'); SG.praise.show('wrong'); SG.mascot.setMood('think');
        var card = stage2.querySelector('.cur'); card.classList.add('shake'); setTimeout(function () { card.classList.remove('shake'); }, 400);
      }
    }
    hi.addEventListener('click', function () { guess(true); });
    lo.addEventListener('click', function () { guess(false); });
    showPair();
  }

  // 8j. FRACTION BAR (tap segments to build a target fraction; single or multi-question)
  function renderFractionBar(stage, c, ctx) {
    var qs = c.questions ? c.questions : [{ prompt: c.prompt, denom: c.denom, target: c.target }];
    var qi = 0, wrap = el('div', 'sg-fb2');
    function renderQ() {
      wrap.innerHTML = '';
      var q = qs[qi];
      wrap.appendChild(el('div', 'sg-fb2-prompt', esc(q.prompt)));
      var bar = el('div', 'sg-fb2-bar');
      var segs = [];
      for (var s = 0; s < q.denom; s++) {
        (function (si) {
          var seg = el('button', 'sg-fb2-seg');
          seg.addEventListener('click', function () {
            if (seg.classList.contains('locked')) return;
            seg.classList.toggle('filled');
            sound.play('click');
            var filled = segs.filter(function (x) { return x.classList.contains('filled'); }).length;
            if (filled === q.target) {
              segs.forEach(function (x) { x.classList.add('locked'); });
              Array.prototype.forEach.call(bar.querySelectorAll('.sg-fb2-seg'), function (x) { if (x.classList.contains('filled')) x.classList.add('correct'); });
              sound.play('correct'); SG.praise.show('correct');
              qi++; ctx.setRing(ringPctOf(qi, qs.length));
              if (qi >= qs.length) { ctx.onWin(); }
              else { setTimeout(function () { sound.play('click'); renderQ(); }, 650); }
            }
          });
          bar.appendChild(seg); segs.push(seg);
        })(s);
      }
      wrap.appendChild(bar); stage.appendChild(wrap);
    }
    renderQ();
  }

  // 8k. CROSSWORD (mini grid; type each clue's answer, letters fill the grid)
  function renderCrossword(stage, c, ctx) {
    var cols = c.cols, rows = c.rows, words = c.words;
    var blocked = {}; c.blocks.forEach(function (i) { blocked[i] = true; });
    var letter = {}; words.forEach(function (w) { w.answer.split('').forEach(function (ch, k) { letter[w.cells[k]] = ch; }); });
    var solved = 0, wrap = el('div', 'sg-cw');
    var grid = el('div', 'sg-cw-grid'); grid.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';
    var cellEls = [];
    for (var i = 0; i < cols * rows; i++) {
      (function (i) {
        if (blocked[i]) { var b = el('div', 'sg-cw-blk'); grid.appendChild(b); cellEls.push(null); return; }
        var cell = el('div', 'sg-cw-cell'); cellEls.push(cell); grid.appendChild(cell);
      })(i);
    }
    wrap.appendChild(grid);
    var clues = el('div', 'sg-cw-clues');
    var across = el('div', 'sg-cw-col'), down = el('div', 'sg-cw-col');
    across.appendChild(el('div', 'sg-cw-head', 'Across')); down.appendChild(el('div', 'sg-cw-head', 'Down'));
    words.forEach(function (w) {
      var row = el('div', 'sg-cw-clue');
      row.appendChild(el('span', 'sg-cw-num', w.num + (w.dir === 'across' ? 'A' : 'D')));
      row.appendChild(el('span', 'sg-cw-txt', esc(w.clue)));
      var inp = el('input', 'sg-cw-inp'); inp.setAttribute('autocomplete', 'off'); inp.size = Math.max(3, w.answer.length);
      var ok = el('span', 'sg-cw-ok');
      inp.addEventListener('input', function () {
        var v = inp.value.toUpperCase().replace(/[^A-Z]/g, '');
        if (v === w.answer.toUpperCase()) {
          inp.disabled = true; inp.classList.add('done'); ok.textContent = '✓'; sound.play('correct'); SG.praise.show('correct');
          w.cells.forEach(function (ci, k) { if (cellEls[ci]) { cellEls[ci].textContent = w.answer[k]; cellEls[ci].classList.add('filled'); } });
          solved++; ctx.setRing(ringPctOf(solved, words.length));
          if (solved === words.length) ctx.onWin();
        }
      });
      row.appendChild(inp); row.appendChild(ok);
      (w.dir === 'across' ? across : down).appendChild(row);
    });
    clues.appendChild(across); clues.appendChild(down); wrap.appendChild(clues); stage.appendChild(wrap);
  }

  // 8l. CLOZE (passage with per-blank drop-down choices)
  function renderCloze(stage, c, ctx) {
    var parts = c.text.split('*'), blanks = c.blanks, done = 0;
    var wrap = el('div', 'sg-cloze');
    var body = el('div', 'sg-cloze-body');
    parts.forEach(function (part, i) {
      body.appendChild(el('span', 'sg-cloze-txt', esc(part)));
      if (i < blanks.length) {
        (function (bi) {
          var sel = el('select', 'sg-cloze-sel');
          sel.appendChild(el('option', '', '— choose —'));
          blanks[bi].options.forEach(function (opt, oi) {
            var o = el('option', '', esc(opt)); o.value = String(oi); sel.appendChild(o);
          });
          sel.addEventListener('change', function () {
            if (sel.classList.contains('done')) return;
            if (Number(sel.value) === blanks[bi].a) {
              sel.classList.add('done'); sel.disabled = true; sound.play('correct'); SG.praise.show('correct');
              done++; ctx.setRing(ringPctOf(done, blanks.length));
              if (done === blanks.length) ctx.onWin();
            } else { sound.play('wrong'); SG.praise.show('wrong'); SG.mascot.setMood('think'); }
          });
          body.appendChild(sel);
        })(i);
      }
    });
    wrap.appendChild(body); stage.appendChild(wrap);
  }

  // 8m. MAZE (tap adjacent open cells to route start -> goal)
  function renderMaze(stage, c, ctx) {
    var rows = c.rows, cols = c.cols, start = c.start, goal = c.goal;
    var wall = {}; c.walls.forEach(function (i) { wall[i] = true; });
    var path = [start], solved = false;
    var wrap = el('div', 'sg-nl');
    wrap.appendChild(el('div', 'sg-nl-prompt', esc(c.prompt || 'Tap a next cell to build a path to the goal.')));
    var grid = el('div', 'sg-maze'); grid.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';
    var cellEls = [];
    function idx(r, cc) { return r * cols + cc; }
    function adj(a, b) { var dr = Math.floor(a / cols) - Math.floor(b / cols), dc = (a % cols) - (b % cols); return (Math.abs(dr) + Math.abs(dc)) === 1; }
    function paint() {
      cellEls.forEach(function (e, i) {
        if (!e) return;
        e.className = 'sg-maze-cell';
        if (i === start) e.classList.add('start');
        if (i === goal) e.classList.add('goal');
        if (path.indexOf(i) !== -1) e.classList.add('path');
        e.textContent = i === start ? '▶' : (i === goal ? '★' : '');
      });
    }
    for (var i = 0; i < rows * cols; i++) {
      (function (i) {
        if (wall[i]) { grid.appendChild(el('div', 'sg-maze-wall')); cellEls.push(null); return; }
        var cell = el('button', 'sg-maze-cell');
        cell.addEventListener('click', function () {
          if (solved) return;
          if (i === goal && adj(path[path.length - 1], goal)) { path.push(goal); solved = true; sound.play('correct'); SG.praise.show('correct'); paint(); ctx.setRing(100); ctx.onWin(); return; }
          if (wall[i]) return;
          var last = path[path.length - 1];
          if (i === last) return;
          // backtrack: tapping a cell already in path truncates to it
          var pi = path.indexOf(i);
          if (pi !== -1) { path = path.slice(0, pi + 1); sound.play('click'); paint(); return; }
          if (adj(last, i)) { path.push(i); sound.play('click'); paint(); }
        });
        grid.appendChild(cell); cellEls.push(cell);
      })(i);
    }
    wrap.appendChild(grid); stage.appendChild(wrap); paint();
  }

  // 8n. CRYPTO HACK (correct answers reveal characters of a hidden phrase)
  function renderCryptoHack(stage, c, ctx) {
    var hidden = c.hidden.toUpperCase(), clues = c.clues, revealed = new Array(hidden.length).fill(false), solved = 0;
    var wrap = el('div', 'sg-nl');
    wrap.appendChild(el('div', 'sg-nl-prompt', 'Crack the clues to reveal the hidden phrase!'));
    var strip = el('div', 'sg-crypt-strip');
    hidden.split('').forEach(function (ch, i) {
      var box = el('span', 'sg-crypt-box' + (ch === ' ' ? ' sp' : ''));
      box.textContent = ch === ' ' ? ' ' : '_'; box.dataset.i = i;
      strip.appendChild(box);
    });
    wrap.appendChild(strip);
    var list = el('div', 'sg-crypt-list');
    clues.forEach(function (cl, ci) {
      var row = el('div', 'sg-crypt-row');
      row.appendChild(el('div', 'sg-crypt-q', esc(cl.prompt)));
      var opts = el('div', 'sg-crypt-opts'); var answered = false;
      cl.options.forEach(function (txt, oi) {
        var b = el('button', 'sg-mis-opt'); b.innerHTML = '<span class="txt">' + esc(txt) + '</span><span class="ic"></span>';
        b.addEventListener('click', function () {
          if (answered) return; answered = true;
          if (oi === cl.a) {
            b.classList.add('correct'); b.querySelector('.ic').textContent = '✓'; sound.play('correct'); SG.praise.show('correct');
            cl.show.forEach(function (pos) { revealed[pos] = true; strip.querySelector('[data-i="' + pos + '"]').textContent = hidden[pos]; strip.querySelector('[data-i="' + pos + '"]').classList.add('on'); });
            Array.prototype.forEach.call(opts.children, function (x) { x.classList.add('disabled'); });
            solved++; ctx.setRing(ringPctOf(solved, clues.length));
            if (revealed.every(function (v) { return v; })) ctx.onWin();
          } else {
            b.classList.add('incorrect'); b.querySelector('.ic').textContent = '✗'; sound.play('wrong'); SG.praise.show('wrong'); SG.mascot.setMood('think');
            setTimeout(function () { if (answered && oi !== cl.a) { b.classList.remove('incorrect'); b.querySelector('.ic').textContent = ''; answered = false; } }, 600);
          }
        });
        opts.appendChild(b);
      });
      row.appendChild(opts); list.appendChild(row);
    });
    wrap.appendChild(list); stage.appendChild(wrap);
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

  /* ---------- MISSION engine (story-advancing multi-stage quest) ----------
   * A mission = sequence of "gates". Each gate is one drill tied to the day's
   * subjects. Solving a gate powers up one city block, reveals the next story
   * beat, and advances the character. All gates done = day won.
   * Gate drill types: 'quiz' (MC), 'input' (type answer), 'seek' (tap all correct).
   */
  /* ---------- MISSION engine (phase-runner: lesson → drill → practice → activity) ----------
   * content.phases = [ {kind, subject, title, ...}, ... ]
   *   kind 'lesson'   : { blocks:[ {h, p, example, tip}... ] }
   *   kind 'drill'    : { questions:[ {prompt, options, a, okMsg}... ] }   (5-6, one at a time)
   *   kind 'practice' : { mode:'flash'|'quiz', items:[ {front,back} | {prompt,options,a} ] }
   *   kind 'activity' : { stages:[ {type, subject, story, prompt, ...}... ] }  (quiz/input/seek gates)
   */
  function renderMission(stage, c, ctx) {
    // compat: old entries used { stages:[...] } — wrap as a single activity phase
    var phases = c.phases || (c.stages ? [{ kind: 'activity', title: c.title, stages: c.stages }] : []);
    var pi = 0;
    var wrap = el('div', 'sg-mission');
    var head = el('div', 'sg-mis-head');
    head.innerHTML = '<div class="sg-mis-title">🗺️ ' + esc(c.title) + '</div><div class="sg-mis-intro">' + esc(c.intro) + '</div>';
    wrap.appendChild(head);

    // phase track
    var track = el('div', 'sg-phase-track');
    phases.forEach(function (ph, i) {
      var b = el('div', 'sg-phase-dot ' + (i === 0 ? 'cur' : 'lock'));
      b.innerHTML = '<span class="phd-ic">' + phaseIcon(ph.kind) + '</span><span class="phd-lbl">' + esc(ph.subject || '') + '</span>';
      track.appendChild(b);
    });
    wrap.appendChild(track);

    // back-nav row (review a previous phase if stuck)
    var navRow = el('div', 'sg-phase-nav');
    var backBtn = el('button', 'sg-btn sg-mini sg-back-btn', '‹ Back');
    backBtn.addEventListener('click', function () { sound.play('click'); prevPhase(); });
    navRow.appendChild(backBtn);
    wrap.appendChild(navRow);

    var scene = el('div', 'sg-mis-scene'); wrap.appendChild(scene);
    var feedback = el('div', 'sg-mis-fb'); wrap.appendChild(feedback);

    function setPhaseState(i, state) {
      var b = track.children[i];
      b.className = 'sg-phase-dot ' + state;
      b.querySelector('.phd-ic').textContent = state === 'done' ? '✓' : phaseIcon(phases[i].kind);
    }
    function fbOk(msg) { feedback.className = 'sg-mis-fb ok'; feedback.textContent = '✅ ' + msg; }
    function fbNo(msg) { feedback.className = 'sg-mis-fb no'; feedback.textContent = '🌱 ' + msg; }
    function fbClear() { feedback.textContent = ''; feedback.className = 'sg-mis-fb'; }
    function ringOf(part, total) { ctx.setRing(total ? Math.round((part / total) * 100) : 0); }

    // ---------- reusable gate renderers (render into `host`, call onDone) ----------
    function quizInto(host, g, onDone) {
      var q = el('div', 'sg-mis-q', esc(g.prompt));
      var opts = el('div', 'sg-mis-opts');
      var answered = false;
      g.options.forEach(function (txt, idx) {
        var b = el('button', 'sg-mis-opt'); b.innerHTML = '<span class="txt">' + esc(txt) + '</span><span class="ic"></span>';
        b.addEventListener('click', function () {
          if (answered) return; answered = true;
          var ok = idx === g.a;
          if (ok) { b.classList.add('correct'); b.querySelector('.ic').textContent = '✓'; sound.play('correct'); SG.praise.show('correct'); }
          else { b.classList.add('incorrect'); b.querySelector('.ic').textContent = '✗'; opts.children[g.a].classList.add('correct'); opts.children[g.a].querySelector('.ic').textContent = '✓'; sound.play('wrong'); SG.mascot.setMood('think'); }
          Array.prototype.forEach.call(opts.children, function (x) { x.classList.add('disabled'); });
          fbOk(ok ? (g.okMsg || 'Correct!') : 'Answer shown — tap Next.');
          var next = el('button', 'sg-btn sg-next-btn', 'Next ›');
          next.addEventListener('click', function () { sound.play('click'); onDone(ok); });
          host.appendChild(next);
        });
        opts.appendChild(b);
      });
      host.appendChild(q); host.appendChild(opts);
    }

    function inputInto(host, g, onDone) {
      var q = el('div', 'sg-mis-q', esc(g.prompt));
      var row = el('div', 'sg-mis-input-row');
      var inp = el('input', 'sg-mis-input'); inp.type = 'text'; inp.setAttribute('autocomplete', 'off'); inp.placeholder = 'Type your answer…';
      var btn = el('button', 'sg-btn', 'Check ▸');
      row.appendChild(inp); row.appendChild(btn);
      host.appendChild(q); host.appendChild(row); inp.focus();
      function check() {
        var v = String(inp.value).trim().toLowerCase().replace(/,/g, '');
        var accept = (g.accept || []).map(function (a) { return String(a).toLowerCase().replace(/,/g, ''); });
        if (!v) return;
        if (accept.indexOf(v) !== -1) {
          sound.play('correct'); SG.praise.show('correct'); fbOk(g.okMsg || 'Got it!');
          inp.disabled = true; btn.disabled = true;
          var next = el('button', 'sg-btn sg-next-btn', 'Next ›');
          next.addEventListener('click', function () { sound.play('click'); onDone(true); });
          host.appendChild(next);
        } else { sound.play('wrong'); SG.mascot.setMood('think'); fbNo('Not quite — try again 💪'); inp.classList.add('shake'); setTimeout(function () { inp.classList.remove('shake'); }, 350); }
      }
      btn.addEventListener('click', check);
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') check(); });
    }

    function seekInto(host, g, onDone) {
      var q = el('div', 'sg-mis-q', esc(g.prompt));
      var grid = el('div', 'sg-mis-seek');
      var found = {};
      host.appendChild(q); host.appendChild(grid);
      g.items.forEach(function (it, idx) {
        var b = el('button', 'sg-mis-tile'); b.innerHTML = '<span class="tile-ic">' + esc(it.label) + '</span>';
        var isCorrect = g.correct.indexOf(idx) !== -1;
        b.addEventListener('click', function () {
          if (b.classList.contains('correct') || b.classList.contains('wrong-tap')) return;
          if (isCorrect) {
            b.classList.add('correct'); found[idx] = true; sound.play('correct');
            if (Object.keys(found).length === g.correct.length) { fbOk(g.okMsg || 'Found them all!'); var next = el('button', 'sg-btn sg-next-btn', 'Next ›'); next.addEventListener('click', function () { sound.play('click'); onDone(true); }); host.appendChild(next); }
            else { fbOk('Keep going — ' + (g.correct.length - Object.keys(found).length) + ' more!'); }
          } else { b.classList.add('wrong-tap'); sound.play('wrong'); SG.mascot.setMood('think'); fbNo('Not one — try another.'); }
        });
        grid.appendChild(b);
      });
    }

    // ---------- generic engine dispatcher (reuse the 8 RENDERERS as gates/practice) ----------
    function engineInto(host, kind, c, onWin) {
      var sub = el('div', 'sg-engine-host');
      host.appendChild(sub);
      var r = RENDERERS[kind];
      if (!r) { host.appendChild(el('div', 'sg-mis-fb no', '(engine "' + kind + '" missing)')); return; }
      r(sub, c, { setRing: ctx.setRing, onWin: onWin });
    }

    // ---------- phase renderers ----------
    function renderLesson(ph) {
      var blocks = ph.blocks || [];
      var card = el('div', 'sg-lesson');
      card.innerHTML = '<div class="sg-les-subj">' + esc(ph.subject) + '</div><h3 class="sg-les-title">' + esc(ph.title) + '</h3>';
      var body = el('div', 'sg-les-body'); card.appendChild(body);
      var btns = el('div', 'sg-les-btns'); card.appendChild(btns);
      scene.innerHTML = ''; scene.appendChild(card); fbClear();

      function renderBlock(bk) {
        var b = el('div', 'sg-les-block sg-reveal');
        if (bk.h) b.appendChild(el('div', 'sg-les-h', esc(bk.h)));
        if (bk.p) b.appendChild(el('p', 'sg-les-p', esc(bk.p)));
        if (bk.diagram) { var d = el('div', 'sg-les-diagram'); d.innerHTML = bk.diagram; b.appendChild(d); }
        if (bk.example) { var ex = el('div', 'sg-les-example'); ex.innerHTML = '💡 <b>Example:</b> ' + esc(bk.example); b.appendChild(ex); }
        if (bk.tip) { var tp = el('div', 'sg-les-tip'); tp.innerHTML = '✅ <b>Tip:</b> ' + esc(bk.tip); b.appendChild(tp); }
        body.appendChild(b);
        requestAnimationFrame(function () { b.classList.add('is-visible'); });
        return b;
      }

      var shown = 0;
      function renderCtrl() {
        btns.innerHTML = '';
        if (shown < blocks.length) {
          var moreLabel = shown === 0 ? 'Start reading ▸' : 'Show next part ▸';
          var more = el('button', 'sg-btn sg-go-btn', moreLabel);
          more.addEventListener('click', function () {
            sound.play('click');
            var blk = renderBlock(blocks[shown]); shown++;
            setTimeout(function () { blk.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 70);
            renderCtrl();
          });
          btns.appendChild(more);
        } else {
          var skip = el('button', 'sg-btn sg-skip-btn', 'Skip ▸');
          skip.addEventListener('click', function () { sound.play('click'); nextPhase(); });
          var go = el('button', 'sg-btn sg-go-btn', 'Start ' + labelForNext(phases, pi) + ' ▸');
          go.addEventListener('click', function () { sound.play('click'); nextPhase(); });
          btns.appendChild(skip); btns.appendChild(go);
        }
      }

      // reveal the first block right away so there is something to read
      if (blocks.length) { renderBlock(blocks[0]); shown = 1; }
      renderCtrl();
    }

    function renderDrill(ph) {
      scene.innerHTML = '';
      scene.appendChild(el('div', 'sg-phase-label', esc(ph.subject) + ' · Drill — ' + esc(ph.title)));
      var host = el('div', 'sg-drill-host'); scene.appendChild(host);
      if (ph.questions) {
        var qs = ph.questions, qi = 0, score = 0;
        var bar = el('div', 'sg-drill-bar', 'Question 1 of ' + qs.length + ' · Score 0');
        scene.appendChild(bar); scene.appendChild(host);
        function renderQ() {
          bar.textContent = 'Question ' + (qi + 1) + ' of ' + qs.length + ' · Score ' + score;
          host.innerHTML = '';
          quizInto(host, qs[qi], function (ok) { if (ok) score++; qi++; if (qi < qs.length) renderQ(); else drillDone(); });
          ringOf(qi, qs.length);
        }
        function drillDone() {
          ringOf(qi, qs.length);
          host.innerHTML = '<div class="sg-drill-done">Drill done! You scored ' + score + ' / ' + qs.length + ' 🎉</div>';
          var next = el('button', 'sg-btn sg-go-btn', 'On to ' + labelForNext(phases, pi) + ' ▸');
          next.addEventListener('click', function () { sound.play('click'); nextPhase(false); });
          host.appendChild(next);
          if (score === qs.length) { SG.mascot.setMood('happy'); SG.confetti({ count: 60 }); }
        }
        renderQ();
      } else {
        // single-engine drill (fillBlank / quizMC / match / etc.)
        engineInto(host, ph.engine || 'quizMC', ph, function () {
          host.innerHTML = '<div class="sg-drill-done">Drill complete! 🎉</div>';
          var next = el('button', 'sg-btn sg-go-btn', 'On to ' + labelForNext(phases, pi) + ' ▸');
          next.addEventListener('click', function () { sound.play('click'); nextPhase(false); });
          host.appendChild(next);
          SG.mascot.setMood('happy'); SG.confetti({ count: 60 });
        });
      }
    }

    function renderPractice(ph) {
      var items = ph.items, ii = 0;
      scene.innerHTML = '';
      scene.appendChild(el('div', 'sg-phase-label', esc(ph.subject) + ' · Recap — ' + esc(ph.title)));
      var host = el('div', 'sg-practice-host'); scene.appendChild(host);
      if (ph.mode === 'flash') {
        function showCard() {
          var card = el('div', 'sg-flashcard');
          card.innerHTML = '<div class="sg-fc-face sg-fc-front">' + esc(items[ii].front) + '</div><div class="sg-fc-face sg-fc-back">' + esc(items[ii].back) + '</div>';
          card.addEventListener('click', function () { card.classList.toggle('flipped'); sound.play('click'); });
          host.innerHTML = ''; host.appendChild(card);
          var cnt = el('div', 'sg-flash-ctrl');
          var prev = el('button', 'sg-btn sg-mini', '‹ Prev'); prev.disabled = ii === 0;
          var prog = el('span', 'sg-flash-prog', (ii + 1) + ' / ' + items.length);
          var nextB = el('button', 'sg-btn sg-mini', ii === items.length - 1 ? 'Done ▸' : 'Next ›');
          prev.addEventListener('click', function () { if (ii > 0) { ii--; showCard(); } });
          nextB.addEventListener('click', function () { if (ii < items.length - 1) { ii++; showCard(); } else { sound.play('correct'); practiceDone(); } });
          cnt.appendChild(prev); cnt.appendChild(prog); cnt.appendChild(nextB);
          host.appendChild(cnt);
          ringOf(ii, items.length);
        }
        showCard();
      } else if (ph.mode === 'quiz') { // quiz recap
        var qi = 0, score = 0;
        function showQ() {
          host.innerHTML = '';
          quizInto(host, items[qi], function (ok) { if (ok) score++; qi++; if (qi < items.length) showQ(); else { host.innerHTML = '<div class="sg-drill-done">Recap done! ' + score + ' / ' + items.length + ' 🎉</div>'; var n = el('button', 'sg-btn sg-go-btn', 'On to ' + labelForNext(phases, pi) + ' ▸'); n.addEventListener('click', function () { sound.play('click'); nextPhase(false); }); host.appendChild(n); practiceDone(); } });
          ringOf(qi, items.length);
        }
        showQ();
      } else { // any other engine mode: match / fillBlank / flip / wordSearch / dragSort / hangman / scratch / quizMC
        engineInto(host, ph.mode, ph, practiceDone);
      }
      function practiceDone() { ringOf(1, 1); if (!host.querySelector('.sg-go-btn')) { var n = el('button', 'sg-btn sg-go-btn', 'On to ' + labelForNext(phases, pi) + ' ▸'); n.addEventListener('click', function () { sound.play('click'); nextPhase(false); }); host.appendChild(n); } }
    }

    function renderActivity(ph) {
      var gates = ph.stages, gi = 0, solved = 0;
      var sub = el('div', 'sg-mis-story');
      var host = el('div', 'sg-act-host');
      var gtrack = el('div', 'sg-mis-track');
      gates.forEach(function (g, i) {
        var b = el('div', 'sg-mis-block ' + (i === 0 ? 'cur' : 'lock'));
        b.innerHTML = '<span class="blk-ic">' + (i === 0 ? '📍' : '🔒') + '</span><span class="blk-idx">' + (i + 1) + '</span>';
        gtrack.appendChild(b);
      });
      scene.innerHTML = '';
      scene.appendChild(el('div', 'sg-phase-label', '🎯 Activity — ' + esc(ph.title || c.title)));
      scene.appendChild(gtrack); scene.appendChild(sub); scene.appendChild(host);
      function setBlockState(i, state) { var b = gtrack.children[i]; b.className = 'sg-mis-block ' + state; b.querySelector('.blk-ic').textContent = state === 'done' ? '⚡' : (state === 'cur' ? '📍' : '🔒'); }
      function showStory() { var g = gates[gi]; sub.innerHTML = '<span class="sg-mis-subj">' + esc(g.subject) + '</span> ' + esc(g.story); }
      function renderGate() {
        var g = gates[gi]; fbClear(); showStory(); host.innerHTML = '';
        if (g.type === 'quiz') quizInto(host, g, gateDone);
        else if (g.type === 'input') inputInto(host, g, gateDone);
        else if (g.type === 'seek') seekInto(host, g, gateDone);
        else engineInto(host, g.type, g, gateDone);
        ringOf(solved, gates.length);
      }
      function gateDone() {
        setBlockState(gi, 'done'); solved++; gi++;
        if (gi >= gates.length) { host.innerHTML = '<div class="sg-mis-win">' + (c.winText || '🎉 Mission complete! Day done.') + '</div>'; sub.textContent = ''; ringOf(1, 1); ctx.onWin(); return; }
        setBlockState(gi, 'cur'); setTimeout(function () { sound.play('click'); renderGate(); }, 420);
      }
      renderGate();
    }

    // ---------- phase driver ----------
    function renderPhase() {
      var ph = phases[pi];
      navRow.style.visibility = pi > 0 ? 'visible' : 'hidden';
      if (pi > 0) backBtn.textContent = '‹ Back to ' + labelForPrev(phases, pi);
      if (ph.kind === 'lesson') renderLesson(ph);
      else if (ph.kind === 'drill') renderDrill(ph);
      else if (ph.kind === 'practice') renderPractice(ph);
      else if (ph.kind === 'activity') renderActivity(ph);
    }
    function nextPhase() {
      if (pi > 0) setPhaseState(pi - 1, 'done');
      if (pi >= phases.length - 1) return; // safety
      pi++; setPhaseState(pi, 'cur'); renderPhase();
    }
    function prevPhase() {
      if (pi <= 0) return;
      setPhaseState(pi, 'lock'); pi--; setPhaseState(pi, 'cur'); renderPhase();
    }

    setPhaseState(0, 'cur');
    renderPhase();
    stage.appendChild(wrap);
  }

  function phaseIcon(kind) { return { lesson: '📖', drill: '✏️', practice: '🔄', activity: '🎯' }[kind] || '•'; }
  function labelForNext(phases, pi) {
    for (var j = pi + 1; j < phases.length; j++) { if (phases[j].kind === 'activity') return 'the activity'; return phases[j].title || phases[j].kind; }
    return 'next';
  }
  function labelForPrev(phases, pi) { return pi > 0 ? (phases[pi - 1].title || phases[pi - 1].kind) : 'start'; }

  var RENDERERS = { scratch: renderScratch, wordSearch: renderWordSearch, match: renderMatch, dragSort: renderDragSort, flip: renderFlip, hangman: renderHangman, fillBlank: renderFillBlank, quizMC: renderQuiz, trueFalse: renderTrueFalse, scramble: renderScramble, timeline: renderTimeline, categorize: renderCategorize, twoTruths: renderTwoTruths, labelDiagram: renderLabelDiagram, venn: renderVenn, numberLine: renderNumberLine, higherLower: renderHigherLower, fractionBar: renderFractionBar, crossword: renderCrossword, cloze: renderCloze, maze: renderMaze, cryptoHack: renderCryptoHack, mission: renderMission };

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

  // a day is unlocked if every earlier day (linear order across weeks) is done
  function priorDone(w, d) {
    for (var wi = 0; wi <= w; wi++) {
      var maxD = (wi === w) ? d : (SG.SCHEDULE[wi].length);
      for (var di = 0; di < maxD; di++) { if (!done[wi + '-' + di]) return false; }
    }
    return true;
  }

  function buildDayCard(w, d) {
    var dayKey = w + '-' + d, day = SG.SCHEDULE[w][d], g = SG.GAMES[dayKey];
    var isDone = !!done[dayKey];
    var unlocked = isDone || priorDone(w, d);
    var card = el('div', 'day-game-card sg-reveal ' + pairClass(day) + (isDone ? ' done' : '') + (unlocked ? '' : ' locked'));
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
    day.forEach(function (s) { topics.appendChild(el('div', 'gt', '<b>' + esc(s[0]) + '</b> ' + esc(s[1]))); });
    card.appendChild(topics);

    if (!unlocked) {
      var prevDay = d === 0 ? ('Week ' + w + ', Day 4') : ('Day ' + d);
      var ov = el('div', 'day-lock-overlay');
      ov.innerHTML = '<div class="lock-ic">🔒</div><div class="lock-title">Locked</div><div class="lock-msg">Finish ' + (d === 0 ? ('Week ' + w + ', Day 4') : ('Day ' + d)) + ' to unlock Day ' + (d + 1) + '.</div>';
      card.appendChild(ov);
      return card;
    }

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
    return { scratch: 'Scratch & Reveal', wordSearch: 'Word Search', match: 'Match the Pairs', dragSort: 'Drag to Order', flip: 'Flip the Cards', hangman: 'Guess the Word', fillBlank: 'Fill the Blanks', quizMC: 'Quick Quiz', mission: 'Story Mission' }[t] || 'Game';
  }
  function activityHint(t) {
    return {
      scratch: 'Wipe the gold card to uncover the answer.',
      wordSearch: 'Drag across the letters to find each word.',
      match: 'Tap a word, then tap its meaning.',
      dragSort: 'Drag the steps into the right order, then Check.',
      mission: 'Solve each challenge to power up a block and advance the story.',
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
    // mascot removed by request — SG.mascot.setMood stays a safe no-op (mascotEl undefined)
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