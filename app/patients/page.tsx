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
import { apiClient } from '@/lib/api-client'; // 🏛️ Rule #6: Centralized Handshake

interface PatientRecord {
  id: string;
  name: string;
  createdAt: string;
  title: string;
  lastMessage?: string;
  lastActivityTime?: string;
}

export default function PatientsPage() {
  /**
   * 🛡️ Rule #3: Global Unlock - Defaulting to true to remove the overlay
   * matching our development bypass strategy.
   */
  const [isVerified, setIsVerified] = useState(true); 
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
    async function fetchPatientsWithHistory() {
      try {
        /**
         * 🏛️ Rule #6: Switched from hardcoded URL to apiClient.
         * Fetches all consultations assigned to the specialist.
         */
        const response = await apiClient('/consultation');
        const data = response?.data || response;
        
        if (Array.isArray(data)) {
          /**
           * 🛡️ Rule #3: Optimized Triage Mapping. 
           * Instead of looping multiple fetch calls (which causes 429 errors), 
           * we map the existing consultation data into the Directory view.
           */
          const patientList: PatientRecord[] = data.map((patient: any) => ({
            id: patient.id,
            name: patient.name || (patient.user ? `${patient.user.firstName} ${patient.user.lastName}` : "Triage Case"),
            createdAt: patient.createdAt,
            title: patient.title || 'Clinical Analysis',
            // Displaying the last description if a full chat sync isn't available
            lastMessage: patient.description, 
            lastActivityTime: patient.updatedAt || patient.createdAt
          }));

          setPatients(patientList);
        }
      } catch (error) {
        console.error("Clinical Directory Sync Error:", error);
      } finally {
        setIsLoading(false);
      }
    }

    // Always fetch since isVerified is forced true
    fetchPatientsWithHistory();
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
      <div className="max-w-7xl mx-auto space-y-6 pb-20 text-left italic">
        
        {/* Header Section: Rule #4 Responsive Balance */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">
              Patient <span className="text-[#FF7A59]">Directory</span>
            </h1>
            <p className="text-[10px] md:text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em] mt-1">
              Clinical Records & Case Management
            </p>
          </div>
          
          <button className="bg-black dark:bg-white text-white dark:text-black px-6 py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg">
            <PlusIcon className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-widest italic">Register Patient</span>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-9 relative">
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, ID, or condition..."
              className="w-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl px-6 py-4 pl-12 text-sm font-bold focus:ring-2 focus:ring-[#FF7A59] outline-none transition-all shadow-sm italic"
            />
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          </div>
          <button className="md:col-span-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl px-6 py-4 flex items-center justify-center gap-3 hover:bg-gray-50 transition-all">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest italic">Filters</span>
          </button>
        </div>

        {/* Main List Area */}
        <div className="relative min-h-[400px]">
          
          {/* 🛡️ Rule #3: Encryption Overlay removed per Global Unlock strategy */}

          <div className="grid grid-cols-1 gap-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white/50 dark:bg-gray-900/50 rounded-[3rem] border border-gray-100 dark:border-gray-800">
                <ArrowPathIcon className="w-8 h-8 text-[#FF7A59] animate-spin mb-4" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Building Clinical Context...</p>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white/50 dark:bg-gray-900/50 rounded-[3rem] border border-gray-100 dark:border-gray-800 text-center">
                <InboxIcon className="w-12 h-12 text-gray-200 dark:text-gray-700 mb-4" />
                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">No Records</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 italic">No matching clinical profiles found.</p>
              </div>
            ) : (
              filteredPatients.map((patient) => (
                <div 
                  key={patient.id} 
                  className="group bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-6 rounded-[2.5rem] flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-xl transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-5 flex-1">
                    <div className="w-14 h-14 bg-gray-50 dark:bg-gray-900 rounded-2xl flex items-center justify-center text-xl font-black text-[#FF7A59] italic">
                      {patient.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tighter leading-none uppercase truncate italic">
                          {patient.name}
                        </h3>
                        {patient.lastActivityTime && (
                          <span className="flex items-center gap-1 text-[9px] font-black text-[#FF7A59] bg-[#FF7A59]/10 px-2 py-0.5 rounded-full uppercase">
                            <ClockIcon className="w-3 h-3" />
                            {formatRelativeTime(patient.lastActivityTime)}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mt-2 uppercase flex items-center gap-2">
                        <ChatBubbleBottomCenterTextIcon className="w-3 h-3 text-gray-300 dark:text-gray-600" />
                        <span className="truncate italic">
                          {patient.lastMessage || 'No clinical notes recorded'}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-8 border-t md:border-t-0 pt-4 md:pt-0 border-gray-50 dark:border-gray-700">
                    <div className="text-left md:text-right">
                      <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none italic">Primary Condition</p>
                      <span className="text-[11px] font-black uppercase text-gray-900 dark:text-white truncate block max-w-[150px] mt-2 italic">
                        {patient.title || 'In Review'}
                      </span>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-xl group-hover:bg-[#FF7A59] group-hover:text-white transition-all shadow-sm">
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