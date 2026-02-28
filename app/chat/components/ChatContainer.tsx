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
    patientsLoading,
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

  if (patientsLoading) {
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
