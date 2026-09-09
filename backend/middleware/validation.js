function validateMessage(text) {
  const errors = [];
  if (!text || typeof text !== 'string') {
    errors.push('Message text is required and must be a string');
  } else if (text.trim().length === 0) {
    errors.push('Message text cannot be empty');
  } else if (text.length > 500) {
    errors.push('Message text must be 500 characters or less');
  }
  return {
    valid: errors.length === 0,
    errors,
    sanitized: text ? text.trim().substring(0, 500) : null
  };
}

function validateStatusInput(req, res, next) {
  if (!req.query || typeof req.query.detail !== 'undefined') {
    if (req.query.detail && typeof req.query.detail !== 'string') {
      return res.status(400).json({ error: 'Invalid query parameter' });
    }
  }
  next();
}

module.exports = { validateMessage, validateStatusInput };