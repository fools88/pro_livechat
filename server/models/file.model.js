// /server/models/file.model.js
// File model untuk file sharing feature

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const File = sequelize.define('File', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    
    // Foreign Keys
    messageId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'message_id'
    },
    
    conversationId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'conversation_id'
    },
    
    // File Information
    originalFilename: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'original_filename'
    },
    
    storedFilename: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      field: 'stored_filename'
    },
    
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'mime_type'
    },
    
    fileSize: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'file_size',
      get() {
        const rawValue = this.getDataValue('fileSize');
        return rawValue ? parseInt(rawValue) : 0;
      }
    },
    
    fileExtension: {
      type: DataTypes.STRING(10),
      allowNull: true,
      field: 'file_extension'
    },
    
    // Storage Info
    storagePath: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'storage_path'
    },
    
    storageBucket: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'prochat-files',
      field: 'storage_bucket'
    },
    
    // Uploader Info
    uploaderType: {
      type: DataTypes.ENUM('admin', 'visitor'),
      allowNull: false,
      field: 'uploader_type'
    },
    
    uploaderId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'uploader_id'
    },
    
    uploadedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'uploaded_at'
    },
    
    // Security
    virusScanStatus: {
      type: DataTypes.ENUM('pending', 'clean', 'infected', 'error'),
      allowNull: false,
      defaultValue: 'pending',
      field: 'virus_scan_status'
    },
    
    virusScanDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'virus_scan_date'
    },
    
    // Download Tracking
    downloadCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'download_count'
    },
    
    lastDownloadedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_downloaded_at'
    }
    
  }, {
    tableName: 'files',
    underscored: true,
    paranoid: true, // Enable soft delete
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  });

  // Instance Methods
  File.prototype.isImage = function() {
    return this.mimeType.startsWith('image/');
  };

  File.prototype.isDocument = function() {
    const docTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    return docTypes.includes(this.mimeType);
  };

  File.prototype.getFileSizeFormatted = function() {
    const bytes = this.fileSize;
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  File.prototype.incrementDownload = async function() {
    this.downloadCount += 1;
    this.lastDownloadedAt = new Date();
    await this.save();
  };

  // Class Methods
  File.getFileIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) return '📷';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
    return '📎';
  };

  // Associations will be defined in index.js
  File.associate = (models) => {
    File.belongsTo(models.Message, {
      foreignKey: 'messageId',
      as: 'message'
    });
    
    File.belongsTo(models.Conversation, {
      foreignKey: 'conversationId',
      as: 'conversation'
    });
    
    File.belongsTo(models.User, {
      foreignKey: 'uploaderId',
      as: 'adminUploader',
      constraints: false,
      scope: {
        uploaderType: 'admin'
      }
    });
    
    File.belongsTo(models.Visitor, {
      foreignKey: 'uploaderId',
      as: 'visitorUploader',
      constraints: false,
      scope: {
        uploaderType: 'visitor'
      }
    });
  };

  return File;
};
