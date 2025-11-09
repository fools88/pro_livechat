// /dashboard/src/components/ConversationList.jsx
// (KOMPONEN V18 - DENGAN SEARCH & FILTER)

import React, { useState, useMemo, useEffect, Suspense } from 'react';
const SimpleBar = React.lazy(() => import('simplebar-react'));
import '../styles/conversation-search.css';

// --- (FUNGSI HELPER V16: TIMESTAMP PROFESIONAL) ---
function formatChatTimestamp(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();

  // 1. Cek: Apakah chatnya HARI INI?
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    // YA: Tampilkan 8:25 PM (Sesuai permintaan AM/PM Anda)
    return date.toLocaleString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  }

  // 2. Cek: Apakah chatnya KEMARIN?
  const yesterday = new Date(); // Buat 'now' baru agar tidak termutasi
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    // YA: Tampilkan "Kemarin" (Sesuai screenshot Anda)
    return 'Kemarin';
  }
  
  // 3. JIKA BUKAN KEDUANYA (misal: 27 Oktober):
  // YA: Tampilkan 27/10/2025 (Sesuai permintaan baru Anda)
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// --- (KOMPONEN V18: DAFTAR CHAT DENGAN SEARCH & FILTER) ---
function ConversationList({ 
  conversations, 
  onSelectConversation, 
  selectedConversationId,
  unreadCounts = {} // 🆕 V19: Receive unread counts from parent
}) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter conversations by search query only
  const filteredConversations = useMemo(() => {
    let filtered = conversations;

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(convo => {
        // Search by visitor ID
        const visitorId = convo.Visitor?.id || '';
        if (visitorId.toLowerCase().includes(query)) return true;

        // Search by message content
        const hasMatchingMessage = convo.Messages?.some(msg => 
          msg.content.toLowerCase().includes(query)
        );
        if (hasMatchingMessage) return true;

        return false;
      });
    }

    return filtered;
  }, [conversations, searchQuery]);

  
  if (!conversations || conversations.length === 0) {
    return <div className="chat-list-empty">Belum ada percakapan.</div>;
  }

  // Backend sudah mengurutkan (order: 'updatedAt' DESC),
  // jadi kita tidak perlu sorting di sini.

  useEffect(() => {
    // Load SimpleBar CSS dynamically when this component mounts
    import('simplebar-react/dist/simplebar.min.css').catch(() => {});
  }, []);

  return (
    <div className="conversation-list-container">
      {/* Search Bar */}
      <div className="search-bar-container">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Cari percakapan..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Conversation List */}
      <Suspense fallback={<div className="conversations-scroll" style={{ maxHeight: '100%', height: '100%' }} /> }>
      <SimpleBar 
        className="conversations-scroll"
        style={{ maxHeight: '100%', height: '100%' }}
        autoHide={true}
        timeout={1000}
      >
        {filteredConversations.length === 0 ? (
          <div className="chat-list-empty" style={{ padding: '20px', textAlign: 'center', color: 'var(--prochat-text-secondary)' }}>
            {searchQuery ? 'Tidak ada hasil pencarian.' : 'Tidak ada percakapan.'}
          </div>
        ) : (
          filteredConversations.map(convo => {
        const visitorName = (convo.Visitor && convo.Visitor.id)
          ? `Visitor ${convo.Visitor.id.substring(0, 6)}` 
          : 'Visitor';
        
        const lastMessage = (convo.Messages && convo.Messages.length > 0) 
          ? convo.Messages[0]
          : null;
        
        const lastMessageContent = lastMessage 
          ? `${lastMessage.senderType === 'visitor' ? '' : (lastMessage.senderType === 'ai' ? 'AI: ' : 'Admin: ')}${lastMessage.content}`
          : '(Belum ada pesan)';

        const isActive = convo.id === selectedConversationId;
        
        // 🆕 Determine if conversation has unread indicator
        const isUnread = convo.status === 'new' || 
                        (lastMessage && lastMessage.senderType === 'visitor' && 
                         new Date() - new Date(convo.updatedAt) < 5 * 60 * 1000); // < 5 min
        
        // 🆕 Get real-time unread count from parent state
        const unreadCount = unreadCounts[convo.id] || 0;

        return (
          <div 
            key={convo.id} 
            className={`chat-list-item ${isActive ? 'active' : ''} ${isUnread && !isActive ? 'unread' : ''}`}
            onClick={() => onSelectConversation(convo.id)} // Panggil fungsi dari props
          >
            {/* --- BARIS 1 (NAMA & WAKTU V19) --- */}
            <div className="convo-header">
              <span className="visitor-name">
                {isUnread && !isActive && <span className="unread-dot">●</span>}
                {visitorName}
              </span>
              <div className="convo-header-right">
                {/* 🆕 Unread Badge Counter - di kiri jam */}
                {unreadCount > 0 && (
                  <span className="unread-badge">{unreadCount}</span>
                )}
                <span className="convo-timestamp">
                  {formatChatTimestamp(convo.updatedAt)}
                </span>
              </div>
            </div>

            {/* --- BARIS 2 (PESAN & STATUS AI V19) --- */}
            <div className="convo-row-2">
              <span className={`last-message ${isUnread && !isActive ? 'unread-text' : ''}`}>
                {lastMessageContent.substring(0, 30)}
                {lastMessageContent.length > 30 ? '...' : ''}
              </span>

              {/* --- BADGE STATUS AI V16 --- */}
              {convo.isAiActive ? (
                <span className="ai-status active">AI AKTIF</span>
              ) : (
                <span className="ai-status inactive">AI NONAKTIF</span>
              )}
            </div>
          </div>
        );
      })
        )}
      </SimpleBar>
      </Suspense>
    </div>
  );
}

export default ConversationList;

