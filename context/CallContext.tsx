'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '@/lib/config';
import { toast } from 'react-hot-toast';

interface CallContextType {
  isCalling: boolean;
  incomingCall: IncomingCall | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  initiateCall: (toUserId: string, chatId: string, type: 'voice' | 'video') => Promise<void>;
  acceptCall: () => Promise<void>;
  declineCall: () => void;
  endCall: () => void;
  callType: 'voice' | 'video' | null;
  callStatus: 'idle' | 'ringing' | 'connected' | 'ended';
  remoteUser: { id: string; name?: string } | null;
  callDuration: number;
}

interface IncomingCall {
  from: string;
  offer: RTCSessionDescriptionInit;
  chatId: string;
  type: 'voice' | 'video';
}

const CallContext = createContext<CallContextType | null>(null);

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callType, setCallType] = useState<'voice' | 'video' | null>(null);
  const [callStatus, setCallStatus] = useState<'idle' | 'ringing' | 'connected' | 'ended'>('idle');
  const [remoteUser, setRemoteUser] = useState<{ id: string; name?: string } | null>(null);
  const [callDuration, setCallDuration] = useState(0);

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const remoteChatId = useRef<string | null>(null);
  const remoteUserId = useRef<string | null>(null);
  const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([]);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);

  const processIceQueue = useCallback(async () => {
    if (!peerConnection.current || !peerConnection.current.remoteDescription) return;
    
    console.log(`📞 Processing ${iceCandidateQueue.current.length} queued ICE candidates`);
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

  // Timer logic
  useEffect(() => {
    if (callStatus === 'connected') {
      setCallDuration(0);
      timerInterval.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
        timerInterval.current = null;
      }
    }

    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, [callStatus]);

  // Initialize Socket
  useEffect(() => {
    const rawToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!rawToken) {
      console.warn('📞 CallContext: No token found, skipping socket init');
      return;
    }

    const cleanToken = rawToken.replace(/['"]+/g, '').trim();
    console.log('📞 CallContext: Initializing socket sync...');

    const newSocket = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: { token: cleanToken },
    });

    newSocket.on('connect', () => {
      console.log('📞 Call Socket: ACTIVE');
    });

    newSocket.on('connect_error', (error) => {
      console.error('📞 Call Socket: Connection error:', error.message);
    });

    newSocket.on('call-offer', (data: IncomingCall) => {
      console.log('📞 Incoming call offer:', data);
      setIncomingCall(data);
      setCallType(data.type);
      setCallStatus('ringing');
      remoteChatId.current = data.chatId;
      remoteUserId.current = data.from;
      setRemoteUser({ id: data.from });
    });

    newSocket.on('call-answer', async (data: { answer: RTCSessionDescriptionInit }) => {
      console.log('📞 Received call answer');
      if (peerConnection.current) {
        try {
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.answer));
          setCallStatus('connected');
          processIceQueue();
        } catch (e) {
          console.error('Error setting remote description from answer', e);
        }
      }
    });

    newSocket.on('ice-candidate', async (data: { candidate: RTCIceCandidateInit }) => {
      console.log('📞 Received ICE candidate');
      if (peerConnection.current && peerConnection.current.remoteDescription) {
        try {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {
          console.error('Error adding received ice candidate', e);
        }
      } else {
        console.log('📞 Queuing ICE candidate (remote description not set)');
        iceCandidateQueue.current.push(data.candidate);
      }
    });

    newSocket.on('call-end', () => {
      console.log('📞 Call ended by remote user');
      cleanupCall();
    });

    setSocket(newSocket);

    return () => {
      console.log('📞 Call Socket: DISCONNECTING');
      newSocket.off();
      newSocket.disconnect();
    };
  }, [processIceQueue, typeof window !== 'undefined' ? localStorage.getItem('token') : null]);

  const cleanupCall = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    setIsCalling(false);
    setIncomingCall(null);
    setCallType(null);
    setCallStatus('idle');
    setRemoteUser(null);
    setCallDuration(0);
    remoteChatId.current = null;
    remoteUserId.current = null;
    iceCandidateQueue.current = [];
  }, [localStream]);

  const setupPeerConnection = useCallback(async (type: 'voice' | 'video') => {
    console.log(`📞 Setting up PeerConnection for ${type}...`);
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && socket && remoteUserId.current) {
        socket.emit('ice-candidate', {
          to: remoteUserId.current,
          candidate: event.candidate,
          chatId: remoteChatId.current,
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('📞 Received remote track:', event.track.kind);
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      } else {
        setRemoteStream(prev => {
          if (prev) {
            prev.addTrack(event.track);
            return prev;
          }
          return new MediaStream([event.track]);
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('📞 Connection State:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setCallStatus('connected');
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        toast.error('Call connection failed');
        cleanupCall();
      }
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === 'video',
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      setLocalStream(stream);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    } catch (err) {
      console.error('Error accessing media devices:', err);
      toast.error('Could not access microphone/camera');
      throw err;
    }

    peerConnection.current = pc;
    return pc;
  }, [socket, cleanupCall]);

  const initiateCall = async (toUserId: string, chatId: string, type: 'voice' | 'video') => {
    try {
      console.log(`📞 Initiating ${type} call to user ${toUserId} for chat ${chatId}...`);
      setIsCalling(true);
      setCallType(type);
      setCallStatus('ringing');
      remoteUserId.current = toUserId;
      remoteChatId.current = chatId;
      setRemoteUser({ id: toUserId });

      const pc = await setupPeerConnection(type);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (socket) {
        socket.emit('call-offer', {
          to: toUserId,
          offer,
          chatId,
          type,
        });
        console.log('📞 Call offer sent to signaling server');
      }
    } catch (error) {
      console.error('📞 Failed to initiate call:', error);
      toast.error('Failed to start call');
      cleanupCall();
    }
  };

  const acceptCall = async () => {
    if (!incomingCall || !socket) return;

    try {
      console.log(`📞 Accepting ${incomingCall.type} call from ${incomingCall.from}...`);
      const pc = await setupPeerConnection(incomingCall.type);
      
      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      processIceQueue();

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('call-answer', {
        to: incomingCall.from,
        answer,
        chatId: incomingCall.chatId,
        type: incomingCall.type,
      });

      console.log('📞 Call answer sent. Connecting...');
      setIncomingCall(null);
      setCallStatus('connected');
    } catch (error) {
      console.error('📞 Failed to accept call:', error);
      toast.error('Failed to connect call');
      cleanupCall();
    }
  };

  const declineCall = () => {
    if (incomingCall && socket) {
      console.log(`📞 Declining incoming call from ${incomingCall.from}`);
      socket.emit('call-end', {
        to: incomingCall.from,
        chatId: incomingCall.chatId,
      });
    }
    cleanupCall();
  };

  const endCall = () => {
    if (remoteUserId.current && socket && remoteChatId.current) {
      console.log(`📞 Ending call with ${remoteUserId.current}`);
      socket.emit('call-end', {
        to: remoteUserId.current,
        chatId: remoteChatId.current,
      });
    }
    cleanupCall();
  };

  // Log status changes
  useEffect(() => {
    if (callStatus !== 'idle') {
      console.log(`📞 Call Status Update: ${callStatus.toUpperCase()}`);
    }
  }, [callStatus]);

  return (
    <CallContext.Provider
      value={{
        isCalling,
        incomingCall,
        localStream,
        remoteStream,
        initiateCall,
        acceptCall,
        declineCall,
        endCall,
        callType,
        callStatus,
        remoteUser,
        callDuration,
      }}
    >
      {children}
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
