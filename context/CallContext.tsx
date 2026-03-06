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

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const remoteChatId = useRef<string | null>(null);
  const remoteUserId = useRef<string | null>(null);

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
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.answer));
        setCallStatus('connected');
      }
    });

    newSocket.on('ice-candidate', async (data: { candidate: RTCIceCandidateInit }) => {
      console.log('📞 Received ICE candidate');
      if (peerConnection.current) {
        try {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {
          console.error('Error adding received ice candidate', e);
        }
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
  }, [typeof window !== 'undefined' ? localStorage.getItem('token') : null]);

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
    remoteChatId.current = null;
    remoteUserId.current = null;
  }, [localStream]);

  const setupPeerConnection = useCallback(async (type: 'voice' | 'video') => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
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
      console.log('📞 Received remote track');
      setRemoteStream(event.streams[0]);
    };

    const stream = await navigator.mediaDevices.getUserMedia({
      video: type === 'video',
      audio: true,
    });

    setLocalStream(stream);
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    peerConnection.current = pc;
    return pc;
  }, [socket]);

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

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('call-answer', {
        to: incomingCall.from,
        answer,
        chatId: incomingCall.chatId,
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
