
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Fungsi pembantu untuk mengambil variabel lingkungan secara aman
 * di berbagai environment (Vercel, Vite, local).
 */
const getEnv = (key: string) => {
  const viteKey = `VITE_${key}`;
  
  if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key];
  if (typeof process !== 'undefined' && process.env && process.env[viteKey]) return process.env[viteKey];

  try {
    const metaEnv = (import.meta as any).env;
    if (metaEnv && metaEnv[viteKey]) return metaEnv[viteKey];
    if (metaEnv && metaEnv[key]) return metaEnv[key];
  } catch (e) {}
  
  try {
    const winProc = (window as any).process;
    if (winProc?.env && winProc.env[key]) return winProc.env[key];
    if (winProc?.env && winProc.env[viteKey]) return winProc.env[viteKey];
  } catch (e) {}

  return '';
};

const getAiClient = () => {
  const apiKey = getEnv('API_KEY');
  if (!apiKey) {
    console.warn("API_KEY tidak ditemukan di environment variables.");
  }
  return new GoogleGenAI({ apiKey: apiKey });
};

export interface DocumentPart {
  data: string;
  mimeType: string;
}

/**
 * Ekstrak data akta nikah menggunakan Gemini 3 Flash.
 * Dioptimalkan untuk dokumen Indonesia dan format tanggal.
 */
export const extractMarriageDataBatch = async (documents: DocumentPart[]) => {
  try {
    const ai = getAiClient();
    const documentParts = documents.map(doc => ({
      inlineData: {
        mimeType: doc.mimeType,
        data: doc.data.split(',')[1] || doc.data,
      },
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          ...documentParts,
          {
            text: `Analisa foto dokumen Akta Nikah/Buku Nikah dari Indonesia ini. 
            Ekstrak informasi berikut dengan akurat:
            1. Nama Lengkap Suami
            2. Nama Lengkap Istri
            3. Tanggal Pernikahan (konversi ke format YYYY-MM-DD, contoh: 03 Januari 2025 menjadi 2025-01-03)
            4. Nomor NB (Nomor Berkas/Perforasi di pojok)
            5. Nomor Akta Nikah (Nomor pendaftaran resmi)
            6. Transkrip lengkap teks yang ada di dokumen.

            PENTING: Jika ada informasi yang tidak terbaca, kosongkan saja stringnya (null/empty).`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            husbandName: { type: Type.STRING },
            wifeName: { type: Type.STRING },
            marriageDate: { type: Type.STRING },
            nomorNB: { type: Type.STRING },
            nomorAkta: { type: Type.STRING },
            fullText: { type: Type.STRING },
          },
          // Jangan buat field menjadi 'required' agar tidak error jika satu field tidak terbaca
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("AI memberikan respon kosong (mungkin terblokir filter keamanan)");
    
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Gemini Extraction Detail Error:", error);
    // Berikan pesan error yang lebih spesifik jika memungkinkan
    const errorMessage = error?.message || "Unknown AI Error";
    throw new Error(errorMessage);
  }
};
