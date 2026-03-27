'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Message, FileAttachment } from '../types/chat';
import { PaperClipIcon, DocumentIcon, PhotoIcon, VideoCameraIcon, MusicalNoteIcon, PhoneIcon } from '@heroicons/react/24/outline';
import ImageModal from '@/components/ImageModal';

interface MessageBubbleProps {
  message: Message;
}

function getFileIcon(type: FileAttachment['type']) {
  switch (type) {
    case 'image':
      return <PhotoIcon className="w-5 h-5" />;
    case 'video':
      return <VideoCameraIcon className="w-5 h-5" />;
    case 'audio':
      return <MusicalNoteIcon className="w-5 h-5" />;
    default:
      return <DocumentIcon className="w-5 h-5" />;
  }
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function FileAttachmentPreview({ attachment }: { attachment: FileAttachment }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (attachment.type === 'image') {
    return (
      <div className="mt-2 rounded-lg overflow-hidden relative group">
        <div 
          className="cursor-pointer transition-transform active:scale-95 relative"
          onClick={() => setIsModalOpen(true)}
        >
          <Image
            src={attachment.url}
            alt={attachment.name}
            width={200}
            height={150}
            className="max-w-full h-auto max-h-48 object-cover rounded-lg"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <PhotoIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        <ImageModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          imageUrl={attachment.url} 
          altText={attachment.name} 
        />

        <a
          href={attachment.url}
          download={attachment.name}
          className="flex items-center gap-2 mt-1 text-xs text-white/70 hover:text-white underline"
        >
          <PaperClipIcon className="w-3 h-3" />
          Download
        </a>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <a
        href={attachment.url}
        download={attachment.name}
        className="flex items-center gap-3 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
      >
        <div className="flex-shrink-0">
          {getFileIcon(attachment.type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{attachment.name}</p>
          <p className="text-xs text-white/60">{formatFileSize(attachment.size)}</p>
        </div>
      </a>
    </div>
  );
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isDoctor = message.sender === 'doctor';

  const date = new Date(message.timestamp);
  const formattedTime = isNaN(date.getTime())
    ? '--:--'
    : date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

  return (
    <div className={`flex ${isDoctor ? 'justify-end' : 'justify-start'} mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div className={`flex flex-col ${isDoctor ? 'items-end' : 'items-start'} max-w-[80%]`}>
        <div
          className={`px-4 py-3 rounded-2xl shadow-sm ${message.text === 'Missed Call'
            ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 w-full flex flex-col items-center gap-2'
            : isDoctor
              ? 'bg-[#FF7A59] text-white rounded-tr-none'
              : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white rounded-tl-none'
            }`}
        >
          {message.text === 'Missed Call' && (
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-800/40 flex items-center justify-center">
              <PhoneIcon className="w-5 h-5" />
            </div>
          )}
          {message.text && (
            <p className={`text-[13.5px] font-medium leading-relaxed whitespace-pre-wrap ${message.text === 'Missed Call' ? 'font-black uppercase italic tracking-widest' : ''}`}>
              {message.text}
            </p>
          )}

          {message.attachment && (
            <FileAttachmentPreview attachment={message.attachment} />
          )}
        </div>

        <div className={`flex items-center gap-1.5 mt-1 mx-1`}>
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
            {formattedTime}
          </span>
          {isDoctor && (
            <span className={`text-[10px] ${message.read ? 'text-[#FF7A59]' : 'text-gray-300'}`}>
              {message.read ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}



/****
 * Code Review Summary
Changes Overview
This PR adds voice/video call functionality and file attachment support to the chat application across 5 files.

Issues Found
Severity	File:Line	Issue
CRITICAL	ConversationView.tsx:69	File upload does not actually attach files to messages
WARNING	ConversationView.tsx:69-80	handleEndCall() ends entire chat session instead of just the call
WARNING	ConversationView.tsx:53-68	FileReader.readAsDataURL loads entire file into memory - memory inefficiency
WARNING	MessageInput.tsx	No file size/type validation before upload
SUGGESTION	MessageBubble.tsx:43	Image component may need domain config for external URLs
Detailed Findings
1. File Upload Not Functional (CRITICAL - 95%)

File: app/chat/components/ConversationView.tsx:53-68
Problem: The handleFileUpload function reads the file as a base64 data URL, logs it, and inserts placeholder text [File: filename] into the input. It never creates a Message with an attachment property. The sendMessage function in useChat.ts doesn't accept attachments.
Suggestion: Pass the attachment data to a modified sendMessage function that can create messages with attachments.
2. End Call Ends Session (WARNING - 90%)

File: ConversationView.tsx:69
Problem: When handleEndCall() is called (when user clicks "End Call" during an active call), it calls onEndSession() which ends the entire chat session, not just the call. This is incorrect - ending a call should not end the chat session.
Suggestion: Remove onEndSession() from handleEndCall, or only call it when appropriate.
3. Memory Inefficiency (WARNING - 85%)

File: ConversationView.tsx:56-60
Problem: Using FileReader.readAsDataURL loads the entire file into memory as a base64 string. For large video/audio files, this causes memory issues.
Suggestion: Use streaming upload to a server endpoint, or at minimum add file size limits before reading.
4. No File Validation (WARNING - 80%)

File: MessageInput.tsx:36-40
Problem: The file input accepts accept="image/*,.pdf,.doc,.docx,.txt,.mp4,.mp3,.wav" but there's no validation for maximum file size or explicit type checking after selection.
Suggestion: Add file size limit (e.g., 10MB) and explicit type validation.
Recommendation
NEEDS CHANGES

The file upload feature is not functional (critical) and the call end logic incorrectly terminates chat sessions.

Fix file upload to actually create message attachmentscode
Fix handleEndCall to not end chat sessioncode
Fix all issues (upload, call end, validation)
 */