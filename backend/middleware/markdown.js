const { marked } = require('marked');

const activityLog = [];

function logActivity(type, details) {
  const entry = {
    id: activityLog.length + 1,
    type,
    details,
    timestamp: new Date().toISOString()
  };
  activityLog.push(entry);
  return entry;
}

function sanitizeMarkdown(text) {
  return marked.parse(text, { gfm: true, breaks: true });
}

function isAdmin(req) {
  const admins = ['admin', 'root'];
  return admins.includes(req.user?.username?.toLowerCase());
}

function formatPagination(page, limit, total) {
  return {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    totalPages: Math.ceil(total / parseInt(limit)),
    hasNext: page * limit < total,
    hasPrev: page > 1
  };
}

module.exports = { logActivity, sanitizeMarkdown, isAdmin, formatPagination, activityLog };