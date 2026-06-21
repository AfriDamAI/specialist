'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Video, ExternalLink, User } from 'lucide-react';
import { Patient } from '../types/chat';

interface ChatHeaderProps {
  patient: Patient;
  onEndSession: () => void;
  onStartSession?: () => void;
  onExtendSession?: () => void;
  onJoinMeet: () => void;
  isJoiningMeet?: boolean;
  hasMeetLink?: boolean;
  callActive?: boolean;
  onViewProfile: () => void;
  // Mobile navigation
  onMobileBack?: () => void;
  isMobile?: boolean;
}

export default function ChatHeader({
  patient,
  onEndSession,
  onStartSession,
  onExtendSession,
  onJoinMeet,
  isJoiningMeet = false,
  hasMeetLink = false,
  callActive = false,
  onViewProfile,
  onMobileBack,
  isMobile = false,
}: ChatHeaderProps) {
  const canMeet = patient.sessionActive;

  const getInitials = (name: string) => {
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) return parts.slice(0, 2).map(n => n[0]).join('').toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const statusText = callActive
    ? 'In call...'
    : patient.status === 'online'
      ? 'Online'
      : patient.status === 'session-ended'
        ? 'Session ended'
        : 'Offline';

  return (
    <div className="flex items-center gap-2 px-3 md:px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 flex-shrink-0">

      {/* Mobile back arrow */}
      {isMobile && onMobileBack && (
        <button
          onClick={onMobileBack}
          className="flex-shrink-0 p-2 -ml-1 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 transition-all"
          aria-label="Back to sessions"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
      )}

      {/* Avatar + Name + status — clickable as one unit to open profile (WhatsApp-style) */}
      <button
        onClick={onViewProfile}
        className="flex items-center gap-3 flex-1 min-w-0 text-left rounded-xl px-1.5 py-1 -mx-1.5 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors active:scale-[0.99]"
        title="View Patient Profile"
      >
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF7A59] to-[#e85d3a] flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-xs">
              {getInitials(patient.name)}
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight truncate">
              {patient.name}
            </h3>
            <User className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
          </div>
          <p className={`text-xs leading-tight ${
            patient.status === 'online' ? 'text-green-500' : 'text-gray-400 dark:text-gray-500'
          }`}>
            {statusText}
          </p>
        </div>
      </button>

      {/* Action buttons */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Create/Join Meet — fixed width so spinner/icon/text swaps never shift layout */}
        <button
          onClick={onJoinMeet}
          disabled={!canMeet || isJoiningMeet}
          className={`flex items-center justify-center gap-1.5 w-9 sm:w-[5.5rem] h-9 px-0 sm:px-3 rounded-xl text-white text-xs font-bold transition-colors active:scale-95 disabled:opacity-40 disabled:grayscale flex-shrink-0 ${
            hasMeetLink ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
          }`}
          title={!canMeet ? 'Session must be IN_PROGRESS' : hasMeetLink ? 'Join Google Meet' : 'Create a Google Meet'}
        >
          <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
            {isJoiningMeet ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : hasMeetLink ? (
              <ExternalLink className="w-4 h-4" />
            ) : (
              <Video className="w-4 h-4" />
            )}
          </span>
          <span className="hidden sm:inline">
            {hasMeetLink ? 'Join' : 'Meet'}
          </span>
        </button>

        {/* Session controls — Extend stays mounted (just hidden) so End never shifts position */}
        <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onExtendSession}
            disabled={!patient.sessionActive}
            className={`flex items-center justify-center w-[4.5rem] h-9 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-medium transition-colors active:scale-95 ${
              patient.sessionActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            Extend
          </button>
          <button
            onClick={onEndSession}
            className="flex items-center justify-center gap-1 w-[4.5rem] h-9 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs font-medium transition-colors active:scale-95"
          >
            <XMarkIcon className="w-4 h-4 flex-shrink-0" />
            {callActive ? 'End Call' : 'End'}
          </button>
        </div>

        {/* Mobile: icon-only end button, fixed size */}
        <button
          onClick={onEndSession}
          className="sm:hidden flex items-center justify-center w-9 h-9 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors active:scale-95 flex-shrink-0"
          title="End session"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}