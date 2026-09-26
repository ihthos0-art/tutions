// Provider chain — tries each in order until one succeeds
// All use OpenAI-compatible /chat/completions format
import { gradeFor, mergeProgress, sanitizeProgress } from './progress.js';

const PROVIDERS = [
  {
    name: 'groq',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.3-70b-versatile',
    keyEnv: 'GROQ_API_KEY'
  },
  {
    name: 'groq-fast',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.1-8b-instant',
    keyEnv: 'GROQ_API_KEY'
  },
  {
    name: 'cerebras',
    url: 'https://api.cerebras.ai/v1/chat/completions',
    model: 'llama-3.3-70b',
    keyEnv: 'CEREBRAS_API_KEY'
  },
  {
    name: 'mistral',
    url: 'https://api.mistral.ai/v1/chat/completions',
    model: 'mistral-small-latest',
    keyEnv: 'MISTRAL_API_KEY'
  },
  {
    name: 'openrouter',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'meta-llama/llama-3.1-8b-instruct:free',
    keyEnv: 'OPENROUTER_API_KEY'
  },
  {
    name: 'cohere',
    url: 'https://api.cohere.ai/compatibility/v1/chat/completions',
    model: 'command-r-plus',
    keyEnv: 'COHERE_API_KEY'
  }
];

async function tryProvider(provider, apiKey, body) {
  const res = await fetch(provider.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey,
      'HTTP-Referer': 'https://tutions.ihthos0-art.workers.dev',
      'X-Title': 'NYC Tutoring Center'
    },
    body: JSON.stringify({
      model: provider.model,
      messages: body.messages,
      temperature: body.temperature || 0.7,
      max_tokens: body.max_tokens || 1024
    })
  });
  const data = await res.json();
  const ok = res.ok && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  return { ok, data, provider: provider.name + '/' + provider.model };
}

// ---- Shared helpers ----
const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS'
};

function json(obj, status = 200, extra = {}) {
  return new Response(JSON.stringify(obj), { status, headers: { ...JSON_HEADERS, ...extra } });
}

const STUDENT_ROSTER = [
  { id: 'adnan', name: 'Adnan', grade: 4, route: 'adnan' },
  { id: 'nafis', name: 'Nafis', grade: 7, route: 'nafis' },
  { id: 'salma', name: 'Salma', grade: 6, route: 'salma-khadija', query: 'student=salma' },
  { id: 'khadija', name: 'Khadija', grade: 6, route: 'salma-khadija', query: 'student=khadija' },
  { id: 'nahid', name: 'Nahid', grade: 3, route: 'nahid' },
  { id: 'taha', name: 'Taha', grade: 5, route: 'taha' },
  { id: 'ayan', name: 'Ayan', grade: 6, route: 'ayan' },
  { id: 'sameer', name: 'Sameer', grade: 9, route: 'sameer' },
  { id: 'manha', name: 'Manha', grade: 4, route: 'manha' },
  { id: 'mahiya', name: 'Mahiya', grade: 2, route: 'mahiya' },
  { id: 'nabila', name: 'Nabila', grade: 2, route: 'nabila-naviha', query: 'student=nabila' },
  { id: 'naviha', name: 'Naviha', grade: 2, route: 'nabila-naviha', query: 'student=naviha' }
];
const STUDENT_IDS = STUDENT_ROSTER.map((student) => student.id).concat(['nabila-naviha', 'salma-khadija']);
const DEFAULT_STUDENT_PIN = '0000';
function validStudent(id) { return STUDENT_IDS.includes(id); }
function studentByName(value) {
  const normalized = String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();
  return STUDENT_ROSTER.find((student) => student.name.toLowerCase() === normalized || student.id === normalized) || null;
}

const ASSIGNMENT_SUBJECTS = ['Math', 'English', 'Social Studies', 'Science'];
function assignmentField(value, field, max) {
  if (value == null) return '';
  if (typeof value !== 'string' || value.length > max) throw new Error(field + ' is invalid');
  return value.trim();
}
function normalizeAssignment(raw, student) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('assignment must be an object');
  if (!Array.isArray(raw.items) || raw.items.length > 20) throw new Error('assignment items must be an array with at most 20 items');
  const date = assignmentField(raw.date, 'date', 30);
  const dueDate = assignmentField(raw.dueDate, 'dueDate', 30);
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('date must use YYYY-MM-DD');
  if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) throw new Error('dueDate must use YYYY-MM-DD');
  const note = assignmentField(raw.note, 'note', 800);
  const items = raw.items.map((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error('assignment item ' + (index + 1) + ' is invalid');
    if (!ASSIGNMENT_SUBJECTS.includes(item.subject)) throw new Error('assignment item ' + (index + 1) + ' has an invalid subject');
    const title = assignmentField(item.title, 'assignment title', 120);
    const details = assignmentField(item.details, 'assignment details', 800);
    const link = assignmentField(item.link, 'assignment link', 500);
    if (!title && !details && !link) throw new Error('assignment item ' + (index + 1) + ' is empty');
    if (link) {
      let url;
      try { url = new URL(link, 'https://learnflow.invalid'); } catch { throw new Error('assignment link ' + (index + 1) + ' is invalid'); }
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('assignment link ' + (index + 1) + ' must use http or https');
    }
    return {
      id: assignmentField(item.id, 'assignment id', 80) || (item.subject.toLowerCase().replace(/\s+/g, '-') + '-' + (index + 1)),
      subject: item.subject,
      title,
      details,
      link
    };
  });
  return { version: 1, student, date, dueDate, note, items, updatedAt: new Date().toISOString() };
}

function assignmentReplacementSubjects(raw) {
  if (!Array.isArray(raw)) return ASSIGNMENT_SUBJECTS.slice();
  if (raw.some((subject) => !ASSIGNMENT_SUBJECTS.includes(subject))) throw new Error('replaceSubjects contains an invalid subject');
  const subjects = raw.filter((subject, index) => ASSIGNMENT_SUBJECTS.includes(subject) && raw.indexOf(subject) === index);
  return subjects;
}

function mergeAssignment(existing, incoming, replaceSubjects, student) {
  const replace = new Set(replaceSubjects);
  const preservedItems = existing && Array.isArray(existing.items)
    ? existing.items.filter((item) => !replace.has(item.subject))
    : [];
  const replacementItems = incoming.items.filter((item) => replace.has(item.subject));
  return normalizeAssignment({ ...incoming, items: preservedItems.concat(replacementItems) }, student);
}

const WORKSHEET_TYPES = ['math', 'reading', 'ela'];
function worksheetText(value, field, max) {
  if (value == null) return '';
  if (typeof value !== 'string' || value.length > max) throw new Error(field + ' is invalid');
  return value.trim();
}
function worksheetSourceUrl(value, field) {
  const text = worksheetText(value, field, 600);
  if (!text) return '';
  let url;
  try { url = new URL(text); } catch { throw new Error(field + ' must be a valid HTTPS URL'); }
  if (url.protocol !== 'https:') throw new Error(field + ' must be a valid HTTPS URL');
  return url.href;
}
function normalizeWorksheetExamples(raw) {
  if (raw == null) return [];
  if (!Array.isArray(raw) || raw.length > 4) throw new Error('worked examples must be an array with at most 4 examples');
  return raw.map((example, index) => {
    if (!example || typeof example !== 'object' || Array.isArray(example)) throw new Error('worked example ' + (index + 1) + ' is invalid');
    if (!Array.isArray(example.steps) || example.steps.length < 1 || example.steps.length > 8) throw new Error('worked example ' + (index + 1) + ' needs 1 to 8 steps');
    return {
      title: worksheetText(example.title, 'worked example title', 140),
      steps: example.steps.map((step) => worksheetText(step, 'worked example step', 500))
    };
  });
}
function normalizeWorksheetVisuals(raw) {
  if (raw == null) return [];
  if (!Array.isArray(raw) || raw.length > 5) throw new Error('visuals must be an array with at most 5 figures');
  return raw.map((visual, index) => {
    if (!visual || typeof visual !== 'object' || Array.isArray(visual)) throw new Error('visual ' + (index + 1) + ' is invalid');
    const src = worksheetText(visual.src, 'visual path', 180);
    if (!/^\/assets\/curriculum\/[a-z0-9][a-z0-9._-]{0,150}$/i.test(src)) throw new Error('visual path must reference a local curriculum asset');
    const alt = worksheetText(visual.alt, 'visual alt text', 400);
    if (!alt) throw new Error('visual needs descriptive alt text');
    return {
      src,
      alt,
      caption: worksheetText(visual.caption, 'visual caption', 600),
      credit: worksheetText(visual.credit, 'visual credit', 300),
      sourceUrl: worksheetSourceUrl(visual.sourceUrl, 'visual source URL')
    };
  });
}
function normalizeWorksheetSources(raw) {
  if (raw == null) return [];
  if (!Array.isArray(raw) || raw.length > 8) throw new Error('sources must be an array with at most 8 entries');
  return raw.map((source, index) => {
    if (!source || typeof source !== 'object' || Array.isArray(source)) throw new Error('source ' + (index + 1) + ' is invalid');
    const title = worksheetText(source.title, 'source title', 160);
    const url = worksheetSourceUrl(source.url, 'source URL');
    if (!title || !url) throw new Error('source ' + (index + 1) + ' needs a title and HTTPS URL');
    return {
      title,
      url
    };
  });
}
function normalizeWorksheet(raw, student) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('worksheet must be an object');
  const type = worksheetText(raw.type, 'worksheet type', 20).toLowerCase();
  if (!WORKSHEET_TYPES.includes(type)) throw new Error('worksheet type must be math, reading, or ela');
  const subjectKey = worksheetText(raw.subject, 'worksheet subject', 40).toLowerCase();
  const subject = ASSIGNMENT_SUBJECTS.find((item) => item.toLowerCase() === subjectKey) || (subjectKey === 'ela' ? 'English' : '');
  if (!subject) throw new Error('worksheet subject is invalid');
  if (!Array.isArray(raw.questions) || raw.questions.length < 1 || raw.questions.length > 100) throw new Error('worksheet needs 1 to 100 questions');
  const questions = raw.questions.map((question, index) => {
    if (!question || typeof question !== 'object' || Array.isArray(question)) throw new Error('worksheet question ' + (index + 1) + ' is invalid');
    const prompt = worksheetText(question.prompt, 'worksheet question', 1200);
    const answer = worksheetText(question.answer, 'worksheet answer', 500);
    if (!prompt || !answer) throw new Error('worksheet question ' + (index + 1) + ' needs a prompt and answer');
    const acceptedAnswers = Array.isArray(question.acceptedAnswers) && question.acceptedAnswers.length
      ? question.acceptedAnswers.map((item) => worksheetText(item, 'accepted answer', 500)).filter(Boolean)
      : [answer];
    return {
      id: worksheetText(question.id, 'worksheet question id', 80) || ('q' + (index + 1)),
      prompt,
      answer,
      acceptedAnswers: acceptedAnswers.length ? acceptedAnswers : [answer]
    };
  });
  return {
    version: 1,
    format: 'learnflow-worksheet-v1',
    student,
    title: worksheetText(raw.title, 'worksheet title', 160) || 'Assigned practice',
    subject,
    type,
    instructions: worksheetText(raw.instructions, 'worksheet instructions', 1200),
    passage: worksheetText(raw.passage, 'worksheet passage', 12000),
    explanation: worksheetText(raw.explanation, 'worksheet explanation', 8000),
    workedExamples: normalizeWorksheetExamples(raw.workedExamples),
    visuals: normalizeWorksheetVisuals(raw.visuals),
    modelTask: worksheetText(raw.modelTask, 'worksheet model task', 1600),
    scopeNote: worksheetText(raw.scopeNote, 'worksheet scope note', 800),
    sources: normalizeWorksheetSources(raw.sources),
    questions,
    updatedAt: new Date().toISOString()
  };
}
function normalizeWorksheetMap(raw, student) {
  if (raw == null) return {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('worksheets must be an object');
  const worksheets = {};
  Object.entries(raw).forEach(([key, value]) => {
    const subjectKey = String(key).trim().toLowerCase();
    const subject = ASSIGNMENT_SUBJECTS.find((item) => item.toLowerCase() === subjectKey);
    if (!subject) throw new Error('worksheet subject is invalid');
    worksheets[subject] = normalizeWorksheet(value, student);
  });
  return worksheets;
}
function normalizeAssignedWorksheets(assigned, student) {
  if (!assigned || typeof assigned !== 'object' || Array.isArray(assigned)) return {};
  const worksheets = normalizeWorksheetMap(assigned.worksheets, student);
  if (assigned.worksheet) {
    const legacy = normalizeWorksheet(assigned.worksheet, student);
    if (!worksheets[legacy.subject]) worksheets[legacy.subject] = legacy;
  }
  return worksheets;
}
function stripWorksheetAnswers(value) {
  if (Array.isArray(value)) return value.map(stripWorksheetAnswers);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => key !== 'answer' && key !== 'acceptedAnswers')
    .map(([key, item]) => [key, stripWorksheetAnswers(item)]));
}
function normalizedAnswer(value) {
  return String(value == null ? '' : value).trim().replace(/\s+/g, ' ').toLowerCase().replace(/,/g, '');
}
function checkWorksheet(worksheet, submitted) {
  const answers = submitted && typeof submitted === 'object' && !Array.isArray(submitted) ? submitted : {};
  const results = worksheet.questions.map((question) => {
    const value = worksheetText(answers[question.id], 'submitted answer', 1000);
    const correct = question.acceptedAnswers.some((answer) => normalizedAnswer(answer) === normalizedAnswer(value));
    return { id: question.id, correct };
  });
  return { total: results.length, correct: results.filter((result) => result.correct).length, results };
}

// ---- HMAC-signed admin token (8h, no DB needed) ----
function b64url(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
async function hmac(secret, data) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return b64url(sig);
}
async function makeSignedToken(env, claims, ttlMs = 1000 * 60 * 60 * 8) {
  if (!env.ADMIN_TOKEN_SECRET) throw new Error('ADMIN_TOKEN_SECRET is not configured');
  const payload = b64url(new TextEncoder().encode(JSON.stringify({ ...claims, exp: Date.now() + ttlMs })));
  const sig = await hmac(env.ADMIN_TOKEN_SECRET, payload);
  return payload + '.' + sig;
}
async function readSignedToken(env, token) {
  if (!token || !env.ADMIN_TOKEN_SECRET) return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  const expected = await hmac(env.ADMIN_TOKEN_SECRET, payload);
  if (sig !== expected) return false;
  try {
    const claims = JSON.parse(new TextDecoder().decode(
      Uint8Array.from(atob(payload.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
    ));
    return Date.now() < claims.exp ? claims : false;
  } catch { return false; }
}
async function makeToken(env) { return makeSignedToken(env, { role: 'admin' }); }
async function verifyToken(env, token) {
  const claims = await readSignedToken(env, token);
  return Boolean(claims && claims.role === 'admin');
}
async function hashPin(pin) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pin));
  return b64url(digest);
}
async function studentSession(env, student) {
  return makeSignedToken(env, { role: 'student', student: student.id });
}
async function studentSetupToken(env, student) {
  return makeSignedToken(env, { purpose: 'student-pin-setup', student: student.id }, 1000 * 60 * 15);
}
function studentResponse(student, sessionToken) {
  return {
    ok: true,
    role: 'student',
    studentId: student.id,
    studentName: student.name,
    studentGrade: student.grade,
    route: student.route,
    query: student.query || '',
    sessionToken
  };
}
function bearer(request) {
  const h = request.headers.get('Authorization') || '';
  return h.startsWith('Bearer ') ? h.slice(7) : '';
}
async function canReadStudentRecord(env, request, studentId) {
  const claims = await readSignedToken(env, bearer(request));
  return Boolean(claims && (claims.role === 'admin' || (claims.role === 'student' && claims.student === studentId)));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') return new Response(null, { headers: JSON_HEADERS });

    // ---- SHARED LOGIN: admin or student ----
    if (url.pathname === '/api/auth/login' && request.method === 'POST') {
      if (!env.ADMIN_TOKEN_SECRET) return json({ error: 'Sign-in service is not configured yet.' }, 503);
      const body = await request.json().catch(() => ({}));
      const name = String(body.name || '').trim().replace(/\s+/g, ' ');
      const pin = String(body.pin || '').trim();
      if (!name || !/^\d{4}$/.test(pin)) return json({ error: 'Enter a name and a four-number PIN.' }, 400);

      const configuredAdmin = String(env.ADMIN_USERNAME || '').trim();
      if (configuredAdmin && name.toLowerCase() === configuredAdmin.toLowerCase() && pin === String(env.ADMIN_PASSWORD || '')) {
        return json({ ok: true, role: 'admin', sessionToken: await makeToken(env) });
      }

      const student = studentByName(name);
      if (!student) return json({ error: 'We could not match that name. Ask your administrator for help.' }, 401);
      if (!env.HOMEWORK) return json({ error: 'Sign-in service is not configured yet.' }, 503);
      const raw = await env.HOMEWORK.get('auth:student:' + student.id);
      let record = null;
      if (raw) {
        try { record = JSON.parse(raw); } catch { return json({ error: 'Stored student account is invalid.' }, 500); }
      }

      if (!record) {
        if (pin !== DEFAULT_STUDENT_PIN) return json({ error: 'That PIN is not correct.' }, 401);
        return json({ ok: true, role: 'student', firstLogin: true, setupToken: await studentSetupToken(env, student) });
      }

      const matches = record.pinHash && record.pinHash === await hashPin(pin);
      if (!matches) return json({ error: 'That PIN is not correct.' }, 401);
      if (record.mustChange) {
        return json({ ok: true, role: 'student', firstLogin: true, setupToken: await studentSetupToken(env, student) });
      }
      return json(studentResponse(student, await studentSession(env, student)));
    }

    // ---- FIRST-LOGIN PIN SETUP ----
    if (url.pathname === '/api/auth/set-pin' && request.method === 'POST') {
      if (!env.ADMIN_TOKEN_SECRET) return json({ error: 'Sign-in service is not configured yet.' }, 503);
      const body = await request.json().catch(() => ({}));
      const setup = await readSignedToken(env, body.setupToken);
      const newPin = String(body.newPin || '').trim();
      if (!setup || setup.purpose !== 'student-pin-setup') return json({ error: 'This PIN setup link has expired. Start again.' }, 401);
      if (!/^\d{4}$/.test(newPin) || newPin === DEFAULT_STUDENT_PIN) return json({ error: 'Choose a new four-number PIN other than 0000.' }, 400);
      const student = STUDENT_ROSTER.find((item) => item.id === setup.student);
      if (!student || !env.HOMEWORK) return json({ error: 'Sign-in service is not configured yet.' }, 503);
      await env.HOMEWORK.put('auth:student:' + student.id, JSON.stringify({
        student: student.id,
        pinHash: await hashPin(newPin),
        mustChange: false,
        updatedAt: new Date().toISOString()
      }));
      return json(studentResponse(student, await studentSession(env, student)));
    }

    // ---- ADMIN LOGIN ----
    if (url.pathname === '/api/admin/login' && request.method === 'POST') {
      if (!env.ADMIN_TOKEN_SECRET) return json({ error: 'Sign-in service is not configured yet.' }, 503);
      const { username, password } = await request.json().catch(() => ({}));
      if (username === env.ADMIN_USERNAME && password === env.ADMIN_PASSWORD) {
        return json({ ok: true, token: await makeToken(env) });
      }
      return json({ ok: false, error: 'Invalid credentials' }, 401);
    }

    // ---- ADMIN DIRECTORY AND PIN RESET ----
    if (url.pathname === '/api/admin/students' && request.method === 'GET') {
      if (!await verifyToken(env, bearer(request))) return json({ error: 'unauthorized' }, 401);
      return json({ students: STUDENT_ROSTER });
    }
    {
      const m = url.pathname.match(/^\/api\/admin\/students\/([a-z0-9-]+)\/reset-pin$/);
      if (m && request.method === 'POST') {
        if (!await verifyToken(env, bearer(request))) return json({ error: 'unauthorized' }, 401);
        const student = STUDENT_ROSTER.find((item) => item.id === m[1]);
        if (!student) return json({ error: 'unknown student' }, 404);
        if (!env.HOMEWORK) return json({ error: 'KV not configured' }, 503);
        await env.HOMEWORK.put('auth:student:' + student.id, JSON.stringify({
          student: student.id,
          pinHash: await hashPin(DEFAULT_STUDENT_PIN),
          mustChange: true,
          updatedAt: new Date().toISOString()
        }));
        return json({ ok: true, studentId: student.id, message: 'Student must choose a new PIN at next sign-in.' });
      }
    }

    // ---- DAILY ASSIGNMENTS: students read / admin writes ----
    {
      const m = url.pathname.match(/^\/api\/assignments\/([a-z0-9-]+)$/);
      if (m && request.method === 'GET') {
        if (!validStudent(m[1])) return json({ error: 'unknown student' }, 404);
        if (!await canReadStudentRecord(env, request, m[1])) return json({ error: 'unauthorized' }, 401);
        if (!env.HOMEWORK) return json({ assignment: null });
        const raw = await env.HOMEWORK.get('assignment:' + m[1]);
        if (!raw) return json({ assignment: null });
        try { return json({ assignment: JSON.parse(raw) }); }
        catch { return json({ error: 'stored assignment is invalid' }, 500); }
      }
      if (m && (request.method === 'PUT' || request.method === 'POST')) {
        if (!await verifyToken(env, bearer(request))) return json({ error: 'unauthorized' }, 401);
        if (!validStudent(m[1])) return json({ error: 'unknown student' }, 404);
        if (!env.HOMEWORK) return json({ error: 'KV not configured' }, 503);
        const body = await request.json().catch(() => null);
        try {
          const incoming = normalizeAssignment(body, m[1]);
          let existing = null;
          const existingRaw = await env.HOMEWORK.get('assignment:' + m[1]);
          if (existingRaw) {
            try { existing = JSON.parse(existingRaw); } catch { existing = null; }
          }
          const assignment = mergeAssignment(existing, incoming, assignmentReplacementSubjects(body && body.replaceSubjects), m[1]);
          await env.HOMEWORK.put('assignment:' + m[1], JSON.stringify(assignment));
          return json({ ok: true, assignment });
        } catch (error) {
          return json({ error: error.message || 'invalid assignment' }, 400);
        }
      }
    }

    // ---- HOMEWORK: read (public) / write (admin) ----
    {
      const m = url.pathname.match(/^\/api\/homework\/([a-z0-9-]+)$/);
      if (m && request.method === 'GET') {
        if (!validStudent(m[1])) return json({ error: 'unknown student' }, 404);
        const claims = await readSignedToken(env, bearer(request));
        if (!claims || (claims.role !== 'admin' && !(claims.role === 'student' && claims.student === m[1]))) return json({ error: 'unauthorized' }, 401);
        if (!env.HOMEWORK) return json({ content: null });
        const raw = await env.HOMEWORK.get('homework:' + m[1]);
        const content = raw ? JSON.parse(raw) : null;
        return json({ content: claims.role === 'student' ? stripWorksheetAnswers(content) : content });
      }
      if (m && request.method === 'POST') {
        if (!await verifyToken(env, bearer(request))) return json({ error: 'unauthorized' }, 401);
        if (!validStudent(m[1])) return json({ error: 'unknown student' }, 404);
        if (!env.HOMEWORK) return json({ error: 'KV not configured' }, 503);
        const content = await request.json();
        try {
          if (content.assigned && typeof content.assigned === 'object' && !Array.isArray(content.assigned)) {
            const worksheets = normalizeAssignedWorksheets(content.assigned, m[1]);
            if (Object.keys(worksheets).length || content.assigned.worksheets !== undefined || content.assigned.worksheet) {
              content.assigned.worksheets = worksheets;
              delete content.assigned.worksheet;
            }
          }
        } catch (error) {
          return json({ error: error.message || 'invalid worksheet' }, 400);
        }
        content.updatedAt = new Date().toISOString();
        content.student = m[1];
        await env.HOMEWORK.put('homework:' + m[1], JSON.stringify(content));
        return json({ ok: true, content });
      }
    }

    // ---- WORKSHEET CHECKING: student submits answers, server keeps the key private ----
    {
      const m = url.pathname.match(/^\/api\/homework\/([a-z0-9-]+)\/check$/);
      if (m && request.method === 'POST') {
        const claims = await readSignedToken(env, bearer(request));
        if (!claims || claims.role !== 'student' || claims.student !== m[1]) return json({ error: 'unauthorized' }, 401);
        if (!env.HOMEWORK) return json({ error: 'KV not configured' }, 503);
        const raw = await env.HOMEWORK.get('homework:' + m[1]);
        if (!raw) return json({ error: 'No worksheet has been published yet.' }, 404);
        let content;
        try { content = JSON.parse(raw); } catch { return json({ error: 'stored homework is invalid' }, 500); }
        let check;
        try {
          const body = await request.json().catch(() => ({}));
          const requestedSubject = typeof body.subject === 'string' ? body.subject.trim().toLowerCase() : '';
          const subject = requestedSubject
            ? ASSIGNMENT_SUBJECTS.find((item) => item.toLowerCase() === requestedSubject)
            : '';
          if (requestedSubject && !subject) return json({ error: 'worksheet subject is invalid' }, 400);
          const worksheets = content.assigned && content.assigned.worksheets
            ? normalizeWorksheetMap(content.assigned.worksheets, m[1])
            : {};
          const worksheetRaw = subject
            ? worksheets[subject]
            : (content.assigned && content.assigned.worksheet
              ? content.assigned.worksheet
              : (Object.keys(worksheets).length === 1 ? worksheets[Object.keys(worksheets)[0]] : null));
          if (!worksheetRaw) return json({ error: subject ? 'No worksheet has been published for ' + subject + '.' : 'No worksheet has been published yet.' }, 404);
          const worksheet = normalizeWorksheet(worksheetRaw, m[1]);
          check = checkWorksheet(worksheet, body.answers);
          const existingRaw = await env.HOMEWORK.get('answers:' + m[1]);
          let existing = {};
          if (existingRaw) { try { existing = JSON.parse(existingRaw); } catch { existing = {}; } }
          const savedAnswers = { ...(existing.answers || {}) };
          Object.entries(body.answers || {}).forEach(([id, value]) => { savedAnswers['worksheet:' + worksheet.subject + ':' + id] = worksheetText(value, 'submitted answer', 1000); });
          await env.HOMEWORK.put('answers:' + m[1], JSON.stringify({
            updatedAt: new Date().toISOString(),
            student: m[1],
            answers: savedAnswers,
            worksheet: { title: worksheet.title, correct: check.correct, total: check.total }
          }));
        } catch (error) {
          return json({ error: error.message || 'Could not check worksheet' }, 400);
        }
        return json({ ok: true, ...check });
      }
    }

    // ---- ANSWERS: student submits (public) / admin reads (auth) ----
    {
      const m = url.pathname.match(/^\/api\/answers\/([a-z0-9-]+)$/);
      if (m && request.method === 'POST') {
        if (!validStudent(m[1])) return json({ error: 'unknown student' }, 404);
        if (!env.HOMEWORK) return json({ ok: true });
        const body = await request.json().catch(() => ({}));
        const record = { updatedAt: new Date().toISOString(), student: m[1], answers: body.answers || {} };
        await env.HOMEWORK.put('answers:' + m[1], JSON.stringify(record));
        return json({ ok: true });
      }
      if (m && request.method === 'GET') {
        if (!await verifyToken(env, bearer(request))) return json({ error: 'unauthorized' }, 401);
        if (!env.HOMEWORK) return json({ answers: null });
        const raw = await env.HOMEWORK.get('answers:' + m[1]);
        return json({ record: raw ? JSON.parse(raw) : null });
      }
    }

    // ---- LESSON PACK PROGRESS: student submits (public) / admin reads ----
    //
    // Its own key and its own routes, deliberately not folded into
    // /api/answers. answers-sync.js POSTs the complete collected answer set on
    // every keystroke and the handler above replaces the record wholesale, so
    // progress living inside that record would be destroyed by the next
    // keystroke anywhere on the page. Two writers on different cadences cannot
    // share one wholesale-replaced key.
    {
      const m = url.pathname.match(/^\/api\/progress\/([a-z0-9-]+)$/);
      if (m && request.method === 'POST') {
        if (!validStudent(m[1])) return json({ error: 'unknown student' }, 404);
        if (!env.HOMEWORK) return json({ ok: true, progress: null });
        const body = await request.json().catch(() => ({}));
        const key = 'progress:' + m[1];
        const raw = await env.HOMEWORK.get(key);
        let stored = null;
        try { stored = raw ? JSON.parse(raw) : null; } catch { stored = null; }

        // Public write, so the merge is what makes it safe: max-wins and
        // idempotent, never last-write-wins. See src/progress.js. The grade
        // comes from the server's own table, not from the body, because it
        // decides which lessons are stored and which badges can be earned.
        const merged = mergeProgress(stored, body, gradeFor(m[1]));
        merged.updatedAt = new Date().toISOString();
        merged.student = m[1];
        await env.HOMEWORK.put(key, JSON.stringify(merged));

        // The merged record comes back, so one round trip both writes and
        // reads and the student page never needs the bearer token.
        return json({ ok: true, progress: merged });
      }
      if (m && request.method === 'GET') {
        if (!await verifyToken(env, bearer(request))) return json({ error: 'unauthorized' }, 401);
        if (!env.HOMEWORK) return json({ progress: null });
        const raw = await env.HOMEWORK.get('progress:' + m[1]);
        let stored = null;
        try { stored = raw ? JSON.parse(raw) : null; } catch { stored = null; }
        return json({ progress: stored ? sanitizeProgress(stored, gradeFor(m[1])) : null });
      }
    }

    // ---- ADMIN: AI generates homework via Kimi K2.6 (Ollama Cloud) ----
    if (url.pathname === '/api/admin/generate' && request.method === 'POST') {
      if (!await verifyToken(env, bearer(request))) return json({ error: 'unauthorized' }, 401);
      const { instruction, section, current, grade } = await request.json().catch(() => ({}));

      const KIMI_URL = 'https://ollama.com/v1/chat/completions';
      const KIMI_MODEL = 'kimi-k2.6:cloud';

      const schemaHint = {
        fillBlank: '{"title":string,"instructions":string,"wordBank":string[],"sentences":[{"before":string,"answer":string,"after":string}]}',
        stories:   '[{"title":string,"paragraphs":string[],"prompt":string}]',
        math:      '{"title":string,"problems":[{"q":string,"answer":string}]}',
        ela:       '{"title":string,"paragraphs":string[],"questions":[{"label":string,"question":string,"placeholder":string,"save":string}]}'
      }[section] || '{}';

      const sys = 'You are a curriculum editor for NYC ESL students (Bengali speakers, grades 1-8). ' +
        'You edit homework content. Return ONLY valid minified JSON matching this schema for the "' +
        section + '" section: ' + schemaHint +
        '. For fillBlank, every answer MUST appear in wordBank. Keep language simple and grade-appropriate. No markdown, no commentary.';
      const usr = 'Grade: ' + (grade || 'unknown') + '\nCurrent content (may be empty):\n' +
        JSON.stringify(current || null) + '\n\nInstruction: ' + instruction;

      const res = await fetch(KIMI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + env.OLLAMA_API_KEY },
        body: JSON.stringify({ model: KIMI_MODEL, temperature: 0.7, max_tokens: 4000, think: false,
          messages: [{ role: 'system', content: sys }, { role: 'user', content: usr }] })
      });
      const data = await res.json();
      // Kimi K2.6 is a reasoning model — content may be empty; fall back to reasoning field
      const text = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.message?.reasoning;
      if (!text) return json({ error: 'AI failed', detail: data }, 502);

      let parsed;
      try {
        const clean = text.replace(/```json?/gi, '').replace(/```/g, '').trim();
        parsed = JSON.parse(clean.match(/[[{][\s\S]*[\]}]/)?.[0] || clean);
      } catch (e) { return json({ error: 'AI returned non-JSON', raw: text }, 502); }

      return json({ ok: true, section, generated: parsed });
    }

    // ---- STUDENT AI CHAT (existing multi-provider chain) ----
    if (url.pathname === '/api/chat' && request.method === 'POST') {
      try {
        const body = await request.json();
        const errors = [];

        for (const provider of PROVIDERS) {
          const apiKey = env[provider.keyEnv];
          if (!apiKey) continue;

          try {
            const { ok, data, provider: providerName } = await tryProvider(provider, apiKey, body);
            if (ok) {
              return new Response(JSON.stringify(data), {
                headers: {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*',
                  'X-Routed-Via': providerName
                }
              });
            }
            errors.push({ provider: providerName, error: data.error || 'no choices' });
          } catch (e) {
            errors.push({ provider: provider.name, error: e.message });
          }
        }

        return new Response(JSON.stringify({ error: 'All providers failed', details: errors }), {
          status: 502,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Request failed: ' + e.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    return env.ASSETS.fetch(request);
  }
};
