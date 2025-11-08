// Simple helper to GET /ready and print status + body
(async function(){
  const logger = require('../src/utils/logger');
  const http = require('http');
  const url = process.argv[2] || 'http://127.0.0.1:8081/ready';
  try {
    await new Promise((resolve, reject) => {
      const req = http.get(url, (res) => {
  logger.info('STATUS ' + res.statusCode);
        let body = '';
        res.on('data', (c) => body += c);
  res.on('end', () => { logger.info('BODY: ' + body); resolve(); });
      });
  req.on('error', (e) => { logger.error('ERROR ' + (e && e.message)); reject(e); });
    });
    process.exit(0);
  } catch (e) {
    process.exit(2);
  }
})();
