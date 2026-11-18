(function () {
  'use strict';

  var token = sessionStorage.getItem('admin-token-v2');
  if (!token) return;

  var bar = document.querySelector('.main-tab-bar');
  if (!bar || document.getElementById('tab-game-room')) return;

  var button = document.createElement('button');
  button.className = 'main-tab-btn';
  button.setAttribute('data-tab', 'game-room');
  button.textContent = 'Game room';

  var panel = document.createElement('div');
  panel.className = 'main-tab-content';
  panel.id = 'tab-game-room';
  panel.innerHTML = [
    '<h1 class="page-heading">Game room</h1>',
    '<p class="status-msg" id="game-room-status">Loading game status…</p>',
    '<div class="editor-card">',
    '  <p class="builder-help">Start the Poison Challenge once every student has joined. Reset clears the current room.</p>',
    '  <div style="display:flex;gap:12px;flex-wrap:wrap">',
    '    <button class="action-btn" id="game-start-btn" type="button">Start game</button>',
    '    <button class="action-btn secondary" id="game-reset-btn" type="button">Reset room</button>',
    '  </div>',
    '  <p class="status-msg" id="game-room-error" style="color:#b23b3b;min-height:20px"></p>',
    '</div>'
  ].join('');

  bar.appendChild(button);
  var body = document.querySelector('.admin-body') || panel;
  body.appendChild(panel);

  function activate() {
    document.querySelectorAll('.main-tab-btn').forEach(function (node) {
      node.classList.toggle('active', node === button);
    });
    document.querySelectorAll('.main-tab-content').forEach(function (node) {
      node.classList.toggle('active', node === panel);
    });
    refresh();
  }

  document.querySelectorAll('.main-tab-btn').forEach(function (node) {
    if (node === button) return;
    node.addEventListener('click', function () {
      button.classList.remove('active');
      panel.classList.remove('active');
    });
  });

  button.addEventListener('click', activate);

  function api(path, options) {
    var opts = options || {};
    opts.headers = Object.assign({ Authorization: 'Bearer ' + token },
      opts.body ? { 'Content-Type': 'application/json' } : {});
    return fetch(path, opts).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (data) {
        if (!response.ok) throw new Error(data.error || ('Request failed (' + response.status + ')'));
        return data;
      });
    });
  }

  function error(message) {
    document.getElementById('game-room-error').textContent = message || '';
  }

  function refresh() {
    api('/api/game/state').then(function (data) {
      var game = data.game;
      var status = document.getElementById('game-room-status');
      if (!game) {
        status.textContent = 'No game room yet. Students create one by entering the PIN.';
        return;
      }
      var names = game.players.map(function (player) { return player.name; }).join(', ');
      status.textContent = 'Status: ' + game.status + ' · ' + game.players.length +
        ' player(s)' + (names ? ': ' + names : '');
    }).catch(function (failure) { error(failure.message); });
  }

  document.getElementById('game-start-btn').addEventListener('click', function () {
    error('');
    api('/api/game/start', { method: 'POST' })
      .then(refresh)
      .catch(function (failure) { error(failure.message); });
  });

  document.getElementById('game-reset-btn').addEventListener('click', function () {
    error('');
    api('/api/game/reset', { method: 'POST' })
      .then(refresh)
      .catch(function (failure) { error(failure.message); });
  });

  setInterval(function () {
    if (panel.classList.contains('active')) refresh();
  }, 3000);
})();
