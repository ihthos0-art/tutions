(function () {
  'use strict';

  var loginForm = document.getElementById('student-login-form');
  var setupForm = document.getElementById('set-pin-form');
  var nameInput = document.getElementById('student-name');
  var pinInput = document.getElementById('student-pin');
  var setupToken = '';

  if (!loginForm || !setupForm || !nameInput || !pinInput) return;

  function setMessage(id, message, visible) {
    var node = document.getElementById(id);
    if (!node) return;
    node.textContent = message || '';
    node.classList.toggle('is-visible', Boolean(visible));
  }

  function digitsOnly(input) {
    input.addEventListener('input', function () {
      input.value = input.value.replace(/\D/g, '').slice(0, 4);
    });
  }

  function normalizeName(value) {
    return value.trim().replace(/\s+/g, ' ');
  }

  function saveSession(data) {
    try {
      sessionStorage.setItem('learnflow.session', JSON.stringify({
        role: data.role,
        studentId: data.studentId || '',
        studentName: data.studentName || '',
        studentGrade: data.studentGrade || null,
        token: data.sessionToken || '',
        signedInAt: new Date().toISOString()
      }));
    } catch (error) {
      throw new Error('This browser is blocking session storage. Please ask your teacher for help.');
    }
  }

  function redirectAfterLogin(data) {
    var route = data.route || 'login';
    var query = data.query ? '?' + data.query : '';
    window.location.assign(route + query);
  }

  function postJson(path, body) {
    return fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (response) {
      var contentType = response.headers.get('content-type') || '';
      return response.json().catch(function () { return {}; }).then(function (data) {
        if (response.status === 405 || !contentType.includes('application/json')) {
          throw new Error('Sign-in service is not connected yet. Ask your site administrator for help.');
        }
        if (!response.ok) throw new Error(data.error || 'Sign-in failed.');
        return data;
      });
    });
  }

  digitsOnly(pinInput);
  digitsOnly(document.getElementById('new-pin'));
  digitsOnly(document.getElementById('confirm-pin'));

  loginForm.addEventListener('submit', function (event) {
    event.preventDefault();
    setMessage('login-error', '', false);
    var name = normalizeName(nameInput.value);
    var pin = pinInput.value.trim();
    if (!name) {
      setMessage('login-error', 'Enter your name to continue.', true);
      nameInput.focus();
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      setMessage('login-error', 'Your PIN must be exactly four numbers.', true);
      pinInput.focus();
      return;
    }

    var button = loginForm.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = 'Checking…';
    postJson('/api/auth/login', { name: name, pin: pin })
      .then(function (data) {
        if (!data.ok) throw new Error(data.error || 'Sign-in failed.');
        if (data.role === 'admin') {
          saveSession(data);
          sessionStorage.setItem('admin-token-v2', data.sessionToken || '');
          window.location.assign('/parent');
          return;
        }
        if (data.firstLogin && data.setupToken) {
          setupToken = data.setupToken;
          loginForm.hidden = true;
          setupForm.hidden = false;
          setupForm.classList.add('is-visible');
          document.getElementById('new-pin').focus();
          return;
        }
        saveSession(data);
        redirectAfterLogin(data);
      })
      .catch(function (error) {
        setMessage('login-error', error.message || 'Unable to sign in right now.', true);
      })
      .finally(function () {
        button.disabled = false;
        button.textContent = 'Open my learning page';
      });
  });

  setupForm.addEventListener('submit', function (event) {
    event.preventDefault();
    setMessage('setup-error', '', false);
    var newPin = document.getElementById('new-pin').value.trim();
    var confirmPin = document.getElementById('confirm-pin').value.trim();
    if (!/^\d{4}$/.test(newPin) || newPin === '0000') {
      setMessage('setup-error', 'Choose a new four-number PIN other than 0000.', true);
      return;
    }
    if (newPin !== confirmPin) {
      setMessage('setup-error', 'The two PIN entries do not match.', true);
      return;
    }
    var button = setupForm.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = 'Saving…';
    postJson('/api/auth/set-pin', { setupToken: setupToken, newPin: newPin })
      .then(function (data) {
        if (!data.ok) throw new Error(data.error || 'Could not save your PIN.');
        saveSession(data);
        redirectAfterLogin(data);
      })
      .catch(function (error) {
        setMessage('setup-error', error.message || 'Could not save your PIN.', true);
      })
      .finally(function () {
        button.disabled = false;
        button.textContent = 'Save my PIN';
      });
  });
})();
