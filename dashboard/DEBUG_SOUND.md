# 🔍 DEBUG SOUND & NOTIFICATION - QUICK GUIDE

## ⚡ **QUICK FIX - JALANKAN DI BROWSER CONSOLE (F12)**

### **1. Cek Status Notification Permission:**
```javascript
console.log('Notification Permission:', Notification.permission);
console.log('Notification Supported:', 'Notification' in window);
```

**Expected:** 
- `granted` (bisa show notification)
- `denied` (user block)  
- `default` (belum diminta permission)

---

### **2. Request Permission Manual:**
```javascript
Notification.requestPermission().then(permission => {
  console.log('Permission result:', permission);
  if (permission === 'granted') {
    new Notification('Test Notification', { body: 'This works!' });
  }
});
```

---

### **3. Cek LocalStorage Settings:**
```javascript
console.log('Sound Muted:', localStorage.getItem('prochat-sound-muted'));
console.log('Sound Volume:', localStorage.getItem('prochat-sound-volume'));
console.log('Notifications Enabled:', localStorage.getItem('prochat-notifications-enabled'));
```

**Expected:**
- `prochat-sound-muted`: `'false'` atau `null`
- `prochat-sound-volume`: `'0.5'` atau `null`
- `prochat-notifications-enabled`: `'true'`

---

### **4. Force Enable Sound (jika ter-mute):**
```javascript
localStorage.setItem('prochat-sound-muted', 'false');
localStorage.setItem('prochat-sound-volume', '0.8');
location.reload(); // Refresh halaman
```

---

### **5. Test Sound Manual:**
```javascript
// Import soundService (pastikan di DashboardPage)
import soundService from './services/sound.service.js';

// Test each sound
soundService.play('messageSent');      // Pop sound
soundService.play('messageReceived');  // Ding sound
soundService.play('newConversation');  // Alert sound
soundService.play('aiSuggestion');     // Soft notification
```

**Jika tidak ada suara:**
- Browser mungkin block autoplay
- Butuh **user interaction** dulu (klik button/link)

---

### **6. Test Browser Notification Manual:**
```javascript
// Cek apakah window focus
console.log('Window has focus:', document.hasFocus());

// Test notification (minimize window dulu!)
setTimeout(() => {
  if (Notification.permission === 'granted') {
    new Notification('Test dari Console', {
      body: 'Ini test notification',
      icon: '/favicon.ico'
    });
  }
}, 3000); // 3 detik untuk minimize window
```

---

## 🐛 **COMMON ISSUES & FIXES**

### **Issue 1: "Notification Permission: denied"**
**Fix:**
1. Klik **ikon gembok** di address bar
2. Pilih **Site Settings**
3. Cari **Notifications** → Set ke **Allow**
4. Refresh halaman

---

### **Issue 2: "Sound tidak keluar sama sekali"**
**Fix:**
1. Cek speaker/headphone nyala
2. Cek browser tab tidak di-mute (klik kanan tab → Unmute)
3. Cek localStorage: `localStorage.getItem('prochat-sound-muted')`
4. Force enable:
   ```javascript
   localStorage.setItem('prochat-sound-muted', 'false');
   location.reload();
   ```
5. Klik sesuatu dulu di halaman (browser autoplay policy)

---

### **Issue 3: "Browser notification tidak muncul"**
**Possible Reasons:**
- ❌ Window masih fokus (notification hanya muncul jika unfocused)
- ❌ Permission denied
- ❌ localStorage disabled: `prochat-notifications-enabled = 'false'`

**Fix:**
```javascript
// Force enable
localStorage.setItem('prochat-notifications-enabled', 'true');

// Test dengan minimize window
setTimeout(() => {
  new Notification('Test', { body: 'Should appear!' });
}, 3000); // Minimize dalam 3 detik
```

---

### **Issue 4: "Sound play failed: NotAllowedError"**
**Reason:** Browser autoplay policy block audio sebelum user interaction

**Fix:**
1. Klik **anywhere** di halaman dulu
2. Atau tambahkan button "Enable Sound" di UI
3. Atau play sound SETELAH user action (klik send button)

---

## 🔧 **FORCE RESET ALL SETTINGS**

```javascript
// Clear all ProChat localStorage
localStorage.removeItem('prochat-sound-muted');
localStorage.removeItem('prochat-sound-volume');
localStorage.removeItem('prochat-notifications-enabled');

// Reload
location.reload();
```

---

## 📋 **CHECKLIST DEBUG**

Isi checklist ini untuk troubleshoot:

- [ ] `Notification.permission` = **granted** ?
- [ ] `prochat-sound-muted` = **false** atau **null** ?
- [ ] `prochat-notifications-enabled` = **true** ?
- [ ] Browser tab **tidak di-mute** ?
- [ ] Speaker/headphone **nyala** ?
- [ ] Sudah **klik sesuatu** di halaman (autoplay policy) ?
- [ ] Window **unfocused** saat test notification ?

---

## 🎯 **EXPECTED BEHAVIOR**

### **Saat Window FOKUS:**
- ✅ Sound tetap keluar
- ✅ Toast notification muncul
- ❌ Browser notification TIDAK muncul (by design)

### **Saat Window UNFOCUSED (minimize/tab lain):**
- ✅ Sound tetap keluar
- ✅ Browser notification muncul
- ✅ Toast tidak terlihat (karena window tidak fokus)

---

**Silakan test dengan checklist di atas dan report hasilnya!** 🚀
