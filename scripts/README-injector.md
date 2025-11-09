# README: Injector untuk Rollup Visualizer (dashboard)

Dokumentasi singkat cara menggunakan skrip injector yang mengisi `gzipLength` ke file hasil `rollup-plugin-visualizer`.

Lokasi skrip:
- `scripts/gzip-sizes.js` — menghitung ukuran gzip dari folder aset build (menggunakan Node + zlib).
- `scripts/inject-gzip-into-visualizer.js` — membaca `tmp/dashboard-visualizer.html`, mem-parsing `const data = {...}` yang dihasilkan visualizer, lalu mengisi `data.nodeParts[*].gzipLength` berdasarkan hasil `gzip-sizes`.

Langkah lokal (Windows, cmd.exe):

1. Pastikan sudah menjalankan build analisis (agar `tmp/dashboard-visualizer.html` dibuat):

```cmd
cd dashboard
npm run analyze
cd ..
```

> `npm run analyze` pada `dashboard/package.json` adalah shortcut yang mengeksekusi `set "ANALYZE=true" && vite build --sourcemap` pada Windows.

2. Hitung ukuran gzip untuk aset build:

```cmd
node scripts/gzip-sizes.js dashboard/dist/assets > tmp/dashboard-sizes.txt
```

File output `tmp/dashboard-sizes.txt` berisi baris-baris dengan path aset dan ukuran gz (contoh singkat):
```
...\dashboard\dist\assets\vendor_react-XXX.js	490549 bytes	gz:133835 bytes
```

Skrip sudah mendeteksi file teks yang mungkin dikodekan UTF-16LE (mis. jika disalin dari artefak CI di Windows) dan akan mendekode otomatis.

3. Injeksikan ukuran gzip ke visualizer:

```cmd
node scripts/inject-gzip-into-visualizer.js tmp/dashboard-visualizer.html tmp/dashboard-sizes.txt
```

- Skrip akan mencoba dua strategi pencocokan:
  1. Jika `data.nodeParts[*].id` berisi path/module, ia akan mencocokkan basename file dan menulis `gzipLength`.
  2. Jika visualizer menggunakan bentuk baru, skrip akan membaca `data.nodeMetas[*].moduleParts` yang memetakan asset -> node UID, lalu mengisi `data.nodeParts[UID].gzipLength`.

Setelah sukses, buka `tmp/dashboard-visualizer.html` di browser untuk melihat peta treemap dengan ukuran `gzipLength` yang terisi.

Troubleshooting singkat
- Jika `Updated entries: 0` muncul, periksa:
  - Apakah `tmp/dashboard-sizes.txt` berisi baris untuk file hashed yang sama seperti yang tertulis di visualizer (basename harus cocok)?
  - Apakah `tmp/dashboard-visualizer.html` baru saja di-regenerate? Jika tidak, jalankan `npm run analyze` di folder `dashboard`.
- Jika file sizes berasal dari artefak CI dan berformat UTF-16LE, skrip `inject-gzip-into-visualizer.js` sudah mendeteksi dan mendekode otomatis.

Integrasi CI (ringkasan)
- Workflow CI bisa menjalankan `npm run analyze` pada job `dashboard`, lalu:
  - Jalankan `node scripts/gzip-sizes.js dashboard/dist/assets` untuk menghasilkan ukuran.
  - Jalankan `node scripts/inject-gzip-into-visualizer.js tmp/dashboard-visualizer.html tmp/dashboard-sizes.txt` untuk menghasilkan visualizer yang sudah diberi ukuran.
  - Upload `tmp/dashboard-visualizer.html` sebagai artifact untuk ditinjau.

Jika Anda ingin, saya bisa menambahkan template GitHub Actions (job) yang menjalankan langkah-langkah di atas dan meng-upload `tmp/dashboard-visualizer.html`.
