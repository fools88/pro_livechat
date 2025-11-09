import React from 'react';
import { NavLink } from 'react-router-dom';

export default function DashboardSidebar() {
  const user = JSON.parse(localStorage.getItem('prochat-user'));

  return (
    <div className="sidebar collapsed">
      <div className="sidebar-header" title="Pro Chat Admin">
         <span className="nav-icon" style={{fontSize: '24px'}}>🚀</span>
      </div>

      <p className="user-info" title={`Halo, ${user?.username} (${user?.role})`}>
        <span className="nav-icon" style={{fontSize: '10px'}}>●</span>
      </p>

      <NavLink 
        to="/"
        className={({ isActive }) => "nav-item " + (isActive ? "active" : "")}
        end
        title="Chats"
      >
        <span className="nav-icon">💬</span>
      </NavLink>

      {(user?.role === 'admin' || user?.role === 'agent') && (
         <NavLink 
          to="/settings/ai"
          className={({ isActive }) => "nav-item " + (isActive ? "active" : "")}
          title="AI Engine"
        >
          <span className="nav-icon">🤖</span>
        </NavLink>
      )}

      {user?.role === 'admin' && (
        <>
          <NavLink 
            to="/settings/websites"
            className={({ isActive }) => "nav-item " + (isActive ? "active" : "")}
            title="Websites"
          >
            <span className="nav-icon">🌐</span>
          </NavLink>

          <NavLink 
            to="/settings/team"
            className={({ isActive }) => "nav-item " + (isActive ? "active" : "")}
            title="Team"
          >
            <span className="nav-icon">👥</span>
          </NavLink>

          <NavLink 
            to="/analytics"
            className={({ isActive }) => "nav-item " + (isActive ? "active" : "")}
            title="Analytics"
          >
            <span className="nav-icon">📊</span>
          </NavLink>
        </>
      )}

      <div className="sidebar-footer">
        <NavLink to="/settings" className={({ isActive }) => "nav-item " + (isActive ? "active" : "")} title="Settings">
          <span className="nav-icon">⚙️</span>
        </NavLink>
      </div>
    </div>
  );
}
