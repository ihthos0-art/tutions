'use strict';

/* ============================================================================
   Grade 7 Interactive Lesson Pack — content tests.

   The Grade 2 pack's tests exercise the engine and the namespacing rules; those
   are shared, and tests/lesson-pack.test.js still covers them. This file covers
   what is new: the Grade 7 pack's own content, and the three engines the
   teacher's pack names that the engine did not have before.

   Two jobs:

     1. Integrity — no question can mark a right answer wrong, and no lesson
        can render without the content its flow needs.
     2. Coverage — an engine the content names but the module does not
        implement fails *silently*: the practice loop skips it and an item step
        says it is unavailable. A lesson would look short rather than broken,
        so every engine used is checked against the module's own list.
   ========================================================================== */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const D = require('../lesson-pack.data.js');

const ROOT = path.join(__dirname, '..');
const ENGINE_SRC = fs.readFileSync(path.join(ROOT, 'lesson-pack.js'), 'utf8');

function stripJsComments(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}
const ENGINE_CODE = stripJsComments(ENGINE_SRC);

// The pack the page actually loads, assembled exactly as nafis.html assembles
// it — same content globals, same config.
const CONTENT = {
  ela: require('../lesson-pack-g7-content-ela.js'),
  math: require('../lesson-pack-g7-content-math.js'),
  science: require('../lesson-pack-g7-content-science.js'),
  social: require('../lesson-pack-g7-content-social.js')
};
const REVIEW = require('../lesson-pack-g7-content-review.js');

const PACK = D.build(
  CONTENT.ela, CONTENT.math, CONTENT.science, CONTENT.social,
  { grade: 7, student: 'nafis', storageKey: 'g7pack:nafis' }, REVIEW
);

// Every scored item, tagged with the lesson it came from.
//
// `warmup` belongs here as much as the games do. The warm-up questions are
// scored, they carry ids that the retry step looks up, and they are answers a
// child can be marked wrong on — so every integrity rule below has to see them.
// Leaving them out of this helper is how a bad warm-up answer key would reach a
// student with the suite still green.
function allItems(pack) {
  const out = [];
  pack.ordered().forEach(l => {
    (l.warmup || []).forEach(it => out.push({ lesson: l, item: it }));
    (l.games || []).forEach(it => out.push({ lesson: l, item: it }));
    (l.guided || []).forEach(it => out.push({ lesson: l, item: it }));
    if (l.challenge) out.push({ lesson: l, item: l.challenge });
  });
  return out;
}

/* ------------------------------------------------------------- the content */

test('all eight Grade 7 lessons are present and structurally valid', () => {
  const errs = PACK.validateAll();
  assert.deepEqual(errs, [], 'structural errors:\n' + errs.join('\n'));
  assert.equal(PACK.LESSONS.length, 8);
});

test('lessons cover all four subjects, two each, and all declare grade 7', () => {
  assert.deepEqual(PACK.ordered().map(l => l.lesson_id),
    ['en-l1', 'en-l2', 'ma-l1', 'ma-l2', 'sc-l1', 'sc-l2', 'ss-l1', 'ss-l2']);
  PACK.ordered().forEach(l => {
    assert.equal(l.grade, 7, l.lesson_id + ' is not marked grade 7');
    assert.ok(l.title && l.objective, l.lesson_id + ' has no title or objective');
  });
});

// Straight from the pack's own build rules for a lesson: a reading, a visual,
// at least one game, a mini challenge, and no more than six new key words.
test('every lesson has the parts the pack\'s flow requires', () => {
  PACK.ordered().forEach(l => {
    assert.ok(l.read && l.read.paragraphs && l.read.paragraphs.length,
      l.lesson_id + ' has no reading');
    assert.ok(l.visual && l.visual.svg, l.lesson_id + ' has no visual');
    assert.ok(l.visual.alt, l.lesson_id + ' visual has no alt text');
    assert.ok(l.games.length >= 1, l.lesson_id + ' has no games');
    assert.ok(l.challenge && l.challenge.prompt, l.lesson_id + ' has no mini challenge');
    assert.ok(l.keyWords.length >= 2 && l.keyWords.length <= 6,
      l.lesson_id + ' introduces ' + l.keyWords.length + ' key words; the pack allows 6');
  });
});

// The two scaffolds the pack supplies — sentence frames and the short "easy
// rule" notes — reach the child through the Look step. A lesson whose notes
// were dropped in transcription would still render, just with less help.
test('the pack\'s own scaffolds survived transcription', () => {
  const notes = {};
  PACK.ordered().forEach(l => { notes[l.lesson_id] = (l.notes || []).length; });
  assert.equal(notes['en-l1'], 2, 'English L1 lost its sentence frames or quick help');
  assert.equal(notes['en-l2'], 2, 'English L2 lost its easy rule or sentence frames');
  assert.equal(notes['ss-l2'], 1, 'Social Studies L2 lost its events list');
  PACK.ordered().forEach(l => {
    (l.notes || []).forEach(n => {
      assert.ok(n.label, l.lesson_id + ' has a notes block with no label');
      assert.ok(n.lines.length, l.lesson_id + ' has an empty notes block');
    });
  });
});

// The pack's flow names a two-question warm-up and a "Try Together" step with
// guided examples, and the engine renders the step only when the lesson has the
// content for it. The teacher authorised writing the missing ones in; what must
// hold now is that no lesson is left with an empty step, because an empty step
// is one the driver skips without telling anyone.
test('every lesson fills the warm-up and the guided-example step', () => {
  PACK.ordered().forEach(l => {
    assert.equal(l.warmup.length, 2,
      l.lesson_id + ' has ' + l.warmup.length + ' warm-up questions; the flow asks for two');
    assert.equal(l.guided.length, 2,
      l.lesson_id + ' has ' + l.guided.length + ' guided examples; the flow asks for two');
  });
});

// The warm-up is the first thing a child sees and the pack's rule for it is
// "very easy". It is also the step with the least transcribed content behind
// it, so it is the one most likely to be got wrong by a later edit. These are
// the properties that make a warm-up usable, checked together.
test('every warm-up question is answerable and comes before the teaching', () => {
  PACK.ordered().forEach(l => {
    l.warmup.forEach((it, i) => {
      const where = l.lesson_id + ' warm-up ' + (i + 1);
      assert.ok(it.prompt, where + ' has no question');
      assert.ok(it.hint, where + ' has no hint; a warm-up a child cannot finish is a wall');
      assert.ok(it.engine === 'MULTIPLE_CHOICE' || it.engine === 'TRUE_FALSE',
        where + ' uses ' + it.engine + '; a warm-up should be one tap');
      if (it.engine === 'MULTIPLE_CHOICE') {
        assert.ok(it.choices.indexOf(it.answer) !== -1, where + ': answer is not among its choices');
      }
      if (it.engine === 'TRUE_FALSE') assert.equal(typeof it.answer, 'boolean', where + ': answer is not a boolean');
    });
    // The warm-up opening the topic is what makes it a warm-up rather than a
    // quiz; it must be the step the driver renders first.
    assert.equal(D.STEPS[0], 'warmup', 'the warm-up is no longer the first step');
  });
});

// The teacher's material is the pack, and it must stay the majority of it. Each
// authored item says so in the data file, so the ones to review are findable by
// name rather than by guessing which questions were in the original.
test('every authored item is tagged, and no lesson is entirely authored', () => {
  PACK.ordered().forEach(l => {
    const all = l.warmup.concat(l.games, l.guided, l.challenge ? [l.challenge] : []);
    const mine = all.filter(it => it.authored);
    assert.ok(mine.length < all.length,
      l.lesson_id + ' is entirely authored — none of the teacher\'s content survives in it');
    // An item the teacher did not write but that is not flagged is the failure
    // this catches: it would read as the pack's own words to whoever reviews it.
    l.warmup.forEach((it, i) => {
      assert.equal(it.authored, true,
        l.lesson_id + ' warm-up ' + (i + 1) + ' is not marked authored');
    });
  });
});



test('every engine the content names is one the module implements', () => {
  const impl = ENGINE_CODE.match(/ENGINES\.([A-Z_]+)\s*=/g)
    .map(s => s.replace('ENGINES.', '').replace(/\s*=$/, ''));
  const problems = [];
  allItems(PACK).forEach(({ lesson, item }) => {
    if (impl.indexOf(item.engine) === -1) {
      problems.push(lesson.lesson_id + ': ' + item.engine + ' has no renderer');
    }
  });
  assert.deepEqual(problems, [], problems.join('\n'));
});

// The three the Grade 7 pack names that the Grade 2 pack never used. If one of
// these renderers were lost, its games would vanish from the lesson without an
// error — so they are asserted by name, not just counted.
test('the three new engines are implemented and actually used', () => {
  const used = new Set(allItems(PACK).map(x => x.item.engine));
  ['RATIO_BUILDER', 'EQUATION_BALANCE', 'SENTENCE_FRAME'].forEach(e => {
    assert.ok(used.has(e), e + ' is not used by any Grade 7 item');
    assert.match(ENGINE_CODE, new RegExp('ENGINES\\.' + e + '\\s*='),
      e + ' has no renderer in lesson-pack.js');
  });
  // And they must be declared, or the data module's own validator flags every
  // item using one as an unknown engine.
  ['RATIO_BUILDER', 'EQUATION_BALANCE', 'SENTENCE_FRAME'].forEach(e => {
    assert.ok(D.ENGINE_IDS.indexOf(e) !== -1, e + ' is not in ENGINE_IDS');
  });
});

/* -------------------------------------------------------------- integrity */

// A matching game is the one engine where the content's shape can make the
// engine wrong rather than the other way round. Real sets group — three
// colonies in the Middle region, three animals that live in the ocean — and an
// engine that matched by position would put identical cards in front of a child
// and mark two of the three right answers wrong. The check must be by value,
// and the cards must be one per value.
test('matching games accept a right answer however a child reaches it', () => {
  const grouping = allItems(PACK).filter(x => x.item.engine === 'MATCH_PAIRS' &&
    new Set(x.item.pairs.map(p => p[1])).size !== x.item.pairs.length);
  assert.ok(grouping.length, 'no Grade 7 matching game groups values — this guard is untested');

  assert.match(ENGINE_CODE, /values\.indexOf\(p\[1\]\) === -1/,
    'MATCH_PAIRS no longer de-duplicates its right-hand values');
  assert.match(ENGINE_CODE, /left\[li\]\.with === r\.text/,
    'MATCH_PAIRS no longer checks a match by value — identical cards would be a guess');
  assert.equal(/li === r\.i/.test(ENGINE_CODE), false,
    'MATCH_PAIRS is matching by position again');
  // The right card has to stay usable: three colonies share one region card.
  assert.equal(/selectedLeft\.disabled = true; b\.disabled = true;/.test(ENGINE_CODE), false,
    'MATCH_PAIRS disables a right-hand card after one match, making a grouped set unfinishable');
});

test('everything a child is asked is answerable from what they are shown', () => {
  const bad = [];
  allItems(PACK).forEach(({ lesson, item }) => {
    const where = lesson.lesson_id + '/' + (item.id || item.engine);

    if (item.engine === 'MULTIPLE_CHOICE' || item.engine === 'AUDIO_CHOICE') {
      if (item.choices.indexOf(item.answer) === -1) {
        bad.push(where + ': answer is not among its choices');
      }
      if (item.choices.length < 2) bad.push(where + ': fewer than two choices');
      if (new Set(item.choices).size !== item.choices.length) {
        bad.push(where + ': a choice is listed twice');
      }
    }

    if (item.engine === 'TRUE_FALSE' && typeof item.answer !== 'boolean') {
      bad.push(where + ': true/false answer is not a boolean');
    }

    if (item.engine === 'FILL_BLANK') {
      if (!item.answer) bad.push(where + ': has no answer');
      if (item.mode === 'bank') {
        if (!Array.isArray(item.bank) || !item.bank.length) {
          bad.push(where + ': bank mode with no bank');
        } else if (item.bank.indexOf(item.answer) === -1) {
          bad.push(where + ': "' + item.answer + '" is not in its own word bank');
        }
      }
    }

    if (item.engine === 'SORT') {
      item.cards.forEach(c => {
        if (item.bins.indexOf(c.bin) === -1) {
          bad.push(where + ': card "' + c.text + '" names a bin that does not exist');
        }
      });
      item.bins.forEach(b => {
        if (!item.cards.some(c => c.bin === b)) bad.push(where + ': bin "' + b + '" has no cards');
      });
    }

    if (item.engine === 'DRAG_DROP') {
      item.cards.forEach(c => {
        if (item.boxes.indexOf(c.box) === -1) {
          bad.push(where + ': card "' + c.text + '" names a box that does not exist');
        }
      });
    }

    if (item.engine === 'SEQUENCE') {
      if (!Array.isArray(item.items) || item.items.length < 3) {
        bad.push(where + ': a sequence needs at least three things to order');
      }
      if (new Set(item.items).size !== item.items.length) {
        bad.push(where + ': the sequence repeats an item, so its order is ambiguous');
      }
    }

    if (item.engine === 'MATCH_PAIRS') {
      if (item.pairs.length < 2) bad.push(where + ': fewer than two pairs to match');
      item.pairs.forEach(p => {
        if (!Array.isArray(p) || p.length !== 2 || !p[0] || !p[1]) {
          bad.push(where + ': a pair is not a left and a right value');
        }
      });
    }

    if (item.engine === 'RATIO_BUILDER') {
      if (!/^\d+\s*:\s*\d+$/.test(item.answer)) {
        bad.push(where + ': ratio answer "' + item.answer + '" is not n : n');
      }
      if (!Array.isArray(item.labels) || item.labels.length !== 2) {
        bad.push(where + ': a ratio needs two labels');
      }
    }

    if (item.engine === 'EQUATION_BALANCE') {
      if (!/^-?\d+(\.\d+)?$/.test(String(item.answer))) {
        bad.push(where + ': equation answer "' + item.answer + '" is not a number');
      }
      if (!/=/.test(item.prompt)) bad.push(where + ': the equation has no equals sign');
    }

    if (item.engine === 'SENTENCE_FRAME') {
      // Independent of the data module's own check: the tiles must contain the
      // answer's words, no more and no fewer, or the sentence cannot be built.
      const need = String(item.answer).split(/\s+/).filter(Boolean);
      const have = item.words.slice();
      need.forEach(w => {
        const at = have.indexOf(w);
        if (at === -1) bad.push(where + ': no tile for "' + w + '"');
        else have.splice(at, 1);
      });
      if (have.length) bad.push(where + ': unused tiles: ' + have.join(', '));
    }

    if (item.hint != null && typeof item.hint !== 'string') {
      bad.push(where + ': hint is not text');
    }
  });
  assert.deepEqual(bad, [], bad.join('\n'));
});

// renderRetry finds the questions to re-ask by id, and the third-strike "Go on"
// button records the miss by id. An item with no id can be neither re-asked nor
// recorded, so a lesson containing one stalls the retry step silently.
test('every scored item carries an id, and ids are shared only by a game\'s rounds', () => {
  const all = allItems(PACK);
  all.forEach(({ lesson, item }) => {
    assert.ok(item.id, lesson.lesson_id + ': a ' + item.engine + ' item has no id');
    assert.match(item.id, /^[a-z]{2}-l\d-[a-z0-9]+$/,
      lesson.lesson_id + ': id "' + item.id + '" does not follow the pack\'s convention');
  });

  // Rounds of one game deliberately share the game's id — that is what makes
  // the game, not the blank, the unit of scoring. Anything else sharing an id
  // would let one question's result overwrite another's.
  const byId = {};
  all.forEach(({ lesson, item }) => {
    (byId[item.id] = byId[item.id] || []).push(lesson.lesson_id + '/' + item.engine);
  });
  Object.keys(byId).forEach(id => {
    const where = byId[id];
    if (where.length === 1) return;
    const engines = new Set(where);
    assert.equal(engines.size, 1, id + ' is shared by different engines: ' + where.join(', '));
    // Repeated rounds must be adjacent in the lesson's game list, or the
    // engine's grouping would render them as separate games with one round each.
    const names = all.filter(x => x.item.id === id).map(x => x.item.name);
    assert.equal(new Set(names).size, 1, id + ' is shared by games with different names');
  });
});

/* -------------------------------------------------------------- the review */

test('the master review is four rounds of two, one round per subject', () => {
  assert.ok(Array.isArray(PACK.REVIEW) && PACK.REVIEW.length === 4,
    'the review is not four rounds');
  PACK.REVIEW.forEach((round, i) => {
    assert.equal(round.items.length, 2, 'round ' + (i + 1) + ' is not two questions');
    round.items.forEach(it => {
      assert.ok(it.id, 'a review question has no id');
      assert.ok(it.engine === 'MULTIPLE_CHOICE' || it.engine === 'FILL_BLANK',
        'review question ' + it.id + ' uses ' + it.engine);
      if (it.engine === 'MULTIPLE_CHOICE') {
        assert.ok(it.choices.indexOf(it.answer) !== -1,
          it.id + ': answer is not among its choices');
      }
    });
  });
  // Every question id unique, so the review's own results map cannot collide.
  const ids = PACK.REVIEW.reduce((a, r) => a.concat(r.items.map(i => i.id)), []);
  assert.equal(new Set(ids).size, ids.length, 'the review repeats a question id');
});

/* -------------------------------------------- the Grade 2 pack is untouched */

test('assembling the Grade 7 pack did not disturb the default Grade 2 pack', () => {
  // The default pack is built by the module at load time from the Grade 2
  // content files. A shared mutable array anywhere in build() would show up
  // here as the page that declares nothing rendering Grade 7 lessons.
  assert.equal(D.GRADE, 2);
  assert.equal(D.LESSONS.length, 8);
  D.ordered().forEach(l => assert.equal(l.grade, 2, l.lesson_id + ' is no longer grade 2'));
  D.BADGES.forEach(b => assert.ok(b.lessons.every(id => D.LESSON_ORDER.indexOf(id) !== -1),
    b.id + ' names a lesson the Grade 2 pack does not contain'));
});

test('the two packs share no content object', () => {
  const g7 = PACK.ordered().map(l => l.lesson_id);
  D.ordered().forEach(l => {
    assert.ok(g7.indexOf(l.lesson_id) !== -1, l.lesson_id + ' is missing from the Grade 7 pack');
  });
  // Same ids, different content — the Grade 7 reading must not be the Grade 2
  // one, which is what a stray shared module would produce.
  const pair = D.ordered().map(g2 => {
    const other = PACK.byId(g2.lesson_id);
    return g2.title === other.title && g2.read.paragraphs.join(' ') === other.read.paragraphs.join(' ');
  });
  assert.equal(pair.some(Boolean), false, 'a Grade 7 lesson still carries its Grade 2 content');
});
