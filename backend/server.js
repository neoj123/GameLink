const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const db = require('./db');
const { router } = require('./routes/api');
const { router: authRouter } = require('./auth/auth');
const { apiLimiter } = require('./middleware/rateLimit');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { validateEnvironment } = require('./middleware/errorHandler');
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});
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

const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('authenticate', (token) => {
    try {
      const jwt = require('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-me';
      const decoded = jwt.verify(token, JWT_SECRET);
      onlineUsers.set(socket.id, decoded.id);
      socket.broadcast.emit('user_joined', { socketId: socket.id, userId: decoded.id });
      io.emit('online_count', { count: io.engine.clientsCount });
    } catch (err) {
      socket.emit('auth_error', { error: 'Invalid token' });
    }
  });

  socket.on('new_message', (data) => {
    io.emit('message_received', data);
  });

  socket.on('disconnect', () => {
    onlineUsers.delete(socket.id);
    io.emit('online_count', { count: io.engine.clientsCount });
    console.log(`Client disconnected: ${socket.id}`);
  });
});

module.exports = { app, server, io };

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}