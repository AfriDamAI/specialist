'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, getAppointmentById, initiateChat } from '@/lib/api-client'; // 🏛️ Rule #6: Centralized Synergy
import { toast } from 'react-hot-toast';
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
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const router = useRouter();

  const fetchLiveQueue = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else setIsLoading(true);
    setError(false);

    try {
      /**
       * 🏛️ Rule #6: Verified Backend Path for Specialists.
       * Pulling the clinical manifest from the verified assignments endpoint.
       */
      const response = await apiClient('/appointments/assignments/me');
      const sourceData = response?.resultData || response?.data || response || [];
      
      const activeCases: Consultation[] = Array.isArray(sourceData) ? (sourceData as QueueAssignment[]).map((item) => {
        const user = item.appointment?.user;
        const appointmentId = (item as any).appointmentId || item.appointment?.id || item.appointment?.appointmentId || null;
        return {
          id: item.id,
          patientName: user ? `${user.firstName} ${user.lastName}` : (item.name || "Specialist Triage"),
          status: item.status || 'PENDING',
          createdAt: new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          urgency: (item.appointment?.planTier === 'Instant' || item.appointment?.title?.toLowerCase().includes('urgent') ? 'HIGH' : 'NORMAL') as 'HIGH' | 'NORMAL',
          // attach appointmentId if present to avoid using assignment id by mistake
          // @ts-ignore
          appointmentId,
          // expose assignment id for follow-up actions
          // @ts-ignore
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

  // Poll the queue periodically so the dashboard reflects new appointments
  useEffect(() => {
    const iv = setInterval(() => fetchLiveQueue(true), 15000);
    return () => clearInterval(iv);
  }, [fetchLiveQueue]);

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

  const openWorkspace = async (assignmentId: string, appointmentIdFromList?: string | null) => {
    setIsRefreshing(true);
    try {
      // Determine the actual appointment id (not the assignment id)
      let appointmentId = appointmentIdFromList || null;
      if (!appointmentId) {
        // fetch assignment details to get the linked appointment id
        const assignmentRes = await apiClient(`/appointments/assignments/${assignmentId}`);
        appointmentId = assignmentRes?.data?.appointmentId || assignmentRes?.resultData?.appointmentId || assignmentRes?.appointmentId || null;
      }

      if (!appointmentId) {
        toast.error('Could not resolve appointment identity for this assignment.');
        return;
      }

      // Fetch appointment to get the patient id
      const appointment = await getAppointmentById(appointmentId);
      const patientId = appointment?.user?.id || appointment?.patientId || appointment?.userId;
      if (!patientId) {
        toast.error('Could not resolve patient identity for this appointment.');
        return;
      }

      const specialistId = localStorage.getItem('specialistId') || localStorage.getItem('userId') || '';

      // Ensure a chat exists between specialist and patient
      const chat = await initiateChat(specialistId, patientId);
      const chatId = chat?.id || chat?.data?.id || chat?.resultData?.id;

      if (chatId) {
        localStorage.setItem('activeChatId', chatId);
        router.push(`/chat?chatId=${chatId}`);
      } else {
        // Fallback: open chat list and let ChatContainer resolve patient
        localStorage.setItem('activePatientId', patientId);
        router.push('/chat');
      }
    } catch (err) {
      console.error('Failed to open workspace:', err);
      toast.error('Failed to open workspace. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAccept = async (assignmentId: string) => {
    try {
      setIsRefreshing(true);
      const res = await apiClient(`/appointments/assignments/${assignmentId}/accept`, { method: 'POST' });
      if (res) {
        toast.success('Appointment accepted.');
        // Refresh queue
        await fetchLiveQueue();
      }
    } catch (err) {
      console.error('Accept error', err);
      toast.error('Failed to accept appointment.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const PAGE_SIZE = 8;
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
        <div className="space-y-4">
          {pagedConsultations.map((item) => (
            <div key={item.id} className="relative">
            <button
              onClick={() => openWorkspace(item.assignmentId || item.id, item.appointmentId || null)}
              className="w-full text-left flex items-center justify-between p-5 md:p-8 dashboard-card rounded-[2rem] md:rounded-[3rem] hover:border-[#FF7A59] transition-all group"
            >
              <div className="flex items-center gap-6">
                <div className={`w-14 h-14 md:w-16 md:h-16 rounded-[1.5rem] flex items-center justify-center transition-colors ${
                  item.urgency === 'HIGH' ? 'bg-red-50 dark:bg-red-950/30 text-red-500' : 'dashboard-icon-tile text-gray-400 dark:text-gray-500'
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
                    : 'dashboard-icon-tile text-gray-500'
                  }`}>
                    {item.urgency === 'HIGH' ? 'Urgent' : 'Routine'}
                  </span>
                </div>
                <div className="p-3 dashboard-icon-tile rounded-xl group-hover:bg-[#FF7A59] group-hover:text-white transition-all shadow-sm">
                  <ChevronRightIcon className="w-5 h-5" />
                </div>
              </div>
            </button>
            {/* Accept button overlay */}
            <div className="absolute right-4 top-4">
              <button onClick={(e) => { e.stopPropagation(); handleAccept(item.assignmentId || item.id); }} className="px-3 py-2 bg-[#FF7A59] text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Accept</button>
            </div>
            </div>
          ))}
        </div>
      )}
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-2 rounded-lg bg-gray-100">Prev</button>
          <span className="text-sm font-black">{page} / {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="px-3 py-2 rounded-lg bg-gray-100">Next</button>
        </div>
      )}
    </div>
  );
}
