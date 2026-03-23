'use client';

import { XMarkIcon, VideoCameraIcon, PhoneIcon, UserIcon } from '@heroicons/react/24/outline';
import { Patient, CallType } from '../types/chat';

interface ChatHeaderProps {
  patient: Patient;
  onEndSession: () => void;
  onStartSession?: () => void;
  onExtendSession?: () => void;
  onJoinMeet: () => void;
  isJoiningMeet?: boolean;
  callActive?: boolean;
  onViewProfile: () => void;
}

export default function ChatHeader({
  patient,
  onEndSession,
  onStartSession,
  onExtendSession,
  onJoinMeet,
  isJoiningMeet = false,
  callActive = false,
  onViewProfile
}: ChatHeaderProps) {
  return (
    <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
          <span className="text-gray-600 dark:text-gray-300 font-bold text-xs">
            {patient.name.split(' ').map(n => n[0]).join('')}
          </span>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{patient.name}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {callActive
              ? 'In call...'
              : patient.status === 'online'
                ? 'Online'
                : patient.status === 'session-ended'
                  ? 'Session ended'
                  : 'Offline'}
          </p>
        </div>
        <button
          onClick={onViewProfile}
          className="ml-2 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-[#FF7A59] transition-all active:scale-95"
          title="View Patient Profile"
        >
          <UserIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        {/* Join Meet Button (Replacing Legacy Call Buttons) */}
        <button
          onClick={onJoinMeet}
          disabled={!patient.sessionActive || isJoiningMeet}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF7A59] text-white hover:bg-[#ff8a6f] transition-all active:scale-95 disabled:opacity-50 disabled:grayscale shadow-sm"
          title={patient.sessionActive ? "Join Google Meet" : "Session must be started to join Meet"}
        >
          {isJoiningMeet ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <VideoCameraIcon className="w-5 h-5" />
          )}
          <span className="text-xs font-bold uppercase tracking-wider">Join Meet</span>
        </button>

        {!callActive && (
          <div className="flex items-center gap-2">
            {patient.sessionActive && (
              <button
                onClick={onExtendSession}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                Extend
              </button>
            )}
            <button
              onClick={onEndSession}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium"
            >
              <XMarkIcon className="w-4 h-4" />
              End Session
            </button>
          </div>
        )}

        {callActive && (
          <button
            onClick={onEndSession}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium"
          >
            <XMarkIcon className="w-4 h-4" />
            End Call
          </button>
        )}
      </div>
    </div>
  );
}
