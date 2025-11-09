"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Conversations', {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
      status: { type: Sequelize.ENUM('open','closed'), allowNull: false, defaultValue: 'open' },
      isAiActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      aiSummary: { type: Sequelize.TEXT, allowNull: true },
      websiteId: { type: Sequelize.UUID, allowNull: true },
      visitorId: { type: Sequelize.UUID, allowNull: true },
      assignedAdminId: { type: Sequelize.UUID, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') }
    });
    // Add FK constraints where possible
    try {
      await queryInterface.addConstraint('Conversations', {
        fields: ['websiteId'], type: 'foreign key', name: 'fk_conversations_website', references: { table: 'Websites', field: 'id' }, onDelete: 'CASCADE'
      });
    } catch (err) {
      console.warn('Warning: could not add fk_conversations_website constraint in migration 20251103 -', err.message);
    }
    try {
      await queryInterface.addConstraint('Conversations', {
        fields: ['visitorId'], type: 'foreign key', name: 'fk_conversations_visitor', references: { table: 'Visitors', field: 'id' }, onDelete: 'CASCADE'
      });
    } catch (err) {
      console.warn('Warning: could not add fk_conversations_visitor constraint in migration 20251103 -', err.message);
    }
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('Conversations', 'fk_conversations_website');
    await queryInterface.removeConstraint('Conversations', 'fk_conversations_visitor');
    await queryInterface.dropTable('Conversations');
  }
};
