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
   ========================================================================== */

export const LESSON_IDS = [
  'en-l1', 'en-l2', 'ma-l1', 'ma-l2', 'sc-l1', 'sc-l2', 'ss-l1', 'ss-l2'
];

export const BADGES = [
  { id: 'story-detective', lessons: ['en-l1', 'en-l2'] },
  { id: 'number-builder', lessons: ['ma-l1', 'ma-l2'] },
  { id: 'young-scientist', lessons: ['sc-l1', 'sc-l2'] },
  { id: 'community-explorer', lessons: ['ss-l1', 'ss-l2'] },
  { id: 'grade2-explorer', lessons: LESSON_IDS }
];

export const BADGE_IDS = BADGES.map(b => b.id);

const MAX_ATTEMPTS = 999;
const MAX_STARS = 3;

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
export function sanitizeProgress(input) {
  const out = { lessons: {}, badges: [], updatedAt: null };

  const lessons = (input && typeof input.lessons === 'object' && input.lessons) || {};
  for (const id of LESSON_IDS) {
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
  out.badges = BADGE_IDS.filter(b => badges.includes(b));

  if (input && typeof input.updatedAt === 'string') out.updatedAt = input.updatedAt;
  return out;
}
// Max-wins, union for badges, and totals recomputed rather than trusted.
// Idempotent: merging the same record twice equals merging it once, so a
// client can push its whole local state as often as it likes.
export function mergeProgress(stored, incoming) {
  const a = sanitizeProgress(stored);
  const b = sanitizeProgress(incoming);
  const out = { lessons: {}, badges: [], updatedAt: b.updatedAt || a.updatedAt || null };

  for (const id of LESSON_IDS) {
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

  out.badges = earnedBadges(out.lessons);
  return out;
}

// Badges are derived, never accepted. A client that claims a badge without the
// lessons to back it would otherwise be stored as-is, and the parent dashboard
// reads these.
export function earnedBadges(lessons) {
  return BADGES.filter(b =>
    b.lessons.every(id => lessons[id] && lessons[id].done)
  ).map(b => b.id);
}
