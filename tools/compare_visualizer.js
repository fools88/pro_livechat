#!/usr/bin/env node
// Compare current build visualizer HTML against a saved baseline (directory containing dashboard-visualizer.html)
const fs = require('fs');
const path = require('path');

function fail(msg, code = 2) {
  console.error(msg);
  process.exit(code);
}

// Minimal argument parsing to avoid external deps. Usage:
// --baseline <dir> --current <file> --threshold <percent> [--out <file>]
function parseArgs() {
  const out = { _: [] };
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const name = a.slice(2);
      const next = args[i+1];
      if (next && !next.startsWith('--')) {
        out[name] = next; i++;
      } else {
        out[name] = true;
      }
    } else {
      out._.push(a);
    }
  }
  return out;
}

const argv = parseArgs();
const baselineDir = argv['baseline'] || argv._[0];
const currentHtml = argv['current'] || argv._[1] || path.resolve('tmp', 'dashboard-visualizer.html');
const thresholdPercent = parseFloat(process.env.VISUALIZER_THRESHOLD_PERCENT || argv['threshold'] || '10');
const outFile = argv['out'] || process.env.VISUALIZER_OUT_FILE || null;

if (!baselineDir) fail('Missing baseline directory. Pass --baseline baselines/<name> or as first arg');
const baselineHtml = path.resolve(baselineDir, 'dashboard-visualizer.html');
if (!fs.existsSync(baselineHtml)) fail('Baseline html not found at ' + baselineHtml);
if (!fs.existsSync(currentHtml)) fail('Current visualizer html not found at ' + currentHtml);

function extractDataObjectText(html) {
  // find 'const data =' and then extract a balanced-brace JSON object following it
  const idx = html.indexOf('const data =');
  if (idx === -1) return null;
  const start = html.indexOf('{', idx);
  if (start === -1) return null;
  let i = start;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (; i < html.length; i++) {
    const ch = html[i];
    if (inString) {
      if (escape) { escape = false; continue; }
      if (ch === '\\') { escape = true; continue; }
      if (ch === '"') { inString = false; continue; }
      continue;
    }
    if (ch === '"') { inString = true; continue; }
    if (ch === '{') depth++; else if (ch === '}') {
      depth--;
      if (depth === 0) { return html.slice(start, i+1); }
    }
  }
  return null;
}

function extractTotalsFromHtml(input) {
  const html = fs.readFileSync(input, 'utf8');
  const jsonText = extractDataObjectText(html);
  if (!jsonText) fail('Failed to extract data object from ' + input);
  let data;
  try { data = JSON.parse(jsonText); } catch (err) { fail('JSON parse error: ' + err.message); }
  const nodeParts = data.nodeParts || {};
  const nodeMetas = data.nodeMetas || {};
  const partGzip = {};
  for (const [uid, info] of Object.entries(nodeParts)) {
    partGzip[uid] = info.gzipLength || info.renderedLength || 0;
  }
  const assetTotals = {};
  for (const meta of Object.values(nodeMetas)) {
    const moduleParts = meta.moduleParts || {};
    for (const [asset, partUid] of Object.entries(moduleParts)) {
      const gzip = partGzip[partUid] || 0;
      assetTotals[asset] = (assetTotals[asset] || 0) + gzip;
    }
  }
  return assetTotals;
}

const baseTotals = extractTotalsFromHtml(baselineHtml);
const currTotals = extractTotalsFromHtml(currentHtml);

// Pick vendor assets (flexible regex)
const vendorRegex = new RegExp(process.env.VISUALIZER_VENDOR_REGEX || 'vendor_');
const vendors = new Set([
  ...Object.keys(baseTotals).filter(a => vendorRegex.test(a)),
  ...Object.keys(currTotals).filter(a => vendorRegex.test(a)),
]);

const report = [];
let failed = false;
report.push('# Visualizer compare report');
report.push('Baseline: ' + baselineHtml);
report.push('Current: ' + currentHtml);
report.push('Threshold: ' + thresholdPercent + '% (increase)');
report.push('');
report.push('| asset | baseline gzip | current gzip | delta bytes | delta % | result |');
report.push('|---|---:|---:|---:|---:|---|');

for (const asset of Array.from(vendors).sort()) {
  const b = baseTotals[asset] || 0;
  const c = currTotals[asset] || 0;
  const delta = c - b;
  const pct = b === 0 ? (c === 0 ? 0 : 100) : (delta / b) * 100;
  const ok = pct <= thresholdPercent;
  if (!ok) failed = true;
  report.push(`| ${asset} | ${b} | ${c} | ${delta} | ${pct.toFixed(1)}% | ${ok ? 'OK' : 'FAIL'} |`);
}

const out = report.join('\n');
if (outFile) {
  try {
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, out + '\n', 'utf8');
  } catch (err) {
    console.error('Failed to write out file', outFile, err && err.message);
  }
} else {
  console.log(out);
}

if (failed) {
  console.error('\nOne or more vendor assets exceed the threshold.');
  process.exit(3);
}
process.exit(0);
