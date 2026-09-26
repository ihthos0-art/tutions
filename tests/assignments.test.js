const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

test('assignment API has authenticated reads and protected writes', () => {
  const worker = fs.readFileSync(path.join(root, 'src/index.js'), 'utf8');
  assert.match(worker, /api\\\/assignments/);
  assert.match(worker, /request\.method === 'GET'/);
  assert.match(worker, /request\.method === 'PUT'/);
  assert.match(worker, /assignment:/);
  assert.match(worker, /canReadStudentRecord/);
  assert.match(worker, /verifyToken\(env, bearer\(request\)\)/);
});

test('assignment API validates the four supported subjects and item limits', () => {
  const worker = fs.readFileSync(path.join(root, 'src/index.js'), 'utf8');
  assert.match(worker, /const ASSIGNMENT_SUBJECTS = \['Math', 'English', 'Social Studies', 'Science'\]/);
  assert.match(worker, /raw\.items\.length > 20/);
  assert.match(worker, /invalid subject/);
});

test('assignment saves replace only the subjects being edited', async () => {
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
  const initial = await call('/api/assignments/adnan', 'PUT', {
    date: '2026-09-25',
    replaceSubjects: ['Math', 'Science'],
    items: [
      { subject: 'Math', title: 'Old math', details: 'Practice.' },
      { subject: 'Science', title: 'Science lab', details: 'Read.' }
    ]
  }, admin.body.token);
  assert.equal(initial.status, 200);
  const updated = await call('/api/assignments/adnan', 'PUT', {
    date: '2026-09-25',
    replaceSubjects: ['Math'],
    items: [{ subject: 'Math', title: 'New math', details: 'Practice.' }]
  }, admin.body.token);
  assert.equal(updated.status, 200);
  const bySubject = Object.fromEntries(updated.body.assignment.items.map((item) => [item.subject, item]));
  assert.equal(bySubject.Math.title, 'New math');
  assert.equal(bySubject.Science.title, 'Science lab');
});
