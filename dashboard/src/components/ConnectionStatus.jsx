// /dashboard/src/components/ConnectionStatus.jsx
// 🆕 V22: WebSocket Connection Status Indicator

import React from 'react';
import '../styles/connection-status.css';

/**
 * Connection Status Badge Component
 * Shows real-time WebSocket connection status
 * 
 * @param {Object} props
 * @param {string} props.status - 'connected' | 'disconnected' | 'reconnecting' | 'error' | 'connecting'
 */
function ConnectionStatus({ status = 'connecting' }) {
  // Status configurations
  const statusConfig = {
    connected: {
      icon: '🟢',
      label: 'Terhubung',
      className: 'status-connected'
    },
    disconnected: {
      icon: '🔴',
      label: 'Terputus',
      className: 'status-disconnected'
    },
    reconnecting: {
      icon: '🟡',
      label: 'Menyambung...',
      className: 'status-reconnecting'
    },
    connecting: {
      icon: '🟡',
      label: 'Menghubungkan...',
      className: 'status-connecting'
    },
    error: {
      icon: '❌',
      label: 'Error',
      className: 'status-error'
    }
  };

  const currentStatus = statusConfig[status] || statusConfig.connecting;

  return (
    <div className={`connection-status-badge ${currentStatus.className}`}>
      <span className="status-icon">{currentStatus.icon}</span>
      <span className="status-label">{currentStatus.label}</span>
    </div>
  );
}

export default ConnectionStatus;
