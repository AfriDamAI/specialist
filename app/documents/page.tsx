'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  DocumentIcon, 
  ArrowUpTrayIcon, 
  ArrowDownTrayIcon,
  ShieldCheckIcon,
  FolderIcon,
  MagnifyingGlassIcon,
  LockClosedIcon
} from '@heroicons/react/24/solid';

export default function DocumentsPage() {
  // Rule #5: Dynamic state linked to the Global Verification Protocol
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    // Rule #3: Syncing with production session status set in Training Hub
    const status = localStorage.getItem('specialistStatus');
    if (status === 'verified') {
      setIsVerified(true);
    }
  }, []);

  const documentCategories = [
    { id: 'certs', name: 'Specialist Credentials', count: 4, color: 'bg-blue-500' },
    { id: 'reports', name: 'Clinical Reports', count: isVerified ? 12 : 0, color: 'bg-[#FF7A59]' },
    { id: 'admin', name: 'Invoices & Payouts', count: 2, color: 'bg-green-500' },
  ];

  const recentFiles = [
    { id: 1, name: 'Medical_License_2026.pdf', type: 'Credential', date: 'Feb 01, 2026', size: '2.4 MB' },
    { id: 2, name: 'Specialization_Cert_Derm.pdf', type: 'Credential', date: 'Feb 01, 2026', size: '1.8 MB' },
    { id: 3, name: 'Tax_ID_Verification.pdf', type: 'Admin', date: 'Jan 28, 2026', size: '840 KB' },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8 pb-24">
        
        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">
              Clinical <span className="text-[#FF7A59]">Vault</span>
            </h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-1">
              Secure Document Management & Compliance
            </p>
          </div>
          <button className="bg-black dark:bg-white text-white dark:text-black px-8 py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-xl hover:bg-[#FF7A59] dark:hover:bg-[#FF7A59] dark:hover:text-white">
            <ArrowUpTrayIcon className="w-5 h-5" />
            Upload New File
          </button>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {documentCategories.map((cat) => (
            <div key={cat.id} className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all cursor-pointer group hover:border-[#FF7A59]">
              <div className={`${cat.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-black/5 transition-transform group-hover:scale-110`}>
                <FolderIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter group-hover:text-[#FF7A59] transition-colors">{cat.name}</h3>
              <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">{cat.count} Secure Files</p>
            </div>
          ))}
        </div>

        {/* File Explorer Area */}
        <div className="bg-white dark:bg-gray-800 rounded-[3rem] border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm relative">
          
          {/* Rule #5: Reporting Lock Label */}
          {!isVerified && (
            <div className="absolute top-0 right-0 p-8 z-20 animate-in fade-in duration-500">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 px-4 py-2 rounded-full flex items-center gap-2">
                <ShieldCheckIcon className="w-4 h-4 text-amber-500" />
                <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Clinical Reporting Locked</span>
              </div>
            </div>
          )}

          <div className="p-8 border-b border-gray-50 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50 dark:bg-gray-900/30">
            <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Recent Documents</h2>
            <div className={`relative w-full md:w-72 transition-opacity ${!isVerified ? 'opacity-50' : 'opacity-100'}`}>
              <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                disabled={!isVerified}
                placeholder={isVerified ? "Find a file..." : "Search restricted..."}
                className="w-full bg-white dark:bg-gray-800 border-none rounded-xl pl-10 pr-4 py-2 text-xs font-bold focus:ring-1 focus:ring-[#FF7A59] dark:text-white outline-none"
              />
            </div>
          </div>

          <div className="p-4 md:p-8">
            <div className="space-y-3">
              {recentFiles.map((file) => (
                <div key={file.id} className="flex flex-col md:flex-row md:items-center justify-between p-5 rounded-[2rem] hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-all border border-transparent hover:border-gray-100 dark:hover:border-gray-700 group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center group-hover:bg-[#FF7A59]/10 transition-colors">
                      <DocumentIcon className="w-6 h-6 text-gray-400 group-hover:text-[#FF7A59]" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900 dark:text-white tracking-tighter">{file.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{file.type}</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{file.date}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between md:justify-end gap-6 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-gray-50 dark:border-gray-700">
                    <span className="text-[10px] font-black text-gray-400 uppercase">{file.size}</span>
                    <button className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl text-gray-400 hover:text-black dark:hover:text-white transition-all shadow-sm active:scale-90">
                      <ArrowDownTrayIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Security Footer */}
        <div className="flex items-center justify-center gap-2 opacity-30 py-4 transition-opacity hover:opacity-100">
          <LockClosedIcon className="w-4 h-4 text-[#FF7A59]" />
          <p className="text-[9px] font-black uppercase tracking-widest">End-to-End Encrypted Clinical Storage</p>
        </div>
      </div>
    </DashboardLayout>
  );
}