'use client';

import { Message } from '../types/chat';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isDoctor = message.sender === 'doctor';

  return (
    <div className={`flex ${isDoctor ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[70%] px-4 py-3 rounded-2xl ${
          isDoctor
            ? 'bg-[#FF7A59] text-white rounded-br-md'
            : 'bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white rounded-bl-md'
        }`}
      >
        <p className="text-sm">{message.text}</p>
        <div className={`flex items-center gap-2 mt-1 ${isDoctor ? 'justify-end' : 'justify-start'}`}>
          <span className={`text-[10px] ${isDoctor ? 'text-white/70' : 'text-gray-400'}`}>
            {message.timestamp}
          </span>
          {isDoctor && message.read && (
            <span className="text-[10px] text-white/70">✓✓</span>
          )}
        </div>
      </div>
    </div>
  );
}
