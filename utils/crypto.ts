
import { MarriageRecord } from '../types';

export async function generateRecordHash(data: Partial<MarriageRecord>): Promise<string> {
  // Payload yang lebih komprehensif untuk keamanan arsip negara
  const payload = [
    data.husbandName,
    data.wifeName,
    data.marriageDate,
    data.nomorNB,
    data.nomorAkta,
    data.kecamatan,
    data.nomorBok,
    data.lokasiSimpan,
    data.extractedText?.substring(0, 1000)
  ].map(s => String(s || '').trim().toUpperCase()).join('|');
  
  const msgUint8 = new TextEncoder().encode(payload);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export async function verifyRecordIntegrity(record: MarriageRecord): Promise<boolean> {
  if (!record.hash) return false;
  const currentHash = await generateRecordHash(record);
  return currentHash === record.hash;
}
