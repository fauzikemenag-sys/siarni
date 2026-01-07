
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

  const handlePrint = () => {
    window.print();
  };

  const isPdf = (data: string) => data?.startsWith('data:application/pdf');

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
      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between no-print">
        <div className="relative w-full md:w-96">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input
            type="text"
            placeholder="Cari Nama Pasangan atau Nomor Akta..."
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-100 bg-slate-50 focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {isAdminKab && (
          <select
            className="w-full md:w-64 px-4 py-3.5 rounded-2xl border border-slate-100 bg-slate-50 focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-bold cursor-pointer"
            value={selectedKec}
            onChange={(e) => setSelectedKec(e.target.value)}
          >
            <option value="Semua">Seluruh Jember</option>
            {KECAMATAN_JEMBER.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        )}
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden no-print">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">
                <th className="px-6 py-5 w-16 text-center">No</th>
                <th className="px-6 py-5">Identitas Arsip</th>
                <th className="px-6 py-5">No. NB / Akta</th>
                <th className="px-6 py-5 text-center">Tahun</th>
                <th className="px-6 py-5 text-center">Media</th>
                <th className="px-6 py-5 text-center">Bok</th>
                <th className="px-6 py-5 text-right">Keaslian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((record, index) => (
                <tr key={record.id} className="hover:bg-slate-50/80 transition-colors cursor-pointer group" onClick={() => openRecord(record)}>
                  <td className="px-6 py-5 text-center text-slate-400 font-mono text-xs">{index + 1}</td>
                  <td className="px-6 py-5">
                    <p className="font-bold text-slate-800 text-sm group-hover:text-emerald-600 transition-colors uppercase">{record.husbandName} & {record.wifeName}</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-wider">KUA Kecamatan {record.kecamatan}</p>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-xs font-bold text-slate-600">NB: {record.nomorNB}</p>
                    <p className="text-[10px] text-slate-400 font-medium">Akta: {record.nomorAkta}</p>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="text-xs font-black text-slate-700">{record.tahun}</span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex justify-center gap-1.5">
                      {record.images?.map((img, i) => (
                        <i key={i} className={`fas ${isPdf(img) ? 'fa-file-pdf text-red-500' : 'fa-image text-blue-500'} text-[11px]`}></i>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center text-xs font-mono font-bold text-slate-500">{record.nomorBok || '-'}</td>
                  <td className="px-6 py-5 text-right">
                    {integrityStatus[record.id] ? (
                      <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                        <i className="fas fa-shield-check"></i> TERVERIFIKASI
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-red-600 bg-red-50 px-3 py-1.5 rounded-full border border-red-100 animate-pulse">
                        <i className="fas fa-triangle-exclamation"></i> MANIPULASI
                      </span>
                    )}
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
          <div className={`bg-white rounded-none md:rounded-[48px] shadow-2xl w-full max-w-7xl max-h-screen md:max-h-[95vh] overflow-hidden flex flex-col printable-content border-t-[8px] border-emerald-500 transition-all duration-300 ${previewMode === 'PRINT_PREVIEW' ? 'max-w-4xl' : ''}`}>
            
            {/* Modal Header */}
            <div className="p-6 bg-white border-b border-slate-100 flex justify-between items-center no-print">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-emerald-500/20">
                  <i className={previewMode === 'PRINT_PREVIEW' ? 'fas fa-search' : 'fas fa-file-invoice'}></i>
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight uppercase">
                    {previewMode === 'PRINT_PREVIEW' ? 'Pratinjau Lembar Cetak' : 'Detail Arsip Jember'}
                  </h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em]">KUA KECAMATAN {viewRecord.kecamatan}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {previewMode === 'DETAILS' ? (
                   <button onClick={() => setPreviewMode('PRINT_PREVIEW')} className="px-6 py-3 bg-emerald-50 text-emerald-700 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center gap-2">
                    <i className="fas fa-eye"></i> Mode Pratinjau
                  </button>
                ) : (
                  <button onClick={() => setPreviewMode('DETAILS')} className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2">
                    <i className="fas fa-arrow-left"></i> Kembali
                  </button>
                )}
                
                <button onClick={handlePrint} className="bg-slate-900 text-white hover:bg-emerald-600 px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl flex items-center gap-3">
                  <i className="fas fa-print"></i> Cetak Berkas
                </button>
                <button onClick={() => setViewRecord(null)} className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all text-slate-500">
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className={`overflow-y-auto flex-1 thin-scrollbar ${previewMode === 'PRINT_PREVIEW' ? 'bg-slate-100 p-8 flex justify-center' : 'p-10 md:p-14'}`}>
              
              {previewMode === 'PRINT_PREVIEW' ? (
                <div className="bg-white w-full max-w-[210mm] min-h-[297mm] p-[20mm] shadow-2xl relative printable-page border border-slate-200">
                   <div className="mb-10 text-center border-b-[6px] border-double border-slate-900 pb-8">
                      <h1 className="text-[16px] font-black uppercase tracking-tight text-slate-900">Kementerian Agama Republik Indonesia</h1>
                      <h2 className="text-[14px] font-extrabold uppercase text-slate-800 leading-tight">Kantor Urusan Agama Kecamatan {viewRecord.kecamatan}</h2>
                      <p className="text-[10px] font-bold text-slate-600 mt-1">Kabupaten Jember, Provinsi Jawa Timur</p>
                      <div className="mt-8 inline-block border-2 border-slate-900 px-10 py-2 text-[12px] font-black tracking-[0.4em] uppercase bg-slate-50">
                        Lembar Kendali Arsip
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-10 mb-10">
                      <div className="space-y-5">
                        <div className="border-l-4 border-slate-900 pl-4 py-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Pasangan</label>
                          <p className="text-[12px] font-black text-slate-900 uppercase leading-snug">{viewRecord.husbandName} &<br/>{viewRecord.wifeName}</p>
                        </div>
                        <div className="border-l-4 border-slate-200 pl-4 py-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Nomor Akta Nikah</label>
                          <p className="text-[11px] font-bold text-slate-700">{viewRecord.nomorAkta}</p>
                        </div>
                        <div className="border-l-4 border-slate-200 pl-4 py-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Informasi Box</label>
                          <p className="text-[11px] font-bold text-slate-700">{viewRecord.lokasiSimpan} / BOK {viewRecord.nomorBok || '-'}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="p-3 border-2 border-slate-100 rounded-2xl bg-slate-50">
                          <img src={getQrUrl(viewRecord.hash)} className="w-28 h-28" alt="QR" />
                        </div>
                        <p className="text-[7px] font-mono text-slate-400 mt-3 max-w-[150px] text-right break-all uppercase leading-tight">{viewRecord.hash}</p>
                      </div>
                   </div>

                   <div className="space-y-10">
                     <h4 className="text-[10px] font-black text-slate-900 border-b-2 border-slate-900 pb-2 uppercase tracking-[0.2em] flex justify-between">
                       <span>Lampiran Digital Berkas</span>
                       <span className="text-[9px] font-bold text-slate-400">{viewRecord.images?.length || 0} Halaman</span>
                     </h4>
                     {viewRecord.images?.map((file, i) => (
                        <div key={i} className="mb-10 break-inside-avoid border border-slate-100 p-2 rounded-xl">
                           <div className="text-[8px] font-black text-slate-400 mb-3 uppercase tracking-widest flex justify-between">
                              <span>Halaman {i + 1}</span>
                              <span className="italic">{isPdf(file) ? 'FORMAT: PDF' : 'FORMAT: GAMBAR'}</span>
                           </div>
                           {isPdf(file) ? (
                             <div className="aspect-[4/3] w-full border-2 border-dashed border-slate-300 flex flex-col items-center justify-center bg-slate-50 rounded-2xl">
                               <i className="fas fa-file-pdf text-4xl text-red-500 mb-3 opacity-30"></i>
                               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Berkas PDF Terlampir Digital</p>
                               <p className="text-[8px] text-slate-300 mt-1">Verifikasi QR untuk melihat file asli</p>
                             </div>
                           ) : (
                             <img src={file} className="w-full h-auto grayscale contrast-125" alt={`Page ${i+1}`} />
                           )}
                        </div>
                     ))}
                   </div>

                   <div className="mt-20 flex justify-between page-break-before-auto">
                     <div className="text-center w-1/3">
                        <p className="text-[10px] font-bold text-slate-500">Petugas KUA,</p>
                        <div className="h-16 flex items-center justify-center opacity-10">
                          <i className="fas fa-signature text-4xl"></i>
                        </div>
                        <p className="text-[10px] font-black text-slate-900 uppercase border-b-2 border-slate-900 inline-block px-4">{viewRecord.uploadedBy}</p>
                     </div>
                     <div className="text-center w-1/3">
                        <p className="text-[10px] font-bold text-slate-500">Jember, {new Date().toLocaleDateString('id-ID', {dateStyle: 'long'})}</p>
                        <p className="text-[10px] font-bold text-slate-500 mt-1">Saksi Arsip,</p>
                        <div className="h-16"></div>
                        <p className="text-[10px] font-black text-slate-900 uppercase border-b-2 border-slate-900 inline-block px-8">________________</p>
                     </div>
                   </div>
                </div>
              ) : (
                /* DETAIL VIEW MODE */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-14">
                  <div className="lg:col-span-4 space-y-10">
                    <div className="p-8 rounded-[40px] bg-slate-50 border border-slate-100 space-y-8 shadow-inner">
                      <div className="space-y-6">
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase block tracking-[0.2em] mb-2">Pasangan Terdaftar</label>
                          <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm">
                            <p className="text-sm font-black text-slate-800 uppercase leading-snug">{viewRecord.husbandName}</p>
                            <div className="w-10 h-1 bg-emerald-500 my-3"></div>
                            <p className="text-sm font-black text-slate-800 uppercase leading-snug">{viewRecord.wifeName}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white p-4 rounded-2xl border border-slate-200">
                            <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Nomor NB</label>
                            <p className="text-xs font-bold text-slate-700">{viewRecord.nomorNB}</p>
                          </div>
                          <div className="bg-white p-4 rounded-2xl border border-slate-200">
                            <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Nomor Akta</label>
                            <p className="text-xs font-bold text-slate-700">{viewRecord.nomorAkta}</p>
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-200">
                          <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Penyimpanan Fisik</label>
                          <p className="text-xs font-bold text-slate-700 uppercase tracking-tight">{viewRecord.lokasiSimpan} • BOK {viewRecord.nomorBok || '-'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6 text-center">
                      <div className="inline-block p-5 bg-white rounded-[40px] border-4 border-slate-50 shadow-2xl">
                        <img src={getQrUrl(viewRecord.hash)} alt="QR" className="w-[180px] h-[180px]" />
                      </div>
                      <div className="px-6">
                        <p className="text-[10px] font-black text-slate-800 uppercase tracking-[0.3em] mb-2">Digital Fingerprint</p>
                        <p className="text-[8px] font-mono text-slate-400 break-all leading-relaxed uppercase bg-slate-50 p-3 rounded-xl border border-slate-100">{viewRecord.hash}</p>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-8 space-y-12">
                    <div className="space-y-6">
                      <h4 className="text-[11px] font-black text-slate-400 uppercase flex items-center gap-3 no-print tracking-widest">
                        <i className="fas fa-file-shield text-emerald-500"></i> Lampiran Dokumen ({viewRecord.images?.length})
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {viewRecord.images?.map((file, i) => (
                          <div key={i} className="group relative">
                            {isPdf(file) ? (
                              <div className="w-full h-[550px] bg-slate-900 rounded-[32px] border-2 border-slate-200 overflow-hidden relative flex flex-col shadow-2xl transition-all hover:border-emerald-500">
                                <div className="p-4 bg-slate-800 text-white flex justify-between items-center no-print">
                                  <span className="text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                                    <i className="fas fa-file-pdf text-red-500 text-lg"></i> PRATINJAU PDF {i+1}
                                  </span>
                                  <a href={file} download={`Arsip-PDF-${viewRecord.nomorAkta}.pdf`} className="text-[9px] font-black bg-emerald-600 hover:bg-emerald-500 px-4 py-1.5 rounded-full transition-all uppercase tracking-widest">Unduh</a>
                                </div>
                                <embed 
                                  src={file} 
                                  type="application/pdf" 
                                  className="w-full h-full no-print"
                                  style={{ background: 'white' }}
                                />
                                <div className="print-only h-40 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50">
                                  <i className="fas fa-file-pdf text-4xl text-red-500 mb-3"></i>
                                  <p className="text-xs font-black uppercase tracking-widest text-slate-500">Berkas PDF Terlampir Digital</p>
                                </div>
                              </div>
                            ) : (
                              <div className="aspect-[3/4] bg-slate-100 rounded-[32px] overflow-hidden border-2 border-slate-200 shadow-sm cursor-pointer no-print relative group transition-all hover:scale-[1.03] hover:shadow-2xl hover:border-emerald-500" onClick={() => setZoomedImage(file)}>
                                <img src={file} className="w-full h-full object-cover" alt={`Halaman ${i+1}`} />
                                <div className="absolute inset-0 bg-emerald-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-3xl">
                                  <div className="w-16 h-16 bg-white/20 backdrop-blur-lg rounded-full flex items-center justify-center shadow-xl border border-white/30">
                                    <i className="fas fa-expand-alt"></i>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-900 rounded-[40px] p-10 border border-slate-800 shadow-2xl no-print relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity transform translate-x-10 -translate-y-10">
                        <i className="fas fa-microchip text-[120px] text-white"></i>
                      </div>
                      <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-3 relative z-10">
                        <i className="fas fa-brain"></i> Ekstraksi Teks Otomatis (Gemini AI)
                      </h4>
                      <div className="font-mono text-[11px] text-emerald-400/70 leading-relaxed whitespace-pre-wrap relative z-10 p-8 bg-black/40 rounded-3xl border border-white/5 shadow-inner thin-scrollbar overflow-y-auto max-h-[400px]">
                        {viewRecord.extractedText || "Data transkrip tidak tersedia."}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {zoomedImage && (
        <div className="fixed inset-0 bg-slate-950/98 z-[100] flex items-center justify-center p-8 no-print animate-in fade-in duration-300" onClick={() => setZoomedImage(null)}>
          <img src={zoomedImage} className="max-w-full max-h-full object-contain rounded-3xl shadow-2xl border-4 border-white/10" alt="Zoom" />
          <button className="absolute top-10 right-10 text-white text-4xl hover:text-red-500 transition-colors bg-white/10 w-16 h-16 rounded-full flex items-center justify-center backdrop-blur-md">
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .printable-content, .printable-content * { visibility: visible; }
          .printable-content { position: absolute; left: 0; top: 0; width: 100%; border: none !important; margin: 0 !important; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .modal-overlay { background: white !important; padding: 0 !important; }
          .printable-page { box-shadow: none !important; border: none !important; margin: 0 !important; width: 100% !important; }
        }
        .thin-scrollbar::-webkit-scrollbar { width: 6px; }
        .thin-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .thin-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default ArchiveList;
