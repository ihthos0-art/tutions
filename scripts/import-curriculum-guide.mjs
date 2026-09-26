#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [gradeValue, sourceDirectory] = process.argv.slice(2);
const grade = Number(gradeValue);

if (!Number.isInteger(grade) || grade < 2 || !sourceDirectory) {
  throw new Error('Usage: node scripts/import-curriculum-guide.mjs <grade> <source-directory>');
}

const guideName = `grade-${grade}.md`;
const guidePath = path.join(sourceDirectory, guideName);
const manifestPath = path.join(sourceDirectory, 'image-generation-manifest.md');
const packPath = path.join(projectRoot, 'content', 'curriculum', `grade-${grade}.json`);
if (![guidePath, manifestPath, packPath].every(existsSync)) {
  throw new Error(`Required guide, manifest, or existing grade pack is missing for Grade ${grade}.`);
}

const rawGuide = readFileSync(guidePath, 'utf8');
const guideLines = rawGuide.replace(/\r\n/g, '\n').split('\n');
if (guideLines.at(-1) === '') guideLines.pop();
if (!guideLines[0].startsWith(`# Grade ${grade} `)) {
  throw new Error(`${guideName} does not begin with the expected Grade ${grade} title.`);
}

const subjectNames = ['Math', 'English', 'Social Studies', 'Science'];
const subjectForHeading = (title, fallback = null) => {
  const match = title.match(/^(ELA|English(?: language arts)?|Math(?:ematics)?|Science|Social studies)(?:\s+unit\s+\d+)?\s+week(?:\s+\d+)?\s*:/i);
  if (match) {
    if (/^(ELA|English)/i.test(match[1])) return 'English';
    if (/^Math/i.test(match[1])) return 'Math';
    if (/^Science/i.test(match[1])) return 'Science';
    return 'Social Studies';
  }
  if (/^ELA\s+Module\s+\d+\s+week\s*:/i.test(title) || /^Module\s+\d+\s+companion\s+week\s*:/i.test(title)) return 'English';
  return fallback;
};
const subjectForGroupHeading = (title) => {
  const match = title.match(/^More five-session (ELA|English|math) units\b/i);
  if (!match) return null;
  return /^math$/i.test(match[1]) ? 'Math' : 'English';
};
const isNestedTopicHeading = (title) => Boolean(subjectForHeading(title))
  || /^Supplemental (?:Brooklyn source study|close reading)\s*:/i.test(title);
const lineCount = (lines) => lines.length;
const lineText = (lines) => lines.join('\n');

function parseLevelTwoSections(lines, start, end) {
  const starts = [];
  for (let i = start; i < end; i++) if (/^## (?!#)/.test(lines[i])) starts.push(i);
  return starts.map((sectionStart, index) => ({
    start: sectionStart,
    end: starts[index + 1] ?? end,
    lines: lines.slice(sectionStart, starts[index + 1] ?? end),
    title: lines[sectionStart].replace(/^##\s+/, '')
  }));
}

function removeEditorialComments(lines) {
  const visible = [];
  const privateNotes = [];
  let insideComment = false;
  for (const line of lines) {
    if (insideComment) {
      if (!line.trim().endsWith('-->')) throw new Error('Only complete, standalone HTML comments are supported in guide input.');
      privateNotes.push(line);
      insideComment = false;
      continue;
    }
    if (/^\s*<!--/.test(line)) {
      privateNotes.push(line);
      if (!line.includes('-->')) insideComment = true;
      else if (!line.trim().endsWith('-->')) throw new Error('Inline HTML comments are not supported in guide input.');
      continue;
    }
    visible.push(line);
  }
  if (insideComment) throw new Error('Unclosed HTML comment in guide input.');
  return { visible, privateNotes };
}

function splitAnswerKeys(lines) {
  const visible = [];
  const answerKey = [];
  let insideAnswerKey = false;
  const answerHeading = /^#{4,6}\s+.*\b(?:checked answers?|answer key|answer guide)\b/i;
  const inlineAnswer = /^\s*\*\*(?:checked answer|checked answers|answer key|additional checked practice)\b[^*]*\*\*\s*:/i;
  for (const line of lines) {
    if (insideAnswerKey && /^#{4,6}\s+/.test(line) && !answerHeading.test(line)) insideAnswerKey = false;
    if (answerHeading.test(line)) insideAnswerKey = true;
    if (insideAnswerKey || inlineAnswer.test(line)) answerKey.push(line);
    else visible.push(line);
  }
  return { visible, answerKey };
}

function parseManifest(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const entries = [];
  const gradeStarts = [];
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^## Grade (\d+)\b/);
    if (match) gradeStarts.push({ start: i, grade: Number(match[1]) });
  }
  if (!gradeStarts.length) throw new Error('The image manifest has no grade sections.');

  for (let sectionIndex = 0; sectionIndex < gradeStarts.length; sectionIndex++) {
    const { start, grade } = gradeStarts[sectionIndex];
    const end = gradeStarts[sectionIndex + 1]?.start ?? lines.length;
    for (let i = start + 1; i < end; i++) {
      if (!/^### /.test(lines[i])) continue;
      const filename = lines[i].replace(/^###\s+/, '').trim();
      const fields = {};
      for (let j = i + 1; j < end && !/^### /.test(lines[j]); j++) {
        const field = lines[j].match(/^[-*]\s+([^:]+):\s*(.*)$/);
        if (field) fields[field[1].trim()] = field[2].trim();
      }
      if (!fields.Path) continue;
      const dimensions = fields.Dimensions && fields.Dimensions.match(/(\d+)\s*[×x]\s*(\d+)/i);
      if (!dimensions || !fields['Topic and placement'] || !fields['Alt text']) {
        throw new Error(`Incomplete Grade ${grade} visual manifest entry for ${filename}.`);
      }
      entries.push({
        grade,
        filename,
        path: fields.Path,
        width: Number(dimensions[1]),
        height: Number(dimensions[2]),
        placement: fields['Topic and placement'],
        alt: fields['Alt text']
      });
    }
  }
  if (!entries.length) throw new Error('No visual entries were found in the manifest.');
  return entries;
}

function readPngDimensions(filePath) {
  const bytes = readFileSync(filePath);
  if (bytes.length < 24 || bytes.toString('hex', 0, 8) !== '89504e470d0a1a0a') {
    throw new Error(`Manifest asset is not a readable PNG: ${filePath}`);
  }
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), bytes };
}

function markdownImages(markdown) {
  const images = [];
  const matcher = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  let match;
  while ((match = matcher.exec(markdown))) images.push({ alt: match[1], sourcePath: match[2] });
  return images;
}

function visualSubject(placement) {
  const first = placement.split(/[;,]/, 1)[0].trim().toLowerCase();
  if (first === 'ela' || first === 'english') return 'English';
  if (first === 'math') return 'Math';
  if (first === 'science') return 'Science';
  if (first === 'social studies') return 'Social Studies';
  return null;
}

const allManifestEntries = parseManifest(readFileSync(manifestPath, 'utf8'));
const manifest = allManifestEntries.filter((item) => item.grade === grade);
if (!manifest.length) throw new Error(`The image manifest has no Grade ${grade} visual entries.`);
const manifestByPath = new Map(allManifestEntries.map((item) => [item.path, item]));
const copiedAssets = new Map();
const copiedGuideAssets = new Map();
function ensureManifestAsset(item) {
  if (copiedAssets.has(item.path)) return copiedAssets.get(item.path);
  const sourcePath = path.resolve(sourceDirectory, item.path);
  if (!sourcePath.startsWith(path.resolve(sourceDirectory) + path.sep)) {
    throw new Error(`Unsafe manifest asset path: ${item.path}`);
  }
  const source = readPngDimensions(sourcePath);
  if (source.width !== item.width || source.height !== item.height) {
    throw new Error(`Manifest dimensions differ for ${item.path}: expected ${item.width}x${item.height}, got ${source.width}x${source.height}.`);
  }

  const relativeOutput = path.join('public', 'assets', 'curriculum', item.path);
  const destination = path.join(projectRoot, relativeOutput);
  mkdirSync(path.dirname(destination), { recursive: true });
  if (existsSync(destination)) {
    const current = readFileSync(destination);
    if (!current.equals(source.bytes)) throw new Error(`Refusing to overwrite a different existing curriculum visual: ${relativeOutput}`);
  } else {
    copyFileSync(sourcePath, destination);
  }
  const copied = { ...item, src: `/${path.posix.join('assets', 'curriculum', item.path.split(path.sep).join('/'))}` };
  copiedAssets.set(item.path, copied);
  return copied;
}
function ensureGuideLocalAsset(sourcePath) {
  if (!sourcePath.startsWith('images/')) throw new Error(`Unsupported local image path in guide: ${sourcePath}`);
  const existing = copiedGuideAssets.get(sourcePath);
  if (existing) return existing;
  const resolvedSource = path.resolve(sourceDirectory, sourcePath);
  if (!resolvedSource.startsWith(path.resolve(sourceDirectory) + path.sep)) {
    throw new Error(`Unsafe guide image path: ${sourcePath}`);
  }
  const bytes = readFileSync(resolvedSource);
  const extension = path.extname(sourcePath).toLowerCase();
  const isPng = extension === '.png' && bytes.toString('hex', 0, 8) === '89504e470d0a1a0a';
  const isJpeg = ['.jpg', '.jpeg'].includes(extension) && bytes[0] === 0xff && bytes[1] === 0xd8;
  if (!isPng && !isJpeg) throw new Error(`Guide image is not a valid PNG/JPEG file: ${sourcePath}`);
  const relativeOutput = path.join('public', 'assets', 'curriculum', sourcePath);
  const destination = path.join(projectRoot, relativeOutput);
  mkdirSync(path.dirname(destination), { recursive: true });
  if (existsSync(destination)) {
    if (!readFileSync(destination).equals(bytes)) throw new Error(`Refusing to overwrite a different existing guide image: ${relativeOutput}`);
  } else {
    copyFileSync(resolvedSource, destination);
  }
  const copied = {
    sourcePath,
    src: `/${path.posix.join('assets', 'curriculum', sourcePath)}`,
    format: isPng ? 'image/png' : 'image/jpeg'
  };
  copiedGuideAssets.set(sourcePath, copied);
  return copied;
}
for (const item of manifest) ensureManifestAsset(item);

const unitHeadingIndex = guideLines.findIndex((line) => /^## Five-session study units\s*$/.test(line));
if (unitHeadingIndex < 0) throw new Error(`No “Five-session study units” section was found in ${guideName}.`);

const topSections = parseLevelTwoSections(guideLines, 0, unitHeadingIndex);
const preambleEnd = topSections[0]?.start ?? unitHeadingIndex;
const preamble = guideLines.slice(0, preambleEnd);
const subjectNotes = Object.fromEntries(subjectNames.map((subject) => [subject, []]));
const gradeNotes = [];
const internalSourceNotes = [];
let scopeNoteMarkdown = '';
let accountedLines = preamble.length;

internalSourceNotes.push(...preamble);

for (const section of topSections) {
  accountedLines += lineCount(section.lines);
  const cleaned = removeEditorialComments(section.lines);
  internalSourceNotes.push(...cleaned.privateNotes);
  const markdown = lineText(cleaned.visible);
  const normalizedTitle = section.title.toLowerCase();
  if (normalizedTitle === 'important scope note') {
    scopeNoteMarkdown = markdown;
  } else if (normalizedTitle.startsWith('english language arts')) {
    subjectNotes.English.push(markdown);
  } else if (normalizedTitle === 'mathematics') {
    subjectNotes.Math.push(markdown);
  } else if (normalizedTitle === 'science') {
    subjectNotes.Science.push(markdown);
  } else if (normalizedTitle === 'social studies' || normalizedTitle === 'visual sources') {
    subjectNotes['Social Studies'].push(markdown);
  } else {
    gradeNotes.push(markdown);
  }
}

let firstTopicIndex = unitHeadingIndex + 1;
while (firstTopicIndex < guideLines.length && !/^### /.test(guideLines[firstTopicIndex])) firstTopicIndex++;
if (firstTopicIndex >= guideLines.length) throw new Error(`No topic headings were found after the study-unit introduction in ${guideName}.`);
const unitIntroduction = guideLines.slice(unitHeadingIndex, firstTopicIndex);
accountedLines += lineCount(unitIntroduction);
const cleanedUnitIntroduction = removeEditorialComments(unitIntroduction);
internalSourceNotes.push(...cleanedUnitIntroduction.privateNotes);
gradeNotes.push(lineText(cleanedUnitIntroduction.visible));

const unitStarts = [];
for (let i = firstTopicIndex; i < guideLines.length; i++) if (/^### /.test(guideLines[i])) unitStarts.push(i);
const topicSpecs = [];
const topics = Object.fromEntries(subjectNames.map((subject) => [subject, []]));
const importedTopicIds = new Set();
const referencedManifestPaths = new Set();
let answerKeyLines = 0;

for (let index = 0; index < unitStarts.length; index++) {
  const start = unitStarts[index];
  const end = unitStarts[index + 1] ?? guideLines.length;
  const title = guideLines[start].replace(/^###\s+/, '').trim();
  const groupSubject = subjectForGroupHeading(title);
  if (groupSubject) {
    const childStarts = [];
    for (let i = start + 1; i < end; i++) {
      if (!/^#### /.test(guideLines[i])) continue;
      const childTitle = guideLines[i].replace(/^####\s+/, '').trim();
      if (isNestedTopicHeading(childTitle)) childStarts.push(i);
    }
    const noteEnd = childStarts[0] ?? end;
    const noteLines = guideLines.slice(start, noteEnd);
    accountedLines += lineCount(noteLines);
    const cleanedNote = removeEditorialComments(noteLines);
    internalSourceNotes.push(...cleanedNote.privateNotes);
    subjectNotes[groupSubject].push(lineText(cleanedNote.visible));
    for (let childIndex = 0; childIndex < childStarts.length; childIndex++) {
      const childStart = childStarts[childIndex];
      const childEnd = childStarts[childIndex + 1] ?? end;
      const childTitle = guideLines[childStart].replace(/^####\s+/, '').trim();
      const childSubject = subjectForHeading(childTitle, groupSubject);
      if (childSubject !== groupSubject) {
        throw new Error(`Nested study heading changed subjects inside “${title}”: ${childTitle}`);
      }
      topicSpecs.push({ title: childTitle, subject: childSubject, start: childStart, end: childEnd });
    }
    continue;
  }

  let lastSubject = topicSpecs.at(-1)?.subject ?? null;
  const subject = subjectForHeading(title, lastSubject);
  if (!subject) throw new Error(`Cannot map study heading to a subject: ${title}`);
  topicSpecs.push({ title, subject, start, end });
}

for (let index = 0; index < topicSpecs.length; index++) {
  const { start, end, title, subject } = topicSpecs[index];
  const sourceLines = guideLines.slice(start, end);
  accountedLines += lineCount(sourceLines);
  const slug = title.normalize('NFKD').replace(/[’']/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const id = slug || `grade-${grade}-topic-${index + 1}`;
  if (importedTopicIds.has(id)) throw new Error(`Duplicate topic ID derived from guide heading: ${id}`);
  importedTopicIds.add(id);

  const commentSplit = removeEditorialComments(sourceLines.slice(1));
  internalSourceNotes.push(...commentSplit.privateNotes);
  const answerSplit = splitAnswerKeys(commentSplit.visible);
  answerKeyLines += answerSplit.answerKey.length;

  const contentMarkdown = lineText(answerSplit.visible);
  const answerKeyMarkdown = lineText(answerSplit.answerKey);
  const visuals = markdownImages(contentMarkdown).map((image) => {
    if (image.sourcePath.startsWith('images/')) {
      const item = manifestByPath.get(image.sourcePath);
      if (!item) {
        const copied = ensureGuideLocalAsset(image.sourcePath);
        return { ...copied, alt: image.alt };
      }
      const copied = ensureManifestAsset(item);
      referencedManifestPaths.add(item.path);
      return {
        sourcePath: image.sourcePath,
        src: copied.src,
        alt: copied.alt,
        width: copied.width,
        height: copied.height,
        placement: copied.placement
      };
    }
    if (!image.sourcePath.startsWith('https://')) throw new Error(`Unsupported image URL in guide: ${image.sourcePath}`);
    return { sourcePath: image.sourcePath, src: image.sourcePath, alt: image.alt };
  });

  const sourceBodyLines = sourceLines.length - 1;
  const topic = {
    id,
    title,
    subject,
    objective: '',
    estimatedMinutes: null,
    contentMarkdown,
    questions: answerKeyMarkdown.trim() ? [{
      id: 'self-check',
      kind: 'reflection',
      prompt: 'After trying the practice above, briefly note that you are ready to compare your work with the guide’s checked responses.'
    }] : [],
    visuals,
    sourceLineStart: start + 1,
    sourceLineEnd: end,
    sourceLineCount: sourceLines.length,
    sourceBodyLineCount: sourceBodyLines,
    answerKeyLineCount: answerSplit.answerKey.length,
    internalNoteLineCount: commentSplit.privateNotes.length
  };
  if (answerKeyMarkdown.trim()) topic.answerKeyMarkdown = answerKeyMarkdown;
  topics[subject].push(topic);
  if (1 + answerSplit.visible.length + answerSplit.answerKey.length + commentSplit.privateNotes.length !== sourceLines.length) {
    throw new Error(`Grade ${grade} source lines do not reconcile for topic “${title}”.`);
  }
}

const subjectNoteVisuals = Object.fromEntries(subjectNames.map((subject) => [subject, []]));
const visualStopWords = new Set([
  'a', 'an', 'and', 'as', 'at', 'beside', 'by', 'for', 'from', 'grade', 'in', 'into', 'of',
  'on', 'or', 'place', 'the', 'to', 'week', 'with', 'study', 'studies', 'lesson', 'topic', 'math',
  'mathematics', 'ela', 'english', 'social', 'science', 'embed', 'embedded', 'first', 'second',
  'use', 'using', 'real', 'public', 'source', 'released', 'question', 'questions', 'nyc', 'nysed'
]);
const specificVisualTerms = new Set([
  'coordinate', 'fraction', 'number', 'line', 'place', 'value', 'inventor', 'ecosystem', 'energy',
  'digital', 'light', 'water', 'circuit', 'ratio', 'rate', 'surface', 'area', 'cell', 'wave'
]);
function visualTerms(text) {
  return new Set((String(text).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').match(/[a-z0-9]+/g) || [])
    .map((word) => {
      if (word === 'multiplication' || word === 'multiplying') return 'multiply';
      if (word === 'division' || word === 'dividing') return 'divide';
      if (word.length > 4 && word.endsWith('s')) return word.slice(0, -1);
      return word;
    })
    .filter((word) => !visualStopWords.has(word)));
}
function findVisualTopic(item, copied) {
  const placementTerms = visualTerms(item.placement);
  const candidates = topics[visualSubject(item.placement)] || [];
  const scored = candidates.map((topic) => {
    const titleTerms = visualTerms(topic.title);
    const matches = [...placementTerms].filter((term) => titleTerms.has(term));
    return { topic, matches, score: matches.length };
  }).sort((a, b) => b.score - a.score);
  if (!scored.length || scored[0].score === 0) return null;
  const best = scored[0];
  const uniqueBest = best.score > (scored[1]?.score ?? 0);
  const hasSpecificAnchor = best.matches.some((term) => specificVisualTerms.has(term));
  if (!uniqueBest || (best.score < 2 && !hasSpecificAnchor)) return null;
  return {
    topicId: best.topic.id,
    sourcePath: item.path,
    src: copied.src,
    alt: copied.alt,
    width: copied.width,
    height: copied.height,
    placement: item.placement,
    caption: item.placement
  };
}
for (const item of manifest) {
  if (referencedManifestPaths.has(item.path)) continue;
  const subject = visualSubject(item.placement);
  if (!subject) throw new Error(`Unplaced manifest visual needs a subject mapping: ${item.filename}`);
  const copied = ensureManifestAsset(item);
  const visual = findVisualTopic(item, copied);
  const target = visual && topics[subject].find((topic) => topic.id === visual.topicId);
  if (target) {
    target.visuals.push(visual);
  } else {
    subjectNoteVisuals[subject].push({
      sourcePath: item.path,
      src: copied.src,
      alt: copied.alt,
      width: copied.width,
      height: copied.height,
      placement: copied.placement,
      caption: copied.placement
    });
  }
}

if (accountedLines !== guideLines.length) {
  throw new Error(`Guide line coverage failed: ${accountedLines} accounted for ${guideLines.length} source lines.`);
}

const pack = JSON.parse(readFileSync(packPath, 'utf8'));
if (pack.grade !== grade) throw new Error(`Existing curriculum pack grade does not match ${grade}.`);
pack.topics = topics;
pack.gradeScopeNoteMarkdown = scopeNoteMarkdown;
pack.gradeNotesMarkdown = gradeNotes.join('\n\n');
pack.subjectNotesMarkdown = Object.fromEntries(subjectNames.map((subject) => [subject, subjectNotes[subject].join('\n\n')]));
pack.subjectNoteVisuals = subjectNoteVisuals;
pack.internalImportNotesMarkdown = internalSourceNotes.join('\n');
pack.importAudit = {
  sourceGuide: guideName,
  sourceManifest: 'image-generation-manifest.md',
  guideSha256: createHash('sha256').update(rawGuide).digest('hex'),
  sourceLineCount: guideLines.length,
  accountedLineCount: accountedLines,
  topicCount: topicSpecs.length,
  topicCounts: Object.fromEntries(subjectNames.map((subject) => [subject, topics[subject].length])),
  answerKeyLineCount: answerKeyLines,
  internalNoteLineCount: internalSourceNotes.length,
  manifestVisualCount: manifest.length,
  guideLocalVisualCount: copiedGuideAssets.size,
  topicVisualCount: Object.values(topics).flat().reduce((sum, topic) => sum + topic.visuals.length, 0),
  subjectNoteVisualCount: Object.values(subjectNoteVisuals).flat().length
};

writeFileSync(packPath, `${JSON.stringify(pack, null, 2)}\n`);
console.log(JSON.stringify({
  output: path.relative(projectRoot, packPath),
  ...pack.importAudit,
  subjectNoteVisuals: Object.fromEntries(subjectNames.map((subject) => [subject, subjectNoteVisuals[subject].map((visual) => visual.src)]))
}, null, 2));
