/* ============================================================================
   Grade 2 Interactive Lesson Pack — data aggregator and pure logic.

   Content itself lives in lesson-pack-content-{ela,math,science,social}.js,
   transcribed verbatim from the teacher's pack. This file holds only the
   parts that are logic rather than content, so node --test can exercise them
   without a DOM. Nothing here touches window/document.

   Pack basis: New York State Grade 2 expectations. Reference URLs are in the
   header comment of each content file.
   ========================================================================== */
(function (root, factory) {
  'use strict';
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory(
      require('./lesson-pack-content-ela.js'),
      require('./lesson-pack-content-math.js'),
      require('./lesson-pack-content-science.js'),
      require('./lesson-pack-content-social.js')
    );
  } else {
    root.LessonPackData = factory(
      root.G2PackEla || [], root.G2PackMath || [],
      root.G2PackScience || [], root.G2PackSocial || []
    );
  }
})(typeof window !== 'undefined' ? window : this, function (ela, math, science, social) {
  'use strict';

  /* ---------------------------------------------------------------- lessons */

  /* ------------------------------------------------------------- normalise */

  // The four content files arrived with two different game shapes: English,
  // Science and Social write one entry per engine item, while Math nests them
  // as {name, engine, items:[...]} because several of its games run in rounds.
  // Both are reasonable readings of the pack, so rather than rewrite content
  // to fit the engine, flatten Math's nesting here. One shape reaches the
  // engine and the tests, and no transcribed word is touched.
  //
  // `items` is overloaded and must not be flattened blindly: Math uses it for
  // rounds, but SEQUENCE uses it for the ordered list the student rearranges.
  // Only object entries are rounds; SEQUENCE's are strings, and flattening
  // those would shred one game into its individual sentences, each with no
  // list left to order. Hence the object test and the SEQUENCE exclusion.
  function isRoundSet(g) {
    return Array.isArray(g.items) && g.items.length &&
           typeof g.items[0] === 'object' && g.items[0] !== null &&
           !Array.isArray(g.items[0]) && g.engine !== 'SEQUENCE';
  }

  function flattenGames(games) {
    var out = [];
    (games || []).forEach(function (g, gi) {
      if (!isRoundSet(g)) { out.push(g); return; }
      g.items.forEach(function (it, ii) {
        var merged = {}, k;
        for (k in g) { if (k !== 'items') merged[k] = g[k]; }
        for (k in it) { merged[k] = it[k]; }
        if (!merged.engine) merged.engine = g.engine;
        if (!merged.name) merged.name = g.name || ('Game ' + (gi + 1));
        if (!merged.id) merged.id = (g.id || ('g' + (gi + 1))) + '-' + (ii + 1);
        out.push(merged);
      });
    });
    return out;
  }

  // An item with no engine but an `accept` list is an open written answer.
  // An item with no engine and no choices is a worked example, not a question.
  function engineFor(item) {
    if (item.engine) return item.engine;
    if (Array.isArray(item.accept) && item.accept.length && !item.choices) return 'SHORT_ANSWER';
    if (!item.choices) return 'WORKED_EXAMPLE';
    return 'MULTIPLE_CHOICE';
  }

  function normaliseItem(item) {
    var out = {};
    for (var k in item) out[k] = item[k];
    out.engine = engineFor(out);

    // One science challenge supplies its three options and an `accept` key but
    // no `answer` — the teacher's key is the accept list, so take it from
    // there rather than leaving the question unanswerable.
    if (!out.choices) { /* nothing to key */ }
    else if (out.answer == null && Array.isArray(out.accept) && out.accept.length) {
      out.answer = out.accept[0];
    }

    // Math's number-line rounds were transcribed as complete sentences
    // ("31 + 24 = 55"). Rendered as-is the question shows its own answer, so
    // the value after the equals sign becomes the blank. The equation's own
    // words are untouched; only the answer is moved out of sight.
    if (out.engine === 'NUMBER_LINE' && typeof out.prompt === 'string' && out.target != null) {
      out.prompt = out.prompt.replace(/=\s*-?\d+\s*$/, '= ?');
    }
    return out;
  }

  function normaliseLesson(lesson) {
    var out = {};
    for (var k in lesson) out[k] = lesson[k];
    out.games = flattenGames(lesson.games).map(normaliseItem);
    out.guided = (lesson.guided || []).map(normaliseItem);
    out.challenge = lesson.challenge ? normaliseItem(lesson.challenge) : null;
    return out;
  }

  var LESSONS = [].concat(ela || [], math || [], science || [], social || [])
    .map(normaliseLesson);

  // Canonical order: all four subjects, two lessons each.
  var LESSON_ORDER = ['en-l1', 'en-l2', 'ma-l1', 'ma-l2', 'sc-l1', 'sc-l2', 'ss-l1', 'ss-l2'];

  function byId(id) {
    for (var i = 0; i < LESSONS.length; i++) {
      if (LESSONS[i].lesson_id === id) return LESSONS[i];
    }
    return null;
  }

  // Sorted into LESSON_ORDER; any unknown id is appended rather than dropped,
  // so a content typo shows up as a visible extra lesson instead of vanishing.
  function ordered() {
    var out = [];
    LESSON_ORDER.forEach(function (id) {
      var l = byId(id);
      if (l) out.push(l);
    });
    LESSONS.forEach(function (l) {
      if (LESSON_ORDER.indexOf(l.lesson_id) === -1) out.push(l);
    });
    return out;
  }

  /* ----------------------------------------------------------------- badges */

  // Exactly the five badges the pack defines. Do not add more.
  var BADGES = [
    { id: 'story-detective',    label: 'Story Detective',    icon: '🕵',  lessons: ['en-l1', 'en-l2'] },
    { id: 'number-builder',     label: 'Number Builder',     icon: '🔢',  lessons: ['ma-l1', 'ma-l2'] },
    { id: 'young-scientist',    label: 'Young Scientist',    icon: '🌱',  lessons: ['sc-l1', 'sc-l2'] },
    { id: 'community-explorer', label: 'Community Explorer', icon: '🏙',  lessons: ['ss-l1', 'ss-l2'] },
    { id: 'grade2-explorer',    label: 'Grade 2 Explorer',   icon: '⭐',        lessons: LESSON_ORDER }
  ];

  // A badge is earned when every lesson it names is done. `progress.lessons`
  // is keyed by lesson id; done-ness is the record's own `done` flag.
  function earnedBadges(progress) {
    var done = (progress && progress.lessons) || {};
    return BADGES.filter(function (b) {
      return b.lessons.every(function (id) { return done[id] && done[id].done; });
    }).map(function (b) { return b.id; });
  }

  function badgeById(id) {
    for (var i = 0; i < BADGES.length; i++) if (BADGES[i].id === id) return BADGES[i];
    return null;
  }

  /* ------------------------------------------------------------------ stars */

  // The pack's stated scale: 1 star for finishing, 2 at 70% or better, 3 at
  // 90% or better, and "do not remove stars for mistakes". So this never
  // returns 0, and it is never inflated for retrying — only the first-try
  // score counts, or the teacher's percentages stop meaning anything.
  function computeStars(firstTryCorrect, total) {
    if (!total || total <= 0) return 1;
    var pct = (firstTryCorrect / total) * 100;
    if (pct >= 90) return 3;
    if (pct >= 70) return 2;
    return 1;
  }

  function percentage(firstTryCorrect, total) {
    if (!total || total <= 0) return 0;
    return Math.round((firstTryCorrect / total) * 100);
  }

  // One review row per lesson: "7 of 7 first try", "2 attempts", etc.
  function summarise(progress) {
    var lessons = (progress && progress.lessons) || {};
    var out = { stars: 0, lessonsDone: 0, attempts: 0, rows: [] };
    ordered().forEach(function (l) {
      var r = lessons[l.lesson_id];
      if (!r) {
        out.rows.push({ lesson_id: l.lesson_id, title: l.title, done: false, stars: 0 });
        return;
      }
      out.rows.push({
        lesson_id: l.lesson_id, title: l.title, done: !!r.done,
        stars: r.stars || 0, firstTryCorrect: r.firstTryCorrect || 0,
        total: r.total || 0, attempts: r.attempts || 0
      });
      if (r.done) out.lessonsDone++;
      out.stars += r.stars || 0;
      out.attempts += r.attempts || 0;
    });
    return out;
  }

  /* ------------------------------------------------------------------ steps */

  // The pack's fixed flow, in order. The driver walks this array, so the
  // structure is enforced by construction rather than by convention.
  var STEPS = ['warmup', 'learn', 'look', 'together', 'practice', 'challenge', 'score', 'retry', 'finish'];

  var STEP_LABELS = {
    warmup:    'Warm-up',
    learn:     'Learn',
    look:      'Look',
    together:  'Try Together',
    practice:  'Play & Practice',
    challenge: 'Mini Challenge',
    score:     'Your Score',
    retry:     'Retry Mistakes',
    finish:    'All Done'
  };

  // Engines this pack actually uses. MEMORY is listed in the teacher's menu but
  // no lesson uses it, so it is deliberately absent — see the plan.
  var ENGINE_IDS = [
    'READ_ALOUD', 'MULTIPLE_CHOICE', 'FILL_BLANK', 'DRAG_DROP', 'MATCH_PAIRS',
    'SEQUENCE', 'TAP_IMAGE', 'SORT', 'NUMBER_BUILDER', 'NUMBER_LINE',
    'AUDIO_CHOICE', 'TRUE_FALSE'
  ];

  // Not pack engines: the two shapes the pack implies but never names. A guided
  // example that has no choices is a worked example to read, and a challenge
  // with only an `accept` list is an open written answer. Both are given an
  // engine during normalisation so nothing downstream has to special-case them.
  var INTERNAL_ENGINES = ['WORKED_EXAMPLE', 'SHORT_ANSWER'];

  /* --------------------------------------------------------------- progress */

  function emptyProgress() {
    return { lessons: {}, badges: [] };
  }

  function loadProgress(storage, key) {
    try {
      var raw = storage.getItem(key);
      if (!raw) return emptyProgress();
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return emptyProgress();
      if (!parsed.lessons || typeof parsed.lessons !== 'object') parsed.lessons = {};
      if (!Array.isArray(parsed.badges)) parsed.badges = [];
      return parsed;
    } catch (e) {
      return emptyProgress();   // corrupt or blocked storage must never break a lesson
    }
  }

  function saveProgress(storage, key, progress) {
    try {
      storage.setItem(key, JSON.stringify(progress));
      return true;
    } catch (e) {
      return false;             // private mode / quota — the lesson still works
    }
  }

  // Record one lesson result. Stars only ever move up; that keeps a replayed
  // lesson from erasing a good earlier run.
  function recordLesson(progress, lessonId, result) {
    var p = progress || emptyProgress();
    var prev = p.lessons[lessonId] || {};
    p.lessons[lessonId] = {
      stars: Math.max(prev.stars || 0, result.stars || 0),
      firstTryCorrect: Math.max(prev.firstTryCorrect || 0, result.firstTryCorrect || 0),
      total: result.total || prev.total || 0,
      attempts: (prev.attempts || 0) + (result.attempts || 1),
      retryCleared: !!(prev.retryCleared || result.retryCleared),
      done: true
    };
    p.badges = earnedBadges(p);
    return p;
  }

  /* --------------------------------------------------------------- validate */

  // Structural checks used by the test suite. Returns an array of problems;
  // empty means the lesson is well formed.
  //
  // These are deliberately *integrity* checks only — things that would render
  // wrong or silently mark a child incorrect. The pack's own teaching rules
  // (three games, three engines, six key words, a guided example) are checked
  // separately by conformanceReport(), because the transcribed lessons do not
  // all satisfy them and the fix is never to invent content to make a test
  // pass. Keeping the two apart means a real breakage cannot hide behind a
  // rule the teacher's own material does not follow.
  function validateLesson(lesson) {
    var errs = [];
    var where = (lesson && lesson.lesson_id) || '(no id)';
    function bad(msg) { errs.push(where + ': ' + msg); }

    if (!lesson) { return ['(null lesson)']; }
    if (!lesson.lesson_id) bad('missing lesson_id');
    if (lesson.grade !== 2) bad('grade must be 2');
    if (!lesson.title) bad('missing title');
    if (!lesson.objective) bad('missing objective');
    if (!lesson.read || !Array.isArray(lesson.read.paragraphs) || !lesson.read.paragraphs.length) {
      bad('missing read.paragraphs');
    }
    if (!lesson.visual || !lesson.visual.svg) bad('missing visual.svg');
    if (lesson.visual && lesson.visual.svg && !lesson.visual.alt) bad('visual.svg has no alt text');

    (lesson.games || []).forEach(function (g, i) {
      if (!g.name) bad('game ' + (i + 1) + ' has no name');
      errs = errs.concat(validateItem(g, where + ' game ' + (i + 1) + ' (' + (g.name || '?') + ')'));
    });

    (lesson.guided || []).forEach(function (g, i) {
      errs = errs.concat(validateItem(g, where + ' guided ' + (i + 1)));
    });

    if (!lesson.challenge || !lesson.challenge.prompt) bad('missing challenge');
    else errs = errs.concat(validateItem(lesson.challenge, where + ' challenge'));

    // The compare table, where a lesson has one, is content that must survive
    // to the screen; a malformed one would render as an empty grid.
    if (lesson.compare) {
      if (!Array.isArray(lesson.compare.columns) || lesson.compare.columns.length < 2) {
        bad('compare table needs at least two columns');
      }
      (lesson.compare.rows || []).forEach(function (r, i) {
        if (!Array.isArray(r) || r.length !== (lesson.compare.columns || []).length) {
          bad('compare row ' + (i + 1) + ' does not match the column count');
        }
      });
    }

    return errs;
  }

  function validateItem(item, where) {
    var errs = [];
    function bad(m) { errs.push(where + ': ' + m); }
    if (!item || !item.engine) { bad('item has no engine'); return errs; }

    var known = ENGINE_IDS.indexOf(item.engine) !== -1 ||
                INTERNAL_ENGINES.indexOf(item.engine) !== -1;
    if (!known) bad('unknown engine ' + item.engine);

    if (item.engine === 'MULTIPLE_CHOICE' || item.engine === 'AUDIO_CHOICE') {
      if (!Array.isArray(item.choices) || item.choices.length < 1) bad('needs at least one choice');
      else if (Array.isArray(item.answer)) {
        // A multi-select question: every answer must be one of its choices,
        // and there must be more than one or it should not be an array.
        if (!item.answer.length) bad('array answer is empty');
        item.answer.forEach(function (a) {
          if (item.choices.indexOf(a) === -1) {
            bad('answer ' + JSON.stringify(a) + ' is not one of its choices');
          }
        });
      } else if (item.choices.indexOf(item.answer) === -1) {
        // This is the check that catches a letter-form answer ("A") that was
        // never converted to its value.
        bad('answer ' + JSON.stringify(item.answer) + ' is not one of its choices');
      }
    }

    if (item.engine === 'SHORT_ANSWER' && !(item.accept || []).length) {
      bad('short answer has nothing to accept');
    }

    if (item.engine === 'TRUE_FALSE' && typeof item.answer !== 'boolean') {
      bad('TRUE_FALSE answer must be a boolean');
    }

    if (item.engine === 'SEQUENCE') {
      if (!Array.isArray(item.items) || item.items.length < 2) bad('needs at least two items');
    }

    if (item.engine === 'MATCH_PAIRS') {
      if (!Array.isArray(item.pairs) || item.pairs.length < 2) bad('needs at least two pairs');
      else item.pairs.forEach(function (p, i) {
        if (!Array.isArray(p) || p.length !== 2) bad('pair ' + (i + 1) + ' must be [left, right]');
      });
    }

    // Cards whose box/bin is null are decoys: they belong in the tray and must
    // never be placed. Both content files use this for the wrong-answer cards,
    // so a null target is valid — but a *named* target must really exist, or
    // the card would be unplaceable and the game unwinnable.
    if (item.engine === 'DRAG_DROP') {
      if (!Array.isArray(item.boxes) || !item.boxes.length) bad('needs boxes');
      else (item.cards || []).forEach(function (c, i) {
        if (c.box != null && item.boxes.indexOf(c.box) === -1) {
          bad('card ' + (i + 1) + ' targets unknown box ' + JSON.stringify(c.box));
        }
      });
    }

    if (item.engine === 'SORT') {
      if (!Array.isArray(item.bins) || !item.bins.length) bad('needs bins');
      else (item.cards || []).forEach(function (c, i) {
        if (c.bin != null && item.bins.indexOf(c.bin) === -1) {
          bad('card ' + (i + 1) + ' targets unknown bin ' + JSON.stringify(c.bin));
        }
      });
    }

    if (item.engine === 'FILL_BLANK') {
      if (item.mode === 'bank' && !(item.bank || []).length) bad('bank mode with no bank');
      if (item.answer == null) bad('missing answer');
    }

    if (item.engine === 'TAP_IMAGE') {
      if (!Array.isArray(item.choices) || !item.choices.length) bad('needs choices');
      else {
        var correct = item.choices.filter(function (c) { return c.correct; }).length;
        if (correct !== 1) bad('needs exactly one correct choice (has ' + correct + ')');
      }
    }

    if (item.engine === 'NUMBER_BUILDER' && typeof item.target !== 'number') {
      bad('NUMBER_BUILDER needs a numeric target');
    }

    // min/max/step are optional: the math source never states a range, so the
    // renderer defaults them from the lesson's own scope ("within 100").
    if (item.engine === 'NUMBER_LINE' && typeof item.target !== 'number') {
      bad('NUMBER_LINE needs a numeric target');
    }

    return errs;
  }

  // The pack's own teaching rules, reported rather than enforced. Every entry
  // here is a place the transcribed material does not do what the pack's
  // "Content Rules" ask, and each is expected — inventing a guided example or
  // a third engine to clear them would be substituting my content for the
  // teacher's. The test asserts this list exactly, so a new deviation cannot
  // appear unnoticed.
  function conformanceReport() {
    var notes = [];
    function note(id, msg) { notes.push(id + ': ' + msg); }

    ordered().forEach(function (l) {
      var games = l.games || [];
      var names = {};
      var engines = {};
      games.forEach(function (g) {
        names[g.name || '?'] = true;
        if (ENGINE_IDS.indexOf(g.engine) !== -1) engines[g.engine] = true;
      });
      var nGames = Object.keys(names).length;
      var nEngines = Object.keys(engines).length;

      if (nGames < 3) note(l.lesson_id, 'has ' + nGames + ' games, pack asks for at least three');
      if (nEngines < 3) note(l.lesson_id, 'uses ' + nEngines + ' engines, pack asks for at least three distinct');
      if (!(l.guided || []).length) note(l.lesson_id, 'has no guided example; the source supplies none');
      if ((l.keyWords || []).length > 6) note(l.lesson_id, 'introduces ' + l.keyWords.length + ' key words, pack allows six');

      var items = games.concat(l.guided || [], l.challenge ? [l.challenge] : []);
      var noHint = items.filter(function (it) {
        return !it.hint && it.engine !== 'WORKED_EXAMPLE';
      }).length;
      if (noHint) {
        note(l.lesson_id, noHint + ' of ' + items.length +
          ' items have no hint; the source supplies none, so no hint is shown ' +
          'after a wrong first try');
      }
    });
    return notes.sort();
  }

  function validateAll() {
    var errs = [];
    if (LESSONS.length !== 8) {
      errs.push('expected 8 lessons, found ' + LESSONS.length);
    }
    var seen = {};
    LESSONS.forEach(function (l) {
      if (seen[l.lesson_id]) errs.push('duplicate lesson_id ' + l.lesson_id);
      seen[l.lesson_id] = true;
      errs = errs.concat(validateLesson(l));
    });
    LESSON_ORDER.forEach(function (id) {
      if (!seen[id]) errs.push('missing lesson ' + id);
    });
    return errs;
  }

  return {
    LESSONS: LESSONS,
    LESSON_ORDER: LESSON_ORDER,
    BADGES: BADGES,
    STEPS: STEPS,
    STEP_LABELS: STEP_LABELS,
    ENGINE_IDS: ENGINE_IDS,
    INTERNAL_ENGINES: INTERNAL_ENGINES,
    byId: byId,
    ordered: ordered,
    badgeById: badgeById,
    earnedBadges: earnedBadges,
    computeStars: computeStars,
    percentage: percentage,
    summarise: summarise,
    emptyProgress: emptyProgress,
    loadProgress: loadProgress,
    saveProgress: saveProgress,
    recordLesson: recordLesson,
    validateItem: validateItem,
    validateLesson: validateLesson,
    validateAll: validateAll,
    conformanceReport: conformanceReport,
    normaliseItem: normaliseItem
  };
});
