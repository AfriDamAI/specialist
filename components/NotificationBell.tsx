'use client';

import { useState, useRef, useEffect } from 'react';
// Rule #3: Matching the singular export from NotificationContext
import { useNotification } from '../context/NotificationContext'; 
import { BellIcon, CheckBadgeIcon, ClockIcon } from '@heroicons/react/24/solid';

export default function NotificationBell() {
  const { unreadCount, notifications, markAsRead } = useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside the neural interface
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative italic" ref={dropdownRef}>
      {/* The Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-12 h-12 md:w-14 md:h-14 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center border border-gray-100 dark:border-gray-700 shadow-xl transition-all active:scale-90 group z-[70]"
      >
        <BellIcon className={`w-6 h-6 transition-colors ${isOpen ? 'text-[#FF7A59]' : 'text-gray-400 group-hover:text-[#FF7A59]'}`} />
        
        {unreadCount > 0 && (
          <div className="absolute top-3 right-3 md:top-4 md:right-4 flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-[#FF7A59] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FF7A59] border-2 border-white dark:border-gray-800"></span>
          </div>
        )}

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-black text-white text-[8px] font-black px-1.5 py-0.5 rounded-full border border-white dark:border-gray-800 shadow-lg">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* The Notification Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-4 w-80 md:w-96 bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 z-[100] overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
          <div className="p-6 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white">Clinical Alerts</h3>
            {unreadCount > 0 && (
              <span className="text-[9px] font-black text-[#FF7A59] uppercase tracking-widest">
                {unreadCount} New Pulse
              </span>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {notifications && notifications.length > 0 ? (
              notifications.map((notif: any) => (
                <div 
                  key={notif.id} 
                  className={`p-5 border-b border-gray-50 dark:border-gray-800 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer ${!notif.isRead ? 'bg-[#FF7A59]/5' : ''}`}
                  onClick={() => markAsRead(notif.id)}
                >
                  <div className="flex gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${!notif.isRead ? 'bg-[#FF7A59] text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
                      {notif.type === 'appointment' ? <ClockIcon className="w-5 h-5" /> : <CheckBadgeIcon className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight uppercase tracking-tighter">
                        {notif.title}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-1 leading-relaxed line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-[8px] font-black text-gray-300 dark:text-gray-600 uppercase mt-2 tracking-widest">
                        {notif.time || 'Just now'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <BellIcon className="w-10 h-10 text-gray-100 dark:text-gray-800 mx-auto mb-4" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">
                  Neural Inbox Clear
                </p>
              </div>
            )}
          </div>

          <button className="w-full p-4 text-[9px] font-black text-[#FF7A59] uppercase tracking-[0.2em] bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            View All Protocols
          </button>
        </div>
      )}
    </div>
  );
}