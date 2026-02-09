'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  ArrowTrendingUpIcon, 
  BanknotesIcon, 
  UserGroupIcon, 
  StarIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  InformationCircleIcon
} from '@heroicons/react/24/solid';

export default function AnalyticsPage() {
  // Rule #5: Dynamic state linked to the Global Verification Protocol
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    // Rule #3: Syncing with production session status set in Training Hub
    const status = localStorage.getItem('specialistStatus');
    if (status === 'verified') {
      setIsVerified(true);
    }
  }, []);

  const stats = [
    { label: 'Avg. Rating', value: '4.9', icon: <StarIcon className="w-5 h-5 text-amber-400" />, trend: '+0.2 this month' },
    { label: 'Consultation Fee', value: '₦15,000', icon: <BanknotesIcon className="w-5 h-5 text-green-500" />, trend: 'Standard Rate' },
    { label: 'Success Rate', value: '98.2%', icon: <ArrowTrendingUpIcon className="w-5 h-5 text-blue-500" />, trend: 'Top 5% Specialist' },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8 pb-24">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">
              Performance <span className="text-[#FF7A59]">Pulse</span>
            </h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-1">
              Revenue Analytics & Clinical Impact Metrics
            </p>
          </div>
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-2 rounded-2xl">
            <span className="text-[10px] font-black uppercase px-4 text-gray-400">Timeframe:</span>
            <button className="bg-white dark:bg-gray-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-sm">Last 30 Days</button>
          </div>
        </div>

        {/* Top Stats Row */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-all duration-500 ${!isVerified ? 'opacity-50 grayscale' : 'opacity-100'}`}>
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group hover:border-[#FF7A59] transition-all">
               <div className="flex justify-between items-start relative z-10">
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-2xl group-hover:bg-[#FF7A59]/10 transition-colors">{stat.icon}</div>
                  <span className="text-[9px] font-black text-green-500 uppercase tracking-widest bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">{stat.trend}</span>
               </div>
               <div className="mt-6 relative z-10">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter mt-1">{stat.value}</p>
               </div>
            </div>
          ))}
        </div>

        {/* Main Analytics Container */}
        <div className="relative">
          {/* Rule #5: Hard Lock Overlay */}
          {!isVerified && (
            <div className="absolute inset-0 z-30 backdrop-blur-xl bg-white/20 dark:bg-gray-950/20 flex items-center justify-center rounded-[3.5rem] border-2 border-dashed border-gray-100 dark:border-gray-800 animate-in fade-in duration-500">
              <div className="bg-white dark:bg-gray-900 p-12 rounded-[3.5rem] shadow-2xl text-center max-w-md border border-gray-100 dark:border-gray-800 animate-in zoom-in duration-300">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                   <ShieldCheckIcon className="w-8 h-8 text-blue-500 animate-pulse" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Intelligence Locked</h3>
                <p className="text-xs text-gray-500 font-bold mt-4 leading-relaxed uppercase">
                  Revenue and impact data will populate here after you finalize your first 5 live consultations post-training.
                </p>
              </div>
            </div>
          )}

          <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8 transition-all duration-500 ${!isVerified ? 'opacity-10 pointer-events-none grayscale' : 'opacity-100'}`}>
            
            {/* Revenue Chart Visualization */}
            <div className="lg:col-span-8 bg-white dark:bg-gray-800 rounded-[3.5rem] border border-gray-100 dark:border-gray-700 p-10 flex flex-col justify-between min-h-[450px]">
               <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Revenue Growth (₦)</h3>
                  <div className="flex items-center gap-2">
                     <div className="w-3 h-3 bg-[#FF7A59] rounded-full"></div>
                     <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Specialist Fee</span>
                  </div>
               </div>
               
               {/* Pulse Graphic Simulation */}
               <div className="flex-1 flex items-end gap-3 pt-10 pb-4">
                  {[40, 70, 45, 90, 65, 80, 50, 85, 95, 60, 75, 100].map((h, i) => (
                    <div key={i} className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-t-xl relative group">
                       <div 
                         className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#FF7A59] to-[#ff9478] rounded-t-xl transition-all duration-1000"
                         style={{ height: `${h}%` }}
                       />
                       <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[8px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          ₦{(h * 200).toLocaleString()}
                       </div>
                    </div>
                  ))}
               </div>
               
               <div className="flex justify-between text-[9px] font-black text-gray-400 uppercase tracking-widest pt-4 border-t border-gray-50 dark:border-gray-800">
                  <span>Week 01</span>
                  <span>Week 02</span>
                  <span>Week 03</span>
                  <span>Week 04</span>
               </div>
            </div>

            {/* Sidebar Insights */}
            <div className="lg:col-span-4 space-y-6">
               <div className="bg-black dark:bg-white p-8 rounded-[3rem] text-white dark:text-black shadow-2xl relative overflow-hidden">
                  <div className="flex items-center gap-3 mb-6 relative z-10">
                     <InformationCircleIcon className="w-6 h-6 text-[#FF7A59]" />
                     <h3 className="text-[10px] font-black uppercase tracking-widest">Growth Tip</h3>
                  </div>
                  <p className="text-sm font-bold leading-relaxed tracking-tight relative z-10">
                    Specialists who provide diagnosis within <span className="text-[#FF7A59]">15 minutes</span> of chat initiation see a 40% increase in patient retention.
                  </p>
                  <ArrowTrendingUpIcon className="absolute -right-6 -bottom-6 w-32 h-32 opacity-10 text-white pointer-events-none" />
               </div>

               <div className="bg-gray-50 dark:bg-gray-900 p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Patient Feedback</h3>
                  <div className="space-y-4">
                     {[1, 2].map((i) => (
                       <div key={i} className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-50 dark:border-gray-700 shadow-sm">
                          <div className="flex gap-1 mb-2">
                             {[1, 2, 3, 4, 5].map(s => <StarIcon key={s} className="w-3 h-3 text-amber-400" />)}
                          </div>
                          <p className="text-[10px] font-bold text-gray-500 italic leading-relaxed">
                            {i === 1 ? '"Highly professional and detailed explanation of my condition."' : '"Efficient and clear. The AI preliminary check was spot on."'}
                          </p>
                       </div>
                     ))}
                  </div>
               </div>
            </div>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}