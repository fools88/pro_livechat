// /pro_livechat/server/models/message.model.js

const { DataTypes } = require('sequelize');
const { getSequelize } = require('../src/config/db.config');
const sequelize = getSequelize();

const Message = sequelize.define(
  'Message',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    senderType: {
      // Siapa yang kirim? Ini penting untuk AI
      type: DataTypes.ENUM('visitor', 'admin', 'ai'),
      allowNull: false,
    },
    senderId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    contentType: {
      // Sesuai permintaanmu: teks, gambar, file
      type: DataTypes.ENUM('text', 'image', 'file'),
      allowNull: false,
      defaultValue: 'text',
    },
    content: {
      // Isinya: Teks pesan ATAU URL ke file di S3
      type: DataTypes.TEXT,
      allowNull: false,
    },
    isRead: {
      // Sesuai permintaanmu (centang biru)
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    // Nanti akan ada 'conversationId'
  },
  {
    timestamps: true, // 'createdAt' sangat penting untuk urutan chat
    tableName: 'Messages',
  }
);

module.exports = Message;