const fetch = global.fetch || require('node-fetch');
const jwt = require('jsonwebtoken');
const logger = require('../src/utils/logger');

// CI assertion: ensure POST /api/widget/token returns a token for the test website
// Expects env: SERVER_URL, JWT_SECRET, SITE_URL

async function run() {
  const SERVER = process.env.SERVER_URL || 'http://localhost:8081';
  const JWT_SECRET = process.env.JWT_SECRET;
  const SITE_URL = process.env.SITE_URL || 'https://e2e.test';
  if (!JWT_SECRET) {
    logger.error('JWT_SECRET required');
    process.exit(2);
  }

  const adminToken = jwt.sign({ id: 9999, role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });

  try {
    // find a website with SITE_URL
    const listRes = await fetch(`${SERVER}/api/websites/`, { headers: { 'Authorization': `Bearer ${adminToken}` } });
    const listText = await listRes.text();
    let websites = [];
    try { websites = JSON.parse(listText); } catch (e) { websites = []; }

    const site = (websites || []).find(w => String(w.url) === SITE_URL);
    if (!site) {
      logger.error('[CI_ASSERT] Website with SITE_URL not found. Ensure ci_create_website ran first.');
      process.exit(3);
    }

    // Post to token endpoint
    const origin = new URL(SITE_URL).origin;
    const tokenRes = await fetch(`${SERVER}/api/widget/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ widgetKey: site.widgetKey, origin })
    });

    const tokenText = await tokenRes.text();
    let tokenBody = null;
    try { tokenBody = JSON.parse(tokenText); } catch (e) { tokenBody = tokenText; }

    if (tokenRes.ok && tokenBody && tokenBody.token) {
      logger.info('[CI_ASSERT] Token received OK (truncated): ' + String(tokenBody.token).slice(0, 20) + '...');
      process.exit(0);
    }

    logger.error('[CI_ASSERT] Token request failed: ' + tokenRes.status + ' ' + JSON.stringify(tokenBody));
    process.exit(4);

  } catch (err) {
    logger.error('[CI_ASSERT] Error: ' + (err && (err.message || err)));
    process.exit(5);
  }
}

run();
