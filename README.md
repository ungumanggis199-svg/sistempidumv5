# SIAP PIDUM Kejaksaan Negeri Muna — Dashboard V3

Aplikasi web statis untuk membantu alur administrasi perkara pidana umum dari penerimaan SPDP hingga tahap persidangan. Frontend dapat langsung di-deploy ke Vercel. Backend menggunakan Google Apps Script, Google Spreadsheet, dan Google Drive.

## Fitur

- Dashboard dan daftar perkara menggunakan visual navy–gold bergaya editorial sesuai referensi `dashboard-pidum (1).jsx`.
- KPI perkara aktif, perkara lewat tenggat, tenggat ≤3 hari, serta perkara Tahap I ke atas dihitung langsung dari data.
- Indikator delapan tahapan perkara, pencarian register/tersangka, filter tahapan, dan tombol detail tetap terhubung ke data backend.

- Login berbasis peran: **Jaksa** dan **Penyidik**.
- Jaksa memperoleh dashboard, daftar perkara, tenggat waktu, dokumen, rekap penyidik, alur perkara, dan pengaturan.
- Penyidik hanya memperoleh form pengiriman SPDP.
- Form memuat identitas penyidik, data SPDP/Sprindik, identitas tersangka, barang bukti, pasal, dan uraian perkara.
- Unggah SPDP format PDF atau DOCX ke Google Drive.
- Tenggat otomatis awal:
  - koordinasi: 3 hari;
  - menunggu berkas Tahap I: 30 hari;
  - penyidikan tambahan/P-19: 14 hari;
  - penyerahan Tahap II setelah P-21: 14 hari.
- Peringatan otomatis apabila selisih tanggal Sprindik dengan SPDP diterima lebih dari 7 hari.
- Status perkara sampai pelimpahan ke Pengadilan Negeri dan persidangan.
- Nomor internal perkara ditampilkan sebagai **Nomor register perkara** pada daftar dan detail.
- Menu **Buat Administrasi** menyediakan dropdown nama tersangka dan form dinamis P-1A, P-16, P-1B, P-24, P-19, P-21, dan P-29.
- Data perkara dan administrasi sebelumnya mengisi field otomatis; administrator hanya melengkapi data yang belum tersedia.
- Setiap form disimpan sebagai data terstruktur pada sheet `Administrations` dan `AdministrationFields`, dengan lampiran PDF/DOCX opsional.
- Status perkara dan tenggat diperbarui otomatis setelah administrasi berhasil dibuat.
- P-19 dan P-21 diperlakukan sebagai cabang hasil P-24: P-19 untuk berkas belum lengkap, sedangkan P-21 untuk berkas lengkap.
- Username, password, nama, role, dan unit dibaca dari sheet **akses**; token sesi tetap ditandatangani HMAC dan aktivitas utama dicatat.

## Struktur folder

```text
kejari-muna-pidum/
├── index.html
├── styles.css
├── config.js
├── administration-forms.js
├── app.js
├── vercel.json
├── README.md
└── apps-script/
    ├── Code.gs
    └── appsscript.json
```

## A. Memasang backend Google Apps Script

1. Buka project Google Apps Script yang digunakan oleh aplikasi.
2. Ganti seluruh isi `Code.gs` dengan isi file `apps-script/Code.gs`.
3. Buka **Project Settings**, centang tampilan file manifest, lalu ganti `appsscript.json` dengan isi file yang disediakan.
4. Simpan.
5. Jalankan fungsi `setupProject()` satu kali dari editor. Untuk instalasi lama, jalankan kembali fungsi ini agar sheet **Administrations** dan **AdministrationFields** dibuat otomatis tanpa menghapus data perkara yang sudah ada.
6. Setujui izin akses Spreadsheet dan Google Drive.
7. Buka **Deploy > New deployment > Web app**.
8. Pilih **Execute as: Me**. Untuk akses pengguna, sesuaikan dengan kebijakan organisasi. Bila frontend publik harus dapat memanggil endpoint, deployment perlu dapat diakses oleh pengguna aplikasi.
9. Salin URL deployment yang berakhiran `/exec`.
10. Bila URL berubah, ganti nilai `APPS_SCRIPT_URL` pada `config.js`.

Konfigurasi awal pada kode sudah menggunakan:

- Spreadsheet ID: `1OCCl_rOodETdsdQRuBwxBMWZWO7LvqYv6Kbyw__UiCg`
- Drive Folder ID: `1k4NiHI47evCnGZJSa4Z29zzU3dSDuKJm`
- Apps Script URL: URL yang diberikan pada `config.js`.

### Pengaturan akun pada sheet `akses`

Buat atau gunakan sheet bernama **akses** dengan header tepat pada baris pertama:

```text
Username | password | Name | Role | Unit
```

Contoh isi:

```text
jaksa01    | RahasiaJaksa123    | La Ode Ahmad | Jaksa     | Seksi Tindak Pidana Umum
penyidik01 | RahasiaPenyidik123 | Wa Ode Sari  | Penyidik  | Satreskrim Polres Muna
```

Ketentuan:

- `Username` tidak boleh sama dengan akun lain.
- `password` dibandingkan langsung dengan isian login dan bersifat case-sensitive.
- `Role` hanya boleh berisi `Jaksa` atau `Penyidik`.
- Format kolom `Username` dan `password` sebaiknya **Plain text**, terutama bila memakai angka nol di depan.
- Menambah akun cukup dengan menambah baris baru pada sheet `akses`.
- Menghapus akun cukup dengan menghapus baris akun tersebut.

Akun juga dapat ditambahkan dari editor Apps Script:

```javascript
addUser(
  'jaksa02',
  'PasswordKuat',
  'Jaksa',
  'Nama Lengkap',
  'Seksi Tindak Pidana Umum'
);
```

Mengubah password:

```javascript
resetPassword('jaksa02', 'PasswordBaruYangKuat');
```

## B. Deploy frontend ke Vercel

### Melalui GitHub

1. Buat repository baru di GitHub.
2. Unggah seluruh isi folder `kejari-muna-pidum` ke root repository.
3. Di Vercel pilih **Add New > Project** lalu import repository tersebut.
4. Framework Preset dapat dibiarkan **Other**.
5. Tidak perlu Build Command untuk frontend HTML/CSS/JavaScript ini.
6. Klik **Deploy**.

### Melalui Vercel CLI

Dari folder project:

```bash
npm install -g vercel
vercel
vercel --prod
```

## C. Penggunaan

### Penyidik

1. Masuk dengan peran Penyidik.
2. Isi seluruh form.
3. Pilih dokumen SPDP PDF atau DOCX.
4. Klik **Kirim SPDP**.
5. Simpan nomor perkara aplikasi yang muncul.

### Jaksa / administrator perkara

1. Masuk dengan peran Jaksa.
2. Buka menu **Buat Administrasi** atau tekan **Buat** dari detail perkara.
3. Pilih nama tersangka; nomor register ditampilkan untuk membedakan perkara dengan nama yang sama.
4. Pilih jenis administrasi yang statusnya **siap dibuat**.
5. Periksa isian bertanda **AUTO**, lalu lengkapi field bertanda **MANUAL** atau data otomatis yang masih kosong.
6. Tambahkan lampiran PDF/DOCX bila tersedia.
7. Tekan **Simpan ... dan perbarui status**. Data field masuk ke Spreadsheet dan status/tenggat perkara diperbarui otomatis.
8. Urutan utama sistem adalah P-1A → P-16 → P-1B → P-24. Setelah P-24, pilih P-19 bila berkas belum lengkap atau P-21 bila berkas lengkap. P-29 tersedia setelah P-21.

## Catatan penting tentang ukuran file

Frontend tidak menetapkan batas ukuran buatan. Namun tidak ada unggahan yang benar-benar “tidak terbatas”. Google Apps Script dan layanan Google memiliki kuota, batas waktu eksekusi, serta batas teknis permintaan. Dokumen besar dapat gagal ketika dibaca sebagai Base64 atau ketika eksekusi backend melewati batas. Untuk penggunaan produksi dengan berkas sangat besar, gunakan arsitektur unggah resumable langsung ke Google Drive API atau penyimpanan objek khusus, disertai autentikasi organisasi.

## Catatan keamanan produksi

- Batasi siapa yang dapat mengakses deployment Apps Script sesuai kebijakan instansi.
- Jangan membagikan Spreadsheet dan folder Drive kepada publik karena sheet `akses` berisi kredensial login.
- Lakukan pengujian hak akses dengan akun Jaksa dan Penyidik yang berbeda.
- Gunakan akun Google Workspace instansi untuk kepemilikan Apps Script, Spreadsheet, dan Drive.
- Backup Spreadsheet dan folder Drive secara berkala.
- Lakukan audit kode dan uji penetrasi sebelum aplikasi menangani data perkara sebenarnya.

## Pengembangan lanjutan yang disarankan

- Nomor register resmi dan format surat otomatis.
- Notifikasi email/WhatsApp internal untuk tenggat.
- Riwayat status yang tampil pada detail perkara.
- Perluasan modul administrasi ke P-17, P-18, P-20, Tahap II, BA-4, BA-5, dan BA-5A.
- Generator surat berdasarkan template DOCX/PDF.
- Tanda tangan elektronik dan persetujuan berjenjang.
- Integrasi SSO Google Workspace.
- Backup basis data ke database terkelola untuk skala produksi.
