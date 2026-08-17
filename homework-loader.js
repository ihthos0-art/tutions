(function () {
  'use strict';
  var individualStudent = new URLSearchParams(location.search).get('student');
  var STUDENT = (individualStudent === 'salma' || individualStudent === 'khadija')
    ? individualStudent
    : (document.documentElement.dataset.studentId ||
      location.pathname.split('/').pop().replace('.html', '') || 'index');
  window.HW = { content: null, student: STUDENT };

  function applyIndividualStudentLabel() {
    if (STUDENT !== 'salma' && STUDENT !== 'khadija') return;
    var name = STUDENT.charAt(0).toUpperCase() + STUDENT.slice(1);
    document.title = document.title.replace('Salma & Khadija', name);
    document.querySelectorAll('.school-name').forEach(function (element) {
      element.textContent = element.textContent.replace('Salma & Khadija', name);
    });
  }

  applyIndividualStudentLabel();

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

  function addAssignmentStyles() {
    if (document.getElementById('assigned-month-styles')) return;
    var style = document.createElement('style');
    style.id = 'assigned-month-styles';
    style.textContent = [
      '#assigned .assignment-month { max-width: 900px; margin: 32px auto 0; background: #fff; border: 1px solid #c8c8c8; border-radius: 6px; box-shadow: 0 2px 16px rgba(0,0,0,.09); padding: 32px; }',
      '#assigned .assignment-month-header { border-bottom: 2px solid #1a1a1a; margin-bottom: 24px; padding-bottom: 16px; }',
      '#assigned .assignment-month-label { color: #888; font: 700 10px/1.2 Merriweather Sans, sans-serif; letter-spacing: .22em; margin: 0 0 8px; text-transform: uppercase; }',
      '#assigned .assignment-month-title { font: 700 clamp(22px, 4vw, 30px)/1.2 Merriweather, Georgia, serif; margin: 0; }',
      '#assigned .assignment-month-instructions { color: #555; font: italic 14px/1.6 Merriweather, Georgia, serif; margin: 8px 0 0; }',
      '#assigned .assignment-question-list { display: grid; gap: 12px; grid-template-columns: repeat(2, minmax(0, 1fr)); list-style: none; margin: 0; padding: 0; }',
      '#assigned .assignment-question { align-items: start; background: #fafaf8; border: 1px solid #e2e0db; border-radius: 4px; display: grid; gap: 10px; grid-template-columns: minmax(0, 1fr) minmax(82px, 22%); min-width: 0; padding: 13px; }',
      '#assigned .assignment-question-text { font: 700 16px/1.55 Merriweather, Georgia, serif; min-width: 0; overflow-wrap: anywhere; }',
      '#assigned .assignment-question-number { color: #777; display: inline-block; font: 700 12px/1.6 Merriweather Sans, sans-serif; margin-right: 7px; min-width: 24px; text-align: right; }',
      '#assigned .assignment-answer-input { align-self: center; background: #fff; border: 2px solid #c8c8c8; border-radius: 3px; color: #1a1a1a; font: 700 16px/1.3 Merriweather, Georgia, serif; min-width: 0; padding: 8px; text-align: center; width: 100%; }',
      '#assigned .assignment-answer-input:focus { border-color: #1a1a1a; outline: none; }',
      '#assigned .math-fraction { display: inline-grid; grid-template-rows: auto auto; line-height: 1; margin: 0 .08em; text-align: center; vertical-align: middle; }',
      '#assigned .math-numerator { border-bottom: 1.5px solid currentColor; padding: 0 .16em .08em; }',
      '#assigned .math-denominator { padding: .08em .16em 0; }',
      '@media (max-width: 680px) { #assigned .assignment-month { margin-top: 22px; padding: 24px 18px; } #assigned .assignment-question-list { grid-template-columns: 1fr; } #assigned .assignment-question { grid-template-columns: minmax(0, 1fr); } #assigned .assignment-answer-input { max-width: 180px; text-align: left; } }'
    ].join('\n');
    document.head.appendChild(style);
  }

  function renderAugustAssignment(assignment) {
    var assigned = document.querySelector('#assigned');
    if (!assigned || !assignment || !Array.isArray(assignment.questions)) return;
    var existing = assigned.querySelector('[data-assignment-month="august"]');
    if (existing) existing.remove();
    addAssignmentStyles();

    var section = document.createElement('section');
    section.className = 'assignment-month';
    section.dataset.assignmentMonth = 'august';
    section.setAttribute('aria-labelledby', 'august-assignment-title');

    var header = document.createElement('header');
    header.className = 'assignment-month-header';
    var label = document.createElement('p');
    label.className = 'assignment-month-label';
    label.textContent = 'August · Assigned';
    var title = document.createElement('h2');
    title.className = 'assignment-month-title';
    title.id = 'august-assignment-title';
    title.textContent = assignment.title;
    var instructions = document.createElement('p');
    instructions.className = 'assignment-month-instructions';
    instructions.textContent = 'Show your work. Your responses save separately for your account.';
    header.append(label, title, instructions);

    var list = document.createElement('ol');
    list.className = 'assignment-question-list';
    assignment.questions.forEach(function (question, index) {
      var item = document.createElement('li');
      item.className = 'assignment-question';
      var prompt = document.createElement('span');
      prompt.className = 'assignment-question-text';
      var number = document.createElement('span');
      number.className = 'assignment-question-number';
      number.textContent = (index + 1) + '.';
      prompt.appendChild(number);
      if (window.MathRenderer) window.MathRenderer.renderMath(prompt, question);
      else prompt.appendChild(document.createTextNode(String(question).replace(/\[\[|\]\]/g, '')));

      var response = document.createElement('input');
      response.className = 'assignment-answer-input';
      response.type = 'text';
      response.autocomplete = 'off';
      response.inputMode = 'text';
      response.dataset.save = 'august-math-q' + (index + 1);
      response.setAttribute('aria-label', 'Response for question ' + (index + 1));
      item.append(prompt, response);
      list.appendChild(item);
    });
    section.append(header, list);
    assigned.appendChild(section);
  }

  function renderStories(stories) {
    var container = document.querySelector('#assigned');
    if (!container || !stories || !stories.length) return;
    var story = stories[0];
    if (!story) return;

    // Title: try .passage-title (mahiya/manha) then .ws-title (other pages)
    var titleEl = container.querySelector('.passage-title') || container.querySelector('.ws-title');
    if (titleEl) titleEl.textContent = story.title;

    // Passage: first .passage-box in assigned
    var passageEl = container.querySelector('.passage-box');
    if (passageEl) {
      passageEl.innerHTML = story.paragraphs.map(function (p) {
        return '<p>' + esc(p) + '</p>';
      }).join('');
    }

    // Prompt: first .section-question in assigned
    if (story.prompt) {
      var questionEl = container.querySelector('.section-question');
      if (questionEl) questionEl.textContent = story.prompt;
    }
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
    content = content || {};
    window.HW.content = content;
    if (content.assigned) {
      if (content.assigned.fillBlank) renderFillBlank(content.assigned.fillBlank);
      if (content.assigned.math) renderMath('#assigned .problems-grid', content.assigned.math);
      if (content.assigned.stories) renderStories(content.assigned.stories);
      if (content.assigned.august) renderAugustAssignment(content.assigned.august);
    }
    if (window.AugustAssignments && window.AugustAssignments[STUDENT]) {
      renderAugustAssignment((content.assigned && content.assigned.august) || window.AugustAssignments[STUDENT]);
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
