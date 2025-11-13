// /pro_livechat/server/src/config/db.config.js

// Ambil data rahasia dari file .env
require('dotenv').config();
const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

// Lazy-init pattern: jangan inisialisasi Sequelize saat file di-require.
let sequelize = null;

const initDb = (opts = {}) => {
  if (sequelize) return sequelize;

  const dbName = process.env.DB_NAME || opts.DB_NAME || 'prochat_db';
  const dbUser = process.env.DB_USER || opts.DB_USER || 'prochatadmin';
  const dbPassword = process.env.DB_PASSWORD || opts.DB_PASSWORD || 'REPLACE_ME_DB_PASSWORD';

  sequelize = new Sequelize(dbName, dbUser, dbPassword, {
    host: process.env.DB_HOST || opts.DB_HOST || 'localhost',
    port: process.env.DB_PORT || opts.DB_PORT || 5432,
    dialect: process.env.DB_DIALECT || opts.DB_DIALECT || 'postgres',
    logging: false,
  });

  return sequelize;
};

// connectDb tetap ada untuk kompatibilitas: pastikan init dipanggil sebelumnya
const connectDb = async (opts = {}) => {
  if (!sequelize) initDb(opts);
  const maxRetries = parseInt(process.env.DB_CONNECT_RETRIES || '60', 10); // default ~60 attempts
  const retryDelay = parseInt(process.env.DB_CONNECT_RETRY_DELAY_SEC || '2', 10) * 1000; // ms
  let attempt = 0;
  while (true) {
    try {
      await sequelize.authenticate();
      logger.info(`[Database] Koneksi ke PostgreSQL (${process.env.DB_NAME}) BERHASIL.`);
      return;
    } catch (error) {
      attempt += 1;
      logger.warn({ msg: `[Database] Koneksi gagal (attempt ${attempt}/${maxRetries})`, error: error && (error.stack || error.message || error) });
      if (attempt >= maxRetries) {
        logger.error({ msg: '[Database] GAGAL terhubung ke PostgreSQL setelah retries', error: error && (error.stack || error.message || error) });
        // throw so caller can decide to exit and capture stack
        throw error;
      }
      // wait before next attempt
      await new Promise((res) => setTimeout(res, retryDelay));
    }
  }
};

const getSequelize = () => sequelize;
// If a model requires sequelize before explicit init, lazily create it with defaults
const getSequelizeLazy = () => {
  if (!sequelize) initDb();
  return sequelize;
};

module.exports = {
  initDb,
  connectDb,
  getSequelize: getSequelizeLazy,
};
