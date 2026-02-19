'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  PaperAirplaneIcon, 
  UserCircleIcon, 
  ClockIcon,
  CheckIcon,
  FaceSmileIcon
} from '@heroicons/react/24/solid';

interface Message {
  id: string;
  senderId: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

interface ChatInterfaceProps {
  chatId: string;
  patientName: string;
}

export default function ChatInterface({ chatId, patientName }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const envUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8080';

  useEffect(() => {
    const token = localStorage.getItem('token');
    const specialistId = localStorage.getItem('userId'); // Pulling your ID for Tobi's logic

    // 🏛️ Rule #6: Connecting to Tobi's private '/chat' namespace
    const chatSocket = io(`${envUrl}/chat`, {
      auth: { token },
      transports: ['websocket'],
      query: { chatId }
    });

    chatSocket.on('connect', () => {
      console.log('✅ Chat Pulse Linked: Room', chatId);
    });

    // 🛡️ Rule #6: Listening for the incoming pulse from Tobi's Gateway
    chatSocket.on('newMessage', (payload: Message) => {
      setMessages((prev) => [...prev, payload]);
      // Auto-mark as read pulse
      chatSocket.emit('markAsRead', { messageId: payload.id });
    });

    chatSocket.on('userTyping', (data: { isTyping: boolean }) => {
      setIsTyping(data.isTyping);
    });

    setSocket(chatSocket);

    return () => {
      chatSocket.disconnect();
    };
  }, [chatId, envUrl]);

  // Scroll to bottom on new message
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !socket) return;

    const specialistId = localStorage.getItem('userId');

    // 🛡️ Rule #6: Matching Tobi's expected @MessageBody() keys
    const payload = {
      chatId,
      senderId: specialistId,
      message: inputText
    };

    socket.emit('sendMessage', payload);
    setInputText('');
  };

  return (
    <div className="flex flex-col h-[600px] md:h-[700px] bg-white dark:bg-gray-950 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden italic">
      
      {/* Header: Clinical Handshake */}
      <div className="p-6 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
        <div className="flex items-center gap-4">
          <div className="relative">
            <UserCircleIcon className="w-12 h-12 text-gray-300" />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
          </div>
          <div>
            <h3 className="text-sm font-black text-black dark:text-white uppercase tracking-tighter">{patientName}</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Consultation</p>
          </div>
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[url('/grid-light.svg')] dark:bg-[url('/grid-dark.svg')] bg-center">
        {messages.map((msg, index) => {
          const isMe = msg.senderId === localStorage.getItem('userId');
          return (
            <div key={msg.id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] md:max-w-[70%] p-4 rounded-[1.8rem] ${
                isMe 
                ? 'bg-black text-white rounded-tr-none' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-none'
              }`}>
                <p className="text-xs font-medium leading-relaxed">{msg.message}</p>
                <div className="flex items-center justify-end gap-1 mt-2">
                  <span className="text-[8px] font-black uppercase opacity-40 italic">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {isMe && <CheckIcon className={`w-3 h-3 ${msg.isRead ? 'text-[#FF7A59]' : 'text-gray-500'}`} />}
                </div>
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-50 dark:bg-gray-900 px-4 py-2 rounded-full flex gap-1">
              <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" />
              <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Area: Balanced View */}
      <form onSubmit={handleSendMessage} className="p-6 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-50 dark:border-gray-800">
        <div className="relative flex items-center gap-3">
          <div className="flex-1 relative">
            <input 
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type clinical observation..."
              className="w-full bg-white dark:bg-gray-800 text-black dark:text-white text-xs font-bold py-4 px-6 pr-12 rounded-2xl border border-gray-100 dark:border-gray-700 focus:outline-none focus:border-[#FF7A59] transition-all"
            />
            <FaceSmileIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 hover:text-[#FF7A59] cursor-pointer transition-colors" />
          </div>
          <button 
            type="submit"
            className="p-4 bg-black dark:bg-[#FF7A59] text-white rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}