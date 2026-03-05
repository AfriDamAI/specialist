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
} from '@/lib/api-client';
import { useCall, CallType, IncomingCallData } from './useCall';

// Re-export types for convenience
export type { CallType, IncomingCallData };

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

// Helper to check if a message is a system/confirmation message that shouldn't be displayed
const isSystemConfirmationMessage = (msg: ApiMessage | any): boolean => {
  // Check type field
  if (msg.type === 'SYSTEM') return true;
  // Check message content for common confirmation phrases
  const messageText = msg.message || msg.text || '';
  const confirmationPhrases = ['sent successfully', 'message sent', 'delivered successfully'];
  return confirmationPhrases.some(phrase => 
    messageText.toLowerCase().includes(phrase.toLowerCase())
  );
};

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
  
  // Call states
  const [incomingCallData, setIncomingCallData] = useState<IncomingCallData | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

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

  // Initialize call hook
  const {
    callState,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
  } = useCall({
    socket,
    currentUserId: getSpecialistId(),
    onIncomingCall: (data) => {
      setIncomingCallData(data);
    },
    onRemoteStream: (stream) => {
      setRemoteStream(stream);
    },
    onLocalStream: (stream) => {
      setLocalStream(stream);
    },
    onCallEnded: () => {
      setIncomingCallData(null);
      setLocalStream(null);
      setRemoteStream(null);
    },
  });

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
    } else {
      setMessages([]);
    }
  }, [selectedChat]);

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
      
      // Skip system/confirmation messages (e.g., "Message sent successfully")
      if (isSystemConfirmationMessage(msg)) {
        console.log('Skipping system confirmation message:', (msg as any).message);
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
      
      // Handle API response - data might be in resultData or directly in response
      const userChats = response?.resultData || response?.data || response || [];
      const specialistId = getSpecialistId();

      //console.log("chh", userChats)
      
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
          participantName: chat.participant2Id.slice(0, 8), // Show truncated ID as name
          participantAvatar: undefined,
          lastMessage: lastMsg,
          unreadCount,
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
      
      // Skip if API returns a system/confirmation message (e.g., "Message sent successfully")
      if (isSystemConfirmationMessage(newMessage)) {
        // Keep the optimistic message in place, just clear the error state
        console.log('Skipping system confirmation from API:', (newMessage as any).message);
        setError(null);
        return;
      }
      
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

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Call handlers
  const handleStartCall = useCallback(async (type: CallType) => {
    if (!selectedChat || !type) return;
    
    const specialistId = getSpecialistId();
    const patientId = selectedChat.participantId;
    
    try {
      await startCall(patientId, selectedChat.id, type);
    } catch (err) {
      console.error('Failed to start call:', err);
      setError('Failed to start call. Please check your camera/microphone permissions.');
    }
  }, [selectedChat, startCall]);

  const handleAcceptCall = useCallback(async () => {
    if (!incomingCallData) return;
    
    try {
      await acceptCall(incomingCallData);
      setIncomingCallData(null);
    } catch (err) {
      console.error('Failed to accept call:', err);
      setError('Failed to accept call.');
    }
  }, [incomingCallData, acceptCall]);

  const handleRejectCall = useCallback(() => {
    if (!incomingCallData) return;
    
    rejectCall(incomingCallData.from, incomingCallData.chatId);
    setIncomingCallData(null);
  }, [incomingCallData, rejectCall]);

  const handleEndCall = useCallback(() => {
    if (callState.remoteUserId && callState.chatId) {
      endCall(callState.remoteUserId, callState.chatId);
    }
    setLocalStream(null);
    setRemoteStream(null);
  }, [callState.remoteUserId, callState.chatId, endCall]);

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
    
    // Call state and actions
    isCallActive: callState.isActive,
    callType: callState.type,
    incomingCallData,
    localStream,
    remoteStream,
    handleStartCall,
    handleAcceptCall,
    handleRejectCall,
    handleEndCall,
    toggleMute,
    toggleVideo,
  };
}
