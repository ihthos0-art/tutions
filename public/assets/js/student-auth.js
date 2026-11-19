(function () {
  'use strict';

  var session = null;
  try {
    session = JSON.parse(sessionStorage.getItem('learnflow.session') || 'null');
  } catch (error) {
    session = null;
  }

  if (session && session.role === 'student' && session.studentId && session.token) {
    window.LEARNFLOW_AUTH = session;
    return;
  }

  // Teacher can play the games from the admin login on the same device.
  var GAME_ROUTES = ['/poison', '/number-cross', '/odd-one-out'];
  var adminToken = sessionStorage.getItem('admin-token-v2');
  if (!adminToken) {
    try { adminToken = localStorage.getItem('learnflow.admin-token'); } catch (error) { adminToken = null; }
  }
  if (adminToken && GAME_ROUTES.indexOf(window.location.pathname) >= 0) {
    window.LEARNFLOW_AUTH = {
      role: 'admin',
      studentId: 'admin',
      studentName: 'Teacher',
      token: adminToken
    };
    return;
  }

  window.__LEARNFLOW_AUTH_BLOCKED = true;
  var returnTo = window.location.pathname + window.location.search;
  window.location.replace('/login?return=' + encodeURIComponent(returnTo));
})();
