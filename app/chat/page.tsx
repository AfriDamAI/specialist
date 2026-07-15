'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import ChatContainer from './components/ChatContainer';

function ChatPageContent() {
  const searchParams = useSearchParams();
  const [chatId, setChatId] = useState<string | undefined>(undefined);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const urlChatId = searchParams.get('chatId');
    const storedChatId = localStorage.getItem('activeChatId');
    const resolvedChatId = urlChatId || storedChatId || undefined;
    setChatId(resolvedChatId);
    setIsReady(true);
  }, [searchParams]);

  if (!isReady) {
    return (
      <DashboardLayout fullBleed>
        <div className="h-[calc(100dvh-4rem)] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF7A59]"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout fullBleed>
      <div className="h-[calc(100dvh-4rem)] p-0 md:p-6 transition-all duration-200">
        <ChatContainer chatId={chatId} />
      </div>
    </DashboardLayout>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <DashboardLayout fullBleed>
        <div className="h-[calc(100dvh-4rem)] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF7A59]"></div>
        </div>
      </DashboardLayout>
    }>
      <ChatPageContent />
    </Suspense>
  );
}