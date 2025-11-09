const { spawn } = require('child_process');
const fs = require('fs');
const logger = require('./src/utils/logger');
const outPath = '../tmp/e2e_output.txt';
const out = fs.createWriteStream(outPath, { flags: 'w' });
const env = Object.assign({}, process.env, { REQUIRE_WIDGET_TOKEN: 'true', SERVER_URL: 'http://localhost:8081' });
logger.info('Starting E2E child, writing to ' + outPath);
const p = spawn('node', ['tools/e2e_agent_assist_test.js'], { env, cwd: __dirname });
p.stdout.pipe(out);
p.stderr.pipe(out);
p.on('close', (code) => {
  out.end();
  logger.info('E2E exited with code ' + code);
  process.exit(code);
});
p.on('error', (err)=>{
  logger.error('Failed to spawn E2E: ' + (err && err.message));
  process.exit(2);
});
