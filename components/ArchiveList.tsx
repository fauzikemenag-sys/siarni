
import React, { useState, useEffect } from 'react';
import { MarriageRecord, User } from '../types';
import { KECAMATAN_JEMBER } from '../constants';
import { verifyRecordIntegrity } from '../utils/crypto';
import { db } from '../services/databaseService';

interface ArchiveListProps {
  records: MarriageRecord[];
  user: User;
}

const ArchiveList: React.FC<ArchiveListProps> = ({ records, user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKec, setSelectedKec] = useState(user.role === 'ADMIN_KABUPATEN' ? 'Semua' : user.kecamatan);
  const [viewRecord, setViewRecord] = useState<MarriageRecord | null>(null);
  const [integrityStatus, setIntegrityStatus] = useState<Record<string, boolean>>({});
  const [cloudSyncedStatus, setCloudSyncedStatus] = useState<Record<string, boolean>>({});
  const [previewMode, setPreviewMode] = useState<'DETAILS' | 'PRINT_PREVIEW'>('DETAILS');
  const [isProcessingWatermark, setIsProcessingWatermark] = useState(false);

  const isAdminKab = user.role === 'ADMIN_KABUPATEN';

  useEffect(() => {
    const checkAll = async () => {
      const iResults: Record<string, boolean> = {};
      const cResults: Record<string, boolean> = {};
      
      // Ambil data dari cloud untuk verifikasi keberadaan di server
      const cloudRecords = await db.getAllRecords();
      const cloudHashes = new Set(cloudRecords.map(r => r.hash));

      for (const record of records) {
        iResults[record.id] = await verifyRecordIntegrity(record);
        cResults[record.id] = cloudHashes.has(record.hash);
      }
      setIntegrityStatus(iResults);
      setCloudSyncedStatus(cResults);
    };
    if (records.length > 0) checkAll();
  }, [records]);

  const filtered = records.filter(r => {
    const term = searchTerm.toLowerCase();
    const matchSearch = 
      r.husbandName.toLowerCase().includes(term) || 
      r.wifeName.toLowerCase().includes(term) || 
      r.nomorAkta.toLowerCase().includes(term) || 
      r.nomorNB.toLowerCase().includes(term);
    const matchKec = selectedKec === 'Semua' || r.kecamatan === selectedKec;
    return matchSearch && matchKec;
  });

  const handlePrint = () => {
    window.print();
  };

  const downloadWithWatermark = (dataUrl: string, fileName: string) => {
    setIsProcessingWatermark(true);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = dataUrl;
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const fontSize = Math.round(canvas.width / 12);
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.fillStyle = "rgba(100, 100, 100, 0.2)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 4);
      
      for (let i = -3; i <= 3; i++) {
        for (let j = -4; j <= 4; j++) {
           ctx.fillText("SI-ARNI JEMBER", i * (fontSize * 6), j * (fontSize * 3));
        }
      }

      const link = document.createElement('a');
      link.download = `ARSIP_JEMBER_${fileName}`;
      link.href = canvas.toDataURL('image/jpeg', 0.9);
      link.click();
      setIsProcessingWatermark(false);
    };
  };

  const exportToCSV = () => {
    if (filtered.length === 0) return;
    const headers = ["No", "Suami", "Istri", "Kecamatan", "Nomor NB", "Nomor Akta", "Tahun", "Digital Signature"];
    const csvRows = filtered.map((r, i) => [
      i + 1,
      `"${r.husbandName.toUpperCase()}"`,
      `"${r.wifeName.toUpperCase()}"`,
      r.kecamatan,
      `'${r.nomorNB}`,
      `'${r.nomorAkta}`,
      r.tahun,
      r.hash
    ]);
    const watermarkFooter = ["", "", "", "", "", "", "OFFICIAL RECORD OF SI-ARNI JEMBER", `DICETAK PADA: ${new Date().toLocaleString()}`];
    const csvContent = [headers, ...csvRows, [], watermarkFooter].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Data_Arsip_Jember_${new Date().getTime()}.csv`);
    link.click();
  };

  const isPdf = (data: string) => data?.startsWith('data:application/pdf');

  const getVerifyLink = (hash: string) => {
    const base = window.location.origin + window.location.pathname;
    const cleanBase = base.endsWith('/') ? base : base + '/';
    return `${cleanBase}?verify=${hash}`;
  };

  const getQrUrl = (hash: string) => {
    const link = encodeURIComponent(getVerifyLink(hash));
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${link}`;
  };

  const openRecord = (record: MarriageRecord) => {
    setViewRecord(record);
    setPreviewMode('DETAILS');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-200 flex flex-col xl:flex-row gap-4 items-center justify-between no-print">
        <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto items-center">
          <div className="relative w-full md:w-96">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input
              type="text"
              placeholder="Cari Nama Pasangan..."
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-100 bg-slate-50 focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {isAdminKab && (
            <select
              className="w-full md:w-64 px-4 py-3.5 rounded-2xl border border-slate-100 bg-slate-50 focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-bold"
              value={selectedKec}
              onChange={(e) => setSelectedKec(e.target.value)}
            >
              <option value="Semua">Seluruh Jember</option>
              {KECAMATAN_JEMBER.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          )}
        </div>
        <button onClick={exportToCSV} className="px-8 py-3.5 bg-white text-slate-700 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-3">
          <i className="fas fa-file-csv text-emerald-500"></i> Export CSV
        </button>
      </div>

      <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden no-print">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-5 w-16 text-center">No</th>
                <th className="px-6 py-5">Arsip Akta Nikah</th>
                <th className="px-6 py-5">Kecamatan</th>
                <th className="px-6 py-5 text-center">Lokasi Simpan</th>
                <th className="px-6 py-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((record, index) => (
                <tr key={record.id} className="hover:bg-slate-50/80 transition-colors group cursor-pointer" onClick={() => openRecord(record)}>
                  <td className="px-6 py-5 text-center text-slate-400 font-mono text-xs">{index + 1}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3 mb-1">
                       <p className="font-bold text-slate-800 text-sm uppercase">{record.husbandName} & {record.wifeName}</p>
                       {!integrityStatus[record.id] && (
                          <span className="bg-red-500 text-white text-[7px] px-1.5 py-0.5 rounded font-black uppercase">Tampered</span>
                       )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium tracking-tight">Akta: {record.nomorAkta} | Tahun: {record.tahun}</p>
                  </td>
                  <td className="px-6 py-5 text-xs font-bold text-slate-600">{record.kecamatan}</td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-[8px] font-black text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200 uppercase">💻 Laptop (Lokal)</span>
                      {cloudSyncedStatus[record.id] ? (
                        <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 uppercase flex items-center gap-1">
                          <i className="fas fa-cloud"></i> Database Pusat (Sinkron)
                        </span>
                      ) : (
                        <span className="text-[8px] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100 uppercase flex items-center gap-1 animate-pulse">
                          <i className="fas fa-cloud-slash"></i> Belum Masuk Cloud
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-3">
                       <span className="opacity-0 group-hover:opacity-100 text-[9px] font-black text-emerald-500 uppercase transition-all">Lihat Detail</span>
                       <i className="fas fa-arrow-right text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all"></i>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic text-sm">Data tidak ditemukan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {viewRecord && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-50 flex items-center justify-center p-0 md:p-6 modal-overlay overflow-y-auto">
          <div className={`bg-white rounded-none md:rounded-[48px] shadow-2xl w-full max-w-7xl min-h-screen md:min-h-0 overflow-hidden flex flex-col printable-content border-t-[12px] border-emerald-500 transition-all ${previewMode === 'PRINT_PREVIEW' ? 'max-w-4xl' : ''}`}>
            
            <div className="p-6 bg-white border-b border-slate-100 flex justify-between items-center no-print">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-emerald-500/20">
                  <i className={previewMode === 'PRINT_PREVIEW' ? 'fas fa-print' : 'fas fa-file-contract'}></i>
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight">
                    {previewMode === 'PRINT_PREVIEW' ? 'Siap Cetak PDF' : 'Detail Arsip Digital'}
                  </h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em]">Kecamatan {viewRecord.kecamatan} • Jember</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setPreviewMode(previewMode === 'DETAILS' ? 'PRINT_PREVIEW' : 'DETAILS')} className="px-6 py-3 bg-emerald-50 text-emerald-700 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-100 transition-all">
                  {previewMode === 'DETAILS' ? 'Pratinjau Cetak' : 'Kembali ke Detail'}
                </button>
                <button onClick={handlePrint} className="bg-slate-900 text-white hover:bg-emerald-600 px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl flex items-center gap-3">
                  <i className="fas fa-print"></i> Cetak / Save PDF
                </button>
                <button onClick={() => setViewRecord(null)} className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>

            <div className={`flex-1 thin-scrollbar overflow-y-auto ${previewMode === 'PRINT_PREVIEW' ? 'bg-slate-100 p-12 flex justify-center' : 'p-10'}`}>
              
              {previewMode === 'PRINT_PREVIEW' ? (
                <div className="bg-white w-full max-w-[210mm] min-h-[297mm] p-[25mm] shadow-2xl relative printable-page border border-slate-200 overflow-hidden">
                   <div className="absolute inset-0 flex items-center justify-center opacity-[0.08] pointer-events-none select-none z-0 overflow-hidden print:opacity-[0.12]">
                      <div className="grid grid-cols-2 gap-x-64 gap-y-64 rotate-[-45deg]">
                        {[...Array(8)].map((_, i) => (
                           <span key={i} className="text-[50px] font-black uppercase tracking-[0.6em] whitespace-nowrap text-slate-900 border-[3px] border-slate-900 px-12 py-6">
                              SI-ARNI JEMBER
                           </span>
                        ))}
                      </div>
                   </div>

                   <div className="relative z-10">
                     <div className="mb-10 text-center border-b-[6px] border-double border-slate-900 pb-10">
                        <div className="flex items-center justify-center gap-4 mb-4">
                           <img src="https://www.freepnglogos.com/uploads/logo-kemenag-png/logo-kementerian-agama-gambar-logo-depag-png-0.png" className="w-16 h-16 grayscale contrast-150" />
                           <div>
                              <h1 className="text-[18px] font-black uppercase tracking-tight text-slate-900">Kementerian Agama Republik Indonesia</h1>
                              <h2 className="text-[15px] font-extrabold uppercase text-slate-800">Kantor Urusan Agama Kecamatan {viewRecord.kecamatan}</h2>
                              <p className="text-[11px] font-bold text-slate-600">Jl. Raya Kecamatan {viewRecord.kecamatan}, Kabupaten Jember, Jawa Timur</p>
                           </div>
                        </div>
                        <div className="mt-8 inline-block border-2 border-slate-900 px-12 py-2.5 text-[13px] font-black tracking-[0.4em] uppercase">
                          Lembar Kendali Arsip Digital
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-12 mb-12">
                        <div className="space-y-5">
                          <div>
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Identitas Pasangan</p>
                             <p className="text-[14px] font-black uppercase text-slate-900 leading-tight">{viewRecord.husbandName} & {viewRecord.wifeName}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                             <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">No. Akta</p>
                                <p className="text-[11px] font-bold text-slate-800">{viewRecord.nomorAkta}</p>
                             </div>
                             <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">No. NB</p>
                                <p className="text-[11px] font-bold text-slate-800">{viewRecord.nomorNB}</p>
                             </div>
                          </div>
                          <div>
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Penyimpanan Fisik</p>
                             <p className="text-[11px] font-bold text-slate-800 uppercase">{viewRecord.lokasiSimpan} • BOX: {viewRecord.nomorBok}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="p-3 border-[3px] border-slate-900 bg-white shadow-lg">
                            <img src={getQrUrl(viewRecord.hash)} className="w-28 h-28 grayscale" alt="QR" />
                          </div>
                          <p className="text-[8px] font-mono text-slate-500 mt-3 text-right break-all max-w-[180px] font-bold uppercase">{viewRecord.hash}</p>
                        </div>
                     </div>

                     <div className="space-y-12">
                       <h4 className="text-[11px] font-black text-slate-900 border-b-2 border-slate-900 pb-3 uppercase flex justify-between items-center tracking-widest">
                         <span>Lampiran Berkas Terarsip</span>
                         <span className="italic opacity-50">SI-ARNI JEMBER OFFICIAL COPY</span>
                       </h4>
                       {viewRecord.images?.map((file, i) => (
                          <div key={i} className="mb-12 break-inside-avoid border-2 border-slate-100 p-4 rounded-3xl relative bg-slate-50/30">
                             {isPdf(file) ? (
                               <div className="h-48 flex flex-col items-center justify-center bg-white border-2 border-dashed border-slate-200 rounded-2xl">
                                 <i className="fas fa-file-pdf text-4xl text-red-500 mb-3"></i>
                                 <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest">PDF Berkas Terlampir Secara Digital</p>
                                 <p className="text-[9px] text-slate-400 mt-1">Gunakan versi digital untuk akses penuh file PDF</p>
                               </div>
                             ) : (
                               <img src={file} className="w-full h-auto grayscale contrast-125 brightness-105 rounded-xl shadow-sm" alt={`Page ${i+1}`} />
                             )}
                             <div className="absolute bottom-6 right-6 px-4 py-1.5 bg-slate-900 text-white text-[9px] font-black rounded-full uppercase tracking-widest opacity-80">
                                Halaman {i+1}
                             </div>
                          </div>
                       ))}
                     </div>
                     
                     <div className="mt-20 pt-10 border-t border-slate-200 text-center">
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.3em]">Dicetak melalui Sistem Informasi SI-ARNI Kabupaten Jember</p>
                     </div>
                   </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  <div className="lg:col-span-4 space-y-8">
                    <div className="p-8 rounded-[48px] bg-slate-50 border border-slate-100 space-y-8 shadow-inner">
                      <div className="p-6 bg-white rounded-[32px] border border-slate-200 shadow-sm">
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 tracking-widest">Nama Pasangan</label>
                        <p className="text-lg font-black text-slate-800 uppercase leading-tight">{viewRecord.husbandName} & {viewRecord.wifeName}</p>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                         <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                           <label className="text-[10px] font-black text-slate-400 uppercase block mb-1 tracking-widest">Lokasi Fisik</label>
                           <p className="text-sm font-bold text-slate-700 uppercase">{viewRecord.lokasiSimpan}</p>
                           <p className="text-[10px] font-black text-emerald-600 mt-1 uppercase tracking-widest">Nomor BOX: {viewRecord.nomorBok}</p>
                         </div>
                         <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                           <label className="text-[10px] font-black text-slate-400 uppercase block mb-1 tracking-widest">Registrasi Akta</label>
                           <p className="text-sm font-bold text-slate-700">{viewRecord.nomorAkta}</p>
                           <p className="text-[10px] text-slate-400 mt-1">NB: {viewRecord.nomorNB}</p>
                         </div>
                      </div>
                    </div>
                    <div className="text-center bg-white p-10 rounded-[48px] border border-slate-100 shadow-xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">QR Verifikasi Keaslian</p>
                      <div className="inline-block p-6 bg-slate-50 rounded-[40px] border border-slate-100 mb-6">
                        <img src={getQrUrl(viewRecord.hash)} alt="QR" className="w-48 h-48" />
                      </div>
                      <p className="text-[9px] font-mono text-slate-400 break-all px-4 leading-relaxed uppercase font-bold">{viewRecord.hash}</p>
                    </div>
                  </div>

                  <div className="lg:col-span-8 space-y-12">
                    <div className="flex items-center justify-between">
                       <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                          <i className="fas fa-images text-emerald-500"></i> Lampiran Berkas Scan
                       </h4>
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{viewRecord.images?.length} Halaman Terupload</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {viewRecord.images?.map((file, i) => (
                        <div key={i} className="group space-y-4">
                          <div className="aspect-[3/4] bg-slate-100 rounded-[40px] overflow-hidden border-2 border-slate-200 relative shadow-lg transition-all group-hover:border-emerald-500/50 group-hover:shadow-emerald-500/10">
                            {isPdf(file) ? (
                              <div className="h-full flex flex-col items-center justify-center bg-white">
                                <i className="fas fa-file-pdf text-6xl text-red-500 mb-6 drop-shadow-lg"></i>
                                <p className="text-xs font-black uppercase text-slate-500 tracking-widest">Lampiran PDF Digital</p>
                              </div>
                            ) : (
                              <img src={file} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Scan" />
                            )}
                            <div className="absolute top-6 right-6 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white text-xs font-black">
                               {i+1}
                            </div>
                          </div>
                          
                          <div className="flex gap-3">
                            {!isPdf(file) ? (
                              <button 
                                disabled={isProcessingWatermark}
                                onClick={() => downloadWithWatermark(file, `Arsip_${viewRecord.nomorAkta}_Hal${i+1}.jpg`)}
                                className="flex-1 py-4 bg-emerald-500 text-white rounded-[20px] font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                              >
                                {isProcessingWatermark ? (
                                  <><i className="fas fa-circle-notch animate-spin"></i> Memproses...</>
                                ) : (
                                  <><i className="fas fa-download"></i> Unduh Berwatermark</>
                                )}
                              </button>
                            ) : (
                              <a href={file} download={`Arsip_${viewRecord.nomorAkta}.pdf`} className="flex-1 py-4 bg-red-500 text-white rounded-[20px] font-black text-[10px] uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2">
                                <i className="fas fa-file-pdf"></i> Unduh PDF Asli
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-slate-900 rounded-[48px] p-10 border border-slate-800 shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-10">
                         <i className="fas fa-microchip text-8xl text-emerald-500"></i>
                      </div>
                      <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                         <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                         Hasil Ekstraksi Gemini AI
                      </h4>
                      <div className="font-mono text-[12px] text-emerald-400/80 leading-relaxed whitespace-pre-wrap max-h-[400px] overflow-y-auto thin-scrollbar pr-4">
                        {viewRecord.extractedText || "Data ekstraksi tidak tersedia."}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .printable-content, .printable-content * { visibility: visible; }
          .printable-content { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; border: none !important; margin: 0 !important; padding: 0 !important; background: white !important; }
          .no-print { display: none !important; }
          .modal-overlay { background: white !important; padding: 0 !important; }
        }
      `}</style>
    </div>
  );
};

export default ArchiveList;
