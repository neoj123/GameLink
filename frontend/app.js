const API = '';

async function checkStatus() {
  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    document.getElementById('server-status').textContent =
      `✅ ${data.status} — ${data.time}`;
  } catch (err) {
    document.getElementById('server-status').textContent = '❌ Server unreachable';
  }
}

async function sendMessage(e) {
  e.preventDefault();
  const input = document.getElementById('message-input');
  const text = input.value.trim();
  if (!text) return;

  try {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    const data = await res.json();
    addMessage(data.message);
    input.value = '';
  } catch (err) {
    alert('Failed to send message');
  }
}

async function loadMessages() {
  try {
    const res = await fetch('/api/messages');
    const messages = await res.json();
    messages.forEach(m => addMessage(m));
  } catch (err) {
    console.error('Could not load messages', err);
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