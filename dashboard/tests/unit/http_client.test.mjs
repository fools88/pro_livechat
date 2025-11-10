import http from 'http';
import { spawn } from 'child_process';
import assert from 'assert';

// Start a tiny server to respond to /api/__unit__/echo and assert headers
const PORT = 8081;

async function startServer() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      if (req.url === '/api/__unit__/echo') {
        const auth = req.headers['authorization'] || '';
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, auth }));
      } else {
        res.writeHead(404);
        res.end('not found');
      }
    });
    srv.listen(PORT, '127.0.0.1', () => resolve(srv));
  });
}

(async () => {
  const srv = await startServer();
  // provide a minimal localStorage polyfill for Node tests
  global.localStorage = (function () {
    const store = new Map();
    return {
      getItem(k) { return store.get(k) || null; },
      setItem(k, v) { store.set(k, String(v)); },
      removeItem(k) { store.delete(k); },
    };
  })();

  // set token to verify interceptor adds Authorization header
  global.localStorage.setItem('prochat-token', 'unit-test-token');

  try {
    // Import the lazy api wrapper and call the echo endpoint
    const { default: api } = await import('../../src/services/http.client.js');
    const res = await api.get('/__unit__/echo');
    assert.strictEqual(res && res.data && res.data.ok, true, 'expected ok true');
    // server echoes back the auth header value
    assert.strictEqual(res.data.auth, 'Bearer unit-test-token');
    console.log('UNIT TEST OK');
    process.exit(0);
  } catch (err) {
    console.error('UNIT TEST FAIL', err);
    process.exit(2);
  } finally {
    srv.close();
  }
})();
