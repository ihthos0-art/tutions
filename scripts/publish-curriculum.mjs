import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baseUrl = (process.env.LEARNFLOW_URL || 'https://learnflow.ihthos.dev').replace(/\/+$/, '');
const username = process.env.LEARNFLOW_ADMIN_USERNAME;
const password = process.env.LEARNFLOW_ADMIN_PASSWORD;
const subjects = ['Math', 'English', 'Social Studies', 'Science'];
const requiredGrades = [2, 3, 4, 5, 6, 7, 9];

if (!username || !password) {
  throw new Error('Set LEARNFLOW_ADMIN_USERNAME and LEARNFLOW_ADMIN_PASSWORD in the environment before publishing.');
}

const lessonsByStudent = new Map();
const gradeCounts = new Map();
for (const grade of requiredGrades) {
  const filePath = path.join(projectRoot, 'content', 'curriculum', `grade-${grade}.json`);
  const guide = JSON.parse(await readFile(filePath, 'utf8'));
  if (guide.grade !== grade || !Array.isArray(guide.students) || !guide.lessons || typeof guide.lessons !== 'object') {
    throw new Error(`Invalid curriculum bundle for Grade ${grade}.`);
  }
  const actualSubjects = Object.keys(guide.lessons).sort();
  if (actualSubjects.join('|') !== subjects.slice().sort().join('|')) {
    throw new Error(`Grade ${grade} must contain exactly Math, English, Social Studies, and Science.`);
  }
  for (const [subject, worksheet] of Object.entries(guide.lessons)) {
    if (worksheet.subject !== subject || !Array.isArray(worksheet.questions) || worksheet.questions.length < 1) {
      throw new Error(`Grade ${grade} ${subject} lesson has an invalid subject or no questions.`);
    }
  }
  for (const studentId of guide.students) {
    if (lessonsByStudent.has(studentId)) throw new Error(`Student ${studentId} appears in more than one grade bundle.`);
    lessonsByStudent.set(studentId, { grade, lessons: guide.lessons });
    gradeCounts.set(grade, (gradeCounts.get(grade) || 0) + 1);
  }
}

const jsonRequest = (url, method, token, body) => fetch(url, {
  method,
  headers: {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  },
  ...(body ? { body: JSON.stringify(body) } : {})
});

const loginResponse = await jsonRequest(`${baseUrl}/api/admin/login`, 'POST', '', { username, password });
if (!loginResponse.ok) throw new Error(`Admin sign-in failed with HTTP ${loginResponse.status}.`);
const login = await loginResponse.json();
if (!login || typeof login.token !== 'string' || !login.token) throw new Error('Admin sign-in did not return a session token.');
const token = login.token;

const rosterResponse = await fetch(`${baseUrl}/api/admin/students`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
if (!rosterResponse.ok) throw new Error(`Could not read the admin roster (HTTP ${rosterResponse.status}).`);
const rosterBody = await rosterResponse.json();
if (!Array.isArray(rosterBody.students)) throw new Error('The admin roster response is invalid.');
const rosterIds = new Set(rosterBody.students.map((student) => student && student.id).filter(Boolean));
const missingLessons = [...rosterIds].filter((studentId) => !lessonsByStudent.has(studentId));
const unknownLessons = [...lessonsByStudent.keys()].filter((studentId) => !rosterIds.has(studentId));
if (missingLessons.length || unknownLessons.length) {
  throw new Error(`Curriculum coverage differs from the roster (missing: ${missingLessons.length}; unknown: ${unknownLessons.length}). No student content was changed.`);
}

for (const [studentId, bundle] of lessonsByStudent.entries()) {
  const currentResponse = await fetch(`${baseUrl}/api/homework/${encodeURIComponent(studentId)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });
  if (!currentResponse.ok) throw new Error(`Could not read existing work for one student (HTTP ${currentResponse.status}); publishing stopped.`);
  const currentBody = await currentResponse.json();
  const currentContent = currentBody.content == null ? {} : currentBody.content;
  if (!currentContent || typeof currentContent !== 'object' || Array.isArray(currentContent)) {
    throw new Error('Existing homework has an invalid format; publishing stopped without overwriting it.');
  }
  const assigned = currentContent.assigned == null ? {} : currentContent.assigned;
  if (!assigned || typeof assigned !== 'object' || Array.isArray(assigned)) {
    throw new Error('Existing assigned work has an invalid format; publishing stopped without overwriting it.');
  }
  const existingWorksheets = assigned.worksheets == null ? {} : assigned.worksheets;
  if (!existingWorksheets || typeof existingWorksheets !== 'object' || Array.isArray(existingWorksheets)) {
    throw new Error('Existing subject worksheets have an invalid format; publishing stopped without overwriting them.');
  }
  const content = {
    ...currentContent,
    assigned: {
      ...assigned,
      worksheets: { ...existingWorksheets, ...bundle.lessons }
    }
  };
  const saveResponse = await jsonRequest(`${baseUrl}/api/homework/${encodeURIComponent(studentId)}`, 'POST', token, content);
  if (!saveResponse.ok) {
    throw new Error(`Publishing one lesson bundle failed with HTTP ${saveResponse.status}; earlier successful writes are safe to rerun.`);
  }
  const saved = await saveResponse.json();
  if (!saved || saved.ok !== true) throw new Error('The server did not confirm a curriculum save; earlier successful writes are safe to rerun.');
}

const summary = requiredGrades.map((grade) => `G${grade}:${gradeCounts.get(grade) || 0}`).join(' ');
console.log(`Published four subject lessons to ${lessonsByStudent.size} roster students (${summary}). Existing non-curriculum homework and assignments were preserved.`);
