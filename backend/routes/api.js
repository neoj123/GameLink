const express = require('express');
const router = express.Router();

let messages = [];

router.get('/status', (req, res) => {
  res.json({ status: 'online', time: new Date().toISOString() });
});

router.get('/messages', (req, res) => {
  res.json(messages);
});

router.post('/messages', (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text is required' });
  const message = { text, id: messages.length + 1, timestamp: new Date().toISOString() };
  messages.push(message);
  res.json(message);
});

module.exports = { router };