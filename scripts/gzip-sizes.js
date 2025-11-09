const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const dir = process.argv[2];
if (!dir) {
  console.error('Usage: node scripts/gzip-sizes.js <dir>');
  process.exit(2);
}

function walk(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  let out = [];
  for (const f of files) {
    const full = path.join(dir, f.name);
    if (f.isDirectory()) out = out.concat(walk(full));
    else out.push(full);
  }
  return out;
}

const files = walk(dir);
const results = [];
for (const f of files) {
  const buf = fs.readFileSync(f);
  const gz = zlib.gzipSync(buf);
  results.push({ file: path.relative(process.cwd(), f), size: buf.length, gzipped: gz.length });
}
results.sort((a,b) => b.gzipped - a.gzipped);
for (const r of results) {
  console.log(`${r.file}\t${r.size} bytes	gz:${r.gzipped} bytes`);
}
