let token = null;
let currentUsername = '';
let socket = null;

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
  if (socket) { socket.disconnect(); socket = null; }
  document.getElementById('app-section').style.display = 'none';
  document.getElementById('user-info').style.display = 'none';
  document.getElementById('auth-section').style.display = 'block';
  toast('Logged out', 'info');
}

function connectSocket() {
  if (!token) return;
  socket = io();

  socket.on('connect', () => {
    socket.emit('authenticate', token);
    document.getElementById('socket-status').innerHTML = '<span style="color:#2ed573;">🟢 Real-time connected</span>';
  });

  socket.on('disconnect', () => {
    document.getElementById('socket-status').innerHTML = '<span style="color:#ff4757;">🔴 Disconnected</span>';
  });

  socket.on('auth_error', (data) => {
    toast(data.error, 'error');
  });

  socket.on('message_received', (data) => {
    addMessage(data.text || data.message);
    toast('New message received!', 'info');
  });

  socket.on('online_count', (data) => {
    const el = document.getElementById('online-count');
    if (el) el.textContent = `👥 ${data.count} online`;
  });

  socket.on('user_joined', () => {
    toast('A user joined', 'info');
  });
}

function renderMarkdown(text) {
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return escaped
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/`{3}(\n|[\s\S]*?)`{3}/g, '<pre><code>$1</code></pre>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)+/g, '<ul>$&</ul>')
    .replace(/\n/g, '<br>');
}

function formatTime(isoString) {
  return new Date(isoString).toLocaleString();
}

function isAdmin() {
  return currentUsername?.toLowerCase() === 'admin' || currentUsername?.toLowerCase() === 'root';
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
      connectSocket();
      toast('Welcome back!', 'success');
      if (isAdmin()) {
        document.getElementById('admin-panel').style.display = 'block';
      }
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
    addMessage(data.text);
    input.value = '';
    if (socket) socket.emit('new_message', { text: data.text, user_id: data.user_id, id: data.id });
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

async function searchMessages(e) {
  e.preventDefault();
  const q = document.getElementById('search-input').value.trim();
  const resultsDiv = document.getElementById('search-results');
  resultsDiv.innerHTML = '';
  if (!q || q.length < 2) return;
  try {
    const res = await fetch(`/api/messages/search?q=${encodeURIComponent(q)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const results = await res.json();
    if (Array.isArray(results)) {
      results.forEach(m => {
        const div = document.createElement('div');
        div.className = 'msg';
        div.innerHTML = renderMarkdown(m.text);
        resultsDiv.appendChild(div);
      });
      if (results.length === 0) {
        resultsDiv.innerHTML = '<p style="color:#888;">No results found</p>';
      }
    }
  } catch (err) {
    toast('Search failed', 'error');
  }
}

function clearMessages() {
  document.getElementById('message-list').innerHTML = '';
}

function addMessage(text) {
  const list = document.getElementById('message-list');
  const div = document.createElement('div');
  div.className = 'msg';
  div.innerHTML = renderMarkdown(text);
  list.appendChild(div);
}

async function loadAdminUsers() {
  if (!isAdmin()) return;
  const content = document.getElementById('admin-content');
  content.innerHTML = '<p style="color:#888;">Loading users...</p>';
  try {
    const res = await fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await res.json();
    if (data.users) {
      let html = '<table style="width:100%; border-collapse:collapse; margin-top:8px;"><tr style="border-bottom:2px solid #3a7bd5;"><th style="text-align:left; padding:8px;">ID</th><th style="text-align:left; padding:8px;">Username</th><th style="text-align:left; padding:8px;">Created</th></tr>';
      data.users.forEach(u => {
        html += `<tr style="border-bottom:1px solid rgba(255,255,255,0.05);"><td style="padding:8px;">${u.id}</td><td style="padding:8px;">${u.username}</td><td style="padding:8px;">${formatTime(u.created_at)}</td></tr>`;
      });
      html += '</table>';
      if (data.pagination && data.pagination.totalPages > 1) {
        html += `<p style="margin-top:8px; color:#888;">Page ${data.pagination.page} of ${data.pagination.totalPages} (${data.pagination.total} users)</p>`;
      }
      content.innerHTML = html;
    }
  } catch (err) {
    toast('Failed to load users', 'error');
  }
}

async function loadNotifications() {
  if (!isAdmin()) return;
  const content = document.getElementById('admin-content');
  content.innerHTML = '<p style="color:#888;">Loading notifications...</p>';
  try {
    const res = await fetch('/api/admin/notifications', { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await res.json();
    if (data.notifications && data.notifications.length > 0) {
      let html = '';
      data.notifications.forEach(n => {
        html += `<div class="msg"><strong>#${n.id}</strong> ${renderMarkdown(n.text)} <span style="color:#888; font-size:0.8rem;">— ${formatTime(n.timestamp)}</span></div>`;
      });
      content.innerHTML = html;
    } else {
      content.innerHTML = '<p style="color:#888;">No notifications</p>';
    }
  } catch (err) {
    toast('Failed to load notifications', 'error');
  }
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
    connectSocket();
    toast('Session restored!', 'info');
    if (isAdmin()) {
      document.getElementById('admin-panel').style.display = 'block';
    }
  } else {
    document.getElementById('auth-section').style.display = 'block';
  }
  document.getElementById('btn-status')?.addEventListener('click', checkStatus);
});