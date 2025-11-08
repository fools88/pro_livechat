// /pro_livechat/server/models/aiPersona.model.js
// (VERSI V14 - STRUKTUR PRO)

const { DataTypes } = require('sequelize');
const { getSequelize } = require('../src/config/db.config');
const sequelize = getSequelize();

const AIPersona = sequelize.define(
  'AIPersona',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    
    // --- KOLOM BARU V14 ---
    nama_persona: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Asisten', // (Misal: "Yaru", "Rina")
    },
    gaya_bicara: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: 'Anda adalah asisten yang ramah dan profesional.' // (Gaya bicara inti)
    },
    salam_pembuka: {
      type: DataTypes.STRING,
      allowNull: true, // (Misal: "Halo kak 👋 Ada yang bisa dibantu?")
    },
    salam_penutup: {
      type: DataTypes.STRING,
      allowNull: true, // (Misal: "Ada lagi yang bisa dibantu, kak?")
    },
    // --- KOLOM LAMA V13 (DIHAPUS) ---
    // 'name' (string) DIGANTI 'nama_persona'
    // 'systemPrompt' (text) DIGANTI 'gaya_bicara', 'salam_pembuka', 'salam_penutup'

    // --- KOLOM LAMA (DIPERTAHANKAN) ---
    modelName: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'gemini-2.0-flash-001' // (Kita tetap butuh ini)
    }
    // 'websiteId' akan ditambahkan melalui Relasi (di index.js)
  },
  {
    timestamps: true,
    tableName: 'AIPersonas',
  }
);

module.exports = AIPersona;