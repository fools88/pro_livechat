const fs = require('fs');
const path = require('path');

const [,, htmlPath = 'tmp/dashboard-visualizer.html', sizesPath = 'tmp/dashboard-sizes.txt'] = process.argv;
if (!fs.existsSync(htmlPath)) {
  console.error('HTML file not found:', htmlPath);
  process.exit(2);
}
if (!fs.existsSync(sizesPath)) {
  console.error('Sizes file not found:', sizesPath);
  process.exit(2);
}

// Read sizes file and auto-detect UTF-16LE (common on Windows redirects)
let sizesBuf = fs.readFileSync(sizesPath);
let sizesText = sizesBuf.toString('utf8');
// If there are many null bytes it's likely UTF-16LE; decode accordingly
if ((sizesText.match(/\u0000/g) || []).length > 5) {
  sizesText = sizesBuf.toString('utf16le');
}
const sizesRaw = sizesText.trim().split(/\r?\n/).filter(Boolean);
const sizeMap = new Map();
for (const line of sizesRaw) {
  // expected format: tmp_analyze_artifacts\dashboard\dist\assets\vendor_react-Be3t-E4d.js\t490549 bytes\tgz:133835 bytes
  const parts = line.split('\t');
  if (parts.length < 3) continue;
  // Normalize any backslashes to forward slashes so path.posix.basename works reliably
  const filePath = parts[0].replace(/\\/g, '/');
  const gzPart = parts[2];
  const gzMatch = gzPart.match(/gz:(\d+) bytes/);
  const gz = gzMatch ? parseInt(gzMatch[1], 10) : 0;
  const base = path.posix.basename(filePath);
  sizeMap.set(base, gz);
}

// Helper: find gz by exact base, then by package-name fuzzy match
function findGzForAsset(base, assetPathOrId) {
  if (sizeMap.has(base)) return sizeMap.get(base);
  // attempt to derive package name from assetPathOrId
  if (assetPathOrId && typeof assetPathOrId === 'string') {
    // normalize
    const p = assetPathOrId.replace(/\\/g, '/');
    // match scoped packages or first path segment after node_modules
    const m = p.match(/node_modules\/(?:@[^\/]+\/[^\/]+|[^\/]+)/);
    let pkg = null;
    if (m) {
      pkg = m[0].replace('node_modules/', '');
    } else {
      // fallback: take last path segment before extension
      pkg = path.posix.basename(p).split(/[-.]/)[0];
    }
    if (pkg) {
      // look for any key in sizeMap that contains the package name
      for (const [k, v] of sizeMap.entries()) {
        if (k.toLowerCase().includes(pkg.toLowerCase())) return v;
      }
    }
  }
  // final fallback: try partial name from base (before first dash)
  const primary = base.split('-')[0];
  for (const [k, v] of sizeMap.entries()) {
    if (k.startsWith(primary)) return v;
  }
  return 0;
}

let html = fs.readFileSync(htmlPath, 'utf8');

// Find the `const data = {...};` block. We'll locate 'const data =' and the following JSON object.
const dataStart = html.indexOf('const data = ');
if (dataStart === -1) {
  console.error('Could not find "const data = " in HTML');
  process.exit(3);
}
const jsonStart = html.indexOf('{', dataStart);
// Find the matching closing brace for the JSON object. We'll do a simple brace counting from jsonStart.
let i = jsonStart;
let depth = 0;
let inString = false;
let escape = false;
for (; i < html.length; i++) {
  const ch = html[i];
  if (inString) {
    if (escape) escape = false;
    else if (ch === '\\') escape = true;
    else if (ch === '"') inString = false;
  } else {
    if (ch === '"') inString = true;
    else if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) { i++; break; }
    }
  }
}
if (i >= html.length) {
  console.error('Could not find end of JSON data');
  process.exit(4);
}
const jsonText = html.slice(jsonStart, i);
let data;
try {
  data = JSON.parse(jsonText);
} catch (err) {
  console.error('JSON parse error:', err.message);
  process.exit(5);
}

// Update gzipLength in data.nodeParts
if (!data.nodeParts) {
  console.error('data.nodeParts missing');
  process.exit(6);
}
let updatedCount = 0;
// First try the older shape where nodeParts[*].id contains the module path
for (const [uid, part] of Object.entries(data.nodeParts)) {
  if (!part) continue;
  if (part.id && typeof part.id === 'string') {
    const base = path.posix.basename(part.id.replace(/\\/g, '/'));
    // prefer exact match, but fallback to package-name fuzzy matching
    const gz = findGzForAsset(base, part.id) || 0;
    if (gz && part.gzipLength !== gz) {
      part.gzipLength = gz;
      updatedCount++;
    } else if (!part.gzipLength) {
      // still set to 0 explicitly if not found
      part.gzipLength = gz;
    }
  } else if (typeof part === 'object' && !part.id) {
    // leave for moduleParts mapping below
    if (typeof part.gzipLength !== 'number') part.gzipLength = 0;
  }
}

// Newer visualizer shape: data.nodeMetas[*].moduleParts maps asset path -> nodePart UID
let modulePartsResolved = 0;
let modulePartsMatched = 0;
if (data.nodeMetas && typeof data.nodeMetas === 'object') {
  for (const meta of Object.values(data.nodeMetas)) {
    if (!meta || !meta.moduleParts) continue;
    for (const [assetPathRaw, uid] of Object.entries(meta.moduleParts)) {
      modulePartsResolved++;
      const assetPath = String(assetPathRaw).replace(/\\/g, '/');
      const base = path.posix.basename(assetPath);
      // prefer exact match, fall back to package-name fuzzy matching
      const gz = findGzForAsset(base, assetPath);
      if (gz && data.nodeParts && data.nodeParts[uid]) {
        const part = data.nodeParts[uid];
        if (part.gzipLength !== gz) {
          part.gzipLength = gz;
        }
        modulePartsMatched++;
        // count as updated only if we changed a non-matching value
        // but to keep things simple, increment updatedCount when we set a non-zero gz
        if (gz) updatedCount++;
      }
    }
  }
}

// Replace the old JSON with the new one (stringify with minimal spacing)
const newJsonText = JSON.stringify(data);
const newHtml = html.slice(0, jsonStart) + newJsonText + html.slice(i);
fs.writeFileSync(htmlPath, newHtml, 'utf8');
if (updatedCount === 0) {
  console.log(`Injected gzip sizes into ${htmlPath}. Updated entries: ${updatedCount}`);
  // emit some diagnostics to help troubleshoot matching
  const sampleSizeKeys = Array.from(sizeMap.keys()).slice(0, 10);
  const sampleNodeBases = Object.values(data.nodeParts).slice(0, 10).map(p => p && p.id ? path.posix.basename(p.id) + ` (gzip=${p.gzipLength})` : String(p)).slice(0,10);
  console.log('Sample sizeMap keys (first 10):', sampleSizeKeys);
  console.log('Sample visualizer node ids (first 10):', sampleNodeBases);
  // show attempted matches for first 10 node parts
  console.log('Attempted matches (first 10):');
  let i=0;
  for (const part of Object.values(data.nodeParts)) {
    if (i++ >= 10) break;
    const base = part && part.id ? path.posix.basename(part.id) : '<no-id>';
    console.log(`  ${base} -> ${sizeMap.has(base) ? sizeMap.get(base) : '<no match>'}`);
  }
} else {
  console.log(`Injected gzip sizes into ${htmlPath}. Updated entries: ${updatedCount}`);
}
