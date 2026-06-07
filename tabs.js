(function () {
  'use strict';

  console.log('[tabs.js] loaded, version debug-v3');

  // ===== TAB SYSTEM =====
  var tabs = document.querySelectorAll('.tab-btn');
  var contents = document.querySelectorAll('.tab-content');
  console.log('[tabs.js] found ' + tabs.length + ' tabs, ' + contents.length + ' contents');

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function (e) {
      e.preventDefault();
      var target = this.dataset.tab;
      tabs.forEach(function (t) { t.classList.remove('active'); });
      contents.forEach(function (c) { c.classList.remove('active'); });
      this.classList.add('active');
      document.getElementById(target).classList.add('active');
    });
  });

  // ===== RESET BUTTONS =====
  var resetBtns = document.querySelectorAll('.reset-btn');
  console.log('[tabs.js] found ' + resetBtns.length + ' reset buttons');

  resetBtns.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var targetId = this.dataset.reset;
      console.log('[tabs.js] RESET CLICKED for targetId:', targetId);
      var container = document.getElementById(targetId);
      if (!container) {
        console.log('[tabs.js] ERROR: container #' + targetId + ' not found');
        return;
      }
      console.log('[tabs.js] container found:', container);
      if (!confirm('Reset all your answers in this section?')) {
        console.log('[tabs.js] user cancelled reset');
        return;
      }

      var clearedCount = 0;

      // Clear all text-like inputs and textareas
      var textInputs = container.querySelectorAll('input:not([type="radio"]):not([type="checkbox"]), textarea');
      console.log('[tabs.js] text inputs found in container:', textInputs.length);
      textInputs.forEach(function (el) {
        var oldVal = el.value;
        el.value = '';
        el.classList.remove('correct', 'wrong');
        if (el.dataset.save) {
          var pagePath = location.pathname.split('/').pop().replace('.html', '') || 'index';
          var key1 = pagePath + ':' + el.dataset.save;
          var key2 = pagePath + ':fitb-' + el.dataset.save;
          localStorage.removeItem(key1);
          localStorage.removeItem(key2);
          console.log('[tabs.js] cleared localStorage:', key1, key2);
        }
        clearedCount++;
        console.log('[tabs.js] cleared input, old value:', oldVal, 'new value:', el.value, 'dataset.save:', el.dataset.save);
      });

      // Clear radio buttons
      var radios = container.querySelectorAll('input[type="radio"]');
      radios.forEach(function (el) {
        el.checked = false;
        el.classList.remove('correct', 'wrong');
        clearedCount++;
      });

      // Clear checkboxes
      var checkboxes = container.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach(function (el) {
        el.checked = false;
        el.classList.remove('correct', 'wrong');
        clearedCount++;
      });

      // Clear score displays inside this container
      var scores = container.querySelectorAll('.score-display');
      console.log('[tabs.js] score displays found:', scores.length);
      scores.forEach(function (el) {
        el.textContent = '';
        el.className = 'score-display';
      });

      // Trigger a flash animation
      container.style.transition = 'opacity 0.2s';
      container.style.opacity = '0.5';
      setTimeout(function () {
        container.style.opacity = '1';
      }, 200);

      console.log('[tabs.js] RESET COMPLETE. Cleared', clearedCount, 'elements.');
    });
  });

  // Auto-save for inputs with data-save
  var pagePath = location.pathname.split('/').pop().replace('.html', '') || 'index';
  var saveEls = document.querySelectorAll('input[data-save], textarea[data-save]');
  console.log('[tabs.js] auto-save elements found:', saveEls.length);
  saveEls.forEach(function (el) {
    var key = pagePath + ':' + el.dataset.save;
    var saved = localStorage.getItem(key);
    if (saved) {
      if (el.type === 'checkbox' || el.type === 'radio') {
        el.checked = saved === 'true';
      } else {
        el.value = saved;
      }
    }
    el.addEventListener('input', function () {
      if (el.type === 'checkbox' || el.type === 'radio') {
        localStorage.setItem(key, el.checked);
      } else {
        localStorage.setItem(key, el.value);
      }
    });
  });

  // Expose debug info globally
  window.__tabsDebug = {
    version: 'debug-v3',
    resetButtons: resetBtns.length,
    autoSaveElements: saveEls.length,
    localStorageKeys: Object.keys(localStorage).filter(function(k) { return !k.startsWith('ai-'); })
  };
  console.log('[tabs.js] debug info:', window.__tabsDebug);
})();
