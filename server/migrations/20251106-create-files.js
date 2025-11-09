// 20251106-create-files.js
// Migration untuk File Sharing feature

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('files', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      
      // Foreign Keys
      message_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          // Message table is defined as "Messages" in other migrations/models
          model: 'Messages',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      
      conversation_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          // Conversation table is defined as "Conversations" in other migrations/models
          model: 'Conversations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      
      // File Information
      original_filename: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      
      stored_filename: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      
      mime_type: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      
      file_size: {
        type: Sequelize.BIGINT,
        allowNull: false,
        comment: 'File size in bytes'
      },
      
      file_extension: {
        type: Sequelize.STRING(10),
        allowNull: true
      },
      
      // Storage Info
      storage_path: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Path in MinIO/S3'
      },
      
      storage_bucket: {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: 'prochat-files'
      },
      
      // Uploader Info
      uploader_type: {
        type: Sequelize.ENUM('admin', 'visitor'),
        allowNull: false
      },
      
      uploader_id: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'admin_id or visitor_id'
      },
      
      uploaded_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      
      // Security
      virus_scan_status: {
        type: Sequelize.ENUM('pending', 'clean', 'infected', 'error'),
        allowNull: false,
        defaultValue: 'pending'
      },
      
      virus_scan_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      
      // Download Tracking
      download_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      
      last_downloaded_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      
      // Timestamps
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Soft delete timestamp'
      }
    });

    // Create Indexes for performance
    await queryInterface.addIndex('files', ['message_id'], {
      name: 'idx_files_message'
    });
    
    await queryInterface.addIndex('files', ['conversation_id'], {
      name: 'idx_files_conversation'
    });
    
    await queryInterface.addIndex('files', ['uploader_type', 'uploader_id'], {
      name: 'idx_files_uploader'
    });
    
    await queryInterface.addIndex('files', ['created_at'], {
      name: 'idx_files_created'
    });
    
    await queryInterface.addIndex('files', ['deleted_at'], {
      name: 'idx_files_deleted'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('files');
  }
};
