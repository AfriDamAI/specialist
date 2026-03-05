'use client';

import { useRef, useEffect, useState } from 'react';
import {
  PhoneXMarkIcon,
  VideoCameraIcon,
  MicrophoneIcon,
  PhoneIcon,
} from '@heroicons/react/24/solid';
import {
  VideoCameraSlashIcon,
} from '@heroicons/react/24/outline';
import { CallType } from '../hooks/useCall';

interface CallOverlayProps {
  isActive: boolean;
  type: CallType;
  patientName: string;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onEndCall: () => void;
  onToggleMute?: (muted: boolean) => void;
  onToggleVideo?: (enabled: boolean) => void;
}

export default function CallOverlay({
  isActive,
  type,
  patientName,
  localStream,
  remoteStream,
  onEndCall,
  onToggleMute,
  onToggleVideo,
}: CallOverlayProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [isPictureInPicture, setIsPictureInPicture] = useState(false);

  // Connect local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
    return () => {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
    };
  }, [localStream]);

  // Connect remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    return () => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    };
  }, [remoteStream]);

  // Call duration timer
  useEffect(() => {
    if (!isActive) {
      setCallDuration(0);
      return;
    }

    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    onToggleMute?.(newMutedState);
  };

  const handleToggleVideo = () => {
    const newVideoState = !isVideoEnabled;
    setIsVideoEnabled(newVideoState);
    onToggleVideo?.(newVideoState);
  };

  if (!isActive) return null;

  const isVideoCall = type === 'video';
  const hasRemoteStream = remoteStream && remoteStream.getTracks().length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {patientName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </span>
            </div>
            <div>
              <h3 className="text-white font-medium">{patientName}</h3>
              <p className="text-gray-300 text-sm">
                {hasRemoteStream ? formatDuration(callDuration) : 'Connecting...'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isVideoCall ? (
              <VideoCameraIcon className="w-5 h-5 text-white" />
            ) : (
              <PhoneIcon className="w-5 h-5 text-white" />
            )}
          </div>
        </div>
      </div>

      {/* Video Area */}
      {isVideoCall ? (
        <div className="relative flex-1 flex items-center justify-center bg-gray-900">
          {/* Remote Video (Full Screen) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`w-full h-full object-cover ${hasRemoteStream ? 'block' : 'hidden'}`}
          />

          {/* Placeholder when no remote stream */}
          {!hasRemoteStream && (
            <div className="flex flex-col items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-gray-800 flex items-center justify-center mb-4">
                <span className="text-white font-bold text-4xl">
                  {patientName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </span>
              </div>
              <p className="text-gray-400">Connecting...</p>
            </div>
          )}

          {/* Local Video (Picture-in-Picture) */}
          <div
            className={`absolute bottom-24 right-4 rounded-2xl overflow-hidden shadow-lg border-2 border-white/20 transition-all duration-300 ${
              isPictureInPicture ? 'w-48 h-64' : 'w-32 h-44'
            }`}
          >
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isVideoEnabled ? 'block' : 'hidden'}`}
            />
            {!isVideoEnabled && (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <VideoCameraSlashIcon className="w-8 h-8 text-gray-500" />
              </div>
            )}
            <button
              onClick={() => setIsPictureInPicture(!isPictureInPicture)}
              className="absolute top-2 right-2 p-1 bg-black/50 rounded-lg text-white hover:bg-black/70 transition-colors text-xs"
            >
              {isPictureInPicture ? 'Small' : 'Large'}
            </button>
          </div>
        </div>
      ) : (
        // Voice Call UI
        <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#FF7A59] to-[#FF5722] flex items-center justify-center mb-6 shadow-2xl animate-pulse">
            <span className="text-white font-bold text-4xl">
              {patientName
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </span>
          </div>
          <h3 className="text-white text-2xl font-semibold mb-2">{patientName}</h3>
          <p className="text-gray-400">
            {hasRemoteStream ? formatDuration(callDuration) : 'Connecting...'}
          </p>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent">
        <div className="flex items-center justify-center gap-6">
          {/* Mute Button */}
          <button
            onClick={handleToggleMute}
            className={`p-4 rounded-full transition-colors ${
              isMuted
                ? 'bg-red-500 text-white'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            }`}
          >
            <MicrophoneIcon className="w-6 h-6" />
          </button>

          {/* End Call Button */}
          <button
            onClick={onEndCall}
            className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors shadow-lg"
          >
            <PhoneXMarkIcon className="w-8 h-8" />
          </button>

          {/* Video Toggle (only for video calls) */}
          {isVideoCall && (
            <button
              onClick={handleToggleVideo}
              className={`p-4 rounded-full transition-colors ${
                !isVideoEnabled
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              {isVideoEnabled ? (
                <VideoCameraIcon className="w-6 h-6" />
              ) : (
                <VideoCameraSlashIcon className="w-6 h-6" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
