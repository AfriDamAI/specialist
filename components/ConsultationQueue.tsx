'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, startAppointmentSession } from '@/lib/api-client'; // 🚀 Re-imported startAppointmentSession
import { toast } from 'react-hot-toast';
import { 
  UserCircleIcon,
  PlayCircleIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/solid';

interface Consultation {
  id: string;
  patientName: string;
  status: string;
  appointmentStatus: string;
  createdAt: string; 
  rawDate: string;
  urgency: 'HIGH' | 'NORMAL';
  appointmentId?: string | null;
  assignmentId?: string | null;
}

interface QueueAssignment {
  id: string;
  name?: string;
  status?: string;
  createdAt: string | number | Date;
  appointmentId?: string | null;
  appointment?: {
    id?: string;
    appointmentId?: string;
    planTier?: string;
    title?: string;
    status?: string;
    scheduledAt?: string;
    user?: {
      firstName?: string;
      lastName?: string;
    };
  };
}

export default function ConsultationQueue() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const router = useRouter();

  const fetchLiveQueue = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else setIsLoading(true);
    setError(false);

    try {
      const response = await apiClient('/appointments/assignments/me');
      const sourceData = response?.resultData || response?.data || response || [];
      
      const activeCases: Consultation[] = Array.isArray(sourceData) ? (sourceData as QueueAssignment[]).map((item) => {
        const user = item.appointment?.user;
        const appointmentId = (item as any).appointmentId || item.appointment?.id || item.appointment?.appointmentId || null;
        const targetDate = item.appointment?.scheduledAt || item.createdAt;

        return {
          id: item.id,
          patientName: user ? `${user.firstName} ${user.lastName}` : (item.name || "Specialist Triage"),
          status: item.status || 'PENDING',
          appointmentStatus: item.appointment?.status || 'PENDING',
          createdAt: new Date(targetDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          rawDate: new Date(targetDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          urgency: (item.appointment?.planTier === 'Instant' || item.appointment?.title?.toLowerCase().includes('urgent') ? 'HIGH' : 'NORMAL') as 'HIGH' | 'NORMAL',
          appointmentId,
          assignmentId: item.id,
        } as any;
      }) : [];

      setConsultations(activeCases);
    } catch (err) {
      console.warn("📊 Queue Sync: Connection to neural core interrupted.");
      setError(true);
      console.error('Queue fetch error', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const iv = setInterval(() => fetchLiveQueue(true), 15000);
    return () => clearInterval(iv);
  }, [fetchLiveQueue]);

  useEffect(() => {
    fetchLiveQueue();
  }, [fetchLiveQueue]);

  const handleAccept = async (assignmentId: string) => {
    try {
      setIsRefreshing(true);
      const res = await apiClient(`/appointments/assignments/${assignmentId}/accept`, { method: 'POST' });
      if (res) {
        toast.success('Appointment accepted.');
        await fetchLiveQueue();
      }
    } catch (err) {
      console.error('Accept error', err);
      toast.error('Failed to accept appointment.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // 🚀 RESTORED: Original API logic
  const handleStartSession = async (appointmentId: string) => {
    setStartingId(appointmentId);
    try {
      const result = await startAppointmentSession(appointmentId) as any;
      const chatId = result?.chatId || result?.resultData?.chatId;
      
      localStorage.setItem('activeAppointmentId', appointmentId);
      
      if (chatId) {
        localStorage.setItem('activeChatId', chatId);
        router.push(`/chat?chatId=${chatId}`);
      } else {
        router.push('/chat');
      }
    } catch (err: any) {
      console.error('Error starting session:', err);
      toast.error(err?.message || 'Failed to start session. Please try again.');
    } finally {
      setStartingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <ArrowPathIcon className="w-10 h-10 text-[#FF7A59] animate-spin" />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] italic">Updating Patient List...</p>
      </div>
    );
  }

  const PAGE_SIZE = 6;
  const totalPages = Math.max(1, Math.ceil(consultations.length / PAGE_SIZE));
  const pagedConsultations = consultations.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
          className="flex items-center gap-2 px-5 py-2 dashboard-icon-tile rounded-2xl hover:bg-[#FF7A59]/10 group transition-all"
        >
          <ArrowPathIcon className={`w-3.5 h-3.5 text-gray-400 group-hover:text-[#FF7A59] ${isRefreshing ? 'animate-spin text-[#FF7A59]' : ''}`} />
          <span className="text-[9px] font-black text-gray-500 group-hover:text-[#FF7A59] uppercase tracking-widest italic leading-none">
            {isRefreshing ? 'Refreshing' : 'Update queue'}
          </span>
        </button>
      </div>

      {consultations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-2 text-center dashboard-card-muted rounded-[2rem] md:rounded-[3rem] border-dashed">
          <div className="w-16 h-16 dashboard-icon-tile rounded-[1.5rem] flex items-center justify-center mb-4 shadow-sm">
            <ExclamationCircleIcon className="w-8 h-8 text-gray-200" />
          </div>
          <h3 className="text-xl font-black text-black dark:text-white italic">No patients found</h3>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">Your waiting list is currently clear</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {pagedConsultations.map((item) => {
            const isAccepted = item.status === 'ACCEPTED';
            const isPending = item.status === 'PENDING';
            const isInProgress = item.appointmentStatus === 'IN_PROGRESS';
            const targetId = item.appointmentId || item.assignmentId || item.id;
            const isStarting = startingId === targetId;

            return (
              <div key={item.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2.5rem] p-6 flex flex-col gap-4 hover:border-[#FF7A59] hover:shadow-xl transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-[#FF7A59]/5 rounded-full -mr-20 -mt-20 group-hover:bg-[#FF7A59]/10 transition-colors" />

                <div className="flex items-start justify-between relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#FF7A59]/10 flex items-center justify-center">
                            <UserCircleIcon className="w-7 h-7 text-[#FF7A59]" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase italic tracking-tight group-hover:text-[#FF7A59] transition-colors truncate max-w-[120px]">
                                {item.patientName}
                            </h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                {item.urgency === 'HIGH' ? 'Urgent Case' : 'Routine Case'}
                            </p>
                        </div>
                    </div>
                    <span className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl ${
                        isInProgress
                        ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-800'
                        : isAccepted 
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800'
                        : 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-800'
                    }`}>
                        {isInProgress ? (
                            <>
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                In Progress
                            </>
                        ) : isAccepted ? (
                            <>
                                <CheckBadgeIcon className="w-3 h-3" />
                                Confirmed
                            </>
                        ) : (
                            'Pending'
                        )}
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-3 relative z-10">
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                            <CalendarDaysIcon className="w-3 h-3 text-gray-400" />
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Date</p>
                        </div>
                        <p className="text-xs font-bold text-gray-900 dark:text-white">{item.rawDate}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                            <ClockIcon className="w-3 h-3 text-gray-400" />
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Time</p>
                        </div>
                        <p className="text-xs font-bold text-gray-900 dark:text-white">{item.createdAt}</p>
                    </div>
                </div>

                <div className="flex flex-col gap-2 relative z-10 mt-2">
                    {isPending ? (
                      <button
                          onClick={() => handleAccept(item.assignmentId || item.id)}
                          disabled={isRefreshing}
                          className="flex items-center justify-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed group/btn shadow-lg"
                      >
                          Accept Assignment
                      </button>
                    ) : (
                      <button
                          onClick={() => handleStartSession(targetId)}
                          disabled={isStarting}
                          className={`flex items-center justify-center gap-2 ${isInProgress ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-[#FF7A59] hover:bg-[#e56b4a]'
                              } text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed group/btn shadow-lg shadow-black/5`}
                      >
                          {isStarting ? (
                            <ArrowPathIcon className="w-5 h-5 animate-spin" />
                          ) : (
                            <PlayCircleIcon className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                          )}
                          {isInProgress
                              ? (isStarting ? 'Resuming Session…' : 'Resume Session')
                              : (isStarting ? 'Starting Session…' : 'Start Session')}
                      </button>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-[10px] font-black uppercase">Prev</button>
          <span className="text-sm font-black">{page} / {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-[10px] font-black uppercase">Next</button>
        </div>
      )}
    </div>
  );
}