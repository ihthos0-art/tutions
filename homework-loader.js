(function () {
  'use strict';
  var STUDENT = location.pathname.split('/').pop().replace('.html', '') || 'index';
  window.HW = { content: null, student: STUDENT };

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function renderFillBlank(fb) {
    var wb = document.querySelector('#assigned .wb-words');
    var list = document.querySelector('#assigned .fitb-list');
    if (!wb || !list || !fb) return;
    wb.innerHTML = fb.wordBank.map(function (w) {
      return '<span class="wb-chip" data-word="' + esc(w) + '">' + esc(w) + '</span>';
    }).join('');
    list.innerHTML = fb.sentences.map(function (s, i) {
      return '<div class="fitb-item"><span class="fitb-num">' + (i + 1) + '.</span>' +
        '<p class="fitb-text">' + esc(s.before) +
        '<span class="fitb-drop" data-save="hw' + (i + 1) + '" data-answer="' + esc(s.answer) + '"></span>' +
        esc(s.after) + '</p></div>';
    }).join('');
  }

  function renderMath(targetSel, math) {
    var grid = document.querySelector(targetSel);
    if (!grid || !math) return;
    grid.innerHTML = math.problems.map(function (p, i) {
      return '<div class="problem"><span class="problem-eq">' + esc(p.q) +
        '</span><input class="ans-input" type="text" data-save="m1-' + (i + 1) +
        '" data-answer="' + esc(p.answer) + '" placeholder="?" /></div>';
    }).join('');
  }

  function renderStories(stories) {
    var container = document.querySelector('#assigned');
    if (!container || !stories || !stories.length) return;
    // Find all existing story ws-cards (skip the first card which is fill-in-blank)
    var cards = container.querySelectorAll('.ws-card[data-story-slot]');
    if (!cards.length) return;
    stories.forEach(function (story, i) {
      var card = cards[i];
      if (!card) return;
      var titleEl = card.querySelector('.ws-title');
      var passageEl = card.querySelector('.passage-box');
      var questionEl = card.querySelector('.section-question');
      if (titleEl) titleEl.textContent = story.title;
      if (passageEl) passageEl.innerHTML = story.paragraphs.map(function (p) {
        return '<p>' + esc(p) + '</p>';
      }).join('');
      if (questionEl) questionEl.textContent = story.prompt;
    });
  }

  function renderEla(ela) {
    var container = document.querySelector('#ela');
    if (!container || !ela) return;
    var titleEl = container.querySelector('.ws-title');
    var passageEl = container.querySelector('.passage-box');
    if (titleEl) titleEl.textContent = ela.title;
    if (passageEl) passageEl.innerHTML = ela.paragraphs.map(function (p) {
      return '<p>' + esc(p) + '</p>';
    }).join('');
    if (ela.questions && ela.questions.length) {
      var q = ela.questions[0];
      var qEl = container.querySelector('.section-question');
      var ta = container.querySelector('textarea[data-save]');
      if (qEl) qEl.textContent = q.question;
      if (ta) {
        ta.dataset.save = q.save;
        ta.placeholder = q.placeholder || '';
      }
    }
  }

  function apply(content) {
    if (!content) return;
    window.HW.content = content;
    if (content.assigned) {
      if (content.assigned.fillBlank) renderFillBlank(content.assigned.fillBlank);
      if (content.assigned.math) renderMath('#assigned .problems-grid', content.assigned.math);
      if (content.assigned.stories) renderStories(content.assigned.stories);
    }
    if (content.math) renderMath('#math .math-grid', content.math);
    if (content.ela) renderEla(content.ela);
  }

  // Fetch homework from server, then call initAll so event handlers bind to the new DOM.
  window.HW.ready = fetch('/api/homework/' + STUDENT)
    .then(function (r) { return r.json(); })
    .then(function (d) { apply(d.content); })
    .catch(function () { /* offline/no KV → keep static HTML */ })
    .then(function () { if (typeof window.initAll === 'function') window.initAll(); });
})();
