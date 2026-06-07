(function () {
  'use strict';

  // ===== TAB SYSTEM =====
  var tabs = document.querySelectorAll('.tab-btn');
  var contents = document.querySelectorAll('.tab-content');

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
  document.querySelectorAll('.reset-btn').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var targetId = this.dataset.reset;
      var container = document.getElementById(targetId);
      if (!container) return;

      // Delegate to AI generator if available (math/ela tabs)
      if (window.AIGenerator && typeof window.AIGenerator.resetTab === 'function' && (targetId === 'math' || targetId === 'ela')) {
        window.AIGenerator.resetTab(targetId);
        return;
      }

      // Fallback: just clear answers
      if (!confirm('Reset all your answers in this section?')) return;

      container.querySelectorAll('input:not([type="radio"]):not([type="checkbox"]), textarea').forEach(function (el) {
        el.value = '';
        el.classList.remove('correct', 'wrong');
        if (el.dataset.save) {
          var pagePath = location.pathname.split('/').pop().replace('.html', '') || 'index';
          localStorage.removeItem(pagePath + ':' + el.dataset.save);
          localStorage.removeItem(pagePath + ':fitb-' + el.dataset.save);
        }
      });

      container.querySelectorAll('input[type="radio"]').forEach(function (el) {
        el.checked = false;
        el.classList.remove('correct', 'wrong');
      });

      container.querySelectorAll('input[type="checkbox"]').forEach(function (el) {
        el.checked = false;
        el.classList.remove('correct', 'wrong');
      });

      container.querySelectorAll('.score-display').forEach(function (el) {
        el.textContent = '';
        el.className = 'score-display';
      });

      container.style.transition = 'opacity 0.2s';
      container.style.opacity = '0.5';
      setTimeout(function () {
        container.style.opacity = '1';
      }, 200);
    });
  });

  // Auto-save for inputs with data-save
  var pagePath = location.pathname.split('/').pop().replace('.html', '') || 'index';
  document.querySelectorAll('input[data-save], textarea[data-save]').forEach(function (el) {
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
})();
