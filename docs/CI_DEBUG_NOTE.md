## CI debug notes

Dokumentasi singkat untuk menyelidiki dan mengumpulkan artefak debugging CI pada repository ini.

Lokasi artefak dan marker
- Marker init DB yang ditulis oleh skrip init di container Postgres: `server/ci/out/ci-initdb-done`
- Direktori host yang dipasang ke container DB untuk diagnostics: `server/ci/out` (mount ke `/ci-out` di container)
- Lokasi artefak hasil unduhan lokal (tidak di-commit): `artifacts/run-<id>/`

File diagnostic utama yang dihasilkan oleh workflow
- `server/ci/out/ci-initdb-done` — menandakan skrip `ci-initdb.sh` dieksekusi, berisi timestamp.
- `psql-list.txt` — keluaran `psql -h 127.0.0.1 -U prochatadmin -c '\l'` yang menampilkan daftar database.
- `initd-list.txt` — daftar file di `/docker-entrypoint-initdb.d` di container DB.
- `infra-db-early.log`, `infra-all-early.log`, `db-inspect.json` — log dan dump `docker inspect` untuk container infra.

Cara cepat memeriksa run lokal (developer)
1. Jika kamu memicu workflow lewat PR/branch dan mengunduh artefak lokal, inspect folder `artifacts/run-<id>/` untuk file-file di atas.
2. Pastikan `server/ci/out/ci-initdb-done` ada dan berisi timestamp — kalau tidak ada, skrip init tidak berjalan atau tidak bisa menulis ke direktori mount.
3. Buka `psql-list.txt` dan periksa apakah database `prochat_db` ada. Jika tidak ada, migration step akan gagal dengan pesan seperti "prochat_db does not exist".

Langkah debugging yang disarankan jika migrasi gagal:

- Periksa artifacts: cari `ci-initdb-done`, `psql-list.txt`, `infra-db-early.log`.
- Periksa apakah workflow menjalankan `docker compose down -v` sebelum `up -d`. Jika tidak, volume lama bisa mencegah skrip init dieksekusi.
- Periksa permission mount `server/ci/out` pada host. CI job disarankan membuat dan `chmod 0777 server/ci/out` sebelum memulai container bila perlu.
- Jalankan `docker inspect` pada container DB untuk memeriksa mount bind/volume dan permission. Cari entri pada `Mounts`.

Contoh pemeriksaan cepat (lokal / dalam job CI)
```powershell
# cek file init scripts dalam container DB
docker compose exec -T db ls -la /docker-entrypoint-initdb.d

# cek marker pada host-mounted dir
ls -la server/ci/out
cat server/ci/out/ci-initdb-done

# cek daftar database via TCP (paksa host 127.0.0.1 untuk menghindari socket Unix)
psql -h 127.0.0.1 -U prochatadmin -c "\l"

# cek apakah Postgres siap
docker compose exec -T db pg_isready -U prochatadmin -d prochatadmin -h 127.0.0.1
```

Catatan operasional
- Workflow CI menulis artefak diagnostik besar hanya saat job gagal untuk mengurangi kebisingan. Namun ada satu job smoke yang tetap meng-upload artefak selalu untuk debugging cepat.
- Jangan commit artefak yang diunduh secara lokal. Folder `artifacts/` diabaikan oleh `.gitignore` proyek.

Jika perlu bantuan tambahan, sertakan artefak run yang diunduh (`artifacts/run-<id>`) dan saya bantu analisis lebih lanjut.

--
Ringkasan: marker `server/ci/out/ci-initdb-done` adalah indikator utama bahwa skrip init DB dijalankan dan berhasil menulis; cek `psql-list.txt` untuk konfirmasi database hadir sebelum migrasi berjalan.
