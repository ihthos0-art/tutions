const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const publicDir = path.join(root, 'public');

test('public site includes purpose, policy, and sign-in pages', () => {
  const index = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf8');
  assert.match(index, /LearnFlow/);
  assert.match(index, /Math, English, Social Studies, and Science/);
  assert.match(index, /href="login"/);
  assert.match(index, /href="privacy"/);
  assert.match(index, /href="terms"/);

  for (const page of ['about.html', 'privacy.html', 'terms.html', 'login.html']) {
    assert.ok(fs.existsSync(path.join(publicDir, page)), `${page} should exist`);
  }
});

test('student sign-in restricts PIN input to four numbers', () => {
  const login = fs.readFileSync(path.join(publicDir, 'login.html'), 'utf8');
  const script = fs.readFileSync(path.join(publicDir, 'assets/js/student-login.js'), 'utf8');
  assert.match(login, /inputmode="numeric"/);
  assert.match(login, /pattern="\[0-9\]\{4\}"/);
  assert.match(login, /maxlength="4"/);
  assert.match(script, /\/\^\\d\{4\}\$\//);
  assert.match(script, /\/api\/auth\/login/);
  assert.match(login, /id="set-pin-form"/);
  assert.match(script, /\/api\/auth\/set-pin/);
});

test('public entry points do not expose the roster or chat before sign-in', () => {
  const index = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf8');
  const login = fs.readFileSync(path.join(publicDir, 'login.html'), 'utf8');
  for (const name of ['Adnan', 'Nafis', 'Salma', 'Khadija', 'Nabila', 'Naviha']) {
    assert.doesNotMatch(index, new RegExp('>\\s*' + name + '\\s*<'));
    assert.doesNotMatch(login, new RegExp('>\\s*' + name + '\\s*<'));
  }
  assert.doesNotMatch(index, /ai-tutor\.js/);
  assert.doesNotMatch(login, /ai-tutor\.js/);
});

test('policy pages clearly state that LearnFlow is not a NYC DOE website', () => {
  for (const page of ['about.html', 'privacy.html', 'terms.html']) {
    const html = fs.readFileSync(path.join(publicDir, page), 'utf8');
    assert.match(html, /not affiliated with or endorsed by the New York City Department of Education/);
  }
});

test('student routes are lightweight dashboards, not legacy worksheet bundles', () => {
  const studentPages = ['adnan', 'ayan', 'mahiya', 'manha', 'nabila-naviha', 'nafis', 'nahid', 'salma-khadija', 'sameer', 'taha'];
  const legacyScripts = /(?:ai-generator|answers-sync|august-assignments|flashcards|homework-loader|interactive|math-renderer|quiz|tabs)\.js/;
  for (const student of studentPages) {
    const html = fs.readFileSync(path.join(publicDir, `${student}.html`), 'utf8');
    assert.match(html, /assets\/js\/assignments\.js/);
    assert.match(html, /assets\/js\/student-auth\.js/);
    assert.match(html, /student-subjects\.js/);
    assert.match(html, /assets\/js\/ai-tutor\.js/);
    assert.doesNotMatch(html, legacyScripts, `${student} still loads an archived script`);
  }
  const parent = fs.readFileSync(path.join(publicDir, 'parent.html'), 'utf8');
  assert.match(parent, /data-tab="assign-work"/);
  assert.match(parent, /id="tab-assign-work"/);
  assert.doesNotMatch(parent, /data-tab="assignments"/);
  assert.doesNotMatch(parent, /data-tab="builder"/);
  assert.match(parent, /worksheet-template-input/);
  assert.match(parent, /worksheet-copy-btn/);
  for (const subject of ['Math', 'English', 'Social Studies', 'Science']) {
    assert.match(parent, new RegExp('Copy ' + subject + ' template'));
  }
  assert.match(parent, /assets\/js\/worksheet-template\.js/);
  assert.match(parent, /id="save-assignment-btn"/);
  assert.match(parent, /assets\/js\/assignments\.js/);
  assert.match(parent, /assets\/js\/summer-games\.js/);
});

test('admin can preview the same assigned-work renderer in read-only mode', () => {
  const parent = fs.readFileSync(path.join(publicDir, 'parent.html'), 'utf8');
  const previewPage = fs.readFileSync(path.join(publicDir, 'admin-preview.html'), 'utf8');
  const previewScript = fs.readFileSync(path.join(publicDir, 'assets/js/admin-preview.js'), 'utf8');
  const studentRenderer = fs.readFileSync(path.join(publicDir, 'assets/js/student-subjects.js'), 'utf8');

  assert.match(parent, /View assigned work/);
  assert.match(parent, /id="preview-student-select"/);
  assert.match(parent, /id="student-preview-frame"/);
  assert.match(previewPage, /assets\/js\/admin-preview\.js/);
  assert.match(previewScript, /event\.origin !== window\.location\.origin/);
  assert.match(previewScript, /event\.source !== window\.parent/);
  assert.match(previewScript, /student-subjects\.js/);
  assert.match(studentRenderer, /auth\.role === 'admin' && auth\.adminPreview === true/);
  assert.match(studentRenderer, /if \(adminPreview\) answer\.disabled = true/);
  assert.match(studentRenderer, /checkButton\.disabled = adminPreview/);
});
