
import { createClient } from '@supabase/supabase-js';
import { MarriageRecord } from '../types.ts';
import { STORAGE_KEY } from '../constants.ts';

const getEnv = (key: string) => {
  // Coba akses langsung (untuk Vercel/Vite build)
  const viteKey = `VITE_${key}`;
  
  if (typeof process !== 'undefined' && process.env) {
    if (process.env[key]) return process.env[key];
    if (process.env[viteKey]) return process.env[viteKey];
  }

  // Jika menggunakan import.meta (Vite standar)
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

// Sangat penting: URL harus mengandung 'supabase.co' agar valid
const isCloudEnabled = !!(SUPABASE_URL && SUPABASE_KEY && SUPABASE_URL.includes('supabase.co'));

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
      console.error("Cloud fetch failed, using local fallback:", e);
    }
    
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  },

  async saveRecord(record: MarriageRecord): Promise<boolean> {
    // 1. Selalu simpan lokal dulu (Offline-first)
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const records = saved ? JSON.parse(saved) : [];
      localStorage.setItem(STORAGE_KEY, JSON.stringify([record, ...records]));
    } catch (e) {
      console.error("Local save failed:", e);
    }

    // 2. Jika cloud aktif, sinkronkan
    if (supabase) {
      try {
        const { error } = await supabase
          .from('marriage_records')
          .insert([record]);
        
        if (error) {
          console.warn("Supabase Sync Error:", error.message);
          return false;
        }
        return true;
      } catch (e) {
        console.error("Cloud sync failed:", e);
        return false;
      }
    }
    return true;
  },

  isOnline: () => isCloudEnabled
};
