// /pro_livechat/server/models/website.model.js

const { DataTypes } = require('sequelize');
const { getSequelize } = require('../src/config/db.config'); // Ambil koneksi DB
const sequelize = getSequelize();

// Definisikan "Cetakan" Tabel Website
const Website = sequelize.define(
  'Website', // Nama model (akan jadi tabel 'Websites')
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false, // Misal: "Situs Game Keren"
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false, // Misal: "https://situsgamekeren.com"
      unique: true,
    },
    widgetKey: {
      // Kunci API unik untuk widget di website ini
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      unique: true,
      allowNull: false,
    },
    // Nanti kita tambahkan relasi ke 'User' (Admin) di sini
  },
  {
    timestamps: true, // Otomatis buat 'createdAt' dan 'updatedAt'
    tableName: 'Websites',
  }
);

module.exports = Website;