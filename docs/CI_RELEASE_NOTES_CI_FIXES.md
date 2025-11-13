CI fixes & verification — 2025-11-13

Ringkasan singkat:

- Perbaikan CI pipeline untuk menghilangkan masalah DB auth dan membuat debugging lebih mudah.

Perubahan teknis yang dibuat:

1. docker-compose.ci.yml
   - Interpolasi credential ke environment container (`${DB_PASSWORD}`, `${MINIO_ROOT_PASSWORD}`, dll.) sehingga nilai yang diberikan lewat GitHub Actions secrets digunakan oleh container.

2. .github/workflows/ci-e2e-clean.yml
   - Memperpanjang waktu tunggu readiness (shared wait -> 120s) untuk mengurangi flaky.
   - Upload artifact startup logs unconditionally: upload seluruh folder `server/ci/out/**` untuk menangkap `ci_server.log`, `ps.txt`, `netstat/ss.txt`, dan lainnya.
   - Menambahkan placeholder `server/ci/out/ci_server.log` sebelum server start agar langkah upload tidak menghasilkan `noop` warning.
   - Menambahkan smoke checks singkat: cek `GET /ready` dan coba `http://127.0.0.1:9000/minio/health/ready` (tolerant, tidak gagal-kan CI jika MinIO tidak tersedia).
   - Pastikan `PGHOST/PGPORT/PGUSER/PGPASSWORD` diekspor sebelum menulis `server/ci/out/db-env.txt` sehingga file debug berisi nilai environment.

3. server/tools/seed_admin.js
   - Menghindari pencetakan password plaintext dan menjadikan seeder idempotent.

Verifikasi:

- Beberapa run CI berhasil setelah perbaikan:
  - run `19329884400` — migrations & seed berhasil (artifacts: `migrate-output/migrate.log`, `seed_admin.log`)
  - run `19330603286` — success; artifacts captured under `tmp_artifacts_19330603286/`
  - run `19330895582` — success; artifacts captured under `tmp_artifacts_19330895582/`

Rekomendasi next steps:

- (Optional) Add small smoke-tests to further validate MinIO upload and widget token issuance (implemented in PR #35 as tolerant check).
- If rotating production secrets, follow documented playbook `docs/SECRETS_ROTATION_PLAYBOOK.md` and coordinate rollout.

Catatan audit:

- Semua perubahan dibuat di cabang terpisah dan diajukan sebagai PR (#33, #34, #35). PR terkait:
  - #33: fix/ci-compose-env — interpolate DB/MinIO creds
  - #34: fix/ci-upload-log-wildcard — upload entire `server/ci/out/**` + placeholder
  - #35: fix/add-smoke-tests — add basic smoke checks

Jika ingin, saya bisa membuat ringkasan changelog singkat di release notes project atau menambahkan checklist deploy untuk production rotation.
