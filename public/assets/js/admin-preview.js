(function () {
  'use strict';

  if (window.parent === window) return;

  function onMessage(event) {
    if (event.origin !== window.location.origin || event.source !== window.parent) return;
    if (!event.data || event.data.type !== 'learnflow-admin-preview-data') return;

    var student = event.data.student;
    var token = event.data.token;
    if (!student || !/^[a-z0-9-]{1,80}$/.test(student.id || '') ||
        !/^[a-z0-9-]{1,80}$/.test(student.route || '') ||
        typeof student.name !== 'string' || !student.name.trim() ||
        !Number.isInteger(Number(student.grade)) || typeof token !== 'string' || !token) return;

    window.LEARNFLOW_AUTH = {
      role: 'admin',
      adminPreview: true,
      studentId: student.id,
      studentName: student.name,
      studentGrade: Number(student.grade),
      token: token
    };

    var previous = document.getElementById('admin-preview-renderer');
    if (previous) previous.remove();
    document.body.replaceChildren();
    var renderer = document.createElement('script');
    renderer.id = 'admin-preview-renderer';
    renderer.src = '/assets/js/student-subjects.js';
    renderer.dataset.student = student.route;
    document.body.append(renderer);
  }

  window.addEventListener('message', onMessage);
  window.parent.postMessage({ type: 'learnflow-admin-preview-ready' }, window.location.origin);
})();
