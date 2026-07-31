# Panduan Modul Form Administrasi Otomatis SIAP PIDUM

## 1. Perubahan utama

Versi ini menambahkan menu **Buat Administrasi** untuk pengguna berperan Jaksa/administrator perkara.

Alur pengguna:

1. Buka menu **Buat Administrasi**.
2. Pilih **nama tersangka** dari dropdown. Nomor register ditampilkan di samping nama agar perkara dengan nama sama tidak tertukar.
3. Pilih jenis administrasi yang tersedia.
4. Sistem mengisi otomatis data yang sudah ada pada sheet `Cases` dan administrasi sebelumnya.
5. Administrator hanya melengkapi kolom yang masih kosong atau memang bersifat manual.
6. Klik **Simpan ... dan perbarui status**.
7. Data form disimpan ke Google Spreadsheet dan status perkara diperbarui otomatis.

Jenis form yang tersedia:

- P-1A — Tanda Terima Penerimaan SPDP
- P-16 — Surat Perintah Mengikuti Perkembangan Penyidikan
- P-1B — Tanda Terima Penerimaan Berkas Perkara
- P-24 — Nota Pendapat Hasil Penelitian Berkas Perkara
- P-19 — Petunjuk Mengenai Hal yang Harus Dilengkapi
- P-21 — Pemberitahuan Hasil Penyidikan Sudah Lengkap
- P-29 — Surat Dakwaan

Skema tiap form berada pada file `administration-forms.js` sehingga label, jenis input, sumber data otomatis, dan kewajiban pengisian dapat dikembangkan tanpa mengubah seluruh `app.js`.

## 2. Sumber pengisian otomatis

Field bertanda **AUTO** mengambil data dari:

- data perkara pada sheet `Cases`;
- pengguna yang sedang masuk;
- perhitungan sistem, misalnya selisih hari SPDP;
- administrasi yang telah dibuat sebelumnya, misalnya nomor P-16 atau nomor berkas pada P-1B.

Apabila sumber data otomatis kosong, field tidak dikunci dan administrator dapat melengkapinya secara manual. Field otomatis yang sudah memiliki nilai dikunci, kecuali pada field yang memang diizinkan untuk disunting.

## 3. Struktur Spreadsheet

### Sheet `Administrations`

Satu baris mewakili satu administrasi yang telah dibuat.

```text
administrationId | caseId | type | title | documentNumber | documentDate |
responsibleOfficer | notes | fileName | mimeType | fileSize | fileId |
fileUrl | createdBy | createdByName | createdAt | updatedAt | suspectName |
schemaVersion | fieldCount
```

### Sheet `AdministrationFields`

Satu baris mewakili satu field pada form administrasi. Model ini dipakai karena P-1A, P-16, P-24, dan P-29 mempunyai struktur field yang berbeda dan dapat berkembang.

```text
fieldId | administrationId | caseId | suspectName | type | fieldKey |
fieldLabel | fieldValue | fieldSource | sortOrder | createdAt
```

Relasi data:

```text
Cases.caseId
   └── Administrations.caseId
          └── AdministrationFields.administrationId
```

## 4. Pemetaan status otomatis

| Administrasi | Status perkara setelah disimpan |
|---|---|
| P-1A | `VERIFIKASI_SPDP` |
| P-16 | `P16_DITERBITKAN` |
| P-1B | `BERKAS_TAHAP_I_DITERIMA` |
| P-24 | `PENELITIAN_BERKAS` |
| P-19 | `P19_PENGEMBALIAN_BERKAS` |
| P-21 | `P21_LENGKAP` |
| P-29 | `PENUNTUTAN` |

Tenggat juga diperbarui otomatis:

- P-16: koordinasi awal 3 hari;
- P-19: penyidikan tambahan 14 hari;
- P-21: penyerahan tersangka dan barang bukti 14 hari.

## 5. Aturan tahapan

- P-16 dibuat setelah P-1A.
- P-1B dibuat setelah P-16.
- P-24 dibuat setelah P-1B.
- Setelah P-24, administrator memilih P-19 apabila berkas belum lengkap atau P-21 apabila berkas lengkap.
- P-21 tetap dapat dibuat setelah P-19 ketika hasil penyidikan tambahan telah lengkap.
- P-19 tidak dapat dibuat setelah P-21.
- P-29 dibuat setelah P-21.

## 6. Cara memasang pembaruan

1. Cadangkan Spreadsheet, folder Drive, dan project Apps Script saat ini.
2. Ganti isi backend dengan `apps-script/Code.gs` versi ini.
3. Pastikan frontend memuat file dengan urutan:

```html
<script src="config.js"></script>
<script src="administration-forms.js"></script>
<script src="app.js"></script>
```

4. Jalankan fungsi `setupProject()` sekali dari editor Apps Script.
5. Pastikan sheet `Administrations` dan `AdministrationFields` terbentuk serta header tidak diubah.
6. Buat deployment Apps Script versi baru.
7. Pastikan `APPS_SCRIPT_URL` pada `config.js` mengarah ke deployment `/exec` aktif.
8. Deploy ulang seluruh frontend ke Vercel.
9. Uji satu perkara contoh secara berurutan dari P-1A hingga P-29.

## 7. Pengujian minimum sebelum produksi

- Dropdown tersangka menampilkan nama dan nomor register yang benar.
- Data SPDP, Sprindik, penyidik, identitas tersangka, dan pasal terisi otomatis.
- Kolom otomatis yang kosong dapat dilengkapi manual.
- Administrasi tidak dapat dibuat sebelum prasyaratnya terpenuhi.
- Setelah penyimpanan, baris baru muncul pada `Administrations` dan beberapa baris field muncul pada `AdministrationFields`.
- Status dan tenggat pada `Cases` berubah sesuai jenis administrasi.
- Lampiran PDF/DOCX, bila dipilih, masuk ke folder Drive perkara.
- P-19 tidak tersedia setelah P-21.
- P-21 tetap tersedia setelah P-19.

## 8. Batas versi ini

Versi ini menyimpan **data form administrasi secara terstruktur** dan lampiran opsional. Versi ini belum menyusun file surat DOCX/PDF final secara otomatis dari template dan belum menyediakan tanda tangan elektronik. Untuk penggunaan produksi, format keluaran surat perlu melalui validasi pejabat hukum/administrasi instansi.
