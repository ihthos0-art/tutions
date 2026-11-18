(function () {
  'use strict';

  var COLS = 10;
  var ROWS = 6;
  var CELLS = COLS * ROWS;
  var HOLD_MS = 2000;
  var COUNTDOWN_MS = 3000;
  var BOT_PICK_MS = 1400;
  var BOT_SEARCH_MIN = 900;
  var BOT_SEARCH_MAX = 2100;

  var MODE = 'bots';
  var teams = {
    sun: { name: 'Team Sun', key: 'a', crossed: new Set(), members: ['You', 'Mia', 'Leo'], active: 0 },
    wave: { name: 'Team Wave', key: 'b', crossed: new Set(), members: ['Ava', 'Noah', 'Zoe'], active: 0 }
  };
  var numbers = [];
  var phase = 'pick';
  var picker = 'sun';
  var finder = 'wave';
  var target = null;
  var revealed = false;
  var hold = { raf: null, index: -1, start: 0, tile: null };
  var busy = false;
  var timers = [];

  function byId(id) { return document.getElementById(id); }

  function later(fn, ms) {
    var id = setTimeout(fn, ms);
    timers.push(id);
    return id;
  }

  function clearTimers() {
    timers.forEach(function (id) { clearTimeout(id); });
    timers = [];
  }

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

  function teamName(key) {
    if (MODE === 'hot') return teams[key].name;
    return teams[key].name + ' (' + teams[key].members.length + ')';
  }

  function activeMember(key) {
    return teams[key].members[teams[key].active % teams[key].members.length];
  }

  function buildBoard() {
    var board = byId('nc-board');
    board.replaceChildren();
    for (var i = 0; i < CELLS; i += 1) {
      var tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'nc-tile';
      tile.dataset.index = String(i);
      tile.textContent = String(numbers[i]);
      tile.setAttribute('aria-label', 'Number ' + numbers[i]);
      // Scatter inside a loose 10x6 zone grid with jitter, so numbers never
      // overlap but never read as rows and columns either.
      var col = i % COLS;
      var row = Math.floor(i / COLS);
      var left = ((col + 0.12 + Math.random() * 0.76) / COLS) * 100;
      var top = ((row + 0.14 + Math.random() * 0.72) / ROWS) * 100;
      tile.style.left = Math.max(4, Math.min(96, left)).toFixed(2) + '%';
      tile.style.top = Math.max(4, Math.min(96, top)).toFixed(2) + '%';
      tile.style.setProperty('--rot', (Math.random() * 16 - 8).toFixed(1) + 'deg');
      board.appendChild(tile);
    }
  }

  function tileAt(index) {
    return byId('nc-board').querySelector('[data-index="' + index + '"]');
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

    ['sun', 'wave'].forEach(function (key) {
      var host = byId(key === 'sun' ? 'members-a' : 'members-b');
      host.replaceChildren();
      if (MODE === 'hot') return;
      teams[key].members.forEach(function (name, index) {
        var chip = document.createElement('span');
        chip.className = 'nc-member';
        var isActive = index === teams[key].active % teams[key].members.length;
        if (isActive) chip.classList.add(key === picker ? 'is-picking' : 'is-searching');
        chip.textContent = name;
        host.appendChild(chip);
      });
    });
  }

  function renderBoard() {
    var board = byId('nc-board');
    var crossed = teams[finder].crossed;
    board.classList.toggle('is-finding', phase === 'find');
    board.querySelectorAll('.nc-tile').forEach(function (tile) {
      var index = Number(tile.dataset.index);
      var isCrossed = crossed.has(index);
      tile.classList.toggle('is-crossed', isCrossed);
      tile.disabled = phase === 'countdown';
      tile.classList.toggle('is-pickable', phase === 'pick' && revealed && !isCrossed);
    });
  }

  function setBanner(title, help) {
    byId('nc-banner').textContent = title;
    byId('nc-help').textContent = help;
  }

  function startRound() {
    clearTimers();
    cancelHold();
    phase = 'pick';
    revealed = false;
    target = null;
    busy = false;
    byId('nc-target').hidden = true;
    byId('nc-countdown').hidden = true;
    byId('nc-note').textContent = '';
    updateScores();

    var botPicking = MODE === 'bots' && picker === 'wave';
    byId('nc-cover').hidden = false;
    byId('nc-cover-text').textContent = botPicking
      ? teamName('wave') + ' is picking'
      : teamName('finder') + ', look away';
    byId('nc-reveal').textContent = teamName(picker) + ': show my board';
    byId('nc-reveal').hidden = botPicking;

    if (botPicking) {
      setBanner('Team Wave is picking', 'Team Wave chooses what you must find. Get ready.');
      renderBoard();
      later(botPick, BOT_PICK_MS);
      return;
    }

    setBanner(teamName(picker) + ' picks a number',
      (MODE === 'bots' ? 'Your team taps a number for the bots to find.' : teamName('finder') + ' must not look.'));
    renderBoard();
  }

  function botPick() {
    var open = [];
    for (var i = 0; i < CELLS; i += 1) {
      if (!teams[finder].crossed.has(i)) open.push(i);
    }
    if (!open.length) return;
    revealed = true;
    pickNumber(open[Math.floor(Math.random() * open.length)]);
  }

  function pickNumber(index) {
    if (phase !== 'pick') return;
    if (teams[finder].crossed.has(index)) { toast('That block is already crossed'); return; }
    target = numbers[index];
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
      later(function () { countdown(n - 1); }, COUNTDOWN_MS / 3);
      return;
    }
    byId('nc-countdown-number').textContent = 'GO';
    later(function () {
      overlay.hidden = true;
      beginFind();
    }, 350);
  }

  function beginFind() {
    phase = 'find';
    byId('nc-note').textContent = MODE === 'bots' && finder === 'wave'
      ? activeMember('wave') + ' is searching'
      : 'Hold the tile for 2 seconds';
    setBanner(teamName(finder) + ': find ' + target,
      MODE === 'bots' && finder === 'wave'
        ? 'Watch Team Wave search.'
        : 'Press and hold the matching number for 2 seconds. A wrong tile shakes.');
    renderBoard();
    if (MODE === 'bots' && finder === 'wave') scheduleBotSearch();
  }

  function scheduleBotSearch() {
    var delay = BOT_SEARCH_MIN + Math.random() * (BOT_SEARCH_MAX - BOT_SEARCH_MIN);
    if (Math.random() < 0.35) {
      later(function () {
        var openWrong = [];
        for (var w = 0; w < CELLS; w += 1) {
          if (!teams.wave.crossed.has(w) && numbers[w] !== target) openWrong.push(w);
        }
        var wrong = openWrong[Math.floor(Math.random() * openWrong.length)];
        var tile = tileAt(wrong);
        if (tile) {
          tile.classList.add('is-wrong');
          later(function () { tile.classList.remove('is-wrong'); }, 420);
        }
        byId('nc-note').textContent = activeMember('wave') + ' guessed ' + numbers[wrong];
        later(searchCorrectly, 700);
      }, delay);
      return;
    }
    later(searchCorrectly, delay);
  }

  function searchCorrectly() {
    if (phase !== 'find') return;
    var index = findTargetIndex('wave');
    var tile = tileAt(index);
    if (!tile) return;
    byId('nc-note').textContent = activeMember('wave') + ' found ' + target;
    beginHold(tile, index);
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
      later(function () { tile.classList.remove('is-wrong'); }, 420);
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
    teams[finder].active += 1;
    updateScores();
    renderBoard();
    byId('nc-note').textContent = 'Crossed ' + numbers[index] + '!';
    setBanner('Block crossed', teamName(finder) + ' crossed ' + numbers[index] + '.');
    if (teams[finder].crossed.size >= CELLS) {
      later(function () { win(finder); }, 500);
      return;
    }
    later(function () {
      var previousFinder = finder;
      finder = picker;
      picker = previousFinder;
      startRound();
    }, 1100);
  }

  function win(teamKey) {
    phase = 'win';
    clearTimers();
    byId('nc-stage').hidden = true;
    byId('nc-scores').hidden = true;
    byId('nc-winner').hidden = false;
    byId('nc-winner-title').textContent = teams[teamKey].name + ' wins';
    byId('nc-winner-sub').textContent = 'All 60 blocks crossed.';
  }

  function restart() {
    clearTimers();
    teams.sun.crossed = new Set();
    teams.wave.crossed = new Set();
    teams.sun.active = 0;
    teams.wave.active = 0;
    picker = 'sun';
    finder = 'wave';
    numbers = makeNumbers();
    buildBoard();
    byId('nc-winner').hidden = true;
    byId('nc-stage').hidden = false;
    byId('nc-scores').hidden = false;
    document.querySelector('.game-player').textContent = MODE === 'bots'
      ? 'Bot demo, 3 vs 3'
      : 'Hot seat, two teams';
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
    if (!tile || phase !== 'pick' || !revealed) return;
    pickNumber(Number(tile.dataset.index));
  });

  function holdStart(event) {
    var tile = event.target.closest('.nc-tile');
    if (!tile || phase !== 'find') return;
    if (MODE === 'bots' && finder === 'wave') return;
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
    if (MODE === 'bots' && finder === 'wave') return;
    event.preventDefault();
    beginHold(tile, Number(tile.dataset.index));
  });
  byId('nc-board').addEventListener('keyup', function (event) {
    if (event.key === ' ' || event.key === 'Enter') cancelHold();
  });

  byId('nc-restart').addEventListener('click', restart);

  function setMode(mode) {
    MODE = mode;
    byId('mode-bots').classList.toggle('is-active', mode === 'bots');
    byId('mode-hot').classList.toggle('is-active', mode === 'hot');
    restart();
  }
  byId('mode-bots').addEventListener('click', function () { setMode('bots'); });
  byId('mode-hot').addEventListener('click', function () { setMode('hot'); });

  restart();
})();
