'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  UsersIcon, 
  MagnifyingGlassIcon, 
  PlusIcon,
  FunnelIcon,
  LockClosedIcon,
  ChevronRightIcon
} from '@heroicons/react/24/solid';

export default function PatientsPage() {
  // Rule #5: Dynamic state linked to the Global Verification Protocol
  const [isVerified, setIsVerified] = useState(false); 

  useEffect(() => {
    // Rule #3: Syncing with production session status set in Training Hub
    const status = localStorage.getItem('specialistStatus');
    if (status === 'verified') {
      setIsVerified(true);
    }
  }, []);
  
  // Production Data Structure
  const patients = [
    { id: '1', name: 'Amaka Adeleke', age: '28y', lastVisit: '09 Feb 2026', status: 'Active', balance: 15000 },
    { id: '2', name: 'Musa Ibrahim', age: '34y', lastVisit: '05 Feb 2026', status: 'Stable', balance: 10000 },
    { id: '3', name: 'Chinelo Obi', age: '22y', lastVisit: '01 Feb 2026', status: 'Critical', balance: 25000 },
    { id: '4', name: 'Yusuf Dasuki', age: '45y', lastVisit: '28 Jan 2026', status: 'Discharged', balance: 0 },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6 pb-20">
        
        {/* Adaptive Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter">
              Patient <span className="text-[#FF7A59]">Directory</span>
            </h1>
            <p className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-[0.3em] mt-1">
              Clinical Records & Case Management
            </p>
          </div>
          
          <button className="bg-black dark:bg-white text-white dark:text-black px-6 py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-black/10">
            <PlusIcon className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-widest">Add New Patient</span>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-9 relative">
            <input 
              type="text" 
              placeholder="Search by name, ID, or condition..."
              className="w-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl px-6 py-4 pl-12 text-sm font-bold focus:ring-2 focus:ring-[#FF7A59] outline-none transition-all shadow-sm"
            />
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          </div>
          <button className="md:col-span-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl px-6 py-4 flex items-center justify-center gap-3 hover:bg-gray-50 transition-all active:scale-95">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">Filters</span>
          </button>
        </div>

        {/* Patient Table/List Container */}
        <div className="relative">
          {/* Rule #5: Under Review Hard Lock */}
          {!isVerified && (
            <div className="absolute inset-0 z-20 backdrop-blur-md bg-white/10 dark:bg-gray-950/10 flex flex-col items-center justify-center rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-gray-800">
              <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-2xl text-center max-w-sm border border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in duration-300">
                <LockClosedIcon className="w-12 h-12 text-[#FF7A59] mx-auto mb-4" />
                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Access Restricted</h3>
                <p className="text-xs text-gray-500 font-bold mt-2 leading-relaxed uppercase">
                  Patient records are encrypted until your medical credentials are fully verified by the board.
                </p>
              </div>
            </div>
          )}

          <div className={`grid grid-cols-1 gap-4 ${!isVerified ? 'opacity-20 pointer-events-none' : ''}`}>
            {patients.map((patient) => (
              <div 
                key={patient.id} 
                className="group bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-6 rounded-[2.5rem] flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-2xl hover:shadow-[#FF7A59]/5 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-gray-50 dark:bg-gray-900 rounded-2xl flex items-center justify-center text-xl font-black text-gray-300">
                    {patient.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tighter leading-none">
                      {patient.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{patient.age}</span>
                      <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                      <span className="text-[10px] font-black text-[#FF7A59] uppercase tracking-widest">Last: {patient.lastVisit}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-8 border-t md:border-t-0 pt-4 md:pt-0 border-gray-50 dark:border-gray-700">
                  <div className="text-left md:text-right">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Case Status</p>
                    <span className={`text-[10px] font-black uppercase ${
                      patient.status === 'Critical' ? 'text-red-500' : 'text-green-500'
                    }`}>
                      {patient.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Revenue</p>
                    <p className="text-sm font-black text-gray-900 dark:text-white">₦{patient.balance.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-xl group-hover:bg-[#FF7A59] group-hover:text-white transition-all">
                    <ChevronRightIcon className="w-5 h-5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}