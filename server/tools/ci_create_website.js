const jwt = require('jsonwebtoken');
const fetch = global.fetch || require('node-fetch');
const logger = require('../src/utils/logger');

// Simple CI helper to create a website using an admin token.
// Expects env:
//  - SERVER_URL (default http://localhost:8081)
//  - JWT_SECRET
//  - SITE_NAME (optional)
//  - SITE_URL (optional, default https://e2e.test)

async function run() {
  const SERVER = process.env.SERVER_URL || 'http://localhost:8081';
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    logger.error('JWT_SECRET is required');
    process.exit(2);
  }

  const SITE_NAME = process.env.SITE_NAME || 'CI E2E Site';
  const SITE_URL = process.env.SITE_URL || 'https://e2e.test';

  const adminToken = jwt.sign({ id: 9999, role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });

  try {
    const res = await fetch(`${SERVER}/api/websites/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({ name: SITE_NAME, url: SITE_URL })
    });

    const text = await res.text();
    let body = null;
    try { body = JSON.parse(text); } catch (e) { body = text; }

    if (res.ok) {
      logger.info('[CI_CREATE_WEBSITE] Website created: ' + JSON.stringify(body));
      process.exit(0);
    }

    // If already exists, that's fine — fetch list and print the existing one
    logger.warn('[CI_CREATE_WEBSITE] Create returned non-OK: ' + res.status + ' ' + JSON.stringify(body));
    // Try GET
    const getRes = await fetch(`${SERVER}/api/websites/`, { headers: { 'Authorization': `Bearer ${adminToken}` } });
    const getText = await getRes.text();
    try {
      const list = JSON.parse(getText);
      if (Array.isArray(list) && list.length > 0) {
        logger.info('[CI_CREATE_WEBSITE] Using existing website: ' + JSON.stringify(list[0]));
        process.exit(0);
      }
    } catch (e) {}

    logger.error('[CI_CREATE_WEBSITE] Failed to create or find website. Response: ' + res.status + ' ' + JSON.stringify(body));
    process.exit(3);
  } catch (err) {
    logger.error('[CI_CREATE_WEBSITE] Error: ' + (err && err.message));
    process.exit(4);
  }
}

run();
