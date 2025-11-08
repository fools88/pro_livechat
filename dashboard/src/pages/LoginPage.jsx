// /dashboard/src/pages/LoginPage.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth.service'; // (A) Import "Layanan Telepon"

function LoginPage() {
  // (B) "State" untuk menyimpan ketikan user
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // Untuk pesan error
  const [loading, setLoading] = useState(false); // Biar tombol nggak diklik 2x

  const navigate = useNavigate(); // (C) "Alat Pindah Halaman"

  // (D) Fungsi yang dijalankan saat tombol "Login" diklik
  const handleLogin = async (e) => {
    e.preventDefault(); // Mencegah form me-refresh halaman

    if (loading) return; // Hentikan jika lagi loading

    setError(''); // Hapus error lama
    setLoading(true); // Mulai loading

    try {
      // (E) "Telepon" backend kita (pakai service)
      const response = await authService.login(identifier, password);

      // (F) Jika SUKSES:
      // 1. Simpan "Kunci" (Token) di browser
      localStorage.setItem('prochat-token', response.data.token);
      // 2. Simpan info user di browser
      localStorage.setItem('prochat-user', JSON.stringify(response.data.user));

      // 3. Pindahkan user ke Halaman Dashboard Utama
      navigate('/');

    } catch (err) {
      // (G) Jika GAGAL:
      // Ambil pesan error dari backend
      const errorMsg = err.response?.data?.message || 'Login gagal. Coba lagi.';
      setError(errorMsg);
    } finally {
      setLoading(false); // Berhenti loading
    }
  };

  // (H) Ini adalah tampilan (UI) dari Halaman Login
  return (
    <div style={{ padding: '2rem', maxWidth: '400px', margin: '5rem auto' }}>
      <h2>Login Admin</h2>

      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="identifier">Username atau Email:</label> 
          <input
            type="text"
            id="identifier"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
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

        <button type="submit" disabled={loading}>
          {loading ? 'Loading...' : 'Login'}
        </button>
      </form>
    </div>
  );
}

export default LoginPage;