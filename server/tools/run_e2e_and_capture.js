const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUT = path.resolve(__dirname, '..', 'tmp_e2e_output.txt');
const SCRIPT = path.resolve(__dirname, 'e2e_agent_assist_test.js');
const TIMEOUT_MS = 70000; // 70s

if (!fs.existsSync(path.dirname(OUT))) fs.mkdirSync(path.dirname(OUT), { recursive: true });

const outStream = fs.createWriteStream(OUT, { flags: 'w' });

// write a startup marker so we can tell the file is being created
outStream.write(`---RUN_E2E_AND_CAPTURE START ${new Date().toISOString()}\n`);

const child = spawn(process.execPath, [SCRIPT], {
  stdio: ['ignore', 'pipe', 'pipe']
});

child.stdout.on('data', (d) => {
  outStream.write(d);
});
child.stderr.on('data', (d) => {
  outStream.write(d);
});

let finished = false;

const finish = (code, signal) => {
  if (finished) return;
  finished = true;
  outStream.write(`\n---PROCESS-END code=${code} signal=${signal} timestamp=${new Date().toISOString()}\n`);
  outStream.end(() => process.exit(code || 0));
};

child.on('exit', (code, signal) => finish(code, signal));
child.on('error', (err) => {
  outStream.write('\n---PROCESS-ERROR ' + String(err) + '\n');
  finish(1);
});

// Timeout guard
const to = setTimeout(() => {
  if (!finished) {
    outStream.write('\n---PROCESS-TIMEOUT killing child\n');
    try { child.kill('SIGKILL'); } catch (e) {}
    finish(2);
  }
}, TIMEOUT_MS);

// Ensure we clear timeout on finish
child.on('close', () => clearTimeout(to));
