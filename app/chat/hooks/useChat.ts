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
} from '@/lib/api-client';
import { SPECIALIST_ID } from '@/lib/config';

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
const transformMessage = (msg: ApiMessage, currentUserId: string): ChatMessage => ({
  id: msg.id,
  chatId: msg.chatId,
  senderId: msg.senderId,
  sender: msg.senderId === currentUserId ? 'doctor' : 'patient',
  text: msg.message || '',
  type: msg.type,
  attachmentUrl: msg.attachmentUrl,
  mimeType: msg.mimeType,
  fileSize: msg.fileSize,
  duration: msg.duration,
  read: msg.read || false,
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
      const transformedMsg = transformMessage(msg, SPECIALIST_ID);
      
      if (selectedChat && msg.chatId === selectedChat.id) {
        setMessages(prev => {
          // Avoid duplicates
          if (prev.find(m => m.id === msg.id)) return prev;
          return [...prev, transformedMsg];
        });
        // Mark as read
        markMessageAsRead(msg.id).catch(console.error);
      }
      
      // Update chat list with last message
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

  // Fetch all user chats
  const fetchUserChats = useCallback(async () => {
    try {
      setIsLoading(true);
      const userChats = await getCurrentUserChats();
      
      // Transform chats to chat list items
      const chatListItems: ChatListItem[] = userChats.map((chat: Chat) => {
        // Determine which participant is the patient (not the current specialist)
        const patientParticipant = chat.participants?.find(p => p.id !== SPECIALIST_ID);
        const lastMsg = chat.lastMessage ? transformMessage(chat.lastMessage as ApiMessage, SPECIALIST_ID) : undefined;
        
        return {
          id: chat.id,
          participantId: patientParticipant?.id || chat.participant2Id,
          participantName: patientParticipant?.name || 'Unknown Patient',
          participantAvatar: patientParticipant?.avatar,
          lastMessage: lastMsg,
          unreadCount: chat.unreadCount || 0,
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
      const chatMessages = await getChatMessages(chatId);
      const transformedMessages = chatMessages.map((msg: ApiMessage) => transformMessage(msg, SPECIALIST_ID));
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

    setIsSending(true);
    setInputValue('');

    try {
      const newMessage = await sendUserChatMessage(
        selectedChat.id,
        SPECIALIST_ID,
        msgText,
        'TEXT'
      );
      
      const transformedMsg = transformMessage(newMessage, SPECIALIST_ID);
      
      // Add to messages if not already there (for optimistic updates)
      setMessages(prev => {
        if (prev.find(m => m.id === transformedMsg.id)) return prev;
        return [...prev, transformedMsg];
      });
      
      setError(null);
    } catch (err) {
      console.error('Error sending message:', err);
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
        SPECIALIST_ID,
        '',
        type,
        metadata.url,
        metadata.mimeType,
        metadata.size,
        metadata.duration
      );
      
      const transformedMsg = transformMessage(newMessage, SPECIALIST_ID);
      
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
  };
}
