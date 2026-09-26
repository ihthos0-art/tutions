(function () {
  'use strict';

  var session = null;
  try {
    session = JSON.parse(sessionStorage.getItem('learnflow.session') || 'null');
  } catch (error) {
    session = null;
  }

  if (!session || session.role !== 'student' || !session.studentId || !session.token) {
    window.__LEARNFLOW_AUTH_BLOCKED = true;
    var returnTo = window.location.pathname + window.location.search;
    window.location.replace('/login?return=' + encodeURIComponent(returnTo));
    return;
  }

  window.LEARNFLOW_AUTH = session;
})();
