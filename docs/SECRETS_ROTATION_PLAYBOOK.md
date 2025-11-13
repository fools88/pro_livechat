# Playbook Rotasi Kredensial

Dokumen ini berisi langkah-langkah teknis untuk merotasi semua kredensial sensitif yang digunakan oleh aplikasi, termasuk database, object storage, dan token pihak ketiga.

**Pemilik Dokumen**: Tim Operasi / Keamanan
**Terakhir Diperbarui**: 2025-11-13

---

## 1. Lingkup Kredensial

Kredensial berikut akan dirotasi dalam playbook ini:

| Servis / Komponen | Nama Secret (GitHub Secrets) | Lokasi Penggunaan | Dampak Rotasi |
| :--- | :--- | :--- | :--- |
| **PostgreSQL** | `DB_PASSWORD` | Koneksi database dari server | Downtime singkat saat server restart |
| **MinIO** | `MINIO_ROOT_PASSWORD` | Koneksi dari server untuk file sharing | Downtime singkat fitur file sharing |
| **Widget Token** | `WIDGET_SIGNING_KEY` | Validasi token widget | Sesi widget aktif akan terputus |
| **Admin Panel** | `ADMIN_PASSWORD_HASH` | Login admin (jika dikelola manual) | Admin harus login ulang |
| **GitHub Token** | `GH_TOKEN_CI` (contoh) | Akses CI/CD ke repositori | Job CI/CD akan gagal jika tidak diperbarui |

---

## 2. Checklist Pra-Rotasi

Sebelum memulai, pastikan semua item berikut terpenuhi:

- [ ] **Akses Administratif**: Anda memiliki akses root atau admin ke PostgreSQL dan MinIO.
- [ ] **Akses GitHub Secrets**: Anda memiliki izin untuk mengubah secrets di repositori GitHub.
- [ ] **Jendela Maintenance**: Komunikasikan jadwal maintenance kepada tim terkait. Durasi diperkirakan ~15 menit.
- [ ] **Rollback Plan**: Siapkan kredensial lama untuk rollback cepat jika terjadi kegagalan.
- [ ] **Verifikasi Tim**: Setidaknya dua orang terlibat dalam proses ini untuk validasi silang.
- [ ] **Backup**: Pastikan backup database dan data MinIO terbaru sudah ada.

---

## 3. Prosedur Rotasi Langkah-demi-Langkah

### Langkah A: Buat Kredensial Baru

1.  **Generate Password Baru**: Buat password yang kuat dan unik untuk setiap servis. Gunakan password manager atau generator.
    - **Contoh (PowerShell)**:
      ```powershell
      # Catat output ini dengan aman
      Add-Type -AssemblyName System.Web
      [System.Web.Security.Membership]::GeneratePassword(32, 4)
      ```

### Langkah B: Perbarui Kredensial di Infrastruktur

#### B.1. Rotasi Password PostgreSQL

1.  **Masuk ke Kontainer Postgres**:
    ```bash
    docker-compose exec -u postgres postgres bash
    ```
2.  **Jalankan `psql`**:
    ```bash
    psql
    ```
3.  **Ubah Password User**: Ganti `your_user` dan `new_strong_password` dengan nilai yang sesuai.
    ```sql
    ALTER USER your_user WITH PASSWORD 'new_strong_password';
    \q
    ```
4.  **Keluar dari Kontainer**: `exit`

#### B.2. Rotasi Password MinIO

1.  **Set Kredensial Baru via Environment**:
    - Hentikan MinIO: `docker-compose stop minio`
    - Perbarui file `docker-compose.yml` atau `.env` dengan `MINIO_ROOT_PASSWORD` yang baru.
    - Hapus volume MinIO untuk memaksa inisialisasi ulang (HANYA JIKA DATA BOLEH HILANG, jika tidak, gunakan `mc admin user password`).
    - Mulai ulang MinIO: `docker-compose up -d minio`
2.  **Cara Aman (Gunakan `mc` CLI)**:
    - Konfigurasi `mc` untuk menunjuk ke MinIO lokal Anda.
    - Jalankan perintah untuk mengubah password user:
      ```bash
      mc admin user password <ALIAS> <USERNAME> <NEW_PASSWORD>
      ```

### Langkah C: Perbarui GitHub Secrets

1.  **Navigasi ke Pengaturan Repositori**: Buka `Settings` > `Secrets and variables` > `Actions`.
2.  **Perbarui Secrets**: Klik `Update` untuk setiap secret yang relevan (`DB_PASSWORD`, `MINIO_ROOT_PASSWORD`, `WIDGET_SIGNING_KEY`) dan masukkan nilai baru yang sudah dibuat.
3.  **Simpan Perubahan**.

### Langkah D: Deploy Ulang Aplikasi

1.  **Picú CI/CD Workflow**: Buat commit baru atau jalankan workflow deploy secara manual.
    - Pastikan workflow tersebut mengambil secrets terbaru dari GitHub.
2.  **Restart Server**: Server akan mengambil variabel lingkungan baru saat dimulai ulang.

---

## 4. Prosedur Verifikasi Pasca-Rotasi

Setelah aplikasi di-deploy ulang, lakukan verifikasi berikut:

- [ ] **Koneksi Database**: Cek log server untuk memastikan tidak ada error koneksi ke database.
- [ ] **Fungsi File Sharing**: Coba unggah dan unduh file melalui aplikasi untuk memvalidasi koneksi MinIO.
- [ ] **Login Admin**: Pastikan admin bisa login dengan password baru (jika dirotasi).
- [ ] **Inisiasi Widget**: Buka halaman widget dan pastikan sesi baru bisa dibuat tanpa error token.
- [ ] **Monitor Log**: Pantau log aplikasi (`docker-compose logs -f server`) selama beberapa menit untuk anomali.

---

## 5. Rencana Rollback

Jika verifikasi gagal, segera lakukan langkah-langkah berikut:

1.  **Kembalikan GitHub Secrets**: Ubah nilai secrets di GitHub kembali ke kredensial lama.
2.  **Deploy Ulang**: Picú kembali workflow deployment.
3.  **Analisis Kegagalan**: Setelah sistem stabil, analisis akar masalah dari log dan metrik. Jangan mencoba rotasi lagi sebelum masalah teridentifikasi dan diperbaiki.

---

## 6. Otomatisasi (Saran untuk Masa Depan)

Untuk mengurangi risiko dan beban manual, pertimbangkan untuk membuat skrip otomatisasi.

- **Contoh Skrip (PowerShell - Konseptual)**:
  ```powershell
  # Skrip ini hanya contoh konseptual
  param($ServiceName)

  # 1. Generate password baru
  $NewPassword = [System.Web.Security.Membership]::GeneratePassword(32, 4)

  # 2. Update di infrastructure (mis. psql, mc admin)
  Invoke-PsqlCommand "ALTER USER ... '$NewPassword'"
  Invoke-McAdminCommand "user password ... $NewPassword"

  # 3. Update di GitHub Secrets via API
  gh secret set $ServiceName -b $NewPassword

  # 4. Trigger deployment
  gh workflow run deploy.yml

  Write-Host "Rotasi untuk $ServiceName selesai."
  ```

---
**SELESAI**
---
