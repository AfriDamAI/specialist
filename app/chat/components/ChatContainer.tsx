'use client';

import { useChat, ChatMessage } from '../hooks/useChat';
import { useState, useEffect } from 'react';
import PatientList from './PatientList';
import ConversationView from './ConversationView';
import { Patient, PatientProfile } from '../types/chat';
import PatientProfileModal from '@/components/PatientProfileModal';

interface ChatContainerProps {
  chatId?: string;
}

export default function ChatContainer({ chatId }: ChatContainerProps) {
  const {
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
    sendMessage,
    selectChat,
    setSelectedChat, // <-- We pull this directly from your hook now
    clearError,
    startSession,
    endSession,
    extendSession,
    currentMeetLink,
    handleCreateOrJoinMeet,
  } = useChat(chatId);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<PatientProfile | undefined>(undefined);
  const [selectedPatientName, setSelectedPatientName] = useState('');

  // Notify the parent page layout whenever mobile chat view toggles
  useEffect(() => {
    const event = new CustomEvent('mobile-chat-view-changed', {
      detail: { hasActiveChat: !!selectedChat }
    });
    window.dispatchEvent(event);
  }, [selectedChat]);

  const handleViewProfile = (profile: PatientProfile, name: string) => {
    setSelectedProfile(profile);
    setSelectedPatientName(name);
    setIsProfileModalOpen(true);
  };

  const patients: Patient[] = Array.from(
    chats.reduce((acc, chat) => {
      if (!acc.has(chat.participantId)) {
        acc.set(chat.participantId, {
          id: chat.participantId,
          name: chat.participantName,
          avatar: chat.participantAvatar,
          status: chat.unreadCount > 0 ? 'online' : 'offline',
          lastMessage: chat.lastMessage?.text,
          lastMessageTime: chat.lastMessage?.timestamp,
          unreadCount: chat.unreadCount,
          sessionActive: chat.sessionActive,
          profile: chat.profile,
        });
      } else {
        const existing = acc.get(chat.participantId)!;
        existing.unreadCount += chat.unreadCount;
        if (chat.unreadCount > 0) existing.status = 'online';
      }
      return acc;
    }, new Map<string, Patient>()).values()
  );

  const selectedPatient = selectedChat ? {
    id: selectedChat.participantId,
    name: selectedChat.participantName,
    avatar: selectedChat.participantAvatar,
    status: (selectedChat.unreadCount > 0 ? 'online' : 'offline') as 'online' | 'offline' | 'session-ended',
    lastMessage: selectedChat.lastMessage?.text,
    lastMessageTime: selectedChat.lastMessage?.timestamp,
    unreadCount: selectedChat.unreadCount,
    sessionActive: selectedChat.sessionActive,
    appointmentId: selectedChat.appointmentId,
    profile: selectedChat.profile,
  } : null;

  const uiMessages: import('../types/chat').Message[] = messages.map((msg: ChatMessage) => ({
    id: msg.id,
    sender: msg.sender,
    text: msg.text,
    timestamp: msg.timestamp,
    read: msg.read,
    attachment: msg.attachmentUrl ? {
      id: msg.id,
      name: msg.attachmentUrl.split('/').pop() || 'attachment',
      url: msg.attachmentUrl,
      type: msg.mimeType?.startsWith('image/') ? 'image'
        : msg.mimeType?.startsWith('video/') ? 'video'
          : msg.mimeType?.startsWith('audio/') ? 'audio'
            : 'document',
      size: msg.fileSize || 0,
    } : undefined,
  }));

  if (isLoading && chats.length === 0) {
    return (
      <div className="flex h-full md:h-[calc(100vh-11rem)] bg-white dark:bg-gray-950 md:rounded-3xl overflow-hidden md:border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center justify-center w-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF7A59]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full md:h-[calc(100vh-11rem)] bg-white dark:bg-gray-950 md:rounded-3xl overflow-hidden md:border border-gray-100 dark:border-gray-800 shadow-sm relative">
      
      {/* WhatsApp Patient List */}
      <div className={`h-full w-full md:w-80 lg:w-96 shrink-0 transition-all ${
        selectedChat ? 'hidden md:block' : 'block'
      }`}>
        <PatientList
          patients={patients}
          selectedPatientId={selectedChat?.participantId || null}
          onSelectPatient={(patientId) => {
            const chat = chats.find(c => c.participantId === patientId);
            if (chat) selectChat(chat.id);
          }}
        />
      </div>

      {/* WhatsApp Active Chat View */}
      <div className={`h-full w-full flex-1 transition-all ${
        selectedChat ? 'block' : 'hidden md:block'
      }`}>
        <ConversationView
          patient={selectedPatient}
          messages={uiMessages}
          inputValue={inputValue}
          sessionEnded={false}
          isLoading={isLoading}
          isConnected={isConnected}
          onInputChange={setInputValue}
          onSend={(text, file) => sendMessage(text, file)}
          onEndSession={() => selectedChat?.appointmentId && endSession(selectedChat.appointmentId)}
          onStartSession={() => selectedChat?.appointmentId && startSession(selectedChat.appointmentId)}
          onExtendSession={() => selectedChat?.appointmentId && extendSession(selectedChat.appointmentId)}
          onJoinMeet={handleCreateOrJoinMeet}
          meetLink={currentMeetLink}
          hasMeetLink={!!currentMeetLink}
          onViewProfile={() => selectedPatient?.profile && handleViewProfile(selectedPatient.profile, selectedPatient.name)}
          isJoiningMeet={isJoiningMeet}
          isSending={isSending}
          isUploading={isUploading}
          error={error}
          onClearError={clearError}
          chatId={selectedChat?.id}
          onBack={() => setSelectedChat(null)} // <-- FIXED: Directly sets it to null to successfully close the chat
        />
      </div>
      
      <PatientProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={selectedProfile}
        patientName={selectedPatientName}
      />
    </div>
  );
}