
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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loginForm, setLoginForm] = useState({ username: '', password: '', role: 'ADMIN_KECAMATAN' as Role, kecamatan: KECAMATAN_JEMBER[0] });
  
  const [isVerifying, setIsVerifying] = useState(false);

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

        const urlParams = new URLSearchParams(window.location.search);
        const verifyHash = urlParams.get('verify');
        
        if (verifyHash) {
          setIsVerifying(true);
          const found = data.find(r => r.hash === verifyHash);
          if (found) {
            await verifyRecordIntegrity(found);
          }
          setIsVerifying(false);
        }
      } catch (err) {
        console.error("Init error:", err);
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

  if (isLoading || isVerifying) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Menghubungkan Infrastruktur Jember...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    const isAiOnline = !!process.env.API_KEY;
    const isDbOnline = db.isOnline();
    
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden font-sans">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-600/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px]"></div>

        <div className="bg-white/[0.02] backdrop-blur-3xl p-10 rounded-[48px] border border-white/10 w-full max-w-md relative z-10 shadow-2xl">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-white rounded-[28px] mx-auto flex items-center justify-center shadow-2xl shadow-emerald-500/20 mb-6 p-4 border border-white/20">
              <img 
                src="https://www.freepnglogos.com/uploads/logo-kemenag-png/logo-kementerian-agama-gambar-logo-depag-png-0.png" 
                alt="Kemenag" 
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-2xl font-black text-white mb-2 tracking-tight uppercase">SI-ARNI Jember</h1>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Sistem Arsip Akta Nikah Digital</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Username Admin</label>
              <input
                type="text"
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-700 font-bold"
                placeholder="Contoh: Admin_KUA"
                required
                value={loginForm.username}
                onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Level Akses</label>
              <select
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer font-bold"
                value={loginForm.role}
                onChange={(e) => setLoginForm({...loginForm, role: e.target.value as Role})}
              >
                <option value="ADMIN_KECAMATAN" className="bg-slate-900">Admin Kecamatan (KUA)</option>
                <option value="ADMIN_KABUPATEN" className="bg-slate-900">Admin Kabupaten (Kemenag)</option>
              </select>
            </div>

            {loginForm.role === 'ADMIN_KECAMATAN' && (
              <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Kecamatan</label>
                <select
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer font-bold"
                  value={loginForm.kecamatan}
                  onChange={(e) => setLoginForm({...loginForm, kecamatan: e.target.value})}
                >
                  {KECAMATAN_JEMBER.map(kec => (
                    <option key={kec} value={kec} className="bg-slate-900">{kec}</option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-emerald-500/20 mt-4 uppercase tracking-[0.2em] text-xs"
            >
              Masuk Sistem
            </button>
          </form>
          
          <div className="mt-10 pt-8 border-t border-white/5 space-y-3">
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] text-center mb-4">Diagnostic System Status</p>
            
            <div className="grid grid-cols-2 gap-3">
              {/* Database Status */}
              <div className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all ${isDbOnline ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/10'}`}>
                <i className={`fas fa-database text-xs ${isDbOnline ? 'text-emerald-500' : 'text-slate-600'}`}></i>
                <span className={`text-[8px] font-black uppercase tracking-widest ${isDbOnline ? 'text-emerald-500' : 'text-slate-600'}`}>Cloud DB</span>
                <span className={`text-[7px] font-bold uppercase ${isDbOnline ? 'text-emerald-400' : 'text-slate-500'}`}>{isDbOnline ? 'ONLINE' : 'OFFLINE'}</span>
              </div>

              {/* AI Status */}
              <div className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all ${isAiOnline ? 'bg-blue-500/5 border-blue-500/20' : 'bg-red-500/5 border-red-500/10'}`}>
                <i className={`fas fa-brain text-xs ${isAiOnline ? 'text-blue-500' : 'text-slate-600'}`}></i>
                <span className={`text-[8px] font-black uppercase tracking-widest ${isAiOnline ? 'text-blue-500' : 'text-slate-600'}`}>Gemini AI</span>
                <span className={`text-[7px] font-bold uppercase ${isAiOnline ? 'text-blue-400' : 'text-slate-500'}`}>{isAiOnline ? 'ACTIVE' : 'OFFLINE'}</span>
              </div>
            </div>

            {(!isDbOnline || !isAiOnline) && (
              <p className="text-[7px] text-slate-500 text-center font-bold uppercase leading-relaxed mt-2 italic">
                Pastikan Environment Variables di Vercel sudah di-Redeploy.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-slate-50 min-h-screen font-sans">
      <Sidebar 
        user={user} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout} 
      />
      
      <main className="flex-1 ml-64 p-10">
        <header className="flex items-center justify-between mb-10 no-print">
          <div>
            <div className="flex items-center gap-3 mb-1">
               <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">
                {activeTab === 'dashboard' && 'Beranda'}
                {activeTab === 'archive' && 'Arsip Digital'}
                {activeTab === 'upload' && 'Upload Baru'}
              </h2>
              {db.isOnline() && (
                <span className="bg-emerald-100 text-emerald-700 text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest flex items-center gap-1">
                   <span className="w-1 h-1 bg-emerald-500 rounded-full"></span> Cloud Active
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Pusat Data Akta Nikah Kabupaten Jember</p>
          </div>
          
          <div className="bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm text-[10px] text-slate-600 font-black uppercase tracking-[0.1em]">
            <i className="far fa-calendar-check mr-2 text-emerald-500"></i>
            {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}
          </div>
        </header>

        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
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
