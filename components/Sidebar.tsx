
import React from 'react';
import { User, Role } from '../types';

interface SidebarProps {
  user: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, activeTab, setActiveTab, onLogout }) => {
  const isAdminKab = user.role === 'ADMIN_KABUPATEN';

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col fixed left-0 top-0">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <i className="fas fa-archive text-emerald-400"></i>
          SI-ARNI
        </h1>
        <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Arsip Akta Nikah Jember</p>
      </div>

      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-lg font-bold">
            {user.username[0].toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="font-medium truncate">{user.username}</p>
            <p className="text-xs text-slate-400 truncate">
              {isAdminKab ? 'Admin Kabupaten' : `KUA ${user.kecamatan}`}
            </p>
          </div>
        </div>

        <nav className="space-y-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'dashboard' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <i className="fas fa-chart-line w-5"></i>
            Dashboard
          </button>
          
          <button
            onClick={() => setActiveTab('archive')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'archive' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <i className="fas fa-folder-open w-5"></i>
            Data Arsip
          </button>

          {!isAdminKab && (
            <button
              onClick={() => setActiveTab('upload')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'upload' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <i className="fas fa-cloud-upload-alt w-5"></i>
              Upload Berkas
            </button>
          )}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-slate-800">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <i className="fas fa-sign-out-alt w-5"></i>
          Keluar
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
