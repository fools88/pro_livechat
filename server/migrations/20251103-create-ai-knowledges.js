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
      // Only add FK if referenced table exists and constraint not already present
      const [res] = await queryInterface.sequelize.query(`SELECT to_regclass('public."Websites"') as reg;`);
      const tableExists = Array.isArray(res) && res.length > 0 && res[0].reg !== null;
      if (tableExists) {
        const [exists] = await queryInterface.sequelize.query("SELECT 1 FROM pg_constraint WHERE conname = 'fk_aiknowledges_website' LIMIT 1;");
        if (Array.isArray(exists) && exists.length > 0) {
          console.log('fk_aiknowledges_website already exists, skipping');
        } else {
          await queryInterface.addConstraint('AIKnowledges', {
            fields: ['websiteId'],
            type: 'foreign key',
            name: 'fk_aiknowledges_website',
            references: { table: 'Websites', field: 'id' },
            onDelete: 'CASCADE'
          });
        }
      } else {
        // eslint-disable-next-line no-console
        console.warn('Skipping fk_aiknowledges_website: referenced table Websites not present yet');
      }
    } catch (err) {
      // Log and continue for resilience in mixed-order CI runs
      // eslint-disable-next-line no-console
      console.warn('Warning: could not add fk_aiknowledges_website constraint in migration 20251103 -', err && err.message);
    }

    try {
      const [res2] = await queryInterface.sequelize.query(`SELECT to_regclass('public."KnowledgeCategories"') as reg;`);
      const kcExists = Array.isArray(res2) && res2.length > 0 && res2[0].reg !== null;
      if (kcExists) {
        const [exists2] = await queryInterface.sequelize.query("SELECT 1 FROM pg_constraint WHERE conname = 'fk_aiknowledges_category' LIMIT 1;");
        if (Array.isArray(exists2) && exists2.length > 0) {
          console.log('fk_aiknowledges_category already exists, skipping');
        } else {
          await queryInterface.addConstraint('AIKnowledges', {
            fields: ['categoryId'],
            type: 'foreign key',
            name: 'fk_aiknowledges_category',
            references: { table: 'KnowledgeCategories', field: 'id' },
            onDelete: 'SET NULL'
          });
        }
      } else {
        // eslint-disable-next-line no-console
        console.warn('Skipping fk_aiknowledges_category: referenced table KnowledgeCategories not present yet');
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Warning: could not add fk_aiknowledges_category constraint in migration 20251103 -', err && err.message);
    }
  },
  down: async (queryInterface, Sequelize) => {
    // Remove constraints if they exist, but do not fail if missing
    try { await queryInterface.removeConstraint('AIKnowledges', 'fk_aiknowledges_website'); } catch (e) { /* ignore */ }
    try { await queryInterface.removeConstraint('AIKnowledges', 'fk_aiknowledges_category'); } catch (e) { /* ignore */ }
    await queryInterface.dropTable('AIKnowledges');
  }
};
