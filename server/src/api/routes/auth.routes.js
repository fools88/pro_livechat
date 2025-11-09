// /pro_livechat/server/src/api/routes/auth.routes.js

const express = require('express');
const router = express.Router(); // Ambil "Papan Petunjuk" dari Express

// Ambil "Otak" yang kita buat tadi
const authController = require('../controllers/auth.controller');

// --- (A) Definisikan Papan Petunjuk ---

// Saat ada request POST ke "/api/auth/register"
// Jalankan fungsi: authController.register
router.post('/register', authController.register);

// Saat ada request POST ke "/api/auth/login"
// Jalankan fungsi: authController.login
router.post('/login', authController.login);

// --- (B) Ekspor Papan Petunjuknya ---
module.exports = router;