// /pro_livechat/server/src/api/routes/team.routes.js

const express = require('express');
const router = express.Router();

// Ambil "Otak"
const teamController = require('../controllers/team.controller');
// Ambil "Satpam"
const authJwt = require('../middleware/auth.jwt');

// --- (A) Definisikan Papan Petunjuk + JAGA DENGAN SATPAM ---

// Ini adalah "Satpam" level tertinggi (Super Admin)
const adminAccess = [authJwt.verifyToken, authJwt.isAdmin];

// POST /api/team/assign
// (Menugaskan agent ke website)
router.post(
  '/assign',
  adminAccess, // Dijaga Super Admin
  teamController.assignAgentToWebsite
);

// POST /api/team/remove
// (Menghapus tugas agent dari website)
router.post(
  '/remove',
  adminAccess, // Dijaga Super Admin
  teamController.removeAgentFromWebsite
);

module.exports = router;