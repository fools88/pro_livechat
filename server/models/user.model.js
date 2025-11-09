// /pro_livechat/server/src/models/user.model.js

const { DataTypes } = require('sequelize');
const { getSequelize } = require('../src/config/db.config'); // Ambil koneksi DB
const sequelize = getSequelize();
const bcrypt = require('bcryptjs');

// (A) Definisikan "Cetakan" Tabel User
const User = sequelize.define(
  'User', // Nama model (akan jadi nama tabel 'Users')
  {
    // Ini adalah kolom-kolom di tabel kita
    id: {
      type: DataTypes.UUID, // Pakai UUID biar unik & aman
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false, // Wajib diisi
      unique: true, // Nggak boleh ada email yang sama
      validate: {
        isEmail: true, // Validasi email
      },
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
      // Kita TIDAK simpan password, tapi "hash"-nya
    },
    role: {
      type: DataTypes.ENUM('agent', 'admin'), // Peran: Agent biasa atau Admin (Owner)
      allowNull: false,
      defaultValue: 'agent',
    },
    // Nanti kita akan tambahkan relasi ke 'Website' di sini
  },
  {
    // (B) Options
    timestamps: true, // Otomatis buat kolom 'createdAt' dan 'updatedAt'
    tableName: 'Users', // Pastikan nama tabelnya 'Users'
  }
);

// (C) "Hooks" - Aksi Otomatis
// Ini akan otomatis nge-hash password SEBELUM disimpan ke DB
User.beforeCreate(async (user) => {
  if (user.passwordHash) {
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
  }
});

// (D) Fungsi Helper (untuk cek password saat login)
User.prototype.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

// (E) Ekspor modelnya
module.exports = User;