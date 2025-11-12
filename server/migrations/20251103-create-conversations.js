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
      const [res] = await queryInterface.sequelize.query(`SELECT to_regclass('public."Websites"') as reg;`);
      const websitesExists = Array.isArray(res) && res.length > 0 && res[0].reg !== null;
      if (websitesExists) {
        await queryInterface.addConstraint('Conversations', {
          fields: ['websiteId'], type: 'foreign key', name: 'fk_conversations_website', references: { table: 'Websites', field: 'id' }, onDelete: 'CASCADE'
        });
      } else {
        console.warn('Skipping fk_conversations_website: referenced table Websites not present yet');
      }
    } catch (err) {
      console.warn('Warning: could not add fk_conversations_website constraint in migration 20251103 -', err.message);
    }
    try {
      const [res2] = await queryInterface.sequelize.query(`SELECT to_regclass('public."Visitors"') as reg;`);
      const visitorsExists = Array.isArray(res2) && res2.length > 0 && res2[0].reg !== null;
      if (visitorsExists) {
        await queryInterface.addConstraint('Conversations', {
          fields: ['visitorId'], type: 'foreign key', name: 'fk_conversations_visitor', references: { table: 'Visitors', field: 'id' }, onDelete: 'CASCADE'
        });
      } else {
        console.warn('Skipping fk_conversations_visitor: referenced table Visitors not present yet');
      }
    } catch (err) {
      console.warn('Warning: could not add fk_conversations_visitor constraint in migration 20251103 -', err.message);
    }
  },
  down: async (queryInterface, Sequelize) => {
    try { await queryInterface.removeConstraint('Conversations', 'fk_conversations_website'); } catch (e) { /* ignore */ }
    try { await queryInterface.removeConstraint('Conversations', 'fk_conversations_visitor'); } catch (e) { /* ignore */ }
    await queryInterface.dropTable('Conversations');
  }
};
