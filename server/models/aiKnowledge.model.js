// /pro_livechat/server/models/aiKnowledge.model.js

const { DataTypes } = require('sequelize');
const { getSequelize } = require('../src/config/db.config');
const sequelize = getSequelize();

const AIKnowledge = sequelize.define(
  'AIKnowledge',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: false, // Misal: "faq-situsgame1.pdf"
    },
    s3Url: {
      // Link ke file-nya di S3
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      // Status pemrosesan oleh AI
      type: DataTypes.ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'),
      defaultValue: 'PENDING',
    },
    // Nanti akan ada 'websiteId' dari relasi
  },
  {
    timestamps: true,
    tableName: 'AIKnowledges',
  }
);

module.exports = AIKnowledge;