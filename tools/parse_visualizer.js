#!/usr/bin/env node
// parse_visualizer_clean.js
// Clean implementation that extracts rollup-plugin-visualizer data and writes a markdown report.
const fs = require('fs');
const path = require('path');

const input = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve('tmp/dashboard-visualizer.html');
const topN = parseInt(process.argv[3] || '10', 10);
const outMd = process.argv[4] ? path.resolve(process.argv[4]) : path.resolve('tmp/visualizer-report.md');

function fail(msg) {
  console.error(msg);
  process.exit(2);
}

let html;
try {
  html = fs.readFileSync(input, 'utf8');
} catch (err) {
  fail('Cannot read visualizer HTML at ' + input + ': ' + err.message);
}

const re = /const data = (\{[\s\S]*?\});\n\n\s*const run/;
const m = html.match(re);
if (!m) fail('Failed to extract data object from visualizer HTML');

let data;
try {
  data = JSON.parse(m[1]);
} catch (err) {
  fail('JSON parse error: ' + err.message);
}

const nodeParts = data.nodeParts || {};
const nodeMetas = data.nodeMetas || {};

const partGzip = {};
for (const [uid, info] of Object.entries(nodeParts)) {
  partGzip[uid] = info.gzipLength || info.renderedLength || 0;
}

const assetModules = {};
for (const meta of Object.values(nodeMetas)) {
  const id = meta.id || '(unknown)';
  const moduleParts = meta.moduleParts || {};
  for (const [asset, partUid] of Object.entries(moduleParts)) {
    const gzip = partGzip[partUid] || 0;
    if (!assetModules[asset]) assetModules[asset] = [];
    assetModules[asset].push({ id, partUid, gzip });
  }
}

function summarize(asset) {
  const modules = assetModules[asset] || [];
  const total = modules.reduce((s, m) => s + m.gzip, 0) || 0;
  modules.sort((a, b) => b.gzip - a.gzip);
  return { asset, total, count: modules.length, top: modules.slice(0, topN) };
}

const vendorRegex = /vendor_emoji|vendor_react|vendor_misc|vendor_socketio|vendor_simplebar/;
const targets = Object.keys(assetModules).filter(a => vendorRegex.test(a));
if (targets.length === 0) fail('No vendor assets found matching vendor_emoji/vendor_react/vendor_misc');

const md = [];
md.push('# Dashboard bundle visualizer report');
md.push('Generated: ' + new Date().toISOString());

for (const asset of targets) {
  const s = summarize(asset);
  console.log('\n=== ' + asset + ' ===');
  console.log('Module count:', s.count, ' Sum(gzip lengths from parts):', s.total);
  console.log('\nTop contributors:');
  s.top.forEach((m, i) => {
    const pct = s.total ? ((m.gzip / s.total) * 100).toFixed(1) : '0.0';
    console.log(`${i + 1}. ${m.id} — ${m.gzip} bytes (${pct}% of asset parts sum)`);
  });

  md.push('');
  md.push('## ' + asset);
  md.push(`- Module count: ${s.count}`);
  md.push(`- Sum(gzip lengths from nodeParts): ${s.total} bytes`);
  md.push('');
  md.push('| # | Module | gzip bytes | % of chunk |');
  md.push('|---:|---|---:|---:|');
  s.top.forEach((m, i) => {
    const pct = s.total ? ((m.gzip / s.total) * 100).toFixed(1) : '0.0';
    md.push(`| ${i + 1} | ${m.id} | ${m.gzip} | ${pct}% |`);
  });
}

md.push('');
md.push('> Notes: gzip lengths are taken from visualizer nodeParts (estimates).');

try {
  fs.mkdirSync(path.dirname(outMd), { recursive: true });
  fs.writeFileSync(outMd, md.join('\n'), 'utf8');
  console.log('\nWrote Markdown report to:', outMd);
} catch (err) {
  fail('Failed to write Markdown report: ' + err.message);
}
