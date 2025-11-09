// /dashboard/src/pages/DashboardPage.jsx
// (VERSI V22 - WITH WEBSOCKET ENHANCEMENTS: Connection Status, Typing Indicators, Real-time Edit/Delete)

import React, { useState, useEffect, useRef, Suspense } from 'react';
// Use per-function import to avoid pulling the whole date-fns bundle
import format from 'date-fns/format';
const SimpleBar = React.lazy(() => import('simplebar-react'));
// Lazy-load emoji picker to avoid adding it to the initial bundle
const EmojiPicker = React.lazy(() => import('emoji-picker-react'));
import DashboardLayout from '../components/DashboardLayout';
import conversationService from '../services/conversation.service';
import socketService from '../services/socket.service';
import soundService from '../services/sound.service';
import notificationService from '../services/notification.service';
const ConversationList = React.lazy(() => import('../components/ConversationList'));
const VisitorInfoPanel = React.lazy(() => import('../components/VisitorInfoPanel'));
const ToastContainer = React.lazy(() => import('../components/ToastContainer'));
const ConnectionStatus = React.lazy(() => import('../components/ConnectionStatus'));
const TypingIndicator = React.lazy(() => import('../components/TypingIndicator'));
import '../styles/ai-suggestion.css'; // Import AI Suggestion styles
import '../styles/visitor-panel.css'; // Import Visitor Panel styles
import '../styles/responsive.css'; // Import Responsive styles
import '../styles/connection-status.css'; // 🆕 V22
import '../styles/typing-indicator.css'; // 🆕 V22
import '../styles/message-files.css'; // 🆕 V23 - File attachments
import DownloadIcon from '../components/icons/DownloadIcon';
const AiSuggestionPanel = React.lazy(() => import('../components/AiSuggestionPanel'));
const MessageFiles = React.lazy(() => import('../components/MessageFiles'));

// (Fungsi 'formatTimestamp' lama Anda (V6.1) sudah TIDAK DIPERLUKAN di sini)

function DashboardPage() {
  // State (Aman, tidak berubah)
  const [conversations, setConversations] = useState([]);
  const [selectedConvoId, setSelectedConvoId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isAiActive, setIsAiActive] = useState(true);
  const [aiSuggestion, setAiSuggestion] = useState(null); // Single suggestion object
  const [aiSuggestionMeta, setAiSuggestionMeta] = useState(null);
  const [visitorInfo, setVisitorInfo] = useState(null); // ✅ NEW: Visitor details
  const [conversationMeta, setConversationMeta] = useState(null); // ✅ NEW: Conversation metadata
  const [websiteInfo, setWebsiteInfo] = useState(null); // ✅ NEW: Website info
  const [toasts, setToasts] = useState([]); // ✅ NEW V18: Toast notifications
  const [unreadCounts, setUnreadCounts] = useState({}); // 🆕 V19: Track unread count per conversation
  
  // 🆕 V20: New features
  const [replyingTo, setReplyingTo] = useState(null); // Message being replied to
  const [editingMessage, setEditingMessage] = useState(null); // Message being edited
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  
  // 🆕 V22: Connection status indicator
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connected' | 'disconnected' | 'reconnecting' | 'error'
  const [typingUsers, setTypingUsers] = useState({}); // Track who is typing in each conversation
  
  // 🆕 V21: Resizable conversation list
  const [conversationListWidth, setConversationListWidth] = useState(() => {
    const saved = localStorage.getItem('prochat-conversation-list-width');
    return saved ? parseInt(saved) : 320;
  });
  const [isResizing, setIsResizing] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');  
  const user = JSON.parse(localStorage.getItem('prochat-user'));
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const resizeRef = useRef(null);
  const typingTimeoutRef = useRef(null); // 🆕 V22: For typing indicator debounce

  // Load SimpleBar CSS dynamically to avoid pulling it into initial bundle
  useEffect(() => {
    import('simplebar-react/dist/simplebar.min.css').catch(() => {});
  }, []);

  // Toast helper functions
  const addToast = (type, message, duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, type, message, duration }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const selectedConvoIdRef = useRef(selectedConvoId);

  const handleResizeStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
  };

  // 🆕 ESC key handler - Exit chat room
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && selectedConvoId) {
        console.log('[Dashboard] ESC pressed - Closing chat room');
        setSelectedConvoId(null);
        localStorage.removeItem('prochat-last-selected-convo');
        // Clear states
        setMessages([]);
        setMessageInput('');
        setReplyingTo(null);
        setEditingMessage(null);
        setAttachedFiles([]);
        setShowEmojiPicker(false);
        setAiSuggestion(null);
        setVisitorInfo(null);
        addToast('info', 'Chat ditutup');
      }
    };

    document.addEventListener('keydown', handleEscKey);
    
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [selectedConvoId]);

  // --- (B) EFEK KONEKSI UTAMA (Logika V6.1 Anda Aman) ---
  useEffect(() => {
    socketService.connect();

    // 🆕 V22: Listen for connection status changes
    const unsubscribeConnectionStatus = socketService.onConnectionStatusChange((status) => {
      console.log('[Socket] Connection status changed:', status);
      setConnectionStatus(status);
      
      // Show toast notifications on status change
      if (status === 'connected') {
        addToast('success', '🟢 Terhubung ke server', 2000);
      } else if (status === 'disconnected') {
        addToast('error', '🔴 Terputus dari server', 4000);
      } else if (status === 'reconnecting') {
        addToast('info', '🟡 Mencoba menyambung ulang...', 3000);
      } else if (status === 'error') {
        addToast('error', '❌ Kesalahan koneksi', 3000);
      }
    });

    const fetchConversations = async () => {
      setLoading(true);
      try {
        // (PENTING: Ini memanggil backend V3 Anda yang sudah di-sort)
        const res = await conversationService.getConversations(); 
        setConversations(res.data);
        
        // 🆕 V19: Auto-restore last selected conversation after refresh
        const lastSelectedId = localStorage.getItem('prochat-last-selected-convo');
        if (lastSelectedId && res.data.some(c => c.id === lastSelectedId)) {
          console.log('[Dashboard] Auto-selecting conversation:', lastSelectedId);
          setSelectedConvoId(lastSelectedId);
        } else if (lastSelectedId) {
          console.warn('[Dashboard] Last selected conversation not found:', lastSelectedId);
          localStorage.removeItem('prochat-last-selected-convo');
        }
      } catch (err) {
        console.error('[Dashboard] Failed to load conversations:', err);
        setError('Gagal memuat percakapan.');
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();    // Request notification permission
    notificationService.requestPermission().then(granted => {
      if (granted) {
        console.log('[Dashboard] Notification permission granted');
      }
    });

    // 1. Dengarkan 'new_conversation' (Real-time inbox V5)
    socketService.listen('new_conversation', (newConvo) => {
      console.log('[Socket] Chat baru masuk! (real-time)', newConvo);
      
      // 🔊 Play sound untuk conversation baru
      soundService.play('newConversation');
      // 🔔 Show notification
      const visitorId = newConvo.Visitor?.id || 'Unknown';
      notificationService.showNewConversation(visitorId);
      
      // 🆕 Initialize unread count untuk conversation baru (biasanya 1 pesan pertama)
      setUnreadCounts(prev => ({ ...prev, [newConvo.id]: 1 }));
      
      // (Backend sudah 'order', jadi data baru masuk ke atas)
      setConversations(prevConvos => [newConvo, ...prevConvos]);
    });    // 2. Dengarkan 'new_message'
    socketService.listen('new_message', (newMessage) => {
      // 🆕 V23: Debug incoming message
      console.log('[V23 DEBUG] New message received:', newMessage);
      if (newMessage.files && newMessage.files.length > 0) {
        console.log('[V23 DEBUG] Message has files:', newMessage.files);
      }
      
      if (newMessage.conversationId === selectedConvoIdRef.current) {
        setMessages(prevMessages => {
          // ✅ FIX: Append & sort untuk guarantee order yang benar
          const updated = [...prevMessages, newMessage];
          return updated.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        });
        // 🆕 Reset unread count untuk room yang sedang dibuka
        setUnreadCounts(prev => ({ ...prev, [newMessage.conversationId]: 0 }));
      } else {
        // 🆕 Increment unread count untuk room lain
        if (newMessage.senderType === 'visitor') {
          setUnreadCounts(prev => ({
            ...prev,
            [newMessage.conversationId]: (prev[newMessage.conversationId] || 0) + 1
          }));
        }
      }
      
      // 🔊 Play sound dan show notification untuk incoming messages (visitor/admin dari user lain)
      if (newMessage.senderType === 'visitor' || (newMessage.senderType === 'admin' && newMessage.senderId !== user?.id)) {
        // 🎵 Pilih sound berdasarkan context:
        // - messageInRoom: Jika pesan masuk di room yang sedang dibuka (lebih soft)
        // - messageReceived: Jika pesan masuk di room lain (notification sound)
        const soundToPlay = newMessage.conversationId === selectedConvoIdRef.current 
          ? 'messageInRoom'  // 🔔 Pesan masuk di room yang sedang dibuka
          : 'messageReceived'; // 📢 Pesan masuk di room lain (notification)
        
        soundService.play(soundToPlay);
        
        // Show browser notification jika window tidak fokus
        const senderName = newMessage.senderType === 'visitor' ? 'Visitor' : 'Admin';
        notificationService.showNewMessage(senderName, newMessage.content);
      }
      
      // (Logika Real-time sorting V6 Anda - SUDAH BENAR)
      setConversations(prevConvos => {
        const convoToUpdate = prevConvos.find(c => c.id === newMessage.conversationId);
        if (!convoToUpdate) return prevConvos;
        
        convoToUpdate.Messages = [newMessage];
        convoToUpdate.updatedAt = newMessage.createdAt; 

        const otherConvos = prevConvos.filter(c => c.id !== newMessage.conversationId);
        return [convoToUpdate, ...otherConvos];
      });
    });    // 3. Dengarkan 'ai_status_changed' (Aman)
    socketService.listen('ai_status_changed', (data) => {
      if (data.conversationId === selectedConvoIdRef.current) {
        setIsAiActive(data.isAiActive);
      }
      setConversations(prevConvos => 
        prevConvos.map(convo => 
          convo.id === data.conversationId ? { ...convo, isAiActive: data.isAiActive } : convo
        )
      );
    });

    // 🆕 V22: Listen for message updates (edit)
    socketService.listen('message:updated', (data) => {
      const { messageId, content, isEdited, conversationId } = data;
      console.log('[Socket] Message updated:', messageId);      if (conversationId === selectedConvoIdRef.current) {
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === messageId 
              ? { ...msg, content, isEdited: true }
              : msg
          )
        );
        addToast('info', '✏️ Pesan diperbarui', 2000);
      }
    });

    // 🆕 V22: Listen for message deletions
    socketService.listen('message:deleted', (data) => {
      const { messageId, conversationId } = data;
      console.log('[Socket] Message deleted:', messageId);
      
      if (conversationId === selectedConvoIdRef.current) {
        setMessages(prevMessages => 
          prevMessages.filter(msg => msg.id !== messageId)
        );
        addToast('info', '🗑️ Pesan dihapus', 2000);
      }
    });

    // 🆕 V22: Listen for conversation updates
    socketService.listen('conversation:updated', (data) => {
      const { conversationId, status } = data;
      console.log('[Socket] Conversation updated:', conversationId, status);
      
      setConversations(prevConvos => 
        prevConvos.map(convo => 
          convo.id === conversationId 
            ? { ...convo, status }
            : convo
        )
      );
      
      if (conversationId === selectedConvoIdRef.current) {
        setConversationMeta(prev => prev ? { ...prev, status } : null);
        addToast('info', `💬 Status: ${status}`, 2000);
      }
    });

    // 🆕 V22: Listen for typing indicators
    socketService.listen('typing:start', (data) => {
      const { conversationId, userType, userId } = data;
      console.log('[Socket] 🟢 Typing started:', userType, 'userId:', userId, 'in convo', conversationId);
      console.log('[Socket] Current selected conversation:', selectedConvoIdRef.current);
      
      setTypingUsers(prev => {
        const updated = {
          ...prev,
          [conversationId]: { userType, userId, timestamp: Date.now() }
        };
        console.log('[Socket] Updated typingUsers state:', updated);
        return updated;
      });
      
      // Auto-clear typing indicator after 5 seconds (fallback)
      setTimeout(() => {
        setTypingUsers(prev => {
          const current = prev[conversationId];
          if (current && Date.now() - current.timestamp >= 5000) {
            const updated = { ...prev };
            delete updated[conversationId];
            console.log('[Socket] Auto-cleared typing indicator (5s timeout)');
            return updated;
          }
          return prev;
        });
      }, 5000);
    });

    socketService.listen('typing:stop', (data) => {
      const { conversationId } = data;
      console.log('[Socket] 🔴 Typing stopped in convo', conversationId);
      
      setTypingUsers(prev => {
        const updated = { ...prev };
        delete updated[conversationId];
        console.log('[Socket] Cleared typingUsers for convo:', conversationId);
        return updated;
      });
    });

    // 5. Dengarkan saran AI (Agent-Assist)
    socketService.listen('ai_suggestion', (payload) => {
      try {
        if (payload.conversationId === selectedConvoIdRef.current) {
          // Only show if confidence >= 50 (threshold untuk quality)
          if (payload.confidence >= 50) {
            setAiSuggestion({
              text: payload.suggestion,
              confidence: payload.confidence,
              reasoning: payload.reasoning
            });
            setAiSuggestionMeta({ 
              categoryId: payload.categoryId, 
              categoryName: payload.categoryName 
            });
            
            // 🔊 Play sound untuk AI suggestion (DISABLED per user request)
            // soundService.play('aiSuggestion');
            // 🔔 Show notification
            notificationService.showAiSuggestion();
          } else {
            logger.debug('[Dashboard] AI suggestion confidence too low:', payload.confidence);
          }
        }
      } catch (e) {
        console.warn('Gagal memproses ai_suggestion:', e);
      }
    });

    // 4. "Matikan Walkie-talkie" (Aman)
    return () => {
      unsubscribeConnectionStatus(); // 🆕 V22: Cleanup connection status listener
      socketService.disconnect();
    };
  }, []); // <-- Array dependensi KOSONG (Hanya jalan 1x)


  // --- (C) EFEK SAAT MEMBUKA CHAT (Logika V6.1 Anda Aman) ---
  useEffect(() => {
    if (selectedConvoId) {
      const fetchMessages = async () => {
        try {
          const res = await conversationService.getMessages(selectedConvoId);
          
          // ✅ NEW V17: Extract enhanced response with visitor info
          if (res.data.messages) {
            const { messages, visitor, website, conversationMeta } = res.data;
            setVisitorInfo(visitor);
            setWebsiteInfo(website);
            setConversationMeta(conversationMeta);
            
            const sortedMessages = (messages || []).sort((a, b) => {
              return new Date(a.createdAt) - new Date(b.createdAt);
            });
            
            // 🆕 V23: Debug file attachments
            console.log('[DEBUG V23] Messages loaded:', sortedMessages.length);
            sortedMessages.forEach((msg, idx) => {
              if (msg.files && msg.files.length > 0) {
                console.log(`[DEBUG V23] Message ${idx} has ${msg.files.length} files:`, msg.files);
              }
            });
            console.log('[V23 DEBUG] All messages:', sortedMessages);

            // 🆕 V23: If we have a recent uploaded message saved on window (optimistic), merge its files
            try {
              const lastNew = window.__lastNewMessage;
              if (lastNew && lastNew.id) {
                const merged = sortedMessages.map(m => m.id === lastNew.id ? { ...m, files: lastNew.files || [] } : m);
                setMessages(merged);
              } else {
                setMessages(sortedMessages);
              }
            } catch (mergeErr) {
              console.warn('[DEBUG V23] Merge last new message failed:', mergeErr);
              setMessages(sortedMessages);
            }
          }
          setError(''); // Clear error on success
        } catch (err) {
          console.error('[Dashboard] Failed to load messages:', err);
          
          // 🆕 V19: GRACEFUL FALLBACK - Tetap tampilkan chat area meskipun error
          // Cari conversation dari list untuk minimal info
          const selectedConvo = conversations.find(c => c.id === selectedConvoId);
          if (selectedConvo) {
            // Set visitor info dari conversation list
            setVisitorInfo(selectedConvo.Visitor || null);
            setWebsiteInfo(selectedConvo.Website || null);
            setConversationMeta({
              status: selectedConvo.status,
              isAiActive: selectedConvo.isAiActive,
              createdAt: selectedConvo.createdAt,
              updatedAt: selectedConvo.updatedAt
            });
            
            // Jika ada messages di conversation list, gunakan itu
            if (selectedConvo.Messages && selectedConvo.Messages.length > 0) {
              setMessages(selectedConvo.Messages);
            } else {
              setMessages([]);
            }
          } else {
            setMessages([]);
            setVisitorInfo(null);
            setWebsiteInfo(null);
            setConversationMeta(null);
          }
          
          // Show user-friendly error
          addToast('error', 'Gagal memuat riwayat chat. Menampilkan data terbatas.');
          setError('');
        }
      };
      fetchMessages();      const currentConvo = conversations.find(c => c.id === selectedConvoId);
      if (currentConvo) {
        setIsAiActive(currentConvo.isAiActive);
      }

      try {
  if (window.__previousConvoId && window.__previousConvoId !== selectedConvoId) {
    socketService.emit('leave_room', window.__previousConvoId);
  }
} catch (e) {}

// Simpan id convo ini supaya nanti saat ganti kita bisa leave
window.__previousConvoId = selectedConvoId;

// Kirim join_room TAPI pastikan socket sudah CONNECTED.
// Jika belum, tunggu sampai connected lalu kirim sekali.
if (socketService.getConnectionStatus && socketService.getConnectionStatus() === 'connected') {
  socketService.emit('join_room', selectedConvoId);
} else {
  // daftar satu kali listener; saat connected -> kirim join_room lalu hapus listener
  const unsubscribe = socketService.onConnectionStatusChange((status) => {
    if (status === 'connected') {
      socketService.emit('join_room', selectedConvoId);
      // stop listening
      try { unsubscribe(); } catch (e) {}
    }
  });
} 
    }
  }, [selectedConvoId, conversations]);


  // Auto-scroll (Aman)
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

    // Kirim Pesan (Admin) (Aman)
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const content = messageInput.trim();
    if (!content && attachedFiles.length === 0) return;
    
    if (!selectedConvoId || !user) return;

    // If editing
    if (editingMessage) {
      socketService.emit('edit_message', {
        conversationId: selectedConvoId,
        messageId: editingMessage.id,
        content: content
      });
      setEditingMessage(null);
      setMessageInput('');
      addToast('success', 'Pesan diperbarui ✓');
      soundService.play('messageSent');
      return;
    }

    // 🆕 V23: Handle file upload via API
    if (attachedFiles.length > 0) {
      try {
        console.log('[File Upload] Starting upload...', attachedFiles);
        const formData = new FormData();
        formData.append('conversationId', selectedConvoId);
        formData.append('content', content || 'Sent file(s)');
        
        // Append each file
        attachedFiles.forEach((file, index) => {
          console.log(`[File Upload] Adding file ${index}:`, file.name, file.type, file.size);
          formData.append('files', file);
        });

        const token = localStorage.getItem('prochat-token');
        console.log('[File Upload] Sending to /api/files/upload...');
        
        const response = await fetch('http://localhost:8081/api/files/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        console.log('[File Upload] Response status:', response.status);
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Upload failed');
        }

        const result = await response.json();
        console.log('[File Upload] Success:', result);
        
        // 🆕 V23: Debug file attachments
        if (result.files && result.files.length > 0) {
          console.log('[File Upload] Uploaded files:', result.files);
        }

        // 🆕 V23: Optimistically merge uploaded files into current messages state
        try {
          if (result && result.message && result.files) {
            const uploadedMessageId = result.message.id;
            // expose for debugging
            window.__lastNewMessage = { ...result.message, files: result.files };
            setMessages(prev => {
              const idx = prev.findIndex(m => m.id === uploadedMessageId);
              if (idx === -1) return prev; // message not in current list yet
              const copy = [...prev];
              copy[idx] = { ...copy[idx], files: result.files };
              return copy;
            });
          }
        } catch (mergeErr) {
          console.warn('[File Upload] Merge to state failed:', mergeErr);
        }

        // Clear form
        setMessageInput('');
        setReplyingTo(null);
        setAttachedFiles([]);

        // Setelah upload file, refetch pesan agar file langsung muncul di UI
        try {
          const refreshed = await conversationService.getMessages(selectedConvoId);
          if (refreshed?.data && refreshed.data.messages) {
            const msgs = (refreshed.data.messages || []).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            // Merge optimistic upload info if available
            try {
              const lastNew = window.__lastNewMessage;
              if (lastNew && lastNew.id) {
                const merged = msgs.map(m => m.id === lastNew.id ? { ...m, files: lastNew.files || [] } : m);
                setMessages(merged);
              } else {
                setMessages(msgs);
              }
            } catch (mergeErr) {
              console.warn('[File Upload] Merge after refresh failed:', mergeErr);
              setMessages(msgs);
            }
            // Update visitor/website/meta jika ada
            if (refreshed.data.visitor) setVisitorInfo(refreshed.data.visitor);
            if (refreshed.data.website) setWebsiteInfo(refreshed.data.website);
            if (refreshed.data.conversationMeta) setConversationMeta(refreshed.data.conversationMeta);
            // Update preview conversation
            const lastMsg = msgs[msgs.length - 1];
            if (lastMsg) {
              setConversations(prev => prev.map(c => 
                c.id === selectedConvoId
                  ? { ...c, Messages: [lastMsg], updatedAt: lastMsg.createdAt }
                  : c
              ));
            }
          }
          addToast('success', `${result.files.length} file(s) uploaded ✓`);
          soundService.play('messageSent');
        } catch (err) {
          console.error('[File Upload] Refresh error:', err);
          addToast('warning', 'Upload berhasil tetapi gagal refresh pesan');
        }

        return; // Important: return here to prevent socket emit below
      } catch (error) {
        console.error('[File Upload] Error:', error);
        addToast('error', 'Upload gagal: ' + (error.message || error));
        // Stop typing indicator even on error
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        socketService.emit('typing:stop', { conversationId: selectedConvoId });
        return;
      }
    }

    // If sending text message only (no files)
    const payload = {
      conversationId: selectedConvoId,
      senderType: 'admin',
      senderId: user.id,
      content: content,
      replyTo: replyingTo?.id || null
    };
    
    socketService.emit('send_message', payload);
    setMessageInput('');
    setReplyingTo(null);
    soundService.play('messageSent');
    addToast('success', 'Pesan terkirim ✓');
    
    // 🆕 V22: Stop typing indicator when message is sent
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socketService.emit('typing:stop', { conversationId: selectedConvoId });
  };

   // Toggle AI Per-Chat (Aman)
  const handleAiToggle = (e) => {
    const newStatus = e.target.checked;
    setIsAiActive(newStatus);
    socketService.emit('toggle_ai', {
      conversationId: selectedConvoId,
      status: newStatus
    });
    addToast('info', `AI ${newStatus ? 'diaktifkan' : 'dinonaktifkan'} 🤖`);
  };


  // AI Suggestion Handlers
  const handleUseSuggestion = () => {
    if (aiSuggestion && aiSuggestion.text) {
      setMessageInput(aiSuggestion.text);
      setAiSuggestion(null);
      setAiSuggestionMeta(null);
      // soundService.play('aiSuggestion'); // 🔊 Play sound (DISABLED per user request)
      addToast('success', 'Saran AI digunakan ✓'); // ✅ Toast notification
    }
  };  const handleCopySuggestion = async () => {
    if (aiSuggestion && aiSuggestion.text) {
      try {
        await navigator.clipboard.writeText(aiSuggestion.text);
        addToast('success', 'Saran AI disalin ke clipboard 📋'); // ✅ Toast notification
      } catch (err) {
        console.error('Failed to copy:', err);
        addToast('error', 'Gagal menyalin ke clipboard ✕'); // ✅ Toast notification
      }
    }
  };

  const handleDismissSuggestion = () => {
    setAiSuggestion(null);
    setAiSuggestionMeta(null);
    addToast('info', 'Saran AI ditolak'); // ✅ Toast notification
  };

  // 🆕 V20: Reply, Edit, Delete, File, Emoji handlers
  const handleReply = (message) => {
    setReplyingTo(message);
    setShowEmojiPicker(false);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleEdit = (message) => {
    setEditingMessage(message);
    setMessageInput(message.content);
    setReplyingTo(null);
    setShowEmojiPicker(false);
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setMessageInput('');
  };

  const handleCopyMessage = async (content) => {
    try {
      await navigator.clipboard.writeText(content);
      addToast('success', 'Pesan disalin ke clipboard 📋');
    } catch (err) {
      console.error('Failed to copy:', err);
      addToast('error', 'Gagal menyalin pesan ✕');
    }
  };

  const handleDeleteMessage = (messageId) => {
    if (window.confirm('Hapus pesan ini?')) {
      socketService.emit('delete_message', {
        conversationId: selectedConvoId,
        messageId: messageId
      });
      addToast('success', 'Pesan dihapus');
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setAttachedFiles(prev => [...prev, ...files]);
    addToast('info', `${files.length} file ditambahkan`);
  };

  const handleRemoveFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleEmojiClick = (emojiObject) => {
    setMessageInput(prev => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const handleFileAttachClick = () => {
    fileInputRef.current?.click();
  };

  // 🆕 V22: Handle input change with typing indicators
  const handleInputChange = (e) => {
    const value = e.target.value;
    setMessageInput(value);
    
    // Don't emit typing events if no conversation selected
    if (!selectedConvoId) {
      console.log('[Typing] No conversation selected, skipping typing events');
      return;
    }
    
    console.log('[Typing] Emitting typing:start for conversation:', selectedConvoId);
    
    // Emit typing:start
    socketService.emit('typing:start', { conversationId: selectedConvoId });
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Emit typing:stop after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      console.log('[Typing] Emitting typing:stop for conversation:', selectedConvoId);
      socketService.emit('typing:stop', { conversationId: selectedConvoId });
    }, 2000);
  };

  // --- (D) TAMPILAN UI (UPGRADE V20) ---
  return (
    <DashboardLayout>
      {/* 🆕 V22: Connection Status Badge */}
      <Suspense fallback={<div className="connection-loading">Connecting…</div>}>
        <ConnectionStatus status={connectionStatus} />
      </Suspense>
      
      {/* Toast Container */}
      <Suspense fallback={null}>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </Suspense>
      
      <div className="dashboard-chat-container">

        {/* KOLOM KIRI (Daftar Chat) */}
        <div 
          className="conversation-list chat-list-panel"
          style={{ 
            width: `${conversationListWidth}px`,
            minWidth: `${conversationListWidth}px`,
            maxWidth: `${conversationListWidth}px`
          }}
        >
          <h3>Chats ({conversations.length})</h3>
          {loading && <p style={{ padding: '0 15px' }}>Loading...</p>}          {/* --- (BLOK JSX UPGRADE V15.9) --- */}
          {/* (Ini menggantikan .map() V6.1 Anda) */}
          <Suspense fallback={<div style={{ padding: '0 15px' }}>Loading chats…</div>}>
          <ConversationList
            conversations={conversations}
            onSelectConversation={(convoId) => {
              setSelectedConvoId(convoId);
              // 🆕 Save selected conversation to localStorage for persistence after refresh
              localStorage.setItem('prochat-last-selected-convo', convoId);
              // 🆕 Reset unread count saat conversation dibuka
              setUnreadCounts(prev => ({ ...prev, [convoId]: 0 }));
            }}
            selectedConversationId={selectedConvoId}
            unreadCounts={unreadCounts} // 🆕 Pass unread counts to ConversationList
          />
          </Suspense>
          {/* --- (AKHIR BLOK JSX V15.9) --- */}

          {/* 🆕 V21: Resize Handle */}
          <div 
            ref={resizeRef}
            className="conversation-list-resize-handle"
            onMouseDown={handleResizeStart}
            title="Drag untuk resize"
          />
        </div>        {/* KOLOM KANAN (Jendela Chat) */}
        <div className="chat-window-admin" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {!selectedConvoId ? (
            <div style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--prochat-text-secondary)' }}>
            Pilih percakapan dari sisi kiri untuk memulai.
          </div>
          ) : (
            <>
            {/* Visitor Info Panel */}
                <Suspense fallback={<div className="visitor-loading">Loading visitor…</div>}>
                  <VisitorInfoPanel 
                    visitor={visitorInfo} 
                    conversationMeta={conversationMeta} 
                    website={websiteInfo}
                    addToast={addToast}
                  />
                </Suspense>
              {/* (1) Area Pesan (Polished V15.9) */}
              <Suspense fallback={<div className="chat-messages-admin" style={{ maxHeight: '100%', height: '100%' }} /> }>
              <SimpleBar 
                className="chat-messages-admin"
                style={{ maxHeight: '100%', height: '100%' }}
                autoHide={true}
                timeout={1000}
              >
                {messages.map((msg, index) => {
                  const replyToMessage = msg.replyTo ? messages.find(m => m.id === msg.replyTo) : null;
                  const isHovered = hoveredMessageId === msg.id;
                  const canEdit = msg.senderType === 'admin' && msg.senderId === user?.id;
                  const canDelete = msg.senderType === 'admin' && msg.senderId === user?.id;

                  // 🆕 Check if this message should group with previous
                  const prevMsg = index > 0 ? messages[index - 1] : null;
                  const nextMsg = index < messages.length - 1 ? messages[index + 1] : null;
                  
                  const shouldGroupWithPrev = prevMsg && 
                    prevMsg.senderType === msg.senderType && 
                    prevMsg.senderId === msg.senderId;
                  
                  const shouldGroupWithNext = nextMsg && 
                    nextMsg.senderType === msg.senderType && 
                    nextMsg.senderId === msg.senderId;

                  const isFirstInGroup = !shouldGroupWithPrev;
                  const isLastInGroup = !shouldGroupWithNext;

                  return (
                    <div 
                      key={msg.id} 
                      className={`message ${msg.senderType === 'ai' ? 'admin' : msg.senderType} ${
                        shouldGroupWithPrev ? 'grouped' : ''
                      } ${
                        isFirstInGroup ? 'first-in-group' : ''
                      } ${
                        isLastInGroup ? 'last-in-group' : ''
                      }`}
                      onMouseEnter={() => setHoveredMessageId(msg.id)}
                      onMouseLeave={() => setHoveredMessageId(null)}
                    >
                      {/* Action buttons */}
                      {isHovered && (
                        <div className="message-actions">
                          <button 
                            className="message-action-btn"
                            onClick={() => handleReply(msg)}
                            title="Reply"
                          >
                            ↩️
                          </button>
                          <button 
                            className="message-action-btn"
                            onClick={() => handleCopyMessage(msg.content)}
                            title="Copy"
                          >
                            📋
                          </button>
                          {canEdit && (
                            <button 
                              className="message-action-btn"
                              onClick={() => handleEdit(msg)}
                              title="Edit"
                            >
                              ✏️
                            </button>
                          )}
                          {canDelete && (
                            <button 
                              className="message-action-btn delete"
                              onClick={() => handleDeleteMessage(msg.id)}
                              title="Delete"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      )}

                      {/* Show sender name only on first message in group */}
                      {isFirstInGroup && msg.senderType === 'ai' && <strong>🤖 Yaru (AI)</strong>}
                      {isFirstInGroup && msg.senderType === 'admin' && <strong>{user?.username || 'Admin'}</strong>}
                      
                      {/* Reply preview */}
                      {replyToMessage && (
                        <div className="message-reply-preview">
                          <div className="reply-name">
                            {replyToMessage.senderType === 'admin' ? user?.username : 'Visitor'}
                          </div>
                          <div className="reply-text">
                            {replyToMessage.content}
                          </div>
                        </div>
                      )}

                      {/* Content and timestamp in same line */}
                      <div className="message-content-wrapper">
                        <span className="message-text">
                          {/* Jika message ini hanya placeholder 'Sent file(s)' dan ada files, sembunyikan teks */}
                          {!(msg.files && msg.files.length > 0 && msg.content === 'Sent file(s)') ? msg.content : null}
                          {msg.edited && <span className="message-edited"> (edited)</span>}
                        </span>
                        <span className="message-timestamp">
                          {msg.createdAt ? format(new Date(msg.createdAt), 'h:mm a') : '...'}
                        </span>
                      </div>

                      {/* 🆕 V23: File Attachments Display */}
                      {msg.files && msg.files.length > 0 && (
                        <div className="message-files">
                          {msg.files.map(file => (
                            <div key={file.id} className="message-file-doc">
                              <div className="file-left">
                                <span className="file-icon">{file.mimeType && file.mimeType.startsWith('image/') ? '📷' : '📄'}</span>

                                <div className="file-meta">
                                  <div className="file-name" title={file.originalFilename} aria-label={file.originalFilename}>{file.originalFilename}</div>
                                  <div className="file-size">{(file.fileSize / 1024).toFixed(1)} KB</div>
                                </div>
                              </div>

                              <div className="file-row-actions">
                                <button
                                  type="button"
                                  className="file-open-btn"
                                  onClick={() => window.open(`http://localhost:8081/api/files/${file.id}/download`, '_blank', 'noopener')}
                                  title={`Open ${file.originalFilename}`}
                                >
                                  Open
                                </button>

                                <a
                                  href={`http://localhost:8081/api/files/${file.id}/download`}
                                  download
                                  className="file-download-btn"
                                  title={`Download ${file.originalFilename}`}
                                >
                                  <DownloadIcon className="file-download-icon" />
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* 🆕 V22: Typing Indicator */}
                <Suspense fallback={null}>
                  <TypingIndicator 
                    user={typingUsers[selectedConvoId]} 
                    conversationId={selectedConvoId} 
                  />
                </Suspense>

                <div ref={messagesEndRef} />
              </SimpleBar>
              </Suspense>              {/* (2) TOGGLE PER-CHAT (Aman) */}
              <div className="ai-toggle-bar">
                <span style={{ color: isAiActive ? 'var(--prochat-color-success)' : 'var(--prochat-color-danger)' }}>
                  {isAiActive ? 'AI Auto-Reply AKTIF' : 'AI Auto-Reply NONAKTIF'}
                </span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={isAiActive}
                    onChange={handleAiToggle}
                  />
                  <span className="slider round"></span>
                </label>
              </div>

              {/* (3) Area Input Admin dengan AI Suggestion */}
              <form onSubmit={handleSendMessage} className="chat-input-admin">
                {aiSuggestion && (
                  <Suspense fallback={<div className="ai-loading">Loading suggestion…</div>}>
                    <AiSuggestionPanel
                      aiSuggestion={aiSuggestion}
                      aiSuggestionMeta={aiSuggestionMeta}
                      onUse={handleUseSuggestion}
                      onCopy={handleCopySuggestion}
                      onDismiss={handleDismissSuggestion}
                    />
                  </Suspense>
                )}

                {/* Reply Bar */}
                {replyingTo && (
                  <div className="reply-bar">
                    <div className="reply-bar-content">
                      <div className="reply-bar-name">
                        Membalas {replyingTo.senderType === 'admin' ? user?.username : 'Visitor'}
                      </div>
                      <div className="reply-bar-text">
                        {replyingTo.content}
                      </div>
                    </div>
                    <button 
                      type="button" 
                      className="reply-bar-close"
                      onClick={handleCancelReply}
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Edit Bar */}
                {editingMessage && (
                  <div className="reply-bar">
                    <div className="reply-bar-content">
                      <div className="reply-bar-name">
                        ✏️ Mengedit pesan
                      </div>
                    </div>
                    <button 
                      type="button" 
                      className="reply-bar-close"
                      onClick={handleCancelEdit}
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* File Preview */}
                {attachedFiles.length > 0 && (
                  <Suspense fallback={<div className="file-loading">Loading files…</div>}>
                    <MessageFiles files={attachedFiles} isPreview={true} onRemove={handleRemoveFile} />
                  </Suspense>
                )}

                {/* Chat Input Wrapper */}
                <div className="chat-input-wrapper">
                  {/* Action Buttons */}
                  <div className="chat-input-actions">
                    <button
                      type="button"
                      className="chat-action-btn"
                      onClick={handleFileAttachClick}
                      title="Attach file"
                    >
                      📎
                    </button>
                    <div className="emoji-picker-wrapper" ref={emojiPickerRef}>
                      <button
                        type="button"
                        className="chat-action-btn"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        title="Emoji"
                      >
                        😊
                      </button>
                      {showEmojiPicker && (
                        <div className="emoji-picker">
                          <Suspense fallback={<div className="emoji-loading">Loading emoji…</div>}>
                            <EmojiPicker onEmojiClick={handleEmojiClick} />
                          </Suspense>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Text Input */}
                  <textarea
                    className="chat-input-field"
                    value={messageInput}
                    onChange={handleInputChange}
                    placeholder={editingMessage ? "Edit pesan..." : "Ketik pesan..."}
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                  />

                  {/* Send Button */}
                  <button 
                    type="submit"
                    className="chat-send-btn"
                    disabled={!messageInput.trim() && attachedFiles.length === 0}
                    title={editingMessage ? "Update pesan" : "Kirim pesan"}
                  >
                    {editingMessage ? '✓' : '➤'}
                  </button>
                </div>

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                />
              </form>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default DashboardPage;