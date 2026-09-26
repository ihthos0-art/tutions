(function () {
  'use strict';

  if (window.__LEARNFLOW_AUTH_BLOCKED) return;
  const auth = window.LEARNFLOW_AUTH;
  const adminPreview = Boolean(
    document.body.dataset.adminPreview === 'true' &&
    window.parent !== window &&
    auth && auth.role === 'admin' && auth.adminPreview === true
  );
  if (!auth || (auth.role !== 'student' && !adminPreview)) return;

  const subjects = ['Math', 'English', 'Social Studies', 'Science'];
  const pageId = document.currentScript && document.currentScript.dataset.student;
  const requestedId = adminPreview
    ? auth.studentId
    : new URLSearchParams(window.location.search).get('student');
  const routeStudentId = pageId === 'salma-khadija'
    ? (requestedId === 'khadija' ? 'khadija' : 'salma')
    : pageId === 'nabila-naviha'
      ? (['nabila', 'naviha'].includes(requestedId) ? requestedId : 'nabila-naviha')
      : pageId;
  const combinedPage = pageId === 'salma-khadija' || pageId === 'nabila-naviha';
  if (!adminPreview && auth.studentId !== routeStudentId && !(combinedPage && ['salma', 'khadija', 'nabila', 'naviha'].includes(auth.studentId))) {
    window.location.replace('/login');
    return;
  }
  const studentId = auth.studentId || routeStudentId;
  const studentName = typeof auth.studentName === 'string' ? auth.studentName.trim() : '';
  const studentGrade = Number.isInteger(Number(auth.studentGrade)) ? Number(auth.studentGrade) : null;

  const stylesheet = createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = 'assets/css/student-subjects.css';
  document.head.append(stylesheet);

  const root = createElement('main', 'dashboard');
  root.id = 'student-dashboard';
  root.setAttribute('aria-live', 'polite');
  document.body.replaceChildren(root);

  function createElement(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function appendMenuLink(parent) {
    const link = createElement('a', 'back-link', adminPreview ? '← Admin panel' : '← All students');
    link.href = adminPreview ? '/parent' : '/';
    parent.append(link);
  }

  if (!studentName) {
    document.title = 'Student not found';
    appendMenuLink(root);
    root.append(createElement('p', 'error-message', 'This student page could not be found.'));
    return;
  }

  document.title = studentName + ' | Subjects';
  if (adminPreview) {
    const notice = createElement('aside', 'admin-preview-notice', 'Admin preview · Read-only student view');
    root.append(notice);
  }
  appendMenuLink(root);

  const card = createElement('section', 'dashboard-card');
  card.setAttribute('aria-labelledby', 'student-title');
  if (studentGrade) card.append(createElement('p', 'eyebrow', 'Grade ' + studentGrade));
  const heading = createElement('h1', '', studentName + '’s Subjects');
  heading.id = 'student-title';
  card.append(heading);

  const tabBar = createElement('div', 'dashboard-tabs');
  tabBar.setAttribute('role', 'tablist');
  const assignedTab = createElement('button', 'dashboard-tab active', 'Assigned');
  const subjectsTab = createElement('button', 'dashboard-tab', 'Subjects');
  assignedTab.type = 'button';
  subjectsTab.type = 'button';
  assignedTab.setAttribute('role', 'tab');
  subjectsTab.setAttribute('role', 'tab');
  assignedTab.setAttribute('aria-selected', 'true');
  subjectsTab.setAttribute('aria-selected', 'false');
  tabBar.append(assignedTab, subjectsTab);

  const assignedPanel = createElement('section', 'dashboard-panel active');
  assignedPanel.id = 'assigned-panel';
  assignedPanel.setAttribute('role', 'tabpanel');
  assignedPanel.append(createElement('h2', 'panel-title', 'Assigned work'));
  const assignedStatus = createElement('p', 'assignment-status', 'Loading assignments…');
  assignedPanel.append(assignedStatus);
  const worksheetHost = createElement('div', 'worksheet-host');
  assignedPanel.append(worksheetHost);
  const assignedList = createElement('div', 'assignment-list');
  assignedPanel.append(assignedList);

  const subjectsPanel = createElement('section', 'dashboard-panel');
  subjectsPanel.id = 'subjects-panel';
  subjectsPanel.setAttribute('role', 'tabpanel');
  subjectsPanel.append(createElement('p', 'intro', 'Choose a subject.'));
  const grid = createElement('div', 'subject-grid');
  grid.setAttribute('aria-label', 'Subjects');
  for (const subject of subjects) {
    const subjectCard = createElement('article', 'subject-card');
    subjectCard.append(createElement('h2', '', subject));
    subjectCard.append(createElement('span', 'subject-status', 'Lesson in Assigned work'));
    grid.append(subjectCard);
  }
  subjectsPanel.append(grid);

  function activateTab(tab) {
    const assigned = tab === 'assigned';
    assignedTab.classList.toggle('active', assigned);
    subjectsTab.classList.toggle('active', !assigned);
    assignedTab.setAttribute('aria-selected', String(assigned));
    subjectsTab.setAttribute('aria-selected', String(!assigned));
    assignedPanel.classList.toggle('active', assigned);
    subjectsPanel.classList.toggle('active', !assigned);
  }

  assignedTab.addEventListener('click', () => activateTab('assigned'));
  subjectsTab.addEventListener('click', () => activateTab('subjects'));
  card.append(tabBar, assignedPanel, subjectsPanel);
  root.append(card);

  function safeLink(value) {
    if (!value) return null;
    try {
      const url = new URL(value, window.location.origin);
      if (!['http:', 'https:'].includes(url.protocol)) return null;
      return url;
    } catch (error) {
      return null;
    }
  }

  function renderAssignments(result) {
    assignedList.replaceChildren();
    const assignment = result && result.assignment;
    const items = assignment && Array.isArray(assignment.items) ? assignment.items : [];
    if (!items.length) {
      assignedStatus.textContent = result && result.source === 'local'
        ? 'No assignments published yet. Your teacher can add today’s work from the admin panel.'
        : 'No assignments published yet.';
      if (assignment && assignment.note) {
        assignedList.append(createElement('p', 'assignment-note', assignment.note));
      }
      return;
    }

    const dateText = assignment.date ? ' · ' + assignment.date : '';
    assignedStatus.textContent = (result.source === 'local' ? 'Browser preview' : 'Published') + dateText;
    if (assignment.note) assignedList.append(createElement('p', 'assignment-note', assignment.note));

    items.forEach((item) => {
      const card = createElement('article', 'assignment-item');
      card.append(createElement('p', 'assignment-subject', item.subject || 'Assigned work'));
      if (item.title) card.append(createElement('h3', '', item.title));
      if (item.details) card.append(createElement('p', 'assignment-details', item.details));
      const url = safeLink(item.link);
      if (url) {
        const link = createElement('a', 'assignment-link', 'Open resource →');
        link.href = url.href;
        if (url.origin !== window.location.origin) {
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
        }
        card.append(link);
      }
      assignedList.append(card);
    });
  }

  function renderWorksheet(worksheet) {
    if (!worksheet || !Array.isArray(worksheet.questions) || !worksheet.questions.length) return;

    const section = createElement('section', 'student-worksheet');
    if (worksheet.subject) section.append(createElement('p', 'worksheet-subject', worksheet.subject));
    const heading = createElement('h2', 'worksheet-title', worksheet.title || 'Assigned practice');
    section.append(heading);
    if (worksheet.instructions) section.append(createElement('p', 'worksheet-instructions', worksheet.instructions));
    if (worksheet.scopeNote) section.append(createElement('p', 'worksheet-scope-note', worksheet.scopeNote));
    if (worksheet.passage) {
      const reading = createElement('section', 'worksheet-reading');
      reading.append(createElement('h3', 'lesson-section-title', 'Read first'));
      reading.append(createElement('div', 'worksheet-passage', worksheet.passage));
      section.append(reading);
    }
    if (worksheet.explanation) {
      const explanation = createElement('section', 'worksheet-explanation');
      explanation.append(createElement('h3', 'lesson-section-title', worksheet.subject === 'Math' ? 'Learn the idea' : 'Key idea'));
      explanation.append(createElement('p', 'lesson-copy', worksheet.explanation));
      section.append(explanation);
    }
    if (Array.isArray(worksheet.workedExamples) && worksheet.workedExamples.length) {
      const examples = createElement('section', 'worked-examples');
      examples.append(createElement('h3', 'lesson-section-title', 'Worked examples'));
      worksheet.workedExamples.forEach((example) => {
        const exampleCard = createElement('article', 'worked-example');
        if (example.title) exampleCard.append(createElement('h4', '', example.title));
        const steps = createElement('ol', 'worked-example-steps');
        (Array.isArray(example.steps) ? example.steps : []).forEach((step) => steps.append(createElement('li', '', step)));
        exampleCard.append(steps);
        examples.append(exampleCard);
      });
      section.append(examples);
    }
    if (Array.isArray(worksheet.visuals) && worksheet.visuals.length) {
      const figures = createElement('div', 'worksheet-figures');
      worksheet.visuals.forEach((visual) => {
        if (!visual || !/^\/assets\/curriculum\/[a-z0-9][a-z0-9._-]{0,150}$/i.test(visual.src || '')) return;
        const figure = createElement('figure', 'lesson-figure');
        const image = createElement('img', 'lesson-image');
        image.src = visual.src;
        image.alt = visual.alt || '';
        image.loading = 'lazy';
        image.decoding = 'async';
        image.addEventListener('error', () => {
          image.hidden = true;
          figure.append(createElement('p', 'lesson-image-error', 'This visual did not load. You can still complete the lesson using the explanation and questions.'));
        }, { once: true });
        figure.append(image);
        if (visual.caption || visual.credit) {
          const caption = createElement('figcaption', 'lesson-caption');
          if (visual.caption) caption.append(createElement('span', '', visual.caption));
          if (visual.credit) {
            const credit = visual.sourceUrl ? createElement('a', 'lesson-credit', visual.credit) : createElement('span', 'lesson-credit', visual.credit);
            if (visual.sourceUrl) {
              const link = safeLink(visual.sourceUrl);
              if (link && link.protocol === 'https:') {
                credit.href = link.href;
                credit.target = '_blank';
                credit.rel = 'noopener noreferrer';
              }
            }
            caption.append(credit);
          }
          figure.append(caption);
        }
        figures.append(figure);
      });
      if (figures.childElementCount) section.append(figures);
    }
    if (worksheet.modelTask) {
      const modelTask = createElement('aside', 'model-task');
      modelTask.append(createElement('h3', 'lesson-section-title', 'Show what you understand'));
      modelTask.append(createElement('p', '', worksheet.modelTask));
      section.append(modelTask);
    }

    const form = createElement('form', 'worksheet-form');
    form.noValidate = true;
    worksheet.questions.forEach((question, index) => {
      const row = createElement('label', 'worksheet-question');
      const prompt = createElement('span', 'worksheet-prompt', (index + 1) + '. ' + question.prompt);
      const answer = worksheet.type === 'reading' || worksheet.type === 'ela'
        ? createElement('textarea', 'worksheet-answer')
        : createElement('input', 'worksheet-answer');
      answer.dataset.questionId = question.id;
      answer.autocomplete = 'off';
      answer.placeholder = 'Your answer';
      if (adminPreview) answer.disabled = true;
      if (answer.tagName === 'TEXTAREA') answer.rows = 3;
      row.append(prompt, answer);
      form.append(row);
    });

    const actions = createElement('div', 'worksheet-actions');
    const checkButton = createElement('button', 'worksheet-check', adminPreview ? 'Read-only preview' : 'Check answers');
    checkButton.type = 'submit';
    checkButton.disabled = adminPreview;
    const status = createElement('p', 'worksheet-result', '');
    status.setAttribute('role', 'status');
    if (adminPreview) status.textContent = 'Answer checking is disabled in the admin preview.';
    actions.append(checkButton, status);
    form.append(actions);
    if (!adminPreview) form.addEventListener('submit', function (event) {
      event.preventDefault();
      const answers = {};
      form.querySelectorAll('[data-question-id]').forEach((input) => { answers[input.dataset.questionId] = input.value; });
      checkButton.disabled = true;
      status.textContent = 'Checking…';
      fetch('/api/homework/' + encodeURIComponent(studentId) + '/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + auth.token },
        body: JSON.stringify({ subject: worksheet.subject, answers })
      }).then((response) => response.json().then((data) => {
        if (!response.ok) throw new Error(data.error || 'Could not check answers.');
        return data;
      })).then((data) => {
        status.textContent = data.correct + ' of ' + data.total + ' correct.';
        status.classList.toggle('worksheet-perfect', data.correct === data.total);
      }).catch((error) => {
        status.textContent = error.message || 'Could not check answers.';
        status.classList.remove('worksheet-perfect');
      }).finally(() => { checkButton.disabled = false; });
    });
    section.append(form);
    if (Array.isArray(worksheet.sources) && worksheet.sources.length) {
      const sources = createElement('details', 'lesson-sources');
      sources.append(createElement('summary', '', 'Sources and further reading'));
      const list = createElement('ul', 'lesson-source-list');
      worksheet.sources.forEach((source) => {
        const url = safeLink(source.url);
        if (!url || url.protocol !== 'https:') return;
        const item = createElement('li', '');
        const link = createElement('a', '', source.title || url.hostname);
        link.href = url.href;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        item.append(link);
        list.append(item);
      });
      if (list.childElementCount) sources.append(list);
      section.append(sources);
    }
    worksheetHost.append(section);
  }

  fetch('/api/homework/' + encodeURIComponent(studentId), {
    headers: { Authorization: 'Bearer ' + auth.token },
    cache: 'no-store'
  }).then((response) => {
    if (!response.ok) throw new Error('Worksheet service returned ' + response.status);
    return response.json();
  }).then((data) => {
    const content = data && data.content;
    worksheetHost.replaceChildren();
    const assigned = content && content.assigned ? content.assigned : {};
    const worksheets = assigned.worksheets && typeof assigned.worksheets === 'object' ? assigned.worksheets : {};
    const published = subjects.map((subject) => worksheets[subject]).filter(Boolean);
    if (published.length) {
      published.forEach(renderWorksheet);
    } else {
      renderWorksheet(assigned.worksheet);
    }
  }).catch(() => { /* Assigned cards remain usable when no worksheet is published. */ });

  if (window.LearnFlowAssignments) {
    window.LearnFlowAssignments.load(studentId, auth.token).then(renderAssignments);
  } else {
    renderAssignments({ assignment: null, source: 'local' });
  }

  const footer = createElement('footer', 'student-site-footer');
  footer.append(createElement('span', '', 'LearnFlow · Educational practice workspace'));
  const footerLinks = createElement('span', 'student-site-links');
  const footerNavigation = [['About', '/about'], ['Privacy', '/privacy'], ['Terms', '/terms']];
  footerNavigation.push(adminPreview ? ['Admin panel', '/parent'] : ['Sign in', '/login']);
  footerNavigation
    .forEach(([label, href]) => {
      const link = createElement('a', '', label);
      link.href = href;
      footerLinks.append(link);
    });
  footer.append(footerLinks);
  root.append(footer);
})();
