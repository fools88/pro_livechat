// /pro_livechat/server/models/knowledgeCategory.model.js
// (FILE BARU UNTUK V15)

const { DataTypes } = require('sequelize');
const { getSequelize } = require('../src/config/db.config');
const sequelize = getSequelize();

const KnowledgeCategory = sequelize.define(
  'KnowledgeCategory',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false, // Misal: "Promosi", "Aturan Main", "Deposit"
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true, // Penjelasan singkat
    },
    // 'websiteId' akan ditambahkan melalui Relasi
  },
  {
    timestamps: true,
    tableName: 'KnowledgeCategories',
  }
);

module.exports = KnowledgeCategory;