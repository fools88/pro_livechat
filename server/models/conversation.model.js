// /pro_livechat/server/models/conversation.model.js
// (VERSI V13 - MENAMBAH aiSummary)

const { DataTypes } = require('sequelize');
const { getSequelize } = require('../src/config/db.config');
const sequelize = getSequelize();

const Conversation = sequelize.define(
  'Conversation',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    status: {
      type: DataTypes.ENUM('new', 'active', 'resolved'), 
      allowNull: false,
      defaultValue: 'new',
    },
    isAiActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true 
    },
    
    // --- (FITUR MEMORI JANGKA PANJANG) ---
    aiSummary: {
      type: DataTypes.TEXT, // Kolom untuk menyimpan ringkasan panjang
      allowNull: true // Boleh kosong
    }
    // ---------------------------------
  },
  {
    timestamps: true,
    tableName: 'Conversations',
  }
);

module.exports = Conversation;