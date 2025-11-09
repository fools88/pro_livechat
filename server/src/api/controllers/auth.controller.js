// /pro_livechat/server/src/api/controllers/auth.controller.js

const db = require('../../../models'); // Ambil 'index.js' dari models
const User = db.User;
const logger = require('../../utils/logger');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- (A) FUNGSI UNTUK REGISTER ADMIN BARU ---
exports.register = async (req, res) => {
  // 1. Ambil data dari request body (yang dikirim Dashboard React nanti)
  const { username, email, password, role } = req.body;

  try {
    // 2. Cek apakah email atau username sudah dipakai
    const existingUser = await User.findOne({
      where: { [db.Sequelize.Op.or]: [{ email }, { username }] },
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: 'Error: Email atau username sudah terdaftar.' 
      });
    }

    // 3. Buat user baru di database
    // Kita HANYA kirim 'password' biasa.
    // 'user.model.js' kita akan OTOMATIS nge-hash password-nya
    // berkat 'beforeCreate' hook yang kita buat. AJAIB!
    const newUser = await User.create({
      username,
      email,
      passwordHash: password, // Model akan hash ini
      role: role || 'agent', // Default 'agent' jika tidak diset
    });

    // 4. Kirim balasan sukses (tanpa password)
    res.status(201).json({
      message: 'User berhasil diregistrasi.',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
    });

  } catch (error) {
    logger.error('[Auth Register] Error: ' + (error && (error.stack || error.message)));
    res.status(500).json({ message: 'Server error saat registrasi.' });
  }
};

// --- (B) FUNGSI UNTUK LOGIN ADMIN ---
exports.login = async (req, res) => {
  // 1. Ambil data dari request body
 const { identifier, password } = req.body; // Kita pakai 'identifier'

try {
  // 2. Cari user berdasarkan email ATAU username
  const user = await User.findOne({ 
    where: { 
      [db.Sequelize.Op.or]: [{ email: identifier }, { username: identifier }] // <-- PERUBAHAN UTAMA
    } 
  });

    // 3. Jika user tidak ditemukan
    if (!user) {
      return res.status(404).json({ message: 'Error: Email tidak ditemukan.' });
    }

    // 4. Bandingkan password yang dikirim dengan hash di DB
    // Kita panggil fungsi 'comparePassword' yang kita buat di 'user.model.js'
    const isPasswordValid = await user.comparePassword(password);

    // 5. Jika password salah
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Error: Password salah.' });
    }

    // 6. Jika password BENAR: Buat "Kunci Digital" (JWT Token)
    const token = jwt.sign(
      { 
        id: user.id, 
        role: user.role 
      }, // Data yang mau kita simpan di token
      process.env.JWT_SECRET, // Ambil "Kunci Rahasia" dari .env
      { expiresIn: '24h' } // Token hangus dalam 24 jam
    );

    // 7. Kirim balasan sukses + token-nya
    res.status(200).json({
      message: 'Login berhasil.',
      token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      }
    });

  } catch (error) {
    logger.error('[Auth Login] Error: ' + (error && (error.stack || error.message)));
    res.status(500).json({ message: 'Server error saat login.' });
  }
};