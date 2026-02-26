'use client';

import { useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Patient } from '../types/chat';
import PatientListItem from './PatientListItem';

interface PatientListProps {
  patients: Patient[];
  selectedPatientId: string | null;
  onSelectPatient: (patientId: string) => void;
}

export default function PatientList({ patients, selectedPatientId, onSelectPatient }: PatientListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedPatients = [...filteredPatients].sort((a, b) => {
    // Online first, then by unread count, then by last message time
    if (a.status === 'online' && b.status !== 'online') return -1;
    if (b.status === 'online' && a.status !== 'online') return 1;
    if (a.unreadCount !== b.unreadCount) return b.unreadCount - a.unreadCount;
    return 0;
  });

  return (
    <div className="w-80 bg-white dark:bg-gray-950 border-r border-gray-100 dark:border-gray-800 flex flex-col h-full">
      <div className="p-4 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Patients</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Search patients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:border-[#FF7A59] focus:outline-none"
          />
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {sortedPatients.length === 0 ? (
          <p className="text-center text-gray-500 text-sm py-8">No patients found</p>
        ) : (
          sortedPatients.map(patient => (
            <PatientListItem
              key={patient.id}
              patient={patient}
              isActive={selectedPatientId === patient.id}
              onClick={() => onSelectPatient(patient.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
