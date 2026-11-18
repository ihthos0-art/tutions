(function () {
  'use strict';

  var auth = window.LEARNFLOW_AUTH;
  if (!auth || !auth.token) return;

  var token = auth.token;
  var me = auth.studentId;
  var game = null;
  var chosen = [];
  var placementGameId = null;
  var seenReveals = {};
  var revealsInitialized = false;
  var pollTimer = null;
  var inFlight = false;
  var audioCtx = null;

  function byId(id) { return document.getElementById(id); }

  function show(name) {
    ['pin-screen', 'lobby-screen', 'placement-screen', 'play-screen', 'finished-screen']
      .forEach(function (id) { byId(id).hidden = id !== name + '-screen'; });
  }

  function toast(message) {
    var node = byId('toast');
    node.textContent = message;
    node.classList.add('is-visible');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { node.classList.remove('is-visible'); }, 1800);
  }

  function api(path, options) {
    var opts = options || {};
    opts.headers = Object.assign(
      { Authorization: 'Bearer ' + token },
      opts.body ? { 'Content-Type': 'application/json' } : {}
    );
    opts.cache = 'no-store';
    return fetch(path, opts).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (data) {
        if (!response.ok) {
          var error = new Error(data.error || 'Request failed (' + response.status + ')');
          error.status = response.status;
          throw error;
        }
        return data;
      });
    });
  }

  function playerName(id) {
    if (!game) return id;
    var found = game.players.filter(function (player) { return player.id === id; })[0];
    return found ? found.name : id;
  }

  function cellCount() { return (game ? game.cols * game.rows : 0); }

  function makeBoard(host, cols) {
    host.replaceChildren();
    host.style.setProperty('--cols', String(cols));
    host.classList.remove('locked');
    for (var i = 0; i < cellCount(); i += 1) {
      var cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'cell';
      cell.dataset.cell = String(i);
      cell.setAttribute('aria-label', 'Cell ' + (i + 1));
      host.appendChild(cell);
    }
  }

  function playBoom() {
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      audioCtx = audioCtx || new Ctx();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      var t = audioCtx.currentTime;
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.45);
      gain.gain.setValueAtTime(0.6, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.6);

      var frames = Math.floor(audioCtx.sampleRate * 0.3);
      var buffer = audioCtx.createBuffer(1, frames, audioCtx.sampleRate);
      var data = buffer.getChannelData(0);
      for (var i = 0; i < frames; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
      var noise = audioCtx.createBufferSource();
      var noiseGain = audioCtx.createGain();
      noiseGain.gain.value = 0.25;
      noise.buffer = buffer;
      noise.connect(noiseGain).connect(audioCtx.destination);
      noise.start(t);
    } catch (error) {
      console.warn('Boom sound unavailable:', error);
    }
  }

  function boom(cellIndex) {
    var cell = byId('play-board').querySelector('[data-cell="' + cellIndex + '"]')
      || byId('placement-board').querySelector('[data-cell="' + cellIndex + '"]');
    if (cell) {
      cell.classList.add('boom');
      setTimeout(function () { cell.classList.remove('boom'); }, 750);
    }
    document.body.classList.add('shake');
    setTimeout(function () { document.body.classList.remove('shake'); }, 320);
    playBoom();
  }

  function renderLobby() {
    show('lobby');
    byId('lobby-players').replaceChildren();
    game.players.forEach(function (player) {
      var li = document.createElement('li');
      if (player.id === me) li.className = 'is-me';
      li.appendChild(document.createTextNode(player.name + (player.id === me ? ' (you)' : '')));
      var badge = document.createElement('span');
      badge.textContent = 'ready';
      li.appendChild(badge);
      byId('lobby-players').appendChild(li);
    });
  }

  function renderPlacement() {
    show('placement');
    if (placementGameId !== game.id) {
      placementGameId = game.id;
      chosen = [];
      byId('placement-board').replaceChildren();
    }
    var mine = game.players.filter(function (player) { return player.id === me; })[0];
    if (mine && mine.placementDone) {
      byId('placement-count').textContent = 'Poisons hidden. Waiting for the others…';
      byId('placement-submit').disabled = true;
      byId('placement-board').querySelectorAll('.cell').forEach(function (cell) { cell.disabled = true; });
      return;
    }
    if (byId('placement-board').children.length !== cellCount()) makeBoard(byId('placement-board'), game.cols);
    byId('placement-board').querySelectorAll('.cell').forEach(function (cell) {
      var index = Number(cell.dataset.cell);
      cell.classList.toggle('cell--chosen', chosen.indexOf(index) >= 0);
      cell.textContent = chosen.indexOf(index) >= 0 ? '☠' : '';
    });
    byId('placement-count').textContent = chosen.length + ' / 3 chosen';
    byId('placement-submit').disabled = chosen.length !== 3;
  }

  function renderPlay() {
    show('play');
    var board = byId('play-board');
    if (board.children.length !== cellCount()) makeBoard(board, game.cols);
    board.style.setProperty('--cols', String(game.cols));

    var myTurn = Boolean(game.myTurn);
    board.classList.toggle('locked', !myTurn);
    board.querySelectorAll('.cell').forEach(function (cell) {
      if (myTurn) cell.removeAttribute('aria-disabled');
      else cell.setAttribute('aria-disabled', 'true');
    });
    byId('board-lock').hidden = myTurn;

    var banner = byId('turn-banner');
    if (myTurn) {
      banner.textContent = 'Your turn — pick a cell';
      banner.classList.add('is-mine');
    } else {
      banner.textContent = 'Waiting for ' + playerName(game.turnOrder[game.turnIndex]);
      banner.classList.remove('is-mine');
    }

    board.querySelectorAll('.cell').forEach(function (cell) {
      var index = Number(cell.dataset.cell);
      var reveal = game.revealed ? game.revealed[String(index)] : null;
      cell.className = 'cell';
      cell.disabled = Boolean(reveal);
      if (reveal) {
        cell.classList.add(reveal.hit ? 'cell--poison' : 'cell--safe');
        cell.textContent = reveal.hit ? '💥' : '✓';
      } else if (game.ownPoisons && game.ownPoisons.indexOf(index) >= 0) {
        cell.classList.add('cell--own');
        cell.textContent = '☠';
      } else {
        cell.textContent = '';
      }
    });

    var fresh = [];
    Object.keys(game.revealed || {}).forEach(function (key) {
      if (!seenReveals[key]) {
        seenReveals[key] = true;
        if (revealsInitialized && game.revealed[key].hit) fresh.push(Number(key));
      }
    });
    revealsInitialized = true;

    var lives = byId('lives-list');
    lives.replaceChildren();
    game.players.forEach(function (player) {
      var li = document.createElement('li');
      if (player.id === me) li.className = 'is-me';
      li.appendChild(document.createTextNode(player.name + (player.id === me ? ' (you)' : '')));
      var hearts = document.createElement('span');
      hearts.textContent = player.eliminated ? 'out' : '♥'.repeat(player.lives);
      li.appendChild(hearts);
      lives.appendChild(li);
    });

    fresh.forEach(function (index) { boom(index); });
  }

  function renderFinished() {
    show('finished');
    var winners = game.players.filter(function (player) { return player.id === game.winner; });
    byId('winner-line').textContent = winners.length
      ? winners[0].name + ' wins!'
      : 'Everyone is out.';
    var rows = game.leaderboard && game.leaderboard.length
      ? game.leaderboard
      : game.players.slice().sort(function (a, b) {
        return Number(a.eliminated) - Number(b.eliminated) || b.lives - a.lives;
      }).map(function (player, index) {
        return { id: player.id, name: player.name, lives: player.lives, rank: index + 1 };
      });
    var list = byId('leaderboard');
    list.replaceChildren();
    rows.forEach(function (row) {
      var li = document.createElement('li');
      li.appendChild(document.createTextNode(row.name));
      var span = document.createElement('span');
      span.textContent = row.lives + ' lives left';
      li.appendChild(span);
      list.appendChild(li);
    });
  }

  function render() {
    if (!game) { show('pin'); return; }
    if (game.status === 'lobby') renderLobby();
    else if (game.status === 'placement') renderPlacement();
    else if (game.status === 'playing') renderPlay();
    else if (game.status === 'finished') renderFinished();
    else show('pin');
  }

  function poll() {
    if (inFlight) return;
    inFlight = true;
    api('/api/game/state')
      .then(function (data) {
        game = data.game || null;
        if (game && !pollTimer) startPolling();
        render();
      })
      .catch(function (error) {
        if (error.status === 401) window.location.replace('/login');
      })
      .finally(function () { inFlight = false; });
  }

  function startPolling() {
    if (pollTimer) return;
    pollTimer = setInterval(poll, 1000);
  }

  byId('game-player').textContent = auth.studentName || me;

  byId('pin-form').addEventListener('submit', function (event) {
    event.preventDefault();
    var pin = byId('pin-input').value.trim();
    byId('pin-error').textContent = '';
    if (!/^\d{4}$/.test(pin)) {
      byId('pin-error').textContent = 'Enter the four-number PIN.';
      return;
    }
    api('/api/game/join', { method: 'POST', body: JSON.stringify({ pin: pin }) })
      .then(function (data) {
        game = data.game;
        render();
        startPolling();
      })
      .catch(function (error) {
        byId('pin-error').textContent = error.message;
      });
  });

  byId('placement-board').addEventListener('click', function (event) {
    var cell = event.target.closest('.cell');
    if (!cell || cell.disabled) return;
    var index = Number(cell.dataset.cell);
    var at = chosen.indexOf(index);
    if (at >= 0) chosen.splice(at, 1);
    else if (chosen.length < 3) chosen.push(index);
    else toast('You already chose 3 poisons');
    renderPlacement();
  });

  byId('placement-submit').addEventListener('click', function () {
    if (chosen.length !== 3) return;
    api('/api/game/poison', {
      method: 'POST',
      body: JSON.stringify({ cells: chosen, version: game.version })
    })
      .then(function (data) { game = data.game; render(); })
      .catch(function (error) {
        toast(error.message);
        poll();
      });
  });

  byId('play-board').addEventListener('click', function (event) {
    var cell = event.target.closest('.cell');
    if (!cell || cell.disabled) return;
    if (!game || !game.myTurn) { toast('Not your turn'); return; }
    var index = Number(cell.dataset.cell);
    api('/api/game/pick', {
      method: 'POST',
      body: JSON.stringify({ cell: index, version: game.version })
    })
      .then(function (data) {
        game = data.game;
        render();
        if (data.result && data.result.hit) boom(index);
      })
      .catch(function (error) {
        toast(error.message);
        poll();
      });
  });

  poll();
})();
