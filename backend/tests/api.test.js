jest.mock('bcrypt', () => ({
  hash: jest.fn((password) => Promise.resolve(`hashed_${password}`)),
  compare: jest.fn((password, hash) => Promise.resolve(hash === `hashed_${password}`)),
}));

const request = require('supertest');
const express = require('express');
const cors = require('cors');
const { router: authRouter } = require('../auth/auth');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRouter);

describe('Auth API', () => {
  const testUser = { username: 'testuser_' + Date.now(), password: 'testpass123' };

  test('POST /api/auth/register should create a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.username).toBe(testUser.username);
  });

  test('POST /api/auth/register should reject short passwords', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'newuser', password: '123' });
    expect(res.statusCode).toBe(400);
  });

  test('POST /api/auth/register should reject missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'user' });
    expect(res.statusCode).toBe(400);
  });

  test('POST /api/auth/login should reject wrong credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'nonexistent', password: 'wrongpassword' });
    expect(res.statusCode).toBe(401);
  });

  test('POST /api/auth/login should reject missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: testUser.username });
    expect(res.statusCode).toBe(400);
  });

  test('GET /api/auth/me should require authentication', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });

  test('GET /api/auth/protected should require authentication', async () => {
    const res = await request(app).get('/api/auth/protected');
    expect(res.statusCode).toBe(401);
  });
});