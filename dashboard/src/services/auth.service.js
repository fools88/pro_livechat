// /dashboard/src/services/auth.service.js

import api from './api'; // Import "Telepon" kita dari langkah 67

// (A) Fungsi untuk "menelepon" API Login
const login = (identifier, password) => {
  // "Telepon" akan otomatis kirim ke:
  // http://localhost:8080/api + /auth/login
  return api.post('/auth/login', {
    identifier,    // Kirim data email
    password, // Kirim data password
  });
};

// (B) Fungsi untuk "menelepon" API Register
// (Kita buat sekalian, nanti pasti perlu)
const register = (username, email, password, role) => {
  return api.post('/auth/register', {
    username,
    email,
    password,
    role: role,
  });
};

// (C) Fungsi untuk Logout (Hapus Token dari browser)
const logout = () => {
  localStorage.removeItem('prochat-token');
  localStorage.removeItem('prochat-user');
};

// Ekspor semua fungsi layanan ini
const authService = {
  login,
  register,
  logout,
};

export default authService;