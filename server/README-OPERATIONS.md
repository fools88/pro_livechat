Operational notes — cara menjalankan dan memutar secrets

1) Menjalankan server (dev) dengan mock AI/vector:

   # PowerShell
   powershell -NoProfile -ExecutionPolicy Bypass -File start_server_mock.ps1

   # atau (cmd)
   set MOCK_AI=true&& set MOCK_VECTOR=true&& set PORT=8081&& npm start

2) PM2 (opsional)
   - Pasang pm2 jika belum: npm install --no-audit --no-fund
   - Jalankan: npm run start:pm2
   - Restart: pm2 restart prochat-server

3) Secrets & CI
   - Jangan commit server/.env dengan kredensial asli.
   - Gunakan `server/.env.secrets.example` sebagai template.
   - Isi GitHub Secrets (GOOGLE_GEMINI_API_KEY, PINECONE_API_KEY, PINECONE_ENVIRONMENT, PINECONE_INDEX_NAME, JWT_SECRET, etc.)

   ---

   Tambahan: E2E token-first (lokal)

   - Untuk menjalankan E2E token-first lokal yang saya gunakan untuk CI:
      - Pastikan container database (Postgres) dan Redis berjalan via docker-compose di repository root.
      - Jalankan migrasi di `server/`.
      - Jalankan server lokal dengan `JWT_SECRET` tertentu (contoh: `ci-test-secret`) dan `MOCK_AI=true` dan `MOCK_VECTOR=true`.
      - Jalankan `node server/tools/run_e2e_and_capture.js` (script akan menulis output ke `server/tmp_e2e_output.txt`).

   Debugging tips:
   - Aktifkan `LOG_LEVEL=debug` untuk melihat log lebih detail.
   - Untuk E2E berbasis token, pastikan `JWT_SECRET` sama di kedua proses (server dan test driver).
