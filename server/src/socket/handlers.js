// /pro_livechat/server/src/socket/handlers.js
// (VERSI V13.6 - FIX SINTAKS CATCH BLOCK)

// (FIX: JANGAN impor di sini)
// const aiService = require('../services/gemini.service'); 
const db = require('../../models');
const jwt = require('jsonwebtoken'); 
// NOTE: do not capture JWT secret at module-load time. Read from process.env when verifying tokens

// Use centralized logger (winston) so we can control verbosity via LOG_LEVEL env
const logger = require('../utils/logger');

// --- (A) FUNGSI 'triggerAI' ---
const triggerAI = async (io, message, conversation) => {
  // --- (FIX: Impor di dalam fungsi) ---
  const aiService = require('../services/gemini.service');
  // ---
  try {
    const currentConversation = await db.Conversation.findByPk(conversation.id);
    if (!currentConversation) {
      logger.info(`[Socket AI] Convo ${conversation.id} tidak ditemukan. Berhenti.`);
      return;
    }

    // Jika AI tidak aktif untuk percakapan ini, jalankan Agent-Assist:
    // lakukan pencarian konteks dan kirim saran ke admin yang berada di room.
    if (!currentConversation.isAiActive) {
      logger.info(`[Socket AI] AI dimatikan untuk convo ${conversation.id}. Menjalankan Agent-Assist (background)...`);
        try {
        const aiService = require('../services/gemini.service');
        // Generate a concise suggested reply object for admin (prefer polished suggestion)
        const suggestionObj = await aiService.generateSuggestion(message.content, conversation.websiteId);
        // Debug: log a short summary to help E2E debug (safe, no secrets)
        try {
          const preview = suggestionObj && suggestionObj.suggestion ? String(suggestionObj.suggestion).slice(0,200) : null;
          logger.debug('--- [DEBUG-AI] suggestionObj present=', Boolean(suggestionObj), 'preview=', preview);
        } catch (e) { }
        // Fallback: if suggestionObj null, use raw context as suggestion text
        let payloadSuggestion = null;
        if (suggestionObj && suggestionObj.suggestion) {
          payloadSuggestion = suggestionObj;
        } else {
          const ctx = await aiService.createContext(message.content, conversation.websiteId);
          if (ctx && !ctx.includes('Tidak ada konteks') && !ctx.includes('Gagal mengambil konteks')) {
            payloadSuggestion = { suggestion: ctx, categoryId: null, categoryName: null, confidence: null };
          }
        }

        if (payloadSuggestion) {
          const socketsInRoom = await io.in(conversation.id.toString()).fetchSockets();
          let sentCount = 0;
          socketsInRoom.forEach(skt => {
            try {
              if (skt.userType === 'admin') {
                skt.emit('ai_suggestion', {
                  conversationId: conversation.id,
                  suggestion: payloadSuggestion.suggestion,
                  categoryId: payloadSuggestion.categoryId,
                  categoryName: payloadSuggestion.categoryName,
                  confidence: payloadSuggestion.confidence
                });
                sentCount++;
              }
            } catch (e) {
              logger.warn('[Socket AI] Gagal mengirim ai_suggestion ke satu socket:', e && e.message);
            }
          });

          // nothing extra: we emit only to admin sockets in the room
        }
      } catch (err) {
  logger.error('[Socket AI] Agent-Assist gagal:', err);
      }
      // Jangan buat balasan AI otomatis jika AI dimatikan
      return;
    }
  logger.info(`[Socket AI] AI aktif untuk convo ${conversation.id}. Memanggil Gemini...`);
    
    const history = await db.Message.findAll({
      where: { conversationId: conversation.id },
      order: [['createdAt', 'ASC']],
      limit: 20, 
    });
    
    const chatHistory = history.map(msg => ({
      role: (msg.senderType === 'visitor' ? 'user' : 'model'),
      content: msg.content
    }));
    
    const aiTextResponse = await aiService.generateChatResponse(
      message.content,
      chatHistory,
      currentConversation
    );
    
    if (!aiTextResponse) {
  logger.error('[Socket AI] Gemini mengembalikan respons kosong.');
      return;
    }

    const aiMessage = await db.Message.create({
      conversationId: conversation.id,
      senderType: 'ai',
      contentType: 'text',
      content: aiTextResponse,
      isRead: false
    });
    
  logger.info('[Socket AI] Balasan AI dibuat, mengirim ke ruangan:', conversation.id);
  io.to(conversation.id.toString()).emit('new_message', aiMessage);
    
    updateSummaryInBackground(aiMessage.conversationId);
    
  } catch (error) {
  logger.error(`[Socket AI] GAGAL total saat trigger AI:`, error);
  }
};

// --- (B) FUNGSI 'updateSummaryInBackground' ---
const updateSummaryInBackground = async (conversationId) => {
  // --- (FIX: Impor di dalam fungsi) ---
  const aiService = require('../services/gemini.service');
  // ---
  try {
    const history = await db.Message.findAll({
      where: { conversationId: conversationId },
      order: [['createdAt', 'ASC']]
    });
    
    if (history.length > 0 && history.length % 10 === 0) {
  logger.info(`[V13 Auto-Summary] Jumlah pesan (${history.length}) adalah kelipatan 10. Membuat ringkasan...`);
      
      const chatHistory = history.map(msg => ({
        role: (msg.senderType === 'visitor' ? 'user' : 'model'),
        content: msg.content
      }));
      
      const summary = await aiService.generateSummary(chatHistory);
      
      if (summary) {
        await db.Conversation.update(
          { aiSummary: summary },
          { where: { id: conversationId } }
        );
  logger.info(`[V13 Auto-Summary] Ringkasan baru berhasil disimpan.`);
      }
    } 
  } catch (error) {
  logger.error('[V13 Auto-Summary] GAGAL membuat ringkasan latar belakang:', error);
  }
};

// --- (C) FUNGSI UTAMA PENDAFTARAN ---
const registerSocketHandlers = (io) => {
  
  io.on('connection', async (socket) => {
    let authHandled = false;
    // --- (BAGIAN 1: KONEKSI - SUDAH DIPERBAIKI) ---
  logger.debug('--- [DEBUG] KONEKSI BARU DITERIMA ---');
    try {
      const { widgetKey, fingerprint, token } = socket.handshake.query; 
  logger.debug(`--- [DEBUG] Query Diterima: Key=${widgetKey}, FP=${fingerprint}, token=${token ? 'present' : 'absent'}`);

      // If token present, try decode it first. Token may represent admin or widget.
      if (token) {
        try {
          try { require('dotenv').config(); } catch (e) {}
          // --- Enhanced debug logging for JWT verification (guarded) ---
          const secret = process.env.JWT_SECRET || 'prochat-rahasia';
          // Only print sensitive-ish debug lines when JWT_DEBUG is explicitly true
          const jwtDebug = String(process.env.JWT_DEBUG || '').toLowerCase() === 'true';
          if (jwtDebug) {
            const secretInfo = secret
              ? `${secret.slice(0, Math.min(3, secret.length))}...${secret.slice(Math.max(0, secret.length - 3))} (len=${secret.length})`
              : 'MISSING';
            try {
              logger.debug(`--- [DEBUG] JWT verification attempt. JWT_SECRET present=${Boolean(process.env.JWT_SECRET)} secretInfo=${secretInfo}`);
            } catch (e) {
              // defensive: console.log should not crash
            }
            // show a short prefix of the token to correlate logs without printing whole token
            const tokenPrefix = token && token.length ? token.slice(0, 40) + (token.length > 40 ? '...' : '') : '<empty>';
            logger.debug(`--- [DEBUG] Token prefix=${tokenPrefix}`);
          }

          let decoded;
          try {
            decoded = jwt.verify(token, secret);
            // summary of decoded payload (do not print secrets)
            if (jwtDebug) {
              const summary = {};
              if (decoded && typeof decoded === 'object') {
                if (decoded.id) summary.id = decoded.id;
                if (decoded.websiteId) summary.websiteId = decoded.websiteId;
                if (decoded.exp) summary.exp = decoded.exp;
              }
              logger.debug(`--- [DEBUG] Token verified OK. Decoded payload summary=${JSON.stringify(summary)}`);
            }
          } catch (verifyErr) {
            // decode without verification to inspect payload values (safe to log)
            const decodedUnverified = jwt.decode(token) || null;
            if (jwtDebug) {
              logger.warn(`--- [DEBUG] Token verification FAILED: ${verifyErr && verifyErr.message}`);
              const decodedSummary = decodedUnverified ? { id: decodedUnverified.id, websiteId: decodedUnverified.websiteId, exp: decodedUnverified.exp } : null;
              logger.debug(`--- [DEBUG] Decoded (unverified) payload summary=${JSON.stringify(decodedSummary)}`);
            }
            throw verifyErr;
          }
          // widget token
          if (decoded && decoded.websiteId) {
            logger.debug('--- [DEBUG] Token presents widget identity. Proceed as WIDGET token.');
            const website = await db.Website.findByPk(decoded.websiteId);
            if (!website) {
              socket.emit('connection_error', 'Widget token invalid (website not found).');
              return socket.disconnect();
            }
            // fallback fingerprint is required for visitor tracking
            if (!fingerprint) {
              socket.emit('connection_error', 'Fingerprint required for widget connection.');
              return socket.disconnect();
            }

            let [visitor] = await db.Visitor.findOrCreate({
              where: { browserFingerprint: fingerprint, websiteId: website.id },
              defaults: { browserFingerprint: fingerprint, websiteId: website.id }
            });

            let [conversation, isNewConversation] = await db.Conversation.findOrCreate({
              where: { visitorId: visitor.id, websiteId: website.id, status: 'new' },
              defaults: {
                visitorId: visitor.id,
                websiteId: website.id,
                status: 'new',
                isAiActive: website.isAiEnabled
              }
            });

            socket.join(conversation.id.toString());
            socket.userType = 'visitor';
            socket.visitorId = visitor.id;
            socket.conversationId = conversation.id;
            socket.websiteId = website.id;

            socket.emit('connection_success', { 
              conversationId: conversation.id,
              visitorKey: visitor.browserFingerprint  // ✅ FIX: Gunakan browserFingerprint (bukan visitorKey yang tidak exist)
            });
            
            // Emit new_conversation to all admin sockets when a new conversation is created
            if (isNewConversation) {
              logger.info(`[Socket] New conversation ${conversation.id} created via token, broadcasting to admins...`);
              const convoWithDetails = await db.Conversation.findByPk(conversation.id, {
                include: [
                  { model: db.Visitor },
                  { model: db.Website },
                  { model: db.Message, limit: 1, order: [['createdAt', 'DESC']] }
                ]
              });
              io.emit('new_conversation', convoWithDetails);
            }
            
            authHandled = true;
          }
          // admin token
          if (decoded && decoded.id) {
            socket.userType = 'admin';
            socket.adminId = decoded.id;
            logger.debug(`--- [DEBUG] Admin ID ${socket.adminId} terotentikasi via token.`);
            authHandled = true;
          }
        } catch (e) {
          // More explicit debug: show the error message/stack so we know why token handling failed
          try {
            logger.warn(`--- [DEBUG] Token handling failed, will fallback to widgetKey handling if provided. error=${e && (e.message || e)}`);
            logger.debug(`--- [DEBUG] Token handling error stack=${e && e.stack}`);
          } catch (logErr) {
            // swallow logging errors
          }
        }
      }

      // KASUS 1: KONEKSI WIDGET (legacy widgetKey+fingerprint)
  // Allow legacy widgetKey flow only when enabled by runtime flag
  // Default disabled for safety: do not allow legacy widgetKey fallback unless explicitly enabled.
      const allowLegacy = String(process.env.ALLOW_LEGACY_WIDGET_KEY ?? 'false').toLowerCase() === 'true';
      if (!authHandled && !token && !allowLegacy) {
  logger.debug('--- [DEBUG] Legacy widgetKey flow disabled by ALLOW_LEGACY_WIDGET_KEY=false');
        socket.emit('connection_error', 'Legacy widgetKey flow disabled on this server');
        return socket.disconnect();
      }

      if (!authHandled && widgetKey && fingerprint) {
        // ... (Logika koneksi widget Anda sudah benar) ...
  logger.debug('--- [DEBUG] Mendeteksi koneksi TIPE: WIDGET');
        const website = await db.Website.findOne({ where: { widgetKey } });
        
        if (!website) {
          logger.debug('--- [DEBUG] ERROR: Widget Key tidak valid.');
          socket.emit('connection_error', 'Widget Key tidak valid.');
          return socket.disconnect();
        }
  logger.debug(`--- [DEBUG] Website Ditemukan: ${website.id}`);

        let [visitor] = await db.Visitor.findOrCreate({
          where: { browserFingerprint: fingerprint, websiteId: website.id },
          defaults: { browserFingerprint: fingerprint, websiteId: website.id }
        });
  logger.debug(`--- [DEBUG] Visitor Ditemukan/Dibuat: ${visitor.id}`);

        let [conversation, isNewConversation] = await db.Conversation.findOrCreate({
          where: { visitorId: visitor.id, websiteId: website.id, status: 'new' },
          defaults: {
            visitorId: visitor.id,
            websiteId: website.id,
            status: 'new',
            isAiActive: website.isAiEnabled
          }
        });
  logger.debug(`--- [DEBUG] Convo Ditemukan/Dibuat: ${conversation.id}, isNew=${isNewConversation}`);

        socket.join(conversation.id.toString());
        socket.userType = 'visitor';
        socket.visitorId = visitor.id;
        socket.conversationId = conversation.id;
        socket.websiteId = website.id;

  logger.debug('--- [DEBUG] MENGIRIM "connection_success"...');
        socket.emit('connection_success', {
          conversationId: conversation.id,
          visitorKey: visitor.browserFingerprint  // ✅ FIX: Gunakan browserFingerprint
        });
  logger.debug('--- [DEBUG] "connection_success" TERKIRIM.');

        // Emit new_conversation to all admin sockets when a new conversation is created
        if (isNewConversation) {
          logger.info(`[Socket] New conversation ${conversation.id} created, broadcasting to admins...`);
          // Fetch conversation with associations for Dashboard display
          const convoWithDetails = await db.Conversation.findByPk(conversation.id, {
            include: [
              { model: db.Visitor, as: 'visitor' },
              { model: db.Website, as: 'website' },
              { model: db.Message, as: 'Messages', limit: 1, order: [['createdAt', 'DESC']] }
            ]
          });
          // Broadcast to all connected admin sockets
          io.emit('new_conversation', convoWithDetails);
        }

      }

      // If authentication was not handled above, reject connection
      if (!authHandled) {
  logger.debug('--- [DEBUG] ERROR: Koneksi tidak jelas.');
        socket.emit('connection_error', 'Otentikasi tidak valid.');
        return socket.disconnect();
      }

      // --- (BAGIAN 2: LOGIKA "OTAK" AI) ---
      
      // (G) EVENT: KIRIM PESAN
      socket.on('send_message', async (payload) => {
        try {
          logger.debug(`--- [DEBUG] Menerima 'send_message' (Tipe: ${socket.userType})`);
          let newMessage;
          
          // Pesan dari ADMIN
          if (socket.userType === 'admin') { 
            // ... (Logika admin Anda sudah benar) ...
            newMessage = await db.Message.create({
              conversationId: payload.conversationId,
              senderType: 'admin',
              senderId: socket.adminId, 
              contentType: 'text',
              content: payload.content,
              isRead: false
            });
            io.to(payload.conversationId.toString()).emit('new_message', newMessage);
          
          // Pesan dari VISITOR
          } else if (socket.userType === 'visitor') {
            // ... (Logika visitor Anda sudah benar) ...
            const { visitorId, conversationId, websiteId } = socket;
            
            const conversation = await db.Conversation.findByPk(conversationId);
            if (!conversation) {
              logger.error('[Socket.IO] GAGAL send_message: Convo tidak ditemukan.');
              return socket.emit('message_error', 'Percakapan tidak ditemukan.');
            }
            newMessage = await db.Message.create({
              conversationId: conversationId,
              senderType: 'visitor',
              contentType: 'text',
              content: payload.content,
              isRead: false
            });
            
            // ✅ FIX: Kirim ke room conversation DAN broadcast ke semua admin
            // Ke room (untuk admin yang sudah join + visitor sendiri)
            io.to(conversationId.toString()).emit('new_message', newMessage);
            
            // Ke semua admin socket (untuk admin yang belum join room)
            const allSockets = await io.fetchSockets();
            allSockets.forEach(adminSocket => {
              if (adminSocket.userType === 'admin' && !adminSocket.rooms.has(conversationId.toString())) {
                adminSocket.emit('new_message', newMessage);
              }
            });
            
            logger.debug(`--- [DEBUG] Pesan visitor dikirim ke ruangan ${conversationId} + all admin sockets`);
            
            triggerAI(io, newMessage, conversation);
          }
          
        } catch (error) {
          logger.error('[Socket.IO] GAGAL saat send_message:', error);
          socket.emit('message_error', 'Gagal mengirim pesan.');
        }
      });
      
      // --- (FIX: LISTENER 'JOIN_ROOM' UNTUK ADMIN) ---
      socket.on('join_room', (conversationId) => {
        // ... (Logika join_room Anda sudah benar) ...
        try {
          if (socket.userType === 'admin') {
            logger.debug(`--- [DEBUG] Admin ${socket.adminId} join room: ${conversationId}`);
            socket.join(conversationId.toString());
          }
        } catch (error) {
          logger.error('[Socket.IO] GAGAL saat "join_room":', error);
          socket.emit('operation_error', 'Gagal join room.');
        }
      });
      
      // --- (FIX: LISTENER 'TOGGLE_AI' ANDA) ---
      socket.on('toggle_ai', async (payload) => {
        try {
          if (socket.userType !== 'admin') {
            logger.warn('--- [DEBUG] Non-admin mencoba toggle AI. Ditolak.');
            return;
          }
          const { conversationId, status } = payload;
          logger.debug(`--- [DEBUG] Admin Menerima 'toggle_ai' untuk convo ${conversationId} -> ${status}`);
  
          // Debug: update conversation and log number of rows affected to ensure toggle persisted
          try {
            logger.debug('--- [DEBUG] toggle_ai payload raw=', payload, 'socket.adminId=', socket.adminId);
            logger.debug('--- [DEBUG] typeof conversationId=', typeof conversationId, 'typeof status=', typeof status);
            const [affected] = await db.Conversation.update(
              { isAiActive: status },
              { where: { id: conversationId } }
            );
            logger.debug('--- [DEBUG] Conversation.update affected rows=', affected);
          } catch (updErr) {
            logger.error('--- [DEBUG] Conversation.update failed:', updErr && (updErr.message || updErr));
          }
          // Read back conversation to verify new state
          try {
            const convAfter = await db.Conversation.findByPk(conversationId);
            logger.debug('--- [DEBUG] Conversation after toggle:', convAfter ? { id: convAfter.id, isAiActive: convAfter.isAiActive } : null);
          } catch (readErr) {
            logger.error('--- [DEBUG] Failed to read conversation after toggle:', readErr && readErr.message);
          }
          io.emit('ai_status_changed', {
            conversationId: conversationId,
            isAiActive: status
          });
          
          logger.debug(`--- [DEBUG] Status AI untuk ${conversationId} berhasil di-update dan di-broadcast.`);
  
        // --- (FIX SINTAKS: TAMBAHKAN '{' dan '}') ---
        } catch (error) { // <-- { DITAMBAHKAN
          logger.error('[Socket.IO] GAGAL saat "toggle_ai":', error);
          socket.emit('operation_error', 'Gagal memperbarui status AI.');
        } // <-- } DITAMBAHKAN
      });
      
      // 🆕 EVENT: EDIT MESSAGE
      socket.on('edit_message', async (payload) => {
        try {
          const { conversationId, messageId, content } = payload;
          
          if (!content || !content.trim()) {
            return socket.emit('operation_error', 'Konten pesan tidak boleh kosong.');
          }

          // Find and update message
          const message = await db.Message.findByPk(messageId);
          if (!message) {
            return socket.emit('operation_error', 'Pesan tidak ditemukan.');
          }

          // Only allow admin to edit their own messages
          if (socket.userType === 'admin' && message.senderType === 'admin' && message.senderId === socket.adminId) {
            message.content = content.trim();
            message.isEdited = true; // Flag that message was edited
            await message.save();

            // Broadcast updated message to all in room
            io.to(conversationId.toString()).emit('message:updated', {
              messageId: message.id,
              content: message.content,
              isEdited: true,
              conversationId: conversationId
            });

            logger.info(`[Socket] Message ${messageId} edited by admin ${socket.adminId}`);
          } else {
            socket.emit('operation_error', 'Tidak diizinkan mengedit pesan ini.');
          }
        } catch (error) {
          logger.error('[Socket.IO] GAGAL saat edit_message:', error);
          socket.emit('operation_error', 'Gagal mengedit pesan.');
        }
      });

      // 🆕 EVENT: DELETE MESSAGE
      socket.on('delete_message', async (payload) => {
        try {
          const { conversationId, messageId } = payload;

          const message = await db.Message.findByPk(messageId);
          if (!message) {
            return socket.emit('operation_error', 'Pesan tidak ditemukan.');
          }

          // Only allow admin to delete their own messages
          if (socket.userType === 'admin' && message.senderType === 'admin' && message.senderId === socket.adminId) {
            // Soft delete (set deletedAt timestamp)
            await message.destroy();

            // Broadcast deletion to all in room
            io.to(conversationId.toString()).emit('message:deleted', {
              messageId: message.id,
              conversationId: conversationId
            });

            logger.info(`[Socket] Message ${messageId} deleted by admin ${socket.adminId}`);
          } else {
            socket.emit('operation_error', 'Tidak diizinkan menghapus pesan ini.');
          }
        } catch (error) {
          logger.error('[Socket.IO] GAGAL saat delete_message:', error);
          socket.emit('operation_error', 'Gagal menghapus pesan.');
        }
      });

      // 🆕 EVENT: TYPING INDICATOR
      socket.on('typing:start', async (payload) => {
        try {
          const { conversationId } = payload;
          
          // Broadcast to others in room (exclude sender)
          socket.to(conversationId.toString()).emit('typing:start', {
            conversationId: conversationId,
            userType: socket.userType,
            userId: socket.userType === 'admin' ? socket.adminId : socket.visitorId
          });

          logger.debug(`[Socket] Typing started: ${socket.userType} in convo ${conversationId}`);
        } catch (error) {
          logger.error('[Socket.IO] GAGAL saat typing:start:', error);
        }
      });

      socket.on('typing:stop', async (payload) => {
        try {
          const { conversationId } = payload;
          
          // Broadcast to others in room (exclude sender)
          socket.to(conversationId.toString()).emit('typing:stop', {
            conversationId: conversationId,
            userType: socket.userType,
            userId: socket.userType === 'admin' ? socket.adminId : socket.visitorId
          });

          logger.debug(`[Socket] Typing stopped: ${socket.userType} in convo ${conversationId}`);
        } catch (error) {
          logger.error('[Socket.IO] GAGAL saat typing:stop:', error);
        }
      });

      // 🆕 EVENT: CONVERSATION STATUS UPDATE
      socket.on('conversation:update_status', async (payload) => {
        try {
          if (socket.userType !== 'admin') {
            return socket.emit('operation_error', 'Hanya admin yang bisa mengubah status percakapan.');
          }

          const { conversationId, status } = payload;
          
          // Validate status
          if (!['open', 'closed', 'pending'].includes(status)) {
            return socket.emit('operation_error', 'Status tidak valid.');
          }

          const [affected] = await db.Conversation.update(
            { status: status },
            { where: { id: conversationId } }
          );

          if (affected > 0) {
            // Broadcast to all connected sockets
            io.emit('conversation:updated', {
              conversationId: conversationId,
              status: status
            });

            logger.info(`[Socket] Conversation ${conversationId} status changed to ${status} by admin ${socket.adminId}`);
          }
        } catch (error) {
          logger.error('[Socket.IO] GAGAL saat conversation:update_status:', error);
          socket.emit('operation_error', 'Gagal mengubah status percakapan.');
        }
      });

      // (H) EVENT: DISCONNECT
      socket.on('disconnect', () => {
        // ... (Logika disconnect Anda sudah benar) ...
  logger.debug(`--- [DEBUG] Socket ${socket.id} terputus (Tipe: ${socket.userType}).`);
      });

    } catch (err) {
  logger.error('!!! [DEBUG] ERROR BESAR DI DALAM io.on(connection):', err);
  socket.emit('connection_error', 'Terjadi error internal pada server.');
      socket.disconnect();
    }
  });
};

module.exports = registerSocketHandlers;
// Export triggerAI for integration tests
module.exports.triggerAI = triggerAI;