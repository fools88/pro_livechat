// /pro_livechat/server/src/api/routes/website.routes.js

const express = require('express');
const router = express.Router();

// Ambil "Otak"
const websiteController = require('../controllers/website.controller');
// Ambil "Satpam"
const authJwt = require('../middleware/auth.jwt');

// --- JAGA SEMUA RUTE INI DENGAN SATPAM (ADMIN ONLY) ---

const adminAccess = [authJwt.verifyToken, authJwt.isAdmin];

// POST /api/websites/
router.post(
  '/',
  adminAccess, // Pasang Satpam
  websiteController.createWebsite
);

// GET /api/websites/
router.get(
  '/',
  adminAccess, // Pasang Satpam
  websiteController.getAllWebsites
);

// DELETE /api/websites/:id
router.delete(
  '/:id',
  adminAccess, // Pasang Satpam
  websiteController.deleteWebsite
);

module.exports = router;