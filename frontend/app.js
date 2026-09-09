const API = '';

function showError(msg) {
  const list = document.getElementById('message-list');
  const div = document.createElement('div');
  div.className = 'msg error';
  div.textContent = '⚠️ ' + msg;
  list.appendChild(div);
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
  if (!text) return;
  const btn = input.parentElement.querySelector('button');
  btn.disabled = true;
  try {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    const data = await res.json();
    if (data.error) { showError(data.error); return; }
    addMessage(data.text);
    input.value = '';
  } catch (err) {
    showError('Failed to send message');
  } finally {
    btn.disabled = false;
  }
}

async function loadMessages() {
  try {
    const res = await fetch('/api/messages');
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

document.addEventListener('DOMContentLoaded', loadMessages);
document.getElementById('btn-status')?.addEventListener('click', checkStatus);
checkStatus();