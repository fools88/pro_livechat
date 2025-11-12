// /pro_livechat/server/src/api/controllers/conversation.controller.js
// (VERSI V3 - FINAL - FIXED)

const db = require('../../../models'); // (1) FIX: 'db' SUDAH DI-IMPORT
const logger = require('../../utils/logger'); // (2) FIX: Import logger

// (A) Ambil DAFTAR SEMUA percakapan (VERSI UPGRADE V3)
exports.getConversations = async (req, res) => {
  try {
    // (1) Ambil info user yang sedang login
    const loggedInUserId = req.userId;
    const loggedInUserRole = req.userRole;

    let conversations;

    // (2) JIKA DIA SUPER ADMIN, tampilkan SEMUA
    if (loggedInUserRole === 'admin') {
      logger.info('[API Convo] User adalah SUPER ADMIN. Mengambil semua chat.');
      conversations = await db.Conversation.findAll({
        order: [['updatedAt', 'DESC']],
        include: [
          { model: db.Visitor },
          { model: db.Website, attributes: ['name'] },
          {
            model: db.Message, // (1) Sertakan "Pesan"
            limit: 1, // (2) Hanya 1 pesan
            order: [['createdAt', 'DESC']] // (3) Yang PALING BARU (Terakhir)
          }
        ]
      });
    } 
    // (3) JIKA DIA AGENT BIASA, filter
    else {
      logger.info(`[API Convo] User adalah AGENT ${loggedInUserId}. Memfilter chat...`);

      const user = await db.User.findByPk(loggedInUserId, {
        include: { model: db.Website, attributes: ['id'] }
      });

      const assignedWebsiteIds = user.Websites.map(ws => ws.id);

      if (assignedWebsiteIds.length === 0) {
        logger.info(`[API Convo] Agent ${loggedInUserId} tidak ditugaskan ke website manapun.`);
        return res.status(200).json([]);
      }

      conversations = await db.Conversation.findAll({
        where: {
          websiteId: assignedWebsiteIds
        },
        order: [['updatedAt', 'DESC']],
        include: [
          { model: db.Visitor },
          { model: db.Website, attributes: ['name'] },
          {
            model: db.Message, // (1) Sertakan "Pesan"
            limit: 1, // (2) Hanya 1 pesan
            order: [['createdAt', 'DESC']] // (3) Yang PALING BARU (Terakhir)
          }
        ]
      });
    }

    res.status(200).json(conversations);

  } catch (error) {
    logger.error('[CONVO API] Gagal ambil conversations: ' + (error && (error.stack || error.message)));
    res.status(500).json({ message: 'Error server' });
  }
};

// (B) Ambil ISI PESAN dari 1 percakapan dengan VISITOR INFO (ENHANCED V17)
exports.getMessagesForConversation = async (req, res) => {
  const { conversationId } = req.params;
  
  logger.info(`[CONVO API] Fetching messages for conversation: ${conversationId}`);
  
  try {
    // Validate conversationId
    if (!conversationId) {
      return res.status(400).json({ error: 'Conversation ID is required' });
    }
    
    // 1. Ambil messages (🆕 V23: Include files)
    const messages = await db.Message.findAll({
      where: { conversationId },
      include: [{ 
        model: db.File, 
        as: 'files', 
        required: false 
      }],
      order: [['createdAt', 'ASC']], // Tampilkan dari yang terlama
    });
    
    logger.info(`[CONVO API] Found ${messages.length} messages for conversation ${conversationId}`);
    
    // 2. Ambil conversation dengan visitor details
    const conversation = await db.Conversation.findByPk(conversationId, {
      include: [
        { 
          model: db.Visitor,
          required: false
        },
        { 
          model: db.Website,
          required: false
        }
      ]
    });
    
    if (!conversation) {
      logger.warn(`[CONVO API] Conversation not found: ${conversationId}`);
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    // 3. Return enhanced response
    res.status(200).json({
      messages,
      visitor: conversation.Visitor || null,
      website: conversation.Website || null,
      conversationMeta: {
        status: conversation.status,
        isAiActive: conversation.isAiActive,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt
      }
    });
  } catch (error) {
    logger.error('[CONVO API] Gagal ambil messages: ' + (error && (error.stack || error.message)));
    res.status(500).json({ message: 'Error server' });
  }
};

// (C) Ambil ISI PESAN untuk VISITOR (Public endpoint dengan validasi)
exports.getMessagesForVisitor = async (req, res) => {
  const { conversationId } = req.params;
  const { visitorKey } = req.query; // Sebenarnya ini 'browserFingerprint' dari widget
  
  try {
    // Validasi: Cek apakah conversation ini milik visitor ini
    const conversation = await db.Conversation.findOne({
      where: { id: conversationId },
      include: [{ model: db.Visitor }]
    });
    
    if (!conversation) {
      logger.warn(`[Widget API] Conversation ${conversationId} tidak ditemukan`);
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    if (!conversation.Visitor) {
      logger.warn(`[Widget API] Conversation ${conversationId} tidak punya Visitor`);
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    // ✅ FIX: Gunakan browserFingerprint, bukan visitorKey (field tidak exist)
    // Security: Pastikan visitorKey (fingerprint) match
    if (conversation.Visitor.browserFingerprint !== visitorKey) {
      logger.warn(`[Widget API] Fingerprint mismatch untuk conversation ${conversationId}. Expected: ${conversation.Visitor.browserFingerprint}, Got: ${visitorKey}`);
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    // Ambil messages
    const messages = await db.Message.findAll({
      where: { conversationId },
      order: [['createdAt', 'ASC']],
    });
    
    res.status(200).json(messages);
  } catch (error) {
    logger.error('[Widget API] Gagal ambil messages: ' + (error && (error.stack || error.message)));
    res.status(500).json({ message: 'Error server' });
  }
};