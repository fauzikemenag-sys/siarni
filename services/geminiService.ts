import { GoogleGenAI, Type } from "@google/genai";

// Standardized client initialization using direct process.env.API_KEY access
const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export interface DocumentPart {
  data: string;
  mimeType: string;
}

/**
 * Extract structured marriage record data from images using Gemini 3 Flash.
 * Follows the prescribed content structure and result extraction pattern.
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

    // Calling generateContent with the model name directly in parameters
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          ...documentParts,
          {
            text: "Analisa dokumen Akta Nikah ini. Ekstrak informasi berikut: Nama Suami, Nama Istri, Tanggal Nikah (YYYY-MM-DD), Nomor NB (biasanya di pojok atau bagian atas), Nomor Akta Nikah (Nomor pendaftaran), dan transkrip lengkap teksnya.",
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
          required: ["husbandName", "wifeName", "marriageDate", "nomorNB", "nomorAkta", "fullText"],
        },
      },
    });

    // Directly access the .text property as per updated SDK documentation
    const text = response.text;
    if (!text) throw new Error("AI returned empty response");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    throw error;
  }
};