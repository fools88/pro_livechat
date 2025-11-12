#!/usr/bin/env node
// Simple baseline manager: list baselines and set active baseline by copying to baselines/active
const fs = require('fs');
const path = require('path');

// Minimal args parser to avoid adding deps
function parseArgs() {
  const out = { _: [] };
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const name = a.slice(2);
      const next = args[i+1];
      if (next && !next.startsWith('--')) { out[name] = next; i++; } else { out[name] = true; }
    } else { out._.push(a); }
  }
  return out;
}
const argv = parseArgs();
const cmd = argv._[0] || argv['cmd'];
const baselinesRoot = path.resolve('baselines');

function listBaselines() {
  if (!fs.existsSync(baselinesRoot)) return [];
  return fs.readdirSync(baselinesRoot).filter(n => fs.statSync(path.join(baselinesRoot, n)).isDirectory());
}

function setActive(name) {
  const src = path.join(baselinesRoot, name);
  if (!fs.existsSync(src)) {
    console.error('Baseline not found:', src);
    process.exit(2);
  }
  const dest = path.join(baselinesRoot, 'active');
  // remove dest if exists
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }
  // copy directory
  copyDir(src, dest);
  console.log('Set active baseline to', name);
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    const s = path.join(src, entry);
    const d = path.join(dest, entry);
    if (fs.statSync(s).isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

if (cmd === 'list' || !cmd) {
  const found = listBaselines();
  if (found.length === 0) {
    console.log('No baselines found in', baselinesRoot);
    process.exit(0);
  }
  console.log('Baselines:');
  found.forEach(f => console.log(' -', f));
  process.exit(0);
} else if (cmd === 'set') {
  const name = argv._[1] || argv['name'];
  if (!name) {
    console.error('Usage: baseline_manager.js set <baseline-name>');
    process.exit(2);
  }
  setActive(name);
  process.exit(0);
} else {
  console.error('Unknown command. Use list or set');
  process.exit(2);
}
