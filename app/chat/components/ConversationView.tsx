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
  onStartSession?: () => void;
  onExtendSession?: () => void;
  onFileUpload: (file: File) => void;
  onClearError?: () => void;
  chatId?: string; // Add chatId
}

import { useCall } from '@/context/CallContext';

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
  onStartSession,
  onExtendSession,
  onFileUpload,
  onClearError,
  chatId,
}: ConversationViewProps) {
  const { initiateCall, callStatus, callType, endCall, remoteStream, localStream, incomingCall, acceptCall, declineCall } = useCall();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleStartCall = (type: CallType) => {
    if (type && patient && chatId) {
      initiateCall(patient.id, chatId, type);
    }
  };

  const handleEndCall = () => {
    endCall();
  };

  const callActive = callStatus === 'connected' || callStatus === 'ringing';

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
        onEndSession={callActive ? handleEndCall : onEndSession}
        onStartSession={onStartSession}
        onExtendSession={onExtendSession}
        onStartCall={handleStartCall}
        callActive={callActive}
      />

      {/* Connection Status */}
      {/* {isConnected !== undefined && (
        <div className={`px-4 py-1 text-xs font-medium ${isConnected ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}`}>
          {isConnected ? '● Connected' : '○ Disconnected'}
        </div>
      )} */}

      {/* Call Overlay */}
      {callActive && (
        <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center">
          {/* Audio element for all calls to ensure sound plays even if video is not rendered or fails */}
          <audio
            autoPlay
            playsInline
            ref={(el) => {
              if (el && remoteStream) {
                el.srcObject = remoteStream;
                // Ensure audio is NOT muted for remote stream
                el.muted = false;
                el.play().catch(e => console.error("Error playing remote audio:", e));
              }
            }}
            className="hidden"
          />

          {/* Video Streams */}
          <div className="relative w-full h-full flex items-center justify-center">
            {callType === 'video' ? (
              <>
                {/* Remote Stream (Main) */}
                {remoteStream ? (
                  <video
                    autoPlay
                    playsInline
                    ref={(el) => { if (el) el.srcObject = remoteStream; }}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-white text-center">
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
                      <VideoCameraIcon className="w-12 h-12 text-gray-400" />
                    </div>
                    <p>{callStatus === 'ringing' ? 'Ringing...' : 'Connecting video...'}</p>
                  </div>
                )}

                {/* Local Stream (PiP) */}
                {localStream && (
                  <div className="absolute top-4 right-4 w-32 h-48 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black">
                    <video
                      autoPlay
                      playsInline
                      muted
                      ref={(el) => { if (el) el.srcObject = localStream; }}
                      className="w-full h-full object-cover mirror"
                    />
                  </div>
                )}
              </>
            ) : (
              /* Voice Call View */
              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-8 rounded-full bg-[#FF7A59]/20 flex items-center justify-center animate-pulse">
                  <div className="w-24 h-24 rounded-full bg-[#FF7A59] flex items-center justify-center shadow-lg">
                    <PhoneIcon className="w-12 h-12 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-white mb-2 uppercase italic tracking-widest">
                  {callStatus === 'connected' ? 'Voice Call Active' :
                    incomingCall ? 'Incoming call...' : 'Ringing...'}
                </h3>
                <p className="text-gray-400 font-medium">
                  {callStatus === 'connected' ? `Connected with ${patient.name}` :
                    incomingCall ? `${patient.name} is calling you` : `Calling ${patient.name}...`}
                </p>
              </div>
            )}

            {/* Call Controls Overlay */}
            <div className="absolute bottom-12 left-0 right-0 flex items-center justify-center gap-6">
              {incomingCall ? (
                <>
                  <button
                    onClick={() => {
                      console.log("📞 Declining call from overlay");
                      declineCall();
                    }}
                    className="group flex flex-col items-center gap-2"
                  >
                    <div className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center text-white shadow-2xl hover:bg-red-700 transition-all hover:scale-110 active:scale-95 border-4 border-red-600/20">
                      <XMarkIcon className="w-10 h-10" />
                    </div>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                      Decline
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      console.log("📞 Accepting call from overlay");
                      acceptCall();
                    }}
                    className="group flex flex-col items-center gap-2"
                  >
                    <div className="w-20 h-20 rounded-full bg-[#FF7A59] flex items-center justify-center text-white shadow-2xl hover:bg-[#ff8a6f] transition-all hover:scale-110 active:scale-95 border-4 border-[#FF7A59]/20">
                      <PhoneIcon className="w-10 h-10" />
                    </div>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                      Accept
                    </span>
                  </button>
                </>
              ) : (
                <button
                  onClick={handleEndCall}
                  className="group flex flex-col items-center gap-2"
                >
                  <div className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center text-white shadow-2xl hover:bg-red-700 transition-all hover:scale-110 active:scale-95 border-4 border-red-600/20">
                    <XMarkIcon className="w-10 h-10" />
                  </div>
                  <span className="text-[10px] font-black text-white uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    {callStatus === 'connected' ? 'End Call' : 'Cancel'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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
        onFileUpload={onFileUpload}
        disabled={sessionEnded || isSending}
        isUploading={isUploading}
      />
    </div>
  );
}
