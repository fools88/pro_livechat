"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Messages', {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
      senderType: { type: Sequelize.ENUM('visitor','admin','ai'), allowNull: false },
      senderId: { type: Sequelize.UUID, allowNull: true },
      contentType: { type: Sequelize.ENUM('text','image','file'), allowNull: false, defaultValue: 'text' },
      content: { type: Sequelize.TEXT, allowNull: false },
      isRead: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      conversationId: { type: Sequelize.UUID, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') }
    });
    try {
      // idempotent: skip if constraint already exists
      const [exists] = await queryInterface.sequelize.query("SELECT 1 FROM pg_constraint WHERE conname = 'fk_messages_conversation' LIMIT 1;");
      if (Array.isArray(exists) && exists.length > 0) {
        console.log('fk_messages_conversation already exists, skipping');
      } else {
        await queryInterface.addConstraint('Messages', {
          fields: ['conversationId'], type: 'foreign key', name: 'fk_messages_conversation', references: { table: 'Conversations', field: 'id' }, onDelete: 'CASCADE'
        });
      }
    } catch (err) {
      console.warn('Warning: could not add fk_messages_conversation constraint in migration 20251103 -', err.message);
    }
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('Messages', 'fk_messages_conversation');
    await queryInterface.dropTable('Messages');
  }
};
