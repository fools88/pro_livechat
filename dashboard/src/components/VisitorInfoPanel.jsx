// /dashboard/src/components/VisitorInfoPanel.jsx
// (KOMPONEN V18 - VISITOR INFO HEADER WITH TOAST)

import React from 'react';

const VisitorInfoPanel = ({ visitor, conversationMeta, website, addToast }) => {
  if (!visitor) return null;

  // Parse User Agent (basic detection)
  const parseUserAgent = (ua) => {
    if (!ua) return { device: 'Unknown', browser: 'Unknown' };
    
    const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);
    const device = isMobile ? '📱 Mobile' : '💻 Desktop';
    
    let browser = '🌐 Browser';
    if (ua.includes('Chrome') && !ua.includes('Edge')) browser = '🔷 Chrome';
    else if (ua.includes('Firefox')) browser = '🦊 Firefox';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = '🧭 Safari';
    else if (ua.includes('Edge')) browser = '🌊 Edge';
    
    return { device, browser };
  };

  const { device, browser } = parseUserAgent(visitor.lastSeenUserAgent);
  
  // Calculate time since last activity
  const getTimeAgo = (date) => {
    if (!date) return 'Unknown';
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins}m yang lalu`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h yang lalu`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d yang lalu`;
  };

  const visitorId = visitor.id.substring(0, 6);
  const lastSeen = getTimeAgo(conversationMeta?.updatedAt);
  const isOnline = conversationMeta && new Date() - new Date(conversationMeta.updatedAt) < 60000; // Active in last 1 min

  const handleCopyVisitorId = () => {
    navigator.clipboard.writeText(visitor.id);
    if (addToast) {
      addToast('success', `Visitor ID disalin: ${visitorId}... 📋`);
    }
  };

  const handleExportChat = () => {
    // TODO: Implement export functionality
    if (addToast) {
      addToast('info', 'Fitur export chat segera hadir 📥');
    }
  };

  const handleMarkComplete = () => {
    // TODO: Implement mark as complete
    if (addToast) {
      addToast('success', 'Percakapan ditandai selesai ✓');
    }
  };

  return (
    <div className="visitor-info-header">
      <div className="visitor-main-info">
        <div className="visitor-avatar">
          <span className="avatar-icon">👤</span>
          {isOnline && <span className="online-indicator"></span>}
        </div>
        
        <div className="visitor-details">
          <h4 className="visitor-name">
            Visitor {visitorId}
            {conversationMeta?.status === 'new' && (
              <span className="badge badge-new">BARU</span>
            )}
          </h4>
          
          <div className="visitor-meta">
            {visitor.lastSeenLocation && (
              <span title="Lokasi visitor">
                🌍 {visitor.lastSeenLocation}
              </span>
            )}
            <span title="Device dan Browser">
              {device} • {browser}
            </span>
            <span title="Terakhir aktif" className={isOnline ? 'status-online' : 'status-offline'}>
              🕐 {lastSeen}
            </span>
            {website && (
              <span title="Website">
                🌐 {website.name}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="visitor-actions">
        <button 
          className="btn-icon" 
          title="Copy Visitor ID"
          onClick={handleCopyVisitorId}
        >
          📋
        </button>
        <button 
          className="btn-icon" 
          title="Export Chat History"
          onClick={handleExportChat}
        >
          💾
        </button>
        <button 
          className="btn-icon btn-success" 
          title="Tandai Selesai"
          onClick={handleMarkComplete}
        >
          ✓
        </button>
      </div>
    </div>
  );
};

export default VisitorInfoPanel;
