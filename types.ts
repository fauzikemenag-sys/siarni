
export type Role = 'ADMIN_KABUPATEN' | 'ADMIN_KECAMATAN';

export interface User {
  id: string;
  username: string;
  role: Role;
  kecamatan?: string;
}

export interface MarriageRecord {
  id: string;
  husbandName: string;
  wifeName: string;
  marriageDate: string;
  kecamatan: string;
  extractedText: string;
  images?: string[];
  hash: string;
  createdAt: string;
  uploadedBy: string;
  
  // Field Pengarsipan Formal Baru
  nomorNB: string;
  nomorAkta: string;
  mediaSimpan: string; // Misal: Digital & Fisik
  jumlahLembar: number;
  tahun: string;
  jangkaSimpan: string; // Default: "Permanen"
  tingkatPerkembangan: string; // Default: "Asli"
  nomorBok: string;
  lokasiSimpan: string;
}

export interface Stats {
  totalRecords: number;
  byKecamatan: Record<string, number>;
}
