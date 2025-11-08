// /dashboard/src/services/user.service.js

import api from './api';

// Ambil daftar semua user (admin + agent)
const getAllUsers = () => {
  // Backend: GET /api/users
  return api.get('/users');
};

// Hapus user (agent)
const deleteUser = (userId) => {
  // Backend: DELETE /api/users/:id
  return api.delete(`/users/${userId}`);
};

const userService = {
  getAllUsers,
  deleteUser,
};

export default userService;