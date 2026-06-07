(function () {
  'use strict';

  var API_URL = '/api/chat';

  async function groqChat(messages) {
    try {
      var res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messages, temperature: 0.7, max_tokens: 1024 })
      });
      var data = await res.json();
      return data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : null;
    } catch (e) { return null; }
  }

  function escapeHtml(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  // ===== AUTO-QUIZ =====
  var passages = document.querySelectorAll('.passage-box');
  if (!passages.length) return;

  var style = document.createElement('style');
  style.textContent = [
    '.ai-quiz-btn{font-family:"Merriweather Sans",sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;padding:8px 16px;border:1.5px solid #1a1a1a;border-radius:4px;background:#1a1a1a;color:#fff;cursor:pointer;margin-top:12px;transition:all 0.2s}',
    '.ai-quiz-btn:hover{background:#333}',
    '.ai-quiz-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10002;display:none;align-items:center;justify-content:center}',
    '.ai-quiz-overlay.show{display:flex}',
    '.ai-quiz-box{background:#fff;border-radius:12px;padding:28px;max-width:480px;width:90%;max-height:80vh;overflow-y:auto;box-shadow:0 12px 48px rgba(0,0,0,0.2)}',
    '.ai-quiz-box h3{font-family:"Merriweather",serif;font-size:20px;margin-bottom:4px}',
    '.ai-quiz-box .subtitle{font-family:"Merriweather Sans",sans-serif;font-size:11px;color:#888;margin-bottom:20px}',
    '.ai-quiz-q{margin-bottom:20px}',
    '.ai-quiz-q p{font-family:"Merriweather",serif;font-size:14px;font-weight:700;margin-bottom:10px;line-height:1.5}',
    '.ai-quiz-opt{display:block;width:100%;text-align:left;padding:10px 14px;margin-bottom:6px;border:1.5px solid #d4d2cc;border-radius:6px;background:#f9f8f5;font-family:"Merriweather Sans",sans-serif;font-size:13px;cursor:pointer;transition:all 0.2s}',
    '.ai-quiz-opt:hover{border-color:#1a1a1a;background:#fff}',
    '.ai-quiz-opt.correct{background:#d4edda;border-color:#27ae60;color:#155724}',
    '.ai-quiz-opt.wrong{background:#f8d7da;border-color:#e74c3c;color:#721c24}',
    '.ai-quiz-opt.disabled{opacity:0.6;cursor:not-allowed}',
    '.ai-quiz-result{text-align:center;padding:16px;font-family:"Merriweather Sans",sans-serif;font-size:16px;font-weight:700}',
    '.ai-quiz-close{position:absolute;top:12px;right:16px;font-size:20px;cursor:pointer;color:#888}',
    '.ai-quiz-close:hover{color:#1a1a1a}'
  ].join('\n');
  document.head.appendChild(style);

  passages.forEach(function (box, idx) {
    var text = box.textContent || box.innerText;
    if (text.trim().length < 100) return;

    var btn = document.createElement('button');
    btn.className = 'ai-quiz-btn';
    btn.textContent = 'Quick Check Quiz';
    box.parentNode.insertBefore(btn, box.nextSibling);

    btn.addEventListener('click', function () {
      startQuiz(text, idx);
    });
  });

  async function startQuiz(passageText, idx) {
    var overlay = document.createElement('div');
    overlay.className = 'ai-quiz-overlay show';
    overlay.innerHTML = '<div class="ai-quiz-box"><div class="ai-quiz-close">&times;</div><h3>Quick Check</h3><p class="subtitle">3 questions about what you just read</p><div id="ai-quiz-content"><p style="text-align:center;color:#888;font-style:italic">Loading questions...</p></div></div>';
    document.body.appendChild(overlay);

    overlay.querySelector('.ai-quiz-close').addEventListener('click', function () {
      overlay.remove();
    });
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) overlay.remove();
    });

    var prompt = 'Based on this passage, create exactly 3 multiple-choice reading comprehension questions for a grade 1-8 ESL student. Each question must have 4 options (A, B, C, D) with exactly one correct answer. Return ONLY a JSON array in this exact format: [{"question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"answer":0}]. The "answer" field is the zero-based index of the correct option. No markdown, no explanation, only the JSON array.\n\nPassage:\n' + passageText.substring(0, 1500);

    var reply = await groqChat([
      { role: 'system', content: 'You create simple reading comprehension quizzes for ESL students. Return ONLY a raw JSON array. No markdown, no code blocks, no extra text.' },
      { role: 'user', content: prompt }
    ]);

    var content = overlay.querySelector('#ai-quiz-content');
    if (!reply) {
      content.innerHTML = '<p style="text-align:center;color:#e74c3c">Could not load quiz. Please try again!</p>';
      return;
    }

    var questions;
    try {
      var clean = reply.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      var match = clean.match(/\[.*\]/s);
      questions = JSON.parse(match ? match[0] : clean);
      if (!Array.isArray(questions) || questions.length === 0) throw new Error('empty');
    } catch (e) {
      content.innerHTML = '<p style="text-align:center;color:#e74c3c">Could not parse quiz. Please try again!</p>';
      return;
    }

    renderQuiz(content, questions);
  }

  function renderQuiz(container, questions) {
    var current = 0;
    var correctCount = 0;

    function showQuestion() {
      if (current >= questions.length) {
        showResult();
        return;
      }
      var q = questions[current];
      var html = '<div class="ai-quiz-q"><p>Q' + (current + 1) + '. ' + escapeHtml(q.question) + '</p>';
      q.options.forEach(function (opt, i) {
        html += '<button class="ai-quiz-opt" data-idx="' + i + '">' + escapeHtml(opt) + '</button>';
      });
      html += '</div>';
      container.innerHTML = html;

      container.querySelectorAll('.ai-quiz-opt').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var selected = parseInt(this.dataset.idx);
          var isCorrect = selected === q.answer;
          if (isCorrect) correctCount++;

          container.querySelectorAll('.ai-quiz-opt').forEach(function (b, i) {
            b.classList.add('disabled');
            b.disabled = true;
            if (i === q.answer) b.classList.add('correct');
            else if (i === selected) b.classList.add('wrong');
          });

          setTimeout(function () {
            current++;
            showQuestion();
          }, 1200);
        });
      });
    }

    function showResult() {
      var pct = correctCount / questions.length;
      var msg;
      if (pct === 1) msg = '🎉 Perfect! ' + correctCount + '/' + questions.length + ' correct!';
      else if (pct >= 0.66) msg = '👍 Great job! ' + correctCount + '/' + questions.length + ' correct!';
      else msg = '💪 Good try! ' + correctCount + '/' + questions.length + ' correct. Keep reading!';
      container.innerHTML = '<div class="ai-quiz-result">' + msg + '</div>';
    }

    showQuestion();
  }
})();
