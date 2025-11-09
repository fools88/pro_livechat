const logger = require('../src/utils/logger');

(async ()=>{
  const db = require('../models');
  const id = process.argv[2];
  if (!id) { logger.error('Usage: node check_convo.js <conversationId>'); process.exit(2); }
  try {
    const convo = await db.Conversation.findByPk(id);
    logger.info('Convo: ' + JSON.stringify(convo ? convo.toJSON() : null));
    process.exit(0);
  } catch (e) {
    logger.error('ERR ' + (e && e.message));
    process.exit(1);
  }
})();
