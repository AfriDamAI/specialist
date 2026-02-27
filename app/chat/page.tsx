'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import ChatContainer from './components/ChatContainer';
import { useChat } from './hooks/useChat';

export default function ChatPage() {
  const searchParams = useSearchParams();
  const patientId = searchParams.get('patientId');
  const { selectPatient } = useChat();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (patientId) {
      selectPatient(patientId);
    }
    setIsReady(true);
  }, [patientId, selectPatient]);

  if (!isReady) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-center h-[calc(100vh-11rem)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF7A59]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4">
        <Link 
          href="/appointments" 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Appointments</span>
        </Link>
      </div>
      <ChatContainer />
    </div>
  );
}
