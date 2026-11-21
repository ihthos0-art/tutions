(function () {
  'use strict';

  var COLS_OF = function (n) {
    var wanted = Math.max(16, Math.ceil(n) * 8);
    var side = Math.ceil(Math.sqrt(wanted));
    return { cols: side, rows: side, cells: side * side };
  };
  var LIVES = 3;
  var ITEMS = ['🍎', '🍇', '🍒', '🍉', '🍑', '🍍', '🥝', '🍊', '🍋', '🥥', '💎', '🔮', '⭐', '🪙', '🎁', '🏆', '🐸', '🦄', '🐝', '🦋', '🐢', '🐳', '🦊', '🐼'];

  var state = null;
  var mode = 'solo';
  var count = 4;
  var names = [];
  var chosen = [];
  var turnIndex = 0;
  var item = ITEMS[0];

  function byId(id) { return document.getElementById(id); }
  function show(id) {
    ['pt-setup', 'pt-pass', 'pt-place', 'pt-play', 'pt-over'].forEach(function (node) {
      byId(node).hidden = node !== id;
    });
  }
  function toast(message) {
    var node = byId('toast');
    node.textContent = message;
    node.classList.add('is-visible');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { node.classList.remove('is-visible'); }, 1600);
  }
  function hash(text) {
    var h = 2166136261;
    for (var i = 0; i < text.length; i += 1) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function shuffle(list) {
    var out = list.slice();
    for (var i = out.length - 1; i > 0; i -= 1) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = out[i]; out[i] = out[j]; out[j] = tmp;
    }
    return out;
  }

  function renderSetup() {
    byId('pt-mode-solo').classList.toggle('is-active', mode === 'solo');
    byId('pt-mode-teams').classList.toggle('is-active', mode === 'teams');
    byId('pt-count-value').textContent = String(count);
    var host = byId('pt-names');
    var current = Array.from(host.querySelectorAll('input')).map(function (input) { return input.value; });
    host.replaceChildren();
    for (var i = 0; i < count; i += 1) {
      var input = document.createElement('input');
      input.placeholder = 'Player ' + (i + 1);
      input.maxLength = 20;
      input.value = current[i] || names[i] || '';
      input.setAttribute('aria-label', 'Player ' + (i + 1) + ' name');
      host.appendChild(input);
    }
  }

  function startGame() {
    names = Array.from(byId('pt-names').querySelectorAll('input')).map(function (input, index) {
      return (input.value || '').trim() || 'Player ' + (index + 1);
    });
    var grid = COLS_OF(names.length);
    item = ITEMS[hash(String(Date.now()) + Math.random()) % ITEMS.length];
    state = {
      mode: mode,
      cols: grid.cols,
      rows: grid.rows,
      poisons: {},
      revealed: {},
      players: names.map(function (name, index) {
        return {
          id: 'p' + index,
          name: name,
          team: mode === 'teams' ? (index % 2 === 0 ? 'sun' : 'wave') : null,
          lives: LIVES,
          eliminated: false,
          joinIndex: index
        };
      }),
      teamLives: { sun: LIVES, wave: LIVES },
      turnOrder: shuffle(names.map(function (_, index) { return 'p' + index; })),
      turnIndex: 0,
      status: 'placement',
      placeIndex: 0
    };
    chosen = [];
    renderPass();
  }

  function renderPass() {
    show('pt-pass');
    var player = state.players[state.placeIndex];
    byId('pt-pass-title').textContent = 'Pass to ' + player.name;
    byId('pt-pass-help').textContent = 'Place three poisons. Everyone else, look away.'
      + (state.mode === 'teams' ? ' Team: ' + teamName(player.team) : '');
  }

  function teamName(team) { return team === 'sun' ? 'Team Sun' : 'Team Wave'; }

  function buildBoard(host, onClick) {
    host.replaceChildren();
    host.style.setProperty('--cols', String(state.cols));
    for (var i = 0; i < state.cols * state.rows; i += 1) {
      var cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'cell';
      cell.dataset.cell = String(i);
      cell.textContent = item;
      cell.setAttribute('aria-label', 'Cell ' + (i + 1));
      cell.addEventListener('click', onClick);
      host.appendChild(cell);
    }
  }

  function renderPlace() {
    show('pt-place');
    var player = state.players[state.placeIndex];
    byId('pt-place-title').textContent = player.name + ': place 3 poisons';
    byId('pt-place-count').textContent = chosen.length + ' / 3 chosen';
    byId('pt-place-done').disabled = chosen.length !== 3;
    if (!byId('pt-board').children.length) buildBoard(byId('pt-board'), onPlaceClick);
    byId('pt-board').querySelectorAll('.cell').forEach(function (cell) {
      var index = Number(cell.dataset.cell);
      var isChosen = chosen.indexOf(index) >= 0;
      cell.className = 'cell';
      cell.textContent = item;
      if (isChosen) cell.classList.add('cell--chosen');
    });
  }

  function onPlaceClick(event) {
    var cell = event.target.closest('.cell');
    if (!cell) return;
    var index = Number(cell.dataset.cell);
    var at = chosen.indexOf(index);
    if (at >= 0) chosen.splice(at, 1);
    else if (chosen.length < 3) chosen.push(index);
    else toast('Three poisons is the max');
    renderPlace();
  }

  function submitPlacement() {
    var player = state.players[state.placeIndex];
    chosen.forEach(function (cell) {
      state.poisons[String(cell)] = (state.poisons[String(cell)] || []).concat([player.id]);
    });
    chosen = [];
    state.placeIndex += 1;
    byId('pt-board').replaceChildren();
    if (state.placeIndex < state.players.length) {
      renderPass();
      return;
    }
    state.status = 'playing';
    renderPlay();
  }

  function currentPlayer() {
    return state.players.filter(function (p) { return p.id === state.turnOrder[state.turnIndex]; })[0];
  }

  function renderPlay() {
    show('pt-play');
    var livesHost = byId('pt-lives');
    livesHost.replaceChildren();
    if (state.mode === 'teams') {
      ['sun', 'wave'].forEach(function (team) {
        var card = document.createElement('div');
        card.className = 'team-life is-' + team + (state.teamLives[team] <= 0 ? ' is-out' : '');
        var name = document.createElement('strong');
        name.textContent = teamName(team);
        var hearts = document.createElement('span');
        hearts.textContent = state.teamLives[team] > 0 ? '♥'.repeat(state.teamLives[team]) : 'out';
        card.append(name, hearts);
        livesHost.appendChild(card);
      });
    }

    var current = currentPlayer();
    var turn = byId('pt-turn');
    turn.textContent = current.name + (current.team ? ' (' + teamName(current.team) + ')' : '') + ': pick a cell';
    turn.classList.add('is-mine');

    var board = byId('pt-play-board');
    if (board.children.length !== state.cols * state.rows) buildBoard(board, onPlayClick);
    board.querySelectorAll('.cell').forEach(function (cell) {
      var index = Number(cell.dataset.cell);
      var reveal = state.revealed[String(index)];
      cell.className = 'cell';
      cell.textContent = item;
      cell.disabled = Boolean(reveal);
      if (reveal) {
        cell.classList.add('cell--revealed', reveal.hit ? 'cell--poison' : 'cell--safe');
        cell.textContent = reveal.hit ? '💥' : '✓';
      }
    });
    byId('pt-note').textContent = state.mode === 'solo'
      ? state.players.map(function (p) { return p.name + ': ' + (p.eliminated ? 'out' : '♥'.repeat(p.lives)); }).join('   ')
      : '';
  }

  function onPlayClick(event) {
    var cell = event.target.closest('.cell');
    if (!cell || state.status !== 'playing') return;
    var index = Number(cell.dataset.cell);
    if (state.revealed[String(index)]) return;
    var current = currentPlayer();
    var hit = Boolean(state.poisons[String(index)]);
    state.revealed[String(index)] = { hit: hit, by: current.id };
    if (hit) {
      if (state.mode === 'solo') {
        current.lives -= 1;
        if (current.lives <= 0) current.eliminated = true;
      } else {
        state.teamLives[current.team] = Math.max(0, state.teamLives[current.team] - 1);
        if (state.teamLives[current.team] === 0) {
          state.players.forEach(function (player) {
            if (player.team === current.team) player.eliminated = true;
          });
        }
      }
    }
    renderPlay();
    if (hit) flash(index);
    var finished = state.mode === 'solo'
      ? state.players.filter(function (p) { return !p.eliminated; }).length <= 1
      : ['sun', 'wave'].filter(function (team) { return state.teamLives[team] > 0; }).length <= 1;
    if (finished) {
      setTimeout(finish, 700);
      return;
    }
    do {
      state.turnIndex = (state.turnIndex + 1) % state.turnOrder.length;
    } while (state.players.filter(function (p) { return p.id === state.turnOrder[state.turnIndex]; })[0].eliminated);
    renderPlay();
  }

  var audioCtx = null;
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

  function flash(index) {
    playBoom();
    var cell = byId('pt-play-board').querySelector('[data-cell="' + index + '"]');
    if (cell) {
      cell.classList.add('boom');
      setTimeout(function () { cell.classList.remove('boom'); }, 750);
    }
    document.body.classList.add('shake');
    setTimeout(function () { document.body.classList.remove('shake'); }, 320);
  }

  function finish() {
    state.status = 'finished';
    show('pt-over');
    var rows;
    if (state.mode === 'solo') {
      rows = state.players.slice().sort(function (a, b) {
        return Number(a.eliminated) - Number(b.eliminated) || b.lives - a.lives || a.joinIndex - b.joinIndex;
      });
      byId('pt-winner').textContent = rows[0].name + ' wins';
    } else {
      rows = ['sun', 'wave'].map(function (team) {
        return { name: teamName(team), lives: state.teamLives[team] };
      }).sort(function (a, b) { return b.lives - a.lives; });
      byId('pt-winner').textContent = rows[0].name + ' wins';
    }
    var list = byId('pt-ranking');
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

  byId('pt-mode-solo').addEventListener('click', function () { mode = 'solo'; renderSetup(); });
  byId('pt-mode-teams').addEventListener('click', function () { mode = 'teams'; renderSetup(); });
  byId('pt-minus').addEventListener('click', function () { count = Math.max(2, count - 1); renderSetup(); });
  byId('pt-plus').addEventListener('click', function () { count = Math.min(8, count + 1); renderSetup(); });
  byId('pt-start').addEventListener('click', startGame);
  byId('pt-reveal').addEventListener('click', function () { renderPlace(); });
  byId('pt-place-done').addEventListener('click', submitPlacement);
  byId('pt-again').addEventListener('click', function () { byId('pt-board').replaceChildren(); byId('pt-play-board').replaceChildren(); show('pt-setup'); renderSetup(); });

  renderSetup();
})();
