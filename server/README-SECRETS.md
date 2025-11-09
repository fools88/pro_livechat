## Menangani Secrets untuk Pro Livechat (server)

Instruksi singkat untuk developer/CI:

- Jangan pernah commit `server/.env` yang berisi kredensial nyata ke repository.
- Gunakan `server/.env.secrets.example` sebagai template. Salin menjadi `server/.env` di mesin lokal Anda dan isi nilai nyata.
- Di CI (GitHub Actions), tambahkan Secrets berikut di repo Settings > Secrets:
  - DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT
  - AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME
  - GOOGLE_GEMINI_API_KEY
  - PINECONE_API_KEY, PINECONE_ENVIRONMENT, PINECONE_INDEX_NAME
  - JWT_SECRET

Contoh (GitHub Actions) akses:
```
env:
  GOOGLE_GEMINI_API_KEY: ${{ secrets.GOOGLE_GEMINI_API_KEY }}
  PINECONE_API_KEY: ${{ secrets.PINECONE_API_KEY }}
  JWT_SECRET: ${{ secrets.JWT_SECRET }}
```

Jika Anda menemukan secrets yang sudah ter-commit ke repo, segera:
1. Anggap credentials itu sudah bocor.
2. ROTATE (buat key baru) di provider yang bersangkutan (Google Cloud, Pinecone, MinIO/Storage, dll).
3. Hapus/replace credential yang ter-commit dan buat PR dengan perbaikan (tanpa memasukkan nilai nyata).

Jika Anda mau, saya bisa bantu membuat daftar langkah rotasi untuk layanan spesifik (contoh: Pinecone + Google).
