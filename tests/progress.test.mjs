'use strict';

/* ============================================================================
   Lesson pack progress merge.

   These exercise the same module the Worker imports, not a reimplementation.
   The merge is the whole reason a public write route is acceptable here, so
   the adversarial cases matter more than the happy path.
   ========================================================================== */

import test from 'node:test';
import assert from 'node:assert/strict';

// Imported the same way the Worker imports it, so these tests exercise the
// shipping module rather than a copy of it.
import {
  mergeProgress, sanitizeProgress, earnedBadges, LESSON_IDS
} from '../src/progress.js';

function lesson(over) {
  return Object.assign(
    { stars: 3, firstTryCorrect: 7, total: 7, attempts: 1, retryCleared: true, done: true },
    over
  );
}

/* ------------------------------------------------------------- sanitising */

test('a record is coerced to a fixed shape with fixed keys', () => {
  const s = sanitizeProgress({ lessons: { 'en-l1': { stars: '2', total: 7.9 } } });
  assert.deepEqual(Object.keys(s.lessons), ['en-l1']);
  assert.equal(s.lessons['en-l1'].stars, 2);
  assert.equal(s.lessons['en-l1'].total, 7);
  assert.equal(s.lessons['en-l1'].attempts, 0);
  assert.equal(s.lessons['en-l1'].done, false);
});

test('unknown lesson ids and badges are dropped, not stored', () => {
  // Otherwise this public route is free-form storage for anyone who finds it.
  const s = sanitizeProgress({
    lessons: { 'en-l1': lesson(), 'not-a-lesson': lesson(), '../../evil': lesson() },
    badges: ['story-detective', 'made-up-badge']
  });
  assert.deepEqual(Object.keys(s.lessons), ['en-l1']);
  assert.deepEqual(s.badges, ['story-detective']);
});

test('nonsense values become zero rather than poisoning the record', () => {
  const s = sanitizeProgress({
    lessons: { 'en-l1': { stars: -5, firstTryCorrect: NaN, total: Infinity, attempts: 'x' } }
  });
  assert.equal(s.lessons['en-l1'].stars, 0);
  assert.equal(s.lessons['en-l1'].firstTryCorrect, 0);
  assert.equal(s.lessons['en-l1'].total, 0);
  assert.equal(s.lessons['en-l1'].attempts, 0);
});

test('a hostile client cannot exceed the star ceiling', () => {
  const s = sanitizeProgress({ lessons: { 'en-l1': { stars: 9999, total: 7, done: true } } });
  assert.equal(s.lessons['en-l1'].stars, 3);
});

test('junk input yields an empty record instead of throwing', () => {
  [null, undefined, 'nope', 42, [], { lessons: 'nope' }].forEach(input => {
    const s = sanitizeProgress(input);
    assert.deepEqual(s.lessons, {}, `failed for ${JSON.stringify(input)}`);
    assert.deepEqual(s.badges, []);
  });
});

/* ----------------------------------------------------------------- merging */

test('merging takes the best of both sides', () => {
  const stored = { lessons: { 'en-l1': lesson({ stars: 1, firstTryCorrect: 3, attempts: 2 }) } };
  const incoming = { lessons: { 'en-l1': lesson({ stars: 3, firstTryCorrect: 7, attempts: 1 }) } };
  const m = mergeProgress(stored, incoming);
  assert.equal(m.lessons['en-l1'].stars, 3);
  assert.equal(m.lessons['en-l1'].firstTryCorrect, 7);
  assert.equal(m.lessons['en-l1'].attempts, 2, 'attempts take the higher count');
});

test('a bad push can never lower a good record', () => {
  // This is the property that makes a public write route survivable.
  const stored = { lessons: { 'en-l1': lesson({ stars: 3, firstTryCorrect: 7 }) } };
  const incoming = { lessons: { 'en-l1': lesson({ stars: 1, firstTryCorrect: 1, done: false }) } };
  const m = mergeProgress(stored, incoming);
  assert.equal(m.lessons['en-l1'].stars, 3);
  assert.equal(m.lessons['en-l1'].firstTryCorrect, 7);
  assert.equal(m.lessons['en-l1'].done, true, 'done is sticky');
});

test('an empty push leaves the stored record untouched', () => {
  const stored = { lessons: { 'en-l1': lesson(), 'ma-l1': lesson({ stars: 2 }) } };
  const m = mergeProgress(stored, {});
  assert.equal(m.lessons['en-l1'].stars, 3);
  assert.equal(m.lessons['ma-l1'].stars, 2);
});

test('merging is idempotent, so a client can push its whole state at any time', () => {
  const a = { lessons: { 'en-l1': lesson() } };
  const b = { lessons: { 'sc-l1': lesson({ stars: 2, firstTryCorrect: 6, total: 8 }) } };
  const once = mergeProgress(a, b);
  const twice = mergeProgress(once, b);
  const thrice = mergeProgress(twice, once);
  assert.deepEqual(thrice.lessons, once.lessons);
  assert.deepEqual(thrice.badges, once.badges);
});

test('merging is order-independent', () => {
  const a = { lessons: { 'en-l1': lesson({ stars: 2, attempts: 3 }) } };
  const b = { lessons: { 'en-l1': lesson({ stars: 3, attempts: 1 }) } };
  assert.deepEqual(mergeProgress(a, b).lessons, mergeProgress(b, a).lessons);
});

test('a client cannot claim a badge without the lessons behind it', () => {
  // Badges are derived server-side; the dashboard reads them.
  const m = mergeProgress(null, {
    lessons: { 'en-l1': lesson() },
    badges: ['grade2-explorer', 'story-detective']
  });
  assert.deepEqual(m.badges, [], 'one English lesson earns no badge at all');

  const m2 = mergeProgress(m, { lessons: { 'en-l2': lesson() } });
  assert.deepEqual(m2.badges, ['story-detective']);
});

test('all eight lessons earn all five badges', () => {
  const lessons = {};
  LESSON_IDS.forEach(id => { lessons[id] = lesson(); });
  const m = mergeProgress(null, { lessons });
  assert.deepEqual(m.badges.sort(), [
    'community-explorer', 'grade2-explorer', 'number-builder',
    'story-detective', 'young-scientist'
  ]);
});

test('firstTryCorrect can never exceed the lesson total', () => {
  // A record claiming 9 of 7 would render a nonsense percentage.
  const m = mergeProgress(null, { lessons: { 'en-l1': lesson({ firstTryCorrect: 9, total: 7 }) } });
  assert.equal(m.lessons['en-l1'].firstTryCorrect, 7);
});

test('two different students never see each other\'s record', () => {
  // mergeProgress is per-record; the route keys by student. Assert the record
  // it returns carries no other student's lessons.
  const a = { lessons: { 'en-l1': lesson() } };
  const m = mergeProgress(a, { lessons: { 'ma-l1': lesson() } });
  assert.equal(Object.keys(m.lessons).length, 2);
  assert.deepEqual(Object.keys(m.lessons).sort(), ['en-l1', 'ma-l1']);
});

test('a record cannot grow without bound', () => {
  const spam = { lessons: {} };
  LESSON_IDS.forEach(id => { spam.lessons[id] = lesson(); });
  for (let i = 0; i < 50; i++) spam.lessons['extra-' + i] = lesson();
  const m = mergeProgress(null, spam);
  assert.equal(Object.keys(m.lessons).length, 8, 'only the eight real lessons are kept');
});
