const express = require('express');
const router = express.Router();
const db = require('../db');
const { validateMessage } = require('../middleware/validation');

router.get('/status', (req, res) => {
  res.json({ status: 'online', time: new Date().toISOString(), uptime: process.uptime() });
});

router.get('/messages', (req, res) => {
  db.all('SELECT * FROM messages ORDER BY created_at DESC', [], (err, rows) => {
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
  db.run('INSERT INTO messages (text) VALUES (?)', [sanitized], function(err) {
    if (err) return res.status(500).json({ error: 'Failed to save message' });
    res.json({ id: this.lastID, text: sanitized, timestamp: new Date().toISOString() });
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

module.exports = { router };