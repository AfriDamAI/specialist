'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
      <div className="p-4 md:p-6 h-[calc(100vh-6rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF7A59]"></div>
      </div>
    );
  }

  return (
    <div className="p-0 md:p-6 transition-all duration-200">
      {/* Container takes full available height without the back button interfering */}
      <div className="h-[calc(100dvh-4rem)] md:h-[calc(100vh-6rem)]">
        <ChatContainer chatId={chatId} />
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="p-4 md:p-6 h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF7A59]"></div>
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
}