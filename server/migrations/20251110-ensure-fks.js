"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Ensure FK constraints that may have been skipped earlier due to migration ordering.
    const attempts = [];

    // AIKnowledges.websiteId -> Websites.id
    attempts.push((async () => {
      try {
        await queryInterface.addConstraint('AIKnowledges', {
          fields: ['websiteId'],
          type: 'foreign key',
          name: 'fk_aiknowledges_website',
          references: { table: 'Websites', field: 'id' },
          onDelete: 'CASCADE'
        });
        console.log('✅ Added fk_aiknowledges_website');
      } catch (err) {
        console.warn('Could not add fk_aiknowledges_website (already exists or missing table):', err && err.message);
      }
    })());

    // AIKnowledges.categoryId -> KnowledgeCategories.id
    attempts.push((async () => {
      try {
        await queryInterface.addConstraint('AIKnowledges', {
          fields: ['categoryId'],
          type: 'foreign key',
          name: 'fk_aiknowledges_category',
          references: { table: 'KnowledgeCategories', field: 'id' },
          onDelete: 'SET NULL'
        });
        console.log('✅ Added fk_aiknowledges_category');
      } catch (err) {
        console.warn('Could not add fk_aiknowledges_category (already exists or missing table):', err && err.message);
      }
    })());

    // AIPersonas.websiteId -> Websites.id
    attempts.push((async () => {
      try {
        await queryInterface.addConstraint('AIPersonas', {
          fields: ['websiteId'],
          type: 'foreign key',
          name: 'fk_aipersonas_website',
          references: { table: 'Websites', field: 'id' },
          onDelete: 'CASCADE'
        });
        console.log('✅ Added fk_aipersonas_website');
      } catch (err) {
        console.warn('Could not add fk_aipersonas_website (already exists or missing table):', err && err.message);
      }
    })());

    // AIRules.websiteId -> Websites.id
    attempts.push((async () => {
      try {
        await queryInterface.addConstraint('AIRules', {
          fields: ['websiteId'],
          type: 'foreign key',
          name: 'fk_airules_website',
          references: { table: 'Websites', field: 'id' },
          onDelete: 'CASCADE'
        });
        console.log('✅ Added fk_airules_website');
      } catch (err) {
        console.warn('Could not add fk_airules_website (already exists or missing table):', err && err.message);
      }
    })());

    // Conversations.websiteId -> Websites.id
    attempts.push((async () => {
      try {
        await queryInterface.addConstraint('Conversations', {
          fields: ['websiteId'],
          type: 'foreign key',
          name: 'fk_conversations_website',
          references: { table: 'Websites', field: 'id' },
          onDelete: 'CASCADE'
        });
        console.log('✅ Added fk_conversations_website');
      } catch (err) {
        console.warn('Could not add fk_conversations_website (already exists or missing table):', err && err.message);
      }
    })());

    // Conversations.visitorId -> Visitors.id
    attempts.push((async () => {
      try {
        await queryInterface.addConstraint('Conversations', {
          fields: ['visitorId'],
          type: 'foreign key',
          name: 'fk_conversations_visitor',
          references: { table: 'Visitors', field: 'id' },
          onDelete: 'CASCADE'
        });
        console.log('✅ Added fk_conversations_visitor');
      } catch (err) {
        console.warn('Could not add fk_conversations_visitor (already exists or missing table):', err && err.message);
      }
    })());

    // Wait all attempts (they already run sequentially but keep this pattern)
    await Promise.all(attempts);
  },

  down: async (queryInterface, Sequelize) => {
    const removes = [];
    ['fk_aiknowledges_website','fk_aiknowledges_category','fk_aipersonas_website','fk_airules_website','fk_conversations_website','fk_conversations_visitor'].forEach(name => {
      removes.push((async () => {
        try {
          // Try-remove each constraint if present
          // We attempt removal on the most-likely table first
          const tableMap = {
            'fk_aiknowledges_website': 'AIKnowledges',
            'fk_aiknowledges_category': 'AIKnowledges',
            'fk_aipersonas_website': 'AIPersonas',
            'fk_airules_website': 'AIRules',
            'fk_conversations_website': 'Conversations',
            'fk_conversations_visitor': 'Conversations'
          };
          const table = tableMap[name];
          await queryInterface.removeConstraint(table, name);
          console.log('✅ Removed constraint', name);
        } catch (err) {
          console.warn('Could not remove constraint', name, ':', err && err.message);
        }
      })());
    });
    await Promise.all(removes);
  }
};
