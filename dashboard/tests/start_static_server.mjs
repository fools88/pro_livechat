import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const port = process.argv[2] ? Number(process.argv[2]) : 4173;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// serve dashboard/dist relative to this script
const root = path.resolve(__dirname, '..', 'dist');

function mimeType(p) {
  if (p.endsWith('.html')) return 'text/html';
  if (p.endsWith('.js')) return 'application/javascript';
  if (p.endsWith('.css')) return 'text/css';
  if (p.endsWith('.json')) return 'application/json';
  if (p.endsWith('.svg')) return 'image/svg+xml';
  if (p.endsWith('.map')) return 'application/octet-stream';
  return 'application/octet-stream';
}

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(new URL(req.url, `http://localhost`).pathname);
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(root, reqPath.replace(/^\//, ''));
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': mimeType(filePath) });
    res.end(data);
  });
});

server.listen(port, '127.0.0.1', () => {
  console.log('HTTP server listening on http://127.0.0.1:' + port);
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT', () => server.close(() => process.exit(0)));
