'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL, SOCKET_OPTIONS } from '@/lib/config';
import { toast } from 'react-hot-toast';
import { Phone, PhoneOff, Video } from 'lucide-react';

interface CallContextType {
  socket: Socket | null;
  isCalling: boolean;
  incomingCall: IncomingCallData | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  initiateCall: (toUserId: string, chatId: string, type: 'voice' | 'video') => Promise<void>;
  acceptCall: () => Promise<void>;
  declineCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  isMuted: boolean;
  callType: 'voice' | 'video' | null;
  callStatus: 'idle' | 'ringing' | 'connected' | 'ended';
  remoteUser: { id: string; name?: string } | null;
  callDuration: number;
}

interface IncomingCallData {
  from: string;
  offer: RTCSessionDescriptionInit;
  chatId: string;
  type: 'voice' | 'video';
}

const CallContext = createContext<CallContextType | null>(null);

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callType, setCallType] = useState<'voice' | 'video' | null>(null);
  const [callStatus, setCallStatus] = useState<'idle' | 'ringing' | 'connected' | 'ended'>('idle');
  const [remoteUser, setRemoteUser] = useState<{ id: string; name?: string } | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const remoteChatId = useRef<string | null>(null);
  const remoteUserId = useRef<string | null>(null);
  const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([]);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);

  // ─── ICE Queue ─────────────────────────────────────────────────────────────
  const processIceQueue = useCallback(async () => {
    if (!peerConnection.current || !peerConnection.current.remoteDescription) return;
    while (iceCandidateQueue.current.length > 0) {
      const candidate = iceCandidateQueue.current.shift();
      if (candidate) {
        try {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('Error adding queued ice candidate', e);
        }
      }
    }
  }, []);

  // ─── Cleanup ────────────────────────────────────────────────────────────────
  const cleanupCall = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
    setLocalStream(null);
    setRemoteStream(null);
    setIsCalling(false);
    setIncomingCall(null);
    setCallType(null);
    setCallStatus('idle');
    setRemoteUser(null);
    setCallDuration(0);
    setIsMuted(false);
    remoteChatId.current = null;
    remoteUserId.current = null;
    iceCandidateQueue.current = [];
  }, []);

  // ─── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (callStatus === 'connected') {
      setCallDuration(0);
      timerInterval.current = setInterval(() => setCallDuration(prev => prev + 1), 1000);
    } else {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
        timerInterval.current = null;
      }
    }
    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, [callStatus]);

  // ─── Socket Initialization ───────────────────────────────────────────────────
  useEffect(() => {
    const rawToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!rawToken) return;

    const cleanToken = rawToken.replace(/['\"]+/g, '').trim();
    const newSocket = io(SOCKET_URL, {
      ...SOCKET_OPTIONS,
      forceNew: true,
      auth: { token: cleanToken },
    });

    newSocket.on('connect_error', (err) => {
      console.error('📞 CallContext: Socket connect error:', err.message);
    });
    newSocket.on('connect', () => console.log('✅ CallContext: Socket connected'));

    // ── Incoming call ──
    newSocket.on('call-offer', (data: IncomingCallData) => {
      console.log('📞 Incoming call from:', data.from, 'type:', data.type);
      setIncomingCall(data);
      setCallType(data.type);
      setCallStatus('ringing');
      remoteChatId.current = data.chatId;
      remoteUserId.current = data.from;
      setRemoteUser({ id: data.from });

      // Play ringtone
      try {
        if (!ringtoneRef.current) {
          ringtoneRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
          ringtoneRef.current.loop = true;
        }
        ringtoneRef.current.play().catch(e => console.log('Audio play blocked', e));
      } catch (e) {
        console.error('Ringtone error', e);
      }
    });

    // ── Call answered ──
    newSocket.on('call-answer', async (data: { answer: RTCSessionDescriptionInit }) => {
      if (peerConnection.current) {
        try {
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.answer));
          setCallStatus('connected');
          processIceQueue();
          if (ringtoneRef.current) {
            ringtoneRef.current.pause();
            ringtoneRef.current.currentTime = 0;
          }
        } catch (e) {
          console.error('Error setting remote description from answer', e);
        }
      }
    });

    // ── ICE ──
    newSocket.on('ice-candidate', async (data: { candidate: RTCIceCandidateInit }) => {
      if (peerConnection.current && peerConnection.current.remoteDescription) {
        try {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {
          console.error('Error adding ICE candidate', e);
        }
      } else {
        iceCandidateQueue.current.push(data.candidate);
      }
    });

    // ── Call ended ──
    newSocket.on('call-end', () => {
      console.log('📴 Remote user ended call');
      cleanupCall();
    });

    setSocket(newSocket);
    return () => {
      newSocket.off();
      newSocket.disconnect();
    };
  }, [cleanupCall, processIceQueue]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  // ─── Create RTCPeerConnection ─────────────────────────────────────────────────
  const setupPeerConnection = useCallback(async (targetId: string, chatId: string, type: 'voice' | 'video') => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice-candidate', {
          to: targetId,
          candidate: event.candidate,
          chatId: chatId,
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('📞 Received remote track:', event.track.kind);
      setRemoteStream(event.streams?.[0] ?? new MediaStream([event.track]));
      setCallStatus('connected');
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        toast.error('Call connection lost');
        cleanupCall();
      }
    };

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === 'video',
    });

    localStreamRef.current = stream;
    setLocalStream(stream);
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    peerConnection.current = pc;
    return pc;
  }, [socket, cleanupCall]);

  // ─── Initiate Call ─────────────────────────────────────────────────────────
  const initiateCall = async (toUserId: string, chatId: string, type: 'voice' | 'video') => {
    try {
      setIsCalling(true);
      setCallType(type);
      setCallStatus('ringing');
      remoteUserId.current = toUserId;
      remoteChatId.current = chatId;
      setRemoteUser({ id: toUserId });

      const currentUserId = localStorage.getItem('specialistId') || localStorage.getItem('userId') || '';
      const pc = await setupPeerConnection(toUserId, chatId, type);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (socket) {
        socket.emit('call-offer', {
          to: toUserId,
          from: currentUserId, // ✅ Required by the backend gateway
          offer,
          chatId,
          type,
        });
        console.log('📡 Call offer sent to', toUserId);
      }
    } catch (error) {
      console.error('Failed to initiate call', error);
      toast.error('Could not access microphone/camera. Please check permissions.');
      cleanupCall();
    }
  };

  // ─── Accept Incoming Call ──────────────────────────────────────────────────
  const acceptCall = async () => {
    if (!incomingCall) return;
    try {
      const { from, chatId, type, offer } = incomingCall;

      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current.currentTime = 0;
      }

      const pc = await setupPeerConnection(from, chatId, type);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      await processIceQueue(); // drain any queued ICE candidates

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      if (socket) {
        socket.emit('call-answer', { to: from, answer, chatId, type });
        console.log('✅ Call answer sent to', from);
      }

      setIsCalling(true);
      setCallStatus('connected');
      setIncomingCall(null);
    } catch (error) {
      console.error('Failed to accept call', error);
      toast.error('Could not accept call. Please check microphone/camera permissions.');
      cleanupCall();
    }
  };

  // ─── Decline Incoming Call ─────────────────────────────────────────────────
  const declineCall = () => {
    if (incomingCall && socket) {
      socket.emit('call-end', { to: incomingCall.from, chatId: incomingCall.chatId });
    }
    cleanupCall();
  };

  // ─── End Active Call ───────────────────────────────────────────────────────
  const endCall = () => {
    if (remoteUserId.current && socket && remoteChatId.current) {
      socket.emit('call-end', { to: remoteUserId.current, chatId: remoteChatId.current });
    }
    cleanupCall();
  };

  return (
    <CallContext.Provider
      value={{
        socket,
        isCalling,
        incomingCall,
        localStream,
        remoteStream,
        initiateCall,
        acceptCall,
        declineCall,
        endCall,
        toggleMute,
        isMuted,
        callType,
        callStatus,
        remoteUser,
        callDuration,
      }}
    >
      {children}

      {/* ── Incoming Call UI ── */}
      {incomingCall && !isCalling && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-3xl p-8 shadow-2xl flex flex-col items-center gap-6 max-w-sm w-full mx-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FF7A59] to-orange-400 flex items-center justify-center text-white text-3xl font-bold animate-pulse">
              {incomingCall.from?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="text-center">
              <p className="text-white/60 text-xs uppercase tracking-widest mb-1">Incoming {incomingCall.type} call</p>
              <h3 className="text-white text-xl font-bold">{incomingCall.from}</h3>
            </div>
            <div className="flex gap-6">
              <button
                onClick={declineCall}
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors shadow-lg"
              >
                <PhoneOff size={24} className="text-white" />
              </button>
              <button
                onClick={acceptCall}
                className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors shadow-lg animate-bounce"
              >
                {incomingCall.type === 'video' ? <Video size={24} className="text-white" /> : <Phone size={24} className="text-white" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Active Call UI ── */}
      {isCalling && (
        <div className="fixed inset-0 z-[150] bg-black/95 flex flex-col items-center justify-center gap-8">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#FF7A59] to-orange-400 flex items-center justify-center text-white text-4xl font-bold animate-pulse">
            {remoteUser?.id?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="text-center">
            <h2 className="text-white text-2xl font-bold">{remoteUser?.name ?? remoteUser?.id}</h2>
            <p className="text-white/60 text-sm mt-1">
              {callStatus === 'ringing' ? 'Ringing...' : callStatus === 'connected' ? `${Math.floor(callDuration / 60).toString().padStart(2, '0')}:${(callDuration % 60).toString().padStart(2, '0')}` : 'Connecting...'}
            </p>
          </div>
          <button
            onClick={endCall}
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors shadow-lg"
          >
            <PhoneOff size={24} className="text-white" />
          </button>
        </div>
      )}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};
