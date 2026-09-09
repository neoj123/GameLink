let token = null;

function showLogin(e) {
  e.preventDefault();
  document.getElementById('auth-section').style.display = 'block';
  document.getElementById('register-section').style.display = 'none';
  document.getElementById('app-section').style.display = 'none';
}

function showRegister(e) {
  e.preventDefault();
  document.getElementById('auth-section').style.display = 'none';
  document.getElementById('register-section').style.display = 'block';
  document.getElementById('app-section').style.display = 'none';
}

function logout() {
  token = null;
  localStorage.removeItem('token');
  document.getElementById('app-section').style.display = 'none';
  document.getElementById('auth-section').style.display = 'block';
}

async function login(e) {
  e.preventDefault();
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');
  errorEl.style.display = 'none';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok) {
      token = data.token;
      localStorage.setItem('token', token);
      document.getElementById('auth-section').style.display = 'none';
      document.getElementById('app-section').style.display = 'block';
      loadMessages();
      checkStatus();
    } else {
      errorEl.textContent = data.error || 'Login failed';
      errorEl.style.display = 'block';
    }
  } catch (err) {
    errorEl.textContent = 'Server error';
    errorEl.style.display = 'block';
  }
}

async function register(e) {
  e.preventDefault();
  const username = document.getElementById('reg-username').value.trim();
  const password = document.getElementById('reg-password').value;
  const errorEl = document.getElementById('reg-error');
  errorEl.style.display = 'none';

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok) {
      errorEl.textContent = 'Account created! Please log in.';
      errorEl.style.display = 'block';
      setTimeout(() => showLogin(e), 1000);
    } else {
      errorEl.textContent = data.error || 'Registration failed';
      errorEl.style.display = 'block';
    }
  } catch (err) {
    errorEl.textContent = 'Server error';
    errorEl.style.display = 'block';
  }
}

async function checkStatus() {
  const btn = document.getElementById('btn-status');
  const dot = document.getElementById('status-dot');
  btn.disabled = true;
  dot.className = 'status-indicator';
  try {
    const res = await fetch('/api/status');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    dot.className = 'status-indicator online';
    document.getElementById('server-status').innerHTML =
      `${dot.outerHTML}✅ ${data.status} — ${new Date(data.time).toLocaleTimeString()}`;
  } catch (err) {
    dot.className = 'status-indicator offline';
    document.getElementById('server-status').innerHTML =
      `${dot.outerHTML}❌ Server unreachable`;
  } finally {
    btn.disabled = false;
  }
}

async function sendMessage(e) {
  e.preventDefault();
  const input = document.getElementById('message-input');
  const text = input.value.trim();
  if (!text || !token) return;
  const btn = input.parentElement.querySelector('button');
  btn.disabled = true;
  try {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ text })
    });
    const data = await res.json();
    if (data.error) { showError(data.error); return; }
    addMessage(data.text || data.message);
    input.value = '';
  } catch (err) {
    showError('Failed to send message');
  } finally {
    btn.disabled = false;
  }
}

async function loadMessages() {
  if (!token) return;
  try {
    const res = await fetch('/api/messages', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const messages = await res.json();
    messages.forEach(m => addMessage(m.text || m.message));
  } catch (err) {
    showError('Could not load messages');
  }
}

function addMessage(text) {
  const list = document.getElementById('message-list');
  const div = document.createElement('div');
  div.className = 'msg';
  div.textContent = text;
  list.appendChild(div);
}

function showError(msg) {
  const list = document.getElementById('message-list');
  const div = document.createElement('div');
  div.className = 'msg error';
  div.textContent = '⚠️ ' + msg;
  list.appendChild(div);
}

document.addEventListener('DOMContentLoaded', () => {
  const savedToken = localStorage.getItem('token');
  if (savedToken) {
    token = savedToken;
    document.getElementById('app-section').style.display = 'block';
    loadMessages();
    checkStatus();
  } else {
    document.getElementById('auth-section').style.display = 'block';
  }
  document.getElementById('btn-status')?.addEventListener('click', checkStatus);
});