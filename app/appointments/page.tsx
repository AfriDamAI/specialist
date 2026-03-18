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
  ChevronRightIcon,
  PlayCircleIcon,
  UserCircleIcon,
} from '@heroicons/react/24/solid';
import { apiClient } from '@/lib/api-client'; // 🏛️ Rule #6: Centralized Handshake
import PatientProfileModal from '@/components/PatientProfileModal';
import { PatientProfile } from '@/app/chat/types/chat';

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
  name?: string; 
  title?: string;
  notes?: string;
  appointment?: {
    notes?: string;
    user?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phoneNo: string;
      profile?: PatientProfile;
    }
  }
}

// AppointmentModal Component
const AppointmentModal = ({
  appointment,
  isOpen,
  onClose,
  onStatusChange,
  onViewProfile,
}: {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
  onViewProfile: (profile: PatientProfile, name: string) => void;
}) => {
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  if (!isOpen || !appointment) return null;

  const { appointmentId, specialistId, status, createdAt, id, notes, appointment: detailedAppointment } = appointment;
  const user = detailedAppointment?.user;
  const patientName = user ? `${user.firstName} ${user.lastName}` : (appointment.name || 'Unknown Patient');
  const appointmentNotes = notes || detailedAppointment?.notes || 'No message provided.';
  const formattedTime = new Date(createdAt).toLocaleTimeString('en-US', { hour12: true });
  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const isDisabled = status !== 'PENDING';

  const handleAccept = async () => {
    setIsConnecting(true);
    try {
      // First, accept the appointment
      const acceptResponse = await apiClient(`/appointments/assignments/${id}/accept`, {
        method: 'POST',
      });

      if (acceptResponse) {
        // Save specialistId and appointment ID for session management
        localStorage.setItem('specialistId', specialistId);
        localStorage.setItem('activeAssignmentId', id);
        localStorage.setItem('activeAppointmentId', appointmentId);

        // Update status
        onStatusChange(appointmentId, 'ACCEPTED');

        // Route to ongoing sessions page (not chat - session starts there)
        router.push(`/ongoing-sessions`);
      }
    } catch (error) {
      console.error('Error accepting appointment:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDecline = async () => {
    setIsDeclining(true);
    try {
      const response = await apiClient(`/appointments/assignments/${id}/decline`, {
        method: 'POST',
      });

      if (response) {
        onStatusChange(appointmentId, 'DECLINED');
        onClose();
      }
    } catch (error) {
      console.error('Error declining appointment:', error);
    } finally {
      setIsDeclining(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in duration-300">
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">
                Appointment <span className="text-[#FF7A59]">Details</span>
              </h2>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">
                Ref: {appointmentId}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <ArrowPathIcon className="w-6 h-6 text-gray-400 rotate-45" />
            </button>
          </div>

          <div className="p-5 rounded-3xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm border border-gray-200 dark:border-gray-700 text-[#FF7A59]">
                <UserCircleIcon className="w-8 h-8" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Patient</p>
                <h3 className="font-bold text-gray-900 dark:text-white">{patientName}</h3>
              </div>
            </div>
            
            {user?.profile && (
              <button
                onClick={() => onViewProfile(user.profile!, patientName)}
                className="px-4 py-2 rounded-xl bg-white dark:bg-gray-800 text-[#FF7A59] border border-[#FF7A59]/20 hover:bg-[#FF7A59] hover:text-white transition-all text-[10px] font-black uppercase tracking-wider shadow-sm"
              >
                Profile
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Date</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{formattedDate}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Time</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{formattedTime}</p>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
            <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-lg ${status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
              status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                'bg-gray-100 text-gray-700'
              }`}>
              {status || 'PENDING'}
            </span>
          </div>

          {appointmentNotes && appointmentNotes !== 'No message provided.' && (
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Patient Message</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 italic">"{appointmentNotes}"</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleAccept}
              disabled={isConnecting || isDisabled}
              className="flex-1 bg-[#FF7A59] text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-[#e56b4a] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConnecting ? 'Accepting...' : 'Accept'}
            </button>
            <button
              onClick={handleDecline}
              disabled={isDeclining || isDisabled}
              className="px-8 border-2 border-red-500 text-red-500 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-950/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeclining ? '...' : 'Decline'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// AppointmentCard component
const AppointmentCard = ({
  appointment,
  onClick
}: {
  appointment: Appointment;
  onClick: (appointment: Appointment) => void
}) => {
  const { appointmentId, status, createdAt } = appointment;
  const formattedTime = new Date(createdAt).toLocaleTimeString('en-US', { hour12: true });
  const formattedDateCreated = new Date(createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div
      onClick={() => onClick(appointment)}
      className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-[2rem] flex flex-col gap-4 group hover:border-[#FF7A59] hover:shadow-xl transition-all cursor-pointer relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF7A59]/5 rounded-full -mr-16 -mt-16 group-hover:bg-[#FF7A59]/10 transition-colors" />

      <div className="flex justify-between items-start relative z-10">
        <div>
          <h3 className="text-sm font-black text-gray-900 dark:text-white tracking-tighter group-hover:text-[#FF7A59] uppercase italic transition-colors">
            ID: {appointmentId.slice(0, 8)}
          </h3>
          <p className="text-[10px] font-bold text-gray-400 uppercase mt-1 tracking-widest">
            {status || 'PENDING'}
          </p>
        </div>
        <div className={`w-3 h-3 rounded-full ${status === 'PENDING' ? 'bg-yellow-400 animate-pulse' :
          status === 'ACCEPTED' ? 'bg-green-400' : 'bg-gray-400'
          }`} />
      </div>

      <div className="flex flex-col gap-1 relative z-10">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <ClockIcon className="w-3 h-3 text-[#FF7A59]" />
          {formattedTime}
        </p>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <CalendarIcon className="w-3 h-3 text-[#FF7A59]" />
          {formattedDateCreated}
        </p>
      </div>

      <div className="flex items-center justify-between mt-1 relative z-10">
        <span className="text-[10px] font-black text-[#FF7A59] uppercase tracking-[0.2em] group-hover:translate-x-1 transition-transform">
          View Details →
        </span>
      </div>
    </div>
  );
};

export default function AppointmentsPage() {
  const router = useRouter();
  /**
   * 🛡️ Rule #3: Global Unlock applied.
   * Defaulting to true to bypass the Academy loop for the clinical team.
   */
  const [isVerified, setIsVerified] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeShift, setActiveShift] = useState<'day' | 'night'>('day');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<PatientProfile | undefined>(undefined);
  const [selectedPatientName, setSelectedPatientName] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleStatusChange = (id: string, newStatus: string) => {
    setAppointments(prev =>
      prev.map(apt =>
        apt.appointmentId === id ? { ...apt, status: newStatus } : apt
      )
    );
  };

  const handleCardClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  };

  const handleShiftToggle = (shift: 'day' | 'night') => {
    setActiveShift(shift);
    localStorage.setItem('preferredShift', shift);
  };

  const handleViewProfile = (profile: PatientProfile, name: string) => {
    setSelectedProfile(profile);
    setSelectedPatientName(name);
    setIsProfileModalOpen(true);
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

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/ongoing-sessions')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#FF7A59] text-white text-xs font-black uppercase tracking-widest hover:bg-[#e56b4a] transition-all active:scale-95 shadow-sm"
            >
              <PlayCircleIcon className="w-4 h-4" />
              Ongoing Sessions
            </button>

            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl">
              <button
                onClick={() => handleShiftToggle('day')}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeShift === 'day'
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                  : 'text-gray-400 hover:text-gray-600'
                  }`}
              >
                Day Shift
              </button>
              <button
                onClick={() => handleShiftToggle('night')}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeShift === 'night'
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                  : 'text-gray-400 hover:text-gray-600'
                  }`}
              >
                Night Shift
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">

          {/* 🛡️ Rule #3: Academy Lock Overlay removed per Global Unlock instruction */}

          {/* Appointment List */}
          <div className="lg:col-span-8 space-y-4 h-150 overflow-y-auto pr-2">
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
                <AppointmentCard
                  key={appointment.appointmentId}
                  appointment={appointment}
                  onClick={handleCardClick}
                />
              ))
            )}
          </div>

          <AppointmentModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            appointment={selectedAppointment}
            onStatusChange={handleStatusChange}
            onViewProfile={handleViewProfile}
          />

          <PatientProfileModal
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
            profile={selectedProfile}
            patientName={selectedPatientName}
          />

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