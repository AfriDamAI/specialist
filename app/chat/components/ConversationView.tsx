'use client';

import { useEffect, useRef } from 'react';
import { Patient, Message } from '../types/chat';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import EmptyState from './EmptyState';

interface ConversationViewProps {
  patient: Patient | null;
  messages: Message[];
  inputValue: string;
  sessionEnded: boolean;
  isLoading?: boolean;
  isConnected?: boolean;
  isSending?: boolean;
  isUploading?: boolean;
  error?: string | null;
  onInputChange: (value: string) => void;
  onSend: (text: string, file: File | null) => void;
  onEndSession: () => void;
  onStartSession?: () => void;
  onExtendSession?: () => void;
  onFileUpload?: (file: File) => void;
  onJoinMeet: () => void;
  isJoiningMeet?: boolean;
  hasMeetLink?: boolean;
  onClearError?: () => void;
  onViewProfile: () => void;
  chatId?: string;
  // Mobile navigation
  onMobileBack?: () => void;
  isMobile?: boolean;
}

export default function ConversationView({
  patient,
  messages,
  inputValue,
  sessionEnded,
  isLoading,
  isSending,
  isUploading,
  error,
  onInputChange,
  onSend,
  onEndSession,
  onStartSession,
  onExtendSession,
  onJoinMeet,
  isJoiningMeet,
  hasMeetLink,
  onClearError,
  onViewProfile,
  chatId,
  onMobileBack,
  isMobile = false,
}: ConversationViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(0);
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    const prevCount = prevMessageCountRef.current;
    const newCount = messages.length;

    // Only auto-scroll when a message is actually added — never on unrelated
    // re-renders (polling, prop changes, etc). This stops the chat from
    // yanking itself back down while the user is scrolled up reading history.
    if (newCount > prevCount) {
      messagesEndRef.current?.scrollIntoView({
        behavior: isFirstLoadRef.current ? 'auto' : 'smooth',
      });
      isFirstLoadRef.current = false;
    }

    prevMessageCountRef.current = newCount;
  }, [messages]);

  // Reset scroll tracking whenever the conversation itself changes
  useEffect(() => {
    isFirstLoadRef.current = true;
    prevMessageCountRef.current = 0;
  }, [chatId]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => onClearError?.(), 3000);
      return () => clearTimeout(timer);
    }
  }, [error, onClearError]);

  // On mobile, show empty state only if no chat open (panel won't be visible anyway)
  if (!patient) {
    return (
      <div className="flex flex-col flex-1 w-full min-w-0 h-full min-h-0">
        <EmptyState />
      </div>
    );
  }

  const today = new Date().toLocaleDateString();
  const yesterday = new Date(new Date().setDate(new Date().getDate() - 1)).toLocaleDateString();

  return (
    <div className="flex flex-col flex-1 w-full min-w-0 h-full min-h-0 bg-white dark:bg-gray-950 relative">
      {/* Error Toast */}
      {error && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-red-500 text-white px-4 py-2 text-sm text-center">
          {error}
        </div>
      )}

      {/* Header — fixed, never part of the scroll area, never unmounts on scroll */}
      <div className="flex-shrink-0 z-10">
        <ChatHeader
          patient={patient}
          onEndSession={onEndSession}
          onStartSession={onStartSession}
          onExtendSession={onExtendSession}
          onJoinMeet={onJoinMeet}
          onViewProfile={onViewProfile}
          isJoiningMeet={isJoiningMeet}
          hasMeetLink={hasMeetLink}
          onMobileBack={onMobileBack}
          isMobile={isMobile}
        />
      </div>

      {sessionEnded && (
        <div className="flex-shrink-0 px-4 py-2 bg-gray-50 dark:bg-gray-900 text-center border-b border-gray-100 dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This session has ended. You can no longer send messages.
          </p>
        </div>
      )}

      {/* Messages — the ONLY scrollable region */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 md:px-4 py-4 space-y-0.5">
        {isLoading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#FF7A59]"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-400 dark:text-gray-500">No messages yet</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const currentMsgDate = new Date(message.timestamp).toLocaleDateString();
            const prevMsgDate = index > 0
              ? new Date(messages[index - 1].timestamp).toLocaleDateString()
              : null;
            const showDateSeparator = currentMsgDate !== prevMsgDate;

            let dateLabel = currentMsgDate;
            if (currentMsgDate === today) dateLabel = 'Today';
            else if (currentMsgDate === yesterday) dateLabel = 'Yesterday';
            else {
              dateLabel = new Date(message.timestamp).toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
              });
            }

            return (
              <div key={message.id}>
                {showDateSeparator && (
                  <div className="flex items-center justify-center my-6">
                    <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
                    <span className="px-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                      {dateLabel}
                    </span>
                    <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
                  </div>
                )}
                <MessageBubble message={message} />
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex-shrink-0">
        <MessageInput
          value={inputValue}
          onChange={onInputChange}
          onSend={onSend}
          disabled={sessionEnded || isSending}
          isUploading={isUploading}
        />
      </div>
    </div>
  );
}