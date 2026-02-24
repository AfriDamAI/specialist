'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client'; // 🏛️ Rule #6: Centralized Synergy
import { 
  UserIcon, 
  ChevronRightIcon, 
  ArrowPathIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/solid';

interface Consultation {
  id: string;
  patientName: string;
  status: string;
  createdAt: string;
  urgency: 'HIGH' | 'NORMAL';
}

export default function ConsultationQueue() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const fetchLiveQueue = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else setIsLoading(true);
    setError(false);

    try {
      /**
       * 🏛️ Rule #6: Verified Backend Path (Singular).
       * Pulling the clinical manifest from the /consultation endpoint.
       */
      const response = await apiClient('/consultation');
      const sourceData = response.resultData || response.data || response || [];
      
      const activeCases: Consultation[] = Array.isArray(sourceData) ? sourceData.map((item: any) => ({
        id: item.id,
        patientName: item.name || (item.user ? `${item.user.firstName} ${item.user.lastName}` : "Specialist Triage"),
        status: item.status || 'PENDING',
        createdAt: new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        urgency: (item.planTier === 'Instant' || item.title?.toLowerCase().includes('urgent') ? 'HIGH' : 'NORMAL') as 'HIGH' | 'NORMAL'
      })) : [];

      setConsultations(activeCases);
    } catch (err) {
      console.warn("📊 Queue Sync: Connection to neural core interrupted.");
      setError(true);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveQueue();
  }, [fetchLiveQueue]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <ArrowPathIcon className="w-10 h-10 text-[#FF7A59] animate-spin" />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] italic">Updating Patient List...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left italic">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
           <div className={`w-2 h-2 rounded-full animate-pulse ${error ? 'bg-red-500' : 'bg-green-500'}`} />
           <span className="text-[10px] font-black uppercase tracking-widest italic text-black dark:text-gray-400">
             {error ? 'Handshake refused' : 'System live'}
           </span>
        </div>
        <button 
          onClick={() => fetchLiveQueue(true)}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-5 py-2 bg-gray-50 dark:bg-gray-800 rounded-2xl hover:bg-[#FF7A59]/10 group transition-all"
        >
          <ArrowPathIcon className={`w-3.5 h-3.5 text-gray-400 group-hover:text-[#FF7A59] ${isRefreshing ? 'animate-spin text-[#FF7A59]' : ''}`} />
          <span className="text-[9px] font-black text-gray-500 group-hover:text-[#FF7A59] uppercase tracking-widest italic leading-none">
            {isRefreshing ? 'Refreshing' : 'Update queue'}
          </span>
        </button>
      </div>

      {consultations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-2 text-center bg-gray-50/50 dark:bg-gray-900/30 rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-gray-800">
          <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-[1.5rem] flex items-center justify-center mb-4 shadow-sm">
            <ExclamationCircleIcon className="w-8 h-8 text-gray-200" />
          </div>
          <h3 className="text-xl font-black text-black dark:text-white italic">No patients found</h3>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">Your waiting list is currently clear</p>
        </div>
      ) : (
        <div className="space-y-4">
          {consultations.map((item) => (
            <Link 
              href={`/consultation/${item.id}`} 
              key={item.id}
              className="flex items-center justify-between p-6 md:p-8 bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-[3rem] hover:border-[#FF7A59] hover:shadow-2xl transition-all group"
            >
              <div className="flex items-center gap-6">
                <div className={`w-14 h-14 md:w-16 md:h-16 rounded-[1.5rem] flex items-center justify-center transition-colors ${
                  item.urgency === 'HIGH' ? 'bg-red-50 text-red-500' : 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                }`}>
                  <UserIcon className="w-7 h-7" />
                </div>
                <div>
                  {/* 🛡️ World-Class Mix: Bold Sentence Case Name */}
                  <h4 className="text-lg md:text-xl font-black text-black dark:text-white tracking-tighter leading-none group-hover:text-[#FF7A59] transition-colors italic">
                    {item.patientName}
                  </h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase mt-2.5 tracking-widest italic">
                    Appointment set <span className="mx-1">•</span> {item.createdAt}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-right hidden sm:block">
                  <span className={`text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] italic ${
                    item.urgency === 'HIGH' 
                    ? 'bg-red-500 text-white' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                  }`}>
                    {item.urgency === 'HIGH' ? 'Urgent' : 'Routine'}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl group-hover:bg-[#FF7A59] group-hover:text-white transition-all shadow-sm">
                  <ChevronRightIcon className="w-5 h-5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}