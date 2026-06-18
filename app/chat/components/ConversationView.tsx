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
  onJoinMeet: () => void;
  isJoiningMeet?: boolean;
  hasMeetLink?: boolean;
  meetLink?: string | null;
  onClearError?: () => void;
  onViewProfile: () => void;
  chatId?: string;
  onBack?: () => void;
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
  isJoiningMeet = false,
  hasMeetLink = false,
  meetLink,
  onClearError,
  onViewProfile,
  chatId,
  onBack
}: ConversationViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!patient) return <EmptyState />;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950 w-full relative">
      <div className="w-full">
        <ChatHeader
          patient={patient}
          onEndSession={onEndSession}
          onStartSession={onStartSession}
          onExtendSession={onExtendSession}
          onJoinMeet={onJoinMeet}
          isJoiningMeet={isJoiningMeet}
          hasMeetLink={hasMeetLink}
          meetLink={meetLink}
          onViewProfile={onViewProfile}
          onBack={onBack}
        />
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-2 text-sm flex justify-between items-center">
          <span>{error}</span>
          {onClearError && (
            <button onClick={onClearError} className="hover:underline">Dismiss</button>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-gray-50/50 dark:bg-gray-900/50">
        {messages.map((message, index) => {
          const currentMsgDate = new Date(message.timestamp).toLocaleDateString();
          const prevMsgDate = index > 0 ? new Date(messages[index - 1].timestamp).toLocaleDateString() : null;
          const showDateSeparator = currentMsgDate !== prevMsgDate;

          const today = new Date().toLocaleDateString();
          const yesterday = new Date(Date.now() - 86400000).toLocaleDateString();
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
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
                  <span className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {dateLabel}
                  </span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
                </div>
              )}
              <MessageBubble message={message} />
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {sessionEnded && (
        <div className="px-4 py-2 bg-gray-100 dark:bg-gray-900 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This session has ended. You can no longer send messages.
          </p>
        </div>
      )}
      <MessageInput
        value={inputValue}
        onChange={onInputChange}
        onSend={onSend}
        disabled={sessionEnded || !!isSending}
        isUploading={isUploading}
      />
    </div>
  );
}