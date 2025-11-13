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
    try {
      const [exists] = await queryInterface.sequelize.query("SELECT 1 FROM pg_constraint WHERE conname = 'fk_airules_website' LIMIT 1;");
      if (Array.isArray(exists) && exists.length > 0) {
        console.log('fk_airules_website already exists, skipping');
      } else {
        await queryInterface.addConstraint('AIRules', {
          fields: ['websiteId'], type: 'foreign key', name: 'fk_airules_website', references: { table: 'Websites', field: 'id' }, onDelete: 'CASCADE'
        });
      }
    } catch (err) {
      console.warn('Warning: could not add fk_airules_website constraint in migration 20251103 -', err.message);
    }
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('AIRules', 'fk_airules_website');
    await queryInterface.dropTable('AIRules');
  }
};
