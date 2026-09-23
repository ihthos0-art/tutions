'use strict';

/* ============================================================================
   Grade 2 Interactive Lesson Pack — tests.

   These run against the same modules the browser loads. Two jobs:

     1. Integrity — nothing in the pack can mark a child wrong for a right
        answer, and no lesson can render without the content it needs.
     2. Namespacing — the host page has several scripts that bind globally by
        class and by event name, and every collision with them fails silently.
        Those guards are asserted here because a silent failure is exactly the
        kind that reaches a student.
   ========================================================================== */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const D = require('../lesson-pack.data.js');

const ROOT = path.join(__dirname, '..');
const ENGINE_SRC = fs.readFileSync(path.join(ROOT, 'lesson-pack.js'), 'utf8');
const CSS_SRC = fs.readFileSync(path.join(ROOT, 'lesson-pack.css'), 'utf8');
const PAGE = fs.readFileSync(path.join(ROOT, 'nafis.html'), 'utf8');

// The source scans below must look at code, not prose. Both files document the
// host page's reserved names in comments — that documentation is the reason
// the collisions are avoidable, so scanning it as if it were code would fail
// the very checks it exists to explain. Comments are stripped first.
function stripJsComments(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

function stripCssComments(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, '');
}

const ENGINE_CODE = stripJsComments(ENGINE_SRC);
const CSS_CODE = stripCssComments(CSS_SRC);

/* ------------------------------------------------------------- the content */

test('all eight lessons are present and structurally valid', () => {
  const errs = D.validateAll();
  assert.deepEqual(errs, [], 'structural errors:\n' + errs.join('\n'));
  assert.equal(D.LESSONS.length, 8);
});

test('lessons cover all four subjects, two each', () => {
  const subjects = D.ordered().map(l => l.lesson_id.slice(0, 2));
  assert.deepEqual(subjects, ['en', 'en', 'ma', 'ma', 'sc', 'sc', 'ss', 'ss']);
});

test('every lesson is grade 2 and has reading, a visual and a challenge', () => {
  D.ordered().forEach(l => {
    assert.equal(l.grade, 2, l.lesson_id);
    assert.ok(l.read.paragraphs.length, l.lesson_id + ' has no reading');
    assert.ok(l.visual.svg, l.lesson_id + ' has no visual');
    assert.ok(l.visual.alt, l.lesson_id + ' visual has no alt text');
    assert.ok(l.challenge && l.challenge.prompt, l.lesson_id + ' has no challenge');
  });
});

test('every visual SVG is announced as an image, not left as decoration', () => {
  D.ordered().forEach(l => {
    assert.match(l.visual.svg, /role="img"/, l.lesson_id + ' svg lacks role="img"');
    assert.match(l.visual.svg, /aria-label=/, l.lesson_id + ' svg lacks aria-label');
  });
});

/* -------------------------------------------------------- answer integrity */

// The single most important check here. A multiple choice answer that is not
// among its own choices renders a question no child can get right.
test('every multiple-choice answer is one of its own choices', () => {
  const problems = [];
  const check = (item, where) => {
    // TAP_IMAGE carries {label, correct} pairs rather than strings; its own
    // exactly-one-correct rule is checked separately.
    if (!item || !item.choices || item.engine === 'TAP_IMAGE') return;
    const answers = Array.isArray(item.answer) ? item.answer : [item.answer];
    answers.forEach(a => {
      if (item.choices.indexOf(a) === -1) {
        problems.push(`${where}: ${JSON.stringify(a)} not in ${JSON.stringify(item.choices)}`);
      }
    });
    if (Array.isArray(item.answer) && item.answer.length < 2) {
      problems.push(`${where}: array answer with ${item.answer.length} member(s)`);
    }
  };
  D.ordered().forEach(l => {
    l.games.concat(l.guided, l.challenge ? [l.challenge] : []).forEach((it, i) => {
      check(it, `${l.lesson_id} item ${i} (${it.engine})`);
    });
  });
  assert.deepEqual(problems, [], problems.join('\n'));
});

// Cards targeting a box that does not exist would be unplaceable, making the
// game unwinnable; a null target is a decoy and is deliberately valid.
test('every placed card targets a real box or bin, or is a deliberate decoy', () => {
  D.ordered().forEach(l => {
    l.games.forEach(g => {
      if (g.engine === 'DRAG_DROP') {
        g.cards.forEach(c => {
          assert.ok(c.box === null || g.boxes.indexOf(c.box) !== -1,
            `${l.lesson_id}: card "${c.text}" targets unknown box ${c.box}`);
        });
      }
      if (g.engine === 'SORT') {
        g.cards.forEach(c => {
          assert.ok(c.bin === null || g.bins.indexOf(c.bin) !== -1,
            `${l.lesson_id}: card "${c.text}" targets unknown bin ${c.bin}`);
        });
      }
    });
  });
});

test('every multiple choice question offers something to choose', () => {
  D.ordered().forEach(l => {
    l.games.concat(l.guided).forEach(it => {
      if (it.engine === 'MULTIPLE_CHOICE' || it.engine === 'AUDIO_CHOICE') {
        assert.ok(it.choices.length >= 1, `${l.lesson_id}: a question has no choices`);
      }
    });
  });
});

test('no answer is stored as a bare letter or index', () => {
  // The pack mixes conventions in prose ("Answer: A" beside "answer": "tens").
  // A letter would silently point at whatever choice happened to sort first.
  const bad = [];
  D.ordered().forEach(l => {
    l.games.concat(l.guided).forEach(it => {
      if (!it.choices) return;
      const answers = Array.isArray(it.answer) ? it.answer : [it.answer];
      answers.forEach(a => {
        if (typeof a === 'string' && /^[A-D]$/.test(a.trim())) {
          bad.push(`${l.lesson_id}: answer stored as letter ${a}`);
        }
      });
    });
  });
  assert.deepEqual(bad, [], bad.join('\n'));
});

/* --------------------------------------------------------------- engines */

test('every item resolves to an engine the module implements', () => {
  const impl = ENGINE_CODE.match(/ENGINES\.([A-Z_]+)\s*=/g)
    .map(s => s.replace(/ENGINES\./, '').replace(/\s*=$/, ''));
  const problems = [];
  D.ordered().forEach(l => {
    l.games.concat(l.guided, l.challenge ? [l.challenge] : []).forEach(it => {
      if (impl.indexOf(it.engine) === -1) {
        problems.push(`${l.lesson_id}: ${it.engine} has no renderer`);
      }
    });
  });
  assert.deepEqual(problems, [], problems.join('\n'));
});

test('MEMORY is never used, so it is never shipped as a dead engine', () => {
  const used = new Set();
  D.ordered().forEach(l => l.games.forEach(g => used.add(g.engine)));
  assert.equal(used.has('MEMORY'), false, 'a lesson uses MEMORY but no lesson was written for it');
});

// Math nests its rounds as {name, engine, items:[...]}; SEQUENCE uses `items`
// for the list being ordered. Flattening the wrong one shreds a sequence game
// into its individual sentences, each with nothing left to order.
test('sequence games survived normalisation with their items intact', () => {
  const seqs = [];
  D.ordered().forEach(l => l.games.forEach(g => { if (g.engine === 'SEQUENCE') seqs.push(g); }));
  assert.ok(seqs.length > 0, 'no sequence game found at all');
  seqs.forEach(g => {
    assert.ok(Array.isArray(g.items) && g.items.length >= 2,
      `${g.id || g.name} lost its items in normalisation`);
    g.items.forEach(t => assert.equal(typeof t, 'string'));
  });
});

/* ------------------------------------------------------------- the gaps */

// The pack's own teaching rules, reported not enforced: the transcribed
// lessons genuinely do not all have a hint, and inventing content to satisfy a
// test would substitute my material for the teacher's.
//
// There is one recorded exception and it is deliberate. Both packs name a
// two-question warm-up and a two-example "Try Together" step, but neither
// supplies the questions for every lesson; several lessons also leave `guided`
// empty. The teacher authorised writing those in ("Write them, marked as
// mine"), so every such item is tagged `authored: true` and reported here by
// name and count. That tag is the thing to look for: an item with no
// `authored` flag is the teacher's, and must never be edited to make a test
// pass.
//
// Asserting the exact list still matters, because a *new* deviation — a reading
// that lost its hint count, or content that quietly stopped being the
// teacher's — would change a line here and fail loudly.
test('conformance gaps are unchanged from the recorded baseline', () => {
  assert.deepEqual(D.conformanceReport(), [
    "en-l1: 2 of 12 items are authored, not the teacher's — the pack names the step and supplies no question for it",
    'en-l1: 9 of 10 items have no hint; the source supplies none, so no hint is shown after a wrong first try',
    'en-l2: 14 of 14 items have no hint; the source supplies none, so no hint is shown after a wrong first try',
    "en-l2: 2 of 16 items are authored, not the teacher's — the pack names the step and supplies no question for it",
    'ma-l1: 16 of 18 items have no hint; the source supplies none, so no hint is shown after a wrong first try',
    "ma-l1: 2 of 20 items are authored, not the teacher's — the pack names the step and supplies no question for it",
    'ma-l2: 17 of 20 items have no hint; the source supplies none, so no hint is shown after a wrong first try',
    "ma-l2: 4 of 22 items are authored, not the teacher's — the pack names the step and supplies no question for it",
    "sc-l1: 4 of 12 items are authored, not the teacher's — the pack names the step and supplies no question for it",
    'sc-l1: 8 of 10 items have no hint; the source supplies none, so no hint is shown after a wrong first try',
    "sc-l2: 4 of 12 items are authored, not the teacher's — the pack names the step and supplies no question for it",
    'sc-l2: 8 of 10 items have no hint; the source supplies none, so no hint is shown after a wrong first try',
    'ss-l1: 14 of 16 items have no hint; the source supplies none, so no hint is shown after a wrong first try',
    "ss-l1: 4 of 18 items are authored, not the teacher's — the pack names the step and supplies no question for it",
    'ss-l2: 10 of 12 items have no hint; the source supplies none, so no hint is shown after a wrong first try',
    "ss-l2: 4 of 14 items are authored, not the teacher's — the pack names the step and supplies no question for it"
  ]);
});

// The authorised exception must stay visibly an exception. If this ever equals
// the total item count, the packs' own content has been crowded out.
test('most of every lesson is still the teacher\'s, not mine', () => {
  D.ordered().forEach(l => {
    const all = l.warmup.concat(l.games, l.guided, l.challenge ? [l.challenge] : []);
    const mine = all.filter(it => it.authored).length;
    assert.ok(mine < all.length,
      `${l.lesson_id} is entirely authored — the pack supplies nothing for it`);
  });
});

test('every authored item is tagged, so the teacher can find it', () => {
  // Any item that is not the teacher's must say so. The reverse is not
  // asserted: a transcribed item may carry the flag too if the pack's wording
  // was reused, and that is not a defect.
  const untagged = [];
  D.ordered().forEach(l => {
    l.warmup.concat(l.games, l.guided).forEach(it => {
      if (it.authored === undefined && !it.id) {
        untagged.push(`${l.lesson_id}: item with no id and no authored flag`);
      }
    });
  });
  assert.deepEqual(untagged, [], untagged.join('\n'));
});

test('a lesson with no hint still renders a question', () => {
  // The gap above is only acceptable because a missing hint degrades to no
  // hint rather than to no question.
  assert.match(ENGINE_CODE, /if \(!host \|\| !item\.hint\) return;/);
});

/* -------------------------------------------------------------- progress */

test('stars follow the pack scale exactly, and never drop to zero', () => {
  assert.equal(D.computeStars(0, 10), 1, 'a finished lesson is always at least one star');
  assert.equal(D.computeStars(6, 10), 1, '60% is one star');
  assert.equal(D.computeStars(7, 10), 2, '70% is two stars');
  assert.equal(D.computeStars(8, 10), 2, '89% is two stars');
  assert.equal(D.computeStars(9, 10), 3, '90% is three stars');
  assert.equal(D.computeStars(10, 10), 3);
  assert.equal(D.computeStars(0, 0), 1, 'a lesson with nothing scored still counts as finished');
});

test('progress survives a storage round trip', () => {
  const store = {
    _d: {},
    getItem(k) { return this._d[k] === undefined ? null : this._d[k]; },
    setItem(k, v) { this._d[k] = String(v); }
  };
  let p = D.emptyProgress();
  p = D.recordLesson(p, 'en-l1', { stars: 3, firstTryCorrect: 7, total: 7, attempts: 1 });
  D.saveProgress(store, 'g2pack:nabila-naviha', p);
  const back = D.loadProgress(store, 'g2pack:nabila-naviha');
  assert.equal(back.lessons['en-l1'].stars, 3);
  assert.equal(back.lessons['en-l1'].done, true);
});

test('a replayed lesson never erases a better earlier run', () => {
  let p = D.emptyProgress();
  p = D.recordLesson(p, 'en-l1', { stars: 3, firstTryCorrect: 7, total: 7, attempts: 1 });
  p = D.recordLesson(p, 'en-l1', { stars: 1, firstTryCorrect: 2, total: 7, attempts: 1 });
  assert.equal(p.lessons['en-l1'].stars, 3, 'stars moved backwards');
  assert.equal(p.lessons['en-l1'].firstTryCorrect, 7, 'score moved backwards');
  assert.equal(p.lessons['en-l1'].attempts, 2, 'attempts should accumulate');
});

test('corrupt or blocked storage yields an empty record, never a crash', () => {
  const broken = { getItem() { return '{{{not json'; } };
  assert.deepEqual(D.loadProgress(broken, 'g2pack:nabila-naviha'), D.emptyProgress());

  const blocked = { getItem() { throw new Error('blocked'); } };
  assert.deepEqual(D.loadProgress(blocked, 'g2pack:nabila-naviha'), D.emptyProgress());

  const full = { setItem() { throw new Error('quota'); } };
  assert.equal(D.saveProgress(full, 'k', {}), false);
});

test('badges are the five the pack defines, and appear only when earned', () => {
  assert.equal(D.BADGES.length, 5);
  assert.deepEqual(D.BADGES.map(b => b.label), [
    'Story Detective', 'Number Builder', 'Young Scientist',
    'Community Explorer', 'Grade 2 Explorer'
  ]);

  let p = D.emptyProgress();
  p = D.recordLesson(p, 'en-l1', { stars: 3, firstTryCorrect: 7, total: 7 });
  assert.deepEqual(p.badges, [], 'one English lesson must not earn the both-lessons badge');

  p = D.recordLesson(p, 'en-l2', { stars: 3, firstTryCorrect: 7, total: 7 });
  assert.deepEqual(p.badges, ['story-detective']);

  ['ma-l1', 'ma-l2', 'sc-l1', 'sc-l2', 'ss-l1', 'ss-l2'].forEach(id => {
    p = D.recordLesson(p, id, { stars: 3, firstTryCorrect: 7, total: 7 });
  });
  assert.deepEqual(p.badges.sort(), [
    'community-explorer', 'grade2-explorer', 'number-builder',
    'story-detective', 'young-scientist'
  ]);
});

test('summarise counts every lesson, done or not', () => {
  let p = D.emptyProgress();
  p = D.recordLesson(p, 'ma-l1', { stars: 2, firstTryCorrect: 7, total: 10, attempts: 2 });
  const s = D.summarise(p);
  assert.equal(s.rows.length, 8);
  assert.equal(s.lessonsDone, 1);
  assert.equal(s.stars, 2);
  assert.equal(s.attempts, 2);
});

/* ---------------------------------------------------- host page collisions */

// ai-tutor.js listens on `checkResult` twice over and owns its own star
// economy. Dispatching that event would open a full-screen overlay and
// double-count into ai-scores/ai-badges, which the parent dashboard reads.
test('the engine never dispatches the page\'s checkResult event', () => {
  assert.equal(/checkResult/.test(ENGINE_CODE), false,
    'checkResult would trigger the AI tutor overlay and double-count stars');
  assert.match(ENGINE_CODE, /lp:result|makeUi/, 'the pack should report through its own path');
});

// interactive.js deletes every `nabila-naviha:*` localStorage key when the
// Assigned tab's reset button is pressed — a button students are meant to
// press. A key under that prefix would silently erase all lesson progress.
test('progress is stored outside the prefix the page\'s reset button wipes', () => {
  assert.match(ENGINE_CODE, /g2pack:nabila-naviha/);
  assert.equal(/['"]nabila-naviha:/.test(ENGINE_CODE), false,
    'a nabila-naviha: key is deleted by the Assigned tab reset button');
});

// These are the exact hooks other scripts grab globally. Every collision is a
// silent failure rather than an error, so they are asserted rather than eyed.
test('the pack avoids the classes and attributes the host page hijacks', () => {
  const reserved = ['passage-box', 'wb-chip', 'wb-words', 'fitb-drop', 'fitb-list',
    'math-grid', 'problems-grid', 'passage-wrap', 'save-notice', 'ws-title',
    'section-question', 'reset-btn'];
  reserved.forEach(name => {
    assert.equal(new RegExp(`['"\`]${name}['"\`]`).test(ENGINE_CODE), false,
      `the engine uses "${name}", which another script binds to globally`);
    assert.equal(new RegExp(`\\.${name}\\b`).test(CSS_CODE), false,
      `the stylesheet defines .${name}, which another script binds to globally`);
  });
});

test('the pack writes no data-save fields into the parent answers dashboard', () => {
  assert.equal(/data-save/.test(ENGINE_CODE), false);
});

test('focus is never faked away with pointer-events', () => {
  // pointer-events:none also removes a control from the tab order, which is
  // the actual accessibility bug, not the fix.
  assert.equal(/pointer-events\s*:\s*none/.test(CSS_CODE), false);
});

test('state is never signalled by colour alone', () => {
  // Every good/retry state must also change a glyph or a border style.
  assert.match(CSS_CODE, /\.lp-choice\.is-good\s*\{[^}]*border-color/);
  assert.match(CSS_CODE, /\.lp-choice\.is-retry\s*\{[^}]*border-color/);
  assert.match(ENGINE_CODE, /lp-mark/);
});

/* ------------------------------------------------------------- lesson flow */

test('the ten steps are the packs\' steps, in order', () => {
  // Nine of these are the packs' own named steps. `words` is the tenth: the
  // Grade 7 pack names "Words First" second, and the Grade 2 pack heads the
  // same block "Key Words" directly above its "Read:" section. It used to be
  // rendered inside Learn, which put the vocabulary *after* the passage a
  // child was meant to use it on.
  assert.deepEqual(D.STEPS, ['warmup', 'words', 'learn', 'look', 'together',
    'practice', 'challenge', 'score', 'retry', 'finish']);
  Object.keys(D.STEP_LABELS).forEach(k => {
    assert.ok(D.STEPS.indexOf(k) !== -1, `label for unknown step ${k}`);
  });
});

test('the vocabulary step sits between the warm-up and the reading', () => {
  const words = D.STEPS.indexOf('words');
  assert.ok(words > D.STEPS.indexOf('warmup'), 'Words First must come after the warm-up');
  assert.ok(words < D.STEPS.indexOf('learn'), 'Words First must come before the reading');
  assert.ok(words < D.STEPS.indexOf('practice'), 'Words First must come before the drills');
});

test('a page can rename the steps its own pack names differently', () => {
  // The Grade 7 page declares "Words First", "Look at the Picture", "Try With
  // Help", "Practice Games" and "Reward". The default stays the Grade 2 pack's
  // wording, because that page declares nothing.
  assert.equal(D.STEP_LABELS.words, 'Key Words');

  const block = PAGE.match(/stepLabels:\s*\{([\s\S]*?)\n\s*\}/);
  assert.ok(block, 'the Grade 7 page declares no step labels');
  const declared = [...block[1].matchAll(/(\w+)\s*:\s*'([^']+)'/g)]
    .map(m => ({ step: m[1], label: m[2] }));

  assert.ok(declared.length, 'no step labels found in the Grade 7 page');
  // A label for a step that does not exist would silently do nothing, which is
  // the same silent failure the rest of this file exists to catch.
  declared.forEach(d => {
    assert.ok(D.STEPS.indexOf(d.step) !== -1, `unknown step label ${d.step}`);
    assert.ok(d.label.trim().length, `${d.step} has an empty label`);
  });

  // The five names the pack actually uses must be the five the page declares.
  ['words', 'look', 'together', 'practice', 'finish'].forEach(k => {
    assert.ok(declared.some(d => d.step === k), `nafis.html does not label "${k}"`);
  });
  assert.equal(declared.find(d => d.step === 'words').label, 'Words First');
  assert.equal(declared.find(d => d.step === 'together').label, 'Try With Help');
  assert.equal(declared.find(d => d.step === 'finish').label, 'Reward');
});

test('the review is always reachable, overriding the pack\'s unlock gate', () => {
  // The pack says the review unlocks after all eight lessons. The teacher's
  // "everything open" decision overrides that, so it must not be conditional
  // on progress.
  const fn = ENGINE_CODE.match(/function mountReview[\s\S]*?\n  \}/);
  assert.ok(fn, 'mountReview not found');
  assert.equal(/badges\.length\s*===?\s*5|lessonsDone\s*===\s*8/.test(fn[0]), false,
    'the review is gated on progress, but it should always open');
});

/* --------------------------------------------------------------- numbers */

test('number lines get workable defaults when the source states no range', () => {
  // Math's source never gives min/max/step for its number lines.
  const lines = [];
  D.ordered().forEach(l => l.games.forEach(g => { if (g.engine === 'NUMBER_LINE') lines.push(g); }));
  assert.ok(lines.length > 0);
  lines.forEach(g => {
    assert.equal(typeof g.target, 'number', `${g.id || g.name} has no numeric target`);
    // Rendered as-is the prompt would show its own answer.
    assert.equal(/=\s*-?\d+\s*$/.test(g.prompt || ''), false,
      `${g.id || g.name} still shows its answer in the prompt`);
  });
});

test('guided examples that are not questions are not rendered as questions', () => {
  const worked = [];
  D.ordered().forEach(l => l.guided.forEach(g => { if (g.engine === 'WORKED_EXAMPLE') worked.push(g); }));
  assert.ok(worked.length > 0, 'math guidance should have produced worked examples');
  worked.forEach(g => {
    assert.equal(g.choices, undefined, 'a worked example should have nothing to choose');
    assert.ok(g.prompt, 'a worked example still needs something to read');
  });
});

test('open challenges take their key from the accept list', () => {
  D.ordered().forEach(l => {
    const c = l.challenge;
    if (c.engine === 'SHORT_ANSWER') {
      assert.ok((c.accept || []).length, `${l.lesson_id} challenge has nothing to accept`);
    }
    if (c.engine === 'MULTIPLE_CHOICE') {
      assert.ok(c.choices.indexOf(c.answer) !== -1,
        `${l.lesson_id} challenge answer is not among its choices`);
    }
  });
});
