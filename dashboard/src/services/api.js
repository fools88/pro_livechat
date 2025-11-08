// /dashboard/src/services/api.js

import axios from 'axios';

// (A) Alamat "Pintu Depan" Backend kita
// Gunakan VITE_API_URL jika tersedia; default ke 8081 agar sesuai server lokal
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8081';
const API_URL = `${BASE.replace(/\/$/, '')}/api`; // pastikan ada '/api'

// (B) Buat "Telepon" (Axios instance)
const api = axios.create({
  baseURL: API_URL, // Set alamat default
});

/*
 (C) "Satpam" di sisi Frontend (Interceptor)

 Ini adalah "Satpam" canggih. 
 Setiap kali "telepon" kita (axios) mau MENGIRIM request,
 satpam ini akan "mengecek" dulu: "Apa aku punya 'Token' (kunci) di local storage?"

 Jika YA, satpam ini akan "menempelkan" token itu ke request
 sebelum dikirim ke backend.

 (Ini SANGAT penting agar backend tahu kita sudah login)
*/
api.interceptors.request.use(
  (config) => {
    // 1. Ambil token dari 'local storage' (penyimpanan browser)
    const token = localStorage.getItem('prochat-token');

    if (token) {
      // 2. Jika ada, tempelkan ke header 'Authorization'
      // (Backend kita di 'auth.jwt.js' akan mencari ini)
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config; // Lanjutkan request
  },
  (error) => {
    // Jika error, tolak request
    return Promise.reject(error);
  }
);

// (D) Ekspor "telepon" kita
export default api;