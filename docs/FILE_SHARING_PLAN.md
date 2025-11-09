# 📎 File Sharing Implementation Plan

**Date:** November 6, 2025  
**Priority:** HIGH (Critical for production)  
**Estimated Time:** 24 hours  
**Budget:** FREE (MinIO self-hosted)

---

## 🎯 **Goals:**

1. ✅ Visitor dapat upload file dari widget (gambar, dokumen)
2. ✅ Admin dapat upload file dari dashboard
3. ✅ Preview untuk file gambar
4. ✅ Download file dengan tracking
5. ✅ Drag & drop support
6. ✅ File size limit (10MB max)
7. ✅ Security & validation

---

## 📋 **Implementation Phases:**

### **Phase 1: Storage Setup (2 hours)**
- [ ] Install MinIO server (Docker atau standalone)
- [ ] Create bucket untuk file storage
- [ ] Setup MinIO SDK di backend
- [ ] Configure environment variables
- [ ] Test upload/download basic

### **Phase 2: Database & Models (2 hours)**
- [ ] Create `files` table migration
- [ ] Create File model (Sequelize)
- [ ] Add relationships (File belongsTo Message)
- [ ] Update Message model (hasMany Files)

### **Phase 3: Backend API (6 hours)**
- [ ] POST `/api/files/upload` - Upload file endpoint
- [ ] GET `/api/files/:id/download` - Download file endpoint
- [ ] GET `/api/files/:id/preview` - Preview/thumbnail
- [ ] File validation middleware (type, size)
- [ ] Virus scan integration (optional, ClamAV)
- [ ] File metadata extraction

### **Phase 4: WebSocket Integration (2 hours)**
- [ ] Emit `file:uploaded` event
- [ ] Broadcast file to conversation room
- [ ] Update message structure untuk include files
- [ ] Handle file deletion

### **Phase 5: Dashboard UI (6 hours)**
- [ ] File upload button di message input
- [ ] Drag & drop zone
- [ ] File preview component (images, PDF)
- [ ] Progress bar saat upload
- [ ] File list display di messages
- [ ] Download button
- [ ] Delete file option (admin only)

### **Phase 6: Widget UI (4 hours)**
- [ ] File upload button (paperclip icon)
- [ ] Mobile-friendly file picker
- [ ] Upload progress indicator
- [ ] File display in chat bubble
- [ ] Download handling

### **Phase 7: Testing & Polish (2 hours)**
- [ ] Test upload berbagai format (JPG, PNG, PDF, DOCX)
- [ ] Test file size limits
- [ ] Test error handling (network fail, invalid file)
- [ ] Test concurrent uploads
- [ ] Test cross-browser compatibility
- [ ] Performance testing (large files)

---

## 🗄️ **Database Schema:**

```sql
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id),
  
  -- File Info
  original_filename VARCHAR(255) NOT NULL,
  stored_filename VARCHAR(255) NOT NULL UNIQUE,
  mime_type VARCHAR(100) NOT NULL,
  file_size BIGINT NOT NULL, -- bytes
  file_extension VARCHAR(10),
  
  -- Storage
  storage_path TEXT NOT NULL, -- MinIO path
  storage_bucket VARCHAR(100) DEFAULT 'prochat-files',
  
  -- Metadata
  uploader_type ENUM('admin', 'visitor') NOT NULL,
  uploader_id UUID,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  
  -- Security
  virus_scan_status ENUM('pending', 'clean', 'infected', 'error') DEFAULT 'pending',
  virus_scan_date TIMESTAMP,
  
  -- Download tracking
  download_count INT DEFAULT 0,
  last_downloaded_at TIMESTAMP,
  
  -- Soft delete
  deleted_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_files_message ON files(message_id);
CREATE INDEX idx_files_conversation ON files(conversation_id);
CREATE INDEX idx_files_uploader ON files(uploader_type, uploader_id);
```

---

## 🔧 **Tech Stack:**

### **Storage:**
- **MinIO** - S3-compatible object storage (FREE, self-hosted)
- Alternative: AWS S3 (paid), Cloudflare R2 (paid)

### **Backend:**
- **multer** - File upload middleware
- **minio** - MinIO SDK
- **file-type** - MIME type detection
- **sharp** - Image thumbnail generation (optional)

### **Frontend:**
- **react-dropzone** - Drag & drop (dashboard)
- **axios** - Upload with progress
- **FileReader API** - Preview before upload

---

## 📦 **NPM Packages to Install:**

```bash
# Backend
cd server
npm install multer minio file-type sharp uuid

# Dashboard (optional, can use native)
cd dashboard
npm install react-dropzone

# Widget - No additional packages needed
```

---

## 🚀 **MinIO Setup (Docker):**

```bash
# Pull MinIO image
docker pull minio/minio

# Run MinIO server
docker run -d \
  -p 9000:9000 \
  -p 9001:9001 \
  --name prochat-minio \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin123" \
  -v c:/minio-data:/data \
  minio/minio server /data --console-address ":9001"

# Access MinIO Console: http://localhost:9001
# API Endpoint: http://localhost:9000
```

**Standalone (Windows):**
```bash
# Download from https://min.io/download
# Run:
minio.exe server c:\minio-data
```

---

## 🔒 **Security Considerations:**

### **1. File Type Validation:**
```javascript
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];
```

### **2. File Size Limits:**
- Max per file: 10MB
- Max per message: 5 files
- Total storage quota: 1GB per website (configurable)

### **3. Filename Sanitization:**
```javascript
const sanitizeFilename = (filename) => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .substring(0, 100);
};
```

### **4. Virus Scanning (Optional):**
- Integrate ClamAV for virus scanning
- Scan files before serving download
- Quarantine infected files

---

## 📊 **API Endpoints:**

### **POST /api/files/upload**
```javascript
Request:
- Headers: Authorization: Bearer <admin_token> OR X-Visitor-Key: <visitor_key>
- Body (multipart/form-data):
  - file: File
  - conversationId: UUID
  - messageId: UUID (optional, create if not provided)

Response:
{
  "success": true,
  "file": {
    "id": "uuid",
    "original_filename": "screenshot.png",
    "mime_type": "image/png",
    "file_size": 123456,
    "download_url": "/api/files/uuid/download",
    "preview_url": "/api/files/uuid/preview"
  },
  "message": { ... }
}
```

### **GET /api/files/:id/download**
```javascript
Response:
- Content-Type: <mime_type>
- Content-Disposition: attachment; filename="<original_filename>"
- Binary file data
```

### **GET /api/files/:id/preview**
```javascript
Response:
- Thumbnail (300x300) untuk images
- Icon preview untuk documents
- Content-Type: image/jpeg
```

---

## 🎨 **UI/UX Design:**

### **Dashboard Message Input:**
```
┌────────────────────────────────────────────┐
│  ┌──────────────────────────────────────┐  │
│  │  [📎] [😊] [Ketik pesan...]     [>]  │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  Attached Files (2):                       │
│  ┌─────────────┐ ┌─────────────┐          │
│  │ 📷 image.jpg│ │ 📄 doc.pdf  │  [×]     │
│  │ 2.3 MB      │ │ 1.1 MB      │          │
│  └─────────────┘ └─────────────┘          │
└────────────────────────────────────────────┘
```

### **Chat Message with File:**
```
┌────────────────────────────────────────────┐
│  [Visitor] Ini screenshot error-nya        │
│  ┌───────────────────────────┐             │
│  │  📷                       │             │
│  │  [Image Preview]          │             │
│  │                           │             │
│  │  screenshot.png (2.3 MB)  │             │
│  │  [Download] [View Full]   │             │
│  └───────────────────────────┘             │
│                               3:45 PM      │
└────────────────────────────────────────────┘
```

### **Widget Upload:**
```
┌─────────────────────────────┐
│  Selamat Datang!            │
├─────────────────────────────┤
│  [Visitor] Ada error nih    │
│  📎 error-log.txt (15 KB)   │
│  [Download]                 │
├─────────────────────────────┤
│  [📎] [Ketik pesan...]  [>] │
└─────────────────────────────┘
```

---

## 🔄 **WebSocket Events:**

### **file:uploaded**
```javascript
{
  "event": "file:uploaded",
  "data": {
    "fileId": "uuid",
    "messageId": "uuid",
    "conversationId": "uuid",
    "file": {
      "original_filename": "image.jpg",
      "mime_type": "image/jpeg",
      "file_size": 123456,
      "download_url": "/api/files/uuid/download",
      "preview_url": "/api/files/uuid/preview"
    },
    "uploader": {
      "type": "visitor",
      "id": "uuid"
    }
  }
}
```

---

## ✅ **Testing Scenarios:**

### **Functional Tests:**
1. ✅ Upload JPG, PNG, GIF dari dashboard
2. ✅ Upload PDF, DOCX dari widget
3. ✅ Upload file 10MB (should succeed)
4. ✅ Upload file 11MB (should reject)
5. ✅ Upload .exe file (should reject)
6. ✅ Download file as admin
7. ✅ Download file as visitor
8. ✅ Delete file (admin only)
9. ✅ Upload multiple files in one message
10. ✅ Drag & drop file to chat window

### **Edge Cases:**
1. ⚠️ Upload saat network slow (progress bar)
2. ⚠️ Upload fail mid-transfer (retry mechanism)
3. ⚠️ Upload duplicate filename (rename handling)
4. ⚠️ Upload file dengan special characters di nama
5. ⚠️ Concurrent uploads (queue handling)
6. ⚠️ Storage full (quota exceeded error)

### **Security Tests:**
1. 🔒 Upload malicious file (should scan/reject)
2. 🔒 Download without auth (should reject)
3. 🔒 Path traversal attack (../../etc/passwd)
4. 🔒 XXS in filename
5. 🔒 File bomb (zip bomb detection)

---

## 📈 **Performance Optimization:**

1. **Chunked Upload** (for files >5MB)
2. **Thumbnail Generation** (lazy load on preview)
3. **CDN Caching** (static file serving)
4. **Lazy Loading** (load files only when visible)
5. **Compression** (gzip for downloads)

---

## 🎯 **Success Metrics:**

Feature is successful if:

- ✅ Upload success rate >99%
- ✅ Upload speed: ~1MB/s (local network)
- ✅ Preview load time <500ms
- ✅ No security vulnerabilities
- ✅ Mobile-friendly UI
- ✅ Works on slow connections (3G)
- ✅ Storage cost <$5/month (self-hosted = $0)

---

## 🚀 **Rollout Plan:**

### **Week 1: Backend + Storage**
- Day 1-2: MinIO setup + backend API
- Day 3: Database migration + models
- Day 4: Testing + security

### **Week 2: Frontend**
- Day 5-6: Dashboard UI
- Day 7: Widget UI
- Day 8: Testing + polish

### **Week 3: Production**
- Day 9: Deploy to staging
- Day 10: User acceptance testing
- Day 11: Deploy to production
- Day 12: Monitor + fix bugs

---

## 💡 **Future Enhancements:**

1. **Image Editor** - Crop, rotate, annotate before send
2. **Voice Messages** - Record audio (WebRTC)
3. **Video Upload** - MP4, WebM support
4. **File Expiry** - Auto-delete after 30 days
5. **Compression** - Auto-compress large images
6. **OCR** - Extract text from images (Tesseract.js)

---

**Ready to start Boss?** 

Kita mulai dari mana:
- **A)** Setup MinIO dulu (infrastructure)
- **B)** Backend API dulu (logic)
- **C)** Database migration dulu (schema)

Atau mau saya langsung implement semua step-by-step? 🚀
