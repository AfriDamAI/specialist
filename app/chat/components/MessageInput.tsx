'use client';

import { useRef, useState } from 'react';
import { PaperAirplaneIcon, PaperClipIcon, XMarkIcon, MicrophoneIcon } from '@heroicons/react/24/solid';
import VoiceRecorder from './VoiceRecorder';

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (text: string, file: File | null) => void;
  disabled?: boolean;
  isUploading?: boolean;
}

export default function MessageInput({ 
  value, 
  onChange, 
  onSend, 
  disabled,
  isUploading
}: MessageInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSend = () => {
    if ((!value.trim() && !selectedFile) || disabled || isUploading) return;
    
    onSend(value, selectedFile);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const cancelFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleVoiceSend = (blob: Blob, duration: number) => {
    const file = new File([blob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' });
    onSend('', file);
    setIsRecording(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
      {/* File Preview */}
      {selectedFile && (
        <div className="mb-3 flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
          <div className="flex-1 flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FF7A59]/10 rounded-lg flex items-center justify-center">
              <PaperClipIcon className="w-5 h-5 text-[#FF7A59]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          </div>
          <button
            onClick={cancelFile}
            disabled={isUploading}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      {isRecording ? (
        <VoiceRecorder 
          onSend={handleVoiceSend} 
          onCancel={() => setIsRecording(false)} 
        />
      ) : (
        <div className="flex items-end gap-3">
          {/* File Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || !!selectedFile}
            className="flex items-center justify-center min-w-[3rem] h-12 rounded-2xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Attach file"
          >
            <PaperClipIcon className="w-6 h-6" />
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt,.mp4,.mp3,.wav,.webm"
          />

          <button
            onClick={() => setIsRecording(true)}
            disabled={disabled || !!selectedFile}
            className="flex items-center justify-center min-w-[3rem] h-12 rounded-2xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Record voice note"
          >
            <MicrophoneIcon className="w-6 h-6" />
          </button>

          <div className="flex-1">
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={disabled ? 'Session ended' : 'Type a message...'}
              disabled={disabled}
              rows={1}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:border-[#FF7A59] focus:outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={disabled || isUploading || (!value.trim() && !selectedFile)}
            className="p-3 bg-[#FF7A59] text-white rounded-2xl hover:bg-[#e66a4a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[3.5rem] flex items-center justify-center"
          >
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <PaperAirplaneIcon className="w-6 h-6" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
