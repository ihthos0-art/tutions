const assert = require('node:assert/strict');
const test = require('node:test');
const renderer = require('../math-renderer.js');

test('recognizes valid fraction tokens', () => {
  assert.deepEqual(renderer.parseFractionToken('3/4'), {
    numerator: '3',
    denominator: '4'
  });
  assert.deepEqual(renderer.parseFractionToken(' 10 / 9 '), {
    numerator: '10',
    denominator: '9'
  });
});

test('rejects malformed fraction tokens', () => {
  assert.equal(renderer.parseFractionToken('3'), null);
  assert.equal(renderer.parseFractionToken('/4'), null);
  assert.equal(renderer.parseFractionToken('3/'), null);
});
