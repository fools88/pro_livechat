Widget security quick-audit
==========================

Ringkasan temuan (widget/src/main.js):

- BACKEND_URL di-hardcode ke `http://localhost:8080`. Untuk produksi, widget harus menentukan backend melalui konfigurasi (mis. `window.PRO_CHAT_BACKEND`) agar host situs dapat mengarahkan ke URL yang benar.
- WIDGET_KEY diambil dari `window.PRO_CHAT_KEY` atau fallback ke `'FALLBACK_KEY'`. Fallback statis berbahaya: widget tidak boleh menggunakan static API key; gunakan short-lived tokens yang dikeluarkan oleh server bagi visitor yang valid.
- Tidak ada origin check di sisi klien; origin check harus diterapkan di server (validasi Origin header) dan widget harus meminta token yang hanya berlaku untuk origin tersebut.
- Socket queries mengirim `widgetKey` dan `fingerprint` di query string Socket.IO. Pastikan server tidak mengandalkan `widgetKey` statis untuk otorisasi; gunakan token JWT yang tervalidasi.

Rekomendasi perbaikan singkat:

1. Jangan gunakan fallback key statis. Hapus fallback atau tampilkan pesan bahwa widget belum terkonfigurasi.
2. Mintakan short-lived token ke server (via fetch ke endpoint `/api/widget/token?origin=...`) yang mengembalikan token JWT yang hanya berlaku beberapa menit dan hanya untuk origin tersebut.
3. Pastikan server memvalidasi `Origin`/`Referer` header sebelum menerbitkan token.
4. Jangan logkan isi pesan sensitif di client-side.

Contoh perubahan ringan di `widget/src/main.js`:

```diff
- const BACKEND_URL = 'http://localhost:8080';
- const WIDGET_KEY = window.PRO_CHAT_KEY || 'FALLBACK_KEY';
+ const BACKEND_URL = window.PRO_CHAT_BACKEND || (location.protocol + '//' + location.hostname + ':8080');
+ const WIDGET_KEY = window.PRO_CHAT_KEY || null; // require server-issued token in production
```

Langkah next (opsional saya kerjakan):
- Implement small change to require token (no fallback) and add code sample for requesting short-lived token.
- Add server endpoint `POST /api/widget/token` to issue token when origin allowed.
