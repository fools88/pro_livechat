const path = require('path');

async function run() {
  try {
    // Prepare mocks
    const geminiConfigMock = {
      initGemini: () => {},
      getGenAI: () => ({
        getGenerativeModel: ({ model }) => ({
          generateContent: async (prompt) => {
            return { response: { text: () => 'Mock suggested reply based on CONTEXT and QUESTION.' } };
          }
        })
      }),
      getEmbeddingModel: () => null
    };

    const vectorServiceMock = {
      queryVectors: async (queryText, topK, websiteId, categoryId) => {
        // Return fake chunks so createContext builds a context string
        return [
          { metadata: { text: 'Konteks relevan 1: informasi produk dan harga.' } },
          { metadata: { text: 'Konteks relevan 2: syarat dan ketentuan promo.' } }
        ];
      }
    };

    const modelsMock = {
      KnowledgeCategory: {
        findAll: async () => [
          { id: 'cat-1', name: 'General', description: 'Umum' }
        ],
        findByPk: async (id) => null
      }
    };

    // Inject mocks into require cache before loading gemini.service
    const geminiConfigPath = require.resolve('../src/config/gemini.config.js');
    const vectorServicePath = require.resolve('../src/services/vector.service.js');
    const modelsPath = require.resolve('../models');

    require.cache[geminiConfigPath] = { id: geminiConfigPath, filename: geminiConfigPath, loaded: true, exports: geminiConfigMock };
    require.cache[vectorServicePath] = { id: vectorServicePath, filename: vectorServicePath, loaded: true, exports: vectorServiceMock };
    require.cache[modelsPath] = { id: modelsPath, filename: modelsPath, loaded: true, exports: modelsMock };

    // Now require the service under test
    const geminiService = require('../src/services/gemini.service.js');

    const result = await geminiService.generateSuggestion('Berapa harga paket premium?', 'test-website');

  const logger = require('../src/utils/logger');
  logger.info('Unit test: generateSuggestion returned: ' + JSON.stringify(result));

    if (!result || !result.suggestion) {
  logger.error('Unit test FAILED: result missing suggestion');
      process.exit(1);
    }

    if (!result.suggestion.includes('Mock suggested reply')) {
  logger.error('Unit test FAILED: suggestion text unexpected');
      process.exit(1);
    }

  logger.info('Unit test PASSED');
    process.exit(0);
  } catch (err) {
  logger.error('Unit test ERROR: ' + (err && (err.stack || err.message)));
    process.exit(2);
  }
}

run();
