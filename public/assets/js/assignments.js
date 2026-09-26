(function (global) {
  'use strict';

  var STORAGE_PREFIX = 'learnflow.assignment:';
  var SUBJECTS = ['Math', 'English', 'Social Studies', 'Science'];

  function text(value, max) {
    return String(value == null ? '' : value).trim().slice(0, max);
  }

  function normalize(studentId, input) {
    var raw = input && typeof input === 'object' ? input : {};
    var items = Array.isArray(raw.items) ? raw.items.slice(0, 20) : [];
    items = items.map(function (item, index) {
      var subject = SUBJECTS.indexOf(item && item.subject) >= 0 ? item.subject : 'Other';
      return {
        id: text(item && item.id, 80) || (subject.toLowerCase().replace(/\s+/g, '-') + '-' + (index + 1)),
        subject: subject,
        title: text(item && item.title, 120),
        details: text(item && item.details, 800),
        link: text(item && item.link, 500)
      };
    }).filter(function (item) { return item.title || item.details || item.link; });

    return {
      version: 1,
      student: text(studentId, 80),
      date: text(raw.date, 30),
      dueDate: text(raw.dueDate, 30),
      note: text(raw.note, 800),
      items: items,
      updatedAt: text(raw.updatedAt, 50) || new Date().toISOString()
    };
  }

  function localKey(studentId) {
    return STORAGE_PREFIX + encodeURIComponent(studentId);
  }

  function readLocal(studentId) {
    try {
      var raw = global.localStorage.getItem(localKey(studentId));
      return raw ? normalize(studentId, JSON.parse(raw)) : null;
    } catch (error) {
      return null;
    }
  }

  function writeLocal(studentId, assignment) {
    try {
      global.localStorage.setItem(localKey(studentId), JSON.stringify(normalize(studentId, assignment)));
    } catch (error) {
      // Storage can be disabled by a school browser; the caller still gets the server result.
    }
  }

  function responseJson(response) {
    var type = response.headers.get('content-type') || '';
    if (!type.includes('application/json')) {
      throw new Error('Assignment service is not connected');
    }
    return response.json();
  }

  function load(studentId, token) {
    var headers = token ? { Authorization: 'Bearer ' + token } : {};
    return fetch('/api/assignments/' + encodeURIComponent(studentId), { cache: 'no-store', headers: headers })
      .then(function (response) {
        if (!response.ok) throw new Error('Assignment service returned ' + response.status);
        return responseJson(response);
      })
      .then(function (data) {
        var assignment = data && (data.assignment || data.content);
        if (assignment) {
          var normalized = normalize(studentId, assignment);
          writeLocal(studentId, normalized);
          return { assignment: normalized, source: 'server' };
        }
        return { assignment: readLocal(studentId), source: 'local' };
      })
      .catch(function () {
        return { assignment: readLocal(studentId), source: 'local' };
      });
  }

  function save(studentId, assignment, token) {
    var normalized = normalize(studentId, assignment);
    var replaceSubjects = Array.isArray(assignment && assignment.replaceSubjects)
      ? assignment.replaceSubjects.filter(function (subject, index, list) {
        return SUBJECTS.indexOf(subject) >= 0 && list.indexOf(subject) === index;
      })
      : SUBJECTS.slice();
    var payload = Object.assign({}, normalized, { replaceSubjects: replaceSubjects });
    return fetch('/api/assignments/' + encodeURIComponent(studentId), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {})
      },
      body: JSON.stringify(payload)
    })
      .then(function (response) {
        if (response.status === 401 || response.status === 403) {
          return responseJson(response).then(function (data) {
            throw new Error(data.error || 'Admin authorization required');
          });
        }
        if (!response.ok) throw new Error('Assignment service returned ' + response.status);
        return responseJson(response);
      })
      .then(function (data) {
        var saved = normalize(studentId, data.assignment || data.content || normalized);
        writeLocal(studentId, saved);
        return { assignment: saved, source: 'server' };
      })
      .catch(function (error) {
        if (error && /authorization|required|401|403/i.test(error.message || '')) throw error;
        writeLocal(studentId, normalized);
        return { assignment: normalized, source: 'local', warning: 'Saved on this browser only until the assignment service is connected.' };
      });
  }

  global.LearnFlowAssignments = {
    SUBJECTS: SUBJECTS,
    normalize: normalize,
    load: load,
    save: save
  };
})(window);
