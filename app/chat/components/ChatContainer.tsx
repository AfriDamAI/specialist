'use client';

import { useChat } from '../hooks/useChat';
import PatientList from './PatientList';
import ConversationView from './ConversationView';

export default function ChatContainer() {
  const {
    patients,
    selectedPatient,
    selectedPatientId,
    messages,
    inputValue,
    setInputValue,
    sessionEnded,
    selectPatient,
    sendMessage,
    endSession,
  } = useChat();

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
        onInputChange={setInputValue}
        onSend={() => sendMessage(inputValue)}
        onEndSession={endSession}
      />
    </div>
  );
}
