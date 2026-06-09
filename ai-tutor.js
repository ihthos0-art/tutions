(function () {
  'use strict';

  var API_URL = '/api/chat';

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
    try {
      var res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messages, temperature: 0.7, max_tokens: 1024 })
      });
      var data = await res.json();
      var content = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : null;
      var provider = res.headers.get('X-Routed-Via') || '';
      return { content: content, provider: provider };
    } catch (e) { return { content: null, provider: '' }; }
  }

  // ===== INJECT CSS =====
  var style = document.createElement('style');
  style.textContent = [
    '#ai-chat-toggle{position:fixed;bottom:24px;right:24px;width:56px;height:56px;border-radius:50%;background:#1a1a1a;color:#fff;border:none;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,0.2);z-index:9999;display:flex;align-items:center;justify-content:center;transition:transform 0.2s}',
    '#ai-chat-toggle:hover{transform:scale(1.1)}',
    '#ai-chat-panel{position:fixed;bottom:92px;right:24px;width:340px;max-height:480px;background:#fff;border:1px solid #c8c8c8;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.15);z-index:9999;display:none;flex-direction:column;overflow:hidden;font-family:"Merriweather Sans",sans-serif}',
    '#ai-chat-panel.open{display:flex}',
    '#ai-chat-head{background:#1a1a1a;color:#fff;padding:10px 14px;font-size:13px;font-weight:700;letter-spacing:0.08em;display:flex;align-items:center;justify-content:space-between;gap:8px}',
    '#ai-chat-avatar{font-size:22px;cursor:pointer;transition:transform 0.2s}',
    '#ai-chat-avatar:hover{transform:scale(1.15)}',
    '#ai-chat-streak{display:flex;align-items:center;gap:4px;font-size:11px;font-weight:600;background:rgba(255,255,255,0.12);padding:3px 10px;border-radius:12px}',
    '#ai-chat-streak .flame{font-size:14px}',
    '#ai-chat-actions{display:flex;gap:6px;margin-top:6px;padding:0 8px}',
    '#ai-chat-actions button{font-family:"Merriweather Sans",sans-serif;font-size:10px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;padding:4px 10px;border:1px solid #ddd;border-radius:6px;background:#fff;color:#555;cursor:pointer;transition:all 0.2s}',
    '#ai-chat-actions button:hover{background:#1a1a1a;color:#fff;border-color:#1a1a1a}',
    '.ai-avatar-modal{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10001;display:none;align-items:center;justify-content:center}',
    '.ai-avatar-modal.show{display:flex}',
    '.ai-avatar-box{background:#fff;border-radius:12px;padding:24px;text-align:center;max-width:300px;width:90%}',
    '.ai-avatar-box h3{font-family:"Merriweather Sans",sans-serif;font-size:14px;margin-bottom:16px}',
    '.ai-avatar-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px}',
    '.ai-avatar-option{font-size:36px;cursor:pointer;padding:8px;border-radius:8px;transition:background 0.2s}',
    '.ai-avatar-option:hover{background:#f4f3f0}',
    '.ai-avatar-name input{width:100%;padding:8px 12px;border:1.5px solid #ddd;border-radius:8px;font-size:13px;font-family:inherit}',
    '.ai-tts-btn{position:absolute;top:12px;right:12px;background:#fff;border:1.5px solid #d4d2cc;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;transition:all 0.2s;z-index:10}',
    '.ai-tts-btn:hover{background:#1a1a1a;color:#fff;border-color:#1a1a1a}',
    '.ai-tts-btn.active{background:#c0392b;color:#fff;border-color:#c0392b}',
    '#ai-chat-messages{flex:1;overflow-y:auto;padding:14px;min-height:200px;max-height:320px;display:flex;flex-direction:column;gap:10px}',
    '.ai-msg{max-width:85%;padding:10px 14px;border-radius:12px;font-size:13px;line-height:1.6;word-wrap:break-word}',
    '.ai-msg.bot{background:#f4f3f0;color:#1a1a1a;align-self:flex-start;border-bottom-left-radius:4px}',
    '.ai-msg.user{background:#1a1a1a;color:#fff;align-self:flex-end;border-bottom-right-radius:4px}',
    '.ai-msg.typing{color:#999;font-style:italic}',
    '#ai-chat-input-row{display:flex;border-top:1px solid #e2e0db;padding:8px;gap:4px;align-items:flex-end}',
    '#ai-chat-input{flex:1;border:1.5px solid #ddd;border-radius:8px;padding:8px 12px;font-size:13px;font-family:inherit;outline:none;resize:none;min-height:36px;max-height:80px}',
    '#ai-chat-input:focus{border-color:#1a1a1a}',
    '#ai-chat-mic{background:#f4f3f0;color:#555;border:1.5px solid #ddd;border-radius:8px;width:36px;height:36px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:15px;flex-shrink:0;transition:all 0.2s}',
    '#ai-chat-mic:hover{background:#1a1a1a;color:#fff;border-color:#1a1a1a}',
    '#ai-chat-mic.listening{background:#c0392b;color:#fff;border-color:#c0392b;animation:micPulse 1s infinite}',
    '@keyframes micPulse{0%,100%{opacity:1}50%{opacity:0.5}}',
    '#ai-chat-send{background:#1a1a1a;color:#fff;border:none;border-radius:8px;padding:0 14px;height:36px;cursor:pointer;font-size:14px;font-weight:700;flex-shrink:0}',
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
    '#ai-chat-provider{font-family:"Merriweather Sans",sans-serif;font-size:9px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;color:#aaa;background:rgba(255,255,255,0.12);padding:2px 8px;border-radius:10px;margin-left:auto;margin-right:8px;opacity:0;transition:opacity 0.3s}',
    '#ai-chat-provider.show{opacity:1}',
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
      '<div id="ai-chat-head"><span id="ai-chat-avatar">🤖</span><span>Homework Helper</span><span id="ai-chat-provider"></span><span id="ai-chat-streak"><span class="flame">🔥</span><span id="streak-count">0</span></span></div>' +
      '<div id="ai-chat-messages"></div>' +
      '<div id="ai-chat-actions"><button id="ai-eli8">🤔 Explain Again</button><button id="ai-tts-last">🔊 Read Aloud</button></div>' +
      '<div id="ai-chat-input-row"><textarea id="ai-chat-input" rows="1" placeholder="Ask me anything..."></textarea><button id="ai-chat-mic" title="Speak your question">🎤</button><button id="ai-chat-send">&rarr;</button></div>';
    document.body.appendChild(panel);

    // Avatar picker modal
    var avatarModal = document.createElement('div');
    avatarModal.className = 'ai-avatar-modal';
    avatarModal.innerHTML = '<div class="ai-avatar-box"><h3>Pick Your Avatar</h3><div class="ai-avatar-grid"><span class="ai-avatar-option">🦁</span><span class="ai-avatar-option">🐯</span><span class="ai-avatar-option">🐼</span><span class="ai-avatar-option">🐸</span><span class="ai-avatar-option">🦊</span><span class="ai-avatar-option">🐰</span><span class="ai-avatar-option">🐨</span><span class="ai-avatar-option">🦄</span></div><div class="ai-avatar-name"><input type="text" id="ai-nickname" placeholder="Your nickname..." maxlength="12"></div></div>';
    document.body.appendChild(avatarModal);

    var msgsEl = document.getElementById('ai-chat-messages');
    var inp = document.getElementById('ai-chat-input');
    var sendBtn = document.getElementById('ai-chat-send');
    var micBtn = document.getElementById('ai-chat-mic');
    var history = [];
    var lastReply = '';

    // ===== MIC / SPEECH RECOGNITION =====
    if (micBtn) {
      var SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRec) {
        var recognition = new SpeechRec();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        var isListening = false;
        recognition.onresult = function (event) {
          inp.value = event.results[0][0].transcript;
          isListening = false;
          micBtn.innerHTML = '🎤';
          micBtn.classList.remove('listening');
        };
        recognition.onerror = function () {
          isListening = false;
          micBtn.innerHTML = '🎤';
          micBtn.classList.remove('listening');
        };
        recognition.onend = function () {
          isListening = false;
          micBtn.innerHTML = '🎤';
          micBtn.classList.remove('listening');
        };
        micBtn.addEventListener('click', function () {
          if (isListening) {
            recognition.stop();
          } else {
            try {
              recognition.start();
              isListening = true;
              micBtn.innerHTML = '🔴';
              micBtn.classList.add('listening');
            } catch (e) {}
          }
        });
      } else {
        micBtn.style.display = 'none';
      }
    }

    var sysPrompt = {
      role: 'system',
      content: 'You are a kind and patient homework helper for children in grades 1-8 who speak Bengali and are learning English as a second language (ESL). You work at an NYC tutoring center.\n\nIMPORTANT RULES:\n1. NEVER give the direct answer. Always ask guiding questions first (Socratic method).\n2. Help students UNDERSTAND by asking "What do you think?" or "Can you try explaining it?"\n3. ALWAYS respond in VERY SIMPLE English. Short sentences. Easy words only.\n4. ONLY use Bengali if student EXPLICITLY asks for translation. Otherwise stay in simple English.\n5. Keep language simple and age-appropriate.\n6. Never complete a student\'s sentence or write their answer.\n7. Be warm, encouraging, and patient.\n8. If student asks for answer, redirect: "I can\'t tell you the answer, but I can help you figure it out!"\n9. Use everyday examples.\n10. When explaining again, use an even simpler analogy or example.'
    };

    // ===== STREAK COUNTER =====
    function updateStreak() {
      var today = new Date().toDateString();
      var streakData = { count: 0, lastDate: '' };
      try { streakData = JSON.parse(localStorage.getItem('ai-streak')) || streakData; } catch (e) {}
      if (streakData.lastDate !== today) {
        var yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
        if (streakData.lastDate === yesterday.toDateString()) {
          streakData.count++;
        } else {
          streakData.count = 1;
        }
        streakData.lastDate = today;
        localStorage.setItem('ai-streak', JSON.stringify(streakData));
        if (streakData.count >= 7 && typeof confetti === 'function') {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
      }
      document.getElementById('streak-count').textContent = streakData.count;
    }
    updateStreak();

    // ===== AVATAR / PROFILE =====
    var avatarData = { avatar: '🤖', name: '' };
    try { avatarData = JSON.parse(localStorage.getItem('ai-avatar')) || avatarData; } catch (e) {}
    document.getElementById('ai-chat-avatar').textContent = avatarData.avatar;

    document.getElementById('ai-chat-avatar').addEventListener('click', function () {
      avatarModal.classList.add('show');
    });
    avatarModal.addEventListener('click', function (e) {
      if (e.target === avatarModal) avatarModal.classList.remove('show');
    });
    avatarModal.querySelectorAll('.ai-avatar-option').forEach(function (opt) {
      opt.addEventListener('click', function () {
        avatarData.avatar = this.textContent;
        avatarData.name = document.getElementById('ai-nickname').value.trim();
        localStorage.setItem('ai-avatar', JSON.stringify(avatarData));
        document.getElementById('ai-chat-avatar').textContent = avatarData.avatar;
        avatarModal.classList.remove('show');
      });
    });

    // ===== TTS =====
    function speakText(text) {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      var utter = new SpeechSynthesisUtterance(text);
      utter.rate = 0.85;
      utter.pitch = 1.0;
      window.speechSynthesis.speak(utter);
    }

    // ===== ELI8 BUTTON =====
    document.getElementById('ai-eli8').addEventListener('click', function () {
      if (!lastReply) { addMsg('bot', 'Ask me something first!'); return; }
      addMsg('user', 'Explain that again, even simpler');
      var typing = addMsg('bot typing', 'Thinking...');
      groqChat([sysPrompt].concat(history).concat([
        { role: 'user', content: 'Explain your last answer again using an even simpler analogy. Pretend I am 6 years old.' }
      ])).then(function (result) {
        typing.remove();
        if (result.content) { history.push({ role: 'assistant', content: result.content }); addMsg('bot', result.content); lastReply = result.content; showProvider(result.provider); }
        else { addMsg('bot', 'Sorry, try again!'); }
      });
    });

    // ===== TTS LAST BUTTON =====
    document.getElementById('ai-tts-last').addEventListener('click', function () {
      if (!lastReply) { addMsg('bot', 'Ask me something first!'); return; }
      speakText(lastReply);
    });

    function addMsg(cls, text) {
      var d = document.createElement('div');
      d.className = 'ai-msg ' + cls;
      d.textContent = text;
      msgsEl.appendChild(d);
      msgsEl.scrollTop = msgsEl.scrollHeight;
      return d;
    }

    function showProvider(provider) {
      var el = document.getElementById('ai-chat-provider');
      if (!el || !provider) return;
      var parts = provider.split('/');
      var name = parts[0] || provider;
      var model = parts[1] || '';
      el.textContent = name + (model ? ' · ' + model.split('-')[0] : '');
      el.classList.add('show');
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
      updateStreak();
      var typing = addMsg('bot typing', 'Thinking...');
      var result = await groqChat([sysPrompt].concat(history));
      typing.remove();
      if (result.content) {
        history.push({ role: 'assistant', content: result.content });
        addMsg('bot', result.content);
        lastReply = result.content;
        showProvider(result.provider);
        var chatCount = parseInt(localStorage.getItem('ai-chat-count') || '0');
        chatCount++;
        localStorage.setItem('ai-chat-count', chatCount);
        if (chatCount === 1 && typeof confetti === 'function') {
          confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
        }
      } else {
        addMsg('bot', 'Sorry, I couldn\'t connect right now. Please try again!');
      }
    }

    sendBtn.addEventListener('click', doSend);
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(); }
    });
  })();

  // ===== 2. VOCAB BANKS + TTS =====
  var activeTtsBtn = null;

  function addTtsButtons() {
    passages.forEach(function (box) {
      var btn = document.createElement('button');
      btn.className = 'ai-tts-btn';
      btn.innerHTML = '🔊';
      btn.title = 'Read aloud';
      box.style.position = 'relative';
      box.appendChild(btn);
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (!window.speechSynthesis) return;
        if (activeTtsBtn === btn && window.speechSynthesis.speaking) {
          // Same button clicked while reading — stop
          window.speechSynthesis.cancel();
          btn.innerHTML = '🔊';
          btn.title = 'Read aloud';
          btn.classList.remove('active');
          activeTtsBtn = null;
        } else {
          // Stop any currently playing passage
          window.speechSynthesis.cancel();
          if (activeTtsBtn) {
            activeTtsBtn.innerHTML = '🔊';
            activeTtsBtn.title = 'Read aloud';
            activeTtsBtn.classList.remove('active');
          }
          var text = box.textContent.replace(/[🔊⏹]/g, '').trim();
          var utter = new SpeechSynthesisUtterance(text);
          utter.rate = 0.85;
          utter.onend = function () {
            btn.innerHTML = '🔊';
            btn.title = 'Read aloud';
            btn.classList.remove('active');
            if (activeTtsBtn === btn) activeTtsBtn = null;
          };
          utter.onerror = function () {
            btn.innerHTML = '🔊';
            btn.title = 'Read aloud';
            btn.classList.remove('active');
            if (activeTtsBtn === btn) activeTtsBtn = null;
          };
          window.speechSynthesis.speak(utter);
          btn.innerHTML = '⏹️';
          btn.title = 'Stop reading';
          btn.classList.add('active');
          activeTtsBtn = btn;
        }
      });
    });
  }
  addTtsButtons();

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
    var result = await groqChat([
      { role: 'system', content: 'You identify difficult vocabulary words for ESL students. Return ONLY a raw JSON array. No markdown, no code blocks, no explanation, no extra text. Example: [{"word":"example","definition":"simple child-friendly definition"}]' },
      { role: 'user', content: prompt }
    ]);
    if (result.content) {
      try {
        var clean = result.content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
        var match = clean.match(/\[.*\]/s);
        var words = JSON.parse(match ? match[0] : clean);
        if (!Array.isArray(words) || words.length === 0) throw new Error('empty');
        localStorage.setItem(cacheKey, JSON.stringify(words));
        renderVocab(container, words);
      } catch (e) {
        container.querySelector('.ai-vocab-loading').textContent = 'Could not load vocabulary.';
      }
    } else {
      container.querySelector('.ai-vocab-loading').textContent = 'Vocabulary unavailable right now.';
    }
  }

  function renderVocab(container, words) {
    var html = '<p class="ai-vocab-title">Vocabulary Bank</p><div class="ai-vocab-list">';
    words.forEach(function (w) {
      html += '<p class="ai-vocab-word"><strong>' + escapeHtml(w.word) + '</strong> &mdash; ' + escapeHtml(w.definition) + '</p>';
    });
    html += '</div>';
    container.innerHTML = html;
    var count = parseInt(localStorage.getItem('ai-vocab-count') || '0');
    count += words.length;
    localStorage.setItem('ai-vocab-count', count);
    if (count >= 10 && count - words.length < 10 && typeof confetti === 'function') {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
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

      if (pct < 1 && e.detail.wrongAnswers) {
        e.detail.wrongAnswers.forEach(function (wa) {
          if (wa.element && wa.question && wa.passage) {
            explainWrongAnswer(wa.element, wa.question, wa.passage, wa.studentAnswer);
          }
        });
      }

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

      var badges = JSON.parse(localStorage.getItem('ai-badges') || '{}');
      if (badges.worksheetsCompleted === 5 && typeof confetti === 'function') {
        confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 } });
        msg = '📚 5 Worksheets Completed! You are a Hard Worker!';
      }
      if (badges.totalStars >= 30 && typeof confetti === 'function') {
        confetti({ particleCount: 250, spread: 120, origin: { y: 0.5 } });
        msg = '🌟 30 Stars! You are a Star Collector!';
      }

      var starsEl = document.getElementById('ai-celeb-stars');
      var msgEl = document.getElementById('ai-celeb-msg');
      starsEl.textContent = stars;
      msgEl.textContent = msg;
      overlay.classList.add('show');
      setTimeout(function () { overlay.classList.remove('show'); }, 3000);
    });
  })();

  async function explainWrongAnswer(el, question, passage, studentAnswer) {
    var result = await groqChat([
      { role: 'system', content: 'You explain why a student got a wrong answer in ONE very simple sentence. Use easy words. Be encouraging.' },
      { role: 'user', content: 'Question: ' + question + '\nPassage: ' + passage.substring(0, 300) + '\nStudent answer: ' + studentAnswer + '\nExplain why this is wrong in one simple encouraging sentence.' }
    ]);
    if (result.content) {
      var tip = document.createElement('div');
      tip.className = 'ai-wrong-tip';
      tip.style.cssText = 'font-size:11px;color:#c0392b;margin-top:4px;font-style:italic';
      tip.textContent = '💡 ' + result.content;
      el.parentNode.appendChild(tip);
    }
  }

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
    if (!badges) return;
    var bar = document.createElement('div');
    bar.className = 'ai-badges-bar';
    var html = '';
    if (badges.totalStars) html += '<span class="ai-badge"><span class="badge-icon">⭐</span> ' + badges.totalStars + ' Stars</span>';
    if (badges.perfectScores >= 1) html += '<span class="ai-badge"><span class="badge-icon">🏆</span> ' + badges.perfectScores + ' Perfect</span>';
    if (badges.worksheetsCompleted >= 5) html += '<span class="ai-badge"><span class="badge-icon">📚</span> Hard Worker</span>';
    if (badges.worksheetsCompleted >= 15) html += '<span class="ai-badge"><span class="badge-icon">📖</span> Bookworm</span>';
    if (badges.totalStars >= 30) html += '<span class="ai-badge"><span class="badge-icon">🌟</span> Star Collector</span>';
    if (badges.totalStars >= 60) html += '<span class="ai-badge"><span class="badge-icon">💎</span> Diamond</span>';
    var vocabCount = parseInt(localStorage.getItem('ai-vocab-count') || '0');
    if (vocabCount >= 10) html += '<span class="ai-badge"><span class="badge-icon">📝</span> ' + vocabCount + ' Words</span>';
    bar.innerHTML = html;
    if (!html) return;
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
