# 🐛 Typing Indicator Debug Guide

## Issue: Typing Indicator tidak muncul

### ✅ **Test 2 Requirements:**
1. **Tab 1** dan **Tab 2** harus login sebagai **user yang berbeda** (2 admin, atau 1 admin + 1 visitor)
2. **Kedua tab** harus membuka **conversation yang SAMA**
3. Ketika Tab 1 ketik, Tab 2 akan lihat typing indicator

---

## 🔍 **Debug Steps:**

### **Step 1: Verify Socket Connection**
Open **Browser DevTools** (F12) → **Console**

Cek log ini muncul:
```
[Socket] Connection status changed: connected
[Socket] Joined room: <conversationId>
```

### **Step 2: Verify Room Join**
Kedua tab harus join conversation yang sama:

**Tab 1:**
1. Buka conversation "ABC" (misalnya conversationId = 123)
2. Console harus show: `[Socket] Joined room: 123`

**Tab 2:**
1. Buka conversation "ABC" yang sama (conversationId = 123)
2. Console harus show: `[Socket] Joined room: 123`

⚠️ **Kalau conversation berbeda, typing indicator GAK AKAN muncul!**

### **Step 3: Test Typing Event**
**Tab 1 (Ketik):**
1. Open Console
2. Mulai ketik di message input
3. Cek console log: `[Socket] Typing started in convo 123`

**Tab 2 (Melihat):**
1. Open Console
2. Harusnya muncul log: `[Socket] Typing started: admin in convo 123`
3. UI harusnya muncul: **"💬 Agent sedang mengetik..."**

### **Step 4: Check Network Tab**
**Tab 1:**
1. F12 → Network Tab
2. Filter: **WS** (WebSocket)
3. Click on WebSocket connection
4. Go to **Messages** tab
5. Ketik di message input
6. Harusnya muncul outgoing message: `{"type":"typing:start","data":{"conversationId":"123"}}`

**Tab 2:**
1. F12 → Network → WS → Messages
2. Harusnya muncul incoming message: `{"type":"typing:start","data":{"conversationId":"123","userType":"admin","userId":1}}`

---

## 🧪 **Quick Test Checklist:**

```
Tab 1:
- [ ] Login berhasil
- [ ] Socket connected (console log: "connected")
- [ ] Buka conversation X (console log: "Joined room: X")
- [ ] Ketik di input (console log: "Typing started")
- [ ] WS Messages: outgoing "typing:start"

Tab 2:
- [ ] Login berhasil (user berbeda dari Tab 1)
- [ ] Socket connected
- [ ] Buka conversation X YANG SAMA (console log: "Joined room: X")
- [ ] Console log: "Typing started: admin in convo X"
- [ ] WS Messages: incoming "typing:start"
- [ ] UI: Typing indicator muncul ✅
```

---

## 🐛 **Common Issues:**

### Issue 1: Kedua tab beda conversation
**Symptom:** Typing indicator tidak muncul  
**Fix:** Pastikan kedua tab pilih conversation yang **SAMA**

### Issue 2: Tab 2 belum join room
**Symptom:** Console Tab 2 tidak ada log "Typing started"  
**Fix:** Refresh Tab 2 → Pilih conversation lagi

### Issue 3: Socket tidak connected
**Symptom:** Badge merah "Terputus"  
**Fix:** Check server running (port 8081), refresh dashboard

### Issue 4: Typing terlalu cepat
**Symptom:** Indicator muncul lalu langsung hilang  
**Fix:** Normal! Indicator hilang setelah 2 detik stop ketik (by design)

### Issue 5: Login sebagai user yang sama
**Symptom:** Typing indicator tidak muncul  
**Fix:** Backend filter event dengan `socket.to()` jadi sender tidak lihat typing sendiri. Gunakan 2 user berbeda.

---

## 📸 **Screenshot Checklist:**

Kalau masih tidak work, screenshot ini:

1. **Tab 1 Console** - Full logs
2. **Tab 2 Console** - Full logs
3. **Tab 1 Network → WS → Messages** - Outgoing typing:start
4. **Tab 2 Network → WS → Messages** - Incoming typing:start
5. **Tab 1 URL** - Pastikan conversation ID sama
6. **Tab 2 URL** - Pastikan conversation ID sama

---

## 🎯 **Expected Behavior:**

**Correct Flow:**
1. Tab 1 (Admin A) mulai ketik
2. Backend terima `typing:start` dari Admin A
3. Backend broadcast ke semua di room **KECUALI** Admin A
4. Tab 2 (Admin B) terima event `typing:start`
5. Tab 2 update state `typingUsers`
6. TypingIndicator component render: "Agent sedang mengetik..."
7. Setelah 2 detik, Tab 1 emit `typing:stop`
8. Tab 2 terima `typing:stop` → Indicator hilang

**Timeline:**
```
0.0s: Tab 1 ketik "H"
0.0s: Tab 1 emit typing:start
0.05s: Tab 2 terima typing:start
0.05s: Tab 2 show indicator ✅
2.0s: Tab 1 emit typing:stop
2.05s: Tab 2 terima typing:stop
2.05s: Tab 2 hide indicator
```

---

## 🔧 **Manual Test:**

Try this exact flow:

1. **Tab 1:** Login sebagai `admin@test.com`
2. **Tab 2:** Incognito → Login sebagai `admin2@test.com` (atau buat admin baru)
3. **Tab 1:** Pilih conversation pertama di list (catat ID-nya di console)
4. **Tab 2:** Pilih conversation yang sama (ID harus cocok!)
5. **Tab 1:** Ketik "test" di message input (jangan send)
6. **Tab 2:** Lihat di atas message input box

Expected: **"💬 Agent sedang mengetik..."** dengan animated dots

---

## 💡 **Alternative Test (Lebih Mudah):**

Pakai **2 browser berbeda**:
- **Chrome Tab 1:** Admin login
- **Firefox/Edge:** Admin lain login
- Lebih gampang track console logs terpisah

---

**Ready to debug?** Follow step-by-step dan report hasilnya! 🚀
