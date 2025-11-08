const logger = require('../src/utils/logger');
const http = require('http');
const url = process.argv[2] || 'http://127.0.0.1:8081/ready';

http.get(url, (res) => {
  logger.info('STATUS ' + res.statusCode);
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    logger.info('BODY: ' + body.slice(0, 200));
    process.exit(0);
  });
}).on('error', (err) => {
  logger.error('ERROR: ' + (err && err.message));
  process.exit(2);
});
