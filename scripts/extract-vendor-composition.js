const fs = require('fs');
const path = require('path');

const htmlPath = process.argv[2] || 'tmp/dashboard-visualizer.html';
const sizesPath = process.argv[3] || 'tmp/dashboard-sizes.txt';
if (!fs.existsSync(htmlPath)) {
  console.error('Visualizer not found:', htmlPath);
  process.exit(2);
}
const html = fs.readFileSync(htmlPath, 'utf8');
const dataStart = html.indexOf('const data = ');
if (dataStart === -1) {
  console.error('Could not find data'); process.exit(3);
}
const jsonStart = html.indexOf('{', dataStart);
let i = jsonStart; let depth = 0; let inString = false; let escape=false;
for (; i < html.length; i++){
  const ch = html[i];
  if (inString) {
    if (escape) escape=false;
    else if (ch==='\\') escape=true;
    else if (ch==='"') inString=false;
  } else {
    if (ch==='"') inString=true;
    else if (ch==='{') depth++;
    else if (ch==='}') { depth--; if (depth===0){ i++; break; } }
  }
}
const jsonText = html.slice(jsonStart, i);
let data;
try { data = JSON.parse(jsonText); } catch(err){ console.error('JSON parse error', err.message); process.exit(4); }

// Build map uid -> gzipLength/renderedLength and uid -> metaUid
const nodeParts = data.nodeParts || {};
const nodeMetas = data.nodeMetas || {};

// Read sizes file and build sizeMap (basename -> gz bytes)
let sizeMap = new Map();
if (fs.existsSync(sizesPath)) {
  let sizesBuf = fs.readFileSync(sizesPath);
  let sizesText = sizesBuf.toString('utf8');
  if ((sizesText.match(/\u0000/g) || []).length > 5) sizesText = sizesBuf.toString('utf16le');
  const sizesRaw = sizesText.trim().split(/\r?\n/).filter(Boolean);
  for (const line of sizesRaw) {
    const parts = line.split('\t');
    if (parts.length < 3) continue;
    const filePath = parts[0].replace(/\\/g, '/');
    const gzPart = parts[2];
    const gzMatch = gzPart.match(/gz:(\d+) bytes/);
    const gz = gzMatch ? parseInt(gzMatch[1], 10) : 0;
    const base = path.posix.basename(filePath);
    sizeMap.set(base, gz);
  }
} else {
  console.warn('Sizes file not found, will attempt to infer from data.nodeParts gzipLength');
}

// Helper: pretty bytes
function pretty(n){ if (n>=1024) return (n/1024).toFixed(2)+" KB"; return n+" B"; }

// For each meta, moduleParts maps assetPath -> uid
function analyzeBundle(prefix) {
  const entries = [];
  for (const [metaUid, meta] of Object.entries(nodeMetas)) {
    if (!meta || !meta.moduleParts) continue;
    for (const [assetPath, uid] of Object.entries(meta.moduleParts)) {
      const base = path.posix.basename(String(assetPath).replace(/\\\\/g, '/'));
      if (!base.startsWith(prefix)) continue;
      const part = nodeParts[uid];
      // use renderedLength if available for proportional allocation later
      const rendered = part && typeof part.renderedLength === 'number' ? part.renderedLength : 0;
      const gzip = part && typeof part.gzipLength === 'number' ? part.gzipLength : 0;
      entries.push({ asset: base, uid, gzip, rendered, metaUid, assetPath });
    }
  }
  // aggregate by asset basename (in case duplicates)
  const agg = new Map();
  for (const e of entries) {
    const prev = agg.get(e.asset) || { asset: e.asset, gzip:0, uids: [] };
    prev.gzip += e.gzip;
    prev.uids.push(e.uid);
    agg.set(e.asset, prev);
  }
  const arr = Array.from(agg.values()).sort((a,b)=>b.gzip - a.gzip);
  return arr;
}

function pretty(n){ if (n>=1024) return (n/1024).toFixed(2)+" KB"; return n+" B"; }

const vendors = ['vendor_react','vendor_misc'];
for (const v of vendors) {
  console.log('\n=== Composition for', v, '===');
  const comp = analyzeBundle(v);
  if (comp.length===0) { console.log('  (no matching assets found)'); continue; }
  let total = comp.reduce((s,x)=>s+x.gzip,0);
  console.log(`total gzip: ${total} bytes (${pretty(total)})`);
  console.log('top files:');
  comp.slice(0,30).forEach((it, idx)=>{
    console.log(`${idx+1}. ${it.asset} — ${it.gzip} bytes (${pretty(it.gzip)}) — uids: ${it.uids.join(',')}`);
  });

  // Per-module breakdown using proportional allocation by renderedLength
  // Step 1: build assetBase -> [uids] mapping (for this vendor)
  const assetToUids = new Map();
  for (const [metaUid, meta] of Object.entries(nodeMetas)) {
    if (!meta || !meta.moduleParts) continue;
    for (const [assetPath, uid] of Object.entries(meta.moduleParts)) {
      const base = path.posix.basename(String(assetPath).replace(/\\/g,'/'));
      if (!base.startsWith(v)) continue;
      if (!assetToUids.has(base)) assetToUids.set(base, new Set());
      assetToUids.get(base).add(uid);
    }
  }

  // Step 2: for each asset base, compute totalRendered (sum of nodeParts[uid].renderedLength)
  const allocations = {}; // uid -> allocated gzip bytes
  for (const [base, uidsSet] of assetToUids.entries()) {
    const uids = Array.from(uidsSet);
    let totalRendered = 0;
    for (const uid of uids) {
      const part = nodeParts[uid];
      const r = part && typeof part.renderedLength === 'number' ? part.renderedLength : 0;
      totalRendered += r;
    }
    // bundle gz: prefer sizes file mapping; fallback to sum of nodeParts.gzip
    const bundleGzFromSizes = sizeMap.get(base);
    let bundleGz = typeof bundleGzFromSizes === 'number' ? bundleGzFromSizes : 0;
    if (!bundleGz) {
      // fallback sum of existing gzip fields (may be duplicated)
      for (const uid of uids) {
        const part = nodeParts[uid];
        const gz = part && typeof part.gzipLength === 'number' ? part.gzipLength : 0;
        bundleGz += gz;
      }
    }
    if (totalRendered <= 0 || bundleGz <= 0) {
      // if we don't have rendered or gz info, skip allocation
      for (const uid of uids) allocations[uid] = allocations[uid] || 0;
      continue;
    }
    // allocate proportionally
    for (const uid of uids) {
      const part = nodeParts[uid];
      const r = part && typeof part.renderedLength === 'number' ? part.renderedLength : 0;
      const share = r / totalRendered;
      const alloc = Math.round(bundleGz * share);
      allocations[uid] = (allocations[uid] || 0) + alloc;
    }
  }

  // Step 3: sum allocations per metaUid
  const moduleContrib = [];
  for (const [metaUid, meta] of Object.entries(nodeMetas)) {
    if (!meta || !meta.moduleParts) continue;
    // if meta contributes to this vendor
    const assetKeys = Object.keys(meta.moduleParts || {});
    const matchesVendor = assetKeys.some(k => path.posix.basename(String(k).replace(/\\/g,'/')).startsWith(v));
    if (!matchesVendor) continue;
    let sumAlloc = 0;
    for (const [uid, part] of Object.entries(nodeParts)) {
      if (part && part.metaUid === metaUid) {
        sumAlloc += allocations[uid] || 0;
      }
    }
    moduleContrib.push({ metaUid, id: meta.id || '(no-id)', sum: sumAlloc });
  }
  moduleContrib.sort((a,b)=>b.sum - a.sum);
  console.log('\nPer-module breakdown (top 30, proportional to renderedLength):');
  moduleContrib.slice(0,30).forEach((m, i) => {
    console.log(`${i+1}. ${m.id} — ${m.sum} bytes (${pretty(m.sum)}) [metaUid=${m.metaUid}]`);
  });
}

// Bonus: list top contributors overall for vendor_react* and vendor_misc*
const all = [...analyzeBundle('vendor_react'), ...analyzeBundle('vendor_misc')];
const top10 = all.sort((a,b)=>b.gzip - a.gzip).slice(0,10);
console.log('\n=== Top contributors across vendor_react/vendor_misc ===');
top10.forEach((it,i)=> console.log(`${i+1}. ${it.asset} — ${it.gzip} bytes`));

process.exit(0);
