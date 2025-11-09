Panduan Rotasi Kunci (Google Gemini & Pinecone)

Catatan penting: lakukan rotasi segera jika kunci lama pernah tersimpan di repo.

1) Pinecone
- Login ke dashboard Pinecone: https://app.pinecone.io
- Pilih project dan environment yang relevan.
- Buka bagian API Keys / Service Accounts.
- Buat API key baru (beri nama mis. "rotated-2025-11-03").
- Simpan nilai key dengan aman (misal di GitHub Secrets: PINECONE_API_KEY).
- Update environment (CI & server) untuk menggunakan key baru. Jangan commit.
- Setelah deploy dan verifikasi sistem berjalan dengan key baru, revoke/delete key lama.

2) Google Gemini (API key di Google Cloud)
- Pergi ke Google Cloud Console: https://console.cloud.google.com
- Pilih project yang berisi key.
- API & Services -> Credentials.
- Jika key disimpan sebagai API key, buat API key baru: Create Credentials -> API key.
- Batasi key (recommended): set Application restrictions and API restrictions.
- Simpan key ke GitHub Secrets (GOOGLE_GEMINI_API_KEY).
- Perbarui environment/CI, verifikasi aplikasi berjalan.
- Setelah verifikasi sukses, delete old API key.

3) JWT_SECRET & Other secrets
- Buat new strong secret (random 32+ chars) and store in GitHub Secrets as JWT_SECRET.
- Update server environments and restart services.

4) Verify & Audit
- Setelah rotasi, jalankan end-to-end tests (prefer mock-disabled if you want real provider test) to ensure keys valid.
- Review commit history to ensure no keys remain in repo (use git grep).

5) Optional: Rotate MinIO credentials
- If MinIO creds were committed, rotate via MinIO admin and update envs.

Jika mau, saya bisa buatkan skrip checklist langkah demi langkah yang bisa Anda ikuti (perintah UI dan contoh strings). Saya juga bisa men-generate PR yang menambahkan dokumentasi dan menghapus kunci dari history (but rewriting git history is invasive).
