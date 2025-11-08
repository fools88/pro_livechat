// /dashboard/src/pages/WebsitePage.jsx

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout'; // (A) Import Layout
import websiteService from '../services/website.service'; // (B) Import Service

function WebsitePage() {
  const [websites, setWebsites] = useState([]);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const user = JSON.parse(localStorage.getItem('prochat-user'));

  // Fungsi untuk mengambil data dari backend
  const fetchWebsites = async () => {
    try {
      const response = await websiteService.getAllWebsites();
      setWebsites(response.data);
    } catch (err) {
      setError('Gagal mengambil daftar website.');
    }
  };

  // Ambil data saat halaman pertama kali dibuka
  useEffect(() => {
    fetchWebsites();
  }, []);

  // Fungsi untuk menambah website
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await websiteService.createWebsite(name, url);
      // Refresh daftar
      await fetchWebsites(); 
      setName('');
      setUrl('');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Gagal menambahkan website.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk menghapus website
  const handleDelete = async (websiteId) => {
    if (!window.confirm("Yakin ingin menghapus website ini? Semua percakapan akan hilang!")) return;

    try {
      await websiteService.deleteWebsite(websiteId);
      await fetchWebsites(); // Refresh daftar
    } catch (err) {
      setError('Gagal menghapus website.');
    }
  };

  return (
    <DashboardLayout>
      <h1>🌐 Manajemen Website Game</h1>
      <p>Tambahkan dan kelola semua website game yang akan menggunakan layanan chat ini.</p>

      {/* Tampilkan Error jika ada */}
      {error && <p style={{ color: 'red', padding: '10px', backgroundColor: '#330000', border: '1px solid red', borderRadius: '4px' }}>{error}</p>}

      {/* Form Tambah Website */}
      <div className="card" style={{ marginBottom: '30px' }}>
        <h2>Tambah Website Baru</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="Nama Website (contoh: Situs Game A)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="url"
            placeholder="URL (contoh: http://localhost:8888)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <button type="submit" disabled={loading} style={{ width: '150px' }}>
            {loading ? 'Menambahkan...' : 'Tambah Website'}
          </button>
        </form>
      </div>

      {/* Tabel Daftar Website */}
      <h2>Daftar Website ({websites.length})</h2>
      <table className="website-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#333' }}>
            <th style={{ padding: '10px', textAlign: 'left' }}>Nama</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>URL</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Widget Key (Kunci Chat)</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Admin</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {websites.map((website) => (
            <tr key={website.id} style={{ borderBottom: '1px solid #444' }}>
              <td style={{ padding: '10px' }}>{website.name}</td>
              <td style={{ padding: '10px', color: '#64d8ff' }}>{website.url}</td>
              <td style={{ padding: '10px', fontSize: '0.9rem', color: '#ffc107', fontFamily: 'monospace' }}>
                {website.widgetKey}
              </td>
              <td style={{ padding: '10px' }}>
                {website.Users.map(user => user.username).join(', ') || 'Belum ditugaskan'}
              </td>
              <td style={{ padding: '10px' }}>
                {user.role === 'admin' && (
                  <button 
                    onClick={() => handleDelete(website.id)} 
                    style={{ width: '80px', backgroundColor: '#dc3545' }}
                  >
                    Hapus
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </DashboardLayout>
  );
}

export default WebsitePage;