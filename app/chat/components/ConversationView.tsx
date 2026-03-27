'use client';

import { useEffect, useRef } from 'react';
import { Patient, Message, CallType } from '../types/chat';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import EmptyState from './EmptyState';
import { useCall } from '@/context/CallContext';

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
  onFileUpload?: (file: File) => void; // Keep for legacy if needed, but we use unified onSend
  onJoinMeet: () => void;
  isJoiningMeet?: boolean;
  hasMeetLink?: boolean;
  onClearError?: () => void;
  onViewProfile: () => void;
  chatId?: string;
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
}: ConversationViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const callActive = false; // Always false now that WebRTC is removed from this view

  // Show error notification
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        onClearError?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, onClearError]);

  if (!patient) {
    return <EmptyState />;
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-gray-950 relative">
      {/* Error Toast */}
      {error && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-red-500 text-white px-4 py-2 text-sm text-center">
          {error}
        </div>
      )}

      <ChatHeader
        patient={patient}
        onEndSession={onEndSession}
        onStartSession={onStartSession}
        onExtendSession={onExtendSession}
        onJoinMeet={onJoinMeet}
        onViewProfile={onViewProfile}
        isJoiningMeet={isJoiningMeet}
        hasMeetLink={hasMeetLink}
        callActive={callActive}
      />

      {sessionEnded && !callActive && (
        <div className="px-4 py-2 bg-gray-100 dark:bg-gray-900 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This session has ended. You can no longer send messages.
          </p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#FF7A59]"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-400">No messages yet</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const currentMsgDate = new Date(message.timestamp).toLocaleDateString();
            const prevMsgDate = index > 0 ? new Date(messages[index - 1].timestamp).toLocaleDateString() : null;
            const showDateSeparator = currentMsgDate !== prevMsgDate;

            let dateLabel = currentMsgDate;
            const today = new Date().toLocaleDateString();
            const yesterday = new Date(Date.now() - 86400000).toLocaleDateString();

            if (currentMsgDate === today) dateLabel = 'Today';
            else if (currentMsgDate === yesterday) dateLabel = 'Yesterday';
            else {
              dateLabel = new Date(message.timestamp).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              });
            }

            return (
              <div key={message.id}>
                {showDateSeparator && (
                  <div className="flex items-center justify-center my-8">
                    <div className="flex-1 h-[1px] bg-gray-100 dark:bg-gray-800" />
                    <span className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic">
                      {dateLabel}
                    </span>
                    <div className="flex-1 h-[1px] bg-gray-100 dark:bg-gray-800" />
                  </div>
                )}
                <MessageBubble message={message} />
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <MessageInput
        value={inputValue}
        onChange={onInputChange}
        onSend={onSend}
        disabled={sessionEnded || isSending}
        isUploading={isUploading}
      />
    </div>
  );
}
