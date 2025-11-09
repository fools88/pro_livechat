# 🧪 MANUAL TESTING GUIDE - ProChat V19
## Sound & Notification System Testing

---

## 📋 **PRE-TESTING CHECKLIST**

### **Persiapan:**
1. ✅ Buka 2 browser berbeda (Chrome & Firefox) atau 2 browser window (normal + incognito)
2. ✅ Pastikan speaker/headphone nyala
3. ✅ Pastikan browser notification permission ALLOWED
4. ✅ Server backend sudah running (`npm start` di folder `/server`)
5. ✅ Dashboard sudah running (`npm run dev` di folder `/dashboard`)
6. ✅ Widget sudah built (`npm run build` di folder `/widget`)

### **Setup Testing:**
- **Browser 1 (Admin):** Buka `http://localhost:5173` (Dashboard)
- **Browser 2 (Visitor):** Buka halaman dengan widget embedded

---

## 🎵 **TEST SCENARIOS - DASHBOARD (Admin Side)**

### **Test 1: Sound Notifications** 🔊

#### **1.1 Message Sent Sound**
- [ ] Login ke dashboard
- [ ] Pilih conversation
- [ ] Ketik pesan & klik Send
- [ ] **EXPECTED:** Suara "pop" terdengar
- [ ] **EXPECTED:** Toast "Pesan terkirim ✓" muncul

#### **1.2 Message Received Sound (dari Visitor)**
- [ ] Dashboard tetap terbuka & FOKUS
- [ ] Dari browser visitor, kirim pesan
- [ ] **EXPECTED:** Suara "ding" terdengar di dashboard
- [ ] **EXPECTED:** Pesan muncul di chat window
- [ ] **EXPECTED:** Browser notification TIDAK muncul (karena window fokus)

#### **1.3 Message Received + Browser Notification**
- [ ] Dashboard tetap terbuka tapi MINIMIZE atau SWITCH TAB
- [ ] Dari browser visitor, kirim pesan lagi
- [ ] **EXPECTED:** Suara "ding" terdengar
- [ ] **EXPECTED:** Browser notification "Pesan Baru 💬" muncul
- [ ] **EXPECTED:** Klik notification → window dashboard fokus

#### **1.4 New Conversation Sound**
- [ ] Dashboard terbuka
- [ ] Dari browser visitor BARU (clear localStorage atau incognito baru), buka widget
- [ ] Visitor kirim pesan pertama
- [ ] **EXPECTED:** Suara "alert" terdengar
- [ ] **EXPECTED:** Browser notification "Percakapan Baru 🆕" muncul
- [ ] **EXPECTED:** Conversation baru muncul di conversation list

#### **1.5 AI Suggestion Sound**
- [ ] Dashboard terbuka, pilih conversation
- [ ] Pastikan AI toggle ON (hijau)
- [ ] Dari visitor, kirim pesan yang trigger AI (misal: "Halo, berapa harga?")
- [ ] **EXPECTED:** Suara "soft notification" terdengar
- [ ] **EXPECTED:** AI suggestion box muncul dengan saran
- [ ] Klik "Use" di suggestion box
- [ ] **EXPECTED:** Suara "soft notification" terdengar lagi
- [ ] **EXPECTED:** Toast "Saran AI digunakan ✓" muncul

---

### **Test 2: Toast Notifications** 📢

#### **2.1 Send Message Toast**
- [ ] Kirim pesan
- [ ] **EXPECTED:** Toast hijau "Pesan terkirim ✓" muncul di kanan atas
- [ ] **EXPECTED:** Auto-dismiss setelah 3 detik
- [ ] **EXPECTED:** Bisa di-close manual dengan klik ✕

#### **2.2 Toggle AI Toast**
- [ ] Klik toggle AI untuk OFF
- [ ] **EXPECTED:** Toast biru "AI dinonaktifkan 🤖" muncul
- [ ] Klik toggle AI untuk ON
- [ ] **EXPECTED:** Toast biru "AI diaktifkan 🤖" muncul

#### **2.3 AI Suggestion Toast**
- [ ] Klik "Use" di AI suggestion
- [ ] **EXPECTED:** Toast hijau "Saran AI digunakan ✓" muncul
- [ ] Klik "Copy" di AI suggestion
- [ ] **EXPECTED:** Toast hijau "Saran AI disalin ke clipboard 📋" muncul
- [ ] Klik "✕" (dismiss) di AI suggestion
- [ ] **EXPECTED:** Toast biru "Saran AI ditolak" muncul

#### **2.4 Visitor Actions Toast**
- [ ] Klik button "Copy ID" (📋) di Visitor Info Panel
- [ ] **EXPECTED:** Toast hijau "Visitor ID disalin: abc123... 📋" muncul
- [ ] Klik button "Export" (💾)
- [ ] **EXPECTED:** Toast biru "Fitur export chat segera hadir 📥" muncul
- [ ] Klik button "Mark Complete" (✓)
- [ ] **EXPECTED:** Toast hijau "Percakapan ditandai selesai ✓" muncul

#### **2.5 Multiple Toasts Stacking**
- [ ] Kirim pesan (toast 1)
- [ ] Cepat toggle AI (toast 2)
- [ ] Cepat copy visitor ID (toast 3)
- [ ] **EXPECTED:** 3 toast stack di kanan atas, tidak overlap
- [ ] **EXPECTED:** Auto-dismiss satu per satu

---

### **Test 3: Search & Filter** 🔍

#### **3.1 Search by Visitor ID**
- [ ] Buka dashboard dengan minimal 3 conversations
- [ ] Ketik 6 karakter pertama dari visitor ID di search bar
- [ ] **EXPECTED:** Hanya conversation dengan visitor ID matching yang muncul
- [ ] Clear search
- [ ] **EXPECTED:** Semua conversation muncul lagi

#### **3.2 Search by Message Content**
- [ ] Ketik kata yang ada di message (misal: "harga")
- [ ] **EXPECTED:** Hanya conversation yang mengandung kata tersebut yang muncul
- [ ] **EXPECTED:** Empty state "Tidak ada hasil pencarian" jika tidak ada match

#### **3.3 Filter Tabs**
- [ ] Klik tab "Baru"
- [ ] **EXPECTED:** Hanya conversation dengan status NEW yang muncul
- [ ] **EXPECTED:** Badge counter menampilkan jumlah yang benar
- [ ] Klik tab "Aktif"
- [ ] **EXPECTED:** Hanya conversation dengan status ACTIVE yang muncul
- [ ] Klik tab "Selesai"
- [ ] **EXPECTED:** Hanya conversation dengan status RESOLVED yang muncul
- [ ] Klik tab "Semua"
- [ ] **EXPECTED:** Semua conversation muncul

---

### **Test 4: Visitor Info Panel** 👤

#### **4.1 Visitor Details Display**
- [ ] Pilih conversation
- [ ] **EXPECTED:** Visitor Info Panel muncul di atas chat area
- [ ] **EXPECTED:** Visitor ID (6 chars) ditampilkan
- [ ] **EXPECTED:** Location (jika ada) ditampilkan dengan emoji 📍
- [ ] **EXPECTED:** Device icon (📱 atau 💻) ditampilkan
- [ ] **EXPECTED:** Browser icon (🔷 Chrome, 🦊 Firefox, dll) ditampilkan
- [ ] **EXPECTED:** Last seen time ("Baru saja", "5m yang lalu") ditampilkan

#### **4.2 Online Indicator**
- [ ] Dari visitor browser, kirim pesan
- [ ] Dalam 1 menit, cek dashboard
- [ ] **EXPECTED:** Green dot berkedip di avatar visitor
- [ ] **EXPECTED:** Status "Baru saja" ditampilkan
- [ ] Tunggu > 1 menit tanpa activity
- [ ] **EXPECTED:** Green dot hilang

#### **4.3 Status Badge**
- [ ] **EXPECTED:** Badge "BARU" (kuning) untuk new conversation
- [ ] **EXPECTED:** Badge "AKTIF" (biru) untuk active conversation
- [ ] **EXPECTED:** Badge "SELESAI" (hijau) untuk resolved conversation

---

## 📱 **TEST SCENARIOS - WIDGET (Visitor Side)**

### **Test 5: Widget Sound Notifications** 🔊

#### **5.1 Widget Open Sound**
- [ ] Buka halaman dengan widget
- [ ] Klik chat bubble (💬)
- [ ] **EXPECTED:** Suara "whoosh" terdengar
- [ ] **EXPECTED:** Widget window terbuka

#### **5.2 Message Sent Sound**
- [ ] Widget terbuka
- [ ] Ketik pesan & klik Send
- [ ] **EXPECTED:** Suara "pop" terdengar
- [ ] **EXPECTED:** Pesan muncul di chat window

#### **5.3 Message Received Sound**
- [ ] Widget tetap terbuka
- [ ] Dari dashboard admin, kirim pesan
- [ ] **EXPECTED:** Suara "chime" terdengar
- [ ] **EXPECTED:** Pesan dari admin muncul

---

## 🛠️ **ADVANCED TESTING**

### **Test 6: LocalStorage Persistence**

#### **6.1 Sound Mute**
- [ ] Buka console browser (F12)
- [ ] Run: `localStorage.setItem('prochat-sound-muted', 'true')`
- [ ] Refresh halaman
- [ ] Kirim pesan
- [ ] **EXPECTED:** Tidak ada suara terdengar
- [ ] Run: `localStorage.setItem('prochat-sound-muted', 'false')`
- [ ] Kirim pesan lagi
- [ ] **EXPECTED:** Suara terdengar

#### **6.2 Notification Disable**
- [ ] Run: `localStorage.setItem('prochat-notifications-enabled', 'false')`
- [ ] Minimize dashboard
- [ ] Dari visitor, kirim pesan
- [ ] **EXPECTED:** Suara terdengar tapi notification TIDAK muncul

---

## ⚠️ **ERROR SCENARIOS**

### **Test 7: Edge Cases**

#### **7.1 Browser Notification Permission Denied**
- [ ] Block notification permission di browser settings
- [ ] Refresh dashboard
- [ ] Minimize dashboard & terima pesan
- [ ] **EXPECTED:** Suara tetap terdengar
- [ ] **EXPECTED:** Notification tidak muncul (karena blocked)
- [ ] **EXPECTED:** Tidak ada error di console

#### **7.2 No Sound Support**
- [ ] Disable audio di browser (mute tab)
- [ ] Kirim pesan
- [ ] **EXPECTED:** Tidak ada error
- [ ] **EXPECTED:** Toast tetap muncul
- [ ] **EXPECTED:** Console warning: "Sound play failed"

#### **7.3 Multiple Rapid Actions**
- [ ] Kirim 5 pesan dalam 2 detik
- [ ] **EXPECTED:** 5 suara overlap (clone sound)
- [ ] **EXPECTED:** 5 toast stack dengan rapi
- [ ] **EXPECTED:** Tidak ada crash/freeze

---

## ✅ **SUCCESS CRITERIA**

### **Dashboard:**
- ✅ Semua 8 jenis toast muncul dengan benar
- ✅ Semua 4 sound type terdengar dengan jelas
- ✅ Browser notification muncul hanya jika window tidak fokus
- ✅ Search & filter berfungsi real-time
- ✅ Visitor info panel menampilkan data lengkap
- ✅ Online indicator update real-time

### **Widget:**
- ✅ Semua 3 sound type terdengar
- ✅ Message send/receive lancar
- ✅ No console errors

### **Performance:**
- ✅ Tidak ada memory leak (check di Chrome DevTools)
- ✅ Sound latency < 200ms
- ✅ Toast animation smooth (60fps)
- ✅ Search filter instant (< 100ms)

---

## 🐛 **BUG REPORTING FORMAT**

Jika menemukan bug, report dengan format:
```
**Bug:** [Deskripsi singkat]
**Steps to Reproduce:**
1. ...
2. ...
**Expected:** ...
**Actual:** ...
**Browser:** Chrome/Firefox/Safari
**Console Error:** [paste error jika ada]
```

---

## 📊 **TESTING RESULTS**

| Feature | Status | Notes |
|---------|--------|-------|
| Toast Notifications | ⬜ | |
| Sound - Dashboard | ⬜ | |
| Sound - Widget | ⬜ | |
| Browser Notifications | ⬜ | |
| Search & Filter | ⬜ | |
| Visitor Info Panel | ⬜ | |
| LocalStorage Persistence | ⬜ | |

**Legend:** ✅ Pass | ❌ Fail | ⚠️ Partial | ⬜ Not Tested

---

**Happy Testing! 🧪🎵🔔**
