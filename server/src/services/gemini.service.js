// /pro_livechat/server/src/services/gemini.service.js
// (VERSI V18 FINAL - FIX SEMUA CELAH LOGIKA)

const geminiConfig = require('../config/gemini.config');
const aiCallHelper = require('../utils/aiCallHelper');
const { queryVectors } = require('./vector.service');
// require models lazily to avoid require-time DB coupling
const getDb = () => require('../../models');
const logger = require('../utils/logger');

// --- (A. FUNGSI V18: PANGGILAN AI #1 - KLASIFIKASI KATEGORI) ---
const getCategoryForQuery = async (queryText, websiteId) => {
  logger.info('[Gemini Service V18] Langkah 1: Mengklasifikasikan kategori...');

  try {
    const db = getDb();
    const categories = await db.KnowledgeCategory.findAll({
      where: { websiteId },
      attributes: ['id', 'name', 'description']
    });

    if (categories.length === 0) {
      logger.debug('[Gemini Service V18] Tidak ada kategori di DB. Mencari di semua.');
      return null;
    }

    const categoryList = categories.map(c => 
      `- ${c.name} (ID: ${c.id}): ${c.description || 'Tidak ada deskripsi.'}`
    ).join('\n');

  const genAI = geminiConfig.getGenAI();
  if (!genAI) throw new Error('Gemini service belum diinisialisasi.');
  const classifierModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' }); 
    const prompt = `
      Anda adalah AI classifier. Tugas Anda adalah mencocokkan pertanyaan user ke kategori knowledge base yang paling relevan.
      Pertanyaan User: "${queryText}"
      Daftar Kategori:
      ${categoryList}
      ---
      TUGAS: Kategori mana yang PALING RELEVAN untuk menjawab pertanyaan user?
      Jawab HANYA dengan ID Kategorinya (Contoh: "a1b2c3d4-...") atau "NULL" jika tidak ada yang relevan.
      JAWABAN (ID KATEGORI): 
    `;

  const result = await aiCallHelper.safeGenerate(classifierModel, prompt);
  const response = await (await result).response;
    let categoryId = response.text().trim();

    if (categoryId === 'NULL' || !categories.find(c => c.id === categoryId)) {
      logger.debug('[Gemini Service V18] AI tidak menemukan kategori relevan. Mencari di semua.');
      return null;
    }

    logger.info(`[Gemini Service V18] Kategori terdeteksi: ${categories.find(c => c.id === categoryId)?.name} (${categoryId})`);
    return categoryId;

  } catch (error) {
    logger.error({ msg: '[Gemini Service V18] GAGAL mengklasifikasikan kategori', error: error && (error.stack || error.message || error) });
    return null;
  }
};

// --- (B) FUNGSI KONTEKS (PERBAIKAN V18: CLASSIFIER FALLBACK) ---
const createContext = async (queryText, websiteId) => {
  try {
    // 1. Panggil AI #1 untuk memutuskan kategori (dengan error handling)
    let categoryId = null;
    try {
      categoryId = await getCategoryForQuery(queryText, websiteId);
    } catch (classifierError) {
      logger.warn('[Gemini Service V18] Classifier gagal (quota/network). Lanjut tanpa kategori filter.', classifierError.message);
      // Lanjutkan dengan categoryId=null (cari di semua kategori)
    }

    // 2. Panggil 'queryVectors' V16 dengan Pinecone error handling
    let relevantChunks = [];
    try {
      relevantChunks = await queryVectors(
        queryText, 
        5,          
        websiteId,  
        categoryId  // (Mungkin 'null' jika AI #1 gagal)
      );

      // --- (PERBAIKAN "CLASSIFIER FALLBACK" V18) ---
      if ((!relevantChunks || relevantChunks.length === 0) && categoryId !== null) {
        logger.debug('[Gemini Service V18] Fallback: Mencari di SEMUA kategori...');
        relevantChunks = await queryVectors(
          queryText,
          5,
          websiteId,
          null // Paksa cari di semua kategori
        );
      }
    } catch (pineconeError) {
      logger.warn('[Gemini Service V18] ⚠️ Pinecone unreachable (network/outage). AI akan jawab TANPA knowledge base.', pineconeError.message);
      // Kembalikan string kosong, bukan error - AI masih bisa jawab secara umum
      return "";
    }

    if (!relevantChunks || relevantChunks.length === 0) {
      logger.info('[Gemini Service V18] 📭 Tidak ada konteks relevan di Knowledge Base. AI akan jawab secara umum.');
      return ""; // Kosong = AI jawab tanpa context (bukan error)
    }

    // 3. Buat teks konteks
    const contextText = relevantChunks
      .map(match => `[Konteks: ${match.metadata.text}]`) 
      .join('\n\n---\n\n');
    return contextText;

  } catch (error) {
    logger.error({ msg: '[Gemini Service V18] GAGAL mengambil konteks', error: error && (error.stack || error.message || error) });
    return ""; // Fallback: AI tetap jalan tanpa context
  }
};// --- (C) FUNGSI RINGKASAN (V16 - EMPATHY - AMAN) ---
const generateSummary = async (chatHistory) => {
  logger.info('[Gemini Service V18] Memulai pembuatan ringkasan (Memori Jangka Panjang)...');
  
  try {
  const genAI = geminiConfig.getGenAI();
  if (!genAI) throw new Error('Gemini service belum diinisialisasi.');
  const summarizerModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const historyText = chatHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n');
    const prompt = `
      Anda adalah psikolog analitis. Tolong ringkas riwayat obrolan ini dalam 1-2 paragraf.
      Riwayat Obrolan: ${historyText}
      ---
      Tolong ekstrak 3 FAKTA PENTING berikut:
      1. NAMA VISITOR: (Jika visitor menyebutkan nama, tulis di sini. Jika tidak, tulis 'Belum diketahui'.)
      2. MASALAH UTAMA: (Apa topik utama atau masalah yang sedang dibahas?)
      3. MOOD/EMOSI VISITOR: (Pilih salah satu: 'Netral', 'Senang', 'Bingung', 'Kesal', 'Marah')
      ---
      Ringkasan Anda:
    `;

  const result = await aiCallHelper.safeGenerate(summarizerModel, prompt);
  const response = await (await result).response;
    const summary = response.text();
    logger.info(`[Gemini Service V18] Ringkasan (plus emosi) berhasil dibuat.`);
    return summary;
    
  } catch (error) {
    logger.error({ msg: '[Gemini Service V18] GAGAL membuat ringkasan', error: error && (error.stack || error.message || error) });
    return null;
  }
};


// --- (D) FUNGSI BALASAN (PERBAIKAN V18: MEMORY GAP & PACING) ---
const generateChatResponse = async (queryText, chatHistory, conversation) => {
  
  // 1. Ambil Persona LENGKAP (V16 - AMAN)
  let persona;
  const fallbackPersona = {
      nama_persona: 'Asisten',
      gaya_bicara: 'Anda adalah asisten yang ramah dan profesional.',
      salam_pembuka: 'Halo, ada yang bisa dibantu?',
      salam_penutup: 'Ada lagi yang bisa dibantu?',
      modelName: 'gemini-2.0-flash' 
    };

  try {
    const db = getDb();
    persona = await db.AIPersona.findOne({ where: { websiteId: conversation.websiteId } });
    if (!persona) persona = fallbackPersona;
  } catch (error) {
    persona = fallbackPersona;
  }

  // 2. BUAT MODEL AI DINAMIS (V16 - AMAN)
  const genAI = geminiConfig.getGenAI();
  if (!genAI) throw new Error('Gemini service belum diinisialisasi.');
  const dynamicChatModel = genAI.getGenerativeModel({ model: persona.modelName }); 
  
  // 3. Ambil Konteks "Otak" (V18 - AMAN DENGAN FALLBACK)
  const context = await createContext(queryText, conversation.websiteId);
  
  // 4. AMBIL "MEMORI JANGKA PANJANG" (V16 - AMAN)
  const longTermMemory = conversation.aiSummary || 'Belum ada ringkasan.';
  
  // 5. Ambil "Memori Jangka Pendek" (PERBAIKAN "MEMORY GAP" V18)
  const shortTermMemory = Array.isArray(chatHistory) 
    ? chatHistory
    .slice(-10) // <-- (Diubah dari -5 menjadi -10)
    .map(msg => `${msg.role}: ${msg.content}`)
    .join('\n')
    : '';

  // 6. Logika Sapaan Kritis V17 (AMAN)
  let greeting = '';
  const isFirstMessage = conversation.Messages && conversation.Messages.length === 1 && conversation.Messages[0].senderType === 'visitor';

  if (isFirstMessage && persona.salam_pembuka) {
    greeting = persona.salam_pembuka;
    if (greeting) {
        greeting += `\n\n`; // Tambahkan jarak
    }
  }

  // 7. Bangun "Prompt Master" V20 (PERBAIKAN: ANTI-REPETISI AGRESIF + CONTEXT CONTINUITY)
  const masterPrompt = `
    ---
    PERSONA ANDA (WAJIB DIIKUTI 100%):
    - Nama Anda: ${persona.nama_persona}
    - Gaya Bicara Anda: ${persona.gaya_bicara}
    - Salam Pembuka: JANGAN GUNAKAN SALAM PEMBUKA LAGI (Sudah ditangani).
    - Salam Penutup: ${persona.salam_penutup || 'Ada lagi yang bisa dibantu?'}
    ---
    CONTEXT (Knowledge Base): 
    ${context}
    ---
    LONG-TERM MEMORY (Ringkasan Chat + Emosi User): 
    ${longTermMemory}
    ---
    SHORT-TERM MEMORY (10 Pesan Terakhir): 
    ${shortTermMemory}
    ---
    🚨 SAFETY GUARDRAILS (WAJIB IKUTI):
    
    1. FOKUS TOPIK - JANGAN MELENCENG:
       - HANYA jawab pertanyaan yang relevan dengan CONTEXT (Knowledge Base).
       - Jika user bertanya hal di LUAR konteks (misal: politik, agama, topik pribadi), balas:
         "Mohon maaf kak, saya hanya bisa bantu untuk informasi terkait layanan kami ya 🙏"
    
    2. ANTI-HALUSINASI - JANGAN MENGARANG:
       - WAJIB gunakan informasi dari CONTEXT untuk menjawab.
       - Jika CONTEXT kosong atau tidak ada info relevan, JANGAN mengarang! Balas:
         "Mohon maaf kak, untuk pertanyaan ini saya belum punya informasinya. Bisa tolong diperjelas atau ditanyakan hal lain?"
       - JANGAN PERNAH membuat angka, tanggal, atau fakta jika tidak ada di CONTEXT.
    
    3. KONSISTENSI - JANGAN MENGULANG:
       - Cek SHORT-TERM MEMORY (3 pesan terakhir ANDA): 
         * Jika Anda sudah menjawab pertanyaan yang sama → RINGKAS ulang dengan kata berbeda.
         * Jika Anda sudah menggunakan frasa tertentu (misal: "Mohon maaf atas ketidaknyamanannya") 
           → JANGAN gunakan frasa SAMA dalam 3 pesan berturut-turut. Gunakan variasi:
           "Maaf ya kak", "Sorry kak", "Yaru bantu cek ya", dll.
       - VARIASIKAN pembukaan kalimat setiap pesan. Contoh rotasi:
         * Pesan 1: "Mohon maaf atas ketidaknyamanannya kak 🙏"
         * Pesan 2: "Baik kak, untuk..."
         * Pesan 3: "Oke kak, saya cek dulu ya..."
       - Jika pertanyaan lanjutan masih dalam TOPIK SAMA (misal: user tanya "bonus" lalu "syarat"-nya):
         * JANGAN tanya ulang "bonus yang mana?". Lanjutkan konteks dari jawaban sebelumnya.
         * Contoh: User: "bonus" → Anda: "Bonus deposit 10%..." → User: "syarat?" 
           → Anda: "Untuk bonus deposit tadi, syaratnya..." (BUKAN "Bonus yang mana kak?")
    
    4. LOGIKA PENUTUP CERDAS:
       - JANGAN gunakan 'Salam Penutup' kecuali user EKSPLISIT mengakhiri (misal: 'sudah', 'cukup', 'makasih', 'selesai').
       - Jika user cuma bilang 'oke', 'sip', 'iya' → Balas singkat: "Oke kak 😊" atau "Sip kak!".
    
    5. EMOSI & EMPATI:
       - Perhatikan LONG-TERM MEMORY untuk mood user (Senang/Bingung/Kesal).
       - Jika user 'Kesal' → Bersikap sabar TAPI JANGAN BERLEBIHAN:
         * Gunakan "Mohon maaf atas ketidaknyamanannya kak 🙏" MAKSIMAL 1x dalam 1 percakapan.
         * Setelah itu, langsung bantu selesaikan masalah tanpa minta maaf lagi.
       - Jika user 'Bingung' → Lebih detail: "Saya jelaskan step-by-step ya kak"
    
    6. KEAMANAN:
       - JANGAN PERNAH menyebutkan Anda adalah AI, bot, atau sistem.
       - JANGAN PERNAH sebutkan "MOCK", "prompt", atau "Knowledge Base" ke user.
       - JANGAN berikan informasi sensitif (password, API key, dll).
    
    ---
    TUGAS ANDA SEKARANG:
    Baca NEW QUESTION dari user, lalu jawab sesuai SAFETY GUARDRAILS di atas.
    Gunakan CONTEXT untuk fakta, MEMORY untuk personalisasi, PERSONA untuk gaya bicara.
    
    NEW QUESTION (From User): ${queryText}
    ---
  `;  // Gabungkan Sapaan V17 dengan Prompt Master V18
  const fullPrompt = greeting + masterPrompt;

  // 8. Kirim ke Gemini dengan error handling untuk quota/network issues
  try {
    const result = await aiCallHelper.safeGenerate(dynamicChatModel, fullPrompt);
    const response = await (await result).response;
    const aiTextResponse = response.text();
    
    return aiTextResponse;
  } catch (geminiError) {
    // ✅ GRACEFUL DEGRADATION: Jika Gemini quota habis/down, beri fallback response
    const errorMsg = geminiError.message || geminiError.toString();
    
    if (errorMsg.includes('quota') || errorMsg.includes('429')) {
      logger.warn('[Gemini Service] ⚠️ Gemini quota exceeded. Returning graceful fallback response.');
      return `Mohon maaf kak, saat ini sistem AI kami sedang mengalami keterbatasan. Untuk informasi lebih lanjut, bisa hubungi customer service kami ya. Terima kasih atas pengertiannya 🙏`;
    }
    
    if (errorMsg.includes('Circuit is open')) {
      logger.warn('[Gemini Service] ⚠️ Circuit breaker open. Too many recent failures.');
      return `Mohon maaf kak, saat ini sistem AI kami sedang dalam pemulihan. Silakan hubungi customer service untuk bantuan lebih lanjut. Terima kasih 🙏`;
    }
    
    // Generic network/API error
    logger.error('[Gemini Service] ⚠️ Gemini API error:', errorMsg);
    return `Mohon maaf kak, saat ini ada kendala teknis. Silakan coba lagi sebentar atau hubungi customer service kami. Terima kasih atas pengertiannya 🙏`;
  }
};// --- (E) GENERATE A SHORT SUGGESTION (Agent-Assist) ---
const generateSuggestion = async (queryText, websiteId) => {
  try {
    // 1. Try to classify category for context source
    let categoryId = null;
    let categoryName = null;
    try {
      categoryId = await getCategoryForQuery(queryText, websiteId);
      if (categoryId) {
        const db = getDb();
        const cat = await db.KnowledgeCategory.findByPk(categoryId);
        if (cat) categoryName = cat.name;
      }
    } catch (e) {
      // non-fatal
    }

    // 2. Ambil konteks (fallback ke createContext)
    const context = await createContext(queryText, websiteId);

    const genAI = geminiConfig.getGenAI();
    if (!genAI) return null;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `
Kamu adalah asisten cerdas yang membantu admin live chat LXGROUP dengan memberikan SARAN BALASAN yang profesional.

CONTEXT (Knowledge Base):
${context}

PERTANYAAN USER:
${queryText}

TUGAS:
Berikan 1 SARAN BALASAN terbaik untuk admin dalam format JSON berikut (HANYA JSON, tidak ada teks lain):
{
  "suggestion": "Balasan dalam Bahasa Indonesia, natural, 2-3 kalimat (60-100 kata)",
  "confidence": 85,
  "reasoning": "Penjelasan singkat kenapa ini balasan terbaik"
}

ATURAN WAJIB:
1. GUNAKAN informasi dari CONTEXT di atas untuk accuracy.
2. BAHASA INDONESIA yang natural, ramah, dan profesional.
3. Panjang ideal: 2-3 kalimat (tidak terlalu pendek, tidak terlalu panjang).
4. Tone: Seperti CS profesional (friendly tapi expert).
5. JANGAN sebutkan "AI", "bot", atau "sistem otomatis".
6. Confidence (0-100): Berikan score seberapa yakin jawaban ini akurat.
   - 90-100: Sangat yakin (ada di CONTEXT, jelas)
   - 70-89: Cukup yakin (ada di CONTEXT, butuh sedikit asumsi)
   - 50-69: Kurang yakin (CONTEXT tidak lengkap)
   - <50: Tidak yakin (CONTEXT kosong/tidak relevan) → Jangan tampilkan ke admin
7. Jika CONTEXT kosong atau tidak relevan dengan pertanyaan:
   - suggestion: "Mohon maaf kak, saya belum punya informasi lengkap untuk pertanyaan ini. Bisa tolong diperjelas atau saya hubungkan dengan supervisor?"
   - confidence: 40
8. Output HARUS valid JSON object (tidak ada markdown, tidak ada backtick).

CONTOH OUTPUT BAGUS:
{
  "suggestion": "Untuk bonus deposit harian, kakak bisa dapat bonus otomatis 10% dengan turnover (TO) hanya 1x. Bonus maksimal Rp 20.000 per hari dan cuma bisa diklaim 1x sehari per akun. Mau langsung saya bantu proses klaimnya kak?",
  "confidence": 95,
  "reasoning": "Informasi lengkap dari Knowledge Base tentang bonus deposit, sudah include syarat dan call-to-action"
}
`;
  const result = await aiCallHelper.safeGenerate(model, prompt);
  const response = await (await result).response;
  let suggestionText = response.text().trim();
  
  // Parse JSON response (single suggestion object)
  let parsedSuggestion = null;
  try {
    // Remove markdown code blocks if present
    suggestionText = suggestionText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    parsedSuggestion = JSON.parse(suggestionText);
    
    // Validate structure
    if (!parsedSuggestion.suggestion || !parsedSuggestion.confidence) {
      throw new Error('Invalid suggestion format: missing required fields');
    }
    
    // Validate confidence score
    const confidence = parseInt(parsedSuggestion.confidence);
    if (isNaN(confidence) || confidence < 0 || confidence > 100) {
      parsedSuggestion.confidence = 50; // Default fallback
    }
    
    logger.debug('[Gemini Service] Generated suggestion with confidence: ' + parsedSuggestion.confidence);
  } catch (parseError) {
    logger.error('[Gemini Service] Failed to parse suggestion JSON:', parseError);
    // Fallback: Treat raw text as suggestion with low confidence
    parsedSuggestion = {
      suggestion: suggestionText || 'Mohon maaf, gagal generate suggestion.',
      confidence: 30,
      reasoning: 'Fallback due to parse error'
    };
  }
  
  logger.debug('[Gemini Service] suggestionText length=' + ((suggestionText || '').length));

    // 3. Return structured suggestion with metadata
    return {
      suggestion: parsedSuggestion.suggestion,
      confidence: parsedSuggestion.confidence,
      reasoning: parsedSuggestion.reasoning || null,
      categoryId: categoryId || null,
      categoryName: categoryName || null
    };
  } catch (error) {
    logger.error({ msg: '[Gemini Service] generateSuggestion failed', error: error && (error.stack || error.message || error) });
    return null;
  }
};

  // EXPORT SEMUA FUNGSI
  // Export the public functions from this service (placed after all declarations
  // to avoid temporal dead zone issues when requiring this module)
  module.exports = {
    getCategoryForQuery,
    createContext,
    generateSummary,
    generateChatResponse,
    generateSuggestion
  };