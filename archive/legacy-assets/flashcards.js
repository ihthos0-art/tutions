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

  // ===== SPACED REPETITION FLASHCARDS =====
  var style = document.createElement('style');
  style.textContent = [
    '.ai-fc-btn{position:fixed;bottom:92px;right:24px;width:56px;height:56px;border-radius:50%;background:#27ae60;color:#fff;border:none;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,0.2);z-index:9998;display:flex;align-items:center;justify-content:center;font-size:22px;transition:transform 0.2s}',
    '.ai-fc-btn:hover{transform:scale(1.1)}',
    '.ai-fc-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10003;display:none;align-items:center;justify-content:center}',
    '.ai-fc-overlay.show{display:flex}',
    '.ai-fc-box{background:#fff;border-radius:16px;padding:32px;max-width:400px;width:90%;text-align:center;box-shadow:0 12px 48px rgba(0,0,0,0.2)}',
    '.ai-fc-box h3{font-family:"Merriweather",serif;font-size:22px;margin-bottom:8px}',
    '.ai-fc-box .subtitle{font-family:"Merriweather Sans",sans-serif;font-size:12px;color:#888;margin-bottom:24px}',
    '.ai-fc-card{width:100%;min-height:160px;background:#f9f8f5;border:2px solid #e2e0db;border-radius:12px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.3s;margin-bottom:20px;padding:20px}',
    '.ai-fc-card:hover{border-color:#1a1a1a}',
    '.ai-fc-card .word{font-family:"Merriweather",serif;font-size:28px;font-weight:700;color:#1a1a1a}',
    '.ai-fc-card .def{font-family:"Merriweather",serif;font-size:16px;color:#555;line-height:1.5}',
    '.ai-fc-actions{display:flex;gap:10px;justify-content:center}',
    '.ai-fc-actions button{font-family:"Merriweather Sans",sans-serif;font-size:13px;font-weight:700;padding:10px 20px;border-radius:8px;border:2px solid;cursor:pointer;transition:all 0.2s}',
    '.ai-fc-actions .again{background:#fff;border-color:#e74c3c;color:#e74c3c}',
    '.ai-fc-actions .again:hover{background:#e74c3c;color:#fff}',
    '.ai-fc-actions .good{background:#fff;border-color:#f39c12;color:#f39c12}',
    '.ai-fc-actions .good:hover{background:#f39c12;color:#fff}',
    '.ai-fc-actions .easy{background:#fff;border-color:#27ae60;color:#27ae60}',
    '.ai-fc-actions .easy:hover{background:#27ae60;color:#fff}',
    '.ai-fc-close{position:absolute;top:16px;right:20px;font-size:24px;cursor:pointer;color:#888}',
    '.ai-fc-close:hover{color:#1a1a1a}',
    '.ai-fc-progress{font-family:"Merriweather Sans",sans-serif;font-size:11px;color:#aaa;margin-top:16px}'
  ].join('\n');
  document.head.appendChild(style);

  // Collect all vocab words from localStorage
  function getVocabWords() {
    var words = [];
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (key && key.startsWith('vocab-')) {
        try {
          var list = JSON.parse(localStorage.getItem(key));
          if (Array.isArray(list)) {
            list.forEach(function (w) {
              if (w.word && w.definition) {
                var reviewKey = 'fc-review:' + w.word.toLowerCase();
                var review = JSON.parse(localStorage.getItem(reviewKey) || '{"next":0,"level":0}');
                var now = Date.now();
                if (review.next <= now) {
                  words.push({ word: w.word, def: w.definition, key: reviewKey, level: review.level || 0 });
                }
              }
            });
          }
        } catch (e) {}
      }
    }
    return words;
  }

  // Add flashcard button
  var btn = document.createElement('button');
  btn.className = 'ai-fc-btn';
  btn.innerHTML = '📝';
  btn.title = 'Review Vocabulary';
  document.body.appendChild(btn);

  btn.addEventListener('click', function () {
    var words = getVocabWords();
    if (words.length === 0) {
      alert('No vocabulary to review yet! Read some passages first.');
      return;
    }
    openFlashcards(words);
  });

  function openFlashcards(words) {
    var overlay = document.createElement('div');
    overlay.className = 'ai-fc-overlay show';
    overlay.innerHTML = '<div class="ai-fc-box" style="position:relative"><span class="ai-fc-close">&times;</span><h3>Vocabulary Review</h3><p class="subtitle">Flip the card to see the meaning</p><div id="ai-fc-content"></div></div>';
    document.body.appendChild(overlay);

    overlay.querySelector('.ai-fc-close').addEventListener('click', function () {
      overlay.remove();
    });
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) overlay.remove();
    });

    var current = 0;
    var showingDef = false;
    var content = overlay.querySelector('#ai-fc-content');

    function renderCard() {
      if (current >= words.length) {
        content.innerHTML = '<div style="padding:40px 0"><p style="font-family:Merriweather,serif;font-size:20px;font-weight:700">🎉 All Done!</p><p style="font-family:Merriweather Sans,sans-serif;font-size:13px;color:#888">Great reviewing!</p></div>';
        return;
      }
      var w = words[current];
      showingDef = false;
      content.innerHTML = '<div class="ai-fc-card" id="ai-fc-card"><span class="word">' + escapeHtml(w.word) + '</span></span></div>' +
        '<div class="ai-fc-actions"><button class="again">😰 Again</button><button class="good">🙂 Good</button><button class="easy">😎 Easy</button></div>' +
        '<p class="ai-fc-progress">' + (current + 1) + ' / ' + words.length + '</p>';

      var card = content.querySelector('#ai-fc-card');
      card.addEventListener('click', function () {
        showingDef = !showingDef;
        if (showingDef) {
          card.innerHTML = '<span class="def">' + escapeHtml(w.def) + '</span>';
        } else {
          card.innerHTML = '<span class="word">' + escapeHtml(w.word) + '</span>';
        }
      });

      content.querySelector('.again').addEventListener('click', function () {
        scheduleReview(w, 1);
        current++;
        renderCard();
      });
      content.querySelector('.good').addEventListener('click', function () {
        scheduleReview(w, 3);
        current++;
        renderCard();
      });
      content.querySelector('.easy').addEventListener('click', function () {
        scheduleReview(w, 7);
        current++;
        renderCard();
      });
    }

    function scheduleReview(word, days) {
      var next = Date.now() + days * 86400000;
      localStorage.setItem(word.key, JSON.stringify({ next: next, level: days }));
    }

    renderCard();
  }
})();
