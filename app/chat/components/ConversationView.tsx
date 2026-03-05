'use client';

import { useEffect, useRef, useState } from 'react';
import { Patient, Message } from '../types/chat';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import EmptyState from './EmptyState';
import CallOverlay from './CallOverlay';
import IncomingCallModal from './IncomingCallModal';
import { CallType, IncomingCallData } from '../hooks/useCall';

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
  // Call-related props
  isCallActive?: boolean;
  callType?: CallType | null;
  incomingCallData?: IncomingCallData | null;
  localStream?: MediaStream | null;
  remoteStream?: MediaStream | null;
  onStartCall?: (type: CallType) => void;
  onEndCall?: () => void;
  onAcceptCall?: () => void;
  onRejectCall?: () => void;
  onToggleMute?: (muted: boolean) => void;
  onToggleVideo?: (enabled: boolean) => void;
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
  // Call props with defaults
  isCallActive = false,
  callType = null,
  incomingCallData = null,
  localStream = null,
  remoteStream = null,
  onStartCall,
  onEndCall,
  onAcceptCall,
  onRejectCall,
  onToggleMute,
  onToggleVideo,
}: ConversationViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const handleStartCall = (type: CallType) => {
    if (type && onStartCall) {
      onStartCall(type);
    }
  };

  const handleEndCall = () => {
    onEndCall?.();
  };

  if (!patient) {
    return <EmptyState />;
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-gray-950 relative">
      {/* Error Toast */}
      {error && (
        <div className="absolute top-0 left-0 right-0 z-40 bg-red-500 text-white px-4 py-2 text-sm text-center">
          {error}
        </div>
      )}

      <ChatHeader
        patient={patient}
        onEndSession={isCallActive ? handleEndCall : onEndSession}
        onStartCall={handleStartCall}
        callActive={isCallActive}
      />

      {/* Incoming Call Modal */}
      <IncomingCallModal
        callData={incomingCallData}
        callerName={patient.name}
        onAccept={onAcceptCall || (() => {})}
        onReject={onRejectCall || (() => {})}
      />

      {/* Active Call Overlay */}
      <CallOverlay
        isActive={isCallActive}
        type={callType || 'voice'}
        patientName={patient.name}
        localStream={localStream}
        remoteStream={remoteStream}
        onEndCall={handleEndCall}
        onToggleMute={onToggleMute}
        onToggleVideo={onToggleVideo}
      />

      {sessionEnded && !isCallActive && (
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
          messages.map((message) => <MessageBubble key={message.id} message={message} />)
        )}
        <div ref={messagesEndRef} />
      </div>

      <MessageInput
        value={inputValue}
        onChange={onInputChange}
        onSend={onSend}
        onFileUpload={handleFileUpload}
        disabled={sessionEnded || isSending || isCallActive}
        isUploading={isUploading}
      />
    </div>
  );
}
