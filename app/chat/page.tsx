'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import ChatContainer from './components/ChatContainer';

function ChatPageContent() {
  const searchParams = useSearchParams();
  const [chatId, setChatId] = useState<string | undefined>(undefined);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Priority 1: chatId from URL query param (set by ongoing-sessions after starting session)
    const urlChatId = searchParams.get('chatId');
    // Priority 2: chatId saved to localStorage by ongoing-sessions page
    const storedChatId = localStorage.getItem('activeChatId');

    const resolvedChatId = urlChatId || storedChatId || undefined;
    setChatId(resolvedChatId);
    setIsReady(true);
  }, [searchParams]);

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
          href="/ongoing-sessions"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sessions</span>
        </Link>
      </div>
      <ChatContainer chatId={chatId} />
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-center h-[calc(100vh-11rem)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF7A59]"></div>
        </div>
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
}
