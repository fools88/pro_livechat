const path = require('path');

describe('Agent-Assist triggerAI (integration-like, mocked services)', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('should emit ai_suggestion to admin sockets when isAiActive is false', async () => {
    // Mock gemini config/service
    jest.doMock('../../src/config/gemini.config.js', () => ({
      getGenAI: () => ({ getGenerativeModel: () => ({ generateContent: async () => ({ response: { text: () => 'MOCK' } }) }) }),
      getEmbeddingModel: () => ({ embedContent: async () => ({ embedding: { values: [0.1, 0.2] } }) }),
      initGemini: () => {}
    }));

    // Mock vector service
    jest.doMock('../../src/services/vector.service.js', () => ({
      queryVectors: async () => ([{ metadata: { text: 'mock context' } }])
    }));

    // Mock models
    jest.doMock('../../models', () => ({
      Conversation: { findByPk: async (id) => ({ id, isAiActive: false, websiteId: 'test-site' }) },
      KnowledgeCategory: { findAll: async () => [] },
      Message: {
        findAll: async () => [],
        create: async (obj) => ({ id: 'm-ai-1', ...obj })
      }
    }));

    const handlers = require('../../src/socket/handlers.js');

    let emitted = null;
    const fakeSocket = { userType: 'admin', emit: (event, payload) => { emitted = { event, payload }; } };
    const io = { in: (roomId) => ({ fetchSockets: async () => [fakeSocket] }), to: () => ({ emit: () => {} }) };

    const message = { content: 'Halo, saya mau tanya harga' };
    const conversation = { id: '00000000-0000-0000-0000-000000000000', websiteId: 'test-site' };

    await handlers.triggerAI(io, message, conversation);

    expect(emitted).not.toBeNull();
    expect(emitted.event).toBe('ai_suggestion');
    expect(emitted.payload).toHaveProperty('conversationId', conversation.id);
    expect(typeof emitted.payload.suggestion).toBe('string');
  }, 20000);
});
