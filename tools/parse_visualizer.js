const fs = require('fs');
const path = require('path');

const htmlPath = path.resolve(process.argv[2] || 'artifacts\\19219630525\\dashboard-analyze-artifacts\\tmp\\dashboard-visualizer.html');
const topN = parseInt(process.argv[3] || '10', 10);
const outMarkdown = path.resolve(process.argv[4] || 'artifacts\\19219630525\\dashboard-analyze-artifacts\\tmp\\visualizer-report.md');

const html = fs.readFileSync(htmlPath, 'utf8');

const m = html.match(/const data = (\{[\s\S]*?\});\n\n\s*const run/);
if (!m) {
  console.error('Failed to extract data object from visualizer HTML');
  process.exit(2);
}

let data;
try {
  data = JSON.parse(m[1]);
} catch (err) {
  console.error('JSON parse error:', err.message);
  process.exit(2);
}

const nodeParts = data.nodeParts || {};
const nodeMetas = data.nodeMetas || {};

// Build partUid -> gzipLength
const partGzip = {};
for (const [partUid, partInfo] of Object.entries(nodeParts)) {
  partGzip[partUid] = partInfo.gzipLength || partInfo.renderedLength || 0;
}

// For each module meta, map to asset(s) with sizes
const assetModules = {}; // asset -> [{id, partUid, gzip}]
for (const [metaUid, meta] of Object.entries(nodeMetas)) {
  const id = meta.id || '(unknown)';
  const moduleParts = meta.moduleParts || {};
  for (const [asset, partUid] of Object.entries(moduleParts)) {
    const gzip = partGzip[partUid] || 0;
    if (!assetModules[asset]) assetModules[asset] = [];
    assetModules[asset].push({ id, partUid, gzip });
  }
}

function summarizeAsset(asset) {
  const modules = assetModules[asset] || [];
  const total = modules.reduce((s, m) => s + m.gzip, 0) || 0;
  modules.sort((a,b) => b.gzip - a.gzip);
  const top = modules.slice(0, topN);
  return { asset, total, count: modules.length, top };
}

// include additional vendor chunks we care about
const targets = Object.keys(assetModules).filter(a => /vendor_emoji|vendor_react|vendor_misc|vendor_socketio|vendor_simplebar/.test(a));
if (targets.length === 0) {
  console.error('No vendor assets found matching vendor_emoji/vendor_react/vendor_misc');
  process.exit(1);
}

for (const asset of targets) {
  const s = summarizeAsset(asset);
  console.log('\n=== ' + asset + ' ===');
  console.log('Module count:', s.count, ' Sum(gzip lengths from parts):', s.total);
  console.log('\nTop contributors:');
  s.top.forEach((m, i) => {
    const pct = s.total ? ((m.gzip / s.total) * 100).toFixed(1) : '0.0';
    console.log(`${i+1}. ${m.id} — ${m.gzip} bytes (${pct}% of asset parts sum)`);
  });
}

console.log('\n(Notes: gzip lengths are taken from visualizer nodeParts. They match measured sizes in sizes.txt but may be estimates.)');

// Also emit a Markdown report
const md = [];
md.push('# Dashboard bundle visualizer report');
md.push('Generated: ' + new Date().toISOString());
for (const asset of targets) {
  const s = summarizeAsset(asset);
  md.push(`\n## ${asset}`);
  md.push(`- Module count: ${s.count}`);
  md.push(`- Sum(gzip lengths from nodeParts): ${s.total} bytes`);
  md.push('\n| # | Module | gzip bytes | % of chunk |');
  md.push('|---:|---|---:|---:|');
  s.top.forEach((m, i) => {
    const pct = s.total ? ((m.gzip / s.total) * 100).toFixed(1) : '0.0';
    md.push(`| ${i+1} | ${m.id} | ${m.gzip} | ${pct}% |`);
  });
}

md.push('\n> Notes: gzip lengths are taken from visualizer nodeParts (estimates). Compare with `sizes.txt` for measured asset gz sizes.');

try {
  fs.mkdirSync(path.dirname(outMarkdown), { recursive: true });
  fs.writeFileSync(outMarkdown, md.join('\n'), 'utf8');
  console.log('\nWrote Markdown report to:', outMarkdown);
} catch (err) {
  console.error('Failed to write Markdown report:', err.message);
}
