(function () {
  'use strict';

  var COLS = 6;
  var ROWS = 6;
  var CELLS = COLS * ROWS;
  var LIVES = 3;
  var POISONS = 3;
  var BOT_DELAY = 950;

  var me = 'you';
  var players = [];
  var poisons = {};
  var revealed = {};
  var turnOrder = [];
  var turnIndex = 0;
  var status = 'placement';
  var chosen = [];
  var timer = null;
  var audioCtx = null;
  var gameItem = '🍎';
  var salt = 'demo';

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

  // One item for the whole board, re-rolled on every restart.
  function itemFor(salt) {
    return ITEM_POOL[hashText(String(salt)) % ITEM_POOL.length];
  }

  function byId(id) { return document.getElementById(id); }

  function show(id) {
    ['demo-placement', 'demo-play', 'demo-finished'].forEach(function (node) {
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

  function randCell() { return Math.floor(Math.random() * CELLS); }

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
      osc.frequency.setValueAtTime(190, t);
      osc.frequency.exponentialRampToValueAtTime(42, t + 0.45);
      gain.gain.setValueAtTime(0.55, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.6);
      var frames = Math.floor(audioCtx.sampleRate * 0.3);
      var buffer = audioCtx.createBuffer(1, frames, audioCtx.sampleRate);
      var data = buffer.getChannelData(0);
      for (var i = 0; i < frames; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
      var noise = audioCtx.createBufferSource();
      var ng = audioCtx.createGain();
      ng.gain.value = 0.22;
      noise.buffer = buffer;
      noise.connect(ng).connect(audioCtx.destination);
      noise.start(t);
    } catch (error) {
      console.warn('Boom sound unavailable:', error);
    }
  }

  function boom(cellIndex) {
    var cell = byId('demo-play-board').querySelector('[data-cell="' + cellIndex + '"]');
    if (cell) {
      cell.classList.add('boom');
      setTimeout(function () { cell.classList.remove('boom'); }, 750);
    }
    document.body.classList.add('shake');
    setTimeout(function () { document.body.classList.remove('shake'); }, 320);
    playBoom();
  }

  function buildBoard(host) {
    host.replaceChildren();
    host.style.setProperty('--cols', String(COLS));
    for (var i = 0; i < CELLS; i += 1) {
      var cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'cell';
      cell.dataset.cell = String(i);
      cell.setAttribute('aria-label', 'Cell ' + (i + 1));
      host.appendChild(cell);
    }
  }

  function resetGame() {
    clearTimeout(timer);
    poisons = {};
    revealed = {};
    chosen = [];
    status = 'placement';
    players = [
      { id: 'you', name: 'You', lives: LIVES, eliminated: false },
      { id: 'bot1', name: 'Bot Amina', lives: LIVES, eliminated: false },
      { id: 'bot2', name: 'Bot Rafi', lives: LIVES, eliminated: false },
      { id: 'bot3', name: 'Bot Zara', lives: LIVES, eliminated: false }
    ];
    turnOrder = players.map(function (player) { return player.id; });
    for (var i = turnOrder.length - 1; i > 0; i -= 1) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = turnOrder[i]; turnOrder[i] = turnOrder[j]; turnOrder[j] = tmp;
    }
    turnIndex = 0;

    salt = 'demo-' + Date.now() + '-' + Math.floor(Math.random() * 1e6);
    gameItem = itemFor(salt);
    Object.keys(poisons).forEach(function (key) { delete poisons[key]; });
    players.slice(1).forEach(function (bot) { placeBot(bot.id); });

    buildBoard(byId('demo-place-board'));
    buildBoard(byId('demo-play-board'));
    renderPlacement();
    show('demo-placement');
  }

  function placeBot(id) {
    var used = {};
    Object.keys(poisons).forEach(function (cell) { used[cell] = true; });
    for (var n = 0; n < POISONS; n += 1) {
      var cell = randCell();
      var guard = 0;
      while (used[String(cell)] && guard < 200) { cell = randCell(); guard += 1; }
      used[String(cell)] = true;
      poisons[String(cell)] = (poisons[String(cell)] || []).concat([id]);
    }
  }

  function renderPlacement() {
    byId('demo-place-board').querySelectorAll('.cell').forEach(function (cell) {
      var index = Number(cell.dataset.cell);
      var chosenHere = chosen.indexOf(index) >= 0;
      cell.classList.toggle('cell--chosen', chosenHere);
      cell.classList.toggle('cell--own', chosenHere);
      cell.textContent = gameItem;
    });
    byId('demo-count').textContent = chosen.length + ' / 3 chosen';
    byId('demo-place-submit').disabled = chosen.length !== 3;
  }

  function currentPlayer() {
    return players.filter(function (player) { return player.id === turnOrder[turnIndex]; })[0];
  }

  function nextTurn() {
    if (status !== 'playing') return;
    var alive = players.filter(function (player) { return !player.eliminated; });
    if (alive.length <= 1) {
      finish(alive[0] ? alive[0].id : null);
      return;
    }
    do {
      turnIndex = (turnIndex + 1) % turnOrder.length;
    } while (players.filter(function (p) { return p.id === turnOrder[turnIndex]; })[0].eliminated);
    renderPlay();
    scheduleBot();
  }

  function pick(cell) {
    if (status !== 'playing') return;
    if (revealed[String(cell)]) return;
    var current = currentPlayer();
    var owners = poisons[String(cell)] || [];
    var hit = owners.length > 0;
    if (hit) current.lives -= 1;
    if (current.lives <= 0) current.eliminated = true;
    revealed[String(cell)] = { hit: hit, by: current.id };
    renderPlay();
    if (hit) boom(cell);
    var alive = players.filter(function (player) { return !player.eliminated; });
    if (alive.length <= 1) {
      timer = setTimeout(function () { finish(alive[0] ? alive[0].id : null); }, 800);
      return;
    }
    timer = setTimeout(nextTurn, 650);
  }

  function scheduleBot() {
    if (status !== 'playing') return;
    var current = currentPlayer();
    if (!current || current.id === me) return;
    var view = byId('demo-banner');
    view.textContent = current.name + ' is thinking…';
    timer = setTimeout(function () {
      var open = [];
      for (var i = 0; i < CELLS; i += 1) if (!revealed[String(i)]) open.push(i);
      if (!open.length) return;
      pick(open[Math.floor(Math.random() * open.length)]);
    }, BOT_DELAY);
  }

  function renderPlay() {
    show('demo-play');
    var board = byId('demo-play-board');
    var current = currentPlayer();
    var mine = current && current.id === me;
    board.classList.toggle('locked', !mine);
    byId('demo-lock').hidden = mine;

    var banner = byId('demo-banner');
    if (mine) {
      banner.textContent = 'Your turn: pick a cell';
      banner.classList.add('is-mine');
    } else if (current) {
      banner.textContent = 'Waiting for ' + current.name;
      banner.classList.remove('is-mine');
    }

    board.querySelectorAll('.cell').forEach(function (cell) {
      var index = Number(cell.dataset.cell);
      var reveal = revealed[String(index)];
      cell.className = 'cell';
      cell.disabled = Boolean(reveal);
      cell.textContent = gameItem;
      if (reveal) {
        cell.classList.add(reveal.hit ? 'cell--poison' : 'cell--safe');
        if (reveal.hit) cell.textContent = '💥';
      } else if (poisons[String(index)] && poisons[String(index)].indexOf(me) >= 0) {
        cell.classList.add('cell--own');
      }
      if (mine) cell.removeAttribute('aria-disabled');
      else cell.setAttribute('aria-disabled', 'true');
    });

    var lives = byId('demo-lives');
    lives.replaceChildren();
    players.forEach(function (player) {
      var li = document.createElement('li');
      if (player.id === me) li.className = 'is-me';
      li.appendChild(document.createTextNode(player.name));
      var hearts = document.createElement('span');
      hearts.textContent = player.eliminated ? 'out' : '♥'.repeat(player.lives);
      li.appendChild(hearts);
      lives.appendChild(li);
    });
  }

  function finish(winnerId) {
    status = 'finished';
    clearTimeout(timer);
    show('demo-finished');
    var winner = players.filter(function (player) { return player.id === winnerId; })[0];
    byId('demo-winner').textContent = winner ? winner.name + ' wins!' : 'Everyone is out.';
    var ordered = players.slice().sort(function (a, b) {
      return Number(a.eliminated) - Number(b.eliminated) || b.lives - a.lives;
    });
    var list = byId('demo-leaderboard');
    list.replaceChildren();
    ordered.forEach(function (player) {
      var li = document.createElement('li');
      li.appendChild(document.createTextNode(player.name));
      var span = document.createElement('span');
      span.textContent = player.eliminated ? 'out' : player.lives + ' lives left';
      li.appendChild(span);
      list.appendChild(li);
    });
  }

  byId('demo-place-board').addEventListener('click', function (event) {
    var cell = event.target.closest('.cell');
    if (!cell || status !== 'placement') return;
    var index = Number(cell.dataset.cell);
    var at = chosen.indexOf(index);
    if (at >= 0) chosen.splice(at, 1);
    else if (chosen.length < POISONS) chosen.push(index);
    else toast('You already chose 3 poisons');
    renderPlacement();
  });

  byId('demo-place-submit').addEventListener('click', function () {
    if (chosen.length !== POISONS) return;
    chosen.forEach(function (cell) {
      poisons[String(cell)] = (poisons[String(cell)] || []).concat([me]);
    });
    status = 'playing';
    renderPlay();
    scheduleBot();
  });

  byId('demo-play-board').addEventListener('click', function (event) {
    var cell = event.target.closest('.cell');
    if (!cell || cell.disabled) return;
    var current = currentPlayer();
    if (!current || current.id !== me) { toast('Not your turn'); return; }
    pick(Number(cell.dataset.cell));
  });

  byId('demo-restart').addEventListener('click', resetGame);

  resetGame();
})();
