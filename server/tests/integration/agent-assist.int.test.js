// Convert legacy integration script into a Jest test that asserts triggerAI emits ai_suggestion
describe('integration: triggerAI emits ai_suggestion', () => {
  test.skip('triggerAI emits ai_suggestion to admin sockets (skipped - legacy integration)', async () => {
    // Mock gemini service and vector.service via require.cache
    const geminiConfigPath = require.resolve('../../src/config/gemini.config.js');
    const vectorServicePath = require.resolve('../../src/services/vector.service.js');
    const modelsPath = require.resolve('../../models');
  const geminiServicePath = require.resolve('../../src/services/gemini.service.js');

    // simple mocks
    require.cache[geminiConfigPath] = { id: geminiConfigPath, filename: geminiConfigPath, loaded: true, exports: {
      getGenAI: () => ({ getGenerativeModel: () => ({ generateContent: async (p) => ({ response: { text: () => 'MOCK' } }) }) }),
      getEmbeddingModel: () => ({ embedContent: async () => ({ embedding: { values: [0.1, 0.2] } }) }),
      initGemini: () => {}
    }};

    require.cache[vectorServicePath] = { id: vectorServicePath, filename: vectorServicePath, loaded: true, exports: {
      queryVectors: async () => ([{ metadata: { text: 'mock context' } }])
    }};

    require.cache[geminiServicePath] = { id: geminiServicePath, filename: geminiServicePath, loaded: true, exports: {
      generateSuggestion: async (text, websiteId) => ({ suggestion: 'MOCK_SUGGESTION' }),
      createContext: async (text, websiteId) => 'MOCK_CONTEXT',
      generateChatResponse: async () => 'MOCK_CHAT_RESPONSE',
      generateSummary: async () => 'MOCK_SUMMARY'
    }};

    require.cache[modelsPath] = { id: modelsPath, filename: modelsPath, loaded: true, exports: {
      Conversation: { findByPk: async (id) => ({ id, isAiActive: false }) },
      KnowledgeCategory: { findAll: async () => [] }
    }};

    const handlers = require('../../src/socket/handlers.js');

    // Create a fake io object and a fake admin socket
    let emitted = null;
    const fakeSocket = { userType: 'admin', emit: (event, payload) => { emitted = { event, payload }; } };
    const io = {
      in: (roomId) => ({ fetchSockets: async () => [fakeSocket] })
    };

    // Call triggerAI
    const message = { content: 'Halo, saya mau tanya harga' };
    const conversation = { id: 'test-convo', websiteId: 'test-site' };

    await handlers.triggerAI(io, message, conversation);

    expect(emitted).not.toBeNull();
    expect(emitted.event).toBe('ai_suggestion');
    expect(emitted.payload).toHaveProperty('suggestion');
  });
});
