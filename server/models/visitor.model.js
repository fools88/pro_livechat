// /pro_livechat/server/models/visitor.model.js

const { DataTypes } = require('sequelize');
const { getSequelize } = require('../src/config/db.config');
const sequelize = getSequelize();

const Visitor = sequelize.define(
  'Visitor', // Nama model (akan jadi tabel 'Visitors')
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    // --- Identitas Klien Tipe A (Game/Login) ---
    externalId: {
      // ID dari database KLIEN (mis: 'user_98765')
      type: DataTypes.STRING,
      allowNull: true, // Boleh kosong, karena mungkin anonim
    },
    username: {
      // Nama tampilan (mis: 'Gamer123')
      type: DataTypes.STRING,
      allowNull: true,
    },

    // --- Identitas Klien Tipe B (Anonim) ---
    browserFingerprint: {
      // ID unik dari cookie/browser
      type: DataTypes.STRING,
      allowNull: true, 
    },

    // --- Info Konteks (Pilar 2) ---
    lastSeenIp: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastSeenLocation: {
      // Misal: "Sihanoukville, Cambodia"
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastSeenUserAgent: {
      // Misal: "Chrome on Windows"
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Nanti kita tambahkan relasi ke 'Website' di sini
  },
  {
    timestamps: true,
    tableName: 'Visitors',
    indexes: [
      // Buat 'index' agar pencarian data cepat
      { unique: false, fields: ['externalId'] },
      { unique: false, fields: ['browserFingerprint'] },
    ]
  }
);

module.exports = Visitor;