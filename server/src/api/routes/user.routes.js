// /pro_livechat/server/src/api/routes/user.routes.js

const express = require('express');
const router = express.Router();

// Ambil "Otak"
const userController = require('../controllers/user.controller');
// Ambil "Satpam"
const authJwt = require('../middleware/auth.jwt');

// --- (A) Definisikan Papan Petunjuk + JAGA DENGAN SATPAM ---

// Siapapun yang mau ke rute ini HARUS lewat 2 Satpam:
// 1. authJwt.verifyToken: Cek dia udah login?
// 2. authJwt.isAdmin: Cek dia 'admin'?

// GET /api/users/
router.get(
  '/',
  [authJwt.verifyToken, authJwt.isAdmin], // Pasang 2 Satpam
  userController.getAllUsers
);

// DELETE /api/users/:id
router.delete(
  '/:id',
  [authJwt.verifyToken, authJwt.isAdmin], // Pasang 2 Satpam
  userController.deleteUser
);

// PUT /api/users/:id/role
router.put(
  '/:id/role',
  [authJwt.verifyToken, authJwt.isAdmin], // Pasang 2 Satpam
  userController.updateUserRole
);

module.exports = router;