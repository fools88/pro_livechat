"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('AIPersonas', {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
      nama_persona: { type: Sequelize.STRING, allowNull: false, defaultValue: 'Asisten' },
      gaya_bicara: { type: Sequelize.TEXT, allowNull: false, defaultValue: 'Anda adalah asisten yang ramah dan profesional.' },
      salam_pembuka: { type: Sequelize.STRING, allowNull: true },
      salam_penutup: { type: Sequelize.STRING, allowNull: true },
      modelName: { type: Sequelize.STRING, allowNull: false, defaultValue: 'gemini-2.0-flash-001' },
      websiteId: { type: Sequelize.UUID, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') }
    });
    try {
      await queryInterface.addConstraint('AIPersonas', {
        fields: ['websiteId'], type: 'foreign key', name: 'fk_aipersonas_website', references: { table: 'Websites', field: 'id' }, onDelete: 'CASCADE'
      });
    } catch (err) {
      // Non-fatal: some CI ordering can run this migration before Websites exists.
      console.warn('Warning: could not add fk_aipersonas_website constraint in migration 20251103 -', err.message);
    }
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('AIPersonas', 'fk_aipersonas_website');
    await queryInterface.dropTable('AIPersonas');
  }
};
