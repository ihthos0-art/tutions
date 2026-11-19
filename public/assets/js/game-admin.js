(function () {
  'use strict';

  var token = sessionStorage.getItem('admin-token-v2');
  if (!token) return;

  var bar = document.querySelector('.main-tab-bar');
  if (!bar || document.getElementById('tab-game-room')) return;

  var TITLES = {
    poison: 'Poison Challenge',
    cross: 'Find and Cross',
    odd: 'Odd One Out'
  };

  var button = document.createElement('button');
  button.className = 'main-tab-btn';
  button.setAttribute('data-tab', 'game-room');
  button.textContent = 'Game room';

  var panel = document.createElement('div');
  panel.className = 'main-tab-content';
  panel.id = 'tab-game-room';
  panel.innerHTML = [
    '<h1 class="page-heading">Game room</h1>',
    '<p class="status-msg" style="margin-bottom:14px;color:#666;line-height:1.6">',
    '  Live lobbies for every game. Players who leave are marked offline, and lobby seats are dropped after 90 seconds.',
    '</p>',
    '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px">',
    '  <button class="action-btn secondary" id="game-refresh" type="button">Refresh</button>',
    '</div>',
    '<p class="status-msg" id="game-room-error" style="color:#b23b3b;min-height:20px"></p>',
    '<div id="game-room-list"></div>'
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

  function statusLine(game) {
    if (!game) return 'No room yet';
    var bits = [game.status];
    if (game.phase && game.phase !== game.status) bits.push(game.phase);
    if (typeof game.round === 'number' && game.round > 0) bits.push('round ' + game.round);
    bits.push(game.players.length + (game.players.length === 1 ? ' player' : ' players'));
    if (game.winner) bits.push('winner: ' + game.winner);
    return bits.join(' / ');
  }

  function playerRow(mode, game, player) {
    var row = document.createElement('li');
    row.style.cssText = 'display:flex;align-items:center;gap:10px;padding:9px 12px;border:1px solid #e2e0db;border-radius:6px;margin-bottom:6px;background:#fff';

    var dot = document.createElement('span');
    dot.style.cssText = 'width:9px;height:9px;border-radius:50%;flex:0 0 auto;background:' + (player.online ? '#27ae60' : '#b9b9b9');
    var label = document.createElement('span');
    label.style.cssText = 'flex:1;font-size:14px';
    var team = player.team ? ' (' + player.team + ')' : '';
    label.textContent = player.name + team + (player.online ? '' : ' - offline');

    row.append(dot, label);

    if (game.status === 'lobby') {
      var kick = document.createElement('button');
      kick.type = 'button';
      kick.className = 'action-btn secondary';
      kick.textContent = 'Remove';
      kick.addEventListener('click', function () {
        if (!window.confirm('Remove ' + player.name + ' from the lobby?')) return;
        error('');
        api('/api/admin/games/' + mode + '/kick', {
          method: 'POST',
          body: JSON.stringify({ student: player.id })
        }).then(refresh).catch(function (failure) { error(failure.message); });
      });
      row.appendChild(kick);
    }

    return row;
  }

  function card(mode, game) {
    var wrap = document.createElement('div');
    wrap.className = 'editor-card';
    wrap.style.marginBottom = '18px';

    var heading = document.createElement('h2');
    heading.textContent = TITLES[mode];
    wrap.appendChild(heading);

    var status = document.createElement('p');
    status.className = 'status-msg';
    status.textContent = statusLine(game);
    wrap.appendChild(status);

    var actions = document.createElement('div');
    actions.className = 'btn-row';

    if (mode === 'poison' && game) {
      if (game.status === 'lobby') {
        var start = document.createElement('button');
        start.type = 'button';
        start.className = 'action-btn primary';
        start.textContent = 'Start game';
        start.addEventListener('click', function () {
          error('');
          api('/api/admin/games/poison/start', { method: 'POST' }).then(refresh)
            .catch(function (failure) { error(failure.message); });
        });
        actions.appendChild(start);
      }
      if (game.status === 'placement') {
        var force = document.createElement('button');
        force.type = 'button';
        force.className = 'action-btn primary';
        force.textContent = 'Force start';
        force.addEventListener('click', function () {
          if (!window.confirm('Fill missing poisons randomly and begin play?')) return;
          error('');
          api('/api/admin/games/poison/force-start', { method: 'POST' }).then(refresh)
            .catch(function (failure) { error(failure.message); });
        });
        actions.appendChild(force);
      }
    }

    if (game) {
      var reset = document.createElement('button');
      reset.type = 'button';
      reset.className = 'action-btn secondary';
      reset.textContent = 'Reset room';
      reset.addEventListener('click', function () {
        if (!window.confirm('Reset ' + TITLES[mode] + ' for everyone?')) return;
        error('');
        api('/api/admin/games/' + mode + '/reset', { method: 'POST' }).then(refresh)
          .catch(function (failure) { error(failure.message); });
      });
      actions.appendChild(reset);
    }

    var join = document.createElement('a');
    join.className = 'action-btn secondary';
    join.href = mode === 'poison' ? '/poison' : (mode === 'cross' ? '/number-cross' : '/odd-one-out');
    join.target = '_blank';
    join.rel = 'noopener';
    join.style.textDecoration = 'none';
    join.style.display = 'inline-flex';
    join.style.alignItems = 'center';
    join.textContent = 'Join as Teacher';
    actions.appendChild(join);

    if (actions.children.length) wrap.appendChild(actions);

    if (game && game.players.length) {
      var list = document.createElement('ul');
      list.style.cssText = 'list-style:none;padding:0;margin:12px 0 0';
      game.players.forEach(function (player) {
        list.appendChild(playerRow(mode, game, player));
      });
      wrap.appendChild(list);
    }

    if (mode !== 'poison') {
      var hint = document.createElement('p');
      hint.className = 'status-msg';
      hint.style.color = '#777';
      hint.textContent = 'Players start this game from their own page.';
      wrap.appendChild(hint);
    }

    return wrap;
  }

  function refresh() {
    api('/api/admin/games').then(function (data) {
      error('');
      var host = document.getElementById('game-room-list');
      host.replaceChildren();
      ['poison', 'cross', 'odd'].forEach(function (mode) {
        host.appendChild(card(mode, data.games[mode]));
      });
    }).catch(function (failure) { error(failure.message); });
  }

  document.getElementById('game-refresh').addEventListener('click', refresh);

  setInterval(function () {
    if (panel.classList.contains('active')) refresh();
  }, 3000);
})();
