// /pro_livechat/server/src/config/gemini.config.js
// (VERSI V16 - MODEL ENGINE TERBARU)

require('dotenv').config();
const { GoogleGenerativeAI } = (() => {
    try {
        return require('@google/generative-ai');
    } catch (e) {
        // If package isn't installed in some environments (CI with mocks), we'll
        // handle by falling back to mock implementations below.
        return {};
    }
})();

let genAI = null;
let embeddingModel = null;

// SMART MOCK AI (V2.0) - Mengikuti Persona & Context dari Database
const createMockGenAI = () => {
    const makeModel = (name) => ({
        // mimic generateContent API expected by aiCallHelper.safeGenerate
        generateContent: async (prompt) => {
            const promptStr = String(prompt);
            let text;
            
            // === CHAT RESPONSE (PALING PENTING) ===
            if (promptStr.includes('NEW QUESTION')) {
                // Extract key information from prompt
                const personaNameMatch = promptStr.match(/Nama Anda:\s*(.+?)(?:\n|$)/);
                const personaName = personaNameMatch ? personaNameMatch[1].trim() : 'Asisten';
                
                const contextMatch = promptStr.match(/CONTEXT \(Knowledge Base\):\s*([\s\S]*?)(?:\n---\n|$)/);
                const hasContext = contextMatch && contextMatch[1].trim() && !contextMatch[1].includes('Tidak ada konteks');
                
                const questionMatch = promptStr.match(/NEW QUESTION.*?:\s*(.+?)(?:\n---|\n$|$)/);
                const question = questionMatch ? questionMatch[1].trim().toLowerCase() : '';
                
                const closingMatch = promptStr.match(/Salam Penutup:\s*(.+?)(?:\n|$)/);
                const closingPhrase = closingMatch ? closingMatch[1].trim() : 'Ada lagi yang bisa dibantu?';
                
                // Check if question suggests ending conversation
                const isEnding = /^(sudah|tidak|ga|gak|ngga|nggak|cukup|selesai|makasih|terima kasih|thanks|bye|ok saja|oke saja)/i.test(question);
                
                // Check for simple acknowledgment (oke, sip, ya, iya)
                const isSimpleAck = /^(oke|ok|sip|ya|iya|baik|mantap|siap|good)$/i.test(question);
                
                // SMART RESPONSE LOGIC
                if (isSimpleAck) {
                    // User just says "oke/sip/ya" - respond briefly without closing
                    text = question.match(/sip|mantap|good/i) ? 'Sip kak! 😊' : 'Oke kak 😊';
                } else if (isEnding) {
                    // User is ending conversation
                    text = `Terima kasih sudah menghubungi kami! ${closingPhrase}`;
                } else if (hasContext) {
                    // AI has knowledge base context - give informed answer
                    const contextPreview = contextMatch[1].trim().substring(0, 200);
                    
                    // Detect question type and give specific response
                    if (question.includes('bonus') || question.includes('promo')) {
                        text = 'Baik kak! Untuk info bonus terbaru, saat ini kami punya beberapa promo menarik yang bisa kak manfaatkan. Mau tahu lebih detail tentang bonus yang mana kak?';
                    } else if (question.includes('cara') || question.includes('bagaimana') || question.includes('gimana')) {
                        text = 'Siap kak, saya bantu jelaskan step-by-step ya. Caranya cukup mudah kok!';
                    } else if (question.includes('syarat') || question.includes('ketentuan') || question.includes('aturan')) {
                        text = 'Baik kak, untuk syarat dan ketentuannya sudah saya cek. Bisa saya jelaskan detailnya.';
                    } else if (question.includes('deposit') || question.includes('setor')) {
                        text = 'Untuk deposit sangat mudah kak. Bisa pakai transfer bank atau e-wallet. Mau pakai metode apa kak?';
                    } else if (question.includes('withdraw') || question.includes('tarik') || question.includes('wd')) {
                        text = 'Proses withdraw biasanya cepat kak, 5-15 menit sudah masuk. Ada yang mau ditanyakan soal WD?';
                    } else if (question.includes('halo') || question.includes('hi') || question.includes('hai') || question.includes('hello')) {
                        text = 'Halo kak! Selamat datang 😊 Ada yang bisa saya bantu hari ini?';
                    } else if (question.includes('help') || question.includes('bantuan') || question.includes('bantu')) {
                        text = 'Tentu kak! Saya siap bantu. Kira-kira mau tanya tentang apa ya?';
                    } else {
                        // Generic helpful response
                        text = 'Baik kak, saya cek dulu ya informasinya. Bisa tolong diperjelas sedikit pertanyaannya?';
                    }
                } else {
                    // No context in Knowledge Base
                    if (question.includes('halo') || question.includes('hi') || question.includes('hai') || question.includes('hello')) {
                        text = 'Halo kak! Selamat datang di layanan kami 😊 Ada yang bisa saya bantu?';
                    } else if (question.includes('bonus') || question.includes('promo')) {
                        text = 'Untuk info bonus dan promo terbaru, bisa tolong sebutkan lebih spesifik bonus yang mana kak? Biar saya bisa bantu cek 😊';
                    } else if (question.includes('cara') || question.includes('bagaimana') || question.includes('gimana')) {
                        text = 'Siap bantu kak! Mau tanya cara untuk apa ya? Biar saya bisa jelaskan lebih detail.';
                    } else {
                        // Polite deflection for unknown topics
                        text = 'Mohon maaf kak, bisa tolong diperjelas pertanyaannya? Atau ada hal lain yang bisa saya bantu? 🙏';
                    }
                }
            }
            // === CATEGORY CLASSIFICATION ===
            else if (promptStr.includes('classifier') || promptStr.includes('Kategori')) {
                text = 'NULL'; // No category match in mock mode
            }
            // === SUMMARY REQUEST ===
            else if (promptStr.includes('ringkas') || promptStr.includes('FAKTA PENTING')) {
                // Extract visitor messages from history if available
                const historyMatch = promptStr.match(/visitor:\s*(.+?)(?:\n|$)/i);
                const visitorMsg = historyMatch ? historyMatch[1].trim() : 'pertanyaan umum';
                text = `Ringkasan Chat:\nVisitor menanyakan tentang ${visitorMsg}. Percakapan berjalan lancar.\n\nFAKTA PENTING:\n1. NAMA VISITOR: Belum disebutkan\n2. MASALAH UTAMA: ${visitorMsg}\n3. MOOD/EMOSI VISITOR: Netral`;
            }
            // === AGENT ASSIST SUGGESTION ===
            else if (promptStr.includes('saran balasan') || promptStr.includes('suggestion')) {
                const questionMatch = promptStr.match(/Pertanyaan.*?:\s*"(.+?)"/);
                const question = questionMatch ? questionMatch[1] : '';
                
                if (question.toLowerCase().includes('bonus') || question.toLowerCase().includes('promo')) {
                    text = 'Saran: "Baik kak, untuk info bonus dan promo terbaru bisa langsung saya infokan. Mau tanya bonus untuk game apa kak?"';
                } else if (question.toLowerCase().includes('cara')) {
                    text = 'Saran: "Siap kak, saya bantu jelaskan step-by-step ya. Kira-kira mau tanya cara untuk apa kak?"';
                } else {
                    text = 'Saran: "Baik kak, bisa tolong diperjelas pertanyaannya? Biar saya bisa bantu lebih detail 😊"';
                }
            }
            // === DEFAULT FALLBACK ===
            else {
                text = `[MOCK AI Mode] Model ${name} siap memproses request.`;
            }
            
            return {
                response: Promise.resolve({ text: () => text })
            };
        },
        // embedContent used by vector.service
        embedContent: async ({ content }) => {
            const s = (typeof content === 'string') ? content : JSON.stringify(content);
            // create deterministic pseudo-embedding from string length & char codes
            const base = Array.from({ length: 8 }).map((_, i) => ((s.charCodeAt(i % s.length) || 1) % 10) / 10);
            return { embedding: { values: base } };
        }
    });

    return {
        getGenerativeModel: ({ model }) => makeModel(model || 'mock-model')
    };
};

const logger = require('../utils/logger');

const initGemini = (opts = {}) => {
    // reload .env in case it changed on disk since process start
    try { require('dotenv').config(); } catch (e) {}

    const useMock = String(process.env.MOCK_AI || '').toLowerCase() === 'true' || process.env.NODE_ENV === 'test';
    if (useMock) {
        genAI = createMockGenAI();
        embeddingModel = genAI.getGenerativeModel({ model: 'mock-embedding' });
        logger.info('[AI] Using MOCK Gemini service (MOCK_AI=true).');
        return;
    }

    const key = process.env.GOOGLE_GEMINI_API_KEY || opts.GOOGLE_GEMINI_API_KEY;
    if (!key || key === 'MASUKKAN_KEY_GEMINI_KAMU_DI_SINI') {
        logger.warn('[AI] Peringatan: GOOGLE_GEMINI_API_KEY tidak ditemukan. Fitur AI tidak akan berjalan.');
        return;
    }

    try {
        genAI = new GoogleGenerativeAI(key);
        embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
        logger.info('[AI V16] Google Gemini service siap.');
    } catch (error) {
        logger.error({ msg: '[AI] GAGAL terhubung ke Google Gemini', error: error && (error.stack || error.message || error) });
    }
};

// Lazy getter: init on first request and reload .env from disk so new keys take effect
const getGenAI = () => {
    if (!genAI) {
        try { require('dotenv').config(); } catch (e) {}
        initGemini();
    }
    return genAI;
};

const getEmbeddingModel = () => {
    if (!embeddingModel) {
        try { require('dotenv').config(); } catch (e) {}
        initGemini();
    }
    return embeddingModel;
};

module.exports = {
    initGemini,
    getGenAI,
    getEmbeddingModel,
};
