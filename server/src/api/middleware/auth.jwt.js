// /pro_livechat/server/src/api/middleware/auth.jwt.js

const jwt = require('jsonwebtoken');
const db = require('../../../models');
const User = db.User;

// Ini adalah "Satpam" kita
const verifyToken = (req, res, next) => {
  // 1. Ambil token dari 'Authorization' header
  // Formatnya: "Bearer [token-panjang-kita]"
  let token = req.headers['authorization'];

  // 2. Cek apakah tokennya ada
  if (!token) {
    return res.status(403).json({
      message: 'Akses ditolak: Tidak ada token!',
    });
  }

  // 3. Ambil tokennya aja (buang kata "Bearer ")
  if (token.startsWith('Bearer ')) {
    token = token.slice(7, token.length);
  }

  // 4. Verifikasi tokennya pakai "Kunci Rahasia" dari .env
  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    // 5. Kalau tokennya salah/kadaluarsa
    if (err) {
      return res.status(401).json({
        message: 'Akses ditolak: Token tidak valid!',
      });
    }

    // 6. KALO TOKEN VALID:
    // Simpan data user dari token ke 'req'
    // Biar rute selanjutnya tahu siapa yang request
    req.userId = decoded.id;
    req.userRole = decoded.role;

    // 7. Izinkan request lanjut ke "Otak" (Controller)
    next(); 
  });
};

// Ini "Satpam" level 2 (ngecek peran)
const isAdmin = (req, res, next) => {
    // Kita cek peran yang sudah disimpan oleh verifyToken
    if (req.userRole === 'admin') {
        next(); // Lanjut, dia admin
        return;
    }

    return res.status(403).json({
        message: "Akses ditolak: Butuh peran 'Admin'!",
    });
};

// Gabungin satpamnya
const authJwt = {
  verifyToken,
  isAdmin,
};

module.exports = authJwt;