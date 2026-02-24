'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  ClockIcon, 
  CalendarDaysIcon, 
  CheckCircleIcon, 
  PlusIcon,
  TrashIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/solid';

export default function SchedulePage() {
  // Rule #5: Dynamic state linked to the Global Verification Protocol
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    // Rule #3: Syncing with production session status set in Training Hub
    const status = localStorage.getItem('specialistStatus');
    if (status === 'verified') {
      setIsVerified(true);
    }
  }, []);

  const [availability, setAvailability] = useState([
    { day: 'Monday', active: true, slots: [{ start: '08:00', end: '12:00' }, { start: '14:00', end: '18:00' }] },
    { day: 'Tuesday', active: true, slots: [{ start: '09:00', end: '17:00' }] },
    { day: 'Wednesday', active: false, slots: [] },
    { day: 'Thursday', active: true, slots: [{ start: '08:00', end: '16:00' }] },
    { day: 'Friday', active: true, slots: [{ start: '08:00', end: '12:00' }] },
  ]);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8 pb-24">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">
              Clinical <span className="text-[#FF7A59]">Availability</span>
            </h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-1">
              Configure your weekly consultation windows
            </p>
          </div>
          <button 
            disabled={!isVerified}
            className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95 ${
              isVerified ? 'bg-[#FF7A59] text-white shadow-[#FF7A59]/20' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Save Schedule
          </button>
        </div>

        <div className="relative">
          {/* Rule #5: Under Review Hard Lock Overlay */}
          {!isVerified && (
            <div className="absolute inset-0 z-30 backdrop-blur-md bg-white/10 dark:bg-gray-950/10 flex flex-col items-center justify-center rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-gray-800 animate-in fade-in duration-500">
              <div className="bg-white dark:bg-gray-900 p-10 rounded-[3rem] shadow-2xl text-center max-w-sm border border-gray-100 dark:border-gray-800 animate-in zoom-in duration-300">
                <ShieldCheckIcon className="w-12 h-12 text-amber-500 mx-auto mb-4 animate-pulse" />
                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Vetting in Progress</h3>
                <p className="text-xs text-gray-500 font-bold mt-3 leading-relaxed uppercase">
                  Your clinical availability can be configured once your specialist credentials have been verified by the AfriDam Medical Board.
                </p>
              </div>
            </div>
          )}

          <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 transition-all duration-500 ${!isVerified ? 'opacity-10 pointer-events-none grayscale' : 'opacity-100'}`}>
            
            {/* Weekly Grid */}
            <div className="lg:col-span-2 space-y-4">
              {availability.map((item, index) => (
                <div key={item.day} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-6 md:p-8 rounded-[2.5rem] flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:border-[#FF7A59] hover:shadow-sm">
                  <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg transition-colors ${
                      item.active ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-gray-50 dark:bg-gray-900 text-gray-300'
                    }`}>
                      {item.day.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none">{item.day}</h3>
                      <p className={`text-[10px] font-black uppercase mt-1.5 ${item.active ? 'text-green-500' : 'text-gray-400'}`}>
                        {item.active ? 'Accepting Sessions' : 'Unavailable'}
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 max-w-md space-y-2">
                    {item.active ? (
                      item.slots.map((slot, sIdx) => (
                        <div key={sIdx} className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2">
                          <div className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-xl px-4 py-2 flex items-center justify-between border border-gray-100 dark:border-gray-700">
                            <span className="text-xs font-bold text-gray-600 dark:text-gray-300 tracking-tighter">{slot.start} — {slot.end}</span>
                            <TrashIcon className="w-4 h-4 text-gray-300 hover:text-red-500 cursor-pointer transition-colors" />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="h-10 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl opacity-50" />
                    )}
                  </div>

                  <button className={`p-4 rounded-2xl transition-all active:scale-90 ${
                    item.active ? 'bg-gray-50 dark:bg-gray-900 text-gray-400' : 'bg-[#FF7A59] text-white shadow-lg shadow-[#FF7A59]/20'
                  }`}>
                    {item.active ? <PlusIcon className="w-5 h-5" /> : <CheckCircleIcon className="w-5 h-5" />}
                  </button>
                </div>
              ))}
            </div>

            {/* Shift Analytics Sidebar */}
            <div className="space-y-6">
              <div className="bg-gray-900 dark:bg-black rounded-[3rem] p-8 text-white space-y-8 shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-xs font-black text-[#FF7A59] uppercase tracking-[0.2em] mb-4">Shift Summary</h3>
                  <div className="space-y-6">
                    <div className="flex justify-between items-end border-b border-white/5 pb-4">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Weekly Hours</span>
                      <span className="text-2xl font-black tracking-tighter">32.5h</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-white/5 pb-4">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Avg. Sessions</span>
                      <span className="text-2xl font-black tracking-tighter">64</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-white/5 dark:bg-gray-800/10 rounded-[2rem] border border-white/10 dark:border-gray-800/30 relative z-10">
                   <div className="flex items-center gap-2 mb-2">
                     <ClockIcon className="w-4 h-4 text-[#FF7A59]" />
                     <span className="text-[10px] font-black uppercase tracking-widest">Timezone</span>
                   </div>
                   <p className="text-sm font-bold opacity-80 uppercase tracking-tighter">Lagos (GMT+1)</p>
                </div>

                <p className="text-[9px] font-bold text-gray-600 uppercase leading-relaxed relative z-10">
                  Note: Sessions booked outside these windows must be manually approved in your 'Appointments' tray.
                </p>
                <CalendarDaysIcon className="absolute -right-10 -bottom-10 w-48 h-48 opacity-5 text-white pointer-events-none" />
              </div>
            </div>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}