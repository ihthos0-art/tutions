(function () {
  'use strict';

  var auth = window.LEARNFLOW_AUTH;
  if (!auth || !auth.token) return;

  var token = auth.token;
  var me = auth.studentId;
  var CELLS = 50;
  var BOXES = 50;
  var HOLD_MS = 2000;

  var game = null;
  var teamPick = null;
  var pollTimer = null;
  var inFlight = false;
  var numbersKey = null;
  var boxesKey = null;
  var hold = { raf: null, box: null, cell: -1, startedAt: 0, version: 0 };

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

  function buildNumbers(numbers) {
    var key = game.id + ':' + numbers.join(',');
    if (numbersKey === key) return;
    numbersKey = key;
    var board = byId('nc-board');
    board.replaceChildren();
    board.style.aspectRatio = '10 / 4.4';
    for (var i = 0; i < CELLS; i += 1) {
      var tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'nc-tile';
      tile.dataset.index = String(i);
      tile.textContent = String(numbers[i]);
      tile.setAttribute('aria-label', 'Number ' + numbers[i]);
      var col = i % 10;
      var row = Math.floor(i / 10);
      var left = ((col + 0.5 + (Math.random() - 0.5) * 0.5) / 10) * 100;
      var top = ((row + 0.5 + (Math.random() - 0.5) * 0.42) / 5) * 100;
      tile.style.left = Math.max(3.5, Math.min(96.5, left)).toFixed(2) + '%';
      tile.style.top = Math.max(3, Math.min(97, top)).toFixed(2) + '%';
      tile.style.setProperty('--rot', (Math.random() * 10 - 5).toFixed(1) + 'deg');
      board.appendChild(tile);
    }
  }

  function buildBoxes() {
    var key = game.id;
    if (boxesKey === key) return;
    boxesKey = key;
    var host = byId('nc-boxes');
    host.replaceChildren();
    for (var i = 0; i < BOXES; i += 1) {
      var box = document.createElement('button');
      box.type = 'button';
      box.className = 'nc-box';
      box.dataset.index = String(i);
      box.setAttribute('aria-label', 'Box ' + (i + 1));
      host.appendChild(box);
    }
  }

  function setBanner(title, help) {
    byId('nc-banner').textContent = title;
    byId('nc-help').textContent = help || '';
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
        chip.textContent = player.name;
        host.appendChild(chip);
      });
    });

    buildNumbers(game.numbers);
    buildBoxes();
    byId('nc-cover').hidden = true;
    byId('nc-countdown').hidden = true;
    document.body.classList.toggle('nc-hunting', game.myTeam === game.finderTeam);
    byId('nc-boxes-help').textContent = game.myTeam === game.pickerTeam
      ? 'Hold each box for 2 seconds to cross it.'
      : 'The other team is crossing these boxes.';
    byId('nc-boxes-help').hidden = game.phase === 'pick';

    var targetHost = byId('nc-target');
    if (game.secretNumber) {
      targetHost.hidden = false;
      byId('nc-target-number').textContent = String(game.secretNumber);
    } else {
      targetHost.hidden = true;
    }

    if (game.phase === 'pick') {
      if (game.myTeam === game.pickerTeam) {
        setBanner('Pick a secret number', 'Tap one number. Do not let them see which one.');
      } else {
        setBanner(teamName(game.pickerTeam) + ' is picking', 'Watch the board. The number will appear.');
      }
    } else if (game.phase === 'cross') {
      if (game.myTeam === game.pickerTeam) {
        setBanner('Cross boxes', 'Your number is ' + game.secretNumber + '. Hold boxes for 2 seconds.');
      } else {
        setBanner('Find ' + game.secretNumber, 'Tap that number on the board to stop them.');
      }
    }

    var guessable = Boolean(game.canGuess);
    byId('nc-board').querySelectorAll('.nc-tile').forEach(function (tile) {
      tile.classList.toggle('is-pickable', Boolean(game.canPick));
      tile.classList.toggle('is-guessable', guessable);
      tile.classList.remove('is-crossed');
    });

    var own = new Set(game.crossed[game.myTeam] || []);
    byId('nc-boxes').querySelectorAll('.nc-box').forEach(function (box) {
      box.classList.toggle('is-crossed', own.has(Number(box.dataset.index)));
    });
  }

  function renderWinner() {
    show('nc-winner');
    var winnerName = game.winner === 'sun' ? 'Team Sun' : 'Team Wave';
    byId('nc-winner-title').textContent = game.winner === game.myTeam ? 'Your team wins' : winnerName + ' wins';
    byId('nc-winner-sub').textContent =
      'Team Sun ' + game.counts.sun + '/50 boxes, Team Wave ' + game.counts.wave + '/50 boxes';
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
    if (hold.box) {
      hold.box.classList.remove('is-holding');
      hold.box.style.setProperty('--hold', '0');
    }
    if (sendCancel && hold.cell >= 0) {
      api('/api/cross/hold', { method: 'POST', body: JSON.stringify({ action: 'cancel' }) }).catch(function () {});
    }
    hold = { raf: null, box: null, cell: -1, startedAt: 0, version: 0 };
  }

  function beginHold(box, index) {
    if (!game || !game.canCross || hold.cell >= 0) return;
    if ((game.crossed[game.myTeam] || []).indexOf(index) >= 0) return;
    api('/api/cross/hold', { method: 'POST', body: JSON.stringify({ action: 'start', cell: index }) })
      .then(function (data) {
        game = data.game;
        hold.cell = index;
        hold.box = box;
        hold.startedAt = performance.now();
        hold.version = game.version;
        box.classList.add('is-holding');
        var tick = function (now) {
          var progress = Math.min(1, (now - hold.startedAt) / HOLD_MS);
          box.style.setProperty('--hold', String(progress));
          if (progress < 1) { hold.raf = requestAnimationFrame(tick); return; }
          finishHold(index, box);
        };
        hold.raf = requestAnimationFrame(tick);
      })
      .catch(function (error) { toast(error.message); poll(); });
  }

  function finishHold(index, box) {
    if (hold.raf) cancelAnimationFrame(hold.raf);
    box.classList.remove('is-holding');
    box.style.setProperty('--hold', '0');
    var version = hold.version;
    hold = { raf: null, box: null, cell: -1, startedAt: 0, version: 0 };
    api('/api/cross/complete', { method: 'POST', body: JSON.stringify({ cell: index, version: version }) })
      .then(function (data) { game = data.game; render(); })
      .catch(function (error) { toast(error.message); poll(); });
  }

  byId('nc-boxes').addEventListener('pointerdown', function (event) {
    var box = event.target.closest('.nc-box');
    if (!box || !game || !game.canCross) return;
    event.preventDefault();
    beginHold(box, Number(box.dataset.index));
  });
  function releaseHold() { if (hold.cell >= 0) cancelHold(true); }
  byId('nc-boxes').addEventListener('pointerup', releaseHold);
  byId('nc-boxes').addEventListener('pointercancel', releaseHold);
  byId('nc-boxes').addEventListener('pointerleave', releaseHold);

  byId('nc-me').textContent = auth.studentName || '';
  poll();
})();
