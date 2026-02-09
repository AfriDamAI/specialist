'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  BellIcon, 
  MagnifyingGlassIcon,
  ChartBarSquareIcon,
  CalendarIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  DocumentIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  ArrowLeftOnRectangleIcon,
  PresentationChartLineIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [user, setUser] = useState({
    name: 'Specialist',
    role: 'Medical Personnel',
  });

  useEffect(() => {
    // Rule #3: Dynamic production data retrieval for Specialist session
    const savedName = localStorage.getItem('specialistName');
    const savedRole = localStorage.getItem('specialistRole');

    if (savedName) {
      setUser({
        name: savedName,
        role: savedRole || 'Medical Personnel',
      });
    }
  }, []);

  // Rule #3: Complete Specialist Curriculum & Workflow Menu
  const menuItems = [
    { id: 'dashboard', icon: <ChartBarSquareIcon className="w-6 h-6" />, label: 'Dashboard', href: '/dashboard' },
    { id: 'training', icon: <AcademicCapIcon className="w-6 h-6" />, label: 'Academy', href: '/training' },
    { id: 'appointments', icon: <CalendarIcon className="w-6 h-6" />, label: 'Appointments', href: '/appointments' },
    { id: 'patients', icon: <UsersIcon className="w-6 h-6" />, label: 'Patients', href: '/patients' },
    { id: 'consultations', icon: <ChatBubbleLeftRightIcon className="w-6 h-6" />, label: 'Consultations', href: '/consultations' },
    { id: 'schedule', icon: <ClockIcon className="w-6 h-6" />, label: 'Schedule', href: '/schedule' },
    { id: 'analytics', icon: <PresentationChartLineIcon className="w-6 h-6" />, label: 'Analytics', href: '/analytics' },
    { id: 'documents', icon: <DocumentIcon className="w-6 h-6" />, label: 'Documents', href: '/documents' },
    { id: 'settings', icon: <Cog6ToothIcon className="w-6 h-6" />, label: 'Settings', href: '/settings' },
  ];

  const handleLogout = () => {
    // Rule #5: Specialist session termination
    const confirmLogout = confirm("Are you sure you want to end your clinical session?");
    if (confirmLogout) {
      // Clear security and identity flags
      localStorage.removeItem('specialistStatus');
      localStorage.removeItem('specialistName');
      localStorage.removeItem('specialistRole');
      localStorage.removeItem('token');
      
      // Rule #3: Forced clean redirect to avoid 404 pathing errors
      window.location.href = '/auth/specialist/login';
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors selection:bg-[#FF7A59]/30">
      
      {/* Topbar - Executive Clinical Grade */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 z-50">
        <div className="flex items-center justify-between h-full px-4 md:px-12 max-w-7xl mx-auto">
          {/* Logo Section */}
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-black dark:bg-white rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-lg shadow-black/5">
              <span className="text-white dark:text-black text-lg font-black italic">A</span>
            </div>
            <span className="text-xl font-black text-gray-900 dark:text-white tracking-tighter">
              Afridam<span className="text-[#FF7A59]">AI</span>
            </span>
          </Link>

          {/* Global Search & Specialist Actions */}
          <div className="flex items-center gap-6">
            <div className="hidden lg:flex relative">
              <input
                type="text"
                placeholder="Search case records..."
                className="w-64 px-4 py-2 pl-10 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 focus:border-[#FF7A59] focus:outline-none transition text-sm font-bold"
              />
              <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>

            <button className="relative p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition active:scale-90">
              <BellIcon className="w-6 h-6 text-gray-500" />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-[#FF7A59] rounded-full ring-2 ring-white dark:ring-gray-950"></span>
            </button>

            <div className="hidden md:flex items-center gap-3 pl-6 border-l border-gray-100 dark:border-gray-800">
              <div className="text-right">
                <p className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">{user.name}</p>
                <p className="text-[9px] font-bold text-[#FF7A59] uppercase tracking-[0.2em] mt-1">{user.role}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gray-900 dark:bg-white flex items-center justify-center text-white dark:text-black font-black shadow-md">
                {user.name.charAt(0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar - Desktop Specialist Control */}
      <aside className="hidden md:flex fixed top-16 left-0 bottom-0 w-64 bg-white dark:bg-gray-950 border-r border-gray-50 dark:border-gray-800 flex-col p-6 z-40">
        <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar pr-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.id}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-black dark:bg-white text-white dark:text-black shadow-xl shadow-black/10' 
                    : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <div className={`transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-inherit' : 'text-gray-400'}`}>
                  {item.icon}
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.15em]">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="pt-6 border-t border-gray-50 dark:border-gray-800 space-y-1">
          <Link href="/support" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-gray-900 transition font-black">
            <QuestionMarkCircleIcon className="w-5 h-5" />
            <span className="text-[10px] uppercase tracking-widest">Support</span>
          </Link>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition font-black"
          >
            <ArrowLeftOnRectangleIcon className="w-5 h-5" />
            <span className="text-[10px] uppercase tracking-widest text-left">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav - Optimized for Clinical Triage */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between z-50 rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        {menuItems.filter(i => ['dashboard', 'training', 'consultations', 'analytics', 'settings'].includes(i.id)).map((item) => {
          const isActive = pathname === item.href;
          
          if (item.id === 'consultations') {
            return (
              <Link 
                key={item.id}
                href={item.href}
                className="w-14 h-14 bg-[#FF7A59] rounded-2xl flex items-center justify-center -mt-14 shadow-2xl shadow-[#FF7A59]/40 border-4 border-white dark:border-gray-950 transition-transform active:scale-90"
              >
                <ChatBubbleLeftRightIcon className="w-7 h-7 text-white" />
              </Link>
            );
          }

          return (
            <Link 
              key={item.id}
              href={item.href}
              className="flex flex-col items-center gap-1 active:scale-90 transition-all"
            >
              <div className={`transition-colors duration-200 ${isActive ? 'text-black dark:text-white' : 'text-gray-300 dark:text-gray-600'}`}>
                {item.icon}
              </div>
              <span className={`text-[8px] font-black uppercase tracking-tighter transition-colors ${isActive ? 'text-black dark:text-white' : 'text-gray-400'}`}>
                {item.id === 'dashboard' ? 'Home' : item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Main Clinical Content Area */}
      <main className="pt-16 md:pl-64 min-h-screen">
        <div className="p-4 md:p-12 pb-28 md:pb-12 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
          {children || (
            <div className="flex flex-col items-center justify-center py-24 opacity-20">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-3xl flex items-center justify-center mb-6">
                <span className="text-4xl text-gray-400">🏥</span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Awaiting Clinical Selection</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}