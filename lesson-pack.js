/* ============================================================================
   Interactive Lesson Pack — engine and lesson-flow driver. Shared by every
   student page that mounts a pack.

   Requires lesson-pack.data.js (content + pure logic) to be loaded first, and
   reads the page's own identity from `window.LessonPackConfig`:

     { student: 'nafis', grade: 7, storageKey: 'g7pack:nafis' }

   Every key is optional and defaults to the Grade 2 page, so a page that
   declares nothing behaves exactly as it did before this module was shared.

   Namespacing is deliberate throughout: `lp-` classes, `lp:result` events,
   `data-lp-*` attributes, and a storage prefix outside the host page's own. The
   host page has several scripts that bind globally by class and by storage
   prefix, and colliding with any of them fails silently rather than loudly:
     - ai-tutor.js listens on `checkResult` and owns its own star economy, so
       this module dispatches `lp:result` instead
     - ai-tutor.js / quiz.js attach to every `.passage-box`, so readings here
       use `.lp-read`
     - interactive.js deletes every `<page-name>:*` localStorage key when the
       Assigned tab's reset is pressed, hence a prefix of its own
   ========================================================================== */
(function () {
  'use strict';
  if (window.LessonPack) return;

  var CFG = window.LessonPackConfig || {};

  var D = window.LessonPackData;
  if (!D) return;

  var STUDENT = CFG.student || 'nabila-naviha';
  var STORAGE_KEY = CFG.storageKey || 'g2pack:nabila-naviha';
  var GRADE = CFG.grade || D.GRADE || 2;

  /* =========================================================== tiny helpers */

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function btn(cls, html, label) {
    var b = el('button', cls, html);
    b.type = 'button';                       // never submit a form by accident
    if (label) b.setAttribute('aria-label', label);
    return b;
  }

  function shuffle(a) {
    var out = a.slice();
    for (var i = out.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = out[i]; out[i] = out[j]; out[j] = t;
    }
    return out;
  }

  // Answers are compared after a light normalisation, never before it. The
  // earlier exact comparison meant a child who typed the teacher's own answer
  // with a full stop, a curly quote, or a comma the pack itself supplies was
  // told they were wrong. Quotes and sentence punctuation are therefore
  // ignored; digits are not touched, so "3.5" is still not "35".
  function normaliseAnswer(v) {
    return String(v == null ? '' : v)
      .toLowerCase()
      .replace(/[“”‘’"']/g, '')
      .replace(/[.,!?;:]+(?=\s|$)/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function sameText(a, b) {
    return normaliseAnswer(a) === normaliseAnswer(b);
  }

  // The teacher's pack requires a way out of a question a child cannot answer:
  // "Wrong answer 3: show the answer, then ask one easier question about it."
  // Without it the item simply never resolves and the lesson cannot be
  // finished, which is why this is a rule about the flow rather than a nicety.
  // What "the answer" is for an item, as one line a child can read.
  //
  // The pack's third-strike rule only works if there is something to show, so
  // every engine has to be able to state its own key. A question with an answer
  // states it; a placement game has no single answer — it has a placement — so
  // the key is rendered as the teacher wrote it: each target with the cards that
  // belong in it. Without this, a child who has misplaced cards three times is
  // told "Try again" a fourth time with no way forward, and the lesson stalls
  // for them while looking perfectly healthy to everyone else.
  function revealText(item) {
    if (!item) return '';
    if (item.engine === 'TRUE_FALSE' && typeof item.answer === 'boolean') {
      return item.answer ? 'Yes, that is true.' : 'No, that is not true.';
    }
    if (item.engine === 'DRAG_DROP' || item.engine === 'SORT') {
      var field = item.engine === 'DRAG_DROP' ? 'box' : 'bin';
      var slots = item[item.engine === 'DRAG_DROP' ? 'boxes' : 'bins'] || [];
      var out = [];
      slots.forEach(function (s) {
        var cards = (item.cards || [])
          .filter(function (c) { return c[field] === s; })
          .map(function (c) { return c.text; });
        if (cards.length) out.push(s + ': ' + cards.join(', '));
      });
      if (out.length) return out.join('  ·  ');
    }
    if (item.engine === 'MATCH_PAIRS') {
      var pairs = (item.pairs || []).map(function (p) { return p[0] + ' → ' + p[1]; });
      if (pairs.length) return pairs.join('  ·  ');
    }
    if (item.engine === 'SEQUENCE' && (item.items || []).length) {
      return item.items.join(' → ');
    }
    if (item.engine === 'NUMBER_BUILDER' || item.engine === 'NUMBER_LINE') {
      if (item.target != null) return String(item.target);
    }
    if (item.engine === 'TAP_IMAGE') {
      var right = (item.choices || [])
        .filter(function (c) { return c.correct; })
        .map(function (c) { return c.label; });
      if (right.length) return right.join(', ');
    }
    if (Array.isArray(item.answer)) return item.answer.join(', ');
    if (item.answer != null && String(item.answer).length) return String(item.answer);
    var accept = item.accept || [];
    return accept.length ? String(accept[0]) : '';
  }

  /* ================================================================= sound */
  /* Cues are soft on purpose. The teacher's pack asks for a gentle "boop" on
     retry and explicitly not a punishing buzz, so nothing here is a sawtooth
     and `correct` and `retry` share neither waveform nor pitch. */

  var audioCtx = null;

  function ctx() {
    if (audioCtx) return audioCtx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { audioCtx = new AC(); } catch (e) { audioCtx = null; }
    return audioCtx;
  }

  function tone(freq, dur, type, vol, delay) {
    var c = ctx();
    if (!c) return;
    try {
      if (c.state === 'suspended' && c.resume) c.resume();
      var t0 = c.currentTime + (delay || 0);
      var osc = c.createOscillator();
      var gain = c.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, t0);
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(vol == null ? 0.09 : vol, t0 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain); gain.connect(c.destination);
      osc.start(t0); osc.stop(t0 + dur + 0.02);
    } catch (e) { /* audio is a nicety, never a requirement */ }
  }

  var sound = {
    play: function (name) {
      switch (name) {
        case 'correct':                       // rising major third, sine
          tone(587.33, 0.13, 'sine', 0.09, 0);
          tone(783.99, 0.20, 'sine', 0.09, 0.11);
          break;
        case 'retry':                         // gentle descending whole tone
          tone(392.00, 0.16, 'sine', 0.07, 0);
          tone(349.23, 0.20, 'sine', 0.07, 0.14);
          break;
        case 'hint':
          tone(523.25, 0.09, 'triangle', 0.06, 0);
          break;
        case 'badge':
          tone(523.25, 0.13, 'sine', 0.09, 0);
          tone(659.25, 0.13, 'sine', 0.09, 0.12);
          tone(783.99, 0.13, 'sine', 0.09, 0.24);
          tone(1046.50, 0.30, 'sine', 0.10, 0.36);
          break;
        default:
          tone(440, 0.06, 'sine', 0.05, 0);
      }
    },
    stop: function () { /* short cues, nothing sustained to stop */ }
  };

  /* ================================================================ speaking */
  /* Sentence-chunked TTS with word highlighting. The highlighting depends on
     `onboundary`, which Safari and Firefox do not fire reliably, so it is
     feature-detected: if no boundary event arrives shortly after speech
     starts, highlighting is abandoned and plain read-aloud continues. That
     degrades invisibly instead of looking broken. */

  var VOICE_PREFS = [
    'Samantha', 'Karen', 'Moira', 'Google US English',
    'Microsoft Aria', 'Microsoft Zira', 'Google UK English Female'
  ];

  function pickVoice() {
    var synth = window.speechSynthesis;
    if (!synth || !synth.getVoices) return null;
    var voices = synth.getVoices() || [];
    for (var i = 0; i < VOICE_PREFS.length; i++) {
      for (var j = 0; j < voices.length; j++) {
        if (voices[j].name && voices[j].name.indexOf(VOICE_PREFS[i]) === 0) return voices[j];
      }
    }
    for (var k = 0; k < voices.length; k++) {
      if (/^en[-_]US/i.test(voices[k].lang || '')) return voices[k];
    }
    for (var m = 0; m < voices.length; m++) {
      if (/^en/i.test(voices[m].lang || '')) return voices[m];
    }
    return null;
  }

  var speak = (function () {
    var current = null;      // the button that started playback
    var words = [];          // span elements being highlighted
    var boundarySeen = false;
    var boundaryTimer = null;

    function supported() {
      return typeof window.speechSynthesis !== 'undefined' &&
             typeof window.SpeechSynthesisUtterance !== 'undefined';
    }

    function clearHighlight() {
      words.forEach(function (w) { w.classList.remove('lp-speaking'); });
      words = [];
      if (boundaryTimer) { clearTimeout(boundaryTimer); boundaryTimer = null; }
      boundarySeen = false;
    }

    function stop() {
      try { if (supported()) window.speechSynthesis.cancel(); } catch (e) {}
      if (current) { current.setAttribute('aria-pressed', 'false'); current = null; }
      clearHighlight();
    }

    // Speak a list of text chunks in order, highlighting `wordSpans` as we go.
    function say(chunks, wordSpans, button) {
      if (!supported()) return;
      stop();
      var synth = window.speechSynthesis;
      var voice = pickVoice();
      var idx = 0;

      current = button || null;
      if (current) current.setAttribute('aria-pressed', 'true');
      words = wordSpans || [];

      // Abandon highlighting if onboundary never fires (Safari/Firefox).
      if (words.length) {
        boundaryTimer = setTimeout(function () {
          if (!boundarySeen) words = [];
        }, 700);
      }

      function next() {
        if (idx >= chunks.length) { stop(); return; }
        var text = chunks[idx++];
        var u = new window.SpeechSynthesisUtterance(text);
        u.rate = 0.85;
        u.pitch = 1.05;
        if (voice) u.voice = voice;

        u.onboundary = function (e) {
          if (!words.length || e.name === 'sentence') return;
          boundarySeen = true;
          if (boundaryTimer) { clearTimeout(boundaryTimer); boundaryTimer = null; }
          var upto = 0, found = null;
          for (var i = 0; i < words.length; i++) {
            upto += (words[i].textContent || '').length + 1;
            if (e.charIndex < upto) { found = words[i]; break; }
          }
          words.forEach(function (w) { w.classList.remove('lp-speaking'); });
          if (found) found.classList.add('lp-speaking');
        };
        u.onend = next;
        u.onerror = function () { stop(); };
        try { synth.speak(u); } catch (err) { stop(); }
      }
      next();
    }

    // toggle(text, button, wordSpans) - the contract used by the read-aloud UI
    function toggle(text, button, wordSpans) {
      if (current === button) { stop(); return; }
      var chunks = String(text).match(/[^.!?;:]+[.!?;:]*/g) || [String(text)];
      say(chunks.map(function (c) { return c.trim(); }).filter(Boolean), wordSpans, button);
    }

    return {
      supported: supported,
      toggle: toggle,
      stop: stop,
      isOn: function () { return !!current; }
    };
  })();

  // Build the read-aloud button for a block of text.
  function speakButton(text, wordSpans, label) {
    var b = btn('lp-speak', '🔊 <span>Read to me</span>', label || 'Read this aloud');
    b.setAttribute('aria-pressed', 'false');
    if (!speak.supported()) { b.hidden = true; return b; }
    b.addEventListener('click', function () { speak.toggle(text, b, wordSpans); });
    return b;
  }

  // Split prose into word spans so `onboundary` has something to highlight.
  function wordSpansInto(host) {
    var spans = [];
    Array.prototype.slice.call(host.querySelectorAll('p')).forEach(function (p) {
      var parts = (p.textContent || '').split(/(\s+)/);
      p.textContent = '';
      parts.forEach(function (part) {
        if (!part.trim()) { p.appendChild(document.createTextNode(part)); return; }
        var s = el('span', null, esc(part));
        s.setAttribute('data-w', '');
        p.appendChild(s);
        spans.push(s);
      });
    });
    return spans;
  }

  /* =============================================================== reporting */
  /* One place that turns an attempt outcome into sound, live-region text, and
     the driver's bookkeeping. Engines never decide policy themselves. */

  function makeUi(state, item, liveEl) {
    var answered = false;
    var wrongCount = 0;

    return {
      item: item,
      live: function (msg) { if (liveEl) liveEl.textContent = msg; },

      hint: function () {
        var host = state.hintHost;
        if (!host || !item.hint) return;
        host.textContent = '💡 Hint: ' + item.hint;
        host.className = 'lp-hint';
        host.hidden = false;
        sound.play('hint');
        this.live('Hint: ' + item.hint);
      },

      // ok=false is a retry, never a punishment: soft sound, amber text, and
      // the hint appears automatically the first time.
      submit: function (ok, meta) {
        if (answered) return;
        if (ok) {
          answered = true;
          sound.play('correct');
          state.record(item, wrongCount === 0);
          this.live((meta && meta.message) || 'That is right.');
        } else {
          wrongCount++;
          sound.play('retry');
          this.live('Try again. Look at the hint.');
          if (wrongCount === 1) this.hint();
          // Three tries is the pack's own limit. The answer is shown and the
          // lesson becomes finishable; the miss still counts, because
          // computeStars reads the first attempt only.
          if (wrongCount >= 3) this.reveal();
        }
        if (state.onAttempt) state.onAttempt(ok, meta);
      },

      isAnswered: function () { return answered; },
      wrongCount: function () { return wrongCount; },
      speakBtn: speakButton,

      // Show the teacher's answer and let the child move on. Called by submit
      // on the third wrong attempt, and callable by an engine that has run out
      // of ways to be wrong (a drag game places a finite set of cards).
      reveal: function () {
        var text = revealText(item);
        if (!text) return;
        var host = state.hintHost;
        if (host) {
          host.textContent = '💡 The answer is: ' + text;
          host.className = 'lp-hint';
          host.hidden = false;
        }
        this.live('The answer is: ' + text);
        if (typeof state.onStuck === 'function') state.onStuck(item);
      }
    };
  }

  /* ================================================================ engines */
  /* Each engine renders `item` into `stage` and reports through `ui`. */

  var ENGINES = {};

  /* ---- multiple choice / audio choice share everything but the cue ------- */

  function renderChoice(stage, item, ui, opts) {
    opts = opts || {};
    if (item.prompt) stage.appendChild(el('p', 'lp-prompt', esc(item.prompt)));

    // "Find all the details" questions arrive with an array answer. Those are
    // select-every-correct-one, not pick-one, so they get their own behaviour:
    // each correct choice locks in as it is found, and the question completes
    // only when every one of them has been chosen. A wrong choice is a retry
    // and never removes a choice already found.
    var multi = Array.isArray(item.answer);
    if (multi) {
      stage.appendChild(el('p', 'lp-caption', 'Choose every answer that fits.'));
    }

    if (opts.audio) {
      var cue = btn('lp-speak', '🔊 <span>Play again</span>', 'Play the question again');
      cue.addEventListener('click', function () {
        speak.toggle(item.say || item.prompt || '', cue, null);
      });
      stage.appendChild(cue);
      ui.live('Listen, then choose an answer.');
    } else if (item.readAloud !== false && (item.prompt || item.say)) {
      stage.appendChild(speakButton(item.prompt || item.say, null, 'Read the question aloud'));
    }

    var list = el('div', 'lp-choices');
    list.setAttribute('role', 'group');
    var buttons = [];
    var accepted = multi ? item.answer : null;
    var found = 0;

    function isRight(choice) {
      if (multi) {
        return accepted.some(function (a) { return sameText(a, choice); });
      }
      return sameText(choice, item.answer);
    }

    shuffle(item.choices || []).forEach(function (choice) {
      var b = btn('lp-choice', '<span class="lp-mark">○</span><span>' + esc(choice) + '</span>');
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () {
        if (ui.isAnswered() || b.disabled) return;
        if (isRight(choice)) {
          b.classList.add('is-good');
          b.querySelector('.lp-mark').textContent = '✓';
          b.setAttribute('aria-pressed', 'true');
          b.disabled = true;
          if (multi) {
            found++;
            if (found < accepted.length) {
              // Still looking. Say so without ending the question.
              sound.play('correct');
              ui.live('Found one. ' + (accepted.length - found) + ' more to find.');
              return;
            }
          }
          ui.submit(true, { message: item.correct_feedback || '' });
          buttons.forEach(function (x) { x.disabled = true; });
        } else {
          b.classList.add('is-retry');
          b.querySelector('.lp-mark').textContent = '↺';
          b.disabled = true;                 // real disabled, not pointer-events
          ui.submit(false);
        }
      });
      buttons.push(b);
      list.appendChild(b);
    });

    stage.appendChild(list);
  }

  ENGINES.MULTIPLE_CHOICE = {
    id: 'MULTIPLE_CHOICE',
    render: function (stage, item, ui) { renderChoice(stage, item, ui, { audio: false }); }
  };

  ENGINES.AUDIO_CHOICE = {
    id: 'AUDIO_CHOICE',
    render: function (stage, item, ui) { renderChoice(stage, item, ui, { audio: true }); }
  };

  /* ---- true / false ------------------------------------------------------ */

  ENGINES.TRUE_FALSE = {
    id: 'TRUE_FALSE',
    render: function (stage, item, ui) {
      var txt = item.statement || item.prompt || '';
      stage.appendChild(el('p', 'lp-prompt', esc(txt)));
      stage.appendChild(speakButton(txt, null, 'Read this aloud'));

      // English's bee lesson keys its answers with the teacher's own words
      // ("Yes" / "Not enough by itself" / "No") while the engine is boolean.
      // Where a label was supplied, the child sees the teacher's wording
      // rather than a bare Yes/No that would contradict it.
      var yesLabel = (item.answer === true && item.answerLabel) ? item.answerLabel : 'Yes, that is true';
      var noLabel = (item.answer === false && item.answerLabel) ? item.answerLabel : 'No, that is not true';

      var list = el('div', 'lp-choices');
      var buttons = [];
      [{ label: yesLabel, value: true, mark: '✓' },
       { label: noLabel, value: false, mark: '✗' }].forEach(function (opt) {
        var b = btn('lp-choice', '<span class="lp-mark">' + opt.mark + '</span><span>' + opt.label + '</span>');
        b.addEventListener('click', function () {
          if (ui.isAnswered()) return;
          if (opt.value === item.answer) {
            b.classList.add('is-good');
            ui.submit(true);
            buttons.forEach(function (x) { x.disabled = true; });
          } else {
            b.classList.add('is-retry');
            b.disabled = true;
            ui.submit(false);
          }
        });
        buttons.push(b);
        list.appendChild(b);
      });
      stage.appendChild(list);
    }
  };

  /* ---- worked example ---------------------------------------------------- */
  /* Math's guided examples are worked solutions, not questions: the source
     gives the working and the answer with nothing to choose between. They are
     read through rather than answered, so they render as a card. */

  ENGINES.WORKED_EXAMPLE = {
    id: 'WORKED_EXAMPLE',
    render: function (stage, item, ui) {
      var body = el('div', 'lp-read');
      String(item.prompt || '').split('\n').forEach(function (line) {
        body.appendChild(el('p', null, esc(line)));
      });
      stage.appendChild(body);
      stage.appendChild(speakButton(item.prompt || '', null, 'Read the example aloud'));

      if (item.answer != null) {
        stage.appendChild(el('p', 'lp-score-line', esc(item.answer)));
      }
      var done = btn('lp-btn lp-btn--primary', 'I understand →');
      done.addEventListener('click', function () {
        ui.submit(true, { message: 'Good. Here is the next one.' });
      });
      stage.appendChild(done);
    }
  };

  /* ---- short answer ------------------------------------------------------ */
  /* The mini challenges are open questions with an acceptable-answer list and
     no choices. Typed answers are matched case- and space-insensitively
     against every accepted wording, which is why the pack supplies several. */

  ENGINES.SHORT_ANSWER = {
    id: 'SHORT_ANSWER',
    render: function (stage, item, ui) {
      var prompt = String(item.prompt || '');
      stage.appendChild(el('p', 'lp-prompt', esc(prompt)));
      stage.appendChild(speakButton(prompt, null, 'Read the question aloud'));

      var input = el('input', 'lp-input lp-input--wide');
      input.type = 'text';
      input.setAttribute('aria-label', 'Your answer');
      stage.appendChild(input);

      var accepted = [item.answer].concat(item.accept || []).filter(function (a) {
        return typeof a === 'string' && a.length;
      });

      var check = btn('lp-btn lp-btn--primary', 'Check my answer');
      check.addEventListener('click', function () {
        if (ui.isAnswered()) return;
        var got = input.value.trim();
        if (!got) { ui.live('Write your answer first.'); return; }
        var ok = accepted.some(function (a) { return sameText(a, got); });
        input.classList.toggle('is-good', ok);
        input.classList.toggle('is-retry', !ok);
        if (ok) {
          input.disabled = true;
          check.disabled = true;
          ui.submit(true);
        } else {
          ui.submit(false);
        }
      });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); check.click(); }
      });
      stage.appendChild(check);
    }
  };

  /* ---- fill in the blank ------------------------------------------------- */

  ENGINES.FILL_BLANK = {
    id: 'FILL_BLANK',
    render: function (stage, item, ui) {
      var line = el('p', 'lp-sentence');
      line.appendChild(document.createTextNode((item.before || '') + ' '));
      var input;
      if (item.mode === 'bank') {
        // A blank you can also type into; the bank only supplies suggestions.
        input = el('input', 'lp-input');
        input.type = 'text';
        input.setAttribute('aria-label', 'Your answer');
      } else {
        input = el('input', 'lp-input');
        input.type = 'text';
        input.setAttribute('aria-label', 'Your answer');
      }
      line.appendChild(input);
      line.appendChild(document.createTextNode(' ' + (item.after || '')));
      stage.appendChild(line);

      var bankHost = null;
      if (item.mode === 'bank' && (item.bank || []).length) {
        bankHost = el('div', 'lp-tray');
        bankHost.setAttribute('role', 'group');
        bankHost.setAttribute('aria-label', 'Word bank');
        item.bank.forEach(function (w) {
          var chip = btn('lp-tile', esc(w));
          chip.addEventListener('click', function () { input.value = w; input.focus(); });
          bankHost.appendChild(chip);
        });
        stage.appendChild(bankHost);
      }

      var check = btn('lp-btn lp-btn--primary', 'Check', 'Check your answer');
      check.addEventListener('click', function () {
        if (ui.isAnswered()) return;
        var accepted = [item.answer].concat(item.accept || []);
        var ok = accepted.some(function (a) { return sameText(a, input.value); });
        input.classList.toggle('is-good', ok);
        input.classList.toggle('is-retry', !ok);
        if (ok) {
          input.disabled = true;
          check.disabled = true;
          ui.submit(true);
        } else {
          ui.submit(false);
        }
      });
      stage.appendChild(check);

      // Enter submits, which is what a keyboard user expects in a text field.
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); check.click(); }
      });
      stage.appendChild(el('div', 'lp-sr', ''));
    }
  };

  /* ---- the placement board ---------------------------------------------- */
  /* One board serves DRAG_DROP, SORT, SEQUENCE and TAP_IMAGE-style sorting.
     Interaction is pick-up / put-down rather than positional dragging, so it
     is identical for mouse, touch, keyboard and screen reader:

       pick up  - click, tap, or focus a tile and press Enter/Space
       put down - click/tap a slot, or Tab to it and press Enter/Space
       cancel   - Escape returns the held tile to the tray
       move     - ArrowLeft/Right move between tiles (roving tabindex), so a
                  ten-tile tray costs one Tab stop, not ten

     Native HTML5 drag is layered on top as an extra, never as the only path. */

  function renderBoard(stage, cfg, ui) {
    var placement = {};          // slotKey -> [tileText, ...]
    var held = null;             // tile button currently in hand
    var tiles = [];              // all tile buttons
    var slots = [];              // all slot drop buttons
    var tray = el('div', 'lp-tray');

    if (cfg.instruction) {
      stage.appendChild(el('p', 'lp-prompt', esc(cfg.instruction)));
      stage.appendChild(speakButton(cfg.instruction, null, 'Read the instruction aloud'));
    }

    tray.setAttribute('role', 'group');
    tray.setAttribute('aria-label', 'Cards to place');

    var slotHost = el('div', 'lp-slots');
    slotHost.setAttribute('role', 'group');
    slotHost.setAttribute('aria-label', 'Places');

    function announce(msg) { ui.live(msg); }

    function setHeld(tile, on) {
      if (!tile) return;
      tile.classList.toggle('lp-held', on);
      tile.setAttribute('aria-pressed', on ? 'true' : 'false');
    }

    function pickUp(tile) {
      if (held === tile) { setHeld(tile, false); held = null; announce('Put back.'); return; }
      if (held) setHeld(held, false);
      held = tile;
      setHeld(tile, true);
      announce('Picked up ' + tile.textContent + '. Choose a place.');
    }

    // A slot holds as many cards as it is given. English's story-parts game
    // puts two cards in each of three boxes, and science's garden takes four,
    // so one-card-per-slot would have made those games unwinnable.
    function placeInto(slotBtn) {
      var key = slotBtn.getAttribute('data-slot');
      if (!held) { announce('Pick up a card first.'); return; }
      var text = held.textContent;
      var tile = held;
      placement[key] = (placement[key] || []).concat([text]);
      tile.hidden = true;
      tile.classList.add('lp-placed');
      setHeld(tile, false);
      held = null;
      renderSlotBodies();
      announce(text + ' goes in ' + slotBtn.getAttribute('data-slot-label') + '.');
    }

    // Take a card back out of a slot and return it to the tray, so a misplaced
    // card is fixable by clicking it rather than only by resetting the game.
    function takeBack(key, text) {
      placement[key] = (placement[key] || []).filter(function (t) { return t !== text; });
      if (!placement[key].length) delete placement[key];
      var tile = tiles.filter(function (t) {
        return t.textContent === text && t.hidden;
      })[0];
      if (tile) {
        tile.hidden = false;
        tile.classList.remove('lp-placed');
        tray.appendChild(tile);
      }
      renderSlotBodies();
      announce(text + ' is back in the tray.');
    }

    function renderSlotBodies() {
      slots.forEach(function (sb) {
        var key = sb.getAttribute('data-slot');
        var body = sb.parentNode.querySelector('.lp-slot-body');
        body.innerHTML = '';
        var list = placement[key] || [];
        if (list.length) {
          list.forEach(function (text) {
            var chip = btn('lp-tile lp-placed', esc(text),
              text + ', in ' + sb.getAttribute('data-slot-label') + '. Click to take it back.');
            chip.setAttribute('data-placed', key);
            chip.addEventListener('click', function () {
              if (ui.isAnswered()) return;
              takeBack(key, text);
            });
            body.appendChild(chip);
          });
          sb.textContent = 'Put another here';
        } else {
          sb.textContent = 'Put it here';
        }
      });
    }

    cfg.slots.forEach(function (s) {
      var box = el('div', 'lp-slot');
      box.appendChild(el('div', 'lp-slot-label', esc(s.label)));
      var body = el('div', 'lp-slot-body');
      var drop = btn('lp-slot-drop', 'Put it here',
        'Place the held card into ' + s.label);
      drop.setAttribute('data-slot', s.key);
      drop.setAttribute('data-slot-label', s.label);
      drop.addEventListener('click', function () { placeInto(drop); });
      body.appendChild(drop);
      box.appendChild(body);
      slotHost.appendChild(box);
      slots.push(drop);
    });

    cfg.tiles.forEach(function (t) {
      var tile = btn('lp-tile', esc(t.text), t.text + ', pick up to place');
      tile.setAttribute('aria-pressed', 'false');
      tile.setAttribute('draggable', 'true');
      tile.addEventListener('click', function () { pickUp(tile); });

      // Native drag as a bonus path, same state machine.
      tile.addEventListener('dragstart', function (e) {
        held = tile; setHeld(tile, true);
        if (e.dataTransfer) e.dataTransfer.setData('text/plain', t.text);
      });
      tile.addEventListener('dragend', function () { setHeld(tile, false); held = null; });

      tile.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && held === tile) { pickUp(tile); }
      });
      tiles.push(tile);
      tray.appendChild(tile);
    });

    slots.forEach(function (sb) {
      sb.addEventListener('dragover', function (e) { e.preventDefault(); });
      sb.addEventListener('drop', function (e) {
        e.preventDefault();
        if (held) placeInto(sb);
      });
    });

    // Roving tabindex across the tray: one Tab stop for the whole group, and
    // arrows move within it. This is the pattern screen readers already know.
    function rove(list, e) {
      var i = list.indexOf(document.activeElement);
      if (i === -1) return;
      var next = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = list[(i + 1) % list.length];
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = list[(i - 1 + list.length) % list.length];
      if (!next || next.hidden) return;
      e.preventDefault();
      list.forEach(function (t) { t.tabIndex = -1; });
      next.tabIndex = 0;
      next.focus();
    }
    tray.addEventListener('keydown', function (e) {
      rove(tiles.filter(function (t) { return !t.hidden; }), e);
    });

    // Escape anywhere cancels a held tile.
    stage.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && held) { pickUp(held); }
    });

    tiles.forEach(function (t, i) { t.tabIndex = i === 0 ? 0 : -1; });

    stage.appendChild(tray);
    stage.appendChild(slotHost);

    return {
      placement: function () { return placement; },
      tiles: tiles,
      placedCount: function () {
        return Object.keys(placement).reduce(function (n, k) {
          return n + placement[k].length;
        }, 0);
      },
      lock: function () {
        tiles.concat(slots).forEach(function (b) { b.disabled = true; });
      },
      markSlots: function (isGood) {
        slots.forEach(function (sb) {
          var box = sb.parentNode.parentNode;
          box.classList.remove('is-good', 'is-retry');
          box.classList.add(isGood(sb.getAttribute('data-slot')) ? 'is-good' : 'is-retry');
        });
      }
    };
  }

  // Compare what the student placed against the key. Cards whose target is
  // null are decoys: they are marked wrong if placed anywhere, and the game
  // is only finished once they have been left in the tray.
  //
  // Slots are compared as multisets because two cards in one box can be
  // placed in either order and both are correct.
  function checkBoard(item, board, keyField) {
    var slotsField = keyField === 'box' ? 'boxes' : 'bins';
    var actual = board.placement();
    var wrongSlots = [];
    (item[slotsField] || []).forEach(function (key) {
      var want = (item.cards || [])
        .filter(function (c) { return c[keyField] === key; })
        .map(function (c) { return c.text; }).sort();
      var got = (actual[key] || []).slice().sort();
      if (want.join('\u0000') !== got.join('\u0000')) wrongSlots.push(key);
    });
    // Any card that was placed but has no target is a decoy, wrongly placed.
    var decoyPlaced = (item.cards || []).some(function (c) {
      return c[keyField] == null && Object.keys(actual).some(function (k) {
        return (actual[k] || []).indexOf(c.text) !== -1;
      });
    });
    return { wrongSlots: wrongSlots, decoyPlaced: decoyPlaced, ok: !wrongSlots.length && !decoyPlaced };
  }

  // Shared by DRAG_DROP and SORT: they differ only in the label of the target
  // list, so the check lives in one place.
  function renderPlacementGame(stage, item, ui, keyField, name, promptKey) {
    var slotsField = keyField === 'box' ? 'boxes' : 'bins';
    var board = renderBoard(stage, {
      instruction: item.instruction || item[promptKey],
      slots: (item[slotsField] || []).map(function (b) { return { key: b, label: b }; }),
      tiles: (item.cards || []).map(function (c) { return { text: c.text }; })
    }, ui);

    var needed = (item.cards || []).filter(function (c) { return c[keyField] != null; }).length;

    var check = btn('lp-btn lp-btn--primary', 'Check');
    check.addEventListener('click', function () {
      if (ui.isAnswered()) return;
      if (board.placedCount() < needed) {
        ui.live('Place every card first.');
        return;
      }
      var r = checkBoard(item, board, keyField);
      if (r.ok) {
        board.lock();
        check.disabled = true;
        board.markSlots(function () { return true; });
        ui.submit(true);
      } else {
        board.markSlots(function (k) { return r.wrongSlots.indexOf(k) === -1; });
        ui.submit(false);
      }
    });
    stage.appendChild(check);
  }

  ENGINES.DRAG_DROP = {
    id: 'DRAG_DROP',
    render: function (stage, item, ui) {
      renderPlacementGame(stage, item, ui, 'box', 'boxes', 'prompt');
    }
  };

  ENGINES.SORT = {
    id: 'SORT',
    render: function (stage, item, ui) {
      renderPlacementGame(stage, item, ui, 'bin', 'bins', 'prompt');
    }
  };

  /* ---- sequence ---------------------------------------------------------- */
  /* Same pick-up/put-down idea, plus explicit Move up / Move down buttons,
     which are unambiguous and keyboard-native. */

  ENGINES.SEQUENCE = {
    id: 'SEQUENCE',
    render: function (stage, item, ui) {
      if (item.instruction) {
        stage.appendChild(el('p', 'lp-prompt', esc(item.instruction)));
        stage.appendChild(speakButton(item.instruction, null, 'Read the instruction aloud'));
      }

      var correct = (item.items || []).slice();
      var working = shuffle(correct);
      // A shuffle that happens to land on the answer is a free win; avoid it.
      if (working.length > 1 && working.join('|') === correct.join('|')) {
        working = working.slice(1).concat(working.slice(0, 1));
      }

      var list = el('ol', 'lp-seq');
      var rows = [];

      function paint() {
        list.innerHTML = '';
        rows = [];
        working.forEach(function (text, i) {
          var li = el('li');
          li.appendChild(el('span', 'lp-seq-n', String(i + 1) + '.'));
          li.appendChild(el('span', 'lp-seq-t', esc(text)));
          var up = btn(null, '↑', 'Move "' + text + '" earlier');
          var down = btn(null, '↓', 'Move "' + text + '" later');
          up.disabled = i === 0;
          down.disabled = i === working.length - 1;
          up.addEventListener('click', function () { move(i, -1); });
          down.addEventListener('click', function () { move(i, 1); });
          li.appendChild(up);
          li.appendChild(down);
          list.appendChild(li);
          rows.push(li);
        });
      }

      function move(i, delta) {
        if (ui.isAnswered()) return;
        var j = i + delta;
        if (j < 0 || j >= working.length) return;
        var t = working[i]; working[i] = working[j]; working[j] = t;
        paint();
        ui.live('Moved to position ' + (j + 1) + '.');
        var btns = rows[j].querySelectorAll('button');
        if (btns[0]) btns[0].focus();
      }

      paint();
      stage.appendChild(list);

      var check = btn('lp-btn lp-btn--primary', 'Check the order');
      check.addEventListener('click', function () {
        if (ui.isAnswered()) return;
        var right = working.every(function (t, i) { return t === correct[i]; });
        rows.forEach(function (li, i) {
          li.classList.toggle('is-good', working[i] === correct[i]);
          li.classList.toggle('is-retry', working[i] !== correct[i]);
        });
        if (right) {
          check.disabled = true;
          rows.forEach(function (li) {
            li.querySelectorAll('button').forEach(function (b) { b.disabled = true; });
          });
          ui.submit(true);
        } else {
          ui.submit(false);
        }
      });
      stage.appendChild(check);
    }
  };

  /* ---- match pairs ------------------------------------------------------- */

  ENGINES.MATCH_PAIRS = {
    id: 'MATCH_PAIRS',
    render: function (stage, item, ui) {
      if (item.instruction) {
        stage.appendChild(el('p', 'lp-prompt', esc(item.instruction)));
        stage.appendChild(speakButton(item.instruction, null, 'Read the instruction aloud'));
      }

      var pairs = item.pairs || [];
      var left = pairs.map(function (p) { return { text: p[0], with: p[1] }; });

      // Right-hand values are de-duplicated, and a match is checked by value
      // rather than by position. Real content groups: the teacher's own sets
      // have three colonies in the Middle region and three animals that live in
      // the ocean, which as one card per pair would put three identical "ocean"
      // cards in front of a child and ask them to guess which one is the right
      // one — the same right answer marked wrong two times in three. One card
      // per value stays usable until every left card that belongs to it has
      // been matched.
      var values = [];
      pairs.forEach(function (p) { if (values.indexOf(p[1]) === -1) values.push(p[1]); });
      var right = shuffle(values.slice()).map(function (text) { return { text: text }; });

      var wrap = el('div', 'lp-slots');
      wrap.style.gridTemplateColumns = '1fr 1fr';

      var leftCol = el('div', 'lp-slot');
      leftCol.appendChild(el('div', 'lp-slot-label', 'Match'));
      var rightCol = el('div', 'lp-slot');
      rightCol.appendChild(el('div', 'lp-slot-label', 'With'));

      var leftBody = el('div', 'lp-slot-body');
      var rightBody = el('div', 'lp-slot-body');
      leftCol.appendChild(leftBody);
      rightCol.appendChild(rightBody);
      wrap.appendChild(leftCol); wrap.appendChild(rightCol);

      var selectedLeft = null;
      var done = 0;
      var leftBtns = [], rightBtns = [];

      function refresh() {
        leftBtns.forEach(function (b) { b.setAttribute('aria-pressed', b === selectedLeft ? 'true' : 'false'); });
      }

      left.forEach(function (l) {
        var b = btn('lp-tile', esc(l.text), l.text + ', choose this');
        b.setAttribute('aria-pressed', 'false');
        b.addEventListener('click', function () {
          if (ui.isAnswered() || b.disabled) return;
          selectedLeft = (selectedLeft === b ? null : b);
          refresh();
          ui.live(selectedLeft ? 'Chose ' + l.text + '. Now choose what it matches.' : 'Choice cleared.');
        });
        leftBtns.push(b); leftBody.appendChild(b);
      });

      right.forEach(function (r) {
        var b = btn('lp-tile', esc(r.text), r.text + ', match with the chosen card');
        b.addEventListener('click', function () {
          if (ui.isAnswered()) return;
          if (!selectedLeft) { ui.live('Choose a card on the left first.'); return; }
          var li = leftBtns.indexOf(selectedLeft);
          if (left[li].with === r.text) {
            selectedLeft.disabled = true;
            selectedLeft.classList.add('lp-placed');
            selectedLeft = null; refresh();
            done++;
            sound.play('correct');
            ui.live('Matched ' + left[li].text + '.');
            // The card stays live: it may still be the answer for another left
            // card, and disabling it would make the game unfinishable.
            if (done === left.length) { ui.submit(true); }
          } else {
            b.classList.add('is-retry');
            ui.submit(false);
            setTimeout(function () { b.classList.remove('is-retry'); }, 1200);
          }
        });
        rightBtns.push(b); rightBody.appendChild(b);
      });

      stage.appendChild(wrap);
    }
  };

  /* ---- tap image --------------------------------------------------------- */
  /* The pack asks for tapping a picture but supplies no hit coordinates, so the
     labels are rendered as real buttons beneath the picture rather than
     inventing hotspots that would not line up with the drawing. */

  ENGINES.TAP_IMAGE = {
    id: 'TAP_IMAGE',
    render: function (stage, item, ui) {
      if (item.prompt) {
        stage.appendChild(el('p', 'lp-prompt', esc(item.prompt)));
        stage.appendChild(speakButton(item.prompt, null, 'Read the question aloud'));
      }
      if (item.svg) {
        var fig = el('div', 'lp-visual', item.svg);
        stage.appendChild(fig);
      }

      var list = el('div', 'lp-choices');
      var buttons = [];
      shuffle(item.choices || []).forEach(function (c) {
        var b = btn('lp-choice', '<span class="lp-mark">○</span><span>' + esc(c.label) + '</span>');
        b.addEventListener('click', function () {
          if (ui.isAnswered()) return;
          if (c.correct) {
            b.classList.add('is-good');
            b.querySelector('.lp-mark').textContent = '✓';
            ui.submit(true);
            buttons.forEach(function (x) { x.disabled = true; });
          } else {
            b.classList.add('is-retry');
            b.querySelector('.lp-mark').textContent = '↺';
            b.disabled = true;
            ui.submit(false);
          }
        });
        buttons.push(b);
        list.appendChild(b);
      });
      stage.appendChild(list);
    }
  };

  /* ---- number builder --------------------------------------------------- */

  ENGINES.NUMBER_BUILDER = {
    id: 'NUMBER_BUILDER',
    render: function (stage, item, ui) {
      if (item.prompt) {
        stage.appendChild(el('p', 'lp-prompt', esc(item.prompt)));
        stage.appendChild(speakButton(item.prompt, null, 'Read the question aloud'));
      }

      var target = item.target;
      var places = ['hundreds', 'tens', 'ones'];
      var values = { hundreds: 0, tens: 0, ones: 0 };
      var readout = el('p', 'lp-score-line', '');
      var placeEls = {};

      function current() { return values.hundreds * 100 + values.tens * 10 + values.ones; }
      function paint() {
        places.forEach(function (p) {
          placeEls[p].value.textContent = String(values[p]);
        });
        readout.textContent = 'Your number: ' + current();
        ui.live('Your number is ' + current() + '.');
      }

      var grid = el('div', 'lp-places');
      places.forEach(function (p) {
        var box = el('div', 'lp-place');
        box.appendChild(el('div', 'lp-place-name', p));
        var val = el('div', 'lp-place-value', '0');
        box.appendChild(val);
        var ctl = el('div', 'lp-place-ctl');
        var up = btn(null, '▲', 'More ' + p);
        var dn = btn(null, '▼', 'Fewer ' + p);
        up.addEventListener('click', function () {
          values[p] = Math.min(9, values[p] + 1); paint();
        });
        dn.addEventListener('click', function () {
          values[p] = Math.max(0, values[p] - 1); paint();
        });
        ctl.appendChild(dn); ctl.appendChild(up);
        box.appendChild(ctl);
        grid.appendChild(box);
        placeEls[p] = { value: val, box: box };
      });
      stage.appendChild(grid);
      stage.appendChild(readout);

      var check = btn('lp-btn lp-btn--primary', 'Check my number');
      check.addEventListener('click', function () {
        if (ui.isAnswered()) return;
        if (current() === target) {
          check.disabled = true;
          readout.textContent = 'Your number: ' + current() + '  ✓';
          ui.submit(true);
        } else {
          ui.submit(false);
        }
      });
      stage.appendChild(check);
      paint();
    }
  };

  /* ---- number line ------------------------------------------------------ */
  /* A radiogroup: arrows move, Enter selects, and each tick announces itself. */

  ENGINES.NUMBER_LINE = {
    id: 'NUMBER_LINE',
    render: function (stage, item, ui) {
      if (item.prompt) {
        stage.appendChild(el('p', 'lp-prompt', esc(item.prompt)));
        stage.appendChild(speakButton(item.prompt, null, 'Read the question aloud'));
      }

      // The math source never states a range for its number lines, so the
      // bounds come from the lesson's own scope — "Addition and Subtraction
      // Within 100". The step is chosen to keep the line readable on a phone;
      // the target is always included so the right answer is always reachable.
      var lo = typeof item.min === 'number' ? item.min : 0;
      var hi = typeof item.max === 'number' ? item.max : 100;
      var step = typeof item.step === 'number' ? item.step : ((hi - lo) > 40 ? 5 : 1);

      var ticks = [];
      for (var v = lo; v <= hi; v += step) ticks.push(v);
      if (ticks.indexOf(hi) === -1) ticks.push(hi);
      if (ticks.indexOf(item.target) === -1) ticks.push(item.target);
      ticks.sort(function (a, b) { return a - b; });

      var track = el('div', 'lp-line-track');
      track.setAttribute('role', 'radiogroup');
      track.setAttribute('aria-label', 'Number line. Use the arrow keys and press Enter.');
      var buttons = [];

      ticks.forEach(function (v, i) {
        var b = btn('lp-tick', String(v), 'Pick ' + v);
        b.setAttribute('role', 'radio');
        b.setAttribute('aria-checked', 'false');
        b.tabIndex = i === 0 ? 0 : -1;
        b.addEventListener('click', function () { choose(b, v); });
        b.addEventListener('keydown', function (e) {
          var d = (e.key === 'ArrowRight' || e.key === 'ArrowUp') ? 1
                : (e.key === 'ArrowLeft' || e.key === 'ArrowDown') ? -1 : 0;
          if (d) {
            e.preventDefault();
            var n = buttons[(i + d + buttons.length) % buttons.length];
            buttons.forEach(function (x) { x.tabIndex = -1; });
            n.tabIndex = 0; n.focus();
          } else if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault(); choose(b, v);
          }
        });
        buttons.push(b);
        track.appendChild(b);
      });

      function choose(b, v) {
        if (ui.isAnswered()) return;
        buttons.forEach(function (x) { x.setAttribute('aria-checked', 'false'); });
        b.setAttribute('aria-checked', 'true');
        if (v === item.target) {
          b.classList.add('is-good');
          buttons.forEach(function (x) { x.disabled = true; });
          ui.submit(true);
        } else {
          b.classList.add('is-retry');
          ui.submit(false);
        }
      }

      stage.appendChild(track);
    }
  };

  /* ---- ratio builder ----------------------------------------------------- */
  /* "3 green circles and 5 yellow circles" is a ratio, and a ratio typed into
     one free-text box is a spelling test as much as a maths one. Two number
     pickers joined by a colon ask the maths question and nothing else. */

  ENGINES.RATIO_BUILDER = {
    id: 'RATIO_BUILDER',
    render: function (stage, item, ui) {
      if (item.prompt) {
        stage.appendChild(el('p', 'lp-prompt', esc(item.prompt)));
        stage.appendChild(speakButton(item.prompt, null, 'Read the question aloud'));
      }
      if (item.instruction) stage.appendChild(el('p', 'lp-caption', esc(item.instruction)));

      var labels = item.labels || [];
      var inputs = [];
      var row = el('div', 'lp-ratio');
      [0, 1].forEach(function (i) {
        var box = el('div', 'lp-ratio-part');
        if (labels[i]) box.appendChild(el('span', 'lp-ratio-label', esc(labels[i])));
        var input = el('input', 'lp-input lp-input--num');
        input.type = 'number';
        input.min = '0';
        input.setAttribute('inputmode', 'numeric');
        input.setAttribute('aria-label', (labels[i] || ('amount ' + (i + 1))) + ': number ' + (i + 1));
        box.appendChild(input);
        inputs.push(input);
        row.appendChild(box);
        if (i === 0) row.appendChild(el('span', 'lp-ratio-sep', ':'));
      });
      stage.appendChild(row);

      var check = btn('lp-btn lp-btn--primary', 'Check');
      check.addEventListener('click', function () {
        if (ui.isAnswered()) return;
        if (!String(inputs[0].value).trim() || !String(inputs[1].value).trim()) {
          ui.live('Write both numbers first.');
          return;
        }
        var got = String(inputs[0].value).trim() + ':' + String(inputs[1].value).trim();
        var ok = sameText(got, item.answer);
        inputs.forEach(function (x) {
          x.classList.toggle('is-good', ok);
          x.classList.toggle('is-retry', !ok);
        });
        if (ok) {
          inputs.forEach(function (x) { x.disabled = true; });
          check.disabled = true;
          ui.submit(true);
        } else {
          ui.submit(false);
        }
      });
      stage.appendChild(check);
    }
  };

  /* ---- equation balance -------------------------------------------------- */

  ENGINES.EQUATION_BALANCE = {
    id: 'EQUATION_BALANCE',
    render: function (stage, item, ui) {
      var equation = item.prompt || '';
      if (equation) {
        stage.appendChild(el('p', 'lp-balance-eq', esc(equation)));
        stage.appendChild(speakButton(equation, null, 'Read the equation aloud'));
      }

      var row = el('div', 'lp-solve');
      row.appendChild(el('span', 'lp-solve-x', 'x ='));
      var input = el('input', 'lp-input lp-input--num');
      input.type = 'number';
      input.setAttribute('inputmode', 'numeric');
      input.setAttribute('aria-label', 'The value of x');
      row.appendChild(input);
      stage.appendChild(row);

      var check = btn('lp-btn lp-btn--primary', 'Check');
      check.addEventListener('click', function () {
        if (ui.isAnswered()) return;
        if (!String(input.value).trim()) { ui.live('Write a number first.'); return; }
        var ok = sameText(input.value, item.answer);
        input.classList.toggle('is-good', ok);
        input.classList.toggle('is-retry', !ok);
        if (ok) {
          input.disabled = true;
          check.disabled = true;
          ui.submit(true);
        } else {
          ui.submit(false);
        }
      });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); check.click(); }
      });
      stage.appendChild(check);
    }
  };

  /* ---- sentence frame ---------------------------------------------------- */
  /* The pack's "build the sentence" level: every word is supplied, and the
     child taps them in order. Nothing is typed, so a beginner writes a
     complete academic sentence without needing to spell any of it. */

  ENGINES.SENTENCE_FRAME = {
    id: 'SENTENCE_FRAME',
    render: function (stage, item, ui) {
      if (item.instruction) {
        stage.appendChild(el('p', 'lp-prompt', esc(item.instruction)));
        stage.appendChild(speakButton(item.instruction, null, 'Read the instruction aloud'));
      }

      var target = String(item.answer || '');
      var words = (Array.isArray(item.words) && item.words.length)
        ? item.words.slice()
        : target.split(/\s+/).filter(Boolean);

      var chosen = [];
      var line = el('div', 'lp-build');
      line.setAttribute('role', 'group');
      line.setAttribute('aria-label', 'Your sentence so far');

      var bank = el('div', 'lp-tray');
      bank.setAttribute('role', 'group');
      bank.setAttribute('aria-label', 'Words you can use');

      function paintLine() {
        line.innerHTML = '';
        if (!chosen.length) {
          line.appendChild(el('span', 'lp-caption', 'Tap the words in order.'));
          return;
        }
        chosen.forEach(function (c, i) {
          var chip = btn('lp-tile lp-placed', esc(c.word) + ' <span class="lp-mark">×</span>',
            c.word + ', word ' + (i + 1) + '. Tap to take it back.');
          chip.addEventListener('click', function () {
            if (ui.isAnswered()) return;
            chosen.splice(i, 1);
            c.tile.hidden = false;
            paintLine();
            ui.live(c.word + ' is back in the word list.');
          });
          line.appendChild(chip);
        });
      }

      var tiles = [];
      shuffle(words.map(function (w, i) { return { word: w, i: i }; })).forEach(function (p) {
        var t = btn('lp-tile', esc(p.word), p.word + ', tap to add it to your sentence');
        t.addEventListener('click', function () {
          if (ui.isAnswered() || t.hidden) return;
          t.hidden = true;
          chosen.push({ word: p.word, tile: t });
          paintLine();
          ui.live(p.word + ' added. ' + chosen.length + ' words so far.');
        });
        tiles.push(t);
        bank.appendChild(t);
      });

      paintLine();
      stage.appendChild(line);
      stage.appendChild(bank);

      var check = btn('lp-btn lp-btn--primary', 'Check my sentence');
      check.addEventListener('click', function () {
        if (ui.isAnswered()) return;
        if (!chosen.length) { ui.live('Tap some words first.'); return; }
        var ok = sameText(chosen.map(function (c) { return c.word; }).join(' '), target);
        line.classList.toggle('is-good', ok);
        line.classList.toggle('is-retry', !ok);
        if (ok) {
          tiles.concat(Array.prototype.slice.call(line.querySelectorAll('button')))
            .forEach(function (b) { b.disabled = true; });
          check.disabled = true;
          ui.submit(true);
        } else {
          ui.submit(false);
        }
      });
      stage.appendChild(check);
    }
  };

  /* ---- memory (unused by this pack, kept for completeness of the menu) --- */

  ENGINES.MEMORY = {
    id: 'MEMORY',
    render: function (stage, item, ui) {
      var pairs = (item.pairs || []).slice(0, 6);
      var cards = [];
      pairs.forEach(function (p, i) {
        cards.push({ key: i, face: p.a });
        cards.push({ key: i, face: p.b });
      });
      cards = shuffle(cards);

      var grid = el('div', 'lp-memory');
      var open = [], matched = 0;
      var els = [];

      cards.forEach(function (c, idx) {
        var b = btn('lp-mcard', '?', 'Card ' + (idx + 1) + ', face down');
        b.addEventListener('click', function () {
          if (ui.isAnswered() || b.classList.contains('is-up') || b.classList.contains('is-matched')) return;
          b.textContent = c.face;
          b.classList.add('is-up');
          b.setAttribute('aria-label', 'Card ' + (idx + 1) + ', showing ' + c.face);
          open.push({ b: b, c: c });
          if (open.length === 2) {
            var a = open[0], d = open[1];
            open = [];
            if (a.c.key === d.c.key && a.b !== d.b) {
              a.b.classList.add('is-matched'); d.b.classList.add('is-matched');
              a.b.classList.remove('is-up'); d.b.classList.remove('is-up');
              matched++;
              sound.play('correct');
              if (matched === pairs.length) ui.submit(true);
            } else {
              ui.submit(false);
              setTimeout(function () {
                [a, d].forEach(function (o) {
                  o.b.textContent = '?';
                  o.b.classList.remove('is-up');
                  o.b.setAttribute('aria-label', 'Card face down');
                });
              }, 900);
            }
          }
        });
        els.push(b);
        grid.appendChild(b);
      });
      stage.appendChild(grid);
    }
  };

  /* ============================================================ flow driver */

  var PICKER_SUBJECTS = {
    ela: 'English', math: 'Math', science: 'Science',
    'social-studies': 'Social Studies', review: 'Review'
  };

  function lessonsFor(packId) {
    return D.ordered().filter(function (l) {
      if (packId === 'ela') return l.lesson_id.indexOf('en-') === 0;
      if (packId === 'math') return l.lesson_id.indexOf('ma-') === 0;
      if (packId === 'science') return l.lesson_id.indexOf('sc-') === 0;
      if (packId === 'social-studies') return l.lesson_id.indexOf('ss-') === 0;
      return false;
    });
  }

  var progress = D.loadProgress(window.localStorage, STORAGE_KEY);

  function persist() {
    D.saveProgress(window.localStorage, STORAGE_KEY, progress);
    pushSoon();
  }

  var pushTimer = null;
  function pushSoon() {
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(push, 2000);
  }

  // The server merges (max-wins) and returns the merged record, so one call
  // both writes and reads. A missing route must never break a lesson.
  function push() {
    if (pushTimer) { clearTimeout(pushTimer); pushTimer = null; }
    try {
      fetch('/api/progress/' + STUDENT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessons: progress.lessons, badges: progress.badges })
      }).then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) {
          if (data && data.progress && data.progress.lessons) {
            progress.lessons = data.progress.lessons;
            progress.badges = data.progress.badges || progress.badges;
            D.saveProgress(window.localStorage, STORAGE_KEY, progress);
          }
        })
        .catch(function () {});
    } catch (e) { /* never let syncing break the page */ }
  }

  /* ---- the lesson runner ------------------------------------------------- */

  function openLesson(shell, lessonId) {
    var lesson = D.byId(lessonId);
    if (!lesson) return;
    speak.stop();

    var state = {
      lesson: lesson,
      stepIndex: 0,
      results: {},          // item id -> firstTry correct
      asked: [],            // ordered item ids
      attempts: 0,
      stage: null,
      live: null,
      hintHost: null,
      record: function (item, firstTry) {
        var id = item.id || (lesson.lesson_id + '-anon-' + this.asked.length);
        // Only the first attempt at a question counts, so a retry inside it can
        // never upgrade the score. A game's rounds share one id, though, and
        // the game is the unit of scoring — so a later round that is missed
        // downgrades the whole game. Without that, a four-round fill-the-blank
        // would be decided entirely by its first blank and the other three
        // rounds would count for nothing on the score screen.
        if (this.results[id] === undefined) this.results[id] = !!firstTry;
        else if (!firstTry) this.results[id] = false;
        this.attempts++;
      }
    };

    shell.innerHTML = '';
    shell.setAttribute('data-subject', lesson.subject);

    var card = el('div', 'lp-card');
    var phaseBar = el('div', 'lp-phase-bar');
    var phaseName = el('span', 'lp-phase-name', '');
    var phaseStep = el('span', 'lp-phase-step', '');
    phaseBar.appendChild(phaseName);
    phaseBar.appendChild(phaseStep);
    card.appendChild(phaseBar);

    var track = el('div', 'lp-progress-track');
    var fill = el('div', 'lp-progress-fill');
    track.appendChild(fill);
    card.appendChild(track);

    var stageHost = el('div');
    card.appendChild(stageHost);

    var feedback = el('p', 'lp-feedback');
    feedback.setAttribute('role', 'status');
    feedback.setAttribute('aria-live', 'polite');
    card.appendChild(feedback);

    var hintHost = el('p', 'lp-hint');
    hintHost.hidden = true;
    card.appendChild(hintHost);

    var live = el('p', 'lp-sr');
    live.setAttribute('role', 'status');
    live.setAttribute('aria-live', 'polite');
    card.appendChild(live);

    var actionHost = el('div', 'lp-actions');
    card.appendChild(actionHost);

    // The way forward once the answer has been shown. The pack's third-strike
    // rule is only a rule if the child can then continue: an item that can
    // never resolve would stall the lesson, and with it the score, the badge
    // and the retry step. The miss is recorded as a miss.
    function stuckButton(item, advanceNext) {
      return function () {
        if (actionHost.querySelector('.lp-stuck')) return;
        var b = btn('lp-btn lp-btn--primary lp-stuck', 'Go on →',
          'You have seen the answer. Go on to the next question.');
        b.addEventListener('click', function () {
          state.results[item.id || (lesson.lesson_id + '-anon-' + state.asked.length)] = false;
          advanceNext();
        });
        actionHost.appendChild(b);
        b.focus();
      };
    }

    shell.appendChild(card);

    state.stageHost = stageHost;
    state.feedback = feedback;
    state.hintHost = hintHost;
    state.liveEl = live;
    state.actionHost = actionHost;

    // Derived warm-up: two "which word means ..." questions built from the
    // lesson's own key-word table. The pack asks for two very easy warm-up
    // questions but supplies none, and this uses only the teacher's own words.
    function warmupItems() {
      var words = lesson.keyWords || [];
      if (words.length < 2) return [];
      var picks = words.slice(0, 2);
      return picks.map(function (w, i) {
        var others = words.filter(function (x) { return x.word !== w.word; });
        var distractors = shuffle(others).slice(0, 2).map(function (x) { return x.word; });
        return {
          id: lesson.lesson_id + '-w' + (i + 1),
          engine: 'MULTIPLE_CHOICE',
          prompt: 'Which word means "' + w.meaning + '"?',
          choices: shuffle([w.word].concat(distractors)),
          answer: w.word,
          hint: 'The word starts with "' + w.word.charAt(0).toUpperCase() + '".'
        };
      });
    }

    function stepItems(step) {
      if (step === 'warmup') return warmupItems();
      if (step === 'together') return (lesson.guided || []).slice();
      if (step === 'challenge') return lesson.challenge ? [lesson.challenge] : [];
      return [];
    }

    function setPhase(step) {
      phaseName.textContent = D.STEP_LABELS[step] || step;
      var idx = D.STEPS.indexOf(step) + 1;
      phaseStep.textContent = 'Step ' + idx + ' of ' + D.STEPS.length;
      fill.style.width = Math.round((idx / D.STEPS.length) * 100) + '%';
    }

    function clearStage() {
      speak.stop();
      stageHost.innerHTML = '';
      feedback.textContent = '';
      feedback.className = 'lp-feedback';
      hintHost.hidden = true;
      hintHost.textContent = '';
      actionHost.innerHTML = '';
    }

    function advance() {
      state.stepIndex++;
      render();
    }

    function render() {
      var step = D.STEPS[state.stepIndex];
      if (!step) return;
      clearStage();
      setPhase(step);

      if (step === 'warmup' || step === 'together' || step === 'challenge') {
        return renderItemStep(step);
      }
      if (step === 'learn') return renderLearn();
      if (step === 'look') return renderLook();
      if (step === 'practice') return renderPractice();
      if (step === 'score') return renderScore();
      if (step === 'retry') return renderRetry();
      return renderFinish();
    }

    function renderItemStep(step) {
      var items = stepItems(step);
      if (!items.length) { advance(); return; }
      var i = 0;

      function ask() {
        clearStage();
        setPhase(step);
        if (i >= items.length) { advance(); return; }
        var item = items[i];

        var count = el('div', 'lp-count', 'Question ' + (i + 1) + ' of ' + items.length);
        stageHost.appendChild(count);
        state.asked.push(item.id || item.prompt);

        var ui = makeUi(state, item, state.liveEl);
        state.onStuck = stuckButton(item, function () { i++; ask(); });
        ui.submit = (function (orig) {
          return function (ok, meta) {
            var wasAnswered = ui.isAnswered();
            orig.call(ui, ok, meta);
            if (ok && !wasAnswered) {
              feedback.textContent = (meta && meta.message) || 'Yes! That is right.';
              feedback.className = 'lp-feedback is-good';
              var next = btn('lp-btn lp-btn--primary', i + 1 < items.length ? 'Next' : 'Continue');
              next.addEventListener('click', function () { i++; ask(); });
              actionHost.appendChild(next);
              next.focus();
            } else if (!ok) {
              feedback.textContent = 'Try again. Look at the hint.';
              feedback.className = 'lp-feedback is-retry';
            }
          };
        })(ui.submit);

        var engine = ENGINES[item.engine];
        if (!engine) {
          feedback.textContent = 'This activity is not available.';
          advance();
          return;
        }
        engine.render(stageHost, item, ui);
      }
      ask();
    }

    function renderLearn() {
      var read = lesson.read || {};
      stageHost.appendChild(el('h2', 'lp-title', esc(read.title || lesson.title)));

      var block = el('div', 'lp-read');
      (read.paragraphs || []).forEach(function (p) {
        block.appendChild(el('p', null, esc(p)));
      });
      stageHost.appendChild(block);
      var spans = wordSpansInto(block);

      stageHost.appendChild(speakButton((read.paragraphs || []).join(' '), spans, 'Read the story aloud'));

      var think = lesson.thinkAbout || [];
      if (think.length) {
        stageHost.appendChild(el('p', 'lp-phase-name', 'Think while reading'));
        var ul = el('ul', 'lp-words');
        think.forEach(function (q) {
          var li = el('li');
          li.appendChild(el('b', null, esc(q)));
          ul.appendChild(li);
        });
        stageHost.appendChild(ul);
        stageHost.appendChild(el('p', 'lp-caption', 'Talk about these with your teacher.'));
      }

      // Key words carry the lesson's vocabulary, and two lessons carry a
      // compare table the pack defines but names nowhere else. Both are
      // content, so both are shown rather than left in the data module.
      var words = lesson.keyWords || [];
      if (words.length) {
        stageHost.appendChild(el('p', 'lp-phase-name', 'Key words'));
        var wl = el('ul', 'lp-words');
        words.forEach(function (w) {
          var li = el('li');
          li.appendChild(el('b', null, esc(w.word)));
          li.appendChild(el('span', null, esc(w.meaning)));
          wl.appendChild(li);
        });
        stageHost.appendChild(wl);
      }

      if (lesson.compare) {
        stageHost.appendChild(el('p', 'lp-phase-name', esc(lesson.compare.title || 'Compare')));
        var table = el('table', 'lp-table');
        var thead = el('thead');
        var hr = el('tr');
        (lesson.compare.columns || []).forEach(function (c) {
          hr.appendChild(el('th', null, esc(c)));
        });
        thead.appendChild(hr);
        table.appendChild(thead);
        var tbody = el('tbody');
        (lesson.compare.rows || []).forEach(function (row) {
          var tr = el('tr');
          row.forEach(function (cell) { tr.appendChild(el('td', null, esc(cell))); });
          tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        stageHost.appendChild(table);
      }

      var next = btn('lp-btn lp-btn--primary', 'I read it →');
      next.addEventListener('click', advance);
      actionHost.appendChild(next);
    }

    // Everything the pack supplies for "Look at the Picture": the diagram, and
    // the short scaffolds that go with it — sentence frames, quick help, easy
    // rules. A lesson with a scaffold but no diagram must still show it, so the
    // step advances only when there is neither.
    function renderLook() {
      var v = lesson.visual || {};
      var notes = lesson.notes || [];
      if ((!v.svg) && !notes.length) { advance(); return; }

      if (v.svg) {
        stageHost.appendChild(el('p', 'lp-phase-name', 'Look'));
        var fig = el('div', 'lp-visual', v.svg);
        stageHost.appendChild(fig);
        if (v.alt) stageHost.appendChild(el('p', 'lp-caption', esc(v.alt)));
      }

      notes.forEach(function (n) {
        stageHost.appendChild(el('p', 'lp-phase-name', esc(n.label || 'Remember')));
        var ul = el('ul', 'lp-words');
        (n.lines || []).forEach(function (line) {
          var li = el('li');
          li.appendChild(el('span', null, esc(line)));
          ul.appendChild(li);
        });
        stageHost.appendChild(ul);
        if (n.readAloud !== false) {
          stageHost.appendChild(speakButton((n.lines || []).join(' '), null,
            'Read the ' + (n.label || 'notes') + ' aloud'));
        }
      });

      var next = btn('lp-btn lp-btn--primary', 'Continue →');
      next.addEventListener('click', advance);
      actionHost.appendChild(next);
    }

    // The pack's games run in rounds, and the content encodes a round as one
    // entry that repeats its game's name. Math alone has seventeen rounds, so
    // rendered flat a child would be told "Next game" seventeen times and
    // never see which game they were in. Consecutive entries sharing a name
    // are therefore shown as one game with numbered rounds inside it.
    function groupGames(games) {
      var out = [];
      games.forEach(function (g) {
        var last = out[out.length - 1];
        if (last && last.name === g.name) last.items.push(g);
        else out.push({ name: g.name || 'Game', items: [g] });
      });
      return out;
    }

    function renderPractice() {
      var groups = groupGames(lesson.games || []);
      if (!groups.length) { advance(); return; }
      var g = 0, q = 0;

      function play() {
        clearStage();
        setPhase('practice');
        if (g >= groups.length) { advance(); return; }
        var group = groups[g];
        if (q >= group.items.length) { g++; q = 0; play(); return; }

        var game = group.items[q];
        var multiRound = group.items.length > 1;
        var heading = esc(group.name) +
          (multiRound ? '  ·  ' + (q + 1) + ' of ' + group.items.length : '');
        stageHost.appendChild(el('div', 'lp-count', heading));
        state.asked.push(game.id || game.name);

        var item = game;
        var ui = makeUi(state, item, state.liveEl);
        state.onStuck = stuckButton(item, function () {
          if (q + 1 < group.items.length) { q++; } else { g++; q = 0; }
          play();
        });
        ui.submit = (function (orig) {
          return function (ok, meta) {
            var was = ui.isAnswered();
            orig.call(ui, ok, meta);
            if (ok && !was) {
              feedback.textContent = (meta && meta.message) || 'Yes! That is right.';
              feedback.className = 'lp-feedback is-good';
              var moreInGame = q + 1 < group.items.length;
              var moreGames = g + 1 < groups.length;
              var next = btn('lp-btn lp-btn--primary',
                moreInGame ? 'Next' : (moreGames ? 'Next game' : 'Continue'));
              next.addEventListener('click', function () {
                if (moreInGame) { q++; } else { g++; q = 0; }
                play();
              });
              actionHost.appendChild(next);
              next.focus();
            } else if (!ok) {
              feedback.textContent = 'Try again. Look at the hint.';
              feedback.className = 'lp-feedback is-retry';
            }
          };
        })(ui.submit);

        var engine = ENGINES[game.engine];
        if (!engine) { q++; play(); return; }
        engine.render(stageHost, item, ui);
      }
      play();
    }

    function scoreOf() {
      var ids = Object.keys(state.results);
      var total = ids.length;
      var correct = ids.filter(function (k) { return state.results[k]; }).length;
      return { total: total, correct: correct };
    }

    function renderScore() {
      var s = scoreOf();
      var stars = D.computeStars(s.correct, s.total);
      state.finalStars = stars;

      stageHost.appendChild(el('p', 'lp-phase-name', 'Your score'));
      stageHost.appendChild(el('p', 'lp-score-line',
        'You got ' + s.correct + ' of ' + s.total + ' right.'));
      stageHost.appendChild(el('p', 'lp-score-sub',
        'First try ' + D.percentage(s.correct, s.total) + '%'));

      var starRow = el('div', 'lp-stars');
      for (var i = 1; i <= 3; i++) {
        starRow.appendChild(el('span', 'lp-star' + (i <= stars ? ' is-on' : ''), i <= stars ? '★' : '☆'));
      }
      starRow.setAttribute('aria-label', stars + ' of 3 stars');
      stageHost.appendChild(starRow);

      var next = btn('lp-btn lp-btn--primary',
        s.total - s.correct > 0 ? 'Retry my mistakes →' : 'Finish →');
      next.addEventListener('click', advance);
      actionHost.appendChild(next);
    }

    function renderRetry() {
      var missed = [];
      var seen = {};
      state.asked.forEach(function (id) {
        if (state.results[id] === false && !seen[id]) { seen[id] = true; missed.push(id); }
      });
      // Rebuild the missed items from wherever they came from.
      var pool = warmupItems().concat(lesson.guided || [], lesson.games || []);
      if (lesson.challenge) pool.push(lesson.challenge);
      var items = pool.filter(function (it) { return seen[it.id]; });

      if (!items.length) { advance(); return; }
      var i = 0;

      function again() {
        clearStage();
        setPhase('retry');
        if (i >= items.length) {
          state.retryCleared = true;
          advance();
          return;
        }
        var item = items[i];
        stageHost.appendChild(el('div', 'lp-count', 'Try again ' + (i + 1) + ' of ' + items.length));
        if (item.hint) {
          hintHost.textContent = '💡 Hint: ' + item.hint;
          hintHost.hidden = false;
        }
        var ui = makeUi(state, item, state.liveEl);
        state.onStuck = stuckButton(item, function () { i++; again(); });
        // Retries do not change the score; they only clear mistakes. The same
        // third-strike rule applies here, or a child who cannot answer the
        // question that already defeated them once would be stuck for good.
        var wrongHere = 0;
        ui.submit = function (ok) {
          if (ok) {
            sound.play('correct');
            feedback.textContent = 'Yes! That is right.';
            feedback.className = 'lp-feedback is-good';
            var next = btn('lp-btn lp-btn--primary', i + 1 < items.length ? 'Next' : 'Finish →');
            next.addEventListener('click', function () { i++; again(); });
            actionHost.appendChild(next);
            next.focus();
          } else {
            wrongHere++;
            sound.play('retry');
            feedback.textContent = 'Try again. Look at the hint.';
            feedback.className = 'lp-feedback is-retry';
            if (wrongHere >= 3) ui.reveal();
          }
        };
        var engine = ENGINES[item.engine];
        if (!engine) { i++; again(); return; }
        engine.render(stageHost, item, ui);
      }
      again();
    }

    function renderFinish() {
      var s = scoreOf();
      var stars = state.finalStars || D.computeStars(s.correct, s.total);

      progress = D.recordLesson(progress, lesson.lesson_id, {
        stars: stars, firstTryCorrect: s.correct, total: s.total,
        attempts: 1, retryCleared: !!state.retryCleared
      });
      persist();

      var newBadges = progress.badges;
      sound.play('badge');

      stageHost.appendChild(el('p', 'lp-phase-name', 'All done'));
      stageHost.appendChild(el('p', 'lp-score-line', 'Great work — you finished "' + esc(lesson.title) + '".'));
      var starRow = el('div', 'lp-stars');
      for (var i = 1; i <= 3; i++) {
        starRow.appendChild(el('span', 'lp-star' + (i <= stars ? ' is-on' : ''), i <= stars ? '★' : '☆'));
      }
      stageHost.appendChild(starRow);

      var host = el('div');
      D.BADGES.forEach(function (b) {
        var has = newBadges.indexOf(b.id) !== -1;
        host.appendChild(el('span', 'lp-badge' + (has ? '' : ' lp-badge--locked'),
          b.icon + ' ' + esc(b.label)));
      });
      stageHost.appendChild(host);

      var back = btn('lp-btn', '← All lessons');
      back.addEventListener('click', function () { mount(shell, shell.getAttribute('data-pack') || 'ela'); });
      actionHost.appendChild(back);

      var nextLesson = nextLessonId(lesson.lesson_id);
      if (nextLesson) {
        var nx = btn('lp-btn lp-btn--primary', 'Next lesson →');
        nx.addEventListener('click', function () { openLesson(shell, nextLesson); });
        actionHost.appendChild(nx);
      }
      live.textContent = 'Lesson complete. ' + stars + ' stars.';
      push();
    }

    render();
  }

  function nextLessonId(currentId) {
    var order = D.ordered().map(function (l) { return l.lesson_id; });
    var i = order.indexOf(currentId);
    if (i === -1 || i === order.length - 1) return null;
    var next = order[i + 1];
    // Only offer the next lesson within the same tab's subject.
    if (next.slice(0, 2) !== currentId.slice(0, 2)) return null;
    return next;
  }

  /* ---- the picker ------------------------------------------------------- */

  function mount(shell, packId) {
    packId = packId || shell.getAttribute('data-pack') || 'ela';
    speak.stop();
    var subject = PICKER_SUBJECTS[packId] || packId;
    shell.setAttribute('data-subject', subject === 'Review' ? 'English' : subject);

    if (packId === 'review') return mountReview(shell);

    var lessons = lessonsFor(packId);
    if (!lessons.length) {
      shell.innerHTML = '';
      var empty = el('div', 'lp-card');
      empty.appendChild(el('p', 'lp-caption', 'This subject is being prepared. Check back soon!'));
      shell.appendChild(empty);
      return;
    }

    shell.innerHTML = '';
    var card = el('div', 'lp-card');
    card.appendChild(el('p', 'lp-eyebrow', esc(subject) + ' · Grade ' + GRADE));
    card.appendChild(el('h2', 'lp-title', esc(lessons[0].subject) + ' Lessons'));
    card.appendChild(el('p', 'lp-objective', 'Choose a lesson. You can do them in any order.'));

    var picker = el('div', 'lp-picker');
    lessons.forEach(function (l) {
      var rec = progress.lessons[l.lesson_id];
      var stars = rec ? rec.stars : 0;
      var b = btn('lp-pick');
      var main = el('div', 'lp-pick-main');
      main.appendChild(el('span', 'lp-pick-title', esc(l.title)));
      main.appendChild(el('span', 'lp-pick-sub', esc(l.objective)));
      b.appendChild(main);
      var starTxt = '';
      for (var i = 1; i <= 3; i++) starTxt += (i <= stars ? '★' : '☆');
      var sr = el('span', 'lp-pick-stars', starTxt);
      sr.setAttribute('aria-label', stars + ' of 3 stars earned');
      b.appendChild(sr);
      b.setAttribute('aria-label', l.title + '. ' + (stars ? stars + ' of 3 stars earned.' : 'Not started.'));
      b.addEventListener('click', function () { openLesson(shell, l.lesson_id); });
      picker.appendChild(b);
    });
    card.appendChild(picker);

    var sum = D.summarise(progress);
    card.appendChild(el('p', 'lp-score-sub',
      sum.lessonsDone + ' of ' + D.LESSON_ORDER.length + ' lessons done · ' +
      sum.stars + ' stars earned'));

    shell.appendChild(card);
  }

  /* ---- the master review ------------------------------------------------ */
  /* Four rounds of two questions each, drawn verbatim from the pack's Master
     Review. The pack says to unlock it after all 8 lessons; the teacher's
     "everything open" decision overrides that, so it is always playable and
     the badge summary carries the reward instead. */

  function reviewRounds() {
    // A pack of another grade supplies its own rounds through the page config;
    // the Grade 2 pack's are built in here.
    if (D.REVIEW && D.REVIEW.length) return D.REVIEW;
    return [
      { name: 'Round 1: English', items: [
        { id: 'rv-e1', engine: 'MULTIPLE_CHOICE', prompt: 'What is a character?',
          choices: ['A person or animal in a story', 'Where and when a story happens', 'What happens in a story'],
          answer: 'A person or animal in a story', hint: 'Think about who is in the story.' },
        { id: 'rv-e2', engine: 'MULTIPLE_CHOICE', prompt: 'What is the main idea?',
          choices: ['What a text is mostly about', 'A small fact in the text', 'The last sentence'],
          answer: 'What a text is mostly about', hint: 'It is the big idea of the whole text.' }
      ] },
      { name: 'Round 2: Math', items: [
        { id: 'rv-m1', engine: 'MULTIPLE_CHOICE', prompt: 'What is the value of the 5 in 352?',
          choices: ['50', '5', '500'], answer: '50', hint: 'The 5 is in the tens place.' },
        { id: 'rv-m2', engine: 'FILL_BLANK', mode: 'type', before: '43 + 24 =', after: '',
          answer: '67', hint: 'Add the tens, then add the ones.' }
      ] },
      { name: 'Round 3: Science', items: [
        { id: 'rv-s1', engine: 'MULTIPLE_CHOICE', prompt: 'Name two things a plant needs.',
          choices: ['Water and light', 'Toys and books', 'Shoes and hats'],
          answer: 'Water and light', hint: 'Plants need water, light, air and space.' },
        { id: 'rv-s2', engine: 'MULTIPLE_CHOICE', prompt: 'What is a habitat?',
          choices: ['The place where a living thing lives', 'A kind of food', 'A plant part'],
          answer: 'The place where a living thing lives', hint: 'It is where an animal makes its home.' }
      ] },
      { name: 'Round 4: Social Studies', items: [
        { id: 'rv-ss1', engine: 'MULTIPLE_CHOICE',
          prompt: 'Which community often has tall buildings and many people?',
          choices: ['Urban', 'Rural', 'Suburban'], answer: 'Urban',
          hint: 'Urban means a city.' },
        { id: 'rv-ss2', engine: 'MULTIPLE_CHOICE', prompt: 'Why do communities have rules?',
          choices: ['To help people stay safe and work together', 'To make people unhappy', 'To stop people playing'],
          answer: 'To help people stay safe and work together', hint: 'Think about why we have rules at school.' }
      ] }
    ];
  }

  function mountReview(shell) {
    shell.innerHTML = '';
    var card = el('div', 'lp-card');

    // Nothing to review yet: the summary below would read "0 of 0 lessons done"
    // over an empty table, which looks broken rather than unfinished.
    if (!D.LESSONS.length) {
      card.appendChild(el('p', 'lp-eyebrow', 'Review · Grade ' + GRADE));
      card.appendChild(el('h2', 'lp-title', 'Master Review'));
      card.appendChild(el('p', 'lp-caption', 'The review is being prepared. Check back soon!'));
      shell.appendChild(card);
      return;
    }

    card.appendChild(el('p', 'lp-eyebrow', 'Review · Grade ' + GRADE));
    card.appendChild(el('h2', 'lp-title', 'Master Review'));
    card.appendChild(el('p', 'lp-objective', 'A mix of everything you learned.'));

    var sum = D.summarise(progress);
    var host = el('div');
    D.BADGES.forEach(function (b) {
      var has = progress.badges.indexOf(b.id) !== -1;
      host.appendChild(el('span', 'lp-badge' + (has ? '' : ' lp-badge--locked'),
        b.icon + ' ' + esc(b.label)));
    });
    card.appendChild(host);

    card.appendChild(el('p', 'lp-score-sub',
      sum.lessonsDone + ' of ' + D.LESSON_ORDER.length + ' lessons done · ' +
      sum.stars + ' stars earned'));

    var table = el('div', 'lp-words');
    sum.rows.forEach(function (r) {
      var row = el('li');
      row.appendChild(el('b', null, esc(r.title)));
      var stars = '';
      for (var i = 1; i <= 3; i++) stars += (i <= r.stars ? '★' : '☆');
      row.appendChild(el('span', null, stars + '  ' +
        (r.done ? (r.firstTryCorrect + ' of ' + r.total + ' first try') : 'not started yet')));
      table.appendChild(row);
    });
    card.appendChild(table);

    var start = btn('lp-btn lp-btn--primary lp-btn--wide', 'Start the review →');
    start.addEventListener('click', function () {
      card.innerHTML = '';
      runReview(card, shell);
    });
    card.appendChild(start);
    shell.appendChild(card);
  }

  function runReview(card, shell) {
    var rounds = reviewRounds();
    var results = {};
    var ri = 0, qi = 0;

    function done() {
      var ids = Object.keys(results);
      var correct = ids.filter(function (k) { return results[k]; }).length;
      card.innerHTML = '';
      card.appendChild(el('p', 'lp-eyebrow', 'Review · Grade ' + GRADE));
      card.appendChild(el('h2', 'lp-title', 'Review complete'));
      card.appendChild(el('p', 'lp-score-line', 'You got ' + correct + ' of ' + ids.length + ' right.'));
      var back = btn('lp-btn lp-btn--primary', '← Back to review');
      back.addEventListener('click', function () { mountReview(shell); });
      card.appendChild(back);
      liveSay('Review complete. You got ' + correct + ' of ' + ids.length + ' right.');
    }

    function ask() {
      if (ri >= rounds.length) { done(); return; }
      var round = rounds[ri];
      if (qi >= round.items.length) { ri++; qi = 0; ask(); return; }
      var item = round.items[qi];

      card.innerHTML = '';
      card.appendChild(el('p', 'lp-eyebrow', 'Review · Grade ' + GRADE));
      card.appendChild(el('h2', 'lp-title', round.name));
      card.appendChild(el('div', 'lp-count', 'Question ' + (qi + 1) + ' of ' + round.items.length));

      var fb = el('p', 'lp-feedback');
      fb.setAttribute('role', 'status');
      fb.setAttribute('aria-live', 'polite');
      card.appendChild(fb);

      var hint = el('p', 'lp-hint');
      hint.hidden = true;
      card.appendChild(hint);

      var live = el('p', 'lp-sr');
      live.setAttribute('role', 'status');
      live.setAttribute('aria-live', 'polite');
      card.appendChild(live);

      var actions = el('div', 'lp-actions');
      card.appendChild(actions);

      var answered = false, wrong = 0;
      var state = { onAttempt: null };
      var ui = {
        item: item,
        isAnswered: function () { return answered; },
        live: function (m) { live.textContent = m; },
        hint: function () {
          if (!item.hint) return;
          hint.textContent = '💡 Hint: ' + item.hint;
          hint.hidden = false;
        },
        speakBtn: speakButton,
        submit: function (ok) {
          if (answered) return;
          if (ok) {
            answered = true;
            results[item.id] = wrong === 0;
            sound.play('correct');
            fb.textContent = 'Yes! That is right.';
            fb.className = 'lp-feedback is-good';
            var nx = btn('lp-btn lp-btn--primary', 'Next');
            nx.addEventListener('click', function () { qi++; ask(); });
            actions.appendChild(nx);
            nx.focus();
          } else {
            wrong++;
            sound.play('retry');
            fb.textContent = 'Try again. Look at the hint.';
            fb.className = 'lp-feedback is-retry';
            if (wrong === 1) ui.hint();
          }
        }
      };

      var engine = ENGINES[item.engine];
      if (engine) engine.render(card, item, ui);

      // Actions must sit after the engine's own controls, so move them down.
      card.appendChild(actions);
    }
    ask();
  }

  function liveSay(msg) {
    var region = document.getElementById('lp-live-global');
    if (region) region.textContent = msg;
  }

  /* ==================================================================== init */

  function eachShell(fn) {
    Array.prototype.slice.call(document.querySelectorAll('[data-lp-shell], .lp-shell'))
      .forEach(fn);
  }

  function init() {
    if (!D) return;
    // Deliberately not guarded on LESSONS.length: a page whose content has not
    // landed yet still mounts, and each tab renders its own "being prepared"
    // card. Returning early here would leave visibly empty tabs instead — the
    // difference between a page that looks unfinished and one that looks broken.
    eachShell(function (shell) {
      if (shell.getAttribute('data-lp-mounted')) return;
      shell.setAttribute('data-lp-mounted', '1');
      mount(shell, shell.getAttribute('data-pack'));
    });
  }

  var LessonPack = {
    init: init,
    mount: mount,
    open: openLesson,
    speak: speak,
    sound: sound,
    engines: ENGINES,
    // Reading location.hash here is deliberate. tabs.js fires a synthetic
    // tab.click() at parse time, before this script loads, so a deep link to
    // #science would otherwise land on an unmounted shell.
    activate: function (tabId) {
      eachShell(function (shell) {
        if (shell.getAttribute('data-pack') === tabId) {
          if (!shell.getAttribute('data-lp-mounted')) {
            shell.setAttribute('data-lp-mounted', '1');
          }
          mount(shell, tabId);
        }
      });
    },
    progress: function () { return progress; },
    refresh: function () { progress = D.loadProgress(window.localStorage, STORAGE_KEY); },
    push: push
  };

  window.LessonPack = LessonPack;

  function boot() {
    init();
    var hash = (location.hash || '').replace('#', '');
    if (hash) LessonPack.activate(hash);
    Array.prototype.slice.call(document.querySelectorAll('.tab-btn[data-tab]'))
      .forEach(function (b) {
        b.addEventListener('click', function () { LessonPack.activate(b.dataset.tab); });
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // Stop speech when the page is hidden, so a background tab is not talking.
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) speak.stop();
  });
  window.addEventListener('pagehide', function () { speak.stop(); push(); });
})();
