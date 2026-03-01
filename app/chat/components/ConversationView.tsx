'use client';

import { useEffect, useRef, useState } from 'react';
import { Patient, Message, CallType, FileAttachment } from '../types/chat';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import EmptyState from './EmptyState';
import { PhoneIcon, VideoCameraIcon, XMarkIcon } from '@heroicons/react/24/solid';

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
  onSend: () => void;
  onEndSession: () => void;
  onFileUpload: (file: File) => void;
  onClearError?: () => void;
}

export default function ConversationView({
  patient,
  messages,
  inputValue,
  sessionEnded,
  isLoading,
  isConnected,
  isSending,
  isUploading,
  error,
  onInputChange,
  onSend,
  onEndSession,
  onFileUpload,
  onClearError,
}: ConversationViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [callState, setCallState] = useState<{ type: CallType; isActive: boolean }>({
    type: null,
    isActive: false,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleStartCall = (type: CallType) => {
    if (type) {
      setCallState({ type, isActive: true });
    }
  };

  const handleEndCall = () => {
    setCallState({ type: null, isActive: false });
    onEndSession();
  };

  const handleFileUpload = async (file: File): Promise<void> => {
    await onFileUpload(file);
  };

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
        onEndSession={callState.isActive ? handleEndCall : onEndSession}
        onStartCall={handleStartCall}
        callActive={callState.isActive}
      />

      {/* Connection Status */}
      {isConnected !== undefined && (
        <div className={`px-4 py-1 text-xs font-medium ${isConnected ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}`}>
          {isConnected ? '● Connected' : '○ Disconnected'}
        </div>
      )}

      {/* Call Overlay */}
      {callState.isActive && (
        <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-800 flex items-center justify-center">
              {callState.type === 'video' ? (
                <VideoCameraIcon className="w-12 h-12 text-white" />
              ) : (
                <PhoneIcon className="w-12 h-12 text-white" />
              )}
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {callState.type === 'video' ? 'Video Call' : 'Voice Call'}
            </h3>
            <p className="text-gray-400 mb-6">Connected with {patient.name}</p>
            <div className="flex items-center justify-center gap-4">
              {callState.type === 'voice' && (
                <button className="p-4 rounded-full bg-gray-800 text-white hover:bg-gray-700 transition-colors">
                  <PhoneIcon className="w-6 h-6" />
                </button>
              )}
              <button 
                onClick={handleEndCall}
                className="p-4 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}

      {sessionEnded && !callState.isActive && (
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
        onFileUpload={handleFileUpload}
        disabled={sessionEnded || isSending}
        isUploading={isUploading}
      />
    </div>
  );
}
