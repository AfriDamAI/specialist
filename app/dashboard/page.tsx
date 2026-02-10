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
  AcademicCapIcon,
  ArrowRightIcon
} from '@heroicons/react/24/solid';
import { API_URL } from '@/lib/config';

export default function DashboardPage() {
  const [isVerified, setIsVerified] = useState(false);
  const [userName, setUserName] = useState('Specialist');
  const [userRole, setUserRole] = useState('Medical Personnel');
  const [stats, setStats] = useState({
    dailyEarnings: 0,
    portfolioBalance: 0,
    totalPatients: 0,
    trainingProgress: 35,
  });

  useEffect(() => {
    // Rule #5: Extraction of Real Session Identity
    const status = localStorage.getItem('specialistStatus');
    const storedName = localStorage.getItem('specialistName');
    const storedRole = localStorage.getItem('specialistRole');
    
    if (status === 'verified') setIsVerified(true);
    
    if (storedName) {
      const firstName = storedName.trim().split(' ')[0];
      setUserName(firstName);
    }

    if (storedRole) {
      setUserRole(storedRole);
    }

    // Data Hydration: Syncing with Backend
    async function fetchDashboardStats() {
      try {
        // 🛡️ RE-ENFORCED SINGULAR PATH: Verified via Render Shell
        const response = await fetch(`${API_URL}/consultation`); 
        const data = await response.json();
        
        if (data.succeeded && data.resultData) {
          const caseCount = Array.isArray(data.resultData) ? data.resultData.length : 0;
          setStats(prev => ({
            ...prev,
            totalPatients: caseCount,
            portfolioBalance: caseCount * 5000 
          }));
        }
      } catch (error) {
        console.error("Clinical Sync Error:", error);
      }
    }

    fetchDashboardStats();
  }, []);

  return (
    <DashboardLayout>
      <div className="w-full max-w-7xl mx-auto space-y-10 pb-24 md:pb-10 text-left italic">
        
        {/* Header Section */}
        <div className="flex flex-row items-center justify-between px-1">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">
                Hello, {userName}
              </h1>
              {isVerified && <CheckBadgeIcon className="w-8 h-8 md:w-10 md:h-10 text-[#FF7A59]" />}
            </div>
            <p className={`${isVerified ? 'text-green-500' : 'text-[#FF7A59]'} font-black text-[10px] md:text-xs uppercase tracking-[0.4em]`}>
               {userRole} • {isVerified ? 'Verified' : 'Pending Approval'}
            </p>
          </div>
          
          <div className="hidden md:block">
            <span className="bg-gray-100 dark:bg-gray-800 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 border border-gray-200 dark:border-gray-700">
              System Connection: <span className={isVerified ? 'text-green-500' : 'text-amber-500'}>{isVerified ? 'Connected' : 'Limited'}</span>
            </span>
          </div>
        </div>

        {/* Verification Gateway */}
        {!isVerified && (
          <div className="bg-black dark:bg-white rounded-[4rem] p-10 md:p-16 text-white dark:text-black shadow-2xl relative overflow-hidden">
            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
              <div className="flex-1 space-y-8">
                <div className="inline-flex items-center gap-2 bg-[#FF7A59] px-5 py-2 rounded-full shadow-lg">
                  <AcademicCapIcon className="w-4 h-4 text-white" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">Professional Training</span>
                </div>
                <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight uppercase italic">
                  Complete Your <br />Registration
                </h2>
                <Link 
                  href="/training"
                  className="inline-flex items-center gap-4 bg-white dark:bg-black text-black dark:text-white px-10 py-6 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform shadow-2xl"
                >
                  Start Training
                  <ArrowRightIcon className="w-5 h-5 text-[#FF7A59]" />
                </Link>
              </div>
              
              <div className="w-full lg:w-[400px] bg-white/10 dark:bg-black/5 p-10 rounded-[3.5rem] border border-white/10 dark:border-black/10 backdrop-blur-md">
                 <div className="flex justify-between items-end mb-6">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Course Progress</span>
                    <span className="text-5xl font-black tracking-tighter italic">{stats.trainingProgress}%</span>
                 </div>
                 <div className="h-3 bg-white/10 dark:bg-black/10 rounded-full overflow-hidden">
                    <div className="h-full bg-[#FF7A59] transition-all duration-1000" style={{ width: `${stats.trainingProgress}%` }} />
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StatCard 
            icon={<BanknotesIcon className="w-7 h-7" />} 
            label="Earnings Today" 
            value={`₦${stats.dailyEarnings.toLocaleString()}`} 
            color="bg-slate-900 text-white dark:bg-white dark:text-black" 
            isDark 
          />
          <StatCard 
            icon={<WalletIcon className="w-7 h-7" />} 
            label="Total Balance" 
            value={`₦${stats.portfolioBalance.toLocaleString()}`} 
            color="bg-white dark:bg-gray-800" 
          />
          <StatCard 
            icon={<UsersIcon className="w-7 h-7" />} 
            label="Total Patients" 
            value={stats.totalPatients.toString()} 
            color="bg-white dark:bg-gray-800" 
          />
        </div>

        {/* Active Patient List */}
        <div className="bg-white dark:bg-gray-800 rounded-[4rem] border border-gray-100 dark:border-gray-700 shadow-2xl overflow-hidden">
          <div className="px-12 py-10 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between bg-gray-50/30 dark:bg-gray-800/50">
            <div>
              <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Patient Waiting List</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase mt-1 tracking-widest italic">
                {isVerified ? 'Live Clinical Data Sync' : 'Viewing Sample Data • Complete Registration'}
              </p>
            </div>
            <div className="flex items-center gap-3">
               <div className={`${isVerified ? 'bg-green-500' : 'bg-red-500'} w-3 h-3 rounded-full animate-pulse`} />
               <span className={`text-[10px] font-black uppercase tracking-widest ${isVerified ? 'text-green-500' : 'text-red-500'}`}>
                 {isVerified ? 'Live' : 'Offline'}
               </span>
            </div>
          </div>
          <div className="p-12 min-h-[400px]">
            <ConsultationQueue />
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}

function StatCard({ icon, label, value, color, isDark = false }: { icon: any, label: string, value: string, color: string, isDark?: boolean }) {
  return (
    <div className={`${color} rounded-[3.5rem] p-10 shadow-xl border ${isDark ? 'border-transparent' : 'border-gray-100 dark:border-gray-700'} flex flex-col justify-between transition-all hover:-translate-y-2`}>
      <div className={`${isDark ? 'bg-white/10 dark:bg-black/5' : 'bg-gray-50 dark:bg-gray-900'} w-14 h-14 rounded-2xl flex items-center justify-center mb-10`}>
        <div className={isDark ? 'text-white dark:text-black' : 'text-[#FF7A59]'}>{icon}</div>
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{label}</p>
        <p className="text-4xl font-black tracking-tighter mt-1 italic">{value}</p>
      </div>
    </div>
  );
}