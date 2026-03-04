'use client';

import { useChat, ChatMessage } from '../hooks/useChat';
import PatientList from './PatientList';
import ConversationView from './ConversationView';
import { Patient } from '../types/chat';

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
    scrollRef,
    sendMessage,
    handleFileUpload,
    selectChat,
    clearError,
  } = useChat(chatId);

  // Transform chat list item to patient for the UI
  const patients: Patient[] = chats.map(chat => ({
    id: chat.participantId,
    name: chat.participantName,
    avatar: chat.participantAvatar,
    status: chat.unreadCount > 0 ? 'online' : 'offline',
    lastMessage: chat.lastMessage?.text,
    lastMessageTime: chat.lastMessage?.timestamp,
    unreadCount: chat.unreadCount,
    sessionActive: true,
  }));

  // Transform selected chat to patient
  const selectedPatient = selectedChat ? {
    id: selectedChat.participantId,
    name: selectedChat.participantName,
    avatar: selectedChat.participantAvatar,
    status: (selectedChat.unreadCount > 0 ? 'online' : 'offline') as 'online' | 'offline' | 'session-ended',
    lastMessage: selectedChat.lastMessage?.text,
    lastMessageTime: selectedChat.lastMessage?.timestamp,
    unreadCount: selectedChat.unreadCount,
    sessionActive: true,
  } : null;

  // Transform messages to UI format
  const uiMessages: import('../types/chat').Message[] = messages.map((msg: ChatMessage) => ({
    id: msg.id,
    sender: msg.sender,
    text: msg.text,
    timestamp: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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

  const handleSend = () => {
    sendMessage();
  };

  const handleFileSelect = (file: File) => {
    handleFileUpload(file);
  };

  if (isLoading && chats.length === 0) {
    return (
      <div className="flex h-[calc(100vh-11rem)] bg-white dark:bg-gray-950 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center justify-center w-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF7A59]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-11rem)] bg-white dark:bg-gray-950 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm">
      <PatientList
        patients={patients}
        selectedPatientId={selectedChat?.participantId || null}
        onSelectPatient={(patientId) => {
          const chat = chats.find(c => c.participantId === patientId);
          if (chat) selectChat(chat.id);
        }}
      />
      <ConversationView
        patient={selectedPatient}
        messages={uiMessages}
        inputValue={inputValue}
        sessionEnded={false}
        isLoading={isLoading}
        isConnected={isConnected}
        onInputChange={setInputValue}
        onSend={handleSend}
        onEndSession={() => { }}
        onFileUpload={handleFileSelect}
        isSending={isSending}
        isUploading={isUploading}
        error={error}
        onClearError={clearError}
        chatId={selectedChat?.id}
      />
    </div>
  );
}
