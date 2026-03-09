'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useSocket } from '@/hooks/use-socket';
import { useCallEngine } from '@/hooks/use-call-engine';
import { Phone, PhoneOff, Video } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface IncomingCallData {
  from: string;
  type: 'voice' | 'video';
  offer: any;
  chatId: string;
}

interface CallContextType {
  socket: ReturnType<typeof useSocket>['socket'];
  isCalling: boolean;
  callType: 'voice' | 'video' | null;
  remoteUserId: string | null;
  currentChatId: string | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  callDuration: string;
  incomingCall: IncomingCallData | null;
  initiateCall: (toUserId: string, chatId: string, type: 'voice' | 'video') => Promise<MediaStream>;
  acceptCall: () => Promise<MediaStream>;
  declineCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  isMuted: boolean;
}

const CallContext = createContext<CallContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { socket } = useSocket();
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [incomingCallData, setIncomingCallData] = useState<IncomingCallData | null>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);

  // Get specialist's own user ID from localStorage
  const getCurrentUserId = () =>
  (typeof window !== 'undefined'
    ? localStorage.getItem('specialistId') || localStorage.getItem('userId') || ''
    : '');

  const {
    isCalling,
    callType,
    remoteUserId,
    currentChatId,
    callDuration,
    localStream,
    startCall: baseStartCall,
    acceptCall: baseAcceptCall,
    endCall: baseEndCall,
    cleanup
  } = useCallEngine({
    socket,
    currentUserId: getCurrentUserId(),
    onIncomingCall: (from, type, offer, chatId) => {
      setIncomingCallData({ from, type, offer, chatId });
      // Play ringtone
      try {
        if (!ringtoneRef.current) {
          ringtoneRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
          ringtoneRef.current.loop = true;
        }
        ringtoneRef.current.play().catch(e => console.log('Audio play blocked:', e));
      } catch (e) {
        console.error('Ringtone error:', e);
      }
    },
    onCallAccepted: () => {
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current.currentTime = 0;
      }
    },
    onCallEnded: () => {
      setRemoteStream(null);
      setIncomingCallData(null);
      setIsMuted(false);
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current.currentTime = 0;
      }
    },
    onMissedCall: (from, type, chatId) => {
      setIncomingCallData(null);
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current.currentTime = 0;
      }
    },
    onRemoteStream: (stream) => {
      setRemoteStream(stream);
    }
  });

  const toggleMute = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
        setIsMuted(!isMuted);
      }
    }
  }, [localStream, isMuted]);

  const initiateCall = async (toUserId: string, chatId: string, type: 'voice' | 'video') => {
    setIsMuted(false);
    return baseStartCall(toUserId, chatId, type);
  };

  const acceptCall = async () => {
    if (!incomingCallData) throw new Error('No incoming call to accept');
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
    setIsMuted(false);
    const stream = await baseAcceptCall(
      incomingCallData.from,
      incomingCallData.chatId,
      incomingCallData.type,
      incomingCallData.offer
    );
    setIncomingCallData(null);
    return stream;
  };

  const declineCall = () => {
    if (incomingCallData && socket) {
      socket.emit('call-end', {
        to: incomingCallData.from,
        chatId: incomingCallData.chatId
      });
    }
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
    setIncomingCallData(null);
    cleanup();
  };

  const endCall = () => {
    if (remoteUserId && currentChatId) {
      baseEndCall(remoteUserId, currentChatId);
    }
    setRemoteStream(null);
    setIncomingCallData(null);
    cleanup();
  };

  return (
    <CallContext.Provider value={{
      socket,
      isCalling,
      callType,
      remoteUserId,
      currentChatId,
      localStream,
      remoteStream,
      callDuration,
      incomingCall: incomingCallData,
      initiateCall,
      acceptCall,
      declineCall,
      endCall,
      toggleMute,
      isMuted,
    }}>
      {children}

      {/* ─── Global Incoming Call Overlay ─────────────────────────────── */}
      {/* This shows anywhere in the app, even when not on /chat page */}
      {incomingCallData && !isCalling && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-3xl p-8 shadow-2xl flex flex-col items-center gap-6 max-w-xs w-full mx-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FF7A59] to-orange-400 flex items-center justify-center text-white text-3xl font-bold animate-pulse shadow-lg shadow-orange-500/30">
              {incomingCallData.from?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="text-center">
              <p className="text-white/50 text-[10px] uppercase tracking-[0.3em] font-black mb-1">
                Incoming {incomingCallData.type} call
              </p>
              <h3 className="text-white text-lg font-black">Patient</h3>
            </div>
            <div className="flex gap-8">
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={declineCall}
                  className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all active:scale-95 shadow-lg"
                >
                  <PhoneOff size={22} className="text-white" />
                </button>
                <span className="text-white/50 text-[9px] uppercase tracking-widest font-black">Decline</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={acceptCall}
                  className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-all active:scale-95 shadow-lg animate-bounce"
                >
                  {incomingCallData.type === 'video'
                    ? <Video size={22} className="text-white" />
                    : <Phone size={22} className="text-white" />}
                </button>
                <span className="text-white/50 text-[9px] uppercase tracking-widest font-black">Accept</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </CallContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};
