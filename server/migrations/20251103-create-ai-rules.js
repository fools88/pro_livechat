"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('AIRules', {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
      targetType: { type: Sequelize.ENUM('website','visitor_id'), allowNull: false },
      targetValue: { type: Sequelize.STRING, allowNull: false },
      action: { type: Sequelize.ENUM('AUTO_REPLY','DO_NOTHING'), allowNull: false, defaultValue: 'DO_NOTHING' },
      websiteId: { type: Sequelize.UUID, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') }
    });
    await queryInterface.addConstraint('AIRules', {
      fields: ['websiteId'], type: 'foreign key', name: 'fk_airules_website', references: { table: 'Websites', field: 'id' }, onDelete: 'CASCADE'
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('AIRules', 'fk_airules_website');
    await queryInterface.dropTable('AIRules');
  }
};
