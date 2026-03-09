"use client"

import { useState, useEffect, useRef, useCallback } from "react";
import { Socket } from "socket.io-client";

/**
 * AFRIDAM CALL HOOK
 * This is mirrored from the patient app's use-call.ts exactly.
 * Handles WebRTC signaling for voice and video calls via Socket.io.
 */

interface UseCallProps {
  socket: Socket | null;
  currentUserId: string;
  onIncomingCall?: (from: string, type: 'voice' | 'video', offer: any, chatId: string) => void;
  onCallAccepted?: (answer: any) => void;
  onCallEnded?: () => void;
  onMissedCall?: (from: string, type: 'voice' | 'video', chatId: string) => void;
  onRemoteStream?: (stream: MediaStream) => void;
}

export const useCallEngine = ({
  socket,
  currentUserId,
  onIncomingCall,
  onCallAccepted,
  onCallEnded,
  onMissedCall,
  onRemoteStream
}: UseCallProps) => {
  const [isCalling, setIsCalling] = useState(false);
  const [callType, setCallType] = useState<'voice' | 'video' | null>(null);
  const [remoteUserId, setRemoteUserId] = useState<string | null>(null);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  const configuration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]
  };

  const startTimer = useCallback(() => {
    if (timerRef.current) return;
    setCallDuration(0);
    timerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const cleanup = useCallback(() => {
    stopTimer();
    setCallDuration(0);
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    pendingCandidatesRef.current = [];
    setIsCalling(false);
    setCallType(null);
    setRemoteUserId(null);
    setCurrentChatId(null);
  }, [stopTimer]);

  const processPendingCandidates = useCallback(async () => {
    if (!peerConnectionRef.current || !peerConnectionRef.current.remoteDescription) return;
    while (pendingCandidatesRef.current.length > 0) {
      const candidate = pendingCandidatesRef.current.shift();
      if (candidate) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("Error adding queued ICE candidate", e);
        }
      }
    }
  }, []);

  const createPeerConnection = useCallback((targetId: string, chatId: string) => {
    const pc = new RTCPeerConnection(configuration);

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice-candidate', {
          to: targetId,
          candidate: event.candidate,
          chatId: chatId
        });
      }
    };

    pc.ontrack = (event) => {
      startTimer();
      if (onRemoteStream) {
        onRemoteStream(event.streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        startTimer();
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        stopTimer();
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [socket, onRemoteStream, startTimer, stopTimer]);

  const startCall = async (targetId: string, chatId: string, type: 'voice' | 'video') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video'
      });

      localStreamRef.current = stream;
      const pc = createPeerConnection(targetId, chatId);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (socket) {
        socket.emit('call-offer', {
          to: targetId,
          from: currentUserId,
          offer: offer,
          chatId: chatId,
          type: type
        });
      }

      setIsCalling(true);
      setCallType(type);
      setRemoteUserId(targetId);
      setCurrentChatId(chatId);
      return stream;
    } catch (err) {
      console.error("Failed to start call:", err);
      cleanup();
      throw err;
    }
  };

  const acceptCall = async (targetId: string, chatId: string, type: 'voice' | 'video', offer: any) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video'
      });

      localStreamRef.current = stream;
      const pc = createPeerConnection(targetId, chatId);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      await processPendingCandidates();
      
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      if (socket) {
        socket.emit('call-answer', {
          to: targetId,
          answer: answer,
          chatId: chatId
        });
      }

      setIsCalling(true);
      setCallType(type);
      setRemoteUserId(targetId);
      setCurrentChatId(chatId);
      return stream;
    } catch (err) {
      console.error("Failed to accept call:", err);
      cleanup();
      throw err;
    }
  };

  const endCall = (targetId: string, chatId: string) => {
    if (socket) {
      socket.emit('call-end', {
        to: targetId,
        chatId: chatId
      });
    }
    cleanup();
  };

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data: any) => {
      if (onIncomingCall) {
        onIncomingCall(data.from, data.type, data.offer, data.chatId);
      }
    };

    const handleCallAccepted = async (data: any) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
        startTimer();
        await processPendingCandidates();
        if (onCallAccepted) onCallAccepted(data.answer);
      }
    };

    const handleIceCandidate = async (data: any) => {
      if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {
          console.error("Error adding ICE candidate", e);
        }
      } else {
        pendingCandidatesRef.current.push(data.candidate);
      }
    };

    const handleCallEnded = (data?: any) => {
      if (onMissedCall && data?.wasMissed) {
        onMissedCall(data.from, data.type, data.chatId);
      }
      cleanup();
      if (onCallEnded) onCallEnded();
    };

    socket.on('call-offer', handleIncomingCall);
    socket.on('call-answer', handleCallAccepted);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('call-end', handleCallEnded);
    socket.on('call-missed', (data: any) => {
      if (onMissedCall) onMissedCall(data.from, data.type, data.chatId);
    });

    return () => {
      socket.off('call-offer', handleIncomingCall);
      socket.off('call-answer', handleCallAccepted);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('call-end', handleCallEnded);
      socket.off('call-missed');
      stopTimer();
    };
  }, [socket, onIncomingCall, onCallAccepted, onCallEnded, onMissedCall, cleanup, startTimer, stopTimer, processPendingCandidates]);

  return {
    isCalling,
    callType,
    remoteUserId,
    currentChatId,
    callDuration: formatDuration(callDuration),
    localStream: localStreamRef.current,
    startCall,
    acceptCall,
    endCall,
    cleanup
  };
};
