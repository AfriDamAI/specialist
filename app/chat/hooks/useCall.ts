'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';

export type CallType = 'voice' | 'video';

export interface CallState {
  isActive: boolean;
  type: CallType | null;
  remoteUserId: string | null;
  chatId: string | null;
  isIncoming: boolean;
}

export interface IncomingCallData {
  from: string;
  type: CallType;
  offer: RTCSessionDescriptionInit;
  chatId: string;
}

interface UseCallProps {
  socket: Socket | null;
  currentUserId: string;
  onIncomingCall?: (data: IncomingCallData) => void;
  onCallAccepted?: () => void;
  onCallEnded?: () => void;
  onRemoteStream?: (stream: MediaStream) => void;
  onLocalStream?: (stream: MediaStream) => void;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // TODO: Add TURN servers for production to handle restrictive NATs
    // { urls: 'turn:your-turn-server.com:3478', username: '...', credential: '...' }
  ],
};

export function useCall({
  socket,
  currentUserId,
  onIncomingCall,
  onCallAccepted,
  onCallEnded,
  onRemoteStream,
  onLocalStream,
}: UseCallProps) {
  const [callState, setCallState] = useState<CallState>({
    isActive: false,
    type: null,
    remoteUserId: null,
    chatId: null,
    isIncoming: false,
  });

  // Use ref to track current call state and avoid stale closures
  const callStateRef = useRef(callState);
  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  const cleanup = useCallback(() => {
    // Stop all local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    remoteStreamRef.current = null;
    pendingCandidatesRef.current = [];

    setCallState({
      isActive: false,
      type: null,
      remoteUserId: null,
      chatId: null,
      isIncoming: false,
    });
  }, []);

  const createPeerConnection = useCallback(
    (targetId: string, chatId: string) => {
      const pc = new RTCPeerConnection(ICE_SERVERS);

      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit('ice-candidate', {
            to: targetId,
            candidate: event.candidate,
            chatId,
          });
        }
      };

      pc.ontrack = (event) => {
        const [stream] = event.streams;
        remoteStreamRef.current = stream;
        if (onRemoteStream) {
          onRemoteStream(stream);
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          cleanup();
          if (onCallEnded) onCallEnded();
        }
      };

      peerConnectionRef.current = pc;
      return pc;
    },
    [socket, onRemoteStream, onCallEnded, cleanup]
  );

  const getMediaStream = useCallback(async (type: CallType): Promise<MediaStream> => {
    // Check if media devices are supported
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Media devices not supported in this browser. Please use a modern browser with camera/microphone support.');
    }
    
    const constraints: MediaStreamConstraints = {
      audio: true,
      video: type === 'video' ? { width: 1280, height: 720 } : false,
    };
    
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      // Provide more specific error messages for common permission issues
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          throw new Error('Camera/microphone permission denied. Please allow access in your browser settings.');
        }
        if (err.name === 'NotFoundError') {
          throw new Error('No camera or microphone found. Please check your device connections.');
        }
        if (err.name === 'NotReadableError') {
          throw new Error('Camera or microphone is already in use by another application.');
        }
      }
      throw err;
    }
  }, []);

  const startCall = useCallback(
    async (targetId: string, chatId: string, type: CallType) => {
      try {
        const stream = await getMediaStream(type);
        localStreamRef.current = stream;

        if (onLocalStream) {
          onLocalStream(stream);
        }

        const pc = createPeerConnection(targetId, chatId);

        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        if (socket) {
          socket.emit('call-offer', {
            to: targetId,
            from: currentUserId,
            offer,
            chatId,
            type,
          });
        }

        setCallState({
          isActive: true,
          type,
          remoteUserId: targetId,
          chatId,
          isIncoming: false,
        });

        return stream;
      } catch (err) {
        console.error('Failed to start call:', err);
        cleanup();
        throw err;
      }
    },
    [socket, currentUserId, createPeerConnection, getMediaStream, onLocalStream, cleanup]
  );

  const acceptCall = useCallback(
    async (data: IncomingCallData) => {
      const { from, type, offer, chatId } = data;

      try {
        const stream = await getMediaStream(type);
        localStreamRef.current = stream;

        if (onLocalStream) {
          onLocalStream(stream);
        }

        const pc = createPeerConnection(from, chatId);

        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        // Add any pending ICE candidates
        while (pendingCandidatesRef.current.length > 0) {
          const candidate = pendingCandidatesRef.current.shift();
          if (candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        if (socket) {
          socket.emit('call-answer', {
            to: from,
            answer,
            chatId,
          });
        }

        setCallState({
          isActive: true,
          type,
          remoteUserId: from,
          chatId,
          isIncoming: true,
        });

        if (onCallAccepted) {
          onCallAccepted();
        }

        return stream;
      } catch (err) {
        console.error('Failed to accept call:', err);
        cleanup();
        throw err;
      }
    },
    [socket, createPeerConnection, getMediaStream, onLocalStream, onCallAccepted, cleanup]
  );

  const rejectCall = useCallback(
    (targetId: string, chatId: string) => {
      if (socket) {
        socket.emit('call-reject', {
          to: targetId,
          chatId,
        });
      }
      cleanup();
    },
    [socket, cleanup]
  );

  const endCall = useCallback(
    (targetId: string, chatId: string) => {
      if (socket) {
        socket.emit('call-end', {
          to: targetId,
          chatId,
        });
      }
      cleanup();
      if (onCallEnded) {
        onCallEnded();
      }
    },
    [socket, cleanup, onCallEnded]
  );

  const toggleMute = useCallback((muted: boolean) => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
  }, []);

  const toggleVideo = useCallback((enabled: boolean) => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data: IncomingCallData) => {
      // Ignore if already in a call - use ref to avoid stale closure
      if (callStateRef.current.isActive) {
        socket.emit('call-busy', { to: data.from, chatId: data.chatId });
        return;
      }

      if (onIncomingCall) {
        onIncomingCall(data);
      }
    };

    const handleCallAccepted = async (data: { answer: RTCSessionDescriptionInit }) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(data.answer)
        );
        if (onCallAccepted) {
          onCallAccepted();
        }
      }
    };

    const handleIceCandidate = async (data: { candidate: RTCIceCandidateInit }) => {
      if (peerConnectionRef.current) {
        try {
          if (peerConnectionRef.current.remoteDescription) {
            await peerConnectionRef.current.addIceCandidate(
              new RTCIceCandidate(data.candidate)
            );
          } else {
            pendingCandidatesRef.current.push(data.candidate);
          }
        } catch (e) {
          console.error('Error adding received ICE candidate:', e);
        }
      }
    };

    const handleCallEnded = () => {
      cleanup();
      if (onCallEnded) {
        onCallEnded();
      }
    };

    const handleCallRejected = () => {
      cleanup();
      if (onCallEnded) {
        onCallEnded();
      }
    };

    socket.on('call-offer', handleIncomingCall);
    socket.on('call-answer', handleCallAccepted);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('call-end', handleCallEnded);
    socket.on('call-reject', handleCallRejected);

    return () => {
      socket.off('call-offer', handleIncomingCall);
      socket.off('call-answer', handleCallAccepted);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('call-end', handleCallEnded);
      socket.off('call-reject', handleCallRejected);
    };
    // Note: callState.isActive is intentionally excluded from deps since we use callStateRef
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, onIncomingCall, onCallAccepted, onCallEnded, cleanup]);

  // Auto-cleanup on unmount - placed after cleanup is defined
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    callState,
    localStream: localStreamRef.current,
    remoteStream: remoteStreamRef.current,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    cleanup,
  };
}
