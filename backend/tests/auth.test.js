require('dotenv').config();

const jwt = require('jsonwebtoken');

describe('JWT Utilities', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-me';

  test('should generate and verify a valid token', () => {
    const payload = { id: 1 };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    const decoded = jwt.verify(token, JWT_SECRET);
    expect(decoded.id).toBe(1);
  });

  test('should reject an invalid token', () => {
    expect(() => jwt.verify('invalid.token.here', JWT_SECRET)).toThrow();
  });

  test('should reject an expired token', (done) => {
    const token = jwt.sign({ id: 1 }, JWT_SECRET, { expiresIn: '1ms' });
    setTimeout(() => {
      try {
        jwt.verify(token, JWT_SECRET);
        done.fail('Should have thrown an error');
      } catch (err) {
        expect(err.name).toBe('TokenExpiredError');
        done();
      }
    }, 10);
  });
});