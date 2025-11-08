const logger = require('./src/utils/logger');
const { Client } = require('pg');
const c = new Client({host:'127.0.0.1', user:'postgres', password:'postgres', database:'prochat_db', port:5432});
(async ()=>{
  try{
    await c.connect();
    logger.info('PG OK');
    await c.end();
    process.exit(0);
  }catch(e){
    logger.error('PG ERR ' + (e && e.message || e));
    process.exit(1);
  }
})();
