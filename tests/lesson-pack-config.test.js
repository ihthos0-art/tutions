'use strict';

/* ============================================================================
   The lesson pack is shared by more than one student page.

   Two pages now mount it — nabila-naviha.html (Grade 2) and nafis.html
   (Grade 7) — and they run the *same* engine and the *same* data module. The
   page supplies its own identity through `window.LessonPackConfig`, and every
   key of that config is optional.

   That makes one property worth testing above all others: the page that
   declares nothing must behave exactly as it did before the module was shared.
   The Grade 2 page is live and in use, so a regression there is not a test
   failure, it is a broken lesson for a real student. These tests assert both
   halves — the default is untouched, and the config actually takes effect.
   ========================================================================== */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const D = require('../lesson-pack.data.js');

const ROOT = path.join(__dirname, '..');
const ENGINE_SRC = fs.readFileSync(path.join(ROOT, 'lesson-pack.js'), 'utf8');
const DATA_SRC = fs.readFileSync(path.join(ROOT, 'lesson-pack.data.js'), 'utf8');
const GRADE2_PAGE = fs.readFileSync(path.join(ROOT, 'archive/legacy-pages/nabila-naviha-worksheet.html'), 'utf8');
const GRADE7_PAGE = fs.readFileSync(path.join(ROOT, 'archive/legacy-pages/nafis-worksheet.html'), 'utf8');

// The source scans must look at code, not prose — the header comments quote the
// config keys and the storage prefixes they are explaining.
function stripJsComments(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}
const ENGINE_CODE = stripJsComments(ENGINE_SRC);
const DATA_CODE = stripJsComments(DATA_SRC);

const emptyPack = (cfg) => D.build([], [], [], [], cfg);

/* ------------------------------------------------- the default is unchanged */

test('a page that declares no config still gets the Grade 2 pack', () => {
  assert.equal(D.GRADE, 2);
  assert.equal(D.LESSONS.length, 8);
  assert.equal(D.LESSON_ORDER.length, 8);
  assert.equal(D.REVIEW, null, 'the Grade 2 review rounds are built into the engine');
});

test('the default storage key and student are still the Grade 2 page\'s', () => {
  // Not read from a running page — read from the fallback the engine applies
  // when window.LessonPackConfig is absent.
  assert.match(ENGINE_CODE, /CFG\.storageKey \|\| 'g2pack:nabila-naviha'/);
  assert.match(ENGINE_CODE, /CFG\.student \|\| 'nabila-naviha'/);
  assert.match(ENGINE_CODE, /CFG\.grade \|\| D\.GRADE \|\| 2/);
});

test('the Grade 2 page declares no config, so it takes every default', () => {
  assert.equal(/LessonPackConfig/.test(GRADE2_PAGE), false,
    'nabila-naviha.html now sets a config — its defaults are no longer being exercised');
});

test('the five Grade 2 badges are exactly the pack\'s five, over its own lessons', () => {
  assert.deepEqual(D.BADGES.map(b => b.id), [
    'story-detective', 'number-builder', 'young-scientist',
    'community-explorer', 'grade2-explorer'
  ]);
  assert.deepEqual(D.BADGES.map(b => b.label), [
    'Story Detective', 'Number Builder', 'Young Scientist',
    'Community Explorer', 'Grade 2 Explorer'
  ]);
  // Each subject badge covers that subject's two lessons, and no others.
  D.BADGES.forEach(b => {
    if (b.id === 'grade2-explorer') return;
    assert.equal(b.lessons.length, 2, b.id + ' should name exactly two lessons');
    const prefix = b.lessons[0].slice(0, 2);
    b.lessons.forEach(id => assert.equal(id.slice(0, 2), prefix,
      b.id + ' names a lesson from another subject'));
  });
  assert.equal(D.BADGES[4].lessons.length, 8);
});

/* ---------------------------------------------------- the config takes effect */

test('a pack of another grade reports its own grade, not the default', () => {
  const g7 = emptyPack({ grade: 7, student: 'nafis', storageKey: 'g7pack:nafis' });
  assert.equal(g7.GRADE, 7);
  // The last badge in the list is always the all-lessons one, and the data
  // module's default list is five long — only the page supplies seven named
  // badges. Indexing from the end is what this test actually means.
  const explorer = g7.BADGES[g7.BADGES.length - 1];
  assert.equal(explorer.id, 'grade7-explorer');
  assert.equal(explorer.label, 'Grade 7 Explorer');
});

test('lesson validation expects the configured grade, not grade 2', () => {
  const g7 = emptyPack({ grade: 7 });
  const lesson = {
    lesson_id: 'en-l1', grade: 3, title: 'x', objective: 'y',
    read: { paragraphs: ['p'] }, visual: { svg: 's', alt: 'a' },
    games: [], guided: [], challenge: { engine: 'SHORT_ANSWER', prompt: 'q', accept: ['a'] }
  };
  assert.ok(g7.validateLesson(lesson).includes('en-l1: grade must be 7'),
    'a grade 3 lesson was accepted by a grade 7 pack');

  assert.deepEqual(g7.validateLesson({ ...lesson, grade: 7 }), [],
    'a valid grade 7 lesson should raise nothing');
});

// The lesson_id prefix is not decoration: lessonsFor() routes a lesson to its
// tab by it (en- → ELA, ma- → Math, sc- → Science, ss- → Social Studies). An id
// that does not follow the convention does not error — the lesson simply never
// appears on any tab, which is the kind of failure nobody sees until a student
// says the lesson is missing.
test('a lesson reaches a tab only if its id follows the subject convention', () => {
  const make = (id) => ({
    subject: 'English', lesson_id: id, grade: 7, title: 't', objective: 'o',
    read: { paragraphs: ['p'] }, visual: { svg: 's', alt: 'a' },
    games: [], guided: [], challenge: { engine: 'SHORT_ANSWER', prompt: 'q', accept: ['a'] }
  });

  const good = D.build([make('en-l1')], [], [], [], { grade: 7, lessonOrder: ['en-l1'] });
  assert.deepEqual(good.BADGES[0].lessons, ['en-l1']);
  assert.deepEqual(good.BADGES[good.BADGES.length - 1].lessons, ['en-l1']);

  // 'xx-l1' loads and validates, but matches no subject prefix — it would
  // render nowhere and earn nothing.
  const stray = D.build([make('xx-l1')], [], [], [], { grade: 7, lessonOrder: ['xx-l1'] });
  assert.deepEqual(stray.BADGES[0].lessons, [],
    'an off-convention id silently joins no subject');
  ['en-', 'ma-', 'sc-', 'ss-'].forEach(prefix => {
    const routed = stray.LESSONS.filter(l => l.lesson_id.indexOf(prefix) === 0);
    assert.equal(routed.length, 0, 'xx-l1 was routed to ' + prefix);
  });
});


test('the lesson count a pack is checked against comes from its own order', () => {
  const g7 = emptyPack({ grade: 7, lessonOrder: ['en-l1', 'ma-l1'] });
  const errs = g7.validateAll();
  assert.ok(errs.includes('expected 2 lessons, found 0'), errs.join('; '));
  assert.equal(errs.some(e => e.startsWith('missing lesson sc-')), false,
    'a two-lesson pack must not be checked against the Grade 2 eight');
});


/* ------------------------------------------- an empty pack must stay harmless */

test('a page whose content has not landed earns no badges', () => {
  // The trap this guards: every() over an empty array is true, so a badge that
  // names no lessons is vacuously earned and a student is handed every badge
  // before a single lesson exists.
  const g7 = emptyPack({ grade: 7 });
  assert.deepEqual(g7.earnedBadges({ lessons: {} }), []);
  assert.deepEqual(g7.earnedBadges(g7.emptyProgress()), []);
});

test('an empty pack is still a valid object the engine can mount', () => {
  const g7 = emptyPack({ grade: 7 });
  assert.equal(g7.LESSONS.length, 0);
  assert.deepEqual(g7.ordered(), []);
  assert.equal(g7.byId('en-l1'), null);
  assert.deepEqual(g7.summarise(g7.emptyProgress()).rows, []);
  assert.deepEqual(g7.loadProgress({ getItem: () => null }, 'k'), g7.emptyProgress());
});

test('an empty pack still reports its grade, so the tab is not unbranded', () => {
  assert.equal(emptyPack({ grade: 7 }).GRADE, 7);
  assert.equal(emptyPack({ grade: 3 }).GRADE, 3);
});

/* -------------------------------------------------------------- the pages */

test('the Grade 7 page declares a student, grade, storage key and its content', () => {
  assert.match(GRADE7_PAGE, /window\.LessonPackConfig = \{/);
  assert.match(GRADE7_PAGE, /student: 'nafis'/);
  assert.match(GRADE7_PAGE, /grade: 7/);
  assert.match(GRADE7_PAGE, /storageKey: 'g7pack:nafis'/);
  ['G7PackEla', 'G7PackMath', 'G7PackScience', 'G7PackSocial', 'G7PackReview'].forEach(g => {
    assert.match(GRADE7_PAGE, new RegExp("'" + g + "'"), g + ' is not named as a content global');
  });
});

test('the storage prefix is not one the host page\'s reset button wipes', () => {
  // interactive.js derives its namespace from the page filename and deletes
  // every `<page>:*` key. On nafis.html that is `nafis:`, so the pack must not
  // store anything there — a student pressing the reset button they are meant
  // to press would silently erase every star.
  assert.match(DATA_CODE + ENGINE_CODE, /g7pack:nafis|g2pack:nabila-naviha/);
  assert.equal(/storageKey: 'nafis:/.test(GRADE7_PAGE), false,
    'the pack is storing under the prefix nafis.html\'s reset button deletes');
  assert.equal(/'g7pack:nafis:/.test(GRADE7_PAGE), false);
});

test('both pages load the shared engine and data modules', () => {
  [GRADE2_PAGE, GRADE7_PAGE].forEach((page, i) => {
    const name = i === 0 ? 'nabila-naviha.html' : 'nafis.html';
    assert.match(page, /<script src="lesson-pack\.data\.js/, name + ' does not load the data module');
    assert.match(page, /<script src="lesson-pack\.js/, name + ' does not load the engine');
  });
});

// Both pages load the same two files by URL, and static hosting caches by URL.
// If the engine changes and the version is bumped on one page but not the
// other, that page keeps serving the old engine from cache — and an old engine
// alongside new content renders blank tabs rather than failing loudly. The two
// pages must therefore always name the same version.
test('both pages request the shared modules at the same version', () => {
  const versionOf = (page, file) => {
    const m = new RegExp('src="' + file.replace(/\./g, '\\.') + '\\?v=([0-9]+)"').exec(page);
    assert.ok(m, 'no version found for ' + file);
    return m[1];
  };
  ['lesson-pack.data.js', 'lesson-pack.js'].forEach(file => {
    const a = versionOf(GRADE2_PAGE, file);
    const b = versionOf(GRADE7_PAGE, file);
    assert.equal(a, b, file + ' is v' + a + ' on nabila-naviha.html and v' + b +
      ' on nafis.html — bump both in the same commit, or one page serves a cached old engine');
  });
});

test('the engine reads its grade from the page, not from a hardcoded label', () => {
  assert.equal(/Grade 2'/.test(ENGINE_CODE), false,
    'a hardcoded Grade 2 label would show on every other student\'s page');
  assert.match(ENGINE_CODE, /' · Grade ' \+ GRADE/);
});

test('a pack with no lessons renders a placeholder rather than nothing', () => {
  // The engine must not early-return on an empty pack: that would leave each
  // tab visibly blank, which reads as broken rather than as unfinished.
  assert.equal(/if \(!D \|\| !D\.LESSONS\.length\) return;/.test(ENGINE_CODE), false,
    'init() still bails out on an empty pack, leaving blank tabs');
  assert.match(ENGINE_CODE, /is being prepared/);
});
