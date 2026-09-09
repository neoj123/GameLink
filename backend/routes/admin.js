const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../auth/auth');
const { logActivity, isAdmin, formatPagination } = require('../middleware/markdown');

router.get('/dashboard', authenticateToken, (req, res) => {
  const isAdminUser = isAdmin(req);
  db.get('SELECT id, username, created_at FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch profile' });

    db.get('SELECT COUNT(*) as total FROM messages', [], (err, msgCount) => {
      db.get('SELECT COUNT(*) as total FROM users', [], (err, userCount) => {
        const stats = {
          user,
          isAdmin: isAdminUser,
          totalMessages: msgCount?.total || 0,
          totalUsers: userCount?.total || 0,
          serverUptime: process.uptime(),
          memoryUsage: process.memoryUsage()
        };
        res.json(stats);
      });
    });
  });
});

router.get('/admin/users', authenticateToken, (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Admin access required' });
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  db.all('SELECT id, username, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?', [limit, offset], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch users' });
    db.get('SELECT COUNT(*) as total FROM users', [], (err, count) => {
      res.json({ users: rows, pagination: formatPagination(page, limit, count?.total || 0) });
    });
  });
});

router.get('/admin/activity', authenticateToken, (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Admin access required' });
  res.json({ activity: require('../middleware/markdown').activityLog });
});

router.get('/notifications', authenticateToken, (req, res) => {
  db.all('SELECT * FROM messages ORDER BY created_at DESC LIMIT 5', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch notifications' });
    res.json({ notifications: rows.map(m => ({
      id: m.id,
      text: m.text,
      timestamp: m.created_at
    })) });
  });
});

module.exports = { router };