// /pro_livechat/server/src/config/pinecone.config.js

require('dotenv').config();
let Pinecone;
try {
  Pinecone = require('@pinecone-database/pinecone').Pinecone;
} catch (e) {
  // pinecone package may not be installed in CI/test where we use mock
  Pinecone = null;
}

let pineconeIndex = null;
let pc = null;

// If MOCK_VECTOR is enabled, provide a simple in-memory mock index that
// implements minimal query/upsert API needed by vector.service and tests.
const createMockIndex = () => {
  const store = []; // { id, vector, metadata }
  return {
    upsert: async (vectors) => {
      for (const v of vectors) {
        const existing = store.find(s => s.id === v.id);
        const meta = v.metadata || {};
        if (existing) {
          existing.vector = v.values || v.vector;
          existing.metadata = Object.assign({}, existing.metadata, meta);
        } else {
          store.push({ id: v.id, vector: v.values || v.vector, metadata: meta });
        }
      }
      return { upsertedCount: vectors.length };
    },
    query: async ({ vector, topK = 5, includeMetadata = true, filter = {} } = {}) => {
      // very naive distance: compare vector length & return some stored items
      const matches = store.slice(0, topK).map((s, i) => ({
        id: s.id,
        score: 1 - (i * 0.01),
        metadata: s.metadata,
      }));
      return { matches };
    }
  };
};

const initPinecone = (opts = {}) => {
  const apiKey = process.env.PINECONE_API_KEY || opts.PINECONE_API_KEY;
  const environment = process.env.PINECONE_ENVIRONMENT || opts.PINECONE_ENVIRONMENT;
  const indexName = process.env.PINECONE_INDEX_NAME || opts.PINECONE_INDEX_NAME;

  const logger = require('../utils/logger');
  const useMock = String(process.env.MOCK_VECTOR || '').toLowerCase() === 'true' || process.env.NODE_ENV === 'test';
  if (useMock) {
    pc = { index: (name) => createMockIndex() };
    pineconeIndex = pc.index(indexName || 'mock-index');
    logger.info('[AI] Using MOCK Pinecone index (MOCK_VECTOR=true).');
    return;
  }

  if (!apiKey || !environment) {
    const logger = require('../utils/logger');
    logger.warn('[AI] Peringatan: PINECONE_API_KEY atau PINECONE_ENVIRONMENT tidak ditemukan di .env. Fitur Vector DB tidak akan berjalan.');
    return;
  }

  try {
    // Note: using existing Pinecone ctor used in repo to preserve compatibility
    pc = new Pinecone({ apiKey });
    if (indexName) {
      try {
        pineconeIndex = pc.index(indexName);
      } catch (e) {
        const logger = require('../utils/logger');
        logger.warn('[AI] Peringatan: tidak dapat mengakses index Pinecone: ' + (e && e.message));
        pineconeIndex = null;
      }
    }
    const logger = require('../utils/logger');
    logger.info(`[AI] Pinecone Vector DB (Index: ${indexName || 'N/A'}) inisialisasi selesai.`);
  } catch (error) {
    const logger = require('../utils/logger');
    logger.error({ msg: '[AI] GAGAL terhubung ke Pinecone', error: error && (error.stack || error.message || error) });
  }
};

// Try to ensure the index is available; will attempt to init and return boolean
const ensureIndex = async (indexName, attempts = 3, delayMs = 1000) => {
  // quick sync init attempt
  try {
    initPinecone({ PINECONE_INDEX_NAME: indexName });
  } catch (e) {}

  for (let i = 0; i < attempts; i++) {
    if (pineconeIndex && typeof pineconeIndex.query === 'function') return true;
    // try re-initializing
    try {
      initPinecone({ PINECONE_INDEX_NAME: indexName });
    } catch (e) {}
    // wait before retry
    await new Promise(r => setTimeout(r, delayMs));
  }
  return !!(pineconeIndex && typeof pineconeIndex.query === 'function');
};

const getPineconeIndex = () => pineconeIndex;
const getPc = () => pc;

module.exports = {
  initPinecone,
  ensureIndex,
  getPineconeIndex,
  getPc,
};
