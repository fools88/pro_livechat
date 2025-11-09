(async ()=>{
  const logger = require('../src/utils/logger');
  const db = require('../models');
  const id = process.argv[2];
  const status = process.argv[3] === 'false' ? false : true;
  if (!id) { logger.error('Usage: node manual_toggle.js <conversationId> <true|false>'); process.exit(2); }
  try {
    const [affected] = await db.Conversation.update({ isAiActive: status }, { where: { id } });
    logger.info('affected=' + affected);
    const convo = await db.Conversation.findByPk(id);
    logger.info('after: ' + (convo ? JSON.stringify(convo.toJSON()) : null));
    process.exit(0);
  } catch (e) {
    logger.error('ERR ' + (e && (e.stack || e.message)));
    process.exit(1);
  }
})();
