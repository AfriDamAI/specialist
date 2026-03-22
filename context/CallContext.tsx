'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useSocket } from '@/hooks/use-socket';
import { useCallEngine } from '@/hooks/use-call-engine';
import { Phone, PhoneOff, Video, Mic, MicOff, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { startAppointmentSession, joinAppointmentSession } from '@/lib/api-client';

// ─── Types ───────────────────────────────────────────────────────────────────

interface IncomingCallData {
  from: string;
  type: 'voice' | 'video';
  offer: any;
  chatId: string;
}

type CallStatus = 'idle' | 'ringing' | 'connected';

interface CallContextType {
  socket: ReturnType<typeof useSocket>['socket'];
  isCalling: boolean;
  callType: 'voice' | 'video' | null;
  callStatus: CallStatus;
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
  receiveExternalSignal: (data: any) => void;
}

const CallContext = createContext<CallContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { socket } = useSocket();
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [incomingCallData, setIncomingCallData] = useState<IncomingCallData | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);

  const getCurrentUserId = () =>
    typeof window !== 'undefined'
      ? localStorage.getItem('specialistId') || localStorage.getItem('userId') || ''
      : '';

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
    handleIncomingCall: engineHandleIncoming,
    handleIncomingAnswer: engineHandleIncomingAnswer,
    cleanup
  } = useCallEngine({
    socket,
    currentUserId: getCurrentUserId(),
    onIncomingCall: (from, type, offer, chatId, signalId) => {
      setIncomingCallData({ from, type, offer, chatId });
      if (signalId && typeof window !== 'undefined') {
        localStorage.setItem(`processed_signal_${signalId}`, 'true');
      }
      try {
        if (!ringtoneRef.current) {
          ringtoneRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
          ringtoneRef.current.loop = true;
        }
        ringtoneRef.current.play().catch(e => console.log('Audio play blocked:', e));
      } catch (e) { console.error('Ringtone error:', e); }
    },
    onCallAccepted: () => {
      if (ringtoneRef.current) { ringtoneRef.current.pause(); ringtoneRef.current.currentTime = 0; }
    },
    onCallEnded: () => {
      setRemoteStream(null);
      setIncomingCallData(null);
      setIsMuted(false);
      if (ringtoneRef.current) { ringtoneRef.current.pause(); ringtoneRef.current.currentTime = 0; }
    },
    onMissedCall: () => {
      setIncomingCallData(null);
      if (ringtoneRef.current) { ringtoneRef.current.pause(); ringtoneRef.current.currentTime = 0; }
    },
    onRemoteStream: (stream) => setRemoteStream(stream),
    onPeerReconnect: () => {
      toast.success('Connection restored with patient', {
        duration: 3000,
        position: 'top-center'
      });
    }
  });

  // Derive callStatus for backward compatibility with ConversationView
  const callStatus: CallStatus = (() => {
    if (incomingCallData && !isCalling) return 'ringing'; // incoming, not yet accepted
    if (isCalling && remoteStream) return 'connected';
    if (isCalling) return 'ringing'; // outgoing, waiting for answer
    return 'idle';
  })();

  // Attach streams to video/audio elements
  useEffect(() => {
    if (remoteStream) {
      if (callType === 'video' && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      } else if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
      }
    }
  }, [remoteStream, callType]);

  useEffect(() => {
    if (localStream && localVideoRef.current && callType === 'video') {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callType]);

  const handleJoinMeet = async (appointmentId: string) => {
    try {
      const response = await joinAppointmentSession(appointmentId);
      if (response?.meetLink) {
        window.open(response.meetLink, '_blank');
      } else {
        toast.error('Google Meet link not available yet.');
      }
    } catch (err) {
      toast.error('Failed to fetch Google Meet link.');
    }
  };

  const toggleMute = useCallback(() => {
    // Media logic disabled for Google Meet
  }, []);

  const initiateCall = async (toUserId: string, chatId: string, type: 'voice' | 'video') => {
    // 1. Start the session on the backend (this generates the Meet link)
    // In our backend, startSession(appointmentId) is needed. 
    // Usually, chatId in our specialists app IS the appointmentId or maps to it.
    // Let's assume the caller has the appointmentId.
    try {
      await startAppointmentSession(chatId); // chatId is used as appointmentId here in some parts of the UI
      
      // 2. Signal the patient
      if (socket) {
        socket.emit('call-offer', {
          to: toUserId,
          from: getCurrentUserId(),
          offer: { type: 'google-meet' },
          chatId: chatId,
          type: type
        });
      }

      // 3. Open Meet Link
      await handleJoinMeet(chatId);
      
      return new MediaStream(); // Dummy
    } catch (err) {
      toast.error('Could not start session.');
      throw err;
    }
  };

  const receiveExternalSignal = useCallback((data: any) => {
    // 🛡️ DUAL-SIGNALING HANDSHAKE (Rule 6 Multi-Instance Fix)
    // data.signalType identifies if it's an 'offer' (new call) or 'answer' (caller picking up recipient's response)

    if (data.signalType === 'offer') {
      if (isCalling || (incomingCallData && incomingCallData.chatId === data.chatId)) return;
      engineHandleIncoming(data);
    } else if (data.signalType === 'answer') {
      // Caller picks up an answer via durable polling
      engineHandleIncomingAnswer(data);
    }
  }, [isCalling, incomingCallData, engineHandleIncoming, engineHandleIncomingAnswer]);

  const acceptCall = async () => {
    if (!incomingCallData) throw new Error('No incoming call to accept');
    if (ringtoneRef.current) { ringtoneRef.current.pause(); ringtoneRef.current.currentTime = 0; }
    
    // 1. Signal Answer
    if (socket) {
      socket.emit('call-answer', {
        to: incomingCallData.from,
        answer: { type: 'google-meet' },
        chatId: incomingCallData.chatId
      });
    }

    // 2. Open Meet Link
    await handleJoinMeet(incomingCallData.chatId);

    setIncomingCallData(null);
    return new MediaStream(); // Dummy
  };

  const declineCall = () => {
    if (incomingCallData && socket) {
      socket.emit('call-end', { to: incomingCallData.from, chatId: incomingCallData.chatId });
    }
    if (ringtoneRef.current) { ringtoneRef.current.pause(); ringtoneRef.current.currentTime = 0; }
    setIncomingCallData(null);
    cleanup();
  };

  const endCall = () => {
    if (remoteUserId && currentChatId) baseEndCall(remoteUserId, currentChatId);
    setRemoteStream(null);
    setIncomingCallData(null);
    cleanup();
  };

  // ── Is the call UI needed globally (on any page) ──
  const showGlobalCallUI = isCalling || !!incomingCallData;

  return (
    <CallContext.Provider value={{
      socket,
      isCalling,
      callType,
      callStatus,
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
      receiveExternalSignal,
    }}>
      {children}

      {/* ── Hidden audio for voice calls ── */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* ─────────────────────────────────────────────────────────── */}
      {/* GLOBAL CALL OVERLAY — UPDATED FOR GOOGLE MEET */}
      {/* ─────────────────────────────────────────────────────────── */}
      {showGlobalCallUI && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center gap-8 p-6">
          <div className="flex flex-col items-center gap-8">
             <div className="w-40 h-40 rounded-full bg-gradient-to-br from-[#4DB6AC] to-[#E1784F] flex items-center justify-center text-white text-5xl font-bold animate-pulse shadow-2xl">
                 {remoteUserId?.[0].toUpperCase() || 'P'}
             </div>
             <div className="text-center">
                 <h2 className="text-3xl font-bold text-white mb-2">Consultation Active</h2>
                 <p className="text-[#4DB6AC] uppercase tracking-[0.4em] text-[12px] font-black italic">Meeting is live in Google Meet</p>
                 <p className="text-white/40 font-mono text-sm mt-2">Duration: {callDuration}</p>
             </div>
          </div>

          <div className="flex items-center gap-6 mt-12">
            <button 
              onClick={() => currentChatId && handleJoinMeet(currentChatId)}
              className="p-6 bg-[#4DB6AC] hover:bg-[#3d9189] text-white rounded-full transition-all transform hover:scale-110 shadow-xl flex items-center gap-3 px-8"
            >
              <ExternalLink className="w-6 h-6" />
              <span className="font-bold">Re-join Meet</span>
            </button>

            <button 
              onClick={endCall}
              className="p-6 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all transform hover:scale-110 shadow-xl"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </CallContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) throw new Error('useCall must be used within a CallProvider');
  return context;
};
