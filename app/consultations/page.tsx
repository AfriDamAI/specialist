'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  ChatBubbleLeftRightIcon, 
  MagnifyingGlassIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  ChevronRightIcon
} from '@heroicons/react/24/solid';
import Link from 'next/link';

export default function ConsultationsHubPage() {
  // Rule #5: Dynamic state linked to the Global Verification Protocol
  const [isVerified, setIsVerified] = useState(false); 

  useEffect(() => {
    // Rule #3: Syncing with production session status set in Training Hub
    const status = localStorage.getItem('specialistStatus');
    if (status === 'verified') {
      setIsVerified(true);
    }
  }, []);

  // Production Mock data (Verified specialists see real patient names)
  const mockSessions = [
    { id: '101', patient: 'Amaka Adeleke', lastMsg: 'The rash is spreading to the neck...', time: '2m ago', urgency: 'HIGH' },
    { id: '102', patient: 'Musa Ibrahim', patientInitials: 'MI', lastMsg: 'Pharmacy confirmed the pick up.', time: '1h ago', urgency: 'LOW' },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6 pb-24">
        
        {/* Header */}
        <div className="px-1">
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">
            Consultation <span className="text-[#FF7A59]">Hub</span>
          </h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-1">
            Clinical Inbox & Messaging
          </p>
        </div>

        {/* Search Bar - Responsive State */}
        <div className={`relative px-1 transition-opacity duration-300 ${!isVerified ? 'opacity-50' : 'opacity-100'}`}>
          <input 
            type="text" 
            disabled={!isVerified}
            placeholder={isVerified ? "Search by Patient Name or Case ID..." : "Search restricted..."}
            className={`w-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-[2rem] px-6 py-5 pl-14 text-sm font-bold outline-none transition-all ${
              isVerified ? 'focus:ring-2 focus:ring-[#FF7A59] shadow-sm' : 'cursor-not-allowed'
            }`}
          />
          <MagnifyingGlassIcon className="w-6 h-6 text-gray-300 absolute left-5 top-1/2 -translate-y-1/2" />
        </div>

        {/* The List Container */}
        <div className="relative min-h-[500px]">
          
          {/* Rule #5: Hard Lock Overlay */}
          {!isVerified && (
            <div className="absolute inset-0 z-[60] backdrop-blur-xl bg-white/20 dark:bg-gray-950/20 flex items-center justify-center rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-gray-800 animate-in fade-in duration-500">
              <div className="bg-white dark:bg-gray-900 p-10 rounded-[3rem] shadow-2xl text-center max-w-sm border border-gray-100 dark:border-gray-800 animate-in zoom-in duration-300">
                <ShieldCheckIcon className="w-12 h-12 text-amber-500 mx-auto mb-4 animate-pulse" />
                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Access Locked</h3>
                <p className="text-xs text-gray-500 font-bold mt-2 leading-relaxed uppercase">
                  Your clinical inbox is encrypted. It will unlock and sync with active cases once your medical license vetting is complete.
                </p>
              </div>
            </div>
          )}

          {/* Dynamic Content: Swaps from Blurred to List based on isVerified */}
          <div className={`space-y-4 transition-all duration-500 ${!isVerified ? 'opacity-10 pointer-events-none select-none grayscale' : 'opacity-100'}`}>
            {mockSessions.map((session) => (
              <Link 
                href={`/consultations/${session.id}`}
                key={session.id} 
                className="block bg-white dark:bg-gray-800 p-6 md:p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 hover:border-[#FF7A59] hover:shadow-xl transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-gray-50 dark:bg-gray-900 rounded-2xl flex items-center justify-center text-xl font-black text-gray-300 uppercase">
                      {session.patient.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">
                          {session.patient}
                        </h3>
                        {session.urgency === 'HIGH' && (
                          <span className="bg-red-50 text-red-600 text-[8px] font-black px-2 py-0.5 rounded uppercase">Urgent</span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-2 line-clamp-1">
                        {session.lastMsg}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="hidden md:block text-[10px] font-black text-gray-400 uppercase tracking-widest">{session.time}</span>
                    <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-xl group-hover:bg-[#FF7A59] group-hover:text-white transition-all">
                      <ChevronRightIcon className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}