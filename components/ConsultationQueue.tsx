'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
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

  // Rule #3: Fetching logic wrapped for reusability (Initial load + Manual refresh)
  const fetchLiveQueue = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const response = await fetch('http://172.20.10.6:5000/api/consultation');
      const data = await response.json();
      
      const activeCases = data.map((item: any) => ({
        id: item.id,
        patientName: item.patient?.firstName + " " + item.patient?.lastName || "Unknown Patient",
        status: item.status,
        createdAt: new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        urgency: item.urgencyLevel || 'NORMAL'
      }));

      setConsultations(activeCases);
    } catch (error) {
      console.error("Queue Sync Failed:", error);
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
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <ArrowPathIcon className="w-10 h-10 text-[#FF7A59] animate-spin" />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Querying AfriDam Core...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Queue Header with Manual Sync Button */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Network Live</span>
        </div>
        <button 
          onClick={() => fetchLiveQueue(true)}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-[#FF7A59]/10 group transition-all active:scale-95"
        >
          <ArrowPathIcon className={`w-3.5 h-3.5 text-gray-400 group-hover:text-[#FF7A59] ${isRefreshing ? 'animate-spin text-[#FF7A59]' : ''}`} />
          <span className="text-[9px] font-black text-gray-500 group-hover:text-[#FF7A59] uppercase tracking-widest">
            {isRefreshing ? 'Syncing...' : 'Refresh Queue'}
          </span>
        </button>
      </div>

      {consultations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-2 text-center bg-gray-50/50 dark:bg-gray-900/50 rounded-[2.5rem] border-2 border-dashed border-gray-100 dark:border-gray-800">
          <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
            <ExclamationCircleIcon className="w-8 h-8 text-gray-200" />
          </div>
          <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter">Queue Empty</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">No active consultations found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {consultations.map((item) => (
            <Link 
              href={`/consultations/${item.id}`} 
              key={item.id}
              className="flex items-center justify-between p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2.5rem] hover:border-[#FF7A59] hover:shadow-2xl hover:shadow-[#FF7A59]/5 transition-all group"
            >
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
                  item.urgency === 'HIGH' ? 'bg-red-50 text-red-500' : 'bg-gray-50 dark:bg-gray-800 text-gray-400'
                }`}>
                  <UserIcon className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none group-hover:text-[#FF7A59] transition-colors">
                    {item.patientName}
                  </h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase mt-2 tracking-wide">
                    Priority Shift • {item.createdAt}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-right hidden sm:block">
                  <span className={`text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] ${
                    item.urgency === 'HIGH' 
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                  }`}>
                    {item.urgency}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl group-hover:bg-[#FF7A59] group-hover:text-white transition-all">
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