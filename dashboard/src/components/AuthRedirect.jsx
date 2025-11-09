// /dashboard/src/components/AuthRedirect.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

// Komponen ini mencegah user yang sudah login melihat halaman Auth
const AuthRedirect = ({ children }) => {
  const token = localStorage.getItem('prochat-token');

  // JIKA ADA TOKEN:
  if (token) {
    // Pindahkan user ke halaman utama (Dashboard)
    return <Navigate to="/" replace />;
  }

  // JIKA TIDAK ADA TOKEN:
  // Izinkan lanjut ke halaman Login/Register
  return children;
};

export default AuthRedirect;