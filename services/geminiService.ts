
import { GoogleGenAI, Type } from "@google/genai";

const getEnv = (key: string) => {
  const viteKey = `VITE_${key}`;
  if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key];
  if (typeof process !== 'undefined' && process.env && process.env[viteKey]) return process.env[viteKey];
  try {
    const metaEnv = (import.meta as any).env;
    if (metaEnv && metaEnv[viteKey]) return metaEnv[viteKey];
    if (metaEnv && metaEnv[key]) return metaEnv[key];
  } catch (e) {}
  return '';
};

const getAiClient = () => {
  const apiKey = getEnv('API_KEY');
  return new GoogleGenAI({ apiKey: apiKey });
};

export interface DocumentPart {
  data: string;
  mimeType: string;
}

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
            text: `Analisa dokumen Akta Nikah Indonesia. Ekstrak: husbandName, wifeName, marriageDate (YYYY-MM-DD), nomorNB, nomorAkta, fullText.`,
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
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("Respon AI kosong.");
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Gemini Error:", error);
    
    // Deteksi error spesifik dari Google
    const msg = error?.message || "";
    if (msg.includes("API key was reported as leaked")) {
      throw new Error("KEAMANAN: API Key Anda telah bocor dan diblokir oleh Google. Silakan buat API Key baru di AI Studio dan update di Vercel.");
    } else if (msg.includes("API key not found")) {
      throw new Error("Konfigurasi API Key tidak ditemukan. Pastikan variabel API_KEY sudah diset di Vercel.");
    }
    
    throw new Error(msg || "Gagal ekstraksi AI.");
  }
};
