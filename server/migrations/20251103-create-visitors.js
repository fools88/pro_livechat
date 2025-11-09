"use strict";
const logger = require('../src/utils/logger');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Visitors', {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
      externalId: { type: Sequelize.STRING, allowNull: true },
      username: { type: Sequelize.STRING, allowNull: true },
      browserFingerprint: { type: Sequelize.STRING, allowNull: true },
      lastSeenIp: { type: Sequelize.STRING, allowNull: true },
      lastSeenLocation: { type: Sequelize.STRING, allowNull: true },
      lastSeenUserAgent: { type: Sequelize.TEXT, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') }
    });
    try {
      await queryInterface.addIndex('Visitors', ['externalId']);
    } catch (err) {
      // index may already exist from previous sync; ignore
      logger.warn('Could not create index Visitors.externalId: ' + (err && (err.message || err)));
    }
    try {
      await queryInterface.addIndex('Visitors', ['browserFingerprint']);
    } catch (err) {
      logger.warn('Could not create index Visitors.browserFingerprint: ' + (err && (err.message || err)));
    }
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('Visitors', ['externalId']);
    await queryInterface.removeIndex('Visitors', ['browserFingerprint']);
    await queryInterface.dropTable('Visitors');
  }
};
