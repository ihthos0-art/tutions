(function () {
  'use strict';

  var API_URL = '/api/chat';

  // ===== UTILS =====
  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function escapeHtml(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  async function groqChat(messages, maxTokens) {
    try {
      var res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messages, temperature: 0.8, max_tokens: maxTokens || 1024 })
      });
      var data = await res.json();
      var content = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : null;
      var provider = res.headers.get('X-Routed-Via') || '';
      return { content: content, provider: provider };
    } catch (e) { return { content: null, provider: '' }; }
  }

  // ===== MATH GENERATORS =====
  var MATH_TEMPLATES = {
    'addition': function (cfg) {
      var a = rand(cfg.min || 1, cfg.max || 20);
      var b = rand(cfg.min || 1, cfg.max || 20);
      return { text: a + ' + ' + b + ' =', answer: String(a + b), type: 'drill' };
    },
    'subtraction': function (cfg) {
      var a = rand(cfg.min || 1, cfg.max || 20);
      var b = rand(cfg.min || 1, a);
      return { text: a + ' − ' + b + ' =', answer: String(a - b), type: 'drill' };
    },
    'addition-subtraction': function (cfg) {
      return Math.random() < 0.5 ? MATH_TEMPLATES['addition'](cfg) : MATH_TEMPLATES['subtraction'](cfg);
    },
    'multiplication': function (cfg) {
      var a = rand(cfg.min || 1, cfg.max || 12);
      var b = rand(cfg.min || 1, cfg.max || 12);
      return { text: a + ' × ' + b + ' =', answer: String(a * b), type: 'drill' };
    },
    'division': function (cfg) {
      var b = rand(cfg.min || 1, cfg.max || 12);
      var ans = rand(cfg.min || 1, cfg.max || 12);
      var a = b * ans;
      return { text: a + ' ÷ ' + b + ' =', answer: String(ans), type: 'drill' };
    },
    'multiplication-division': function (cfg) {
      return Math.random() < 0.5 ? MATH_TEMPLATES['multiplication'](cfg) : MATH_TEMPLATES['division'](cfg);
    }
  };

  var WORD_TEMPLATES = {
    'addition-subtraction': [
      'Maria has {a} stickers. Her friend gives her {b} more. How many stickers does Maria have now?',
      'A bus has {a} seats. {b} seats are filled. How many seats are empty?',
      'There are {a} apples on the table. You eat {b}. How many are left?',
      'A baker makes {a} cookies. He sells {b}. How many cookies are left?',
      'Sam has {a} marbles. He finds {b} more under his bed. How many marbles does Sam have now?',
      'A garden has {a} flowers. {b} flowers wilt. How many flowers are still blooming?'
    ],
    'multiplication-division': [
      'A box holds {b} crayons. How many crayons are in {a} boxes?',
      'There are {a} students divided into {b} equal groups. How many students are in each group?',
      'A bakery makes {a} trays of cookies. Each tray has {b} cookies. How many cookies total?',
      'A teacher has {a} pencils. She gives each student {b} pencils. How many students get pencils?',
      'A bookshelf has {a} shelves. Each shelf holds {b} books. How many books can the bookshelf hold?',
      'There are {a} wheels total. Each bicycle has {b} wheels. How many bicycles are there?'
    ]
  };

  function generateWordProblem(topic, cfg) {
    var templates = WORD_TEMPLATES[topic] || WORD_TEMPLATES['addition-subtraction'];
    var tmpl = templates[rand(0, templates.length - 1)];
    var a, b, answer;
    if (topic === 'multiplication-division' || topic === 'multiplication') {
      b = rand(cfg.min || 2, cfg.max || 12);
      a = rand(2, 10);
      answer = String(a * b);
    } else if (topic === 'division') {
      b = rand(cfg.min || 2, cfg.max || 12);
      a = rand(2, 10);
      var total = a * b;
      answer = String(a);
      // Swap so template reads naturally
      var tmp = a; a = total;
    } else {
      a = rand(cfg.min || 10, cfg.max || 99);
      b = rand(cfg.min || 1, a);
      answer = String(a + b);
      // For subtraction-style templates, recalculate
      if (tmpl.includes('left') || tmpl.includes('empty') || tmpl.includes('wilt') || tmpl.includes('eat') || tmpl.includes('sells')) {
        answer = String(a - b);
      }
    }
    var text = tmpl.replace('{a}', a).replace('{b}', b);
    return { text: text, answer: answer, type: 'word' };
  }

  function generateMathProblems(cfg) {
    var topic = cfg.topic || 'addition-subtraction';
    var gen = MATH_TEMPLATES[topic] || MATH_TEMPLATES['addition-subtraction'];
    var problems = [];
    var count = cfg.count || 10;
    var wordCount = cfg.wordProblems || 0;

    for (var i = 0; i < count; i++) {
      problems.push(gen(cfg));
    }
    for (var i = 0; i < wordCount; i++) {
      problems.push(generateWordProblem(topic, cfg));
    }
    return problems;
  }

  // ===== ELA GENERATOR =====
  async function generateELA(cfg) {
    var name = cfg.name || 'the student';
    var grade = cfg.grade || 3;
    var qCount = cfg.questions || 3;

    var systemPrompt = {
      role: 'system',
      content: 'You are an educational content writer for ESL students in grades 1-8 who speak Bengali. Write simple, engaging stories using easy English words. Return ONLY raw JSON. No markdown, no code blocks, no extra text.'
    };

    var userPrompt = {
      role: 'user',
      content: 'Write a short reading passage (2-3 paragraphs, age-appropriate for grade ' + grade + ') for a student named ' + name + '.\n\n' +
        'Then generate ' + qCount + ' comprehension questions in this exact order:\n' +
        '1. Central Idea — ask what the most important idea is (answer in 1 sentence)\n' +
        '2. Supporting Detail — ask for one detail from the passage (1-2 sentences)\n' +
        '3. Make a Connection — ask a personal question related to the story (1 sentence)\n\n' +
        'Return ONLY a JSON object in this exact format:\n' +
        '{"title":"Story Title","passage":"<p>Paragraph 1...</p><p>Paragraph 2...</p>","questions":[' +
        '{"label":"Central Idea","question":"What is the most important idea...?","placeholder":"The central idea...","rows":2},' +
        '{"label":"Supporting Detail","question":"Find one detail...","placeholder":"A detail from...","rows":3},' +
        '{"label":"Make a Connection","question":"Have you ever...?","placeholder":"One time...","rows":3}' +
        ']}'
    };

    var result = await groqChat([systemPrompt, userPrompt], 1500);
    if (!result.content) return null;

    try {
      var clean = result.content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      var match = clean.match(/\{.*\}/s);
      var data = JSON.parse(match ? match[0] : clean);
      if (!data.title || !data.passage || !Array.isArray(data.questions)) throw new Error('invalid structure');
      if (result.provider) console.log('[ai-generator] ELA generated by', result.provider);
      return data;
    } catch (e) {
      console.error('[ai-generator] Failed to parse ELA response:', e, result.content);
      return null;
    }
  }

  // ===== DOM REPLACEMENT =====
  function buildMathHTML(problems, pattern) {
    var html = '';
    if (pattern === 'checked') {
      // Pattern B: .problems-grid with .problem divs, data-answer, ans-input class
      for (var i = 0; i < problems.length; i++) {
        var p = problems[i];
        html += '<div class="problem"><span class="problem-num">' + (i + 1) + '.</span><span class="problem-eq">' + escapeHtml(p.text) + '</span><input class="ans-input" type="text" inputmode="numeric" pattern="[0-9]*" data-save="q' + (i + 1) + '" data-answer="' + escapeHtml(p.answer) + '" autocomplete="off" /></div>';
      }
    } else {
      // Pattern A: .math-grid with .math-prob divs
      var drill = problems.filter(function (p) { return p.type === 'drill'; });
      var words = problems.filter(function (p) { return p.type === 'word'; });
      html += '<div class="math-grid">';
      for (var i = 0; i < drill.length; i++) {
        html += '<div class="math-prob">' + (i + 1) + '.  ' + escapeHtml(drill[i].text) + ' <input type="text" data-save="m1-' + (i + 1) + '" placeholder="?" /></div>';
      }
      html += '</div>';
      for (var i = 0; i < words.length; i++) {
        html += '<div class="math-word">' + (drill.length + i + 1) + '. ' + escapeHtml(words[i].text) + ' <input type="text" data-save="m1-' + (drill.length + i + 1) + '" placeholder="?" /></div>';
      }
    }
    return html;
  }

  function buildELAHTML(story) {
    var html = '';
    html += '<p class="section-label">Read the passage</p>';
    html += '<h2 class="passage-title">' + escapeHtml(story.title) + '</h2>';
    html += '<div class="passage-box">' + story.passage + '</div>';
    for (var i = 0; i < story.questions.length; i++) {
      var q = story.questions[i];
      html += '<div class="ws-rule"></div>';
      html += '<p class="section-label">Question ' + (i + 1) + ' — ' + escapeHtml(q.label) + '</p>';
      html += '<p class="section-question">' + escapeHtml(q.question) + '</p>';
      var cls = i === 0 ? 'ci-input' : 'detail-input';
      html += '<textarea class="' + cls + '" data-save="ela1-' + (i + 1) + '" rows="' + (q.rows || 3) + '" placeholder="' + escapeHtml(q.placeholder) + '"></textarea>';
    }
    return html;
  }

  // ===== AUTO-SAVE RE-INIT =====
  function reinitAutoSave(container) {
    var pagePath = location.pathname.split('/').pop().replace('.html', '') || 'index';
    container.querySelectorAll('input[data-save], textarea[data-save]').forEach(function (el) {
      var key = pagePath + ':' + el.dataset.save;
      var saved = localStorage.getItem(key);
      if (saved) {
        if (el.type === 'checkbox' || el.type === 'radio') {
          el.checked = saved === 'true';
        } else {
          el.value = saved;
        }
      }
      // Remove old listeners by cloning (simplest way)
      var clone = el.cloneNode(true);
      el.parentNode.replaceChild(clone, el);
      clone.addEventListener('input', function () {
        if (clone.type === 'checkbox' || clone.type === 'radio') {
          localStorage.setItem(key, clone.checked);
        } else {
          localStorage.setItem(key, clone.value);
        }
      });
    });
  }

  // ===== LOADING UI =====
  function showLoading(container, text) {
    var existing = container.querySelector('.ai-gen-loading');
    if (existing) existing.remove();
    var div = document.createElement('div');
    div.className = 'ai-gen-loading';
    div.style.cssText = 'text-align:center;padding:40px;font-family:"Merriweather Sans",sans-serif;color:#888;';
    div.innerHTML = '<p style="font-size:14px;">' + (text || 'Generating new content...') + '</p>';
    // Insert after the first child (usually ws-header)
    if (container.firstElementChild) {
      container.insertBefore(div, container.firstElementChild.nextSibling);
    } else {
      container.appendChild(div);
    }
  }

  function hideLoading(container) {
    var existing = container.querySelector('.ai-gen-loading');
    if (existing) existing.remove();
  }

  function showError(container, msg) {
    var existing = container.querySelector('.ai-gen-error');
    if (existing) existing.remove();
    var div = document.createElement('div');
    div.className = 'ai-gen-error';
    div.style.cssText = 'text-align:center;padding:20px;font-family:"Merriweather Sans",sans-serif;color:#c0392b;background:#fdf0ef;border:1px solid #e74c3c;border-radius:4px;margin:16px 0;';
    div.textContent = msg || 'Could not generate new content. Please try again later.';
    if (container.firstElementChild) {
      container.insertBefore(div, container.firstElementChild.nextSibling);
    } else {
      container.appendChild(div);
    }
    setTimeout(function () { div.remove(); }, 5000);
  }

  // ===== CLEAR LOCALSTORAGE FOR CONTAINER =====
  function clearContainerStorage(container) {
    var pagePath = location.pathname.split('/').pop().replace('.html', '') || 'index';
    container.querySelectorAll('input[data-save], textarea[data-save]').forEach(function (el) {
      if (el.dataset.save) {
        localStorage.removeItem(pagePath + ':' + el.dataset.save);
        localStorage.removeItem(pagePath + ':fitb-' + el.dataset.save);
      }
    });
  }

  // ===== PUBLIC API =====
  window.AIGenerator = {
    resetTab: async function (targetId) {
      var container = document.getElementById(targetId);
      if (!container) return;

      var config = window.STUDENT_CONFIG;
      if (!config) {
        console.error('[ai-generator] No STUDENT_CONFIG found');
        return;
      }

      // Confirm
      if (!confirm('Reset all your answers in this section?\n\nNew problems or a new story will be generated.')) return;

      var isMath = targetId === 'math';
      var isELA = targetId === 'ela';

      if (isMath && config.math) {
        showLoading(container, 'Generating new math problems...');

        // Small delay so user sees loading
        await new Promise(function (r) { setTimeout(r, 300); });

        // Clear old storage
        clearContainerStorage(container);

        // Detect pattern
        var hasChecked = !!container.querySelector('.problems-grid, .ans-input[data-answer]');
        var grid = container.querySelector('.math-grid, .problems-grid');
        var pattern = hasChecked ? 'checked' : 'drill';

        // Generate
        var problems = generateMathProblems(config.math);
        var html = buildMathHTML(problems, pattern);

        // Replace
        if (grid) {
          grid.innerHTML = html;
        } else {
          // Fallback: create a math-grid
          var newGrid = document.createElement('div');
          newGrid.className = 'math-grid';
          newGrid.innerHTML = html;
          var resetBar = container.querySelector('.reset-bar');
          if (resetBar) {
            container.insertBefore(newGrid, resetBar);
          } else {
            container.appendChild(newGrid);
          }
        }

        // Clear score display if exists
        var score = container.querySelector('.score-display');
        if (score) { score.textContent = ''; score.className = 'score-display'; }

        hideLoading(container);
        reinitAutoSave(container);

        // Flash animation
        container.style.transition = 'opacity 0.2s';
        container.style.opacity = '0.5';
        setTimeout(function () { container.style.opacity = '1'; }, 200);

        console.log('[ai-generator] Math reset complete for', targetId);
        return;
      }

      if (isELA && config.ela) {
        showLoading(container, 'Generating a new reading passage...');

        var story = await generateELA({ name: config.name, grade: config.grade, questions: config.ela.questions || 3 });

        if (!story) {
          hideLoading(container);
          showError(container, 'Could not generate a new story. Please try again later.');
          return;
        }

        // Clear old storage
        clearContainerStorage(container);

        // Replace passage and questions
        var passageWrap = container.querySelector('.passage-wrap');
        if (passageWrap) {
          // Build new passage-wrap content
          passageWrap.innerHTML = buildELAHTML(story);
        } else {
          // Fallback: create passage-wrap
          var newWrap = document.createElement('div');
          newWrap.className = 'passage-wrap';
          newWrap.innerHTML = buildELAHTML(story);
          var resetBar = container.querySelector('.reset-bar');
          if (resetBar) {
            container.insertBefore(newWrap, resetBar);
          } else {
            container.appendChild(newWrap);
          }
        }

        hideLoading(container);
        reinitAutoSave(container);

        // Flash animation
        container.style.transition = 'opacity 0.2s';
        container.style.opacity = '0.5';
        setTimeout(function () { container.style.opacity = '1'; }, 200);

        console.log('[ai-generator] ELA reset complete for', targetId);
        return;
      }

      // If no config for this tab, just do the old clear behavior
      console.log('[ai-generator] No generator config for', targetId, '— skipping');
    }
  };
})();
