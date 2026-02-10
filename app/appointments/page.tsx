'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  CalendarIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  ShieldCheckIcon,
  ArrowPathIcon,
  InboxIcon,
  MoonIcon,
  SunIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/solid';

// Rule #3: Production Appointment Interface
interface Appointment {
  id: string;
  name: string;
  createdAt: string;
  title: string;
}

export default function AppointmentsPage() {
  const [isVerified, setIsVerified] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeShift, setActiveShift] = useState<'day' | 'night'>('day');

  useEffect(() => {
    // Rule #5: Extraction of Real Session Identity
    const status = localStorage.getItem('specialistStatus');
    const savedShift = localStorage.getItem('preferredShift') as 'day' | 'night';
    
    if (status === 'verified') setIsVerified(true);
    if (savedShift) setActiveShift(savedShift);

    async function fetchClinicalCalendar() {
      try {
        // Rule #3: Singular path alignment
        const response = await fetch('https://afridamai-backend.onrender.com/api/consultation');
        const data = await response.json();
        if (data.succeeded && data.resultData) {
          // Ensuring we only map valid data
          setAppointments(Array.isArray(data.resultData) ? data.resultData : []);
        }
      } catch (error) {
        console.error("Calendar Sync Error:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (status === 'verified') fetchClinicalCalendar();
    else setIsLoading(false);
  }, []);

  const handleShiftToggle = (shift: 'day' | 'night') => {
    setActiveShift(shift);
    localStorage.setItem('preferredShift', shift);
  };

  const formattedDate = new Date().toLocaleDateString('en-US', { 
    month: 'short', 
    day: '2-digit', 
    year: 'numeric' 
  });

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6 pb-20 text-left italic">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">
              Work <span className="text-[#FF7A59]">Schedule</span>
            </h1>
            <p className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-[0.3em] mt-1">
              Manage your time and view your bookings
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl">
            <button 
              onClick={() => handleShiftToggle('day')}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeShift === 'day' 
                ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' 
                : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Day Shift
            </button>
            <button 
              onClick={() => handleShiftToggle('night')}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeShift === 'night' 
                ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' 
                : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Night Shift
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
          
          {/* Rule #5: Security Lock Overlay */}
          {!isVerified && (
            <div className="absolute inset-0 z-30 backdrop-blur-md bg-white/5 dark:bg-gray-950/5 flex items-center justify-center rounded-[3rem]">
              <div className="bg-white dark:bg-gray-900 p-10 rounded-[3.5rem] shadow-2xl text-center max-w-sm border border-gray-100 dark:border-gray-800">
                <ShieldCheckIcon className="w-12 h-12 text-[#FF7A59] mx-auto mb-4" />
                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Schedule Locked</h3>
                <p className="text-xs text-gray-500 font-bold mt-2 leading-relaxed uppercase">
                  Please complete your training in the Academy to unlock your work calendar.
                </p>
              </div>
            </div>
          )}

          {/* Appointment List */}
          <div className={`lg:col-span-8 space-y-4 transition-all duration-500 ${!isVerified ? 'opacity-20 pointer-events-none grayscale' : 'opacity-100'}`}>
             <div className="flex items-center justify-between px-2">
                <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest italic">
                  {activeShift === 'day' ? 'Daytime Appointments' : 'Nighttime Appointments'}
                </h2>
                <div className="flex items-center gap-4">
                   <ChevronLeftIcon className="w-5 h-5 text-gray-300 cursor-pointer" />
                   <span className="text-xs font-black uppercase tracking-tighter">{formattedDate}</span>
                   <ChevronRightIcon className="w-5 h-5 text-gray-900 dark:text-white cursor-pointer" />
                </div>
             </div>

             {isLoading ? (
               <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800">
                  <ArrowPathIcon className="w-8 h-8 text-[#FF7A59] animate-spin mb-4" />
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading Calendar...</p>
               </div>
             ) : appointments.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 text-center">
                  <InboxIcon className="w-12 h-12 text-gray-200 dark:text-gray-700 mb-4" />
                  <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">No Bookings</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">You don't have any appointments scheduled for today.</p>
               </div>
             ) : (
               appointments.map((app) => (
                 <div key={app.id} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-6 rounded-[2.5rem] flex items-center justify-between group hover:border-[#FF7A59] transition-all cursor-pointer">
                    <div className="flex items-center gap-6">
                      <div className="text-center min-w-[60px] border-r border-gray-50 dark:border-gray-700 pr-6">
                        <p className="text-lg font-black text-gray-900 dark:text-white tracking-tighter">
                          {new Date(app.createdAt).getHours() % 12 || 12}
                        </p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">
                          {new Date(app.createdAt).getHours() >= 12 ? 'PM' : 'AM'}
                        </p>
                      </div>
                      <div>
                        <p className="text-base font-black text-gray-900 dark:text-white tracking-tighter group-hover:text-[#FF7A59] uppercase italic">{app.name}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase mt-1 tracking-widest">{app.title || 'General Check-up'}</p>
                      </div>
                    </div>
                    <button className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl text-gray-300 group-hover:text-green-500 transition-all">
                      <CheckCircleIcon className="w-6 h-6" />
                    </button>
                 </div>
               ))
             )}
          </div>

          {/* Shift Insights */}
          <div className={`lg:col-span-4 space-y-6 transition-all duration-500 ${!isVerified ? 'opacity-20 pointer-events-none grayscale' : 'opacity-100'}`}>
             <div className={`${activeShift === 'day' ? 'bg-gray-900' : 'bg-[#1A1A2E]'} dark:bg-black rounded-[3rem] p-8 text-white space-y-6 shadow-2xl relative overflow-hidden transition-colors`}>
                <div className="flex items-center gap-3 text-[#FF7A59] relative z-10">
                   {activeShift === 'day' ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6 text-blue-400" />}
                   <h3 className="text-[10px] font-black uppercase tracking-widest italic">
                     {activeShift === 'day' ? 'Day Shift Hours' : 'Night Shift Hours'}
                   </h3>
                </div>
                <div className="space-y-4 relative z-10">
                   <div className="flex items-center justify-between text-[10px] font-black uppercase italic">
                      <span className="opacity-50 tracking-widest">Active Time</span>
                      <span className="tracking-tighter">
                        {activeShift === 'day' ? '08:00 AM - 04:00 PM' : '08:00 PM - 04:00 AM'}
                      </span>
                   </div>
                </div>
                <button className="w-full bg-white dark:bg-gray-800 text-black dark:text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all relative z-10 hover:bg-[#FF7A59] hover:text-white">
                   Adjust Shift
                </button>
             </div>

             <div className="bg-white dark:bg-gray-800 rounded-[3rem] p-8 border border-gray-100 dark:border-gray-700 text-center">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 italic">Reliability</h3>
                <div className="flex flex-col items-center justify-center py-6">
                   <ClockIcon className="w-8 h-8 text-[#FF7A59] mb-2" />
                   <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Everything is on time</p>
                </div>
             </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}