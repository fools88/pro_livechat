// /pro_livechat/server/src/api/routes/analytics.routes.js

const express = require('express');
const router = express.Router();

const analyticsController = require('../controllers/analytics.controller');
const authJwt = require('../middleware/auth.jwt'); // Satpam

// Jaga rute ini (Hanya Super Admin)
const adminAccess = [authJwt.verifyToken, authJwt.isAdmin];

// GET /api/analytics/stats
router.get(
  '/stats',
  adminAccess,
  analyticsController.getStats
);

module.exports = router;