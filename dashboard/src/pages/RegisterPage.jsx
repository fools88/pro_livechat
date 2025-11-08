// /dashboard/src/pages/RegisterPage.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth.service'; // (A) Import "Layanan Telepon"

function RegisterPage() {
  // (B) State untuk menyimpan ketikan user (3 field)
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(''); // (C) Untuk pesan sukses
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate(); // "Alat Pindah Halaman"

  // (D) Fungsi yang dijalankan saat tombol "Register" diklik
  const handleRegister = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // (E) "Telepon" backend kita (pakai service register)
      // Kita akan set "role: 'admin'" secara manual
      // Ini adalah user 'super admin' pertama kita
      await authService.register(username, email, password, 'admin');

      // (F) Jika SUKSES:
      setSuccess('Registrasi berhasil! Mengarahkan ke halaman login...');

      // Tunggu 2 detik, lalu pindahkan user ke Halaman Login
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err) {
      // (G) Jika GAGAL:
      const errorMsg = err.response?.data?.message || 'Registrasi gagal. Coba lagi.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // (H) Ini adalah tampilan (UI) dari Halaman Registrasi
  return (
    <div style={{ padding: '2rem', maxWidth: '400px', margin: '5rem auto' }}>
      <h2>Buat Akun Super Admin</h2>

      <form onSubmit={handleRegister}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {/* Tampilkan pesan error jika ada */}
        {error && <p style={{ color: '#ff8080' }}>{error}</p>}

        {/* Tampilkan pesan sukses jika ada */}
        {success && <p style={{ color: '#80ff80' }}>{success}</p>}

        <button type="submit" disabled={loading || success}>
          {loading ? 'Loading...' : 'Register'}
        </button>
      </form>
    </div>
  );
}

export default RegisterPage;