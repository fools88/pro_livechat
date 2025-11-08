// /pro_livechat/server/src/index.js

// (A) Ambil .env (WAJIB paling atas)
require('dotenv').config();
const logger = require('./utils/logger');

// Add process-level handlers early so we capture unexpected exits/crashes
try {
  const fs = require('fs');
  const path = require('path');
  const outDir = path.resolve(__dirname, '..', '..', 'tmp');
  try { fs.mkdirSync(outDir, { recursive: true }); } catch (e) {}

  const writeExit = (note) => {
    try { fs.appendFileSync(path.join(outDir, 'process_exit.log'), `${new Date().toISOString()} ${note}\n`); } catch (e) {}
  };

  process.on('exit', (code) => {
    const msg = `[process.exit] code=${code}`;
    logger.error(msg);
    writeExit(msg);
  });
  process.on('uncaughtException', (err) => {
    const msg = `[uncaughtException] ${err && (err.stack || err.message)}`;
    logger.error(msg);
    writeExit(msg);
  });
  process.on('unhandledRejection', (reason) => {
    const msg = `[unhandledRejection] ${reason && (reason.stack || reason.message || JSON.stringify(reason))}`;
    logger.error(msg);
    writeExit(msg);
  });
  ['SIGINT','SIGTERM','SIGUSR2'].forEach(sig => {
    try {
      process.on(sig, () => {
        const msg = `[signal] ${sig} received`;
        logger.warn(msg);
        writeExit(msg);
        // allow default handling after logging
        process.exit(0);
      });
    } catch (e) {}
  });
} catch (e) {
  // ignore any failure to install handlers
}

// (B) Import semua "alat"
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
// logger already required above for early process handlers

// (C) Ambil konektor database, tapi TIDAK merequire models dulu.
const { initDb, connectDb } = require('./config/db.config');
const geminiConfig = require('./config/gemini.config');
const pineconeConfig = require('./config/pinecone.config');
const s3Config = require('./config/s3.config');
const { initSocket } = require('./socket');

// NOTE: routes and models will be required AFTER db initialization inside startServer()

// (D) Inisialisasi Server
const app = express();
const server = http.createServer(app);
const metrics = require('./utils/metrics');
// Only enable verbose incoming/connection logs when in debug mode.
const isDebug = (String(process.env.LOG_LEVEL || '').toLowerCase() === 'debug') || process.env.NODE_ENV === 'development';

// (E) Konfigurasi CORS
const allowOrigins = (process.env.CORS_ALLOW_ORIGINS || 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
const corsOptions = {
  origin: allowOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
};
  logger.info(`[CORS] Izin diberikan untuk: ${allowOrigins.join(' , ')}`);
app.use(cors(corsOptions)); // (B) Pasang CORS

// (G) Ajari Express membaca JSON
app.use(express.json());

// Log every incoming HTTP request (debug helper) - gated by LOG_LEVEL=debug
app.use((req, res, next) => {
  try {
    if (isDebug) {
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      logger.info(`[INCOMING] ${req.method} ${req.url} from ${ip}`);
    }
  } catch (e) {}
  next();
});

// Log new TCP connections at the server level (helps trace refused connections)
try {
  // Only attach detailed TCP connection logging in debug mode to avoid noisy
  // logs in CI/production runs. Keep the listener optional so it won't break
  // when logging infra is limited.
  if (isDebug) {
    server.on('connection', (sock) => {
      try {
        const addr = sock.remoteAddress + ':' + sock.remotePort;
        logger.info('[NET] new TCP connection from ' + addr + ' fd=' + (sock.fd || 'n/a'));
      } catch (e) {}
    });
  }
} catch (e) {}

// (H) Pasang Semua "Papan Petunjuk" (Rute API)
app.get('/api/test', (req, res) => {
  res.json({ status: 'OK', message: 'Server HTTP berjalan!' });
});

// Simple readiness endpoint (checks DB connection state lightly)
app.get('/ready', async (req, res) => {
  const result = { db: 'unknown', s3: 'unknown', pinecone: 'unknown', redis: 'unknown', overall: 'fail' };
  try {
    const db = require('../models');
    if (db && db.sequelize) {
      try {
        await db.sequelize.authenticate();
        result.db = 'ok';
      } catch (e) {
        result.db = 'fail';
      }
    }
  } catch (e) {
    result.db = 'fail';
  }

  try {
    const s3Config = require('./config/s3.config');
    const client = s3Config.getS3Client();
    const bucket = process.env.S3_BUCKET_NAME;
    if (client && bucket) {
      try {
        const { HeadBucketCommand } = require('@aws-sdk/client-s3');
        await client.send(new HeadBucketCommand({ Bucket: bucket }));
        result.s3 = 'ok';
      } catch (e) {
        result.s3 = 'fail';
      }
    }
  } catch (e) {
    result.s3 = 'fail';
  }

  try {
    const pineconeConfig = require('./config/pinecone.config');
    const idxName = process.env.PINECONE_INDEX_NAME || 'default';
    if (pineconeConfig) {
      try {
        // ensureIndex will handle mocks or real pinecone; pass a default name when absent
        const ok = await pineconeConfig.ensureIndex(idxName, 1, 500);
        result.pinecone = ok ? 'ok' : 'fail';
      } catch (e) {
        result.pinecone = 'fail';
      }
    }
  } catch (e) {
    result.pinecone = 'fail';
  }

  // Optional: check Redis if configured. For local/dev or MOCK runs, Redis
  // failures are non-blocking (so /ready can return ok while redis is down).
  try {
    const redisUrl = process.env.REDIS_URL || process.env.REDIS_HOST;
    if (redisUrl) {
      try {
        const { createClient } = require('redis');
        const client = createClient({ url: redisUrl });
        await client.connect();
        await client.ping();
        await client.disconnect();
        result.redis = 'ok';
      } catch (e) {
        result.redis = 'fail';
      }
    } else {
      result.redis = 'unknown';
    }
  } catch (e) {
    result.redis = 'fail';
  }

  // determine overall
  // Determine overall readiness. For local developer runs or when mocks are
  // enabled, treat Redis failure as non-blocking to avoid blocking E2E
  // unnecessarily. Services considered required:
  // - DB always required
  // - S3 required only if S3_BUCKET_NAME set
  // - Pinecone required only if not using MOCK_VECTOR and PINECONE envs present
  const usingMocks = String(process.env.MOCK_AI || process.env.MOCK_VECTOR || '').toLowerCase() === 'true' || process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development';

  // If running with MOCKS enabled, treat S3 as non-required to avoid blocking
  // local E2E. This is safe because uploads are not needed for agent-assist tests.
  const s3Required = !!process.env.S3_BUCKET_NAME && !usingMocks;
  const pineconeConfigured = !!(process.env.PINECONE_API_KEY || process.env.PINECONE_INDEX_NAME || process.env.PINECONE_ENVIRONMENT);
  const pineconeRequired = !usingMocks && pineconeConfigured;

  // Debug: print readiness decision context to logs to help local debug
  logger.info('[ReadyCheck] usingMocks=' + usingMocks + ' s3Required=' + s3Required + ' pineconeRequired=' + pineconeRequired);

  const dbOk = result.db === 'ok';
  const s3Ok = !s3Required || result.s3 === 'ok' || result.s3 === 'unknown';
  const pineOk = !pineconeRequired || result.pinecone === 'ok' || result.pinecone === 'unknown';

  if (dbOk && s3Ok && pineOk) {
    result.overall = 'ok';
      try {
        // append a quick ready log for debugging
        const fs = require('fs');
        const path = require('path');
        const outDir = path.resolve(__dirname, '..', '..', 'tmp');
        try { fs.mkdirSync(outDir, { recursive: true }); } catch (e) {}
        const line = `${new Date().toISOString()} READY: db=${result.db} s3=${result.s3} pine=${result.pinecone} redis=${result.redis}\n`;
        fs.appendFileSync(path.join(outDir, 'ready_checks.log'), line);
      } catch (e) {
      logger.warn('[ReadyCheck] Gagal menulis ready_checks.log: ' + (e && e.message));
    }
    return res.status(200).json(result);
  }

  // Not ready
  res.status(503).json(result);
});

// Lightweight health endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', metrics.client.register.contentType);
    res.send(await metrics.client.register.metrics());
  } catch (e) {
    res.status(500).send('Error collecting metrics');
  }
});
// NOTE: route mounting will happen inside startServer AFTER models & configs are inited.

// (J) Fungsi untuk Menjalankan Server
const startServer = async () => {
  // 0. Init external services (Gemini, Pinecone, S3) lazily
  try {
    geminiConfig.initGemini();
  } catch (e) {
    logger.warn('[Startup] initGemini failed: ' + (e && e.message));
  }
  try {
    pineconeConfig.initPinecone();
  } catch (e) {
    logger.warn('[Startup] initPinecone failed: ' + (e && e.message));
  }
  try {
    s3Config.initS3();
  } catch (e) {
    logger.warn('[Startup] initS3 failed: ' + (e && e.message));
  }

  // 1. Tes koneksi DB dulu
  await connectDb();

  // 1.b Require models AFTER DB inisialisasi
  const db = require('../models');

  // Mount routes (require controllers now that models exist)
  const authRoutes = require('./api/routes/auth.routes');
  const userRoutes = require('./api/routes/user.routes');
  const websiteRoutes = require('./api/routes/website.routes');
  const widgetRoutes = require('./api/routes/widget.routes');
  const aiRoutes = require('./api/routes/ai.routes');
  const uploadRoutes = require('./api/routes/upload.routes');
  const conversationRoutes = require('./api/routes/conversation.routes');
  const teamRoutes = require('./api/routes/team.routes');
  const analyticsRoutes = require('./api/routes/analytics.routes');
  const filesRoutes = require('./api/files.routes');

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/websites', websiteRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/uploads', uploadRoutes);
  app.use('/api/conversations', conversationRoutes);
  app.use('/api/team', teamRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/widget', widgetRoutes);
  app.use('/api/files', filesRoutes);

  // 2. Sinkronkan semua model
    try {
    await db.sequelize.sync({ alter: true });
    logger.info('[Database] Semua model berhasil disinkronkan.');
  } catch (error) {
    logger.error('[Database] GAGAL sinkronisasi model: ' + (error && (error.stack || error.message)));
    process.exit(1);
  }

  // 3. Jalankan server HTTP
  const PORT = process.env.PORT || 8080;
  await new Promise((resolve, reject) => {
  // Bind explicitly to 0.0.0.0 so server accepts connections on all IPv4 interfaces
  server.listen(PORT, '0.0.0.0', () => {
  logger.info(`[Server] Server berjalan di http://0.0.0.0:${PORT} (bind 0.0.0.0)`);
  logger.info(`[Server] Menunggu koneksi...`);
  try {
    const fs = require('fs');
    const path = require('path');
    const outDir = path.resolve(__dirname, '..', '..', 'tmp');
    try { fs.mkdirSync(outDir, { recursive: true }); } catch (e) {}
    const startInfo = `PID:${process.pid} START:${new Date().toISOString()} PORT:${PORT}\n`;
    fs.writeFileSync(path.join(outDir, 'server_started.txt'), startInfo);
  } catch (e) {
    logger.warn('[Startup] Gagal menulis server_started file: ' + (e && e.message));
  }

      // --- INI DIA FINALNYA ---
      // 4. "Nyalakan" Socket.IO (SETELAH server http jalan)
      initSocket(server);
      // small internal self-check: try to fetch /ready from inside the process
      try {
        setTimeout(async () => {
          try {
            const http = require('http');
            const opts = { hostname: '127.0.0.1', port: PORT, path: '/ready', method: 'GET', timeout: 2000 };
            const req = http.request(opts, (res) => {
              const { statusCode } = res;
              let body = '';
              res.on('data', (c) => body += c);
              res.on('end', () => {
                  try {
                      const fs = require('fs');
                      const path = require('path');
                      const outDir = path.resolve(__dirname, '..', '..', 'tmp');
                      try { fs.mkdirSync(outDir, { recursive: true }); } catch (e) {}
                      const line = `${new Date().toISOString()} SELF_READY status=${statusCode} body=${body}\n`;
                      fs.appendFileSync(path.join(outDir, 'self_ready.log'), line);
                    } catch (e) { logger.warn('[SelfCheck] write failed: ' + (e && e.message)); }
              });
            });
            req.on('error', (e) => {
              try {
                const fs = require('fs');
                const path = require('path');
                const outDir = path.resolve(__dirname, '..', '..', 'tmp');
                try { fs.mkdirSync(outDir, { recursive: true }); } catch (e) {}
                const line = `${new Date().toISOString()} SELF_READY error=${e && e.message}\n`;
                fs.appendFileSync(path.join(outDir, 'self_ready.log'), line);
              } catch (e) {}
            });
            req.end();
          } catch (e) {
            logger.warn('[SelfCheck] failed: ' + (e && e.message));
          }
        }, 1000);
      } catch (e) {}
      // ------------------------
      resolve(server);
    });
  });
  return server;
};

// (K) Nyalakan server jika file ini dijalankan langsung
if (require.main === module) {
  startServer().catch(e => {
    logger.error('Gagal men-start server: ' + (e && (e.stack || e.message)));
    process.exit(1);
  });
}

module.exports = { startServer };