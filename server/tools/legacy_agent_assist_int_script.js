// legacy script moved out of tests to avoid jest conflict
// original integration-like script that invoked triggerAI directly
// kept for debugging; not part of automated test suite
/*
Original file moved from server/tests/integration/agent-assist.int.test.js
*/
// integration-like test: directly call triggerAI with mocked services
const assert = require('assert');

(async () => {
  // Mock gemini service and vector.service via require.cache
  const geminiConfigPath = require.resolve('../src/config/gemini.config.js');
  const vectorServicePath = require.resolve('../src/services/vector.service.js');
  const modelsPath = require.resolve('../models');

  // simple mocks
  require.cache[geminiConfigPath] = { id: geminiConfigPath, filename: geminiConfigPath, loaded: true, exports: {
    getGenAI: () => ({ getGenerativeModel: () => ({ generateContent: async (p) => ({ response: { text: () => 'MOCK' } }) }) }),
    getEmbeddingModel: () => ({ embedContent: async () => ({ embedding: { values: [0.1, 0.2] } }) }),
    initGemini: () => {}
  }};

  require.cache[vectorServicePath] = { id: vectorServicePath, filename: vectorServicePath, loaded: true, exports: {
    queryVectors: async () => ([{ metadata: { text: 'mock context' } }])
  }};

  require.cache[modelsPath] = { id: modelsPath, filename: modelsPath, loaded: true, exports: {
    Conversation: { findByPk: async (id) => ({ id, isAiActive: false }) },
    KnowledgeCategory: { findAll: async () => [] }
  }};

  const handlers = require('../src/socket/handlers.js');

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

  if (!emitted) {
  const logger = require('../src/utils/logger');
  logger.error('Integration test FAILED: no ai_suggestion emitted');
    process.exit(1);
  }

  logger.info('Integration test PASSED: ai_suggestion emitted: ' + JSON.stringify(emitted));
  process.exit(0);
})();
