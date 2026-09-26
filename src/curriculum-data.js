import grade2 from '../content/curriculum/grade-2.json' with { type: 'json' };
import grade3 from '../content/curriculum/grade-3.json' with { type: 'json' };
import grade4 from '../content/curriculum/grade-4.json' with { type: 'json' };
import grade5 from '../content/curriculum/grade-5.json' with { type: 'json' };
import grade6 from '../content/curriculum/grade-6.json' with { type: 'json' };
import grade7 from '../content/curriculum/grade-7.json' with { type: 'json' };
import grade9 from '../content/curriculum/grade-9.json' with { type: 'json' };

export const CURRICULUM_SUBJECTS = ['Math', 'English', 'Social Studies', 'Science'];
const PACKS = new Map([2, 3, 4, 5, 6, 7, 9].map((grade, index) => [
  grade,
  [grade2, grade3, grade4, grade5, grade6, grade7, grade9][index]
]));

export function curriculumMapForGrade(grade) {
  const pack = PACKS.get(grade);
  if (!pack || !pack.topics || typeof pack.topics !== 'object') return null;

  const subjects = {};
  for (const subject of CURRICULUM_SUBJECTS) {
    const topics = pack.topics[subject];
    if (!Array.isArray(topics)) return null;
    subjects[subject] = topics.map((topic) => ({
      id: topic.id,
      title: topic.title,
      subject,
      objective: topic.objective || '',
      estimatedMinutes: Number.isFinite(topic.estimatedMinutes) ? topic.estimatedMinutes : null,
      hasVisual: (Array.isArray(topic.visuals) && topic.visuals.length > 0) || Boolean(topic.visualBrief)
    }));
  }

  return {
    grade,
    subjects,
    gradeScopeNoteMarkdown: pack.gradeScopeNoteMarkdown || '',
    gradeNotesMarkdown: pack.gradeNotesMarkdown || '',
    subjectNotesMarkdown: pack.subjectNotesMarkdown || {},
    subjectNoteVisuals: pack.subjectNoteVisuals || {}
  };
}

export function curriculumTopicForGrade(grade, topicId) {
  const pack = PACKS.get(grade);
  if (!pack || !pack.topics || typeof pack.topics !== 'object') return null;
  for (const subject of CURRICULUM_SUBJECTS) {
    const topics = pack.topics[subject];
    if (!Array.isArray(topics)) return null;
    const topic = topics.find((item) => item && item.id === topicId);
    if (topic) return { ...topic, subject };
  }
  return null;
}

export const topicForGrade = curriculumTopicForGrade;

function stripPrivatePracticeFields(value) {
  if (Array.isArray(value)) return value.map(stripPrivatePracticeFields);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !['answer', 'acceptedAnswers', 'modelAnswer', 'feedback', 'rubric', 'scoringNotes', 'isCorrect', 'correctAnswer'].includes(key))
    .map(([key, item]) => [key, stripPrivatePracticeFields(item)]));
}

export function learnerTopic(topic) {
  if (!topic || typeof topic !== 'object' || Array.isArray(topic)) {
    throw new Error('Study topic is malformed.');
  }
  if (topic.questions !== undefined && !Array.isArray(topic.questions)) {
    throw new Error('Study topic questions must be an array.');
  }

  // Keep the authored topic intact so new mapped fields (including line breaks,
  // visuals, and future block types) cannot disappear at the API boundary.
  // Keep learner-authored lesson material, while withholding checked-answer keys
  // and importer audit metadata until the authenticated self-check endpoint.
  const learnerVersion = { ...topic };
  for (const key of ['answerKeyMarkdown', 'sourceLineStart', 'sourceLineEnd', 'sourceLineCount', 'sourceBodyLineCount', 'answerKeyLineCount', 'internalNoteLineCount']) {
    delete learnerVersion[key];
  }
  if (Array.isArray(topic.questions)) {
    learnerVersion.questions = topic.questions.map(stripPrivatePracticeFields);
  }
  return learnerVersion;
}

function normalizedAnswer(value) {
  return String(value == null ? '' : value).trim().replace(/\s+/g, ' ').toLowerCase().replace(/,/g, '');
}

export function checkCurriculumTopic(topic, submitted) {
  if (!submitted || typeof submitted !== 'object' || Array.isArray(submitted)) {
    throw new Error('Answers must be an object.');
  }
  const questions = Array.isArray(topic.questions) ? topic.questions : [];
  const questionIds = new Set(questions.map((question) => question.id));
  if (Object.keys(submitted).some((id) => !questionIds.has(id))) {
    throw new Error('Answers contain an unknown question.');
  }

  let total = 0;
  let correct = 0;
  let needsReview = 0;
  const results = questions.map((question) => {
    const isReflection = (question.kind || question.type) === 'reflection';
    if (!isReflection) total += 1;
    const rawValue = submitted[question.id];
    if (rawValue != null && typeof rawValue !== 'string') throw new Error('Each answer must be text.');
    const value = String(rawValue || '').trim();
    if (value.length > 3000) throw new Error('An answer is too long.');
    if (!value) return { id: question.id, status: 'unanswered' };

    const modelAnswer = String(question.answer || question.modelAnswer || (isReflection ? topic.answerKeyMarkdown : '') || '');
    const feedback = String(question.feedback || '');
    if (isReflection) {
      needsReview += 1;
      return { id: question.id, status: 'review', modelAnswer, feedback };
    }

    const accepted = Array.isArray(question.acceptedAnswers) && question.acceptedAnswers.length
      ? question.acceptedAnswers
      : [modelAnswer];
    const isCorrect = accepted.some((answer) => normalizedAnswer(answer) === normalizedAnswer(value));
    if (isCorrect) correct += 1;
    return {
      id: question.id,
      status: isCorrect ? 'correct' : 'try-again',
      modelAnswer,
      feedback
    };
  });

  return {
    total,
    correct,
    needsReview,
    scorePercent: total ? Math.round((correct / total) * 100) : null,
    results
  };
}

export const checkTopicAnswers = checkCurriculumTopic;
