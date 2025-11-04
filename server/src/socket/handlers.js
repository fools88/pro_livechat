// /pro_livechat/server/src/socket/handlers.js
// (VERSI V13.6 - FIX SINTAKS CATCH BLOCK)

// (FIX: JANGAN impor di sini)
// const aiService = require('../services/gemini.service'); 
const db = require('../../models');
const jwt = require('jsonwebtoken'); 
// NOTE: do not capture JWT secret at module-load time. Read from process.env when verifying tokens

// --- (A) FUNGSI 'triggerAI' ---
const triggerAI = async (io, message, conversation) => {
  // --- (FIX: Impor di dalam fungsi) ---
  const aiService = require('../services/gemini.service');
  // ---
  try {
    const currentConversation = await db.Conversation.findByPk(conversation.id);
    if (!currentConversation) {
      console.log(`[Socket AI] Convo ${conversation.id} tidak ditemukan. Berhenti.`);
      return;
    }

    // Jika AI tidak aktif untuk percakapan ini, jalankan Agent-Assist:
    // lakukan pencarian konteks dan kirim saran ke admin yang berada di room.
    if (!currentConversation.isAiActive) {
      console.log(`[Socket AI] AI dimatikan untuk convo ${conversation.id}. Menjalankan Agent-Assist (background)...`);
        try {
        const aiService = require('../services/gemini.service');
        // Generate a concise suggested reply object for admin (prefer polished suggestion)
        const suggestionObj = await aiService.generateSuggestion(message.content, conversation.websiteId);
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
              console.warn('[Socket AI] Gagal mengirim ai_suggestion ke satu socket:', e && e.message);
            }
          });

          // nothing extra: we emit only to admin sockets in the room
        }
      } catch (err) {
        console.error('[Socket AI] Agent-Assist gagal:', err);
      }
      // Jangan buat balasan AI otomatis jika AI dimatikan
      return;
    }
    console.log(`[Socket AI] AI aktif untuk convo ${conversation.id}. Memanggil Gemini...`);
    
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
      console.error('[Socket AI] Gemini mengembalikan respons kosong.');
      return;
    }

    const aiMessage = await db.Message.create({
      conversationId: conversation.id,
      senderType: 'ai',
      contentType: 'text',
      content: aiTextResponse,
      isRead: false
    });
    
    console.log('[Socket AI] Balasan AI dibuat, mengirim ke ruangan:', conversation.id);
    io.to(conversation.id.toString()).emit('new_message', aiMessage);
    
    updateSummaryInBackground(aiMessage.conversationId);
    
  } catch (error) {
    console.error(`[Socket AI] GAGAL total saat trigger AI:`, error);
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
      console.log(`[V13 Auto-Summary] Jumlah pesan (${history.length}) adalah kelipatan 10. Membuat ringkasan...`);
      
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
        console.log(`[V13 Auto-Summary] Ringkasan baru berhasil disimpan.`);
      }
    } 
  } catch (error) {
    console.error('[V13 Auto-Summary] GAGAL membuat ringkasan latar belakang:', error);
  }
};

// --- (C) FUNGSI UTAMA PENDAFTARAN ---
const registerSocketHandlers = (io) => {
  
  io.on('connection', async (socket) => {
    
    // --- (BAGIAN 1: KONEKSI - SUDAH DIPERBAIKI) ---
    console.log('--- [DEBUG] KONEKSI BARU DITERIMA ---');
    try {
      const { widgetKey, fingerprint, token } = socket.handshake.query; 
      console.log(`--- [DEBUG] Query Diterima: Key=${widgetKey}, FP=${fingerprint}, token=${token ? 'present' : 'absent'}`);

      // If token present, try decode it first. Token may represent admin or widget.
      if (token) {
        try {
          try { require('dotenv').config(); } catch (e) {}
          // --- Enhanced debug logging for JWT verification ---
          const secret = process.env.JWT_SECRET || 'prochat-rahasia';
          const secretInfo = secret
            ? `${secret.slice(0, Math.min(3, secret.length))}...${secret.slice(Math.max(0, secret.length - 3))} (len=${secret.length})`
            : 'MISSING';
          try {
            console.log('--- [DEBUG] JWT verification attempt. JWT_SECRET present=', Boolean(process.env.JWT_SECRET), 'secretInfo=', secretInfo);
          } catch (e) {
            // defensive: console.log should not crash
          }
          // show a short prefix of the token to correlate logs without printing whole token
          const tokenPrefix = token && token.length ? token.slice(0, 40) + (token.length > 40 ? '...' : '') : '<empty>';
          console.log('--- [DEBUG] Token prefix:', tokenPrefix);
          let decoded;
          try {
            decoded = jwt.verify(token, secret);
            // summary of decoded payload (do not print secrets)
            const summary = {};
            if (decoded && typeof decoded === 'object') {
              if (decoded.id) summary.id = decoded.id;
              if (decoded.websiteId) summary.websiteId = decoded.websiteId;
              if (decoded.exp) summary.exp = decoded.exp;
            }
            console.log('--- [DEBUG] Token verified OK. Decoded payload summary:', summary);
          } catch (verifyErr) {
            // decode without verification to inspect payload values (safe to log)
            const decodedUnverified = jwt.decode(token) || null;
            console.warn('--- [DEBUG] Token verification FAILED:', verifyErr && verifyErr.message);
            console.log('--- [DEBUG] Decoded (unverified) payload summary:', decodedUnverified && {
              id: decodedUnverified.id,
              websiteId: decodedUnverified.websiteId,
              exp: decodedUnverified.exp
            });
            throw verifyErr;
          }
          // widget token
          if (decoded && decoded.websiteId) {
            console.log('--- [DEBUG] Token presents widget identity. Proceed as WIDGET token.');
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

            let [conversation] = await db.Conversation.findOrCreate({
              where: { visitorId: visitor.id, websiteId: website.id, status: 'open' },
              defaults: {
                visitorId: visitor.id,
                websiteId: website.id,
                status: 'open',
                isAiActive: website.isAiEnabled
              }
            });

            socket.join(conversation.id.toString());
            socket.userType = 'visitor';
            socket.visitorId = visitor.id;
            socket.conversationId = conversation.id;
            socket.websiteId = website.id;

            socket.emit('connection_success', { conversationId: conversation.id });
            return;
          }
          // admin token
          if (decoded && decoded.id) {
            socket.userType = 'admin';
            socket.adminId = decoded.id;
            console.log(`--- [DEBUG] Admin ID ${socket.adminId} terotentikasi via token.`);
            return;
          }
        } catch (e) {
          console.warn('--- [DEBUG] Token verification failed, will fallback to widgetKey handling if provided.');
        }
      }

      // KASUS 1: KONEKSI WIDGET (legacy widgetKey+fingerprint)
  // Allow legacy widgetKey flow only when enabled by runtime flag
  // Default disabled for safety: do not allow legacy widgetKey fallback unless explicitly enabled.
  const allowLegacy = String(process.env.ALLOW_LEGACY_WIDGET_KEY ?? 'false').toLowerCase() === 'true';
      if (!token && !allowLegacy) {
        console.warn('--- [DEBUG] Legacy widgetKey flow disabled by ALLOW_LEGACY_WIDGET_KEY=false');
        socket.emit('connection_error', 'Legacy widgetKey flow disabled on this server');
        return socket.disconnect();
      }

      if (widgetKey && fingerprint) {
        // ... (Logika koneksi widget Anda sudah benar) ...
        console.log('--- [DEBUG] Mendeteksi koneksi TIPE: WIDGET');
        const website = await db.Website.findOne({ where: { widgetKey } });
        
        if (!website) {
          console.error('--- [DEBUG] ERROR: Widget Key tidak valid.');
          socket.emit('connection_error', 'Widget Key tidak valid.');
          return socket.disconnect();
        }
        console.log(`--- [DEBUG] Website Ditemukan: ${website.id}`);

        let [visitor] = await db.Visitor.findOrCreate({
          where: { browserFingerprint: fingerprint, websiteId: website.id },
          defaults: { browserFingerprint: fingerprint, websiteId: website.id }
        });
        console.log(`--- [DEBUG] Visitor Ditemukan/Dibuat: ${visitor.id}`);

        let [conversation] = await db.Conversation.findOrCreate({
          where: { visitorId: visitor.id, websiteId: website.id, status: 'open' },
          defaults: {
            visitorId: visitor.id,
            websiteId: website.id,
            status: 'open',
            isAiActive: website.isAiEnabled
          }
        });
        console.log(`--- [DEBUG] Convo Ditemukan/Dibuat: ${conversation.id}`);

        socket.join(conversation.id.toString());
        socket.userType = 'visitor';
        socket.visitorId = visitor.id;
        socket.conversationId = conversation.id;
        socket.websiteId = website.id;

        console.log('--- [DEBUG] MENGIRIM "connection_success"...');
        socket.emit('connection_success', {
          conversationId: conversation.id
        });
        console.log('--- [DEBUG] "connection_success" TERKIRIM.');

      } 
      // KASUS 3: TIDAK JELAS
      else {
        // ... (Logika error Anda sudah benar) ...
        console.error('--- [DEBUG] ERROR: Koneksi tidak jelas.');
        socket.emit('connection_error', 'Otentikasi tidak valid.');
        return socket.disconnect();
      }

      // --- (BAGIAN 2: LOGIKA "OTAK" AI) ---
      
      // (G) EVENT: KIRIM PESAN
      socket.on('send_message', async (payload) => {
        try {
          console.log(`--- [DEBUG] Menerima 'send_message' (Tipe: ${socket.userType})`);
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
              console.error('[Socket.IO] GAGAL send_message: Convo tidak ditemukan.');
              return socket.emit('message_error', 'Percakapan tidak ditemukan.');
            }
            newMessage = await db.Message.create({
              conversationId: conversationId,
              senderType: 'visitor',
              contentType: 'text',
              content: payload.content,
              isRead: false
            });
            
            // Kirim hanya ke room percakapan (lebih efisien daripada broadcast global)
            io.to(conversationId.toString()).emit('new_message', newMessage);
            console.log(`--- [DEBUG] Pesan visitor dikirim ke ruangan ${conversationId}`);
            
            triggerAI(io, newMessage, conversation);
          }
          
        } catch (error) {
          console.error('[Socket.IO] GAGAL saat send_message:', error);
          socket.emit('message_error', 'Gagal mengirim pesan.');
        }
      });
      
      // --- (FIX: LISTENER 'JOIN_ROOM' UNTUK ADMIN) ---
      socket.on('join_room', (conversationId) => {
        // ... (Logika join_room Anda sudah benar) ...
        try {
          if (socket.userType === 'admin') {
            console.log(`--- [DEBUG] Admin ${socket.adminId} join room: ${conversationId}`);
            socket.join(conversationId.toString());
          }
        } catch (error) {
          console.error('[Socket.IO] GAGAL saat "join_room":', error);
          socket.emit('operation_error', 'Gagal join room.');
        }
      });
      
      // --- (FIX: LISTENER 'TOGGLE_AI' ANDA) ---
      socket.on('toggle_ai', async (payload) => {
        try {
          if (socket.userType !== 'admin') {
            console.warn('--- [DEBUG] Non-admin mencoba toggle AI. Ditolak.');
            return;
          }
          const { conversationId, status } = payload;
          console.log(`--- [DEBUG] Admin Menerima 'toggle_ai' untuk convo ${conversationId} -> ${status}`);
  
          await db.Conversation.update(
            { isAiActive: status },
            { where: { id: conversationId } }
          );
  
          io.emit('ai_status_changed', {
            conversationId: conversationId,
            isAiActive: status
          });
          
          console.log(`--- [DEBUG] Status AI untuk ${conversationId} berhasil di-update dan di-broadcast.`);
  
        // --- (FIX SINTAKS: TAMBAHKAN '{' dan '}') ---
        } catch (error) { // <-- { DITAMBAHKAN
          console.error('[Socket.IO] GAGAL saat "toggle_ai":', error);
          socket.emit('operation_error', 'Gagal memperbarui status AI.');
        } // <-- } DITAMBAHKAN
      });
      
      // (H) EVENT: DISCONNECT
      socket.on('disconnect', () => {
        // ... (Logika disconnect Anda sudah benar) ...
        console.log(`--- [DEBUG] Socket ${socket.id} terputus (Tipe: ${socket.userType}).`);
      });

    } catch (err) {
      console.error('!!! [DEBUG] ERROR BESAR DI DALAM io.on(connection):', err);
      socket.emit('connection_error', 'Terjadi error internal pada server.');
      socket.disconnect();
    }
  });
};

module.exports = registerSocketHandlers;
// Export triggerAI for integration tests
module.exports.triggerAI = triggerAI;