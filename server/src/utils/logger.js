const path = require('path');
const fs = require('fs');
const { createLogger, format, transports } = require('winston');
let DailyRotateFile;
try {
  DailyRotateFile = require('winston-daily-rotate-file');
} catch (e) {
  DailyRotateFile = null;
}

// ensure logs dir exists
const logDir = path.resolve(__dirname, '..', '..', 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const defaultLevel = (process.env.LOG_LEVEL || 'info').toLowerCase();
const fileLevel = defaultLevel === 'debug' ? 'debug' : 'info';
const consoleLevel = defaultLevel;

const logger = createLogger({
  level: defaultLevel,
  format: format.combine(
    format.timestamp(),
    format.printf(({ timestamp, level, message }) => `[${timestamp}] [${level.toUpperCase()}] ${message}`)
  ),
  transports: [
    // if daily rotate available use it, else fallback to single file
    ...(DailyRotateFile ? [
      new DailyRotateFile({ filename: path.join(logDir, 'server-%DATE%.log'), datePattern: 'YYYY-MM-DD', maxSize: '50m', maxFiles: '14d', level: fileLevel })
    ] : [
      new transports.File({ filename: path.join(logDir, 'server.log'), level: fileLevel })
    ]),
    new transports.Console({ level: consoleLevel })
  ],
  exitOnError: false,
});

module.exports = {
  info: (msg) => logger.info(typeof msg === 'string' ? msg : JSON.stringify(msg)),
  warn: (msg) => logger.warn(typeof msg === 'string' ? msg : JSON.stringify(msg)),
  error: (msg) => logger.error(typeof msg === 'string' ? msg : JSON.stringify(msg)),
  debug: (msg) => logger.debug(typeof msg === 'string' ? msg : JSON.stringify(msg)),
  _winston: logger
};
