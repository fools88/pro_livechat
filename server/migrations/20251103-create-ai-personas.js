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
      const [res] = await queryInterface.sequelize.query(`SELECT to_regclass('public."Websites"') as reg;`);
      const tableExists = Array.isArray(res) && res.length > 0 && res[0].reg !== null;
      if (tableExists) {
        const [exists] = await queryInterface.sequelize.query("SELECT 1 FROM pg_constraint WHERE conname = 'fk_aipersonas_website' LIMIT 1;");
        if (Array.isArray(exists) && exists.length > 0) {
          console.log('fk_aipersonas_website already exists, skipping');
        } else {
          await queryInterface.addConstraint('AIPersonas', {
            fields: ['websiteId'], type: 'foreign key', name: 'fk_aipersonas_website', references: { table: 'Websites', field: 'id' }, onDelete: 'CASCADE'
          });
        }
      } else {
        console.warn('Skipping fk_aipersonas_website: referenced table Websites not present yet');
      }
    } catch (err) {
      console.warn('Warning: could not add fk_aipersonas_website constraint in migration 20251103 -', err.message);
    }
  },
  down: async (queryInterface, Sequelize) => {
    try { await queryInterface.removeConstraint('AIPersonas', 'fk_aipersonas_website'); } catch (e) { /* ignore */ }
    await queryInterface.dropTable('AIPersonas');
  }
};
