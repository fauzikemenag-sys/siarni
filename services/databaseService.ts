import { createClient } from '@supabase/supabase-js';
import { MarriageRecord } from '../types.ts';
import { STORAGE_KEY } from '../constants.ts';

// Helper to access environment variables from various sources
const getEnv = (key: string) => {
  // Mencoba berbagai sumber variabel lingkungan (Vite/Browser/Vercel)
  // Fix: Cast import.meta to any to resolve property 'env' does not exist error in TypeScript environment
  return (
    process.env[key] || 
    ((import.meta as any).env?.[`VITE_${key}`]) || 
    (window as any)._env_?.[key] || 
    ''
  );
};

const SUPABASE_URL = getEnv('SUPABASE_URL');
const SUPABASE_KEY = getEnv('SUPABASE_ANON_KEY');

const isCloudEnabled = !!(SUPABASE_URL && SUPABASE_KEY);

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
      console.error("Gagal mengambil data dari Cloud:", e);
    }
    
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  },

  async saveRecord(record: MarriageRecord): Promise<boolean> {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const records = saved ? JSON.parse(saved) : [];
      localStorage.setItem(STORAGE_KEY, JSON.stringify([record, ...records]));
    } catch (e) {
      console.error("Gagal simpan lokal:", e);
    }

    if (supabase) {
      try {
        const { error } = await supabase
          .from('marriage_records')
          .insert([record]);
        
        return !error;
      } catch (e) {
        console.error("Gagal sinkronisasi ke Cloud:", e);
        return false;
      }
    }
    return true;
  },

  isOnline: () => isCloudEnabled
};