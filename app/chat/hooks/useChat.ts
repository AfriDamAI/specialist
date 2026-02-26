'use client';

import { useState, useCallback } from 'react';
import { Patient, Message } from '../types/chat';

// Mock data for demonstration
const mockPatients: Patient[] = [
  {
    id: '1',
    name: 'John Doe',
    status: 'online',
    lastMessage: 'Thank you doctor!',
    lastMessageTime: '2 min ago',
    unreadCount: 2,
    sessionActive: true,
  },
  {
    id: '2',
    name: 'Sarah Wilson',
    status: 'offline',
    lastMessage: 'When should I take the medication?',
    lastMessageTime: '1 hour ago',
    unreadCount: 0,
    sessionActive: true,
  },
  {
    id: '3',
    name: 'Michael Brown',
    status: 'session-ended',
    lastMessage: 'Session ended',
    lastMessageTime: 'Yesterday',
    unreadCount: 0,
    sessionActive: false,
  },
  {
    id: '4',
    name: 'Emily Davis',
    status: 'online',
    lastMessage: 'I have a question about the prescription',
    lastMessageTime: '30 min ago',
    unreadCount: 1,
    sessionActive: true,
  },
];

const mockMessages: Record<string, Message[]> = {
  '1': [
    { id: '1', sender: 'patient', text: 'Hello doctor, I need to discuss my test results.', timestamp: '10:00 AM', read: true },
    { id: '2', sender: 'doctor', text: 'Of course, let me pull up your records.', timestamp: '10:02 AM', read: true },
    { id: '3', sender: 'patient', text: 'Thank you doctor!', timestamp: '10:05 AM', read: false },
  ],
  '2': [
    { id: '1', sender: 'patient', text: 'Hi, I have a follow-up question.', timestamp: '9:00 AM', read: true },
    { id: '2', sender: 'doctor', text: 'Sure, how can I help?', timestamp: '9:05 AM', read: true },
    { id: '3', sender: 'patient', text: 'When should I take the medication?', timestamp: '9:10 AM', read: true },
  ],
  '3': [
    { id: '1', sender: 'patient', text: 'Goodbye doctor, thank you for the consultation.', timestamp: 'Yesterday', read: true },
    { id: '2', sender: 'doctor', text: 'You\'re welcome. Take care!', timestamp: 'Yesterday', read: true },
  ],
  '4': [
    { id: '1', sender: 'patient', text: 'Doctor, I have a question about the prescription.', timestamp: '9:30 AM', read: false },
  ],
};

export function useChat() {
  const [patients] = useState<Patient[]>(mockPatients);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  const selectPatient = useCallback((patientId: string) => {
    setSelectedPatientId(patientId);
    setMessages(mockMessages[patientId] || []);
    setSessionEnded(!patients.find(p => p.id === patientId)?.sessionActive);
    setInputValue('');
  }, [patients]);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim() || !selectedPatientId || sessionEnded) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'doctor',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: true,
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
  }, [selectedPatientId, sessionEnded]);

  const endSession = useCallback(() => {
    setSessionEnded(true);
    if (selectedPatientId) {
      // Update patient status in the list
      const updatedPatients = patients.map(p =>
        p.id === selectedPatientId ? { ...p, sessionActive: false, status: 'session-ended' as const } : p
      );
    }
  }, [selectedPatientId, patients]);

  return {
    patients,
    selectedPatient,
    selectedPatientId,
    messages,
    inputValue,
    setInputValue,
    isLoading,
    sessionEnded,
    selectPatient,
    sendMessage,
    endSession,
  };
}
