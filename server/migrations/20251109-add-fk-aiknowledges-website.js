"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Tambahkan FK websiteId -> Websites.id jika belum ada.
    try {
      await queryInterface.addConstraint('AIKnowledges', {
        fields: ['websiteId'],
        type: 'foreign key',
        name: 'fk_aiknowledges_website',
        references: {
          table: 'Websites',
          field: 'id'
        },
        onDelete: 'CASCADE',
      });
      console.log('✅ Added constraint fk_aiknowledges_website');
    } catch (err) {
      // Jika constraint sudah ada atau tabel belum tersedia, tulis peringatan
      console.warn('Could not add fk_aiknowledges_website (may already exist or table missing):', err && err.message);
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeConstraint('AIKnowledges', 'fk_aiknowledges_website');
      console.log('✅ Removed constraint fk_aiknowledges_website');
    } catch (err) {
      console.warn('Could not remove fk_aiknowledges_website:', err && err.message);
    }
  }
};
