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
    await queryInterface.addConstraint('AIKnowledges', {
      fields: ['websiteId'], type: 'foreign key', name: 'fk_aiknowledges_website', references: { table: 'Websites', field: 'id' }, onDelete: 'CASCADE'
    });
    await queryInterface.addConstraint('AIKnowledges', {
      fields: ['categoryId'], type: 'foreign key', name: 'fk_aiknowledges_category', references: { table: 'KnowledgeCategories', field: 'id' }, onDelete: 'SET NULL'
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('AIKnowledges', 'fk_aiknowledges_website');
    await queryInterface.removeConstraint('AIKnowledges', 'fk_aiknowledges_category');
    await queryInterface.dropTable('AIKnowledges');
  }
};
