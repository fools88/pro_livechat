const io = require('socket.io-client');
const logger = require('../src/utils/logger');
const srv = process.env.SERVER_URL || 'http://localhost:8080';
const s = io(srv, { transports: ['websocket'] });

s.on('connect', () => logger.info('[LISTENER] connected ' + s.id));

s.on('ai_suggestion', (p) => {
  logger.info('[LISTENER] ai_suggestion: ' + JSON.stringify(p));
  process.exit(0);
});

s.on('ai_suggestion_global', (p) => {
  logger.info('[LISTENER] ai_suggestion_global: ' + JSON.stringify(p));
  process.exit(0);
});

setTimeout(() => {
  logger.warn('[LISTENER] timeout no event');
  process.exit(2);
}, 45000);
