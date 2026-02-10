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
  const { id: chatId } = useParams();
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [isVerified, setIsVerified] = useState(false);
  const [isReferralOpen, setIsReferralOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [specialistId, setSpecialistId] = useState<string | null>(null);

  useEffect(() => {
    // 🛡️ Rule #5: Specialist Identity Handshake
    const status = localStorage.getItem('specialistStatus');
    const storedId = localStorage.getItem('specialistId');
    
    if (status === 'verified') setIsVerified(true);
    if (storedId) setSpecialistId(storedId);

    // 2. Fetch Chat History
    async function loadHistory() {
      try {
        // Rule #3: Consistent path mapping to ChatController
        const res = await fetch(`${API_URL}/chats/${chatId}/messages`);
        const data = await res.json();
        if (data.succeeded && data.data) {
          setMessages(data.data);
        }
      } catch (err) {
        console.error("Clinical Sync Error:", err);
      } finally {
        setIsLoading(false);
      }
    }

    if (chatId) loadHistory();

    // 3. Initialize Neural Link (Socket.io)
    const socketInstance = io(SOCKET_URL, {
      transports: ['websocket'],
      secure: true
    });

    socketInstance.on('connect', () => {
      socketInstance.emit('joinRoom', { roomId: chatId });
      console.log('✅ Connected to Case Room:', chatId);
    });

    socketInstance.on('messageReceived', (payload: any) => {
      setMessages((prev) => [...prev, { 
        ...payload, 
        createdAt: new Date() 
      }]);
    });

    setSocket(socketInstance);

    return () => { socketInstance.disconnect(); };
  }, [chatId, API_URL, SOCKET_URL]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !socket || !isVerified || !specialistId) return;

    const payload = { 
      chatId, 
      senderId: specialistId, 
      message: input,
      timestamp: new Date()
    };

    // Rule #5: Emit to the backend gateway
    socket.emit('sendMessage', payload);
    
    // Optimistic UI update
    setMessages((prev) => [...prev, {
      id: Math.random().toString(),
      senderId: specialistId,
      message: input,
      isRead: false,
      createdAt: new Date()
    }]);
    
    setInput('');
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-140px)] max-w-7xl mx-auto overflow-hidden bg-white dark:bg-gray-900 md:rounded-[3.5rem] border border-gray-100 dark:border-gray-800 shadow-2xl relative text-left italic">
        
        {/* Verification Guard */}
        {!isVerified && (
          <div className="absolute inset-0 z-[60] backdrop-blur-xl bg-white/40 dark:bg-gray-950/40 flex items-center justify-center p-6 text-center">
            <div className="bg-white dark:bg-gray-900 p-10 rounded-[3rem] shadow-2xl max-w-md border border-gray-100 dark:border-gray-800 animate-in zoom-in duration-300">
              <ShieldCheckIcon className="w-16 h-16 text-[#FF7A59] animate-pulse mx-auto mb-6" />
              <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Identity Vetting</h3>
              <p className="text-[10px] text-gray-500 font-black mt-4 uppercase tracking-widest leading-loose">
                Complete Academy modules to unlock live clinical exchange protocols and triage patients.
              </p>
              <button onClick={() => router.push('/training')} className="mt-8 w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">
                Open Academy
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-b border-gray-100 dark:border-gray-700 p-4 md:px-10 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <Link href="/consultation" className="p-2.5 bg-gray-50 dark:bg-gray-700 rounded-2xl hover:text-[#FF7A59] transition-colors">
              <ChevronLeftIcon className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#FF7A59]/10 rounded-xl flex items-center justify-center">
                <ChatBubbleLeftRightIcon className="w-6 h-6 text-[#FF7A59]" />
              </div>
              <div>
                <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none italic">Clinical Exchange</h2>
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">Status: Neural Link Active</p>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setIsReferralOpen(true)}
            className="bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#FF7A59] hover:text-white transition-all shadow-sm active:scale-95 italic"
          >
            Generate Referral
          </button>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 bg-gray-50/30 dark:bg-gray-950/30">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20">
               <ArrowPathIcon className="w-8 h-8 animate-spin mb-4 text-[#FF7A59]" />
               <p className="text-[10px] font-black uppercase tracking-widest italic">Hydrating Record...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-10 grayscale">
              <ChatBubbleLeftRightIcon className="w-16 h-16 mb-4" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] italic">No triage data recorded.</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.senderId === specialistId ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] md:max-w-[60%] p-5 rounded-[2rem] shadow-sm ${
                  msg.senderId === specialistId 
                    ? 'bg-black text-white rounded-tr-none' 
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-tl-none border border-gray-100 dark:border-gray-700'
                }`}>
                  <p className="text-sm font-bold leading-relaxed italic">{msg.message}</p>
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

        {/* Footer Input */}
        <div className="p-4 md:p-8 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
          <div className="max-w-5xl mx-auto flex items-center gap-4">
            <button className="p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl text-gray-400 hover:text-[#FF7A59] transition-colors">
              <PhotoIcon className="w-6 h-6" />
            </button>
            <input 
              type="text"
              value={input}
              disabled={!isVerified}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isVerified ? "Enter clinical response..." : "Clinical messaging locked..."}
              className="flex-1 bg-gray-50 dark:bg-gray-700 border-none rounded-[1.75rem] px-6 py-4 text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-[#FF7A59] outline-none shadow-inner italic"
            />
            <button 
              onClick={handleSend}
              disabled={!isVerified}
              className="p-5 bg-[#FF7A59] text-white rounded-2xl active:scale-95 shadow-lg shadow-[#FF7A59]/20 transition-transform"
            >
              <PaperAirplaneIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      <ReferralGenerator 
        patientName="Active Case"
        patientId={Array.isArray(chatId) ? chatId[0] : chatId || ''}
        isOpen={isReferralOpen}
        onClose={() => setIsReferralOpen(false)}
      />
    </DashboardLayout>
  );
}