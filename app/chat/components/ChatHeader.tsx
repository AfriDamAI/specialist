'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';
import { UserIcon, Video, ExternalLink, ArrowLeft } from 'lucide-react';
import { Patient } from '../types/chat';

interface ChatHeaderProps {
  patient: Patient;
  onEndSession: () => void;
  onStartSession?: () => void;
  onExtendSession?: () => void;
  onJoinMeet: () => void;
  isJoiningMeet?: boolean;
  hasMeetLink?: boolean;
  meetLink?: string | null;
  callActive?: boolean;
  onViewProfile: () => void;
  onBack?: () => void;
}

export default function ChatHeader({
  patient,
  onEndSession,
  onStartSession,
  onExtendSession,
  onJoinMeet,
  isJoiningMeet = false,
  hasMeetLink = false,
  meetLink = null,
  callActive = false,
  onViewProfile,
  onBack
}: ChatHeaderProps) {
  const canMeet = patient.sessionActive;

  return (
    <div className="p-3 md:p-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 flex items-center justify-between">
      <div className="flex items-center gap-2 md:gap-3">
        
        {/* NATIVE WHATSAPP MOBILE BACK BUTTON */}
        {onBack && (
          <button 
            onClick={onBack}
            className="md:hidden p-1.5 -ml-1 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer z-50 active:scale-95"
            aria-label="Back to chats"
          >
            <ArrowLeft className="w-6 h-6 stroke-[2.5]" />
          </button>
        )}

        <div onClick={onViewProfile} className="cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-2 md:gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center overflow-hidden shrink-0">
            {patient.avatar ? (
              <img src={patient.avatar} alt={patient.name} className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[140px] md:max-w-[200px]">
              {patient.name}
            </h3>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${patient.status === 'online' ? 'bg-[#FF7A59]' : 'bg-gray-400'}`} />
              <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {patient.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onJoinMeet}
          disabled={!canMeet || isJoiningMeet}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors text-sm font-medium ${
            !canMeet
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
              : 'bg-[#FF7A59]/10 text-[#FF7A59] hover:bg-[#FF7A59]/20'
          }`}
        >
          {isJoiningMeet ? (
            <div className="w-5 h-5 border-2 border-[#FF7A59] border-t-transparent rounded-full animate-spin" />
          ) : hasMeetLink ? (
            <ExternalLink className="w-5 h-5" />
          ) : (
            <Video className="w-5 h-5" />
          )}
          <span className="hidden sm:inline">{hasMeetLink ? 'Open Meeting' : 'Create Meeting'}</span>
        </button>
        {meetLink && (
          <a
            href={meetLink}
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            View Link
          </a>
        )}

        {!callActive && (
          <div className="flex items-center gap-2">
            {patient.sessionActive && (
              <button
                onClick={onExtendSession}
                className="hidden sm:block px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                Extend
              </button>
            )}
            <button
              onClick={onEndSession}
              className="flex items-center gap-2 p-2 sm:px-4 sm:py-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium"
            >
              <XMarkIcon className="w-6 h-6 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">End</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}