# pro_livechat — Local Development Guide

Panduan ringkas untuk menjalankan proyek `pro_livechat` secara lokal di Windows (dev mode dengan mock AI/Vector).

## Prerequisites
- **Docker Desktop** (running)
- **Node.js** v24.x atau lebih tinggi
- **npm** (terinstall otomatis dengan Node.js)

---

## Cara Menjalankan Semua Komponen (DB, Server, Dashboard, Widget)

### 1️⃣ Mulai Infrastruktur Lokal (Postgres, Redis, MinIO)

Buka terminal **cmd** atau **PowerShell**, lalu jalankan:

```cmd
cd C:\Benny\pro_livechat
docker-compose up -d
```

**Apa yang terjadi:**
- Container `prochat-db` (Postgres) → port 5432
- Container `prochat-redis` (Redis) → port 6379
- Container `prochat-minio` (S3-compatible storage) → port 9000 (API), 9001 (Console)

**Verifikasi container berjalan:**
```cmd
docker ps
```
Pastikan ada 3 container: `prochat-db`, `prochat-redis`, `prochat-minio`.

**Catatan:** File `.env` di folder `server` sudah dikonfigurasi untuk menggunakan kredensial:
- DB_USER=`postgres`
- DB_PASSWORD=`postgres`
- DB_HOST=`localhost`
- DB_PORT=`5432`

---

### 2️⃣ Jalankan Server Backend (Node.js + Socket.IO)

Buka terminal baru di folder `server`:

```cmd
cd C:\Benny\pro_livechat\server
npm ci
npm run dev
```

**Apa yang terjadi:**
- Nodemon menjalankan `src/index.js` dan auto-restart saat ada perubahan file.
- Server berjalan di **http://localhost:8081**
- Mock AI (Gemini) dan Mock Vector (Pinecone) aktif otomatis (MOCK_AI=true, MOCK_VECTOR=true).
- Database migrasi otomatis dilakukan saat startup.

**Verifikasi server siap:**
```cmd
node tools\wait_for_ready.js
```
Outputnya harus: `[INFO] READY OK`

**Log server:**
- `server/logs/server-2025-11-05.log` (daily rotate)

---

### 3️⃣ Jalankan Dashboard Admin (React + Vite)

Buka terminal baru di folder `dashboard`:

```cmd
cd C:\Benny\pro_livechat\dashboard
npm install
npm run dev
```

**Apa yang terjadi:**
- Vite dev server berjalan di **http://localhost:5173** (atau 5175 jika 5173 sedang dipakai).
- Dashboard terhubung ke backend di `http://localhost:8081` (via `VITE_API_URL` di `.env`).

**Akses Dashboard:**
- Buka browser → http://localhost:5173 (atau port yang ditampilkan Vite)
- Login sebagai admin (jika belum ada user, buat via API atau seed script).

---

### 4️⃣ Jalankan Widget Chat (Vite)

Buka terminal baru di folder `widget`:

```cmd
cd C:\Benny\pro_livechat\widget
npm install
npm run dev -- --port 5174
```

**Apa yang terjadi:**
- Widget dev server berjalan di **http://localhost:5174**
- Widget terhubung ke backend di `http://localhost:8081` (via `window.PRO_CHAT_BACKEND`).

**Akses Widget:**
- Buka browser → http://localhost:5174
- Klik bubble chat di pojok kanan bawah untuk test widget.

**Catatan:** 
- Widget akan otomatis mencoba mendapatkan token dari backend (`/api/widget/token`).
- Jika token gagal (origin mismatch), widget akan fallback ke legacy `widgetKey` (karena `ALLOW_LEGACY_WIDGET_KEY=true` di dev).

---

## Ringkasan Port yang Digunakan

| Komponen        | Port  | URL                          |
|----------------|-------|------------------------------|
| **DB (Postgres)** | 5432  | localhost:5432              |
| **Redis**        | 6379  | localhost:6379              |
| **MinIO API**    | 9000  | http://localhost:9000       |
| **MinIO Console**| 9001  | http://localhost:9001       |
| **Server Backend**| 8081 | http://localhost:8081       |
| **Dashboard**    | 5173  | http://localhost:5173       |
| **Widget**       | 5174  | http://localhost:5174       |

---

## Troubleshooting

### Server gagal connect ke DB: "password authentication failed"
**Penyebab:** Role `postgres` belum ada di container DB.

**Solusi:**
```cmd
docker exec -it prochat-db psql -U prochatadmin -d prochat_db -c "CREATE ROLE postgres WITH LOGIN SUPERUSER PASSWORD 'postgres';"
```
Lalu restart nodemon (ketik `rs` di terminal nodemon atau Ctrl+C lalu `npm run dev` ulang).

### Dashboard/Widget tidak bisa connect ke server (ERR_CONNECTION_REFUSED)
**Penyebab:** Server belum jalan atau port salah.

**Solusi:**
1. Pastikan server berjalan di port 8081:
   ```cmd
   curl http://localhost:8081/ready
   ```
2. Cek CORS di server (`server/.env`):
   ```properties
   CORS_ALLOW_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175
   ```
3. Restart server jika perlu.

### Vite menggunakan port yang berbeda (mis. 5175 bukan 5173)
Vite otomatis memilih port lain jika port default sedang dipakai.

**Solusi:**
- Tambahkan port tersebut ke `CORS_ALLOW_ORIGINS` di `server/.env`.
- Restart server.

---

## Cara Menjalankan E2E Test (Opsional)

Test otomatis alur chat dan Agent-Assist (ai_suggestion saat AI OFF):

```cmd
cd C:\Benny\pro_livechat\server
node tools\e2e_agent_assist_test.js
```

**Expected output:**
```
[INFO] Admin menerima ai_suggestion: { "conversationId": "...", "suggestion": "MOCK_RESPONSE..." }
```

---

Di PowerShell gunakan `$env:VAR='value'; node src/index.js` notasi environment variable.

Debug files
- `tmp/server_started.txt` — informasi PID & waktu start
- `tmp/self_ready.log` — hasil self-check `/ready`
- `tmp/ready_checks.log` — catatan readiness yang berhasil
- `server/server-ci.log` — output server saat dijalankan di background

Apa yang sudah kita kembangkan
- Mode MOCK untuk AI dan vector agar E2E dapat berjalan tanpa kredensial eksternal.
- Endpoint `/ready`, `/health`, dan `/metrics` untuk observability dan readiness.
- Logger yang menghormati `LOG_LEVEL` dan menulis file rotasi.
- Workflow CI (`.github/workflows/ci-e2e.yml`) berjalan default TANPA secrets (deterministik, MOCK aktif) agar stabil dan mudah direplikasi. Jika Anda ingin memakai secrets nyata (JWT/DB/Pinecone/S3), bisa ditambahkan kemudian.

Jika Anda ingin saya yang menjalankan semuanya dan memverifikasi, katakan "Selesaikan" — saya akan menjalankan dan mengumpulkan log serta ringkasan hasilnya.

Jika ingin belajar, minta saya membimbing langkah demi langkah (saya akan minta output terminal Anda dan menjelaskan setiap baris).
Token / origin notes (important for E2E & CI)
--------------------------------------------

- The widget token endpoint (`POST /api/widget/token`) validates the `origin` you send against the `website.url` stored in the DB for that widgetKey. For E2E to obtain a token, the `origin` must match the `website.url` origin (scheme+host+port).
- Our CI enforces a token-only flow (no fallback to `widgetKey`) so it can validate that token issuance and origin checks work correctly. The CI sets `REQUIRE_WIDGET_TOKEN=true` for the E2E step.
- Local developer convenience: the E2E script will still fall back to `widgetKey` when running locally unless you set `REQUIRE_WIDGET_TOKEN=true` in your environment. To make token-based tests pass locally, either:
	- Create a website via the API with a `url` matching the intended origin (for example `https://e2e.test`) before running E2E, or
	- Run the server and E2E with `REQUIRE_WIDGET_TOKEN=false` (default) if you prefer to use the legacy fallback while developing.

How to make a website with matching URL for tests
-------------------------------------------------
1. Start server (mock mode) and create a website via the API (use the admin token in the E2E script or via curl):

```cmd
cd /d C:\Benny\pro_livechat\server
set MOCK_AI=true&& set MOCK_VECTOR=true&& node src/index.js
# then in another shell (use the admin token from the E2E script or create one):
curl -X POST http://localhost:8081/api/websites/ -H "Authorization: Bearer <admin-token>" -H "Content-Type: application/json" -d "{ \"name\": \"E2E Site\", \"url\": \"https://e2e.test\" }"
```

2. Now run the E2E script (it will use the website's `url` to send the matching origin when requesting a token):

```cmd
set REQUIRE_WIDGET_TOKEN=true
node tools/e2e_agent_assist_test.js
```

Notes:
- Do NOT commit real secrets into the repository. For CI, add `JWT_SECRET` and DB credentials to your GitHub repository secrets.
- Once CI validates token-only flow, consider removing the legacy `widgetKey` fallback in production to harden security.

GitHub Secrets (opsional untuk CI non-deterministik)
---------------------------------------------------

CI default tidak membutuhkan secrets apa pun. Jika Anda memilih menjalankan CI dengan kredensial nyata, tambahkan secrets berikut di repository Settings → Secrets → Actions:

- `JWT_SECRET` — secret untuk menandatangani admin/widget tokens
- `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME` — kredensial database

Optional (if using Pinecone / S3 in non-mock CI runs):
- `PINECONE_API_KEY`, `PINECONE_ENVIRONMENT`, `PINECONE_INDEX_NAME`
- `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME`, `S3_REGION`

In CI we do NOT store secrets in the repo; rotate these via your cloud provider or GitHub UI when needed.

Quick GH CLI commands (copy-paste)
---------------------------------
If you prefer the GitHub CLI (fast), here are the commands you can run from the repository root.
Ensure you have `gh` installed and are authenticated (`gh auth login`). Run these in `cmd.exe` or PowerShell.

```cmd
cd /d C:\Benny\pro_livechat
# set required secrets (example values shown, replace with your real secrets)
gh secret set JWT_SECRET --body "ci-test-secret"
gh secret set DB_USER --body "postgres"
gh secret set DB_PASSWORD --body "postgres"
gh secret set DB_HOST --body "127.0.0.1"
gh secret set DB_PORT --body "5432"
gh secret set DB_NAME --body "prochat_db"

# optional external services
gh secret set PINECONE_API_KEY --body "<pinecone-key>"
gh secret set S3_ACCESS_KEY_ID --body "<s3-key>"
gh secret set S3_SECRET_ACCESS_KEY --body "<s3-secret>"
```

Trigger the CI workflow manually (opsional; jika memakai secrets, pastikan sudah ditambahkan terlebih dahulu):

```cmd
gh workflow run .github/workflows/ci-e2e.yml --ref main
```

View recent workflow runs and logs via CLI:

```cmd
gh run list --workflow ci-e2e.yml
gh run view <run-id> --log
```

Or open Actions → select workflow → view run in GitHub web UI to inspect logs and artifacts.

```

---

## 📚 Dokumentasi Tambahan

### AI Engine & Safety
- **[AI Safety Guide](docs/AI_SAFETY_GUIDE.md)** - Panduan lengkap kontrol AI, Safety Guardrails, dan best practices
- **[AI QA Checklist](docs/AI_QA_CHECKLIST.md)** - 40+ test cases untuk quality assurance AI
- **[AI Improvement Summary](docs/AI_IMPROVEMENT_SUMMARY.md)** - Summary update terbaru AI engine
- **[Persona Yaru](docs/PERSONA_YARU.md)** - Instruksi lengkap persona AI "Yaru" dengan context awareness
- **[AI Recommendations](docs/AI_RECOMMENDATIONS.md)** - Roadmap upgrade AI engine
- **[AI Suggestion TIER 1](docs/AI_SUGGESTION_TIER1.md)** - ⭐ NEW! Professional Agent-Assist system dengan smart suggestions

### Bug Fixes & Updates
- **[Widget Fix V18](docs/WIDGET_FIX_V18.md)** - Fix history loading dan message ordering di widget

### Operations & Security
- **[Widget Audit](docs/WIDGET_AUDIT.md)** - Audit widget integration
- **[Secrets Management](docs/SECRETS.md)** - Cara handle API keys dan secrets
- **[Operations Guide](server/README-OPERATIONS.md)** - Panduan operasional server
- **[Key Rotation](server/ROTATE_KEYS.md)** - Prosedur rotasi JWT secrets

### Migration & Database
- **[Migration README](server/migrations/README.md)** - Cara kerja database migrations

---

## 🔒 Local env & legacy widgetKey
----------------------------
- Untuk kemudahan dev, script start lokal mengaktifkan fallback legacy `widgetKey` melalui `ALLOW_LEGACY_WIDGET_KEY=true` secara default. Artinya widget bisa terkoneksi dengan `?widgetKey=...&fingerprint=...` tanpa token.
- Di CI, alur token-only tetap diuji (REQUIRE_WIDGET_TOKEN=true) meskipun fallback legacy dapat diaktifkan di dev.
- Anda tetap bisa membuat file env lokal jika perlu:

```cmd
copy server\.env.example server\.env.local
# Edit server\.env.local dan sesuaikan JWT_SECRET/DB sebelum menjalankan server lokal (jangan commit secrets)
```
