'use client';

import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import ChatContainer from './components/ChatContainer';

export default function ChatPage() {
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
