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
  help.textContent = 'Games for class time: Poison Challenge needs the teacher PIN.';

  var link = document.createElement('a');
  link.className = 'game-entry-link';
  link.href = '/poison';
  link.textContent = 'Poison Challenge →';

  var cross = document.createElement('a');
  cross.className = 'game-entry-link';
  cross.href = '/number-cross';
  cross.textContent = 'Find and Cross →';

  var odd = document.createElement('a');
  odd.className = 'game-entry-link';
  odd.href = '/odd-one-out';
  odd.textContent = 'Odd One Out →';

  entry.append(title, help, link, cross, odd);
  panel.append(entry);
})();
