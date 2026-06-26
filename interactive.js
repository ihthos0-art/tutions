(function () {
  'use strict';

  // Derive student namespace immediately (homework-loader sets window.HW.student synchronously)
  var NS = (window.HW && window.HW.student) ||
    location.pathname.split('/').pop().replace('.html', '') || 'index';

  // ---- GLOBAL: Math check (called from onclick="checkMath()" in HTML) ----
  window.checkMath = function () {
    var inputs = document.querySelectorAll('#math input[data-answer]');
    var correct = 0;
    inputs.forEach(function (inp) {
      var user = inp.value.trim().replace(/^\$/, '').replace(/,/g, '').toLowerCase();
      var ans = (inp.dataset.answer || '').trim().replace(/^\$/, '').replace(/,/g, '').toLowerCase();
      inp.classList.remove('correct', 'wrong');
      // Also handle parent-level toggling (mahiya/manha pattern)
      var parent = inp.closest('.math-prob, .math-word, .problem');
      if (parent) { parent.classList.remove('correct', 'wrong'); }
      if (!user) return;
      if (user === ans) {
        inp.classList.add('correct');
        if (parent) parent.classList.add('correct');
        correct++;
      } else {
        inp.classList.add('wrong');
        if (parent) parent.classList.add('wrong');
      }
    });
    var sc = document.getElementById('math-score') || document.getElementById('math-practice-score');
    if (sc) {
      var total = inputs.length;
      sc.textContent = correct === total && total > 0
        ? correct + ' / ' + total + ' — Perfect!'
        : correct + ' / ' + total + ' correct';
      sc.className = (sc.className || '').replace(/\bperfect\b/, '').trim();
      if (correct === total && total > 0) sc.className += ' perfect';
    }
    document.dispatchEvent(new CustomEvent('checkResult', { detail: { correct: correct, total: inputs.length } }));
  };

  // Alias used on nabila-naviha
  window.checkMathPractice = window.checkMath;

  // ---- GLOBAL: Clear all answers (called from onclick="clearAnswers()" in HTML) ----
  window.clearAnswers = function () {
    if (!confirm('Clear all your saved answers on this page?')) return;
    document.querySelectorAll('textarea[data-save]').forEach(function (el) {
      localStorage.removeItem(NS + ':' + el.dataset.save);
      el.value = '';
    });
    document.querySelectorAll('input[data-save]').forEach(function (el) {
      localStorage.removeItem(NS + ':mp-' + el.dataset.save);
      el.value = '';
      el.classList.remove('correct', 'wrong');
    });
  };

  // ---- initAll: bind DOM handlers — called by homework-loader after hydration ----
  window.initAll = function () {
    if (window.__initDone) return;
    window.__initDone = true;

    // Re-derive NS in case homework-loader updated it (it shouldn't change, but be safe)
    NS = (window.HW && window.HW.student) || NS;

    initFillBlank();
    initMathSave();
    initTextareaSave();
    initResetAll();
  };

  // ---- Fill-in-the-blank drag/drop ----
  function initFillBlank() {
    var dropZones = document.querySelectorAll('.fitb-drop[data-save]');
    var chips = document.querySelectorAll('.wb-chip');
    if (!dropZones.length) return;

    var draggedChip = null;
    var selectedChip = null;

    // Shuffle word bank so order doesn't hint at answers
    var wb = document.querySelector('.wb-words');
    if (wb) {
      var arr = Array.from(wb.children);
      for (var i = arr.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        wb.appendChild(arr[j]);
        arr.splice(j, 1);
      }
    }

    function syncWordBank() {
      var usedWords = new Set();
      dropZones.forEach(function (z) { if (z.dataset.filled) usedWords.add(z.dataset.filled); });
      chips.forEach(function (chip) { chip.classList.toggle('used', usedWords.has(chip.dataset.word)); });
    }

    function placeWord(zone, word, sourceChip) {
      if (zone.dataset.filled) {
        var old = document.querySelector('.wb-chip[data-word="' + zone.dataset.filled + '"]');
        if (old) old.classList.remove('used');
      }
      zone.textContent = word;
      zone.dataset.filled = word;
      zone.classList.remove('wrong', 'correct', 'drag-over');
      if (sourceChip) sourceChip.classList.add('used');
      localStorage.setItem(NS + ':fitb-' + zone.dataset.save, word);
      syncWordBank();
    }

    function removeWord(zone) {
      if (!zone.dataset.filled) return;
      var old = document.querySelector('.wb-chip[data-word="' + zone.dataset.filled + '"]');
      if (old) old.classList.remove('used');
      zone.textContent = '';
      delete zone.dataset.filled;
      zone.classList.remove('correct', 'wrong');
      localStorage.removeItem(NS + ':fitb-' + zone.dataset.save);
      syncWordBank();
    }

    // Chip events
    chips.forEach(function (chip) {
      chip.setAttribute('draggable', 'true');
      chip.addEventListener('dragstart', function (e) {
        if (chip.classList.contains('used')) { e.preventDefault(); return; }
        draggedChip = chip;
        e.dataTransfer.setData('text/plain', chip.dataset.word);
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(function () { chip.classList.add('dragging'); }, 0);
      });
      chip.addEventListener('dragend', function () {
        chip.classList.remove('dragging');
        draggedChip = null;
      });
      chip.addEventListener('click', function () {
        if (chip.classList.contains('used')) return;
        if (selectedChip === chip) { chip.classList.remove('selected'); selectedChip = null; return; }
        if (selectedChip) selectedChip.classList.remove('selected');
        selectedChip = chip;
        chip.classList.add('selected');
      });
    });

    // Drop zone events
    dropZones.forEach(function (zone) {
      zone.addEventListener('dragover', function (e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        zone.classList.add('drag-over');
      });
      zone.addEventListener('dragleave', function () { zone.classList.remove('drag-over'); });
      zone.addEventListener('drop', function (e) {
        e.preventDefault();
        zone.classList.remove('drag-over');
        var word = e.dataTransfer.getData('text/plain');
        var chip = document.querySelector('.wb-chip[data-word="' + word + '"]');
        placeWord(zone, word, chip);
        draggedChip = null;
      });
      zone.addEventListener('click', function () {
        if (selectedChip) {
          placeWord(zone, selectedChip.dataset.word, selectedChip);
          selectedChip.classList.remove('selected');
          selectedChip = null;
        } else if (zone.dataset.filled) {
          removeWord(zone);
        }
      });

      // Restore saved value
      var saved = localStorage.getItem(NS + ':fitb-' + zone.dataset.save);
      if (saved) { zone.textContent = saved; zone.dataset.filled = saved; }
    });
    syncWordBank();

    // FITB check button
    var fitbCheckBtn = document.getElementById('fitb-check-btn');
    if (fitbCheckBtn) {
      fitbCheckBtn.addEventListener('click', function () {
        var correct = 0;
        dropZones.forEach(function (zone) {
          zone.classList.remove('correct', 'wrong');
          if (!zone.dataset.filled) return;
          if (zone.dataset.filled === zone.dataset.answer) { zone.classList.add('correct'); correct++; }
          else zone.classList.add('wrong');
        });
        var total = dropZones.length;
        var display = document.getElementById('fitb-score');
        if (display) {
          display.textContent = correct === total
            ? correct + ' / ' + total + ' — Perfect score!'
            : correct + ' / ' + total + ' correct';
          display.className = 'score-display' + (correct === total ? ' perfect' : '');
        }
        document.dispatchEvent(new CustomEvent('checkResult', { detail: { correct: correct, total: total } }));
      });
    }
  }

  // ---- Math inputs: save/restore ----
  function initMathSave() {
    // Math practice tab: use 'mp-' prefix (matches nabila-naviha convention)
    document.querySelectorAll('#math input[data-save]').forEach(function (el) {
      var key = NS + ':mp-' + el.dataset.save;
      var saved = localStorage.getItem(key);
      if (saved) { el.value = saved; }
      el.addEventListener('input', function () { localStorage.setItem(key, el.value); });
    });
    // Assigned tab inputs and any other inputs: plain key
    document.querySelectorAll('#assigned input[data-save]').forEach(function (el) {
      var key = NS + ':' + el.dataset.save;
      var saved = localStorage.getItem(key);
      if (saved) {
        el.value = saved;
        if (saved.trim() === (el.dataset.answer || '').trim()) el.classList.add('correct');
      }
      el.addEventListener('input', function () { localStorage.setItem(key, el.value); });
    });
    // Generic check button (taha uses id="check-btn")
    var checkBtn = document.getElementById('check-btn');
    if (checkBtn) {
      var scoreDisplay = document.getElementById('score-display');
      checkBtn.addEventListener('click', function () {
        var allInputs = document.querySelectorAll('#assigned input[data-answer]');
        var correct = 0;
        allInputs.forEach(function (el) {
          el.classList.remove('correct', 'wrong');
          var val = el.value.trim();
          if (!val) return;
          if (val === (el.dataset.answer || '').trim()) { el.classList.add('correct'); correct++; }
          else el.classList.add('wrong');
        });
        var total = allInputs.length;
        if (scoreDisplay) {
          scoreDisplay.textContent = correct === total && total > 0
            ? correct + ' / ' + total + ' — Perfect score!'
            : correct + ' / ' + total + ' correct';
          scoreDisplay.className = 'score-display' + (correct === total && total > 0 ? ' perfect' : '');
        }
        document.dispatchEvent(new CustomEvent('checkResult', { detail: { correct: correct, total: total } }));
      });
    }
  }

  // ---- Textarea autosave ----
  function initTextareaSave() {
    document.querySelectorAll('textarea[data-save]').forEach(function (ta) {
      var key = NS + ':' + ta.dataset.save;
      var saved = localStorage.getItem(key);
      if (saved) ta.value = saved;
      ta.addEventListener('input', function () { localStorage.setItem(key, ta.value); });
      // Prevent paste (kids should type their own answers)
      ta.addEventListener('paste', function (e) { e.preventDefault(); });
      ta.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      ta.addEventListener('keydown', function (e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'v') e.preventDefault();
      });
    });
  }

  // ---- Reset all answers button (nabila-naviha style) ----
  function initResetAll() {
    var clearBtn = document.getElementById('assigned-clear-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        if (!confirm('Reset ALL saved answers? This cannot be undone.')) return;
        var keysToDelete = [];
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k && k.startsWith(NS + ':')) keysToDelete.push(k);
        }
        keysToDelete.forEach(function (k) { localStorage.removeItem(k); });
        location.reload();
      });
    }
  }

})();
