// /pro_livechat/server/src/api/routes/upload.routes.js

const express = require('express');
const router = express.Router();

const uploadController = require('../controllers/upload.controller');
const authJwt = require('../middleware/auth.jwt'); // Satpam

const adminAccess = [authJwt.verifyToken, authJwt.isAdmin];

// POST /api/uploads/knowledge/:websiteId
// (React akan kirim: { fileName, fileType })
router.post(
  '/knowledge/:websiteId',
  adminAccess, // Dijaga Admin
  uploadController.getKnowledgeUploadUrl
);

module.exports = router;