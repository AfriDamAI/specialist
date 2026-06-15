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
  }, [messages, isSending]);

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
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <MessageInput
        value={inputValue}
        onChange={onInputChange}
        onSend={onSend}
        disabled={sessionEnded}
        isUploading={isUploading}
      />
    </div>
  );
}