'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  ChatBubbleLeftRightIcon, 
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  ChevronRightIcon,
  InboxIcon,
  ArrowPathIcon
} from '@heroicons/react/24/solid';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client'; // 🏛️ Rule #6: Centralized Handshake

interface Consultation {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export default function ConsultationsHubPage() {
  const [isVerified, setIsVerified] = useState(false); 
  const [sessions, setSessions] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 🛡️ Rule #5: Access & Identity Protocol
    const status = localStorage.getItem('specialistStatus');
    if (status === 'verified') {
      setIsVerified(true);
    }

    async function fetchSessions() {
      try {
        /**
         * 🏛️ Rule #6: Precision Path - Using apiClient for automatic Token handling
         * Backend manifest confirms singular '/consultation' for the queue.
         */
        const response = await apiClient('/consultation');
        // Unwrapping response safely
        const data = response?.data || response;
        
        if (Array.isArray(data)) {
          // Rule #5: Priority Triage Sorting (Newest First)
          const sortedData = [...data].sort((a: any, b: any) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setSessions(sortedData);
        }
      } catch (error) {
        console.error("Clinical Database Sync Error:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (status === 'verified') {
      fetchSessions();
    } else {
      setIsLoading(false);
    }
  }, []);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6 pb-24 text-left animate-in fade-in duration-700 italic">
        
        {/* Header Section: Rule #4 Balance */}
        <div className="px-1">
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">
            Clinical <span className="text-[#FF7A59]">Queue</span>
          </h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-1">
            Real-Time Triage & Intelligence
          </p>
        </div>

        {/* Search Bar - Responsive Balance */}
        <div className={`relative px-1 transition-all duration-300 ${!isVerified ? 'opacity-50 grayscale' : 'opacity-100'}`}>
          <input 
            type="text" 
            disabled={!isVerified}
            placeholder={isVerified ? "Search by Patient Name or Case ID..." : "Verification Required to Search"}
            className={`w-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-[2rem] px-6 py-5 pl-14 text-sm font-bold outline-none transition-all ${
              isVerified ? 'focus:ring-2 focus:ring-[#FF7A59] shadow-sm' : 'cursor-not-allowed text-gray-400'
            }`}
          />
          <MagnifyingGlassIcon className="w-6 h-6 text-gray-300 absolute left-5 top-1/2 -translate-y-1/2" />
        </div>

        {/* Dynamic Queue Container */}
        <div className="relative min-h-[400px]">
          
          {/* Rule #5: Access Guardrail Overlay */}
          {!isVerified && (
            <div className="absolute inset-0 z-[60] backdrop-blur-xl bg-white/20 dark:bg-gray-950/20 flex items-center justify-center rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-gray-800">
              <div className="bg-white dark:bg-gray-900 p-10 rounded-[3rem] shadow-2xl text-center max-w-sm border border-gray-100 dark:border-gray-800">
                <ShieldCheckIcon className="w-12 h-12 text-[#FF7A59] mx-auto mb-4 animate-pulse" />
                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Queue Locked</h3>
                <p className="text-[10px] text-gray-500 font-black mt-2 leading-relaxed uppercase tracking-widest">
                  Verify your specialist credentials in the Academy to unlock clinical triage data.
                </p>
              </div>
            </div>
          )}

          <div className={`space-y-4 transition-all duration-500 ${!isVerified ? 'opacity-5 pointer-events-none select-none blur-sm' : 'opacity-100'}`}>
            
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <ArrowPathIcon className="w-8 h-8 text-[#FF7A59] animate-spin mb-4" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Hydrating Clinical Queue...</p>
              </div>
            ) : sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50/50 dark:bg-gray-900/50 rounded-[3rem] border border-gray-100 dark:border-gray-800">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-full shadow-lg mb-6">
                  <InboxIcon className="w-12 h-12 text-gray-200 dark:text-gray-700" />
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">No Active Cases</h3>
                <p className="text-[10px] text-gray-400 font-black mt-2 uppercase tracking-[0.2em]">
                  Your triage inbox is clear. New cases will appear instantly.
                </p>
              </div>
            ) : (
              sessions.map((session) => (
                <Link 
                  href={`/consultation/${session.id}`} 
                  key={session.id} 
                  className="block bg-white dark:bg-gray-800 p-6 md:p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 hover:border-[#FF7A59] hover:shadow-xl transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-gray-50 dark:bg-gray-900 rounded-2xl flex items-center justify-center text-xl font-black text-[#FF7A59] uppercase shadow-inner">
                        {(session.name || 'P').charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none group-hover:text-[#FF7A59] transition-colors">
                          {session.name || 'Emergency Triage'}
                        </h3>
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 mt-2 uppercase tracking-widest line-clamp-1">
                          {session.title || 'Clinical Analysis Required'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="hidden md:flex flex-col items-end">
                        <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Received</span>
                        <span className="text-[11px] font-black text-gray-900 dark:text-white uppercase">
                          {new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-xl group-hover:bg-[#FF7A59] group-hover:text-white transition-all shadow-sm">
                        <ChevronRightIcon className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}