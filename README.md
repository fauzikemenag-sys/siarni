
# SI-ARNI Jember (Sistem Pengarsipan Akta Nikah)

Sistem informasi berbasis Hybrid Cloud untuk pengarsipan digital akta nikah di 31 kecamatan Kabupaten Jember.

## 📋 Data Konfigurasi Vercel (Cheat Sheet)

Salin nilai di bawah ini ke tab **Environment Variables** di Vercel:

| Key | Value |
| :--- | :--- |
| **`API_KEY`** | `AIzaSyAcPMFedkLJTlmPkZ24-ZmFrsz6oYM0XHg` |
| **`SUPABASE_URL`** | `https://czhbmqhvawuhshaojllx.supabase.co` |
| **`SUPABASE_ANON_KEY`** | `sb_publishable_Lvj4J-ZiCVZZUJ3U9UEXrA_vdKf9gdd` |

---

## 🚀 Langkah Deploy Terakhir
1. Buka dashboard Vercel proyek Anda.
2. Masuk ke **Settings > Environment Variables**.
3. Masukkan ke-3 kunci di atas satu per satu (Klik **Add** setelah mengisi tiap baris).
4. Klik tab **Deployments**.
5. Klik **titik tiga (...)** pada deployment terbaru, pilih **Redeploy**.
6. Status di halaman Login aplikasi akan berubah menjadi **ONLINE** (Hijau/Biru).

---

## 🛠️ Database Setup (SQL Editor Supabase)
Pastikan Anda sudah menjalankan ini di SQL Editor Supabase:
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

## 🛡️ Fitur Keamanan
- **SHA-256 Digital Signature**: Memastikan data tidak dimanipulasi.
- **Offline Fallback**: Menyimpan lokal jika internet putus.
- **Gemini AI OCR**: Ekstraksi otomatis dari foto scan.

---
**Pemerintah Kabupaten Jember**
*Bidang Urusan Agama*
