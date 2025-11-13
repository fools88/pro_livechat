## Rotation Log

Tanggal: 2025-11-13T10:33:00Z
Actor: fools88 (Anda)

Ringkasan:
- Melakukan rotasi kredensial lokal untuk pengujian/dev: Postgres (`prochatadmin`) dan MinIO (root).
- Aplikasi server direstart sehingga perubahan variabel environment dipakai.

Detail perubahan (tanpa menyertakan nilai rahasia):

1) POSTGRES (user: prochatadmin)
- Tindakan: `ALTER USER prochatadmin WITH PASSWORD '<redacted>';` dijalankan di container `prochat-db`.
- Metode eksekusi: `docker exec -u postgres prochat-db psql -c "ALTER USER prochatadmin WITH PASSWORD '<redacted>';"`
- Verifikasi: `docker exec prochat-db psql -U prochatadmin -d prochat_db -c "select 1;"` → OK
- Status: Sukses

2) MINIO (root)
- Tindakan: recreate container `prochat-minio` dengan `MINIO_ROOT_PASSWORD` baru, volume data dipertahankan (volume: `pro_livechat_minio-data`).
- Metode eksekusi: `docker rm -f prochat-minio` lalu `docker run -d --name prochat-minio -p 9000:9000 -p 9001:9001 -e MINIO_ROOT_USER=<redacted> -e MINIO_ROOT_PASSWORD=<redacted> -v pro_livechat_minio-data:/data minio/minio server /data --console-address ":9001"`
- Verifikasi: `GET http://localhost:9000/minio/health/ready` → HTTP 200 OK
- Status: Sukses

3) Aplikasi server
- Tindakan: stop proses Node lama, start ulang `node src/index.js` (background) sehingga membaca `server/.env` yang berisi kredensial baru.
- Verifikasi: `GET http://localhost:8081/health` → `{ "status": "ok" }`
  dan `GET http://localhost:8081/ready` → `{ "overall": "ok" }`
- Status: Sukses

Revoke / mitigasi yang dilakukan / direkomendasikan:
- Postgres: password lama tidak lagi valid setelah `ALTER USER`. Bila perlu, terminate sesi aktif yang memakai user lama:
  - Contoh: `docker exec -u postgres prochat-db psql -c "SELECT pid, usename FROM pg_stat_activity WHERE usename='prochatadmin';"`
  - Terminate: `docker exec -u postgres prochat-db psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE usename='prochatadmin' AND pid <> pg_backend_pid();"`
- MinIO: password lama invalid setelah container di-recreate; juga periksa dan hapus access keys/credentials user-level lama bila ada.
- JWT / sessions: bila `JWT_SECRET` dirotasi, semua token lama harus dianggap tidak valid — pastikan mekanisme revocation atau notifikasi pengguna jika perlu.
- GitHub / CI secrets: update secrets di repo/CI (sudah disarankan); hapus/overwrite nilai lama di Secret Manager bila perlu.

Artifacts / bukti verifikasi (lokal):
- `tmp/server_stdout.log` (termasuk log koneksi DB dan ready checks)
- `tmp/ready_checks.log` dan `tmp/self_ready.log`
- Output perintah `docker ps` dan `docker inspect` (tersimpan dalam sesi terminal lokal)

Roll-back singkat (jika terjadi gangguan):
- Restore DB: set password kembali ke nilai sebelumnya via `ALTER USER` jika nilai lama masih diketahui.
- Restore MinIO: stop container baru dan recreate dengan password lama (jika diperlukan) — data tidak hilang selama volume dipertahankan.
- Jika rollback perlu lebih cepat: hentikan server, ganti `server/.env` ke nilai lama, start server ulang.

Follow-up tasks (recommended):
- Simpan nilai baru ke password manager / secret manager (1Password, Vault, Bitwarden, atau GitHub Secrets).
- Jika kredensial lama kemungkinan terekspos, lakukan revoke pada layanan eksternal terkait dan lakukan audit akses.
- Tambahkan entri ticket/change log dan notify tim operasi/developers.

Catatan keamanan:
- File `server/.env` yang berisi kredensial disimpan lokal di workspace dan **tidak** boleh dikomit ke VCS. Pastikan `.gitignore` melarang commit file ini.
- Jangan bagikan nilai rahasia melalui chat atau tempat tidak terenkripsi.

Status keseluruhan: Selesai (2025-11-13)

***
File ini dibuat otomatis untuk mencatat rotasi kredensial lokal/tes. Ia tidak berisi nilai rahasia.
