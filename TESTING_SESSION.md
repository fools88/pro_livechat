# 🧪 WebSocket UI Testing Session

**Date:** November 6, 2025  
**Status:** ✅ Both services running  
**Tester:** You (Boss)

---

## ✅ **Pre-Test Checklist**

- [x] Backend server running on port 8081
- [x] Dashboard running on port 5173
- [ ] Browser ready (Chrome/Edge recommended)
- [ ] 2 tabs/windows prepared

---

## 🎯 **Test Plan (15 minutes)**

### **Test 1: Connection Status Badge** (2 min)

**Steps:**
1. Open: http://localhost:5173
2. Login dengan akun admin kamu
3. Lihat pojok kanan atas

**Expected Result:**
```
Awal: 🟡 Menghubungkan...
Lalu: 🟢 Terhubung

✅ Toast notification muncul: "🟢 Terhubung ke server"
✅ Badge warna hijau dengan gradient
✅ Position: fixed top-right corner
```

**Screenshot Location:**
- Badge harus visible di pojok kanan atas dashboard

---

### **Test 2: Typing Indicators** (5 min)

**Setup:**
1. Open Tab 1: Login sebagai Admin 1
2. Open Tab 2: Login sebagai Admin 2 (atau incognito mode)
3. Kedua tab buka conversation yang sama

**Steps:**
1. Tab 1: Pilih conversation
2. Tab 2: Pilih conversation yang sama
3. Tab 1: Mulai ketik di message input (jangan send)
4. Tab 2: Perhatikan area di atas message input

**Expected Result:**
```
Tab 2 harus muncul:
┌─────────────────────────────┐
│ 💬 Agent sedang mengetik    │
│    . . .                    │  ← Animated dots
└─────────────────────────────┘

✅ Muncul dalam <50ms setelah mulai ketik
✅ Dots beranimasi (naik-turun bergantian)
✅ Hilang otomatis setelah 2 detik berhenti ketik
✅ Hilang langsung setelah send message
```

**Test Variations:**
- [ ] Ketik lalu tunggu 2 detik → Indicator hilang
- [ ] Ketik lalu send → Indicator langsung hilang
- [ ] Ketik lalu delete semua → Indicator tetap muncul (expected)

---

### **Test 3: Message Edit Real-time** (3 min)

**Setup:**
- Tab 1 & Tab 2 viewing same conversation

**Steps:**
1. Tab 1: Send message "Hello World"
2. Tab 2: Verify message appears
3. Tab 1: Hover message → Click "✏️ Edit" button
4. Tab 1: Change to "Hello Universe"
5. Tab 1: Save edit
6. Tab 2: Watch for real-time update

**Expected Result:**
```
Tab 1:
✅ Message updated to "Hello Universe" with ✏️ badge
✅ Toast: "✏️ Pesan diperbarui"
✅ Sound plays (messageSent)

Tab 2:
✅ Message auto-updates to "Hello Universe" (NO REFRESH!)
✅ ✏️ edited badge appears
✅ Toast: "✏️ Pesan diperbarui"
✅ Update happens in <100ms
```

**Failure Cases:**
- ❌ Tab 2 doesn't update → Check socket connection
- ❌ Update takes >1 second → Network issue
- ❌ No toast notification → Check addToast function

---

### **Test 4: Message Delete Real-time** (3 min)

**Setup:**
- Tab 1 & Tab 2 viewing same conversation

**Steps:**
1. Tab 1: Send message "Delete me"
2. Tab 2: Verify message appears
3. Tab 1: Hover message → Click "🗑️ Delete" button
4. Tab 1: Confirm deletion
5. Tab 2: Watch for real-time removal

**Expected Result:**
```
Tab 1:
✅ Message disappears immediately
✅ Toast: "🗑️ Pesan dihapus"
✅ Confirm dialog appears before delete

Tab 2:
✅ Message auto-removes (NO REFRESH!)
✅ Toast: "🗑️ Pesan dihapus"
✅ Removal happens in <100ms
✅ Smooth fade-out animation (if implemented)
```

---

### **Test 5: Network Disconnect** (2 min)

**Steps:**
1. Dashboard terbuka dan connected
2. Turn off WiFi / Unplug ethernet
3. Wait 2-3 seconds
4. Observe connection badge

**Expected Result:**
```
Step 1: 🟢 Terhubung
Step 2: Network off
Step 3: 🔴 Terputus (with shake animation)
        Toast: "🔴 Terputus dari server"

Step 4: Turn network back on
Step 5: 🟡 Menyambung... (with pulse animation)
        Toast: "🟡 Mencoba menyambung ulang..."

Step 6: 🟢 Terhubung (reconnected!)
        Toast: "🟢 Terhubung ke server"
```

**Animations to observe:**
- 🔴 Disconnected: Shake animation (left-right wobble)
- 🟡 Reconnecting: Pulse animation (scale + opacity)
- 🟢 Connected: Smooth transition

---

### **Test 6: Multiple Users Typing** (Optional - 2 min)

**Setup:**
- 3 browser tabs if possible

**Steps:**
1. Tab 1, 2, 3: All viewing same conversation
2. Tab 1: Start typing
3. Tab 2 & 3: Should see typing indicator

**Expected Result:**
```
✅ All tabs except the typer see indicator
✅ Indicator updates independently for each typer
✅ No conflicts between multiple typers
```

---

## 📊 **Test Results Template**

Fill this out as you test:

```
✅ Test 1: Connection Status Badge
   - Badge visible: [ ]
   - Color changes: [ ]
   - Toast notifications: [ ]
   - Position correct: [ ]

✅ Test 2: Typing Indicators
   - Shows when typing: [ ]
   - Dots animate: [ ]
   - Auto-clears 2s: [ ]
   - Clears on send: [ ]

✅ Test 3: Message Edit
   - Tab 1 updates: [ ]
   - Tab 2 auto-updates: [ ]
   - Toast appears: [ ]
   - Edit badge shows: [ ]

✅ Test 4: Message Delete
   - Tab 1 removes: [ ]
   - Tab 2 auto-removes: [ ]
   - Toast appears: [ ]
   - Smooth animation: [ ]

✅ Test 5: Network Disconnect
   - Disconnect detected: [ ]
   - Status turns red: [ ]
   - Shake animation: [ ]
   - Reconnects automatically: [ ]
   - Pulse animation: [ ]
```

---

## 🐛 **Common Issues & Fixes**

### Issue: Connection badge stuck on "Connecting"
**Cause:** WebSocket not connecting  
**Fix:**
1. Check server running: `netstat -ano | findstr :8081`
2. Check browser console for errors
3. Verify VITE_API_URL in .env

### Issue: Typing indicator not showing
**Cause:** Users not in same conversation  
**Fix:**
1. Both tabs must select SAME conversation ID
2. Check socket room joined: Look for "join_room" in Network tab
3. Verify console logs: "[Socket] Typing started"

### Issue: Edit/Delete not syncing
**Cause:** Socket events not received  
**Fix:**
1. Check browser console for errors
2. Verify socket.connected = true
3. Check Network tab → WS → Messages for events

### Issue: Animations not smooth
**Cause:** CSS not loaded  
**Fix:**
1. Hard refresh (Ctrl+Shift+R)
2. Check imported CSS files in DashboardPage.jsx
3. Verify CSS files exist in dashboard/src/styles/

---

## 📸 **What to Screenshot**

If you find bugs, screenshot these:

1. **Connection Badge** - Top-right corner with status
2. **Typing Indicator** - In chat window with animated dots
3. **Console Logs** - Any errors or socket events
4. **Network Tab** - WebSocket messages (WS filter)
5. **Toast Notifications** - Bottom-right notifications

---

## ✅ **Success Criteria**

Test is SUCCESSFUL if:

- ✅ Connection badge visible and accurate
- ✅ Status changes on network disconnect/reconnect
- ✅ Typing indicator shows <50ms after typing starts
- ✅ Typing indicator has smooth dot animation
- ✅ Message edits sync to all tabs instantly
- ✅ Message deletes remove from all tabs instantly
- ✅ Toast notifications appear for all events
- ✅ No console errors
- ✅ Smooth animations (no jank/stuttering)

**Score:** Pass if 8/9 criteria met ✅

---

## 📝 **Bug Report Template**

If you find bugs, report using this format:

```
🐛 Bug: [Short description]

Steps to reproduce:
1. [Step 1]
2. [Step 2]
3. [Step 3]

Expected: [What should happen]
Actual: [What actually happened]

Console errors: [Copy paste errors]
Screenshot: [Attach if possible]

Priority: High / Medium / Low
```

---

## 🎉 **After Testing**

Report back with:

1. ✅ What worked perfectly
2. ⚠️ What worked but has issues
3. ❌ What didn't work
4. 💡 Suggestions for improvements

Then we can:
- Fix bugs found
- Optimize performance
- Move to next feature (File Sharing or Canned Responses)

---

**Ready? Let's go!** 🚀

Open: http://localhost:5173
