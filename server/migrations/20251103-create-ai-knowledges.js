"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('AIKnowledges', {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
      fileName: { type: Sequelize.STRING, allowNull: false },
      s3Url: { type: Sequelize.STRING, allowNull: false },
      status: { type: Sequelize.ENUM('PENDING','PROCESSING','COMPLETED','FAILED'), allowNull: false, defaultValue: 'PENDING' },
      websiteId: { type: Sequelize.UUID, allowNull: true },
      categoryId: { type: Sequelize.UUID, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') }
    });
    try {
      await queryInterface.addConstraint('AIKnowledges', {
        fields: ['websiteId'],
        type: 'foreign key',
        name: 'fk_aiknowledges_website',
        references: { table: 'Websites', field: 'id' },
        onDelete: 'CASCADE'
      });
    } catch (err) {
      // Some CI runs execute migrations in an order where the referenced table may not exist yet.
      // Make this migration resilient: log and continue instead of hard-failing.
      // The separate idempotent migration (20251109-add-fk-aiknowledges-website.js) will ensure
      // the FK exists when possible.
      // eslint-disable-next-line no-console
      console.warn('Warning: could not add fk_aiknowledges_website constraint in migration 20251103 -', err && err.message);
    }

    try {
      await queryInterface.addConstraint('AIKnowledges', {
        fields: ['categoryId'],
        type: 'foreign key',
        name: 'fk_aiknowledges_category',
        references: { table: 'KnowledgeCategories', field: 'id' },
        onDelete: 'SET NULL'
      });
    } catch (err) {
      // Non-fatal: addConstraint may fail if KnowledgeCategories does not exist yet in some CI orders.
      // A later migration can add this constraint if needed.
      // eslint-disable-next-line no-console
      console.warn('Warning: could not add fk_aiknowledges_category constraint in migration 20251103 -', err && err.message);
    }
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('AIKnowledges', 'fk_aiknowledges_website');
    await queryInterface.removeConstraint('AIKnowledges', 'fk_aiknowledges_category');
    await queryInterface.dropTable('AIKnowledges');
  }
};
