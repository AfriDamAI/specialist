'use client';

import { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  UsersIcon, 
  MagnifyingGlassIcon, 
  PlusIcon,
  FunnelIcon,
  LockClosedIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  InboxIcon,
  ChatBubbleBottomCenterTextIcon,
  ClockIcon
} from '@heroicons/react/24/solid';

interface PatientRecord {
  id: string;
  name: string;
  createdAt: string;
  title: string;
  lastMessage?: string;
  lastActivityTime?: string;
}

export default function PatientsPage() {
  const [isVerified, setIsVerified] = useState(false); 
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Helper: Rule #3 - Production-ready relative time formatter
  const formatRelativeTime = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInMs = now.getTime() - past.getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMins / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${diffInDays}d ago`;
  };

  useEffect(() => {
    const status = localStorage.getItem('specialistStatus');
    if (status === 'verified') {
      setIsVerified(true);
    }

    async function fetchPatientsWithHistory() {
      try {
        const response = await fetch('https://afridamai-backend.onrender.com/api/consultations');
        const data = await response.json();
        
        if (data.succeeded && data.data) {
          const patientList = data.data;

          // Rule #3: Deep Syncing Chat History with Records
          const detailedPatients = await Promise.all(
            patientList.map(async (patient: any) => {
              try {
                const chatRes = await fetch(`https://afridamai-backend.onrender.com/api/chat/${patient.id}`);
                const chatData = await chatRes.json();
                const lastMsgObj = chatData.data?.[chatData.data.length - 1];
                
                return { 
                  ...patient, 
                  lastMessage: lastMsgObj?.message,
                  lastActivityTime: lastMsgObj?.createdAt || patient.createdAt 
                };
              } catch (e) {
                return { ...patient, lastActivityTime: patient.createdAt };
              }
            })
          );

          setPatients(detailedPatients);
        }
      } catch (error) {
        console.error("Clinical Directory Sync Error:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (status === 'verified') {
      fetchPatientsWithHistory();
    } else {
      setIsLoading(false);
    }
  }, []);

  const filteredPatients = useMemo(() => {
    return patients.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, patients]);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6 pb-20 text-left">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">
              Patient <span className="text-[#FF7A59]">Directory</span>
            </h1>
            <p className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-[0.3em] mt-1">
              Clinical Records & Case Management
            </p>
          </div>
          
          <button className="bg-black dark:bg-white text-white dark:text-black px-6 py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg">
            <PlusIcon className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-widest">Register Patient</span>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-9 relative">
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={!isVerified}
              placeholder={isVerified ? "Search by name, ID, or condition..." : "Verification required to search..."}
              className="w-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl px-6 py-4 pl-12 text-sm font-bold focus:ring-2 focus:ring-[#FF7A59] outline-none transition-all shadow-sm"
            />
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          </div>
          <button className="md:col-span-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl px-6 py-4 flex items-center justify-center gap-3 hover:bg-gray-50 transition-all">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">Filters</span>
          </button>
        </div>

        {/* Main List Area */}
        <div className="relative min-h-[400px]">
          {/* Rule #5: Data Encryption Overlay */}
          {!isVerified && (
            <div className="absolute inset-0 z-20 backdrop-blur-md bg-white/10 dark:bg-gray-950/10 flex flex-col items-center justify-center rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-gray-800">
              <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-2xl text-center max-w-sm border border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in duration-300">
                <LockClosedIcon className="w-12 h-12 text-[#FF7A59] mx-auto mb-4" />
                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Access Locked</h3>
                <p className="text-xs text-gray-500 font-bold mt-2 leading-relaxed uppercase">
                  Patient Health Information (PHI) is encrypted until clinical vetting is complete.
                </p>
              </div>
            </div>
          )}

          <div className={`grid grid-cols-1 gap-4 ${!isVerified ? 'opacity-20 pointer-events-none' : ''}`}>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white/50 dark:bg-gray-900/50 rounded-[3rem] border border-gray-100 dark:border-gray-800">
                <ArrowPathIcon className="w-8 h-8 text-[#FF7A59] animate-spin mb-4" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Building Clinical Context...</p>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white/50 dark:bg-gray-900/50 rounded-[3rem] border border-gray-100 dark:border-gray-800 text-center">
                <InboxIcon className="w-12 h-12 text-gray-200 dark:text-gray-700 mb-4" />
                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">No Records</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">No matching clinical profiles found.</p>
              </div>
            ) : (
              filteredPatients.map((patient) => (
                <div 
                  key={patient.id} 
                  className="group bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-6 rounded-[2.5rem] flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-xl transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-5 flex-1">
                    <div className="w-14 h-14 bg-gray-50 dark:bg-gray-900 rounded-2xl flex items-center justify-center text-xl font-black text-[#FF7A59]">
                      {patient.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tighter leading-none uppercase truncate">
                          {patient.name}
                        </h3>
                        {patient.lastActivityTime && (
                          <span className="flex items-center gap-1 text-[9px] font-black text-[#FF7A59] bg-[#FF7A59]/10 px-2 py-0.5 rounded-full uppercase">
                            <ClockIcon className="w-3 h-3" />
                            {formatRelativeTime(patient.lastActivityTime)}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase flex items-center gap-2">
                        <ChatBubbleBottomCenterTextIcon className="w-3 h-3 text-gray-300" />
                        <span className="truncate italic">
                          {patient.lastMessage || 'No clinical notes recorded'}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-8 border-t md:border-t-0 pt-4 md:pt-0 border-gray-50 dark:border-gray-700">
                    <div className="text-left md:text-right">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Primary Condition</p>
                      <span className="text-[11px] font-black uppercase text-gray-900 dark:text-white truncate block max-w-[150px] mt-2">
                        {patient.title || 'In Review'}
                      </span>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-xl group-hover:bg-[#FF7A59] group-hover:text-white transition-all">
                      <ChevronRightIcon className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}