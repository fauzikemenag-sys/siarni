
import { createClient } from '@supabase/supabase-js';
import { MarriageRecord } from '../types.ts';
import { STORAGE_KEY } from '../constants.ts';

/**
 * Mendeteksi variabel lingkungan dengan kompatibilitas tinggi untuk Vercel & Vite.
 * Mencari dengan prefix VITE_ maupun tanpa prefix.
 */
const getEnv = (key: string) => {
  const viteKey = `VITE_${key}`;
  
  // 1. Cek via process.env (Vercel Node environment injection)
  if (typeof process !== 'undefined' && process.env) {
    if (process.env[key]) return process.env[key];
    if (process.env[viteKey]) return process.env[viteKey];
  }

  // 2. Cek via import.meta.env (Vite client-side environment)
  try {
    const metaEnv = (import.meta as any).env;
    if (metaEnv) {
      if (metaEnv[viteKey]) return metaEnv[viteKey];
      if (metaEnv[key]) return metaEnv[key];
    }
  } catch (e) {}
  
  // 3. Cek via window.process (Fallback untuk sandbox environments)
  try {
    const winProc = (window as any).process;
    if (winProc?.env) {
      if (winProc.env[key]) return winProc.env[key];
      if (winProc.env[viteKey]) return winProc.env[viteKey];
    }
  } catch (e) {}

  return '';
};

const SUPABASE_URL = getEnv('SUPABASE_URL');
const SUPABASE_KEY = getEnv('SUPABASE_ANON_KEY');

// Verifikasi apakah URL dan Key valid untuk koneksi Cloud
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
      console.error("Supabase connection failed, using local storage:", e);
    }
    
    // Fallback ke LocalStorage jika cloud tidak tersedia
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  },

  async saveRecord(record: MarriageRecord): Promise<boolean> {
    // 1. Selalu simpan lokal dulu (Offline-first strategy)
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const records = saved ? JSON.parse(saved) : [];
      localStorage.setItem(STORAGE_KEY, JSON.stringify([record, ...records]));
    } catch (e) {
      console.error("LocalStorage save error:", e);
    }

    // 2. Sinkronkan ke Cloud Supabase jika aktif
    if (supabase) {
      try {
        const { error } = await supabase
          .from('marriage_records')
          .insert([record]);
        
        if (error) {
          console.error("Cloud Sync Error:", error.message);
          return false;
        }
        return true;
      } catch (e) {
        console.error("Cloud sync exception:", e);
        return false;
      }
    }
    return true;
  },

  isOnline: () => isCloudEnabled,
  getMissingKeys: () => {
    const missing = [];
    if (!SUPABASE_URL) missing.push('SUPABASE_URL');
    if (!SUPABASE_KEY) missing.push('SUPABASE_ANON_KEY');
    return missing;
  }
};
