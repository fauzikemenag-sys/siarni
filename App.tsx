
import React, { useState, useEffect } from 'react';
import { User, MarriageRecord, Role } from './types.ts';
import { KECAMATAN_JEMBER, SESSION_KEY } from './constants.ts';
import Sidebar from './components/Sidebar.tsx';
import Dashboard from './components/Dashboard.tsx';
import UploadSection from './components/UploadSection.tsx';
import ArchiveList from './components/ArchiveList.tsx';
import { verifyRecordIntegrity } from './utils/crypto.ts';
import { db } from './services/databaseService.ts';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [records, setRecords] = useState<MarriageRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loginForm, setLoginForm] = useState({ username: '', password: '', role: 'ADMIN_KECAMATAN' as Role, kecamatan: KECAMATAN_JEMBER[0] });
  
  // State Verifikasi Publik
  const [publicVerifyRecord, setPublicVerifyRecord] = useState<{record: MarriageRecord, isValid: boolean} | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  useEffect(() => {
    const initData = async () => {
      try {
        setIsLoading(true);
        const data = await db.getAllRecords();
        setRecords(data || []);
        
        const savedSession = localStorage.getItem(SESSION_KEY);
        if (savedSession) {
          try {
            setUser(JSON.parse(savedSession));
          } catch (e) {
            localStorage.removeItem(SESSION_KEY);
          }
        }

        // Cek Parameter Verifikasi di URL
        const urlParams = new URLSearchParams(window.location.search);
        const verifyHash = urlParams.get('verify');
        
        if (verifyHash) {
          setIsVerifying(true);
          const found = data.find(r => r.hash === verifyHash);
          if (found) {
            const isValid = await verifyRecordIntegrity(found);
            setPublicVerifyRecord({ record: found, isValid });
          } else {
            setVerifyError("Data arsip dengan sidik jari digital tersebut tidak ditemukan di database Jember.");
          }
          setIsVerifying(false);
        }
      } catch (err) {
        console.error("Initialization error:", err);
        setError("Gagal memuat aplikasi. Pastikan koneksi internet stabil.");
      } finally {
        setIsLoading(false);
      }
    };

    initData();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: User = {
      id: Math.random().toString(36).substring(7),
      username: loginForm.username,
      role: loginForm.role,
      kecamatan: loginForm.role === 'ADMIN_KECAMATAN' ? loginForm.kecamatan : undefined
    };
    setUser(newUser);
    localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
    setActiveTab('dashboard');
  };

  const addRecord = async (newRecord: MarriageRecord) => {
    setRecords(prev => [newRecord, ...prev]);
    await db.saveRecord(newRecord);
    setActiveTab('archive');
  };

  // Tampilan Loading Utama
  if (isLoading || isVerifying) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-emerald-500 font-bold animate-pulse">Menghubungkan ke Server Jember...</p>
        </div>
      </div>
    );
  }

  // Tampilan Error Verifikasi Scan QR
  if (verifyError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-[40px] shadow-2xl max-w-md w-full text-center border border-slate-200">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
            <i className="fas fa-search-minus"></i>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Data Tidak Ditemukan</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">{verifyError}</p>
          <button 
            onClick={() => { window.history.pushState({}, '', window.location.pathname); setVerifyError(null); }}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all"
          >
            Kembali ke Aplikasi
          </button>
        </div>
      </div>
    );
  }

  // Tampilan Hasil Verifikasi Scan QR (Publik)
  if (publicVerifyRecord) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-[40px] shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
          <div className={`${publicVerifyRecord.isValid ? 'bg-emerald-600' : 'bg-red-600'} p-10 text-center text-white`}>
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
              <i className={`fas ${publicVerifyRecord.isValid ? 'fa-check-circle' : 'fa-times-circle'} text-4xl`}></i>
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tight">Verifikasi Digital</h1>
            <p className="text-xs opacity-90 uppercase tracking-widest font-bold mt-1">
              {publicVerifyRecord.isValid ? 'Dokumen Terverifikasi Asli' : 'DOKUMEN TIDAK VALID / DIMANIPULASI'}
            </p>
          </div>
          
          <div className="p-10 space-y-6">
            <div className="grid grid-cols-1 gap-4 text-sm bg-slate-50 p-6 rounded-3xl">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Nama Pasangan</p>
                <p className="font-black text-slate-800 uppercase">{publicVerifyRecord.record.husbandName} & {publicVerifyRecord.record.wifeName}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">No. Akta</p>
                  <p className="font-bold text-slate-700">{publicVerifyRecord.record.nomorAkta}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Kecamatan</p>
                  <p className="font-bold text-slate-700">{publicVerifyRecord.record.kecamatan}</p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-2 flex items-center gap-2">
                <i className="fas fa-fingerprint text-emerald-500"></i> Digital Signature (SHA-256)
              </p>
              <div className="bg-slate-900 p-4 rounded-2xl font-mono text-[9px] break-all text-emerald-500/80 border border-slate-800 leading-tight">
                {publicVerifyRecord.record.hash}
              </div>
            </div>

            <button 
              onClick={() => { window.history.pushState({}, '', window.location.pathname); setPublicVerifyRecord(null); }}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg"
            >
              Tutup Verifikasi
            </button>
          </div>
          <div className="bg-slate-50 p-4 text-center">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">SI-ARNI Jember • Sistem Kearsipan Digital</p>
          </div>
        </div>
      </div>
    );
  }

  // Tampilan Login
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>

        <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[40px] border border-white/10 w-full max-w-md relative z-10 shadow-2xl">
          <div className="text-center mb-10">
            <div className="w-24 h-24 bg-white rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-emerald-500/10 mb-6 p-4">
              <img 
                src="https://www.freepnglogos.com/uploads/logo-kemenag-png/logo-kementerian-agama-gambar-logo-depag-png-0.png" 
                alt="Kemenag Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-3xl font-black text-white mb-2 tracking-tight">SI-ARNI Jember</h1>
            <p className="text-slate-400 text-sm">Sistem Informasi Pengarsipan Akta Nikah</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Username</label>
              <input
                type="text"
                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-600 font-medium"
                placeholder="Masukkan username"
                required
                value={loginForm.username}
                onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Akses Sebagai</label>
              <select
                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer font-medium"
                value={loginForm.role}
                onChange={(e) => setLoginForm({...loginForm, role: e.target.value as Role})}
              >
                <option value="ADMIN_KECAMATAN" className="bg-slate-800">Admin KUA Kecamatan</option>
                <option value="ADMIN_KABUPATEN" className="bg-slate-800">Admin Kabupaten Jember</option>
              </select>
            </div>

            {loginForm.role === 'ADMIN_KECAMATAN' && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Pilih Kecamatan</label>
                <select
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer font-medium"
                  value={loginForm.kecamatan}
                  onChange={(e) => setLoginForm({...loginForm, kecamatan: e.target.value})}
                >
                  {KECAMATAN_JEMBER.map(kec => (
                    <option key={kec} value={kec} className="bg-slate-800">{kec}</option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-5 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 mt-4 uppercase tracking-widest"
            >
              Masuk Dashboard
            </button>
          </form>
          
          <p className="text-center text-slate-500 text-[10px] mt-10 uppercase tracking-widest font-bold">
            Cloud Mode: {db.isOnline() ? 'ONLINE (SUPABASE)' : 'LOCAL ONLY'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar 
        user={user} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout} 
      />
      
      <main className="flex-1 ml-64 p-8">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
              {activeTab === 'dashboard' && 'Beranda Utama'}
              {activeTab === 'archive' && 'Manajemen Arsip'}
              {activeTab === 'upload' && 'Pencatatan Baru'}
              {db.isOnline() && (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] rounded-full font-black uppercase tracking-widest shadow-sm">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  Cloud Active
                </span>
              )}
            </h2>
          </div>
          
          <div className="flex items-center gap-4 no-print">
            <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm text-xs text-slate-600 font-bold uppercase tracking-wider">
              <i className="far fa-calendar-alt mr-2 text-emerald-500"></i>
              {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}
            </div>
          </div>
        </header>

        <div className="animate-in fade-in duration-500">
          {activeTab === 'dashboard' && (
            <Dashboard records={records} user={user} />
          )}
          
          {activeTab === 'archive' && (
            <ArchiveList records={records} user={user} />
          )}

          {activeTab === 'upload' && user.role === 'ADMIN_KECAMATAN' && (
            <UploadSection user={user} onSuccess={addRecord} />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
