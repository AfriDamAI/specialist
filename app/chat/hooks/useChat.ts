'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useSocket } from '@/hooks/use-socket';
import {
  getCurrentUserChats,
  getChatMessages,
  sendUserChatMessage,
  uploadFile,
  markMessageAsRead,
  Chat,
  Message as ApiMessage,
  Message,
  startAppointmentSession,
  endAppointmentSession,
  extendAppointmentSession,
  getAppointmentById,
} from '@/lib/api-client';

// Get specialistId from localStorage or fallback to config
const getSpecialistId = (): string => {
  if (typeof window !== 'undefined') {
    const storedSpecialistId = localStorage.getItem('specialistId');
    if (storedSpecialistId) {
      return storedSpecialistId;
    }
  }
  // Fallback to config value
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
}

export function useChat(initialChatId?: string) {
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatListItem | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Use socket for real-time messaging
  const { socket, isConnected: socketConnected } = useSocket(
    typeof window !== 'undefined' 
      ? (process.env.NEXT_PUBLIC_SOCKET_URL || 'https://afridam-backend-prod-107032494605.us-central1.run.app')
      : ''
  );

  // Update connection status
  useEffect(() => {
    setIsConnected(socketConnected);
  }, [socketConnected]);

  // Fetch user's chats on mount
  useEffect(() => {
    fetchUserChats();
  }, []);

  // Handle initial chatId from props
  useEffect(() => {
    if (initialChatId && chats.length > 0) {
      const chat = chats.find(c => c.id === initialChatId);
      if (chat) {
        setSelectedChat(chat);
      }
    }
  }, [initialChatId, chats]);

  // Auto-select first chat if none selected
  useEffect(() => {
    if (chats.length > 0 && !selectedChat) {
      setSelectedChat(chats[0]);
    }
  }, [chats, selectedChat]);

  // Fetch messages when chat is selected
  useEffect(() => {
    if (selectedChat) {
      fetchChatMessages(selectedChat.id);
      
      // Also fetch appointment status if we have an appointmentId
      if (selectedChat.appointmentId) {
        fetchAppointmentStatus(selectedChat.appointmentId);
      }
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
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg: ApiMessage) => {
      const specialistId = getSpecialistId();
      
      // Skip SYSTEM messages (confirmation messages like "message sent successful")
      if ((msg as any).type === 'SYSTEM') {
        return;
      }
      
      const transformedMsg = transformMessage(msg, specialistId);
      
      // Skip if message is from current user (already added optimistically)
      if (msg.senderId === specialistId) {
        return;
      }
      
      if (selectedChat && msg.chatId === selectedChat.id) {
        setMessages(prev => {
          // Avoid duplicates
          if (prev.find(m => m.id === msg.id)) return prev;
          return [...prev, transformedMsg];
        });
        // Mark as read
        markMessageAsRead(msg.id).catch(console.error);
      }
      
      // Update chat list with last message (only for patient messages)
      setChats(prev => prev.map(chat => 
        chat.id === msg.chatId 
          ? { ...chat, lastMessage: transformedMsg, unreadCount: chat.unreadCount + 1 }
          : chat
      ));
    };

    socket.on('newMessage', handleNewMessage);

    return () => {
      socket.off('newMessage', handleNewMessage);
    };
  }, [socket, selectedChat]);

  //console.log("chatt", chats)

  // Fetch all user chats
  const fetchUserChats = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getCurrentUserChats() as any;
      console.log('DEBUG: getCurrentUserChats response:', response);
      
      // Handle API response - data might be in resultData or directly in response
      const userChats = response?.resultData || response?.data || response || [];
      const specialistId = getSpecialistId();

      console.log('DEBUG: userChats array:', userChats);
      
      // Ensure we have an array before mapping
      if (!Array.isArray(userChats)) {
        console.warn('Unexpected response format:', response);
        setChats([]);
        setError(null);
        setIsLoading(false);
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
        
        return {
          id: chat.id,
          participantId: chat.participant2Id, // patientId
          participantName: participantName,
          participantAvatar: patient?.avatar,
          lastMessage: lastMsg,
          unreadCount,
          sessionActive: (chat as any).sessionActive ?? false,
          appointmentId: (chat as any).appointmentId || (typeof window !== 'undefined' && localStorage.getItem('patientId') === chat.participant2Id ? localStorage.getItem('activeAppointmentId') || undefined : undefined),
          appointmentStatus: (chat as any).appointmentStatus,
        };
      });
      
      setChats(chatListItems);
      setError(null);
    } catch (err) {
      console.error('Error fetching chats:', err);
      setError('Failed to fetch chats.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch messages for a specific chat
  const fetchChatMessages = useCallback(async (chatId: string) => {
    try {
      setIsLoading(true);
      const response = await getChatMessages(chatId) as any;
      
      // Handle API response - data might be in resultData or directly in response
      const chatMessages = response?.resultData || response?.data || response || [];

      // Ensure we have an array before mapping
      if (!Array.isArray(chatMessages)) {
        console.warn('Unexpected messages response:', response);
        setMessages([]);
        setError(null);
        setIsLoading(false);
        return;
      }
      
      const transformedMessages = chatMessages.map((msg: ApiMessage) => transformMessage(msg, getSpecialistId()));
      setMessages(transformedMessages);
      setError(null);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to fetch messages.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch real-time appointment status to ensure session controls are accurate
  const fetchAppointmentStatus = useCallback(async (appointmentId: string) => {
    try {
      const appointment = await getAppointmentById(appointmentId);
      if (appointment) {
        const sessionActive = appointment.status === 'IN_PROGRESS';
        
        // Update the chats list
        setChats(prev => prev.map(chat => 
          chat.appointmentId === appointmentId 
            ? { ...chat, appointmentStatus: appointment.status, sessionActive } 
            : chat
        ));

        // Update selected chat if it's the same one
        setSelectedChat(prev => {
          if (prev?.appointmentId === appointmentId) {
            return { ...prev, appointmentStatus: appointment.status, sessionActive };
          }
          return prev;
        });
      }
    } catch (err) {
      console.warn('Could not enrich chat with appointment status:', err);
    }
  }, []);

  // Send a text message
  const sendMessage = useCallback(async (text?: string) => {
    const msgText = text || inputValue;
    if (!msgText.trim() || !selectedChat) return;

    const specialistId = getSpecialistId();
    
    // Create optimistic message object
    const optimisticMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      chatId: selectedChat.id,
      senderId: specialistId,
      sender: 'doctor',
      text: msgText,
      type: 'TEXT',
      read: true,
      timestamp: new Date().toISOString(),
    };
    
    // Add message instantly to UI (optimistic update)
    setMessages(prev => [...prev, optimisticMessage]);
    
    setIsSending(true);
    setInputValue('');

    try {
      const newMessage = await sendUserChatMessage(
        selectedChat.id,
        specialistId,
        msgText,
        'TEXT'
      );
      
      const transformedMsg = transformMessage(newMessage, specialistId);
      
      // Replace optimistic message with real message from API
      setMessages(prev => prev.map(m => 
        m.id === optimisticMessage.id ? transformedMsg : m
      ));
      
      setError(null);
    } catch (err) {
      console.error('Error sending message:', err);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
      setError('Failed to send message.');
      setInputValue(msgText); // Restore input on error
    } finally {
      setIsSending(false);
    }
  }, [inputValue, selectedChat]);

  // Send a file/media message
  const sendMediaMessage = useCallback(async (
    type: 'IMAGE' | 'VIDEO' | 'AUDIO',
    metadata: { url: string; mimeType: string; size: number; duration?: number }
  ) => {
    if (!selectedChat) return;

    setIsUploading(true);

    try {
      const newMessage = await sendUserChatMessage(
        selectedChat.id,
        getSpecialistId(),
        '',
        type,
        metadata.url,
        metadata.mimeType,
        metadata.size,
        metadata.duration
      );
      
      const transformedMsg = transformMessage(newMessage, getSpecialistId());
      
      setMessages(prev => {
        if (prev.find(m => m.id === transformedMsg.id)) return prev;
        return [...prev, transformedMsg];
      });
      
      setError(null);
    } catch (err) {
      console.error('Error sending media:', err);
      setError('Failed to send media.');
    } finally {
      setIsUploading(false);
    }
  }, [selectedChat]);

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    if (!selectedChat) return;

    setIsUploading(true);
    try {
      const { url, mimeType, size } = await uploadFile(file);
      
      let type: 'IMAGE' | 'VIDEO' | 'AUDIO' = 'IMAGE';
      if (mimeType.startsWith('video/')) type = 'VIDEO';
      if (mimeType.startsWith('audio/')) type = 'AUDIO';

      await sendMediaMessage(type, { url, mimeType, size });
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Failed to upload file.');
    } finally {
      setIsUploading(false);
    }
  }, [selectedChat, sendMediaMessage]);

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

  const endSession = useCallback(async (appointmentId: string) => {
    try {
      setIsLoading(true);
      await endAppointmentSession(appointmentId);
      // Refresh chats
      await fetchUserChats();
      setError(null);
    } catch (err) {
      console.error('Error ending session:', err);
      setError('Failed to end session.');
    } finally {
      setIsLoading(false);
    }
  }, [fetchUserChats]);

  const extendSession = useCallback(async (appointmentId: string) => {
    try {
      setIsLoading(true);
      await extendAppointmentSession(appointmentId);
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
    scrollRef,
    
    // Actions
    fetchUserChats,
    fetchChatMessages,
    sendMessage,
    sendMediaMessage,
    handleFileUpload,
    selectChat,
    setSelectedChat,
    clearError,
    socket,

    // Session Actions
    startSession,
    endSession,
    extendSession,
  };
}
