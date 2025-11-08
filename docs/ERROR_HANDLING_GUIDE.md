# 🛡️ Error Handling & Graceful Degradation Guide

**Dokumentasi**: Strategi penanganan error untuk AI Livechat Pro
**Tanggal**: 5 November 2025
**Status**: Implemented ✅

---

## 📋 **Masalah yang Ditangani**

### **1. Gemini API Quota Exceeded (429)**
**Penyebab**: Free tier Gemini limit 10 requests/minute
**Dampak**: AI tidak bisa generate response → chat macet
**Solusi**: ✅ Graceful fallback response

### **2. Pinecone Connection Error**
**Penyebab**: Network issues, API outage, atau credential salah
**Dampak**: Tidak bisa ambil context dari Knowledge Base
**Solusi**: ✅ AI tetap jalan **TANPA context** (general response)

### **3. visitorKey Mismatch (403)**
**Penyebab**: Field `visitorKey` tidak exist di model Visitor
**Dampak**: Widget tidak bisa load message history
**Solusi**: ✅ Gunakan `browserFingerprint` sebagai identifier

### **4. Circuit Breaker OPEN**
**Penyebab**: Terlalu banyak error berturut-turut (threshold: 5 failures)
**Dampak**: AI auto-disabled untuk recovery (60 detik)
**Solusi**: ✅ Fallback response + auto-reset setelah recovery period

---

## 🔧 **Implementasi Teknis**

### **A. Gemini Service - Enhanced Error Handling**
**File**: `server/src/services/gemini.service.js`

#### **1. createContext() - Pinecone Fallback**
```javascript
try {
  relevantChunks = await queryVectors(queryText, 5, websiteId, categoryId);
} catch (pineconeError) {
  logger.warn('⚠️ Pinecone unreachable. AI akan jawab TANPA knowledge base.');
  return ""; // Kosong = AI jawab general, bukan error
}
```

**Behavior**:
- Pinecone down → Return empty string (bukan throw error)
- AI tetap generate response **tanpa context**
- User tetap dapat jawaban (meski general/tidak spesifik)

#### **2. getCategoryForQuery() - Classifier Fallback**
```javascript
try {
  categoryId = await getCategoryForQuery(queryText, websiteId);
} catch (classifierError) {
  logger.warn('Classifier gagal (quota/network). Lanjut tanpa kategori filter.');
  // Lanjutkan dengan categoryId=null (cari di semua kategori)
}
```

**Behavior**:
- Classifier error → Set `categoryId = null`
- Query Pinecone **tanpa filter kategori** (cari di semua)
- Lebih lambat tapi tetap dapat context

#### **3. generateChatResponse() - Quota Fallback**
```javascript
try {
  const result = await aiCallHelper.safeGenerate(dynamicChatModel, fullPrompt);
  return aiTextResponse;
} catch (geminiError) {
  if (errorMsg.includes('quota') || errorMsg.includes('429')) {
    return `Mohon maaf kak, sistem AI sedang mengalami keterbatasan...`;
  }
  if (errorMsg.includes('Circuit is open')) {
    return `Mohon maaf kak, sistem AI sedang dalam pemulihan...`;
  }
  return `Mohon maaf kak, ada kendala teknis...`;
}
```

**Behavior**:
- Quota exceeded → User-friendly Indonesian message
- Circuit open → Informasi pemulihan sistem
- Generic error → Saran hubungi CS

---

### **B. Conversation Controller - visitorKey Fix**
**File**: `server/src/api/controllers/conversation.controller.js`

#### **getMessagesForVisitor() - Field Correction**
```javascript
// ✅ FIX: Gunakan browserFingerprint, bukan visitorKey
if (conversation.Visitor.browserFingerprint !== visitorKey) {
  logger.warn(`Fingerprint mismatch. Expected: ${...}, Got: ${visitorKey}`);
  return res.status(403).json({ message: 'Forbidden' });
}
```

**Root Cause**: Model `Visitor` tidak punya field `visitorKey`
**Solution**: Gunakan `browserFingerprint` (existing field)

---

### **C. Socket Handler - Broadcast Fix**
**File**: `server/src/socket/handlers.js`

#### **send_message (Visitor) - Admin Broadcast**
```javascript
// ✅ FIX: Kirim ke room + all admin sockets
io.to(conversationId.toString()).emit('new_message', newMessage);

const allSockets = await io.fetchSockets();
allSockets.forEach(adminSocket => {
  if (adminSocket.userType === 'admin' && !adminSocket.rooms.has(conversationId.toString())) {
    adminSocket.emit('new_message', newMessage);
  }
});
```

**Problem**: Admin belum join room → tidak terima message
**Solution**: Emit ke **room** (for joined admins) + **all admin sockets** (for non-joined)

---

## 📊 **Error Flow Diagram**

```
USER KIRIM PESAN
    ↓
[1] Classify Category (getCategoryForQuery)
    ├─ SUCCESS → categoryId
    └─ ERROR (quota/network) → categoryId = null, lanjut step [2]
    ↓
[2] Query Pinecone (queryVectors)
    ├─ SUCCESS → relevantChunks
    ├─ EMPTY + categoryId exist → Retry tanpa filter
    └─ ERROR (network) → context = "", lanjut step [3]
    ↓
[3] Generate Response (generateChatResponse)
    ├─ SUCCESS → AI response normal
    ├─ QUOTA ERROR → Fallback: "Sistem AI keterbatasan..."
    ├─ CIRCUIT OPEN → Fallback: "Sistem dalam pemulihan..."
    └─ GENERIC ERROR → Fallback: "Kendala teknis..."
    ↓
USER TERIMA RESPONSE (selalu ada jawaban!)
```

---

## 🚨 **Monitoring & Alerts**

### **Log Patterns to Watch**
```bash
# Pinecone issues
grep "Pinecone unreachable" server.log

# Quota issues
grep "quota exceeded" server.log
grep "429 Too Many Requests" server.log

# Circuit breaker
grep "Circuit is open" server.log

# Fingerprint mismatch
grep "Fingerprint mismatch" server.log
```

### **Health Metrics**
- **Circuit Breaker State**: Check `/health` endpoint (jika ada)
- **Gemini Quota**: Monitor via Google AI Studio dashboard
- **Pinecone Status**: https://status.pinecone.io/

---

## ⚙️ **Configuration**

### **Circuit Breaker Settings**
**File**: `server/src/utils/circuitBreaker.js`
```javascript
failureThreshold: 5      // Open after 5 consecutive failures
recoveryTimeMs: 60000    // Reset after 60 seconds
```

### **Gemini Rate Limits (Free Tier)**
- **Requests**: 10/minute
- **Tokens**: 1M/day
- **Concurrent**: 1 request at a time

**Recommendation**: 
- Upgrade to Paid tier jika traffic tinggi
- Atau implement request queuing untuk smooth rate limiting

### **Pinecone Connection**
**File**: `server/.env`
```env
PINECONE_API_KEY=pcsk_...
PINECONE_ENVIRONMENT=us-east-1-aws
PINECONE_INDEX_NAME=prochat-kb
```

---

## ✅ **Testing Checklist**

### **Scenario 1: Pinecone Down**
1. ❌ Matikan Pinecone (salah API key)
2. ✅ User kirim pesan
3. ✅ AI tetap jawab (tanpa context specific)
4. ✅ Log: "Pinecone unreachable. AI akan jawab TANPA knowledge base."

### **Scenario 2: Gemini Quota Exceeded**
1. ❌ Kirim 11 requests dalam 1 menit (exceed quota)
2. ✅ Request ke-11 → Fallback message
3. ✅ User dapat: "Mohon maaf kak, sistem AI sedang mengalami keterbatasan..."
4. ✅ Log: "Gemini quota exceeded. Returning graceful fallback response."

### **Scenario 3: Circuit Breaker Open**
1. ❌ Generate 5 errors berturut (salah Gemini API key)
2. ✅ Circuit → OPEN
3. ✅ Request berikutnya → Fallback message
4. ✅ Tunggu 60 detik → Circuit → HALF → Retry
5. ✅ Log: "Circuit is open"

### **Scenario 4: Widget Load History**
1. ✅ Visitor buka chat di widget
2. ✅ Kirim pesan "halo"
3. ✅ Refresh browser
4. ✅ History muncul (tidak 403 Forbidden)
5. ✅ Log: No "Fingerprint mismatch" warning

---

## 🎯 **Best Practices**

### **1. Always Provide Fallback**
❌ **Bad**: `throw new Error('Pinecone unavailable')`
✅ **Good**: `return ""` (AI tetap jalan tanpa context)

### **2. User-Friendly Messages**
❌ **Bad**: "Error: GoogleGenerativeAI 429 quota exceeded"
✅ **Good**: "Mohon maaf kak, sistem AI sedang mengalami keterbatasan..."

### **3. Detailed Logging**
✅ **Include**: Error type, context, expected vs actual values
```javascript
logger.warn(`Fingerprint mismatch. Expected: ${expected}, Got: ${actual}`);
```

### **4. Graceful Degradation Hierarchy**
1. **BEST**: Full AI response with context
2. **GOOD**: AI response tanpa context (general knowledge)
3. **ACCEPTABLE**: Fallback message + saran hubungi CS
4. **NEVER**: Error message ke user / chat macet

---

## 📚 **Related Documentation**
- `AI_SUGGESTION_TIER1.md` - AI suggestion feature spec
- `AI_SAFETY_GUIDE.md` - AI safety guardrails
- `README-OPERATIONS.md` - Server operations guide

---

**Last Updated**: 5 November 2025
**Maintained By**: Pro Livechat Team
