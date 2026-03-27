'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MicrophoneIcon, StopIcon, TrashIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

interface VoiceRecorderProps {
  onSend: (blob: Blob, duration: number) => void;
  onCancel: () => void;
}

export default function VoiceRecorder({ onSend, onCancel }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    startRecording();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const actualDuration = (Date.now() - startTimeRef.current) / 1000;
        // Minimum 0.5s recording to avoid accidentally empty notes
        if (actualDuration > 0.5) {
          onSend(blob, Math.max(1, Math.floor(actualDuration)));
        } else {
          onCancel();
        }
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      startTimeRef.current = Date.now();
      setIsRecording(true);
      
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Failed to start recording:", err);
      onCancel();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-4 bg-[#FF7A59]/10 dark:bg-[#FF7A59]/5 px-4 py-2.5 rounded-2xl w-full border border-[#FF7A59]/10 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center gap-3 flex-1">
        <div className="relative flex items-center justify-center">
            <div className="absolute w-3 h-3 bg-[#FF7A59] rounded-full animate-ping opacity-50" />
            <div className="w-2.5 h-2.5 bg-[#FF7A59] rounded-full" />
        </div>
        <span className="text-sm font-bold font-mono text-gray-900 dark:text-white tabular-nums">
            {formatDuration(duration)}
        </span>
        <div className="hidden md:block flex-1 h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div 
                className="h-full bg-[#FF7A59] transition-all duration-1000 ease-linear"
                style={{ width: `${Math.min((duration / 60) * 100, 100)}%` }}
            />
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button 
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-full transition-all active:scale-90"
          title="Discard recording"
        >
          <TrashIcon className="w-5 h-5" />
        </button>
        <button 
          onClick={stopRecording}
          className="group flex items-center gap-2 px-4 py-2 bg-[#FF7A59] text-white rounded-xl shadow-lg shadow-[#FF7A59]/20 hover:bg-[#e66a4a] transition-all active:scale-95"
          title="Finish and send"
        >
          <span className="text-xs font-black uppercase tracking-widest hidden sm:inline">Send</span>
          <PaperAirplaneIcon className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}
