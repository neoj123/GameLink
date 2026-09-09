const express = require('express');
const router = express.Router();
const db = require('../db');
const { validateMessage } = require('../middleware/validation');
const { authenticateToken } = require('../auth/auth');

router.get('/status', (req, res) => {
  res.json({ status: 'online', time: new Date().toISOString(), uptime: process.uptime() });
});

router.get('/messages', (req, res) => {
  db.all('SELECT * FROM messages ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch messages' });
    res.json(rows);
  });
});

router.get('/messages/search', (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.status(400).json({ error: 'Query must be at least 2 characters' });
  const pattern = `%${q}%`;
  db.all('SELECT * FROM messages WHERE text LIKE ? ORDER BY created_at DESC', [pattern], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Search failed' });
    res.json(rows);
  });
});

router.get('/messages/my', authenticateToken, (req, res) => {
  db.all('SELECT * FROM messages WHERE user_id = ? ORDER BY created_at DESC', [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch messages' });
    res.json(rows);
  });
});

router.post('/messages', (req, res) => {
  const { text } = req.body;
  const validation = validateMessage(text);

  if (!validation.valid) {
    return res.status(400).json({ error: validation.errors.join(', ') });
  }

  const sanitized = validation.sanitized;
  db.run('INSERT INTO messages (text, user_id) VALUES (?, ?)', [sanitized, req.user?.id || null], function(err) {
    if (err) return res.status(500).json({ error: 'Failed to save message' });
    const message = { id: this.lastID, text: sanitized, user_id: req.user?.id || null, timestamp: new Date().toISOString() };
    res.json(message);
  });
});

router.delete('/messages/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid message ID' });
  db.run('DELETE FROM messages WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: 'Failed to delete message' });
    if (this.changes === 0) return res.status(404).json({ error: 'Message not found' });
    res.json({ deleted: true, id });
  });
});

router.get('/users', (req, res) => {
  db.all('SELECT id, username, created_at FROM users ORDER BY username', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch users' });
    res.json(rows);
  });
});

module.exports = { router };