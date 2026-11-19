(function () {
  'use strict';

  var auth = window.LEARNFLOW_AUTH;
  if (!auth || !auth.token) return;

  var token = auth.token;
  var me = auth.studentId;
  var game = null;
  var inFlight = false;
  var pollTimer = null;
  var timerHandle = null;

  function byId(id) { return document.getElementById(id); }

  function toast(message) {
    var node = byId('toast');
    node.textContent = message;
    node.classList.add('is-visible');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { node.classList.remove('is-visible'); }, 1700);
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
    ['odd-lobby', 'odd-reveal', 'odd-clues', 'odd-vote', 'odd-result'].forEach(function (id) {
      byId(id).hidden = id !== name;
    });
  }

  function mePlayer() {
    if (!game) return null;
    return game.players.filter(function (player) { return player.id === me; })[0] || null;
  }

  function renderLobby() {
    show('odd-lobby');
    var list = byId('odd-lobby-players');
    list.replaceChildren();
    var players = game ? game.players : [];
    players.forEach(function (player) {
      var li = document.createElement('li');
      if (player.id === me) li.className = 'is-me';
      li.appendChild(document.createTextNode(player.name));
      var tag = document.createElement('span');
      tag.textContent = player.id === me ? 'you' : 'joined';
      li.appendChild(tag);
      list.appendChild(li);
    });
    byId('odd-lobby-count').textContent = players.length + (players.length === 1 ? ' player' : ' players') + ' (3 to 12)';
    byId('odd-start').disabled = players.length < 3;
  }

  function renderReveal() {
    show('odd-reveal');
    var card = byId('odd-role');
    var imposter = game.myRole === 'imposter';
    card.classList.toggle('is-imposter', imposter);
    byId('odd-role-label').textContent = imposter ? 'You are the imposter' : 'You are a civilian';
    byId('odd-role-emoji').textContent = game.myEmoji || '❓';
    byId('odd-role-word').textContent = game.myWord || '';
    byId('odd-role-hint').textContent = imposter
      ? 'Your word is different. Blend in and avoid suspicion.'
      : 'Find the player whose word is different.';
    var mine = mePlayer();
    var ready = Boolean(mine && mine.ready);
    byId('odd-ready').disabled = ready;
    byId('odd-ready').textContent = ready ? 'Word seen' : 'I have seen my word';
    byId('odd-ready-count').textContent = game.readyCount + ' of ' + game.players.length + ' ready';
  }

  function renderClues() {
    show('odd-clues');
    byId('odd-first').textContent = 'Go around the group. One clue each, then vote.';
    startTimer();
  }

  function renderVote() {
    clearInterval(timerHandle);
    show('odd-vote');
    var host = byId('odd-votes');
    host.replaceChildren();
    game.players.forEach(function (player) {
      if (player.id === me) return;
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'odd-vote';
      button.dataset.target = player.id;
      button.textContent = player.name;
      if (game.myVote === player.id) button.classList.add('is-mine');
      button.disabled = Boolean(game.myVote);
      host.appendChild(button);
    });
    byId('odd-votes-cast').textContent = game.myVote
      ? 'Vote locked. ' + game.votesCast + ' of ' + game.players.length + ' voted.'
      : game.votesCast + ' of ' + game.players.length + ' voted.';
  }

  function renderResult() {
    clearInterval(timerHandle);
    show('odd-result');
    var result = game.result || {};
    byId('odd-result-title').textContent = result.caught
      ? 'The imposter was caught'
      : 'The imposter escaped';
    var words = byId('odd-result-words');
    words.replaceChildren();
    [
      { label: 'Civilians had', emoji: result.civilianEmoji, word: result.civilianWord, imposter: false },
      { label: 'Imposter had', emoji: result.imposterEmoji, word: result.imposterWord, imposter: true }
    ].forEach(function (row) {
      var card = document.createElement('div');
      card.className = 'odd-word-card' + (row.imposter ? ' is-imposter' : '');
      var label = document.createElement('span');
      label.textContent = row.label;
      var emoji = document.createElement('em');
      emoji.textContent = row.emoji || '';
      var word = document.createElement('strong');
      word.textContent = row.word || '';
      card.append(label, emoji, word);
      words.appendChild(card);
    });

    var tally = byId('odd-tally');
    tally.replaceChildren();
    var rows = Object.keys(result.tally || {}).map(function (id) {
      var player = game.players.filter(function (item) { return item.id === id; })[0];
      return { id: id, name: player ? player.name : id, votes: result.tally[id] };
    }).sort(function (a, b) { return b.votes - a.votes; });
    rows.forEach(function (row) {
      var li = document.createElement('li');
      if (row.id === result.imposterId) li.className = 'is-imposter';
      li.appendChild(document.createTextNode(row.name + (row.id === result.imposterId ? ' (imposter)' : '')));
      var count = document.createElement('span');
      count.textContent = row.votes + (row.votes === 1 ? ' vote' : ' votes');
      li.appendChild(count);
      tally.appendChild(li);
    });
  }

  function startTimer() {
    clearInterval(timerHandle);
    var tick = function () {
      var left = Math.max(0, Number(game.cluesEndsAt || 0) - Date.now());
      var node = byId('odd-timer');
      var minutes = Math.floor(left / 60000);
      var seconds = Math.floor((left % 60000) / 1000);
      node.textContent = left > 0 ? minutes + ':' + String(seconds).padStart(2, '0') : 'Time is up';
      node.classList.toggle('is-low', left > 0 && left < 30000);
    };
    tick();
    timerHandle = setInterval(tick, 500);
  }

  function render() {
    if (!game) { show('odd-lobby'); renderLobby(); return; }
    if (game.phase === 'lobby') renderLobby();
    else if (game.phase === 'reveal') renderReveal();
    else if (game.phase === 'clues') renderClues();
    else if (game.phase === 'vote') renderVote();
    else if (game.phase === 'result') renderResult();
    else renderLobby();
  }

  function poll() {
    if (inFlight) return;
    inFlight = true;
    api('/api/odd/state')
      .then(function (data) { if (data.game) game = data.game; render(); })
      .catch(function (error) { if (error.status === 401) window.location.replace('/login'); })
      .finally(function () { inFlight = false; });
  }

  function act(path, body) {
    return api(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined })
      .then(function (data) { if (data.game) game = data.game; render(); })
      .catch(function (error) { toast(error.message); poll(); });
  }

  byId('odd-start').addEventListener('click', function () { act('/api/odd/start'); });
  byId('odd-ready').addEventListener('click', function () { act('/api/odd/ready'); });
  byId('odd-go-vote').addEventListener('click', function () { act('/api/odd/start-vote'); });
  byId('odd-next').addEventListener('click', function () { act('/api/odd/next-round'); });
  byId('odd-votes').addEventListener('click', function (event) {
    var button = event.target.closest('.odd-vote');
    if (!button) return;
    act('/api/odd/vote', { target: button.dataset.target });
  });

  api('/api/odd/join', { method: 'POST' })
    .then(function (data) { game = data.game; render(); })
    .catch(function (error) {
      byId('odd-lobby-error').textContent = error.message;
      poll();
    })
    .finally(function () {
      pollTimer = setInterval(poll, 900);
    });

  byId('odd-me').textContent = auth.studentName || '';
})();
