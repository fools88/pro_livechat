import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const DIST_PORT = 4173;
const DIST_URL = `http://127.0.0.1:${DIST_PORT}`;

let serverProcess;

test.beforeAll(async () => {
  // Start a small static server that serves dashboard/dist
  // Resolve start_static_server relative to this test file (works regardless of CWD)
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const serverScript = path.resolve(__dirname, '..', 'start_static_server.mjs');
  serverProcess = spawn(process.execPath, [serverScript, String(DIST_PORT)], {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  // wait for server to be ready by listening for a ready line or timeout
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Static server startup timeout')), 10000);
    serverProcess.stdout.on('data', (b) => {
      const s = String(b);
      if (s.includes('HTTP server listening')) {
        clearTimeout(timeout);
        resolve(null);
      }
    });
    serverProcess.stderr.on('data', (b) => console.error('[server]', String(b)));
    serverProcess.on('exit', (code) => {
      reject(new Error('Static server exited unexpectedly: ' + code));
    });
  });
});

test.afterAll(() => {
  if (serverProcess && !serverProcess.killed) serverProcess.kill();
});

test('smoke: page loads and lazy-loads axios on API call', async ({ page }) => {
  const resp = await page.goto(DIST_URL);
  expect(resp && resp.status()).toBe(200);
  // Basic sanity: page should contain at least one script tag (bundled app)
  const scripts = await page.$$eval('script[src]', els => els.map(e => e.getAttribute('src')));
  expect(scripts.length).toBeGreaterThan(0);

  // Minimal smoke: the page rendered its root node and has loaded scripts
  const rootHtml = await page.$eval('#root', el => el.outerHTML);
  expect(rootHtml).toBeTruthy();

  // --- Playwright E2E check: trigger the test hook which calls the api via lazy-axios.
  // Set a token in localStorage so http.client interceptor injects Authorization header
  await page.evaluate(() => localStorage.setItem('prochat-token', 'e2e-test-token'));

  // Snapshot list of script resources before triggering the hook
  const beforeScripts = await page.evaluate(() =>
    performance.getEntriesByType('resource').filter(e => e.initiatorType === 'script').map(e => e.name)
  );

  // Intercept the test API endpoint and respond 200
  // Prepare to capture headers from the route when it is invoked
  const headersPromise = new Promise((resolve) => {
    page.route('**/__e2e_test__/ping', async (route) => {
      const hdrs = route.request().headers();
      // fulfill quickly
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
      resolve(hdrs);
    });
  });

  // Ensure the hook exists
  const hasHook = await page.evaluate(() => typeof window.__PRO_LIVECHAT_TEST_SIGNAL__ === 'function');
  expect(hasHook).toBe(true);

  // Trigger the test hook and capture any error reported on window
  const callResult = await page.evaluate(() => {
    if (!window.__PRO_LIVECHAT_TEST_SIGNAL__) return { noHook: true };
    return window.__PRO_LIVECHAT_TEST_SIGNAL__()
      .then(() => ({ ok: true }))
      .catch((e) => ({ err: String(e), reported: window.__PRO_LIVECHAT_TEST_SIGNAL_ERROR__ || null }));
  });

  // If the hook reported an error, fail with context
  if (callResult && callResult.err) {
    throw new Error('Hook threw: ' + callResult.err + ' reported: ' + String(callResult.reported));
  }

  expect(callResult && callResult.ok).toBe(true);

  // Wait for the route to be invoked and capture the request headers
  const capturedHeaders = await headersPromise;
  expect(capturedHeaders).toBeTruthy();
  expect((capturedHeaders['authorization'] || '').toLowerCase()).toBe('bearer e2e-test-token');

  // Snapshot scripts after; ensure at least one new script resource was loaded (dynamic import chunk)
  const afterScripts = await page.evaluate(() =>
    performance.getEntriesByType('resource').filter(e => e.initiatorType === 'script').map(e => e.name)
  );
  expect(afterScripts.length).toBeGreaterThanOrEqual(beforeScripts.length + 1);
});
