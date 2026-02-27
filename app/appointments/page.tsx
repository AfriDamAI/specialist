'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  CalendarIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  ShieldCheckIcon,
  ArrowPathIcon,
  InboxIcon,
  MoonIcon,
  SunIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/solid';
import { apiClient } from '@/lib/api-client'; // 🏛️ Rule #6: Centralized Handshake

// Rule #3: Production Appointment Interface
interface Appointment {
  id: string;
  appointmentId: string; // This is the assignmentId
  specialistId: string;
  assignedBy: string;
  status: string;
  assignedAt: string;
  createdAt: string;
  updatedAt: string;
  name?: string; // Optional for backward compatibility
  title?: string; // Optional for backward compatibility
}

// AppointmentCard component
const AppointmentCard = ({ appointment, onStatusChange }: { appointment: Appointment; onStatusChange: (id: string, status: string, chatId?: string) => void }) => {
  const { appointmentId, specialistId, assignedBy, status, createdAt } = appointment;
  const formattedTime = new Date(createdAt).toLocaleTimeString('en-US', { hour12: true });
  const formattedDateCreated = new Date(createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [isDisabled, setIsDisabled] = useState(status !== 'PENDING');

  const handleAccept = async () => {
    setIsConnecting(true);
    try {
      // First, accept the appointment
      const acceptResponse = await apiClient(`/appointments/assignments/${appointmentId}/accept`, {
        method: 'POST',
      });
      
      if (acceptResponse) {
        // Create a chat with the patient
        const chatResponse = await apiClient('/chats', {
          method: 'POST',
          body: JSON.stringify({
            participant1Id: specialistId,
            participant2Id: assignedBy,
          }),
        });
        
        // Get the chat ID from the response
        const chatId = chatResponse?.data?.id || chatResponse?.id;
        
        // Update status and navigate to chat with chatId
        onStatusChange(appointmentId, 'ACCEPTED', chatId);
        router.push(`/chat?chatId=${chatId}`);
      }
    } catch (error) {
      console.error('Error accepting appointment:', error);
      setIsConnecting(false);
    }
  };

  const handleDecline = async () => {
    setIsDeclining(true);
    try {
      const response = await apiClient(`/appointments/assignments/${appointmentId}/decline`, {
        method: 'POST',
      });
      
      if (response) {
        // Disable both buttons after declining
        setIsDisabled(true);
        onStatusChange(appointmentId, 'DECLINED');
      }
    } catch (error) {
      console.error('Error declining appointment:', error);
    } finally {
      setIsDeclining(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-xl flex flex-col gap-3 group hover:border-[#FF7A59] transition-all">
      <div>
        <h3 className="text-sm font-black text-gray-900 dark:text-white tracking-tighter group-hover:text-[#FF7A59] uppercase italic">
          {appointmentId.slice(0, 8)}
        </h3>
        <p className="text-[10px] font-bold text-gray-400 uppercase mt-1 tracking-widest">
          {status || 'PENDING'}
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          Time: {formattedTime}
        </p>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          Created: {formattedDateCreated}
        </p>
      </div>
      <div className="flex gap-2 mt-1">
        <button 
          onClick={handleAccept}
          disabled={isConnecting || isDisabled}
          className="bg-[#FF7A59] text-white px-3 py-1 rounded-lg font-bold uppercase tracking-wider hover:bg-[#e56b4a] transition-colors text-xs disabled:opacity-70 disabled:cursor-not-allowed min-w-[100px]"
        >
          {isConnecting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Connecting...
            </span>
          ) : (
            'Accept'
          )}
        </button>
        <button 
          onClick={handleDecline}
          disabled={isDeclining || isDisabled}
          className="bg-red-500 text-white px-3 py-1 rounded-lg font-bold uppercase tracking-wider hover:bg-red-600 transition-colors text-xs disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isDeclining ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Declining...
            </span>
          ) : (
            'Decline'
          )}
        </button>
      </div>
    </div>
  );
};

export default function AppointmentsPage() {
  /**
   * 🛡️ Rule #3: Global Unlock applied.
   * Defaulting to true to bypass the Academy loop for the clinical team.
   */
  const [isVerified, setIsVerified] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeShift, setActiveShift] = useState<'day' | 'night'>('day');

  useEffect(() => {
    // 🛡️ Rule #5: Extraction of Real Session Identity
    const savedShift = localStorage.getItem('preferredShift') as 'day' | 'night';
    if (savedShift) setActiveShift(savedShift);

    async function fetchAppointments() {
      try {
        const response = await apiClient('/appointments/assignments/me');
        const data = response?.data || response;
        
        console.log('Appointments data:', data);
        
        if (data) {
          setAppointments(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAppointments();
  }, []);

  const handleStatusChange = (id: string, newStatus: string, chatId?: string) => {
    setAppointments(prev => 
      prev.map(apt => 
        apt.appointmentId === id ? { ...apt, status: newStatus } : apt
      )
    );
  };

  const handleShiftToggle = (shift: 'day' | 'night') => {
    setActiveShift(shift);
    localStorage.setItem('preferredShift', shift);
  };

  const formattedDate = new Date().toLocaleDateString('en-US', { 
    month: 'short', 
    day: '2-digit', 
    year: 'numeric' 
  });

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6 pb-20 text-left italic">
        
        {/* Header Section: Rule #4 Responsive Balance */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">
              Work <span className="text-[#FF7A59]">Schedule</span>
            </h1>
            <p className="text-[10px] md:text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em] mt-1">
              Manage your time and view your bookings
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl">
            <button 
              onClick={() => handleShiftToggle('day')}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeShift === 'day' 
                ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' 
                : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Day Shift
            </button>
            <button 
              onClick={() => handleShiftToggle('night')}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeShift === 'night' 
                ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' 
                : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Night Shift
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
          
          {/* 🛡️ Rule #3: Academy Lock Overlay removed per Global Unlock instruction */}

           {/* Appointment List */}
          <div className="lg:col-span-8 space-y-4 h-[600px] overflow-y-auto pr-2">
             <div className="flex items-center justify-between px-2">
                <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest italic">
                  {activeShift === 'day' ? 'Daytime Appointments' : 'Nighttime Appointments'}
                </h2>
                <div className="flex items-center gap-4">
                   <ChevronLeftIcon className="w-5 h-5 text-gray-300 cursor-pointer" />
                   <span className="text-xs font-black uppercase tracking-tighter">{formattedDate}</span>
                   <ChevronRightIcon className="w-5 h-5 text-gray-900 dark:text-white cursor-pointer" />
                </div>
             </div>

             {isLoading ? (
               <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800">
                  <ArrowPathIcon className="w-8 h-8 text-[#FF7A59] animate-spin mb-4" />
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading Calendar...</p>
               </div>
             ) : appointments.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-950 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 text-center">
                  <InboxIcon className="w-12 h-12 text-gray-200 dark:text-gray-800 mb-4" />
                  <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">No Bookings</h3>
                  <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-2">Your waiting list is currently clear.</p>
               </div>
              ) : (
                appointments.map((appointment) => (
                  <AppointmentCard key={appointment.appointmentId} appointment={appointment} onStatusChange={handleStatusChange} />
                ))
              )}
          </div>

          {/* Shift Insights: Rule #4 Balanced view */}
          <div className="lg:col-span-4 space-y-6">
             <div className={`${activeShift === 'day' ? 'bg-gray-900' : 'bg-[#1A1A2E]'} dark:bg-black rounded-[3rem] p-8 text-white space-y-6 shadow-2xl relative overflow-hidden transition-colors`}>
                <div className="flex items-center gap-3 text-[#FF7A59] relative z-10">
                   {activeShift === 'day' ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6 text-blue-400" />}
                   <h3 className="text-[10px] font-black uppercase tracking-widest italic">
                     {activeShift === 'day' ? 'Day Shift Hours' : 'Night Shift Hours'}
                   </h3>
                </div>
                <div className="space-y-4 relative z-10">
                   <div className="flex items-center justify-between text-[10px] font-black uppercase italic">
                      <span className="opacity-50 tracking-widest">Active Time</span>
                      <span className="tracking-tighter">
                        {activeShift === 'day' ? '08:00 AM - 04:00 PM' : '08:00 PM - 04:00 AM'}
                      </span>
                   </div>
                </div>
                <button className="w-full bg-white dark:bg-gray-800 text-black dark:text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all relative z-10 hover:bg-[#FF7A59] hover:text-white">
                   Adjust Shift
                </button>
             </div>

             <div className="bg-white dark:bg-gray-800 rounded-[3rem] p-8 border border-gray-100 dark:border-gray-700 text-center">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 italic">Reliability</h3>
                <div className="flex flex-col items-center justify-center py-6">
                   <ClockIcon className="w-8 h-8 text-[#FF7A59] mb-2" />
                   <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Everything is on time</p>
                </div>
             </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}