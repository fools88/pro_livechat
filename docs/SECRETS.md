Petunjuk Memindahkan Secrets ke GitHub Actions (ringkas)

Tujuan: jangan pernah menyimpan API keys atau password di repo. Gunakan GitHub Secrets untuk CI.

Langkah singkat:

1. Buka repository di GitHub -> Settings -> Secrets and variables -> Actions -> New repository secret
2. Tambahkan secrets penting (contoh):
   - `DB_USER` (contoh: postgres)
   - `DB_PASSWORD` (contoh: postgres)
   - `DB_HOST` (opsional, default 127.0.0.1 untuk CI)
   - `DB_PORT` (default 5432)
   - `DB_NAME` (contoh: prochat_db)
   - `JWT_SECRET` (random string)
3. Di file workflow (`.github/workflows/ci-e2e.yml`) sudah ada placeholder untuk `JWT_SECRET` dan environment defaults.

Contoh penggunaan di workflow:

```yaml
env:
  DB_USER: ${{ secrets.DB_USER }}
  DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
  JWT_SECRET: ${{ secrets.JWT_SECRET }}
```

Rotasi kunci (jika khawatir bocor):
- Generate new key di provider (contoh: Pinecone, S3, Gemini)
- Update secret di GitHub Actions
- Redeploy aplikasi dengan secret baru
- Revoke old key di provider

Catatan keamanan:
- Jangan menyimpan `.env` berisi kunci di repo. Jika ada kunci yang pernah ter-commit, segera rotate.
- Untuk local development: gunakan `.env` di mesin Anda (tambahkan `.env` ke `.gitignore` jika perlu).
