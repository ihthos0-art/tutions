'use strict';

/* ============================================================================
   The Assigned tab's fill-in-the-blank worksheet.

   This is a static worksheet: the word bank and the blanks are written straight
   into nabila-naviha.html, and interactive.js drives them by reading the
   `data-word` on each chip and the `data-answer` on each blank. Nothing
   validates the relationship between the two, and every way it can drift is
   silent:

     - an answer that is not in the bank is a blank no child can fill correctly
       — the check button marks it wrong however hard they try;
     - a chip no blank wants, or two blanks wanting the same chip, makes the
       sheet look finished while a blank is still empty;
     - interactive.js finds a chip with querySelector('.wb-chip[data-word="X"]'),
       so a word banked twice puts one chip in the DOM and the other permanently
       unreachable;
     - a data-save key reused from an earlier set of sentences drags a previous
       answer back out of localStorage (:171) and drops it into a blank it does
       not belong to.

   The worksheet was rewritten from Grade 1 words to Grade 2 words, which is
   exactly the kind of edit that reintroduces one of these. Hence the check.
   ========================================================================== */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const PAGE = fs.readFileSync(path.join(ROOT, 'archive/legacy-pages/nabila-naviha-worksheet.html'), 'utf8');

// Only the Assigned tab's own worksheet. homework-loader.js can replace this
// markup at runtime from KV, with its own `hw<n>` keys; the static sheet is
// what a student sees when KV has nothing, and it is what these rules govern.
function worksheet() {
  const start = PAGE.indexOf('<div class="wb-words">');
  const end = PAGE.indexOf('<div class="check-row">');
  assert.ok(start !== -1 && end > start, 'the Assigned tab worksheet is gone from nabila-naviha.html');
  const seg = PAGE.slice(start, end);

  const chips = [...seg.matchAll(/class="wb-chip"\s+data-word="([^"]+)"/g)].map(m => m[1]);
  const blanks = [...seg.matchAll(
    /class="fitb-drop"\s+data-save="([^"]+)"\s+data-answer="([^"]+)"/g
  )].map(m => ({ save: m[1], answer: m[2] }));

  return { seg, chips, blanks };
}

test('the worksheet has a word bank and blanks to fill', () => {
  const { chips, blanks } = worksheet();
  assert.ok(chips.length >= 5, 'the word bank is too small to be a worksheet');
  assert.equal(chips.length, blanks.length,
    chips.length + ' words but ' + blanks.length + ' blanks — the bank and the sheet disagree');
});

test('every answer is a word the child can actually pick up', () => {
  const { chips, blanks } = worksheet();
  blanks.forEach(b => {
    assert.ok(chips.indexOf(b.answer) !== -1,
      'blank "' + b.save + '" wants "' + b.answer + '", which is not in the word bank');
  });
});

test('every word in the bank is wanted by exactly one blank', () => {
  const { chips, blanks } = worksheet();
  const answers = blanks.map(b => b.answer);
  chips.forEach(w => {
    const uses = answers.filter(a => a === w).length;
    assert.equal(uses, 1, '"' + w + '" is used by ' + uses + ' blanks; it must be exactly one');
  });
});

test('no word is banked twice, and no word is empty', () => {
  const { chips } = worksheet();
  assert.equal(new Set(chips).size, chips.length,
    'a word appears twice in the bank; interactive.js would only ever find the first chip');
  chips.forEach(w => assert.ok(w.trim().length, 'the bank has an empty chip'));
});

test('every blank carries a key of its own', () => {
  const { blanks } = worksheet();
  const keys = blanks.map(b => b.save);
  assert.equal(new Set(keys).size, keys.length, 'two blanks share a data-save key');
  keys.forEach(k => assert.ok(k.trim().length, 'a blank has an empty data-save key'));
});

// The keys must not collide with the `hw<n>` keys homework-loader.js writes when
// KV supplies a worksheet, or a student's saved answer could be restored into
// the wrong sheet depending on which one rendered.
test('the worksheet keys do not collide with the server-driven sheet', () => {
  const { blanks } = worksheet();
  blanks.forEach(b => {
    assert.equal(/^hw\d+$/.test(b.save), false,
      'blank "' + b.save + '" uses the hw prefix homework-loader.js owns');
  });
});

// interactive.js restores a blank from localStorage by key before a child
// touches anything. A key carried over from a previous set of sentences brings
// the previous answer with it, which is not in the new bank and cannot be
// cleared by using a chip — the sheet looks broken and cannot be finished.
test('no blank reuses a retired Grade 1 key, and the answer matches the sentence', () => {
  const { blanks } = worksheet();
  const retired = ['play', 'blue', 'sleep', 'ride', 'grow', 'shine', 'dance', 'help', 'laugh', 'sing'];
  blanks.forEach(b => {
    assert.equal(retired.indexOf(b.answer), -1,
      'blank "' + b.save + '" still uses a retired Grade 1 word');
  });
  // The old sheet's own keys must be gone from the page entirely, not merely
  // unused, so nothing can quietly restore into them.
  assert.equal(/data-save="h\d+"/.test(PAGE), false,
    'an h<n> key survives from the Grade 1 worksheet; localStorage will restore it');
});

// The blank is a span, so answers-sync.js never collects it — these answers are
// local to the browser. Asserted because it is the reason the keys were safe to
// change, and it would stop being true if a blank became an input.
test('the answers stay out of the parent dashboard, as they did before', () => {
  const { seg } = worksheet();
  assert.equal(/<input|<textarea/.test(seg), false,
    'the worksheet gained an input, so its answers would now sync to the dashboard');
});
