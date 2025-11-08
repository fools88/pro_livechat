// /pro_livechat/server/src/api/routes/conversation.routes.js

const express = require('express');
const router = express.Router();
const convoController = require('../controllers/conversation.controller');
const authJwt = require('../middleware/auth.jwt'); // Satpam

// Jaga semua rute ini (Hanya Agent & Admin yang boleh lihat)
const agentAndAdminAccess = [authJwt.verifyToken];

// GET /api/conversations/
router.get('/', agentAndAdminAccess, convoController.getConversations);

// GET /api/conversations/:conversationId/messages (Protected - Admin/Agent only)
router.get('/:conversationId/messages', agentAndAdminAccess, convoController.getMessagesForConversation);

// GET /api/conversations/public/:conversationId/messages (Public - Visitor dengan visitorKey)
router.get('/public/:conversationId/messages', convoController.getMessagesForVisitor);

module.exports = router;