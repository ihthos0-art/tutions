(function () {
  'use strict';

  var panel = document.getElementById('assigned-panel');
  if (!panel || document.getElementById('game-entry')) return;

  var entry = document.createElement('section');
  entry.id = 'game-entry';
  entry.className = 'game-entry';

  var title = document.createElement('h3');
  title.className = 'game-entry-title';
  title.textContent = 'Game mode';

  var help = document.createElement('p');
  help.className = 'game-entry-help';
  help.textContent = 'Poison Challenge — the teacher gives out the PIN at game time.';

  var link = document.createElement('a');
  link.className = 'game-entry-link';
  link.href = '/poison';
  link.textContent = 'Poison Challenge →';

  var cross = document.createElement('a');
  cross.className = 'game-entry-link';
  cross.href = '/number-cross';
  cross.textContent = 'Find and Cross →';

  entry.append(title, help, link, cross);
  panel.append(entry);
})();
