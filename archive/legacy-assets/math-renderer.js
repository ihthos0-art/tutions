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

  function appendFraction(parent, numeratorSource, denominatorSource) {
    var element = document.createElement('span');
    element.className = 'math-fraction';
    element.setAttribute('role', 'math');
    element.setAttribute('aria-label', numeratorSource + ' over ' + denominatorSource);

    var numerator = document.createElement('span');
    numerator.className = 'math-numerator';

    var denominator = document.createElement('span');
    denominator.className = 'math-denominator';
    appendMath(numerator, numeratorSource);
    appendMath(denominator, denominatorSource);

    element.append(numerator, denominator);
    parent.appendChild(element);
  }

  function appendMath(element, source) {
    var text = String(source || '');
    var cursor = 0;
    while (cursor < text.length) {
      var simpleOpening = text.indexOf('[[', cursor);
      var complexOpening = text.indexOf('{{frac:', cursor);
      var opening = simpleOpening;
      var complex = false;
      if (complexOpening !== -1 && (simpleOpening === -1 || complexOpening < simpleOpening)) {
        opening = complexOpening;
        complex = true;
      }
      if (opening === -1) {
        appendText(element, text.slice(cursor));
        break;
      }
      appendText(element, text.slice(cursor, opening));
      var tokenStart = opening + (complex ? 7 : 2);
      var closing = text.indexOf(complex ? '}}' : ']]', tokenStart);
      if (closing === -1) {
        // Never reveal the internal delimiter if malformed content reaches the page.
        appendText(element, text.slice(tokenStart));
        break;
      }
      var token = text.slice(tokenStart, closing);
      if (complex) {
        var separator = token.indexOf('|');
        if (separator > 0 && separator < token.length - 1) {
          appendFraction(element, token.slice(0, separator), token.slice(separator + 1));
        } else {
          appendText(element, token);
        }
      } else {
        var fraction = parseFractionToken(token);
        if (fraction) appendFraction(element, fraction.numerator, fraction.denominator);
        else appendText(element, token);
      }
      cursor = closing + 2;
    }
  }

  function renderMath(element, source) {
    appendMath(element, source);
  }

  return { parseFractionToken: parseFractionToken, renderMath: renderMath };
});
