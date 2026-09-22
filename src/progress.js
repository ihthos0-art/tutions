/* ============================================================================
   Lesson pack progress: sanitising and merging.

   Kept in its own module so the Worker and the tests run the *same* code. The
   merge is the part that makes a public write route safe, so testing a
   reimplementation of it would test nothing.

   The route is public by necessity — the student page has no bearer token —
   which means any client can POST stars for any whitelisted student. The
   design that makes that acceptable is here: the merge is max-wins and
   idempotent, never last-write-wins. The worst a hostile or buggy POST can do
   is inflate one lesson's stars for one already-whitelisted student. It can
   never erase progress, never touch another student, and never grow the record
   without bound, because every field is coerced to a fixed shape before it is
   stored.

   Two student pages share this now — nabila-naviha.html (Grade 2) and
   nafis.html (Grade 4) — so "which lessons exist" and "which badges can be
   earned" are per-grade questions. Both answers live in the tables below, on
   the server, and NOT in the POST body: a client that could name its own grade
   could name its own badges. The pages declare their grade too, in
   `window.LessonPackConfig`; tests/progress-grades.test.mjs reads the pages and
   fails if the two ever drift apart.
   ========================================================================== */

const DEFAULT_GRADE = 2;

// Which grade each student page runs. A student not listed here falls back to
// the Grade 2 pack, which is what every page did before the packs were shared.
export const STUDENT_GRADES = {
  'nabila-naviha': 2,
  'nafis': 4
};

export function gradeFor(student) {
  return Object.prototype.hasOwnProperty.call(STUDENT_GRADES, student)
    ? STUDENT_GRADES[student]
    : DEFAULT_GRADE;
}

// The lessons each grade's pack declares, in pack order.
//
// This list does two jobs. It is the set a stored record is filtered against —
// an unknown id is dropped rather than stored, so this public route cannot be
// used as free-form storage — and it is the set a badge is measured against: a
// subject badge means *every* lesson of that subject in this grade's pack is
// done, so the list has to match the pack exactly.
//
// Grade 4's row is the pack's default order today, because the Grade 4 content
// has not been written yet and lesson-pack.data.js falls back to exactly these
// ids. When that content lands with different ids, this row must be updated —
// and tests/progress-grades.test.mjs reads the content files and fails with the
// ids to add, so it cannot be missed silently.
export const LESSONS_BY_GRADE = {
  2: ['en-l1', 'en-l2', 'ma-l1', 'ma-l2', 'sc-l1', 'sc-l2', 'ss-l1', 'ss-l2'],
  4: ['en-l1', 'en-l2', 'ma-l1', 'ma-l2', 'sc-l1', 'sc-l2', 'ss-l1', 'ss-l2']
};

export function lessonIdsFor(grade) {
  return LESSONS_BY_GRADE[grade] || LESSONS_BY_GRADE[DEFAULT_GRADE];
}

// Kept as a name because the Grade 2 pack is the default everywhere.
export const LESSON_IDS = LESSONS_BY_GRADE[DEFAULT_GRADE];

const MAX_ATTEMPTS = 999;
const MAX_STARS = 3;

// The four subject badges. Their ids are deliberately NOT grade-stamped: the
// pack hands out "Story Detective" at Grade 2 *and* at Grade 4. Only the
// all-lessons badge carries the grade, and that one is built below.
export const SUBJECT_BADGES = [
  { id: 'story-detective',    prefix: 'en' },
  { id: 'number-builder',     prefix: 'ma' },
  { id: 'young-scientist',    prefix: 'sc' },
  { id: 'community-explorer', prefix: 'ss' }
];

export function badgesFor(grade) {
  // Resolve through lessonIdsFor so the explorer badge id and the lesson list
  // can never describe two different grades.
  const g = LESSONS_BY_GRADE[grade] ? grade : DEFAULT_GRADE;
  const ids = lessonIdsFor(g);
  return SUBJECT_BADGES.map(b => ({
    id: b.id,
    lessons: ids.filter(id => id.slice(0, 2) === b.prefix)
  })).concat([{ id: 'grade' + g + '-explorer', lessons: ids }]);
}

// The Grade 2 names, kept exported because that is the default grade.
export const BADGES = badgesFor(DEFAULT_GRADE);
export const BADGE_IDS = BADGES.map(b => b.id);

function int(value, max) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, max);
}

function bool(value) {
  return value === true;
}

// Fixed shape, fixed keys. An unknown lesson id or badge id is dropped rather
// than stored, so a client cannot use this route as free-form storage.
export function sanitizeProgress(input, grade = DEFAULT_GRADE) {
  const out = { lessons: {}, badges: [], updatedAt: null };
  const allowed = lessonIdsFor(grade);

  const lessons = (input && typeof input.lessons === 'object' && input.lessons) || {};
  for (const id of allowed) {
    const r = lessons[id];
    if (!r || typeof r !== 'object') continue;
    const total = int(r.total, 999);
    out.lessons[id] = {
      stars: int(r.stars, MAX_STARS),
      // Clamped here rather than at the merge, so every path out of this
      // module is consistent: a record claiming 9 of 7 would render a
      // nonsense percentage on the parent dashboard.
      firstTryCorrect: Math.min(int(r.firstTryCorrect, 999), total),
      total,
      attempts: int(r.attempts, MAX_ATTEMPTS),
      retryCleared: bool(r.retryCleared),
      done: bool(r.done)
    };
  }

  const badges = Array.isArray(input && input.badges) ? input.badges : [];
  const badgeIds = badgesFor(grade).map(b => b.id);
  out.badges = badgeIds.filter(b => badges.includes(b));

  if (input && typeof input.updatedAt === 'string') out.updatedAt = input.updatedAt;
  return out;
}
// Max-wins, union for badges, and totals recomputed rather than trusted.
// Idempotent: merging the same record twice equals merging it once, so a
// client can push its whole local state as often as it likes.
export function mergeProgress(stored, incoming, grade = DEFAULT_GRADE) {
  const a = sanitizeProgress(stored, grade);
  const b = sanitizeProgress(incoming, grade);
  const out = { lessons: {}, badges: [], updatedAt: b.updatedAt || a.updatedAt || null };

  for (const id of lessonIdsFor(grade)) {
    const x = a.lessons[id];
    const y = b.lessons[id];
    if (!x && !y) continue;
    if (!x) { out.lessons[id] = y; continue; }
    if (!y) { out.lessons[id] = x; continue; }

    // `total` is a property of the lesson, not a score, so it is not merged by
    // maximum — a lesson whose total shrank would mean the content changed, and
    // the newer value is the truthful one. Everything else only ever improves.
    const total = y.total || x.total;
    out.lessons[id] = {
      stars: Math.max(x.stars, y.stars),
      firstTryCorrect: Math.min(Math.max(x.firstTryCorrect, y.firstTryCorrect), total || 999),
      total,
      attempts: Math.max(x.attempts, y.attempts),
      retryCleared: x.retryCleared || y.retryCleared,
      done: x.done || y.done
    };
  }

  out.badges = earnedBadges(out.lessons, grade);
  return out;
}

// Badges are derived, never accepted. A client that claims a badge without the
// lessons to back it would otherwise be stored as-is, and the parent dashboard
// reads these.
export function earnedBadges(lessons, grade = DEFAULT_GRADE) {
  return badgesFor(grade).filter(b =>
    b.lessons.length && b.lessons.every(id => lessons[id] && lessons[id].done)
  ).map(b => b.id);
}
