// /dashboard/src/pages/AnalyticsPage.jsx
// (File BARU V12)

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import analyticsService from '../services/analytics.service';

// (Komponen kecil untuk 1 Kartu Laporan)
const StatCard = ({ title, value, icon }) => (
  <div className="stat-card">
    <div className="stat-icon">{icon}</div>
    <div className="stat-info">
      <span className="stat-value">{value}</span>
      <span className="stat-title">{title}</span>
    </div>
  </div>
);

function AnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // (Ambil data saat halaman dibuka)
    const fetchStats = async () => {
      try {
        const res = await analyticsService.getStats();
        setStats(res.data);
      } catch (err) {
        setError('Gagal memuat data statistik.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <DashboardLayout>
      <h1>📊 Analytics</h1>
      <p>Laporan performa Live Chat dan AI Anda.</p>

      {loading && <p>Memuat statistik...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {stats && (
        <div className="stat-card-grid">
          {/* (Ini dia 4 Kartu Laporan kita) */}
          <StatCard 
            title="Total Percakapan"
            value={stats.totalConversations}
            icon="💬"
          />
          <StatCard 
            title="Total Pesan (Semua)"
            value={stats.totalMessages}
            icon="✉️"
          />
          <StatCard 
            title="Dibalas oleh AI"
            value={stats.aiMessages}
            icon="🤖"
          />
          <StatCard 
            title="Dibalas oleh Admin"
            value={stats.adminMessages}
            icon="👤"
          />
        </div>
      )}

      {/* (Nanti di V13 kita tambahkan Grafik (Charts) di sini) */}

    </DashboardLayout>
  );
}

export default AnalyticsPage;