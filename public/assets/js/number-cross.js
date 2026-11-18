(function () {
  'use strict';

  var COLS = 10;
  var ROWS = 6;
  var CELLS = COLS * ROWS;
  var HOLD_MS = 2000;
  var COUNTDOWN_MS = 3000;

  var teams = {
    sun: { name: 'Team Sun', key: 'a', crossed: new Set() },
    wave: { name: 'Team Wave', key: 'b', crossed: new Set() }
  };
  var numbers = [];
  var phase = 'pick';
  var picker = 'sun';
  var finder = 'wave';
  var target = null;
  var targetIndex = -1;
  var revealed = false;
  var hold = { raf: null, index: -1, start: 0, tile: null };
  var busy = false;

  function byId(id) { return document.getElementById(id); }

  function toast(message) {
    var node = byId('toast');
    node.textContent = message;
    node.classList.add('is-visible');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { node.classList.remove('is-visible'); }, 1600);
  }

  function shuffle(list) {
    var out = list.slice();
    for (var i = out.length - 1; i > 0; i -= 1) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = out[i]; out[i] = out[j]; out[j] = tmp;
    }
    return out;
  }

  function makeNumbers() {
    var pool = [];
    for (var n = 1; n <= 99; n += 1) pool.push(n);
    return shuffle(pool).slice(0, CELLS);
  }

  function other(team) { return team === 'sun' ? 'wave' : 'sun'; }

  function buildBoard() {
    var board = byId('nc-board');
    board.replaceChildren();
    board.style.setProperty('--cols', String(COLS));
    for (var i = 0; i < CELLS; i += 1) {
      var tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'nc-tile';
      tile.dataset.index = String(i);
      tile.textContent = String(numbers[i]);
      tile.setAttribute('aria-label', 'Number ' + numbers[i]);
      board.appendChild(tile);
    }
  }

  function findTargetIndex(teamKey) {
    for (var i = 0; i < CELLS; i += 1) {
      if (numbers[i] === target && !teams[teamKey].crossed.has(i)) return i;
    }
    return -1;
  }

  function updateScores() {
    byId('count-a').textContent = String(teams.sun.crossed.size);
    byId('count-b').textContent = String(teams.wave.crossed.size);
    byId('score-a').classList.toggle('is-active', picker === 'sun');
    byId('score-b').classList.toggle('is-active', picker === 'wave');
  }

  function renderBoard() {
    var board = byId('nc-board');
    var crossed = teams[finder].crossed;
    board.classList.toggle('is-finding', phase === 'find');
    board.querySelectorAll('.nc-tile').forEach(function (tile) {
      var index = Number(tile.dataset.index);
      var isCrossed = crossed.has(index);
      tile.classList.toggle('is-crossed', isCrossed);
      tile.disabled = phase !== 'find' && phase !== 'pick';
      tile.classList.toggle('is-pickable', phase === 'pick' && revealed && !isCrossed);
    });
  }

  function setBanner(title, help) {
    byId('nc-banner').textContent = title;
    byId('nc-help').textContent = help;
  }

  function startRound() {
    phase = 'pick';
    revealed = false;
    target = null;
    targetIndex = -1;
    busy = false;
    byId('nc-target').hidden = true;
    byId('nc-countdown').hidden = true;
    byId('nc-note').textContent = '';
    byId('nc-cover').hidden = false;
    byId('nc-cover-text').textContent = teams[finder].name + ', look away';
    byId('nc-reveal').textContent = teams[picker].name + ': show my board';
    setBanner(teams[picker].name + ' picks a number',
      teams[finder].name + ' must not look. ' + teams[picker].name + ': tap a number to set the target.');
    renderBoard();
    updateScores();
  }

  function pickNumber(index) {
    if (phase !== 'pick') return;
    if (teams[finder].crossed.has(index)) { toast('That block is already crossed'); return; }
    target = numbers[index];
    targetIndex = index;
    phase = 'countdown';
    revealed = true;
    byId('nc-cover').hidden = true;
    byId('nc-target').hidden = false;
    byId('nc-target-number').textContent = String(target);
    setBanner('Target is ' + target, 'Both teams can look now. Get ready to search.');
    renderBoard();
    countdown(3);
  }

  function countdown(n) {
    var overlay = byId('nc-countdown');
    overlay.hidden = false;
    byId('nc-countdown-number').textContent = String(n);
    if (n > 0) {
      setTimeout(function () { countdown(n - 1); }, COUNTDOWN_MS / 3);
      return;
    }
    byId('nc-countdown-number').textContent = 'GO';
    setTimeout(function () {
      overlay.hidden = true;
      beginFind();
    }, 350);
  }

  function beginFind() {
    phase = 'find';
    byId('nc-note').textContent = 'Hold the tile for 2 seconds';
    setBanner(teams[finder].name + ': find ' + target,
      'Press and hold the matching number for 2 seconds. A wrong tile shakes.');
    renderBoard();
  }

  function cancelHold() {
    if (hold.raf) cancelAnimationFrame(hold.raf);
    if (hold.tile) {
      hold.tile.classList.remove('is-holding');
      hold.tile.style.setProperty('--hold', '0');
    }
    hold = { raf: null, index: -1, start: 0, tile: null };
  }

  function beginHold(tile, index) {
    if (phase !== 'find' || busy) return;
    if (index !== findTargetIndex(finder)) {
      tile.classList.add('is-wrong');
      setTimeout(function () { tile.classList.remove('is-wrong'); }, 420);
      toast('Wrong number');
      return;
    }
    cancelHold();
    hold.index = index;
    hold.tile = tile;
    hold.start = performance.now();
    tile.classList.add('is-holding');
    var tick = function (now) {
      var progress = Math.min(1, (now - hold.start) / HOLD_MS);
      tile.style.setProperty('--hold', String(progress));
      if (progress < 1) {
        hold.raf = requestAnimationFrame(tick);
        return;
      }
      completeHold(index);
    };
    hold.raf = requestAnimationFrame(tick);
  }

  function completeHold(index) {
    busy = true;
    cancelHold();
    teams[finder].crossed.add(index);
    updateScores();
    renderBoard();
    byId('nc-note').textContent = 'Crossed ' + numbers[index] + '!';
    setBanner('Block crossed', teams[finder].name + ' crossed ' + numbers[index] + '.');
    if (teams[finder].crossed.size >= CELLS) {
      setTimeout(function () { win(finder); }, 500);
      return;
    }
    setTimeout(function () {
      var previousFinder = finder;
      finder = picker;
      picker = previousFinder;
      startRound();
    }, 1100);
  }

  function win(teamKey) {
    phase = 'win';
    byId('nc-stage').hidden = true;
    byId('nc-scores').hidden = true;
    byId('nc-winner').hidden = false;
    byId('nc-winner-title').textContent = teams[teamKey].name + ' wins';
    byId('nc-winner-sub').textContent = 'All 60 blocks crossed.';
  }

  function restart() {
    teams.sun.crossed = new Set();
    teams.wave.crossed = new Set();
    picker = 'sun';
    finder = 'wave';
    numbers = makeNumbers();
    cancelHold();
    buildBoard();
    byId('nc-winner').hidden = true;
    byId('nc-stage').hidden = false;
    byId('nc-scores').hidden = false;
    startRound();
  }

  byId('nc-reveal').addEventListener('click', function () {
    if (phase !== 'pick') return;
    revealed = true;
    byId('nc-cover').hidden = true;
    renderBoard();
  });

  byId('nc-board').addEventListener('click', function (event) {
    var tile = event.target.closest('.nc-tile');
    if (!tile) return;
    if (phase === 'pick') {
      if (!revealed) return;
      pickNumber(Number(tile.dataset.index));
    }
  });

  function holdStart(event) {
    var tile = event.target.closest('.nc-tile');
    if (!tile || phase !== 'find') return;
    event.preventDefault();
    beginHold(tile, Number(tile.dataset.index));
  }

  byId('nc-board').addEventListener('pointerdown', holdStart);
  byId('nc-board').addEventListener('pointerup', cancelHold);
  byId('nc-board').addEventListener('pointercancel', cancelHold);
  byId('nc-board').addEventListener('pointerleave', cancelHold);

  byId('nc-board').addEventListener('keydown', function (event) {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    var tile = event.target.closest('.nc-tile');
    if (!tile || phase !== 'find') return;
    event.preventDefault();
    beginHold(tile, Number(tile.dataset.index));
  });
  byId('nc-board').addEventListener('keyup', function (event) {
    if (event.key === ' ' || event.key === 'Enter') cancelHold();
  });

  byId('nc-restart').addEventListener('click', restart);

  restart();
})();
