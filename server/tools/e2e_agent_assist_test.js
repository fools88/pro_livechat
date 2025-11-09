const jwt = require('jsonwebtoken');
const { io } = require('socket.io-client');
const fetch = global.fetch || require('node-fetch');
const http = require('http');
const https = require('https');
const { URL } = require('url');
const logger = require('../src/utils/logger');
const fs = require('fs');
const path = require('path');
const OUT_DIRECT = path.resolve(__dirname, '..', 'tmp_e2e_direct.txt');
try { if (!fs.existsSync(path.dirname(OUT_DIRECT))) fs.mkdirSync(path.dirname(OUT_DIRECT), { recursive: true }); } catch (e) {}
function writeDirect(msg) { try { fs.appendFileSync(OUT_DIRECT, new Date().toISOString() + ' ' + String(msg) + '\n'); } catch (e) {} }
// ensure file exists immediately with a startup marker
try { fs.writeFileSync(OUT_DIRECT, '---E2E_DIRECT_START ' + new Date().toISOString() + '\n'); } catch (e) {}

// Robust fetch with retry and fallback to built-in http/https when undici/node-fetch
async function fetchWithRetry(url, opts = {}, retries = 3, timeoutMs = 5000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      logger.info(`[TEST][fetch] Attempt ${attempt} -> ${opts.method || 'GET'} ${url}`);
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      if (controller) {
        setTimeout(() => controller.abort(), timeoutMs);
        opts.signal = controller.signal;
      }
      const res = await fetch(url, opts);
      return res;
    } catch (err) {
  logger.error(`[TEST][fetch] Attempt ${attempt} failed for ${url}: ${err && (err.message || err)}`);
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 500 * attempt));
        continue;
      }
      // fallback: try built-in http/https
      try {
  logger.info(`[TEST][fetch] Falling back to built-in client for ${url}`);
        const parsed = new URL(url);
        const isHttps = parsed.protocol === 'https:';
        const lib = isHttps ? https : http;
        const body = opts.body ? JSON.stringify(JSON.parse(opts.body)) : null;
        const requestOpts = {
          method: opts.method || 'GET',
          hostname: parsed.hostname,
          port: parsed.port || (isHttps ? 443 : 80),
          path: parsed.pathname + (parsed.search || ''),
          headers: Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {}),
          timeout: timeoutMs
        };
        const out = await new Promise((resolve, reject) => {
          const req = lib.request(requestOpts, (res) => {
            let data = '';
            res.on('data', (c) => data += c);
            res.on('end', () => resolve({ status: res.statusCode, body: data }));
          });
          req.on('error', reject);
          if (body) req.write(body);
          req.end();
        });
        // shape a minimal response compatible with our usage
        return {
          ok: out.status >= 200 && out.status < 300,
          status: out.status,
          text: async () => out.body,
          json: async () => {
            try { return JSON.parse(out.body); } catch (e) { return out.body; }
          }
        };
      } catch (fallbackErr) {
  logger.error('[TEST][fetch] Built-in fallback also failed: ' + (fallbackErr && fallbackErr.message));
        throw fallbackErr;
      }
    }
  }
}

async function waitForServer(url, timeoutMs = 60000) {
  const start = Date.now();
  logger.info('[TEST] Menunggu server readiness di ' + `${url}/ready`);
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetchWithRetry(`${url}/ready`, { method: 'GET' }, 3, 2000);
      if (res) {
        try {
          const body = await res.json();
          if (body && body.overall === 'ok') {
            logger.info('[TEST] Server readiness OK');
            return true;
          }
            logger.info('[TEST] Server readiness not yet OK, got: ' + JSON.stringify(body));
        } catch (e) {
            logger.info('[TEST] Server readiness non-json response, status=' + res.status);
        }
      }
    } catch (e) {
        logger.error('[TEST] waitForServer fetch error: ' + (e && (e.message || e)));
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  logger.error('[TEST] waitForServer timed out waiting for /ready');
  return false;
}

// Request a short-lived widget token with retries. Returns token or null.
async function requestWidgetToken(serverUrl, website, attempts = 3, delayMs = 500) {
  // Derive origin to use from website.url when possible, otherwise fall back to localhost widget origin
  let originToUse = 'http://localhost:5174';
  try {
    if (website && website.url) {
      const u = new URL(website.url);
      // use full origin (scheme + host + optional port)
      originToUse = u.origin;
    }
  } catch (e) {
    // keep default origin if parsing fails
    logger.warn('[TEST][token] Gagal mengurai website.url, menggunakan origin default: ' + (e && e.message));
  }

  for (let i = 1; i <= attempts; i++) {
    try {
  logger.info(`[TEST][token] Attempt ${i} -> POST ${serverUrl}/api/widget/token using origin=${originToUse}`);
      const resp = await fetchWithRetry(`${serverUrl}/api/widget/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ widgetKey: website.widgetKey, origin: originToUse })
      }, 2, 3000);

      if (resp && resp.ok) {
        const body = await resp.json();
        if (body && body.token) return body.token;
  logger.warn('[TEST][token] Response OK but no token field: ' + JSON.stringify(body));
        return null;
      }

      // Try to extract body text for debugging
      try {
        const text = resp ? await resp.text() : 'no-response';
  logger.warn(`[TEST][token] Non-OK response ${resp ? resp.status : 'n/a'}: ${text}`);
      } catch (e) {
  logger.warn('[TEST][token] Failed to read non-OK response body: ' + (e && e.message));
      }
    } catch (e) {
  logger.error(`[TEST][token] Attempt ${i} failed: ${e && (e.message || e)}`);
    }
    if (i < attempts) await new Promise(r => setTimeout(r, delayMs * i));
  }
  return null;
}

(async () => {
  const SERVER = process.env.SERVER_URL || 'http://localhost:8081';
  const ADMIN_SECRET = process.env.JWT_SECRET || 'prochat-rahasia';

  // 1. Buat token admin
  const adminToken = jwt.sign({ id: 9999, role: 'admin' }, ADMIN_SECRET, { expiresIn: '1h' });
  logger.info('[TEST] Admin token dibuat');
  writeDirect('[TEST] Admin token dibuat');

  // 2. Buat website lewat API
    try {
      let res = await fetchWithRetry(`${SERVER}/api/websites/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ name: 'E2E Test Site', url: 'https://e2e.test' })
      }, 3, 5000);

      let bodyText = await res.text();
      let body;
      try { body = JSON.parse(bodyText); } catch (e) { body = bodyText; }
    if (!res.ok) {
  logger.warn('[TEST] Gagal membuat website langsung, trying fallback GET websites, response: ' + res.status + ' ' + JSON.stringify(body));
        // Try to get existing websites
        res = await fetchWithRetry(`${SERVER}/api/websites/`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${adminToken}` }
        }, 3, 3000);
        bodyText = await res.text();
        try { body = JSON.parse(bodyText); } catch (e) { body = bodyText; }
        if (!res.ok) {
    logger.error('[TEST] Gagal mengambil daftar website: ' + res.status + ' ' + JSON.stringify(body));
          process.exit(1);
        }
        const websites = body;
        if (!websites || websites.length === 0) {
    logger.error('[TEST] Tidak ada website tersedia untuk testing.');
    process.exit(1);
        }
    var website = websites[0];
  logger.info('[TEST] Menggunakan website yang sudah ada: ' + website.id + ' widgetKey=' + website.widgetKey);
  writeDirect('[TEST] Menggunakan website yang sudah ada: ' + website.id + ' widgetKey=' + website.widgetKey);
      } else {
        var website = body.website || body;
  logger.info('[TEST] Website dibuat: ' + website.id + ' widgetKey=' + website.widgetKey);
  writeDirect('[TEST] Website dibuat: ' + website.id + ' widgetKey=' + website.widgetKey);
      }

    // 3. Connect admin socket
    const adminSocket = io(SERVER, { query: { token: adminToken }, transports: ['websocket'] });

    adminSocket.on('connect', () => {
      logger.info('[TEST] Admin socket connected, id=' + adminSocket.id);
      writeDirect('[TEST] Admin socket connected, id=' + adminSocket.id);
    });

    adminSocket.on('connection_error', (err) => {
      logger.error('[TEST] Admin connection_error ' + JSON.stringify(err));
    });

    adminSocket.on('ai_suggestion', (payload) => {
      logger.info('[TEST] Admin menerima ai_suggestion: ' + JSON.stringify(payload));
      writeDirect('[TEST] Admin menerima ai_suggestion: ' + JSON.stringify(payload));
      cleanupAndExit(0);
    });

    adminSocket.on('connect_error', (err) => {
      logger.error('[TEST] Admin connect_error ' + JSON.stringify(err));
    });

    // 4. Connect visitor socket (request short-lived widget token first)
    const fingerprint = 'e2e-fp-' + Math.random().toString(36).slice(2, 8);
    let visitorToken = null;
    try {
      // Prefer token-based flow: try a few times before falling back to widgetKey
      visitorToken = await requestWidgetToken(SERVER, website, 3, 500);
      if (visitorToken) {
          logger.info('[TEST] Widget token diterima (will use token for socket connection)');
          writeDirect('[TEST] Widget token diterima (will use token for socket connection)');
        } else {
          logger.warn('[TEST] Widget token request failed after retries, falling back to widgetKey query param');
          writeDirect('[TEST] Widget token request failed after retries, falling back to widgetKey query param');
        }
    } catch (e) {
      logger.warn('[TEST] Error fetching widget token, will fallback to widgetKey: ' + (e && e.message));
      writeDirect('[TEST] Error fetching widget token, will fallback to widgetKey: ' + (e && e.message));
    }

    // If CI/test run requires token-only, fail fast when no token
    const requireToken = String(process.env.REQUIRE_WIDGET_TOKEN || '').toLowerCase() === 'true';
    if (requireToken && !visitorToken) {
      logger.error('[TEST] REQUIRE_WIDGET_TOKEN is true but no token was obtained — failing E2E as token-only is enforced');
      process.exit(2);
    }

    const visitorQuery = visitorToken ? { token: visitorToken, fingerprint } : { widgetKey: website.widgetKey, fingerprint };
    const visitorSocket = io(SERVER, { query: visitorQuery, transports: ['websocket'] });

    visitorSocket.on('connect', () => {
      logger.info('[TEST] Visitor connected, id=' + visitorSocket.id);
      writeDirect('[TEST] Visitor connected, id=' + visitorSocket.id);
    });

    visitorSocket.on('connection_success', (data) => {
      logger.info('[TEST] Visitor connection_success, conversationId=' + data.conversationId);
      writeDirect('[TEST] Visitor connection_success, conversationId=' + data.conversationId);
      const conversationId = data.conversationId;

      // Admin join the conversation room
  adminSocket.emit('join_room', conversationId);
  logger.info('[TEST] Admin join_room ->' + conversationId);

      // Ensure AI is turned OFF for this conversation so Agent-Assist runs
      setTimeout(() => {
  logger.info('[TEST] Admin toggle AI -> OFF for convo ' + conversationId);
        adminSocket.emit('toggle_ai', { conversationId, status: false });
      }, 100);

      // 5. Visitor kirim pesan (trigger AI path)
      setTimeout(() => {
        visitorSocket.emit('send_message', { content: 'Halo, saya butuh bantuan mengenai harga paket' });
        logger.info('[TEST] Visitor mengirim pesan yang memicu Agent-Assist');
      }, 500);
    });

    visitorSocket.on('connection_error', (err) => {
      logger.error('[TEST] Visitor connection_error ' + JSON.stringify(err));
      writeDirect('[TEST] Visitor connection_error ' + JSON.stringify(err));
      cleanupAndExit(1);
    });

    // Timeout safety
    const timeout = setTimeout(() => {
      logger.error('[TEST] Timeout: tidak menerima ai_suggestion dalam 60 detik.');
      writeDirect('[TEST] Timeout: tidak menerima ai_suggestion dalam 60 detik.');
      cleanupAndExit(2);
    }, 60000);

    function cleanupAndExit(code) {
      try { adminSocket.disconnect(); } catch (e) {}
      try { visitorSocket.disconnect(); } catch (e) {}
      clearTimeout(timeout);
      process.exit(code);
    }

  } catch (err) {
      logger.error('[TEST] Error during E2E test: ' + (err && (err.stack || err.message || err)));
    process.exit(1);
  }
})();
