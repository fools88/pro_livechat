const logger = require('./src/utils/logger');

process.on('exit', code => logger.info('***EXIT_CODE*** ' + code));
process.on('uncaughtException', e => { logger.error('***UNCAUGHT*** ' + (e && (e.stack || e))); });
process.on('unhandledRejection', e => { logger.error('***UNHANDLEDREJECTION*** ' + (e && (e.stack || e))); });
require('./src/index.js');
