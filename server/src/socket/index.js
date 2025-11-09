// /pro_livechat/server/src/socket/index.js

const { Server } = require('socket.io');
const registerSocketHandlers = require('./handlers'); // Ambil "Otak"

// Kita akan panggil fungsi ini dari server utama kita
const initSocket = (server) => {
  // (A) Ambil izin CORS (ENV-CONFIGURABLE)
  const allowOrigins = (process.env.CORS_ALLOW_ORIGINS || 'http://localhost:5173,http://localhost:5174')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  const corsOptions = {
    origin: allowOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  };

  // (B) "Nyalakan" Socket.IO
  const io = new Server(server, {
    cors: corsOptions
  });

  // (C) "Daftarkan Otak" kita ke Socket.IO
  registerSocketHandlers(io);

  const logger = require('../utils/logger');
  logger.info('[Socket.IO] Socket.IO berhasil diinisialisasi dan siap.');

  return io;
};

module.exports = { initSocket };