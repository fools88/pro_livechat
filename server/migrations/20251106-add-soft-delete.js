"use strict";

/**
 * Migration: Add Soft Delete Support
 * 
 * SOFT DELETE = Data tidak dihapus beneran, hanya ditandai sebagai "deleted"
 * 
 * KEUNTUNGAN:
 * 1. Data bisa di-recover kalau ada kesalahan
 * 2. User bisa "undo delete" dalam 30 hari
 * 3. Audit trail tetap utuh (penting untuk compliance)
 * 4. GDPR compliance: User request "hapus data saya" → soft delete dulu, permanent delete setelah 30 hari
 * 
 * CARA KERJA:
 * - Normal query: WHERE deletedAt IS NULL (hanya tampilkan yang belum dihapus)
 * - Include deleted: WHERE deletedAt IS NOT NULL (lihat data yang sudah dihapus)
 * - Permanent delete: Hapus row yang deletedAt > 30 hari
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🚀 Adding soft delete support...');
    
    try {
      // Add deletedAt column to Messages
      await queryInterface.addColumn('Messages', 'deletedAt', {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null
      });
      console.log('✅ Added deletedAt to Messages');

      // Add index for deletedAt (untuk query WHERE deletedAt IS NULL)
      await queryInterface.addIndex('Messages', ['deletedAt'], {
        name: 'idx_messages_deleted_at',
        using: 'BTREE'
      });
      console.log('✅ Added index: idx_messages_deleted_at');

      // Add deletedAt column to Conversations
      await queryInterface.addColumn('Conversations', 'deletedAt', {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null
      });
      console.log('✅ Added deletedAt to Conversations');

      // Add index for deletedAt
      await queryInterface.addIndex('Conversations', ['deletedAt'], {
        name: 'idx_conversations_deleted_at',
        using: 'BTREE'
      });
      console.log('✅ Added index: idx_conversations_deleted_at');

      // Add deletedAt column to Visitors (GDPR compliance)
      await queryInterface.addColumn('Visitors', 'deletedAt', {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null
      });
      console.log('✅ Added deletedAt to Visitors');

      await queryInterface.addIndex('Visitors', ['deletedAt'], {
        name: 'idx_visitors_deleted_at',
        using: 'BTREE'
      });
      console.log('✅ Added index: idx_visitors_deleted_at');

      console.log('🎉 Soft delete support added successfully!');
      console.log('💡 Usage:');
      console.log('   - Soft delete: UPDATE messages SET deletedAt = NOW() WHERE id = ?');
      console.log('   - Query active: SELECT * FROM messages WHERE deletedAt IS NULL');
      console.log('   - Recover: UPDATE messages SET deletedAt = NULL WHERE id = ?');
      
    } catch (error) {
      console.error('❌ Error adding soft delete:', error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('🔄 Removing soft delete support...');
    
    try {
      // Remove indexes first
      await queryInterface.removeIndex('Messages', 'idx_messages_deleted_at');
      await queryInterface.removeIndex('Conversations', 'idx_conversations_deleted_at');
      await queryInterface.removeIndex('Visitors', 'idx_visitors_deleted_at');
      
      // Remove columns
      await queryInterface.removeColumn('Messages', 'deletedAt');
      await queryInterface.removeColumn('Conversations', 'deletedAt');
      await queryInterface.removeColumn('Visitors', 'deletedAt');
      
      console.log('✅ Soft delete support removed');
    } catch (error) {
      console.error('❌ Error removing soft delete:', error.message);
      throw error;
    }
  }
};
