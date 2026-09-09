module.exports = {
  testEnvironment: 'node',
  verbose: true,
  moduleNameMapper: {
    '^sqlite3$': '<rootDir>/tests/__mocks__/sqlite3.js',
  },
  testMatch: ['**/tests/**/*.test.js'],
};