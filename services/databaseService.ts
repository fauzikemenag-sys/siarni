
import { createClient } from '@supabase/supabase-js';
import { MarriageRecord } from '../types.ts';
import { STORAGE_KEY } from '../constants.ts';

const getEnv = (key: string) => {
  const viteKey = `VITE_${key}`;
  if (typeof process !== 'undefined' && process.env) {
    if (process.env[key]) return process.env[key];
    if (process.env[viteKey]) return process.env[viteKey];
  }
  try {
    const metaEnv = (import.meta as any).env;
    if (metaEnv) {
      if (metaEnv[viteKey]) return metaEnv[viteKey];
      if (metaEnv[key]) return metaEnv[key];
    }
  } catch (e) {}
  return '';
};

const SUPABASE_URL = getEnv('SUPABASE_URL');
const SUPABASE_KEY = getEnv('SUPABASE_ANON_KEY');

const isCloudEnabled = !!(
  SUPABASE_URL && 
  SUPABASE_KEY && 
  SUPABASE_URL.includes('supabase.co')
);

export const supabase = isCloudEnabled 
  ? createClient(SUPABASE_URL, SUPABASE_KEY) 
  : null;

export const db = {
  async getAllRecords(): Promise<MarriageRecord[]> {
    let cloudData: MarriageRecord[] = [];
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('marriage_records')
          .select('*')
          .order('createdAt', { ascending: false });
        if (error) throw error;
        if (data) cloudData = data as MarriageRecord[];
      }
    } catch (e) {
      console.error("Supabase fetch failed:", e);
    }

    // Gabungkan data Cloud dan Lokal tanpa duplikat
    const localSaved = localStorage.getItem(STORAGE_KEY);
    const localRecords = localSaved ? JSON.parse(localSaved) : [];
    
    // Gunakan hash sebagai identitas unik
    const allRecords = [...cloudData];
    const seenHashes = new Set(cloudData.map(r => r.hash));

    for (const lr of localRecords) {
      if (!seenHashes.has(lr.hash)) {
        allRecords.push(lr);
        seenHashes.add(lr.hash);
      }
    }

    return allRecords.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getRecordByHash(hash: string): Promise<MarriageRecord | null> {
    // 1. Prioritaskan Cloud (agar selalu up-to-date di semua device)
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('marriage_records')
          .select('*')
          .eq('hash', hash)
          .maybeSingle();
        if (!error && data) return data as MarriageRecord;
      } catch (e) {
        console.error("Cloud fetch error:", e);
      }
    }

    // 2. Fallback ke Lokal
    const localSaved = localStorage.getItem(STORAGE_KEY);
    if (localSaved) {
      const records = JSON.parse(localSaved) as MarriageRecord[];
      return records.find(r => r.hash === hash) || null;
    }
    return null;
  },

  async saveRecord(record: MarriageRecord): Promise<boolean> {
    // 1. Selalu simpan lokal dulu demi keamanan offline
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const records = saved ? JSON.parse(saved) : [];
      // Hindari duplikat di lokal
      if (!records.some((r: any) => r.hash === record.hash)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([record, ...records]));
      }
    } catch (e) {
      console.error("Local save failed", e);
    }

    // 2. Coba Sinkron Cloud
    if (supabase) {
      try {
        const { error } = await supabase.from('marriage_records').insert([record]);
        if (error) {
          console.error("Supabase Insert Error:", error.message);
          return false;
        }
        return true;
      } catch (e) {
        console.error("Cloud sync exception", e);
        return false;
      }
    }
    return false;
  },

  isOnline: () => isCloudEnabled
};
