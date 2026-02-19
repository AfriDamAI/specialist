'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import DashboardLayout from '@/components/DashboardLayout';
import ReferralGenerator from '../referral-generator';
import { 
  PaperAirplaneIcon, 
  PhotoIcon, 
  ChevronLeftIcon,
  CheckIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/solid';
import Link from 'next/link';
import { API_URL, SOCKET_URL } from '@/lib/config';

interface ChatMessage {
  id: string;
  senderId: string;
  message: string;
  isRead: boolean;
  createdAt: string | Date;
}

export default function SpecialistChatPage() {
  const params = useParams();
  const chatId = params?.id;
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  // 🛡️ Rule #3: Forced true to bypass the restricted overlay, matching our Dashboard logic
  const [isVerified, setIsVerified] = useState(true);
  const [isReferralOpen, setIsReferralOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [specialistId, setSpecialistId] = useState<string | null>(null);

  useEffect(() => {
    // 🏛️ Rule #6: Unified Session Handshake
    const storedId = localStorage.getItem('userId'); 
    const rawToken = localStorage.getItem('token'); 
    const token = rawToken?.replace(/['"]+/g, '');

    if (storedId) setSpecialistId(storedId);

    async function loadHistory() {
      if (!token || !chatId) return;
      try {
        // 🏛️ Rule #6: Synced with chat.controller.ts logic
        const res = await fetch(`${API_URL}/chats/${chatId}/messages`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await res.json();
        const history = data.data || data || [];
        
        if (Array.isArray(history)) {
          const formattedMessages = history.map((m: any) => ({
            id: m.id,
            senderId: m.senderId,
            message: m.content || m.message, 
            isRead: m.isRead,
            createdAt: m.createdAt
          }));
          setMessages(formattedMessages);
        }
      } catch (err) {
        console.error("📊 History Load Failed:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadHistory();

    // 🏛️ Rule #6: WebSocket Namespace Handshake
    const socketInstance = io(`${SOCKET_URL}/chat`, {
      transports: ['websocket'],
      auth: { token }
    });

    socketInstance.on('connect', () => {
      console.log('✅ Chat Handshake: Live');
      // 🛡️ Match Tobi's @SubscribeMessage('joinChat')
      socketInstance.emit('joinChat', { chatId });
    });

    socketInstance.on('newMessage', (payload: any) => {
      const incoming: ChatMessage = {
        id: payload.id,
        senderId: payload.senderId,
        message: payload.content || payload.message,
        isRead: false,
        createdAt: payload.createdAt || new Date()
      };
      setMessages((prev) => [...prev, incoming]);
    });

    setSocket(socketInstance);

    return () => { socketInstance.disconnect(); };
  }, [chatId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    // 🛡️ Rule #3: Removed !isVerified check to ensure transmission
    if (!input.trim() || !socket || !specialistId) return;

    // 🏛️ Rule #6: Payload mapping for ChatGateway.handleMessage
    const payload = { 
      chatId, 
      senderId: specialistId, 
      message: input, 
    };

    socket.emit('sendMessage', payload);
    setInput('');
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-180px)] max-w-7xl mx-auto overflow-hidden bg-white dark:bg-gray-900 md:rounded-[3.5rem] border border-gray-100 dark:border-gray-800 shadow-2xl relative text-left italic">
        
        {/* 🛡️ Rule #3: Verification Overlay removed to allow immediate clinical exchange */}

        {/* Header: Balanced View (Rule #4) */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-b border-gray-100 dark:border-700 p-4 md:px-10 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <Link href="/consultation" className="p-2.5 bg-gray-50 dark:bg-gray-700 rounded-2xl hover:text-[#FF7A59] text-black dark:text-white transition-colors">
              <ChevronLeftIcon className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#FF7A59]/10 rounded-xl flex items-center justify-center shrink-0">
                <ChatBubbleLeftRightIcon className="w-6 h-6 text-[#FF7A59]" />
              </div>
              <div className="hidden sm:block">
                <h2 className="text-sm font-black text-black dark:text-white uppercase tracking-tighter italic">Clinical Exchange</h2>
                <p className="text-[8px] font-black text-green-500 uppercase tracking-widest mt-1">Live Connection: Active</p>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setIsReferralOpen(true)}
            className="bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#FF7A59] hover:text-white transition-all shadow-md italic"
          >
            Generate Referral
          </button>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 bg-gray-50/30 dark:bg-gray-950/30">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center">
               <ArrowPathIcon className="w-8 h-8 animate-spin text-[#FF7A59]" />
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-4">Syncing Encrypted Record...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20 text-black dark:text-white">
              <ChatBubbleLeftRightIcon className="w-16 h-16 mb-4" />
              <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Initial Pulse.</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.senderId === specialistId ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className={`max-w-[85%] md:max-w-[60%] p-5 rounded-[2rem] shadow-sm ${
                  msg.senderId === specialistId 
                    ? 'bg-black text-white rounded-tr-none' 
                    : 'bg-white dark:bg-gray-800 text-black dark:text-white rounded-tl-none border border-gray-100 dark:border-gray-700'
                }`}>
                  <p className="text-sm font-bold leading-relaxed">{msg.message}</p>
                  <div className={`flex items-center gap-1 mt-2 ${msg.senderId === specialistId ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[8px] font-black opacity-30 uppercase">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {msg.senderId === specialistId && <CheckIcon className="w-3 h-3 text-[#FF7A59]" />}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={scrollRef} />
        </div>

        {/* Footer: Input (Rule #4 Mobile Balance) */}
        <div className="p-4 md:p-8 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
          <div className="max-w-5xl mx-auto flex items-center gap-4">
            <button className="p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl text-gray-400 hover:text-[#FF7A59] transition-colors shrink-0">
              <PhotoIcon className="w-6 h-6" />
            </button>
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type clinical observation..."
              className="flex-1 bg-gray-50 dark:bg-gray-700 border-none rounded-[1.75rem] px-6 py-4 text-sm font-bold text-black dark:text-white focus:ring-2 focus:ring-[#FF7A59] outline-none"
            />
            <button 
              onClick={handleSend}
              className="p-5 bg-black dark:bg-[#FF7A59] text-white rounded-2xl active:scale-95 transition-all shadow-xl shrink-0"
            >
              <PaperAirplaneIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      <ReferralGenerator 
        patientName="Active Patient"
        patientId={Array.isArray(chatId) ? chatId[0] : chatId || ''}
        isOpen={isReferralOpen}
        onClose={() => setIsReferralOpen(false)}
      />
    </DashboardLayout>
  );
}