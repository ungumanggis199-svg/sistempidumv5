# Deploy langsung SIAP PIDUM Dashboard V3

## Frontend Vercel
1. Unggah seluruh isi folder ini ke root repository GitHub.
2. Import repository di Vercel.
3. Framework Preset: **Other**.
4. Build Command dan Output Directory dikosongkan.
5. Klik **Deploy**.

## Backend Google Apps Script
1. Salin `apps-script/Code.gs` ke project Apps Script.
2. Salin `apps-script/appsscript.json` ke manifest.
3. Jalankan `setupProject()` satu kali.
4. Deploy sebagai Web app.
5. Tempel URL `/exec` ke `config.js` pada `APPS_SCRIPT_URL`.
6. Deploy ulang frontend apabila URL berubah.

## Konfigurasi
File `config.js` sudah memuat URL dan ID dari versi proyek sebelumnya. Periksa kembali sebelum produksi.
