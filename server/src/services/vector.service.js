// /pro_livechat/server/src/services/vector.service.js
// (VERSI V16 FINAL - MENGGUNAKAN TASK TYPE & FILTER)

// Ambil "Konektor" V16 kita (lazy getters)
const geminiConfig = require('../config/gemini.config');
const pineconeConfig = require('../config/pinecone.config');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

// --- (A) FUNGSI EMBEDDING DOKUMEN (PENTING UNTUK UPLOAD) ---
const getDocumentEmbedding = async (text) => {
  const embeddingModel = geminiConfig.getEmbeddingModel();
  if (!embeddingModel) {
    throw new Error('Embedding model (Gemini) tidak siap.');
  }
  try {
    // (FIX V16: Menggunakan struktur Content yang wajib)
    const result = await embeddingModel.embedContent({
      content: {
        role: "user", 
        parts: [{ text: text }]
      },
      // (FIX V16: Task Type wajib untuk gemini-embedding-001)
      taskType: "RETRIEVAL_DOCUMENT" 
    });
    return result.embedding.values; 
  } catch (error) {
    logger.error({ msg: '[Vector Service V16] GAGAL membuat embedding DOKUMEN', error: error && (error.stack || error.message || error) });
    throw error;
  }
};

// --- (B) FUNGSI UNTUK MENYIMPAN "OTAK" KE PINECONE ---
const upsertVectors = async (vectors) => {
  const pineconeIndex = pineconeConfig.getPineconeIndex();
  if (!pineconeIndex) {
    throw new Error('Pinecone index tidak siap.');
  }
  try {
    await pineconeIndex.upsert(vectors);
    logger.info(`[Vector Service V16] Berhasil menyimpan ${vectors.length} vektor ke Pinecone.`);
  } catch (error) {
    logger.error({ msg: '[Vector Service V16] GAGAL menyimpan vektor ke Pinecone', error: error && (error.stack || error.message || error) });
    throw error;
  }
};

// --- (C) FUNGSI UNTUK MENCARI "OTAK" (UPGRADE V16) ---
const queryVectors = async (queryText, topK = 5, websiteId, categoryId = null) => {
  const embeddingModel = geminiConfig.getEmbeddingModel();
  if (!embeddingModel) {
    throw new Error('AI Service (Gemini) tidak siap.');
  }

  logger.debug(`[Vector Service V16] Mencari di Pinecone. Kategori: ${categoryId || 'SEMUA'}`);

  try {
    // 1. Ubah pertanyaan user jadi vektor (FIX V16)
    const queryEmbedding = await embeddingModel.embedContent({
      content: {
        role: "user",
        parts: [{ text: queryText }]
      },
      taskType: "RETRIEVAL_QUERY"
    });
    const queryVector = queryEmbedding.embedding.values;

    // 2. Membuat filter dinamis V16 (Filter Kategori)
    let filterQuery = {
      websiteId: { '$eq': websiteId }
    };
    if (categoryId) {
      filterQuery.categoryId = { '$eq': categoryId };
    }

    // 3. Cari di Pinecone (dengan retry jika index belum siap)
    const getIndexWithRetry = async (attempts = 3, delayMs = 1000) => {
      for (let i = 0; i < attempts; i++) {
        const idx = pineconeConfig.getPineconeIndex();
        if (idx && typeof idx.query === 'function') return idx;
        // try to initialize/ensure index
        try {
          await pineconeConfig.ensureIndex(process.env.PINECONE_INDEX_NAME || undefined, 1, delayMs);
        } catch (e) {}
        await new Promise(r => setTimeout(r, delayMs));
      }
      return null;
    };

    const pineconeIndex = await getIndexWithRetry(3, 1000);
    if (!pineconeIndex) {
      throw new Error('Pinecone index tidak siap setelah beberapa percobaan.');
    }

    const results = await pineconeIndex.query({
      vector: queryVector,
      topK: topK,
      includeMetadata: true,
      filter: filterQuery
    });

    // 4. Kembalikan hasilnya
    return results.matches;

  } catch (error) {
    logger.error({ msg: '[Vector Service V16] GAGAL mencari vektor di Pinecone', error: error && (error.stack || error.message || error) });
    throw error;
  }
};

// Ekspor semua fungsi "ruang mesin" kita
module.exports = {
  getDocumentEmbedding,
  upsertVectors,
  queryVectors,
};
