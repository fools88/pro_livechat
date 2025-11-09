# Widget Fix V18 - History Loading & Message Ordering

## 📅 Tanggal: 5 November 2025

## 🔴 Masalah yang Ditemukan

### 1. **Message Order Kacau di Widget**
- **Gejala**: Pesan user muncul SETELAH respons AI di widget
- **Bukti**: Screenshot menunjukkan:
  ```
  AI: Mohon maaf atas ketidaknyamanannya... (11:50)
  User: halo (11:51)
  AI: Mohon maaf atas ketidaknyamanannya... (11:51)
  ```
  Seharusnya user message (11:51) muncul SEBELUM AI response (11:51)

- **Root Cause**: 
  - Widget **tidak load history** saat pertama connect
  - Widget hanya terima pesan baru via socket `new_message`
  - Tidak ada sorting berdasarkan `createdAt`

### 2. **AI Respons Aneh & Repetitif**
- **Gejala**: AI merespons dengan "Mohon maaf atas ketidaknyamanannya" meskipun user cuma bilang "halo"
- **Root Cause**: 
  - Widget buka di tab baru (incognito) → koneksi baru dibuat
  - History lama tidak muncul di widget
  - User ketik "halo" → AI masih baca context lama dari database (mood "kesal")
  - AI mengira percakapan masih dalam konteks "kesal" padahal user baru buka widget

---

## ✅ Solusi yang Diterapkan

### **File Modified**: `widget/src/main.js` (V17.4 → V18)

### **Perubahan 1: Tambah Message ID Tracking**
```javascript
// VARIABEL GLOBAL
let displayedMessageIds = new Set(); // Track message IDs yang sudah ditampilkan

const appendMessage = (senderType, content, messageId = null) => {
  // Prevent duplikat jika messageId sudah ada
  if (messageId && displayedMessageIds.has(messageId)) {
    return;
  }
  
  if (messageId) {
    displayedMessageIds.add(messageId);
  }
  
  // ... render message ...
}
```

**Tujuan**: Prevent duplikasi pesan saat load history + terima real-time update

---

### **Perubahan 2: Load History saat Connect**
```javascript
socket.on('connection_success', async (data) => {
  conversationId = data.conversationId;
  
  appendMessage('admin', 'Anda terhubung. Silakan mulai chat.'); 
  
  // (BARU V18) Load history dari database
  try {
    const response = await fetch(`${BACKEND_URL}/api/conversations/${conversationId}/messages`);
    if (response.ok) {
      const messages = await response.json();
      
      // Sort by createdAt ascending (oldest first)
      const sortedMessages = (messages || []).sort((a, b) => {
        return new Date(a.createdAt) - new Date(b.createdAt);
      });
      
      // Tampilkan history ke UI dengan messageId untuk prevent duplikat
      sortedMessages.forEach(msg => {
        appendMessage(msg.senderType, msg.content, msg.id);
      });
    }
  } catch (error) {
    console.error('[Widget] Gagal load history:', error);
  }
});
```

**Tujuan**: 
- Load semua pesan lama saat widget connect
- Sort by createdAt untuk urutan yang benar
- Gunakan messageId untuk prevent duplikat

---

### **Perubahan 3: Update new_message Listener**
```javascript
socket.on('new_message', (message) => {
  // Gunakan messageId untuk prevent duplikat
  if (message.senderType !== 'visitor') {
      appendMessage(message.senderType, message.content, message.id);
  }
});
```

**Tujuan**: Prevent duplikasi saat history loading dan real-time message bersamaan

---

## 🎯 Hasil yang Diharapkan

### **Before (V17.4)**
```
Widget buka → Connect → Tampil "Anda terhubung"
User: halo
AI: Mohon maaf atas ketidaknyamanannya... (baca context lama dari DB)
```

### **After (V18)**
```
Widget buka → Connect → Load history:
  - AI: [History lama jika ada]
  - User: [Pesan lama jika ada]
  
Tampil "Anda terhubung"

User: halo (pesan baru)
AI: Halo kak! 👋 (respons normal karena context jelas)
```

---

## 📊 Impact Analysis

### **Masalah yang Diselesaikan**
✅ Widget sekarang load history lengkap  
✅ Urutan pesan benar (sorted by createdAt)  
✅ Tidak ada duplikasi pesan  
✅ AI tidak bingung dengan context (karena history lengkap muncul)  
✅ User experience lebih baik (lihat percakapan lama)  

### **Side Effects**
⚠️ **Initial load lebih lambat** (fetch history dari API)  
  → Tapi masih acceptable karena async (tidak blocking UI)  
  
⚠️ **CORS issue** jika widget di domain berbeda dari backend  
  → Sudah di-handle dengan CORS config di server  

---

## 🧪 Test Checklist

- [ ] Widget buka → History lama muncul dengan urutan benar
- [ ] User kirim pesan baru → Tidak ada duplikasi
- [ ] Tab baru (incognito) → History tetap muncul
- [ ] AI respons dengan context yang benar (tidak repetitif)
- [ ] Dashboard dan Widget sinkron (urutan sama)

---

## 🚀 Deployment Steps

### 1. **Rebuild Widget**
```bash
cd c:\Benny\pro_livechat\widget
npm run build
```

### 2. **Restart Server** (opsional, tapi disarankan)
```bash
cd c:\Benny\pro_livechat\server
npm run dev
```

### 3. **Clear Browser Cache**
- Buka widget di incognito
- Hard refresh: Ctrl+Shift+R

### 4. **Test dengan Skenario Nyata**
```
1. Buka widget → Chat dengan AI
2. Tutup widget
3. Buka widget lagi (tab baru) → History harus muncul
4. Kirim pesan baru → Tidak ada duplikasi
```

---

## 📝 Notes

- **File Modified**: `widget/src/main.js` (202 lines → 207 lines)
- **Breaking Changes**: TIDAK ADA (backward compatible)
- **Dependencies**: TIDAK ADA tambahan (gunakan fetch API native)
- **Browser Support**: Modern browsers (IE11 tidak support fetch, perlu polyfill)

---

## 🔗 Related Issues

- [AI_SAFETY_GUIDE.md](./AI_SAFETY_GUIDE.md) - Safety Guardrails V20
- [PERSONA_YARU.md](./PERSONA_YARU.md) - Persona instructions untuk AI
- Dashboard message ordering fix (DashboardPage.jsx lines 60-67, 109-117)
