const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const { router } = require('./routes/api');
const { router: authRouter } = require('./auth/auth');
const { apiLimiter } = require('./middleware/rateLimit');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { validateEnvironment } = require('./middleware/errorHandler');
const app = express();
const PORT = process.env.PORT || 3000;

validateEnvironment();

app.use(cors());
app.use(express.json());
app.use(apiLimiter);
app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.use('/api/auth', authRouter);
app.use('/api', router);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime() });
});

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});