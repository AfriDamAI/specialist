'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useSocket } from '@/hooks/use-socket';
import { useCallEngine } from '@/hooks/use-call-engine';
import { Phone, PhoneOff, Video, Mic, MicOff } from 'lucide-react';

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
      {/* GLOBAL CALL OVERLAY — shows regardless of which route is open */}
      {/* ─────────────────────────────────────────────────────────── */}
      {showGlobalCallUI && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center gap-8 p-6">

          {/* ── Incoming call (not yet accepted) ── */}
          {incomingCallData && !isCalling && (
            <>
              <div className="text-center">
                <p className="text-white/50 text-[10px] uppercase tracking-[0.3em] font-black mb-4">
                  Incoming {incomingCallData.type} call
                </p>
                <div className="w-28 h-28 mx-auto rounded-full bg-gradient-to-br from-[#FF7A59] to-orange-400 flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-orange-500/30 animate-pulse mb-4">
                  {incomingCallData.from?.[0]?.toUpperCase() ?? 'P'}
                </div>
                <h3 className="text-white text-2xl font-black">Patient</h3>
              </div>
              <div className="flex gap-10 mt-4">
                <div className="flex flex-col items-center gap-2">
                  <button onClick={declineCall} className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-red-500/30">
                    <PhoneOff size={22} className="text-white" />
                  </button>
                  <span className="text-white/40 text-[9px] uppercase tracking-widest font-black">Decline</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <button onClick={acceptCall} className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-green-500/30 animate-bounce">
                    {incomingCallData.type === 'video' ? <Video size={22} className="text-white" /> : <Phone size={22} className="text-white" />}
                  </button>
                  <span className="text-white/40 text-[9px] uppercase tracking-widest font-black">Accept</span>
                </div>
              </div>
            </>
          )}

          {/* ── Active / Outgoing call ── */}
          {isCalling && (
            <>
              {/* Video call layout */}
              {callType === 'video' ? (
                <div className="relative w-full max-w-4xl h-[70vh] rounded-3xl overflow-hidden bg-gray-900 shadow-2xl">
                  {/* Remote video (main) */}
                  <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />

                  {/* Status overlay when remote not connected yet */}
                  {!remoteStream && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gray-900/80">
                      <div className="w-20 h-20 rounded-full bg-[#FF7A59] flex items-center justify-center text-white text-3xl font-black animate-pulse">
                        {remoteUserId?.[0]?.toUpperCase() ?? 'P'}
                      </div>
                      <p className="text-white/60 font-mono tracking-widest text-sm animate-pulse">Ringing...</p>
                    </div>
                  )}

                  {/* Timer */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full">
                    <span className="text-white font-mono text-sm">{callStatus === 'connected' ? callDuration : 'Connecting...'}</span>
                  </div>

                  {/* Local video PiP */}
                  {localStream && (
                    <div className="absolute top-4 right-4 w-28 h-44 rounded-2xl overflow-hidden border-2 border-white/20 bg-black shadow-xl">
                      <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              ) : (
                /* Voice call layout */
                <div className="flex flex-col items-center gap-6">
                  <div className="w-36 h-36 rounded-full bg-gradient-to-br from-[#FF7A59] to-orange-400 flex items-center justify-center text-white text-5xl font-black shadow-2xl shadow-orange-500/20 animate-pulse">
                    {remoteUserId?.[0]?.toUpperCase() ?? 'P'}
                  </div>
                  <div className="text-center">
                    <h2 className="text-white text-2xl font-black">Patient</h2>
                    <p className="text-[#FF7A59] font-mono text-lg mt-2">
                      {callStatus === 'connected' ? callDuration : 'Ringing...'}
                    </p>
                  </div>
                </div>
              )}

              {/* Call controls */}
              <div className="flex gap-6 mt-4">
                {callStatus === 'connected' && (
                  <div className="flex flex-col items-center gap-2">
                    <button onClick={toggleMute} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 ${isMuted ? 'bg-yellow-500' : 'bg-white/10 hover:bg-white/20'}`}>
                      {isMuted ? <MicOff size={20} className="text-white" /> : <Mic size={20} className="text-white" />}
                    </button>
                    <span className="text-white/40 text-[9px] uppercase tracking-widest font-black">{isMuted ? 'Unmute' : 'Mute'}</span>
                  </div>
                )}
                <div className="flex flex-col items-center gap-2">
                  <button onClick={endCall} className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-red-500/30">
                    <PhoneOff size={22} className="text-white" />
                  </button>
                  <span className="text-white/40 text-[9px] uppercase tracking-widest font-black">
                    {callStatus === 'connected' ? 'End Call' : 'Cancel'}
                  </span>
                </div>
              </div>
            </>
          )}
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
