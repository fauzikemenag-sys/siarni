
import React from 'react';
import { MarriageRecord, User } from '../types';
import { KECAMATAN_JEMBER } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  records: MarriageRecord[];
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ records, user }) => {
  const isAdminKab = user.role === 'ADMIN_KABUPATEN';
  
  const filteredRecords = isAdminKab 
    ? records 
    : records.filter(r => r.kecamatan === user.kecamatan);

  const statsByKecamatan = KECAMATAN_JEMBER.map(kec => ({
    name: kec,
    count: records.filter(r => r.kecamatan === kec).length
  })).filter(s => s.count > 0 || !isAdminKab);

  const recentRecords = [...filteredRecords]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center text-xl">
              <i className="fas fa-file-invoice"></i>
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Arsip</p>
              <h3 className="text-2xl font-bold">{filteredRecords.length}</h3>
            </div>
          </div>
        </div>
        
        {isAdminKab ? (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xl">
                <i className="fas fa-map-marker-alt"></i>
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Kecamatan Aktif</p>
                <h3 className="text-2xl font-bold">{statsByKecamatan.length} / 31</h3>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center text-xl">
                <i className="fas fa-calendar-check"></i>
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Bulan Ini</p>
                <h3 className="text-2xl font-bold">
                  {filteredRecords.filter(r => new Date(r.createdAt).getMonth() === new Date().getMonth()).length}
                </h3>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center text-xl">
              <i className="fas fa-hdd"></i>
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Penyimpanan Teks</p>
              <h3 className="text-2xl font-bold text-emerald-600">Efisiensi 99%</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h4 className="font-bold mb-6 text-slate-800">Statistik Per Wilayah</h4>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statsByKecamatan.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {statsByKecamatan.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#10b981' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h4 className="font-bold mb-6 text-slate-800">Aktivitas Terbaru</h4>
          <div className="space-y-4">
            {recentRecords.length > 0 ? recentRecords.map((record) => (
              <div key={record.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-slate-200 flex items-center justify-center">
                    <i className="fas fa-file-alt text-slate-500 text-sm"></i>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{record.husbandName} & {record.wifeName}</p>
                    <p className="text-xs text-slate-500">{record.kecamatan} • {new Date(record.createdAt).toLocaleDateString('id-ID')}</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Berhasil</span>
              </div>
            )) : (
              <p className="text-center text-slate-400 py-10">Belum ada aktivitas.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
