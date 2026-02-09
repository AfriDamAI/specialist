'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  CalendarIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  LockClosedIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/solid';

export default function AppointmentsPage() {
  // Rule #5: Dynamic state linked to the Global Verification Protocol
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    // Rule #3: Syncing with production session status set in Training Hub
    const status = localStorage.getItem('specialistStatus');
    if (status === 'verified') {
      setIsVerified(true);
    }
  }, []);
  
  const upcomingAppointments = [
    { id: '1', patient: 'Amaka Adeleke', time: '10:00 AM', date: 'Today', fee: 15000, type: 'Initial Consultation' },
    { id: '2', patient: 'Musa Ibrahim', time: '11:30 AM', date: 'Today', fee: 10000, type: 'Follow-up' },
    { id: '3', patient: 'Chinelo Obi', time: '02:00 PM', date: 'Tomorrow', fee: 15000, type: 'Emergency Check' },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6 pb-20">
        
        {/* Adaptive Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter">
              Clinical <span className="text-[#FF7A59]">Schedule</span>
            </h1>
            <p className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-[0.3em] mt-1">
              Time Management & Earning Optimization
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl">
            <button className="px-4 py-2 bg-white dark:bg-gray-700 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">Day</button>
            <button className="px-4 py-2 text-gray-400 text-[10px] font-black uppercase tracking-widest">Night</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
          
          {/* Production Lock Overlay */}
          {!isVerified && (
            <div className="absolute inset-0 z-30 backdrop-blur-md bg-white/5 dark:bg-gray-950/5 flex items-center justify-center rounded-[3rem] animate-in fade-in duration-500">
              <div className="bg-white dark:bg-gray-900 p-10 rounded-[3rem] shadow-2xl text-center max-w-sm border border-gray-100 dark:border-gray-800 animate-in zoom-in duration-300">
                <ShieldCheckIcon className="w-12 h-12 text-[#FF7A59] mx-auto mb-4 animate-pulse" />
                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Calendar Locked</h3>
                <p className="text-xs text-gray-500 font-bold mt-2 leading-relaxed uppercase">
                  Scheduling logic will activate once your clinical onboarding and medical board vetting is complete.
                </p>
              </div>
            </div>
          )}

          {/* LEFT: Agenda View (8 Cols) */}
          <div className={`lg:col-span-8 space-y-4 transition-all duration-500 ${!isVerified ? 'opacity-20 pointer-events-none grayscale' : 'opacity-100'}`}>
             <div className="flex items-center justify-between px-2">
                <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Today's Agenda</h2>
                <div className="flex items-center gap-4">
                   <ChevronLeftIcon className="w-5 h-5 text-gray-300 cursor-pointer hover:text-[#FF7A59] transition-colors" />
                   <span className="text-xs font-black uppercase tracking-tighter">Feb 09, 2026</span>
                   <ChevronRightIcon className="w-5 h-5 text-gray-900 dark:text-white cursor-pointer hover:text-[#FF7A59] transition-colors" />
                </div>
             </div>

             {upcomingAppointments.map((app) => (
               <div key={app.id} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-6 rounded-[2.5rem] flex items-center justify-between group hover:border-[#FF7A59] hover:shadow-xl transition-all cursor-pointer">
                  <div className="flex items-center gap-6">
                    <div className="text-center min-w-[60px] border-r border-gray-50 dark:border-gray-700 pr-6">
                      <p className="text-lg font-black text-gray-900 dark:text-white leading-none tracking-tighter">{app.time.split(' ')[0]}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase mt-1 leading-none">{app.time.split(' ')[1]}</p>
                    </div>
                    <div>
                      <p className="text-base font-black text-gray-900 dark:text-white tracking-tighter leading-none group-hover:text-[#FF7A59] transition-colors">{app.patient}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase mt-2 tracking-widest">{app.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                       <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Session Fee</p>
                       <p className="text-sm font-black text-gray-900 dark:text-white tracking-tighter">₦{app.fee.toLocaleString()}</p>
                    </div>
                    <button className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl text-gray-300 group-hover:text-green-500 group-hover:bg-green-50 dark:group-hover:bg-green-900/20 transition-all">
                      <CheckCircleIcon className="w-6 h-6" />
                    </button>
                  </div>
               </div>
             ))}
          </div>

          {/* RIGHT: Quick Controls (4 Cols) */}
          <div className={`lg:col-span-4 space-y-6 transition-all duration-500 ${!isVerified ? 'opacity-20 pointer-events-none grayscale' : 'opacity-100'}`}>
             <div className="bg-gray-900 dark:bg-black rounded-[2.5rem] p-8 text-white space-y-6 shadow-2xl relative overflow-hidden">
                <div className="flex items-center gap-3 text-[#FF7A59] relative z-10">
                   <ClockIcon className="w-6 h-6" />
                   <h3 className="text-xs font-black uppercase tracking-widest">Active Shift</h3>
                </div>
                <div className="space-y-4 relative z-10">
                   <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-gray-500 uppercase tracking-widest">Shift Start</span>
                      <span className="tracking-tighter uppercase font-black">08:00 AM</span>
                   </div>
                   <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-gray-500 uppercase tracking-widest">Shift End</span>
                      <span className="tracking-tighter uppercase font-black">04:00 PM</span>
                   </div>
                </div>
                <button className="w-full bg-white dark:bg-gray-800 text-black dark:text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all relative z-10 hover:bg-[#FF7A59] hover:text-white dark:hover:bg-[#FF7A59]">
                   Modify Availability
                </button>
                <ClockIcon className="absolute -right-10 -bottom-10 w-48 h-48 opacity-5 text-white pointer-events-none" />
             </div>

             <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 border border-gray-100 dark:border-gray-700 shadow-sm">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Pending Requests</h3>
                <div className="flex flex-col items-center justify-center py-10 space-y-4">
                   <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-2xl flex items-center justify-center">
                      <CalendarIcon className="w-8 h-8 text-gray-300" />
                   </div>
                   <p className="text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">No New Requests</p>
                </div>
             </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}