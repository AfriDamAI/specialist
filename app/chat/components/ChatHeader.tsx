'use client';

import { XMarkIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import { UserIcon, Video, ExternalLink } from 'lucide-react';
import { Patient } from '../types/chat';

interface ChatHeaderProps {
  patient: Patient;
  onEndSession: () => void;
  onStartSession?: () => void;
  onExtendSession?: () => void;
  onJoinMeet: () => void;
  isJoiningMeet?: boolean;
  hasMeetLink?: boolean; // true = "Join Meeting", false = "Create Meeting"
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
  hasMeetLink = false,
  callActive = false,
  onViewProfile
}: ChatHeaderProps) {
  // Button is enabled ONLY if session is IN_PROGRESS
  const canMeet = patient.sessionActive;

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
        {/* Create/Join Meet Button — active only if session is IN_PROGRESS */}
        <button
          onClick={onJoinMeet}
          disabled={!canMeet || isJoiningMeet}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-white transition-all active:scale-95 disabled:opacity-50 disabled:grayscale shadow-sm text-xs font-bold uppercase tracking-wider ${
            hasMeetLink
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
          title={!canMeet ? 'Session must be IN_PROGRESS' : hasMeetLink ? 'Join Google Meet' : 'Create a Google Meet for this session'}
        >
          {isJoiningMeet ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : hasMeetLink ? (
            <ExternalLink className="w-5 h-5" />
          ) : (
            <Video className="w-5 h-5" />
          )}
          <span>{hasMeetLink ? 'Join Meeting' : 'Create Meeting'}</span>
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
