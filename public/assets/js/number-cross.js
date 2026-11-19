(function () {
  'use strict';

  var auth = window.LEARNFLOW_AUTH;
  if (!auth || !auth.token) return;

  var token = auth.token;
  var me = auth.studentId;
  var CELLS = 60;
  var HOLD_MS = 2000;

  var game = null;
  var teamPick = null;
  var pollTimer = null;
  var inFlight = false;
  var builtKey = null;
  var countdownDeadline = 0;
  var hold = { raf: null, tile: null, cell: -1, startedAt: 0 };

  function byId(id) { return document.getElementById(id); }

  function toast(message) {
    var node = byId('toast');
    node.textContent = message;
    node.classList.add('is-visible');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { node.classList.remove('is-visible'); }, 1600);
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
          var error = new Error(data.error || ('Request failed (' + response.status + ')'));
          error.status = response.status;
          throw error;
        }
        return data;
      });
    });
  }

  function show(name) {
    ['nc-lobby', 'nc-stage', 'nc-winner'].forEach(function (id) {
      byId(id).hidden = id !== name;
    });
  }

  function myPlayer() {
    if (!game) return null;
    return game.players.filter(function (player) { return player.id === me; })[0] || null;
  }

  function teamCounts() {
    var counts = { sun: 0, wave: 0 };
    if (game) game.players.forEach(function (player) { counts[player.team] += 1; });
    return counts;
  }

  function renderLobby() {
    show('nc-lobby');
    var counts = teamCounts();
    byId('team-count-sun').textContent = counts.sun + (counts.sun === 1 ? ' player' : ' players');
    byId('team-count-wave').textContent = counts.wave + (counts.wave === 1 ? ' player' : ' players');

    var mine = myPlayer();
    var current = mine ? mine.team : teamPick;
    ['sun', 'wave'].forEach(function (team) {
      var button = byId('team-' + team);
      var active = current === team;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-checked', String(active));
    });

    var list = byId('nc-lobby-players');
    list.replaceChildren();
    if (game) {
      game.players.forEach(function (player) {
        var li = document.createElement('li');
        if (player.id === me) li.className = 'is-me';
        li.appendChild(document.createTextNode(
          player.name + ' - ' + (player.team === 'sun' ? 'Team Sun' : 'Team Wave')
        ));
        list.appendChild(li);
      });
    }

    byId('nc-join').disabled = !current;
    byId('nc-join').textContent = mine
      ? 'Switch to ' + (current === 'sun' ? 'Team Sun' : 'Team Wave')
      : 'Join game';
    byId('nc-start').hidden = !mine;
    byId('nc-start').disabled = !(counts.sun > 0 && counts.wave > 0);
    byId('nc-lobby-error').textContent = '';
  }

  function buildBoard(numbers, key) {
    if (builtKey === key) return;
    builtKey = key;
    var board = byId('nc-board');
    board.replaceChildren();
    var slotCols = window.innerWidth < 700 ? 10 : 12;
    var slotRows = Math.ceil(CELLS / slotCols);
    board.style.aspectRatio = String(slotCols / (slotRows * 0.82));
    for (var i = 0; i < CELLS; i += 1) {
      var tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'nc-tile';
      tile.dataset.index = String(i);
      tile.textContent = String(numbers[i]);
      tile.setAttribute('aria-label', 'Number ' + numbers[i]);
      var col = i % slotCols;
      var row = Math.floor(i / slotCols);
      var left = ((col + 0.5 + (Math.random() - 0.5) * 0.52) / slotCols) * 100;
      var top = ((row + 0.5 + (Math.random() - 0.5) * 0.46) / slotRows) * 100;
      tile.style.left = Math.max(3.5, Math.min(96.5, left)).toFixed(2) + '%';
      tile.style.top = Math.max(4, Math.min(96, top)).toFixed(2) + '%';
      tile.style.setProperty('--rot', (Math.random() * 12 - 6).toFixed(1) + 'deg');
      board.appendChild(tile);
    }
  }

  function renderScores() {
    byId('count-a').textContent = String(game.crossed.sun.length);
    byId('count-b').textContent = String(game.crossed.wave.length);
    byId('score-a').classList.toggle('is-active', game.pickerTeam === 'sun');
    byId('score-b').classList.toggle('is-active', game.pickerTeam === 'wave');

    ['sun', 'wave'].forEach(function (team) {
      var host = byId(team === 'sun' ? 'members-a' : 'members-b');
      host.replaceChildren();
      game.players.filter(function (player) { return player.team === team; })
        .forEach(function (player) {
          var chip = document.createElement('span');
          chip.className = 'nc-member';
          if (player.team === game.pickerTeam) chip.classList.add('is-picking');
          if (player.team === game.finderTeam) chip.classList.add('is-searching');
          chip.textContent = player.name;
          host.appendChild(chip);
        });
    });
  }

  function setBanner(title, help) {
    byId('nc-banner').textContent = title;
    byId('nc-help').textContent = help || '';
  }

  function paintBoard() {
    var board = byId('nc-board');
    var crossedTeam = (game.phase === 'pick' && game.myTeam === game.pickerTeam)
      ? game.finderTeam
      : game.myTeam;
    var crossed = new Set(game.crossed[crossedTeam] || []);
    board.querySelectorAll('.nc-tile').forEach(function (tile) {
      var index = Number(tile.dataset.index);
      var isCrossed = crossed.has(index);
      tile.classList.toggle('is-crossed', isCrossed);
      tile.classList.toggle('is-pickable', Boolean(game.canPick) && !isCrossed);
    });
  }

  function renderStage() {
    show('nc-stage');
    renderScores();

    var numbersVisible = Array.isArray(game.numbers) && game.numbers.length === CELLS;
    if (numbersVisible) {
      buildBoard(game.numbers, game.id + ':' + game.numbers.join(','));
      byId('nc-cover').hidden = true;
    } else {
      byId('nc-cover').hidden = false;
      byId('nc-cover-text').textContent =
        (game.pickerTeam === 'sun' ? 'Team Sun' : 'Team Wave') + ' is picking';
    }

    byId('nc-target').hidden = !game.target;
    if (game.target) byId('nc-target-number').textContent = String(game.target);

    var overlay = byId('nc-countdown');
    if (game.phase === 'countdown') {
      overlay.hidden = false;
      countdownDeadline = Date.now() + game.countdownMsLeft;
      tickCountdown();
    } else {
      overlay.hidden = true;
    }

    if (game.phase === 'pick') {
      if (game.myTeam === game.pickerTeam) {
        setBanner('Your team picks', 'Tap a number. The other team must find it.');
      } else {
        setBanner('Team ' + (game.pickerTeam === 'sun' ? 'Sun' : 'Wave') + ' is picking',
          'Numbers stay hidden until they choose.');
      }
    } else if (game.phase === 'countdown') {
      setBanner('Target is ' + game.target, 'Get ready. Searching starts in a moment.');
    } else if (game.phase === 'find') {
      if (game.canHold) {
        setBanner('Find ' + game.target, 'Press and hold that number for 2 seconds to cross it.');
      } else {
        setBanner('Team ' + (game.finderTeam === 'sun' ? 'Sun' : 'Wave') + ' is searching',
          'They need to find ' + game.target + '.');
      }
    }

    paintBoard();
  }

  function tickCountdown() {
    var overlay = byId('nc-countdown');
    if (overlay.hidden) return;
    var left = Math.max(0, countdownDeadline - Date.now());
    byId('nc-countdown-number').textContent = left > 0 ? String(Math.ceil(left / 1000)) : 'GO';
    if (left > 0) setTimeout(tickCountdown, 150);
  }

  function render() {
    if (!game) { renderLobby(); return; }
    if (game.status === 'lobby') { renderLobby(); return; }
    if (game.status === 'finished') {
      show('nc-winner');
      var winnerName = game.winner === 'sun' ? 'Team Sun' : 'Team Wave';
      byId('nc-winner-title').textContent = game.winner === game.myTeam
        ? 'Your team wins'
        : winnerName + ' wins';
      byId('nc-winner-sub').textContent = 'All 60 blocks crossed.';
      return;
    }
    renderStage();
  }

  function poll() {
    if (inFlight) return;
    inFlight = true;
    api('/api/cross/state')
      .then(function (data) { game = data.game || null; render(); })
      .catch(function (error) { if (error.status === 401) window.location.replace('/login'); })
      .finally(function () { inFlight = false; });
  }

  function startPolling() {
    if (pollTimer) return;
    pollTimer = setInterval(poll, 800);
  }

  function joinGame(team) {
    byId('nc-lobby-error').textContent = '';
    api('/api/cross/join', { method: 'POST', body: JSON.stringify({ team: team }) })
      .then(function (data) { game = data.game; render(); })
      .catch(function (error) { byId('nc-lobby-error').textContent = error.message; });
  }

  ['sun', 'wave'].forEach(function (team) {
    byId('team-' + team).addEventListener('click', function () {
      teamPick = team;
      renderLobby();
    });
  });

  byId('nc-join').addEventListener('click', function () {
    if (teamPick) joinGame(teamPick);
  });

  byId('nc-start').addEventListener('click', function () {
    api('/api/cross/start', { method: 'POST' })
      .then(function (data) { game = data.game; render(); })
      .catch(function (error) { byId('nc-lobby-error').textContent = error.message; });
  });

  byId('nc-again').addEventListener('click', function () {
    joinGame(game && game.myTeam ? game.myTeam : (teamPick || 'sun'));
  });

  byId('nc-board').addEventListener('click', function (event) {
    var tile = event.target.closest('.nc-tile');
    if (!tile || !game || !game.canPick) return;
    var index = Number(tile.dataset.index);
    api('/api/cross/pick', { method: 'POST', body: JSON.stringify({ cell: index, version: game.version }) })
      .then(function (data) { game = data.game; render(); })
      .catch(function (error) { toast(error.message); poll(); });
  });

  function cancelHold(sendCancel) {
    if (hold.raf) cancelAnimationFrame(hold.raf);
    if (hold.tile) {
      hold.tile.classList.remove('is-holding');
      hold.tile.style.setProperty('--hold', '0');
    }
    if (sendCancel && hold.cell >= 0) {
      api('/api/cross/hold', { method: 'POST', body: JSON.stringify({ action: 'cancel' }) })
        .catch(function () {});
    }
    hold = { raf: null, tile: null, cell: -1, startedAt: 0 };
  }

  function beginHold(tile, index) {
    if (!game || !game.canHold || hold.cell >= 0) return;
    if (Number(tile.textContent) !== game.target) {
      tile.classList.add('is-wrong');
      setTimeout(function () { tile.classList.remove('is-wrong'); }, 420);
      toast('Wrong number');
      return;
    }
    api('/api/cross/hold', { method: 'POST', body: JSON.stringify({ action: 'start', cell: index }) })
      .then(function (data) {
        game = data.game;
        hold.cell = index;
        hold.tile = tile;
        hold.startedAt = performance.now();
        tile.classList.add('is-holding');
        var tick = function (now) {
          var progress = Math.min(1, (now - hold.startedAt) / HOLD_MS);
          tile.style.setProperty('--hold', String(progress));
          if (progress < 1) { hold.raf = requestAnimationFrame(tick); return; }
          completeHold(index, tile);
        };
        hold.raf = requestAnimationFrame(tick);
      })
      .catch(function (error) { toast(error.message); poll(); });
  }

  function completeHold(index, tile) {
    if (hold.raf) cancelAnimationFrame(hold.raf);
    tile.classList.remove('is-holding');
    tile.style.setProperty('--hold', '0');
    hold = { raf: null, tile: null, cell: -1, startedAt: 0 };
    api('/api/cross/complete', {
      method: 'POST',
      body: JSON.stringify({ cell: index, version: game.version })
    })
      .then(function (data) { game = data.game; render(); })
      .catch(function (error) { toast(error.message); poll(); });
  }

  byId('nc-board').addEventListener('pointerdown', function (event) {
    var tile = event.target.closest('.nc-tile');
    if (!tile || !game || game.phase !== 'find' || !game.canHold) return;
    event.preventDefault();
    beginHold(tile, Number(tile.dataset.index));
  });

  function releaseHold() { if (hold.cell >= 0) cancelHold(true); }
  byId('nc-board').addEventListener('pointerup', releaseHold);
  byId('nc-board').addEventListener('pointercancel', releaseHold);
  byId('nc-board').addEventListener('pointerleave', releaseHold);

  byId('nc-board').addEventListener('keydown', function (event) {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    if (!game || game.phase !== 'find' || !game.canHold) return;
    var tile = event.target.closest('.nc-tile');
    if (!tile) return;
    event.preventDefault();
    beginHold(tile, Number(tile.dataset.index));
  });
  byId('nc-board').addEventListener('keyup', function (event) {
    if (event.key === ' ' || event.key === 'Enter') releaseHold();
  });

  byId('nc-me').textContent = auth.studentName || '';
  poll();
  startPolling();
})();
