process.env.DB_USER = process.env.DB_USER || 'postgres';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
process.env.DB_NAME = process.env.DB_NAME || 'prochat_db';
process.env.DB_HOST = process.env.DB_HOST || '127.0.0.1';
process.env.DB_PORT = process.env.DB_PORT || '5432';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'ci-test-secret';
process.env.MOCK_AI = 'true';
process.env.MOCK_VECTOR = 'true';
process.env.LOG_LEVEL = 'debug';
process.env.ALLOW_LEGACY_WIDGET_KEY = 'false';

// Defensive: trim common env vars to avoid accidental trailing spaces from user input
const trimIfString = (v) => (typeof v === 'string' ? v.trim() : v);
process.env.DB_USER = trimIfString(process.env.DB_USER);
process.env.DB_PASSWORD = trimIfString(process.env.DB_PASSWORD);
process.env.DB_NAME = trimIfString(process.env.DB_NAME);
process.env.DB_HOST = trimIfString(process.env.DB_HOST);
process.env.DB_PORT = trimIfString(process.env.DB_PORT);
process.env.JWT_SECRET = trimIfString(process.env.JWT_SECRET);
if (process.env.SERVER_URL) process.env.SERVER_URL = trimIfString(process.env.SERVER_URL);

(async () => {
  try {
    console.log('Starting server with env', {DB_HOST: process.env.DB_HOST, DB_USER: process.env.DB_USER});
    const { startServer } = require('./src/index');
    await startServer();
    console.log('Server started (local wrapper)');
  } catch (e) {
    console.error('Failed to start server locally:', e && e.message);
    process.exit(1);
  }
})();
