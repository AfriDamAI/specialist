'use client';

import { useChat } from '../hooks/useChat';
import PatientList from './PatientList';
import ConversationView from './ConversationView';

interface ChatContainerProps {
  chatId?: string;
}

export default function ChatContainer({ chatId }: ChatContainerProps) {
  const {
    patients,
    selectedPatient,
    selectedPatientId,
    messages,
    inputValue,
    setInputValue,
    sessionEnded,
    isLoading,
    isConnected,
    selectPatient,
    sendMessage,
    endSession,
  } = useChat(chatId);

  return (
    <div className="flex h-[calc(100vh-11rem)] bg-white dark:bg-gray-950 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm">
      <PatientList
        patients={patients}
        selectedPatientId={selectedPatientId}
        onSelectPatient={selectPatient}
      />
      <ConversationView
        patient={selectedPatient || null}
        messages={messages}
        inputValue={inputValue}
        sessionEnded={sessionEnded}
        isLoading={isLoading}
        isConnected={isConnected}
        onInputChange={setInputValue}
        onSend={() => sendMessage(inputValue)}
        onEndSession={endSession}
      />
    </div>
  );
}
