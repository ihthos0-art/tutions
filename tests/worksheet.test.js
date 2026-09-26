const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

function worksheetParser() {
  const window = {};
  vm.runInNewContext(fs.readFileSync(path.join(root, 'public/assets/js/worksheet-template.js'), 'utf8'), { window });
  return window.LearnFlowWorksheet;
}

test('worksheet template parser detects multiple questions and alternatives', () => {
  const parser = worksheetParser();
  const result = parser.parse([
    'TITLE: Reading check',
    'SUBJECT: English',
    'TYPE: reading',
    'PASSAGE: |',
    'A fox ran home.',
    'QUESTION 1: What ran home?',
    'ANSWER 1: a fox || fox',
    'QUESTION 2: Where did it go?',
    'ANSWER 2: home'
  ].join('\n'));
  assert.equal(result.type, 'reading');
  assert.equal(result.questions.length, 2);
  assert.deepEqual(Array.from(result.questions[0].acceptedAnswers), ['a fox', 'fox']);
});

test('subject templates provide bracketed AI instructions and empty slots', () => {
  const parser = worksheetParser();
  const math = parser.templateForSubject('Math');
  const english = parser.emptyTemplate('english');
  assert.match(math, /\[AI: Replace every bracketed instruction/);
  assert.match(math, /TITLE: \[AI: Write a clear worksheet title\]/);
  assert.match(math, /SUBJECT: Math/);
  assert.match(math, /QUESTION 5: \[AI: Write question or problem 5\]/);
  assert.match(english, /SUBJECT: English/);
  assert.match(english, /PASSAGE: \|/);
  assert.throws(() => parser.parse(math), /Replace the bracketed AI placeholders/);
});

test('worker keeps worksheet answers private and checks submitted answers server-side', async () => {
  const { default: worker } = await import('../src/index.js');
  const store = new Map();
  const env = {
    ADMIN_USERNAME: 'kazi',
    ADMIN_PASSWORD: '5649',
    ADMIN_TOKEN_SECRET: 'test-secret',
    HOMEWORK: { get: async (key) => store.get(key) || null, put: async (key, value) => store.set(key, value) },
    ASSETS: { fetch: async () => new Response('asset', { status: 404 }) }
  };
  async function call(pathname, method, body, token) {
    const headers = { 'content-type': 'application/json' };
    if (token) headers.authorization = 'Bearer ' + token;
    const response = await worker.fetch(new Request('https://test.local' + pathname, {
      method, headers, body: body === undefined ? undefined : JSON.stringify(body)
    }), env);
    return { status: response.status, body: await response.json() };
  }

  const admin = await call('/api/admin/login', 'POST', { username: 'kazi', password: '5649' });
  const first = await call('/api/auth/login', 'POST', { name: 'Adnan', pin: '0000' });
  const setup = await call('/api/auth/set-pin', 'POST', { setupToken: first.body.setupToken, newPin: '2468' });
  const worksheet = {
    title: 'Quick check', subject: 'Math', type: 'math', instructions: 'Solve.',
    questions: [{ id: 'q1', prompt: '2 + 2 =', answer: '4' }, { id: 'q2', prompt: '3 + 3 =', answer: '6' }]
  };
  const scienceWorksheet = {
    title: 'Science check', subject: 'Science', type: 'reading', instructions: 'Answer.',
    questions: [{ id: 'q1', prompt: 'What do plants need?', answer: 'water' }]
  };
  const saved = await call('/api/homework/adnan', 'POST', { version: 1, assigned: { worksheets: { Math: worksheet, Science: scienceWorksheet } } }, admin.body.token);
  assert.equal(saved.status, 200);
  const studentView = await call('/api/homework/adnan', 'GET', undefined, setup.body.sessionToken);
  assert.equal(studentView.status, 200);
  assert.equal(studentView.body.content.assigned.worksheets.Math.questions[0].answer, undefined);
  assert.equal(studentView.body.content.assigned.worksheets.Science.questions[0].answer, undefined);
  const checked = await call('/api/homework/adnan/check', 'POST', { subject: 'Math', answers: { q1: '4', q2: 'wrong' } }, setup.body.sessionToken);
  assert.deepEqual([checked.status, checked.body.correct, checked.body.total], [200, 1, 2]);
  assert.match(store.get('answers:adnan'), /worksheet:Math:q1/);
});
