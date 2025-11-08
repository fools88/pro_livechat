// /dashboard/src/pages/TeamPage.jsx
// (Versi V2 - Profesional)

import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import userService from '../services/user.service'; // (A) Ambil SEMUA user
import websiteService from '../services/website.service'; // (B) Ambil SEMUA website
import authService from '../services/auth.service'; // (C) Untuk undang agent
import teamService from '../services/team.service'; // (D) Untuk TUGASKAN agent

function TeamPage() {
  // Data utama
  const [allWebsites, setAllWebsites] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  // State untuk error & loading
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State untuk form agent baru
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');

  // State untuk form penugasan
  const [selectedAgentId, setSelectedAgentId] = useState('');

  // (E) Fungsi untuk mengambil SEMUA data dari backend
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Ambil daftar website (yang sudah ada info user ter-assign)
      const websiteRes = await websiteService.getAllWebsites();
      setAllWebsites(websiteRes.data);

      // 2. Ambil daftar SEMUA user
      const userRes = await userService.getAllUsers();
      setAllUsers(userRes.data);

    } catch (err) {
      setError('Gagal mengambil data. Cek koneksi backend.');
    } finally {
      setLoading(false);
    }
  };

  // Ambil data saat halaman pertama kali dibuka
  useEffect(() => {
    fetchData();
  }, []);

  // (F) Fungsi untuk mendaftarkan agent baru
  const handleRegisterAgent = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFormError('');
    try {
      await authService.register(username, email, password, 'agent');
      await fetchData(); // Refresh semua data
      setUsername(''); setEmail(''); setPassword('');
    } catch (err) {
      setFormError(err.response?.data?.message || 'Gagal menambahkan agent.');
    } finally {
      setLoading(false);
    }
  };

  // (G) Fungsi untuk MENUGASKAN agent
  const handleAssignAgent = async (websiteId) => {
    if (!selectedAgentId) return; // Jika belum pilih agent

    try {
      await teamService.assignAgentToWebsite(selectedAgentId, websiteId);
      await fetchData(); // Refresh semua data
      setSelectedAgentId(''); // Reset dropdown
    } catch (err) {
      setFormError(err.response?.data?.message || 'Gagal menugaskan agent.');
    }
  };

  // (H) Fungsi untuk MENGHAPUS TUGAS agent
  const handleRemoveAgent = async (userId, websiteId) => {
    if (!window.confirm("Yakin ingin menghapus TUGAS agent ini dari website?")) return;

    try {
      await teamService.removeAgentFromWebsite(userId, websiteId);
      await fetchData(); // Refresh semua data
    } catch (err) {
      setFormError('Gagal menghapus tugas agent.');
    }
  };

  // (I) Logika untuk mencari agent yang "Belum Ditugaskan"
  // (useMemo = performa lebih cepat)
  const unassignedAgents = useMemo(() => {
    // Ambil semua agent (role 'agent')
    const allAgents = allUsers.filter(u => u.role === 'agent');

    // Cari ID agent yang sudah ditugaskan di *salah satu* website
    const assignedAgentIds = new Set();
    allWebsites.forEach(ws => {
      ws.Users.forEach(user => assignedAgentIds.add(user.id));
    });

    // return allAgents.filter(agent => !assignedAgentIds.has(agent.id));
    // (V1: Tampilkan semua agent saja biar gampang)
    return allAgents;
  }, [allUsers, allWebsites]);


  // --- (J) TAMPILAN UI V2 ---
  return (
    <DashboardLayout>
      <h1>👥 Manajemen Tim & Penugasan</h1>
      <p>Undang Staf CS (Agent) dan tugaskan mereka ke website yang sesuai.</p>

      {error && <p className="error-box">{error}</p>}

      {/* Form Tambah Agent Baru (Masih sama) */}
      <div className="card" style={{ marginBottom: '30px' }}>
        <h2>1. Undang Agent Baru</h2>
        <form onSubmit={handleRegisterAgent} style={{ display: 'flex', gap: '10px' }}>
          <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
          <input type="email" placeholder="Email Agent" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password Awal" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit" disabled={loading} style={{ width: '150px' }}>
            {loading ? '...' : 'Undang Agent'}
          </button>
        </form>
        {formError && <p style={{ color: 'red', marginTop: '10px' }}>{formError}</p>}
      </div>

      {/* Daftar Penugasan per Website (BARU) */}
      <h2>2. Penugasan Website</h2>

      {loading && <p>Loading data website dan agent...</p>}

      <div className="website-assignment-list" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {allWebsites.map(website => (
          <div className="card" key={website.id}>
            <h3 style={{ marginTop: 0 }}>{website.name}</h3>

            {/* Daftar agent yang SUDAH ditugaskan */}
            <strong>Agent Ditugaskan:</strong>
            <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
              {website.Users.length === 0 && <li style={{ fontSize: '0.9rem', color: '#888' }}>(Belum ada)</li>}
              {website.Users.map(user => (
                <li key={user.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0' }}>
                  {user.username} ({user.role})
                  <button onClick={() => handleRemoveAgent(user.id, website.id)} style={{ width: '80px', backgroundColor: '#dc3545', fontSize: '0.8rem' }}>
                    Hapus Tugas
                  </button>
                </li>
              ))}
            </ul>

            <hr style={{ border: '1px solid #444' }}/>

            {/* Form untuk MENUGASKAN agent baru */}
            <strong>Tugaskan Agent Baru:</strong>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <select 
                style={{ width: '100%', padding: '10px' }}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                value={selectedAgentId}
              >
                <option value="">-- Pilih Agent --</option>
                {/* Tampilkan SEMUA agent (kecuali yg sudah di-assign ke web INI) */}
                {allUsers
                  .filter(u => u.role === 'agent' && !website.Users.some(assigned => assigned.id === u.id))
                  .map(agent => (
                    <option key={agent.id} value={agent.id}>{agent.username}</option>
                  ))
                }
              </select>
              <button onClick={() => handleAssignAgent(website.id)} style={{ width: '100px' }}>
                Tugaskan
              </button>
            </div>
          </div>
        ))}
      </div>

    </DashboardLayout>
  );
}

export default TeamPage;