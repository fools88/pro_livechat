"use strict";

/**
 * Idempotent migration to ensure core FK constraints exist.
 * This migration can be run multiple times safely: it checks for the presence
 * of the referenced table and whether a constraint with the intended name
 * already exists in pg_constraint before calling addConstraint.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const fks = [
      { table: 'AIKnowledges', fields: ['websiteId'], name: 'fk_aiknowledges_website', refTable: 'Websites', refField: 'id', onDelete: 'CASCADE' },
      { table: 'AIKnowledges', fields: ['categoryId'], name: 'fk_aiknowledges_category', refTable: 'KnowledgeCategories', refField: 'id', onDelete: 'SET NULL' },
      { table: 'AIPersonas', fields: ['websiteId'], name: 'fk_aipersonas_website', refTable: 'Websites', refField: 'id', onDelete: 'CASCADE' },
      { table: 'AIRules', fields: ['websiteId'], name: 'fk_airules_website', refTable: 'Websites', refField: 'id', onDelete: 'CASCADE' },
      { table: 'Conversations', fields: ['websiteId'], name: 'fk_conversations_website', refTable: 'Websites', refField: 'id', onDelete: 'CASCADE' },
      { table: 'Conversations', fields: ['visitorId'], name: 'fk_conversations_visitor', refTable: 'Visitors', refField: 'id', onDelete: 'CASCADE' },
      { table: 'Messages', fields: ['conversationId'], name: 'fk_messages_conversation', refTable: 'Conversations', refField: 'id', onDelete: 'CASCADE' }
    ];

    for (const fk of fks) {
      try {
        // Ensure referenced table exists
        const [reg] = await queryInterface.sequelize.query(`SELECT to_regclass('public."${fk.refTable}"') as reg;`);
        const tableExists = Array.isArray(reg) && reg.length > 0 && reg[0].reg !== null;
        if (!tableExists) {
          console.warn(`Skipping ${fk.name}: referenced table ${fk.refTable} does not exist yet`);
          continue;
        }

        // Skip if constraint with same name already exists
        const [exists] = await queryInterface.sequelize.query(`SELECT 1 FROM pg_constraint WHERE conname = '${fk.name}' LIMIT 1;`);
        if (Array.isArray(exists) && exists.length > 0) {
          console.log(`${fk.name} already exists, skipping`);
          continue;
        }

        await queryInterface.addConstraint(fk.table, {
          fields: fk.fields,
          type: 'foreign key',
          name: fk.name,
          references: { table: fk.refTable, field: fk.refField },
          onDelete: fk.onDelete
        });
        console.log(`✅ Added constraint ${fk.name}`);
      } catch (err) {
        console.warn(`Could not ensure constraint ${fk.name}:`, err && err.message);
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    const names = ['fk_aiknowledges_website','fk_aiknowledges_category','fk_aipersonas_website','fk_airules_website','fk_conversations_website','fk_conversations_visitor','fk_messages_conversation'];
    for (const name of names) {
      try {
        // Best-effort removal; ignore failures
        const tableMap = {
          'fk_aiknowledges_website': 'AIKnowledges',
          'fk_aiknowledges_category': 'AIKnowledges',
          'fk_aipersonas_website': 'AIPersonas',
          'fk_airules_website': 'AIRules',
          'fk_conversations_website': 'Conversations',
          'fk_conversations_visitor': 'Conversations',
          'fk_messages_conversation': 'Messages'
        };
        const table = tableMap[name] || null;
        if (!table) continue;
        await queryInterface.removeConstraint(table, name);
        console.log('✅ Removed constraint', name);
      } catch (err) {
        console.warn('Could not remove constraint', name, ':', err && err.message);
      }
    }
  }
};
