// /widget/src/main.js
// (VERSI V19 - DENGAN SOUND NOTIFICATIONS)

import { io } from 'socket.io-client';
import soundService from './services/sound.service.js';
import './styles/widget.css';

const BACKEND_URL = window.PRO_CHAT_BACKEND || 'http://localhost:8081';
const WIDGET_KEY = window.PRO_CHAT_KEY || null;

// VARIABEL GLOBAL
let socket;
let conversationId = null;
let displayedMessageIds = new Set(); // Track message IDs yang sudah ditampilkan
let typingTimeoutRef = null; // 🆕 V22: Typing timeout reference

// (D) Fungsi untuk menampilkan pesan di UI
const appendMessage = (senderType, content, messageId = null) => {
  const messagesContainer = document.getElementById('prochat-messages');
  if (!messagesContainer) return;
  
  // Prevent duplikat jika messageId sudah ada
  if (messageId && displayedMessageIds.has(messageId)) {
    return;
  }
  
  if (messageId) {
    displayedMessageIds.add(messageId);
  }

  const msgEl = document.createElement('div');
  msgEl.className = `message ${senderType === 'visitor' ? 'visitor' : 'admin'}`;
  
  // Tambahkan class 'system-error' untuk pesan error non-chat
  if (senderType === 'error') {
    msgEl.className += ' system-error';
  }

  msgEl.textContent = content;

  messagesContainer.appendChild(msgEl);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
};

// --- (E) FUNGSI UTAMA (INIT) ---
const initProChatWidget = () => {

  // 1. Buat UI (Gelembung & Jendela)
  const chatBubble = document.createElement('div');
  chatBubble.id = 'prochat-bubble';
  chatBubble.innerHTML = '💬';
  document.body.appendChild(chatBubble);

  const chatWindow = document.createElement('div');
  chatWindow.id = 'prochat-window';
  chatWindow.innerHTML = `
    <div class="chat-header">Selamat Datang! Ada yang bisa dibantu?</div>
    <div class="chat-messages" id="prochat-messages"></div>
    <div class="typing-indicator" id="prochat-typing-indicator" style="display: none;">
      <span class="typing-text">💬 Agent sedang mengetik</span>
      <span class="typing-dots">
        <span class="dot">.</span>
        <span class="dot">.</span>
        <span class="dot">.</span>
      </span>
    </div>
    <form class="chat-input" id="prochat-form">
      <input type="text" id="prochat-input-field" placeholder="Ketik pesanmu..." />
    </form>
  `;
  document.body.appendChild(chatWindow);

  const chatForm = document.getElementById('prochat-form');
  const chatInput = document.getElementById('prochat-input-field');

  // 🆕 V22: Emit typing events when visitor types
  chatInput.addEventListener('input', () => {
    if (!socket || !conversationId) return;
    
    // Emit typing:start
    socket.emit('typing:start', { conversationId });
    
    // Clear existing timeout
    if (typingTimeoutRef) {
      clearTimeout(typingTimeoutRef);
    }
    
    // Emit typing:stop after 2 seconds of inactivity
    typingTimeoutRef = setTimeout(() => {
      if (socket && conversationId) {
        socket.emit('typing:stop', { conversationId });
      }
    }, 2000);
  });

  // 2. Logika Buka/Tutup Jendela (Trigger Koneksi)
  chatBubble.addEventListener('click', () => {
    chatWindow.style.display = 'flex';
    chatBubble.style.display = 'none';
    soundService.play('widgetOpen'); // 🔊 Play sound saat widget dibuka

    if (!socket) {
      initChatConnection();
    }
  });

  chatWindow.querySelector('.chat-header').addEventListener('click', () => {
     chatWindow.style.display = 'none';
     chatBubble.style.display = 'flex';
  });

  // 3. Logika Kirim Pesan
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const messageText = chatInput.value.trim();
    
    // Minimal 2 karakter untuk mencegah pesan kosong/typo
    if (messageText.length < 2) { 
        appendMessage('error', 'Pesan terlalu pendek. Harap ketik lebih dari 1 karakter.');
        chatInput.value = '';
        return; 
    }

    if (messageText && socket && conversationId) {
      // 🆕 V22: Stop typing indicator when sending message
      if (typingTimeoutRef) {
        clearTimeout(typingTimeoutRef);
      }
      socket.emit('typing:stop', { conversationId });
      
      socket.emit('send_message', {
        content: messageText 
      });

      appendMessage('visitor', messageText);
      soundService.play('messageSent'); // 🔊 Play sound saat kirim pesan
      chatInput.value = '';
    }
  });
};

// --- (F) FUNGSI KONEKSI CHAT ---
const initChatConnection = async () => {
  let visitorFingerprint = localStorage.getItem('prochat_fp');
  if (!visitorFingerprint) {
    visitorFingerprint = 'fp_' + Date.now() + Math.random();
    localStorage.setItem('prochat_fp', visitorFingerprint);
  }

  // Obtain widget token from backend
  try {
    let token = null;
    if (WIDGET_KEY) {
      try {
        const resp = await fetch(`${BACKEND_URL}/api/widget/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ widgetKey: WIDGET_KEY, origin: location.origin })
        });
        if (resp.ok) {
          const body = await resp.json();
          token = body.token;
        } else {
          appendMessage('error', 'Token widget gagal dibuat (akan coba fallback legacy).');
        }
      } catch (e) {
        appendMessage('error', 'Gagal mengambil token widget (akan coba fallback legacy): ' + (e && e.message));
      }
    } else {
      appendMessage('error', 'Widget tidak punya konfigurasi kunci. Hubungi admin.');
    }

    // Setup socket query
    const query = token
      ? { token, fingerprint: visitorFingerprint }
      : (WIDGET_KEY ? { widgetKey: WIDGET_KEY, fingerprint: visitorFingerprint } : { fingerprint: visitorFingerprint });

    socket = io(BACKEND_URL, { query });
  } catch (e) {
    appendMessage('error', 'Gagal menginisialisasi koneksi: ' + (e && e.message));
    return;
  }

  // 1. Sukses Koneksi (Dapat Convo ID)
  socket.on('connection_success', async (data) => {
    conversationId = data.conversationId;
    const visitorKey = data.visitorKey;  // ✅ Terima visitorKey dari server
    
    // PESAN SUKSES KONEKSI
    appendMessage('admin', 'Anda terhubung. Silakan mulai chat.'); 
    
    // 🆕 V19: SKIP LOAD HISTORY - Riwayat chat tidak dimuat setelah refresh untuk privacy
    // User hanya melihat chat baru setelah widget dibuka
    // Uncomment block di bawah jika ingin restore chat history setelah refresh:
    
    /*
    // (V18) Load history dari database - DISABLED untuk privacy
    try {
      const response = await fetch(`${BACKEND_URL}/api/conversations/public/${conversationId}/messages?visitorKey=${encodeURIComponent(visitorKey)}`);
      if (response.ok) {
        const messages = await response.json();
        const sortedMessages = (messages || []).sort((a, b) => {
          return new Date(a.createdAt) - new Date(b.createdAt);
        });
        sortedMessages.forEach(msg => {
          appendMessage(msg.senderType, msg.content, msg.id);
        });
      }
    } catch (error) {
      console.error('[Widget] Gagal load history:', error);
    }
    */
  });
  
  // 2. Terima Pesan Baru (Dari Admin/AI)
  socket.on('new_message', (message) => {
    // Kita hanya append jika pesan datang dari admin/AI, dengan messageId untuk prevent duplikat
    if (message.senderType !== 'visitor') {
        appendMessage(message.senderType, message.content, message.id);
        soundService.play('messageReceived'); // 🔊 Play sound saat terima pesan
    }
  });
  
  // 🆕 V22: Listen for typing indicators
  socket.on('typing:start', (data) => {
    const { userType } = data;
    console.log('[Widget] Admin is typing');
    const typingIndicator = document.getElementById('prochat-typing-indicator');
    if (typingIndicator && userType === 'admin') {
      typingIndicator.style.display = 'flex';
    }
  });

  socket.on('typing:stop', (data) => {
    console.log('[Widget] Admin stopped typing');
    const typingIndicator = document.getElementById('prochat-typing-indicator');
    if (typingIndicator) {
      typingIndicator.style.display = 'none';
    }
  });
  
  // 3. Error Handling
  socket.on('message_error', (message) => {
    appendMessage('error', `Gagal kirim pesan: ${message}. Coba lagi.`);
  });

  socket.on('connect_error', (err) => {
    appendMessage('error', 'Gagal terhubung ke server chat.');
  });

  socket.on('connection_error', (message) => {
    appendMessage('error', `Error: ${message}`);
  });
};

// --- (G) "NYALAKAN" WIDGET-NYA ---
initProChatWidget();
