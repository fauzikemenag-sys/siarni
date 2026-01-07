
/**
 * Kompresi gambar menggunakan HTML5 Canvas
 * Target: Lebar maks 1200px, Kualitas 0.7 JPEG
 */
export const compressImage = (dataUrl: string, maxWidth: number = 1200, quality: number = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Hitung proporsi resize
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error("Gagal mendapatkan context canvas"));
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Export ke format JPEG dengan kompresi kualitas
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };
    img.onerror = (err) => reject(err);
  });
};

/**
 * Menghitung estimasi ukuran file dari Base64 string (dalam KB)
 */
export const getBase64Size = (base64String: string): number => {
  const stringLength = base64String.length - (base64String.indexOf(',') + 1);
  const sizeInBytes = (stringLength * 3) / 4;
  return sizeInBytes / 1024;
};
