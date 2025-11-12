"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Websites', {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      url: { type: Sequelize.STRING, allowNull: false, unique: true },
      widgetKey: { type: Sequelize.UUID, allowNull: false, unique: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Websites');
  }
};
