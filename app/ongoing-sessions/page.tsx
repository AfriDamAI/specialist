'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import {
    PlayCircleIcon,
    ClockIcon,
    UserCircleIcon,
    ArrowLeftIcon,
    CalendarDaysIcon,
    CheckBadgeIcon,
    VideoCameraIcon,
} from '@heroicons/react/24/solid';
import { startAppointmentSession, getSpecialistAppointments, joinAppointmentSession } from '@/lib/api-client';
import { apiClient } from '@/lib/api-client';

interface ConfirmedAppointment {
    id: string;
    userId: string;
    specialistId: string;
    status: string;
    type: string;
    specialty: string;
    scheduledAt?: string;
    createdAt: string;
    notes?: string;
    meetLink?: string;
    endedAt?: string;
}

function SessionCard({
    appointment,
    onStart,
    isStarting,
}: {
    appointment: ConfirmedAppointment;
    onStart: (id: string) => void;
    isStarting: boolean;
}) {
    const date = new Date(appointment.scheduledAt || appointment.createdAt);
    const formattedDate = date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
    const formattedTime = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });

    const isInProgress = appointment.status === 'IN_PROGRESS';

    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2rem] p-6 flex flex-col gap-4 hover:border-[#FF7A59] hover:shadow-xl transition-all group relative overflow-hidden">
            {/* Decorative blob */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#FF7A59]/5 rounded-full -mr-20 -mt-20 group-hover:bg-[#FF7A59]/10 transition-colors" />

            {/* Header */}
            <div className="flex items-start justify-between relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#FF7A59]/10 flex items-center justify-center">
                        <UserCircleIcon className="w-7 h-7 text-[#FF7A59]" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase italic tracking-tight group-hover:text-[#FF7A59] transition-colors">
                            Patient Session
                        </h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            {appointment.specialty} · {appointment.type}
                        </p>
                    </div>
                </div>
                <span className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl ${isInProgress
                    ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-800'
                    : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800'
                    }`}>
                    {isInProgress ? (
                        <>
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            In Progress
                        </>
                    ) : (
                        <>
                            <CheckBadgeIcon className="w-3.5 h-3.5" />
                            Confirmed
                        </>
                    )}
                </span>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3 relative z-10">
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                        <CalendarDaysIcon className="w-3.5 h-3.5 text-gray-400" />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</p>
                    </div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{formattedDate}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                        <ClockIcon className="w-3.5 h-3.5 text-gray-400" />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Time</p>
                    </div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{formattedTime}</p>
                </div>
            </div>

            {appointment.notes && (
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-3 relative z-10">
                    <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">
                        Notes
                    </p>
                    <p className="text-xs text-amber-800 dark:text-amber-300 italic">"{appointment.notes}"</p>
                </div>
            )}

            {/* CTA */}
            <div className="flex flex-col gap-2 relative z-10">
                <button
                    onClick={() => onStart(appointment.id)}
                    disabled={isStarting}
                    className={`flex items-center justify-center gap-2 ${isInProgress ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-[#FF7A59] hover:bg-[#e56b4a]'
                        } text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed group/btn shadow-lg shadow-black/5`}
                >
                    <PlayCircleIcon className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                    {isInProgress
                        ? (isStarting ? 'Resuming Session…' : 'Resume Session')
                        : (isStarting ? 'Starting Session…' : 'Start Session')}
                </button>
                {/* Show Join on Google Meet if session is in progress and meetLink exists */}
                {isInProgress && appointment.meetLink && (
                    <a
                        href={appointment.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                    >
                        <VideoCameraIcon className="w-5 h-5" />
                        Join on Google Meet
                    </a>
                )}
            </div>
        </div>
    );
}

export default function OngoingSessionsPage() {
    const router = useRouter();
    const [appointments, setAppointments] = useState<ConfirmedAppointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [startingId, setStartingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const loadConfirmedAppointments = useCallback(async () => {
        try {
            setIsLoading(true);
            const appointmentsData = await getSpecialistAppointments();

            if (Array.isArray(appointmentsData)) {
                const confirmed = appointmentsData.map((appt: any) => ({
                    id: appt.id,
                    userId: appt.userId,
                    specialistId: appt.specialistId,
                    status: appt.status,
                    type: appt.type,
                    specialty: appt.specialty,
                    scheduledAt: appt.scheduledAt,
                    createdAt: appt.createdAt,
                    notes: appt.notes,
                    meetLink: appt.meetLink,
                    endedAt: appt.endedAt,
                }));
                setAppointments(confirmed);
            }
        } catch (err) {
            console.error('Error loading confirmed appointments:', err);
            setError('Failed to load appointments. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadConfirmedAppointments();
    }, [loadConfirmedAppointments]);

    const handleStartSession = async (appointmentId: string) => {
        setStartingId(appointmentId);
        setError(null);
        try {
            const result = await startAppointmentSession(appointmentId) as any;
            const chatId = result?.chatId || result?.resultData?.chatId;
            const meetLink = result?.meetLink || result?.resultData?.meetLink;

            // Store the appointment ID for session management
            localStorage.setItem('activeAppointmentId', appointmentId);

            // Open Google Meet if we have a link
            if (meetLink) {
                window.open(meetLink, '_blank', 'noopener,noreferrer');
            }

            // Also navigate to chat for text communication
            if (chatId) {
                localStorage.setItem('activeChatId', chatId);
                router.push(`/chat?chatId=${chatId}`);
            } else {
                router.push('/chat');
            }
        } catch (err: any) {
            console.error('Error starting session:', err);
            setError(err?.message || 'Failed to start session. Please try again.');
        } finally {
            setStartingId(null);
        }
    };

    return (
        <DashboardLayout>
            <div className="p-6 lg:p-8 max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        <ArrowLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">
                            Ongoing <span className="text-[#FF7A59]">Sessions</span>
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            Your confirmed appointments awaiting session start
                        </p>
                    </div>
                </div>

                {/* Error banner */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-red-700 dark:text-red-400 text-sm font-medium">
                        {error}
                    </div>
                )}

                {/* Loading */}
                {isLoading && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map(i => (
                            <div
                                key={i}
                                className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 border border-gray-100 dark:border-gray-800 animate-pulse"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gray-200 dark:bg-gray-700" />
                                    <div className="flex-1">
                                        <div className="h-3 w-2/3 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                                        <div className="h-2 w-1/2 bg-gray-100 dark:bg-gray-800 rounded" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
                                    <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
                                </div>
                                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty state */}
                {!isLoading && appointments.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-20 h-20 rounded-[2rem] bg-[#FF7A59]/10 flex items-center justify-center mb-4">
                            <CalendarDaysIcon className="w-10 h-10 text-[#FF7A59]/50" />
                        </div>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase italic tracking-tight mb-2">
                            No Confirmed Sessions
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                            You have no confirmed appointments awaiting a session start. Accept an appointment
                            first to see it here.
                        </p>
                        <button
                            onClick={() => router.push('/appointments')}
                            className="mt-6 px-6 py-3 rounded-2xl bg-[#FF7A59] text-white font-black uppercase tracking-widest text-sm hover:bg-[#e56b4a] transition-all active:scale-95"
                        >
                            View Appointments
                        </button>
                    </div>
                )}

                {/* Cards grid */}
                {!isLoading && appointments.length > 0 && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {appointments.map(appointment => (
                            <SessionCard
                                key={appointment.id}
                                appointment={appointment}
                                onStart={handleStartSession}
                                isStarting={startingId === appointment.id}
                            />
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
