# SI-ARNI Jember (Sistem Pengarsipan Akta Nikah)

Sistem informasi berbasis Hybrid Cloud untuk pengarsipan digital akta nikah di 31 kecamatan Kabupaten Jember. Menggunakan Gemini AI untuk ekstraksi data otomatis dan Supabase untuk penyimpanan data yang aman.

## 🚀 Panduan Deploy Cepat

### 1. Persiapan GitHub
Jika muncul error "Author identity unknown", jalankan:
```bash
git config --global user.email "email@anda.com"
git config --global user.name "Nama Anda"
```

Lalu upload kode:
```bash
git init
git add .
git commit -m "Deploy perbaikan build"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO-ANDA.git
git push -u origin main
```

### 2. Persiapan Supabase (Database)
1. Buat proyek di [Supabase](https://supabase.com).
2. Di **SQL Editor**, jalankan query untuk membuat tabel:
   ```sql
   CREATE TABLE marriage_records (
     id UUID PRIMARY KEY,
     husbandName TEXT,
     wifeName TEXT,
     marriageDate DATE,
     kecamatan TEXT,
     extractedText TEXT,
     images TEXT[],
     hash TEXT UNIQUE,
     createdAt TIMESTAMPTZ,
     uploadedBy TEXT,
     nomorNB TEXT,
     nomorAkta TEXT,
     mediaSimpan TEXT,
     jumlahLembar INT,
     tahun TEXT,
     jangkaSimpan TEXT,
     tingkatPerkembangan TEXT,
     nomorBok TEXT,
     lokasiSimpan TEXT
   );
   ```

### 3. Deploy ke Vercel
1. Login ke [Vercel](https://vercel.com) menggunakan akun GitHub.
2. **Import Project** dari repository yang tadi diupload.
3. Di bagian **Environment Variables**, masukkan:
   - `API_KEY`: (Kunci API Google Gemini)
   - `SUPABASE_URL`: (URL dari Supabase Settings > API)
   - `SUPABASE_ANON_KEY`: (Anon Public Key dari Supabase Settings > API)
4. Klik **Deploy**.

## 🛠️ Troubleshooting Build
**Q: Error "Could not resolve dependency" atau "peer react@... from qrcode.react"?**
*   **A:** Masalah ini disebabkan oleh ketidakcocokan versi React terbaru dengan pustaka QR Code. Solusinya sudah diterapkan di aplikasi ini dengan menambahkan file `.npmrc` yang berisi `legacy-peer-deps=true`. Jika Anda melakukan deploy manual, pastikan file tersebut ikut ter-upload.

**Q: Muncul pesan "The specified name is already used..."?**
*   **A:** Cukup ganti nama di kotak input "Private Repository Name" menjadi nama lain (contoh: `siarni-jember-app`) lalu klik **Create**.

## 🛡️ Fitur Keamanan
- **SHA-256 Digital Signature**: Memastikan data tidak dimanipulasi setelah disimpan.
- **Offline Fallback**: Tetap bisa menyimpan data ke LocalStorage jika koneksi internet terputus.
- **Image Compression**: Otomatis mengecilkan ukuran foto scan agar hemat storage cloud.

---
**Pemerintah Kabupaten Jember**
*Bidang Urusan Agama - Menuju Birokrasi Digital*
