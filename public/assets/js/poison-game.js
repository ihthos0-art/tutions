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
  var lastPin = '';
  try { lastPin = sessionStorage.getItem('poison-pin') || ''; } catch (error) { lastPin = ''; }
  var pickMode = 'solo';
  var pickTeam = null;

  var ITEM_POOL = [
    '🍎', '🍌', '🍇', '🍓', '🍒', '🍉', '🍑', '🍍', '🥝', '🍊',
    '🍋', '🥥', '🍐', '🫐', '🍅', '🥑', '🌽', '🥕', '🍄', '🌶️',
    '💎', '💍', '🔮', '⭐', '🌟', '🪙', '🎁', '🏆', '🎈', '🧸',
    '🐸', '🐙', '🦄', '🐝', '🦋', '🐢', '🐳', '🦊', '🐼', '🦉'
  ];

  function hashText(text) {
    var h = 2166136261;
    for (var i = 0; i < text.length; i += 1) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function itemFor(salt) {
    return ITEM_POOL[hashText(String(salt)) % ITEM_POOL.length];
  }

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

  function mePlayer() {
    if (!game) return null;
    return game.players.filter(function (player) { return player.id === me; })[0] || null;
  }

  function teamName(team) { return team === 'sun' ? 'Team Sun' : 'Team Wave'; }

  function playerName(id) {
    if (!game) return id;
    var found = game.players.filter(function (player) { return player.id === id; })[0];
    return found ? found.name : id;
  }

  function cellCount() { return game ? game.cols * game.rows : 0; }

  function setModeButtons(root, active) {
    ['solo', 'teams'].forEach(function (mode) {
      var node = byId(root + '-mode-' + mode);
      if (!node) return;
      node.classList.toggle('is-active', mode === active);
      node.setAttribute('aria-checked', String(mode === active));
    });
  }

  function renderModePickers() {
    setModeButtons('pick', pickMode);
    byId('pin-team-pick').hidden = pickMode !== 'teams';
    if (game) {
      setModeButtons('lobby', game.mode);
      byId('lobby-team-pick').hidden = game.mode !== 'teams';
    }
  }

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

  function unlockAudio() {
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      audioCtx = audioCtx || new Ctx();
      if (audioCtx.state === 'suspended') audioCtx.resume();
    } catch (error) { /* audio is optional */ }
  }

  function makeBoom() {
    var t = audioCtx.currentTime;
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(190, t);
    osc.frequency.exponentialRampToValueAtTime(38, t + 0.5);
    gain.gain.setValueAtTime(0.95, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.65);

    var crack = audioCtx.createOscillator();
    var crackGain = audioCtx.createGain();
    crack.type = 'square';
    crack.frequency.setValueAtTime(520, t);
    crack.frequency.exponentialRampToValueAtTime(120, t + 0.18);
    crackGain.gain.setValueAtTime(0.18, t);
    crackGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    crack.connect(crackGain).connect(audioCtx.destination);
    crack.start(t);
    crack.stop(t + 0.22);

    var frames = Math.floor(audioCtx.sampleRate * 0.35);
    var buffer = audioCtx.createBuffer(1, frames, audioCtx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < frames; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    var noise = audioCtx.createBufferSource();
    var noiseGain = audioCtx.createGain();
    noiseGain.gain.value = 0.35;
    noise.buffer = buffer;
    noise.connect(noiseGain).connect(audioCtx.destination);
    noise.start(t);
  }

  function playBoom() {
    if (window.LearnFlowBoom) { window.LearnFlowBoom.play(); return; }
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) { toast('This browser has no audio support'); return; }
      audioCtx = audioCtx || new Ctx();
      if (audioCtx.state === 'running') {
        makeBoom();
        return;
      }
      audioCtx.resume().then(makeBoom).catch(function (error) {
        console.warn('Boom sound unavailable:', error);
        toast('Tap the page once to enable sound');
      });
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
    renderModePickers();
    var counts = { sun: 0, wave: 0 };
    game.players.forEach(function (player) { if (player.team) counts[player.team] += 1; });
    byId('lobby-sun-count').textContent = counts.sun + (counts.sun === 1 ? ' player' : ' players');
    byId('lobby-wave-count').textContent = counts.wave + (counts.wave === 1 ? ' player' : ' players');
    var mine = mePlayer();
    ['sun', 'wave'].forEach(function (team) {
      var node = byId('lobby-' + team);
      var active = mine && mine.team === team;
      node.classList.toggle('is-active', active);
      node.setAttribute('aria-checked', String(Boolean(active)));
    });

    var list = byId('lobby-players');
    list.replaceChildren();
    game.players.forEach(function (player) {
      var li = document.createElement('li');
      if (player.id === me) li.className = 'is-me';
      li.appendChild(document.createTextNode(
        player.name + (player.id === me ? ' (you)' : '') + (player.team ? ' - ' + teamName(player.team) : '')
      ));
      var badge = document.createElement('span');
      badge.textContent = player.online === false ? 'offline' : 'ready';
      li.appendChild(badge);
      list.appendChild(li);
    });

    var ready = game.players.length >= 2 && (game.mode !== 'teams' || (counts.sun > 0 && counts.wave > 0));
    byId('lobby-status').textContent = game.mode === 'teams'
      ? 'Teams share 3 lives. Both teams need a player before the teacher starts.'
      : 'Free for all: everyone solo with 3 lives.';
    byId('lobby-status').dataset.ready = ready ? '1' : '0';
  }

  function renderPlacement() {
    show('placement');
    if (placementGameId !== game.id) {
      placementGameId = game.id;
      chosen = [];
      byId('placement-board').replaceChildren();
    }
    var mine = mePlayer();
    if (mine && mine.placementDone) {
      byId('placement-count').textContent = 'Poisons hidden. Waiting for the others.';
      byId('placement-submit').disabled = true;
      byId('placement-board').querySelectorAll('.cell').forEach(function (cell) { cell.disabled = true; });
      return;
    }
    if (byId('placement-board').children.length !== cellCount()) makeBoard(byId('placement-board'), game.cols);
    byId('placement-board').querySelectorAll('.cell').forEach(function (cell) {
      var index = Number(cell.dataset.cell);
      var isChosen = chosen.indexOf(index) >= 0;
      cell.classList.toggle('cell--chosen', isChosen);
      cell.classList.toggle('cell--own', isChosen);
      cell.textContent = itemFor(game.id);
    });
    byId('placement-count').textContent = chosen.length + ' / 3 chosen';
    byId('placement-submit').disabled = chosen.length !== 3;
  }

  function renderTeamLives() {
    var host = byId('team-lives');
    host.replaceChildren();
    ['sun', 'wave'].forEach(function (team) {
      var card = document.createElement('div');
      card.className = 'team-life is-' + team;
      var lives = Number(game.teamLives[team] || 0);
      if (lives <= 0) card.classList.add('is-out');
      var name = document.createElement('strong');
      name.textContent = teamName(team);
      var hearts = document.createElement('span');
      hearts.textContent = lives > 0 ? '♥'.repeat(lives) : 'out';
      card.append(name, hearts);
      host.appendChild(card);
    });
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

    renderTeamLives();

    var banner = byId('turn-banner');
    if (myTurn) {
      banner.textContent = 'Your turn: pick a cell';
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
      cell.textContent = itemFor(game.id);
      if (reveal) {
        cell.classList.add('cell--revealed');
        cell.classList.add(reveal.hit ? 'cell--poison' : 'cell--safe');
        cell.setAttribute('aria-disabled', 'true');
        cell.setAttribute('aria-label', reveal.hit ? 'Poison, out' : 'Safe, already picked');
        if (reveal.hit) cell.textContent = '💥';
        else cell.textContent = '✓';
      } else if (game.ownPoisons && game.ownPoisons.indexOf(index) >= 0) {
        cell.classList.add('cell--own');
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
      li.appendChild(document.createTextNode(
        player.name + (player.id === me ? ' (you)' : '') + (player.team ? ' - ' + teamName(player.team) : '')
      ));
      var hearts = document.createElement('span');
      if (game.mode === 'teams') {
        hearts.textContent = game.teamLives[player.team] > 0 ? 'team ' + game.teamLives[player.team] : 'out';
      } else {
        hearts.textContent = player.eliminated ? 'out' : '♥'.repeat(Number(player.lives || 0));
      }
      li.appendChild(hearts);
      lives.appendChild(li);
    });

    fresh.forEach(function (index) { boom(index); });
  }

  function renderFinished() {
    show('finished');
    var rows = game.leaderboard || [];
    byId('winner-line').textContent = game.mode === 'teams'
      ? (game.winnerTeam ? teamName(game.winnerTeam) + ' wins!' : 'Draw')
      : (game.winnerPlayer
        ? ((game.players.filter(function (p) { return p.id === game.winnerPlayer; })[0] || {}).name || 'Winner') + ' wins!'
        : 'Everyone is out.');
    var list = byId('leaderboard');
    list.replaceChildren();
    rows.forEach(function (row) {
      var li = document.createElement('li');
      li.appendChild(document.createTextNode(
        game.mode === 'teams' ? teamName(row.team) : row.name
      ));
      var span = document.createElement('span');
      span.textContent = String(row.lives) + ' lives left';
      li.appendChild(span);
      list.appendChild(li);
    });
  }

  function render() {
    if (!game || !mePlayer()) { show('pin'); renderModePickers(); return; }
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
      .catch(function (error) { if (error.status === 401) window.location.replace('/login'); })
      .finally(function () { inFlight = false; });
  }

  function startPolling() {
    if (pollTimer) return;
    pollTimer = setInterval(poll, 1000);
  }

  function joinGame(mode, team, pin) {
    byId('pin-error').textContent = '';
    api('/api/game/join', {
      method: 'POST',
      body: JSON.stringify({ pin: pin || lastPin, team: team || undefined, mode: mode })
    })
      .then(function (data) {
        game = data.game;
        if (pin) {
          lastPin = pin;
          try { sessionStorage.setItem('poison-pin', pin); } catch (error) { /* storage can be blocked */ }
        }
        render();
        startPolling();
      })
      .catch(function (error) {
        if (game) toast(error.message);
        else byId('pin-error').textContent = error.message;
      });
  }

  ['pick', 'lobby'].forEach(function (root) {
    ['solo', 'teams'].forEach(function (mode) {
      var node = byId(root + '-mode-' + mode);
      if (!node) return;
      node.addEventListener('click', function () {
        if (root === 'pick') {
          pickMode = mode;
          renderModePickers();
          return;
        }
        api('/api/game/mode', { method: 'POST', body: JSON.stringify({ mode: mode }) })
          .then(function (data) { game = data.game; render(); })
          .catch(function (error) { toast(error.message); });
      });
    });
  });

  ['pin', 'lobby'].forEach(function (root) {
    ['sun', 'wave'].forEach(function (team) {
      var node = byId(root + '-' + team);
      if (!node) return;
      node.addEventListener('click', function () {
        if (root === 'pin') {
          pickTeam = team;
          ['sun', 'wave'].forEach(function (other) {
            var btn = byId('pick-' + other);
            btn.classList.toggle('is-active', other === team);
            btn.setAttribute('aria-checked', String(other === team));
          });
          return;
        }
        joinGame('teams', team);
      });
    });
  });

  byId('sound-test').addEventListener('click', function () { playBoom(); });
  byId('game-player').textContent = auth.studentName || me;

  byId('pin-form').addEventListener('submit', function (event) {
    event.preventDefault();
    var pin = byId('pin-input').value.trim();
    if (!/^\d{4}$/.test(pin)) {
      byId('pin-error').textContent = 'Enter the four-number PIN.';
      return;
    }
    if (pickMode === 'teams' && !pickTeam) {
      byId('pin-error').textContent = 'Pick a team first.';
      return;
    }
    joinGame(pickMode, pickTeam, pin);
  });

  byId('back-to-lobby').addEventListener('click', function () {
    joinGame(game && game.mode ? game.mode : 'solo', mePlayer() ? mePlayer().team : null, lastPin);
  });

  byId('leave-game').addEventListener('click', function () {
    api('/api/game/leave', { method: 'POST' })
      .then(function () { game = null; show('pin'); renderModePickers(); })
      .catch(function (error) { toast(error.message); });
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
      .then(function (data) { game = data.game; chosen = []; render(); })
      .catch(function (error) { toast(error.message); poll(); });
  });

  startPolling();

  document.addEventListener('pointerdown', unlockAudio, { passive: true });
  document.addEventListener('click', unlockAudio, { passive: true });

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
      .catch(function (error) { toast(error.message); poll(); });
  });

  poll();
})();
