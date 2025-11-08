const { execSync } = require('child_process');
const logger = require('./src/utils/logger');
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = 'postgres';
process.env.DB_NAME = 'prochat_db';
process.env.DB_HOST = '127.0.0.1';
process.env.DB_PORT = '5432';
try{
  logger.info('Running sequelize-cli db:migrate with env: ' + JSON.stringify({DB_HOST: process.env.DB_HOST}));
  execSync('npx sequelize-cli db:migrate', { stdio: 'inherit' });
  logger.info('migrate: done');
}catch(e){
  logger.error('migrate failed: ' + (e && (e.stack || e.message)));
  process.exit(1);
}
