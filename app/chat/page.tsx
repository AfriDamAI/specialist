'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import ChatContainer from './components/ChatContainer';
import { initiateChat } from '@/lib/api-client';

function ChatPageContent() {
  
  //const chatId = searchParams.get('chatId');
  const [isReady, setIsReady] = useState(false);
  const [pendingChatId, setPendingChatId] = useState<string | null>(null);

  useEffect(() => {
    // Check if there's a pending chat to initiate from appointment acceptance
    const initiatePendingChat = async () => {
      const specialistId = localStorage.getItem('specialistId');
      const patientId = localStorage.getItem('patientId');
      
      if (specialistId && patientId) {
        try {
          // Call the initiateChat API with the saved IDs
          const chatResponse = await initiateChat(specialistId, patientId);
          
          console.log('Initiated chat:', chatResponse);
          
          if (chatResponse?.id) {
            setPendingChatId(chatResponse?.resultData?.id);
            
            // Clear the stored IDs after use
            localStorage.removeItem('specialistId');
            localStorage.removeItem('patientId');
            localStorage.removeItem('sessionId');
          }
        } catch (error) {
          console.error('Error initiating chat:', error);
        }
      }
    };
    
    initiatePendingChat();
    setIsReady(true);
  }, []);

  if (!isReady) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-center h-[calc(100vh-11rem)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF7A59]"></div>
        </div>
      </div>
    );
  }

  // Use pendingChatId if available, otherwise use URL chatId
  const activeChatId = pendingChatId ||  undefined;

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
      <ChatContainer chatId={activeChatId} />
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
