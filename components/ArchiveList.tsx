
import React, { useState, useEffect } from 'react';
import { MarriageRecord, User } from '../types';
import { KECAMATAN_JEMBER } from '../constants';
import { verifyRecordIntegrity } from '../utils/crypto';

interface ArchiveListProps {
  records: MarriageRecord[];
  user: User;
}

const ArchiveList: React.FC<ArchiveListProps> = ({ records, user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKec, setSelectedKec] = useState(user.role === 'ADMIN_KABUPATEN' ? 'Semua' : user.kecamatan);
  const [viewRecord, setViewRecord] = useState<MarriageRecord | null>(null);
  const [integrityStatus, setIntegrityStatus] = useState<Record<string, boolean>>({});
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'DETAILS' | 'PRINT_PREVIEW'>('DETAILS');
  const [isProcessingWatermark, setIsProcessingWatermark] = useState(false);

  const isAdminKab = user.role === 'ADMIN_KABUPATEN';

  useEffect(() => {
    const checkAll = async () => {
      const results: Record<string, boolean> = {};
      for (const record of records) {
        results[record.id] = await verifyRecordIntegrity(record);
      }
      setIntegrityStatus(results);
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

  /**
   * Fungsi untuk menambahkan watermark ke gambar secara permanen (Baked-in)
   */
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

      // Gambar foto asli
      ctx.drawImage(img, 0, 0);

      // Konfigurasi Watermark
      const fontSize = Math.round(canvas.width / 15);
      ctx.font = `black ${fontSize}px sans-serif`;
      ctx.fillStyle = "rgba(0, 0, 0, 0.15)"; // Warna watermark abu-abu transparan
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Gambar Watermark Diagonal
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 4);
      
      // Gambar teks berulang
      for (let i = -2; i <= 2; i++) {
        for (let j = -3; j <= 3; j++) {
           ctx.fillText("SI-ARNI JEMBER", i * (fontSize * 8), j * (fontSize * 3));
        }
      }

      // Download hasilnya
      const link = document.createElement('a');
      link.download = `WATERMARKED_${fileName}`;
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

    // Tambahkan baris Watermark di akhir file CSV
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
      {/* Search & Filter */}
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

      {/* Table Section */}
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden no-print">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-5 w-16 text-center">No</th>
                <th className="px-6 py-5">Arsip Akta Nikah</th>
                <th className="px-6 py-5">Kecamatan</th>
                <th className="px-6 py-5 text-center">Status</th>
                <th className="px-6 py-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((record, index) => (
                <tr key={record.id} className="hover:bg-slate-50/80 transition-colors group cursor-pointer" onClick={() => openRecord(record)}>
                  <td className="px-6 py-5 text-center text-slate-400 font-mono text-xs">{index + 1}</td>
                  <td className="px-6 py-5">
                    <p className="font-bold text-slate-800 text-sm uppercase">{record.husbandName} & {record.wifeName}</p>
                    <p className="text-[10px] text-slate-400 font-medium">No. Akta: {record.nomorAkta}</p>
                  </td>
                  <td className="px-6 py-5 text-xs font-bold text-slate-600">{record.kecamatan}</td>
                  <td className="px-6 py-5 text-center">
                    {integrityStatus[record.id] ? (
                      <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">ASLI</span>
                    ) : (
                      <span className="text-[9px] font-black text-red-600 bg-red-50 px-3 py-1.5 rounded-full">INVALID</span>
                    )}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <i className="fas fa-chevron-right text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all"></i>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail / Preview */}
      {viewRecord && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-50 flex items-center justify-center p-0 md:p-6 modal-overlay">
          <div className={`bg-white rounded-none md:rounded-[48px] shadow-2xl w-full max-w-7xl max-h-screen md:max-h-[95vh] overflow-hidden flex flex-col printable-content border-t-[8px] border-emerald-500 transition-all ${previewMode === 'PRINT_PREVIEW' ? 'max-w-4xl' : ''}`}>
            
            <div className="p-6 bg-white border-b border-slate-100 flex justify-between items-center no-print">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-emerald-500/20">
                  <i className={previewMode === 'PRINT_PREVIEW' ? 'fas fa-search' : 'fas fa-file-invoice'}></i>
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight">
                    {previewMode === 'PRINT_PREVIEW' ? 'Pratinjau Lembar Cetak' : 'Detail Arsip Jember'}
                  </h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em]">KUA KECAMATAN {viewRecord.kecamatan}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setPreviewMode(previewMode === 'DETAILS' ? 'PRINT_PREVIEW' : 'DETAILS')} className="px-6 py-3 bg-emerald-50 text-emerald-700 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-100 transition-all">
                  {previewMode === 'DETAILS' ? 'Pratinjau Cetak' : 'Kembali ke Detail'}
                </button>
                <button onClick={handlePrint} className="bg-slate-900 text-white hover:bg-emerald-600 px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl">
                  Cetak (Watermarked PDF)
                </button>
                <button onClick={() => setViewRecord(null)} className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>

            <div className={`overflow-y-auto flex-1 thin-scrollbar ${previewMode === 'PRINT_PREVIEW' ? 'bg-slate-100 p-8 flex justify-center' : 'p-10'}`}>
              
              {previewMode === 'PRINT_PREVIEW' ? (
                <div className="bg-white w-full max-w-[210mm] min-h-[297mm] p-[20mm] shadow-2xl relative printable-page border border-slate-200 overflow-hidden">
                   
                   {/* WATERMARK DIGITAL SI-ARNI (VISIBILITAS TINGGI UNTUK PRINT) */}
                   <div className="absolute inset-0 flex items-center justify-center opacity-[0.12] pointer-events-none select-none z-0 overflow-hidden print:opacity-[0.15]">
                      <div className="grid grid-cols-2 gap-x-64 gap-y-64 rotate-[-45deg]">
                        {[...Array(6)].map((_, i) => (
                           <span key={i} className="text-[40px] font-black uppercase tracking-[0.5em] whitespace-nowrap text-slate-900 border-2 border-slate-900 px-10 py-4">
                              SI-ARNI JEMBER
                           </span>
                        ))}
                      </div>
                   </div>

                   <div className="relative z-10">
                     <div className="mb-10 text-center border-b-[6px] border-double border-slate-900 pb-8">
                        <h1 className="text-[16px] font-black uppercase tracking-tight text-slate-900">Kementerian Agama Republik Indonesia</h1>
                        <h2 className="text-[14px] font-extrabold uppercase text-slate-800 leading-tight">Kantor Urusan Agama Kecamatan {viewRecord.kecamatan}</h2>
                        <p className="text-[10px] font-bold text-slate-600 mt-1">Kabupaten Jember, Provinsi Jawa Timur</p>
                        <div className="mt-8 inline-block border-2 border-slate-900 px-10 py-2 text-[12px] font-black tracking-[0.4em] uppercase">
                          Lembar Kendali Arsip Digital
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-10 mb-10">
                        <div className="space-y-4">
                          <p className="text-[10px] font-bold"><span className="text-slate-400">PASANGAN:</span> <br/><span className="text-[12px] font-black uppercase">{viewRecord.husbandName} & {viewRecord.wifeName}</span></p>
                          <p className="text-[10px] font-bold"><span className="text-slate-400">NO. AKTA:</span> <br/>{viewRecord.nomorAkta}</p>
                          <p className="text-[10px] font-bold"><span className="text-slate-400">LOKASI FISIK:</span> <br/>{viewRecord.lokasiSimpan} / BOK {viewRecord.nomorBok}</p>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="p-2 border-2 border-slate-100 bg-slate-50">
                            <img src={getQrUrl(viewRecord.hash)} className="w-24 h-24" alt="QR" />
                          </div>
                          <p className="text-[7px] font-mono text-slate-400 mt-2 text-right break-all max-w-[150px]">{viewRecord.hash}</p>
                        </div>
                     </div>

                     <div className="space-y-10">
                       <h4 className="text-[10px] font-black text-slate-900 border-b-2 border-slate-900 pb-2 uppercase flex justify-between items-center">
                         <span>Lampiran Berkas (Terwatermark Otomatis)</span>
                         <span className="italic">SI-ARNI JEMBER OFFICIAL COPY</span>
                       </h4>
                       {viewRecord.images?.map((file, i) => (
                          <div key={i} className="mb-10 break-inside-avoid border border-slate-100 p-2 rounded-xl relative">
                             {isPdf(file) ? (
                               <div className="h-40 flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl">
                                 <i className="fas fa-file-pdf text-3xl text-red-500 mb-2"></i>
                                 <p className="text-[10px] font-black uppercase text-slate-400">PDF Terlampir Digital</p>
                               </div>
                             ) : (
                               <img src={file} className="w-full h-auto grayscale contrast-125 brightness-110" alt={`Page ${i+1}`} />
                             )}
                          </div>
                       ))}
                     </div>
                   </div>
                </div>
              ) : (
                /* DETAIL VIEW MODE */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  <div className="lg:col-span-4 space-y-6">
                    <div className="p-8 rounded-[40px] bg-slate-50 border border-slate-100 space-y-6">
                      <div className="p-5 bg-white rounded-3xl border border-slate-200">
                        <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Pasangan</label>
                        <p className="text-sm font-black text-slate-800 uppercase leading-snug">{viewRecord.husbandName} & {viewRecord.wifeName}</p>
                      </div>
                      <div className="bg-white p-5 rounded-3xl border border-slate-200">
                        <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Detail Fisik</label>
                        <p className="text-xs font-bold text-slate-700 uppercase">{viewRecord.lokasiSimpan} • BOK {viewRecord.nomorBok}</p>
                      </div>
                      <div className="bg-white p-5 rounded-3xl border border-slate-200">
                        <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Nomor NB / Akta</label>
                        <p className="text-xs font-bold text-slate-700">{viewRecord.nomorNB} / {viewRecord.nomorAkta}</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="inline-block p-4 bg-white rounded-3xl border border-slate-100 shadow-xl mb-4">
                        <img src={getQrUrl(viewRecord.hash)} alt="QR" className="w-40 h-40" />
                      </div>
                      <p className="text-[8px] font-mono text-slate-400 break-all px-10 uppercase">{viewRecord.hash}</p>
                    </div>
                  </div>

                  <div className="lg:col-span-8 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {viewRecord.images?.map((file, i) => (
                        <div key={i} className="space-y-3">
                          <div className="aspect-[3/4] bg-slate-100 rounded-[32px] overflow-hidden border-2 border-slate-200 relative group">
                            {isPdf(file) ? (
                              <div className="h-full flex flex-col items-center justify-center">
                                <i className="fas fa-file-pdf text-5xl text-red-500 mb-4"></i>
                                <p className="text-xs font-black uppercase text-slate-400">Lampiran PDF</p>
                              </div>
                            ) : (
                              <img src={file} className="w-full h-full object-cover" alt="Scan" />
                            )}
                          </div>
                          
                          {!isPdf(file) && (
                            <button 
                              disabled={isProcessingWatermark}
                              onClick={() => downloadWithWatermark(file, `Arsip_${viewRecord.nomorAkta}_Hal${i+1}.jpg`)}
                              className="w-full py-3.5 bg-emerald-50 text-emerald-700 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center justify-center gap-2"
                            >
                              {isProcessingWatermark ? (
                                <><i className="fas fa-circle-notch animate-spin"></i> Memproses...</>
                              ) : (
                                <><i className="fas fa-download"></i> Unduh Berwatermark</>
                              )}
                            </button>
                          )}
                          {isPdf(file) && (
                            <a href={file} download className="w-full py-3.5 bg-slate-100 text-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2 text-center">
                              <i className="fas fa-file-pdf"></i> Unduh PDF Asli
                            </a>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="bg-slate-900 rounded-[40px] p-8 border border-slate-800">
                      <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4">Ekstraksi Teks (Gemini AI)</h4>
                      <div className="font-mono text-[11px] text-emerald-400/70 leading-relaxed whitespace-pre-wrap max-h-[300px] overflow-y-auto thin-scrollbar">
                        {viewRecord.extractedText}
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
          .printable-content { position: absolute; left: 0; top: 0; width: 100%; border: none !important; margin: 0 !important; padding: 0 !important; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default ArchiveList;
