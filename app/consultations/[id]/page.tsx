'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  PaperAirplaneIcon, 
  PhotoIcon, 
  ChevronLeftIcon,
  CheckIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  UserCircleIcon
} from '@heroicons/react/24/solid';
import Link from 'next/link';

interface ChatMessage {
  id: string;
  senderId: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

export default function SpecialistChatPage() {
  const { id: chatId } = useParams();
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Rule #5: Specialist Verification State
  const [isVerified, setIsVerified] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  
  const specialistId = "specialist_ogirima"; // Linked to your profile

  useEffect(() => {
    // Check Global Verification Status
    const status = localStorage.getItem('specialistStatus');
    if (status === 'verified') setIsVerified(true);

    // Rule #3: Connect to Tobi's Backend Socket
    const socketInstance = io('http://172.20.10.6:5000', {
      transports: ['websocket'],
      query: { chatId }
    });

    socketInstance.on('newMessage', (payload: any) => {
      setMessages((prev) => [...prev, { 
        ...payload, 
        createdAt: new Date(payload.createdAt) 
      }]);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [chatId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !socket || !isVerified) return;

    // Rule #3: Emit to Tobi's 'sendMessage' gateway seen in logs
    socket.emit('sendMessage', { 
      chatId, 
      senderId: specialistId, 
      message: input 
    });
    
    setInput('');
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-140px)] max-w-7xl mx-auto overflow-hidden bg-white dark:bg-gray-900 md:rounded-[3.5rem] border border-gray-100 dark:border-gray-800 shadow-2xl relative">
        
        {/* Rule #5: Security Lock Overlay */}
        {!isVerified && (
          <div className="absolute inset-0 z-[60] backdrop-blur-xl bg-white/40 dark:bg-gray-950/40 flex items-center justify-center p-6">
            <div className="bg-white dark:bg-gray-900 p-10 rounded-[3rem] shadow-2xl text-center max-w-md border border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in duration-300">
              <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldCheckIcon className="w-10 h-10 text-amber-500 animate-pulse" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Session Encrypted</h3>
              <p className="text-xs text-gray-500 font-bold mt-4 leading-relaxed uppercase tracking-wide">
                As a specialist "Under Review," communication is locked until your medical license vetting is complete in the Academy.
              </p>
              <button 
                onClick={() => router.push('/training')}
                className="mt-8 w-full bg-[#FF7A59] text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] active:scale-95 transition-all shadow-lg shadow-[#FF7A59]/20"
              >
                Go to Academy
              </button>
            </div>
          </div>
        )}

        {/* Chat Header */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-b border-gray-100 dark:border-gray-700 p-4 md:px-10 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <Link href="/consultations" className="p-2.5 bg-gray-50 dark:bg-gray-700 rounded-2xl hover:text-[#FF7A59] transition-colors">
              <ChevronLeftIcon className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#FF7A59]/10 rounded-xl flex items-center justify-center">
                <UserCircleIcon className="w-7 h-7 text-[#FF7A59]" />
              </div>
              <div>
                <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter">Live Patient Case</h2>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Secure Connection</p>
                </div>
              </div>
            </div>
          </div>
          <button className="bg-gray-900 dark:bg-white text-white dark:text-black px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#FF7A59] transition-all active:scale-95">
            Finalize Case
          </button>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 bg-gray-50/30 dark:bg-gray-950/30">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20 grayscale">
              <LockClosedIcon className="w-16 h-16 mb-4" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em]">Establishing neural link...</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.senderId === specialistId ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                <div className={`max-w-[80%] md:max-w-[60%] p-5 rounded-[2rem] ${
                  msg.senderId === specialistId 
                    ? 'bg-black text-white rounded-tr-none' 
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-tl-none border border-gray-100 dark:border-gray-700 shadow-sm'
                }`}>
                  <p className="text-sm font-bold leading-relaxed">{msg.message}</p>
                  <div className={`flex items-center gap-1 mt-2 ${msg.senderId === specialistId ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[8px] font-black opacity-40 uppercase">
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

        {/* Message Input Station */}
        <div className="p-4 md:p-8 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
          <div className="max-w-5xl mx-auto flex items-center gap-4">
            <button className="p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl text-gray-400 hover:text-[#FF7A59] transition-colors">
              <PhotoIcon className="w-6 h-6" />
            </button>
            <div className="flex-1 relative">
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your clinical diagnosis..."
                className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-[1.75rem] px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-[#FF7A59] transition-all"
              />
            </div>
            <button 
              onClick={handleSend}
              className="p-5 bg-[#FF7A59] text-white rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#FF7A59]/20"
            >
              <PaperAirplaneIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}