# 🛡️ AI SAFETY & QUALITY CONTROL GUIDE

## 📋 Daftar Isi
1. [Safety Guardrails](#safety-guardrails)
2. [Cara Mengontrol AI dari Dashboard](#kontrol-ai)
3. [Monitoring & Testing](#monitoring)
4. [Troubleshooting AI](#troubleshooting)
5. [Best Practices](#best-practices)

---

## 🚨 Safety Guardrails

AI Assistant kami dilengkapi dengan **6 Lapis Perlindungan** untuk mencegah risiko:

### 1. **FOKUS TOPIK - Anti Melenceng**
- ✅ AI HANYA menjawab pertanyaan yang relevan dengan Knowledge Base
- ✅ Jika user tanya topik di luar konteks (politik, agama, pribadi) → AI menolak dengan sopan
- ✅ Contoh: User tanya "Siapa presiden Indonesia?" → AI: "Mohon maaf kak, saya hanya bisa bantu info layanan kami ya 🙏"

### 2. **ANTI-HALUSINASI - Tidak Mengarang**
- ✅ AI WAJIB gunakan informasi dari Knowledge Base (file yang di-upload)
- ✅ Jika tidak ada info di Knowledge Base → AI bilang "belum punya informasi" instead of mengarang
- ✅ Contoh: User tanya bonus yang tidak ada → AI: "Mohon maaf kak, untuk pertanyaan ini saya belum punya informasinya"

### 3. **KONSISTENSI - Tidak Mengulang**
- ✅ AI cek history chat: Jika pertanyaan sama sudah dijawab → AI ringkas jawaban lama, bukan copy-paste
- ✅ Contoh: User tanya "Bonus apa aja?" 2x → AI kedua kalinya: "Seperti yang sudah saya jelaskan, ada bonus A, B, C. Ada yang kurang jelas kak?"

### 4. **LOGIKA PENUTUP CERDAS**
- ✅ AI TIDAK selalu bilang "Ada yang bisa dibantu lagi?" setiap kali jawab
- ✅ AI HANYA pakai salam penutup jika user eksplisit bilang "sudah", "cukup", "makasih"
- ✅ Jika user cuma bilang "oke" → AI cuma jawab "Oke kak 😊"

### 5. **EMOSI & EMPATI**
- ✅ AI analisis mood user dari chat history (Senang/Bingung/Kesal)
- ✅ Jika user kesal → AI lebih sabar: "Mohon maaf atas ketidaknyamanannya kak 🙏"
- ✅ Jika user bingung → AI lebih detail: "Saya jelaskan step-by-step ya kak"

### 6. **KEAMANAN**
- ✅ AI TIDAK pernah bilang dia adalah "AI", "bot", atau "sistem"
- ✅ AI TIDAK sebutkan istilah teknis ("MOCK", "prompt", "Knowledge Base") ke user
- ✅ AI TIDAK kasih info sensitif (password, API key, dll)

---

## 🎛️ Cara Mengontrol AI dari Dashboard

### A. Setting Persona (Kepribadian AI)

1. Login ke Dashboard → Pilih Website → Tab **AI Engine**
2. Di bagian **"1. Kepribadian (Persona)"**, isi:

| Field | Fungsi | Contoh |
|-------|--------|--------|
| **Nama Persona** | Nama AI yang akan dipanggil user | "Yaru", "Rina", "Asisten" |
| **Gaya Bicara** | Prompt inti yang mendefinisikan karakter | "Kamu adalah CS game online yang ramah, pakai bahasa gaul (gak formal), suka emoji 😊, dan selalu antusias membantu player!" |
| **Salam Pembuka** | Ucapan pertama ke visitor baru | "Halo kak 👋 Ada yang bisa Yaru bantu?" |
| **Salam Penutup** | Ucapan jika chat mau selesai | "Ada lagi yang bisa dibantu, kak?" |
| **Model Gemini** | Pilih model AI | **Gemini 2.5 Flash** (cepat, direkomendasikan) atau **Gemini 2.5 Pro** (lebih pintar, lebih lambat) |

3. Klik **Simpan Persona**

**💡 Tips Gaya Bicara yang Baik:**
```
BAGUS ✅:
"Kamu adalah customer service profesional untuk layanan game online. 
Gunakan bahasa yang ramah tapi tetap sopan. 
Jika user bertanya bonus, jelaskan dengan detail. 
Jika user marah, tetap sabar dan minta maaf dulu."

JELEK ❌:
"Kamu ramah" (terlalu singkat, AI bingung)
```

---

### B. Upload Knowledge Base (Otak AI)

1. Di bagian **"2a. Manajemen Kategori Otak"**:
   - Buat kategori dulu (misal: "Promosi & Bonus", "Syarat & Ketentuan", "Tutorial")
   - Klik **Buat Kategori**

2. Di bagian **"2b. Upload File Otak"**:
   - Pilih kategori yang sesuai
   - Upload file PDF/DOCX/TXT yang berisi info produk/layanan
   - Klik **Upload & Proses**

**📝 Contoh File Knowledge Base:**
- `bonus-oktober-2025.pdf` → Kategori: "Promosi & Bonus"
- `syarat-turnover.pdf` → Kategori: "Syarat & Ketentuan"
- `cara-deposit.pdf` → Kategori: "Tutorial"

**⚠️ PENTING:** 
- Jangan upload file yang isinya sama/duplikat → AI bisa jawab ngulang-ngulang
- Update file secara berkala agar AI tidak kasih info kadaluarsa

---

### C. Atur Rules (Aturan AI)

Di bagian **"3. Aturan AI"**, kamu bisa set kapan AI harus auto-reply atau diam:

| Target Type | Target Value | Action | Arti |
|-------------|--------------|--------|------|
| `website` | `{websiteId}` | `AUTO_REPLY` | AI auto jawab untuk semua visitor di website ini |
| `website` | `{websiteId}` | `DO_NOTHING` | AI TIDAK auto jawab, tunggu admin manual reply |
| `visitor_id` | `{visitorId}` | `DO_NOTHING` | AI TIDAK auto jawab untuk visitor tertentu (misal: VIP yang maunya chat langsung sama manusia) |

**💡 Use Case:**
- **Jam kerja (09:00-17:00)**: Set `AUTO_REPLY` agar AI bantu admin
- **Jam istirahat (17:00-09:00)**: Set `AUTO_REPLY` agar visitor tetap dapat respon cepat
- **VIP Customer**: Set `DO_NOTHING` agar admin langsung handle

---

## 📊 Monitoring & Testing

### 1. **Test AI Response di Widget**

Buka Widget di browser:
```
http://localhost:5174
```

Coba tanya berbagai pertanyaan untuk test AI:

| Jenis Pertanyaan | Contoh | Expected Response |
|------------------|--------|-------------------|
| **In-Context (Ada di Knowledge Base)** | "Bonus apa aja bulan ini?" | AI kasih info detail dari file yang di-upload ✅ |
| **Out-of-Context (Tidak ada di KB)** | "Siapa presiden Indonesia?" | "Mohon maaf kak, saya hanya bisa bantu info layanan kami ya 🙏" ✅ |
| **Pertanyaan Kasar** | "Bodoh!" | "Mohon maaf kak, saya kurang mengerti maksudnya. Boleh diperjelas?" ✅ |
| **Pertanyaan Sama 2x** | "Bonus apa aja?" (tanya 2x) | AI kedua kalinya: "Seperti yang sudah saya jelaskan, ..." ✅ |
| **Oke/Sip** | "oke" | "Oke kak 😊" (bukan "Ada yang bisa dibantu lagi?") ✅ |
| **Akhiri Chat** | "sudah cukup makasih" | AI pakai salam penutup: "Ada lagi yang bisa dibantu, kak?" ✅ |

### 2. **Monitor Chat di Dashboard**

Login Dashboard → Tab **Chats**:
- Lihat semua percakapan real-time
- Klik percakapan untuk lihat detail
- Cek apakah AI menjawab sesuai harapan
- Jika AI salah → Admin bisa ambil alih (toggle AI OFF) dan reply manual

### 3. **Check Server Logs**

Terminal server akan print info penting:
```
[Gemini Service V18] Langkah 1: Mengklasifikasikan kategori...
[Gemini Service V18] Kategori terdeteksi: Promosi (a1b2c3d4-...)
[Gemini Service V18] Ringkasan berhasil dibuat.
```

Jika ada error:
```
[Gemini Service V18] GAGAL mengambil konteks dari Pinecone
```
→ Cek apakah file Knowledge Base sudah di-upload dan diproses

---

## 🔧 Troubleshooting AI

### Masalah 1: AI Jawab "Belum punya informasi" padahal file sudah di-upload

**Penyebab:**
- File belum diproses (status masih `PENDING` atau `PROCESSING`)
- File tidak terbaca (format rusak)
- Kategori salah

**Solusi:**
1. Cek Dashboard → AI Engine → Tabel Knowledge Base
2. Lihat kolom **Status**: Harus `COMPLETED` ✅
3. Jika masih `PENDING`:
   - Tunggu beberapa detik (proses embedding butuh waktu)
   - Refresh halaman Dashboard
4. Jika `FAILED`:
   - Hapus file, upload ulang dengan format yang benar (PDF/DOCX/TXT)

---

### Masalah 2: AI Jawab Ngulang-Ngulang

**Penyebab:**
- Ada file duplikat di Knowledge Base
- AI tidak cek SHORT-TERM MEMORY dengan baik

**Solusi:**
1. Cek Dashboard → AI Engine → Tabel Knowledge Base
2. Hapus file yang duplikat
3. Pastikan setiap file isinya unik
4. Jika masih ngulang → Cek server logs, laporan ke developer

---

### Masalah 3: AI Melenceng ke Topik Lain

**Penyebab:**
- Gaya Bicara (prompt) terlalu umum/luas
- Knowledge Base berisi topik yang tidak relevan

**Solusi:**
1. Edit **Gaya Bicara** di Persona, tambahkan batasan:
   ```
   "Kamu adalah CS untuk layanan game online.
   JANGAN pernah bahas topik politik, agama, atau hal pribadi.
   HANYA jawab pertanyaan terkait game, bonus, deposit, withdraw."
   ```
2. Cek file Knowledge Base, pastikan tidak ada topik aneh

---

### Masalah 4: AI Tidak Auto Reply

**Penyebab:**
- Rule di-set `DO_NOTHING`
- MOCK_AI=true tapi ada bug di mock

**Solusi:**
1. Cek Dashboard → AI Engine → Tab Rules
2. Pastikan ada rule: `website` → `{websiteId}` → `AUTO_REPLY`
3. Jika tidak ada, klik **Tambah Aturan**

---

## ✅ Best Practices

### 1. **Rutin Update Knowledge Base**
- Setiap ada promo baru → Upload file baru
- Setiap ada perubahan syarat → Update file lama
- Hapus file kadaluarsa (misal: promo bulan lalu)

### 2. **Test AI Setelah Perubahan**
- Setiap kali edit Persona → Test di Widget
- Setiap kali upload file baru → Test pertanyaan terkait file itu
- Jika AI salah → Edit Gaya Bicara atau file Knowledge Base

### 3. **Monitor Chat Real-Time**
- Minimal 1x sehari cek Dashboard → Chats
- Jika ada visitor komplain AI salah → Ambil alih manual
- Catat pertanyaan yang sering salah dijawab → Perbaiki Knowledge Base

### 4. **Backup Persona & Knowledge Base**
- Export file Knowledge Base secara berkala
- Screenshot setting Persona (untuk recovery jika ada masalah)

### 5. **Komunikasi Tim**
- Jika ada admin/agent lain, kasih tahu setiap kali update AI
- Buat SOP: Kapan AI boleh auto-reply, kapan harus manual

---

## 🚀 Upgrade ke Production (MOCK_AI=false)

Saat ini sistem pakai `MOCK_AI=true` (mode development). Untuk produksi:

### Step 1: Dapatkan API Key
1. Buka [Google AI Studio](https://aistudio.google.com/apikey)
2. Login dengan Google Account
3. Klik **Get API Key**
4. Copy API key

### Step 2: Update Environment
Edit `server/.env`:
```env
MOCK_AI=false
GOOGLE_GEMINI_API_KEY=YOUR_REAL_GEMINI_API_KEY_HERE
```

### Step 3: Setup Vector Database (Pinecone)
1. Buat akun di [Pinecone](https://www.pinecone.io/)
2. Buat Index baru (dimension: 768, metric: cosine)
3. Copy API Key & Environment

Edit `server/.env`:
```env
MOCK_VECTOR=false
PINECONE_API_KEY=YOUR_PINECONE_API_KEY_HERE
PINECONE_ENVIRONMENT=YOUR_PINECONE_ENVIRONMENT
PINECONE_INDEX_NAME=YOUR_INDEX_NAME
```

### Step 4: Restart Server
```bash
cd server
npm run dev
```

### Step 5: Re-Upload Knowledge Base
- Semua file harus di-upload ulang untuk diproses ke Pinecone
- Cek status: Harus `COMPLETED`

---

## 📞 Support

Jika ada masalah atau pertanyaan, hubungi developer atau cek:
- **Server Logs**: Terminal tempat server berjalan
- **Browser Console**: F12 → Console (untuk error Dashboard/Widget)
- **Database**: Cek tabel `AIPersonas`, `AIKnowledges`, `AIRules` untuk validasi data

---

**Versi Dokumen:** 1.0  
**Terakhir Update:** 5 November 2025  
**Penulis:** GitHub Copilot AI Assistant
