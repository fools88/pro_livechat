// /dashboard/src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

// Satpam ini menerima komponen yang ingin dijaga (children)
const ProtectedRoute = ({ children }) => {
  // (A) Cek Token di browser
  const token = localStorage.getItem('prochat-token');
  const location = useLocation(); // Untuk tahu user mau ke halaman mana

  // (B) JIKA TIDAK ADA TOKEN:
  if (!token) {
    // Paksa user pindah ke halaman /login
    // 'replace: true' agar user tidak bisa kembali (back) ke halaman yang dilarang
    // state: { from: location } untuk menyimpan alamat tujuan user
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // (C) JIKA ADA TOKEN:
  // Izinkan request lanjut (tampilkan komponennya)
  return children;
};

export default ProtectedRoute;