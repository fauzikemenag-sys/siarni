
import React, { useState, useRef } from 'react';
import { User, MarriageRecord } from '../types.ts';
import { extractMarriageDataBatch, DocumentPart } from '../services/geminiService.ts';
import { generateRecordHash } from '../utils/crypto.ts';
import { compressImage, getBase64Size } from '../utils/imageUtils.ts';
import { db } from '../services/databaseService.ts';
import { v4 as uuidv4 } from 'uuid';

interface UploadSectionProps {
  user: User;
  onSuccess: (record: MarriageRecord) => void;
}

interface FilePreview {
  name: string;
  type: string;
  data: string;
  isImage: boolean;
  originalSize: number;
  compressedSize: number;
}

const UploadSection: React.FC<UploadSectionProps> = ({ user, onSuccess }) => {
  const [status, setStatus] = useState<'IDLE' | 'COMPRESSING' | 'EXTRACTING' | 'SAVING' | 'SUCCESS'>('IDLE');
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [syncWarning, setSyncWarning] = useState(false);
  const [lastUploaded, setLastUploaded] = useState<MarriageRecord | null>(null);
  const [formData, setFormData] = useState({
    husbandName: '',
    wifeName: '',
    marriageDate: '',
    nomorNB: '',
    nomorAkta: '',
    mediaSimpan: 'Kertas & Digital',
    jumlahLembar: 4,
    nomorBok: '',
    lokasiSimpan: `KUA ${user.kecamatan}`,
  });
  const [extractedText, setExtractedText] = useState('');
  const [filePreviews, setFilePreviews] = useState<FilePreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setFormData({
      husbandName: '',
      wifeName: '',
      marriageDate: '',
      nomorNB: '',
      nomorAkta: '',
      mediaSimpan: 'Kertas & Digital',
      jumlahLembar: 4,
      nomorBok: '',
      lokasiSimpan: `KUA ${user.kecamatan}`,
    });
    setExtractedText('');
    setFilePreviews([]);
    setStatus('IDLE');
    setErrorDetail(null);
    setSyncWarning(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;
    const selectedFiles = files.slice(0, 4);

    setErrorDetail(null);
    const newPreviews: FilePreview[] = [];
    const loadFile = (file: File): Promise<string> => new Promise(res => {
      const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(file);
    });

    setStatus('COMPRESSING');
    try {
      const documentsForAI: DocumentPart[] = [];
      for (const file of selectedFiles) {
        let b64 = await loadFile(file);
        const isImage = file.type.startsWith('image/');
        const originalSize = getBase64Size(b64);
        let compressedSize = originalSize;

        if (isImage) {
          b64 = await compressImage(b64);
          compressedSize = getBase64Size(b64);
        }
        newPreviews.push({ name: file.name, type: file.type, data: b64, isImage, originalSize, compressedSize });
        documentsForAI.push({ data: b64, mimeType: isImage ? 'image/jpeg' : file.type });
      }
      setFilePreviews(newPreviews);
      
      setStatus('EXTRACTING');
      const result = await extractMarriageDataBatch(documentsForAI);
      setFormData(prev => ({
        ...prev,
        husbandName: result.husbandName || '',
        wifeName: result.wifeName || '',
        marriageDate: result.marriageDate || '',
        nomorNB: result.nomorNB || '',
        nomorAkta: result.nomorAkta || '',
      }));
      setExtractedText(result.fullText || '');
    } catch (err: any) {
      console.error(err);
      setErrorDetail(err.message || "Gagal ekstraksi AI.");
    } finally {
      setStatus('IDLE');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.husbandName || !formData.wifeName || !formData.nomorAkta) {
      alert("Lengkapi data minimal (Nama Pasangan & Nomor Akta)!");
      return;
    }

    setStatus('SAVING');
    try {
      const recordData: Partial<MarriageRecord> = {
        ...formData,
        kecamatan: user.kecamatan || 'Umum',
        extractedText: extractedText || `Arsip Akta Nikah: ${formData.husbandName} & ${formData.wifeName}`,
        tahun: formData.marriageDate ? formData.marriageDate.substring(0, 4) : new Date().getFullYear().toString(),
        jangkaSimpan: 'Permanen',
        tingkatPerkembangan: 'Asli',
      };

      const digitalHash = await generateRecordHash(recordData);

      const newRecord: MarriageRecord = {
        id: uuidv4(),
        ...recordData as any,
        images: filePreviews.map(p => p.data), 
        hash: digitalHash,
        createdAt: new Date().toISOString(),
        uploadedBy: user.username,
      };

      const isSynced = await db.saveRecord(newRecord);
      setSyncWarning(!isSynced);
      setLastUploaded(newRecord);
      setStatus('SUCCESS');
      onSuccess(newRecord);
    } catch (err) {
      alert("Gagal menyimpan.");
      setStatus('IDLE');
    }
  };

  if (status === 'SUCCESS') {
    return (
      <div className="max-w-2xl mx-auto py-16 animate-in zoom-in duration-500">
        <div className="bg-white p-12 rounded-[48px] shadow-2xl border border-emerald-100 text-center relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-full h-3 ${syncWarning ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
          <div className={`w-24 h-24 ${syncWarning ? 'bg-amber-500' : 'bg-emerald-500'} text-white rounded-full flex items-center justify-center text-5xl mx-auto mb-8 shadow-xl ring-8 ${syncWarning ? 'ring-amber-50' : 'ring-emerald-50'}`}>
            <i className={syncWarning ? "fas fa-exclamation-circle" : "fas fa-check"}></i>
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-2 uppercase tracking-tight">
            {syncWarning ? 'Arsip Lokal Disimpan' : 'Sukses Disimpan!'}
          </h2>
          
          {syncWarning ? (
            <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 mb-8 text-left">
              <p className="text-amber-800 font-bold text-sm mb-2">⚠️ Peringatan Sinkronisasi Cloud</p>
              <p className="text-amber-600 text-xs leading-relaxed">
                Data berhasil disimpan di Laptop, tetapi <b>GAGAL</b> dikirim ke Database Pusat. 
                Data ini tidak akan muncul di HP/Firefox sampai masalah koneksi atau izin (Policy) Supabase diperbaiki.
              </p>
            </div>
          ) : (
            <p className="text-slate-500 font-medium mb-8 italic">Berkas pasangan <span className="text-emerald-600 font-bold uppercase">{lastUploaded?.husbandName} & {lastUploaded?.wifeName}</span> telah terarsip secara digital di Cloud.</p>
          )}

          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-8 text-left space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Digital Signature</span>
              <span className="text-[9px] text-slate-700 font-mono break-all">{lastUploaded?.hash}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button onClick={resetForm} className="px-8 py-4 bg-slate-100 text-slate-700 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all text-xs">
              Input Baru
            </button>
            <button onClick={() => window.location.reload()} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-emerald-600 transition-all text-xs">
              Lihat Daftar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200">
        <h2 className="text-xl font-black text-slate-800 mb-6 uppercase tracking-tight flex items-center gap-3">
          <i className="fas fa-file-upload text-emerald-500"></i>
          Pencatatan & Upload Arsip Akta Nikah
        </h2>
        
        {errorDetail && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-4 text-red-600 animate-in slide-in-from-top-2">
            <i className="fas fa-exclamation-triangle text-xl"></i>
            <div className="flex-1">
              <p className="text-xs font-black uppercase tracking-widest">Gagal Ekstraksi AI</p>
              <p className="text-[11px] font-medium mt-1">{errorDetail}</p>
            </div>
            <button onClick={() => setErrorDetail(null)} className="ml-auto text-red-400 hover:text-red-600"><i className="fas fa-times"></i></button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div 
              className={`border-2 border-dashed rounded-[32px] p-6 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[350px] ${
                filePreviews.length > 0 ? 'border-emerald-200 bg-emerald-50/10' : 'border-slate-200 hover:border-emerald-400 bg-slate-50'
              }`}
              onClick={() => status === 'IDLE' && fileInputRef.current?.click()}
            >
              {filePreviews.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 w-full h-full">
                  {filePreviews.map((p, i) => (
                    <div key={i} className="aspect-[4/3] bg-white rounded-2xl border border-slate-200 overflow-hidden relative group shadow-sm">
                      {p.isImage ? <img src={p.data} className="w-full h-full object-cover" /> : <div className="h-full flex flex-col items-center justify-center bg-red-50 text-red-500"><i className="fas fa-file-pdf text-4xl mb-2"></i><span className="text-[10px] font-black uppercase">PDF READY</span></div>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-10">
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-4">
                    <i className="fas fa-cloud-arrow-up"></i>
                  </div>
                  <p className="font-black text-slate-700 uppercase tracking-widest text-sm">Pilih Berkas Scan</p>
                  <p className="text-[11px] text-slate-400 mt-2 font-medium uppercase">Maksimal 4 Halaman (PNG/JPG/PDF)</p>
                </div>
              )}
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,application/pdf" multiple />
            </div>

            <div className="bg-slate-900 rounded-[32px] p-8 text-emerald-400 font-mono text-[11px] overflow-y-auto max-h-[350px] border border-slate-800 shadow-2xl">
              <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-3">
                <p className="text-white font-black uppercase tracking-[0.2em] text-[10px]">Log Analisa Gemini AI</p>
              </div>
              {status === 'EXTRACTING' ? (
                <div className="space-y-4">
                  <p className="animate-pulse">Sedang menganalisa dokumen...</p>
                </div>
              ) : extractedText ? (
                 <div className="whitespace-pre-wrap leading-relaxed opacity-80">{extractedText}</div>
              ) : (
                <p className="text-slate-500 italic mt-10 text-center uppercase tracking-widest text-[9px]">Menunggu berkas...</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5">
               <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Nama Suami</label>
                <input type="text" value={formData.husbandName} onChange={e => setFormData({...formData, husbandName: e.target.value})} className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 outline-none text-sm font-bold uppercase transition-all" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Nama Istri</label>
                <input type="text" value={formData.wifeName} onChange={e => setFormData({...formData, wifeName: e.target.value})} className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 outline-none text-sm font-bold uppercase transition-all" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Nomor NB</label>
                <input type="text" value={formData.nomorNB} onChange={e => setFormData({...formData, nomorNB: e.target.value})} className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 outline-none text-sm font-bold transition-all" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Nomor Akta</label>
                <input type="text" value={formData.nomorAkta} onChange={e => setFormData({...formData, nomorAkta: e.target.value})} className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 outline-none text-sm font-bold transition-all" />
              </div>
            </div>

            <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 space-y-5">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Nomor BOK</label>
                <input type="text" value={formData.nomorBok} onChange={e => setFormData({...formData, nomorBok: e.target.value})} className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 outline-none text-sm font-bold transition-all" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Lokasi Simpan</label>
                <input type="text" value={formData.lokasiSimpan} onChange={e => setFormData({...formData, lokasiSimpan: e.target.value})} className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 outline-none text-sm font-bold transition-all" />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={status !== 'IDLE' || filePreviews.length === 0}
            className="w-full bg-slate-900 hover:bg-emerald-600 text-white font-black py-6 rounded-[24px] transition-all shadow-2xl disabled:bg-slate-100 disabled:text-slate-300 flex items-center justify-center gap-4 text-sm uppercase tracking-[0.2em]"
          >
            {status === 'SAVING' ? "MENYIMPAN..." : "Simpan Arsip Digital Jember"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadSection;
