# Playbook Rotasi Kredensial (Final)

Dokumen ini menjelaskan prosedur aman, dapat diulang, dan dapat di-rollback untuk merotasi kredensial sensitif (database, object storage, token). Tujuan: meminimalkan downtime dan resiko saat rotasi di production.

**Pemilik Dokumen**: Tim Operasi / Keamanan
**Versi**: 1.1
**Terakhir Diperbarui**: 2025-11-13

---

## Ringkasan Lingkup

Kredensial yang biasanya dirotasi:

- **PostgreSQL**: `DB_PASSWORD` / `PGUSER` — dipakai server & migrasi
- **MinIO (S3-compatible)**: `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD` — storage objek
- **Widget / JWT signing**: `WIDGET_SIGNING_KEY`, `JWT_SECRET` — tanda tangan token
- **CI/CD tokens**: `GH_TOKEN_CI`, registry tokens — akses pipeline
- **Admin / Service accounts**: password atau key yang disimpan sebagai secrets

Setiap rotasi harus tercatat di `docs/ROTATION_LOG.md` (entry contoh ada di bagian akhir playbook).

---

## Pra-Rotasi (Checklist wajib)

- [ ] Ditetapkan `maintenance window` dan pemberitahuan ke tim terkait
- [ ] Backup DB & MinIO snapshot tersedia dan tervalidasi
- [ ] Kredensial lama disimpan di tempat aman (password manager) untuk rollback cepat
- [ ] Akses: operator punya `gh` CLI (GitHub secrets), akses ke host/docker, dan akses ke MinIO `mc` admin
- [ ] Dua orang (operator + reviewer) siap untuk konfirmasi langkah kritis
- [ ] Runbook ini tersedia dan dipahami oleh operator

---

## Rotasi — Langkah Umum (pattern)

1) Generate credential baru secara aman (password manager atau generator).
2) Perbarui secret di infrastruktur service (DB user, MinIO root, dsb).
3) Perbarui GitHub Actions secrets (atau secret store yang digunakan CI).
4) Deploy/restart service sehingga mengambil secret baru.
5) Verifikasi fungsi kritis (DB, file upload, auth, widget).
6) Jika sukses: catat rotasi ke `docs/ROTATION_LOG.md` dan komunikasikan.
7) Jika gagal: rollback segera ke kredensial lama dan investigasi.

Setiap bagian berikut memberi contoh perintah dan tips verifikasi.

---

## A. Generate secrets (contoh)

Rekomendasi panjang & entropy:
- Password DB / MinIO: 32+ karakter, kombinasi huruf besar/kecil, angka, simbol
- JWT key: 32–64 bytes (HS256) atau gunakan asymmetric keypair (RS256) untuk production

Contoh PowerShell (generate, simpan ke variable):

```powershell
# Generate secure secret (Base64) and copy to secure clipboard or vault
[Convert]::ToBase64String((1..32 | ForEach-Object {Get-Random -Minimum 0 -Maximum 256}) -as [byte[]])
```

Atau gunakan password manager (LastPass/1Password/Vault) untuk menyimpan hasil.

---

## B. Rotasi PostgreSQL (production)

Catatan: goal adalah mengubah password pengguna aplikasi (`pg_user`) tanpa kehilangan data.

Langkah:

1.  Siapkan `new_password` dan simpan secure.
2.  Gunakan session admin di Postgres (di host atau `psql`):

```bash
# masuk ke DB host atau container sebagai superuser
# contoh (Docker):
docker exec -it postgres-container psql -U postgres -d postgres

-- di psql:
ALTER USER prochatadmin WITH PASSWORD 'NEW_PASSWORD_HERE';
\q
```

3.  Verifikasi dari host aplikasi (sebelum restart) jika aplikasi mendukung connection-string override:

```bash
PGPASSWORD='NEW_PASSWORD_HERE' psql -h $PGHOST -U prochatadmin -d prochat_db -c '\conninfo'
```

4.  Update GitHub secret `DB_PASSWORD` (opsi manual atau `gh`):

```bash
# contoh dengan gh CLI (isi secret lewat stdin atau --body)
echo -n 'NEW_PASSWORD_HERE' | gh secret set DB_PASSWORD --body -
```

5.  Deploy/restart aplikasi agar mengambil secret baru (lihat deployment pipeline).

6.  Verifikasi setelah restart:

```bash
# cek koneksi dari container aplikasi
docker exec -it <app-container> bash -c "PGPASSWORD=\"$DB_PASSWORD\" psql -h $PGHOST -U $PGUSER -d $PGDATABASE -c '\\conninfo'"

# atau cek readiness endpoint
curl -sS http://127.0.0.1:8081/ready
```

Rollback (jika perlu):

- Kembalikan secret `DB_PASSWORD` di GitHub ke nilai lama dan redeploy.

Tips:

- Jika Anda tidak bisa menghubungkan setelah restart, jangan lakukan perubahan lain — rollback secrets dan redeploy.

---

## C. Rotasi MinIO

Catatan: Mengganti `MINIO_ROOT_PASSWORD` pada root user biasanya dilakukan dengan meng-update environment dan restart MinIO. Untuk user non-root, gunakan `mc admin user` jika tersedia.

Langkah (root user via env):

1.  Siapkan `NEW_MINIO_ROOT_USER` dan `NEW_MINIO_ROOT_PASSWORD`.
2.  Update environment di orchestrator (contoh: `docker-compose.yml` atau secret manager) untuk `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD`.
3.  Restart MinIO service:

```bash
docker-compose stop minio
docker-compose up -d minio
```

4.  Verifikasi menggunakan `mc`:

```bash
# set alias (contoh)
mc alias set local http://127.0.0.1:9000 MINIO_ROOT_USER NEW_MINIO_ROOT_PASSWORD
mc admin info local
mc ls local
```

Jika Anda tidak bisa restart root safely (mis. risiko kehilangan config), alternatifnya: buat user service baru dan tukar aplikasi agar menggunakan user tersebut, lalu cabut akses lama setelah validasi.

Rollback: kembalikan env ke nilai lama dan restart.

---

## D. Rotasi Widget / JWT Signing Key

Pertimbangan penting:

- Rotasi JWT secret mengakibatkan token yang ada menjadi tidak valid.
- Untuk meminimalkan gangguan, pertimbangkan rotate in two-phases: support both keys (old + new) for short window, atau gunakan token-versioning di DB.

Langkah singkat (single-key approach):

1.  Generate `NEW_JWT_SECRET` (HS256) atau generate RSA keypair (RS256).
2.  Update GitHub secret `JWT_SECRET` / `WIDGET_SIGNING_KEY`.
3.  Deploy server yang mengambil secret baru.
4.  Jika tidak ada dual-key support, sesi aktif akan terputus — komunikasikan kepada pengguna.

Safer approach (recommended):

- Implementasikan dual-key acceptance: server menerima token yang valid dengan `kid` header untuk 5–15 menit sambil issue token baru signed dengan `NEW_KEY`.
- Atumorization: jika app menyimpan `token_version` per user, bump `token_version` untuk force-logout selectively.

Verification:

```bash
# cek endpoint yang mengandalkan JWT
curl -sS -H "Authorization: Bearer <test-token-signed-with-new-key>" http://127.0.0.1:8081/api/health
```

---

## E. Rotasi GitHub / CI Tokens

Langkah:

1.  Buat token baru di GitHub (scopes terbatas sesuai kebutuhan).
2.  Update secret `GH_TOKEN_CI` di repository `Settings` > `Secrets`.
3.  Jika runner/registry memerlukan token, update environment di tempat yang relevan.
4.  Redeploy workflows / runners jika perlu.

Verifikasi:

```bash
# jalankan job CI manual atau trigger workflow smoke (mis. small job yang menggunakan token)
gh workflow run ci-smoke.yml
```

Rollback: kembalikan secret ke token lama sementara.

---

## Verifikasi Pasca-Rotasi (Checklist)

- [ ] `curl /ready` dari internal network → HTTP 200
- [ ] Migrations & seeds: `server` tidak log error saat migrasi berikutnya
- [ ] End-to-end: upload file kecil ke MinIO → lalu download dan compare checksum
- [ ] Authentication: login admin, login user flows, widget initialization
- [ ] Logs: periksa `server/ci/out/ci_server.log` dan `docker logs` untuk error
- [ ] Monitor: metrik error-rate dan latency 15 menit pasca-rotasi

Contoh perintah verifikasi singkat:

```bash
# readiness
curl -fS http://127.0.0.1:8081/ready

# db check
docker exec -it <app-container> bash -c "PGPASSWORD=\"$DB_PASSWORD\" psql -h $PGHOST -U $PGUSER -d $PGDATABASE -c '\\conninfo'"

# minio upload
mc cp /tmp/testfile local/bucket/testfile && mc cp local/bucket/testfile /tmp/testfile2 && sha256sum /tmp/testfile /tmp/testfile2
```

---

## Rollback Plan (fast path)

1.  Jika verifikasi kritis gagal, revert GitHub secrets ke nilai lama (quickest path).
2.  Redeploy pipeline immediately so services use old secrets.
3.  Notify stakeholders and keep service in degraded mode if necessary.
4.  After stabilization, collect logs and perform root-cause analysis before next attempt.

Notes:

- Jangan coba partial-rotate (mis. rotate DB tanpa update app secret) tanpa coordination.
- Jika rollback juga gagal, follow incident response (escalate to on-call).

---

## Audit & Logging — Catat Rotasi

Tambahkan entry ke `docs/ROTATION_LOG.md` setiap kali rotasi dilakukan. Template entry:

```
Date: 2025-11-13
Operator: @alice, Reviewer: @bob
Secrets rotated: DB_PASSWORD, MINIO_ROOT_PASSWORD, JWT_SECRET
Environment: production
Pre-checks: backups OK, maintenance window 15m
Rolling method: update GH secrets -> restart app -> verify
Verification: /ready OK, MinIO upload OK, no errors in server logs
Rollback: not needed
Notes: Rotasi tanpa downtime; widget sessions invalidated
```

---

## After-action & Recommendations

- Implementasikan dual-key JWT flow to reduce user disruption saat rotasi.
- Automate common steps with a vetted script that writes to secret manager and triggers a canary deploy.
- Schedule periodic rotations (90 days) and run drills in staging before production.

---

**SELESAI**
