'use client';

import { useState, useCallback, useEffect } from 'react';
import { Patient, Message } from '../types/chat';
import { apiClient } from '@/lib/api-client';
import { SPECIALIST_ID } from '@/lib/config';
import { useSocket } from './useSocket';

export function useChat(chatId?: string) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | undefined>(chatId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [sessionEnded, setSessionEnded] = useState(false);
  
  // Use socket for real-time messaging
  const { isConnected, listen, emit } = useSocket(activeChatId);

  // Listen for incoming messages
  useEffect(() => {
    if (activeChatId && isConnected) {
      listen('message', (data) => {
        const newMessage: Message = {
          id: Date.now().toString(),
          sender: data.senderId === SPECIALIST_ID ? 'doctor' : 'patient',
          text: data.content,
          timestamp: new Date(data.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: false,
        };
        setMessages(prev => [...prev, newMessage]);
      });
    }
  }, [activeChatId, isConnected, listen]);

  // Fetch patients on mount
  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setPatientsLoading(true);
    try {
      const response = await apiClient('/chats/patients');
      // Handle both direct data and wrapped response format
      const patientsData = response?.data || response?.resultData || response;
      if (patientsData && Array.isArray(patientsData)) {
        const fetchedPatients: Patient[] = patientsData.map((patient: any) => ({
          id: patient.id || patient.patientId,
          name: patient.name || patient.patientName,
          avatar: patient.avatar,
          status: patient.status || (patient.isOnline ? 'online' : 'offline'),
          lastMessage: patient.lastMessage,
          lastMessageTime: patient.lastMessageTime 
            ? new Date(patient.lastMessageTime).toLocaleString() 
            : undefined,
          unreadCount: patient.unreadCount || 0,
          sessionActive: patient.sessionActive ?? true,
        }));
        setPatients(fetchedPatients);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      setPatients([]);
    } finally {
      setPatientsLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!activeChatId) return;
    setIsLoading(true);
    try {
      const response = await apiClient(`/chats/${activeChatId}/messages`);
      // Handle both direct data and wrapped response format
      const messagesData = response?.data || response?.resultData || response;
      if (messagesData && Array.isArray(messagesData)) {
        const fetchedMessages: Message[] = messagesData.map((msg: any) => ({
          id: msg.id,
          sender: (msg.senderId === SPECIALIST_ID ? 'doctor' : 'patient') as 'doctor' | 'patient',
          text: msg.message,
          timestamp: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: msg.read || false,
        }));
        setMessages(fetchedMessages);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  const selectPatient = useCallback((patientId: string) => {
    setSelectedPatientId(patientId);
    const patient = patients.find(p => p.id === patientId);
    
    // Set the active chat ID for the selected patient
    if (patient) {
      setActiveChatId(patientId);
      setSessionEnded(!patient.sessionActive);
    }
    setInputValue('');
    
    // Fetch messages for this patient
    fetchMessagesForPatient(patientId);
  }, [patients]);

  const fetchMessagesForPatient = async (patientId: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient(`/chats/${patientId}/messages`);
      // Handle both direct data and wrapped response format
      const messagesData = response?.data || response?.resultData || response;
      if (messagesData && Array.isArray(messagesData)) {
        const fetchedMessages: Message[] = messagesData.map((msg: any) => ({
          id: msg.id,
          sender: (msg.senderId === SPECIALIST_ID ? 'doctor' : 'patient') as 'doctor' | 'patient',
          text: msg.message,
          timestamp: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: msg.read || false,
        }));
        setMessages(fetchedMessages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !activeChatId || sessionEnded) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'doctor',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: true,
    };

    // Optimistically add message to UI
    setMessages(prev => [...prev, newMessage]);
    setInputValue('');

    try {
      // Send via API
      await apiClient('/chat/message', {
        method: 'POST',
        body: JSON.stringify({
          chatId: activeChatId,
          senderId: SPECIALIST_ID,
          message: text.trim(),
          type: 'text',
        }),
      });

      // Also emit via socket for real-time
      emit('message', {
        content: text.trim(),
        senderId: SPECIALIST_ID,
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [activeChatId, sessionEnded, emit]);

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
    patientsLoading,
    selectedPatient,
    selectedPatientId,
    activeChatId,
    setActiveChatId,
    messages,
    inputValue,
    setInputValue,
    isLoading,
    sessionEnded,
    isConnected,
    selectPatient,
    sendMessage,
    endSession,
    refetchPatients: fetchPatients,
  };
}
