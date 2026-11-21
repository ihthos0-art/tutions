(function () {
  'use strict';

  var auth = window.LEARNFLOW_AUTH;
  if (!auth || !auth.token) return;

  var token = auth.token;
  var me = auth.studentId;
  var CELLS = 50;
  var HOLD_MS = 2000;

  var game = null;
  var teamPick = null;
  var pollTimer = null;
  var inFlight = false;
  var builtKey = null;
  var hold = { raf: null, tile: null, cell: -1, startedAt: 0, version: 0 };

  function byId(id) { return document.getElementById(id); }
  function teamName(team) { return team === 'sun' ? 'Team Sun' : 'Team Wave'; }

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

  function counts() {
    var out = { sun: 0, wave: 0 };
    if (game) game.players.forEach(function (player) { out[player.team] += 1; });
    return out;
  }

  function renderLobby() {
    show('nc-lobby');
    var tally = counts();
    byId('team-count-sun').textContent = tally.sun + (tally.sun === 1 ? ' player' : ' players');
    byId('team-count-wave').textContent = tally.wave + (tally.wave === 1 ? ' player' : ' players');
    var mine = myPlayer();
    var current = mine ? mine.team : teamPick;
    ['sun', 'wave'].forEach(function (team) {
      var button = byId('team-' + team);
      button.classList.toggle('is-active', current === team);
      button.setAttribute('aria-checked', String(current === team));
    });
    var list = byId('nc-lobby-players');
    list.replaceChildren();
    if (game) {
      game.players.forEach(function (player) {
        var li = document.createElement('li');
        if (player.id === me) li.className = 'is-me';
        li.appendChild(document.createTextNode(player.name + ' - ' + teamName(player.team)));
        list.appendChild(li);
      });
    }
    byId('nc-join').disabled = !current;
    byId('nc-join').textContent = mine ? 'Switch to ' + teamName(current) : 'Join game';
    byId('nc-start').hidden = !mine;
    byId('nc-start').disabled = !(tally.sun > 0 && tally.wave > 0);
    byId('nc-lobby-error').textContent = '';
  }

  function buildBoard(numbers, key) {
    if (builtKey === key) return;
    builtKey = key;
    var board = byId('nc-board');
    board.replaceChildren();
    var cols = window.innerWidth < 700 ? 10 : 10;
    var rows = CELLS / cols;
    board.style.aspectRatio = String(cols / (rows * 0.9));
    for (var i = 0; i < CELLS; i += 1) {
      var tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'nc-tile';
      tile.dataset.index = String(i);
      tile.textContent = String(numbers[i]);
      tile.setAttribute('aria-label', 'Number ' + numbers[i]);
      var col = i % cols;
      var row = Math.floor(i / cols);
      var left = ((col + 0.5 + (Math.random() - 0.5) * 0.5) / cols) * 100;
      var top = ((row + 0.5 + (Math.random() - 0.5) * 0.42) / rows) * 100;
      tile.style.left = Math.max(3.5, Math.min(96.5, left)).toFixed(2) + '%';
      tile.style.top = Math.max(2.5, Math.min(97.5, top)).toFixed(2) + '%';
      tile.style.setProperty('--rot', (Math.random() * 10 - 5).toFixed(1) + 'deg');
      board.appendChild(tile);
    }
  }

  function renderStage() {
    show('nc-stage');
    byId('count-a').textContent = String(game.counts.sun);
    byId('count-b').textContent = String(game.counts.wave);
    byId('score-a').classList.toggle('is-active', game.pickerTeam === 'sun');
    byId('score-b').classList.toggle('is-active', game.pickerTeam === 'wave');

    ['sun', 'wave'].forEach(function (team) {
      var host = byId(team === 'sun' ? 'members-a' : 'members-b');
      host.replaceChildren();
      game.players.filter(function (player) { return player.team === team; }).forEach(function (player) {
        var chip = document.createElement('span');
        chip.className = 'nc-member';
        if (team === game.pickerTeam) chip.classList.add('is-picking');
        if (team === game.finderTeam) chip.classList.add('is-searching');
        chip.textContent = player.name;
        host.appendChild(chip);
      });
    });

    buildBoard(game.numbers, game.id + ':' + game.numbers.join(','));

    byId('nc-cover').hidden = true;
    byId('nc-countdown').hidden = true;

    var targetHost = byId('nc-target');
    if (game.phase === 'pick') {
      targetHost.hidden = true;
      if (game.myTeam === game.pickerTeam) {
        setBanner('Pick a secret number', 'Tap one number. The other team will try to find it.');
      } else {
        setBanner(teamName(game.pickerTeam) + ' is picking', 'Get ready to hunt their number.');
      }
    } else if (game.phase === 'cross') {
      if (game.secretNumber && game.myTeam === game.pickerTeam) {
        targetHost.hidden = false;
        byId('nc-target-number').textContent = String(game.secretNumber);
        setBanner('Your number is ' + game.secretNumber + ': cross boxes', 'Hold any box for 2 seconds. The other team is hunting your number.');
      } else if (game.myTeam === game.pickerTeam) {
        targetHost.hidden = true;
        setBanner('Cross boxes', 'Hold any box for 2 seconds.');
      } else if (game.canGuess) {
        targetHost.hidden = true;
        setBanner('Find their number', 'Tap the number the other team picked. Wrong guesses pause you.');
      } else {
        targetHost.hidden = true;
        setBanner('Hunting', 'Watching the board.');
      }
    }

    var own = new Set(game.crossed[game.myTeam] || []);
    byId('nc-board').querySelectorAll('.nc-tile').forEach(function (tile) {
      var index = Number(tile.dataset.index);
      tile.classList.toggle('is-crossed', own.has(index));
      tile.classList.toggle('is-pickable', Boolean(game.canPick));
      tile.classList.toggle('is-guessable', Boolean(game.canGuess));
      tile.disabled = false;
    });

  }

  function setBanner(title, help) {
    byId('nc-banner').textContent = title;
    byId('nc-help').textContent = help || '';
  }

  function renderWinner() {
    show('nc-winner');
    var winnerName = game.winner === 'sun' ? 'Team Sun' : 'Team Wave';
    byId('nc-winner-title').textContent = game.winner === game.myTeam ? 'Your team wins' : winnerName + ' wins';
    byId('nc-winner-sub').textContent =
      'Team Sun ' + game.counts.sun + '/50, Team Wave ' + game.counts.wave + '/50';
  }

  function render() {
    if (!game) { renderLobby(); return; }
    if (game.status === 'lobby') { renderLobby(); return; }
    if (game.status === 'finished') { renderWinner(); return; }
    renderStage();
  }

  function poll() {
    if (inFlight) return;
    inFlight = true;
    api('/api/cross/state')
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
    pollTimer = setInterval(poll, 900);
  }

  function joinGame(team) {
    byId('nc-lobby-error').textContent = '';
    api('/api/cross/join', { method: 'POST', body: JSON.stringify({ team: team }) })
      .then(function (data) { game = data.game; render(); })
      .catch(function (error) { byId('nc-lobby-error').textContent = error.message; });
  }

  ['sun', 'wave'].forEach(function (team) {
    byId('team-' + team).addEventListener('click', function () { teamPick = team; renderLobby(); });
  });

  byId('nc-join').addEventListener('click', function () { if (teamPick) joinGame(teamPick); });
  byId('nc-start').addEventListener('click', function () {
    api('/api/cross/start', { method: 'POST' })
      .then(function (data) { game = data.game; render(); })
      .catch(function (error) { byId('nc-lobby-error').textContent = error.message; });
  });
  byId('nc-again').addEventListener('click', function () { joinGame(game && game.myTeam ? game.myTeam : 'sun'); });

  byId('nc-board').addEventListener('click', function (event) {
    var tile = event.target.closest('.nc-tile');
    if (!tile || !game) return;
    var index = Number(tile.dataset.index);

    if (game.canPick) {
      api('/api/cross/pick', { method: 'POST', body: JSON.stringify({ cell: index, version: game.version }) })
        .then(function (data) { game = data.game; render(); })
        .catch(function (error) { toast(error.message); poll(); });
      return;
    }

    if (game.canGuess && game.phase === 'cross') {
      if (game.guessCooldown > 0) { toast('Wait a moment'); return; }
      api('/api/cross/guess', { method: 'POST', body: JSON.stringify({ cell: index }) })
        .then(function (data) {
          game = data.game;
          toast('You found it. Roles swap.');
          render();
        })
        .catch(function (error) {
          tile.classList.add('is-wrong');
          setTimeout(function () { tile.classList.remove('is-wrong'); }, 420);
          toast(error.message);
          poll();
        });
    }
  });

  function cancelHold(sendCancel) {
    if (hold.raf) cancelAnimationFrame(hold.raf);
    if (hold.tile) {
      hold.tile.classList.remove('is-holding');
      hold.tile.style.setProperty('--hold', '0');
    }
    if (sendCancel && hold.cell >= 0) {
      api('/api/cross/hold', { method: 'POST', body: JSON.stringify({ action: 'cancel' }) }).catch(function () {});
    }
    hold = { raf: null, tile: null, cell: -1, startedAt: 0, version: 0 };
  }

  function beginHold(tile, index) {
    if (!game || !game.canCross || hold.cell >= 0) return;
    api('/api/cross/hold', { method: 'POST', body: JSON.stringify({ action: 'start', cell: index }) })
      .then(function (data) {
        game = data.game;
        hold.cell = index;
        hold.tile = tile;
        hold.startedAt = performance.now();
        hold.version = game.version;
        tile.classList.add('is-holding');
        var tick = function (now) {
          var progress = Math.min(1, (now - hold.startedAt) / HOLD_MS);
          tile.style.setProperty('--hold', String(progress));
          if (progress < 1) { hold.raf = requestAnimationFrame(tick); return; }
          finishHold(index, tile);
        };
        hold.raf = requestAnimationFrame(tick);
      })
      .catch(function (error) { toast(error.message); poll(); });
  }

  function finishHold(index, tile) {
    if (hold.raf) cancelAnimationFrame(hold.raf);
    tile.classList.remove('is-holding');
    tile.style.setProperty('--hold', '0');
    var version = hold.version;
    hold = { raf: null, tile: null, cell: -1, startedAt: 0, version: 0 };
    api('/api/cross/complete', { method: 'POST', body: JSON.stringify({ cell: index, version: version }) })
      .then(function (data) { game = data.game; render(); })
      .catch(function (error) { toast(error.message); poll(); });
  }

  byId('nc-board').addEventListener('pointerdown', function (event) {
    var tile = event.target.closest('.nc-tile');
    if (!tile || !game || !game.canCross) return;
    event.preventDefault();
    beginHold(tile, Number(tile.dataset.index));
  });
  function releaseHold() { if (hold.cell >= 0) cancelHold(true); }
  byId('nc-board').addEventListener('pointerup', releaseHold);
  byId('nc-board').addEventListener('pointercancel', releaseHold);
  byId('nc-board').addEventListener('pointerleave', releaseHold);

  byId('nc-me').textContent = auth.studentName || '';
  poll();
})();
