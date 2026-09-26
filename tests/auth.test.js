const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

test('worker exposes the server-side student auth and admin roster contract', () => {
  const worker = fs.readFileSync(path.join(root, 'src/index.js'), 'utf8');
  assert.match(worker, /\/api\/auth\/login/);
  assert.match(worker, /\/api\/auth\/set-pin/);
  assert.match(worker, /\/api\/admin\/students/);
  assert.match(worker, /reset-pin/);
  assert.match(worker, /DEFAULT_STUDENT_PIN = '0000'/);
  assert.match(worker, /hashPin/);
  assert.doesNotMatch(worker, /ADMIN_TOKEN_SECRET\s*\|\|\s*['"]dev['"]/);
  assert.doesNotMatch(worker, /ADMIN_PASSWORD\s*=\s*['"]5649['"]/);
});

test('admin roster is not embedded in the public landing page', () => {
  const index = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');
  assert.doesNotMatch(index, /student-name|STUDENT_NAMES|<option[^>]+adnan/i);
});
