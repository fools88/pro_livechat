// /pro_livechat/server/src/api/routes/ai.routes.js
// (VERSI V15 LENGKAP - DENGAN RUTE KATEGORI BARU)

const express = require('express');
const router = express.Router();

// Ambil "Otak"
const aiController = require('../controllers/ai.controller');
// Ambil "Satpam"
const authJwt = require('../middleware/auth.jwt');

// --- JAGA SEMUA RUTE INI (ADMIN & AGENT Boleh) ---
const agentAndAdminAccess = [authJwt.verifyToken];

// --- Rute Persona (V14 - AMAN) ---
// POST /api/ai/persona/:websiteId (untuk Set/Update)
router.post(
  '/persona/:websiteId',
  agentAndAdminAccess,
  aiController.setPersonaForWebsite
);

// GET /api/ai/persona/:websiteId (untuk Ambil)
router.get(
  '/persona/:websiteId',
  agentAndAdminAccess,
  aiController.getPersonaForWebsite
);

// --- Rute Rules (Aturan) (V13 - AMAN) ---
// POST /api/ai/rules/:websiteId (untuk Buat Baru)
router.post(
  '/rules/:websiteId',
  agentAndAdminAccess,
  aiController.createRuleForWebsite
);

// GET /api/ai/rules/:websiteId (untuk Ambil Semua)
router.get(
  '/rules/:websiteId',
  agentAndAdminAccess,
  aiController.getRulesForWebsite
);

// DELETE /api/ai/rules/:ruleId (untuk Hapus)
router.delete(
  '/rules/:ruleId',
  agentAndAdminAccess,
  aiController.deleteRule
);

// --- Rute Knowledge Base (V13 - AMAN) ---
// POST /api/ai/knowledge/process/:websiteId
router.post(
  '/knowledge/process/:websiteId',
  agentAndAdminAccess, // Dijaga Admin
  aiController.processKnowledgeFile
);

// --- (TAMBAHAN RUTE BARU V15: KATEGORI) ---
// POST /api/ai/categories/:websiteId (untuk Buat Kategori Baru)
router.post(
  '/categories/:websiteId',
  agentAndAdminAccess,
  aiController.createCategory
);

// GET /api/ai/categories/:websiteId (untuk Ambil Semua Kategori)
router.get(
  '/categories/:websiteId',
  agentAndAdminAccess,
  aiController.getCategoriesForWebsite
);
// --- (AKHIR TAMBAHAN V15) ---

module.exports = router;