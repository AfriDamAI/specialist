'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ConsultationQueue from '@/components/ConsultationQueue';
import Link from 'next/link';
import { 
  CheckBadgeIcon, 
  WalletIcon, 
  UsersIcon, 
  BanknotesIcon,
  BellIcon,
  AcademicCapIcon,
  ArrowRightIcon
} from '@heroicons/react/24/solid';

export default function DashboardPage() {
  // Rule #5: Dynamic state linked to the Global Verification Protocol
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    // Rule #3: Syncing with production session status set in Training Hub
    const status = localStorage.getItem('specialistStatus');
    if (status === 'verified') {
      setIsVerified(true);
    }
  }, []);

  // Rule #3: Production-ready state (Naira ₦ / Zeroed stats)
  const [stats] = useState({
    dailyEarnings: 0,
    portfolioBalance: 0,
    totalPatients: 0,
    trainingProgress: 35, // Specialist onboarding progress
  });

  const [user] = useState({
    firstName: 'Ogirima',
  });

  return (
    <DashboardLayout>
      <div className="w-full max-w-7xl mx-auto space-y-10 pb-24 md:pb-10 transition-all duration-300">
        
        {/* Header Section - Clean & Compelling */}
        <div className="flex flex-row items-center justify-between px-1">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">
                Hello, {user.firstName}
              </h1>
              {isVerified && <CheckBadgeIcon className="w-8 h-8 md:w-10 md:h-10 text-[#FF7A59] animate-in zoom-in duration-500" />}
            </div>
            <p className={`${isVerified ? 'text-green-500' : 'text-[#FF7A59]'} font-black text-[10px] md:text-xs uppercase tracking-[0.4em] transition-colors`}>
               {isVerified ? 'Specialist Workstation • Active' : 'Specialist Workstation • Vetting Active'}
            </p>
          </div>
          
          <button className="relative w-14 h-14 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center border border-gray-100 dark:border-gray-700 shadow-xl transition-transform active:scale-90">
             <BellIcon className="w-6 h-6 text-gray-500" />
             <div className="absolute top-4 right-4 w-3 h-3 bg-[#FF7A59] rounded-full border-4 border-white dark:border-gray-800"></div>
          </button>
        </div>

        {/* 2-Week Onboarding Gateway (Hidden when Verified) */}
        {!isVerified && (
          <div className="bg-black dark:bg-white rounded-[4rem] p-10 md:p-16 text-white dark:text-black shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
              <div className="flex-1 space-y-8">
                <div className="inline-flex items-center gap-2 bg-[#FF7A59] px-5 py-2 rounded-full">
                  <AcademicCapIcon className="w-4 h-4 text-white" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">Clinical Academy</span>
                </div>
                <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight uppercase">
                  Complete Your <br />Verification
                </h2>
                <Link 
                  href="/training"
                  className="inline-flex items-center gap-4 bg-white dark:bg-black text-black dark:text-white px-10 py-6 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform shadow-2xl"
                >
                  Start Onboarding
                  <ArrowRightIcon className="w-5 h-5 text-[#FF7A59]" />
                </Link>
              </div>
              
              <div className="w-full lg:w-[400px] bg-white/10 dark:bg-black/5 p-10 rounded-[3.5rem] border border-white/10 dark:border-black/10 backdrop-blur-md">
                 <div className="flex justify-between items-end mb-6">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Status</span>
                    <span className="text-5xl font-black tracking-tighter">{stats.trainingProgress}%</span>
                 </div>
                 <div className="h-3 bg-white/10 dark:bg-black/10 rounded-full overflow-hidden">
                    <div className="h-full bg-[#FF7A59] transition-all duration-1000" style={{ width: `${stats.trainingProgress}%` }} />
                 </div>
              </div>
            </div>
            <AcademicCapIcon className="absolute -right-20 -bottom-20 w-80 h-80 opacity-5 pointer-events-none" />
          </div>
        )}

        {/* Main Stats Grid - Clear & Balanced */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StatCard 
            icon={<BanknotesIcon className="w-7 h-7" />} 
            label="Daily Earnings" 
            value={`₦${stats.dailyEarnings}`} 
            color="bg-slate-900 text-white" 
            isDark 
          />
          <StatCard 
            icon={<WalletIcon className="w-7 h-7" />} 
            label="Total Portfolio" 
            value={`₦${stats.portfolioBalance}`} 
            color="bg-white dark:bg-gray-800" 
          />
          <StatCard 
            icon={<UsersIcon className="w-7 h-7" />} 
            label="Patients Seen" 
            value={stats.totalPatients.toString()} 
            color="bg-white dark:bg-gray-800" 
          />
        </div>

        {/* Active Queue Section - Full Width Centerpiece */}
        <div className="bg-white dark:bg-gray-800 rounded-[4rem] border border-gray-100 dark:border-gray-700 shadow-2xl shadow-gray-200/20 overflow-hidden transition-all">
          <div className="px-12 py-10 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between bg-gray-50/30 dark:bg-gray-800/50">
            <div>
              <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">Live Consultation Queue</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase mt-1 tracking-widest">
                {isVerified ? 'Neural Link Active • Monitoring Network' : 'Pending verification approval'}
              </p>
            </div>
            <div className="flex items-center gap-3">
               <div className={`${isVerified ? 'bg-green-500' : 'bg-red-500'} w-3 h-3 rounded-full animate-ping`} />
               <span className={`text-[10px] font-black uppercase tracking-widest ${isVerified ? 'text-green-500' : 'text-red-500'}`}>
                 {isVerified ? 'Live' : 'Vetting'}
               </span>
            </div>
          </div>
          <div className="p-12 min-h-[400px]">
            <ConsultationQueue />
          </div>
        </div>

        {/* Night Shift Footer - Clean Finish */}
        <div className="flex items-center justify-center pt-10">
           <div className="bg-gray-50 dark:bg-gray-900 px-12 py-5 rounded-full border border-gray-100 dark:border-gray-800 flex items-center gap-8 shadow-sm">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">Duty Status:</span>
              <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
                 Night Shift Active 🌙
              </span>
           </div>
        </div>

      </div>
    </DashboardLayout>
  );
}

function StatCard({ icon, label, value, color, isDark = false }: { icon: any, label: string, value: string, color: string, isDark?: boolean }) {
  return (
    <div className={`${color} rounded-[3.5rem] p-10 shadow-xl border ${isDark ? 'border-transparent' : 'border-gray-100 dark:border-gray-700'} flex flex-col justify-between transition-all hover:-translate-y-2 hover:shadow-2xl`}>
      <div className={`${isDark ? 'bg-white/10' : 'bg-gray-100 dark:bg-gray-700'} w-14 h-14 rounded-2xl flex items-center justify-center mb-10 shadow-sm`}>
        <div className={isDark ? 'text-white' : 'text-[#FF7A59]'}>{icon}</div>
      </div>
      <div>
        <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>{label}</p>
        <p className={`text-4xl font-black tracking-tighter mt-1 ${isDark ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{value}</p>
      </div>
    </div>
  );
}