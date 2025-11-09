const http = require('http');
const logger = require('../src/utils/logger');

const url = process.env.CHECK_URL || 'http://localhost:8081/ready';
const maxAttempts = parseInt(process.env.MAX_ATTEMPTS || '60', 10);
const delayMs = parseInt(process.env.DELAY_MS || '1000', 10);

const wait = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
          const { statusCode } = res;
          if (statusCode === 200) return resolve(true);
          let body = '';
          res.on('data', (chunk) => body += chunk);
          res.on('end', () => reject(new Error(`Status ${statusCode}: ${body}`)));
        });
        req.on('error', reject);
      });
      logger.info('READY OK');
      process.exit(0);
    } catch (e) {
      logger.info(`Not ready yet (${i+1}/${maxAttempts}): ` + (e.message && e.message.slice(0,120)));
      await wait(delayMs);
    }
  }
  logger.error('Timeout waiting for readiness');
  process.exit(2);
})();
