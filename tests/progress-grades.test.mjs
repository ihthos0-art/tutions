'use strict';

/* ============================================================================
   Two grades share one progress module, so the module has to know which
   lessons exist in which grade's pack.

   The failure this file exists to prevent: the client works out a student's
   badges from the pack it actually loaded, the server works them out from a
   table in src/progress.js, and if those two disagree the *server's* answer
   wins — the student page adopts the badges the POST returned. Get the table
   wrong and a Grade 7 student is handed a "Grade 2 Explorer" badge, on a page
   their parent also reads. Nothing errors; the badge is simply wrong.

   So these tests hold the server's table against the pages themselves.
   ========================================================================== */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

// This file is ESM because it imports the Worker's src/progress.js as ESM. The
// lesson-pack modules are CommonJS, so they come in through a require built
// from this file's own URL.
const require = createRequire(import.meta.url);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

// The data module is CommonJS-loadable, so the client's own derivation can be
// run in-process and compared with the server's — rather than reimplementing it
// here and testing the reimplementation.
const D = require('../lesson-pack.data.js');

const G7_CONTENT = {
  ela: require('../lesson-pack-g7-content-ela.js'),
  math: require('../lesson-pack-g7-content-math.js'),
  science: require('../lesson-pack-g7-content-science.js'),
  social: require('../lesson-pack-g7-content-social.js')
};
const G7_REVIEW = require('../lesson-pack-g7-content-review.js');

const NAFIS_PAGE = fs.readFileSync(path.join(ROOT, 'nafis.html'), 'utf8');
const G2_PAGE = fs.readFileSync(path.join(ROOT, 'nabila-naviha.html'), 'utf8');
const PARENT_PAGE = fs.readFileSync(path.join(ROOT, 'parent.html'), 'utf8');

// src/progress.js is ESM and the Worker imports it as such; load it the same
// way so these tests exercise the shipping module.
const progressMod = import('../src/progress.js');

// The page's own badge list, read out of nafis.html rather than restated here.
// It is written as JSON for exactly this reason: the page is the authority on
// what the student can earn, so the page is what the Worker's table is held
// against — a list copied into this file would only ever agree with itself.
function pageBadges(page) {
  const m = /badges:\s*(\[[\s\S]*?\n\s*\])/.exec(page);
  assert.ok(m, 'nafis.html no longer declares its badges as a JSON array');
  return JSON.parse(m[1]);
}

const grade7Pack = (cfg) => D.build(
  G7_CONTENT.ela, G7_CONTENT.math, G7_CONTENT.science, G7_CONTENT.social,
  Object.assign({ grade: 7, student: 'nafis', storageKey: 'g7pack:nafis' }, cfg || {}),
  G7_REVIEW
);

/* ------------------------------------------------------------------ grades */

test('the server\'s grade table names the grade each page declares', async () => {
  const P = await progressMod;

  // Read from the pages, not restated: the page is what the student actually
  // loads, so the page is the authority on which pack is running.
  assert.match(NAFIS_PAGE, /grade: 7/, 'nafis.html no longer declares Grade 7');
  assert.equal(P.gradeFor('nafis'), 7);

  assert.equal(/LessonPackConfig/.test(G2_PAGE), false,
    'nabila-naviha.html declares a config now — it is no longer the default');
  assert.equal(P.gradeFor('nabila-naviha'), 2);

  // An unknown student must land on the pack every page ran before the packs
  // were shared, not on an undefined grade.
  assert.equal(P.gradeFor('nobody-here'), 2);
  assert.equal(P.gradeFor(undefined), 2);
});

/* ------------------------------------------- the bug this file was born from */

test('a Grade 7 student is never handed the Grade 2 badge', async () => {
  const P = await progressMod;
  const lessons = {};
  P.lessonIdsFor(7).forEach(id => {
    lessons[id] = { stars: 3, firstTryCorrect: 7, total: 7, attempts: 1, done: true };
  });

  const g7 = P.mergeProgress(null, { lessons }, 7);
  assert.ok(g7.badges.includes('grade7-explorer'), 'Grade 7 Explorer was not earned');
  assert.equal(g7.badges.includes('grade2-explorer'), false,
    'a Grade 7 record earned the Grade 2 badge');
  assert.equal(g7.badges.includes('story-detective'), false,
    'a Grade 7 record earned a Grade 2 subject badge');
  assert.deepEqual(g7.badges.slice().sort(), [
    'ecosystem-explorer', 'equation-solver', 'grade7-explorer', 'history-explorer',
    'plant-scientist', 'ratio-ranger', 'text-detective'
  ]);

  // And a Grade 2 record must not be handed the Grade 7 one.
  const g2 = P.mergeProgress(null, { lessons }, 2);
  assert.ok(g2.badges.includes('grade2-explorer'));
  assert.equal(g2.badges.includes('grade7-explorer'), false);
  assert.equal(g2.badges.includes('text-detective'), false);
});

test('the same lesson ids are stored for both grades, but not the same badges', async () => {
  const P = await progressMod;
  const raw = { lessons: { 'en-l1': { stars: 1, total: 5, done: true } } };
  assert.deepEqual(Object.keys(P.sanitizeProgress(raw, 2).lessons), ['en-l1']);
  assert.deepEqual(Object.keys(P.sanitizeProgress(raw, 7).lessons), ['en-l1']);
  assert.deepEqual(P.sanitizeProgress({ badges: ['grade7-explorer'] }, 2).badges, []);
  assert.deepEqual(P.sanitizeProgress({ badges: ['grade7-explorer'] }, 7).badges, ['grade7-explorer']);
});

/* -------------------------------------------------- Grade 2 is left alone */

test('the Grade 2 export is still exactly the five original badges', async () => {
  const P = await progressMod;
  assert.deepEqual(P.BADGE_IDS, [
    'story-detective', 'number-builder', 'young-scientist',
    'community-explorer', 'grade2-explorer'
  ]);
  assert.deepEqual(P.LESSON_IDS, P.LESSONS_BY_GRADE[2]);
  assert.equal(P.LESSON_IDS.length, 8);
  // Every Grade 2 subject badge still names that subject's two lessons.
  P.badgesFor(2).forEach(b => {
    if (b.id === 'grade2-explorer') {
      assert.equal(b.lessons.length, 8);
      return;
    }
    assert.equal(b.lessons.length, 2, b.id + ' should name exactly two lessons');
    const prefix = b.lessons[0].slice(0, 2);
    b.lessons.forEach(id => assert.equal(id.slice(0, 2), prefix));
  });
});

test('a grade the table does not know falls back instead of half-working', async () => {
  const P = await progressMod;
  // The explorer badge must never be stamped with a grade the lesson list did
  // not come from — that pairing is what a badge means.
  const unknown = P.badgesFor(99);
  const explorer = unknown[unknown.length - 1];
  assert.equal(explorer.id, 'grade2-explorer',
    'badgesFor(99) stamped an explorer badge for a grade it has no lessons for');
  assert.equal(P.lessonIdsFor(99), P.LESSONS_BY_GRADE[2]);
});

/* ------------------------------- the server and the page must agree, exactly */

test('the badges the page derives are the badges the server derives', async () => {
  const P = await progressMod;
  const declared = pageBadges(NAFIS_PAGE);

  // Labels and icons are the page's own business — the server has no opinion on
  // how a badge is drawn. Ids and the lessons each one is measured against are
  // not: those decide whether a badge is *earned*, and only the server's answer
  // is stored.
  const page = declared.map(b => ({ id: b.id, lessons: b.lessons.slice().sort() }));
  const server = P.badgesFor(7).map(b => ({ id: b.id, lessons: b.lessons.slice().sort() }));
  assert.deepEqual(page, server,
    'nafis.html and src/progress.js disagree about which badges exist, or about ' +
    'which lessons earn them — the server\'s answer is the one the student sees');

  // And the page must be supplying the pack's own names, not the fallbacks:
  // the data module's default badge list is the Grade 2 one, so a page whose
  // cfg.badges was misspelled would silently hand out "Story Detective" here.
  const pack = grade7Pack({ badges: declared });
  assert.deepEqual(pack.BADGES.map(b => b.id), declared.map(b => b.id));
  assert.equal(pack.BADGES.some(b => b.id === 'story-detective'), false,
    'the Grade 7 page fell back to the Grade 2 badge list');
  declared.forEach(b => {
    assert.ok(b.label && b.icon, b.id + ' has no label or icon to show the student');
  });
});

// The loud one. src/progress.js drops any lesson id it does not know, so a
// Grade 7 lesson the table has not been told about would silently never be
// stored — the lesson would work on the page and leave no trace on the
// dashboard, and its badge could never be earned. This reads the content
// itself, so it fails on the commit that adds such a lesson.
test('every lesson the Grade 7 content declares is one the Worker will store', async () => {
  const P = await progressMod;
  const declared = Object.keys(G7_CONTENT).reduce((all, subject) => {
    G7_CONTENT[subject].forEach(l => {
      if (l && l.lesson_id) all.push(l.lesson_id);
    });
    return all;
  }, []);

  const unknown = declared.filter(id => !P.lessonIdsFor(7).includes(id));
  assert.deepEqual(unknown, [],
    'Grade 7 lessons missing from src/progress.js LESSONS_BY_GRADE[7]: ' + unknown.join(', ') +
    ' — add them there or their progress is dropped on the way to the dashboard');

  // The ids must obey the subject convention, because a badge is measured
  // against them and the engine routes a lesson to its tab by the prefix.
  declared.forEach(id => {
    assert.match(id, /^(en|ma|sc|ss)-l\d+$/, id + ' is not a subject-prefixed lesson id');
  });

  // Both packs must name the same eight, or a Grade 7 lesson would be dropped
  // on the way to the dashboard even though the page renders it.
  assert.deepEqual(P.lessonIdsFor(7).slice().sort(), declared.slice().sort(),
    'the Worker\'s Grade 7 lesson list and the Grade 7 content have drifted apart');
});

/* ------------------------------------------------------- the dashboard view */

test('the parent dashboard reads the progress route and renders it', () => {
  assert.match(PARENT_PAGE, /\/api\/progress\//,
    'the dashboard never asks for lesson progress — stars and badges stay invisible');
  assert.match(PARENT_PAGE, /renderProgressBlock/);
  // Progress-only students must still produce a card: a student who only did
  // lesson-pack work has no answers record to trigger the old early return.
  assert.match(PARENT_PAGE, /if \(!keys\.length && !progHtml\) return;/);
  // The retired Grade 7 keys are hidden from the answers list rather than
  // deleted from KV, matching how the Grade 2 drill was retired.
  assert.match(PARENT_PAGE, /'nafis': \['ela1-ci', 'ela1-detail', 'ela1-conn'\]/);
});

test('every badge the dashboard can be shown has a label', async () => {
  const P = await progressMod;
  // A badge id that reaches the dashboard with no label renders as raw
  // kebab-case. Both grades' badges must be covered.
  const labelled = /PROG_BADGES = \{[\s\S]*?\};/.exec(PARENT_PAGE);
  assert.ok(labelled, 'PROG_BADGES is gone from parent.html');
  P.badgesFor(2).concat(P.badgesFor(7)).forEach(b => {
    if (/^grade\d+-explorer$/.test(b.id)) return;   // built from the regex
    assert.ok(labelled[0].includes(b.id), b.id + ' has no label in parent.html');
  });
  assert.match(PARENT_PAGE, /\^grade\(\\d\+\)-explorer\$/,
    'the explorer badges are labelled by pattern, not by a hardcoded id');
});
