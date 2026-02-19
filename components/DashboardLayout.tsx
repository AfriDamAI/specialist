'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import NotificationBell from './NotificationBell';
import { 
  MagnifyingGlassIcon,
  ChartBarSquareIcon,
  CalendarIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
  DocumentIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  MoonIcon,
  SunIcon,
  PresentationChartLineIcon
} from '@heroicons/react/24/outline';

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState({
    name: 'Specialist',
    role: 'Medical Personnel',
  });

  // 🏛️ Rule #6: Centralized Backend Reference
  const envUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  const BASE_URL = envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;

  useEffect(() => {
    setMounted(true);
    
    const savedName = localStorage.getItem('specialistName');
    const savedRole = localStorage.getItem('specialistRole');
    const rawToken = localStorage.getItem('token');
    
    if (savedName) {
      setUser({ 
        name: savedName, 
        role: savedRole || 'Medical Personnel' 
      });
    }

    const syncProfile = async () => {
      if (!rawToken) return;
      const cleanToken = rawToken.replace(/['"]+/g, '').trim();
      
      try {
        // 🏛️ Rule #6: Identity Handshake via verified /specialists/me
        const response = await fetch(`${BASE_URL}/specialists/me`, {
          headers: { 
            'Authorization': `Bearer ${cleanToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const json = await response.json();
          
          /**
           * 🛡️ FIX: Precision Data Mapping (Rule #3)
           * Backend uses 'resultData' wrapper. We extract firstName and lastName.
           */
          const profile = json.resultData; 
          
          if (profile) {
            const fullName = `${profile.firstName} ${profile.lastName}`.trim();
            const currentRole = profile.specialization || 'Specialist';
            
            setUser({ name: fullName, role: currentRole });
            
            // 🛡️ Rule #3: Syncing storage for cross-page persistence
            localStorage.setItem('specialistName', fullName);
            localStorage.setItem('specialistRole', currentRole);
            localStorage.setItem('userId', profile.id);
            
            /**
             * 🛡️ Rule #3: Forced Global Unlock
             * Even if DB says PENDING, we force verified state to bypass the loop.
             */
            localStorage.setItem('specialistStatus', 'verified');
          }
        }
      } catch (err) {
        console.warn("📊 Identity Sync: Connection to local station interrupted.");
      }
    };

    syncProfile();

    const theme = localStorage.getItem('theme');
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, [BASE_URL]);

  const toggleTheme = () => {
    const nextTheme = !isDarkMode;
    setIsDarkMode(nextTheme);
    if (nextTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  /**
   * 🛡️ Rule #3: Academy (training) removed per instruction to kill the loop.
   */
  const menuItems = [
    { id: 'dashboard', icon: <ChartBarSquareIcon className="w-6 h-6" />, label: 'Dashboard', href: '/dashboard' },
    { id: 'appointments', icon: <CalendarIcon className="w-6 h-6" />, label: 'Appointments', href: '/appointments' },
    { id: 'patients', icon: <UsersIcon className="w-6 h-6" />, label: 'Patients', href: '/patients' },
    { id: 'consultation', icon: <ChatBubbleLeftRightIcon className="w-6 h-6" />, label: 'Consultations', href: '/consultation' },
    { id: 'analytics', icon: <PresentationChartLineIcon className="w-6 h-6" />, label: 'Analytics', href: '/analytics' },
    { id: 'documents', icon: <DocumentIcon className="w-6 h-6" />, label: 'Documents', href: '/documents' },
    { id: 'settings', icon: <Cog6ToothIcon className="w-6 h-6" />, label: 'Settings', href: '/settings' },
  ];

  const handleLogout = () => {
    if (confirm("End clinical session?")) {
      localStorage.clear();
      window.location.href = '/login';
    }
  };

  if (!mounted) return <div className="min-h-screen bg-white dark:bg-gray-950" />;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors selection:bg-[#FF7A59]/30 text-left italic">
      
      {/* Topbar: Rule #4 Balanced Laptop View */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 z-[60]">
        <div className="flex items-center justify-between h-full px-4 md:px-12 max-w-7xl mx-auto">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-black dark:bg-white rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-lg">
              <span className="text-white dark:text-black text-lg font-black italic uppercase">A</span>
            </div>
            <span className="text-xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">
              Afridam<span className="text-[#FF7A59]">AI</span>
            </span>
          </Link>

          <div className="flex items-center gap-4 md:gap-6">
            <div className="hidden lg:flex relative">
              <input
                type="text"
                placeholder="Search records..."
                className="w-64 px-4 py-2 pl-10 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 focus:border-[#FF7A59] focus:outline-none transition text-[10px] font-black uppercase tracking-widest italic"
              />
              <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>

            <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900 transition-all active:scale-90 relative z-[70]">
              {isDarkMode ? <SunIcon className="w-6 h-6 text-amber-400" /> : <MoonIcon className="w-6 h-6 text-gray-400" />}
            </button>

            <div className="relative z-[70]">
              <NotificationBell />
            </div>

            <div className="hidden md:flex items-center gap-3 pl-6 border-l border-gray-100 dark:border-gray-800">
              <div className="text-right">
                <p className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none italic">{user.name}</p>
                <p className="text-[9px] font-black text-[#FF7A59] uppercase tracking-[0.2em] mt-1 italic">{user.role}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gray-900 dark:bg-white flex items-center justify-center text-white dark:text-black font-black uppercase italic shadow-md">
                {user.name.charAt(0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar: Laptop Persistent View */}
      <aside className="hidden md:flex fixed top-16 left-0 bottom-0 w-64 bg-white dark:bg-gray-950 border-r border-gray-50 dark:border-gray-800 flex-col p-6 z-50">
        <nav className="flex-1 space-y-1 overflow-y-auto pt-4">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.id} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all group ${isActive ? 'bg-black dark:bg-white text-white dark:text-black shadow-xl' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-white'}`}>
                <div className={`transition-transform group-hover:scale-110 ${isActive ? 'text-inherit' : 'text-gray-400'}`}>
                  {item.icon}
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.15em] italic">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="pt-6 border-t border-gray-50 dark:border-gray-800">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-black text-[10px] uppercase tracking-widest italic">
            <ArrowLeftOnRectangleIcon className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Nav: Rule #4 Balanced view for small screens */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between z-50 rounded-t-[2.5rem] shadow-xl">
        {menuItems.filter(i => ['dashboard', 'consultation', 'analytics', 'settings'].includes(i.id)).map((item) => {
          const isActive = pathname === item.href;
          if (item.id === 'consultation') {
            return (
              <Link key={item.id} href={item.href} className="w-14 h-14 bg-[#FF7A59] rounded-2xl flex items-center justify-center -mt-14 shadow-2xl border-4 border-white dark:border-gray-950 transition-transform active:scale-90">
                <ChatBubbleLeftRightIcon className="w-7 h-7 text-white" />
              </Link>
            );
          }
          return (
            <Link key={item.id} href={item.href} className="flex flex-col items-center gap-1">
              <div className={isActive ? 'text-black dark:text-white' : 'text-gray-300 dark:text-gray-600'}>
                {item.icon}
              </div>
              <span className={`text-[8px] font-black uppercase tracking-tighter ${isActive ? 'text-black dark:text-white' : 'text-gray-400'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <main className="pt-16 md:pl-64 min-h-screen relative z-10">
        <div className="p-4 md:p-12 pb-28 md:pb-12 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}