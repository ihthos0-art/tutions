(function () {
  'use strict';
  var STUDENT = document.documentElement.dataset.studentId ||
    location.pathname.split('/').pop().replace('.html', '') || 'index';
  var timer = null;

  function collect() {
    var out = {};
    document.querySelectorAll('textarea[data-save], input[data-save]').forEach(function (t) {
      if (t.value && t.value.trim()) out[t.dataset.save] = t.value;
    });
    return out;
  }

  function push() {
    clearTimeout(timer);
    timer = setTimeout(function () {
      fetch('/api/answers/' + STUDENT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: collect() })
      }).catch(function () {});
    }, 1500);
  }

  document.addEventListener('input', function (e) {
    if (e.target.matches && e.target.matches('textarea[data-save], input[data-save]')) push();
  });
})();
