
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
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('marriage_records')
          .select('*')
          .order('createdAt', { ascending: false });
        if (error) throw error;
        if (data) return data as MarriageRecord[];
      }
    } catch (e) {
      console.error("Supabase fail:", e);
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  },

  async getRecordByHash(hash: string): Promise<MarriageRecord | null> {
    // 1. Cek Lokal dulu
    const localSaved = localStorage.getItem(STORAGE_KEY);
    if (localSaved) {
      const records = JSON.parse(localSaved) as MarriageRecord[];
      const found = records.find(r => r.hash === hash);
      if (found) return found;
    }

    // 2. Cek Cloud (Penting agar HP bisa lihat data dari Laptop)
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('marriage_records')
          .select('*')
          .eq('hash', hash)
          .single();
        if (!error && data) return data as MarriageRecord;
      } catch (e) {
        console.error("Cloud fetch error:", e);
      }
    }
    return null;
  },

  async saveRecord(record: MarriageRecord): Promise<boolean> {
    // Simpan lokal
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const records = saved ? JSON.parse(saved) : [];
      localStorage.setItem(STORAGE_KEY, JSON.stringify([record, ...records]));
    } catch (e) {}

    // Sinkron Cloud
    if (supabase) {
      try {
        const { error } = await supabase.from('marriage_records').insert([record]);
        return !error;
      } catch (e) {
        return false;
      }
    }
    return true;
  },

  isOnline: () => isCloudEnabled
};
