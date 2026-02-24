'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ConsultationQueue from '@/components/ConsultationQueue';
import { apiClient } from '@/lib/api-client'; // 🏛️ Rule #6: Centralized Handshake
import { 
  CheckBadgeIcon, 
  WalletIcon, 
  UsersIcon, 
  BanknotesIcon
} from '@heroicons/react/24/solid';

export default function DashboardPage() {
  const [userName, setUserName] = useState('Specialist');
  const [userRole, setUserRole] = useState('Medical Personnel');
  const [stats, setStats] = useState({
    dailyEarnings: 0,
    portfolioBalance: 0,
    totalPatients: 0,
  });

  useEffect(() => {
    async function fetchSpecialistProfile() {
      try {
        // 🏛️ Rule #6: Verified handshake with resultData unwrapping
        const response = await apiClient('/specialists/me');
        const data = response?.resultData || response?.data || response;
        
        if (data) {
          // Rule #5: Humanizing the greeting with real names
          setUserName(data.firstName || 'Specialist');
          setUserRole(data.specialization || 'Medical Personnel');
          
          // Rule #3: Persistence sync for the layout
          localStorage.setItem('specialistName', `${data.firstName} ${data.lastName}`);
          localStorage.setItem('specialistRole', data.specialization || '');
          localStorage.setItem('specialistStatus', 'verified'); 
        }
      } catch (error) {
        console.warn("👤 Profile Sync: Using cached identity.");
      }
    }

    async function fetchDashboardStats() {
      try {
        // 🏛️ Rule #6: Real-time Consultation Sync
        const response = await apiClient('/consultation'); 
        const consultations = response?.resultData || response?.data || response || [];
        
        if (Array.isArray(consultations)) {
          const completedCases = consultations.filter((c: any) => c.status === 'COMPLETED');
          
          // 💰 70/30 Neural Earning Model
          const totalRevenue = completedCases.reduce((acc: number, curr: any) => acc + (Number(curr.price) || 0), 0);
          const specialistShare = totalRevenue * 0.7;

          setStats({
            totalPatients: consultations.length,
            portfolioBalance: specialistShare,
            dailyEarnings: completedCases.length > 0 ? (Number(completedCases[0].price) * 0.7) : 0
          });
        }
      } catch (error) {
        console.warn("📊 Stats Sync: System idling.");
      }
    }

    fetchSpecialistProfile();
    fetchDashboardStats();
  }, []);

  return (
    <DashboardLayout>
      <div className="w-full max-w-7xl mx-auto space-y-10 pb-24 md:pb-10 text-left italic">
        
        {/* Header Section: Rule #4 Balanced View */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 px-1">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl md:text-7xl font-black text-black dark:text-white tracking-tighter italic">
                Hello, <span className="text-[#FF7A59]">{userName}</span>
              </h1>
              <CheckBadgeIcon className="w-8 h-8 md:w-12 md:h-12 text-[#FF7A59] drop-shadow-lg" />
            </div>
            {/* World-Class Mix: Bold secondary labels in sentence case */}
            <p className="text-gray-500 dark:text-gray-400 font-bold text-sm md:text-base tracking-tight">
               {userRole} <span className="mx-2 text-gray-300">•</span> Verified Specialist
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/10 px-5 py-2.5 rounded-2xl border border-green-100 dark:border-green-800">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-green-600">
              System Live
            </span>
          </div>
        </div>

        {/* Stats Grid: Rule #4 Laptop Balanced View */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StatCard 
            icon={<BanknotesIcon className="w-7 h-7" />} 
            label="Earnings today" 
            value={`₦${stats.dailyEarnings.toLocaleString()}`} 
            color="bg-black text-white dark:bg-white dark:text-black" 
            isDark 
          />
          <StatCard 
            icon={<WalletIcon className="w-7 h-7" />} 
            label="Portfolio balance" 
            value={`₦${stats.portfolioBalance.toLocaleString()}`} 
            color="bg-white dark:bg-gray-950" 
          />
          <StatCard 
            icon={<UsersIcon className="w-7 h-7" />} 
            label="Clinical cases" 
            value={stats.totalPatients.toString()} 
            color="bg-white dark:bg-gray-950" 
          />
        </div>

        {/* Active Patient List: World-Class Container */}
        <div className="bg-white dark:bg-gray-950 rounded-[3.5rem] border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden transition-all">
          <div className="px-8 md:px-12 py-10 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between bg-gray-50/30 dark:bg-gray-900/20">
            <div>
              <h2 className="text-2xl font-black text-black dark:text-white tracking-tighter italic">Clinical Queue</h2>
              <p className="text-xs font-bold text-gray-400 mt-1 tracking-tight italic">
                Synchronized with backend repository
              </p>
            </div>
          </div>
          <div className="p-6 md:p-12 min-h-[400px]">
            <ConsultationQueue />
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}

function StatCard({ icon, label, value, color, isDark = false }: { icon: any, label: string, value: string, color: string, isDark?: boolean }) {
  return (
    <div className={`${color} rounded-[3.5rem] p-10 shadow-xl border ${isDark ? 'border-transparent' : 'border-gray-100 dark:border-gray-800 shadow-gray-200/50 dark:shadow-none'} flex flex-col justify-between transition-all hover:-translate-y-2`}>
      <div className={`${isDark ? 'bg-white/10' : 'bg-gray-50 dark:bg-gray-900'} w-14 h-14 rounded-2xl flex items-center justify-center mb-12`}>
        <div className={isDark ? 'text-white dark:text-black' : 'text-[#FF7A59]'}>{icon}</div>
      </div>
      <div>
        {/* World-Class Mix: Small uppercase labels, giant sentence-case values */}
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-2 italic">{label}</p>
        <p className="text-4xl md:text-5xl font-black tracking-tighter italic text-inherit">{value}</p>
      </div>
    </div>
  );
}