Worktree archive removed from repository
=====================================

Ringkasan:
- Folder `worktree-main.ARCHIVE/` telah dihapus dari repository karena menimbulkan false-positives pada alat scan dan memperbesar ukuran clone.
- Backup zip dibuat dan disimpan di: `tmp/archives/worktree-main.ARCHIVE.zip`.

Alasan penghapusan:
- Arsip bukan bagian dari kode aktif. Menyimpan arsip besar di tip branch membuat review dan scanning menjadi berisik.
- Untuk kebutuhan historis atau audit, gunakan backup terpisah (S3, Google Drive, atau artifact store).

Jika perlu memulihkan arsip, unzip file backup yang ada di `tmp/archives` atau hubungi tim untuk restore dari commit sebelumnya.

Catatan: perubahan ini dibuat sebagai PR terpisah untuk memudahkan reviewer menilai kebersihan repo.
