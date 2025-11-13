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
    // add indexes only if the column exists (some runs observed CREATE INDEX failing
    // because the column wasn't present in that DB state)
    const hasColumn = async (columnName) => {
      const sql = `SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Visitors' AND column_name = $1 LIMIT 1`;
      const res = await queryInterface.sequelize.query(sql, { bind: [columnName], type: queryInterface.sequelize.QueryTypes.SELECT });
      return Array.isArray(res) && res.length > 0;
    };

    try {
      if (await hasColumn('externalId')) {
        await queryInterface.addIndex('Visitors', ['externalId']);
      } else {
        logger.warn('Skipping index Visitors.externalId: column externalId not found');
      }
    } catch (err) {
      logger.warn('Could not create index Visitors.externalId: ' + (err && (err.message || err)));
    }

    try {
      if (await hasColumn('browserFingerprint')) {
        await queryInterface.addIndex('Visitors', ['browserFingerprint']);
      } else {
        logger.warn('Skipping index Visitors.browserFingerprint: column browserFingerprint not found');
      }
    } catch (err) {
      logger.warn('Could not create index Visitors.browserFingerprint: ' + (err && (err.message || err)));
    }
  },
  down: async (queryInterface, Sequelize) => {
    // remove indexes if present, ignore errors if they don't exist
    try { await queryInterface.removeIndex('Visitors', ['externalId']); } catch (e) { /* ignore */ }
    try { await queryInterface.removeIndex('Visitors', ['browserFingerprint']); } catch (e) { /* ignore */ }
    await queryInterface.dropTable('Visitors');
  }
};
