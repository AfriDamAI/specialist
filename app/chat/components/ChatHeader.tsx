'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';
import { Patient } from '../types/chat';

interface ChatHeaderProps {
  patient: Patient;
  onEndSession: () => void;
}

export default function ChatHeader({ patient, onEndSession }: ChatHeaderProps) {
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
            {patient.status === 'online' ? 'Online' : patient.status === 'session-ended' ? 'Session ended' : 'Offline'}
          </p>
        </div>
      </div>

      {patient.sessionActive && (
        <button
          onClick={onEndSession}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium"
        >
          <XMarkIcon className="w-4 h-4" />
          End Session
        </button>
      )}
    </div>
  );
}
