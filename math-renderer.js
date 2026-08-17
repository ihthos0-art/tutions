(function (root, factory) {
  var api = factory();
  root.MathRenderer = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  // Assignment content uses [[numerator/denominator]] for fractions. The token
  // is an internal data format only: this renderer creates text nodes and
  // semantic fraction elements, so students never see source markup.
  function parseFractionToken(token) {
    var slash = token.indexOf('/');
    if (slash < 1 || slash === token.length - 1) return null;
    return {
      numerator: token.slice(0, slash).trim(),
      denominator: token.slice(slash + 1).trim()
    };
  }

  function appendText(parent, value) {
    if (value) parent.appendChild(document.createTextNode(value));
  }

  function appendFraction(parent, fraction) {
    var element = document.createElement('span');
    element.className = 'math-fraction';
    element.setAttribute('role', 'math');
    element.setAttribute('aria-label', fraction.numerator + ' over ' + fraction.denominator);

    var numerator = document.createElement('span');
    numerator.className = 'math-numerator';
    numerator.textContent = fraction.numerator;

    var denominator = document.createElement('span');
    denominator.className = 'math-denominator';
    denominator.textContent = fraction.denominator;

    element.append(numerator, denominator);
    parent.appendChild(element);
  }

  function renderMath(element, source) {
    var text = String(source || '');
    var cursor = 0;
    while (cursor < text.length) {
      var opening = text.indexOf('[[', cursor);
      if (opening === -1) {
        appendText(element, text.slice(cursor));
        break;
      }
      appendText(element, text.slice(cursor, opening));
      var closing = text.indexOf(']]', opening + 2);
      if (closing === -1) {
        // Never reveal the internal delimiter if malformed content reaches the page.
        appendText(element, text.slice(opening + 2));
        break;
      }
      var fraction = parseFractionToken(text.slice(opening + 2, closing));
      if (fraction) appendFraction(element, fraction);
      else appendText(element, text.slice(opening + 2, closing));
      cursor = closing + 2;
    }
  }

  return { parseFractionToken: parseFractionToken, renderMath: renderMath };
});
