// /dashboard/src/pages/SettingsPage.jsx
// (File BARU V11)

import React from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useTheme } from '../contexts/ThemeContext';
import authService from '../services/auth.service';
import { useNavigate } from 'react-router-dom';

function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <DashboardLayout>
      <h1>⚙️ Pengaturan</h1>

      {/* Kotak Dark Mode */}
      <div className="card">
        <h2>Tampilan</h2>
        <div className="setting-item">
          <span className="nav-icon">{theme === 'light' ? '🌞' : '🌙'}</span>
          <span className="nav-text">{theme === 'light' ? 'Light Mode' : 'Dark Mode'}</span>
          <label className="switch">
            <input
              type="checkbox"
              onChange={toggleTheme}
              checked={theme === 'dark'}
            />
            <span className="slider round"></span>
          </label>
        </div>
      </div>

      {/* Kotak Logout */}
      <div className="card">
        <h2>Akun</h2>
        <div className="setting-item">
          <span className="nav-icon">🚪</span>
          <span className="nav-text">Keluar dari akun Anda</span>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>

    </DashboardLayout>
  );
}

export default SettingsPage;