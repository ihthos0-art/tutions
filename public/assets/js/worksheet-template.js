(function (global) {
  'use strict';

  var SUBJECTS = ['Math', 'English', 'Social Studies', 'Science'];
  var TYPES = ['math', 'reading', 'ela'];

  var TEMPLATE_QUESTION_COUNT = 5;

  function templateForSubject(subjectName) {
    var subjectKey = String(subjectName || '').trim().toLowerCase();
    var subject = SUBJECTS.find(function (item) { return item.toLowerCase() === subjectKey; });
    if (!subject) throw new Error('Choose Math, English, Social Studies, or Science.');

    var type = subject === 'Math' ? 'math' : 'reading';
    var lines = [
      'LEARNFLOW WORKSHEET v1',
      '[AI: Replace every bracketed instruction with real worksheet content.]',
      '[AI: Keep the labels TITLE, SUBJECT, TYPE, INSTRUCTIONS, QUESTION, and ANSWER unchanged.]',
      '[AI: Add or remove QUESTION/ANSWER pairs as needed. Output only this template.]',
      'TITLE: [AI: Write a clear worksheet title]',
      'SUBJECT: ' + subject,
      'TYPE: ' + type,
      'INSTRUCTIONS: [AI: Write short, student-facing instructions]'
    ];

    if (type === 'reading') {
      lines.push('PASSAGE: |');
      lines.push('[AI: Write or paste the reading passage, source text, or lesson notes here]');
    }

    for (var index = 1; index <= TEMPLATE_QUESTION_COUNT; index += 1) {
      lines.push('QUESTION ' + index + ': [AI: Write question or problem ' + index + ']');
      lines.push('ANSWER ' + index + ': [AI: Write the correct answer ' + index + ']');
    }
    return lines.join('\n');
  }

  function hasUnresolvedPlaceholder(text) {
    return /\[\s*(?:AI|PLACEHOLDER)\s*:/i.test(text);
  }

  function parse(text) {
    if (typeof text !== 'string' || !text.trim()) throw new Error('Paste a LearnFlow worksheet template first.');
    if (hasUnresolvedPlaceholder(text)) throw new Error('Replace the bracketed AI placeholders before parsing.');
    var lines = text.replace(/\r\n?/g, '\n').split('\n');
    var meta = { title: '', subject: '', type: '', instructions: '', passage: '' };
    var questions = {};
    var mode = 'meta';
    var current = null;

    function questionFor(number) {
      var index = Number(number) || Object.keys(questions).length + 1;
      if (!questions[index]) questions[index] = { id: 'q' + index, prompt: '', answer: '' };
      current = questions[index];
      return current;
    }
    function append(field, value) {
      if (!value) return;
      meta[field] = meta[field] ? meta[field] + '\n' + value : value;
    }

    lines.forEach(function (rawLine) {
      var line = rawLine.trimRight();
      var trimmed = line.trim();
      var match = trimmed.match(/^(TITLE|SUBJECT|TYPE|INSTRUCTIONS?|PASSAGE|QUESTION|Q|ANSWER|A)\s*(\d+)?\s*:\s*(.*)$/i);
      if (match) {
        var key = match[1].toUpperCase();
        var value = match[3].trim();
        if (key === 'TITLE') { meta.title = value; mode = 'meta'; return; }
        if (key === 'SUBJECT') { meta.subject = value; mode = 'meta'; return; }
        if (key === 'TYPE') { meta.type = value.toLowerCase(); mode = 'meta'; return; }
        if (key === 'INSTRUCTION' || key === 'INSTRUCTIONS') { meta.instructions = value; mode = 'instructions'; return; }
        if (key === 'PASSAGE') { meta.passage = value === '|' ? '' : value; mode = 'passage'; return; }
        if (key === 'QUESTION' || key === 'Q') {
          var question = questionFor(match[2]);
          question.prompt = value;
          mode = 'question';
          return;
        }
        if (key === 'ANSWER' || key === 'A') {
          var answerQuestion = questionFor(match[2]);
          answerQuestion.answer = value;
          mode = 'answer';
        }
        return;
      }
      if (!trimmed && mode === 'meta') return;
      if (mode === 'passage') append('passage', line);
      else if (mode === 'instructions') append('instructions', line);
      else if (mode === 'question' && current) current.prompt = current.prompt ? current.prompt + '\n' + trimmed : trimmed;
      else if (mode === 'answer' && current) current.answer = current.answer ? current.answer + '\n' + trimmed : trimmed;
    });

    var type = (meta.type || (meta.subject.toLowerCase() === 'math' ? 'math' : 'reading')).toLowerCase();
    if (TYPES.indexOf(type) < 0) throw new Error('TYPE must be math, reading, or ela.');
    var subjectKey = (meta.subject || (type === 'math' ? 'Math' : 'English')).trim().toLowerCase();
    var subject = SUBJECTS.find(function (item) { return item.toLowerCase() === subjectKey; });
    if (!subject && subjectKey === 'ela') subject = 'English';
    if (!subject) throw new Error('SUBJECT must be Math, English, Social Studies, or Science.');
    var ordered = Object.keys(questions).sort(function (a, b) { return Number(a) - Number(b); }).map(function (key) {
      var question = questions[key];
      if (!question.prompt) throw new Error('Question ' + key + ' is missing its prompt.');
      if (!question.answer) throw new Error('Question ' + key + ' is missing its answer.');
      var acceptedAnswers = question.answer.split(/\s*\|\|\s*/).map(function (answer) { return answer.trim(); }).filter(Boolean);
      return { id: question.id, prompt: question.prompt, answer: acceptedAnswers[0], acceptedAnswers: acceptedAnswers };
    });
    if (!ordered.length) throw new Error('Add at least one QUESTION and ANSWER pair.');
    return {
      version: 1,
      format: 'learnflow-worksheet-v1',
      title: meta.title || 'Assigned practice',
      subject: subject,
      type: type,
      instructions: meta.instructions,
      passage: meta.passage,
      questions: ordered
    };
  }

  function example() {
    return [
      'LEARNFLOW WORKSHEET v1',
      'TITLE: Multiplication warm-up',
      'SUBJECT: Math',
      'TYPE: math',
      'INSTRUCTIONS: Solve each problem. Then press Check answers.',
      'QUESTION 1: 6 × 7 =',
      'ANSWER 1: 42',
      'QUESTION 2: 8 × 9 =',
      'ANSWER 2: 72',
      'QUESTION 3: 45 ÷ 5 =',
      'ANSWER 3: 9',
      '',
      '# For reading, use TYPE: reading and add a passage before the questions:',
      '# PASSAGE: |',
      '# Maya planted a seed. She watered it every day.',
      '# QUESTION 1: What did Maya plant?',
      '# ANSWER 1: a seed || seed'
    ].join('\n');
  }

  global.LearnFlowWorksheet = {
    SUBJECTS: SUBJECTS,
    TYPES: TYPES,
    parse: parse,
    example: example,
    templateForSubject: templateForSubject,
    emptyTemplate: templateForSubject
  };
})(window);
