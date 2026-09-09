function validateEnvironment() {
  const required = ['JWT_SECRET', 'PORT'];
  const missing = [];
  for (const key of required) {
    if (!process.env[key]) missing.push(key);
  }
  if (missing.length > 0) {
    console.warn(`Warning: Missing environment variables: ${missing.join(', ')}`);
  }
  return missing.length === 0;
}

function errorHandler(err, req, res, next) {
  console.error('Error:', err.message);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

function notFound(req, res) {
  res.status(404).json({ error: 'Route not found' });
}

module.exports = { validateEnvironment, errorHandler, notFound };