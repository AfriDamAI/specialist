'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Squares2X2Icon, 
  AcademicCapIcon, 
  CalendarDaysIcon, 
  UsersIcon, 
  ChatBubbleBottomCenterTextIcon,
  ClockIcon,
  ChartBarIcon,
  DocumentDuplicateIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  ArrowLeftOnRectangleIcon
} from '@heroicons/react/24/solid';

const menuItems = [
  { name: 'Dashboard', icon: Squares2X2Icon, href: '/dashboard' },
  { name: 'Academy', icon: AcademicCapIcon, href: '/training' },
  { name: 'Appointments', icon: CalendarDaysIcon, href: '/appointments' },
  { name: 'Patients', icon: UsersIcon, href: '/patients' },
  { name: 'Consultations', icon: ChatBubbleBottomCenterTextIcon, href: '/consultations' },
  { name: 'Schedule', icon: ClockIcon, href: '/schedule' },
  { name: 'Analytics', icon: ChartBarIcon, href: '/analytics' },
  { name: 'Documents', icon: DocumentDuplicateIcon, href: '/documents' },
  { name: 'Settings', icon: Cog6ToothIcon, href: '/settings' },
  { name: 'Support', icon: QuestionMarkCircleIcon, href: '/support' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState({ name: 'Specialist', role: 'Medical Personnel' });

  useEffect(() => {
    // Rule #3: Extracting unique session identity
    const savedName = localStorage.getItem('specialistName');
    const savedRole = localStorage.getItem('specialistRole');

    if (savedName) {
      setUser({
        name: savedName,
        role: savedRole || 'Medical Personnel'
      });
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <div className="hidden lg:flex flex-col w-72 h-screen bg-white dark:bg-gray-950 border-r border-gray-100 dark:border-gray-900 fixed left-0 top-0 z-50">
      
      {/* Brand Section */}
      <div className="p-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-black font-black text-xl italic">A</div>
        <span className="text-lg font-black tracking-tighter uppercase italic dark:text-white">AfriDam<span className="text-[#FF7A59]">AI</span></span>
      </div>

      {/* Specialist Identity Badge */}
      <div className="mx-6 mb-8 p-4 bg-gray-50 dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 flex items-center gap-4">
        <div className="w-12 h-12 bg-[#FF7A59] rounded-2xl flex items-center justify-center text-white font-black text-xl italic shadow-lg shadow-[#FF7A59]/20">
          {user.name.charAt(0)}
        </div>
        <div className="flex-1 overflow-hidden">
          <p className="text-sm font-black text-gray-900 dark:text-white truncate uppercase italic">{user.name}</p>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest truncate">{user.role}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all group ${
                isActive 
                ? 'bg-[#FF7A59] text-white shadow-lg shadow-[#FF7A59]/20' 
                : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-[#FF7A59]'}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Logout Action */}
      <div className="p-6 mt-auto">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
        >
          <ArrowLeftOnRectangleIcon className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
}