import React from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';
import { useTheme } from '../contexts/ThemeContext';

export default function DashboardHeader() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('prochat-user'));
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <header className="main-header">
      <div className="header-title">
        <h3>Pro Chat Admin</h3>
      </div>
      <div className="header-user">
        Halo, {user?.username} ({user?.role})
        <button type="button" onClick={handleLogout} className="logout-btn" title="Logout">Logout</button>
      </div>
    </header>
  );
}
