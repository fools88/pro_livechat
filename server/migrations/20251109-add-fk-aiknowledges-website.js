"use strict";

/**
 * Migration: tambahkan foreign key AIKnowledges.websiteId -> Websites.id
 * Ini dibuat terpisah agar constraint ditambahkan setelah tabel Websites tersedia.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Defensive: hanya tambahkan constraint bila tabel AIKnowledges ada
    try {
      // Pastikan kolom websiteId ada (biasanya dibuat di migration pembuatan tabel)
      await queryInterface.sequelize.transaction(async (t) => {
        // Add constraint with explicit name so we can remove it in down()
        await queryInterface.addConstraint('AIKnowledges', {
          fields: ['websiteId'],
          type: 'foreign key',
          name: 'fk_aiknowledges_website',
          references: {
            table: 'Websites',
            field: 'id'
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
          transaction: t
        });
      });
    } catch (err) {
      // Jika gagal (mis. tabel belum ada), tampilkan peringatan dan re-throw
      console.warn('Migration add-fk-aiknowledges-website: gagal menambahkan constraint:', err && err.message);
      throw err;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.sequelize.transaction(async (t) => {
        await queryInterface.removeConstraint('AIKnowledges', 'fk_aiknowledges_website', { transaction: t });
      });
    } catch (err) {
      console.warn('Migration add-fk-aiknowledges-website (down): gagal menghapus constraint:', err && err.message);
      throw err;
    }
  }
};
