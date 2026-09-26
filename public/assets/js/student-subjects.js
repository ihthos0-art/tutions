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
  subjectsPanel.append(createElement('p', 'intro', 'Choose a subject, then pick any topic you want to study.'));
  const grid = createElement('div', 'subject-grid');
  grid.setAttribute('aria-label', 'Subjects');
  const topicExplorer = createElement('section', 'topic-explorer');
  topicExplorer.hidden = true;
  let topicMap = null;
  let topicMapRequest = null;
  for (const subject of subjects) {
    const subjectCard = createElement('article', 'subject-card');
    subjectCard.append(createElement('h2', '', subject));
    const openTopics = createElement('button', 'subject-open', 'Explore topics');
    openTopics.type = 'button';
    openTopics.addEventListener('click', () => openSubjectTopics(subject));
    subjectCard.append(openTopics);
    grid.append(subjectCard);
  }
  subjectsPanel.append(grid, topicExplorer);

  function activateTab(tab) {
    const assigned = tab === 'assigned';
    assignedTab.classList.toggle('active', assigned);
    subjectsTab.classList.toggle('active', !assigned);
    assignedTab.setAttribute('aria-selected', String(assigned));
    subjectsTab.setAttribute('aria-selected', String(!assigned));
    assignedPanel.classList.toggle('active', assigned);
    subjectsPanel.classList.toggle('active', !assigned);
    if (!assigned) loadTopicMap();
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

  const curriculumImageHosts = new Set([
    'upload.wikimedia.org', 'thumb.wikimedia.org', 'images.metmuseum.org', 'www.nps.gov'
  ]);

  function curriculumImageSource(value) {
    if (typeof value !== 'string') return null;
    if (/^\/assets\/curriculum\/(?:[a-z0-9][a-z0-9._-]{0,150}\/)*[a-z0-9][a-z0-9._-]{0,150}$/i.test(value)) return value;
    if (/^images\/(?:[a-z0-9][a-z0-9._-]{0,150}\/)*[a-z0-9][a-z0-9._-]{0,150}$/i.test(value)) {
      return '/assets/curriculum/' + value;
    }
    const url = safeLink(value);
    if (!url || url.protocol !== 'https:' || !curriculumImageHosts.has(url.hostname.toLowerCase())) return null;
    return url.href;
  }

  function markdownVisual(topic, source, alt) {
    const listed = topic && Array.isArray(topic.visuals)
      ? topic.visuals.find((visual) => visual && (visual.sourcePath === source || visual.src === source))
      : null;
    const src = listed ? listed.src : source;
    return { ...(listed || {}), src, alt: listed && listed.alt ? listed.alt : alt, sourceUrl: /^https:\/\//i.test(src) ? src : '' };
  }

  function appendMarkdownInline(parent, text, topic) {
    const token = /(!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)|\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)|\*\*([^*]+)\*\*|__([^_]+)__|`([^`]+)`|\*([^*]+)\*)/g;
    let cursor = 0;
    let match;
    while ((match = token.exec(text))) {
      if (match.index > cursor) parent.append(document.createTextNode(text.slice(cursor, match.index)));
      if (match[2] !== undefined) {
        appendInlineStudyImage(parent, markdownVisual(topic, match[3], match[2]));
      } else if (match[4] !== undefined) {
        const url = safeLink(match[5]);
        if (!url || url.protocol !== 'https:') parent.append(document.createTextNode(match[4]));
        else {
          const link = createElement('a', '', match[4]);
          link.href = url.href;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          parent.append(link);
        }
      } else if (match[6] !== undefined || match[7] !== undefined) {
        parent.append(createElement('strong', '', match[6] || match[7]));
      } else if (match[8] !== undefined) {
        parent.append(createElement('code', 'topic-inline-code', match[8]));
      } else {
        parent.append(createElement('em', '', match[9]));
      }
      cursor = token.lastIndex;
    }
    if (cursor < text.length) parent.append(document.createTextNode(text.slice(cursor)));
  }

  function appendInlineStudyImage(parent, visual) {
    const src = visual && curriculumImageSource(visual.src);
    if (!src) {
      parent.append(createElement('span', 'topic-visual-missing', visual && visual.alt || 'A visual for this topic could not be loaded.'));
      return;
    }
    const image = createElement('img', 'lesson-inline-image');
    image.src = src;
    image.alt = visual.alt || '';
    image.loading = 'lazy';
    image.decoding = 'async';
    image.referrerPolicy = 'no-referrer';
    const fallback = createElement('span', 'topic-visual-missing', visual.alt || 'A visual for this topic could not be loaded.');
    fallback.hidden = true;
    image.addEventListener('error', () => { image.hidden = true; fallback.hidden = false; }, { once: true });
    parent.append(image, fallback);
  }

  function renderMarkdown(parent, markdown, topic) {
    if (typeof markdown !== 'string' || !markdown) return;
    const lines = markdown.replace(/\r\n/g, '\n').split('\n');
    let paragraph = [];
    let list = null;

    function flushParagraph() {
      if (!paragraph.length) return;
      const node = createElement('p', 'study-copy');
      appendMarkdownInline(node, paragraph.join('\n'), topic);
      parent.append(node);
      paragraph = [];
    }

    function closeList() { list = null; }

    function splitTableRow(line) {
      return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) {
        flushParagraph();
        closeList();
        continue;
      }
      if (/^\s*<!--/.test(line)) continue;
      const fence = line.match(/^\s*```/);
      if (fence) {
        flushParagraph();
        closeList();
        const code = [];
        for (i++; i < lines.length && !/^\s*```/.test(lines[i]); i++) code.push(lines[i]);
        const pre = createElement('pre', 'topic-code-block');
        pre.textContent = code.join('\n');
        parent.append(pre);
        continue;
      }
      const heading = line.match(/^(#{1,6})\s+(.+)$/);
      if (heading) {
        flushParagraph();
        closeList();
        const level = heading[1].length;
        parent.append(createElement(level >= 4 ? 'h4' : 'h3', 'lesson-section-title', heading[2]));
        continue;
      }
      if (/^\s*(?:---+|___+|\*\*\*+)\s*$/.test(line)) {
        flushParagraph();
        closeList();
        parent.append(createElement('hr', 'topic-divider'));
        continue;
      }
      if (line.includes('|') && i + 1 < lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1])) {
        flushParagraph();
        closeList();
        const table = createElement('table', 'topic-content-table');
        const header = createElement('thead');
        const headerRow = createElement('tr');
        splitTableRow(line).forEach((cell) => {
          const th = createElement('th');
          appendMarkdownInline(th, cell, topic);
          headerRow.append(th);
        });
        header.append(headerRow);
        table.append(header);
        i += 2;
        const body = createElement('tbody');
        while (i < lines.length && lines[i].includes('|')) {
          const row = createElement('tr');
          splitTableRow(lines[i]).forEach((cell) => {
            const td = createElement('td');
            appendMarkdownInline(td, cell, topic);
            row.append(td);
          });
          body.append(row);
          i++;
        }
        i--;
        table.append(body);
        parent.append(table);
        continue;
      }
      const image = line.match(/^\s*!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)\s*$/);
      if (image) {
        flushParagraph();
        closeList();
        appendStudyImage(parent, markdownVisual(topic, image[2], image[1]));
        continue;
      }
      if (/^\s*>\s?/.test(line)) {
        flushParagraph();
        closeList();
        const quote = createElement('blockquote', 'topic-quote');
        appendMarkdownInline(quote, line.replace(/^\s*>\s?/, ''), topic);
        parent.append(quote);
        continue;
      }
      const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
      const unordered = line.match(/^\s*[-+*]\s+(.+)$/);
      if (ordered || unordered) {
        flushParagraph();
        const orderedList = Boolean(ordered);
        if (!list || (list.tagName === 'OL') !== orderedList) {
          list = createElement(orderedList ? 'ol' : 'ul', 'topic-content-list');
          parent.append(list);
        }
        const item = createElement('li');
        appendMarkdownInline(item, (ordered || unordered)[1], topic);
        list.append(item);
        continue;
      }
      closeList();
      paragraph.push(line);
    }
    flushParagraph();
  }

  function loadTopicMap() {
    if (topicMap) return Promise.resolve(topicMap);
    if (topicMapRequest) return topicMapRequest;
    topicMapRequest = fetch('/api/curriculum/' + encodeURIComponent(studentId) + '/map', {
      headers: { Authorization: 'Bearer ' + auth.token },
      cache: 'no-store'
    }).then((response) => response.json().then((data) => {
      if (!response.ok) throw new Error(data.error || 'Could not load study topics.');
      return data;
    })).then((data) => {
      topicMap = data;
      return topicMap;
    }).catch((error) => {
      topicMapRequest = null;
      throw error;
    });
    return topicMapRequest;
  }

  function showAllSubjects() {
    topicExplorer.hidden = true;
    grid.hidden = false;
  }

  function openSubjectTopics(subject) {
    topicExplorer.replaceChildren(createElement('p', 'topic-status', 'Loading topics…'));
    grid.hidden = true;
    topicExplorer.hidden = false;
    loadTopicMap().then((map) => renderSubjectTopics(subject, map)).catch((error) => {
      topicExplorer.replaceChildren();
      const back = createElement('button', 'topic-back', '← All subjects');
      back.type = 'button';
      back.addEventListener('click', showAllSubjects);
      topicExplorer.append(back, createElement('p', 'topic-status error-message', error.message || 'Could not load study topics.'));
    });
  }

  function renderSubjectTopics(subject, map) {
    topicExplorer.replaceChildren();
    const back = createElement('button', 'topic-back', '← All subjects');
    back.type = 'button';
    back.addEventListener('click', showAllSubjects);
    topicExplorer.append(back);
    topicExplorer.append(createElement('h2', 'topic-map-title', subject + ' topics'));
    if (map && map.gradeScopeNoteMarkdown) {
      const scope = createElement('section', 'topic-guide-scope');
      renderMarkdown(scope, map.gradeScopeNoteMarkdown);
      topicExplorer.append(scope);
    }
    const subjectNotes = map && map.subjectNotesMarkdown && map.subjectNotesMarkdown[subject];
    if (typeof subjectNotes === 'string' && subjectNotes.trim()) {
      const details = createElement('details', 'topic-guide-details');
      details.append(createElement('summary', '', 'About this subject and its published scope'));
      const body = createElement('div', 'topic-guide-note-body');
      renderMarkdown(body, subjectNotes);
      details.append(body);
      topicExplorer.append(details);
    }
    const subjectVisuals = map && map.subjectNoteVisuals && Array.isArray(map.subjectNoteVisuals[subject])
      ? map.subjectNoteVisuals[subject]
      : [];
    if (subjectVisuals.length) {
      const visuals = createElement('section', 'topic-map-visuals');
      subjectVisuals.forEach((visual) => appendStudyImage(visuals, visual));
      topicExplorer.append(visuals);
    }
    if (map && typeof map.gradeNotesMarkdown === 'string' && map.gradeNotesMarkdown.trim()) {
      const details = createElement('details', 'topic-guide-details');
      details.append(createElement('summary', '', 'Guide-wide source notes and released examples'));
      const body = createElement('div', 'topic-guide-note-body');
      renderMarkdown(body, map.gradeNotesMarkdown);
      details.append(body);
      topicExplorer.append(details);
    }
    const topics = map && map.subjects && Array.isArray(map.subjects[subject]) ? map.subjects[subject] : [];
    if (!topics.length) {
      topicExplorer.append(createElement('p', 'topic-status', 'No study topics have been added for this grade yet.'));
      return;
    }
    const list = createElement('div', 'topic-list');
    topics.forEach((topic) => {
      const choice = createElement('button', 'topic-choice');
      choice.type = 'button';
      choice.append(createElement('span', 'topic-choice-title', topic.title));
      if (topic.objective) choice.append(createElement('span', 'topic-choice-objective', topic.objective));
      const details = [];
      if (Number.isFinite(topic.estimatedMinutes)) details.push(topic.estimatedMinutes + ' min');
      if (topic.hasVisual) details.push('visuals included');
      if (topic.progress && topic.progress.total) details.push(topic.progress.correct + '/' + topic.progress.total + ' on latest check');
      else if (topic.progress && topic.progress.needsReview) details.push('answer guide reviewed');
      if (details.length) choice.append(createElement('span', 'topic-choice-meta', details.join(' · ')));
      choice.addEventListener('click', () => openStudyTopic(topic));
      list.append(choice);
    });
    topicExplorer.append(list);
  }

  function openStudyTopic(topicSummary) {
    topicExplorer.replaceChildren(createElement('p', 'topic-status', 'Loading topic…'));
    fetch('/api/curriculum/' + encodeURIComponent(studentId) + '/topic/' + encodeURIComponent(topicSummary.id), {
      headers: { Authorization: 'Bearer ' + auth.token },
      cache: 'no-store'
    }).then((response) => response.json().then((data) => {
      if (!response.ok) throw new Error(data.error || 'Could not load this topic.');
      return data.topic;
    })).then((topic) => renderStudyTopic(topic)).catch((error) => {
      topicExplorer.replaceChildren();
      const back = createElement('button', 'topic-back', '← ' + (topicSummary.subject || 'Topics'));
      back.type = 'button';
      back.addEventListener('click', () => renderSubjectTopics(topicSummary.subject, topicMap));
      topicExplorer.append(back, createElement('p', 'topic-status error-message', error.message || 'Could not load this topic.'));
    });
  }

  function appendStudyImage(parent, visual) {
    const src = visual && curriculumImageSource(visual.src);
    if (!src) {
      const description = visual && [visual.alt, visual.caption, visual.description, visual.src]
        .filter((value) => typeof value === 'string' && value.trim()).join(' — ');
      parent.append(createElement('p', 'topic-visual-missing', description || 'A visual for this topic could not be loaded.'));
      return;
    }
    const figure = createElement('figure', 'lesson-figure');
    const image = createElement('img', 'lesson-image');
    image.src = src;
    image.alt = visual.alt || '';
    image.loading = 'lazy';
    image.decoding = 'async';
    image.referrerPolicy = 'no-referrer';
    image.addEventListener('error', () => {
      image.hidden = true;
      const error = createElement('p', 'lesson-image-error', 'This visual did not load. The written material remains available. ');
      const source = safeLink(visual.sourceUrl || visual.src);
      if (source && source.protocol === 'https:') {
        const link = createElement('a', '', 'Open image source');
        link.href = source.href;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        error.append(link);
      }
      figure.append(error);
    }, { once: true });
    figure.append(image);
    if (visual.caption || visual.credit) {
      const caption = createElement('figcaption', 'lesson-caption');
      if (visual.caption) caption.append(createElement('span', '', visual.caption));
      if (visual.credit) {
        const link = safeLink(visual.sourceUrl);
        const credit = link && link.protocol === 'https:'
          ? createElement('a', 'lesson-credit', visual.credit)
          : createElement('span', 'lesson-credit', visual.credit);
        if (link && link.protocol === 'https:') {
          credit.href = link.href;
          credit.target = '_blank';
          credit.rel = 'noopener noreferrer';
        }
        caption.append(credit);
      }
      figure.append(caption);
    }
    parent.append(figure);
  }

  function appendTopicBlocks(parent, blocks) {
    blocks.forEach((block) => {
      if (typeof block === 'string') {
        parent.append(createElement('p', 'study-copy', block));
        return;
      }
      if (!block || typeof block !== 'object') {
        if (block != null) parent.append(createElement('p', 'study-copy', String(block)));
        return;
      }
      const text = typeof block.text === 'string' ? block.text : (typeof block.content === 'string' ? block.content : '');
      if (block.type === 'heading') {
        const level = Number(block.level);
        parent.append(createElement(level >= 3 ? 'h4' : 'h3', 'lesson-section-title', text));
      } else if (block.type === 'list' && Array.isArray(block.items)) {
        const list = createElement(block.ordered ? 'ol' : 'ul', 'topic-content-list');
        block.items.forEach((item) => list.append(createElement('li', '', typeof item === 'string' ? item : String(item && item.text || ''))));
        parent.append(list);
      } else if (block.type === 'image' || block.type === 'diagram') {
        appendStudyImage(parent, block.visual || block);
      } else if (block.type === 'quote') {
        parent.append(createElement('blockquote', 'topic-quote', text));
      } else if (block.type === 'callout') {
        const callout = createElement('aside', 'topic-callout');
        if (block.title) callout.append(createElement('strong', '', block.title));
        callout.append(createElement('p', 'study-copy', text));
        parent.append(callout);
      } else if (block.type === 'table' && Array.isArray(block.rows)) {
        const table = createElement('table', 'topic-content-table');
        block.rows.forEach((row, rowIndex) => {
          const tr = createElement('tr');
          (Array.isArray(row) ? row : [row]).forEach((cell) => {
            const td = createElement(rowIndex === 0 && block.hasHeader ? 'th' : 'td');
            td.textContent = typeof cell === 'string' ? cell : String(cell == null ? '' : cell);
            tr.append(td);
          });
          table.append(tr);
        });
        parent.append(table);
      } else if (['paragraph', 'text'].includes(block.type) || (!block.type && text)) {
        parent.append(createElement('p', 'study-copy', text));
      } else {
        // Keep unfamiliar authored block types visible until their renderer is
        // added. textContent prevents markup in the source from executing.
        parent.append(createElement('pre', 'topic-structured-fallback', JSON.stringify(block, null, 2)));
      }
    });
  }

  function renderTopicPractice(parent, topic) {
    const questions = Array.isArray(topic.questions) ? topic.questions : [];
    const practice = createElement('section', 'topic-practice');
    practice.append(createElement('h2', 'topic-map-title', 'Practice'));
    if (!questions.length) return;
    const form = createElement('form', 'worksheet-form');
    const fields = [];
    questions.forEach((question, index) => {
      const card = createElement('label', 'topic-question');
      card.append(createElement('span', 'topic-question-number', 'Question ' + (index + 1)));
      card.append(createElement('span', 'worksheet-prompt', question.prompt || ''));
      let field;
      if (Array.isArray(question.choices) && question.choices.length) {
        field = createElement('select', 'worksheet-answer');
        const placeholder = createElement('option', '', 'Choose an answer');
        placeholder.value = '';
        field.append(placeholder);
        question.choices.forEach((choice) => {
          const value = typeof choice === 'string' ? choice : String(choice && (choice.value || choice.label) || '');
          if (value) field.append(createElement('option', '', value));
        });
      } else if (question.kind === 'reflection' || question.kind === 'long-answer') {
        field = createElement('textarea', 'worksheet-answer topic-long-answer');
        field.rows = 4;
      } else {
        field = createElement('input', 'worksheet-answer');
        field.type = 'text';
      }
      field.name = question.id;
      field.maxLength = 3000;
      field.dataset.questionId = question.id;
      field.setAttribute('aria-label', 'Answer for question ' + (index + 1));
      card.append(field);
      fields.push(field);
      form.append(card);
    });
    const actions = createElement('div', 'worksheet-actions');
    const check = createElement('button', 'worksheet-check', adminPreview ? 'Read-only preview' : 'Check answers');
    check.type = 'submit';
    check.disabled = adminPreview;
    const status = createElement('p', 'worksheet-result', adminPreview ? 'Answer checking is disabled in the admin preview.' : '');
    status.setAttribute('role', 'status');
    actions.append(check, status);
    form.append(actions);
    if (!adminPreview) form.addEventListener('submit', (event) => {
      event.preventDefault();
      const answers = Object.fromEntries(fields.map((field) => [field.dataset.questionId, field.value]));
      check.disabled = true;
      status.textContent = 'Checking…';
      fetch('/api/curriculum/' + encodeURIComponent(studentId) + '/topic/' + encodeURIComponent(topic.id) + '/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + auth.token },
        body: JSON.stringify({ answers })
      }).then((response) => response.json().then((data) => {
        if (!response.ok) throw new Error(data.error || 'Could not check answers.');
        return data;
      })).then((data) => {
        status.textContent = data.total
          ? data.correct + ' of ' + data.total + ' correct.' + (data.needsReview ? ' Compare ' + data.needsReview + ' written response(s) with the sample.' : '')
          : (data.needsReview ? 'Compare your written response(s) with the sample answer(s).' : 'Submit at least one answer to check your work.');
        status.classList.toggle('worksheet-perfect', data.total > 0 && data.correct === data.total);
        const results = new Map((data.results || []).map((item) => [item.id, item]));
        form.querySelectorAll('.topic-feedback').forEach((node) => node.remove());
        fields.forEach((field) => {
          const result = results.get(field.dataset.questionId);
          if (!result || result.status === 'unanswered') return;
          const feedback = createElement('div', 'topic-feedback');
          const resultLabel = result.status === 'correct' ? 'Correct.' : result.status === 'review' ? 'Self-check.' : 'Try again next time.';
          feedback.append(createElement('strong', '', resultLabel));
          if (result.feedback) feedback.append(createElement('p', '', result.feedback));
          if (result.modelAnswer) {
            const sample = createElement('div', 'topic-model-answer');
            sample.append(createElement('h4', '', result.status === 'review' ? 'Checked responses' : 'Sample answer'));
            renderMarkdown(sample, result.modelAnswer, topic);
            feedback.append(sample);
          }
          field.closest('.topic-question').append(feedback);
        });
        if (topicMap && topicMap.subjects && Array.isArray(topicMap.subjects[topic.subject])) {
          const summary = topicMap.subjects[topic.subject].find((item) => item.id === topic.id);
          if (summary) summary.progress = { correct: data.correct, total: data.total, needsReview: data.needsReview };
        }
      }).catch((error) => {
        status.textContent = error.message || 'Could not check answers.';
        status.classList.remove('worksheet-perfect');
      }).finally(() => { check.disabled = false; });
    });
    practice.append(form);
    parent.append(practice);
  }

  function renderStudyTopic(topic) {
    topicExplorer.replaceChildren();
    const back = createElement('button', 'topic-back', '← ' + topic.subject + ' topics');
    back.type = 'button';
    back.addEventListener('click', () => renderSubjectTopics(topic.subject, topicMap));
    topicExplorer.append(back);
    topicExplorer.append(createElement('p', 'eyebrow', topic.subject));
    topicExplorer.append(createElement('h2', 'study-topic-title', topic.title));
    if (topic.objective) topicExplorer.append(createElement('p', 'topic-objective', topic.objective));
    if (topic.scopeNote) topicExplorer.append(createElement('p', 'worksheet-scope-note', topic.scopeNote));

    const body = createElement('div', 'study-topic-body');
    if (typeof topic.contentMarkdown === 'string' && topic.contentMarkdown.length) {
      renderMarkdown(body, topic.contentMarkdown, topic);
    } else if (Array.isArray(topic.contentBlocks) && topic.contentBlocks.length) appendTopicBlocks(body, topic.contentBlocks);
    if (typeof topic.content === 'string' && topic.content.length) body.append(createElement('div', 'study-copy', topic.content));
    for (const sections of [topic.reading, topic.sections]) {
      if (!Array.isArray(sections)) continue;
      sections.forEach((section) => {
        if (typeof section === 'string') {
          body.append(createElement('p', 'study-copy', section));
          return;
        }
        if (!section || typeof section !== 'object') return;
        const article = createElement('section', 'worksheet-reading');
        if (section.heading) article.append(createElement('h3', 'lesson-section-title', section.heading));
        if (Array.isArray(section.contentBlocks)) appendTopicBlocks(article, section.contentBlocks);
        (Array.isArray(section.paragraphs) ? section.paragraphs : []).forEach((paragraph) => {
          article.append(createElement('p', 'study-copy', String(paragraph)));
        });
        if (typeof section.text === 'string') article.append(createElement('p', 'study-copy', section.text));
        if (typeof section.content === 'string') article.append(createElement('p', 'study-copy', section.content));
        if (Array.isArray(section.visuals)) section.visuals.forEach((visual) => appendStudyImage(article, visual));
        body.append(article);
      });
    }
    for (const key of ['introduction', 'explanation', 'passage', 'body']) {
      if (typeof topic[key] === 'string' && topic[key].length) body.append(createElement('div', 'study-copy', topic[key]));
    }
    if (body.childElementCount) topicExplorer.append(body);
    else topicExplorer.append(createElement('p', 'topic-status', 'Study text will appear here with the topic materials.'));

    if (Array.isArray(topic.vocabulary) && topic.vocabulary.length) {
      const list = createElement('dl', 'topic-vocabulary');
      topic.vocabulary.forEach((entry) => {
        list.append(createElement('dt', '', entry.term || ''));
        list.append(createElement('dd', '', entry.definition || ''));
      });
      topicExplorer.append(createElement('h3', 'lesson-section-title', 'Key vocabulary'), list);
    }
    if (Array.isArray(topic.workedExamples) && topic.workedExamples.length) {
      const examples = createElement('section', 'worked-examples');
      examples.append(createElement('h3', 'lesson-section-title', 'Worked examples'));
      topic.workedExamples.forEach((example) => {
        const item = createElement('article', 'worked-example');
        if (example.title) item.append(createElement('h4', '', example.title));
        const steps = createElement('ol', 'worked-example-steps');
        (Array.isArray(example.steps) ? example.steps : []).forEach((step) => steps.append(createElement('li', '', step)));
        item.append(steps);
        examples.append(item);
      });
      topicExplorer.append(examples);
    }
    if (Array.isArray(topic.visuals) && topic.visuals.length) {
      const inlineMarkdown = typeof topic.contentMarkdown === 'string' ? topic.contentMarkdown : '';
      const extraVisuals = topic.visuals.filter((visual) => !visual.sourcePath || !inlineMarkdown.includes('(' + visual.sourcePath + ')'));
      const figures = createElement('div', 'worksheet-figures');
      extraVisuals.forEach((visual) => appendStudyImage(figures, visual));
      if (figures.childElementCount) topicExplorer.append(figures);
    }
    if (Array.isArray(topic.sources) && topic.sources.length) {
      const sources = createElement('details', 'lesson-sources');
      sources.append(createElement('summary', '', 'Sources and further reading'));
      const list = createElement('ul', 'lesson-source-list');
      topic.sources.forEach((source) => {
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
      topicExplorer.append(sources);
    }
    renderTopicPractice(topicExplorer, topic);
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
