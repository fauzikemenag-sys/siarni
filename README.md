
# SI-ARNI Jember (Sistem Pengarsipan Akta Nikah)

Sistem informasi berbasis Hybrid Cloud untuk pengarsipan digital akta nikah di 31 kecamatan Kabupaten Jember.

## 📋 Konfigurasi Environment Variables (Vercel)

Aplikasi membutuhkan 3 kunci utama agar data bisa tersinkronisasi antara Laptop dan HP (Cloud). Masukkan kunci ini di Settings Vercel Anda:

| Key | Cara Mendapatkan di Supabase / AI Studio |
| :--- | :--- |
| **`SUPABASE_URL`** | Buka Supabase > Project Settings > API. Cari bagian **Project URL**. |
| **`SUPABASE_ANON_KEY`** | Buka Supabase > Project Settings > API. Cari label **`anon` `public`** (yang berawalan `eyJ...`). |
| **`API_KEY`** | Buka [Google AI Studio](https://aistudio.google.com/) > Get API Key. |

---

## 🚀 Mengapa Data Saya Tidak Muncul di HP?
Jika Anda sudah upload di Laptop tapi tidak muncul saat scan QR di HP, itu karena **Cloud DB masih OFFLINE**. 
1. Pastikan `SUPABASE_URL` dan `SUPABASE_ANON_KEY` sudah terisi di Vercel.
2. Lakukan **Redeploy** di Vercel setelah mengubah variabel.
3. Login kembali di Laptop. Pastikan muncul indikator hijau **"Cloud Active"** di pojok kiri atas dashboard.
4. Upload ulang berkasnya saat status sudah "Cloud Active".

---

## 🛠️ Database Setup (SQL Editor Supabase)
Pastikan Anda sudah menjalankan perintah ini di **SQL Editor** Supabase agar tabel tersedia:
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

---
**Pemerintah Kabupaten Jember**
*Bidang Urusan Agama*
