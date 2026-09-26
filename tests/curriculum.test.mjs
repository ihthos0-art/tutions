import assert from 'node:assert/strict';
import test from 'node:test';
import grade2 from '../content/curriculum/grade-2.json' with { type: 'json' };
import grade3 from '../content/curriculum/grade-3.json' with { type: 'json' };
import grade4 from '../content/curriculum/grade-4.json' with { type: 'json' };
import grade5 from '../content/curriculum/grade-5.json' with { type: 'json' };
import grade6 from '../content/curriculum/grade-6.json' with { type: 'json' };
import grade7 from '../content/curriculum/grade-7.json' with { type: 'json' };
import {
  checkTopicAnswers,
  curriculumMapForGrade,
  learnerTopic,
  topicForGrade
} from '../src/curriculum-data.js';
import worker from '../src/index.js';

const SUBJECTS = ['Math', 'English', 'Social Studies', 'Science'];
const PACKS = new Map([[2, grade2], [3, grade3], [4, grade4], [5, grade5], [6, grade6], [7, grade7]]);

test('grades 2–7 expose all four open subjects and every source-guide unit', () => {
  let manifestVisualCount = 0;
  for (const grade of [2, 3, 4, 5, 6, 7]) {
    const map = curriculumMapForGrade(grade);
    const pack = PACKS.get(grade);
    assert.equal(map.grade, grade);
    assert.deepEqual(Object.keys(map.subjects), SUBJECTS);
    assert.equal(pack.importAudit.sourceLineCount, pack.importAudit.accountedLineCount, `Grade ${grade} source lines must all be accounted for`);
    assert.equal(pack.importAudit.topicCount, Object.values(pack.topics).flat().length);
    manifestVisualCount += pack.importAudit.manifestVisualCount;
    for (const subject of SUBJECTS) {
      assert.equal(map.subjects[subject].length, pack.topics[subject].length, `${subject}, Grade ${grade} keeps all topics`);
      assert.ok(map.subjects[subject].length > 0, `${subject}, Grade ${grade} is available`);
      assert.ok(map.subjects[subject].every((topic) => !('locked' in topic)), `${subject}, Grade ${grade} is not locked`);
    }
  }
  assert.equal(manifestVisualCount, 71, 'all 71 checked manifest visuals are assigned to the grade packs');
  assert.deepEqual(Object.fromEntries(SUBJECTS.map((subject) => [subject, curriculumMapForGrade(6).subjects[subject].map((topic) => topic.title)])), {
    Math: [
      'Math week: equivalent ratios and unit rates',
      'Math week: unit rates and converting units',
      'Math week: area of polygons and surface area of solids'
    ],
    English: [
      'ELA week: biography, science ideas, and evidence — Beatrix Potter and lichens',
      'ELA week: read a salt-marsh article and poem together'
    ],
    'Social Studies': [
      'Social studies week: early river-valley communities',
      'Social studies week: maps, land use, and choices in Egypt’s Nile Delta',
      'Social studies week: compare belief systems through texts, places, and objects',
      'Social studies week: Han China and Rome — power, work, and “Golden Age” claims',
      'Social studies week: Sogdian merchants and the Silk Roads — routes, goods, and disruption'
    ],
    Science: [
      'Science week: cells as working systems',
      'Science week: balanced forces, motion, and a fair test',
      'Science week: Jamaica Bay food links and a changing habitat'
    ]
  });
  assert.equal(curriculumMapForGrade(9), null, 'Sameer’s Grade 9 pack is not included in this rollout');
  assert.equal(curriculumMapForGrade(11), null, 'no Grade 11 student or pack is introduced');
});

test('Salma and Khadija receive the same Grade 6 topics without peer names or answer-key leakage', async () => {
  const store = new Map();
  const env = {
    ADMIN_TOKEN_SECRET: 'test-secret',
    HOMEWORK: {
      get: async (key) => store.get(key) || null,
      put: async (key, value) => store.set(key, value)
    },
    ASSETS: { fetch: async () => new Response('asset', { status: 404 }) }
  };
  async function call(pathname, method = 'GET', body, token) {
    const headers = { 'content-type': 'application/json' };
    if (token) headers.authorization = `Bearer ${token}`;
    const response = await worker.fetch(new Request(`https://test.local${pathname}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    }), env);
    return { status: response.status, body: await response.json() };
  }
  async function signIn(name, newPin) {
    const first = await call('/api/auth/login', 'POST', { name, pin: '0000' });
    assert.equal(first.status, 200);
    const setup = await call('/api/auth/set-pin', 'POST', { setupToken: first.body.setupToken, newPin });
    assert.equal(setup.status, 200);
    return setup.body.sessionToken;
  }

  const salmaToken = await signIn('Salma', '8642');
  const salmaMap = await call('/api/curriculum/salma/map', 'GET', undefined, salmaToken);
  assert.equal(salmaMap.status, 200);
  assert.doesNotMatch(JSON.stringify(salmaMap.body), /\b(Khadija|Ayaan)\b/i);
  const topicId = 'ela-week-biography-science-ideas-and-evidence-beatrix-potter-and-lichens';
  const salmaTopic = await call(`/api/curriculum/salma/topic/${topicId}`, 'GET', undefined, salmaToken);
  assert.equal(salmaTopic.status, 200);
  assert.equal('answerKeyMarkdown' in salmaTopic.body.topic, false);
  assert.equal(salmaTopic.body.topic.questions[0].answer, undefined);
  const checked = await call(`/api/curriculum/salma/topic/${topicId}/check`, 'POST', { answers: { 'self-check': 'Ready to compare my work.' } }, salmaToken);
  assert.equal(checked.status, 200);
  assert.equal(checked.body.results[0].status, 'review');
  assert.equal(checked.body.results[0].modelAnswer, grade6.topics.English[0].answerKeyMarkdown);

  const khadijaToken = await signIn('Khadija', '9753');
  const khadijaMap = await call('/api/curriculum/khadija/map', 'GET', undefined, khadijaToken);
  assert.equal(khadijaMap.status, 200);
  assert.deepEqual(
    Object.fromEntries(SUBJECTS.map((subject) => [subject, khadijaMap.body.subjects[subject].map((topic) => topic.title)])),
    Object.fromEntries(SUBJECTS.map((subject) => [subject, salmaMap.body.subjects[subject].map((topic) => topic.title)]))
  );
  const ayanToken = await signIn('Ayan', '7531');
  const ayanMap = await call('/api/curriculum/ayan/map', 'GET', undefined, ayanToken);
  assert.equal(ayanMap.status, 200);
  assert.deepEqual(
    Object.fromEntries(SUBJECTS.map((subject) => [subject, ayanMap.body.subjects[subject].map((topic) => topic.title)])),
    Object.fromEntries(SUBJECTS.map((subject) => [subject, salmaMap.body.subjects[subject].map((topic) => topic.title)]))
  );
  const khadijaTopic = await call(`/api/curriculum/khadija/topic/${topicId}`, 'GET', undefined, khadijaToken);
  assert.equal(khadijaTopic.status, 200);
  assert.equal(khadijaMap.body.subjects.English.find((topic) => topic.id === topicId).progress, null, 'Salma’s self-check progress stays private');
  assert.equal((await call('/api/curriculum/khadija/map', 'GET', undefined, salmaToken)).status, 401);
});

test('learner topic projection preserves authored fields and exact multiline copy while hiding question keys', () => {
  const source = {
    id: 'fraction-equivalence',
    title: 'Equivalent fractions',
    subject: 'Math',
    content: 'Keep this first line exactly.\nKeep this second line, too.',
    mappedVisualNotes: { order: 2, description: 'Place the number-line image after the explanation.' },
    contentBlocks: [
      { type: 'callout', title: 'Remember', text: 'Multiply the numerator and denominator.' },
      { type: 'diagram', visual: { src: '/assets/curriculum/math/number-line.png', alt: 'Fractions on a number line' } }
    ],
    questions: [{
      id: 'q1',
      prompt: 'Which fraction is equal to one half?',
      choices: ['2/4', '2/3'],
      kind: 'short-answer',
      answer: '2/4',
      acceptedAnswers: ['2/4'],
      modelAnswer: '2/4',
      feedback: 'Compare equivalent parts.',
      scoringNotes: { correctAnswer: '2/4' },
      support: { hint: 'Multiply both terms by the same number.', answer: '2/4' }
    }]
  };
  const expected = structuredClone(source);
  for (const key of ['answer', 'acceptedAnswers', 'modelAnswer', 'feedback', 'scoringNotes']) delete expected.questions[0][key];
  delete expected.questions[0].support.answer;

  assert.deepEqual(learnerTopic(source), expected);
  assert.equal(source.content, 'Keep this first line exactly.\nKeep this second line, too.');
});

test('answer checker supports alternate question type names and only reveals samples after an attempt', () => {
  const topic = {
    questions: [
      { id: 'q1', prompt: '2 + 2', type: 'short-answer', answer: '4', acceptedAnswers: ['4', 'four'], feedback: 'Count on.' },
      { id: 'q2', prompt: 'Explain your strategy.', type: 'reflection', modelAnswer: 'I counted on two.' }
    ]
  };
  const blank = checkTopicAnswers(topic, { q1: '', q2: '' });
  assert.equal(blank.total, 1);
  assert.equal(blank.results[0].status, 'unanswered');
  assert.equal(blank.results[0].modelAnswer, undefined);

  const submitted = checkTopicAnswers(topic, { q1: 'four', q2: 'I counted on.' });
  assert.equal(submitted.correct, 1);
  assert.equal(submitted.needsReview, 1);
  assert.equal(submitted.results[0].modelAnswer, '4');
  assert.equal(submitted.results[1].status, 'review');
  assert.equal(submitted.results[1].modelAnswer, 'I counted on two.');
  assert.throws(() => checkTopicAnswers(topic, { unknown: '4' }), /unknown question/);
});

test('authenticated student study routes share grade topics but keep answer keys and progress private', async () => {
  const store = new Map();
  const env = {
    ADMIN_TOKEN_SECRET: 'test-secret',
    HOMEWORK: {
      get: async (key) => store.get(key) || null,
      put: async (key, value) => store.set(key, value)
    },
    ASSETS: { fetch: async () => new Response('asset', { status: 404 }) }
  };
  async function call(pathname, method = 'GET', body, token) {
    const headers = { 'content-type': 'application/json' };
    if (token) headers.authorization = `Bearer ${token}`;
    const response = await worker.fetch(new Request(`https://test.local${pathname}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    }), env);
    return { status: response.status, body: await response.json() };
  }
  async function signIn(name, newPin) {
    const first = await call('/api/auth/login', 'POST', { name, pin: '0000' });
    assert.equal(first.status, 200);
    const setup = await call('/api/auth/set-pin', 'POST', { setupToken: first.body.setupToken, newPin });
    assert.equal(setup.status, 200);
    return setup.body.sessionToken;
  }

  const oldMathTopics = grade4.topics.Math;
  const fixture = {
    id: 'curriculum-route-fixture',
    title: 'Mapped topic',
    subject: 'Math',
    content: 'Authored text\nkeeps its line break.',
    questions: [{ id: 'q1', prompt: 'What is 6 × 7?', answer: '42', acceptedAnswers: ['42'], feedback: 'Multiply six groups of seven.' }]
  };
  grade4.topics.Math = [fixture];
  try {
    assert.equal((await call('/api/curriculum/adnan/map')).status, 401);

    const adnanToken = await signIn('Adnan', '2468');
    const adnanMap = await call('/api/curriculum/adnan/map', 'GET', undefined, adnanToken);
    assert.equal(adnanMap.status, 200);
    assert.deepEqual(adnanMap.body.subjects.Math.map((topic) => topic.title), ['Mapped topic']);
    assert.equal('locked' in adnanMap.body.subjects.Math[0], false);

    const adnanTopic = await call('/api/curriculum/adnan/topic/curriculum-route-fixture', 'GET', undefined, adnanToken);
    assert.equal(adnanTopic.status, 200);
    assert.equal(adnanTopic.body.topic.content, fixture.content);
    assert.equal(adnanTopic.body.topic.questions[0].answer, undefined);

    const checked = await call('/api/curriculum/adnan/topic/curriculum-route-fixture/check', 'POST', { answers: { q1: '42' } }, adnanToken);
    assert.equal(checked.status, 200);
    assert.deepEqual([checked.body.correct, checked.body.total], [1, 1]);
    assert.equal(checked.body.results[0].modelAnswer, '42');

    const manhaToken = await signIn('Manha', '1357');
    const manhaMap = await call('/api/curriculum/manha/map', 'GET', undefined, manhaToken);
    assert.equal(manhaMap.status, 200);
    assert.deepEqual(manhaMap.body.subjects.Math.map((topic) => topic.title), ['Mapped topic']);
    assert.equal(manhaMap.body.subjects.Math[0].progress, null, 'another student does not inherit Adnan’s progress');
    assert.equal((await call('/api/curriculum/manha/topic/curriculum-route-fixture', 'GET', undefined, adnanToken)).status, 401);
  } finally {
    grade4.topics.Math = oldMathTopics;
  }
});
