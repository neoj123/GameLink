let token = null;
let currentUsername = '';

function toast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const div = document.createElement('div');
  const colors = { info: '#3a7bd5', success: '#2ed573', error: '#ff4757' };
  div.style.cssText = `
    background: rgba(0,0,0,0.85);
    color: ${colors[type] || colors.info};
    border: 1px solid ${colors[type] || colors.info};
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 0.9rem;
    animation: fadeIn 0.3s ease-in;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `;
  div.textContent = message;
  container.appendChild(div);
  setTimeout(() => { div.style.opacity = '0'; div.style.transition = 'opacity 0.3s'; setTimeout(() => div.remove(), 300); }, 3000);
}

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

function setAuthUI() {
  document.getElementById('auth-section').style.display = 'none';
  document.getElementById('register-section').style.display = 'none';
  document.getElementById('app-section').style.display = 'block';
  document.getElementById('user-info').style.display = 'block';
  document.getElementById('display-username').textContent = currentUsername;
}

function logout() {
  token = null;
  currentUsername = '';
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  document.getElementById('app-section').style.display = 'none';
  document.getElementById('user-info').style.display = 'none';
  document.getElementById('auth-section').style.display = 'block';
  toast('Logged out', 'info');
}

async function login(e) {
  e.preventDefault();
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');
  const btn = document.getElementById('login-btn');
  errorEl.style.display = 'none';
  btn.disabled = true;
  btn.textContent = 'Logging in...';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok) {
      token = data.token;
      currentUsername = username;
      localStorage.setItem('token', token);
      localStorage.setItem('username', username);
      setAuthUI();
      loadMessages();
      checkStatus();
      toast('Welcome back!', 'success');
    } else {
      errorEl.textContent = data.error || 'Login failed';
      errorEl.style.display = 'block';
    }
  } catch (err) {
    errorEl.textContent = 'Server error';
    errorEl.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Log In';
  }
}

async function register(e) {
  e.preventDefault();
  const username = document.getElementById('reg-username').value.trim();
  const password = document.getElementById('reg-password').value;
  const errorEl = document.getElementById('reg-error');
  const btn = document.getElementById('reg-btn');
  errorEl.style.display = 'none';
  btn.disabled = true;
  btn.textContent = 'Registering...';

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok) {
      toast('Account created! Please log in.', 'success');
      setTimeout(() => showLogin(e), 1500);
    } else {
      errorEl.textContent = data.error || 'Registration failed';
      errorEl.style.display = 'block';
    }
  } catch (err) {
    errorEl.textContent = 'Server error';
    errorEl.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Register';
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
  const btn = document.getElementById('btn-submit');
  const spinner = document.getElementById('btn-spinner');
  btn.disabled = true;
  spinner.style.display = 'inline-block';
  try {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ text })
    });
    const data = await res.json();
    if (data.error) { toast(data.error, 'error'); return; }
    addMessage(data.text || data.message);
    input.value = '';
    toast('Message sent!', 'success');
  } catch (err) {
    toast('Failed to send message', 'error');
  } finally {
    btn.disabled = false;
    spinner.style.display = 'none';
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
    toast('Could not load messages', 'error');
  }
}

function addMessage(text) {
  const list = document.getElementById('message-list');
  const div = document.createElement('div');
  div.className = 'msg';
  div.textContent = text;
  list.appendChild(div);
}

document.addEventListener('DOMContentLoaded', () => {
  const savedToken = localStorage.getItem('token');
  const savedUsername = localStorage.getItem('username');
  if (savedToken && savedUsername) {
    token = savedToken;
    currentUsername = savedUsername;
    setAuthUI();
    loadMessages();
    checkStatus();
    toast('Session restored!', 'info');
  } else {
    document.getElementById('auth-section').style.display = 'block';
  }
  document.getElementById('btn-status')?.addEventListener('click', checkStatus);
});