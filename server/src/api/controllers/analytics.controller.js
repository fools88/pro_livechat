// /pro_livechat/server/src/api/controllers/analytics.controller.js
// (VERSI V12 - FINAL - FIXED)

const db = require('../../../models'); // <-- (1) INI DIA FIX-NYA
const logger = require('../../utils/logger');

// (A) FUNGSI UNTUK MENGAMBIL "4 KARTU STATS"
exports.getStats = async (req, res) => {
  try {
    // (2) Kita jalankan 4 query database secara bersamaan (paralel)
    const [totalConversations, totalMessages, aiMessages, adminMessages] = await Promise.all([

      // Query 1: Hitung total semua percakapan
      db.Conversation.count(),

      // Query 2: Hitung total semua pesan
      db.Message.count(),

      // Query 3: Hitung pesan yang dikirim oleh 'ai'
      db.Message.count({ where: { senderType: 'ai' } }),

      // Query 4: Hitung pesan yang dikirim oleh 'admin'
      db.Message.count({ where: { senderType: 'admin' } })
    ]);

    // (3) Kirim hasilnya sebagai 1 objek
    res.status(200).json({
      totalConversations,
      totalMessages,
      aiMessages,
      adminMessages
    });

  } catch (error) {
    logger.error('[ANALYTICS API] Gagal ambil stats: ' + (error && (error.stack || error.message)));
    res.status(500).json({ message: 'Error server saat mengambil stats.' });
  }
};