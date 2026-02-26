'use client';

import { Patient } from '../types/chat';

interface PatientListItemProps {
  patient: Patient;
  isActive: boolean;
  onClick: () => void;
}

export default function PatientListItem({ patient, isActive, onClick }: PatientListItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left ${
        isActive
          ? 'bg-[#FF7A59]/10 border border-[#FF7A59]/30'
          : 'hover:bg-gray-50 dark:hover:bg-gray-900 border border-transparent'
      }`}
    >
      <div className="relative">
        <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
          <span className="text-gray-600 dark:text-gray-300 font-bold text-sm">
            {patient.name.split(' ').map(n => n[0]).join('')}
          </span>
        </div>
        <span
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-950 ${
            patient.status === 'online'
              ? 'bg-green-500'
              : patient.status === 'session-ended'
              ? 'bg-gray-400'
              : 'bg-gray-300'
          }`}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-900 dark:text-white text-sm truncate">
            {patient.name}
          </span>
          {patient.lastMessageTime && (
            <span className="text-xs text-gray-400 ml-2 shrink-0">
              {patient.lastMessageTime}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate block">
            {patient.lastMessage || (patient.sessionActive ? 'Active session' : 'Session ended')}
          </span>
          {patient.unreadCount > 0 && (
            <span className="bg-[#FF7A59] text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-2 shrink-0">
              {patient.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
