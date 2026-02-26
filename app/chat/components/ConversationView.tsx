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
  onInputChange: (value: string) => void;
  onSend: () => void;
  onEndSession: () => void;
}

export default function ConversationView({
  patient,
  messages,
  inputValue,
  sessionEnded,
  onInputChange,
  onSend,
  onEndSession,
}: ConversationViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!patient) {
    return <EmptyState />;
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-gray-950">
      <ChatHeader patient={patient} onEndSession={onEndSession} />

      {sessionEnded && (
        <div className="px-4 py-2 bg-gray-100 dark:bg-gray-900 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This session has ended. You can no longer send messages.
          </p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-400">No messages yet</p>
          </div>
        ) : (
          messages.map(message => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <MessageInput
        value={inputValue}
        onChange={onInputChange}
        onSend={onSend}
        disabled={sessionEnded}
      />
    </div>
  );
}
