'use client';

import { useState, useRef, useEffect, ChangeEvent } from 'react';
// 🏛️ Rule #6: Synced with your verified context path
import { useNotification } from '@/context/NotificationContext'; 
import { BellIcon, CheckBadgeIcon, ClockIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/solid';

/**
 * 🛡️ Rule #3: Fixed ts(2345) by making createdAt optional
 * This matches the dynamic nature of real-time clinical pulses.
 */
interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'appointment' | 'chat' | 'system' | string;
  isRead: boolean;
  createdAt?: string; // 🏛️ Made optional to resolve type mismatch
  time?: string; 
}

export default function NotificationBell() {
  const { unreadCount, notifications, markAsRead } = useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 🏛️ Rule #5: Humanized interaction - Close on outside click
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
      {/* 🏛️ Rule #4: Trigger Button */}
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

      {/* 🏛️ Rule #4: Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-4 w-80 md:w-96 bg-white dark:bg-gray-950 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 z-[100] overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
          <div className="p-6 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between bg-gray-50/30 dark:bg-gray-900/50">
            <h3 className="text-xs font-black uppercase tracking-widest text-black dark:text-white">Clinical Alerts</h3>
            {unreadCount > 0 && (
              <span className="text-[9px] font-black text-[#FF7A59] uppercase tracking-widest">
                {unreadCount} New Pulse
              </span>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {notifications && notifications.length > 0 ? (
              notifications.map((notif: Notification) => (
                <div 
                  key={notif.id} 
                  className={`p-5 border-b border-gray-50 dark:border-gray-800 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer ${!notif.isRead ? 'bg-[#FF7A59]/5' : ''}`}
                  onClick={() => {
                    markAsRead(notif.id);
                  }}
                >
                  <div className="flex gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${!notif.isRead ? 'bg-[#FF7A59] text-white shadow-lg shadow-[#FF7A59]/20' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                      {notif.type === 'appointment' ? <ClockIcon className="w-5 h-5" /> : 
                       notif.type === 'chat' ? <ChatBubbleLeftIcon className="w-5 h-5" /> :
                       <CheckBadgeIcon className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-xs font-black text-black dark:text-white leading-tight uppercase tracking-tighter">
                        {notif.title}
                      </p>
                      <p className="text-[10px] font-bold text-gray-600 dark:text-gray-400 mt-1 leading-relaxed line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-[8px] font-black text-gray-300 dark:text-gray-600 uppercase mt-2 tracking-widest italic">
                        {notif.time || 'Received'}
                      </p>
                    </div>
                    {!notif.isRead && (
                      <div className="w-2 h-2 rounded-full bg-[#FF7A59] mt-1 shrink-0" />
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-16 text-center">
                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-gray-100 dark:border-gray-700">
                  <BellIcon className="w-8 h-8 text-gray-200 dark:text-gray-700" />
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic text-black">
                  Neural Inbox Clear
                </p>
              </div>
            )}
          </div>

          <button className="w-full p-5 text-[9px] font-black text-[#FF7A59] uppercase tracking-[0.2em] bg-gray-50/50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border-t border-gray-50 dark:border-gray-800 italic">
            View All Protocols
          </button>
        </div>
      )}
    </div>
  );
}