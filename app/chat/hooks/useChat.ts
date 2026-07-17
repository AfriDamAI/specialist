'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation'; // 🚀 Added useRouter
import { toast } from 'react-hot-toast';
import { useCall } from '@/context/CallContext';
import {
  getCurrentUserChats,
  getChatMessages,
  sendUserChatMessage,
  markMessageAsRead,
  Chat,
  Message as ApiMessage,
  Message,
  startAppointmentSession,
  endAppointmentSession,
  extendAppointmentSession,
  getAppointmentById,
  joinAppointmentSession,
  getActiveAppointmentWith,
} from '@/lib/api-client';

// Get specialistId from localStorage or decode from token
const getSpecialistId = (): string => {
  if (typeof window !== 'undefined') {
    // Check for both possible keys to ensure consistency
    const storedSpecialistId = localStorage.getItem('specialistId') || localStorage.getItem('userId');
    if (storedSpecialistId) {
      return storedSpecialistId;
    }
    
    // Ultimate Fallback: decode JWT token to rescue old sessions
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const id = payload.id || payload.sub;
        if (id) {
          // Save it back so we don't have to decode every time
          localStorage.setItem('specialistId', id);
          localStorage.setItem('userId', id);
          return id;
        }
      } catch (e) {
        console.error('Failed to decode token for specialistId fallback', e);
      }
    }
  }
  // Hardcoded fallback ONLY if totally unauthenticated
  return "cmlezbj5n0001kv013cpupouo";
};

// Unified message type that works with both API and UI
export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  sender: 'doctor' | 'patient';
  text: string;
  type: string;
  attachmentUrl?: string;
  mimeType?: string;
  fileSize?: number;
  duration?: number;
  read: boolean;
  timestamp: string;
}

// Transform API message to UI message
// Sample: { id, chatId, senderId, message, type, isRead, isDelivered, createdAt }
const transformMessage = (msg: ApiMessage, currentUserId: string): ChatMessage => ({
  id: msg.id,
  chatId: msg.chatId,
  senderId: msg.senderId,
  sender: msg.senderId === currentUserId ? 'doctor' : 'patient',
  text: msg.message || '',
  type: msg.type || 'TEXT',
  attachmentUrl: msg.attachmentUrl,
  mimeType: msg.mimeType,
  fileSize: msg.fileSize,
  duration: msg.duration,
  read: (msg as any).isRead ?? msg.read ?? false,
  timestamp: msg.createdAt || new Date().toISOString(),
});

// Transform API chat to a patient-like object for the list
interface ChatListItem {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  lastMessage?: ChatMessage;
  unreadCount: number;
  appointmentId?: string;
  sessionActive: boolean;
  appointmentStatus?: string;
  profile?: any;
  meetingLink?: string;
}

export function useChat(initialChatId?: string) {
  const router = useRouter(); // 🚀 Initialized router
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatListItem | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isJoiningMeet, setIsJoiningMeet] = useState(false);
  const [currentMeetLink, setCurrentMeetLink] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Ref to always have the latest selectedChat inside socket listeners (fixes stale closure)
  const selectedChatRef = useRef<ChatListItem | null>(null);
  // The last status fetchAppointmentStatus itself confirmed for a given chat, and a
  // differing reading awaiting a second consecutive confirmation (see fetchAppointmentStatus)
  const lastConfirmedStatusRef = useRef<{ chatId: string; status: string } | null>(null);
  const pendingStatusRef = useRef<{ chatId: string; status: string } | null>(null);

  // Use socket from unified CallContext
  const { socket } = useCall();

  // Update connection status
  useEffect(() => {
    if (!socket) {
      setIsConnected(false);
      return;
    }
    
    setIsConnected(socket.connected);
    
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [socket]);

  // Fetch user's chats on mount
  useEffect(() => {
    fetchUserChats();
  }, []);

  // Handle initial chatId from props — select it once, the first time chats load.
  // This used to depend on `chats` directly, so it re-ran on every 3s poll refresh
  // and re-selected the chat from the bulk list's own (less reliable) session
  // status, stomping over whatever fetchAppointmentStatus had just carefully
  // resolved for the open conversation — the actual cause of the composer and the
  // "Session Ended" pill flip-flopping. Guarding on `!selectedChat` makes this a
  // one-time initial selection instead of a perpetual override.
  useEffect(() => {
    if (initialChatId && !selectedChat && chats.length > 0) {
      const chat = chats.find(c => c.id === initialChatId);
      if (chat) {
        setSelectedChat(chat);
      }
    }
  }, [initialChatId, chats, selectedChat]);

  // Keep ref in sync with state
  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  // Fetch messages when chat is selected
  useEffect(() => {
    if (selectedChat) {
      fetchChatMessages(selectedChat.id);
      
      // Always fetch the CURRENT active appointment to avoid stale chat.appointmentId
      if (selectedChat.meetingLink) setCurrentMeetLink(selectedChat.meetingLink);
      fetchAppointmentStatus(undefined, selectedChat.participantId, selectedChat.id);
    } else {
      setMessages([]);
    }
  }, [selectedChat?.id, selectedChat?.appointmentId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Listen for new messages via socket
  // Uses selectedChatRef to avoid stale closure bugs that silently drop incoming messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg: ApiMessage) => {
      const specialistId = getSpecialistId();
      
      // Skip SYSTEM messages
      if ((msg as any).type === 'SYSTEM') return;

      const transformedMsg = transformMessage(msg, specialistId);
      const currentChat = selectedChatRef.current; // Use ref — always fresh, no stale closure
      
      // Update the messages panel if this is the active chat
      if (currentChat && msg.chatId === currentChat.id) {
        setMessages(prev => {
          if (prev.find(m => m.id === msg.id)) return prev; // Avoid duplicates
          return [...prev, transformedMsg];
        });
        // Mark as read if it's from the patient
        if (msg.senderId !== specialistId) {
          markMessageAsRead(msg.id).catch(console.error);
        }
      }
      
      // Always update chat list to show latest message & unread badge
      setChats(prev => prev.map(chat => 
        chat.id === msg.chatId 
          ? { ...chat, lastMessage: transformedMsg, unreadCount: chat.id === currentChat?.id ? chat.unreadCount : chat.unreadCount + 1 }
          : chat
      ));
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('new_message', handleNewMessage);

    // Listen for meetingLinkCreated from backend broadcast
    const handleMeetingLinkCreated = (data: { appointmentId: string; meetLink: string }) => {
      const currentChat = selectedChatRef.current;
      if (data.meetLink) {
        setCurrentMeetLink(data.meetLink);
        // Also update the chat in the list
        if (currentChat) {
          setChats(prev => prev.map(c =>
            c.id === currentChat.id ? { ...c, sessionActive: true } : c
          ));
        }
        toast.success('Google Meet is ready! Click "Join Meeting" to enter.');
      }
    };

    socket.on('meetingLinkCreated', handleMeetingLinkCreated);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('new_message', handleNewMessage);
      socket.off('meetingLinkCreated', handleMeetingLinkCreated);
    };
  }, [socket]); // No longer depends on selectedChat — uses ref instead

  // Fetch all user chats
  const fetchUserChats = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const response = await getCurrentUserChats() as any;
      
      // Handle API response - data might be in resultData or directly in response
      const userChats = response?.resultData || response?.data || response || [];
      const specialistId = getSpecialistId();
      
      // Ensure we have an array before mapping
      if (!Array.isArray(userChats)) {
        console.warn('Unexpected response format:', response);
        setChats([]);
        if (!silent) setError(null);
        if (!silent) setIsLoading(false);
        return;
      }
      
      // Transform chats to chat list items
      // participant1Id = specialist, participant2Id = patient
      const chatListItems: ChatListItem[] = userChats.map((chat: Chat) => {
        // Get the actual patient name from participants array
        const patient = chat.participants?.find((p: any) => p.id === chat.participant2Id);
        const participantName = patient?.name || `Patient ${chat.participant2Id.slice(-4)}`;

        // Get the last message from the embedded messages array
        const chatMessages = chat.messages || [];
        const lastMsg = chatMessages.length > 0 
          ? transformMessage(chatMessages[chatMessages.length - 1] as ApiMessage, specialistId)
          : undefined;
        
        // Count unread messages (where sender is not the specialist)
        const unreadCount = chatMessages.filter(
          (m: Message) => m.senderId !== specialistId && !(m as any).isRead
        ).length;
        
          const appointmentStatus = (chat as any).appointmentStatus || (chat as any).status;
          const sessionActive = appointmentStatus === 'IN_PROGRESS';
          
          return {
            id: chat.id,
            participantId: chat.participant2Id, // patientId
            participantName: participantName,
            participantAvatar: patient?.avatar,
            lastMessage: lastMsg,
            unreadCount,
            sessionActive: sessionActive,
            appointmentId: (chat as any).appointmentId || (typeof window !== 'undefined' && localStorage.getItem('patientId') === chat.participant2Id ? localStorage.getItem('activeAppointmentId') || undefined : undefined),
            appointmentStatus: appointmentStatus,
            profile: patient?.profile,
            meetingLink: (chat as any).meetingLink,
          };
        });
      
      setChats(chatListItems);
      if (!silent) setError(null);
    } catch (err) {
      console.error('Error fetching chats:', err);
      if (!silent) setError('Failed to fetch chats.');
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  // Fetch messages for a specific chat
  const fetchChatMessages = useCallback(async (chatId: string, silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const response = await getChatMessages(chatId) as any;
      
      // Handle API response - data might be in resultData or directly in response
      const chatMessages = response?.resultData || response?.data || response || [];

      // Ensure we have an array before mapping
      if (!Array.isArray(chatMessages)) {
        console.warn('Unexpected messages response:', response);
        setMessages([]);
        if (!silent) setError(null);
        if (!silent) setIsLoading(false);
        return;
      }
      
      const transformedMessages = chatMessages.map((msg: ApiMessage) => transformMessage(msg, getSpecialistId()));
      
      // Filter out SYSTEM messages before updating UI
      const displayMessages = transformedMessages.filter(msg => msg.type !== 'SYSTEM');

      // Always update UI payload if changed
      setMessages(displayMessages);
      if (!silent) setError(null);
    } catch (err) {
      console.error('Error fetching messages:', err);
      if (!silent) setError('Failed to fetch messages.');
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  // Silent polling fallback for multi-instance Cloud Run environments
  // Fetch real-time appointment status to ensure session controls are accurate
  const fetchAppointmentStatus = useCallback(async (appointmentId?: string, otherUserId?: string, chatId?: string) => {
    try {
      // getActiveAppointmentWith is the proven source (used here since day one).
      // getAppointmentById is only a fallback for when it comes back empty —
      // "active" lookups can exclude appointments that just ended.
      let appointment = otherUserId ? await getActiveAppointmentWith(otherUserId) : null;
      if (!appointment && appointmentId) {
        try {
          appointment = await getAppointmentById(appointmentId);
        } catch {
          appointment = null;
        }
      }

      if (appointment) {
        const newStatus = appointment.status;
        // Baseline against the last value THIS function confirmed for this chat —
        // not selectedChat.appointmentStatus, which can still hold the initial,
        // less-reliable guess from the bulk /chats/me list (that guess is exactly
        // why this dedicated lookup exists). Comparing against it meant the very
        // first correct read after opening/starting a chat got held back, leaving
        // the composer disabled and the "Session Ended" pill showing on a session
        // that was actually active.
        const baseline = chatId && lastConfirmedStatusRef.current?.chatId === chatId
          ? lastConfirmedStatusRef.current.status
          : undefined;

        // Cloud Run instances can serve eventually-consistent reads, so a single
        // reading that differs from an already-established baseline may just be a
        // stale replica. Require the SAME new reading twice in a row before
        // applying a CHANGE — but always trust the first-ever read for a chat.
        let statusToApply = newStatus;
        if (baseline !== undefined && newStatus !== baseline) {
          const pending = pendingStatusRef.current;
          if (pending && pending.chatId === chatId && pending.status === newStatus) {
            statusToApply = newStatus;
            pendingStatusRef.current = null;
          } else {
            pendingStatusRef.current = chatId ? { chatId, status: newStatus } : null;
            statusToApply = baseline;
          }
        } else {
          pendingStatusRef.current = null;
        }

        if (chatId) {
          lastConfirmedStatusRef.current = { chatId, status: statusToApply };
        }

        const sessionActive = statusToApply === 'IN_PROGRESS';

        // Update the chats list
        setChats(prev => prev.map(chat =>
          (chat.appointmentId === appointment.id || chat.participantId === otherUserId)
            ? { ...chat, appointmentId: appointment.id, appointmentStatus: statusToApply, sessionActive }
            : chat
        ));

        setSelectedChat((prev) => {
          if (prev?.id === selectedChatRef.current?.id && (prev?.appointmentId === appointment.id || prev?.participantId === otherUserId)) {
            if (appointment.meetingLink) setCurrentMeetLink(appointment.meetingLink);
            return { ...prev, appointmentId: appointment.id, appointmentStatus: statusToApply, sessionActive, meetingLink: appointment.meetingLink } as ChatListItem;
          }
          return prev;
        });
      }
    } catch (err) {
      console.warn('Could not enrich chat with appointment status:', err);
    }
  }, []);

  // Ensures messages arrive even when WebSocket broadcast misses a server instance
  useEffect(() => {
    const interval = setInterval(() => {
      const currentChat = selectedChatRef.current;
      if (currentChat) {
        fetchChatMessages(currentChat.id, true);
        // Prefer the known appointment id (reflects true status incl. COMPLETED);
        // participantId stays as a fallback for the very first resolution.
        fetchAppointmentStatus(currentChat.appointmentId, currentChat.participantId, currentChat.id);
      }
      fetchUserChats(true);
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchUserChats, fetchChatMessages, fetchAppointmentStatus]);

  // Send a unified (text + optional file) message
  const sendMessage = useCallback(async (text?: string, file: File | null = null) => {
    const msgText = text || inputValue;
    if (!msgText.trim() && !file && !selectedChat) return;
    if (!selectedChat) return;

    const specialistId = getSpecialistId();
    setIsSending(true);
    
    try {
      // Determine optimistic type
      let optimisticType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE' = 'TEXT';
      if (file) {
        if (file.type.startsWith('image/')) optimisticType = 'IMAGE';
        else if (file.type.startsWith('video/')) optimisticType = 'VIDEO';
        else if (file.type.startsWith('audio/')) optimisticType = 'AUDIO';
        else optimisticType = 'FILE';
      }

      // Create optimistic message object for immediate UI feedback
      const optimisticMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        chatId: selectedChat.id,
        senderId: specialistId,
        sender: 'doctor',
        text: msgText,
        type: optimisticType as any,
        read: true,
        timestamp: new Date().toISOString(),
      };
      
      // Add message instantly to UI
      setMessages(prev => [...prev, optimisticMessage]);
      setInputValue('');

      const newMessage = await sendUserChatMessage(
        selectedChat.id,
        specialistId,
        msgText,
        optimisticType,
        '', 
        '',
        0,
        0,
        file || undefined // Pass file directly
      );
      
      if (newMessage) {
        const transformedMsg = transformMessage(newMessage, specialistId);
        
        // Replace optimistic message with real message from API
        setMessages(prev => prev.map(m => 
          m.id === optimisticMessage.id ? transformedMsg : m
        ));
      }
      
      setError(null);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message.');
      if (text === undefined) setInputValue(msgText); // Restore input on error if it came from state
    } finally {
      setIsSending(false);
      setIsUploading(false);
    }
  }, [inputValue, selectedChat]);


  // Select a chat
  const selectChat = useCallback((chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setSelectedChat(chat);
      // Reset unread count
      setChats(prev => prev.map(c => 
        c.id === chatId ? { ...c, unreadCount: 0 } : c
      ));
    }
  }, [chats]);

  // Session Management Actions
  const startSession = useCallback(async (appointmentId: string) => {
    try {
      setIsLoading(true);
      await startAppointmentSession(appointmentId);
      // Refresh chats to get updated session status
      await fetchUserChats();
      setError(null);
    } catch (err) {
      console.error('Error starting session:', err);
      setError('Failed to start session.');
    } finally {
      setIsLoading(false);
    }
  }, [fetchUserChats]);
// 🚀 Upgraded endSession functionality (No text message, smart redirect)
  const endSession = useCallback(async (appointmentId?: string, participantId?: string) => {
    // appointmentId may not have resolved yet on the open chat (it's populated by a
    // separate async lookup) — previously the caller silently did nothing in that
    // case. Fall back to localStorage, then a fresh lookup, before giving up.
    let targetId = appointmentId
      || selectedChatRef.current?.appointmentId
      || localStorage.getItem('activeAppointmentId')
      || undefined;

    if (!targetId && participantId) {
      try {
        const appointment = await getActiveAppointmentWith(participantId);
        targetId = appointment?.id;
      } catch (err) {
        console.warn('Could not resolve appointment to end:', err);
      }
    }

    if (!targetId) {
      toast.error('Could not find an active session to end. Please refresh and try again.');
      return;
    }

    try {
      setIsLoading(true);

      // 1. Hit the backend endpoint to officially close the session (Removed sendMessage)
      await endAppointmentSession(targetId);

      // 2. Clear the active session data from local storage
      localStorage.removeItem('activeChatId');
      localStorage.removeItem('activeAppointmentId');

      // 3. Notify the specialist
      toast.success('Session ended successfully.');

      // 4. Instantly redirect back to the dashboard's clinical queue
      router.push('/dashboard');

    } catch (err) {
      console.error('Error ending session:', err);
      // If it fails, it's likely because the session is ALREADY ended in the database.
      // Clear the local state and route to dashboard anyway to unstick the user.
      localStorage.removeItem('activeChatId');
      localStorage.removeItem('activeAppointmentId');
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const extendSession = useCallback(async (appointmentId?: string, participantId?: string) => {
    let targetId = appointmentId
      || selectedChatRef.current?.appointmentId
      || localStorage.getItem('activeAppointmentId')
      || undefined;

    if (!targetId && participantId) {
      try {
        const appointment = await getActiveAppointmentWith(participantId);
        targetId = appointment?.id;
      } catch (err) {
        console.warn('Could not resolve appointment to extend:', err);
      }
    }

    if (!targetId) {
      toast.error('Could not find an active session to extend. Please refresh and try again.');
      return;
    }

    try {
      setIsLoading(true);
      await extendAppointmentSession(targetId);
      // Refresh chats
      await fetchUserChats();
      setError(null);
    } catch (err) {
      console.error('Error extending session:', err);
      setError('Failed to extend session.');
    } finally {
      setIsLoading(false);
    }
  }, [fetchUserChats]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    chats,
    selectedChat,
    messages,
    inputValue,
    setInputValue,
    isLoading,
    isSending,
    isUploading,
    error,
    isConnected,
    isJoiningMeet,
    scrollRef,
    
    // Actions
    fetchUserChats,
    fetchChatMessages,
    sendMessage,
    selectChat,
    setSelectedChat,
    clearError,
    socket,

    // Session Actions
    startSession,
    endSession,
    extendSession,
    currentMeetLink,
    setCurrentMeetLink,
    handleCreateOrJoinMeet: async () => {
      const currentChat = selectedChatRef.current;
      if (!currentChat) {
        toast.error('Please select a conversation first.');
        return;
      }

      setIsJoiningMeet(true);
      try {
        const { createMeetForAppointment } = await import('@/lib/api-client');
        // createMeetForAppointment: if a link already exists, it returns the existing one.
        // If not, it creates a new one and broadcasts to both parties.
        const result = await createMeetForAppointment(currentChat.participantId);
        if (result?.meetLink) {
          setCurrentMeetLink(result.meetLink);
          toast.success('Google Meet link generated! Joining now...');
          window.open(result.meetLink, '_blank');
        } else {
          toast.error('Could not generate meeting link. Please check if the Google Meet API is enabled.');
        }
      } catch (err: any) {
        console.error('Meet Error:', err);
        const msg = err?.message || 'Error creating/joining the meeting.';
        toast.error(msg);
      } finally {
        setIsJoiningMeet(false);
      }
    },
  };
}