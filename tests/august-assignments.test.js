const assert = require('node:assert/strict');
const test = require('node:test');
const assignments = require('../august-assignments.js');

const forbiddenStudentMarkup = /\\(?:frac|times|div|ge|le|text)|\\[()$]/;

test('August assignments have the required independent student records and counts', () => {
  assert.equal(assignments.taha.questions.length, 140);
  assert.equal(assignments.nahid.questions.length, 100);
  assert.equal(assignments.salma.questions.length, 120);
  assert.equal(assignments.khadija.questions.length, 120);
  assert.notEqual(assignments.salma, assignments.khadija);
  assert.notEqual(assignments.salma.questions, assignments.khadija.questions);
  assert.deepEqual(assignments.salma.questions, assignments.khadija.questions);
});

test('August prompts contain no answer keys or raw student-facing math markup', () => {
  Object.values(assignments).forEach(function (assignment) {
    assignment.questions.forEach(function (question) {
      assert.equal(forbiddenStudentMarkup.test(question), false, question);
      assert.equal(question.includes('$'), false, question);
    });
  });
});

test('every fraction token is complete and has a numerator and denominator', () => {
  Object.values(assignments).forEach(function (assignment) {
    assignment.questions.forEach(function (question) {
      var tokens = question.match(/\[\[[^\]]+\]\]/g) || [];
      tokens.forEach(function (token) {
        var value = token.slice(2, -2);
        var parts = value.split('/');
        assert.equal(parts.length, 2, token);
        assert.notEqual(parts[0].trim(), '', token);
        assert.notEqual(parts[1].trim(), '', token);
      });
    });
  });
});
