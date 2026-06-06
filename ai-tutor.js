(function () {
  'use strict';

  var GROQ_API_KEY = 'YOUR_GROQ_API_KEY_HERE';
  var GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
  var GROQ_MODEL = 'llama3-8b-8192';

  var pagePath = location.pathname.split('/').pop().replace('.html', '') || 'index';
  var isMenu = !!document.querySelector('.menu-card');
  var passages = document.querySelectorAll('.passage-box');
  var mathGrid = document.querySelector('.problems-grid');

  function simpleHash(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) {
      h = ((h << 5) - h) + str.charCodeAt(i);
      h |= 0;
    }
    return 'vocab-' + Math.abs(h);
  }

  function escapeHtml(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  async function groqChat(messages) {
    if (GROQ_API_KEY === 'YOUR_GROQ_API_KEY_HERE') return null;
    try {
      var res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + GROQ_API_KEY },
        body: JSON.stringify({ model: GROQ_MODEL, messages: messages, temperature: 0.7, max_tokens: 1024 })
      });
      var data = await res.json();
      return data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : null;
    } catch (e) { return null; }
  }

  // ===== INJECT CSS =====
  var style = document.createElement('style');
  style.textContent = [
    '#ai-chat-toggle{position:fixed;bottom:24px;right:24px;width:56px;height:56px;border-radius:50%;background:#1a1a1a;color:#fff;border:none;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,0.2);z-index:9999;display:flex;align-items:center;justify-content:center;transition:transform 0.2s}',
    '#ai-chat-toggle:hover{transform:scale(1.1)}',
    '#ai-chat-panel{position:fixed;bottom:92px;right:24px;width:340px;max-height:480px;background:#fff;border:1px solid #c8c8c8;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.15);z-index:9999;display:none;flex-direction:column;overflow:hidden;font-family:"Merriweather Sans",sans-serif}',
    '#ai-chat-panel.open{display:flex}',
    '#ai-chat-head{background:#1a1a1a;color:#fff;padding:14px 18px;font-size:13px;font-weight:700;letter-spacing:0.08em}',
    '#ai-chat-messages{flex:1;overflow-y:auto;padding:14px;min-height:200px;max-height:320px;display:flex;flex-direction:column;gap:10px}',
    '.ai-msg{max-width:85%;padding:10px 14px;border-radius:12px;font-size:13px;line-height:1.6;word-wrap:break-word}',
    '.ai-msg.bot{background:#f4f3f0;color:#1a1a1a;align-self:flex-start;border-bottom-left-radius:4px}',
    '.ai-msg.user{background:#1a1a1a;color:#fff;align-self:flex-end;border-bottom-right-radius:4px}',
    '.ai-msg.typing{color:#999;font-style:italic}',
    '#ai-chat-input-row{display:flex;border-top:1px solid #e2e0db;padding:8px}',
    '#ai-chat-input{flex:1;border:1.5px solid #ddd;border-radius:8px;padding:8px 12px;font-size:13px;font-family:inherit;outline:none;resize:none;min-height:36px;max-height:80px}',
    '#ai-chat-input:focus{border-color:#1a1a1a}',
    '#ai-chat-send{background:#1a1a1a;color:#fff;border:none;border-radius:8px;padding:0 14px;margin-left:6px;cursor:pointer;font-size:14px;font-weight:700}',
    '#ai-chat-send:hover{background:#444}',
    '.ai-vocab-bank{background:#fefefe;border:1.5px solid #d4d2cc;border-radius:6px;padding:16px 20px;margin-top:16px}',
    '.ai-vocab-title{font-family:"Merriweather Sans",sans-serif;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#888;margin-bottom:10px}',
    '.ai-vocab-list{display:flex;flex-direction:column;gap:6px}',
    '.ai-vocab-word{font-size:13px;line-height:1.5;color:#222}',
    '.ai-vocab-word strong{color:#1a1a1a;margin-right:6px}',
    '.ai-vocab-loading{font-size:12px;color:#aaa;font-style:italic}',
    '.ai-progress-wrap{margin-bottom:20px}',
    '.ai-progress-bar{height:8px;background:#e8e6e2;border-radius:4px;overflow:hidden}',
    '.ai-progress-fill{height:100%;background:#27ae60;border-radius:4px;transition:width 0.4s ease;width:0%}',
    '.ai-progress-text{font-family:"Merriweather Sans",sans-serif;font-size:11px;color:#999;margin-top:4px;text-align:right}',
    '#ai-celebration{position:fixed;top:0;left:0;width:100%;height:100%;z-index:10000;display:none;align-items:center;justify-content:center;pointer-events:none}',
    '#ai-celebration.show{display:flex}',
    '#ai-celeb-content{text-align:center;animation:celebPop 0.5s ease}',
    '#ai-celeb-stars{font-size:48px;margin-bottom:12px}',
    '#ai-celeb-msg{font-family:"Merriweather",serif;font-size:22px;font-weight:700;color:#1a1a1a;text-shadow:0 2px 8px rgba(255,255,255,0.8)}',
    '@keyframes celebPop{0%{transform:scale(0.3);opacity:0}50%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}',
    '@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}',
    '@keyframes pop{0%{transform:scale(1)}50%{transform:scale(1.15)}100%{transform:scale(1)}}',
    '.ai-shake{animation:shake 0.4s ease}',
    '.ai-pop{animation:pop 0.3s ease}',
    '.ai-timer-wrap{display:flex;align-items:center;gap:12px;margin-bottom:16px}',
    '.ai-timer-toggle{font-family:"Merriweather Sans",sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;padding:6px 14px;border:1.5px solid #c8c8c8;border-radius:3px;background:transparent;color:#888;cursor:pointer;transition:all 0.2s}',
    '.ai-timer-toggle:hover{border-color:#1a1a1a;color:#1a1a1a}',
    '.ai-timer-toggle.active{background:#1a1a1a;color:#fff;border-color:#1a1a1a}',
    '.ai-timer-display{font-family:"Courier New",monospace;font-size:18px;font-weight:700;color:#555;display:none}',
    '.ai-timer-display.on{display:block}',
    '.wotd-card{background:#f9f8f5;border:1.5px solid #e2e0db;border-radius:6px;padding:18px 22px;margin-top:28px;text-align:left}',
    '.wotd-label{font-family:"Merriweather Sans",sans-serif;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#aaa;margin-bottom:8px}',
    '.wotd-word{font-family:"Merriweather",serif;font-size:20px;font-weight:700;color:#1a1a1a;margin-bottom:4px}',
    '.wotd-def{font-family:"Merriweather",serif;font-size:14px;color:#555;font-style:italic;line-height:1.5}',
    '.ai-badges-bar{max-width:700px;margin:20px auto 0;display:flex;align-items:center;gap:12px;flex-wrap:wrap}',
    '.ai-badge{display:flex;align-items:center;gap:4px;font-family:"Merriweather Sans",sans-serif;font-size:12px;font-weight:700;color:#888;background:#f4f3f0;border:1px solid #dddbd4;border-radius:20px;padding:5px 14px}',
    '.ai-badge .badge-icon{font-size:16px}',
    '@media(max-width:500px){#ai-chat-panel{left:12px;right:12px;width:auto;bottom:84px}}'
  ].join('\n');
  document.head.appendChild(style);

  // ===== LOAD CONFETTI =====
  var confettiScript = document.createElement('script');
  confettiScript.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js';
  document.head.appendChild(confettiScript);

  // ===== 1. CHAT BUBBLE =====
  (function () {
    var toggle = document.createElement('button');
    toggle.id = 'ai-chat-toggle';
    toggle.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
    toggle.title = 'Ask for help';
    document.body.appendChild(toggle);

    var panel = document.createElement('div');
    panel.id = 'ai-chat-panel';
    panel.innerHTML =
      '<div id="ai-chat-head">Homework Helper</div>' +
      '<div id="ai-chat-messages"></div>' +
      '<div id="ai-chat-input-row"><textarea id="ai-chat-input" rows="1" placeholder="Ask me anything..."></textarea><button id="ai-chat-send">&rarr;</button></div>';
    document.body.appendChild(panel);

    var msgsEl = document.getElementById('ai-chat-messages');
    var inp = document.getElementById('ai-chat-input');
    var sendBtn = document.getElementById('ai-chat-send');
    var history = [];

    var sysPrompt = {
      role: 'system',
      content: 'You are a kind and patient homework helper for children in grades 1-8 who speak Bengali and are learning English as a second language (ESL). You work with students at an NYC tutoring center.\n\nIMPORTANT RULES:\n1. NEVER give the direct answer to any homework question or blank to fill in.\n2. Help students UNDERSTAND by asking guiding questions and explaining concepts.\n3. If a student writes in Bengali, respond in Bengali.\n4. If asked to translate something to Bengali, do it.\n5. Keep language simple and age-appropriate.\n6. Explain concepts simply: for example, "The central idea is like the main point of the whole story..."\n7. Never complete a student\'s sentence or write their answer for them.\n8. Be warm, encouraging, and patient.\n9. If a student asks what the answer is, gently redirect: "I can\'t tell you the answer, but I can help you figure it out!"\n10. Use examples from everyday life to explain difficult concepts.'
    };

    function addMsg(cls, text) {
      var d = document.createElement('div');
      d.className = 'ai-msg ' + cls;
      d.textContent = text;
      msgsEl.appendChild(d);
      msgsEl.scrollTop = msgsEl.scrollHeight;
      return d;
    }

    addMsg('bot', 'Hi! I\'m your homework helper. I won\'t give you answers, but I\'ll help you understand! Ask me anything.');

    toggle.addEventListener('click', function () {
      panel.classList.toggle('open');
      if (panel.classList.contains('open')) inp.focus();
    });

    async function doSend() {
      var text = inp.value.trim();
      if (!text) return;
      inp.value = '';
      addMsg('user', text);
      history.push({ role: 'user', content: text });
      var typing = addMsg('bot typing', 'Thinking...');
      var reply = await groqChat([sysPrompt].concat(history));
      typing.remove();
      if (reply) {
        history.push({ role: 'assistant', content: reply });
        addMsg('bot', reply);
      } else {
        addMsg('bot', GROQ_API_KEY === 'YOUR_GROQ_API_KEY_HERE' ? 'Please set the API key in ai-tutor.js to enable the helper.' : 'Sorry, I couldn\'t connect. Please try again!');
      }
    }

    sendBtn.addEventListener('click', doSend);
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(); }
    });
  })();

  // ===== 2. VOCAB BANKS =====
  function initVocabBanks() {
    if (!passages.length) return;
    passages.forEach(function (box) {
      var text = box.textContent || box.innerText;
      if (text.trim().length < 50) return;
      var container = document.createElement('div');
      container.className = 'ai-vocab-bank';
      container.innerHTML = '<p class="ai-vocab-title">Vocabulary Bank</p><p class="ai-vocab-loading">Loading vocabulary...</p>';
      box.parentNode.insertBefore(container, box.nextSibling);
      var cacheKey = simpleHash(text.substring(0, 200));
      var cached = localStorage.getItem(cacheKey);
      if (cached) {
        try { renderVocab(container, JSON.parse(cached)); } catch (e) {}
      } else {
        fetchVocab(text, container, cacheKey);
      }
    });
  }

  async function fetchVocab(passageText, container, cacheKey) {
    var prompt = 'Given this reading passage, identify 8-10 words that would be challenging for Bengali-speaking ESL students in grades 1-8. Return ONLY a JSON array like this: [{"word":"example","definition":"simple child-friendly definition"}]. No other text.\n\nPassage:\n' + passageText.substring(0, 1500);
    var reply = await groqChat([
      { role: 'system', content: 'You identify difficult vocabulary words for ESL students. Always respond with ONLY a JSON array, no markdown, no explanation.' },
      { role: 'user', content: prompt }
    ]);
    if (reply) {
      try {
        var clean = reply.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
        var words = JSON.parse(clean);
        localStorage.setItem(cacheKey, JSON.stringify(words));
        renderVocab(container, words);
      } catch (e) {
        container.querySelector('.ai-vocab-loading').textContent = 'Vocabulary will appear when API key is set.';
      }
    } else {
      container.querySelector('.ai-vocab-loading').textContent = GROQ_API_KEY === 'YOUR_GROQ_API_KEY_HERE' ? 'Set API key in ai-tutor.js to load vocabulary.' : 'Vocabulary will appear here.';
    }
  }

  function renderVocab(container, words) {
    var html = '<p class="ai-vocab-title">Vocabulary Bank</p><div class="ai-vocab-list">';
    words.forEach(function (w) {
      html += '<p class="ai-vocab-word"><strong>' + escapeHtml(w.word) + '</strong> &mdash; ' + escapeHtml(w.definition) + '</p>';
    });
    html += '</div>';
    container.innerHTML = html;
  }

  initVocabBanks();

  // ===== 3. PROGRESS BAR =====
  function initProgressBar() {
    if (!mathGrid) return;
    var wrap = document.createElement('div');
    wrap.className = 'ai-progress-wrap';
    wrap.innerHTML = '<div class="ai-progress-bar"><div class="ai-progress-fill"></div></div><p class="ai-progress-text">0 / 0</p>';
    mathGrid.parentNode.insertBefore(wrap, mathGrid);
    var fill = wrap.querySelector('.ai-progress-fill');
    var label = wrap.querySelector('.ai-progress-text');
    var inputs = mathGrid.querySelectorAll('input[data-answer]');
    var total = inputs.length;
    function update() {
      var answered = 0;
      inputs.forEach(function (el) { if (el.value.trim()) answered++; });
      var pct = total ? Math.round((answered / total) * 100) : 0;
      fill.style.width = pct + '%';
      label.textContent = answered + ' / ' + total + ' answered';
    }
    inputs.forEach(function (el) { el.addEventListener('input', update); });
    update();
  }
  initProgressBar();

  // ===== 4. CELEBRATIONS =====
  (function () {
    var overlay = document.createElement('div');
    overlay.id = 'ai-celebration';
    overlay.innerHTML = '<div id="ai-celeb-content"><div id="ai-celeb-stars"></div><div id="ai-celeb-msg"></div></div>';
    document.body.appendChild(overlay);

    var msgs = {
      perfect: ['Amazing! Perfect score!', 'You got them all right!', 'Incredible work!', 'You are a superstar!'],
      great: ['Great job!', 'Almost perfect!', 'So close to perfect!', 'Excellent work!'],
      good: ['Good effort!', 'Keep practicing!', 'You are getting better!', 'Nice try!'],
      tryagain: ['Don\'t give up!', 'Try again, you\'ll get it!', 'Keep going!', 'Practice makes perfect!']
    };

    document.addEventListener('checkResult', function (e) {
      var correct = e.detail.correct;
      var total = e.detail.total;
      var pct = total ? correct / total : 0;

      saveScore(correct, total);
      updateBadges(pct);

      setTimeout(function () {
        document.querySelectorAll('.wrong').forEach(function (el) {
          el.classList.remove('ai-shake'); void el.offsetWidth; el.classList.add('ai-shake');
        });
        document.querySelectorAll('.correct').forEach(function (el) {
          el.classList.remove('ai-pop'); void el.offsetWidth; el.classList.add('ai-pop');
        });
      }, 50);

      var stars, msg, level;
      if (pct === 1) { stars = '⭐⭐⭐'; level = 'perfect'; }
      else if (pct >= 0.8) { stars = '⭐⭐'; level = 'great'; }
      else if (pct >= 0.5) { stars = '⭐'; level = 'good'; }
      else { stars = ''; level = 'tryagain'; }

      var list = msgs[level];
      msg = list[Math.floor(Math.random() * list.length)];

      if (pct === 1 && typeof confetti === 'function') {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        setTimeout(function () { confetti({ particleCount: 80, spread: 100, origin: { y: 0.7 } }); }, 300);
      }

      var starsEl = document.getElementById('ai-celeb-stars');
      var msgEl = document.getElementById('ai-celeb-msg');
      starsEl.textContent = stars;
      msgEl.textContent = msg;
      overlay.classList.add('show');
      setTimeout(function () { overlay.classList.remove('show'); }, 3000);
    });
  })();

  // ===== 5. SCORE HISTORY =====
  function saveScore(correct, total) {
    var key = 'ai-scores:' + pagePath;
    var history = [];
    try { history = JSON.parse(localStorage.getItem(key)) || []; } catch (e) {}
    history.push({ date: new Date().toISOString(), correct: correct, total: total });
    if (history.length > 50) history = history.slice(-50);
    localStorage.setItem(key, JSON.stringify(history));
  }

  // ===== 6. BADGES =====
  function updateBadges(pct) {
    var key = 'ai-badges';
    var badges = {};
    try { badges = JSON.parse(localStorage.getItem(key)) || {}; } catch (e) {}
    if (!badges.totalStars) badges.totalStars = 0;
    if (!badges.perfectScores) badges.perfectScores = 0;
    if (!badges.worksheetsCompleted) badges.worksheetsCompleted = 0;
    if (pct === 1) { badges.totalStars += 3; badges.perfectScores++; }
    else if (pct >= 0.8) badges.totalStars += 2;
    else if (pct >= 0.5) badges.totalStars += 1;
    badges.worksheetsCompleted++;
    localStorage.setItem(key, JSON.stringify(badges));
    renderBadges(badges);
  }

  function renderBadges(badges) {
    var existing = document.querySelector('.ai-badges-bar');
    if (existing) existing.remove();
    if (!badges || !badges.totalStars) return;
    var bar = document.createElement('div');
    bar.className = 'ai-badges-bar';
    bar.innerHTML = '<span class="ai-badge"><span class="badge-icon">⭐</span> ' + badges.totalStars + ' Stars</span>';
    if (badges.perfectScores >= 1) bar.innerHTML += '<span class="ai-badge"><span class="badge-icon">🏆</span> ' + badges.perfectScores + ' Perfect</span>';
    if (badges.worksheetsCompleted >= 5) bar.innerHTML += '<span class="ai-badge"><span class="badge-icon">📚</span> Hard Worker</span>';
    if (badges.totalStars >= 30) bar.innerHTML += '<span class="ai-badge"><span class="badge-icon">🌟</span> Star Collector</span>';
    var target = document.querySelector('.save-notice') || document.querySelector('.print-bar');
    if (target) target.parentNode.insertBefore(bar, target.nextSibling);
    else document.body.appendChild(bar);
  }

  (function () {
    if (isMenu) return;
    try {
      var b = JSON.parse(localStorage.getItem('ai-badges'));
      if (b && b.totalStars) renderBadges(b);
    } catch (e) {}
  })();

  // ===== 7. WORD OF THE DAY =====
  (function () {
    if (!isMenu) return;
    var words = [
      { word: 'Accomplish', def: 'To finish something successfully' },
      { word: 'Beneath', def: 'Under or below something' },
      { word: 'Courage', def: 'Being brave when something is scary' },
      { word: 'Discover', def: 'To find something for the first time' },
      { word: 'Enormous', def: 'Very, very big' },
      { word: 'Familiar', def: 'Something you know or have seen before' },
      { word: 'Generous', def: 'Willing to share and give to others' },
      { word: 'Hesitate', def: 'To pause before doing something' },
      { word: 'Imagine', def: 'To make a picture in your mind' },
      { word: 'Journey', def: 'A long trip from one place to another' },
      { word: 'Knowledge', def: 'Things you learn and know' },
      { word: 'Magnificent', def: 'Very beautiful or impressive' },
      { word: 'Nervous', def: 'Feeling worried or scared about something' },
      { word: 'Observe', def: 'To watch something carefully' },
      { word: 'Patient', def: 'Able to wait without getting upset' },
      { word: 'Responsible', def: 'Doing what you are supposed to do' },
      { word: 'Similar', def: 'Almost the same but not exactly' },
      { word: 'Temperature', def: 'How hot or cold something is' },
      { word: 'Understand', def: 'To know what something means' },
      { word: 'Valuable', def: 'Worth a lot or very important' },
      { word: 'Whisper', def: 'To talk very quietly' },
      { word: 'Adventure', def: 'An exciting experience or trip' },
      { word: 'Brilliant', def: 'Very smart or very bright' },
      { word: 'Comfortable', def: 'Feeling relaxed and at ease' },
      { word: 'Determined', def: 'Not giving up even when it is hard' },
      { word: 'Encourage', def: 'To help someone feel brave and keep going' },
      { word: 'Frustrated', def: 'Feeling upset when something is hard' },
      { word: 'Grateful', def: 'Feeling thankful for something' },
      { word: 'Independent', def: 'Able to do things on your own' },
      { word: 'Ordinary', def: 'Normal, nothing special or unusual' }
    ];
    var now = new Date();
    var start = new Date(now.getFullYear(), 0, 0);
    var dayOfYear = Math.floor((now - start) / 86400000);
    var w = words[dayOfYear % words.length];
    var card = document.createElement('div');
    card.className = 'wotd-card';
    card.innerHTML = '<p class="wotd-label">Word of the Day</p><p class="wotd-word">' + w.word + '</p><p class="wotd-def">' + w.def + '</p>';
    var mc = document.querySelector('.menu-card');
    if (mc) mc.appendChild(card);
  })();

  // ===== 8. TIMED MODE =====
  (function () {
    if (!mathGrid) return;
    var wrap = document.createElement('div');
    wrap.className = 'ai-timer-wrap';
    wrap.innerHTML = '<button class="ai-timer-toggle">Timed Mode</button><span class="ai-timer-display">00:00</span>';
    mathGrid.parentNode.insertBefore(wrap, mathGrid);
    var btn = wrap.querySelector('.ai-timer-toggle');
    var display = wrap.querySelector('.ai-timer-display');
    var running = false, seconds = 0, interval = null;
    btn.addEventListener('click', function () {
      if (!running) {
        running = true; seconds = 0;
        btn.classList.add('active'); btn.textContent = 'Stop Timer';
        display.classList.add('on'); display.textContent = '00:00';
        interval = setInterval(function () {
          seconds++;
          var m = Math.floor(seconds / 60), s = seconds % 60;
          display.textContent = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
        }, 1000);
      } else {
        running = false; clearInterval(interval);
        btn.classList.remove('active'); btn.textContent = 'Timed Mode';
      }
    });
    document.addEventListener('checkResult', function () {
      if (running) { running = false; clearInterval(interval); btn.classList.remove('active'); btn.textContent = 'Timed Mode'; }
    });
  })();

})();
