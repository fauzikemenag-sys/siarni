
# SI-ARNI Jember (Sistem Pengarsipan Akta Nikah)

Sistem informasi berbasis Hybrid Cloud untuk pengarsipan digital akta nikah di 31 kecamatan Kabupaten Jember.

## 📋 Konfigurasi Environment Variables (Vercel)

Untuk menjalankan aplikasi ini, Anda **WAJIB** mengisi Environment Variables di dashboard Vercel. Jangan membagikan kunci ini kepada siapapun.

| Key | Deskripsi | Link Dapatkan Kunci |
| :--- | :--- | :--- |
| **`API_KEY`** | Google Gemini AI Key | [Dapatkan di AI Studio](https://aistudio.google.com/) |
| **`SUPABASE_URL`** | URL Project Supabase Anda | [Dashboard Supabase](https://supabase.com/) |
| **`SUPABASE_ANON_KEY`** | API Key Anon Supabase | [Dashboard Supabase](https://supabase.com/) |

---

## 🚀 Langkah Perbaikan Jika API Key "Leaked"
1. Buka [Google AI Studio](https://aistudio.google.com/).
2. Buat **API Key baru**.
3. Masuk ke Dashboard Vercel > **Settings > Environment Variables**.
4. Update nilai `API_KEY` dengan kunci yang baru.
5. Pergi ke tab **Deployments**, klik titik tiga pada deployment terakhir, lalu pilih **Redeploy**.

---

## 🛠️ Database Setup (SQL Editor Supabase)
Jalankan perintah ini di SQL Editor Supabase untuk membuat tabel:
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
