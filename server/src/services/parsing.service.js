// /pro_livechat/server/src/services/parsing.service.js
// (VERSI V15.6 FINAL - BERSIH - TANPA DUPLIKAT)

// Ambil "Ruang Mesin" Vector
const { getDocumentEmbedding, upsertVectors } = require('./vector.service');
const { v4: uuidv4 } = require('uuid');

// --- (A) FUNGSI CHUNKING (UPGRADE V15.6 - SANITIZE EMOJI) ---
const splitTextIntoChunks = (text) => {
  // (1. REGEX PROFESIONAL UNTUK MEMBUANG EMOJI)
  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2B50}]/gu;
  
  // (2. BERSIHKAN TEKS DARI EMOJI dan 3+ newlines)
  const cleanedText = text
    .replace(emojiRegex, '') // <-- (FIX #1) HAPUS EMOJI
    .replace(/(\r\n|\n|\r){3,}/g, '\n\n'); // <-- (FIX #2) HAPUS NEWLINE BERLEBIH

  return cleanedText.split(/\n\n/)
    .map(chunk => chunk.trim())
    .filter(chunk => chunk.length > 20); // Hanya ambil chunk yang 'berisi'
};

// --- (B) FUNGSI EKSTRAK TEKS (BISA PDF / TXT) ---
const extractTextFromBuffer = async (buffer, fileName) => {
  if (fileName.endsWith('.pdf')) {
    try {
      const pdf = (await import('pdf-parse')).default;
      const data = await pdf(buffer);
      return data.text;
    } catch (error) {
      const logger = require('../utils/logger');
      logger.error('[Parsing Service] GAGAL membaca file PDF: ' + (error && (error.stack || error.message)));
      throw new Error('File PDF rusak atau tidak bisa dibaca.');
    }
  } 
  else if (fileName.endsWith('.txt')) {
    return buffer.toString('utf-8');
  } 
  else {
    throw new Error('Format file tidak didukung. Harap upload .pdf atau .txt');
  }
};

// --- (C) FUNGSI UTAMA (V15.5 - AMAN) ---
const processFile = async (buffer, fileName, websiteId, knowledgeId, categoryId) => {
  try {
    // 1. Ekstrak teks
    const text = await extractTextFromBuffer(buffer, fileName);
    if (!text) {
      throw new Error('File kosong atau tidak bisa dibaca.');
    }

    // 2. Potong-potong teks (Panggil fungsi V15.6 yang sudah bersih)
  const logger = require('../utils/logger');
  const chunks = splitTextIntoChunks(text);
  logger.info(`[Parsing Service V15.6] File '${fileName}' dipotong jadi ${chunks.length} chunks (bebas emoji).`);

    // 3. Ubah setiap chunk jadi Vektor
    const vectors = [];
    for (const chunkText of chunks) {
      const embedding = await getDocumentEmbedding(chunkText); 
      vectors.push({
        id: uuidv4(),
        values: embedding,
        metadata: {
          websiteId: websiteId,
          knowledgeId: knowledgeId,
          text: chunkText,
            categoryId: categoryId 
        }
      });
    }

    // 4. Simpan semua vektor ke Pinecone
    if (vectors.length > 0) {
      await upsertVectors(vectors);
      logger.info(`[Parsing Service V15.6] Berhasil menyimpan ${vectors.length} vektor (Kategori: ${categoryId}) ke Pinecone.`);
      return { success: true, chunkCount: vectors.length };
    } else {
      logger.info('[Parsing Service V15.6] Tidak ada chunk teks yang valid untuk diproses.');
      return { success: false, chunkCount: 0 };
    }

  } catch (error) {
    const logger = require('../utils/logger');
    logger.error(`[Parsing Service V15.6] GAGAL memproses file '${fileName}': ` + (error && (error.stack || error.message)));
    throw error;
  }
};

module.exports = {
  processFile,
  splitTextIntoChunks
};