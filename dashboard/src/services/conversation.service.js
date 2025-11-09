// /dashboard/src/services/conversation.service.js

import api from './api';

const getConversations = () => {
  // GET /api/conversations
  return api.get('/conversations');
};

const getMessages = (conversationId) => {
  // GET /api/conversations/:conversationId/messages
  // Enhanced: also fetch files for the conversation and merge into messages when needed
  return api.get(`/conversations/${conversationId}/messages`).then(async (res) => {
    try {
      // If messages exist, attempt to also fetch files and merge by messageId
      if (res.data && res.data.messages) {
        const filesResp = await api.get(`/files/conversation/${conversationId}`);
        const files = (filesResp.data && filesResp.data.files) || [];
        const filesByMessage = files.reduce((acc, f) => {
          if (!acc[f.messageId]) acc[f.messageId] = [];
          acc[f.messageId].push(f);
          return acc;
        }, {});

        // Attach files array to each message if missing
        res.data.messages = res.data.messages.map(m => ({
          ...m,
          files: (m.files && m.files.length) ? m.files : (filesByMessage[m.id] || [])
        }));
      }
    } catch (e) {
      // non-fatal: just return original response
      console.warn('[conversation.service] Failed to fetch/merge files:', e);
    }
    return res;
  });
};

const conversationService = {
  getConversations,
  getMessages,
};

export default conversationService;